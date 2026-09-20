import {
  raw,
  source,
  section,
  q,
  exact,
  expr,
  tuple,
  truth,
  term,
  quick,
} from './multivariable-helpers.mjs';
const lagrange = source('4.8', 'Lagrange Multipliers');
const extrema = {
  ...source('4.7', 'Maxima/Minima Problems'),
  url: 'https://openstax.org/books/calculus-volume-3/pages/4-7-maxima-minima-problems',
};
const sections = [
  section(
    'Optimize over the feasible set',
    raw`An objective is the quantity to minimize or maximize. A constraint restricts the allowed inputs, whose collection is the feasible set. A point can optimize a function on a curve without optimizing it over the entire plane. Distinguishing those questions is the first step in a constrained problem.

For example, minimize $f(x,y)=x^2+y^2$ subject to x+y=6. Without the constraint, the origin gives value zero, but it is not feasible. On the line, the closest point to the origin is (3,3), with objective value eighteen. The gradient of f there is (6,6), which is not zero. An unconstrained stationary-point test would miss this minimum because movement is allowed only along the constraint line.

At a smooth point on a constraint curve, its tangent direction describes an infinitesimal feasible movement. The gradient of a function defining the curve is perpendicular to that tangent. At a constrained extremum, the objective cannot increase or decrease to first order along the tangent, so its gradient is also perpendicular to that tangent. In two dimensions, these two gradients are parallel, provided the constraint gradient is nonzero.

Level curves offer another view. For $x^2+y^2$, they are circles centered at the origin. The smallest circle that reaches x+y=6 just touches it at (3,3). A larger circle intersects the line elsewhere, and a smaller circle does not reach the feasible set. Tangency identifies a candidate; its geometric meaning explains why an ordinary zero-gradient equation is not the appropriate condition.

Always translate the model completely. A statement such as x+y=6 with x,y nonnegative gives a closed line segment, whereas the equality alone gives an unbounded line. These feasible sets have the same interior candidate but different maximum behavior. The segment has a largest squared distance at its endpoints; the unbounded line has none. Constraints include inequalities, exclusions, and units, even when our main calculation uses one equality.`,
    lagrange,
    'feasible set',
    'The inputs satisfying every constraint in an optimization problem.',
    raw`The equations x+y=6 with x,y nonnegative describe a line segment.`,
    'An unconstrained optimizer may not be an allowed input.',
  ),
  section(
    'Use substitution when it simplifies the problem',
    raw`If a constraint can be solved conveniently for one variable, substitution converts the problem to one-variable optimization. Preserve the domain while substituting. From x+y=6, obtain y=6-x. The objective becomes $F(x)=x^2+(6-x)^2=2(x-3)^2+18$. The completed square proves the minimum eighteen at x=3, y=3, over the full line. There is no maximum because the squared term grows without bound.

If the original model also requires x,y nonnegative, then x lies in [0,6]. Differentiate to find the interior candidate x=3, then compare it with endpoints zero and six. The values are eighteen, thirty-six, and thirty-six. Both endpoints maximize the objective on the segment. A derivative calculation alone would have found the minimum but omitted the maximum.

Substitution also handles models whose objective is not a distance. Suppose a rectangle has positive side lengths x and y and fixed perimeter twenty. Its constraint is x+y=10, and its area is $A(x)=x(10-x)$ for $0<x<10$. The derivative is 10-2x, so the largest area is twenty-five at the square (5,5). No smallest positive area is attained: areas approach zero as a side approaches zero, but a zero-length side is excluded.

Elimination must preserve every branch. Solving $x^2+y^2=1$ as $y=\sqrt{1-x^2}$ describes only the upper semicircle. The lower branch has a minus sign. If the full circle is feasible, optimizing on one branch alone may miss a candidate. Parameterizing by x=cos t, y=sin t is another possible approach, using a parameter range that covers the entire circle.

Choose substitution for convenience, not as a rule that it always reduces the work. A symmetric constraint or several tightly linked variables may be clearer with gradient equations. Both methods must optimize over exactly the same feasible inputs and must distinguish an attained extremum from a merely approached bound.`,
    lagrange,
    'constraint substitution',
    'Eliminating a variable using a constraint while retaining all allowed branches and domain restrictions.',
    raw`With x+y=6, replace y by 6-x and optimize the resulting one-variable function.`,
    'Solving with one square-root branch may discard feasible points.',
  ),
  section(
    'Set up and solve the Lagrange equations',
    raw`Let f be the objective and let g(x,y)=c describe one equality constraint. Assume both functions have continuous first partial derivatives near the point, and $\nabla g\ne 0$ there. A local extremum along the smooth constraint must satisfy $\nabla f=\lambda\nabla g$ together with g=c. The extra scalar $\lambda$, pronounced lambda, is the Lagrange multiplier. It expresses how the two normal vectors are scaled relative to each other.

For $f=x^2+2y^2$ with x+y=6, choose g=x+y. The equations are $2x=\lambda$, $4y=\lambda$, and x+y=6. The first two imply x=2y; substitution into the constraint gives y=2, x=4, and lambda=8. The objective value is sixteen plus eight, or twenty-four. To establish the global minimum, substitute y=6-x into f or complete a square; merely solving the multiplier equations gives a candidate.

An equivalent method introduces the Lagrangian $L(x,y,\lambda)=f(x,y)-\lambda(g(x,y)-c)$. Setting all its first partial derivatives to zero reproduces the same three equations. Some books use a plus sign instead; that changes the sign of the reported multiplier, not the candidate x and y. We use the minus convention throughout this lesson.

Do not omit the constraint equation. Parallel gradients at an infeasible point do not solve the problem. Also avoid dividing by a variable before considering whether it might be zero. For extrema on a circle, equations such as x times an expression equals zero can produce several separate branches of candidates.

The method extends to a scalar objective in three variables with one smooth equality: there are three gradient-component equations and one constraint. We remain with one equality here. Multiple equalities and general inequality methods require additional conditions. Even within this scope, record the regularity assumption and compare candidate objective values before reporting an optimum.`,
    lagrange,
    'Lagrange multiplier',
    'A scalar making the objective gradient a multiple of a nonzero constraint gradient at a constrained stationary point.',
    raw`For $x^2+2y^2$ with x+y=6, the candidate (4,2) has multiplier 8.`,
    'The multiplier equations are necessary candidate conditions, not by themselves a global-optimality proof.',
  ),
  section(
    'Compare all candidates and boundaries',
    raw`A continuous objective on a nonempty closed bounded feasible set attains both a minimum and a maximum. The multiplier method can locate candidates on smooth pieces, but the global result requires a complete candidate list and comparison. Any additional endpoints, corners, or singular points must be checked separately.

For $f(x,y)=xy$ on the unit circle, take g=x squared plus y squared. The equations are $y=2\lambda x$, $x=2\lambda y$, and $x^2+y^2=1$. Neither x nor y can be zero in these equations: one zero would force the other zero and violate the circle constraint. Substitution gives $4\lambda^2=1$, hence lambda is one half or minus one half. Therefore y=x or y=-x.

On each branch, the constraint gives $x^2=1/2$. The two same-sign points give f=1/2; the two opposite-sign points give f=-1/2. These are respectively the global maximum and minimum. The circle is compact, the constraint gradient never vanishes on it, and every candidate has been considered. The inequality $2|xy|\leq x^2+y^2=1$ supplies an independent bound confirming the result.

Now restrict the circle to the first quadrant, including its endpoints. Only the positive same-sign point remains as an interior candidate on the arc. It gives maximum one half. The endpoints (1,0) and (0,1) give the minimum zero. The endpoints were not stationary for the full-circle problem, yet they matter for the restricted feasible set.

Write down all branches before simplifying, label candidate locations and their objective values separately, and check each location against every constraint. Existence and classification are different tasks: compactness guarantees that extrema exist, whereas the calculations identify them. On an open or unbounded set, one or both may fail to be attained even when some constrained stationary points exist.`,
    lagrange,
    'constrained extremum comparison',
    'Evaluating an objective at every feasible candidate and relevant boundary point to identify its extrema.',
    raw`On a quarter unit circle, compare the interior product maximum with both arc endpoints.`,
    'Discarded branches and omitted endpoints can hide the global optimum.',
  ),
  section(
    'Recognize singular constraints and modeling limits',
    raw`The condition $\nabla g\ne 0$ is part of the multiplier theorem, not a technical decoration. If it fails, the equation $\nabla f=\lambda\nabla g$ can miss a constrained optimum. Consider minimizing f=x subject to $g=x^2+y^2=0$. The feasible set contains only (0,0), so that point is both a minimum and maximum. But the objective gradient is (1,0) while the constraint gradient is (0,0); no multiplier makes them equal.

The failure is in the regularity assumption. There is no smooth curve of nearby feasible directions at this isolated point. Direct inspection of the constraint solves the problem. This example also explains why an empty list from the multiplier equations does not establish that a constrained problem has no optimum.

How the same set is described can affect regularity. The line x+y=2 has a nonzero normal (1,1). Writing the equivalent constraint $(x+y-2)^2=0$ makes its gradient zero along the entire line. The feasible set is unchanged, but the squared representation destroys the hypothesis needed by the simple multiplier equations. Use the unsquared regular equation when possible.

Check other limitations as well. A differentiable objective may lack a maximum on an unbounded feasible line. An open segment may approach an endpoint value without attaining it. A physical requirement such as positive length excludes a degenerate rectangle even if its limiting area looks attractive. A mathematically feasible result can still be unusable if a relevant modeling constraint was omitted.

A reliable solution states the objective, all constraints, regular candidates, exceptional points, and the comparison establishing the conclusion. If a bound is approached but not attained, report that explicitly. If the model uses approximate measurements or a simplified cost, its optimum describes that model. Calculus does not turn an incomplete objective into a complete decision; it makes the consequences of the chosen objective and feasible set precise.`,
    lagrange,
    'regular constraint point',
    'A point where the gradient of the equality constraint is nonzero.',
    raw`The line x+y=2 is regular for g=x+y, but its squared equation has zero gradient on the line.`,
    'A zero constraint gradient invalidates the basic multiplier theorem at that point.',
  ),
];
sections[3].sources.push(extrema);
sections[0].questions = [
  q(
    'Is (2,4) feasible for x+y=6 with x,y nonnegative?',
    'Both coordinates are nonnegative and sum to 6, so yes.',
    truth(true),
    'interpret',
  ),
  q(
    'Is the origin feasible for x+y=6?',
    'Its coordinate sum is 0, so it violates the equality.',
    truth(false),
    'interpret',
  ),
  q(
    'Find the objective $x^2+y^2$ at the feasible point (2,4).',
    'Substitution gives 4+16=20.',
    exact(20),
  ),
  q(
    'For the line x+2y=8, give one normal vector as the ordered pair from its constraint gradient.',
    'Differentiate g=x+2y to get(1,2).',
    tuple([1, 2]),
  ),
  q(
    'For the line x+2y=8, is (2,-1) a tangent direction?',
    'Its dot product with the normal(1,2) is 2-2=0, so yes.',
    truth(true),
    'interpret',
  ),
  q(
    'At (3,3), compute the gradient of $x^2+y^2$ as a pair.',
    'The gradient is (2x,2y), hence(6,6).',
    tuple([6, 6]),
  ),
  q(
    'Find the minimum of $x^2+y^2$ on x+y=4.',
    'Substitution gives 2(x-2) squared+8, so the minimum value is 8.',
    exact(8),
  ),
  q(
    'Does a constrained minimum require the full objective gradient to vanish?',
    'No. The gradient may be nonzero but perpendicular to every feasible tangent direction.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain why adding x,y nonnegative to x+y=6 changes the maximum problem.',
    'It replaces an unbounded line by a closed bounded segment. Squared distance grows without bound on the line but has finite endpoint maxima on the segment.',
  ),
  q(
    'Why should both the optimizing point and the objective value be reported?',
    'The point specifies the choice of inputs; the value specifies the achieved cost or benefit. They answer different parts of the optimization problem.',
  ),
];
sections[1].questions = [
  q(
    'For x+y=8, express $x^2+y^2$ as a function of x.',
    'Substitute y=8-x: x squared+(8-x) squared.',
    expr('x^2+(8-x)^2', ['x']),
  ),
  q(
    'Minimize $x^2+y^2$ on x+y=8; give the minimizing pair.',
    'The reduced derivative is 4x-16, so x=4 and y=4.',
    tuple([4, 4]),
  ),
  q(
    'Find the maximum of $x^2+y^2$ on x+y=8 with x,y nonnegative.',
    'The endpoints(0,8) and(8,0) give 64; the interior candidate gives 32. The maximum is 64.',
    exact(64),
  ),
  q(
    'A rectangle has perimeter 12 and positive sides. Find its largest area.',
    'The area is x(6-x), maximized at x=3, giving 9.',
    exact(9),
  ),
  q(
    'A rectangle has perimeter 28 and positive sides. Give the maximizing side lengths as a pair.',
    'The area x(14-x) is maximized at x=7; y=7.',
    tuple([7, 7]),
  ),
  q(
    'Does a positive-sided rectangle of fixed perimeter have an attained minimum area?',
    'No. Its area approaches 0 as a side approaches 0, but zero sides are excluded.',
    truth(false),
    'interpret',
  ),
  q(
    'For $x^2+y^2=9$ with y nonnegative, express y as a function of x.',
    'The allowed branch is the nonnegative root sqrt(9-x squared).',
    {
      validator: 'calculus-expression',
      params: { variables: ['x'], expected: 'sqrt(9-x^2)', domain: { nonnegative: ['9-x^2'] } },
      correct: 'sqrt(9-x^2)',
      incorrect: '9-x^2',
    },
  ),
  q(
    'For the upper semicircle x squared+y squared=9 with y nonnegative, give the x interval endpoints.',
    'Real square roots require 9-x squared>=0, hence[-3,3].',
    tuple([-3, 3]),
  ),
  q(
    raw`Why is substituting $y=\sqrt{1-x^2}$ insufficient for optimizing over the full unit circle?`,
    'It excludes every point with negative y. Both square-root branches or a full-circle parameterization must be considered.',
  ),
  q(
    'Minimize $x^2+3y^2$ subject to x+y=4; give the minimizing pair.',
    'Substitute y=4-x; the derivative is 8x-24, yielding x=3,y=1.',
    tuple([3, 1]),
  ),
];
sections[2].questions = [
  q(
    'For $f=x^2+2y^2$ and g=x+y, give the two components of the objective gradient at (2,3).',
    'Differentiate to (2x,4y); at (2,3) this is (4,12).',
    tuple([4, 12]),
  ),
  q(
    'Minimize $x^2+2y^2$ on x+y=9; give the candidate pair from Lagrange equations.',
    'Equating 2x and 4y gives x=2y; the sum 9 gives (6,3).',
    tuple([6, 3]),
  ),
  q(
    'At the Lagrange candidate for f=x squared+2y squared subject to g=x+y=9, find lambda using the minus-sign Lagrangian convention.',
    'The equations give lambda=2x=12, also 4y=12.',
    exact(12),
  ),
  q(
    'Find the candidate value of $x^2+2y^2$ on x+y=9.',
    'At(6,3), the objective is 36+18=54.',
    exact(54),
  ),
  q(
    'Minimize $2x^2+y^2$ on x+y=6; give the candidate pair.',
    'The gradient equations give 4x=2y, hence y=2x and(2,4).',
    tuple([2, 4]),
  ),
  q(
    'Minimize $x^2+y^2+z^2$ subject to x+y+z=12; give the candidate triple.',
    'All three gradient components equal lambda, so x=y=z=4.',
    tuple([4, 4, 4]),
  ),
  q(
    raw`For $L=x^2+y^2-\lambda(x+y-6)$, give its lambda partial as an expression in x,y.`,
    'Differentiating in lambda gives-(x+y-6)=6-x-y.',
    expr('6-x-y'),
  ),
  q(
    'Can a point satisfying only the gradient proportionality equation be accepted without checking the constraint?',
    'No. It must also belong to the feasible set.',
    truth(false),
    'interpret',
  ),
  q(
    raw`Explain how using $L=f+\lambda(g-c)$ changes the reported multiplier.`,
    'The first-order equations become gradient f=-lambda gradient g. Its lambda is the negative of the multiplier under the minus convention; feasible candidate locations are unchanged.',
  ),
  q(
    'Why is dividing by x unsafe when solving multiplier equations on a circle?',
    'A branch with x=0 may contain valid candidates. It must be examined before canceling or dividing by x.',
  ),
];
sections[3].questions = [
  q(
    'Find the maximum value of xy on $x^2+y^2=4$.',
    'The bound 2|xy|<=4 gives|xy|<=2; equal same-sign coordinates attain maximum 2.',
    exact(2),
  ),
  q(
    'Find the minimum value of xy on $x^2+y^2=4$.',
    'Opposite-sign equal-magnitude coordinates attain xy=-2.',
    exact(-2),
  ),
  q(
    'Find the minimum of xy on the first-quadrant arc $x^2+y^2=4$, including endpoints.',
    'The product is nonnegative and equals 0 at (2,0) and(0,2), so the minimum is 0.',
    exact(0),
  ),
  q(
    'Find the maximum of $x^2$ on the unit circle.',
    'The constraint gives x squared<=1; equality occurs at (1,0) and(-1,0).',
    exact(1),
  ),
  q(
    'Find the minimum of $x^2$ on the unit circle.',
    'The value is nonnegative and reaches 0 at (0,1) and(0,-1).',
    exact(0),
  ),
  q(
    'For xy on the unit circle, how many distinct maximizing points are there?',
    'The same-sign points are (1/sqrt(2),1/sqrt(2)) and their simultaneous negatives, giving 2.',
    exact(2),
    'interpret',
  ),
  q(
    'For xy on the unit circle, how many distinct minimizing points are there?',
    'There are two opposite-sign points, giving 2.',
    exact(2),
    'interpret',
  ),
  q(
    'Does a continuous function on a nonempty closed bounded feasible set attain both global extrema?',
    'Yes. The extreme value theorem guarantees attainment.',
    truth(true),
    'interpret',
  ),
  q(
    'Explain why an endpoint of a restricted arc can be a minimum without satisfying the stationary equations for the full circle.',
    'The restricted arc permits movement in only one feasible direction at its endpoint. The full-circle stationary condition assumes a smooth two-sided neighborhood along the curve.',
  ),
  q(
    'For xy on $x^2+y^2=1$ with x,y strictly positive, is its infimum 0 attained?',
    'No. The product approaches 0 at excluded axis endpoints but is positive at every feasible point.',
    truth(false),
    'interpret',
  ),
];
sections[4].questions = [
  q(
    'For g=x squared+y squared, compute its gradient at the origin.',
    'The gradient is (2x,2y), which is (0,0).',
    tuple([0, 0]),
  ),
  q(
    'For f=x subject to x squared+y squared=0, what is the minimum value?',
    'The only feasible point is the origin; its objective value is 0.',
    exact(0),
  ),
  q(
    'For f=x subject to g=x squared+y squared=0, does any lambda solve gradient f=lambda gradient g at the feasible point?',
    'No. The equation would require(1,0)=lambda(0,0).',
    truth(false),
    'interpret',
  ),
  q(
    'For g=(x+y-2) squared, give its gradient at (1,1).',
    'Both components are 2(x+y-2), so both vanish at (1,1).',
    tuple([0, 0]),
  ),
  q(
    'For the regular representation g=x+y of that same line, give the gradient.',
    'The gradient is the constant pair (1,1).',
    tuple([1, 1]),
  ),
  q(
    'Does the equality x+y=2 describe the same feasible set as (x+y-2) squared=0?',
    'Yes. A real square equals 0 exactly when its base equals 0.',
    truth(true),
    'interpret',
  ),
  q(
    'Does an empty multiplier candidate list prove that no constrained optimum exists?',
    'No. Singular points may be omitted by the regular multiplier theorem.',
    truth(false),
    'interpret',
  ),
  q(
    'Find the minimum value of x on x squared+y squared=0 and explain why the constraint needs direct inspection.',
    'Only the origin is feasible, giving 0. The constraint gradient vanishes there, so the regular multiplier theorem does not apply.',
  ),
  q(
    'Explain why a mathematical optimum for a positive-length model cannot use a zero-length side.',
    'A zero side violates the stated feasible domain. It can describe a limiting value but cannot be an attained feasible optimum.',
  ),
  q(
    'What should be done if the original constraint equation has zero gradient on every feasible point but a simpler equivalent regular equation is available?',
    'Use the regular equation, verify it describes the same set, and still inspect any exceptional or boundary points required by the model.',
  ),
];
sections[2].quickCheck = quick(
  'Which equation must accompany gradient f=lambda gradient g?',
  ['f=0', 'The original constraint g=c', 'lambda=0'],
  1,
  'The gradient relation alone does not require feasibility.',
);
sections[4].quickCheck = quick(
  'If the constraint gradient vanishes at a candidate, what follows?',
  [
    'The point cannot optimize',
    'The basic multiplier theorem does not apply there',
    'The objective is constant',
  ],
  1,
  'Inspect the singular point directly or use a valid alternative description.',
);
sections[0].review = [
  q('Is(1,2) feasible for x+2y=5?', 'Yes:1+4=5.', truth(true), 'interpret'),
  q('Give the constraint gradient for 3x+y=7.', 'It is (3,1).', tuple([3, 1])),
  q(
    'Why can a constrained minimum have a nonzero objective gradient?',
    'Only feasible tangent movements matter; the objective gradient can point normally to the constraint.',
  ),
];
sections[1].review = [
  q(
    'Maximize the area of a positive-sided rectangle with perimeter 16.',
    'Its side sum is 8 and its maximum is at (4,4), with area 16.',
    exact(16),
  ),
  q(
    'Minimize x squared+y squared subject to x+y=10; give the pair.',
    'The completed square gives the pair (5,5).',
    tuple([5, 5]),
  ),
  q(
    'Does optimizing only the upper square-root branch cover a full circle?',
    'No. The lower semicircle is omitted.',
    truth(false),
    'interpret',
  ),
];
sections[2].review = [
  q(
    'For x squared+3y squared with x+y=8, give the Lagrange candidate pair.',
    'The equations give x=3y and then(6,2).',
    tuple([6, 2]),
  ),
  q(
    'At the Lagrange candidate for f=x squared+3y squared subject to g=x+y=8, find lambda using the minus-sign Lagrangian convention.',
    'Lambda=2x=12, also 6y=12.',
    exact(12),
  ),
  q(
    'Explain why solving the multiplier equations does not itself prove a global minimum.',
    'They supply necessary candidates; one still needs a complete feasible comparison or another global bound.',
  ),
];
sections[3].review = [
  q(
    'Find the maximum of xy on x squared+y squared=9.',
    'The bound 2|xy|<=9 is attained with equal signs, giving 9/2.',
    exact('9/2'),
  ),
  q(
    'Find the minimum of xy on the full circle x squared+y squared=9.',
    'Opposite signs attain -9/2.',
    exact('-9/2'),
  ),
  q(
    'Find the minimum of xy on the first-quadrant closed arc x squared+y squared=9, including its endpoints.',
    'The product reaches 0 at either axis endpoint.',
    exact(0),
  ),
];
sections[4].review = [
  q(
    'Is the origin a regular point for g=x squared+y squared?',
    'No. Its constraint gradient is zero.',
    truth(false),
    'interpret',
  ),
  q(
    'Does squaring a regular constraint expression preserve its nonzero gradient on the feasible set?',
    'No. The chain rule introduces the expression itself, which vanishes there.',
    truth(false),
    'interpret',
  ),
  q(
    'Give a constrained problem whose only feasible point is an optimum but has no Lagrange multiplier.',
    'For f=x and x squared+y squared=0, the sole feasible origin is both extrema, but(1,0) cannot equal lambda(0,0).',
  ),
];
export default {
  number: 21,
  slug: 'calculus-constrained-optimization',
  title: 'Basic Constrained Optimization',
  intro:
    'Optimization changes when inputs must stay on a line, a curve, or another feasible set. We will compare direct substitution with Lagrange multipliers, explain the geometry behind the equations, and learn why constraints, exceptional points, and boundary checks are inseparable from a correct result.',
  sections,
};
