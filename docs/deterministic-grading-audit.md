# Deterministic grading audit

Audit date: September 19, 2026. This is a feasibility and authoring audit; no exercise, answer, grade, learner data, or application behavior was changed.

**1,409 currently open-response lesson exercises are candidates for full deterministic conversion:** 458 through authored choices and 951 through structured inputs. Another 87 have deterministic parts but retain required open reasoning/work. 385 should retain open-response grading under their current learning objectives. There are already 183 deterministic lesson items.

These are candidate counts, not a claim that every change is a drop-in control replacement. Some proposals explicitly replace a requested prose explanation with reason selection or structured verification. Those changes must be reflected in the prompt and evidence mapping. With those authoring changes, the full-conversion candidates would bring deterministic lesson coverage to 1,592/2,064 (77.1%). This is item coverage, not a forecast of model-call frequency or cost.

Within the 951 structured candidates, 180 explicitly flag replacing required explanations with reason recognition, and 16 flag constrained production/scaffolding. The remaining 755 still need the specified fields and validators; they are not automatically final-answer-only tasks. Preserve open reasoning wherever generating that reasoning remains the intended objective.

The [complete item inventory](deterministic-grading-audit.json) contains every exercise key, published question and answer, recommended input, grading requirements, and retained limitations. It also contains every dedicated review variant and a mapping of every effective review template back to the audited item. The lists below use stable exercise IDs, not the displayed ordinal position in a practice session.

## Scope and counting

- Current working branch snapshot `744888e`: 2,010 worksheet exercise identities and 54 promoted quick checks, across 27 instructional lessons and two reading-only introductions. All 2,064 published items were assigned an audit classification after examining their full adapted tasks and reference answers.
- Latest locally available `origin/main` snapshot `e470e43`: 2,060 lesson items plus 69 dedicated review templates. All 2,060 overlapping questions, instructions, mathematics, tables, answers, and choices match the current branch after removing glossary-link markup. The current branch adds only the already-deterministic checks `linear-algebra-bases-74`, `linear-algebra-bases-75`, `linear-algebra-projections-71`, and `linear-algebra-projections-72`. This audit therefore covers both snapshots without counting branch copies twice.
- Dedicated Review: 63 authored families, three fixed templates, and three generators. The 167 authored variants plus six fixed/generated declarations give 173 issuable question definitions. Each authored template's representative question duplicates its first variant and is counted once.
- The real Go Review catalog exposes 3,183 effective templates: 3,114 lesson-derived target mappings using 2,040 distinct lesson exercise keys, plus 69 dedicated templates. Multiple concept/skill mappings do not create new question content. Twenty existing choices are excluded from this reuse pool by the constructive-skill evidence rule; they are still covered in the lesson audit.
- Inspected source boundaries include worksheets, `exercise-copy.yaml`, choice conversion/feedback files, quick-check promotion, lesson placement/evidence metadata, linear-algebra authoring inputs and generators, review declarations and generator implementations, and the generated grading catalogs. Lesson examples, reference entries, formula explanations, and TeX instruction/placement records provide teaching context, rather than an additional graded question bank. Planned future subjects and retired historical clients are outside the current authored submission corpus.

The current catalog, rather than the original worksheet alone, determines what the grader actually requires. `scripts/notebook-exercises.ts` takes the learner-facing instructions, prompt, and answer from `content/exercise-copy.yaml`; `scripts/build-content.ts` publishes those adapted questions. Some original worksheet-wide instructions require work that the adapted prompt does not. A worksheet-format conversion must separately preserve that instruction; the classification here follows the actual published task and records material differences.

## Lesson results

“Choice” means a new TF/MC or related finite-selection proposal; it may require authored reasons or a response-format redesign. “Structured” means a full deterministic-input candidate. “Mixed” retains an open component. “Open” retains its current free-response objective.

| Lesson                                      |    Total | Already deterministic |  Choice | Structured |  Mixed |    Open |
| ------------------------------------------- | -------: | --------------------: | ------: | ---------: | -----: | ------: |
| Propositional Logic                         |      155 |                    45 |      28 |         68 |     12 |       2 |
| Predicates and Quantifiers                  |      122 |                    33 |      45 |         30 |      9 |       5 |
| Sets and Set Operations                     |       82 |                     9 |      18 |         36 |      4 |      15 |
| Relations                                   |       82 |                    13 |      12 |         39 |      2 |      16 |
| Functions                                   |       82 |                    12 |      17 |         31 |      9 |      13 |
| Sequences and Summations                    |       82 |                     3 |      10 |         62 |      0 |       7 |
| Direct Proof                                |       82 |                     4 |      11 |         13 |      1 |      53 |
| Proof by Contrapositive                     |       82 |                     6 |      25 |          7 |      0 |      44 |
| Proof by Contradiction                      |       82 |                     2 |      27 |          4 |      2 |      47 |
| Mathematical Induction                      |       82 |                     4 |      23 |          1 |      0 |      54 |
| Strong Induction                            |       82 |                     3 |      28 |         10 |      1 |      40 |
| Combinatorics                               |       82 |                     3 |       5 |         65 |      3 |       6 |
| Recurrence Relations                        |       82 |                     2 |      12 |         57 |      2 |       9 |
| Graph Theory                                |       82 |                    13 |      27 |         29 |      2 |      11 |
| Asymptotic Growth and Algorithmic Reasoning |       82 |                     4 |      26 |         25 |     14 |      13 |
| Vectors and Linear Combinations             |       76 |                     2 |      14 |         55 |      1 |       4 |
| Dot Products, Length, and Angle             |       76 |                     2 |       7 |         63 |      0 |       4 |
| Matrices and Matrix Multiplication          |       70 |                     2 |      12 |         53 |      0 |       3 |
| Systems of Linear Equations                 |       70 |                     2 |       7 |         56 |      0 |       5 |
| Span and Linear Independence                |       74 |                     2 |      22 |         22 |     13 |      15 |
| Bases, Coordinates, and Dimension           |       20 |                     2 |       2 |          9 |      6 |       1 |
| Rank, Nullity, Determinants, and Inverses   |       55 |                     2 |      16 |         32 |      0 |       5 |
| Linear Transformations                      |       70 |                     3 |      12 |         42 |      6 |       7 |
| Orthogonality and Projections               |       36 |                     2 |       6 |         27 |      0 |       1 |
| Least Squares and Model Fitting             |       36 |                     2 |       7 |         26 |      0 |       1 |
| Eigenvalues and Eigenvectors                |       64 |                     3 |       8 |         50 |      0 |       3 |
| Singular Value Decomposition                |       74 |                     3 |      31 |         39 |      0 |       1 |
| **Total**                                   | **2064** |               **183** | **458** |    **951** | **87** | **385** |

## Recommended inputs

| Input                                  | Suitable tasks and examples                                                                           | Grading and UI recommendation                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truth table / Boolean values           | Propositional logic 15–30 and 40–45; satisfiability, equivalence, validity, and counterassignments    | Provide headers and given assignments, with blank intermediate/result cells. Tap blank → T → F → T. Use a separate Clear action; blank is not false. Check every required cell, not just the final column.                                                                                                      |
| Classification with reasons            | Proposition status/truth, relation properties, finite diagnoses, law names, domain/codomain decisions | Use one complete-answer radio group where 2–4 options suffice. Otherwise use small labeled decisions plus a reason selection. This latter form needs a multipart assessment model; it is not already supported by the existing single-choice control.                                                           |
| Numbers, tuples, and exact expressions | Counts, sequence terms, finite sums, scalar quantities, coordinates, witness values                   | Small labeled fields accepting integers, fractions, and the required mathematical grammar. Compare exact values where possible; author a tolerance only when the task permits approximation. Avoid string-matching equivalent fractions or numbers.                                                             |
| Vectors and matrices                   | Matrix products, coordinates, normal equations, projections, residuals, eigen/SVD calculations        | Dimensioned cell grids with a clear row/column order and fraction support. Show separate grids for explicitly required intermediate products. Validate identities and required shape; accept nonunique valid outputs.                                                                                           |
| Finite sets, partitions, and intervals | Set operations, power sets, relation pairs, finite images/preimages, interval operations              | Chips for a fixed universe; nested groups for sets of sets or partitions; endpoint fields with open/closed toggles for intervals. Ignore set order but preserve nesting, tuple order, and domain.                                                                                                               |
| Finite relation / countermodel         | Relation properties, closures/composition, function maps, quantified countermodels                    | Labeled Boolean adjacency matrix or explicit pair selection. Add witness/refutation selections when justification is required. Accept any construction satisfying the specified properties, not only the example in the answer.                                                                                 |
| Graph, path, and traversal             | Graph construction, adjacency, components, paths, Euler certificates, BFS/DFS traces                  | Node/edge selections and ordered vertex chips, with optional step tables for a required traversal order. Check the stated graph convention, edge use, vertex repetition, start point, and tie-breaking rule.                                                                                                    |
| Witness / counterexample               | Quantified statements, invalid arguments, false algebraic claims                                      | Collect the constructed value/object and verification fields. Validate the property that makes it a witness or counterexample. A concrete refutation is often finite even when the prompt uses “show” or “refute.”                                                                                              |
| Boolean and quantified formulas        | De Morgan rewrites, negated implications, quantified negations                                        | Compact expression editor with symbol insertion, or a structured formula builder. Check Boolean equivalence and the requested syntactic form. For quantifiers, check scope, domains, variable binding, and permitted transformations; do not pretend arbitrary first-order equivalence is a simple parser task. |
| Calculation checkpoints                | Row reduction, finite substitutions, recurrence tables, factor trees, algorithm traces                | Add only the fields needed for the requested method. For row reduction, collect operation + resulting matrix and validate each transition. Final-answer equality alone does not establish the requested intermediate work.                                                                                      |
| Short named term                       | Dedicated Review `witness-definition-variants`, variant 1                                             | A normal short-text field with whole-answer normalization and an explicit alias list preserves term production. Substring matching would incorrectly accept sentences such as “not a witness.”                                                                                                                  |

The smallest additions are whole-term matching, Boolean cells, exact numeric fields, and fixed-size tuples/grids. Finite sets, relation/graph certificates, and invariant checks for bases or solution families require more validation but remain bounded. Expression parsing, exact radicals, arbitrary row-operation sequences, and derivation workspaces are a larger tier. They are feasible candidates, not equally easy changes. Keep the initial expression grammar limited to forms the authored task actually needs, including fractions and simple radicals when exact answers require them; do not introduce a broad symbolic system just to avoid declaring that scope.

### Truth-table component

The user-proposed behavior fits the six explicit truth-table exercises immediately, and the same Boolean field model serves the sixteen fixed-assignment evaluation exercises. A representative initial table for propositional-logic-40 is:

| p (given) | q (given) | ¬p    | ¬p ∨ q |
| --------- | --------- | ----- | ------ |
| T         | T         | blank | blank  |
| T         | F         | blank | blank  |
| F         | T         | blank | blank  |
| F         | F         | blank | blank  |

Use actual T/F labels, not color alone. Every editable cell needs its column formula and row assignment as its accessible name. Support keyboard T/F, Space to toggle, and a clear/reset action. Preserve touched blank state in drafts, prevent submission with missing required cells, and keep the existing feedback-reveal behavior. On phones, keep the given variable columns visible while allowing a wide table to scroll horizontally; use row/column highlighting to retain context.

For a counterassignment task, leave the variable cells editable rather than supplying the answer assignment. Collect any explicitly requested premise/conclusion values too. For equivalence/validity over a finite Boolean domain, exhaustive rows can provide a deterministic certificate when that is an allowed justification method. A truth table does not satisfy a prompt that specifically requires an equivalence-law derivation.

Exercises 40–45 currently say “including the input columns.” Prefilling those columns requires a small explicit prompt edit to say that inputs are provided. Keep the same exercise IDs and history; recheck source coverage for the changed prompt. Author the Boolean expressions or answer cells as structured metadata, rather than attempting to infer every mathematical requirement from rendered TeX at submission time.

### Nonunique mathematical answers

The most valuable validators check properties. For a basis, verify membership in the target space, independence, and completeness, while enforcing “choose from the original columns” when requested. For an eigenvector, require a nonzero vector and verify the eigen-equation. For a system solution family, a single satisfying vector is insufficient: also verify that the supplied directions span the full nullspace. For SVD or orthonormal bases, allow valid sign/order and repeated-value freedoms while verifying the requested identities. For a counterexample or graph construction, accept every object meeting the authored conditions.

Exact rational entry alone cannot express every valid orthonormal basis or singular-vector rotation. Support the needed radicals/algebraic forms, or explicitly state a constrained input grammar and flag the narrower production task. For systems 17–22, an elimination grid and final tuple are also insufficient: the prompt requests back substitution, so collect and check the successive solving equations. Vectors 41–46 similarly need the coefficient-solving steps when asking the learner to derive coefficients.

Polynomial coefficient normalization is appropriate for bounded polynomial identities; testing a few sample inputs cannot establish a universal identity. Finite relation/Boolean checks can be exhaustive. Unrestricted functions, arbitrary prose, or general proofs require a different level of verification and are not “easy deterministic grading” merely because mathematics has a correct answer.

## Remaining TF / multiple-choice candidates

The following are all primary choice-conversion candidates, grouped by canonical key prefix. Append an ID to its prefix with a hyphen to obtain the stable key. Complete per-item requirements are in the JSON inventory. Many require answer-and-reason options rather than a bare True/False answer; the proposed response-format change must preserve each requested fact.

| Canonical key prefix             | Candidate IDs                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `propositional-logic`            | 1–8, 36–38, 46–47, 73–75, 80, 87, 89–90, 111, 125, 136–137, 141–142, 149, 153           |
| `predicates-and-quantifiers`     | 7, 10, 19–20, 41–50, 59–61, 64, 66–69, 73–77, 79–82, 85–86, 88, 90–93, 100–102, 116–119 |
| `sets-and-set-operations`        | 7, 9–10, 20, 33, 45, 49, 51, 54–55, 59, 61–63, 71–72, 77–78                             |
| `relations`                      | 8, 11, 16, 19, 22, 33, 48, 58, 69, 71, 78–79                                            |
| `functions`                      | 1, 7–9, 17, 20, 28–30, 34, 37, 40, 49, 51, 53, 68, 77                                   |
| `sequences-and-summations`       | 8–9, 18, 23, 29, 36, 40, 48, 53–54                                                      |
| `direct-proof`                   | 1–2, 4–5, 7, 9–10, 54, 63, 67, 69                                                       |
| `proof-by-contrapositive`        | 1–2, 5, 7, 9–20, 42–43, 61–65, 69–70                                                    |
| `proof-by-contradiction`         | 1–10, 21, 24, 29–30, 41, 43–44, 50, 61–63, 65–70                                        |
| `mathematical-induction`         | 2–6, 8–10, 39–40, 52, 57, 60–70                                                         |
| `strong-induction`               | 1–2, 6–10, 12–14, 16, 20, 23, 29, 40, 44, 49–50, 52, 61–67, 69–70                       |
| `combinatorics`                  | 20, 40, 45, 55, 59                                                                      |
| `recurrence-relations`           | 4–5, 20, 28, 40, 54, 59–60, 69–70, 73, 78                                               |
| `graph-theory`                   | 4, 8–10, 17, 19, 21–25, 27, 30, 38–39, 50, 53, 56, 58, 66–69, 71, 73, 75, 77            |
| `asymptotic-growth`              | 1–3, 8, 10–11, 20, 22–23, 26, 28–29, 31, 35, 40, 50, 59–60, 62, 64–65, 67, 70, 74–76    |
| `linear-algebra-vectors`         | 2, 9–14, 36, 38, 58, 71–74                                                              |
| `linear-algebra-dot-products`    | 35–36, 50, 69–70, 73–74                                                                 |
| `linear-algebra-matrices`        | 30, 43–48, 59, 61, 64, 67–68                                                            |
| `linear-algebra-systems`         | 59, 61, 63, 65–68                                                                       |
| `linear-algebra-span`            | 37–42, 45, 50–51, 53–64, 68                                                             |
| `linear-algebra-bases`           | 15, 17–22, 46–53, 60–61, 63                                                             |
| `linear-algebra-transformations` | 43–44, 51–56, 60–62, 68                                                                 |
| `linear-algebra-projections`     | 2, 49–50, 58–61, 63–68                                                                  |
| `linear-algebra-eigenvalues`     | 2, 30, 44, 51, 54, 57, 60–61                                                            |
| `linear-algebra-svd`             | 1–14, 30, 44, 57, 59–72                                                                 |

There are also 350 items with an explicitly recorded secondary choice redesign. They are not added to the full-conversion total: their primary recommendation either preserves a constructed answer or retains requested reasoning. Selecting a supplied proof, derivation, or witness changes the evidence relative to producing it.

Fixed numerical answers could also be wrapped in multiple-choice distractors. The structured-input recommendation usually preserves the student's calculation better; the secondary list records explicit alternatives rather than every conceivable numerical-choice rewrite.

| Canonical key prefix             | Additional IDs with a choice redesign noted                                         |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `propositional-logic`            | 31–35, 39, 48–69, 72, 79, 108–109, 119–124, 126–135, 138–140, 143–144, 146–148, 151 |
| `predicates-and-quantifiers`     | 1–5, 11–18, 51–58, 62, 70, 83–84, 87, 89, 94–96                                     |
| `sets-and-set-operations`        | 1, 5, 8, 11–19, 27–28, 36, 41–44, 46–48, 56–58, 73–75                               |
| `relations`                      | 1, 9–10, 12–15, 17, 23, 28, 32, 41, 49, 53, 75                                      |
| `functions`                      | 5–6, 15–16, 22–27, 32–33, 42–45, 55–56, 61–67                                       |
| `sequences-and-summations`       | 1, 3–4, 7, 13–17, 22, 25–26, 31–32, 34, 37–38, 46, 51–52, 55, 61–63                 |
| `proof-by-contradiction`         | 60                                                                                  |
| `mathematical-induction`         | 50                                                                                  |
| `strong-induction`               | 30, 37                                                                              |
| `combinatorics`                  | 1, 3–10, 12–15, 18, 21–24, 26, 30, 35–36, 41–43, 46–51, 61–74, 76–77                |
| `recurrence-relations`           | 1–3, 9, 37, 52, 56, 61                                                              |
| `graph-theory`                   | 1–3, 11–12, 14, 16, 20, 41–42, 51–52, 54, 62–63                                     |
| `asymptotic-growth`              | 52, 68                                                                              |
| `linear-algebra-vectors`         | 40, 47–52, 57                                                                       |
| `linear-algebra-dot-products`    | 43–48                                                                               |
| `linear-algebra-matrices`        | 16, 23–28, 49, 66                                                                   |
| `linear-algebra-systems`         | 10, 29, 32, 34, 36, 38, 62                                                          |
| `linear-algebra-span`            | 29–36, 44, 46, 69, 71                                                               |
| `linear-algebra-bases`           | 36, 43–45, 65, 68, 71                                                               |
| `linear-algebra-transformations` | 2, 9–14, 64                                                                         |
| `linear-algebra-projections`     | 16                                                                                  |
| `linear-algebra-eigenvalues`     | 1, 3–8, 23–28, 43, 45–50, 55–56, 59, 62                                             |
| `linear-algebra-svd`             | 29, 31–36, 51–56                                                                    |

## Dedicated Review findings

59 of the 69 dedicated templates already use deterministic choices. Across issuable variants/declarations this is 147 of 173 definitions. All three generated templates—`integer-witness-selection`, `generated-connective-truth-value`, and `generated-integer-conditional-counterexample`—already grade deterministically. Their generators are seeded and use explicit finite parameters; they are not LLM question generators.

The remaining ten templates contain 26 open-response variants. **22 are structured-input candidates**, three retain free prose under their current contract, and one retains an open universal verification unless its allowed construction is constrained. No additional dedicated review variant needs to become multiple choice merely to remove its model call: structured production preserves more of these tasks.

| Template                                          | Variants | Recommendation                                                                                                                                                                                                                 |
| ------------------------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `witness-definition`                              |        1 | Keep free definition recall open. A definition choice is possible but changes production to recognition, which is already available elsewhere.                                                                                 |
| `witness-definition-variants`                     |        2 | Variant 1: deterministic short term “witness.” Variant 2: unrestricted prose cloze remains open; a phrase bank is an optional recognition redesign.                                                                            |
| `implication-negation-production-review`          |        3 | Boolean/inequality expression input; check equivalence and requested negation form. Variant 3 explicitly allows inequalities instead of prose.                                                                                 |
| `de-morgan-production-review`                     |        3 | Boolean expression input with equivalence and negation-normal-form checks.                                                                                                                                                     |
| `counterassignment-construction-review`           |        3 | Editable assignment cells plus the requested formula/premise/conclusion values.                                                                                                                                                |
| `existential-witness-construction-variants`       |        3 | Numeric witness plus substitution/comparison verification cells; accept all valid values in the stated domain.                                                                                                                 |
| `dependent-witness-construction-variants`         |        3 | Variants 1 and 3: exact symbolic identity/checkpoint inputs. Variant 2: arbitrary integer-valued `m(n) > n²` retains universal verification. A `n² + k`, positive-integer-k builder is an easy but narrower authored redesign. |
| `quantifier-negation-production-variants`         |        3 | Variants 1 and 2: structured quantifier/formula construction. Variant 3 explicitly asks for an English sentence; keep prose grading or deliberately change to a sentence builder/complete-statement choice.                    |
| `quantified-counterexample-construction-variants` |        3 | Numeric counterexample plus antecedent/consequent verification cells.                                                                                                                                                          |
| `quantifier-order-countermodel-variants`          |        2 | A 2×2 relation grid plus one witness per row and one refutation per column provides an exhaustive constructive certificate. Replace the prose-verification instruction explicitly with those fields.                           |

The three free-prose entries above are additional TF/MC/phrase-bank possibilities if the learning objective is changed. They are separate from the lesson candidate list. A constrained sentence or definition choice must not continue to claim unrestricted production evidence.

The lesson-derived Review pool uses the same underlying questions and grader. Its current mappings inherit the following lesson recommendations (mapping counts are not unique exercise counts):

| Recommendation        | Effective lesson-derived mappings |
| --------------------- | --------------------------------: |
| existing-choice       |                               162 |
| choice-conversion     |                               806 |
| structured-conversion |                              1565 |
| mixed                 |                               164 |
| open                  |                               417 |

## Items retaining open reasoning

Open items ask the learner to produce proofs or general mathematical explanations, such as propositional-logic-152's contrapositive proof or relations-46's uniqueness of a least element. Mixed items have an objective part that can be checked independently but still require a proof, a specified law-based derivation, or another unrestricted argument. Keep those obligations explicit; neither reference-answer matching nor a few numerical samples verifies them.

| Canonical key prefix             | Mixed IDs                           | Open IDs                                                                         |
| -------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `propositional-logic`            | 48–55, 108–109, 140, 151            | 110, 152                                                                         |
| `predicates-and-quantifiers`     | 51–56, 62, 94, 120                  | 111–115                                                                          |
| `sets-and-set-operations`        | 27, 56, 68, 80                      | 21–26, 30, 37, 39–40, 65, 67, 70, 76, 79                                         |
| `relations`                      | 21, 24                              | 25, 27, 30, 34–36, 39, 46, 50, 56, 59–60, 72–73, 76–77                           |
| `functions`                      | 10, 22, 24–27, 60, 66, 78           | 18, 38, 47–48, 50, 59, 69, 71–72, 74–75, 79–80                                   |
| `sequences-and-summations`       | —                                   | 30, 35, 60, 67–68, 75, 80                                                        |
| `direct-proof`                   | 80                                  | 11–46, 48–50, 61–62, 64–65, 68, 71–79                                            |
| `proof-by-contrapositive`        | —                                   | 8, 21–38, 41, 44–45, 47–49, 51–54, 56–59, 67, 71–80                              |
| `proof-by-contradiction`         | 39, 56                              | 11–20, 22–23, 25–28, 31–33, 35–38, 42, 45–46, 49, 51–55, 57–60, 64, 71–80        |
| `mathematical-induction`         | —                                   | 11–38, 41–49, 51, 53–56, 58–59, 71–80                                            |
| `strong-induction`               | 56                                  | 3, 5, 11, 17, 19, 22, 25–28, 31–36, 38–39, 41–43, 45–48, 51, 53–54, 58–59, 71–80 |
| `combinatorics`                  | 38, 52, 60                          | 32–33, 37, 54, 57–58                                                             |
| `recurrence-relations`           | 34, 51                              | 10, 19, 48, 50, 53, 55, 64, 71, 80                                               |
| `graph-theory`                   | 18, 32                              | 29, 33–34, 46–48, 55, 59–60, 78–79                                               |
| `asymptotic-growth`              | 4–7, 9, 16, 32–33, 54, 71–73, 77–78 | 12–14, 18–19, 21, 24, 27, 30, 37–38, 66, 80                                      |
| `linear-algebra-vectors`         | 57                                  | 35, 37, 53, 55                                                                   |
| `linear-algebra-dot-products`    | —                                   | 49, 51–52, 72                                                                    |
| `linear-algebra-matrices`        | —                                   | 60, 63, 65                                                                       |
| `linear-algebra-systems`         | —                                   | 50, 57–58, 60, 64                                                                |
| `linear-algebra-span`            | 23–29, 31–36                        | 9–14, 16, 43, 47–49, 66–67, 70, 72                                               |
| `linear-algebra-bases`           | 9–14                                | 62, 64, 66–67, 69–70                                                             |
| `linear-algebra-transformations` | 3–8                                 | 1, 30, 57–59, 65–66                                                              |
| `linear-algebra-projections`     | —                                   | 57, 62                                                                           |
| `linear-algebra-eigenvalues`     | —                                   | 52–53, 58                                                                        |
| `linear-algebra-svd`             | —                                   | 58                                                                               |

## Authoring and implementation implications

1. Extend the current assessment model beyond `choice`. Today the client and server special-case only choice submissions; ordinary text, handwriting, and photos enter the model-grading path. New structured controls need explicit, versioned answer schemas and validators in the generated lesson catalog and issued review snapshots. A visual table alone cannot remove the model call.
2. Keep immediate offline grading and authoritative server verification. Reuse the existing attempt/history/outbox path and the deterministic grade representation. Drive client/server checks from the same authored specification and shared conformance fixtures; never trust a client-supplied verdict. Include correct alternatives, incorrect values, incomplete/invalid payloads, and numerical boundaries in those fixtures.
3. Attach structured grading to the source exercise and propagate it through Review instantiation, previews, imports, and historical question snapshots. Preserve stable exercise/template IDs, immutable attempts, content versions, saved drafts, grading history, and the correct-answer lock. A content update must not silently reinterpret an old text response as a structured submission or overwrite a historical grade.
4. Preserve required evidence. Add all required components to multipart tasks; do not grade just the convenient number or yes/no subanswer. For mixed items, grade objective fields with code and reserve model assessment for the actual open proof/work. Do not invoke a model simply because a structured value is wrong or fails to parse—show local validation or deterministic feedback. Input grammar errors must be distinct from mathematical incorrectness.
5. Update evidence/Review metadata according to the task, independently of whether grading uses a model. The current Review code treats choices as recognition and excludes them from constructive targets. A student-entered table, matrix, witness, or formula can remain production, and a structured exhaustive certificate may assess reasoning. New input capabilities and interaction cost also need accurate Quick-mode handling; “deterministic” does not automatically mean “Quick.”
6. Keep pen/photo drafts and historical handwriting compatible. Deterministic submission requires structured values; handwriting/photos can remain work space and retained evidence. Automatically extracting a mathematical answer from an image is a separate recognition operation and must not be quietly counted as a zero-model path. The straightforward zero-model workflow is to enter the final structured values while retaining scratch work.
7. Respect generation boundaries. Linear algebra's authoring generator emits `type: freeform` even for exact arithmetic families. Its 357 verification fixtures are useful source data, not ready-made runtime validators for every required interpretation. Change the generator/source metadata and regenerate; do not patch `output/content` or hand-edit generated exercises. Likewise, author review validator parameters alongside the deterministic generator rather than guessing them from the displayed string.
8. Reinspect pinpoint sources whenever prompts, choices, explanations, or feedback change; follow `docs/content-sources.md`. Update only the corresponding reviewed content digests after reinspection. The audit itself adds no learning-content claims to the shipped curriculum and does not refresh those digests.

A practical implementation order is truth/assignment grids, exact scalar/tuple/vector/matrix fields, finite sets/relations/graph certificates, then constrained expression and intermediate-step inputs. Author the uncomplicated remaining choices alongside these controls. Keep unrestricted proof writing and derivations open; a general proof checker or broad symbolic algebra system is a larger project than the input components proposed here.

## Verification and limitations

Both source snapshots built successfully with `npm run content`, including existing source-coverage checks. The 2,064-row lesson inventory has exact coverage with no duplicate or missing keys, and every existing choice is classified consistently with the catalog. The two snapshots' 2,060 overlapping question/choice payloads were compared after glossary-markup normalization.

The effective Review mapping was exported by calling the actual Go `reviewCatalog()` implementation in an isolated audit worktree, without starting an API server or reading learner data. Its complete 3,183-ID set matched the audit's source-to-target mapping. Targeted Go checks for catalog previews, generated answers/reproducibility, legacy seed stability, and a real published deterministic review submission passed; that submission check verifies that no grading job is created. No model/provider calls were used.

This audit verifies coverage and the feasibility of the proposed answer representations. It does not claim that unimplemented validators are tested, that every official mathematical answer was independently re-proved, or that all candidate authoring changes can preserve unrestricted written-reasoning evidence. No app UI changed, so there is no new interface screenshot to validate. Any implementation must visually check the resulting controls at the relevant viewport sizes.

## Structured-input inventory by lesson and family

This appendix lists every primary structured-conversion candidate. A family name is an audit recommendation, not an existing application component. Split linear-algebra lessons retain their original canonical key namespaces; the JSON also records the current display lesson and section.

| Canonical key prefix             | Suggested input family                    | Candidate IDs                                                        |
| -------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `propositional-logic`            | truth-value-grid                          | 15–30                                                                |
| `propositional-logic`            | statement-and-witness                     | 31–35                                                                |
| `propositional-logic`            | boolean-witness                           | 39, 122–124, 129, 131, 134, 146–147                                  |
| `propositional-logic`            | truth-table                               | 40–45                                                                |
| `propositional-logic`            | boolean-certificate                       | 56–69, 79, 119–121, 126–128, 130, 132–133, 135, 143–144, 148         |
| `propositional-logic`            | numeric-witness                           | 72                                                                   |
| `propositional-logic`            | boolean-formula-witness                   | 138                                                                  |
| `propositional-logic`            | argument-builder-and-table                | 139                                                                  |
| `propositional-logic`            | assignment-set                            | 150                                                                  |
| `predicates-and-quantifiers`     | substitution-fields                       | 1–5                                                                  |
| `predicates-and-quantifiers`     | finite-predicate-table                    | 11–18, 57–58                                                         |
| `predicates-and-quantifiers`     | numeric-witness                           | 70                                                                   |
| `predicates-and-quantifiers`     | finite-countermodel                       | 83–84, 87, 89, 95–96                                                 |
| `predicates-and-quantifiers`     | finite-quantifier-witness-grid            | 103–110                                                              |
| `sets-and-set-operations`        | finite-set                                | 1, 8, 11–19, 57–58, 73                                               |
| `sets-and-set-operations`        | numeric-tuple                             | 5, 36, 41–44, 46–48, 74–75                                           |
| `sets-and-set-operations`        | set-membership-certificate                | 28                                                                   |
| `sets-and-set-operations`        | finite-set-counterexample                 | 29, 38, 50, 60, 64, 66, 69                                           |
| `sets-and-set-operations`        | nested-set                                | 31–32                                                                |
| `sets-and-set-operations`        | ordered-pair-set                          | 35                                                                   |
| `relations`                      | numeric-tuple                             | 1, 9, 53                                                             |
| `relations`                      | relation-matrix                           | 3, 5–7, 40, 51–52, 54–55, 61–67                                      |
| `relations`                      | boolean-matrix                            | 4                                                                    |
| `relations`                      | underlying-domain-example                 | 10                                                                   |
| `relations`                      | finite-relation-properties                | 12–15, 41                                                            |
| `relations`                      | relation-witness                          | 17, 23, 28, 75                                                       |
| `relations`                      | congruence-class-and-witnesses            | 32                                                                   |
| `relations`                      | partition-builder                         | 37                                                                   |
| `relations`                      | string-set                                | 38                                                                   |
| `relations`                      | cover-edge-set                            | 42–43                                                                |
| `relations`                      | reachability-certificate                  | 49                                                                   |
| `relations`                      | relation-constructor                      | 57, 74, 80                                                           |
| `functions`                      | interval-set                              | 5–6, 15–16, 45, 64–65                                                |
| `functions`                      | finite-set                                | 11–14, 19                                                            |
| `functions`                      | collision-and-missed-target               | 23                                                                   |
| `functions`                      | expression-work-fields                    | 31, 41                                                               |
| `functions`                      | symbolic-expression                       | 32, 42–44                                                            |
| `functions`                      | function-type-and-rule                    | 33                                                                   |
| `functions`                      | restricted-domain-and-inverse             | 35                                                                   |
| `functions`                      | finite-function-map                       | 39, 46                                                               |
| `functions`                      | numeric-tuple                             | 55, 61–63, 67                                                        |
| `functions`                      | counting-factors                          | 56                                                                   |
| `functions`                      | finite-function-constructor               | 73, 76                                                               |
| `sequences-and-summations`       | exact-number-or-tuple                     | 1, 3–4, 7, 13–17, 25–26, 31–32, 34, 37–38, 46, 51–52, 55, 61–63      |
| `sequences-and-summations`       | indexed-values-with-reason                | 2                                                                    |
| `sequences-and-summations`       | sequence-formula-and-value                | 5, 11–12                                                             |
| `sequences-and-summations`       | recurrence-witnesses-with-reason          | 6                                                                    |
| `sequences-and-summations`       | polynomial-counterexample-pair            | 10                                                                   |
| `sequences-and-summations`       | recurrence-builder                        | 19                                                                   |
| `sequences-and-summations`       | expanded-term-row                         | 21                                                                   |
| `sequences-and-summations`       | count-and-total                           | 22                                                                   |
| `sequences-and-summations`       | sum-builder                               | 24, 28, 41–43, 50, 64–65                                             |
| `sequences-and-summations`       | symbolic-expression                       | 27, 39, 45, 47, 56–57, 71–73, 78                                     |
| `sequences-and-summations`       | geometric-sum-work                        | 33                                                                   |
| `sequences-and-summations`       | telescoping-work                          | 44                                                                   |
| `sequences-and-summations`       | two-method-symbolic-work                  | 49                                                                   |
| `sequences-and-summations`       | numeric-zero-factor-reason                | 58                                                                   |
| `sequences-and-summations`       | numeric-counterexample                    | 59                                                                   |
| `sequences-and-summations`       | bound-pair                                | 66                                                                   |
| `sequences-and-summations`       | sum-counterexample                        | 69                                                                   |
| `sequences-and-summations`       | bound-construction                        | 70                                                                   |
| `sequences-and-summations`       | recurrence-verification                   | 74                                                                   |
| `sequences-and-summations`       | formula-and-error-reasons                 | 76                                                                   |
| `sequences-and-summations`       | counterexample-and-repaired-formula       | 77                                                                   |
| `sequences-and-summations`       | count-sum-and-reason                      | 79                                                                   |
| `direct-proof`                   | integer-witnesses                         | 3                                                                    |
| `direct-proof`                   | finite-existence-certificate              | 47                                                                   |
| `direct-proof`                   | integer-counterexample-with-parity        | 51                                                                   |
| `direct-proof`                   | numeric-counterexample                    | 52–53, 55, 58                                                        |
| `direct-proof`                   | finite-set-counterexample                 | 56–57, 60                                                            |
| `direct-proof`                   | finite-function-counterexample            | 59                                                                   |
| `direct-proof`                   | missing-condition-and-counterexample      | 66                                                                   |
| `direct-proof`                   | counterexample-and-invalid-example-reason | 70                                                                   |
| `proof-by-contrapositive`        | numeric-counterexample                    | 39–40, 60                                                            |
| `proof-by-contrapositive`        | collision-and-reason                      | 46                                                                   |
| `proof-by-contrapositive`        | finite-function-counterexample            | 50                                                                   |
| `proof-by-contrapositive`        | radical-counterexample                    | 55                                                                   |
| `proof-by-contrapositive`        | quotient-remainder-example                | 66                                                                   |
| `proof-by-contradiction`         | radical-counterexample                    | 34                                                                   |
| `proof-by-contradiction`         | radical-product-examples                  | 40                                                                   |
| `proof-by-contradiction`         | numeric-result-with-interpretation        | 47–48                                                                |
| `mathematical-induction`         | initial-and-recurrence-checks             | 50                                                                   |
| `strong-induction`               | factor-tree                               | 15                                                                   |
| `strong-induction`               | quotient-remainder-trace                  | 18                                                                   |
| `strong-induction`               | stamp-count-table                         | 21                                                                   |
| `strong-induction`               | finite-impossibility-table                | 24                                                                   |
| `strong-induction`               | base-range-fields                         | 30                                                                   |
| `strong-induction`               | initial-value-check-table                 | 37                                                                   |
| `strong-induction`               | rooted-tree-counterexample                | 55                                                                   |
| `strong-induction`               | recurrence-counts-with-reason             | 57                                                                   |
| `strong-induction`               | nested-object-witness                     | 60                                                                   |
| `strong-induction`               | subproblem-count-expressions              | 68                                                                   |
| `combinatorics`                  | exact-count                               | 1, 3–10, 12–15, 18, 21–24, 26, 30, 35–36, 41–43, 46–51, 61–74, 76–77 |
| `combinatorics`                  | count-and-counting-reason                 | 2, 11, 16–17, 19, 25, 27–29, 31, 78                                  |
| `combinatorics`                  | coefficient-row                           | 34                                                                   |
| `combinatorics`                  | binomial-decomposition                    | 39                                                                   |
| `combinatorics`                  | inclusion-exclusion-table                 | 44                                                                   |
| `combinatorics`                  | occupancy-certificate                     | 53                                                                   |
| `combinatorics`                  | two-counting-methods                      | 75, 80                                                               |
| `combinatorics`                  | integer-counterexample-tuple              | 79                                                                   |
| `recurrence-relations`           | recurrence-value-table                    | 1–3, 9, 37, 52, 56, 61                                               |
| `recurrence-relations`           | sequence-terms-and-formula                | 6–7                                                                  |
| `recurrence-relations`           | piecewise-sequence                        | 8, 29                                                                |
| `recurrence-relations`           | recurrence-derivation-fields              | 11, 13, 18, 31, 35                                                   |
| `recurrence-relations`           | recurrence-expression                     | 12, 14–17, 21–25, 27, 32–33, 42–44, 46–47, 65–68, 77                 |
| `recurrence-relations`           | equilibrium-and-update                    | 26                                                                   |
| `recurrence-relations`           | recurrence-verification                   | 30, 57–58, 74, 79                                                    |
| `recurrence-relations`           | counting-recurrence-builder               | 36, 38                                                               |
| `recurrence-relations`           | values-and-reason                         | 39, 49                                                               |
| `recurrence-relations`           | characteristic-polynomial                 | 41, 45                                                               |
| `recurrence-relations`           | recursion-level-table                     | 62                                                                   |
| `recurrence-relations`           | recursion-tree-cost-table                 | 63                                                                   |
| `recurrence-relations`           | constant-function-counterexample          | 72                                                                   |
| `recurrence-relations`           | recurrence-coefficients-and-reason        | 75–76                                                                |
| `graph-theory`                   | graph-count-fields                        | 1–3, 41–42, 54                                                       |
| `graph-theory`                   | graph-property-table                      | 11–12, 14, 20, 51–52, 62–63                                          |
| `graph-theory`                   | degree-sum-verification                   | 13                                                                   |
| `graph-theory`                   | binary-matrix-row                         | 16                                                                   |
| `graph-theory`                   | path-pair-with-consequence                | 26                                                                   |
| `graph-theory`                   | component-partition                       | 31                                                                   |
| `graph-theory`                   | digraph-counterexample-and-implication    | 40                                                                   |
| `graph-theory`                   | graph-counterexample                      | 45                                                                   |
| `graph-theory`                   | spanning-tree-edge-selection              | 49                                                                   |
| `graph-theory`                   | all-topological-orders                    | 57                                                                   |
| `graph-theory`                   | traversal-order                           | 61, 64                                                               |
| `graph-theory`                   | adjacency-table                           | 65                                                                   |
| `graph-theory`                   | weighted-graph-counterexample             | 70                                                                   |
| `graph-theory`                   | graph-route                               | 72, 74                                                               |
| `graph-theory`                   | graph-evidence-counterexample             | 80                                                                   |
| `asymptotic-growth`              | asymptotic-witness-fields                 | 15, 17, 25, 56                                                       |
| `asymptotic-growth`              | epsilon-counterexample                    | 34                                                                   |
| `asymptotic-growth`              | factorwise-lower-bound                    | 36                                                                   |
| `asymptotic-growth`              | growth-ordering                           | 39                                                                   |
| `asymptotic-growth`              | count-expression-and-growth               | 41–49, 51, 53, 55, 57–58, 61, 69                                     |
| `asymptotic-growth`              | exact-number-or-tuple                     | 52, 68                                                               |
| `linear-algebra-vectors`         | vector-and-reason                         | 1, 15–16, 23–34, 59–70                                               |
| `linear-algebra-vectors`         | vector-checkpoints                        | 3–8, 17–22, 39                                                       |
| `linear-algebra-vectors`         | symbolic-identity-checkpoints             | 40, 56                                                               |
| `linear-algebra-vectors`         | linear-system-checkpoints                 | 41–46                                                                |
| `linear-algebra-vectors`         | reachability-witness                      | 47–52                                                                |
| `linear-algebra-vectors`         | coefficient-witness                       | 54                                                                   |
| `linear-algebra-dot-products`    | scalar-vector-checkpoints                 | 1–14, 55, 57–62                                                      |
| `linear-algebra-dot-products`    | norm-normalization                        | 15–28                                                                |
| `linear-algebra-dot-products`    | finite-solution-set                       | 29–34                                                                |
| `linear-algebra-dot-products`    | vector-witness                            | 37–42                                                                |
| `linear-algebra-dot-products`    | angle-and-classification                  | 43–48                                                                |
| `linear-algebra-dot-products`    | counterexample-vectors                    | 53–54, 71                                                            |
| `linear-algebra-dot-products`    | cosine-and-reason                         | 56, 63–68                                                            |
| `linear-algebra-matrices`        | matrix-grid                               | 1, 3–8                                                               |
| `linear-algebra-matrices`        | matrix-grid-and-reason                    | 2, 9–14, 49                                                          |
| `linear-algebra-matrices`        | matrix-vector-checkpoints                 | 15, 17–22, 50–56                                                     |
| `linear-algebra-matrices`        | column-selection                          | 16, 23–28                                                            |
| `linear-algebra-matrices`        | matrix-product-and-order                  | 29, 31–42                                                            |
| `linear-algebra-matrices`        | matrix-witness                            | 57–58, 62                                                            |
| `linear-algebra-matrices`        | dimension-witness                         | 66                                                                   |
| `linear-algebra-systems`         | row-operation-workspace                   | 1, 9, 11–28                                                          |
| `linear-algebra-systems`         | augmented-matrix-grid                     | 2–8                                                                  |
| `linear-algebra-systems`         | linear-system-witness                     | 10, 62                                                               |
| `linear-algebra-systems`         | inconsistency-certificate                 | 29, 32, 34, 36, 38                                                   |
| `linear-algebra-systems`         | affine-solution-family                    | 30–31, 33, 35, 37, 43–49, 51–56                                      |
| `linear-algebra-systems`         | linear-system-checkpoints                 | 39–42                                                                |
| `linear-algebra-span`            | span-membership                           | 1–2                                                                  |
| `linear-algebra-span`            | span-membership-witness                   | 3–8, 52                                                              |
| `linear-algebra-span`            | dependence-witness                        | 15, 17–22                                                            |
| `linear-algebra-span`            | subspace-counterexample                   | 30, 44, 46                                                           |
| `linear-algebra-span`            | vector-collection-witness                 | 65, 69, 71                                                           |
| `linear-algebra-bases`           | basis-coordinates                         | 1, 3–8                                                               |
| `linear-algebra-bases`           | basis-input                               | 2, 16, 23–28                                                         |
| `linear-algebra-bases`           | basis-space-witness                       | 68                                                                   |
| `linear-algebra-bases`           | row-operation-and-basis                   | 29–34                                                                |
| `linear-algebra-bases`           | determinant-and-dependence                | 36                                                                   |
| `linear-algebra-bases`           | determinant-area                          | 43–45                                                                |
| `linear-algebra-bases`           | matrix-and-vector-witness                 | 71                                                                   |
| `linear-algebra-bases`           | matrix-inverse-checkpoints                | 35, 37–42                                                            |
| `linear-algebra-bases`           | matrix-witness                            | 65                                                                   |
| `linear-algebra-bases`           | matrix-vector-checkpoints                 | 54–59                                                                |
| `linear-algebra-transformations` | linearity-counterexample                  | 2, 9–14                                                              |
| `linear-algebra-transformations` | transformation-matrix                     | 15–28                                                                |
| `linear-algebra-transformations` | kernel-image                              | 29, 31–42                                                            |
| `linear-algebra-transformations` | change-of-basis-matrix                    | 45–50                                                                |
| `linear-algebra-transformations` | matrix-and-vector-witness                 | 63                                                                   |
| `linear-algebra-transformations` | kernel-image-witness                      | 64                                                                   |
| `linear-algebra-projections`     | projection-checkpoints                    | 1, 3–14, 17–22                                                       |
| `linear-algebra-projections`     | matrix-grid-and-reason                    | 16                                                                   |
| `linear-algebra-projections`     | gram-schmidt-checkpoints                  | 15, 23–28                                                            |
| `linear-algebra-projections`     | least-squares-checkpoints                 | 29–42                                                                |
| `linear-algebra-projections`     | residual-certificate                      | 51–56                                                                |
| `linear-algebra-projections`     | least-squares-family                      | 43–48                                                                |
| `linear-algebra-eigenvalues`     | eigenvector-candidate-table               | 1, 3–8                                                               |
| `linear-algebra-eigenvalues`     | eigenpair-checkpoints                     | 9, 11–22                                                             |
| `linear-algebra-eigenvalues`     | eigen-multiplicity-table                  | 23–28                                                                |
| `linear-algebra-eigenvalues`     | eigenbasis-power-coordinates              | 29, 31–36                                                            |
| `linear-algebra-eigenvalues`     | diagonalization-checkpoints               | 37–42                                                                |
| `linear-algebra-eigenvalues`     | eigenspace-and-reason                     | 43                                                                   |
| `linear-algebra-eigenvalues`     | exponential-coefficient-table             | 45–50                                                                |
| `linear-algebra-eigenvalues`     | spectral-counterexample                   | 55–56, 59, 62                                                        |
| `linear-algebra-svd`             | svd-reconstruction                        | 15, 17–22                                                            |
| `linear-algebra-svd`             | svd-factor-grids                          | 23–28                                                                |
| `linear-algebra-svd`             | singular-spectrum-table                   | 29, 31–36                                                            |
| `linear-algebra-svd`             | singular-vector-checkpoints               | 37–42                                                                |
| `linear-algebra-svd`             | low-rank-approximation                    | 43, 45–50                                                            |
| `linear-algebra-svd`             | sensitivity-checkpoints                   | 51–56                                                                |
