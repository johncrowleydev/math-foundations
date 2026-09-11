import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTeaching } from './teaching.js';

const notebook = JSON.parse(await readFile('android/app/src/main/assets/notebook.json', 'utf8'));
const evidence = JSON.parse(await readFile('content/concept-introductions.json', 'utf8'));
const teaching = await loadTeaching();

test('every shared reference has an exact inspected introduction and related navigation', () => {
  assert.equal(new Set(evidence.map((e: any) => e.concept)).size, evidence.length);
  assert.deepEqual(
    new Set(evidence.map((e: any) => e.concept)),
    new Set(teaching.references.map((r) => r.id)),
  );
  for (const e of evidence) {
    const lesson = notebook.lessons.find((l: any) => l.slug === e.lesson);
    assert.ok(lesson, e.concept);
    const text = (
      e.section === 'Introduction'
        ? lesson.intro
        : lesson.sections.find((s: any) => s.title === e.section)?.markdown
    )?.replace(/\r\n/g, '\n');
    assert.equal(
      text?.slice(e.start, e.end),
      e.quote,
      'Re-inspect changed introduction: ' + e.concept,
    );
    assert.ok(e.end > e.start && e.quote.trim(), e.concept);
  }
  for (const r of teaching.references)
    assert.ok(r.related.length > 0, 'Missing related entries: ' + r.id);
});

test('context bindings distinguish logical roles and worked examples', () => {
  const at = (lesson: string, section: string, ordinal: number) => {
    const f = teaching.formulas.find(
      (f) =>
        f.lesson === lesson &&
        f.source.startsWith('section:' + section + ':') &&
        f.ordinal === ordinal,
    );
    assert.ok(f, lesson + '/' + section + '/' + ordinal);
    return f;
  };
  const conjunction = at('direct-proof', 'read-the-claim-before-choosing-a-method', 18);
  assert.ok(
    conjunction.bindings
      .filter((b) => b.symbol === 'P' || b.symbol === 'Q')
      .every((b) => b.reference === 'proposition' && /conjunction/.test(b.meaning)),
  );
  const predicate = at('proof-by-contrapositive', 'negate-compound-conditions-carefully', 20);
  assert.equal(predicate.bindings.find((b) => b.symbol === 'P')?.reference, 'predicate');
  const threshold = at('asymptotic-growth', 'big-o-an-eventual-upper-bound', 8);
  assert.deepEqual(
    threshold.bindings.map((b) => b.symbol),
    ['n_0'],
  );
  const first = at('recurrence-relations', 'iteration-unfold-the-definition', 1);
  const second = at('recurrence-relations', 'iteration-unfold-the-definition', 10);
  assert.match(first.bindings.find((b) => b.symbol === 'a')!.meaning, /adding 3/);
  assert.match(second.bindings.find((b) => b.symbol === 'a')!.meaning, /doubling/);
  const binary = at('strong-induction', 'a-finite-construction-by-splitting', 19);
  assert.match(binary.bindings.find((b) => b.symbol === 'n')!.meaning, /represented in binary/);
});
