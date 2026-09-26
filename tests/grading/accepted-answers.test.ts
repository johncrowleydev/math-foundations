import test from 'node:test';
import assert from 'node:assert/strict';
import type { Assessment } from '../../shared/assessment';
import {
  acceptedAnswerKey,
  indexAcceptedAnswers,
  resolveAcceptedAnswer,
} from '../../shared/acceptedAnswers';

const legacy: Assessment = {
  version: 1,
  inputs: [{ id: 'answer', kind: 'math', label: 'Value', hint: 'Enter the result.' }],
  requirements: [
    {
      id: 'value',
      validator: 'exact',
      fields: ['answer'],
      params: { expected: ['1/2'] },
      description: 'The value is correct.',
    },
  ],
  feedback: { correct: 'Correct.', incorrect: 'Try again.' },
  evidence: { level: 'production', interactionCost: 'low', inputCapabilities: ['math-text'] },
};
const current: Assessment = { ...legacy, solution: { answer: '1/2' } };

test('a frozen legacy assessment resolves a verified answer without changing its snapshot', () => {
  const snapshot = JSON.stringify(legacy);
  const frozen = Object.freeze(structuredClone(legacy));
  const published = {
    ...current,
    inputs: [{ ...current.inputs[0], hint: 'Use a number or a fraction.' }],
    feedback: { correct: 'An accepted fraction is shown.', incorrect: 'Try again.' },
  };
  const index = indexAcceptedAnswers([undefined, published, current]);
  assert.equal(Object.keys(index).length, 1);
  assert.deepEqual(resolveAcceptedAnswer(frozen, index), { answer: '1/2' });
  assert.equal(JSON.stringify(frozen), snapshot);
  assert.equal('solution' in frozen, false);
  assert.equal(resolveAcceptedAnswer(legacy), undefined);
  assert.equal(resolveAcceptedAnswer(current), current.solution);
  const withOwnAnswer = { ...current, solution: { answer: '0.5' } };
  assert.equal(resolveAcceptedAnswer(withOwnAnswer, index), withOwnAnswer.solution);
});

test('changed grader contracts or field meanings cannot reuse an accepted answer', () => {
  const index = indexAcceptedAnswers([current]);
  const differentValue = structuredClone(legacy);
  differentValue.requirements[0].params.expected = ['2'];
  assert.equal(resolveAcceptedAnswer(differentValue, index), undefined);
  const differentLabel = structuredClone(legacy);
  differentLabel.inputs[0].label = 'A different quantity';
  assert.equal(resolveAcceptedAnswer(differentLabel, index), undefined);
  const differentKind = structuredClone(legacy);
  differentKind.inputs[0] = { id: 'answer', kind: 'text', label: 'Value' };
  assert.equal(resolveAcceptedAnswer(differentKind, index), undefined);
  const differentValidator = structuredClone(legacy);
  differentValidator.requirements[0].validator = 'term';
  assert.equal(resolveAcceptedAnswer(differentValidator, index), undefined);
  assert.throws(() => indexAcceptedAnswers([legacy]), /without an accepted answer/);
});

test('contract identity ignores object ordering while preserving options and grid givens', () => {
  const reordered = {
    ...legacy,
    requirements: legacy.requirements.map((r) => ({
      params: r.params,
      description: r.description,
      fields: r.fields,
      validator: r.validator,
      id: r.id,
    })),
  };
  assert.equal(acceptedAnswerKey(reordered), acceptedAnswerKey(legacy));
  const choice: Assessment = {
    ...legacy,
    inputs: [
      { id: 'answer', kind: 'select', label: 'Value', options: [{ id: 'a', label: 'One' }] },
    ],
  };
  const changedChoice = structuredClone(choice);
  if (changedChoice.inputs[0].kind === 'select') changedChoice.inputs[0].options[0].label = 'Two';
  assert.notEqual(acceptedAnswerKey(choice), acceptedAnswerKey(changedChoice));
  const grid: Assessment = {
    ...legacy,
    inputs: [
      {
        id: 'grid',
        kind: 'grid',
        label: 'Table',
        columns: ['Given', 'Value'],
        rows: [{ cells: [{ given: '1' }, { id: 'answer', kind: 'text' }] }],
      },
    ],
  };
  const changedGrid = structuredClone(grid);
  if (changedGrid.inputs[0].kind === 'grid')
    changedGrid.inputs[0].rows[0].cells[0] = { given: '2' };
  assert.notEqual(acceptedAnswerKey(grid), acceptedAnswerKey(changedGrid));
});
