import { exerciseKey } from '../../web/src/exerciseIdentity.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSources, lessonSourceHash, sourceHash } from '../../tools/content/sources.js';

const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const [raw, notebook, teaching, syntax, typing] = await Promise.all(
  [
    'content/sources.json',
    'output/content/notebook.json',
    'output/content/teaching.json',
    'content/tex-syntax.json',
    'content/tex-teaching.json',
  ].map(read),
);
const reviewTemplates = await read('content/review-templates.json');
const validate = (
  catalog = raw,
  lessons = notebook.lessons,
  t = teaching,
  s = syntax,
  x = typing,
) => validateSources(catalog, lessons, t, s, x, reviewTemplates);

test('every lesson, section, exercise, reference, figure, and TeX construction has source coverage', () => {
  const result = validate();
  for (const lesson of notebook.lessons) {
    assert.ok(result.targets[`${lesson.slug}/intro`]?.length);
    for (const section of lesson.sections)
      assert.ok(result.targets[`${lesson.slug}/${section.id}`]?.length);
    for (const question of lesson.questions)
      assert.ok(result.targets[`exercise:${exerciseKey(lesson, question.id)}`]?.length);
  }
  for (const r of teaching.references) assert.ok(result.targets[`reference:${r.id}`]?.length);
  for (const f of teaching.figures) assert.ok(result.targets[`figure:${f.id}`]?.length);
  for (const e of [...syntax.entries, ...typing.basics])
    assert.ok(result.targets[`syntax:${e.id}`]?.length);
});
test('missing lesson, section, exercise group and syntax coverage block publication', () => {
  const slug = notebook.lessons[1].slug;
  for (const mutate of [
    (c: typeof raw) => delete c.lessons[slug],
    (c: typeof raw) => delete c.lessons[slug].sections[notebook.lessons[1].sections[0].id],
    (c: typeof raw) => delete c.lessons[slug].practice[notebook.lessons[1].questions[0].section],
    (c: typeof raw) => delete c.syntax.entries[syntax.entries[0].id],
  ]) {
    const c = structuredClone(raw);
    mutate(c);
    assert.throws(() => validate(c), /coverage mismatch/);
  }
});
test('dangling references and unsafe source URLs fail validation', () => {
  const c = structuredClone(raw);
  c.lessons[notebook.lessons[0].slug].intro = ['nonexistent'];
  assert.throws(() => validate(c), /Unknown citation/);
  const d = structuredClone(raw);
  d.citations[Object.keys(d.citations)[0]].source = 'nonexistent';
  assert.throws(() => validate(d), /Unknown bibliography/);
  const e = structuredClone(raw);
  e.citations[Object.keys(e.citations)[0]].url = 'javascript:alert(1)';
  assert.throws(() => validate(e), /HTTPS/);
});
test('content edits require source reinspection including answers, feedback, glossary, figures and formula context', () => {
  const lessons = structuredClone(notebook.lessons);
  lessons[1].questions[0].answer += ' Changed claim.';
  assert.throws(() => validate(raw, lessons), /reinspection/);
  for (const key of ['references', 'figures', 'formulas']) {
    const t = structuredClone(teaching);
    t[key][0].changed = 'New claim';
    assert.throws(() => validate(raw, notebook.lessons, t), /reinspection/);
  }
  const s = structuredClone(syntax);
  s.entries[0].explanation += ' Different instruction.';
  assert.throws(() => validate(raw, notebook.lessons, teaching, s), /reinspection/);
});
test('review digests are deterministic and citation UI metadata does not mutate historical curriculum', () => {
  const before = JSON.stringify(notebook);
  const lesson = notebook.lessons[0];
  assert.equal(
    lessonSourceHash(lesson, teaching, typing),
    raw.lessons[lesson.slug].reviewedContentHash,
  );
  assert.equal(sourceHash({ syntax, typing }), raw.syntax.reviewedContentHash);
  validate();
  assert.equal(JSON.stringify(notebook), before);
});
