# ABAWD Time-Limit Waiver Counties — California (FY2026)

**Rule key:** `abawd_waiver_counties_ca`
**Topic:** California counties holding a USDA-FNS-approved waiver of the SNAP/CalFresh ABAWD (Able-Bodied Adults Without Dependents) time limit.

## Governing law

The ABAWD time limit is set by the Food and Nutrition Act of 2008 § 6(o) (7 U.S.C. 2015(o)) and implemented at **7 CFR 273.24**. An ABAWD may receive SNAP for no more than 3 countable months in a 36-month period unless meeting the work requirement or qualifying for an exemption.

The waiver authority is **7 CFR 273.24(f)** ("Waivers"):

> "FNS will waive the [time] limit ... for any group of individuals ... if the State agency provides FNS with information which demonstrates that the area in which the individuals reside (1) Has an unemployment rate of over 10 percent; or (2) Does not have a sufficient number of jobs to provide employment for the individuals."

When FNS approves such a waiver for a defined area (typically by county), residents of that area are exempt from the 3-month ABAWD time limit for the duration of the approved waiver period.

In FY2026, the ABAWD population and the work-requirement parameters (ages 18–64, no dependent under 14, ≥20 hours/week, 3-month limit) were amended by **H.R.1 (2026)** with an ABAWD provision effective **2026-06-01** (see rule `hr1_abawd_work_requirement`). The county-level geographic waiver under 7 CFR 273.24(f) continues to override the time limit for approved-county residents during the waiver window.

## The seven approved waiver counties

Per the USDA-FNS-approved California ABAWD waiver, the following seven counties are waived from the ABAWD time limit, **effective through 2026-10-31**:

1. Alpine
2. Colusa
3. Imperial
4. Merced
5. Monterey
6. Plumas
7. Tulare

**Citation / source:** USDA Food and Nutrition Service, ABAWD waiver approvals for California; statutory/regulatory basis 7 CFR 273.24(f). State administration: CDSS (California Department of Social Services), Division 63 (CalFresh).
**Source URL:** https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.24

**Effective window:** waiver active through **2026-10-31** (rules.json uses `effective_from` 2026-06-01 to align with the H.R.1 ABAWD provision's start; `effective_to` 2026-10-31 is the waiver expiration).

## Grounding statement

The value in `config/rules.json` for `abawd_waiver_counties_ca` —
`["Alpine", "Colusa", "Imperial", "Merced", "Monterey", "Plumas", "Tulare"]`, effective through 2026-10-31 —
**matches** the seven counties named in the task's stated USDA-approved CA ABAWD waiver. The county list and expiration date are correctly grounded.

**Known gap:** The exact text and approval date of the live FY2026 USDA-FNS California waiver letter is not reproducible verbatim from a stable public eCFR/Federal-Register paragraph here; the regulatory *authority* (7 CFR 273.24(f)) is firmly cited, but the specific seven-county approval is a discretionary FNS administrative action that should be confirmed against the current CDSS All-County Letter / FNS approval notice at county-line verification time. The county membership itself matches the authoritative input provided.
