import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Assessment } from '../../shared/assessment.js';
import { validateAcceptedAnswer } from '../../tools/content/accepted-answers.js';

function question() {
  const assessment: Assessment = {
    version: 1,
    inputs: [{ id: 'formula', kind: 'math', label: 'Formula' }],
    requirements: [
      {
        id: 'formula',
        validator: 'quantified-formula',
        fields: ['formula'],
        params: { expected: 'exists x in D !P(x)', domains: ['D', 'E'], predicates: { P: 1 } },
        description: 'The formulas are equivalent.',
      },
    ],
    solution: { formula: '\\exists x\\in D\\,\\neg P(x)' },
    feedback: {
      correct: 'There is an object that does not satisfy the predicate.',
      incorrect: 'Try again.',
    },
    evidence: { level: 'production', interactionCost: 'low', inputCapabilities: ['math-text'] },
  };
  return { answer: assessment.feedback.correct, assessment };
}

test('an English explanation and correct fixtures cannot substitute for an accepted answer', () => {
  const q = question();
  delete q.assessment.solution;
  assert.throws(
    () => validateAcceptedAnswer(q, 'example-1'),
    /example-1: an authored accepted answer/,
  );
});

test('displayed answers are rejected for prose, invalid notation, ambiguous domains and wrong meaning', () => {
  for (const formula of [
    'There is an object that does not satisfy the predicate.',
    'exists x !P(x)',
    'forall x in D !P(x)',
    'exists x in D (',
  ]) {
    const q = question();
    q.assessment.solution = { formula };
    assert.throws(
      () => validateAcceptedAnswer(q, 'example-1'),
      /displayed accepted answer must pass/,
    );
  }
});

test('equivalent accepted notation is allowed, but requested formula form is enforced', () => {
  const q = question();
  q.assessment.solution = { formula: '\\exists y\\in D\\,\\neg P(y)' };
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'example-1'));
  q.assessment.requirements[0].params.form = 'nnf';
  q.assessment.solution = { formula: '!(forall x in D P(x))' };
  assert.throws(
    () => validateAcceptedAnswer(q, 'example-1'),
    /displayed accepted answer must pass/,
  );
});

test('accepted parser shorthand cannot be published as mathematical TeX', () => {
  const q = question();
  q.assessment.solution = { formula: 'exists x in D !P(x)' };
  assert.throws(() => validateAcceptedAnswer(q, 'shorthand'), /Use TeX notation/);
  q.assessment.requirements[0].validator = 'boolean-formula';
  q.assessment.requirements[0].params = { expected: 'p&q', variables: ['p', 'q'] };
  q.assessment.solution = { formula: 'p&q' };
  assert.throws(
    () => validateAcceptedAnswer(q, 'invalid-tex'),
    /displayed accepted answer must pass/,
  );
  q.assessment.solution = { formula: 'p\\land q' };
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'rendered-tex'));
  for (const expected of ['!p', 'p|q']) {
    q.assessment.requirements[0].params.expected = expected;
    q.assessment.solution = { formula: expected };
    assert.throws(() => validateAcceptedAnswer(q, 'logical-shorthand'), /Use TeX notation/);
  }
});

test('the accepted answer must satisfy every input and requirement in a mixed assessment', () => {
  const q = question();
  q.assessment.inputs.push({ id: 'number', kind: 'math', label: 'Number' });
  q.assessment.requirements.push({
    id: 'number',
    validator: 'exact',
    fields: ['number'],
    params: { expected: ['3'] },
    description: 'The number is correct.',
  });
  assert.throws(
    () => validateAcceptedAnswer(q, 'example-2'),
    /displayed accepted answer must pass/,
  );
  q.assessment.solution!.number = '2';
  assert.throws(
    () => validateAcceptedAnswer(q, 'example-2'),
    /displayed accepted answer must pass/,
  );
  q.assessment.solution!.number = '3';
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'example-2'));
  q.assessment.solution!.unknown = '3';
  assert.throws(
    () => validateAcceptedAnswer(q, 'example-2'),
    /displayed accepted answer must pass/,
  );
});

test('the publication rule applies to numeric assessments without any formula validators', () => {
  const q = question();
  q.assessment.requirements[0].validator = 'exact';
  q.assessment.requirements[0].params = { expected: ['3'] };
  q.assessment.solution = { formula: '3' };
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'number'));
  q.assessment.solution = { formula: '4' };
  assert.throws(() => validateAcceptedAnswer(q, 'number'), /displayed accepted answer must pass/);
});

test('interval endpoints must also use rendered mathematical TeX', () => {
  const q = question();
  q.assessment.inputs = [{ id: 'range', kind: 'interval', label: 'Range' }];
  q.assessment.requirements = [
    {
      id: 'range',
      validator: 'interval',
      fields: ['range.lower', 'range.upper', 'range.leftClosed', 'range.rightClosed'],
      params: { lower: '2', upper: 'infinity', leftClosed: true, rightClosed: false },
      description: 'The interval is correct.',
    },
  ];
  q.assessment.solution = {
    'range.lower': '2',
    'range.upper': 'infinity',
    'range.leftClosed': true,
    'range.rightClosed': false,
  };
  assert.throws(() => validateAcceptedAnswer(q, 'interval'), /Use TeX notation/);
  q.assessment.solution['range.upper'] = '\\infty';
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'interval'));
});

test('choice reveals must identify an actual nonempty option; open questions need model answers', () => {
  const q = {
    answer: 'Explanation.',
    choice: {
      correctOption: 'a',
      options: [
        { id: 'a', text: 'First answer' },
        { id: 'b', text: 'Second answer' },
      ],
    },
  };
  assert.doesNotThrow(() => validateAcceptedAnswer(q, 'choice'));
  q.choice.correctOption = 'missing';
  assert.throws(() => validateAcceptedAnswer(q, 'choice'), /revealed correct option/);
  q.choice.correctOption = 'a';
  q.choice.options[0].text = ' ';
  assert.throws(() => validateAcceptedAnswer(q, 'choice'), /revealed correct option/);
  assert.doesNotThrow(() => validateAcceptedAnswer({ answer: 'A prose proof.' }, 'open'));
  assert.throws(() => validateAcceptedAnswer({}, 'open'), /model answer is required/);
});
