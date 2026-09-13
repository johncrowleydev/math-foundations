import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mathRanges, diagnostics } from '../src/math';
import { encodeInk, decodeInk } from '../src/nativeInk';
import 'fake-indexeddb/auto';
import { get, put, saveAttempt, integrate, all } from '../src/storage';
test('math delimiters handle escapes, display math, and incomplete input', () => {
  assert.equal(mathRanges(String.raw`Price \$5, then $x^{12}$ and $$x+1$$`).length, 2);
  assert.equal(mathRanges('$unfinished')[0].closed, false);
  assert.equal(mathRanges('$$x$$')[0].display, true);
  assert.ok(diagnostics('$\\unsupported{x}$', []).some((d) => d.message.includes('not in')));
  assert.ok(diagnostics('$x^{2$', []).some((d) => d.severity === 'error'));
});
test('pen wire format preserves coordinates, pressure and colors', async () => {
  const strokes = [
    {
      color: '#253a43',
      width: 1.4,
      points: [
        { x: 120, y: 510, p: 0.25 },
        { x: 118.345, y: 525.125, p: 0.75 },
      ],
    },
  ];
  const native = await encodeInk(strokes),
    roundtrip = await decodeInk(native);
  assert.equal(native.version, 1);
  assert.equal(roundtrip[0].color, strokes[0].color);
  assert.ok(Math.abs(roundtrip[0].points[1].x - 118.345) < 0.001);
  assert.ok(Math.abs(roundtrip[0].points[1].p - 0.75) < 0.001);
});
test('drafts never become outgoing attempts until submitted; revisions are monotonic', async () => {
  await put('drafts', 'logic-1', { text: 'Unsubmitted' });
  assert.equal((await all('outbox')).length, 0);
  const a = {
    id: 'test-attempt',
    exercise: 'logic-1',
    submitted: 1,
    contentVersion: 'v',
    mode: 'type',
    text: 'Submitted',
    images: [],
    revealed: false,
    status: 'queued',
    grades: [],
  };
  await saveAttempt(a);
  assert.equal((await all('outbox')).length, 1);
  await integrate(
    [
      {
        key: 'attempt/test-attempt',
        revision: 5,
        id: 'server-v',
        payload: { ...a, status: 'graded', verdict: 'correct' },
        device: 'server',
        updated: 2,
        versions: [],
        conflicts: [],
      },
    ],
    5,
  );
  assert.equal((await all('outbox')).length, 0);
  await integrate(
    [
      {
        key: 'attempt/test-attempt',
        revision: 4,
        id: 'old',
        payload: { ...a, status: 'pending' },
        device: 'server',
        updated: 1,
        versions: [],
        conflicts: [],
      },
    ],
    5,
  );
  assert.equal((await get<{ verdict: string }>('attempts', a.id))?.verdict, 'correct');
  assert.equal((await get<{ text: string }>('drafts', 'logic-1'))?.text, 'Unsubmitted');
});
test('all content, figures and inline targets are bundled from the shared curriculum', async () => {
  const n = JSON.parse(await readFile('public/notebook.json', 'utf8')),
    t = JSON.parse(await readFile('public/teaching.json', 'utf8'));
  assert.equal(n.lessons.length, 27);
  assert.equal(
    n.lessons.reduce((s: number, l: any) => s + l.questions.length, 0),
    2010,
  );
  assert.equal(
    n.lessons.reduce(
      (s: number, l: any) =>
        s + l.sections.reduce((n: number, s: any) => n + s.quickChecks.length, 0),
      0,
    ),
    50,
  );
  const kinds = new Set([
    'coordinates',
    'graph',
    'mapping',
    'venn',
    'collections',
    'sequence',
    'sum',
    'board',
    'plot',
    'predicate-table',
    'bins',
  ]);
  for (const f of t.figures) assert.ok(kinds.has(f.kind), f.id);
  for (const l of n.lessons)
    for (const s of l.sections) {
      for (const id of s.questionIds) assert.ok(l.questions.some((q: any) => q.id === id));
      for (const b of s.blocks)
        if (b.kind === 'figure') assert.ok(t.figures.some((f: any) => f.id === b.figureId));
    }
});
