# PWA deployment and authentication

Foundations runs at https://foundations.johncrowley.dev on jc-dev. nginx serves `/opt/math-foundations/current/web` and forwards `/api/` to the loopback Go service. Releases live under `/opt/math-foundations/releases`; `current` is switched atomically. Keep previous releases and a consistent pre-migration SQLite backup before deploying.

The account uses `FOUNDATIONS_EMAIL`, `FOUNDATIONS_PASSWORD_HASH`, and `FOUNDATIONS_ORIGIN` in root-only `/etc/math-foundations/server.env`. Generate a password hash by passing the exact password on stdin to `foundations-server hash-password`. Preserve unrelated environment entries when changing credentials. `OPENROUTER_API_KEY` stays server-only. Legacy bearer API keys are no longer accepted. Changing a password should also revoke existing sessions (`DELETE FROM sessions`) through an administrative SQLite operation.

Sessions last 30 days and survive service restarts in SQLite, with only token hashes stored. The browser cookie is Secure, HttpOnly, SameSite=Strict, host-only. Login is throttled and state-changing endpoints require the configured Origin. There is one personal account; no public registration or email reset.

The initial visit requires online login. Remembered sessions permit offline use until expiry; reconnect validates the session before syncing. Sign-out locks all tabs and preserves work; offline sign-out is revoked at the server before future login/sync. A local application lock does not encrypt browser storage. Settings offers a separately confirmed local-data removal operation.

Moving from localhost to production changes browser storage origin. Export local work in Settings on localhost and import it after signing in on the public site. Imports validate shape and media hashes and apply atomically. Existing conflicting entries stay active; original imports remain downloadable in Settings for recovery. Existing server records and images return through normal sync. Do not uninstall the old Android app if you still need local-only drafts from it.

Weekly backups remain scheduled by foundations-backup.timer. Media is immutable and remains on the server volume. Existing Android source and releases remain historical only; no further APK updates are published.

Deploy web and backend together, verify sign-in and authenticated status, old-key rejection, downloaded assets, service-worker update behavior, and weekly backup scheduling. A rollback must not silently re-enable the retired bearer authentication: prefer the last session-auth-compatible release, or keep the API in maintenance while repairing the first migration.
