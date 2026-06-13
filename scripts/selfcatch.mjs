// Reproducible self-catch demonstrations (H1/H2). A SEPARATE verifier catches a producer's
// error, forces a correction, and the result changes. Appends FIRE events to trace.jsonl and
// prints to stdout (verify.sh captures to session_log.md). The GREEN check is contingent on
// these firing.
import fs from "node:fs";
import { recordVerification } from "../src/voice/voice.mjs";
import { screenCalFresh } from "../src/engine/calfresh.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const fires = [];
const L = (s) => console.log(s);

// ---- FIRE-1 (verdict, REAL): the compile fan-out (verifier agents) caught the orchestrator's
// draft-rule errors. Re-assert from the committed trace + rules (reproducible across re-runs). --
const trace = fs.readFileSync(ROOT + "trace.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const caught = trace.filter((t) => t.verdict === "discrepancy_found");
L(`\n[FIRE-1 · verdict self-catch] producer=orchestrator (drafted config/rules.json), verifier=compile fan-out (different agent_ids).`);
L(`  ${caught.length} draft-rule error(s) caught by a separate verifier agent and corrected:`);
for (const c of caught) L(`    ✓ ${c.agent_id} flagged a discrepancy in ${c.inputs_ref}; corrected in rules.json.`);
const fixed8 = JSON.parse(fs.readFileSync(ROOT + "config/rules.json", "utf8")).max_allotment.value["8"];
L(`  e.g. max_allotment[8]: draft 1789 -> corrected ${fixed8} (USDA FY2026). H.R.1 immigrant date: draft 2026-04-01 -> corrected 2025-07-04 (OBBBA enactment).`);
const fire1ok = caught.length >= 1 && fixed8 === 1795;
fires.push({ fire: "FIRE-1", kind: "verdict", producer: "orchestrator", verifier: "compile-fanout", caught: caught.length, fired: fire1ok });

// ---- FIRE-2 (voice, REAL): seeded mis-hear of the work-requirement threshold. The post-call
// grep gate (a deterministic verifier) REFUSES the mis-heard value, forcing a read-back. --------
const TRANSCRIPT = "the work requirement is twenty hours a week, so 20 hours a week of work or an approved activity meets it";
const misheard = recordVerification({ field: "abawd_exemption_hours_per_week", value: "29", quote: "it needs 29 hours a week", transcript: TRANSCRIPT });
const corrected = recordVerification({ field: "abawd_exemption_hours_per_week", value: "20", quote: "the work requirement is twenty hours a week, so 20 hours a week", transcript: TRANSCRIPT });
L(`\n[FIRE-2 · voice self-catch] ASR mis-heard "20" as "29".`);
L(`  verifier (post-call grep gate) on value=29: ${misheard.ok ? "ACCEPTED ✗" : "REFUSED ✓"} (${misheard.reason})`);
L(`  after read-back-confirm, value=20: ${corrected.ok ? "ACCEPTED ✓" : "REFUSED ✗"} (${corrected.reason})`);
const fire2ok = misheard.ok === false && corrected.ok === true;
fires.push({ fire: "FIRE-2", kind: "voice", producer: "voice-agent", verifier: "post-call-grep-gate", fired: fire2ok });

// ---- append FIRE events to trace.jsonl (I2: verifier agent_id != producer) -----------------
const fireRecs = [
  { stage: "verify", agent_id: "verifier-blackbox", model: "opus-4.8", parent: "orchestrator", producer_agent_id: "orchestrator", gated_by: "oracle-discrepancy", verdict: fire1ok ? "FIRE-1_fired" : "FIRE-1_missed", note: `caught ${caught.length} draft-rule errors` },
  { stage: "verify", agent_id: "post-call-grep-gate", model: "deterministic", parent: "voice-agent", producer_agent_id: "voice-agent", gated_by: "verbatim-quote-grep", verdict: fire2ok ? "FIRE-2_fired" : "FIRE-2_missed", note: "refused mis-heard 29; accepted read-back 20" },
];
// keep trace idempotent: strip any prior FIRE lines, then append
const kept = trace.filter((t) => !String(t.verdict || "").startsWith("FIRE-"));
fs.writeFileSync(ROOT + "trace.jsonl", kept.map((r) => JSON.stringify(r)).join("\n") + "\n" + fireRecs.map((r) => JSON.stringify(r)).join("\n") + "\n");

const allFired = fires.every((f) => f.fired);
L(`\nSELF-CATCH: ${allFired ? "BOTH FIRE events fired ✓ (FIRE-1 verdict + FIRE-2 voice), verifier agent_id != producer" : "a FIRE did not fire ✗"}`);
fs.writeFileSync(ROOT + "selfcatch_result.json", JSON.stringify({ fires, allFired }, null, 2));
process.exit(allFired ? 0 : 1);
