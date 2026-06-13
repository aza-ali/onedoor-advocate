# Gross Income Test — Federal 130% FPL (SNAP / CalFresh)

**Rule key:** `gross_income_limit_federal`
**Topic:** Federal gross monthly income eligibility test for SNAP
**Primary source:** 7 CFR 273.9(a)(1)

---

## Regulatory text (quoted / close paraphrase)

7 CFR 273.9(a) — *Income eligibility standards*:

> "(a) **Income eligibility standards.** Participation in the Program shall be limited to those households whose incomes are determined to be a substantial limiting factor in permitting them to obtain a more nutritious diet. ... households which do not contain an elderly or disabled member shall meet **both the net income eligibility standards and the gross income eligibility standards** ... Households which contain an elderly or disabled member shall meet the net income eligibility standards ...
>
> **(1) Gross income eligibility standards.** ... The **gross income eligibility standards** shall be based on the **130 percent of the Federal income poverty levels** prescribed for the appropriate household size and shall be revised by the appropriate percentage of the income poverty guidelines published each year by the Department of Health and Human Services."

In operative terms: a household's **gross monthly income must be at or below 130% (1.30×) of the applicable Federal Poverty Guideline** for its household size to satisfy the federal gross income test. (Households with an elderly or disabled member are exempt from the gross income test and need only meet the net income standard under 273.9(a)(2).)

## Citation

- **7 CFR 273.9(a)(1)** — Income and deductions; gross income eligibility standards.
- URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- The multiplier (130%) is a statutory/regulatory fixture under 7 U.S.C. 2014(c) and 7 CFR 273.9(a)(1). It is stable; the underlying dollar figures change annually with the HHS poverty guidelines, but the **130% factor itself does not change year to year**.

## FY2026 numeric value

- **Factor (multiplier): 1.30** (i.e., 130% of the Federal Poverty Guideline).
- Applied to the FY2026 SNAP standard (HHS 2025 Poverty Guidelines, 48 contiguous states & DC). Example monthly gross income limits (annual FPL ÷ 12 × 1.30, rounded per FNS convention):
  - 1 person: 15,650 / 12 × 1.30 ≈ **$1,696/mo**
  - 2 persons: 21,150 / 12 × 1.30 ≈ **$2,292/mo**
  - 3 persons: 26,650 / 12 × 1.30 ≈ **$2,888/mo**
  - 4 persons: 32,150 / 12 × 1.30 ≈ **$3,484/mo**
- The factor itself, `1.30`, is what `rules.json` stores; the dollar thresholds are derived at runtime from `fpl_2025_annual`.

## Effective dates

- The **130% factor** is a long-standing federal standard (in force since the modern income-test structure; `rules.json` records `effective_from: 1977-01-01`, `effective_to: null`).
- The dollar amounts it produces are tied to FY2026 (HHS 2025 guidelines, used for the SNAP year 2025-10-01 through 2026-09-30).

## California (CalFresh) note

California operates **Modified Categorical Eligibility (BBCE)** under 7 CFR 273.2(j), which raises the gross income screen to **200% FPL** and waives the asset test for most households. For the federal-default rule keyed here, the test remains **130%**; the CA 200% override is captured separately under `ca_bbce_gross_limit`. This file grounds ONLY the federal 130% default.

## Grounding verdict

**GROUNDED — TRUE.** `rules.json` → `gross_income_limit_federal.value = 1.30`, `source_id = "7CFR-273.9"`, paragraph cites `273.9(a)(1)`. This exactly matches 7 CFR 273.9(a)(1)'s 130%-of-poverty gross income standard. No discrepancy.
