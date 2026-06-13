# FPL — 2025 HHS Poverty Guidelines (used for FY2026 SNAP / CalFresh)

## Rule section: `fpl`
Rule key: `fpl_2025_annual`

## Source / Citation

**2025 HHS Poverty Guidelines**, U.S. Department of Health and Human Services (HHS), Office of the Assistant Secretary for Planning and Evaluation (ASPE). Published in the **Federal Register, Vol. 90, No. 11, pp. 7791–7792 (January 17, 2025)** as "Annual Update of the HHS Poverty Guidelines."

- ASPE landing page: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
- Federal Register notice: https://www.federalregister.gov/documents/2025/01/17/2025-01300/annual-update-of-the-hhs-poverty-guidelines

These guidelines are the federal poverty levels SNAP uses for FY2026 eligibility tests. SNAP regulation **7 CFR 273.9(a)(1)–(2)** ties the gross-income limit (130% FPL) and net-income limit (100% FPL) to "the Federal poverty guidelines ... as adjusted ... published each year by the Department of Health and Human Services." The guidelines in effect for the federal fiscal year beginning October 1, 2025 (FY2026) are the **2025** HHS guidelines.

## Load-bearing regulatory/source paragraph

> "The 2025 poverty guidelines for the 48 contiguous states and the District of Columbia: $15,650 for a household of 1; and $5,500 added for each additional person. (1 person — $15,650; 2 — $21,150; 3 — $26,650; 4 — $32,150; 5 — $37,650; 6 — $43,150; 7 — $48,650; 8 — $54,150; for families/households with more than 8 persons, add $5,500 for each additional person.)"
> — 2025 HHS Poverty Guidelines, 90 FR 7791 (Jan 17, 2025).

Formula: base 1-person value $15,650 + $5,500 × (household size − 1).

## FY2026 numeric values (annual, 48 contiguous states & DC)

| Household size | Annual FPL | Monthly (annual ÷ 12) |
|---|---|---|
| 1 | $15,650 | $1,304.17 |
| 2 | $21,150 | $1,762.50 |
| 3 | $26,650 | $2,220.83 |
| 4 | $32,150 | $2,679.17 |
| 5 | $37,650 | $3,137.50 |
| 6 | $43,150 | $3,595.83 |
| 7 | $48,650 | $4,054.17 |
| 8 | $54,150 | $4,512.50 |
| each additional | +$5,500 | +$458.33 |

SNAP computes monthly income limits as **monthly = annual ÷ 12**, then applies 130% (gross) and 100% (net) multipliers.

## Effective dates

- 2025 HHS guidelines published/effective **January 15, 2025** (effective date in the FR notice; published Jan 17, 2025).
- Used for **SNAP FY2026 eligibility** (federal fiscal year October 1, 2025 – September 30, 2026).
- No later guideline supersedes these for FY2026.

## Grounding determination

The value in `config/rules.json` for `fpl_2025_annual` is:
`{ "1": 15650, "2": 21150, "3": 26650, "4": 32150, "5": 37650, "6": 43150, "7": 48650, "8": 54150, "each_additional": 5500 }`

This **matches the 2025 HHS Poverty Guidelines exactly** (all eight household-size values and the $5,500 per-additional-person increment). The rule is **correctly grounded**. `grounded = true`.
