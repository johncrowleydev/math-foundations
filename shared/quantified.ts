import { InputError, parseExpression, sameExpressionDomain } from './exact';
import { comparisonEqual, comparisonFromStrings } from './comparison';
export type QNode =
  | {
      kind: 'quantifier';
      quantifier: 'forall' | 'exists';
      variable: string;
      domain: string;
      body: QNode;
    }
  | { kind: 'not'; body: QNode }
  | { kind: 'and' | 'or' | 'implies' | 'iff'; left: QNode; right: QNode }
  | { kind: 'predicate'; name: string; args: string[] }
  | { kind: 'comparison'; op: string; left: string; right: string };
function clean(source: string): string {
  if (source.length > 4096) throw new InputError('Use a shorter quantified formula.');
  return source
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\mathbb\{([NZQRDC])\}/g, ' $1 ')
    .replace(/\\forall\b|∀/g, ' forall ')
    .replace(/\\exists\b|∃/g, ' exists ')
    .replace(/\\in\b|∈/g, ' in ')
    .replace(/\\(?:neg|lnot)\b|¬|~|\bnot\b/g, ' ! ')
    .replace(/\\(?:land|wedge)\b|∧|&&|\band\b/g, ' & ')
    .replace(/\\(?:lor|vee)\b|∨|\|\||\bor\b/g, ' | ')
    .replace(/\\(?:leftrightarrow|iff)\b|↔|<->|<=>/g, ' @ ')
    .replace(/\\(?:to|rightarrow|implies)\b|→|->|=>/g, ' # ')
    .replace(/\\(?:leq|le)\b|≤/g, ' <= ')
    .replace(/\\(?:geq|ge)\b|≥/g, ' >= ')
    .replace(/\\(?:ne|neq)\b|≠/g, ' != ')
    .replace(/\\(?:,|;|!|quad|qquad| )/g, ' ')
    .replace(/[{}\[\]]/g, (m) => (m === '{' || m === '[' ? '(' : ')'))
    .replace(/−/g, '-');
}
export function parseQuantified(
  source: string,
  domains: string[],
  predicates: Record<string, number>,
): QNode {
  const tokens =
    clean(source).match(
      /forall|exists|\bin\b|[A-Za-z][A-Za-z_0-9]*|\d+(?:\.\d+)?|<=|>=|!=|[!&|@#(),.:+*/^=<>-]|\S/g,
    ) || [];
  if (tokens.length > 1024) throw new InputError('Use a shorter quantified formula.');
  let at = 0,
    depth = 0;
  const take = (t: string) => {
    if (tokens[at] === t) {
      at++;
      return true;
    }
    return false;
  };
  const atom = (): QNode => {
    const first = tokens[at];
    if (first && Object.hasOwn(predicates, first) && tokens[at + 1] === '(') {
      at += 2;
      const args: string[] = [];
      let start = at,
        nesting = 0;
      while (at < tokens.length) {
        const t = tokens[at];
        if (t === ')' && nesting === 0) {
          args.push(tokens.slice(start, at).join(' '));
          at++;
          break;
        }
        if (t === ',' && nesting === 0) {
          args.push(tokens.slice(start, at).join(' '));
          start = ++at;
          continue;
        }
        if (t === '(') nesting++;
        if (t === ')') nesting--;
        at++;
      }
      if (args.length !== predicates[first] || args.some((s) => !s.trim()))
        throw new InputError(`Use ${first} with ${predicates[first]} arguments.`);
      return { kind: 'predicate', name: first, args };
    }
    const start = at;
    let nesting = 0;
    while (at < tokens.length) {
      const t = tokens[at];
      if (nesting === 0 && ['&', '|', '#', '@', ')'].includes(t)) break;
      if (t === '(') nesting++;
      if (t === ')') nesting--;
      at++;
    }
    const raw = tokens.slice(start, at);
    const indices = raw
      .map((x, i) => (['<', '<=', '=', '!=', '>', '>='].includes(x) ? i : -1))
      .filter((i) => i >= 0);
    if (indices.length !== 1)
      throw new InputError('Use a predicate or one comparison inside the quantified formula.');
    const i = indices[0];
    return {
      kind: 'comparison',
      op: raw[i],
      left: raw.slice(0, i).join(' '),
      right: raw.slice(i + 1).join(' '),
    };
  };
  const unary = (): QNode => {
    if (++depth > 64) throw new InputError('The formula is nested too deeply.');
    let n: QNode;
    if (tokens[at] === 'forall' || tokens[at] === 'exists') {
      const quantifier = tokens[at++] as 'forall' | 'exists',
        variable = tokens[at++];
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable || ''))
        throw new InputError('Name the quantified variable.');
      if (!take('in'))
        throw new InputError('Include the variable domain, for example “forall n in Z”.');
      const domain = tokens[at++];
      if (!domains.includes(domain))
        throw new InputError('Use a stated domain: ' + domains.join(', ') + '.');
      if (tokens[at] === '.' || tokens[at] === ':' || tokens[at] === ',') at++;
      n = { kind: 'quantifier', quantifier, variable, domain, body: iff() };
    } else if (take('!')) n = { kind: 'not', body: unary() };
    else if (take('(')) {
      n = iff();
      if (!take(')')) throw new InputError('Close the quantified formula parentheses.');
    } else n = atom();
    depth--;
    return n;
  };
  const and = (): QNode => {
    let n = unary();
    while (take('&')) n = { kind: 'and', left: n, right: unary() };
    return n;
  };
  const or = (): QNode => {
    let n = and();
    while (take('|')) n = { kind: 'or', left: n, right: and() };
    return n;
  };
  const implies = (): QNode => {
    const n = or();
    return take('#') ? { kind: 'implies', left: n, right: implies() } : n;
  };
  const iff = (): QNode => {
    let n = implies();
    while (take('@')) n = { kind: 'iff', left: n, right: implies() };
    return n;
  };
  const result = iff();
  if (at !== tokens.length) throw new InputError('Check the quantified formula syntax.');
  function validate(n: QNode, bound: string[]) {
    switch (n.kind) {
      case 'quantifier':
        validate(n.body, [...bound, n.variable]);
        break;
      case 'not':
        validate(n.body, bound);
        break;
      case 'predicate':
        n.args.forEach((s) => parseExpression(s, bound));
        break;
      case 'comparison':
        parseExpression(n.left, bound);
        parseExpression(n.right, bound);
        break;
      default:
        validate(n.left, bound);
        validate(n.right, bound);
    }
  }
  validate(result, []);
  return result;
}
function nnf(n: QNode): boolean {
  switch (n.kind) {
    case 'quantifier':
      return nnf(n.body);
    case 'not':
      return n.body.kind === 'predicate' || n.body.kind === 'comparison';
    case 'implies':
    case 'iff':
      return false;
    case 'and':
    case 'or':
      return nnf(n.left) && nnf(n.right);
    default:
      return true;
  }
}
function rename(s: string, bound: string[]): string {
  return s.replace(/[A-Za-z][A-Za-z_0-9]*/g, (v) => {
    const i = bound.lastIndexOf(v);
    if (i < 0) throw new InputError('Bind every variable with a quantifier.');
    return 'v' + i;
  });
}
function equal(
  a: QNode,
  b: QNode,
  ab: string[] = [],
  bb: string[] = [],
  integerDomains: boolean[] = [],
): boolean {
  if (a.kind !== b.kind) return false;
  const variables = ab.map((_, i) => 'v' + i);
  const expressionEqual = (x: string, y: string) => {
    const left = parseExpression(rename(x, ab), variables),
      right = parseExpression(rename(y, bb), variables);
    return left.eq(right) && sameExpressionDomain(left, right);
  };
  if (a.kind === 'quantifier' && b.kind === 'quantifier')
    return (
      a.quantifier === b.quantifier &&
      a.domain === b.domain &&
      equal(
        a.body,
        b.body,
        [...ab, a.variable],
        [...bb, b.variable],
        [...integerDomains, ['Z', 'N'].includes(a.domain)],
      )
    );
  if (a.kind === 'not' && b.kind === 'not') return equal(a.body, b.body, ab, bb, integerDomains);
  if (a.kind === 'predicate' && b.kind === 'predicate')
    return (
      a.name === b.name &&
      a.args.length === b.args.length &&
      a.args.every((x, i) => expressionEqual(x, b.args[i]))
    );
  if (a.kind === 'comparison' && b.kind === 'comparison')
    return comparisonEqual(
      comparisonFromStrings(a.op, rename(a.left, ab), rename(a.right, ab), variables),
      comparisonFromStrings(b.op, rename(b.left, bb), rename(b.right, bb), variables),
      integerDomains.every(Boolean),
    );
  if ((a.kind === 'and' || a.kind === 'or') && (b.kind === 'and' || b.kind === 'or')) {
    const flatten = (n: QNode, k: string): QNode[] =>
      n.kind === k && (n.kind === 'and' || n.kind === 'or')
        ? [...flatten(n.left, k), ...flatten(n.right, k)]
        : [n];
    const left = flatten(a, a.kind),
      right = flatten(b, b.kind);
    if (left.length !== right.length) return false;
    return left.every((x) => {
      const i = right.findIndex((y) => equal(x, y, ab, bb, integerDomains));
      if (i < 0) return false;
      right.splice(i, 1);
      return true;
    });
  }
  if ((a.kind === 'implies' || a.kind === 'iff') && (b.kind === 'implies' || b.kind === 'iff'))
    return (
      equal(a.left, b.left, ab, bb, integerDomains) &&
      equal(a.right, b.right, ab, bb, integerDomains)
    );
  return false;
}
export function quantifiedEquivalent(
  actual: string,
  expected: string,
  domains: string[],
  predicates: Record<string, number>,
  form?: string,
): boolean {
  const a = parseQuantified(actual, domains, predicates),
    b = parseQuantified(expected, domains, predicates);
  return (form !== 'nnf' || nnf(a)) && equal(a, b);
}
