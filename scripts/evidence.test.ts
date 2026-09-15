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
const notebook = JSON.parse(await readFile('output/content/notebook.json', 'utf8')) as {
  lessons: { slug: string; questions: { id: number; choice?: unknown }[] }[];
};
const published = new Set(
  notebook.lessons.flatMap((l) => l.questions.map((q) => l.slug + '-' + q.id)),
);
test('every exercise in every published lesson has authored evidence and valid references', () => {
  assert.equal(notebook.lessons.filter((l) => l.questions.length).length, 25);
  assert.equal(keys.size, 2060);
  assert.deepEqual(keys, published);
  validateEvidence(c, published);
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

test('missing coverage fails for any lesson, including new published exercises', () => {
  for (const key of ['predicates-and-quantifiers-5', 'linear-algebra-svd-74']) {
    const copy = structuredClone(c);
    delete copy.exercises[key];
    assert.throws(() => validateEvidence(copy, published), /Unannotated exercise/);
  }
  assert.throws(
    () => validateEvidence(c, new Set([...published, 'future-lesson-1'])),
    /Unannotated exercise/,
  );
});

test('task mappings distinguish recognition, construction, proof, and cross-domain reuse', () => {
  const skill = (key: string, id: string) => c.exercises[key].skills.some((s) => s.skill === id);
  assert.ok(skill('predicates-and-quantifiers-21', 'recognize'));
  assert.ok(skill('predicates-and-quantifiers-41', 'transform'));
  assert.ok(skill('predicates-and-quantifiers-112', 'prove'));
  assert.ok(skill('linear-algebra-span-17', 'construct'));
  assert.ok(skill('linear-algebra-span-66', 'prove'));
  assert.ok(skill('linear-algebra-span-73', 'recognize'));
  assert.equal(
    c.exercises['linear-algebra-transformations-30'].concepts.find(
      (x) => x.concept === 'injectivity',
    )?.role,
    'supporting',
  );
  assert.ok(c.exercises['graph-theory-61'].representations.includes('graph'));
  assert.ok(c.exercises['linear-algebra-matrices-31'].representations.includes('matrix'));
  for (const l of notebook.lessons.filter((l) => l.slug !== 'propositional-logic'))
    for (const q of l.questions.filter((q) => q.choice)) {
      assert.ok(skill(`${l.slug}-${q.id}`, 'recognize'));
      assert.ok(!skill(`${l.slug}-${q.id}`, 'prove'));
      assert.ok(!skill(`${l.slug}-${q.id}`, 'justify'));
    }
});

test('server grading catalog snapshots every authored exercise without losing roles or definitions', async () => {
  const server = JSON.parse(await readFile('output/grading-catalog.json', 'utf8'));
  assert.deepEqual(new Set(Object.keys(server.exercises)), published);
  for (const key of published) {
    const snapshot = server.exercises[key].analytics;
    assert.equal(snapshot.version, c.version, key);
    assert.deepEqual(snapshot.concepts, c.exercises[key].concepts, key);
    assert.deepEqual(snapshot.skills, c.exercises[key].skills, key);
    assert.deepEqual(snapshot.representations, c.exercises[key].representations, key);
    for (const link of snapshot.concepts)
      assert.ok(
        snapshot.conceptDefinitions.some((x: { id: string }) => x.id === link.concept),
        key,
      );
  }
});
