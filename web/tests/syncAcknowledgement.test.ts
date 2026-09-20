import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all, clearLocalWork, get, integrate, put, saveAttempt } from '../src/storage';
import type { Attempt } from '../src/types';

const originalWindow = globalThis.window;
globalThis.window = { addEventListener() {} } as unknown as Window & typeof globalThis;
const { acknowledgedAttempt, cancelGrading } = await import('../src/sync');
globalThis.window = originalWindow;

const submitted: Attempt = {
  id: 'offline-answer',
  exercise: 'functions-1',
  submitted: 1000,
  contentVersion: 'frozen-version',
  mode: 'structured',
  response: { answer: 'yes' },
  text: '',
  images: [],
  revealed: false,
  status: 'graded',
  verdict: 'correct',
  grades: [{ at: 1000, verdict: 'correct', feedback: 'Correct.' }],
};

test('malformed or mismatched acknowledgements cannot replace a queued answer', () => {
  for (const bad of [
    null,
    {},
    [],
    { ...submitted, id: 'different' },
    { ...submitted, exercise: 'functions-7' },
    { ...submitted, submitted: 2000 },
    { ...submitted, contentVersion: 'new-version' },
    { ...submitted, text: 'A different original response' },
    { ...submitted, revealed: true },
    { ...submitted, status: 'unknown' },
    { ...submitted, status: 'queued' },
    { ...submitted, grades: null },
    { ...submitted, grades: [{}] },
    { ...submitted, grades: [] },
    { ...submitted, verdict: 'incorrect' },
    { ...submitted, response: {} },
    { ...submitted, response: { answer: 'no' } },
  ])
    assert.throws(() => acknowledgedAttempt(bad, submitted), /answer remains queued/);
  assert.deepEqual(acknowledgedAttempt(submitted, submitted), submitted);
});

test('acknowledgements allow authoritative regrading and unordered structured fields', () => {
  const original = { ...submitted, response: { x: '1', y: '2' } };
  const saved = {
    ...original,
    response: { y: '2', x: '1' },
    verdict: 'incorrect',
    grades: [{ at: 2000, verdict: 'incorrect', feedback: 'Check your calculation.' }],
  };
  assert.deepEqual(acknowledgedAttempt(saved, original), saved);
  const scratchwork = {
    ...original,
    text: 'Scratchwork',
    photos: [{ hash: 'scratch', rotation: 0 }],
    ink: { strokes: [] },
    choiceId: 'old-choice',
  };
  assert.deepEqual(
    acknowledgedAttempt(saved, scratchwork),
    saved,
    'Compare the actual structured wire submission, which excludes scratchwork',
  );
});

test('acknowledgements preserve supported pending and transcribed media lifecycle', () => {
  const original = {
    ...submitted,
    mode: 'photo',
    response: undefined,
    images: ['image-hash'],
    photos: [{ hash: 'image-hash', rotation: 0 }],
    status: 'queued',
    verdict: undefined,
    grades: [],
  };
  for (const status of ['pending', 'grading', 'not_graded', 'cancelled', 'error']) {
    const saved = { ...original, status };
    assert.deepEqual(acknowledgedAttempt(saved, original), saved);
  }
  const transcribed = {
    ...original,
    images: [],
    photos: undefined,
    transcription: 'x = 2',
    status: 'graded',
    verdict: 'correct',
    grades: submitted.grades.map((grade) => ({ ...grade, transcription: 'x = 2' })),
  };
  assert.deepEqual(acknowledgedAttempt(transcribed, original), transcribed);
  const historical = { ...original, status: 'graded', verdict: 'correct', grades: [] };
  assert.deepEqual(acknowledgedAttempt(historical, original), historical);
});

test('malformed downloaded attempts cannot erase pending answers or advance the cursor', async () => {
  const record = (payload: Record<string, unknown>, revision = 1) => ({
    key: 'attempt/' + submitted.id,
    payload,
    revision,
    id: 'server-record',
    device: 'server',
    updated: 1000,
    versions: [],
    conflicts: [],
  });
  for (const malformed of [
    record({ id: submitted.id }),
    record({ ...submitted, id: 'wrong-key' }),
    record({ ...submitted, response: undefined }),
    record({ ...submitted, grades: [{}] }),
    record({ ...submitted, status: 'queued' }),
    record(submitted, NaN),
  ]) {
    await clearLocalWork();
    await saveAttempt(submitted);
    const before = await Promise.all(['attempts', 'outbox', 'records'].map(all));
    await assert.rejects(
      integrate([record(submitted), malformed], 20),
      /local work remains unchanged/,
    );
    assert.deepEqual(await Promise.all(['attempts', 'outbox', 'records'].map(all)), before);
    assert.equal(await get('settings', 'cursor'), undefined);
    await integrate([record(submitted)], 1);
    assert.deepEqual(await get('attempts', submitted.id), submitted);
    assert.equal((await all('outbox')).length, 0);
  }
});

test('download preserves not-graded feedback and historical open grades without inventing history', async () => {
  await clearLocalWork();
  const base = { ...submitted, mode: 'type', response: undefined, text: 'Original proof.' };
  const historical = { ...base, id: 'historical-proof', grades: [] };
  const unreadable = {
    ...base,
    id: 'unreadable-proof',
    status: 'not_graded',
    verdict: '',
    grades: [{ at: 1100, verdict: 'not_graded', feedback: 'Unable to resolve the response.' }],
  };
  const records = [historical, unreadable].map((payload, i) => ({
    key: 'attempt/' + payload.id,
    payload,
    revision: i + 1,
    id: 'saved-' + payload.id,
    device: 'server',
    updated: 1100,
    versions: [],
    conflicts: [],
  }));
  await integrate(records, 2);
  assert.deepEqual(await get('attempts', historical.id), historical);
  assert.deepEqual(await get('attempts', unreadable.id), unreadable);
});

const reviewAttempt: Attempt = {
  ...submitted,
  id: 'review-answer',
  exercise: 'review-frozen-instance',
  mode: 'choice',
  choiceId: 'yes',
  response: undefined,
  text: 'Yes',
  startedAt: 900,
  activeDurationMs: 0,
  unsure: false,
  assistance: {
    answerPreviouslyRevealed: false,
    priorIncorrectFeedbackSeen: false,
    copiedFromRetry: false,
  },
  review: {
    instanceId: 'frozen-instance',
    kind: 'focused-practice',
    templateId: 'frozen-template',
    concept: 'logic',
    skill: 'recall',
    objective: 'definition',
    scheduledFor: 0,
    presentedAt: 800,
    previousReviewAt: 0,
    previousEvidenceAt: 0,
    intervalDays: 0,
    seed: 'fixed-seed',
    parameters: { a: 1, b: 2 },
  },
  presentation: {
    question: {
      id: 900001,
      displayNumber: 1,
      section: 'Review',
      instructions: 'Choose the answer.',
      prompt: 'Is this the original frozen question?',
      answer: 'Yes.',
      choice: {
        correctOption: 'yes',
        options: [
          { id: 'yes', text: 'Yes', feedback: 'Correct.' },
          { id: 'no', text: 'No', feedback: 'Try again.' },
        ],
      },
    },
  },
  analytics: {
    version: 'frozen-evidence',
    provenance: 'submission',
    concepts: [{ concept: 'logic', role: 'primary' }],
    skills: [{ skill: 'recall', role: 'primary' }],
    representations: ['words'],
    conceptDefinitions: [{ id: 'logic', name: 'Logic' }],
    skillDefinitions: [{ id: 'recall', name: 'Recall' }],
    representationDefinitions: [{ id: 'words', name: 'Words' }],
  },
};
const damagedReviewAttempts = (): [string, Attempt][] => {
  const cases: [string, Attempt][] = [];
  for (const key of [
    'review',
    'startedAt',
    'activeDurationMs',
    'assistance',
    'unsure',
    'presentation',
    'analytics',
  ] as const) {
    const truncated = structuredClone(reviewAttempt);
    delete truncated[key];
    cases.push(['omitted ' + key, truncated]);
  }
  const change = (name: string, edit: (a: Attempt) => void) => {
    const altered = structuredClone(reviewAttempt);
    edit(altered);
    cases.push([name, altered]);
  };
  change('changed review kind', (a) => {
    a.review!.kind = 'scheduled-review';
  });
  change('changed review parameter', (a) => {
    a.review!.parameters!.a = 99;
  });
  for (const key of Object.keys(reviewAttempt.review!)) {
    change('omitted review.' + key, (a) => {
      delete (a.review as any)[key];
    });
  }
  change('changed choice', (a) => {
    a.choiceId = 'no';
  });
  change('missing prior evidence', (a) => {
    delete a.review!.previousEvidenceAt;
  });
  change('changed start', (a) => {
    a.startedAt = 800;
  });
  change('changed duration', (a) => {
    a.activeDurationMs = 1;
  });
  change('changed assistance', (a) => {
    a.assistance!.copiedFromRetry = true;
  });
  change('changed unsure', (a) => {
    a.unsure = true;
  });
  change('changed prompt', (a) => {
    a.presentation!.question.prompt = 'A different question';
  });
  change('changed frozen question ID', (a) => {
    a.presentation!.question.id++;
  });
  change('missing official answer', (a) => {
    delete a.presentation!.question.answer;
  });
  change('changed frozen choice', (a) => {
    a.presentation!.question.choice!.correctOption = 'no';
  });
  change('changed evidence role', (a) => {
    a.analytics!.concepts[0].role = 'supporting';
  });
  change('truncated evidence snapshot', (a) => {
    delete (a.analytics as any).conceptDefinitions;
  });
  return cases;
};
const attemptRecord = (a: Attempt, revision = 10) => ({
  key: 'attempt/' + a.id,
  payload: a,
  revision,
  id: 'server-' + a.id,
  device: 'Grader',
  updated: 1100,
  versions: [],
  conflicts: [],
});

test('well-shaped Review acknowledgements cannot drop or alter immutable context', () => {
  for (const [name, damaged] of damagedReviewAttempts())
    assert.throws(() => acknowledgedAttempt(damaged, reviewAttempt), /answer remains queued/, name);
  assert.deepEqual(acknowledgedAttempt(reviewAttempt, reviewAttempt), reviewAttempt);
});

test('truncated Review downloads leave the entire batch, queue and cursor unchanged', async () => {
  for (const [name, damaged] of damagedReviewAttempts()) {
    await clearLocalWork();
    await saveAttempt(reviewAttempt);
    await put('settings', 'cursor', 5);
    await put('drafts', 'unrelated-draft', { text: 'Keep scratchwork.' });
    await put('media', 'unrelated-image', new Blob(['Keep media.']));
    const stores = ['attempts', 'outbox', 'records', 'settings', 'drafts', 'media'];
    const before = await Promise.all(stores.map(all));
    await assert.rejects(
      integrate([attemptRecord(submitted), attemptRecord(damaged)], 20),
      /local work remains unchanged/,
      name,
    );
    assert.deepEqual(await Promise.all(stores.map(all)), before, name);
    await integrate([attemptRecord(reviewAttempt)], 10);
    assert.deepEqual(await get('attempts', reviewAttempt.id), reviewAttempt);
    assert.equal((await all('outbox')).length, 0);
  }
});

test('queued submission and confirmed record protect context even when the attempt cache is incomplete', async () => {
  for (const authority of ['queue', 'record']) {
    await clearLocalWork();
    if (authority === 'queue') await saveAttempt(reviewAttempt);
    else await integrate([attemptRecord(reviewAttempt)], 10);
    const damaged = { ...reviewAttempt, activeDurationMs: 1 };
    await put('attempts', reviewAttempt.id, damaged);
    const stores = ['attempts', 'outbox', 'records', 'settings'];
    const before = await Promise.all(stores.map(all));
    await assert.rejects(
      integrate([attemptRecord(damaged, 11)], 11),
      /local work remains unchanged/,
    );
    assert.deepEqual(await Promise.all(stores.map(all)), before);
  }
});

test('confirmed grade history is append-only while imported revision-zero copies can gain server defaults', async () => {
  await clearLocalWork();
  await integrate([attemptRecord(reviewAttempt)], 10);
  const changed = {
    ...reviewAttempt,
    grades: [{ ...reviewAttempt.grades[0], feedback: 'Rewritten history' }],
  };
  await assert.rejects(integrate([attemptRecord(changed, 11)], 11), /local work remains unchanged/);
  const rechecked = {
    ...reviewAttempt,
    status: 'not_graded',
    grades: [
      ...reviewAttempt.grades,
      { at: 1100, verdict: 'not_graded', feedback: 'Unreadable recheck.' },
    ],
  };
  await integrate([attemptRecord(rechecked, 11)], 11);
  assert.deepEqual(await get('attempts', reviewAttempt.id), rechecked);
  await clearLocalWork();
  await put('records', 'attempt/' + reviewAttempt.id, attemptRecord(reviewAttempt, 0));
  const restored = {
    ...reviewAttempt,
    grades: [{ ...reviewAttempt.grades[0], issue: '', model: '' }],
  };
  await integrate([attemptRecord(restored)], 10);
  assert.deepEqual(await get('attempts', reviewAttempt.id), restored);
});

test('duplicate change-feed keys cannot bypass confirmation and cache-only acknowledgements retain grades', async () => {
  await clearLocalWork();
  const truncated = { ...reviewAttempt, grades: [] };
  await assert.rejects(
    integrate([attemptRecord(reviewAttempt, 10), attemptRecord(truncated, 11)], 11),
    /local work remains unchanged/,
  );
  assert.equal((await all('attempts')).length, 0);
  assert.equal(await get('settings', 'cursor'), undefined);
  // A successful POST is stored before its first change-feed record is downloaded.
  await put('attempts', reviewAttempt.id, reviewAttempt);
  await assert.rejects(integrate([attemptRecord(truncated)], 10), /local work remains unchanged/);
  assert.deepEqual(await get('attempts', reviewAttempt.id), reviewAttempt);
  await integrate([attemptRecord(reviewAttempt)], 10);
  assert.deepEqual(await get('attempts', reviewAttempt.id), reviewAttempt);
});

test('cancellation GET and POST replies preserve immutable context and confirmed grades', async () => {
  const { verifySession, lockSession } = await import('../src/auth');
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
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ email: 'fixture@example.test', expires: Date.now() + 60000 }));
    assert.equal(await verifySession(), true);
    for (const activeJob of [undefined, 'server-recheck-job']) {
      await clearLocalWork();
      const original = {
        ...reviewAttempt,
        mode: 'type',
        choiceId: undefined,
        text: 'Original proof.',
        status: 'rechecking',
        activeJob,
        presentation: { question: { id: 1, section: 'Review', instructions: 'Prove the claim.' } },
      };
      await integrate([attemptRecord(original)], 10);
      const cancelled = { ...original, status: 'cancelled', activeJob: undefined };
      for (const damaged of [
        { ...cancelled, review: undefined },
        { ...cancelled, grades: [] },
        { ...cancelled, grades: [{ ...cancelled.grades[0], feedback: 'Rewritten history.' }] },
      ]) {
        globalThis.fetch = async (input, init) => {
          assert.equal(String(input).endsWith(activeJob ? '/cancel' : '/' + original.id), true);
          assert.equal(init?.method, activeJob ? 'POST' : 'GET');
          return new Response(JSON.stringify(damaged));
        };
        await assert.rejects(cancelGrading(original), /Invalid server/);
        assert.deepEqual(await get('attempts', original.id), original);
        assert.deepEqual((await get<any>('records', 'attempt/' + original.id)).payload, original);
      }
      globalThis.fetch = async () => new Response(JSON.stringify(cancelled));
      await cancelGrading(original);
      assert.deepEqual(await get('attempts', original.id), JSON.parse(JSON.stringify(cancelled)));
    }
  } finally {
    lockSession();
    globalThis.fetch = savedFetch;
    if (savedStorage) Object.defineProperty(globalThis, 'localStorage', savedStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('historical missing snapshots may be backfilled and a null absent answer remains compatible', async () => {
  await clearLocalWork();
  const old: Attempt = { ...submitted, mode: 'type', text: 'Old proof.', response: undefined };
  const enriched = {
    ...old,
    analytics: { ...reviewAttempt.analytics!, provenance: 'historical-backfill' as const },
    presentation: { question: { id: 1, section: 'Old', instructions: 'Give a proof.' } },
  };
  assert.deepEqual(acknowledgedAttempt(enriched, old), enriched);
  const serialized = JSON.parse(JSON.stringify(enriched));
  serialized.presentation.question.answer = null;
  assert.deepEqual(acknowledgedAttempt(serialized, enriched), serialized);
  await integrate([attemptRecord(old)], 10);
  await integrate([attemptRecord(enriched, 11)], 11);
  assert.deepEqual(await get('attempts', old.id), enriched);
});

test('new-device Review downloads require frozen context and confirmed copies cannot lose it', async () => {
  for (const key of ['review', 'presentation'] as const) {
    await clearLocalWork();
    const damaged = structuredClone(reviewAttempt);
    delete damaged[key];
    await assert.rejects(integrate([attemptRecord(damaged)], 10), /local work remains unchanged/);
    assert.equal((await all('attempts')).length, 0);
  }
  await integrate([attemptRecord(reviewAttempt)], 10);
  for (const [, damaged] of damagedReviewAttempts()) {
    await assert.rejects(
      integrate([attemptRecord(damaged, 11)], 11),
      /local work remains unchanged/,
    );
    assert.deepEqual(await get('attempts', reviewAttempt.id), reviewAttempt);
    assert.equal(await get('settings', 'cursor'), 10);
  }
});

test('wire ordering and server question projection preserve the same frozen context', () => {
  const wire = JSON.parse(JSON.stringify(reviewAttempt));
  wire.review.parameters = { b: 2, a: 1 };
  wire.review = Object.fromEntries(Object.entries(wire.review).reverse());
  wire.analytics = Object.fromEntries(Object.entries(wire.analytics).reverse());
  assert.deepEqual(acknowledgedAttempt(wire, reviewAttempt), wire);
  const lesson = { ...reviewAttempt, exercise: 'logic-1', review: undefined };
  const projected = JSON.parse(JSON.stringify(lesson));
  delete projected.presentation.question.id;
  delete projected.presentation.question.displayNumber;
  delete projected.presentation.question.section;
  assert.deepEqual(acknowledgedAttempt(projected, lesson), projected);
});

test('dedicated Review without analytics accepts the API null without losing existing snapshots', async () => {
  await clearLocalWork();
  const dedicated = { ...reviewAttempt, analytics: undefined };
  const wire = JSON.parse(JSON.stringify(dedicated));
  wire.analytics = null;
  assert.deepEqual(acknowledgedAttempt(wire, dedicated), wire);
  await saveAttempt(dedicated);
  await integrate([attemptRecord(wire)], 10);
  assert.deepEqual(await get('attempts', dedicated.id), wire);
  assert.throws(() => acknowledgedAttempt(wire, reviewAttempt), /answer remains queued/);
});

test('only a retained media transcription permits removal of original images, photos and ink', () => {
  const media = {
    ...submitted,
    mode: 'write',
    response: undefined,
    status: 'pending',
    verdict: '',
    grades: [],
    images: ['image'],
    ink: { strokes: [] },
  };
  for (const altered of [
    { ...media, images: [] },
    { ...media, images: ['different'] },
    { ...media, ink: undefined },
    { ...media, images: [], ink: undefined, transcription: '' },
    { ...media, images: [], ink: undefined, transcription: 'x=2' },
    { ...media, images: [], ink: { other: true }, transcription: 'x=2' },
  ])
    assert.throws(() => acknowledgedAttempt(altered, media), /answer remains queued/);
  const retired = {
    ...media,
    images: [],
    ink: undefined,
    transcription: 'x=2',
    grades: [{ at: 1100, verdict: 'correct', feedback: 'Correct.', transcription: 'x=2' }],
  };
  assert.deepEqual(acknowledgedAttempt(retired, media), retired);
  for (const grades of [
    [],
    [{ ...retired.grades[0], transcription: 'x=3' }],
    [{ ...retired.grades[0], verdict: 'not_graded' }],
  ])
    assert.throws(
      () => acknowledgedAttempt({ ...retired, grades }, media),
      /answer remains queued/,
    );
  const unreadableRecheck = {
    ...retired,
    status: 'not_graded',
    grades: [...retired.grades, { at: 1200, verdict: 'not_graded', feedback: 'Unreadable.' }],
  };
  assert.deepEqual(acknowledgedAttempt(unreadableRecheck, media), unreadableRecheck);
  assert.throws(
    () => acknowledgedAttempt({ ...retired, transcription: 'x=3' }, retired),
    /answer remains queued/,
  );
  const photo = {
    ...media,
    mode: 'photo',
    ink: undefined,
    photos: [{ hash: 'original', rotation: 90 }],
  };
  assert.throws(
    () => acknowledgedAttempt({ ...photo, photos: [{ hash: 'original', rotation: 0 }] }, photo),
    /answer remains queued/,
  );
});
