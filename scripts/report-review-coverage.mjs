// Compare captured, effective Review Library API responses; never infer template eligibility.
// npx tsx scripts/report-review-coverage.mjs [before.json] [after.json]
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { exerciseKey } from '../web/src/exerciseIdentity.ts';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [before, after, notebook, evidence, compiled] = await Promise.all([
  read(process.argv[2] || 'output/review-audit-before/catalog.json'),
  read(process.argv[3] || 'output/review-audit-after/catalog.json'),
  read('output/content/notebook.json'),
  read('output/content/learning-evidence.json'),
  read('output/grading-catalog.json'),
]);
assert.equal(
  after.contentVersion,
  compiled.version,
  'Rebuild and capture the current Library first',
);
const owners = new Map(
  notebook.lessons.flatMap((lesson) =>
    lesson.questions.map((q) => [exerciseKey(lesson, q.id), lesson.slug]),
  ),
);
const location = (item) =>
  item.originalExercise ? owners.get(item.originalExercise) : item.lesson;
const target = (item) => JSON.stringify([item.concept, item.skill, item.objective || '']);
const methods = (item) =>
  (item.variants || [item.question]).map((q) =>
    q.assessment ? 'structured' : q.choice ? 'choice' : 'open-reasoning',
  );
const unique = (values) => [...new Set(values)].sort();
const groups = (items) => {
  const result = new Map();
  for (const item of items) {
    assert.ok(location(item), `Unknown original lesson for ${item.id}`);
    const key = JSON.stringify([location(item), item.concept, item.skill, item.objective || '']);
    result.set(key, [...(result.get(key) || []), item]);
  }
  return result;
};
const summarize = (items) => ({
  templates: items.length,
  targets: new Set(items.map(target)).size,
  reused: items.filter((x) => x.provenance === 'lesson-exercise').length,
  dedicated: items.filter((x) => x.provenance === 'review-template').length,
  quick: items.filter((x) => x.quick).length,
  recognition: items.filter((x) => x.evidenceLevel === 'recognition').length,
  production: items.filter((x) => x.evidenceLevel === 'production').length,
  reasoning: items.filter((x) => x.evidenceLevel === 'reasoning').length,
  authored: items.filter((x) => x.family === 'authored').length,
  variants: items.reduce((n, x) => n + x.variantCount, 0),
  generators: items.filter((x) => x.generated).length,
});
const oldIDs = new Set(before.items.map((x) => x.id));
const finalIDs = new Set(after.items.map((x) => x.id));
assert.equal(oldIDs.size, before.items.length);
assert.equal(finalIDs.size, after.items.length);
for (const item of before.items) {
  assert.ok(finalIDs.has(item.id), `Lost effective template ${item.id}`);
  const { lesson: oldLesson, origin: oldOrigin, ...previous } = item;
  const {
    lesson: newLesson,
    origin: newOrigin,
    ...current
  } = after.items.find((x) => x.id === item.id);
  assert.deepEqual(current, previous, `Changed existing effective definition ${item.id}`);
  assert.equal(newLesson, location(item), `Unexpected lesson reassignment ${item.id}`);
  assert.equal(newOrigin, oldLesson === newLesson ? oldOrigin : 'lesson:' + newLesson);
}
const added = after.items.filter((x) => !oldIDs.has(x.id));
const primaryExercises = new Map();
for (const [key, exercise] of Object.entries(compiled.exercises)) {
  for (const c of exercise.analytics.concepts.filter((c) => c.role === 'primary')) {
    primaryExercises.set(c.concept, [...(primaryExercises.get(c.concept) || []), key]);
  }
}
for (const item of added) {
  assert.ok(
    item.activationConcepts?.some((c) => primaryExercises.has(c)),
    `No lesson exercise can activate ${item.id}`,
  );
  assert.ok(item.evidenceLevel !== 'reasoning' || !item.quick, `Deep Quick item: ${item.id}`);
}
const b = groups(before.items),
  a = groups(after.items);
const rows = unique([...b.keys(), ...a.keys()]).map((key) => {
  const [lesson, concept, skill, objective] = JSON.parse(key);
  const previous = b.get(key) || [],
    current = a.get(key) || [];
  return {
    lesson,
    concept,
    skill,
    objective,
    before: summarize(previous),
    after: summarize(current),
    baselineLibraryLessons: unique(previous.map((x) => x.lesson)),
    interaction: unique(current.map((x) => x.interactionCost)),
    input: unique(current.flatMap((x) => x.inputCapabilities)),
    grading: unique(current.flatMap(methods)),
    activation: unique(current.flatMap((x) => [x.concept, ...(x.activationConcepts || [])])),
    singleFixed: current.length === 1 && current[0].family === 'fixed',
    templateIDs: current.map((x) => x.id),
  };
});
const lessons = notebook.lessons
  .filter((l) => l.number !== 0)
  .map((lesson) => ({
    lesson: lesson.slug,
    subject: lesson.subject,
    title: lesson.title,
    before: summarize(before.items.filter((x) => location(x) === lesson.slug)),
    after: summarize(after.items.filter((x) => x.lesson === lesson.slug)),
  }));
const subjects = unique(lessons.map((l) => l.subject)).map((subject) => {
  const slugs = new Set(lessons.filter((l) => l.subject === subject).map((l) => l.lesson));
  return {
    subject,
    before: summarize(before.items.filter((x) => slugs.has(location(x)))),
    after: summarize(after.items.filter((x) => slugs.has(x.lesson))),
    added: summarize(added.filter((x) => slugs.has(x.lesson))),
  };
});
const taught = unique(evidence.teaching.map((x) => JSON.stringify([x.lesson, x.concept])));
const concepts = taught.map((key) => {
  const [lesson, concept] = JSON.parse(key);
  return {
    lesson,
    concept,
    before: summarize(before.items.filter((x) => location(x) === lesson && x.concept === concept)),
    after: summarize(after.items.filter((x) => x.lesson === lesson && x.concept === concept)),
  };
});
const report = {
  beforeVersion: before.contentVersion,
  afterVersion: after.contentVersion,
  before: summarize(before.items),
  after: summarize(after.items),
  added: summarize(added),
  relocated: after.items.filter(
    (x) => oldIDs.has(x.id) && before.items.find((b) => b.id === x.id).lesson !== x.lesson,
  ).length,
  subjects,
  lessons,
  concepts,
  rows,
  activation: added.map((x) => ({
    id: x.id,
    concepts: x.activationConcepts,
    exampleExercises: x.activationConcepts.flatMap((c) =>
      (primaryExercises.get(c) || []).slice(0, 3),
    ),
  })),
};
await mkdir('output/review-audit-after', { recursive: true });
await writeFile(
  'output/review-audit-after/coverage-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
const fields = [
  'lesson',
  'concept',
  'skill',
  'objective',
  'before_templates',
  'after_templates',
  'before_dedicated',
  'after_dedicated',
  'before_quick',
  'after_quick',
  'after_reused',
  'recognition',
  'production',
  'reasoning',
  'authored',
  'variants',
  'generators',
  'interaction',
  'input',
  'grading',
  'activation',
  'single_fixed',
  'baseline_library_lessons',
];
const csv = (v) => '"' + String(v).replaceAll('"', '""') + '"';
const csvRows = rows.map((r) => [
  r.lesson,
  r.concept,
  r.skill,
  r.objective,
  r.before.templates,
  r.after.templates,
  r.before.dedicated,
  r.after.dedicated,
  r.before.quick,
  r.after.quick,
  r.after.reused,
  r.after.recognition,
  r.after.production,
  r.after.reasoning,
  r.after.authored,
  r.after.variants,
  r.after.generators,
  r.interaction.join(';'),
  r.input.join(';'),
  r.grading.join(';'),
  r.activation.join(';'),
  r.singleFixed,
  r.baselineLibraryLessons.join(';'),
]);
await mkdir('docs/audits', { recursive: true });
await writeFile(
  'docs/audits/curriculum-review-coverage.csv',
  [fields, ...csvRows].map((row) => row.map(csv).join(',')).join('\n') + '\n',
);
console.log(
  JSON.stringify(
    {
      before: report.before,
      after: report.after,
      added: report.added,
      lessonTargetRows: rows.length,
      relocated: report.relocated,
      subjects,
    },
    null,
    2,
  ),
);
