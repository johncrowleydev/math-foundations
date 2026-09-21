import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validatorNames } from '../../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../../shared/assessment.js';

const corpus = JSON.parse(
  await readFile('tests/grading/fixtures/deterministic-adversarial-corpus.json', 'utf8'),
) as {
  definitions: Record<string, Assessment>;
  cases: {
    name: string;
    definition: string;
    response: StructuredResponse;
    outcome: 'correct' | 'incorrect' | 'input-error';
  }[];
};
test('adversarial corpus covers every deterministic validator and outcome', () => {
  const families = new Map<string, Set<string>>();
  const names = new Set<string>();
  for (const c of corpus.cases) {
    assert.ok(!names.has(c.name), `Duplicate case ${c.name}`);
    names.add(c.name);
    const validator = corpus.definitions[c.definition].requirements[0].validator;
    const outcomes = families.get(validator) || new Set<string>();
    outcomes.add(c.outcome);
    families.set(validator, outcomes);
  }
  assert.deepEqual([...families.keys()].sort(), [...validatorNames].sort());
  for (const [validator, outcomes] of families)
    assert.deepEqual([...outcomes].sort(), ['correct', 'incorrect', 'input-error'], validator);
});
for (const c of corpus.cases)
  test('adversarial conformance: ' + c.name, () => {
    const definition = corpus.definitions[c.definition];
    if (c.outcome === 'input-error')
      assert.throws(() => gradeAssessment(definition, c.response), InputError);
    else assert.equal(gradeAssessment(definition, c.response).verdict, c.outcome);
  });
