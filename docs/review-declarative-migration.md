# Declarative review migration

The migration from baseline `41f51ba` removes the last production review question construction from `server/review.go`. The former `integer-witness-sum`, `propositional-truth-values`, and `integer-conditional-counterexample` switch cases are gone. The server now selects and copies complete questions from declarative data.

| Previous executable information                                                                            | Canonical destination                                                          | Entries |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------: |
| Witness equations, computed answers, adjacent distractors, saved `a`, `sum`, and witness parameters        | `content/review-variants.json`, `integer-witness-selection`                    |     400 |
| Four connective formulas, truth labels, explanatory feedback, truth results and saved parameters           | `content/review-variants.json`, `generated-connective-truth-value`             |      16 |
| Conditional thresholds, boundary counterexamples, distractors, feedback substitutions and saved parameters | `content/review-variants.json`, `generated-integer-conditional-counterexample` |     105 |
| Seed-byte domains and choice-position behavior                                                             | Each bank's declarative `selection` object                                     |       3 |

All 555 dedicated template IDs, existing authored variant ordering, lesson/concept/skill/objective/evidence/source mappings, and deterministic assessments remain untouched in `content/review-templates.json`. The new bank row IDs describe existing finite seed coordinates and do not replace any persisted identity. Saved generated instances continue to retain their original questions, teaching snapshots, and parameters.

Each of the 521 bank questions is complete, human-readable JSON. It contains its full prompt, answer, choice IDs, grading key, feedback, and integer parameter values. These files are directly authored sources after migration; no generator or refresh command is retained. The normal build validates them and copies them into the ignored runtime catalog. `scripts/review-variants.ts` and `server/review_variants.go` contain only schema/integrity checks. The generic runtime selector performs deterministic lookup and display rotation, without curriculum prose, subject-specific formulas, or answer construction.

The three original slot-bearing question summaries remain in the existing template JSON as an explicit compatibility exception: the Review Library catalog projection and existing source/grading hashes expose these summaries. They are not interpolated at runtime and are not produced from executable definitions. Complete variant questions are the learner-facing source of truth. No checked-in generated runtime artifact was added.

## Compatibility evidence

Before replacing the Go implementation, a temporary capture harness called the old production `instantiateReviewQuestion` for seeds covering every finite parameter tuple and every possible answer rotation. It stored only seed/identity metadata and SHA-256 output hashes in `server/testdata/review-migration.json`; the harness was removed. The fixture contains 400 witness cases, 32 truth-value cases, and 315 conditional cases (747 total). Every hash covers the exact rendered question and saved parameter map. The new Go test checks the fixtures against the replacement implementation, proves fixture coverage of every bank entry/rotation, and checks preview/issued-instance equality.

Independent truth-table tests check all 16 truth-value combinations and both correct-answer positions. Independent inequality evaluation checks all 105 conditional threshold pairs and all three positions. Every one of the 400 witness entries is checked by substitution, including negative and zero answers. Schema tests reject incomplete/reordered banks, invalid seed indices, unsupported executable fields, unresolved slots and broken answer keys. Source tests detect changes to questions, feedback, parameters and seed ordering.

The old grading catalog bytes remain identical up to the final object closing brace: `reviewVariants` is its only added top-level field. The existing grading version and all exercise/template objects remain unchanged. The compiled `output/content/sources.json` is byte-identical; new audit coverage exists only in the authored `content/sources.json` under `reviewVariants`.

## Source inspection

On 2026-09-21, the migration rechecked Hammack, _Book of Proof_ §§2.2–2.4 (PDF pages 51–59) for conjunction, inclusive disjunction, implication and biconditional truth conditions; §7.3 (PDF pages 162–163) for constructive existential witnesses; and §9.1 (PDF pages 186–187) for counterexamples that make the antecedent true and consequent false. The existing Lean _Theorem Proving in Lean 4_, “The Existential Quantifier,” passage was also inspected. Existing `p-logic`, `p-disproof`, `p-existence`, and `review-witness` references cover these original examples. All finite arithmetic cases are verified independently by the tests, rather than implying that these exercises are copied from the sources. Existing template/lesson digests were not refreshed.
