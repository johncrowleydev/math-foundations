import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validateAssessment } from '../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../shared/assessment.js';
import { parseQuantified } from '../shared/quantified.js';
const fixtures = JSON.parse(await readFile('shared/quantified-extra-fixtures.json', 'utf8')) as {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[];
for (const f of fixtures)
  test('quantified-extra conformance: ' + f.name, () => {
    validateAssessment(f.assessment);
    if (f.error) assert.throws(() => gradeAssessment(f.assessment, f.response), InputError);
    else assert.equal(gradeAssessment(f.assessment, f.response).verdict, f.verdict);
  });

const uniqueness = fixtures.find(
  (f) => f.name === 'uniqueness-expansion-implicit-domain-tex',
)!.assessment;
for (const answer of [
  'exists x (P(x) and forall y (P(y) -> y = x))',
  '∃x (P(x) ∧ ∀y (P(y) → y = x))',
  'exists x in D (P(x) and forall y (P(y) -> y = x))',
  'exists x (P(x) and forall y in D (P(y) -> y = x))',
  'exists u: (P(u) and forall v, (P(v) -> v = u))',
])
  test('unambiguous domain is optional: ' + answer, () => {
    assert.equal(gradeAssessment(uniqueness, { answer }).verdict, 'correct');
  });

for (const answer of ['exists x P(x)', 'forall x forall y ((P(x) and P(y)) -> x = y)'])
  test('implicit domains do not excuse incomplete uniqueness: ' + answer, () => {
    assert.equal(gradeAssessment(uniqueness, { answer }).verdict, 'incorrect');
  });

for (const answer of [
  'exists x in R (P(x) and forall y (P(y) -> y = x))',
  'exists x (P(x) and forall y in R (P(y) -> y = x))',
  'exists x (P(x) and forall y (P(z) -> y = x))',
])
  test('implicit domains preserve validation: ' + answer, () => {
    assert.throws(() => gradeAssessment(uniqueness, { answer }), InputError);
  });

test('domain inference requires exactly one configured domain', () => {
  const assessment = structuredClone(uniqueness);
  assessment.requirements[0].params.domains = ['D', 'R'];
  validateAssessment(assessment);
  for (const answer of [
    'exists x (P(x) and forall y in D (P(y) -> y = x))',
    'exists x in D (P(x) and forall y (P(y) -> y = x))',
  ])
    assert.throws(() => gradeAssessment(assessment, { answer }), InputError);
  assert.equal(
    gradeAssessment(assessment, {
      answer: 'exists x in D (P(x) and forall y in D (P(y) -> y = x))',
    }).verdict,
    'correct',
  );
  assert.throws(() => parseQuantified('forall x P(x)', [], { P: 1 }), InputError);
});

test('an implicit integer domain retains integer comparison semantics', () => {
  const assessment = structuredClone(uniqueness);
  assessment.requirements[0].params = {
    expected: 'forall n in Z (n > 0)',
    domains: ['Z'],
    predicates: {},
  };
  validateAssessment(assessment);
  assert.equal(gradeAssessment(assessment, { answer: 'forall n (n >= 1)' }).verdict, 'correct');
});
