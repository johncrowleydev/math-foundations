import test from 'node:test';
import assert from 'node:assert/strict';
import { curriculumSchema } from './content.js';
import { publishEvidence } from './evidence.js';
import { lessonSourceHash, sourceHash, validateSources } from './sources.js';

const lessons = [
  {
    slug: 'original',
    sections: [{ id: 'first', title: 'First' }],
    questions: [{ id: 1, section: 'Practice' }],
  },
  {
    slug: 'successor',
    exerciseNamespace: 'original',
    sections: [{ id: 'second', title: 'Second' }],
    questions: [{ id: 42, section: 'Practice', choice: {} }],
  },
];
const authored = {
  concepts: [{ id: 'concept', name: 'Concept' }],
  skills: [{ id: 'recognize', name: 'Recognize' }],
  representations: [{ id: 'matrix', name: 'Matrix' }],
  teaching: [{ concept: 'concept', lesson: 'successor', section: 'Second' }],
  exercises: lessons.flatMap((l) =>
    l.questions.map((q) => ({
      lesson: l.slug,
      id: q.id,
      primary: ['concept'],
      skills: ['recognize'],
      representations: ['matrix'],
    })),
  ),
};

test('curriculum accepts an optional stable namespace without injecting it into other lessons', () => {
  const parsed = curriculumSchema.parse({
    course: 'Course',
    currentLesson: 'original',
    lessons: [
      { slug: 'original', title: 'First', lesson: 'lessons/first.md' },
      {
        slug: 'successor',
        exerciseNamespace: 'original',
        title: 'Second',
        lesson: 'lessons/second.md',
      },
    ],
  });
  assert.equal(parsed.lessons[1].exerciseNamespace, 'original');
  assert.ok(!('exerciseNamespace' in parsed.lessons[0]));
  assert.throws(() =>
    curriculumSchema.parse({
      ...parsed,
      lessons: [{ ...parsed.lessons[1], exerciseNamespace: '../original' }],
    }),
  );
});

test('authored presentation ownership publishes stable evidence keys and choice attributes', () => {
  const catalog = publishEvidence(authored, lessons);
  assert.deepEqual(Object.keys(catalog.exercises), ['original-1', 'original-42']);
  assert.equal(catalog.exercises['original-42'].attributes?.responseFormat, 'choice');
  assert.equal(catalog.teaching[0].lesson, 'successor');
  assert.throws(
    () =>
      publishEvidence(
        {
          ...authored,
          exercises: [authored.exercises[0], { ...authored.exercises[1], lesson: 'original' }],
        },
        lessons,
      ),
    /Unknown authored exercise original-42/,
  );
  assert.throws(
    () => publishEvidence(authored, [...lessons, { ...lessons[1], slug: 'collision' }]),
    /Duplicate exercise key/,
  );
  assert.throws(
    () =>
      publishEvidence(
        { ...authored, exercises: [...authored.exercises, authored.exercises[1]] },
        lessons,
      ),
    /Duplicate evidence/,
  );
});

test('source targets use presentation anchors but stable exercise keys, with normal digest enforcement', () => {
  const teaching = { references: [], figures: [], formulas: [] };
  const syntax = { entries: [] },
    typing = { basics: [], placements: [] };
  const raw = {
    version: 1,
    bibliography: {
      book: { title: 'Book', author: 'Author', edition: '2026', url: 'https://example.org/book' },
    },
    citations: {
      citation: {
        source: 'book',
        locator: 'Section 1',
        url: 'https://example.org/book#section-1',
        supports: 'Definitions',
        checked: '2026-09-16',
      },
    },
    lessons: Object.fromEntries(
      lessons.map((l) => [
        l.slug,
        {
          reviewedContentHash: lessonSourceHash(l, teaching, typing),
          intro: ['citation'],
          sections: Object.fromEntries(l.sections.map((s) => [s.id, ['citation']])),
          practice: { Practice: ['citation'] },
        },
      ]),
    ),
    syntax: { reviewedContentHash: sourceHash({ syntax, typing }), entries: {} },
  };
  const result = validateSources(raw, lessons, teaching, syntax, typing);
  assert.deepEqual(result.targets['exercise:original-42'], ['citation']);
  assert.equal(result.targets['exercise:successor-42'], undefined);
  assert.deepEqual(result.targets['successor/second'], ['citation']);
  assert.deepEqual(result.targets['successor/intro'], ['citation']);
  const edited = structuredClone(lessons);
  edited[1].exerciseNamespace = 'changed';
  assert.throws(() => validateSources(raw, edited, teaching, syntax, typing), /reinspection/);
  assert.throws(
    () => validateSources(raw, [...lessons, lessons[1]], teaching, syntax, typing),
    /Duplicate exercise key/,
  );
});

test('evidence publication rejects colliding legacy quick sources across displayed lessons', () => {
  const collision = lessons.map((lesson) => ({
    ...lesson,
    questions: lesson.questions.map((q) => ({ ...q, quickSource: 'quick-1' })),
  }));
  assert.throws(
    () => publishEvidence(authored, collision),
    /Duplicate legacy quick key quick\/original:quick-1/,
  );
  collision[1].questions[0].quickSource = 'quick-3';
  assert.deepEqual(Object.keys(publishEvidence(authored, collision).exercises), [
    'original-1',
    'original-42',
  ]);
});
