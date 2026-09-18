import importlib.util
import json
import pathlib
import sqlite3
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('exporter', pathlib.Path(__file__).with_name('export-learning-data.py'))
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class ExportTest(unittest.TestCase):
    def test_structured_evidence_and_no_auth(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / 'web').mkdir()
            (root / 'media').mkdir()
            (root / 'grading-catalog.json').write_text('{}')
            (root / 'web' / 'learning-evidence.json').write_text('{"version":"synthetic"}')
            db = sqlite3.connect(root / 'notebook.db')
            db.executescript('CREATE TABLE attempts(id TEXT, data TEXT, context TEXT, grades TEXT,status TEXT,verdict TEXT,error TEXT); CREATE TABLE grading_jobs(attempt TEXT,reason TEXT); CREATE TABLE attempt_transcriptions(id TEXT,text TEXT); CREATE TABLE records(key TEXT,payload TEXT); CREATE TABLE versions(id TEXT); CREATE TABLE changes(seq INTEGER); CREATE TABLE sessions(secret TEXT);')
            response = {'id': 'synthetic', 'exercise': 'generic-1', 'startedAt': 1, 'activeDurationMs': 20, 'assistance': {'copiedFromRetry': True}, 'unsure': True, 'review': {'kind': 'scheduled-review', 'templateId': 'witness-definition', 'seed': '42', 'intervalDays': 6}}
            grades = [{'verdict': 'incorrect', 'diagnosis': [{'class': 'reasoning'}], 'requirements': [{'id': 'proof', 'satisfied': False}], 'confidence': 'high'}]
            context = {'analytics': {'version': 'one', 'concepts': [{'concept': 'generic', 'role': 'primary'}]}}
            db.execute('INSERT INTO attempts VALUES(?,?,?,?,?,?,?)', ('synthetic', json.dumps(response), json.dumps(context), json.dumps(grades), 'graded', 'incorrect', ''))
            db.execute('INSERT INTO records VALUES(?,?)', ('exposure/generic', json.dumps({'concept': 'generic', 'source': 'exercise', 'sourceId': 'generic-1', 'at': 1})))
            db.execute('INSERT INTO records VALUES(?,?)', ('review-state/target', json.dumps({'dueAt': 123, 'intervalDays': 6})))
            db.execute('INSERT INTO records VALUES(?,?)', ('review-instance/one', json.dumps({'id': 'one', 'context': response['review']})))
            db.execute('INSERT INTO sessions VALUES(?)', ('must-not-export',))
            db.commit()
            db.close()
            exporter.export(root / 'notebook.db', root, root / 'media', root / 'export.zip')
            with zipfile.ZipFile(root / 'export.zip') as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(json.loads(archive.read('export.json'))['version'], 2)
                a = json.loads(archive.read('attempts.json'))[0]
                self.assertEqual(a['analytics'], context['analytics'])
                self.assertEqual(a['grades'], grades)
                self.assertTrue(a['unsure'])
                self.assertEqual(a['review'], response['review'])
                review = json.loads(archive.read('review.json'))
                self.assertEqual(review['states'][0]['payload']['dueAt'], 123)
                self.assertEqual(review['instances'][0]['payload']['context']['seed'], '42')
                self.assertEqual(review['sessions'], [])
                self.assertEqual(len(json.loads(archive.read('exposures.json'))), 1)
                self.assertNotIn('must-not-export', ''.join(archive.read(n).decode() for n in archive.namelist()))


if __name__ == '__main__':
    unittest.main()
