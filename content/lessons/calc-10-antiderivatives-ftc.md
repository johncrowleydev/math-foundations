# Antiderivatives, Fundamental Theorem, and Substitution

The integral was defined by adding small contributions. This lesson connects that definition to differentiation, giving an efficient way to compute many accumulations. We first reverse familiar derivative rules, then explain why this reverse operation evaluates definite integrals. Finally, substitution reverses the chain rule. At each stage distinguish three possible requests: one antiderivative, its full family, or a definite integral value.

## Antiderivatives and the missing constant

If $F'(x)=f(x)$ throughout an interval, $F$ is an antiderivative of $f$. For $f(x)=6x^2$, one choice is $F(x)=2x^3$. Adding any constant leaves the derivative unchanged, so $2x^3+7$ and $2x^3-100$ work too. The notation $\int f(x)\,dx=F(x)+C$ describes this entire family and is called an indefinite integral.

Why are there no other possibilities on an interval? If $F'=G'$, then $(F-G)'=0$. The mean value theorem implies that $F-G$ is constant between any two points in that interval. Connectedness matters: on $x\ne0$, different constants may be chosen independently on the negative and positive intervals. We state a connected interval when asking for an antiderivative so that a single $C$ describes the family correctly.

Reverse the power rule carefully. For $p\ne-1$, $\int x^p\,dx=x^{p+1}/(p+1)+C$ wherever the real power is defined and differentiable. The coefficient is a division by the new exponent because differentiating multiplies by that exponent. For example, $\int(4x^3-6x+2)\,dx=x^4-3x^2+2x+C$. Differentiating the proposed answer term by term checks every coefficient.

The exceptional exponent gives $\int 1/x\,dx=\ln|x|+C$ on either side of zero. For positive $x$, this is $\ln x+C$; for negative $x$, it is $\ln(-x)+C$. Other reverse rules include $\int e^x\,dx=e^x+C$, $\int\cos x\,dx=\sin x+C$, $\int\sin x\,dx=-\cos x+C$, $\int\sec^2x\,dx=\tan x+C$, and $\int1/(1+x^2)\,dx=\arctan x+C$.

An answer requesting a particular antiderivative can use $C=0$ or any other fixed number. A request for the general family must retain an arbitrary constant. A condition such as $F(0)=4$ selects one member: if $F'=6x^2$, then $F(x)=2x^3+C$ and substitution gives $C=4$. The derivative and the initial condition are separate checks; satisfying only one is insufficient.

Related definitions: [Antiderivative](ref:calculus-antiderivative); [Constant of integration](ref:calculus-integration-constant).

## Differentiating accumulated area

Fix a starting point $a$ and let the ending point move. The number $A(x)=\int_a^x f(t)\,dt$ now depends on $x$, so it defines a function. We use $t$ inside the integral to separate the integration variable from the moving endpoint. In particular, $A(a)=0$, regardless of the value of $f(a)$.

If $f$ is continuous, the first part of the fundamental theorem of calculus states that $A'(x)=f(x)$ at interior points. To understand why, subtract two accumulated amounts: $A(x+h)-A(x)=\int_x^{x+h}f(t)\,dt$. Dividing by $h$ gives an average height over a shrinking interval. Continuity makes those nearby heights approach $f(x)$, so the difference quotient does too. Differentiation recovers the current contribution rate from accumulated history.

For example, $A(x)=\int_1^x(t^2-4)\,dt$ has derivative $x^2-4$. Its value at $x=1$ is zero, while its derivative there is $-3$. A function value and its rate need not share a sign. On $(-2,2)$ the accumulation decreases; outside that range it increases. Its second derivative is $2x$, so the slope of the original integrand determines the concavity of the accumulation.

The chain rule remains necessary when the endpoint is itself a function. If $B(x)=\int_a^{g(x)}f(t)\,dt$, then $B'(x)=f(g(x))g'(x)$. For $B(x)=\int_0^{x^2}\cos t\,dt$, the answer is $2x\cos(x^2)$, not merely $\cos(x^2)$. A moving lower bound contributes the opposite sign. Splitting at a fixed reference point gives $\frac d{dx}\int_{u(x)}^{v(x)}f(t)\,dt=f(v(x))v'(x)-f(u(x))u'(x)$.

This theorem supplies derivatives even when no elementary antiderivative is available. The function $\int_0^x e^{-t^2}\,dt$ is perfectly well defined and differentiable although the usual elementary functions do not provide a formula for that antiderivative. A definition by an integral can be a final, useful description of a function. Check continuity before invoking the pointwise derivative conclusion, especially at a jump.

Related definitions: [Accumulation function](ref:calculus-accumulation-function).

## Evaluating definite integrals

The second part of the fundamental theorem turns accumulation into an endpoint calculation. If $f$ is continuous on $[a,b]$ and $F'=f$, then $\int_a^b f(x)\,dx=F(b)-F(a)$. We abbreviate this difference by $[F(x)]_a^b$. The brackets mean “evaluate at the upper bound, then subtract the value at the lower bound.” They are not another differentiation operation.

To connect this result with the first part, let $A(x)=\int_a^x f(t)\,dt$. Both $A$ and $F$ have derivative $f$, so their difference is constant. Since $A(a)=0$, we obtain $A(x)=F(x)-F(a)$. Evaluating at $b$ gives the endpoint formula. This argument explains why the theorem evaluates the Riemann-sum integral; it is not a new unrelated definition.

For $\int_1^3(2x+1)\,dx$, an antiderivative is $x^2+x$. The upper evaluation is $12$ and the lower is $2$, giving $10$. Parentheses protect the subtraction in less friendly examples: $[x^3-2x]_{-1}^2=(8-4)-(-1+2)=3$. Subtract the whole lower expression, not just its first term.

Any antiderivative gives the same result because constants cancel: $(F(b)+C)-(F(a)+C)=F(b)-F(a)$. Therefore a fixed-bound integral answer does not contain $+C$. Conversely, forgetting the initial value when recovering a quantity from its derivative loses real information. If $Q'=r$, then $Q(b)=Q(a)+\int_a^b r$, which is the net-change theorem expressed with an initial quantity.

Always check the interval before applying the shortcut. Although $-1/x$ differentiates to $1/x^2$ away from zero, substituting bounds $-1$ and $1$ into it does not evaluate an ordinary integral across the singularity. There is no continuous integrand on that whole interval, and the actual improper integral diverges. The endpoint formula cannot jump over a missing part of the domain. This domain check is as essential as finding the antiderivative.

Related definitions: [FTC evaluation formula](ref:calculus-ftc-evaluation).

## Substitution reverses the chain rule

Differentiating a composition produces an outer derivative and an inner derivative. Integration can reverse that pattern. If $F'=f$, then $[F(g(x))]'=f(g(x))g'(x)$, so $\int f(g(x))g'(x)\,dx=F(g(x))+C$. The notation $u=g(x)$ and $du=g'(x)\,dx$ packages the chain factor into a new variable.

For $\int 6x(x^2+4)^2\,dx$, choose $u=x^2+4$. Then $du=2x\,dx$, so $6x\,dx=3\,du$. The integral becomes $3\int u^2\,du=u^3+C=(x^2+4)^3+C$. A derivative check gives $3(x^2+4)^2(2x)$, exactly the original integrand. This check catches the common missing factor of $3$.

The inner derivative may differ by a constant, which can be compensated. For $\int e^{5x}\,dx$, $u=5x$ gives $dx=du/5$, hence $e^{5x}/5+C$. But a variable factor cannot be invented. Choosing $u=x^2$ in $\int e^{x^2}\,dx$ does not produce $\int e^u\,du$ because the required $2x$ factor is absent. Expressing $dx$ in terms of $u$ introduces another nonconstant factor rather than solving the difficulty.

Look for structure before expanding. The derivative-over-function pattern gives $\int g'(x)/g(x)\,dx=\ln|g(x)|+C$ on intervals where $g$ never vanishes. For example, $\int2x/(x^2+3)\,dx=\ln(x^2+3)+C$, with no absolute value needed because the argument is positive. Similarly, an inverse-trigonometric derivative can be recognized after rescaling: $\int1/(9+x^2)\,dx=(1/3)\arctan(x/3)+C$.

Substitution is a change in the entire expression, not just a nickname for part of it. Once the integral is written in $u$, no unexplained $x$ should remain. After an indefinite integration, return to the original variable. Different correct substitutions may yield answers that look different but differ only by a constant on the stated interval; differentiation is the natural way to compare them.

Related definitions: [Substitution in integration](ref:calculus-u-substitution).

## Changing bounds and checking the model

A definite integral offers two consistent routes after substitution. You can transform the bounds and finish entirely in the new variable, or find an antiderivative in the original variable and then use the original bounds. Mixing these routes is the mistake to avoid. Bounds record values of the current variable, not numbers that can be copied mechanically.

For $I=\int_0^2 2x(x^2+1)^2\,dx$, let $u=x^2+1$. At the original lower endpoint $x=0$, $u=1$; at the upper endpoint $x=2$, $u=5$. Thus $I=\int_1^5u^2\,du=[u^3/3]_1^5=(125-1)/3=124/3$. Alternatively, use $(x^2+1)^3/3$ and evaluate from $0$ to $2$, obtaining the same value. Evaluating $u^3/3$ from $0$ to $2$ would solve a different problem.

A decreasing substitution reverses the transformed bounds and also introduces a negative differential. These two signs work together. For $\int_0^1e^{-x}\,dx$, setting $u=-x$ yields $-\int_0^{-1}e^u\,du=\int_{-1}^0e^u\,du=1-e^{-1}$. The answer must be positive because the integrand is positive on a forward interval.

The derivative-matched substitution formula does not require the inner function to be one-to-one. For instance, $\int_{-1}^1 2x\cos(x^2)\,dx$ transforms to equal endpoint values and is zero. As $x$ travels toward zero and then away, $u=x^2$ runs backward and forward, so the signed contributions cancel. This does not say every integral under a non-injective change of coordinates can be transformed without care; the chain factor is essential here.

Finally, combine the symbolic result with its meaning. If a rate is $r(t)=2t/(t^2+1)$ on $[0,2]$, its accumulated change is $\ln5$. A starting amount still has to be added. If an answer violates a sign bound, has the wrong units, or leaves the integration variable in a fixed-bound result, revisit the setup before trusting algebra. A complete solution includes the interval, substitution, endpoint interpretation, and final quantity.

Related definitions: [Transformed bounds](ref:calculus-transformed-bounds).
