import { authSession, authGeneration, lockSession, verifySession } from './auth';
import { all, get, put, remove, integrate, changed, hash } from './storage';
import type { Attempt, RecordData } from './types';
export let syncStatus = 'Not connected';

let busy = false;
export const connected = () => Boolean(authSession());
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function request(path: string, method = 'GET', body?: unknown) {
  if (!authSession()) throw Error('Sign in required');
  const epoch = authGeneration();
  const response = await fetch('/api/v1' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body instanceof Blob ? {} : body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body instanceof Blob ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  if (epoch !== authGeneration()) throw Error('Session changed');
  if (response.status === 401) lockSession();
  if (!response.ok)
    throw new HttpError(
      response.status,
      (await response.text()).slice(0, 500) || `HTTP ${response.status}`,
    );
  return response;
}
let initialized = false;
export async function initializeSync() {
  await put('settings', 'key', '');
  if (initialized) {
    void sync();
    return;
  }
  initialized = true;
  void sync();
  window.addEventListener('online', () => void sync());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void sync();
  });
  setInterval(() => {
    if (!document.hidden) void sync();
  }, 5000);
}
export async function mutation(key: string, payload: Record<string, unknown>, resolve = false) {
  const record = await get<RecordData>('records', key);
  const id = crypto.randomUUID();
  let device = await get<string>('settings', 'device');
  if (!device) {
    device = 'web-' + crypto.randomUUID();
    await put('settings', 'device', device);
  }
  await put('outbox', id, {
    id,
    kind: 'mutation',
    data: { id, key, payload, base: record?.revision || 0, device, resolve },
  });
  await put('records', key, {
    key,
    revision: record?.revision || 0,
    id,
    payload,
    device,
    updated: Date.now(),
    versions: record?.versions || [],
    conflicts: record?.conflicts || [],
  });
  void sync();
}
export async function recheck(a: Attempt, reason: string) {
  if (!reason.trim()) throw Error('Explain what should be reconsidered.');
  const id = crypto.randomUUID();
  await put('outbox', id, { id, kind: 'recheck', attempt: a.id, data: { id, reason } });
  await put('attempts', a.id, { ...a, status: 'rechecking' });
  void sync();
}
async function download(h: string) {
  if (await get('media', h)) return;
  const blob = await (await request('/media/' + h)).blob();
  if ((await hash(blob)) !== h) throw Error('Downloaded image failed integrity check');
  await put('media', h, blob);
}
async function upload(h: string) {
  const blob = await get<Blob>('media', h);
  if (!blob)
    throw Error('A submitted image is missing from this browser. Your attempt is retained.');
  await request('/media/' + h, 'PUT', blob);
}
type Operation = { id: string; kind: string; attempt?: string; data: Record<string, unknown> };
export async function sync() {
  if (busy || !authSession()) return;
  busy = true;
  syncStatus = 'Syncing';
  changed();
  try {
    if (!(await verifySession())) {
      syncStatus = authSession() ? 'Offline' : 'Sign in required';
      return;
    }
    for (const op of await all<Operation>('outbox')) {
      try {
        if (op.kind === 'attempt') {
          const a = op.data as unknown as Attempt;
          for (const h of [...a.images, ...(a.photos || []).map((p) => p.hash)]) await upload(h);
          const { status, verdict, error, grades, ...submission } = a;
          const saved = await (await request('/attempts', 'POST', submission)).json();
          await put('attempts', a.id, saved);
        } else if (op.kind === 'recheck')
          await request('/attempts/' + op.attempt + '/recheck', 'POST', op.data);
        else await request('/mutations', 'POST', op.data);
        await remove('outbox', op.id);
      } catch (e) {
        if (e instanceof HttpError && [400, 409].includes(e.status)) {
          if (op.kind === 'attempt')
            await put('attempts', op.id, { ...op.data, status: 'error', error: e.message });
          else if (op.kind === 'recheck') {
            const a = await get<Attempt>('attempts', op.attempt!);
            if (a) await put('attempts', a.id, { ...a, status: 'error', error: e.message });
          }
          await put('settings', 'rejected:' + op.id, { ...op, error: e.message });
          await remove('outbox', op.id);
        } else throw e;
      }
    }
    let cursor = (await get<number>('settings', 'cursor')) || 0;
    let more = true;
    while (more) {
      const batch = (await (await request('/changes?after=' + cursor)).json()) as {
        records: RecordData[];
        cursor: number;
        more: boolean;
      };
      for (const r of batch.records) {
        const p = r.payload;
        if (r.key.startsWith('attempt/')) {
          const a = p as unknown as Attempt;
          for (const h of [...a.images, ...(a.photos || []).map((x) => x.hash)]) await download(h);
        } else if (r.key.startsWith('photos/')) {
          for (const version of [r, ...(r.versions || [])])
            for (const p of (version.payload.photos || []) as { hash: string }[])
              await download(p.hash);
        }
      }
      await integrate(batch.records, batch.cursor);
      cursor = batch.cursor;
      more = batch.more;
    }
    syncStatus = 'Up to date';
  } catch (e) {
    syncStatus = e instanceof Error ? e.message : 'Sync failed';
    if (e instanceof HttpError && e.status === 401) syncStatus = 'Sign in required';
  } finally {
    busy = false;
    changed();
  }
}
