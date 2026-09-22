import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { comparableCatalog, comparableNotebook } from './compatibility.js';

const baseline = JSON.parse(
  await readFile(new URL('./fixtures/published-compatibility.json', import.meta.url), 'utf8'),
) as {
  commit: string;
  artifacts: Record<string, string>;
  inspectedUpdates?: Record<string, { sha256: string; commit: string; inspection: string }>;
};

for (const [artifact, historical] of Object.entries(baseline.artifacts)) {
  const update = baseline.inspectedUpdates?.[artifact];
  const expected = update?.sha256 ?? historical;
  const provenance = update ? `${update.commit} (${update.inspection})` : baseline.commit;
  test(`published compatibility preserves ${artifact} from ${provenance}`, async () => {
    let bytes = await readFile('output/' + artifact);
    if (artifact === 'grading-catalog.json') {
      bytes = Buffer.from(JSON.stringify(comparableCatalog(JSON.parse(bytes.toString('utf8')))));
    }
    if (artifact === 'content/notebook.json') {
      bytes = Buffer.from(JSON.stringify(comparableNotebook(JSON.parse(bytes.toString('utf8')))));
    }
    if (artifact === 'content/tex-teaching.json') {
      const typing = JSON.parse(bytes.toString('utf8'));
      for (const placement of typing.placements) delete placement.hash;
      bytes = Buffer.from(JSON.stringify(typing));
    }
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      expected,
      'Unexpected published curriculum/history change. Inspect the semantic diff; never refresh the captured reference just to pass validation.',
    );
  });
}
