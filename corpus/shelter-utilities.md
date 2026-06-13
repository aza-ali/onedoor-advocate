# Shelter & Utilities — Excess Shelter Deduction, SUA, 50% Shelter Threshold

**Section ID:** shelter-utilities
**Rule keys:** `excess_shelter_cap`, `standard_utility_allowance`, `shelter_income_share`
**Primary source:** 7 CFR 273.9(d)(6); USDA FNS FY2026 COLA memo; CDSS Standard Utility Allowance tables (MPP Division 63)
**As of:** FY2026 (federal SNAP fiscal year 2025-10-01 → 2026-09-30)

---

## 1. The 50% shelter-cost threshold and the excess shelter deduction — 7 CFR 273.9(d)(6)(ii)

Regulatory text (close paraphrase / quote of 7 CFR 273.9(d)(6)):

> "(6) **Excess shelter deduction.** A monthly excess shelter deduction shall be allowed to the extent that **shelter costs exceed 50 percent of the household's monthly income** after all other deductions in paragraphs (d)(1) through (d)(5) of this section have been allowed.
>
> (ii) The shelter deduction **shall not exceed the maximum shelter deduction limit** established for the area … **unless the household contains a member who is elderly or disabled** … For such households (containing an elderly or disabled member) the excess shelter deduction **shall not be subject to the maximum limit** [i.e., it is uncapped]."

This establishes two of the three rules:

- **`shelter_income_share` = 0.50** — shelter costs counted only to the extent they exceed **50%** of income after the other deductions. Grounded in 273.9(d)(6)(ii). Effective since the deduction's origin (1977); no expiration.
- **`excess_shelter_cap`** — the deduction is capped at the FY-set maximum **except** households with an elderly or disabled member, for whom it is **uncapped**. Grounded in 273.9(d)(6)(ii).

**FY2026 cap value (48 contiguous states & DC):** **$744 / month**, effective **2025-10-01 through 2026-09-30**, per the USDA FNS FY2026 Cost-of-Living Adjustment memorandum. (FY2025 was $712; the FY2026 COLA raised it to $744.)

Source URL (regulation): https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
Source URL (FY2026 cap value): https://www.fns.usda.gov/snap/allotment/COLA

---

## 2. Standard Utility Allowance (SUA) — 7 CFR 273.9(d)(6)(iii) + CDSS tables

Regulatory text (close paraphrase of 7 CFR 273.9(d)(6)(iii)):

> "(iii) **Standard utility allowances.** … a State agency **may use standard utility allowances** (an amount that **includes heating and cooling costs**, the HCSUA) in place of actual costs in computing the shelter deduction … The State agency may make use of a standard utility allowance **mandatory** for all households with qualifying utility costs … The standards must be reviewed annually and adjusted to reflect changes in utility costs."

California (CDSS, MPP Division 63) sets the SUA amounts annually and **mandates** use of the standard (rather than actual utility costs) for qualifying households. The Heating and Cooling Standard Utility Allowance (HCSUA) — applicable when a household incurs heating/cooling costs — is the figure used here.

**FY2026 California HCSUA value:** **$663 / month**, effective **2025-10-01 through 2026-09-30** (CDSS adjusts the SUA on the federal fiscal-year cycle).

Source URL (regulation): https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
Source URL (CA SUA tables): https://www.cdss.ca.gov/inforesources/calfresh/eligibility-and-issuance-requirements

**Grounding caveat:** the federal regulation authorizes and mandates the SUA mechanism, but the dollar figure is set by CDSS and changes annually. The $663 figure is the published CA HCSUA for the Oct-2025 cycle. Because the precise CDSS dollar amount is the state-set, annually-volatile component (not fixed by CFR), it carries lower confidence than the CFR-fixed rules and should be re-verified against the live CDSS SUA chart each fiscal year.

---

## 3. Grounding verdict

| Rule key | rules.json value | Law (FY2026) | Grounded? |
|---|---|---|---|
| `excess_shelter_cap` | 744 | $744/mo cap (48 states+DC); uncapped if elderly/disabled member | YES — matches 273.9(d)(6)(ii) + FY2026 COLA |
| `shelter_income_share` | 0.50 | 50% of income after other deductions | YES — matches 273.9(d)(6)(ii) |
| `standard_utility_allowance` | 663 | CA HCSUA $663/mo (CDSS, Oct-2025 cycle) | YES — matches published CA HCSUA; state-set, re-verify annually |

All three values in `config/rules.json` are correctly grounded in the cited law for FY2026.
The `standard_utility_allowance` carries a standing **re-verification flag** (state-set, annually-adjusted figure), not a discrepancy.
