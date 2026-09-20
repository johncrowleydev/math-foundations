# Calculus lessons 20–22: source and mathematical inspection

Inspected on 2026-09-19. These modules contain original explanations, examples,
practice, and review; references support the underlying mathematics rather than
claiming that the books contain these particular questions or numerical examples.

## Sources inspected

| Authored material                                           | Passage inspected                                                                                                                                                                                                                                                      | What was checked                                                                                                                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lesson 20, sections 1–2 and 5                               | OpenStax, _Calculus Volume 3_, [§5.1 Double Integrals over Rectangular Regions](https://openstax.org/books/calculus-volume-3/pages/5-1-double-integrals-over-rectangular-regions), definition of the double integral, Theorems 5.1–5.2, and average-value equation 5.4 | Area-weighted Riemann sums, signed volume, linearity, rectangular product separation, continuity as a sufficient Fubini hypothesis, and division by region area for averages.                        |
| Lesson 20, sections 3–4                                     | OpenStax, [§5.2 Double Integrals over General Regions](https://openstax.org/books/calculus-volume-3/pages/5-2-double-integrals-over-general-regions), Type I/II definitions, decomposition discussion, and changing-order examples 5.15–5.16                           | Variable bounds, vertical/horizontal slicing, preservation of the region when reversing order, and splitting where boundary descriptions change.                                                     |
| Lesson 20, final probability bridge                         | Deisenroth, Faisal, and Ong, _Mathematics for Machine Learning_, [§6.2, Definition 6.1 and equations 6.15–6.16, printed p.181 / PDF p.187](https://mml-book.github.io/book/mml-book.pdf#page=187)                                                                      | Nonnegative densities with total integral one, integration over regions, and the distinction between a density value and probability mass. The authored bridge uses an original unit-square example. |
| Lesson 21                                                   | OpenStax, [§4.8 Lagrange Multipliers](https://openstax.org/books/calculus-volume-3/pages/4-8-lagrange-multipliers), one-constraint theorem, equations, problem-solving steps, and three-variable extension                                                             | Parallel gradients, feasibility equation, nonzero constraint-gradient assumption, and the multiplier as a necessary candidate condition.                                                             |
| Lesson 21 candidate comparison; lesson 22 nonconvex example | OpenStax, [§4.7 Maxima/Minima Problems](https://openstax.org/books/calculus-volume-3/pages/4-7-maxima-minima-problems), stationary-point discussion, Theorem 4.17, and absolute-extrema/boundary discussion                                                            | Saddle classification, the distinction between a critical point and an optimum, and the need to inspect boundary and exceptional points.                                                             |
| Lesson 22, sections 1–2 and 5                               | MML, [§7.1 and §7.1.1, equations 7.5–7.10, printed pp.228–230 / PDF pp.234–236](https://mml-book.github.io/book/mml-book.pdf#page=234)                                                                                                                                 | Negative-gradient iteration, step-size effects, directional curvature, and the squared-residual gradient.                                                                                            |
| Lesson 22, sections 3 and 5                                 | MML, [§7.3, Definitions 7.2–7.3 and equation 7.31, printed pp.236–237 / PDF pp.242–243](https://mml-book.github.io/book/mml-book.pdf#page=242)                                                                                                                         | Convex sets/functions, the supporting-plane inequality, and the positive-semidefinite Hessian criterion.                                                                                             |

The OpenStax passages were opened and their mathematical supporting text inspected.
The author-hosted MML PDF was downloaded to `/tmp/calculus-mml.pdf`; layout text
was extracted to `/tmp/calculus-mml.txt`. PDF page 234 was also rendered and visually
inspected to confirm gradient orientation and the update equations. Those research
artifacts are temporary and are not bundled or committed.

The lesson uses column gradients; MML sometimes uses row gradients and transposes
in its update. This convention difference is explicitly explained. The loss in
lesson 22 includes one half, so its gradient is `A^T(A theta-b)`, whereas the
unhalved loss in MML equation 7.9 has an additional factor two. No general global
convergence claim is inferred from the introductory gradient-descent discussion:
the lesson proves its convergence statements only for the stated quadratics and
separately explains stationary nonminima.

## Independent mathematical checks

The original calculations were recalculated using SymPy 1.14.0 in a temporary
isolated Python environment. The check script computes integrals, differentiates
objectives, solves constraint systems, and multiplies exact matrices before
comparing its results with 76 authored numerical/formula/tuple answers. This is
separate from invoking the app's deterministic graders. Further assertions check
the worked examples, domain geometry, and Hessian classifications.

Representative results:

- The rectangle integral of `x+2y` over `[0,2] × [0,1]` is 4; its area average is 2.
- The triangle `x,y≥0`, `x+y≤2` has area 2 and integral of x equal to 4/3.
- The region between `y=x²` and `y=x` on `[0,1]` has area 1/6 in either order.
- Reversing `0≤x≤y≤1` changes the exponential example to the integral of
  `y exp(y²)`, giving `(e−1)/2`.
- The height difference `3+y` over the unit square gives volume 7/2.
- The nonnegative unit-square density `2x` has total 1 and left-half share 1/4.
- Solving the Lagrange system for `x²+2y²` with `x+y=9` gives `(6,3)`,
  multiplier 12, and value 54. The lesson's `x+y=6` worked case gives `(4,2)`
  and value 24.
- On the radius-r circle, the extrema of xy are `±r²/2`. Restricting to a
  closed first-quadrant arc changes the minimum to zero at its endpoints.
- The singular constraint `x²+y²=0` has only the origin, where its gradient
  vanishes. For objective x, no scalar multiplier can turn `(0,0)` into `(1,0)`.
- For `(x−1)²+2(y+1)²`, the loss at `(3,1)` is 12; its gradient is `(4,8)`.
  A step of 1/4 reaches `(2,−1)` with loss 1.
- The scalar quadratic error multiplier is `1−alpha*a`, with convergence from
  every start precisely when `0<alpha<2/a`. The two-dimensional example requires
  both directional multipliers to satisfy this condition.
- For `(x²−1)²+y²`, the origin has zero gradient and Hessian diagonal `(-4,2)`;
  the two points `(±1,0)` attain the nonnegative loss's minimum zero.
- With design rows `(1,0),(1,1),(1,2)` and targets `(1,2,2)`, the initial gradient
  is `(-5,-6)`. A step of 1/10 reaches `(1/2,3/5)` and reduces half-squared loss
  from 9/2 to 23/40. The normal-equation solution is `(7/6,1/2)`, with loss 1/12.

The explanatory solutions were also checked for mathematical scope: full-circle
versus semicircle branches; open versus closed feasible sets; singular constraint
representations; necessary versus sufficient candidate conditions; nonnegative
versus signed accumulation; simultaneous versus sequential coordinate updates;
and convexity versus convergence or uniqueness.

## Module validation

Each lesson has five developed teaching sections, 50 practice questions, 15 dedicated
review questions, five contextual terms, and exactly two quick checks. Section
prose runs approximately 260–313 words, with local worked examples and conditions.
The modules export source assignments alongside the authored content for the central
pipeline to register in `content/sources.json`.

All 158 deterministic questions across these three modules were exercised with
both their authored correct response and a deliberately incorrect response using
the existing assessment contract. Every correct response passed and every incorrect
response failed. Open explanations and modeling judgments remain open rather than
being represented by final-answer-only graders. All embedded TeX was rendered with
KaTeX as a syntax check. This record does not replace the central content/source
validation or the final rendered PWA inspection.

## Independent verification addendum: lessons 16–19

On 2026-09-19, the separately authored modules for multivariable functions,
gradients, the multivariable chain rule, and multivariable extrema were read from
the main authoring worktree without modifying them. This was mathematical content
verification, separate from software review and separate from the grading fixtures.

An independent SymPy calculation checked 231 practice/review answers across those
four modules. Each polynomial family was reconstructed from its stated function:
partial derivatives came from differentiation; linearizations from function values
and evaluated derivatives; path derivatives from direct substitution; Jacobians
from independently constructed output vectors; Hessians from second derivatives;
and quadratic changes from exact matrix products. Boolean domain and classification
answers were checked against the stated inequalities and the function's actual
sign behavior. Open reasoning solutions were read for their assumptions and scope.
No numerical or formula discrepancies were found.

The worked-example checks included:

- The cost example `8+2a+5b+ab` at `(2,3)` gives 33. For `x²y+3y²` at `(2,-1)`,
  the function value is -1 and the two partials are -4 and -2.
- `xy/(x²+y²)` has distinct axis/diagonal approach values. The related
  `x²y/(x²+y²)` has the global bound by `|y|`, establishing the claimed zero limit.
  The curved-path example `x²y/(x⁴+y²)` retains the nonzero value 1/2 on `y=x²`.
- Expanding `x²+xy` about `(1,2)` gives `3+4h+k+h²+hk`. The example value at
  `(1.02,1.97)` is exactly 3.0498, compared with its linear prediction 3.05.
- On `x²+2y²=6` at `(2,1)`, the gradient is `(4,4)` and the tangent line is
  `x+y=3`. A displacement `(h,-h)` produces exact second-order change `3h²`.
- The path `x=t+1,y=t²` through `x²y` has derivative 12 at t=1. The shared-
  intermediate graph `u=t²,v=u+1,w=uv` differentiates to `2t(2t²+1)`.
- Composing `(s+t,s-t)` with `(u²,uv)` gives Jacobian rows `(6,6)` and `(4,-2)`
  at `(2,1)`. The ordering and evaluation point agree with the matrix chain rule.
- For `x³y+2xy²`, the four second partials are `6xy`, `3x²+4y`, `3x²+4y`,
  and `4x`. The Hessian of `x²+2xy+3y²` has rows `(2,2)` and `(2,6)`.
- The cross-term example `x²+4xy+y²` gives `6x²` on y=x and `-2x²` on y=-x,
  proving the asserted saddle despite positive pure second partials.

Source passages inspected for this addendum were OpenStax Volume 3 §§4.1–4.7,
covering domains/level sets, path-sensitive limits, partial derivatives, sufficient
differentiability conditions, tangent-plane/differential formulas, scalar chain
rules, unit directional derivatives, and extrema. The author-hosted MML text was
also checked at §5.3, Definition 5.6 and the matrix chain-rule examples, printed
pp.149–154 / PDF pp.155–160; and §§5.7–5.8, equations 5.147–5.159, printed
pp.164–167 / PDF pp.170–173. These support the explicit output-row/input-column
Jacobian convention and the finite Hessian quadratic approximation. The lesson
appropriately does not inherit a general claim that a smooth function equals its
infinite Taylor series.

One source-placement improvement was reported to the primary author: reuse the
existing MML Hessian/Taylor citation in lesson 19's stationary-point classification
section as well as its Hessian section, because that classification section extends
the discussion from the two-variable OpenStax test to higher-dimensional Hessian
eigenvalues. No changes were made to the main authoring worktree during this pass.
