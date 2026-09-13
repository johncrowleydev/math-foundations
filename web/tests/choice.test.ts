import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gradeChoice, currentChoiceFeedback } from '../src/choiceGrading';
import type { Attempt, Lesson } from '../src/types';
const notebook = JSON.parse(
  fs.readFileSync(new URL('../../output/content/notebook.json', import.meta.url), 'utf8'),
) as { lessons: Lesson[] };
test('every authored choice option produces its deterministic verdict and feedback', () => {
  let count = 0;
  for (const l of notebook.lessons)
    for (const q of l.questions) {
      if (!q.choice) continue;
      count++;
      for (const o of q.choice.options) {
        const a = {
          id: 'synthetic',
          exercise: l.slug + '-' + q.id,
          submitted: 1,
          mode: 'choice',
          choiceId: o.id,
          text: '',
          images: [],
          revealed: false,
          status: 'queued',
          grades: [],
          contentVersion: 'test',
        } satisfies Attempt;
        const g = gradeChoice(a, q.choice);
        assert.equal(g.status, 'graded');
        assert.equal(g.verdict, o.id === q.choice.correctOption ? 'correct' : 'incorrect');
        assert.equal(g.grades[0].feedback, o.feedback);
        assert.equal(g.text, o.text);
        assert.throws(() => gradeChoice({ ...a, choiceId: 'invalid' }, q.choice!));
      }
    }
  assert.equal(count, 95);
});
test('all knowledge checks share an exercise identity in Learn and Practice', () => {
  let count = 0;
  for (const l of notebook.lessons) {
    assert.equal(new Set(l.questions.map((q) => q.id)).size, l.questions.length);
    for (const s of l.sections)
      for (const c of s.quickChecks) {
        const q = l.questions.find((q) => q.id === c.exerciseId);
        assert.ok(q?.choice);
        assert.equal(q.quickSource, c.id);
        assert.equal(q.choice.correctOption, q.choice.options[c.answer].id);
        assert.equal(q.prompt, c.prompt);
        count++;
      }
  }
  assert.equal(count, 50);
});

test('updated explanations also display on existing matching choice attempts', () => {
  const q = notebook.lessons
    .find((l) => l.slug === 'propositional-logic')!
    .questions.find((q) => q.id === 82)!;
  const a: Attempt = {
    id: 'old-choice',
    exercise: 'propositional-logic-82',
    submitted: 1,
    contentVersion: 'old',
    mode: 'choice',
    choiceId: 'option-1',
    text: q.choice!.options[0].text,
    images: [],
    revealed: false,
    status: 'graded',
    verdict: 'correct',
    grades: [
      { verdict: 'correct', feedback: 'Sufficient; necessary.', at: 1, model: 'deterministic' },
    ],
  };
  assert.equal(currentChoiceFeedback(a, q.choice), q.choice!.options[0].feedback);
  assert.equal(a.grades[0].feedback, 'Sufficient; necessary.');
  assert.equal(currentChoiceFeedback({ ...a, mode: 'type' }, q.choice), undefined);
  assert.equal(currentChoiceFeedback({ ...a, text: 'A different option' }, q.choice), undefined);
  assert.equal(currentChoiceFeedback({ ...a, verdict: 'incorrect' }, q.choice), undefined);
});

test('all option explanations are distinct and the server ships the same authored feedback', () => {
  const catalog = JSON.parse(
    fs.readFileSync(new URL('../../output/grading-catalog.json', import.meta.url), 'utf8'),
  );
  let options = 0;
  for (const l of notebook.lessons)
    for (const q of l.questions) {
      if (!q.choice) continue;
      assert.deepEqual(catalog.exercises[l.slug + '-' + q.id].choice, q.choice);
      assert.equal(new Set(q.choice.options.map((o) => o.feedback)).size, q.choice.options.length);
      for (const o of q.choice.options) {
        assert.notEqual(o.feedback.trim(), o.text.trim());
        options++;
      }
    }
  assert.equal(options, 232);
});
