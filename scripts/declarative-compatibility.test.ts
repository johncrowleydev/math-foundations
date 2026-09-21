import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseline = JSON.parse(
  await readFile('scripts/fixtures/declarative-runtime-baseline.json', 'utf8'),
) as { commit: string; artifacts: Record<string, string> };

for (const [artifact, expected] of Object.entries(baseline.artifacts)) {
  test(`declarative migration preserves ${artifact} from ${baseline.commit}`, async () => {
    let bytes = await readFile('output/' + artifact);
    if (artifact === 'grading-catalog.json') {
      // The only new field supplies previously code-owned finite review banks.
      // Existing frozen contexts, ordered definitions, and the grading version
      // must still match the independently captured pre-migration build exactly.
      const catalog = JSON.parse(bytes.toString('utf8'));
      delete catalog.reviewVariants;
      bytes = Buffer.from(JSON.stringify(catalog));
    }
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      expected,
      'Unexpected curriculum/history change. Inspect the semantic diff; never refresh a migration baseline just to pass validation.',
    );
  });
}
