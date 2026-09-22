import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyReviewCost, reviewCategories, reviewSeconds } from '../../shared/reviewCost.js';
import { worksheetSchema } from '../../tools/content/content.js';
import type { Assessment } from '../../shared/assessment.js';

const assessment = (kind: 'boolean' | 'select' | 'math' | 'grid'): Assessment => ({
  version: 1,
  inputs: [
    kind === 'select'
      ? { id: 'answer', kind, label: 'Synthetic', options: [] }
      : kind === 'grid'
        ? { id: 'answer', kind, label: 'Synthetic', columns: [], rows: [] }
        : { id: 'answer', kind, label: 'Synthetic' },
  ],
  requirements: [],
  feedback: { correct: 'Synthetic', incorrect: 'Synthetic' },
  evidence: { level: 'production', interactionCost: 'low', inputCapabilities: ['short-text'] },
});

test('review costs distinguish seven categories without changing required evidence', () => {
  assert.equal(reviewCategories.length, 7);
  assert.equal(
    classifyReviewCost({ assessment: assessment('math') }, ['recall']).category,
    'definition',
  );
  assert.equal(
    classifyReviewCost({ choice: { options: [{ text: 'A' }, { text: 'B' }] } }, ['recall'])
      .category,
    'definition',
  );
  assert.equal(
    classifyReviewCost({ prompt: 'Give a proof.' }, ['recall', 'prove']).category,
    'proof',
  );
  assert.deepEqual(classifyReviewCost({ prompt: 'Prove this statement.' }), {
    category: 'proof',
    estimatedSeconds: 600,
  });
  assert.deepEqual(classifyReviewCost({}, ['justify']), {
    category: 'deep-reasoning',
    estimatedSeconds: 300,
  });
  assert.deepEqual(classifyReviewCost({}, ['recall']), {
    category: 'definition',
    estimatedSeconds: 20,
  });
  assert.deepEqual(classifyReviewCost({ prompt: 'Compute the result.' }), {
    category: 'short-application',
    estimatedSeconds: 120,
  });
  assert.deepEqual(classifyReviewCost({ prompt: 'Name the object.' }), {
    category: 'short-answer',
    estimatedSeconds: 60,
  });
  assert.equal(
    classifyReviewCost({ choice: { options: [{ text: 'True' }, { text: 'False' }] } }).category,
    'true-false',
  );
  assert.equal(
    classifyReviewCost({ choice: { options: [{ text: 'A' }, { text: 'B' }] } }).category,
    'multiple-choice',
  );
  assert.equal(classifyReviewCost({}, ['recall', 'justify']).category, 'deep-reasoning');
  const original = assessment('grid');
  const frozen = structuredClone(original);
  assert.equal(classifyReviewCost({ assessment: original }).category, 'short-application');
  assert.deepEqual(original, frozen);
  assert.equal(classifyReviewCost({ assessment: assessment('math') }).category, 'short-answer');
  assert.equal(classifyReviewCost({ assessment: assessment('boolean') }).category, 'true-false');
  assert.equal(
    classifyReviewCost({ assessment: assessment('select') }).category,
    'multiple-choice',
  );
  assert.equal(
    classifyReviewCost({ category: 'definition', prompt: 'Select the meaning of proof.' })
      .estimatedSeconds,
    reviewSeconds.definition,
  );
});

test('worksheet authors can override a cost heuristic using the bounded vocabulary', () => {
  const worksheet = {
    title: 'Synthetic',
    sections: [
      {
        title: 'Synthetic',
        questions: [
          {
            id: 1,
            prompt: 'Synthetic',
            answer: 'Synthetic',
            answerLines: 1,
            category: 'definition',
          },
        ],
      },
    ],
  };
  assert.equal(worksheetSchema.parse(worksheet).sections[0].questions[0].category, 'definition');
  worksheet.sections[0].questions[0].category = 'arbitrary';
  assert.throws(() => worksheetSchema.parse(worksheet));
});

test('required reasoning depth supplies the same fallback and precedence as Go review costs', () => {
  const question = { prompt: 'Compute the result.' };
  assert.deepEqual(classifyReviewCost(question, ['construct'], 'reasoning'), {
    category: 'deep-reasoning',
    estimatedSeconds: 300,
  });
  assert.equal(
    classifyReviewCost(question, ['construct'], 'production').category,
    'short-application',
  );
  assert.equal(classifyReviewCost(question, ['prove'], 'reasoning').category, 'proof');
  // Planning cost overrides and response controls do not lower required evidence.
  assert.equal(
    classifyReviewCost({ ...question, category: 'definition' }, ['construct'], 'reasoning')
      .category,
    'definition',
  );
  assert.equal(
    classifyReviewCost({ assessment: assessment('math') }, ['construct'], 'reasoning').category,
    'short-answer',
  );
});
