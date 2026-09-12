# Reading-first interface, 0.5.2

The 0.5.1 interface gave answer controls too much visual weight. This pass removes redundant controls and oversized containers throughout the app, rather than applying a size adjustment only to the reported exercise.

## Interaction and layout changes

- Exercise cards begin with the problem, without a colored header strip. A 140dp inline handwriting viewport and a single unobtrusive control row replace the large mode selector and permanent pen palette. Existing paper coordinates and saved ink are unchanged; the viewport initially locates existing writing.
- The answer mode is a small Type / Pen / Photo menu. Pen settings open on demand; undo, redo, eraser, clear, and expansion stay local to the answer.
- Finger drawing uses the expanded handwriting workspace. Its options menu enables finger drawing; otherwise fingers scroll the paper normally. The separate Sketch workspace and ambiguous Draw / Move switch have been removed.
- Practice uses one centered problem-and-answer column instead of a mostly empty full-height prompt panel. Previous/next navigation has no filled primary button or motivational filler.
- Typing uses a distinct answer field and muted preview, quiet insertion/help controls, and familiar undo/redo icons. Expanded typing and handwriting show the problem and use matching Back/Done headers and margins.
- The expanded typing window keeps its header stationary when the software keyboard opens and scrolls the current line above the keyboard. Its insertion toolbar scrolls horizontally in short windows instead of wrapping isolated controls onto another row.
- Insert symbol opens a searchable list of rendered symbols, their commands, and explanations. Selecting a symbol inserts only its command at the caret. Authored examples remain available through help and copy actions.
- Navigation, outline, reference browsing, quick checks, figures, popovers, settings, updates, and photo attachments share compact typography and secondary controls. Reference popovers keep their full-explanation and close actions visible. Related entries and figure controls no longer each occupy unnecessary separate rows.
- Settings rows align labels with controls and make the entire row tappable. The lesson scroll-mode label remains visible and supports the persisted long-press toggle. Other surfaces retain ordinary scrolling.
- Typing tutorials remain hidden by default. Photos still attach directly after camera confirmation, independently of ink and text. No saved answers, canonical ink coordinates, lesson identities, bookmarks, or quick-check choices are converted or deleted.

## Acceptance record

Evidence is stored in ignored output files, not committed screenshots or private answer files. The curriculum and mathematical figure data are unchanged.

- Content: all 40 content tests pass, including prerequisite and reference validation.
- Build: debug compilation, 13 unit tests, and lint pass.
- Interaction: symbol insertion, camera confirmation/cancellation, typing and IME, undo, pen/eraser, finger drawing, rotation, and recovery checks passed on the Android 15 emulator at tablet dimensions. Reference test selectors were updated for the fixed popover action row.
- The final tablet run passed all 18 workspace, flexible-input, and recovery tests after the keyboard changes. Earlier regression runs also passed continuous scrolling, flinging, math baseline, stable anchors, quick checks, reference navigation, and native content rendering.
- Visual inspection covered the tablet workspace, reference, settings, photo, and update states in both orientations, and all 51 figures in tablet and 360dp layouts. The isolated figure gallery uses the default Material theme; app-level captures separately validate the actual interface theme. The power-set figure now sizes itself to its single row, and the board-splitting legend has sufficient separation from its caption.
- The 360dp, 412dp, and 600dp reading/reference/expanded-editor flows passed in both orientations, including a 360dp run with 1.3x system text. The final keyboard-window styling was inspected in portrait and landscape: the header and current answer line remain available.
- The complete workspace navigation run also passed at 412dp in both orientations, including symbol/help dialogs, pen options, photo enlargement/removal, settings, and references. The test explicitly scrolls practice controls into view before tapping them in short windows.
- A signed 0.5.2 candidate (version code 11) was prepared and its certificate verified against the existing installation certificate. This is a local candidate, not a published OTA.
- Physical Samsung acceptance and OTA publication remain pending; the tablet is currently disconnected from USB.
