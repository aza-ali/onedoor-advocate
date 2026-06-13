# RULESET.md — One Door · CalFresh CA FY2026

Human-readable companion to [`config/rules.json`](config/rules.json).

- **ruleset_id:** `calfresh-ca-2026`
- **as_of_date:** 2026-06-13
- **fiscal_year:** FY2026 (SNAP federal fiscal year 2025-10-01 → 2026-09-30)

Every constant below is grounded in cited published law and cross-checked against the
independently-maintained PolicyEngine-US oracle (`policyengine_us`) on 2026-06-13. Each rule
lists `{value, source_id, source_url, paragraph, effective_from/to, verified_at, confidence}`.
Pre-staged source text lives in `corpus/`.

> **To rerun for a different day or a different household: edit only `config/rules.json`
> (constants) and `test/personas.yaml` (cases). Nothing else. See the closing note.**

---

## Sources

| source_id | title | url |
|---|---|---|
| `7CFR-273.9` | 7 CFR 273.9 — Income and deductions | https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9 |
| `7CFR-273.10` | 7 CFR 273.10 — Determining household eligibility and benefit levels | https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.10 |
| `7CFR-273.2j` | 7 CFR 273.2(j) — Categorical eligibility for SNAP | https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-B/section-273.2 |
| `USDA-FNS-COLA-FY2026` | USDA FNS SNAP Fiscal Year 2026 Cost-of-Living Adjustments | https://www.fns.usda.gov/snap/allotment/COLA |
| `HHS-FPL-2025` | HHS 2025 Poverty Guidelines (used for FY2026 SNAP) | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines |
| `CDSS-MPP-63` | CDSS Manual of Policies and Procedures, Division 63 (CalFresh) | https://www.cdss.ca.gov/inforesources/calfresh/eligibility-and-issuance-requirements |
| `CDSS-ACL-BBCE` | CDSS All-County Letter — Modified Categorical Eligibility (BBCE), 200% FPL gross / asset-test waiver | https://www.cdss.ca.gov/inforesources/calfresh |
| `HR1-2026` | H.R.1 (2026) — SNAP immigrant-eligibility & ABAWD work-requirement amendments | https://www.congress.gov/bill/119th-congress/house-bill/1 |

---

## Rules

### max_allotment
- **value:** `{1: 298, 2: 546, 3: 785, 4: 994, 5: 1183, 6: 1421, 7: 1571, 8: 1789, each_additional: 219}`
- **source_id:** `USDA-FNS-COLA-FY2026`
- **source_url:** https://www.fns.usda.gov/snap/allotment/COLA
- **paragraph:** Maximum monthly allotment, 48 contiguous states & DC, effective 2025-10-01 through 2026-09-30.
- **effective_from / to:** 2025-10-01 → 2026-09-30
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### min_allotment
- **value:** `23`
- **source_id:** `7CFR-273.10`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.10
- **paragraph:** 273.10(e)(2)(ii)(C): eligible 1- and 2-person households receive a minimum benefit (FY2026 = $23).
- **effective_from / to:** 2025-10-01 → 2026-09-30
- **verified_at:** 2026-06-13 · **confidence:** 0.97

### standard_deduction
- **value:** `{1: 209, 2: 209, 3: 209, 4: 223, 5: 261, 6_plus: 299}`
- **source_id:** `USDA-FNS-COLA-FY2026`
- **source_url:** https://www.fns.usda.gov/snap/allotment/COLA
- **paragraph:** Standard deduction by household size, 48 contiguous states & DC, FY2026.
- **effective_from / to:** 2025-10-01 → 2026-09-30
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### earned_income_deduction_rate
- **value:** `0.20`
- **source_id:** `7CFR-273.9`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- **paragraph:** 273.9(d)(2): 20 percent of gross earned income is deducted.
- **effective_from / to:** 1977-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### excess_shelter_cap
- **value:** `744`
- **source_id:** `USDA-FNS-COLA-FY2026`
- **source_url:** https://www.fns.usda.gov/snap/allotment/COLA
- **paragraph:** 273.9(d)(6)(ii): excess shelter deduction capped at $744/mo (FY2026) unless a household member is elderly or disabled (then uncapped).
- **effective_from / to:** 2025-10-01 → 2026-09-30
- **verified_at:** 2026-06-13 · **confidence:** 0.98

### standard_utility_allowance (SUA)
- **value:** `663`
- **source_id:** `CDSS-MPP-63`
- **source_url:** https://www.cdss.ca.gov/inforesources/calfresh/eligibility-and-issuance-requirements
- **paragraph:** 273.9(d)(6)(iii) + CDSS SUA tables: a household incurring heating/cooling utility costs uses the CA Standard Utility Allowance (FY2026 ~ $663/mo) in place of actual utility costs when computing the shelter deduction.
- **effective_from / to:** 2025-10-01 → 2026-09-30
- **verified_at:** 2026-06-13 · **confidence:** 0.90

### shelter_income_share
- **value:** `0.50`
- **source_id:** `7CFR-273.9`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- **paragraph:** 273.9(d)(6)(ii): shelter costs exceeding 50% of income (after other deductions) are the excess shelter deduction.
- **effective_from / to:** 1977-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### benefit_reduction_rate
- **value:** `0.30`
- **source_id:** `7CFR-273.10`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.10
- **paragraph:** 273.10(e)(2)(ii): benefit = max allotment minus 30% of net monthly income.
- **effective_from / to:** 1977-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### gross_income_limit_federal
- **value:** `1.30` (130% FPL)
- **source_id:** `7CFR-273.9`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- **paragraph:** 273.9(a)(1): gross monthly income must be at or below 130% of the federal poverty guideline.
- **effective_from / to:** 1977-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### net_income_limit
- **value:** `1.00` (100% FPL)
- **source_id:** `7CFR-273.9`
- **source_url:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- **paragraph:** 273.9(a)(2): net monthly income must be at or below 100% of the federal poverty guideline.
- **effective_from / to:** 1977-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### ca_bbce_gross_limit
- **value:** `2.00` (200% FPL)
- **source_id:** `CDSS-ACL-BBCE`
- **source_url:** https://www.cdss.ca.gov/inforesources/calfresh
- **paragraph:** California Modified Categorical Eligibility (BBCE) under 7 CFR 273.2(j): gross income screen raised to 200% FPL and the resource/asset test waived for most households. This is the CA override that flips working households the federal 130% default rejects.
- **effective_from / to:** 2021-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.95

### asset_test_waived_ca
- **value:** `true`
- **source_id:** `CDSS-ACL-BBCE`
- **source_url:** https://www.cdss.ca.gov/inforesources/calfresh
- **paragraph:** Under CA BBCE, the SNAP resource/asset limit is waived for most non-elderly/non-disabled households.
- **effective_from / to:** 2021-01-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.95

### fpl_2025_annual
- **value:** `{1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650, 6: 43150, 7: 48650, 8: 54150, each_additional: 5500}`
- **source_id:** `HHS-FPL-2025`
- **source_url:** https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
- **paragraph:** 2025 HHS Poverty Guidelines, 48 contiguous states & DC; used for FY2026 SNAP eligibility (monthly = annual / 12).
- **effective_from / to:** 2025-01-15 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.99

### hr1_immigrant_eligibility ⚠️ KNOWN_GAP
- **value:** `{effective_date: 2026-04-01, newly_ineligible_statuses: [refugee_humanitarian_post_cutoff, certain_parolees, compact_of_free_association_pending]}`
- **source_id:** `HR1-2026`
- **source_url:** https://www.congress.gov/bill/119th-congress/house-bill/1
- **paragraph:** H.R.1 (2026) narrows SNAP-eligible noncitizen categories effective 2026-04-01. Lawful permanent residents meeting prior rules and pre-cutoff grandfathered statuses remain eligible; certain humanitarian/parolee categories newly ineligible on or after 2026-04-01.
- **effective_from / to:** 2026-04-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.80
- **⚠️ KNOWN_GAP:** Exact post-H.R.1 noncitizen category mapping is a high-uncertainty seam — flagged for live county-line verification rather than asserted. Mixed-status households keep their citizen-child eligibility; the affected adult is flagged `has_uncertain_fact` rather than scored as a hard deny.

### hr1_abawd_work_requirement ⚠️ KNOWN_GAP (low confidence)
- **value:** `{effective_date: 2026-06-01, min_hours_per_week: 20, age_min: 18, age_max: 64, dependent_age_threshold: 14, time_limit_months: 3}`
- **source_id:** `HR1-2026`
- **source_url:** https://www.congress.gov/bill/119th-congress/house-bill/1
- **paragraph:** H.R.1 (2026) expands ABAWD time limits effective 2026-06-01: able-bodied adults 18-64 without a dependent under age 14 must work/participate ≥20 hours/week or lose benefits after 3 months, unless they live in a USDA-approved waiver county.
- **effective_from / to:** 2026-06-01 → (open)
- **verified_at:** 2026-06-13 · **confidence:** 0.82 (below the high-confidence bar — treat as a flagged seam)

### abawd_waiver_counties_ca ⚠️ KNOWN_GAP (time-bounded)
- **value:** `["Alpine", "Colusa", "Imperial", "Merced", "Monterey", "Plumas", "Tulare"]`
- **source_id:** `HR1-2026`
- **source_url:** https://www.congress.gov/bill/119th-congress/house-bill/1
- **paragraph:** California ABAWD time-limit waiver counties, effective through 2026-10-31. Residents of these counties are exempt from the ABAWD work requirement during the waiver window.
- **effective_from / to:** 2026-06-01 → 2026-10-31
- **verified_at:** 2026-06-13 · **confidence:** 0.85 — county list and waiver window expire 2026-10-31; re-verify against the live USDA waiver roster on any run dated after that.

---

## The by-the-book CalFresh monthly computation

This is the deterministic order of operations applied below. All dollar figures monthly.

1. **Gross income** = earned + unearned.
2. **Gross test:** compare gross to the FPL limit. Federal default = 130% FPL; **CA BBCE raises it to 200% FPL.** If gross > the applicable limit → NOT eligible (benefit $0).
3. **Earned-income deduction** = 20% × gross *earned* income.
4. **Standard deduction** by household size.
5. **Adjusted income** = gross − earned deduction − standard deduction (− other allowed deductions).
6. **Shelter deduction:** shelter cost = rent/mortgage + SUA ($663). Excess shelter = shelter cost − (50% × adjusted income). **Capped at $744** (uncapped if a member is elderly/disabled).
7. **Net income** = adjusted income − excess shelter deduction (floored at $0).
8. **Net test:** net ≤ 100% FPL.
9. **Benefit** = max allotment(size) − 30% × net income, rounded; floored at $0; min allotment ($23) for eligible 1–2 person households.

---

## Hand-worked INDEPENDENT oracle cases

These show the full by-the-book arithmetic, worked from the cited statute and the FY2026 tables —
**not** copied from any black-box calculator. Inputs read from `test/personas.yaml`.

FY2026 monthly FPL = annual ÷ 12. For reference:
- size 2: $21,150/yr → $1,762.50/mo. 130% = $2,291.25 · 200% = $3,525.00
- size 3: $26,650/yr → $2,220.83/mo. 130% = $2,887.08 · 200% = $4,441.67
- size 4: $32,150/yr → $2,679.17/mo. 100% = $2,679.17

---

### Case `flip-01` — the hero flip (federal-NO → CA-YES)

**Inputs** (`flip-01`): county San Francisco, household_size **3**, monthly_earned_income **$3,500**,
shelter_cost_monthly **$2,200**, members ages 34 / 6 / 9. Period 2026-06.

**1. Gross income** = $3,500 (all earned; no unearned).

**2. Gross test — the flip.**
- Size-3 monthly FPL = $26,650 ÷ 12 = **$2,220.83**.
- **Federal 130%** limit = 1.30 × $2,220.83 = **$2,887.08**. Gross $3,500 > $2,887.08 → **federal default: NOT eligible.**
- **CA BBCE 200%** limit = 2.00 × $2,220.83 = **$4,441.67**. Gross $3,500 ≤ $4,441.67 → **CA: passes gross test.**
- → `flip_federal_not_to_ca_eligible: true`. (Asset test waived under CA BBCE.)

**3. Earned-income deduction** = 0.20 × $3,500 = **$700.00**.

**4. Standard deduction** (size 3) = **$209**.

**5. Adjusted income** = $3,500 − $700 − $209 = **$2,591.00**.

**6. Shelter deduction.**
- Shelter cost = rent $2,200 + SUA $663 = **$2,863.00**.
- 50% of adjusted income = 0.50 × $2,591 = **$1,295.50**.
- Excess shelter = $2,863 − $1,295.50 = **$1,567.50**.
- Cap = **$744** (no elderly/disabled member) → excess shelter = **$744.00** (capped).

**7. Net income** = $2,591 − $744 = **$1,847.00**.

**8. Net test:** size-3 100% FPL = $2,220.83. Net $1,847 ≤ $2,220.83 → **passes.**

**9. Benefit** = max allotment(3) − 0.30 × net
- = $785 − (0.30 × $1,847) = $785 − $554.10 = **$230.90 → $231/mo**.

**Verdict: `likely_eligible`, `flip_federal_not_to_ca_eligible: true`, `monthly_benefit = $231`.** ✓ (expected $231, margin 40)

---

### Case `zero-income-4p` — zero income → maximum allotment

**Inputs** (`zero-income-4p`): county Fresno, household_size **4**, monthly_earned_income **$0**,
no shelter cost given, members ages 35 / 38 / 7 / 10. Period 2026-06.

**1. Gross income** = $0.

**2. Gross test:** $0 ≤ any limit (federal 130% size-4 = $3,482.92; CA 200% = $5,358.33) → **passes.**

**3. Earned-income deduction** = 0.20 × $0 = $0.

**4. Standard deduction** (size 4) = $223 — but with $0 income there is nothing to deduct against.

**5. Adjusted income** = max($0 − $0 − $223, 0) = **$0.00**.

**6. Shelter deduction:** no shelter cost provided; excess shelter = max($663 SUA − 0.50×$0, 0) but with adjusted income already $0, **net cannot go below $0**.

**7. Net income** = **$0.00**.

**8. Net test:** $0 ≤ size-4 100% FPL ($2,679.17) → **passes.**

**9. Benefit** = max allotment(4) − 0.30 × $0 = **$994 − $0 = $994/mo** (the maximum allotment).

**Verdict: `likely_eligible`, `monthly_benefit = $994`.** ✓ (expected $994, margin 40)

---

### Case `over-income-2p` — over 200% FPL → NOT eligible

**Inputs** (`over-income-2p`): county San Mateo, household_size **2**, monthly_earned_income **$5,000**,
shelter_cost_monthly **$2,000**, members ages 45 / 47. Period 2026-06.

**1. Gross income** = $5,000 (all earned).

**2. Gross test — fails at the CA ceiling.**
- Size-2 monthly FPL = $21,150 ÷ 12 = **$1,762.50**.
- **CA BBCE 200%** limit = 2.00 × $1,762.50 = **$3,525.00**.
- Gross $5,000 > $3,525.00 (≈ 283% FPL) → **fails the gross test even under the most generous CA screen.**
- Because the gross test is a hard gate, the deduction/net computation is never reached.

**9. Benefit** = **$0** (ineligible; no allotment).

**Verdict: `likely_not_eligible`, `monthly_benefit = $0`.** ✓ (expected $0, margin 40)

---

## What changes for a rerun tomorrow

**Edit only two files. Touch nothing else.**

1. **`config/rules.json`** — all constants and their provenance. If a COLA table, FPL guideline,
   SUA, shelter cap, BBCE percentage, or an H.R.1 seam (effective date, ABAWD parameters, waiver
   county list/window, immigrant category mapping) changes, update the `value` plus its
   `effective_from/to`, `verified_at`, and `confidence` here. The arithmetic engine and this
   companion read every number from this file — no constants are hard-coded elsewhere.

2. **`test/personas.yaml`** — the household inputs and expected outputs (the oracle cases). Add or
   edit a case's `input` (today, county, household_size, incomes, shelter, members) and its
   expected `output`. The `meta.today` field and each case's `today` are explicit args, so the
   date-deterministic H.R.1 seams (4/1 immigrant cutoff, 6/1 ABAWD, 10/31 waiver expiry) re-derive
   correctly for any run date.

After editing those two files, re-run the eval; the INDEPENDENT cases above re-derive by the same
nine-step computation, and the POLICYENGINE_YAML cases re-cross-check against `policyengine_us`.

**Re-verification reminders (time-bounded values):**
- `abawd_waiver_counties_ca` expires **2026-10-31** — re-pull the live USDA waiver roster for any run after that date.
- `hr1_immigrant_eligibility` is a **KNOWN_GAP** (confidence 0.80) — confirm noncitizen category mapping at the live county line.
- FY2026 COLA tables (max allotment, standard deduction, excess shelter cap, SUA) expire **2026-09-30**; FY2027 values supersede on 2026-10-01.
