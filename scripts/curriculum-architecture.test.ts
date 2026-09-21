import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspectCurriculumArchitecture, inspectCurriculumFile } from './curriculum-architecture.js';

test('canonical curriculum accepts MDX lessons and declarative metadata', () => {
  for (const [path, source] of [
    ['content/lessons/example.mdx', '# Example\n\n<Exercise id="example-01" />\n'],
    ['content/worksheets/example.yaml', 'questions: []'],
    ['content/review-templates.json', '[]'],
  ]) {
    assert.deepEqual(inspectCurriculumFile(path, source), []);
  }
});

test('retired authoring directories and executable content cannot return', () => {
  for (const path of [
    'scripts/authoring/subject.mjs',
    'scripts/authoring/subject/bank.json',
    'content/lessons/example.md',
    'content/lessons/example.tsx',
    'content/bank.mjs',
    'content/bank.py',
    'content/bank.go',
  ]) {
    assert.notEqual(inspectCurriculumFile(path, '').length, 0, path);
  }
});

test('moving obvious lesson DSLs and banks elsewhere does not evade the boundary', () => {
  for (const source of [
    'export default lesson(section("Example", raw`A lesson.`));',
    'export default makeLesson({ title: "Example" });',
    'const exerciseBank = [{ prompt: "Example?", answer: "Example." }];',
    'const reviewQuestions = [];',
    'export default { intro: R`' + 'Authored lesson prose. '.repeat(10) + '` };',
  ]) {
    assert.match(inspectCurriculumFile('scripts/new-generator.mjs', source).join(), /authoring/);
  }
});

test('tooling cannot generate canonical source files', () => {
  for (const source of [
    'await writeFile("content/lessons/example.mdx", lesson);',
    'fs.writeFileSync(`content/worksheets/${name}.yaml`, bank);',
    'await writeFile(join(root, "content", "review-templates.json"), bank);',
    '(ROOT / "content/review-templates.json").write_text(json.dumps(bank))',
    'printf example > content/lessons/example.mdx',
  ]) {
    assert.match(inspectCurriculumFile('scripts/new-generator.mjs', source).join(), /tooling/);
  }
});

test('normal rendering, output builds, and synthetic test fixtures remain valid', () => {
  for (const [path, source] of [
    ['scripts/build-content.ts', 'await writeFile("output/content/notebook.json", data);'],
    ['scripts/content.ts', 'const lessons = await readFile("content/curriculum.yaml");'],
    ['web/src/Exercise.tsx', 'export function Exercise(props) { return <p>{props.prompt}</p>; }'],
    ['scripts/renderer.test.ts', 'const exerciseBank = [{ prompt: "Synthetic example?" }];'],
    ['server/review_test.go', 'const reviewQuestions = [];'],
    ['scripts/check-review-ui.mjs', 'const exerciseBank = [{ prompt: "Synthetic example?" }];'],
  ]) {
    assert.deepEqual(inspectCurriculumFile(path, source), [], path);
  }
});

test('filesystem inspection checks new untracked files and legacy manifest references', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'curriculum-architecture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'content/lessons'), { recursive: true });
  await writeFile(join(root, 'content/lessons/example.mdx'), '# Example\n');
  const manifest = join(root, 'content/curriculum.yaml');
  await writeFile(manifest, 'lessons:\n  - slug: example\n    lesson: lessons/example.mdx\n');
  assert.deepEqual(await inspectCurriculumArchitecture(root), []);

  await writeFile(manifest, 'lessons:\n  - slug: example\n    lesson: lessons/example.md\n');
  await writeFile(join(root, 'content/bank.py'), 'bank = []\n');
  const errors = await inspectCurriculumArchitecture(root);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.includes('content/bank.py')));
  assert.ok(errors.some((error) => error.includes('must reference a canonical MDX lesson')));
});
