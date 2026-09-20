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
const pdf = citation(
  'pn-4-1-1',
  'pishro-nik',
  '§4.1.1 Probability Density Function',
  'https://www.probabilitycourse.com/chapter4/4_1_1_pdf.php',
  'Density, normalization, interval probability, CDFs, uniform distributions, and density units.',
);
const moments = citation(
  'pn-4-1-2',
  'pishro-nik',
  '§4.1.2 Expected Value and Variance',
  'https://www.probabilitycourse.com/chapter4/4_1_2_expected_val_variance.php',
  'Integral expectations, transformed quantities, variance, and existence of moments.',
);
const exponential = citation(
  'pn-4-2-2',
  'pishro-nik',
  '§4.2.2 Exponential Distribution',
  'https://www.probabilitycourse.com/chapter4/4_2_2_exponential.php',
  'Rate convention, survival probabilities, moments, and memorylessness.',
);
const s1 = section(
  'Probability is area, not height',
  r`A count of failed requests is discrete; the time until a response is often modeled continuously. The measuring device still rounds its readings, but the model assigns probabilities to intervals of underlying times. In this lesson, continuous distributions have a probability density. More exotic continuous distributions are outside our scope.

A **probability density function**, or PDF, is a nonnegative function $f$ with $\int_{-\infty}^{\infty}f(x)\,dx=1$. Its defining job is $P(a<X\le b)=\int_a^b f(x)\,dx$. The area represents probability; the height describes its concentration. If $X$ is measured in seconds, $f(x)$ has units of inverse seconds, so multiplying by a small width produces a dimensionless probability. Where the density varies little across a short interval, $P(x<X\le x+h)\approx f(x)h$. This is an approximation, not a substitute for integration over a long interval.

Consider $f(x)=3x^2$ for $0<x<1$, and zero elsewhere. It is nonnegative and $\int_0^1 3x^2\,dx=1$. Its height near $1$ exceeds $1$, which is permitted. The upper half of its range has probability $\int_{1/2}^1 3x^2\,dx=1-1/8=7/8$. Equal-width intervals need not have equal probabilities.

A single point has zero area: $P(X=c)=0$. Therefore changing finitely many endpoint inclusions does not change interval probabilities. Zero probability is not synonymous with logical impossibility in a continuous model: some individual value is realized even though no specified point has positive probability. An observed rounded value, such as $0.50$ seconds to two decimal places, represents an interval approximately $[0.495,0.505)$, whose probability can be positive. This distinction prevents treating an instrument's displayed values as exact measurements.

The value assigned to a density at one isolated point can be changed without changing any probabilities. For instance, setting the density to zero rather than three at the endpoint one in our polynomial example has no effect on its integrals. A density represents a distribution through area; it is not a table of singleton probabilities.`,
  [pdf],
  [
    termEntry(
      'density',
      'Probability density',
      'Probability per unit of the variable.',
      'A nonnegative function integrating to one whose integral over a region gives its probability.',
      r`$f(x)=3x^2$ on $(0,1)$ integrates to one.`,
      `A density height may exceed one; an event probability may not.`,
    ),
  ],
);
s1.questions = [
  q(
    r`Find $c$ so that $f(x)=c$ on $(0,4)$, zero elsewhere, is a density.`,
    r`Normalization gives $4c=1$, so $c=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Find $c$ for $f(x)=cx^2$ on $(0,2)$, zero elsewhere.`,
    r`$c\int_0^2x^2\,dx=8c/3=1$, so $c=3/8$.`,
    exact('3/8'),
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, find $P(X<1/2)$.`,
    r`$\int_0^{1/2}3x^2\,dx=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, find $P(1/2<X<1)$.`,
    r`The complement of the lower half has probability $1-1/8=7/8$.`,
    exact('7/8'),
  ),
  q(
    r`A variable has a density. Find $P(X=7)$.`,
    r`A singleton has zero area, so $P(X=7)=0$.`,
    exact('0'),
  ),
  q(
    r`True or false: a density equal to $4$ throughout $(0,1/4)$ and zero elsewhere is valid.`,
    r`True. It is nonnegative and its area is $4(1/4)=1$.`,
    truth(true),
    'interpret',
  ),
  q(
    r`True or false: $f(x)=x$ on $(-1,1)$, zero elsewhere, is a density.`,
    r`False. It is negative for negative $x$, and its total integral is zero.`,
    truth(false),
    'interpret',
  ),
  q(
    r`For a uniform density on $(0,1)$, a device reports $0.40$ exactly when $0.395\le X<0.405$. Find the probability of that report.`,
    r`The interval has length $0.405-0.395=0.01=1/100$.`,
    exact('1/100'),
  ),
  q(
    r`Explain why $f(0.8)=1.92$ is compatible with $P(X=0.8)=0$ for density $3x^2$ on $(0,1)$.`,
    r`The first number is probability density, a height; the second is the integral over a singleton, which has width zero. They measure different quantities.`,
  ),
  q(
    r`Construct a nonnegative function integrating to two and explain why it cannot be a density.`,
    r`For example, $f(x)=2$ on $(0,1)$ and zero elsewhere has total area two. It would assign probability two to the entire support, violating normalization.`,
    undefined,
    'construct',
  ),
];
s1.review = [
  q(r`Normalize $f(x)=c(1-x)$ on $(0,1)$.`, r`$\int_0^1c(1-x)\,dx=c/2=1$, so $c=2$.`, exact('2')),
  q(
    r`For density $2$ on $(3,7/2)$, find $P(3<X<13/4)$.`,
    r`The width is $1/4$, so the probability is $2(1/4)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A continuous model assigns zero probability to every point. Does this imply its total probability is zero? Explain.`,
    r`No. Countable additivity applies to countable unions; an interval contains uncountably many points. Its probability is computed by integrating the density.`,
  ),
];
s1.quickCheck = quick(
  r`Which quantity must equal one for a density?`,
  [r`Its largest height`, r`Its integral over the whole real line`, r`Its value at the mean`],
  1,
  `A density is normalized by total area.`,
  [
    `The maximum height depends on scale and may be greater or less than one.`,
    `Correct. The entire outcome range has probability one, represented by this integral.`,
    `The value at the mean is a density height, not total probability.`,
  ],
);
const s2 = section(
  'Move between density and cumulative probability',
  r`The cumulative distribution function retains its earlier definition: $F(x)=P(X\le x)$. For a density model, $F(x)=\int_{-\infty}^x f(t)\,dt$. Its derivative is $f(x)$ wherever the usual differentiation conditions hold. This is the fundamental theorem of calculus applied to probability accumulation. A CDF is nondecreasing, takes values between zero and one, and approaches zero and one at the two ends of the real line.

For density $3x^2$ on $(0,1)$, the full CDF is $F(x)=0$ for $x\le0$, $F(x)=x^3$ for $0<x<1$, and $F(x)=1$ for $x\ge1$. Writing only $x^3$ would incorrectly assign negative or excessive probabilities outside the support. Within the support, $P(1/4<X\le3/4)=F(3/4)-F(1/4)=13/32$. Subtraction removes the accumulation up to the lower endpoint.

A density need not be continuous. Suppose $f(x)=1/4$ on $(0,2)$ and $f(x)=1/2$ on $(2,3)$, with zero elsewhere. Each piece contributes area $1/2$. For $2<x<3$, the CDF is $1/2+(x-2)/2$, including the probability already accumulated before $2$. The CDF remains continuous even though its slope changes. By contrast, a jump of size $p$ in a CDF represents a point mass of probability $p$ and cannot arise from a density alone.

A **quantile** converts a cumulative probability back into a location. When $F$ is strictly increasing on its support, the $p$-quantile solves $F(q_p)=p$. More generally one uses the smallest location at which the CDF reaches the requested level. The median is a half-probability quantile. For the density $3x^2$, $q_p=p^{1/3}$ and the median is $(1/2)^{1/3}$. A quantile has the variable's units; its percentile level is dimensionless.

When a CDF has a flat portion, the equation $F(q)=p$ can have more than one solution at that level. The smallest-location convention selects a definite quantile, but an exercise asking for any median may permit several answers. Our direct quantile computations use strictly increasing portions so the requested threshold is unique.`,
  [
    pdf,
    citation(
      'pn-4-2-3',
      'pishro-nik',
      '§4.2.3 Normal (Gaussian) Distribution',
      'https://www.probabilitycourse.com/chapter4/4_2_3_normal.php',
      'Normal density, mean/variance convention, standardization, CDF symmetry, and probability calculations.',
    ),
  ],
  [
    termEntry(
      'continuous-cdf',
      'Continuous CDF',
      'Accumulated probability up to a location.',
      r`For a density $f$, $F(x)=\int_{-\infty}^x f(t)\,dt$.`,
      r`Density $3x^2$ on $(0,1)$ gives $F(x)=x^3$ there.`,
      `The CDF is an area, not the density height.`,
    ),
    termEntry(
      'quantile',
      'Quantile',
      'A location corresponding to a cumulative probability.',
      r`For a strictly increasing continuous CDF, $F(q_p)=p$.`,
      r`A uniform $(0,8)$ variable has $q_{0.75}=6$.`,
      `A percentile level and its quantile have different units.`,
    ),
  ],
);
s2.questions = [
  q(
    r`For density $4x^3$ on $(0,1)$, give $F(x)$ for $0<x<1$.`,
    r`$F(x)=\int_0^x4t^3\,dt=x^4$.`,
    calc('x^4', ['x']),
  ),
  q(
    r`For density $4x^3$ on $(0,1)$, find $F(2)$.`,
    r`The entire support lies below two, so $F(2)=1$.`,
    exact('1'),
  ),
  q(
    r`A continuous CDF is $F(x)=x^2/9$ on $(0,3)$. Give its density on that interval.`,
    r`Differentiating gives $f(x)=2x/9$.`,
    calc('2*x/9', ['x']),
  ),
  q(
    r`For $F(x)=x^2/9$ on $(0,3)$, with zero/one extensions, find $P(1<X<2)$.`,
    r`$F(2)-F(1)=4/9-1/9=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`For the CDF $F(x)=x^2/9$ on $(0,3)$, zero below and one above, find the $4/9$-quantile.`,
    r`Solve $q^2/9=4/9$ in $[0,3]$ to obtain $q=2$.`,
    exact('2'),
  ),
  q(
    r`A density is $1/4$ on $(0,2)$ and $1/2$ on $(2,3)$, zero elsewhere. Find $F(5/2)$.`,
    r`$F(5/2)=1/2+(1/2)(1/2)=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`A density is $1/4$ on $(0,2)$ and $1/2$ on $(2,3)$, zero elsewhere. Give $F(x)$ for $2<x<3$.`,
    r`Earlier accumulation plus the new area gives $F(x)=1/2+(x-2)/2=(x-1)/2$.`,
    calc('(x-1)/2', ['x']),
  ),
  q(
    r`True or false: a CDF that jumps from $0.3$ to $0.5$ at zero belongs to a density-only model.`,
    r`False. The jump assigns point mass $0.2$ to zero.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why differentiating a CDF only on open intervals can miss information when the CDF has jumps.`,
    r`Derivatives on the intervals describe the continuous accumulation but omit the jump masses. A complete distribution must also record those jumps.`,
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, derive and give its median exactly.`,
    r`The median $m$ solves $m^3=1/2$, hence $m=(1/2)^{1/3}$.`,
    calc('(1/2)^(1/3)'),
  ),
];
s2.review = [
  q(
    r`A density is $1/3$ on $(0,1)$ and $2/3$ on $(1,2)$, zero elsewhere. Find $F(3/2)$.`,
    r`$F(3/2)=1/3+(2/3)(1/2)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For $F(x)=(x/4)^2$ on $(0,4)$, find the $9/16$-quantile.`,
    r`$q^2/16=9/16$ gives $q=3$ within the support.`,
    exact('3'),
  ),
  q(
    r`Explain why a proposed CDF $1-x$ on $(0,1)$ cannot describe a distribution.`,
    r`It decreases as the threshold increases. The events $\{X\le x\}$ grow with $x$, so their probabilities cannot decrease.`,
  ),
];
const s3 = section(
  'Compute expectations by integration',
  r`Discrete expectation adds value times probability. Continuous expectation uses the corresponding weighted integral, $E[X]=\int_{-\infty}^{\infty}xf(x)\,dx$, provided it exists. For a finite real expectation it is sufficient and standard to require $E[|X|]<\infty$. Positive and negative infinite contributions must not be canceled by a symmetric principal value. An expectation can fail to exist even when the density integrates to one.

To average a function of the outcome, use $E[g(X)]=\int g(x)f(x)\,dx$. This is the continuous version of the expectation rule from discrete random variables. You do not need the full distribution of $g(X)$ just to calculate its expectation. For $f(x)=3x^2$ on $(0,1)$, $E[X]=\int_0^13x^3\,dx=3/4$ and $E[X^2]=\int_0^13x^4\,dx=3/5$. Thus $\operatorname{Var}(X)=E[X^2]-E[X]^2=3/80$. Squaring the mean is different from averaging the square.

The familiar affine rules continue to hold: $E[aX+b]=aE[X]+b$ and $\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$ when the relevant moments are finite. They follow from linearity and centering, not from a special distribution. A change from seconds to milliseconds multiplies variance by a million because variance carries squared units.

A model can have a finite mean but infinite variance. The density $f(x)=2/x^3$ for $x\ge1$ has total integral one and mean $2$. However, its second moment is $\int_1^\infty2/x\,dx$, which diverges. Consequently its variance is infinite. This example matters later: a finite mean can support laws about averages, while the usual finite-variance central limit theorem needs more. Always check the improper integral before applying a formula that presumes its finiteness.

Symmetry can simplify a calculation only after existence is established. A symmetric distribution with finite absolute first moment has mean at its center because equal deviations cancel in an absolutely convergent integral. A symmetric heavy-tailed density can instead have undefined mean; visual balance alone does not establish convergence of the required integral.`,
  [moments],
  [
    termEntry(
      'continuous-expectation',
      'Integral expectation',
      'An average weighted by density.',
      r`$E[g(X)]=\int g(x)f_X(x)\,dx$ when the expectation exists.`,
      r`With density $4x^3$ on $(0,1)$, $E[X]=4/5$.`,
      `Usually $E[g(X)]\ne g(E[X])$.`,
    ),
  ],
);
s3.questions = [
  q(r`For density $4x^3$ on $(0,1)$, find $E[X]$.`, r`$E[X]=\int_0^14x^4\,dx=4/5$.`, exact('4/5')),
  q(
    r`For density $4x^3$ on $(0,1)$, find $E[X^2]$.`,
    r`$E[X^2]=\int_0^14x^5\,dx=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For density $4x^3$ on $(0,1)$, find $\operatorname{Var}(X)$.`,
    r`$2/3-(4/5)^2=2/75$.`,
    exact('2/75'),
  ),
  q(
    r`For density $2(1-x)$ on $(0,1)$, find $E[X]$.`,
    r`$\int_0^1 2x(1-x)\,dx=1-2/3=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`For density $2(1-x)$ on $(0,1)$, find $E[X^2]$.`,
    r`$\int_0^12x^2(1-x)\,dx=2/3-1/2=1/6$.`,
    exact('1/6'),
  ),
  q(r`For density $3x^2$ on $(0,1)$, find $E[8X-2]$.`, r`$8(3/4)-2=4$.`, exact('4')),
  q(
    r`For density $3x^2$ on $(0,1)$, find $\operatorname{Var}(4X+7)$.`,
    r`The variance is $16(3/80)=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, find $E[1/X]$.`,
    r`$\int_0^1(1/x)3x^2\,dx=\int_0^13x\,dx=3/2$. The endpoint singularity is integrable.`,
    exact('3/2'),
  ),
  q(
    r`For density $2/x^3$ on $[1,\infty)$, explain why a finite mean does not imply finite variance.`,
    r`The mean integral is $\int_1^\infty2/x^2\,dx=2$, but the second-moment integral $\int_1^\infty2/x\,dx$ diverges. Hence the variance is infinite.`,
  ),
  q(
    r`Derive $\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$ when $E[X^2]<\infty$.`,
    r`Subtract the mean: $aX+b-E[aX+b]=a(X-E[X])$. Squaring and taking expectation gives $a^2E[(X-E[X])^2]=a^2\operatorname{Var}(X)$.`,
    undefined,
    'prove',
  ),
];
s3.review = [
  q(r`For density $5x^4$ on $(0,1)$, find $E[X]$.`, r`$\int_0^15x^5\,dx=5/6$.`, exact('5/6')),
  q(
    r`For density $2(1-x)$ on $(0,1)$, find $\operatorname{Var}(X)$.`,
    r`$E[X^2]-E[X]^2=1/6-1/9=1/18$.`,
    exact('1/18'),
  ),
  q(
    r`For density $4/x^5$ on $[1,\infty)$, find $E[X^2]$.`,
    r`$\int_1^\infty4/x^3\,dx=2$.`,
    exact('2'),
  ),
];
const s4 = section(
  'Uniform models and interval conditioning',
  r`A uniform distribution on $(a,b)$, written $X\sim\operatorname{Uniform}(a,b)$ with $a<b$, assigns a constant density $1/(b-a)$ there and zero outside. Probabilities are lengths divided by the total length, after intersecting the requested event with the support. Uniformity is a modeling assumption about equal-length intervals; bounded measurements are not automatically uniform.

Direct integration gives $E[X]=(a+b)/2$ and $\operatorname{Var}(X)=(b-a)^2/12$. One efficient variance derivation first centers the interval: $X-(a+b)/2$ is uniform on $(-h,h)$ with $h=(b-a)/2$, so its second moment is $(1/(2h))\int_{-h}^h t^2\,dt=h^2/3$. The square of the interval width, rather than its location, controls the variance.

Suppose a randomized delay is uniform between $2$ and $8$ seconds. Then $P(4<X<7)=3/6=1/2$, its mean is $5$ seconds, and its variance is $36/12=3$ squared seconds. Asking for $P(X<3\mid X<5)$ changes the available outcomes: the numerator is the length from $2$ to $3$, while the denominator is the length from $2$ to $5$. The answer is $1/3$, not $1/6$.

Conditioning on a positive-probability interval truncates a density and renormalizes it. For $A=\{c<X<d\}$ with $P(A)>0$, the conditional density on that interval is $f(x)/P(A)$, and it is zero elsewhere. A uniform density remains uniform on the remaining interval. A nonuniform density retains its relative shape, multiplied by the normalizing factor.

If the retained event is a union of separated intervals, the same normalization rule applies, but the conditional distribution is supported on that union. It should not be replaced by a uniform distribution on the span from its smallest to largest retained value: that span may contain excluded outcomes. This uses ordinary event conditioning, not conditioning on a zero-probability point; the latter will be handled through joint densities in a later lesson.`,
  [
    pdf,
    citation(
      'pn-5-2-3',
      'pishro-nik',
      '§5.2.3 Conditioning and Independence',
      'https://www.probabilitycourse.com/chapter5/5_2_3_conditioning_independence.php',
      'Truncation, conditional densities, positive-density denominators, and independence.',
    ),
  ],
  [
    termEntry(
      'uniform-continuous',
      'Continuous uniform distribution',
      'Equal-length intervals have equal probabilities within the support.',
      r`$f(x)=1/(b-a)$ on $(a,b)$ for $a<b$.`,
      r`For $X\sim\operatorname{Uniform}(2,8)$, $E[X]=5$.`,
      `A bounded range alone does not justify uniformity.`,
    ),
  ],
);
s4.questions = [
  q(
    r`For $X\sim\operatorname{Uniform}(-2,4)$, find $E[X]$.`,
    r`The midpoint is $(-2+4)/2=1$.`,
    exact('1'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(-2,4)$, find its variance.`,
    r`The width is six, so $\operatorname{Var}(X)=6^2/12=3$.`,
    exact('3'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(-2,4)$, find $P(-5<X<1)$.`,
    r`Intersect with the support: the interval $(-2,1)$ has length three. The probability is $3/6=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(2,8)$, find $P(X>6\mid X>4)$.`,
    r`The retained lengths give $2/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(2,8)$, find $E[X\mid X>4]$.`,
    r`The conditional distribution is uniform on $(4,8)$, whose midpoint is $6$.`,
    exact('6'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(2,8)$, find $\operatorname{Var}(X\mid X>4)$.`,
    r`The retained width is four, so the variance is $16/12=4/3$.`,
    exact('4/3'),
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, give the conditional density for $1/2<x<1$ given $X>1/2$.`,
    r`Divide by $P(X>1/2)=7/8$ to obtain $24x^2/7$. It is zero outside the retained interval.`,
    calc('24*x^2/7', ['x']),
  ),
  q(
    r`For density $3x^2$ on $(0,1)$, find $P(X<3/4\mid X>1/2)$.`,
    r`The numerator is $27/64-1/8=19/64$, and the denominator is $7/8$, giving $19/56$.`,
    exact('19/56'),
  ),
  q(
    r`A wait must lie between zero and ten minutes. Explain why this does not determine its distribution.`,
    r`The support specifies possible values, but many different densities fit it. Constant, increasing, decreasing, or multimodal densities give different interval probabilities.`,
  ),
  q(
    r`Show that conditioning a uniform $(a,b)$ variable on $c<X<d$, with $a\le c<d\le b$, produces a uniform $(c,d)$ variable.`,
    r`The event has probability $(d-c)/(b-a)$. Dividing $1/(b-a)$ by that probability gives the constant density $1/(d-c)$ on $(c,d)$ and zero elsewhere.`,
    undefined,
    'prove',
  ),
];
s4.review = [
  q(
    r`A uniform $(1,7)$ variable is conditioned on $X<4$. Find the conditional mean.`,
    r`The retained uniform interval is $(1,4)$, with mean $5/2$.`,
    exact('5/2'),
  ),
  q(
    r`A uniform $(0,9)$ variable is conditioned on $X>3$. Find $P(X<5\mid X>3)$.`,
    r`The retained interval has length six; its part below five has length two. The result is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Find the variance of a uniform variable on $(10,12)$.`,
    r`The width is two, so the variance is $4/12=1/3$.`,
    exact('1/3'),
  ),
];
const s5 = section(
  'Exponential waiting times and their limitations',
  r`An exponential model uses a rate $\lambda>0$ and density $f(t)=\lambda e^{-\lambda t}$ for $t\ge0$, zero for negative times. We write $T\sim\operatorname{Exponential}(\lambda)$, always using the **rate** convention. If time is in minutes, the rate is in inverse minutes. Some books parameterize by the mean instead, so identifying the convention is part of reading a model.

Integration gives $F(t)=1-e^{-\lambda t}$ for $t\ge0$. Its complement $S(t)=P(T>t)=e^{-\lambda t}$ is the **survival function**. It measures remaining probability beyond a threshold, regardless of whether the application involves survival. Integration by parts gives $E[T]=1/\lambda$ and $E[T^2]=2/\lambda^2$, hence $\operatorname{Var}(T)=1/\lambda^2$. A larger rate means a shorter typical wait.

For a service model with rate $1/4$ per minute, the mean is four minutes and $P(T>6)=e^{-3/2}$. The probability of finishing between two and six minutes is $e^{-1/2}-e^{-3/2}$. To find the median, solve $1-e^{-m/4}=1/2$, giving $m=4\ln2$. The mean and median differ because the distribution is skewed.

For $s,t\ge0$, $P(T>s+t\mid T>s)=e^{-\lambda(s+t)}/e^{-\lambda s}=e^{-\lambda t}$. This is **memorylessness**: after an unfinished wait, the additional wait has the original distribution. It is a property of the exponential model, not a universal fact about queues, hardware, or human response times.

Memorylessness also implies $E[T-s\mid T>s]=1/\lambda$ and hence $E[T\mid T>s]=s+1/\lambda$. The additional expected wait and the total expected elapsed time are different quantities. At rate $1/4$, an unfinished five-minute wait has expected additional duration four minutes and expected total duration nine minutes. A scheduled arrival, a timeout, or equipment whose failure rate changes with age can violate it.

An exponential model assigns positive probability to arbitrarily long waits. Before using it, connect this mathematical tail to the application. A system that deterministically terminates every request at a fixed deadline needs a different model for its observed duration, potentially including a point mass at that deadline.`,
  [exponential, pdf],
  [
    termEntry(
      'exponential-rate',
      'Exponential rate',
      'The reciprocal of the mean exponential waiting time.',
      r`For rate $\lambda>0$, $P(T>t)=e^{-\lambda t}$ for $t\ge0$.`,
      r`Rate $1/4$ per minute gives mean four minutes.`,
      `Rate and mean parameterizations are reciprocals.`,
    ),
    termEntry(
      'memorylessness-continuous',
      'Exponential memorylessness',
      'The remaining wait has the original distribution.',
      r`$P(T>s+t\mid T>s)=P(T>t)$ for $s,t\ge0$.`,
      r`An extra two-minute wait has probability $e^{-2\lambda}$ even after waiting five minutes.`,
      `The property depends on the model; past waiting is not universally irrelevant.`,
    ),
  ],
);
s5.questions = [
  q(
    r`An exponential waiting time has rate $2$ per hour. Find its mean in hours.`,
    r`$E[T]=1/2$ hour.`,
    exact('1/2'),
  ),
  q(
    r`For exponential rate $2$ per hour, find its variance in squared hours.`,
    r`$\operatorname{Var}(T)=1/2^2=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`For exponential rate $2$, find $P(T>3)$ exactly.`,
    r`The survival probability is $e^{-2(3)}=e^{-6}$.`,
    calc('exp(-6)'),
  ),
  q(
    r`For exponential rate $1/3$, find $P(T\le6)$ exactly.`,
    r`$F(6)=1-e^{-6/3}=1-e^{-2}$.`,
    calc('1-exp(-2)'),
  ),
  q(
    r`For exponential rate $1/2$, find $P(2<T<6)$.`,
    r`Subtract tails: $e^{-1}-e^{-3}$.`,
    calc('exp(-1)-exp(-3)'),
  ),
  q(
    r`For exponential rate $1/2$, find $P(T>9\mid T>5)$.`,
    r`The additional wait is four units, so the probability is $e^{-4/2}=e^{-2}$.`,
    calc('exp(-2)'),
  ),
  q(
    r`Find the median of an exponential variable with rate $3$.`,
    r`Solve $e^{-3m}=1/2$ to get $m=\ln2/3$.`,
    calc('ln(2)/3'),
  ),
  q(
    r`An exponential waiting time has mean five seconds. Find its rate in inverse seconds.`,
    r`The rate is the reciprocal mean, $1/5$.`,
    exact('1/5'),
  ),
  q(
    r`For exponential rate $1/4$, give the $3/4$-quantile exactly.`,
    r`$1-e^{-q/4}=3/4$ implies $q=4\ln4$.`,
    calc('4*ln(4)'),
  ),
  q(
    r`A job is guaranteed to finish within ten minutes. Explain why its exact duration cannot have an exponential distribution.`,
    r`Every exponential distribution with positive finite rate has $P(T>10)=e^{-10\lambda}>0$. This conflicts with the guaranteed upper bound.`,
  ),
];
s5.review = [
  q(
    r`For exponential rate $1/5$, find $P(T>12\mid T>7)$.`,
    r`Memorylessness leaves a five-unit wait, with probability $e^{-1}$.`,
    calc('exp(-1)'),
  ),
  q(r`For exponential rate $4$, find $E[T^2]$.`, r`$E[T^2]=2/4^2=1/8$.`, exact('1/8')),
  q(
    r`An exponential model has mean eight minutes. Find its median.`,
    r`The rate is $1/8$, so the median is $8\ln2$ minutes.`,
    calc('8*ln(2)'),
  ),
];
s5.quickCheck = quick(
  r`An exponential wait has already lasted five minutes. What does memorylessness describe?`,
  [
    `The total elapsed time resets to zero.`,
    `The distribution of the additional wait matches the original waiting-time distribution.`,
    `The event must happen during the next five minutes.`,
  ],
  1,
  `Memorylessness is a statement about conditional distributions of the remaining wait.`,
  [
    `Elapsed time remains five minutes; the property concerns future waiting, not recorded time.`,
    `Correct. Conditioning on no event yet leaves the same distribution for the additional waiting time.`,
    `The exponential tail remains positive beyond every finite additional duration; there is no deadline.`,
  ],
);
// A cheap calculus/probability bridge; moment calculations retain production evidence.
s3.review.push(
  q(
    r`True or false: for a density f with finite first absolute moment, $E[X]=\int_{-\infty}^{\infty}x f(x)\,dx$.`,
    'True. Expectation weights each value by its density before accumulating over the support.',
    truth(true),
    'recall',
  ),
  q(
    r`True or false: integrating a probability density alone over its full support always gives the expected value of X.`,
    'False. The integral of the density is one. Expectation instead integrates x times the density, when it exists.',
    truth(false),
    'recall',
  ),
);
export default lesson(
  9,
  'continuous-random-variables',
  'Continuous Random Variables',
  r`Continuous probability turns the accumulation tools of calculus into models for times, positions, and measurements. We will connect densities to CDFs, compute moments, and examine uniform and exponential models while keeping their assumptions visible.`,
  [s1, s2, s3, s4, s5],
);
