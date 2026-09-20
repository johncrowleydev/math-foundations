import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const writerUrl = new URL('./authoring/aggregate-writer.mjs', import.meta.url).href;
const reviewPath = 'content/review-templates.json';
const fixturesPath = 'content/deterministic-review-fixtures.json';
const sourcesPath = 'content/sources.json';

async function writeAggregates(
  previous: Record<string, unknown>,
  writes: { path: string; value: unknown }[],
) {
  const directory = await mkdtemp(join(tmpdir(), 'foundations-authoring-'));
  try {
    await mkdir(join(directory, 'content'));
    const initial = {
      [reviewPath]: [],
      [fixturesPath]: [],
      [sourcesPath]: { citations: {}, lessons: {}, reviewTemplates: {} },
      ...previous,
    };
    for (const [path, value] of Object.entries(initial))
      await writeFile(join(directory, path), JSON.stringify(value));
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import fs from 'node:fs';
         const { createAuthoringJsonWriter } = await import(${JSON.stringify(writerUrl)});
         const save = createAuthoringJsonWriter();
         for (const { path, value } of JSON.parse(fs.readFileSync(0, 'utf8'))) save(path, value);`,
      ],
      { cwd: directory, input: JSON.stringify(writes), encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    return Object.fromEntries(
      await Promise.all(
        writes.map(async ({ path }) => [path, await readFile(join(directory, path), 'utf8')]),
      ),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('subject regeneration preserves established Review order and appends new identities', async () => {
  const oldReview = [{ id: 'other-subject' }, { id: 'replaced' }, { id: 'removed' }];
  const newReview = [
    { id: 'new-b' },
    { id: 'replaced', question: 'New content' },
    { id: 'other-subject' },
    { id: 'new-a' },
  ];
  const oldFixtures = [
    { template: 'family', variant: 2 },
    { template: 'fixed', variant: null },
    { template: 'family', variant: 1 },
  ];
  const newFixtures = [
    oldFixtures[2],
    { template: 'new', variant: null },
    oldFixtures[0],
    oldFixtures[1],
  ];
  const written = await writeAggregates({ [reviewPath]: oldReview, [fixturesPath]: oldFixtures }, [
    { path: reviewPath, value: newReview },
    { path: fixturesPath, value: newFixtures },
  ]);
  assert.deepEqual(JSON.parse(written[reviewPath]), [
    newReview[2],
    newReview[1],
    newReview[0],
    newReview[3],
  ]);
  assert.deepEqual(JSON.parse(written[fixturesPath]), [...oldFixtures, newFixtures[1]]);
});

test('subject regeneration retains later inspection dates only for unchanged citations', async () => {
  const unchanged = { locator: 'Section 1', checked: '2026-09-20' };
  const old = {
    citations: {
      unchanged,
      changed: unchanged,
      newer: { locator: 'Section 2', checked: '2026-09-19' },
      removed: unchanged,
    },
    lessons: { first: { reviewedContentHash: 'old' }, second: {} },
    reviewTemplates: { existing: { reviewedContentHash: 'old' } },
  };
  const next = {
    citations: {
      new: unchanged,
      newer: { locator: 'Section 2', checked: '2026-09-20' },
      changed: { locator: 'Section 3', checked: '2026-09-19' },
      unchanged: { ...unchanged, checked: '2026-09-19' },
    },
    lessons: { second: {}, first: { reviewedContentHash: 'pending inspection' }, new: {} },
    reviewTemplates: { new: {}, existing: { reviewedContentHash: 'pending inspection' } },
  };
  const written = await writeAggregates({ [sourcesPath]: old }, [
    { path: sourcesPath, value: next },
    { path: 'content/unrelated.json', value: { retained: true } },
  ]);
  assert.equal(
    written[sourcesPath],
    JSON.stringify(
      {
        citations: {
          unchanged,
          changed: next.citations.changed,
          newer: next.citations.newer,
          new: unchanged,
        },
        lessons: { first: next.lessons.first, second: {}, new: {} },
        reviewTemplates: { existing: next.reviewTemplates.existing, new: {} },
      },
      null,
      2,
    ) + '\n',
  );
  assert.equal(written['content/unrelated.json'], '{\n  "retained": true\n}\n');
});
