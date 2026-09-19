import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { InputError, parseExact } from './exact';
import { extendedExpressionEquivalent, type ExpressionOptions } from './exponential';
export function checkSequencePair(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const variable = r.params.variable as string,
    values = r.fields.map((f) => {
      if (typeof a[f] !== 'string') throw new InputError('Enter both sequence rules.');
      return a[f] as string;
    });
  const options: ExpressionOptions = { variables: [variable], integerVariables: [variable] };
  const identical = extendedExpressionEquivalent(values[0], values[1], options);
  const substitute = (s: string, value: string) =>
    s.replace(new RegExp('\\b' + variable + '\\b', 'g'), `(${value})`);
  if (r.params.kind === 'same-recurrence') {
    const checks = values.map((s) =>
      extendedExpressionEquivalent(
        `(${substitute(s, variable + '+1')})-(${s})`,
        r.params.increment as string,
        options,
      ),
    );
    return !identical && checks.every(Boolean);
  }
  const checks = (r.params.indices as string[]).map((index) => {
    const left = substitute(values[0], index),
      right = substitute(values[1], index);
    return parseExact(left).eq(parseExact(right));
  });
  return !identical && checks.every(Boolean);
}
export function validateSequencePair(r: AssessmentRequirement): void {
  if (
    r.fields.length !== 2 ||
    typeof r.params.variable !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_]*$/.test(r.params.variable) ||
    !['same-recurrence', 'prefix-counterexample'].includes(String(r.params.kind))
  )
    throw Error('Invalid sequence construction.');
  if (r.params.kind === 'same-recurrence') {
    if (typeof r.params.increment !== 'string') throw Error('Missing recurrence increment.');
    parseExact(r.params.increment);
  } else {
    if (
      !Array.isArray(r.params.indices) ||
      !r.params.indices.length ||
      r.params.indices.length > 64 ||
      r.params.indices.some((x) => typeof x !== 'string')
    )
      throw Error('Invalid prefix indices.');
    r.params.indices.forEach((x) => parseExact(x).integer());
  }
}
