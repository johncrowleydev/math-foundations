import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateReviewVariants } from '../../tools/content/review-variants.js';
import { validateReviewVariantSources } from '../../tools/content/sources.js';
const read = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
const [banks, templates, sources] = await Promise.all(
  ['content/review-variants.json', 'content/review-templates.json', 'content/sources.json'].map(
    read,
  ),
);

test('every former runtime generator has complete authored questions and parameters', () => {
  assert.deepEqual(validateReviewVariants(banks, templates), banks);
  assert.equal(
    Object.values(banks).reduce((count: number, bank: any) => count + bank.variants.length, 0),
    521,
  );
  validateReviewVariantSources(sources, banks, templates);
});

test('review banks reject missing cases, identity reordering, executable fields, placeholders and bad grading keys', () => {
  for (const mutate of [
    (rows: any) => {
      delete rows['integer-witness-selection'];
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants.pop();
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants.reverse();
    },
    (rows: any) => {
      rows['integer-witness-selection'].selection.hashBytes[0] = 32;
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].generate = 'makeQuestion()';
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].question.prompt += '{{a}}';
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].question.choice.correctOption = 'missing';
    },
  ]) {
    const rows = structuredClone(banks);
    mutate(rows);
    assert.throws(() => validateReviewVariants(rows, templates));
  }
});

test('review bank source coverage includes complete questions, feedback, parameters and selection order', () => {
  for (const mutate of [
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].question.answer += ' Changed.';
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].question.choice.options[0].feedback +=
        ' Changed.';
    },
    (rows: any) => {
      rows['integer-witness-selection'].variants[0].parameters.witness++;
    },
    (rows: any) => {
      rows['integer-witness-selection'].selection.hashBytes.reverse();
    },
  ]) {
    const rows = structuredClone(banks);
    mutate(rows);
    assert.throws(() => validateReviewVariantSources(sources, rows, templates), /reinspection/);
  }
  const missing = structuredClone(sources);
  delete missing.reviewVariants['integer-witness-selection'];
  assert.throws(() => validateReviewVariantSources(missing, banks, templates), /coverage/);
});
