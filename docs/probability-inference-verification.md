# Independent inspection of inference lessons

On 2026-09-20, independently inspected the root-authored Probability and Statistics
Introduction and lessons 16–20. This was mathematical and source inspection, not
a code review. Root files were read without mutation. Corrections were reported
to the integrating author, who applied them in the root worktree.

## Corrections found and checked

1. In lesson 17, the generated question beginning “At parameter ..., the same
   estimator has variance ...” omitted the estimator mean or bias. Its MSE was
   therefore underdetermined when shown independently of the preceding exercise.
   The corrected prompt states the estimator mean. The intended MSE values were
   otherwise correct.
2. In lesson 18, the margin for endpoints 0.2 and 0.8 was initially sent to the
   exact grader as `0.30000000000000004`. This would reject the correct answer
   0.3 despite accepting the generated fixture. The root correction now uses a
   clean decimal value. Independently submitting both `0.3` and `3/10` yields
   correct. A scan of all remaining exact targets in lessons 16–20 found no other
   long-decimal floating-point artifacts; the exact mathematical comparisons
   described below also found no others.
3. The lesson 16 terminology review accepted “Markov” and “Markov inequality”
   but rejected the taught possessive spelling. Both straight- and curly-apostrophe
   forms of “Markov's inequality” are now accepted; the curly-apostrophe response
   was explicitly checked.
4. The null-standard-error section in lesson 19 lacked its most specific source.
   Root added OpenStax §9.3 to that section. Its formula and conditions were read
   directly, as described below. The lesson's deliberate boundary and count-screen
   conventions are recorded here rather than silently equated with the source's.

## Independent calculations

The temporary script `/tmp/ps-inference-independent.py` used SymPy 1.14 with
rational parsing of decimal strings. It recomputed 298 numerical practice/review
targets from the mathematical inputs, separately from authoring helpers and
correct/incorrect fixture tests. After the root correction above, every compared
target agreed. The work included:

- Markov bounds with probability capping, sharp two-point constructions,
  Chebyshev complements with strict versus non-strict endpoints, all sufficient
  sample-size families using exact rational ceilings, independent-average
  variances, Monte Carlo indicator and integral estimates, union bounds, and
  independent all-failure products.
- All bias/MSE and raw-data sample-variance families; actual Bernoulli sequence
  enumeration for the count multiplicities; direct likelihood evaluation;
  differentiation of exponential log-likelihood; and the Bernoulli derivative.
  The identical-normal-data variance degeneracy and sample-variance denominator
  derivation were checked algebraically rather than treated as ordinary interior
  maximizers.
- Known-spread and Student mean intervals, all Wald proportion endpoints,
  success/failure screening counts, and the integer planning formulas. Exact
  rational and radical calculations were compared with authored approximation
  tolerances. The supplied t values for 8, 15, 24, 35, and 48 degrees of freedom
  were independently evaluated with mpmath's incomplete-beta formula: each
  corresponds to the intended 0.975 lower-tail quantile within the stated
  three-decimal table precision. The checks retain the supplied rounded critical
  values when calculating the exercise answers.
- Every supplied normal-CDF value was checked against the erf formula. Upper
  and two-sided tails were recomputed from the supplied entries; all mean and
  proportion test-statistic families, percentage-point effects, Type II
  complements, and family-level significance allocations were checked directly.
- Finite posteriors were formed from joint weights and normalized afresh. Beta
  means and variances were independently obtained by integrating normalized
  polynomial densities. Updated posterior means were calculated by multiplying
  the prior density by the Bernoulli likelihood and integrating, rather than
  only reusing the beta-update formula. The one- and two-success predictive
  probabilities were likewise integrated directly. Credible-interval masses,
  equal-tailed endpoints, and dedicated review variants were recomputed.

Representative reading checks include: the normal interval `[10.04,13.96]`, the
t interval `[17.694,22.306]`, the Wald interval `[0.2076,0.2924]`, the Beta(2,2)
second moment 3/10 and variance 1/20, and the Beta(5,4) posterior variance 2/81.
The Beta(2,1) intervals with endpoints `(sqrt(0.1),sqrt(0.9))` and
`(sqrt(0.2),1)` both have mass 4/5, with different tail allocations.

The remaining definition, proof, counterexample, interpretation, and Boolean
answers were inspected manually. No further mathematical corrections were found.
In particular, the lessons distinguish variance from squared bias, unbiasedness
from consistency, exact normal/t references from approximations, null from
plug-in proportion standard errors, posterior means from MLEs, conditional from
marginal predictive independence, and posterior credibility from frequentist
coverage. Symbolic fixture conformance was not used as proof of those claims.

## Supporting passages and convention checks

- Pishro-Nik, [§6.2.2 Markov and Chebyshev Inequalities](https://www.probabilitycourse.com/chapter6/6_2_2_markov_chebyshev_inequalities.php):
  inspected the nonnegative-variable theorem, its indicator-count proof of the
  union bound, and the squared-deviation derivation. The lesson correctly keeps
  positive thresholds, finite moments, and the complement's endpoint convention.
- Pishro-Nik, [§8.2.1 Evaluating Estimators](https://www.probabilitycourse.com/chapter8/8_2_1_evaluating_estimators.php):
  inspected bias, MSE, the bias–variance identity, sample-mean comparisons,
  consistency, and the MSE-to-consistency implication. The original lesson states
  the squared-error expectation correctly and supplies its own proof.
- Pishro-Nik, [§8.2.3 Maximum Likelihood Estimation](https://www.probabilitycourse.com/chapter8/8_2_3_max_likelihood_estimation.php):
  inspected binomial and exponential likelihood derivations, the two-parameter
  normal maximization, the relation between divisor-n and divisor-(n−1) variance,
  and the caution about boundary optima. The original lesson additionally checks
  the degenerate all-identical observations within the stated positive-variance
  domain.
- OpenStax, _Introductory Statistics_, second edition,
  [§8.3 A Population Proportion](https://openstax.org/books/introductory-statistics-2e/pages/8-3-a-population-proportion),
  supports the plug-in interval and planning formula. The authored lesson uses
  an explicitly approximate Wald method and explains boundary failure rather
  than claiming a universal sample-size guarantee.
- OpenStax, [§9.3 Probability Distribution Needed for Hypothesis Testing](https://openstax.org/books/introductory-statistics-2e/pages/9-3-probability-distribution-needed-for-hypothesis-testing):
  inspected Table 9.3 and the assumptions immediately below it. They state the
  reference normal/t models and the proportion spread `sqrt(p(1−p)/n)` under
  the parameter being tested. The source's count screen is `np>5` and `nq>5`;
  the lesson deliberately uses expected counts at least ten, correctly labeled
  a practical screen rather than a proof of accuracy.
- OpenStax, [§9.4 Rare Events, the Sample, Decision and Conclusion](https://openstax.org/books/introductory-statistics-2e/pages/9-4-rare-events-the-sample-decision-and-conclusion):
  inspected its extreme-statistic p-value definition, mean-testing example, and
  decision convention. The source rejects for `p<α`; this subject explicitly
  chooses `p≤α`. Both the equality practice question and its answer follow the
  subject's convention. The lesson also explicitly avoids the source's potentially
  misleading shortcut from rare outcomes to “chance” language by defining the
  null-model tail event precisely.
- Pishro-Nik, [§9.1 Bayesian Inference](https://www.probabilitycourse.com/chapter9/9_1_0_bayesian_inference.php)
  and [§9.2 end-of-chapter problems](https://www.probabilitycourse.com/chapter9/9_2_0_ch_probs.php):
  inspected posterior conditioning and the beta-binomial conjugacy problem
  (Problem 18), which supplies the beta density, mean, variance, and update.
  The lesson's normalizing integrals, predictive moments, and interval examples
  were derived and independently checked from those definitions.

## Prerequisite and grading suitability

The reading-only Introduction has no exercises or quick checks. Its distinction
between probability models and inference is consistent with the later Bayesian
and frequentist treatments and makes no numerical guarantee of its own.

The working sequence is coherent: limits and sampling precede concentration;
concentration supports consistency; estimation and variance precede confidence
intervals; interval references precede testing; likelihood and earlier Bayes
rules precede parameter updating. Beta integration and likelihood differentiation
reuse already taught calculus. Neither normal nor t quantiles need a runtime
calculator: required numerical values are supplied. The finite and polynomial
cases use supported exact arithmetic, while numerical endpoints and supplied
normal-tail calculations use explicit tolerances. Open explanations retain the
modeling decisions instead of reducing them to a numerical check.

This note records the inspected authoring content and mathematical corrections.
It does not substitute for the integrating author's final generated-content,
source-digest, and application verification.
