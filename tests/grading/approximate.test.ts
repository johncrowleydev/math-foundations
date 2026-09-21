import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validateAssessment } from '../../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../../shared/assessment.js';
const fixtures = JSON.parse(
  await readFile('tests/grading/fixtures/approximate-fixtures.json', 'utf8'),
) as {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[];
for (const f of fixtures)
  test('approximate number: ' + f.name, () => {
    validateAssessment(f.assessment);
    if (f.error) assert.throws(() => gradeAssessment(f.assessment, f.response), InputError);
    else assert.equal(gradeAssessment(f.assessment, f.response).verdict, f.verdict);
  });
for (const f of JSON.parse(
  await readFile('tests/grading/fixtures/approximate-definition-cases.json', 'utf8'),
))
  test('invalid approximate definition: ' + f.name, () =>
    assert.throws(() => validateAssessment(f.assessment)),
  );
