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
  number: 4,
  slug: 'calculus-chain-implicit-inverse',
  title: 'Chain Rule, Implicit and Inverse Differentiation',
  intro: R`A quantity may change because another quantity changes first. If a sensor converts temperature into voltage and a program converts voltage into a displayed reading, the overall sensitivity must include both stages. The chain rule formalizes that multiplication of local rates. It also lets us differentiate a curve without explicitly solving for one variable and determine how rapidly an inverse function changes. Read compositions from the inside outward, label the independent variable, and state the domain on which each formula makes sense. The point of these techniques is to preserve dependencies that can be easy to lose in a long expression.`,
  sections: [
    {
      title: 'Composition and local rate multiplication',
      sources: [source('3.6', 'Chain rule for compositions and its derivative notation.')],
      body: R`A composition has the form $y=f(g(x))$: first compute $u=g(x)$, then apply the outer function $f$ to $u$. The chain rule says $dy/dx=f'(g(x))g'(x)$, provided $g$ is differentiable at $x$ and $f$ is differentiable at $g(x)$. The outer derivative must be evaluated at the inner output, not at the original input by habit.

For $y=(3x+1)^4$, set $u=3x+1$. The rate of the outer power with respect to $u$ is $4u^3$, while $du/dx=3$. Multiplying gives $dy/dx=12(3x+1)^3$. The factor $3$ is not decorative: doubling the rate of change of the inner quantity doubles the resulting outer rate at the same inner value. Differentiating only the outer power would answer a rate with respect to $u$ rather than with respect to $x$.

The differential notation $dy/dx=(dy/du)(du/dx)$ emphasizes this transfer of rates. It resembles cancellation of $du$, but the chain rule justifies the equality. A proof cannot simply cancel symbols without establishing the derivative relationships. For a nonzero inner increment, the overall difference quotient factors into the output change per inner change times the inner change per input change. A full proof handles cases where the inner change vanishes; the theorem covers those too.

A table can support a chain-rule calculation without formulas. If $g(2)=5$, $g'(2)=-3$, and $f'(5)=4$, then $(f\circ g)'(2)=4(-3)=-12$. The value $f'(2)$ would not be relevant to this particular composition. Units provide a useful check: if the inner rate is volts per degree and the outer rate is displayed units per volt, their product is displayed units per degree. This reasoning also distinguishes a composition from a product. In $x\sin x$, two values are multiplied; in $\sin(x^2)$, one function receives another function's output.`,
      terms: [
        term(
          'chain-rule',
          'Chain rule',
          'Multiply local rates along a composition.',
          R`$[f(g(x))]'=f'(g(x))g'(x)$ when the required derivatives exist.`,
          R`$[(3x+1)^4]'=12(3x+1)^3$.`,
          'Evaluate the outer derivative at the inner value and retain the inner derivative.',
        ),
        term(
          'inner-outer-function',
          'Inner and outer functions',
          'The stages of a composition.',
          R`In $f(g(x))$, $g$ is applied first and $f$ second.`,
          R`For $\sin(x^2)$, the inner function squares and the outer function takes sine.`,
          'Composition is not multiplication of the functions.',
        ),
      ],
      questions: [
        expr(
          R`Differentiate $(2x-3)^5$.`,
          '10*(2*x-3)^4',
          R`The outer derivative is $5(2x-3)^4$; multiply by inner derivative $2$.`,
        ),
        expr(R`Differentiate $(x^2+1)^3$.`, '6*x*(x^2+1)^2', R`Multiply $3(x^2+1)^2$ by $2x$.`),
        expr(
          R`Differentiate $1/(4x+1)$ for $4x+1\ne0$.`,
          '-4/(4*x+1)^2',
          R`Write the outer power as $u^{-1}$ and multiply its derivative by $4$.`,
        ),
        calc(
          R`Differentiate $\sqrt{5x+2}$ on $5x+2>0$.`,
          '5/(2*sqrt(5*x+2))',
          R`The square-root derivative at the inner value is $1/(2\sqrt{5x+2})$; multiply by $5$.`,
          { positive: ['5*x+2'] },
        ),
        calc(
          R`Differentiate $\sin(3x)$ with radian arguments.`,
          '3*cos(3*x)',
          R`Differentiate the outer sine and multiply by the inner rate $3$.`,
        ),
        calc(
          R`Differentiate $\cos(x^2)$ with radian arguments.`,
          '-2*x*sin(x^2)',
          R`The outer derivative is negative sine and the inner derivative is $2x$.`,
        ),
        exact(
          R`Given $g(1)=4,g'(1)=2,f'(4)=-3$, calculate $(f\circ g)'(1)$.`,
          -6,
          R`Evaluate the outer rate at $g(1)=4$ and multiply: $(-3)(2)=-6$.`,
        ),
        exact(
          R`A sensor changes at $2$ volts per degree, and a display changes at $7$ units per volt. Find the composed sensitivity in units per degree.`,
          14,
          R`Multiply the linked rates: $7\cdot2=14$.`,
        ),
        open(
          R`Explain why differentiating $(x^2+1)^4$ as $4(x^2+1)^3$ misses a dependency.`,
          R`That expression is the rate with respect to the inner value $u=x^2+1$. Since $u$ itself changes at rate $2x$ with respect to $x$, the required derivative is $8x(x^2+1)^3$.`,
        ),
        open(
          R`State exactly which table entries are needed to compute $(f\circ g)'(a)$.`,
          R`We need $g(a)$ to locate the outer input, $g'(a)$ for the inner rate, and $f'(g(a))$ for the outer rate. The result is their rate product.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $(1-4x)^3$.`,
          '-12*(1-4*x)^2',
          R`The outer factor $3(1-4x)^2$ multiplies inner derivative $-4$.`,
        ),
        calc(
          R`Differentiate $\sin(x^3+2)$ with radian arguments.`,
          '3*x^2*cos(x^3+2)',
          R`Cosine is evaluated at $x^3+2$, then multiplied by $3x^2$.`,
        ),
        exact(
          R`If $v(0)=2,v'(0)=-4,u'(2)=5$, calculate $(u\circ v)'(0)$.`,
          -20,
          R`$u'(v(0))v'(0)=5(-4)=-20$.`,
        ),
      ],
      quickCheck: qc(
        R`Given $g(2)=7$, which outer derivative appears in $(f\circ g)'(2)$?`,
        [R`$f'(2)$`, R`$f'(7)$`, R`$g'(7)$`],
        1,
        'The outer function receives the inner output $7$, so its derivative is evaluated there.',
      ),
    },
    {
      title: 'Nested rules and angle conversion',
      sources: [
        source('3.6', 'Repeated chain rule and combinations with products and quotients.'),
        source('3.5', 'Radian convention for trigonometric differentiation.'),
      ],
      body: R`A composition can contain more than two stages. For $y=\sin((x^2+1)^3)$, work from the outside inward: the sine contributes $\cos((x^2+1)^3)$, the cube contributes $3(x^2+1)^2$, and the quadratic contributes $2x$. Multiplying yields $6x(x^2+1)^2\cos((x^2+1)^3)$. A written dependency chain makes a missing factor easy to spot: $x\mapsto x^2+1\mapsto(x^2+1)^3\mapsto\sin((x^2+1)^3)$.

Different operations can occur at different levels. In $y=x^2\sin(3x)$, the top-level operation is a product, so first write $2x\sin(3x)+x^2[d(\sin(3x))/dx]$. The remaining derivative is a composition, giving $y'=2x\sin(3x)+3x^2\cos(3x)$. Starting with the structure of the full expression prevents a familiar chain-rule pattern from displacing a needed product rule.

For $q(x)=(\sin x)^2/(x^2+1)$, combine the quotient rule with the chain rule in its numerator derivative. The result is $[2\sin x\cos x(x^2+1)-2x\sin^2x]/(x^2+1)^2$. The denominator is positive for every real input. A correct factored expression is often easier to inspect than a long expanded answer.

Angle conversion is a concrete composition. If $\theta$ is a numerical degree input, then $S(\theta)=\sin(\pi\theta/180)$ uses a radian sine function internally. Differentiation with respect to $\theta$ gives $S'(\theta)=(\pi/180)\cos(\pi\theta/180)$. The conversion factor has a real effect on slope: a one-degree increment is much smaller than a one-radian increment.

For checking a complicated answer, predict simple features before calculating: a constant inner function should produce zero derivative; an even function's derivative should be odd wherever the differentiation symmetry applies; and replacing a positive inner scale by a negative one often introduces a sign. These observations detect errors, but they do not replace a derivation or justify equivalence from a few numerical samples.`,
      terms: [
        term(
          'dependency-chain',
          'Dependency chain',
          'The ordered stages connecting input to output.',
          R`Each differentiable stage contributes a local derivative evaluated at its own input.`,
          R`$x\mapsto x^2\mapsto\sin(x^2)$ contributes $2x$ and $\cos(x^2)$.`,
          'Count stages rather than applying one rule to the entire expression indiscriminately.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $\sin((x+1)^2)$ with radian arguments.`,
          '2*(x+1)*cos((x+1)^2)',
          R`The square contributes $2(x+1)$ after the outer sine becomes cosine.`,
        ),
        calc(
          R`Differentiate $(\sin x)^3$ with radian input.`,
          '3*sin(x)^2*cos(x)',
          R`Apply the power derivative to the sine value, then multiply by $\cos x$.`,
        ),
        calc(
          R`Differentiate $\cos(\sin x)$ with radian arguments.`,
          '-sin(sin(x))*cos(x)',
          R`The outer cosine contributes $-\sin(\sin x)$ and the inner sine contributes $\cos x$.`,
        ),
        calc(
          R`Differentiate $x\sin(2x)$ with radian arguments.`,
          'sin(2*x)+2*x*cos(2*x)',
          R`The product rule gives two terms; the second includes inner derivative $2$.`,
        ),
        expr(
          R`Differentiate $x^2(x^3+1)^4$.`,
          '2*x*(x^3+1)^4+12*x^4*(x^3+1)^3',
          R`The first product term differentiates $x^2$; the second multiplies $x^2$ by $4(x^3+1)^3(3x^2)$.`,
        ),
        calc(
          R`Differentiate $\tan(5x)$ where $\cos(5x)\ne0$, with radian arguments.`,
          '5*sec(5*x)^2',
          R`The outer derivative is squared secant and the inner derivative is $5$.`,
          { nonzero: ['cos(5*x)'] },
        ),
        calc(
          R`For real $x$, differentiate $S(x)=\sin(\pi x/180)$, where $x$ counts degrees.`,
          'pi*cos(pi*x/180)/180',
          R`The radian conversion is the inner function, whose derivative is $\pi/180$.`,
        ),
        exact(
          R`For $f(x)=(x^2+1)^3$, find $f'(0)$.`,
          0,
          R`$f'(x)=6x(x^2+1)^2$, so the inner rate vanishes at zero.`,
        ),
        open(
          R`Write a dependency chain and derive the derivative of $\sqrt{1+\sin x}$ wherever $1+\sin x>0$.`,
          R`Use $x\mapsto\sin x\mapsto1+\sin x\mapsto\sqrt{1+\sin x}$. The rates multiply to $\cos x/[2\sqrt{1+\sin x}]$. Positivity ensures the outer root derivative is defined.`,
        ),
        open(
          R`Explain why the product rule is needed for $x\cos(x^2)$ even though a composition is visible.`,
          R`The full output is a product of $x$ and $\cos(x^2)$. Differentiating the first factor gives $\cos(x^2)$; differentiating the second gives $-2x\sin(x^2)$, multiplied by $x$. Thus the answer is $\cos(x^2)-2x^2\sin(x^2)$.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $\sin(\cos x)$ with radian arguments.`,
          '-sin(x)*cos(cos(x))',
          R`The outer derivative is $\cos(\cos x)$ and the inner derivative is $-\sin x$.`,
        ),
        expr(
          R`Differentiate $(2x^2-1)^4$.`,
          '16*x*(2*x^2-1)^3',
          R`Multiply $4(2x^2-1)^3$ by $4x$.`,
        ),
        calc(
          R`Differentiate $x^2\cos(4x)$ with radian arguments.`,
          '2*x*cos(4*x)-4*x^2*sin(4*x)',
          R`Use the product rule, and retain the factor $4$ in the cosine derivative.`,
        ),
      ],
    },
    {
      title: 'Implicit differentiation of curves',
      sources: [
        source(
          '3.8',
          'Implicit differentiation, chain factors on dependent variables, tangent slopes.',
        ),
      ],
      body: R`An equation such as $x^2+y^2=13$ describes a curve without choosing one global function $y=f(x)$. Near many of its points, a branch does behave as a differentiable function of $x$. Implicit differentiation works on such a branch while keeping its equation intact. Every occurrence of $y$ is treated as a quantity depending on $x$.

Differentiating the circle equation gives $2x+2y\,y'=0$. The term $2y\,y'$ is a chain-rule derivative of $y(x)^2$, not just $2y$. Where $y\ne0$, solve to obtain $y'=-x/y$. At $(2,3)$ the slope is $-2/3$, and the tangent is $y-3=-(2/3)(x-2)$. The point must first satisfy the original equation; otherwise substituting its coordinates into the derivative formula has no geometric meaning for that curve.

Mixed terms introduce product rules. For $x^2+xy+y^2=7$, differentiation gives $2x+y+xy'+2yy'=0$. Collecting all terms involving $y'$ gives $(x+2y)y'=-(2x+y)$. Thus $y'=-(2x+y)/(x+2y)$ where the denominator is nonzero. At $(1,2)$ the equation holds and the slope is $-4/5$. Collecting before dividing reduces the chance of leaving a hidden derivative term on the wrong side.

A vanishing denominator marks a place where this formula does not provide a finite slope. It does not by itself prove a vertical tangent: the numerator might also vanish, or several branches may cross. For the circle at $(\sqrt{13},0)$, direct geometry or a local parameterization shows a vertical tangent. For the relation $xy=0$ at the origin, both coordinate axes are present, so there is no single tangent to a single smooth branch covering the full relation.

Implicit differentiation can be repeated, but the resulting $y'$ also depends on $x$. Differentiate it with product, quotient, and chain rules, then substitute the known first derivative if needed. This keeps higher derivatives attached to the chosen local branch rather than treating the two coordinates as independent constants.

For a second-derivative example, use the upper half of the circle $x^2+y^2=R^2$, with fixed $R>0$ and $y>0$. The first derivative is $y'=-x/y$. Differentiating this quotient gives $y''=-1/y+xy'/y^2$. Substitute $y'=-x/y$ to get $y''=-1/y-x^2/y^3=-(x^2+y^2)/y^3=-R^2/y^3$. The negative sign describes the branch's downward curvature. At no stage was $y$ held constant; doing so in the second differentiation would lose the contribution containing $y'$.`,
      terms: [
        term(
          'implicit-differentiation',
          'Implicit differentiation',
          'Differentiate an equation while preserving dependence.',
          R`When $y=y(x)$, differentiating a term such as $y^2$ gives $2y\,y'$.`,
          R`From $x^2+y^2=13$, obtain $y'=-x/y$ where $y\ne0$.`,
          'The dependent variable contributes chain-rule factors.',
        ),
        term(
          'local-branch',
          'Local branch',
          'A portion of a curve representable as a function nearby.',
          R`An implicit curve can admit a differentiable $y(x)$ near a point without being one global function of $x$.`,
          R`A circle has upper and lower function branches away from its vertical extremes.`,
          'A global relation may contain several branches.',
        ),
      ],
      questions: [
        expr(
          R`For $x^2+y^2=10$, find $dy/dx$ where $y\ne0$.`,
          '-x/y',
          R`Differentiate to get $2x+2yy'=0$, then divide by $2y$.`,
          ['x', 'y'],
        ),
        exact(
          R`Find the slope of $x^2+y^2=10$ at $(1,3)$.`,
          '-1/3',
          R`The point is on the circle and $y'=-x/y=-1/3$.`,
        ),
        expr(
          R`For $xy=6$, find $dy/dx$ where $x\ne0$.`,
          '-y/x',
          R`The product rule gives $y+xy'=0$, so $y'=-y/x$.`,
          ['x', 'y'],
        ),
        exact(R`Find the slope of $xy=6$ at $(2,3)$.`, '-3/2', R`$y'=-y/x=-3/2$.`),
        expr(
          R`For $x^2+xy+y^2=7$, find $dy/dx$ where $x+2y\ne0$.`,
          '-(2*x+y)/(x+2*y)',
          R`Collecting derivative terms gives $(x+2y)y'=-(2x+y)$.`,
          ['x', 'y'],
        ),
        exact(
          R`Find the slope of $x^2+xy+y^2=7$ at $(1,2)$.`,
          '-4/5',
          R`The formula gives $-(2+2)/(1+4)=-4/5$.`,
        ),
        expr(
          R`For $y^3+x=2$, find $dy/dx$ where $y\ne0$.`,
          '-1/(3*y^2)',
          R`$3y^2y'+1=0$, hence $y'=-1/(3y^2)$.`,
          ['y'],
        ),
        exact(
          R`For the curve $y^3+x=2$, find its slope at $(1,1)$.`,
          '-1/3',
          R`The point satisfies the curve equation, and $y'=-1/(3y^2)=-1/3$.`,
        ),
        open(
          R`Find the tangent line to $x^2+y^2=25$ at $(-3,4)$.`,
          R`The point lies on the circle. Differentiation gives $y'=-x/y=3/4$, so the tangent is $y-4=(3/4)(x+3)$.`,
        ),
        open(
          R`Why does a $0/0$ result in an implicit slope formula require more investigation? Use $xy=0$ at the origin.`,
          R`The formula $y'=-y/x$ cannot be evaluated at the origin. The original relation is the union of the axes, with horizontal and vertical branches. A single finite derivative of the whole relation is not determined by that quotient.`,
        ),
      ],
      review: [
        exact(
          R`Find the slope of $x^2+4y^2=20$ at $(2,2)$.`,
          '-1/4',
          R`Differentiation gives $2x+8yy'=0$, so $y'=-x/(4y)=-1/4$.`,
        ),
        expr(
          R`For $x^3+y^3=9$, find $dy/dx$ where $y\ne0$.`,
          '-x^2/y^2',
          R`$3x^2+3y^2y'=0$, giving $y'=-x^2/y^2$.`,
          ['x', 'y'],
        ),
        exact(
          R`Find the slope of $x^3+y^3=9$ at $(1,2)$.`,
          '-1/4',
          R`The point satisfies the equation and $-x^2/y^2=-1/4$.`,
        ),
      ],
      quickCheck: qc(
        R`When $y$ depends on $x$, what is $d(y^3)/dx$?`,
        [R`$3y^2$`, R`$3y^2y'$`, R`$0$`],
        1,
        'The outer cube derivative must be multiplied by the derivative of the dependent variable.',
      ),
    },
    {
      title: 'Rates of inverse functions',
      sources: [
        source(
          '3.7',
          'Inverse derivative theorem, reciprocal slopes and failure at a zero original derivative.',
        ),
      ],
      body: R`An inverse function reverses an input-output relationship. If $y=f(x)$ is invertible on a stated interval, then $x=f^{-1}(y)$ there. The inverse notation does not mean the reciprocal $1/f$. Domain restrictions that make the original function one-to-one are part of defining the inverse. For example, $x^2$ on all real inputs has no inverse function, while its restriction to $x\ge0$ has inverse $\sqrt{x}$.

Suppose $f$ is differentiable and locally invertible near $a$, with $f'(a)\ne0$. The derivative of its inverse at $b=f(a)$ is $(f^{-1})'(b)=1/f'(a)$. Equivalently, $(f^{-1})'(x)=1/f'(f^{-1}(x))$ where the hypotheses hold. The original derivative is evaluated at the inverse output. Confusing the two coordinate roles is a common error when the numbers are not the same.

Differentiate the identity $f(f^{-1}(x))=x$ using the chain rule: $f'(f^{-1}(x))(f^{-1})'(x)=1$. Solving gives the formula. Geometrically, the two graphs reflect across $y=x$; exchanging horizontal and vertical changes reciprocates a nonzero finite slope. In an application, this reverses sensitivity units: a rate in meters per second becomes a rate in seconds per meter.

For $f(x)=x^3+x$, the derivative is $3x^2+1>0$, so the function is one-to-one. Because $f(2)=10$, the inverse derivative at $10$ is $1/f'(2)=1/13$. There is no need to solve the cubic explicitly. At a different inverse input, first find the corresponding original input; reciprocal slopes at unrelated points have no such relationship.

The condition $f'(a)\ne0$ cannot be discarded. The function $x^3$ is invertible, but its derivative at zero vanishes. Its inverse $x^{1/3}$ has an unbounded difference quotient there, not a finite derivative. Invertibility alone is a statement about distinct values, while differentiability of an inverse also requires local control of how quickly those values separate.

As a worked table example, imagine that a monotone calibration function maps input $a=6$ to output $b=20$, and its slope at $6$ is $-4$ output units per input unit. The inverse maps $20$ back to $6$ and has slope $-1/4$ input units per output unit. The negative sign persists: increasing the observed output requires decreasing the inferred input. A slope with very small nonzero magnitude in the original mapping gives a large inverse sensitivity. Thus invertibility does not imply that numerical inversion is insensitive to measurement error. This conclusion follows from the reciprocal derivative and gives a practical reason to record both the matching input-output pair and the slope.`,
      terms: [
        term(
          'inverse-derivative',
          'Inverse derivative',
          'Reciprocal slope at the corresponding original input.',
          R`If $f(a)=b$ and the local inverse hypotheses hold with $f'(a)\ne0$, then $(f^{-1})'(b)=1/f'(a)$.`,
          R`If $f(2)=10$ and $f'(2)=13$, the inverse derivative at $10$ is $1/13$.`,
          'The reciprocal uses the matching original input, not the inverse input.',
        ),
      ],
      questions: [
        exact(
          R`An invertible differentiable function has $f(3)=8$ and $f'(3)=5$. Find $(f^{-1})'(8)$.`,
          '1/5',
          R`The matching original input is $3$, so invert its slope $5$.`,
        ),
        exact(
          R`An invertible differentiable function has $f(-1)=4$ and $f'(-1)=-2$. Find $(f^{-1})'(4)$.`,
          '-1/2',
          R`The inverse slope is the reciprocal of $-2$.`,
        ),
        exact(
          R`For $f(x)=x^3+x$, find $(f^{-1})'(2)$.`,
          '1/4',
          R`$f(1)=2$ and $f'(1)=3+1=4$, so the inverse derivative is $1/4$.`,
        ),
        exact(
          R`For $f(x)=x^3+2x$, find $(f^{-1})'(3)$.`,
          '1/5',
          R`$f(1)=3$ and $f'(1)=5$, so the inverse slope is $1/5$.`,
        ),
        exact(
          R`Restrict $f(x)=x^2$ to $x\ge0$. Find the derivative of its inverse at $9$.`,
          '1/6',
          R`The original input is $3$; $f'(3)=6$, so the inverse rate is $1/6$.`,
        ),
        exact(
          R`Restrict $f(x)=x^2$ to $x\le0$. Find the derivative of its inverse at $9$.`,
          '-1/6',
          R`This branch has original input $-3$ and slope $-6$, giving inverse slope $-1/6$.`,
        ),
        bool(
          R`Is invertibility alone sufficient for a finite derivative of the inverse at every point?`,
          false,
          R`The inverse of $x^3$ is $x^{1/3}$, whose derivative at zero is not finite.`,
        ),
        bool(
          R`Does $f^{-1}(x)$ mean $1/f(x)$?`,
          false,
          R`It denotes the inverse mapping, which reverses inputs and outputs; reciprocal values are a different operation.`,
        ),
        open(
          R`Derive the inverse derivative formula from $f(f^{-1}(x))=x$ and identify the condition needed for division.`,
          R`The chain rule gives $f'(f^{-1}(x))(f^{-1})'(x)=1$. Divide by the original derivative, which must be nonzero, to obtain $(f^{-1})'(x)=1/f'(f^{-1}(x))$.`,
          'prove',
        ),
        open(
          R`Explain why restricting $x^2$ to positive or negative inputs changes the sign of the inverse derivative.`,
          R`The two inverses are $\sqrt{x}$ and $-\sqrt{x}$. Their corresponding original inputs have slopes $2\sqrt{x}$ and $-2\sqrt{x}$, so reciprocating gives opposite signs.`,
        ),
      ],
      review: [
        exact(
          R`If $h(4)=11$ and $h'(4)=7$ for an invertible differentiable $h$, find $(h^{-1})'(11)$.`,
          '1/7',
          R`Use the reciprocal of the derivative at the matching original input $4$.`,
        ),
        exact(
          R`For $f(x)=x^3+3x$, calculate $(f^{-1})'(4)$.`,
          '1/6',
          R`$f(1)=4$ and $f'(1)=6$, so the inverse derivative is $1/6$.`,
        ),
        exact(
          R`For $f(x)=5-2x$, find the derivative of its inverse at any input.`,
          '-1/2',
          R`The original slope is constantly $-2$, so its inverse slope is constantly $-1/2$.`,
        ),
      ],
    },
    {
      title: 'Inverse trigonometric derivatives',
      sources: [
        source(
          '3.7',
          'Arcsine, arccosine and arctangent derivative formulas with principal branches.',
        ),
      ],
      body: R`Inverse trigonometric functions require principal branches because the unrestricted trigonometric functions repeat their values. Arcsine returns an angle in $[-\pi/2,\pi/2]$, arccosine one in $[0,\pi]$, and arctangent one in $(-\pi/2,\pi/2)$. We write $\arcsin x$, $\arccos x$, and $\arctan x$ to avoid confusing inverse functions with reciprocal powers. Their output angles are in radians.

Let $y=\arcsin x$, so $\sin y=x$. Implicit differentiation yields $\cos y\,y'=1$. On the interior of the principal arcsine interval, cosine is positive, so $\cos y=\sqrt{1-\sin^2y}=\sqrt{1-x^2}$. Hence $(\arcsin x)'=1/\sqrt{1-x^2}$ for $|x|<1$. The sign of the square root is justified by the branch, not guessed from an algebraic identity. The endpoints $x=\pm1$ belong to the function's domain but do not have finite derivatives.

For $y=\arccos x$, differentiate $\cos y=x$ to get $-\sin y\,y'=1$. The branch has positive sine in its interior, giving $(\arccos x)'=-1/\sqrt{1-x^2}$ for $|x|<1$. Arccosine decreases as its input increases, consistent with the negative sign.

For $y=\arctan x$, differentiating $\tan y=x$ gives $\sec^2y\,y'=1$. Since $\sec^2y=1+\tan^2y=1+x^2$, the result is $(\arctan x)'=1/(1+x^2)$ for all real $x$. Its rate is positive but shrinks toward zero as the input magnitude grows.

Apply the chain rule to composed arguments. For $\arcsin(2x)$ the derivative is $2/\sqrt{1-4x^2}$ on $|x|<1/2$. For $\arctan(x^2)$ it is $2x/(1+x^4)$. The former has a restricted differentiability interval inherited from the inverse sine; the latter is differentiable for every real input. Always determine the inner output range before applying a principal-branch formula.`,
      terms: [
        term(
          'principal-branch',
          'Principal branch',
          'A chosen one-to-one restriction defining an inverse.',
          R`Arcsine uses the sine restriction to $[-\pi/2,\pi/2]$.`,
          R`$\arcsin(0)=0$, although infinitely many angles have sine zero.`,
          'Branch choices determine signs in inverse derivative calculations.',
        ),
        term(
          'inverse-trigonometric-derivative',
          'Inverse trigonometric derivative',
          'The rate of a principal inverse angle function.',
          R`$(\arcsin x)'=1/\sqrt{1-x^2}$, $(\arccos x)'=-1/\sqrt{1-x^2}$, and $(\arctan x)'=1/(1+x^2)$ on their differentiability domains.`,
          R`$[\arctan(2x)]'=2/(1+4x^2)$.`,
          'Arcsine is not cosecant.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $\arcsin x$ on $|x|<1$.`,
          '1/sqrt(1-x^2)',
          R`Use the principal inverse-sine derivative; $1-x^2>0$.`,
          { positive: ['1-x^2'] },
        ),
        calc(
          R`Differentiate $\arccos x$ on $|x|<1$.`,
          '-1/sqrt(1-x^2)',
          R`Arccosine contributes the negative reciprocal square root.`,
          { positive: ['1-x^2'] },
        ),
        expr(
          R`Differentiate $\arctan x$ on the real line.`,
          '1/(1+x^2)',
          R`The inverse tangent derivative is $1/(1+x^2)$.`,
        ),
        calc(
          R`Differentiate $\arcsin(3x)$ on $|x|<1/3$.`,
          '3/sqrt(1-9*x^2)',
          R`The inner derivative is $3$; the principal denominator is $\sqrt{1-(3x)^2}$.`,
          { positive: ['1-9*x^2'] },
        ),
        calc(
          R`Differentiate $\arccos(x^2)$ on $|x|<1$.`,
          '-2*x/sqrt(1-x^4)',
          R`Multiply the outer negative reciprocal root by $2x$.`,
          { positive: ['1-x^4'] },
        ),
        expr(
          R`Differentiate $\arctan(2x)$ for real $x$.`,
          '2/(1+4*x^2)',
          R`The chain rule gives $2/[1+(2x)^2]$.`,
        ),
        expr(
          R`Differentiate $\arctan(x^2)$ for real $x$.`,
          '2*x/(1+x^4)',
          R`The outer derivative is $1/[1+(x^2)^2]$ and the inner derivative is $2x$.`,
        ),
        exact(R`Find the derivative of $\arctan x$ at $x=1$.`, '1/2', R`$1/(1+1^2)=1/2$.`),
        open(
          R`Derive the derivative of $\arcsin x$ and explain why the square root has the positive sign.`,
          R`Let $y=\arcsin x$. Then $\sin y=x$ and $\cos y\,y'=1$. On $-\pi/2<y<\pi/2$, cosine is positive, so $\cos y=\sqrt{1-x^2}$. Hence $y'=1/\sqrt{1-x^2}$ for $|x|<1$.`,
          'prove',
        ),
        open(
          R`Explain why differentiability fails at an endpoint of the arcsine domain even though the function is defined there.`,
          R`The corresponding sine derivative is zero at $\pm\pi/2$. The inverse slope grows without bound as $x$ approaches $\pm1$ from inside the domain, so the inverse has no finite endpoint derivative.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $\arctan(1-x)$ for real $x$.`,
          '-1/(1+(1-x)^2)',
          R`The inner derivative is $-1$, multiplying the outer reciprocal quadratic.`,
        ),
        calc(
          R`Differentiate $\arcsin(x/2)$ on $|x|<2$.`,
          '1/(2*sqrt(1-x^2/4))',
          R`The inner rate $1/2$ multiplies $1/\sqrt{1-(x/2)^2}$.`,
          { positive: ['1-x^2/4'] },
        ),
        exact(
          R`Find the derivative of $\arccos x$ at zero.`,
          -1,
          R`The formula gives $-1/\sqrt{1-0}=-1$.`,
        ),
      ],
    },
  ],
};
