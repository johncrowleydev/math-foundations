import {
  Exact,
  Expression,
  InputError,
  cleanMath,
  parseExact,
  parseExpression,
  peq,
  pmul,
  sameExpressionDomain,
  type Poly,
} from './exact';

export type ExpressionOptions = {
  variables: string[];
  integerVariables?: string[];
  positiveVariables?: string[];
  functions?: string[];
  domain?: string[];
};
const fail = (s: string): never => {
  throw new InputError(s);
};
const powers = (key: string): Record<string, number> =>
  Object.fromEntries(
    key
      ? key.split('|').map((s) => {
          const [v, n] = s.split(':');
          return [v, Number(n)];
        })
      : [],
  );
const monomial = (p: Record<string, number>) =>
  Object.entries(p)
    .filter(([, n]) => n)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([v, n]) => v + ':' + n)
    .join('|');
const integer = (x: Exact): number => {
  const n = x.integer();
  if (n < -100n || n > 100n)
    fail('Use affine exponents with integer coefficients from -100 to 100.');
  return Number(n);
};
function factor(n: bigint): Map<bigint, number> {
  if (n < 1n || n > 1_000_000_000_000n)
    fail('Use a nonzero rational base with numerator and denominator at most 1000000000000.');
  const result = new Map<bigint, number>();
  for (let p = 2n; p * p <= n; p += p === 2n ? 1n : 2n) {
    let count = 0;
    while (n % p === 0n) {
      n /= p;
      count++;
    }
    if (count) result.set(p, count);
  }
  if (n > 1n) result.set(n, 1);
  if (result.size > 8) fail('The exponential base has too many prime factors.');
  return result;
}
export function hasExtendedExpression(options: ExpressionOptions): boolean {
  return !!(
    options.integerVariables?.length ||
    options.positiveVariables?.length ||
    options.functions?.length
  );
}
function validateOptions(o: ExpressionOptions) {
  if (o.variables.some((v) => v.startsWith('DETX')))
    throw Error('Reserved deterministic variable prefix.');
  for (const list of [o.integerVariables || [], o.positiveVariables || []])
    if (list.some((v) => !o.variables.includes(v)))
      throw Error('Expression domains must name declared variables.');
  if ((o.functions || []).some((f) => f !== 'log2' && f !== 'floor'))
    throw Error('Unsupported expression function.');
}
class Transform {
  readonly atoms = new Set<string>();
  readonly parity = new Set<string>();
  readonly nonzero = new Set<string>();
  readonly floors = new Map<string, string>();
  readonly logs = new Map<string, string>();
  constructor(readonly options: ExpressionOptions) {
    validateOptions(options);
    for (const v of options.positiveVariables || []) this.nonzero.add(v);
  }
  atom(kind: 'e' | 'p' | 'l' | 'f', variable: string, prime?: bigint): string {
    const floorSource = this.floors.get(variable),
      source = floorSource || variable;
    const name =
      'DETX' +
      kind +
      (prime === undefined ? '' : String(prime)) +
      (floorSource ? 'f' : 'v') +
      this.options.variables.indexOf(source);
    this.atoms.add(name);
    if (kind === 'p') this.parity.add(name);
    if (kind === 'e' || kind === 'p') this.nonzero.add(name);
    if (kind === 'f') this.floors.set(name, variable);
    if (kind === 'l') this.logs.set(name, variable);
    return name;
  }
  floored(source: string): string {
    if (!this.options.functions?.includes('floor')) fail('Floor is not supported for this answer.');
    const p = parseExpression(source, [...this.options.variables, ...this.atoms]);
    if (p.exclusions.some((q) => [...q.keys()].some((k) => k !== '')))
      fail('Use floor(log2(n)) for a stated positive variable.');
    for (const [symbol, v] of this.logs)
      if (p.eq(Expression.variable(symbol))) return this.atom('f', v);
    return fail('Use floor(log2(n)) for a stated positive variable.');
  }
  exponential(base: string, exponent: string): string {
    let constant: Exact | undefined;
    try {
      constant = parseExact(exponent);
    } catch (e) {
      if (!(e instanceof InputError)) throw e;
    }
    if (constant) {
      integer(constant);
      return '(' + base + ')^(' + exponent + ')';
    }
    const b = parseExact(base).rational();
    const e = parseExpression(exponent, [...this.options.variables, ...this.floors.keys()]),
      den = e.den.get('');
    if (e.den.size !== 1 || !den || e.exclusions.some((p) => [...p.keys()].some((k) => k !== '')))
      fail('Use an affine integer exponent.');
    const coefficients = new Map<string, number>();
    let offset = 0;
    for (const [key, c] of e.num) {
      const n = integer(c.div(den!));
      if (!key) {
        offset = n;
        continue;
      }
      const p = powers(key),
        entries = Object.entries(p);
      if (
        entries.length !== 1 ||
        entries[0][1] !== 1 ||
        (!this.options.integerVariables?.includes(entries[0][0]) && !this.floors.has(entries[0][0]))
      )
        fail('Declare integer variables and use an affine integer exponent.');
      coefficients.set(entries[0][0], n);
    }
    if (!b.n) {
      let minimum = offset;
      for (const [v, n] of coefficients) {
        if (n < 0 || !this.options.positiveVariables?.includes(v))
          fail('A zero base needs an exponent positive throughout the stated domain.');
        minimum += n;
      }
      if (minimum <= 0)
        fail('A zero base needs an exponent positive throughout the stated domain.');
      return '0';
    }
    const factors = factor(b.n < 0n ? -b.n : b.n);
    for (const [p, n] of factor(b.d)) factors.set(p, (factors.get(p) || 0) - n);
    const terms = ['(' + b.toString() + ')^(' + offset + ')'];
    for (const [v, n] of coefficients) {
      for (const [prime, power] of factors)
        if (power * n) terms.push(this.atom('e', v, prime) + '^(' + power * n + ')');
      if (b.n < 0n && Math.abs(n) % 2) terms.push(this.atom('p', v));
    }
    return '(' + terms.join('*') + ')';
  }
  logarithm(source: string): string {
    if (!this.options.functions?.includes('log2'))
      fail('Logarithms are not supported for this answer.');
    const p = parseExpression(source, this.options.variables);
    if (p.num.size !== 1 || p.den.size !== 1) fail('Use log2 of a positive monomial.');
    for (const q of [p.num, p.den, ...p.exclusions])
      for (const key of q.keys())
        for (const v of Object.keys(powers(key)))
          if (!this.options.positiveVariables?.includes(v))
            fail('Logarithm variables must have a stated positive domain.');
    const [[nk, nc]] = [...p.num],
      [[dk, dc]] = [...p.den];
    const c = nc.div(dc).rational();
    if (c.n <= 0n) fail('The logarithm needs a positive argument.');
    const twos = (n: bigint): number => {
      let count = 0;
      while (n > 1n && n % 2n === 0n) {
        n /= 2n;
        count++;
      }
      if (n !== 1n) fail('Use a power of two as the logarithm constant.');
      return count;
    };
    const constant = twos(c.n) - twos(c.d),
      exponents = powers(nk);
    for (const [v, n] of Object.entries(powers(dk))) exponents[v] = (exponents[v] || 0) - n;
    const terms = [String(constant)];
    for (const [v, n] of Object.entries(exponents))
      if (n) {
        if (!this.options.positiveVariables?.includes(v))
          fail('Logarithm variables must have a stated positive domain.');
        terms.push(n + '*' + this.atom('l', v));
      }
    return '(' + terms.join('+') + ')';
  }
  parse(source: string): string {
    const s = cleanMath(
      source
        .replace(/\\log_(?:\{2\}|2)/g, 'log2')
        .replace(/\\lfloor/g, 'floor(')
        .replace(/\\rfloor/g, ')'),
    );
    const tokens: string[] = [];
    const re = /\s+|(?:\d+(?:\.\d*)?|\.\d+)|\\[A-Za-z]+|[A-Za-z][A-Za-z_0-9]*|[()+\-*/^!,]/gy;
    let pos = 0;
    while (pos < s.length) {
      re.lastIndex = pos;
      const m = re.exec(s);
      if (!m) fail('Unsupported exponential or logarithm notation.');
      pos = re.lastIndex;
      if (!/^\s+$/.test(m![0])) tokens.push(m![0]);
      if (tokens.length > 1024) fail('Use a shorter expression.');
    }
    let at = 0,
      depth = 0;
    const peek = () => tokens[at];
    const take = (s: string) => {
      if (peek() === s) {
        at++;
        return true;
      }
      return false;
    };
    const group = (): string => {
      if (!take('(')) fail('Use parentheses around the argument.');
      const x = sum();
      if (!take(')')) fail('Close the parentheses.');
      return '(' + x + ')';
    };
    const primary = (): string => {
      if (++depth > 64) fail('Expression is nested too deeply.');
      const t = peek();
      let result: string;
      if (t === '(') result = group();
      else if (t && (/^(?:\d|\.)/.test(t) || this.options.variables.includes(t))) {
        at++;
        result = t;
      } else if (t === '\\frac') {
        at++;
        result = '(' + group() + '/' + group() + ')';
      } else if (t === 'log2') {
        at++;
        result = this.logarithm(peek() === '(' ? group() : primary());
      } else if (t === 'floor') {
        at++;
        result = this.floored(group());
      } else if (t === 'sqrt' || t === '\\sqrt') {
        at++;
        result = 'sqrt' + group();
      } else if (t === '\\binom') {
        at++;
        const a = group(),
          b = group();
        result = 'binom(' + a + ',' + b + ')';
      } else if (t === 'binom' || t === 'choose') {
        at++;
        if (!take('(')) fail('Use binom(n,k).');
        const a = sum();
        if (!take(',')) fail('Separate binomial arguments.');
        const b = sum();
        if (!take(')')) fail('Close binomial arguments.');
        result = 'binom(' + a + ',' + b + ')';
      } else return fail('Use the stated variables and supported arithmetic.');
      depth--;
      return result;
    };
    const power = (): string => {
      let x = primary();
      while (take('!')) x = '(' + x + ')!';
      if (take('^')) x = this.exponential(x, unary());
      return x;
    };
    const unary = (): string => (take('+') ? unary() : take('-') ? '(-' + unary() + ')' : power());
    const starts = () =>
      !!peek() &&
      (peek() === '(' ||
        /^(?:\d|\.)/.test(peek()) ||
        this.options.variables.includes(peek()) ||
        ['\\frac', 'sqrt', '\\sqrt', 'binom', '\\binom', 'choose', 'log2', 'floor'].includes(
          peek(),
        ));
    const product = (): string => {
      let x = unary();
      while (true) {
        if (take('*')) x = '(' + x + '*' + unary() + ')';
        else if (take('/')) x = '(' + x + '/' + unary() + ')';
        else if (starts()) x = '(' + x + '*' + unary() + ')';
        else break;
      }
      return x;
    };
    const sum = (): string => {
      let x = product();
      while (peek() === '+' || peek() === '-') {
        const op = tokens[at++];
        x = '(' + x + op + product() + ')';
      }
      return x;
    };
    const result = sum();
    if (at !== tokens.length) fail('Check the expression syntax.');
    return result;
  }
  normalize(p: Poly): Poly {
    const result: Poly = new Map();
    for (const [key, c] of p) {
      const exponents = powers(key);
      for (const v of this.parity) if (exponents[v]) exponents[v] %= 2;
      const k = monomial(exponents),
        sum = (result.get(k) || Exact.rational(0)).add(c);
      if (sum.isZero()) result.delete(k);
      else result.set(k, sum);
    }
    return result;
  }
  expression(p: Expression): Expression {
    const exclusions = p.exclusions.map((q) => this.normalize(q));
    if (exclusions.some((q) => !q.size)) fail('Division by zero is undefined.');
    return new Expression(
      this.normalize(p.num),
      this.normalize(p.den),
      exclusions.filter(
        (q) =>
          !(
            q.size === 1 && Object.keys(powers([...q.keys()][0])).every((v) => this.nonzero.has(v))
          ),
      ),
    );
  }
}
export function prepareExtendedExpressions(
  sources: string[],
  options: ExpressionOptions,
): Expression[] {
  const transform = new Transform(options),
    normalized = sources.map((s) => transform.parse(s)),
    variables = [...options.variables, ...[...transform.atoms].sort()];
  return normalized.map((s) => transform.expression(parseExpression(s, variables)));
}
export function extendedExpressionEquivalent(
  actual: string,
  expected: string,
  options: ExpressionOptions,
): boolean {
  const transform = new Transform(options),
    sources = [actual, expected, ...(options.domain || [])].map((s) => transform.parse(s)),
    variables = [...options.variables, ...[...transform.atoms].sort()];
  const expressions = sources.map((s) => transform.expression(parseExpression(s, variables))),
    [a, b, ...domain] = expressions;
  return (
    peq(transform.normalize(pmul(a.num, b.den)), transform.normalize(pmul(b.num, a.den))) &&
    sameExpressionDomain(a, b, domain)
  );
}
export function validateExtendedExpression(expected: string, options: ExpressionOptions): void {
  extendedExpressionEquivalent(expected, expected, options);
}
