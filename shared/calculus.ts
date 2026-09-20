/** Bounded symbolic calculus. Exact polynomial arithmetic proves equivalence;
 * numerical probes are deliberately never used as a correctness criterion. */
import { cleanMath, Exact, Expression, InputError, parseExact, Rational } from './exact';
import type { AssessmentRequirement, StructuredResponse } from './assessment';

type Node = { op: string; args: Node[] };
type Domain = { positive?: string[]; nonnegative?: string[]; nonzero?: string[] };
export type CalculusParams = {
  variables?: string[];
  variable?: string;
  expected?: string;
  integrand?: string;
  mode?: 'family' | 'particular' | 'initial-value';
  initial?: { at: string; value: string };
  domain?: Domain;
};
const fail = (s: string): never => {
  throw new InputError(s);
};
const n = (op: string, ...args: Node[]): Node => ({ op, args });
const zero = () => n('0');
const one = () => n('1');
const functions = [
  'sin',
  'cos',
  'tan',
  'sec',
  'csc',
  'cot',
  'asin',
  'acos',
  'atan',
  'exp',
  'ln',
  'sqrt',
  'abs',
];
function parse(source: string, variables: string[]): Node {
  if (typeof source !== 'string' || !source.trim() || source.length > 2048)
    fail('Enter a calculus expression of at most 2048 characters.');
  const s = cleanMath(source)
    .replace(/\\(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|ln|exp|sqrt|pi)\b/g, ' $1')
    .replace(/arc(sin|cos|tan)\b/g, 'a$1')
    .replace(/\\(?:lvert|rvert)/g, '|')
    .replace(/\|([^|]+)\|/g, 'abs($1)')
    .replace(/π/g, 'pi');
  const tokens: string[] = [];
  const re = /\s+|(?:\d+(?:\.\d*)?|\.\d+)|\\frac|[A-Za-z][A-Za-z_0-9]*|[()+\-*/^]/gy;
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) fail('Use numbers, declared variables, parentheses and supported calculus functions.');
    pos = re.lastIndex;
    if (m![0].trim()) tokens.push(m![0]);
  }
  if (tokens.length > 256) fail('Use a shorter expression (at most 256 tokens).');
  let at = 0,
    depth = 0;
  const peek = () => tokens[at];
  const take = (t: string) => (peek() === t ? (++at, true) : false);
  const group = (): Node => {
    if (!take('(')) fail('Put function arguments in parentheses.');
    const a = sum();
    if (!take(')')) fail('Close the parentheses.');
    return a;
  };
  const primary = (): Node => {
    if (++depth > 24) fail('Use less deeply nested notation.');
    const t = peek();
    let a: Node;
    if (t === '(') a = group();
    else if (t === '\\frac') {
      at++;
      a = n('/', group(), group());
    } else if (functions.includes(t)) {
      at++;
      a = n(t, group());
    } else if (t && (/^(\d|\.)/.test(t) || variables.includes(t) || ['pi', 'e', 'C'].includes(t))) {
      at++;
      a = n(t);
    } else return fail('Use the declared variables and supported calculus functions.');
    depth--;
    return a;
  };
  const power = (): Node => {
    const a = primary();
    return take('^') ? n('^', a, unary()) : a;
  };
  const unary = (): Node => {
    if (++depth > 24) fail('Use less deeply nested notation.');
    const result = take('+') ? unary() : take('-') ? n('*', n('-1'), unary()) : power();
    depth--;
    return result;
  };
  const product = (): Node => {
    let a = unary();
    while (true) {
      if (take('*')) a = n('*', a, unary());
      else if (take('/')) a = n('/', a, unary());
      else if (peek() && (peek() === '(' || /^[A-Za-z\\\d.]/.test(peek()))) a = n('*', a, unary());
      else break;
    }
    return a;
  };
  const sum = (): Node => {
    let a = product();
    while (true) {
      if (take('+')) a = n('+', a, product());
      else if (take('-')) a = n('+', a, n('*', n('-1'), product()));
      else break;
    }
    return a;
  };
  const a = sum();
  if (at !== tokens.length) fail('Check the expression syntax.');
  return a;
}
function constant(a: Node): Rational | undefined {
  if (!a.args.length && /^-?(\d|\.)/.test(a.op)) return parseExact(a.op).rational();
  const [x, y] = a.args.map(constant);
  if (!x) return;
  if (a.op === '+' && y) return x.add(y);
  if (a.op === '*' && y) return x.mul(y);
  if (a.op === '/' && y) return x.div(y);
  if (a.op === '^' && y?.d === 1n && y.n >= -32n && y.n <= 32n)
    return Exact.from(x).pow(Number(y.n)).rational();
}
function derivative(a: Node, variable: string): Node {
  if (!a.args.length) return a.op === variable ? one() : zero();
  const [u, v] = a.args,
    du = derivative(u, variable),
    dv = v && derivative(v, variable);
  const mul = (a: Node, b: Node) => n('*', a, b),
    div = (a: Node, b: Node) => n('/', a, b),
    pow = (a: Node, b: Node) => n('^', a, b);
  switch (a.op) {
    case '+':
      return n('+', du, dv);
    case '*':
      return n('+', mul(du, v), mul(u, dv));
    case '/':
      return div(n('+', mul(du, v), mul(n('-1'), mul(u, dv))), pow(v, n('2')));
    case '^': {
      const c = constant(v);
      return c
        ? mul(mul(v, pow(u, n('+', v, n('-1')))), du)
        : mul(pow(u, v), n('+', mul(dv, n('ln', u)), div(mul(v, du), u)));
    }
    case 'sin':
      return mul(n('cos', u), du);
    case 'cos':
      return mul(n('-1'), mul(n('sin', u), du));
    case 'tan':
      return div(du, pow(n('cos', u), n('2')));
    case 'sec':
      return mul(mul(n('sec', u), n('tan', u)), du);
    case 'csc':
      return mul(n('-1'), mul(mul(n('csc', u), n('cot', u)), du));
    case 'cot':
      return mul(n('-1'), div(du, pow(n('sin', u), n('2'))));
    case 'exp':
      return mul(n('exp', u), du);
    case 'ln':
      return u.op === 'abs' ? div(derivative(u.args[0], variable), u.args[0]) : div(du, u);
    case 'sqrt':
      return div(du, mul(n('2'), n('sqrt', u)));
    case 'abs':
      return mul(div(u, n('abs', u)), du);
    case 'asin':
      return div(du, n('sqrt', n('+', one(), mul(n('-1'), pow(u, n('2'))))));
    case 'acos':
      return mul(n('-1'), div(du, n('sqrt', n('+', one(), mul(n('-1'), pow(u, n('2')))))));
    case 'atan':
      return div(du, n('+', one(), pow(u, n('2'))));
  }
  return fail('This derivative is outside the supported notation.');
}
type Guard = { kind: keyof Domain; node: Node };
class Context {
  atoms: { op: string; argument: Expression; name: string; square?: Expression }[] = [];
  steps = 0;
  norm(a: Node): Expression {
    if (++this.steps > 12000) fail('This expression exceeds the symbolic work limit.');
    const c = constant(a);
    if (c) return Expression.exact(Exact.from(c));
    const [u, v] = a.args;
    if (!u) return Expression.variable(a.op);
    const x = this.norm(u);
    if (a.op === '+') return x.add(this.norm(v));
    if (a.op === '*') return x.mul(this.norm(v));
    if (a.op === '/') return x.div(this.norm(v));
    if (a.op === '^') {
      const exponent = constant(v);
      if (exponent && (exponent.n < -32n * exponent.d || exponent.n > 32n * exponent.d))
        fail('Use powers between -32 and 32.');
      if (exponent?.d === 1n && exponent.n >= -32n && exponent.n <= 32n) {
        const k = Number(exponent.n);
        if (u.op === 'sqrt' && k % 2 === 0) return this.norm(u.args[0]).pow(k / 2);
        if (u.op === 'sin' && Math.abs(k) >= 2 && k % 2 === 0)
          return Expression.exact(Exact.rational(1))
            .add(this.norm(n('^', n('cos', u.args[0]), n('2'))).neg())
            .pow(k / 2);
        return x.pow(k);
      }
      if (exponent && exponent.d === 2n && exponent.n >= -31n && exponent.n <= 31n)
        return this.norm(n('^', n('sqrt', u), n(String(exponent.n))));
      return this.norm(n('exp', n('*', v, n('ln', u))));
    }
    if (a.op === 'tan') return this.norm(n('/', n('sin', u), n('cos', u)));
    if (a.op === 'sec') return this.norm(n('/', one(), n('cos', u)));
    if (a.op === 'csc') return this.norm(n('/', one(), n('sin', u)));
    if (a.op === 'cot') return this.norm(n('/', n('cos', u), n('sin', u)));
    if (a.op === 'exp' && u.op === '+')
      return this.norm(n('*', n('exp', u.args[0]), n('exp', u.args[1])));
    if (a.op === 'exp' && u.op === '*') {
      const left = constant(u.args[0]),
        right = constant(u.args[1]);
      const factor = left || right,
        argument = left ? u.args[1] : u.args[0];
      if (factor?.d === 1n && factor.n >= -32n && factor.n <= 32n)
        return this.norm(n('exp', argument)).pow(Number(factor.n));
    }
    if (a.op === 'ln' && u.op === 'exp') return this.norm(u.args[0]);
    if (a.op === 'exp' && u.op === 'ln') return this.norm(u.args[0]);
    if (a.op === 'ln' && u.op === 'e') return Expression.exact(Exact.rational(1));
    if (a.op === 'sqrt') {
      try {
        return Expression.exact(x.exact().sqrt());
      } catch (e) {
        if (!(e instanceof InputError)) throw e;
      }
    }
    if (a.op === 'abs') {
      try {
        const c = x.exact();
        return Expression.exact(c.sign() < 0 ? c.neg() : c);
      } catch (e) {
        if (!(e instanceof InputError)) throw e;
      }
    }
    if (x.eq(Expression.exact(Exact.rational(0)))) {
      if (['sin', 'tan', 'asin', 'atan'].includes(a.op)) return Expression.exact(Exact.rational(0));
      if (['cos', 'exp'].includes(a.op)) return Expression.exact(Exact.rational(1));
    }
    if (a.op === 'ln' && x.eq(Expression.exact(Exact.rational(1))))
      return Expression.exact(Exact.rational(0));
    const found = this.atoms.find((f) => f.op === a.op && f.argument.eq(x));
    if (found) return Expression.variable(found.name);
    if (this.atoms.length >= 64) fail('Use fewer distinct function arguments.');
    const square =
      a.op === 'sqrt'
        ? x
        : a.op === 'abs'
          ? x.pow(2)
          : a.op === 'sin'
            ? Expression.exact(Exact.rational(1)).add(this.norm(n('cos', u)).pow(2).neg())
            : undefined;
    const name = 'CALC' + this.atoms.length;
    this.atoms.push({ op: a.op, argument: x, name, square });
    return Expression.variable(name);
  }
  equivalent(a: Expression, b: Expression): boolean {
    let difference = a.add(b.neg());
    // Reduce square-root and trigonometric square relations in reverse atom
    // order: each relation contains only earlier atoms, so reduction terminates.
    for (const atom of [...this.atoms].reverse()) {
      if (!atom.square) continue;
      const reduce = (poly: Expression['num']) => {
        let result = Expression.exact(Exact.rational(0));
        for (const [key, coefficient] of poly) {
          let term = Expression.exact(coefficient);
          for (const item of key ? key.split('|') : []) {
            const [name, degree] = item.split(':');
            const power = Number(degree);
            if (name === atom.name) {
              term = term.mul(atom.square!.pow(Math.floor(power / 2)));
              if (power % 2) term = term.mul(Expression.variable(name));
            } else term = term.mul(Expression.variable(name).pow(power));
          }
          result = result.add(term);
        }
        return result;
      };
      difference = reduce(difference.num).div(reduce(difference.den));
    }
    return difference.num.size === 0;
  }
  equal(a: Node, b: Node) {
    return this.equivalent(this.norm(a), this.norm(b));
  }
}
function guards(a: Node, differentiated = false): Guard[] {
  const [u, v] = a.args;
  if (!u) return [];
  const out = a.args.flatMap((x) => guards(x, differentiated));
  const add = (kind: keyof Domain, node: Node) => out.push({ kind, node });
  if (a.op === '/') add('nonzero', v);
  if (a.op === '^') {
    const c = constant(v);
    if (!c || c.d !== 1n)
      add(c?.d === 2n && c.n > 0n && !differentiated ? 'nonnegative' : 'positive', u);
    else if (c.n < 0n) add('nonzero', u);
  }
  if (a.op === 'ln') add('positive', u);
  if (a.op === 'sqrt') add(differentiated ? 'positive' : 'nonnegative', u);
  if (a.op === 'abs' && differentiated) add('nonzero', u);
  if (['tan', 'sec'].includes(a.op)) add('nonzero', n('cos', u));
  if (['cot', 'csc'].includes(a.op)) add('nonzero', n('sin', u));
  if (['asin', 'acos'].includes(a.op))
    add(
      differentiated ? 'positive' : 'nonnegative',
      n('+', one(), n('*', n('-1'), n('^', u, n('2')))),
    );
  return out;
}
function proved(g: Guard, facts: Guard[], ctx: Context, depth = 0): boolean {
  if (depth > 12) return false;
  const [u, v] = g.node.args;
  try {
    const x = ctx.norm(g.node).exact().sign();
    return g.kind === 'positive' ? x > 0 : g.kind === 'nonnegative' ? x >= 0 : x !== 0;
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
  }
  if (facts.some((f) => (f.kind === g.kind || f.kind === 'positive') && ctx.equal(f.node, g.node)))
    return true;
  if (
    g.kind === 'nonzero' &&
    facts.some(
      (f) =>
        (f.kind === 'positive' || f.kind === 'nonzero') &&
        f.node.op === '^' &&
        constant(f.node.args[1])?.n !== 0n &&
        ctx.equal(f.node.args[0], g.node),
    )
  )
    return true;
  if (g.node.op === 'ln') {
    const value = constant(u);
    if (value && value.sign() > 0) {
      const cmp = value.n - value.d;
      return g.kind === 'nonzero' ? cmp !== 0n : g.kind === 'positive' ? cmp > 0n : cmp >= 0n;
    }
  }
  if (g.node.op === 'e' || g.node.op === 'pi' || g.node.op === 'exp') return true;
  const p = (kind: keyof Domain, node: Node) => proved({ kind, node }, facts, ctx, depth + 1);
  if (g.node.op === 'abs') return g.kind === 'nonnegative' || p('nonzero', u);
  if (g.node.op === 'sqrt') return g.kind === 'nonnegative' || p('positive', u);
  if (g.node.op === '*' || g.node.op === '/')
    return g.kind === 'nonzero'
      ? p('nonzero', u) && p('nonzero', v)
      : p(g.kind, u) && p('positive', v);
  if (g.node.op === '+')
    return (
      g.kind !== 'nonzero' &&
      ((p('positive', u) && p('nonnegative', v)) ||
        (p('nonnegative', u) && p('positive', v)) ||
        (g.kind === 'nonnegative' && p('nonnegative', u) && p('nonnegative', v)))
    );
  if (g.node.op === '^') {
    const c = constant(v);
    if (c?.d === 1n) {
      if (c.n % 2n === 0n) return g.kind === 'nonnegative' || p('nonzero', u);
      return p(g.kind, u);
    }
  }
  return false;
}
function checkGuards(items: Guard[], facts: Guard[], ctx: Context) {
  for (const g of items)
    if (!proved(g, facts, ctx))
      fail(
        'This form needs an additional domain restriction. Use a form defined throughout the stated domain.',
      );
}
function substitute(a: Node, variable: string, value: Node): Node {
  return a.op === variable && !a.args.length
    ? value
    : n(a.op, ...a.args.map((x) => substitute(x, variable, value)));
}
function hasC(a: Node): boolean {
  return a.op === 'C' || a.args.some(hasC);
}
function parameters(r: AssessmentRequirement): {
  p: CalculusParams;
  variables: string[];
  facts: Guard[];
} {
  const p = r.params as CalculusParams;
  const variables = r.validator === 'antiderivative' ? [p.variable as string] : p.variables || [];
  if (
    (r.validator === 'antiderivative' ? !variables.length : !Array.isArray(p.variables)) ||
    variables.length > 6 ||
    new Set(variables).size !== variables.length ||
    variables.some(
      (v) =>
        typeof v !== 'string' ||
        !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v) ||
        functions.includes(v) ||
        ['C', 'e', 'pi'].includes(v) ||
        v.startsWith('CALC'),
    ) ||
    r.fields.length !== 1
  )
    fail('Invalid calculus variables or fields.');
  if (
    p.domain &&
    (typeof p.domain !== 'object' ||
      Array.isArray(p.domain) ||
      Object.keys(p.domain).some((k) => !['positive', 'nonnegative', 'nonzero'].includes(k)))
  )
    fail('Invalid calculus domain.');
  const facts: Guard[] = [];
  for (const kind of ['positive', 'nonnegative', 'nonzero'] as const) {
    const xs = p.domain?.[kind] || [];
    if (!Array.isArray(xs) || xs.length > 24) fail('Invalid calculus domain facts.');
    for (const s of xs) {
      const node = parse(s, variables);
      if (hasC(node)) fail('Domain facts cannot contain C.');
      facts.push({ kind, node });
    }
  }
  return { p, variables, facts };
}
export function checkCalculus(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const { p, variables, facts } = parameters(r),
    ctx = new Context(),
    raw = response[r.fields[0]];
  if (typeof raw !== 'string') fail('Enter the requested calculus expression.');
  const answer = parse(raw as string, variables);
  if (r.validator === 'calculus-expression') {
    const expected = parse(p.expected as string, variables);
    if (hasC(answer)) fail('Use only the variables named in the question.');
    // The expected formula defines the natural domain when no narrower one is stated.
    const allowed = [...facts, ...guards(expected)];
    checkGuards(guards(answer), allowed, ctx);
    return ctx.equal(answer, expected);
  }
  const integrand = parse(p.integrand as string, variables),
    variable = variables[0];
  const allowed = [...facts, ...guards(integrand)];
  checkGuards(guards(answer, true), allowed, ctx);
  if (p.mode === 'family') {
    if (!hasC(answer)) return false;
    // Require one freely additive constant, not x*C, C^2 or a cancellable token.
    if (!ctx.equal(derivative(answer, 'C'), one())) return false;
  } else if (hasC(answer)) return false;
  const correct = ctx.equal(derivative(answer, variable), integrand);
  if (p.mode === 'initial-value') {
    const at = parse(p.initial!.at, []),
      target = parse(p.initial!.value, []),
      value = substitute(answer, variable, at);
    checkGuards(
      [
        ...guards(value),
        ...allowed.map((g) => ({ kind: g.kind, node: substitute(g.node, variable, at) })),
      ],
      [],
      ctx,
    );
    return correct && ctx.equal(value, target);
  }
  return correct;
}
export function validateCalculus(r: AssessmentRequirement): void {
  const { p, variables } = parameters(r);
  if (r.validator === 'calculus-expression') {
    const expected = parse(p.expected as string, variables);
    if (hasC(expected)) fail('C is reserved for antiderivative families.');
    new Context().norm(expected);
  } else {
    if (!['family', 'particular', 'initial-value'].includes(p.mode || ''))
      fail('Choose the antiderivative mode.');
    const integrand = parse(p.integrand as string, variables);
    if (hasC(integrand)) fail('The integrand cannot contain C.');
    new Context().norm(integrand);
    if (p.mode === 'initial-value') {
      if (!p.initial) fail('Supply the initial condition.');
      for (const s of [p.initial!.at, p.initial!.value]) {
        const a = parse(s, []);
        if (hasC(a)) fail('Initial conditions must be constants.');
        const ctx = new Context();
        ctx.norm(a);
        checkGuards(guards(a), [], ctx);
      }
    }
  }
}
