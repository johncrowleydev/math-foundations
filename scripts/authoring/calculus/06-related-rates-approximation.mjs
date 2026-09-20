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
  number: 6,
  slug: 'calculus-related-rates-approximation',
  title: 'Related Rates and Local Approximation',
  intro: R`A derivative becomes useful in a model when we identify which quantities change together and what the rate's units mean. Related-rates problems connect changing quantities through an equation and differentiate that equation with respect to time. Local approximation uses the same derivative to predict a small change in output from a small change in input. Both techniques depend on keeping a changing variable distinct from its value at one instant. We will build equations before substituting measurements, then examine when a linear prediction is informative and where it can fail.`,
  sections: [
    {
      title: 'Model first, differentiate second',
      sources: [source('4.1', 'Related-rates setup, time dependence and chain rule.')],
      body: R`A related-rates problem gives an equation connecting quantities and asks how their rates are connected. Begin by naming the quantities, their units, and the common independent variable, usually time $t$. Write an equation valid throughout the motion or process, then differentiate it. Substitute values for a particular instant only after the differentiation. A quantity being equal to a number now does not mean it remains constant through time.

For a square of side length $s(t)$, area is $A(t)=s(t)^2$. The chain rule gives $A'=2ss'$. If the side is $5$ centimeters and increasing at $0.2$ centimeters per second, then $A'=2(5)(0.2)=2$ square centimeters per second. Substituting $s=5$ into the original equation before differentiating would produce $A=25$ and an incorrect zero rate; that equation describes one instant, not the process.

A rectangle has two potentially changing dimensions. From $A=lw$ we obtain $A'=l'w+lw'$. If $l=8$ meters, $w=3$ meters, $l'=1$ meter per minute, and $w'=-1/2$ meter per minute, then $A'=3-4=-1$ square meter per minute. The growing length does not guarantee growing area because the width simultaneously shrinks. The signs of the specified rates encode those directions of change.

Units can expose an incorrect setup. In $A'=2ss'$, length times length per time gives area per time. A proposed answer such as $2s'$ would have the wrong units. Units cannot prove the formula correct, but a mismatch proves that something needs repair.

Some equations contain constants and changing variables with similar symbols. For a circular ring whose outer radius is fixed and inner radius changes, only the inner-radius term contributes to the area rate. Mark genuinely fixed quantities before differentiating. If the model is only a local approximation itself, the rate inherits that limitation; an exact derivative of an approximate model is still a model prediction.`,
      terms: [
        term(
          'related-rates',
          'Related rates',
          'Rates linked by a shared equation.',
          R`Differentiate a relation among time-dependent quantities with respect to the same time variable.`,
          R`From $A=s^2$, obtain $A'=2ss'$.`,
          'A value at one instant is not a constant throughout the process.',
        ),
        term(
          'signed-rate',
          'Signed rate',
          'A rate carrying its direction of change.',
          R`A positive derivative denotes increase of the chosen quantity; a negative one denotes decrease.`,
          R`A shrinking width can have $w'=-1/2$ meters per minute.`,
          'Do not replace a decreasing rate by its positive magnitude.',
        ),
      ],
      questions: [
        exact(
          R`A square has side $4$ cm growing at $3$ cm/s. Find its area rate in $\mathrm{cm}^2/\mathrm{s}$.`,
          24,
          R`$A'=2ss'=2(4)(3)=24$.`,
        ),
        exact(
          R`A square has side $6$ cm shrinking at $1/2$ cm/s. Find its area rate in $\mathrm{cm}^2/\mathrm{s}$.`,
          -6,
          R`The signed side rate is $-1/2$, so $A'=2(6)(-1/2)=-6$.`,
        ),
        exact(
          R`A rectangle has $l=7,w=2,l'=3,w'=1$ in meters and minutes. Find its area rate in square meters per minute.`,
          13,
          R`$A'=l'w+lw'=3(2)+7(1)=13$.`,
        ),
        exact(
          R`A rectangle has $l=10,w=4,l'=1,w'=-1$ in meters and minutes. Find its area rate.`,
          -6,
          R`$A'=1(4)+10(-1)=-6$ square meters per minute.`,
        ),
        exact(
          R`For a rectangle, $l'=2$ cm/s and $w'=-1$ cm/s. Find its perimeter rate in cm/s.`,
          2,
          R`From $P=2l+2w$, $P'=2(2)+2(-1)=2$.`,
        ),
        exact(
          R`A square's area grows at $20$ square meters per minute when its side is $5$ meters. Find the side rate in meters per minute.`,
          2,
          R`Solve $20=2(5)s'$, giving $s'=2$.`,
        ),
        exact(
          R`The relation $y=x^2$ holds over time. At $x=3$ and $x'=-2$, find $y'$.`,
          -12,
          R`Differentiate with respect to time: $y'=2xx'=2(3)(-2)=-12$.`,
        ),
        exact(
          R`The relation $y=4x+7$ holds over time. If $x'=3$, find $y'$.`,
          12,
          R`The constant contributes zero, giving $y'=4x'=12$.`,
        ),
        open(
          R`Explain why setting $s=5$ before differentiating $A=s^2$ gives the wrong rate for a growing square.`,
          R`The equality $s=5$ describes only the instant of interest. Replacing the function $s(t)$ by the constant $5$ erases its change, so the resulting constant-area equation no longer describes the process.`,
        ),
        open(
          R`A rectangle's length increases while its width decreases. Explain what determines whether its area is increasing.`,
          R`The sign of $A'=l'w+lw'$ decides. The positive contribution from the growing length must be compared with the negative contribution from the shrinking width; neither rate alone suffices.`,
        ),
      ],
      review: [
        exact(
          R`A square has side $9$ meters and side rate $1/3$ meter per second. Find area rate.`,
          6,
          R`$2(9)(1/3)=6$ square meters per second.`,
        ),
        exact(
          R`A rectangle has $l=5,w=6,l'=-2,w'=3$ in consistent units. Find $A'$.`,
          3,
          R`$A'=(-2)(6)+5(3)=3$.`,
        ),
        exact(R`If $y=3x^2$ over time, $x=2$ and $x'=4$, find $y'$.`, 48, R`$y'=6xx'=6(2)(4)=48$.`),
      ],
      quickCheck: qc(
        'When should you substitute measurements that hold only at the instant of interest?',
        [
          'Before forming a model equation',
          'After differentiating the time-dependent equation',
          'Instead of differentiating',
        ],
        1,
        'Substituting an instantaneous value too early can incorrectly turn a changing quantity into a constant.',
      ),
    },
    {
      title: 'Circles, spheres, and similar shapes',
      sources: [source('4.1', 'Geometric related rates, volume and similar-triangle constraints.')],
      body: R`Geometric formulas become rate equations through the chain rule. For a circle, $A=\pi r^2$ gives $A'=2\pi rr'$, and circumference $C=2\pi r$ gives $C'=2\pi r'$. For a sphere, $V=(4/3)\pi r^3$ gives $V'=4\pi r^2r'$. The coefficient multiplying $r'$ is the derivative of the geometric quantity with respect to radius. Each formula answers a different measurement question, so identify area, circumference, or volume before using it.

Suppose a spherical bubble receives volume at $32\pi$ cubic centimeters per second when its radius is $2$ centimeters. Then $32\pi=4\pi(2)^2r'$, yielding $r'=2$ centimeters per second. A constant volume rate would not produce a constant radius rate: solving symbolically gives $r'=V'/(4\pi r^2)$, which decreases with radius when positive $V'$ is fixed.

Similar shapes often supply a missing relation. A conical tank of total height $6$ meters and top radius $3$ meters contains water to height $h$. Similar triangles give water-surface radius $r=h/2$. Substituting this relation into $V=(1/3)\pi r^2h$ yields $V=\pi h^3/12$, valid throughout filling. Thus $V'=(\pi/4)h^2h'$. If $V'=\pi$ cubic meters per minute and $h=2$ meters, the height rises at $1$ meter per minute.

This substitution is valid before differentiating because $r=h/2$ holds throughout the process. It differs from substituting the one-instant measurement $h=2$, which would erase the time dependence. A model relation eliminates a variable; an instantaneous value does not.

For a cylinder with fixed radius, volume is proportional to height and its rate relation is simpler: $V'=\pi r^2h'$. If the radius also changes, a second contribution $2\pi rr'h$ appears. These examples show why reading whether a dimension is fixed matters as much as knowing the shape's volume formula.`,
      terms: [
        term(
          'geometric-rate',
          'Geometric rate relation',
          'A geometric formula differentiated in time.',
          R`For a sphere, $V'=4\pi r^2r'$.`,
          R`Fixed inflow produces a radius rate inversely proportional to $r^2$.`,
          'Area rates and volume rates have different units.',
        ),
        term(
          'similarity-constraint',
          'Similarity constraint',
          'A ratio that remains valid throughout a changing shape.',
          R`Similar cross-sections can relate changing dimensions before differentiation.`,
          R`A cone with total radius-to-height ratio $1/2$ has $r=h/2$ for its water surface.`,
          'A persistent relation can be substituted early; an instantaneous measurement cannot.',
        ),
      ],
      questions: [
        exact(
          R`A circle has $r=3$ cm and $r'=2$ cm/s. Find $A'/\pi$.`,
          12,
          R`$A'=2\pi(3)(2)=12\pi$, so $A'/\pi=12$.`,
        ),
        exact(
          R`A circle's radius changes at $-3$ cm/s. Find $C'/\pi$.`,
          -6,
          R`$C'=2\pi r'=-6\pi$.`,
        ),
        exact(
          R`A sphere has radius $2$ m and $r'=3$ m/min. Find $V'/\pi$.`,
          48,
          R`$V'=4\pi(2)^2(3)=48\pi$.`,
        ),
        exact(
          R`A sphere has $V'=36\pi$ cubic cm/s and radius $3$ cm. Find $r'$ in cm/s.`,
          1,
          R`$36\pi=4\pi(9)r'$, so $r'=1$.`,
        ),
        exact(
          R`A sphere with constant positive volume inflow doubles its radius. What is the new radius rate divided by the old radius rate?`,
          '1/4',
          R`The rate is inversely proportional to $r^2$, so doubling radius divides the rate by $4$.`,
        ),
        exact(
          R`A conical tank has water radius $r=h/3$. Express $V$ as $k\pi h^3$ and give $k$.`,
          '1/27',
          R`$V=(\pi/3)(h^2/9)h=\pi h^3/27$.`,
        ),
        exact(
          R`In a cone with $r=h/3$, water enters at $\pi$ cubic meters per minute. Find $h'$ when $h=3$ meters.`,
          1,
          R`$V'=\pi h^2h'/9$; at $h=3$, $\pi=\pi h'$.`,
        ),
        exact(
          R`A cylinder has fixed radius $2$ m and height rate $3$ m/min. Find $V'/\pi$.`,
          12,
          R`$V'=\pi(2)^2(3)=12\pi$.`,
        ),
        open(
          R`Derive the volume rate for a cylinder whose radius and height both vary.`,
          R`Starting from $V=\pi r^2h$, the product and chain rules give $V'=2\pi rr'h+\pi r^2h'$. Each changing dimension contributes a term.`,
        ),
        open(
          R`Why may $r=h/3$ be substituted into a cone's volume formula before differentiating, while $h=3$ at one instant may not?`,
          R`The similarity relation holds for all stages of filling and preserves the variable height. The measurement $h=3$ fixes only one instant and would incorrectly replace a changing function by a constant.`,
        ),
      ],
      review: [
        exact(
          R`A sphere has radius $4$ and volume rate $64\pi$ in consistent units. Find its radius rate.`,
          1,
          R`$64\pi=4\pi(16)r'$, giving $r'=1$.`,
        ),
        exact(
          R`A circle has radius $5$ and area rate $30\pi$. Find its radius rate.`,
          3,
          R`$30\pi=2\pi(5)r'$, so $r'=3$.`,
        ),
        exact(
          R`A fixed-radius cylinder has radius $3$ and volume rate $18\pi$. Find its height rate.`,
          2,
          R`$18\pi=9\pi h'$, giving $h'=2$.`,
        ),
      ],
    },
    {
      title: 'Distances, angles, and moving constraints',
      sources: [source('4.1', 'Pythagorean and trigonometric related-rate models.')],
      body: R`Distance constraints are often expressed more simply through squared distances than through square roots. If a fixed-length ladder has horizontal foot distance $x(t)$ and vertical top height $y(t)$, then $x^2+y^2=L^2$. Differentiating with fixed $L$ gives $2xx'+2yy'=0$, so $y'=-xx'/y$ when $y\ne0$. If $L=10$, $x=6$, $y=8$, and the foot moves outward at $2$ meters per second, the top descends at $-3/2$ meters per second. The negative answer is expected because the height decreases.

The ladder formula predicts a large downward speed as $y$ becomes very small for fixed outward speed. That is a statement about an ideal rigid ladder constrained to maintain contact, not a guarantee that a real object can follow the ideal motion indefinitely. Before interpreting a limiting rate, check whether the model still makes physical sense.

For two moving objects, both coordinate contributions matter. If their separation satisfies $d^2=x^2+y^2$, then $dd'=xx'+yy'$. At a moment with $x=3,y=4,x'=2,y'=1$, the separation is $5$ and $d'=(6+4)/5=2$ units per time. Coordinate rates can have either sign depending on how the coordinates and directions were defined. Drawing a labeled right triangle helps keep these choices consistent.

Angles can also vary. For an observer a fixed horizontal distance $a$ from a rising object, $\tan\theta=h/a$. Differentiating gives $\sec^2\theta\,\theta'=h'/a$. Since $\sec^2\theta=1+(h/a)^2$, we obtain $\theta'=ah'/(a^2+h^2)$ in radians per time. At $a=4,h=3,h'=5$, the angular rate is $20/25=4/5$ radians per time. No inverse-trigonometric value is needed.

In every case, solve any missing instantaneous lengths from the original geometric relation, then substitute them into the differentiated relation. This separation keeps the constraint, rates, and one-time measurements from being mixed into an equation that no longer represents the actual dependency.`,
      terms: [
        term(
          'moving-distance',
          'Moving distance constraint',
          'A relation linking changing coordinate distances.',
          R`From $d^2=x^2+y^2$, differentiation gives $dd'=xx'+yy'$.`,
          R`Both horizontal and vertical motion can contribute to a separation rate.`,
          'Using only one coordinate rate ignores part of the motion.',
        ),
        term(
          'angular-rate',
          'Angular rate',
          'The derivative of an angle with respect to time.',
          R`Trigonometric rate formulas use radians per time unit.`,
          R`For $\tan\theta=h/a$ with fixed $a$, $\theta'=ah'/(a^2+h^2)$.`,
          'Angle units affect the derivative scale.',
        ),
      ],
      questions: [
        exact(
          R`A $13$ m ladder has foot distance $5$ m, top height $12$ m, and foot rate $3$ m/s outward. Find the signed top rate in m/s.`,
          '-5/4',
          R`$y'=-xx'/y=-5(3)/12=-5/4$.`,
        ),
        exact(R`A $10$ m ladder has $x=8,y=6$ and $x'=3/2$. Find $y'$.`, -2, R`$y'=-8(3/2)/6=-2$.`),
        exact(
          R`For a ladder, $x=3,y=4$ and $y'=-3$. Find $x'$.`,
          4,
          R`$xx'+yy'=0$ gives $3x'-12=0$, so $x'=4$.`,
        ),
        exact(
          R`A nonnegative distance $d$ satisfies $d^2=x^2+y^2$. If $x=6,y=8,x'=1,y'=2$, find $d'$.`,
          '11/5',
          R`$d=10$, so $d'=(6+16)/10=11/5$.`,
        ),
        exact(
          R`A nonnegative distance $d$ satisfies $d^2=x^2+y^2$. If $x=3,y=4,x'=-2,y'=1$, find $d'$.`,
          '-2/5',
          R`The separation is $5$, and $d'=(-6+4)/5=-2/5$.`,
        ),
        exact(
          R`An observer is $3$ m horizontally from a rising object at height $4$ m. Its height rate is $5$ m/s. Find the angular rate in radians per second.`,
          '3/5',
          R`$\theta'=ah'/(a^2+h^2)=3(5)/25=3/5$.`,
        ),
        exact(
          R`For fixed $a=5$, a rising object is at height $h=0$ with $h'=2$. Find its elevation-angle rate in radians per time unit.`,
          '2/5',
          R`$\theta'=5(2)/(25+0)=2/5$.`,
        ),
        exact(
          R`A point moves along $y=x^2$. At $x=2$ its vertical rate is $8$. Find its horizontal rate.`,
          2,
          R`$y'=2xx'$ gives $8=4x'$, so $x'=2$.`,
        ),
        open(
          R`Derive the observer's angular-rate formula from $\tan\theta=h/a$, with $a$ fixed.`,
          R`Differentiate: $\sec^2\theta\,\theta'=h'/a$. Substitute $\sec^2\theta=1+h^2/a^2$ and solve: $\theta'=ah'/(a^2+h^2)$.`,
          'prove',
        ),
        open(
          R`Why should a negative separation rate be retained instead of reported as a positive speed?`,
          R`The requested derivative describes whether separation increases or decreases. A negative value means the objects are approaching. Taking its absolute value would erase that information and answer a different question.`,
        ),
      ],
      review: [
        exact(R`For a ladder with $x=9,y=12,x'=2$, find $y'$.`, '-3/2', R`$y'=-9(2)/12=-3/2$.`),
        exact(
          R`For nonnegative distance $d$ satisfying $d^2=x^2+y^2$ with $x=5,y=12,x'=1,y'=0$, find $d'$.`,
          '5/13',
          R`$d=13$ and $d'=(5+0)/13=5/13$.`,
        ),
        exact(
          R`For an observer with fixed $a=2$, height $h=2$ and rise rate $h'=4$, find angular rate in radians per time unit.`,
          1,
          R`$\theta'=2(4)/(4+4)=1$.`,
        ),
      ],
    },
    {
      title: 'Linear approximation from a tangent',
      sources: [source('4.2', 'Linearization, small changes and approximation limitations.')],
      body: R`Differentiability means more than the existence of a tangent slope: it means the tangent provides a good first-order description of sufficiently small changes. Near a known input $a$, define the linearization $L(x)=f(a)+f'(a)(x-a)$. Then $f(a+h)\approx f(a)+f'(a)h$ for small $h$. The approximation uses an exact value and derivative at a convenient anchor, not necessarily at the requested input.

For $f(x)=\sqrt{x}$ near $a=9$, the anchor value is $3$ and slope is $1/6$. Thus $L(x)=3+(x-9)/6$. At $x=9.12$, the linear estimate is $3+0.12/6=3.02$. This is an approximation, so keep the approximate sign when using it as a value of the original square root. The linear expression itself is exactly $3.02$ at that input.

For $f(x)=1/x$ near $a=5$, the linearization is $1/5-(x-5)/25$. At $5.1$ it predicts $1/5-0.1/25=0.196$, while the exact reciprocal is $10/51$. The omitted behavior arises because the slope changes as $x$ changes. A nearby anchor makes the linear model more plausible than a distant one, but a numerical error guarantee requires additional information.

The derivative definition explains the nature of the approximation. Write the error as $E(h)=f(a+h)-f(a)-f'(a)h$. For nonzero $h$, $E(h)/h=[f(a+h)-f(a)]/h-f'(a)\to0$. Thus the error becomes small relative to the input increment. This is stronger than merely saying both the function change and approximation error tend to zero.

A local prediction should not be extrapolated arbitrarily. The linearization of $1/x$ at $1$ is $2-x$, which becomes negative for $x>2$, although the reciprocal stays positive there. The contradiction is a warning about leaving the local regime, not a failure of the derivative calculation. Domain restrictions also remain: a tangent formula may be defined where the original function is not.

Selecting an anchor is part of solving an approximation problem. To estimate $\sqrt{48.9}$, the nearby perfect square $49$ gives exact anchor value $7$ and slope $1/14$, so the linear estimate is $7-0.1/14$. Anchoring at $1$ would use the same derivative formula correctly but would extrapolate over a much larger interval. If the task provides a measured value and derivative at a specified anchor, use that information directly rather than assuming a global function formula. The local expression $f(a)+f'(a)(x-a)$ is useful precisely because it can be formed from a small amount of local data, with its limitation to nearby inputs kept explicit.`,
      terms: [
        term(
          'linearization',
          'Linearization',
          'The tangent-based local model of a function.',
          R`At $a$, $L(x)=f(a)+f'(a)(x-a)$.`,
          R`For $\sqrt{x}$ at $9$, $L(x)=3+(x-9)/6$.`,
          'A linearization is generally approximate away from the anchor.',
        ),
        term(
          'first-order-error',
          'First-order approximation error',
          'Error small relative to the input increment.',
          R`Differentiability gives $[f(a+h)-f(a)-f'(a)h]/h\to0$.`,
          R`For $f(x)=x^2$, the tangent error is $h^2$.`,
          'Small absolute error alone is a weaker statement.',
        ),
      ],
      questions: [
        expr(
          R`Find the linearization of $x^2$ at $a=3$, written as a function of $x$.`,
          '6*x-9',
          R`$f(3)=9$ and $f'(3)=6$, so $L(x)=9+6(x-3)=6x-9$.`,
        ),
        exact(
          R`Use the linearization of $x^2$ at $3$ to estimate $(3.02)^2$.`,
          '228/25',
          R`The prediction is $9+6(0.02)=9.12=228/25$.`,
        ),
        exact(
          R`Use the linearization of $\sqrt{x}$ at $16$ to estimate $\sqrt{16.08}$.`,
          '401/100',
          R`$f(16)=4$ and $f'(16)=1/8$, so the estimate is $4+0.08/8=4.01$.`,
        ),
        exact(
          R`Use the linearization of $1/x$ at $2$ to estimate $1/2.04$.`,
          '49/100',
          R`$L=1/2-(0.04)/4=0.49$.`,
        ),
        exact(
          R`Use the linearization of $e^x$ at $0$ to estimate $e^{0.03}$.`,
          '103/100',
          R`The anchor value and slope are both $1$, giving $1+0.03=1.03$.`,
        ),
        exact(
          R`Use the linearization of $\ln x$ at $1$ to estimate $\ln(1.02)$.`,
          '1/50',
          R`$L(x)=x-1$, so the estimate is $0.02=1/50$.`,
        ),
        exact(
          R`If $f(5)=12$ and $f'(5)=-3$, estimate $f(5.1)$ linearly.`,
          '117/10',
          R`$12+(-3)(0.1)=11.7$.`,
        ),
        exact(
          R`If $f(2)=8$ and $f'(2)=4$, estimate $f(1.95)$ linearly.`,
          '39/5',
          R`The increment is $-0.05$, so the estimate is $8-0.2=7.8$.`,
        ),
        open(
          R`Derive the exact linearization error for $f(x)=x^2$ at an arbitrary anchor $a$.`,
          R`At input $a+h$, the linear model gives $a^2+2ah$. The exact value is $a^2+2ah+h^2$, so the error is $h^2$, and error divided by $h$ tends to zero.`,
        ),
        open(
          R`Explain why the linearization of $1/x$ at $1$ should not be used to predict its value at $100$.`,
          R`It gives $2-100=-98$, while the original function is positive and equals $0.01$. The tangent is a local model near $1$; the large interval changes the slope substantially.`,
        ),
      ],
      review: [
        exact(
          R`Use the linearization of $\sqrt{x}$ at $25$ to estimate $\sqrt{25.2}$.`,
          '251/50',
          R`The slope is $1/10$, so the prediction is $5+0.2/10=5.02$.`,
        ),
        exact(
          R`If $f(4)=7$ and $f'(4)=2$, estimate $f(3.9)$ linearly.`,
          '34/5',
          R`The increment is $-0.1$, giving $7-0.2=6.8$.`,
        ),
        exact(
          R`Use $e^x\approx1+x$ near zero to estimate $e^{-0.04}$.`,
          '24/25',
          R`The linear estimate is $1-0.04=0.96=24/25$.`,
        ),
      ],
      quickCheck: qc(
        R`What does $f(a+h)\approx f(a)+f'(a)h$ require in general?`,
        [
          'A sufficiently small increment around a differentiable anchor',
          'That the derivative is constant everywhere',
          'That every estimate is exact',
        ],
        0,
        'Differentiability supports a local first-order model. Exactness for all increments is a special property of affine functions.',
      ),
    },
    {
      title: 'Differentials, measurement error, and sensitivity',
      sources: [source('4.2', 'Differentials, relative error and limits of linear approximation.')],
      body: R`A differential is the linearized change associated with a chosen input increment. Set $dx=\Delta x$ and define $dy=f'(x)dx$. The actual change is $\Delta y=f(x+\Delta x)-f(x)$. These quantities are generally different, though $dy$ approximates $\Delta y$ when the increment is sufficiently small. The symbols do not convert an approximation into an exact equality.

For $y=x^2$ at $x=4$ with $dx=0.1$, the differential is $dy=8(0.1)=0.8$. The exact change is $4.1^2-4^2=0.81$. The difference $0.01$ is the squared increment. Writing both values makes the retained first-order contribution and omitted higher-order contribution concrete.

Measurement uncertainty can be propagated through a model using the same idea. For a sphere $V=(4/3)\pi r^3$, a small radius error $dr$ predicts $dV=4\pi r^2dr$. Dividing by $V$ gives $dV/V=3dr/r$. Thus a small relative radius error of one percent predicts about three percent relative volume error. This is a first-order estimate, not a bound valid for arbitrary errors. The exact multiplier from a relative radius change $\eta$ is $(1+\eta)^3$, which also contains $3\eta^2+\eta^3$ beyond the linear term.

A derivative's magnitude measures absolute sensitivity, but relative sensitivity compares scales. For nonzero $x$ and $f(x)$, the ratio of predicted relative output change to relative input change is $xf'(x)/f(x)$. Its magnitude describes how much a small relative input perturbation is amplified in this scalar model. For a power $f(x)=x^n$ on positive inputs, the ratio is $n$. This is a local statement; near a zero output, relative error can be large or undefined even when absolute error is modest.

When an uncertainty is stated as “at most” a value, a differential is still only an estimate unless a separate derivative bound or exact calculation supplies a rigorous guarantee. Keep approximate error propagation, exact changes, and guaranteed bounds distinct. The next lessons introduce tools for bounding changes more formally.`,
      terms: [
        term(
          'differential',
          'Differential',
          'The linear part of a predicted output change.',
          R`With chosen $dx$, define $dy=f'(x)dx$; compare it with the actual $\Delta y$.`,
          R`For $x^2$ at $4$ and $dx=0.1$, $dy=0.8$ but $\Delta y=0.81$.`,
          'The differential is generally not the exact change.',
        ),
        term(
          'relative-error',
          'Relative error',
          'Error compared with the underlying amount.',
          R`A first-order relative output change is $dy/y$ when $y\ne0$.`,
          R`For sphere volume, $dV/V=3dr/r$.`,
          'A linear error estimate is not automatically a rigorous maximum-error bound.',
        ),
      ],
      questions: [
        exact(
          R`For $y=x^2$ at $x=5$ with $dx=0.02$, find $dy$.`,
          '1/5',
          R`$dy=2x\,dx=10(0.02)=0.2$.`,
        ),
        exact(
          R`For $y=x^2$ at $x=5$ with $\Delta x=0.02$, find the exact $\Delta y$.`,
          '501/2500',
          R`$(5.02)^2-25=0.2004=501/2500$.`,
        ),
        exact(
          R`For $y=1/x$ at $x=4$ with $dx=0.08$, find $dy$.`,
          '-1/200',
          R`$dy=-dx/x^2=-0.08/16=-0.005$.`,
        ),
        exact(
          R`A sphere's radius has a small relative change $dr/r=0.02$. Give the differential estimate $dV/V$.`,
          '3/50',
          R`The first-order relative volume change is $3(0.02)=0.06$.`,
        ),
        exact(
          R`A circle's radius has small relative change $dr/r=-0.01$. Find $dA/A$.`,
          '-1/50',
          R`For $A=\pi r^2$, $dA/A=2dr/r=-0.02$.`,
        ),
        exact(
          R`For $y=x^4$ at positive inputs, what is the relative sensitivity $xy'/y$?`,
          4,
          R`$x(4x^3)/x^4=4$.`,
        ),
        exact(
          R`For $y=\sqrt{x}$ at positive inputs, what is $xy'/y$?`,
          '1/2',
          R`$x/[2\sqrt{x}\sqrt{x}]=1/2$.`,
        ),
        bool(
          'Does a differential error estimate automatically supply a rigorous maximum-error bound?',
          false,
          'No. It retains only the linear change; a bound on neglected behavior or an exact calculation is needed for a guarantee.',
        ),
        open(
          R`Compare exact and first-order fractional area changes when a circle's radius increases by a fraction $\eta$.`,
          R`The exact area multiplier is $(1+\eta)^2$, so the exact fractional change is $2\eta+\eta^2$. The differential predicts $2\eta$ and omits the quadratic term.`,
        ),
        open(
          R`Explain why relative output error is not useful at a point where the modeled output equals zero.`,
          R`Relative error divides by the output, so it is undefined at zero. Absolute error or another meaningful reference scale must be used instead.`,
        ),
      ],
      review: [
        exact(
          R`For $y=x^3$ at $x=2$ with $dx=0.01$, find $dy$.`,
          '3/25',
          R`$dy=3(2)^2(0.01)=0.12=3/25$.`,
        ),
        exact(
          R`A sphere's radius uncertainty is estimated as $0.5\%$. Give the first-order percentage volume uncertainty.`,
          '3/2',
          R`Multiply the radius percentage by $3$, giving about $1.5\%$.`,
        ),
        exact(
          R`For $y=1/x$ at positive inputs, find the signed relative sensitivity $xy'/y$.`,
          -1,
          R`$x(-1/x^2)/(1/x)=-1$: a small positive relative input change produces an opposite relative output change.`,
        ),
      ],
    },
  ],
};
