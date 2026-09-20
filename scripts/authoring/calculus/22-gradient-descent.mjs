import {
  raw,
  section,
  q,
  exact,
  expr,
  tuple,
  truth,
  term,
  quick,
  frac,
} from './multivariable-helpers.mjs';
const descent = {
  id: 'mml-calculus-gradient-descent',
  source: 'mml',
  locator:
    '§7.1 Optimization Using Gradient Descent, equations 7.5–7.10 and §7.1.1 Step-size, printed pp. 228–230',
  url: 'https://mml-book.github.io/book/mml-book.pdf#page=234',
  supports:
    'Negative-gradient updates, step-size effects, quadratic examples, and the squared-error gradient supporting the original worked calculations.',
};
const convex = {
  id: 'mml-calculus-convexity',
  source: 'mml',
  locator: '§7.3 Convex Optimization, Definitions 7.2–7.3 and equation 7.31, printed pp. 236–237',
  url: 'https://mml-book.github.io/book/mml-book.pdf#page=242',
  supports:
    'Convex sets/functions, the first-order supporting inequality, and positive-semidefinite Hessians supporting original conclusions about global minima.',
};
const sections = [
  section(
    'Take a step using the current gradient',
    raw`Many objectives are easy to evaluate and differentiate but difficult to minimize by solving all stationary equations explicitly. Gradient descent constructs a sequence of candidate inputs. Starting at a chosen vector $\theta_0$, repeat $\theta_{k+1}=\theta_k-\alpha\nabla L(\theta_k)$, where L is the objective and the positive number alpha is the step size, also called a learning rate. The subscript k counts updates; it is not a derivative order.

We use column vectors for both parameters and gradients. This agrees with our earlier linear algebra notation. The reference text sometimes uses row gradients and writes a transpose in the update; the mathematical direction is the same. The minus sign moves against the gradient, which points toward steepest first-order increase under the Euclidean length convention.

The linear approximation explains the idea. For a small displacement h, $L(\theta+h)\approx L(\theta)+\nabla L(\theta)^Th$. Setting $h=-\alpha\nabla L(\theta)$ predicts change $-\alpha\|\nabla L(\theta)\|^2$. At a nonstationary point this is negative. For sufficiently small positive steps, differentiability makes the decrease real, but a large finite step can leave the region where that first-order prediction is reliable.

Take $L(x,y)=(x-1)^2+2(y+1)^2$ at (3,1). The gradient is (4,8) and the initial loss is twelve. With alpha=1/4, the new point is $(3,1)-(1,2)=(2,-1)$, whose loss is one. The step substantially improves the objective without yet reaching the minimum at (1,-1).

Compute every component of the gradient at the same old point, then update all coordinates together. Updating x and using the new x to calculate the y gradient is a different algorithm. Also distinguish the gradient from the update displacement: one is a rate vector, the other includes the negative sign and step size. Recording the point, gradient, displacement, and resulting objective separately makes a calculation easy to check.`,
    descent,
    'gradient descent',
    'An iterative method that subtracts a positive multiple of the current objective gradient from the parameter vector.',
    raw`At gradient (4,8) with step size 1/4, the update displacement is (-1,-2).`,
    'Use the same old parameter vector for every gradient component in one update.',
  ),
  section(
    'Understand step sizes through an exact recurrence',
    raw`A quadratic lets us study step size without approximation. Let $L(x)=\frac a2(x-b)^2$ with a positive. Its derivative is a(x-b). Writing the error as $e_k=x_k-b$, the update gives $e_{k+1}=(1-\alpha a)e_k$. Repeating yields $e_k=(1-\alpha a)^ke_0$. Convergence from every starting point therefore requires $|1-\alpha a|<1$, equivalently $0<\alpha<2/a$.

This condition separates several behaviors. If $0<\alpha<1/a$, the error shrinks without changing sign. If alpha=1/a, one step reaches b exactly for this quadratic. If $1/a<\alpha<2/a$, the error changes sign while its magnitude shrinks: the iterates overshoot but still converge. At alpha=2/a, a nonzero error alternates forever with unchanged magnitude. Larger positive steps make its magnitude grow.

For a=4, b=0, and x zero-subscript=2, choosing alpha=1/8 multiplies the error by 1/2, giving 2,1,1/2,1/4. Choosing alpha=3/8 multiplies it by -1/2, giving 2,-1,1/2,-1/4. Both sequences converge to zero. With alpha=1/2, the sequence 2,-2,2,-2 does not converge. The existence of a clear minimum does not make every step size successful.

In several dimensions, different directions can have different curvature. For $L=x^2+10y^2$, the update factors are $1-2\alpha$ and $1-20\alpha$. Convergence from every point requires both magnitudes below one, so $0<\alpha<1/10$. The steeper y direction sets the tighter restriction. At a safe small rate, progress in the flatter x direction can be slow.

The recurrence also predicts objective error: since the loss is proportional to the squared error, each step multiplies that loss by $(1-\alpha a)^2$. Opposite signs in successive parameter errors therefore do not imply alternating increases and decreases in loss.

These formulas are exact for the stated quadratics, not universal learning-rate prescriptions. For a general objective, inspect actual objective values and gradients. A local gradient points downhill infinitesimally; curvature and scale determine how far a finite step can travel while still improving the objective.`,
    descent,
    'gradient descent step size',
    'The positive scalar controlling how far an update moves along the negative gradient.',
    raw`For $L=2x^2$, every-start convergence requires $0<\alpha<1/2$.`,
    'Overshooting can still converge; the error magnitude, not only its sign, determines this quadratic behavior.',
  ),
  section(
    'Use convexity to interpret stationary points',
    raw`A set is convex if the line segment joining any two of its points stays inside the set. A function on a convex domain is convex if its value along that segment never exceeds the corresponding linear interpolation of endpoint values. In symbols, for $0\leq t\leq 1$, $L((1-t)u+tv)\leq(1-t)L(u)+tL(v)$. Graphically, a chord lies on or above the graph.

For a differentiable convex function, every tangent plane is a global lower bound: $L(v)\geq L(u)+\nabla L(u)^T(v-u)$. If the gradient vanishes at u, this inequality gives L(v)>=L(u) for every feasible v in the convex domain. Thus an unconstrained stationary point is a global minimum. This conclusion uses convexity across the domain, not merely favorable curvature at one point.

For a twice continuously differentiable function on an open convex domain, a positive-semidefinite Hessian everywhere is an equivalent convexity criterion. Positive semidefinite means $h^THh\geq 0$ for every direction h. For $L=x^2+2y^2$, the Hessian has diagonal entries two and four, so all nonzero directions have positive curvature. The origin is the unique global minimum.

Convexity alone does not imply uniqueness. The function $L=(x+y)^2$ is convex, but every point with x+y=0 minimizes it. Its Hessian has a zero-curvature direction along that line. Strict convexity rules out two different minimizers when a minimum exists. Nor does convexity guarantee existence on an unbounded domain: exp(x) is strictly convex on the real line, yet it approaches its infimum zero only as x tends to negative infinity.

Do not conflate these conclusions with convergence of a chosen algorithm. A convex quadratic can still produce divergent gradient-descent iterates when its step size is too large. Convexity tells us what a stationary point means and what global geometry is available; the update rule and step size determine whether the numerical sequence reaches an appropriate point.`,
    convex,
    'convex function',
    'A function on a convex domain whose value on each segment is at most the corresponding interpolation of endpoint values.',
    raw`The function x squared is convex because its graph lies below every chord.`,
    'Convexity does not by itself guarantee a unique minimizer or convergence for every step size.',
  ),
  section(
    'Recognize nonconvex behavior and stopping limits',
    raw`Outside convex settings, a small or zero gradient has a weaker interpretation. Consider $L(x,y)=(x^2-1)^2+y^2$. Its gradient is $(4x(x^2-1),2y)$. Both(1,0) and(-1,0) give loss zero and are global minima because the formula is a sum of squares. The origin also has zero gradient, but its loss is one.

The origin is a saddle: moving a small distance along x decreases the first squared term, while moving along y increases the second. Its Hessian has diagonal entries -4 and 2. Gradient descent started exactly at the origin makes a zero update and remains there. A test that stops only because the gradient is zero would correctly identify a stationary point but would mislabel it if it claimed a minimum.

Initialization can therefore matter. Starting on different sides of a nonconvex objective can lead toward different basins, and a large step can move between regions or increase the loss. Even if several runs return similar objective values, that observation is not a proof of global optimality. To make a global claim, one needs a mathematical bound, a complete analysis, or additional structure such as convexity.

Practical stopping decisions also need interpretation. A small gradient norm suggests small first-order change at the current scale. A small change in loss can result from a small step size rather than closeness to a minimum. A small parameter displacement can have the same cause. A maximum iteration count limits work but does not certify convergence. Report the condition that ended the iteration and the actual objective value.

For a hand calculation, state the starting point and step size, compute the requested number of updates, and check each resulting loss. If the sequence oscillates, determine whether the error magnitude shrinks. If it becomes stationary, classify that point using the tools already developed. The objective is to understand what the evidence establishes, rather than attach a success label to every run that stops.`,
    descent,
    'stationary optimization iterate',
    'An iterate where the objective gradient is zero and an ordinary gradient-descent update therefore makes no movement.',
    raw`The origin is stationary for $(x^2-1)^2+y^2$ but is a saddle.`,
    'A zero update or small gradient is not a general proof of a minimum.',
  ),
  section(
    'Connect the gradient to least-squares fitting',
    raw`Suppose a model predicts the vector $A\theta$ and the observed targets form b. Define $L(\theta)=\tfrac 12\|A\theta-b\|^2$, half the sum of squared residuals. A residual is a predicted value minus its target. The factor one half cancels the two introduced when differentiating a square. With our column-gradient convention, $\nabla L(\theta)=A^T(A\theta-b)$.

To see why, the jth partial is the sum over data rows of residual i times $A_{ij}$. The derivative of residual i with respect to parameter j is exactly that matrix entry. Collecting these partials produces the matrix transpose times the residual vector. If A has m rows and n columns, b has m entries, theta has n, and the gradient also has n entries.

Fit a line with parameters theta=(intercept,slope). Let A have rows (1,0),(1,1),(1,2), and let b=(1,2,2). At theta=(0,0), the residuals are (-1,-2,-2), so the gradient is (-5,-6). With alpha=1/10, the next point is (1/2,3/5). Its predictions are 1/2,11/10,17/10 and its residuals are -1/2,-9/10,-3/10. The new loss is $\tfrac 12(1/4+81/100+9/100)=23/40$, down from 9/2.

Setting the gradient to zero gives the normal equations $A^TA\theta=A^Tb$, connecting calculus to the earlier projection and least-squares lessons. Here they are $3\theta_1+3\theta_2=5$ and $3\theta_1+5\theta_2=6$, giving intercept 7/6 and slope 1/2. The minimum loss is 1/12. Gradient descent approaches a solution through updates; solving the equations characterizes it directly.

The Hessian is $A^TA$, which is positive semidefinite because $h^TA^TAh=\|Ah\|^2$. Thus the loss is convex. Full column rank gives a unique parameter minimizer; dependent columns can leave many equivalent parameter vectors. Finally, minimizing training squared error is a statement about this objective and these data. It does not alone establish accurate predictions on future observations.`,
    descent,
    'least-squares gradient',
    'For half the squared residual norm, the gradient is the design matrix transpose times the residual vector.',
    raw`For $L=\tfrac 12\|A\theta-b\|^2$, use $A^T(A\theta-b)$.`,
    'Check the loss normalization: omitting the one-half factor doubles the gradient.',
  ),
];
sections[4].sources.push(convex);
sections[3].sources.push({
  id: 'os3-4-7',
  source: 'openstax-calculus-3',
  locator: '§4.7 Maxima/Minima Problems',
  url: 'https://openstax.org/books/calculus-volume-3/pages/4-7-maxima-minima-problems',
  supports:
    'Stationary-point and saddle classification using the second derivative test, supporting the original nonconvex example.',
});
sections[0].questions = [
  q(
    'At point (3,1), gradient (4,8), and step size 1/4, give the next point.',
    'Subtract (1,2) from (3,1), obtaining(2,-1).',
    tuple([2, -1]),
  ),
  q(
    'At point (1,-2), gradient (-3,4), and step size 1/2, give the next point.',
    'The displacement is (3/2,-2), so the next point is (5/2,-4).',
    tuple(['5/2', -4]),
  ),
  q(
    'For $L=x^2+y^2$, start at (2,-1) with alpha=1/4. Give one update.',
    'The gradient is (4,-2). Subtract (1,-1/2), giving(1,-1/2).',
    tuple([1, '-1/2']),
  ),
  q(
    'For $L=(x-2)^2$, start at x=5 with alpha=1/6. Find the next x.',
    'The derivative at 5 is 6; subtract (1/6)6=1 to obtain 4.',
    exact(4),
  ),
  q(
    'For $L=x^2+3y^2$, compute the gradient at (1,2).',
    'The gradient is (2x,6y), hence(2,12).',
    tuple([2, 12]),
  ),
  q(
    'For gradient (3,4) and alpha=1/10, find the first-order predicted change in loss.',
    'It is-alpha times the squared gradient norm:-(1/10)(9+16)=-5/2.',
    exact('-5/2'),
  ),
  q(
    'For $L=x^2+y^2$, what is the loss at the updated point (1,-1/2)?',
    'Substitute to obtain 1+1/4=5/4.',
    exact('5/4'),
  ),
  q(
    'Do all components of an ordinary simultaneous gradient update use the same old parameter vector?',
    'Yes. The gradient is evaluated once at the current vector before applying the update.',
    truth(true),
    'interpret',
  ),
  q(
    'Explain why a negative first-order predicted change does not guarantee improvement for a large finite step.',
    'The linear approximation is local. Curvature can make a large step leave the decreasing neighborhood and land at a larger objective value.',
  ),
  q(
    'Distinguish the gradient from the update displacement.',
    'The gradient is the vector of partial derivatives. The displacement is its negative multiplied by the step size, so it includes both direction reversal and scale.',
  ),
];
sections[1].questions = [
  q(
    'For $L=2x^2$ with alpha=1/8, give the error multiplier.',
    'Here a=4, so 1-alpha a=1-1/2=1/2.',
    exact('1/2'),
  ),
  q(
    'For that update starting at x=2, find x after three steps.',
    'Multiply 2 by (1/2) cubed to obtain 1/4.',
    exact('1/4'),
  ),
  q(
    'For $L=2x^2$ with alpha=3/8, give the error multiplier.',
    'The factor is 1-4 times 3/8=-1/2.',
    exact('-1/2'),
  ),
  q(
    'For that update starting at x=2, find x after three steps.',
    'Multiply 2 by (-1/2) cubed to obtain -1/4.',
    exact('-1/4'),
  ),
  q(
    'For $L=2x^2$ with alpha=1/2 and a nonzero start, does the sequence converge?',
    'No. The factor is -1, so it alternates without shrinking.',
    truth(false),
    'interpret',
  ),
  q(
    'For $L=(3/2)(x-4)^2$, what positive alpha reaches 4 in one step from every x?',
    'The curvature parameter a is 3; alpha=1/a=1/3.',
    exact('1/3'),
  ),
  q(
    'For $L=x^2+10y^2$, give the upper endpoint of the open step-size interval guaranteeing convergence from every start.',
    'The y factor needs alpha<2/20=1/10, tighter than the x condition.',
    exact('1/10'),
  ),
  q(
    'For $L=2x^2$ with alpha=3/4, give the error multiplier.',
    'It is 1-4 times 3/4=-2, whose magnitude exceeds 1.',
    exact(-2),
  ),
  q(
    'Explain why overshooting does not necessarily mean divergence.',
    'When the multiplier is negative with magnitude less than 1, errors alternate sides but shrink, so the iterates still converge.',
  ),
  q(
    'Why does the steeper direction restrict a shared step size on an anisotropic quadratic?',
    'Every directional error factor must have magnitude below 1. Larger curvature reaches the unstable threshold at a smaller step size.',
  ),
];
sections[2].questions = [
  q(
    'Is the unit disk a convex set?',
    'Yes. Every segment between two points in the disk stays in the disk.',
    truth(true),
    'interpret',
  ),
  q(
    'Is the unit circle, with only its boundary points, a convex set?',
    'No. A segment joining opposite points passes through the interior, which is not in that boundary set.',
    truth(false),
    'interpret',
  ),
  q(
    'Find the Hessian diagonal entries of $L=2x^2+5y^2$ as a pair.',
    'The second partials are 4 and 10, giving(4,10).',
    tuple([4, 10]),
  ),
  q(
    'For $L=(x+y)^2$, is the minimizer unique?',
    'No. Every point on x+y=0 has zero loss.',
    truth(false),
    'interpret',
  ),
  q(
    'For $L=x^2+2y^2$, give the minimizing point.',
    'The gradient equations 2x=0 and 4y=0 give(0,0), and positive definiteness makes it unique.',
    tuple([0, 0]),
  ),
  q(
    'For $L=x^2$, compare the value at the midpoint of 0 and 2 with the average endpoint value. Give the two values as a pair.',
    'The midpoint value is 1; the endpoint average is (0+4)/2=2, giving(1,2).',
    tuple([1, 2]),
  ),
  q(
    'Does exp(x) attain its infimum on the real line?',
    'No. It is always positive and approaches 0 only as x tends to negative infinity.',
    truth(false),
    'interpret',
  ),
  q(
    'Does positive-semidefinite curvature at a single point prove convexity on the whole domain?',
    'No. The relevant Hessian condition must hold throughout an appropriate convex domain.',
    truth(false),
    'interpret',
  ),
  q(
    'Use the supporting-plane inequality to explain why a stationary point of a differentiable convex function is a global minimum.',
    'When the gradient is zero, the inequality becomes L(v)>=L(u) for every domain point v. Thus no point has a smaller value.',
  ),
  q(
    'Explain why convexity does not excuse a badly chosen step size.',
    'Convexity describes the objective geometry, while a finite update can overshoot. Even a convex quadratic diverges when the error multiplier has magnitude above 1.',
  ),
];
sections[3].questions = [
  q(
    'For $L=(x^2-1)^2+y^2$, compute its gradient at the origin.',
    'The gradient is (4x(x squared -1),2y); both components vanish at the origin.',
    tuple([0, 0]),
  ),
  q(
    'For that loss, find the value at the origin.',
    'Substitution gives (-1) squared+0=1.',
    exact(1),
  ),
  q('For that loss, find the value at (1,0).', 'Both squared terms vanish, giving 0.', exact(0)),
  q(
    'For that loss, classify the origin as minimum, maximum, or saddle.',
    'The Hessian has one negative and one positive direction, so it is a saddle.',
    term('saddle', 'minimum'),
    'analyze',
  ),
  q(
    'Starting that loss at the origin, what next point does ordinary gradient descent produce for any positive step size?',
    'The gradient is zero, so the point remains(0,0).',
    tuple([0, 0]),
  ),
  q(
    'For that loss, compute the gradient at (2,1).',
    'The components are 4 times 2 times (4-1)=24 and 2, giving(24,2).',
    tuple([24, 2]),
  ),
  q(
    'For that loss, start at (2,1) with alpha=1/16. Give the next point.',
    'Subtract (24/16,2/16)=(3/2,1/8), giving(1/2,7/8).',
    tuple(['1/2', '7/8']),
  ),
  q(
    'Does a very small parameter change always prove that the current point is near a minimum?',
    'No. A tiny step size can make movement small even with a substantial gradient.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain why repeated runs reaching similar losses do not alone prove global optimality.',
    'The runs inspect only particular trajectories and can repeatedly enter the same local region. A global claim requires a bound or structural argument covering all feasible points.',
  ),
  q(
    'An iteration stops at its preset step limit. What conclusion is justified?',
    'Only that the allotted number of updates was used. Report the current point and loss; the stopping event itself does not establish convergence or optimality.',
  ),
];
sections[4].questions = [
  q(
    'A has rows (1,0),(1,1),(1,2), b=(1,2,2), and theta=(0,0). Give the residual vector A theta-b.',
    'All predictions are 0, so subtracting the targets gives (-1,-2,-2).',
    tuple([-1, -2, -2]),
  ),
  q(
    'For those data and theta=(0,0), give the gradient of half the squared residual norm.',
    'The intercept component sums residuals to -5; the slope component is 0(-1)+1(-2)+2(-2)=-6. The gradient is (-5,-6).',
    tuple([-5, -6]),
  ),
  q(
    'For those data, start at theta=(0,0) with alpha=1/10. Give the next theta.',
    'Subtract one tenth of(-5,-6), obtaining(1/2,3/5).',
    tuple(['1/2', '3/5']),
  ),
  q(
    'For those data, find the initial half-squared loss at theta=(0,0).',
    'The squared residuals sum to 1+4+4=9; half is 9/2.',
    exact('9/2'),
  ),
  q(
    'For those data, find the half-squared loss at theta=(1/2,3/5).',
    'Residuals are -1/2,-9/10,-3/10. Half their squared sum is 23/40.',
    exact('23/40'),
  ),
  q(
    'For those data, give A transpose b as a pair.',
    'The intercept sum is 1+2+2=5; the slope weighted sum is 0+2+4=6. Thus(5,6).',
    tuple([5, 6]),
  ),
  q(
    'Solve 3a+3b=5 and 3a+5b=6 for the intercept a and slope b.',
    'Subtracting equations gives 2b=1, so b=1/2. The first equation then gives a=7/6.',
    tuple(['7/6', '1/2']),
  ),
  q(
    'For those data, find the minimum half-squared loss at theta=(7/6,1/2).',
    'Predictions are 7/6,5/3,13/6; residuals are 1/6,-1/3,1/6. Half their squared sum is 1/12.',
    exact('1/12'),
  ),
  q(
    'Explain why A transpose A is positive semidefinite.',
    'For every vector h, the quadratic form h transpose A transpose A h is the squared norm of A h, which cannot be negative.',
  ),
  q(
    'Why does minimizing the training squared error not by itself establish accurate future predictions?',
    'It optimizes agreement with the supplied observations under the chosen model. Future behavior also depends on model suitability and how the observed data relate to new cases.',
  ),
];
sections[0].quickCheck = quick(
  'Which direction is used in gradient descent?',
  ['The gradient', 'The negative gradient', 'A fixed coordinate direction'],
  1,
  'The negative gradient gives steepest first-order decrease under the Euclidean convention.',
);
sections[3].quickCheck = quick(
  'A nonconvex objective has zero gradient at an iterate. What is certain?',
  ['It is a global minimum', 'The ordinary update is zero', 'The loss is zero'],
  1,
  'Stationarity gives no movement, but the point can be a saddle or another nonminimum.',
);
sections[0].review = [
  q(
    'At(4,2), gradient (6,-2), and alpha=1/2, find the next point.',
    'Subtract (3,-1) to obtain (1,3).',
    tuple([1, 3]),
  ),
  q(
    'For gradient (1,2) and alpha=1/5, find the linearized loss change.',
    'It is-(1/5)(1+4)=-1.',
    exact(-1),
  ),
  q(
    'Why must both partial derivatives be evaluated before a simultaneous update?',
    'Using a partially updated vector changes the algorithm; ordinary gradient descent uses one gradient at the old vector.',
  ),
];
sections[1].review = [
  q(
    'For $L=3x^2$, give the open upper step-size threshold for convergence from every start.',
    'Here a=6, so the threshold 2/a is 1/3.',
    exact('1/3'),
  ),
  q('For $L=3x^2$ and alpha=1/4, find the error multiplier.', 'It is 1-6/4=-1/2.', exact('-1/2')),
  q(
    'Starting at x=4 with that multiplier, find x after two steps.',
    'The error is 4 times (-1/2) squared=1.',
    exact(1),
  ),
];
sections[2].review = [
  q(
    'Does differentiable convexity make every stationary point a global minimum?',
    'Yes, by the supporting-plane inequality.',
    truth(true),
    'interpret',
  ),
  q(
    'Does convexity alone make the minimizer unique?',
    'No. For example,(x+y) squared has a line of minimizers.',
    truth(false),
    'interpret',
  ),
  q(
    'For $L=3x^2+4y^2$, give the Hessian diagonal entries.',
    'The entries are 6 and 8.',
    tuple([6, 8]),
  ),
];
sections[3].review = [
  q(
    'For $(x^2-1)^2+y^2$, find the loss at (-1,0).',
    'Both squared terms vanish, giving 0.',
    exact(0),
  ),
  q(
    'For that function, does starting at the stationary origin reach a minimum under the ordinary update?',
    'No. Every update is zero and the saddle is retained.',
    truth(false),
    'interpret',
  ),
  q(
    'Why should a small loss change be interpreted together with the step size and gradient?',
    'A very small step can make the loss change tiny even when the gradient is large and the point is far from stationary.',
  ),
];
sections[4].review = [
  q(
    'For A=(1,2) transpose, scalar theta=0, and targets (1,1), find the gradient of half the squared error.',
    'The residuals are (-1,-1); multiplying by A transpose gives -1-2=-3.',
    exact(-3),
  ),
  q(
    'For that scalar model, take alpha=1/5 from theta=0. Find the next theta.',
    'Subtract (1/5)(-3), giving 3/5.',
    exact('3/5'),
  ),
  q(
    'For that model, find the half-squared loss at theta=3/5.',
    'Predictions are 3/5 and 6/5; residuals -2/5 and 1/5 give half of 5/25=1/10.',
    exact('1/10'),
  ),
];
export default {
  number: 22,
  slug: 'calculus-gradient-descent',
  title: 'Gradient Descent and Model Fitting',
  intro:
    'Calculus can guide an iterative search when an exact optimizer is difficult to obtain. We will compute gradient updates, analyze their behavior on quadratics, distinguish convex guarantees from nonconvex limitations, and reconnect the resulting algorithm with linear least squares. Each conclusion will identify the assumptions and evidence that support it.',
  sections,
};
