# Hypergeometric and Poisson Models

Two further count models broaden the range of experiments we can describe. Hypergeometric sampling keeps track of a finite population whose composition changes as objects are removed. Poisson models describe interval counts with a specified mean and connect to rare-success binomial approximations. We will derive their probabilities, compare their spread, convert rates into interval parameters, and keep exact model calculations separate from approximations.

## Hypergeometric counts sample without replacement

A hypergeometric variable counts marked objects in a uniform sample without replacement. Let the population contain $N$ distinct objects, of which $K$ are marked, and let the sample size be $n$. We write $X\sim\operatorname{Hypergeometric}(N,K,n)$, using population size, marked count, and sample size in that order. The parameters are integers with $0\leq K\leq N$ and $0\leq n\leq N$. Sources may instead use separate marked and unmarked counts; translate their notation before substituting.

To obtain $X=k$, choose $k$ of the $K$ marked objects and $n-k$ of the $N-K$ unmarked objects. Divide by all equally likely size-$n$ subsets: $P(X=k)=\binom Kk\binom{N-K}{n-k}/\binom Nn$. The feasible integers satisfy $\max(0,n-(N-K))\leq k\leq\min(n,K)$. The lower bound matters when the sample is too large to consist entirely of unmarked objects.

For a population of nine objects with four marked, sample three. Exactly two marked has probability $\binom42\binom51/\binom93=30/84=5/14$. No marked objects has probability $\binom53/\binom93=10/84=5/42$, so at least one has probability $37/42$. These are the same subset-counting arguments used earlier, now organized as a distribution family.

The draw indicators are generally dependent. After a marked object is removed, the marked fraction among remaining objects falls. The count is therefore not binomial merely because each draw can be labeled success or failure. The finite population and sampling mechanism determine the distribution. A sample of the entire population has exactly $K$ marked objects, leaving no uncertainty at all.

Related definitions: [Hypergeometric distribution](ref:probability-statistics-hypergeometric-distribution).

## Finite populations reduce count variance

Each position in a uniform without-replacement sample has marked probability $K/N$ when $N>0$. Writing $X$ as the sum of its $n$ marked indicators and using linearity gives $E[X]=nK/N$. Independence is unnecessary for this mean. The same expected marked count appears in a binomial model with parameter $p=K/N$, but the variances differ.

For $N>1$, the hypergeometric variance is $np(1-p)(N-n)/(N-1)$. The final factor is the finite-population correction. It equals one for a single draw, is less than one for a larger proper sample, and becomes zero when the entire population is sampled. It quantifies the way a fixed population composition limits variability in a large sample. When $N=1$, every permissible count is deterministic and variance is zero; do not substitute into a zero denominator.

We can derive the correction without a new covariance formula. The product $X(X-1)$ counts ordered pairs of distinct sampled positions that are both marked. There are $n(n-1)$ such position pairs, and each is marked with probability $K(K-1)/[N(N-1)]$. Thus $E[X(X-1)]=n(n-1)K(K-1)/[N(N-1)]$. Use $X^2=X(X-1)+X$, add the mean, and subtract the squared mean to obtain the stated variance.

For $N=10,K=4,n=3$, the mean is $6/5$ and the variance is $3(2/5)(3/5)(7/9)=14/25$. A binomial count with the same mean would have variance $18/25$. When the sample is a small fraction of a large population, the correction is near one and a binomial approximation may be useful. Its adequacy depends on the event and required accuracy; proximity of means alone cannot establish it.

The degenerate population cases deserve explicit treatment. If $N=K=n=0$, the only sample is empty and $X=0$ with certainty; formulas dividing by $N$ are not used. For a nonempty population with $K=0$, every permissible sample has count zero. With $K=N$, the count is always $n$. These boundary checks agree with the interpretation of the variance: no uncertainty remains when every object has the same category. They also clarify why parameter validity should be checked before evaluating factorial or ratio expressions.

Related definitions: [Finite-population correction](ref:probability-statistics-finite-population-correction).

## Poisson counts have an interval-specific mean

A Poisson variable models a nonnegative integer count with parameter $\lambda>0$: $P(X=k)=e^{-\lambda}\lambda^k/k!$ for $k=0,1,2,\ldots$. We write $X\sim\operatorname{Poisson}(\lambda)$. Its parameter is the expected count in the specified interval or region, not automatically a rate per unit. The limiting case $\lambda=0$ is the constant-zero distribution, handled directly rather than through ambiguous powers.

The exponential series proves normalization: $\sum_{k\geq0}e^{-\lambda}\lambda^k/k!=e^{-\lambda}e^\lambda=1$. Unlike a binomial variable, a positive-parameter Poisson variable has no finite upper bound. Large counts may be extremely unlikely but retain positive mass. The parameter need not be an integer; a mean of $1.5$ events is fully compatible with integer-valued observations.

For $\lambda=2$, the first three masses are $e^{-2}$, $2e^{-2}$, and $2e^{-2}$. Thus no events has probability about $0.1353$, while at most two has probability $5e^{-2}\approx0.6767$. At least three uses the complement $1-5e^{-2}$. The recurrence $p(k+1)=\lambda p(k)/(k+1)$ can compute successive masses efficiently and gives a simple ratio check on arithmetic.

The mean and variance both equal $\lambda$. To check variance, summing the factorial moment gives $E[X(X-1)]=\lambda^2$, so $E[X^2]=\lambda^2+\lambda$ and subtraction leaves $\lambda$. Standard deviation is $\sqrt\lambda$. Equality of mean and variance is a property of the Poisson model, not a fact about every observed count dataset. Data with the same mean can have very different dispersion, so a mean alone is insufficient justification for choosing this distribution.

The Poisson second-moment calculation follows the same ordered-pair idea as the finite-population derivation, but here it is evaluated from the PMF. Multiplying by $k(k-1)$ cancels the final two factors in $k!$, so $E[X(X-1)]=e^{-\lambda}\lambda^2\sum_{j=0}^{\infty}\lambda^j/j!=\lambda^2$. The cancellation begins at $k=2$; the zero and one terms already contribute zero. Adding the mean accounts for the missing diagonal contribution in $X^2$. This supplies a check on the variance formula without relying on an empirical mean-variance comparison.

Related definitions: [Poisson distribution](ref:probability-statistics-poisson-distribution).

## Rates, exposure, and independent counts

A rate describes expected events per unit of exposure. In a constant-rate Poisson process with rate $r$ per unit time, the count in an interval of length $t$ is Poisson with mean $\lambda=rt$. Counts in disjoint intervals are independent under this process model. These are substantive assumptions about the generating mechanism; an average rate alone does not imply them. We use only this elementary interval-count consequence here, not a full course on stochastic processes.

Suppose arrivals follow that model at rate six per hour. A twenty-minute interval is one third of an hour, so its mean count is two. The chance of no arrivals is $e^{-2}$, not $e^{-6}$. Over ninety minutes the mean becomes nine. Units provide the check: arrivals per hour multiplied by hours gives expected arrivals. The same reasoning applies to a stated constant rate per length, area, or another exposure measure.

Independent Poisson counts add to a Poisson count whose parameter is the sum. If $X\sim\operatorname{Poisson}(a)$ and $Y\sim\operatorname{Poisson}(b)$ are independent, then $X+Y\sim\operatorname{Poisson}(a+b)$. One derivation sums the disjoint possibilities $X=j,Y=k-j$: the resulting binomial expansion gives $e^{-(a+b)}(a+b)^k/k!$. This also explains adding independent arrival streams over one common interval.

Overlapping intervals do not provide independent counts just because the overall process has independent increments. They share events. Likewise, $2X$ is not the sum of two independent copies of $X$; it is an even-valued transformed variable with variance $4\lambda$. Explicitly distinguish independent sources or disjoint increments from repeatedly using the same count. That distinction determines which addition formula is valid.

A stationary interval model says equal-length intervals have the same count distribution; independence of disjoint intervals is an additional property. Equal distributions alone do not guarantee independent counts. A shared daily condition could raise or lower all interval counts together while preserving the same marginal law across equally positioned days. We explicitly include independent increments when using products across intervals.

Related definitions: [Poisson exposure parameter](ref:probability-statistics-poisson-exposure).

## Approximation and choosing a model

The binomial-to-Poisson limit explains why Poisson probabilities can approximate rare independent successes. If $X_n\sim\operatorname{Binomial}(n,\lambda/n)$ for fixed $\lambda>0$, then for each fixed nonnegative integer $k$, $P(X_n=k)\to e^{-\lambda}\lambda^k/k!$. In the binomial formula, the factorial ratio divided by $n^k$ tends to one, while $(1-\lambda/n)^n$ tends to $e^{-\lambda}$. These limits combine to give the Poisson mass.

For a finite binomial model with large $n$ and small $p$, use $\lambda=np$ as an approximation parameter. With $n=100,p=0.01$, the exact no-success probability is $0.99^{100}\approx0.3660$, while the Poisson approximation gives $e^{-1}\approx0.3679$. Both are valid calculations for different models; the difference is approximation error. We will state the requested model and precision rather than accepting an approximation as an exact identity.

The approximation is not automatically good for every tail or required precision. If $p$ is large, the Poisson variance $np$ differs substantially from the binomial variance $np(1-p)$. A Poisson distribution also assigns positive probability to counts above $n$, impossible in the exact binomial model. A small numerical probability is not the same as a logical impossibility, so explain which model supports the result.

Choose a model by the experiment: one binary event suggests Bernoulli; a fixed independent equal-rate trial count suggests binomial; trials to first success suggest geometric; a finite uniform sample without replacement suggests hypergeometric; and a specified Poisson event-count mechanism suggests Poisson. The purpose of this comparison is to recognize assumptions, not to force every count into a named family. A custom PMF or a conditional calculation remains appropriate when the mechanism differs.

Related definitions: [Poisson approximation to a binomial count](ref:probability-statistics-poisson-approximation).
