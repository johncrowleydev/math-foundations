import type { Assessment } from './assessment.js';

// Planning heuristics, not timers, grades, or required evidence depth.
export const reviewCategories = [
  'definition',
  'true-false',
  'multiple-choice',
  'short-answer',
  'short-application',
  'deep-reasoning',
  'proof',
] as const;
export type ReviewCategory = (typeof reviewCategories)[number];
export const reviewSeconds: Record<ReviewCategory, number> = {
  definition: 20,
  'true-false': 20,
  'multiple-choice': 30,
  'short-answer': 60,
  'short-application': 120,
  'deep-reasoning': 300,
  proof: 600,
};
type CostQuestion = {
  category?: ReviewCategory;
  prompt?: string;
  instructions?: string;
  choice?: { options: { text: string }[] };
  assessment?: Assessment;
};
export function classifyReviewCost(question: CostQuestion, primarySkills: string[] = []) {
  let category = question.category;
  if (
    !category &&
    primarySkills.includes('recall') &&
    !primarySkills.some((s) => ['prove', 'justify', 'explain', 'reason', 'evaluate'].includes(s))
  )
    category = 'definition';
  if (!category && question.choice) {
    const labels = question.choice.options.map((o) => o.text.trim().toLowerCase());
    category =
      labels.length === 2 && labels.includes('true') && labels.includes('false')
        ? 'true-false'
        : 'multiple-choice';
  }
  if (!category && question.assessment) {
    const inputs = question.assessment.inputs;
    category =
      inputs.length === 1 && inputs[0].kind === 'boolean'
        ? 'true-false'
        : inputs.length === 1 && inputs[0].kind === 'select'
          ? 'multiple-choice'
          : inputs.length === 1 &&
              question.assessment.evidence.interactionCost === 'low' &&
              ['text', 'math'].includes(inputs[0].kind)
            ? 'short-answer'
            : 'short-application';
  }
  const text = `${question.instructions || ''} ${question.prompt || ''}`;
  if (!category && (primarySkills.includes('prove') || /\b(prove|proof|show that)\b/i.test(text)))
    category = 'proof';
  if (
    !category &&
    primarySkills.some((s) => ['justify', 'explain', 'reason', 'evaluate'].includes(s))
  )
    category = 'deep-reasoning';
  if (!category && /\b(state|name|identify|define)\b/i.test(text)) category = 'short-answer';
  category ??= 'short-application';
  return { category, estimatedSeconds: reviewSeconds[category] };
}
