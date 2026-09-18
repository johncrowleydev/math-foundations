import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  coverageObservations,
  emptyCatalogFilters,
  filterReviewCatalog,
  reviewCoverage,
} from '../src/reviewCatalog';
import type { ReviewCatalogItem } from '../src/reviewTypes';
import type { Curriculum } from '../src/types';

const fixed: ReviewCatalogItem = {
  id: 'witness-definition',
  concept: 'existential-quantification',
  skill: 'recall',
  objective: 'witness-definition',
  lesson: 'predicates-and-quantifiers',
  family: 'fixed',
  evidenceLevel: 'production',
  cognitiveLevel: 'recall',
  interactionCost: 'low',
  inputCapabilities: ['short-text'],
  sourceTarget: 'review:witness-definition',
  question: {
    id: 1,
    instructions: 'Answer briefly.',
    prompt: 'What is a witness?',
    answer: 'A satisfying value.',
    section: 'Review',
  },
  quick: true,
  provenance: 'review-template',
  origin: 'content/review-templates.json',
  generated: false,
  variantCount: 0,
};
const authored: ReviewCatalogItem = {
  ...fixed,
  id: 'witness-variants',
  family: 'authored',
  variants: [
    fixed.question,
    { ...fixed.question, prompt: 'Complete the definition: a witness is ____.' },
  ],
  variantCount: 2,
};
const proof: ReviewCatalogItem = {
  ...fixed,
  id: 'sets-42:set-inclusion:prove',
  concept: 'set-inclusion',
  skill: 'prove',
  objective: undefined,
  lesson: 'sets',
  evidenceLevel: 'reasoning',
  quick: false,
  provenance: 'lesson-exercise',
  originalExercise: 'sets-42',
  question: { ...fixed.question, prompt: 'Prove that $A \\subseteq B$.' },
};
const generated: ReviewCatalogItem = {
  ...fixed,
  id: 'witness-selection',
  skill: 'interpret',
  objective: 'witness-selection',
  evidenceLevel: 'recognition',
  family: 'generated',
  generated: true,
  generator: 'integer-witness-sum',
};
const items = [fixed, authored, proof, generated];
const matching = (filters: Partial<typeof emptyCatalogFilters>) =>
  filterReviewCatalog(items, { ...emptyCatalogFilters, ...filters }).map((item) => item.id);

test('catalog filters combine by every metadata field and allow objective-presence inspection', () => {
  assert.deepEqual(
    matching({
      lesson: fixed.lesson,
      concept: fixed.concept,
      skill: 'recall',
      objective: ':present',
      family: 'authored',
      evidenceLevel: 'production',
      quick: 'yes',
      provenance: 'review-template',
    }),
    [authored.id],
  );
  assert.deepEqual(matching({ objective: 'witness-definition' }), [fixed.id, authored.id]);
  assert.deepEqual(matching({ objective: ':none' }), [proof.id]);
  assert.deepEqual(matching({ objective: ':present', skill: 'prove' }), []);
  assert.deepEqual(matching({ lesson: 'sets', provenance: 'review-template' }), []);
  assert.deepEqual(
    matching({}),
    items.map((item) => item.id),
  );
});

test('Quick and provenance filters use server metadata without inferring eligibility', () => {
  // This fixture deliberately has low-cost short-text input but a false server Quick flag.
  assert.equal(proof.interactionCost, 'low');
  assert.deepEqual(matching({ quick: 'no' }), [proof.id]);
  assert.deepEqual(matching({ quick: 'yes' }), [fixed.id, authored.id, generated.id]);
  assert.deepEqual(matching({ provenance: 'lesson-exercise' }), [proof.id]);
  assert.deepEqual(matching({ provenance: 'review-template' }), [
    fixed.id,
    authored.id,
    generated.id,
  ]);
});

test('search spans IDs, targets, lessons and all authored prompts and tolerates case and slug spacing', () => {
  assert.deepEqual(matching({ search: ' SET INCLUSION ' }), [proof.id]);
  assert.deepEqual(matching({ search: 'witness-definition' }), [fixed.id, authored.id]);
  assert.deepEqual(matching({ search: 'prove' }), [proof.id]);
  assert.deepEqual(matching({ search: 'PREDICATES AND QUANTIFIERS' }), [
    fixed.id,
    authored.id,
    generated.id,
  ]);
  assert.deepEqual(matching({ search: 'complete the definition' }), [authored.id]);
  assert.deepEqual(matching({ search: 'witness', family: 'generated' }), [generated.id]);
  assert.deepEqual(matching({ search: 'nothing matches this' }), []);
});

test('coverage counts effective templates once and keeps objectives and skills separate', () => {
  const additional = { ...fixed, id: 'broad-recall', objective: undefined };
  const coverage = reviewCoverage([...items, additional]);
  assert.equal(coverage.length, 4);
  const definition = coverage.find((group) => group.objective === 'witness-definition')!;
  assert.deepEqual(
    {
      total: definition.total,
      quick: definition.quick,
      recognition: definition.recognition,
      production: definition.production,
      reasoning: definition.reasoning,
      fixed: definition.fixed,
      authored: definition.authored,
      generated: definition.generated,
    },
    {
      total: 2,
      quick: 2,
      recognition: 0,
      production: 2,
      reasoning: 0,
      fixed: 1,
      authored: 1,
      generated: 0,
    },
  );
  const selection = coverage.find((group) => group.objective === 'witness-selection')!;
  assert.equal(selection.generated, 1);
  assert.equal(selection.recognition, 1);
  assert.equal(coverage.find((group) => group.skill === 'prove')?.reasoning, 1);
  assert.equal(coverage.find((group) => group.skill === 'recall' && !group.objective)?.total, 1);
  const filtered = reviewCoverage(
    filterReviewCatalog(items, { ...emptyCatalogFilters, family: 'authored' }),
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].total, 1);
  assert.deepEqual(reviewCoverage([]), []);
});

test('coverage observations describe template availability, including for deeper evidence', () => {
  const [deep] = reviewCoverage([proof]);
  assert.deepEqual(coverageObservations(deep), [
    'No Quick-compatible template',
    'No production-level template',
    'Only one fixed template',
    'No variant/generator coverage',
  ]);
  const [recognition] = reviewCoverage([generated]);
  assert.deepEqual(coverageObservations(recognition), [
    'Recognition only',
    'No production-level template',
    'No reasoning/proof template',
  ]);
});

test('question inspection renders instructions, math, correct choices, feedback, answer and table structure', async () => {
  // Initialize storage without a browser window so its cross-tab channel stays disabled.
  await import('../src/storage');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { addEventListener() {} },
  });
  const { CatalogQuestion } = await import('../src/ReviewLibrary');
  const html = renderToStaticMarkup(
    createElement(CatalogQuestion, {
      question: {
        id: 3,
        instructions: 'Select one answer.',
        section: 'Review',
        prompt: 'Find $x$.',
        math: 'x+2=5',
        answer: '$x=3$.',
        table: { columns: ['x', 'x+2'], rows: 4 },
        choice: {
          correctOption: 'three',
          options: [
            { id: 'three', text: '$3$', feedback: 'This satisfies the equation.' },
            { id: 'four', text: '$4$', feedback: 'Too large.' },
          ],
        },
      },
    }),
  );
  for (const text of [
    'Select one answer.',
    'katex',
    'Correct answer',
    'This satisfies the equation.',
    'Too large.',
    'Answer',
    'Response table · 4 rows',
    '<th>',
  ])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes('<input'), 'audit choices are read-only, not learner controls');
});

test('library starts with a distinct loading state and a Review return link', async () => {
  const { ReviewLibrary } = await import('../src/ReviewLibrary');
  const data = { lessons: [], evidence: { concepts: [], skills: [] } } as unknown as Curriculum;
  const html = renderToStaticMarkup(createElement(ReviewLibrary, { data, lesson: 'sets' }));
  assert.ok(html.includes('Loading review catalog…'));
  assert.ok(html.includes('Review Library'));
  assert.ok(html.includes('#/review/sets'));
});
