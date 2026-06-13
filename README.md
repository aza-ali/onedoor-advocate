# One Door Advocate

A conversational benefits advocate for California. You talk to it in **any language**, and it
helps you understand what you likely qualify for, what to bring to your interview, and how to
apply, with every dollar figure and eligibility verdict computed by a deterministic, cited
engine rather than guessed by a language model.

> Education and navigation, never an official determination, legal, or medical advice.

Built for Claude Build Day (Cerebral Valley + Anthropic). California-first; the seed persona
"Maria" is a cited composite, not a real user.

---

## The grounding contract (the whole point)

The language model **orchestrates and converses; it never computes eligibility or invents a
rule or a dollar amount.** Opus runs the conversation and decides what to ask, then calls tools
that delegate to the deterministic engine:

- `screen_eligibility` — every eligibility verdict and every monthly-benefit dollar comes from here.
- `recommend_stack` — other California programs the household likely qualifies for (cited, no dollar math).
- `get_rule_citation` — the exact policy paragraph and source URL behind a named rule.
- `set_language` — switches the whole interface into the person's language (see below).

**Every served fact is engine-computed and cited to a policy paragraph + URL, or it is flagged
as general guidance.** A dollar figure or verdict that did not come from the engine is never
stated. The engine itself is a policy-to-code compiler: it reads the cited CalFresh corpus
(`corpus/*.md`, `config/rules.json`) and computes verdicts where every rule links its exact
paragraph. PolicyEngine-US + hand-worked CBPP/CDSS cases are the build-time **oracle** that
proves the engine green; they never answer a user query.

## Talk to it in any language

There is no language menu. You simply tell the advocate your language ("I speak Traditional
Chinese", "Tagalog please", or just type in your language) and it switches the entire interface,
including right-to-left scripts. The result card is translated by the model **in realtime**, with
every digit, `$`, `%`, URL, phone number, and program name kept verbatim, so **the dollars and
citations stay byte-identical across languages** and only the words change. The first thing the
advocate does is ask which language you would like to use.

## Design

A calm, confident interface in the color of trust (blue), with full **light and dark mode**
(follows your system, with a manual toggle), a trackless scrollbar, an editorial serif for the
dollar figure, and a generative answer card that does the heavy lifting so the conversation stays
short and warm.

---

## Architecture

**Next.js 15 (App Router, TypeScript)** with server-side route handlers on the Node runtime. The
Anthropic key lives only on the server.

| Path | Purpose |
|---|---|
| `app/page.tsx`, `components/Chat.tsx` | the conversational advocate UI (any language, light/dark) |
| `app/api/chat/route.ts` | the Opus tool-use loop (streams SSE; the `set_language` + screen tools) |
| `app/api/screen/route.ts` | POST a household → engine-computed CalFresh verdict + dollars + citations |
| `app/api/localize-card/route.ts` | re-localize the answer card into any language (numbers verbatim) |
| `app/api/extract/route.ts` | Opus vision on an uploaded pay stub / document (needs the key) |
| `app/mcp/route.ts`, `app/.well-known/agent-card.json/route.ts` | typed MCP + A2A surfaces |
| `app/healthz/route.ts` | health check |
| `lib/engine.ts` | the grounding-brain binding (the only place benefit math is served) |
| `lib/i18n-dynamic.ts` | realtime, model-written translation of the card (server-only) |
| `lib/anthropic.ts` | server-only Anthropic client factory (reads the key from `process.env`) |
| `src/engine/calfresh.mjs` | the compiled deterministic engine (the only place benefit math lives) |
| `config/rules.json`, `corpus/*.md` | the cited ruleset + pre-staged policy corpus |

The engine reads `config/rules.json` + `corpus/*.md` via `fs` at runtime; `next.config.mjs` traces
those files into the server bundle so they ship to Cloud Run / Firebase App Hosting.

## Run locally

```bash
npm install
# .env.local needs: ANTHROPIC_API_KEY=sk-ant-...  and  ANTHROPIC_MODEL=claude-opus-4-8
npm run dev          # http://localhost:3000
bash verify.sh       # the eligibility-accuracy green check (RUBRIC_GREEN)
```

For the build-time oracle (only needed to re-prove the engine, not to run the app):

```bash
python3.13 -m venv .oracle-venv && .oracle-venv/bin/pip install policyengine-us
```

## "Done" is a green check, not a claim

`verify.sh` curls the running app and grades the eligibility engine end-to-end against a
hand-worked statutory oracle, emitting `<promise>RUBRIC_GREEN</promise>` only when every check
passes: independent-oracle precision (100% on N=14 hand-worked cases), the federal→CA eligibility
flip, the H.R.1 2026 date/county seams, MCP + A2A single-source schema, anonymous mode, and no
applicant PII persisted. See `RUBRIC.md` / `EVAL_REPORT.md`.

## Security posture (the key is server-only)

`ANTHROPIC_API_KEY` is read only in `server-only` modules (`lib/anthropic.ts`), so importing it
from a client component is a build error. It **never reaches the browser bundle**.

- **Locally:** the key lives in `.env.local`, which is gitignored and never committed.
- **On Firebase App Hosting:** the key lives in **Google Secret Manager** and is referenced from
  `apphosting.yaml` as `secret: anthropic-api-key` with `availability: RUNTIME`. It is never a
  plaintext value in `apphosting.yaml`. Verify after a build: `grep -rn "sk-ant-" .next/static`
  returns nothing. Full steps in **`DEPLOY.md`**.

## Deliverables (the hackathon artifacts)

`RULESET.md`, `RUBRIC.md`, `EVAL_REPORT.md`, `FINAL.md` (sourced impact constants + who-pays),
`PITCH_SCRIPT.md`, `verify.sh`, `trace.jsonl` + `session_log.md` (orchestration + self-catch
evidence), and the deterministic engine + cited corpus.

## Status

`verify.sh` = **30 passed / 0 failed**. Realtime card-translation latency is a known fast-follow
(it falls back to English prose with the correct direction if a translation is slow, so the
numbers and citations are always correct and the card never blocks).
