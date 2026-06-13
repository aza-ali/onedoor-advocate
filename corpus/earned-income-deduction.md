# Earned Income Deduction (20%)

## Rule
SNAP/CalFresh households receive a deduction equal to **20 percent of gross earned income** when computing net income. This deduction accounts for taxes and work-related expenses and is applied before other deductions (standard deduction, dependent care, shelter).

## Statutory / Regulatory Text

**7 CFR 273.9(d)(2) — Earned income deduction:**

> "Twenty percent of gross earned income as defined in paragraph (b)(1) of this section. Earnings excluded in paragraph (c) of this section shall not be included in gross earned income for purposes of this deduction."

This implements section 5(e)(2) of the Food and Nutrition Act of 2008 (7 U.S.C. 2014(e)(2)), which establishes the earned-income deduction at 20 percent.

## California (CalFresh) Adoption
California adopts the federal earned income deduction without modification. CDSS Manual of Policies and Procedures (MPP) Division 63 (§ 63-502.3) mirrors the federal 20 percent earned income deduction.

## Citation
- **Primary:** 7 CFR 273.9(d)(2)
  - URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- **Authorizing statute:** 7 U.S.C. 2014(e)(2) (Food and Nutrition Act of 2008, sec. 5(e)(2))
- **CA implementation:** CDSS MPP Division 63 (§ 63-502.3)

## Value (FY2026)
- `earned_income_deduction_rate` = **0.20** (20 percent of gross earned income)

## Effective Dates
The 20 percent earned income deduction rate is a fixed statutory/regulatory percentage with no scheduled expiration. It is not subject to the annual cost-of-living adjustment (the COLA adjusts allotments, the standard deduction, and shelter caps, not this rate). Effective continuously since the deduction was established (set at 20% by the Food Security Act of 1985, codified in current form); effective_to = null (open-ended).

## Grounding Check
The value in `config/rules.json` for `earned_income_deduction_rate` is **0.20**, which exactly matches 7 CFR 273.9(d)(2) ("Twenty percent of gross earned income"). **CORRECTLY GROUNDED — grounded=true.**
