import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAssessment } from '../../shared/deterministic';
const cases = JSON.parse(
  await readFile('tests/grading/fixtures/deterministic-definition-cases.json', 'utf8'),
) as {
  name: string;
  assessment: unknown;
}[];
for (const c of cases)
  test('invalid deterministic definition: ' + c.name, () => {
    assert.throws(() => validateAssessment(c.assessment));
  });
