# Review system v1

This document describes the implementation of [the spaced repetition design](spaced-repetition.md). Scheduling and session planning run in Go. React displays server results and renders issued questions through the existing `Exercise` component.

## Using Review

The top-level **Review** destination shows due, Quick-compatible, and deeper target counts. **Regular** selects from all compatible due tasks. **Quick** selects tasks with low interaction cost and tap or short-text input. Cognitive level is separate metadata: Quick does not mean easy.

The same screen offers **Focused Practice** filters for lesson, concept, skill, and study mode. Filters combine; a combination with no compatible tasks shows an empty session. Focused Practice may select knowledge that is not due and deliberately activates the selected targets. Existing lesson exercises and the original Practice flow remain available.

A collapsed schedule shows each active target's due date and reason. Each issued question has a collapsed “Why am I seeing this?” explanation. Sources remain collapsed beneath revealed explanations, outside answer-choice controls. Skipping, visiting all tasks, or returning to the overview does not certify a target. Pending answers update the authoritative counts after server processing.

## Ownership and persistence

`server/review.go` owns activation, scheduling, due counts, template/variant selection and session ordering. The API exposes:

- `GET /api/v1/review`: current summary, active targets, and available filter options;
- `POST /api/v1/review/sessions`: plan Regular/Quick scheduled review or focused practice;
- `POST /api/v1/review/import`: restore issued instances and observations, then replay scheduling.

The scheduling key is concept × skill × optional objective, not an exercise ID. Lesson is a selection filter. Existing structured primary concept/skill relationships supply the broad template pool. One target has one required evidence depth; incompatible shallower templates cannot satisfy it.

Attempts and assessment history remain observations. Mutable `review-state/` records contain due dates, interval days, activation, active-evidence and actual-review timestamps, evidence depth, and an explanation. They use the existing SQLite records/change stream and are separate from attempts. Server-issued `review-instance/` and `review-session/` records preserve planned work; `review-activation/` records retain deliberate practice activation. The client cannot update schedule records through ordinary mutations.

The server reconstructs review state from structured active evidence in submission order, with attempt ID as a stable tie-breaker. This also supports historical attempts, imported observations, and grade corrections. Passive exposure records are not inputs. Merely opening, scrolling, or rereading a lesson cannot activate review. Missing historical review context stays missing; replay does not fabricate prior scheduled sessions.

An exercise can activate an associated terminology objective without having asked its definition. A newly activated objective without matching graded evidence is due immediately. Historical attempts with usable structured evidence enter review without requiring the learner to redo the lessons.

## Scheduler rules

Intervals are elapsed days, with one day equal to 86,400,000 milliseconds. These are explicit v1 rules, not learned estimates of memory or numerical mastery.

| Observation                            | Initial interval |
| -------------------------------------- | ---------------- |
| Clean success                          | 6 days           |
| Correct but Unsure                     | 3 days           |
| Correction after one substantive error | 2 days           |
| Multiple substantive errors            | 1 day            |
| Substantive failure                    | 1 day            |
| Answer revealed or copied from a retry | 1 day            |
| Only clerical/prompt-compliance error  | 6 days           |

Assistance and substantive errors take precedence over Unsure. Error diagnosis distinguishes clerical, prompt-compliance, and technical issues from substantive errors; an incorrect attempt without usable diagnosis is treated conservatively as substantive. Retry history is retained rather than replacing an earlier miss with a later correct answer. The scheduler counts substantive errors within a correction episode: the first correct answer uses that error count, then ends the episode so later clean attempts are not permanently penalized. Ungraded attempts do not end an episode.

A success qualifies for interval expansion only when the target is due and at least 24 hours have passed since the previous observation. Clean delayed scheduled retrieval multiplies the prior interval by 2. Focused practice and ordinary lesson/legacy attempts use 1.25, and Unsure uses 1.2. Only an explicitly scheduled review receives the 2× factor; missing review context does not imply cold scheduled retrieval. The applicable initial interval is the floor; the maximum interval is 180 days. Failed or assisted retrieval contracts to the corresponding short interval. Immediate repeated review practice does not postpone an established due date merely by producing another success.

Focused practice can satisfy a matching due target. Its context remains distinct from scheduled retrieval, and its smaller expansion factor acknowledges that intentionally selected practice may be primed.

## Templates, evidence depth, and planning

`content/review-templates.json` contains dedicated fixed, authored, and generated review families. Lessons 1–2 combine deterministic terminology and interpretation probes with short constructive variants. Existing lesson exercises continue to supply longer reasoning and proof tasks. The original witness-definition production cards and integer-witness-selection generator retain their identities and evidence requirements.

The historical generated family now selects a complete authored question from `content/review-variants.json`. Its 400 entries ask which integer satisfies an existential condition of the form `x + a = sum`. SHA-256 of the saved seed determines `a` and `sum` in 1–20; the witness is `sum - a`, with adjacent integers as distractors. This is witness **selection**, not evidence of constructing a witness without choices. Negative and zero witnesses are supported.

Two further finite variant banks support Lesson 1. Their historical generator labels remain API metadata; there are no executable question generators. `propositional-truth-values` samples the 16 combinations of two truth values and four connectives (AND, inclusive OR, implication, biconditional). Its saved integer parameters are `p`, `q`, `operation` (0–3 in that order), and `result`, with false/true encoded as 0/1. `integer-conditional-counterexample` chooses `b` in −10–10 and `gap` in 1–5, sets `a = b + gap`, and asks for a counterexample to “if `x < a`, then `x < b`” over integers. The boundary `b` refutes the implication; distractors `b − 1` and `a + 1` respectively satisfy the consequent or fail the antecedent. The generic selector rotates option order deterministically for these two banks; the original witness generator retains its existing output. Both supply recognition evidence, leaving construction targets separate.

Existing exercise templates supply additional concepts and skills without changing the curriculum. Choice tasks provide recognition evidence. Production and reasoning targets retain their deeper requirement; repeated recognition cannot erase construction or proof work. Deeper tasks may provide multiple compatible observations when their authored primary concept/skill mappings actually cover those components. There is no blanket rule that any proof certifies every weaker skill.

The server groups compatible templates by target, orders eligible targets by due time, and interleaves concepts when an alternative exists. Sessions contain at most 30 targets, with one instance per selected target. Template/variant selection is deterministic for the persisted seed; every selected question and parameter map already exists in canonical JSON. Long-term interval rules are separate from this within-session ordering.

Quick mode filters eligibility only. It does not change deferred targets or their due dates. The summary counts targets rather than variants or exercises. Deeper due work remains available through Regular mode.

## Attempt context and grading

Issued instances contain the exact question, source target, grading content version, and presentation context. Review attempts retain:

- Scheduled-review or focused-practice kind;
- Instance/template identity and concept/skill/objective;
- Scheduled-for and presented-at timestamps;
- Previous observation time and prior interval when known;
- Seed and generated parameters.

`presentedAt` records when the server made the **whole session** available, not when the learner first viewed each item. It must not be interpreted as item-level exposure telemetry. Existing lesson attempts without review context retain their original meaning.

The existing answer renderer, deterministic choice grading, AI grading, effort/Unsure/assistance capture, handwriting/photos, retry behavior, and grading diagnostics are reused. Review is not a second grading stack. The server checks submissions against issued instance context. Restoring current-version instances reproduces their question and parameters from the template/seed; historical-version instances retain their validated original question and teaching snapshot. Imported legacy lesson attempts without original teaching context cannot be regraded, rather than silently applying today’s question.

## Offline work, sync, and export/import

The browser caches the last server summary and unfinished session, identifying saved counts as potentially stale. Already issued questions can be answered offline using existing local drafts, attempts, deterministic grading, and the submission outbox. A new queue or session requires the server; the browser does not calculate intervals or independently plan due work. AI grading and authoritative schedule updates wait for connectivity.

Browser local-work JSON exports retain the existing version 2 envelope, with optional review context, issued records, cached active session, and pending operations. Version 1 and version 2 backups without those additions continue to load. Authentication settings are not included.

Import restores local work and queues a review restore operation before dependent attempt uploads. The server restores missing instances/observations idempotently and replays scheduling instead of accepting imported due dates as authoritative. Existing server observations are not overwritten. Restored record revisions are reset locally so revisions from an old server cannot outrank a new server's replay. If restoration fails, dependent submissions remain queued with a visible error.

The separate analysis ZIP remains version 2. `attempts.json` preserves optional review context; `review.json` separates schedule state, issued instances, and sessions. Raw records preserve activation records, and the curriculum snapshot includes review templates. This ZIP is an analysis artifact, not a browser-import file. It contains server-synced work; use the browser export for work that has not uploaded.

## Source coverage and intentional limits

Each template and complete parameterized bank has a pinpoint source assignment and inspected content digest in `content/sources.json`. Bank digests cover prompts, answers, feedback, saved parameters, and seed selection metadata. The content build validates targets, family payloads, choice keys, evidence level, supported generator slots, math syntax, source coverage, and digests. It publishes templates into both the grading catalog and bundled content. Changing a question, variant, or feedback requires source reinspection. Existing lesson source digests are unchanged.

The authoring surface reuses the existing exercise catalog and grading interfaces. New terminology probes use deterministic choices. The two original witness-definition production cards retain the existing free-response grader; recognizing a definition does not satisfy their production requirement. Short constructive transformations and countermodels also use the existing free-response grader. General exact-text or symbolic response grading, new matching interfaces, unrestricted LLM question generation, personalized forgetting curves, FSRS, psychometrics, and mastery percentages remain outside this content pass.

Replay favors inspectability and existing persistence patterns over an incremental scheduler subsystem. Session availability timestamps are not precise per-item exposure times. These limits preserve usable observations for later retention research without claiming a calibrated memory model.

## Authoring audit: Review Library

Open **Review → Review Library** to inspect all effective review content, including targets that no learner has activated. The separate library route is `#/review-library/<lesson-slug>`; its lesson context does not restrict the catalog until a lesson filter is selected. This is a read-only authoring tool. The learner's Review queue remains a separate view.

Authored content stays in Git: dedicated definitions, variants, and historical generator labels live in `content/review-templates.json`; complete questions and saved parameter values for the historical generated families live in `content/review-variants.json`; reused exercises remain in their existing lesson/worksheet content and evidence mappings. `npm run content` validates and compiles these into `output/grading-catalog.json`. SQLite contains learner/runtime state—attempts, grades, schedules, activations, sessions, and issued instances—not authored review definitions.

The library API calls the scheduler's existing `reviewTemplates()` function. That function combines dedicated templates with primary concept × primary skill mappings from the compiled lesson exercise catalog, transforms each eligible exercise into a fixed template, and removes shallower evidence incompatible with the target's required depth. A choice exercise cannot certify a constructive skill. Quick compatibility comes from the same server `quick()` method used by planning. React only filters and groups the returned effective templates; it does not reconstruct eligibility.

The authenticated, read-only API exposes:

- `GET /api/v1/review/catalog`: `{ contentVersion, items }`, including target, lesson, family, evidence and cognitive levels, interaction cost, input capabilities, Quick compatibility, provenance, source target, origin, original exercise identity, activation concepts, question/answer/choices, authored variants/count, and generator metadata. Teaching snapshots, attempts, and schedule state are excluded.
- `GET /api/v1/review/catalog/{id}/preview?seed=...`: `{ templateId, seed, parameters, question }`. Supply a nonempty seed of at most 256 UTF-8 bytes. The server uses the same question instantiation helper as scheduled review. The same catalog version, template, and seed produce the same result. Unknown or filtered-out template IDs return 404. Previews create no review session, instance, activation, attempt, or schedule record.

`lesson-exercise` provenance identifies reused exercises, with a link to the original exercise. Their origin is the stable `lesson:<slug>` identity because the compiled catalog does not retain individual source-file paths. `review-template` provenance identifies dedicated entries in `content/review-templates.json`. Family is independent of provenance: a dedicated template can also be fixed. Authored variant counts exclude the representative question and are zero for fixed/generated templates. Expanding an authored template shows every variant so term-to-definition, definition-to-term, cloze, and distinction forms can be inspected without adding a subtype taxonomy.

Reused exercises carry their current `lessonSlug` separately from their historical exercise namespace. Library filters, source links, and focused practice use the current lesson; template IDs, exercise keys, and historical attempts retain the namespace. This matters for Rank/Inverses and Least Squares, whose exercises retain older Bases and Projections keys. Older catalogs without the location field continue to use their namespace as the lesson location.

Combine the library filters or search to audit a topic. For definition coverage, choose skill **recall** and objectives **present**; add provenance **Review template** to exclude reused exercises. Quick filtering also includes short-text production cards when the server marks them compatible. Evidence **reasoning** locates deep tasks; skill **prove** narrows that to proofs. Generated items have a seed field and sample controls showing the rendered question, correct answer, choices, and parameters. Change the seed to inspect another deterministic sample; previews do not affect learner work.

**Coverage** groups the currently filtered templates by concept × skill × optional objective. Each effective template contributes one count, including an authored family with multiple variants or a generator with many possible outputs. The same lesson exercise can contribute to different targets when its primary mappings warrant it. Quick counts compatible templates; evidence and family columns give explicit template counts. Neutral observations such as “No Quick-compatible template”, “Recognition only”, and “No variant/generator coverage” invite author judgment, not errors or a score. A proof target may intentionally have only reasoning evidence and no Quick option.

Clear filters to audit the whole effective pool. Coverage does not infer unreviewed concepts or invent rows for targets absent from the effective catalog, and filtered-out weaker templates are not presented as scheduler options. To expand coverage, edit the source-controlled content/evidence, follow [source verification requirements](content-sources.md), rebuild, and inspect again. There is no browser content editor, SQLite authoring path, or automatic card generation. The library and new previews require the API; existing saved learner review sessions retain their offline behavior.

### Authoring conventions

Start with the effective Library, then compare it with the lesson's teaching targets. Count templates separately from authored variants, and distinguish dedicated review content from reused exercises. A large fixed exercise pool may still lack a concise definition or useful Quick representation. Conversely, a target with substantial proof or translation coverage does not need another near-duplicate merely to fill a column. Record concrete before/after counts and intentional gaps in an audit, rather than an aggregate coverage score.

Use existing concepts and skills. Add an objective only for a stable, independently useful target, such as `contrapositive-definition` or `quantifier-order-dependence`. A choice can have skill `recall` while its evidence remains `recognition`: the skill describes what knowledge is requested; the evidence level describes what the response demonstrates. If an existing target requires production, give its recognition companion a distinct objective. Never lower the deeper target's evidence requirement to make a choice eligible.

Use fixed cards when exact repetition is useful; use authored variants to change the direction or context of retrieval. Definition-to-term, term-to-definition, a cloze, and a distinction can share one objective. The representative `question` should equal one of the variants; it is not an additional scheduled variant. Distractors should expose a particular misconception, with concise feedback explaining it. Vary correct-answer positions: the exercise renderer preserves authored choice order.

Prefer deterministic choices for terminology, truth conditions, scope, and symbolic recognition. Do not send new one-word terminology questions to the free-response grader. Keep actual negation production, witness construction, counterassignments, and countermodels as separate constructive evidence. Reuse existing longer proofs where their coverage is sufficient; do not label proof or open construction Quick merely to raise the Quick count.

Use generation only for a bounded mathematical family with a known answer. Each generator must preserve seed reproducibility and stored parameters, state domains explicitly, and avoid ambiguous options or degenerate cases. Test the finite parameter domain independently where practical, as well as many real seeds through instantiation. Check answer correctness, distinct options, variation (including answer positions), complete placeholder substitution, preview/session agreement, and reproduction. Preserve existing generator outputs when adding a new family. Source inspection covers the mathematical rule and the independently checked original examples, not a claim that the cited book contains the generated questions.

## Validation and screenshots

The implementation adds scheduler/planner/generation/persistence tests, source/template tests, and browser storage/sync/UI coverage. The PR handoff records the commands actually run and links screenshots of the landing summary, Regular and Quick sessions, deferred deeper work, focused filters, and mobile layout. The repeatable browser script is `scripts/check-review-ui.mjs` (set `PLAYWRIGHT_MODULE` to a local Playwright installation if it is not on the module path). It intercepts all API requests with synthetic evidence and checks desktop/mobile interaction, deferred deep dates, and queued submissions during an API outage. This API-outage check does not claim to test production service-worker caching.

Screenshots: [landing](screenshots/review/landing.png), [Regular](screenshots/review/regular.png), [Quick](screenshots/review/quick.png), [deferred deeper reviews](screenshots/review/deferred.png), [focused filters](screenshots/review/practice.png), [mobile](screenshots/review/mobile.png).

The library check is `node scripts/check-review-library-ui.mjs`, after `npm run web:build`. It starts its own loopback Go API and Vite server with the real compiled catalog, a temporary database, and an ephemeral test account; it never connects to the production notebook or a grading provider. It exercises catalog/filter/search/coverage interactions, authored variants, deterministic generated previews, lesson navigation, error and empty states, and mobile overflow. `PLAYWRIGHT_MODULE` and `CHROME_BIN` select an existing local Playwright/Chrome runtime. Service workers are blocked for this check; it does not claim offline caching for the library.

Review Library screenshots: [overview](screenshots/review-library/overview.png), [filtered](screenshots/review-library/filtered.png), [expanded authored item](screenshots/review-library/expanded.png), [coverage](screenshots/review-library/coverage.png), [generated preview](screenshots/review-library/generated.png), [mobile](screenshots/review-library/mobile.png), [mobile coverage](screenshots/review-library/mobile-coverage.png).

## Editing finite review banks

Edit `content/review-variants.json` directly. Each bank is keyed by its existing review template ID and contains complete questions, grading keys, feedback, and saved integer parameters. Array order and colon-separated variant IDs encode the established seed lookup and must remain stable. `selection.hashBytes` and `selection.moduli` specify which SHA-256 seed bytes choose the entry; optional `choiceRotationByte` only rotates presentation order. These fields select existing data and do not construct questions or calculate answers.

The three historical template questions containing `{{slots}}` remain in `content/review-templates.json` solely to preserve the published Review Library template projection, source digests, and grading version. The server does not interpolate or execute them. They are compatibility metadata, not a second question-authoring workflow. Edit complete bank entries for learner-visible changes and keep any changed template summary consistent. Reinspect the corresponding source passages and update only the affected `sources.reviewVariants` digest. Changes to existing bank questions require an explicit content-version/identity migration because the original seed contracts are frozen; do not update compatibility fixtures to conceal a changed historical question.

`npm run content` validates and packages the bank into the grading catalog. It does not generate canonical files. `scripts/review-variants.test.ts` checks schema/source integrity; `server/review_generators_test.go` independently checks mathematical correctness and compares all 747 historical parameter/answer-position combinations with hashes captured before removal of the old Go generators. See [the review migration record](review-declarative-migration.md).
