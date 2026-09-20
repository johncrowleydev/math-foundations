import type { Attempt } from './types';
import { assessmentFingerprint, validPresentation, validResponse } from './structuredAnswer';
import { validAttemptEffort, validGradeEvidence, validSnapshot } from './evidenceValidation';
import { validReviewContext } from './reviewValidation';

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const canonical = (value: unknown): string | undefined =>
  JSON.stringify(value, (_, v) =>
    object(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((key) => [key, v[key]]),
        )
      : v,
  );
const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);

// The API retires submitted media only after retaining a readable graded
// transcription. An imported legacy transcript alone is not proof of retirement.
export function hasRetainedTranscription(a: Attempt): boolean {
  return (
    ['write', 'photo'].includes(a.mode) &&
    typeof a.transcription === 'string' &&
    !!a.transcription.trim() &&
    a.images.length === 0 &&
    !a.photos?.length &&
    a.ink === undefined &&
    a.grades.some(
      (grade) => grade.verdict !== 'not_graded' && grade.transcription === a.transcription,
    )
  );
}

function validServerPresentation(value: Attempt['presentation']) {
  // Archived pre-snapshot questions without an answer are serialized by Go as
  // answer:null. This exception does not erase an existing nonempty answer.
  const normalized = value && {
    ...value,
    question: { ...value.question, answer: value.question?.answer ?? undefined },
  };
  return (
    validPresentation(normalized) &&
    !(
      value?.assessment &&
      value.question?.assessment &&
      !same(value.assessment, value.question.assessment)
    )
  );
}

function samePresentation(
  a: NonNullable<Attempt['presentation']>,
  b: NonNullable<Attempt['presentation']>,
  review: boolean,
) {
  // The API projects lesson questions without UI IDs/placement/display numbers,
  // and may duplicate the same assessment at the presentation's top level.
  const question = (p: typeof a) => ({
    ...p.question,
    answer: p.question.answer ?? undefined,
    assessment: p.assessment ?? p.question.assessment,
  });
  return (
    (!review || same(question(a), question(b))) &&
    assessmentFingerprint(question(a)) === assessmentFingerprint(question(b)) &&
    same(a.question.answer ?? undefined, b.question.answer ?? undefined)
  );
}

// Both upload acknowledgements and downloaded records can replace the durable
// local answer. Validate their envelope before either path writes to IndexedDB.
// Historical snapshots may have a verdict without a populated grade history.
export function validServerAttempt(value: unknown): value is Attempt {
  const a = value as Partial<Attempt> | null;
  return (
    object(a) &&
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
    validAttemptEffort(a) &&
    validReviewContext(a.review) &&
    // Dedicated Review templates have no analytics snapshot; the API serializes
    // their nil raw JSON as null. Existing snapshots are compared below.
    validSnapshot(a.analytics ?? undefined) &&
    validServerPresentation(a.presentation) &&
    (!(a.review || a.exercise.startsWith('review-')) ||
      (!!a.review &&
        !!a.presentation &&
        a.exercise === 'review-' + a.review.instanceId &&
        a.submitted! >= a.review.presentedAt)) &&
    (a.transcription === undefined || typeof a.transcription === 'string') &&
    (a.ink === undefined || object(a.ink)) &&
    (a.photos === undefined ||
      (Array.isArray(a.photos) &&
        a.photos.every(
          (photo) =>
            object(photo) &&
            typeof photo.hash === 'string' &&
            [0, 90, 180, 270].includes(photo.rotation as number),
        ))) &&
    ['type', 'write', 'photo', 'choice', 'structured'].includes(a.mode || '') &&
    ['pending', 'grading', 'graded', 'not_graded', 'rechecking', 'cancelled', 'error'].includes(
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
        Number.isFinite(grade.at) &&
        validGradeEvidence(grade),
    ) &&
    (a.response === undefined || validResponse(a.response)) &&
    (a.mode !== 'choice' || (typeof a.choiceId === 'string' && !!a.choiceId)) &&
    (a.mode !== 'structured' || validResponse(a.response))
  );
}

// Compare with every durable local authority before replacing it. Missing legacy
// snapshots may be enriched by the server; existing evidence must not disappear.
export function preservesAttempt(next: Attempt, original: Attempt): boolean {
  const fields = [
    'id',
    'exercise',
    'submitted',
    'contentVersion',
    'mode',
    'text',
    'revealed',
    'startedAt',
    'activeDurationMs',
    'assistance',
    'unsure',
    'review',
    'response',
  ] as const;
  if (
    fields.some((field) => !same(next[field], original[field])) ||
    (next.choiceId || undefined) !== (original.choiceId || undefined)
  )
    return false;

  const retired =
    original.images.length > 0 && !original.transcription && hasRetainedTranscription(next);
  if (
    !retired &&
    (!same(next.images, original.images) ||
      !same(next.photos || [], original.photos || []) ||
      !same(next.ink, original.ink))
  )
    return false;
  if (original.transcription && next.transcription !== original.transcription) return false;
  if (
    original.presentation &&
    (!next.presentation ||
      !samePresentation(next.presentation, original.presentation, !!original.review))
  )
    return false;
  if (original.analytics && !same(next.analytics, original.analytics)) return false;
  return true;
}

export function preservesConfirmedAttempt(
  next: Attempt,
  original: Attempt,
  allowGradeDefaults = false,
): boolean {
  // Legacy cache-only imports may gain Go's serialized empty string fields.
  // Once a versioned server record exists, even those bytes stay authoritative.
  const grade = (value: Attempt['grades'][number]) =>
    allowGradeDefaults
      ? {
          issue: '',
          improvement: '',
          transcription: '',
          model: '',
          promptVersion: '',
          reason: '',
          ...value,
        }
      : value;
  return (
    preservesAttempt(next, original) &&
    next.grades.length >= original.grades.length &&
    original.grades.every((old, index) => same(grade(next.grades[index]), grade(old)))
  );
}
