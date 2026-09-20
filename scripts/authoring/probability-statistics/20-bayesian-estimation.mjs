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
import { bayes, beta, ciMean } from './inference-sources.mjs';
const sections = [
  section(
    'Model uncertainty about a parameter',
    r`Bayesian estimation represents uncertainty about an unknown parameter using a probability distribution. The **prior** describes that uncertainty before the current data are incorporated. The **likelihood** describes the data model given a parameter value. The **posterior** is the parameter distribution after conditioning on the observed data. This is Bayes' theorem applied to an inferential problem, not a new rule for multiplying probabilities.

For a finite parameter space, $P(\Theta=\theta_j\mid D)=L(\theta_j)\pi_j/\sum_kL(\theta_k)\pi_k$, where $\pi_j$ is the prior mass. The denominator is the model's marginal probability of the observed data and must be positive. For a continuous parameter, multiply likelihood by prior density and normalize with an integral. The posterior is a density; its height at one parameter value is not a point probability.

Suppose a device has success probability either $1/4$ or $3/4$, initially with equal prior masses. After one observed success, the unnormalized posterior weights are $1/8$ and $3/8$. Their sum is $1/2$, so the posterior masses are $1/4$ and $3/4$. The data favor the higher-success model, but the calculation has not made it certain.

A prior is a modeling choice that should be stated and examined. It may summarize previous information, a physical mechanism, or deliberately broad uncertainty. A likelihood also contains assumptions, including independence and measurement behavior. Multiplying the same evidence into both a data-informed prior and the likelihood without accounting for that reuse double-counts information. Different legitimate starting assumptions can produce different posterior answers.`,
    [bayes],
    [
      termEntry(
        'bayesian-posterior',
        'Prior and posterior',
        'Parameter uncertainty before and after conditioning on data.',
        r`Posterior mass or density is proportional to likelihood times prior, followed by normalization.`,
        r`Equal prior masses at $1/4$ and $3/4$ become posterior masses $1/4$ and $3/4$ after one success.`,
        'The likelihood alone is not the posterior.',
      ),
    ],
  ),
  section(
    'Beta distributions on a probability parameter',
    r`A Bernoulli probability belongs to $[0,1]$. A convenient continuous prior family is the **beta distribution**, whose density for $0<p<1$ is $f(p)=p^{a-1}(1-p)^{b-1}/B(a,b)$ with $a,b>0$. The normalizing constant $B(a,b)=\int_0^1p^{a-1}(1-p)^{b-1}\,dp$ makes the total probability one. The density is zero outside the parameter interval. Individual endpoints have probability zero in these continuous models.

For positive integer parameters, integration by parts yields $B(a,b)=(a-1)!(b-1)!/(a+b-1)!$. Thus Beta(2,2) has density $6p(1-p)$. Integrating gives one: $6[p^2/2-p^3/3]_0^1=1$. Beta(1,1) is uniform, with density one. A beta density need not be flat or symmetric; parameters less than one can produce integrable endpoint singularities.

Its mean is $a/(a+b)$ and its variance is $ab/[(a+b)^2(a+b+1)]$. The moment formulas follow by inserting one or two extra powers of $p$ into the normalizing integral and taking beta-function ratios. For Beta(2,2), the mean is $1/2$, the second moment is $3/10$, and the variance is $1/20$.

For a fixed ratio $a:b$, increasing both parameters concentrates the prior more strongly around the same mean. Beta(2,2) and Beta(20,20) both have mean $1/2$, but different variances. Saying “the prior mean is one half” therefore does not fully specify prior information. State both shape parameters, and do not mistake their values for actual newly observed trials.`,
    [beta],
    [
      termEntry(
        'beta-prior',
        'Beta distribution',
        'A two-parameter family of densities on the unit interval.',
        r`$f(p)=p^{a-1}(1-p)^{b-1}/B(a,b)$ for $a,b>0$ and $0<p<1$.`,
        r`Beta(2,2) has density $6p(1-p)$.`,
        'The same prior mean can accompany very different prior spreads.',
      ),
    ],
  ),
  section(
    'Binomial data update both shape parameters',
    r`Suppose observations are conditionally independent Bernoulli trials given a common probability $p$. For $s$ successes and $n-s$ failures, the likelihood is proportional to $p^s(1-p)^{n-s}$. Multiplying by a Beta($a,b$) prior gives $p^{a+s-1}(1-p)^{b+n-s-1}$. Recognizing the same density family gives posterior Beta($a+s,b+n-s$). A family preserved by updating in this way is called **conjugate** for this likelihood.

With prior Beta(2,3) and three successes in four trials, the posterior is Beta(5,4). Its mean is $5/9$ and variance is $20/(81\cdot10)=2/81$. The sample proportion is $3/4$, so the posterior mean differs from the maximum likelihood estimate. It combines the specified prior with the observed information.

For $n>0$, the posterior mean can be written $[(a+b)/(a+b+n)]\,[a/(a+b)]+[n/(a+b+n)]\,(s/n)$. It is a weighted average of the prior mean and sample proportion. The sum $a+b$ controls the prior's weight in this particular mean formula. It is an effective prior weight, not a claim that exactly that many physical observations occurred. With a fixed prior, the data weight tends to one as $n$ grows.

Sequential updating gives the same result as combining batches when they share the same parameter and are conditionally independent given it. Add successes to the first shape and failures to the second at each step. If the mechanism changes between batches, blindly pooling them may be inappropriate. Conjugacy simplifies arithmetic; it does not verify the data model.`,
    [beta, bayes],
    [
      termEntry(
        'beta-binomial-update',
        'Beta-binomial update',
        'Add successes and failures to the prior beta shapes.',
        r`$\operatorname{Beta}(a,b)$ updates to $\operatorname{Beta}(a+s,b+n-s)$.`,
        r`Beta(2,3) with 3 successes in 4 trials becomes Beta(5,4).`,
        'Conditional independence and a common success probability are modeling assumptions.',
      ),
    ],
  ),
  section(
    'Predict future observations by averaging over uncertainty',
    r`A **posterior predictive probability** averages an observation probability over the posterior parameter distribution. For one future Bernoulli trial, $P(X_{\rm new}=1\mid D)=E[p\mid D]$. Under posterior Beta($A,B$), this is $A/(A+B)$. The future failure probability is $B/(A+B)$; these sum to one.

Multiple future observations require care. Conditional on $p$, future Bernoulli trials are independent, but after averaging over uncertain $p$ they generally are not independent. The probability of two future successes is $E[p^2\mid D]=A(A+1)/[(A+B)(A+B+1)]$. For posterior Beta(2,2), this is $3/10$, whereas multiplying two one-step predictive probabilities gives $1/4$. Shared parameter uncertainty explains the difference.

Similarly, the chance of one success followed by one failure is $E[p(1-p)\mid D]=AB/[(A+B)(A+B+1)]$. If order is not recorded, either order contributes, so exactly one success in two trials has twice this probability. This connects predictive updating with earlier lessons on conditional independence and counting.

An estimate used for a decision depends on the loss. The posterior mean minimizes posterior expected squared error: expand $E[(p-c)^2\mid D]$ around $E[p\mid D]$. The posterior mode is a different summary. When $A,B>1$, the beta mode is $(A-1)/(A+B-2)$, obtained by differentiating the log density. Do not apply that interior formula to boundary or uniform cases without checking them. A useful report distinguishes a point estimate, a predictive probability, and remaining parameter uncertainty.`,
    [beta, bayes],
    [
      termEntry(
        'posterior-predictive',
        'Posterior predictive probability',
        'A future-data probability averaged over posterior parameter uncertainty.',
        r`$P(X_{\rm new}=1\mid D)=E[p\mid D]$.`,
        r`For Beta(2,2), one success has predictive probability $1/2$ and two successive successes have probability $3/10$.`,
        'Conditional independence given a parameter does not imply independence after averaging over it.',
      ),
    ],
  ),
  section(
    'Credible intervals and sensitivity to assumptions',
    r`A **credible interval** contains a stated amount of posterior probability. Once a prior, likelihood, and observed dataset are specified, an interval $[l,u]$ with $P(l\le p\le u\mid D)=0.95$ is a 95% posterior credible interval. This statement conditions on the data and treats the parameter as uncertain in the model. It differs from a confidence procedure's repeated-sampling coverage for a fixed parameter.

For posterior Beta(2,1), the density is $2p$ and its CDF on $[0,1]$ is $F(p)=p^2$. The interval $[\sqrt{0.1},\sqrt{0.9}]$ has posterior probability $0.9-0.1=0.8$ and leaves 0.1 in each tail. The interval $[\sqrt{0.2},1]$ also has posterior probability 0.8 but is not equal-tailed. A credibility level alone does not uniquely specify an interval; describe the convention used.

Sensitivity checks compare conclusions under reasonable prior or model choices. With two successes in two trials, a Beta(1,1) prior gives posterior mean $3/4$, while Beta(10,10) gives $12/22=6/11$. The same observed data support different summaries because the prior information differs. This is a reason to report assumptions, not to hide them or automatically prefer one numerical answer.

No prior can recover probability for an event assigned zero prior mass merely by multiplying by a finite likelihood. If every possible parameter gives zero probability to the observation, the marginal likelihood is zero and the update is undefined: reconsider the model or data. Bayesian calculations quantify uncertainty within a model. They do not, by themselves, establish that the sampling mechanism is correct, observations are independent, or a predictive relationship is causal.`,
    [bayes, beta, ciMean],
    [
      termEntry(
        'credible-interval',
        'Credible interval',
        'An interval containing a stated amount of posterior probability.',
        r`A posterior credible interval satisfies $P(l\le\Theta\le u\mid D)=c$ for the stated probability $c$.`,
        r`For posterior density $2p$, $[\sqrt{0.1},\sqrt{0.9}]$ has probability 0.8.`,
        'A posterior probability statement is different from repeated-sampling confidence coverage.',
      ),
    ],
  ),
];
for (const [w1, w2, l1, l2] of [
  [1, 1, 1, 3],
  [1, 3, 2, 1],
  [2, 1, 1, 4],
  [3, 2, 2, 3],
  [2, 5, 3, 1],
]) {
  const d = w1 * l1 + w2 * l2;
  sections[0].questions.push(
    q(
      r`Two parameter values have prior weights ${w1}:${w2} and likelihood values in ratio ${l1}:${l2}. Give the posterior probability of the first value.`,
      r`Multiply prior and likelihood weights, then normalize: $${w1 * l1}/(${w1 * l1}+${w2 * l2})=${frac(w1 * l1, d)}$.`,
      exact(frac(w1 * l1, d)),
    ),
    q(
      r`For prior weights ${w1}:${w2} and likelihood ratio ${l1}:${l2}, give the posterior probability of the second value.`,
      r`Its normalized weight is $${w2 * l2}/${d}=${frac(w2 * l2, d)}$.`,
      exact(frac(w2 * l2, d)),
    ),
  );
}
sections[0].questions.push(
  q(
    'Explain why the posterior denominator is needed after multiplying likelihood and prior.',
    'The product gives unnormalized weights or density. Dividing by its sum or integral makes total posterior probability one.',
  ),
  q(
    'Can a likelihood alone determine a Bayesian posterior without a prior model?',
    'No. The posterior combines both objects and normalization.',
    truth(false),
  ),
);
for (const [a, b] of [
  [1, 1],
  [2, 2],
  [2, 3],
  [3, 2],
  [4, 6],
]) {
  sections[1].questions.push(
    q(
      r`Give the mean of a Beta(${a},${b}) prior.`,
      r`The mean is $a/(a+b)=${a}/${a + b}=${frac(a, a + b)}$.`,
      exact(frac(a, a + b)),
    ),
    q(
      r`Give the variance of a Beta(${a},${b}) prior.`,
      r`The variance is $ab/[(a+b)^2(a+b+1)]=${a * b}/${(a + b) ** 2 * (a + b + 1)}=${frac(a * b, (a + b) ** 2 * (a + b + 1))}$.`,
      exact(frac(a * b, (a + b) ** 2 * (a + b + 1))),
    ),
  );
}
sections[1].questions.push(
  q(
    'Find the normalizing coefficient c in the density c p(1−p) on (0,1).',
    r`$\int_0^1p(1-p)\,dp=1/6$, so $c=6$.`,
    exact(6),
  ),
  q(
    'Explain how Beta(2,2) and Beta(20,20) can have the same mean but different information content.',
    'Both means equal one half. The larger total shape makes the second prior more concentrated, giving smaller variance.',
  ),
);
for (const [a, b, s, n] of [
  [2, 3, 3, 4],
  [1, 1, 0, 5],
  [1, 1, 5, 5],
  [4, 2, 2, 6],
  [3, 5, 4, 10],
]) {
  const A = a + s,
    B = b + n - s;
  sections[2].questions.push(
    q(
      r`A Beta(${a},${b}) prior observes ${s} successes in ${n} conditionally independent Bernoulli trials. Give the ordered posterior shape pair.`,
      r`Add successes and failures: $(a+s,b+n-s)=(${A},${B})$.`,
      tuple([A, B]),
    ),
    q(
      r`Under Beta(${a},${b}) prior and ${s} successes in ${n} trials, give the posterior mean.`,
      r`The posterior is Beta(${A},${B}), with mean $${A}/${A + B}=${frac(A, A + B)}$.`,
      exact(frac(A, A + B)),
    ),
  );
}
sections[2].questions.push(
  q(
    'Starting from Beta(2,2), first observe 3 successes and 1 failure, then 2 successes and 4 failures. Give the posterior shape pair.',
    r`There are 5 successes and 5 failures in total, so the posterior shapes are $(7,7)$.`,
    tuple([7, 7]),
  ),
  q(
    'Why does splitting the same conditionally independent data into batches not change a beta-binomial posterior?',
    'Likelihood factors multiply in either grouping, and the final shapes add the same total success and failure counts.',
  ),
);
for (const [A, B] of [
  [2, 2],
  [3, 1],
  [4, 3],
  [1, 5],
  [5, 5],
]) {
  const sum = A + B;
  sections[3].questions.push(
    q(
      r`Given posterior Beta(${A},${B}), give the predictive probability of the next Bernoulli success.`,
      r`Average $p$ over the posterior: $${A}/${sum}=${frac(A, sum)}$.`,
      exact(frac(A, sum)),
    ),
    q(
      r`Given posterior Beta(${A},${B}), give the predictive probability that both of the next two conditionally independent Bernoulli trials succeed.`,
      r`Use $E[p^2\mid D]=A(A+1)/[(A+B)(A+B+1)]=${frac(A * (A + 1), sum * (sum + 1))}$.`,
      exact(frac(A * (A + 1), sum * (sum + 1))),
    ),
  );
}
sections[3].questions.push(
  q(
    'For posterior Beta(3,2), give the probability of exactly one success in the next two trials.',
    r`There are two orders. The probability is $2AB/[(A+B)(A+B+1)]=12/30=2/5$.`,
    exact('2/5'),
  ),
  q(
    'Explain why multiplying two one-step predictive success probabilities can be wrong.',
    'The future trials share uncertainty in the same parameter. They are independent conditional on that parameter, but generally dependent after averaging it out.',
  ),
);
for (const [lo, hi] of [
  ['0', '1/2'],
  ['1/2', '1'],
  ['1/4', '3/4'],
  ['1/3', '2/3'],
]) {
  const ans = `(${hi})^2-(${lo})^2`;
  sections[4].questions.push(
    q(
      r`The posterior density is $2p$ on $(0,1)$. Give its probability for the interval $[${lo},${hi}]$.`,
      r`The CDF is $p^2$, so the interval probability is $(${hi})^2-(${lo})^2$.`,
      exact(ans),
    ),
    q(
      r`For posterior density $2p$ on $(0,1)$, zero elsewhere, give the posterior probability above ${hi}.`,
      r`The probability is $1-F(${hi})=1-(${hi})^2$.`,
      exact(`1-(${hi})^2`),
    ),
  );
}
sections[4].questions.push(
  q(
    'For posterior Beta(2,1), give an equal-tailed 80% credible interval as an ordered exact pair.',
    r`Use CDF values 0.1 and 0.9. The endpoints are $(\sqrt{1/10},\sqrt{9/10})$.`,
    tuple(['sqrt(1/10)', 'sqrt(9/10)']),
  ),
  q(
    'Explain why a Bayesian credible interval and a frequentist confidence interval can have different interpretations even if their endpoints coincide.',
    'Credibility conditions on observed data and assigns posterior probability to the parameter. Confidence describes repeated-sampling coverage of a procedure for a fixed parameter.',
  ),
);
sections[0].quickCheck = quick(
  'What must be combined with the likelihood to form a posterior?',
  [
    'A prior, followed by normalization',
    'Only the maximum likelihood estimate',
    'The significance level',
  ],
  0,
  'Bayes updating multiplies likelihood and prior, then normalizes.',
  [
    'Correct. Both information sources enter the conditional parameter distribution.',
    'An MLE is a point summary and does not supply a prior distribution.',
    'A significance level belongs to a testing decision rule, not posterior normalization.',
  ],
);
sections[3].quickCheck = quick(
  'Given uncertain p, two future Bernoulli trials are independent conditional on p. Must they be independent after averaging over p?',
  ['Yes', 'No'],
  1,
  'Shared parameter uncertainty can induce marginal predictive dependence.',
  [
    'Conditional independence does not in general survive averaging over a common random parameter.',
    'Correct. The two-success probability uses E[p²], which need not equal E[p]².',
  ],
);
sections[0].review = [
  q(
    'Prior weights are 1:1 and likelihood weights are 2:3. Give the posterior mass of the first parameter.',
    r`$2/(2+3)=2/5$.`,
    exact('2/5'),
  ),
  q(
    'Prior weights are 2:1 and likelihood weights are 1:3. Give the posterior mass of the first parameter.',
    r`$2/(2+3)=2/5$.`,
    exact('2/5'),
  ),
  q(
    'Does a posterior combine the prior with information from the observed data?',
    'Yes, through likelihood multiplication and normalization.',
    truth(true),
  ),
];
sections[1].review = [
  q('Give the mean of Beta(3,7).', r`$3/(3+7)=3/10$.`, exact('3/10')),
  q('Give the variance of Beta(1,1).', r`$1/(2^2\cdot3)=1/12$.`, exact('1/12')),
  q(
    'What normalizing coefficient multiplies p² on (0,1)?',
    r`Since $\int_0^1p^2\,dp=1/3$, the coefficient is 3.`,
    exact(3),
  ),
];
sections[2].review = [
  q(
    'Beta(2,4) prior, 3 successes in 5 trials. Give posterior shapes.',
    r`$(2+3,4+2)=(5,6)$.`,
    tuple([5, 6]),
  ),
  q(
    'Beta(1,2) prior, 4 successes in 6 trials. Give posterior shapes.',
    r`$(1+4,2+2)=(5,4)$.`,
    tuple([5, 4]),
  ),
  q(
    'Beta(2,2) prior, one success in one trial. Give the posterior mean.',
    r`Posterior Beta(3,2) has mean $3/5$.`,
    exact('3/5'),
  ),
];
sections[3].review = [
  q('Posterior Beta(2,3): give the next-success predictive probability.', r`$2/5$.`, exact('2/5')),
  q(
    'Posterior Beta(2,3): give the two-success predictive probability.',
    r`$2\cdot3/(5\cdot6)=1/5$.`,
    exact('1/5'),
  ),
  q('Posterior Beta(3,4): give the next-failure predictive probability.', r`$4/7$.`, exact('4/7')),
];
sections[4].review = [
  q(
    'Posterior density is 2p on (0,1). Give the probability p≤1/2.',
    r`$F(1/2)=(1/2)^2=1/4$.`,
    exact('1/4'),
  ),
  q(
    'For density 2p on (0,1), zero elsewhere, give the probability p≥1/2.',
    r`$1-F(1/2)=3/4$.`,
    exact('3/4'),
  ),
  q(
    'Does an 80% credible level uniquely determine the interval endpoints?',
    'No. Equal-tailed and other intervals can contain the same posterior probability with different endpoints.',
    truth(false),
  ),
];
export default lesson(
  20,
  'bayesian-estimation',
  'Bayesian Estimation and Prediction',
  'Bayes’ theorem can update uncertainty about a model parameter as well as uncertainty about an event. We develop finite posterior calculations, a tractable probability-parameter family, and predictions that retain uncertainty rather than replacing it immediately with one fitted number.',
  sections,
);
