# Sustainable learning interface

Captured in Chromium at 1440 × 1000 (desktop) and 390 × 844 (phone).
Each image was visually inspected for readable prose and mathematics, reachable
controls, wrapping, and horizontal overflow.

| State                                            | Desktop                                | Phone                                    |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------- |
| Review target, estimated minutes and planned mix | [Review](review-desktop.png)           | [Review](review-mobile.png)              |
| Recommended practice and optional bank           | [Practice](practice-desktop.png)       | [Practice](practice-mobile.png)          |
| Saved review session and resume                  | [Paused](paused-desktop.png)           | [Paused, API offline](paused-mobile.png) |
| Power-set explanation and notation               | [Lesson](sets-power-set-desktop.png)   | [Lesson](sets-power-set-mobile.png)      |
| Worked power-set inclusion proof                 | [Worked proof](sets-proof-desktop.png) | [Worked proof](sets-proof-mobile.png)    |

[Adaptive practice](adaptive-practice.png) shows a reversible suggestion after
two distinct quick correct first attempts on the same routine skill. The phone
practice image also shows this suggestion. Desktop practice starts at a quick
check in the recommended sequence; phone practice uses an existing optional
exercise URL to check that historical links remain usable.

The lesson and practice content comes from the actual authored curriculum.
Review summaries, authentication, and attempts are synthetic fixtures; these
screenshots contain no learner data. The mobile review image uses a saved
15-minute preference, while desktop shows the 25-minute default. The illustrated
mix is a UI fixture, not a measured server workload. Server selection, reservation,
deduplication and deep-work caps have separate Go tests.

Reproduce with:

```sh
npm run test:e2e -- learning-efficiency review-pause
```

The checks exercise budget persistence, recommended/optional navigation,
skip/restore, and pause → offline reload → resume at the same question and draft.
Explicitly ending a session preserves its saved work. Existing browser checks also
cover review submission, deferred/covered items, review-library navigation,
offline attempts and handwriting assets, source disclosure, and MDX rendering.

The offline pause check interrupts API traffic while keeping the local app
available; it does not simulate a fresh install without cached application assets.
The production PWA build is validated separately.
