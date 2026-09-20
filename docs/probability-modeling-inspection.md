# Regression and model-assessment authoring inspection

Inspected on 2026-09-20. Lessons 21 and 22 contain original explanations,
worked examples, practice, and dedicated review. The cited textbooks support
definitions, assumptions, and methods; none is represented as the source of the
particular numerical exercises.

## Passages inspected

- OpenStax, _Introductory Statistics_, second edition, §12.3, **The Regression
  Equation**: inspected the centered slope/intercept formulas, residual and SSE
  definitions, residual plots, slope interpretation, and extrapolation discussion
  at <https://openstax.org/books/introductory-statistics-2e/pages/12-3-the-regression-equation>.
- Deisenroth, Faisal, and Ong, _Mathematics for Machine Learning_, author PDF
  dated 2024-01-15: §9.1–9.2, printed pp.291–295 (PDF pp.297–301), for the
  independent common-variance Gaussian observation model and its squared-error
  likelihood; §8.2, printed pp.259–266 (PDF pp.265–272), for expected and empirical
  losses; §8.6, printed pp.283–288 (PDF pp.289–294), for training, validation, test
  roles, model flexibility, overfitting, and model selection. The inspected PDF is
  <https://mml-book.github.io/book/mml-book.pdf>. Temporary extractions were
  `/tmp/ps-mml-regression.txt`, `/tmp/ps-mml-risk.txt`, and
  `/tmp/ps-mml-selection.txt`; they are not published assets.
- James, Witten, Hastie, and Tibshirani, _An Introduction to Statistical Learning
  with Applications in R_, 2013, corrected seventh printing 2017: downloaded the
  author-hosted <https://www.statlearning.com/s/ISLRSeventhPrinting.pdf> to
  `/tmp/ps-islr.pdf` and inspected the extracted passages. §3.1.2, printed
  pp.65–68 (PDF pp.74–77), supplies coefficient standard errors, residual variance,
  t statistics, and the n−2 confidence multiplier. §3.2.2, printed pp.81–82,
  distinguishes mean-response from individual-response uncertainty. §3.3.3,
  printed pp.92–101 (PDF pp.101–110), covers nonlinear means, dependent errors,
  nonconstant variance, and leverage. §4.4.3, printed pp.145–149 (PDF pp.154–158),
  includes the confusion-matrix denominators and precision/recall/specificity
  terminology. §§5.1.1–5.1.4, printed pp.176–185 (PDF pp.184–193), cover held-out
  MSE and cross-validation. §5.2, printed pp.187–190 (PDF pp.195–198), explicitly
  resamples paired rows with replacement and uses the sample standard deviation
  of B simulated estimates to estimate standard error.
- Pennsylvania State University, STAT 501, **Lesson 3: SLR Estimation &
  Prediction**, §§3.2–3.3, at <https://online.stat.psu.edu/stat501/Lesson03>:
  inspected the actual indexed course passages containing both interval formulas,
  the independent/normal/equal-variance assumptions, and the explanation that
  individual prediction adds error variance. Direct page opening returned an
  origin certificate/fetch error; the web search result exposed the complete
  supporting formula and explanation passages. The citation identifies that
  institutional page rather than a secondary description.

## Mathematical checks and conventions

A separate SymPy 1.14 script, `/tmp/ps-modeling-independent.py`, recomputed the
mathematics from raw data, symbolic likelihoods, and finite enumerations rather
than invoking the authoring helpers or trusting the graders' expected answers.
It passed the following checks:

- Solved the normal equations for `(0,1), (1,2), (2,5)`, obtaining intercept 2/3,
  slope 2, residuals `(1/3, −2/3, 1/3)`, and SSE 2/3. Independently solved the
  centered equations for all three authored summary-data families.
- Differentiated the normal log-likelihood with respect to variance, obtaining
  SSE/n, and recomputed the three likelihood comparisons and the ML/unbiased
  variance examples. The text explicitly distinguishes SSE/n from SSE/(n−2),
  fixed from unknown variance, residuals from population errors, and likelihood
  density from continuous point probability.
- Recomputed all three slope-SE/test-statistic families, the confidence-endpoint
  exercise, the three leverage/mean-variance/prediction-variance families, and the
  worked prediction intervals. For n=10, s=2, x₀=x̄, fitted mean 5, and supplied
  multiplier 2.306, the mean interval rounds to `[3.5416, 6.4584]` and the new-response
  interval to `[0.1629, 9.8371]`. The latter endpoints were corrected during this
  independent pass. Supplied critical values are deliberately treated as stated
  rounded inputs rather than recomputed by a runtime distribution engine.
- Enumerated all ordered size-two resamples of `(2,6)` and `(0,4)`, and all
  3³/4⁴ index sequences for the inclusion/omission examples. Checked empirical
  means/variances and every simulated-replicate standard-deviation example.
  Exhaustive finite distributions use probability weights, while independently
  simulated replicates use B−1 to estimate variance. Neither calculation is
  presented as creating additional original observations or curing selection bias.
- Reconstructed confusion matrices as lists of actual/predicted class pairs and
  computed accuracy, precision, and recall independently for both practice families
  and the reading example. Checked held-out squared losses, observation-weighted
  folds, expected decision costs, and all three cost thresholds. Zero-denominator
  precision remains undefined. The false-discovery fraction and false-positive
  rate have explicitly different conditioning groups.

The remaining direct arithmetic in practice and review was inspected against
these definitions, including units, R² complements, degrees of freedom, residual
signs, held-out splitting counts, and expected losses under changed group weights.
Reasoning answers were checked for the stated distinctions: association versus
causation, significance versus usefulness, coefficient uncertainty versus predictive
error, training versus validation versus final test, and independent rows versus
paired/grouped/time-dependent observations. The discussion of preprocessing and
splitting applies the cited held-out-information principle to original scenarios;
it is not attributed as a copied textbook exercise.

## Prerequisites and integration checks

Regression assumes the earlier least-squares and calculus material, followed by
this subject's normal distributions, likelihood, estimation, confidence intervals,
and tests. The lesson introduces conditional errors and residuals before
likelihood, residual variance before coefficient standard errors, and coefficient
uncertainty before mean/new-response intervals. The next lesson defines empirical
probabilities before bootstrap sampling, bootstrap estimates before their SE,
held-out roles before model comparison, and each confusion-matrix denominator
before expected-cost decisions.

Each lesson has five sections, 55 practice questions, 15 separately authored
review questions, and exactly two quick checks with distinct response feedback.
The section readings contain approximately 1,400 words each. All 239 deterministic
correct/incorrect fixture responses passed with the current assessment helper;
this confirms authored fixture behavior, separately from the independent math
checks above. KaTeX validation passed for section bodies, questions, solutions,
and glossary explanations. Global content/source registration, published digest
inspection, and final lesson/figure screenshots belong to the integrating author;
no central generated content or source digests were edited in this worktree.
