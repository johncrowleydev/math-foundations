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
