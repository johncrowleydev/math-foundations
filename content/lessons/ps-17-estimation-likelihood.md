# Point Estimation and Likelihood

Probability starts with a model and describes possible data. Estimation works in the other direction: observed data help us choose values for unknown model parameters. We distinguish the calculation of an estimate from the repeated-sampling properties of the rule that produced it.

## A parameter, an estimator, and an estimate

A probability model contains parameters describing a population or mechanism. A parameter such as a Bernoulli success probability $p$ is fixed in the frequentist model, although unknown. An **estimator** is a rule that uses random data to estimate it. An **estimate** is the numerical result after observing the data. Distinguishing these objects makes statements about bias and uncertainty meaningful.

For independent Bernoulli observations $X_1,\ldots,X_n$, the estimator $\hat p=\bar X$ is random before sampling. If the observed sequence contains 7 successes among 20 trials, its realized estimate is $7/20$. This observation does not establish that the unknown parameter equals $7/20$. A different sample from the same model can produce a different estimate. Uppercase letters for data variables and lowercase letters for observed values help keep that distinction visible, even though hats are often used for both estimators and estimates in ordinary writing.

A **statistic** is a function of the observed sample that does not depend on unknown parameters. The sample mean is a statistic; an expression subtracting the unknown population mean is not a directly computable statistic. Statistics can target different parameters: a mean, variance, proportion, or rate. Their units follow the target. A rate estimate has inverse-time units; a variance estimate has squared measurement units.

Before calculating, specify the target, the sample model, and the rule. An estimate from a convenience sample can still be computed, but its familiar sampling properties may not apply to the intended population. Statistical properties are claims about a rule under a model, not certificates automatically attached to a numerical formula.

Related definitions: [Estimator and estimate](ref:probability-statistics-estimator-estimate).

## Bias and mean squared error

To evaluate an estimator, imagine applying the same rule to repeated samples from the same parameter value. Its **bias** is $E[\hat\Theta]-\theta$. It is unbiased when this difference is zero for every allowed $\theta$. An unbiased estimate need not equal the target in a particular sample. It can vary substantially around the target.

Mean squared error measures both systematic displacement and variation: $\operatorname{MSE}(\hat\Theta)=E[(\hat\Theta-\theta)^2]$. Insert and subtract $E[\hat\Theta]$ inside the square. The cross term has expectation zero because the centered estimator has mean zero. The result is $\operatorname{MSE}=\operatorname{Var}(\hat\Theta)+\operatorname{Bias}(\hat\Theta)^2$. The expectation is over repeated data, with the parameter held fixed.

Suppose one estimator has bias zero and variance 9, while another has bias 1 and variance 4. Their MSEs are 9 and 5. The biased rule is better under squared error at that parameter value. This does not imply that bias is always helpful or that squared error is the only useful criterion. Absolute error and asymmetric decision costs can rank rules differently.

For iid observations with mean $\mu$ and variance $\sigma^2$, both $X_1$ and $\bar X$ are unbiased for $\mu$. Their variances are $\sigma^2$ and $\sigma^2/n$, respectively. Using all observations reduces MSE under these assumptions. If the observations are dependent, the covariance contributions must be included. Estimator quality is a property of the rule together with its sampling conditions.

Related definitions: [Estimator bias](ref:probability-statistics-estimator-bias); [Estimator mean squared error](ref:probability-statistics-estimator-mse).

## Consistency and the denominator in sample variance

A sequence of estimators is **consistent** if the probability of an error larger than any fixed positive tolerance tends to zero as sample size grows. This is different from unbiasedness, which concerns an expectation at each sample size. An estimator can be biased for every finite sample and still be consistent. Conversely, taking only the first observation gives an unbiased mean estimator whose variability does not decrease with sample size.

The finite-variance sample mean is consistent under iid sampling: Chebyshev gives $P(|\bar X-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$. This bound tends to zero for each fixed $\varepsilon>0$. More generally, MSE tending to zero implies consistency by applying Markov to squared error. This implication is sufficient; we do not assert its converse without additional conditions.

Consider estimating variance. The identity $\sum_i(X_i-\bar X)^2=\sum_i(X_i-\mu)^2-n(\bar X-\mu)^2$ gives expected sum of squared deviations $(n-1)\sigma^2$ under iid finite-variance sampling. Therefore $S^2=\sum_i(X_i-\bar X)^2/(n-1)$ is unbiased when $n\ge2$. Dividing by $n$ instead produces mean $(n-1)\sigma^2/n$, a downward bias of $-\sigma^2/n$.

For observations $1,3,5$, the mean is 3 and the sum of squared deviations is 8. The unbiased sample variance is 4; the divisor-$n$ value is $8/3$. These are different rules with different purposes. Neither convention should be chosen silently. Taking the square root of an unbiased variance estimator does not generally produce an unbiased standard-deviation estimator, because expectation does not commute with a nonlinear square root.

Related definitions: [Consistent estimator](ref:probability-statistics-consistent-estimator).

## Likelihood keeps the data fixed

The **likelihood** treats observed data as fixed and asks how their probability mass or density varies with the parameter. For iid observations, $L(\theta)=\prod_i f(x_i;\theta)$, using a PMF for discrete data or a density for continuous data. A **maximum likelihood estimate**, or MLE, is a permitted parameter value maximizing this function. The parameter space is part of the optimization problem.

For a particular ordered Bernoulli sequence with $s$ successes and $n-s$ failures, $L(p)=p^s(1-p)^{n-s}$. If the observation is only the success count, the binomial coefficient multiplies that likelihood. It changes the probability of the recorded observation, but not the maximizer because it is constant in $p$. Do not omit a parameter-dependent factor for the same reason.

For two successes and one failure, compare $p=1/4$ with $p=3/4$. The ordered-sequence likelihoods are $3/64$ and $9/64$; the second parameter better explains this observation by a factor of three. Those likelihoods are not posterior probabilities of the two parameters. A prior distribution and normalization are required for that different interpretation.

Densities can exceed one, so a continuous likelihood need not lie in $[0,1]$. Only integrals of density over observation regions are probabilities. Also, independence is required for the product of marginal contributions; dependent observations require their joint distribution. If several parameter values maximize the likelihood, the estimate may not be unique. If the supremum lies at an excluded boundary, a maximizing value may not exist.

Related definitions: [Likelihood](ref:probability-statistics-likelihood).

## Log-likelihood and elementary maximization

On positive likelihoods, the logarithm preserves the location of a maximum and turns products into sums. For an interior Bernoulli parameter and $0<s<n$, the log-likelihood is $\ell(p)=s\ln p+(n-s)\ln(1-p)$. Its derivative is $s/p-(n-s)/(1-p)$. Setting it to zero gives $\hat p=s/n$; the second derivative is negative throughout $(0,1)$. Include boundary checks: all successes give MLE 1 and no successes give MLE 0 when the parameter space includes $[0,1]$.

For independent exponential waiting times with rate $\lambda>0$ and positive observed total $T=\sum_i x_i$, $\ell(\lambda)=n\ln\lambda-\lambda T$. The stationary point is $\hat\lambda=n/T$, with negative second derivative. Four waiting times totaling 10 seconds give rate estimate $2/5$ per second. Rate is the reciprocal of the sample mean, not the sample mean itself.

For normal observations with unknown mean and variance, maximizing the likelihood gives the sample mean and the divisor-$n$ variance, provided the observed spread is positive. The variance MLE therefore differs from the unbiased divisor-$(n-1)$ rule. If every observation is identical and the normal variance must be strictly positive, the likelihood increases without bound as the variance approaches zero; there is no positive variance MLE in that model.

Optimization cannot rescue a misspecified statistical model. A local stationary point may not be a global maximum, constraints may exclude it, and a zero likelihood needs direct treatment because its logarithm is not finite. Report the estimate, parameter domain, and essential assumptions. The next lessons quantify uncertainty around estimates instead of treating maximization as certainty.

Related definitions: [Maximum likelihood estimate](ref:probability-statistics-maximum-likelihood).

![Likelihood is a function of a candidate parameter](figure:probability-statistics-figure-17)
