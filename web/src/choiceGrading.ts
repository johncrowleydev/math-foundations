import type { Attempt, ChoiceAssessment } from './types';
export function gradeChoice(a: Attempt, choice: ChoiceAssessment): Attempt {
  const selected = choice.options.find((o) => o.id === a.choiceId);
  if (!selected) throw Error('Select an answer before submitting.');
  const verdict = selected.id === choice.correctOption ? 'correct' : 'incorrect';
  return {
    ...a,
    text: selected.text,
    status: 'graded',
    verdict,
    grades: [{ verdict, feedback: selected.feedback, at: a.submitted, model: 'deterministic' }],
  };
}
