import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError, validateAssessment } from '../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../shared/assessment.js';
const fixtures = JSON.parse(await readFile('shared/deterministic-fixtures.json', 'utf8')) as {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict?: string;
  error?: boolean;
}[];
for (const f of fixtures)
  test('deterministic conformance: ' + f.name, () => {
    validateAssessment(f.assessment);
    if (f.error) assert.throws(() => gradeAssessment(f.assessment, f.response), InputError);
    else assert.equal(gradeAssessment(f.assessment, f.response).verdict, f.verdict);
  });
test('definitions reject unknown validator, missing field requirements and duplicate IDs', () => {
  const original = fixtures[0].assessment;
  for (const change of [
    (a: Assessment) => {
      a.requirements[0].validator = 'remote';
    },
    (a: Assessment) => {
      a.inputs.push({ id: 'extra', kind: 'text', label: 'Extra' });
    },
    (a: Assessment) => {
      a.inputs.push({ ...a.inputs[0] });
    },
  ]) {
    const a = structuredClone(original);
    change(a);
    assert.throws(() => validateAssessment(a));
  }
});
