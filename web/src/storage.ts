import { openDB } from 'idb';
import { useSyncExternalStore } from 'react';
import type { Attempt, Draft, RecordData } from './types';
const db = openDB('foundations-web', 1, {
  upgrade(d) {
    for (const s of ['drafts', 'attempts', 'media', 'records', 'outbox', 'settings'])
      d.createObjectStore(s);
  },
});
let revision = 0;
const listeners = new Set<() => void>();
export function changed() {
  revision++;
  listeners.forEach((f) => f());
}
export function useRevision() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => revision,
  );
}
export async function get<T>(store: string, key: string): Promise<T | undefined> {
  return (await db).get(store, key);
}
export async function put(store: string, key: string, value: unknown) {
  await (await db).put(store, value, key);
  changed();
}
export async function remove(store: string, key: string) {
  await (await db).delete(store, key);
  changed();
}
export async function all<T>(store: string): Promise<T[]> {
  return (await db).getAll(store);
}
export const emptyDraft = (): Draft => ({
  text: '',
  mode: 'type',
  strokes: [],
  photos: [],
  revealed: false,
  updated: Date.now(),
});
export async function hash(blob: Blob) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
export async function saveMedia(blob: Blob) {
  const h = await hash(blob);
  await put('media', h, blob);
  return h;
}
export async function saveAttempt(a: Attempt) {
  const d = await db;
  const tx = d.transaction(['attempts', 'outbox'], 'readwrite');
  await tx.objectStore('attempts').put(a, a.id);
  await tx.objectStore('outbox').put({ id: a.id, kind: 'attempt', data: a }, a.id);
  await tx.done;
  changed();
}
export async function integrate(records: RecordData[], cursor: number) {
  const d = await db;
  const tx = d.transaction(['records', 'attempts', 'outbox', 'settings'], 'readwrite');
  for (const r of records) {
    const old = await tx.objectStore('records').get(r.key);
    if (old && old.revision > r.revision) continue;
    await tx.objectStore('records').put(r, r.key);
    if (r.key.startsWith('attempt/')) {
      const a = r.payload as unknown as Attempt;
      await tx.objectStore('attempts').put(a, a.id);
      await tx.objectStore('outbox').delete(a.id);
    }
  }
  await tx.objectStore('settings').put(cursor, 'cursor');
  await tx.done;
  changed();
}
export async function exportData() {
  const data: Record<string, unknown> = {};
  const d = await db;
  for (const name of ['drafts', 'attempts', 'records', 'outbox']) {
    const tx = d.transaction(name);
    data[name] = await Promise.all(
      (await tx.store.getAllKeys()).map(async (key) => [key, await tx.store.get(key)]),
    );
  }
  const media = await d.getAllKeys('media');
  data.media = await Promise.all(
    media.map(async (key) => {
      const b = (await d.get('media', key)) as Blob;
      return [key, b.type, Array.from(new Uint8Array(await b.arrayBuffer()))];
    }),
  );
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}
