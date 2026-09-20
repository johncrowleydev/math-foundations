import { r, source, term, n, e, t, o, qc } from './integration-helpers.mjs';
const numerical = source(
  2,
  3,
  6,
  'Numerical Integration',
  'Midpoint, trapezoidal, and Simpson formulas, derivative error bounds, and absolute/relative error.',
);
const improper = source(
  2,
  3,
  7,
  'Improper Integrals',
  'Infinite intervals, unbounded integrands, separate limits, and comparison.',
);
export default {
  number: 13,
  slug: 'calculus-numerical-improper',
  title: 'Numerical and Improper Integration',
  intro: r`Two different obstacles can prevent a routine endpoint calculation. A well-behaved finite integral may lack a convenient antiderivative, making numerical approximation useful. Alternatively, an infinite interval or an unbounded integrand may require a new limit before an integral even has a value. We separate approximation from convergence: a calculator output is not a proof that an improper integral exists, and a convergence proof need not provide an elementary formula.`,
  sections: [
    {
      title: 'Midpoint and trapezoidal approximations',
      sources: [numerical],
      terms: [
        term(
          'midpoint-rule',
          'Midpoint rule',
          'Approximate each interval using its midpoint height.',
          r`For equal width $h=(b-a)/n$, $M_n=h\sum_{i=1}^n f(a+(i-1/2)h)$.`,
          r`For $x^2$ on $[0,2]$, $M_2=5/2$.`,
          'A midpoint sample is not generally the average of the endpoint heights.',
        ),
        term(
          'trapezoidal-rule',
          'Trapezoidal rule',
          'Integrate straight-line segments between endpoint samples.',
          r`$T_n=\frac h2[f(x_0)+2f(x_1)+\cdots+2f(x_{n-1})+f(x_n)]$.`,
          r`For $x^2$ on $[0,2]$, $T_2=3$.`,
          'Interior heights receive weight two because they border two trapezoids.',
        ),
      ],
      body: r`A finite integral can be useful even when its antiderivative is awkward or unavailable in elementary form. Numerical integration replaces the curve by a simpler approximation whose integral is known. The midpoint rule uses constant heights over equal subintervals; the trapezoidal rule joins successive endpoint values by straight lines. Both converge to the integral for continuous functions as the widths shrink.

Let $h=(b-a)/n$ and $x_i=a+ih$. The midpoint formula is $M_n=h\sum_{i=1}^nf((x_{i-1}+x_i)/2)$. The trapezoidal formula is $T_n=\frac h2[f(x_0)+2\sum_{i=1}^{n-1}f(x_i)+f(x_n)]$. The factor two counts an interior sample in the neighboring trapezoids on both sides. The two exterior endpoints appear only once.

For $f(x)=x^2$ on $[0,2]$ with $n=2$, $h=1$. Midpoints $1/2,3/2$ give $M_2=1/4+9/4=5/2$. Endpoint values $0,1,4$ give $T_2=(0+2+4)/2=3$. The true integral is $8/3$, between those estimates. For a concave-up graph, chords lie above the curve, making the trapezoidal rule an overestimate; the midpoint rule is an underestimate. Concave-down graphs reverse these conclusions.

This error direction concerns concavity, not monotonicity. A decreasing concave-up function still has trapezoids above its graph. If concavity changes, no global direction follows from a single local picture. A function can also have negative values while the same signed inequalities remain valid.

Measured data may be unequally spaced. In that case add individual trapezoids: $\sum\frac{x_i-x_{i-1}}2[f(x_{i-1})+f(x_i)]$. The equal-width compressed formula cannot be used unchanged. Approximation error from replacing the curve with lines is distinct from errors in the measured values themselves. More samples may reduce discretization error without correcting a biased sensor. Keep the sample spacing and the data units visible so the computed number can be interpreted as an accumulated quantity.`,
      questions: [
        n(
          r`Find $M_2$ for $x^2$ on $[0,2]$.`,
          '5/2',
          r`Width $1$ times midpoint heights $1/4$ and $9/4$ gives $5/2$.`,
        ),
        n(r`Find $T_2$ for $x^2$ on $[0,2]$.`, '3', r`$T_2=(1/2)[0+2(1)+4]=3$.`),
        n(
          r`Find $T_2$ for $f(x)=3x+1$ on $[0,2]$.`,
          '8',
          r`The endpoint heights are $1,4,7$, so $(1/2)(1+8+7)=8$. The line interpolation is exact.`,
        ),
        n(
          r`Find $M_2$ for $f(x)=x^2+2$ on $[0,2]$.`,
          '13/2',
          r`The two midpoint heights are $9/4$ and $17/4$, totaling $26/4=13/2$.`,
        ),
        n(
          r`At $x=0,1,3$, function values are $2,4,5$. Find the sum of the two unequal-width trapezoids.`,
          '12',
          r`The areas are $1(2+4)/2=3$ and $2(4+5)/2=9$, totaling $12$.`,
        ),
        n(
          r`Find $T_1$ for $1/x$ on $[1,2]$.`,
          '3/4',
          r`Width $1$ times average endpoint height $(1+1/2)/2$ is $3/4$.`,
        ),
        n(
          r`Find $M_1$ for $1/x$ on $[1,2]$.`,
          '2/3',
          r`The midpoint is $3/2$, whose height is $2/3$, and the width is $1$.`,
        ),
        t(
          r`For a concave-up function, is the trapezoidal rule an underestimate or overestimate?`,
          'overestimate',
          r`Each chord lies above the curve, so its signed area is at least the curve's integral.`,
        ),
        o(
          r`Derive why interior function values have coefficient two in the composite trapezoidal formula.`,
          r`Each interval contributes $h[f(x_{i-1})+f(x_i)]/2$. Adding intervals includes every interior endpoint once as a right endpoint and once as a left endpoint, while the outer endpoints occur only once.`,
          'prove',
        ),
        o(
          r`Why does a decreasing function not automatically make the trapezoidal estimate too small?`,
          r`Trapezoidal error direction depends on concavity, not whether heights increase. The decreasing concave-up function $1/x$ on $[1,2]$ has chords above the curve and therefore an overestimate.`,
        ),
      ],
      review: [
        n(
          r`Find $M_2$ for $x^2$ on $[-1,1]$.`,
          '1/2',
          r`Both midpoint heights are $1/4$ and widths are $1$, giving $1/2$.`,
        ),
        n(
          r`For equally spaced $x=0,2,4$ with heights $1,3,2$, compute the trapezoidal estimate.`,
          '9',
          r`Here $h=2$, so $T=(2/2)[1+2(3)+2]=9$.`,
        ),
        t(
          r`For a concave-down function, is the midpoint rule an underestimate or overestimate?`,
          'overestimate',
          r`The midpoint rectangles give a signed estimate above the true integral under uniform concave-down curvature.`,
        ),
      ],
      quickCheck: qc(
        r`In $T_n$, why are interior sample heights doubled?`,
        [
          'They are measured twice as accurately',
          'Each borders two adjacent trapezoids',
          'All integration methods double them',
        ],
        1,
        r`Adding the separate trapezoid areas counts each shared endpoint in both neighbors.`,
      ),
    },
    {
      title: 'Simpson’s rule and error control',
      sources: [numerical],
      terms: [
        term(
          'simpson-rule',
          'Simpson’s rule',
          'Integrate quadratic interpolants over pairs of intervals.',
          r`For even $n$, $S_n=\frac h3[f_0+4f_1+2f_2+\cdots+4f_{n-1}+f_n]$.`,
          r`For $x^2$ on $[0,2]$, $S_2=(0+4+4)/3=8/3$.`,
          'The composite rule requires an even number of equal subintervals.',
        ),
        term(
          'quadrature-error',
          'Quadrature error bound',
          'A guaranteed maximum discrepancy under smoothness assumptions.',
          r`If $|f''|\le K_2$, then $|I-M_n|\le K_2(b-a)^3/(24n^2)$ and $|I-T_n|\le K_2(b-a)^3/(12n^2)$.`,
          r`Doubling $n$ divides these bounds by four.`,
          'An upper bound need not equal the actual error.',
        ),
      ],
      body: r`Simpson's rule fits a parabola through three equally spaced samples, using two intervals at a time. For an even number $n$ of subintervals of width $h$, the formula is $S_n=\frac h3[f(x_0)+4f(x_1)+2f(x_2)+\cdots+4f(x_{n-1})+f(x_n)]$. The weights alternate $4,2$ internally and end with $1$. Equal spacing and even $n$ are part of this formula, not optional conveniences.

For $x^2$ on $[0,2]$, $S_2=(1/3)[0+4(1)+4]=8/3$, exactly the integral because the interpolating parabola is the function itself. Simpson's rule is also exact for cubics; the error bound below explains this since a cubic's fourth derivative is zero. It is not exact for arbitrary smooth functions: for $x^4$ on $[0,2]$, $S_2=(0+4+16)/3=20/3$, while the exact integral is $32/5$.

Approximation needs an error description. Absolute error is $|I-Q|$, where $Q$ is the approximation. Relative error is $|I-Q|/|I|$ when $I\ne0$. Relative error becomes undefined at zero and can be misleading near a strongly cancelling integral, so an absolute tolerance is often the clearer requirement.

Derivative bounds can guarantee accuracy without knowing $I$. If $f$ has a continuous second derivative with $|f''|\le K_2$ on $[a,b]$, then $|I-M_n|\le K_2(b-a)^3/(24n^2)$ and $|I-T_n|\le K_2(b-a)^3/(12n^2)$. If a continuous fourth derivative satisfies $|f^{(4)}|\le K_4$, then $|I-S_n|\le K_4(b-a)^5/(180n^4)$. These are bounds, not assertions of equality or error sign.

For $x^2$ on $[0,1]$, $K_2=2$. To guarantee trapezoidal error at most $1/600$, require $1/(6n^2)\le1/600$, so $n\ge10$. Always round a required sample count upward; for Simpson also round up to an even integer. Doubling $n$ divides the second-derivative bounds by four and the Simpson bound by sixteen, assuming the same derivative bounds remain valid.`,
      questions: [
        n(r`Find $S_2$ for $x^2$ on $[0,2]$.`, '8/3', r`With $h=1$, $S_2=(1/3)[0+4(1)+4]=8/3$.`),
        n(
          r`Find $S_2$ for $x^3$ on $[0,2]$.`,
          '4',
          r`$S_2=(1/3)[0+4(1)+8]=4$, exactly matching the cubic integral.`,
        ),
        n(r`Find $S_2$ for $x^4$ on $[0,2]$.`, '20/3', r`$S_2=(1/3)[0+4(1)+16]=20/3$.`),
        n(
          r`The true integral is $10$ and an estimate is $9.8$. Find absolute error.`,
          '1/5',
          r`$|10-9.8|=0.2=1/5$.`,
        ),
        n(
          r`The true integral is $10$ and an estimate is $9.8$. Find relative error as a number, not a percentage.`,
          '1/50',
          r`Absolute error $0.2$ divided by $10$ is $0.02=1/50$.`,
        ),
        n(
          r`With $K_2=2$, interval length $1$, and $n=10$, find the trapezoidal error bound.`,
          '1/600',
          r`$2/(12\cdot10^2)=1/600$.`,
        ),
        n(
          r`With $K_2=6$, interval length $2$, and $n=4$, find the midpoint error bound.`,
          '1/8',
          r`$6(2^3)/(24\cdot4^2)=48/384=1/8$.`,
        ),
        n(
          r`For $x^2$ on $[0,1]$, what minimum integer $n$ guarantees trapezoidal error at most $1/600$ using $K_2=2$?`,
          '10',
          r`Solve $1/(6n^2)\le1/600$, so $n^2\ge100$ and $n\ge10$.`,
        ),
        o(
          r`Why does the Simpson error bound establish exactness for every cubic polynomial?`,
          r`A cubic has fourth derivative identically zero. Thus one may choose $K_4=0$, forcing the absolute error bound to be zero under the rule's equal-width, even-interval assumptions.`,
          'prove',
        ),
        o(
          r`Explain why agreement between two successive numerical estimates is not by itself a rigorous error bound.`,
          r`Both sample patterns may miss the same narrow feature or share a bias. Small difference between estimates measures their mutual agreement, not necessarily proximity to the exact integral. A proved bound needs additional smoothness information or another justified argument.`,
        ),
      ],
      review: [
        n(
          r`For Simpson samples $f(0)=1,f(1)=2,f(2)=5$, find $S_2$.`,
          '14/3',
          r`$S_2=(1/3)[1+4(2)+5]=14/3$.`,
        ),
        n(
          r`A Simpson bound is $1/100$ with $n$ intervals. What is the corresponding bound with $2n$ intervals and the same derivative bound?`,
          '1/1600',
          r`The denominator contains $n^4$, so doubling reduces the bound by $16$.`,
        ),
        o(
          r`A sample-count inequality gives $n\ge7.2$ for composite Simpson integration. Which count should be chosen and why?`,
          r`Choose $n=8$: the count must be an integer at least $7.2$ and must be even. Rounding down would not satisfy the bound.`,
        ),
      ],
    },
    {
      title: 'Infinite intervals as limits',
      sources: [improper],
      terms: [
        term(
          'improper-infinite-integral',
          'Improper integral over an infinite interval',
          'A limit of finite-interval integrals.',
          r`$\int_a^\infty f=\lim_{b\to\infty}\int_a^b f$ when the limit is finite.`,
          r`$\int_1^\infty x^{-2}dx=1$.`,
          'Infinity is not a real endpoint to substitute into an antiderivative.',
        ),
      ],
      body: r`An infinite interval is not covered by the original closed-interval definition. Instead define $\int_a^\infty f(x)\,dx=\lim_{b\to\infty}\int_a^b f(x)\,dx$ if the limit exists as a finite real number. If no finite limit exists, the improper integral diverges. A limit of $+\infty$ describes divergence, not convergence to an unusually large number.

For $\int_1^\infty x^{-2}dx$, first keep $b$ finite: $\int_1^b x^{-2}dx=[-1/x]_1^b=1-1/b$. Taking $b\to\infty$ gives $1$. A region extending forever can have finite area when its heights decrease sufficiently fast. In contrast, $\int_1^b1/x\,dx=\ln b$, which grows without bound, so the harmonic-type integral diverges.

The general power comparison is $\int_1^\infty x^{-p}dx$. If $p\ne1$, its finite expression is $(b^{1-p}-1)/(1-p)$. When $p>1$, the power $b^{1-p}$ tends to zero and the value is $1/(p-1)$. When $p<1$, it grows without bound; the case $p=1$ is logarithmic and also diverges. This is the tail $p$-integral rule: convergence occurs exactly when $p>1$.

Exponential decay gives another useful tail. For $k>0$, $\int_0^\infty e^{-kx}dx=\lim_{b\to\infty}(1-e^{-kb})/k=1/k$. A positive decay rate is essential; if $k=0$, the integrand is constant, while negative $k$ produces growth. A limiting argument makes these parameter conditions visible.

For an integral over the whole real line, choose a finite splitting point $c$ and require both $\int_{-\infty}^c f$ and $\int_c^\infty f$ to converge separately. A symmetric truncation alone is a different notion and can hide divergence by cancellation. Likewise, an oscillating integrand is not guaranteed to have a convergent integral merely because a graph looks balanced. Work with the actual finite expression and its limit rather than treating infinity as an ordinary endpoint.`,
      questions: [
        n(
          r`Evaluate $\int_1^\infty x^{-2}\,dx$.`,
          '1',
          r`The truncation is $1-1/b$, whose limit is $1$.`,
        ),
        n(r`Evaluate $\int_2^\infty x^{-3}\,dx$.`, '1/8', r`$[-1/(2x^2)]_2^b=1/8-1/(2b^2)\to1/8$.`),
        n(
          r`Evaluate $\int_0^\infty e^{-2x}\,dx$.`,
          '1/2',
          r`The finite result is $(1-e^{-2b})/2$, tending to $1/2$.`,
        ),
        n(r`Evaluate $\int_1^\infty x^{-3/2}\,dx$.`, '2', r`$[-2x^{-1/2}]_1^b=2-2/\sqrt b\to2$.`),
        n(
          r`Evaluate $\int_{-\infty}^0 e^x\,dx$.`,
          '1',
          r`$\int_a^0e^xdx=1-e^a\to1$ as $a\to-\infty$.`,
        ),
        t(
          r`Does $\int_1^\infty1/x\,dx$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`Its truncation equals $\ln b$, which grows without bound.`,
        ),
        t(
          r`Does $\int_1^\infty x^{-1/2}\,dx$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`This has $p=1/2\le1$; the truncation $2\sqrt b-2$ is unbounded.`,
        ),
        n(
          r`For $\int_1^\infty x^{-p}dx$ with $p=4$, find the value.`,
          '1/3',
          r`Since $p>1$, the value is $1/(p-1)=1/3$.`,
        ),
        o(
          r`Explain why an infinite interval can have finite area under a positive graph.`,
          r`The interval lengths keep accumulating, but heights can decrease fast enough that the total contributions approach a finite limit. For $x^{-2}$ on $[1,b]$, the total is $1-1/b<1$, approaching $1$ despite unbounded interval length.`,
        ),
        o(
          r`Does $\int_0^\infty\sin x\,dx$ converge? Justify with truncations.`,
          r`$\int_0^b\sin xdx=1-\cos b$. Along $b=2k\pi$ this is $0$, while along $b=(2k+1)\pi$ it is $2$. There is no limit, so the improper integral diverges.`,
        ),
      ],
      review: [
        n(r`Evaluate $\int_3^\infty2x^{-2}\,dx$.`, '2/3', r`$[-2/x]_3^b=2/3-2/b\to2/3$.`),
        n(
          r`Evaluate $\int_0^\infty3e^{-3x}\,dx$.`,
          '1',
          r`The antiderivative is $-e^{-3x}$; the limiting endpoint difference is $1$.`,
        ),
        o(
          r`Explain why writing $\ln\infty-\ln1$ is not an evaluation of $\int_1^\infty1/x\,dx$.`,
          r`Infinity is not a real input. Evaluate $\ln b$ for finite $b$ and take a limit. That limit is unbounded, so the proper conclusion is divergence rather than a finite integral value.`,
        ),
      ],
    },
    {
      title: 'Endpoint and interior singularities',
      sources: [improper],
      terms: [
        term(
          'singular-improper-integral',
          'Improper integral at a singularity',
          'Approach an unbounded endpoint using a one-sided limit.',
          r`$\int_a^b f=\lim_{\varepsilon\downarrow0}\int_{a+\varepsilon}^b f$ when $a$ is a singular endpoint and the limit is finite.`,
          r`$\int_0^1x^{-1/2}dx=2$.`,
          'A singularity inside the interval requires two independent one-sided limits.',
        ),
      ],
      body: r`An unbounded integrand can occur on a finite interval. For a singularity at the lower endpoint $a$, define the integral by approaching from inside: $\int_a^b f=\lim_{\varepsilon\downarrow0}\int_{a+\varepsilon}^bf$. At an upper endpoint use a left-hand approach. Each finite truncated interval must avoid the singularity, allowing ordinary integration before the limit.

For $\int_0^1x^{-1/2}dx$, truncate at $\varepsilon>0$. The result is $[2\sqrt x]_\varepsilon^1=2-2\sqrt\varepsilon$, which tends to $2$. The graph becomes arbitrarily tall near zero, yet the narrow region there has finite area. For $\int_0^11/x\,dx$, the expression is $-\ln\varepsilon$, which diverges as $\varepsilon\downarrow0$.

More generally, $\int_0^1x^{-p}dx$ converges exactly when $p<1$, giving $1/(1-p)$. This reverses the inequality for the tail integral on $[1,\infty)$. At zero, stronger singularity means larger $p$; at infinity, larger $p$ means faster decay. The two rules are consistent because they describe different limiting locations.

For an interior singularity $c\in(a,b)$, split into $\int_a^cf+\int_c^bf$ and require both sides to converge separately. The integral of $1/x$ on $[-1,1]$ fails this requirement: the left contribution diverges negatively and the right positively. Symmetric cutoffs yield cancellation, but that principal-value construction is not the ordinary improper integral. Never combine opposite infinities into a finite answer.

A removable hole is different from unbounded behavior. If a function agrees with a bounded continuous extension except at one point, assigning the limiting value there leaves the integral unchanged. In contrast, $1/x^2$ cannot be repaired at zero with a single finite point value because its nearby values are unbounded. Inspect the local behavior, not merely whether a formula happens to have a zero denominator. This distinction also helps choose a numerical method: endpoint sampling at an actual singularity is undefined even if the improper integral converges.`,
      questions: [
        n(
          r`Evaluate $\int_0^1x^{-1/2}\,dx$.`,
          '2',
          r`The truncated value $2-2\sqrt\varepsilon$ tends to $2$.`,
        ),
        n(
          r`Evaluate $\int_0^8x^{-2/3}\,dx$.`,
          '6',
          r`$[3x^{1/3}]_\varepsilon^8=6-3\varepsilon^{1/3}\to6$.`,
        ),
        n(r`Evaluate $\int_0^1x^{-1/3}\,dx$.`, '3/2', r`$[(3/2)x^{2/3}]_\varepsilon^1\to3/2$.`),
        n(
          r`Evaluate $\int_0^1(1-x)^{-1/2}\,dx$.`,
          '2',
          r`Use the upper-endpoint limit of $-2\sqrt{1-x}$, giving $2$.`,
        ),
        t(
          r`Does $\int_0^1x^{-2}\,dx$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`The truncation equals $1/\varepsilon-1$, which is unbounded.`,
        ),
        t(
          r`Does the ordinary improper integral $\int_{-1}^1 1/x\,dx$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`The two one-sided integrals diverge separately; symmetric cancellation does not define the ordinary improper integral.`,
        ),
        n(
          r`Evaluate $\int_{-1}^1|x|^{-1/2}\,dx$ as an improper integral.`,
          '4',
          r`Each one-sided contribution equals $2$, and both converge, so the sum is $4$.`,
        ),
        n(
          r`For $p=3/4$, evaluate $\int_0^1x^{-p}\,dx$.`,
          '4',
          r`Since $p<1$, the value is $1/(1-p)=4$.`,
        ),
        o(
          r`Explain why a pole at an interior point requires two limits rather than one symmetric limit.`,
          r`The two regions are independent accumulations. A common shrinking cutoff imposes a cancellation relationship that can conceal divergence on either side. Ordinary improper integration requires each side to have its own finite limit.`,
        ),
        o(
          r`Compare $(x^2-1)/(x-1)$ near $x=1$ with $1/(x-1)^2$. Which defect is removable, and why?`,
          r`The first agrees with $x+1$ away from the point and has finite limit $2$, so its hole can be filled continuously. The second grows without bound near $1$, so no assigned point value makes it continuous or removes the singular behavior.`,
        ),
      ],
      review: [
        n(
          r`Evaluate $\int_0^4x^{-1/2}\,dx$.`,
          '4',
          r`The one-sided limit of $2\sqrt x$ gives $2\sqrt4=4$.`,
        ),
        t(
          r`For $p=5/4$, does $\int_0^1x^{-p}\,dx$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`An endpoint power singularity converges only for $p<1$.`,
        ),
        o(
          r`An endpoint value is infinite but the improper integral is finite. Why can the ordinary trapezoidal rule still fail to be directly applicable?`,
          r`The trapezoidal formula requires a finite sample at that endpoint, so its first term is undefined. One must first remove or transform the singularity, or truncate and separately control the omitted contribution.`,
        ),
      ],
      quickCheck: qc(
        r`Which condition makes $\int_0^1x^{-p}\,dx$ converge?`,
        [r`$p>1$`, r`$p<1$`, r`$p=1$`],
        1,
        r`Near zero the antiderivative term tends to a finite limit only when $1-p>0$.`,
      ),
    },
    {
      title: 'Comparison and controlled truncation',
      sources: [improper, numerical],
      terms: [
        term(
          'integral-comparison',
          'Comparison for improper integrals',
          'Use a simpler nonnegative integrand to bound another.',
          r`If $0\le f\le g$ on a tail and $\int g$ converges, then $\int f$ converges; divergence of the smaller integral forces divergence of the larger.`,
          r`$0\le1/(1+x^2)\le1/x^2$ for $x\ge1$.`,
          'Being smaller than a divergent function gives no conclusion.',
        ),
        term(
          'truncation-error',
          'Truncation error',
          'The contribution omitted when replacing an infinite range by a finite one.',
          r`For a nonnegative integrand, the omitted tail after $B$ is $\int_B^\infty f$.`,
          r`The tail of $x^{-2}$ after $B$ is $1/B$.`,
          'A quadrature error bound on the retained interval does not bound the omitted tail.',
        ),
      ],
      body: r`Exact antiderivatives are not required to establish convergence. If $0\le f(x)\le g(x)$ on a tail and $\int g$ converges, then $\int f$ converges by comparison. The truncated integrals of $f$ increase but remain bounded by the finite total for $g$. Conversely, if the smaller nonnegative integral diverges, the larger one must diverge too. The inequality's direction is essential.

For $x\ge1$, $0\le1/(1+x^2)\le1/x^2$, so its tail converges. But $1/x^2\le1/x$ does not establish divergence of $1/x^2$ just because the larger integral diverges. Both convergent and divergent functions can lie below the same divergent benchmark. Near a finite singularity, analogous one-sided comparisons apply over a small interval next to the troublesome point.

A useful infinite-range approximation separates two errors. Replacing $\int_a^\infty f$ by a quadrature estimate on $[a,B]$ omits the tail and approximates the retained finite interval. The total absolute error is at most the finite-interval quadrature error plus an absolute tail bound. A small step size on $[a,B]$ cannot recover an important contribution beyond $B$.

For $\int_1^\infty x^{-2}dx$, the omitted tail is exactly $1/B$. To make it at most $0.001$, choose $B\ge1000$. This illustrates how slowly algebraic tails may shrink. For $e^{-x}$, the tail is $e^{-B}$, so $B\ge\ln1000$ achieves the same bound. The cutoff should follow decay information rather than a generic “large number.”

For a non-elementary example, when $x\ge B\ge1$, $e^{-x^2}\le x e^{-x^2}$. Thus $\int_B^\infty e^{-x^2}dx\le\int_B^\infty xe^{-x^2}dx=e^{-B^2}/2$. This bounds a tail using an integrable comparison that deliberately includes a derivative factor. One can then approximate the finite interval with an appropriate numerical rule and combine the two bounds. Report both contributions to distinguish an honest controlled approximation from a visually plausible truncation.`,
      questions: [
        t(
          r`Using $0\le1/(1+x^2)\le1/x^2$ for $x\ge1$, classify $\int_1^\infty1/(1+x^2)\,dx$ as converges or diverges.`,
          'converges',
          r`The upper comparison integral $\int_1^\infty x^{-2}dx$ converges.`,
        ),
        t(
          r`For $x\ge1$, $(x+1)/x^2\ge1/x$. Classify its tail integral as converges or diverges.`,
          'diverges',
          r`It is at least the nonnegative harmonic integrand, whose tail integral diverges.`,
        ),
        n(
          r`Find the omitted tail $\int_{10}^\infty x^{-2}dx$.`,
          '1/10',
          r`The tail formula is $1/B$ with $B=10$.`,
        ),
        n(
          r`Find the minimum real cutoff $B\ge1$ making $\int_B^\infty x^{-2}dx\le1/100$.`,
          '100',
          r`Require $1/B\le1/100$, so $B\ge100$.`,
        ),
        n(r`Find $\int_3^\infty e^{-x}dx$.`, 'exp(-3)', r`The tail equals $e^{-B}$ at $B=3$.`),
        n(
          r`A retained-interval quadrature error is at most $1/1000$ and an omitted-tail error at most $1/500$. Give the total absolute error bound obtained by adding these two bounds.`,
          '3/1000',
          r`The triangle inequality gives $1/1000+2/1000=3/1000$.`,
        ),
        n(
          r`Using the stated comparison bound $\int_B^\infty e^{-x^2}dx\le e^{-B^2}/2$, give the bound for $B=2$.`,
          'exp(-4)/2',
          r`Substitute $B=2$ to obtain $e^{-4}/2$.`,
        ),
        t(
          r`If $0\le f\le g$ and $\int g$ diverges, does this alone determine convergence of $\int f$? Enter yes or no.`,
          'no',
          r`A smaller nonnegative function can have either behavior; being below a divergent upper benchmark gives no conclusion.`,
        ),
        o(
          r`Prove convergence of $\int_1^\infty e^{-x^2}dx$ using $e^{-x^2}\le xe^{-x^2}$.`,
          r`For $x\ge1$ the comparison is valid and both functions are nonnegative. Substitution gives $\int_1^\infty xe^{-x^2}dx=e^{-1}/2$, a finite number. Comparison therefore proves convergence of the smaller integral.`,
          'prove',
        ),
        o(
          r`Why should a numerical approximation to an improper integral include both a cutoff argument and a finite-interval error argument?`,
          r`They control different missing information: the cutoff argument bounds the omitted domain, while quadrature analysis bounds approximation within the retained domain. Either contribution can dominate, so controlling only one cannot guarantee the total error.`,
        ),
      ],
      review: [
        n(
          r`Find the tail $\int_4^\infty x^{-3}dx$.`,
          '1/32',
          r`The antiderivative gives $1/(2\cdot4^2)=1/32$.`,
        ),
        n(
          r`A tail bound is $1/200$ and a quadrature bound is $1/400$. Give the combined bound obtained by adding the two bounds.`,
          '3/400',
          r`Add the two bounds: $2/400+1/400=3/400$.`,
        ),
        o(
          r`Compare $1/\sqrt{x}$ and $1/x$ on $[1,\infty)$ to establish the first integral's behavior.`,
          r`Since $1/\sqrt{x}\ge1/x\ge0$ and the harmonic integral diverges, comparison forces $\int_1^\infty x^{-1/2}dx$ to diverge.`,
        ),
      ],
    },
  ],
};
