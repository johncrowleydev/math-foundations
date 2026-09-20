// Authoring helpers for explicit, original multivariable practice families.
import { answerStatement } from './answer-format.mjs';
export const raw = String.raw;
export const source = (section, name) => ({
  id: 'os3-' + section.replace('.', '-'),
  source: 'openstax-calculus-3',
  locator: `§${section} ${name}`,
  url: `https://openstax.org/books/calculus-volume-3/pages/${section.replace('.', '-')}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')}`,
  supports: `${name}: definitions, hypotheses, methods, and interpretation supporting the original explanations and calculations.`,
});
export const exact = (value, wrong = `(${value})+1`) => ({
  validator: 'exact',
  params: { expected: [String(value)] },
  correct: String(value),
  incorrect: String(wrong),
});
export const expr = (value, variables = ['x', 'y'], domain) => ({
  validator: 'expression',
  params: { expected: value, variables, ...(domain ? { domain } : {}) },
  correct: value,
  incorrect: `(${value})+1`,
});
export const calc = (value, variables = ['x', 'y'], domain) => ({
  validator: 'calculus-expression',
  params: { expected: value, variables, ...(domain ? { domain } : {}) },
  correct: value,
  incorrect: `(${value})+1`,
});
export const tuple = (values) => ({
  validator: 'tuple',
  params: { expected: values.map(String) },
  correct: `(${values.join(',')})`,
  incorrect: `(${[`(${values[0]})+1`, ...values.slice(1)].join(',')})`,
});
export const truth = (value) => ({
  validator: 'boolean',
  params: { expected: [value] },
  correct: value,
  incorrect: !value,
});
export const term = (value, wrong) => ({
  validator: 'term',
  params: { accepted: [value] },
  correct: value,
  incorrect: wrong,
});
export const q = (prompt, answer, check, skill = check ? 'compute' : 'justify') => ({
  prompt,
  answer: check ? answerStatement(check) + '\n\n' + answer : answer,
  ...(check ? { check } : {}),
  skill,
});
export const section = (title, body, citation, name, definition, example, confusion) => ({
  title,
  body,
  sources: [citation],
  terms: [
    {
      id: 'calculus-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      quick: definition,
      definition,
      example,
      confusion,
    },
  ],
  questions: [],
  review: [],
});
export const quick = (prompt, options, answer, explanation) => ({
  prompt,
  options,
  answer,
  explanation,
});
export const frac = (a, b) => {
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));
  const g = gcd(a, b);
  if (b < 0) {
    a = -a;
    b = -b;
  }
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
};
