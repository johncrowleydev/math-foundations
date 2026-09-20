// Per-option explanations, ordered by teaching section and then option position.
// These use the mathematical sources already assigned to each quick-check section.
const r = String.raw;
export default {
  'calculus-definite-integrals': [
    [
      r`Adding the heights gives $2+8=10$, but accumulation also depends on how long each height lasts. Multiply each value by its own width before adding.`,
      r`The first contribution is $2\cdot3=6$ and the second is $8\cdot1=8$. Their sum is $14$.`,
      r`The unweighted mean height $5$ times total width $4$ gives $20$, but that treats the two heights as lasting equally long. The lower height actually lasts three times as long.`,
    ],
    [
      r`Subtracting the negative-region magnitude gives displacement, $6-4=2$. Distance also counts the motion in the negative direction, so those magnitudes must be added.`,
      r`Distance counts travel in both directions positively: $6+4=10$. The sign of velocity affects displacement, but not whether that travel contributes to distance.`,
      r`A distance cannot be negative. Reversing the subtraction gives $4-6=-2$, whereas total distance requires adding the two nonnegative region magnitudes.`,
    ],
  ],
  'calculus-antiderivatives-ftc': [
    [
      r`The function $x^4$ is one valid antiderivative, but it omits other valid choices such as $x^4+7$. The question asks for the entire family.`,
      r`Differentiating $Cx^4$ gives $4Cx^3$, which matches $4x^3$ only when $C=1$. An arbitrary multiplicative constant changes the required derivative.`,
      r`Every additive constant differentiates to zero, so each $x^4+C$ has derivative $4x^3$. The mean value theorem shows that all antiderivatives on this interval differ by just such a constant.`,
    ],
    [
      r`The fundamental theorem evaluates the antiderivative at the upper bound and subtracts its value at the lower bound. Any additive constant cancels in $F(b)-F(a)$.`,
      r`These are endpoint values of the integrand, not of an antiderivative. Their difference measures a change in $f$ itself and generally does not equal the accumulated integral of $f$.`,
      r`An upper-endpoint value alone omits the starting level $F(a)$. A fixed-bound integral is a particular number, so an arbitrary constant must not remain in its answer.`,
    ],
  ],
  'calculus-integration-techniques': [
    [
      r`This gives $du=dx/x$ and $v=x^2/2$. The remaining integral is $\tfrac12\int x\,dx$, a simpler power-rule calculation.`,
      r`This is a legal choice, but finding $v$ already requires integrating $\ln x$, and the resulting integral retains logarithmic terms. Differentiating the logarithm instead removes that difficulty immediately.`,
    ],
    [
      r`This is neither an identity for $\sin^2x$ nor its antiderivative: differentiating it gives $\sin^2x\cos x$, with an extra chain-rule factor.`,
      r`The identity $\sin^2x=(1-\cos2x)/2$ is valid for every real $x$. It reduces the integral to a constant term and a cosine term with a simple chain factor.`,
      r`The expression $1-\cos x$ equals $2\sin^2(x/2)$, not $\sin^2x$. The correct power-reduction identity needs both the doubled angle and the factor $1/2$.`,
    ],
  ],
  'calculus-applications-integration': [
    [
      r`A single signed difference allows the two sides of a crossing to cancel. Taking an absolute value after that cancellation cannot recover the area that was lost.`,
      r`On each piece the upper-minus-lower height is nonnegative, so every strip contributes positive area. Splitting where the ordering changes preserves both regions.`,
    ],
    [
      r`This is the slice's side length, not its area. Multiplying a length by slice thickness gives square units, while volume requires cubic units.`,
      r`A square with side $s(x)$ has area $s(x)^2$. Multiplying that area by thickness and taking the limit gives $V=\int s(x)^2\,dx$.`,
      r`The expression $4s(x)$ is the square's perimeter. Adding perimeter times thickness does not add the solid's interior slice volumes.`,
    ],
  ],
  'calculus-numerical-improper': [
    [
      r`The weight does not describe measurement accuracy. Each trapezoid uses both endpoint heights, so shared endpoints appear twice when their areas are added.`,
      r`An interior endpoint is the right boundary of one trapezoid and the left boundary of the next. Adding both contributions gives its factor of two.`,
      r`The weights depend on the approximation rule. Midpoint samples each have weight one, and Simpson's interior weights alternate four and two; doubling is specific to the shared trapezoid endpoints.`,
    ],
    [
      r`This is the convergence threshold for the tail integral from $1$ to infinity. Near zero, $p>1$ creates a singularity whose truncated area grows without bound.`,
      r`For $p<1$, the antiderivative term $\varepsilon^{1-p}$ tends to zero as the lower cutoff approaches zero. The limiting integral is $1/(1-p)$.`,
      r`At $p=1$, the truncated integral is $-\ln\varepsilon$. It grows without bound as $\varepsilon$ approaches zero, so this boundary case diverges.`,
    ],
  ],
  'calculus-sequences-series': [
    [
      r`Convergent series must have terms tending to zero, but that condition alone is insufficient. The harmonic terms $1/n$ approach zero while their running totals diverge.`,
      r`The partial sum $S_N=a_1+\cdots+a_N$ is a finite running total. A series converges precisely when these totals approach one finite value.`,
      r`The indices count terms and grow without bound. They are not the numerical quantities whose convergence defines the sum.`,
    ],
    [
      r`Absolute convergence would require the sum of the term magnitudes to converge. The question explicitly says that this absolute-value series diverges.`,
      r`The signed sum converges, but the magnitude sum does not. Those two facts together are exactly the definition of conditional convergence.`,
      r`The signed series is stated to converge. Divergence of its magnitude series rules out absolute convergence, but it does not undo convergence produced by cancellation.`,
    ],
  ],
  'calculus-power-series-taylor': [
    [
      r`Absolute convergence is guaranteed when $|x-2|<3$, which is exactly the open interval $-1<x<5$.`,
      r`The endpoints satisfy $|x-2|=3$, where the radius rule alone is silent. Either, both, or neither endpoint may converge, depending on the coefficients.`,
      r`Divergence is guaranteed outside the radius, where $|x-2|>3$, not automatically at equality. Each endpoint needs its own series test.`,
    ],
    [
      r`The intermediate point need not be the center. A derivative that is small at the center may become larger elsewhere between the center and the target, so that single value need not bound the remainder.`,
      r`A bound valid throughout the interval also bounds the derivative at the unknown intermediate point. It therefore turns the remainder formula into a guaranteed numerical error estimate.`,
      r`Printing more decimal places changes how an approximation is displayed, not how far it lies from the true value. A mathematical remainder bound must control the omitted contribution.`,
    ],
  ],
};
