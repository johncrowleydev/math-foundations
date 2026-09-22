import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nextReviewTaskIndex,
  reviewTargetCovered,
  reviewSessionProgress,
} from '../src/reviewSessionProgress';
import type { Attempt } from '../src/types';
import type { ReviewInstance, ReviewSession, ReviewState, ReviewSummary } from '../src/reviewTypes';

const instance: ReviewInstance = {
  id: 'issued-transform',
  exercise: 'review-issued-transform',
  lesson: 'propositional-logic',
  question: { id: 900001, instructions: 'Synthetic review task.', section: 'review' },
  contentVersion: 'test',
  context: {
    instanceId: 'issued-transform',
    kind: 'scheduled-review',
    templateId: 'synthetic-transform',
    concept: 'distribution',
    skill: 'transform',
    objective: 'factor',
    scheduledFor: 100,
    presentedAt: 200,
    intervalDays: 1,
  },
};
const session: ReviewSession = {
  id: 'session',
  kind: 'scheduled-review',
  mode: 'regular',
  instances: [instance],
};
const state: ReviewState = {
  id: 'distribution-transform-factor',
  concept: 'distribution',
  skill: 'transform',
  objective: 'factor',
  dueAt: 500,
  lastEvidenceAt: 250,
  intervalDays: 1,
  activatedAt: 100,
  reason: 'New server evidence.',
  evidenceLevel: 'production',
  quick: false,
};
const summary: ReviewSummary = {
  due: 0,
  quick: 0,
  deeper: 0,
  targets: [state],
  concepts: [],
  skills: [],
  lessons: [],
};
const fetchedAt = 300;
function attempt(exercise: string, status: string, verdict?: string): Attempt {
  return {
    id: 'attempt-' + exercise,
    exercise,
    status,
    verdict,
    submitted: 250,
    contentVersion: 'test',
    mode: 'type',
    text: 'Synthetic saved response.',
    images: [],
    revealed: false,
    grades: [],
  };
}

test('new server evidence can cover an issued target without another answer', () => {
  assert.equal(reviewTargetCovered(session, instance, [], summary, fetchedAt), true);
  assert.equal(
    reviewTargetCovered(
      session,
      instance,
      [],
      { ...summary, targets: [{ ...state, lastEvidenceAt: 200 }] },
      fetchedAt,
    ),
    true,
    'Evidence recorded at issuance is included',
  );
  assert.equal(nextReviewTaskIndex(session, 0, [], summary, fetchedAt), 1);
  assert.equal(
    session.instances[0],
    instance,
    'The issued instance remains available for revisiting',
  );
});

test('old, due, missing, and different-objective evidence cannot retire a task', () => {
  for (const change of [
    { lastEvidenceAt: 199 },
    { lastEvidenceAt: undefined },
    { dueAt: fetchedAt },
    { dueAt: fetchedAt - 1 },
    { concept: 'another-concept' },
    { skill: 'justify' },
    { objective: 'expand' },
    { objective: undefined },
  ]) {
    assert.equal(
      reviewTargetCovered(
        session,
        instance,
        [],
        { ...summary, targets: [{ ...state, ...change }] },
        fetchedAt,
      ),
      false,
      JSON.stringify(change),
    );
  }
  assert.equal(reviewTargetCovered(session, instance, [], undefined, fetchedAt), false);
  assert.equal(reviewTargetCovered(session, instance, [], summary, undefined), false);
  assert.equal(
    reviewTargetCovered(session, instance, [], { ...summary, targets: [] }, fetchedAt),
    false,
  );
});

test('every own attempt remains accessible, including grading and failed work', () => {
  for (const saved of [
    attempt(instance.exercise, 'queued'),
    attempt(instance.exercise, 'grading'),
    attempt(instance.exercise, 'failed'),
    attempt(instance.exercise, 'graded', 'incorrect'),
    attempt(instance.exercise, 'graded', 'correct'),
  ]) {
    assert.equal(reviewTargetCovered(session, instance, [saved], summary, fetchedAt), false);
    assert.equal(nextReviewTaskIndex(session, 0, [saved], summary, fetchedAt), 0);
  }
});

test('focused practice is never retired by a server due summary', () => {
  const focused = { ...session, kind: 'focused-practice' as const };
  assert.equal(reviewTargetCovered(focused, instance, [], summary, fetchedAt), false);
  assert.equal(nextReviewTaskIndex(focused, 0, [], summary, fetchedAt), 0);
  assert.equal(
    reviewTargetCovered(
      session,
      { ...instance, context: { ...instance.context, kind: 'focused-practice' } },
      [],
      summary,
      fetchedAt,
    ),
    false,
  );
});

test('resume skips completed and newly covered targets while preserving pending work and order', () => {
  const issued = ['answered', 'covered', 'pending', 'due'].map((id) => ({
    ...instance,
    id,
    exercise: 'review-' + id,
    context: { ...instance.context, ...(id === 'due' ? { objective: 'expand' } : {}) },
  }));
  const saved = { ...session, instances: issued };
  const attempts = [
    attempt('review-answered', 'graded', 'correct'),
    attempt('review-pending', 'queued'),
  ];
  assert.equal(nextReviewTaskIndex(saved, 0, attempts, summary, fetchedAt, { resume: true }), 2);
  assert.equal(nextReviewTaskIndex(saved, 1, attempts, summary, fetchedAt), 2);
  assert.equal(nextReviewTaskIndex(saved, 3, attempts, summary, fetchedAt), 3);
  assert.equal(nextReviewTaskIndex(saved, 4, attempts, summary, fetchedAt), 4);
});

test('reopening from the end finds unfinished questions earlier in the session', () => {
  const saved = {
    ...session,
    instances: ['skipped', 'answered', 'covered'].map((id) => ({
      ...instance,
      id,
      exercise: 'review-' + id,
      context: { ...instance.context, ...(id === 'skipped' ? { objective: 'expand' } : {}) },
    })),
  };
  const attempts = [attempt('review-answered', 'graded', 'correct')];
  for (const position of [2, 3]) {
    assert.equal(
      nextReviewTaskIndex(saved, position, attempts, summary, fetchedAt, { resume: true }),
      0,
      'Saved positions at or near the end cannot hide an earlier skipped question',
    );
  }
  assert.equal(
    nextReviewTaskIndex(saved, 3, attempts, summary, fetchedAt),
    3,
    'Deliberately moving past the last question still reaches the question-list end',
  );
});

test('reopening fully answered or covered sessions opens a question, not a completion screen', () => {
  assert.equal(nextReviewTaskIndex(session, 0, [], summary, fetchedAt, { resume: true }), 0);
  assert.equal(nextReviewTaskIndex(session, 1, [], summary, fetchedAt, { resume: true }), 0);
  assert.equal(
    nextReviewTaskIndex(
      session,
      1,
      [attempt(instance.exercise, 'graded', 'correct')],
      undefined,
      undefined,
      { resume: true },
    ),
    0,
    'Answered work stays accessible offline',
  );
});

test('reopening preserves the saved unfinished position and wraps focused practice too', () => {
  const saved = {
    ...session,
    kind: 'focused-practice' as const,
    instances: ['earlier', 'current', 'last'].map((id) => ({ ...instance, id, exercise: id })),
  };
  assert.equal(nextReviewTaskIndex(saved, 1, [], summary, fetchedAt, { resume: true }), 1);
  assert.equal(nextReviewTaskIndex(saved, 3, [], summary, fetchedAt, { resume: true }), 0);
});

test('session progress counts successful and covered work, never visits or drafts', () => {
  const saved = {
    ...session,
    instances: ['correct', 'covered', 'queued', 'incorrect', 'skipped', 'failed'].map((id) => ({
      ...instance,
      id,
      exercise: id,
      context: { ...instance.context, ...(id === 'skipped' ? { objective: 'other' } : {}) },
    })),
  };
  const history = [
    attempt('correct', 'graded', 'correct'),
    attempt('queued', 'queued'),
    attempt('incorrect', 'graded', 'incorrect'),
    attempt('failed', 'error'),
  ];
  assert.deepEqual(reviewSessionProgress(saved, history, summary, fetchedAt), {
    total: 6,
    completed: 2,
    awaitingGrading: 1,
    remaining: 3,
    processing: 1,
    complete: false,
  });
  assert.equal(
    reviewSessionProgress({ ...saved, kind: 'focused-practice' }, history, summary, fetchedAt)
      .completed,
    1,
  );
});

test('completed sessions remain complete offline and while deterministic successes sync', () => {
  assert.deepEqual(
    reviewSessionProgress(
      session,
      [attempt(instance.exercise, 'queued', 'correct')],
      undefined,
      undefined,
    ),
    {
      total: 1,
      completed: 1,
      awaitingGrading: 0,
      remaining: 0,
      processing: 1,
      complete: true,
    },
  );
  assert.equal(reviewSessionProgress(session, [], summary, fetchedAt).complete, true);
  assert.equal(reviewSessionProgress(session, [], undefined, undefined).complete, false);
  assert.equal(
    reviewSessionProgress({ ...session, instances: [] }, [], summary, fetchedAt).complete,
    false,
  );
  for (const status of ['queued', 'pending', 'grading', 'rechecking']) {
    const progress = reviewSessionProgress(
      session,
      [attempt(instance.exercise, status)],
      summary,
      fetchedAt,
    );
    assert.equal(progress.complete, false);
    assert.equal(progress.awaitingGrading, 1);
    assert.equal(progress.remaining, 0);
  }
});
