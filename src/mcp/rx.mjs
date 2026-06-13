// Rx cost-pathways — NON-CLINICAL matching only (never substitution). Coverage-type is a
// deterministic HARD GATE: commercial -> copay card allowed; Medicare/Medicaid/TRICARE/VA ->
// copay card SUPPRESSED with a stated reason (OIG anti-kickback). Person-first ranking, never
// payer-first. GoodRx is NEVER exposed here and NEVER cached (consumer-only live fetch elsewhere).
const FEDERAL = new Set(["medicare", "medicaid", "tricare", "va"]);
const DISCLAIMER = "Non-clinical cost information only. Ask your prescriber or pharmacist before changing anything about your medication.";

export function rxSavingsPaths({ drug = "", coverage_type = "uninsured" } = {}) {
  const ct = String(coverage_type).toLowerCase();
  const isFederal = FEDERAL.has(ct);
  const paths = [];
  // copay card: ONLY for commercial coverage (federal members excluded at the gate)
  if (ct === "commercial") {
    paths.push({ kind: "manufacturer_copay_card", name: `${drug} manufacturer copay card`, note: "Commercial insurance only; can lower copay to as little as $0 for eligible patients." });
  } else if (isFederal) {
    paths.push({ kind: "copay_card_suppressed", name: "Copay card not available", note: `Federal program members (${ct}) are excluded from manufacturer copay cards under OIG anti-kickback rules.` });
  }
  // patient assistance programs (PAPs) — available regardless of coverage, income-based
  paths.push({ kind: "patient_assistance_program", name: `${drug || "Drug"} patient assistance program (PAP)`, note: "Manufacturer or NeedyMeds/RxAssist PAP for low-income patients; income documentation required." });
  // Cost Plus (Mark Cuban) — transparent cash price, no payer dependency
  paths.push({ kind: "cost_plus_pharmacy", name: "Mark Cuban Cost Plus Drugs", note: "Transparent cost-plus cash price; check costplusdrugs.com for the generic." });
  // SIRUM donated-medication routing for the lowest-income
  paths.push({ kind: "donated_medication", name: "SIRUM donated-medication network", note: "Free donated medications for qualifying low-income patients." });
  return {
    non_clinical: true,
    drug,
    coverage_type: ct,
    paths, // person-first ordering: same persona -> same ordering regardless of any revenue flag
    advice: DISCLAIMER,
    as_of_date: "2026-06-13",
    disclaimer: DISCLAIMER,
  };
}
