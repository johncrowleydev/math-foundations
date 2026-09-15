// Immutable submissions must satisfy the same effort bounds as the Go API.
// Drafts have no submitted timestamp and may retain an untouched zero-duration clock.
export function validAttemptEffort(v: Record<string, any>) {
  return (
    validEffort(v) &&
    Number.isSafeInteger(v.submitted) &&
    (v.startedAt === undefined ||
      (Number.isSafeInteger(v.startedAt) && v.startedAt > 0 && v.startedAt <= v.submitted)) &&
    (v.activeDurationMs === undefined ||
      (Number.isSafeInteger(v.activeDurationMs) &&
        v.startedAt !== undefined &&
        v.activeDurationMs <= v.submitted - v.startedAt))
  );
}
export function validEffort(v: Record<string, any>) {
  const number = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  return (
    (v.startedAt === undefined || number(v.startedAt)) &&
    (v.activeDurationMs === undefined || number(v.activeDurationMs)) &&
    (v.unsure === undefined || typeof v.unsure === 'boolean') &&
    (v.assistance === undefined ||
      (v.assistance &&
        ['answerPreviouslyRevealed', 'priorIncorrectFeedbackSeen', 'copiedFromRetry'].every(
          (k) => typeof v.assistance[k] === 'boolean',
        )))
  );
}
export function validGradeEvidence(v: Record<string, any>) {
  const strings = (x: unknown) => Array.isArray(x) && x.every((s) => typeof s === 'string');
  return (
    (v.confidence === undefined || ['high', 'medium', 'low'].includes(v.confidence)) &&
    (v.notGradedReason === undefined ||
      [
        '',
        'unreadable',
        'missing-image',
        'ambiguous-problem',
        'insufficient-context',
        'grader-failure',
      ].includes(v.notGradedReason)) &&
    (v.requirements === undefined ||
      (Array.isArray(v.requirements) &&
        v.requirements.every(
          (r: any) =>
            r &&
            typeof r.id === 'string' &&
            typeof r.description === 'string' &&
            typeof r.satisfied === 'boolean',
        ))) &&
    (v.diagnosis === undefined ||
      (Array.isArray(v.diagnosis) &&
        v.diagnosis.every(
          (d: any) =>
            d &&
            [
              'conceptual',
              'procedural',
              'reasoning',
              'representation',
              'justification',
              'clerical',
              'prompt-compliance',
              'technical',
              'unknown',
            ].includes(d.class) &&
            (d.severity === undefined || ['', 'minor', 'substantive'].includes(d.severity)) &&
            ['tags', 'concepts', 'skills'].every((k) => d[k] === undefined || strings(d[k])),
        )))
  );
}
export function validSnapshot(v: any) {
  if (v === undefined) return true;
  if (
    !v ||
    typeof v.version !== 'string' ||
    !['submission', 'historical-backfill'].includes(v.provenance)
  )
    return false;
  return (
    ['concepts', 'skills'].every(
      (k) =>
        Array.isArray(v[k]) &&
        v[k].every(
          (x: any) =>
            x &&
            typeof x[k === 'concepts' ? 'concept' : 'skill'] === 'string' &&
            ['primary', 'supporting'].includes(x.role),
        ),
    ) &&
    Array.isArray(v.representations) &&
    v.representations.every((x: any) => typeof x === 'string') &&
    ['conceptDefinitions', 'skillDefinitions', 'representationDefinitions'].every(
      (k) =>
        Array.isArray(v[k]) &&
        v[k].every((x: any) => x && typeof x.id === 'string' && typeof x.name === 'string'),
    )
  );
}
