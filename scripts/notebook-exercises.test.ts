import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadContent } from './content.js';
import { inlinePlacements, placeNotebookExercises } from './notebook-placements.js';
import {
  adaptNotebookQuestion,
  assertSelfContained,
  validateNotebookAdaptations,
} from './notebook-exercises.js';

const content = await loadContent();
function headings(markdown: string) {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
}

test('all inline exercises attach to an existing teaching heading and preserve question coverage', () => {
  let inlineCount = 0;
  assert.deepEqual(
    Object.keys(inlinePlacements).sort(),
    content.lessons
      .filter((l) => l.worksheetData)
      .map((l) => l.slug)
      .sort(),
  );
  for (const lesson of content.lessons) {
    const ids = (lesson.worksheetData?.sections || []).flatMap((s) => s.questions.map((q) => q.id));
    const placed = placeNotebookExercises(lesson.slug, headings(lesson.markdown), ids);
    const inline = placed.sectionQuestionIds.flat();
    if (['Discrete mathematics', 'Linear algebra'].includes(lesson.subject))
      inlineCount += inline.length;
    const all = [...inline, ...placed.practiceIds];
    assert.equal(new Set(all).size, ids.length);
    assert.deepEqual(
      all.sort((a, b) => a - b),
      ids.sort((a, b) => a - b),
    );
  }
  assert.equal(inlineCount, 253);
});

test('exercises wait for their prerequisite concepts, including terminology used in answers', () => {
  const requirements: [string, number, string[]][] = [
    ['propositional-logic', 31, ['Converse, inverse, and contrapositive']],
    ['propositional-logic', 35, ['Converse, inverse, and contrapositive']],
    ['propositional-logic', 46, ["De Morgan's laws"]],
    ['propositional-logic', 47, ["De Morgan's laws"]],
    [
      'propositional-logic',
      70,
      ['Arguments, premises, and conclusions', 'Two common invalid argument forms'],
    ],
    ['functions', 31, ['Bijections and inverse functions', 'Composition and types']],
  ];
  for (const [slug, id, required] of requirements) {
    const lesson = content.lessons.find((l) => l.slug === slug)!;
    const titles = headings(lesson.markdown);
    const ids = (lesson.worksheetData?.sections || []).flatMap((s) => s.questions.map((q) => q.id));
    const placed = placeNotebookExercises(slug, titles, ids);
    const position = placed.sectionQuestionIds.findIndex((qs) => qs.includes(id));
    for (const title of required) {
      assert.ok(titles.includes(title));
      assert.ok(position >= titles.indexOf(title), `${slug} exercise ${id} precedes ${title}`);
    }
  }
});

test('inserting teaching sections cannot shift inline exercises ahead of their named explanation', () => {
  for (const lesson of content.lessons) {
    const titles = headings(lesson.markdown);
    const ids = (lesson.worksheetData?.sections || []).flatMap((s) => s.questions.map((q) => q.id));
    const before = placeNotebookExercises(lesson.slug, titles, ids);
    const expanded = titles.flatMap((title, i) => [`New explanation ${i}`, title]);
    const after = placeNotebookExercises(lesson.slug, expanded, ids);
    titles.forEach((title, i) =>
      assert.deepEqual(
        after.sectionQuestionIds[expanded.indexOf(title)],
        before.sectionQuestionIds[i],
      ),
    );
    assert.deepEqual(after.practiceIds, before.practiceIds);
    if (!lesson.worksheetData) continue;
    const anchor = Object.keys(inlinePlacements[lesson.slug])[0];
    assert.throws(
      () =>
        placeNotebookExercises(
          lesson.slug,
          titles.filter((t) => t !== anchor),
          ids,
        ),
      /missing or ambiguous/,
    );
    assert.throws(
      () => placeNotebookExercises(lesson.slug, [...titles, anchor], ids),
      /missing or ambiguous/,
    );
  }
});

function question(slug: string, id: number) {
  const lesson = content.lessons.find((l) => l.slug === slug)!;
  const section = lesson.worksheetData!.sections.find((s) => s.questions.some((q) => q.id === id))!;
  return adaptNotebookQuestion(
    slug,
    section.questions.find((q) => q.id === id)!,
    section.instructions || '',
  );
}

test('all curriculum exercises adapt with valid math, stable IDs, and no printed-context references', () => {
  validateNotebookAdaptations(content.lessons);
  let count = 0;
  for (const l of content.lessons)
    for (const s of l.worksheetData?.sections || [])
      for (const source of s.questions) {
        const adapted = adaptNotebookQuestion(l.slug, source, s.instructions || '');
        assert.equal(adapted.id, source.id);
        assert.deepEqual(adapted.table, source.table);
        assert.equal(adapted.math, source.math);
        if (['Discrete mathematics', 'Linear algebra'].includes(l.subject)) count++;
      }
  assert.equal(count, 2010);
});
test('proposition classification does not inherit the translation exercise definitions', () => {
  const q = question('propositional-logic', 2);
  assert.match(q.prompt, /truth value/);
  assert.doesNotMatch(q.instructions, /server|database|1-8|9-14/);
  assert.match(question('propositional-logic', 9).instructions, /server is online/);
  assert.doesNotMatch(question('propositional-logic', 36).instructions, /converse/);
});
test('quantifier exercises receive only their own domain and predicate definitions', () => {
  assert.match(question('predicates-and-quantifiers', 1).instructions, /x>3/);
  assert.doesNotMatch(question('predicates-and-quantifiers', 1).instructions, /x\+2y/);
  assert.match(question('predicates-and-quantifiers', 4).instructions, /x\+2y=7/);
  assert.match(question('predicates-and-quantifiers', 19).instructions, /a,b,c/);
  assert.doesNotMatch(question('predicates-and-quantifiers', 19).instructions, /-2,-1/);
  assert.match(question('predicates-and-quantifiers', 117).prompt, /set of requests/);
});
test('graph exercise data and traversal rules stay within their applicable ranges', () => {
  assert.match(question('graph-theory', 13).instructions, /V=/);
  assert.doesNotMatch(question('graph-theory', 17).instructions, /V=/);
  assert.match(question('graph-theory', 61).instructions, /alphabetically/);
  assert.doesNotMatch(question('graph-theory', 66).instructions, /alphabetically/);
  assert.match(question('graph-theory', 75).prompt, /V=/);
});
test('dependent recurrence and proof exercises carry definitions and complete answers', () => {
  assert.match(question('strong-induction', 33).prompt, /F_0=0,F_1=1/);
  assert.match(question('strong-induction', 38).prompt, /a_n=a_/);
  assert.match(question('strong-induction', 22).answer, /18=4\+7\+7/);
  assert.match(question('functions', 74).prompt, /f\(S\\cap W\)/);
  assert.match(question('recurrence-relations', 58).prompt, /a_0=1/);
  assert.match(question('asymptotic-growth', 59).prompt, /S\(1\)=U\(1\)=1/);
});
test('future worksheet ranges and cross-question references fail the notebook build', () => {
  for (const text of [
    'For 1-8, decide whether…',
    'As in question 125.',
    'Use the preceding graph.',
    'See the answer key.',
  ]) {
    assert.throws(() => assertSelfContained(text, 'test'), /printed context/);
  }
});
