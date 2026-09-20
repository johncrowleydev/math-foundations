const r = String.raw;

// Each array follows the authored quick checks in section order; each entry
// explains the corresponding option in its displayed order.
export default {
  'calculus-limits-continuity': [
    [
      r`A limit uses nearby inputs different from the target itself. Reassigning only $f(a)$ can therefore change the point value while leaving $\lim_{x\to a}f(x)$ unchanged.`,
      r`Changing values at inputs greater than $a$ does not itself reassign $f(a)$. It also changes the right-hand branch used by the limit, so its nearby behavior must be checked again.`,
      r`Different constants on the two sides produce unequal one-sided limits. They do not preserve a finite two-sided limit, and choosing a value at the center cannot reconcile them.`,
    ],
    [
      r`The IVT supplies existence, not uniqueness. A continuous function can cross zero several times while still having endpoint values $-2$ and $4$.`,
      r`Zero lies strictly between $-2$ and $4$. Continuity forces the function to take that intermediate value at some input strictly between $0$ and $3$.`,
      r`The theorem does not locate the root at the midpoint. For example, the line $f(x)=2x-2$ has the stated endpoint values but reaches zero at $x=1$, not $x=3/2$.`,
    ],
  ],
  'calculus-derivatives': [
    [
      r`A negative increment is valid as long as it is nonzero. Both the output difference and the input difference use the same orientation, so a left-side secant slope is well defined.`,
      r`The second input is $a+h=2-0.1=1.9$. Substituting the same increment into the simplified quotient gives $4+h=3.9$.`,
      r`The input $2.1$ and slope $4.1$ correspond to $h=+0.1$. The given negative increment approaches from the left, so both values must instead decrease.`,
    ],
    [
      r`Continuity does not control whether the two one-sided slopes agree. The function $|x|$ is continuous at zero but has left slope $-1$ and right slope $1$, so it is not differentiable there.`,
      r`When the difference quotient has a finite limit, the function increment equals that quotient times an increment tending to zero. The function increment therefore tends to zero, establishing continuity.`,
      r`A vertical tangent corresponds to unbounded slope, not zero slope. Zero derivative describes a horizontal tangent; an unbounded quotient does not give a finite ordinary derivative.`,
    ],
  ],
  'calculus-differentiation-rules': [
    [
      r`Multiplying the two derivatives loses the contributions from each factor's current value. For $u=v=x$, this proposal gives $1$, but the derivative of their product $x^2$ is $2x$.`,
      r`Each factor can change the product. Differentiating the first while retaining the second gives $u'v$; retaining the first while differentiating the second gives $uv'$. Their contributions add.`,
      r`This is the sum rule for $u+v$. A product also depends on the factors' values, so its derivative needs the multipliers $v$ and $u$ in the two terms.`,
    ],
    [
      r`The basic limit $\sin h/h\to1$ uses radians. Changing the angle unit rescales the input increment and introduces a conversion factor into the derivative.`,
      r`Degrees are a valid angle unit. With numerical degree input $\theta$, the radian cosine is $\cos(\pi\theta/180)$, whose derivative includes the factor $\pi/180$.`,
      r`The slope varies throughout the curve, not only at right angles. For instance, $-\sin x$ has different values at $x=0$ and $x=\pi/6$, neither requiring a right-angle event.`,
    ],
  ],
  'calculus-chain-implicit-inverse': [
    [
      r`The number $2$ is the input to the inner function, not the input received by $f$. The outer derivative must be evaluated at the inner output $g(2)=7$.`,
      r`At the original input $2$, the inner function produces $7$. Thus the chain rule uses the outer rate $f'(7)$ and multiplies it by the inner rate $g'(2)$.`,
      r`The outer function is $f$, so the requested outer derivative cannot be a derivative of $g$. The inner derivative in the full chain rule is $g'(2)$, evaluated at the original input.`,
    ],
    [
      r`This is the derivative of the cube with respect to its own input $y$. Differentiating with respect to $x$ also requires the rate at which $y$ changes with $x$.`,
      r`Apply the chain rule to $[y(x)]^3$: the outer power contributes $3y^2$, and the inner function contributes $y'=dy/dx$.`,
      r`The problem says $y$ depends on $x$, so it cannot generally be treated as a constant. For example, if $y=x$, then the derivative of $y^3=x^3$ is $3x^2$, not identically zero.`,
    ],
  ],
  'calculus-exponential-logarithmic': [
    [
      r`The exponent $x$ varies, so the fixed-exponent power rule is not the relevant rule. Rewrite $a^x=e^{x\ln a}$; differentiating the exponent produces $\ln a$, not $x$.`,
      r`Because $a$ is fixed and positive, $\ln a$ is a constant. The chain rule applied to $e^{x\ln a}$ gives $a^x\ln a$.`,
      r`A reciprocal base-log factor occurs in $d(\log_a x)/dx=1/(x\ln a)$ for a valid logarithm base. Differentiating $a^x$ instead multiplies by $\ln a$ through the chain rule.`,
    ],
    [
      r`The equation gives $y'/y$, the derivative divided by the current value. It has not yet isolated the requested absolute derivative $y'$.`,
      r`Multiply both sides by $y=x^x$. The result is $y'=x^x(\ln x+1)$ on the positive domain used for logarithmic differentiation.`,
      r`There is already a division by $y$ on the left. Dividing again would move farther from isolating $y'$; multiplying by the original function cancels that denominator.`,
    ],
  ],
  'calculus-related-rates-approximation': [
    [
      r`An instantaneous measurement can replace a changing variable by a constant too early. Writing $A=25$ from a square's current side $5$ would erase the side's ongoing change before the area rate is calculated.`,
      r`First differentiate the relation that holds throughout the process, retaining all time dependencies. Then insert the measured values and rates for the instant in question into that rate equation.`,
      r`Measurements alone give quantities at one instant, not the relationship between their rates. Differentiating the model supplies that relationship, such as $A'=2ss'$ for a changing square.`,
    ],
    [
      r`Differentiability makes the error of the tangent model small relative to a sufficiently small input increment. That is the local justification for replacing the function change by $f'(a)h$.`,
      r`The derivative can vary away from the anchor. For example, $x^2$ has changing derivative $2x$ but still has a useful tangent approximation near every input.`,
      r`The approximate sign permits a nonzero error. For $f(x)=x^2$, the tangent prediction at $a+h$ omits the term $h^2$; it becomes accurate locally without being exact for nonzero $h$.`,
    ],
  ],
  'calculus-mvt-function-behavior': [
    [
      r`Endpoint derivatives do not control the function throughout the interval. The MVT requires differentiability at every interior point, while continuity rather than differentiability is required at the endpoints.`,
      r`These hypotheses let the MVT connect the endpoint secant slope to a derivative at an interior point. A corner or jump inside the interval can break that connection.`,
      r`Equal endpoint values are the extra condition in Rolle's theorem. The MVT permits different endpoint values and matches their possibly nonzero average slope.`,
    ],
    [
      r`The numerator approaches $1$ and the denominator approaches $2$. Direct substitution gives $1/2$; this is not an indeterminate form, so differentiating the numerator and denominator is unjustified.`,
      r`Both $e^x-1$ and $x$ approach zero. Their derivatives are defined nearby, the denominator derivative is $1\ne0$, and the derivative quotient $e^x$ has limit $1$, so the rule applies here.`,
      r`The numerator stays at $1$ while only the denominator approaches zero. This is not the $0/0$ form: its one-sided values are unbounded with opposite signs, so L'Hôpital's vanishing-quotient rule does not apply.`,
    ],
  ],
  'calculus-single-variable-optimization': [
    [
      r`Zero second derivative does not guarantee a concavity change. For $f(x)=x^4$, both derivatives vanish at zero, but the graph stays concave up on both sides and has no inflection there.`,
      r`An extremum is still possible. The function $-x^4$ has a maximum at zero even though its first and second derivatives are both zero there.`,
      r`The test requires a strictly positive or negative second derivative to classify the stationary point. When it is zero, a minimum, maximum, or neither is possible; inspect the first-derivative signs or compare function values.`,
    ],
    [
      r`The candidate must satisfy the permitted dimensions or other constraints, and its objective value must be best among feasible alternatives, including relevant boundary cases. A derivative equation alone establishes neither fact.`,
      r`Geometric lengths are generally real-valued, so integrality is not a default constraint. Requiring an integer without a stated design restriction would solve a different optimization problem.`,
      r`A root of the derivative has derivative zero, not positive. Positive derivative indicates local increase; identifying an optimum requires sign changes, value comparisons, or another justified extremum argument.`,
    ],
  ],
};
