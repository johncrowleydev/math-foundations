import { openDB } from 'idb';
import { useSyncExternalStore } from 'react';
import type { Attempt, Draft, RecordData } from './types';
import type { EvidenceCatalog } from './evidenceTypes';
import {
  validAttemptEffort,
  validEffort,
  validGradeEvidence,
  validSnapshot,
} from './evidenceValidation';
const db = openDB('foundations-web', 2, {
  upgrade(d) {
    for (const s of ['drafts', 'attempts', 'media', 'records', 'outbox', 'settings', 'imports'])
      if (!d.objectStoreNames.contains(s)) d.createObjectStore(s);
  },
});
const revisions = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
const updates =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('foundations-data-v2')
    : null;
function notify(topic: string) {
  revisions.set(topic, (revisions.get(topic) || 0) + 1);
  listeners.get(topic)?.forEach((f) => f());
}
if (updates)
  updates.onmessage = (e) => {
    if (typeof e.data === 'string') notify(e.data);
  };
export function changed(topic = 'content') {
  if (topic !== 'sync') updates?.postMessage(topic);
  notify(topic);
}
export function useRevision(topic = 'content') {
  return useSyncExternalStore(
    (f) => {
      let set = listeners.get(topic);
      if (!set) {
        set = new Set();
        listeners.set(topic, set);
      }
      set.add(f);
      return () => {
        set.delete(f);
      };
    },
    () => revisions.get(topic) || 0,
  );
}
function storedChange(store: string, key: string) {
  if (store === 'media') changed('media:' + key);
  else if (store === 'drafts') changed('draft:' + key);
  else if (store === 'attempts' || store === 'records' || store === 'imports') changed();
}
// A read/write transaction serializes first use across calls and browser tabs.
export async function deviceId(): Promise<string> {
  const tx = (await db).transaction('settings', 'readwrite');
  let device = (await tx.store.get('device')) as string | undefined;
  if (!device) {
    device = 'web-' + crypto.randomUUID();
    await tx.store.put(device, 'device');
  }
  await tx.done;
  return device;
}
export async function get<T>(store: string, key: string): Promise<T | undefined> {
  return (await db).get(store, key);
}
export async function put(store: string, key: string, value: unknown) {
  await (await db).put(store, value, key);
  storedChange(store, key);
}
export async function remove(store: string, key: string) {
  await (await db).delete(store, key);
  storedChange(store, key);
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
  const tx = d.transaction(
    ['records', 'attempts', 'outbox', 'settings', 'drafts', 'media'],
    'readwrite',
  );
  let updated = false;
  const retired = new Set<string>();
  const changedDrafts = new Set<string>();
  for (const r of records) {
    const old = await tx.objectStore('records').get(r.key);
    const latest = old && old.revision >= r.revision ? old : r;
    if (latest === r) {
      await tx.objectStore('records').put(r, r.key);
      updated = true;
    }
    if (r.key.startsWith('attempt/')) {
      const a = latest.payload as Attempt;
      const saved = await tx.objectStore('attempts').get(a.id);
      if (a.transcription) {
        for (const h of [
          ...(saved?.images || []),
          ...(saved?.photos || []).map((p: any) => p.hash),
        ])
          retired.add(h);
        const draft = await tx.objectStore('drafts').get(a.exercise);
        const newer = (await tx.objectStore('attempts').getAll()).some(
          (other: Attempt) =>
            other.exercise === a.exercise &&
            (other.submitted > a.submitted ||
              (other.id !== a.id && ['queued', 'pending', 'grading'].includes(other.status))),
        );
        if (
          !newer &&
          draft &&
          draft.editing === false &&
          !draft.recovery &&
          (draft.strokes.length || draft.photos.length)
        ) {
          for (const p of draft.photos) retired.add(p.hash);
          await tx.objectStore('drafts').put(
            {
              ...draft,
              strokes: [],
              photos: [],
              updated: Math.max(Date.now(), draft.updated + 1),
            },
            a.exercise,
          );
          changedDrafts.add(a.exercise);
        }
      }
      if (JSON.stringify(saved) !== JSON.stringify(a)) {
        await tx.objectStore('attempts').put(a, a.id);
        updated = true;
      }
      await tx.objectStore('outbox').delete(a.id);
    }
  }
  if (retired.size) {
    // Do not remove a blob still used by another draft or queued submission.
    const retained = (
      await Promise.all(
        ['records', 'attempts', 'outbox', 'drafts', 'settings'].map((s) =>
          tx.objectStore(s).getAll(),
        ),
      )
    )
      .map((rows) => JSON.stringify(rows))
      .join('\n');
    for (const h of retired) if (!retained.includes(h)) await tx.objectStore('media').delete(h);
  }
  const previous = (await tx.objectStore('settings').get('cursor')) || 0;
  if (cursor > previous) await tx.objectStore('settings').put(cursor, 'cursor');
  await tx.done;
  for (const key of changedDrafts) changed('draft:' + key);
  if (updated) changed();
}
export async function exportData(catalog?: EvidenceCatalog) {
  const data: Record<string, unknown> = {
    version: 2,
    exportedAt: Date.now(),
    evidenceCatalog: catalog,
  };
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

export async function clearLocalWork() {
  const d = await db;
  const tx = d.transaction(
    ['drafts', 'attempts', 'media', 'records', 'outbox', 'settings', 'imports'],
    'readwrite',
  );
  for (const name of tx.objectStoreNames) await tx.objectStore(name).clear();
  await tx.done;
  changed();
}
export type ImportArchive = { name: string; at: number; conflicts: number; blob: Blob };
export async function importData(file: Blob, name: string) {
  if (file.size > 100 * 1024 * 1024) throw Error('Backup exceeds 100 MB.');
  const data = JSON.parse(await file.text()) as Record<string, unknown>;
  if (
    !data ||
    typeof data !== 'object' ||
    (data.version !== undefined && data.version !== 1 && data.version !== 2)
  )
    throw Error('Unsupported backup format.');
  const names = ['drafts', 'attempts', 'records', 'outbox'] as const;
  const object = (v: unknown): v is Record<string, any> =>
    Boolean(v) && typeof v === 'object' && !Array.isArray(v);
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  const hashKey = (s: unknown) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
  const photos = (v: unknown) =>
    Array.isArray(v) &&
    v.every((p) => object(p) && hashKey(p.hash) && finite(p.rotation) && p.rotation % 90 === 0);
  const attempt = (v: Record<string, any>) =>
    validAttemptEffort(v) &&
    validSnapshot(v.analytics) &&
    typeof v.id === 'string' &&
    typeof v.exercise === 'string' &&
    finite(v.submitted) &&
    typeof v.text === 'string' &&
    (v.transcription === undefined || typeof v.transcription === 'string') &&
    ['type', 'write', 'photo', 'choice'].includes(v.mode) &&
    (v.mode !== 'choice' || (typeof v.choiceId === 'string' && v.choiceId.length > 0)) &&
    Array.isArray(v.images) &&
    v.images.every(hashKey) &&
    Array.isArray(v.grades) &&
    v.grades.every((g: any) => object(g) && validGradeEvidence(g)) &&
    (v.photos === undefined || photos(v.photos));
  const parsed: Record<string, [string, Record<string, any>][]> = {};
  for (const store of names) {
    const rows = data[store];
    if (!Array.isArray(rows) || rows.length > 50000) throw Error('Invalid ' + store + ' data.');
    const seen = new Set<string>();
    parsed[store] = rows.map((row) => {
      if (
        !Array.isArray(row) ||
        row.length !== 2 ||
        typeof row[0] !== 'string' ||
        !row[0] ||
        row[0].length > 300 ||
        !object(row[1]) ||
        seen.has(row[0])
      )
        throw Error('Invalid or duplicate backup entry.');
      const [key, v] = row;
      if (store === 'drafts' && !validEffort(v)) throw Error('Invalid effort metadata');
      seen.add(key);
      if (
        store === 'drafts' &&
        !(
          typeof v.text === 'string' &&
          ['type', 'pen', 'photo'].includes(v.mode) &&
          finite(v.updated) &&
          typeof v.revealed === 'boolean' &&
          photos(v.photos) &&
          Array.isArray(v.strokes) &&
          v.strokes.every(
            (s: any) =>
              object(s) &&
              typeof s.color === 'string' &&
              finite(s.width) &&
              Array.isArray(s.points) &&
              s.points.every((p: any) => object(p) && finite(p.x) && finite(p.y) && finite(p.p)),
          )
        )
      )
        throw Error('Invalid draft.');
      if (store === 'attempts' && (!attempt(v) || v.id !== key)) throw Error('Invalid attempt.');
      if (
        store === 'records' &&
        !(
          v.key === key &&
          finite(v.revision) &&
          object(v.payload) &&
          Array.isArray(v.versions) &&
          Array.isArray(v.conflicts)
        )
      )
        throw Error('Invalid record.');
      if (
        store === 'outbox' &&
        !(
          v.id === key &&
          ['attempt', 'mutation', 'recheck'].includes(v.kind) &&
          object(v.data) &&
          (v.kind !== 'attempt' || attempt(v.data)) &&
          (v.kind !== 'recheck' ||
            (typeof v.attempt === 'string' && /^[a-zA-Z0-9-]+$/.test(v.attempt))) &&
          (v.kind !== 'mutation' || (typeof v.data.key === 'string' && object(v.data.payload)))
        )
      )
        throw Error('Invalid pending operation.');
      return [key, v];
    });
  }
  if (!Array.isArray(data.media)) throw Error('Missing media list.');
  const media: [string, Blob][] = [];
  for (const row of data.media) {
    if (
      !Array.isArray(row) ||
      row.length !== 3 ||
      !hashKey(row[0]) ||
      typeof row[1] !== 'string' ||
      !row[1].startsWith('image/') ||
      !Array.isArray(row[2]) ||
      !row[2].every((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 255)
    )
      throw Error('Invalid image.');
    const blob = new Blob([new Uint8Array(row[2])], { type: row[1] });
    if ((await hash(blob)) !== row[0]) throw Error('Image integrity check failed.');
    media.push([row[0], blob]);
  }
  const d = await db;
  const available = new Set([...(await d.getAllKeys('media')), ...media.map(([h]) => h)]);
  for (const [, v] of [
    ...parsed.drafts,
    ...parsed.attempts,
    ...parsed.outbox
      .filter(([, v]) => v.kind === 'attempt')
      .map(([k, v]) => [k, v.data] as [string, Record<string, any>]),
  ]) {
    for (const h of [...(v.images || []), ...(v.photos || []).map((p: any) => p.hash)])
      if (!available.has(h)) throw Error('Backup is missing an attached image.');
  }
  const id = await hash(file);
  let conflicts = 0,
    imported = 0;
  const tx = d.transaction([...names, 'media', 'imports'], 'readwrite');
  for (const store of names)
    for (const [key, value] of parsed[store]) {
      const old = await tx.objectStore(store).get(key);
      if (old === undefined) {
        await tx.objectStore(store).put(value, key);
        imported++;
      } else if (JSON.stringify(old) !== JSON.stringify(value)) conflicts++;
    }
  for (const [key, blob] of media)
    if (!(await tx.objectStore('media').get(key))) await tx.objectStore('media').put(blob, key);
  await tx
    .objectStore('imports')
    .put({ name, at: Date.now(), conflicts, blob: file } satisfies ImportArchive, id);
  await tx.done;
  changed();
  return { imported, conflicts };
}

export async function lessonProgress(slug: string, ids: (number | string)[]) {
  const d = await db;
  const tx = d.transaction(['attempts', 'drafts', 'records']);
  const [attempts, drafts, saved] = await Promise.all([
    tx.objectStore('attempts').getAll() as Promise<Attempt[]>,
    Promise.all(ids.map((id) => tx.objectStore('drafts').get(slug + '-' + id))) as Promise<
      (Draft | undefined)[]
    >,
    tx.objectStore('records').get('practice/position:' + slug) as Promise<RecordData | undefined>,
  ]);
  await tx.done;
  return { attempts, drafts, saved };
}
export async function attemptsMatch(manifest: { key: string; revision: number }[]) {
  const d = await db;
  const tx = d.transaction(['attempts', 'records']);
  const checks = await Promise.all(
    manifest.map(async (item) => {
      const [r, a] = await Promise.all([
        tx.objectStore('records').get(item.key),
        tx.objectStore('attempts').get(item.key.slice('attempt/'.length)),
      ]);
      return (
        r && r.revision >= item.revision && a && JSON.stringify(a) === JSON.stringify(r.payload)
      );
    }),
  );
  await tx.done;
  return checks.every(Boolean);
}
