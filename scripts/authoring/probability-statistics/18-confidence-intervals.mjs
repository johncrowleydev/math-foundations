import {
  r,
  lesson,
  section,
  termEntry,
  q,
  exact,
  approx,
  probability,
  fields,
  truth,
  quick,
  frac,
} from './helpers.mjs';
import { ciMean, ciT, ciProportion } from './inference-sources.mjs';
const endpoints = (lo, hi, probabilityBounds = false) =>
  fields([
    {
      id: 'lower',
      label: 'Lower endpoint',
      check: probabilityBounds ? probability(lo) : approx(lo),
    },
    {
      id: 'upper',
      label: 'Upper endpoint',
      check: probabilityBounds ? probability(hi) : approx(hi),
    },
  ]);
const sections = [
  section(
    'Coverage belongs to a procedure',
    r`A point estimate gives one location, but does not express how much it could vary under repeated sampling. A **confidence interval** is a pair of data-dependent endpoints produced by a procedure. A procedure with confidence level $1-\alpha$ covers the fixed population parameter in a proportion $1-\alpha$ of repeated samples under its assumptions, exactly or approximately as the method specifies.

Before observing data, both endpoints are random. After observing data, the calculated interval is fixed: it either contains the fixed parameter or it does not. A frequentist 95% confidence statement describes the reliability of the construction, not a posterior probability of 0.95 assigned to the parameter lying in this particular interval. Nor does it say that 95% of individual observations lie inside the interval. Estimating a population mean is different from describing the spread of individual observations.

Imagine a known population mean of 10 in a verification exercise. The intervals $[9,11]$, $[10.5,12]$, $[8,10]$, and $[9.5,10.5]$ cover it three times out of four. That observed coverage is $3/4$. It does not disprove a nominal 95% procedure from only four repetitions: the observed fraction itself varies. A large simulation can investigate coverage, but only under the distribution and sampling mechanism used in that simulation.

An interval is informative only together with its target, units, confidence level, and construction. For a symmetric interval $[\hat\theta-m,\hat\theta+m]$, $m$ is the margin of error and the width is $2m$. A narrow interval can still be misleading if the data are biased or the assumptions fail.`,
    [ciMean],
    [
      termEntry(
        'confidence-coverage',
        'Confidence coverage',
        'How often a repeated-sampling interval procedure contains the fixed target.',
        r`A level $1-\alpha$ procedure aims for $P_\theta(L(X)\le\theta\le U(X))=1-\alpha$, or an explicitly stated approximation.`,
        r`An interval procedure covering the target in 950 of 1000 simulated repetitions has observed coverage 0.95.`,
        'Confidence is not the fraction of individual observations inside an interval for a mean.',
      ),
    ],
  ),
  section(
    'A mean interval with known population spread',
    r`Assume independent observations from a normal population with mean $\mu$ and known standard deviation $\sigma$. Then $(\bar X-\mu)/(\sigma/\sqrt n)$ is standard normal. Let $z_{1-\alpha/2}$ be its lower-tail quantile: $P(Z\le z_{1-\alpha/2})=1-\alpha/2$. The central probability statement can be rearranged to give $\bar X\pm z_{1-\alpha/2}\sigma/\sqrt n$.

The denominator is the standard error of the mean, not the spread of an individual observation. With $n=25$, known $\sigma=5$, observed mean 12, and supplied 95% critical value 1.96, the standard error is 1. The interval is $12\pm1.96=[10.04,13.96]$. These numbers concern the population mean in the same measurement units as the data.

For a nonnormal population, a sufficiently accurate CLT approximation can motivate the same form for a large independent sample. It is then an approximate interval, not an exact normal-theory result. A fixed sample-size rule cannot guarantee accuracy for every skewed or heavy-tailed distribution. Sampling without replacement from a small finite population can also require a finite-population adjustment; the simple formula here assumes independence or a negligible sampling fraction.

Use supplied quantiles with their stated tail convention. A 95% central interval leaves 0.025 in each tail, so its lower-tail quantile is 0.975. Some tables label the corresponding upper-tail probability instead. Reading the wrong convention can change the interval substantially. Keep extra digits during intermediate arithmetic and round endpoints only at the requested precision.`,
    [ciMean],
    [
      termEntry(
        'margin-error',
        'Margin of error',
        'The half-width in a symmetric interval construction.',
        r`For a known-$\sigma$ mean interval, $m=z_{1-\alpha/2}\sigma/\sqrt n$.`,
        r`$\sigma=5$, $n=25$, and $z=1.96$ give $m=1.96$.`,
        'The margin is half the interval width, not its full width.',
      ),
    ],
  ),
  section(
    'Estimating spread leads to Student t',
    r`Usually the population standard deviation is unknown. Replace it by the sample standard deviation $S$, calculated with divisor $n-1$ inside the sample variance. For iid normal observations, $T=(\bar X-\mu)/(S/\sqrt n)$ has a **Student t distribution** with $n-1$ degrees of freedom. The randomness in the estimated denominator explains why the reference distribution changes.

A two-sided mean interval is $\bar X\pm t_{1-\alpha/2,n-1}S/\sqrt n$. The second subscript names the degrees of freedom. Student t has heavier tails than the standard normal; for a fixed confidence level its positive critical value is larger at small degrees of freedom and approaches the normal value as degrees of freedom grow. Use supplied table values rather than trying to express the quantile through elementary algebra.

For $n=9$, observed mean 20, sample standard deviation 3, and supplied 95% critical value $t_{0.975,8}=2.306$, the standard error is 1 and the interval is $[17.694,22.306]$. The result uses the stated rounded critical value; comparing independently computed endpoints should allow the announced numerical precision.

The exact t statement assumes a normal population and independent observations. For nonnormal populations it is often used approximately when the average and estimated spread behave well, but severe skewness, outliers, heavy tails, or dependence need attention. Choosing t instead of z does not repair those problems. With one observation, the usual sample variance and degrees of freedom are unavailable. Increasing sample size does not turn a convenience sample into a random sample.`,
    [ciT],
    [
      termEntry(
        'student-t-interval',
        'Student t mean interval',
        'A mean interval accounting for an estimated standard deviation.',
        r`$\bar X\pm t_{1-\alpha/2,n-1}S/\sqrt n$ under the stated normal sampling model.`,
        r`Mean 20, $S=3$, $n=9$, and critical value 2.306 give $[17.694,22.306]$.`,
        'Using t does not remove independence or distributional assumptions.',
      ),
    ],
  ),
  section(
    'Proportion intervals and boundary limitations',
    r`For iid Bernoulli trials, $\hat p$ estimates the success probability and has variance $p(1-p)/n$. The elementary **Wald interval** replaces the unknown parameter in this standard error: $\hat p\pm z_{1-\alpha/2}\sqrt{\hat p(1-\hat p)/n}$. This is a large-sample approximation. In this lesson, use it only when the sample contains at least ten successes and ten failures, alongside the stated independent sampling model. Those counts are a practical screening condition, not a proof of exact coverage.

Suppose 100 of 400 independent sampled items have a feature. Then $\hat p=1/4$ and the estimated standard error is $\sqrt{(1/4)(3/4)/400}=\sqrt3/80$. With supplied critical value 1.96, the approximate 95% interval is $[0.2076,0.2924]$ to four decimal places. In percentage units those endpoints are approximately 20.76% and 29.24%; do not mix probability decimals with percentages in the same calculation.

Near zero or one, the Wald method can behave badly. If no successes occur, its plug-in standard error is zero and the formula collapses to $[0,0]$, even though the true success probability need not be zero. An interval extending outside $[0,1]$ is another warning. Simply clipping it to the parameter range does not restore the advertised coverage. Other interval methods are available, but require their own derivation and are outside the computational tasks here.

Observation independence matters as much as the success count. Many repeated records from the same person do not automatically provide the same information as that many independent people. State both the population being estimated and the sampling unit before interpreting a proportion interval.`,
    [ciProportion],
    [
      termEntry(
        'wald-proportion',
        'Wald proportion interval',
        'An introductory large-sample interval using a plug-in Bernoulli standard error.',
        r`$\hat p\pm z\sqrt{\hat p(1-\hat p)/n}$.`,
        r`100 successes in 400 trials give $\hat p=1/4$.`,
        'Zero observed successes do not justify certainty that the population probability is zero.',
      ),
    ],
  ),
  section(
    'Planning precision and checking conclusions',
    r`A desired margin of error can guide sample-size planning. For a known population standard deviation and supplied normal critical value $z$, require $z\sigma/\sqrt n\le m$. Solving gives $n\ge(z\sigma/m)^2$, rounded upward to an integer. For $\sigma=4$, $z=1.96$, and desired margin 1, the bound is 61.4656, so at least 62 independent observations are required by this calculation.

For a proportion, the largest possible Bernoulli variance is $1/4$. A conservative normal-approximation planning formula is $n\ge z^2/(4m^2)$ when no preliminary proportion is available. “Conservative” refers to the variance choice within this planning formula; it is not an exact finite-sample coverage guarantee. The Chebyshev planning calculation from the preceding lesson answers that stronger distribution-free question under its own assumptions.

Increasing confidence widens an interval for fixed observed center, spread, and sample size. Increasing sample size narrows its standard-error factor, other quantities held fixed. Quadrupling sample size halves that factor. Across real samples, the observed mean and sample standard deviation can change, so these controlled comparisons are not promises about two independently collected intervals.

A final interpretation should name the population parameter, interval endpoints, units, confidence level, and relevant conditions. Do not infer causation from a narrow interval, confuse absence of a parameter value with proof of a mechanism, or claim that sampling uncertainty accounts for every source of error. Measurement bias, missing groups, and a changing population may dominate the reported margin.`,
    [ciMean, ciProportion],
    [
      termEntry(
        'precision-planning',
        'Precision planning',
        'Choosing a sample size for a stated margin under a specified model.',
        r`For known $\sigma$, $n\ge(z\sigma/m)^2$ and the integer choice rounds upward.`,
        r`$z=1.96$, $\sigma=4$, $m=1$ require $n=62$.`,
        'A sampling margin does not include every source of error.',
      ),
    ],
  ),
];
for (const [lo, hi] of [
  [2, 6],
  [10, 14],
  [-3, 5],
  [0.2, 0.8],
  [17, 23],
]) {
  const center = Number(((lo + hi) / 2).toFixed(10)),
    margin = Number(((hi - lo) / 2).toFixed(10));
  sections[0].questions.push(
    q(
      r`A symmetric confidence interval has endpoints ${lo} and ${hi}. Give its center.`,
      r`Average the endpoints: $(${lo}+${hi})/2=${center}$.`,
      exact(`(${lo}+(${hi}))/2`),
    ),
    q(
      r`For endpoints ${lo} and ${hi}, give the margin of error.`,
      r`The margin is half the width: $(${hi}-${lo})/2=${margin}$.`,
      exact(`(${hi}-(${lo}))/2`),
    ),
  );
}
sections[0].questions.push(
  q(
    'In 200 repeated simulated samples, 188 intervals contain the known target. Give the observed coverage fraction.',
    r`$188/200=0.94$.`,
    exact('0.94'),
  ),
  q(
    'Explain why a 95% mean confidence interval need not contain 95% of individual observations.',
    'The interval estimates a population mean; individual observations vary according to the population spread, which is different from the uncertainty of the estimated mean.',
  ),
);
for (const [mean, sigma, n, z] of [
  [12, 5, 25, 1.96],
  [30, 8, 64, 1.645],
  [5, 3, 36, 1.96],
  [-2, 4, 16, 2.576],
  [100, 12, 144, 1.96],
]) {
  const se = sigma / Math.sqrt(n),
    m = z * se;
  sections[1].questions.push(
    q(
      r`An iid normal sample has mean ${mean}, known population standard deviation ${sigma}, and size ${n}. Using supplied central-interval critical value ${z}, give both mean-confidence endpoints to four decimal places.`,
      r`The standard error is $${sigma}/\sqrt{${n}}=${se}$ and margin $${z}\cdot${se}=${m}$. The endpoints are $${(mean - m).toFixed(4)}$ and $${(mean + m).toFixed(4)}$.`,
      endpoints((mean - m).toFixed(8), (mean + m).toFixed(8)),
    ),
    q(
      r`For known population standard deviation ${sigma} and independent sample size ${n}, give the standard error of the sample mean.`,
      r`$\sigma/\sqrt n=${sigma}/\sqrt{${n}}=${se}$.`,
      exact(se),
    ),
  );
}
sections[1].questions.push(
  q(
    'A central confidence level is 0.90. Give the lower-tail probability used to find its positive normal critical value.',
    r`Each tail has probability 0.05, so the positive quantile has lower-tail probability $0.95$.`,
    exact('0.95'),
  ),
  q(
    'Why does a known-standard-deviation interval use σ/√n rather than σ?',
    'The interval concerns uncertainty in the sample average. Independent averaging divides variance by n, so its standard deviation is σ/√n.',
  ),
);
for (const [mean, s, n, t] of [
  [20, 3, 9, 2.306],
  [8, 4, 16, 2.131],
  [10, 5, 25, 2.064],
  [0, 6, 36, 2.03],
  [50, 7, 49, 2.011],
]) {
  const se = s / Math.sqrt(n),
    m = t * se;
  sections[2].questions.push(
    q(
      r`An iid normal sample has mean ${mean}, sample standard deviation ${s}, and size ${n}. Use supplied 95% t critical value ${t} to give both mean-confidence endpoints to four decimal places.`,
      r`Use $S/\sqrt n=${se}$, so the margin is $${m}$. The endpoints are $${(mean - m).toFixed(4)}$ and $${(mean + m).toFixed(4)}$.`,
      endpoints((mean - m).toFixed(8), (mean + m).toFixed(8)),
    ),
    q(
      r`What degrees of freedom apply to the one-sample t interval for ${n} independent normal observations?`,
      r`The degrees of freedom are $n-1=${n - 1}$.`,
      exact(n - 1),
    ),
  );
}
sections[2].questions.push(
  q(
    'Explain why replacing the unknown population standard deviation with S changes the reference distribution under normal sampling.',
    'The denominator becomes random. Accounting for its variability yields the Student t distribution with n−1 degrees of freedom.',
  ),
  q(
    'Does choosing Student t repair a sample of dependent duplicate observations?',
    'No. The usual t derivation still needs independent observations.',
    truth(false),
  ),
);
for (const [hits, n] of [
  [100, 400],
  [80, 200],
  [150, 300],
  [60, 400],
  [180, 400],
]) {
  const p = hits / n,
    se = Math.sqrt((p * (1 - p)) / n),
    m = 1.96 * se;
  sections[3].questions.push(
    q(
      r`In ${n} iid Bernoulli trials, ${hits} successes occur. Use the Wald approximation and supplied 95% critical value 1.96. Give both interval endpoints as probability decimals to four places.`,
      r`$\hat p=${p}$, with estimated standard error $\sqrt{${p}(1-${p})/${n}}$. The approximate interval is $[${(p - m).toFixed(4)},${(p + m).toFixed(4)}]$. Both success and failure counts meet the stated screen.`,
      endpoints((p - m).toFixed(10), (p + m).toFixed(10), true),
    ),
    q(
      r`${hits} of ${n} trials succeed. Give the observed failure proportion as an exact value.`,
      r`There are $${n - hits}$ failures, so the proportion is $${n - hits}/${n}=${frac(n - hits, n)}$.`,
      exact(frac(n - hits, n)),
    ),
  );
}
sections[3].questions.push(
  q(
    'Explain why the Wald interval [0,0] after zero successes is not evidence that the true probability must be zero.',
    'The plug-in variance degenerates at the boundary. A positive success probability can still produce zero successes in a finite sample; the approximation is inappropriate.',
  ),
  q(
    'Does clipping an invalid Wald endpoint to zero establish nominal coverage?',
    'No. Clipping changes the endpoints without establishing the repeated-sampling coverage of the resulting procedure.',
    truth(false),
  ),
);
for (const [sigma, margin, z] of [
  [4, 1, 1.96],
  [5, 2, 1.96],
  [3, 0.5, 1.645],
  [10, 1, 2.576],
  [2, 0.25, 1.96],
]) {
  const raw = ((z * sigma) / margin) ** 2,
    n = Math.ceil(raw);
  sections[4].questions.push(
    q(
      r`Plan an iid known-standard-deviation mean interval with $\sigma=${sigma}$, supplied $z=${z}$, and margin at most ${margin}. Give the smallest integer n satisfying the planning formula.`,
      r`$n\ge(${z}\cdot${sigma}/${margin})^2=${raw.toFixed(6)}$. Rounding upward gives $n=${n}$.`,
      exact(n),
    ),
    q(
      r`A design uses supplied critical value ${z} and aims to estimate a proportion within ${margin / 10}, with no preliminary proportion. Give the integer sample size from the conservative normal planning formula.`,
      r`Use variance bound $1/4$: $n\ge${z}^2/[4(${margin / 10})^2]$. Round upward to $${Math.ceil((z * z) / (4 * (margin / 10) ** 2))}$.`,
      exact(Math.ceil((z * z) / (4 * (margin / 10) ** 2))),
    ),
  );
}
sections[4].questions.push(
  q(
    'Why must a required sample size be rounded upward rather than to the nearest integer?',
    'Rounding downward can violate the requested margin inequality. The next integer at or above the real-valued bound preserves it.',
  ),
  q(
    'Describe two sources of uncertainty not corrected merely by increasing an independent-sampling formula’s n.',
    'A systematic measurement bias and omission of a population subgroup can persist. The formula quantifies sampling variation under its assumptions, not those errors.',
  ),
);
sections[0].quickCheck = quick(
  'What does a 95% confidence level describe?',
  [
    'The procedure’s repeated-sampling coverage',
    'The fraction of observations in this mean interval',
    'A posterior probability for this fixed interval',
  ],
  0,
  'Confidence belongs to the interval-generating procedure under its sampling assumptions.',
  [
    'Correct. It describes how often the random interval contains the fixed parameter under repetition.',
    'A mean interval concerns the population mean, not the spread of individual observations.',
    'Posterior probability requires a Bayesian model; it is not the frequentist confidence interpretation.',
  ],
);
sections[2].quickCheck = quick(
  'For an iid normal sample with unknown population standard deviation, which reference is used for a mean interval?',
  [
    'Student t with n−1 degrees of freedom',
    'Standard normal with n degrees of freedom',
    'Uniform on the observed range',
  ],
  0,
  'Estimating the standard deviation changes the standardized mean’s distribution.',
  [
    'Correct. The random estimated denominator leads to Student t with n−1 degrees of freedom.',
    'The standard normal distribution has no degrees-of-freedom parameter and treats the standard deviation as known.',
    'A uniform reference does not describe the standardized sample mean under normal sampling.',
  ],
);
sections[0].review = [
  q('An interval runs from 4 to 10. Give its margin of error.', r`$(10-4)/2=3$.`, exact(3)),
  q('An interval runs from −2 to 6. Give its center.', r`$(-2+6)/2=2$.`, exact(2)),
  q(
    'Interpret the word coverage in a confidence-interval procedure.',
    'It is the probability, over repeated samples under the stated model, that the random interval contains the fixed parameter.',
  ),
];
sections[1].review = [
  q(
    'An iid normal sample has mean 8, known population σ=2, and n=16. Use supplied z=1.96 for a 95% mean confidence interval. Give endpoints to four decimal places.',
    r`SE is $1/2$, margin is 0.98, and endpoints are 7.0200 and 8.9800.`,
    endpoints('7.02', '8.98'),
  ),
  q(
    'An iid normal sample has mean 3, known population σ=4, and n=64. Use supplied z=1.96 for a 95% mean confidence interval. Give endpoints to four decimal places.',
    r`SE is $1/2$, so endpoints are 2.0200 and 3.9800.`,
    endpoints('2.02', '3.98'),
  ),
  q(
    'For a central 98% normal interval, give the lower-tail probability of its positive critical quantile.',
    r`$1-(1-0.98)/2=0.99$.`,
    exact('0.99'),
  ),
];
sections[2].review = [
  q('For a sample of size 12, give the one-sample t degrees of freedom.', r`$12-1=11$.`, exact(11)),
  q(
    'An iid normal sample has mean 10, sample SD 2, and n=16; population SD is unknown. Use supplied t=2.131 for a 95% mean confidence interval. Give endpoints to four decimal places.',
    r`The margin is $2.131/2=1.0655$, giving 8.9345 and 11.0655.`,
    endpoints('8.9345', '11.0655'),
  ),
  q(
    'Is the one-sample t result exact for every nonnormal population just because n≥30?',
    'No. The exact reference requires normal sampling, and approximation quality cannot be guaranteed by one universal sample-size cutoff.',
    truth(false),
  ),
];
sections[3].review = [
  q(
    'An iid sample has 50 successes among 200. Give the estimated Bernoulli proportion.',
    r`$50/200=1/4$.`,
    exact('1/4'),
  ),
  q(
    'An iid sample has 60 successes among 300. Give the estimated Bernoulli proportion.',
    r`$60/300=1/5$.`,
    exact('1/5'),
  ),
  q(
    'Why is the elementary Wald interval unsuitable after zero observed successes?',
    'Its plug-in variance becomes zero at the boundary even though a finite zero-success sample is compatible with positive probabilities.',
  ),
];
sections[4].review = [
  q(
    'Known σ=2, supplied z=1.96, target margin 1. Give the required integer size.',
    r`$n\ge(1.96\cdot2)^2=15.3664$, so $n=16$.`,
    exact(16),
  ),
  q(
    'Known σ=3, supplied z=1.96, target margin 1. Give the required integer size.',
    r`$n\ge(1.96\cdot3)^2=34.5744$, so $n=35$.`,
    exact(35),
  ),
  q(
    'Holding the other design quantities fixed, what sample-size multiplier halves the standard-error factor?',
    r`Multiplying $n$ by $4$ doubles $\sqrt n$ and halves the factor.`,
    exact(4),
  ),
];
export default lesson(
  18,
  'confidence-intervals',
  'Confidence Intervals',
  'An estimate becomes more useful when we describe its uncertainty. We derive introductory confidence intervals from sampling distributions, keep their assumptions visible, and distinguish repeated-sampling coverage from claims about individual observations or posterior probabilities.',
  sections,
);
