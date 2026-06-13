# ca-bbce — California Modified Categorical Eligibility (MCE / BBCE)

Rule keys grounded here: `ca_bbce_gross_limit`, `asset_test_waived_ca`

## What this section establishes

California operates a Broad-Based Categorical Eligibility (BBCE) program, which CDSS
labels **Modified Categorical Eligibility (MCE)**. Under federal SNAP rules a household
that receives a non-cash TANF-funded benefit/service is **categorically eligible** for
SNAP, which (a) raises the gross-income screen above the federal 130% FPL default to the
state-elected threshold and (b) **waives the SNAP resource (asset) test** for most
households. California elected a **200% of the Federal Poverty Level gross-income screen**
and **no asset limit** for the MCE-conferring TANF service (an informational brochure /
"1-800" benefit provided to all applicants).

This is the override that flips working households that the federal 130% gross screen would
reject: a household between 130% and 200% FPL with modest savings is rejected federally but
eligible in California, subject to the **net-income test (100% FPL)** which still applies to
non-categorically-eligible households (categorically eligible households are deemed to meet
the gross and net income limits, except that California's MCE design applies a 200% gross
screen as the qualifying condition).

## Controlling federal authority — 7 CFR 273.2(j)

> **7 CFR 273.2(j)(2)(ii)** — "Households in which all members receive or are authorized to
> receive a non-cash or in-kind benefit or service that is funded under title IV-A of the
> Social Security Act ... or under [the maintenance-of-effort provisions], where such benefit
> or service is conferred ... are categorically eligible for SNAP. The State agency may
> establish gross income eligibility standards and resource standards for [such] households
> that are higher than the standards specified in § 273.9, provided the gross income standard
> does not exceed 200 percent of the Federal poverty level."

> **7 CFR 273.2(j)(2)(i)** — Households categorically eligible under this paragraph are
> **not subject to the resource limits of § 273.8** (the asset test is waived for the
> categorically-eligible household).

The 200% ceiling is the federal cap on a state's BBCE gross screen (per FNS BBCE policy and
7 CFR 273.2(j)(2)(ii)). California has elected that maximum, 200% FPL, and elected to impose
no resource test for MCE households.

Citation: 7 CFR 273.2(j) — Categorical eligibility for SNAP.
URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-B/section-273.2

State implementation: CDSS Manual of Policies and Procedures (MPP) Division 63 and the CDSS
All-County Letter establishing Modified Categorical Eligibility (200% FPL gross screen,
asset test waived). California's MCE excludes households where any member is disqualified
for certain reasons (e.g., IPV/fleeing-felon disqualifications), and households whose income
exceeds the 200% screen still get a regular (non-MCE) determination at the 130% gross / 100%
net thresholds with the federal/elderly-disabled asset rules.
URL: https://www.cdss.ca.gov/inforesources/calfresh

## FY2026 numeric values

- `ca_bbce_gross_limit` = **2.00** (= 200% of FPL gross-income screen).
- `asset_test_waived_ca` = **true** (no SNAP resource/asset limit for MCE households).

The 200% screen is applied against the HHS 2025 Poverty Guidelines used for FY2026 SNAP
(see `fpl_2025_annual` in rules.json; monthly FPL = annual / 12).

## Effective dates

California's MCE 200% FPL gross screen and asset-test waiver have been in continuous effect
for the current policy regime; rules.json records `effective_from: 2021-01-01` with no end
date. The federal authority (7 CFR 273.2(j)) and the 200% statutory ceiling are long-standing
and remain in force for FY2026 (2025-10-01 through 2026-09-30).

## Grounding determination

- `ca_bbce_gross_limit` = 2.00 — **correctly grounded.** Matches the 200% FPL gross screen,
  the maximum permitted by 7 CFR 273.2(j)(2)(ii) and elected by California.
- `asset_test_waived_ca` = true — **correctly grounded.** Matches 7 CFR 273.2(j)(2)(i):
  categorically-eligible MCE households are not subject to the § 273.8 resource limits.

Both values in config/rules.json are correctly grounded in cited law. No discrepancy; no
known gap for this section.
