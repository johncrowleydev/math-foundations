import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { compileWrittenReviewQuestions } from '../../tools/content/review-coverage.js';
import type { EvidenceCatalog } from '../../web/src/evidenceTypes.js';
import type { Assessment } from '../../shared/assessment.js';
import { sourceHash, validateWrittenReviewSources } from '../../tools/content/sources.js';
import type { AuthoredReviewTemplate } from '../../tools/content/review-templates.js';

const original = {
  id: 1,
  instructions: 'Explain your answer.',
  prompt: 'Classify the statement.',
  math: 'p\\lor\\neg p',
  answer: 'Always true: either p or its negation is true.',
};
const lesson = { slug: 'logic', questions: [original] };
const evidence = {
  exercises: {
    'logic-1': {
      concepts: [{ concept: 'classification', role: 'primary' }],
      skills: [{ skill: 'justify', role: 'primary' }],
      representations: [],
    },
  },
} as unknown as EvidenceCatalog;
const promoted = {
  ...original,
  prompt: 'Select an answer and reason.',
  assessment: { evidence: { level: 'recognition' } } as Assessment,
};

test('conversion retains the original written task for a missing reasoning target', () => {
  const questions = compileWrittenReviewQuestions(
    [lesson],
    [{ ...lesson, questions: [promoted] }],
    evidence,
    [],
  );
  assert.deepEqual(questions['logic-1'], {
    instructions: questions['logic-1'].instructions,
    prompt: original.prompt,
    math: original.math,
    officialAnswer: original.answer,
    table: undefined,
  });
  assert.ok(questions['logic-1'].instructions.startsWith(original.instructions + '\n\n'));
  assert.equal('assessment' in questions['logic-1'], false);
  assert.equal(promoted.prompt, 'Select an answer and reason.');
});

test('existing compatible questions need no additional written representation', () => {
  assert.deepEqual(compileWrittenReviewQuestions([lesson], [lesson], evidence, []), {});
});

test('an uncovered skill fails the build instead of publishing an unanswerable review', () => {
  assert.throws(
    () => compileWrittenReviewQuestions([], [{ ...lesson, questions: [promoted] }], evidence, []),
    /Review targets without compatible questions: classification:justify:/,
  );
});

test('a shallow template declaration cannot cover a deeper target even with a deep assessment', () => {
  const templates = [
    {
      concept: 'classification',
      skill: 'justify',
      evidenceLevel: 'production',
      question: { assessment: { evidence: { level: 'reasoning' } } },
    },
    {
      concept: 'classification',
      skill: 'justify',
      evidenceLevel: 'reasoning',
      question: { assessment: { evidence: { level: 'recognition' } } },
    },
  ] as AuthoredReviewTemplate[];
  assert.throws(
    () => compileWrittenReviewQuestions([], [], evidence, templates),
    /without compatible questions/,
  );
});

test('open recall keeps its production requirement after conversion', () => {
  const recall = structuredClone(evidence);
  recall.exercises['logic-1'].skills = [{ skill: 'recall', role: 'primary' }];
  assert.ok(
    compileWrittenReviewQuestions([lesson], [{ ...lesson, questions: [promoted] }], recall, [])[
      'logic-1'
    ],
  );
});

test('one written question can restore multiple primary skills but never supporting tags', () => {
  const related = structuredClone(evidence);
  related.exercises['logic-1'].skills.push({ skill: 'analyze', role: 'primary' });
  related.exercises['logic-1'].concepts.push({ concept: 'unrelated', role: 'supporting' });
  assert.equal(
    Object.keys(
      compileWrittenReviewQuestions([lesson], [{ ...lesson, questions: [promoted] }], related, []),
    ).length,
    1,
  );
});

test('published written representations are source-pinned separately from converted exercises', async () => {
  const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
  const [catalog, sources, publishedSources] = await Promise.all(
    ['output/grading-catalog.json', 'content/sources.json', 'output/content/sources.json'].map(
      read,
    ),
  );
  const questions = Object.fromEntries(
    Object.entries(catalog.exercises)
      .filter(([, e]: [string, any]) => e.reviewQuestion)
      .map(([id, e]: [string, any]) => [id, e.reviewQuestion]),
  );
  assert.ok(Object.keys(questions).length > 0);
  const written = await read('content/written-review.json');
  for (const id of Object.keys(written.overrides)) {
    assert.ok(
      questions[id],
      'Every written correction must reach a published review question: ' + id,
    );
  }
  validateWrittenReviewSources(sources, questions, publishedSources.targets);
  const key = Object.keys(questions)[0];
  assert.equal(sources.reviewQuestions[key].reviewedContentHash, sourceHash(questions[key]));
  const changed = structuredClone(questions) as Record<string, { officialAnswer: string }>;
  changed[key].officialAnswer += ' Changed.';
  assert.throws(
    () => validateWrittenReviewSources(sources, changed, publishedSources.targets),
    /need reinspection/,
  );
  const missing = structuredClone(sources);
  delete missing.reviewQuestions[key];
  assert.throws(
    () => validateWrittenReviewSources(missing, questions, publishedSources.targets),
    /coverage mismatch/,
  );
});
