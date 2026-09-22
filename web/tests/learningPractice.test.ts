import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceGuidance, recommendedPractice } from '../src/learningPractice';
import type { Attempt, Curriculum, Lesson } from '../src/types';
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
