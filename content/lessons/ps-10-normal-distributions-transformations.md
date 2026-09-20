# Normal Distributions and Transformations

We use the convention $N(\mu,\sigma^2)$ throughout: the second parameter is variance. Normal probabilities introduce numerical CDF values, while transformations reuse inverse functions and derivatives to track how probability moves between representations.

## Normal models have a location and a scale

The normal, or Gaussian, distribution is a continuous model with a symmetric bell-shaped density. We write $X\sim N(\mu,\sigma^2)$, where the second argument is the **variance**, and $\sigma>0$ is the standard deviation. This convention must be checked when moving between books or software; writing $N(10,9)$ here means mean ten and standard deviation three.

The density is $f_X(x)=\frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$ for all real $x$. The constant ensures total area one. The exponent depends on squared distance from the mean in standard-deviation units. Moving $\mu$ shifts the curve without changing its spread. Increasing $\sigma$ spreads probability over a wider range, so the peak height decreases. The normal curve extends indefinitely in both directions; it does not have a hard cutoff at three standard deviations.

The standard normal variable $Z\sim N(0,1)$ is the common reference. Every normal variable can be represented as $X=\mu+\sigma Z$. Linearity gives $E[X]=\mu$ and the variance scaling rule gives $\operatorname{Var}(X)=\sigma^2$. Conversely, $Z=(X-\mu)/\sigma$ has a standard normal distribution. Subtracting the mean centers the variable; dividing by the standard deviation removes its units.

For $X\sim N(30,16)$, the value $38$ has standardized score $(38-30)/4=2$. A value of $26$ has score $-1$. These scores locate measurements on the common curve; they are not probabilities. A negative score means below the mean, not a negative chance.

A density also has a useful scale check. At the mean its value is $1/(\sigma\sqrt{2\pi})$, so a density written with variance in place of standard deviation in that prefactor will generally fail normalization. The same distinction appears in the exponent, where the denominator contains twice the variance. Labeling the parameters before substitution prevents both errors.

Normality is an assumption about the distribution's shape. Standardizing an arbitrary variable with finite positive variance gives mean zero and variance one, but does not make it normal. In particular, standardized Bernoulli values still occupy only two locations. This distinction will be essential when we later approximate sample means.

Related definitions: [Normal distribution](ref:probability-statistics-normal-distribution); [Standardization](ref:probability-statistics-standardization).

## Use the normal CDF without confusing tails

Let $\Phi(z)=P(Z\le z)$ for a standard normal variable. Unlike the polynomial densities from the previous lesson, its defining integral has no elementary antiderivative. Numerical tables or evaluated CDF values are therefore normal tools, not a failure of calculus. In this material, any exercise that needs a numerical normal value supplies it and states the requested precision.

The function $\Phi$ accumulates from the left. For example, using $\Phi(1.5)\approx0.9332$, the right-tail probability is $P(Z>1.5)\approx1-0.9332=0.0668$. Symmetry gives $\Phi(-z)=1-\Phi(z)$, while $\Phi(0)=1/2$. Therefore $P(-1.5<Z<1.5)\approx0.9332-0.0668=0.8664$. Two tails outside a symmetric interval have total probability $2[1-\Phi(z)]$ for positive $z$.

For $X\sim N(\mu,\sigma^2)$, rewrite the event before using the table: $P(a<X<b)=\Phi((b-\mu)/\sigma)-\Phi((a-\mu)/\sigma)$. Because $\sigma>0$, standardization preserves inequality direction. For $X\sim N(50,100)$, the interval $40<X<65$ becomes $-1<Z<1.5$. With $\Phi(1)=0.8413$ and $\Phi(1.5)=0.9332$, its probability is approximately $0.9332-(1-0.8413)=0.7745$.

Sketching the requested region on a number line often prevents choosing the wrong tail. First mark the mean and threshold, then decide whether the answer should be below or above one half. A threshold above the mean has a left-tail probability above one half and a right-tail probability below one half. For an interval, check that the result is nonnegative and no larger than either appropriate one-sided bound. Carry the supplied digits through the calculation and round once at the end; the reported answer is an approximation to the model probability, not an exact rational claim.

Related definitions: [Standard normal CDF](ref:probability-statistics-normal-cdf).

![Central area under the standard normal density](figure:probability-statistics-figure-10)

## Quantiles and affine changes of units

A normal quantile reverses the probability calculation. If $\Phi(z_p)=p$, then the $p$-quantile of $N(\mu,\sigma^2)$ is $q_p=\mu+\sigma z_p$. The standardized quantile is dimensionless; the final threshold has the original measurement's units. A threshold exceeded five percent of the time is the $95$th percentile, not the $5$th.

For a normal measurement with mean $100$ and standard deviation $15$, use the supplied value $z_{0.95}\approx1.645$. The threshold is $100+15(1.645)=124.675$. Its interpretation is that approximately $95\%$ of the model distribution lies below the threshold and $5\%$ above it. This is a distributional percentile, not yet a confidence interval about an unknown parameter.

Read a percentile question by identifying the area first. An upper-tail probability of $0.10$ corresponds to cumulative probability $0.90$; a central probability of $0.90$ leaves $0.05$ above the upper endpoint. These two questions use different normal quantiles even though both contain the number ninety percent.

An equal-tail central interval with probability $1-\alpha$ leaves probability $\alpha/2$ in each tail. For a standard normal variable it is approximately $(-z_{1-\alpha/2},z_{1-\alpha/2})$. For example, $z_{0.975}\approx1.96$ gives the familiar approximate $95\%$ central interval $\mu\pm1.96\sigma$. The factor is not two exactly; two standard deviations gives about $95.45\%$ under a normal model.

Affine transformations preserve normality: if $Y=aX+b$ and $a\ne0$, then $Y\sim N(a\mu+b,a^2\sigma^2)$. Negative scaling reverses the order of thresholds but keeps standard deviation positive, $|a|\sigma$. If $a=0$, $Y=b$ is constant and has a point mass rather than a nondegenerate normal density.

As a concrete change of units, let a centered measurement error in meters follow $N(0,0.04)$. Multiplying by one hundred gives centimeters with standard deviation twenty and variance four hundred. Neither the chance of a physical event nor its standardized score changes when the threshold is converted consistently. Numerical density heights do change, because density is measured per unit of the horizontal coordinate.

Related definitions: [Normal quantile](ref:probability-statistics-normal-quantile).

## Transform a distribution through its CDF

Changing a random variable by a nonlinear function usually changes the shape of its distribution. Begin with the event $F_Y(y)=P(Y\le y)=P(g(X)\le y)$, and solve that inequality in the original variable. This CDF method is often safer than memorizing a transformation formula because it makes the support and direction of inequalities visible.

Let $U\sim\operatorname{Uniform}(0,2)$ and $Y=U^2$. The transformation is increasing on the original support. Thus $Y$ lies between zero and four, and for $0<y<4$, $F_Y(y)=P(U\le\sqrt y)=\sqrt y/2$. Differentiating gives $f_Y(y)=1/(4\sqrt y)$ there, with zero density elsewhere. Its height diverges near zero, but $\int_0^4 1/(4\sqrt y)\,dy=1$. A singular density height is compatible with finite probability.

For a differentiable strictly monotone transformation with inverse $x=h(y)$, the density is $f_Y(y)=f_X(h(y))|h'(y)|$ at points where the inverse derivative exists. The absolute value is essential for decreasing transformations. The factor adjusts for how a small width in the new coordinate corresponds to a width in the old one. It is the one-dimensional version of the Jacobian scaling from calculus.

For example, if $U$ is uniform on $(1,3)$ and $Y=1/U$, then $Y$ lies in $(1/3,1)$. Since $U=1/Y$ and $|dU/dY|=1/Y^2$, the density is $1/(2y^2)$ there. Integrating verifies its normalization. Merely substituting $1/y$ into the original constant density would incorrectly predict a constant density over the shortened interval.

The CDF verifies the decreasing case directly. On $(1/3,1)$, $F_Y(y)=P(U\ge1/y)=(3-1/y)/2$. Differentiating gives $1/(2y^2)$, and the endpoint limits are zero and one. This check simultaneously verifies the sign of the derivative factor, the support, and the direction of the transformed inequality.

Finally, computing an expectation does not require computing a transformed density. For the square example, $E[Y]=E[U^2]=\int_0^2 u^2/2\,du=4/3$. This provides an independent check on $\int_0^4 y f_Y(y)\,dy$.

Related definitions: [Density transformation](ref:probability-statistics-density-transformation).

## Account for branches and point masses

A nonlinear transformation may map several input values to the same output. For $X\sim\operatorname{Uniform}(-2,2)$ and $Y=X^2$, the event $Y\le y$ is $-\sqrt y\le X\le\sqrt y$ when $0<y<4$. Its interval length is $2\sqrt y$, so $F_Y(y)=\sqrt y/2$ and $f_Y(y)=1/(4\sqrt y)$. Both branches contribute. The resulting distribution matches the square of a uniform $(0,2)$ variable, even though the original variables have different distributions.

For a piecewise monotone differentiable map, the density contributions from admissible inverse branches add: each contributes its original density times the absolute inverse derivative. Only roots inside the original support count. At isolated points where a derivative vanishes, use nearby formulas and the CDF to check the distribution. These points do not automatically create probability masses.

For a nonsymmetric original density, the positive and negative branches need not contribute equally. With $Y=X^2$, the interior density contributions are $f_X(\sqrt y)/(2\sqrt y)$ and $f_X(-\sqrt y)/(2\sqrt y)$ wherever those roots are supported. Doubling the positive contribution is justified only when the original density and support have the required symmetry.

A transformation can also collapse a whole interval into one point. Let $U\sim\operatorname{Uniform}(-1,1)$ and $Y=\max(0,U)$. Then $P(Y=0)=P(U\le0)=1/2$. For $0<y<1$, $F_Y(y)=(y+1)/2$, whose derivative is $1/2$. That density piece integrates to only $1/2$ because the other half is an atom at zero. The full CDF jumps at zero. Differentiating its smooth portions and calling the result the entire distribution would discard half the probability.

This is relevant to censoring, clipping, and activation functions in computational models. Rounding also turns intervals of continuous inputs into discrete output values. Ask whether the map is one-to-one, whether all relevant branches were included, and whether any interval was flattened. These questions matter more than whether the input originally had a density.

For the clipped example, direct averaging gives $E[Y]=\int_0^1u/2\,du=1/4$. The atom contributes $0\cdot(1/2)=0$, while the continuous portion contributes the same integral. A mixed distribution is handled by adding its discrete and continuous contributions; it cannot be described by an ordinary density alone.

Related definitions: [Point mass created by a transformation](ref:probability-statistics-transformation-atom).
