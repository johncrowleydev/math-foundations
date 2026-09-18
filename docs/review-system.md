# Review system v1

This document describes the implementation of [the spaced repetition design](spaced-repetition.md). Scheduling and session planning run in Go. React displays server results and renders issued questions through the existing `Exercise` component.

## Using Review

The top-level **Review** destination shows due, Quick-compatible, and deeper target counts. **Regular** selects from all compatible due tasks. **Quick** selects tasks with low interaction cost and tap or short-text input. Cognitive level is separate metadata: Quick does not mean easy.

The same screen offers **Focused Practice** filters for lesson, concept, skill, and study mode. Filters combine; a combination with no compatible tasks shows an empty session. Focused Practice may select knowledge that is not due and deliberately activates the selected targets. Existing lesson exercises and the original Practice flow remain available.

A collapsed schedule shows each active target's due date and reason. Each issued question has a collapsed “Why am I seeing this?” explanation. Sources remain collapsed beneath revealed explanations, outside answer-choice controls. Skipping, visiting all tasks, or returning to the overview does not certify a target. Pending answers update the authoritative counts after server processing.

## Ownership and persistence

`server/review.go` owns activation, scheduling, due counts, template selection, generation, and session ordering. The API exposes:

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

Assistance and substantive errors take precedence over Unsure. Error diagnosis distinguishes clerical, prompt-compliance, and technical issues from substantive errors; an incorrect attempt without usable diagnosis is treated conservatively as substantive. Retry history is retained rather than replacing an earlier miss with a later correct answer.

A success qualifies for interval expansion only when the target is due and at least 24 hours have passed since the previous observation. Clean delayed scheduled retrieval multiplies the prior interval by 2. Focused practice uses 1.25, and Unsure uses 1.2. The applicable initial interval is the floor; the maximum interval is 180 days. Failed or assisted retrieval contracts to the corresponding short interval. Immediate repeated review practice does not postpone an established due date merely by producing another success.

Focused practice can satisfy a matching due target. Its context remains distinct from scheduled retrieval, and its smaller expansion factor acknowledges that intentionally selected practice may be primed.

## Templates, evidence depth, and planning

`content/review-templates.json` adds three small authored templates:

- Fixed production recall of the witness definition;
- Two authored production recall variants for the same definition objective;
- Deterministically generated recognition of an integer witness, with a separate `witness-selection` objective.

The generated question asks which integer satisfies an existential condition of the form `x + a = sum`. SHA-256 of the saved seed determines `a` and `sum` in 1–20; the witness is `sum - a`, with adjacent integers as distractors. This is witness **selection**, not evidence of constructing a witness without choices. Negative and zero witnesses are supported.

Existing exercise templates supply additional concepts and skills without changing the curriculum. Choice tasks provide recognition evidence. Production and reasoning targets retain their deeper requirement; repeated recognition cannot erase construction or proof work. Deeper tasks may provide multiple compatible observations when their authored primary concept/skill mappings actually cover those components. There is no blanket rule that any proof certifies every weaker skill.

The server groups compatible templates by target, orders eligible targets by due time, and interleaves concepts when an alternative exists. Sessions contain at most 30 targets, with one instance per selected target. Template/variant selection and generation are deterministic for the persisted seed. Long-term interval rules are separate from this within-session ordering.

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

Each new template has a pinpoint source assignment and inspected content digest in `content/sources.json`. The content build validates targets, family payloads, choice keys, evidence level, supported generator slots, math syntax, source coverage, and digests. It publishes templates into both the grading catalog and bundled content. Changing a question, variant, or feedback requires source reinspection. Existing lesson source digests are unchanged.

This release implements a small template authoring surface plus reuse of the existing exercise catalog. It does not rebalance hundreds of lesson questions or add new matching/classification interfaces. Fixed/authored definition recall currently uses the existing free-response grader; the generated witness selection uses deterministic choices. General symbolic response grading, unrestricted LLM question generation, personalized forgetting curves, FSRS, psychometrics, and mastery percentages are outside v1.

Replay favors inspectability and existing persistence patterns over an incremental scheduler subsystem. Session availability timestamps are not precise per-item exposure times. These limits preserve usable observations for later retention research without claiming a calibrated memory model.

## Validation and screenshots

The implementation adds scheduler/planner/generation/persistence tests, source/template tests, and browser storage/sync/UI coverage. The PR handoff records the commands actually run and links screenshots of the landing summary, Regular and Quick sessions, deferred deeper work, focused filters, and mobile layout. The repeatable browser script is `scripts/check-review-ui.mjs` (set `PLAYWRIGHT_MODULE` to a local Playwright installation if it is not on the module path). It intercepts all API requests with synthetic evidence and checks desktop/mobile interaction, deferred deep dates, and queued submissions during an API outage. This API-outage check does not claim to test production service-worker caching.

Screenshots: [landing](screenshots/review/landing.png), [Regular](screenshots/review/regular.png), [Quick](screenshots/review/quick.png), [deferred deeper reviews](screenshots/review/deferred.png), [focused filters](screenshots/review/practice.png), [mobile](screenshots/review/mobile.png).
