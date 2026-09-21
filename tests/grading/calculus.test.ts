import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validateAssessment } from '../../shared/deterministic';
import type { Assessment, StructuredResponse } from '../../shared/assessment';
const fixtures = JSON.parse(
  await readFile('tests/grading/fixtures/calculus-fixtures.json', 'utf8'),
) as {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[];
for (const f of fixtures)
  test('calculus: ' + f.name, () => {
    validateAssessment(f.assessment);
    if (f.error) assert.throws(() => gradeAssessment(f.assessment, f.response), InputError);
    else assert.equal(gradeAssessment(f.assessment, f.response).verdict, f.verdict);
  });
test('calculus definitions reject unknown domains and missing initial conditions', () => {
  for (const params of [
    { variables: ['C'], expected: 'C' },
    { variables: ['x'], expected: 'x', domain: { negative: ['x'] } },
    { variable: 'x', integrand: 'x', mode: 'initial-value' },
  ]) {
    const a = structuredClone(fixtures[0].assessment);
    a.requirements[0].params = params;
    if ('integrand' in params) a.requirements[0].validator = 'antiderivative';
    assert.throws(() => validateAssessment(a));
  }
});

test('a gradient checks every component through existing requirements', () => {
  const a = structuredClone(fixtures[0].assessment);
  a.inputs = [
    { id: 'dx', kind: 'math', label: 'Partial derivative with respect to x' },
    { id: 'dy', kind: 'math', label: 'Partial derivative with respect to y' },
  ];
  a.requirements = ['dx', 'dy'].map((field, i) => ({
    id: field,
    description: 'Correct partial derivative',
    validator: 'calculus-expression',
    fields: [field],
    params: { variables: ['x', 'y'], expected: i ? 'x^2' : '2*x*y' },
  }));
  validateAssessment(a);
  assert.equal(gradeAssessment(a, { dx: '2*x*y', dy: 'x^2' }).verdict, 'correct');
  assert.equal(gradeAssessment(a, { dx: '2*x*y', dy: '2*x' }).verdict, 'incorrect');
});
