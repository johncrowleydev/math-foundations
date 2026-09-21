# Historical catalog retry, through the real Go server

These desktop (1440 × 1000) and phone (390 × 844) screenshots use synthetic saved
work, a temporary local database, the production web build, and the real Go
authentication/submission/grading routes. Only the grading provider is replaced
by a loopback fixture. No learner answers or production account data are present.

| View    | Before retry                                       | After recovery                                    |
| ------- | -------------------------------------------------- | ------------------------------------------------- |
| Desktop | [Unavailable original version](desktop-before.png) | [Original-context grading](desktop-recovered.png) |
| Phone   | [Unavailable original version](phone-before.png)   | [Original-context grading](phone-recovered.png)   |

The server's current question and answer deliberately differ from the saved
version. The test first confirms HTTP 409 with no retained original catalog,
then adds the original trusted catalog and clicks **Retry grading**. It asserts
HTTP 201, unchanged submission fields, the complete original context sent to the
loopback provider, and the original question/answer returned to the client.
Repeating the upload returns the existing attempt with exactly one grade.

The test reproduced HTTP 409 on the previous server implementation and passes
with historical-catalog lookup enabled. Both resulting interfaces were visually
checked. The fixture's “correct” verdict tests delivery and display, not the
mathematical quality of a real learner's answer.

Run `scripts/check-stale-submission-ui.mjs` after the production web build, as
documented in [the recovery report](../../stale-submission-recovery.md).
