import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lessonReview } from '../src/lessonReview';
import { readRoute, routeHash } from '../src/routing';
import type { Curriculum } from '../src/types';
const data = {
  ...JSON.parse(
    readFileSync(new URL('../../output/content/notebook.json', import.meta.url), 'utf8'),
  ),
  evidence: JSON.parse(
    readFileSync(new URL('../../output/content/learning-evidence.json', import.meta.url), 'utf8'),
  ),
} as Curriculum;
test('every exercise has a valid teaching destination and a reloadable link', () => {
  for (const lesson of data.lessons)
    for (const q of lesson.questions) {
      const review = lessonReview(data, lesson, q);
      assert.ok(
        data.lessons
          .find((l) => l.slug === review.slug)
          ?.sections.some((s) => s.id === review.section),
      );
      const route = { tab: 'read' as const, slug: review.slug, section: review.section };
      assert.deepEqual(readRoute(routeHash(route), data.lessons, null), route);
    }
});
test('review link prefers the authored inline teaching placement', () => {
  const l = data.lessons.find((l) => l.slug === 'predicates-and-quantifiers')!;
  const q = l.questions.find((q) => q.id === 41)!;
  assert.equal(
    lessonReview(data, l, q).section,
    l.sections.find((s) => s.questionIds.includes(41))!.id,
  );
});
