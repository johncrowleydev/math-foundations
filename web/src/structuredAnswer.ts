import { assessmentFields } from '../../shared/assessment';
import { gradeAssessment, validateAssessment } from '../../shared/deterministic';
import type { Assessment, Attempt, Draft, Question, StructuredResponse } from './types';

const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

export function validResponse(value: unknown): value is StructuredResponse {
  return (
    object(value) &&
    Object.keys(value).length <= 4096 &&
    Object.entries(value).every(
      ([key, v]) =>
        key.length > 0 &&
        key.length <= 300 &&
        !['__proto__', 'constructor', 'prototype'].includes(key) &&
        (v === null ||
          typeof v === 'boolean' ||
          (typeof v === 'string' && v.length <= 20000) ||
          (Array.isArray(v) &&
            v.length <= 4096 &&
            v.every((entry) => typeof entry === 'string' && entry.length <= 300))),
    )
  );
}

export function validAssessment(value: unknown): value is Assessment {
  try {
    validateAssessment(value);
    return true;
  } catch {
    return false;
  }
}

export function validPresentation(value: unknown): boolean {
  const choice = object(value) && object(value.question) ? value.question.choice : undefined;
  return (
    value === undefined ||
    (object(value) &&
      object(value.question) &&
      typeof value.question.instructions === 'string' &&
      ['prompt', 'math', 'answer'].every(
        (key) =>
          value.question &&
          object(value.question) &&
          (value.question[key] === undefined || typeof value.question[key] === 'string'),
      ) &&
      (choice === undefined ||
        (object(choice) &&
          !value.question.assessment &&
          typeof choice.correctOption === 'string' &&
          Array.isArray(choice.options) &&
          choice.options.every(
            (option) =>
              object(option) &&
              typeof option.id === 'string' &&
              typeof option.text === 'string' &&
              typeof option.feedback === 'string',
          ))) &&
      (value.question.assessment === undefined || validAssessment(value.question.assessment)) &&
      (value.assessment === undefined || validAssessment(value.assessment)))
  );
}

// Exact serialized identity avoids hash collisions and is only stored locally.
// Display numbers, lesson placement, and accepted-answer examples do not change
// the response's meaning. Keep legacy fingerprints identical when adding a solution.
export function assessmentFingerprint(q: Question): string {
  const ordered = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(ordered)
      : object(value)
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, ordered(value[key])]),
          )
        : value;
  return JSON.stringify(
    ordered({
      instructions: q.instructions,
      prompt: q.prompt,
      math: q.math,
      table: q.table,
      choice: q.choice,
      assessment:
        q.assessment &&
        Object.fromEntries(Object.entries(q.assessment).filter(([key]) => key !== 'solution')),
    }),
  );
}

export function reconcileResponse(draft: Draft, question: Question): Draft {
  if (!question.assessment && !question.choice && !draft.assessmentFingerprint) return draft;
  const fingerprint = assessmentFingerprint(question);
  if (draft.assessmentFingerprint === fingerprint) return draft;
  const earlierWork = [...(draft.earlierWork || [])];
  if (draft.response && Object.keys(draft.response).length) {
    earlierWork.push({
      fingerprint: draft.assessmentFingerprint || '',
      question: draft.assessmentQuestion,
      response: draft.response,
      updated: draft.updated,
    });
  }
  if (draft.assessmentFingerprint && draft.choiceId) {
    earlierWork.push({
      fingerprint: draft.assessmentFingerprint,
      question: draft.assessmentQuestion,
      response: { choice: draft.choiceId },
      updated: draft.updated,
    });
  }
  const previous = [...earlierWork].reverse().find((work) => work.fingerprint === fingerprint);
  return {
    ...draft,
    choiceId: draft.assessmentFingerprint
      ? question.choice && typeof previous?.response.choice === 'string'
        ? previous.response.choice
        : undefined
      : draft.choiceId,
    response: previous ? { ...previous.response } : {},
    assessmentFingerprint: fingerprint,
    assessmentQuestion: question,
    earlierWork,
  };
}

export function responseComplete(assessment: Assessment, response: StructuredResponse): boolean {
  return assessmentFields(assessment).every((field) => {
    const value = response[field.id];
    if (field.kind === 'boolean') return typeof value === 'boolean';
    if (field.kind === 'multiselect') return Array.isArray(value);
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function gradeStructured(attempt: Attempt, question: Question): Attempt {
  if (!question.assessment || !attempt.response) throw Error('Complete the answer first.');
  const result = gradeAssessment(question.assessment, attempt.response);
  return {
    ...attempt,
    mode: 'structured',
    text: '',
    images: [],
    photos: undefined,
    ink: undefined,
    presentation: { question },
    status: 'graded',
    verdict: result.verdict,
    grades: [
      {
        ...result,
        model: 'deterministic',
        promptVersion: 'structured-1',
        at: attempt.submitted,
        confidence: 'high',
        diagnosis: [],
      },
    ],
  };
}

export function deterministicAttempt(a: Attempt): boolean {
  return (
    a.mode === 'choice' ||
    a.mode === 'structured' ||
    !!a.presentation?.question.assessment ||
    !!a.presentation?.assessment ||
    !!a.presentation?.question.choice ||
    a.grades.some((grade) => grade.model === 'deterministic')
  );
}

export function pasteGrid(
  input: Extract<Assessment['inputs'][number], { kind: 'grid' }>,
  response: StructuredResponse,
  row: number,
  column: number,
  text: string,
): StructuredResponse {
  const rows = text
    .replace(/\r\n?/g, '\n')
    .replace(/\n$/, '')
    .split('\n')
    .map((r) => r.split('\t'));
  if (
    rows.length > input.rows.length - row ||
    rows.some((r) => r.length > input.columns.length - column)
  )
    throw Error('The pasted values do not fit here.');
  const next = { ...response };
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cell = input.rows[row + r].cells[column + c];
      if (!cell || 'given' in cell) throw Error('Paste only into answer cells.');
      const value = rows[r][c].trim();
      if (cell.kind === 'boolean') {
        if (!/^(?:t|f|true|false)?$/i.test(value)) throw Error('Use T or F in truth-value cells.');
        next[cell.id] = value ? /^t/i.test(value) : null;
      } else next[cell.id] = value;
    }
  }
  return next;
}
