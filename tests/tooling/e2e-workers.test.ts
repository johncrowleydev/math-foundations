import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runWithWorkers } from '../../e2e/support/workers.ts';

test('E2E workers bound concurrency, drain after failures, and preserve result order', async () => {
  const released: (() => void)[] = [];
  const started: number[] = [];
  const results = runWithWorkers([0, 1, 2, 3], 2, async (item) => {
    started.push(item);
    await new Promise<void>((resolve) => released.push(resolve));
    if (item === 1) throw Error('intentional spec failure');
    return item;
  });
  assert.deepEqual(started, [0, 1]);
  released[1]();
  await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2]);
  released[0]();
  await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2, 3]);
  released[2]();
  released[3]();
  const actual = await results;
  assert.deepEqual(
    actual.map((result) => result.status),
    ['fulfilled', 'rejected', 'fulfilled', 'fulfilled'],
  );
  assert.deepEqual(
    actual.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
    [0, 2, 3],
  );
});

test('invalid E2E worker counts fail without starting a spec', async () => {
  for (const workers of [0, -1, 5, 1.5, NaN]) {
    await assert.rejects(
      runWithWorkers(['unused'], workers, async () => assert.fail()),
      /E2E_WORKERS/,
    );
  }
});
