import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {
  put,
  get,
  integrate,
  emptyDraft,
  exportData,
  importData,
  clearLocalWork,
} from '../src/storage';
import type { Attempt, RecordData } from '../src/types';

test('transcription sync retires the submitted image and preserves photo origin through export/import', async () => {
  const h = 'a'.repeat(64);
  const a: Attempt = {
    id: 'photo-retention',
    exercise: 'logic-retention',
    submitted: 10,
    contentVersion: 'v1',
    mode: 'photo',
    text: '',
    images: [h],
    photos: [{ hash: h, rotation: 0 }],
    revealed: false,
    status: 'pending',
    grades: [],
  };
  await put('attempts', a.id, a);
  await put('media', h, new Blob(['image']));
  await put('drafts', a.exercise, {
    ...emptyDraft(),
    mode: 'photo',
    photos: a.photos,
    editing: false,
    recovery: false,
  });
  const saved = {
    ...a,
    images: [],
    photos: undefined,
    status: 'graded',
    transcription: '$p \\to q$',
    verdict: 'correct',
    grades: [{ at: 20, verdict: 'correct', feedback: 'Correct.', transcription: '$p \\to q$' }],
  };
  const r = {
    key: 'attempt/' + a.id,
    id: 'version-1',
    revision: 100,
    payload: saved,
    versions: [],
    conflicts: [],
    device: 'Grader',
    updated: 20,
  } as RecordData;
  await integrate([r], 100);
  assert.equal(await get('media', h), undefined);
  assert.deepEqual((await get<any>('drafts', a.exercise)).photos, []);
  const result = await get<Attempt>('attempts', a.id);
  assert.equal(result?.mode, 'photo');
  assert.equal(result?.transcription, saved.transcription);
  const data = JSON.parse(await (await exportData()).text());
  data.attempts = [['imported-transcript', { ...saved, id: 'imported-transcript' }]];
  data.records = [];
  data.drafts = [];
  data.outbox = [];
  data.media = [];
  await importData(new Blob([JSON.stringify(data)]), 'transcription.json');
  assert.equal(
    (await get<Attempt>('attempts', 'imported-transcript'))?.transcription,
    saved.transcription,
  );
});

test('transcription sync keeps a photo reused by an active draft', async () => {
  const h = 'b'.repeat(64);
  const a: Attempt = {
    id: 'shared-photo',
    exercise: 'logic-shared',
    submitted: 10,
    contentVersion: 'v1',
    mode: 'photo',
    text: '',
    images: [h],
    revealed: false,
    status: 'pending',
    grades: [],
  };
  await put('attempts', a.id, a);
  await put('media', h, new Blob(['image']));
  await put('drafts', 'another-exercise', {
    ...emptyDraft(),
    photos: [{ hash: h, rotation: 0 }],
    editing: true,
  });
  const r = {
    key: 'attempt/' + a.id,
    id: 'version-2',
    revision: 101,
    payload: {
      ...a,
      images: [],
      transcription: 'x',
      grades: [{ at: 20, verdict: 'correct', feedback: 'Correct.', transcription: 'x' }],
    },
    versions: [],
    conflicts: [],
    device: 'Grader',
    updated: 20,
  } as RecordData;
  await integrate([r], 101);
  assert.ok(await get('media', h));
  assert.equal((await get<any>('drafts', 'another-exercise')).photos[0].hash, h);
});

test('legacy retired history remains readable without authorizing draft or media deletion', async () => {
  await clearLocalWork();
  const h = 'c'.repeat(64);
  const a: Attempt = {
    id: 'legacy-transcript',
    exercise: 'logic-legacy',
    submitted: 10,
    contentVersion: 'v1',
    mode: 'photo',
    text: '',
    images: [],
    revealed: false,
    status: 'graded',
    verdict: 'correct',
    transcription: 'Old transcript.',
    grades: [],
  };
  const draft = {
    ...emptyDraft(),
    mode: 'photo',
    photos: [{ hash: h, rotation: 0 }],
    editing: false,
  };
  await put('media', h, new Blob(['original scratchwork']));
  await put('drafts', a.exercise, draft);
  await integrate(
    [
      {
        key: 'attempt/' + a.id,
        payload: a,
        revision: 1,
        id: 'legacy-record',
        device: 'server',
        updated: 20,
        versions: [],
        conflicts: [],
      },
    ],
    1,
  );
  assert.deepEqual(await get('attempts', a.id), a);
  assert.deepEqual(await get('drafts', a.exercise), draft);
  assert.ok(await get('media', h));
});
