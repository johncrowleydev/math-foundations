import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceGuidance, practiceMinutes, recommendedPractice } from '../src/learningPractice';
import type { Assessment, Attempt, Curriculum, Lesson } from '../src/types';
const questions = [1, 2, 3, 4].map((id) => ({
  id,
  instructions: 'Identify an example.',
  section: 'Examples',
}));
const lesson = {
  slug: 'sample',
  questions,
  practiceIds: [2, 4],
  sections: [
    { id: 'examples', title: 'Examples', questionIds: [1], quickChecks: [{ exerciseId: 3 }] },
  ],
} as Lesson;
const data = {
  lessons: [lesson],
  evidence: {
    exercises: Object.fromEntries(
      questions.map((q) => [
        'sample-' + q.id,
        {
          concepts: [{ concept: 'inclusion', role: 'primary' }],
          skills: [{ skill: 'identify', role: 'primary' }],
          representations: [],
        },
      ]),
    ),
  },
} as unknown as Curriculum;
const attempt = (exercise: number, submitted: number, extra: Partial<Attempt> = {}) =>
  ({
    id: String(submitted),
    exercise: 'sample-' + exercise,
    submitted,
    verdict: 'correct',
    activeDurationMs: 20_000,
    assistance: {
      answerPreviouslyRevealed: false,
      priorIncorrectFeedbackSeen: false,
      copiedFromRetry: false,
    },
    ...extra,
  }) as Attempt;

test('recommended practice includes inline and quick placements; bank identities are preserved', () => {
  assert.deepEqual(
    recommendedPractice(lesson).map((q) => q.id),
    [1, 3],
  );
  assert.deepEqual(
    lesson.questions.map((q) => q.id),
    [1, 2, 3, 4],
  );
});
test('routine redundancy suggestion requires two distinct, fluent independent first responses', () => {
  assert.equal(
    practiceGuidance(data, lesson, questions[2], [attempt(1, 1), attempt(2, 2)])?.kind,
    'fluent',
  );
  assert.equal(
    practiceGuidance(data, lesson, questions[2], [attempt(1, 1), attempt(1, 2)]),
    undefined,
  );
  assert.equal(
    practiceGuidance(data, lesson, questions[2], [
      attempt(1, 1),
      attempt(2, 2, { activeDurationMs: undefined }),
    ]),
    undefined,
  );
  assert.equal(
    practiceGuidance(data, lesson, questions[2], [
      attempt(1, 1),
      attempt(2, 2, { assistance: undefined }),
    ]),
    undefined,
  );
  assert.equal(
    practiceGuidance(data, lesson, questions[2], [
      attempt(1, 1),
      attempt(2, 2, { verdict: 'incorrect' }),
      attempt(2, 3),
    ]),
    undefined,
  );
});
test('proofs remain deliberate practice and recent difficulty surfaces support', () => {
  assert.equal(
    practiceGuidance(data, lesson, { ...questions[2], category: 'proof' }, [
      attempt(1, 1),
      attempt(2, 2),
    ]),
    undefined,
  );
  const support = practiceGuidance(data, lesson, questions[2], [
    attempt(1, 1),
    attempt(2, 2, { unsure: true }),
  ]);
  assert.equal(support?.kind, 'support');
  if (support?.kind === 'support') assert.equal(support.nearby?.id, 4);
});

test('lessons without inline placements retain their complete practice route', () => {
  assert.deepEqual(recommendedPractice({ ...lesson, sections: [] }), questions);
  assert.deepEqual(recommendedPractice({ ...lesson, sections: [], questions: [] }), []);
});

test('fast proofs or deep reasoning never count as routine retrieval evidence', () => {
  for (const category of ['proof', 'deep-reasoning'] as const) {
    const withDeepQuestion = {
      ...lesson,
      questions: questions.map((question) =>
        question.id === 1 ? { ...question, category } : question,
      ),
    };
    assert.equal(
      practiceGuidance(data, withDeepQuestion, questions[2], [attempt(1, 1), attempt(2, 2)]),
      undefined,
    );
    assert.equal(
      practiceGuidance(data, lesson, questions[2], [
        attempt(1, 1, { presentation: { question: { ...questions[0], category } } }),
        attempt(2, 2),
      ]),
      undefined,
    );
  }
});

test('reasoning-only evidence cannot supply fluent responses or make a reasoning target skippable', () => {
  for (const ids of [[1, 2], [3]]) {
    const reasoning = structuredClone(data);
    for (const id of ids)
      reasoning.evidence.exercises['sample-' + id].attributes = { evidenceLevel: 'reasoning' };
    // Same ordinary identify skill and prompt as the positive routine test;
    // no proof wording or explicit deep category supplies this exclusion.
    assert.equal(
      practiceGuidance(reasoning, lesson, questions[2], [attempt(1, 1), attempt(2, 2)]),
      undefined,
    );
    const cheap = {
      ...lesson,
      questions: questions.map((question) => ({ ...question, category: 'definition' as const })),
    };
    assert.equal(
      practiceGuidance(reasoning, cheap, cheap.questions[2], [attempt(1, 1), attempt(2, 2)]),
      undefined,
      'An authored cheap cost cannot lower the evidence required for practice',
    );
  }
});

test('frozen reasoning evidence cannot become routine after the current metadata changes', () => {
  const history = [1, 2].map((id) =>
    attempt(id, id, {
      analytics: {
        ...data.evidence.exercises['sample-' + id],
        attributes: { evidenceLevel: 'reasoning' },
      } as Attempt['analytics'],
    }),
  );
  assert.equal(practiceGuidance(data, lesson, questions[2], history), undefined);
});

test('practice estimates forward required evidence depth without overriding authored costs', () => {
  const reasoning = structuredClone(data);
  reasoning.evidence.exercises['sample-1'].attributes = { evidenceLevel: 'reasoning' };
  assert.equal(practiceMinutes(reasoning, lesson, [questions[0]]), 5);
  assert.equal(practiceMinutes(data, lesson, [questions[0]]), 1);
  assert.equal(
    practiceMinutes(reasoning, lesson, [{ ...questions[0], category: 'definition' }]),
    1,
  );
});

test('reasoning assessments remain deep in current and both frozen presentation forms', () => {
  const assessment: Assessment = {
    version: 1,
    inputs: [{ id: 'answer', kind: 'text', label: 'Synthetic response' }],
    requirements: [],
    feedback: { correct: 'Synthetic', incorrect: 'Synthetic' },
    evidence: { level: 'reasoning', interactionCost: 'low', inputCapabilities: ['short-text'] },
  };
  const withReasoning = {
    ...lesson,
    questions: questions.map((question) =>
      question.id < 3 ? { ...question, assessment } : question,
    ),
  };
  assert.equal(
    practiceGuidance(data, withReasoning, questions[2], [attempt(1, 1), attempt(2, 2)]),
    undefined,
  );
  for (const presentation of [
    { question: { ...questions[0], assessment } },
    { question: questions[0], assessment },
  ]) {
    assert.equal(
      practiceGuidance(data, lesson, questions[2], [
        attempt(1, 1, { presentation }),
        attempt(2, 2),
      ]),
      undefined,
    );
  }
});
