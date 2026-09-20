# Concentration and Monte Carlo Estimation

A full distribution can provide an exact probability, but a mean or variance can already provide a useful guarantee. We connect such guarantees to sample averages, reproducible simulation calculations, and the failure events of randomized algorithms.

## A mean can bound a nonnegative tail

A distribution need not be known completely before we can make a useful probability statement. Suppose a randomized computation uses a nonnegative amount of work $X$ and its mean is $E[X]=m<\infty$. For a threshold $a>0$, every outcome with $X\ge a$ contributes at least $a$ units. The pointwise inequality $X\ge a\,1_{\{X\ge a\}}$ therefore gives $m\ge aP(X\ge a)$. This is **Markov's inequality**: $P(X\ge a)\le m/a$. Combine it with the probability bound one when $m/a>1$.

If a search uses an average of 12 probes, the probability of at least 60 probes is at most $12/60=1/5$. The conclusion is an upper bound, not an exact tail probability or a limit on every run. The constant random variable $X=12$ has tail probability zero at 60. Another variable takes 60 with probability $1/5$ and zero otherwise; it has the same mean and attains the bound. These examples explain both the guarantee and its limited precision.

Nonnegativity does real work. A variable taking 10 and $-10$ equally often has mean zero, but a positive upper tail. Applying Markov directly to that signed variable would be invalid. Sometimes an appropriate transformation, such as absolute value or a square, restores nonnegativity; its expectation must then be known. Also keep the threshold strictly positive. Dividing by a zero or negative threshold is not the stated theorem.

A bound larger than one is valid but uninformative. It does not mean a probability can exceed one. Distinguish an assumption that the work is always bounded from the weaker knowledge of its average.

Related definitions: [Markov inequality](ref:probability-statistics-markov-bound).

## Centering and squaring gives Chebyshev

Markov's inequality becomes a statement about deviations when applied to $(X-\mu)^2$. Here $\mu=E[X]$ and $\sigma^2=\operatorname{Var}(X)<\infty$. The transformed variable is nonnegative, its mean is the variance, and $|X-\mu|\ge b$ is equivalent to $(X-\mu)^2\ge b^2$. Thus **Chebyshev's inequality** gives $P(|X-\mu|\ge b)\le\sigma^2/b^2$ for $b>0$.

For a measurement with mean 20 and variance 9, the probability of differing from 20 by at least 6 is at most $9/36=1/4$. Equivalently, $P(|X-20|<6)\ge3/4$. Notice the strict inequality in the complementary event: the complement of “at least 6” is “less than 6.” For continuous models equality points have zero probability, but a discrete model can put mass exactly on the endpoints.

Writing $b=k\sigma$ when $\sigma>0$ gives the familiar bound $1/k^2$. No normal shape is assumed. A normal approximation can be sharper when justified, while Chebyshev remains valid for highly irregular finite-variance distributions. It can also bound a one-sided event by containing it in the two-sided deviation event, though the result may be loose.

If the variance is zero, $X$ equals its mean with probability one, so every positive deviation threshold has probability zero. If variance is infinite or unspecified, do not insert a guessed variance into the theorem. Changing measurement units changes both variance and squared threshold by the same factor, leaving the probability bound unchanged.

Related definitions: [Chebyshev inequality](ref:probability-statistics-chebyshev-bound).

## Guarantees for averages and sample sizes

For independent identically distributed observations with variance $\sigma^2$, the average $\bar X$ has variance $\sigma^2/n$. Applying Chebyshev to the average gives $P(|\bar X-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$. This is a finite-sample guarantee. It also explains the finite-variance weak law of large numbers: for a fixed positive tolerance, the bound tends to zero as $n$ grows.

To make the failure probability at most $\delta$, with $0<\delta<1$, it is sufficient to choose $n\ge\sigma^2/(\delta\varepsilon^2)$. Round a required sample size upward. For variance 4, tolerance $1/2$, and failure probability $1/20$, the sufficient size is $4/[(1/20)(1/4)]=320$. This is sufficient under the assumptions; it need not be the smallest size that the actual distribution permits.

Halving the error tolerance multiplies this bound on required size by four. Halving the allowed failure probability multiplies it by two. These are different design choices. More observations reduce sampling variation only if their dependence is controlled. If every observation is a duplicate of the same random value, averaging does not divide its variance by $n$.

For independent Bernoulli indicators, $\operatorname{Var}(X_i)=p(1-p)\le1/4$, even when $p$ is unknown. Consequently $n\ge1/(4\delta\varepsilon^2)$ is a distribution-free sufficient size within that Bernoulli model. It may be much larger than a normal-approximation recommendation. A rigorous bound and an approximation answer different questions; neither repairs a biased sampling mechanism.

Related definitions: [Concentration guarantee](ref:probability-statistics-concentration-guarantee).

## Monte Carlo turns an expectation into an estimate

A **Monte Carlo estimate** approximates an expectation with an average of independently simulated values. For $I=E[g(U)]$, draw inputs $U_1,\ldots,U_n$ from the specified distribution and compute $\hat I=n^{-1}\sum_i g(U_i)$. The randomness is deliberately used to evaluate the quantity. If $g(U)$ has finite variance, the average is unbiased and its variance is $\operatorname{Var}(g(U))/n$.

An integral fits this form. For $U$ uniform on $[a,b]$, $\int_a^b g(u)\,du=(b-a)E[g(U)]$. Multiply the simulated average by the interval length. To approximate $\int_0^2u\,du$, suppose the supplied sampled inputs are $0.2,0.6,1.4,1.8$. Their average is 1, so this particular estimate is 2, which happens to equal the exact integral. Another sample generally produces a different estimate. Exact integration remains an independent way to check this example.

To estimate an event probability, average its zero-one indicator. If 37 of 100 independently simulated trials satisfy an event, the estimate is $37/100$. The estimated standard error is $\sqrt{\hat p(1-\hat p)/n}$, whereas a conservative variance bound uses $1/(4n)$. The plug-in standard error describes estimated variability; it is not a finite-sample error guarantee.

A fixed list of supplied draws makes a practice calculation reproducible. It is not evidence that one deterministic list represents every random run. Generating more draws from the wrong model improves the precision of the wrong expectation. Likewise, a seed supports reproducibility but does not establish independence or eliminate Monte Carlo error.

Related definitions: [Monte Carlo estimate](ref:probability-statistics-monte-carlo-estimate).

## From individual failures to algorithm guarantees

An algorithm may have several opportunities to fail. Let $A_i$ be the event that check $i$ fails, and let $N=\sum_i1_{A_i}$ count failures. Then $E[N]=\sum_iP(A_i)$, even without independence. Markov at threshold one gives the **union bound** $P(\bigcup_iA_i)\le\sum_iP(A_i)$. This connects elementary event rules with expectation and concentration.

If eight checks each fail with probability at most $1/200$, the chance of any failure is at most $8/200=1/25$. Overlap makes the bound potentially loose. Independence is unnecessary for that guarantee. If independent runs of a randomized procedure each fail with probability $q$, the probability that all $k$ runs fail is $q^k$; this different calculation does require the stated independence and the meaning of “all fail.”

Repeated runs do not automatically improve every algorithm. There must be a valid rule for recognizing or combining outputs. If success can be independently verified, returning the first verified output has a clear failure event. If errors are undetectable, choosing an arbitrary run does not obtain the all-fail guarantee. Majority voting needs its own assumptions and analysis.

Choose the random quantity and event before choosing an inequality. Expected work suggests Markov; a centered error with known variance suggests Chebyshev; several bad events suggest a union bound. Report the bound together with the assumptions that make it valid. A correct numerical bound on an incorrectly modeled event is not a useful guarantee.

Related definitions: [Union failure bound](ref:probability-statistics-union-failure-bound).
