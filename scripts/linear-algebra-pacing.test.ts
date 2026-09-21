import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadContent, type Worksheet } from './content.js';
import { knowledgeExercises } from './choice-exercises.js';
import { teachingSections } from './inline-prerequisites.js';
import { placeNotebookExercises } from './notebook-placements.js';
import { quickChecks } from './quick-checks.js';
import {
  exerciseKey,
  exerciseNamespace,
  validateExerciseKeys,
} from '../web/src/exerciseIdentity.js';

type PlanLesson = {
  slug: string;
  title: string;
  lesson: string;
  worksheet: string;
  sections: { title: string; questionIds: number[]; inlineIds: number[] }[];
};
const json = async <T>(file: string): Promise<T> => JSON.parse(await readFile(file, 'utf8'));
const content = await loadContent();
const algebra = content.lessons.filter((l) => l.subject === 'Linear algebra');
const core = await json<(Worksheet & { slug: string })[]>(
  'scripts/fixtures/linear-algebra-core.json',
);
const plans = await Promise.all(
  // These are pre-split generated worksheet sizes, not the eight-question seed sizes.
  [
    { name: 'bases', namespace: 'linear-algebra-bases', size: 71 },
    { name: 'projections', namespace: 'linear-algebra-projections', size: 68 },
  ].map(async (baseline) => ({
    ...baseline,
    ...(await json<{ lessons: PlanLesson[] }>(
      `scripts/fixtures/linear-algebra-${baseline.name}-pacing.json`,
    )),
  })),
);
const range = (size: number) => Array.from({ length: size }, (_, i) => i + 1);
const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);
function lesson(slug: string) {
  const found = algebra.find((l) => l.slug === slug);
  assert.ok(found, `Missing lesson ${slug}`);
  return found;
}
function questions(slug: string) {
  return lesson(slug).worksheetData?.sections.flatMap((s) => s.questions) ?? [];
}
function placement(slug: string) {
  const titles = teachingSections(lesson(slug).markdown).map((s) => s.title);
  const result = placeNotebookExercises(
    slug,
    titles,
    questions(slug).map((q) => q.id),
  );
  return {
    ...result,
    bySection: Object.fromEntries(titles.map((title, i) => [title, result.sectionQuestionIds[i]])),
  };
}

test('linear algebra has twelve ordered instructional lessons after reading-only 00', () => {
  assert.deepEqual(
    algebra.map((l) => l.slug),
    [
      'linear-algebra-introduction',
      'linear-algebra-vectors',
      'linear-algebra-dot-products',
      'linear-algebra-matrices',
      'linear-algebra-systems',
      'linear-algebra-span',
      'linear-algebra-bases',
      'linear-algebra-rank-inverses',
      'linear-algebra-transformations',
      'linear-algebra-projections',
      'linear-algebra-least-squares',
      'linear-algebra-eigenvalues',
      'linear-algebra-svd',
    ],
  );
  assert.deepEqual(
    algebra.map((l) => l.number),
    [0, ...range(12)],
  );
  const intro = algebra[0];
  assert.equal(intro.title, 'Introduction');
  assert.equal(intro.worksheet, undefined);
  assert.equal(intro.worksheetData, undefined);
  assert.deepEqual(quickChecks[intro.slug] ?? [], []);
  assert.deepEqual(
    knowledgeExercises.filter((k) => k.lesson === intro.slug),
    [],
  );
  assert.deepEqual(placement(intro.slug).practiceIds, []);
  assert.ok(algebra.slice(1).every((l) => l.worksheetData));
});

test('697 worksheet questions remain separate from 24 correctly placed quick checks', () => {
  assert.equal(
    algebra.reduce((n, l) => n + questions(l.slug).length, 0),
    697,
  );
  const mappings = knowledgeExercises.filter((k) => algebra.some((l) => l.slug === k.lesson));
  assert.equal(mappings.length, 24);
  assert.equal(
    algebra.reduce((n, l) => n + (quickChecks[l.slug]?.length ?? 0), 0),
    24,
  );
  for (const l of algebra.slice(1)) {
    const checks = quickChecks[l.slug];
    assert.equal(checks.length, 2, l.slug);
    assert.equal(new Set(checks.map((c) => c.id)).size, 2, l.slug);
    const titles = teachingSections(l.markdown).map((s) => s.title);
    for (const check of checks) {
      assert.ok(titles.includes(check.after), `${l.slug}/${check.id}: missing teaching anchor`);
      const mapped = mappings.filter((k) => k.lesson === l.slug && k.quick === check.id);
      assert.equal(mapped.length, 1, `${l.slug}/${check.id}: exactly one promoted ID`);
      assert.ok(!questions(l.slug).some((q) => q.id === mapped[0].exercise));
    }
  }
});

test('historical split fixtures preserve original questions and saved exercise identities', () => {
  // The fixture records the ten historical families before the two lesson splits.
  const successors = new Set(plans.map((plan) => plan.lessons[1].slug));
  assert.deepEqual(
    core.map((l) => l.slug),
    algebra.filter((l) => l.worksheet && !successors.has(l.slug)).map((l) => l.slug),
  );
  for (const original of core) {
    assert.ok(lesson(original.slug).worksheet);
    assert.equal(original.sections.length, 4, 'The historical seed records four original sections');
    assert.deepEqual(
      sorted(original.sections.flatMap((s) => s.questions.map((q) => q.id))),
      range(8),
    );
  }
  for (const plan of plans) {
    assert.equal(plan.lessons.length, 2);
    assert.equal(plan.lessons[0].slug, plan.namespace);
    const assigned = plan.lessons.flatMap((l) => l.sections.flatMap((s) => s.questionIds));
    assert.deepEqual(sorted(assigned), range(plan.size), plan.namespace);
    for (const target of plan.lessons) {
      const l = lesson(target.slug);
      assert.equal(l.title, target.title);
      assert.equal(l.lesson.replace(/\.mdx$/, '.md'), target.lesson);
      assert.equal(l.worksheet, target.worksheet);
      assert.equal(l.worksheetData!.title, target.title);
      assert.deepEqual(
        teachingSections(l.markdown).map((s) => s.title),
        target.sections.map((s) => s.title),
      );
      assert.deepEqual(
        l.worksheetData!.sections.map((s) => ({
          title: s.title,
          questionIds: s.questions.map((q) => q.id),
        })),
        target.sections.map((s) => ({ title: s.title, questionIds: s.questionIds })),
      );
      for (const section of target.sections) {
        assert.ok(section.questionIds.length > 0);
        assert.equal(new Set(section.inlineIds).size, section.inlineIds.length);
        assert.ok(section.inlineIds.every((id) => section.questionIds.includes(id)));
      }
      const placed = placement(l.slug);
      assert.deepEqual(
        placed.sectionQuestionIds,
        target.sections.map((s) => s.inlineIds),
      );
      assert.deepEqual(
        sorted([...placed.sectionQuestionIds.flat(), ...placed.practiceIds]),
        sorted(questions(l.slug).map((q) => q.id)),
      );
    }
    const seed = core.find((l) => l.slug === plan.namespace)!;
    const splitQuestions = plan.lessons.flatMap((l) => questions(l.slug));
    for (const question of seed.sections.flatMap((s) => s.questions)) {
      // The historical seed had different IDs; preserve its authored payload after the split.
      const { id: _id, ...payload } = question;
      const match = splitQuestions.find((q) => q.prompt === question.prompt);
      assert.ok(match, `${plan.namespace}: missing original core question ${question.id}`);
      const { id: _generatedId, ...candidate } = match;
      assert.deepEqual(candidate, payload);
    }
  }
});

test('both halves retain namespace keys for worksheets, old quick checks, and new quick checks', () => {
  const expectedChecks = [
    ['linear-algebra-rank-inverses', 'quick-1', 72],
    ['linear-algebra-rank-inverses', 'quick-2', 73],
    ['linear-algebra-bases', 'quick-3', 74],
    ['linear-algebra-bases', 'quick-4', 75],
    ['linear-algebra-projections', 'quick-1', 69],
    ['linear-algebra-least-squares', 'quick-2', 70],
    ['linear-algebra-projections', 'quick-3', 71],
    ['linear-algebra-least-squares', 'quick-4', 72],
  ] as const;
  for (const plan of plans) {
    const owners = plan.lessons.map(({ slug }) => ({
      ...lesson(slug),
      questions: [
        ...questions(slug),
        ...knowledgeExercises.filter((k) => k.lesson === slug).map((k) => ({ id: k.exercise })),
      ],
    }));
    for (const owner of owners) assert.equal(exerciseNamespace(owner), plan.namespace);
    const keys = validateExerciseKeys(owners);
    assert.deepEqual(keys, new Set(range(plan.size + 4).map((id) => `${plan.namespace}-${id}`)));
    for (const [slug, quick, id] of expectedChecks.filter(([slug]) =>
      owners.some((l) => l.slug === slug),
    )) {
      assert.deepEqual(
        knowledgeExercises.find((k) => k.lesson === slug && k.quick === quick),
        {
          lesson: slug,
          quick,
          exercise: id,
        },
      );
      assert.equal(exerciseKey(lesson(slug), id), `${plan.namespace}-${id}`);
    }
  }
});

test('inline practice includes extraction, elimination, a distinct inverse, and line-fit transfer', async () => {
  const bases = placement('linear-algebra-bases');
  const rank = placement('linear-algebra-rank-inverses');
  const least = placement('linear-algebra-least-squares');
  for (const [placed, title, required] of [
    [bases, 'Extracting a basis rather than guessing one', [9, 61]],
    [rank, 'Finding both spaces in one reduction', [24, 30]],
    [rank, 'Invertible matrices', [39]],
    [rank, 'Solving without unnecessary inverses', [35]],
    [least, 'Fitting a constant', [29]],
    [least, 'Fitting a line rather than a constant', [38]],
  ] as const) {
    for (const id of required) assert.ok(placed.bySection[title]?.includes(id), `${title}/${id}`);
  }
  assert.ok(rank.practiceIds.includes(37), 'The repeated inverse stays in additional practice');
  assert.ok(
    least.practiceIds.includes(37),
    'Worked line-fit data do not replace transfer practice',
  );
  const fixtures = await json<
    { lesson: string; id: number; prompt: string; a: number[][]; b?: number[] }[]
  >('content/linear-algebra-verification.json');
  const fixture = (slug: string, id: number) => {
    const found = fixtures.find((f) => f.lesson === slug && f.id === id);
    assert.ok(found, `${slug}/${id}: missing calculation fixture`);
    assert.equal(found.prompt, questions(slug).find((q) => q.id === id)?.prompt);
    assert.ok(Array.isArray(found.a), `${slug}/${id}: missing input matrix`);
    if (slug === 'linear-algebra-least-squares')
      assert.ok(Array.isArray(found.b), `${slug}/${id}: missing observations`);
    return found;
  };
  assert.notDeepEqual(
    fixture('linear-algebra-rank-inverses', 39).a,
    fixture('linear-algebra-rank-inverses', 37).a,
  );
  assert.notDeepEqual(
    fixture('linear-algebra-least-squares', 38).b,
    fixture('linear-algebra-least-squares', 37).b,
  );
});
