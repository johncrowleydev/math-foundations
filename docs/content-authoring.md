# Subject authoring

Author curriculum directly in `content/`. Lesson prose and structure belong in
`content/lessons/*.mdx`; structured records belong in YAML or JSON. These files
are the source consumed by `npm run content`. There is no preliminary generation
command and no executable curriculum source under `scripts/authoring/`.

JavaScript, TypeScript, JSX, TSX, MJS, Python, Go, and other executable files may
parse, validate, render, grade, and compile curriculum. They must not contain the
canonical lesson prose, exercise/review banks, or curriculum structure, or provide
an authoring DSL that generates those records.

## Lesson documents and interactive components

Write ordinary Markdown headings, paragraphs, lists, links, and math in MDX.
Use the registered components explicitly where learners should encounter them:

```mdx
## Accumulation

Read the explanation and worked example before the practice.

<Figure id="calculus-figure-9" alt="An accumulation diagram" />

<Exercise id="1" />

<QuickCheck id="quick-1" />
```

This illustrates syntax, not a new lesson or source-supported mathematical claim.
Use the actual figure ID, local numeric worksheet ID, and quick-check ID from the
lesson's data. `Figure` renders through `web/src/Figure.tsx`; `Exercise` and promoted
`QuickCheck` records use `web/src/Exercise.tsx`. The compiler
accepts this explicit document structure, validates references and placement, and
builds the existing client section/figure/exercise objects without evaluating
lesson JavaScript. Unsupported tags, imports, exports, arbitrary expressions,
loops, spreads, and content-construction calls fail validation. Math expressions
remain math, not JavaScript.

An `Exercise` tag places an existing worksheet question after its teaching.
Questions without an inline placement remain in additional practice. Do not
invent a new exercise ID merely because a question moves between lessons. Figure
and quick-check references must agree with their lesson/section records. Put
assessment tags at the end of the complete H2 teaching section, after any H3
subsections and figures. The reader retains the historical worksheet order within
each section; tag order preserves the placement arrays used by grading hashes. No
separate placement JSON or code-authored heading map controls the lesson order.
Component properties are explicit strings; adding another interactive component
requires a deliberate parser/renderer extension, not per-lesson code.

The build uses the standard `remark-mdx` parser with `remark-math` and validates
a document-only subset. It emits data for the existing reader rather than
evaluating lesson JavaScript. Prettier uses its Markdown formatter for these
documents to preserve ordinary mathematical prose; the stricter MDX parser still
validates every build.

## Where to edit

| Information                                                                        | Canonical files                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Subject order, lesson slug/title/number, worksheet path, legacy exercise namespace | `content/curriculum.yaml`                                                                                                                        |
| Teaching and explicit interactive placement                                        | `content/lessons/*.mdx`                                                                                                                          |
| Worksheet sections, question IDs, prompts, answers, table data                     | `content/worksheets/*.yaml`                                                                                                                      |
| Self-contained notebook wording and prerequisite inspection                        | `content/exercise-copy.yaml`, `content/inline-prerequisites.yaml`                                                                                |
| Quick-check options/explanations and stable promoted exercise IDs                  | `content/quick-checks.yaml`, `content/knowledge-check-exercises.json`                                                                            |
| Choice conversion/feedback and structured deterministic schemas/fixtures           | `content/choice-exercises.json`, `content/choice-feedback.json`, `content/deterministic-*.json`                                                  |
| Dedicated review templates, ordered variants, assessments and fixtures             | `content/review-templates.json`, `content/review-variants.json`, `content/deterministic-review-fixtures.json`                                    |
| Concept/skill/evidence relationships                                               | `content/evidence/*.yaml`, `content/concept-introductions.json`                                                                                  |
| Figures, references, formula context and optional typing help                      | `content/figures.json`, `content/references/*.json`, `content/formula-explanations.json`, `content/tex-syntax.json`, `content/tex-teaching.json` |
| Pinpoint source support and inspected versions                                     | `content/sources.json`, `content/curriculum-audit.json`                                                                                          |

The copy/prerequisite, deterministic fixture, and inspection records sometimes
repeat authored information deliberately: they record a separately checked
adaptation or snapshot and reject stale edits. They are not outputs to recreate
from an executable question bank. Change each affected canonical record directly
and inspect what the learner will receive. Build artifacts under `output/` and
`web/public/` are ignored and regenerated by the normal build.

## Teaching and identity requirements

Every subject begins with **00 Introduction**, a reading-only page titled
**Introduction**. Explain its central questions, applications, prerequisites,
learning journey, and how to study it. It contains no exercises, quick checks,
submissions, or mandatory assessment. Define unfamiliar vocabulary and defer
technical details explicitly. An introduction must work at its direct URL without
an exercise collection.

Number working lessons from 01 within each subject. Subject metadata and displayed
numbers do not change canonical lesson slugs, exercise IDs, stored answers,
attempts, or bookmarks. Working lessons develop explanations, concrete examples,
and reasons for procedures before practice. Assume precalculus, define new
specialized vocabulary and notation before required use, and make exercises
self-contained. Include worked answers, meaningful quick checks, references,
optional TeX teaching, and prerequisite records. A reference supplements teaching.

Use figures when spatial structure or a representation change helps. Supply
explicit mathematical data, labels, caption, construction notes, limitations, and
prerequisites. Check the mathematics independently of the drawing implementation.

Build practice from objectives and the depth of the established curriculum.
Include fluency, interpretation, proof, counterexample, and application tasks as
appropriate. Vary mathematical cases; do not pad counts with cosmetic variations.
A fixed question quota is not a completeness criterion. The approximate preference
for deterministic grading is not a percentage gate. Reasoning/modeling tasks stay
open when those are the objectives. Fixed approximation questions state precision
and units and supply required CDF/critical values; use the bounded
`approximate-number` contract and separate fields for confidence endpoints.

The linear algebra sequence has 12 instructional lessons and its own unassessed
introduction. The [pacing record](linear-algebra-pacing.md) preserves 697 worksheet
questions and 24 quick checks. `linear-algebra-rank-inverses` retains namespace
`linear-algebra-bases`; `linear-algebra-least-squares` retains namespace
`linear-algebra-projections`. Historical split/seed JSON under `scripts/fixtures/`
is a compatibility test input, not an authoring source. Calculus and probability
and statistics each have an introduction and 22 instructional lessons; see their
[calculus](calculus-authorship.md) and
[probability/statistics](probability-statistics-authorship.md) records.

## Editing, inspection, and validation

1. Edit the relevant MDX/YAML/JSON records directly, preserving existing ordering
   where it affects IDs, variant selection, grading hashes, or saved history.
2. Inspect the supporting passages and independently check the changed
   mathematics. Follow [the source policy](content-sources.md); cite pinpoint
   support for all changed prose, prompts, answers, feedback, figures, and syntax.
3. Record only the versions actually inspected. Use `lessonSourceHash` and
   `sourceHash` on candidate published objects as documented in the source policy.
   Curriculum inspection snapshots come from the inspected inventory. Never
   refresh a digest or date merely to silence validation. The former subject-wide
   inspection scripts, with hardcoded historical approval claims, are removed.
4. Run `npm run content`, `npm test`, `npm run typecheck`, `npm run web:test`,
   `npm run web:build`, and `cd server && go test ./...`. The content build validates
   schemas, references, sources, prerequisites, grading contracts and identities.
   Check formatting with `npm run format:check`.
5. For user-visible changes, inspect desktop/phone behavior and capture screenshots.
   For grading or identity changes, run shared deterministic fixtures and review/
   restore compatibility tests. Preserve frozen review instances and saved work.

The three legacy finite review banks have explicit seed-selection data and complete
questions. See [their migration and compatibility record](review-declarative-migration.md).
Do not change frozen seed contracts or refresh the migration hashes without an
explicitly inspected content/history migration.

A passing build or unchanged hash establishes neither educational completeness nor
mathematical correctness. Report the actual inspection/calculation performed.
The [migration report](declarative-curriculum-migration.md) records the removed
systems, destinations, and compatibility evidence.
