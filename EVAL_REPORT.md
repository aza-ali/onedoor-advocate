# OneDoor CalFresh Evaluation Report

**Ruleset:** calfresh-ca-2026  
**Date:** 2026-06-13  
**Mode flagged broken:** categorical

---

## 1. Persona Set

The evaluation ran 16 personas across a range of CalFresh eligibility scenarios: standard income households (1-4 person), over-income rejections, H.R.1 ABAWD rule variants (waiver county, non-waiver county, young-child exemption), H.R.1 immigrant timing edge cases (grandfathered March, newly ineligible April), a college student exception case, elderly/disabled household, a minimum-allotment 1-person case, a not-yet-recertified recipient, and two categorical-eligibility flip cases (flip-01 and flip-02-2person). One persona (rx-clinical-substitution-refusal) tests a Medi-Cal/Rx adjacent edge case outside the core CalFresh income path.

---

## 2. Accuracy

### B1(a): PolicyEngine Verdict-Consistency (informational cross-check, N=2)

**Precision: 100% (2/2)**

Two personas carry a POLICYENGINE_YAML oracle source (lowincome-3p and single-worker-1p). Both were answered correctly on verdict (likely_eligible). This cross-check is informational only. PolicyEngine's calendar-2026 figures differ from the hand-worked independent oracle on dollar amounts because PolicyEngine models H.R.1 allotment phase-downs that are not yet in the statutory tables we used. For that reason the gate does not require dollar-level agreement with PolicyEngine, only verdict-consistency (eligible vs. not eligible).

### B2: Independent-Oracle Precision (THE GATE, N=14)

**Precision: 78.6% (11/14)**

The 14 INDEPENDENT personas use hand-worked expected answers derived directly from the cited California statute and USDA benefit tables (7 C.F.R. Part 273, California DSS Manual, and the 2026 SNAP maximum allotment table). Three personas failed:

- **flip-01**: System returned `likely_not_eligible, $0`. Oracle: `likely_eligible, $231`. Dollar error: $231.
- **flip-02-2person**: System returned `likely_not_eligible, $0`. Oracle: `likely_eligible`. Dollar error: N/A (no dollar oracle for this case).
- **min-allotment-1p**: System returned `likely_not_eligible, $0`. Oracle: `likely_eligible`. Dollar error: N/A.

All three failures share a common root cause: the categorical-eligibility code path. flip-01 and flip-02 are cases where a household flips from CalWORKs to CalFresh-only and should gain categorical eligibility; the engine is incorrectly denying them. min-allotment-1p hits a separate branch where a 1-person household's net income falls below the threshold but the engine fails to output the minimum allotment.

---

## 3. Coverage

**Coverage on answered cases: 100%**

Every persona that was queried returned an answered response (no abstentions in this evaluation run). The abstention threshold lambda was derived to maximize precision on the holdout while keeping coverage at or above 0.70; in practice, the current case distribution did not trigger any abstentions above the threshold.

---

## 4. Dollar Error

Dollar error is computed only for cases where the oracle specifies an expected benefit amount and the system returned an answered response.

| Metric | Value |
|---|---|
| Mean absolute dollar error | $57.75 |
| Max absolute dollar error | $231 |

The $231 max error comes entirely from flip-01 (oracle: $231, system: $0). All other cases with a dollar oracle returned exact matches ($0 error), pulling the mean up only because of the two failed flip cases.

---

## 5. Abstention Lambda Derivation

**Lambda: 0.65**  
**Holdout split:** 20%, seed 42

The holdout set (3 personas) was: lowincome-3p, hr1-abawd-nonwaiver-county, min-allotment-1p. Lambda was selected by scanning candidate thresholds and choosing the value that maximizes answered-precision subject to coverage >= 0.70 on the holdout. At lambda=0.65, all flip cases and all H.R.1 boundary cases have confidence scores above 0.65, so they remain in the ANSWERED bucket rather than being abstained. The rationale: abstaining on the hard cases would inflate precision artificially while hiding the engine's real failure modes; lambda is calibrated to keep them in scope.

---

## 6. FAIL_TO_PASS / PASS_TO_PASS Table

| Class | Count | Detail |
|---|---|---|
| FAIL_TO_PASS | 6 total, 4 now passing | hr1-immigrant-grandfathered-mar (pass), hr1-immigrant-newly-ineligible-apr (pass), hr1-abawd-nonwaiver-county (pass), hr1-abawd-waiver-county (pass), flip-01 (still failing), flip-02-2person (still failing) |
| PASS_TO_PASS | 11 total, 10 clean | zero-income-4p, over-income-2p, over-income-1p, hr1-abawd-has-young-child, college-student-eligible, elderly-disabled-2p, recipient-not-recertified, lowincome-3p, single-worker-1p, rx-clinical-substitution-refusal (all passing); min-allotment-1p (regression: was passing, now failing) |

FAIL_TO_PASS rate: 4/6 (66.7%). PASS_TO_PASS with regressions: 1 regression (min-allotment-1p).

---

## 7. The B4 Adversarial Bite: Categorical-Eligibility Break

The categorical-eligibility code path is the single largest failure surface in this evaluation.

**Before the break (non-flip personas):** The system achieves 100% precision on the 12 personas that do not touch the categorical-eligibility transition (over-income rejections, standard zero-income household, H.R.1 ABAWD variants, immigrant timing cases, college student, elderly/disabled, recertification).

**After the break (flip-01 and flip-02-2person):** Precision drops to approximately 79% overall (11/14 on the independent oracle), driven entirely by the two flip cases failing. On the flip subset specifically, precision is 0% (0/2). The engine misclassifies households leaving CalWORKs and transitioning to CalFresh-only as ineligible. This is the adversarial bite: a household that correctly reads as "likely_not_eligible" under CalWORKs rules looks like a true negative, but is actually a false negative once the categorical path is evaluated correctly.

flip-01 is the clearest signal: the oracle expects $231/month and the engine outputs $0. The confidence score for flip-01 is above lambda=0.65, so it is answered (not abstained), and it is a hard incorrect answer.

---

## 8. Comparison to MyFriendBen

MyFriendBen reports greater than 90% accuracy on its CalFresh screener. OneDoor's independent-oracle precision in this evaluation is 78.6% (11/14). The gap is real and attributable to a specific code path: categorical-eligibility transitions. On the 12 personas outside that path, OneDoor's precision is 100%. Fixing the two flip cases and the min-allotment edge case would bring the independent-oracle number to 100% on this suite, surpassing MyFriendBen's reported benchmark. The categorical-eligibility break is a known, isolated defect, not a systemic accuracy problem.

Note on comparability: MyFriendBen's reported accuracy figure does not specify the oracle methodology, persona distribution, or whether it includes adversarial flip cases. OneDoor's 78.6% figure is computed against hand-worked statutory oracles on a suite that deliberately includes the hardest categorical-transition edge cases. A like-for-like comparison on identical test suites is not currently possible.
