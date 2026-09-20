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
  approx,
  quick,
} from './helpers.mjs';
const normal = citation(
  'pn-4-2-3',
  'pishro-nik',
  '§4.2.3 Normal (Gaussian) Distribution',
  'https://www.probabilitycourse.com/chapter4/4_2_3_normal.php',
  'Normal density, mean/variance convention, standardization, CDF symmetry, and probability calculations.',
);
const transforms = citation(
  'pn-4-1-3',
  'pishro-nik',
  '§4.1.3 Functions of Continuous Random Variables',
  'https://www.probabilitycourse.com/chapter4/4_1_3_functions_continuous_var.php',
  'CDF transformations, inverse derivatives, multiple branches, and transformations that create point masses.',
);
const s1 = section(
  'Normal models have a location and a scale',
  r`The normal, or Gaussian, distribution is a continuous model with a symmetric bell-shaped density. We write $X\sim N(\mu,\sigma^2)$, where the second argument is the **variance**, and $\sigma>0$ is the standard deviation. This convention must be checked when moving between books or software; writing $N(10,9)$ here means mean ten and standard deviation three.

The density is $f_X(x)=\frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$ for all real $x$. The constant ensures total area one. The exponent depends on squared distance from the mean in standard-deviation units. Moving $\mu$ shifts the curve without changing its spread. Increasing $\sigma$ spreads probability over a wider range, so the peak height decreases. The normal curve extends indefinitely in both directions; it does not have a hard cutoff at three standard deviations.

The standard normal variable $Z\sim N(0,1)$ is the common reference. Every normal variable can be represented as $X=\mu+\sigma Z$. Linearity gives $E[X]=\mu$ and the variance scaling rule gives $\operatorname{Var}(X)=\sigma^2$. Conversely, $Z=(X-\mu)/\sigma$ has a standard normal distribution. Subtracting the mean centers the variable; dividing by the standard deviation removes its units.

For $X\sim N(30,16)$, the value $38$ has standardized score $(38-30)/4=2$. A value of $26$ has score $-1$. These scores locate measurements on the common curve; they are not probabilities. A negative score means below the mean, not a negative chance.

A density also has a useful scale check. At the mean its value is $1/(\sigma\sqrt{2\pi})$, so a density written with variance in place of standard deviation in that prefactor will generally fail normalization. The same distinction appears in the exponent, where the denominator contains twice the variance. Labeling the parameters before substitution prevents both errors.

Normality is an assumption about the distribution's shape. Standardizing an arbitrary variable with finite positive variance gives mean zero and variance one, but does not make it normal. In particular, standardized Bernoulli values still occupy only two locations. This distinction will be essential when we later approximate sample means.`,
  [normal],
  [
    termEntry(
      'normal-distribution',
      'Normal distribution',
      'A symmetric continuous distribution specified by mean and variance.',
      r`$N(\mu,\sigma^2)$ has mean $\mu$ and standard deviation $\sigma>0$.`,
      r`$N(30,16)$ has standard deviation four.`,
      `The second argument here is variance, not standard deviation.`,
    ),
    termEntry(
      'standardization',
      'Standardization',
      'Center a variable and measure it in standard-deviation units.',
      r`$Z=(X-\mu)/\sigma$ for finite mean and positive finite standard deviation.`,
      r`$38$ has score $2$ under $N(30,16)$.`,
      `Standardizing does not by itself produce normality.`,
    ),
  ],
);
s1.questions = [
  q(
    r`If $X\sim N(12,25)$, find its standard deviation.`,
    r`The variance is $25$, so the standard deviation is $\sqrt{25}=5$.`,
    exact('5'),
  ),
  q(r`Under $N(12,25)$, find the standardized score of $22$.`, r`$(22-12)/5=2$.`, exact('2')),
  q(r`Under $N(12,25)$, find the standardized score of $7$.`, r`$(7-12)/5=-1$.`, exact('-1')),
  q(
    r`A normal variable has mean $8$ and standard deviation $3$. Give its variance.`,
    r`The variance is $3^2=9$.`,
    exact('9'),
  ),
  q(
    r`For $Z\sim N(0,1)$ and $X=7+2Z$, give $(E[X],\operatorname{Var}(X))$.`,
    r`The mean is $7$ and variance is $2^2=4$, so $(7,4)$.`,
    tuple(['7', '4']),
  ),
  q(
    r`Under $N(40,9)$, what measurement has standardized score $-2$?`,
    r`$x=40+3(-2)=34$.`,
    exact('34'),
  ),
  q(
    r`True or false: every variable with mean zero and variance one is standard normal.`,
    r`False. A variable taking $-1$ and $1$ with equal probabilities has those moments but is discrete.`,
    truth(false),
    'interpret',
  ),
  q(
    r`For $X\sim N(0,4)$, give the density height $f_X(0)$ exactly.`,
    r`The standard deviation is two, giving $f_X(0)=1/(2\sqrt{2\pi})$.`,
    calc('1/(2*sqrt(2*pi))'),
  ),
  q(
    r`Explain how doubling the standard deviation changes the height of a normal density at its mean.`,
    r`The peak is $1/(\sigma\sqrt{2\pi})$, so doubling $\sigma$ halves that height while preserving total area.`,
  ),
  q(
    r`A duration is always positive. Explain a limitation of modeling it exactly by a nondegenerate normal distribution.`,
    r`A normal distribution gives positive probability to every nonempty interval, including negative durations. It may approximate a distribution far from zero, but cannot exactly respect the positive support.`,
  ),
];
s1.review = [
  q(
    r`A normal variable has variance $49$. What is its standard deviation?`,
    r`$\sqrt{49}=7$.`,
    exact('7'),
  ),
  q(r`Under $N(-4,16)$, find the standardized score of $2$.`, r`$(2+4)/4=3/2$.`, exact('3/2')),
  q(
    r`For $Z\sim N(0,1)$ and $X=-3+5Z$, give its mean and variance in that order.`,
    r`$E[X]=-3$ and $\operatorname{Var}(X)=25$, giving $(-3,25)$.`,
    tuple(['-3', '25']),
  ),
];
const s2 = section(
  'Use the normal CDF without confusing tails',
  r`Let $\Phi(z)=P(Z\le z)$ for a standard normal variable. Unlike the polynomial densities from the previous lesson, its defining integral has no elementary antiderivative. Numerical tables or evaluated CDF values are therefore normal tools, not a failure of calculus. In this material, any exercise that needs a numerical normal value supplies it and states the requested precision.

The function $\Phi$ accumulates from the left. For example, using $\Phi(1.5)\approx0.9332$, the right-tail probability is $P(Z>1.5)\approx1-0.9332=0.0668$. Symmetry gives $\Phi(-z)=1-\Phi(z)$, while $\Phi(0)=1/2$. Therefore $P(-1.5<Z<1.5)\approx0.9332-0.0668=0.8664$. Two tails outside a symmetric interval have total probability $2[1-\Phi(z)]$ for positive $z$.

For $X\sim N(\mu,\sigma^2)$, rewrite the event before using the table: $P(a<X<b)=\Phi((b-\mu)/\sigma)-\Phi((a-\mu)/\sigma)$. Because $\sigma>0$, standardization preserves inequality direction. For $X\sim N(50,100)$, the interval $40<X<65$ becomes $-1<Z<1.5$. With $\Phi(1)=0.8413$ and $\Phi(1.5)=0.9332$, its probability is approximately $0.9332-(1-0.8413)=0.7745$.

Sketching the requested region on a number line often prevents choosing the wrong tail. First mark the mean and threshold, then decide whether the answer should be below or above one half. A threshold above the mean has a left-tail probability above one half and a right-tail probability below one half. For an interval, check that the result is nonnegative and no larger than either appropriate one-sided bound. Carry the supplied digits through the calculation and round once at the end; the reported answer is an approximation to the model probability, not an exact rational claim.`,
  [normal],
  [
    termEntry(
      'normal-cdf',
      'Standard normal CDF',
      r`$\Phi(z)$ is the standard normal left-tail probability.`,
      r`$\Phi(z)=P(Z\le z)$ for $Z\sim N(0,1)$.`,
      r`$\Phi(-z)=1-\Phi(z)$.`,
      `A right-tail probability is $1-\Phi(z)$.`,
    ),
  ],
);
s2.questions = [
  q(
    r`Use $\Phi(1)=0.8413$ to approximate $P(Z>1)$ to four decimal places for standard normal $Z$.`,
    r`$1-0.8413=0.1587$.`,
    probability('0.1587'),
  ),
  q(
    r`Use $\Phi(2)=0.9772$ to approximate $P(Z<-2)$ to four decimal places.`,
    r`By symmetry, $1-0.9772=0.0228$.`,
    probability('0.0228'),
  ),
  q(
    r`Use $\Phi(2)=0.9772$ to approximate $P(|Z|<2)$ to four decimal places.`,
    r`$2\Phi(2)-1=2(0.9772)-1=0.9544$.`,
    probability('0.9544'),
  ),
  q(
    r`Use $\Phi(1)=0.8413$ and $\Phi(2)=0.9772$ to approximate $P(1<Z<2)$ to four decimal places.`,
    r`$0.9772-0.8413=0.1359$.`,
    probability('0.1359'),
  ),
  q(
    r`For $X\sim N(10,4)$, use $\Phi(1.5)=0.9332$ to approximate $P(X<13)$ to four decimal places.`,
    r`Standardize: $(13-10)/2=1.5$. The probability is $0.9332$.`,
    probability('0.9332'),
  ),
  q(
    r`For $X\sim N(10,4)$, use $\Phi(2)=0.9772$ to approximate $P(X>14)$ to four decimal places.`,
    r`The score is two, so the probability is $1-0.9772=0.0228$.`,
    probability('0.0228'),
  ),
  q(
    r`For $X\sim N(10,4)$, use $\Phi(1)=0.8413$ to approximate $P(8<X<12)$ to four decimal places.`,
    r`The scores are $-1,1$, giving $2(0.8413)-1=0.6826$.`,
    probability('0.6826'),
  ),
  q(
    r`For $X\sim N(10,4)$, use $\Phi(1)=0.8413$ to approximate $P(X>12\mid X>10)$ to four decimal places.`,
    r`The numerator is $0.1587$ and denominator is $1/2$, so the conditional probability is $0.3174$.`,
    probability('0.3174'),
  ),
  q(
    r`True or false: $P(Z>2)=\Phi(2)$ for standard normal $Z$.`,
    r`False. $\Phi(2)$ is the left-tail probability; the right tail is $1-\Phi(2)$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why $\Phi(2)-\Phi(-1)$ is positive without using a numerical table.`,
    r`A CDF is nondecreasing and this normal density is positive between $-1$ and $2$. Their difference is the positive probability of that interval.`,
  ),
];
s2.review = [
  q(
    r`Use $\Phi(0.5)=0.6915$ to approximate $P(|Z|>0.5)$ to four decimal places.`,
    r`$2(1-0.6915)=0.6170$.`,
    probability('0.6170'),
  ),
  q(
    r`For $X\sim N(80,16)$, use $\Phi(1.5)=0.9332$ to approximate $P(X<74)$ to four decimal places.`,
    r`The score is $-1.5$, so $1-0.9332=0.0668$.`,
    probability('0.0668'),
  ),
  q(
    r`Use $\Phi(0.5)=0.6915$ and $\Phi(1.5)=0.9332$ to approximate $P(-0.5<Z<1.5)$ to four decimal places.`,
    r`$0.9332-(1-0.6915)=0.6247$.`,
    probability('0.6247'),
  ),
];
s2.quickCheck = quick(
  r`For standard normal $Z$, what is $P(Z>1.2)$?`,
  [r`$\Phi(1.2)$`, r`$1-\Phi(1.2)$`, r`$2\Phi(1.2)-1$`],
  1,
  `The CDF gives the area to the left, so a right tail uses its complement.`,
  [
    `This is the probability below the threshold, which exceeds one half.`,
    `Correct. Subtracting the left-tail area from one leaves the right-tail area.`,
    `This is the central area between $-1.2$ and $1.2$, not one right tail.`,
  ],
);
const s3 = section(
  'Quantiles and affine changes of units',
  r`A normal quantile reverses the probability calculation. If $\Phi(z_p)=p$, then the $p$-quantile of $N(\mu,\sigma^2)$ is $q_p=\mu+\sigma z_p$. The standardized quantile is dimensionless; the final threshold has the original measurement's units. A threshold exceeded five percent of the time is the $95$th percentile, not the $5$th.

For a normal measurement with mean $100$ and standard deviation $15$, use the supplied value $z_{0.95}\approx1.645$. The threshold is $100+15(1.645)=124.675$. Its interpretation is that approximately $95\%$ of the model distribution lies below the threshold and $5\%$ above it. This is a distributional percentile, not yet a confidence interval about an unknown parameter.

Read a percentile question by identifying the area first. An upper-tail probability of $0.10$ corresponds to cumulative probability $0.90$; a central probability of $0.90$ leaves $0.05$ above the upper endpoint. These two questions use different normal quantiles even though both contain the number ninety percent.

An equal-tail central interval with probability $1-\alpha$ leaves probability $\alpha/2$ in each tail. For a standard normal variable it is approximately $(-z_{1-\alpha/2},z_{1-\alpha/2})$. For example, $z_{0.975}\approx1.96$ gives the familiar approximate $95\%$ central interval $\mu\pm1.96\sigma$. The factor is not two exactly; two standard deviations gives about $95.45\%$ under a normal model.

Affine transformations preserve normality: if $Y=aX+b$ and $a\ne0$, then $Y\sim N(a\mu+b,a^2\sigma^2)$. Negative scaling reverses the order of thresholds but keeps standard deviation positive, $|a|\sigma$. If $a=0$, $Y=b$ is constant and has a point mass rather than a nondegenerate normal density.

As a concrete change of units, let a centered measurement error in meters follow $N(0,0.04)$. Multiplying by one hundred gives centimeters with standard deviation twenty and variance four hundred. Neither the chance of a physical event nor its standardized score changes when the threshold is converted consistently. Numerical density heights do change, because density is measured per unit of the horizontal coordinate.`,
  [normal, transforms],
  [
    termEntry(
      'normal-quantile',
      'Normal quantile',
      'A normal threshold with a specified probability below it.',
      r`$q_p=\mu+\sigma z_p$ where $\Phi(z_p)=p$.`,
      r`With $\mu=100,\sigma=15,z_{0.95}=1.645$, $q_{0.95}\approx124.675$.`,
      `A central 95% interval uses the 97.5% quantile at its upper end.`,
    ),
  ],
);
s3.questions = [
  q(
    r`For $N(20,16)$, use $z_{0.95}=1.645$ to find the $95$th percentile to two decimal places.`,
    r`$20+4(1.645)=26.58$.`,
    approx('26.58', '0.005'),
  ),
  q(
    r`For $N(20,16)$, use $z_{0.05}=-1.645$ to find the $5$th percentile to two decimal places.`,
    r`$20-4(1.645)=13.42$.`,
    approx('13.42', '0.005'),
  ),
  q(
    r`For $N(50,25)$, use $z_{0.975}=1.96$ to find the upper endpoint of its central $95\%$ interval to one decimal place.`,
    r`$50+5(1.96)=59.8$.`,
    approx('59.8', '0.05'),
  ),
  q(
    r`For $N(50,25)$, use $z_{0.975}=1.96$ to find the lower endpoint of its central $95\%$ interval to one decimal place.`,
    r`$50-5(1.96)=40.2$.`,
    approx('40.2', '0.05'),
  ),
  q(
    r`If $X\sim N(3,4)$ and $Y=5-2X$, give the mean and variance of $Y$.`,
    r`$E[Y]=5-6=-1$ and $\operatorname{Var}(Y)=4(4)=16$, so $(-1,16)$.`,
    tuple(['-1', '16']),
  ),
  q(
    r`If $X\sim N(3,4)$ and $Y=5-2X$, find the standard deviation of $Y$.`,
    r`It is $|-2|\sqrt4=4$.`,
    exact('4'),
  ),
  q(
    r`An equal-tail central normal interval contains $90\%$ probability. What probability is in each tail?`,
    r`The remaining $10\%$ is split equally, giving $0.05=1/20$.`,
    exact('1/20'),
  ),
  q(
    r`For standard normal $Z$, give its median.`,
    r`Symmetry gives $\Phi(0)=1/2$, so the median is $0$.`,
    exact('0'),
  ),
  q(
    r`True or false: multiplying a normal variable by a negative constant produces a negative variance.`,
    r`False. Variance is multiplied by the square of the constant.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why a normal model's central $95\%$ interval for individual values is not automatically a $95\%$ confidence interval for its mean.`,
    r`The first describes spread of individual outcomes under a specified distribution. A confidence interval is a data-dependent procedure concerning an unknown parameter, with coverage across samples. They involve different random quantities.`,
  ),
];
s3.review = [
  q(
    r`For $N(6,9)$, use $z_{0.90}=1.282$ to find the $90$th percentile to three decimal places.`,
    r`$6+3(1.282)=9.846$.`,
    approx('9.846', '0.0005'),
  ),
  q(
    r`For $X\sim N(-2,9)$ and $Y=4X+1$, give the mean and variance.`,
    r`$4(-2)+1=-7$ and $16(9)=144$, giving $(-7,144)$.`,
    tuple(['-7', '144']),
  ),
  q(
    r`A centered error has standard deviation $0.03$ meters. Give its variance in squared centimeters.`,
    r`Its standard deviation is three centimeters, so its variance is $9$ squared centimeters.`,
    exact('9'),
  ),
];
const s4 = section(
  'Transform a distribution through its CDF',
  r`Changing a random variable by a nonlinear function usually changes the shape of its distribution. Begin with the event $F_Y(y)=P(Y\le y)=P(g(X)\le y)$, and solve that inequality in the original variable. This CDF method is often safer than memorizing a transformation formula because it makes the support and direction of inequalities visible.

Let $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$. The transformation is increasing on the original support. Thus $Y$ lies between zero and four, and for $0<y<4$, $F_Y(y)=P(U\le\sqrt y)=\sqrt y/2$. Differentiating gives $f_Y(y)=1/(4\sqrt y)$ there, with zero density elsewhere. Its height diverges near zero, but $\int_0^4 1/(4\sqrt y)\,dy=1$. A singular density height is compatible with finite probability.

For a differentiable strictly monotone transformation with inverse $x=h(y)$, the density is $f_Y(y)=f_X(h(y))|h'(y)|$ at points where the inverse derivative exists. The absolute value is essential for decreasing transformations. The factor adjusts for how a small width in the new coordinate corresponds to a width in the old one. It is the one-dimensional version of the Jacobian scaling from calculus.

For example, if $U$ is uniform on $(1,3)$ and $Y=1/U$, then $Y$ lies in $(1/3,1)$. Since $U=1/Y$ and $|dU/dY|=1/Y^2$, the density is $1/(2y^2)$ there. Integrating verifies its normalization. Merely substituting $1/y$ into the original constant density would incorrectly predict a constant density over the shortened interval.

The CDF verifies the decreasing case directly. On $(1/3,1)$, $F_Y(y)=P(U\ge1/y)=(3-1/y)/2$. Differentiating gives $1/(2y^2)$, and the endpoint limits are zero and one. This check simultaneously verifies the sign of the derivative factor, the support, and the direction of the transformed inequality.

Finally, computing an expectation does not require computing a transformed density. For the square example, $E[Y]=E[U^2]=\int_0^2 u^2/2\,du=4/3$. This provides an independent check on $\int_0^4 y f_Y(y)\,dy$.`,
  [transforms],
  [
    termEntry(
      'density-transformation',
      'Density transformation',
      'Adjust a density for the change of coordinate width.',
      r`For a differentiable monotone inverse $h$, $f_Y(y)=f_X(h(y))|h'(y)|$ on the transformed support.`,
      r`For $U\sim\operatorname{Uniform}(1,3)$, $1/U$ has density $1/(2y^2)$ on $(1/3,1)$.`,
      `Substitution alone misses the derivative factor.`,
    ),
  ],
);
s4.questions = [
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$, give $F_Y(y)$ on $0<y<4$.`,
    r`$P(U^2\le y)=P(U\le\sqrt y)=\sqrt y/2$.`,
    calc('sqrt(y)/2', ['y'], { positive: ['y'] }),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$, give $f_Y(y)$ on $0<y<4$.`,
    r`Differentiating $\sqrt y/2$ gives $1/(4\sqrt y)$.`,
    calc('1/(4*sqrt(y))', ['y'], { positive: ['y'] }),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$, find $P(Y<1)$.`,
    r`$Y<1$ means $U<1$, whose probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$, find $E[Y]$.`,
    r`$E[U^2]=\int_0^2u^2/2\,du=4/3$.`,
    exact('4/3'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(1,3)$ and $Y=1/U$, give the two endpoints of the support in increasing order.`,
    r`The decreasing map takes three to $1/3$ and one to one, so the endpoints are $(1/3,1)$.`,
    tuple(['1/3', '1']),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(1,3)$ and $Y=1/U$, give $f_Y(y)$ on $1/3<y<1$.`,
    r`The original density is $1/2$ and the absolute inverse derivative is $1/y^2$, giving $1/(2y^2)$.`,
    calc('1/(2*y^2)', ['y'], { positive: ['y'] }),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=e^U$, give $F_Y(y)$ on $1<y<e^2$.`,
    r`$P(e^U\le y)=P(U\le\ln y)=\ln y/2$.`,
    calc('ln(y)/2', ['y'], { positive: ['y'] }),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=e^U$, give $f_Y(y)$ on $1<y<e^2$.`,
    r`Differentiating $\ln y/2$ gives $1/(2y)$.`,
    calc('1/(2*y)', ['y'], { positive: ['y'] }),
  ),
  q(
    r`Explain why the absolute derivative is needed for a decreasing transformation.`,
    r`A decreasing inverse has negative derivative, but a small interval's width is positive. The absolute derivative measures that width and keeps the transformed density nonnegative.`,
  ),
  q(
    r`For a positive density on $(0,2)$, explain why the formula for $Y=X^2$ cannot be used unchanged if the original support becomes $(-2,2)$.`,
    r`On the larger support the square map has two inverse branches. The event $X^2\le y$ includes both negative and positive values of $X$; one branch would lose probability.`,
  ),
];
s4.review = [
  q(
    r`For $U\sim\operatorname{Uniform}(0,3)$ and $Y=U^2$, find $P(Y<4)$.`,
    r`The event is $U<2$, whose probability is $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(1,2)$ and $Y=\ln U$, give $f_Y(y)$ on $0<y<\ln2$.`,
    r`The inverse is $u=e^y$ with derivative $e^y$, and the original density is one, so $f_Y(y)=e^y$.`,
    calc('exp(y)', ['y']),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$, find $E[e^U]$ exactly.`,
    r`$\int_0^2e^u/2\,du=(e^2-1)/2$.`,
    calc('(exp(2)-1)/2'),
  ),
];
const s5 = section(
  'Account for branches and point masses',
  r`A nonlinear transformation may map several input values to the same output. For $X\sim\operatorname{Uniform}(-2,2)$ and $Y=X^2$, the event $Y\le y$ is $-\sqrt y\le X\le\sqrt y$ when $0<y<4$. Its interval length is $2\sqrt y$, so $F_Y(y)=\sqrt y/2$ and $f_Y(y)=1/(4\sqrt y)$. Both branches contribute. The resulting distribution matches the square of a uniform $(0,2)$ variable, even though the original variables have different distributions.

For a piecewise monotone differentiable map, the density contributions from admissible inverse branches add: each contributes its original density times the absolute inverse derivative. Only roots inside the original support count. At isolated points where a derivative vanishes, use nearby formulas and the CDF to check the distribution. These points do not automatically create probability masses.

For a nonsymmetric original density, the positive and negative branches need not contribute equally. With $Y=X^2$, the interior density contributions are $f_X(\sqrt y)/(2\sqrt y)$ and $f_X(-\sqrt y)/(2\sqrt y)$ wherever those roots are supported. Doubling the positive contribution is justified only when the original density and support have the required symmetry.

A transformation can also collapse a whole interval into one point. Let $U\sim\operatorname{Uniform}(-1,1)$ and $Y=\max(0,U)$. Then $P(Y=0)=P(U\le0)=1/2$. For $0<y<1$, $F_Y(y)=(y+1)/2$, whose derivative is $1/2$. That density piece integrates to only $1/2$ because the other half is an atom at zero. The full CDF jumps at zero. Differentiating its smooth portions and calling the result the entire distribution would discard half the probability.

This is relevant to censoring, clipping, and activation functions in computational models. Rounding also turns intervals of continuous inputs into discrete output values. Ask whether the map is one-to-one, whether all relevant branches were included, and whether any interval was flattened. These questions matter more than whether the input originally had a density.

For the clipped example, direct averaging gives $E[Y]=\int_0^1u/2\,du=1/4$. The atom contributes $0\cdot(1/2)=0$, while the continuous portion contributes the same integral. A mixed distribution is handled by adding its discrete and continuous contributions; it cannot be described by an ordinary density alone.`,
  [transforms],
  [
    termEntry(
      'transformation-atom',
      'Point mass created by a transformation',
      'A positive-probability set can be collapsed to one output.',
      r`If $P(g(X)=c)>0$, the transformed CDF jumps at $c$.`,
      r`Clipping a uniform $(-1,1)$ variable below at zero gives $P(Y=0)=1/2$.`,
      `An infinite density height is different from a positive point mass.`,
    ),
  ],
);
s5.questions = [
  q(
    r`For $X\sim\operatorname{Uniform}(-2,2)$ and $Y=X^2$, find $P(Y\le1)$.`,
    r`The event is $-1\le X\le1$, with probability $2/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(-2,2)$ and $Y=X^2$, find $P(Y=0)$.`,
    r`Only $X=0$ maps to zero, and that singleton has probability zero. Thus $P(Y=0)=0$.`,
    exact('0'),
  ),
  q(
    r`For $X\sim\operatorname{Uniform}(-2,2)$ and $Y=|X|$, give the density for $0<y<2$.`,
    r`Each inverse branch contributes $1/4$, so the total density is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(-1,1)$ and $Y=\max(0,U)$, find $P(Y=0)$.`,
    r`All of $(-1,0]$ maps to zero, giving probability $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(-1,1)$ and $Y=\max(0,U)$, find $F_Y(1/2)$.`,
    r`$P(Y\le1/2)=P(U\le1/2)=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(-1,1)$ and $Y=\max(0,U)$, find $E[Y]$.`,
    r`Only positive inputs contribute: $\int_0^1u/2\,du=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=\min(U,1)$, find $P(Y=1)$.`,
    r`The interval $[1,2)$ collapses to one, so its mass is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(0,2)$ and $Y=\min(U,1)$, find $E[Y]$.`,
    r`$E[Y]=\int_0^1u/2\,du+1(1/2)=1/4+1/2=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`True or false: a function of a continuous random variable must itself have a density.`,
    r`False. A constant or clipping transformation can create point masses.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why an unbounded density near zero does not imply a positive probability at zero.`,
    r`Density describes interval area. A singular but integrable density can still have a continuous CDF and zero singleton probability. A point mass instead appears as a jump in the CDF.`,
  ),
];
s5.review = [
  q(
    r`For $U\sim\operatorname{Uniform}(-3,1)$ and $Y=\max(0,U)$, find $P(Y=0)$.`,
    r`Three of the four units of interval length map to zero, so the probability is $3/4$.`,
    exact('3/4'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(-3,1)$ and $Y=\max(0,U)$, find $E[Y]$.`,
    r`$E[Y]=\int_0^1u/4\,du=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`For $U\sim\operatorname{Uniform}(-3,3)$, find $P(U^2>4)$.`,
    r`The event consists of $(-3,-2)$ and $(2,3)$, total length two out of six, giving $1/3$.`,
    exact('1/3'),
  ),
];
s5.quickCheck = quick(
  r`If $U$ is uniform on $(-1,1)$ and $Y=\max(0,U)$, what happens at zero?`,
  [
    `The transformed density has height one there, so the point probability is one.`,
    `The transformed distribution has a point mass of one half.`,
    `The probability is zero because the input is continuous.`,
  ],
  1,
  `The transformation collapses the entire nonpositive half of the input interval to zero.`,
  [
    `A density height is not a point probability; here the mass is determined by the interval that is collapsed.`,
    `Correct. The event $Y=0$ is $U\le0$, which has probability one half.`,
    `Continuity of the input does not prevent a transformation from creating atoms.`,
  ],
);
export default lesson(
  10,
  'normal-distributions-transformations',
  'Normal Distributions and Transformations',
  r`We use the convention $N(\mu,\sigma^2)$ throughout: the second parameter is variance. Normal probabilities introduce numerical CDF values, while transformations reuse inverse functions and derivatives to track how probability moves between representations.`,
  [s1, s2, s3, s4, s5],
);
