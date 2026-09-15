import test from 'node:test';
import { execFileSync } from 'node:child_process';
test('analysis ZIP v2 preserves synthetic structured evidence and excludes authentication', () => {
  execFileSync(
    process.platform === 'win32' ? 'python' : 'python3',
    ['scripts/export_learning_test.py'],
    { stdio: 'pipe' },
  );
});
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEvidence, authoredSkills } from './evidence.js';
import type { EvidenceCatalog } from '../web/src/evidenceTypes.js';
const c: EvidenceCatalog = JSON.parse(
  await readFile('output/content/learning-evidence.json', 'utf8'),
);
const keys = new Set(Object.keys(c.exercises));
test('every published lesson 1 exercise has authored evidence and valid references', () => {
  assert.equal(keys.size, 155);
  validateEvidence(c, keys);
  assert.ok(c.exercises['propositional-logic-152'].skills.some((s) => s.skill === 'prove'));
  assert.ok(c.exercises['propositional-logic-77'].skills.some((s) => s.skill === 'compare'));
});
test('missing IDs, supporting-only relationships, duplicates and hierarchy cycles fail', () => {
  for (const mutate of [
    (x: EvidenceCatalog) => (x.exercises['propositional-logic-1'].concepts[0].concept = 'missing'),
    (x: EvidenceCatalog) => (x.exercises['propositional-logic-1'].skills[0].skill = 'missing'),
    (x: EvidenceCatalog) =>
      x.exercises['propositional-logic-1'].concepts.forEach((l) => (l.role = 'supporting')),
    (x: EvidenceCatalog) => (x.concepts[0].parent = x.concepts[0].id),
    (x: EvidenceCatalog) =>
      x.exercises['propositional-logic-1'].concepts.push(
        x.exercises['propositional-logic-1'].concepts[0],
      ),
  ]) {
    const copy = structuredClone(c);
    mutate(copy);
    assert.throws(() => validateEvidence(copy, keys));
  }
});
test('role metadata distinguishes multi-concept work and representations', () => {
  const q = c.exercises['propositional-logic-110'];
  assert.equal(q.concepts.find((x) => x.concept === 'implication')?.role, 'supporting');
  assert.equal(q.concepts.find((x) => x.concept === 'distribution')?.role, 'primary');
  assert.ok(q.representations.includes('proof'));
  assert.equal(q.attributes?.operatorCount, 5);
});

test('authored skill objects retain roles while string shorthand remains primary', () => {
  const copy = structuredClone(c);
  const links = authoredSkills(['recognize', { skill: 'justify', role: 'supporting' }]);
  assert.deepEqual(links, [
    { skill: 'recognize', role: 'primary' },
    { skill: 'justify', role: 'supporting' },
  ]);
  copy.exercises['propositional-logic-1'].skills = links;
  validateEvidence(copy, keys);
  for (const skills of [
    authoredSkills([{ skill: 'justify', role: 'invalid' }]),
    authoredSkills([{ skill: 'missing', role: 'primary' }]),
    authoredSkills([{ skill: 'justify', role: 'supporting' }]),
  ]) {
    copy.exercises['propositional-logic-1'].skills = skills;
    assert.throws(() => validateEvidence(copy, keys));
  }
});
