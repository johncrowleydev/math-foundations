import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all, clearLocalWork } from '../src/storage';

test('catalog and seeded previews use read-only API calls without creating learner records', async () => {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const savedStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const savedFetch = globalThis.fetch;
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { addEventListener() {} },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  const catalog = { contentVersion: 'fixture', items: [] };
  const preview = {
    templateId: 'template:one',
    seed: 'seed/a?b&c=#',
    parameters: { witness: -2 },
    question: { prompt: 'Choose $-2$.' },
  };
  const calls: { url: string; method: string | undefined }[] = [];
  try {
    const { verifySession } = await import('../src/auth');
    const { loadReviewCatalog, previewReviewTemplate } = await import('../src/reviewApi');
    await clearLocalWork();
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      calls.push({ url, method: init?.method });
      const body = url.endsWith('/auth/session')
        ? { email: 'fixture@example.test', expires: Date.now() + 60000 }
        : url.endsWith('/review/catalog')
          ? catalog
          : preview;
      return new Response(JSON.stringify(body));
    };
    assert.equal(await verifySession(), true);
    assert.deepEqual(await loadReviewCatalog(), catalog);
    assert.deepEqual(await previewReviewTemplate(preview.templateId, preview.seed), preview);
    assert.deepEqual(
      calls.filter((call) => call.url.includes('/review/')),
      [
        { url: '/api/v1/review/catalog', method: 'GET' },
        {
          url: '/api/v1/review/catalog/template%3Aone/preview?seed=seed%2Fa%3Fb%26c%3D%23',
          method: 'GET',
        },
      ],
    );
    for (const store of ['records', 'attempts', 'outbox'] as const)
      assert.deepEqual(await all(store), []);
    globalThis.fetch = async () => {
      throw new TypeError('Offline');
    };
    await assert.rejects(loadReviewCatalog(), /Offline/);
    await assert.rejects(previewReviewTemplate(preview.templateId, preview.seed), /Offline/);
    globalThis.fetch = async () => new Response('Unknown template', { status: 404 });
    await assert.rejects(previewReviewTemplate('missing', 'sample'), /Unknown template/);
  } finally {
    globalThis.fetch = savedFetch;
    if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (savedStorage) Object.defineProperty(globalThis, 'localStorage', savedStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
