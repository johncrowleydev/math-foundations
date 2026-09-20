# Chain Rule, Implicit and Inverse Differentiation

A quantity may change because another quantity changes first. If a sensor converts temperature into voltage and a program converts voltage into a displayed reading, the overall sensitivity must include both stages. The chain rule formalizes that multiplication of local rates. It also lets us differentiate a curve without explicitly solving for one variable and determine how rapidly an inverse function changes. Read compositions from the inside outward, label the independent variable, and state the domain on which each formula makes sense. The point of these techniques is to preserve dependencies that can be easy to lose in a long expression.

## Composition and local rate multiplication

A composition has the form $y=f(g(x))$: first compute $u=g(x)$, then apply the outer function $f$ to $u$. The chain rule says $dy/dx=f'(g(x))g'(x)$, provided $g$ is differentiable at $x$ and $f$ is differentiable at $g(x)$. The outer derivative must be evaluated at the inner output, not at the original input by habit.

For $y=(3x+1)^4$, set $u=3x+1$. The rate of the outer power with respect to $u$ is $4u^3$, while $du/dx=3$. Multiplying gives $dy/dx=12(3x+1)^3$. The factor $3$ is not decorative: doubling the rate of change of the inner quantity doubles the resulting outer rate at the same inner value. Differentiating only the outer power would answer a rate with respect to $u$ rather than with respect to $x$.

The differential notation $dy/dx=(dy/du)(du/dx)$ emphasizes this transfer of rates. It resembles cancellation of $du$, but the chain rule justifies the equality. A proof cannot simply cancel symbols without establishing the derivative relationships. For a nonzero inner increment, the overall difference quotient factors into the output change per inner change times the inner change per input change. A full proof handles cases where the inner change vanishes; the theorem covers those too.

A table can support a chain-rule calculation without formulas. If $g(2)=5$, $g'(2)=-3$, and $f'(5)=4$, then $(f\circ g)'(2)=4(-3)=-12$. The value $f'(2)$ would not be relevant to this particular composition. Units provide a useful check: if the inner rate is volts per degree and the outer rate is displayed units per volt, their product is displayed units per degree. This reasoning also distinguishes a composition from a product. In $x\sin x$, two values are multiplied; in $\sin(x^2)$, one function receives another function's output.

Related definitions: [Chain rule](ref:calculus-chain-rule); [Inner and outer functions](ref:calculus-inner-outer-function).

## Nested rules and angle conversion

A composition can contain more than two stages. For $y=\sin((x^2+1)^3)$, work from the outside inward: the sine contributes $\cos((x^2+1)^3)$, the cube contributes $3(x^2+1)^2$, and the quadratic contributes $2x$. Multiplying yields $6x(x^2+1)^2\cos((x^2+1)^3)$. A written dependency chain makes a missing factor easy to spot: $x\mapsto x^2+1\mapsto(x^2+1)^3\mapsto\sin((x^2+1)^3)$.

Different operations can occur at different levels. In $y=x^2\sin(3x)$, the top-level operation is a product, so first write $2x\sin(3x)+x^2[d(\sin(3x))/dx]$. The remaining derivative is a composition, giving $y'=2x\sin(3x)+3x^2\cos(3x)$. Starting with the structure of the full expression prevents a familiar chain-rule pattern from displacing a needed product rule.

For $q(x)=(\sin x)^2/(x^2+1)$, combine the quotient rule with the chain rule in its numerator derivative. The result is $[2\sin x\cos x(x^2+1)-2x\sin^2x]/(x^2+1)^2$. The denominator is positive for every real input. A correct factored expression is often easier to inspect than a long expanded answer.

Angle conversion is a concrete composition. If $\theta$ is a numerical degree input, then $S(\theta)=\sin(\pi\theta/180)$ uses a radian sine function internally. Differentiation with respect to $\theta$ gives $S'(\theta)=(\pi/180)\cos(\pi\theta/180)$. The conversion factor has a real effect on slope: a one-degree increment is much smaller than a one-radian increment.

For checking a complicated answer, predict simple features before calculating: a constant inner function should produce zero derivative; an even function's derivative should be odd wherever the differentiation symmetry applies; and replacing a positive inner scale by a negative one often introduces a sign. These observations detect errors, but they do not replace a derivation or justify equivalence from a few numerical samples.

Related definitions: [Dependency chain](ref:calculus-dependency-chain).

## Implicit differentiation of curves

An equation such as $x^2+y^2=13$ describes a curve without choosing one global function $y=f(x)$. Near many of its points, a branch does behave as a differentiable function of $x$. Implicit differentiation works on such a branch while keeping its equation intact. Every occurrence of $y$ is treated as a quantity depending on $x$.

Differentiating the circle equation gives $2x+2y\,y'=0$. The term $2y\,y'$ is a chain-rule derivative of $y(x)^2$, not just $2y$. Where $y\ne0$, solve to obtain $y'=-x/y$. At $(2,3)$ the slope is $-2/3$, and the tangent is $y-3=-(2/3)(x-2)$. The point must first satisfy the original equation; otherwise substituting its coordinates into the derivative formula has no geometric meaning for that curve.

Mixed terms introduce product rules. For $x^2+xy+y^2=7$, differentiation gives $2x+y+xy'+2yy'=0$. Collecting all terms involving $y'$ gives $(x+2y)y'=-(2x+y)$. Thus $y'=-(2x+y)/(x+2y)$ where the denominator is nonzero. At $(1,2)$ the equation holds and the slope is $-4/5$. Collecting before dividing reduces the chance of leaving a hidden derivative term on the wrong side.

A vanishing denominator marks a place where this formula does not provide a finite slope. It does not by itself prove a vertical tangent: the numerator might also vanish, or several branches may cross. For the circle at $(\sqrt{13},0)$, direct geometry or a local parameterization shows a vertical tangent. For the relation $xy=0$ at the origin, both coordinate axes are present, so there is no single tangent to a single smooth branch covering the full relation.

Implicit differentiation can be repeated, but the resulting $y'$ also depends on $x$. Differentiate it with product, quotient, and chain rules, then substitute the known first derivative if needed. This keeps higher derivatives attached to the chosen local branch rather than treating the two coordinates as independent constants.

For a second-derivative example, use the upper half of the circle $x^2+y^2=R^2$, with fixed $R>0$ and $y>0$. The first derivative is $y'=-x/y$. Differentiating this quotient gives $y''=-1/y+xy'/y^2$. Substitute $y'=-x/y$ to get $y''=-1/y-x^2/y^3=-(x^2+y^2)/y^3=-R^2/y^3$. The negative sign describes the branch's downward curvature. At no stage was $y$ held constant; doing so in the second differentiation would lose the contribution containing $y'$.

Related definitions: [Implicit differentiation](ref:calculus-implicit-differentiation); [Local branch](ref:calculus-local-branch).

## Rates of inverse functions

An inverse function reverses an input-output relationship. If $y=f(x)$ is invertible on a stated interval, then $x=f^{-1}(y)$ there. The inverse notation does not mean the reciprocal $1/f$. Domain restrictions that make the original function one-to-one are part of defining the inverse. For example, $x^2$ on all real inputs has no inverse function, while its restriction to $x\ge0$ has inverse $\sqrt{x}$.

Suppose $f$ is differentiable and locally invertible near $a$, with $f'(a)\ne0$. The derivative of its inverse at $b=f(a)$ is $(f^{-1})'(b)=1/f'(a)$. Equivalently, $(f^{-1})'(x)=1/f'(f^{-1}(x))$ where the hypotheses hold. The original derivative is evaluated at the inverse output. Confusing the two coordinate roles is a common error when the numbers are not the same.

Differentiate the identity $f(f^{-1}(x))=x$ using the chain rule: $f'(f^{-1}(x))(f^{-1})'(x)=1$. Solving gives the formula. Geometrically, the two graphs reflect across $y=x$; exchanging horizontal and vertical changes reciprocates a nonzero finite slope. In an application, this reverses sensitivity units: a rate in meters per second becomes a rate in seconds per meter.

For $f(x)=x^3+x$, the derivative is $3x^2+1>0$, so the function is one-to-one. Because $f(2)=10$, the inverse derivative at $10$ is $1/f'(2)=1/13$. There is no need to solve the cubic explicitly. At a different inverse input, first find the corresponding original input; reciprocal slopes at unrelated points have no such relationship.

The condition $f'(a)\ne0$ cannot be discarded. The function $x^3$ is invertible, but its derivative at zero vanishes. Its inverse $x^{1/3}$ has an unbounded difference quotient there, not a finite derivative. Invertibility alone is a statement about distinct values, while differentiability of an inverse also requires local control of how quickly those values separate.

As a worked table example, imagine that a monotone calibration function maps input $a=6$ to output $b=20$, and its slope at $6$ is $-4$ output units per input unit. The inverse maps $20$ back to $6$ and has slope $-1/4$ input units per output unit. The negative sign persists: increasing the observed output requires decreasing the inferred input. A slope with very small nonzero magnitude in the original mapping gives a large inverse sensitivity. Thus invertibility does not imply that numerical inversion is insensitive to measurement error. This conclusion follows from the reciprocal derivative and gives a practical reason to record both the matching input-output pair and the slope.

Related definitions: [Inverse derivative](ref:calculus-inverse-derivative).

## Inverse trigonometric derivatives

Inverse trigonometric functions require principal branches because the unrestricted trigonometric functions repeat their values. Arcsine returns an angle in $[-\pi/2,\pi/2]$, arccosine one in $[0,\pi]$, and arctangent one in $(-\pi/2,\pi/2)$. We write $\arcsin x$, $\arccos x$, and $\arctan x$ to avoid confusing inverse functions with reciprocal powers. Their output angles are in radians.

Let $y=\arcsin x$, so $\sin y=x$. Implicit differentiation yields $\cos y\,y'=1$. On the interior of the principal arcsine interval, cosine is positive, so $\cos y=\sqrt{1-\sin^2y}=\sqrt{1-x^2}$. Hence $(\arcsin x)'=1/\sqrt{1-x^2}$ for $|x|<1$. The sign of the square root is justified by the branch, not guessed from an algebraic identity. The endpoints $x=\pm1$ belong to the function's domain but do not have finite derivatives.

For $y=\arccos x$, differentiate $\cos y=x$ to get $-\sin y\,y'=1$. The branch has positive sine in its interior, giving $(\arccos x)'=-1/\sqrt{1-x^2}$ for $|x|<1$. Arccosine decreases as its input increases, consistent with the negative sign.

For $y=\arctan x$, differentiating $\tan y=x$ gives $\sec^2y\,y'=1$. Since $\sec^2y=1+\tan^2y=1+x^2$, the result is $(\arctan x)'=1/(1+x^2)$ for all real $x$. Its rate is positive but shrinks toward zero as the input magnitude grows.

Apply the chain rule to composed arguments. For $\arcsin(2x)$ the derivative is $2/\sqrt{1-4x^2}$ on $|x|<1/2$. For $\arctan(x^2)$ it is $2x/(1+x^4)$. The former has a restricted differentiability interval inherited from the inverse sine; the latter is differentiable for every real input. Always determine the inner output range before applying a principal-branch formula.

Related definitions: [Principal branch](ref:calculus-principal-branch); [Inverse trigonometric derivative](ref:calculus-inverse-trigonometric-derivative).
