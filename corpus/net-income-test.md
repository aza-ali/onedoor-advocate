# Net Income Test — 100% FPL (SNAP / CalFresh)

**Rule key:** `net_income_limit`
**Topic:** The 100% Federal Poverty Level net income eligibility test.
**Primary source:** 7 CFR 273.9(a)(2)

## Regulatory paragraph (close quote)

7 CFR 273.9(a) — *Income eligibility standards*:

> "Participation in the program shall be limited to those households whose
> incomes are determined to be a substantial limiting factor in permitting
> them to obtain a more nutritious diet. ... (2) **Net income eligibility
> standards.** Households which contain an elderly or disabled member shall
> meet the net income eligibility standards for SNAP. Households which do not
> contain an elderly or disabled member shall meet **both the net income
> eligibility standards** and the gross income eligibility standards for SNAP.
> ... The net monthly income eligibility standards ... shall be **equal to the
> Federal income poverty levels** for the 48 contiguous States, Alaska, Hawaii,
> Guam and the Virgin Islands as established annually by the Office of
> Management and Budget."

In operational terms: a household's **net monthly income (after all allowable
deductions) must be at or below 100% of the federal poverty guideline** for its
household size.

## Numeric value (FY2026)

- **Net income limit multiplier = 1.00 (i.e., 100% of FPL).**
- The percentage is fixed in regulation; it does not change with the COLA. The
  underlying dollar thresholds derive from the HHS poverty guidelines applied
  per household size (see `fpl_2025_annual`), monthly = annual / 12.

## Citation

- 7 CFR 273.9(a)(2) — Income and deductions; net income eligibility standards.
- URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.9
- California parallel: CDSS MPP Division 63 (CalFresh) adopts the federal net
  income test; under CA Modified Categorical Eligibility (BBCE) the *gross*
  income screen is raised to 200% FPL, but the **net income test at 100% FPL
  still applies** to households not categorically eligible and to benefit
  computation.

## Effective dates

- Effective from: program inception (statutory standard, current text in force).
  rules.json records `1977-01-01` with `effective_to: null` (no sunset). The
  100% multiplier itself is permanent; only the dollar amounts refresh annually
  with the HHS poverty guidelines.

## Grounding determination

**GROUNDED = TRUE.** `rules.json` sets `net_income_limit.value = 1.00`
(100% of FPL), citing `273.9(a)(2)`. This matches 7 CFR 273.9(a)(2) exactly: the
net monthly income standard equals the federal poverty level (multiplier 1.00).
No discrepancy.
