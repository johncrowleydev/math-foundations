# Linear algebra correction — 13 September 2026

The first release was too small to support the stated learning goals. Eight exercises per chapter and a few checked calculations were not adequate evidence of a finished subject. The old completion claim is superseded by this correction.

## What was inspected

The introduction and all ten lesson sources; the original 80 prompts and answers; the original 20 quick checks; reference definitions, examples, confusions and links; every linear-algebra formula context and TeX entry; the coordinate-figure data and renderer; subject numbering, exercise placement, intro routing, content generation, grading catalog generation, and the tests and documentation introduced with the subject. The source changes in commit `95393d0` and the introduction-navigation correction in `8b939f0` were inspected, not just the rendered first chapter.

The revised practice is now directly authored in `content/worksheets/la-*.yaml`,
with self-contained notebook wording in `content/exercise-copy.yaml`. Its former
`linear-algebra-practice.mjs` and `linear-algebra-advanced.mjs` generators were
removed in the [declarative migration](declarative-curriculum-migration.md).
These are original questions, not copied external exercises. The finite cases
cover signs, zeros, dimensions, ranks, degeneracies, and exceptional cases,
alongside proofs, counterexamples, interpretations, and model critiques. The count
describes the result; it is not an educational acceptance criterion.

## Teaching and practice coverage

| Lesson                        | Exercises | Work covered                                                                                                                                                                                                                                                                   |
| ----------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vectors                       |        74 | Coordinate meaning and units; displacements and translations; component arithmetic and inverse checks; multiple dimensions; recovering unknown vectors; combinations and unreachable targets; averages; resource models, fixed costs and feasibility; vector-law arguments.    |
| Dot products                  |        74 | Scalar products and distribution; exact norms and normalization; distance; sign and zero cases; perpendicular construction; angles including 0°/180°; weighted totals; cosine similarity and feature scaling; geometric identities.                                            |
| Matrices                      |        68 | Rectangular shapes and entries; transpose and symmetry; matrix arithmetic; row and column readings; standard inputs; rectangular products; composition order; dimension compatibility; cancellation and zero-product counterexamples.                                          |
| Systems                       |        68 | Encoding missing coefficients; two- and three-variable elimination; row swaps; back substitution; unique, inconsistent and underdetermined systems; parameter-dependent exceptions; multiple free parameters; complete affine solution families; proofs about solution sets.   |
| Span and independence         |        72 | Membership and equal spans; explicit dependence witnesses; independence proofs; redundant directions and pairwise-test failures; subspaces and nonexamples; intersections and unions; row, column and null spaces; interpreting coefficient dimensions.                        |
| Bases, rank and inverses      |        71 | Coordinates in ordered bases; extracting and extending bases; dimension and the exchange argument; column/row/null-space bases; pivot selection; rank-nullity; two-dimensional determinants and area; inverse calculations and laws; existence versus uniqueness.              |
| Transformations               |        68 | Universal linearity proofs and counterexamples; matrices from basis images; rectangular maps; rotations, reflections and projections; kernel/image; injectivity and surjectivity; affine offsets; composition and correctly scoped changes of basis.                           |
| Projections and least squares |        68 | Exact line projections; coefficients versus outputs versus residuals; scale invariance; closest-point proof; orthonormal projection; Gram–Schmidt; QR meaning; constant and line fits; normal equations; rank-deficient fits; interpretation and sensitivity.                  |
| Eigenvalues                   |        62 | Direct candidate checks; triangular and symmetric examples; characteristic polynomials and eigenspaces; algebraic/geometric multiplicity; diagonalization and its failures; powers and initial-component dependence; symmetric orthogonality; real versus complex limitations. |
| Conceptual SVD                |        72 | Full factor dimensions; rectangular extra null directions; reconstruction; signs and reflections; ellipse geometry; input/output spectra; rank/nullity; positive-direction construction; truncation and Frobenius errors; repeated values, sensitivity and interpretation.     |
| **Total**                     |   **697** | **Plus 20 quick checks and the unassessed introduction.**                                                                                                                                                                                                                      |

Each exercise has an entry in `content/linear-algebra-objectives.json`. Inline questions follow the complete named section, including its worked examples. The remaining questions are in that lesson's Practice page. `content/inline-prerequisites.yaml` records the section dependencies; `content/tex-teaching.json` separately records typing constructions. The reference library supplements the teaching rather than supplying missing prerequisites.

## Specific corrections

- A positive or negative dot product does not exclude parallel vectors: 0° and 180° must be handled separately from strictly acute and obtuse angles. The original question and reference material were corrected too.
- Moving only an arrow's starting point changes displacement; translating both endpoints together does not. The original question now states both cases explicitly.
- A wide matrix can have no zero entries in its listed singular values and still have a nontrivial null space. Nullity is the number of input columns minus rank. Extra input directions are shown explicitly in the revised examples and practice.
- The same-basis formula for a transformed matrix needs a map from a space to itself and the same basis on both sides. The text and original practice question now state these assumptions and explain separate input/output bases.
- Removed “norm” from vector practice before that term is introduced. Defined semiaxis before the ellipse caption and explained quadratic expressions, row space, multiplicities, design matrices, QR, and the other new vocabulary before dependent practice.
- Lowercase `\sigma` was absent from the editor registry because its proposed ID collided with uppercase `\Sigma`. They now have distinct entries and instruction; the editor and reference use the same registry.
- Expanded the short explanations into worked reasoning, including complete elimination, basis extraction, an exchange argument for dimension, a non-axis projection, Gram–Schmidt, and a fitted line with residual checks. Added native mathematical displays where they help follow the calculation.
- Added 35 focused reference entries instead of relying entirely on large multi-concept entries. All 92 linear-algebra references have teaching locations and related links.
- The seven coordinate figures use explicit numerical data. The new dependence figure explains why pairwise nonparallel directions can still be collectively dependent; the new eigenvector figure contrasts two preserved lines with different stretch factors. None introduces next/previous controls for a static paragraph.

## Evidence and its meaning

`scripts/verification/verify-linear-algebra.py` independently recalculates 357 numerical exercises using SymPy rational matrices. It checks the displayed prompt/answer against the exact data as well as products, solution-set consistency and completeness, space dimensions, inverses, projection residuals, normal equations, eigenvectors, SVD factors, and errors. This is separate arithmetic from the JavaScript authoring calculations. The other questions were inspected as arguments and interpretations in the authored source, including their explicit parameter cases; they are not assigned a fictitious numerical correctness score.

The content tests additionally cover the original worked calculations and all seven figures' mathematical data. Source hashes in the curriculum inventory detect later changes to inspected material. **A matching hash or a passing rendering test does not prove a mathematical statement or establish pedagogical adequacy.** The previous inventory wording overstated that distinction and has been corrected.

The authoring pass was checked against the repository's [subject roadmap](study-plan.md) and the topic relationships in [MIT's linear-algebra resource index](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/resource-index/). The exercises and explanations here are original. The roadmap targets fluency in real coordinate-space linear algebra and conceptual SVD; it does not claim a treatment of abstract vector spaces, complex spectral theory, or numerical SVD algorithms. Stated but unproved major theorems are identified in the lesson text.

## Browser checks and publication

Inspected all seven figures at 360×800, 800×1100, and 1440×900. Corrected an eigenvector label overlap, a malformed internal reference, and a figure declaration that otherwise became a broken image. Builder checks now reject the latter two malformed source forms. Verified practice counts and last-question access in all ten lessons, the disabled Practice control on the introduction, quick definitions, full reference navigation, formula readings, and a phone exercise URL surviving reload.

The final run passed 47 content tests, nine client tests, TypeScript checks, the TeX release check, and 357 independent exact numerical checks. The web build succeeded. Existing discrete-math records in the shared exercise, prerequisite, quick-check, and TeX sources were compared structurally with the previous commit and are unchanged.

Published version 0.9.2 at https://foundations.johncrowley.dev on September 13, 2026. The public HTML, notebook, grading-version metadata, and service worker match the local release byte for byte. The server's grading catalog hash also matches the generated catalog; the service and existing weekly backup timer are active. No model calls were used for these checks.
