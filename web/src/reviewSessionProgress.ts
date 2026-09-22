import type { Attempt } from './types';
import type { ReviewInstance, ReviewSession, ReviewSummary } from './reviewTypes';

// A server summary can retire redundant work in an already-issued session. Do
// not infer coverage from question text, tags, or locally graded answers.
export function reviewTargetCovered(
  session: ReviewSession,
  instance: ReviewInstance,
  attempts: Attempt[],
  summary: ReviewSummary | undefined,
  fetchedAt: number | undefined,
): boolean {
  if (
    session.kind !== 'scheduled-review' ||
    instance.context.kind !== 'scheduled-review' ||
    !fetchedAt ||
    !instance.context.presentedAt ||
    attempts.some((attempt) => attempt.exercise === instance.exercise)
  )
    return false;
  const target = summary?.targets.find(
    (target) =>
      target.concept === instance.context.concept &&
      target.skill === instance.context.skill &&
      target.objective === instance.context.objective,
  );
  return !!(
    target?.lastEvidenceAt &&
    target.lastEvidenceAt >= instance.context.presentedAt &&
    target.dueAt > fetchedAt
  );
}

export function nextReviewTaskIndex(
  session: ReviewSession,
  start: number,
  attempts: Attempt[],
  summary: ReviewSummary | undefined,
  fetchedAt: number | undefined,
  { resume = false } = {},
): number {
  const needsWork = (instance: ReviewInstance) => {
    if (
      resume &&
      attempts.some(
        (attempt) => attempt.exercise === instance.exercise && attempt.verdict === 'correct',
      )
    )
      return false;
    return !reviewTargetCovered(session, instance, attempts, summary, fetchedAt);
  };
  for (let index = start; index < session.instances.length; index++) {
    if (needsWork(session.instances[index])) return index;
  }
  if (resume) {
    // A saved position may be past earlier skipped or unfinished questions.
    // Reopening a session must not turn that position into a completion screen.
    for (let index = 0; index < Math.min(start, session.instances.length); index++) {
      if (needsWork(session.instances[index])) return index;
    }
    // Fully answered/covered sessions remain available for inspecting answers.
    return Math.max(0, Math.min(start, session.instances.length - 1));
  }
  return session.instances.length;
}
