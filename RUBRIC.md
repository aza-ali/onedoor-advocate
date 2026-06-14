# RUBRIC.md — the contract "done" is graded against

"Done" is a green check, not a claim. This file is the rubric; `verify.sh` is the grader. A human
never decides whether we are finished: `bash verify.sh` runs ~30 end-to-end assertions against the
running app and the pinned engine and emits `<promise>RUBRIC_GREEN</promise>` only when every MUST
passes. Re-run it on any machine to re-grade.

```bash
npm install && npm run dev   # or: npm run build && npm run start
bash verify.sh               # -> RUBRIC_GREEN  (currently 30 passed / 0 failed)
```

Each criterion below is a machine check, not prose. The Section letters match `verify.sh` output.

## A — The deterministic engine does the math (the model-routing proof)
- **A1** No benefit-dollar arithmetic exists outside `src/engine/` (a grep over the server/UI fails the build if it finds any). The model never computes a dollar.
- **A2** Every figure rendered traces to a named engine rule that records its exact cited policy paragraph (`source_id`, `paragraph`, `source_url`). A figure without provenance fails.

## B — Eligibility accuracy (two honest numbers, gate on the independent one)
- **B1(a)** PolicyEngine-US verdict-consistency, informational only, printed separately.
- **B2 (THE GATE)** Independent-oracle precision >= 0.90 on N >= 10 hand-worked statutory cases. Currently **100% on N=14**.
- **B3** Coverage on answered cases >= 0.70 AND flip-01 + every H.R.1 seam answered + correct.
- **B4** A deliberately broken ruleset (categorical eligibility disabled) MUST fail the INDEPENDENT flip cases, proving the eval measures correctness, not plumbing.
- **B6** Mean/max absolute dollar error reported. Currently $0 / $0.
- **B7** FAIL_TO_PASS == 100% and PASS_TO_PASS regressions == 0.

## C — Live URL + UI breadth (engine-scope honesty)
- **C1/C2** The deployed app returns a typed CalFresh verdict and flips federal-NOT → CA-ELIGIBLE for the seed household.
- **C3** The UI shows the full California shelf (>= 6 non-CalFresh cards), and a non-CalFresh card carrying a dollar amount fails (only CalFresh is computed).
- **C4** >= 3 cited recommendations off the same household, none with a dollar figure.
- **C5** An uploaded pay stub parses to the right fields, marked `needs_confirmation`, not persisted.

## D — Live voice verification of a complex, non-searchable fact (the hero) with a real fallback
- **D0/D1** A real disclosed call resolves an ambiguous eligibility fact and writes it with `verified_at` dated today, a real `call_id`, and a transcript on disk (the on-stage dial is primary; this captured artifact is the rubric-enforced backstop, never a mock).
- **D1'** Only allowlisted, published business lines may be dialed.
- **D2/D3** The verbatim AB-2905/TCPA disclosure is the first spoken turn; a deterministic post-call grep refuses any recorded value not backed by an exact transcript quote.

## E — Typed AEO / MCP + A2A
- **E1/E2/E3** `tools/list` returns 4 tools each with input+output schema; `tools/call` returns `structuredContent` with non-empty citations; the A2A AgentCard's skill ids match the tool names.
- **E4** Single-source schema: the MCP server and the AgentCard serve the same `schema/onedoor.schema.json`; one tampered field breaks both.
- **E7** Rx compliance enforced at schema level: a Medicaid/Medicare/TRICARE/VA copay-card payload is rejected; outputs carry `non_clinical:true`; GoodRx never appears on the AEO surface.

## F — Date/status/county H.R.1 gates (answered + correct)
- **F2** Same household, different period, different verdict (the OBBBA §10108 immigrant seam and the ABAWD waiver-county seam), date-deterministic with `today` as an explicit arg.

## G — Privacy + safety enforced (not asserted)
- **G1** Anonymous mode: a no-PII household still returns a verdict.
- **G2** No applicant PII persisted; the voice row stores only the business listing + transcript.
- **G3** Every verdict renders "Screening estimate, not an official eligibility determination" plus a real navigator fallback.

## H — Claude catches and fixes its own failure (the org-requested moment)
- **H1/H2** At least one seeded self-catch fires, performed by a verifier whose `agent_id` differs from the producer's, and is captured to `session_log.md` + `trace.jsonl`. We have two: the compile fan-out caught two real draft-rule errors (size-8 allotment; the H.R.1 immigrant date), and the voice grep gate refused a misheard "29 hours" and accepted "20" only after read-back.

## I — Orchestration trace + honest concurrency
- **I1/I2** `trace.jsonl` records one line per sub-agent (stage, agent_id, model, gated_by, verdict); the FIRE catch events appear with verifier `agent_id` != producer `agent_id`.
- **I3** A concurrency trace proves real overlap (6 Opus agents overlapping on the compile) or states the honest serial-by-data-dependency truth. We claim the honest 6, not a hand-wavy 14.

## K — Live multilingual + canonical output
- **K1** Switching languages re-renders the card while the dollars and citations stay BYTE-IDENTICAL (presentation only). The conversational, any-language version writes the translation in realtime, numbers verbatim.
- **K3** The finalized result carries verdict + estimated benefit + next step + exact documents + confidence + navigator fallback + the disclaimer.

## GREEN definition
`<promise>RUBRIC_GREEN</promise>` iff every MUST above passes or carries a logged, documented
exception. The headline accuracy spoken aloud is B2 (independent-oracle precision), with B1(a)
consistency stated separately.

## Rerun tomorrow on a new problem
Swap `config/rules.json` (the cited ruleset) and `test/personas.yaml` (the oracle cases); re-run
the compile workflow (`.claude/workflows/onedoor.js`) and `verify.sh`. Zero code edits. That is the
"could another team rerun the setup tomorrow" property: the contract is data, and the grader is a
script.
