import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadContent } from './content.js';
import { quickChecks, validateQuickChecks } from './quick-checks.js';
const { lessons } = await loadContent();
test('all quick checks have valid math, unique choices, and current preceding teaching', () => {
  validateQuickChecks(lessons);
  assert.equal(Object.values(quickChecks).flat().length, 50);
});
test('moving a quick check or changing its teaching requires another prerequisite audit', () => {
  const changed = structuredClone(quickChecks);
  changed['propositional-logic'][1].after = 'Propositions';
  assert.throws(() => validateQuickChecks(lessons, changed), /Re-audit/);
});
