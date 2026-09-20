# Curriculum-wide Review Library coverage audit

Audited on 2026-09-20 against pulled `main` at `38c6b3d`. The baseline and final inventories come from authenticated `GET /api/v1/review/catalog` responses from isolated local Go servers using the compiled catalog. The browser acceptance check uses this same effective Library, including evidence-depth filtering and server-owned Quick compatibility. No production learner data was read or changed.

**1,639 existing effective targets were inspected; the rebuilt Library contains 1,749.** There are 4,705 → 4,827 effective templates, including 433 → 555 dedicated templates and the same 4,272 reused exercise representations. A concept × skill × optional objective is a target; an exercise may support several targets. The 122 additions address 110 new targets and provide alternatives for 12 existing targets. These are inspectable counts, not a coverage or mastery score.

The [target inventory](audits/curriculum-review-coverage.csv) has 1,795 lesson-filter rows, including shared targets under each applicable lesson. It records before/after template, dedicated and Quick counts; final provenance, evidence, interaction cost, input, grading, variant/generator counts, activation concepts, and singleton observations. The generated JSON also includes template IDs, all before/after evidence counts, actual activating exercise examples, and taught concepts absent from the baseline. Neither artifact infers eligibility from raw authoring files.

## Subject results

All 71 instructional lessons and four reading-only introductions were checked. Introductions intentionally have no exercises or review. Lessons 1–2 receive regression checks only: their 69 dedicated templates and all current effective representations remain unchanged. Their historical authoring audit predates later deterministic conversions, so its old totals are not used as today’s baseline.

| Subject                    | Targets before → after | Effective before → after | Quick before → after | Dedicated added | Authored variants added |
| -------------------------- | ---------------------: | -----------------------: | -------------------: | --------------: | ----------------------: |
| Discrete mathematics       |              428 → 500 |            1,234 → 1,310 |            286 → 360 |              76 |                      67 |
| Linear algebra             |              151 → 184 |                788 → 829 |              40 → 79 |              41 |                      22 |
| Calculus                   |              538 → 541 |            1,334 → 1,337 |            199 → 202 |               3 |                       6 |
| Probability and Statistics |              523 → 525 |            1,349 → 1,351 |            147 → 149 |               2 |                       4 |

The subject counts overlap where a concept/skill is shared, so they are not summed to obtain the distinct curriculum count. The additions comprise **80 fixed templates and 42 authored families with 99 variants**. There are **zero new generators**; all three existing seeded generators remain unchanged. A representative question is not counted again as an authored variant.

Explicit lesson-level findings, vocabulary decisions, source inspections and remaining gaps:

- [Discrete lessons 3–9](audits/review-discrete-foundations.md): sets, relations, functions, summations and proof methods.
- [Discrete lessons 10–15](audits/review-discrete-reasoning.md): induction, counting, recurrences, graphs and asymptotics.
- [All 12 Linear Algebra lessons](audits/review-linear-algebra.md).
- [All 22 Calculus and 22 Probability & Statistics lessons](audits/review-calculus-probability.md).

## Important gaps filled

- **Terminology and low-friction retrieval:** Discrete lessons 3–15 and Linear Algebra previously had no dedicated review. Their reusable computational/proof pools were substantial, but exact vocabulary often had no isolated retrieval. New targets cover membership/subsets, set operations, relation properties, domain/codomain/range, injectivity/surjectivity, proof-method names, induction roles, counting choices, recurrence language, graph routes/trees/DAGs, asymptotic bounds, and core linear-algebra terms. Fixed repetition is intentional for precise names. Related recognition families distinguish plausible confusions rather than demanding every term in every interaction format.
- **Actual productive work:** New short constructions include inclusive/singleton/empty sum counts, counting outcomes, recurrence evaluation, characteristic polynomials, and all valid topological orders for different DAG structures. Existing proofs, set equality/inclusion, contraposition production, witness/counterexample construction, vector/matrix calculations, and independence proofs remain eligible. No choice is credited as their production evidence.
- **Missing fit interpretation:** The source lessons contained fit-interpretation exercises, but their recognition assessments could not satisfy the authored evaluate/analyze/justify skills, leaving zero effective review. A two-variant reasoning family now tests training-versus-prediction limits and the consequences of changing squared-error weights. A separate Quick objective does not clear this reasoning target.
- **Direct-proof umbrella:** Direct proofs were already available under parity, divisibility, sets and other application concepts. The absent umbrella concept needed a method-name objective, not another bank of proofs.
- **Selective newer-subject fixes:** Every Calculus/Probability taught concept already had dedicated and reusable review. Only five two-variant families were added: partial-derivative meaning, gradient definition, Jacobian layout, expectation-integral meaning, and typed estimator/estimate distinction. No blanket numerical expansion was justified.

Of the additions, 33 templates provide recognition, 86 provide production, and three provide reasoning. Eighty-one of the production templates are short exact terminology retrieval; the other five require actual small constructions/calculations. **118 additions are Quick-compatible.** Characteristic-polynomial construction and all three reasoning families remain Regular. Every new recall item uses deterministic grading, with accepted/rejected/malformed fixtures where structured input is used.

## Cumulative review and subject transitions

Two curated cumulative families contain four variants:

1. **Graphs + asymptotics:** derive exact adjacency-list scan work and tight growth for a tree versus a complete graph. The reasoning must use graph structure, degree sums and the stated operation cost.
2. **Linear algebra + least squares:** find all minimizing coefficients and explain how unique fitted output can coexist with nonunique coefficients differing by null-space vectors, for two different column-space geometries.

Existing review already combines sets/proofs, induction/recurrences, combinatorics/probability, gradients/optimization, calculus/density/expectation and linear algebra/regression. These bridges were inspected rather than copied. Functions, summations, vectors, coordinates and dot products already support subject transitions. Algebra, logarithms, exponents, inequalities and trigonometry remain local prerequisites; the audit found no need for a fifth subject or teaching rewrite.

## Activation, grouping and preservation

Activation was checked against actual primary exercise evidence and teaching order. The replay implementation matches either a template’s own concept **or** its explicit activation aliases; aliases do not override its concept. Forward-dependent families therefore target the later taught concept as well: bijection for function classification, combinations for counting-model distinctions, Big Omega/Theta for mixed-bound and graph-cost questions, little-o for the full growth hierarchy, and recursive correctness for termination-measure interpretation. Dedicated objectives keep these separate from earlier targets. Seven prerequisite regressions replay earlier/later evidence; another confirms recurrence substitution remains available from the adequate lesson-6 preparation. They resolve effective definitions from the full published catalog once, then replay each real target in isolation to avoid repeatedly rebuilding unrelated exercises under the race detector.

A narrow location bug required an implementation correction: **96 reused templates** for Rank/Inverses and Least Squares appeared under historical Bases/Projections exercise namespaces. Compilation now supplies the current `lessonSlug`; Library filters, focused practice and links use it, while original exercise keys, template IDs and saved histories stay intact. The inventory normalizes baseline lesson ownership using those unchanged exercise keys and retains the originally observed Library lesson in its last column. This correction changes attribution, not the size of the reusable pool.

The final effective-catalog comparison checks every one of the 4,705 pre-existing representations unchanged except these documented lesson/origin fields. All 433 pre-existing dedicated definitions, all pre-existing review fixtures, all 4,426 compiled lesson/check entries (4,284 questions plus 142 quick checks), and all existing lesson/review/TeX source hashes are preserved. No scheduler intervals, evidence-depth requirements, runtime generation, grading validators, source-exercise IDs or learner data were changed. Existing frozen Review restore behavior is covered by the Go suite.

## Intentional gaps and learner evidence

- Proofs, multistep derivations, model setup and mathematical explanations retain expensive evidence and often no Quick option. Quick success does not clear their unmet targets.
- Many computations already have numerous reusable lesson exercises despite an empty authored/generator column. No new generator family was warranted; maintained bounded authored examples and existing validators solve the demonstrated gaps.
- Singleton advanced proof/explanation targets remain where a different prompt has no demonstrated value. The CSV marks them for inspection without calling them defects. Fixed terminology repetition is also intentional.
- Less central vocabulary, further inverse retrieval directions and additional mixed variants are deferred until real delayed attempts reveal recurring confusion. See the scoped audits for specific terms and proof families.
- Lessons 1–2 have learner history; the rest of this pass uses authoring-time evidence. Coverage does not calibrate scheduling, prove retention, or establish permanent curriculum completeness.

## Sources, generation and validation

All additions have inspected pinpoint source assignments and reviewed hashes in `content/sources.json`. Fifty-three new citation records support the Discrete/Linear additions; the five newer-subject families reuse inspected existing passages. Only new or deliberately corrected template metadata hashes were recorded. Existing lesson, syntax and review hashes were not refreshed to bypass validation. The newer-subject additions were made in their existing authoring modules and regenerated through the normal tooling.

The build still publishes 75 lessons, 4,284 questions and 2,527 inline placements. The deterministic disposition report was regenerated through `scripts/deterministic-coverage.ts --write`; only its published catalog version changed. It is a historical conversion ledger, not a new all-curriculum coverage score.

Validation passed: `npm test` (835 tests, including content/source, deterministic fixtures and generator properties), `npm run typecheck`, `npm run web:build`, `npm run web:test` (77 tests), `npm run format:check`, `go test -count=1 ./...`, and `go test -race -count=1 ./...`. The Go runs include deterministic provider traps, frozen-definition/restore tests, and the new location/prerequisite regressions. The effective-catalog preservation report also passes.

The real Library browser check passed against all 4,827 effective templates: it expanded all 555 dedicated definitions and all 770 authored variants, inspected the three seeded generators, checked target grouping across all 71 instructional lessons, and confirmed no learner records were created. Desktop and phone screenshots of the corrected exercise links were visually checked. The synthetic Review UI check also passed: Regular input, Quick submission/context, deferred deep work, focused filters, cached offline restore, queued synchronization and mobile overflow.

One supplemental browser script has a pre-existing unreliable assumption: `check-review-submission-ui.mjs` unconditionally expects an open editor for two filters that already mix structured and open responses on baseline `38c6b3d`. Its unmodified run passed the choice/retry/recovery checks, then stopped at that editor expectation. A temporary copy uses the existing exclusively open `quantifier-order × counterexample` and `uniqueness × prove` targets for the same typed-submission and blur/reload paths and passed every submission check. This leaves the unrelated script unchanged.

To reproduce the authoring inventory, capture the baseline Library response at the baseline commit and keep it as `output/review-audit-before/catalog.json`; build the final branch and run:

```sh
npm test
npm run typecheck
npm run web:build
npm run web:test
npm run format:check
(cd server && go test -count=1 ./... && go test -race -count=1 ./...)
node scripts/check-review-library-ui.mjs
npx tsx scripts/report-review-coverage.mjs
```

Set `PLAYWRIGHT_MODULE` and `CHROME_BIN` to installed local runtimes as needed. The Library script starts its own temporary API/database, expands every dedicated template and every authored variant, samples seeded generators, checks every lesson’s target grouping, tests restored lesson navigation and phone overflow, and confirms that previews create no learner records. The captured catalog, browser coverage rows and expanded machine audit stay generated under ignored `output/review-audit-after/`.

Screenshots of the corrected lesson filters and original-exercise links: [Rank/Inverses desktop](screenshots/review-coverage/linear-algebra-rank-inverses-desktop.png), [phone](screenshots/review-coverage/linear-algebra-rank-inverses-phone.png), [Least Squares desktop](screenshots/review-coverage/linear-algebra-least-squares-desktop.png), [phone](screenshots/review-coverage/linear-algebra-least-squares-phone.png).
