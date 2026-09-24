# Subject authoring

Author curriculum directly in `content/`. Lesson prose and structure belong in
`content/lessons/*.mdx`; structured records belong in YAML or JSON. These files
are the source consumed by `npm run content:build`. There is no preliminary generation
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
lesson's data. Vite compiles each canonical document with `@mdx-js/rollup` into a
React component using the [standard MDX integration](https://mdxjs.com/docs/getting-started/#vite). `web/src/lessonModules.ts` loads one compiled lesson module on
demand; the PWA precaches all lesson chunks for offline navigation.
`web/src/LessonDocument.tsx` exports the `lessonComponents` map and supplies lesson
context. `App` passes the map through MDX's standard `components` prop. No MDX provider package is required.
The reading view renders that compiled document directly.

`Figure` resolves its ID in `content/figures.json` and renders the real React
figure implementation. `Exercise` resolves a worksheet question from the current
lesson's validated runtime data. `QuickCheck` resolves its declarative quick-check
record and stable promoted exercise. Both assessment components use the existing
React exercise implementation, including grading, saved work, and feedback. Figure
tags are never rewritten into Markdown image links for the reader.

To add an interactive lesson element, implement a React component and register it
in the `lessonComponents` map in `web/src/LessonDocument.tsx`. Then use its explicit
tag in the lesson. No MDX parser case, Markdown marker, or placement-data renderer
is needed. For example, a registered component may receive literal props:

```mdx
<TruthTableBuilder variables={2} showHints={true} />
```

Component names and props are part of the React component's interface. String,
number, boolean, and null literals are allowed as props. MDX validation rejects
imports, exports, arbitrary JavaScript expressions, loops, spreads, event-handler
props, and code that constructs lesson content. The standard remark plugin in
`tools/content/lesson-mdx-policy.ts` checks document policy separately from MDX
compilation; it does not replace compilation with a custom tag interpreter. Math
expressions remain math, not JavaScript. Missing component registrations fail when
the compiled document renders and are covered by the lesson rendering tests.

An `Exercise` tag places an existing worksheet question after its teaching.
Questions without an inline placement remain in additional practice. Do not
invent a new exercise ID merely because a question moves between lessons. Figure
and quick-check references must agree with their lesson/section records. Put
assessment tags at the end of the complete H2 teaching section, after any H3
subsections and figures. Preserve established exercise ordering and the placement
arrays used by grading contracts. No separate placement JSON or code-authored
heading map controls the lesson order.

`web/lesson-mdx-options.ts` configures the standard compiler for Vite and render
tests, including GFM, math, KaTeX, and document validation. The normal remark
transforms in `web/lesson-mdx-plugins.ts` add term links and group H2 headings and
their following content into React layout components. They leave authored
component nodes intact. The React prose wrapper groups the already compiled
children to retain existing formula-popover source identities; it never parses
Markdown or constructs lesson text.
Prettier uses its Markdown formatter for lesson documents to preserve ordinary
mathematical prose; MDX validation and the standard compiler still check them.

## Rendering and metadata are separate

The same canonical files feed two normal build paths:

```text
content/lessons/*.mdx ───────────> standard MDX compilation ──> React lesson
          │
          └─ + YAML/JSON ──────> static metadata extraction ──> catalogs/indexes
```

`tools/content/lesson-metadata.ts` statically inspects document headings, prose and
references for validation, grading context, section indexes, and exercise
placement. Assessment tags are excluded from grading-context prose; figure
references stay MDX component nodes rather than becoming Markdown image markers.
`npm run content:build` joins that metadata with the declarative worksheet, review and
grading records and writes runtime assets under `output/`. Browser
components do not import this build processor or render its legacy block arrays
as the lesson document. Metadata extraction never generates canonical lessons or
worksheet files, and registering a new React teaching component does not require
adding a rendering case to it.

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

Exercise identity is the original namespace plus numeric ID, independent of the
lesson presenting it. `linear-algebra-rank-inverses` retains namespace
`linear-algebra-bases`; `linear-algebra-least-squares` retains namespace
`linear-algebra-projections`. Split fixtures under `tests/curriculum/fixtures/`
protect these ownership and namespace contracts. Quick-check IDs must also stay
unique within a shared namespace so legacy save keys continue to resolve.
These fixtures are compatibility inputs; edit curriculum in `content/`.

## Teaching for understanding within a time budget

Lessons are teaching documents. Start important ideas in ordinary English, explain
the problem they solve, and connect them to something already taught. Then give
the precise definition and explain how to read the notation. A definition followed
by a list of facts rarely supplies enough help to use the idea.

Before assessment, work through a representative problem. Explain why you chose
the first step, what the target requires, and why each move is allowed. Include
contrasting examples when a distinction matters (membership versus inclusion,
existence versus uniqueness). Name the likely misconception and show how to
detect it. Use connected prose; these are teaching goals, not mandatory headings
to repeat in every section.

Teach problem-solving and proof construction cumulatively. Never require a proof
pattern before introducing its skeleton and working a complete example. An
implication begins with its hypothesis and a precise target; a universal proof
uses an arbitrary allowed object; a subset proof follows an arbitrary member;
set equality needs both inclusions. Existence needs a verified witness, uniqueness
also rules out a second solution, and disproof needs a counterexample that meets
the hypotheses. Explain the changed assumptions for contraposition and
contradiction. Return to these patterns in later problems rather than assuming
learners will infer them from grading feedback.

Choose a small recommended path through the worksheet using explicit MDX exercise
placements. Preserve representative interpretation, application, counterexample,
and proof work where each is an objective. Keep near-equivalent long problems in
optional extra practice, with their original IDs and saved work. Do not imply that
finishing the entire bank is necessary to complete a lesson. A learner who struggles
should revisit the relevant worked example and try a nearby problem; a learner
who has demonstrated the same routine skill need not repeat it indefinitely.

Audit important terms and notation against dedicated review objectives. Include
term-to-meaning, meaning-to-term, notation-to-English, nearby distinctions, cloze,
and example/non-example checks. Keep constructive and proof evidence separate:
recognizing a proof's next step does not demonstrate the ability to write a proof.
Use deterministic responses for fast terminology checks. Retain existing review
identities when supplementing coverage.

Estimate time before choosing exercise volume. The normalized planning categories
are definition/terminology (10–30 seconds), true/false (10–30 seconds), multiple
choice (15–45 seconds), short answer (30 seconds–2 minutes), short application
(1–3 minutes), deep reasoning (3–8 minutes), and proof (5–15+ minutes). These are
heuristics, not response deadlines or observed learner performance. Interaction
effort and evidence depth remain separate from these costs: a typed term can be
cheap production evidence, while a short-looking proof can require substantial
thinking.

Initial practice can contain deeper work. Routine retention should predominantly
retrieve definitions, notation, distinctions, and small applications. Schedule
proof and deep review sparingly and deliberately; a due concept is not a reason
to repeat every long exercise that mentions it. Report before/after recommended
counts, depth, approximate minutes, and important-term coverage when revising a
lesson. State separately how much optional practice remains and what the estimates
omit (reading, feedback, and individual variation).

## Editing, inspection, and validation

1. Edit the relevant MDX/YAML/JSON records directly, preserving existing ordering
   where it affects IDs, variant selection, grading hashes, or saved history.
2. Inspect the supporting passages and independently check the changed
   mathematics. Follow [the source policy](content-sources.md); cite pinpoint
   support for all changed prose, prompts, answers, feedback, figures, and syntax.
3. Record only the versions actually inspected. Use `lessonSourceHash` and
   `sourceHash` on candidate published objects as documented in the source policy.
   Curriculum inspection snapshots come from the inspected inventory. Never
   refresh a digest or date merely to silence validation.
4. Run `npm run content:build`, `npm test`, `npm run typecheck`, `npm run web:test`,
   `npm run web:build`, and `cd server && go test ./...`. The content build validates
   schemas, references, sources, prerequisites, grading contracts and identities.
   Check formatting with `npm run format:check`.
5. For user-visible changes, inspect desktop/phone behavior and capture screenshots.
   For grading or identity changes, run shared deterministic fixtures and review/
   restore compatibility tests. Preserve frozen review instances and saved work.

Finite review banks in `content/review-variants.json` contain complete questions
and explicit seed-selection data. Preserve variant order, seed contracts, choice
IDs, and frozen instances. The three legacy slot-bearing template summaries are
API/hash compatibility metadata; they are never interpolated into questions.
See [Review authoring](review-system.md) and the
[deterministic grading contract](deterministic-contract.md) for their current rules.

A passing build or unchanged hash establishes neither educational completeness nor
mathematical correctness. Report the actual inspection/calculation performed.

Every revealed answer must contain the actual accepted response, followed by its
explanation. Each structured assessment must author a complete `solution` response
object using the same field IDs and values a learner submits. The content build
grades this exact response against all requirements together, in lessons, review
templates, and review variants; missing, incomplete, or rejected solutions block
publication. Passing test fixtures alone do not satisfy this requirement. The UI
shows this response under **Accepted answer**. Mathematical values must be valid
standard TeX, rendered like all other mathematics in the app, with their exact
accepted TeX available to copy. Do not expose grader shorthand such as `exists`,
`!`, `&`, or `|` as mathematical notation. The reveal identifies the keyed option
for multiple-choice questions. Open-response questions must include a model answer.

For logical formula inputs, also state the requested symbolic form and define
named predicates and domains in the question. Explanations may use ordinary
mathematical prose; the separately displayed solution supplies the exact accepted
input. Keep solutions in canonical content, not in renderer code. Historical
snapshots may omit the new field and remain readable; adding a solution alone
does not change an existing draft's grading fingerprint.
