// CI uses multiple runners. Distributing the already prioritized specs keeps discovery
// automatic and each expensive check in exactly one shard.
export function selectShard<T>(items: readonly T[], shard: string | undefined): T[] {
  if (shard === undefined) return [...items];
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(shard);
  const index = Number(match?.[1]);
  const count = Number(match?.[2]);
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(count) || index > count) {
    throw Error(
      'E2E_SHARD must be an index/count pair (1 <= index <= count). Leave it unset to run all specs.',
    );
  }
  return items.filter((_, itemIndex) => itemIndex % count === index - 1);
}

// Each worker takes one spec at a time. Results retain input order, and a failed
// spec does not prevent the remaining independent checks from running.
export async function runWithWorkers<T, R>(
  items: readonly T[],
  workers: number,
  run: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) {
    throw Error('E2E_WORKERS must be an integer between 1 and 4.');
  }
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        try {
          results[index] = { status: 'fulfilled', value: await run(items[index]) };
        } catch (reason) {
          results[index] = { status: 'rejected', reason };
        }
      }
    }),
  );
  return results;
}
