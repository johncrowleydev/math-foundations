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

`--no-install-links` matches the parent-package symlink in the web lockfile. The build compiles the canonical curriculum and copies runtime assets into `web/public` before bundling.

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

Leave `FOUNDATIONS_CATALOG` unset for auth/sync development without grading; attempt submission, recheck, and cancellation endpoints are unavailable in that mode. To enable attempts and Review, set it to the absolute path of compiled `output/grading-catalog.json`. Deterministic grading works without a provider key; free-response grading additionally requires `OPENROUTER_API_KEY` on the backend. Local frontend startup alone does not start or configure the API.

## Reader and answer input

Lessons render from MDX through registered React components, with KaTeX mathematics, interactive figures, contextual terms, formula readings, and a searchable Terms/Notation library. The responsive reader provides a wide-screen outline, compact navigation sheets, bookmarks, and resume from synced positions. See [architecture](architecture.md) and [content authoring](content-authoring.md).

Exercises use authored choice or structured controls where available. Free responses offer independent Type, Pen, and Photo drafts. CodeMirror provides TeX completion, diagnostics, syntax help, preview, and expanded editing; syntax diagnostics do not grade mathematics. The pen canvas supports pressure, erasing, undo/redo, and drawing/panning. Photos use upload or the device camera chooser, with ordered attachments, rotation, removal/undo, and enlargement.

Saved handwriting retains Android stroke serialization compatibility through `web/src/nativeInk.ts`. Coordinates and pressure are preserved; brush rendering and prediction follow the browser implementation. The adapter uses Google's [stroke input schema](https://github.com/google/ink/blob/main/ink/storage/proto/stroke_input_batch.proto) and [numeric-run schema](https://github.com/google/ink/blob/main/ink/storage/proto/coded_numeric_run.proto). Android is retired.

Mouse wheels, trackpads, and nested panels use normal browser scrolling. The optional two-finger setting applies to touch scrolling in the outer teaching reader.

## Saved work and offline behavior

Drafts stay on their device. Submitted attempts, grades, supported media, preferences, practice positions, and bookmarks synchronize through the API. **Previously synced work** retains access to legacy answers. [Grading](grading.md) describes immutable submissions, retries, correct-answer locks, and photo/handwriting transcription retention.

The production bundle caches the app shell, curriculum, and fonts. Downloaded work and issued [Review](review-system.md) questions remain usable offline; new Review sessions and model grading require the server. API calls and credentials are not cached by the service worker.

Sync polls every five seconds while visible, and runs on reconnect and return to the app. Closed browsers do not guarantee background uploads, so offline submissions remain queued until the app runs again. Storage failures are surfaced instead of reporting a successful save. Export local work from Settings before deliberately clearing site data, which removes unsynced drafts.

## Checks

```sh
npm run web:build
npm run web:test
```

Build first on a fresh checkout so tests can read the compiled assets in `web/public`. For browser verification, run `npm run test:e2e -- offline` or select other suites from `e2e/`; see [tooling](tooling.md) for browser setup and validation commands. Local artifacts belong under ignored `output/`.
