import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { importData, put, get, all, emptyDraft, exportData } from '../src/storage';
test('imports preserve conflicts, queued write attempts and media; corrupt imports are atomic', async () => {
  const draft = { ...emptyDraft(), text: 'Original', updated: 1 };
  await put('drafts', 'logic-1', draft);
  const blob = await exportData();
  const data = JSON.parse(await blob.text());
  data.drafts[0][1].text = 'Imported';
  data.drafts.push(['logic-2', { ...draft, text: 'New' }]);
  const result = await importData(new Blob([JSON.stringify(data)]), 'local.json');
  assert.equal(result.conflicts, 1);
  assert.equal((await get<any>('drafts', 'logic-1')).text, 'Original');
  assert.equal((await get<any>('drafts', 'logic-2')).text, 'New');
  assert.equal((await all('imports')).length, 1);
  data.drafts.push(['logic-3', { ...draft, text: 12 }]);
  await assert.rejects(importData(new Blob([JSON.stringify(data)]), 'bad.json'));
  assert.equal(await get('drafts', 'logic-3'), undefined);
  const pen = {
    id: 'pen-test',
    exercise: 'logic-4',
    submitted: 1,
    mode: 'write',
    text: '',
    images: [],
    grades: [],
    status: 'queued',
  };
  data.drafts = [];
  data.attempts = [['pen-test', pen]];
  data.outbox = [['pen-test', { id: 'pen-test', kind: 'attempt', data: pen }]];
  await importData(new Blob([JSON.stringify(data)]), 'pen.json');
  assert.equal((await get<any>('outbox', 'pen-test')).data.mode, 'write');
});

test('attempt reconciliation detects missing derived rows despite an advanced cursor', async () => {
  const { attemptsMatch, integrate, remove } = await import('../src/storage');
  const a = {
    id: 'repair-1',
    exercise: 'logic-1',
    submitted: 1,
    contentVersion: 'v',
    mode: 'type',
    text: 'Saved',
    images: [],
    revealed: false,
    status: 'graded',
    verdict: 'correct',
    grades: [],
  };
  const r = {
    key: 'attempt/repair-1',
    revision: 9,
    id: 'version-9',
    payload: a,
    device: 'server',
    updated: 1,
    versions: [],
    conflicts: [],
  };
  await integrate([r], 900);
  assert.equal(await attemptsMatch([{ key: r.key, revision: 9 }]), true);
  await remove('attempts', a.id);
  assert.equal(await attemptsMatch([{ key: r.key, revision: 9 }]), false);
  await integrate([r], 900);
  assert.equal(await attemptsMatch([{ key: r.key, revision: 9 }]), true);
  assert.equal((await get<any>('attempts', a.id)).verdict, 'correct');
});
