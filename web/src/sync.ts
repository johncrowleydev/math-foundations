import { authSession, authGeneration, lockSession, verifySession } from './auth';
import {
  all,
  get,
  put,
  deviceId,
  remove,
  integrate,
  changed,
  hash,
  attemptsMatch,
  recoverEffortRejections,
  retryUnsubmittedAttempt,
} from './storage';
import type { Attempt, RecordData } from './types';
import { deterministicAttempt } from './structuredAnswer';
import { preservesAttempt, preservesConfirmedAttempt, validServerAttempt } from './serverAttempt';
export let syncStatus = 'Not connected';
export let initialSyncComplete = false;

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
export async function apiRequest(path: string, method = 'GET', body?: unknown) {
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
  initialSyncComplete = Boolean(await get('settings', 'initial-sync-complete'));
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
  const device = await deviceId();
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
export async function cancelGrading(a: Attempt) {
  const retained = async (value: unknown, original: Attempt) => {
    const next = acknowledgedAttempt(value, original);
    const record = await get<RecordData>('records', 'attempt/' + a.id);
    const cached = await get<Attempt>('attempts', a.id);
    if (
      [original, cached, record?.payload as Attempt | undefined].some(
        (old) => old && !preservesConfirmedAttempt(next, old),
      )
    )
      throw Error('Invalid server cancellation response; saved history remains unchanged.');
    return next;
  };
  const current: Attempt = a.activeJob
    ? a
    : await retained(await (await apiRequest('/attempts/' + a.id)).json(), a);
  if (!current.activeJob) {
    await put('attempts', a.id, current);
    return;
  }
  const saved = await retained(
    await (
      await apiRequest('/attempts/' + a.id + '/cancel', 'POST', { job: current.activeJob })
    ).json(),
    current,
  );
  await put('attempts', a.id, saved);
}
export async function recheck(a: Attempt, reason: string) {
  await recoverEffortRejections();
  a = (await get<Attempt>('attempts', a.id)) || a;
  if (deterministicAttempt(a))
    throw Error('This answer is checked automatically. Try another answer instead.');
  if (a.verdict && !reason.trim()) throw Error('Explain what should be reconsidered.');
  if (await retryUnsubmittedAttempt(a.id)) {
    void sync();
    return;
  }
  const id = crypto.randomUUID();
  await put('outbox', id, { id, kind: 'recheck', attempt: a.id, data: { id, reason } });
  await put('attempts', a.id, {
    ...a,
    status: 'rechecking',
    error: '',
    recheckReason: reason,
    activeJob: id,
  });
  void sync();
}
async function download(h: string) {
  if (await get('media', h)) return;
  const blob = await (await apiRequest('/media/' + h)).blob();
  if ((await hash(blob)) !== h) throw Error('Downloaded image failed integrity check');
  await put('media', h, blob);
}
async function upload(h: string) {
  const blob = await get<Blob>('media', h);
  if (!blob)
    throw Error('A submitted image is missing from this browser. Your attempt is retained.');
  await apiRequest('/media/' + h, 'PUT', blob);
}
type Operation = { id: string; kind: string; attempt?: string; data: Record<string, unknown> };
export function attemptSubmission(a: Attempt) {
  const {
    status,
    verdict,
    error,
    grades,
    transcription,
    recheckReason,
    analytics,
    activeJob,
    presentation,
    ...submission
  } = a;
  if (a.mode === 'structured') {
    submission.text = '';
    submission.images = [];
    delete submission.photos;
    delete submission.ink;
    delete submission.choiceId;
  }
  return submission;
}
// A 2xx response is not sufficient acknowledgement of a durable submission.
// Keep the local answer and outbox entry unless the API returns this attempt.
export function acknowledgedAttempt(value: unknown, submitted: Attempt): Attempt {
  const a = value;
  if (
    !validServerAttempt(a) ||
    !preservesAttempt(a, {
      ...attemptSubmission(submitted),
      status: submitted.status,
      grades: submitted.grades,
      presentation: submitted.presentation,
      analytics: submitted.analytics,
      transcription: submitted.transcription,
    }) ||
    (a.status === 'graded' &&
      ((!a.grades.length && deterministicAttempt(submitted)) ||
        (a.grades.length > 0 && a.verdict !== a.grades.at(-1)?.verdict)))
  )
    throw Error('Invalid server acknowledgement; your answer remains queued.');
  return a;
}
export async function sync() {
  if (busy || !authSession()) return;
  busy = true;
  const previousStatus = syncStatus;
  if (!initialSyncComplete) {
    syncStatus = 'Syncing';
    changed('sync');
  }
  try {
    if (!(await verifySession())) {
      syncStatus = authSession() ? 'Offline' : 'Sign in required';
      return;
    }
    let outgoingError = '';
    await recoverEffortRejections();
    // Choice retries can be graded offline. Upload earlier attempts before a
    // later correct one locks the exercise on the server (UUID order is random).
    const outgoing = await all<Operation>('outbox');
    outgoing.sort((a, b) => {
      if (a.kind === 'review-import' || b.kind === 'review-import')
        return Number(b.kind === 'review-import') - Number(a.kind === 'review-import');
      const at = a.kind === 'attempt' ? Number(a.data.submitted) : Infinity;
      const bt = b.kind === 'attempt' ? Number(b.data.submitted) : Infinity;
      return at - bt;
    });
    for (const op of outgoing) {
      try {
        if (op.kind === 'attempt') {
          const a = op.data as unknown as Attempt;
          const submission = attemptSubmission(a);
          for (const h of [...submission.images, ...(submission.photos || []).map((p) => p.hash)])
            await upload(h);
          const saved = acknowledgedAttempt(
            await (await apiRequest('/attempts', 'POST', submission)).json(),
            a,
          );
          await put('attempts', a.id, saved);
        } else if (op.kind === 'review-import') {
          for (const a of op.data.attempts as Attempt[])
            for (const h of [...a.images, ...(a.photos || []).map((p) => p.hash)]) await upload(h);
          await apiRequest('/review/import', 'POST', op.data);
        } else if (op.kind === 'recheck') {
          const a = await get<Attempt>('attempts', op.attempt!);
          if (a && deterministicAttempt(a))
            throw new HttpError(400, 'Automatic answers cannot request a model recheck.');
          await apiRequest('/attempts/' + op.attempt + '/recheck', 'POST', op.data);
        } else await apiRequest('/mutations', 'POST', op.data);
        await remove('outbox', op.id);
      } catch (e) {
        if (op.kind === 'review-import') {
          // Pending review submissions depend on these server-issued instances.
          // Keep both restore and submissions queued if restoration fails.
          outgoingError = 'Review restore pending: ' + (e instanceof Error ? e.message : 'failed');
          break;
        }
        if (e instanceof HttpError && [400, 409].includes(e.status)) {
          if (op.kind === 'attempt')
            await put('attempts', op.id, { ...op.data, status: 'error', error: e.message });
          else if (op.kind === 'recheck') {
            const a = await get<Attempt>('attempts', op.attempt!);
            if (a) await put('attempts', a.id, { ...a, status: 'error', error: e.message });
          }
          await put('settings', 'rejected:' + op.id, { ...op, error: e.message });
          await remove('outbox', op.id);
        } else {
          if (e instanceof HttpError && e.status === 401) throw e;
          outgoingError = e instanceof Error ? e.message : 'Upload failed';
          break;
        }
      }
    }
    let cursor = (await get<number>('settings', 'cursor')) || 0;
    let more = true;
    while (more) {
      const batch = (await (await apiRequest('/changes?after=' + cursor)).json()) as {
        records: RecordData[];
        cursor: number;
        more: boolean;
      };
      await integrate(batch.records, batch.cursor);
      cursor = batch.cursor;
      more = batch.more;
    }
    const status = (await (await apiRequest('/status')).json()) as {
      attempts: { key: string; revision: number }[];
    };
    if (!Array.isArray(status.attempts)) throw Error('Could not verify saved attempts');
    if (!(await attemptsMatch(status.attempts))) {
      const snapshot = (await (await apiRequest('/attempts')).json()) as { records: RecordData[] };
      await integrate(snapshot.records, cursor);
      if (!(await attemptsMatch(status.attempts)))
        throw Error('Some attempts are missing; retrying sync');
    }
    if (!initialSyncComplete) {
      initialSyncComplete = true;
      changed();
    }
    if (!(await get('settings', 'initial-sync-complete')))
      await put('settings', 'initial-sync-complete', true);
    // Stored records are the durable download queue. A failed image must never
    // prevent grades or later change pages from reaching a new device.
    const hashes = referencedMedia(await all<RecordData>('records'));
    let missing = 0;
    const pendingHashes = [];
    for (const h of hashes) if (!(await get('media', h))) pendingHashes.push(h);
    if (pendingHashes.length) {
      syncStatus = 'Answers synced · downloading images';
      changed('sync');
    }
    for (const h of pendingHashes) {
      try {
        await download(h);
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) throw e;
        missing++;
      }
    }
    syncStatus = outgoingError
      ? 'Answers synced · upload pending: ' + outgoingError
      : missing
        ? `Answers synced · ${missing} image${missing === 1 ? '' : 's'} pending; retrying automatically`
        : 'Up to date';
  } catch (e) {
    syncStatus = e instanceof Error ? e.message : 'Sync failed';
    if (e instanceof HttpError && e.status === 401) syncStatus = 'Sign in required';
  } finally {
    busy = false;
    if (syncStatus !== previousStatus) changed('sync');
  }
}

export function referencedMedia(records: RecordData[]): Set<string> {
  const hashes = new Set<string>();
  for (const record of records) {
    for (const version of [record, ...(record.versions || [])]) {
      const p = version.payload;
      if (record.key.startsWith('attempt/'))
        for (const h of (p.images || []) as string[]) hashes.add(h);
      if (record.key.startsWith('attempt/') || record.key.startsWith('photos/'))
        for (const photo of (p.photos || []) as { hash: string }[]) hashes.add(photo.hash);
    }
  }
  return hashes;
}
