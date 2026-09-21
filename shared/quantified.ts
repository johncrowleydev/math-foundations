import { prepareExtendedExpressions } from './exponential';
import { logicalExpression, type FunctionTerm } from './fol-terms';
import { InputError, sameExpressionDomain } from './exact';
import { comparisonEqual } from './comparison';
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
    .replace(/\\notin\b|∉/g, ' notin ')
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
export type QuantifiedOptions = {
  constants?: string[];
  freeVariables?: string[];
  functions?: Record<string, number>;
  sets?: string[];
  integerVariables?: string[];
};
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
    if (first && predicates[first] === 0 && tokens[at + 1] !== '(') {
      at++;
      return { kind: 'predicate', name: first, args: [] };
    }
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
      if (predicates[first] === 0 && args.length === 1 && !args[0].trim()) args.pop();
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
    const membershipIndex = raw.findIndex((x) => x === 'in' || x === 'notin');
    if (membershipIndex > 0 && membershipIndex === raw.length - 2) {
      const set = raw.at(-1)!;
      if (!options.sets?.includes(set) || predicates[set] !== 1)
        throw new InputError('Use one of the named sets.');
      const member: QNode = {
        kind: 'predicate',
        name: set,
        args: [raw.slice(0, membershipIndex).join(' ')],
      };
      return raw[membershipIndex] === 'notin' ? { kind: 'not', body: member } : member;
    }
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
  const arithmeticGroup = (): boolean => {
    if (tokens[at] !== '(') return false;
    let depth = 0;
    for (let i = at; i < tokens.length; i++) {
      if (tokens[i] === '(') depth++;
      if (tokens[i] === ')') depth--;
      if (depth === 0)
        return ['+', '-', '*', '/', '^', '=', '!=', '<', '<=', '>', '>=', 'in', 'notin'].includes(
          tokens[i + 1],
        );
    }
    return false;
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
      let domain: string;
      if (take('in')) domain = tokens[at++];
      // Ordinary notation omits the domain when the exercise supplies just one.
      else if (domains.length === 1) domain = domains[0];
      else throw new InputError('Include the variable domain, for example “forall n in Z”.');
      if (!domains.includes(domain))
        throw new InputError('Use a stated domain: ' + domains.join(', ') + '.');
      if (tokens[at] === '.' || tokens[at] === ':' || tokens[at] === ',') at++;
      n = { kind: 'quantifier', quantifier, variable, domain, body: iff() };
    } else if (take('!')) n = { kind: 'not', body: unary() };
    else if (tokens[at] === '(' && !arithmeticGroup() && take('(')) {
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
  let expansionBudget = 4096;
  const expandedNode = () => {
    if (--expansionBudget < 0) throw new InputError('Use a shorter quantified formula.');
  };
  const replaceVariable = (n: QNode, old: string, replacement: string): QNode => {
    expandedNode();
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
    expandedNode();
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
  function validate(n: QNode, bound: string[], boundIntegers: string[] = []) {
    const available = [...bound, ...(options.constants || []), ...(options.freeVariables || [])];
    const expression = (source: string) =>
      options.integerVariables?.length
        ? prepareExtendedExpressions([source], {
            variables: available,
            integerVariables: [
              ...new Set([
                ...boundIntegers,
                ...options.integerVariables.filter((v) => available.includes(v)),
              ]),
            ],
          })
        : logicalExpression(source, available, options.functions);
    switch (n.kind) {
      case 'quantifier':
        validate(
          n.body,
          [...bound, n.variable],
          ['N', 'Z'].includes(n.domain) ? [...boundIntegers, n.variable] : boundIntegers,
        );
        break;
      case 'not':
        validate(n.body, bound, boundIntegers);
        break;
      case 'predicate':
        n.args.forEach(expression);
        break;
      case 'comparison':
        expression(n.left);
        expression(n.right);
        break;
      default:
        validate(n.left, bound, boundIntegers);
        validate(n.right, bound, boundIntegers);
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
function negationsOnAtoms(n: QNode): boolean {
  if (n.kind === 'not') return n.body.kind === 'predicate' || n.body.kind === 'comparison';
  if (n.kind === 'quantifier') return negationsOnAtoms(n.body);
  if (n.kind === 'and' || n.kind === 'or' || n.kind === 'implies' || n.kind === 'iff')
    return negationsOnAtoms(n.left) && negationsOnAtoms(n.right);
  return true;
}
function rename(
  s: string,
  bound: string[],
  fixed: string[] = [],
  functions: Record<string, number> = {},
): string {
  return s.replace(/[A-Za-z][A-Za-z_0-9]*/g, (v, offset: number) => {
    if (
      Object.hasOwn(functions, v) &&
      s
        .slice(offset + v.length)
        .trimStart()
        .startsWith('(')
    )
      return v;
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
  functions: Record<string, number> = {},
  integerVariables: string[] = [],
): boolean {
  if (a.kind !== b.kind) return false;
  const variables = [...ab.map((_, i) => 'v' + i), ...fixed.map((v) => 'fixed_' + v)];
  const registry: FunctionTerm[] = [];
  const expression = (s: string, bound: string[]) =>
    logicalExpression(rename(s, bound, fixed, functions), variables, functions, registry);
  const expressions = (sources: [string, string[]][]) =>
    integerVariables.length
      ? prepareExtendedExpressions(
          sources.map(([s, bound]) => rename(s, bound, fixed, functions)),
          {
            variables,
            integerVariables: [
              ...ab.map((_, i) => (integerDomains[i] ? 'v' + i : '')).filter(Boolean),
              ...fixed.filter((v) => integerVariables.includes(v)).map((v) => 'fixed_' + v),
            ],
          },
        )
      : sources.map(([s, bound]) => expression(s, bound));
  const expressionEqual = (x: string, y: string) => {
    const [left, right] = expressions([
      [x, ab],
      [y, bb],
    ]);
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
        functions,
        integerVariables,
      )
    );
  if (a.kind === 'not' && b.kind === 'not')
    return equal(a.body, b.body, ab, bb, integerDomains, fixed, functions, integerVariables);
  if (a.kind === 'predicate' && b.kind === 'predicate')
    return (
      a.name === b.name &&
      a.args.length === b.args.length &&
      a.args.every((x, i) => expressionEqual(x, b.args[i]))
    );
  if (a.kind === 'comparison' && b.kind === 'comparison') {
    const [al, ar, bl, br] = expressions([
      [a.left, ab],
      [a.right, ab],
      [b.left, bb],
      [b.right, bb],
    ]);
    return comparisonEqual(
      { op: a.op, left: al, right: ar },
      { op: b.op, left: bl, right: br },
      integerDomains.every(Boolean) &&
        fixed.every((v) => integerVariables.includes(v)) &&
        !Object.keys(functions).length &&
        [al, ar, bl, br].every((p) =>
          [...p.num.keys(), ...p.den.keys()].every((k) => !k.includes('DETX')),
        ),
    );
  }
  if ((a.kind === 'and' || a.kind === 'or') && (b.kind === 'and' || b.kind === 'or')) {
    const flatten = (n: QNode, k: string): QNode[] =>
      n.kind === k && (n.kind === 'and' || n.kind === 'or')
        ? [...flatten(n.left, k), ...flatten(n.right, k)]
        : [n];
    const left = flatten(a, a.kind),
      right = flatten(b, b.kind);
    if (left.length !== right.length) return false;
    return left.every((x) => {
      const i = right.findIndex((y) =>
        equal(x, y, ab, bb, integerDomains, fixed, functions, integerVariables),
      );
      if (i < 0) return false;
      right.splice(i, 1);
      return true;
    });
  }
  if ((a.kind === 'implies' || a.kind === 'iff') && (b.kind === 'implies' || b.kind === 'iff'))
    return (
      equal(a.left, b.left, ab, bb, integerDomains, fixed, functions, integerVariables) &&
      equal(a.right, b.right, ab, bb, integerDomains, fixed, functions, integerVariables)
    );
  return false;
}
/** Normalize supported negations and connectives without changing quantifier order. */
function logicalNormalForm(n: QNode, negate = false, budget = { remaining: 4096 }): QNode {
  if (--budget.remaining < 0) throw new InputError('Use a shorter quantified formula.');
  if (n.kind === 'not') return logicalNormalForm(n.body, !negate, budget);
  if (n.kind === 'quantifier')
    return {
      ...n,
      quantifier: negate ? (n.quantifier === 'forall' ? 'exists' : 'forall') : n.quantifier,
      body: logicalNormalForm(n.body, negate, budget),
    };
  if (n.kind === 'implies')
    return logicalNormalForm(
      { kind: 'or', left: { kind: 'not', body: n.left }, right: n.right },
      negate,
      budget,
    );
  if (n.kind === 'iff')
    return logicalNormalForm(
      {
        kind: 'and',
        left: { kind: 'implies', left: n.left, right: n.right },
        right: { kind: 'implies', left: n.right, right: n.left },
      },
      negate,
      budget,
    );
  if (n.kind === 'and' || n.kind === 'or')
    return {
      kind: negate ? (n.kind === 'and' ? 'or' : 'and') : n.kind,
      left: logicalNormalForm(n.left, negate, budget),
      right: logicalNormalForm(n.right, negate, budget),
    };
  if (n.kind === 'comparison' && negate)
    return {
      ...n,
      op: (
        { '=': '!=', '!=': '=', '<': '>=', '<=': '>', '>': '<=', '>=': '<' } as Record<
          string,
          string
        >
      )[n.op],
    };
  return negate ? { kind: 'not', body: n } : n;
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
    (form !== 'negations-on-atoms' || negationsOnAtoms(a)) &&
    equal(
      logicalNormalForm(a),
      logicalNormalForm(b),
      [],
      [],
      [],
      [...(options.constants || []), ...(options.freeVariables || [])],
      options.functions,
      options.integerVariables,
    )
  );
}
