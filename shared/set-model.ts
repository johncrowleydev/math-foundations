import { InputError } from './exact';
import { parseFiniteSet, parseSetNode, setNodeEqual, uniqueSetNodes, type SetNode } from './sets';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
type SetExpr =
  | { kind: 'variable'; name: string }
  | { kind: 'literal'; source: string }
  | { kind: 'complement'; body: SetExpr }
  | { kind: 'power'; body: SetExpr }
  | { kind: 'union' | 'intersection' | 'difference' | 'product'; left: SetExpr; right: SetExpr };
const fail = (s: string): never => {
  throw new InputError(s);
};
export function parseSetExpression(source: string, variables: string[]): SetExpr {
  if (source.length > 4096) fail('Use a shorter set expression.');
  const s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\mathcal\{P\}/g, 'P')
    .replace(/\\(?:cup)\b|∪|\bunion\b/g, '|')
    .replace(/\\cap\b|∩|\bintersection\b/g, '&')
    .replace(/\\(?:setminus|backslash)\b|∖|\\(?![A-Za-z{}])/g, '-')
    .replace(/\\times\b|×/g, '*')
    .replace(/\\(?:emptyset|varnothing)\b|∅/g, '{}')
    .replace(/\\([{}])/g, '$1')
    .replace(/\^\{?c\}?/g, "'")
    .replace(/\\(?:overline|bar)\{([^{}]+)\}/g, '!($1)');
  const tokens = s.match(/[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d*)?|[^\s]/g) || [];
  if (tokens.length > 1024) fail('Use a shorter set expression.');
  let at = 0;
  const take = (s: string) => (tokens[at] === s ? (at++, true) : false);
  const atom = (depth: number): SetExpr => {
    if (depth > 64) fail('Use fewer nested set operations.');
    let n: SetExpr;
    if (take('!')) n = { kind: 'complement', body: atom(depth + 1) };
    else if (take('(')) {
      n = union(depth + 1);
      if (!take(')')) fail('Close the set expression parenthesis.');
    } else if (tokens[at] === 'P' && tokens[at + 1] === '(') {
      at += 2;
      n = { kind: 'power', body: union(depth + 1) };
      if (!take(')')) fail('Close P(...).');
    } else if (tokens[at] === '{') {
      const start = at++;
      let nesting = 1;
      while (at < tokens.length && nesting) {
        if (tokens[at] === '{') nesting++;
        if (tokens[at] === '}') nesting--;
        at++;
      }
      if (nesting) fail('Close the finite set.');
      n = { kind: 'literal', source: tokens.slice(start, at).join('') };
    } else {
      const name = tokens[at++];
      if (!variables.includes(name))
        fail('Use the named sets and union, intersection, difference, or complement.');
      n = { kind: 'variable', name };
    }
    while (take("'")) n = { kind: 'complement', body: n };
    return n;
  };
  const product = (d: number): SetExpr => {
    let n = atom(d);
    while (take('*')) n = { kind: 'product', left: n, right: atom(d) };
    return n;
  };
  const meet = (d: number): SetExpr => {
    let n = product(d);
    while (tokens[at] === '&' || tokens[at] === '-') {
      const op = tokens[at++];
      n = { kind: op === '&' ? 'intersection' : 'difference', left: n, right: product(d) };
    }
    return n;
  };
  const union = (d: number): SetExpr => {
    let n = meet(d);
    while (take('|')) n = { kind: 'union', left: n, right: meet(d) };
    return n;
  };
  const result = union(0);
  if (at !== tokens.length) fail('Check the set operation syntax.');
  return result;
}
function membership(n: SetExpr, values: Record<string, boolean>): boolean {
  switch (n.kind) {
    case 'variable':
      return values[n.name];
    case 'complement':
      return !membership(n.body, values);
    case 'union':
      return membership(n.left, values) || membership(n.right, values);
    case 'intersection':
      return membership(n.left, values) && membership(n.right, values);
    case 'difference':
      return membership(n.left, values) && !membership(n.right, values);
    case 'literal':
      if (n.source === '{}') return false;
  }
  return fail('Use union, intersection, difference, and complement for this set identity.');
}
function evaluate(n: SetExpr, values: Record<string, SetNode>, atoms: string[]): SetNode {
  if (n.kind === 'variable') return values[n.name];
  if (n.kind === 'literal') return parseFiniteSet(n.source, atoms);
  if (n.kind === 'complement')
    return fail('Express a finite complement relative to the supplied universe, for example U-A.');
  const set = (members: SetNode[]): SetNode => {
    const distinct = uniqueSetNodes(members);
    if (distinct.length > 256) fail('This finite set operation exceeds 256 members.');
    return { kind: 'set', members: distinct };
  };
  const members = (node: SetNode) =>
    node.kind === 'set' ? node.members : fail('Set operations require sets.');
  if (n.kind === 'power') {
    const a = members(evaluate(n.body, values, atoms));
    if (a.length > 8) fail('Use at most 8 members inside a power set.');
    return set(
      Array.from({ length: 2 ** a.length }, (_, bits) => ({
        kind: 'set',
        members: a.filter((_, i) => bits & (1 << i)),
      })),
    );
  }
  const a = members(evaluate(n.left, values, atoms)),
    b = members(evaluate(n.right, values, atoms));
  switch (n.kind) {
    case 'union':
      return set([...a, ...b]);
    case 'intersection':
      return set(a.filter((x) => b.some((y) => setNodeEqual(x, y))));
    case 'difference':
      return set(a.filter((x) => !b.some((y) => setNodeEqual(x, y))));
    case 'product':
      if (a.length * b.length > 256) fail('This Cartesian product exceeds 256 members.');
      return set(a.flatMap((x) => b.map((y) => ({ kind: 'tuple' as const, members: [x, y] }))));
  }
}
const input = (a: StructuredResponse, f: string) =>
  typeof a[f] === 'string' ? (a[f] as string) : fail('Enter the requested set.');
export function setExpressionRequirement(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const variables = r.params.variables as string[],
    actual = parseSetExpression(input(a, r.fields[0]), variables),
    expected = parseSetExpression(r.params.expected as string, variables);
  const allowed = r.params.operations as string[] | undefined;
  const uses = (n: SetExpr): boolean =>
    n.kind === 'variable' || n.kind === 'literal'
      ? true
      : (!allowed || allowed.includes(n.kind)) &&
        ('body' in n ? uses(n.body) : uses(n.left) && uses(n.right));
  if (!uses(actual)) return false;
  let yes = true;
  for (let bits = 0; bits < 2 ** variables.length; bits++) {
    const assignment = Object.fromEntries(variables.map((v, i) => [v, !!(bits & (1 << i))]));
    const x = membership(actual, assignment),
      y = membership(expected, assignment);
    yes = x === y && yes;
  }
  return yes;
}
export function setModelRequirement(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const fields = r.params.variables as Record<string, string>,
    atoms = (r.params.atoms || []) as string[],
    values = Object.fromEntries(
      Object.entries(fields).map(([v, f]) => [v, parseFiniteSet(input(a, f), atoms)]),
    );
  return (r.params.conditions as { left: string; right?: string; op: string }[])
    .map((c) => {
      const left = evaluate(parseSetExpression(c.left, Object.keys(fields)), values, atoms);
      if (left.kind !== 'set') return fail('Use finite sets.');
      if (c.op === 'nonempty') return left.members.length > 0;
      const right = evaluate(parseSetExpression(c.right!, Object.keys(fields)), values, atoms);
      if (right.kind !== 'set') return fail('Use finite sets.');
      switch (c.op) {
        case '=':
          return setNodeEqual(left, right);
        case '!=':
          return !setNodeEqual(left, right);
        case 'subset':
          return left.members.every((x) => right.members.some((y) => setNodeEqual(x, y)));
        case 'same-size':
          return left.members.length === right.members.length;
        default:
          return fail('Unknown set condition.');
      }
    })
    .every(Boolean);
}
export function nestedObjectRequirement(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const atoms = r.params.atoms as string[],
    node = parseSetNode(input(a, r.fields[0]), atoms),
    counts = new Map<string, number>();
  const visit = (n: SetNode): boolean => {
    if (n.kind === 'atom') {
      counts.set(n.value, (counts.get(n.value) || 0) + 1);
      return true;
    }
    if (n.kind !== 'tuple' || n.members.length !== 2) return false;
    return n.members.map(visit).every(Boolean);
  };
  return visit(node) && [...counts.values()].some((n) => n > 1);
}
export function validateSetRequirement(r: AssessmentRequirement): void {
  if (r.validator === 'nested-object') {
    if (
      r.fields.length !== 1 ||
      !Array.isArray(r.params.atoms) ||
      !r.params.atoms.length ||
      r.params.atoms.length > 64 ||
      r.params.atoms.some((x) => typeof x !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(x))
    )
      throw Error('Invalid nested object definition.');
    return;
  }
  if (r.validator === 'set-expression') {
    const vs = r.params.variables;
    if (
      r.fields.length !== 1 ||
      !Array.isArray(vs) ||
      !vs.length ||
      vs.length > 8 ||
      vs.some((x) => typeof x !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(x)) ||
      typeof r.params.expected !== 'string'
    )
      throw Error('Invalid set expression definition.');
    if (
      r.params.operations !== undefined &&
      (!Array.isArray(r.params.operations) ||
        r.params.operations.some(
          (x) => !['union', 'intersection', 'difference', 'complement'].includes(x),
        ))
    )
      throw Error('Invalid allowed set operations.');
    const n = parseSetExpression(r.params.expected, vs);
    membership(n, Object.fromEntries(vs.map((v) => [v, false])));
    return;
  }
  const vs = r.params.variables;
  if (
    !vs ||
    typeof vs !== 'object' ||
    Array.isArray(vs) ||
    Object.keys(vs).length < 1 ||
    Object.keys(vs).length > 8 ||
    Object.entries(vs).some(
      ([v, f]) =>
        !/^[A-Za-z][A-Za-z0-9_]*$/.test(v) || typeof f !== 'string' || !r.fields.includes(f),
    ) ||
    !Array.isArray(r.params.conditions) ||
    !r.params.conditions.length ||
    r.params.conditions.length > 64
  )
    throw Error('Invalid finite set model.');
  if (
    r.params.atoms !== undefined &&
    (!Array.isArray(r.params.atoms) || r.params.atoms.some((x) => typeof x !== 'string'))
  )
    throw Error('Invalid set atoms.');
  for (const c of r.params.conditions) {
    if (
      !c ||
      typeof c !== 'object' ||
      typeof c.left !== 'string' ||
      !['=', '!=', 'subset', 'nonempty', 'same-size'].includes(c.op)
    )
      throw Error('Invalid set condition.');
    parseSetExpression(c.left, Object.keys(vs));
    if (c.op !== 'nonempty') {
      if (typeof c.right !== 'string') throw Error('Missing set comparison.');
      parseSetExpression(c.right, Object.keys(vs));
    }
  }
}
