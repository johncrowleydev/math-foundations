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
