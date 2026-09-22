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
  return ids.size ? lesson.questions.filter((question) => ids.has(question.id)) : lesson.questions;
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
  const relatedQuestions = new Map(
    related.map((candidate) => [exerciseKey(lesson, candidate.id), candidate]),
  );
  const history = attempts
    .filter((attempt) => !attempt.review && relatedQuestions.has(attempt.exercise))
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
  const routine = (
    candidate: Question,
    mapping = data.evidence.exercises[exerciseKey(lesson, candidate.id)],
    assessment = candidate.assessment,
  ) => {
    const evidenceLevel = mapping.attributes?.evidenceLevel;
    // Cheap authored costs or response controls cannot make reasoning evidence
    // routine. Check both current metadata and the frozen attempt's requirements.
    if (
      evidenceLevel === 'reasoning' ||
      candidate.assessment?.evidence.level === 'reasoning' ||
      assessment?.evidence.level === 'reasoning'
    )
      return false;
    const skills = mapping.skills
      .filter((link) => link.role === 'primary')
      .map((link) => link.skill);
    const { category } = classifyReviewCost(
      candidate,
      skills,
      typeof evidenceLevel === 'string' ? evidenceLevel : undefined,
    );
    return !skills.includes('prove') && category !== 'proof' && category !== 'deep-reasoning';
  };
  const independent = [...first.values()].filter(
    (attempt) =>
      routine(relatedQuestions.get(attempt.exercise)!) &&
      routine(
        attempt.presentation?.question || relatedQuestions.get(attempt.exercise)!,
        attempt.analytics || data.evidence.exercises[attempt.exercise],
        attempt.presentation?.assessment,
      ) &&
      attempt.verdict === 'correct' &&
      !assisted(attempt) &&
      attempt.assistance !== undefined &&
      attempt.activeDurationMs !== undefined &&
      attempt.activeDurationMs > 0 &&
      attempt.activeDurationMs <= 120_000,
  );
  const alreadyAttempted = history.some(
    (attempt) => attempt.exercise === exerciseKey(lesson, question.id),
  );
  return routine(question) && !alreadyAttempted && independent.length >= 2
    ? { kind: 'fluent' as const }
    : undefined;
}

export function practiceMinutes(data: Curriculum, lesson: Lesson, questions: Question[]) {
  return Math.ceil(
    questions.reduce((seconds, question) => {
      const mapping = data.evidence.exercises[exerciseKey(lesson, question.id)];
      const evidenceLevel = mapping?.attributes?.evidenceLevel;
      return (
        seconds +
        classifyReviewCost(
          question,
          mapping?.skills.filter((link) => link.role === 'primary').map((link) => link.skill),
          typeof evidenceLevel === 'string' ? evidenceLevel : undefined,
        ).estimatedSeconds
      );
    }, 0) / 60,
  );
}
