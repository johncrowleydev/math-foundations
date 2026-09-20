import { r, lesson, section, termEntry, q, exact, tuple, truth, quick, frac } from './helpers.mjs';
import { concentration, estimators } from './inference-sources.mjs';
const sections = [
  section(
    'A mean can bound a nonnegative tail',
    r`A distribution need not be known completely before we can make a useful probability statement. Suppose a randomized computation uses a nonnegative amount of work $X$ and its mean is $E[X]=m<\infty$. For a threshold $a>0$, every outcome with $X\ge a$ contributes at least $a$ units. The pointwise inequality $X\ge a\,1_{\{X\ge a\}}$ therefore gives $m\ge aP(X\ge a)$. This is **Markov's inequality**: $P(X\ge a)\le m/a$. Combine it with the probability bound one when $m/a>1$.

If a search uses an average of 12 probes, the probability of at least 60 probes is at most $12/60=1/5$. The conclusion is an upper bound, not an exact tail probability or a limit on every run. The constant random variable $X=12$ has tail probability zero at 60. Another variable takes 60 with probability $1/5$ and zero otherwise; it has the same mean and attains the bound. These examples explain both the guarantee and its limited precision.

Nonnegativity does real work. A variable taking 10 and $-10$ equally often has mean zero, but a positive upper tail. Applying Markov directly to that signed variable would be invalid. Sometimes an appropriate transformation, such as absolute value or a square, restores nonnegativity; its expectation must then be known. Also keep the threshold strictly positive. Dividing by a zero or negative threshold is not the stated theorem.

A bound larger than one is valid but uninformative. It does not mean a probability can exceed one. Distinguish an assumption that the work is always bounded from the weaker knowledge of its average.`,
    [concentration],
    [
      termEntry(
        'markov-bound',
        'Markov inequality',
        'A mean controls a nonnegative upper tail.',
        r`For $X\ge0$ and $a>0$, $P(X\ge a)\le E[X]/a$.`,
        r`Mean 12 gives $P(X\ge60)\le1/5$.`,
        'An upper bound is not the actual probability.',
      ),
    ],
  ),
  section(
    'Centering and squaring gives Chebyshev',
    r`Markov's inequality becomes a statement about deviations when applied to $(X-\mu)^2$. Here $\mu=E[X]$ and $\sigma^2=\operatorname{Var}(X)<\infty$. The transformed variable is nonnegative, its mean is the variance, and $|X-\mu|\ge b$ is equivalent to $(X-\mu)^2\ge b^2$. Thus **Chebyshev's inequality** gives $P(|X-\mu|\ge b)\le\sigma^2/b^2$ for $b>0$.

For a measurement with mean 20 and variance 9, the probability of differing from 20 by at least 6 is at most $9/36=1/4$. Equivalently, $P(|X-20|<6)\ge3/4$. Notice the strict inequality in the complementary event: the complement of “at least 6” is “less than 6.” For continuous models equality points have zero probability, but a discrete model can put mass exactly on the endpoints.

Writing $b=k\sigma$ when $\sigma>0$ gives the familiar bound $1/k^2$. No normal shape is assumed. A normal approximation can be sharper when justified, while Chebyshev remains valid for highly irregular finite-variance distributions. It can also bound a one-sided event by containing it in the two-sided deviation event, though the result may be loose.

If the variance is zero, $X$ equals its mean with probability one, so every positive deviation threshold has probability zero. If variance is infinite or unspecified, do not insert a guessed variance into the theorem. Changing measurement units changes both variance and squared threshold by the same factor, leaving the probability bound unchanged.`,
    [concentration],
    [
      termEntry(
        'chebyshev-bound',
        'Chebyshev inequality',
        'Variance bounds the chance of a large deviation.',
        r`For finite variance and $b>0$, $P(|X-\mu|\ge b)\le\sigma^2/b^2$.`,
        r`Variance 9 gives a bound of $1/4$ at distance 6.`,
        'Normality is not required, but finite variance is.',
      ),
    ],
  ),
  section(
    'Guarantees for averages and sample sizes',
    r`For independent identically distributed observations with variance $\sigma^2$, the average $\bar X$ has variance $\sigma^2/n$. Applying Chebyshev to the average gives $P(|\bar X-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$. This is a finite-sample guarantee. It also explains the finite-variance weak law of large numbers: for a fixed positive tolerance, the bound tends to zero as $n$ grows.

To make the failure probability at most $\delta$, with $0<\delta<1$, it is sufficient to choose $n\ge\sigma^2/(\delta\varepsilon^2)$. Round a required sample size upward. For variance 4, tolerance $1/2$, and failure probability $1/20$, the sufficient size is $4/[(1/20)(1/4)]=320$. This is sufficient under the assumptions; it need not be the smallest size that the actual distribution permits.

Halving the error tolerance multiplies this bound on required size by four. Halving the allowed failure probability multiplies it by two. These are different design choices. More observations reduce sampling variation only if their dependence is controlled. If every observation is a duplicate of the same random value, averaging does not divide its variance by $n$.

For independent Bernoulli indicators, $\operatorname{Var}(X_i)=p(1-p)\le1/4$, even when $p$ is unknown. Consequently $n\ge1/(4\delta\varepsilon^2)$ is a distribution-free sufficient size within that Bernoulli model. It may be much larger than a normal-approximation recommendation. A rigorous bound and an approximation answer different questions; neither repairs a biased sampling mechanism.`,
    [concentration, estimators],
    [
      termEntry(
        'concentration-guarantee',
        'Concentration guarantee',
        'A bound on the probability of estimation error.',
        r`Under independence, common mean $\mu$, and common finite variance $\sigma^2$, $P(|\bar X-\mu|\ge\varepsilon)\le\sigma^2/(n\varepsilon^2)$.`,
        r`With $\sigma^2=4$, $\varepsilon=1/2$, $\delta=1/20$, $n=320$ suffices.`,
        'A sufficient sample size need not be necessary.',
      ),
    ],
  ),
  section(
    'Monte Carlo turns an expectation into an estimate',
    r`A **Monte Carlo estimate** approximates an expectation with an average of independently simulated values. For $I=E[g(U)]$, draw inputs $U_1,\ldots,U_n$ from the specified distribution and compute $\hat I=n^{-1}\sum_i g(U_i)$. The randomness is deliberately used to evaluate the quantity. If $g(U)$ has finite variance, the average is unbiased and its variance is $\operatorname{Var}(g(U))/n$.

An integral fits this form. For $U$ uniform on $[a,b]$, $\int_a^b g(u)\,du=(b-a)E[g(U)]$. Multiply the simulated average by the interval length. To approximate $\int_0^2u\,du$, suppose the supplied sampled inputs are $0.2,0.6,1.4,1.8$. Their average is 1, so this particular estimate is 2, which happens to equal the exact integral. Another sample generally produces a different estimate. Exact integration remains an independent way to check this example.

To estimate an event probability, average its zero-one indicator. If 37 of 100 independently simulated trials satisfy an event, the estimate is $37/100$. The estimated standard error is $\sqrt{\hat p(1-\hat p)/n}$, whereas a conservative variance bound uses $1/(4n)$. The plug-in standard error describes estimated variability; it is not a finite-sample error guarantee.

A fixed list of supplied draws makes a practice calculation reproducible. It is not evidence that one deterministic list represents every random run. Generating more draws from the wrong model improves the precision of the wrong expectation. Likewise, a seed supports reproducibility but does not establish independence or eliminate Monte Carlo error.`,
    [estimators, concentration],
    [
      termEntry(
        'monte-carlo-estimate',
        'Monte Carlo estimate',
        'An expectation approximated by a simulated sample average.',
        r`For independent draws, $\hat I=n^{-1}\sum_i g(U_i)$ estimates $E[g(U)]$.`,
        r`37 successes in 100 simulated trials give $\hat p=0.37$.`,
        'Simulation error and model error are different.',
      ),
    ],
  ),
  section(
    'From individual failures to algorithm guarantees',
    r`An algorithm may have several opportunities to fail. Let $A_i$ be the event that check $i$ fails, and let $N=\sum_i1_{A_i}$ count failures. Then $E[N]=\sum_iP(A_i)$, even without independence. Markov at threshold one gives the **union bound** $P(\bigcup_iA_i)\le\sum_iP(A_i)$. This connects elementary event rules with expectation and concentration.

If eight checks each fail with probability at most $1/200$, the chance of any failure is at most $8/200=1/25$. Overlap makes the bound potentially loose. Independence is unnecessary for that guarantee. If independent runs of a randomized procedure each fail with probability $q$, the probability that all $k$ runs fail is $q^k$; this different calculation does require the stated independence and the meaning of “all fail.”

Repeated runs do not automatically improve every algorithm. There must be a valid rule for recognizing or combining outputs. If success can be independently verified, returning the first verified output has a clear failure event. If errors are undetectable, choosing an arbitrary run does not obtain the all-fail guarantee. Majority voting needs its own assumptions and analysis.

Choose the random quantity and event before choosing an inequality. Expected work suggests Markov; a centered error with known variance suggests Chebyshev; several bad events suggest a union bound. Report the bound together with the assumptions that make it valid. A correct numerical bound on an incorrectly modeled event is not a useful guarantee.`,
    [concentration],
    [
      termEntry(
        'union-failure-bound',
        'Union failure bound',
        'The probability of any failure is at most the sum of individual probabilities.',
        r`$P(\bigcup_iA_i)\le\sum_iP(A_i)$ without independence.`,
        r`Eight failure bounds of $1/200$ give $1/25$.`,
        'Multiplying failure probabilities requires a different event and suitable independence.',
      ),
    ],
  ),
];
for (const [mean, threshold] of [
  [3, 12],
  [8, 40],
  [5, 20],
  [7, 21],
  [10, 8],
]) {
  const bound = Math.min(1, mean / threshold),
    val = mean >= threshold ? '1' : frac(mean, threshold);
  sections[0].questions.push(
    q(
      r`A nonnegative work count has mean ${mean}. Give the Markov probability bound for at least ${threshold} units, capped at one.`,
      r`Markov gives $${mean}/${threshold}$. Combining this with $P\le1$ gives the bound $${val}$.`,
      exact(val),
    ),
    q(
      r`A nonnegative variable has mean ${mean}. What threshold makes the Markov bound equal to $1/4$?`,
      r`Solve $${mean}/a=1/4$: $a=${4 * mean}$.`,
      exact(4 * mean),
    ),
  );
}
sections[0].questions.push(
  q(
    'Construct a nonnegative variable of mean 2 attaining the Markov bound at threshold 10.',
    'Let X be 10 with probability 1/5 and zero with probability 4/5. Its mean is 2 and its tail probability at 10 is 1/5.',
    undefined,
    'construct',
  ),
  q(
    'Explain why a signed variable with mean zero need not have zero probability of exceeding 1.',
    'Positive and negative contributions can cancel in the mean. Equal probabilities at 2 and −2 give mean zero and upper-tail probability one half.',
  ),
);
for (const [v, b] of [
  [4, 4],
  [9, 6],
  [16, 8],
  [1, 5],
  [25, 15],
]) {
  const val = frac(v, b * b);
  sections[1].questions.push(
    q(
      r`A variable has variance ${v}. Give Chebyshev's bound for $P(|X-E[X]|\ge${b})$.`,
      r`The bound is variance divided by squared distance: $${v}/${b * b}=${val}$.`,
      exact(val),
    ),
    q(
      r`For variance ${v}, what lower bound follows by taking the complement of the Chebyshev bound for $P(|X-E[X]|<${b})$?`,
      r`Take the complement of the at-least event: $1-${val}=${frac(b * b - v, b * b)}$.`,
      exact(frac(b * b - v, b * b)),
    ),
  );
}
sections[1].questions.push(
  q(
    'Does Chebyshev require a normal distribution? Explain.',
    'No. Apply Markov to the nonnegative squared centered deviation. Only the stated finite variance is used.',
  ),
  q(
    'Why does changing distance units not change the Chebyshev bound?',
    'Both variance and squared threshold multiply by the square of the conversion factor, so their ratio is unchanged.',
  ),
);
for (const [v, eps, delta] of [
  [1, 0.5, 0.1],
  [4, 0.5, 0.05],
  [9, 1, 0.1],
  [2, 0.2, 0.05],
  [1, 0.1, 0.01],
]) {
  const n = Math.ceil(v / (delta * eps * eps) - 1e-9);
  sections[2].questions.push(
    q(
      r`Independent identically distributed observations have variance ${v}. Using Chebyshev, give the smallest integer sample size certified by this bound for error at least ${eps} to have probability at most ${delta}.`,
      r`Require $n\ge ${v}/(${delta}\cdot${eps}^2)$ and round upward, giving $n=${n}$.`,
      exact(n),
    ),
    q(
      r`For ${n} iid observations of variance ${v}, give the variance of their average as an exact value.`,
      r`Independence gives variance $\sigma^2/n=${v}/${n}=${frac(v, n)}$.`,
      exact(frac(v, n)),
    ),
  );
}
sections[2].questions.push(
  q(
    'Explain the failure of the usual average-variance formula when every observation is the same random draw.',
    'The average equals that single draw, so its variance is unchanged. The covariance terms do not vanish.',
  ),
  q(
    'Is a Chebyshev sufficient sample size necessarily the smallest possible sample size?',
    'No. Chebyshev may be loose; additional distribution information can justify a smaller size.',
  ),
);
for (const [hits, n, width] of [
  [7, 20, 2],
  [18, 40, 3],
  [13, 25, 4],
  [9, 16, 1],
  [30, 50, 5],
]) {
  sections[3].questions.push(
    q(
      r`In ${n} independent simulated trials, an event occurs ${hits} times. Give the Monte Carlo probability estimate.`,
      r`The indicator average is $${hits}/${n}=${frac(hits, n)}$.`,
      exact(frac(hits, n)),
    ),
    q(
      r`For uniform draws on an interval of length ${width}, the supplied values of $g$ average ${hits}/${n}. Give the Monte Carlo integral estimate.`,
      r`Multiply the average by interval length: $${width}\cdot${hits}/${n}=${frac(width * hits, n)}$.`,
      exact(frac(width * hits, n)),
    ),
  );
}
sections[3].questions.push(
  q(
    'Why does simulation from the wrong input distribution not solve the intended integral merely by using more draws?',
    'The average approaches an expectation under the simulated distribution. That can differ systematically from the required expectation.',
  ),
  q(
    'A simulation estimate exactly matches a known answer once. Does that establish zero Monte Carlo variance?',
    'No. A single realized estimate can agree by chance even though different random samples yield different estimates.',
  ),
);
for (const [k, d] of [
  [4, 100],
  [7, 200],
  [12, 300],
  [5, 80],
  [9, 90],
]) {
  sections[4].questions.push(
    q(
      r`${k} bad events each have probability at most $1/${d}$. Give the union bound for at least one bad event.`,
      r`Add the individual bounds: $${k}/${d}=${frac(k, d)}$. Independence is not needed.`,
      exact(frac(k, d)),
    ),
    q(
      r`A verifiable randomized procedure fails with probability $1/2$ on each of ${k} independent runs. Give the probability that all runs fail.`,
      r`Multiply independent failure probabilities: $(1/2)^{${k}}=1/${2 ** k}$.`,
      exact(`1/${2 ** k}`),
    ),
  );
}
sections[4].questions.push(
  q(
    'Explain why majority voting is not justified just by an all-runs-fail probability.',
    'Majority voting can fail even when some runs succeed. Its bad event is different, so it needs a separate analysis.',
  ),
  q(
    'Give a dependence pattern where two failures each of probability 1/10 have joint probability 1/10 rather than 1/100.',
    'Let the two failure events be identical. Then their intersection is the same event with probability 1/10.',
    undefined,
    'construct',
  ),
);
sections[0].quickCheck = quick(
  'Which hypothesis is essential for applying Markov directly to X?',
  ['X is nonnegative', 'X is normally distributed', 'X has mean zero'],
  0,
  'The bound uses the pointwise comparison with a nonnegative tail indicator.',
  [
    'Correct. Nonnegativity ensures outcomes below the threshold cannot subtract from the mean.',
    'Normality is unnecessary and normal variables can take negative values.',
    'A mean of zero does not rule out a positive tail for a signed variable.',
  ],
);
sections[2].quickCheck = quick(
  'Halving the allowed error tolerance changes the Chebyshev sample-size bound by what factor?',
  ['2', '4', '1/2'],
  1,
  'The bound is proportional to the reciprocal of squared tolerance.',
  [
    'A factor of two would apply to halving the allowed failure probability.',
    'Correct. Squaring half the tolerance gives one quarter in the denominator.',
    'A smaller error tolerance requires more observations under this bound.',
  ],
);
sections[0].review = [
  q(
    'A nonnegative variable has mean 6. Give the Markov bound for its probability of being at least 30.',
    r`Markov gives $6/30=1/5$.`,
    exact('1/5'),
  ),
  q(
    'A nonnegative variable has mean 9. Give the Markov bound for its probability of being at least 45.',
    r`Markov gives $9/45=1/5$.`,
    exact('1/5'),
  ),
  q('What inequality bounds a nonnegative tail using only its mean?', 'Markov inequality.', {
    validator: 'term',
    params: {
      accepted: ['Markov', 'Markov inequality', 'Markov’s inequality', "Markov's inequality"],
    },
    correct: 'Markov',
    incorrect: 'Chebyshev',
  }),
];
sections[1].review = [
  q(
    'Variance is 8. Give the Chebyshev bound for the probability of absolute deviation from the mean at least 4.',
    r`Chebyshev gives $8/16=1/2$.`,
    exact('1/2'),
  ),
  q(
    'Variance is 3. Give the Chebyshev bound for the probability of absolute deviation from the mean at least 6.',
    r`Chebyshev gives $3/36=1/12$.`,
    exact('1/12'),
  ),
  q(
    'Explain why a Chebyshev guarantee does not need a bell-shaped density.',
    'It follows by applying Markov to a squared deviation and uses no density-shape assumption.',
  ),
];
sections[2].review = [
  q(
    'For iid observations of variance 2, what is the smallest integer n certified by Chebyshev for tolerance 1/2 and failure probability 1/10?',
    r`$n\ge2/[(1/10)(1/4)]=80$.`,
    exact(80),
  ),
  q(
    'For iid observations of variance 3, what is the smallest integer n certified by Chebyshev for tolerance 1 and failure probability 1/20?',
    r`$n\ge3/(1/20)=60$.`,
    exact(60),
  ),
  q(
    'What is the smallest upper bound valid for the variance of every Bernoulli variable when its parameter is unknown?',
    r`$p(1-p)\le1/4$.`,
    exact('1/4'),
  ),
];
sections[3].review = [
  q(
    'Twenty-one of thirty simulated draws satisfy an event. Give its estimated probability.',
    r`$21/30=7/10$.`,
    exact('7/10'),
  ),
  q(
    'The mean simulated integrand value is 3/5 on a uniform interval of length 4. Estimate the integral.',
    r`$4(3/5)=12/5$.`,
    exact('12/5'),
  ),
  q(
    'Distinguish Monte Carlo error from a wrong simulation model.',
    'Monte Carlo error varies with the sampled draws; model error comes from representing the wrong data-generating mechanism or quantity.',
  ),
];
sections[4].review = [
  q(
    'Six bad events have probabilities at most 1/120 each. Give the union bound.',
    r`$6/120=1/20$.`,
    exact('1/20'),
  ),
  q(
    'Three independent runs each fail with probability 1/4. Give the all-fail probability.',
    r`$(1/4)^3=1/64$.`,
    exact('1/64'),
  ),
  q(
    'Does the union bound require independence?',
    'No; it holds for arbitrary events.',
    truth(false),
  ),
];
export default lesson(
  16,
  'concentration-monte-carlo',
  'Concentration and Monte Carlo Estimation',
  'A full distribution can provide an exact probability, but a mean or variance can already provide a useful guarantee. We connect such guarantees to sample averages, reproducible simulation calculations, and the failure events of randomized algorithms.',
  sections,
);
