import {
  raw,
  source,
  section,
  q,
  exact,
  expr,
  calc,
  truth,
  quick,
} from './multivariable-helpers.mjs';
const s1 = source('4.1', 'Functions of Several Variables'),
  s2 = source('4.2', 'Limits and Continuity'),
  s3 = source('4.3', 'Partial Derivatives');
const sections = [
  section(
    'Several inputs, one output',
    raw`A function of several variables follows the same basic rule as a function of one variable: every permitted input has exactly one output. The input is now an ordered tuple. In $f(x,y)=x^2+3y$, the order matters: $f(1,2)=7$, whereas $f(2,1)=7$ happens to agree for this particular pair. That coincidence does not establish symmetry. For example, $f(0,1)=3$ and $f(1,0)=1$ differ.

The domain describes permitted input tuples. A polynomial accepts every real pair. In $g(x,y)=\sqrt{16-x^2-y^2}$, the square root requires $x^2+y^2\leq16$: a disk including its boundary. Its output is a height, ranging from zero to four. In $h(x,y)=\ln(y-x^2)$, the condition is instead $y>x^2$, strictly above a parabola. A denominator must be nonzero, even if a later simplification cancels a factor.

These conditions describe the mathematical formula. An application may impose additional restrictions. If $x$ and $y$ count manufactured objects, negative or fractional values may be infeasible even though a polynomial accepts them. Always distinguish the formula's domain from the model's feasible inputs. It is the modeler who chooses what the variables mean.

### Reading a multivariable model

Suppose $C(a,b)=8+2a+5b+ab$ models cost in dollars for two nonnegative production quantities. The constant eight represents a fixed cost. The two linear terms describe separate contributions, and $ab$ describes an interaction. At $(a,b)=(2,3)$ the cost is $8+4+15+6=33$. Increasing both inputs cannot be analyzed by looking at only one coefficient because the interaction changes too. The algebra itself does not prove that this cost model is realistic.

The graph of a two-input scalar function consists of points $(x,y,f(x,y))$ in three-dimensional space. For three or more inputs we usually work with formulas, tables, slices, and level sets rather than trying to draw every coordinate. Losing a convenient picture does not change the definition of a function.`,
    s1,
    'multivariable domain',
    'The permitted ordered input tuples of a function of several variables.',
    raw`For $\sqrt{1-x^2-y^2}$ the domain is the closed unit disk.`,
    'The domain is a set of input pairs, not a set of output heights.',
  ),
  section(
    'Slices and level curves',
    raw`A slice fixes an input and lets the others vary. For $f(x,y)=x^2+2y^2$, fixing $y=1$ gives the one-variable function $x^2+2$. Fixing $x=1$ instead gives $1+2y^2$. These are vertical cross-sections of the same surface; their curvatures differ because the two coordinates enter with different weights.

A level curve fixes the output instead. The equation $f(x,y)=c$ describes all input pairs with the same function value. For this example, $x^2+2y^2=c$ is an ellipse when $c>0$, the single point $(0,0)$ when $c=0$, and empty when $c<0$. The level curve lies in the input plane. A contour map attaches height labels to these planar curves, allowing us to read a three-dimensional surface from a two-dimensional picture.

Do not confuse an empty level set with an undefined function. Our polynomial is defined everywhere, but it never has a negative output. Nor does every level set need to be a smooth curve: a point, crossing lines, or several disconnected pieces may occur. For $x^2-y^2=0$, the level set is the union of the lines $y=x$ and $y=-x$.

### Comparing representations

For the plane $T(x,y)=2x-y$, level sets satisfy $y=2x-c$. Increasing the label $c$ shifts these parallel lines. Along a fixed horizontal slice, the output rises by two per unit increase in $x$; along a vertical slice it falls by one per unit increase in $y$. Those statements are already directional information, but we have not yet defined a derivative in an arbitrary direction.

Closely spaced contours with equally spaced output labels indicate faster change across them, provided the coordinate scales are comparable. Distorted axes can make a visual slope misleading. A contour picture also omits behavior between the drawn levels, so it should support a calculation rather than replace one. In practice, identify what is fixed: an input for a slice, an output for a level set.`,
    s1,
    'level curve',
    'The set of input pairs giving one specified output value.',
    raw`The level $c=4$ of $x^2+y^2$ is a circle of radius two.`,
    'Fixing an input produces a slice; fixing the output produces a level set.',
  ),
  section(
    'Limits require every approach',
    raw`The statement that $f(x,y)$ approaches $L$ near $(a,b)$ means that all domain points sufficiently close to $(a,b)$ have outputs close to $L$. Closeness in the plane is measured by distance $\sqrt{(x-a)^2+(y-b)^2}$. A route to the point may be a straight line, a parabola, or something more complicated. A limit must be independent of the route.

To disprove a limit, two different approach values suffice. For $f(x,y)=xy/(x^2+y^2)$ away from the origin, the horizontal path $y=0$ gives zero. The diagonal $y=x$ gives one half whenever $x\ne0$. Consequently the limit at the origin does not exist, and assigning any value at the origin cannot make this function continuous there.

Agreement along several routes does not prove a limit. Consider $g(x,y)=x^2y/(x^4+y^2)$. Both coordinate axes give zero. However, along $y=x^2$ the value is one half. Checking only the most convenient slices would miss this approach entirely. Even agreement along every straight line can miss curved approaches.

### A bound that works for all paths

For $p(x,y)=x^2y/(x^2+y^2)$ away from the origin, the inequality $x^2/(x^2+y^2)\leq1$ implies $|p(x,y)|\leq|y|$. Also $|y|\leq\sqrt{x^2+y^2}$. The right side tends to zero as the input pair approaches the origin, so the squeeze argument proves the limit is zero for every path. Defining $p(0,0)=0$ makes the function continuous there.

Polynomials are continuous everywhere; quotients of continuous functions are continuous wherever the denominator is nonzero. Composition preserves continuity when the inner output lies in the outer function's domain. These rules often make substitution legitimate, but singular points still need separate reasoning. State the domain and the limiting point before deciding which theorem applies.`,
    s2,
    'multivariable limit',
    'A common output approached along every sufficiently close permitted input path.',
    raw`Different limits along $y=0$ and $y=x$ disprove a planar limit.`,
    'Agreement along sampled paths is not proof of a limit.',
  ),
  section(
    'Partial derivatives hold other inputs fixed',
    raw`A partial derivative measures change in one input while all other inputs remain fixed. The derivative with respect to $x$ is denoted $f_x$ or $\partial f/\partial x$. Its definition uses the same difference quotient as before, but only the $x$ coordinate changes: $f_x(a,b)=\lim_{h\to0}(f(a+h,b)-f(a,b))/h$. The second coordinate stays equal to $b$ throughout this limit.

For $f(x,y)=x^2y+3y^2$, treat $y$ as a constant when differentiating in $x$, giving $f_x=2xy$. Treat $x$ as a constant when differentiating in $y$, giving $f_y=x^2+6y$. At $(2,-1)$ these become $-4$ and $-2$. The original function value is $-1$; a value and its derivatives are different quantities.

Products and compositions still obey their familiar rules. For $g(x,y)=\sin(xy)$, differentiating with respect to $x$ gives $y\cos(xy)$ because the inner derivative is $y$. With respect to $y$ the result is $x\cos(xy)$. For $h(x,y)=\ln(x+y)$, both first partials equal $1/(x+y)$ on the domain $x+y>0$.

### Units and interpretation

If temperature is measured in degrees and $x$ is distance in meters, a partial derivative in $x$ has units degrees per meter. If a second input is time, its partial derivative has different units. Comparing their raw numerical sizes without considering units can be meaningless.

Holding an input fixed is part of the mathematical question, not a claim that this input can actually be held fixed in every experiment. If the inputs depend on each other along a physical trajectory, the total change includes all changing inputs. A later lesson will combine their contributions through the multivariable chain rule. First learn to compute and interpret each partial separately, including its evaluation point and what was held constant.`,
    s3,
    'partial derivative',
    'The rate of change in one input while the other inputs are held fixed.',
    raw`For $f(x,y)=xy^2$, $f_x=y^2$ and $f_y=2xy$.`,
    'Holding y fixed does not mean substituting y=0.',
  ),
  section(
    'Coordinate information has limits',
    raw`The existence of both coordinate partial derivatives is weaker than the existence of one reliable linear approximation for arbitrary small displacements. Coordinate directions inspect only two special approaches in a plane containing infinitely many directions. This distinction will be central when we define multivariable differentiability.

Define $f(0,0)=0$ and $f(x,y)=xy/(x^2+y^2)$ elsewhere. On either coordinate axis the function is identically zero. Therefore both partial derivatives at the origin exist and equal zero, directly from the difference quotient. Yet the function is not continuous there, because diagonal values stay at one half. A function with this jump in nearby behavior cannot have a tangent-plane approximation there.

On the other hand, continuously varying first partial derivatives in a neighborhood provide a useful sufficient condition for differentiability. The condition concerns nearby behavior, not merely two derivative values at the point. It is sufficient rather than necessary: failure to establish continuous partials does not alone prove nondifferentiability.

### Testing claims rather than memorizing labels

Suppose someone says that a zero partial derivative in $x$ means the function is locally constant. The function $f(x,y)=y$ refutes that conclusion: its $x$ partial is zero everywhere, but changing $y$ changes the output. A single partial records one type of change. Even both partials being zero at a point do not establish a minimum: $x^2-y^2$ has zero first partials at the origin but takes both signs nearby.

For calculations, write the requested partial, differentiate with the other coordinates fixed, and only then substitute a point. For interpretation, attach units and name the fixed inputs. For a limit, separate a proof that covers all approaches from an experiment along a few paths. These habits keep computation connected to the question and prepare the transition from slices to gradients and tangent planes.`,
    s3,
    'coordinate partials versus differentiability',
    'Coordinate partial derivatives alone do not guarantee continuity or a multivariable linear approximation.',
    raw`With value zero at the origin, $xy/(x^2+y^2)$ has zero coordinate partials there but is discontinuous.`,
    'Continuous first partials near a point are a sufficient condition, not the definition of differentiability.',
  ),
];
for (const [a, b] of [
  [1, 2],
  [-2, 1],
  [0, 3],
  [3, -1],
  [-1, -2],
]) {
  sections[0].questions.push(
    q(
      raw`Evaluate $f(${a},${b})$ for $f(x,y)=2x^2+xy-y$.`,
      raw`Substitution gives $2(${a})^2+(${a})(${b})-(${b})=${2 * a * a + a * b - b}$.`,
      exact(2 * a * a + a * b - b),
    ),
    q(
      raw`Is $(${a},${b})$ in the domain of $\sqrt{9-x^2-y^2}$?`,
      raw`${a * a + b * b} ${a * a + b * b <= 9 ? 'does not exceed' : 'exceeds'} 9, so the radicand ${a * a + b * b <= 9 ? 'is' : 'is not'} nonnegative.`,
      truth(a * a + b * b <= 9),
      'interpret',
    ),
  );
  sections[1].questions.push(
    q(
      raw`For $f(x,y)=x^2+2y^2$, give the slice obtained by fixing $y=${b}$ as a formula in $x$.`,
      raw`Replace y with ${b}: $x^2+${2 * b * b}$.`,
      expr(raw`x^2+${2 * b * b}`, ['x']),
    ),
    q(
      raw`At what level does $(${a},${b})$ lie for $f(x,y)=x^2+2y^2$?`,
      raw`The level is the output $${a * a + 2 * b * b}$.`,
      exact(a * a + 2 * b * b),
    ),
  );
  sections[3].questions.push(
    q(
      raw`For $f(x,y)=${a}x^2y+${b}y^2$, find $f_x$.`,
      raw`Holding y fixed gives $${2 * a}xy$.`,
      expr(raw`${2 * a}*x*y`),
    ),
    q(
      raw`For $f(x,y)=${a}x^2y+${b}y^2$, find $f_y$.`,
      raw`Holding x fixed gives $${a}x^2+${2 * b}y$.`,
      expr(raw`${a}*x^2+${2 * b}*y`),
    ),
  );
}
for (const k of [-3, -1, 1, 2, 4]) {
  sections[2].questions.push(
    q(
      raw`For $f(x,y)=${k}xy/(x^2+y^2)$, find its value along $y=x\ne0$.`,
      raw`Cancel $x^2$ on this punctured path to obtain $${k}/2$.`,
      exact(raw`${k}/2`),
    ),
    q(
      raw`Define $p(0,0)=0$ and $p(x,y)=${k}x^2y/(x^2+y^2)$ elsewhere. Prove continuity at the origin.`,
      raw`The bound $|p(x,y)|\leq${Math.abs(k)}|y|\leq${Math.abs(k)}\sqrt{x^2+y^2}$ tends to zero. Thus the limit equals the assigned value.`,
    ),
  );
  sections[4].questions.push(
    q(
      raw`Let $f(0,0)=0$ and $f(x,y)=${k}xy/(x^2+y^2)$ elsewhere. Find $f_x(0,0)$.`,
      raw`Along y=0 the function is zero, so its x difference quotient is zero and $f_x(0,0)=0$.`,
      exact(0),
    ),
    q(
      raw`For $f(x,y)=x^2-${Math.abs(k)}y^2$, explain why zero first partials at the origin do not establish a minimum.`,
      raw`Both first partials vanish there. On y=0 the output is positive off the origin; on x=0 it is negative. Every neighborhood contains both signs.`,
    ),
  );
}
sections[0].questions.push(
  q(
    'Explain why the formula domain and feasible domain of a production model may differ.',
    'A polynomial can accept every real input while counts or capacities may require nonnegative, integral, or bounded values. The model supplies these additional restrictions.',
  ),
);
sections[1].questions.push(
  q(
    'For $x^2-y^2=0$, describe the level set without calling it a single smooth curve.',
    'It is the union of the two intersecting lines y=x and y=-x.',
  ),
);
sections[3].questions.push(
  q(
    'Find the x partial of $\\sin(xy)$.',
    'The inner derivative with y fixed is y, giving $y\\cos(xy)$.',
    calc('y*cos(x*y)'),
  ),
);
sections[0].quickCheck = quick(
  'What is an input to a two-variable scalar function?',
  ['An ordered pair', 'Two unrelated output values', 'A surface height alone'],
  0,
  'The input is an ordered pair; the output is one scalar.',
);
sections[4].quickCheck = quick(
  'Both coordinate partials exist at a point. Must the function be continuous there?',
  ['Yes', 'No'],
  1,
  'Coordinate difference quotients do not control all nearby approaches.',
);
// Dedicated reviews are section-specific, not variants of an unrelated generic recall card.
sections[0].review = [
  q('Evaluate $g(-1,3)$ for $g(x,y)=xy+2y$.', 'The value is -3+6=3.', exact(3)),
  q(
    'Is $(2,2)$ in the real domain of $\\ln(5-x^2-y^2)$?',
    'The logarithm argument is -3, so no.',
    truth(false),
    'interpret',
  ),
  q(
    'Does the formula $x+y$ by itself require x and y to be nonnegative?',
    'No; application constraints must be stated separately.',
    truth(false),
    'interpret',
  ),
];
sections[1].review = [
  q('For $f(x,y)=3x^2+y^2$, give the slice y=2.', 'The slice is $3x^2+4$.', expr('3*x^2+4', ['x'])),
  q('What level of $xy$ contains $(2,-3)$?', 'The product is -6.', exact(-6)),
  q('Describe the zero level of $x^2+y^2$.', 'Only the origin gives zero.'),
];
sections[2].review = [
  q('Find the value of $2xy/(x^2+y^2)$ on y=x away from zero.', 'It is one.', exact(1)),
  q(
    'Does agreement along the two coordinate axes prove a planar limit?',
    'No; other routes can disagree.',
    truth(false),
    'interpret',
  ),
  q(
    'Prove $xy^2/(x^2+y^2)$ tends to zero at the origin.',
    'Its magnitude is at most |x|, which tends to zero.',
  ),
];
sections[3].review = [
  q('Find $f_x$ for $f(x,y)=3xy^2-y$.', 'The result is $3y^2$.', expr('3*y^2')),
  q('Find $f_y$ for $f(x,y)=x^3y+2y$.', 'The result is $x^3+2$.', expr('x^3+2')),
  q('Find $f_x(1,2)$ for $f=x^2y$.', 'It is $2xy=4$.', exact(4)),
];
sections[4].review = [
  q(
    'If $f_x=0$ everywhere, must f be constant in all variables?',
    'No: f(x,y)=y is a counterexample.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain what continuous first partials near a point guarantee.',
    'They provide a sufficient condition for differentiability there, hence continuity.',
  ),
  q('For $f=x^2-2y^2$, find $f_y(0,0)$.', 'The derivative is -4y and evaluates to zero.', exact(0)),
];
sections[4].sources.push(source('4.4', 'Tangent Planes and Linear Approximations'));
export default {
  number: 16,
  slug: 'calculus-multivariable-functions',
  title: 'Multivariable Functions and Partial Derivatives',
  intro:
    'We now begin the multivariable block. The single-variable tools remain useful, but an input can move in more than one direction. A cost can depend on two production quantities, a temperature on position, and a model error on many parameters. This lesson develops the language for those inputs before introducing partial derivatives. Revisit functions, limits, and the ordinary differentiation rules as needed; coordinate vectors come from linear algebra. A formula, a geometric picture, and a physical interpretation should describe the same object.',
  sections,
};
