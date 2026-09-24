import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validateAssessment } from '../../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../../shared/assessment.js';

const cases = JSON.parse(
  await readFile('tests/grading/fixtures/matrix-tex-spacing.json', 'utf8'),
) as {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[];

for (const example of cases)
  test(example.name, () => {
    validateAssessment(example.assessment);
    if (example.error)
      assert.throws(() => gradeAssessment(example.assessment, example.response), InputError);
    else
      assert.equal(gradeAssessment(example.assessment, example.response).verdict, example.verdict);
  });
