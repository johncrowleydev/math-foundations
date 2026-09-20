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
  quick,
} from './helpers.mjs';
const ce = citation(
  'pn-5-1-5',
  'pishro-nik',
  '§5.1.5 Conditional Expectation and Conditional Variance',
  'https://www.probabilitycourse.com/chapter5/5_1_5_conditional_expectation.php',
  'Conditional expectation as a random variable, total expectation, total variance, and random sums.',
);
const continuous = citation(
  'pn-5-2-3',
  'pishro-nik',
  '§5.2.3 Conditioning and Independence',
  'https://www.probabilitycourse.com/chapter5/5_2_3_conditioning_independence.php',
  'Truncation, conditional densities, positive-density denominators, and independence.',
);
const mse = citation(
  'pn-9-1-5',
  'pishro-nik',
  '§9.1.5 Mean Squared Error',
  'https://www.probabilitycourse.com/chapter9/9_1_5_mean_squared_error_MSE.php',
  'Conditional mean prediction, squared-error decomposition, and orthogonality of prediction error.',
);
const s1 = section(
  'A conditional mean is a function of the information',
  r`Conditioning gives a new probability distribution, so it also gives a new mean. For discrete variables, $E[Y\mid X=x]=\sum_y y\,p_{Y\mid X}(y\mid x)$. For a conditional density, the sum becomes $\int y f_{Y\mid X}(y\mid x)\,dy$. Hold the observed value $x$ fixed while averaging over the still-unknown $Y$. The answer has the units of $Y$.

Suppose a regime indicator $X$ takes values zero and one. In regime zero, $Y$ is zero or two with equal conditional probabilities; in regime one, $Y$ is two or six with equal conditional probabilities. The conditional means are $m(0)=1$ and $m(1)=4$. The function $m(x)=E[Y\mid X=x]$ maps observed information to a number. Before $X$ is observed, $m(X)=E[Y\mid X]$ is itself a random variable: it takes one or four according to the regime.

This distinction resolves a common notation problem. $E[Y\mid X=x]$ is a number for a specified $x$, whereas $E[Y\mid X]$ can vary from outcome to outcome. A conditional mean need not be a possible realized value of $Y$. Averaging zero and two produces one even though the conditional distribution gives no mass to one.

For the continuous joint density $2$ on $0<x<y<1$, the conditional distribution $Y\mid X=x$ is uniform on $(x,1)$. Its mean is $m(x)=(x+1)/2$. Therefore $E[Y\mid X]=(X+1)/2$. In the reverse direction, $X\mid Y=y$ is uniform on $(0,y)$, with mean $y/2$.

Linearity still holds conditionally. Quantities determined by the observed variable can be taken outside: $E[X Y\mid X]=X E[Y\mid X]$, with appropriate integrability. They are not globally constant; they are fixed within each conditional calculation. Independence, when available, gives $E[Y\mid X]=E[Y]$.

The converse is false. Suppose one regime makes $Y$ equally likely to be $-1$ or $1$, while another makes it equally likely to be $-2$ or $2$. Both conditional means are zero, but the conditional distributions differ. A constant conditional mean describes one unchanged summary, not independence of the whole distribution.`,
  [ce, continuous],
  [
    termEntry(
      'conditional-mean',
      'Conditional expectation',
      'An average under a conditional distribution.',
      r`$m(x)=E[Y\mid X=x]$ and $E[Y\mid X]=m(X)$.`,
      r`If $Y\mid X=x$ is uniform on $(x,1)$, its mean is $(x+1)/2$.`,
      `The conditional expectation given a random variable is itself a random variable.`,
    ),
  ],
);
s1.questions = [
  q(
    r`Given $X=0$, a variable $Y$ is zero or four with equal probabilities. Find $E[Y\mid X=0]$.`,
    r`$(0+4)/2=2$.`,
    exact('2'),
  ),
  q(
    r`Given $X=1$, $Y$ takes $1,3,7$ with probabilities $1/4,1/2,1/4$. Find its conditional mean.`,
    r`$1/4+3/2+7/4=7/2$.`,
    exact('7/2'),
  ),
  q(
    r`If $Y\mid X=x$ is uniform on $(0,x)$ for $x>0$, give $E[Y\mid X=x]$.`,
    r`The midpoint is $x/2$.`,
    calc('x/2', ['x']),
  ),
  q(
    r`If $Y\mid X=x$ is uniform on $(x,1)$ for $0<x<1$, give its conditional mean.`,
    r`The midpoint is $(x+1)/2$.`,
    calc('(x+1)/2', ['x']),
  ),
  q(
    r`If $E[Y\mid X=x]=2x+1$, give $E[3Y-4\mid X=x]$.`,
    r`Conditional linearity gives $3(2x+1)-4=6x-1$.`,
    calc('6*x-1', ['x']),
  ),
  q(
    r`If $E[Y\mid X=x]=2x+1$, give $E[XY\mid X=x]$.`,
    r`The observed $x$ is fixed inside the expectation, so the answer is $x(2x+1)=2x^2+x$.`,
    calc('2*x^2+x', ['x']),
  ),
  q(
    r`If $Y=3X-2$ exactly, give $E[Y\mid X=x]$.`,
    r`Knowing $X=x$ determines $Y=3x-2$, so the mean is $3x-2$.`,
    calc('3*x-2', ['x']),
  ),
  q(
    r`Independent variables satisfy $E[Y]=8$. Find $E[Y\mid X=x]$ wherever the conditional model is defined.`,
    r`Independence leaves the distribution of $Y$ unchanged, so the conditional mean is $8$.`,
    exact('8'),
  ),
  q(
    r`Explain why a conditional mean need not be one of the possible values of the response.`,
    r`It is a weighted average, not a sampled value. A response equally likely to be zero or four has conditional mean two.`,
  ),
  q(
    r`Describe the difference between $E[Y\mid X=2]$ and $E[Y\mid X]$.`,
    r`The first is a fixed number obtained by averaging under the condition $X=2$. The second is the function of the random input $X$ whose value at each outcome is the appropriate conditional mean.`,
  ),
];
s1.review = [
  q(
    r`If $Y\mid X=x$ is Bernoulli with parameter $x^2$, for $0<x<1$, give its conditional mean.`,
    r`A Bernoulli mean equals its success probability, so the mean is $x^2$.`,
    calc('x^2', ['x']),
  ),
  q(
    r`If $E[Y\mid X=x]=x/3$, give $E[2XY+1\mid X=x]$.`,
    r`$2x(x/3)+1=2x^2/3+1$.`,
    calc('2*x^2/3+1', ['x']),
  ),
  q(
    r`Given $X=1$, $Y$ is $-2$ with probability $3/4$ and $6$ with probability $1/4$. Find its conditional mean.`,
    r`$(-2)(3/4)+6(1/4)=0$.`,
    exact('0'),
  ),
];
const s2 = section(
  'Average conditional means to recover the overall mean',
  r`The **law of total expectation** states $E[Y]=E[E[Y\mid X]]$ when $Y$ is integrable. First average within each condition, then average those conditional means according to the distribution of the conditioning variable. This is also called iterated expectation or the tower property. The outer expectation is essential: the inner conditional mean may still be random.

For a discrete partition into regimes, $E[Y]=\sum_x E[Y\mid X=x]P(X=x)$. If the conditional means are one and four and the regime probabilities are $3/4$ and $1/4$, the overall mean is $(3/4)(1)+(1/4)(4)=7/4$. An unweighted average of the two means would be $5/2$, incorrectly treating the rare and common regimes as equally prevalent.

For continuous $X$, use its density as the outer weight: $E[Y]=\int E[Y\mid X=x]f_X(x)\,dx$. In the triangular model $f_{X,Y}=2$ on $0<x<y<1$, the conditional mean is $(x+1)/2$ and the marginal density of $X$ is $2(1-x)$. Thus $E[Y]=\int_0^1(x+1)(1-x)\,dx=2/3$, agreeing with integration against the marginal density $2y$.

An indicator response provides total probability as a special case. If $Y=1_A$, then $E[Y\mid X]=P(A\mid X)$, and averaging gives $P(A)=E[P(A\mid X)]$. A conditional failure-rate model can therefore be averaged over operating conditions without enumerating every joint outcome.

For a random number of Bernoulli trials, suppose $K\mid N=n$ is binomial with parameters $n,p$, where $p$ is fixed and $E[N]<\infty$. Then $E[K\mid N]=Np$, so $E[K]=pE[N]$. The result is obtained by conditioning, not by pretending that a random count equals its mean in every realization. Nonlinear quantities cannot generally be handled by such a replacement.

The order of the two averages is worth stating aloud: average responses conditional on the regime, then average the resulting function over regimes. Reversing the roles of response and condition produces a different function and generally a different intermediate calculation, even though both are built from the same joint distribution.`,
  [ce, continuous],
  [
    termEntry(
      'total-expectation',
      'Law of total expectation',
      'Average conditional means using the probabilities of the conditions.',
      r`$E[Y]=E[E[Y\mid X]]$ for integrable $Y$.`,
      r`Group means one and four with weights $3/4,1/4$ give mean $7/4$.`,
      `Do not average group means equally unless their population weights are equal.`,
    ),
  ],
);
s2.questions = [
  q(
    r`Conditional means are $2,8$ with regime probabilities $3/4,1/4$. Find the overall mean.`,
    r`$(3/4)(2)+(1/4)(8)=7/2$.`,
    exact('7/2'),
  ),
  q(
    r`Conditional means are $-1,3,6$ with probabilities $1/2,1/3,1/6$. Find the overall mean.`,
    r`$-1/2+1+1=3/2$.`,
    exact('3/2'),
  ),
  q(r`If $E[Y\mid X]=3X+2$ and $E[X]=4$, find $E[Y]$.`, r`$E[3X+2]=3(4)+2=14$.`, exact('14')),
  q(
    r`If $E[Y\mid X]=X^2$, $E[X]=2$, and $\operatorname{Var}(X)=3$, find $E[Y]$.`,
    r`$E[X^2]=\operatorname{Var}(X)+E[X]^2=3+4=7$.`,
    exact('7'),
  ),
  q(
    r`Let $X$ be uniform on $(0,2)$, and let $E[Y\mid X=x]=x/2$. Find $E[Y]$.`,
    r`$E[X]/2=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Let $X$ have density $2x$ on $(0,1)$ and $E[Y\mid X=x]=x^2$. Find $E[Y]$.`,
    r`$\int_0^1x^2(2x)\,dx=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`If $K\mid N=n$ is binomial with parameters $n,1/4$, and $E[N]=12$, find $E[K]$.`,
    r`$E[K]=E[N]/4=3$.`,
    exact('3'),
  ),
  q(
    r`An event has conditional probabilities $1/5,4/5$ in equally likely regimes. Find its overall probability.`,
    r`$(1/2)(1/5)+(1/2)(4/5)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Explain why $E[Y]=E[X]^2$ does not follow from $E[Y\mid X]=X^2$.`,
    r`The tower property gives $E[Y]=E[X^2]$, which differs from $E[X]^2$ by $\operatorname{Var}(X)$.`,
  ),
  q(
    r`Prove total expectation for finite discrete variables from their joint PMF.`,
    r`Sum $E[Y\mid X=x]P(X=x)=\sum_y y\,p(x,y)$ over $x$. Reversing the finite sums gives $\sum_y y\sum_xp(x,y)=\sum_y y p_Y(y)=E[Y]$.`,
    undefined,
    'prove',
  ),
];
s2.review = [
  q(
    r`Conditional means are $4,10$ with probabilities $2/3,1/3$. Find the overall mean.`,
    r`$(2/3)(4)+(1/3)(10)=6$.`,
    exact('6'),
  ),
  q(
    r`If $E[Y\mid X]=2X^2-1$, $E[X]=0$, and $\operatorname{Var}(X)=5$, find $E[Y]$.`,
    r`$2E[X^2]-1=2(5)-1=9$.`,
    exact('9'),
  ),
  q(
    r`If $X$ is uniform on $(0,1)$ and $P(A\mid X=x)=x^3$, find $P(A)$.`,
    r`$\int_0^1x^3\,dx=1/4$.`,
    exact('1/4'),
  ),
];
s2.quickCheck = quick(
  r`Group means are known, but groups have different probabilities. How is the overall mean obtained?`,
  [
    `Take the arithmetic mean of the group means.`,
    `Weight each group mean by that group's probability.`,
    `Select the mean of the largest group.`,
  ],
  1,
  `Total expectation averages within groups and then across their actual probabilities.`,
  [
    `Equal weighting would describe a different experiment that selects groups equally often.`,
    `Correct. Each group's contribution is its mean multiplied by its probability.`,
    `The largest group influences the result most, but other positive-probability groups still contribute.`,
  ],
);
const s3 = section(
  'Split variation within and between conditions',
  r`Conditional variance measures the remaining variation inside a condition: $\operatorname{Var}(Y\mid X=x)=E[Y^2\mid X=x]-E[Y\mid X=x]^2$. It is a function of $x$, and $\operatorname{Var}(Y\mid X)$ is that function evaluated at the random input. Do not confuse it with $\operatorname{Var}(E[Y\mid X])$, which measures how the conditional means differ across conditions.

When $E[Y^2]<\infty$, the **law of total variance** is $\operatorname{Var}(Y)=E[\operatorname{Var}(Y\mid X)]+\operatorname{Var}(E[Y\mid X])$. The first term is average variation within conditions; the second is variation between their means. Both terms are nonnegative, and both are needed unless one vanishes.

For regimes of probabilities $3/4,1/4$, suppose conditional means are $2,8$ and conditional variances are $1,9$. The overall mean is $7/2$. Average within-regime variance is $(3/4)(1)+(1/4)(9)=3$. Between-regime variance is $(3/4)(2-7/2)^2+(1/4)(8-7/2)^2=27/4$. Total variance is consequently $3+27/4=39/4$. Simply averaging the conditional variances would miss most of the variation.

The identity follows algebraically. Set $M=E[Y\mid X]$. Then $E[\operatorname{Var}(Y\mid X)]=E[Y^2]-E[M^2]$, using total expectation on $Y^2$. Also $\operatorname{Var}(M)=E[M^2]-E[Y]^2$. Adding cancels $E[M^2]$ and yields the ordinary variance of $Y$.

Conditioning reduces variance **on average**, since $E[\operatorname{Var}(Y\mid X)]\le\operatorname{Var}(Y)$. It need not reduce variance for every particular observed value. Discovering that a system is in a rare volatile regime can increase the conditional variance. The inequality compares an average across all regimes to the original variance; it is not a pointwise guarantee for each regime.`,
  [ce, continuous],
  [
    termEntry(
      'total-variance',
      'Law of total variance',
      'Total variation equals average conditional variation plus variation of conditional means.',
      r`$\operatorname{Var}(Y)=E[\operatorname{Var}(Y\mid X)]+\operatorname{Var}(E[Y\mid X])$.`,
      r`Within variation three and between variation $27/4$ give total $39/4$.`,
      `Conditional variance decreases on average, not necessarily for every observed condition.`,
    ),
  ],
);
s3.questions = [
  q(
    r`If $E[Y\mid X=x]=2$ and $E[Y^2\mid X=x]=7$, find the conditional variance.`,
    r`$7-2^2=3$.`,
    exact('3'),
  ),
  q(
    r`Conditional variances are $1,9$ with probabilities $3/4,1/4$. Find their average.`,
    r`$(3/4)(1)+(1/4)(9)=3$.`,
    exact('3'),
  ),
  q(
    r`Conditional means are $2,8$ with probabilities $3/4,1/4$. Find the variance of the conditional mean.`,
    r`The mean is $7/2$; the variance is $(3/4)(-3/2)^2+(1/4)(9/2)^2=27/4$.`,
    exact('27/4'),
  ),
  q(
    r`Regimes have probabilities $3/4,1/4$, means $2,8$, and variances $1,9$. Find total variance.`,
    r`Average within variance is three and between variance is $27/4$, so total variance is $39/4$.`,
    exact('39/4'),
  ),
  q(
    r`If total variance is $12$ and average conditional variance is $5$, find variance of the conditional mean.`,
    r`Total variance gives $12-5=7$.`,
    exact('7'),
  ),
  q(
    r`If $E[Y\mid X]=3X+1$, $\operatorname{Var}(X)=2$, and $\operatorname{Var}(Y\mid X)=4$, find $\operatorname{Var}(Y)$.`,
    r`$4+\operatorname{Var}(3X+1)=4+9(2)=22$.`,
    exact('22'),
  ),
  q(
    r`If $Y\mid X=x$ is uniform on $(0,x)$ for $x>0$, give its conditional variance.`,
    r`The interval width is $x$, so the conditional variance is $x^2/12$.`,
    calc('x^2/12', ['x']),
  ),
  q(
    r`If $X$ is uniform on $(0,2)$ and $Y\mid X=x$ is uniform on $(0,x)$, find $\operatorname{Var}(Y)$.`,
    r`$E[X^2]/12+\operatorname{Var}(X/2)=(4/3)/12+(1/3)/4=1/9+1/12=7/36$.`,
    exact('7/36'),
  ),
  q(
    r`True or false: $\operatorname{Var}(Y\mid X=x)\le\operatorname{Var}(Y)$ must hold for every $x$.`,
    r`False. Total variance bounds the average conditional variance, allowing particular conditions to have larger variance.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Derive total variance by adding and subtracting the second moment of $E[Y\mid X]$.`,
    r`Let $M=E[Y\mid X]$. Then $E[\operatorname{Var}(Y\mid X)]=E[Y^2]-E[M^2]$ and $\operatorname{Var}(M)=E[M^2]-E[Y]^2$. Adding gives $\operatorname{Var}(Y)$.`,
    undefined,
    'prove',
  ),
];
s3.review = [
  q(
    r`Equal-probability regimes have means zero and four, and both conditional variances equal two. Find total variance.`,
    r`Within variance is two. Conditional means have mean two and variance four, so total variance is $6$.`,
    exact('6'),
  ),
  q(
    r`If $E[Y\mid X]=-2X$, $\operatorname{Var}(X)=3$, and the average conditional variance is one, find total variance.`,
    r`$1+4(3)=13$.`,
    exact('13'),
  ),
  q(
    r`If $Y$ is completely determined by $X$, what is $E[\operatorname{Var}(Y\mid X)]$?`,
    r`Each conditional distribution is constant, so the average conditional variance is $0$.`,
    exact('0'),
  ),
];
const s4 = section(
  'Conditional means give optimal squared-error predictions',
  r`Suppose we observe $X$ and predict an unobserved response $Y$ using a function $h(X)$. A loss function specifies what prediction errors cost. For squared-error loss, the expected loss is $E[(Y-h(X))^2]$, called mean squared error, or MSE. Assume finite second moments so these comparisons are meaningful. This is prediction of a random outcome from information, not yet estimation of an unknown fixed model parameter.

For a fixed condition $X=x$, write $m(x)=E[Y\mid X=x]$. Expanding around that mean gives $E[(Y-a)^2\mid X=x]=\operatorname{Var}(Y\mid X=x)+(m(x)-a)^2$. The cross term vanishes because $E[Y-m(x)\mid X=x]=0$. The conditional variance does not depend on the chosen prediction $a$; the remaining square is minimized at $a=m(x)$.

Thus the best squared-error predictor using $X$ is $m(X)=E[Y\mid X]$. Its MSE is $E[\operatorname{Var}(Y\mid X)]$. More generally, $E[(Y-h(X))^2]=E[\operatorname{Var}(Y\mid X)]+E[(m(X)-h(X))^2]$. The second term measures the extra error from choosing the wrong prediction function. This identity explains why the conditional mean is optimal without assuming it is linear or normal.

For a binary response with conditional success probability $p(x)$, the optimal real-valued squared-error prediction is $p(x)$, even though the observed response is zero or one. Predicting a hard class label is a different decision problem. For a numeric response with conditional mean four and conditional variance nine, predicting four gives conditional MSE nine, while predicting six gives $9+(4-6)^2=13$.

The residual $R=Y-m(X)$ has conditional mean zero. Consequently $E[R h(X)]=0$ for square-integrable functions $h(X)$: condition on $X$, take out the known factor, and average again. This is a probabilistic counterpart of orthogonal residuals in least squares. It does not generally imply residual independence; the residual spread can still depend on $X$.

Without observing $X$, the best constant predictor is $E[Y]$, with MSE $\operatorname{Var}(Y)$. Observing $X$ reduces the optimal MSE by $\operatorname{Var}(E[Y\mid X])$, according to total variance. Information that changes only conditional spread but not the conditional mean does not improve the best squared-error point prediction, even though it remains useful for describing uncertainty.`,
  [mse, ce],
  [
    termEntry(
      'conditional-mean-prediction',
      'Conditional mean prediction',
      'The best prediction under expected squared-error loss.',
      r`The minimizer of $E[(Y-h(X))^2]$ is $h(X)=E[Y\mid X]$.`,
      r`For conditional mean four and variance nine, predicting six has MSE thirteen.`,
      `Optimality depends on the loss; the mean is not automatically optimal for every prediction objective.`,
    ),
  ],
);
s4.questions = [
  q(
    r`A conditional response has mean four and variance nine. What prediction minimizes squared error?`,
    r`Predict its conditional mean, $4$.`,
    exact('4'),
  ),
  q(
    r`A conditional response has mean four and variance nine. Find the MSE of prediction six.`,
    r`$9+(4-6)^2=13$.`,
    exact('13'),
  ),
  q(
    r`A conditional response has mean four and variance nine. Find the minimum possible MSE.`,
    r`At the conditional mean, the extra square vanishes; minimum MSE is $9$.`,
    exact('9'),
  ),
  q(
    r`A binary response has conditional success probability $3/10$. Give its optimal real-valued squared-error prediction.`,
    r`The conditional mean is its success probability, $3/10$.`,
    exact('3/10'),
  ),
  q(
    r`A binary response has conditional success probability $3/10$. Find the minimum conditional MSE.`,
    r`Its conditional variance is $(3/10)(7/10)=21/100$.`,
    exact('21/100'),
  ),
  q(
    r`The average conditional variance is three. A predictor differs from the conditional mean by exactly two for every input. Find its MSE.`,
    r`$3+E[2^2]=7$.`,
    exact('7'),
  ),
  q(
    r`If $E[Y\mid X=x]=x^2+1$, give the squared-error optimal prediction at $x=3$.`,
    r`$3^2+1=10$.`,
    exact('10'),
  ),
  q(
    r`For residual $R=Y-E[Y\mid X]$ with finite second moments, find $E[R]$.`,
    r`Total expectation gives $E[R]=E[Y]-E[E[Y\mid X]]=0$.`,
    exact('0'),
  ),
  q(
    r`Explain why a zero conditional residual mean does not imply independent residuals and inputs.`,
    r`The conditional residual variance or shape can depend on the input even when each conditional mean is zero. Independence would require the whole conditional residual distribution to be unchanged.`,
  ),
  q(
    r`Derive the conditional squared-error decomposition for a fixed prediction $a$.`,
    r`Write $Y-a=(Y-m)+(m-a)$ with $m=E[Y\mid X=x]$. Expand the square. The cross term has conditional expectation zero, leaving $\operatorname{Var}(Y\mid X=x)+(m-a)^2$.`,
    undefined,
    'prove',
  ),
];
s4.review = [
  q(
    r`A response has conditional mean $-2$ and conditional variance five. Find the MSE of prediction one.`,
    r`$5+(-2-1)^2=14$.`,
    exact('14'),
  ),
  q(
    r`A binary response has success probability $4/5$. Find the squared-error loss averaged over outcomes when predicting $1/2$.`,
    r`The minimum variance is $4/25$, and the extra square is $(4/5-1/2)^2=9/100$. Total MSE is $1/4$.`,
    exact('1/4'),
  ),
  q(
    r`If the variance of $Y$ is eleven and that of $E[Y\mid X]$ is seven, find the optimal prediction MSE using $X$.`,
    r`Total variance gives average conditional variance $11-7=4$, which is the optimal MSE.`,
    exact('4'),
  ),
];
const s5 = section(
  'Use conditioning to analyze random workloads',
  r`A random sum is a useful setting where conditioning removes a moving boundary. Let $N$ be a nonnegative integer-valued count, and let $W_1,W_2,\ldots$ be independent identically distributed contributions, independent of $N$. Assume finite second moments for $N$ and the contributions. Define $S=\sum_{i=1}^N W_i$, with an empty sum equal to zero. Write $E[W_i]=\mu$ and $\operatorname{Var}(W_i)=v$.

Given $N=n$, the sum has a fixed number of independent terms, so $E[S\mid N=n]=n\mu$ and $\operatorname{Var}(S\mid N=n)=nv$. Total expectation and variance now give $E[S]=\mu E[N]$ and $\operatorname{Var}(S)=vE[N]+\mu^2\operatorname{Var}(N)$. The two contributions describe variability within a fixed count and variability of the count itself.

Suppose a batch has mean request count five and count variance two. Independent processing contributions, also independent of the count, have mean three and variance four. The total workload has mean fifteen and variance $4(5)+3^2(2)=38$. Replacing the count by its mean would retain only the within-count contribution twenty, discarding the extra eighteen.

The assumptions matter. If large batches systematically contain larger requests, the contribution distribution depends on $N$; then $E[S\mid N=n]$ need not be $n\mu$. The general conditioning identities remain true, but the simplified random-sum formulas must be replaced by the correct conditional moments. Similarly, a stopping rule based on observed contributions is not automatically covered by independence from $N$.

Conditioning also clarifies how information can reveal volatility. Suppose a rare regime has probability $1/10$; in that regime a response is $-10$ or $10$ equally likely, while outside it the response is zero. All conditional means are zero. The unconditional variance is ten, but in the rare regime it is one hundred. The average conditional variance is still ten. This concrete case separates the valid average reduction statement from the false claim that every observation must reduce uncertainty.

These formulas describe an assumed joint model. In real prediction work its conditional means and variances usually must be learned from data, adding estimation error to the ideal calculations. Keeping that distinction clear prevents confusing an optimal predictor under a known model with a fitted predictor whose model may be inaccurate.`,
  [ce, mse],
  [
    termEntry(
      'random-sum-variance',
      'Random sum moments',
      'Separate randomness in count from randomness in each contribution.',
      r`For iid contributions independent of $N$, $E[S]=\mu E[N]$ and $\operatorname{Var}(S)=vE[N]+\mu^2\operatorname{Var}(N)$.`,
      r`Count moments five and two, contribution moments three and four, give total mean fifteen and variance thirty-eight.`,
      `A data-dependent stopping count need not satisfy the independence assumption.`,
    ),
  ],
);
s5.questions = [
  q(
    r`A count $N$ has mean five and variance two. Iid contributions independent of $N$ have mean three and variance four. Find the random sum's mean.`,
    r`$3E[N]=3(5)=15$.`,
    exact('15'),
  ),
  q(
    r`For count mean five/variance two and iid contributions independent of the count with mean three/variance four, find total variance.`,
    r`$4(5)+3^2(2)=38$.`,
    exact('38'),
  ),
  q(
    r`If $N$ has mean four and variance four, and iid independent-of-count contributions have mean two and variance three, find the sum's variance.`,
    r`$3(4)+2^2(4)=28$.`,
    exact('28'),
  ),
  q(
    r`A random count has mean ten and variance six. Every contribution is the constant two. Find the total variance.`,
    r`The total is $2N$, so variance is $4(6)=24$.`,
    exact('24'),
  ),
  q(
    r`A random count has mean seven. Iid contributions independent of it have mean zero and variance three; the count has finite second moment. Find the sum's variance.`,
    r`The count-variation term is zero, leaving $3E[N]=21$.`,
    exact('21'),
  ),
  q(
    r`A rare regime has probability $1/10$ and response $-10$ or $10$ equally likely; elsewhere the response is zero. Find its overall variance.`,
    r`The mean is zero and $E[Y^2]=(1/10)(100)=10$, so variance is $10$.`,
    exact('10'),
  ),
  q(
    r`Within a specified regime, a response is $-10$ or $10$ equally likely. Find its conditional variance.`,
    r`The conditional mean is zero and second moment is one hundred, so variance is $100$.`,
    exact('100'),
  ),
  q(
    r`If $K\mid N=n$ is binomial with parameters $n,1/2$, and $E[N]=6,\operatorname{Var}(N)=4$, find $\operatorname{Var}(K)$.`,
    r`$E[N]/4+\operatorname{Var}(N)/4=6/4+4/4=5/2$.`,
    exact('5/2'),
  ),
  q(
    r`A workload is a sum of $N$ iid contributions, independent of $N$, all with finite second moments. Explain why replacing the random batch size by its mean can preserve the mean workload but lose a variance term.`,
    r`The conditional mean is linear in the count, so averaging yields $\mu E[N]$. But its variation across counts contributes $\mu^2\operatorname{Var}(N)$ to total variance, which a fixed-count approximation omits.`,
  ),
  q(
    r`A process stops as soon as a contribution exceeds a threshold. Explain why the independent-count random-sum formula cannot be applied automatically.`,
    r`The stopping count is determined by the contributions, so it is not independent of them. One must establish suitable conditional moments or a different theorem before using a simplified formula.`,
  ),
];
s5.review = [
  q(
    r`A count has mean three and variance two. Iid contributions independent of it have mean four and variance one. Find total variance.`,
    r`$1(3)+4^2(2)=35$.`,
    exact('35'),
  ),
  q(
    r`If $K\mid N=n$ is binomial with parameters $n,1/3$, and the count has mean nine and variance three, find $E[K]$.`,
    r`$E[K]=E[N]/3=3$.`,
    exact('3'),
  ),
  q(
    r`For the model $K\mid N=n\sim\operatorname{Binomial}(n,1/3)$ with $E[N]=9,\operatorname{Var}(N)=3$, find $\operatorname{Var}(K)$.`,
    r`$(2/9)(9)+(1/9)(3)=2+1/3=7/3$.`,
    exact('7/3'),
  ),
];
s5.quickCheck = quick(
  r`What is missing if total variance is computed using only the average conditional variance?`,
  [
    `Variation among conditional means.`,
    `The square of the overall mean in every case.`,
    `Nothing; the conditional variances always average to the total variance.`,
  ],
  0,
  `Total variance has within-condition and between-conditional-mean terms.`,
  [
    `Correct. The missing term is the variance of the conditional expectation.`,
    `The missing quantity depends on how conditional means vary; it is not simply the square of one overall mean.`,
    `Equality occurs only when the conditional mean is constant with probability one, so it is not automatic.`,
  ],
);
export default lesson(
  13,
  'conditional-expectation',
  'Conditional Expectation',
  r`A conditional distribution can be summarized by a mean and a variance, each depending on available information. We use these summaries to analyze mixtures, predict responses under squared error, and separate sources of workload uncertainty. Expectations require integrability; variance and MSE identities here assume finite second moments.`,
  [s1, s2, s3, s4, s5],
);
