import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment } from '../../shared/deterministic.js';
import type { Assessment, StructuredResponse } from '../../shared/assessment.js';

const fixtures: {
  name: string;
  assessment: Assessment;
  response: StructuredResponse;
  verdict: string;
}[] = JSON.parse(await readFile('tests/grading/fixtures/accepted-answer-tex.json', 'utf8'));
for (const fixture of fixtures)
  test('accepted-answer TeX: ' + fixture.name, () => {
    assert.equal(gradeAssessment(fixture.assessment, fixture.response).verdict, fixture.verdict);
  });
