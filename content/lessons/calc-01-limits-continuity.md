# Limits and Continuity

A program can evaluate a formula at one input; calculus also asks what its outputs do throughout a neighborhood. A limit makes this second question precise. It will let us describe an instantaneous rate without dividing by zero and later describe accumulation without adding infinitely many numbers informally. Bring your knowledge of functions, factoring, inequalities, and quantifiers. We begin with numerical and geometric meaning, build reliable algebraic methods, and then distinguish approaching a value from actually taking that value. The final section gives a short proof using the precise definition. The purpose is to connect intuition with a guarantee, not to replace intuition with symbols.

## Approaching a value from nearby inputs

For a function $f$, the statement $\lim_{x\to a}f(x)=L$ describes nearby inputs different from $a$. As those inputs approach $a$, the outputs become arbitrarily close to $L$ and remain close. The input may approach from either side. The statement neither requires $f(a)$ to exist nor specifies its value. Read the notation aloud as “the limit of $f(x)$ as $x$ approaches $a$ is $L$.” The letter $x$ varies; $a$ and $L$ are fixed in this statement.

Consider $f(x)=(x^2-9)/(x-3)$ for $x\ne3$. At $x=2.9$ and $3.1$ the outputs are $5.9$ and $6.1$; at $2.99$ and $3.01$ they are $5.99$ and $6.01$. Factoring shows why: every permitted nearby input gives $f(x)=x+3$. Thus the limit is $6$, although the original expression has no value at $3$. On a graph, draw the line $y=x+3$ with an open circle at $(3,6)$. If we separately define $f(3)=20$, the dot at $(3,20)$ changes the function value but leaves the nearby behavior intact.

A table provides evidence rather than a proof. Any finite table can miss a narrow spike or rapid oscillation. Always use both sides, then explain why the pattern persists. The left-hand limit $\lim_{x\to a^-}f(x)$ uses $x<a$; the right-hand limit uses $x>a$. For a finite two-sided limit, both one-sided limits must exist and agree. They are not averaged.

For example, let $g(x)=2x+1$ when $x<1$ and $g(x)=x+5$ when $x\ge1$. The left-hand limit at $1$ is $3$ and the right-hand limit is $6$. No single finite number describes both sides, so the two-sided limit does not exist. Changing only $g(1)$ cannot repair that jump. In practice, first identify which branch applies to nearby inputs, then substitute into that branch. The equality sign in a piecewise condition controls the value at the boundary, not the branch approached from the other side.

Related definitions: [Limit](ref:calculus-limit); [One-sided limit](ref:calculus-one-sided-limit).

![A limit and an assigned value](figure:calculus-figure-1)

## Limit laws, cancellation, and squeezing

Once finite limits exist, sums, differences, constant multiples, and products pass through the limit. Quotients do too if the denominator's limit is nonzero. Consequently a polynomial limit can be evaluated by substitution, and a rational function can be evaluated that way wherever its denominator is nonzero. This is a theorem-based shortcut, not a universal instruction to substitute regardless of the result.

For instance, $\lim_{x\to2}(x^2+3)/(x+1)=7/3$. Both component limits exist and the denominator tends to $3$. In contrast, substituting into $(x^2-4)/(x-2)$ produces the expression $0/0$, which is undefined. It indicates that this attempted calculation did not determine the limit. It is not a number and does not by itself mean the limit fails.

Factor before taking the limit: for $x\ne2$, $(x^2-4)/(x-2)=x+2$, so the limit is $4$. Cancellation is valid at all the nearby inputs used by the limit. It does not fill the original hole. If roots obstruct factoring, multiply numerator and denominator by a conjugate. For $x\ne9$,

$\dfrac{\sqrt{x}-3}{x-9}=\dfrac{1}{\sqrt{x}+3}$.

The right side tends to $1/6$. We used $(\sqrt{x}-3)(\sqrt{x}+3)=x-9$, and near $9$ the square root is defined. Check those domain facts before manipulating a formula.

Sometimes bounds are more useful than simplification. The squeeze theorem says that if $g(x)\le f(x)\le h(x)$ for nearby inputs, and both bounding functions tend to $L$, then $f$ also tends to $L$. Because $-1\le\sin(1/x)\le1$, we have $-|x|\le x\sin(1/x)\le|x|$. Both bounds tend to zero, so the middle expression does too. The oscillating factor alone has no limit; multiplication by a shrinking factor controls every oscillation. Notice that the product law could not be applied directly, because one factor has no limit. The squeeze argument supplies the missing reasoning.

Related definitions: [Indeterminate form](ref:calculus-indeterminate-form); [Squeeze theorem](ref:calculus-squeeze-theorem).

## Unbounded behavior and limits at infinity

The notation $\lim_{x\to a}f(x)=+\infty$ means that outputs exceed every proposed positive height once the input is sufficiently close to $a$ through the relevant domain. It does not assign the real number infinity to $f(a)$. We call this an infinite limit, while keeping it distinct from the existence of a finite real limit. Negative infinity describes outputs falling below every negative threshold.

For $1/(x-2)^2$, the denominator is positive on both sides of $2$ and becomes arbitrarily small, so both one-sided limits are $+\infty$. For $1/(x-2)$, the left-hand limit is $-\infty$ and the right-hand limit is $+\infty$. In either example $x=2$ is a vertical asymptote: at least one one-sided limit is infinite. A denominator that vanishes is a reason to investigate, not a sufficient test for an asymptote. The canceled factor in $(x^2-4)/(x-2)$ leaves a finite limit instead.

A different notation, $x\to+\infty$, asks what happens as inputs grow without bound. Here there is no finite input being approached. For $f(x)=(3x^2-2)/(x^2+5)$, divide numerator and denominator by $x^2$:

$f(x)=\dfrac{3-2/x^2}{1+5/x^2}\longrightarrow3$.

The horizontal line $y=3$ describes the long-run output. It need not be a barrier that the graph can never cross. For rational functions, comparing highest powers is a useful consequence of this division: lower numerator degree gives limit zero; equal degrees give the ratio of leading coefficients. Higher numerator degree requires checking the leading power and its sign.

Treat negative infinity separately when odd powers or absolute values occur. For example, $\sqrt{x^2+1}/x=\sqrt{1+1/x^2}$ for $x>0$, but equals $-\sqrt{1+1/x^2}$ for $x<0$. Its limits are therefore $1$ and $-1$. The reason is $\sqrt{x^2}=|x|$, not $x$. A sign check before simplification prevents a convincing-looking wrong answer.

Related definitions: [Vertical asymptote](ref:calculus-vertical-asymptote); [Limit at infinity](ref:calculus-limit-at-infinity).

## Continuity and the intermediate value theorem

Continuity joins nearby behavior to the value at the point. A function is continuous at an interior domain point $a$ when $f(a)$ is defined, the finite limit as $x\to a$ exists, and that limit equals $f(a)$. Each requirement rules out a different failure: a missing value, incompatible nearby behavior, or a misplaced value. At an endpoint of a stated interval, use the appropriate one-sided limit. A function is continuous on an interval if it is continuous at every point of that interval in this sense.

Polynomials are continuous everywhere; rational functions are continuous where their denominators are nonzero. Composing continuous functions preserves continuity wherever the composition is defined. Thus $\sqrt{x^2+1}$ is continuous for all real $x$, while $1/\sqrt{x}$ is continuous only on its domain $x>0$. “Continuous on its domain” does not mean “defined everywhere.”

A finite hole is removable because a single reassignment repairs it. Define $f(x)=(x^2-16)/(x-4)$ for $x\ne4$. The nearby limit is $8$, so setting $f(4)=8$ produces continuity. A jump cannot be repaired with one value because its one-sided limits disagree. For a piecewise definition, match the branch limits before choosing the boundary value. For example, the branches $kx+1$ for $x<2$ and $x^2-1$ for $x\ge2$ join continuously exactly when $2k+1=3$, giving $k=1$.

The intermediate value theorem, or IVT, says that a continuous function on $[a,b]$ takes every value between $f(a)$ and $f(b)$. If the endpoint values have opposite signs, at least one root lies between them. For $p(x)=x^3-x-1$, we have $p(1)=-1$ and $p(2)=5$; continuity guarantees a root in $(1,2)$. This is an existence argument, not a formula for the root and not a uniqueness proof. Without continuity the conclusion can fail: $1/x$ changes sign across zero but never equals zero and is not continuous on an interval containing zero. Always name the interval on which the theorem's hypotheses hold.

Related definitions: [Continuity](ref:calculus-continuity); [Intermediate value theorem](ref:calculus-intermediate-value-theorem).

## A precise guarantee with epsilon and delta

The phrase “arbitrarily close” can be stated using two positive tolerances. The output tolerance $\epsilon$ specifies how close $f(x)$ must be to a proposed limit $L$. We must find an input tolerance $\delta$ so that every permitted input within that distance of $a$, except $a$ itself, meets the output requirement:

$\text{for every }\epsilon>0\text{ there exists }\delta>0\text{ such that }0<|x-a|<\delta\implies|f(x)-L|<\epsilon.$

The order matters. Someone specifies any positive $\epsilon$; we then choose $\delta$, which may depend on that tolerance and on the fixed function and target. It must not depend on the particular $x$ subsequently tested. One good nearby input is insufficient: the implication must hold for all inputs satisfying the condition. The puncture $0<|x-a|$ preserves the distinction between a limit and a point value.

To prove $\lim_{x\to2}(3x+1)=7$, start by examining the required output error: $|(3x+1)-7|=3|x-2|$. To make this less than $\epsilon$, it is enough to require $|x-2|<\epsilon/3$. The proof now runs forward. Given $\epsilon>0$, choose $\delta=\epsilon/3>0$. Whenever $0<|x-2|<\delta$, we obtain $|(3x+1)-7|=3|x-2|<3\delta=\epsilon$. This covers every permitted input and every requested tolerance, so the limit is established.

A suitable delta need not be the largest possible one. Choosing $\epsilon/6$ in the same proof also works. For a constant function already equal to $L$, any positive delta works because the error is zero. For nonlinear functions a preliminary neighborhood bound is useful: to prove $x^2\to4$ as $x\to2$, first require $|x-2|<1$, giving $|x+2|<5$. Then $|x^2-4|<5|x-2|$, and $\delta=\min(1,\epsilon/5)$ suffices. This is the same tolerance-control idea with one extra factor to bound; it is not a different definition.

A useful way to organize a limit solution is to state the proposed value, identify the mechanism that controls all nearby inputs, and check that the mechanism applies on the relevant domain. Factoring controls an entire punctured neighborhood through an identity. Squeezing controls it through inequalities. An epsilon–delta proof controls it through an explicit implication. These are different presentations of reliable evidence, unlike a collection of isolated samples. When a limit fails, give a reason such as incompatible one-sided values, unbounded behavior, or two sequences of inputs producing incompatible outputs. The phrase “the calculator cannot evaluate it” identifies a tool limitation, not a mathematical reason.

Related definitions: [Epsilon–delta guarantee](ref:calculus-epsilon-delta); [Punctured neighborhood](ref:calculus-punctured-neighborhood).
