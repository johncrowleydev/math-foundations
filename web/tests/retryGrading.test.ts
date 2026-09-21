import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all, clearLocalWork, get, put, recoverEffortRejections } from '../src/storage';
import type { Attempt } from '../src/types';

const originalWindow = globalThis.window;
globalThis.window = { addEventListener() {} } as unknown as Window & typeof globalThis;
const { recheck } = await import('../src/sync');
globalThis.window = originalWindow;

const submitted: Attempt = {
  id: 'rejected-proof-attempt',
  exercise: 'synthetic-proof-1',
  contentVersion: 'original-version',
  mode: 'type',
  text: 'Synthetic saved proof.',
  images: [],
  revealed: false,
  submitted: 2000,
  startedAt: 1000,
  activeDurationMs: 500,
  status: 'queued',
  grades: [],
};

async function rejected(error = 'Update the app before submitting this exercise', a = submitted) {
  await clearLocalWork();
  const rejection = { id: a.id, kind: 'attempt', data: a, error };
  await put('settings', 'rejected:' + a.id, rejection);
  const failed = { ...a, status: 'error', error };
  await put('attempts', a.id, failed);
  return { failed, rejection };
}

test('retry uploads a rejected original submission instead of rechecking a nonexistent attempt', async () => {
  const { failed, rejection } = await rejected();
  await recheck(failed, '');
  const retry = { ...submitted, error: '' };
  assert.deepEqual(await all('outbox'), [{ id: submitted.id, kind: 'attempt', data: retry }]);
  assert.deepEqual(await get('attempts', submitted.id), retry);
  assert.deepEqual(await get('settings', 'rejected:' + submitted.id), rejection);
  await recheck(failed, '');
  assert.equal((await all('outbox')).length, 1, 'repeated retry must not duplicate the upload');
});

test('old failed rechecks do not hide a recoverable effort rejection or leave a duplicate grading request', async () => {
  const original = { ...submitted, activeDurationMs: 1001 };
  const { rejection } = await rejected('Invalid effort metadata\n', original);
  for (const status of ['error', 'rechecking']) {
    await put('attempts', original.id, {
      ...original,
      status,
      error: 'sql: no rows in result set',
      activeJob: 'old-retry',
    });
    await put('outbox', 'old-retry', {
      id: 'old-retry',
      kind: 'recheck',
      attempt: original.id,
      data: { id: 'old-retry', reason: '' },
    });
    assert.equal(await recoverEffortRejections(), 1);
    const repaired = { ...original, activeDurationMs: 1000 };
    assert.deepEqual(await all('outbox'), [{ id: original.id, kind: 'attempt', data: repaired }]);
    assert.deepEqual(await get('attempts', original.id), repaired);
    assert.deepEqual(await get('settings', 'rejected:' + original.id), rejection);
    await clearLocalWork();
    await put('settings', 'rejected:' + original.id, rejection);
  }
});

test('retry repairs an effort rejection before queueing its original answer', async () => {
  const { failed } = await rejected('Invalid effort metadata', {
    ...submitted,
    activeDurationMs: 1001,
  });
  await recheck(failed, '');
  assert.deepEqual(await all('outbox'), [
    { id: submitted.id, kind: 'attempt', data: { ...submitted, activeDurationMs: 1000 } },
  ]);
});

test('a confirmed attempt keeps its grading history and uses a real recheck', async () => {
  const { failed, rejection } = await rejected();
  const accepted = {
    ...submitted,
    status: 'error',
    verdict: 'incorrect',
    grades: [{ at: 3000, verdict: 'incorrect', feedback: 'Explain the last step.' }],
  };
  await put('attempts', submitted.id, accepted);
  await put('records', 'attempt/' + submitted.id, { revision: 1, payload: accepted });
  await recheck(failed, 'Please reconsider the last step.');
  const queued = await all<any>('outbox');
  assert.equal(queued.length, 1);
  assert.equal(queued[0].kind, 'recheck');
  assert.equal(queued[0].attempt, submitted.id);
  assert.deepEqual((await get<Attempt>('attempts', submitted.id))?.grades, accepted.grades);
  assert.deepEqual(await get('settings', 'rejected:' + submitted.id), rejection);
});

test('effort recovery never overwrites a changed or already acknowledged response', async () => {
  const original = { ...submitted, activeDurationMs: 1001 };
  await rejected('Invalid effort metadata', original);
  await put('attempts', original.id, {
    ...original,
    status: 'error',
    error: 'sql: no rows in result set',
    activeDurationMs: 500,
  });
  const before = await Promise.all(['attempts', 'outbox', 'settings'].map(all));
  assert.equal(await recoverEffortRejections(), 0);
  assert.deepEqual(await Promise.all(['attempts', 'outbox', 'settings'].map(all)), before);
});
