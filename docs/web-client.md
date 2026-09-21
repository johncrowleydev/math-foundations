# Foundations web client

The primary React/TypeScript PWA, with shared authored curriculum and the Go synchronization and grading API. Production is https://foundations.johncrowley.dev; local commands below do not deploy.

## Run locally

From the repository root, using a POSIX shell:

```sh
npm ci
npm ci --prefix web --no-install-links
npm run web:build
FOUNDATIONS_API_TARGET=http://127.0.0.1:18084 npm run web:preview
```

`--no-install-links` matches the parent-package symlink in the web lockfile, including with npm 9. The build generates the shared curriculum and copies it into `web/public` before bundling.

Open **http://localhost:4173**. This is the production-style build, with installation and offline caching enabled. Authenticated use requires the backend described below. Keep the terminal running for online API requests. After a successful online login and the app's assets have been cached, the app can reopen offline while the remembered session remains valid.

For development with hot reload, run `npm run content:build`, then `FOUNDATIONS_API_TARGET=http://127.0.0.1:18084 npm run web` and open **http://localhost:5173**. Service-worker caching is intentionally limited to the production-style preview. The two ports are separate browser origins with separate local drafts and settings.

The client uses email/password login and a Secure, HttpOnly session cookie. Legacy notebook API keys are no longer accepted, and there is no API-key setup in Settings. Provider keys remain server-only. Sessions last 30 days; reconnect validates the session before syncing. See [PWA deployment and authentication](pwa-deployment.md) for session and sign-out behavior.

The Vite development/preview proxy forwards `/api` to `FOUNDATIONS_API_TARGET`. If unset, it targets `https://foundations.johncrowley.dev`; signing in through that proxy accesses the real notebook. For that production target only, the proxy translates requests from its own frontend origin to the production origin. The target is server-side configuration; there is no browser-controlled arbitrary proxy.

To test on a physical phone over a LAN, use a trusted local HTTPS endpoint and configure the backend origin accordingly. Plain HTTP on a non-localhost IP does not provide the secure browser context required for PWA installation and cryptographic media hashing. Responsive layouts can also be tested using browser device emulation.

### Local API

Run the Go API from `server/` with `go run .` after configuring these environment variables for a separate local account:

- `FOUNDATIONS_EMAIL` and `FOUNDATIONS_PASSWORD_HASH`: the local account email and Argon2id hash. The `go run . hash-password` command accepts the exact password on stdin and outputs its hash; do not put passwords in command arguments or commit credentials.
- `FOUNDATIONS_ORIGIN`: the exact frontend origin, `http://localhost:5173` for development or `http://localhost:4173` for preview, without a trailing slash. Restart the API with the matching origin when switching modes. Use localhost in the browser for local Secure-cookie authentication.
- `FOUNDATIONS_DATA`: an absolute path to an isolated local data directory, such as this checkout's ignored `output/local-api`. The API creates its SQLite database and media directory there. Without this override it uses `/var/lib/math-foundations`.
- `FOUNDATIONS_ADDR`: `127.0.0.1:18084`, the default loopback listener and the target used above.

Leave `FOUNDATIONS_CATALOG` unset for auth/sync development without grading; attempt submission, recheck, and cancellation endpoints are unavailable in that mode. To enable grading, set it to the absolute path of generated `output/grading-catalog.json` and configure `OPENROUTER_API_KEY` on the backend. Local frontend startup alone does not start or configure the API.

## Included

- Discrete mathematics and linear algebra: 27 lessons including two reading-only introductions, 2,060 exercises, 50 quick checks, answers, terminology, and TeX teaching blocks.
- Native-inspired responsive layout, chapter navigation, persistent reader outline/scrollspy on wide windows, compact chapter/outline sheets, focused practice, section bookmarks, and explicit resume from synced positions.
- Markdown and KaTeX, contextual term popovers, formula readings and symbol bindings, searchable Terms/Notation library, related entries, teaching links, and copyable TeX.
- All 46 authored figures and their interactive steps, SVG math labels, captions, construction notes, reset, and expansion. Adjacency tables remain HTML tables so they stay readable on phones.
- CodeMirror answer editing with prose/math syntax distinctions, completion, brace matching, diagnostics, undo/redo, selection, delimiter insertion, searchable syntax help, live preview, and expanded editing. Syntax diagnostics do not grade mathematical correctness.
- Pressure-aware browser pen/sketch canvas with color, widths, erasing, undo/redo, drawing/panning modes; photos via upload or the device camera chooser, multiple ordered attachments, rotation, removal/undo, and enlargement.
- Native Android stroke serialization compatibility for importing saved ink and submitting reusable pen attempts. Coordinates and pressure are preserved; browser brush rendering and prediction are intentionally not pixel-identical to Android. The adapter follows Google's public [stroke input schema](https://github.com/google/ink/blob/main/ink/storage/proto/stroke_input_batch.proto) and [numeric-run schema](https://github.com/google/ink/blob/main/ink/storage/proto/coded_numeric_run.proto).
- Local recovery drafts; immutable timestamped submissions; offline upload queue; binary grading, animated pending status, optional incorrect feedback, previous attempts/assessments, clarification-aware rechecks, and correct-answer submission locks.
- API synchronization of submitted attempts/media, quick checks, preferences, practice position, and bookmarks. Legacy synced answers remain accessible through **Previously synced work**. New drafts stay local; Android is retired.
- Installable app shell, locally bundled curriculum/fonts, offline downloaded work, update notification, and local-work export. Browser storage errors are surfaced rather than silently reporting a successful save.

## Deliberate browser differences

This is a functional client port, not an Android emulation layer. Browser camera capture uses the platform file/camera chooser. Pen input uses Pointer Events and a browser renderer. Mouse wheels, trackpads and nested panels use normal browser scrolling; the optional two-finger setting applies to touch scrolling in the outer teaching reader. The regular-scroll default suits typing devices.

Browsers do not guarantee Android-style periodic background jobs when the app is closed. Sync runs while open, on reconnect, and on returning to the app; offline submissions remain queued until that happens. API calls and credentials are not cached by the service worker. Only use the installable preview build when testing offline reload, and remember that clearing site data removes unsynced drafts. Export local work before deliberately clearing it.

Email/password authentication and trusted-device offline sessions are documented in [PWA deployment](pwa-deployment.md). Provider keys never enter the web bundle.

## Checks

```sh
npm run web:build
npm run web:test
```

Build first on a fresh checkout so the tests can read generated assets in `web/public`. Node tests cover escaped/incomplete math syntax, unsupported commands, native pen-format round trips, draft/submission separation, monotonic received revisions, and full content/figure coverage. Historical browser checks from the initial web port exercised:

- Typed draft recovery after reload and the compact editor/settings layout.
- Two isolated browser clients against a simulated API: submit, hidden incorrect feedback, incoming attempts, recheck explanation, and cross-client correct locks. No personal notebook was changed by these tests.
- All 39 figures / 97 authored states, plus desktop and 360px layouts.
- Symbol insertion without solved examples, reference navigation, pen capture, photo rotation/removal/undo/submission, and landscape phones.
- Production PWA offline reload, cached assets, and queued-attempt recovery.

Android releases are retired. Local browser artifacts and screenshots are under the ignored `output/` directory.
