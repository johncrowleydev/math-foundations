import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  tuple,
  truth,
  probability,
  quick,
} from './helpers.mjs';
const lln = citation(
  'pn-7-1-1',
  'pishro-nik',
  '§7.1.1 Law of Large Numbers',
  'https://www.probabilitycourse.com/chapter7/7_1_1_law_of_large_numbers.php',
  'Sample-mean moments, weak law of large numbers, and finite-variance deviation proof.',
);
const clt = citation(
  'pn-7-1-2',
  'pishro-nik',
  '§7.1.2 Central Limit Theorem',
  'https://www.probabilitycourse.com/chapter7/7_1_2_central_limit_theorem.php',
  'Iid finite-variance CLT, standardized CDF convergence, approximation examples, and continuity correction.',
);
const covariance = citation(
  'pn-5-3-1',
  'pishro-nik',
  '§5.3.1 Covariance and Correlation',
  'https://www.probabilitycourse.com/chapter5/5_3_1_covariance_correlation.php',
  'Covariance identities, correlation, variance of sums, and uncorrelated versus independent variables.',
);
const normals = citation(
  'pn-5-3-2',
  'pishro-nik',
  '§5.3.2 Bivariate Normal Distribution, opening discussion',
  'https://www.probabilitycourse.com/chapter5/5_3_2_bivariate_normal_dist.php',
  'Independent normal sums are normal; marginal normality alone is insufficient without joint assumptions.',
);
const normalcdf = citation(
  'pn-4-2-3',
  'pishro-nik',
  '§4.2.3 Normal (Gaussian) Distribution',
  'https://www.probabilitycourse.com/chapter4/4_2_3_normal.php',
  'Normal density, mean/variance convention, standardization, CDF symmetry, and probability calculations.',
);
const s1 = section(
  'A statistic has a sampling distribution',
  r`Before observations are collected, a sample is represented by random variables $X_1,\ldots,X_n$. The sample mean $\bar X_n=(X_1+\cdots+X_n)/n$ is also random. Its **sampling distribution** describes the different means that could arise under repetitions of the specified sampling process. After one sample is observed, $\bar x_n$ is one realized value from that distribution.

The term **iid** means independent and identically distributed. Independence specifies the joint relationship among observations; identical distribution says each follows the same marginal model. Neither condition implies the other. In this lesson's main results, the observations are iid with mean $\mu$ and finite variance $\sigma^2$.

Linearity gives $E[\bar X_n]=\mu$. Independence removes covariance terms, giving $\operatorname{Var}(\bar X_n)=\sigma^2/n$. Its standard deviation, $\sigma/\sqrt n$, is called the **standard error of the mean**. This is an exact moments calculation under the assumptions, even if the population is highly nonnormal. Normal approximation concerns the distribution's shape and is a separate step.

For two independent fair Bernoulli observations, the mean is zero, one half, or one with probabilities one quarter, one half, and one quarter. Its expectation is one half and its variance is one eighth. The underlying individual observations have variance one quarter. Averaging has reduced spread, but the sampling distribution is still discrete and not exactly normal.

Keep three objects separate: the population distribution of a single observation, the distribution of a statistic across possible samples, and the empirical distribution of values within the one sample collected. In a simulation, taking many replicate samples helps visualize the sampling distribution; increasing the number of replicates does not change $n$, the number of observations averaged in each sample. Increasing $n$ changes the statistic itself and its variance.`,
  [lln, clt],
  [
    termEntry(
      'sampling-distribution',
      'Sampling distribution',
      'The probability distribution of a statistic under repeated sampling.',
      r`For iid observations, $\bar X_n$ has mean $\mu$ and variance $\sigma^2/n$.`,
      r`The mean of two independent fair bits takes $0,1/2,1$.`,
      `The sampling distribution of means differs from the distribution of individual observations.`,
    ),
    termEntry(
      'standard-error-mean',
      'Standard error of the mean',
      'The standard deviation of the sample mean.',
      r`For iid observations of variance $\sigma^2$, $\operatorname{SE}(\bar X_n)=\sigma/\sqrt n$.`,
      r`Population standard deviation twelve and sample size thirty-six give standard error two.`,
      `Standard error is not the standard deviation of individual observations.`,
    ),
  ],
);
s1.questions = [
  q(
    r`Iid observations have mean seven and variance nine. Find $E[\bar X_{25}]$.`,
    r`The mean of the sample mean remains $\mu=7$.`,
    exact('7'),
  ),
  q(
    r`Iid observations have variance nine. Find $\operatorname{Var}(\bar X_{25})$.`,
    r`$9/25$.`,
    exact('9/25'),
  ),
  q(
    r`Iid observations have standard deviation twelve. Find the standard error for a mean of thirty-six observations.`,
    r`$12/\sqrt{36}=2$.`,
    exact('2'),
  ),
  q(
    r`Two independent fair Bernoulli observations are averaged. Find the probability that their mean is $1/2$.`,
    r`The outcomes $(0,1)$ and $(1,0)$ each have probability $1/4$, totaling $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Two independent fair Bernoulli observations are averaged. Find the variance of their mean.`,
    r`Each has variance $1/4$, so the mean has variance $(1/4)/2=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Four iid observations each have mean three and variance two. Give the mean and variance of their sum.`,
    r`The sum has mean twelve and variance eight, giving $(12,8)$.`,
    tuple(['12', '8']),
  ),
  q(
    r`A simulation generates one thousand samples, each containing sixteen observations. What is $n$ in the standard-error formula for each sample mean?`,
    r`$n=16$; the number of replicate samples is a separate simulation setting.`,
    exact('16'),
  ),
  q(
    r`True or false: calculating $\operatorname{Var}(\bar X_n)=\sigma^2/n$ requires a normal population.`,
    r`False. Iid observations with finite variance suffice for this exact moment identity.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain how observations can be identically distributed without being independent.`,
    r`Set every observation equal to the same random variable. Each then has the same marginal distribution, but observing one determines all the others.`,
  ),
  q(
    r`Derive the variance of an iid sample mean with finite variance.`,
    r`The independent sum has variance $n\sigma^2$. Scaling by $1/n$ multiplies variance by $1/n^2$, yielding $\sigma^2/n$.`,
    undefined,
    'prove',
  ),
];
s1.review = [
  q(
    r`Iid observations have standard deviation fifteen. Find the standard error at sample size one hundred.`,
    r`$15/\sqrt{100}=3/2$.`,
    exact('3/2'),
  ),
  q(
    r`Three independent Bernoulli variables have success probability $1/2$. Find the probability that their mean is one.`,
    r`All three must succeed, with probability $(1/2)^3=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Iid observations have variance twenty. Find the variance of a sample mean of five observations.`,
    r`$20/5=4$.`,
    exact('4'),
  ),
];
const s2 = section(
  'The law of large numbers concerns concentration',
  r`The weak law of large numbers says that averages approach the population mean in probability. Under iid sampling with an integrable observation, for every fixed $\varepsilon>0$, $P(|\bar X_n-\mu|\ge\varepsilon)\to0$ as $n\to\infty$. The phrase **in probability** means that a fixed-sized error becomes increasingly unlikely. It does not say that every new sample mean is closer than the preceding one.

A short proof is available under the stronger finite-variance assumption used throughout our calculations. On the event $|\bar X_n-\mu|\ge\varepsilon$, the squared error is at least $\varepsilon^2$. Consequently $E[(\bar X_n-\mu)^2]\ge\varepsilon^2P(|\bar X_n-\mu|\ge\varepsilon)$. Since the left side is $\sigma^2/n$, we obtain $P(|\bar X_n-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$, which tends to zero. This is Chebyshev's inequality applied to the mean; later concentration material develops such bounds more broadly.

The bound is a guarantee from moments and assumptions, not an exact probability. If its right side exceeds one, replace it by the trivial bound one. For variance four, $n=400$, and tolerance one half, the upper bound is $4/[400(1/2)^2]=0.04$. The true error probability can be much smaller; no normal approximation was used.

Bernoulli averages are observed proportions. If repeated trials are iid with success probability $p$, the law says the observed proportion approaches $p$ in probability. A recent run of failures does not make a success more likely on the next independent trial. The adjustment occurs because later observations add to the average, not because the process compensates for earlier imbalance.

The integrability assumption matters. Some heavy-tailed models lack a finite mean, so the theorem cannot target an ordinary finite expectation. Dependence and changing distributions also require separate analysis. More data from a biased measurement process can concentrate around the wrong target rather than repair the bias.`,
  [lln],
  [
    termEntry(
      'weak-law',
      'Weak law of large numbers',
      'A fixed error in an iid average becomes unlikely as sample size grows.',
      r`For integrable iid observations, $P(|\bar X_n-\mu|\ge\varepsilon)\to0$ for every $\varepsilon>0$.`,
      r`For finite variance the error probability is at most $\sigma^2/(n\varepsilon^2)$.`,
      `The result does not guarantee monotonically improving realized averages or compensation after streaks.`,
    ),
  ],
);
s2.questions = [
  q(
    r`Iid observations have variance four. Use the squared-error bound to bound $P(|\bar X_{400}-\mu|\ge1/2)$. Give the resulting upper bound.`,
    r`$4/[400(1/2)^2]=1/25$.`,
    exact('1/25'),
  ),
  q(
    r`Iid observations have variance nine. Give the Chebyshev upper bound for $P(|\bar X_{100}-\mu|\ge1)$.`,
    r`$9/(100\cdot1^2)=9/100$.`,
    exact('9/100'),
  ),
  q(
    r`Iid observations have variance one. What smallest integer $n$ makes the Chebyshev bound for error at least $1/10$ at most $1/20$?`,
    r`Require $1/[n(1/10)^2]\le1/20$, so $n\ge2000$. The smallest is $2000$.`,
    exact('2000'),
  ),
  q(
    r`Iid observations have variance two. What Chebyshev upper bound results for error at least $1/2$ in a mean of one hundred observations?`,
    r`$2/[100(1/2)^2]=2/25$.`,
    exact('2/25'),
  ),
  q(
    r`A Chebyshev calculation returns $5/2$ as an upper bound on an event probability. What bound results after also using the probability axiom?`,
    r`Take the smaller bound, $\min(1,5/2)=1$.`,
    exact('1'),
  ),
  q(
    r`For iid Bernoulli trials with $p=1/4$, what constant does the observed proportion approach in probability?`,
    r`The expectation of each indicator is $p=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`True or false: the law of large numbers says each successive realized sample mean is closer to the population mean.`,
    r`False. It is a probabilistic asymptotic statement; individual sequences can fluctuate.`,
    truth(false),
    'interpret',
  ),
  q(
    r`After ten failures in iid Bernoulli trials with success probability $1/5$, what is the next trial's success probability?`,
    r`Independence keeps the probability at $1/5$.`,
    exact('1/5'),
  ),
  q(
    r`Explain why the weak law does not prove that a biased measuring instrument becomes accurate when used many times.`,
    r`Its average can converge to the expectation of its biased readings. That expectation may differ from the intended physical target.`,
  ),
  q(
    r`Prove the finite-variance weak law using the inequality between squared error and a deviation-event indicator.`,
    r`Since $(\bar X_n-\mu)^2\ge\varepsilon^2 1_{\{|\bar X_n-\mu|\ge\varepsilon\}}$, expectation gives the probability bound $\sigma^2/(n\varepsilon^2)$. For fixed positive $\varepsilon$, that bound tends to zero.`,
    undefined,
    'prove',
  ),
];
s2.review = [
  q(
    r`Iid observations have variance sixteen. Give the Chebyshev bound for the chance that their mean over one hundred observations differs from its expectation by at least two.`,
    r`The bound is $16/[100(2^2)]=1/25$.`,
    exact('1/25'),
  ),
  q(
    r`Iid observations have variance one. What smallest $n$ makes the Chebyshev bound at tolerance $1/2$ at most $1/10$?`,
    r`$1/[n(1/2)^2]\le1/10$ requires $n\ge40$, so $40$.`,
    exact('40'),
  ),
  q(
    r`True or false: a bound of $0.04$ means the actual deviation probability equals $0.04$.`,
    r`False. It only establishes that the actual probability is at most that value.`,
    truth(false),
    'interpret',
  ),
];
s2.quickCheck = quick(
  r`What does the weak law say about $\bar X_n$ under its iid integrability assumptions?`,
  [
    `Every new observation makes the realized average closer to the mean.`,
    `For every fixed positive tolerance, the chance of exceeding that error tends to zero.`,
    `The individual observations become normally distributed.`,
  ],
  1,
  `The weak law is convergence in probability of the average.`,
  [
    `Realized averages can move away from the mean at some steps; monotonic improvement is not guaranteed.`,
    `Correct. The law controls probabilities of fixed-sized deviations as sample size grows.`,
    `The law concerns an average and does not change the distribution of individual observations.`,
  ],
);
const s3 = section(
  'The central limit theorem describes standardized fluctuations',
  r`The law of large numbers says an average concentrates. The central limit theorem, or CLT, describes the shape of its fluctuations after rescaling. Suppose $X_1,X_2,\ldots$ are iid with mean $\mu$ and variance $0<\sigma^2<\infty$. Then $Z_n=(\bar X_n-\mu)/(\sigma/\sqrt n)=(\sum_iX_i-n\mu)/(\sigma\sqrt n)$ converges in distribution to $N(0,1)$.

Convergence in distribution here means $P(Z_n\le z)\to\Phi(z)$ for every real $z$. It is a statement about CDFs, so it can hold even when every $Z_n$ is discrete. Bernoulli sums never become literally continuous; their standardized distribution can nonetheless be well approximated by normal probabilities over suitable regions.

The scaling is essential. The unscaled average has variance $\sigma^2/n$, which shrinks toward zero. Dividing its deviation by $\sigma/\sqrt n$ magnifies that shrinking fluctuation to variance one. The weak law and CLT therefore describe compatible features: concentration at the original scale and a limiting shape after magnification.

For practical calculations, write $\bar X_n\approx N(\mu,\sigma^2/n)$ or $S_n\approx N(n\mu,n\sigma^2)$. The second parameter is variance throughout this subject. These are approximations to distributions; the means and variances displayed are exact under the assumptions. When the observations themselves are independent normal variables, their sums and means are exactly normal for every positive sample size. The CLT is needed to extend approximate normal behavior beyond that special case.

There is no universal sample size at which the approximation suddenly becomes accurate. Skewness, rare large values, the probability region being approximated, and dependence can all matter. A fixed rule such as “thirty observations is enough” is a heuristic, not the theorem. A CDF approximation that works near the center can also give poor relative accuracy in an extremely small tail. State the normal approximation explicitly and assess the underlying model before interpreting its numerical output.`,
  [clt, normals],
  [
    termEntry(
      'central-limit-theorem',
      'Central limit theorem',
      'Standardized iid sums approach a normal distribution under finite positive variance.',
      r`$(\bar X_n-\mu)/(\sigma/\sqrt n)$ converges in distribution to $N(0,1)$.`,
      r`A binomial sum can have approximately normal standardized CDFs despite being discrete.`,
      `The CLT concerns sums or means, not normality of individual observations.`,
    ),
  ],
);
s3.questions = [
  q(
    r`Iid observations have mean ten and standard deviation four. For $n=64$ and observed mean eleven, find the standardized mean score.`,
    r`The standard error is $4/8=1/2$, so $(11-10)/(1/2)=2$.`,
    exact('2'),
  ),
  q(
    r`Iid observations have mean two and variance three. Give the approximate normal mean and variance of their sum for $n=100$.`,
    r`The sum has mean $200$ and variance $300$, so the parameter pair is $(200,300)$.`,
    tuple(['200', '300']),
  ),
  q(
    r`Iid observations have mean two and variance three. Give the approximate normal mean and variance of their average for $n=100$.`,
    r`The mean is two and variance $3/100$, giving $(2,3/100)$.`,
    tuple(['2', '3/100']),
  ),
  q(
    r`Under the iid finite-positive-variance CLT, what is the limiting variance of the standardized variable $Z_n$?`,
    r`It is $1$; indeed the standardization gives variance one for every $n$.`,
    exact('1'),
  ),
  q(
    r`For iid $N(5,16)$ observations, give the exact distribution parameters of their mean at $n=4$.`,
    r`The mean is exactly $N(5,4)$, so the pair is $(5,4)$.`,
    tuple(['5', '4']),
  ),
  q(
    r`True or false: the iid CLT requires the original observations to have a continuous density.`,
    r`False. Discrete observations such as Bernoulli variables can satisfy its assumptions.`,
    truth(false),
    'interpret',
  ),
  q(
    r`True or false: the usual iid CLT standardization $(\bar X_n-\mu)/(\sigma/\sqrt n)$ applies when the observation variance is infinite.`,
    r`False. This theorem requires finite positive variance, and its standardization would not be defined as stated.`,
    truth(false),
    'interpret',
  ),
  q(
    r`For iid observations of variance nine, what is the variance of $\sqrt n(\bar X_n-\mu)$?`,
    r`$n(9/n)=9$.`,
    exact('9'),
  ),
  q(
    r`Explain why the weak law and CLT do not contradict each other.`,
    r`The weak law describes shrinking errors on the original scale. The CLT divides by their shrinking standard deviation to describe a nondegenerate limiting shape.`,
  ),
  q(
    r`Explain why a discrete standardized sum can converge in distribution to a continuous normal variable.`,
    r`Convergence in distribution concerns convergence of CDF values. It does not require the approximating variables to have densities or exactly match the limiting support at any finite sample size.`,
  ),
];
s3.review = [
  q(
    r`Iid observations have mean six and standard deviation three. Find the standardized score of sample mean seven at $n=81$.`,
    r`The standard error is $3/9=1/3$, so the score is $1/(1/3)=3$.`,
    exact('3'),
  ),
  q(
    r`For sixteen iid $N(-2,9)$ observations, give the exact mean and variance of their average.`,
    r`The pair is $(-2,9/16)$.`,
    tuple(['-2', '9/16']),
  ),
  q(
    r`True or false: $n=30$ guarantees accurate normal approximation for every finite-variance population and every tail probability.`,
    r`False. Approximation quality depends on distribution shape and the event; no universal cutoff follows from the CLT.`,
    truth(false),
    'interpret',
  ),
];
const s4 = section(
  'Approximate probabilities for means, sums, and proportions',
  r`A normal approximation begins with the random quantity in the question. For a mean, use standard error $\sigma/\sqrt n$; for a sum, use standard deviation $\sigma\sqrt n$. Confusing them changes the scale by a factor of $n$. Translate the requested event into standardized thresholds, then use the supplied normal CDF values and the correct tails.

Suppose one hundred iid processing times have mean four and standard deviation two. Their total has mean four hundred and standard deviation twenty. Under a normal approximation, $P(S_{100}>440)\approx1-\Phi(2)$. Using $\Phi(2)=0.9772$ gives $0.0228$. Equivalently, the average exceeds $4.4$ with the same probability; its standard error is $0.2$. These are two descriptions of the same event, not different calculations.

For iid Bernoulli observations, the sum $K$ is binomial and the sample proportion is $\hat p=K/n$. Their moments are $E[K]=np$, $\operatorname{Var}(K)=np(1-p)$, $E[\hat p]=p$, and $\operatorname{Var}(\hat p)=p(1-p)/n$. A normal approximation can be useful when both expected successes and expected failures are reasonably large. Checking $np$ and $n(1-p)$ is a practical diagnostic; a specific cutoff is not a proof of accuracy.

A **continuity correction** respects the integer-width cells of a count. For example, $P(K\le k)$ is approximated using a continuous threshold $k+1/2$. The event $K\ge k$ uses a lower threshold $k-1/2$, while $a\le K\le b$ uses $(a-1/2,b+1/2)$. The half-unit adjustment is made on the count scale before standardizing.

For $K\sim\operatorname{Binomial}(100,1/2)$, mean fifty and standard deviation five, approximate $P(K\le55)$ using $z=(55.5-50)/5=1.1$. With $\Phi(1.1)=0.8643$, the answer is approximately $0.8643$. This is a model approximation, not an exact evaluation of a binomial sum; round only after using the supplied values.`,
  [clt, normalcdf],
  [
    termEntry(
      'continuity-correction',
      'Continuity correction',
      'Adjust count thresholds by half a unit before a continuous approximation.',
      r`Approximate $P(K\le k)$ using the continuous boundary $k+1/2$.`,
      r`For $K\sim\operatorname{Binomial}(100,1/2)$, $K\le55$ uses standardized threshold $1.1$.`,
      `Apply the half-unit correction on the count scale, not after standardization.`,
    ),
  ],
);
s4.questions = [
  q(
    r`Iid observations have mean four and standard deviation two. For $n=100$, approximate $P(\bar X>4.4)$ using $\Phi(2)=0.9772$. Give four decimal places.`,
    r`The standard error is $0.2$, so the score is two and the probability is $1-0.9772=0.0228$.`,
    probability('0.0228'),
  ),
  q(
    r`Iid observations have mean four and standard deviation two. For $n=100$, approximate $P(3.8<\bar X<4.2)$ using $\Phi(1)=0.8413$. Give four decimal places.`,
    r`The standardized interval is $(-1,1)$, giving $2(0.8413)-1=0.6826$.`,
    probability('0.6826'),
  ),
  q(
    r`Iid observations have mean three and standard deviation four. For $n=64$, approximate the chance their sum exceeds $256$ using $\Phi(2)=0.9772$. Give four decimal places.`,
    r`The sum has mean $192$ and standard deviation $32$, so its score is two. The probability is $0.0228$.`,
    probability('0.0228'),
  ),
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, find its standard deviation.`,
    r`$\sqrt{100(1/2)(1/2)}=5$.`,
    exact('5'),
  ),
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, find the continuity-corrected standardized upper threshold for $K\le55$.`,
    r`$(55.5-50)/5=11/10$.`,
    exact('11/10'),
  ),
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, approximate $P(K\le55)$ with continuity correction using $\Phi(1.1)=0.8643$. Give four decimal places.`,
    r`The corrected score is $1.1$, so the approximation is $0.8643$.`,
    probability('0.8643'),
  ),
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, approximate $P(K\ge56)$ with continuity correction using $\Phi(1.1)=0.8643$. Give four decimal places.`,
    r`Use lower boundary $55.5$, score $1.1$, and the upper tail: $1-0.8643=0.1357$.`,
    probability('0.1357'),
  ),
  q(
    r`For one hundred iid Bernoulli trials with $p=1/2$, find the standard error of the observed proportion.`,
    r`$\sqrt{p(1-p)/n}=\sqrt{1/400}=1/20$.`,
    exact('1/20'),
  ),
  q(
    r`For binomial parameters $n=100,p=1/1000$, give expected success and failure counts.`,
    r`They are $np=1/10$ and $n(1-p)=999/10$, giving $(1/10,999/10)$.`,
    tuple(['1/10', '999/10']),
  ),
  q(
    r`Explain why a normal approximation can be poor for $\operatorname{Binomial}(100,1/1000)$ despite sample size one hundred.`,
    r`Expected successes are only $0.1$, and the distribution puts most probability at zero. Its strong asymmetry and discreteness are poorly represented by a symmetric normal curve.`,
  ),
];
s4.review = [
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, approximate $P(45\le K\le55)$ using continuity correction and $\Phi(1.1)=0.8643$. Give four decimal places.`,
    r`The corrected interval is $(44.5,55.5)$, with scores $(-1.1,1.1)$. The probability is $2(0.8643)-1=0.7286$.`,
    probability('0.7286'),
  ),
  q(
    r`Iid observations have mean ten and standard deviation six. For $n=36$, approximate $P(\bar X<9)$ using $\Phi(1)=0.8413$. Give four decimal places.`,
    r`The standard error is one, so the score is $-1$ and the probability is $0.1587$.`,
    probability('0.1587'),
  ),
  q(
    r`For $K\sim\operatorname{Binomial}(100,1/2)$, what continuous lower boundary should be used for the event $K\ge45$?`,
    r`The first included integer cell begins at $44.5=89/2$.`,
    exact('89/2'),
  ),
];
const s5 = section(
  'Check dependence, precision, and the limits of asymptotics',
  r`The $1/\sqrt n$ standard-error reduction depends on how information accumulates. Under iid sampling, halving the standard error requires four times the observations, not twice as many. More generally, reducing it by a factor $r$ requires multiplying sample size by $r^2$, holding the population variability fixed. This is a precision relationship, not an assertion about how much data a particular application needs.

Shared noise can prevent averages from becoming arbitrarily stable. Suppose $X_i=B+\varepsilon_i$, where the common component $B$ has variance $\tau^2$, the individual errors are mutually independent with variance $v$, and all are independent of $B$. Then $\bar X_n=B+\bar\varepsilon_n$ and $\operatorname{Var}(\bar X_n)=\tau^2+v/n$. Independent noise averages away, but the common component remains. Treating these observations as iid would incorrectly predict variance $(\tau^2+v)/n$.

With identically distributed observations of variance $v$ and common pairwise covariance $c$, direct expansion gives $\operatorname{Var}(\bar X_n)=v/n+(n-1)c/n$. This formula describes any joint model satisfying those moments; the moments must themselves be feasible for its sample size. Positive common covariance slows reduction. For repeated copies of one random value, $c=v$, and the variance never falls at all.

Heavy tails present a different limitation. The density $2/x^3$ on $x\ge1$ has finite mean two but infinite variance. The integrable iid weak law still applies to its average, while the finite-variance CLT stated here does not. This example keeps theorem assumptions from collapsing into a vague idea that “large samples fix everything.” A model without a finite mean would also fall outside that weak-law statement.

Finally, an approximation can fail because its target changed. A time series with evolving workload, a sample selected by outcome, or repeated observations from shared units requires attention before using iid formulas. Sampling distributions provide the bridge to inference, but they do not authorize population or causal claims beyond the study design. State which quantity is random, which population is targeted, which assumptions are used, and which numerical conclusions are approximate.`,
  [covariance, lln, clt],
  [
    termEntry(
      'shared-noise',
      'Shared noise in an average',
      'A common random component does not disappear when readings are averaged.',
      r`If $X_i=B+\varepsilon_i$ with independent components and common noise variance $\operatorname{Var}(\varepsilon_i)=\tau^2$, then $\operatorname{Var}(\bar X_n)=\operatorname{Var}(B)+\tau^2/n$.`,
      r`A shared calibration error persists across repeated measurements.`,
      `More readings are not equivalent to more independent sources of information.`,
    ),
  ],
);
s5.questions = [
  q(
    r`Under iid sampling, by what factor must sample size grow to halve the standard error?`,
    r`Standard error scales as $1/\sqrt n$, so sample size must grow by factor $4$.`,
    exact('4'),
  ),
  q(
    r`A mean based on twenty-five iid observations has standard error two. Find the standard error at one hundred observations from the same population.`,
    r`Sample size quadruples, so the standard error halves to $1$.`,
    exact('1'),
  ),
  q(
    r`What iid sample size gives standard error at most one half if population standard deviation is five? Give the smallest integer.`,
    r`$5/\sqrt n\le1/2$ requires $n\ge100$, so $100$.`,
    exact('100'),
  ),
  q(
    r`Let $X_i=B+\varepsilon_i$, with independent components, $\operatorname{Var}(B)=4$, and iid error variance nine. Find $\operatorname{Var}(\bar X_9)$.`,
    r`$4+9/9=5$.`,
    exact('5'),
  ),
  q(
    r`Let $X_i=B+\varepsilon_i$, with common variance $\operatorname{Var}(B)=4$ and iid individual errors of variance nine, independent of $B$. Find the limit of the sample-mean variance as $n$ grows.`,
    r`$4+9/n\to4$.`,
    exact('4'),
  ),
  q(
    r`Ten observations have variance two each and covariance $1/2$ for each distinct pair. Find their mean's variance.`,
    r`$2/10+9(1/2)/10=1/5+9/20=13/20$.`,
    exact('13/20'),
  ),
  q(
    r`All one hundred observations equal the same variable with variance seven. Find the variance of their mean.`,
    r`The mean equals that same variable, so its variance is $7$.`,
    exact('7'),
  ),
  q(
    r`True or false: finite mean but infinite variance can permit the iid weak law while violating the finite-variance CLT assumptions taught here.`,
    r`True. The iid weak law needs integrability, whereas this CLT additionally requires finite positive variance.`,
    truth(true),
    'interpret',
  ),
  q(
    r`Explain why collecting more repeated readings cannot remove a common random calibration error in the model $X_i=B+\varepsilon_i$.`,
    r`The average still contains $B$ with coefficient one. Only the average of independent errors contracts; the variance of the shared component remains.`,
  ),
  q(
    r`A report calls a normal approximation exact solely because the sample is large. Correct the claim.`,
    r`Large sample size can improve an approximation under suitable assumptions, but the CLT is a limiting statement. Finite-sample error and model assumptions remain; exact normality requires a separate result such as independent normal observations.`,
  ),
];
s5.review = [
  q(
    r`To reduce an iid standard error by a factor of three, by what factor must sample size grow?`,
    r`The sample-size factor is $3^2=9$.`,
    exact('9'),
  ),
  q(
    r`A shared-noise model has common variance one and independent individual variance four. Find the mean's variance for sixteen readings.`,
    r`$1+4/16=5/4$.`,
    exact('5/4'),
  ),
  q(
    r`Six observations have variance three each and pairwise covariance one. Find their mean's variance.`,
    r`$3/6+5/6=4/3$.`,
    exact('4/3'),
  ),
];
s5.quickCheck = quick(
  r`Which distinction between the weak law and CLT is correct?`,
  [
    `The weak law concerns concentration; the CLT concerns the limiting shape after standardization.`,
    `Both say that individual observations become normal.`,
    `The CLT guarantees an accurate approximation once exactly thirty observations are collected.`,
  ],
  0,
  `The results describe different scales of the same averaging process under their respective assumptions.`,
  [
    `Correct. An unscaled average concentrates while its rescaled fluctuations can approach a normal distribution.`,
    `Neither theorem changes the underlying distribution of an individual observation.`,
    `No universal sample-size cutoff is supplied by the theorem; shape and tail behavior affect accuracy.`,
  ],
);
export default lesson(
  15,
  'laws-large-numbers-central-limit-theorem',
  'Laws of Large Numbers and the Central Limit Theorem',
  r`Repeated sampling connects probability models to statistical inference. We distinguish exact moments of averages, concentration around an expectation, and approximate normal shapes, then check how dependence and heavy tails change what can be concluded.`,
  [s1, s2, s3, s4, s5],
);
