import {
  R,
  source,
  term,
  exact,
  expr,
  calc,
  text,
  bool,
  open,
  qc,
} from './differentiation-helpers.mjs';
export default {
  number: 8,
  slug: 'calculus-single-variable-optimization',
  title: 'Single-Variable Optimization',
  intro: R`Optimization asks which feasible input gives the best value of an objective. Derivatives help locate candidates, but a candidate is not yet a solution: the domain, endpoints, points of nondifferentiability, and behavior far away can all matter. This lesson combines the preceding sign and theorem work into a complete method for one-variable problems. We first distinguish local and absolute extrema, then classify candidates, compare values on closed intervals, and build geometric and economic models. A successful solution reports the input, its objective value when requested, and a reason no feasible competitor is better.`,
  sections: [
    {
      title: 'Objectives, feasible inputs, and extrema',
      sources: [
        source(
          '4.3',
          'Local and absolute extrema, critical numbers, Fermat and extreme value theorem.',
        ),
        source('4.7', 'Objective and constraint modeling.'),
      ],
      body: R`An objective function assigns a value to each candidate input. The feasible domain specifies which inputs the problem permits. A maximum or minimum is always relative to that domain: the same formula on a different interval may have a different best input or no best input at all. For $f(x)=x^2$, the minimum over the real line is zero at $x=0$, but on $[2,5]$ the minimum is $4$ at $2$.

A local minimum at an interior point is no larger than values sufficiently nearby; an absolute minimum is no larger than any value in the full feasible domain. Local and absolute maxima reverse the inequality. The adjective “local” limits the comparison neighborhood, not the precision of the result. A point can be both local and absolute, and there can be several inputs attaining the same absolute value.

Fermat's theorem says that a differentiable function with a local extremum at an interior point $c$ must satisfy $f'(c)=0$. A short reason comes from the difference quotient: at a local minimum, small positive increments give nonnegative quotients and small negative increments give nonpositive quotients. If both limits agree finitely, the value must be zero. The conclusion is necessary, not sufficient. The function $x^3$ has derivative zero at zero but no extremum there.

We call an interior domain input critical if its derivative is zero or does not exist. The point must belong to the original domain. Thus zero is critical for $|x|$, while zero is not a critical input of $1/x$ because the function is undefined there. Endpoints are considered separately when seeking absolute extrema.

The extreme value theorem guarantees that a continuous function on a closed, bounded interval attains both an absolute maximum and an absolute minimum. It ensures candidates really have winners, but does not identify them. On an open interval the guarantee can fail: $f(x)=x$ on $(0,1)$ approaches both boundary values without attaining either. On an unbounded domain, existence also requires further analysis.`,
      terms: [
        term(
          'objective-feasible-domain',
          'Objective and feasible domain',
          'What is optimized and which inputs are allowed.',
          R`An objective $f$ is maximized or minimized over a specified feasible set of inputs.`,
          R`The minimum of $x^2$ on $[2,5]$ is attained at $2$, not at infeasible input $0$.`,
          'A derivative root outside the feasible domain is not a solution.',
        ),
        term(
          'critical-input',
          'Critical input',
          'An interior domain input with zero or undefined derivative.',
          R`Critical inputs satisfy $f'(c)=0$ or have no derivative, with $c$ in the original domain.`,
          R`Zero is critical for $|x|$ but is outside the domain of $1/x$.`,
          'Critical inputs are candidates, not automatic extrema.',
        ),
        term(
          'extreme-value-theorem',
          'Extreme value theorem',
          'Continuity on a closed bounded interval guarantees attained extrema.',
          R`A continuous function on $[a,b]$ attains a maximum and minimum.`,
          R`Every polynomial has both extrema when restricted to $[0,1]$.`,
          'Open or unbounded domains need separate existence arguments.',
        ),
      ],
      questions: [
        exact(
          R`Find the absolute minimum value of $x^2$ on $[2,5]$.`,
          4,
          R`The function increases on this positive interval, so its minimum is $2^2=4$.`,
        ),
        exact(
          R`Find the input attaining the minimum of $(x-3)^2+2$ on the real line.`,
          3,
          R`The square is nonnegative and vanishes exactly at $x=3$.`,
        ),
        exact(
          R`Find the minimum value of $(x-3)^2+2$ on the real line.`,
          2,
          R`At $x=3$ the squared term is zero, leaving $2$.`,
        ),
        bool(
          R`Does $f'(c)=0$ alone prove an extremum at $c$?`,
          false,
          R`The function $x^3$ has derivative zero at zero but passes through without a maximum or minimum.`,
        ),
        bool(
          R`Is zero a critical input of $f(x)=1/x$?`,
          false,
          R`Zero is not in the function's domain, so it cannot be a critical input of that function.`,
        ),
        bool(
          R`Is zero a critical input of $f(x)=|x|$?`,
          true,
          R`The function is defined there and its derivative does not exist.`,
        ),
        bool(
          R`Does $f(x)=x$ attain an absolute maximum on $(0,1)$?`,
          false,
          R`Every permitted input can be increased slightly while staying below $1$, giving a larger value.`,
        ),
        bool(
          R`Does the extreme value theorem guarantee extrema for a continuous function on $[1,4]$?`,
          true,
          R`The interval is closed and bounded, so both extrema are attained.`,
        ),
        open(
          R`Prove the necessary zero-derivative condition at a differentiable interior local minimum.`,
          R`For sufficiently small $h$, $f(c+h)-f(c)\ge0$. Positive $h$ give quotient at least zero; negative $h$ give quotient at most zero. Their common finite limit must be both nonnegative and nonpositive, hence zero.`,
          'prove',
        ),
        open(
          R`Give a function and domain where a local minimum is not an absolute minimum.`,
          R`On the real line, $f(x)=x^3-3x$ has a local minimum at $1$ because its derivative changes from negative to positive there. It has no absolute minimum because $f(x)\to-\infty$ as $x\to-\infty$.`,
          'construct',
        ),
      ],
      review: [
        exact(
          R`Find the minimum value of $(x+2)^2+7$ on the real line.`,
          7,
          R`The square is at least zero, with equality at $x=-2$.`,
        ),
        bool(
          R`Does an endpoint maximum of a differentiable formula have to satisfy derivative zero?`,
          false,
          R`Fermat's condition concerns interior extrema. For $f(x)=x$ on $[0,1]$, the maximum is at $1$ while the derivative is $1$.`,
        ),
        bool(
          R`Does continuity on an unbounded interval by itself guarantee an attained maximum?`,
          false,
          R`For example, $f(x)=x$ on the real line is continuous but unbounded above.`,
        ),
      ],
    },
    {
      title: 'First and second derivative tests',
      sources: [
        source('4.5', 'First/second derivative tests and inconclusive zero second derivatives.'),
      ],
      body: R`To classify an isolated critical input, inspect how the function behaves on each side. The first derivative test uses a function continuous at the candidate and differentiable nearby except possibly at that point. A change of derivative sign from negative to positive gives a local minimum; positive to negative gives a local maximum. If the derivative keeps the same nonzero sign on both adjacent intervals, the candidate is neither. The argument follows from decrease followed by increase, or the reverse.

For $f(x)=x^3-3x$, the derivative $3(x-1)(x+1)$ vanishes at $-1$ and $1$. Its signs are positive, negative, positive across the three intervals. Thus $-1$ is a local maximum and $1$ a local minimum. Their values are $2$ and $-2$. The labels belong to the function values at those inputs; the derivative merely provides evidence for the classification.

A second derivative test gives a convenient shortcut at a stationary input $c$ with $f'(c)=0$. Under twice-differentiable local behavior, $f''(c)>0$ indicates a local minimum and $f''(c)<0$ a local maximum. If the second derivative is continuous nearby, the sign persists locally and reduces the argument to the first derivative test. For $f(x)=x^2-4x+9$, the stationary input is $2$ and $f''=2>0$, so it is a minimum.

If $f''(c)=0$, the test is inconclusive. The examples $x^4$, $-x^4$, and $x^3$ all have first and second derivatives zero at zero, but yield a minimum, maximum, and neither, respectively. Return to a sign chart, exact comparison, or another justified argument. “Inconclusive” describes the test, not the absence of an extremum.

Nondifferentiable candidates can still be handled by the first derivative test. For $|x-2|$, the slopes are $-1$ before $2$ and $1$ afterward, so there is a minimum at the corner. A second derivative formula away from the corner cannot classify that missing derivative at the join.`,
      terms: [
        term(
          'first-derivative-test',
          'First derivative test',
          'Classify extrema by slope-sign changes.',
          R`Negative-to-positive slope gives a local minimum; positive-to-negative gives a local maximum under the continuity and nearby differentiability hypotheses.`,
          R`$x^3-3x$ has a minimum at $1$.`,
          'A zero derivative with no sign change need not give an extremum.',
        ),
        term(
          'second-derivative-test',
          'Second derivative test',
          'Use curvature at a stationary input.',
          R`At $f'(c)=0$, positive $f''(c)$ gives a minimum and negative gives a maximum under the local differentiability hypotheses.`,
          R`For $(x-2)^2$, $f''=2$ confirms the minimum at $2$.`,
          'Zero second derivative means the test is inconclusive.',
        ),
      ],
      questions: [
        exact(R`Find the stationary input of $x^2-8x+3$.`, 4, R`Set $2x-8=0$, giving $x=4$.`),
        text(
          R`Classify the stationary input $4$ of $x^2-8x+3$ as local minimum or local maximum.`,
          'local minimum',
          R`The second derivative is $2>0$.`,
          ['minimum'],
        ),
        exact(R`Find the stationary input of $-2x^2+12x-1$.`, 3, R`Set $-4x+12=0$, giving $x=3$.`),
        text(
          R`Classify the stationary input $3$ of $-2x^2+12x-1$.`,
          'local maximum',
          R`The second derivative is $-4<0$.`,
          ['maximum'],
        ),
        text(
          R`For $f(x)=x^3-3x$, classify the critical input $-1$.`,
          'local maximum',
          R`The derivative changes from positive to negative across $-1$.`,
          ['maximum'],
        ),
        text(
          R`For $f(x)=x^3-3x$, classify the critical input $1$.`,
          'local minimum',
          R`The derivative changes from negative to positive across $1$.`,
          ['minimum'],
        ),
        text(
          R`Classify the critical input $0$ of $f(x)=x^3$ as minimum, maximum, or neither.`,
          'neither',
          R`The derivative $3x^2$ is positive on both sides, so the function keeps increasing.`,
        ),
        text(
          R`Classify $x=2$ for $f(x)=|x-2|$ as minimum, maximum, or neither.`,
          'minimum',
          R`The function decreases before $2$ and increases afterward, producing a corner minimum.`,
          ['local minimum'],
        ),
        open(
          R`Give three examples showing all possible outcomes when $f'(0)=f''(0)=0$.`,
          R`For $x^4$ zero is a minimum, for $-x^4$ a maximum, and for $x^3$ neither. All three first and second derivatives vanish there.`,
          'construct',
        ),
        open(
          R`Use the first derivative test to classify both critical inputs of $f(x)=x^3-12x$.`,
          R`$f'=3(x-2)(x+2)$ has signs positive on $x<-2$, negative on $-2<x<2$, and positive on $x>2$. Hence $-2$ is a local maximum and $2$ a local minimum.`,
        ),
      ],
      review: [
        exact(R`Find the stationary input of $3x^2-6x+5$.`, 1, R`$6x-6=0$ gives $x=1$.`),
        text(
          R`Classify zero for $f(x)=-x^4$ as minimum, maximum, or neither.`,
          'maximum',
          R`The function is nonpositive and equals zero only at the origin, making it a maximum.`,
          ['local maximum'],
        ),
        text(
          R`If $f'(c)=0$ and $f''(c)=0$, what is the result of the second derivative test: minimum, maximum, or inconclusive?`,
          'inconclusive',
          R`Further analysis is needed; all three extremum outcomes are possible.`,
        ),
      ],
      quickCheck: qc(
        R`A stationary point has $f''(c)=0$. What follows?`,
        [
          'It is an inflection point',
          'It is not an extremum',
          'The second derivative test is inconclusive',
        ],
        2,
        'The functions $x^4$, $-x^4$, and $x^3$ demonstrate different outcomes with the same zero first and second derivatives.',
      ),
    },
    {
      title: 'Absolute extrema and boundary comparisons',
      sources: [
        source('4.3', 'Closed-interval extrema and critical point/endpoints method.'),
        source('4.7', 'Feasible domains and optimization.'),
      ],
      body: R`For a continuous function on a closed bounded interval, absolute extrema can occur at interior critical inputs or at endpoints. The closed-interval method is therefore to find all interior inputs where the derivative vanishes or fails to exist, evaluate the original function at those inputs and both endpoints, and compare the values. Do not compare derivative values: the objective itself decides which candidate is best.

Consider $f(x)=x^3-3x$ on $[-2,3]$. The interior critical inputs are $-1$ and $1$. The candidate values are $f(-2)=-2$, $f(-1)=2$, $f(1)=-2$, and $f(3)=18$. The absolute minimum value is $-2$, attained at both $-2$ and $1$; the absolute maximum is $18$ at $3$. The local maximum at $-1$ is not the absolute maximum on this interval. A correct answer must include tied attaining inputs when asked for them.

Nondifferentiable points cannot be skipped. For $f(x)=|x-1|$ on $[-2,4]$, the corner at $1$ yields value zero, while both endpoints yield $3$. Thus the minimum is at the corner, and the maximum is tied at the endpoints. Solving only $f'=0$ would produce no candidates and miss the minimum entirely.

On an open interval, test whether a boundary value is approached but not attained. The function $x^2$ on $(0,2]$ has maximum $4$ at $2$, but no minimum: values approach zero while zero is excluded. On an unbounded interval, examine long-run behavior or give an inequality proving an attained bound. A local minimum by itself is not a proof of global optimality.

Constraints can move the optimum to a boundary even for smooth formulas. The unconstrained minimizer of $(x-5)^2$ is $5$, but on $[0,3]$ the function decreases throughout the feasible interval, so the constrained minimum is at $3$. Reporting an infeasible stationary point would optimize a different problem. Write the domain beside the objective before calculating.`,
      terms: [
        term(
          'closed-interval-method',
          'Closed-interval method',
          'Compare objective values at all candidates and endpoints.',
          R`For a continuous function on $[a,b]$, evaluate interior critical inputs and both endpoints to identify absolute extrema.`,
          R`A cubic can have its absolute maximum at an endpoint even when it has an interior local maximum.`,
          'Compare function values, not derivative values.',
        ),
        term(
          'attainment',
          'Attainment of an extremum',
          'A feasible input actually achieves the bound.',
          R`An approached boundary value is not an attained optimum when its input is excluded.`,
          R`$x^2$ on $(0,2]$ approaches zero but has no minimum.`,
          'An infimum is not always a minimum.',
        ),
      ],
      questions: [
        exact(
          R`Find the absolute minimum value of $x^2-4x$ on $[0,5]$.`,
          -4,
          R`The critical input is $2$; candidate values are $0,-4,5$, so the minimum is $-4$.`,
        ),
        exact(
          R`Find the absolute maximum value of $x^2-4x$ on $[0,5]$.`,
          5,
          R`Compare the values at $0,2,5$: the largest is $5$ at the right endpoint.`,
        ),
        exact(
          R`Find the input attaining the minimum of $(x-5)^2$ on $[0,3]$.`,
          3,
          R`The function decreases on the feasible interval, so its minimum is at $3$.`,
        ),
        exact(
          R`Find the maximum value of $x^3-3x$ on $[-2,3]$.`,
          18,
          R`The endpoint and critical values are $-2,2,-2,18$, whose maximum is $18$.`,
        ),
        exact(
          R`Find the minimum value of $|x-1|$ on $[-2,4]$.`,
          0,
          R`The corner at $1$ is feasible and gives zero; all absolute values are nonnegative.`,
        ),
        exact(
          R`Find the maximum value of $|x-1|$ on $[-2,4]$.`,
          3,
          R`Both endpoints are distance $3$ from $1$, greater than all interior distances.`,
        ),
        bool(
          R`Does $x^2$ attain a minimum on $(0,2]$?`,
          false,
          R`Its values approach zero as $x\to0^+$, but the required input is excluded.`,
        ),
        exact(
          R`Find the maximum value of $x^2$ on $(0,2]$.`,
          4,
          R`The included endpoint $2$ gives $4$, and every permitted smaller positive input gives less.`,
        ),
        open(
          R`List every input attaining an absolute extremum of $x^3-3x$ on $[-2,2]$, with values.`,
          R`Critical inputs are $-1,1$. Candidate values are $f(-2)=-2,f(-1)=2,f(1)=-2,f(2)=2$. Minimum $-2$ occurs at $-2$ and $1$; maximum $2$ occurs at $-1$ and $2$.`,
        ),
        open(
          R`Explain why solving $f'=0$ is not a complete procedure for optimizing a continuous function on a closed interval.`,
          R`An absolute extremum may occur at an endpoint, where Fermat's interior condition does not apply, or at an interior nondifferentiable point. All such candidates must be considered and their original function values compared.`,
        ),
      ],
      review: [
        exact(
          R`Find the minimum value of $(x+1)^2$ on $[0,4]$.`,
          1,
          R`The unconstrained minimizer $-1$ is infeasible. The function increases on $[0,4]$, so the value at $0$ is minimal.`,
        ),
        exact(
          R`Find the maximum value of $-x^2+4x+1$ on $[0,5]$.`,
          5,
          R`The interior stationary input $2$ gives $5$; endpoint values are $1$ and $-4$.`,
        ),
        exact(
          R`Find the minimum value of $-x^2+4x+1$ on $[0,5]$.`,
          -4,
          R`Comparing the same candidates gives the smallest value $-4$ at $5$.`,
        ),
      ],
    },
    {
      title: 'Geometric design with constraints',
      sources: [source('4.7', 'Geometric optimization, constraints and boundary checks.')],
      body: R`A word problem must become a one-variable objective before differentiation can help. Draw the relevant dimensions, write the quantity to optimize, then use the constraint to eliminate a variable. Derive the feasible interval from physical requirements such as positive lengths. After finding a candidate, translate the result back into every requested dimension and objective value.

Suppose a rectangle must have perimeter $32$ meters. With side lengths $x,y>0$, the constraint is $2x+2y=32$, hence $y=16-x$ and $0<x<16$. Area becomes $A(x)=x(16-x)$. Its derivative $16-2x$ vanishes at $8$, increasing before that input and decreasing after it. Thus the maximum occurs at $x=y=8$, with area $64$ square meters. The rectangle is a square because of this particular perimeter constraint, not because every rectangular optimization favors equal sides.

If a wall supplies one side and only three sides require a total of $24$ meters of fence, let $x$ be each side perpendicular to the wall and $y$ the opposite side. The constraint is $2x+y=24$, giving area $A=x(24-2x)$ for $0<x<12$. The derivative is $24-4x$, so $x=6,y=12$ maximizes area at $72$. The different constraint changes the optimal proportions.

For an open-top box cut from a square sheet of side $12$, cutting corner squares of side $x$ produces volume $V=x(12-2x)^2$ with $0<x<6$. Differentiation gives $V'=(12-2x)(12-6x)$. The interior critical input is $2$, while $6$ is a degenerate boundary. The derivative is positive before $2$ and negative afterward within the feasible interval, so the maximum volume is $2\cdot8^2=128$.

Boundary checks clarify existence on these open geometric domains: area or volume tends to zero at the degenerate endpoints, while the interior candidate has positive value and the sign chart confirms it is best. If zero dimensions are allowed mathematically, the closed interval includes those zero-valued cases explicitly. State which interpretation the design uses rather than silently changing the feasible set.`,
      terms: [
        term(
          'constraint-elimination',
          'Constraint elimination',
          'Use a persistent relation to obtain a one-variable objective.',
          R`Solve a constraint for one variable and substitute it into the objective while preserving feasible inputs.`,
          R`From $2x+y=24$, area becomes $x(24-2x)$.`,
          'Different constraints can produce different optimal proportions.',
        ),
        term(
          'degenerate-boundary',
          'Degenerate geometric boundary',
          'A limiting design with a zero dimension.',
          R`A zero-width or zero-height shape may lie at the boundary of a positive-dimension model.`,
          R`For $V=x(12-2x)^2$, both $x=0$ and $x=6$ give zero volume.`,
          'A boundary limit may aid comparison even when the degenerate design is excluded.',
        ),
      ],
      questions: [
        exact(
          R`A rectangle has perimeter $40$ meters. Find the side length of the area-maximizing square in meters.`,
          10,
          R`Write $y=20-x$, so $A'=20-2x=0$ at $x=10$ and $y=10$.`,
        ),
        exact(
          R`A rectangle has perimeter $40$ meters. Find its maximum area in square meters.`,
          100,
          R`The optimal dimensions are $10$ by $10$, giving area $100$.`,
        ),
        expr(
          R`A wall supplies one side of a rectangular enclosure; $30$ meters of fence covers the other three. Let $x$ denote each perpendicular side. Give area as a function of $x$.`,
          '30*x-2*x^2',
          R`The remaining side is $30-2x$, so $A=x(30-2x)$ on $0<x<15$.`,
        ),
        exact(
          R`For the three-sided fence model $A(x)=x(30-2x)$ on $0<x<15$, find the maximizing $x$.`,
          '15/2',
          R`$A'=30-4x=0$ gives $x=15/2$; the derivative changes from positive to negative.`,
        ),
        exact(
          R`For that $30$-meter three-sided enclosure, find the optimal side parallel to the wall.`,
          15,
          R`At $x=15/2$, the remaining side is $30-2x=15$.`,
        ),
        exact(
          R`A box cut from a square sheet of side $18$ has volume $V=x(18-2x)^2$. Find the maximizing cut size on $0<x<9$.`,
          3,
          R`$V'=(18-2x)(18-6x)$; the interior root is $x=3$ with positive-to-negative sign change.`,
        ),
        exact(
          R`For the $18$-unit square sheet with optimal cut size $3$, find the box volume.`,
          432,
          R`The base side is $18-6=12$, so volume is $3(12)^2=432$.`,
        ),
        exact(
          R`Two positive lengths have sum $14$. Find the maximum possible product.`,
          49,
          R`The product $x(14-x)$ is maximized at $x=7$, giving $49$.`,
        ),
        open(
          R`Derive and solve the maximum-area rectangle problem with perimeter $P>0$.`,
          R`The constraint gives $y=P/2-x$, so $A=x(P/2-x)$ on $0<x<P/2$. Its derivative $P/2-2x$ changes from positive to negative at $x=P/4$. Both sides equal $P/4$, and maximum area is $P^2/16$.`,
        ),
        open(
          R`Why is “the optimum is a square” wrong for a wall-backed enclosure using three fenced sides?`,
          R`Its constraint is $2x+y=F$, not $2x+2y=F$. Maximizing $x(F-2x)$ gives $x=F/4$ and $y=F/2$, so the wall-parallel side is twice each perpendicular side.`,
        ),
      ],
      review: [
        exact(
          R`A rectangle has perimeter $28$ units. Find its maximum area.`,
          49,
          R`The maximizing sides are $7$ and $7$, giving $49$.`,
        ),
        exact(
          R`A three-sided enclosure uses $40$ units of fence. Find the optimal perpendicular side length.`,
          10,
          R`$A=x(40-2x)$ has derivative $40-4x$, which vanishes at $10$.`,
        ),
        exact(
          R`For a square sheet of side $24$, find the cut size maximizing $x(24-2x)^2$ on $0<x<12$.`,
          4,
          R`The derivative factors as $(24-2x)(24-6x)$, and the interior maximizing root is $4$.`,
        ),
      ],
      quickCheck: qc(
        'After eliminating a variable using a geometric constraint, what must be established before accepting a derivative root?',
        [
          'That it is feasible and gives the best objective value',
          'That it is an integer',
          'That the objective derivative is positive there',
        ],
        0,
        'A root may be outside the allowed dimensions or fail to be a maximum. Feasibility and comparison are essential.',
      ),
    },
    {
      title: 'Cost, distance, and discrete decisions',
      sources: [
        source('4.7', 'Cost/revenue optimization, distance objectives and interpretation.'),
        source('4.3', 'Feasible endpoints and absolute extrema.'),
      ],
      body: R`Economic optimization separates revenue, cost, and profit. If price depends on quantity, revenue is price times quantity, and profit is revenue minus cost. For a continuous model with price $p(q)=30-q$ and cost $C(q)=6q+20$, profit is $\Pi(q)=q(30-q)-(6q+20)=-q^2+24q-20$. If feasible production is $0\le q\le20$, its derivative $24-2q$ vanishes at $12$. The concave quadratic has its global feasible maximum there, with profit $124$. Maximizing revenue alone would solve a different objective.

Capacity can override an interior optimum. With the same model and capacity $q\le8$, profit is increasing throughout the feasible interval, so the maximum occurs at $8$. A derivative calculation is not permission to ignore the constraint. Fixed costs change profit values but not this model's marginal profit, because their derivative is zero; other changes to the cost model can shift the optimum.

Distance objectives often simplify by squaring. To find the closest point $(x,2x)$ on a line to $(3,0)$, minimize $D(x)=(x-3)^2+(2x)^2=5x^2-6x+9$. Squaring preserves the minimizing input because square root is strictly increasing on nonnegative values. The derivative gives $10x-6=0$, so $x=3/5$ and the closest point is $(3/5,6/5)$. The positive quadratic coefficient proves the minimum globally, not just locally.

A continuous model may represent decisions that must be integral, such as numbers of items. Locate the continuous optimum, then compare feasible integers near it when the model's shape justifies that reduction. For a concave quadratic with vertex $q=7.4$, the integer maximum lies at $7$ or $8$; evaluate both. For a general non-unimodal objective, blindly rounding one stationary point is not sufficient.

Report what the mathematical model establishes and preserve meaningful units. A negative optimal profit may still be the largest profit among the permitted choices. If shutting down has a different cost structure from positive production, that alternative must be modeled explicitly rather than inferred from a smooth formula that does not describe it.`,
      terms: [
        term(
          'profit-objective',
          'Profit objective',
          'Revenue minus cost over feasible production levels.',
          R`$\Pi(q)=R(q)-C(q)$, and its derivative compares marginal revenue and marginal cost.`,
          R`If $R=30q-q^2$ and $C=6q+20$, then $\Pi'=24-2q$.`,
          'Maximizing revenue is not generally maximizing profit.',
        ),
        term(
          'squared-distance-objective',
          'Squared-distance objective',
          'An equivalent minimization without a square root.',
          R`Minimizing nonnegative distance is equivalent to minimizing its square because square root is increasing.`,
          R`Distance from $(x,2x)$ to $(3,0)$ is minimized by minimizing $5x^2-6x+9$.`,
          'The squared value has different units from the distance.',
        ),
        term(
          'discrete-optimization-check',
          'Discrete candidate comparison',
          'Check feasible discrete choices after a continuous model.',
          R`For a concave quadratic, compare the feasible integers adjacent to its real vertex.`,
          R`A vertex at $7.4$ requires comparing integer choices $7$ and $8$.`,
          'Rounding alone is not a universal optimization method.',
        ),
      ],
      questions: [
        expr(
          R`Price is $p(q)=20-q$ and cost is $C(q)=4q+10$. Write profit as a function of $q$.`,
          '-q^2+16*q-10',
          R`Revenue is $q(20-q)$; subtracting cost gives $-q^2+16q-10$.`,
          ['q'],
        ),
        exact(
          R`Maximize $\Pi(q)=-q^2+16q-10$ over $0\le q\le15$. Give the maximizing input.`,
          8,
          R`$\Pi'=16-2q$ vanishes at $8$, and the concave quadratic rises before and falls after it.`,
        ),
        exact(
          R`Find the maximum value of $\Pi(q)=-q^2+16q-10$ on $[0,15]$.`,
          54,
          R`At $q=8$, profit is $-64+128-10=54$.`,
        ),
        exact(
          R`Maximize the same profit $\Pi(q)=-q^2+16q-10$ under capacity $0\le q\le5$. Give the maximizing input.`,
          5,
          R`The derivative is positive on this entire interval, so the right endpoint is optimal.`,
        ),
        exact(
          R`A cost is $C(q)=q^2+54/q$ for $q>0$. Find the minimizing $q$.`,
          3,
          R`$C'=2q-54/q^2=0$ gives $q^3=27$. The derivative changes from negative to positive, so $q=3$ is the global minimum.`,
        ),
        exact(
          R`For points $(x,x)$ on the line $y=x$, find the $x$ coordinate of the point closest to $(4,0)$.`,
          2,
          R`Minimize $(x-4)^2+x^2$, whose derivative is $4x-8$; its unique minimum is at $2$.`,
        ),
        exact(
          R`Find the minimum squared distance from $(4,0)$ to a point on $y=x$.`,
          8,
          R`At the minimizing point $(2,2)$, the squared distance is $(2-4)^2+2^2=8$.`,
        ),
        exact(
          R`For integer $q\in\{0,1,\ldots,10\}$, maximize $P(q)=-(q-7.4)^2+20$. Give the maximizing integer.`,
          7,
          R`The continuous vertex is $7.4$. Compare $7$ and $8$: squared deviations are $0.16$ and $0.36$, so $7$ gives the larger value.`,
        ),
        open(
          R`Find the closest point on $y=3x$ to $(5,0)$ and justify global optimality.`,
          R`Minimize $D=(x-5)^2+9x^2=10x^2-10x+25$. Completing the square gives $10(x-1/2)^2+45/2$, globally minimized at $x=1/2$. The point is $(1/2,3/2)$.`,
        ),
        open(
          R`Explain why a continuous stationary point outside a production capacity interval cannot be reported as the constrained optimum.`,
          R`It is not feasible. The objective must be compared over the actual allowed interval, where it may keep increasing up to capacity or decreasing from a boundary. The stationary point belongs to an unconstrained problem instead.`,
        ),
      ],
      review: [
        exact(
          R`Maximize $P(q)=-2q^2+20q-7$ on $0\le q\le8$. Give the maximizing input.`,
          5,
          R`The derivative is $20-4q$, zero at $5$, and the negative quadratic coefficient ensures a maximum.`,
        ),
        exact(
          R`Minimize $(x-6)^2+x^2$ over the real line. Give the minimizing input.`,
          3,
          R`The derivative is $4x-12$, so the unique quadratic minimum is at $3$.`,
        ),
        exact(
          R`For integer $q\in\{0,1,\ldots,8\}$, maximize $P(q)=-(q-4.7)^2+10$. Give the maximizing integer.`,
          5,
          R`The adjacent choices are $4$ and $5$, with squared deviations $0.49$ and $0.09$, so $5$ is better.`,
        ),
      ],
    },
  ],
};
