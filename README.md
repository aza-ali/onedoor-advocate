# One Door · California

One applicant-facing eligibility brain for California benefits. The verified path is **CalFresh**
(eligibility + dollars + a live-call fact-check); the UI shows the full CA shelf as cited discover
cards. **Education and navigation, never an official determination, legal, or medical advice.**

## The grounding contract

The LLM orchestrates and converses; the deterministic engine computes. **Opus 4.8 (claude-opus-4-8)
never computes an eligibility verdict, a dollar figure, or a rule on its own.** It runs the
conversation and decides what to ask, then calls tools that delegate to the deterministic,
self-tested engine in `lib/engine.ts` (which wraps the compiled `src/engine/calfresh.mjs` and the
cited `config/rules.json`). The tools it is given:

- `screen_eligibility` — every eligibility verdict and every monthly-benefit dollar comes from here.
- `recommend_stack` — other CA programs the household likely qualifies for (cited, no dollar math).
- `get_rule_citation` — the exact policy paragraph + source URL behind a named rule.

**Every served fact is engine-computed and cited, or it is flagged as general guidance.** A dollar
figure or verdict that did not come from the engine is never stated. Each rule links its exact
policy paragraph and source URL, so the chat, voice, and UI are trustworthy because the numbers
underneath them are deterministic and traceable.

**The spine is a policy-to-verified-code compiler.** Opus 4.8 read the cited CalFresh policy corpus
and compiled the eligibility core into the deterministic engine where every rule links its exact
policy paragraph. PolicyEngine-US + hand-worked CBPP/CDSS cases are the build-time **oracle** that
proves the engine green; they never answer a user query.

## Architecture (Next.js)

The app is **Next.js 15 (App Router, TypeScript)** with server-side route handlers. **The original
Cloudflare Worker has been retired**; its single-worker surface (SPA + `/api` + `/mcp` +
agent-card + voice) is now served by Next.js route handlers running on the Node runtime:

| Route | Purpose |
|---|---|
| `app/page.tsx` | the applicant UI (English / Español / فارسی RTL) |
| `app/api/screen/route.ts` | POST a household -> engine-computed CalFresh verdict + dollars + citations |
| `app/api/chat/route.ts` | the Opus orchestration loop (tool-use against the engine) |
| `app/api/shelf/route.ts`, `app/api/i18n/route.ts` | the CA benefit shelf + localization |
| `app/api/extract/route.ts` | Opus vision on an uploaded doc (needs the key) |
| `app/mcp/route.ts`, `app/.well-known/agent-card.json/route.ts` | MCP + A2A surfaces |
| `app/healthz/route.ts` | health check |
| `lib/engine.ts` | the grounding-brain binding (the only place benefit math is served) |
| `lib/anthropic.ts` | server-only Anthropic client factory |

The engine reads `config/rules.json`, `corpus/*.md`, and fixtures via `fs` at runtime; `next.config.mjs`
traces those files into the server bundle so they ship to Cloud Run / Firebase App Hosting.

## Run locally

```bash
npm install
# .env.local needs: ANTHROPIC_API_KEY=sk-ant-...  and  ANTHROPIC_MODEL=claude-opus-4-8
npm run dev          # http://localhost:3000
bash verify.sh       # still emits <promise>RUBRIC_GREEN</promise>
```

Open http://localhost:3000 and click **Check my benefits**. Switch English / Español / فارسی (RTL):
the dollars and citations stay byte-identical; only the presentation changes.

For the build-time oracle (one-time, only needed to re-prove the engine, not to run the app):

```bash
python3.13 -m venv .oracle-venv && .oracle-venv/bin/pip install policyengine-us
```

## Security posture (the key is server-only)

`ANTHROPIC_API_KEY` is read only in `server-only` modules (`lib/anthropic.ts` imports `server-only`,
so importing it from a client component is a build error). It **never reaches the browser bundle**.

- **Locally:** the key lives in `.env.local`, which is gitignored and never committed.
- **On Firebase App Hosting:** the key lives in **Google Secret Manager** and is referenced from
  `apphosting.yaml` as `secret: anthropic-api-key` with `availability: RUNTIME`. It is **never** a
  plaintext value in `apphosting.yaml`, and because it is RUNTIME-only it is absent at build time, so
  no compiled asset can inline it. The non-secret model id (`claude-opus-4-8`) is plain text.

Verify after a build: `grep -rn "sk-ant-" .next/static .next/server` returns nothing. Full deploy
steps are in **`DEPLOY.md`**.

## Status: GREEN

`verify.sh` = **30 passed / 0 failed**, emits `<promise>RUBRIC_GREEN</promise>`.
- Independent-oracle precision (the gate): **100% on N=14** hand-worked statutory cases; coverage 100%;
  FAIL_TO_PASS 6/6; PASS_TO_PASS 11/11 (0 regressions). The adversarial break (disable CA categorical
  eligibility) makes the flip cases FAIL, proving the eval measures correctness, not plumbing.
- The compile fan-out (6 Opus agents concurrent) **caught two real errors** in the draft rules: the
  size-8 max allotment ($1789 -> $1795) and the H.R.1 immigrant cut's effective date (the brief assumed
  2026-04-01; the true OBBBA §10108 date is 2025-07-04). The self-catch is logged in `session_log.md`
  and `trace.jsonl`.

## Files

| | |
|---|---|
| `config/rules.json` | the cited rule constants (every rule -> source_id + paragraph + url) |
| `corpus/*.md` | the pre-staged policy corpus, one grounded section per file (12) |
| `src/engine/calfresh.mjs` | the compiled deterministic engine (the only place benefit math lives) |
| `lib/engine.ts` | server-only grounding-brain binding (tools + the single screen code path) |
| `lib/anthropic.ts` | server-only Anthropic client factory (reads the key from `process.env`) |
| `app/**/route.ts` | the Next.js route handlers (api, mcp, agent-card, healthz) |
| `test/personas.yaml` | 18 eval personas (the flip, both H.R.1 seams, ABAWD county pair, student, elderly, Rx) |
| `scripts/eval.mjs` | the two-honest-numbers eval + adversarial discrimination |
| `scripts/oracle.py` | PolicyEngine-US oracle wrapper (build-time ground truth) |
| `schema/onedoor.schema.json` | single-source schema for MCP + A2A (one edit breaks both) |
| `verify.sh` | the machine-gradable GREEN check |
| `apphosting.yaml` `DEPLOY.md` | Firebase App Hosting config + deploy steps |
| `RULESET.md` `FINAL.md` `PITCH_SCRIPT.md` `EVAL_REPORT.md` | the deliverable docs |
| `trace.jsonl` `concurrency_trace.json` `session_log.md` | orchestration + self-catch evidence |

To rerun on a new program/state tomorrow: edit `config/rules.json` + `test/personas.yaml`, re-run the
compile workflow and `verify.sh`. Zero code edits.
