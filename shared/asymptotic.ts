import { Exact, InputError, parseExact } from './exact';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
const text = (v: unknown): string => {
  if (typeof v !== 'string') throw Error('Expected an exact expression.');
  return v;
};
const positive = (v: Exact) => v.sign() > 0;
export function validateAsymptotic(r: AssessmentRequirement): void {
  const p = r.params;
  if (
    ![
      'finite-exception',
      'parity-linear-quadratic',
      'positive-polynomial-ratio',
      'n-log-n-plus-n',
    ].includes(text(p.kind))
  )
    throw Error('Unknown asymptotic bound family.');
  if (r.fields.length !== (p.kind === 'parity-linear-quadratic' ? 4 : 3))
    throw Error('Invalid asymptotic bound field count.');
  if (
    p.kind === 'finite-exception' &&
    parseExact(text(p.exceptionValue)).sub(Exact.rational(1)).sign() < 0
  )
    throw Error('The exceptional ratio must be at least one.');
  if (p.kind === 'positive-polynomial-ratio') {
    if (!positive(parseExact(text(p.leading))) || !Array.isArray(p.terms) || p.terms.length > 16)
      throw Error('Invalid positive polynomial ratio.');
    for (const term of p.terms) {
      if (!term || typeof term !== 'object' || Array.isArray(term))
        throw Error('Invalid polynomial term.');
      const t = term as Record<string, unknown>;
      if (
        !Number.isInteger(t.power) ||
        Number(t.power) < 1 ||
        Number(t.power) > 100 ||
        parseExact(text(t.coefficient)).sign() < 0
      )
        throw Error('Use nonnegative tail coefficients and positive integer powers.');
    }
  }
}
export function checkAsymptotic(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const values = r.fields.map((f) => parseExact(text(a[f]))),
    p = r.params,
    one = Exact.rational(1);
  const threshold = (v: Exact): bigint | undefined => {
    try {
      const n = v.integer();
      return n > 0n ? n : undefined;
    } catch (e) {
      if (e instanceof InputError) return undefined;
      throw e;
    }
  };
  if (p.kind === 'parity-linear-quadratic') {
    const [upper, upAt, lower, lowAt] = values;
    return (
      positive(upper) &&
      positive(lower) &&
      threshold(upAt) !== undefined &&
      threshold(lowAt) !== undefined &&
      upper.sub(one).sign() >= 0 &&
      lower.sub(one).sign() <= 0
    );
  }
  const [lower, upper, at] = values,
    n = threshold(at);
  if (!positive(lower) || !positive(upper) || n === undefined) return false;
  let leading = one,
    required = one;
  if (p.kind === 'finite-exception') required = n === 1n ? parseExact(text(p.exceptionValue)) : one;
  else if (p.kind === 'positive-polynomial-ratio') {
    leading = parseExact(text(p.leading));
    required = leading;
    for (const raw of p.terms as Record<string, unknown>[])
      required = required.add(parseExact(text(raw.coefficient)).div(at.pow(Number(raw.power))));
  } else if (p.kind === 'n-log-n-plus-n') {
    if (n <= 1n) return false;
    let power = 1n,
      k = 0n;
    while (power < n) {
      power *= 2n;
      k++;
    }
    required = one.add(one.div(Exact.rational(k)));
  } else throw Error('Unknown asymptotic bound family.');
  return lower.sub(leading).sign() <= 0 && upper.sub(required).sign() >= 0;
}
