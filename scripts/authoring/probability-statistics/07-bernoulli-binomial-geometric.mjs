import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  truth,
  tuple,
  quick,
} from './helpers.mjs';
const models = citation(
  'pn-3-1-5',
  'pishro-nik',
  '§3.1.5 Special Distributions',
  'https://www.probabilitycourse.com/chapter3/3_1_5_special_discrete_distr.php',
  'Bernoulli indicators, binomial counts, geometric waiting times, assumptions, and parameter conventions.',
);
const mean = citation(
  'pn-3-2-2',
  'pishro-nik',
  '§3.2.2 Expectation',
  'https://www.probabilitycourse.com/chapter3/3_2_2_expectation.php',
  'Means of Bernoulli, binomial, and trials-until-success geometric variables.',
);
const variance = citation(
  'pn-3-2-4',
  'pishro-nik',
  '§3.2.4 Variance',
  'https://www.probabilitycourse.com/chapter3/3_2_4_variance.php',
  'Bernoulli and binomial variances using independent indicator sums.',
);
const geo = citation(
  'os-4-4',
  'openstax-statistics-2e',
  '§4.4 Geometric Distribution, assumptions and Case I/II formulas',
  'https://openstax.org/books/introductory-statistics-2e/pages/4-4-geometric-distribution',
  'Geometric memorylessness and the identical variance of trials and failures conventions; formulas independently reconciled.',
);
const a = section(
  'Bernoulli variables model one binary event',
  r`A Bernoulli variable records whether one event occurs. Write $X\sim\operatorname{Bernoulli}(p)$ when $P(X=1)=p$ and $P(X=0)=1-p$. The symbol $\sim$ means “has the distribution,” not approximate equality. We allow $0\leq p\leq1$, including the constant endpoint cases. For $0<p<1$ the support is $\{0,1\}$; at an endpoint only one value has positive mass.

“Success” is simply the event coded as one. It can mean a defect, a timeout, or a desired result. Choosing that label does not make it favorable. If a timeout occurs with probability $0.03$, its indicator is Bernoulli with parameter $0.03$. Coding successful delivery instead gives parameter $0.97$. Complementing the variable changes $X$ to $1-X$ and switches the parameter.

Because $X$ takes only zero and one, $X^2=X$. Therefore $E[X]=p$ and $\operatorname{Var}(X)=p-p^2=p(1-p)$. The variance is largest at $p=1/2$ and zero at the endpoints. A rare indicator is usually zero, so its variance can be small even though a value one may represent a consequential event. The numerical coding and the real-world cost are separate quantities.

For a payoff $Y=a+bX$, the mean is $a+bp$ and the variance is $b^2p(1-p)$. Thus a binary event can produce nonbinary numerical values after a transformation, while its probability structure still comes from one Bernoulli indicator. This representation will let us derive larger count models rather than treating their moment formulas as unrelated facts.`,
  [models, mean, variance],
  [
    termEntry(
      'bernoulli-distribution',
      'Bernoulli distribution',
      'A zero-one distribution with one success probability.',
      r`$P(X=1)=p$, $P(X=0)=1-p$, $0\leq p\leq1$.`,
      r`A timeout indicator may be $\operatorname{Bernoulli}(0.03)$.`,
      'Success is a coding convention, not necessarily a desirable outcome.',
    ),
  ],
);
a.questions = [
  q(
    r`$X\sim\operatorname{Bernoulli}(2/7)$. Find $P(X=0)$.`,
    r`The complementary mass is $1-2/7=5/7$.`,
    exact('5/7'),
  ),
  q(
    r`$X\sim\operatorname{Bernoulli}(2/7)$. Find its mean.`,
    r`The mean of a Bernoulli indicator is its success probability, $2/7$.`,
    exact('2/7'),
  ),
  q(
    r`$X\sim\operatorname{Bernoulli}(2/7)$. Find its variance.`,
    r`The variance is $(2/7)(5/7)=10/49$.`,
    exact('10/49'),
  ),
  q(
    r`If $X\sim\operatorname{Bernoulli}(1/4)$, find $E[X^2]$.`,
    r`Since $X^2=X$, the second moment is $1/4$.`,
    exact('1/4'),
  ),
  q(
    r`If $X\sim\operatorname{Bernoulli}(1/4)$ and $Y=2+8X$, find $E[Y]$.`,
    r`The mean is $2+8(1/4)=4$.`,
    exact('4'),
  ),
  q(
    r`$X\sim\operatorname{Bernoulli}(1/4)$ and $Y=2+8X$. Find its variance.`,
    r`The Bernoulli variance is $3/16$; scaling by eight multiplies it by $64$, giving $12$.`,
    exact('12'),
  ),
  q(
    r`Find the largest possible Bernoulli variance.`,
    r`Complete the square: $p(1-p)=1/4-(p-1/2)^2\leq1/4$, achieved at $p=1/2$.`,
    exact('1/4'),
  ),
  q(
    r`If $X\sim\operatorname{Bernoulli}(1)$, find its variance.`,
    r`The variable is constantly one, so its variance is $0$.`,
    exact('0'),
  ),
  q(
    r`True or false: the event coded as success must be desirable.`,
    r`False. It is simply the event represented by one; a defect indicator is an equally valid Bernoulli variable.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Derive the Bernoulli mean and variance from its two masses.`,
    r`The mean is $0(1-p)+1p=p$. Since the second moment is also $p$, the variance is $p-p^2=p(1-p)$.`,
  ),
];
a.review = [
  q(
    r`A failure indicator has parameter $0.12$. Find the success indicator's mean.`,
    r`The complementary event has probability $1-0.12=0.88=22/25$, which equals its indicator mean.`,
    exact('22/25'),
  ),
  q(
    r`A Bernoulli variable has parameter $3/5$. Find the variance of $5X$.`,
    r`Scale the variance: $25(3/5)(2/5)=6$.`,
    exact('6'),
  ),
  q(
    r`Explain why a Bernoulli variable with parameter zero has support containing only zero under this lesson's convention.`,
    r`Support means positive-probability values. At parameter zero, the mass at one vanishes and all mass is at zero.`,
  ),
];
const b = section(
  'Binomial counts combine fixed independent trials',
  r`A binomial experiment has a fixed number $n$ of trials, each with two coded outcomes, a common success probability $p$, and mutual independence. The count of successes is $X\sim\operatorname{Binomial}(n,p)$. For $0<p<1$, its support is $0,1,\ldots,n$. At $p=0$ or $p=1$, the count is constant zero or $n$.

A particular ordered pattern with $k$ successes and $n-k$ failures has probability $p^k(1-p)^{n-k}$. There are $\binom nk$ ways to choose the success positions. Those patterns are disjoint, so $P(X=k)=\binom nkp^k(1-p)^{n-k}$. The combination coefficient counts different positions; the powers supply the probability of each pattern. Omitting either part answers a different question.

For five independent attempts with success probability $1/3$, exactly two successes have probability $\binom52(1/3)^2(2/3)^3=80/243$. A specified pattern such as success, failure, success, failure, failure has only probability $8/243$. Ten patterns contribute to the count event. Their probabilities are equal because all trials share the same success rate.

Write $X=I_1+\cdots+I_n$ using the trial indicators. Linearity gives $E[X]=np$. Independence and the Bernoulli variance give $\operatorname{Var}(X)=np(1-p)$. Normalization follows from the binomial theorem: summing the PMF yields $(p+(1-p))^n=1$. These derivations expose the assumptions. Unequal success rates preserve an indicator-sum description but generally lose the binomial PMF; dependent trials need still more information about joint behavior.`,
  [models, mean, variance],
  [
    termEntry(
      'binomial-distribution',
      'Binomial distribution',
      'The success count in a fixed number of independent equal-rate trials.',
      r`$P(X=k)=\binom nkp^k(1-p)^{n-k}$ for $k=0,\ldots,n$.`,
      r`Five independent trials with $p=1/3$ give $P(X=2)=80/243$.`,
      'Fixed trial count, common probability, and independence are separate assumptions.',
    ),
  ],
);
b.questions = [
  q(
    r`$X\sim\operatorname{Binomial}(4,1/2)$. Find $P(X=2)$.`,
    r`The count has $\binom42=6$ patterns, each probability $1/16$, giving $3/8$.`,
    exact('3/8'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(3,1/4)$. Find $P(X=1)$.`,
    r`The formula gives $3(1/4)(3/4)^2=27/64$.`,
    exact('27/64'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(3,1/4)$. Find $P(X=3)$.`,
    r`All three succeed with probability $(1/4)^3=1/64$.`,
    exact('1/64'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(12,1/3)$. Find its mean.`,
    r`The mean is $np=12/3=4$.`,
    exact('4'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(12,1/3)$. Find its variance.`,
    r`The variance is $12(1/3)(2/3)=8/3$.`,
    exact('8/3'),
  ),
  q(
    r`Five independent fair trials occur. Find the probability of the specified pattern $SFSFF$.`,
    r`A single ordered pattern has probability $(1/2)^5=1/32$.`,
    exact('1/32'),
  ),
  q(
    r`Five independent fair binary trials occur. Find the probability of exactly two successes.`,
    r`There are $\binom52=10$ such patterns, so the probability is $10/32=5/16$.`,
    exact('5/16'),
  ),
  q(
    r`A binomial count has $n=20$ and mean $5$. Find $p$.`,
    r`Since $np=5$, the common success probability is $5/20=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`True or false: independent binary trials with probabilities $0.2,0.5,0.8$ necessarily have a binomial success count.`,
    r`False. A binomial model requires a common success probability; independence alone does not supply it.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain the combination coefficient in the binomial PMF.`,
    r`It counts which $k$ of the $n$ trial positions contain successes. Each choice defines a disjoint ordered pattern with the same probability under the common-rate independent model.`,
  ),
];
b.review = [
  q(
    r`$X\sim\operatorname{Binomial}(5,2/3)$. Find $P(X=4)$.`,
    r`The formula gives $5(2/3)^4(1/3)=80/243$.`,
    exact('80/243'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(8,1/4)$. Give mean and variance as a pair.`,
    r`The mean is $8/4=2$ and variance is $8(1/4)(3/4)=3/2$, so the pair is $(2,3/2)$.`,
    tuple(['2', '3/2']),
  ),
  q(
    r`Prove that the binomial masses sum to one for $0<p<1$.`,
    r`The binomial theorem gives $\sum_{k=0}^n\binom nkp^k(1-p)^{n-k}=(p+1-p)^n=1$.`,
    undefined,
    'prove',
  ),
];
b.quickCheck = quick(
  r`Which experiment directly has a binomial success count?`,
  [
    r`Ten independent attempts, each with success probability $0.4$.`,
    r`Attempts continue until the first success.`,
    r`Ten draws without replacement from a small mixed bag.`,
  ],
  0,
  r`A binomial count requires a fixed trial number, common success probability, and independence.`,
  [
    r`All required assumptions are supplied, giving $\operatorname{Binomial}(10,0.4)$.`,
    r`The trial count is random; trials until first success use a geometric model under constant-rate independence.`,
    r`Removing objects changes later category probabilities, violating the independent common-rate trial model.`,
  ],
);
const c = section(
  'Binomial tails and model checks',
  r`A count event often contains several possible values. Compute $P(X\leq k)$ by summing masses from zero through $k$. For an upper tail, use a complement when it shortens the sum: $P(X\geq k)=1-P(X\leq k-1)$. Integer endpoints matter exactly as they did for general discrete CDFs. “More than two” starts at three; “at least two” includes two.

For four independent attempts with success probability $1/4$, no success has probability $(3/4)^4=81/256$. At least one success therefore has probability $175/256$. At least two successes subtracts both zero and one: $1-[81/256+4(1/4)(3/4)^3]=1-189/256=67/256$. The complement uses all excluded counts, not just the nearest endpoint.

A proportion $\widehat p=X/n$ for positive $n$ has mean $p$ and variance $p(1-p)/n$, by scaling the binomial moments. Its support consists of multiples of $1/n$, so it remains discrete. This introduces a quantity used later in estimation; at present $p$ is a supplied model parameter, not a value inferred from data. An observed fraction need not equal the common success probability.

Before applying the binomial formula, inspect how the data are generated. A fixed set of trials does not imply independence. A shared environment can link outcomes; sampling a substantial fraction of a finite population without replacement creates dependence; a learning process can change the success probability. A binomial approximation may still be useful in a suitable setting, but state it as an approximation and explain which assumption is being simplified. The formula cannot validate its own modeling assumptions.`,
  [models, mean, variance],
  [
    termEntry(
      'binomial-proportion',
      'Binomial sample proportion',
      'A binomial count divided by its positive trial count.',
      r`For $X\sim\operatorname{Binomial}(n,p)$ and $n>0$, $\widehat p=X/n$ has mean $p$ and variance $p(1-p)/n$.`,
      r`A count of three in ten trials gives observed proportion $0.3$.`,
      'An observed proportion is not automatically the model parameter.',
    ),
  ],
);
c.questions = [
  q(
    r`$X\sim\operatorname{Binomial}(3,1/2)$. Find $P(X\geq1)$.`,
    r`The no-success probability is $1/8$, so the complement is $7/8$.`,
    exact('7/8'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(3,1/2)$. Find $P(X>1)$.`,
    r`Counts two and three have masses $3/8,1/8$, totaling $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(4,1/3)$. Find $P(X=0)$.`,
    r`All four fail with probability $(2/3)^4=16/81$.`,
    exact('16/81'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(4,1/3)$. Find $P(X\geq1)$.`,
    r`Take the complement of zero: $1-16/81=65/81$.`,
    exact('65/81'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(4,1/3)$. Find $P(X\leq1)$.`,
    r`Add zero and one: $16/81+4(1/3)(2/3)^3=16/81+32/81=16/27$.`,
    exact('16/27'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(4,1/3)$. Find $P(X\geq2)$.`,
    r`The complement is $1-16/27=11/27$.`,
    exact('11/27'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(25,0.4)$. Find $E[X/25]$.`,
    r`The proportion mean is the common success probability, $0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(25,0.4)$. Find $\operatorname{Var}(X/25)$.`,
    r`The proportion variance is $0.4(0.6)/25=6/625$.`,
    exact('6/625'),
  ),
  q(
    r`Explain why ten draws from a finite bag without replacement do not generally produce a binomial count.`,
    r`The available category counts change after draws, so later success probabilities depend on the earlier history. A uniform without-replacement count is hypergeometric, introduced next.`,
  ),
  q(
    r`True or false: a binomial count can equal $n+1$.`,
    r`False. With only $n$ binary trials, at most $n$ successes can occur.`,
    truth(false),
    'interpret',
  ),
];
c.review = [
  q(
    r`$X\sim\operatorname{Binomial}(2,1/5)$. Find $P(X\geq1)$.`,
    r`Subtract no success: $1-(4/5)^2=9/25$.`,
    exact('9/25'),
  ),
  q(
    r`$X\sim\operatorname{Binomial}(3,2/3)$. Find $P(X\geq2)$.`,
    r`The masses at two and three are $4/9$ and $8/27$, totaling $20/27$.`,
    exact('20/27'),
  ),
  q(
    r`A binomial proportion uses $n=100$ and $p=1/2$. Find its variance.`,
    r`The variance is $(1/2)(1/2)/100=1/400$.`,
    exact('1/400'),
  ),
];
const d = section(
  'Geometric waiting time counts through first success',
  r`A geometric experiment repeats mutually independent Bernoulli trials with the same success probability until the first success. In this subject, $T\sim\operatorname{Geometric}(p)$ counts all trials including the successful one. Its support is $1,2,3,\ldots$ for $0<p<1$. We also allow $p=1$, giving $T=1$ with certainty. With $p=0$, a first success never occurs, so there is no finite-valued waiting time of this form.

The event $T=k$ means exactly $k-1$ initial failures followed by a success. It is one specified pattern, so $P(T=k)=(1-p)^{k-1}p$. There is no binomial coefficient because the success must be last and no earlier success is permitted. The tail $P(T>m)=(1-p)^m$ for integer $m\geq0$ says the first $m$ trials all fail. Consequently $P(T\leq m)=1-(1-p)^m$ for positive integer $m$.

With success probability $1/4$, first success on trial three has probability $(3/4)^2(1/4)=9/64$. Success by trial three has probability $1-(3/4)^3=37/64$. These are different events: “on” specifies the stopping position, while “by” allows any earlier success. A waiting-time mean can be noninteger because it averages over many possible stopping positions.

Another common convention counts failures before success: $F=T-1$, supported on zero and the positive integers. Its PMF is $P(F=j)=(1-p)^jp$. The distributions are shifts of one another, so their means differ by one and their variances are identical. Always state which quantity is counted before entering parameters or interpreting a reported value. A formula without its support and counting convention is incomplete.`,
  [models, geo],
  [
    termEntry(
      'geometric-distribution',
      'Geometric distribution',
      'The trial number of the first success.',
      r`$P(T=k)=(1-p)^{k-1}p$ for $k\geq1$ under constant-rate independent trials.`,
      r`With $p=1/4$, $P(T=3)=9/64$.`,
      'Some sources count failures instead, shifting the variable down by one.',
    ),
  ],
);
d.questions = [
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through success. Find $P(T=1)$.`,
    r`The first trial must succeed, so the probability is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through first success. Find $P(T=3)$.`,
    r`Two failures then success give $(2/3)^2(1/3)=4/27$.`,
    exact('4/27'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through first success. Find $P(T>3)$.`,
    r`All first three trials fail, giving $(2/3)^3=8/27$.`,
    exact('8/27'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through first success. Find $P(T\leq3)$.`,
    r`Take the complement: $1-8/27=19/27$.`,
    exact('19/27'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through first success. Find $P(T\geq3)$.`,
    r`The first two trials must fail, so the probability is $(2/3)^2=4/9$.`,
    exact('4/9'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/3)$ counts trials through first success. Let $F=T-1$. Find $P(F=2)$.`,
    r`Two failures before success means $T=3$, so the probability is $4/27$.`,
    exact('4/27'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/2)$. Find $P(2\leq T\leq4)$.`,
    r`Sum masses at two, three, four: $1/4+1/8+1/16=7/16$.`,
    exact('7/16'),
  ),
  q(
    r`For $p=1$, find the trials-through-success waiting time.`,
    r`The first attempt always succeeds, so $T=1$.`,
    exact('1'),
  ),
  q(
    r`Explain why the geometric PMF has no combination coefficient.`,
    r`A stopping time of $k$ fixes every trial outcome through that point: failures in the first $k-1$ positions and success in the last. There are no alternative success-position patterns to count.`,
  ),
  q(
    r`True or false: if $T$ counts trials through success, its minimum possible value is zero.`,
    r`False. At least one trial is required; zero is possible only for the failures-before-success convention.`,
    truth(false),
    'interpret',
  ),
];
d.review = [
  q(
    r`$T\sim\operatorname{Geometric}(2/5)$. Find $P(T=2)$.`,
    r`One failure then success gives $(3/5)(2/5)=6/25$.`,
    exact('6/25'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(2/5)$ counts trials through first success. Find $P(T>2)$.`,
    r`Two initial failures give $(3/5)^2=9/25$.`,
    exact('9/25'),
  ),
  q(
    r`Explain the event corresponding to four failures before the first success.`,
    r`It is a trials-through-success waiting time of five, with four failures followed by a success. Its probability is $(1-p)^4p$.`,
  ),
];
d.quickCheck = quick(
  r`If $T$ counts trials through first success, what does $T>4$ mean?`,
  [
    r`The fourth trial succeeds.`,
    r`The first four trials all fail.`,
    r`There are exactly four failures before success.`,
  ],
  1,
  r`A waiting time beyond four means no success has yet appeared in those four trials.`,
  [
    r`A first success on trial four would mean $T=4$, outside the strict tail.`,
    r`Four initial failures are exactly the condition that first success occurs after trial four.`,
    r`Exactly four failures also requires success on trial five, which is the narrower event $T=5$.`,
  ],
);
const e = section(
  'Geometric moments and memorylessness',
  r`For the trials-through-success convention, the mean is $E[T]=1/p$ and the variance is $(1-p)/p^2$. One derivation uses the geometric series and its derivatives from calculus. Writing $q=1-p$, $\sum_{k\geq1}kq^{k-1}=1/(1-q)^2$, so multiplying by $p$ gives the mean. A second differentiation yields $E[T(T-1)]=2q/p^2$. Adding $E[T]$ gives the second moment, and subtracting $1/p^2$ leaves variance $q/p^2$.

For $p=1/4$, the mean is four trials and the variance is twelve. For failures before success, $F=T-1$ has mean three and the same variance twelve. The shift changes the origin of the count but not its spread. Standard deviation is $\sqrt{1-p}/p$ for both conventions. These formulas rely on a constant success probability throughout the process.

The geometric distribution is memoryless: for nonnegative integers $m,n$ and $0<p<1$, $P(T>m+n\mid T>m)=(1-p)^{m+n}/(1-p)^m=(1-p)^n$. After observing $m$ failures, the remaining waiting-time distribution is the same as at the start. This does not mean the past did not happen; it means the model gives future trials the same independent success chances. The next trial is not “due” to succeed because of past failures.

Memorylessness can fail when repeated attempts improve skill, exhaust a finite pool, or reveal information about an unknown success rate. Even if attempts are independent conditional on a hidden rate, a long run of failures can change beliefs about that rate. Use the geometric model when its constant-rate independent mechanism is appropriate, and distinguish this model-based statement from an unsupported claim about every real waiting process.`,
  [models, mean, geo],
  [
    termEntry(
      'memorylessness',
      'Geometric memorylessness',
      'Previous failures do not change the remaining waiting-time distribution.',
      r`$P(T>m+n\mid T>m)=P(T>n)$ for nonnegative integers $m,n$ when $0<p<1$.`,
      r`After five failures, the next trial still succeeds with probability $p$.`,
      'It requires the constant-rate independent model and does not describe learning or depletion.',
    ),
  ],
);
e.questions = [
  q(r`$T\sim\operatorname{Geometric}(1/5)$. Find its mean.`, r`The mean is $1/p=5$.`, exact('5')),
  q(
    r`$T\sim\operatorname{Geometric}(1/5)$ counts trials through first success. Find its variance.`,
    r`The variance is $(4/5)/(1/25)=20$.`,
    exact('20'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/5)$ counts trials through first success. Find the mean number of failures before success.`,
    r`Failures equal $T-1$, so their mean is $5-1=4$.`,
    exact('4'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/5)$ counts trials through first success. Find the variance of failures before success.`,
    r`Subtracting one leaves variance unchanged, giving $20$.`,
    exact('20'),
  ),
  q(
    r`$T\sim\operatorname{Geometric}(1/2)$. Find $P(T>7\mid T>4)$.`,
    r`Memorylessness leaves three more failures: $(1/2)^3=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Independent attempts each succeed with probability $0.3$. After six failures, find the conditional probability the next attempt succeeds.`,
    r`The independent constant-rate model leaves the probability at $0.3=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`A trials-through-success geometric variable has mean $8$. Find its parameter.`,
    r`Since $1/p=8$, the success probability is $1/8$.`,
    exact('1/8'),
  ),
  q(
    r`A trials-through-success geometric variable has mean eight. Find its variance.`,
    r`The variance is $(7/8)/(1/64)=56$.`,
    exact('56'),
  ),
  q(
    r`Prove the geometric memoryless tail identity.`,
    r`For $q=1-p\in(0,1)$, the smaller tail contains the larger. Conditional probability gives $P(T>m+n\mid T>m)=q^{m+n}/q^m=q^n=P(T>n)$.`,
    undefined,
    'prove',
  ),
  q(
    r`Explain why a practice task with steadily improving success probability may not have a geometric waiting time.`,
    r`The success probability changes with trial number or history, so the constant-rate pattern probabilities and memoryless property no longer apply.`,
  ),
];
e.review = [
  q(
    r`A geometric variable has $p=2/3$. Give its mean and variance as a pair.`,
    r`The mean is $3/2$ and variance is $(1/3)/(4/9)=3/4$, so the pair is $(3/2,3/4)$.`,
    tuple(['3/2', '3/4']),
  ),
  q(
    r`For $T\sim\operatorname{Geometric}(1/4)$, find $P(T>5\mid T>3)$.`,
    r`Two additional failures are required, so the answer is $(3/4)^2=9/16$.`,
    exact('9/16'),
  ),
  q(
    r`Explain why the standard deviation is unchanged when switching from trials to failures before success.`,
    r`The variables differ by the constant one. Translation leaves variance unchanged and therefore leaves its nonnegative square root unchanged.`,
  ),
];
b.body += r`

The endpoint models can be checked without manipulating $0^0$. If $p=0$, every trial fails and the only possible count is zero. If $p=1$, every trial succeeds and the count is $n$. If $n=0$, the empty collection contains zero successes regardless of $p$. State these cases directly; the familiar PMF expression is most convenient for $0<p<1$. Their means and variances still agree with $np$ and $np(1-p)$, so the moment formulas provide a continuous connection to the boundary cases.`;
c.body += r`

When success probabilities differ, a short example reveals what changes. For independent trials with rates $1/4$ and $3/4$, exactly one success has probability $(1/4)(1/4)+(3/4)(3/4)=5/8$. Replacing both rates by their average $1/2$ would give $1/2$, not $5/8$. Both models have expected count one, but they do not have the same distribution. Matching the mean is therefore not sufficient to justify a binomial replacement. The conditional or direct pattern method remains available for the actual unequal-rate experiment.`;
e.body += r`

A planning threshold can be obtained from the tail instead of the mean. With success probability $1/2$, requiring success by trial $m$ with probability at least $0.9$ means $1-2^{-m}\geq0.9$, or $2^{-m}\leq0.1$. Trial three gives success probability $7/8$, too small; trial four gives $15/16$, meeting the requirement. The mean waiting time is only two trials, showing why an expected waiting time is not the same as a high-probability completion guarantee. The desired criterion determines whether to use a moment or a tail probability.`;
export default lesson(
  7,
  'bernoulli-binomial-geometric',
  'Bernoulli, Binomial, and Geometric Models',
  r`Named distributions package recurring experiments, not just formulas. A Bernoulli variable records one binary event; a binomial variable counts successes in a fixed number of independent equal-rate trials; a geometric variable counts trials until the first success. We will derive their probabilities and moments from the tools already developed, check their assumptions, and use their supports to interpret exact counts and tails correctly.`,
  [a, b, c, d, e],
);
