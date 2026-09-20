import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { gradeStructured } from '../src/structuredAnswer';
import { gradeChoice } from '../src/choiceGrading';
import { all, clearLocalWork, get, importData, integrate, put } from '../src/storage';
import type { Assessment, Attempt, Question, RecordData } from '../src/types';

const assessment: Assessment = {
  version: 1,
  inputs: [
    { id: 'number', kind: 'text', label: 'Number' },
    { id: 'flag', kind: 'boolean', label: 'Truth value' },
  ],
  requirements: [
    {
      id: 'value',
      description: 'Value',
      validator: 'exact',
      fields: ['number'],
      params: { expected: ['1/2'] },
    },
    {
      id: 'truth',
      description: 'Truth value',
      validator: 'boolean',
      fields: ['flag'],
      params: { expected: [true] },
    },
  ],
  feedback: { correct: 'Correct.', incorrect: 'Try again.' },
  evidence: {
    level: 'production',
    interactionCost: 'low',
    inputCapabilities: ['short-text', 'tap'],
  },
};
const question: Question = { id: 1, section: 'Test', instructions: 'Answer.', assessment };
const submission = (): Attempt => ({
  id: 'restore-deterministic-1',
  exercise: 'logic-1',
  submitted: 100,
  contentVersion: 'original-version',
  mode: 'structured',
  response: { number: '2/4', flag: true },
  text: '',
  images: [],
  revealed: false,
  status: 'queued',
  grades: [],
});
const structured = () => gradeStructured(submission(), question);
const record = (key: string, payload: Record<string, any>, revision = 900): RecordData => ({
  key,
  payload,
  revision,
  id: 'saved-record',
  device: 'server',
  updated: 100,
  versions: [],
  conflicts: [],
});
function backup(a: Attempt, location = 'attempt') {
  return {
    version: 2,
    drafts: [],
    attempts: location === 'attempt' ? [[a.id, a]] : [],
    records: location === 'record' ? [['attempt/' + a.id, record('attempt/' + a.id, a)]] : [],
    outbox:
      location === 'outbox'
        ? [[a.id, { id: a.id, kind: 'attempt', data: a }]]
        : location === 'restore'
          ? [
              [
                'restore',
                { id: 'restore', kind: 'review-import', data: { attempts: [a], records: [] } },
              ],
            ]
          : [],
    media: [],
  };
}
const restore = (data: unknown) => importData(new Blob([JSON.stringify(data)]), 'restore.json');

test('wrong deterministic answers cannot restore forged correct outcomes through any backup copy', async () => {
  for (const location of ['attempt', 'record', 'outbox', 'restore']) {
    await clearLocalWork();
    const a = structured();
    a.response!.number = '3/4';
    await assert.rejects(restore(backup(a, location)), /deterministic verdict disagrees/);
    for (const store of ['attempts', 'records', 'outbox', 'imports'])
      assert.equal((await all(store)).length, 0, `${location}: ${store}`);
  }
});

test('import checks requirement outcomes, every stored grade and deterministic diagnoses', async () => {
  const wrong = gradeStructured(
    { ...submission(), response: { number: '3/4', flag: true } },
    question,
  );
  const mutations: ((a: Attempt) => void)[] = [
    (a) => {
      a.grades[0].requirements![0].satisfied = true;
    },
    (a) => {
      a.grades[0].requirements!.pop();
    },
    (a) => {
      a.grades[0].requirements![1] = { ...a.grades[0].requirements![0] };
    },
    (a) => {
      a.grades[0].requirements!.push({ id: 'forged', description: '', satisfied: true });
    },
    (a) => {
      delete a.grades[0].requirements;
    },
    (a) => {
      a.grades.push({ ...a.grades[0], verdict: 'correct' });
    },
    (a) => {
      a.grades[0].diagnosis = [{ class: 'clerical', severity: 'minor' }];
    },
    (a) => {
      a.grades = [];
    },
  ];
  for (const mutate of mutations) {
    await clearLocalWork();
    const a = structuredClone(wrong);
    mutate(a);
    await assert.rejects(restore(backup(a)), /Imported deterministic/);
    assert.equal((await all('attempts')).length, 0);
  }
});

test('snapshots enforce grading modes and reject conflicting top-level and nested assessments', async () => {
  for (const status of ['graded', 'error']) {
    await clearLocalWork();
    const a =
      status === 'graded' ? structured() : { ...submission(), status, presentation: { question } };
    a.mode = 'type';
    await assert.rejects(restore(backup(a)), /answer mode differs/);
  }
  const conflicting = structured();
  conflicting.presentation!.assessment = structuredClone(assessment);
  conflicting.presentation!.assessment.requirements[0].params.expected = ['3/4'];
  await assert.rejects(restore(backup(conflicting)), /Conflicting imported deterministic/);
  const choiceConflict = structured();
  choiceConflict.presentation!.question = {
    ...question,
    assessment: undefined,
    choice: { options: [{ id: 'a', text: 'A', feedback: 'A' }], correctOption: 'a' },
  };
  choiceConflict.presentation!.assessment = assessment;
  await assert.rejects(restore(backup(choiceConflict)), /Conflicting imported grading methods/);
});

test('honest nested or top-level structured snapshots preserve historical metadata and requirement order', async () => {
  for (const topLevel of [false, true]) {
    await clearLocalWork();
    const a = structured();
    if (topLevel) {
      a.presentation!.assessment = assessment;
      a.presentation!.question = { ...question, assessment: undefined };
    }
    a.grades[0] = {
      ...a.grades[0],
      requirements: a.grades[0]
        .requirements!.toReversed()
        .map((r) => ({ ...r, description: 'Original wording' })),
      feedback: 'Historical feedback',
      model: 'historical-checker',
      at: 75,
    };
    await restore(backup(a));
    assert.deepEqual(await get('attempts', a.id), JSON.parse(JSON.stringify(a)));
  }
  await clearLocalWork();
  const incomplete = { ...submission(), response: {}, status: 'error', presentation: { question } };
  await restore(backup(incomplete));
  assert.deepEqual(await get('attempts', incomplete.id), incomplete);
});

test('original choice snapshots check verdicts and requirements while retaining legacy grades', async () => {
  const choice = {
    options: [
      { id: 'yes', text: 'Yes', feedback: 'Yes.' },
      { id: 'no', text: 'No', feedback: 'No.' },
    ],
    correctOption: 'yes',
  };
  const makeChoice = () =>
    gradeChoice(
      {
        ...submission(),
        mode: 'choice',
        response: undefined,
        choiceId: 'yes',
        presentation: { question: { ...question, assessment: undefined, choice } },
      },
      choice,
    );
  for (const mutate of [
    (a: Attempt) => {
      a.choiceId = 'no';
      a.text = 'No';
    },
    (a: Attempt) => {
      a.grades[0].requirements![0].satisfied = false;
    },
    (a: Attempt) => {
      delete a.grades[0].requirements;
    },
    (a: Attempt) => {
      a.mode = 'type';
    },
  ]) {
    await clearLocalWork();
    const a = makeChoice();
    mutate(a);
    await assert.rejects(restore(backup(a)), /Imported/);
  }
  for (const promptVersion of [undefined, 'authored-choice-1']) {
    await clearLocalWork();
    const a = makeChoice();
    delete a.grades[0].requirements;
    a.grades[0].promptVersion = promptVersion;
    await restore(backup(a));
    assert.deepEqual(await get('attempts', a.id), JSON.parse(JSON.stringify(a)));
  }
});

test('frozen Review definitions and another copy of an attempt protect snapshot-free imports', async () => {
  await clearLocalWork();
  const a = structured();
  a.review = {
    instanceId: 'original-instance',
    templateId: 'template',
    kind: 'focused-practice',
    concept: 'logic',
    skill: 'compute',
    intervalDays: 0,
    presentedAt: 1,
    scheduledFor: 1,
  };
  a.exercise = 'review-original-instance';
  a.response!.number = '3/4';
  delete a.presentation;
  const instance = {
    id: a.review.instanceId,
    exercise: a.exercise,
    contentVersion: a.contentVersion,
    question,
  };
  const key = 'review-instance/' + instance.id;
  const data = backup(a);
  data.records.push([key, record(key, instance)]);
  await assert.rejects(restore(data), /deterministic verdict disagrees/);
  // Definitions already saved on this device also apply during restoration.
  await put('records', key, record(key, instance));
  await assert.rejects(restore(backup(a)), /deterministic verdict disagrees/);
  await clearLocalWork();
  const original = structured();
  const copy = { ...original, mode: 'type', presentation: undefined };
  const copies = backup(copy);
  copies.records.push(['attempt/' + original.id, record('attempt/' + original.id, original)]);
  await assert.rejects(restore(copies), /answer mode differs/);
});

test('unverifiable historical and open grades remain unchanged', async () => {
  for (const presentation of [undefined, { question: { ...question, assessment: undefined } }]) {
    await clearLocalWork();
    const a = {
      ...structured(),
      mode: 'type',
      response: undefined,
      text: 'Original proof.',
      presentation,
    };
    a.grades[0].model = 'original-model';
    a.grades[0].diagnosis = [{ class: 'clerical', severity: 'minor' }];
    await restore(backup(a));
    assert.deepEqual(await get('attempts', a.id), JSON.parse(JSON.stringify(a)));
  }
});

test('restored lesson record revisions cannot outrank authoritative server results', async () => {
  await clearLocalWork();
  const a = {
    ...submission(),
    mode: 'type',
    response: undefined,
    status: 'graded',
    verdict: 'correct',
  };
  const data = backup(a);
  const key = 'attempt/' + a.id;
  data.records.push([key, record(key, a, 900)]);
  await restore(data);
  assert.equal((await get<RecordData>('records', key))!.revision, 0);
  const authoritative = { ...a, verdict: 'incorrect' };
  await integrate([record(key, authoritative, 1)], 1);
  assert.equal((await get<Attempt>('attempts', a.id))!.verdict, 'incorrect');
});
