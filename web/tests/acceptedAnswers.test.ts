import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCurriculum } from '../src/types';

test('accepted answers travel in the existing offline notebook bundle with no new fetch', async () => {
  const savedFetch = globalThis.fetch;
  const index = { 'test-contract': { answer: '1/2' } };
  for (const acceptedAnswers of [undefined, index]) {
    const requested: string[] = [];
    const bundled: Record<string, unknown> = {
      notebook: { lessons: [], ...(acceptedAnswers ? { acceptedAnswers } : {}) },
      teaching: { references: [], figures: [], formulas: [] },
      'tex-syntax': { entries: [] },
      'tex-teaching': { basics: [], placements: [], exercises: [], references: [] },
      'grading-version': { version: 'fixture' },
      'learning-evidence': {},
      sources: {},
    };
    try {
      globalThis.fetch = async (input) => {
        const url = String(input);
        requested.push(url);
        const name = url.slice(1, -5);
        assert.ok(name in bundled, `unexpected network dependency: ${url}`);
        return new Response(JSON.stringify(bundled[name]));
      };
      const curriculum = await loadCurriculum();
      assert.deepEqual(curriculum.acceptedAnswers, acceptedAnswers);
      assert.deepEqual(
        requested.sort(),
        Object.keys(bundled)
          .map((name) => `/${name}.json`)
          .sort(),
      );
    } finally {
      globalThis.fetch = savedFetch;
    }
  }
});
