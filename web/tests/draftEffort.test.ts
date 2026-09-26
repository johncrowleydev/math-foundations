import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { emptyDraft, get, put, saveDraftEffort } from '../src/storage';
import { EffortClock } from '../src/effort';
import type { Draft } from '../src/types';

test('pausing an older editor preserves the latest answer and draft metadata', async () => {
  const key = 'pause-latest';
  const previous = { ...emptyDraft(), startedAt: 1000, activeDurationMs: 50 };
  const current: Draft = {
    ...previous,
    text: 'Latest scratchwork',
    response: { value: 'latest response' },
    choiceId: 'latest-choice',
    unsure: true,
    revealed: true,
    photos: [{ hash: 'saved-photo', rotation: 90 }],
    updated: 2000,
    activeDurationMs: 150,
  };
  await put('drafts', key, current);
  await saveDraftEffort(key, previous, { startedAt: 1000, activeDurationMs: 200 });
  assert.deepEqual(await get('drafts', key), { ...current, activeDurationMs: 200 });
  // A later, shorter snapshot cannot reduce the accumulated effort.
  await saveDraftEffort(key, previous, { startedAt: 1000, activeDurationMs: 100 });
  assert.deepEqual(await get('drafts', key), { ...current, activeDurationMs: 200 });
});

test('an atomic pause follows an already queued answer write', async () => {
  const key = 'pause-queued';
  const previous = { ...emptyDraft(), startedAt: 1000, activeDurationMs: 10 };
  const current = { ...previous, text: 'Queued answer', unsure: true, updated: 1500 };
  await Promise.all([
    put('drafts', key, current),
    saveDraftEffort(key, previous, { startedAt: 1000, activeDurationMs: 200 }),
  ]);
  assert.deepEqual(await get('drafts', key), { ...current, activeDurationMs: 200 });
});

test('an older pause cannot restore effort after a retry or question change', async () => {
  const previous = {
    ...emptyDraft(),
    startedAt: 1000,
    activeDurationMs: 300,
    assessmentFingerprint: 'original',
  };
  const resets: Draft[] = [
    { ...previous, startedAt: undefined, activeDurationMs: 0, recovery: true },
    { ...previous, startedAt: 3000, activeDurationMs: 20, recovery: true },
    { ...previous, assessmentFingerprint: 'updated-question' },
    { ...previous, startedAt: undefined, recovery: true },
  ];
  for (const [index, current] of resets.entries()) {
    const key = 'pause-reset-' + index;
    await put('drafts', key, current);
    await saveDraftEffort(key, previous, { startedAt: 1000, activeDurationMs: 900 });
    assert.deepEqual(await get('drafts', key), current);
  }
});

test('first interaction can save effort before an answer; idle clocks do not flush again', async () => {
  const key = 'pause-first';
  const previous = emptyDraft();
  const clock = new EffortClock();
  assert.equal(clock.active, false);
  clock.touch(1000);
  assert.equal(clock.active, true);
  await saveDraftEffort(key, previous, clock.pause(1500));
  assert.equal(clock.active, false);
  assert.deepEqual(await get('drafts', key), {
    ...previous,
    startedAt: 1000,
    activeDurationMs: 500,
  });
  clock.pause(3000);
  assert.deepEqual(clock.value(), { startedAt: 1000, activeDurationMs: 500 });
});
