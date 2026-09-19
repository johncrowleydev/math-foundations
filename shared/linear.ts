import { Exact, InputError, parseExact } from './exact';
import { parseMatrix, splitValues } from './math-input';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
type Matrix = Exact[][];
const zero = () => Exact.rational(0),
  one = () => Exact.rational(1);
const shape = (a: Matrix, m: number, n: number) =>
  a.length === m && a.every((row) => row.length === n);
const transpose = (a: Matrix): Matrix => a[0]?.map((_, j) => a.map((row) => row[j])) || [];
const equal = (a: Matrix, b: Matrix) =>
  a.length === b.length &&
  a.every((r, i) => r.length === b[i].length && r.every((v, j) => v.eq(b[i][j])));
const identity = (n: number): Matrix =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? one() : zero())),
  );
const multiply = (a: Matrix, b: Matrix): Matrix =>
  a.map((row) => b[0].map((_, j) => row.reduce((s, x, k) => s.add(x.mul(b[k][j])), zero())));
export function matrixRank(a: Matrix): number {
  const b = a.map((row) => [...row]);
  let rank = 0;
  for (let c = 0; c < (b[0]?.length || 0) && rank < b.length; c++) {
    let pivot = rank;
    while (pivot < b.length && b[pivot][c].isZero()) pivot++;
    if (pivot === b.length) continue;
    [b[rank], b[pivot]] = [b[pivot], b[rank]];
    for (let r = rank + 1; r < b.length; r++) {
      if (b[r][c].isZero()) continue;
      const factor = b[r][c].div(b[rank][c]);
      for (let j = c; j < b[r].length; j++) b[r][j] = b[r][j].sub(factor.mul(b[rank][j]));
    }
    rank++;
  }
  return rank;
}
const numericMatrix = (raw: unknown): Matrix => {
  if (
    !Array.isArray(raw) ||
    !raw.length ||
    raw.length > 16 ||
    raw.some(
      (row) =>
        !Array.isArray(row) ||
        !row.length ||
        row.length > 16 ||
        row.length !== raw[0].length ||
        row.some((v) => typeof v !== 'string'),
    )
  )
    throw Error('Use a rectangular authored matrix with at most 16 rows and columns.');
  return raw.map((row) => (row as string[]).map(parseExact));
};
const value = (a: StructuredResponse, f: string): string => {
  if (typeof a[f] !== 'string' || !a[f].trim())
    throw new InputError('Enter the requested matrix or vector.');
  return a[f];
};
const answerMatrix = (s: string, empty = false): Matrix => {
  if (empty && /^(?:\{\}|\[\]|\\(?:varnothing|emptyset)|∅)$/.test(s.trim())) return [];
  const a = parseMatrix(s);
  if (a.length > 16 || a[0].length > 16) throw new InputError('Use at most 16 rows and columns.');
  return a;
};
const vector = (s: string): Exact[] => splitValues(s).map(parseExact);
const isNullVector = (a: Matrix, v: Exact[]) =>
  a.every((row) => row.reduce((sum, x, i) => sum.add(x.mul(v[i])), zero()).isZero());
function basis(a: Matrix, b: Matrix, space: string, originalColumns = false): boolean {
  const m = a.length,
    n = a[0].length,
    dimension = space === 'column' ? m : n,
    target = space === 'column' ? transpose(a) : a;
  if (b.some((v) => v.length !== dimension) || matrixRank(b) !== b.length) return false;
  if (space === 'null') return b.length === n - matrixRank(a) && b.every((v) => isNullVector(a, v));
  if (b.length !== matrixRank(a) || matrixRank([...target, ...b]) !== b.length) return false;
  return (
    !originalColumns || b.every((v) => transpose(a).some((w) => v.every((x, i) => x.eq(w[i]))))
  );
}
export function validateLinearRequirement(r: AssessmentRequirement): void {
  const p = r.params;
  const a = numericMatrix(p.a);
  if (!['basis', 'affine-family', 'eigenvector', 'svd', 'best-rank'].includes(String(p.kind)))
    throw Error('Unknown linear algebra property.');
  const count = p.kind === 'svd' ? 3 : p.kind === 'affine-family' ? 2 : 1;
  if (r.fields.length !== count) throw Error('Invalid linear algebra fields.');
  if (p.kind === 'basis' && !['column', 'row', 'null'].includes(String(p.space)))
    throw Error('Unknown basis space.');
  if (p.originalColumns === true && p.space !== 'column')
    throw Error('Original-column selection requires column space.');
  if (p.kind === 'affine-family') {
    if (!Array.isArray(p.b) || p.b.length !== a.length || p.b.some((v) => typeof v !== 'string'))
      throw Error('Invalid right-hand side.');
    (p.b as string[]).forEach(parseExact);
  }
  if (p.kind === 'eigenvector') {
    if (a.length !== a[0].length || typeof p.lambda !== 'string')
      throw Error('An eigenvector needs a square matrix and eigenvalue.');
    parseExact(p.lambda);
  }
  if (p.kind === 'svd') {
    if (
      (p.form && !['full', 'thin', 'compact'].includes(String(p.form))) ||
      (p.order && p.order !== 'descending')
    )
      throw Error('Unknown SVD convention.');
  }
  if (p.kind === 'best-rank') {
    if (
      !Number.isInteger(p.rank) ||
      Number(p.rank) < 0 ||
      Number(p.rank) > Math.min(a.length, a[0].length) ||
      typeof p.errorSquared !== 'string' ||
      parseExact(p.errorSquared).sign() < 0
    )
      throw Error('Invalid approximation definition.');
  }
}
export function linearRequirement(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const p = r.params,
    a = numericMatrix(p.a),
    m = a.length,
    n = a[0].length;
  switch (p.kind) {
    case 'basis':
      return basis(
        a,
        answerMatrix(value(response, r.fields[0]), true),
        String(p.space),
        p.originalColumns === true,
      );
    case 'affine-family': {
      const v = vector(value(response, r.fields[0])),
        directions = answerMatrix(value(response, r.fields[1]), true),
        b = (p.b as string[]).map(parseExact);
      return (
        v.length === n &&
        a.every((row, i) => row.reduce((sum, x, j) => sum.add(x.mul(v[j])), zero()).eq(b[i])) &&
        basis(a, directions, 'null')
      );
    }
    case 'eigenvector': {
      const v = vector(value(response, r.fields[0])),
        lambda = parseExact(p.lambda as string);
      return (
        v.length === n &&
        v.some((x) => !x.isZero()) &&
        a.every((row, i) =>
          row.reduce((sum, x, j) => sum.add(x.mul(v[j])), zero()).eq(lambda.mul(v[i])),
        )
      );
    }
    case 'svd': {
      const u = answerMatrix(value(response, r.fields[0])),
        s = answerMatrix(value(response, r.fields[1])),
        v = answerMatrix(value(response, r.fields[2]));
      const form = p.form || 'full',
        k = form === 'compact' ? matrixRank(a) : Math.min(m, n),
        uc = form === 'full' ? m : k,
        vc = form === 'full' ? n : k;
      if (!shape(u, m, uc) || !shape(v, n, vc) || !shape(s, uc, vc)) return false;
      if (
        !equal(multiply(transpose(u), u), identity(uc)) ||
        !equal(multiply(transpose(v), v), identity(vc))
      )
        return false;
      for (let i = 0; i < uc; i++)
        for (let j = 0; j < vc; j++)
          if ((i !== j && !s[i][j].isZero()) || (i === j && s[i][j].sign() < 0)) return false;
      if (p.order === 'descending')
        for (let i = 1; i < Math.min(uc, vc); i++)
          if (s[i - 1][i - 1].sub(s[i][i]).sign() < 0) return false;
      return equal(multiply(multiply(u, s), transpose(v)), a);
    }
    case 'best-rank': {
      const b = answerMatrix(value(response, r.fields[0]));
      if (!shape(b, m, n) || matrixRank(b) > Number(p.rank)) return false;
      let error = zero();
      for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++) {
          const d = a[i][j].sub(b[i][j]);
          error = error.add(d.mul(d));
        }
      return error.eq(parseExact(p.errorSquared as string));
    }
    default:
      throw Error('Unknown linear algebra validator.');
  }
}
