import type { Attempt } from './types';
import { validResponse } from './structuredAnswer';

// Both upload acknowledgements and downloaded records can replace the durable
// local answer. Validate their envelope before either path writes to IndexedDB.
// Historical snapshots may have a verdict without a populated grade history.
export function validServerAttempt(value: unknown): value is Attempt {
  const a = value as Partial<Attempt> | null;
  return (
    !!a &&
    typeof a.id === 'string' &&
    !!a.id &&
    typeof a.exercise === 'string' &&
    !!a.exercise &&
    typeof a.contentVersion === 'string' &&
    !!a.contentVersion &&
    Number.isSafeInteger(a.submitted) &&
    a.submitted! > 0 &&
    typeof a.text === 'string' &&
    typeof a.revealed === 'boolean' &&
    ['type', 'write', 'photo', 'choice', 'structured'].includes(a.mode || '') &&
    ['queued', 'pending', 'grading', 'graded', 'rechecking', 'cancelled', 'error'].includes(
      a.status || '',
    ) &&
    Array.isArray(a.images) &&
    a.images.every((image) => typeof image === 'string') &&
    Array.isArray(a.grades) &&
    a.grades.every(
      (grade) =>
        grade &&
        typeof grade.feedback === 'string' &&
        typeof grade.verdict === 'string' &&
        Number.isFinite(grade.at),
    ) &&
    (a.mode !== 'choice' || (typeof a.choiceId === 'string' && !!a.choiceId)) &&
    (a.mode !== 'structured' || validResponse(a.response))
  );
}
