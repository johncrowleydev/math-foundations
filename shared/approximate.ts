import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { Exact, InputError, parseExact } from './exact';

function parameters(r: AssessmentRequirement) {
  const p = r.params;
  if (
    r.fields.length !== 1 ||
    Object.keys(p).some((k) => !['expected', 'tolerance', 'minimum', 'maximum'].includes(k))
  )
    throw new Error('Invalid approximate-number parameters.');
  const read = (key: string): Exact => {
    if (typeof p[key] !== 'string') throw new Error(`Expected exact string for ${key}.`);
    return parseExact(p[key]);
  };
  const expected = read('expected'),
    tolerance = read('tolerance');
  const minimum = p.minimum === undefined ? undefined : read('minimum');
  const maximum = p.maximum === undefined ? undefined : read('maximum');
  if (tolerance.sign() <= 0) throw new Error('Approximate-number tolerance must be positive.');
  if (
    (minimum && expected.sub(minimum).sign() < 0) ||
    (maximum && expected.sub(maximum).sign() > 0)
  )
    throw new Error('Approximate-number expected value must lie within its inclusive bounds.');
  return { expected, tolerance, minimum, maximum };
}
export function validateApproximate(r: AssessmentRequirement) {
  parameters(r);
}
export function checkApproximate(r: AssessmentRequirement, response: StructuredResponse) {
  const { expected, tolerance, minimum, maximum } = parameters(r);
  const raw = response[r.fields[0]];
  let value: Exact;
  try {
    if (typeof raw !== 'string') throw new InputError('Expected a numeric answer.');
    value = parseExact(raw);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    throw new InputError(
      'Enter a decimal, fraction, or numeric arithmetic expression in the stated units. Use sqrt for radicals; percent signs, scientific notation, and distribution functions are not supported. ' +
        error.message,
    );
  }
  if ((minimum && value.sub(minimum).sign() < 0) || (maximum && value.sub(maximum).sign() > 0))
    return false;
  const difference = value.sub(expected);
  return difference.sub(tolerance).sign() <= 0 && difference.add(tolerance).sign() >= 0;
}
