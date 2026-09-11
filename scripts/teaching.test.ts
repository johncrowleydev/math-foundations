import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTeaching, teachingBlocks, linkTeachingTerms } from './teaching.js';
const teaching = await loadTeaching();
test('graph data agree with degree and representation examples', () => {
  const g = teaching.figures.find((f) => f.id === 'graph-degree');
  assert.ok(g?.kind === 'graph');
  const degree = g.nodes.map((n) => g.edges.filter((e) => e.includes(n.id)).length);
  assert.deepEqual(degree, [2, 2, 3, 1]);
  assert.equal(
    degree.reduce((a, b) => a + b),
    2 * g.edges.length,
  );
  const matrix = g.nodes.map((a) =>
    g.nodes.map((b) =>
      Number(g.edges.some((e) => e.includes(a.id) && e.includes(b.id) && a.id !== b.id)),
    ),
  );
  assert.deepEqual(matrix, [
    [0, 1, 1, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 1],
    [0, 0, 1, 0],
  ]);
});
test('BFS and recursive DFS match the teaching traces', () => {
  const g = teaching.figures.find((f) => f.id === 'graph-search');
  assert.ok(g?.kind === 'graph');
  const adjacent = (v: string) =>
    g.edges
      .filter((e) => e.includes(v))
      .map((e) => (e[0] === v ? e[1] : e[0]))
      .sort();
  const queue = ['a'],
    bfs = ['a'],
    distance: Record<string, number> = { a: 0 };
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of adjacent(u))
      if (!(v in distance)) {
        distance[v] = distance[u] + 1;
        queue.push(v);
        bfs.push(v);
      }
  }
  const dfs: string[] = [];
  function visit(u: string) {
    dfs.push(u);
    for (const v of adjacent(u)) if (!dfs.includes(v)) visit(v);
  }
  visit('a');
  assert.deepEqual(bfs, ['a', 'b', 'c', 'd', 'e', 'f']);
  assert.deepEqual(Object.values(distance), [0, 1, 1, 2, 2, 2]);
  assert.deepEqual(dfs, ['a', 'b', 'd', 'e', 'c', 'f']);
});
test('Hamiltonian example does not meet Euler parity criterion', () => {
  const g = teaching.figures.find((f) => f.id === 'graph-euler-hamilton');
  assert.ok(g?.kind === 'graph');
  assert.deepEqual(
    g.nodes.map((n) => g.edges.filter((e) => e.includes(n.id)).length),
    [3, 3, 3, 3],
  );
  const route = g.frames[0].route;
  assert.equal(route[0], route.at(-1));
  assert.equal(new Set(route.slice(0, -1)).size, g.nodes.length);
  assert.equal(route.length - 1, 4);
  assert.equal(g.edges.length, 6);
});
test('figures remain at their exact authored location', () => {
  const blocks = teachingBlocks('Before.\n\n![Graph](figure:graph-first)\n\nAfter.', teaching);
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ['markdown', 'figure', 'markdown'],
  );
  assert.equal(blocks[0].markdown, 'Before.');
  assert.equal(blocks[2].markdown, 'After.');
  assert.throws(() => teachingBlocks('![Missing](figure:unknown)', teaching), /Unknown figure/);
});
test('term linking preserves TeX and external links and only marks first use', () => {
  const text = linkTeachingTerms(
    'A vertex. Another vertex. $vertex$ [vertex](https://example.org) ![vertex](figure:graph-first)',
    'relations',
    teaching,
  );
  assert.match(text, /\[vertex\]\(ref:vertex\)/);
  assert.match(text, /\[vertex\]\(ref:vertex\?repeat\)/);
  assert.match(text, /\$vertex\$/);
  assert.match(text, /\[vertex\]\(https:\/\/example.org\)/);
});

import { validateFormulaContexts } from './formula-context.js';
test('formula identity includes context and occurrence, and rejects stale or ambiguous targets', () => {
  const f = teaching.formulas[0];
  const sources = [
    { lesson: f.lesson, source: f.source, markdown: '$' + f.latex + '$' },
    { lesson: f.lesson, source: 'different-context', markdown: '$' + f.latex + '$' },
  ];
  const contextTeaching = { ...teaching, formulas: [f] };
  const inventory = validateFormulaContexts(sources, contextTeaching);
  assert.deepEqual(
    inventory.map((x) => x.hasExplanation),
    [true, false],
  );
  assert.throws(
    () => validateFormulaContexts([{ ...sources[0], markdown: '$H=(V,E)$' }], contextTeaching),
    /no longer matches/,
  );
  assert.throws(
    () =>
      validateFormulaContexts(sources, {
        ...teaching,
        formulas: [f, { ...f, id: 'duplicate-meaning' }],
      }),
    /Ambiguous/,
  );
});
test('quantifier figures exhaustively evaluate their authored finite domains', () => {
  const witness = teaching.figures.find((f) => f.id === 'quantifier-witness');
  assert.ok(witness?.kind === 'predicate-table');
  assert.deepEqual(
    witness.values,
    witness.rows.map((x) => [Number(x) ** 2 === 4]),
  );
  assert.deepEqual(witness.frames[1].highlight, ['row:2']);
  const order = teaching.figures.find((f) => f.id === 'quantifier-order');
  assert.ok(order?.kind === 'predicate-table');
  assert.deepEqual(
    order.values,
    order.rows.map((x) => order.columns.map((y) => x === y)),
  );
  assert.equal(
    order.values.every((row) => row.some(Boolean)),
    true,
  );
  assert.equal(
    order.columns.some((_, i) => order.values.every((row) => row[i])),
    false,
  );
  assert.deepEqual(
    order.frames.slice(1).map((f) => f.highlight[0]),
    ['row:1', 'row:2', 'column:1', 'column:2'],
  );
});

test('finite relation properties and Hasse covers agree with independently computed definitions', () => {
  const f = teaching.figures.find((f) => f.id === 'relation-finite-check');
  assert.ok(f?.kind === 'graph');
  const a = f.nodes.map((n) => n.id);
  const relates = (x: string, y: string) => f.edges.some(([u, v]) => u === x && v === y);
  assert.equal(
    a.every((x) => relates(x, x)),
    true,
  );
  assert.equal(
    a.every((x) => a.every((y) => !relates(x, y) || relates(y, x))),
    false,
  );
  assert.equal(
    a.every((x) => a.every((y) => !relates(x, y) || !relates(y, x) || x === y)),
    true,
  );
  const failures = a.flatMap((x) =>
    a.flatMap((y) =>
      a.filter((z) => relates(x, y) && relates(y, z) && !relates(x, z)).map((z) => [x, y, z]),
    ),
  );
  assert.deepEqual(failures, [['1', '2', '3']]);
  const h = teaching.figures.find((f) => f.id === 'relation-hasse');
  assert.ok(h?.kind === 'graph');
  const sets: Record<string, number[]> = { '∅': [], '{1}': [1], '{2}': [2], '{1,2}': [1, 2] };
  const expected = Object.keys(sets).flatMap((x) =>
    Object.keys(sets)
      .filter(
        (y) => sets[y].length === sets[x].length + 1 && sets[x].every((n) => sets[y].includes(n)),
      )
      .map((y) => [x, y]),
  );
  assert.deepEqual(h.edges, expected);
});
test('power-set and partition diagrams list exactly the promised members', () => {
  const f = teaching.figures.find((f) => f.id === 'sets-power');
  assert.ok(f?.kind === 'collections');
  const a = f.collections[0].elements as string[];
  const subsets = Array.from({ length: 2 ** a.length }, (_, mask) =>
    a.filter((_, i) => (mask & (1 << i)) !== 0),
  );
  assert.deepEqual(f.collections[1].elements, subsets);
  const p = teaching.figures.find((f) => f.id === 'sets-partition');
  assert.ok(p?.kind === 'collections');
  const blocks = p.collections.slice(1).flatMap((c) => c.elements as string[]);
  assert.equal(new Set(blocks).size, blocks.length);
  assert.deepEqual([...blocks].sort(), p.collections[0].elements);
});

test('function figures satisfy their claimed finite mapping properties', () => {
  const mapping = (id: string) => {
    const f = teaching.figures.find((f) => f.id === id);
    assert.ok(f?.kind === 'mapping');
    return f;
  };
  for (const id of [
    'function-machine',
    'function-preimage',
    'function-injection',
    'function-surjection',
  ]) {
    const f = mapping(id);
    for (const x of f.domain) assert.equal(f.pairs.filter((p) => p[0] === x).length, 1);
  }
  const i = mapping('function-injection');
  assert.equal(new Set(i.pairs.map((p) => p[1])).size, i.domain.length);
  assert.equal(
    i.pairs.some((p) => p[1] === 'c'),
    false,
  );
  const s = mapping('function-surjection');
  assert.deepEqual([...new Set(s.pairs.map((p) => p[1]))].sort(), s.codomain);
  assert.ok(s.domain.length > new Set(s.pairs.map((p) => p[1])).size);
  const p = mapping('function-preimage');
  assert.deepEqual(
    p.pairs.filter((p) => p[1] === 'a').map((p) => p[0]),
    ['1', '2'],
  );
  assert.equal(p.pairs.filter((p) => p[1] === 'c').length, 0);
});
test('sequence, square arrangements, and counting figures agree with independent counts', () => {
  for (const [id, term] of [
    ['sequence-arithmetic', (n: number) => 3 + 2 * n],
    ['sequence-geometric', (n: number) => 2 ** n],
  ] as const) {
    const f = teaching.figures.find((f) => f.id === id);
    assert.ok(f?.kind === 'sequence');
    assert.deepEqual(
      f.values,
      f.values.map((_, i) => term(i + f.firstIndex)),
    );
  }
  for (const f of teaching.figures.filter((f) => f.kind === 'sum'))
    for (const frame of f.frames) {
      const n = frame.n!;
      const cells = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) cells.push([i, j]);
      assert.equal(cells.length, (n * (n + 1)) / 2);
    }
  const stars = teaching.figures.find((f) => f.id === 'count-stars-bars');
  assert.ok(stars?.kind === 'bins');
  assert.deepEqual(stars.counts, [2, 0, 3]);
  assert.equal(
    stars.counts.reduce((a, b) => a + b, 0),
    5,
  );
  const pigeon = teaching.figures.find((f) => f.id === 'count-pigeonhole');
  assert.ok(pigeon?.kind === 'bins');
  const total = pigeon.counts.reduce((a, b) => a + b, 0);
  assert.equal(total, 7);
  assert.ok(Math.max(...pigeon.counts) >= Math.ceil(total / pigeon.counts.length));
  // Enumerate all seven-object allocations into three boxes, independently of the illustrated allocation.
  for (let a = 0; a <= 7; a++)
    for (let b = 0; b <= 7 - a; b++) {
      const c = 7 - a - b;
      assert.ok(Math.max(a, b, c) >= 3);
    }
});
test('construction and recurrence trees have the claimed leaves, dependencies, and level costs', () => {
  const g = teaching.figures.find((f) => f.id === 'strong-construction-tree');
  assert.ok(g?.kind === 'graph');
  const children = (v: string) => g.edges.filter((e) => e[0] === v).map((e) => e[1]);
  assert.equal(g.nodes.filter((n) => children(n.id).length === 0).length, 3);
  assert.equal(g.nodes.filter((n) => children(n.id).length === 2).length, 2);
  const d = teaching.figures.find((f) => f.id === 'recurrence-dependencies');
  assert.ok(d?.kind === 'graph');
  for (const [a, b] of d.edges) {
    const i = Number(a.slice(2)),
      j = Number(b.slice(2));
    assert.ok(j === i - 1 || j === i - 2);
  }
  assert.deepEqual(
    d.edges
      .filter((e) => e[0] === 'a_3')
      .map((e) => e[1])
      .sort(),
    ['a_1', 'a_2'],
  );
  const r = teaching.figures.find((f) => f.id === 'recurrence-levels');
  assert.ok(r?.kind === 'graph');
  let level = ['4'];
  const totals = [];
  while (level.length) {
    totals.push(level.reduce((sum, id) => sum + Number(id.split('_')[0]), 0));
    level = level.flatMap((id) => r.edges.filter((e) => e[0] === id).map((e) => e[1]));
  }
  assert.deepEqual(totals, [4, 4, 4]);
  assert.equal(
    totals.reduce((a, b) => a + b),
    4 * Math.log2(4) + 4,
  );
});
test('plotted expressions agree with labeled endpoint values and threshold inequality', () => {
  const f = teaching.figures.find((f) => f.id === 'growth-eventual-bound');
  assert.ok(f?.kind === 'plot');
  assert.equal(f.threshold, 3);
  const value = (c: number[], n: number) => c.reduce((s, v, i) => s + v * n ** i, 0);
  assert.equal(value(f.series[0].coefficients, 3), value(f.series[1].coefficients, 3));
  for (let n = 3; n <= 100; n++)
    assert.ok(value(f.series[0].coefficients, n) <= value(f.series[1].coefficients, n));
  // The actual proof is n+3 <= n+n when n>=3; finite sample checks only verify plotted arithmetic.
  assert.deepEqual([8, 8 * Math.log2(8), 8 ** 2], [8, 24, 64]);
});

test('graph formulas distinguish local distances, component counts, vertex labels, and parent records', () => {
  const graph = teaching.formulas.filter((f) => f.lesson === 'graph-theory');
  const meaning = (source: string, latex: string, symbol: string) =>
    graph
      .find((f) => f.source === source && f.latex === latex)!
      .bindings.find((b) => b.symbol === symbol)!.meaning;
  assert.match(
    meaning('section:breadth-first-and-depth-first-search:text-before-graph-search', 'd', 'd'),
    /distance/,
  );
  assert.match(meaning('figure:graph-first:label:d', 'd', 'd'), /vertex labeled d/);
  assert.match(
    meaning('section:trees-and-forests:text-end', 'c', 'c'),
    /number of connected components/,
  );
  assert.match(
    graph.find((f) => f.source === 'question:63:answer' && f.latex === 'b:a')!.reading,
    /parent of vertex b.* is a/,
  );
  assert.match(
    graph.find((f) => f.source === 'question:63:answer' && f.latex === 'c')!.reading,
    /vertex labeled c/,
  );
  assert.match(
    graph.find((f) => f.source === 'question:70:answer' && f.latex === 'a-b')!.reading,
    /edge joining vertices a and b/,
  );
  assert.ok(graph.every((f) => !f.reading.includes('undefined') && !f.reading.includes('[unread')));
});

test('search aliases do not force ambiguous ordinary words into technical links', () => {
  const text = linkTeachingTerms(
    'Even for nonnegative inputs, evenness requires an integer witness.',
    'direct-proof',
    teaching,
  );
  assert.ok(text.startsWith('Even for'));
  assert.match(text, /\[evenness\]\(ref:even-odd\)/);
  const state = teaching.references.find((r) => r.id === 'program-state')!;
  assert.ok(state.aliases.includes('state'));
  assert.equal(
    linkTeachingTerms('State the answer.', 'mathematical-induction', teaching),
    'State the answer.',
  );
  assert.match(
    linkTeachingTerms('[state](ref:program-state)', 'mathematical-induction', teaching),
    /ref:program-state/,
  );
});

test('non-strict order never receives the strict-order binding', () => {
  for (const f of teaching.formulas.filter(
    (f) => /\\preceq/.test(f.latex) && !/\\prec(?![A-Za-z])/.test(f.latex),
  )) {
    assert.ok(!f.bindings.some((b) => b.symbol === '\\prec'), f.id);
  }
});
