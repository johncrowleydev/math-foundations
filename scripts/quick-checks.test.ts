import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadContent } from './content.js';
import { quickChecks, validateQuickChecks } from './quick-checks.js';
const { lessons } = await loadContent();
test('all quick checks have valid math, unique choices, and current preceding teaching', () => {
  validateQuickChecks(lessons);
  assert.equal(
    Object.entries(quickChecks)
      .filter(
        ([slug]) => !slug.startsWith('calculus-') && !slug.startsWith('probability-statistics-'),
      )
      .flatMap(([, checks]) => checks).length,
    54,
  );
  for (const lesson of lessons.filter((l) => l.subject === 'Calculus'))
    assert.equal((quickChecks[lesson.slug] || []).length, lesson.number === 0 ? 0 : 2);
});
test('moving a quick check or changing its teaching requires another prerequisite audit', () => {
  const changed = structuredClone(quickChecks);
  changed['propositional-logic'][1].after = 'Propositions';
  assert.throws(() => validateQuickChecks(lessons, changed), /Re-audit/);
});
