import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all, clearLocalWork, exportData, importData, saveAttempt } from '../src/storage';

test('server plans sessions; offline reload uses cached responses without changing due counts', async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { addEventListener() {} },
  });
  const { verifySession } = await import('../src/auth');
  const { cachedReviewSession, loadReviewSummary, retainReviewSession, startReviewSession } =
    await import('../src/reviewApi');
  const savedFetch = globalThis.fetch;
  const savedStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  const summary = {
    due: 11,
    quick: 8,
    deeper: 3,
    targets: [],
    concepts: [],
    skills: [],
    lessons: [],
  };
  const session = {
    id: 'server-session',
    kind: 'scheduled-review' as const,
    mode: 'quick' as const,
    instances: [],
  };
  const calls: string[] = [];
  try {
    await clearLocalWork();
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      calls.push(url);
      const body = url.endsWith('/auth/session')
        ? { email: 'fixture@example.test', expires: Date.now() + 60000 }
        : url.endsWith('/review/sessions')
          ? session
          : summary;
      if (url.endsWith('/review/sessions'))
        assert.deepEqual(JSON.parse(String(init?.body)), {
          kind: 'scheduled-review',
          mode: 'quick',
        });
      return new Response(JSON.stringify(body), { status: 200 });
    };
    assert.equal(await verifySession(), true);
    const live = await loadReviewSummary();
    assert.equal(live.cached, false);
    assert.deepEqual(live.summary, summary);
    assert.deepEqual(
      await startReviewSession({ kind: 'scheduled-review', mode: 'quick' }),
      session,
    );
    const backup = await exportData();
    await clearLocalWork();
    await importData(backup, 'offline-session.json');
    globalThis.fetch = async () => {
      throw new TypeError('Offline');
    };
    const offline = await loadReviewSummary();
    assert.equal(offline.cached, true);
    assert.deepEqual(offline.summary, summary);
    assert.equal(offline.fetchedAt, live.fetchedAt);
    assert.deepEqual(await cachedReviewSession(), session);
    await assert.rejects(
      startReviewSession({ kind: 'scheduled-review', mode: 'quick' }),
      /Offline/,
    );
    assert.deepEqual(await cachedReviewSession(), session);
    await retainReviewSession(null);
    assert.equal(await cachedReviewSession(), undefined);
    assert.equal(calls.filter((url) => url.endsWith('/review/sessions')).length, 1);
    const { sync } = await import('../src/sync');
    const pending = {
      id: 'pending-review-answer',
      exercise: 'review-instance',
      submitted: 100,
      contentVersion: 'v',
      mode: 'type',
      text: 'Answer',
      images: [],
      revealed: false,
      status: 'queued',
      grades: [],
    };
    await saveAttempt(pending);
    let rejectRestore = true;
    const sent: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      sent.push(url);
      if (url.endsWith('/review/import') && rejectRestore)
        return new Response('Restore unavailable', { status: 409 });
      const body = url.endsWith('/auth/session')
        ? { email: 'fixture@example.test', expires: Date.now() + 60000 }
        : url.endsWith('/attempts')
          ? { ...pending, status: 'pending' }
          : { records: [], attempts: [], cursor: 0, more: false };
      return new Response(JSON.stringify(body));
    };
    await sync();
    assert.equal(
      sent.some((url) => url.endsWith('/attempts')),
      false,
    );
    assert.equal((await all('outbox')).length, 2, 'failed restoration retains dependent work');
    rejectRestore = false;
    sent.length = 0;
    await sync();
    assert.ok(
      sent.findIndex((url) => url.endsWith('/review/import')) <
        sent.findIndex((url) => url.endsWith('/attempts')),
    );
    assert.equal((await all('outbox')).length, 0);
  } finally {
    globalThis.fetch = savedFetch;
    if (savedStorage) Object.defineProperty(globalThis, 'localStorage', savedStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
