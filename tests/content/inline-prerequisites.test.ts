import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadContent } from '../../tools/content/content.js';
import { adaptNotebookQuestion } from '../../tools/content/notebook-exercises.js';
import { inlinePlacements } from '../../tools/content/notebook-placements.js';
import {
  adaptInlineQuestion,
  inlineAudit,
  teachingSections,
  validateInlinePrerequisites,
} from '../../tools/content/inline-prerequisites.js';

const content = await loadContent();
function displayed(slug: string, id: number) {
  const lesson = content.lessons.find((l) => l.slug === slug)!;
  const section = lesson.worksheetData!.sections.find((s) => s.questions.some((q) => q.id === id))!;
  return adaptInlineQuestion(slug, {
    ...adaptNotebookQuestion(
      slug,
      section.questions.find((q) => q.id === id)!,
      section.instructions || '',
    ),
    section: section.title,
  });
}
test('every inline exercise has a current audit with preceding teaching evidence', () => {
  validateInlinePrerequisites(content.lessons);
  assert.equal(
    Object.entries(inlineAudit)
      .filter(
        ([slug]) => !slug.startsWith('calculus-') && !slug.startsWith('probability-statistics-'),
      )
      .reduce((n, [, entries]) => n + Object.keys(entries).length, 0),
    235,
  );
});
test('inline instructions cannot inherit witness, complements, empty products, or graph concepts early', () => {
  for (const id of [1, 11])
    assert.doesNotMatch(
      JSON.stringify(displayed('predicates-and-quantifiers', id)),
      /witness|existential|ordered pair/i,
    );
  assert.doesNotMatch(
    JSON.stringify(displayed('sets-and-set-operations', 1)),
    /complement|universe/i,
  );
  for (const id of [1, 11, 21, 31, 41])
    assert.doesNotMatch(
      displayed('sequences-and-summations', id).instructions,
      /product|factorial/i,
    );
  for (const id of [1, 11, 21, 31])
    assert.doesNotMatch(
      JSON.stringify(displayed('graph-theory', id)),
      /forest|tree|Euler|Hamiltonian/i,
    );
  assert.doesNotMatch(
    displayed('recurrence-relations', 1).instructions,
    /first.order|second.order|homogeneous/i,
  );
});
test('answers and expanded-workspace labels do not introduce unprepared notation or topic names', () => {
  assert.doesNotMatch(displayed('direct-proof', 41).answer, /\|n\|/);
  assert.doesNotMatch(
    displayed('predicates-and-quantifiers', 101).instructions,
    /ordered pairs|coordinate/,
  );
  assert.doesNotMatch(displayed('proof-by-contrapositive', 11).answer, /disjuncts/);
  for (const [slug, entries] of Object.entries(inlineAudit))
    for (const [id, entry] of Object.entries(entries))
      assert.equal(displayed(slug, Number(id)).section, entry.after);
});
test('missing audits, newly changed instructions and changed teaching require an explicit re-audit', () => {
  const missing = structuredClone(inlineAudit);
  delete missing['predicates-and-quantifiers'][1];
  assert.throws(() => validateInlinePrerequisites(content.lessons, missing), /exactly one audit/);
  const changed = structuredClone(inlineAudit);
  changed['predicates-and-quantifiers'][1].instructions += ' Give a witness.';
  assert.throws(
    () => validateInlinePrerequisites(content.lessons, changed),
    /Re-audit changed inline exercise/,
  );
  const lessons = structuredClone(content.lessons);
  lessons.find((l) => l.slug === 'predicates-and-quantifiers')!.markdown = lessons
    .find((l) => l.slug === 'predicates-and-quantifiers')!
    .markdown.replace(
      'A **predicate** is a property or relationship',
      'A **predicate** is something',
    );
  assert.throws(() => validateInlinePrerequisites(lessons), /Re-audit changed prerequisite/);
});
test('moving a problem or its prerequisite into the wrong order is rejected', () => {
  const plans = structuredClone(inlinePlacements);
  const audit = structuredClone(inlineAudit);
  const slug = 'propositional-logic';
  plans[slug]['Converse, inverse, and contrapositive'] = [];
  plans[slug]['Implication: IF ... THEN'] = [31];
  audit[slug][31].after = 'Implication: IF ... THEN';
  assert.throws(
    () => validateInlinePrerequisites(content.lessons, audit, plans),
    /Untaught prerequisite/,
  );
  const lessons = structuredClone(content.lessons);
  const original = lessons.find((l) => l.slug === 'predicates-and-quantifiers')!.markdown;
  const sections = teachingSections(original);
  const moved = sections.splice(
    sections.findIndex((s) => s.title === 'Existential quantification: there exists'),
    1,
  )[0];
  sections.push(moved);
  lessons.find((l) => l.slug === 'predicates-and-quantifiers')!.markdown =
    original.split(/^## /m)[0] + sections.map((s) => `## ${s.title}\n${s.text}\n\n`).join('');
  assert.throws(() => validateInlinePrerequisites(lessons), /Untaught prerequisite/);
});
