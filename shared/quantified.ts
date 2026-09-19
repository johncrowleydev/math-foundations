import { InputError, parseExpression, sameExpressionDomain } from './exact';
import { comparisonEqual, comparisonFromStrings } from './comparison';
export type QNode =
  | {
      kind: 'quantifier';
      quantifier: 'forall' | 'exists' | 'unique';
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
export type QuantifiedOptions = { constants?: string[]; freeVariables?: string[] };
export function parseQuantified(
  source: string,
  domains: string[],
  predicates: Record<string, number>,
  options: QuantifiedOptions = {},
): QNode {
  const tokens: string[] =
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
      let quantifier = tokens[at++] as 'forall' | 'exists' | 'unique';
      if (quantifier === 'exists' && take('!')) quantifier = 'unique';
      const variable = tokens[at++];
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
  let result = iff();
  if (at !== tokens.length) throw new InputError('Check the quantified formula syntax.');
  let fresh = 0;
  const replaceVariable = (n: QNode, old: string, replacement: string): QNode => {
    const swap = (s: string) => s.replace(new RegExp('\\b' + old + '\\b', 'g'), replacement);
    if (n.kind === 'quantifier')
      return n.variable === old ? n : { ...n, body: replaceVariable(n.body, old, replacement) };
    if (n.kind === 'not') return { ...n, body: replaceVariable(n.body, old, replacement) };
    if (n.kind === 'predicate') return { ...n, args: n.args.map(swap) };
    if (n.kind === 'comparison') return { ...n, left: swap(n.left), right: swap(n.right) };
    return {
      ...n,
      left: replaceVariable(n.left, old, replacement),
      right: replaceVariable(n.right, old, replacement),
    };
  };
  const expand = (n: QNode): QNode => {
    if (n.kind === 'quantifier') {
      if (n.quantifier !== 'unique') return { ...n, body: expand(n.body) };
      let other: string;
      do {
        other = 'uniqueBound' + fresh++;
      } while (tokens.includes(other));
      const body = expand(n.body);
      return {
        ...n,
        quantifier: 'exists',
        body: {
          kind: 'and',
          left: body,
          right: {
            kind: 'quantifier',
            quantifier: 'forall',
            variable: other,
            domain: n.domain,
            body: {
              kind: 'implies',
              left: replaceVariable(body, n.variable, other),
              right: { kind: 'comparison', op: '=', left: other, right: n.variable },
            },
          },
        },
      };
    }
    if (n.kind === 'not') return { ...n, body: expand(n.body) };
    if (n.kind === 'and' || n.kind === 'or' || n.kind === 'implies' || n.kind === 'iff')
      return { ...n, left: expand(n.left), right: expand(n.right) };
    return n;
  };
  result = expand(result);
  function validate(n: QNode, bound: string[]) {
    const available = [...bound, ...(options.constants || []), ...(options.freeVariables || [])];
    switch (n.kind) {
      case 'quantifier':
        validate(n.body, [...bound, n.variable]);
        break;
      case 'not':
        validate(n.body, bound);
        break;
      case 'predicate':
        n.args.forEach((s) => parseExpression(s, available));
        break;
      case 'comparison':
        parseExpression(n.left, available);
        parseExpression(n.right, available);
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
function rename(s: string, bound: string[], fixed: string[] = []): string {
  return s.replace(/[A-Za-z][A-Za-z_0-9]*/g, (v) => {
    const i = bound.lastIndexOf(v);
    if (i < 0) {
      if (fixed.includes(v)) return 'fixed_' + v;
      throw new InputError('Bind every variable with a quantifier.');
    }
    return 'v' + i;
  });
}
function equal(
  a: QNode,
  b: QNode,
  ab: string[] = [],
  bb: string[] = [],
  integerDomains: boolean[] = [],
  fixed: string[] = [],
): boolean {
  if (a.kind !== b.kind) return false;
  const variables = [...ab.map((_, i) => 'v' + i), ...fixed.map((v) => 'fixed_' + v)];
  const expressionEqual = (x: string, y: string) => {
    const left = parseExpression(rename(x, ab, fixed), variables),
      right = parseExpression(rename(y, bb, fixed), variables);
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
        fixed,
      )
    );
  if (a.kind === 'not' && b.kind === 'not')
    return equal(a.body, b.body, ab, bb, integerDomains, fixed);
  if (a.kind === 'predicate' && b.kind === 'predicate')
    return (
      a.name === b.name &&
      a.args.length === b.args.length &&
      a.args.every((x, i) => expressionEqual(x, b.args[i]))
    );
  if (a.kind === 'comparison' && b.kind === 'comparison')
    return comparisonEqual(
      comparisonFromStrings(a.op, rename(a.left, ab, fixed), rename(a.right, ab, fixed), variables),
      comparisonFromStrings(b.op, rename(b.left, bb, fixed), rename(b.right, bb, fixed), variables),
      integerDomains.every(Boolean) && !fixed.length,
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
      const i = right.findIndex((y) => equal(x, y, ab, bb, integerDomains, fixed));
      if (i < 0) return false;
      right.splice(i, 1);
      return true;
    });
  }
  if ((a.kind === 'implies' || a.kind === 'iff') && (b.kind === 'implies' || b.kind === 'iff'))
    return (
      equal(a.left, b.left, ab, bb, integerDomains, fixed) &&
      equal(a.right, b.right, ab, bb, integerDomains, fixed)
    );
  return false;
}
export function quantifiedEquivalent(
  actual: string,
  expected: string,
  domains: string[],
  predicates: Record<string, number>,
  form?: string,
  options: QuantifiedOptions = {},
): boolean {
  const a = parseQuantified(actual, domains, predicates, options),
    b = parseQuantified(expected, domains, predicates, options);
  return (
    (form !== 'nnf' || nnf(a)) &&
    equal(a, b, [], [], [], [...(options.constants || []), ...(options.freeVariables || [])])
  );
}
