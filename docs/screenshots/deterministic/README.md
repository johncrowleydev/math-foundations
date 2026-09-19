# Deterministic answer controls

These screenshots use the compiled curriculum, the production PWA, and an isolated local Go server. All answers and scratchwork shown here are synthetic test data. No existing learner account or database is used.

Run after `npm run web:build`:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-deterministic-ui.mjs
```

The script creates and removes its temporary server database. `CHROME_BIN` can select an existing Chrome installation. Browser checks run at 320px and 390px phone widths and 1440px desktop width.

| Screenshot                                                              | Coverage                                                                                                               |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `truth-table-desktop.png`, `truth-table-320.png`, `truth-table-390.png` | Supplied input columns; unanswered cells; tap toggles; keyboard entry and clear; contained table scrolling             |
| `matrix-grid-desktop.png`                                               | Compact scalar fields and a natural matrix grid; malformed values stay editable without recording an attempt           |
| `interval-phone.png`                                                    | Typed endpoints, infinity, and endpoint inclusion buttons at 320px                                                     |
| `spanning-tree-phone.png`, `graph-route-phone.png`                      | Selection on a supplied graph and ordinary typed paths; a different valid tree and reversed Euler trail both pass      |
| `recurrence-desktop.png`                                                | Ordinary typed formulas and recurrence notation, with optional existing syntax help and math preview                   |
| `finite-set-phone.png`, `truth-and-value-phone.png`                     | Unordered finite sets, a single truth toggle, and a numeric witness                                                    |
| `basis-desktop.png`, `typed-formula-and-reason-phone.png`               | Typed nonunique constructions, exact symbolic expressions, and a selected short reason within one deterministic answer |
| `incorrect-feedback-phone.png`                                          | Incorrect feedback appears only after explicitly requesting it                                                         |
| `offline-scratchwork-phone.png`                                         | Offline grading and reload; optional local typed, pen, and photo scratchwork is retained                               |
| `attempt-history-phone.png`                                             | Read-only submitted values with the original question snapshot                                                         |
| `review-library-phone.png`                                              | Read-only authored review-template input preview                                                                       |

The integrated check submits 14 attempts and verifies the returned server grades and question snapshots. It also checks no recheck, transcription, model, or media-upload request is made; `Unsure` and prior-feedback assistance survive submission; and exporting/importing local work restores structured answers and all scratchwork formats. Separate browser fixtures cover atomic matrix paste and wider truth-table scrolling. The web unit suite covers changed-question draft recovery and older open-answer transcription preservation.

The compact math fields reuse the existing editor. They remove repeated large prose-editing panels, retain keyboard undo and syntax help, and show a preview when math delimiters are used. Proof answers and optional scratchwork retain the full editor.

Import notifications refresh an already-open, untouched exercise immediately, including its scratch media. Existing local drafts still retain priority when an import conflicts.

Structured controls emit only changed fields, which the exercise merges into its latest draft. The browser check includes multiple edits in one event loop to guard against stale renders erasing earlier answers.
