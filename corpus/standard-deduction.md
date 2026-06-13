# SNAP Standard Deduction — FY2026 (CalFresh / 48 Contiguous States & DC)

## Rule
The standard deduction is a fixed dollar amount subtracted from a household's
income when computing net monthly income for SNAP/CalFresh. Its size depends on
household size and is adjusted annually by USDA-FNS via the cost-of-living
adjustment (COLA).

## Governing Regulation — 7 CFR 273.9(d)(1)

> "Standard deduction. A standard deduction per household per month [is allowed].
> The standard deduction for household sizes one through six shall be equal to
> 8.31 percent of the monthly net income eligibility standard … for the
> corresponding household size, rounded up to the nearest whole dollar, except
> that the standard deduction shall not be less than the applicable minimum
> standard deduction. The standard deduction for households of more than six
> persons shall be equal to the standard deduction for a six-person household."

In FY2026 the minimum standard deduction floor binds for the smallest households
(sizes 1–4 use the floor / a single rounded figure for 1–3), with larger
households (5, 6+) exceeding the floor under the 8.31% computation. The specific
dollar figures for each fiscal year are published by USDA-FNS in the annual
SNAP COLA memorandum, which is the controlling numeric source.

Citation: 7 CFR 273.9(d)(1) — Income and deductions; standard deduction.
URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9

Numeric source: USDA FNS — "SNAP — Fiscal Year 2026 Cost-of-Living Adjustments."
URL: https://www.fns.usda.gov/snap/allotment/COLA

## FY2026 Values (48 contiguous states & DC)

| Household size | Standard deduction / month |
|----------------|----------------------------|
| 1              | $209                       |
| 2              | $209                       |
| 3              | $209                       |
| 4              | $223                       |
| 5              | $261                       |
| 6 or more      | $299                       |

Effective dates: 2025-10-01 through 2026-09-30 (federal fiscal year 2026).

These are the federal values; California (CDSS, MPP Division 63) applies the
federal standard deduction unchanged for the 48-state/DC region. CalFresh does
not set a separate state standard deduction — it uses the USDA-FNS COLA figures.

## Grounding Verdict

The value in `config/rules.json` for `standard_deduction`
(`{"1":209,"2":209,"3":209,"4":223,"5":261,"6_plus":299}`,
source_id `USDA-FNS-COLA-FY2026`, effective 2025-10-01 to 2026-09-30) **matches**
the FY2026 USDA-FNS COLA standard deduction schedule and the structure mandated
by 7 CFR 273.9(d)(1). **GROUNDED = TRUE.**
