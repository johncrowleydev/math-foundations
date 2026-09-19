import {
  cleanMath,
  Exact,
  InputError,
  parseExpression,
  sameExpressionDomain,
  type Expression,
} from './exact';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
const fail = (s: string): never => {
  throw new InputError(s);
};
function monomial(source: string, variable: string): { coefficient: Exact; degree: number } {
  const p = parseExpression(source, [variable]);
  if (
    [...p.den.keys()].some((k) => k !== '') ||
    p.exclusions.some((d) => [...d.keys()].some((k) => k !== '')) ||
    p.num.size > 1
  )
    fail('Use a supported monomial inside this radical or absolute value.');
  const [key, coefficient] = p.num.entries().next().value || ['', Exact.rational(0)];
  const degree = key ? Number(key.split(':')[1]) : 0;
  return { coefficient: coefficient.div(p.den.get('') || Exact.rational(1)), degree };
}
/** Exact piecewise normalization for the curriculum's monomial radicals. */
export function elementaryExpression(
  source: string,
  variable: string,
  domain: 'real' | 'nonnegative',
  sign: 1 | -1,
): Expression {
  if (/\bradicalRoot\b/.test(source) || variable === 'radicalRoot')
    fail('Use the variable named in the question.');
  let s = cleanMath(source)
    .replace(/\\sqrt\b/g, 'sqrt')
    .replace(/\\(?:lvert|rvert)\b/g, '|')
    .replace(/\|([^|]+)\|/g, 'abs($1)');
  // Half-powers of an atom or balanced parenthesized expression become square roots.
  for (let pass = 0; pass < 64; pass++) {
    const half = /\^\s*\(\s*(?:1\s*\/\s*2|0\.5)\s*\)/.exec(s);
    if (!half) break;
    let begin = half.index - 1;
    while (begin >= 0 && /\s/.test(s[begin])) begin--;
    const end = begin + 1;
    if (s[begin] === ')') {
      let nesting = 1;
      while (--begin >= 0 && nesting) {
        if (s[begin] === ')') nesting++;
        if (s[begin] === '(') nesting--;
      }
      if (nesting) fail('Check the square root exponent.');
      begin++;
    } else {
      while (begin >= 0 && /[A-Za-z0-9_.]/.test(s[begin])) begin--;
      begin++;
    }
    if (begin >= end) fail('Put a base before the half power.');
    s =
      s.slice(0, begin) +
      'sqrt(' +
      s.slice(begin, end) +
      ')' +
      s.slice(half.index + half[0].length);
  }
  let result = '';
  for (let i = 0; i < s.length;) {
    const match = /^(sqrt|abs)\s*\(/.exec(s.slice(i));
    if (!match) {
      result += s[i++];
      continue;
    }
    const start = i + match[0].length;
    let end = start,
      depth = 1;
    while (end < s.length && depth) {
      if (s[end] === '(') depth++;
      if (s[end] === ')') depth--;
      if (depth) end++;
    }
    if (depth) fail('Close the radical or absolute value.');
    const { coefficient, degree } = monomial(s.slice(start, end), variable);
    let term: string;
    if (match[1] === 'sqrt') {
      if (coefficient.sign() < 0) fail('A real square root needs a nonnegative radicand.');
      if (domain === 'real' && degree % 2)
        fail('This radical is not real on the full stated domain.');
      const halfDegree = domain === 'real' ? degree / 2 : degree;
      const factor = domain === 'real' && sign < 0 && halfDegree % 2 ? -1 : 1;
      term = `(${factor})*sqrt(${coefficient.rational().toString()})*${domain === 'nonnegative' ? 'radicalRoot' : variable}^${halfDegree}`;
    } else {
      const factor = coefficient.sign() < 0 ? -1 : 1;
      term = `(${factor * (domain === 'real' && sign < 0 && degree % 2 ? -1 : 1)})*(${s.slice(start, end)})`;
    }
    result += '(' + term + ')';
    i = end + 1;
  }
  if (domain === 'nonnegative')
    result = result.replace(new RegExp('\\b' + variable + '\\b', 'g'), '(radicalRoot^2)');
  return parseExpression(result, [domain === 'nonnegative' ? 'radicalRoot' : variable]);
}
export function elementaryEquivalent(
  actual: string,
  expected: string,
  variable: string,
  domain: 'real' | 'nonnegative',
): boolean {
  const signs: (1 | -1)[] = domain === 'real' ? [1, -1] : [1];
  return signs
    .map((sign) => {
      const a = elementaryExpression(actual, variable, domain, sign),
        b = elementaryExpression(expected, variable, domain, sign);
      return a.eq(b) && sameExpressionDomain(a, b);
    })
    .every(Boolean);
}
const responseText = (a: StructuredResponse, f: string) =>
  typeof a[f] === 'string' ? (a[f] as string) : fail('Enter the requested formula.');
export function checkElementary(r: AssessmentRequirement, a: StructuredResponse): boolean {
  return elementaryEquivalent(
    responseText(a, r.fields[0]),
    r.params.expected as string,
    r.params.variable as string,
    (r.params.domain || 'real') as 'real' | 'nonnegative',
  );
}
export function checkSquareInverse(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const [lower, upper, left, right, formula] = r.fields;
  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\\infty|∞/g, 'infinity')
      .replace(/^\+/, '');
  const lo = normalize(responseText(a, lower)),
    hi = normalize(responseText(a, upper));
  const isZero = (s: string) => {
    if (s.includes('infinity')) return false;
    return parseExpression(s).exact().isZero();
  };
  // Parse the formula regardless of the branch selection, so malformed input never records an attempt.
  const plus = elementaryEquivalent(responseText(a, formula), 'sqrt(y)', 'y', 'nonnegative');
  const minus = elementaryEquivalent(responseText(a, formula), '-sqrt(y)', 'y', 'nonnegative');
  const lowerZero = isZero(lo),
    upperZero = isZero(hi);
  return (
    (lowerZero && hi === 'infinity' && a[left] === true && a[right] === false && plus) ||
    (lo === '-infinity' && upperZero && a[left] === false && a[right] === true && minus)
  );
}
export function validateElementary(r: AssessmentRequirement): void {
  if (r.validator === 'square-inverse') {
    if (r.fields.length !== 5)
      throw Error('A square inverse needs the interval and inverse formula.');
    return;
  }
  if (
    r.fields.length !== 1 ||
    typeof r.params.expected !== 'string' ||
    typeof r.params.variable !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_]*$/.test(r.params.variable) ||
    !['real', 'nonnegative'].includes(String(r.params.domain || 'real'))
  )
    throw Error('Invalid elementary formula definition.');
  elementaryEquivalent(
    r.params.expected,
    r.params.expected,
    r.params.variable,
    (r.params.domain || 'real') as 'real' | 'nonnegative',
  );
}
