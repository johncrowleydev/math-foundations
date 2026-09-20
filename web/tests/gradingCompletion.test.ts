import test from 'node:test';
import assert from 'node:assert/strict';
import { gradingCompleted } from '../src/gradingCompletion';
import type { Attempt } from '../src/types';

const pending: Attempt = {
  id: 'notification-test',
  exercise: 'logic-1',
  submitted: 1,
  contentVersion: 'test',
  mode: 'type',
  text: 'Synthetic answer',
  images: [],
  revealed: false,
  status: 'grading',
  grades: [],
};
const graded: Attempt = {
  ...pending,
  status: 'graded',
  verdict: 'correct',
  grades: [{ verdict: 'correct', feedback: 'Synthetic feedback', at: 2 }],
};

test('only new grading completions notify, not history or repeated syncs', () => {
  assert.equal(gradingCompleted(undefined, graded), false);
  assert.equal(gradingCompleted(pending, graded), true);
  assert.equal(gradingCompleted(graded, graded), false);
  for (const status of ['queued', 'pending', 'grading', 'rechecking'])
    assert.equal(gradingCompleted({ ...pending, status }, graded), true);
  for (const status of ['pending', 'error', 'cancelled'])
    assert.equal(gradingCompleted(pending, { ...pending, status }), false);
  assert.equal(gradingCompleted(pending, { ...graded, status: 'not_graded' }), true);
});

test('completed rechecks notify even when the intermediate status was not polled', () => {
  assert.equal(
    gradingCompleted(graded, {
      ...graded,
      grades: [...graded.grades, { ...graded.grades[0], at: 3 }],
    }),
    true,
  );
  assert.equal(gradingCompleted({ ...graded, status: 'rechecking' }, graded), true);
});
