import { r, source, term, n, e, t, o, qc } from './integration-helpers.mjs';
const definite = source(
  1,
  5,
  2,
  'The Definite Integral',
  'Riemann-sum definition, integrability, signed area, linearity, additivity, and bounds.',
);
const net = source(
  1,
  5,
  4,
  'Integration Formulas and the Net Change Theorem',
  'Accumulation of rates, displacement versus distance, and symmetry.',
);
export default {
  number: 9,
  slug: 'calculus-definite-integrals',
  title: 'Definite Integrals and Accumulation',
  intro: r`A derivative starts with a changing quantity and asks for its local rate. An integral starts with local contributions and combines them over an interval. A stream of measurements, a velocity graph, and a density profile all lead to the same construction: multiply a local rate or density by a small interval, then add. This lesson builds that construction before introducing shortcuts for evaluation. Keep track of units and signs; they determine what the accumulated answer means.`,
  sections: [
    {
      title: 'From samples to Riemann sums',
      sources: [definite],
      terms: [
        term(
          'riemann-sum',
          'Riemann sum',
          'A sum of sampled heights times widths.',
          r`For a partition $a=x_0<\cdots<x_n=b$, choose $x_i^*\in[x_{i-1},x_i]$ and form $\sum f(x_i^*)\Delta x_i$.`,
          r`Two midpoint rectangles for $x^2$ on $[0,2]$ give $1(1/4)+1(9/4)=5/2$.`,
          'A finite sum usually approximates the integral; it is not automatically exact.',
        ),
      ],
      body: r`Suppose a pump's flow rate is measured in liters per minute. If the rate were constant at $q$ for $\Delta t$ minutes, it would deliver $q\Delta t$ liters. When the rate varies, that product becomes an approximation over a short interval. Splitting the entire time span into short intervals creates an approximation whose individual pieces retain a physical meaning.

A **partition** divides $[a,b]$ into subintervals. Write the endpoints as $a=x_0<x_1<\cdots<x_n=b$ and the widths as $\Delta x_i=x_i-x_{i-1}$. A sample point $x_i^*$ belongs to the $i$th interval. The corresponding Riemann sum is $\sum_{i=1}^n f(x_i^*)\Delta x_i$. The star labels a chosen sample; it does not mean multiplication or differentiation. Equal widths simplify this to $\Delta x=(b-a)/n$.

For $f(x)=x^2$ on $[0,2]$ with two intervals, the width is $1$. Left samples $0,1$ give $0^2+1^2=1$; right samples $1,2$ give $1^2+2^2=5$; midpoint samples $1/2,3/2$ give $1/4+9/4=5/2$. All three use the same function and partition. They differ because a nonconstant function has no single height that describes a whole interval exactly.

If $f$ increases, each left rectangle lies below the graph and each right rectangle lies above it. Thus the corresponding sums bracket the signed integral. This remains an order statement when the function is negative: “larger” means further right on the number line, not a larger absolute value. Midpoints often improve accuracy, but monotonicity alone does not determine which side their error lies on.

Unequal intervals are equally valid. With widths $1,2$ and sampled rates $3,5$, the accumulated approximation is $3(1)+5(2)=13$, not $(3+5)(3)/2$. A simple average of rates silently assumes equal time weights. Before computing, write one representative term with its units. That small step catches missing widths and inappropriate averaging.`,
      questions: [
        n(
          r`Find the equal width for $[2,8]$ divided into $3$ subintervals.`,
          '2',
          r`$\Delta x=(8-2)/3=2$.`,
        ),
        n(
          r`Find the left sum for $f(x)=x^2$ on $[0,3]$ with $3$ equal intervals.`,
          '5',
          r`The width is $1$ and the left samples are $0,1,2$, so $L_3=0+1+4=5$.`,
        ),
        n(
          r`Find the right sum for $f(x)=x^2$ on $[0,3]$ with $3$ equal intervals.`,
          '14',
          r`$R_3=1(1+4+9)=14$.`,
        ),
        n(
          r`Find the midpoint sum for $f(x)=2x+1$ on $[0,4]$ with $2$ intervals.`,
          '20',
          r`The midpoints are $1,3$ and the width is $2$, giving $2(3+7)=20$.`,
        ),
        n(
          r`On widths $1,2,1$, sampled flow rates are $4,3,6$ liters/minute. Find the estimated liters delivered.`,
          '16',
          r`Weight each rate by its interval: $4(1)+3(2)+6(1)=16$ liters.`,
        ),
        n(
          r`Find the right sum for $f(x)=-x$ on $[0,2]$ with $2$ intervals.`,
          '-3',
          r`$R_2=(-1)(1)+(-2)(1)=-3$.`,
        ),
        e(
          r`For $[2,5]$ with $n$ equal intervals, give the right endpoint $x_i$ in terms of $i,n$.`,
          '2+3*i/n',
          r`Start at $2$ and advance $i$ widths of $3/n$: $x_i=2+3i/n$.`,
          ['i', 'n'],
          { positive: ['n'] },
        ),
        t(
          r`For an increasing function, is its left sum an underestimate or overestimate of its integral? Enter one word.`,
          'underestimate',
          r`Each left value is no greater than later values in its interval. Multiplying by positive widths and adding preserves the inequality.`,
        ),
        o(
          r`Why does averaging sampled rates without using interval lengths fail for unequally spaced measurements?`,
          r`An average assigns equal weight to each sample, whereas a rate sustained for twice as long contributes twice as much. The sum must use the actual widths; for rates $1,9$ over lengths $9,1$, the contribution is $18$, while the unweighted mean times total time would incorrectly give $50$.`,
        ),
        o(
          r`Construct a continuous nonconstant function for which the one-interval midpoint rule on $[0,2]$ is exact. Explain why.`,
          r`Take $f(x)=3x+2$. Its graph is a line whose average endpoint height is $5$, exactly its midpoint height. The trapezoid area is $2(2+8)/2=10$, matching the midpoint rectangle $2f(1)=10$.`,
          'construct',
        ),
      ],
      review: [
        n(
          r`Estimate delivery using widths $2,1,3$ minutes and sampled rates $5,8,2$ liters/minute.`,
          '24',
          r`$2(5)+1(8)+3(2)=24$ liters.`,
        ),
        n(
          r`Find $M_2$ for $f(x)=x^2+1$ on $[-1,1]$.`,
          '5/2',
          r`Each width is $1$; both midpoint values are $5/4$, giving $5/2$.`,
        ),
        t(
          r`A decreasing function is sampled at right endpoints. Is the sum an underestimate or overestimate?`,
          'underestimate',
          r`The right endpoint gives the smallest height on each interval, so the sum is no greater than the integral.`,
        ),
      ],
      quickCheck: qc(
        r`Two sampled values are $2$ and $8$, sustained for widths $3$ and $1$. What is the accumulated estimate?`,
        ['10', '14', '20'],
        1,
        r`The widths matter: $2(3)+8(1)=14$.`,
      ),
    },
    {
      title: 'The integral as a limit',
      sources: [definite],
      terms: [
        term(
          'definite-integral',
          'Definite integral',
          'The common limit of increasingly fine Riemann sums.',
          r`The number $\int_a^b f(x)\,dx$ is the Riemann-sum limit when the largest interval width tends to zero, independent of samples.`,
          r`$\int_0^1 x\,dx=1/2$.`,
          'The integral is a number when both bounds are fixed, not a family of functions.',
        ),
      ],
      body: r`Refining a partition makes the constant-height approximation local. The definite integral $\int_a^b f(x)\,dx$ is the common limit of its Riemann sums as the largest width tends to zero, provided this limit exists independently of the sample choices. For equal subdivisions, letting $n\to\infty$ makes every width tend to zero. For unequal subdivisions, merely adding intervals is insufficient if one wide interval never shrinks.

The function $f$ is the **integrand**. The numbers $a,b$ are the lower and upper bounds. The notation $dx$ identifies the integration variable and recalls the small widths; in the definition those widths really appear as $\Delta x_i$. Renaming the dummy variable changes nothing: $\int_0^1 x^2\,dx=\int_0^1 t^2\,dt$. Changing the function or the bounds would change the problem.

Here is a complete sum calculation for $f(x)=x$ on $[0,3]$. With $n$ right rectangles, $\Delta x=3/n$ and $x_i=3i/n$. Hence $R_n=(9/n^2)\sum_{i=1}^n i$. The finite identity $\sum_{i=1}^n i=n(n+1)/2$ gives $R_n=9/2+9/(2n)$. The error term tends to zero, so the integral is $9/2$. The triangle under the line independently gives base times height divided by two, also $9/2$. A curved example uses the identity $\sum_{i=1}^n i^2=n(n+1)(2n+1)/6$. For $x^2$ on $[0,1]$, the right sum is $n^{-3}\sum i^2=(n+1)(2n+1)/(6n^2)$. Expanding the numerator gives $1/3+1/(2n)+1/(6n^2)$, whose limit is $1/3$. This supplies an exact curved-region area directly from the definition, without yet using antiderivatives.

Every continuous function on a closed, bounded interval is integrable. Continuity is sufficient, not necessary: a bounded function with finitely many jump discontinuities also has a Riemann integral. Altering a bounded integrable function at finitely many points does not change its integral. A finite collection of points has no width, and the intervals surrounding those points can have arbitrarily small total width.

Do not generalize this to arbitrary discontinuities or unbounded functions. The function that equals $1$ at rational inputs and $0$ at irrational inputs has sums equal to either total interval length or zero, depending on samples, so there is no common Riemann limit. Unbounded functions near an endpoint require the separate limiting construction of improper integration later.`,
      questions: [
        n(
          r`Evaluate $\int_0^3 x\,dx$ geometrically.`,
          '9/2',
          r`A triangle has base $3$ and height $3$, so its area is $9/2$.`,
        ),
        n(
          r`For $f(x)=x$ on $[0,2]$, find the limit of $R_n=2+2/n$.`,
          '2',
          r`$2/n\to0$, so the limit is $2$.`,
        ),
        e(
          r`Give $R_n$ for $f(x)=x$ on $[0,1]$ with equal right rectangles, as a formula in $n$.`,
          '(n+1)/(2*n)',
          r`$R_n=n^{-2}\sum i=n(n+1)/(2n^2)=(n+1)/(2n)$.`,
          ['n'],
          { positive: ['n'] },
        ),
        n(
          r`A function equals $2$ on $[0,3]$ except that $f(1)=100$. Evaluate its integral.`,
          '6',
          r`Changing one bounded point value does not change the integral of the constant function: $2(3)=6$.`,
        ),
        n(r`Find $\int_1^4 5\,dt$.`, '15', r`Constant height $5$ times width $3$ is $15$.`),
        t(
          r`What name is given to $f$ in $\int_a^b f(x)\,dx$?`,
          'integrand',
          r`The integrand is the function being accumulated.`,
        ),
        t(
          r`Is continuity on a closed interval sufficient or necessary for Riemann integrability? Enter sufficient or necessary.`,
          'sufficient',
          r`Continuity guarantees integrability, but bounded step functions show it is not necessary.`,
        ),
        o(
          r`Explain why $\int_1^3 u^2\,du$ and $\int_1^3 x^2\,dx$ agree.`,
          r`The variable is a dummy label. Both sums sample the square of a point between $1$ and $3$ and multiply by widths; relabeling those points does not alter any sum or its limit.`,
        ),
        o(
          r`Why can a sequence of partitions with more and more intervals still fail to approximate an integral?`,
          r`If one interval retains a fixed positive width, its variation is never resolved. For example, repeatedly subdividing only $[0,1]$ while leaving $[1,2]$ whole allows its sample to retain a fixed error. The largest width must tend to zero.`,
        ),
        o(
          r`Show that the rational-indicator function on $[0,1]$ has no Riemann integral.`,
          r`Every interval contains rational and irrational points. Rational choices give sums equal to $1$ for every partition, while irrational choices give sums equal to $0$. Refining does not reconcile these two limits.`,
          'prove',
        ),
      ],
      review: [
        n(
          r`A function is $-3$ throughout $[1,5]$ except at two isolated points with finite values. Find its integral.`,
          '-12',
          r`The isolated changes contribute no integral; the constant contribution is $-3(4)=-12$.`,
        ),
        n(
          r`A right sum is $7/3+4/n+2/(3n^2)$. What integral value does its limit give?`,
          '7/3',
          r`Both terms with $n$ in the denominator vanish.`,
        ),
        o(
          r`Explain why finitely many jumps do not contradict the theorem that continuous functions are integrable.`,
          r`The theorem supplies a sufficient condition, not a necessary one. Bounded jumps can be confined to intervals of arbitrarily small total width, unlike persistent oscillation throughout every interval.`,
        ),
      ],
    },
    {
      title: 'Signed area and total area',
      sources: [definite],
      terms: [
        term(
          'signed-area',
          'Signed area',
          'Area above the axis minus area below it.',
          r`For integrable $f$, $\int_a^b f=A_+-A_-$; total geometric area is $\int_a^b|f|=A_++A_-$.`,
          r`$\int_{-1}^1 x\,dx=0$, while $\int_{-1}^1|x|\,dx=1$.`,
          'A zero signed integral does not mean the function vanished.',
        ),
      ],
      body: r`A rectangle with negative height contributes a negative product to a Riemann sum. Taking a limit preserves that sign, so the integral measures signed area. Regions above the horizontal axis contribute positively and regions below it contribute negatively. Geometric area itself is nonnegative; the adjective “signed” tells us that the integral contains additional information.

Consider $f(x)=x-1$ from $0$ to $3$. On $[0,1]$ the graph makes a triangle below the axis with area $1/2$. On $[1,3]$ it makes a triangle above the axis with area $2$. Thus $\int_0^3(x-1)\,dx=2-1/2=3/2$. The total region area is instead $2+1/2=5/2$. Drawing the zero first organizes both computations.

The absolute value function turns every negative height positive. Therefore total area is $\int_a^b|f(x)|\,dx$. It is generally different from $|\int_a^b f(x)\,dx|$, which permits cancellation before taking an absolute value. If positive and negative contributions each have area $100$, these expressions give $200$ and $0$, respectively. Parentheses and the position of the absolute-value bars carry mathematical meaning.

Symmetry can save work. If $f(-x)=-f(x)$, the function is odd and its integral over $[-a,a]$ is zero, assuming integrability. Each contribution at $x$ cancels the contribution at $-x$. If $f(-x)=f(x)$, the function is even and the integral equals $2\int_0^a f(x)\,dx$. An even function need not be positive; evenness concerns matching heights, not their sign.

The cancellation argument requires a symmetric interval. The integral of the odd function $x$ on $[0,2]$ is positive, not zero. It also requires an existing integral: singularities cannot be erased by visual symmetry. Later we will see why $1/x$ across zero is a dangerous example. For now, work with bounded integrable graphs and explicitly identify each sign change before interpreting a result as total area.`,
      questions: [
        n(
          r`Find the signed integral of $x-2$ on $[0,4]$.`,
          '0',
          r`The two triangles each have area $2$ and opposite signs, so they cancel.`,
        ),
        n(
          r`Find the total area between $y=x-2$ and the axis on $[0,4]$.`,
          '4',
          r`The two triangle areas add: $2+2=4$.`,
        ),
        n(
          r`Positive regions have total area $11$ and negative regions have total area $4$. Find the signed integral.`,
          '7',
          r`$11-4=7$.`,
        ),
        n(
          r`The signed integral is $-3$ and the total area is $13$. Find the area above the axis.`,
          '5',
          r`If $P-N=-3$ and $P+N=13$, adding gives $2P=10$, hence $P=5$.`,
        ),
        n(
          r`Evaluate $\int_{-2}^2(x^3-4x)\,dx$.`,
          '0',
          r`Both terms are odd, so their sum has cancelling contributions on the symmetric interval.`,
        ),
        n(
          r`Given an even integrable $f$ with $\int_0^3 f=7$, find $\int_{-3}^3 f$.`,
          '14',
          r`Even symmetry doubles the positive-half integral: $2(7)=14$.`,
        ),
        n(
          r`Find $\int_0^2\sqrt{4-x^2}\,dx$ from circle geometry.`,
          'pi',
          r`This is a quarter circle of radius $2$, so its area is $\pi(2^2)/4=\pi$.`,
        ),
        n(
          r`Find $\int_{-2}^1 |x|\,dx$ from triangle areas.`,
          '5/2',
          r`The left triangle has area $2$ and the right has area $1/2$, totaling $5/2$.`,
        ),
        o(
          r`Give a continuous nonzero function with integral zero on $[0,2]$ and explain the cancellation.`,
          r`Take $f(x)=x-1$. Its negative and positive triangular regions each have area $1/2$. It is nonzero at most points but the signed integral is zero.`,
          'construct',
        ),
        o(
          r`For an integrable function on $[a,b]$ with $a<b$, prove $|\int_a^b f|\le\int_a^b|f|$ using positive and negative region areas.`,
          r`Let those nonnegative areas be $P,N$. Then $|P-N|\le P+N$, since subtracting a nonnegative contribution cannot exceed adding both. This is exactly the stated inequality.`,
          'prove',
        ),
      ],
      review: [
        n(
          r`On $[0,5]$, a graph has area $8$ above and $12$ below the axis. Find total area.`,
          '20',
          r`Total area adds magnitudes: $8+12=20$.`,
        ),
        n(
          r`For odd integrable $g$, find $\int_{-7}^7g(x)\,dx$.`,
          '0',
          r`Odd symmetry cancels matching contributions on a symmetric interval.`,
        ),
        n(
          r`Find the signed integral of $2-x$ on $[0,5]$ using triangles.`,
          '-5/2',
          r`The positive triangle has area $2$; the negative triangle has area $9/2$, giving $2-9/2=-5/2$.`,
        ),
      ],
      quickCheck: qc(
        r`A velocity graph has positive area $6$ and negative area $4$. What is the distance traveled?`,
        ['2', '10', '-2'],
        1,
        r`Distance adds the magnitudes of motion in both directions: $6+4=10$.`,
      ),
    },
    {
      title: 'Algebra and bounds for integrals',
      sources: [definite],
      terms: [
        term(
          'integral-additivity',
          'Integral additivity',
          'Adjacent interval contributions combine.',
          r`If $f$ is integrable across the intervals, $\int_a^b f+\int_b^c f=\int_a^c f$.`,
          r`If the first two contributions are $4$ and $-1$, the combined contribution is $3$.`,
          'Additivity applies to sums of contributions, not products of integrals.',
        ),
      ],
      body: r`The integral inherits algebra from finite sums. For constants $\alpha,\beta$, linearity gives $\int_a^b(\alpha f+\beta g)=\alpha\int_a^b f+\beta\int_a^b g$. A constant multiplier can leave the sum because it multiplies every term; a variable-dependent factor cannot. There is no corresponding rule that the integral of a product equals the product of the integrals.

Adjacent intervals combine: $\int_a^c f=\int_a^b f+\int_b^c f$. Reversing bounds changes the sign, $\int_b^a f=-\int_a^b f$, and equal bounds give zero. These conventions preserve the additive rule even when the middle point is outside the interval. Read an integral with reversed bounds as an oriented accumulation, not as a region with a negative physical width.

Suppose $\int_0^2 f=5$ and $\int_0^5 f=1$. Subtracting the first contribution gives $\int_2^5 f=1-5=-4$. Reversing direction then gives $\int_5^2 f=4$. We have determined both without knowing any formula for $f$. The negative middle contribution also tells us that a continuous $f$ must take a negative value somewhere in that middle interval.

Order provides useful checks. If $m\le f(x)\le M$ on $[a,b]$ with $a<b$, then $m(b-a)\le\int_a^b f\le M(b-a)$. Each rectangle height lies between the two constants, so each product and then its limit does too. More generally, $f\le g$ implies $\int f\le\int g$ over the same forward interval. Reversing the bounds reverses the inequality.

For $1\le f\le4$ on $[2,5]$, the integral must lie between $3$ and $12$. An answer of $15$ is impossible even if a long symbolic calculation produced it. Equality at the lower bound is especially restrictive for a continuous function: if it rises above $1$ at one point, continuity supplies a positive-width neighborhood with extra area. Such qualitative reasoning is a useful companion to calculation.`,
      questions: [
        n(
          r`If $\int_0^2 f=4$ and $\int_2^5f=-7$, find $\int_0^5f$.`,
          '-3',
          r`Add adjacent contributions: $4-7=-3$.`,
        ),
        n(
          r`If $\int_1^4f=6$, find $\int_4^1 3f$.`,
          '-18',
          r`Reverse the bounds and multiply by $3$: $-3(6)=-18$.`,
        ),
        n(
          r`Given $\int_0^2f=3$ and $\int_0^2g=-1$, evaluate $\int_0^2(2f-5g+4)$.`,
          '19',
          r`Linearity gives $2(3)-5(-1)+4(2)=19$.`,
        ),
        n(
          r`Evaluate $\int_7^7(x^2+1)\,dx$.`,
          '0',
          r`The bounds coincide, so no interval is accumulated.`,
        ),
        n(
          r`If $\int_0^6 f=9$ and $\int_0^2 f=11$, find $\int_2^6f$.`,
          '-2',
          r`Subtract the known initial contribution: $9-11=-2$.`,
        ),
        n(
          r`For $-2\le f\le3$ on $[1,5]$, give the smallest integral value permitted by these bounds.`,
          '-8',
          r`The lower bound is $-2(5-1)=-8$.`,
        ),
        n(
          r`For $-2\le f\le3$ on $[1,5]$, give the largest integral value permitted by these bounds.`,
          '12',
          r`The upper bound is $3(5-1)=12$.`,
        ),
        n(
          r`If $\int_0^2 f=5$, evaluate $\int_0^2(3-f)\,dx$.`,
          '1',
          r`The constant contributes $3(2)=6$, so the result is $6-5=1$.`,
        ),
        o(
          r`Disprove the rule $\int_0^1 fg=(\int_0^1 f)(\int_0^1 g)$ using a simple pair of functions.`,
          r`Set $f(x)=g(x)=x$. The left side is the area integral of $x^2$, which is $1/3$, whereas the right side is $(1/2)^2=1/4$. Products do not commute with accumulation this way.`,
          'construct',
        ),
        o(
          r`A continuous nonnegative function on $[a,b]$, where $a<b$, has integral zero. Explain why it must be zero everywhere.`,
          r`If it were positive at one point, continuity would keep it above some positive height on a neighborhood of positive width (one-sided at an endpoint). That rectangle would give positive integral, contradicting zero.`,
          'prove',
        ),
      ],
      review: [
        n(
          r`Given $\int_2^7f=10$ and $\int_2^4f=13$, find $\int_7^4f$.`,
          '3',
          r`$\int_4^7f=10-13=-3$, and reversing yields $3$.`,
        ),
        n(r`If $\int_1^3f=4$ and $\int_1^3g=5$, find $\int_1^3(4f-2g)$.`, '6', r`$4(4)-2(5)=6$.`),
        o(
          r`Explain why $f\le g$ implies $\int_b^a f\ge\int_b^a g$ when $a<b$.`,
          r`Forward integration preserves the inequality. Reversing each bound pair multiplies both values by $-1$, reversing their order.`,
        ),
      ],
    },
    {
      title: 'Accumulating rates with units',
      sources: [net, definite],
      terms: [
        term(
          'net-change',
          'Net change',
          'Final quantity minus initial quantity.',
          r`Integrating a rate gives signed change: $Q(b)-Q(a)=\int_a^b Q'(t)\,dt$.`,
          r`A net flow of $-2$ liters/minute for $3$ minutes changes volume by $-6$ liters.`,
          'An accumulated change is not the final quantity until the initial amount is added.',
        ),
      ],
      body: r`Integration is useful whenever a local contribution adds to a whole. A velocity measured in meters per second times a time width in seconds gives meters. A linear density measured in grams per centimeter times a length width in centimeters gives grams. The graph need not describe literal geometric area; its axis units determine the accumulated quantity.

For a rate $Q'(t)$, the net change is $Q(b)-Q(a)=\int_a^b Q'(t)\,dt$. The next lesson establishes the theorem connecting this formula with differentiation. Here, piecewise-constant rates make it transparent. If a tank starts with $20$ liters, gains $3$ liters per minute for $4$ minutes, and loses $2$ liters per minute for $5$ minutes, its change is $12-10=2$ liters and its final amount is $22$ liters. The total amount passing in or out is $12+10=22$ liters; that is a different question despite the coincidental number.

For motion on a line, velocity carries direction. Displacement is $\int v(t)\,dt$, whereas distance is $\int|v(t)|\,dt$. Suppose velocity is $2$ meters per second for $3$ seconds and then $-1$ for $4$ seconds. The object ends $2$ meters in the positive direction from its starting point, after traveling $10$ meters. Adding its initial position determines its final coordinate.

A rate graph does not reveal an initial quantity. Two tanks whose volumes differ by $100$ liters can have exactly the same net flow graph. This missing constant is not a defect of integration; differentiation discarded the original level. Rate information can also fail to describe a physical system after a boundary event: a predicted negative volume signals that the assumed flow model cannot continue unchanged once the tank empties.

For measured data, retain the distinction between an approximation and an exact model. Piecewise-constant interpolation treats each rate as constant throughout its interval; a rectangle sum is exact for that interpolant but approximate for the unknown real rate. State which claim you are making. As you move into antiderivative formulas, keep this modeling interpretation beside the symbolic notation.`,
      questions: [
        n(
          r`A tank begins with $30$ liters and has net flow $-4$ liters/minute for $5$ minutes. Find final liters.`,
          '10',
          r`The change is $-4(5)=-20$ liters; $30-20=10$.`,
        ),
        n(
          r`Velocity is $3$ m/s for $2$ seconds, then $-2$ m/s for $4$ seconds. Find displacement in meters.`,
          '-2',
          r`$3(2)-2(4)=6-8=-2$ meters.`,
        ),
        n(
          r`For the same motion, find distance in meters.`,
          '14',
          r`Add absolute contributions: $6+8=14$ meters.`,
        ),
        n(
          r`Position initially equals $7$ meters and displacement is $-11$ meters. Find the final coordinate.`,
          '-4',
          r`$7+(-11)=-4$ meters.`,
        ),
        n(
          r`A $5$ cm wire has constant density $2.4$ g/cm. Find its mass in grams.`,
          '12',
          r`Density times length gives $2.4(5)=12$ grams.`,
        ),
        n(
          r`A battery draws $2$ watts for $3$ hours and $5$ watts for $1$ hour. Find energy in watt-hours.`,
          '11',
          r`$2(3)+5(1)=11$ watt-hours.`,
        ),
        n(
          r`A reservoir initially holds $12$ liters. With constant net outflow $3$ liters/minute, at what time in minutes does the model first reach zero?`,
          '4',
          r`Solve $12-3t=0$, giving $t=4$. The model requires reconsideration afterward.`,
        ),
        t(
          r`Integrating meters per second with respect to seconds gives what unit? Enter meters, seconds, or meters per second.`,
          'meters',
          r`The seconds cancel: $(\mathrm{m}/\mathrm{s})\mathrm{s}=\mathrm{m}$.`,
        ),
        o(
          r`Why can a velocity graph determine displacement but not final position by itself?`,
          r`Integration supplies the change in position. Any two position functions differing by a constant have the same velocity, so the starting coordinate is additional necessary information.`,
        ),
        o(
          r`A data system samples CPU power every minute. Explain what information is needed to turn the samples into an energy estimate, and identify one source of uncertainty.`,
          r`Specify the interval widths and an interpolation or sampling rule, then sum power times time, converting minutes to the desired time unit. Unsampled variation between measurements causes approximation error; samples alone do not determine the exact continuous power history.`,
          'interpret',
        ),
      ],
      review: [
        n(
          r`A tank begins with $9$ liters; inflow is $5$ and outflow is $2$ liters/minute for $4$ minutes. Find final volume.`,
          '21',
          r`Net flow is $3$, so the change is $12$ liters and the final amount is $9+12=21$.`,
        ),
        n(
          r`Velocity is $-4$ m/s for $2$ seconds and $1$ m/s for $3$ seconds. Find total distance.`,
          '11',
          r`$4(2)+1(3)=11$ meters.`,
        ),
        o(
          r`A numerical integral of net flow equals $-8$ liters. State exactly what this tells you and what it does not determine.`,
          r`The tank lost a net $8$ liters over the interval under the flow model. It does not determine initial or final volume separately, nor the total amount entering and leaving.`,
          'interpret',
        ),
      ],
    },
  ],
};
