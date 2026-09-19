"""Read-only server notebook export. No credentials or auth/session tables.

python scripts/export-learning-data.py --database /var/lib/math-foundations/notebook.db \
  --release /opt/math-foundations/current --media /var/lib/math-foundations/media --output /private/export.zip
"""
import argparse
import csv
import datetime
import hashlib
import io
import json
import pathlib
import sqlite3
import zipfile


def export(database, release, media, output):
    db = sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    db.execute('BEGIN')
    tables = {}
    for name in ['attempts', 'grading_jobs', 'attempt_transcriptions', 'records', 'versions', 'changes']:
        tables[name] = [dict(r) for r in db.execute('SELECT * FROM ' + name)]
    db.rollback()
    db.close()
    for rows in tables.values():
        for row in rows:
            for key in ['data', 'context', 'grades', 'payload', 'conflicts']:
                if key in row:
                    row[key] = json.loads(row[key])
    transcriptions = {r['id']: r['text'] for r in tables['attempt_transcriptions']}
    attempts = []
    for r in tables['attempts']:
        a = dict(r['data'])
        a.update({k: r[k] for k in ['status', 'verdict', 'error', 'grades']})
        a['context'] = r['context']
        a['analytics'] = r['context'].get('analytics')
        a['transcription'] = transcriptions.get(r['id'], '')
        a['gradingJobs'] = [j for j in tables['grading_jobs'] if j['attempt'] == r['id']]
        attempts.append(a)
    manifest = {}
    with zipfile.ZipFile(output, 'x', zipfile.ZIP_DEFLATED) as archive:
        def write(name, data):
            if isinstance(data, str):
                data = data.encode('utf-8')
            archive.writestr(name, data)
            manifest[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

        def js(name, data):
            write(name, json.dumps(data, ensure_ascii=False, indent=2))

        def sheet(name, rows):
            if not rows:
                return
            stream = io.StringIO(newline='')
            writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
            write(name, stream.getvalue())

        js('export.json', {'format': 'foundations-learning', 'version': 2,
                          'exportedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                          'attempts': len(attempts), 'grades': sum(len(a['grades']) for a in attempts)})
        js('attempts.json', attempts)
        js('review.json', {
            'states': [r for r in tables['records'] if r['key'].startswith('review-state/')],
            'instances': [r for r in tables['records'] if r['key'].startswith('review-instance/')],
            'sessions': [r for r in tables['records'] if r['key'].startswith('review-session/')],
        })
        sheet('attempts.csv', [{k: a.get(k, '') for k in ['id', 'exercise', 'submitted', 'mode', 'verdict', 'status', 'startedAt', 'activeDurationMs', 'unsure', 'text', 'transcription']} for a in attempts])
        sheet('grades.csv', [dict(attemptId=a['id'], exercise=a['exercise'], assessment=i + 1,
                                 **{k: json.dumps(g[k], ensure_ascii=False) if isinstance(g.get(k), (dict, list)) else g.get(k, '') for k in ['at', 'verdict', 'feedback', 'reason', 'confidence', 'requirements', 'diagnosis', 'notGradedReason']})
                            for a in attempts for i, g in enumerate(a['grades'])])
        for name, rows in tables.items():
            js('raw/' + name + '.json', rows)
        js('exposures.json', [r for r in tables['records'] if r['key'].startswith('exposure/')])
        for name in ['notebook', 'teaching', 'tex-syntax', 'tex-teaching', 'grading-version', 'learning-evidence', 'review-templates']:
            path = release / 'web' / (name + '.json')
            if path.exists():
                write('curriculum/' + path.name, path.read_bytes())
        write('curriculum/grading-catalog.json', (release / 'grading-catalog.json').read_bytes())
        for path in media.iterdir():
            if path.is_file() and len(path.name) == 64 and all(ch in '0123456789abcdef' for ch in path.name):
                data = path.read_bytes()
                if hashlib.sha256(data).hexdigest() != path.name:
                    raise ValueError('Media checksum mismatch')
                write('media/' + path.name, data)
        write('README.txt', 'Foundations learning export v2. UTF-8 JSON and CSV. Numeric timestamps are Unix milliseconds.\n'
              'attempts.json contains immutable submissions, assistance, optional uncertainty/timing, all assessments with requirements/diagnoses/confidence, rechecks, original context and analytical snapshots. Missing fields are unknown, never inferred.\n'
              'review.json separates mutable server scheduling state from issued instances/sessions; attempts retain optional review context. Absent review context on historical attempts is not fabricated.\n'
              'curriculum/ includes the current concept/skill/representation catalog and exercise mappings. Historical snapshots take precedence; historical-backfill is labeled. Unmatched legacy tasks may lack snapshots.\n'
              'raw/ retains sync records, conflicts and versions, including bounded concept exposures. Media previously replaced by transcription is not recoverable.\n'
              'Only server-synced work is included. Use the browser local-work export for unuploaded drafts. No credentials, sessions or operational request replay logs. Consistent DB read transaction; immutable media copied immediately afterward.\n'
              'This analysis ZIP is not a browser import file. Browser Settings export/import uses its separately versioned JSON format.\n')
        js('manifest.json', manifest)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ['database', 'release', 'media', 'output']:
        parser.add_argument('--' + option, type=pathlib.Path, required=True)
    args = parser.parse_args()
    export(args.database, args.release, args.media, args.output)
