# Image response retention

Photo and handwriting submissions keep their original `mode`. After a successful assessment supplies a nonempty transcription, the server saves that text separately as the immutable attempt `transcription`, removes the attempt's image/photo/ink data, and sends the updated attempt through ordinary sync. The UI labels the response **Transcribed from photo** or **Transcribed from handwriting**, including in expanded history.

Rechecks use the saved transcription, original exercise context, prior assessments, and the user's clarification. The prompt explicitly states that the original image is no longer available. A recheck does not overwrite the saved original transcription. Trying again may start a new typed draft from it, without changing the original attempt's provenance.

Images remain temporary submission data while queued, grading, failed, or unreadable. A `not_graded` or empty transcription does not authorize discarding the source. Once a usable transcription is committed, unreferenced source files are deleted; files shared with another pending attempt or saved draft remain available to that work. Source hashes keep upload retries idempotent after retirement. Existing successful image attempts are converted at server startup using their first usable recorded transcription, without making model calls or changing verdicts.

Clients receiving the conversion remove obsolete image blobs and the inactive submitted draft's ink/photos when no other local work references those blobs. Offline devices receive these changes on their next sync. Historical backups and user-created exports are not rewritten; weekly database backup expiration is unchanged. This is an answer-retention policy, not a secure erasure promise for prior backups or browser profiles.

Verification covers original-format provenance, transcription-only rechecks, repeat migration, idempotent submission retries, failed/unreadable retention, shared media, client sync cleanup, and export/import.
