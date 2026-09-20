# Related Rates and Local Approximation

A derivative becomes useful in a model when we identify which quantities change together and what the rate's units mean. Related-rates problems connect changing quantities through an equation and differentiate that equation with respect to time. Local approximation uses the same derivative to predict a small change in output from a small change in input. Both techniques depend on keeping a changing variable distinct from its value at one instant. We will build equations before substituting measurements, then examine when a linear prediction is informative and where it can fail.

## Model first, differentiate second

A related-rates problem gives an equation connecting quantities and asks how their rates are connected. Begin by naming the quantities, their units, and the common independent variable, usually time $t$. Write an equation valid throughout the motion or process, then differentiate it. Substitute values for a particular instant only after the differentiation. A quantity being equal to a number now does not mean it remains constant through time.

For a square of side length $s(t)$, area is $A(t)=s(t)^2$. The chain rule gives $A'=2ss'$. If the side is $5$ centimeters and increasing at $0.2$ centimeters per second, then $A'=2(5)(0.2)=2$ square centimeters per second. Substituting $s=5$ into the original equation before differentiating would produce $A=25$ and an incorrect zero rate; that equation describes one instant, not the process.

A rectangle has two potentially changing dimensions. From $A=lw$ we obtain $A'=l'w+lw'$. If $l=8$ meters, $w=3$ meters, $l'=1$ meter per minute, and $w'=-1/2$ meter per minute, then $A'=3-4=-1$ square meter per minute. The growing length does not guarantee growing area because the width simultaneously shrinks. The signs of the specified rates encode those directions of change.

Units can expose an incorrect setup. In $A'=2ss'$, length times length per time gives area per time. A proposed answer such as $2s'$ would have the wrong units. Units cannot prove the formula correct, but a mismatch proves that something needs repair.

Some equations contain constants and changing variables with similar symbols. For a circular ring whose outer radius is fixed and inner radius changes, only the inner-radius term contributes to the area rate. Mark genuinely fixed quantities before differentiating. If the model is only a local approximation itself, the rate inherits that limitation; an exact derivative of an approximate model is still a model prediction.

Related definitions: [Related rates](ref:calculus-related-rates); [Signed rate](ref:calculus-signed-rate).

## Circles, spheres, and similar shapes

Geometric formulas become rate equations through the chain rule. For a circle, $A=\pi r^2$ gives $A'=2\pi rr'$, and circumference $C=2\pi r$ gives $C'=2\pi r'$. For a sphere, $V=(4/3)\pi r^3$ gives $V'=4\pi r^2r'$. The coefficient multiplying $r'$ is the derivative of the geometric quantity with respect to radius. Each formula answers a different measurement question, so identify area, circumference, or volume before using it.

Suppose a spherical bubble receives volume at $32\pi$ cubic centimeters per second when its radius is $2$ centimeters. Then $32\pi=4\pi(2)^2r'$, yielding $r'=2$ centimeters per second. A constant volume rate would not produce a constant radius rate: solving symbolically gives $r'=V'/(4\pi r^2)$, which decreases with radius when positive $V'$ is fixed.

Similar shapes often supply a missing relation. A conical tank of total height $6$ meters and top radius $3$ meters contains water to height $h$. Similar triangles give water-surface radius $r=h/2$. Substituting this relation into $V=(1/3)\pi r^2h$ yields $V=\pi h^3/12$, valid throughout filling. Thus $V'=(\pi/4)h^2h'$. If $V'=\pi$ cubic meters per minute and $h=2$ meters, the height rises at $1$ meter per minute.

This substitution is valid before differentiating because $r=h/2$ holds throughout the process. It differs from substituting the one-instant measurement $h=2$, which would erase the time dependence. A model relation eliminates a variable; an instantaneous value does not.

For a cylinder with fixed radius, volume is proportional to height and its rate relation is simpler: $V'=\pi r^2h'$. If the radius also changes, a second contribution $2\pi rr'h$ appears. These examples show why reading whether a dimension is fixed matters as much as knowing the shape's volume formula.

Related definitions: [Geometric rate relation](ref:calculus-geometric-rate); [Similarity constraint](ref:calculus-similarity-constraint).

## Distances, angles, and moving constraints

Distance constraints are often expressed more simply through squared distances than through square roots. If a fixed-length ladder has horizontal foot distance $x(t)$ and vertical top height $y(t)$, then $x^2+y^2=L^2$. Differentiating with fixed $L$ gives $2xx'+2yy'=0$, so $y'=-xx'/y$ when $y\ne0$. If $L=10$, $x=6$, $y=8$, and the foot moves outward at $2$ meters per second, the top descends at $-3/2$ meters per second. The negative answer is expected because the height decreases.

The ladder formula predicts a large downward speed as $y$ becomes very small for fixed outward speed. That is a statement about an ideal rigid ladder constrained to maintain contact, not a guarantee that a real object can follow the ideal motion indefinitely. Before interpreting a limiting rate, check whether the model still makes physical sense.

For two moving objects, both coordinate contributions matter. If their separation satisfies $d^2=x^2+y^2$, then $dd'=xx'+yy'$. At a moment with $x=3,y=4,x'=2,y'=1$, the separation is $5$ and $d'=(6+4)/5=2$ units per time. Coordinate rates can have either sign depending on how the coordinates and directions were defined. Drawing a labeled right triangle helps keep these choices consistent.

Angles can also vary. For an observer a fixed horizontal distance $a$ from a rising object, $\tan\theta=h/a$. Differentiating gives $\sec^2\theta\,\theta'=h'/a$. Since $\sec^2\theta=1+(h/a)^2$, we obtain $\theta'=ah'/(a^2+h^2)$ in radians per time. At $a=4,h=3,h'=5$, the angular rate is $20/25=4/5$ radians per time. No inverse-trigonometric value is needed.

In every case, solve any missing instantaneous lengths from the original geometric relation, then substitute them into the differentiated relation. This separation keeps the constraint, rates, and one-time measurements from being mixed into an equation that no longer represents the actual dependency.

Related definitions: [Moving distance constraint](ref:calculus-moving-distance); [Angular rate](ref:calculus-angular-rate).

## Linear approximation from a tangent

Differentiability means more than the existence of a tangent slope: it means the tangent provides a good first-order description of sufficiently small changes. Near a known input $a$, define the linearization $L(x)=f(a)+f'(a)(x-a)$. Then $f(a+h)\approx f(a)+f'(a)h$ for small $h$. The approximation uses an exact value and derivative at a convenient anchor, not necessarily at the requested input.

For $f(x)=\sqrt{x}$ near $a=9$, the anchor value is $3$ and slope is $1/6$. Thus $L(x)=3+(x-9)/6$. At $x=9.12$, the linear estimate is $3+0.12/6=3.02$. This is an approximation, so keep the approximate sign when using it as a value of the original square root. The linear expression itself is exactly $3.02$ at that input.

For $f(x)=1/x$ near $a=5$, the linearization is $1/5-(x-5)/25$. At $5.1$ it predicts $1/5-0.1/25=0.196$, while the exact reciprocal is $10/51$. The omitted behavior arises because the slope changes as $x$ changes. A nearby anchor makes the linear model more plausible than a distant one, but a numerical error guarantee requires additional information.

The derivative definition explains the nature of the approximation. Write the error as $E(h)=f(a+h)-f(a)-f'(a)h$. For nonzero $h$, $E(h)/h=[f(a+h)-f(a)]/h-f'(a)\to0$. Thus the error becomes small relative to the input increment. This is stronger than merely saying both the function change and approximation error tend to zero.

A local prediction should not be extrapolated arbitrarily. The linearization of $1/x$ at $1$ is $2-x$, which becomes negative for $x>2$, although the reciprocal stays positive there. The contradiction is a warning about leaving the local regime, not a failure of the derivative calculation. Domain restrictions also remain: a tangent formula may be defined where the original function is not.

Selecting an anchor is part of solving an approximation problem. To estimate $\sqrt{48.9}$, the nearby perfect square $49$ gives exact anchor value $7$ and slope $1/14$, so the linear estimate is $7-0.1/14$. Anchoring at $1$ would use the same derivative formula correctly but would extrapolate over a much larger interval. If the task provides a measured value and derivative at a specified anchor, use that information directly rather than assuming a global function formula. The local expression $f(a)+f'(a)(x-a)$ is useful precisely because it can be formed from a small amount of local data, with its limitation to nearby inputs kept explicit.

Related definitions: [Linearization](ref:calculus-linearization); [First-order approximation error](ref:calculus-first-order-error).

## Differentials, measurement error, and sensitivity

A differential is the linearized change associated with a chosen input increment. Set $dx=\Delta x$ and define $dy=f'(x)dx$. The actual change is $\Delta y=f(x+\Delta x)-f(x)$. These quantities are generally different, though $dy$ approximates $\Delta y$ when the increment is sufficiently small. The symbols do not convert an approximation into an exact equality.

For $y=x^2$ at $x=4$ with $dx=0.1$, the differential is $dy=8(0.1)=0.8$. The exact change is $4.1^2-4^2=0.81$. The difference $0.01$ is the squared increment. Writing both values makes the retained first-order contribution and omitted higher-order contribution concrete.

Measurement uncertainty can be propagated through a model using the same idea. For a sphere $V=(4/3)\pi r^3$, a small radius error $dr$ predicts $dV=4\pi r^2dr$. Dividing by $V$ gives $dV/V=3dr/r$. Thus a small relative radius error of one percent predicts about three percent relative volume error. This is a first-order estimate, not a bound valid for arbitrary errors. The exact multiplier from a relative radius change $\eta$ is $(1+\eta)^3$, which also contains $3\eta^2+\eta^3$ beyond the linear term.

A derivative's magnitude measures absolute sensitivity, but relative sensitivity compares scales. For nonzero $x$ and $f(x)$, the ratio of predicted relative output change to relative input change is $xf'(x)/f(x)$. Its magnitude describes how much a small relative input perturbation is amplified in this scalar model. For a power $f(x)=x^n$ on positive inputs, the ratio is $n$. This is a local statement; near a zero output, relative error can be large or undefined even when absolute error is modest.

When an uncertainty is stated as “at most” a value, a differential is still only an estimate unless a separate derivative bound or exact calculation supplies a rigorous guarantee. Keep approximate error propagation, exact changes, and guaranteed bounds distinct. The next lessons introduce tools for bounding changes more formally.

Related definitions: [Differential](ref:calculus-differential); [Relative error](ref:calculus-relative-error).
