# One Door — Claude Build Day submission

**Team: One Door Fully Stacked** · Aza Ali, Teresa, Chen, Siv Sambasivam

| | |
|---|---|
| **Live demo** | https://onedoor--onedoor-advocate.us-central1.hosted.app |
| **Public repo** | https://github.com/aza-ali/onedoor-advocate |
| **Demo video (1 min)** | _[add link]_ |
| **The green check** | `bash verify.sh` → `RUBRIC_GREEN` (**30 passed / 0 failed**) |

**One line:** an AI benefits advocate that flips Californians from "you don't qualify" to a cited
dollar amount, in any language, with every benefit figure computed by a deterministic, tested
engine instead of guessed by the model.

It is not a chatbot, not a dashboard, and not RAG. The model never invents a dollar; a cited
rules engine computes it and `verify.sh` proves it.

---

## Impact (35%)

About **2.7 million** eligible Californians receive no CalFresh (SNAP), leaving roughly **$3.5
billion** in already-appropriated federal food dollars unclaimed every year (Nourish California,
*Lost Dollars, Empty Plates* 2024). A common cause is mechanical: screeners run the **federal
default** rule (130% of poverty) and never apply California's higher **200%** limit, so a working
family that actually qualifies is told "no." On top of that, **H.R.1 (2026)** ships dated rule
changes (immigrant eligibility, ABAWD work requirements) that make every static explainer wrong
the moment a deadline passes.

One Door is the tool a nonprofit deserves, built on the public policy data the state already
publishes. The person never pays; the payers are the parties that profit when an eligible person
enrolls (Medi-Cal managed-care plans via CalAIM, food banks and counties per enrollment). The
wedge versus incumbents (mRelief, SingleStop, Propel, BenefitsCal) is a freshness-plus-correctness
moat: California-correct, dated to the H.R.1 seams, and accuracy-measured (`FINAL.md`).

## Demo (35%)

Open the live URL and tell the advocate your situation in **any language** (just say "I speak
Tagalog," or type in your language). The hero path:

1. A San Francisco family, $3,500/mo, $2,200 rent, two kids. The **federal default rejects them.**
2. The cited engine applies California's BBCE and **flips the verdict to eligible, $231/month**,
   showing every rule that got there (max allotment $785 minus 30% of net income $1,847).
3. The whole answer card re-renders in the person's language with the **dollars and citations
   byte-identical** (the model writes the translation in realtime, numbers verbatim).
4. It preps them for the county interview: what to bring, what they will ask.

It holds up live: `/api/screen` returns the cited $231, `/api/chat` runs the Opus tool loop with
the key read from Secret Manager, and `bash verify.sh` is 30/0 green. See `PITCH_SCRIPT.md` for the
3-act demo script.

## Opus 4.8 use (15%)

Opus is the reasoning, grounding, and verification layer around a deterministic engine, not a
wrapper. It does only the human parts, and it caught its own failures:

- **Six reasoning lanes:** messy story or pay-stub photo → structured household; date/status/county
  judgment on the H.R.1 seams; grounding each explanation in a cited paragraph; driving a disclosed
  voice call with transcript read-back; **realtime any-language i18n that keeps every digit, $, %,
  URL, and citation verbatim**; and a final self-review.
- **It caught real errors.** During a parallel compile of the rule corpus, Opus sub-agents found
  and corrected **two real draft-rule errors** before green (a wrong household-size-8 allotment and
  a wrong H.R.1 immigrant effective date). On a voice read-back, the post-call grep gate rejected a
  misheard "29 hours" because that phrase was not in the transcript, then accepted "20" only after
  confirmation. Both are in `trace.jsonl`, the verifier's `agent_id` distinct from the producer's.

## Orchestration (15%)

"Done" is verifiable by the model without a human:

- **A rubric file it grades against:** `RUBRIC.md` is the contract; `verify.sh` runs ~30 assertions
  against the live URL and the pinned engine and emits `RUBRIC_GREEN` only when all pass (engine
  math, the federal→CA flip, the H.R.1 date seams, single-source MCP/A2A schema, anonymous mode, no
  PII persisted).
- **A repeatable parallel compile:** `.claude/workflows/onedoor.js` fans out one Opus agent per
  CalFresh rule section (12 sections), each grounding its rule in cited law and returning a
  self-timestamped structured result (6 genuinely overlapping, ~500k tokens). A separate black-box
  verifier checked each rule against a build-time oracle (PolicyEngine-US + hand-worked CBPP/CDSS).
- **Producer/verifier separation everywhere it matters** (distinct `agent_id`s in `trace.jsonl`),
  including the voice path's deterministic grep gate.
- **Rerun tomorrow on a new problem:** swap `config/rules.json` + `test/personas.yaml`, re-run the
  workflow and `verify.sh`. Zero code edits.

---

## Built during the event

The deterministic CalFresh engine + cited corpus, the eval harness and green gate, the
conversational any-language Next.js app, the realtime model-written i18n, the typed MCP/A2A
surface, and the Firebase App Hosting deploy were all built during Build Day. Prior research
(problem framing, the locked brief) lives in `session_log.md` and the `logs/` transcripts.

## Reproduce the green check

```bash
git clone https://github.com/aza-ali/onedoor-advocate && cd onedoor-advocate
npm install
npm run dev          # http://localhost:3000
bash verify.sh       # -> RUBRIC_GREEN (30/0)
node scripts/eval.mjs  # -> independent-oracle precision 100% on N=14, $0 dollar error
```

## Evidence index

| File | What it proves |
|---|---|
| `RUBRIC.md` + `verify.sh` | the machine-gradable contract and its grader (Orchestration) |
| `EVAL_REPORT.md` + `scripts/eval.mjs` | accuracy: 100% on N=14, $0 dollar error, the adversarial bite |
| `.claude/workflows/onedoor.js` | the parallel compile fan-out (Orchestration) |
| `trace.jsonl` + `concurrency_trace.json` | per-agent trace, producer≠verifier, honest concurrency |
| `session_log.md` + `logs/*.jsonl` | the raw build + self-catch transcripts |
| `src/engine/calfresh.mjs` + `config/rules.json` + `corpus/*.md` | law compiled to cited code |
| `FINAL.md` | sourced impact constants + who-pays + wedge (Impact) |
| `PITCH_SCRIPT.md` | the 3-act demo script |
