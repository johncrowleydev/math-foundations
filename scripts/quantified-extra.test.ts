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

const subsetNegation = fixtures.find(
  (f) => f.name === 'subset-negation-restricted-exists',
)!.assessment;
for (const [name, expected, answer, verdict] of [
  [
    'plain existential',
    'exists x in U (A(x) and not B(x))',
    'exists x in A (x notin B)',
    'correct',
  ],
  ['renamed Unicode', 'exists x in U (A(x) and not B(x))', '∃z ∈ A (z ∉ B)', 'correct'],
  ['universal guard', 'forall x in U (A(x) -> B(x))', 'forall x in A (x in B)', 'correct'],
  [
    'universal is not conjunction',
    'forall x in U (A(x) and B(x))',
    'forall x in A (x in B)',
    'incorrect',
  ],
  [
    'existential is not implication',
    'exists x in U (A(x) -> B(x))',
    'exists x in A (x in B)',
    'incorrect',
  ],
  [
    'nested sets',
    'forall x in U (A(x) -> exists y in U (B(y) and x=y))',
    'forall x in A exists y in B (x=y)',
    'correct',
  ],
  ['restricted uniqueness', 'exists! x in U (A(x) and B(x))', 'exists! x in A B(x)', 'correct'],
  [
    'uniqueness stays restricted',
    'exists x in U (A(x) and B(x) and forall y in U (B(y) -> y=x))',
    'exists! x in A B(x)',
    'incorrect',
  ],
  ['negated restriction', 'exists x in U (A(x) and not B(x))', 'not forall x in A B(x)', 'correct'],
])
  test('named-set quantifiers: ' + name, () => {
    const assessment = structuredClone(subsetNegation);
    assessment.requirements[0].params.expected = expected;
    validateAssessment(assessment);
    assert.equal(gradeAssessment(assessment, { answer }).verdict, verdict);
  });

test('named-set restrictions require a declared unary set and an unambiguous universe', () => {
  for (const params of [{ domains: ['U', 'V'] }, { sets: ['B'] }, { predicates: { A: 2, B: 1 } }]) {
    const assessment = structuredClone(subsetNegation);
    Object.assign(assessment.requirements[0].params, params);
    assert.throws(() => gradeAssessment(assessment, { answer: 'exists x in A B(x)' }), InputError);
  }
  for (const answer of ['exists x in C B(x)', 'exists x in A B(y)', 'exists x in R B(x)'])
    assert.throws(() => gradeAssessment(subsetNegation, { answer }), InputError);
});

test('an explicitly configured domain takes precedence over a named set', () => {
  const parsed = parseQuantified('forall x in A B(x)', ['A'], { A: 1, B: 1 }, { sets: ['A'] });
  assert.ok(parsed.kind === 'quantifier');
  assert.equal(parsed.domain, 'A');
  assert.equal(parsed.body.kind, 'predicate');
});

test('implicit universal guards preserve NNF without excusing implications in the body', () => {
  const assessment = structuredClone(subsetNegation);
  Object.assign(assessment.requirements[0].params, {
    expected: 'forall x in U (not A(x) or B(x))',
    form: 'nnf',
  });
  validateAssessment(assessment);
  assert.equal(gradeAssessment(assessment, { answer: 'forall x in A B(x)' }).verdict, 'correct');
  assert.equal(
    gradeAssessment(assessment, { answer: 'forall x in A (A(x) -> B(x))' }).verdict,
    'incorrect',
  );
});
