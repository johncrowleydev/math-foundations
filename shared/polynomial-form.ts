import { InputError, cleanMath, parseExact, parseExpression } from './exact';
type Node = { op: string; text: string; variable: boolean; children: Node[] };
const node = (op: string, text: string, children: Node[] = [], variable = false): Node => ({
  op,
  text,
  children,
  variable: variable || children.some((c) => c.variable),
});
function syntax(source: string, variables: string[]): Node {
  const s = cleanMath(source),
    tokens: string[] = [];
  const re = /\s+|(?:\d+(?:\.\d*)?|\.\d+)|\\[A-Za-z]+|[A-Za-z][A-Za-z_0-9]*|[()+\-*/^!,]/gy;
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) throw new InputError('Check the polynomial syntax.');
    pos = re.lastIndex;
    if (!/^\s+$/.test(m[0])) tokens.push(m[0]);
    if (tokens.length > 1024) throw new InputError('Use a shorter polynomial.');
  }
  let at = 0,
    depth = 0;
  const peek = () => tokens[at],
    take = (s: string) => {
      if (peek() === s) {
        at++;
        return true;
      }
      return false;
    };
  const group = (): Node => {
    if (!take('(')) throw new InputError('Use parentheses.');
    const x = sum();
    if (!take(')')) throw new InputError('Close the parentheses.');
    return x;
  };
  const binary = (op: string, a: Node, b: Node) =>
    node(op, '(' + a.text + op + b.text + ')', [a, b]);
  const primary = (): Node => {
    if (++depth > 64) throw new InputError('The polynomial is nested too deeply.');
    const t = peek();
    let n: Node;
    if (t === '(') n = group();
    else if (t && (/^(?:\d|\.)/.test(t) || variables.includes(t))) {
      at++;
      n = node('atom', t, [], variables.includes(t));
    } else if (t === '\\frac') {
      at++;
      n = binary('/', group(), group());
    } else if (t === 'sqrt' || t === '\\sqrt') {
      at++;
      const a = group();
      n = node('call', 'sqrt(' + a.text + ')', [a]);
    } else if (t === '\\binom') {
      at++;
      const a = group(),
        b = group();
      n = node('call', 'binom(' + a.text + ',' + b.text + ')', [a, b]);
    } else if (t === 'binom' || t === 'choose') {
      at++;
      if (!take('(')) throw new InputError('Use binom(n,k).');
      const a = sum();
      if (!take(',')) throw new InputError('Separate binomial arguments.');
      const b = sum();
      if (!take(')')) throw new InputError('Close binomial arguments.');
      n = node('call', 'binom(' + a.text + ',' + b.text + ')', [a, b]);
    } else throw new InputError('Use polynomial arithmetic in the stated variables.');
    depth--;
    return n;
  };
  const power = (): Node => {
    let n = primary();
    while (take('!')) n = node('call', '(' + n.text + ')!', [n]);
    if (take('^')) n = binary('^', n, unary());
    return n;
  };
  const unary = (): Node =>
    take('+')
      ? unary()
      : take('-')
        ? (() => {
            const n = unary();
            return node('neg', '(-' + n.text + ')', [n]);
          })()
        : power();
  const starts = () =>
    !!peek() &&
    (peek() === '(' ||
      /^(?:\d|\.)/.test(peek()) ||
      variables.includes(peek()) ||
      ['\\frac', 'sqrt', '\\sqrt', 'binom', 'choose', '\\binom'].includes(peek()));
  const product = (): Node => {
    let n = unary();
    while (true) {
      if (take('*')) n = binary('*', n, unary());
      else if (take('/')) n = binary('/', n, unary());
      else if (starts()) n = binary('*', n, unary());
      else break;
    }
    return n;
  };
  const sum = (): Node => {
    let n = product();
    while (peek() === '+' || peek() === '-') {
      const op = tokens[at++];
      n = binary(op, n, product());
    }
    return n;
  };
  const result = sum();
  if (at !== tokens.length) throw new InputError('Check the polynomial syntax.');
  return result;
}
export function validatePolynomialForm(form: unknown, factorDegree: unknown): void {
  if (form !== undefined && form !== 'expanded' && form !== 'factored')
    throw Error('Unknown requested polynomial form.');
  if (
    factorDegree !== undefined &&
    (form !== 'factored' ||
      !Number.isInteger(factorDegree) ||
      Number(factorDegree) < 1 ||
      Number(factorDegree) > 100)
  )
    throw Error('Invalid factor degree.');
}
export function polynomialForm(
  source: string,
  variables: string[],
  form: string,
  factorDegree?: number,
): boolean {
  parseExpression(source, variables);
  const root = syntax(source, variables);
  const monomial = (n: Node): boolean => {
    if (!n.variable) return true;
    const [a, b] = n.children;
    switch (n.op) {
      case 'atom':
        return true;
      case 'neg':
        return monomial(a);
      case '*':
        return monomial(a) && monomial(b);
      case '/':
        return !b.variable && monomial(a);
      case '^':
        return !b.variable && parseExact(b.text).integer() >= 0n && monomial(a);
      default:
        return false;
    }
  };
  const expanded = (n: Node): boolean =>
    n.op === '+' || n.op === '-' ? n.children.every(expanded) : monomial(n);
  if (form === 'expanded') return expanded(root);
  const factors = (n: Node): number => {
    if (!n.variable) return 0;
    const [a, b] = n.children;
    if (n.op === 'neg') return factors(a);
    if (n.op === '*') {
      const x = factors(a),
        y = factors(b);
      return x < 0 || y < 0 ? -1 : x + y;
    }
    if (n.op === '/') return b.variable ? -1 : factors(a);
    if (n.op === '^') {
      if (b.variable) return -1;
      const power = Number(parseExact(b.text).integer());
      const count = factors(a);
      return power > 0 && count >= 0 ? count * power : -1;
    }
    const p = parseExpression(n.text, variables);
    if (
      [...p.den.keys()].some((k) => k !== '') ||
      p.exclusions.some((q) => [...q.keys()].some((k) => k !== ''))
    )
      return -1;
    const degree = Math.max(
      0,
      ...[...p.num.keys()].map((k) =>
        k ? k.split('|').reduce((s, v) => s + Number(v.split(':')[1]), 0) : 0,
      ),
    );
    return degree > 0 && (factorDegree === undefined || degree <= factorDegree) ? 1 : -1;
  };
  return factors(root) >= 2;
}
