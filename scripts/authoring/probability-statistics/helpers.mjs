// Original subject authoring helpers; generated records use the existing content contracts.
export const r = String.raw;
export const prefix = 'probability-statistics-';
export const exact = (value, wrong = `(${value})+1`) => ({
  validator: 'exact',
  params: { expected: [String(value)] },
  correct: String(value),
  incorrect: String(wrong),
});
export const calc = (value, variables = [], domain, wrong = `(${value})+1`) => ({
  validator: 'calculus-expression',
  params: { expected: String(value), variables, ...(domain ? { domain } : {}) },
  correct: String(value),
  incorrect: String(wrong),
});
export const approx = (value, tolerance = '0.00005', minimum, maximum, wrong = `(${value})+1`) => ({
  validator: 'approximate-number',
  params: {
    expected: String(value),
    tolerance: String(tolerance),
    ...(minimum === undefined ? {} : { minimum: String(minimum) }),
    ...(maximum === undefined ? {} : { maximum: String(maximum) }),
  },
  correct: String(value),
  incorrect: String(wrong),
});
export const probability = (value, tolerance = '0.00005', wrong = '2') =>
  approx(value, tolerance, '0', '1', wrong);
export const tuple = (values, wrong) => ({
  validator: 'tuple',
  params: { expected: values.map(String) },
  correct: `(${values.join(',')})`,
  incorrect: wrong || `(${values.map((v, i) => (i ? v : `(${v})+1`)).join(',')})`,
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
// Authors must provide the complete worked answer, including the final value/formula.
export const q = (prompt, answer, check, skill = check ? 'compute' : 'justify') => ({
  prompt,
  answer,
  ...(check ? { check } : {}),
  skill,
});
export const fields = (parts) => ({ parts }); // [{ id, label, check }], one scalar requirement per part.
export const grid = (rows, columns, values, wrongValues) => ({
  grid: {
    rows,
    columns,
    values: values.map((row) => row.map(String)),
    ...(wrongValues ? { wrongValues } : {}),
  },
});
export const quick = (prompt, options, answer, explanation, responses) => ({
  prompt,
  options,
  answer,
  explanation,
  responses,
});
export const termEntry = (id, name, quick, definition, example, confusion) => ({
  id: prefix + id,
  name,
  quick,
  definition,
  example,
  confusion,
});
export const citation = (id, source, locator, url, supports) => ({
  id: 'ps-' + id,
  source,
  locator,
  url,
  supports,
});
export const lesson = (number, slug, title, intro, sections) => ({
  number,
  slug: prefix + slug,
  title,
  intro,
  sections,
});
export const section = (title, body, sources, terms = []) => ({
  title,
  body,
  sources,
  terms,
  questions: [],
  review: [],
});
export const frac = (a, b) => {
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));
  const d = gcd(a, b);
  return b / d === 1 ? String(a / d) : `${a / d}/${b / d}`;
};
