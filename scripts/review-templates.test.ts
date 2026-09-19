import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateReviewTemplates } from './review-templates.js';
import { validateSources } from './sources.js';
const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const [templates, evidence, notebook, sources, teaching, syntax, typing, grading] =
  await Promise.all(
    [
      'content/review-templates.json',
      'output/content/learning-evidence.json',
      'output/content/notebook.json',
      'content/sources.json',
      'output/content/teaching.json',
      'content/tex-syntax.json',
      'content/tex-teaching.json',
      'output/grading-catalog.json',
    ].map(read),
  );
const validate = (rows = templates) =>
  validateReviewTemplates(
    rows,
    evidence,
    notebook.lessons.map((l: { slug: string }) => l.slug),
  );
test('review families publish without altering existing exercise identities', () => {
  assert.deepEqual(validate(), templates);
  assert.deepEqual(grading.reviewTemplates, templates);
  assert.deepEqual([...new Set(templates.map((t: { family: string }) => t.family))].sort(), [
    'authored',
    'fixed',
    'generated',
  ]);
  assert.ok(grading.exercises['predicates-and-quantifiers-1']);
});
test('review authoring rejects duplicate IDs, unknown targets, invalid family payloads and answer keys', () => {
  const duplicate = structuredClone(templates);
  duplicate.push(duplicate[0]);
  assert.throws(() => validate(duplicate), /Duplicate/);
  for (const field of ['concept', 'skill', 'lesson']) {
    const rows = structuredClone(templates);
    rows[0][field] = 'missing';
    assert.throws(() => validate(rows), /Unknown review/);
  }
  const rows = structuredClone(templates);
  rows[0].family = 'generated';
  assert.throws(() => validate(rows), /payload mismatch/);
  const choices = structuredClone(templates);
  choices[2].question.choice.correctOption = 'missing';
  assert.throws(() => validate(choices), /Invalid review choices/);
});
test('recognition choices cannot masquerade as production and placeholders must be supported', () => {
  const rows = structuredClone(templates);
  rows[2].evidenceLevel = 'production';
  assert.throws(() => validate(rows), /recognition/);
  const bad = structuredClone(templates);
  bad[2].question.prompt += '{{unknown}}';
  assert.throws(() => validate(bad), /placeholder/);
});
test('each generator accepts only its own renderable slots', () => {
  const cases = [
    {
      generator: 'integer-witness-sum',
      slots: ['a', 'sum', 'witness', 'witnessPlusOne', 'witnessMinusOne'],
      foreign: 'formula',
    },
    {
      generator: 'propositional-truth-values',
      slots: ['pTruth', 'qTruth', 'formula', 'resultText', 'oppositeText', 'explanation'],
      foreign: 'witness',
    },
    {
      generator: 'integer-conditional-counterexample',
      slots: ['a', 'b', 'below', 'above'],
      foreign: 'sum',
    },
  ];
  for (const { generator, slots, foreign } of cases) {
    const row = structuredClone(
      templates.find((t: { family: string }) => t.family === 'generated'),
    );
    row.generator = generator;
    const rendered = slots.map((slot) => `{{${slot}}}`).join(' ');
    row.question = {
      id: 1,
      section: 'Review',
      instructions: 'Select one answer.',
      prompt: rendered,
      answer: rendered,
      math: rendered,
      choice: {
        correctOption: 'correct',
        options: [
          { id: 'correct', text: rendered, feedback: rendered },
          { id: 'other', text: 'Other', feedback: 'Try again.' },
        ],
      },
    };
    assert.deepEqual(validate([row]), [row]);
    row.question.prompt += `{{${foreign}}}`;
    assert.throws(() => validate([row]), /placeholder/);
    row.generator = 'unknown-generator';
    assert.throws(() => validate([row]));
    delete row.generator;
    row.family = 'fixed';
    assert.throws(() => validate([row]), /placeholder/);
  }
});
test('all generated integer witness options are distinct and exactly one satisfies the condition', () => {
  // Independently audit the entire finite generator domain, including zero and negative witnesses.
  for (let a = 1; a <= 20; a++)
    for (let sum = 1; sum <= 20; sum++) {
      const witness = sum - a;
      const options = [witness, witness + 1, witness - 1];
      assert.equal(new Set(options).size, 3);
      assert.deepEqual(
        options.filter((x) => x + a === sum),
        [witness],
      );
    }
});
test('review citations cover every template, and any changed variant or feedback requires reinspection', () => {
  const check = (rows = templates, catalog = sources) =>
    validateSources(catalog, notebook.lessons, teaching, syntax, typing, rows);
  const result = check();
  for (const t of templates) assert.deepEqual(result.targets['review:' + t.id], t.sourceIds);
  const missing = structuredClone(sources);
  delete missing.reviewTemplates[templates[0].id];
  assert.throws(() => check(templates, missing), /coverage mismatch/);
  const changed = structuredClone(templates);
  changed[1].variants[0].answer += ' Changed.';
  assert.throws(() => check(changed), /reinspection/);
  const feedback = structuredClone(templates);
  feedback[2].question.choice.options[0].feedback += ' Changed.';
  assert.throws(() => check(feedback), /reinspection/);
});
