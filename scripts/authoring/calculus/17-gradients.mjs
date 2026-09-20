import {
  raw,
  source,
  section,
  q,
  exact,
  expr,
  tuple,
  truth,
  quick,
  frac,
} from './multivariable-helpers.mjs';
const linear = source('4.4', 'Tangent Planes and Linear Approximations'),
  grad = source('4.6', 'Directional Derivatives and the Gradient');
const sections = [
  section(
    'One approximation for every small displacement',
    raw`In one variable, differentiability means that a small change is described by a linear term plus an error that is small compared with the input change. In two variables the same idea must hold for every small displacement $(h,k)$. We require $f(a+h,b+k)=f(a,b)+Ah+Bk+E(h,k)$, where $E(h,k)/\sqrt{h^2+k^2}$ tends to zero. This is the definition of differentiability at $(a,b)$.

Setting $k=0$ identifies $A=f_x(a,b)$; setting $h=0$ identifies $B=f_y(a,b)$. Thus the partial derivatives determine the only possible linear approximation, but their existence does not prove that its error is sufficiently small along every path. Continuity of the first partials in a neighborhood is a useful sufficient condition.

For $f(x,y)=x^2+xy$ at $(1,2)$, expansion gives $f(1+h,2+k)=3+4h+k+h^2+hk$. The proposed linear change is $4h+k$ and the error is $h^2+hk$. Put $r=\sqrt{h^2+k^2}$. Because $|h|\leq r$ and $|k|\leq r$, the error has magnitude at most $2r^2$. Dividing by $r$ gives a bound $2r$ tending to zero. This checks the definition, not merely the coordinate directions.

Differentiability implies continuity: the linear change tends to zero and so does the remainder. A discontinuous function therefore cannot be differentiable. The converse is false. The function $\sqrt{x^2+y^2}$ is continuous at the origin but has a cone-like point there. Along the x axis its difference quotient is $|h|/h$, whose two-sided limit fails. Remember which implication a theorem actually supplies before using it to classify a function.`,
    linear,
    'multivariable differentiability',
    'A single linear approximation whose error is negligible relative to every small input displacement.',
    raw`For a quadratic, the remainder after linearization is of second order in the displacement.`,
    'Two existing partial derivatives identify a candidate linear approximation but do not validate its remainder.',
  ),
  section(
    'Tangent planes and differentials',
    raw`The linearization at $(a,b)$ is $L(x,y)=f(a,b)+f_x(a,b)(x-a)+f_y(a,b)(y-b)$. Its graph is a plane through $(a,b,f(a,b))$, with slopes matching the two coordinate derivatives. We call it the tangent plane when the function is differentiable. The variables in this formula are nearby input coordinates, not derivative evaluation points.

For $f(x,y)=x^2+xy$ at $(1,2)$, the plane is $L(x,y)=3+4(x-1)+(y-2)$. To estimate $f(1.02,1.97)$, use $h=0.02$ and $k=-0.03$, obtaining $3+0.08-0.03=3.05$. Direct evaluation gives $3.0498$, so the approximation error is $-0.0002$. The expansion in the preceding teaching section explains this difference: $h^2+hk=0.0004-0.0006$.

The total differential is the linear expression $df=f_x\,dx+f_y\,dy$. It describes the first-order output change for specified small input changes. The actual finite change is usually not exactly equal to the differential. A zero differential may mean that second-order terms decide the output change; it does not mean there is no change at all.

### Keeping units and uncertainty visible

For a rectangular area $A=lw$, a small measurement change gives $dA=w\,dl+l\,dw$. At lengths three and four meters, changes of 0.01 and -0.02 meters give an estimated area change $4(0.01)+3(-0.02)=-0.02$ square meters. The exact change also includes the product of the two measurement changes.

If only bounds on input errors are known, use absolute values: $|df|\leq|f_x||dx|+|f_y||dy|$. This is a conservative first-order bound, not a guarantee for arbitrarily large errors. Report the base point, input displacement, approximation, and what was neglected.`,
    linear,
    'total differential',
    'The first-order output change obtained by applying the derivative to an input displacement.',
    raw`For $A=lw$, the differential is $dA=w\,dl+l\,dw$.`,
    'A differential approximates a finite change; it need not equal it.',
  ),
  section(
    'The gradient collects partial derivatives',
    raw`The gradient of a scalar function is the vector of its first partial derivatives in the stated coordinate order. In two dimensions, $\nabla f=(f_x,f_y)$. At a point, these entries are numbers. Before evaluation, the gradient is a vector-valued function. This convention uses the usual Euclidean coordinates and the same component order as the input vector.

For $f(x,y)=x^2+3y^2$, the gradient is $(2x,6y)$. At $(1,-1)$ it is $(2,-6)$. The linear change for displacement $(h,k)$ is the dot product $(2,-6)\cdot(h,k)=2h-6k$. Thus the gradient packages all first-order directional information into one familiar linear-algebra object.

For $F(x,y,z)=xy+z^2$, the gradient has three components: $(y,x,2z)$. A common error is to return only the partial with respect to the variable that appears first, or to change the component order halfway through a calculation. Check the number of inputs against the number of gradient components before doing arithmetic.

### Coordinates have meaning

If coordinates have different physical units, gradient components have different reciprocal input units. A dot product with a compatible displacement still produces the correct output units. However, comparing directions using a Euclidean norm implicitly chooses a scale for the coordinates. Rescaling a parameter from meters to centimeters changes its numerical gradient component.

A zero gradient means that the first-order linear change vanishes in every direction. It does not decide whether the point is a minimum, maximum, or saddle, nor does it make a function constant nearby. Both $x^2+y^2$ and $x^2-y^2$ have zero gradients at the origin, with very different nearby behavior. Later we will use second derivatives and actual function values to resolve such cases.`,
    grad,
    'gradient',
    'The vector of first partial derivatives of a scalar function in input-coordinate order.',
    raw`For $f(x,y)=x^2+3y^2$, the gradient is $(2x,6y)$.`,
    'A zero gradient is a stationary-point condition, not a certificate of a minimum.',
  ),
  section(
    'Directional derivatives and unit directions',
    raw`A directional derivative measures output change per unit distance along a specified direction. With a unit vector $u$, define $D_uf(p)=\lim_{t\to0}(f(p+tu)-f(p))/t$. For a differentiable function, substituting the linear approximation gives $D_uf(p)=\nabla f(p)\cdot u$.

Suppose the gradient at a point is $(3,-4)$ and the requested direction is toward the vector $(4,3)$. Its length is five, so use $u=(4/5,3/5)$. The directional derivative is $3(4/5)-4(3/5)=0$. Using $(4,3)$ directly would describe change along a path with speed five rather than a unit-speed direction. In this zero example both happen to vanish; in general they differ by the speed factor.

For direction $(1,0)$, the directional derivative is the x partial. For the opposite direction, its sign reverses. A zero vector has no direction and cannot be normalized. An instruction giving two points usually means to subtract the starting point from the target, then normalize that displacement.

If the gradient is nonzero, Cauchy–Schwarz gives $\nabla f\cdot u\leq\|\nabla f\|$ for unit u. Equality occurs for $u=\nabla f/\|\nabla f\|$. This is the steepest ascent direction, and its rate is the gradient norm. The opposite direction produces the steepest descent rate, the negative of that norm.

These statements concern first-order local rates. A long straight step in the ascent direction can eventually go downhill, and a large descent step can increase the function. When the gradient is zero, all first-order directional derivatives vanish and there is no distinguished direction from this test.`,
    grad,
    'directional derivative',
    'The local rate of change per unit distance in a specified unit direction.',
    raw`For a differentiable function with gradient $(3,4)$, the greatest unit-direction rate is five.`,
    'Normalize a supplied direction vector unless the question explicitly asks for a parameterized path rate.',
  ),
  section(
    'Gradients and contour geometry',
    raw`Imagine moving along a smooth level curve on which the output is constant. The output change along its tangent direction must be zero. For a differentiable function, the gradient dot that tangent direction is therefore zero. At a regular point where the gradient is nonzero, the gradient is perpendicular to the level curve.

For $f(x,y)=x^2+2y^2$, the point $(2,1)$ lies on the level six and has gradient $(4,4)$. A tangent direction is $(1,-1)$ because their dot product vanishes. The tangent line in the input plane is $4(x-2)+4(y-1)=0$, or $x+y=3$. This line is not the tangent plane to the graph: it lies in the two-dimensional input plane and describes a level-curve direction.

Taking the straight displacement $(h,-h)$ from $(2,1)$ gives an actual change $3h^2$. Its first-order change is zero, but the straight line leaves the ellipse at second order. Moving exactly along the curved contour would keep the output constant. This example separates a tangent approximation from the curve itself.

### Using the geometry responsibly

For $f=x^2-y^2$, the zero level has two crossing lines at the origin and the gradient there is zero. The perpendicular-gradient rule does not identify one normal direction at that singular point. Its nonzero-gradient hypothesis matters. A contour drawing that hides the crossing cannot repair the failed hypothesis.

For a small change in measured inputs, compute a differential. For a unit direction, compute a normalized dot product. For the greatest local increase, normalize the gradient. For a constant-output direction, seek a vector perpendicular to it. These are related questions with different requested outputs. State whether the answer is a scalar rate, a vector direction, a line, or a plane, and check it by substitution or a dot product.`,
    grad,
    'regular level curve',
    'A smooth level curve near a point with nonzero gradient; its tangent directions are perpendicular to the gradient.',
    raw`At $(2,1)$ on $x^2+2y^2=6$, a tangent direction is $(1,-1)$.`,
    'The normal-direction conclusion needs a nonzero gradient.',
  ),
];
for (const [a, b] of [
  [1, 2],
  [-1, 1],
  [0, 2],
  [2, -1],
  [-2, -1],
]) {
  sections[0].questions.push(
    q(
      raw`For $f=x^2+xy$ at $(${a},${b})$, give the coefficient of the x displacement in its linearization.`,
      raw`The x partial is 2x+y, giving ${2 * a + b}.`,
      exact(2 * a + b),
    ),
    q(
      raw`For $f=x^2+xy$ at $(${a},${b})$, give the coefficient of the y displacement.`,
      raw`The y partial is x, giving ${a}.`,
      exact(a),
    ),
  );
  sections[1].questions.push(
    q(
      raw`Give the linearization of $f=x^2+xy$ at $(${a},${b})$ as a formula in x and y.`,
      raw`Use the base value ${a * a + a * b} and slopes ${2 * a + b}, ${a}.`,
      expr(raw`${a * a + a * b}+${2 * a + b}*(x-(${a}))+${a}*(y-(${b}))`),
    ),
    q(
      raw`For the area $A=lw$ at $(l,w)=(3,4)$, find dA when $dl=${a}/100$ and $dw=${b}/100$.`,
      raw`The differential is $4dl+3dw=${4 * a + 3 * b}/100$.`,
      exact(raw`${4 * a + 3 * b}/100`),
    ),
  );
  sections[2].questions.push(
    q(
      raw`Find the gradient of $f=x^2+3y^2$ at $(${a},${b})$ as an ordered pair.`,
      raw`Evaluate (2x,6y), obtaining (${2 * a},${6 * b}).`,
      tuple([2 * a, 6 * b]),
    ),
    q(
      raw`Find the gradient of $F=xy+z^2$ at $(${a},${b},2)$.`,
      raw`The gradient (y,x,2z) becomes (${b},${a},4).`,
      tuple([b, a, 4]),
    ),
  );
  sections[3].questions.push(
    q(
      raw`A scalar function is differentiable at a point with gradient $(${a},${b})$. Find the directional derivative for the unit direction $(3/5,4/5)$.`,
      raw`Take the dot product: $${3 * a + 4 * b}/5$.`,
      exact(raw`${3 * a + 4 * b}/5`),
    ),
    q(
      raw`A scalar function is differentiable at a point with gradient $(${a},${b})$. Find the greatest rate of increase over unit directions.`,
      raw`Cauchy–Schwarz gives the gradient length $\sqrt{${a * a + b * b}}$.`,
      exact(raw`sqrt(${a * a + b * b})`),
    ),
  );
  sections[4].questions.push(
    q(
      raw`At $(${a},${b})$, find a vector perpendicular to the gradient of $x^2+y^2$ by giving $(-y,x)$ at that point.`,
      raw`This vector is (${-b},${a}); its dot product with (2x,2y) is zero.`,
      tuple([-b, a]),
    ),
    q(
      raw`At $(${a},${b})$, write the tangent-line equation for the level curve of $x^2+y^2$ and justify it.`,
      raw`The point is nonzero. The normal is (${2 * a},${2 * b}), so the equation is $${2 * a}(x-(${a}))+${2 * b}(y-(${b}))=0$. Its direction is perpendicular to the gradient.`,
    ),
  );
}
sections[0].questions.push(
  q(
    'Explain why coordinate partials alone do not validate a tangent plane.',
    'They test only coordinate approaches; differentiability requires a remainder bound for every displacement.',
  ),
);
sections[3].questions.push(
  q(
    'Can the zero vector be used as a unit direction?',
    'No: its norm is zero, so normalization is undefined.',
    truth(false),
    'interpret',
  ),
);
sections[1].quickCheck = quick(
  'Is a total differential always the exact finite change?',
  ['Yes', 'No'],
  1,
  'It is the first-order change; higher-order terms may remain.',
);
sections[3].quickCheck = quick(
  'A direction is specified by $(6,8)$. Which vector gives a rate per unit distance?',
  ['$(6,8)$', '$(3/5,4/5)$', '$(8,6)$'],
  1,
  'Its length is ten, so divide both components by ten.',
);
sections[0].review = [
  q('For $f=x^2+2xy$ at (1,3), find the x linearization coefficient.', 'It is 2x+2y=8.', exact(8)),
  q(
    'For the same explicit formula $f=x^2+2xy$ at (1,3), find the y coefficient.',
    'It is 2x=2.',
    exact(2),
  ),
  q(
    'Explain why a second-order remainder bounded by $5r^2$ proves differentiability.',
    'After division by displacement length r, the bound 5r tends to zero.',
  ),
];
sections[1].review = [
  q('At (2,3), linearize $f=xy$.', 'The plane is $6+3(x-2)+2(y-3)$.', expr('6+3*(x-2)+2*(y-3)')),
  q(
    'For $A=lw$ at (2,5), find dA for dl=0.02 and dw=-0.01.',
    'It is 5(0.02)+2(-0.01)=0.08.',
    exact('2/25'),
  ),
  q(
    'Does zero differential guarantee zero finite change?',
    'No; higher-order terms may be nonzero.',
    truth(false),
    'interpret',
  ),
];
sections[2].review = [
  q('Evaluate the gradient of $x^2+4y^2$ at (3,-1).', 'It is (6,-8).', tuple([6, -8])),
  q(
    'How many components does the gradient of a scalar function of four inputs have?',
    'One per input: four.',
    exact(4),
  ),
  q(
    'Explain why a gradient vector depends on coordinate units.',
    'Each component measures output change per unit of its corresponding input; rescaling an input changes that numerical rate.',
  ),
];
sections[3].review = [
  q(
    'For a differentiable scalar function with gradient (6,8), give the greatest unit-direction rate.',
    'The norm is ten.',
    exact(10),
  ),
  q(
    'For a differentiable scalar function with gradient (6,8), give the rate in direction (-1,0).',
    'The dot product is -6.',
    exact(-6),
  ),
  q(
    'For a differentiable scalar function with gradient (6,8), give the unit ascent direction.',
    'Divide by ten: (3/5,4/5).',
    {
      validator: 'tuple',
      params: { expected: ['3/5', '4/5'] },
      correct: '(3/5,4/5)',
      incorrect: '(6,8)',
    },
  ),
];
sections[4].review = [
  q(
    'At (1,2), is (2,-1) tangent to the level of $x^2+y^2$?',
    'Yes: (2,4) dot (2,-1) is zero.',
    truth(true),
    'interpret',
  ),
  q(
    'Explain why the zero gradient at a crossing level set does not specify a normal direction.',
    'The gradient has no direction there and the regular-point hypothesis fails.',
  ),
  q(
    'For a differentiable scalar function with gradient (2,-3) and displacement (3,2), find the linear change.',
    'The dot product is zero.',
    exact(0),
  ),
];
// Recall the object before asking for longer gradient calculations.
sections[2].review.push(
  q(
    raw`True or false: for scalar $f(x,y)$, its gradient is the vector $(f_x,f_y)$ in input-coordinate order.`,
    'True. The gradient collects first partial derivatives in the same order as the inputs.',
    truth(true),
    'recall',
  ),
  q(
    raw`True or false: $f_x+f_y$ is the gradient of scalar $f(x,y)$.`,
    'False. That sum is a scalar; the gradient retains the two components as a vector.',
    truth(false),
    'recall',
  ),
);
export default {
  number: 17,
  slug: 'calculus-gradients',
  title: 'Linearization, Gradients, and Directional Derivatives',
  intro:
    'Partial derivatives describe coordinate slices. We now ask whether those rates combine into a reliable prediction for any small input displacement. The answer connects differentiability to tangent planes and connects the gradient to dot products. Keep the geometric objects distinct: the graph lives above the input plane, while directions and contour curves live in the input plane itself.',
  sections,
};
