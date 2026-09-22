# Learning evidence

The Progress views describe observed attempts, corrections, assistance, and concept/skill coverage. They do not assign mastery probabilities or infer understanding from reading. The [Review system](review-system.md) separately derives scheduling state from active evidence; [grading](grading.md) defines assessment policy and history.

## Taxonomy and snapshots

`content/learning-evidence.yaml` and lesson mappings in `content/evidence/` are canonical authored sources. Every published exercise has explicit ID-based annotations grounded in its actual prompt and response format. Concepts and skills have primary/supporting roles; tasks may have several primary relationships without numerical weights. Sections are optional teaching/exposure anchors, not analytical categories.

`tools/content/evidence.ts` validates IDs, parent links/cycles, roles, duplicate references, representations, attributes, teaching targets, and complete exercise coverage. Skills accept a primary string shorthand or an explicit object such as `{ skill: justify, role: supporting }`; each task requires a primary skill. Response format is derived, and explicit logical operators in displayed math are counted literally rather than treated as a difficulty estimate. Attributes remain scalar metadata.

The compiled `learning-evidence.json` ships offline and contributes to the grading catalog version. Accepted attempts snapshot concept/skill/representation definitions, roles, attributes, version, and provenance from the trusted server catalog. Per-attempt names remain interpretable if the current taxonomy changes; client-supplied analytical snapshots are not authoritative.

## Effort, uncertainty, and assistance

Submissions may carry `startedAt`, `activeDurationMs`, `unsure`, and assistance flags. `web/src/effort.ts` estimates interaction-to-interaction time, counting at most 30 seconds of silence between events and pausing on blur/visibility loss. Only the accumulated duration and first interaction time are stored. Reload retains accumulated time without adding the closed-page interval; retry starts a new interval. This estimate undercounts silent thought and does not establish attention.

Submitted effort metadata must use integral timestamps/durations, a positive start no later than submission, and duration no greater than elapsed time with a start present. Legacy attempts without effort remain valid; drafts have separate validation because they lack submission timestamps. A narrow recovery path repairs overflowing effort metadata only on locally saved submissions explicitly rejected for that error and never accepted by the server. It preserves the original rejected payload, response, identity, timestamps, and assistance, then requeues the corrected upload.

**Unsure** is optional: unchecked means not reported, not confident. A nullable boolean also preserves explicit false values from compatible clients. It never blocks submission or changes the grade.

Assistance records distinguish three facts:

- `answerPreviouslyRevealed` remains true after the official answer is closed.
- `priorIncorrectFeedbackSeen` records deliberate reveals, including older assessments.
- `copiedFromRetry` records copying into this draft; it does not by itself prove mathematical assistance.

Answer/feedback facts sync as bounded `assistance/<exercise>` records and merge with boolean OR inside the server mutation transaction, including concurrent/stale writes and resolutions. Copying stays specific to the draft/attempt. Missing historical fields remain unknown.

## Exposure

Concept exposure uses the reader's 1.5-second section visibility/bookmark callback, exercise interactions, and deliberate incorrect-feedback reveals. It records the first encounter per concept/source/device, with `sourceId` identifying a section, exercise, or attempt. The UI uses the earliest timestamp per concept/source across devices. A transaction-initialized device ID keeps concurrent tabs consistent.

These are exposure proxies, not proof of understanding. Historical encounters are not reconstructed. Records use the ordinary offline mutation queue, conflicts, authentication, and exports. Passive exposure does not activate or schedule Review.

## Exact analytical definitions

- **Effective assessment:** the latest assessment of an immutable submission. With old data lacking assessment history, use its stored verdict. A recheck is not a new submission.
- **Gradable attempt:** effective verdict correct or incorrect. not_graded and initial technical failures do not enter mathematical-success/error denominators.
- **Exercises observed:** distinct exercise keys with at least one gradable attempt.
- **First gradable attempt correct:** among observed exercises, the earliest submitted gradable attempt is correct under its latest assessment. Ties use attempt ID. Thus a reversed initial rejection changes first-try evidence without erasing grade history. This measures the response, not original grader agreement.
- **Exercises completed:** distinct exercise keys with a currently correct attempt. This can differ from a never-rechecked historical correct verdict.
- **Exercises with a correction:** distinct exercise keys with any effectively incorrect attempt, whether eventually completed or still needing correction.
- **Retries:** sum of additional gradable submissions beyond the first per exercise. Technical/ungraded attempts and rechecks are excluded. Total submissions includes them.
- **Substantive-error attempts:** unique incorrect attempts whose latest diagnosis includes substantive severity, excluding prompt-compliance, technical and clerical classes from this conceptual/procedural trouble signal.
- **Minor/clerical:** unique incorrect attempts with a minor diagnosis or clerical class. An attempt can have separate substantive and minor issues, so these buckets need not sum to total errors.
- **Unknown diagnosis:** incorrect attempts lacking structured diagnosis; absence is not interpreted as absence of an error.
- **Concept evidence:** the above metrics over primary relationships only. Explicit diagnostic concept IDs restrict attribution; unattributed diagnoses remain exercise-level evidence shared among primary concepts. Supporting relationships are separate. Parent concepts are not automatically rolled up.
- **Skill coverage:** distinct observed exercises for each primary concept × primary skill combination. Representation counts use the same observed-exercise rule. Multi-representation tasks appear in each applicable bucket; buckets are not additive. Absent evidence is not called weakness.
- **Missing first-attempt metadata:** concept/skill/representation first-try rates include an exercise only when its actual earliest gradable submission belongs to that mapped bucket. A later mapped retry cannot become a first-try success merely because earlier metadata is missing. Thus first-try denominators may be smaller than exercises observed.
- **Last response:** latest submission timestamp, not a background synchronization timestamp.
- **Needs attention:** catalog-order listing of concepts with at least two substantive-error attempts, at least two first-gradable misses within one primary skill, or recorded assisted correct responses on at least two exercises. These are transparent flags, not scores or rankings. No inference that assistance proves misunderstanding.
- **Error breakdown:** latest diagnoses from effectively incorrect attempts, grouped separately by broad class and tag, deduplicated by attempt within each bucket. Every aggregate can be traced to submissions and all original assessments.

## Historical evidence

On startup, `server/evidence_backfill.go` adds missing metadata only to historical contexts whose task wording and response format match, ignoring whitespace and reference-link formatting. It preserves original context text, responses, grades, IDs, timestamps, and content versions, then emits a revision to sync the labeled snapshot. Rechecks continue to use the original task.

Changed tasks and response formats are skipped. Those attempts remain in overall counts and history but are excluded from concept metrics without a compatible historical annotation. The UI reports snapshot coverage; it does not project today's changed task onto old responses or fabricate timing, uncertainty, assistance, or diagnoses.

## Export and validation

Settings local-work JSON version 2 preserves attempts, drafts, queued operations, exposure/assistance, evidence context, and optional Review state. Version 1 remains accepted. Imports validate additional fields before writing and preserve recoverable conflicts. Exported catalogs supply explanatory context, never executable/authoritative curriculum; per-attempt snapshots take precedence.

`scripts/export-learning-data.py` creates a separate read-only analysis ZIP from the server database, release, and media. Version 2 includes assessments, original contexts, metadata, CSV tables, transcriptions, remaining media, review records, and a checksum manifest. It omits authentication/session data and credentials and refuses to overwrite an existing archive. This server export is not a browser-import file; use Settings export for device-only work. See [tooling](tooling.md) for invocation.

Root content tests validate taxonomy and coverage; web tests validate aggregation, imports, assistance, and effort; Go tests validate evidence schemas, backfill, and persistence. `npm run test:e2e -- evidence review-submission` exercises Progress and submission metadata with synthetic local data after a web build. Python export tests run in `npm run test:utilities`. These checks validate data handling and prompt policies, not guaranteed model compliance on arbitrary responses.
