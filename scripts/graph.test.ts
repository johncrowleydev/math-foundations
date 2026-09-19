import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { graphRequirement, validateGraphRequirement } from '../shared/graph';
import type { Assessment, StructuredResponse } from '../shared/assessment';
const fixtures: {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[] = JSON.parse(
  fs.readFileSync(new URL('../shared/graph-fixtures.json', import.meta.url), 'utf8'),
);
for (const f of fixtures)
  test(f.name, () => {
    const r = f.assessment.requirements[0];
    validateGraphRequirement(r);
    if (f.error) assert.throws(() => graphRequirement(r, f.response));
    else assert.equal(graphRequirement(r, f.response), f.verdict === 'correct');
  });
test('Graph metadata rejects unbounded or cyclic topological enumeration', () => {
  const r = {
    id: 'result',
    description: 'orders',
    validator: 'graph',
    fields: ['answer'],
    params: {
      kind: 'all-topological-orders',
      directed: true,
      vertices: ['a', 'b'],
      edges: [
        ['a', 'b'],
        ['b', 'a'],
      ],
    },
  };
  assert.throws(() => validateGraphRequirement(r));
  assert.throws(() =>
    validateGraphRequirement({
      ...r,
      params: { ...r.params, vertices: Array.from({ length: 9 }, (_, i) => String(i)), edges: [] },
    }),
  );
});
