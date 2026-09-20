import { Exact, Expression, gcd, sameExpressionDomain, type Poly } from './exact';
export type Comparison = { op: string; left: Expression; right: Expression };
function difference(n: Comparison): { op: string; value: Expression } {
  let { op, left, right } = n;
  if (op === '>') {
    op = '<';
    [left, right] = [right, left];
  }
  if (op === '>=') {
    op = '<=';
    [left, right] = [right, left];
  }
  return { op, value: left.add(right.neg()) };
}
function integerNormalize(n: { op: string; value: Expression }): { op: string; value: Expression } {
  if (!['<', '<='].includes(n.op) || [...n.value.den.keys()].some((k) => k !== '')) return n;
  const den = n.value.den.get('') || Exact.rational(1);
  let coefficients: Map<string, bigint>;
  try {
    coefficients = new Map([...n.value.num].map(([k, v]) => [k, v.div(den).integer()]));
  } catch {
    return n;
  }
  let factor = 0n;
  for (const [k, c] of coefficients) if (k) factor = gcd(factor, c);
  if (!factor) return n;
  const threshold = -(coefficients.get('') || 0n) - (n.op === '<' ? 1n : 0n);
  const floor = threshold >= 0n ? threshold / factor : -((-threshold + factor - 1n) / factor);
  const poly: Poly = new Map(
    [...coefficients].filter(([k]) => k !== '').map(([k, c]) => [k, Exact.rational(c / factor)]),
  );
  if (floor) poly.set('', Exact.rational(-floor));
  return {
    op: '<=',
    value: new Expression(
      poly,
      n.value.den.size ? new Map([['', Exact.rational(1)]]) : undefined,
      n.value.exclusions,
    ),
  };
}
/** Comparisons are canonicalized algebraically; integer strictness is exact. */
export function comparisonEqual(a: Comparison, b: Comparison, integerDomain: boolean): boolean {
  let x = difference(a),
    y = difference(b);
  if (integerDomain) {
    x = integerNormalize(x);
    y = integerNormalize(y);
  }
  if (x.op !== y.op || !sameExpressionDomain(x.value, y.value)) return false;
  if (x.value.eq(y.value)) return true;
  if ((x.op === '=' || x.op === '!=') && x.value.eq(y.value.neg())) return true;
  // Scaling a whole inequality by a positive constant preserves its solution set.
  const xterm = [...x.value.num].find(([k]) => y.value.num.has(k));
  if (!xterm) return false;
  const ratio = xterm[1].div(y.value.num.get(xterm[0])!);
  return (
    (x.op === '=' || x.op === '!=' || ratio.sign() > 0) &&
    x.value.eq(y.value.mul(Expression.exact(ratio)))
  );
}
