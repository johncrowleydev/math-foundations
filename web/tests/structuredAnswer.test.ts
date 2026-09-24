import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StructuredAnswer, SubmittedStructuredAnswer } from '../src/StructuredAnswer';
import {
  assessmentFingerprint,
  gradeStructured,
  pasteGrid,
  reconcileResponse,
  responseComplete,
  validResponse,
} from '../src/structuredAnswer';
import {
  all,
  clearLocalWork,
  emptyDraft,
  exportData,
  get,
  importData,
  integrate,
  put,
  saveAttempt,
  saveMedia,
} from '../src/storage';
import type { Assessment, Attempt, Draft, Question } from '../src/types';

const assessment: Assessment = {
  version: 1,
  inputs: [
    {
      id: 'truth',
      kind: 'grid',
      label: 'Truth table',
      columns: ['$p$', '$q$', '$p \\land q$'],
      rows: [
        { label: 'TT', cells: [{ given: true }, { given: true }, { id: 'tt', kind: 'boolean' }] },
        { label: 'TF', cells: [{ given: true }, { given: false }, { id: 'tf', kind: 'boolean' }] },
      ],
    },
  ],
  requirements: [
    {
      id: 'values',
      description: 'Both conjunction values',
      validator: 'boolean',
      fields: ['tt', 'tf'],
      params: { expected: [true, false] },
    },
  ],
  feedback: { correct: 'Both inputs must be true.', incorrect: 'Check when conjunction is true.' },
  evidence: { level: 'production', interactionCost: 'low', inputCapabilities: ['tap'] },
};
const question: Question = {
  id: 40,
  section: 'truth',
  instructions: 'Complete the table.',
  assessment,
};
const attempt = (): Attempt => ({
  id: 'structured-one',
  exercise: 'logic-40',
  submitted: 100,
  contentVersion: 'v1',
  mode: 'structured',
  response: { tt: true, tf: false },
  text: '',
  images: [],
  revealed: false,
  status: 'queued',
  grades: [],
});

test('blank cells remain incomplete while false, zero and explicit empty selections are answers', () => {
  assert.equal(responseComplete(assessment, { tt: true }), false);
  assert.equal(responseComplete(assessment, { tt: true, tf: null }), false);
  assert.equal(responseComplete(assessment, { tt: true, tf: false }), true);
  const inputs: Assessment = {
    ...assessment,
    inputs: [
      { id: 'n', kind: 'text', label: 'Number' },
      { id: 'set', kind: 'multiselect', label: 'Set', options: [{ id: 'a', label: 'a' }] },
    ],
  };
  assert.equal(responseComplete(inputs, { n: '0', set: [] }), true);
  assert.equal(responseComplete(inputs, { n: '0' }), false);
  assert.equal(validResponse({ tf: false, n: '0', set: [], empty: null }), true);
  assert.equal(validResponse(JSON.parse('{"__proto__":"unsafe"}')), false);
  assert.equal(validResponse({ number: 0 }), false);
});

test('local grading snapshots the authored presentation and ignores optional work', () => {
  const graded = gradeStructured(
    {
      ...attempt(),
      text: 'Scratch notes',
      images: ['private'],
      ink: { scratch: true },
      photos: [{ hash: 'photo', rotation: 0 }],
    },
    question,
  );
  assert.equal(graded.status, 'graded');
  assert.equal(graded.verdict, 'correct');
  assert.equal(graded.grades[0].model, 'deterministic');
  assert.deepEqual(graded.presentation, { question });
  assert.equal(graded.text, '');
  assert.deepEqual(graded.images, []);
  assert.equal(graded.ink, undefined);
  assert.equal(graded.photos, undefined);
  assert.equal(
    gradeStructured({ ...attempt(), response: { tt: false, tf: false } }, question).verdict,
    'incorrect',
  );
  assert.throws(() => gradeStructured({ ...attempt(), response: { tt: true } }, question));
});

test('changed input definitions preserve earlier answers and all scratchwork without remapping', () => {
  const old = reconcileResponse(
    {
      ...emptyDraft(),
      text: 'Old working',
      strokes: [{ color: 'black', width: 2, points: [{ x: 1, y: 2, p: 1 }] }],
      photos: [{ hash: 'a'.repeat(64), rotation: 90 }],
    },
    question,
  );
  old.response = { tt: true, tf: false };
  const renamed: Question = { ...question, instructions: 'Evaluate a different table.' };
  const next = reconcileResponse(old, renamed);
  assert.deepEqual(next.response, {});
  assert.deepEqual(next.earlierWork?.[0].response, old.response);
  assert.deepEqual(next.earlierWork?.[0].question, question);
  assert.equal(next.text, old.text);
  assert.deepEqual(next.strokes, old.strokes);
  assert.deepEqual(next.photos, old.photos);
  assert.equal(reconcileResponse(next, renamed), next);
  assert.deepEqual(reconcileResponse(next, question).response, old.response);
  assert.equal(
    assessmentFingerprint({ ...question, displayNumber: 99, section: 'elsewhere' }),
    assessmentFingerprint(question),
  );
  assert.equal(
    assessmentFingerprint({
      ...question,
      assessment: {
        evidence: assessment.evidence,
        feedback: assessment.feedback,
        requirements: assessment.requirements,
        inputs: assessment.inputs,
        version: 1,
      },
    }),
    assessmentFingerprint(question),
  );
});

test('adding an accepted answer preserves legacy fingerprints and saved draft responses', () => {
  // This is the serialized fingerprint stored before accepted answers were added.
  const legacyFingerprint =
    '{"assessment":{"evidence":{"inputCapabilities":["tap"],"interactionCost":"low","level":"production"},"feedback":{"correct":"Both inputs must be true.","incorrect":"Check when conjunction is true."},"inputs":[{"columns":["$p$","$q$","$p \\\\land q$"],"id":"truth","kind":"grid","label":"Truth table","rows":[{"cells":[{"given":true},{"given":true},{"id":"tt","kind":"boolean"}],"label":"TT"},{"cells":[{"given":true},{"given":false},{"id":"tf","kind":"boolean"}],"label":"TF"}]}],"requirements":[{"description":"Both conjunction values","fields":["tt","tf"],"id":"values","params":{"expected":[true,false]},"validator":"boolean"}],"version":1},"instructions":"Complete the table."}';
  assert.equal(assessmentFingerprint(question), legacyFingerprint);
  const withSolution = { ...assessment, solution: { tt: true, tf: false } };
  const revised = { ...question, assessment: withSolution };
  assert.equal(assessmentFingerprint(revised), legacyFingerprint);
  const draft: Draft = {
    ...emptyDraft(),
    response: { tt: false, tf: false },
    text: 'Still working on the first row.',
    assessmentFingerprint: legacyFingerprint,
    assessmentQuestion: question,
  };
  assert.equal(reconcileResponse(draft, revised), draft);
  assert.deepEqual(draft.response, { tt: false, tf: false });
  assert.equal(draft.earlierWork, undefined);
  assert.equal(draft.assessmentQuestion?.assessment, assessment);
  assert.equal('solution' in assessment, false);
});

test('grid paste is atomic, respects givens and preserves blank versus false', () => {
  const input = assessment.inputs[0];
  assert.equal(input.kind, 'grid');
  if (input.kind !== 'grid') return;
  assert.deepEqual(pasteGrid(input, {}, 0, 2, 'T\nF'), { tt: true, tf: false });
  assert.deepEqual(pasteGrid(input, { tf: true }, 0, 2, '\nF'), { tt: null, tf: false });
  const original = { tt: true };
  assert.throws(() => pasteGrid(input, original, 0, 2, 'F\nunknown'));
  assert.deepEqual(original, { tt: true });
  assert.throws(() => pasteGrid(input, original, 0, 0, 'T\tT\tF'));
  assert.throws(() => pasteGrid(input, original, 1, 2, 'T\nF'));
});

test('choice drafts also retain their original option before an authored question changes', () => {
  const first: Question = {
    id: 1,
    section: 'choices',
    instructions: 'Choose a value.',
    choice: {
      correctOption: 'yes',
      options: [
        { id: 'yes', text: 'Yes', feedback: 'Valid.' },
        { id: 'no', text: 'No', feedback: 'Check again.' },
      ],
    },
  };
  const draft = reconcileResponse({ ...emptyDraft(), choiceId: 'yes' }, first);
  assert.equal(draft.choiceId, 'yes');
  const next = reconcileResponse(draft, { ...first, prompt: 'A different question.' });
  assert.equal(next.choiceId, undefined);
  assert.deepEqual(next.earlierWork?.[0].response, { choice: 'yes' });
  assert.equal(reconcileResponse(next, first).choiceId, 'yes');
});

test('structured upload excludes presentation, grade, media and scratch text', async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { addEventListener() {} },
  });
  const { attemptSubmission, recheck } = await import('../src/sync');
  const graded = gradeStructured(attempt(), question);
  const submission = attemptSubmission({
    ...graded,
    text: 'Do not upload',
    images: ['private'],
    photos: [{ hash: 'private', rotation: 0 }],
    ink: { scratch: true },
    choiceId: 'old-choice',
  });
  assert.deepEqual(submission.response, { tt: true, tf: false });
  assert.equal(submission.text, '');
  assert.deepEqual(submission.images, []);
  for (const key of ['presentation', 'grades', 'status', 'verdict', 'photos', 'ink', 'choiceId'])
    assert.equal(key in submission, false, key);
  const before = await all('outbox');
  await assert.rejects(recheck(graded, 'Reconsider'), /automatically/);
  assert.deepEqual(await all('outbox'), before);
});

test('response grids render accessible buttons and historical data from their own snapshot', () => {
  const editable = renderToStaticMarkup(
    createElement(StructuredAnswer, { assessment, response: { tf: false }, onChange() {} }),
  );
  assert.equal((editable.match(/class="boolean-cell/g) || []).length, 2);
  assert.ok(editable.includes('Truth table, TT, $p \\land q$: blank'));
  assert.ok(editable.includes('Truth table, TF, $p \\land q$: F'));
  assert.ok(editable.includes('scope="col"'));
  assert.ok(editable.includes('scope="row"'));
  const readonly = renderToStaticMarkup(
    createElement(SubmittedStructuredAnswer, { attempt: gradeStructured(attempt(), question) }),
  );
  assert.ok(readonly.includes('Truth table'));
  assert.ok(!readonly.includes('<input'));
  assert.ok(!readonly.includes('<button'));
  const fallback = renderToStaticMarkup(
    createElement(SubmittedStructuredAnswer, { attempt: attempt() }),
  );
  assert.ok(fallback.includes('<dt>tf</dt>'));
  assert.ok(fallback.includes('F'));
});

test('structured attempts and earlier draft answers round-trip with local scratch media and no regrading', async () => {
  await clearLocalWork();
  const photoHash = await saveMedia(new Blob(['scratch'], { type: 'image/png' }));
  const draft = reconcileResponse(
    {
      ...emptyDraft(),
      text: 'Personal notes',
      photos: [{ hash: photoHash, rotation: 90 }],
      strokes: [{ color: '#000', width: 2, points: [{ x: 1, y: 2, p: 0.5 }] }],
    },
    question,
  );
  draft.response = { tt: true, tf: false };
  const changed = reconcileResponse(draft, { ...question, prompt: 'New values.' });
  await put('drafts', 'logic-40', changed);
  const graded = gradeStructured(attempt(), question);
  await saveAttempt(graded);
  const backup = await exportData();
  await clearLocalWork();
  await importData(backup, 'structured.json');
  assert.deepEqual(await get('attempts', graded.id), JSON.parse(JSON.stringify(graded)));
  const restored = await get<Draft>('drafts', 'logic-40');
  assert.deepEqual(restored, JSON.parse(JSON.stringify(changed)));
  assert.equal(await (await get<Blob>('media', photoHash))?.text(), 'scratch');
  assert.deepEqual((await get<any>('outbox', graded.id)).data.response, graded.response);
  const bad = JSON.parse(await backup.text());
  bad.attempts[0][1].response = { nested: { unacceptable: true } };
  await assert.rejects(importData(new Blob([JSON.stringify(bad)]), 'bad.json'), /Invalid attempt/);
});

test('late transcription of an earlier open answer cannot clear converted scratchwork', async () => {
  const hash = await saveMedia(new Blob(['retained'], { type: 'image/png' }));
  const current = reconcileResponse(
    { ...emptyDraft(), photos: [{ hash, rotation: 0 }], editing: false },
    question,
  );
  await put('drafts', 'old-open', current);
  const old: Attempt = {
    ...attempt(),
    id: 'old-open-attempt',
    exercise: 'old-open',
    mode: 'photo',
    response: undefined,
    photos: [{ hash, rotation: 0 }],
    images: [hash],
  };
  await put('attempts', old.id, old);
  await integrate(
    [
      {
        key: 'attempt/' + old.id,
        id: 'sync',
        revision: 30,
        device: 'server',
        updated: 100,
        payload: {
          ...old,
          photos: undefined,
          images: [],
          transcription: 'Old final answer',
          status: 'graded',
          grades: [
            {
              at: 100,
              verdict: 'correct',
              feedback: 'Correct.',
              transcription: 'Old final answer',
            },
          ],
        },
        versions: [],
        conflicts: [],
      },
    ],
    30,
  );
  assert.deepEqual((await get<Draft>('drafts', old.exercise))?.photos, current.photos);
  assert.ok(await get('media', hash));
});

test('accepted response rendering uses TeX for math, preserves literal text, and identifies empty selections', () => {
  const a: Assessment = {
    ...assessment,
    inputs: [
      { id: 'formula', kind: 'math', label: 'Formula' },
      { id: 'text', kind: 'text', label: 'Text' },
      {
        id: 'selection',
        kind: 'multiselect',
        label: 'Selection',
        options: [{ id: 'a', label: 'A' }],
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(StructuredAnswer, {
      assessment: a,
      response: { formula: String.raw`A\cap B`, text: String.raw`A\_B * C`, selection: [] },
      acceptedValues: true,
    }),
  );
  assert.ok(html.includes(String.raw`<span class="literal-answer-value">A\_B * C</span>`));
  assert.ok(
    html.includes(String.raw`<annotation encoding="application/x-tex">A\cap B</annotation>`),
  );
  assert.ok(html.includes('Copy TeX'));
  assert.ok(!html.includes('katex-error'));
  assert.ok(html.includes('Empty set'));
  assert.ok(!html.includes('<input'));
});
