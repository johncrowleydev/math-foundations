import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const audit = JSON.parse(await readFile('content/curriculum-audit.json', 'utf8'));
const inventory = JSON.parse(await readFile('output/curriculum-inventory.json', 'utf8'));
const teaching = JSON.parse(await readFile('android/app/src/main/assets/teaching.json', 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('the manually audited edition covers every current unit, reference, formula and figure', () => {
  assert.deepEqual(audit.counts, inventory.counts);
  assert.equal(audit.units.length, inventory.units.length);
  const units = new Map(audit.units.map((u: any) => [u.lesson + '/' + u.source, u.hash]));
  assert.equal(units.size, audit.units.length);
  for (const u of inventory.units)
    assert.equal(
      units.get(u.lesson + '/' + u.source),
      u.hash,
      'Re-inspect changed learning unit: ' + u.lesson + '/' + u.source,
    );
  for (const category of ['references', 'formulas', 'figures']) {
    const checked = new Map(audit[category].map((e: any) => [e.id, e.hash]));
    assert.equal(checked.size, teaching[category].length, category);
    for (const entry of teaching[category])
      assert.equal(
        checked.get(entry.id),
        hash(entry),
        'Re-inspect changed ' + category + ': ' + entry.id,
      );
  }
  for (const f of teaching.figures) {
    const checked = audit.figures.find((e: any) => e.id === f.id);
    assert.equal(checked.authoredStates, f.frames.length);
    assert.deepEqual(checked.orientations, ['portrait', 'landscape']);
  }
});
