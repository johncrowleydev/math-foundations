import { InputError, cleanMath, parseExpression, sameExpressionDomain } from './exact';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
type RecurrenceParams = { expected: string; sequence: string; variable: string; maxLag: number };
function transform(source: string, p: RecurrenceParams): string {
  if (/\brecurrenceLag[0-9]+\b/.test(source)) throw new InputError('Use the stated sequence name.');
  if (source.length > 4096) throw new InputError('Use a shorter recurrence.');
  source = source.replace(
    new RegExp('\\b' + p.sequence + '_\\{([^{}]+)\\}', 'g'),
    p.sequence + '($1)',
  );
  const s = cleanMath(source),
    call = new RegExp('^' + p.sequence + '\\s*\\(');
  let result = '';
  for (let i = 0; i < s.length;) {
    const match = call.exec(s.slice(i));
    if (!match || (i > 0 && /[A-Za-z_0-9]/.test(s[i - 1]))) {
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
    if (depth) throw new InputError('Close the recurrence argument.');
    const arg = parseExpression(s.slice(start, end), [p.variable]);
    if (arg.exclusions.some((q) => [...q.keys()].some((k) => k !== '')))
      throw new InputError('Use an earlier sequence index such as F(n-1).');
    const offset = arg
      .add(parseExpression(p.variable, [p.variable]).neg())
      .exact()
      .integer();
    if (offset >= 0n || offset < -BigInt(p.maxLag))
      throw new InputError('Use lags from 1 to ' + p.maxLag + '.');
    result += 'recurrenceLag' + -offset;
    i = end + 1;
  }
  return result;
}
export function validateRecurrence(r: AssessmentRequirement): void {
  const p = r.params as unknown as RecurrenceParams;
  if (
    r.fields.length !== 1 ||
    typeof p.expected !== 'string' ||
    !Number.isInteger(p.maxLag) ||
    p.maxLag < 1 ||
    p.maxLag > 8 ||
    !/[A-Za-z]/.test(p.sequence) ||
    !/^[_A-Za-z][_A-Za-z0-9]*$/.test(p.sequence) ||
    !/^[_A-Za-z][_A-Za-z0-9]*$/.test(p.variable) ||
    p.sequence === p.variable ||
    p.variable.startsWith('recurrenceLag')
  )
    throw Error('Invalid recurrence definition.');
  recurrenceEquivalent(p.expected, p.expected, p);
}
export function recurrenceEquivalent(
  actual: string,
  expected: string,
  p: RecurrenceParams,
): boolean {
  const variables = [
    p.variable,
    ...Array.from({ length: p.maxLag }, (_, i) => 'recurrenceLag' + (i + 1)),
  ];
  const a = parseExpression(transform(actual, p), variables),
    b = parseExpression(transform(expected, p), variables);
  return a.eq(b) && sameExpressionDomain(a, b);
}
export function checkRecurrence(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const value = a[r.fields[0]];
  if (typeof value !== 'string')
    throw new InputError('Enter the right-hand side of the recurrence.');
  return recurrenceEquivalent(
    value,
    String(r.params.expected),
    r.params as unknown as RecurrenceParams,
  );
}
