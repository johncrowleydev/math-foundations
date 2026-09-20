import {
  raw,
  source,
  section,
  q,
  exact,
  expr,
  tuple,
  term,
  truth,
  quick,
} from './multivariable-helpers.mjs';
const partial = source('4.3', 'Partial Derivatives'),
  ext = source('4.7', 'Maxima/Minima Problems');
const sections = [
  section(
    'Differentiate the partial derivatives',
    raw`A second partial derivative measures how a first partial changes. We use $f_{xy}$ to mean differentiate f first with respect to x, then differentiate that result with respect to y. State this convention when comparing notation, because other presentations may write the operations in the opposite visual order. The calculation itself must specify the order.

For $f=x^3y+2xy^2$, the first partials are $f_x=3x^2y+2y^2$ and $f_y=x^3+4xy$. Differentiating again gives $f_{xx}=6xy$, $f_{xy}=3x^2+4y$, $f_{yx}=3x^2+4y$, and $f_{yy}=4x$. The matching mixed partials are not a coincidence for this polynomial.

If the mixed second partials are continuous in a neighborhood of a point, they agree there. This theorem gives a sufficient regularity condition; one must not assume equality for arbitrary piecewise formulas without checking. For smooth elementary expressions on valid open domains, the condition is normally satisfied.

### What second partials mean

For a temperature surface, $f_x$ measures how temperature changes eastward. The mixed partial $f_{xy}$ measures how that eastward rate changes when moving northward. The pure partial $f_{xx}$ instead measures changes in the eastward rate while moving eastward. These have different interpretations even when their numerical values happen to coincide.

Higher derivatives can be computed by continuing the process, but this lesson uses second derivatives to describe local curvature. Keep function formulas separate from values at a point: differentiating a derivative value after substitution would differentiate a constant and erase the nearby information needed for curvature. Compute the derivative function first and then evaluate it.`,
    partial,
    'mixed partial derivative',
    'A partial derivative taken successively with respect to different inputs.',
    raw`For $f=x^2y$, differentiating in x then y gives $f_{xy}=2x$.`,
    'Equality of mixed partials is justified by regularity conditions, not notation alone.',
  ),
  section(
    'The Hessian and quadratic approximation',
    raw`The Hessian is the square matrix of second partial derivatives of a scalar function. In two variables its rows are $(f_{xx},f_{xy})$ and $(f_{yx},f_{yy})$. With continuous second partials it is symmetric. This is where earlier work on symmetric matrices and quadratic forms becomes useful.

Near a sufficiently smooth point p, the second-order approximation is $f(p+h)\approx f(p)+\nabla f(p)^Th+\tfrac12 h^TH(p)h$. Here h is a displacement column vector, H is the Hessian, and the factor one half prevents double-counting the pure second derivative contribution. For two coordinates the quadratic term is $\tfrac12 f_{xx}h^2+f_{xy}hk+\tfrac12 f_{yy}k^2$ when the mixed partials agree.

For $f=x^2+2xy+3y^2$, the Hessian has rows $(2,2)$ and $(2,6)$. At the origin the gradient vanishes and the quadratic approximation is exactly the original polynomial: $h^2+2hk+3k^2$. The mixed term appears with coefficient two, not one or four. Expanding the matrix product is a useful check on these factors.

The Hessian at one point describes local second-order behavior. It does not automatically establish global curvature properties or tell the entire story when its quadratic form vanishes in some directions. The function $x^4+y^4$ has zero Hessian at the origin while remaining positive at every nearby nonzero point.

Use the quadratic approximation to predict a change, compare it with direct substitution for small displacements, and identify which terms were omitted. As with linearization, an approximation is useful only on a scale where its neglected terms are appropriately small.`,
    ext,
    'Hessian matrix',
    'The matrix of second partial derivatives of a scalar function.',
    raw`For $x^2+3y^2$, the Hessian is diagonal with entries two and six.`,
    'A Hessian at one point is local information; zero curvature there does not imply a constant function.',
  ),
  section(
    'Stationary points and the second derivative test',
    raw`At an interior local extremum of a differentiable function, the gradient must vanish. Such a point is stationary. First solve all gradient equations simultaneously; finding where just one partial vanishes is not enough. Points where derivatives fail and points on a boundary require separate attention.

For a twice continuously differentiable function of two variables, form $D=f_{xx}f_{yy}-f_{xy}^2$ at a stationary point. If D is positive and $f_{xx}>0$, the point is a strict local minimum. If D is positive and $f_{xx}<0$, it is a strict local maximum. If D is negative, it is a saddle point. If D is zero, this test is inconclusive.

Consider $f=(x-1)^2+2(y+2)^2$. Its gradient equations give x=1 and y=-2. The second partials are two, four, and zero, so D=8 and the point is a local minimum. The sum-of-squares expression establishes more: it is the unique global minimum on the entire plane, with value zero. That global conclusion comes from the whole formula, not merely the local test.

For $g=(x-1)^2-2(y+2)^2$, the same point is stationary, but D=-8. Holding y=-2 produces positive changes and holding x=1 produces negative changes, so it is a saddle. A stationary point need not be an extremum.

For a negative definite quadratic form, changing the sign of the positive example produces a maximum. In higher dimensions, Hessian eigenvalues provide the corresponding classification when none are zero: all positive means a strict local minimum, all negative a strict local maximum, and both signs a saddle. The two-variable determinant shortcut is not a universal higher-dimensional test.`,
    ext,
    'stationary point',
    'An interior point at which every first partial derivative is zero.',
    raw`The origin is stationary for both $x^2+y^2$ and $x^2-y^2$.`,
    'The zero-gradient condition is necessary for a differentiable interior extremum, not sufficient.',
  ),
  section(
    'When the test cannot decide',
    raw`An inconclusive second derivative test means that the quadratic information does not settle the problem. It is not a classification of the point itself. The functions $x^4+y^4$, $-(x^4+y^4)$, and $x^4-y^4$ all have zero Hessian at the origin. Yet the first has a strict minimum, the second a strict maximum, and the third a saddle.

To resolve such cases, inspect actual function values or higher-order terms. A sum of nonnegative terms proves a minimum when equality occurs at the point. Two paths with opposite signs of change prove a saddle. A direction along which the value stays constant may prevent strictness without preventing a non-strict minimum.

For $f=x^2$, every point with x=0 is a global minimum and changing y does nothing. The Hessian has a zero eigenvalue, but the function never falls below zero. The minimum is not strict because nearby points on the same vertical line have equal value. The set of minimizers is a line, not one isolated point.

### Cross terms can change the classification

For $q=x^2+4xy+y^2$, the pure second partials are both positive, but the origin is a saddle. Along y=x the output is $6x^2$; along y=-x it is $-2x^2$. Looking only at coordinate slices would suggest upward curvature while missing the downward diagonal direction. The mixed term matters.

At a nonsmooth point, even the gradient condition may be unavailable. The function $\sqrt{x^2+y^2}$ has a minimum at the origin despite lacking a derivative there. Before applying a named test, verify its hypotheses and specify what conclusion follows. When the hypotheses fail or the test is inconclusive, return to the definition and the actual formula.`,
    ext,
    'inconclusive curvature test',
    'A second derivative test whose zero discriminant leaves the point unclassified.',
    raw`At the origin, $x^4+y^4$ has a minimum even though its Hessian is zero.`,
    'Inconclusive does not mean that there is no extremum.',
  ),
  section(
    'Global extrema require the whole feasible set',
    raw`For a continuous function on a closed bounded region, global minimum and maximum values are attained. To find them, inspect interior stationary points, boundary behavior, and corners or singular boundary points. A local interior test cannot replace these boundary calculations.

For $f=x^2+y^2$ on the rectangle $-1\leq x\leq2$, $0\leq y\leq3$, the origin is feasible and gives the minimum zero. The maximum occurs at the corner (2,3), with value thirteen. Along each edge, the problem reduces to a one-variable function; checking those edges and their endpoints establishes that no larger value was missed.

On the open disk $x^2+y^2<1$, the same function has minimum zero but no maximum. Its values approach one near the missing boundary without attaining it. The supremum is one. Closedness matters in the existence theorem; bounded values do not imply an attained maximum.

### Reporting an optimization result

Give both the optimizing inputs and the function value, and distinguish local from global conclusions. If the problem asks for a maximum over a physical feasible set, points outside that set are irrelevant even if they solve the gradient equations. If no extremum is attained, explain the limiting behavior rather than presenting a boundary point that is not permitted.

In modeling, a mathematically optimal parameter can still be a poor description of reality. The objective and constraints encode what is being optimized. Squared error, absolute error, and a cost with additional constraints can select different answers. Multivariable calculus explains consequences of those choices; it does not choose the modeling assumptions for us. The next lessons will add integration over regions and explicit equality constraints before examining iterative optimization.`,
    ext,
    'global multivariable extremum',
    'A smallest or largest function value over the entire stated feasible set.',
    raw`For $x^2+y^2$ on a closed rectangle, compare interior, edge, and corner candidates.`,
    'An excluded boundary point can determine a supremum without attaining a maximum.',
  ),
];
for (const [a, b] of [
  [1, 2],
  [-1, 3],
  [2, -1],
  [3, 2],
  [-2, -3],
]) {
  sections[0].questions.push(
    q(
      raw`For $f=${a}x^3y+${b}xy^2$, find f_xy (first x, then y).`,
      raw`Differentiate $f_x=${3 * a}x^2y+${b}y^2$ in y to get $${3 * a}x^2+${2 * b}y$.`,
      expr(`${3 * a}*x^2+${2 * b}*y`),
    ),
    q(
      raw`For $f=${a}x^3y+${b}xy^2$, find f_yy.`,
      raw`The y partial is $${a}x^3+${2 * b}xy$; another y derivative is $${2 * b}x$.`,
      expr(`${2 * b}*x`),
    ),
  );
  sections[1].questions.push(
    q(
      raw`For $f=${a}x^2+2xy+${b}y^2$, give Hessian entries in row-major order.`,
      raw`The matrix rows are (${2 * a},2) and (2,${2 * b}).`,
      tuple([2 * a, 2, 2, 2 * b]),
    ),
    q(
      raw`For $f=${a}x^2+2xy+${b}y^2$, find the quadratic change at the origin for displacement (1/10,1/10).`,
      raw`The exact quadratic value is $(${a}+2+${b})/100$.`,
      exact(`${a + 2 + b}/100`),
    ),
  );
  const c = Math.abs(b);
  sections[2].questions.push(
    q(
      raw`Find the stationary point of $f=(x-${a})^2+${c}(y-${b})^2$ as an ordered pair.`,
      raw`Set both first partials to zero: (${a},${b}).`,
      tuple([a, b]),
    ),
    q(
      raw`For $f=x^2-${c}y^2$, classify the origin as minimum, maximum, or saddle.`,
      raw`The discriminant is negative, and coordinate directions give both signs: saddle.`,
      term('saddle', 'minimum'),
      'analyze',
    ),
  );
  sections[3].questions.push(
    q(
      raw`For $f=${Math.abs(a)}x^4+${c}y^4$, classify the origin as minimum, maximum, or saddle.`,
      raw`Both terms are nonnegative and vanish together only at the origin, so it is a minimum.`,
      term('minimum', 'saddle'),
      'analyze',
    ),
    q(
      raw`For $f=${Math.abs(a)}x^4-${c}y^4$, explain the classification of the origin without relying on its zero Hessian.`,
      raw`Along y=0 the value is positive off the origin, while along x=0 it is negative. Therefore it is a saddle.`,
    ),
  );
  const u = Math.abs(a) + 1,
    v = c + 1;
  sections[4].questions.push(
    q(
      raw`Find the maximum value of $x^2+y^2$ on $0\leq x\leq${u}$, $0\leq y\leq${v}$.`,
      raw`Both squares increase on the nonnegative intervals, so the corner (${u},${v}) gives ${u * u + v * v}.`,
      exact(u * u + v * v),
    ),
    q(
      raw`Does $x^2+y^2$ attain its supremum on the open disk $x^2+y^2<${u}$?`,
      raw`No: values approach ${u} but the boundary is excluded.`,
      truth(false),
      'interpret',
    ),
  );
}
sections[2].quickCheck = quick(
  'At a stationary point, D is negative. What does the second derivative test give?',
  ['Minimum', 'Maximum', 'Saddle'],
  2,
  'A negative discriminant means the quadratic form has directions of both signs.',
);
sections[3].quickCheck = quick(
  'If D=0, which conclusion follows?',
  ['No extremum exists', 'The test is inconclusive', 'There is a minimum'],
  1,
  'Further analysis of the actual function is needed.',
);
sections[0].review = [
  q('For $f=x^2y^3$, find f_xy.', 'It is $6xy^2$.', expr('6*x*y^2')),
  q('For $f=x^2y^3$, find f_xx.', 'It is $2y^3$.', expr('2*y^3')),
  q(
    'State a sufficient condition for equality of mixed partials.',
    'Continuity of the mixed second partials in a neighborhood suffices.',
  ),
];
sections[1].review = [
  q(
    'For $f=2x^2+3xy+4y^2$, give Hessian entries in row-major order.',
    'They are (4,3,3,8).',
    tuple([4, 3, 3, 8]),
  ),
  q(
    'For the diagonal Hessian H=diag(2,6), find one half of h transpose H h at h=(1,2).',
    'It is one half of (2+24)=13.',
    exact(13),
  ),
  q(
    'Does a zero Hessian at a point imply a constant function near it?',
    'No; x to the fourth plus y to the fourth is a counterexample.',
    truth(false),
    'interpret',
  ),
];
sections[2].review = [
  q('Find the stationary point of $(x+3)^2+2(y-4)^2$.', 'It is (-3,4).', tuple([-3, 4])),
  q(
    'For a twice continuously differentiable function with f_xx=-2,f_yy=-6,f_xy=0 at a stationary point, classify it as a minimum, maximum, or saddle.',
    'D=12 and the first pure partial is negative, so maximum.',
    term('maximum', 'minimum'),
    'analyze',
  ),
  q('For f_xx=2,f_yy=2,f_xy=3, compute D.', 'D=4-9=-5.', exact(-5)),
];
sections[3].review = [
  q(
    'Classify the origin for $x^4+y^4$: minimum, maximum, or saddle.',
    'A sum of fourth powers is nonnegative: minimum.',
    term('minimum', 'maximum'),
    'analyze',
  ),
  q(
    'Explain why the origin is a non-strict minimum for $x^2$.',
    'It is nonnegative everywhere, but every point on x=0 has equal value.',
  ),
  q(
    'Do positive pure second partials alone exclude a saddle?',
    'No; a sufficiently large mixed term can produce opposite-sign diagonal directions.',
    truth(false),
    'interpret',
  ),
];
sections[4].review = [
  q('Find the maximum of $x^2+y^2$ on [0,3] by [0,4].', 'The corner (3,4) gives25.', exact(25)),
  q('Find the minimum of $x^2+y^2$ on [0,3] by [0,4].', 'The origin gives zero.', exact(0)),
  q(
    'Explain why an open bounded domain need not have an attained maximum.',
    'A supremum may occur only as inputs approach an excluded boundary.',
  ),
];
sections[1].sources.push({
  id: 'calculus-mml-hessian',
  source: 'mml',
  locator: '§§5.7–5.8 pp.164–167, equations5.147–5.159 (PDF pp.170–173)',
  url: 'https://mml-book.github.io/book/mml-book.pdf#page=171',
  supports:
    'Hessian symmetry, curvature and the second-order Taylor term. We use the finite local approximation, without assuming every smooth function equals its infinite Taylor series.',
});
sections[2].sources.push(sections[1].sources.at(-1));
export default {
  number: 19,
  slug: 'calculus-multivariable-extrema',
  title: 'Higher Derivatives and Multivariable Extrema',
  intro:
    'A zero gradient leaves several possibilities: a valley, a peak, a saddle, or a flatter situation that requires more information. Second derivatives describe the first curvature beyond a tangent plane. We will connect those derivatives to matrices, then separate local classification from optimization over an entire feasible region.',
  sections,
};
