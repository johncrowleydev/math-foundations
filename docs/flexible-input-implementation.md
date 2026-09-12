# Flexible input implementation and acceptance

The flexible input, TeX teaching, and responsive layout implementation is complete for 0.5.0. Publication uses the signed APK and manifest produced by `scripts/package-release.mjs` after the acceptance gates below.

- Lesson-only two-finger scrolling has a persisted long-press/accessibility toggle and an Input settings equivalent. Other surfaces use ordinary scrolling.
- Per-exercise typed drafts use syntax-highlighted TeX, command completion, insertion templates, diagnostics, native live preview, and a focused editor. Text, handwriting, and ordered private photos remain independent.
- Pen detection and overrides preserve explicit preferences. Finger sketches have separate Draw/Move modes. Saved handwriting remains accessible when pen tools are hidden.
- TeX instruction and reference syntax cover all 15 lessons, 1,313 exercises, and 30 quick checks. All 56 teaching placements and 385 reference syntax records were inspected and fingerprinted. The strict prerequisite/order gate rejects incomplete or stale audits.
- Phone and compact-height layouts use one column and full-width overlays. The established S8 portrait and landscape layouts retain their reading and writing proportions.

Acceptance evidence (September 11, 2026):

- All 40 content tests and TypeScript checks pass. Native syntax examples, teaching examples, reference examples, lesson mathematics, and figures render successfully. Release unit tests and Android lint are required by packaging/CI alongside the content checks.
- The final combined physical S8 Ultra suite passes all 43 tests (`output/s8-release-acceptance.log`): continuous scrolling and flicks, one/two-finger toggling without position loss, stylus and palm handling, ink persistence, math baseline, quick checks, references, bookmark migration, editor selection/IME composition/undo, atomic-save failure/retry, and camera attachment operations.
- Nineteen input, recovery, and teaching tests pass with emulator Wi-Fi and cellular data disabled (`output/offline-final-suite.log`). Networking was restored afterward.
- The actual Samsung camera returned a valid preview after background process reclamation. Its attachment and typed text survived a full app restart. Contract tests cover cancellation, retake, rotation, multiple attachments, enlargement, removal/undo, unavailable cameras, and unreadable images.
- All 139 authored figure states were captured in portrait and landscape on the S8 and at 360dp/412dp phone widths. Every figure was visually inspected at both narrow widths and both orientations; first/final tablet states were inspected as well. Narrow corrections include graph scaling, minimum label sizes, wrapping reasoning panels, separated table headings, and readable board labels. Wide expressions and expanded figures retain ordinary panning.
- Complete reader/reference/practice/editor flows pass in both orientations at 360dp, 412dp, 720dp, and 960dp, with an additional enlarged-text run. Software keyboard screenshots confirm visible text/carets, including landscape. Selection, clipboard, large answers, incomplete/unsupported TeX, matching braces, completion, and undo/redo are covered by native editor tests.
- The app was resized to an actual 450dp Android multi-window task and inspected: compact navigation, prose, figures, and scroll controls fit the window. Emulator dimensions, font scale, networking, and full-screen mode were restored after testing.

Saved work retains existing lesson slugs, exercise IDs, ink coordinates, and handwriting filenames. Typed/photo saves are versioned and atomic. Previous reading order is bundled for stable-anchor migration. Audit fingerprints are updated only after reinspection. Test captures and private camera images remain excluded from source and release artifacts.

To use the new features, choose **Type** on an exercise or use **Input** to change defaults. **Insert math** adds editable delimiters; **Syntax help** and the lesson's **Typing this math** blocks teach the supported syntax. Long-press the scrolling label to switch the lesson reader's gesture mode.

Version 0.5.1 refines these workspaces and hides typing tutorials by default; see [UI refinement](ui-refinement-0.5.1.md).
