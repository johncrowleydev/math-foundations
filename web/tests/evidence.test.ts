import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { summarize, conceptRows, metadata } from '../src/analytics';
import { EffortClock } from '../src/effort';
import { snapshot, type EvidenceCatalog } from '../src/evidenceTypes';
import type { Attempt } from '../src/types';
import { put, get, exportData, importData, clearLocalWork, all, deviceId } from '../src/storage';
const catalog: EvidenceCatalog = {
  version: 'one',
  concepts: [{ id: 'generic', name: 'Generic' }],
  skills: [{ id: 'prove', name: 'Prove' }],
  representations: [{ id: 'proof', name: 'Proof' }],
  teaching: [],
  exercises: {
    'test-1': {
      concepts: [{ concept: 'generic', role: 'primary' }],
      skills: [{ skill: 'prove', role: 'primary' }],
      representations: ['proof'],
    },
  },
};
test('missing first-attempt metadata cannot turn a mapped retry into first-try success', () => {
  const first = a('first', 'incorrect', 1),
    next = a('next', 'correct', 2);
  next.analytics = snapshot(catalog, 'test-1');
  const s = conceptRows([first, next], catalog)[0].summary;
  assert.equal(s.observed, 1);
  assert.equal(s.firstObserved, 0);
  assert.equal(s.firstCorrect, 0);
});
const a = (id: string, v: string, t: number): Attempt => ({
  id,
  exercise: 'test-1',
  submitted: t,
  contentVersion: 'one',
  mode: 'type',
  text: 'Synthetic',
  images: [],
  revealed: false,
  status: v === 'not_graded' ? 'not_graded' : 'graded',
  verdict: v,
  grades: [{ verdict: v, feedback: 'Synthetic', at: t }],
});
test('first gradable success differs from completion; not graded is not a failure or retry', () => {
  const s = summarize([a('0', 'not_graded', 1), a('1', 'incorrect', 2), a('2', 'correct', 3)]);
  assert.equal(s.firstCorrect, 0);
  assert.equal(s.completed, 1);
  assert.equal(s.retries, 1);
  assert.equal(s.notGraded, 1);
  assert.equal(s.totalAttempts, 3);
});
test('overturned rechecks replace effective evidence without new submissions', () => {
  const x = a('one', 'incorrect', 1);
  x.grades.push({ verdict: 'correct', feedback: 'Corrected', at: 2 });
  const s = summarize([x]);
  assert.equal(s.firstCorrect, 1);
  assert.equal(s.retries, 0);
  assert.equal(s.correction, 0);
});
test('diagnoses count affected attempts once; prompt omissions are not conceptual trouble', () => {
  const x = a('one', 'incorrect', 1);
  x.grades[0].diagnosis = [
    {
      class: 'prompt-compliance',
      severity: 'substantive',
      tags: ['missing-requested-justification'],
    },
    { class: 'clerical', severity: 'minor' },
  ];
  const s = summarize([x]);
  assert.equal(s.substantive, 0);
  assert.equal(s.minor, 1);
  assert.equal(s.unknown, 0);
});
test('snapshot survives taxonomy edits and supporting roles do not inflate primary counts', () => {
  const x = a('one', 'correct', 1);
  x.analytics = snapshot(catalog, 'test-1');
  const edited = structuredClone(catalog);
  edited.exercises['test-1'].concepts[0].role = 'supporting';
  assert.equal(metadata(x, edited)?.concepts[0].role, 'primary');
  assert.equal(conceptRows([x], edited)[0].summary.observed, 1);
  assert.equal(conceptRows([a('old', 'correct', 1)], edited)[0].summary.observed, 0);
});
test('effort excludes background and caps idle gaps; reload retains only accumulated time', () => {
  const c = new EffortClock();
  c.touch(1000);
  c.touch(5000);
  c.touch(100000);
  assert.equal(c.activeDurationMs, 34000);
  c.pause(101000);
  c.touch(999999);
  assert.equal(c.activeDurationMs, 35000);
  const next = new EffortClock(c.value());
  next.touch(1000000);
  assert.equal(next.activeDurationMs, 35000);
});
test('version 2 export/import retains analytics, timing, assistance, uncertainty and diagnostics', async () => {
  await clearLocalWork();
  const x = a('roundtrip', 'incorrect', 2000);
  Object.assign(x, {
    analytics: snapshot(catalog, 'test-1'),
    startedAt: 1000,
    activeDurationMs: 500,
    unsure: true,
    assistance: {
      answerPreviouslyRevealed: true,
      priorIncorrectFeedbackSeen: true,
      copiedFromRetry: true,
    },
  });
  x.grades[0].diagnosis = [
    {
      class: 'reasoning',
      severity: 'substantive',
      tags: ['synthetic'],
      concepts: ['generic'],
      skills: ['prove'],
    },
  ];
  x.grades[0].requirements = [{ id: 'proof', description: 'Show a proof', satisfied: false }];
  x.grades[0].confidence = 'high';
  await put('attempts', x.id, x);
  const file = await exportData(catalog);
  const exported = JSON.parse(await file.text());
  assert.equal(exported.version, 2);
  assert.equal(exported.evidenceCatalog.version, 'one');
  await clearLocalWork();
  await importData(file, 'roundtrip');
  assert.deepEqual(await get('attempts', x.id), x);
  exported.attempts[0][1].activeDurationMs = -1;
  await assert.rejects(importData(new Blob([JSON.stringify(exported)]), 'invalid'));
});

test('fresh profile exposure uses one real device ID even with concurrent first calls', async () => {
  await clearLocalWork();
  const originalWindow = globalThis.window;
  globalThis.window = { addEventListener() {} } as unknown as Window & typeof globalThis;
  const { expose } = await import('../src/exposure');
  globalThis.window = originalWindow;
  await Promise.all([
    expose('generic', 'lesson', 'section'),
    expose('generic', 'lesson', 'section'),
  ]);
  const device = await deviceId();
  assert.match(device, /^web-[0-9a-f-]{36}$/);
  await expose('generic', 'lesson', 'section');
  const records = (await all<any>('records')).filter((r) => r.key.startsWith('exposure/'));
  const outbox = (await all<any>('outbox')).filter((r) => r.data?.key.startsWith('exposure/'));
  assert.equal(records.length, 1);
  assert.equal(outbox.length, 1);
  assert.equal(records[0].key, `exposure/${device}:generic:lesson`);
  assert.equal(records[0].device, device);
  assert.equal(outbox[0].data.device, device);
  assert.deepEqual(await Promise.all([deviceId(), deviceId()]), [device, device]);
});

test('import rejects impossible effort in saved and queued attempts, preserving legacy attempts', async () => {
  await clearLocalWork();
  const x = a('effort-import', 'correct', 2000);
  await put('attempts', x.id, x);
  const backup = JSON.parse(await (await exportData(catalog)).text());
  for (const invalid of [
    { startedAt: 0 },
    { activeDurationMs: 0 },
    { startedAt: 2001 },
    { startedAt: 1000, activeDurationMs: 1001 },
    { startedAt: 1000.5 },
    { startedAt: 1000, activeDurationMs: 0.5 },
  ]) {
    for (const queued of [false, true]) {
      const data = structuredClone(backup);
      const attempt = { ...x, ...invalid };
      data.attempts = queued ? [] : [[x.id, attempt]];
      data.outbox = queued ? [[x.id, { id: x.id, kind: 'attempt', data: attempt }]] : [];
      await assert.rejects(importData(new Blob([JSON.stringify(data)]), 'invalid-effort'));
    }
  }
  for (const effort of [{}, { startedAt: 1000 }, { startedAt: 1000, activeDurationMs: 1000 }]) {
    const data = structuredClone(backup);
    data.attempts[0][1] = { ...x, ...effort };
    await clearLocalWork();
    await importData(new Blob([JSON.stringify(data)]), 'valid-effort');
    assert.deepEqual(await get('attempts', x.id), data.attempts[0][1]);
  }
});
