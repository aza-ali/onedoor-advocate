// One Door · California — COMPILED CalFresh eligibility engine (the spine).
//
// This is law-compiled-to-code: every constant and branch traces to its exact cited
// policy paragraph in config/rules.json (source_id + paragraph + url). The engine is
// deterministic — NO model does benefit arithmetic. PolicyEngine-US + hand-worked
// CBPP/CDSS cases are the BUILD-TIME oracle that proves this engine green (see
// scripts/oracle.py + scripts/eval.mjs); they are never called at runtime.
//
// Safety posture: this returns an eligibility SCREENING ESTIMATE for education/navigation,
// never an official determination. Every result carries the disclaimer + a navigator branch.

import RULES from "../../config/rules.json" with { type: "json" };

const DISCLAIMER = "Screening estimate, not an official eligibility determination.";

// ---- helpers: provenance-tracked constant access -----------------------------------------
function prov(ruleKey) {
  const r = RULES[ruleKey];
  if (!r) throw new Error(`unknown rule ${ruleKey}`);
  const src = RULES.sources[r.source_id] || {};
  return {
    rule: ruleKey,
    value: r.value,
    source_id: r.source_id,
    source_url: src.url || null,
    paragraph: r.paragraph,
    effective_from: r.effective_from,
    effective_to: r.effective_to,
    verified_at: r.verified_at,
    confidence: r.confidence,
  };
}
const val = (k) => RULES[k].value;

function bySize(table, size, plusKey) {
  if (table[String(size)] != null) return table[String(size)];
  // sizes above the table: extrapolate with each_additional
  const maxKey = Math.max(...Object.keys(table).filter((k) => /^\d+$/.test(k)).map(Number));
  const step = table.each_additional ?? table[plusKey] ?? 0;
  if (plusKey && size >= 6 && table[plusKey] != null && !/^\d+$/.test(plusKey)) return table[plusKey];
  return table[String(maxKey)] + step * (size - maxKey);
}

function maxAllotment(size) {
  const t = val("max_allotment");
  if (t[String(size)] != null) return t[String(size)];
  return t["8"] + t.each_additional * (size - 8);
}
function standardDeduction(size) {
  const t = val("standard_deduction");
  if (size <= 3) return t["1"];
  if (size === 4) return t["4"];
  if (size === 5) return t["5"];
  return t["6_plus"];
}
function fplAnnual(size) {
  const t = val("fpl_2025_annual");
  if (t[String(size)] != null) return t[String(size)];
  return t["8"] + t.each_additional * (size - 8);
}
const fplMonthly = (size) => fplAnnual(size) / 12;

// ---- H.R.1 2026 date/status/county gates (deterministic, not prose) -----------------------
function immigrationGate(member, today) {
  // Returns {eligible_for_snap_unit, reason, provenance, uncertain}
  const rule = RULES.hr1_immigrant_eligibility;
  const status = (member.immigration_status || "citizen").toLowerCase();
  const cutoff = rule.value.effective_date; // 2025-07-04 (OBBBA §10108 enactment)
  const newlyIneligible = rule.value.newly_ineligible_statuses;
  const stillEligible = rule.value.still_eligible_statuses;
  // Citizens: always eligible.
  if (status === "citizen" || status === "us_citizen") return { eligible: true, reason: "U.S. citizen", uncertain: false };
  // Categories that REMAIN eligible under OBBBA §10108: LPR, Cuban-Haitian entrant, COFA.
  if (stillEligible.includes(status) || ["permanent_resident", "green_card"].includes(status))
    return { eligible: true, reason: `Status '${status}' remains SNAP-eligible under OBBBA §10108`, uncertain: false };
  // Newly-ineligible categories on/after enactment (refugee, asylee, parolee, withholding, etc.).
  const isNewlyIneligibleCat = newlyIneligible.includes(status) || status.includes("parolee");
  if (isNewlyIneligibleCat) {
    if (today >= cutoff)
      return { eligible: false, reason: `Status '${status}' lost SNAP eligibility under OBBBA §10108 (effective ${cutoff})`, uncertain: true, prov: prov("hr1_immigrant_eligibility") };
    return { eligible: true, reason: `Status '${status}' still eligible before OBBBA enactment (${cutoff})`, uncertain: true, prov: prov("hr1_immigrant_eligibility") };
  }
  // Other noncitizen statuses: high-uncertainty seam — flag for verification, do not assert.
  return { eligible: true, reason: `Noncitizen status '${status}' — eligibility uncertain under 2026 rules`, uncertain: true, prov: prov("hr1_immigrant_eligibility") };
}

function abawdGate(member, county, today) {
  // Returns {at_risk, reason, provenance}
  const rule = RULES.hr1_abawd_work_requirement.value;
  if (today < rule.effective_date) return { at_risk: false, reason: "ABAWD time limit not yet effective" };
  const age = member.age ?? 30;
  if (age < rule.age_min || age > rule.age_max) return { at_risk: false, reason: "outside ABAWD age range (18-64)" };
  if (member.is_disabled || member.is_elderly) return { at_risk: false, reason: "exempt: elderly/disabled" };
  if (member.has_dependent_under_14) return { at_risk: false, reason: "exempt: has a dependent under 14" };
  const waiverCounties = val("abawd_waiver_counties_ca");
  if (county && waiverCounties.includes(county))
    return { at_risk: false, reason: `exempt: ${county} is an ABAWD waiver county (through 2026-10-31)`, prov: prov("abawd_waiver_counties_ca") };
  const hours = member.work_hours_per_week ?? 0;
  if (hours >= rule.min_hours_per_week) return { at_risk: false, reason: `meets ${rule.min_hours_per_week} hr/week work requirement` };
  return {
    at_risk: true,
    reason: `ABAWD (18-64, no dependent under 14, non-waiver county ${county || "?"}) working ${hours} hr/week < ${rule.min_hours_per_week} required under H.R.1 (effective ${rule.effective_date}); benefits time-limited to ${rule.time_limit_months} months`,
    prov: prov("hr1_abawd_work_requirement"),
  };
}

// ---- the core eligibility + benefit computation -------------------------------------------
export function screenCalFresh(hh) {
  const today = hh.today || RULES.as_of_date;
  const county = hh.county || null;
  const size = hh.household_size ?? (hh.members ? hh.members.length : 1);
  const members = hh.members || Array.from({ length: size }, (_, i) => ({ age: i === 0 ? 30 : 8 }));
  const hasElderlyOrDisabled = members.some((m) => m.is_disabled || m.is_elderly || (m.age ?? 0) >= 60);

  const provenance = [];
  const warnings = [];
  const why = [];
  const used = (k) => { const p = prov(k); provenance.push(p); return p; };

  // --- need-more-info guard (anonymous mode still works: defaults applied, flagged) ---------
  if (size < 1) return needMoreInfo("household_size");

  // --- income ------------------------------------------------------------------------------
  const earned = num(hh.monthly_earned_income);
  const unearned = num(hh.monthly_unearned_income);
  const grossIncome = earned + unearned;

  // --- deductions (273.9(d)) ---------------------------------------------------------------
  const stdDed = standardDeduction(size); used("standard_deduction");
  const eidRate = val("earned_income_deduction_rate"); used("earned_income_deduction_rate");
  const earnedDed = round2(earned * eidRate);
  const depCare = num(hh.dependent_care_monthly);
  // medical deduction only for elderly/disabled, only the portion over $35
  const medical = hasElderlyOrDisabled ? Math.max(0, num(hh.medical_expenses_monthly) - 35) : 0;

  // adjusted income before shelter
  const adjusted = Math.max(0, grossIncome - stdDed - earnedDed - depCare - medical);

  // excess shelter deduction (273.9(d)(6)). A household with shelter/utility costs uses the
  // CA Standard Utility Allowance in place of actual utilities (standard CalFresh practice).
  const claimsUtilities = num(hh.utilities_monthly) > 0 || hh.uses_sua || num(hh.shelter_cost_monthly) > 0;
  const sua = claimsUtilities ? val("standard_utility_allowance") : 0;
  if (sua) used("standard_utility_allowance");
  const shelter = num(hh.shelter_cost_monthly) + sua;
  const shelterShare = val("shelter_income_share"); used("shelter_income_share");
  const halfAdjusted = adjusted * shelterShare;
  let excessShelter = Math.max(0, shelter - halfAdjusted);
  const shelterCap = val("excess_shelter_cap"); used("excess_shelter_cap");
  let shelterCapped = false;
  if (!hasElderlyOrDisabled && excessShelter > shelterCap) { excessShelter = shelterCap; shelterCapped = true; }
  excessShelter = round2(excessShelter);

  const netIncome = Math.max(0, round2(adjusted - excessShelter));

  // --- eligibility screens -----------------------------------------------------------------
  const fplM = fplMonthly(size);
  const grossFed = val("gross_income_limit_federal"); used("gross_income_limit_federal");
  const grossCA = val("ca_bbce_gross_limit"); used("ca_bbce_gross_limit");
  const netLimitMult = val("net_income_limit"); used("net_income_limit");
  used("asset_test_waived_ca");

  // Adversarial discrimination hook (B4): when categorical eligibility is deliberately
  // disabled, the CA 200% BBCE override collapses to the federal 130% default — this MUST
  // make the INDEPENDENT flip cases FAIL, proving the eval measures correctness, not plumbing.
  const breakCategorical = (typeof process !== "undefined" && process.env && process.env.ONEDOOR_BREAK === "categorical");
  const effectiveGrossCA = breakCategorical ? grossFed : grossCA;

  const grossLimitFederal = round2(fplM * grossFed);
  const grossLimitCA = round2(fplM * effectiveGrossCA);
  const netLimit = round2(fplM * netLimitMult);

  const passesGrossFederal = grossIncome <= grossLimitFederal;
  const passesGrossCA = grossIncome <= grossLimitCA;       // CA BBCE 200% FPL
  const passesNet = netIncome <= netLimit;
  // CA: asset test waived under BBCE
  const passesAsset = true;

  // THE FLIP: federal default would reject (gross>130%), CA BBCE accepts (gross<=200%).
  const federalDefaultVerdict = passesGrossFederal && passesNet && passesAsset;
  const caCategoricallyEligible = passesGrossCA && passesAsset; // BBCE: gross<=200% + asset waived
  const flip = !passesGrossFederal && passesGrossCA;

  // --- status/date gates (H.R.1) -----------------------------------------------------------
  let uncertainFacts = [];
  const eligibleMembers = members.filter((m) => {
    const g = immigrationGate(m, today);
    if (g.uncertain) {
      uncertainFacts.push({ kind: "immigration_status", member: m.label || m.id || "member", detail: g.reason, provenance: g.prov || prov("hr1_immigrant_eligibility") });
      if (g.prov) provenance.push(g.prov);
    }
    if (!g.eligible) why.push(`Excluded member: ${g.reason}`);
    return g.eligible;
  });
  const immigrationRemovedAll = members.length > 0 && eligibleMembers.length === 0;

  // ABAWD time-limit risk (does not zero the benefit, but flags time-limit + reduces confidence)
  let abawdRisk = null;
  for (const m of members) {
    const a = abawdGate(m, county, today);
    if (a.prov) provenance.push(a.prov);
    if (a.at_risk) { abawdRisk = a; why.push(`Work-requirement risk: ${a.reason}`); }
  }

  // --- benefit computation (273.10) --------------------------------------------------------
  const maxAllot = maxAllotment(size); used("max_allotment");
  const reduction = val("benefit_reduction_rate"); used("benefit_reduction_rate");
  let benefit = Math.max(0, Math.round(maxAllot - reduction * netIncome));
  const minAllot = val("min_allotment");
  let appliedMin = false;
  if (benefit < minAllot && (size === 1 || size === 2) && caCategoricallyEligible && passesNet) {
    benefit = minAllot; appliedMin = true; used("min_allotment");
  }

  // --- verdict ------------------------------------------------------------------------------
  let status, confidence;
  if (immigrationRemovedAll) {
    status = "likely_not_eligible";
    confidence = 0.6;
    why.unshift("All household members appear ineligible under 2026 noncitizen rules — verify with a navigator.");
  } else if (!caCategoricallyEligible) {
    status = "likely_not_eligible";
    confidence = 0.85;
    why.unshift(`Gross income $${grossIncome}/mo exceeds the CA limit of $${grossLimitCA}/mo (200% FPL for a household of ${size}).`);
    benefit = 0;
  } else if (caCategoricallyEligible && benefit > 0) {
    status = "likely_eligible";
    confidence = passesNet ? 0.9 : 0.78;
    if (flip) why.unshift(`Federal default (130% FPL = $${grossLimitFederal}/mo) would say NO, but California's broad-based categorical eligibility raises the gross limit to 200% FPL ($${grossLimitCA}/mo) and waives the asset test — so this household qualifies.`);
    why.push(`Estimated monthly benefit: max allotment $${maxAllot} minus 30% of net income $${netIncome} = $${benefit}.`);
  } else {
    // categorically eligible but $0 benefit (net income too high to produce an allotment for 3+)
    status = "possibly_eligible";
    confidence = 0.7;
    why.unshift("May be eligible to enroll, but the estimated benefit computes to $0 at this income — applying confirms status and any change in circumstances.");
  }

  // ABAWD time limit lowers confidence + adds a navigator-relevant caveat
  if (abawdRisk && (status === "likely_eligible" || status === "possibly_eligible")) {
    confidence = Math.min(confidence, 0.72);
    warnings.push("Subject to ABAWD 3-month time limit unless work requirement met or exemption applies.");
  }

  const result = {
    program: "CalFresh",
    status,
    monthly_benefit: status === "likely_eligible" ? benefit : (status === "possibly_eligible" ? benefit : 0),
    currency: "USD/month",
    confidence: round2(confidence),
    today,
    county,
    household_size: size,
    inputs_echo: { monthly_earned_income: earned, monthly_unearned_income: unearned, shelter_cost_monthly: num(hh.shelter_cost_monthly), utilities_monthly: num(hh.utilities_monthly) },
    computation: {
      gross_income: grossIncome,
      standard_deduction: stdDed,
      earned_income_deduction: earnedDed,
      dependent_care_deduction: depCare,
      medical_deduction: medical,
      excess_shelter_deduction: excessShelter,
      shelter_capped: shelterCapped,
      net_income: netIncome,
      fpl_monthly: round2(fplM),
      gross_limit_federal_130: grossLimitFederal,
      gross_limit_ca_200: grossLimitCA,
      net_limit_100: netLimit,
      passes_gross_federal: passesGrossFederal,
      passes_gross_ca: passesGrossCA,
      passes_net: passesNet,
      asset_test_waived: passesAsset,
      max_allotment: maxAllot,
      min_allotment_applied: appliedMin,
      federal_default_verdict: federalDefaultVerdict ? "eligible" : "not_eligible",
      ca_categorically_eligible: caCategoricallyEligible,
      flip_federal_not_to_ca_eligible: flip,
    },
    why,
    warnings,
    uncertain_facts: uncertainFacts,     // facts Opus must verify (live call), never assert
    abawd_risk: abawdRisk,
    engine_provenance: dedupeProv(provenance),
    disclaimer: DISCLAIMER,
    navigator_fallback: { action: "talk_to_navigator", phone: "1-877-847-3663", url: "https://www.getcalfresh.org", note: "CalFresh Benefits Helpline — apply or talk to a navigator." },
    ruleset_id: RULES.ruleset_id,
    schema_version: "1.0.0",
  };
  return result;
}

function needMoreInfo(missing) {
  return {
    program: "CalFresh",
    status: "needs_more_info",
    missing,
    monthly_benefit: null,
    disclaimer: DISCLAIMER,
    fallback: { action: "apply", url: "https://www.getcalfresh.org", phone: "1-877-847-3663" },
    engine_provenance: [],
    schema_version: "1.0.0",
  };
}

// ---- recommendations: other CA programs off the same household (NO dollar figures) --------
export function recommendStack(hh, calfreshResult) {
  const recs = [];
  const size = hh.household_size ?? (hh.members ? hh.members.length : 1);
  const fplM = fplMonthly(size);
  const gross = num(hh.monthly_earned_income) + num(hh.monthly_unearned_income);
  const calfreshYes = calfreshResult && (calfreshResult.status === "likely_eligible" || calfreshResult.status === "possibly_eligible");
  const members = hh.members || [];
  const hasChildUnder5 = members.some((m) => (m.age ?? 99) < 5);
  const hasSchoolKid = members.some((m) => (m.age ?? 0) >= 5 && (m.age ?? 0) <= 18);
  const isPregnant = members.some((m) => m.is_pregnant);

  if (calfreshYes && (hasChildUnder5 || isPregnant))
    recs.push({ program: "WIC", reason: "CalFresh enrollment is adjunctively income-eligible for WIC; you have a child under 5 or are pregnant.", adjunctive_or_threshold_citation: { source_id: "7CFR-273.2j", note: "WIC adjunctive eligibility via SNAP participation (7 CFR 246.7)" }, next_step: "Call 1-888-942-9675 (WIC) or apply at myfamily.wic.ca.gov." });
  if (calfreshYes && hasSchoolKid)
    recs.push({ program: "Free/Reduced School Meals (direct certification)", reason: "Children in CalFresh households are directly certified for free school meals — no separate application.", adjunctive_or_threshold_citation: { source_id: "CDSS-MPP-63", note: "NSLP direct certification via SNAP" }, next_step: "Your school district enrolls you automatically; confirm with the school office." });
  if (calfreshYes && hasSchoolKid)
    recs.push({ program: "SUN Bucks (Summer EBT)", reason: "School-age children in CalFresh households are automatically eligible for Summer EBT food benefits.", adjunctive_or_threshold_citation: { source_id: "CDSS-MPP-63", note: "Summer EBT auto-enrollment via SNAP/NSLP" }, next_step: "Issued automatically each summer to your EBT card." });
  if (calfreshYes)
    recs.push({ program: "CA LifeLine (discounted phone/internet)", reason: "CalFresh participation is a qualifying program for the CA LifeLine telephone discount.", adjunctive_or_threshold_citation: { source_id: "CDSS-ACL-BBCE", note: "LifeLine program-based eligibility" }, next_step: "Apply at californialifeline.com." });
  if (gross <= fplM * 2.0)
    recs.push({ program: "CARE/FERA (utility discount)", reason: "Household income appears at or below the CARE threshold (~200% FPL) for a 20-35% utility bill discount.", adjunctive_or_threshold_citation: { source_id: "HHS-FPL-2025", note: "CPUC CARE income threshold (~200% FPL)" }, next_step: "Apply through your utility (PG&E/SCE/SDG&E)." });
  if (gross <= fplM * 1.38)
    recs.push({ program: "Medi-Cal", reason: "Household income appears below the Medi-Cal MAGI threshold (~138% FPL for adults).", adjunctive_or_threshold_citation: { source_id: "HHS-FPL-2025", note: "Medi-Cal MAGI adult threshold ~138% FPL" }, next_step: "Apply at coveredca.com or benefitscal.com." });
  recs.push({ program: "CalEITC / Young Child Tax Credit", reason: "Low-to-moderate earned income may qualify for the California Earned Income Tax Credit (and YCTC if you have a child under 6).", adjunctive_or_threshold_citation: { source_id: "HHS-FPL-2025", note: "CalEITC earned-income thresholds" }, next_step: "File a CA tax return (free at ftb.ca.gov) even if not otherwise required." });
  return recs; // NONE carry a dollar figure (anti-overclaim; only CalFresh is engine-computed)
}

// ---- small numeric utils ------------------------------------------------------------------
function num(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
function dedupeProv(arr) {
  const seen = new Set(); const out = [];
  for (const p of arr) { if (seen.has(p.rule)) continue; seen.add(p.rule); out.push(p); }
  return out;
}

export const ENGINE_META = { ruleset_id: RULES.ruleset_id, as_of_date: RULES.as_of_date, disclaimer: DISCLAIMER };
