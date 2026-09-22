import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { gradingVersionFor } from '../../tools/content/grading-version.js';

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const compatibility = await readJson('tools/content/compatibility/grading-version.json');

test('the historical MDX representation preserves the version of saved offline submissions', () => {
  assert.equal(gradingVersionFor(compatibility.representationHash), compatibility.gradingVersion);
});

test('the current curriculum publishes its own grading version after the answer correction', async () => {
  const notebook = await readJson('output/content/notebook.json');
  const evidence = await readJson('output/content/learning-evidence.json');
  const reviewTemplates = await readJson('output/content/review-templates.json');
  const version = await readJson('output/content/grading-version.json');
  const representationHash = createHash('sha256')
    .update(JSON.stringify({ publishedLessons: notebook.lessons, evidence, reviewTemplates }))
    .digest('hex');

  assert.notEqual(representationHash, compatibility.representationHash);
  assert.equal(gradingVersionFor(representationHash), representationHash);
  assert.equal(version.version, representationHash);
});

test('changed curriculum receives its own version instead of the compatibility alias', () => {
  const changed = createHash('sha256').update('changed curriculum representation').digest('hex');
  assert.notEqual(changed, compatibility.representationHash);
  assert.equal(gradingVersionFor(changed), changed);
});
