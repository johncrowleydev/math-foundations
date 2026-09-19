/** Bounded exact arithmetic. No floating point comparisons participate in grading. */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}
const fail = (s: string): never => {
  throw new InputError(s);
};
export const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
export class Rational {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (!d) fail('Division by zero is undefined.');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
    if (this.n.toString(2).length > 8192 || this.d.toString(2).length > 8192)
      fail('This number is too large. Use a shorter equivalent expression.');
  }
  add(b: Rational) {
    return new Rational(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  mul(b: Rational) {
    return new Rational(this.n * b.n, this.d * b.d);
  }
  div(b: Rational) {
    return new Rational(this.n * b.d, this.d * b.n);
  }
  neg() {
    return new Rational(-this.n, this.d);
  }
  eq(b: Rational) {
    return this.n === b.n && this.d === b.d;
  }
  sign() {
    return this.n < 0n ? -1 : this.n > 0n ? 1 : 0;
  }
  toString() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
  static parse(s: string) {
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))
      return fail('Enter a number, fraction, or arithmetic expression.');
    const [a, b = ''] = s.split('.');
    return new Rational(BigInt((a || '0') + b), 10n ** BigInt(b.length));
  }
}
type Surd = Map<bigint, Rational>;
const sconstant = (r: Rational): Surd => (r.n ? new Map([[1n, r]]) : new Map());
const sadd = (a: Surd, b: Surd): Surd => {
  const r = new Map(a);
  for (const [d, c] of b) {
    const v = (r.get(d) || new Rational(0)).add(c);
    if (v.n) r.set(d, v);
    else r.delete(d);
  }
  if (r.size > 256) fail('This radical expression is too large.');
  return r;
};
const sneg = (a: Surd): Surd => new Map([...a].map(([d, c]) => [d, c.neg()]));
const smul = (a: Surd, b: Surd): Surd => {
  let r: Surd = new Map();
  for (const [d, c] of a)
    for (const [e, f] of b) {
      const g = gcd(d, e);
      r = sadd(r, new Map([[(d / g) * (e / g), c.mul(f).mul(new Rational(g))]]));
    }
  return r;
};
const seq = (a: Surd, b: Surd) => a.size === b.size && [...a].every(([d, c]) => b.get(d)?.eq(c));
const isqrt = (n: bigint) => {
  if (n < 0n) fail('A real square root needs a nonnegative value.');
  if (n < 2n) return n;
  let x = n,
    y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
};
function ssign(a: Surd): number {
  if (!a.size) return 0;
  // Distinct squarefree radicals are Q-linearly independent. Certified rational
  // bounds refine until the sign is determined; never guess near zero.
  for (let bits = 8; bits <= 8192; bits *= 2) {
    const scale = 1n << BigInt(bits);
    let lo = new Rational(0),
      hi = new Rational(0);
    for (const [d, c] of a) {
      const k = isqrt(d * scale * scale);
      const l = new Rational(k, scale),
        u = new Rational(k * k === d * scale * scale ? k : k + 1n, scale);
      lo = lo.add(c.mul(c.n < 0n ? u : l));
      hi = hi.add(c.mul(c.n < 0n ? l : u));
    }
    if (lo.sign() > 0) return 1;
    if (hi.sign() < 0) return -1;
  }
  return fail('This radical comparison exceeds the supported exact bounds.');
}
export class Exact {
  constructor(
    readonly num: Surd,
    readonly den: Surd = sconstant(new Rational(1)),
  ) {
    if (!den.size) fail('Division by zero is undefined.');
  }
  static rational(n: bigint | number, d: bigint | number = 1n) {
    return new Exact(sconstant(new Rational(n, d)));
  }
  static from(r: Rational) {
    return new Exact(sconstant(r));
  }
  add(b: Exact) {
    return new Exact(sadd(smul(this.num, b.den), smul(b.num, this.den)), smul(this.den, b.den));
  }
  neg() {
    return new Exact(sneg(this.num), this.den);
  }
  sub(b: Exact) {
    return this.add(b.neg());
  }
  mul(b: Exact) {
    return new Exact(smul(this.num, b.num), smul(this.den, b.den));
  }
  div(b: Exact) {
    return new Exact(smul(this.num, b.den), smul(this.den, b.num));
  }
  eq(b: Exact) {
    return seq(smul(this.num, b.den), smul(b.num, this.den));
  }
  isZero() {
    return this.num.size === 0;
  }
  sign() {
    return ssign(this.num) * ssign(this.den);
  }
  rational(): Rational {
    if (!this.num.size) return new Rational(0);
    if (this.num.size === this.den.size) {
      const [d, c] = [...this.den][0];
      const value = this.num.get(d);
      if (value) {
        const ratio = value.div(c);
        if ([...this.den].every(([k, v]) => this.num.get(k)?.eq(v.mul(ratio)))) return ratio;
      }
    }
    return fail('Use a rational value here.');
  }
  integer(): bigint {
    const r = this.rational();
    if (r.d !== 1n) fail('An integer is required here.');
    return r.n;
  }
  pow(n: number): Exact {
    if (!Number.isInteger(n) || Math.abs(n) > 100)
      fail('Use an integer exponent between −100 and 100.');
    let x: Exact = this,
      r = Exact.rational(1),
      k = Math.abs(n);
    while (k) {
      if (k % 2) r = r.mul(x);
      x = x.mul(x);
      k = Math.floor(k / 2);
    }
    return n < 0 ? Exact.rational(1).div(r) : r;
  }
  sqrt(): Exact {
    const r = this.rational();
    if (r.n < 0n) fail('A real square root needs a nonnegative value.');
    if (!r.n) return Exact.rational(0);
    let n = r.n * r.d;
    if (n > 1_000_000_000_000n) fail('Use a square root with a smaller radicand.');
    let outside = 1n,
      inside = 1n,
      primes = 0;
    for (let p = 2n; p * p <= n; p += p === 2n ? 1n : 2n) {
      let count = 0;
      while (n % p === 0n) {
        n /= p;
        count++;
      }
      outside *= p ** BigInt(Math.floor(count / 2));
      if (count % 2) {
        inside *= p;
        primes++;
      }
    }
    if (n > 1n) {
      inside *= n;
      primes++;
    }
    if (primes > 8) fail('This radical has too many independent factors.');
    return new Exact(new Map([[inside, new Rational(outside, r.d)]]));
  }
  key(): string {
    return (
      [...this.num]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([d, c]) => `${c}sqrt${d}`)
        .join('+') +
      '/' +
      [...this.den]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([d, c]) => `${c}sqrt${d}`)
        .join('+')
    );
  }
}
export type Poly = Map<string, Exact>;
const mono = (powers: Record<string, number>) =>
  Object.entries(powers)
    .filter(([, n]) => n)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([v, n]) => `${v}:${n}`)
    .join('|');
const powers = (s: string): Record<string, number> =>
  Object.fromEntries(
    s
      ? s.split('|').map((p) => {
          const i = p.lastIndexOf(':');
          return [p.slice(0, i), Number(p.slice(i + 1))];
        })
      : [],
  );
export const pconst = (x: Exact): Poly => (x.isZero() ? new Map() : new Map([['', x]]));
export const padd = (a: Poly, b: Poly): Poly => {
  const r = new Map(a);
  for (const [k, c] of b) {
    const v = (r.get(k) || Exact.rational(0)).add(c);
    if (v.isZero()) r.delete(k);
    else r.set(k, v);
  }
  if (r.size > 4096) fail('This expression has too many terms.');
  return r;
};
export const pneg = (a: Poly): Poly => new Map([...a].map(([k, c]) => [k, c.neg()]));
export const pmul = (a: Poly, b: Poly): Poly => {
  let r: Poly = new Map();
  for (const [k, c] of a)
    for (const [l, d] of b) {
      const p = powers(k);
      for (const [v, n] of Object.entries(powers(l))) p[v] = (p[v] || 0) + n;
      if (Object.values(p).reduce((s, n) => s + n, 0) > 100)
        fail('The degree exceeds the supported bound.');
      r = padd(r, new Map([[mono(p), c.mul(d)]]));
    }
  return r;
};
export const peq = (a: Poly, b: Poly) =>
  a.size === b.size && [...a].every(([k, c]) => b.get(k)?.eq(c));
const ppow = (a: Poly, n: number): Poly => {
  let r = pconst(Exact.rational(1));
  for (let i = 0; i < n; i++) r = pmul(r, a);
  return r;
};
export class Expression {
  constructor(
    readonly num: Poly,
    readonly den: Poly = pconst(Exact.rational(1)),
    readonly exclusions: Poly[] = [],
  ) {
    if (!den.size) fail('Division by zero is undefined.');
  }
  static exact(x: Exact) {
    return new Expression(pconst(x));
  }
  static variable(name: string) {
    return new Expression(new Map([[mono({ [name]: 1 }), Exact.rational(1)]]));
  }
  add(b: Expression) {
    return new Expression(
      padd(pmul(this.num, b.den), pmul(b.num, this.den)),
      pmul(this.den, b.den),
      [...this.exclusions, ...b.exclusions],
    );
  }
  neg() {
    return new Expression(pneg(this.num), this.den, this.exclusions);
  }
  mul(b: Expression) {
    return new Expression(pmul(this.num, b.num), pmul(this.den, b.den), [
      ...this.exclusions,
      ...b.exclusions,
    ]);
  }
  div(b: Expression) {
    return new Expression(pmul(this.num, b.den), pmul(this.den, b.num), [
      ...this.exclusions,
      ...b.exclusions,
      b.num,
    ]);
  }
  eq(b: Expression) {
    return peq(pmul(this.num, b.den), pmul(b.num, this.den));
  }
  exact(): Exact {
    if ([...this.num.keys(), ...this.den.keys()].some((k) => k !== ''))
      fail('Enter a numerical value without variables.');
    return (this.num.get('') || Exact.rational(0)).div(this.den.get('') || Exact.rational(0));
  }
  pow(n: number): Expression {
    if (!Number.isInteger(n) || Math.abs(n) > 100)
      fail('Use an integer exponent between −100 and 100.');
    return n < 0
      ? new Expression(ppow(this.den, -n), ppow(this.num, -n), [...this.exclusions, this.num])
      : new Expression(ppow(this.num, n), ppow(this.den, n), this.exclusions);
  }
}
export function cleanMath(source: string): string {
  if (source.length > 4096) fail('Use an expression shorter than 4096 characters.');
  return source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:,|;|!|quad|qquad| )/g, ' ')
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/\\(?:cdot|times)\b/g, '*')
    .replace(/\\(?:dfrac|tfrac)\b/g, '\\frac')
    .replace(/\\operatorname\{(sqrt|binom|choose)\}/g, '$1')
    .replace(/√/g, 'sqrt')
    .replace(/\\lambda\b|λ/g, 'lambda')
    .replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'));
}
type Token = { value: string; pos: number };
export function parseExpression(source: string, variables: string[] = []): Expression {
  const s = cleanMath(source);
  const tokens: Token[] = [];
  const re = /\s+|(?:\d+(?:\.\d*)?|\.\d+)|\\[A-Za-z]+|[A-Za-z][A-Za-z_0-9]*|[()+\-*/^!,]/gy;
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m)
      fail(
        `Unsupported notation near “${s.slice(pos, pos + 12)}”. Use numbers, fractions, parentheses, powers, sqrt, factorial or binom.`,
      );
    pos = re.lastIndex;
    if (!/^\s+$/.test(m![0])) tokens.push({ value: m![0], pos: m!.index });
    if (tokens.length > 1024) fail('This expression has too many tokens.');
  }
  let at = 0,
    depth = 0;
  const peek = () => tokens[at]?.value;
  const take = (x: string) => {
    if (peek() === x) {
      at++;
      return true;
    }
    return false;
  };
  const group = (): Expression => {
    if (!take('(')) fail('Use parentheses around the argument.');
    const x = sum();
    if (!take(')')) fail('Close the parentheses.');
    return x;
  };
  const integer = (x: Expression) => {
    const n = x.exact().integer();
    if (n < 0n || n > 1000n)
      fail('Factorial and binomial arguments must be integers from 0 to 1000.');
    return n;
  };
  const factorial = (n: bigint) => {
    let v = 1n;
    for (let i = 2n; i <= n; i++) v *= i;
    return v;
  };
  const primary = (): Expression => {
    if (++depth > 64) fail('This expression is nested too deeply.');
    let x: Expression;
    const t = peek();
    if (t === '(') x = group();
    else if (t && /^(?:\d|\.)/.test(t)) {
      at++;
      x = Expression.exact(Exact.from(Rational.parse(t)));
    } else if (t === 'sqrt' || t === '\\sqrt') {
      at++;
      x = Expression.exact(group().exact().sqrt());
    } else if (t === '\\frac') {
      at++;
      const a = group(),
        b = group();
      x = a.div(b);
    } else if (t === 'binom' || t === 'choose' || t === '\\binom') {
      at++;
      let a: bigint, b: bigint;
      if (t === '\\binom') {
        a = integer(group());
        b = integer(group());
      } else {
        if (!take('(')) fail('Use binom(n,k).');
        a = integer(sum());
        if (!take(',')) fail('Separate the binomial arguments with a comma.');
        b = integer(sum());
        if (!take(')')) fail('Close the binomial parentheses.');
      }
      x = Expression.exact(
        Exact.rational(b > a ? 0n : factorial(a) / (factorial(b) * factorial(a - b))),
      );
    } else if (t && variables.includes(t)) {
      at++;
      x = Expression.variable(t);
    } else
      fail(
        t
          ? `“${t}” is not supported here. ${variables.length ? 'Use variables ' + variables.join(', ') + '.' : 'Enter a numerical expression.'}`
          : 'Enter an answer.',
      );
    depth--;
    return x!;
  };
  const power = (): Expression => {
    let x = primary();
    while (take('!')) x = Expression.exact(Exact.rational(factorial(integer(x))));
    if (take('^')) {
      const n = unary().exact().integer();
      if (n < -100n || n > 100n) fail('Use an integer exponent between −100 and 100.');
      x = x.pow(Number(n));
    }
    return x;
  };
  const unary = (): Expression => (take('+') ? unary() : take('-') ? unary().neg() : power());
  const starts = () => {
    const t = peek();
    return (
      !!t &&
      (t === '(' ||
        t === '\\frac' ||
        t === '\\sqrt' ||
        t === 'sqrt' ||
        t === 'binom' ||
        t === '\\binom' ||
        t === 'choose' ||
        /^(?:\d|\.)/.test(t) ||
        variables.includes(t))
    );
  };
  const product = (): Expression => {
    let x = unary();
    while (true) {
      if (take('*')) x = x.mul(unary());
      else if (take('/')) x = x.div(unary());
      else if (starts()) x = x.mul(unary());
      else break;
    }
    return x;
  };
  const sum = (): Expression => {
    let x = product();
    while (true) {
      if (take('+')) x = x.add(product());
      else if (take('-')) x = x.add(product().neg());
      else break;
    }
    return x;
  };
  const result = sum();
  if (at !== tokens.length) fail(`Unexpected “${peek()}”. Check the expression syntax.`);
  return result;
}
export const parseExact = (s: string) => parseExpression(s).exact();

const leading = (p: Poly): [string, Exact] | undefined =>
  [...p].sort(([a], [b]) => {
    const pa = powers(a),
      pb = powers(b),
      da = Object.values(pa).reduce((s, n) => s + n, 0),
      db = Object.values(pb).reduce((s, n) => s + n, 0);
    if (da !== db) return db - da;
    for (const v of [...new Set([...Object.keys(pa), ...Object.keys(pb)])].sort()) {
      if ((pa[v] || 0) !== (pb[v] || 0)) return (pb[v] || 0) - (pa[v] || 0);
    }
    return 0;
  })[0];
function divides(divisor: Poly, dividend: Poly): boolean {
  const d = leading(divisor);
  if (!d) return false;
  let remain = new Map(dividend);
  const dp = powers(d[0]);
  for (let steps = 0; remain.size; steps++) {
    if (steps > 4096) fail('This expression exceeds the supported normalization bound.');
    const r = leading(remain)!;
    const rp = powers(r[0]);
    const quotient: Record<string, number> = {};
    for (const v of new Set([...Object.keys(rp), ...Object.keys(dp)])) {
      const n = (rp[v] || 0) - (dp[v] || 0);
      if (n < 0) return false;
      quotient[v] = n;
    }
    remain = padd(remain, pneg(pmul(divisor, new Map([[mono(quotient), r[1].div(d[1])]]))));
  }
  return true;
}
/** Compare excluded zero sets algebraically, including canceled factors. */
export function sameExpressionDomain(
  a: Expression,
  b: Expression,
  domain: Expression[] = [],
): boolean {
  const restrictions = domain.map((d) => d.num);
  const clean = (ps: Poly[]) => ps.filter((p) => [...p.keys()].some((k) => k !== ''));
  const left = clean([...a.exclusions, ...restrictions]),
    right = clean([...b.exclusions, ...restrictions]);
  const covers = (from: Poly[], to: Poly[]) =>
    from.every((f) => {
      if (to.some((g) => divides(f, g))) return true;
      if (!to.length) return false;
      const product = to.reduce(pmul, pconst(Exact.rational(1)));
      const degree = Math.max(
        ...[...f.keys()].map((k) => Object.values(powers(k)).reduce((s, n) => s + n, 0)),
      );
      let power = pconst(Exact.rational(1));
      for (let n = 1; n <= degree; n++) {
        power = pmul(power, product);
        if (divides(f, power)) return true;
      }
      return false;
    });
  return covers(left, right) && covers(right, left);
}
