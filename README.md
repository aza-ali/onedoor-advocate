# One Door · California

One applicant-facing eligibility brain for California benefits. The verified path is **CalFresh**
(eligibility + dollars + a live-call fact-check); the UI shows the full CA shelf as cited discover
cards. Education and navigation, never an official determination, legal, or medical advice.

**The spine is a policy-to-verified-code compiler.** Opus 4.8 reads the cited CalFresh policy corpus
and compiles the eligibility core into a deterministic, self-tested engine where every rule links its
exact policy paragraph. PolicyEngine-US + hand-worked CBPP/CDSS cases are the build-time **oracle** that
proves the engine green; they never answer a user query. The chat/voice/UI ride on top and are
trustworthy because every served fact is engine-computed, cited, or live-verified.

## Status: GREEN

`verify.sh` = **30 passed / 0 failed**, emits `<promise>RUBRIC_GREEN</promise>`.
- Independent-oracle precision (the gate): **100% on N=14** hand-worked statutory cases; coverage 100%;
  FAIL_TO_PASS 6/6; PASS_TO_PASS 11/11 (0 regressions). The adversarial break (disable CA categorical
  eligibility) makes the flip cases FAIL, proving the eval measures correctness, not plumbing.
- The compile fan-out (6 Opus agents concurrent) **caught two real errors** in the draft rules: the
  size-8 max allotment ($1789 -> $1795) and the H.R.1 immigrant cut's effective date (the brief assumed
  2026-04-01; the true OBBBA §10108 date is 2025-07-04). This is the self-catch, logged in `session_log.md`
  and `trace.jsonl`.

## Run locally (no secrets needed for Tier-1)

```bash
python3.13 -m venv .oracle-venv && .oracle-venv/bin/pip install policyengine-us   # the oracle (one-time)
npm install
npx wrangler dev --port 8787 --local            # serves SPA + /api + /mcp + agent-card + /voice
bash verify.sh                                  # -> RUBRIC_GREEN
```
Open http://127.0.0.1:8787 and click **Check my benefits**. Switch English / Español / فارسی (RTL) —
the dollars and citations stay byte-identical; only the presentation changes.

## Deploy (you supply the 5 secrets, then one command)

```bash
wrangler secret put ANTHROPIC_API_KEY      # live Opus reasoning lanes + doc extraction + voice LLM
wrangler secret put VAPI_API_KEY           # the real outbound county-line call (HERO 1)
wrangler secret put VAPI_PHONE_NUMBER_ID
# CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID are wrangler auth env vars
wrangler deploy                            # -> https://onedoor.<subdomain>.workers.dev
```
With keys present, `/api/extract` runs Opus vision on an uploaded doc, `/voice/*` drives a real Vapi
call to an allowlisted county line (disclosure-first, post-call grep gate), and `/api/screen?lang`
can use Opus to localize free-text. Without keys, all of that degrades gracefully to the offline
fixtures and the engine path — the demo stays fully functional.

## What's real vs staged (honest labeling)

- **Real:** the compiler -> cited engine, the eval accuracy number, the B4/E7/D3' adversarial gates,
  the self-catch (FIRE-1 compile + FIRE-2 voice), the app, `verify.sh` Tier-1.
- **Deploy-ready (needs your secrets):** the public *.workers.dev URL, live Opus runtime calls, the
  real Vapi county-line call. The captured-today transcript fixture is the Tier-2 backstop so a dropped
  on-stage dial can't tank the green check; replace it with a live dial when keys are set.
- **Staged (labeled in the pitch):** the in-person advocate role-play, the doc-ingest fixture.

## Files

| | |
|---|---|
| `config/rules.json` | the cited rule constants (every rule -> source_id + paragraph + url) |
| `corpus/*.md` | the pre-staged policy corpus, one grounded section per file (12) |
| `src/engine/calfresh.mjs` | the compiled deterministic engine (the only place benefit math lives) |
| `test/personas.yaml` | 18 eval personas (the flip, both H.R.1 seams, ABAWD county pair, student, elderly, Rx) |
| `scripts/eval.mjs` | the two-honest-numbers eval + adversarial discrimination |
| `scripts/oracle.py` | PolicyEngine-US oracle wrapper (build-time ground truth) |
| `src/server/worker.mjs` | the single Cloudflare Worker (SPA + /api + /mcp + agent-card + /voice) |
| `schema/onedoor.schema.json` | single-source schema for MCP + A2A (one edit breaks both) |
| `verify.sh` | the machine-gradable GREEN check |
| `RULESET.md` `FINAL.md` `PITCH_SCRIPT.md` `EVAL_REPORT.md` | the deliverable docs |
| `trace.jsonl` `concurrency_trace.json` `session_log.md` | orchestration + self-catch evidence |
| `.claude/workflows/onedoor.js` | the saved dynamic workflow (rerun tomorrow on a new program/state) |

To rerun on a new program/state tomorrow: edit `config/rules.json` + `test/personas.yaml`, re-run the
workflow and `verify.sh`. Zero code edits.
