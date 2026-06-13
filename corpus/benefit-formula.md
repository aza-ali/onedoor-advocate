# Benefit Formula — Net Income Reduction Rate (30%)

## Rule
`benefit_reduction_rate` = **0.30**

The monthly SNAP allotment for an eligible household is its maximum
allotment for the household size, reduced by 30 percent of the household's
net monthly income.

## Primary Source — 7 CFR 273.10(e)(2)(ii)

> **§ 273.10 Determining household eligibility and benefit levels.**
> (e) *Calculating net income and benefit levels.*
> (2) *Benefit levels* —
> (ii) The household's monthly allotment shall be equal to the **maximum
> monthly allotment** for the household's size **reduced by 30 percent of
> the household's net monthly income** as calculated in paragraph (e)(1) of
> this section. If 30 percent of the household's net income ends in cents,
> the State agency shall round the product up to the next higher dollar.

This 30% multiplier is the statutory benefit-reduction rate. It derives
from the SNAP program design in section 8(a) of the Food and Nutrition Act
of 2008 (7 U.S.C. 2017(a)), which presumes households contribute roughly
30 percent of net income toward food. 7 CFR 273.10(e)(2)(ii) is the
operative regulatory paragraph implementing that contribution rate.

**Computation summary (per 273.10(e)(2)):**
1. Determine net monthly income per 273.10(e)(1) (gross income, less the
   applicable deductions in 7 CFR 273.9(d)).
2. Multiply net monthly income by 0.30; round the product UP to the next
   whole dollar.
3. Subtract that figure from the maximum monthly allotment for the
   household size.
4. The result is the household's allotment (subject to the minimum
   allotment for 1- and 2-person households under 273.10(e)(2)(ii)(C), and
   proration rules for the initial month under 273.10(a)).

## Citation
- **7 CFR 273.10(e)(2)(ii)** — "Determining household eligibility and benefit levels," Benefit levels.
- URL: https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-D/section-273.10
- Statutory basis: 7 U.S.C. 2017(a) (Food and Nutrition Act of 2008, § 8(a)).
- California adoption: CDSS MPP Division 63 (CalFresh) mirrors the federal allotment computation; no state variation to the 30% rate.

## Value / Effective Dates
- **Value:** 0.30 (30 percent of net monthly income).
- This is a structural rate fixed in regulation, NOT a fiscal-year COLA
  figure. It is not adjusted annually.
- **Effective:** since the modern SNAP benefit formula (rate unchanged
  since program inception, 1977-era rules); no sunset. FY2026 value = 0.30.

## Grounding Verdict
The value in `config/rules.json` (`benefit_reduction_rate` = 0.30, source
`7CFR-273.10`, paragraph cited to 273.10(e)(2)(ii)) is **correctly
grounded**. The cited paragraph number is exact and the 0.30 rate matches
the regulation verbatim.
