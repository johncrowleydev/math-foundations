# Hypothesis Testing

A test compares observed evidence with a specified reference model. We develop the direction of that comparison, calculate introductory mean and proportion tests, and keep error control, effect size, and interpretation distinct.

## State a claim about the population before examining evidence

A **hypothesis test** uses data to assess a specified population claim. The null hypothesis $H_0$ describes the reference model; the alternative $H_1$ describes the departure being investigated. For a population mean, a two-sided question might use $H_0:\mu=10$ against $H_1:\mu\ne10$. An upper-sided question uses $H_0:\mu\le10$ against $H_1:\mu>10$, with the boundary value 10 supplying the reference calculation for the normal procedures here.

Choose the direction from the scientific question before inspecting the result. Selecting whichever tail looks favorable after observing data changes the procedure and its error rate. Hypotheses concern population parameters rather than the already observed sample average. The sample average is evidence used to assess a claim, not an unknown quantity to be tested.

A **test statistic** summarizes the evidence in a way whose distribution can be described under the null. An unusually large positive standardized mean supports an upper alternative; an unusually large magnitude supports a two-sided alternative. “Unusual” is always relative to the specified model and the chosen statistic. A surprising observation can expose a wrong null parameter, a violated sampling assumption, or an inappropriate distributional model.

A test yields a decision to reject or fail to reject the null according to a stated rule. Failure to reject is not proof that the null is true. It may reflect limited information, high variation, or a departure the test cannot detect well. Keep the target claim distinct from any practical action that follows: an action can depend on costs, effect sizes, and other evidence as well as the test.

Related definitions: [Null and alternative hypotheses](ref:probability-statistics-null-alternative).

## Tail probabilities under the null model

A **p-value** is the null-model probability of a statistic at least as unfavorable to the null as the observed statistic, using the chosen alternative to define extremeness. It is not the probability that the null is true, and it is not the probability that the observed data arose by chance. The definition compares the observed statistic with a whole set of possible outcomes under the reference model.

For a standard normal statistic $Z$ and observed value $z$, an upper-sided p-value is $1-\Phi(z)$; a lower-sided value is $\Phi(z)$. For a two-sided normal test, symmetry gives $2[1-\Phi(|z|)]$. If $z=2$ and the supplied value is $\Phi(2)=0.97725$, the upper-sided p-value is 0.02275 and the two-sided p-value is 0.04550. Doubling a tail is appropriate here because the reference distribution is continuous and symmetric and the test uses absolute magnitude; it is not a universal rule for arbitrary discrete tests.

A significance level $\alpha$ specifies the decision threshold in advance. In this subject, reject when $p\le\alpha$ and otherwise fail to reject. With $p=0.04550$, the rule rejects at 0.05 but not at 0.01. A smaller threshold makes rejection harder; it does not make the observed effect smaller or alter the already calculated p-value.

Under a composite null, the p-value must be valid for the allowed null parameter values. For the elementary upper-sided normal mean tests here, the boundary parameter gives the largest upper-tail rejection probability. More complicated nuisance-parameter questions require further methods. Supplied tail values keep numerical practice focused on choosing the correct probability and interpreting it.

Related definitions: [p-value](ref:probability-statistics-p-value); [Significance level](ref:probability-statistics-significance-level).

## Tests for a single population mean

For independent observations from a normal population with known standard deviation, test a null mean $\mu_0$ with $Z=(\bar X-\mu_0)/(\sigma/\sqrt n)$. Under the boundary null this statistic is standard normal. For a nonnormal population, using it through a CLT argument is approximate and needs appropriate sample behavior. The numerator measures the observed departure and the denominator expresses sampling variability in the same units.

Suppose a normal sample of size 25 has mean 12, the null mean is 10, and known population standard deviation is 5. The standard error is 1 and the statistic is 2. Using the previous supplied normal table value gives a two-sided p-value of 0.04550. At level 0.05 this is evidence against the equality null under the stated model, not proof that every observation differs materially from 10.

When population standard deviation is unknown, use the sample standard deviation and $T=(\bar X-\mu_0)/(S/\sqrt n)$. Under iid normal sampling the reference is Student t with $n-1$ degrees of freedom. A sample of size 9 with mean 22, null mean 20, and sample standard deviation 3 has statistic 2 with 8 degrees of freedom. Use a t tail for those degrees of freedom, not a standard normal tail for the same numerical statistic.

A two-sided test and its corresponding confidence interval agree when they use the same model, standard error, critical values, and significance level: rejecting the equality null corresponds to excluding the null mean from the interval, apart from explicitly chosen boundary conventions. Combining a one-sided test with an unrelated two-sided interval can produce a misleading comparison.

Related definitions: [One-sample standardized mean](ref:probability-statistics-one-sample-test-statistic).

## A proportion test uses the null standard error

For iid Bernoulli trials, a large-sample test of $p=p_0$ uses $Z=(\hat p-p_0)/\sqrt{p_0(1-p_0)/n}$. Here the standard error is calculated under the null, unlike the elementary Wald confidence interval that plugs in $\hat p$. Require $0<p_0<1$ and sufficiently large expected success and failure counts. This lesson uses $np_0\ge10$ and $n(1-p_0)\ge10$ as a practical screen; the reference remains an approximation.

If 60 of 100 trials succeed and $p_0=1/2$, the null standard error is $\sqrt{(1/2)(1/2)/100}=0.05$. The statistic is $(0.60-0.50)/0.05=2$, giving the same normal tail calculations as before. In this context the observed effect is a difference of 0.10, or ten percentage points. A ten-percentage-point difference is not the same as a ten-percent relative increase.

Small counts or boundary null values require different handling. For example, under $p_0=0$ an observed success has probability zero in the exact Bernoulli model, while the standardized formula divides by zero. Do not replace an undefined denominator by a tiny number. If an exact binomial tail is supplied, it can be used directly for the stated test; its discreteness may make attainable p-values coarse.

Repeated observations from dependent units undermine the iid variance calculation. Testing thousands of selected proportions also changes how often some result appears significant. State the sampling unit, null probability, direction, and reference method before calculating. A correct tail subtraction cannot compensate for an incorrect experimental model.

Related definitions: [Null standard error](ref:probability-statistics-null-standard-error).

## Errors, power, and practical meaning

A **Type I error** rejects a true null; a **Type II error** fails to reject when the alternative is true. A level-$\alpha$ test controls the Type I probability under its stated null model, exactly or approximately according to the procedure. **Power** is the rejection probability at a specified alternative parameter value. It depends on effect size, sample size, noise, and the rejection rule; it is not one universal number attached to a test name.

If a rule rejects when $\bar X>12$, then its power at an alternative model is $P_{\rm alternative}(\bar X>12)$. If that model places probability 0.80 above 12, power is 0.80 and the Type II probability there is 0.20. A different alternative mean can have different power. Lowering the significance threshold generally reduces power when the rest of the design stays fixed.

Statistical significance does not measure practical importance. With many independent observations, a small effect can be estimated precisely and produce a small p-value. Conversely, an important effect may fail to reach a threshold in a noisy small sample. Report the estimated effect, its units, uncertainty, and context alongside the decision. A p-value does not establish causation, model adequacy, or the absence of bias.

Multiplicity also matters. For $m$ valid tests each with Type I probability at most $\alpha$, the union bound gives probability at most $m\alpha$ of any false rejection when all nulls are true, capped at one. Testing each at $\alpha/m$ gives a simple family-level bound of $\alpha$, without requiring independence. Repeatedly inspecting data and stopping when a fixed-sample test becomes significant changes the procedure; its original guarantee cannot simply be assumed.

Related definitions: [Test power](ref:probability-statistics-test-power); [Type I and Type II errors](ref:probability-statistics-test-error-types).
