import { changed, db, deviceId } from './storage';
import type { RecordData } from './types';

export const reviewBudgetKey = 'preference/review-budget-minutes';
const legacyKey = 'review-budget-minutes';
const defaultMinutes = 25;

function validMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 5 && value <= 60;
}

export function localReviewBudget(): number {
  const saved = Number(localStorage.getItem(legacyKey));
  return validMinutes(saved) ? saved : defaultMinutes;
}

export async function savedReviewBudget(): Promise<number> {
  const tx = (await db).transaction(['records', 'outbox']);
  const record = (await tx.objectStore('records').get(reviewBudgetKey)) as RecordData | undefined;
  const pending = (await tx.objectStore('outbox').getAll()).find(
    (op) => op.kind === 'mutation' && op.data.key === reviewBudgetKey,
  );
  await tx.done;
  // A failed upload can still download an older server record. Keep the queued
  // choice visible until it is accepted, including after an offline reload.
  const value = pending?.data.payload.value ?? record?.payload.value;
  return validMinutes(value) ? value : localReviewBudget();
}

export async function saveReviewBudget(minutes: number, ifAbsent = false): Promise<void> {
  if (!validMinutes(minutes)) throw Error('Review target must be between 5 and 60 minutes.');
  const device = await deviceId();
  const tx = (await db).transaction(['records', 'outbox'], 'readwrite');
  const records = tx.objectStore('records');
  const outbox = tx.objectStore('outbox');
  const record = (await records.get(reviewBudgetKey)) as RecordData | undefined;
  const pending = (await outbox.getAll()).filter(
    (op) => op.kind === 'mutation' && op.data.key === reviewBudgetKey,
  );
  if (ifAbsent && (record || pending.length)) {
    await tx.done;
    return;
  }
  // One queued choice per browser prevents UUID ordering from replaying older
  // offline choices after the latest one. The transaction also serializes tabs.
  for (const op of pending) await outbox.delete(op.id);
  const id = crypto.randomUUID();
  const payload = { value: minutes };
  await outbox.put(
    {
      id,
      kind: 'mutation',
      data: {
        id,
        key: reviewBudgetKey,
        payload,
        base: record?.revision || 0,
        device,
        ...(ifAbsent ? { ifAbsent: true } : {}),
      },
    },
    id,
  );
  await records.put(
    {
      key: reviewBudgetKey,
      revision: record?.revision || 0,
      id,
      payload,
      device,
      updated: Date.now(),
      versions: record?.versions || [],
      conflicts: record?.conflicts || [],
    } satisfies RecordData,
    reviewBudgetKey,
  );
  await tx.done;
  localStorage.setItem(legacyKey, String(minutes));
  changed();
}

export async function migrateReviewBudget(): Promise<void> {
  const minutes = localReviewBudget();
  // Old clients wrote 25 even without an explicit choice. Let an existing
  // nondefault choice initialize the account; an untouched phone must not win.
  if (minutes !== defaultMinutes) await saveReviewBudget(minutes, true);
}
