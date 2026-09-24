# Review system

Go owns activation, scheduling, due counts, template selection, and session planning. React displays server results and renders issued questions through the existing exercise controls and [grading pipeline](grading.md). Review schedules concept × skill × optional objective targets; lesson is a selection filter. It preserves the difference between recognition, production, and reasoning evidence.

## Using Review

The overview puts the next learner action first. With no retained session, **Today’s review** shows the estimated time and quick-recall/application/deep-question mix for the next possible scheduled session. **Start review** considers all compatible due work within the allowance. **Quick review** includes only low-interaction questions with tap or short-text input; cognitive difficulty is separate metadata. Deeper targets retain their due dates when Quick filters them out. If nothing can currently be planned, the overview says **You’re caught up for now** and does not show an unavailable start button. This means no scheduled review is currently available within planning constraints, not that every active target has been learned or is no longer due.

The **Daily review target** defaults to 25 minutes and accepts 5–60 minutes. It syncs between devices through the account preference `preference/review-budget-minutes`; an open Review page updates its target and estimate when a changed preference arrives. Offline changes stay queued, with the most recent local choice retained across reloads. Explicit changes use the same last-accepted behavior as other learning preferences.

On upgrade, an existing nondefault browser target initializes the account only if no shared target exists. An old browser's automatically saved 25-minute default never overwrites another device's choice, and a shared preference takes precedence over older local settings.

The target is a daily planning allowance, not a required duration; a session can be shorter when less compatible review is available. Existing scheduled sessions reserve their estimated time for 24 hours, including unfinished or ended sessions.

Returning to the overview pauses the session. Question navigation saves its position locally. **Continue your review** offers **Continue review** and **End session** when questions still need work. Continuing restores an unfinished question and its draft, including offline; if necessary it wraps back to earlier unfinished work.

Progress counts issued questions with a correct answer or matching server coverage as complete. Questions awaiting grading are shown separately from questions still to do; visiting, skipping, and drafts do not count as completion. When every question is complete, the overview says **Review complete** (or **Practice complete**) and offers **Close session** and **Review answers**. If only grading remains, it says **Answers awaiting grading** and offers **View answers**. A correct deterministic answer counts as complete locally while its schedule update may still be waiting for synchronization.

A retained session blocks new planning until it is explicitly closed. The overview explains the next action instead of displaying disabled start buttons. **End session** / **Close session** closes the active pointer without deleting drafts or attempts or releasing the time reservation.

**Focused practice** is a separate section for optional work outside scheduled review. It combines lesson, concept, skill, and study-mode filters, may select knowledge that is not due, and deliberately activates selected targets. An incompatible filter combination produces an empty session. An unfinished focused-practice session receives the same prominent continue/end workflow. Original lesson practice remains available.

The secondary, collapsed **Review schedule** shows each active target’s due date and reason. Issued questions have a collapsed “Why am I seeing this?” explanation; sources remain beneath revealed explanations, outside answer controls. Moving past the last question shows actual completion or pending-grading status, or **End of the question list** if work still remains, with close/end and **Revisit questions** actions. This screen leaves the session open; reopening an active session shows a question, with an explicit completion notice when all work is answered correctly or covered. Skipping or visiting every question does not certify a target; authoritative schedule updates still depend on grading and server processing.

Practice and Review use the same exercise sidebar and compact-screen picker component. On desktop the sidebar sits beside the reader, so each scrolls independently. Selecting a question scrolls only the exercise list to reveal its selection; it does not scroll the page through a nested sidebar.

## Evidence and scheduling

`server/review.go` reconstructs review state from active evidence in submission order, using attempt ID to break ties. It supports historical attempts, imports, and corrected grades without rewriting observations. Passive reading/exposure does not activate review. Deliberate practice activation and exercises with usable structured evidence do; an associated objective without matching graded evidence starts due immediately.

Attempts and assessments remain observations. Separate server-owned records use these prefixes:

| Prefix               | State                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `review-state/`      | Target activation, due date, interval, evidence depth, observation/review timestamps, and reason. |
| `review-activation/` | Deliberate focused-practice activation.                                                           |
| `review-instance/`   | Issued question and frozen context.                                                               |
| `review-session/`    | Persisted plan and issued instances.                                                              |

Ordinary client mutations cannot write these records. Replay uses the effective assessments and original evidence snapshots; it does not invent missing historical Review context.

Intervals use elapsed days of 86,400,000 milliseconds. The rules are transparent heuristics rather than fitted estimates of memory:

| Observation                            | Initial interval                          |
| -------------------------------------- | ----------------------------------------- |
| Clean success                          | 6 days                                    |
| Correct but Unsure                     | 3 days                                    |
| Correction after one substantive error | 2 days                                    |
| Multiple substantive errors            | 1 day                                     |
| Substantive failure                    | 1 day                                     |
| Answer revealed or copied from a retry | 1 day                                     |
| Only clerical/prompt-compliance error  | 6 days; retain a longer existing interval |

Assistance and substantive errors take precedence over Unsure. An incorrect attempt without usable diagnosis is conservatively substantive. Errors accumulate within a correction episode; the first correct answer uses the count and ends the episode. Ungraded attempts do not end it.

Interval expansion requires a correct, unassisted response with no episode errors, a due target, and at least 24 hours since its previous observation. Scheduled retrieval multiplies the prior interval by 2; focused practice and ordinary lesson/legacy attempts use 1.25; Unsure uses 1.2. The applicable initial interval is the floor and 180 days is the maximum. Failures or assistance contract the interval. Immediate repeated practice cannot postpone an established due date merely by adding a success. Focused practice can satisfy matching due work, while retaining its smaller expansion factor.

## Time allowance and session planning

`server/review_budget.go` assigns estimated costs:

| Category                 | Estimate per question |
| ------------------------ | --------------------- |
| Definition / terminology | 20 seconds            |
| True / false             | 20 seconds            |
| Multiple choice          | 30 seconds            |
| Short answer             | 1 minute              |
| Short application        | 2 minutes             |
| Deep reasoning           | 5 minutes             |
| Proof                    | 10 minutes            |

An authored `category` overrides classification from skills, response controls, proof requirements, and evidence metadata. These costs are planning estimates, not deadlines or measures of actual effort.

Scheduled work reserves its estimated cost for 24 elapsed hours from issue, including skipped, unfinished, offline, or ended sessions. Starting another session does not create a fresh allowance or repeat reserved compatible targets. Changing the daily target changes the total allowance, not prior reservations. Focused practice is available as deliberate extra work. Older instances without time estimates do not reserve this allowance; their frozen questions and evidence remain valid.

The planner considers fast retrieval, small applications, then expensive work, orders by due time within a tier, and interleaves concepts. It chooses a cheap compatible representation with a cap of 120 scheduled questions; focused practice has a 30-question cap. A scheduled plan permits at most one deep reasoning/proof question, only if none was issued in the previous seven elapsed days and it uses at most 40% of the plan's estimated time. Focused deep work also starts the seven-day window. A lone due proof therefore remains available through focused practice. Excess work stays due without recording failure.

A question can cover multiple targets only when its primary concept/skill mappings and evidence depth support them. Recognition cannot satisfy production/reasoning requirements, and supporting tags or separate objectives do not provide interchangeable credit. Lesson-backed free responses keep their actual authored skill depth regardless of which target selected them. Planned coverage never changes due dates; only graded responses supply evidence.

Each session uses a source exercise/template at most once. It also deduplicates visible tasks across sources using prompt, instructions, formula, table, and controls, ignoring internal IDs, grading metadata, glossary destinations, and option order. If a preferred candidate duplicates selected work, other eligible candidates are tried. Without a distinct candidate, the target is skipped without activation or due-date changes. A deeper question that covers all targets of an earlier assignment replaces it before instances are saved.

## Frozen context, offline work, and restoration

Issued instances preserve the exact question, teaching context, content version, template/instance identity, target, scheduled/focused kind, scheduled-for/presented-at times, prior observation and interval when known, seed, and saved parameters. `presentedAt` means when the whole session became available, not when each item was viewed. The server validates submissions against that issued context.

The server prepares catalog-derived templates and filter labels once at startup. Each summary still replays current learner evidence; an ordered batch read and a concept index avoid repeated per-attempt database queries and full-catalog scans. New answers, corrected grades, and imports therefore remain authoritative without a learner-state cache.

Review restores local work and its daily target before issuing the initial summary request. Loading, background refresh, and session planning show an animated status indicator.

The browser caches the last scheduler summary separately from the unfinished session. The summary is a preview of what could be planned now, after existing time reservations; it is not a saved session or an issued set of questions. When that summary is stale, the overview labels it as review status from its last update, explains that updates could not be checked, and offers **Try again**. Routine successful loads do not expose a manual refresh control. When a cached summary is available, refresh failures use that status message instead of a second raw API error. Errors from session actions remain visible, as do refresh failures when no summary is available. A locally saved session’s offline availability is explained separately. Issued questions can be answered offline using drafts, deterministic grading, and the submission outbox. New sessions, model grading, and authoritative schedule updates need connectivity.

For an existing scheduled session, resume/forward navigation skips unattempted questions whose matching target received evidence after issue and is no longer due in the cached server summary. The current question stays open with a skip explanation; backward navigation retains access to original questions, drafts, and attempts. Focused practice and questions with their own attempts are exempt from coverage skipping. Resume also skips correct answers, searches earlier unfinished questions if none remain after the saved position, and falls back to the saved question when every question is answered or covered. Only explicit forward navigation reaches the end-of-list screen.

Settings JSON exports preserve issued records, cached sessions, pending operations, and optional Review context. Import queues Review restoration before dependent attempts. The server restores missing instances/observations idempotently and replays scheduling instead of accepting imported due dates. Existing observations remain intact; local record revisions reset so an old server's revisions cannot outrank replay. Failed restoration leaves dependent submissions queued with a visible error.

Current-version restored instances reproduce their question and parameters from template/seed; historical versions retain validated original questions and teaching snapshots. Imported lesson attempts without original teaching context cannot be regraded. The separate analysis ZIP includes Review context in `attempts.json`, schedule/instances/sessions in `review.json`, and activation records in raw records; see [learning evidence exports](learning-evidence.md#export-and-validation).

## Review Library and API

**Review → Review Library**, at `#/review-library/<lesson-slug>`, inspects effective content even for inactive targets. Its route's lesson context does not filter the catalog until selected. The library uses the same Go `reviewTemplates()` and Quick-compatibility rules as planning; React only filters and groups results. It requires the API and does not mutate learner state.

Authenticated endpoints:

| Endpoint                                           | Purpose                                                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/review?budgetMinutes=25`              | Current estimate, targets, and available filters.                                                                                                                                                   |
| `POST /api/v1/review/sessions`                     | Plan scheduled Regular/Quick or focused practice.                                                                                                                                                   |
| `POST /api/v1/review/import`                       | Restore instances/observations and replay scheduling.                                                                                                                                               |
| `GET /api/v1/review/catalog`                       | Effective templates with target, lesson, family, evidence, cost, inputs, provenance, question/answer/choices, variants, and seed-selection metadata. Excludes learner state and teaching snapshots. |
| `GET /api/v1/review/catalog/{id}/preview?seed=...` | Deterministic question/parameters from the same instantiation helper as sessions. A nonempty seed is limited to 256 UTF-8 bytes. Unknown/filtered template IDs return 404.                          |

`lesson-exercise` provenance identifies reused exercises with stable `lesson:<slug>` origin. `review-template` identifies dedicated entries; family is independent of provenance. Current `lessonSlug` drives filters/source links while template and exercise identities retain their stable namespaces. Authored variant counts exclude the representative question.

Combine search and filters to inspect definitions, Quick compatibility, deeper evidence, and variant previews. **Coverage** groups filtered templates by concept × skill × optional objective. Counts describe templates, not every variant/seed combination; one source can contribute to multiple warranted targets. Neutral gaps invite author judgment rather than supplying a score. Coverage does not invent targets absent from the effective catalog, and preview requests create no instances, activations, attempts, or schedule state.

## Authoring

Dedicated fixed/authored definitions live in `content/review-templates.json`; finite parameter banks with complete questions live in `content/review-variants.json`. Reused exercises remain in canonical lesson/exercise content and evidence mappings. SQLite stores learner state, not authored review definitions.

Every declared primary concept/skill target must have a compatible question. The
content build checks coverage after response-format conversions. When converting
an exercise to recognition removes the last compatible question, the build also
compiles an original written exercise into the grading catalog's `reviewQuestion`
field. Written instructions and any review-specific corrections are authored in
`content/written-review.json`; full compiled questions have separate inspected
source hashes in `content/sources.json`. No original question is reconstructed
from multiple-choice answers.

Written representations use the existing exercise citation target and a distinct
template ID ending in `-written`. They retain the original task and grading
context, use regular written-response grading, and share source deduplication with
the adapted exercise. Existing lesson controls, exercise IDs, attempts, and frozen
review instances remain intact. Replaying history restores compatible overdue
work without resetting its due date; a subsequent graded answer supplies evidence
in the usual way. Daily time and deep-question limits still apply to scheduling;
focused practice can select the written work directly.

Start with effective Library coverage and the lesson's teaching targets. Reuse concepts/skills and add an objective only for a stable, independently useful target. A recall choice supplies recognition evidence; give it a separate objective if its companion target requires production. Keep actual construction and proof requirements rather than lowering evidence depth to increase Quick coverage.

Fixed cards suit exact repetition. Authored variants can change retrieval direction or context, with a representative question equal to one of the variants. Give distractors useful explanations and vary correct-answer positions. Use [deterministic assessments](deterministic-contract.md) when bounded correctness represents the entire requested task; retain free-response grading for reasoning that needs it.

Finite banks contain complete JSON questions, grading keys, feedback, and saved integer parameters. Stable array order and colon-separated variant IDs preserve seed lookup. `selection.hashBytes` and `selection.moduli` select entries from SHA-256 seed bytes; optional `choiceRotationByte` rotates presentation order. There are no executable question generators or interpolated authoring templates.

Published `generator` labels and the existing `{{slots}}` summaries remain compatibility metadata in `content/review-templates.json`; the server does not interpolate them. Edit complete bank entries for learner-visible changes and keep summaries consistent. Preserve frozen seed/identity contracts; changes to existing bank questions require an explicit content-version/identity migration, not rewritten compatibility fixtures.

Each definition/bank requires a pinpoint source and inspected digest in `content/sources.json`. Bank digests cover questions, answers, feedback, parameters, and seed metadata. Reinspect changed learning content under [source requirements](content-sources.md), including independent checking of original examples. `npm run content:build` validates and compiles these files without generating canonical sources.

## Validation

Root Review/content tests cover schema, source integrity, and compatibility fixtures. Go tests cover scheduling, budget, deduplication, instance persistence, restoration, library responses, and finite-bank correctness. After `npm run web:build`, run selected browser suites with `npm run test:e2e -- review review-library review-overview review-pause review-session-progress review-submission`. They exercise synthetic state and local APIs; `review` tests an API outage, while production service-worker behavior has its own `offline` suite. See [tooling](tooling.md) for setup and artifact locations.
