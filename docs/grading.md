# Grading and attempts

**Submit** saves a timestamped response and requests grading. Choice and structured responses receive an immediate local deterministic result, including offline; the server independently validates them against trusted catalog data. Free responses submit only the selected Type, Pen, or Photo mode, with all attached photos included. Drafts stay local; submitted attempts and assessments synchronize.

The latest attempt appears by default, with older responses and assessments available in history. Incorrect feedback stays hidden until requested. **Try again** copies a response into a new draft; **Continue draft** resumes an unfinished revision. A correct assessment locks further submissions. Reversing the only correct assessment unlocks the exercise. Revealing an official answer records assistance without changing correctness; see [learning evidence](learning-evidence.md).

## Retry, recheck, and cancellation

Network/provider failures and `not_graded` results do not count as mathematical errors. Offline submissions remain in the outbox. A stale upload rejected because the exercise is already correct stays recoverable locally.

**Retry grading** resubmits a saved response when it has not reached the server, using the same ID and payload. For an accepted free-response attempt, retry queues a new grading operation. **Request recheck** reassesses the same immutable response and retains earlier assessments; an existing verdict requires a clarification. Clarification is context for reconsideration, not additional submitted work. Choice and structured attempts cannot create model jobs through retry, recheck, or restore.

Pending/running model assessments have an operation ID. Cancellation targets that exact operation, persists through sync, aborts its active HTTP request, and discards late results. Cancelling a first assessment creates no mathematical verdict; cancelling a recheck retains previous assessments. The saved response can be retried or copied into a new submission. Cancellation requires connectivity and cannot reverse provider work already performed.

## Trusted context and catalog updates

`npm run content:build` compiles `output/grading-catalog.json`. The client bundles its content version; the server loads the matching catalog through `FOUNDATIONS_CATALOG`. A submitted attempt freezes the original question, answer, teaching context, grading definition, and evidence snapshot for future history and rechecks. The server never accepts client-supplied grading definitions.

An older regular submission resolves against the trusted archived catalog for its original content version and exercise identity, including questions changed or removed from today's curriculum. The response, timestamps, effort, assistance, version, and ID remain unchanged. Unknown versions or missing original exercises return a conflict; a corrupt or unreadable archive returns a retryable failure. Review submissions instead use their frozen server-issued instance. See [deployment and catalog retention](pwa-deployment.md) and [Review](review-system.md).

## Model assessment

`server/grading.go` uses `z-ai/glm-5.3-flash` through OpenRouter with prompt version `foundations-grading-5`. `OPENROUTER_API_KEY` stays on the backend. A catalog alone enables deterministic grading; free responses additionally require provider configuration.

The grading policy extracts requirements from the actual prompt and instructions, accepts valid alternative derivations, and requires explanation only when the task asks for it. Reference solutions and metadata cannot add requirements. False intermediate reasoning cannot be rescued by a correct final answer when reasoning is requested. Material ambiguity or unreadable work produces `not_graded`. Rechecks independently assess the original response without treating earlier verdicts as evidence.

Structured results contain the verdict, feedback, issue/improvement text, optional transcription, requirement satisfaction, error diagnoses, grading-decision confidence, and a reason when not graded. Correct results have no error diagnoses. Diagnostic concept/skill IDs must belong to the supplied evidence snapshot. Provider responses must pass schema and semantic validation; older stored assessments may lack these optional historical fields.

SQLite stores submissions/context and assessment history in `attempts`, persistent operations in `grading_jobs`, and retained image transcriptions in `attempt_transcriptions`. Each assessment includes model, prompt version, timestamp, clarification, and usage/cost metadata. One persistent worker recovers interrupted jobs after restart and makes at most three tries for transient failures before exposing manual retry. Weekly backups include this data.

## Photo and handwriting retention

Media uploads precede server acceptance. While queued or awaiting a usable grade, submissions retain original photos/ink and their optimized grading images; long ink is split into ordered images covering the written content.

After a correct or incorrect assessment supplies a nonempty transcription, the server saves the first usable transcription separately, keeps the original response mode, and removes the attempt's image/photo/ink payload. Sync displays **Transcribed from photo** or **Transcribed from handwriting**. Rechecks use that immutable transcription and state explicitly that the original images are unavailable. Trying again can start a typed draft without changing the original attempt's provenance.

An unreadable, failed, or `not_graded` assessment does not authorize source removal. Once transcription is committed, unreferenced source files are retired; media still referenced by other work is retained. Source hashes preserve submission retry idempotency. Startup applies the same policy to older successful image attempts using their recorded transcriptions, without new model calls or verdict changes.

Clients remove obsolete blobs and inactive submitted draft media when no other local work references them. Offline devices receive the change on their next sync. Existing backups and user exports are not rewritten; retention is not secure erasure of those copies.

## API and validation

All endpoints require the authenticated session described in [deployment](pwa-deployment.md):

| Endpoint                             | Behavior                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/attempts`              | Submit an immutable response. Repeating an ID with identical content is idempotent; ID reuse, unavailable context, correct locks, or another pending attempt can return 409. |
| `GET /api/v1/attempts/{id}`          | Read response, presentation, status, active operation, and assessment history.                                                                                               |
| `POST /api/v1/attempts/{id}/recheck` | Queue an operation with unique `id` and `reason`. A verdict requires a nonempty reason.                                                                                      |
| `POST /api/v1/attempts/{id}/cancel`  | Cancel the exact active `job`.                                                                                                                                               |
| `GET /api/v1/changes`                | Synchronize server-owned `attempt/<UUID>` records; ordinary mutations cannot write grades.                                                                                   |

Go tests cover persistence, retries, cancellation, catalog recovery, image retention, and provider boundaries. Browser checks include `retry-grading`, `stale-submission`, `revise-failed-grading`, `review-submission`, and `deterministic`; run them through `npm run test:e2e -- <name>` after a web build. See [tooling](tooling.md) for setup. Live provider tests are opt-in through `FOUNDATIONS_LIVE_TEST_KEY`; ordinary tests use synthetic responses. `FOUNDATIONS_GRADING_URL` supports a local mock provider.
