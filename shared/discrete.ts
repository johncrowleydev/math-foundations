import { InputError, cleanMath, parseExact } from './exact';
import { splitValues } from './math-input';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
const authoredInteger = (v: unknown): bigint => {
  if (typeof v === 'number' && Number.isSafeInteger(v)) return BigInt(v);
  if (typeof v === 'string') return parseExact(v).integer();
  throw Error('Use an exact integer parameter.');
};
export function validateIntegerList(r: AssessmentRequirement): void {
  const p = r.params;
  if (
    r.fields.length !== 1 ||
    !Number.isInteger(p.length) ||
    Number(p.length) < 1 ||
    Number(p.length) > 64
  )
    throw Error('Invalid integer-list length.');
  for (const k of ['sum', 'min', 'max', 'distinctResiduesMod'])
    if (p[k] !== undefined) authoredInteger(p[k]);
  if (p.min !== undefined && p.max !== undefined && authoredInteger(p.min) > authoredInteger(p.max))
    throw Error('Invalid integer-list bounds.');
  if (p.distinctResiduesMod !== undefined && authoredInteger(p.distinctResiduesMod) <= 0n)
    throw Error('Use a positive modulus.');
}
export function checkIntegerList(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const raw = a[r.fields[0]];
  if (typeof raw !== 'string') throw new InputError('Enter the integer list.');
  const values = splitValues(raw).map(parseExact),
    p = r.params;
  let integers: bigint[];
  try {
    integers = values.map((v) => v.integer());
  } catch (e) {
    if (e instanceof InputError) return false;
    throw e;
  }
  if (integers.length !== p.length) return false;
  if (p.sum !== undefined && integers.reduce((s, v) => s + v, 0n) !== authoredInteger(p.sum))
    return false;
  if (p.min !== undefined && integers.some((v) => v < authoredInteger(p.min))) return false;
  if (p.max !== undefined && integers.some((v) => v > authoredInteger(p.max))) return false;
  if (p.distinctResiduesMod !== undefined) {
    const m = authoredInteger(p.distinctResiduesMod);
    if (new Set(integers.map((v) => ((v % m) + m) % m)).size !== integers.length) return false;
  }
  return true;
}
export function validateBinomialSum(r: AssessmentRequirement): void {
  const terms = r.params.terms;
  if (r.fields.length !== 1 || !Array.isArray(terms) || !terms.length || terms.length > 16)
    throw Error('Invalid binomial decomposition.');
  for (const term of terms) {
    if (!Array.isArray(term) || term.length !== 2) throw Error('Use binomial argument pairs.');
    const [n, k] = term.map(authoredInteger);
    if (n < 0n || n > 1000n || k < 0n || k > n) throw Error('Invalid binomial arguments.');
  }
}
const groupEnd = (s: string, start: number): number => {
  if (s[start] !== '(') return -1;
  let d = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '(') d++;
    if (s[i] === ')') d--;
    if (d === 0) return i;
  }
  return -1;
};
function binomialTerms(source: string): string[] | null {
  let s = source.trim();
  while (s.startsWith('(') && groupEnd(s, 0) === s.length - 1) s = s.slice(1, -1).trim();
  if (s.startsWith('+')) return binomialTerms(s.slice(1));
  let depth = 0,
    start = 0;
  const parts: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    if (s[i] === ')') depth--;
    if (s[i] === '+' && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  if (parts.length) {
    parts.push(s.slice(start));
    const terms = parts.map(binomialTerms);
    return terms.some((t) => t === null) ? null : (terms.flat() as string[]);
  }
  const match = /^(\\binom|binom|choose)\s*/.exec(s);
  if (!match) return null;
  let at = match[0].length,
    end = groupEnd(s, at);
  if (end < 0) return null;
  let args: string[];
  if (match[1] === '\\binom') {
    const first = s.slice(at + 1, end);
    at = end + 1;
    while (s[at] === ' ') at++;
    end = groupEnd(s, at);
    if (end < 0) return null;
    args = [first, s.slice(at + 1, end)];
  } else args = splitValues(s.slice(at + 1, end));
  if (s.slice(end + 1).trim() || args.length !== 2) return null;
  return [args.map((s) => parseExact(s).integer().toString()).join(',')];
}
export function checkBinomialSum(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const raw = a[r.fields[0]];
  if (typeof raw !== 'string') throw new InputError('Enter the requested binomial sum.');
  parseExact(raw);
  const actual = binomialTerms(cleanMath(raw));
  if (!actual) return false;
  const expected = (r.params.terms as unknown[][]).map((pair) =>
    pair.map(authoredInteger).join(','),
  );
  return actual.sort().join('|') === expected.sort().join('|');
}
