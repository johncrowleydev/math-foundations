# Independent check of probability foundations

On September 20, 2026, the integrating author read lessons 01–08, including their
worked examples, practice, dedicated review, quick-check explanations, definitions,
and prerequisite order. This check was independent of the lesson author's own
calculation and source inspection. See the [source inspection](probability-foundations-inspection.md)
for the complete pinpoint passage assignments.

The temporary script `/tmp/ps-foundations-independent.py` used Python Fraction,
finite enumeration, and SymPy in `/tmp/calculus-sympy` to verify the calculations
without importing the authoring helpers or their expected-answer fields. It passed:

- Four-region event reconstructions, dice sums and conditional dice events,
  ordered assignments, repeated-symbol arrangements, constrained committees,
  without-replacement samples, and collision probabilities by enumerating outcomes.
- The pairwise-independent fair-bit counterexample and the dependence introduced
  by retaining outcomes with at least one head. Recomputed posterior weights for
  server, screening, and bag-selection examples from their stated priors and rates.
- Finite PMF transformations, cumulative jumps and strict/inclusive tails; means
  and variances from weighted raw values; conditional means after renormalization;
  the equal-moment counterexamples and distinct expected-cost/spread calculations.
- Binomial masses from all ordered Bernoulli paths, followed by their means and
  variances. Differentiated the geometric series to obtain the geometric mean,
  factorial second moment, and variance, checking the one-unit convention shift.
- Hypergeometric PMFs and moments from every labeled subset in the authored
  small-population examples. This separately verified the finite-population
  correction and the factorial-moment derivation.
- Poisson factorial moments and independent convolution, interval-rate arithmetic,
  and four-place evaluation of the original binomial and Poisson approximation
  examples. The approximating model is distinguished from the exact binomial law.

The remaining direct arithmetic was checked while reading each question and
solution. No numerical discrepancy was found in the intended models. The check
did find prompts relying on another question's event sets, probabilities, or bag
composition. The lesson author was asked to repeat those data in each prompt,
because practice can appear alone in review. Original independence assumptions
were also made explicit in coin/dice questions; fair marginal distributions alone
do not justify equally likely pairs. The three-event inclusion–exclusion formula
was developed before its first required use, and the first quick check was phrased
in terms of supplied equally likely outcomes before independence is introduced.

The following supporting passages were also inspected independently:
[Pishro-Nik §3.1.5](https://www.probabilitycourse.com/chapter3/3_1_5_special_discrete_distr.php)
for the Bernoulli, geometric, binomial, hypergeometric, and Poisson constructions,
normalization, and rare-success limit;
[§3.2.4](https://www.probabilitycourse.com/chapter3/3_2_4_variance.php)
for squared deviations and moments; and
[§1.4.1](https://www.probabilitycourse.com/chapter1/1_4_1_independence.php)
for independence and conditional independence. The subject explicitly permits
constant endpoint cases, uses trials through success for geometric variables,
and translates the source's marked/unmarked/sample hypergeometric parameters to
population/marked/sample. The original exercises and enumerations are not copied
textbook examples.
