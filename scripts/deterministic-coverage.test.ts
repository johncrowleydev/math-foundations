import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  assembleCoverage,
  loadCoverageInput,
  type CoverageInput,
} from './deterministic-coverage.js';

const input = await loadCoverageInput();
const changeFirstLedger = (
  change: (
    rows: CoverageInput['lessonLedgers'][number]['rows'],
  ) => CoverageInput['lessonLedgers'][number]['rows'],
): CoverageInput => ({
  ...input,
  lessonLedgers: input.lessonLedgers.map((l, i) => (i === 0 ? { ...l, rows: change(l.rows) } : l)),
});

test('every audited lesson and dedicated Review definition has a validated published disposition', async () => {
  const coverage = assembleCoverage(input);
  assert.deepEqual(coverage.totals, {
    lessons: {
      total: 2064,
      structured: 1389,
      choice: 184,
      open: 491,
      converted: 1390,
      alreadyDeterministic: 183,
    },
    dedicatedReview: {
      total: 173,
      structured: 22,
      choice: 147,
      open: 4,
      converted: 22,
      alreadyDeterministic: 147,
    },
  });
  assert.deepEqual(
    coverage,
    JSON.parse(await readFile('docs/deterministic-coverage.json', 'utf8')),
  );
});

test('existing deterministic aliases resolve to their real published response contracts', () => {
  const coverage = assembleCoverage(input);
  for (const key of ['combinatorics-1', 'linear-algebra-matrices-1']) {
    const row = coverage.lessons.find((r) => r.key === key)!;
    assert.equal(row.finalMethod, 'structured');
    assert.ok(row.minimalOutputs.length > 0);
    assert.ok(row.validators.length > 0);
    assert.equal(row.assessmentSource, 'content/deterministic-exercises.json');
  }
  const choice = coverage.lessons.find((r) => r.key === 'propositional-logic-9')!;
  assert.equal(choice.finalMethod, 'choice');
  assert.equal(choice.validators[0].name, 'selected-option');
});

test('missing, duplicate, and changed historical lesson rows fail coverage', () => {
  assert.throws(
    () => assembleCoverage(changeFirstLedger((rows) => rows.slice(1))),
    /Missing lesson disposition/,
  );
  assert.throws(
    () => assembleCoverage(changeFirstLedger((rows) => [...rows, rows[0]])),
    /Duplicate lesson disposition/,
  );
  assert.throws(
    () =>
      assembleCoverage(
        changeFirstLedger((rows) =>
          rows.map((row, i) => (i === 0 ? { ...row, originalHash: '0'.repeat(64) } : row)),
        ),
      ),
    /Original lesson hash differs/,
  );
});

test('a retained item must have its own reason and agree with the published grading method', () => {
  const open = input.lessonLedgers[0].rows.find((r) => r.finalMethod === 'llm')!;
  assert.throws(
    () =>
      assembleCoverage(
        changeFirstLedger((rows) =>
          rows.map((r) => (r.key === open.key ? { ...r, reason: '', retainOpenReason: '' } : r)),
        ),
      ),
    /Missing item disposition reason/,
  );
  assert.throws(
    () =>
      assembleCoverage(
        changeFirstLedger((rows) =>
          rows.map((r) => (r.key === open.key ? { ...r, finalMethod: 'deterministic' } : r)),
        ),
      ),
    /Disposition\/published grading mismatch/,
  );
});

test('structured publication must match a source-pinned authoring definition', () => {
  const catalog = input.authoredCatalogs[0];
  assert.throws(
    () =>
      assembleCoverage({
        ...input,
        authoredCatalogs: [
          { ...catalog, entries: catalog.entries.slice(1) },
          ...input.authoredCatalogs.slice(1),
        ],
      }),
    /Missing published structured assessment/,
  );
  const changed = { ...catalog.entries[0], sourceHash: '0'.repeat(64) };
  assert.throws(
    () =>
      assembleCoverage({
        ...input,
        authoredCatalogs: [
          { ...catalog, entries: [changed, ...catalog.entries.slice(1)] },
          ...input.authoredCatalogs.slice(1),
        ],
      }),
    /Structured source pin differs/,
  );
});

test('all Review variants and generator declarations are covered without representative-question duplication', () => {
  const coverage = assembleCoverage(input);
  assert.equal(coverage.dedicatedReview.filter((r) => r.generator).length, 3);
  assert.equal(coverage.dedicatedReview.filter((r) => r.family === 'authored').length, 167);
  const rows = input.reviewLedger.rows;
  assert.throws(
    () =>
      assembleCoverage({ ...input, reviewLedger: { ...input.reviewLedger, rows: rows.slice(1) } }),
    /Missing Review disposition/,
  );
  assert.throws(
    () =>
      assembleCoverage({
        ...input,
        reviewLedger: { ...input.reviewLedger, rows: [...rows, rows[0]] },
      }),
    /Duplicate Review disposition/,
  );
  const changed = [{ ...rows[0], originalHash: '0'.repeat(64) }, ...rows.slice(1)];
  assert.throws(
    () => assembleCoverage({ ...input, reviewLedger: { ...input.reviewLedger, rows: changed } }),
    /Original Review hash differs/,
  );
});
