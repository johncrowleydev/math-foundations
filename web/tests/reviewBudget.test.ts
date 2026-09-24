import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import 'fake-indexeddb/auto';
import { all, clearLocalWork, get, integrate, put } from '../src/storage';
import {
  localReviewBudget,
  migrateReviewBudget,
  reviewBudgetKey,
  savedReviewBudget,
  saveReviewBudget,
} from '../src/reviewBudget';
import type { RecordData } from '../src/types';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { addEventListener() {} },
});

const accountTarget = (value: number, revision = 1): RecordData => ({
  key: reviewBudgetKey,
  id: 'account-target-' + revision,
  payload: { value },
  revision,
  device: 'another-device',
  updated: Date.now(),
  versions: [],
  conflicts: [],
});

beforeEach(async () => {
  await clearLocalWork();
  values.clear();
});

test('legacy defaults stay local; an existing nondefault target initializes the shared preference once', async () => {
  for (const value of ['', '25', '0', '61', '25.5', 'invalid']) {
    localStorage.setItem('review-budget-minutes', value);
    assert.equal(localReviewBudget(), 25);
    await migrateReviewBudget();
    assert.equal((await all('outbox')).length, 0);
  }
  localStorage.setItem('review-budget-minutes', '60');
  await Promise.all([migrateReviewBudget(), migrateReviewBudget()]);
  const [op] = await all<any>('outbox');
  assert.equal((await all('outbox')).length, 1);
  assert.equal(op.data.ifAbsent, true);
  assert.deepEqual(op.data.payload, { value: 60 });
  assert.equal(await savedReviewBudget(), 60);
});

test('the shared preference wins over a stale legacy value, including an explicit default of 25', async () => {
  localStorage.setItem('review-budget-minutes', '60');
  await integrate([accountTarget(25)], 1);
  await migrateReviewBudget();
  assert.equal(await savedReviewBudget(), 25);
  assert.equal((await all('outbox')).length, 0);
});

test('offline edits coalesce to the latest choice and survive an older server download', async () => {
  await integrate([accountTarget(25)], 1);
  await saveReviewBudget(60);
  await saveReviewBudget(45);
  const [op] = await all<any>('outbox');
  assert.equal((await all('outbox')).length, 1);
  assert.equal(op.data.ifAbsent, undefined);
  assert.deepEqual(op.data.payload, { value: 45 });
  assert.equal(op.data.base, 1);
  await integrate([accountTarget(30, 2)], 2);
  assert.equal(await savedReviewBudget(), 45, 'Pending choice stays visible until accepted');
  assert.equal((await get<RecordData>('records', reviewBudgetKey))?.payload.value, 30);
  await saveReviewBudget(25);
  assert.equal(await savedReviewBudget(), 25, 'Explicit default is a real synced change');
  assert.equal((await all('outbox')).length, 1);
  assert.deepEqual((await all<any>('outbox'))[0].data.payload, { value: 25 });
});

test('invalid targets never enter local records or the outgoing queue', async () => {
  for (const value of [0, 4, 61, 25.5, NaN, Infinity, '60' as unknown as number])
    await assert.rejects(saveReviewBudget(value), /between 5 and 60/);
  assert.equal((await all('outbox')).length, 0);
  assert.equal(await get('records', reviewBudgetKey), undefined);
});

test('migration consumes the existing server preference even when its change is before the local cursor', async () => {
  localStorage.setItem('review-budget-minutes', '60');
  await put('settings', 'cursor', 100);
  const savedFetch = globalThis.fetch;
  const existing = accountTarget(30, 10);
  let migrations = 0;
  try {
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      let body: unknown = { records: [], cursor: 100, more: false, attempts: [] };
      if (path.endsWith('/auth/session'))
        body = { email: 'review-target@example.test', expires: Date.now() + 60000 };
      else if (path.endsWith('/mutations')) {
        const mutation = JSON.parse(String(init?.body));
        assert.equal(mutation.key, reviewBudgetKey);
        assert.equal(mutation.ifAbsent, true);
        migrations++;
        body = existing;
      }
      return new Response(JSON.stringify(body));
    };
    const { verifySession } = await import('../src/auth');
    const { sync } = await import('../src/sync');
    assert.equal(await verifySession(), true);
    await sync();
    assert.equal(migrations, 1);
    assert.equal(await savedReviewBudget(), 30);
    assert.equal((await all('outbox')).length, 0);
    assert.equal(await get('settings', 'cursor'), 100);
    await sync();
    assert.equal(migrations, 1, 'Later sync does not remigrate the legacy setting');
  } finally {
    globalThis.fetch = savedFetch;
  }
});
