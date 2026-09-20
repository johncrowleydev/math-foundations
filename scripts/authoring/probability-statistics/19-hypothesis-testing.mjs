import {
  r,
  lesson,
  section,
  termEntry,
  q,
  exact,
  approx,
  probability,
  truth,
  term,
  quick,
  frac,
} from './helpers.mjs';
import {
  hypotheses,
  testing,
  testDistributions,
  errors,
  ciMean,
  ciT,
  ciProportion,
  concentration,
} from './inference-sources.mjs';
const sections = [
  section(
    'State a claim about the population before examining evidence',
    r`A **hypothesis test** uses data to assess a specified population claim. The null hypothesis $H_0$ describes the reference model; the alternative $H_1$ describes the departure being investigated. For a population mean, a two-sided question might use $H_0:\mu=10$ against $H_1:\mu\ne10$. An upper-sided question uses $H_0:\mu\le10$ against $H_1:\mu>10$, with the boundary value 10 supplying the reference calculation for the normal procedures here.

Choose the direction from the scientific question before inspecting the result. Selecting whichever tail looks favorable after observing data changes the procedure and its error rate. Hypotheses concern population parameters rather than the already observed sample average. The sample average is evidence used to assess a claim, not an unknown quantity to be tested.

A **test statistic** summarizes the evidence in a way whose distribution can be described under the null. An unusually large positive standardized mean supports an upper alternative; an unusually large magnitude supports a two-sided alternative. “Unusual” is always relative to the specified model and the chosen statistic. A surprising observation can expose a wrong null parameter, a violated sampling assumption, or an inappropriate distributional model.

A test yields a decision to reject or fail to reject the null according to a stated rule. Failure to reject is not proof that the null is true. It may reflect limited information, high variation, or a departure the test cannot detect well. Keep the target claim distinct from any practical action that follows: an action can depend on costs, effect sizes, and other evidence as well as the test.`,
    [hypotheses, testing],
    [
      termEntry(
        'null-alternative',
        'Null and alternative hypotheses',
        'Population claims defining the reference and the departure of interest.',
        r`An upper-sided mean test uses $H_0:\mu\le\mu_0$ and $H_1:\mu>\mu_0$.`,
        r`A claim that mean latency exceeds 10 uses the alternative $\mu>10$.`,
        'Hypotheses concern a population parameter, not the observed sample mean.',
      ),
    ],
  ),
  section(
    'Tail probabilities under the null model',
    r`A **p-value** is the null-model probability of a statistic at least as unfavorable to the null as the observed statistic, using the chosen alternative to define extremeness. It is not the probability that the null is true, and it is not the probability that the observed data arose by chance. The definition compares the observed statistic with a whole set of possible outcomes under the reference model.

For a standard normal statistic $Z$ and observed value $z$, an upper-sided p-value is $1-\Phi(z)$; a lower-sided value is $\Phi(z)$. For a two-sided normal test, symmetry gives $2[1-\Phi(|z|)]$. If $z=2$ and the supplied value is $\Phi(2)=0.97725$, the upper-sided p-value is 0.02275 and the two-sided p-value is 0.04550. Doubling a tail is appropriate here because the reference distribution is continuous and symmetric and the test uses absolute magnitude; it is not a universal rule for arbitrary discrete tests.

A significance level $\alpha$ specifies the decision threshold in advance. In this subject, reject when $p\le\alpha$ and otherwise fail to reject. With $p=0.04550$, the rule rejects at 0.05 but not at 0.01. A smaller threshold makes rejection harder; it does not make the observed effect smaller or alter the already calculated p-value.

Under a composite null, the p-value must be valid for the allowed null parameter values. For the elementary upper-sided normal mean tests here, the boundary parameter gives the largest upper-tail rejection probability. More complicated nuisance-parameter questions require further methods. Supplied tail values keep numerical practice focused on choosing the correct probability and interpreting it.`,
    [testing, hypotheses],
    [
      termEntry(
        'p-value',
        'p-value',
        'A tail probability for the chosen test statistic under the null model.',
        r`For an upper-sided normal test, $p=1-\Phi(z_{\rm obs})$.`,
        r`$\Phi(2)=0.97725$ gives upper-tail p-value 0.02275.`,
        'It is not the posterior probability that the null is true.',
      ),
      termEntry(
        'significance-level',
        'Significance level',
        'A preselected threshold controlling the test decision.',
        r`Use the stated rule: reject when $p\le\alpha$.`,
        r`A p-value of 0.03 rejects at 0.05 but not at 0.01.`,
        'Changing the threshold does not change the observed p-value.',
      ),
    ],
  ),
  section(
    'Tests for a single population mean',
    r`For independent observations from a normal population with known standard deviation, test a null mean $\mu_0$ with $Z=(\bar X-\mu_0)/(\sigma/\sqrt n)$. Under the boundary null this statistic is standard normal. For a nonnormal population, using it through a CLT argument is approximate and needs appropriate sample behavior. The numerator measures the observed departure and the denominator expresses sampling variability in the same units.

Suppose a normal sample of size 25 has mean 12, the null mean is 10, and known population standard deviation is 5. The standard error is 1 and the statistic is 2. Using the previous supplied normal table value gives a two-sided p-value of 0.04550. At level 0.05 this is evidence against the equality null under the stated model, not proof that every observation differs materially from 10.

When population standard deviation is unknown, use the sample standard deviation and $T=(\bar X-\mu_0)/(S/\sqrt n)$. Under iid normal sampling the reference is Student t with $n-1$ degrees of freedom. A sample of size 9 with mean 22, null mean 20, and sample standard deviation 3 has statistic 2 with 8 degrees of freedom. Use a t tail for those degrees of freedom, not a standard normal tail for the same numerical statistic.

A two-sided test and its corresponding confidence interval agree when they use the same model, standard error, critical values, and significance level: rejecting the equality null corresponds to excluding the null mean from the interval, apart from explicitly chosen boundary conventions. Combining a one-sided test with an unrelated two-sided interval can produce a misleading comparison.`,
    [testing, ciMean, ciT],
    [
      termEntry(
        'one-sample-test-statistic',
        'One-sample standardized mean',
        'The observed mean departure divided by its standard error.',
        r`$Z=(\bar X-\mu_0)/(\sigma/\sqrt n)$ or $T=(\bar X-\mu_0)/(S/\sqrt n)$.`,
        r`Mean 12, null 10, $\sigma=5$, $n=25$ give $Z=2$.`,
        'The reference distribution changes when the population spread is estimated.',
      ),
    ],
  ),
  section(
    'A proportion test uses the null standard error',
    r`For iid Bernoulli trials, a large-sample test of $p=p_0$ uses $Z=(\hat p-p_0)/\sqrt{p_0(1-p_0)/n}$. Here the standard error is calculated under the null, unlike the elementary Wald confidence interval that plugs in $\hat p$. Require $0<p_0<1$ and sufficiently large expected success and failure counts. This lesson uses $np_0\ge10$ and $n(1-p_0)\ge10$ as a practical screen; the reference remains an approximation.

If 60 of 100 trials succeed and $p_0=1/2$, the null standard error is $\sqrt{(1/2)(1/2)/100}=0.05$. The statistic is $(0.60-0.50)/0.05=2$, giving the same normal tail calculations as before. In this context the observed effect is a difference of 0.10, or ten percentage points. A ten-percentage-point difference is not the same as a ten-percent relative increase.

Small counts or boundary null values require different handling. For example, under $p_0=0$ an observed success has probability zero in the exact Bernoulli model, while the standardized formula divides by zero. Do not replace an undefined denominator by a tiny number. If an exact binomial tail is supplied, it can be used directly for the stated test; its discreteness may make attainable p-values coarse.

Repeated observations from dependent units undermine the iid variance calculation. Testing thousands of selected proportions also changes how often some result appears significant. State the sampling unit, null probability, direction, and reference method before calculating. A correct tail subtraction cannot compensate for an incorrect experimental model.`,
    [testDistributions, testing, ciProportion, hypotheses],
    [
      termEntry(
        'null-standard-error',
        'Null standard error',
        'Sampling variability evaluated using the null parameter.',
        r`For a Bernoulli proportion test, $\operatorname{SE}_0=\sqrt{p_0(1-p_0)/n}$.`,
        r`$p_0=1/2$, $n=100$ give $\operatorname{SE}_0=0.05$.`,
        'The plug-in confidence-interval standard error is a different calculation.',
      ),
    ],
  ),
  section(
    'Errors, power, and practical meaning',
    r`A **Type I error** rejects a true null; a **Type II error** fails to reject when the alternative is true. A level-$\alpha$ test controls the Type I probability under its stated null model, exactly or approximately according to the procedure. **Power** is the rejection probability at a specified alternative parameter value. It depends on effect size, sample size, noise, and the rejection rule; it is not one universal number attached to a test name.

If a rule rejects when $\bar X>12$, then its power at an alternative model is $P_{\rm alternative}(\bar X>12)$. If that model places probability 0.80 above 12, power is 0.80 and the Type II probability there is 0.20. A different alternative mean can have different power. Lowering the significance threshold generally reduces power when the rest of the design stays fixed.

Statistical significance does not measure practical importance. With many independent observations, a small effect can be estimated precisely and produce a small p-value. Conversely, an important effect may fail to reach a threshold in a noisy small sample. Report the estimated effect, its units, uncertainty, and context alongside the decision. A p-value does not establish causation, model adequacy, or the absence of bias.

Multiplicity also matters. For $m$ valid tests each with Type I probability at most $\alpha$, the union bound gives probability at most $m\alpha$ of any false rejection when all nulls are true, capped at one. Testing each at $\alpha/m$ gives a simple family-level bound of $\alpha$, without requiring independence. Repeatedly inspecting data and stopping when a fixed-sample test becomes significant changes the procedure; its original guarantee cannot simply be assumed.`,
    [errors, testing, concentration],
    [
      termEntry(
        'test-power',
        'Test power',
        'Rejection probability at a specified alternative.',
        r`Power at $\theta_1$ is $P_{\theta_1}(\text{reject }H_0)$.`,
        r`Power 0.80 corresponds to Type II probability 0.20 at that alternative.`,
        'Power is not the probability that a rejection is correct.',
      ),
      termEntry(
        'test-error-types',
        'Type I and Type II errors',
        'False rejection and failure to reject a false null.',
        r`Type I: reject a true $H_0$. Type II: fail to reject at a specified alternative.`,
        r`Declaring an effect under a true no-effect null is Type I.`,
        'Failing to reject does not establish equivalence.',
      ),
    ],
  ),
];
const hypothesesCases = [
  ['exceeds', '>'],
  ['is below', '<'],
  ['differs from', '≠'],
  ['is greater than', '>'],
  ['is less than', '<'],
];
for (const [phrase, symbol] of hypothesesCases) {
  sections[0].questions.push(
    q(
      `The population mean ${phrase} 10 is the research claim. Give the comparison symbol in the alternative hypothesis.`,
      `The alternative concerns the population mean and uses the symbol ${symbol}.`,
      {
        validator: 'term',
        params: { accepted: symbol === '≠' ? ['≠', '!=', 'not equal'] : [symbol] },
        correct: symbol,
        incorrect: '=',
      },
    ),
  );
}
sections[0].questions.push(
  q(
    'Should an alternative hypothesis ordinarily be chosen after seeing which direction the sample mean moved?',
    'No. That data-dependent choice changes the rejection procedure and can invalidate its announced error control.',
    truth(false),
  ),
  q(
    'Does failure to reject a null hypothesis prove it true?',
    'No. It can reflect insufficient information or low power against the relevant departure.',
    truth(false),
  ),
  q(
    'A sample mean is already 12. Should the null hypothesis be “the observed sample mean equals 10”? Explain.',
    'No. The observed statistic is known. A test should address an unknown population parameter, such as the population mean.',
  ),
  q(
    'State null and alternative hypotheses for a two-sided question about whether a population proportion equals 0.4.',
    r`$H_0:p=0.4$ and $H_1:p\ne0.4$.`,
  ),
  q(
    'Explain why a model assumption violation can produce an unusual test statistic even if the null mean is correct.',
    'The reference distribution may fail when dependence, spread, or shape differs from the assumed model, so the calculated tail need not have its claimed interpretation.',
  ),
);
for (const [z, cdf] of [
  [1, '0.84134'],
  [1.5, '0.93319'],
  [2, '0.97725'],
  [2.5, '0.99379'],
  [3, '0.99865'],
]) {
  const upper = 1 - Number(cdf);
  sections[1].questions.push(
    q(
      r`The observed normal statistic is ${z}, and the supplied value is $\Phi(${z})=${cdf}$. Give its upper-sided p-value to five decimal places.`,
      r`Subtract the lower tail from one: $1-${cdf}=${upper.toFixed(5)}$.`,
      probability(upper.toFixed(8), '0.000005'),
    ),
    q(
      r`For normal statistic ${z} and supplied $\Phi(${z})=${cdf}$, give the two-sided p-value to five decimal places.`,
      r`Normal symmetry gives $2(1-${cdf})=${(2 * upper).toFixed(5)}$.`,
      probability((2 * upper).toFixed(8), '0.000005'),
    ),
  );
}
sections[1].questions.push(
  q(
    'A p-value is 0.03. Under the rule p≤α, reject at α=0.05?',
    'Yes. The observed p-value is below the preselected threshold.',
    truth(true),
  ),
  q(
    'A p-value is 0.05. Under the stated rule p≤α, reject at α=0.05?',
    'Yes. Equality is included in the stated rejection rule.',
    truth(true),
  ),
  q(
    'Explain why a p-value is not P(H₀ is true given the data).',
    'The p-value conditions on a null model and measures possible data-statistic extremeness. A posterior reverses that conditioning and requires a prior model.',
  ),
);
for (const [mean, mu, sigma, n] of [
  [12, 10, 5, 25],
  [18, 20, 4, 16],
  [5, 4, 3, 36],
  [1, 2, 2, 16],
  [20, 20, 6, 36],
]) {
  const z = (mean - mu) / (sigma / Math.sqrt(n));
  sections[2].questions.push(
    q(
      r`For an iid normal sample with mean ${mean}, null mean ${mu}, known $\sigma=${sigma}$, and $n=${n}$, give the z statistic.`,
      r`Standardize the difference: $(${mean}-${mu})/(${sigma}/\sqrt{${n}})=${z}$.`,
      exact(z),
    ),
    q(
      r`If the value ${sigma} were the sample standard deviation instead, with normal iid data and the same mean ${mean}, null ${mu}, and size ${n}, give the t statistic.`,
      r`The numerical statistic remains $${z}$, but its reference is Student t with $${n - 1}$ degrees of freedom.`,
      exact(z),
    ),
  );
}
sections[2].questions.push(
  q(
    'A matching two-sided 95% mean confidence interval is [8,12]. Does its corresponding level-0.05 test reject μ=10?',
    'No. The null value lies inside the matching interval.',
    truth(false),
  ),
  q(
    'A matching two-sided 95% interval is [8,12]. Does the corresponding test reject μ=15?',
    'Yes. The null value is outside the matching interval.',
    truth(true),
  ),
);
for (const hits of [40, 50, 55, 60, 70]) {
  const z = (hits - 50) / 5;
  sections[3].questions.push(
    q(
      r`There are ${hits} successes in 100 iid Bernoulli trials. For null $p_0=1/2$, give the normal-approximation test statistic.`,
      r`The null standard error is 0.05. Thus $(${hits}/100-0.5)/0.05=${z}$.`,
      exact(z),
    ),
    q(
      r`For ${hits} successes in 100 trials, give the observed difference from null probability 1/2 in percentage points.`,
      r`The difference is $100(${hits}/100-0.5)=${hits - 50}$ percentage points.`,
      exact(hits - 50),
    ),
  );
}
sections[3].questions.push(
  q(
    'An exact upper-tail binomial test reports tail probability 0.012. At α=0.01, should the null be rejected under p≤α?',
    'No. The p-value exceeds 0.01.',
    truth(false),
  ),
  q(
    'Why does the proportion z test use p₀ rather than p-hat in its standard error?',
    'Its reference variability is computed under the null hypothesis. The plug-in confidence interval estimates variability using the observed proportion instead.',
  ),
);
for (const [power, m, alpha] of [
  [0.8, 5, 0.05],
  [0.9, 10, 0.05],
  [0.6, 4, 0.04],
  [0.95, 20, 0.1],
  [0.7, 8, 0.08],
]) {
  sections[4].questions.push(
    q(
      r`A test has power ${power} at a specified alternative. Give its Type II error probability there.`,
      r`Failing to reject is the complementary decision: $1-${power}=${(1 - power).toFixed(2)}$.`,
      exact((1 - power).toFixed(2)),
    ),
    q(
      r`To bound the chance of any false rejection by ${alpha} across ${m} valid tests using the union bound, what is the largest common per-test significance level certified by this union bound?`,
      r`Use $\alpha/m=${alpha}/${m}=${alpha / m}$. Independence is not required for the union bound.`,
      exact(`${alpha}/${m}`),
    ),
  );
}
sections[4].questions.push(
  q(
    'Explain how a very small effect can be statistically significant.',
    'A sufficiently precise estimate can make a small departure large relative to its standard error. Practical importance depends on the effect and context, not just the standardized evidence.',
  ),
  q('A test rejects a true null. Name the error type.', 'Type I error.', {
    validator: 'term',
    params: { accepted: ['Type I', 'Type I error', 'type 1', 'type 1 error'] },
    correct: 'Type I',
    incorrect: 'Type II',
  }),
);
sections[1].quickCheck = quick(
  'A p-value of 0.02 means which statement?',
  [
    'The null has probability 0.02',
    'Under the null, the chosen extreme-statistic event has probability 0.02',
    'The effect is practically large',
  ],
  1,
  'The p-value refers to the statistic’s tail event under the null reference.',
  [
    'A posterior probability of a hypothesis needs a prior and a different calculation.',
    'Correct. The alternative and statistic define extremeness before the tail probability is calculated.',
    'Practical size depends on the effect, units, and context, not just the p-value.',
  ],
);
sections[3].quickCheck = quick(
  'Which probability goes inside the null standard error for a one-sample proportion z test?',
  ['The null value p₀', 'The observed p-hat', 'The significance level α'],
  0,
  'The test reference is calculated under the null model.',
  [
    'Correct. Use p₀(1−p₀)/n for the null variance.',
    'The observed proportion supplies the numerator and the plug-in interval standard error, not this null reference.',
    'Significance controls the rejection threshold; it is not the Bernoulli success parameter.',
  ],
);
sections[0].review = [
  q(
    'Does a hypothesis test usually state its null in terms of a population parameter?',
    'Yes. The statistic supplies evidence about the population claim.',
    truth(true),
  ),
  q(
    'Does failing to reject prove the population parameter equals the null value?',
    'No. Lack of rejection is not proof of equality.',
    truth(false),
  ),
  q(
    'Explain why selecting a one-sided direction after seeing the data changes the test.',
    'The direction becomes data-dependent, so the original one-sided rejection probability no longer describes the full selection-and-testing procedure.',
  ),
];
sections[1].review = [
  q(
    'Given Φ(1.96)=0.97500, give the upper-sided p-value at z=1.96.',
    r`$1-0.975=0.025$.`,
    exact('0.025'),
  ),
  q(
    'Given Φ(1.96)=0.97500, give the two-sided p-value at z=−1.96.',
    r`By symmetry, $2(1-0.975)=0.05$.`,
    exact('0.05'),
  ),
  q(
    'With p=0.04 and α=0.01, reject under the rule p≤α?',
    'No, because 0.04 exceeds 0.01.',
    truth(false),
  ),
];
sections[2].review = [
  q('Mean 11, null mean 10, known σ=3, n=36. Give z.', r`$(11-10)/(3/6)=2$.`, exact(2)),
  q('Mean 8, null mean 10, known σ=4, n=16. Give z.', r`$(8-10)/(4/4)=-2$.`, exact(-2)),
  q(
    'For a one-sample t test using 15 normal observations, give the reference degrees of freedom.',
    r`$15-1=14$.`,
    exact(14),
  ),
];
sections[3].review = [
  q(
    'In 100 trials there are 65 successes. Test p₀=0.5. Give z.',
    r`$(0.65-0.5)/0.05=3$.`,
    exact(3),
  ),
  q(
    'In 100 trials there are 45 successes. Test p₀=0.5. Give z.',
    r`$(0.45-0.5)/0.05=-1$.`,
    exact(-1),
  ),
  q(
    'Under p₀=0.5 and n=100, give the null standard error.',
    r`$\sqrt{0.25/100}=0.05$.`,
    exact('0.05'),
  ),
];
sections[4].review = [
  q(
    'Power is 0.85 at an alternative. Give Type II error probability.',
    r`$1-0.85=0.15$.`,
    exact('0.15'),
  ),
  q(
    'For five tests, give the per-test level whose union bound is 0.05.',
    r`$0.05/5=0.01$.`,
    exact('0.01'),
  ),
  q(
    'Does statistical significance alone establish a causal effect?',
    'No. Causal interpretation depends on study design and assumptions beyond the p-value.',
    truth(false),
  ),
];
export default lesson(
  19,
  'hypothesis-testing',
  'Hypothesis Testing',
  'A test compares observed evidence with a specified reference model. We develop the direction of that comparison, calculate introductory mean and proportion tests, and keep error control, effect size, and interpretation distinct.',
  sections,
);
