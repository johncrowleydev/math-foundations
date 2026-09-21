# Final mathematical verification: Discrete Mathematics and Linear Algebra

Reviewed 2026-09-20 against `3719ac2` (the merged curriculum-wide Review audit). This is an independent mathematical pass over 15 Discrete Mathematics and 12 Linear Algebra instructional lessons, plus their reading-only introductions. The deterministic conversion in PR #6 and coverage work in PR #9 were inspected as context, not accepted as mathematical evidence.

## Scope and method

The published notebook contains **2,064 distinct questions** in these subjects: **1,343 Discrete Mathematics** and **721 Linear Algebra**. This includes **54 promoted quick checks**; their inline choice forms and explanations were also read, but they are not counted again. The other **2,010** questions originate in worksheets. Both introductions contain zero questions.

All published prompts and official answers were read, independently calculated or reasoned through, and compared, including optional Practice questions. All 27 lesson explanations and substantive proofs were read in sequence. Repeated numerical families were checked using their common derivation and each instance's actual values; checking one representative was not treated as checking the family. Domains, quantifier order, theorem hypotheses, endpoints, dimensions, alternative constructions and the distinction between a proof and a numerical example were explicit checks. Published concept/skill assignments were inspected by groups of identical metadata, alongside the actual prompts and evidence levels.

This is an agent's mathematical review, **not a machine-checked proof of every answer**. The extraction scripts only exposed the compiled material and grouped metadata; they were not independent mathematical oracles. The independent executable part added here is deliberately smaller: **648 finite cases** in `tests/curriculum/curriculum-counterexamples.test.ts`, using elementary Boolean conditions, finite images and composition computed without the grading implementation. These cover all 16 predicate interpretations for each of three repaired quantified items (48), all 72 maps for the repaired composition item, all 512 map/subset combinations for the repaired image item, and all 16 one-user access policies. Existing authoring fixtures run during generation, but were not used as the justification for mathematical correctness.

## Findings and repairs

**No BLOCKING or HIGH mathematical findings.** Six current official explanations fail to match the domains or labels imposed when their prompts were converted to structured input: three MEDIUM and three LOW. Their underlying unrestricted counterexamples are mathematically valid; they are not valid presentations of the currently requested answer without changing or relabeling the problem. No incorrect numerical result or invalid substantive proof was found in the remaining reviewed material.

### MEDIUM — `predicates-and-quantifiers-95`

- **Lesson:** Predicates and Quantifiers, “Valid and invalid quantified arguments.”
- **Issue:** The prompt fixes `D={a,b}` but the official answer and correct feedback construct the singleton domain `D={a}`. It does not specify the requested second element's predicate values.
- **Independent reason:** The premises are `∀x(P(x)→Q(x))` and `∃x Q(x)`; the proposed conclusion is `∃x P(x)`. On the required domain, set both P values false, Q(a) true and Q(b) false. Both implications are true, Q has witness a, and P has none.
- **Fix applied:** Publish exactly that two-element interpretation and explain both premises and the failed conclusion.
- **Grader involvement:** Explanation/response-contract mismatch. The Boolean-model validator already correctly checks both domain elements; its acceptance semantics are unchanged. All 16 interpretations are independently checked in the new regression test.

### MEDIUM — `functions-73`

- **Lesson:** Functions, “Proofs, counterexamples, and mixed reasoning.”
- **Issue:** The converted prompt requires `A={1,2,3}`, `B={a,b}` and finite map/subset inputs. The answer still uses the real square function, input -1 and output 1, outside these declared sets.
- **Independent reason:** Choose f(1)=a, f(2)=a, f(3)=b, S={1}, W={2}. Then S∩W is empty, so its image is empty; the intersection of the two images is {a}. The different preimages explain the failed equality.
- **Fix applied:** Publish this finite map and both calculated sides.
- **Grader involvement:** The finite-map validator already accepts this witness and alternate maps. No validator change. Exhaustively checking 8 maps and 8×8 pairs of subsets verifies the distinction independently.

### MEDIUM — `proof-by-contrapositive-50`

- **Lesson:** Proof by Contrapositive, “Sets and functions.”
- **Issue:** The prompt specifies `A={a,b}`, `B={1,2,3}`, `C={u,v}`; the answer instead shrinks these to sets of sizes 1, 2 and 1. The singleton argument therefore bypasses the actual two-input injectivity obligation.
- **Independent reason:** Set f(a)=1, f(b)=2 and g(1)=u, g(2)=v, g(3)=u. The two composition outputs differ, so the composition is injective. The outer function has a collision at 1 and 3.
- **Fix applied:** Publish the full assignments and these two checks on the required sets.
- **Grader involvement:** Existing structured checks correctly enforce this condition. The new independent enumeration checks all 9 inner maps and 8 outer maps, including collisions inside versus outside the inner image.

### LOW — `predicates-and-quantifiers-83`

- **Lesson:** Predicates and Quantifiers, “Equivalence laws and countermodels.”
- **Issue:** The answer explains odd/even predicates on `{1,2}` while the editor fixes `{a,b}` and offers P(a), Q(a), P(b), Q(b). The model is isomorphic, but the answer never supplies the requested labeling.
- **Independent reason:** P(a) and Q(b) true, with the other two false, make `∀x(P∨Q)` true and both universal disjuncts false.
- **Fix applied:** State those four predicate values on `{a,b}`.
- **Grader involvement:** Feedback/editor labeling only; all 16 truth assignments are independently checked.

### LOW — `predicates-and-quantifiers-84`

- **Lesson:** Predicates and Quantifiers, “Equivalence laws and countermodels.”
- **Issue:** The same unexplained `{1,2}` versus `{a,b}` relabeling occurs for the two-existentials inference.
- **Independent reason:** P(a) and Q(b) true, with the other two false, provide separate witnesses but no shared witness for P∧Q.
- **Fix applied:** State those predicate values on the requested domain.
- **Grader involvement:** Feedback/editor labeling only; all 16 assignments are checked.

### LOW — `sets-and-set-operations-64`

- **Lesson:** Sets and Set Operations, “Policies, proofs, and counterexamples.”
- **Issue:** The structured prompt explicitly requires numeric user labels; its answer uses the symbol u, which the numeric finite-set response does not support.
- **Independent reason:** On U={1}, let S=X={1} and E=T=∅. The final union with X admits the suspended user. The unwanted result is independent of employee/training membership.
- **Fix applied:** Use numeric user 1 throughout the example.
- **Grader involvement:** Supported-notation mismatch in the explanation. No acceptance change; all one-user policies are independently checked.

## Per-lesson disposition

“NO ISSUE” means no substantive mathematical defect was found in this pass; it is not a guarantee against every possible future input. Counts include promoted quick checks.

| Lesson                                    | Questions | Disposition                | Independent checks of particular risk                                                                                                                                                   |
| ----------------------------------------- | --------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propositional Logic                       |       155 | NO ISSUE                   | Inclusive OR, implication/converse/inverse, only-if direction, truth-table rows, equivalence transformations, argument countervaluations and satisfiability.                            |
| Predicates and Quantifiers                |       122 | MEDIUM/LOW, repaired above | Free/bound scope, capture-free renaming, quantifier order, empty domains, uniqueness, witness dependence and countermodels.                                                             |
| Sets and Set Operations                   |        82 | LOW, repaired above        | Element/subset distinction, complement universe, empty power set, both-inclusion proofs, three-set union 33 and exactly-two count 11, empty partitions.                                 |
| Relations                                 |        82 | NO ISSUE                   | Reflexivity on the stated set, repeated vertices in transitivity, symmetric versus antisymmetric, congruence classes, composition order, Hasse covers and positive/zero-length closure. |
| Functions                                 |        82 | MEDIUM, repaired above     | Domain/codomain/image distinction, inverse restrictions, both composition converses, finite/empty cases, preimage laws, image-intersection counterexamples and interval endpoints.      |
| Sequences and Summations                  |        82 | NO ISSUE                   | First indices, inclusive bounds, empty sums/products, geometric ratio 0/1 cases, telescoping denominators, nested reindexing and signed bounds.                                         |
| Direct Proof                              |        82 | NO ISSUE                   | Arbitrary inputs, distinct existential witnesses, integer closure, rational denominators, zero-divisor avoidance, cases, set equalities and existence versus uniqueness.                |
| Proof by Contrapositive                   |        82 | MEDIUM, repaired above     | Negation versus contraposition, unchanged universal scope, parity domain, exhaustive small-modulus cases, rationality and boundary inequalities.                                        |
| Proof by Contradiction                    |        82 | NO ISSUE                   | Whole-statement negation, lowest terms, irrationality lemmas, prime-divisor existence, Euclid's nonprime product-plus-one example, temporary assumptions and inverse uniqueness.        |
| Mathematical Induction                    |        82 | NO ISSUE                   | Matching bases, exact hypotheses, sum and divisibility algebra, inequality bridge thresholds, paired claims, loop invariant and machine-integer caveat.                                 |
| Strong Induction                          |        82 | NO ISSUE                   | Earlier-index ranges, 4/7 and 5/8 postage bases, Fibonacci bounds, prime-factorization existence only, arbitrary recursive splits and well-founded termination.                         |
| Combinatorics                             |        82 | NO ISSUE                   | Ordered/unordered choices, leading zero, identical versus labeled objects, circular symmetries, stars and bars, inclusion-exclusion, pigeonhole and uniform overcount correction.       |
| Recurrence Relations                      |        82 | NO ISSUE                   | Initial data, first/second-order formulas, repeated and zero roots, Hanoi lower bound, powers-of-two domain, internal levels/leaves and inequality versus equality.                     |
| Graph Theory                              |        82 | NO ISSUE                   | Stated simple/directed conventions, length-zero and empty cases, handshaking, tree proofs, BFS/DFS tie order, topological orders, Euler connectivity and Hamiltonian distinction.       |
| Asymptotic Growth                         |        82 | NO ISSUE                   | Fixed constants/thresholds, O/Ω direction, matching Θ bounds, epsilon order, irregular subsequences, logarithm bases, exact loops, bit length and cost model.                           |
| Vectors and Linear Combinations           |        76 | NO ISSUE                   | Coordinate order, component arithmetic, linear combinations, zero vector and modeling restrictions.                                                                                     |
| Dot Products, Length, and Angle           |        76 | NO ISSUE                   | Dot/norm arithmetic, zero normalization, nonzero angle conditions, all perpendicular witnesses, distance and scale-sensitive modeling.                                                  |
| Matrices and Matrix Multiplication        |        70 | NO ISSUE                   | Rectangular shapes, product order, column versus row interpretation, transpose identities, noncommutativity and zero divisors.                                                          |
| Systems of Linear Equations               |        70 | NO ISSUE                   | Augmented rows, legal row operations, inconsistency, free parameters, homogeneous solutions and direct substitution.                                                                    |
| Span and Linear Independence              |        74 | NO ISSUE                   | Span membership, dependence witnesses, zero/closure tests, original-column versus row-reduction reasoning and counterexamples.                                                          |
| Bases, Coordinates, and Dimension         |        20 | NO ISSUE                   | Basis span/independence, nonunique bases versus unique coordinates, ambient dimension, empty basis and exchange reasoning.                                                              |
| Rank, Nullity, Determinants, and Inverses |        55 | NO ISSUE                   | Column-based rank-nullity, original pivot columns, null/column bases, square invertibility, determinants and compatible left/right identities.                                          |
| Linear Transformations                    |        70 | NO ISSUE                   | Both linearity laws, affine translations, kernel/image dimensions, declared codomain, matrix order and change-of-basis orientation.                                                     |
| Orthogonality and Projections             |        36 | NO ISSUE                   | Projection denominator, residual orthogonality, Pythagorean minimizer proof, rectangular QQᵀ, Gram–Schmidt remainders and QR shapes.                                                    |
| Least Squares                             |        36 | NO ISSUE                   | AᵀAx=Aᵀb, rank assumptions, unique fitted output versus nonunique coefficients, line fit (7/6,1/2) with SSE 1/6, weights and predictive limits.                                         |
| Eigenvalues and Eigenvectors              |        64 | NO ISSUE                   | Nonzero eigenvectors, eigenspace bases, repeated roots/defects, real rotation counterexample, diagonalization, powers and dominance conditions.                                         |
| Singular Value Decomposition              |        74 | NO ISSUE                   | Full rectangular U/Σ/V shapes, AᵀA, nonnegative scales, rank/nullity for wide matrices, alternative factors, Frobenius truncation and conditioning.                                     |

The level checks found no additional material evidence overclaim. Recognition-only selections remain recognition even when inherited skill names include “justify” or “prove”; they do not demonstrate a produced proof. Constructing a complete finite countermodel is appropriately production, including when input is a set of selected true atoms. Open proofs and multistep explanations retain their deeper response route. This pass does not change the frozen Review evidence rules.

## Source verification, implementation and limits

The repaired examples are original applications of definitions, not copied textbook exercises. On 2026-09-20 the existing Hammack passages were reopened: [§2.7, quantified domains](https://richardhammack.github.io/BookOfProof/Main.pdf#page=65), [§1.5, union/intersection](https://richardhammack.github.io/BookOfProof/Main.pdf#page=30), [§12.4, composition](https://richardhammack.github.io/BookOfProof/Main.pdf#page=247), and [§12.6, image/preimage](https://richardhammack.github.io/BookOfProof/Main.pdf#page=254). Their assigned broader citations already cover these claims. Their check dates and only the four affected lesson digests were updated after inspecting the candidate publication.

The defect arose because deterministic conversions could replace prompts but not official answers. A narrowly scoped optional `answer` override now accompanies the existing `prompt`/`instructions` overrides in `content/deterministic-exercises.json`. An explicit answer must match correct feedback and pass math validation. The publication regression checks all six repaired answers and their unchanged historical source pins. This preserves the original worksheets and historical audit rather than rewriting their past unrestricted questions to satisfy a new editor. Current generated outputs are rebuilt normally; historical frozen Review instances keep their stored definitions.

No exercise ID, lesson slug, assessment predicate, accepted response set, source worksheet, scheduler rule or evidence assignment changes. Existing accepted/incorrect/input-error fixtures remain intact. The historical deterministic coverage ledger is regenerated normally; only its current catalog version changes. Screenshots and full combined CI are recorded by the parent verification pass.

The manual audit does not claim exhaustive hostile-string testing, TypeScript/Go parity, rendering verification of every formula/figure, or validation of AI grading for open proofs. Those require the separate deterministic and browser audits. The 648 independent finite cases here exercise TypeScript only; the shared cross-language corpus belongs to that separate audit. No new Review cards or subject content were added.

## Targeted validation

Passed on this scoped branch:

- `npm run content:build`: normal source/math/fixture validation and regeneration; 75 lessons, 4,284 questions, 2,527 inline placements across the complete curriculum.
- `npx tsx tools/audit/deterministic-coverage.ts --write`: historical disposition preservation and normal ledger regeneration.
- `npx tsx --test tests/curriculum/curriculum-counterexamples.test.ts tests/curriculum/deterministic-coverage.test.ts`: 10 tests passed, including the 648 independently derived finite cases and six answer-publication regressions.
- `npm run typecheck`.
- Prettier checking of all changed files.

Full curriculum, Go/race, cross-language and browser checks are intentionally recorded once in the combined verification pass, rather than represented here as completed on this isolated concern branch.

The first combined run caught omitted inspection bookkeeping for these six published explanations: their curriculum-unit hashes still described the old answers, and two TeX inventories omitted `\\varnothing` and `\\ne` now used by the repaired answers. The integrating pass recorded only the six already-inspected answers, retained their historical syntax support, and added those two previously taught symbols. No unrelated inspection record was refreshed. The corrected Functions 73 explanation was visually checked on [desktop](../screenshots/final-curriculum/finite-image-counterexample-desktop.png) and [phone](../screenshots/final-curriculum/finite-image-counterexample-phone.png).
