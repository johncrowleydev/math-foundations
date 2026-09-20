import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all, clearLocalWork, get, integrate, saveAttempt } from '../src/storage';
import type { Attempt } from '../src/types';

const originalWindow = globalThis.window;
globalThis.window = { addEventListener() {} } as unknown as Window & typeof globalThis;
const { acknowledgedAttempt } = await import('../src/sync');
globalThis.window = originalWindow;

const submitted: Attempt = {
  id: 'offline-answer',
  exercise: 'functions-1',
  submitted: 1000,
  contentVersion: 'frozen-version',
  mode: 'structured',
  response: { answer: 'yes' },
  text: '',
  images: [],
  revealed: false,
  status: 'graded',
  verdict: 'correct',
  grades: [{ at: 1000, verdict: 'correct', feedback: 'Correct.' }],
};

test('malformed or mismatched acknowledgements cannot replace a queued answer', () => {
  for (const bad of [
    null,
    {},
    [],
    { ...submitted, id: 'different' },
    { ...submitted, exercise: 'functions-7' },
    { ...submitted, submitted: 2000 },
    { ...submitted, contentVersion: 'new-version' },
    { ...submitted, text: 'A different original response' },
    { ...submitted, revealed: true },
    { ...submitted, status: 'unknown' },
    { ...submitted, grades: null },
    { ...submitted, grades: [{}] },
    { ...submitted, grades: [] },
    { ...submitted, verdict: 'incorrect' },
    { ...submitted, response: {} },
    { ...submitted, response: { answer: 'no' } },
  ])
    assert.throws(() => acknowledgedAttempt(bad, submitted), /answer remains queued/);
  assert.deepEqual(acknowledgedAttempt(submitted, submitted), submitted);
});

test('acknowledgements allow authoritative regrading and unordered structured fields', () => {
  const original = { ...submitted, response: { x: '1', y: '2' } };
  const saved = {
    ...original,
    response: { y: '2', x: '1' },
    verdict: 'incorrect',
    grades: [{ at: 2000, verdict: 'incorrect', feedback: 'Check your calculation.' }],
  };
  assert.deepEqual(acknowledgedAttempt(saved, original), saved);
});

test('acknowledgements preserve supported pending and transcribed media lifecycle', () => {
  const original = {
    ...submitted,
    mode: 'photo',
    response: undefined,
    images: ['image-hash'],
    photos: [{ hash: 'image-hash', rotation: 0 }],
    status: 'queued',
    verdict: undefined,
    grades: [],
  };
  for (const status of ['pending', 'grading', 'not_graded', 'cancelled', 'error']) {
    const saved = { ...original, status };
    assert.deepEqual(acknowledgedAttempt(saved, original), saved);
  }
  const transcribed = {
    ...original,
    images: [],
    photos: undefined,
    transcription: 'x = 2',
    status: 'graded',
    verdict: 'correct',
    grades: submitted.grades,
  };
  assert.deepEqual(acknowledgedAttempt(transcribed, original), transcribed);
  const historical = { ...original, status: 'graded', verdict: 'correct', grades: [] };
  assert.deepEqual(acknowledgedAttempt(historical, original), historical);
});

test('malformed downloaded attempts cannot erase pending answers or advance the cursor', async () => {
  const record = (payload: Record<string, unknown>, revision = 1) => ({
    key: 'attempt/' + submitted.id,
    payload,
    revision,
    id: 'server-record',
    device: 'server',
    updated: 1000,
    versions: [],
    conflicts: [],
  });
  for (const malformed of [
    record({ id: submitted.id }),
    record({ ...submitted, id: 'wrong-key' }),
    record({ ...submitted, response: undefined }),
    record({ ...submitted, grades: [{}] }),
    record(submitted, NaN),
  ]) {
    await clearLocalWork();
    await saveAttempt(submitted);
    const before = await Promise.all(['attempts', 'outbox', 'records'].map(all));
    await assert.rejects(
      integrate([record(submitted), malformed], 20),
      /local work remains unchanged/,
    );
    assert.deepEqual(await Promise.all(['attempts', 'outbox', 'records'].map(all)), before);
    assert.equal(await get('settings', 'cursor'), undefined);
    await integrate([record(submitted)], 1);
    assert.deepEqual(await get('attempts', submitted.id), submitted);
    assert.equal((await all('outbox')).length, 0);
  }
});

test('download preserves not-graded feedback and historical open grades without inventing history', async () => {
  await clearLocalWork();
  const base = { ...submitted, mode: 'type', response: undefined, text: 'Original proof.' };
  const historical = { ...base, id: 'historical-proof', grades: [] };
  const unreadable = {
    ...base,
    id: 'unreadable-proof',
    status: 'not_graded',
    verdict: '',
    grades: [{ at: 1100, verdict: 'not_graded', feedback: 'Unable to resolve the response.' }],
  };
  const records = [historical, unreadable].map((payload, i) => ({
    key: 'attempt/' + payload.id,
    payload,
    revision: i + 1,
    id: 'saved-' + payload.id,
    device: 'server',
    updated: 1100,
    versions: [],
    conflicts: [],
  }));
  await integrate(records, 2);
  assert.deepEqual(await get('attempts', historical.id), historical);
  assert.deepEqual(await get('attempts', unreadable.id), unreadable);
});
