import { classifyReviewCost } from '../../shared/reviewCost';
import { exerciseKey } from './exerciseIdentity';
import type { Attempt, Curriculum, Lesson, Question } from './types';

// Authored teaching placements are the recommended route. The complete question
// bank remains addressable, including old URLs, saved positions and attempts.
export function recommendedPractice(lesson: Lesson): Question[] {
  const ids = new Set(
    lesson.sections.flatMap((section) => [
      ...section.questionIds,
      ...section.quickChecks.flatMap((check) =>
        check.exerciseId === undefined ? [] : [check.exerciseId],
      ),
    ]),
  );
  return lesson.questions.filter((question) => ids.has(question.id));
}

function skillKey(data: Curriculum, lesson: Lesson, question: Question) {
  const mapping = data.evidence.exercises[exerciseKey(lesson, question.id)];
  if (!mapping) return '';
  const concepts = mapping.concepts
    .filter((link) => link.role === 'primary')
    .map((link) => link.concept)
    .sort();
  const skills = mapping.skills
    .filter((link) => link.role === 'primary')
    .map((link) => link.skill)
    .sort();
  return concepts.length && skills.length ? JSON.stringify([concepts, skills]) : '';
}

export function practiceGuidance(
  data: Curriculum,
  lesson: Lesson,
  question: Question,
  attempts: Attempt[],
) {
  const key = skillKey(data, lesson, question);
  if (!key) return undefined;
  const related = lesson.questions.filter((candidate) => skillKey(data, lesson, candidate) === key);
  const relatedKeys = new Set(related.map((candidate) => exerciseKey(lesson, candidate.id)));
  const history = attempts
    .filter((attempt) => !attempt.review && relatedKeys.has(attempt.exercise))
    .sort((a, b) => a.submitted - b.submitted);
  const assisted = (attempt: Attempt) =>
    attempt.revealed || attempt.unsure || Object.values(attempt.assistance || {}).some(Boolean);
  const latest = history.at(-1);
  const needsSupport = latest && (latest.verdict === 'incorrect' || assisted(latest));
  if (needsSupport) {
    const practiced = new Set(history.map((attempt) => attempt.exercise));
    const nearby = related.find(
      (candidate) =>
        candidate.id !== question.id && !practiced.has(exerciseKey(lesson, candidate.id)),
    );
    return { kind: 'support' as const, nearby };
  }
  // Repeated submissions of one exercise never count as independent evidence.
  // Unknown timing/assistance is not evidence of fluent, unassisted retrieval.
  const first = new Map<string, Attempt>();
  for (const attempt of history)
    if (!first.has(attempt.exercise)) first.set(attempt.exercise, attempt);
  const independent = [...first.values()].filter(
    (attempt) =>
      attempt.verdict === 'correct' &&
      !assisted(attempt) &&
      attempt.assistance !== undefined &&
      attempt.activeDurationMs !== undefined &&
      attempt.activeDurationMs > 0 &&
      attempt.activeDurationMs <= 120_000,
  );
  const primarySkills = data.evidence.exercises[exerciseKey(lesson, question.id)].skills
    .filter((link) => link.role === 'primary')
    .map((link) => link.skill);
  const { category } = classifyReviewCost(question, primarySkills);
  const deep =
    primarySkills.includes('prove') || category === 'proof' || category === 'deep-reasoning';
  const alreadyAttempted = history.some(
    (attempt) => attempt.exercise === exerciseKey(lesson, question.id),
  );
  return !deep && !alreadyAttempted && independent.length >= 2
    ? { kind: 'fluent' as const }
    : undefined;
}

export function practiceMinutes(data: Curriculum, lesson: Lesson, questions: Question[]) {
  return Math.ceil(
    questions.reduce(
      (seconds, question) =>
        seconds +
        classifyReviewCost(
          question,
          data.evidence.exercises[exerciseKey(lesson, question.id)]?.skills
            .filter((link) => link.role === 'primary')
            .map((link) => link.skill),
        ).estimatedSeconds,
      0,
    ) / 60,
  );
}
