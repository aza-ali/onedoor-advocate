# OneDoor: Impact Constants and Wedge

## Impact Constants (sourced; no invented numbers)

Each constant below has a stable id and a source URL. Use the id when referencing a
number in code or copy so the figure stays traceable to its source.

| id | value | meaning | source |
|----|-------|---------|--------|
| `LDEP_UNCLAIMED_USD_PER_YEAR` | $3.5B / year | CalFresh benefits Californians are eligible for but do not claim each year | Nourish California, "Lost Dollars, Empty Plates" (2024), https://nourishca.org/wp-content/uploads/2024/04/2024-Lost-Dollars-Empty-Plates.pdf |
| `LDEP_ELIGIBLE_UNENROLLED` | 2.7M people | Eligible Californians not receiving CalFresh | Nourish California, "Lost Dollars, Empty Plates" (2024), https://nourishca.org/fresh/news-and-media-releases/lost-dollars-2024/ |
| `SNAP_PARTICIPATION_NATIONAL_FY2022` | 88% | National SNAP participation rate among eligible individuals, FY2022 (highest on record) | USDA FNS, "SNAP Reaches Record Percent of Eligible Individuals in 2022", https://www.fns.usda.gov/newsroom/subscriber-updates/snap/fy22trends |
| `SNAP_PARTICIPATION_CA_APPROX` | ~81% | California participation, below the national average | USDA FNS, State SNAP Participation Rates 2022, https://www.fns.usda.gov/research/snap/state-participation-rates/2022 |

The gap is the whole point: nationally 88 percent of eligible people get SNAP, while
California sits around 81 percent. Closing that gap is 2.7M people and $3.5B in food
benefits that are already appropriated and going unclaimed.

## Who Pays (the person never pays)

OneDoor is paid by the parties that profit when an eligible person enrolls: Medi-Cal
managed-care plans (through CalAIM Community Supports), food banks and counties on a
per-enrollment outreach basis, and GoodRx affiliate revenue on the prescription side.
The household that uses OneDoor never pays a cent.

## Wedge vs. Incumbents

Incumbents: mRelief, SingleStop, Propel, BenefitsCal.

A federal-default eligibility screener gives California households the wrong answer,
because California's rules diverge from the federal baseline. On top of that, H.R.1
(2026) ships dated rule changes that make every static explainer wrong the moment a
deadline passes: the immigrant eligibility change dated 4/1 and the ABAWD work-requirement
change dated 6/1. A screener hard-coded to last quarter's rules will confidently mislead.

OneDoor's wedge is a freshness-plus-correctness moat:

- `verified_at` stamps on every rule and answer, so staleness is visible, not hidden.
- A live county-line call as the provenance for each eligibility determination, so the
  answer reflects the county's current rules rather than a cached federal default.
- A stated independent-oracle accuracy number, measured against ground truth, so the
  correctness claim is auditable rather than asserted.

The combination, California-correct, dated to the H.R.1 seams, verified at call time,
and accuracy-measured, is what a static federal-default screener structurally cannot match.

---

<sub>Secondary, not part of the revenue story: USDA ERS estimates roughly $1.50 in economic
activity is generated per $1 of SNAP benefits (USDA Economic Research Service, https://www.ers.usda.gov/topics/food-nutrition-assistance/supplemental-nutrition-assistance-program-snap/).
This is a downstream economic-multiplier figure only; it is not OneDoor revenue and is
excluded from any revenue projection.</sub>
