> Historical Android-era implementation notes. See [PWA deployment](pwa-deployment.md) for current authentication and operation.

# Grading and attempts (0.7.0)

Open responses use **Submit** to save a timestamped attempt and request grading. Only the selected Type, Pen, or Photo response is submitted. Photo includes all attached pictures. Recovery drafts stay on their device; submitted attempts and grades sync through the existing notebook connection. The 30 quick checks are unchanged.

The latest attempt appears by default, with older attempts available through **Previous attempts**. Incorrect feedback is hidden until requested. Correct feedback explains acceptance. Pen/photo assessments can include **What the grader read**. **Try again** copies an incorrect response into a new local draft; **Continue draft** recovers an unfinished revision. A correct grade locks further submissions. **Request recheck** reassesses the same immutable response and retains earlier assessments. Overturning the only correct grade unlocks submissions.

Submissions made offline are saved immediately and queued. Network/provider failures do not count as incorrect. Already-correct exercises reject stale offline submissions while preserving the unsent work locally. Existing pre-0.7 answers remain ungraded and are imported into recovery drafts; nothing is automatically submitted for grading. Viewing an official answer remains available and is recorded on later submissions without changing the grade.

## Backend and data

The Go API uses `z-ai/glm-5.3-flash` through OpenRouter, with structured results. The private `OPENROUTER_API_KEY` is stored only in `/etc/math-foundations/server.env`. The server loads `FOUNDATIONS_CATALOG` from its versioned deployment directory. Build the catalog with `npm run content`; deploy `output/grading-catalog.json` with the server binary. The corresponding catalog hash is bundled in Android. Attempt context is captured on submission so later curriculum edits do not change the question being rechecked.

New SQLite tables are `attempts` and `grading_jobs`. Attempts retain response data, teaching context, status, authoritative verdict, and all assessments. Each assessment records feedback, issue location, meaningful improvement suggestions, optional transcription, model, timestamp, prompt version, recheck explanation, and usage/cost metadata. A single persistent worker processes jobs, recovers interrupted work after restart, and makes at most three tries for transient failures before exposing manual retry. Weekly backups include the new tables. Media remains immutable and privately stored on the VPS volume.

Authenticated endpoints:

- `POST /api/v1/attempts`: immutable submission with client UUID, exercise key, submission timestamp, catalog version, selected mode, text or ink snapshot, image hashes, original-photo hashes/rotations, and answer-reveal flag. Replaying the same ID and content is idempotent. Mismatched catalog, completion locks, and another pending attempt return 409.
- `GET /api/v1/attempts/{id}`: submitted response and assessment history/status.
- `POST /api/v1/attempts/{id}/recheck`: unique operation ID and explanation. Failed initial grading can be retried with an empty explanation; a graded result requires an explanation.
- Existing `/changes` supplies server-owned `attempt/<UUID>` records. Clients cannot write grades through `/mutations`.

Media uploads precede server acceptance. The app keeps full-resolution original photos and original ink alongside optimized, correctly oriented grading images. Long ink is split into ordered images covering all written content. The submission outbox is separate from `draft-answers` and `draft-ink`; unsubmitted work cannot be found by the legacy answer-sync scanner.

## Verification

Go tests cover immutable/idempotent submissions, concurrent requests, completion locks, rechecks, invalid or unreadable model results, retry exhaustion, worker restart recovery, and backup restoration. Android/Go integration tests exercise two isolated clients, local-only drafts, submitted-attempt and grade synchronization, and stale offline rejection. Set `CLOUD_TEST_SERVER` to the compiled test API and `CLOUD_TEST_CATALOG` to the generated catalog when running Android JVM tests.

Android instrumentation covers offline submissions, hidden feedback, copied retries, history, correct locks, rotation, long pen capture, photo orientation and original-image preservation, and reopening queued attempts. Use the validation application ID for these synthetic fixtures.

Live model tests are opt-in through `FOUNDATIONS_LIVE_TEST_KEY`. They use synthetic responses and a temporary notebook, never existing personal attempts. Coverage includes justified and unjustified proofs, correct and incorrect classifications, a numerical image response, and instructions embedded in a response that try to override grading. `FOUNDATIONS_GRADING_URL` is available for an isolated mock provider; production leaves it unset and uses OpenRouter.
