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
  number: 2,
  slug: 'calculus-derivatives',
  title: 'Derivatives',
  intro: R`A difference measures change; a rate compares that change with the input interval over which it occurs. The derivative asks whether those average rates settle to a finite value as the interval shrinks. This lesson develops that definition before introducing shortcuts. You will calculate slopes directly, use them to describe motion and tangent lines, and identify places where a derivative does not exist. Keep the limit lesson's distinction between a formula at a point and its nearby behavior in view: a derivative depends on both. The derivative is a new function whose outputs are rates, so it also has its own domain and units.`,
  sections: [
    {
      title: 'Average rates and secant lines',
      sources: [
        source('3.1', 'Secant slopes and shrinking intervals.'),
        source('3.4', 'Average rates, instantaneous rates and units.'),
      ],
      body: R`For two distinct inputs $a$ and $b$, the average rate of change of $f$ is $(f(b)-f(a))/(b-a)$. The numerator is an output change and the denominator is the corresponding input change. On the graph, this quotient is the slope of the secant line through $(a,f(a))$ and $(b,f(b))$. The word secant identifies a line determined by two points; it does not mean an approximation is already being made. This average slope is exact for the stated interval.

Suppose a cart's position is $s(t)=t^2+2t$ meters, with time measured in seconds. Between $t=1$ and $t=3$, it moves from $3$ meters to $15$ meters. The average velocity is $(15-3)/(3-1)=6$ meters per second. Dividing the final position by the final time would answer a different question. Average velocity can be negative when final position is smaller than initial position; it is not the same as total distance traveled divided by elapsed time.

To investigate one input $a$, write the second input as $a+h$, where $h\ne0$ is an increment. The rate becomes $[f(a+h)-f(a)]/h$. A negative increment is valid: both the input change and the corresponding output difference must keep the same orientation. Reversing both differences leaves the quotient unchanged; reversing only one changes its sign incorrectly.

For $f(x)=x^2$ and $a=2$, expanding before dividing gives $[(2+h)^2-4]/h=(4h+h^2)/h=4+h$. Positive increments $0.1$ and $0.01$ produce slopes $4.1$ and $4.01$; negative increments $-0.1$ and $-0.01$ produce $3.9$ and $3.99$. These exact secant slopes suggest a limiting slope of $4$. We have not substituted $h=0$ into the original quotient, where division is undefined. We simplified for nonzero increments and will take a limit of those valid values.`,
      terms: [
        term(
          'average-rate',
          'Average rate of change',
          'Output change divided by input change.',
          R`For $a\ne b$, the average rate is $(f(b)-f(a))/(b-a)$.`,
          R`For $x^2$ on $[1,3]$, the rate is $(9-1)/2=4$.`,
          'Use changes in both numerator and denominator.',
        ),
        term(
          'secant-line',
          'Secant line',
          'A line through two graph points.',
          R`Its slope compares the outputs at two distinct inputs.`,
          R`The secant of $x^2$ through inputs $1$ and $3$ has slope $4$.`,
          'A secant need not have the same slope as a tangent at either endpoint.',
        ),
      ],
      questions: [
        exact(R`Find the average rate of $f(x)=x^2$ on $[2,5]$.`, 7, R`$(25-4)/(5-2)=21/3=7$.`),
        exact(
          R`Find the average rate of $f(x)=x^3$ on $[-1,2]$.`,
          3,
          R`$(8-(-1))/(2-(-1))=9/3=3$.`,
        ),
        exact(
          R`Find the average rate of $f(x)=4-3x$ on $[1,7]$.`,
          -3,
          R`The slope of this line is constant; $(f(7)-f(1))/6=-18/6=-3$.`,
        ),
        exact(
          R`A tank contains $40$ liters at minute $2$ and $25$ liters at minute $5$. Find its average volume rate in liters per minute.`,
          -5,
          R`$(25-40)/(5-2)=-15/3=-5$.`,
        ),
        expr(
          R`For $f(x)=x^2$ at $a=3$, simplify $[f(3+h)-f(3)]/h$ for $h\ne0$.`,
          '6+h',
          R`Expanding the numerator gives $6h+h^2$, so the quotient is $6+h$.`,
          ['h'],
        ),
        exact(
          R`For $f(x)=x^2$ at $a=3$, find the secant slope with increment $h=-1/2$.`,
          '11/2',
          R`The quotient is $6+h$, giving $6-1/2=11/2$.`,
        ),
        exact(
          R`A position changes from $8$ meters to $2$ meters over $3$ seconds. Find average velocity in meters per second.`,
          -2,
          R`The displacement is $2-8=-6$ meters; dividing by $3$ seconds gives $-2$.`,
        ),
        bool(
          'Does zero average velocity force a moving object to have stayed still throughout the interval?',
          false,
          'No. It may travel away and return, producing zero displacement despite nonzero distance.',
        ),
        open(
          R`Derive the secant slope of $f(x)=x^2$ between arbitrary distinct inputs $a,b$.`,
          R`$(b^2-a^2)/(b-a)=(b-a)(b+a)/(b-a)=a+b$ because $a\ne b$.`,
        ),
        open(
          'Explain the units of a secant slope when input is kilograms and output is cost in dollars.',
          'The quotient divides a dollar change by a kilogram change, so its units are dollars per kilogram. It represents average additional cost per additional kilogram over the specified interval.',
        ),
      ],
      review: [
        exact(
          R`Find the secant slope of $x^2+1$ between inputs $-2$ and $1$.`,
          -1,
          R`The values are $5$ and $2$, so the slope is $(2-5)/3=-1$.`,
        ),
        exact(
          R`A server's cumulative completed jobs rises from $120$ to $165$ between seconds $10$ and $13$. Find the average completion rate in jobs per second.`,
          15,
          R`There are $45$ additional jobs in $3$ seconds, giving $15$ jobs per second.`,
        ),
        expr(
          R`Simplify the difference quotient of $f(x)=3x+7$ at $a$ with nonzero increment $h$.`,
          '3',
          R`The numerator is $3(a+h)+7-(3a+7)=3h$, so division gives $3$.`,
        ),
      ],
      quickCheck: qc(
        R`For $f(x)=x^2$ at $a=2$, the nonzero-increment quotient is $4+h$. What does $h=-0.1$ represent?`,
        [
          'An invalid interval',
          'A nearby input $1.9$ and secant slope $3.9$',
          'A nearby input $2.1$ and slope $4.1$',
        ],
        1,
        'A negative increment approaches from the left; consistent numerator and denominator signs still give a valid slope.',
      ),
    },
    {
      title: 'The derivative at a point',
      sources: [source('3.1', 'Derivative definition and direct calculations.')],
      body: R`The derivative at $a$, written $f'(a)$, is the finite limit $\lim_{h\to0}[f(a+h)-f(a)]/h$, when that limit exists. It describes the instantaneous rate of change and the slope of the tangent at that input. “Instantaneous” does not mean dividing zero change by zero time. It means the average-rate quotients approach a definite value as nonzero intervals shrink. Both signs of $h$ must agree for an ordinary derivative at an interior point.

For $f(x)=2x^2-x$, evaluate at $a=1$. We have $f(1)=1$ and $f(1+h)=1+3h+2h^2$. Therefore the quotient is $3+2h$ for $h\ne0$, and its limit is $3$. The subtraction of $f(1)$ matters: omitting it would leave an unrelated expression with a nonvanishing numerator at zero.

Roots need a different algebraic move. For $f(x)=\sqrt{x}$ at $a=4$, multiply $[\sqrt{4+h}-2]/h$ by its conjugate factor to obtain $1/(\sqrt{4+h}+2)$. This tends to $1/4$. At inputs sufficiently close to $4$, the root is defined and the new denominator is nonzero. Such conditions are part of a valid calculation, not optional comments after an answer.

An equivalent definition is $f'(a)=\lim_{x\to a}[f(x)-f(a)]/(x-a)$. The substitution $h=x-a$ connects the two forms. In either form, first evaluate the fixed value correctly, then simplify the numerator, cancel or rationalize only where allowed, and finally take the limit. Retaining parentheses around the subtracted expression helps prevent sign errors.

The derivative may be positive, negative, or zero. A zero derivative says the instantaneous first-order rate vanishes; it does not say the function is constant on a neighborhood. For $x^2$ at zero, the quotient equals $h$ and the derivative is zero, although every nonzero nearby input has a positive output. A nonzero finite interval and a limiting rate answer different questions.`,
      terms: [
        term(
          'derivative-at-point',
          'Derivative at a point',
          'A finite limiting difference quotient.',
          R`$f'(a)=\lim_{h\to0}[f(a+h)-f(a)]/h$ when the finite limit exists.`,
          R`For $f(x)=x^2$, the quotient at $2$ is $4+h$, so $f'(2)=4$.`,
          'The definition takes a limit; it never divides by a zero increment.',
        ),
      ],
      questions: [
        exact(
          R`Use the difference quotient to find the derivative of $f(x)=x^2$ at $x=4$.`,
          8,
          R`$[(4+h)^2-16]/h=8+h\to8$.`,
        ),
        exact(
          R`Find $f'(2)$ from the definition for $f(x)=3x^2+1$.`,
          12,
          R`The numerator is $12h+3h^2$, so the quotient $12+3h$ tends to $12$.`,
        ),
        exact(
          R`Find $f'(0)$ from the definition for $f(x)=x^3$.`,
          0,
          R`The quotient is $h^3/h=h^2$, tending to $0$.`,
        ),
        exact(
          R`Find $f'(1)$ from the definition for $f(x)=1/x$.`,
          -1,
          R`$[1/(1+h)-1]/h=-1/(1+h)\to-1$.`,
        ),
        exact(
          R`Find $f'(9)$ from the definition for $f(x)=\sqrt{x}$.`,
          '1/6',
          R`Conjugate multiplication gives $1/(\sqrt{9+h}+3)\to1/6$.`,
        ),
        exact(
          R`Find $f'(a)$ for the constant function $f(x)=17$.`,
          0,
          R`Every nonzero-increment quotient is $(17-17)/h=0$.`,
        ),
        exact(
          R`Evaluate $\lim_{h\to0}[(2+h)^3-8]/h$.`,
          12,
          R`Expansion gives $12+6h+h^2$, whose limit is $12$.`,
        ),
        bool(
          'If the derivative at a point is zero, must the function be constant near that point?',
          false,
          R`No. The function $x^2$ has derivative zero at $0$ but varies on every neighborhood.`,
        ),
        open(
          R`Derive $f'(a)$ for $f(x)=x^2$ directly for an arbitrary real $a$.`,
          R`For $h\ne0$, $[(a+h)^2-a^2]/h=2a+h$. Taking the limit gives $f'(a)=2a$.`,
          'prove',
        ),
        open(
          R`Explain why $[f(a+0)-f(a)]/0$ is not another way to write the derivative.`,
          R`That quotient is undefined. The derivative is a limit of quotients with nonzero denominators and may exist even though the quotient has no value at zero.`,
        ),
      ],
      review: [
        exact(
          R`For $f(x)=x^2-4x$, calculate $f'(3)$ directly.`,
          2,
          R`The difference quotient at $3$ is $2+h$, which tends to $2$.`,
        ),
        exact(
          R`Evaluate $\lim_{h\to0}[1/(2+h)-1/2]/h$.`,
          '-1/4',
          R`Combining fractions gives $-1/[2(2+h)]\to-1/4$.`,
        ),
        exact(
          R`Find the derivative of $\sqrt{x}$ at $x=25$ by rationalizing.`,
          '1/10',
          R`The quotient becomes $1/(\sqrt{25+h}+5)$ and tends to $1/10$.`,
        ),
      ],
    },
    {
      title: 'Derivative functions and successive rates',
      sources: [source('3.2', 'Derivative functions, notation, higher derivatives and domains.')],
      body: R`Instead of fixing one numerical input, we can carry out the limiting calculation at a variable input $x$. The result is a derivative function $f'$ whose value at each permitted input is the slope there. For $f(x)=x^3$, expansion gives $[(x+h)^3-x^3]/h=3x^2+3xh+h^2$. Taking the limit with $x$ fixed yields $f'(x)=3x^2$. Substituting a number into this new function produces a derivative at a point.

Keep the original function and the derivative function distinct. At $x=2$, the height of the cubic is $f(2)=8$, while its slope is $f'(2)=12$. They generally have different units, and knowing a slope alone does not determine a height. The functions $x^2$ and $x^2+7$ have identical derivative functions because subtracting the two nearby heights cancels any constant vertical shift.

Other common notations are $y'$ and $dy/dx$ when $y=f(x)$, and $d f/dx$ or $(d/dx)f(x)$ when emphasizing the differentiation operation. At this stage, $dy/dx$ names a derivative; it is not obtained by selecting two arbitrary infinitesimal real numbers and dividing them. Later the chain rule will explain why the notation fits composition so well. If the independent variable is time, use $ds/dt$ instead of silently differentiating with respect to a different variable.

The derivative has a domain of its own. For $f(x)=1/x$, direct algebra gives $f'(x)=-1/x^2$ for $x\ne0$. Neither formula applies at zero. For $\sqrt{x}$ the original domain includes zero, but the ordinary derivative formula $1/(2\sqrt{x})$ applies only for $x>0$.

We may differentiate a derivative when it is differentiable. The second derivative is $f''=(f')'$, also written $d^2f/dx^2$. For a position function, the first derivative is velocity and the second is acceleration. If $s(t)=t^3$, then $s'(t)=3t^2$ and $s''(t)=6t$. Successive differentiation describes successive rates of change; it does not square the first derivative.`,
      terms: [
        term(
          'derivative-function',
          'Derivative function',
          'The function assigning a slope to each eligible input.',
          R`$f'$ maps $x$ to the derivative of $f$ at $x$, wherever that derivative exists.`,
          R`If $f(x)=x^3$, then $f'(x)=3x^2$.`,
          'The output of the derivative is a rate, not the original height.',
        ),
        term(
          'second-derivative',
          'Second derivative',
          'The derivative of the first derivative.',
          R`$f''=(f')'$ measures how the first-order rate changes.`,
          R`For $s(t)=t^3$, $s''(t)=6t$.`,
          'It is not the square of the first derivative.',
        ),
      ],
      questions: [
        expr(
          R`Find the derivative function of $f(x)=x^2+8$ directly.`,
          '2*x',
          R`The constants cancel in the quotient, leaving $2x+h\to2x$.`,
        ),
        expr(
          R`Find the derivative function of $f(x)=5x-9$.`,
          '5',
          R`The numerator is $5h$, so the quotient and its limit are $5$.`,
        ),
        expr(
          R`Find the derivative function of $f(x)=x^3$.`,
          '3*x^2',
          R`The quotient is $3x^2+3xh+h^2$, which tends to $3x^2$.`,
        ),
        expr(
          R`Find the derivative function of $f(x)=1/x$ on $x\ne0$.`,
          '-1/x^2',
          R`The quotient simplifies to $-1/[x(x+h)]$, giving $-1/x^2$.`,
        ),
        exact(
          R`For $f(x)=x^3$, find $f'(-2)$.`,
          12,
          R`The derivative is $3x^2$; at $-2$ it equals $12$.`,
        ),
        expr(
          R`A position function has velocity $v(t)=t^2+3$. Find its acceleration as a function of $t$.`,
          '2*t',
          R`Differentiating velocity gives $a(t)=2t$.`,
          ['t'],
        ),
        exact(
          R`If $f(x)=x^2+7$, find $f''(3)$.`,
          2,
          R`The first derivative is $2x$ and the second derivative is constantly $2$.`,
        ),
        bool(
          R`Is $d^2y/dx^2$ generally equal to $(dy/dx)^2$?`,
          false,
          R`For $y=x^2$ the two expressions are $2$ and $4x^2$, which differ.`,
        ),
        open(
          R`Prove that adding a constant $C$ to a differentiable function does not change its derivative.`,
          R`For $g=f+C$, the difference $g(x+h)-g(x)$ equals $f(x+h)+C-f(x)-C=f(x+h)-f(x)$. Thus their difference quotients and limits agree.`,
          'prove',
        ),
        open(
          R`Explain the domain difference between $\sqrt{x}$ and its ordinary derivative.`,
          R`The original function is defined for $x\ge0$. At positive inputs its derivative is $1/(2\sqrt{x})$. At zero, the right-hand difference quotient $1/\sqrt{h}$ diverges rather than approaching a finite derivative.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $f(x)=2x^2-3$ using the difference quotient.`,
          '4*x',
          R`The quotient is $4x+2h$, so its limit is $4x$.`,
        ),
        exact(
          R`If $s(t)=t^3$, find the acceleration at $t=4$.`,
          24,
          R`Two derivatives give $s''(t)=6t$, so $s''(4)=24$.`,
        ),
        exact(
          R`If $f(x)=x^2$ and $g(x)=x^2-100$, find $f'(5)-g'(5)$.`,
          0,
          R`The constant shift cancels under differentiation, so both derivatives equal $10$.`,
        ),
      ],
    },
    {
      title: 'Tangent lines, velocity, and sensitivity',
      sources: [
        source('3.1', 'Tangent equations.'),
        source('3.4', 'Velocity, acceleration, marginal quantities and units.'),
      ],
      body: R`A finite derivative provides the slope needed for a tangent line. The line through $(a,f(a))$ with slope $f'(a)$ is $y=f(a)+f'(a)(x-a)$. This form keeps the point and slope visible. Compute both before simplifying; a correct derivative with the wrong point still gives the wrong line. A tangent is defined by local slope agreement, not by a rule that it can meet the graph only once. The tangent to $x^3$ at zero is $y=0$, which crosses the graph there.

For $f(x)=x^2-2x$ at $a=3$, we have $f(3)=3$ and $f'(3)=4$. The tangent is $y=3+4(x-3)=4x-9$. Substitution of $x=3$ checks the point, and its coefficient of $x$ checks the slope. If a normal line is requested, it is the perpendicular line through the same point. For a nonzero tangent slope $m$, the normal slope is $-1/m$. A horizontal tangent instead has a vertical normal, which cannot be written as $y=mx+b$.

In motion, position $s(t)$ is measured relative to an origin and orientation. Velocity $v=s'$ is signed; speed is $|v|$. Acceleration $a=v'$ is also signed. An object speeds up when nonzero velocity and acceleration have the same sign, and slows down when their signs differ. Positive acceleration alone does not imply increasing speed: a left-moving object with negative velocity and positive acceleration moves toward zero velocity.

A derivative can also measure sensitivity to an input other than time. If cost $C(q)$ is in dollars and production $q$ in units, $C'(q)$ is dollars per unit. Its use as an estimate of the cost of one extra unit assumes the local linear approximation is accurate over that increment. The continuous model itself may only approximate a discrete production process. State what the derivative actually measures before rounding, extrapolating, or interpreting it as a physical quantity.`,
      terms: [
        term(
          'tangent-line',
          'Tangent line',
          'The line matching a function value and finite derivative.',
          R`At $a$, its equation is $y=f(a)+f'(a)(x-a)$.`,
          R`For $x^2$ at $1$, the tangent is $y=1+2(x-1)$.`,
          'A tangent can cross the graph.',
        ),
        term(
          'velocity-speed',
          'Velocity and speed',
          'Velocity is signed; speed is its magnitude.',
          R`For position $s(t)$, velocity is $s'(t)$ and speed is $|s'(t)|$.`,
          R`Velocity $-3$ meters per second corresponds to speed $3$ meters per second.`,
          'Negative velocity does not mean negative speed.',
        ),
      ],
      questions: [
        expr(
          R`Give the tangent line's right-hand side $y=\dots$ for $f(x)=x^2$ at $x=3$.`,
          '6*x-9',
          R`The point is $(3,9)$ and slope $6$, so $y=9+6(x-3)=6x-9$.`,
        ),
        expr(
          R`Give the tangent line's right-hand side for $f(x)=x^3$ at $x=-1$.`,
          '3*x+2',
          R`The point is $(-1,-1)$ and slope $3$, so $y=-1+3(x+1)=3x+2$.`,
        ),
        exact(
          R`The tangent slope at a point is $-4$. Find the normal slope.`,
          '1/4',
          R`Perpendicular slopes satisfy $m_n m_t=-1$, giving $m_n=1/4$.`,
        ),
        exact(
          R`A particle has $s(t)=t^2-6t$ meters. Find velocity at $t=2$ seconds.`,
          -2,
          R`The derivative is $v(t)=2t-6$, so $v(2)=-2$ meters per second.`,
        ),
        exact(
          R`For $s(t)=t^2-6t$ meters, find speed at $t=2$ seconds.`,
          2,
          R`The velocity is $-2$ meters per second, so its magnitude is $2$.`,
        ),
        exact(
          R`For $s(t)=t^2-6t$, find the instant when velocity vanishes.`,
          3,
          R`Set $2t-6=0$, giving $t=3$.`,
        ),
        text(
          R`An object has velocity $-5$ and acceleration $2$ in consistent units. Is it speeding up or slowing down?`,
          'slowing down',
          R`Velocity and acceleration have opposite signs, so the magnitude of velocity is decreasing.`,
        ),
        exact(
          R`A continuous cost model is $C(q)=q^2+10q+50$ dollars. Find marginal cost at $q=4$ in dollars per unit.`,
          18,
          R`$C'(q)=2q+10$, so $C'(4)=18$.`,
        ),
        open(
          R`Find the tangent and normal lines to $y=x^2$ at zero, explaining the vertical-line case.`,
          R`The point is $(0,0)$ and tangent slope is zero, so the tangent is $y=0$. The perpendicular normal is vertical: $x=0$, not a line with a finite slope.`,
        ),
        open(
          R`A cost derivative is $12$ dollars per unit at output $100$. Explain what this says and what it does not guarantee.`,
          R`Near $100$ units, a small output change $\Delta q$ is predicted to change cost by about $12\Delta q$ dollars. It does not guarantee a constant marginal cost for large changes or an exact cost of the next discrete item.`,
        ),
      ],
      review: [
        expr(
          R`Give the tangent line's right-hand side for $f(x)=x^2+2$ at $x=-2$.`,
          '-4*x-2',
          R`The point is $(-2,6)$ and slope $-4$, so $y=6-4(x+2)=-4x-2$.`,
        ),
        exact(
          R`A particle's velocity is $v(t)=3t^2-12$. Find its speed at $t=1$.`,
          9,
          R`The velocity is $-9$, so speed is $9$.`,
        ),
        text(
          R`A particle has velocity $-3$ and acceleration $-2$. Is it speeding up or slowing down?`,
          'speeding up',
          R`Both signs are negative, so velocity becomes more negative and its magnitude increases.`,
        ),
      ],
    },
    {
      title: 'Where differentiability fails',
      sources: [
        source(
          '3.2',
          'Differentiability implies continuity; corners, cusps and vertical tangents.',
        ),
      ],
      body: R`A function is differentiable at an interior point when its two-sided difference quotient has a finite limit there. Several failures are worth separating. A jump or misplaced point prevents continuity and therefore prevents differentiability. A corner can be continuous while producing different finite one-sided slopes. A vertical tangent or cusp can produce unbounded slopes, so no finite ordinary derivative exists. A picture can suggest which failure occurs, but the difference quotient gives the decisive test.

For $f(x)=|x|$ at zero, the quotient is $|h|/h$. It equals $-1$ for negative $h$ and $1$ for positive $h$. Hence the graph is continuous but not differentiable there. The corner is not repaired by averaging the slopes into zero. For $f(x)=x^{1/3}$, the quotient at zero is $h^{-2/3}$, which tends to $+\infty$ from both sides. This gives a vertical tangent rather than a finite derivative. The distinction matters whenever a theorem requires differentiability.

Why does differentiability force continuity? For nonzero $h$, rewrite the function change as $f(a+h)-f(a)=h\,[f(a+h)-f(a)]/h$. If the quotient tends to the finite number $f'(a)$, the product tends to $0\cdot f'(a)=0$. Thus nearby outputs approach $f(a)$. The finiteness of the derivative is essential to this product-law argument. Continuity alone says changes vanish, but says nothing about how they compare with the shrinking input interval.

For piecewise functions, test value matching first, then slope matching. Suppose $f(x)=x^2$ for $x\le1$ and $f(x)=mx+b$ for $x>1$. Continuity requires $m+b=1$, while matching the left slope $2$ requires $m=2$. Together they give $m=2,b=-1$. Checking only slopes would miss a possible vertical jump; checking only values would miss a corner. Later differentiation rules will speed up the branch calculations, but they will not remove the need to inspect the join itself.

When a derivative is estimated from measured data, exact differentiability of the underlying function and reliability of the numerical estimate are separate issues. Shrinking a difference interval reduces the mathematical secant-to-tangent discrepancy for a differentiable function, but subtracting noisy nearby measurements can make the estimated rate unstable. For example, a fixed measurement error divided by a smaller time interval can grow in magnitude. The exercises here use exact functions or explicitly stated rates so that this measurement issue does not obscure the definition. In a real experiment, keep the sampling interval and measurement precision alongside a derivative estimate rather than interpreting every visible fluctuation as a property of the underlying motion.`,
      terms: [
        term(
          'differentiability',
          'Differentiability',
          'Existence of a finite derivative.',
          R`At an interior point, the two-sided difference quotient must converge to a finite real number.`,
          R`$|x|$ is not differentiable at $0$ because its one-sided slopes differ.`,
          'Continuity is necessary but not sufficient.',
        ),
        term(
          'corner',
          'Corner',
          'A continuous join with unequal finite one-sided slopes.',
          R`A corner prevents the ordinary derivative at the join.`,
          R`$|x|$ has slopes $-1$ and $1$ at zero from opposite sides.`,
          'Do not average the slopes to invent a derivative.',
        ),
      ],
      questions: [
        exact(
          R`Find the left-hand difference-quotient limit for $f(x)=|x|$ at zero.`,
          -1,
          R`For $h<0$, $|h|/h=-1$.`,
        ),
        exact(
          R`Find the right-hand difference-quotient limit for $f(x)=|x|$ at zero.`,
          1,
          R`For $h>0$, $|h|/h=1$.`,
        ),
        bool(
          R`Is $|x|$ differentiable at zero?`,
          false,
          R`The one-sided quotient limits $-1$ and $1$ differ.`,
        ),
        bool(
          R`Does differentiability at $a$ imply continuity at $a$?`,
          true,
          R`The function increment equals the finite-limit quotient times $h$, so it tends to zero.`,
        ),
        bool(
          R`Does continuity at $a$ imply differentiability at $a$?`,
          false,
          R`The continuous function $|x|$ at zero is a counterexample.`,
        ),
        exact(
          R`For $f(x)=x^2$ when $x\le2$ and $f(x)=mx+b$ when $x>2$, what $m$ is necessary for differentiability at $2$?`,
          4,
          R`The left derivative is $2(2)=4$, which the right linear slope must match.`,
        ),
        exact(
          R`For $f(x)=x^2$ when $x\le2$ and $f(x)=4x+b$ when $x>2$, what $b$ makes it differentiable at $2$?`,
          -4,
          R`Continuity requires $4=8+b$, so $b=-4$; slopes already match.`,
        ),
        text(
          R`Classify the failure for $x^{1/3}$ at zero as corner, vertical tangent, or jump.`,
          'vertical tangent',
          R`Its difference quotient is $h^{-2/3}\to+\infty$ from both sides.`,
        ),
        open(
          R`Show that redefining $f(0)=1$ while keeping $f(x)=x^2$ for $x\ne0$ destroys differentiability at zero.`,
          R`The nearby limit is $0$, not the assigned value $1$, so continuity fails. Differentiability would imply continuity and is therefore impossible. Directly, the quotient $(h^2-1)/h=h-1/h$ has no finite limit.`,
        ),
        open(
          R`Prove that differentiability at an interior point implies continuity there.`,
          R`Write $f(a+h)-f(a)=h\,[f(a+h)-f(a)]/h$ for nonzero $h$. The two factors tend to $0$ and the finite value $f'(a)$, respectively. Their product tends to zero, giving $\lim_{h\to0}f(a+h)=f(a)$.`,
          'prove',
        ),
      ],
      review: [
        bool(
          R`A graph is continuous at $1$ but has one-sided slopes $2$ and $5$. Is it differentiable there?`,
          false,
          R`The unequal one-sided slopes prevent a single derivative.`,
        ),
        exact(
          R`Join $f(x)=x^2$ for $x\le-1$ to $mx+b$ for $x>-1$ differentiably. What must $m$ be?`,
          -2,
          R`The left derivative at $-1$ is $2(-1)=-2$.`,
        ),
        exact(
          R`Join $x^2$ for $x\le-1$ to $-2x+b$ for $x>-1$ continuously. Find $b$.`,
          -1,
          R`Matching values gives $1=2+b$, so $b=-1$.`,
        ),
      ],
      quickCheck: qc(
        'Which statement is always valid at an interior point?',
        [
          'Continuity implies differentiability',
          'Differentiability implies continuity',
          'A vertical tangent has derivative zero',
        ],
        1,
        'A finite derivative forces the function increment to tend to zero. Corners show the converse fails; vertical slopes are not zero.',
      ),
    },
  ],
};
