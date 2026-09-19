import { Exact, InputError, parseExpression } from './exact';
import { parseQuantified, type QNode } from './quantified';
type Interval = { lower: Exact | null; upper: Exact | null; left: boolean; right: boolean };
const full = (): Interval[] => [{ lower: null, upper: null, left: false, right: false }];
const compare = (a: Exact | null, b: Exact | null, infinity: number) =>
  a === null ? (b === null ? 0 : infinity) : b === null ? -infinity : a.sub(b).sign();
function normalize(items: Interval[]): Interval[] {
  const sorted = items
    .filter((i) => {
      if (!i.lower || !i.upper) return true;
      const c = i.lower.sub(i.upper).sign();
      return c < 0 || (c === 0 && i.left && i.right);
    })
    .sort((a, b) => compare(a.lower, b.lower, -1) || Number(b.left) - Number(a.left));
  const result: Interval[] = [];
  for (const item of sorted) {
    const prior = result.at(-1);
    if (!prior) {
      result.push({ ...item });
      continue;
    }
    const gap =
      prior.upper === null ? -1 : item.lower === null ? -1 : item.lower.sub(prior.upper).sign();
    if (gap < 0 || (gap === 0 && (item.left || prior.right))) {
      const c = compare(prior.upper, item.upper, 1);
      if (c < 0) {
        prior.upper = item.upper;
        prior.right = item.right;
      } else if (c === 0) prior.right = prior.right || item.right;
    } else result.push({ ...item });
  }
  return result;
}
function intersection(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const x of a)
    for (const y of b) {
      const l = compare(x.lower, y.lower, -1),
        u = compare(x.upper, y.upper, 1);
      result.push({
        lower: l < 0 ? y.lower : x.lower,
        upper: u > 0 ? y.upper : x.upper,
        left: l === 0 ? x.left && y.left : l < 0 ? y.left : x.left,
        right: u === 0 ? x.right && y.right : u > 0 ? y.right : x.right,
      });
    }
  return normalize(result);
}
function complement(items: Interval[]): Interval[] {
  const sorted = normalize(items);
  if (!sorted.length) return full();
  const result: Interval[] = [];
  let lower: Exact | null = null,
    left = false;
  for (const item of sorted) {
    if (item.lower !== null) result.push({ lower, upper: item.lower, left, right: !item.left });
    lower = item.upper;
    left = !item.right;
    if (lower === null) return result;
  }
  result.push({ lower, upper: null, left, right: false });
  return normalize(result);
}
function solve(n: QNode, variable: string): Interval[] {
  if (n.kind === 'not') return complement(solve(n.body, variable));
  if (n.kind === 'and') return intersection(solve(n.left, variable), solve(n.right, variable));
  if (n.kind === 'or') return normalize([...solve(n.left, variable), ...solve(n.right, variable)]);
  if (n.kind === 'implies')
    return normalize([...complement(solve(n.left, variable)), ...solve(n.right, variable)]);
  if (n.kind === 'iff') {
    const a = solve(n.left, variable),
      b = solve(n.right, variable);
    return normalize([...intersection(a, b), ...intersection(complement(a), complement(b))]);
  }
  if (n.kind !== 'comparison') throw new InputError('Use linear inequalities joined by and/or.');
  const value = parseExpression(n.left, [variable]).add(parseExpression(n.right, [variable]).neg());
  if (
    [...value.den.keys()].some((k) => k !== '') ||
    [...value.num.keys()].some((k) => k !== '' && k !== variable + ':1') ||
    value.exclusions.some((p) => [...p.keys()].some((k) => k !== ''))
  )
    throw new InputError('Use linear inequalities, with constant denominators, joined by and/or.');
  const denominator = value.den.get('') || Exact.rational(1),
    a = (value.num.get(variable + ':1') || Exact.rational(0)).div(denominator),
    c = (value.num.get('') || Exact.rational(0)).div(denominator);
  let op = n.op;
  if (a.isZero()) {
    const sign = c.sign(),
      yes =
        op === '='
          ? sign === 0
          : op === '!='
            ? sign !== 0
            : op === '<'
              ? sign < 0
              : op === '<='
                ? sign <= 0
                : op === '>'
                  ? sign > 0
                  : sign >= 0;
    return yes ? full() : [];
  }
  const root = c.neg().div(a);
  if (a.sign() < 0)
    op = ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as Record<string, string>)[op] || op;
  switch (op) {
    case '<':
    case '<=':
      return [{ lower: null, upper: root, left: false, right: op === '<=' }];
    case '>':
    case '>=':
      return [{ lower: root, upper: null, left: op === '>=', right: false }];
    case '=':
      return [{ lower: root, upper: root, left: true, right: true }];
    case '!=':
      return [
        { lower: null, upper: root, left: false, right: false },
        { lower: root, upper: null, left: false, right: false },
      ];
    default:
      throw new InputError('Use =, !=, <, <=, >, or >=.');
  }
}
export function inequalityEquivalent(actual: string, expected: string, variable: string): boolean {
  const parse = (s: string) => {
    const n = parseQuantified(`forall ${variable} in R (${s})`, ['R'], {});
    if (n.kind !== 'quantifier') throw new InputError('Enter an inequality.');
    return normalize(solve(n.body, variable));
  };
  const a = parse(actual),
    b = parse(expected);
  return (
    a.length === b.length &&
    a.every(
      (x, i) =>
        compare(x.lower, b[i].lower, -1) === 0 &&
        compare(x.upper, b[i].upper, 1) === 0 &&
        x.left === b[i].left &&
        x.right === b[i].right,
    )
  );
}
