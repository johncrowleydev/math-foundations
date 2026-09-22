import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { runWithWorkers, selectShard } from '../../e2e/support/workers.ts';

test('E2E shards partition prioritized specs without changing their order', async () => {
  const discovered = (await readdir(new URL('../../e2e/', import.meta.url)))
    .filter((file) => /\.spec\.(ts|mjs)$/.test(file))
    .sort();
  assert.ok(discovered.length > 0);
  for (const specs of [
    [],
    ['only.spec.ts'],
    ['slowest.spec.ts', 'second-slowest.spec.mjs', 'fast.spec.ts'],
    discovered,
    [...discovered, 'newly-added.spec.ts'],
  ]) {
    const original = [...specs];
    const first = selectShard(specs, '1/2');
    const second = selectShard(specs, '2/2');
    assert.deepEqual(
      first,
      specs.filter((_, index) => index % 2 === 0),
    );
    assert.deepEqual(
      second,
      specs.filter((_, index) => index % 2 === 1),
    );
    assert.deepEqual([...first, ...second].sort(), [...specs].sort());
    assert.equal(first.filter((spec) => second.includes(spec)).length, 0);
    assert.deepEqual(selectShard(specs, undefined), specs);
    assert.deepEqual(specs, original, 'sharding must not mutate the priority order');
  }
});

test('invalid E2E shards fail instead of silently dropping checks', () => {
  for (const shard of ['', '0/2', '3/2', '1/1', '1/3', '01/2', '1/02', ' 1/2', '1/2 ', '1']) {
    assert.throws(() => selectShard(['unused'], shard), /E2E_SHARD/);
  }
});

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
