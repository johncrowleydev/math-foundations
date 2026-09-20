# Backup and media recovery integrity

Architecture finding [A13](architecture-audit.md#a13--high-value-media-retirement-does-not-account-for-retained-backups) identified a recovery gap: the weekly job copied SQLite, but did not copy the media that its historical rows referenced. A later successful transcription could legitimately retire that media from the live server. Restoring the older database then restored a response reference without its image.

The policy is now **one independent media snapshot per database recovery point**. Every completed point contains its database and every media object required by that database. Live media retirement can proceed after a readable transcription has been retained; deleting a live object cannot invalidate a completed point. Expiring a point deletes only that point's private copies.

## Previous operational contract

These details come from the implementation before this fix, rather than the former retention comments:

| Concern       | Previous behavior                                                                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schedule      | `server/deploy/foundations-backup.timer`: Sunday 04:00 UTC, randomized delay up to 15 minutes, `Persistent=true` to catch up after downtime.                                                                                                                                       |
| Execution     | `foundations-backup.service`: `foundations` user/group, `UMask=0077`, writes permitted under `/var/lib/math-foundations`.                                                                                                                                                          |
| Destination   | `backup.sh` hardcoded `/var/lib/math-foundations/backups`, even if `FOUNDATIONS_DATA` was set elsewhere.                                                                                                                                                                           |
| SQLite copy   | `foundations-server backup <path>` opened the live database and ran parameterized `VACUUM INTO ?`, producing a consistent SQLite snapshot while the service was running.                                                                                                           |
| Name          | `notebook-YYYYMMDD-HHMMSS.db`, using UTC.                                                                                                                                                                                                                                          |
| Retention     | `find ... -name 'notebook-*.db' -mtime +35 -delete`. `find` rounds age down to completed 24-hour days, so files became eligible at 36 days; actual deletion waited until a successful weekly run. The intent was at least four weekly recovery points, not an exact 35-day expiry. |
| Other cleanup | After a successful database backup, `.upload-*` files in the live media directory were removed with `-mtime +7`.                                                                                                                                                                   |
| Media         | No media snapshot. `removeRetiredMedia` checked live `attempts` and `versions`, then unlinked unused retired objects. It did not inspect backups.                                                                                                                                  |
| Restore       | Documentation instructed operators to restore the selected database and keep the existing live media directory.                                                                                                                                                                    |
| Installation  | `install.sh` enabled the timer and restarted the service. Despite the old deployment documentation, it did not itself execute a one-time backup.                                                                                                                                   |

The old script comment promised that media would survive while a retained backup might reference it. No code enforced that promise. The old restore procedure therefore depended on live files that normal retirement was allowed to delete.

## Selected strategy and alternatives

| Option                                                                | Assessment                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: independent database + referenced-media snapshot                   | **Selected.** One directory is a complete recovery point, restoration does not depend on the current media store, and pruning cannot remove another point's private files. Ordinary copies require no new storage dependency. |
| B: defer live deletion until all retained databases release an object | Avoids duplicate copies, but makes live deletion depend on backup discovery, schema compatibility, failed reads and pruning. Moving a database without its live store also remains unsafe.                                    |
| C: common hash-addressed retained object pool                         | Can deduplicate objects, but requires garbage collection over all live and recovery roots and coordinated failure handling. This adds more ownership rules than the current deployment needs.                                 |

No hard links, reflinks, archive format or global object collector are introduced. The same hash is copied once within a recovery point even when multiple attempts, rendered response images and original photos reference it. Separate points have separate copies. Storage usage is the sum of retained database sizes and the distinct media bytes needed by each retained point; capacity should be monitored accordingly.

## Recovery point and lifecycle

The weekly timer and service user are unchanged. `backup.sh` uses `FOUNDATIONS_DATA`, defaulting to `/var/lib/math-foundations`, and creates a directory such as:

```text
/var/lib/math-foundations/backups/notebook-20260920-040000/
  notebook.db
  media/
    <sha256>
  manifest.json
```

The version 1 manifest contains `createdAt`, `database` (`notebook.db`), `databaseSha256` and sorted, unique `mediaHashes`. It is written after the database and required media copies exist. Verification checks the database hash, its required-media inventory, and each media hash. The manifest does not replace the database as the source of media references.

The binary exposes these administrative commands; none requires the HTTP API or a model provider:

```text
foundations-server backup <new-recovery-directory>
foundations-server verify-backup <recovery-directory>
foundations-server restore-backup <recovery-directory> <new-data-directory>
foundations-server audit-backup <legacy-db-file> <media-directory>
foundations-server prune-backups <backups-directory>
```

`backup` reads `FOUNDATIONS_DATA` for its live database/media source. `restore-backup` writes only `notebook.db` and `media/` into a new destination; an existing destination is rejected. Verification and legacy audit inspect explicit paths without mutating their source databases. Use absolute paths in operations and run under the `foundations` user, which owns the private data root. A manual backup uses the same implementation as the timer:

```sh
sudo -u foundations env FOUNDATIONS_DATA=/var/lib/math-foundations \
  /opt/math-foundations/current/foundations-server backup \
  "/var/lib/math-foundations/backups/notebook-$(date -u +%Y%m%d-%H%M%S)"
```

Backup holds `backups/.backup.lock` to serialize creation and pruning. It also acquires the OS file lock `media/.retirement.lock` before its SQLite snapshot and keeps it through publication. Normal media retirement skips its pass when that lock is busy and can retry later. This coordinates the separate timer process and running server, so an object required by the SQLite snapshot cannot disappear before being copied. It does not weaken the retained-transcription condition, original source hash checks, immutable grade history or live shared-media checks. Keep the lock files in place; deleting a lock file while processes use it defeats coordination.

Required media identities come from `attempts.data`, plus every stored `versions.payload` under the exact `attempt/` and `photos/` namespaces, including historical/conflicting versions. Attempt payloads contribute `images[]` and `photos[].hash`; photo payloads contribute `photos[].hash`. Rotation metadata, image ordering and all other response fields remain in the unchanged SQLite snapshot. References are deduplicated by SHA-256 identity. Other hash-shaped values, such as transcription source digests and operation IDs, are not media references.

Database reads use SQLite read-only access, not binary searching or migration through `openDB`. Extraction requires the historical `versions(key,payload)` table. A database predating grading may omit `attempts`; if that table is present, it must contain `id` and `data`. Missing or null attempt image/photo lists remain compatible for media-free history. Malformed payloads, invalid known-media fields/hashes, or unsupported required-table shapes fail closed. This is an explicit supported-schema check, not an attempt to infer arbitrary future media fields.

Each copied object must satisfy `SHA-256(file contents) == referenced media ID`. Missing objects, malformed references, unsupported database shape or copy/write failures abort creation. No completed recovery point is published until every required object and the database have been constructed and verified.

Creation uses a hidden `.backup-*` temporary directory beside its final destination, followed by atomic rename on the same filesystem. A partial temporary directory is not a valid recovery point. The parent directory and completed files are synced as appropriate before success is reported.

## Retention and pruning

After successful creation the weekly script invokes `prune-backups`. Complete recovery-point directories become eligible 36 days after the manifest's `createdAt`, preserving the former `find -mtime +35` threshold rather than shortening retention to exactly 35 days. Actual removal waits for a pruning run. Legacy `notebook-*.db` files retain the same age policy, measured from modification time. Failed creation does not trigger the script's pruning step.

Pruning holds the same `.backup.lock` as creation. It renames each expired point to a hidden `.pruning-*` directory before deletion. It also removes abandoned `.backup-*` and `.pruning-*` directories while holding the lock, when no compliant backup creation can be using them. Hidden incomplete directories are never treated as valid recovery points. Do not rename a partial directory into the completed namespace.

Each recovery point owns ordinary copies of its media. Removing expired A cannot remove B's copy of the same hash. Once all points requiring hash X expire, no backup copy remains; the live collector can already have deleted its own X after transcription. C, created after retirement and requiring no X, does not retain it. This guarantees eventual cleanup without coupling the live collector to a scan of historical databases.

Automatic expiry recognizes the standard `notebook-YYYYMMDD-HHMMSS` directories. Manually named recovery points, completed restore directories and rollback directories remain operator-managed. An interrupted restore can leave a `.restore-*` staging directory; remove it only after confirming no restore process is active. The backup pruner does not collect restore staging.

## Restore procedure

Choose a completed point and stop scheduled backups so pruning cannot race the restore. The following example stages the selected database and media together without touching live data; substitute the chosen recovery-point name:

```bash
set -euo pipefail
recovery_point=/var/lib/math-foundations/backups/notebook-20260920-040000
restored_dir=/var/lib/math-foundations/restored-20260920-040000
sudo systemctl stop foundations-backup.timer foundations-backup.service
sudo -u foundations /opt/math-foundations/current/foundations-server \
  verify-backup "$recovery_point"
sudo -u foundations /opt/math-foundations/current/foundations-server \
  restore-backup "$recovery_point" "$restored_dir"
```

The destination must not exist. Restoration verifies the recovery point and copied objects before publishing the new data directory. It does not consult the live media directory. If validation fails, retain the original recovery point and investigate the reported missing or mismatched hash; do not substitute an empty media directory. Restart `foundations-backup.timer` if abandoning the restoration. A simultaneous manual prune can make restoration fail cleanly; it cannot publish a partial restore.

For the final switch, stop the API, preserve the current database, WAL/SHM and media together, then install only the staged database and media. This leaves retained `backups/` in place. Run this Bash sequence in the same shell after successful staging:

```bash
set -euo pipefail
data_root=/var/lib/math-foundations
rollback_dir="$data_root/before-restore-$(date -u +%Y%m%d-%H%M%S)"
sudo systemctl stop foundations
sudo -u foundations mkdir -m 700 -- "$rollback_dir"
for name in notebook.db notebook.db-wal notebook.db-shm media; do
  if sudo -u foundations test -e "$data_root/$name"; then
    sudo -u foundations mv -- "$data_root/$name" "$rollback_dir/"
  fi
done
sudo -u foundations mv -- "$restored_dir/notebook.db" "$data_root/notebook.db"
sudo -u foundations mv -- "$restored_dir/media" "$data_root/media"
sudo -u foundations rmdir -- "$restored_dir"
sudo systemctl start foundations
sudo systemctl start foundations-backup.timer
```

The service remains stopped if the file-switch commands fail. Preserve the rollback directory until authenticated status, learner history, response media and sync are verified. The staged database/files are private and owned by `foundations`; restoring as that user avoids a separate ownership repair. Keep the matching prior application release for rollback as described in [PWA deployment](pwa-deployment.md). A server backup does not contain `/etc/math-foundations/server.env` or application binaries.

An older restored database also has older sync history. Clients must replay local state from a reset cursor, as with previous database restores; their newer local work is not part of the server recovery point. This server backup does not replace browser export/import or capture unsynced client-only responses.

## Failures and interruption

| Failure                                             | Required outcome                                                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database succeeds, media is missing or a copy fails | Backup exits unsuccessfully and does not publish the final directory. Earlier complete points remain usable.                                        |
| Copies succeed, validation or finalization fails    | No success is reported. Only a completely constructed point may become visible under its final name.                                                |
| Process exits during creation                       | An incomplete temporary directory is not offered as a recovery point; the operating system releases its process lock.                               |
| Pruning overlaps creation                           | Coordination prevents pruning from interfering with creation. Only completed, expired points are eligible.                                          |
| Live transcription finishes during backup           | Live retirement skips the locked pass and retries after the backup has secured its required files; subsequent deletion affects only the live store. |
| Entire volume is lost                               | Same-volume snapshots are lost too. Copy completed recovery-point directories to separate storage for volume-loss recovery.                         |

## Historical backups and limits

Existing `notebook-*.db` files were created without media snapshots. They are **not repaired retroactively** by this change. A historical database may already reference missing media, and readable text in today's live database does not reconstruct the original image required by that older database. Audit against the media actually available; report absent hashes and keep the historical database intact. Do not invent missing files or describe these legacy files as verified complete recovery points.

For a retained legacy file, run the read-only audit against the media directory that is actually available:

```sh
sudo -u foundations /opt/math-foundations/current/foundations-server \
  audit-backup /var/lib/math-foundations/backups/notebook-20260913-040000.db \
  /var/lib/math-foundations/media
```

The audit reports the database path and missing or invalid objects. Success describes current availability only; it does not turn a legacy database into a self-contained recovery point or stop future live-media retirement. New-format points use `verify-backup` instead.

No production databases, media or retained backups were inspected while implementing this change. Therefore this work does not establish whether any production historical recovery point is currently incomplete. All automated reproduction and restoration data is synthetic and isolated in temporary directories.

The media guarantee covers references in supported database schemas at the time the point is created and verified. Hash verification detects missing or changed bytes; it does not provide independent protection from loss or corruption of every copy on the same volume. Administrative deletion or editing of completed recovery-point files can still invalidate a point and will be detected on verification.

## Regression coverage

The central regression creates an attempt with photo media, snapshots before transcription, grades and retires the live media, then restores into a clean directory. The restored attempt retains its original references and its media bytes match the original SHA-256 hashes. With the former database-only backup, the final media-open step fails because the live copy has been deleted.

Before implementation, the temporary `TestBackupBaselineA13` reproduced that sequence against the original `VACUUM INTO` backup path. `go test -count=1 -run '^TestBackupBaselineA13$' ./...` exited 1 at the expected missing-media assertion: the restored attempt still had one image and no retained transcription, but opening hash `7fbe3086e4c6aa8998c0d51c7c89622b00b712b7344393e38e38befe67acb456` returned `ENOENT`. The deliberately failing baseline test was removed after recording the reproduction; the permanent regression exercises the replacement production mechanism.

Retention coverage uses A and B referencing image X and C created after live retirement. Expiring A leaves B independently restorable; expiring B removes the final backup copy of X while C remains complete. Additional coverage checks handwriting, original and rotated photos, multiple images, repeated hashes, shared objects, and failure without publication.

| Test                                                      | Coverage                                                                                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TestBackupRestoresRetiredResponseMedia`                  | Production backup and clean restore after live retirement; handwriting, distinct rendered/original hashes, rotations, multiple/repeated hashes, shared objects and byte/hash identity. |
| `TestBackupPreservesMediaInRetainedDraftVersions`         | Conflicting historical draft versions retain their required media; ordinary text containing a hash does not create a reference.                                                        |
| `TestBackupRejectsMissingOrCorruptMediaWithoutPublishing` | Missing, corrupted and non-regular media fail without publishing a completed point.                                                                                                    |
| `TestBackupAndRestoreRefuseExistingDestinations`          | Backup and restore do not overwrite existing destinations.                                                                                                                             |
| `TestRestoreRejectsIncompleteOrCorruptRecoveryPoint`      | Missing/corrupt media, database or manifest; unsupported manifest version, missing inventory hash and traversal-like hash.                                                             |
| `TestBackupPruningPreservesOtherRecoveryPoints`           | Runs actual pruning over A/B/C, restores B after A is removed, then expires B while C remains complete.                                                                                |
| `TestLegacyBackupAuditReportsMediaLostAfterRetirement`    | Reports the missing media in an older database-only snapshot after normal live retirement.                                                                                             |

Additional failure/concurrency tests cover:

- `TestBackupCopyWriteFailureDoesNotPublish`: a subprocess ignores `SIGXFSZ` and limits its file size to 1 MiB. The small SQLite snapshot succeeds, then copying a larger synthetic media object returns a real `EFBIG` write error. No final recovery point or temporary directory remains; the prior point still verifies after pruning, and an unrestricted retry succeeds.
- `TestBackupFinalizationPreservesCollidingDestination`: an already complete, verified stage fails publication because the destination exists. The destination database, manifest and media remain byte-identical, and the staged copy remains valid.
- `TestBackupPruningWaitsForActiveCreationAndRecoversAfterExit`, `TestBackupProcessLockPreventsLiveMediaRetirement` and `TestBackupCreationWaitsForMediaRetentionLock`: separate OS processes exercise both file locks, collector deferral, blocked creation/pruning and lock release after process exit.
- `TestBackupPruningCleansAbandonedStagesAndRetainsUnrelatedFiles`: abandoned backup/pruning stages are removed, legacy files respect their age policy, and unrelated files remain.
- `TestBackupCLIRoundTripAndReadOnlyAudit` and the other CLI tests: the actual command dispatcher backs up committed live WAL data, verifies and restores without auth, reports missing historical hashes, preserves source bytes and avoids source sidecars or unrelated live initialization. Operator paths include spaces, `#` and `?`.
- `TestBackupCLIKilledCreatorReleasesLocks`: a real creator is killed while holding the backup lock and waiting for the media-retirement lock, before its snapshot. No point is published and the next backup succeeds. Abandoned-stage cleanup is exercised separately; this is not a claim that the kill was injected midway through copying.
- `TestDeploymentBackupScriptCreatesAndPrunes` and `TestDeploymentBackupScriptFailureDoesNotPrune`: the production shell script runs against isolated temporary data, creates/verifies recovery points, prunes expired points and skips pruning after a failed backup.

The tests inject a genuine media-write failure and a publication collision, not a full disk or an `fsync` failure. Those other I/O failures follow checked error returns before publication; files and directories are synced before success. Power-loss durability still depends on the filesystem and storage device honoring those synchronization requests. The new copy/finalization tests pass both ordinary and race-enabled targeted Go runs. Full repository validation is recorded with the change's delivery results.

## Validation results

All checks below passed on the completed implementation. The four new backup test files add 24 substantive tests, plus subprocess helpers and table-driven cases.

| Check                                 | Result                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                            | 2,016 tests; includes content/source validation and shared/adversarial deterministic fixtures.                                                                      |
| `npm run typecheck`                   | Passed.                                                                                                                                                             |
| `npm run web:build`                   | Passed; existing large-bundle advisory remains.                                                                                                                     |
| `npm run web:test`                    | 94 tests, including offline/sync preservation checks.                                                                                                               |
| `npm run format:check`                | Passed.                                                                                                                                                             |
| `go test -count=1 ./...`              | Passed, including backup commands/scripts, media retirement, restore integrity, provider traps and frozen Review history.                                           |
| `go test -race -count=1 ./...`        | Passed.                                                                                                                                                             |
| `scripts/check-offline-hardening.mjs` | Production PWA and isolated real API: offline work, malformed/interrupted replies, frozen Review/catalog upgrades and export/restore passed.                        |
| `scripts/check-review-ui.mjs`         | Passed against a dedicated local development server; synthetic API, cached Review and queued sync. Only screenshot output was redirected to ignored test artifacts. |
| Linux ARM64, `CGO_ENABLED=0` build    | Passed with the deployment target; no new runtime command dependency.                                                                                               |
| `sh -n server/deploy/backup.sh`       | Passed; execution with temporary DB/media and paths containing spaces is covered by the Go integration tests.                                                       |

The first standalone Review browser invocation lacked its required development server; the corrected isolated invocation passed. No product changes were needed for that setup error. Test logs and browser artifacts are local, ignored files under `output/backup-media-integrity/` and `output/offline-hardening/`. No production access, deployment or merge was performed.
