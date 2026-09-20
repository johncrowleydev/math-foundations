# Exponential and Logarithmic Differentiation

Exponential functions describe multiplicative change, while logarithms reverse that relationship and convert products into sums. Their derivatives connect absolute rates, relative rates, growth, and sensitivity. This lesson extends the chain rule to these functions, then uses logarithmic differentiation when both the base and exponent depend on the input. We will state real domains before using logarithm identities and distinguish a model's instantaneous fractional rate from a finite percentage change. These distinctions are useful in science, computation, and model fitting, where an exponential or logarithm often sits inside a larger expression.

## The natural exponential and logarithm

The natural exponential $e^x$ is distinguished by the identity $(e^x)'=e^x$. Its derivative equals its current value. From the difference quotient, $[e^{x+h}-e^x]/h=e^x(e^h-1)/h$; the special base $e$ makes the final limit factor equal to $1$. Here $e$ is the fixed positive constant approximately $2.71828$, not a variable or a unit.

The natural logarithm $\ln x$ is the inverse of $e^x$ and is defined for positive real $x$. The inverse derivative formula gives $(\ln x)'=1/x$. To see the matching input explicitly, let $y=\ln x$, so $e^y=x$. Differentiating gives $e^y y'=1$, hence $y'=1/e^y=1/x$. The output of a logarithm can be negative; its input must be positive. For example, $\ln(1/2)<0$ is perfectly defined.

The chain rule gives $[e^{u(x)}]'=e^{u(x)}u'(x)$ and $[\ln u(x)]'=u'(x)/u(x)$ on intervals where $u(x)>0$. For $e^{-3x^2}$, the derivative is $-6xe^{-3x^2}$. For $\ln(x^2+4)$, it is $2x/(x^2+4)$; the logarithm argument is positive for every real $x$. These examples show why the exponential factor keeps its entire original exponent and why the logarithm derivative still needs the inner rate.

For nonzero $u(x)$, the useful identity $[\ln|u(x)|]'=u'(x)/u(x)$ holds on intervals avoiding zeros. On a negative branch, $|u|=-u$ and differentiating $\ln(-u)$ yields $(-u')/(-u)=u'/u$. Absolute value extends this logarithmic expression to both signs, but it does not include zeros. Thus $\ln|x|$ is differentiable on each interval $x<0$ and $x>0$, whereas $\ln x$ is only defined on the positive interval. The same derivative formula can belong to functions with different domains.

Related definitions: [Natural exponential](ref:calculus-natural-exponential); [Logarithm derivative rule](ref:calculus-logarithmic-derivative-rule).

## Other bases and valid logarithm identities

For a fixed base $a>0$, write $a^x=e^{x\ln a}$. The chain rule then gives $(a^x)'=a^x\ln a$. The base $a=1$ produces the constant function and zero derivative; bases between zero and one have negative logarithms and decreasing exponentials. If the exponent is a differentiable function $u(x)$, multiply once more by $u'(x)$.

For logarithms, the change-of-base identity is $\log_a x=\ln x/\ln a$, requiring $a>0$, $a\ne1$, and $x>0$. Since $\ln a$ is a nonzero constant, $(\log_a x)'=1/(x\ln a)$. The base factor is in the denominator for a logarithm and a multiplier for an exponential. Keeping the change-of-base derivation in mind is more reliable than trying to memorize the locations independently.

For $f(x)=2^{3x}$, the derivative is $3\ln2\,2^{3x}$. Its logarithmic rate $f'/f$ is $3\ln2$, so the exponent coefficient $3$ by itself is not the rate with respect to a natural exponential model. For $g(x)=\log_{10}(x^2+1)$, the derivative is $2x/[(x^2+1)\ln10]$. The argument is always positive, and the base contributes only a constant scaling.

Logarithm identities can simplify a derivative, but only when their domains are respected. On $x>0$, $\ln(x^3)=3\ln x$. On $x\ne0$, $\ln(x^2)=2\ln|x|$; replacing the latter by $2\ln x$ would discard the negative half of the original domain. Also, $\ln(u+v)$ is not $\ln u+\ln v$. The sum of logarithms corresponds to a product of positive arguments, not to adding those arguments.

When cancellation produces a simpler derivative, keep the original domain in the statement. The derivative of $\ln(x^2)$ is $2/x$ on $x\ne0$, but the same formula does not make the logarithm defined at zero. Domains belong to the modeled relationship and cannot be reconstructed from the final derivative formula alone.

Related definitions: [General-base exponential derivative](ref:calculus-general-exponential-derivative); [Change of logarithm base](ref:calculus-change-of-base).

## Logarithmic differentiation

Logarithmic differentiation is useful when a positive function is assembled from many products, quotients, or variable powers. Take its natural logarithm, use valid logarithm identities to reorganize the expression, differentiate implicitly, and finally multiply by the original function to recover its derivative. The intermediate quantity is $y'/y$, not $y'$ itself.

For $y=x^x$ on $x>0$, neither the ordinary power rule nor the fixed-base exponential rule applies alone: both base and exponent change. Taking logarithms gives $\ln y=x\ln x$. The product rule gives $y'/y=\ln x+1$, hence $y'=x^x(\ln x+1)$. Equivalently, rewrite $x^x=e^{x\ln x}$ and use the chain rule. This second route confirms why the two contributions appear.

More generally, if $u(x)>0$ and $y=u(x)^{v(x)}$, then $\ln y=v\ln u$. Differentiating yields $y'/y=v'\ln u+vu'/u$, so

$y'=u^v\left(v'\ln u+v\dfrac{u'}{u}\right)$.

This formula includes the fixed-base and fixed-exponent cases when the appropriate derivative vanishes. Stating $u>0$ makes arbitrary real variable exponents well-defined without introducing complex-valued conventions.

For a product example, let $y=x^2\sqrt{x+1}/(x+2)$ on $x>0$. Its logarithm is $2\ln x+(1/2)\ln(x+1)-\ln(x+2)$. Therefore $y'=y[2/x+1/(2(x+1))-1/(x+2)]$. Leaving the original function times this sum is both correct and easy to audit. The negative quotient term and fractional root coefficient remain visible.

For a nonzero function that can be negative, $\ln|y|$ sometimes permits the same method on intervals without zeros. At a zero, logarithmic division by $y$ fails even if the original function has a derivative there. Calculate such points directly from the original expression or another valid derivative rule. A method's restriction does not necessarily mean the function itself is singular.

Related definitions: [Logarithmic differentiation](ref:calculus-logarithmic-differentiation); [Variable power](ref:calculus-variable-power).

## Growth, decay, and relative rates

For a positive quantity $P(t)$, the relative rate is $P'(t)/P(t)$: the absolute rate divided by the current amount. Its units are reciprocal time. The logarithmic derivative identity gives $d(\ln P)/dt=P'/P$, connecting relative change with logarithms. If the model is $P(t)=P_0e^{kt}$, differentiation gives $P'=kP$ and hence the constant relative rate $k$.

For $P(t)=80e^{0.03t}$ with time in days, the instantaneous fractional rate is $0.03$ per day, often expressed as three percent per day instantaneously. At $t=0$, the absolute rate is $2.4$ units per day. The exact one-day multiplicative factor is $e^{0.03}$, so the one-day percentage increase is $100(e^{0.03}-1)$, slightly larger than three percent. An instantaneous percentage and a finite-interval percentage coincide only as an approximation for small increments.

A negative $k$ models decay. If $Q(t)=Q_0e^{-ct}$ with $c>0$, then $Q'=-cQ$. The quantity remains positive while decreasing, and the negative derivative describes change rather than a negative amount. A half-life $T$ satisfies $e^{-cT}=1/2$, so $T=\ln2/c$. A doubling time for positive growth similarly satisfies $T=\ln2/k$. These times depend on the relative rate, not on the starting amount in this particular model.

Relative rates need not be constant. For $P(t)=(t+1)^2$ on $t>-1$, we obtain $P'/P=2/(t+1)$. The amount and its absolute derivative increase for positive time, while its relative rate decreases. This example separates three different comparisons: value, absolute rate, and fractional rate.

Modeling requires a domain and a reason to use the formula. Verifying $P'=kP$ shows a mathematical property of an exponential model; it does not establish that a measured population or workload will obey that model forever. Limited resources, changing conditions, and discreteness can make extrapolation inaccurate. Here we study the mathematical implication of a stated model, leaving full differential-equation modeling to later study.

For a concrete comparison of rates, take $P(t)=(t+1)^2$ at $t=1$ and $t=3$. The amounts are $4$ and $16$, and the absolute rates are $4$ and $8$. The corresponding relative rates are $1$ and $1/2$ per time unit. Thus the later absolute increase is faster but constitutes a smaller fraction of a much larger amount. A sentence such as “growth slowed” is ambiguous unless it identifies which rate is being compared. Logarithmic derivatives make that distinction explicit without changing the underlying quantity.

Related definitions: [Relative rate of change](ref:calculus-relative-rate); [Doubling time and half-life](ref:calculus-doubling-half-life).

## Mixed formulas and model sensitivities

A complicated formula is best read as a hierarchy of operations. Decide whether the outermost operation is a sum, product, quotient, or composition, then differentiate its parts. Exponentials and logarithms do not replace the earlier rules; they supply additional building blocks within them. For $f(x)=x^2e^{-x}$, the product rule gives $f'(x)=2xe^{-x}-x^2e^{-x}=xe^{-x}(2-x)$. The factored form immediately reveals that the positive exponential does not change the derivative's sign.

For $g(x)=\ln x/x$ on $x>0$, the quotient rule gives $g'(x)=[(1/x)x-\ln x]/x^2=(1-\ln x)/x^2$. The numerator controls its sign because the denominator is positive. A sign prediction is a useful reason to keep exact functions rather than rounding logarithms too early. We will turn such sign analysis into an optimization method in later lessons.

An important smooth transformation is the logistic-shaped function $\sigma(x)=1/(1+e^{-x})$. Its denominator is always positive. Differentiating gives $\sigma'(x)=e^{-x}/(1+e^{-x})^2$. Since $1-\sigma=e^{-x}/(1+e^{-x})$, this also equals $\sigma(1-\sigma)$. These are mathematically equivalent forms, and each highlights different information: the first exposes positivity; the second relates the rate to the current output. At zero, $\sigma=1/2$ and $\sigma'=1/4$.

A logarithmic penalty offers a different sensitivity. For $L(p)=-\ln p$ on $0<p\le1$, its derivative on the interior is $-1/p$. The slope is large in magnitude near zero, meaning a small input change can have a large effect on the penalty there. This is a property of the formula, not a general guarantee about the behavior of an entire learning algorithm.

After calculating, check the domain, expected sign, and units. A derivative involving $\ln(1+x)$ requires $x>-1$, even if a later rational simplification seems to accept other values. A correct expression at one test point does not prove two formulas are identical. Use algebraic identities and derivative rules for justification; use selected values only to catch mistakes.

Cancellation inside a composition can make the simplest method especially short. The identity $e^{\ln x}=x$ holds on $x>0$, so its derivative is $1$ there. Direct use of the chain rule gives the same result: $e^{\ln x}/x=x/x=1$. Conversely, $\ln(e^x)=x$ holds for every real $x$, since the exponential output is always positive. Its derivative is again $1$, now on the entire real line. These examples have identical simplified outputs and derivative formulas but different original domain statements. They are a useful check on the habit of simplifying first: retain the domain you started with, and use a mathematically valid identity before deleting a function layer.

Related definitions: [Logistic sensitivity](ref:calculus-logistic-sensitivity); [Logarithmic penalty](ref:calculus-log-penalty).
