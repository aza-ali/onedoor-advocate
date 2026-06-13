# hr1-immigrant — H.R.1 (2026) SNAP Noncitizen Eligibility Narrowing

**Rule key:** `hr1_immigrant_eligibility`
**Topic:** H.R.1 / One Big Beautiful Bill Act of 2025 (OBBB), Section 10108 — narrowing of SNAP-eligible noncitizen ("qualified alien") categories, and which statuses remain eligible.
**Primary source:** H.R.1, 119th Congress, "One Big Beautiful Bill Act of 2025," Section 10108 (amending the Food and Nutrition Act of 2008, 7 U.S.C. 2015(f), and the eligibility scheme at 8 U.S.C. 1612). Signed into law **July 4, 2025**.

---

## Statutory / regulatory paragraph (load-bearing)

> Section 10108 of the One Big Beautiful Bill Act of 2025 limits SNAP eligibility for noncitizens. After enactment, the **only** noncitizen categories eligible for SNAP are: (1) lawful permanent residents (LPRs) who otherwise satisfy existing eligibility rules (including the 5-year bar / 40-quarters / pre-1996 exceptions); (2) Cuban–Haitian entrants as defined in section 501(e) of the Refugee Education Assistance Act of 1980; and (3) certain Compact of Free Association (COFA) migrants lawfully residing in the U.S. Section 10108 eliminates the text in the Food and Nutrition Act of 2008 that had made **refugees** (and, by parallel removal, **asylees, persons granted withholding of removal, parolees, conditional entrants, victims of trafficking, and Afghan/Iraqi special-immigrant and Ukrainian humanitarian categories**) eligible. Those groups are rendered **ineligible** for SNAP.

Source: FNS, *Supplemental Nutrition Assistance Program (SNAP) Implementation of the One Big Beautiful Bill Act of 2025 – Alien SNAP Eligibility*, Implementation Memorandum (Oct. 31, 2025) and Alien SNAP Eligibility Q&A #1 (Dec. 9, 2025).

---

## Citation

- **H.R.1 (119th Cong.), OBBB Act of 2025, § 10108** — amending the Food and Nutrition Act of 2008 (7 U.S.C. 2011 et seq.) and the alien-eligibility scheme at 8 U.S.C. 1612(a).
  - Bill: https://www.congress.gov/bill/119th-congress/house-bill/1
- **USDA FNS — OBBB Alien SNAP Eligibility (authoritative implementation guidance):**
  - https://www.fns.usda.gov/snap/obbb-alien-eligibility
  - https://www.fns.usda.gov/snap/obbb-alien-eligibility-qas1

---

## Eligible vs. ineligible (post-OBBB)

**Remain ELIGIBLE (subject to existing LPR rules):**
- Lawful Permanent Residents (green-card holders)
- Cuban–Haitian entrants
- COFA migrants (citizens of the Marshall Islands, Micronesia, Palau lawfully residing in the U.S.)

**Newly INELIGIBLE on/after enactment:**
- Refugees
- Asylees
- Persons granted withholding of removal
- Parolees (including humanitarian parolees of >= 1 year)
- Conditional entrants
- Certified victims of trafficking
- VAWA self-petitioners / certain abused-spouse categories that ran through the now-deleted text

---

## Effective dates

- **Statutory effective date: upon enactment — July 4, 2025.** State agencies must apply the new criteria immediately to new applicants at initial certification, and to existing households at their next recertification.
- **Hold-harmless / transition:** households that lose eligibility at recertification due to OBBB are not subject to a claim for over-issuance through **November 1, 2025**. (This is a claims-protection window, not a delayed effective date.)

---

## Grounding determination for `config/rules.json`

**NOT correctly grounded — value is materially wrong (grounded = false).**

The rules.json entry sets `effective_date` / `effective_from` = **"2026-04-01"**. This is incorrect: Section 10108 took effect **upon enactment on 2025-07-04** (new applicants immediately; existing households at recertification; over-issuance hold-harmless through 2025-11-01). There is no 2026-04-01 effective date for the immigrant-eligibility narrowing in OBBB.

Secondary inaccuracies in the `newly_ineligible_statuses` list:
- It lists `"compact_of_free_association_pending"` as newly ineligible. This is **wrong** — **COFA migrants REMAIN eligible** under the law. COFA is on the *eligible* side, not the ineligible side.
- The list omits the principal newly-ineligible groups actually named by the statute: refugees, asylees, withholding-of-removal grantees, conditional entrants, trafficking victims. The catch-all `"refugee_humanitarian_post_cutoff"` / `"certain_parolees"` labels gesture at this but are imprecise.

The existing `known_gap` flag (treating the precise category mapping as a high-uncertainty seam for live county-line verification) is appropriately conservative and SHOULD be retained — the per-status mapping at the county application line is genuinely fluid. But the hard, citable facts (enactment-date effectiveness; COFA + Cuban-Haitian + LPR eligible; refugees/asylees/parolees ineligible) are now settled and should be corrected in the config rather than left as a guess.

**Correct effective_date:** `2025-07-04` (enactment), with recertification rollout and an over-issuance hold-harmless window ending `2025-11-01`.
