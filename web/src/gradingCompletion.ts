import type { Attempt } from './types';

// Ignore downloaded history and repeated syncs; rechecks can finish between polls.
export function gradingCompleted(previous: Attempt | undefined, next: Attempt): boolean {
  return Boolean(
    previous &&
    ['graded', 'not_graded'].includes(next.status) &&
    (['queued', 'pending', 'grading', 'rechecking'].includes(previous.status) ||
      next.grades.length > previous.grades.length),
  );
}
