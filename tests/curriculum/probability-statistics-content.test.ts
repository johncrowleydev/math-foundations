import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTeaching } from '../../tools/content/teaching.js';

const notebook = JSON.parse(await readFile('output/content/notebook.json', 'utf8'));
const teaching = await loadTeaching();
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} ≠ ${b}`);
const figure = (id: string) => {
  const f = teaching.figures.find((f) => f.id === `probability-statistics-figure-${id}`);
  assert.ok(f?.kind === 'cartesian');
  return f;
};

test('probability and statistics publishes its complete sequence with assessments after teaching', () => {
  const lessons = notebook.lessons.filter((l: any) => l.subject === 'Probability and Statistics');
  assert.deepEqual(
    lessons.map((l: any) => l.number),
    Array.from({ length: 23 }, (_, i) => i),
  );
  assert.equal(lessons[0].title, 'Introduction');
  assert.deepEqual(lessons[0].questions, []);
  for (const l of lessons) {
    assert.equal(l.sections.flatMap((s: any) => s.quickChecks).length, l.number ? 2 : 0);
    const placed = l.sections.flatMap((s: any) => s.questionIds);
    assert.equal(new Set(placed).size, placed.length);
    assert.deepEqual(
      new Set(placed),
      new Set(l.questions.filter((q: any) => !q.quickSource).map((q: any) => q.id)),
    );
  }
});

test('PMF heights and CDF jump values agree with the discrete probability law', () => {
  const masses = figure('5-pmf').regions.map((r) => Math.max(...r.points.map((p) => p[1])));
  close(
    masses.reduce((a, b) => a + b, 0),
    1,
  );
  const cdf = figure('5-cdf');
  const cumulative = [
    0,
    ...masses.map((_, i) => masses.slice(0, i + 1).reduce((a, b) => a + b, 0)),
  ];
  cdf.curves.forEach((c, i) => c.points.forEach(([, y]) => close(y, cumulative[i])));
  assert.deepEqual(
    cdf.markers.filter((m) => !m.open).map((m) => m.at),
    [
      [0, 0.25],
      [1, 0.75],
      [2, 1],
    ],
  );
});

test('density area, likelihood maximizer and interval coverage match their captions', () => {
  const polygon = figure('9').regions[0].points;
  const area =
    Math.abs(
      polygon.reduce((sum, [x, y], i) => {
        const next = polygon[(i + 1) % polygon.length];
        return sum + x * next[1] - y * next[0];
      }, 0),
    ) / 2;
  close(area, 1 / 4);
  figure('9').curves[0].points.forEach(([x, y]) => close(y, 2 * x));
  const likelihood = figure('17');
  const maximum = likelihood.markers[0].at;
  close(maximum[0], 3 / 5);
  likelihood.curves[0].points.forEach(([x, y]) => {
    close(y, x ** 3 * (1 - x) ** 2);
    assert.ok(y <= maximum[1] + 1e-12);
  });
  const target = figure('18').arrows[0].from[0];
  assert.deepEqual(
    figure('18').curves.map((c) => c.points[0][0] <= target && target <= c.points[1][0]),
    [true, false, true, true],
  );
});

test('covariance and regression overlays are consistent with their raw observations', () => {
  const pairs = figure('12').markers.map((m) => m.at);
  const meanX = pairs.reduce((s, [x]) => s + x, 0) / pairs.length;
  const meanY = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length;
  const covariance = pairs.reduce((s, [x, y]) => s + (x - meanX) * (y - meanY), 0) / pairs.length;
  close(covariance, 4);
  const regression = figure('21');
  const data = regression.markers.map((m) => m.at);
  const xbar = data.reduce((s, [x]) => s + x, 0) / data.length;
  const ybar = data.reduce((s, [, y]) => s + y, 0) / data.length;
  const slope =
    data.reduce((s, [x, y]) => s + (x - xbar) * (y - ybar), 0) /
    data.reduce((s, [x]) => s + (x - xbar) ** 2, 0);
  const intercept = ybar - slope * xbar;
  regression.curves[0].points.forEach(([x, y]) => close(y, intercept + slope * x));
  close(
    regression.arrows.reduce((s, a) => s + a.to[1] - a.from[1], 0),
    0,
  );
});

test('beta posterior normalization and bootstrap distribution follow the stated models', () => {
  const factorial = (n: number): number => (n ? n * factorial(n - 1) : 1);
  for (const [i, a, b] of [
    [0, 2, 3],
    [1, 5, 4],
  ]) {
    const normalizer = factorial(a + b - 1) / (factorial(a - 1) * factorial(b - 1));
    figure('20').curves[i].points.forEach(([p, y]) =>
      close(y, normalizer * p ** (a - 1) * (1 - p) ** (b - 1)),
    );
  }
  const means = [2, 6].flatMap((a) => [2, 6].map((b) => (a + b) / 2));
  for (const region of figure('22').regions) {
    const x = (region.points[0][0] + region.points[1][0]) / 2;
    const mass = means.filter((mean) => mean === x).length / means.length;
    close(Math.max(...region.points.map((p) => p[1])), mass);
  }
});
