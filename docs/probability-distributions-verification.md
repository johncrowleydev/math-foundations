# Independent inspection of distribution and sampling lessons

On 2026-09-20, independently read the explanations, worked examples, practice,
review, quick checks, and source assignments for Probability and Statistics
lessons 09–15 in the distributions author's separate worktree. That worktree was
read without modification. This was mathematical content inspection, not code
review. No arithmetic or theorem-condition correction was found in the inspected
drafts. Existing bounded-grader limitations are recorded below.

## Independent calculations

The temporary script `/tmp/ps-distributions-independent.py` recomputed 349
numeric, formula, tuple-component, and matrix-cell answer targets from the
mathematical inputs. It used SymPy 1.14 through
`/tmp/calculus-sympy/bin/python`, with decimal strings parsed as exact rationals.
All comparisons passed. These computations did not use the authored solutions
or deterministic-grading fixtures as mathematical evidence.

The calculation coverage included:

- **09:** normalization and probabilities for polynomial and piecewise densities;
  CDF derivatives and quantiles; raw and central moments; clipped uniform
  intervals and conditioning; exponential survival, conditional survival,
  moments, and quantiles. Independently integrating `2/x^3` over `[1,infinity)`
  gave mass one, mean two, and an infinite second moment. The `3x^2` density has
  variance `3/80`; its probability between `1/4` and `3/4` is `13/32`.
- **10:** normal standardization and affine moments; all supplied-CDF arithmetic;
  inverse-CDF endpoints; inverse-function density derivatives; branch counting
  for squares and absolute values; atoms and expectations created by clipping.
  For `U` uniform on `(0,2)`, squaring gives density `1/(4 sqrt(y))` on `(0,4)`
  and mean `4/3`. Clipping uniform `(-1,1)` below at zero gives mass `1/2` at
  zero and mean `1/4`.
- **11:** row/column sums and conditional PMFs from the actual probability
  tables; Bayes updates; rectangular and triangular joint integrals; conditional
  densities; joint-CDF mixed derivatives and four-term rectangle probabilities.
  For density two on `0<x<y<1`, the probability of `Y>1/2` given `X<1/4` is
  `(1/4)/(7/16)=4/7`. For density `4xy` on the unit square, the probability of
  `X+Y<1` is `1/6`.
- **12:** covariance identities, variance quadratic forms, affine covariance
  matrices, correlation, PSD counterexamples, eigenvalue directions, and
  singularity. Transforming independent inputs of variances one and four to
  their sum and difference gives covariance matrix `[[5,-3],[-3,5]]`. The
  impossible matrix `[[1,2],[2,1]]` gives variance `-2` in direction `(1,-1)`.
- **13:** conditional integrals, weighted group means, within/between variance,
  prediction-loss decomposition, and random-sum moments. Group probabilities
  `3/4,1/4`, means `2,8`, and variances `1,9` give overall mean `7/2`, within
  variance three, between variance `27/4`, and total variance `39/4`. Uniform
  `(0,2)` input with conditionally uniform `(0,x)` response gives variance
  `7/36`. The workload examples include both count and contribution variation.
- **14:** actual finite-data means, medians, modes, weighted group means,
  empirical variance versus sample variance, unit conversions, inclusion
  probabilities, and proportional allocation. Data `0,2,4,6` have sample
  variance `20/3`; summaries `n=4`, sum twelve, and sum of squares fifty give
  sample variance `14/3`.
- **15:** exact sampling moments, Chebyshev bounds and integer sample-size
  requirements, normal standardization, count-scale continuity corrections,
  proportion standard errors, shared-noise variance, and covariance-adjusted
  averages. The binomial `100,1/2` event `45<=K<=55` uses standardized limits
  `-1.1,1.1` and the supplied table gives `0.7286`. Ten observations with
  variance two and pairwise covariance `1/2` give mean variance `13/20`.

Separately, 40-digit mpmath evaluation confirmed that the supplied normal CDF
values at `0.5,1,1.1,1.5,2` round to the displayed four decimal places. Exercise
answers correctly perform arithmetic from those supplied rounded values; they
do not silently replace them with higher-precision distribution calculations.
A scan of the exact targets found no long-decimal floating-point artifacts.

For identification of the inspected snapshot, the temporary JSON export has
SHA-256 `318992537ab5c276d95c0830d3ff866b5f1e0800a86393badd253c730cbe3f4c`.
The independent script has SHA-256
`910c54836c27a214f2b18f2173e9266c1471a1694d22625cbef5628f7636e094`.
These are inspection artifacts, not a new content acceptance gate.

## Prerequisites and mathematical distinctions

The ordering is coherent given the completed calculus and linear algebra
subjects: densities and integrals precede transformations and joint densities;
joint models precede covariance and conditional expectations; sampling design
and observed summaries precede repeated-sampling limits. The local derivation of
Chebyshev's bound in lesson 15 makes its use independent of the later
concentration lesson.

The inspected exercises provide the distributions, tables, supports, or supplied
CDF values required for standalone responses. Formulas requested only on a
support's interior are explicitly limited to that interior. The authored
positivity facts for `y`, `1-x`, and `x+1/2` follow from the stated intervals.
Point conditioning is distinguished from division by a zero point probability.
Continuous marginals are correctly distinguished from existence of a joint
density, and zero covariance from independence. Correlation requires positive
finite variances. Conditional variance reduction is stated on average, with a
valid counterexample to the pointwise claim.

The weak law is stated for integrable iid observations, while its elementary
proof additionally assumes finite variance. The CLT explicitly requires finite
positive variance. The heavy-tail example therefore supports the weak law but
does not meet this CLT's hypotheses. Normal approximations and moment bounds are
not presented as exact probabilities. Random sampling and treatment assignment
retain their separate inferential roles.

## Pinpoint source inspection

The following supporting passages were opened and read independently:

- [Pishro-Nik §4.1.1](https://www.probabilitycourse.com/chapter4/4_1_1_pdf.php):
  density/CDF relationship, integrated probability, and point probabilities.
- [Pishro-Nik §4.1.3](https://www.probabilitycourse.com/chapter4/4_1_3_functions_continuous_var.php):
  CDF method, squared-uniform example, absolute inverse derivative in equation
  4.5, and multiple inverse branches in equation 4.6. The introductory warning
  that transformations need not remain continuous supports checking for atoms.
- [Pishro-Nik §4.2.3](https://www.probabilitycourse.com/chapter4/4_2_3_normal.php):
  normal parameter convention, standardization, and CDF use.
- [Pishro-Nik §5.2.3](https://www.probabilitycourse.com/chapter5/5_2_3_conditioning_independence.php):
  event conditioning with a positive probability denominator, truncated
  densities, and conditioning through density ratios.
- [Pishro-Nik §5.1.5](https://www.probabilitycourse.com/chapter5/5_1_5_conditional_expectation.php):
  conditional expectation as a random variable, taking out known factors,
  iterated expectation, and the proof of total variance in equations 5.8–5.9.
- [Pishro-Nik §6.1.5](https://www.probabilitycourse.com/chapter6/6_1_5_random_vectors.php):
  mean vectors, covariance centering, affine covariance transformation, PSD
  proof, and valid singular examples. Its uncentered use of “correlation matrix”
  is not imported into the lesson's scalar Pearson-correlation definition.
- [Pishro-Nik §9.1.5](https://www.probabilitycourse.com/chapter9/9_1_5_mean_squared_error_MSE.php):
  conditional-mean minimization of squared prediction loss and residual
  properties. The lesson correctly distinguishes prediction of an unobserved
  random outcome from estimation of a fixed parameter.
- [Pishro-Nik §7.1.1](https://www.probabilitycourse.com/chapter7/7_1_1_law_of_large_numbers.php)
  and [§7.1.2](https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php):
  the finite-mean weak-law statement and stronger assumption for its variance
  proof; finite-positive-variance CLT and CDF convergence for discrete sums.
- [OpenStax Statistics §2.7](https://openstax.org/books/introductory-statistics-2e/pages/2-7-measures-of-the-spread-of-the-data):
  sample spread with denominator `n-1` and distinction from population spread.

These passages support the concepts and derivations, not claims that the
original exercise data were copied from the books. Source-register digest
validation remains the integrating author's content-pipeline responsibility.

## Bounded answer-equivalence limitations

Actual submissions confirmed that `1/sqrt(8*pi)` is accepted for the normal
peak authored as `1/(2*sqrt(2*pi))`, and `y^(-1/2)/4` is accepted for the
transformed density `1/(4*sqrt(y))` on its positive domain.

The existing calculus grader requests rewriting for these mathematically valid
equivalents: `2^(-1/3)` for `(1/2)^(1/3)`; `8*ln(2)` for `4*ln(4)`;
`-ln(1/2)/3` for `ln(2)/3`; and `ln(sqrt(y))` for `ln(y)/2` on positive `y`.
They receive input guidance, not an incorrect verdict or a provider fallback.

The form `1/(2^(1/3))` additionally exposes a wording limitation: guidance says
an additional domain restriction is needed. Mathematically, its denominator is
a positive constant and needs no restriction. This is the bounded engine's
unresolved positivity proof, not a flaw in the exercise's support or domain.
The integrating author was informed. No engine expansion was made for this
subject; unresolved-check guidance remains within the approved bounded contract.
