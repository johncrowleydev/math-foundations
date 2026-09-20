export const R = String.raw;
const chapters = {
  2.2: 'the-limit-of-a-function',
  2.3: 'the-limit-laws',
  2.4: 'continuity',
  2.5: 'the-precise-definition-of-a-limit',
  3.1: 'defining-the-derivative',
  3.2: 'the-derivative-as-a-function',
  3.3: 'differentiation-rules',
  3.4: 'derivatives-as-rates-of-change',
  3.5: 'derivatives-of-trigonometric-functions',
  3.6: 'the-chain-rule',
  3.7: 'derivatives-of-inverse-functions',
  3.8: 'implicit-differentiation',
  3.9: 'derivatives-of-exponential-and-logarithmic-functions',
  4.1: 'related-rates',
  4.2: 'linear-approximations-and-differentials',
  4.3: 'maxima-and-minima',
  4.4: 'the-mean-value-theorem',
  4.5: 'derivatives-and-the-shape-of-a-graph',
  4.6: 'limits-at-infinity-and-asymptotes',
  4.7: 'applied-optimization-problems',
  4.8: 'lhopitals-rule',
};
export const source = (section, supports) => ({
  id: `os1-${section.replace('.', '-')}`,
  source: 'openstax-calculus-1',
  locator: `§${section} ${chapters[section].replaceAll('-', ' ')}`,
  url: `https://openstax.org/books/calculus-volume-1/pages/${section.replace('.', '-')}-${chapters[section]}`,
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
const checked = (prompt, answer, validator, params, correct, skill = 'compute') => ({
  prompt,
  answer,
  skill,
  check: { validator, params, correct, incorrect: correct === '0' ? '1' : '0' },
});
export const exact = (prompt, expected, answer, skill = 'compute') =>
  checked(prompt, answer, 'exact', { expected: [String(expected)] }, String(expected), skill);
export const expr = (prompt, expected, answer, variables = ['x']) =>
  checked(prompt, answer, 'expression', { expected, variables }, expected);
export const calc = (prompt, expected, answer, domain, variables = ['x']) =>
  checked(
    prompt,
    answer,
    'calculus-expression',
    { expected, variables, ...(domain ? { domain } : {}) },
    expected,
  );
export const text = (prompt, expected, answer, alternatives = []) =>
  checked(prompt, answer, 'term', { accepted: [expected, ...alternatives] }, expected, 'interpret');
export const bool = (prompt, expected, answer) => ({
  prompt,
  answer,
  skill: 'interpret',
  check: {
    validator: 'boolean',
    params: { expected: [expected] },
    correct: expected,
    incorrect: !expected,
  },
});
export const open = (prompt, answer, skill = 'justify') => ({ prompt, answer, skill });
export const qc = (prompt, options, answer, explanation) => ({
  prompt,
  options,
  answer,
  explanation,
});
