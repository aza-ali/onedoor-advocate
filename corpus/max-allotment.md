# Max Allotment & Minimum Allotment — FY2026 SNAP (48 Contiguous States + DC)

Rule section: `max-allotment`
Rule keys grounded: `max_allotment`, `min_allotment`
Effective: **2025-10-01 through 2026-09-30** (Federal Fiscal Year 2026)

---

## 1. Maximum Monthly Allotment — `max_allotment`

### Source
USDA Food and Nutrition Service (FNS), **SNAP — Fiscal Year 2026 Cost-of-Living
Adjustments (COLA)** memo. The maximum allotment equals the cost of the
Thrifty Food Plan (TFP) for a four-person reference family, scaled to other
household sizes by the FNS economy-of-scale factors, and is published annually
by FNS under the authority of the Food and Nutrition Act of 2008
(7 U.S.C. 2017(a)) and 7 CFR 273.10(e)(4).

- Citation: USDA FNS FY2026 SNAP COLA memo; 7 CFR 273.10(e)(4) (allotment = TFP value).
- URL: https://www.fns.usda.gov/snap/allotment/COLA

### Regulatory / source text (paraphrase of the FY2026 COLA table)
> "The maximum SNAP allotment is based on the June value of the Thrifty Food
> Plan. Effective October 1, 2025, the maximum monthly allotments for the
> 48 contiguous states and the District of Columbia are set by household size
> as follows."

### FY2026 maximum monthly allotment values (48 states + DC)

| Household size | Maximum monthly allotment |
|---------------:|--------------------------:|
| 1 | $298 |
| 2 | $546 |
| 3 | $785 |
| 4 | $994 |
| 5 | $1,183 |
| 6 | $1,421 |
| 7 | $1,571 |
| 8 | **$1,795** |
| each additional person | + $219 |

### Grounding check vs. config/rules.json
`rules.json["max_allotment"]["value"]` lists household size **8 = 1789**.
The published FY2026 USDA FNS value for an 8-person household is **$1,795**.
**This is a discrepancy.** Sizes 1–7, `each_additional` (+$219), the
effective dates, and the source attribution are correct. **Size 8 should be
1795, not 1789.** Therefore `max_allotment` is NOT fully grounded as written.

---

## 2. Minimum Allotment — `min_allotment`

### Source / citation
**7 CFR 273.10(e)(2)(ii)(C)** — Minimum benefit for one- and two-person
households. The minimum benefit is statutorily indexed (8.5% of the TFP for a
one-person household, rounded) and republished each year in the FNS COLA memo.

- Citation: 7 CFR 273.10(e)(2)(ii)(C).
- URL: https://www.ecfr.gov/current/title-7/section-273.10

### Regulatory text (close paraphrase)
> "Except during an initial month, all eligible one- and two-person households
> shall receive a minimum monthly allotment. For FY2026 (effective
> October 1, 2025), the minimum monthly allotment for the 48 contiguous states
> and DC is $23."

### FY2026 value
- Minimum monthly allotment (1- and 2-person households): **$23**

### Grounding check vs. config/rules.json
`rules.json["min_allotment"]["value"] = 23`. This **matches** the FY2026
published minimum allotment. `min_allotment` is correctly grounded.

---

## Summary
- `min_allotment` = $23 — **grounded (correct)**.
- `max_allotment` — household sizes 1–7 and `each_additional` correct; **size 8
  is recorded as 1789 but the law sets it at $1,795** — **discrepancy, not
  grounded as written.**
