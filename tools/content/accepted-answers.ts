import type { Assessment } from '../../shared/assessment.js';
import { gradeAssessment } from '../../shared/deterministic.js';
import katex from 'katex';

// An explanation and separate passing fixtures are not a usable answer key.
// The exact response rendered under "Accepted answer" must pass every field and
// grading requirement together. Keep this a publication rule so old immutable
// review instances and historical attempts remain readable.
export function validateAcceptedAnswer(
  question: {
    answer?: string;
    assessment?: Assessment;
    choice?: { correctOption: string; options: { id: string; text: string }[] };
  },
  identity: string,
) {
  if (question.assessment) {
    const { assessment } = question;
    if (!assessment.solution)
      throw Error(`${identity}: an authored accepted answer is required for every assessment.`);
    try {
      if (gradeAssessment(assessment, assessment.solution).verdict !== 'correct')
        throw Error('The solution is not correct.');
      for (const input of assessment.inputs) {
        if (input.kind !== 'math') continue;
        const tex = String(assessment.solution[input.id]).replace(/^\$\$?|\$\$?$/g, '');
        katex.renderToString(tex, { throwOnError: true, strict: 'error' });
        const logical = assessment.requirements.some(
          (requirement) =>
            requirement.fields.includes(input.id) &&
            ['quantified-formula', 'boolean-formula'].includes(requirement.validator),
        );
        // Parser convenience syntax is not the app's mathematical notation.
        // These tokens otherwise render as unrelated letters or punctuation.
        if (
          /(?<!\\)\b(?:forall|exists|notin)\b|->|!=/.test(tex) ||
          /(?<![\\A-Za-z])(?:sqrt|exp|sin|cos|tan|asin|acos|atan|ln|log|binom)\s*\(/.test(tex) ||
          /\^(?:\(|-\d|\d{2,})/.test(tex) ||
          (logical && /(?<!\\)[!|&]/.test(tex.replace(/\\exists\s*!/g, '\\exists')))
        )
          throw Error(`Use TeX notation for the displayed ${input.label} answer.`);
      }
    } catch (error) {
      throw Error(
        `${identity}: the displayed accepted answer must pass its grader. ${String(error)}`,
      );
    }
  } else if (question.choice) {
    const correct = question.choice.options.filter((o) => o.id === question.choice!.correctOption);
    if (correct.length !== 1 || !correct[0].text.trim())
      throw Error(`${identity}: the revealed correct option must identify a nonempty answer.`);
  } else if (!question.answer?.trim()) {
    throw Error(`${identity}: a model answer is required for an open-response question.`);
  }
}
