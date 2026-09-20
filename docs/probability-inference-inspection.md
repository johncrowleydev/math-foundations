# Introduction, inference, and figure source inspection

Inspected September 20, 2026. The explanations and numerical exercises in 00 and
16–20 were authored alongside their solutions. The cited passages support the
mathematical methods, not a claim that these particular examples came from a
textbook. [The independent inference check](probability-inference-verification.md)
records the separate symbolic, exact-rational, and numerical verification.

## Inspected passages

- Pishro-Nik §1.3.1, **Random Experiments**, and §8.1.0, **Introduction**:
  inspected the experiment/model definitions and the transition from a probability
  model to inference from samples. These support the reading-only Introduction.
- Pishro-Nik §6.2.2, **Markov and Chebyshev Inequalities**: inspected assumptions,
  proofs, and the union-bound application. The original Monte Carlo examples
  follow by applying these results to independent indicator averages or scaled
  averages of function values. The text separates bounds from exact probabilities.
- Pishro-Nik §8.2.1, **Evaluating Estimators**, and §8.2.3, **Maximum Likelihood
  Estimation**: inspected bias, MSE, consistency, and Bernoulli, exponential, and
  normal likelihood calculations. Original derivations preserve the expectation
  of a squared error and check endpoint/degenerate likelihood cases.
- OpenStax, _Introductory Statistics 2e_, §§8.1–8.3: inspected known-population-
  spread mean intervals, Student intervals, proportion intervals, and sample-size
  formulas. Exact normal/t statements require the authored independent normal
  model; other applications are explicitly approximations. The elementary Wald
  interval is screened and its boundary failure is taught.
- OpenStax §§9.1–9.4: inspected population hypotheses, Type I/II errors, reference
  distributions, and null-model p-value decisions. The subject uses `p≤α` for
  rejection and expected success/failure counts at least ten, explicitly differing
  from the source's strict boundary and greater-than-five screen. The null
  proportion standard error is assigned specifically to §9.3.
- Pishro-Nik §9.1.0, **Bayesian Inference**, and §9.2, Problem 18's supplied beta
  definitions and conjugacy statement: inspected posterior conditioning and beta
  density, moments, and updating. The original predictive and credible-interval
  calculations were derived by integrating polynomial densities.
- Deisenroth, Faisal, and Ong, _Mathematics for Machine Learning_, author PDF
  dated January 15, 2024, §§8.2–8.3 (printed pp.259–273; PDF pp.265–279):
  inspected expected/empirical loss and likelihood as modeling context. The PDF
  and temporary text extractions are research files, not published lesson assets.
- [KaTeX Supported Functions](https://katex.org/docs/supported.html): inspected
  accents (including a wide hat), Greek letters, conditioning relations,
  operators, grouping examples, and the Font entries for bold Latin and Greek
  mathematical symbols used in optional typing help. The new examples use
  `\widehat{y}`, `\mathbf{X}`, and `\boldsymbol{\mu}` to match the fitted-value and
  random-vector notation in lessons 12 and 21. This source supports syntax, not
  statistical claims or claims about learning effectiveness.

Exact URLs, editions, dates, and support descriptions are assigned to the relevant
sections and practice groups in `content/sources.json`. Formula explanations and
contextual references are inspected at the same teaching anchors. Mathematical
model assumptions are stated before numerical use; optional TeX help remains
separate from required mathematical understanding.

## Original figure calculations

All figures use authored coordinates and existing Venn or Cartesian rendering.
The event diagrams use labeled outcomes rather than circle area as a probability
encoding. The PMF's masses 1/4, 1/2, 1/4 yield CDF plateaus 0, 1/4, 3/4, 1; open
and filled markers preserve jump endpoints. The density 2x integrates to one on
[0,1], with area 1/4 below 1/2. Standard-normal shading between −1 and 1 is about
0.6827; the average of four independent standard normals has standard deviation
1/2, not 1/4.

The five equally weighted points with Y=2X have covariance 4 and correlation 1.
The ordered-sequence likelihood p³(1−p)² is maximized at 3/5. Three of four
illustrative intervals cover a fixed target 10, without implying an estimated
long-run coverage guarantee. Beta(2,3) and Beta(5,4) have density normalizers 12
and 280; the update is three successes in four trials. Regression coordinates
come from observations (0,1), (1,2), (2,5), whose fitted line is 2/3+2x and whose
residuals sum to zero. Enumerating the four ordered bootstrap samples from (2,6)
gives mean masses 1/4, 1/2, 1/4 at 2, 4, 6.

The published-content tests independently recompute polygon area, PMF/CDF
relationships, raw-data covariance and regression, interval coverage, beta
normalizers, and bootstrap probabilities. Figure captions name scales, numerical
approximations, and model limitations. Source digests are recorded only after
these source and mathematical inspections; application screenshots are documented
separately with the final verification.

Final application inspection repeated the iid normal-population assumptions in
three confidence-interval review variants, distinguishing known from estimated
spread. Their calculations and supplied critical values were unchanged. The
browser examples submit the requested four-place decimals, including 0.3679 and
mean-interval endpoints 10.0400 and 13.9600.
