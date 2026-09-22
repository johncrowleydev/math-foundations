# TeX inspection baseline — 21 September 2026

`npm run audit:tex` reported 24 stale records: 23 quick-check inspections and
one teaching placement. All 24 still refer to existing content. None was an
obsolete record, an incorrect content match, or an authored TeX error.

## Root cause and scope

Commit `13e20de` preserved native MDX component tags in static teaching metadata.
It updated the `teachingHash` of 23 checks in `content/quick-checks.yaml`, but left
the encompassing TeX question fingerprints unchanged. For **each** of those 23
records, replacing only the current `teachingHash` with its value from
`13e20de^` reproduces the old TeX fingerprint exactly. The prompt, every answer
choice, answer index, explanation, ID, and placement are unchanged. Keeping the
teaching context in the fingerprint is intentional: this repair does not exclude
it from future inspections.

Commit `3020eaa` subsequently expanded the power-set section's bit-mask paragraph
into an explanation and four-row table. It updated the corresponding quick
check's teaching hash again but left the TeX placement inspection stale. Taking
the section from `3020eaa^` reproduces that placement's old fingerprint exactly;
the TeX command sequence before and after that edit is identical.

Resolution: reinspected and updated precisely these 24 fingerprints, with a dated,
individual note for each quick check. No records were deleted and no audit
matching or validation rules were changed. This repair changes inspection metadata
in `content/tex-teaching.json`, not lesson prose, questions, answers, required
syntax, exercise IDs, or grading contracts.

## Individual inspections

Every row includes reading the full prompt, all alternatives, and explanation;
the final row also includes the full current teaching section and its three
syntax examples. All quick checks remain selection controls.

| Record                                                                | Inspection and resolution                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `predicates-and-quantifiers/quick-1`                                  | One integer witness, 11, establishes existence. `exists`, `in`, `mathbb`, and thin-space commands remain taught before the check. Updated the metadata-stale fingerprint.                                                                                                 |
| `predicates-and-quantifiers/quick-2`                                  | The choice `y=x+1` may depend on `x`; reversing quantifiers changes the claim. Quantifiers, membership, and spacing remain valid. Updated the metadata-stale fingerprint.                                                                                                 |
| `sets-and-set-operations/quick-1`                                     | A singleton subset is not an element of this two-number set. Escaped braces, `in`, and `subseteq` remain correct. Updated the metadata-stale fingerprint.                                                                                                                 |
| `sets-and-set-operations/quick-2`                                     | The explanation lists precisely the four subsets; `varnothing` and escaped braces remain correct. The current teaching table maps `00`, `10`, `01`, `11` to those four subsets. Updated the fingerprint for both historical teaching-hash changes.                        |
| `functions/quick-1`                                                   | Distinct outputs establish injectivity; a missed codomain member rules out surjectivity. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                         |
| `combinatorics/quick-2`                                               | Thirteen people in twelve months guarantee at least two in a month, not exactly two. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                             |
| `graph-theory/quick-1`                                                | Every undirected edge contributes one degree at each endpoint. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                                                   |
| `graph-theory/quick-2`                                                | Euler trails cover edges; Hamiltonian cycles concern vertices. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                                                   |
| `asymptotic-growth/quick-1`                                           | A fixed positive comparison constant works beyond a fixed threshold. Existing big-O instruction covers the notation. Updated the metadata-stale fingerprint.                                                                                                              |
| `linear-algebra-vectors/quick-1`                                      | The zero vector has zero length and no direction, and scaling any vector by zero produces it. No typed TeX is needed. Updated the metadata-stale fingerprint.                                                                                                             |
| `linear-algebra-dot-products/quick-2`                                 | Orthogonal nonzero vectors have zero dot product; unit length is unnecessary. No typed TeX is needed. Updated the metadata-stale fingerprint.                                                                                                                             |
| `linear-algebra-span/quick-1`                                         | Coefficient one on the zero vector gives a nontrivial zero combination. No typed TeX is needed. Updated the metadata-stale fingerprint.                                                                                                                                   |
| `linear-algebra-eigenvalues/quick-1`                                  | Eigenvalue -2 reverses direction and doubles length. No typed TeX is needed. Updated the metadata-stale fingerprint.                                                                                                                                                      |
| `linear-algebra-svd/quick-1`                                          | Singular values are nonnegative; orthogonal factors encode direction changes. No typed TeX is needed. Updated the metadata-stale fingerprint.                                                                                                                             |
| `calculus-limits-continuity/quick-1`                                  | Changing only the function value at the approached point leaves the limit unchanged. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                             |
| `calculus-derivatives/quick-1`                                        | With `a=2` and `h=-0.1`, the nearby input is 1.9 and the secant slope is 3.9. Superscript syntax remains valid and previously taught. Updated the metadata-stale fingerprint.                                                                                             |
| `calculus-power-series-taylor/quick-2`                                | A uniform derivative bound controls the unknown intermediate derivative. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                                         |
| `probability-statistics-probability-models-events/quick-2`            | Intersection probability must be between 0.3 and 0.6, excluding 0.2. Decimal inline math introduces no command. Updated the metadata-stale fingerprint.                                                                                                                   |
| `probability-statistics-conditional-probability-independence/quick-1` | Conditioning restricts the denominator to 25 records, yielding 15/25. `mid` remains previously taught. Updated the metadata-stale fingerprint.                                                                                                                            |
| `probability-statistics-discrete-random-variables/quick-1`            | An integer outside the stated support has probability zero. Inline math introduces no command. Updated the metadata-stale fingerprint.                                                                                                                                    |
| `probability-statistics-normal-distributions-transformations/quick-1` | The right-tail probability is one minus the normal CDF. Capital `Phi` remains previously taught. Updated the metadata-stale fingerprint.                                                                                                                                  |
| `probability-statistics-confidence-intervals/quick-1`                 | Confidence describes the procedure's repeated-sampling coverage. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                                                 |
| `probability-statistics-regression-interpretation/quick-1`            | For fixed common Gaussian error variance, maximizing coefficient likelihood minimizes SSE. No TeX commands. Updated the metadata-stale fingerprint.                                                                                                                       |
| `typing-sets-and-set-operations-power-sets`                           | Read the restored bit-mask explanation and table; its four choices and empty-set case agree with the power-set definition. The existing `cdot`, `cdots`, and `mathcal` examples and dependencies remain valid. Updated the fingerprint for the legitimate passage change. |

## Supporting passages and validation

Rechecked the power-set definition and cardinality against Hammack,
[Book of Proof, §1.4, printed p. 15](https://richardhammack.github.io/BookOfProof/Main.pdf#page=27),
and the fixed-position subset/bit-sequence correspondence against Lehman,
Leighton, and Meyer,
[Mathematics for Computer Science, §4.5.1, Theorem 4.5.5, pp. 117–118](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=125).
Rechecked the command examples against the official
[KaTeX supported functions reference](https://katex.org/docs/supported.html)
(binary operators, dots, font families, delimiters, and logic/set notation).
These sources already have explicit assignments in `content/sources.json`.

Only the syntax and sets-lesson source-review digests need updating: they include
the inspection metadata edited here. They were computed from the candidate
published lesson and the inspected syntax/typing data, after the checks above;
no source assignments or unrelated lesson review digests were refreshed.

Validation: `npm run audit:tex`, `npm run content:build`,
`npm run content:validate`, the TeX teaching tests, and formatting checks pass.
The generated notebook and grading catalog are unchanged by this metadata repair.

The published compatibility fixture retains every original deployment hash. Its
single explicit inspected update pins the repaired `content/tex-teaching.json`
artifact to commit `0c684d08d78f37a69b0af77990c0bc5fbe9fd600` and this report.
The normalized artifact changed only through the 23 quick-check fingerprints and
dated inspection notes; the existing normalization already omits placement
hashes. The test still compares the complete normalized artifact against an exact
SHA-256, with no additional fields excluded, and names the applicable provenance
for each artifact. All ten published compatibility checks pass after rebuilding.
