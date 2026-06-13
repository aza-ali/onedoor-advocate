# H.R.1 (2026) — ABAWD Work-Requirement Expansion

**Rule key:** `hr1_abawd_work_requirement`
**Section id:** `hr1-abawd`
**Primary source:** H.R.1, 119th Congress — the "One Big Beautiful Bill Act," Title I (Agriculture), SNAP work-requirement provisions, amending **7 U.S.C. 2015(o)** (the Food and Nutrition Act of 2008, as codified). Enacted 2025-07-04 (Pub. L. 119-21).
**Engine effective date used:** 2026-06-01.

---

## What the law establishes

H.R.1 amends the able-bodied adults without dependents (ABAWD) time limit in **7 U.S.C. 2015(o)** (formerly framed by 7 CFR 273.24). Under the time limit, an ABAWD may receive SNAP for **no more than 3 months in any 36-month period** unless, during that period, the individual works or participates in a qualifying work/training activity for **at least 80 hours per month (equivalently >= 20 hours per week, averaged monthly)**.

H.R.1 changed two scope parameters that widen who is subject to the time limit:

1. **Upper age limit raised to 64.** Prior law applied the ABAWD time limit to adults age 18 through 54. H.R.1 raises the ceiling so the requirement applies to adults **age 18 through 64** (i.e., it now reaches "adults who are 65 years old and younger," which is everyone under 65).

2. **Dependent-child exemption narrowed to under 14.** Prior law exempted an individual responsible for a dependent child **under age 18**. H.R.1 narrows this so the exemption applies only when the household includes a **dependent child under age 14**; a parent/household member whose youngest dependent is 14 or older is now subject to the ABAWD requirement like a childless adult.

### Quoted / close-paraphrase statutory text

> "...this section raises the age for those who must meet these additional work requirements to include adults who are 65 years old and younger, whereas these requirements [previously] apply to adults who are 55 years old and younger."

> "...requires parents and household members to meet the additional work requirements (similar to someone who does not have a dependent child) if the [youngest] child is age 14 and older. [Previously], those with a child under the age of 18 are exempt from the requirements."

> Core time-limit text (7 U.S.C. 2015(o), unchanged in structure): no individual shall be eligible to continue to receive supplemental nutrition assistance program benefits for more than **3 months during any 36-month period** in which the individual does not work or participate in a work program **for 20 hours or more per week (averaging 80 hours per month)**, or comply with a workfare program.

**Geographic waivers.** USDA-approved area waivers (high-unemployment / insufficient-jobs counties) suspend the time limit for residents of those areas. California's waiver counties for the engine window are tracked separately under `abawd_waiver_counties_ca`.

---

## Citation

- **Statute amended:** 7 U.S.C. 2015(o) — SNAP work requirement / ABAWD time limit, as amended by H.R.1, 119th Congress (Pub. L. 119-21, "One Big Beautiful Bill Act," enacted 2025-07-04).
- **Bill:** https://www.congress.gov/bill/119th-congress/house-bill/1
- **Corroborating summaries:** NACo, "H.R. 1 and SNAP: What Counties Should Know" (https://www.naco.org/resource/hr-1-and-supplemental-nutrition-assistance-program-snap-what-counties-should-know); Ballotpedia, "Work requirements policies in the 2025 budget reconciliation bill (OBBBA)" (https://ballotpedia.org/Work_requirements_policies_in_the_2025_budget_reconciliation_bill_(One_Big_Beautiful_Bill_Act)).

---

## FY2026 numeric values

| Parameter | Value | Source |
|---|---|---|
| Age range subject to requirement | 18–64 (inclusive) | H.R.1 amendment to 7 U.S.C. 2015(o) |
| Dependent-child exemption threshold | child under age 14 | H.R.1 amendment |
| Minimum work / participation | >= 20 hr/week (80 hr/month) | 7 U.S.C. 2015(o)(2) |
| Time limit | 3 months per 36-month period | 7 U.S.C. 2015(o)(2) |
| Engine effective date | 2026-06-01 | engine scenario date |

---

## Grounding statement

The `hr1_abawd_work_requirement` value in `config/rules.json` — `{ effective_date: "2026-06-01", min_hours_per_week: 20, age_min: 18, age_max: 64, dependent_age_threshold: 14, time_limit_months: 3 }` — **is correctly grounded** in H.R.1's amendment to 7 U.S.C. 2015(o): age 18–64, dependent-child exemption threshold of under 14, the >=20 hr/week (80 hr/month) participation floor, and the 3-month-per-36-month time limit all match the enacted law. The `min_hours_per_week: 20` is the weekly expression of the statute's "80 hours per month" floor; both are equivalent. The `effective_date: 2026-06-01` is the engine's scenario date, not a date stated in the statute itself (H.R.1 was enacted 2025-07-04 with rolling implementation) — this is a deliberate engine convention, not a discrepancy with the law's substantive parameters.
