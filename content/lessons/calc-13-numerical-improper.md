# Numerical and Improper Integration

Two different obstacles can prevent a routine endpoint calculation. A well-behaved finite integral may lack a convenient antiderivative, making numerical approximation useful. Alternatively, an infinite interval or an unbounded integrand may require a new limit before an integral even has a value. We separate approximation from convergence: a calculator output is not a proof that an improper integral exists, and a convergence proof need not provide an elementary formula.

## Midpoint and trapezoidal approximations

A finite integral can be useful even when its antiderivative is awkward or unavailable in elementary form. Numerical integration replaces the curve by a simpler approximation whose integral is known. The midpoint rule uses constant heights over equal subintervals; the trapezoidal rule joins successive endpoint values by straight lines. Both converge to the integral for continuous functions as the widths shrink.

Let $h=(b-a)/n$ and $x_i=a+ih$. The midpoint formula is $M_n=h\sum_{i=1}^nf((x_{i-1}+x_i)/2)$. The trapezoidal formula is $T_n=\frac h2[f(x_0)+2\sum_{i=1}^{n-1}f(x_i)+f(x_n)]$. The factor two counts an interior sample in the neighboring trapezoids on both sides. The two exterior endpoints appear only once.

For $f(x)=x^2$ on $[0,2]$ with $n=2$, $h=1$. Midpoints $1/2,3/2$ give $M_2=1/4+9/4=5/2$. Endpoint values $0,1,4$ give $T_2=(0+2+4)/2=3$. The true integral is $8/3$, between those estimates. For a concave-up graph, chords lie above the curve, making the trapezoidal rule an overestimate; the midpoint rule is an underestimate. Concave-down graphs reverse these conclusions.

This error direction concerns concavity, not monotonicity. A decreasing concave-up function still has trapezoids above its graph. If concavity changes, no global direction follows from a single local picture. A function can also have negative values while the same signed inequalities remain valid.

Measured data may be unequally spaced. In that case add individual trapezoids: $\sum\frac{x_i-x_{i-1}}2[f(x_{i-1})+f(x_i)]$. The equal-width compressed formula cannot be used unchanged. Approximation error from replacing the curve with lines is distinct from errors in the measured values themselves. More samples may reduce discretization error without correcting a biased sensor. Keep the sample spacing and the data units visible so the computed number can be interpreted as an accumulated quantity.

Related definitions: [Midpoint rule](ref:calculus-midpoint-rule); [Trapezoidal rule](ref:calculus-trapezoidal-rule).

## Simpson’s rule and error control

Simpson's rule fits a parabola through three equally spaced samples, using two intervals at a time. For an even number $n$ of subintervals of width $h$, the formula is $S_n=\frac h3[f(x_0)+4f(x_1)+2f(x_2)+\cdots+4f(x_{n-1})+f(x_n)]$. The weights alternate $4,2$ internally and end with $1$. Equal spacing and even $n$ are part of this formula, not optional conveniences.

For $x^2$ on $[0,2]$, $S_2=(1/3)[0+4(1)+4]=8/3$, exactly the integral because the interpolating parabola is the function itself. Simpson's rule is also exact for cubics; the error bound below explains this since a cubic's fourth derivative is zero. It is not exact for arbitrary smooth functions: for $x^4$ on $[0,2]$, $S_2=(0+4+16)/3=20/3$, while the exact integral is $32/5$.

Approximation needs an error description. Absolute error is $|I-Q|$, where $Q$ is the approximation. Relative error is $|I-Q|/|I|$ when $I\ne0$. Relative error becomes undefined at zero and can be misleading near a strongly cancelling integral, so an absolute tolerance is often the clearer requirement.

Derivative bounds can guarantee accuracy without knowing $I$. If $f$ has a continuous second derivative with $|f''|\le K_2$ on $[a,b]$, then $|I-M_n|\le K_2(b-a)^3/(24n^2)$ and $|I-T_n|\le K_2(b-a)^3/(12n^2)$. If a continuous fourth derivative satisfies $|f^{(4)}|\le K_4$, then $|I-S_n|\le K_4(b-a)^5/(180n^4)$. These are bounds, not assertions of equality or error sign.

For $x^2$ on $[0,1]$, $K_2=2$. To guarantee trapezoidal error at most $1/600$, require $1/(6n^2)\le1/600$, so $n\ge10$. Always round a required sample count upward; for Simpson also round up to an even integer. Doubling $n$ divides the second-derivative bounds by four and the Simpson bound by sixteen, assuming the same derivative bounds remain valid.

Related definitions: [Simpson’s rule](ref:calculus-simpson-rule); [Quadrature error bound](ref:calculus-quadrature-error).

## Infinite intervals as limits

An infinite interval is not covered by the original closed-interval definition. Instead define $\int_a^\infty f(x)\,dx=\lim_{b\to\infty}\int_a^b f(x)\,dx$ if the limit exists as a finite real number. If no finite limit exists, the improper integral diverges. A limit of $+\infty$ describes divergence, not convergence to an unusually large number.

For $\int_1^\infty x^{-2}dx$, first keep $b$ finite: $\int_1^b x^{-2}dx=[-1/x]_1^b=1-1/b$. Taking $b\to\infty$ gives $1$. A region extending forever can have finite area when its heights decrease sufficiently fast. In contrast, $\int_1^b1/x\,dx=\ln b$, which grows without bound, so the harmonic-type integral diverges.

The general power comparison is $\int_1^\infty x^{-p}dx$. If $p\ne1$, its finite expression is $(b^{1-p}-1)/(1-p)$. When $p>1$, the power $b^{1-p}$ tends to zero and the value is $1/(p-1)$. When $p<1$, it grows without bound; the case $p=1$ is logarithmic and also diverges. This is the tail $p$-integral rule: convergence occurs exactly when $p>1$.

Exponential decay gives another useful tail. For $k>0$, $\int_0^\infty e^{-kx}dx=\lim_{b\to\infty}(1-e^{-kb})/k=1/k$. A positive decay rate is essential; if $k=0$, the integrand is constant, while negative $k$ produces growth. A limiting argument makes these parameter conditions visible.

For an integral over the whole real line, choose a finite splitting point $c$ and require both $\int_{-\infty}^c f$ and $\int_c^\infty f$ to converge separately. A symmetric truncation alone is a different notion and can hide divergence by cancellation. Likewise, an oscillating integrand is not guaranteed to have a convergent integral merely because a graph looks balanced. Work with the actual finite expression and its limit rather than treating infinity as an ordinary endpoint.

Related definitions: [Improper integral over an infinite interval](ref:calculus-improper-infinite-integral).

## Endpoint and interior singularities

An unbounded integrand can occur on a finite interval. For a singularity at the lower endpoint $a$, define the integral by approaching from inside: $\int_a^b f=\lim_{\varepsilon\downarrow0}\int_{a+\varepsilon}^bf$. At an upper endpoint use a left-hand approach. Each finite truncated interval must avoid the singularity, allowing ordinary integration before the limit.

For $\int_0^1x^{-1/2}dx$, truncate at $\varepsilon>0$. The result is $[2\sqrt x]_\varepsilon^1=2-2\sqrt\varepsilon$, which tends to $2$. The graph becomes arbitrarily tall near zero, yet the narrow region there has finite area. For $\int_0^11/x\,dx$, the expression is $-\ln\varepsilon$, which diverges as $\varepsilon\downarrow0$.

More generally, $\int_0^1x^{-p}dx$ converges exactly when $p<1$, giving $1/(1-p)$. This reverses the inequality for the tail integral on $[1,\infty)$. At zero, stronger singularity means larger $p$; at infinity, larger $p$ means faster decay. The two rules are consistent because they describe different limiting locations.

For an interior singularity $c\in(a,b)$, split into $\int_a^cf+\int_c^bf$ and require both sides to converge separately. The integral of $1/x$ on $[-1,1]$ fails this requirement: the left contribution diverges negatively and the right positively. Symmetric cutoffs yield cancellation, but that principal-value construction is not the ordinary improper integral. Never combine opposite infinities into a finite answer.

A removable hole is different from unbounded behavior. If a function agrees with a bounded continuous extension except at one point, assigning the limiting value there leaves the integral unchanged. In contrast, $1/x^2$ cannot be repaired at zero with a single finite point value because its nearby values are unbounded. Inspect the local behavior, not merely whether a formula happens to have a zero denominator. This distinction also helps choose a numerical method: endpoint sampling at an actual singularity is undefined even if the improper integral converges.

Related definitions: [Improper integral at a singularity](ref:calculus-singular-improper-integral).

## Comparison and controlled truncation

Exact antiderivatives are not required to establish convergence. If $0\le f(x)\le g(x)$ on a tail and $\int g$ converges, then $\int f$ converges by comparison. The truncated integrals of $f$ increase but remain bounded by the finite total for $g$. Conversely, if the smaller nonnegative integral diverges, the larger one must diverge too. The inequality's direction is essential.

For $x\ge1$, $0\le1/(1+x^2)\le1/x^2$, so its tail converges. But $1/x^2\le1/x$ does not establish divergence of $1/x^2$ just because the larger integral diverges. Both convergent and divergent functions can lie below the same divergent benchmark. Near a finite singularity, analogous one-sided comparisons apply over a small interval next to the troublesome point.

A useful infinite-range approximation separates two errors. Replacing $\int_a^\infty f$ by a quadrature estimate on $[a,B]$ omits the tail and approximates the retained finite interval. The total absolute error is at most the finite-interval quadrature error plus an absolute tail bound. A small step size on $[a,B]$ cannot recover an important contribution beyond $B$.

For $\int_1^\infty x^{-2}dx$, the omitted tail is exactly $1/B$. To make it at most $0.001$, choose $B\ge1000$. This illustrates how slowly algebraic tails may shrink. For $e^{-x}$, the tail is $e^{-B}$, so $B\ge\ln1000$ achieves the same bound. The cutoff should follow decay information rather than a generic “large number.”

For a non-elementary example, when $x\ge B\ge1$, $e^{-x^2}\le x e^{-x^2}$. Thus $\int_B^\infty e^{-x^2}dx\le\int_B^\infty xe^{-x^2}dx=e^{-B^2}/2$. This bounds a tail using an integrable comparison that deliberately includes a derivative factor. One can then approximate the finite interval with an appropriate numerical rule and combine the two bounds. Report both contributions to distinguish an honest controlled approximation from a visually plausible truncation.

Related definitions: [Comparison for improper integrals](ref:calculus-integral-comparison); [Truncation error](ref:calculus-truncation-error).
