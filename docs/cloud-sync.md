> Historical Android-era implementation notes. See [PWA deployment](pwa-deployment.md) for current authentication and operation.

# Cloud sync (0.6.2)

Open **Settings â†’ Cloud sync**, enter the same private API key on both devices, and choose **Connect**. Existing answers save locally first and import automatically. Photos transfer on Wi-Fi or mobile data. **Disconnect** removes the credential without deleting local or server work.

The single-user Go/SQLite API is `https://foundations.johncrowley.dev`, hosted on `jc-dev`. There are no accounts, public photo URLs, or web dashboard. APK distribution continues through GitHub Releases.

## Data and behavior

| Data                                                                          | Sync behavior                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Typed answers, handwriting, ordered photos and rotations                      | Independent records under existing exercise IDs; conflicting edits keep both versions  |
| Quick-check choices and revealed state                                        | Last server-accepted change                                                            |
| Practice position and lesson tutorial visibility                              | Last server-accepted change                                                            |
| Reading bookmarks                                                             | Stable anchors per lesson/device; optional resume action, never an automatic page jump |
| Pen/input preferences, answer input mode, scrolling, pixel offsets, OTA state | Remain device-local                                                                    |
| Cursor, undo stacks, open panels, unfinished camera captures                  | Remain local/transient                                                                 |

Empty text, empty stroke lists, and empty photo lists are explicit clearing records (tombstones). The server keeps them so an older offline edit cannot silently resurrect cleared work. Initial empty defaults cannot overwrite existing answers. The **Versions** action beside an answer compares copies using the existing native text/math, ink, and photo renderers. Choosing a copy retains alternatives for later access.

Sync runs after a two-second edit debounce, on foreground entry, every 30 seconds while open, and through best-effort Android background work at a 15-minute interval. Android may delay background work. **Sync now** retries immediately. Authentication errors pause automatic retries. An idle exercise updates immediately, even while it stays visible. Only the representation being edited is protected: focused text, an in-progress ink stroke/eraser gesture, or an unfinished save. Other representations continue to arrive. Downloaded changes deferred during editing apply when editing ends, including offline. Settings reports deferred incoming changes instead of saying “Up to date.” The input menu marks saved representations, and “Also saved” opens the other formats without changing the local input preference.

Files and cached answers integrate in the same UI turn before advancing the integrated server revision; text focus and pending writes preserve the old revision until edits can be reconciled. Answer writes merge only the edited field. Remote ink resets local undo/redo history so undo cannot resurrect an obsolete remote canvas. Full notebook scans stay in the sync worker; the UI handoff rechecks only incoming candidates.

The local SQLite journal records pending operations and captured snapshots. Startup reconciliation discovers saves completed before their sync notification. Only an exact-operation acknowledgment clears a pending write. Remote projections and local file writers share a short lock; network requests do not hold it. Existing answer and ink files, exercise IDs, and canonical handwriting coordinates are preserved.

The journal distinguishes the newest received revision from the revision actually shown in an open answer. Editing an older open answer therefore creates a conflict if another device changed it, even when that remote revision has already downloaded in the background.

## REST contract

Every route requires `Authorization: Bearer <key>` over HTTPS. The key contains 256 random bits; only its SHA-256 hash is stored on the server. Android encrypts its copy using Android Keystore. Request headers, credentials, and notebook contents are excluded from access logs.

- `GET /api/v1/status` returns `{ "api": 1, "status": "ok" }`.
- `POST /api/v1/mutations` accepts `id`, `key`, `base`, `payload`, `device`, and `resolve`. `id` is a unique operation ID; `base` is the last observed server revision. `resolve` requests selecting the submitted version. Reusing an ID with different content is rejected. Retrying an accepted ID returns the current record without applying the mutation again.
- `GET /api/v1/changes?after=<cursor>` returns `cursor`, `more`, and `records`, with up to 100 change events per page. Save the cursor only after storing all records and their media. Revisions prevent stale responses from replacing newer ones.
- `HEAD`, `PUT`, and `GET /api/v1/media/<sha256>` check, upload, and download immutable photo blobs. Uploads must match their hash. Photo records cannot reference missing blobs. Maximum photo size is 64 MiB; maximum mutation size is 32 MiB.

Records contain `key`, `revision`, current `id/payload/device/updated`, retained `versions`, and unresolved `conflicts` (version IDs). Answer keys are `text/<exercise-key>`, `ink/<exercise-key>`, and `photos/<exercise-key>`. Other keys are `quick/<lesson>:<check>`, `practice/position:<lesson>`, `preference/tex:visible:v2:<lesson>`, and `reading/<device>:<lesson>`.

Text payloads contain `text`. Ink preserves the existing version-1 stroke serialization and paper height. Photo payloads contain an ordered `photos` array of `id`, `rotation`, and `hash`. Quick checks have `choice` and `revealed`; preferences/practice have `value`. Reading records have `slug`, `anchor`, `section`, and activity timestamp `at`.

## Operations

- `/opt/math-foundations/releases/`: versioned binaries, with `current` selecting the active release.
- `/var/lib/math-foundations/`: private `notebook.db`, immutable `media/`, and `backups/`.
- `/etc/math-foundations/server.env`: root-only key hash configuration.
- `foundations.service`: unprivileged API on `127.0.0.1:18084`.
- Nginx: dedicated hostname using the existing SNI routing on `127.0.0.1:17443`; domain certificate renews through webroot ACME with a dedicated Nginx reload hook.

Build from `server/` with `CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build`. Upload the binary as `foundations-server` with the files in `server/deploy/` to a private temporary directory and run `sudo bash install.sh <release>`. Initial installation also needs `server.env`; subsequent installations preserve it. Check the service and authenticated status endpoint before publishing the Android release.

Run `sudo /opt/math-foundations/current/rotate-key.sh` to rotate credentials. It restarts the API and writes the new key to root-only `/etc/math-foundations/new-api-key.txt`. Transfer privately, update both clients, then remove that transfer file. Never put the key in a URL, repository, release note, or diagnostic output.

### Weekly backups and restoration

`foundations-backup.timer` runs **weekly**, Sunday 04:00 UTC with up to 15 minutes of jitter. Missed runs execute after the host resumes. `VACUUM INTO` creates a consistent SQLite snapshot while the service runs. Retention is 35 days, keeping at least four weekly recovery points. A one-time installation backup verifies the job.

Photos remain immutable on the volume, including those needed by retained versions and backups. To restore, stop `foundations`, preserve the current database and WAL/SHM files in a separate recovery directory, copy a selected snapshot to `notebook.db`, set ownership to `foundations` and mode `0600`, and restart. Keep the media directory. When restoring an older database, clients must replay their local state from a reset cursor; existing local work is still available. Same-volume snapshots do not cover loss of the entire volume.

`MediaStore` isolates blob access from the record database. A future S3 implementation can retain the same identifiers and authenticated client API. S3 and off-server backup storage are not dependencies of this release.

## Verification

Go tests cover concurrent offline edits, retained conflicts/resolution, retries, clearing records, authenticated media, invalid hashes, cursors, and backup restoration. Android/Go integration tests start an isolated real Go service and two Android stores for migration, deferred updates, conflicts, photo integrity, preference isolation, and restart reconciliation. Set `CLOUD_TEST_SERVER` to a host-native binary for local integration tests; CI/release workflows build it automatically. Emulator checks cover Settings and existing reader/pen behavior. Tests never write to the production notebook.

Release verification: 19 JVM tests pass, including six Android/Go integration tests (lost acknowledgments and edits based on an unseen remote revision included). The 40 content tests pass. Tablet emulator checks pass all nine reader, pen, outline, and cloud UI tests; the two cloud UI tests also pass at phone width. Release lint reports no errors. The deployed ARM64 binary matches the local artifact; authenticated HTTPS returns 200 and unauthenticated access returns 401. The weekly backup job successfully created its initial consistent snapshot.
