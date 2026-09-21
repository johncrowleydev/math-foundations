# Declarative curriculum migration

This migration replaces executable curriculum authorship with documents and data.
The baseline is commit `41f51ba`. Existing published content, including additions
that later generator runs could erase, is the preservation reference. The old
writers are migration inputs, not commands in the new authoring workflow.

## Migration map

The inventory covers all 77 files under `scripts/authoring/`: 65 MJS modules,
nine Python files, and three JSON files. No writer is removed until its published
information has a declarative destination.

| Former owner                                                                                                                   | Information                                                                                                                                                        | Declarative destination                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `calculus.mjs`, `calculus/00-*.mjs` through `22-*.mjs`, differentiation/integration/multivariable helpers, `answer-format.mjs` | Introduction, lesson order, section headings, prose, worked examples, explicit reference links                                                                     | `content/lessons/calc-*.mdx`, `content/curriculum.yaml`                                                                                                            |
| `probability-statistics.mjs`, `probability-statistics/00-*.mjs` through `22-*.mjs`, `helpers.mjs`                              | The same information for probability and statistics                                                                                                                | `content/lessons/ps-*.mdx`, `content/curriculum.yaml`                                                                                                              |
| Both subject writers and lesson modules                                                                                        | Finite expanded exercise prompts, worked answers, question IDs and grouping                                                                                        | `content/worksheets/calc-*.yaml`, `content/worksheets/ps-*.yaml`, existing declarative copy/prerequisite overrides                                                 |
| Both subject writers and calculus feedback modules                                                                             | Quick-check prompts, options, explanation, per-option feedback and promoted exercise IDs                                                                           | `content/quick-checks.yaml`, `content/choice-feedback.json`, `content/knowledge-check-exercises.json`                                                              |
| Both subject writers, calculus helpers, probability `assessment.mjs`                                                           | Input schemas, exact expected values, domains, tolerances, deterministic requirements, evidence levels, valid/invalid response fixtures                            | `content/deterministic-calculus.json`, `content/deterministic-probability-statistics.json`                                                                         |
| Both subject writers and lesson review arrays                                                                                  | Dedicated review prompts/answers, template and variant IDs, grouping/order, skills, activation concepts, source references, assessments and fixtures               | `content/review-templates.json`, `content/deterministic-review-fixtures.json`                                                                                      |
| Both subject `figures.mjs` files                                                                                               | Coordinates, axes/ticks, labels, frame text, construction notes, limitations and prerequisites                                                                     | `content/figures.json`; explicit figure references in lesson MDX                                                                                                   |
| Both subject writers and term/source objects, probability `inference-sources.mjs`                                              | Definitions, examples, confusions, concept introductions, citations and pinpoint source assignments                                                                | `content/references/{calculus,probability-statistics}.json`, `content/concept-introductions.json`, `content/sources.json`                                          |
| Both subject writers                                                                                                           | Exercise placements, required teaching hashes, concept/skill/representation mappings                                                                               | Explicit lesson MDX components, `content/inline-prerequisites.yaml`, `content/evidence/{calculus,probability-statistics}.yaml`                                     |
| Both subject writers                                                                                                           | Formula readings, TeX command examples/explanations, optional typing placements, requirement and inspection records                                                | `content/formula-explanations.json`, `content/tex-syntax.json`, `content/tex-teaching.json`                                                                        |
| `linear-algebra-practice.mjs`, `linear-algebra-advanced.mjs`                                                                   | Original practice families and expanded numeric cases, proof/interpretation prompts, worked answers, grouping, objective labels, exact numeric verification inputs | `content/worksheets/la-*.yaml`, `content/exercise-copy.yaml`, `content/linear-algebra-objectives.json`, `content/linear-algebra-verification.json`                 |
| Linear algebra core/pacing JSON                                                                                                | Original seed questions and historical split grouping/IDs                                                                                                          | Existing worksheets and MDX are canonical; historical compatibility fixtures under `scripts/fixtures/` preserve the old seed and split expectations                |
| `deterministic-exercises.py`, `deterministic_discrete.py`, `deterministic_proof_decisions.py`                                  | Bounded assessment schemas, recognition options, answers, feedback and fixtures for existing exercises                                                             | `content/deterministic-exercises.json`                                                                                                                             |
| `deterministic-linear.py`, `deterministic-algorithms.py`                                                                       | Expanded structured assessments, numeric/choice answers and fixtures, disposition rationale                                                                        | `content/deterministic-linear.json`, `content/deterministic-algorithms.json`, existing `docs/deterministic-*-dispositions.json`                                    |
| `deterministic-review.py`                                                                                                      | Finite review assessment schemas and fixtures                                                                                                                      | `content/review-templates.json`, `content/deterministic-review-fixtures.json`                                                                                      |
| `deterministic-dispositions.py`                                                                                                | Historical exercise/review audit decisions and supporting explanations                                                                                             | `docs/deterministic-discrete-dispositions.json`, `docs/deterministic-review-dispositions.json`                                                                     |
| Subject inspection scripts                                                                                                     | Inspected lesson/review/syntax digests, curriculum inventory snapshots, dates and explanatory audit notes                                                          | Existing `content/sources.json` and `content/curriculum-audit.json`; these are editorial facts and are not reapproved by this migration                            |
| `aggregate-writer.mjs`                                                                                                         | Order preservation and citation-date merge policy for repeated generation                                                                                          | No content to move: direct editing retains the existing array/object order and inspected facts; obsolete merge machinery and its two writer-only tests are removed |
| `verify-linear-algebra.py`, `deterministic-adversarial.py`                                                                     | Independent arithmetic verification and grader test-oracle construction                                                                                            | Retained as test tools under `scripts/verification/`; neither owns published curriculum                                                                            |

Additional executable ownership outside that directory was removed as well:

- The discrete-mathematics section/ID map in `scripts/notebook-placements.ts`, and
  the three subject placement JSON files, are replaced by explicit MDX tags.
- The three review generators in `server/review.go` now use 521 complete questions
  and saved parameter maps in `content/review-variants.json`. Declarative seed
  lookup preserves all 747 parameter/answer-position cases captured from the old
  implementation. See [the detailed review migration](review-declarative-migration.md).
- The unused `scripts/formula-reading.ts` prose-generation helper is removed.

## Preservation boundaries

All finite family parameters already appear in expanded prompts, deterministic
contracts, or independent numeric fixtures. They are no longer an authoring
language. Figure sampling is already materialized as explicit coordinates, with
mathematical captions and limitations. Unused helper exports or unused candidate
TeX examples that were never published are not a second curriculum to preserve.

Do not rerun an old writer into canonical content. Several writers replace shared
arrays; the earlier architecture audit demonstrated invocation-order dependence
and review-fixture loss. The current checked-in data include later inspected
corrections and additional review families. Byte/runtime parity against that
baseline is more authoritative than forcing current content to match a stale
writer's result.

The new normal build compiles canonical sources into ignored `output/` and web
runtime assets. It never writes lesson, worksheet, or review source files. Stable
lesson slugs, exercise namespaces/IDs, review IDs/variant order, grading schemas,
source records and historical inspection hashes are compatibility boundaries.

The migration retains explicit assessment/source-inspection and mathematical
verification records even when they repeat content: these are independently
checked snapshots/contracts used to reject stale edits, not generated authoring
outputs. Historical linear algebra seed/pacing fixtures likewise establish saved
identity and original-question compatibility. They are test inputs, not an active
source for rebuilding lessons.

## Verification record

Final validation on September 21, 2026 used the integrated MDX and review-bank
pipeline. The results below include the existing deterministic fixtures and
review/catalog/history compatibility suites. Migration hashes
establish preservation; they do not establish mathematical correctness or replace
source passage inspection. No source-inspection date or digest is refreshed just
to pass validation.

### Materialization inspection before removal

The old writers were executed with their filesystem writes intercepted in memory;
no canonical file was overwritten. Semantic comparisons ignored formatting and,
for sources only, the writers' deliberately pending review-digest placeholders.

- Linear algebra: all 16 emitted files matched the existing declarative records.
- Probability and statistics: all 63 emitted files matched.
- Calculus: 56 emitted files matched. Seven shared aggregates differed in global
  subject order after the writer removed/reappended calculus; their authored
  entries were present and unchanged. Current established order was retained.
- Python linear algebra and algorithms assessment outputs and disposition ledgers
  matched; all 625 general deterministic assessment identities were present.
  Six current entries intentionally preserve later inspected answer/feedback
  corrections absent from the writer: `functions/73`,
  `predicates-and-quantifiers/{83,84,95}`, `proof-by-contrapositive/50`, and
  `sets-and-set-operations/64`. No assessment contract/fixture was missing.
- The old deterministic review writer reproduced the template definitions but
  would overwrite the shared fixture file with only its 22 variants. Every one
  was already present; all later-subject fixtures were retained as well. Both
  remaining disposition ledgers matched.

The inspection also found `scripts/formula-reading.ts`, an unused executable
formula-to-prose authoring helper outside `scripts/authoring/`. Its only references
were its own declarations; canonical readings already reside in
`content/formula-explanations.json`. It is removed rather than retained as a
second way to author curriculum.

### MDX compilation parity

The migration first compiled a representative calculus lesson, then all 75 lesson
documents. The baseline's 4,284 worksheet questions and 2,527 inline placements
were preserved (promoted quick checks add published exercise entries). All nine
compiled client content assets and the entire grading catalog were byte-identical to the
`41f51ba` baseline after the MDX/placement migration. Explicit `Figure`, `Exercise`,
and `QuickCheck` tags compile through the existing rendering contracts. Source
inspection hashes, source dates, lesson slugs, question IDs, exercise namespaces,
and grading content versions were not refreshed for this conversion.

### Retained executable tooling

`scripts/verification/verify-linear-algebra.py` reads declarative numerical
fixtures and compiled questions and independently checks their mathematics with
SymPy. `scripts/verification/deterministic-adversarial.py` constructs synthetic
grader-test oracles in `shared/deterministic-adversarial-corpus.json`; these are
never used as lessons or issued exercises. Neither tool authors curriculum, and
neither is a required curriculum-generation step. Existing parser, validation,
grading, rendering, catalog/index compilation, and synthetic-test code likewise
remain executable.

### Removal/tooling checks

After removing the old authoring tree, `npm run content` passed, as did all 1,172
linear-algebra pacing and adversarial conformance tests selected for this change.
The relocated adversarial oracle builder reproduced its formatted corpus exactly:
107 definitions and 1,166 cases covering 36 validators. Changed supported files
passed Prettier, and `git diff --check` passed.

The optional independent SymPy verifier exposed an existing stale comparison:
`linear-algebra-vectors/23` has a published prompt different from its historical
numerical fixture. The original `41f51ba` verifier fails at the same comparison
against the unchanged baseline output; relocation did not introduce it. The
script remains strict, and this migration does not rewrite content or fixtures to
silence that failure. SymPy was installed only in an ignored local verification
environment. This limitation is separate from the passing shared deterministic
fixtures and runtime byte-parity checks.

### Runtime artifacts and remaining executable content

No generated lesson, worksheet, or runtime catalog is checked in. Existing YAML/JSON
materializations are now directly edited source files; normal builds only validate
and compile them into ignored `output/` and `web/public/`. Historical inspection,
assessment, copy-adaptation and test fixtures remain for their documented
compatibility/verification purposes. The three legacy slot-bearing review template
summaries remain as API/hash compatibility metadata; they are never interpolated.
There is no remaining canonical curriculum in executable source files.

The only intentional published-output addition is `grading-catalog.reviewVariants`.
Removing that new field reproduces the old grading catalog bytes exactly, including
the grading version. All nine client artifacts still match the captured baseline.
The new source-inspection entries cover only the newly materialized review banks;
existing inspection hashes and dates remain unchanged.

Architecture checks run before each normal content build and in CI. They reject
reintroduced authoring directories, executable curriculum under `content/`, legacy
Markdown lessons, obvious relocated lesson DSLs, and direct canonical-source writes.
The MDX parser rejects executable constructs and unknown components. CI also checks
that the complete build/test workflow leaves canonical content unchanged. Static
pattern checks are practical safeguards, not a proof about arbitrary program behavior.

Local setup found that npm 9's default handling of the existing `file:..` web
dependency disagreed with its linked lockfile. `web/.npmrc` explicitly preserves
link installation, and the lockfiles include the MDX parser dependency and missing
optional YAML peer. The ordinary clean-install commands now succeed.

### Final integrated validation

| Check                                                                    | Result                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` and `npm ci --prefix web`                                       | Passed with project-local dependencies and explicit linked web dependency configuration.                                                                                                |
| `npm test`                                                               | 2,058 passed, including content/source validation, deterministic fixtures, architecture guards, MDX rejection tests, review-bank schema tests and 10 captured runtime hash comparisons. |
| `npm run typecheck`                                                      | Passed.                                                                                                                                                                                 |
| `npm run web:test`                                                       | 94 passed.                                                                                                                                                                              |
| `npm run web:build`                                                      | Passed, including TypeScript, Vite and PWA precache. Existing large-chunk advisory remains.                                                                                             |
| `npm run format:check`                                                   | Passed.                                                                                                                                                                                 |
| `cd server && go test -race -count=1 ./...`                              | Passed (167 seconds), including frozen review/restore, provider traps, catalog compatibility, shared deterministic fixtures and all 747 captured review cases.                          |
| `scripts/check-mdx-ui.mjs`                                               | Passed on the production preview: explicit figures, frame navigation, exercise draft restoration and quick-check selection, with all four subjects and desktop/phone captures.          |
| `git diff --exit-code -- content` after the complete build/test workflow | Passed; no canonical source changed during compilation/validation.                                                                                                                      |

The [six inspected screenshots](screenshots/declarative-curriculum/README.md) and
repeatable synthetic browser check record the interface. The optional SymPy
verification limitation above is the only known failing extra check; it was
reproduced on the unchanged baseline. No deployment, merge, or code-review request
was performed.
