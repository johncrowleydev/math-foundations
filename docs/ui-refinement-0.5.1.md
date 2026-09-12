# UI refinement, version 0.5.1

This release makes the reading and answer workspaces more compact and gives their controls a shared visual hierarchy.

## Changes

- Reduced tablet body type, heading sizes, list bullets, figure widths, card padding, and inline handwriting viewport height. Saved ink retains its original coordinates and paper size; expanded paper remains available.
- Removed the global pen palette. Compact pen, eraser, color, and width controls appear only with handwriting components.
- Hidden typing tutorials by default, including collapsed tutorial placeholders. Lesson controls and reference syntax remain available on demand.
- Standardized the padded Type / Pen / Sketch / Photo selector, outlined secondary buttons, and expanded workspace headers with Back and Done.
- Distinguished the answer field from the preview using labels, borders, spacing, and a muted empty preview. The editor has a solid caret and ordinary text pointer, editable TeX, syntax help, and an Expand action.
- Centered sketch controls and paper, with consistent margins and explicit Draw / Move modes.
- Attached camera results immediately after the camera's confirmation. Photos use bounded thumbnails and explicit Enlarge, Rotate, Remove, and Undo controls. Photo mode shows attachments independently of saved ink. A single attachment has no page-number label.
- Refined reference entries, quick definitions, formula explanations, outline navigation, settings, and dialogs with smaller typography and consistent spacing and colors.

## Verification

Local evidence is retained in ignored `output/` artifacts; private camera photographs are not included in source or release assets.

- All 40 content tests and TypeScript checks pass; all 13 release unit tests pass, and release lint reports no errors.
- The combined physical S8 suite passed 43 tests covering scrolling and flicks, input preferences, stylus/palm behavior, saved ink, baseline alignment, quick checks, references, bookmark migration, editor selection and IME composition, undo, and camera/save recovery (`refined-complete-regressions.log`). The physical offline suite passed 19 tests (`refined-s8-offline.log`).
- The UI inspection flow captured reader introductions, outline and chapter navigation, empty and populated answer editors, expanded editors, handwriting, sketch Draw/Move, photo mode, reference views, quick definitions, figures, settings, and syntax help in both tablet orientations (`refined-complete-ui.log`).
- Responsive flows passed at 360dp and 412dp, including landscape and enlarged text. Keyboard captures confirm that the editor and caret remain visible.
- All 51 figures and 139 authored states were captured in both S8 orientations. Every figure's first and final landscape states were visually inspected; representative portrait figures and the surrounding reader flows were inspected. Mathematical data and authored figure states were unchanged. The previous release's complete narrow-screen figure audit remains applicable to the unchanged figure internals.
- A real Samsung camera capture was checked through its confirmation and direct attachment. Shutter timing belongs to the installed camera application and remains outside Foundations' control.

Lesson slugs, exercise identities, bookmarks, quick-check selections, ink files, and independent typed/photo representations are preserved. Photo mode is an additional allowed value in the existing draft schema.

## Native ink compatibility

The new compact sketch flow exposed a native RenderThread crash with Ink 1.0.0 after a longer camera/editor/Draw/Move sequence on Android 14 and stable Android 15 emulators. The isolated gesture passed, but the combined sequence failed reproducibly. Application-level surface experiments did not resolve it and were removed.

Ink is pinned to 1.1.0-alpha08, which contains upstream authoring concurrency and lifecycle fixes. This is a deliberate prerelease dependency to resolve the reproduced crash; no new experimental ink APIs are used. The final Samsung acceptance run passed all 44 tests (`refined-final-acceptance.log`), including pressure-bearing pen input, eraser, rotation, persistence, native math/content, gestures, references, responsive flows, and update checks. The production build, 13 unit tests, and lint passed with this dependency (`refined-upstream-production.log`).

Pressure tests dispatch through the activity with the real Samsung input device and its combined touchscreen/stylus source, retaining the capability metadata used by the newer library. The eraser target is derived from saved stroke coordinates after resizing. Compact reference tests scroll the requested controls into view and account for system rotation.

Upstream release notes: [AndroidX Ink](https://developer.android.com/jetpack/androidx/releases/ink).
