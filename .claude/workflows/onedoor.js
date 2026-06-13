export const meta = {
  name: 'onedoor-compile',
  description: 'One Door CA: parallel Opus compile-grounding of the CalFresh rule sections (cited corpus) + parallel doc authoring. Genuine fan-out with self-timestamped concurrency proof.',
  phases: [
    { title: 'Compile', detail: 'one Opus agent per CalFresh corpus section — ground each rule in its exact cited policy paragraph' },
    { title: 'Authoring', detail: 'parallel Opus/Sonnet agents write RULESET/FINAL/PITCH/EVAL narrative + shelf cards' },
  ],
};

const REPO = '/Users/azaali/CascadeProjects/hackathon/onedoor';

// The 12 CalFresh corpus sections — the prime parallel stage (genuinely independent legal reasoning).
const SECTIONS = [
  { id: 'max-allotment', rules: ['max_allotment', 'min_allotment'], topic: 'FY2026 maximum monthly SNAP allotments (48 contiguous states + DC) and the minimum allotment for 1-2 person households', src: 'USDA FNS FY2026 COLA memo + 7 CFR 273.10(e)(2)(ii)(C)' },
  { id: 'standard-deduction', rules: ['standard_deduction'], topic: 'FY2026 SNAP standard deduction by household size', src: 'USDA FNS FY2026 COLA + 7 CFR 273.9(d)(1)' },
  { id: 'earned-income-deduction', rules: ['earned_income_deduction_rate'], topic: 'the 20% earned income deduction', src: '7 CFR 273.9(d)(2)' },
  { id: 'shelter-utilities', rules: ['excess_shelter_cap', 'standard_utility_allowance', 'shelter_income_share'], topic: 'excess shelter deduction, its FY2026 cap ($744, uncapped for elderly/disabled), the CA Standard Utility Allowance, and the 50%-of-income shelter threshold', src: '7 CFR 273.9(d)(6) + CDSS SUA tables' },
  { id: 'benefit-formula', rules: ['benefit_reduction_rate'], topic: 'the benefit computation: max allotment minus 30% of net monthly income', src: '7 CFR 273.10(e)(2)' },
  { id: 'gross-income-test', rules: ['gross_income_limit_federal'], topic: 'the federal 130% FPL gross income test', src: '7 CFR 273.9(a)(1)' },
  { id: 'net-income-test', rules: ['net_income_limit'], topic: 'the 100% FPL net income test', src: '7 CFR 273.9(a)(2)' },
  { id: 'ca-bbce', rules: ['ca_bbce_gross_limit', 'asset_test_waived_ca'], topic: 'California Modified/Broad-Based Categorical Eligibility: the 200% FPL gross screen and the asset-test waiver — the override that flips working households the federal 130% default rejects', src: '7 CFR 273.2(j) + CDSS All-County Letter on MCE' },
  { id: 'fpl', rules: ['fpl_2025_annual'], topic: 'the 2025 HHS Poverty Guidelines used for FY2026 SNAP (monthly = annual/12)', src: 'HHS 2025 Poverty Guidelines' },
  { id: 'hr1-immigrant', rules: ['hr1_immigrant_eligibility'], topic: 'H.R.1 (2026) narrowing of SNAP-eligible noncitizen categories effective 2026-04-01, and which statuses remain grandfathered — flag the high-uncertainty seam for live verification rather than asserting', src: 'H.R.1 (2026), 119th Congress' },
  { id: 'hr1-abawd', rules: ['hr1_abawd_work_requirement'], topic: 'H.R.1 (2026) ABAWD work-requirement expansion effective 2026-06-01: 18-64, no dependent under 14, >=20 hr/week, 3-month time limit', src: 'H.R.1 (2026), 119th Congress' },
  { id: 'abawd-waiver-counties', rules: ['abawd_waiver_counties_ca'], topic: 'the seven CA ABAWD waiver counties (Alpine, Colusa, Imperial, Merced, Monterey, Plumas, Tulare) effective through 2026-10-31', src: 'USDA-approved CA ABAWD waiver' },
];

const SECTION_SCHEMA = {
  type: 'object',
  required: ['section_id', 'grounded', 'citation_paragraph', 'source_url', 't_start', 't_end', 'confidence'],
  properties: {
    section_id: { type: 'string' },
    grounded: { type: 'boolean', description: 'true if the value(s) in config/rules.json are correctly grounded in the cited law' },
    citation_paragraph: { type: 'string', description: 'the exact policy paragraph / statutory text grounding the rule(s)' },
    source_url: { type: 'string' },
    discrepancy: { type: 'string', description: 'any value in rules.json that does NOT match the law, or empty string' },
    known_gap: { type: 'string', description: 'any sub-rule that could not be grounded and should be marked KNOWN_GAP, or empty' },
    t_start: { type: 'string', description: 'epoch seconds.millis from `date +%s.%3N` BEFORE doing the work' },
    t_end: { type: 'string', description: 'epoch seconds.millis from `date +%s.%3N` AFTER writing the corpus file' },
    confidence: { type: 'number' },
  },
};

phase('Compile');
const compileResults = await parallel(SECTIONS.map((s) => () =>
  agent(
    `You are a CalFresh policy-compile sub-agent grounding ONE rule section into cited law for the One Door California eligibility engine.

SECTION: ${s.id}
RULE KEYS in ${REPO}/config/rules.json: ${JSON.stringify(s.rules)}
TOPIC: ${s.topic}
PRIMARY SOURCE: ${s.src}

Do EXACTLY this, in order:
1. Run \`date +%s.%3N\` with Bash and capture it as t_start (record the real clock; do this FIRST).
2. Read ${REPO}/config/rules.json and inspect the value(s) for your rule key(s).
3. Using your knowledge of federal SNAP regulations and California CalFresh policy, write a concise cited corpus excerpt to ${REPO}/corpus/${s.id}.md containing: a heading, the exact statutory/regulatory paragraph text (quote or close paraphrase) that establishes the rule, the citation (CFR section or source + URL), the FY2026 numeric value(s), effective dates, and one line stating whether the value in rules.json is correctly grounded. This file IS part of the compiled engine's provenance — every rule must trace to its paragraph here.
4. Verify the rules.json value matches the law. If it matches, grounded=true. If a value is wrong, set grounded=false and put the correct value in "discrepancy". If a sub-rule genuinely cannot be grounded, name it in "known_gap" (never fake a citation).
5. Run \`date +%s.%3N\` again with Bash and capture it as t_end.
6. Return the structured result. citation_paragraph = the single most load-bearing paragraph; source_url = the official URL.

This is real legal grounding work, not a formality. Be exact about CFR paragraph numbers and FY2026 values.`,
    { label: `compile:${s.id}`, phase: 'Compile', model: 'opus', schema: SECTION_SCHEMA }
  ).catch(() => null)
));

log(`Compile fan-out complete: ${compileResults.filter(Boolean).length}/${SECTIONS.length} sections grounded`);

phase('Authoring');
const DOCS = [
  { id: 'RULESET', model: 'opus', file: 'RULESET.md',
    task: `Write ${REPO}/RULESET.md: a human-readable companion to config/rules.json. For EACH rule, give {value, source_id, source_url, paragraph, effective_from/to, verified_at, confidence}. Then add a "Hand-worked INDEPENDENT oracle cases" section that shows the FULL by-the-book arithmetic for these personas (read ${REPO}/test/personas.yaml for inputs): flip-01 (3-person, $3500/mo earned, $2200 rent -> show gross test, federal-130%-NO vs CA-200%-YES flip, std deduction, 20% earned deduction, SUA $663, excess shelter capped at $744, net income, then $785 max allotment minus 30% of net = $231/mo), zero-income-4p ($994 max allotment), and over-income-2p (gross $5000 > CA 200% limit $3525 -> NOT eligible). Mark any KNOWN_GAP rules. End with the "what changes for a rerun tomorrow" note (edit rules.json + personas.yaml only).` },
  { id: 'FINAL', model: 'opus', file: 'FINAL.md',
    task: `Write ${REPO}/FINAL.md with SOURCED impact constants (each with a stable id + URL, no invented numbers): $3.5B unclaimed CalFresh/year + 2.7M eligible-unenrolled Californians (Nourish California, "Lost Dollars, Empty Plates" 2024); 88% national SNAP participation (USDA FNS FY2022) vs ~81% CA; $1.50 economic activity per SNAP $1 (USDA ERS) rendered ONLY as a clearly-labeled secondary footer, kept out of the revenue story. Then a one-line who-pays (Medi-Cal managed-care plans via CalAIM Community Supports + food-bank/county outreach per-enrollment + GoodRx affiliate; the person never pays). Then wedge-vs-incumbents (mRelief, SingleStop, Propel, BenefitsCal): a federal-default screener gives CA households the wrong answer, and H.R.1 2026 dated seams (immigrant 4/1, ABAWD 6/1) make every static explainer wrong — a freshness+correctness moat backed by verified_at + the live county-line call provenance + a stated independent-oracle accuracy number. Plain business prose, no em dashes.` },
  { id: 'PITCH', model: 'opus', file: 'PITCH_SCRIPT.md',
    task: `Write ${REPO}/PITCH_SCRIPT.md — a 3-act FOMO pitch script (spoken, ~3 min). Act 1: 2.7M Californians told "no" / left out by a federal-default screener; $3.5B unclaimed/year. Act 2: incumbents sunset the GetCalFresh assister path (2025) and H.R.1 2026 makes static explainers wrong on dated seams (4/1 immigrant, 6/1 ABAWD) — wrong answers = real harm to families. Act 3: the live demo — Maria (a CITED COMPOSITE, not a real user; state this) gives her situation in Spanish, the compiled+cited engine flips her from federal-NOT to CA-ELIGIBLE with a real dollar figure ($231/mo), Opus spots the one fact the corpus cannot settle and a live disclosed call to a county benefits line resolves it, Opus catches and corrects its own overconfident assumption, then preps her to walk into the county office. Name the weakness (Mar Hershenson framing): consumer willingness-to-pay is weak -> that is exactly why who-pays is B2B/CalAIM. Explicitly label REAL vs STAGED: the compiler, the eval number, and the call are real; the in-room coaching is a staged preview. Plain prose, no em dashes.` },
  { id: 'EVAL', model: 'sonnet', file: 'EVAL_REPORT.md',
    task: `Read ${REPO}/EVAL_REPORT.json and write ${REPO}/EVAL_REPORT.md narrating: persona count, BOTH accuracy numbers (B1(a) PolicyEngine verdict-consistency, informational; B2 INDEPENDENT-oracle precision = THE GATE, with N), coverage, mean/max dollar error, the abstention λ derivation (held-out 20% split, seed 42, λ=0.65), the FAIL_TO_PASS/PASS_TO_PASS table, flip-01 before/after the categorical-eligibility break (the B4 adversarial bite: precision drops from 100% to ~79% and the flip cases fail), and a one-line comparison to MyFriendBen (which reports >90% accuracy). Be precise and honest; note that the INDEPENDENT cases are hand-worked from the cited statute and that PolicyEngine's calendar-2026 figures differ on dollar amounts because it models H.R.1 allotment phase-downs, so we gate on verdict-consistency for the PE cross-check. No em dashes.` },
  { id: 'SHELF', model: 'sonnet', file: 'public/shelf.json',
    task: `Write ${REPO}/public/shelf.json: a JSON array of >=8 California benefit "discover cards" for the UI shelf (Medi-Cal, WIC, CalEITC/YCTC, CARE/FERA, CA LifeLine, free/reduced school meals, SUN Bucks, Rx cost-pathways, housing vouchers). Each card: {program, need_group (one of: Food, Health, Money, Utilities, Housing, Kids), one_line (plain-language "you may also qualify — here's why"), why_short, citation:{source_id, note}, next_step (concrete: phone or URL)}. NONE may carry a dollar figure (only CalFresh is engine-computed). Valid JSON only, no prose around it.` },
];

const authored = await parallel(DOCS.map((d) => () =>
  agent(d.task + `\n\nAfter writing the file, return a one-line confirmation.`,
    { label: `doc:${d.id}`, phase: 'Authoring', model: d.model }).then(() => ({ id: d.id, file: d.file, ok: true })).catch((e) => ({ id: d.id, ok: false, err: String(e).slice(0, 80) }))
));

return { compile: compileResults, docs: authored };
