import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  finiteRelationRequirement,
  validateFiniteRelationRequirement,
} from '../shared/finite-relation';
import type { Assessment, StructuredResponse } from '../shared/assessment';
const fixtures: {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[] = JSON.parse(
  fs.readFileSync(new URL('../shared/finite-relation-fixtures.json', import.meta.url), 'utf8'),
);
for (const f of fixtures)
  test(f.name, () => {
    const r = f.assessment.requirements[0];
    validateFiniteRelationRequirement(r);
    if (f.error) assert.throws(() => finiteRelationRequirement(r, f.response));
    else assert.equal(finiteRelationRequirement(r, f.response), f.verdict === 'correct');
  });
test('Authored universe uses semantic equality and a bounded carrier', () => {
  const r = {
    id: 'property',
    description: 'relation',
    validator: 'finite-relation',
    fields: ['r', 'witness'],
    params: { kind: 'reflexive-symmetric-not-transitive', universe: ['1', '2/2'] },
  };
  assert.throws(() => validateFiniteRelationRequirement(r));
  assert.throws(() =>
    validateFiniteRelationRequirement({
      ...r,
      params: { ...r.params, universe: Array.from({ length: 17 }, (_, i) => String(i)) },
    }),
  );
});
