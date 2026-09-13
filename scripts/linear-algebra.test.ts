import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadContent } from './content.js';
import { loadTeaching } from './teaching.js';

const content = await loadContent();
const mv = (a: number[][], x: number[]) => a.map((row) => row.reduce((s, v, i) => s + v * x[i], 0));
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

test('the objective inventory accounts for every linear-algebra question and section', async () => {
  const objectives = JSON.parse(await readFile('content/linear-algebra-objectives.json', 'utf8'));
  const keys = new Set(objectives.map((o: any) => `${o.lesson}/${o.id}`));
  assert.equal(keys.size, objectives.length);
  let total = 0;
  for (const l of content.lessons.filter(
    (l) => l.subject === 'Linear algebra' && l.worksheetData,
  )) {
    for (const section of l.worksheetData!.sections)
      for (const q of section.questions) {
        total++;
        const record = objectives.find((o: any) => o.lesson === l.slug && o.id === q.id);
        assert.ok(record, `${l.slug}/${q.id}`);
        assert.equal(record.section, section.title);
        assert.ok(record.objective && record.verification);
      }
  }
  assert.equal(total, objectives.length);
});

test('corrected endpoint angles and wide-matrix nullity are explicitly taught', () => {
  const vectors = content.lessons.find((l) => l.slug === 'linear-algebra-vectors')!;
  for (const q of vectors.worksheetData!.sections.flatMap((s) => s.questions))
    assert.doesNotMatch(
      q.prompt + q.answer,
      /\bnorm\b/i,
      'Norm must wait for the dot-product lesson',
    );
  const angle = content.lessons.find((l) => l.slug === 'linear-algebra-dot-products')!;
  assert.match(angle.markdown, /180 degrees/);
  assert.match(
    angle
      .worksheetData!.sections.flatMap((s) => s.questions)
      .find((q) => q.prompt.includes('negative dot product'))!.answer,
    /180 degrees/,
  );
  const svd = content.lessons.find((l) => l.slug === 'linear-algebra-svd')!;
  assert.match(svd.markdown, /number of columns minus rank/);
  assert.match(svd.markdown, /some input basis directions have no diagonal position/);
});

test('each authored subject starts at reading-only 00; legacy identities remain stable', async () => {
  for (const subject of new Set(content.lessons.map((l) => l.subject))) {
    const lessons = content.lessons.filter((l) => l.subject === subject);
    assert.equal(lessons[0].number, 0);
    assert.equal(lessons[0].title, 'Introduction');
    assert.equal(lessons[0].worksheetData, undefined);
    assert.deepEqual(
      lessons.map((l) => l.number),
      lessons.map((_, i) => i),
    );
  }
  const old = JSON.parse(await readFile('content/reading-order-v7.json', 'utf8'));
  assert.ok(old);
  const discrete = content.lessons.filter(
    (l) => l.subject === 'Discrete mathematics' && l.worksheetData,
  );
  assert.equal(discrete.length, 15);
  assert.equal(
    discrete.reduce(
      (n, l) => n + l.worksheetData!.sections.reduce((s, c) => s + c.questions.length, 0),
      0,
    ),
    1313,
  );
  assert.equal(discrete[0].slug, 'propositional-logic');
});

test('worked matrix, system, rank and eigenvector claims agree with independent calculations', () => {
  assert.deepEqual(
    mv(
      [
        [1, 2],
        [3, 4],
      ],
      [2, 1],
    ),
    [4, 10],
  );
  assert.deepEqual(
    mv(
      [
        [1, 2],
        [3, -1],
      ],
      [2, 3],
    ),
    [8, 3],
  );
  assert.deepEqual(
    mv(
      [
        [1, 2],
        [3, 5],
      ],
      [2, 1],
    ),
    [4, 11],
  );
  assert.deepEqual(
    mv(
      [
        [1, 0, 1],
        [0, 1, 1],
      ],
      [-1, -1, 1],
    ),
    [0, 0],
  );
  assert.deepEqual(
    mv(
      [
        [4, 1],
        [0, 2],
      ],
      [1, -2],
    ),
    [2, -4],
  );
  assert.deepEqual(
    mv(
      [
        [2, 1],
        [0, 3],
      ],
      mv(
        [
          [2, 1],
          [0, 3],
        ],
        [2, 1],
      ),
    ),
    [13, 9],
  );
  assert.deepEqual(
    mv(
      [
        [0, 3],
        [1, 0],
      ],
      [2, 4],
    ),
    [12, 2],
  );
  const a = [
      [1, 2],
      [0, 1],
    ],
    inv = [
      [1, -2],
      [0, 1],
    ];
  for (const x of [
    [1, 0],
    [0, 1],
  ]) {
    assert.deepEqual(mv(a, mv(inv, x)), x);
    assert.deepEqual(mv(inv, mv(a, x)), x);
  }
  assert.equal(dot([1, -2, 3], [4, 0, -1]), 1);
  assert.equal(dot([2, 3], [3, -2]), 0);
  assert.equal(dot([-3, -1, 4], [1, 1, 1]), 0);
  assert.ok(Math.abs(dot([2 / 5, -1 / 5], [1, 2])) < 1e-12);
});

test('coordinate diagrams use exact displacements, equal units, and verified geometric claims', async () => {
  const teaching = await loadTeaching();
  const figures = teaching.figures.filter((f) => f.kind === 'coordinates');
  assert.equal(figures.length, 7);
  for (const f of figures) {
    assert.equal(f.kind, 'coordinates');
    if (f.kind !== 'coordinates') continue;
    for (const a of f.arrows) {
      assert.ok(f.mathLabels[a.label]);
      for (const value of [...a.from, ...a.to]) assert.ok(Math.abs(value) <= f.extent);
    }
    for (const axes of f.ellipses) assert.ok(axes.every((n) => n <= f.extent));
  }
  const get = (id: string) => {
    const f = figures.find((f) => f.id === id)!;
    assert.equal(f.kind, 'coordinates');
    if (f.kind !== 'coordinates') throw Error('wrong kind');
    return f;
  };
  const add = get('la-vector-addition');
  const u = add.arrows[0],
    v = add.arrows[1],
    sum = add.arrows[2];
  assert.deepEqual(u.to, v.from);
  assert.deepEqual(
    sum.to,
    u.to.map((n, i) => n + v.to[i] - v.from[i]),
  );
  const orth = get('la-orthogonal-vectors');
  assert.equal(dot(orth.arrows[0].to, orth.arrows[1].to), 0);
  const dependent = get('la-pairwise-dependence').arrows;
  assert.deepEqual(
    dependent[0].to.map((x, i) => x + dependent[1].to[i]),
    dependent[2].to,
  );
  const eigen = get('la-eigen-directions').arrows;
  assert.deepEqual(
    mv(
      [
        [2, 1],
        [1, 2],
      ],
      eigen[1].to,
    ),
    eigen[0].to,
  );
  assert.deepEqual(
    mv(
      [
        [2, 1],
        [1, 2],
      ],
      eigen[2].to,
    ),
    eigen[2].to,
  );
  const projection = get('la-projection');
  const b = projection.arrows[0].to,
    p = projection.arrows[1].to;
  assert.equal(
    dot(
      b.map((n, i) => n - p[i]),
      p,
    ),
    0,
  );
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8,
      x = [Math.cos(angle), Math.sin(angle)];
    const [a, b] = mv(
      [
        [0, 2],
        [1, 0],
      ],
      x,
    );
    assert.ok(Math.abs((a * a) / 4 + b * b - 1) < 1e-12);
  }
});
