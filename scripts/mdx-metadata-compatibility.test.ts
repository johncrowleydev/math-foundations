import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { comparableCatalog, comparableNotebook, gradingContracts } from './mdx-metadata-parity.js';

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const baseline = await readJson('scripts/fixtures/mdx-metadata-baseline.json');

test('native MDX metadata preserves every published lesson, question, placement, and block', async () => {
  const notebook = await readJson('output/content/notebook.json');
  assert.equal(hash(comparableNotebook(notebook)), baseline.notebookSemanticHash);
});

test('native MDX grading context and deterministic contracts match the captured reference catalog', async () => {
  const catalog = await readJson('output/grading-catalog.json');
  assert.equal(hash(gradingContracts(catalog)), baseline.gradingContractsHash);
  assert.equal(hash(comparableCatalog(catalog)), baseline.catalogSemanticHash);
});

test('the migration preserves the catalog version for saved offline submissions', async () => {
  const notebook = await readJson('output/content/notebook.json');
  const evidence = await readJson('output/content/learning-evidence.json');
  const reviewTemplates = await readJson('output/content/review-templates.json');
  const version = await readJson('output/content/grading-version.json');
  const migration = await readJson('scripts/fixtures/mdx-migration-version.json');
  assert.equal(
    hash({ publishedLessons: notebook.lessons, evidence, reviewTemplates }),
    migration.representationHash,
  );
  assert.equal(version.version, migration.gradingVersion);
  assert.equal(version.version, baseline.gradingVersion);
});
