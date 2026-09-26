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
const constructionKinds = [
  'zero-product',
  'cancellation',
  'nonsymmetric',
  'nonparallel-dependent',
  'changes-angles',
  'determinant-scale',
  'dependent-list-deletion',
  'proper-independent',
  'information-loss',
  'spectral-example',
  'vector-pair',
  'nonnegative-closure',
  'zero-row-not-infinite',
];
function construction(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const kind = r.params.kind;
  const integer = (field: string): bigint | null => {
    const x = parseExact(value(response, field));
    try {
      return x.integer();
    } catch (e) {
      if (e instanceof InputError) return null;
      throw e;
    }
  };
  if (kind === 'vector-pair') {
    const u = vector(value(response, r.fields[0])),
      v = vector(value(response, r.fields[1]));
    if (u.length !== v.length) return false;
    const dot = u.reduce((s, x, i) => s.add(x.mul(v[i])), zero()),
      un = u.reduce((s, x) => s.add(x.mul(x)), zero()),
      vn = v.reduce((s, x) => s.add(x.mul(x)), zero()),
      different = !u.every((x, i) => x.eq(v[i]));
    if (r.params.property === 'unequal-equal-norm') return different && un.eq(vn);
    const positiveParallel = dot.sign() > 0 && matrixRank([u, v]) === 1;
    return r.params.property === 'positive-nonacute'
      ? positiveParallel
      : positiveParallel && different;
  }
  if (kind === 'nonnegative-closure') {
    const v = vector(value(response, r.fields[0])),
      c = parseExact(value(response, r.fields[1]));
    return v.every((x) => x.sign() >= 0) && v.some((x) => x.sign() > 0) && c.sign() < 0;
  }
  if (kind === 'dependent-list-deletion') {
    const a = answerMatrix(value(response, r.fields[0])),
      index = integer(r.fields[1]);
    return (
      index !== null &&
      index >= 1n &&
      index <= BigInt(a.length) &&
      matrixRank(a) < a.length &&
      matrixRank(a.filter((_, i) => i !== Number(index) - 1)) < matrixRank(a)
    );
  }
  if (kind === 'proper-independent') {
    const a = answerMatrix(value(response, r.fields[0])),
      dimension = integer(r.fields[1]);
    return (
      dimension === BigInt(a[0].length) &&
      a.length > 0 &&
      matrixRank(a) === a.length &&
      a.length < a[0].length
    );
  }
  if (kind === 'information-loss') {
    const a = answerMatrix(value(response, r.fields[0])),
      vectors = answerMatrix(value(response, r.fields[1]), true);
    return a[0].length > matrixRank(a) && basis(a, vectors, 'null');
  }
  const values = r.fields.map((f) => answerMatrix(value(response, f))),
    a = values[0],
    m = a.length,
    n = a[0].length;
  const nonzero = (x: Matrix) => x.some((row) => row.some((v) => !v.isZero()));
  const gram = multiply(transpose(a), a);
  switch (r.params.kind) {
    case 'zero-row-not-infinite': {
      if (n < 2 || !a.some((row) => row.every((x) => x.isZero()))) return false;
      const coefficients = a.map((row) => row.slice(0, -1)),
        rank = matrixRank(coefficients);
      return matrixRank(a) > rank || rank === n - 1;
    }
    case 'spectral-example': {
      if (!shape(a, 2, 2)) return false;
      const trace = a[0][0].add(a[1][1]),
        det = a[0][0].mul(a[1][1]).sub(a[0][1].mul(a[1][0])),
        disc = trace.mul(trace).sub(Exact.rational(4).mul(det)),
        scalar = a[0][1].isZero() && a[1][0].isZero() && a[0][0].eq(a[1][1]);
      switch (r.params.property) {
        case 'repeated-diagonalizable':
          return scalar;
        case 'no-real-eigenvalue':
          return disc.sign() < 0;
        case 'nonorthogonal-eigenbasis':
          return scalar || (disc.sign() > 0 && !equal(a, transpose(a)));
        case 'unit-spectrum-not-identity':
          return trace.eq(Exact.rational(2)) && det.eq(one()) && !equal(a, identity(2));
        default:
          throw Error('Unknown spectral example.');
      }
    }
    case 'zero-product':
      return (
        values.every((x) => shape(x, 2, 2)) &&
        nonzero(a) &&
        nonzero(values[1]) &&
        !nonzero(values[2]) &&
        equal(multiply(a, values[1]), values[2])
      );
    case 'cancellation':
      return (
        m === n &&
        values.every((x) => shape(x, m, n)) &&
        !equal(values[1], values[2]) &&
        equal(multiply(a, values[1]), multiply(a, values[2]))
      );
    case 'nonsymmetric':
      return m === n && !equal(a, transpose(a));
    case 'nonparallel-dependent':
      return (
        shape(a, 3, 2) &&
        a.every((v, i) => a.every((w, j) => i >= j || !v[0].mul(w[1]).sub(v[1].mul(w[0])).isZero()))
      );
    case 'changes-angles':
      return (
        n >= 2 &&
        !equal(
          gram,
          identity(n).map((row) => row.map((x) => x.mul(gram[0][0]))),
        )
      );
    case 'determinant-scale': {
      if (!shape(a, 2, 2)) return false;
      const det = a[0][0].mul(a[1][1]).sub(a[0][1].mul(a[1][0]));
      const abs = det.sign() < 0 ? det.neg() : det;
      return (
        abs.eq(parseExact(r.params.determinantAbs as string)) &&
        !equal(
          gram,
          identity(2).map((row) =>
            row.map((x) => x.mul(parseExact(r.params.scaleSquared as string))),
          ),
        )
      );
    }
    default:
      throw Error('Unknown matrix construction.');
  }
}
export function validateLinearRequirement(r: AssessmentRequirement): void {
  const p = r.params;
  if (constructionKinds.includes(String(p.kind))) {
    if (
      r.fields.length !==
      (['zero-product', 'cancellation'].includes(String(p.kind))
        ? 3
        : [
              'dependent-list-deletion',
              'proper-independent',
              'information-loss',
              'vector-pair',
              'nonnegative-closure',
            ].includes(String(p.kind))
          ? 2
          : 1)
    )
      throw Error('Invalid matrix construction fields.');
    if (
      p.kind === 'spectral-example' &&
      ![
        'repeated-diagonalizable',
        'no-real-eigenvalue',
        'nonorthogonal-eigenbasis',
        'unit-spectrum-not-identity',
      ].includes(String(p.property))
    )
      throw Error('Unknown spectral example.');
    if (
      p.kind === 'vector-pair' &&
      !['positive-nonacute', 'unequal-cosine-one', 'unequal-equal-norm'].includes(
        String(p.property),
      )
    )
      throw Error('Unknown vector-pair property.');
    if (
      p.kind === 'determinant-scale' &&
      (typeof p.determinantAbs !== 'string' ||
        typeof p.scaleSquared !== 'string' ||
        parseExact(p.determinantAbs).sign() < 0 ||
        parseExact(p.scaleSquared).sign() < 0)
    )
      throw Error('Invalid determinant/scale condition.');
    return;
  }
  const a = numericMatrix(p.a);
  if (
    !['basis', 'affine-family', 'eigenvector', 'eigenpairs', 'svd', 'best-rank'].includes(
      String(p.kind),
    )
  )
    throw Error('Unknown linear algebra property.');
  const count =
    p.kind === 'svd'
      ? 3
      : p.kind === 'affine-family'
        ? p.freeVariables
          ? 3
          : 2
        : p.kind === 'eigenpairs' && p.checks
          ? 2
          : 1;
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
  if (p.kind === 'eigenpairs') {
    if (
      a.length !== a[0].length ||
      !Array.isArray(p.eigenvalues) ||
      !p.eigenvalues.length ||
      p.eigenvalues.length > a.length ||
      p.eigenvalues.some((v) => typeof v !== 'string')
    )
      throw Error('Invalid eigenvalue list.');
    const values = (p.eigenvalues as string[]).map(parseExact);
    if (values.some((x, i) => values.some((y, j) => j < i && x.eq(y))))
      throw Error('Duplicate eigenvalue.');
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
  if (constructionKinds.includes(String(r.params.kind))) return construction(r, response);
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
      const b = (p.b as string[]).map(parseExact),
        directions = answerMatrix(value(response, r.fields[1]), true),
        point = value(response, r.fields[0]).trim();
      const rawFree = response[r.fields[2]],
        free = p.freeVariables
          ? (Array.isArray(rawFree)
              ? rawFree
              : typeof rawFree === 'string' && /^(?:\{\}|\[\]|none)$/i.test(rawFree.trim())
                ? []
                : splitValues(value(response, r.fields[2]))
            ).map(parseExact)
          : [];
      if (
        /^(?:none|\\(?:varnothing|emptyset)|\\text\{none\})$/i.test(point.replace(/^\$|\$$/g, ''))
      )
        return (
          !directions.length &&
          !free.length &&
          matrixRank(a.map((row, i) => [...row, b[i]])) > matrixRank(a)
        );
      const v = vector(point);
      if (
        v.length !== n ||
        !a.every((row, i) => row.reduce((sum, x, j) => sum.add(x.mul(v[j])), zero()).eq(b[i])) ||
        !basis(a, directions, 'null')
      )
        return false;
      if (!p.freeVariables) return true;
      const indices: number[] = [];
      for (const x of free) {
        let index: bigint;
        try {
          index = x.integer();
        } catch (e) {
          if (e instanceof InputError) return false;
          throw e;
        }
        if (index < 1n || index > BigInt(n) || indices.includes(Number(index) - 1)) return false;
        indices.push(Number(index) - 1);
      }
      return (
        indices.length === directions.length &&
        matrixRank(directions.map((row) => indices.map((i) => row[i]))) === directions.length
      );
    }
    case 'eigenpairs': {
      const pairs = answerMatrix(value(response, r.fields[0])),
        expected = (p.eigenvalues as string[]).map(parseExact),
        checks = p.checks ? answerMatrix(value(response, r.fields[1])) : [];
      if (
        !shape(pairs, expected.length, n + 1) ||
        expected.some((lambda) => pairs.filter((row) => row[0].eq(lambda)).length !== 1)
      )
        return false;
      if (p.checks && !shape(checks, pairs.length, n)) return false;
      return pairs.every((row, index) => {
        const lambda = row[0],
          v = row.slice(1);
        if (!v.some((x) => !x.isZero())) return false;
        const residual = a.map((r, i) =>
          r.reduce((sum, x, j) => sum.add(x.mul(v[j])), zero()).sub(lambda.mul(v[i])),
        );
        if (
          residual.some((x) => !x.isZero()) ||
          (p.checks && !residual.every((x, i) => x.eq(checks[index][i])))
        )
          return false;
        return (
          !p.orthogonal ||
          pairs.every(
            (other, j) =>
              j >= index || v.reduce((sum, x, i) => sum.add(x.mul(other[i + 1])), zero()).isZero(),
          )
        );
      });
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
      if (p.form === 'compact' && matrixRank(a) === 0)
        return r.fields.every((f) => answerMatrix(value(response, f), true).length === 0);
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
