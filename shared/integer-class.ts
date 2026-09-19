import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { Exact, InputError, gcd, parseExact, parseExpression } from './exact';
type Class = { modulus: bigint; residue: bigint } | null;
const mod = (n: bigint, m: bigint) => ((n % m) + m) % m;
function affine(
  source: string,
  variables: string[],
): { coefficients: bigint[]; constant: bigint } | null {
  const p = parseExpression(source, variables);
  if (
    [...p.den.keys()].some((k) => k !== '') ||
    p.exclusions.some((d) => [...d.keys()].some((k) => k !== '')) ||
    [...p.num.keys()].some((k) => k !== '' && !variables.some((v) => k === v + ':1'))
  )
    return null;
  const denominator = p.den.get('') || Exact.rational(1);
  try {
    return {
      coefficients: variables.map((v) =>
        (p.num.get(v + ':1') || Exact.rational(0)).div(denominator).integer(),
      ),
      constant: (p.num.get('') || Exact.rational(0)).div(denominator).integer(),
    };
  } catch (e) {
    if (e instanceof InputError) return null;
    throw e;
  }
}
function congruence(a: bigint, b: bigint, m: bigint): Class {
  m = m < 0n ? -m : m;
  if (m === 0n) throw new InputError('Use a nonzero integer divisor.');
  const g = gcd(a, m);
  if (b % g !== 0n) return null;
  m /= g;
  if (m === 1n) return { modulus: 1n, residue: 0n };
  a = mod(a / g, m);
  b = -b / g;
  let oldR = a,
    r = m,
    oldT = 1n,
    t = 0n;
  while (r) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldT, t] = [t, oldT - q * t];
  }
  return { modulus: m, residue: mod(oldT * b, m) };
}
function parseClass(source: string): Class {
  if (source.length > 4096) throw new InputError('Use a shorter integer set description.');
  let s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\mathbb\{([ZNQR])\}/g, ' $1 ')
    .replace(/\\in\b|∈/g, ' in ')
    .replace(/\\exists\b|∃/g, 'exists ')
    .replace(/\\mid\b|\bdivides\b/g, '|')
    .replace(/\\([{}])/g, '$1')
    .replace(/\\(?:,|;|quad|qquad| )/g, ' ')
    .trim();
  // The standard affine-lattice notation 4Z+2 is equivalent to its set builder.
  if (!s.startsWith('{') && /Z/.test(s)) {
    const p = affine(s.replace(/Z/g, 'integerIndex'), ['integerIndex']);
    if (!p || !p.coefficients[0]) return null;
    const m = p.coefficients[0] < 0n ? -p.coefficients[0] : p.coefficients[0];
    return { modulus: m, residue: mod(p.constant, m) };
  }
  if (!s.startsWith('{') || !s.endsWith('}'))
    throw new InputError('Use set-builder notation, for example {5k : k in Z}.');
  s = s.slice(1, -1).trim();
  let split = s.indexOf(':');
  if (split < 0) split = s.indexOf('|');
  if (split < 0)
    throw new InputError('Separate the set expression and its integer condition with a colon.');
  const left = s.slice(0, split).trim(),
    right = s.slice(split + 1).trim();
  const image = /^([A-Za-z][A-Za-z0-9_]*)\s+in\s+([ZNQR])$/.exec(right);
  if (image) {
    const p = affine(left, [image[1]]);
    if (image[2] !== 'Z' || !p || !p.coefficients[0]) return null;
    const m = p.coefficients[0] < 0n ? -p.coefficients[0] : p.coefficients[0];
    return { modulus: m, residue: mod(p.constant, m) };
  }
  const declaration = /^([A-Za-z][A-Za-z0-9_]*)\s+in\s+([ZNQR])$/.exec(left);
  if (!declaration) throw new InputError('State the integer domain, such as n in Z.');
  if (declaration[2] !== 'Z') return null;
  const variable = declaration[1];
  const exists = /^exists\s+([A-Za-z][A-Za-z0-9_]*)\s+in\s+([ZNQR])\s*[,.:]\s*(.+)$/.exec(right);
  if (exists) {
    if (exists[2] !== 'Z') return null;
    const pair = exists[3].split('=');
    if (pair.length !== 2) throw new InputError('Use one equality for the integer witness.');
    const p = affine(`(${pair[0]})-(${pair[1]})`, [variable, exists[1]]);
    if (!p) return null;
    return congruence(p.coefficients[0], p.constant, p.coefficients[1]);
  }
  const divisor = right.split('|');
  if (divisor.length === 2) {
    const m = parseExact(divisor[0]).integer(),
      p = affine(divisor[1], [variable]);
    return p ? congruence(p.coefficients[0], p.constant, m) : null;
  }
  const congruent =
    /^(.*?)\s*(?:≡|\\equiv)\s*(.*?)\s*(?:\\pmod\{([^{}]+)\}|\(\s*mod\s+([^()]+)\))$/.exec(right);
  if (congruent) {
    const p = affine(`(${congruent[1]})-(${congruent[2]})`, [variable]),
      m = parseExact(congruent[3] || congruent[4]).integer();
    return p ? congruence(p.coefficients[0], p.constant, m) : null;
  }
  throw new InputError(
    'Use an affine integer set builder, divisibility condition, or an integer-witness equality.',
  );
}
export function checkIntegerClass(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const value = a[r.fields[0]];
  if (typeof value !== 'string') throw new InputError('Enter the integer set description.');
  const actual = parseClass(value),
    modulus = parseExact(r.params.modulus as string).integer(),
    residue = parseExact(r.params.residue as string).integer();
  return actual !== null && actual.modulus === modulus && actual.residue === mod(residue, modulus);
}
export function validateIntegerClass(r: AssessmentRequirement): void {
  if (
    r.fields.length !== 1 ||
    typeof r.params.modulus !== 'string' ||
    typeof r.params.residue !== 'string' ||
    parseExact(r.params.modulus).integer() <= 0n
  )
    throw Error('Invalid integer congruence class.');
  parseExact(r.params.residue).integer();
}
