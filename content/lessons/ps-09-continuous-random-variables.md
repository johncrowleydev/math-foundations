# Continuous Random Variables

Continuous probability turns the accumulation tools of calculus into models for times, positions, and measurements. We will connect densities to CDFs, compute moments, and examine uniform and exponential models while keeping their assumptions visible.

## Probability is area, not height

A count of failed requests is discrete; the time until a response is often modeled continuously. The measuring device still rounds its readings, but the model assigns probabilities to intervals of underlying times. In this lesson, continuous distributions have a probability density. More exotic continuous distributions are outside our scope.

A **probability density function**, or PDF, is a nonnegative function $f$ with $\int_{-\infty}^{\infty}f(x)\,dx=1$. Its defining job is $P(a<X\le b)=\int_a^b f(x)\,dx$. The area represents probability; the height describes its concentration. If $X$ is measured in seconds, $f(x)$ has units of inverse seconds, so multiplying by a small width produces a dimensionless probability. Where the density varies little across a short interval, $P(x<X\le x+h)\approx f(x)h$. This is an approximation, not a substitute for integration over a long interval.

Consider $f(x)=3x^2$ for $0<x<1$, and zero elsewhere. It is nonnegative and $\int_0^1 3x^2\,dx=1$. Its height near $1$ exceeds $1$, which is permitted. The upper half of its range has probability $\int_{1/2}^1 3x^2\,dx=1-1/8=7/8$. Equal-width intervals need not have equal probabilities.

A single point has zero area: $P(X=c)=0$. Therefore changing finitely many endpoint inclusions does not change interval probabilities. Zero probability is not synonymous with logical impossibility in a continuous model: some individual value is realized even though no specified point has positive probability. An observed rounded value, such as $0.50$ seconds to two decimal places, represents an interval approximately $[0.495,0.505)$, whose probability can be positive. This distinction prevents treating an instrument's displayed values as exact measurements.

The value assigned to a density at one isolated point can be changed without changing any probabilities. For instance, setting the density to zero rather than three at the endpoint one in our polynomial example has no effect on its integrals. A density represents a distribution through area; it is not a table of singleton probabilities.

Related definitions: [Probability density](ref:probability-statistics-density).

## Move between density and cumulative probability

The cumulative distribution function retains its earlier definition: $F(x)=P(X\le x)$. For a density model, $F(x)=\int_{-\infty}^x f(t)\,dt$. Its derivative is $f(x)$ wherever the usual differentiation conditions hold. This is the fundamental theorem of calculus applied to probability accumulation. A CDF is nondecreasing, takes values between zero and one, and approaches zero and one at the two ends of the real line.

For density $3x^2$ on $(0,1)$, the full CDF is $F(x)=0$ for $x\le0$, $F(x)=x^3$ for $0<x<1$, and $F(x)=1$ for $x\ge1$. Writing only $x^3$ would incorrectly assign negative or excessive probabilities outside the support. Within the support, $P(1/4<X\le3/4)=F(3/4)-F(1/4)=13/32$. Subtraction removes the accumulation up to the lower endpoint.

A density need not be continuous. Suppose $f(x)=1/4$ on $(0,2)$ and $f(x)=1/2$ on $(2,3)$, with zero elsewhere. Each piece contributes area $1/2$. For $2<x<3$, the CDF is $1/2+(x-2)/2$, including the probability already accumulated before $2$. The CDF remains continuous even though its slope changes. By contrast, a jump of size $p$ in a CDF represents a point mass of probability $p$ and cannot arise from a density alone.

A **quantile** converts a cumulative probability back into a location. When $F$ is strictly increasing on its support, the $p$-quantile solves $F(q_p)=p$. More generally one uses the smallest location at which the CDF reaches the requested level. The median is a half-probability quantile. For the density $3x^2$, $q_p=p^{1/3}$ and the median is $(1/2)^{1/3}$. A quantile has the variable's units; its percentile level is dimensionless.

When a CDF has a flat portion, the equation $F(q)=p$ can have more than one solution at that level. The smallest-location convention selects a definite quantile, but an exercise asking for any median may permit several answers. Our direct quantile computations use strictly increasing portions so the requested threshold is unique.

Related definitions: [Continuous CDF](ref:probability-statistics-continuous-cdf); [Quantile](ref:probability-statistics-quantile).

![Density area becomes cumulative probability](figure:probability-statistics-figure-9)

## Compute expectations by integration

Discrete expectation adds value times probability. Continuous expectation uses the corresponding weighted integral, $E[X]=\int_{-\infty}^{\infty}xf(x)\,dx$, provided it exists. For a finite real expectation it is sufficient and standard to require $E[|X|]<\infty$. Positive and negative infinite contributions must not be canceled by a symmetric principal value. An expectation can fail to exist even when the density integrates to one.

To average a function of the outcome, use $E[g(X)]=\int g(x)f(x)\,dx$. This is the continuous version of the expectation rule from discrete random variables. You do not need the full distribution of $g(X)$ just to calculate its expectation. For $f(x)=3x^2$ on $(0,1)$, $E[X]=\int_0^13x^3\,dx=3/4$ and $E[X^2]=\int_0^13x^4\,dx=3/5$. Thus $\operatorname{Var}(X)=E[X^2]-E[X]^2=3/80$. Squaring the mean is different from averaging the square.

The familiar affine rules continue to hold: $E[aX+b]=aE[X]+b$ and $\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$ when the relevant moments are finite. They follow from linearity and centering, not from a special distribution. A change from seconds to milliseconds multiplies variance by a million because variance carries squared units.

A model can have a finite mean but infinite variance. The density $f(x)=2/x^3$ for $x\ge1$ has total integral one and mean $2$. However, its second moment is $\int_1^\infty2/x\,dx$, which diverges. Consequently its variance is infinite. This example matters later: a finite mean can support laws about averages, while the usual finite-variance central limit theorem needs more. Always check the improper integral before applying a formula that presumes its finiteness.

Symmetry can simplify a calculation only after existence is established. A symmetric distribution with finite absolute first moment has mean at its center because equal deviations cancel in an absolutely convergent integral. A symmetric heavy-tailed density can instead have undefined mean; visual balance alone does not establish convergence of the required integral.

Related definitions: [Integral expectation](ref:probability-statistics-continuous-expectation).

## Uniform models and interval conditioning

A uniform distribution on $(a,b)$, written $X\sim\operatorname{Uniform}(a,b)$ with $a<b$, assigns a constant density $1/(b-a)$ there and zero outside. Probabilities are lengths divided by the total length, after intersecting the requested event with the support. Uniformity is a modeling assumption about equal-length intervals; bounded measurements are not automatically uniform.

Direct integration gives $E[X]=(a+b)/2$ and $\operatorname{Var}(X)=(b-a)^2/12$. One efficient variance derivation first centers the interval: $X-(a+b)/2$ is uniform on $(-h,h)$ with $h=(b-a)/2$, so its second moment is $(1/(2h))\int_{-h}^h t^2\,dt=h^2/3$. The square of the interval width, rather than its location, controls the variance.

Suppose a randomized delay is uniform between $2$ and $8$ seconds. Then $P(4<X<7)=3/6=1/2$, its mean is $5$ seconds, and its variance is $36/12=3$ squared seconds. Asking for $P(X<3\mid X<5)$ changes the available outcomes: the numerator is the length from $2$ to $3$, while the denominator is the length from $2$ to $5$. The answer is $1/3$, not $1/6$.

Conditioning on a positive-probability interval truncates a density and renormalizes it. For $A=\{c<X<d\}$ with $P(A)>0$, the conditional density on that interval is $f(x)/P(A)$, and it is zero elsewhere. A uniform density remains uniform on the remaining interval. A nonuniform density retains its relative shape, multiplied by the normalizing factor.

If the retained event is a union of separated intervals, the same normalization rule applies, but the conditional distribution is supported on that union. It should not be replaced by a uniform distribution on the span from its smallest to largest retained value: that span may contain excluded outcomes. This uses ordinary event conditioning, not conditioning on a zero-probability point; the latter will be handled through joint densities in a later lesson.

Related definitions: [Continuous uniform distribution](ref:probability-statistics-uniform-continuous).

## Exponential waiting times and their limitations

An exponential model uses a rate $\lambda>0$ and density $f(t)=\lambda e^{-\lambda t}$ for $t\ge0$, zero for negative times. We write $T\sim\operatorname{Exponential}(\lambda)$, always using the **rate** convention. If time is in minutes, the rate is in inverse minutes. Some books parameterize by the mean instead, so identifying the convention is part of reading a model.

Integration gives $F(t)=1-e^{-\lambda t}$ for $t\ge0$. Its complement $S(t)=P(T>t)=e^{-\lambda t}$ is the **survival function**. It measures remaining probability beyond a threshold, regardless of whether the application involves survival. Integration by parts gives $E[T]=1/\lambda$ and $E[T^2]=2/\lambda^2$, hence $\operatorname{Var}(T)=1/\lambda^2$. A larger rate means a shorter typical wait.

For a service model with rate $1/4$ per minute, the mean is four minutes and $P(T>6)=e^{-3/2}$. The probability of finishing between two and six minutes is $e^{-1/2}-e^{-3/2}$. To find the median, solve $1-e^{-m/4}=1/2$, giving $m=4\ln2$. The mean and median differ because the distribution is skewed.

For $s,t\ge0$, $P(T>s+t\mid T>s)=e^{-\lambda(s+t)}/e^{-\lambda s}=e^{-\lambda t}$. This is **memorylessness**: after an unfinished wait, the additional wait has the original distribution. It is a property of the exponential model, not a universal fact about queues, hardware, or human response times.

Memorylessness also implies $E[T-s\mid T>s]=1/\lambda$ and hence $E[T\mid T>s]=s+1/\lambda$. The additional expected wait and the total expected elapsed time are different quantities. At rate $1/4$, an unfinished five-minute wait has expected additional duration four minutes and expected total duration nine minutes. A scheduled arrival, a timeout, or equipment whose failure rate changes with age can violate it.

An exponential model assigns positive probability to arbitrarily long waits. Before using it, connect this mathematical tail to the application. A system that deterministically terminates every request at a fixed deadline needs a different model for its observed duration, potentially including a point mass at that deadline.

Related definitions: [Exponential rate](ref:probability-statistics-exponential-rate); [Exponential memorylessness](ref:probability-statistics-memorylessness-continuous).
