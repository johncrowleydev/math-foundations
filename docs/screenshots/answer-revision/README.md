# Review notation and failed-grading answer revision

These screenshots use isolated local browser profiles, synthetic saved attempts,
and intercepted API requests. No learner data or live grading calls are involved.

| Behavior                          | Desktop                                      | Phone                                      |
| --------------------------------- | -------------------------------------------- | ------------------------------------------ |
| Power-set notation accepted       | [Accepted answer](power-set-desktop.png)     | [Accepted answer](power-set-phone.png)     |
| Failed grading offers Edit answer | [Failed attempt](failed-grading-desktop.png) | [Failed attempt](failed-grading-phone.png) |
| Revised draft ready to submit     | [Editor](editing-desktop.png)                | [Editor](editing-phone.png)                |

The power-set browser check loads the canonical review question, rejects notation
for the wrong set, then accepts `$\mathcal{P}(A)$`. The shared curriculum fixtures
also check plain, TeX, and Unicode forms in the TypeScript and Go graders.
New review sessions receive the expanded accepted-answer list; existing sessions
retain their frozen questions and grading definitions. Earlier grades are unchanged.

The revision check covers both an initial grading failure and a failed recheck with
an earlier incorrect grade. Editing restores the submitted answer, survives returning
to the latest attempt and reloading, and submits a new attempt while preserving the
entire original attempt and its grading history. The existing retry-grading check
separately verifies that retrying still uploads the unchanged saved submission.

Run after `npm run web:build`:

```sh
npm run test:e2e -- power-set-review revise-failed-grading retry-grading
```

Browser artifacts are written under `output/e2e/`. The retained desktop and phone
captures above were visually inspected for control visibility and layout.
