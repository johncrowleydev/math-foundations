import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTeaching } from '../../tools/content/teaching.js';

const notebook = JSON.parse(await readFile('output/content/notebook.json', 'utf8'));
const teaching = await loadTeaching();
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} ≠ ${b}`);
const figure = (number: number) => {
  const f = teaching.figures.find((f) => f.id === `calculus-figure-${number}`);
  assert.ok(f?.kind === 'cartesian');
  return f;
};

test('calculus preserves a reading-only introduction followed by the complete instructional sequence', () => {
  const lessons = notebook.lessons.filter((l: any) => l.subject === 'Calculus');
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

test('limit, secant, tangent and behavior figures represent their stated functions', () => {
  for (const c of figure(1).curves)
    for (const [x, y] of c.points) {
      assert.notEqual(x, 1);
      close(y, x + 1);
    }
  assert.deepEqual(
    figure(1).markers.map((m) => [m.at, m.open]),
    [
      [[1, 2], true],
      [[1, 4], false],
    ],
  );
  const functions = [(x: number) => x * x, (x: number) => 3 * x - 2, (x: number) => 2 * x - 1];
  figure(2).curves.forEach((c, i) => c.points.forEach(([x, y]) => close(y, functions[i](x))));
  figure(7).curves[0].points.forEach(([x, y]) => close(y, x ** 3 - 3 * x));
});

test('signed area and Taylor figure coordinates agree with the worked calculations', () => {
  const polygon = figure(9).regions[0].points;
  const area =
    polygon.reduce((sum, [x, y], i) => {
      const next = polygon[(i + 1) % polygon.length];
      return sum + x * next[1] - y * next[0];
    }, 0) / 2;
  close(area, 2);
  figure(15).curves[0].points.forEach(([x, y]) => close(y, Math.sin(x)));
  figure(15).curves[1].points.forEach(([x, y]) => close(y, x - x ** 3 / 6));
});

test('contours and gradient overlays preserve the level values and normal direction', () => {
  figure(16).curves.forEach((c, i) =>
    c.points.forEach(([x, y]) => close(x * x + 2 * y * y, [2, 8][i])),
  );
  const f = figure(17);
  f.curves[0].points.forEach(([x, y]) => close(x * x + 2 * y * y, 6));
  f.curves[1].points.forEach(([x, y]) => close(x + y, 3));
  assert.deepEqual(f.arrows[0].from, [2, 1]);
  const [dx, dy] = f.arrows[0].to.map((v, i) => v - f.arrows[0].from[i]);
  close(dx - dy, 0);
  assert.ok(dx > 0 && dy > 0);
});

test('descent figure marks exact small-step and divergent iterates', () => {
  const f = figure(22);
  f.markers.forEach(({ at: [x, y] }) => close(y, x * x));
  const iterate = (x: number, alpha: number) => x - alpha * 2 * x;
  close(f.markers[1].at[0], iterate(1, 1 / 4));
  close(f.markers[2].at[0], iterate(1, 5 / 4));
  close(f.markers[3].at[0], iterate(iterate(1, 5 / 4), 5 / 4));
});
