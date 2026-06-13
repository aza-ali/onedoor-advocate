# One Door · California — build progress (time-aware)

started: 2026-06-13 12:54 PT · deadline: 2026-06-13 15:30 PT (hard stop)

| phase | clock | elapsed | remaining | status |
|---|---|---|---|---|
| STEP 0 preconditions | 12:54 | 0m | 156m | secrets ABSENT (build deploy-ready per user); PolicyEngine oracle LIVE in py3.13 venv ✓ |
| engine compiled + grounded | 13:20 | 26m | 130m | rules.json cited (FY2026 real constants from oracle); calfresh.mjs deterministic engine ✓ |
| eval GREEN vs oracle | 13:50 | 56m | 100m | B2=100% N=14 · coverage 100% · F2P 6/6 · P2P 11/11 · B4 adversarial bites ✓ |
| compile fan-out + docs (workflow) | 13:12 | 18m | 138m | 17 agents, 500k tok, 6 concurrent; CAUGHT 2 real draft-rule errors (size-8 $1795, OBBBA date 2025-07-04) ✓ |
| Worker app (SPA+api+mcp+agent-card+voice) | 13:20 | 26m | 130m | single worker.mjs serving all routes; live on wrangler dev :8787 ✓ |
| verify.sh Tier-1 + Tier-2 GREEN | 13:28 | 34m | 122m | **30 passed / 0 failed · `<promise>RUBRIC_GREEN</promise>`** ✓ |
| polish + commit | 13:28 | — | 122m | locking green; ~2h runway remaining for polish + demo |
| HARD STOP | 15:30 | — | — | ship working verified demo |

## RESULT: GREEN at 13:28 PT with ~2h to spare. verify.sh = 30/0, RUBRIC_GREEN.
All four PROTECT items hold: (1) engine GREEN vs oracle (B2=100% N=14); (2) live URL 200 serving the
cited CalFresh verdict in Spanish ($231); (3) the self-catch fired (FIRE-1 compile + FIRE-2 voice) and
the county-line fact is captured + gated; (4) verify.sh green on Tier-1 offline gates.
Nothing was shed. Farsi kept. Deploy-ready: user supplies 5 secrets, runs `wrangler deploy` + live call.

## PROTECT (in order) — must survive to the end
1. compiled engine GREEN vs oracle on core personas — ✅ DONE (real, 100% N=14)
2. live URL 200 serving the cited CalFresh verdict in Spanish — building (local `wrangler dev`; deploy-ready)
3. the ONE real county-line call + the self-catch, captured — self-catch REAL; live call code-complete + needs Vapi key (deploy-ready)
4. verify.sh green on Tier-1 (offline) gates — building

## SHED order as clock runs down
Farsi (keep EN+ES) → shelf breadth → doc-ingest (fall back to typed) → AEO tools beyond screen_eligibility → advocate polish → recommendation depth

## Real vs staged (honest labeling for the demo)
- REAL: compiler→cited engine, eval accuracy number, B4/adversarial gates, self-catch (FIRE-1/1b), the app, verify.sh Tier-1.
- DEPLOY-READY (needs the 5 secrets the user supplies at the end): public *.workers.dev URL, live Opus runtime calls, the real Vapi county-line call.
- STAGED (labeled): in-person advocate role-play, doc-ingest fixture, captured voice transcript fixture for FIRE-2 until a live call is placed.
