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
    grades: [
      {
        verdict,
        feedback: selected.feedback,
        at: a.submitted,
        model: 'deterministic',
        promptVersion: 'authored-choice-2',
        confidence: 'high',
        requirements: [
          {
            id: 'selection',
            description: 'Select the correct option',
            satisfied: verdict === 'correct',
          },
        ],
        diagnosis: [],
      },
    ],
  };
}
export function currentChoiceFeedback(a: Attempt, choice?: ChoiceAssessment): string | undefined {
  if (a.mode !== 'choice' || !choice) return undefined;
  const selected = choice.options.find((o) => o.id === a.choiceId && o.text === a.text);
  if (!selected) return undefined;
  const verdict = selected.id === choice.correctOption ? 'correct' : 'incorrect';
  return verdict === a.verdict ? selected.feedback : undefined;
}
