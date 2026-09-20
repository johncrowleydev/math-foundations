# Calculus multivariable source and calculation inspection

Inspected September 19–20, 2026. The prose, examples, questions and figures are original. Citations support their definitions and methods, not a claim that the books contain these exercises.

For lessons 16–19, read OpenStax Calculus Volume 3 §§4.1–4.7: domains, slices and level sets; the disk definition of a limit and continuity laws; partial derivatives and mixed-partial conditions; the differentiability remainder and sufficient continuous-partial condition; chain-rule paths; unit directional derivatives, steepest change and the regular-level normal theorem; stationary-point classification and closed-region extrema. Lesson 16’s final section also cites 4.4 because its differentiability statement goes beyond coordinate partials.

Read the author-hosted MML PDF, January 15, 2024 edition: 5.3 pp. 149–154, especially Definition 5.6 and Example 5.10, for Jacobian dimensions and composition; 5.7–5.8 pp. 164–167 for Hessians and the second-order Taylor term. PDF page numbers are printed page numbers plus six. The lessons use column scalar gradients and output-row Jacobians, explicitly distinguishing this from MML’s scalar derivative row. The finite Taylor approximation does not inherit the source’s overly broad suggestion that every smooth function equals its infinite Taylor series.

Independent calculations checked the five parameter cases in each practice family and each dedicated review question. In particular:

- For the discontinuous planar example, coordinate difference quotients are zero while the diagonal value is one half. The curved-path example gives one half on y=x²; the squeeze example is bounded by |y|.
- Expansion of (1+h)²+(1+h)(2+k) gives 3+4h+k+h²+hk. The displaced value 3.0498 differs from its linearization 3.05 by −0.0002.
- Directional rates use normalized vectors. At (2,1), the quadratic gradient (4,4) is orthogonal to (1,−1); the tangent displacement (h,−h) changes the output by 3h².
- Substitution before differentiation independently reproduces the path derivative 12 and the composed Jacobian rows (6,6),(4,−2). The model-error graph gives parameter derivatives −4,−2 for the stated data.
- The mixed derivatives of x³y+2xy² agree as 3x²+4y. The Hessian of x²+2xy+3y² is [[2,2],[2,6]], and one half of its quadratic form reproduces the polynomial.
- Positive, negative and indefinite quadratic forms, fourth-power examples, non-strict minima, rectangle boundaries and excluded disk boundaries were checked directly against function values.

Accepted and rejected answer fixtures were also run through the actual deterministic dispatcher. This checks grading behavior separately from the calculations above; agreement with a stored expected answer alone is not a mathematical check.

The eight figure datasets were calculated from their stated equations. Checks include secant slope 3 versus tangent slope 2, cubic critical values ±2, triangle integral 2, ellipse levels, the contour-normal dot product, and exact gradient-descent iterates. The sine figure uses the fourth-order Taylor polynomial, whose fourth-degree coefficient is zero, to justify the sharper fifth-power remainder bound. Sampled paths illustrate these results and are not treated as proofs.
