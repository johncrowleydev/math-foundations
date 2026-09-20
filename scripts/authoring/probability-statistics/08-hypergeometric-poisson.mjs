import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  probability,
  truth,
  tuple,
  quick,
} from './helpers.mjs';
const special = citation(
  'pn-3-1-5',
  'pishro-nik',
  '§3.1.5 Special Distributions: hypergeometric and Poisson',
  'https://www.probabilitycourse.com/chapter3/3_1_5_special_discrete_distr.php',
  'Hypergeometric support and PMF, Poisson PMF and normalization, interval scaling, and the binomial-to-Poisson limit.',
);
const mean = citation(
  'pn-3-2-2',
  'pishro-nik',
  '§3.2.2 Expectation',
  'https://www.probabilitycourse.com/chapter3/3_2_2_expectation.php',
  'Indicator-sum means and Poisson mean derivation.',
);
const variance = citation(
  'pn-3-2-4',
  'pishro-nik',
  '§3.2.4 Variance',
  'https://www.probabilitycourse.com/chapter3/3_2_4_variance.php',
  'Second-moment identity supporting original finite-population and Poisson variance derivations.',
);
const process = citation(
  'pn-11-1-2',
  'pishro-nik',
  '§11.1.2 Basic Concepts of the Poisson Process, definition and interval-count example',
  'https://www.probabilitycourse.com/chapter11/11_1_2_basic_concepts_of_the_poisson_process.php',
  'Constant-rate Poisson interval counts and independence of disjoint interval increments; no advanced process theory.',
);
const sums = citation(
  'pn-11-1-3',
  'pishro-nik',
  '§11.1.3 Merging and Splitting Poisson Processes, merging independent processes',
  'https://www.probabilitycourse.com/chapter11/11_1_3_merging_and_splitting_poisson_processes.php',
  'Addition of independent Poisson counts and rate parameters.',
);
const poisson = citation(
  'os-4-6',
  'openstax-statistics-2e',
  '§4.6 Poisson Distribution, notation and interval scaling',
  'https://openstax.org/books/introductory-statistics-2e/pages/4-6-poisson-distribution',
  'Poisson mean, standard deviation, and probability calculations with the interval-specific parameter.',
);
const a = section(
  'Hypergeometric counts sample without replacement',
  r`A hypergeometric variable counts marked objects in a uniform sample without replacement. Let the population contain $N$ distinct objects, of which $K$ are marked, and let the sample size be $n$. We write $X\sim\operatorname{Hypergeometric}(N,K,n)$, using population size, marked count, and sample size in that order. The parameters are integers with $0\leq K\leq N$ and $0\leq n\leq N$. Sources may instead use separate marked and unmarked counts; translate their notation before substituting.

To obtain $X=k$, choose $k$ of the $K$ marked objects and $n-k$ of the $N-K$ unmarked objects. Divide by all equally likely size-$n$ subsets: $P(X=k)=\binom Kk\binom{N-K}{n-k}/\binom Nn$. The feasible integers satisfy $\max(0,n-(N-K))\leq k\leq\min(n,K)$. The lower bound matters when the sample is too large to consist entirely of unmarked objects.

For a population of nine objects with four marked, sample three. Exactly two marked has probability $\binom42\binom51/\binom93=30/84=5/14$. No marked objects has probability $\binom53/\binom93=10/84=5/42$, so at least one has probability $37/42$. These are the same subset-counting arguments used earlier, now organized as a distribution family.

The draw indicators are generally dependent. After a marked object is removed, the marked fraction among remaining objects falls. The count is therefore not binomial merely because each draw can be labeled success or failure. The finite population and sampling mechanism determine the distribution. A sample of the entire population has exactly $K$ marked objects, leaving no uncertainty at all.`,
  [special],
  [
    termEntry(
      'hypergeometric-distribution',
      'Hypergeometric distribution',
      'A marked count in a uniform sample without replacement.',
      r`$P(X=k)=\binom Kk\binom{N-K}{n-k}/\binom Nn$ for feasible integer $k$.`,
      r`$N=9,K=4,n=3$ gives $P(X=2)=5/14$.`,
      'This subject orders parameters as population size, marked count, sample size.',
    ),
  ],
);
a.questions = [
  q(
    r`$X\sim\operatorname{Hypergeometric}(8,3,2)$. Find $P(X=2)$.`,
    r`The ratio is $\binom32/\binom82=3/28$.`,
    exact('3/28'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(8,3,2)$, using $(N,K,n)$. Find $P(X=1)$.`,
    r`Choose one marked and one unmarked: $3\cdot5/28=15/28$.`,
    exact('15/28'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(8,3,2)$, using $(N,K,n)$. Find $P(X=0)$.`,
    r`Choose two unmarked: $\binom52/28=10/28=5/14$.`,
    exact('5/14'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(8,3,2)$, using $(N,K,n)$. Find $P(X\geq1)$.`,
    r`The complement is $1-5/14=9/14$.`,
    exact('9/14'),
  ),
  q(
    r`A sample of six is drawn from ten objects with seven marked. Find the smallest feasible marked count.`,
    r`Only three unmarked objects exist, so at least $6-3=3$ must be marked.`,
    exact('3'),
  ),
  q(
    r`A sample of six is drawn uniformly without replacement from ten objects with seven marked. Find the largest feasible marked count.`,
    r`The sample has only six positions, so the maximum is $\min(6,7)=6$.`,
    exact('6'),
  ),
  q(
    r`Sample all twelve objects from a population with five marked. Find $P(X=5)$.`,
    r`The full sample contains all five marked objects with certainty, so the probability is $1$.`,
    exact('1'),
  ),
  q(
    r`Sample zero objects from a population. Find the marked count.`,
    r`The empty sample contains no marked objects, so the count is $0$.`,
    exact('0'),
  ),
  q(
    r`Explain why the lower support bound is $\max(0,n-(N-K))$.`,
    r`At most $N-K$ sample members can be unmarked, so the remainder of a size-$n$ sample must be marked. Counts also cannot be negative.`,
  ),
  q(
    r`True or false: without-replacement category draws are generally independent.`,
    r`False. The first draw changes the remaining category counts and hence later conditional probabilities.`,
    truth(false),
    'interpret',
  ),
];
a.review = [
  q(
    r`$X\sim\operatorname{Hypergeometric}(7,4,3)$. Find $P(X=3)$.`,
    r`All three must come from the four marked objects: $\binom43/\binom73=4/35$.`,
    exact('4/35'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(7,4,3)$, using $(N,K,n)$. Find $P(X=0)$.`,
    r`The only all-unmarked sample takes all three unmarked objects, giving $1/\binom73=1/35$.`,
    exact('1/35'),
  ),
  q(
    r`A source uses parameters “marked $4$, unmarked $6$, sample $3$.” Give the parameters in this lesson's $(N,K,n)$ convention.`,
    r`The population size is $4+6=10$, so the tuple is $(10,4,3)$.`,
    tuple(['10', '4', '3']),
  ),
];
a.quickCheck = quick(
  r`A population has eight marked and two unmarked objects. A sample of four is drawn without replacement. Which count is impossible?`,
  [r`One marked object.`, r`Two marked objects.`, r`Four marked objects.`],
  0,
  r`At most two sample members can be unmarked, so at least two must be marked.`,
  [
    r`One marked would require three unmarked objects, but only two exist.`,
    r`Two marked and the two available unmarked objects form a feasible sample.`,
    r`Four marked objects can be chosen from the eight available marked objects.`,
  ],
);
const b = section(
  'Finite populations reduce count variance',
  r`Each position in a uniform without-replacement sample has marked probability $K/N$ when $N>0$. Writing $X$ as the sum of its $n$ marked indicators and using linearity gives $E[X]=nK/N$. Independence is unnecessary for this mean. The same expected marked count appears in a binomial model with parameter $p=K/N$, but the variances differ.

For $N>1$, the hypergeometric variance is $np(1-p)(N-n)/(N-1)$. The final factor is the finite-population correction. It equals one for a single draw, is less than one for a larger proper sample, and becomes zero when the entire population is sampled. It quantifies the way a fixed population composition limits variability in a large sample. When $N=1$, every permissible count is deterministic and variance is zero; do not substitute into a zero denominator.

We can derive the correction without a new covariance formula. The product $X(X-1)$ counts ordered pairs of distinct sampled positions that are both marked. There are $n(n-1)$ such position pairs, and each is marked with probability $K(K-1)/[N(N-1)]$. Thus $E[X(X-1)]=n(n-1)K(K-1)/[N(N-1)]$. Use $X^2=X(X-1)+X$, add the mean, and subtract the squared mean to obtain the stated variance.

For $N=10,K=4,n=3$, the mean is $6/5$ and the variance is $3(2/5)(3/5)(7/9)=14/25$. A binomial count with the same mean would have variance $18/25$. When the sample is a small fraction of a large population, the correction is near one and a binomial approximation may be useful. Its adequacy depends on the event and required accuracy; proximity of means alone cannot establish it.`,
  [special, mean, variance],
  [
    termEntry(
      'finite-population-correction',
      'Finite-population correction',
      'The variance reduction caused by sampling without replacement.',
      r`For a hypergeometric count and $N>1$, multiply $np(1-p)$ by $(N-n)/(N-1)$.`,
      r`Sampling all $N$ objects makes the correction zero.`,
      'It changes the variance, not the expected count $np$.',
    ),
  ],
);
b.questions = [
  q(
    r`$X\sim\operatorname{Hypergeometric}(12,5,3)$. Find its mean.`,
    r`The expected count is $3(5/12)=5/4$.`,
    exact('5/4'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(10,4,5)$. Find the finite-population correction.`,
    r`The correction is $(10-5)/(10-1)=5/9$.`,
    exact('5/9'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(10,4,5)$, using $(N,K,n)$. Find its variance.`,
    r`The variance is $5(2/5)(3/5)(5/9)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For a full sample of $N>1$ objects, find the marked-count variance.`,
    r`The correction is zero and the count equals $K$ exactly, so variance is $0$.`,
    exact('0'),
  ),
  q(
    r`For a single draw from $N>1$ objects, find the finite-population correction.`,
    r`The factor is $(N-1)/(N-1)=1$.`,
    exact('1'),
  ),
  q(
    r`$N=6,K=3,n=2$. Find $E[X(X-1)]$.`,
    r`The ordered-pair formula gives $2\cdot1\cdot3\cdot2/(6\cdot5)=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(6,3,2)$, using $(N,K,n)$. Find $E[X^2]$.`,
    r`The mean is one, so $E[X^2]=E[X(X-1)]+E[X]=2/5+1=7/5$.`,
    exact('7/5'),
  ),
  q(
    r`$X\sim\operatorname{Hypergeometric}(6,3,2)$, using $(N,K,n)$. Find its variance.`,
    r`Subtract mean squared: $7/5-1=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Explain why hypergeometric and binomial counts with the same $n,p$ can have equal means but different variances.`,
    r`Linearity uses only each trial's marginal success probability, while variance depends on relationships among trials. Without replacement those indicators are dependent and the finite-population correction reduces spread.`,
  ),
  q(
    r`True or false: the hypergeometric variance formula with denominator $N-1$ should be used directly at $N=1$.`,
    r`False. The formula assumes $N>1$. With one population object, each allowed sample count is deterministic and its variance is computed directly as zero.`,
    truth(false),
    'interpret',
  ),
];
b.review = [
  q(
    r`$X\sim\operatorname{Hypergeometric}(9,3,3)$. Find its variance.`,
    r`The variance is $3(1/3)(2/3)(6/8)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A uniform sample of four from twenty contains an unknown count of the six marked objects. Find its expected count.`,
    r`The mean is $4(6/20)=6/5$.`,
    exact('6/5'),
  ),
  q(
    r`Explain the interpretation of $X(X-1)$ used in the variance derivation.`,
    r`If a sample contains $X$ marked positions, there are $X$ choices for the first marked position and $X-1$ for a different second one. Their product counts ordered marked pairs.`,
  ),
];
const c = section(
  'Poisson counts have an interval-specific mean',
  r`A Poisson variable models a nonnegative integer count with parameter $\lambda>0$: $P(X=k)=e^{-\lambda}\lambda^k/k!$ for $k=0,1,2,\ldots$. We write $X\sim\operatorname{Poisson}(\lambda)$. Its parameter is the expected count in the specified interval or region, not automatically a rate per unit. The limiting case $\lambda=0$ is the constant-zero distribution, handled directly rather than through ambiguous powers.

The exponential series proves normalization: $\sum_{k\geq0}e^{-\lambda}\lambda^k/k!=e^{-\lambda}e^\lambda=1$. Unlike a binomial variable, a positive-parameter Poisson variable has no finite upper bound. Large counts may be extremely unlikely but retain positive mass. The parameter need not be an integer; a mean of $1.5$ events is fully compatible with integer-valued observations.

For $\lambda=2$, the first three masses are $e^{-2}$, $2e^{-2}$, and $2e^{-2}$. Thus no events has probability about $0.1353$, while at most two has probability $5e^{-2}\approx0.6767$. At least three uses the complement $1-5e^{-2}$. The recurrence $p(k+1)=\lambda p(k)/(k+1)$ can compute successive masses efficiently and gives a simple ratio check on arithmetic.

The mean and variance both equal $\lambda$. To check variance, summing the factorial moment gives $E[X(X-1)]=\lambda^2$, so $E[X^2]=\lambda^2+\lambda$ and subtraction leaves $\lambda$. Standard deviation is $\sqrt\lambda$. Equality of mean and variance is a property of the Poisson model, not a fact about every observed count dataset. Data with the same mean can have very different dispersion, so a mean alone is insufficient justification for choosing this distribution.`,
  [special, mean, variance, poisson],
  [
    termEntry(
      'poisson-distribution',
      'Poisson distribution',
      'A nonnegative count distribution with equal mean and variance.',
      r`$P(X=k)=e^{-\lambda}\lambda^k/k!$, $E[X]=\operatorname{Var}(X)=\lambda$.`,
      r`With mean two, $P(X=0)=e^{-2}$.`,
      'The parameter belongs to a specified interval; it is not a success probability.',
    ),
  ],
);
c.questions = [
  q(
    r`$X\sim\operatorname{Poisson}(3)$. Find $P(X=0)$ exactly.`,
    r`The zero-count mass is $e^{-3}3^0/0!=e^{-3}$.`,
    calc('exp(-3)'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(3)$. Find $P(X=1)$ exactly.`,
    r`Substitution gives $3e^{-3}$.`,
    calc('3*exp(-3)'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(3)$. Find $P(X=2)$ exactly.`,
    r`The mass is $e^{-3}3^2/2!=9e^{-3}/2$.`,
    calc('9*exp(-3)/2'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(3)$. Find $P(X\leq1)$ exactly.`,
    r`Add zero and one: $e^{-3}+3e^{-3}=4e^{-3}$.`,
    calc('4*exp(-3)'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(3)$. Find $P(X\geq2)$ exactly.`,
    r`Subtract the lower counts from one: $1-4e^{-3}$.`,
    calc('1-4*exp(-3)'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(5/2)$. Give mean and variance as a pair.`,
    r`Both moments equal the parameter, so the pair is $(5/2,5/2)$.`,
    tuple(['5/2', '5/2']),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(4)$. Find its standard deviation.`,
    r`The standard deviation is $\sqrt4=2$.`,
    exact('2'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(2)$. Find $P(X=3)/P(X=2)$.`,
    r`The successive-mass ratio is $\lambda/(2+1)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`True or false: a Poisson variable of mean $2.5$ can take the value $2.5$.`,
    r`False. Its observations are nonnegative integers; the noninteger parameter is a mean.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Show that the Poisson PMF is normalized using the exponential series.`,
    r`All masses are nonnegative and their sum is $e^{-\lambda}\sum_{k=0}^\infty\lambda^k/k!=e^{-\lambda}e^\lambda=1$.`,
  ),
];
c.review = [
  q(
    r`$X\sim\operatorname{Poisson}(1)$. Find $P(X\geq2)$ exactly.`,
    r`Subtract the masses at zero and one: $1-2e^{-1}$.`,
    calc('1-2*exp(-1)'),
  ),
  q(
    r`$X\sim\operatorname{Poisson}(9)$. Find its standard deviation.`,
    r`The nonnegative square root of the variance nine is $3$.`,
    exact('3'),
  ),
  q(
    r`For $X\sim\operatorname{Poisson}(4)$, find $P(X=4)/P(X=3)$.`,
    r`The ratio is $4/(3+1)=1$, so these adjacent masses are equal.`,
    exact('1'),
  ),
];
c.quickCheck = quick(
  r`A Poisson count has mean $1.5$. Which statement is correct?`,
  [
    r`Its outcomes can be fractional.`,
    r`Its variance is $1.5$.`,
    r`Its maximum possible outcome is two.`,
  ],
  1,
  r`The Poisson parameter is both its mean and its variance, while its outcomes remain nonnegative integers.`,
  [
    r`A fractional mean does not change the integer-valued support.`,
    r`The model identity gives variance equal to the parameter, $1.5$.`,
    r`A positive-parameter Poisson distribution has positive mass at every nonnegative integer, including values above two.`,
  ],
);
const d = section(
  'Rates, exposure, and independent counts',
  r`A rate describes expected events per unit of exposure. In a constant-rate Poisson process with rate $r$ per unit time, the count in an interval of length $t$ is Poisson with mean $\lambda=rt$. Counts in disjoint intervals are independent under this process model. These are substantive assumptions about the generating mechanism; an average rate alone does not imply them. We use only this elementary interval-count consequence here, not a full course on stochastic processes.

Suppose arrivals follow that model at rate six per hour. A twenty-minute interval is one third of an hour, so its mean count is two. The chance of no arrivals is $e^{-2}$, not $e^{-6}$. Over ninety minutes the mean becomes nine. Units provide the check: arrivals per hour multiplied by hours gives expected arrivals. The same reasoning applies to a stated constant rate per length, area, or another exposure measure.

Independent Poisson counts add to a Poisson count whose parameter is the sum. If $X\sim\operatorname{Poisson}(a)$ and $Y\sim\operatorname{Poisson}(b)$ are independent, then $X+Y\sim\operatorname{Poisson}(a+b)$. One derivation sums the disjoint possibilities $X=j,Y=k-j$: the resulting binomial expansion gives $e^{-(a+b)}(a+b)^k/k!$. This also explains adding independent arrival streams over one common interval.

Overlapping intervals do not provide independent counts just because the overall process has independent increments. They share events. Likewise, $2X$ is not the sum of two independent copies of $X$; it is an even-valued transformed variable with variance $4\lambda$. Explicitly distinguish independent sources or disjoint increments from repeatedly using the same count. That distinction determines which addition formula is valid.`,
  [process, sums, poisson],
  [
    termEntry(
      'poisson-exposure',
      'Poisson exposure parameter',
      'Rate multiplied by the size of the observation interval.',
      r`For rate $r$ and exposure $t$, the count mean is $\lambda=rt$.`,
      r`Six arrivals per hour over twenty minutes gives $\lambda=2$.`,
      'Convert units before multiplying; rate and interval mean are different quantities.',
    ),
  ],
);
d.questions = [
  q(
    r`A constant-rate Poisson process has rate $8$ per hour. Find the count parameter for $15$ minutes.`,
    r`Fifteen minutes is $1/4$ hour, so the parameter is $8/4=2$.`,
    exact('2'),
  ),
  q(
    r`A constant-rate Poisson process has rate eight per hour; observe a fifteen-minute interval. Find the zero-count probability exactly.`,
    r`The count is Poisson with parameter two, giving $P(X=0)=e^{-2}$.`,
    calc('exp(-2)'),
  ),
  q(
    r`A process has rate $0.4$ per minute. Find the parameter for five minutes.`,
    r`Rate times exposure gives $0.4(5)=2$.`,
    exact('2'),
  ),
  q(
    r`A Poisson spatial model has rate $3$ per meter. Find the mean count on a half-meter segment.`,
    r`The mean is $3(1/2)=3/2$.`,
    exact('3/2'),
  ),
  q(
    r`Independent Poisson counts have parameters $2$ and $5$. Find the parameter of their sum.`,
    r`The parameters add under independence, giving $2+5=7$.`,
    exact('7'),
  ),
  q(
    r`Independent Poisson counts have parameters two and five. Consider their sum. Find its variance.`,
    r`The sum is Poisson with parameter seven, so its variance is $7$.`,
    exact('7'),
  ),
  q(
    r`For $X\sim\operatorname{Poisson}(2)$, find $\operatorname{Var}(2X)$.`,
    r`This is scaling one variable, so variance is $4\operatorname{Var}(X)=8$.`,
    exact('8'),
  ),
  q(
    r`Independent Poisson counts in two disjoint intervals have parameters $1$ and $3$. Find the probability both counts are zero.`,
    r`Multiply the zero masses: $e^{-1}e^{-3}=e^{-4}$.`,
    calc('exp(-4)'),
  ),
  q(
    r`Explain why interval counts over the first hour and first two hours of a Poisson process are not independent when the rate is positive.`,
    r`The first-hour count is part of the two-hour count. Independent increments concern disjoint intervals; these intervals overlap and share all first-hour events.`,
  ),
  q(
    r`True or false: knowing a count's average rate is enough to establish a Poisson model.`,
    r`False. Bursts, dependence, or changing rates can produce counts with the same average and different distributions. The Poisson mechanism is an additional model assumption.`,
    truth(false),
    'interpret',
  ),
];
d.review = [
  q(
    r`A constant-rate Poisson process averages $9$ events per hour. Find the mean count over $40$ minutes.`,
    r`Forty minutes is $2/3$ hour, so the mean is $9(2/3)=6$.`,
    exact('6'),
  ),
  q(
    r`Independent Poisson variables have means $1/2$ and $3/2$. Find the probability their sum is zero.`,
    r`The sum has mean two, so its zero probability is $e^{-2}$.`,
    calc('exp(-2)'),
  ),
  q(
    r`Explain why doubling a Poisson variable is not the same distribution as adding two independent copies.`,
    r`Doubling restricts values to even integers and multiplies variance by four. Adding independent copies permits odd counts and only doubles variance; the latter sum is Poisson.`,
  ),
];
const e = section(
  'Approximation and choosing a model',
  r`The binomial-to-Poisson limit explains why Poisson probabilities can approximate rare independent successes. If $X_n\sim\operatorname{Binomial}(n,\lambda/n)$ for fixed $\lambda>0$, then for each fixed nonnegative integer $k$, $P(X_n=k)\to e^{-\lambda}\lambda^k/k!$. In the binomial formula, the factorial ratio divided by $n^k$ tends to one, while $(1-\lambda/n)^n$ tends to $e^{-\lambda}$. These limits combine to give the Poisson mass.

For a finite binomial model with large $n$ and small $p$, use $\lambda=np$ as an approximation parameter. With $n=100,p=0.01$, the exact no-success probability is $0.99^{100}\approx0.3660$, while the Poisson approximation gives $e^{-1}\approx0.3679$. Both are valid calculations for different models; the difference is approximation error. We will state the requested model and precision rather than accepting an approximation as an exact identity.

The approximation is not automatically good for every tail or required precision. If $p$ is large, the Poisson variance $np$ differs substantially from the binomial variance $np(1-p)$. A Poisson distribution also assigns positive probability to counts above $n$, impossible in the exact binomial model. A small numerical probability is not the same as a logical impossibility, so explain which model supports the result.

Choose a model by the experiment: one binary event suggests Bernoulli; a fixed independent equal-rate trial count suggests binomial; trials to first success suggest geometric; a finite uniform sample without replacement suggests hypergeometric; and a specified Poisson event-count mechanism suggests Poisson. The purpose of this comparison is to recognize assumptions, not to force every count into a named family. A custom PMF or a conditional calculation remains appropriate when the mechanism differs.`,
  [special, poisson],
  [
    termEntry(
      'poisson-approximation',
      'Poisson approximation to a binomial count',
      'A rare-success approximation preserving the mean.',
      r`Approximate $\operatorname{Binomial}(n,p)$ by $\operatorname{Poisson}(np)$ when the setting and required accuracy justify it.`,
      r`For $n=100,p=0.01$, no success is approximately $e^{-1}$.`,
      'The approximation is not an exact distributional identity or a universal tail-accuracy guarantee.',
    ),
  ],
);
e.questions = [
  q(
    r`A binomial count has $n=200,p=0.01$. Find the matching Poisson approximation parameter.`,
    r`Match the mean: $np=200(0.01)=2$.`,
    exact('2'),
  ),
  q(
    r`Approximate $\operatorname{Binomial}(200,0.01)$ by the mean-matched Poisson distribution. Find the probability of no success exactly within the approximation model.`,
    r`The approximating zero-count probability is $e^{-2}$.`,
    calc('exp(-2)'),
  ),
  q(
    r`Using a Poisson model of parameter $1$, give $P(X=0)$ to four decimal places.`,
    r`The exact value is $e^{-1}$, which rounds to $0.3679$.`,
    probability('0.36787944117144233'),
  ),
  q(
    r`For $X\sim\operatorname{Binomial}(100,0.01)$, give $P(X=0)$ to four decimal places.`,
    r`The exact binomial probability is $0.99^{100}$, which rounds to $0.3660$.`,
    probability('0.3660323412732292'),
  ),
  q(
    r`For $X\sim\operatorname{Poisson}(2)$, give $P(X\geq1)$ to four decimal places.`,
    r`The exact probability is $1-e^{-2}$, which rounds to $0.8647$.`,
    probability('0.8646647167633873'),
  ),
  q(
    r`A binomial model has $n=20,p=0.5$. Compare its variance with that of the mean-matched Poisson model as an ordered pair.`,
    r`The binomial variance is $20(1/2)(1/2)=5$; the Poisson variance equals mean ten. The pair is $(5,10)$.`,
    tuple(['5', '10']),
  ),
  q(
    r`True or false: a Poisson approximation assigns probability zero to counts above the original binomial trial count.`,
    r`False. A positive-parameter Poisson distribution has unbounded nonnegative integer support, even though those values are impossible under the binomial model.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why a random sample of half a small finite population is poorly described by independent binomial trials.`,
    r`Without replacement creates substantial dependence and a finite-population variance correction far below one. Matching the marginal marked fraction does not recover the correct count distribution.`,
  ),
  q(
    r`Give the exact no-success probability for ten independent attempts with success probability $1/10$.`,
    r`All ten must fail, so the exact probability is $(9/10)^{10}=3486784401/10000000000$.`,
    exact('3486784401/10000000000'),
  ),
  q(
    r`Explain the distinction between approximation error and arithmetic error in comparing $0.99^{100}$ with $e^{-1}$.`,
    r`Each expression is mathematically correct for its own model. Their difference reflects replacing a finite binomial distribution by a Poisson approximation; arithmetic error would be evaluating either expression incorrectly.`,
  ),
];
e.review = [
  q(
    r`A binomial count has $n=500,p=0.002$. Find its mean-matched Poisson parameter.`,
    r`The parameter is $500(0.002)=1$.`,
    exact('1'),
  ),
  q(
    r`For a Poisson approximation with parameter $3$, give the probability of at least one event to four decimal places.`,
    r`The probability is $1-e^{-3}\approx0.9502$.`,
    probability('0.950212931632136'),
  ),
  q(
    r`Explain why a count variable's integer support alone cannot distinguish binomial, hypergeometric, and Poisson models.`,
    r`All produce integer counts, but their trial or sampling mechanisms, parameter restrictions, finite versus infinite supports, and dependence assumptions differ. The experiment supplies the needed distinction.`,
  ),
];
b.body += r`

The degenerate population cases deserve explicit treatment. If $N=K=n=0$, the only sample is empty and $X=0$ with certainty; formulas dividing by $N$ are not used. For a nonempty population with $K=0$, every permissible sample has count zero. With $K=N$, the count is always $n$. These boundary checks agree with the interpretation of the variance: no uncertainty remains when every object has the same category. They also clarify why parameter validity should be checked before evaluating factorial or ratio expressions.`;
c.body += r`

The Poisson second-moment calculation follows the same ordered-pair idea as the finite-population derivation, but here it is evaluated from the PMF. Multiplying by $k(k-1)$ cancels the final two factors in $k!$, so $E[X(X-1)]=e^{-\lambda}\lambda^2\sum_{j=0}^{\infty}\lambda^j/j!=\lambda^2$. The cancellation begins at $k=2$; the zero and one terms already contribute zero. Adding the mean accounts for the missing diagonal contribution in $X^2$. This supplies a check on the variance formula without relying on an empirical mean-variance comparison.`;
d.body += r`

A stationary interval model says equal-length intervals have the same count distribution; independence of disjoint intervals is an additional property. Equal distributions alone do not guarantee independent counts. A shared daily condition could raise or lower all interval counts together while preserving the same marginal law across equally positioned days. We explicitly include independent increments when using products across intervals.`;
export default lesson(
  8,
  'hypergeometric-poisson',
  'Hypergeometric and Poisson Models',
  r`Two further count models broaden the range of experiments we can describe. Hypergeometric sampling keeps track of a finite population whose composition changes as objects are removed. Poisson models describe interval counts with a specified mean and connect to rare-success binomial approximations. We will derive their probabilities, compare their spread, convert rates into interval parameters, and keep exact model calculations separate from approximations.`,
  [a, b, c, d, e],
);
