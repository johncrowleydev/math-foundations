import {
  r,
  lesson,
  section,
  termEntry,
  q,
  exact,
  calc,
  tuple,
  truth,
  quick,
  frac,
} from './helpers.mjs';
import { estimators, likelihood } from './inference-sources.mjs';
const sections = [
  section(
    'A parameter, an estimator, and an estimate',
    r`A probability model contains parameters describing a population or mechanism. A parameter such as a Bernoulli success probability $p$ is fixed in the frequentist model, although unknown. An **estimator** is a rule that uses random data to estimate it. An **estimate** is the numerical result after observing the data. Distinguishing these objects makes statements about bias and uncertainty meaningful.

For independent Bernoulli observations $X_1,\ldots,X_n$, the estimator $\hat p=\bar X$ is random before sampling. If the observed sequence contains 7 successes among 20 trials, its realized estimate is $7/20$. This observation does not establish that the unknown parameter equals $7/20$. A different sample from the same model can produce a different estimate. Uppercase letters for data variables and lowercase letters for observed values help keep that distinction visible, even though hats are often used for both estimators and estimates in ordinary writing.

A **statistic** is a function of the observed sample that does not depend on unknown parameters. The sample mean is a statistic; an expression subtracting the unknown population mean is not a directly computable statistic. Statistics can target different parameters: a mean, variance, proportion, or rate. Their units follow the target. A rate estimate has inverse-time units; a variance estimate has squared measurement units.

Before calculating, specify the target, the sample model, and the rule. An estimate from a convenience sample can still be computed, but its familiar sampling properties may not apply to the intended population. Statistical properties are claims about a rule under a model, not certificates automatically attached to a numerical formula.`,
    [estimators, likelihood],
    [
      termEntry(
        'estimator-estimate',
        'Estimator and estimate',
        'A random-data rule and its observed value.',
        r`$\hat\Theta=T(X_1,\ldots,X_n)$ is the estimator; $T(x_1,\ldots,x_n)$ is the estimate.`,
        r`Seven successes in twenty trials give the estimate $7/20$.`,
        'The estimate is not proof of the true parameter.',
      ),
    ],
  ),
  section(
    'Bias and mean squared error',
    r`To evaluate an estimator, imagine applying the same rule to repeated samples from the same parameter value. Its **bias** is $E[\hat\Theta]-\theta$. It is unbiased when this difference is zero for every allowed $\theta$. An unbiased estimate need not equal the target in a particular sample. It can vary substantially around the target.

Mean squared error measures both systematic displacement and variation: $\operatorname{MSE}(\hat\Theta)=E[(\hat\Theta-\theta)^2]$. Insert and subtract $E[\hat\Theta]$ inside the square. The cross term has expectation zero because the centered estimator has mean zero. The result is $\operatorname{MSE}=\operatorname{Var}(\hat\Theta)+\operatorname{Bias}(\hat\Theta)^2$. The expectation is over repeated data, with the parameter held fixed.

Suppose one estimator has bias zero and variance 9, while another has bias 1 and variance 4. Their MSEs are 9 and 5. The biased rule is better under squared error at that parameter value. This does not imply that bias is always helpful or that squared error is the only useful criterion. Absolute error and asymmetric decision costs can rank rules differently.

For iid observations with mean $\mu$ and variance $\sigma^2$, both $X_1$ and $\bar X$ are unbiased for $\mu$. Their variances are $\sigma^2$ and $\sigma^2/n$, respectively. Using all observations reduces MSE under these assumptions. If the observations are dependent, the covariance contributions must be included. Estimator quality is a property of the rule together with its sampling conditions.`,
    [estimators],
    [
      termEntry(
        'estimator-bias',
        'Estimator bias',
        'Repeated-sampling mean minus the target.',
        r`$\operatorname{Bias}(\hat\Theta)=E[\hat\Theta]-\theta$.`,
        r`Mean 8 when the target is 10 gives bias $-2$.`,
        'Bias is not the realized error in one sample.',
      ),
      termEntry(
        'estimator-mse',
        'Estimator mean squared error',
        'Average squared estimation error.',
        r`$\operatorname{MSE}=\operatorname{Var}(\hat\Theta)+\operatorname{Bias}(\hat\Theta)^2$.`,
        r`Variance 4 and bias 1 give MSE 5.`,
        'An unbiased estimator can still have large MSE.',
      ),
    ],
  ),
  section(
    'Consistency and the denominator in sample variance',
    r`A sequence of estimators is **consistent** if the probability of an error larger than any fixed positive tolerance tends to zero as sample size grows. This is different from unbiasedness, which concerns an expectation at each sample size. An estimator can be biased for every finite sample and still be consistent. Conversely, taking only the first observation gives an unbiased mean estimator whose variability does not decrease with sample size.

The finite-variance sample mean is consistent under iid sampling: Chebyshev gives $P(|\bar X-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$. This bound tends to zero for each fixed $\varepsilon>0$. More generally, MSE tending to zero implies consistency by applying Markov to squared error. This implication is sufficient; we do not assert its converse without additional conditions.

Consider estimating variance. The identity $\sum_i(X_i-\bar X)^2=\sum_i(X_i-\mu)^2-n(\bar X-\mu)^2$ gives expected sum of squared deviations $(n-1)\sigma^2$ under iid finite-variance sampling. Therefore $S^2=\sum_i(X_i-\bar X)^2/(n-1)$ is unbiased when $n\ge2$. Dividing by $n$ instead produces mean $(n-1)\sigma^2/n$, a downward bias of $-\sigma^2/n$.

For observations $1,3,5$, the mean is 3 and the sum of squared deviations is 8. The unbiased sample variance is 4; the divisor-$n$ value is $8/3$. These are different rules with different purposes. Neither convention should be chosen silently. Taking the square root of an unbiased variance estimator does not generally produce an unbiased standard-deviation estimator, because expectation does not commute with a nonlinear square root.`,
    [estimators, likelihood],
    [
      termEntry(
        'consistent-estimator',
        'Consistent estimator',
        'Estimation error concentrates near zero as sample size increases.',
        r`For every $\varepsilon>0$, $P(|\hat\Theta_n-\theta|\ge\varepsilon)\to0$.`,
        r`An iid finite-variance sample mean is consistent.`,
        'Consistency is a limiting property, not exact finite-sample accuracy.',
      ),
    ],
  ),
  section(
    'Likelihood keeps the data fixed',
    r`The **likelihood** treats observed data as fixed and asks how their probability mass or density varies with the parameter. For iid observations, $L(\theta)=\prod_i f(x_i;\theta)$, using a PMF for discrete data or a density for continuous data. A **maximum likelihood estimate**, or MLE, is a permitted parameter value maximizing this function. The parameter space is part of the optimization problem.

For a particular ordered Bernoulli sequence with $s$ successes and $n-s$ failures, $L(p)=p^s(1-p)^{n-s}$. If the observation is only the success count, the binomial coefficient multiplies that likelihood. It changes the probability of the recorded observation, but not the maximizer because it is constant in $p$. Do not omit a parameter-dependent factor for the same reason.

For two successes and one failure, compare $p=1/4$ with $p=3/4$. The ordered-sequence likelihoods are $3/64$ and $9/64$; the second parameter better explains this observation by a factor of three. Those likelihoods are not posterior probabilities of the two parameters. A prior distribution and normalization are required for that different interpretation.

Densities can exceed one, so a continuous likelihood need not lie in $[0,1]$. Only integrals of density over observation regions are probabilities. Also, independence is required for the product of marginal contributions; dependent observations require their joint distribution. If several parameter values maximize the likelihood, the estimate may not be unique. If the supremum lies at an excluded boundary, a maximizing value may not exist.`,
    [likelihood],
    [
      termEntry(
        'likelihood',
        'Likelihood',
        'Observed-data mass or density viewed as a function of the parameter.',
        r`For independent observations, $L(\theta)=\prod_i f(x_i;\theta)$.`,
        r`An ordered sequence with two successes and one failure has likelihood $p^2(1-p)$.`,
        'Likelihood is not a probability distribution over parameters.',
      ),
    ],
  ),
  section(
    'Log-likelihood and elementary maximization',
    r`On positive likelihoods, the logarithm preserves the location of a maximum and turns products into sums. For an interior Bernoulli parameter and $0<s<n$, the log-likelihood is $\ell(p)=s\ln p+(n-s)\ln(1-p)$. Its derivative is $s/p-(n-s)/(1-p)$. Setting it to zero gives $\hat p=s/n$; the second derivative is negative throughout $(0,1)$. Include boundary checks: all successes give MLE 1 and no successes give MLE 0 when the parameter space includes $[0,1]$.

For independent exponential waiting times with rate $\lambda>0$ and positive observed total $T=\sum_i x_i$, $\ell(\lambda)=n\ln\lambda-\lambda T$. The stationary point is $\hat\lambda=n/T$, with negative second derivative. Four waiting times totaling 10 seconds give rate estimate $2/5$ per second. Rate is the reciprocal of the sample mean, not the sample mean itself.

For normal observations with unknown mean and variance, maximizing the likelihood gives the sample mean and the divisor-$n$ variance, provided the observed spread is positive. The variance MLE therefore differs from the unbiased divisor-$(n-1)$ rule. If every observation is identical and the normal variance must be strictly positive, the likelihood increases without bound as the variance approaches zero; there is no positive variance MLE in that model.

Optimization cannot rescue a misspecified statistical model. A local stationary point may not be a global maximum, constraints may exclude it, and a zero likelihood needs direct treatment because its logarithm is not finite. Report the estimate, parameter domain, and essential assumptions. The next lessons quantify uncertainty around estimates instead of treating maximization as certainty.`,
    [likelihood, estimators],
    [
      termEntry(
        'maximum-likelihood',
        'Maximum likelihood estimate',
        'A permitted parameter maximizing observed-data likelihood.',
        r`$\hat\theta\in\operatorname{argmax}_{\theta}L(\theta)$.`,
        r`For Bernoulli observations with 7 successes in 20 trials, $\hat p=7/20$.`,
        'A maximum-likelihood estimate does not quantify its own uncertainty.',
      ),
    ],
  ),
];
for (const [s, n] of [
  [3, 10],
  [7, 20],
  [0, 12],
  [9, 9],
  [11, 25],
]) {
  sections[0].questions.push(
    q(
      r`There are ${s} successes in ${n} Bernoulli trials. Give the observed sample-proportion estimate.`,
      r`Divide successes by trials: $\hat p=${s}/${n}=${frac(s, n)}$.`,
      exact(frac(s, n)),
    ),
    q(
      r`For observations consisting of ${s} ones and ${n - s} zeros, give the sample mean after applying the transformation $Y_i=2X_i-1$.`,
      r`The transformed average is $2(${s}/${n})-1=${frac(2 * s - n, n)}$. It estimates the mean of the transformed variable.`,
      exact(frac(2 * s - n, n)),
    ),
  );
}
sections[0].questions.push(
  q(
    'Explain why subtracting the unknown parameter from the sample mean does not give an observable statistic.',
    'Its value depends on an unknown quantity as well as the data, so it cannot be calculated from the sample alone.',
  ),
  q(
    'A rate parameter is measured per second. State the units of its estimate and of the estimator MSE.',
    'The estimate has inverse-second units; MSE has squared inverse-second units.',
  ),
);
for (const [mean, target, v] of [
  [8, 10, 3],
  [12, 10, 4],
  [5, 5, 9],
  [-1, 2, 2],
  [4, 3, 1],
]) {
  const b = mean - target;
  sections[1].questions.push(
    q(
      r`An estimator has mean ${mean} when the parameter is ${target}. Give its bias.`,
      r`Bias is mean minus target: $${mean}-(${target})=${b}$.`,
      exact(b),
    ),
    q(
      r`At parameter ${target}, an estimator has mean ${mean} and variance ${v}. Give its mean squared error.`,
      r`Its bias is $${b}$, so MSE is $${v}+(${b})^2=${v + b * b}$.`,
      exact(v + b * b),
    ),
  );
}
sections[1].questions.push(
  q(
    'An unbiased estimator has variance 6; a second has bias −1 and variance 3. Which has smaller MSE, and why?',
    'Their MSEs are 6 and 4. The second has smaller MSE because its variance reduction exceeds its squared bias.',
  ),
  q(
    'Prove the bias–variance decomposition for estimator MSE.',
    r`Write $\hat\Theta-\theta=(\hat\Theta-E\hat\Theta)+(E\hat\Theta-\theta)$. After squaring, the cross term has expectation zero. The remaining terms are variance and squared bias.`,
    undefined,
    'prove',
  ),
);
for (const data of [
  [1, 3, 5],
  [0, 2, 4, 6],
  [2, 2, 5],
  [1, 1, 3, 3],
  [2, 4, 6, 8, 10],
]) {
  const n = data.length,
    m = data.reduce((a, b) => a + b) / n,
    ss = data.reduce((a, b) => a + (b - m) ** 2, 0);
  sections[2].questions.push(
    q(
      r`For observations $(${data.join(',')})$, give the unbiased sample variance.`,
      r`The sample mean is $${m}$ and squared-deviation total is $${ss}$. Dividing by $n-1=${n - 1}$ gives $${frac(ss, n - 1)}$.`,
      exact(frac(ss, n - 1)),
    ),
    q(
      r`For the same observations $(${data.join(',')})$, give the divisor-$n$ variance.`,
      r`The squared-deviation total is $${ss}$. Dividing by $n=${n}$ gives $${frac(ss, n)}$.`,
      exact(frac(ss, n)),
    ),
  );
}
sections[2].questions.push(
  q(
    'Give an unbiased mean estimator that need not become more accurate when the available sample size grows.',
    'Use only the first observation X₁. Its expectation equals the population mean, but its variance remains the population variance.',
    undefined,
    'construct',
  ),
  q(
    'Why does MSE tending to zero imply consistency?',
    r`Apply Markov to squared error: $P(|\hat\Theta_n-\theta|\ge\varepsilon)\le\operatorname{MSE}(\hat\Theta_n)/\varepsilon^2\to0$ for every fixed positive $\varepsilon$.`,
    undefined,
    'prove',
  ),
);
for (const [s, n, p] of [
  [2, 3, '1/4'],
  [1, 4, '1/2'],
  [3, 5, '1/3'],
  [0, 4, '1/5'],
  [4, 4, '3/4'],
]) {
  const value = `(${p})^${s}*(1-(${p}))^${n - s}`;
  sections[3].questions.push(
    q(
      r`An ordered Bernoulli sequence of length ${n} has ${s} successes. Evaluate its likelihood at $p=${p}$.`,
      r`The independent product is $(${p})^{${s}}(1-${p})^{${n - s}}$. This exact value is the likelihood of the ordered observation.`,
      exact(value),
    ),
    q(
      r`For a success count ${s} from ${n} trials, what parameter-independent factor multiplies the corresponding ordered-sequence likelihood?`,
      r`There are $\binom{${n}}{${s}}$ compatible ordered sequences, so the factor is $\binom{${n}}{${s}}$.`,
      exact(`binom(${n},${s})`),
    ),
  );
}
sections[3].questions.push(
  q(
    'Why can a binomial coefficient be omitted when maximizing a binomial likelihood over p?',
    'It is positive and independent of p, so multiplication by it preserves which permitted p maximizes the likelihood.',
  ),
  q(
    'Why is a continuous likelihood value of 2 not automatically invalid?',
    'A likelihood can be a density evaluated at the observed data. Density height is not a probability and may exceed one.',
  ),
);
for (const [s, n, T] of [
  [2, 5, 10],
  [7, 10, 25],
  [0, 6, 12],
  [8, 8, 20],
  [3, 12, 30],
]) {
  sections[4].questions.push(
    q(
      r`For ${s} successes in ${n} iid Bernoulli trials with $p\in[0,1]$, give the MLE of $p$.`,
      r`The MLE is the observed proportion, including endpoint cases: $${s}/${n}=${frac(s, n)}$.`,
      exact(frac(s, n)),
    ),
    q(
      r`${n} independent exponential waiting times have positive sum ${T}. Give the MLE of the rate.`,
      r`Solve $n/\lambda-T=0$: $\hat\lambda=${n}/${T}=${frac(n, T)}$.`,
      exact(frac(n, T)),
    ),
  );
}
sections[4].questions.push(
  q(
    'Differentiate the Bernoulli log-likelihood 3 ln(p)+2 ln(1−p) for 0<p<1.',
    r`The derivative is $3/p-2/(1-p)$. The minus sign comes from differentiating $1-p$.`,
    calc('3/p-2/(1-p)', ['p'], { positive: ['p', '1-p'] }),
  ),
  q(
    'Explain why identical observations cause a problem for normal maximum-likelihood variance estimation when variance must be positive.',
    'The fitted mean can equal every observation, making the squared-error term zero. The likelihood then grows without bound as positive variance approaches zero; the excluded endpoint cannot be returned as a positive MLE.',
  ),
);
sections[1].quickCheck = quick(
  'An estimator is unbiased. What is guaranteed?',
  [
    'Its observed value always equals the parameter',
    'Its repeated-sampling mean equals the parameter',
    'Its variance is zero',
  ],
  1,
  'Unbiasedness is a statement about an expectation under the model.',
  [
    'A particular sample can produce a nonzero error even with an unbiased rule.',
    'Correct. Bias is the estimator expectation minus the parameter.',
    'Zero bias does not eliminate variation from sample to sample.',
  ],
);
sections[3].quickCheck = quick(
  'When viewing likelihood as a function, what is held fixed?',
  ['The observed data', 'The parameter being estimated', 'The posterior probability'],
  0,
  'Likelihood compares parameter values for the same observation.',
  [
    'Correct. The observed data stay fixed while the candidate parameter varies.',
    'The parameter is the argument being varied during likelihood maximization.',
    'A posterior is a different object requiring a prior and normalization.',
  ],
);
sections[0].review = [
  q(
    'Five of sixteen observed trials succeed. Give the sample-proportion estimate.',
    r`$5/16$.`,
    exact('5/16'),
  ),
  q(
    'Eight of twenty-five observed trials succeed. Give the sample-proportion estimate.',
    r`$8/25$.`,
    exact('8/25'),
  ),
  q(
    'Distinguish an estimator from an estimate.',
    'An estimator is a rule applied to random data; an estimate is its realized value for observed data.',
  ),
];
sections[1].review = [
  q('An estimator has bias −2 and variance 5. Give its MSE.', r`$5+(-2)^2=9$.`, exact(9)),
  q('An estimator has bias 3 and variance 2. Give its MSE.', r`$2+3^2=11$.`, exact(11)),
  q(
    'Does zero bias guarantee the smallest possible MSE?',
    'No. A biased alternative may reduce variance enough to have smaller MSE.',
    truth(false),
  ),
];
sections[2].review = [
  q(
    'A sample of size 5 has squared-deviation total 12. Give the unbiased sample variance.',
    r`$12/(5-1)=3$.`,
    exact(3),
  ),
  q(
    'A sample of size 6 has squared-deviation total 20. Give the unbiased sample variance.',
    r`$20/(6-1)=4$.`,
    exact(4),
  ),
  q(
    'Does consistency require zero bias at every finite sample size?',
    'No. A finite-sample bias can tend to zero while estimation error concentrates.',
    truth(false),
  ),
];
sections[3].review = [
  q(
    'An ordered sequence has one success and two failures. Give its Bernoulli likelihood at p=1/2.',
    r`$(1/2)(1/2)^2=1/8$.`,
    exact('1/8'),
  ),
  q(
    'An ordered sequence has two successes and two failures. Give its likelihood at p=1/2.',
    r`$(1/2)^4=1/16$.`,
    exact('1/16'),
  ),
  q(
    'Is likelihood itself a normalized probability distribution over the parameter?',
    'No. Likelihood is the observed-data mass or density as the parameter varies.',
    truth(false),
  ),
];
sections[4].review = [
  q('Give the Bernoulli MLE for nine successes in fifteen trials.', r`$9/15=3/5$.`, exact('3/5')),
  q(
    'Five independent exponential observations total twenty seconds. Estimate the rate by maximum likelihood.',
    r`$5/20=1/4$ per second.`,
    exact('1/4'),
  ),
  q(
    'A normal sample has size 4 and squared-deviation total 12. Give the variance MLE.',
    r`$12/4=3$, using divisor $n$.`,
    exact(3),
  ),
];
export default lesson(
  17,
  'estimation-likelihood',
  'Point Estimation and Likelihood',
  'Probability starts with a model and describes possible data. Estimation works in the other direction: observed data help us choose values for unknown model parameters. We distinguish the calculation of an estimate from the repeated-sampling properties of the rule that produced it.',
  sections,
);
