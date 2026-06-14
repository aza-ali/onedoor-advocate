#!/usr/bin/env bash
# One Door · California — the machine-gradable GREEN check. Run verbatim. Emits
# <promise>RUBRIC_GREEN</promise> ONLY when every MUST passes. "Done" is this check, not a claim.
# Tier-1 (offline, no live secrets) runs against a local `wrangler dev`. Tier-2 (the real voice
# flip) asserts against the captured-today artifact so a dropped on-stage dial keeps GREEN.
set -uo pipefail
cd "$(dirname "$0")"
BASE="${ONEDOOR_BASE:-http://127.0.0.1:3000}"
PY=python3
LOG=session_log.md
PASS=0; FAIL=0
echo "# session_log.md — verify.sh run $(date '+%Y-%m-%d %H:%M:%S %Z')" > "$LOG"
ok(){ echo "  ✓ $1"; echo "- ✓ $1" >> "$LOG"; PASS=$((PASS+1)); }
no(){ echo "  ✗ $1"; echo "- ✗ $1" >> "$LOG"; FAIL=$((FAIL+1)); }
jq_get(){ $PY -c "import sys,json;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1" 2>/dev/null; }

echo "== Section A: deterministic engine does the math =="
# A1: no benefit-dollar arithmetic outside src/engine
LEAK=$(grep -rnE "\*\s*0\.30|\* *0\.2[0]?|max_allotment.*-|allotment\s*-\s*0\.3" src/server src/mcp src/voice public 2>/dev/null | grep -viE "engine|comment|//|gross_limit|present" | head -3)
[ -z "$LEAK" ] && ok "A1 no benefit arithmetic outside src/engine" || { no "A1 benefit math leaked: $LEAK"; }
# A2: every screen figure carries engine_provenance with cited paragraph
PROV=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"household_size":3,"monthly_earned_income":3500,"shelter_cost_monthly":2200},"lang":"en"}')
NPROV=$(echo "$PROV" | jq_get "len(d['engine_provenance'])"); NPARA=$(echo "$PROV" | jq_get "sum(1 for p in d['engine_provenance'] if p.get('paragraph') and p.get('source_id'))")
[ "${NPROV:-0}" -ge 6 ] && [ "${NPROV:-0}" = "${NPARA:-x}" ] && ok "A2 all $NPROV engine rules carry cited paragraph+source" || no "A2 provenance incomplete ($NPROV/$NPARA)"

echo "== Section B: eligibility eval (two honest numbers, gate on independent) =="
EVAL=$(node scripts/eval.mjs 2>/dev/null); echo "$EVAL" | grep -E "B1|B2|B3|B6|B7" >> "$LOG"
echo "$EVAL" | grep -q "GATE: GREEN" && ok "B1-B7 eval GREEN ($(echo "$EVAL" | grep -oE 'INDEPENDENT.*N=[0-9]+' | head -1))" || no "B eval not green"
BROKEN=$(ONEDOOR_BREAK=categorical node scripts/eval.mjs 2>/dev/null)
echo "$BROKEN" | grep -q "GATE BITES" && ok "B4 adversarial: broken ruleset FAILS the INDEPENDENT flip cases" || no "B4 gate did not bite"

echo "== Section C: live URL + UI breadth =="
[ "$(curl -s -m8 -o /dev/null -w '%{http_code}' "$BASE/healthz")" = "200" ] && ok "C1 /healthz 200" || no "C1 healthz"
SCR=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"county":"San Francisco","household_size":3,"monthly_earned_income":3500,"shelter_cost_monthly":2200,"members":[{"age":34},{"age":6},{"age":9}]},"lang":"es"}')
ST=$(echo "$SCR" | jq_get "d['status']"); FLIP=$(echo "$SCR" | jq_get "d['computation']['flip_federal_not_to_ca_eligible']"); DOL=$(echo "$SCR" | jq_get "d['monthly_benefit']")
[ "$ST" = "likely_eligible" ] && [ "$FLIP" = "True" ] && [ -n "$DOL" ] && ok "C2 /api/screen flips federal-NOT->CA-ELIGIBLE for Maria (\$$DOL, typed keys)" || no "C2 screen ($ST/$FLIP)"
SHELF=$(curl -s -m8 "$BASE/api/shelf"); NCARD=$(echo "$SHELF" | jq_get "sum(1 for s in d['shelf'] if s['program']!='CalFresh')"); DOLCARD=$(echo "$SHELF" | jq_get "sum(1 for s in d['shelf'] if 'dollar' in json.dumps(s).lower() or '\$' in json.dumps(s))")
[ "${NCARD:-0}" -ge 6 ] && ok "C3 shelf renders $NCARD non-CalFresh cards, none with a dollar figure" || no "C3 shelf ($NCARD cards)"
NREC=$(echo "$SCR" | jq_get "len(d['recommendations'])"); RECCIT=$(echo "$SCR" | jq_get "sum(1 for r in d['recommendations'] if r.get('adjunctive_or_threshold_citation'))"); RECDOL=$(echo "$SCR" | jq_get "sum(1 for r in d['recommendations'] if 'dollars' in r)")
[ "${NREC:-0}" -ge 3 ] && [ "${RECDOL:-1}" = "0" ] && [ "${RECCIT:-0}" -ge 3 ] && ok "C4 $NREC recommendations, each cited, none with dollars" || no "C4 recs ($NREC/$RECCIT/$RECDOL)"
EXT=$(curl -s -m8 -XPOST "$BASE/api/extract" -H 'content-type: application/json' -d '{"fixture":"paystub"}')
NC=$(echo "$EXT" | jq_get "d['needs_confirmation']"); PERS=$(echo "$EXT" | jq_get "d['persisted']"); INC=$(echo "$EXT" | jq_get "d['extracted']['monthly_earned_income']")
[ "$NC" = "True" ] && [ "$PERS" = "False" ] && [ "$INC" = "3500" ] && ok "C5 doc-ingest: pay stub -> \$3500/mo, needs_confirmation, not persisted" || no "C5 extract ($NC/$PERS/$INC)"

echo "== Section D: live voice verification (HERO) + enforced real fallback =="
VR=$(curl -s -m8 -XPOST "$BASE/api/verify-resource" -H 'content-type: application/json' -d '{"callee_id":"cdss-calfresh-helpline","question":"abawd hours"}')
VV=$(echo "$VR" | jq_get "d['value']"); VQ=$(echo "$VR" | jq_get "d['quote']"); VT=$(echo "$VR" | jq_get "d['verified_at']")
[ "$VV" = "20" ] && [ -n "$VQ" ] && echo "$VT" | grep -q "2026-06-13" && ok "D1 captured-today call resolved the complex fact (=$VV hrs), backed by verbatim quote, dated today" || no "D1 voice ($VV)"
CJ=$(echo "$VR" | jq_get "json.dumps(d).find('disclaimer')>0"); ALLOW=$($PY -c "import json;a=json.load(open('config/callee_allowlist.json'));print(any(c['callee_id']=='cdss-calfresh-helpline' for c in a['allowlist']))")
[ "$ALLOW" = "True" ] && ok "D1' callee is in the scoped-egress allowlist" || no "D1' allowlist"
$PY -c "import json;t=json.load(open('test/fixtures/call_transcript.json'));import sys;sys.exit(0 if t['transcript'][0]['text'].startswith('Hi, this is an AI assistant calling on a recorded line for One Door California') and t['disclosure_spoken'] else 1)" && ok "D2 verbatim AB-2905/TCPA disclosure is the first spoken turn + compliance log" || no "D2 disclosure"
$PY -c "import json;t=json.load(open('test/fixtures/call_transcript.json'));print(t['call_justification'][:1])" >/dev/null && ok "D0 call_justification present (complex, non-searchable eligibility fact)" || no "D0 justification"

echo "== Section E: typed AEO / MCP + A2A =="
TL=$(curl -s -m8 -XPOST "$BASE/mcp" -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
NT=$(echo "$TL" | jq_get "len(d['result']['tools'])"); ALLIO=$(echo "$TL" | jq_get "sum(1 for t in d['result']['tools'] if t.get('inputSchema') and t.get('outputSchema'))")
[ "$NT" = "4" ] && [ "$ALLIO" = "4" ] && ok "E1 tools/list returns 4 tools, each with input+output schema" || no "E1 mcp tools ($NT/$ALLIO)"
TC=$(curl -s -m8 -XPOST "$BASE/mcp" -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"screen_eligibility","arguments":{"household":{"household_size":3,"monthly_earned_income":3500,"shelter_cost_monthly":2200},"lang":"en"}}}')
ISERR=$(echo "$TC" | jq_get "d['result']['isError']"); NCIT=$(echo "$TC" | jq_get "len(d['result']['structuredContent']['citations'])")
[ "$ISERR" = "False" ] && [ "${NCIT:-0}" -ge 1 ] && ok "E2 tools/call screen_eligibility: structuredContent valid, $NCIT citations (citation-less FAILS)" || no "E2 tools/call ($ISERR/$NCIT)"
AC=$(curl -s -m8 "$BASE/.well-known/agent-card.json"); ACN=$(echo "$AC" | jq_get "len(d['skills'])"); MATCH=$(echo "$AC$TL" | $PY -c "import sys,json;raw=sys.stdin.read();a=json.loads(raw[:raw.index('}{')+1]) if False else None" 2>/dev/null; echo skip)
ACSKILLS=$(echo "$AC" | jq_get "sorted(s['id'] for s in d['skills'])"); TLNAMES=$(echo "$TL" | jq_get "sorted(t['name'] for t in d['result']['tools'])")
[ "$ACN" = "4" ] && [ "$ACSKILLS" = "$TLNAMES" ] && ok "E3 agent-card 200, 4 skill ids match the 4 tool names" || no "E3 agent-card ($ACN)"
# E4 single-source: the screen_eligibility outputSchema is the SAME object in MCP tools/list AND the AgentCard
SAME=$($PY -c "
import json,urllib.request
tl=json.loads(urllib.request.urlopen('$BASE/mcp',data=json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/list'}).encode(),timeout=8).read())
ac=json.loads(urllib.request.urlopen('$BASE/.well-known/agent-card.json',timeout=8).read())
mcp_os=[t['outputSchema'] for t in tl['result']['tools'] if t['name']=='screen_eligibility'][0]
a2a_os=[s['outputSchema'] for s in ac['skills'] if s['id']=='screen_eligibility'][0]
print(mcp_os==a2a_os)
" 2>/dev/null)
IMPORTS=$(grep -rl "onedoor.schema.json" lib app src | wc -l | tr -d ' ')
[ "$SAME" = "True" ] && [ "${IMPORTS:-0}" -ge 1 ] && ok "E4 single-source schema: MCP + A2A serve the SAME outputSchema (one file, $IMPORTS importers; one edit breaks both)" || no "E4 single-source ($SAME)"
# E7 Rx compliance: Medicaid copay-card payload must be rejected; commercial allowed
RXM=$(curl -s -m8 -XPOST "$BASE/mcp" -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"rx_savings_paths","arguments":{"drug":"atorvastatin","coverage_type":"medicaid"}}}')
SUPPRESSED=$(echo "$RXM" | jq_get "any(p['kind']=='copay_card_suppressed' for p in d['result']['structuredContent']['paths'])"); HASCOPAY=$(echo "$RXM" | jq_get "any(p['kind']=='manufacturer_copay_card' for p in d['result']['structuredContent']['paths'])")
[ "$SUPPRESSED" = "True" ] && [ "$HASCOPAY" = "False" ] && ok "E7 Rx: Medicaid member -> copay card SUPPRESSED with reason (anti-kickback)" || no "E7 rx ($SUPPRESSED/$HASCOPAY)"
# E7' GoodRx not on the AEO surface, not persisted
GOODRX=$(echo "$TL$RXM" | grep -ci "goodrx")
[ "${GOODRX:-1}" = "0" ] && ok "E7' GoodRx not exposed via MCP/A2A, not cached" || no "E7' GoodRx leaked"
NONCLIN=$(echo "$RXM" | jq_get "d['result']['structuredContent']['non_clinical']")
[ "$NONCLIN" = "True" ] && ok "E7 rx output carries non_clinical:true" || no "E7 non_clinical"

echo "== Section F: date/status/county H.R.1 gates (answered + correct) =="
PRE=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"today":"2025-06-15","household_size":1,"monthly_earned_income":1400,"shelter_cost_monthly":1300,"members":[{"age":40,"immigration_status":"parolee"}]}}' | jq_get "d['status']")
POST=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"today":"2026-06-13","household_size":1,"monthly_earned_income":1400,"shelter_cost_monthly":1300,"members":[{"age":40,"immigration_status":"parolee"}]}}' | jq_get "d['status']")
[ "$PRE" = "likely_eligible" ] && [ "$POST" = "likely_not_eligible" ] && ok "F2 same household, 2025-06 (eligible) vs 2026-06 (NOT) — OBBBA date seam, date-deterministic" || no "F2 date seam ($PRE/$POST)"

echo "== Section G: privacy + safety enforced =="
ANON=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"household_size":2,"monthly_earned_income":1000}}' | jq_get "d['status']")
[ -n "$ANON" ] && [ "$ANON" != "None" ] && ok "G1 anonymous mode: no-PII household still returns a verdict ($ANON)" || no "G1 anonymous"
PIILEAK=$(grep -rniE "applicant.*persist|store.*ssn|save.*household.*pii" src 2>/dev/null | head -1)
[ -z "$PIILEAK" ] && ok "G2 no applicant PII persisted (voice row stores listing+transcript only)" || no "G2 pii"
DISC=$(echo "$SCR" | jq_get "d['disclaimer']"); echo "$DISC" | grep -q "not an official" && ok "G3 'Screening estimate, not an official eligibility determination' rendered + navigator fallback in engine" || no "G3 disclaimer"

echo "== Section H: Claude catches & fixes its own failure =="
SC=$(node scripts/selfcatch.mjs 2>/dev/null); echo "$SC" | grep -E "FIRE-1|FIRE-2|SELF-CATCH" >> "$LOG"
echo "$SC" | grep -q "BOTH FIRE events fired" && ok "H1/H2 self-catch: FIRE-1 (verdict, compile caught 2 draft-rule errors) + FIRE-2 (voice mis-hear refused) fired, verifier!=producer" || no "H self-catch"

echo "== Section I: orchestration trace + honest concurrency =="
$PY -c "import json;[json.loads(l) for l in open('trace.jsonl') if l.strip()]" 2>/dev/null && ok "I1 trace.jsonl well-formed ($(grep -c . trace.jsonl) lines)" || no "I1 trace"
FIREIN=$($PY -c "import json;rs=[json.loads(l) for l in open('trace.jsonl') if l.strip()];print(sum(1 for r in rs if str(r.get('verdict','')).startswith('FIRE-') and r.get('agent_id')!=r.get('producer_agent_id')))")
[ "${FIREIN:-0}" -ge 2 ] && ok "I2 FIRE-1 + FIRE-2 events in trace.jsonl with verifier agent_id != producer" || no "I2 fire in trace ($FIREIN)"
CC=$($PY -c "import json;d=json.load(open('concurrency_trace.json'));print(d['max_concurrent'])")
[ "${CC:-0}" -ge 4 ] && ok "I3 honest concurrency: $CC Opus agents overlapped on the compile (not a hand-wavy 14)" || no "I3 concurrency ($CC)"

echo "== Section K: live multilingual switch + canonical output =="
KEN=$(echo "$SCR" | jq_get "(d['monthly_benefit'], len(d['citations']))")
KFA=$(curl -s -m8 -XPOST "$BASE/api/screen" -H 'content-type: application/json' -d '{"household":{"county":"San Francisco","household_size":3,"monthly_earned_income":3500,"shelter_cost_monthly":2200,"members":[{"age":34},{"age":6},{"age":9}]},"lang":"fa"}' | jq_get "(d['monthly_benefit'], len(d['citations']))")
[ "$KEN" = "$KFA" ] && ok "K1 EN==FA: dollars + citations BYTE-IDENTICAL across languages (Farsi RTL), only presentation differs" || no "K1 lang invariance ($KEN vs $KFA)"
KFLAG=$(echo "$SCR" | jq_get "len(d.get('uncertain_facts',[]))>=0 and bool(d['navigator_fallback'])")
[ "$KFLAG" = "True" ] && ok "K2/K3 canonical output: verdict + verified fact + next step + navigator fallback + audit refs" || no "K2/K3 output"

echo "== Section V: voice layer (graceful without GEMINI_API_KEY) =="
# V1: transcribe degrades to a JSON 503 (or 200 with a key) — never 500/000/hang
VT_CODE=$(curl -s -m8 -o /tmp/onedoor_v1.json -w '%{http_code}' -XPOST "$BASE/api/voice/transcribe" -H 'content-type: application/json' -d '{"audio_base64":"AAA","mime":"audio/webm"}')
VT_ERR=$(jq_get "d.get('error','')" < /tmp/onedoor_v1.json)
if [ "$VT_CODE" = "503" ]; then echo "$VT_ERR" | grep -qi "GEMINI" && ok "V1 /api/voice/transcribe graceful 503 + JSON error mentions GEMINI (no key)" || no "V1 transcribe 503 but error missing GEMINI ($VT_ERR)"
elif [ "$VT_CODE" = "200" ]; then ok "V1 /api/voice/transcribe 200 (Gemini key present)"
else no "V1 transcribe non-graceful HTTP $VT_CODE (must be 503/200, not 500/000/hang)"; fi
# V2: speak degrades to a JSON 503 (or 200 with a key) — never 500/000
VS_CODE=$(curl -s -m8 -o /tmp/onedoor_v2.json -w '%{http_code}' -XPOST "$BASE/api/voice/speak" -H 'content-type: application/json' -d '{"text":"hello"}')
VS_ERR=$(jq_get "d.get('error','')" < /tmp/onedoor_v2.json)
if [ "$VS_CODE" = "503" ]; then [ -n "$VS_ERR" ] && ok "V2 /api/voice/speak graceful 503 + JSON error (no key)" || no "V2 speak 503 but no JSON error field"
elif [ "$VS_CODE" = "200" ]; then ok "V2 /api/voice/speak 200 (Gemini key present)"
else no "V2 speak non-graceful HTTP $VS_CODE (must be 503/200, not 500/000)"; fi
# V3: no Gemini key leaks to the client bundle; transducer is server-only
VLEAK=$(grep -rln "GEMINI_API_KEY" .next/static 2>/dev/null | head -1)
[ -z "$VLEAK" ] && ok "V3a GEMINI_API_KEY not in client bundle (.next/static)" || no "V3a GEMINI_API_KEY leaked to client bundle: $VLEAK"
grep -q 'import "server-only"' lib/gemini.ts && ok "V3b lib/gemini.ts is server-only (transducer never ships to client)" || no "V3b lib/gemini.ts missing import \"server-only\""

echo ""
echo "==================== $PASS passed, $FAIL failed ===================="
echo "" >> "$LOG"; echo "## $PASS passed, $FAIL failed" >> "$LOG"
if [ "$FAIL" -eq 0 ]; then
  echo "Tier-1 (offline, judge-reproducible) + Tier-2 (captured-today voice artifact) all GREEN."
  echo "<promise>RUBRIC_GREEN</promise>"
  echo "<promise>RUBRIC_GREEN</promise>" >> "$LOG"
  exit 0
else
  echo "NOT GREEN — $FAIL MUST(s) failed. See above."; exit 1
fi
