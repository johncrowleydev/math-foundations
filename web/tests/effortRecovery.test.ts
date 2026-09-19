import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import type { Attempt } from '../src/types';
import { validAttemptEffort } from '../src/evidenceValidation';
import { all, clearLocalWork, get, put, recoverEffortRejections } from '../src/storage';

const original: Attempt = {
  id: 'effort-rejected-attempt',
  exercise: 'review-instance',
  contentVersion: 'original-content',
  mode: 'choice',
  choiceId: 'proposition',
  text: 'A claim that is true or false.',
  images: [],
  revealed: false,
  startedAt: 1000,
  submitted: 2000,
  activeDurationMs: 1001,
  status: 'graded',
  verdict: 'correct',
  grades: [{ at: 2000, verdict: 'correct', feedback: 'A definite truth value.' }],
  assistance: {
    answerPreviouslyRevealed: false,
    priorIncorrectFeedbackSeen: false,
    copiedFromRetry: false,
  },
};
async function rejected(a = original, error = 'Invalid effort metadata\n') {
  await clearLocalWork();
  const record = { id: a.id, kind: 'attempt', data: a, error };
  await put('settings', 'rejected:' + a.id, record);
  await put('attempts', a.id, { ...a, status: 'error', error });
  return record;
}

test('requeues a rejected clock overrun without changing the response or original rejection', async () => {
  const rejection = await rejected();
  assert.equal(validAttemptEffort(original), false);
  assert.equal(await recoverEffortRejections(), 1);
  const repaired = { ...original, activeDurationMs: 1000 };
  assert.equal(validAttemptEffort(repaired), true);
  assert.deepEqual(await get('attempts', original.id), repaired);
  assert.deepEqual(await get('outbox', original.id), {
    id: original.id,
    kind: 'attempt',
    data: repaired,
  });
  assert.deepEqual(await get('settings', 'rejected:' + original.id), rejection);
  assert.equal(await recoverEffortRejections(), 0);
  assert.equal((await all('outbox')).length, 1);
});

test('an untouched rejected clock remains unknown; typed work keeps its original queued response', async () => {
  const a = { ...original, mode: 'type', status: 'queued', grades: [] };
  delete a.choiceId;
  delete a.verdict;
  delete a.startedAt;
  a.activeDurationMs = 0;
  await rejected(a);
  assert.equal(await recoverEffortRejections(), 1);
  const repaired = { ...a };
  delete repaired.activeDurationMs;
  assert.deepEqual(await get('attempts', a.id), repaired);
  assert.equal(validAttemptEffort(repaired), true);
});

test('does not rewrite accepted, queued, unrelated, or unexplained invalid submissions', async () => {
  for (const scenario of [
    'accepted',
    'queued',
    'different-error',
    'no-rejection',
    'wrong-operation',
    'valid-effort',
    'negative-duration',
    'future-start',
    'missing-start-positive-duration',
  ]) {
    const a = { ...original };
    if (scenario === 'valid-effort') a.activeDurationMs = 900;
    if (scenario === 'negative-duration') a.activeDurationMs = -1;
    if (scenario === 'future-start') a.startedAt = 2001;
    if (scenario === 'missing-start-positive-duration') delete a.startedAt;
    const rejection = await rejected(a, scenario === 'different-error' ? 'Other error' : undefined);
    if (scenario === 'accepted') await put('records', 'attempt/' + a.id, { payload: a });
    if (scenario === 'queued') await put('outbox', a.id, { id: a.id, kind: 'attempt', data: a });
    if (scenario === 'no-rejection') await put('settings', 'rejected:' + a.id, undefined);
    if (scenario === 'wrong-operation')
      await put('settings', 'rejected:' + a.id, { ...rejection, kind: 'recheck' });
    const before = await Promise.all(['attempts', 'outbox', 'settings', 'records'].map(all));
    assert.equal(await recoverEffortRejections(), 0, scenario);
    const after = await Promise.all(['attempts', 'outbox', 'settings', 'records'].map(all));
    assert.deepEqual(after, before, scenario);
  }
});
