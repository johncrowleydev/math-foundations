# Linear algebra deterministic conversion source inspection

Inspected 2026-09-19. These sources support the original authored problems and the concepts used in the deterministic adaptations; they are not claims of copied textbook exercises. The authoring script pins every original prompt/answer digest and reads numerical family parameters from `content/linear-algebra-verification.json`, emitted by the existing practice author. It recomputes arithmetic using Python `Fraction` before publishing metadata.

| Source and inspected passage | Application |
| --- | --- |
| [Interactive Linear Algebra §2.1.1–2.1.3](https://textbooks.math.gatech.edu/ila/vectors.html), coordinate vectors, addition/scaling, displacement and combinations | Endpoint subtraction, combinations, averages, ordered components, modeling interpretations. |
| [ILA §6.1.1–6.1.2](https://textbooks.math.gatech.edu/ila/dot-product.html), definition, norm/distance, zero dot product, angle formula | Dot-product sums, normalization, distance, orthogonality, cosine sign and zero-vector limits. |
| [ILA §3.4.1–3.4.2](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html), composition, row/column multiplication and dimensions | Typed matrix/vector results, product order and direct basis-input checks. |
| [ILA §2.7.1–2.7.3](https://textbooks.math.gatech.edu/ila/dimension.html), basis definition, original pivot columns, null-space bases | Accept independently spanning bases of the requested space; preserve original-column restrictions where asked. |
| [ILA §2.8](https://textbooks.math.gatech.edu/ila/bases-as-coord-systems.html), coordinate coefficients and uniqueness | Coordinates and reconstruction; a change of basis changes coordinates, not the vector. |
| [ILA §3.5.1–3.5.3](https://textbooks.math.gatech.edu/ila/matrix-inverses.html), inverse definition, 2×2 determinant test and inverse-based solutions | Exact inverses, identity-product checks, solving with a given inverse. |
| [ILA §3.3](https://textbooks.math.gatech.edu/ila/linear-transformations.html), defining properties and matrix columns | Transformation matrices and output reconstruction; proofs of linearity remain open. |
| [ILA §6.3.1–6.3.2](https://textbooks.math.gatech.edu/ila/projections.html), orthogonal decomposition, line projection, closest output | Projection/residual fields and scale invariance. |
| [ILA §6.5.1–6.5.2](https://textbooks.math.gatech.edu/ila/least-squares.html), normal-equation characterization and uniqueness | Rank-deficient complete coefficient families and residual certificates. The author uses residual `b−Ax` and coefficient order intercept then slope. |
| [ILA §5.1](https://textbooks.math.gatech.edu/ila/eigenvectors.html), nonzero eigenvectors and eigenspaces | Direct eigenvector tests and eigenspace dimension; zero is excluded as an eigenvector. |
| [Mathematics for Machine Learning §4.5, Theorem 4.22, printed pp.119–129](https://mml-book.github.io/book/mml-book.pdf#page=125) | Full rectangular SVD dimensions; nonnegative diagonal Sigma; orthogonal U and V; reconstruction. Downloaded the publisher-hosted PDF and inspected the passage with `pdftotext` after the browser PDF extractor failed. |

The source file itself is intentionally not changed in this parallel authoring branch. Integration must update reviewed hashes in `content/sources.json` only for the resulting changed exercises after verifying these pinned passages cover each final adaptation. Existing citation keys already cover the listed concepts.

Every adaptation uses one deterministic assessment. Short explanations replaced by a reason selection are recorded as an evidence change. Typed answers retain production. Basis and factorization controls are ordinary matrix text inputs with no answer-count or discovered-dimension hints. Proof and explicitly requested derivation/trace tasks retain a single open submission.
