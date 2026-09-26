import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectTexTeaching,
  texRequirements,
  textFields,
  unsupportedTexCommands,
  inspectionFingerprint,
} from '../../tools/audit/tex-teaching.js';

test('TeX syntax inventory and completed inspections cover every exercise before required use', async () => {
  const failures = await inspectTexTeaching(true);
  assert.deepEqual(failures, []);
});
test('syntax extraction reads actual nested text without inventing JSON escapes', () => {
  assert.equal(textFields({ columns: ['$\\neg P$'] }), '$\\neg P$');
  assert.deepEqual(texRequirements('$x_{12}^{2}$', []), [
    'tex-groups',
    'tex-subscripts',
    'tex-superscripts',
  ]);
});

test('unsupported commands cannot silently escape the inventory', () => {
  assert.deepEqual(
    unsupportedTexCommands(String.raw`\madeup{x} \neg p \madeup{y}`, [
      { id: 'neg', command: 'neg', group: 'logic', example: '', explanation: '' },
    ]),
    ['madeup'],
  );
});
test('inspection hashes cover authored content and its teaching context, not audit status', () => {
  const record = { id: 'entry', source: 'x', status: 'pending' };
  const before = inspectionFingerprint(record, { lesson: 'old' });
  assert.equal(
    before,
    inspectionFingerprint({ ...record, status: 'verified', hash: before }, { lesson: 'old' }),
  );
  assert.notEqual(before, inspectionFingerprint({ ...record, source: 'y' }, { lesson: 'old' }));
  assert.notEqual(before, inspectionFingerprint(record, { lesson: 'new' }));
});

test('escaped underscores and ampersands do not require scripts or tables', () => {
  assert.deepEqual(texRequirements(String.raw`\_ \& \{ \}`, []), []);
  assert.deepEqual(texRequirements(String.raw`x_1 & y^2`, []), [
    'tex-multirow',
    'tex-subscripts',
    'tex-superscripts',
  ]);
});
