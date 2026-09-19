# Lessons 1–2 review-content audit

The baseline was inspected in the Review Library on `main` at `79710e5`, before authoring. Both lesson filters, the Coverage view, and the effective catalog API were used. The final audit uses the same Library against the rebuilt catalog, an isolated temporary database, and no learner history.

An effective template is a concept × skill × optional objective representation. One reused exercise can contribute to several targets. An authored family counts as one template even when it offers several variants; its representative question is not an extra variant. These are concrete catalog counts, not a coverage score or a count of distinct lesson exercises.

| Baseline lesson            | Effective templates | Targets | Quick templates | Dedicated templates | Authored variants |
| -------------------------- | ------------------: | ------: | --------------: | ------------------: | ----------------: |
| Propositional Logic        |                 266 |      88 |              26 |                   0 |                 0 |
| Predicates and Quantifiers |                 206 |      55 |              36 |                   3 |                 2 |

The complete before/after [target inventory](audits/lessons-1-2-review-coverage.csv) records lesson, concept, skill, objective, effective/reused/dedicated counts, Quick compatibility, evidence depths, families, and variant counts. It includes targets absent before authoring rather than relying on the Library to invent missing rows. Shared concepts are shown under each lesson filter; they are not duplicate scheduler targets.

## Result in the rebuilt Library

All 66 additions appear in the effective Library: 2 fixed templates, 62 authored families with 165 variants, and 2 generators. Of these, 58 are deterministic Quick recognition templates, 7 provide production evidence, and 1 provides reasoning evidence. Forty new recall objectives cover terminology and canonical rules. The catalog now has 69 dedicated templates in total, including the original three.

| Lesson                     | Effective templates before → after | Targets before → after | Quick templates before → after | Dedicated before → after | Authored variants added |
| -------------------------- | ---------------------------------: | ---------------------: | -----------------------------: | -----------------------: | ----------------------: |
| Propositional Logic        |                          266 → 303 |               88 → 118 |                        26 → 60 |                   0 → 37 |                      93 |
| Predicates and Quantifiers |                          206 → 235 |                55 → 79 |                        36 → 60 |                   3 → 32 |                      72 |

The 197-row inventory contains every effective target under these two lesson filters. Representative changes illustrate the purpose of the additions:

| Target                                                     | Effective templates before → after | New authored variants | Evidence retained    |
| ---------------------------------------------------------- | ---------------------------------: | --------------------: | -------------------- |
| conditional-forms × recognize                              |                              1 → 2 |                     4 | Recognition / Quick  |
| contrapositive × recognize                                 |                              1 → 2 |                     3 | Recognition / Quick  |
| implication × transform                                    |                              6 → 7 |                     3 | Production / Regular |
| de-morgan × transform                                      |                              7 → 8 |                     3 | Production / Regular |
| quantifier-order × interpret × quantifier-order-dependence |                              0 → 1 |                     4 | Recognition / Quick  |
| quantifier-order × construct                               |                              0 → 1 |                     3 | Production / Regular |
| quantifier-order × justify                                 |                            17 → 18 |                     2 | Reasoning / Regular  |
| quantifier-negation × transform                            |                            11 → 12 |                     3 | Production / Regular |
| variable-scope × recognize                                 |                              3 → 4 |                     4 | Recognition / Quick  |
| existential-quantification × construct                     |                              0 → 1 |                     3 | Production / Regular |

Definition examples include `proposition-definition`, `contrapositive-definition`, `antecedent-consequent-roles`, `predicate-definition`, `free-variable-definition`, `witness-definition-recognition`, and `countermodel-definition`. Pinpoint support adds nineteen inspected citations and four bibliography entries; all prior assignments and lesson digests remain unchanged.

## Authoring decisions

- **Definitions:** Lesson 1 had no dedicated definition objectives. Lesson 2 had only the witness-definition objective, with two production templates. Add explicit deterministic terminology and distinction probes. Preserve the original witness-production objective and use a separate recognition objective.
- **Implication and related forms:** The baseline had one fixed Quick recognition template each for conditional forms and contraposition, and no Quick implication template. Add multiple retrieval directions for converse, inverse, contrapositive, antecedent/consequent, truth conditions, necessary/sufficient conditions, and if/only-if language. Inequality negation includes equality boundaries explicitly.
- **Equivalence and transformations:** Existing De Morgan and implication transform targets already had seven and six fixed production templates. Add concise authored transforms to vary delayed retrieval, plus separate cheap recognition. Preserve the distinction between matching a correct expression and producing one.
- **Truth-table and counterexample work:** Add bounded generated connective evaluation and conditional counterexample selection. The latter distinguishes a true consequent from a false antecedent and tests the strict-inequality boundary. Actual counterassignment construction remains a separate target.
- **Quantifier order:** The baseline had one Quick recognition item and one fixed counterexample item, alongside 31 reasoning templates under evaluate/justify. Add dependence, fixed-versus-varying witnesses, and interpretation variants. Reuse the substantial existing reasoning pool instead of adding many proofs.
- **Quantifier negation and scope:** The baseline had eleven fixed negation transforms but no Quick negation representation. Scope had three fixed Quick recognition items. Add rule retrieval, nested interpretation, free/bound occurrences, capture avoidance, and productive negation variants.
- **Witnesses, domains, and countermodels:** Keep domain membership and verification explicit. Add actual witness, dependent-witness, and counterexample construction; use a sparse countermodel family for the distinction between a working example and a universally valid inference.
- **Avoid duplication:** Quantified English translation already had twenty Quick templates; equivalence-law recognition had eight and inference-rule recognition had four. Their existing exercises remain the main application pool. New terminology and targeted distinctions serve different retrieval purposes.

The curriculum teaches contingency, inclusive/exclusive OR, existence/uniqueness, vacuous truth, scope, and variable capture, so those belong in review. It does not introduce “hypothesis” as a synonym for antecedent or call predicates “parameterized propositions”; this pass does not introduce those alternative labels.

## Evidence and deliberate limits

Recognition cards do not satisfy production or reasoning targets. Short symbolic transforms, witness/counterexample construction, and countermodels stay in Regular mode. Existing proofs, full equivalence arguments, and longer quantified reasoning intentionally retain no forced Quick equivalent. Their deep requirements and due-date policy are unchanged.

All new terminology uses deterministic choices. General exact-text and symbolic grading are deferred because the current supported interfaces are choices and free response; adding a new grading path would expand this content pass. The original two AI-graded witness-definition templates retain their IDs and meaning. New free-response items are reserved for productive mathematics and reasoning.

Set Theory authoring, programming API trivia, automatic definition extraction, matching controls, scheduler changes, and runtime content generation with an LLM are deferred. Learning content remains in `content/review-templates.json`; citation assignments and inspected digests remain in `content/sources.json`. Existing lesson content, exercise identities, evidence mappings, and source assignments are preserved.

## Library inspection records

The browser check expands every dedicated template and all of its variants, verifies published collapsed source support, generates samples, captures both lessons' coverage tables, and inspects longer symbolic content at desktop and phone widths. Catalog reads and sample generation leave the temporary database without review records or attempts.

- [Propositional definition](screenshots/review-content/logic-definition.png)
- [Several authored conditional variants](screenshots/review-content/conditional-variants.png)
- [Scope definition](screenshots/review-content/scope-definition.png) and [phone example](screenshots/review-content/scope-mobile.png)
- [Generated truth-value sample](screenshots/review-content/propositional-truth-values.png)
- [Generated counterexample sample](screenshots/review-content/integer-conditional-counterexample.png)
- [Lesson 1 implication coverage](screenshots/review-content/propositional-logic-coverage.png)
- [Lesson 2 quantifier-order coverage](screenshots/review-content/predicates-and-quantifiers-coverage.png)

Run `node scripts/check-review-library-ui.mjs` after `npm run web:build` to repeat the final audit. It also writes the observed effective catalog and rendered coverage rows into ignored `output/review-audit-after/`. Set `PLAYWRIGHT_MODULE` and `CHROME_BIN` to the installed local browser runtime when needed. The baseline inventory is a snapshot of the merged catalog, not a new runtime content source.

## Validation

The complete checks are `npm test` (including content validation and curriculum audit), `npm run typecheck`, `npm run web:build`, `npm run web:test`, `npm run format:check`, and, from `server`, `go test -count=1 ./...` and `go test -race -count=1 ./...`. The count flag avoids cached Go results when the compiled content outside the Go module changes. Browser checks are `scripts/check-review-library-ui.mjs` and the existing `scripts/check-review-ui.mjs` against a local Vite development server, as required by its source-module imports. Both use isolated/synthetic learner state.

The new generators are checked across 6,144 seeds: all 16 connective/assignment cases and all 105 threshold/gap cases appear. Tests independently verify answers, distinct options, varying answer positions, no unresolved placeholders, reproducibility, preview/session agreement, and unchanged legacy witness output. Authored symbolic and boundary examples also received independent truth-table and finite-model checks during source inspection.

A compiled-catalog comparison confirms that all 2,060 existing exercise/check entries, all three original dedicated templates, and every existing source record/hash are unchanged. The effective-catalog regression test confirms that additions do not filter out existing representations or allow recognition to replace constructive evidence. Browser previews create no review records or attempts. No scheduler interval rules, grading-v5 behavior, lesson completion logic, or production learner state were changed.
