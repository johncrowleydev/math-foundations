import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, routeHash } from '../src/routing';
import type { Lesson } from '../src/types';

const lessons = [
  { slug: 'logic', questions: [{ id: 1 }, { id: 13 }] },
  { slug: 'sets', questions: [{ id: 2 }] },
] as Lesson[];

test('reading-only introductions cannot enter an empty practice view', () => {
  const intro = { slug: 'discrete-math-introduction', questions: [] } as unknown as Lesson;
  assert.deepEqual(
    readRoute('#/practice/discrete-math-introduction/1', [intro, ...lessons], null),
    {
      slug: intro.slug,
      tab: 'read',
    },
  );
});

test('explicit exercise URLs override saved chapter and round trip by stable ID', () => {
  const route = readRoute('#/practice/logic/13', lessons, 'sets');
  assert.deepEqual(route, { slug: 'logic', tab: 'practice', exercise: '13' });
  assert.equal(routeHash(route), '#/practice/logic/13');
  assert.deepEqual(readRoute('#/reference/sets', lessons, null), {
    slug: 'sets',
    tab: 'reference',
  });
});

test('empty and malformed routes recover safely; invalid exercise IDs allow resume', () => {
  assert.deepEqual(readRoute('', lessons, 'sets'), { slug: 'sets', tab: 'read' });
  assert.deepEqual(readRoute('#/%ZZ', lessons, null), { slug: 'logic', tab: 'read' });
  assert.deepEqual(readRoute('#/practice/logic/999', lessons, null), {
    slug: 'logic',
    tab: 'practice',
  });
  assert.equal(routeHash({ slug: 'logic', tab: 'read' }), '#/learn/logic');
});

test('Review is a top-level route, including from reading-only introductions', () => {
  const intro = { slug: 'intro', questions: [] } as unknown as Lesson;
  const route = readRoute('#/review/intro', [intro, ...lessons], null);
  assert.deepEqual(route, { slug: 'intro', tab: 'review' });
  assert.equal(routeHash(route), '#/review/intro');
  assert.equal(readRoute('#/review', lessons, 'sets').tab, 'review');
});
