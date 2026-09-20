import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {
  clearLocalWork,
  exportData,
  importData,
  get,
  put,
  saveAttempt,
  integrate,
  all,
} from '../src/storage';
import { validReviewContext } from '../src/reviewValidation';

const context = {
  instanceId: 'instance-1',
  kind: 'focused-practice',
  templateId: 'definition',
  concept: 'existential-quantification',
  skill: 'recall',
  objective: 'witness-definition',
  presentedAt: 1200000000,
  scheduledFor: 1000000000,
  previousReviewAt: 500000000,
  intervalDays: 6,
  seed: 'variant-42',
  parameters: { a: 3, b: 7 },
};
const attempt = {
  id: 'review-attempt-1',
  exercise: 'review-instance-1',
  submitted: 1200001000,
  contentVersion: 'v',
  mode: 'choice',
  choiceId: 'a',
  text: 'A witness',
  images: [],
  revealed: false,
  status: 'queued',
  grades: [],
  review: context,
};
const session = {
  id: 'session-1',
  kind: 'focused-practice',
  mode: 'quick',
  instances: [
    {
      id: context.instanceId,
      exercise: attempt.exercise,
      lesson: 'predicate-logic',
      question: { id: 1, instructions: 'Choose a term.', section: 'Review' },
      context,
      contentVersion: 'v',
    },
  ],
};
const record = (key: string, payload: Record<string, unknown>, revision = 1) => ({
  key,
  payload,
  revision,
  id: key,
  device: 'server',
  updated: 1200000000,
  versions: [],
  conflicts: [],
});

test('offline review context, server states and unfinished sessions survive export/import and sync', async () => {
  await clearLocalWork();
  await saveAttempt(attempt);
  const state = {
    concept: context.concept,
    skill: context.skill,
    dueAt: context.scheduledFor,
    intervalDays: 6,
  };
  await put('records', 'review-state/target', record('review-state/target', state));
  await put(
    'records',
    'review-instance/instance-1',
    record('review-instance/instance-1', session.instances[0]),
  );
  await put('records', 'review-cache/active', record('review-cache/active', { session }, 0));
  const backup = await exportData();
  await clearLocalWork();
  await importData(backup, 'review.json');
  assert.deepEqual((await get<any>('attempts', attempt.id)).review, context);
  assert.deepEqual((await get<any>('outbox', attempt.id)).data.review, context);
  assert.deepEqual((await get<any>('records', 'review-state/target')).payload, state);
  assert.deepEqual((await get<any>('records', 'review-cache/active')).payload.session, session);
  const restore = (await all<any>('outbox')).find((op) => op.kind === 'review-import');
  assert.equal(restore.data.records[0].key, 'review-instance/instance-1');
  assert.equal(
    restore.data.records.some((r: any) => r.key.startsWith('review-state/')),
    false,
  );
  assert.equal((await get<any>('records', 'review-state/target')).revision, 0);
  const received = record(
    'attempt/' + attempt.id,
    {
      ...attempt,
      status: 'graded',
      verdict: 'correct',
      presentation: { question: session.instances[0].question },
      analytics: {
        version: 'v',
        provenance: 'submission',
        concepts: [{ concept: context.concept, role: 'primary' }],
        skills: [{ skill: context.skill, role: 'primary' }],
        representations: [],
        conceptDefinitions: [],
        skillDefinitions: [],
        representationDefinitions: [],
      },
    },
    12,
  );
  await integrate([received], 12);
  await integrate([received], 12);
  assert.equal((await all('attempts')).length, 1);
  assert.equal(await get('outbox', attempt.id), undefined);
  assert.deepEqual((await get<any>('attempts', attempt.id)).review, context);
  // Only server-issued state changes can move the due date.
  assert.deepEqual((await get<any>('records', 'review-state/target')).payload, state);
  const replayed = { ...state, dueAt: 1300000000 };
  await integrate([record('review-state/target', replayed, 1)], 13);
  assert.deepEqual((await get<any>('records', 'review-state/target')).payload, replayed);
});

test('v1/v2 lesson backups remain valid and never acquire fabricated review context', async () => {
  for (const version of [1, 2]) {
    await clearLocalWork();
    const { review: _, ...lesson } = attempt;
    const backup = {
      version,
      drafts: [],
      attempts: [[lesson.id, lesson]],
      records: [],
      outbox: [],
      media: [],
    };
    await importData(new Blob([JSON.stringify(backup)]), 'legacy.json');
    assert.equal((await get<any>('attempts', lesson.id)).review, undefined);
  }
});

test('malformed review imports fail atomically; missing historical fields stay optional', async () => {
  assert.equal(validReviewContext(undefined), true);
  assert.equal(
    validReviewContext({
      ...context,
      previousReviewAt: undefined,
      seed: undefined,
      parameters: undefined,
    }),
    true,
  );
  for (const bad of [
    null,
    { ...context, intervalDays: -1 },
    { ...context, kind: 'lesson' },
    { ...context, presentedAt: 'yesterday' },
  ]) {
    assert.equal(validReviewContext(bad), false);
    await clearLocalWork();
    const backup = {
      version: 2,
      drafts: [],
      attempts: [[attempt.id, { ...attempt, review: bad }]],
      records: [],
      outbox: [],
      media: [],
    };
    await assert.rejects(importData(new Blob([JSON.stringify(backup)]), 'invalid.json'));
    assert.equal((await all('attempts')).length, 0);
  }
  const backup = {
    version: 2,
    drafts: [],
    attempts: [],
    records: [
      [
        'review-cache/active',
        record('review-cache/active', { session: { ...session, instances: [{}] } }),
      ],
    ],
    outbox: [],
    media: [],
  };
  await assert.rejects(importData(new Blob([JSON.stringify(backup)]), 'invalid-session.json'));
});
