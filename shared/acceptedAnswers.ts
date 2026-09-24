import type { Assessment, StructuredResponse } from './assessment.js';

export type AcceptedAnswers = Record<string, StructuredResponse>;

// Match the complete grading contract and the labels that explain its fields.
// Input hints may change without changing an answer's meaning. Other nested
// properties, including option labels, grid givens, and requirement parameters,
// remain part of the identity.
export function acceptedAnswerKey(assessment: Assessment): string {
  const ordered = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(ordered)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, entry]) => [key, ordered(entry)]),
          )
        : value;
  return JSON.stringify(
    ordered({
      version: assessment.version,
      inputs: assessment.inputs.map((input) =>
        Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'hint')),
      ),
      requirements: assessment.requirements,
    }),
  );
}

// The content build supplies authored solutions already checked by the grader.
// This index is a compiled lookup, never a replacement for archived definitions.
export function indexAcceptedAnswers(assessments: (Assessment | undefined)[]): AcceptedAnswers {
  const index: AcceptedAnswers = {};
  for (const assessment of assessments) {
    if (!assessment) continue;
    if (!assessment.solution) throw Error('Cannot index an assessment without an accepted answer.');
    const key = acceptedAnswerKey(assessment);
    index[key] ??= assessment.solution;
  }
  return index;
}

export function resolveAcceptedAnswer(
  assessment: Assessment,
  index?: AcceptedAnswers,
): StructuredResponse | undefined {
  return assessment.solution ?? index?.[acceptedAnswerKey(assessment)];
}
