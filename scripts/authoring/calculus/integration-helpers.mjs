// Authoring conveniences only; these produce ordinary content records.
import { answerStatement } from './answer-format.mjs';

function completeAnswer(question) {
  const result = answerStatement(question.check);
  const math = result.match(/\$[^$]+\$/)?.[0];
  if (!math || !question.answer.includes(math)) {
    question.answer += ` ${result}`;
  }
  return question;
}
export const r = String.raw;
export const source = (volume, chapter, section, title, supports) => ({
  id: `os${volume}-${chapter}-${section}`,
  source: `openstax-calculus-${volume}`,
  locator: `§${chapter}.${section} ${title}`,
  url: `https://openstax.org/books/calculus-volume-${volume}/pages/${chapter}-${section}-${title
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')}`,
  supports,
});
export const term = (id, name, quick, definition, example, confusion) => ({
  id: `calculus-${id}`,
  name,
  quick,
  definition,
  example,
  confusion,
});
export const n = (prompt, expected, answer, incorrect = '999') =>
  completeAnswer({
    prompt,
    answer,
    skill: 'compute',
    check: {
      validator: /[a-z]/i.test(String(expected)) ? 'calculus-expression' : 'exact',
      params: /[a-z]/i.test(String(expected))
        ? { expected: String(expected), variables: [] }
        : { expected: [String(expected)] },
      correct: String(expected),
      incorrect,
    },
  });
export const e = (prompt, expected, answer, variables = ['x'], domain) =>
  completeAnswer({
    prompt,
    answer,
    skill: 'compute',
    check: {
      validator: 'calculus-expression',
      params: { expected, variables, ...(domain ? { domain } : {}) },
      correct: expected,
      incorrect: '999',
    },
  });
export const a = (prompt, integrand, correct, answer, domain, mode = 'family', initial) =>
  completeAnswer({
    prompt,
    answer,
    skill: 'compute',
    check: {
      validator: 'antiderivative',
      params: {
        variable: 'x',
        integrand,
        mode,
        ...(domain ? { domain } : {}),
        ...(initial ? { initial } : {}),
      },
      correct,
      incorrect: '999',
    },
  });
export const t = (prompt, expected, answer, incorrect = 'unknown') =>
  completeAnswer({
    prompt,
    answer,
    skill: 'interpret',
    check: { validator: 'term', params: { accepted: [expected] }, correct: expected, incorrect },
  });
export const o = (prompt, answer, skill = 'justify') => ({ prompt, answer, skill });
export const qc = (prompt, options, answer, explanation) => ({
  prompt,
  options,
  answer,
  explanation,
});
