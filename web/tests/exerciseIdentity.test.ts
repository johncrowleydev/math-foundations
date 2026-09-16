import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { exerciseKey, validateExerciseKeys } from '../src/exerciseIdentity';
import { readRoute, routeHash, resolveReadingSection } from '../src/routing';
import { exerciseProgress } from '../src/analytics';
import { lessonReview } from '../src/lessonReview';
import { emptyDraft, get, put, lessonProgress, readingBookmark } from '../src/storage';
import type { Attempt, Curriculum, Lesson } from '../src/types';

const lessons = [
  {
    slug: 'linear-algebra-bases',
    questions: [{ id: 1 }],
    sections: [{ id: 'bases', title: 'Bases', questionIds: [1] }],
  },
  {
    slug: 'linear-algebra-rank-inverses',
    exerciseNamespace: 'linear-algebra-bases',
    questions: [{ id: 42 }, { id: 81 }],
    sections: [{ id: 'rank', title: 'Rank', questionIds: [42] }],
  },
  {
    slug: 'linear-algebra-projections',
    questions: [{ id: 1 }],
    sections: [{ id: 'orthogonality', title: 'Orthogonality', questionIds: [1] }],
  },
  {
    slug: 'linear-algebra-least-squares',
    exerciseNamespace: 'linear-algebra-projections',
    questions: [{ id: 42 }],
    sections: [{ id: 'least-squares', title: 'Least squares', questionIds: [42] }],
  },
] as Lesson[];

test('legacy exercise links resolve both split owners while direct links round trip', () => {
  for (const [parent, successor] of [
    [lessons[0], lessons[1]],
    [lessons[2], lessons[3]],
  ]) {
    const target = { slug: successor.slug, tab: 'practice' as const, exercise: '42' };
    assert.deepEqual(readRoute(`#/practice/${parent.slug}/42`, lessons, parent.slug), target);
    assert.deepEqual(readRoute(routeHash(target), lessons, parent.slug), target);
    assert.deepEqual(readRoute(`#/practice/${parent.slug}/1`, lessons, successor.slug), {
      slug: parent.slug,
      tab: 'practice',
      exercise: '1',
    });
  }
  assert.deepEqual(readRoute('#/practice/linear-algebra-bases/999', lessons, null), {
    slug: lessons[0].slug,
    tab: 'practice',
  });
});

test('section URLs and reading records follow unambiguous moved anchors only', () => {
  const target = { slug: lessons[1].slug, tab: 'read', section: 'rank' };
  assert.deepEqual(readRoute('#/learn/linear-algebra-bases/rank', lessons, null), target);
  for (const anchor of ['rank', 'section:rank', 'section-rank', 'Rank']) {
    assert.equal(
      resolveReadingSection(lessons, lessons[0].slug, anchor)?.lesson.slug,
      lessons[1].slug,
    );
  }
  assert.equal(resolveReadingSection(lessons, lessons[2].slug, 'rank'), undefined);
  const ambiguous = [...lessons, { ...lessons[1], slug: 'another-split' }];
  assert.equal(resolveReadingSection(ambiguous, lessons[0].slug, 'rank'), undefined);
});

test('split lessons retain legacy drafts, handwriting, attempt history and progress without copying', async () => {
  const parent = lessons[0],
    successor = lessons[1];
  const key = exerciseKey(successor, 42);
  assert.equal(key, 'linear-algebra-bases-42');
  const draft = {
    ...emptyDraft(),
    text: 'Existing work',
    strokes: [{ color: '#000', width: 2, points: [{ x: 1, y: 2, p: 0.5 }] }],
    photos: [{ hash: 'existing-photo', rotation: 90 }],
  };
  await put('drafts', key, draft);
  const attempt = {
    id: 'legacy-attempt',
    exercise: key,
    submitted: 10,
    contentVersion: 'original',
    text: 'Original response',
    images: [],
    mode: 'type',
    revealed: false,
    status: 'graded',
    verdict: 'correct',
    grades: [],
  } as Attempt;
  await put('attempts', attempt.id, attempt);
  await put('records', 'practice/position:' + parent.slug, { payload: { value: 41 } });
  const restored = await lessonProgress(successor, [42, 81]);
  assert.deepEqual(restored.drafts, [draft, undefined]);
  assert.deepEqual(
    restored.attempts.find((a) => a.id === attempt.id),
    attempt,
  );
  assert.equal(restored.saved, undefined); // Old array positions must not index a new lesson.
  assert.equal(await get('drafts', successor.slug + '-42'), undefined);
  const progress = exerciseProgress(
    restored.attempts,
    successor.questions.map((q) => exerciseKey(successor, q.id)),
  );
  assert.equal(progress.completed, 1);
  assert.deepEqual(progress.unattemptedKeys, ['linear-algebra-bases-81']);
  assert.equal(exerciseProgress(restored.attempts, [exerciseKey(parent, 1)]).completed, 0);
});

test('local bookmarks retain stored namespaces and prefer a successor bookmark once saved', async () => {
  const parent = lessons[0],
    successor = lessons[1];
  await put('settings', 'bookmark:' + parent.slug, { anchor: 'section-rank' });
  const legacy = await readingBookmark(successor);
  assert.deepEqual(legacy, { slug: parent.slug, anchor: 'section-rank' });
  assert.equal(
    resolveReadingSection(lessons, legacy!.slug, legacy!.anchor)?.lesson.slug,
    successor.slug,
  );
  await put('settings', 'bookmark:' + successor.slug, { anchor: 'section-rank' });
  assert.equal((await readingBookmark(successor))?.slug, successor.slug);
  assert.deepEqual(await get('settings', 'bookmark:' + parent.slug), { anchor: 'section-rank' });
});

test('published uniqueness checks prevent silent key overwrites across a shared namespace', () => {
  assert.equal(validateExerciseKeys(lessons).size, 5);
  assert.throws(
    () =>
      validateExerciseKeys([
        ...lessons,
        { ...lessons[1], slug: 'duplicate', questions: [{ id: 42 }] },
      ]),
    /Duplicate exercise key linear-algebra-bases-42/,
  );
});

test('practice-only review uses stable concept keys and presentation teaching locations', () => {
  const successor = lessons[1];
  const data = {
    lessons,
    evidence: {
      exercises: {
        'linear-algebra-bases-81': { concepts: [{ concept: 'rank', role: 'primary' }] },
      },
      teaching: [{ concept: 'rank', lesson: successor.slug, section: 'Rank' }],
    },
  } as Curriculum;
  assert.deepEqual(lessonReview(data, successor, successor.questions[1]), {
    slug: successor.slug,
    section: 'rank',
    title: 'Rank',
  });
});

test('legacy quick sources cannot share a namespace even with different numeric IDs', () => {
  const original = {
    slug: 'linear-algebra-rank-inverses',
    exerciseNamespace: 'linear-algebra-bases',
    questions: [{ id: 72, quickSource: 'quick-1' }],
  };
  const newCheck = {
    slug: 'linear-algebra-bases',
    questions: [{ id: 74, quickSource: 'quick-1' }],
  };
  assert.throws(
    () => validateExerciseKeys([original, newCheck]),
    /Duplicate legacy quick key quick\/linear-algebra-bases:quick-1: linear-algebra-bases-72 and linear-algebra-bases-74/,
  );
  assert.throws(
    () =>
      validateExerciseKeys([
        { ...newCheck, questions: [...original.questions, ...newCheck.questions] },
      ]),
    /Duplicate legacy quick key/,
  );
  assert.deepEqual(
    validateExerciseKeys([
      original,
      { ...newCheck, questions: [{ id: 74, quickSource: 'quick-3' }] },
    ]),
    new Set(['linear-algebra-bases-72', 'linear-algebra-bases-74']),
  );
});

test('quick sources may repeat in distinct namespaces and may be absent on regular exercises', () => {
  const questions = [{ id: 1, quickSource: 'quick-1' }, { id: 2 }, { id: 3 }];
  assert.deepEqual(
    validateExerciseKeys([
      { slug: 'bases', questions },
      { slug: 'least-squares', exerciseNamespace: 'projections', questions },
    ]),
    new Set(['bases-1', 'bases-2', 'bases-3', 'projections-1', 'projections-2', 'projections-3']),
  );
});
