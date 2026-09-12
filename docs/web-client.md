# Foundations web client

A local React/TypeScript PWA sharing the Android client's authored curriculum and existing Go API. Nothing is deployed by these commands. The Android app and production server are unchanged.

## Run locally

From `C:\Projects\math-foundations`:

```powershell
npm ci
npm run content
npm ci --prefix web
npm run web:build
npm run web:preview
```

Open **http://127.0.0.1:4173**. This is the production-style build, with installation and offline caching enabled. Keep the terminal running for online API requests. After the first successful load, the app can reopen offline.

For development with hot reload, run `npm run web` and open **http://127.0.0.1:5173**. Service-worker caching is intentionally limited to the production-style preview. The two ports are separate browser origins with separate local drafts and settings.

The Vite development/preview proxy forwards `/api` to `https://foundations.johncrowley.dev`, avoiding a production CORS/auth change. Enter the existing notebook API key in Settings when you want real sync/grading. The client never reads a key from the developer's machine, bundles one, or connects automatically on a new browser. Keys default to session storage; **Remember on this browser** explicitly opts into persistent browser storage. Do not enter the OpenRouter provider key here.

Use `FOUNDATIONS_API_TARGET` when starting Vite to point the proxy at an isolated test API. The target is server-side configuration; there is no browser-controlled arbitrary proxy. No deployment, DNS, server, or authentication changes have been made.

To test on a physical phone over a LAN, use a trusted local HTTPS endpoint. Plain HTTP on a non-localhost IP does not provide the secure browser context required for PWA installation and cryptographic media hashing. Responsive layouts can also be tested using browser device emulation. Public hosting and the eventual authentication design are deferred.

## Included

- All 15 lessons, 1,313 open exercises, 30 quick checks, existing placements, answers, terminology, and TeX teaching blocks.
- Native-inspired responsive layout, chapter navigation, persistent reader outline/scrollspy on wide windows, compact chapter/outline sheets, focused practice, section bookmarks, and explicit resume from synced positions.
- Markdown and KaTeX, contextual term popovers, formula readings and symbol bindings, searchable Terms/Notation library, related entries, teaching links, and copyable TeX.
- All 39 authored figures and their interactive steps, SVG math labels, captions, construction notes, reset, and expansion. Adjacency tables remain HTML tables so they stay readable on phones.
- CodeMirror answer editing with prose/math syntax distinctions, completion, brace matching, diagnostics, undo/redo, selection, delimiter insertion, searchable syntax help, live preview, and expanded editing. Syntax diagnostics do not grade mathematical correctness.
- Pressure-aware browser pen/sketch canvas with color, widths, erasing, undo/redo, drawing/panning modes; photos via upload or the device camera chooser, multiple ordered attachments, rotation, removal/undo, and enlargement.
- Native Android stroke serialization compatibility for importing saved ink and submitting reusable pen attempts. Coordinates and pressure are preserved; browser brush rendering and prediction are intentionally not pixel-identical to Android. The adapter follows Google's public [stroke input schema](https://github.com/google/ink/blob/main/ink/storage/proto/stroke_input_batch.proto) and [numeric-run schema](https://github.com/google/ink/blob/main/ink/storage/proto/coded_numeric_run.proto).
- Local recovery drafts; immutable timestamped submissions; offline upload queue; binary grading, animated pending status, optional incorrect feedback, previous attempts/assessments, clarification-aware rechecks, and correct-answer submission locks.
- Existing API synchronization of submitted attempts/media, quick checks, preferences, practice position, and bookmarks. Legacy synced answers remain accessible through **Previously synced work**. New drafts stay local, matching the current Android policy.
- Installable app shell, locally bundled curriculum/fonts, offline downloaded work, update notification, and local-work export. Browser storage errors are surfaced rather than silently reporting a successful save.

## Deliberate browser differences

This is a functional client port, not an Android emulation layer. Browser camera capture uses the platform file/camera chooser. Pen input uses Pointer Events and a browser renderer. Mouse wheels, trackpads and nested panels use normal browser scrolling; the optional two-finger setting applies to touch scrolling in the outer teaching reader. The regular-scroll default suits typing devices.

Browsers do not guarantee Android-style periodic background jobs when the app is closed. Sync runs while open, on reconnect, and on returning to the app; offline submissions remain queued until that happens. API calls and credentials are not cached by the service worker. Only use the installable preview build when testing offline reload, and remember that clearing site data removes unsynced drafts. Export local work before deliberately clearing it.

Auth remains the existing personal API-key arrangement for this local evaluation. There is no new login flow, public deployment, or provider key in the web bundle.

## Checks

```powershell
npm run web:test
npm run web:build
```

Node tests cover escaped/incomplete math syntax, unsupported commands, native pen-format round trips, draft/submission separation, monotonic received revisions, and full content/figure coverage. Browser checks exercised:

- Typed draft recovery after reload and the compact editor/settings layout.
- Two isolated browser clients against a simulated API: submit, hidden incorrect feedback, incoming attempts, recheck explanation, and cross-client correct locks. No personal notebook was changed by these tests.
- All 39 figures / 97 authored states, plus desktop and 360px layouts.
- Symbol insertion without solved examples, reference navigation, pen capture, photo rotation/removal/undo/submission, and landscape phones.
- Production PWA offline reload, cached assets, and queued-attempt recovery.

The signed Android release is untouched. Local browser artifacts and screenshots are under the ignored `output/` directory.
