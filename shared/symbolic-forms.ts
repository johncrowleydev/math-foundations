import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { InputError, parseExpression, sameExpressionDomain } from './exact';
import { logicalExpression, type FunctionTerm } from './fol-terms';
const fail = (s: string): never => {
  throw new InputError(s);
};
const text = (a: StructuredResponse, f: string) =>
  typeof a[f] === 'string' ? (a[f] as string) : fail('Enter the requested formula.');
function clean(source: string): string {
  if (source.length > 4096) fail('Use a formula shorter than 4096 characters.');
  if (/\bsumBound\d+\b|\bfunctionValue\d+\b/.test(source))
    fail('Use the variables named in the question.');
  return source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:,|;|!|quad|qquad| )/g, ' ')
    .trim();
}
function group(source: string, start: number): [string, number] {
  while (/\s/.test(source[start] || '') && start < source.length) start++;
  const open = source[start],
    close = open === '{' ? '}' : open === '(' ? ')' : null;
  if (!close) {
    const m = /^(?:[A-Za-z][A-Za-z0-9]*|\d+)/.exec(source.slice(start));
    if (!m) return fail('Use braces or parentheses around each sum bound.');
    return [m[0], start + m[0].length];
  }
  let depth = 1,
    end = start + 1;
  while (end < source.length && depth) {
    if (source[end] === open) depth++;
    if (source[end] === close) depth--;
    if (depth) end++;
  }
  if (depth) fail('Close every formula delimiter.');
  return [source.slice(start + 1, end), end + 1];
}
function topParts(source: string, separator = ','): string[] {
  let depth = 0,
    start = 0;
  const parts: string[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if ('({['.includes(c)) depth++;
    if (')}]'.includes(c)) depth--;
    if (depth < 0) fail('Check the formula delimiters.');
    if (c === separator && depth === 0) {
      parts.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (depth) fail('Close every formula delimiter.');
  parts.push(source.slice(start).trim());
  return parts;
}
function unwrap(source: string): string {
  let s = source.trim();
  while (s[0] === '(') {
    const [g, end] = group(s, 0);
    if (end !== s.length) break;
    s = g.trim();
  }
  return s;
}
/** Preserve sequence indices as exact, uninterpreted function arguments. */
export function indexedCalls(source: string, sequences: Record<string, number>): string {
  let result = '';
  for (let at = 0; at < source.length;) {
    const m = /^([A-Za-z][A-Za-z0-9]*?)_/.exec(source.slice(at));
    if (!m || !Object.hasOwn(sequences, m[1])) {
      result += source[at++];
      continue;
    }
    const [indices, end] = group(source, at + m[0].length);
    const parts = topParts(indices);
    if (parts.length !== sequences[m[1]]) fail(`Use ${sequences[m[1]]} indices for ${m[1]}.`);
    result += m[1] + '(' + parts.join(',') + ')';
    at = end;
  }
  return result;
}
function alpha(source: string, bound: string[]): string {
  return source.replace(/\b[A-Za-z][A-Za-z0-9_]*\b/g, (v) => {
    const index = bound.lastIndexOf(v);
    return index < 0 ? v : 'sumBound' + index;
  });
}
function equivalent(
  a: string,
  b: string,
  ab: string[],
  bb: string[],
  variables: string[],
  sequences: Record<string, number>,
): boolean {
  const vars = [...variables, ...ab.map((_, i) => 'sumBound' + i)],
    registry: FunctionTerm[] = [];
  const x = logicalExpression(alpha(indexedCalls(a, sequences), ab), vars, sequences, registry),
    y = logicalExpression(alpha(indexedCalls(b, sequences), bb), vars, sequences, registry);
  return x.eq(y) && sameExpressionDomain(x, y);
}
type SumNode =
  | { kind: 'expression'; source: string }
  | { kind: 'sum'; variable: string; lower: string; upper: string; body: SumNode }
  | { kind: 'add'; parts: SumNode[] }
  | { kind: 'equation'; left: SumNode; right: SumNode };
function parseSum(source: string, depth = 0): SumNode {
  if (depth > 32) fail('Use fewer nested sums.');
  const s = unwrap(source);
  const equation = topParts(s, '=');
  if (equation.length > 2) fail('Use one equality between the two requested expressions.');
  if (equation.length === 2)
    return {
      kind: 'equation',
      left: parseSum(equation[0], depth + 1),
      right: parseSum(equation[1], depth + 1),
    };
  const additions = topParts(s, '+');
  if (additions.length > 1 && additions.some((x) => /^\\?sum(?=[_(\s])/.test(unwrap(x))))
    return { kind: 'add', parts: additions.map((x) => parseSum(x, depth + 1)) };
  const match = /^(?:\\sum|sum)\s*/.exec(s);
  if (!match) return { kind: 'expression', source: s };
  let at = match[0].length,
    variable: string,
    lower: string,
    upper: string,
    body: string;
  if (s[at] === '(') {
    const [args, end] = group(s, at),
      parts = topParts(args);
    if (parts.length !== 4 || end !== s.length) fail('Use sum(index,lower,upper,summand).');
    [variable, lower, upper, body] = parts;
  } else {
    if (s[at++] !== '_') fail('Give the sum lower bound, such as \\sum_{j=0}^{n}.');
    const [decl, end] = group(s, at);
    at = end;
    const equal = decl.indexOf('=');
    if (equal < 1) fail('Start a sum with an index assignment.');
    variable = decl.slice(0, equal).trim();
    lower = decl.slice(equal + 1).trim();
    while (/\s/.test(s[at] || '') && at < s.length) at++;
    if (s[at++] !== '^') fail('Give the sum upper bound.');
    [upper, at] = group(s, at);
    body = s.slice(at).trim();
  }
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(variable) || !lower || !upper || !body)
    fail('Include a sum index, both bounds, and its summand.');
  return { kind: 'sum', variable, lower, upper, body: parseSum(body, depth + 1) };
}
function sameSum(
  a: SumNode,
  b: SumNode,
  ab: string[],
  bb: string[],
  variables: string[],
  sequences: Record<string, number>,
): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'equation' && b.kind === 'equation')
    return (
      (sameSum(a.left, b.left, ab, bb, variables, sequences) &&
        sameSum(a.right, b.right, ab, bb, variables, sequences)) ||
      (sameSum(a.left, b.right, ab, bb, variables, sequences) &&
        sameSum(a.right, b.left, ab, bb, variables, sequences))
    );
  if (a.kind === 'expression' && b.kind === 'expression')
    return equivalent(a.source, b.source, ab, bb, variables, sequences);
  if (a.kind === 'sum' && b.kind === 'sum')
    return (
      equivalent(a.lower, b.lower, ab, bb, variables, {}) &&
      equivalent(a.upper, b.upper, ab, bb, variables, {}) &&
      sameSum(a.body, b.body, [...ab, a.variable], [...bb, b.variable], variables, sequences)
    );
  if (a.kind === 'add' && b.kind === 'add') {
    const flatten = (n: SumNode): SumNode[] => (n.kind === 'add' ? n.parts.flatMap(flatten) : [n]);
    const left = flatten(a),
      remaining = flatten(b);
    if (left.length !== remaining.length) return false;
    return left.every((x) => {
      const i = remaining.findIndex((y) => sameSum(x, y, ab, bb, variables, sequences));
      if (i < 0) return false;
      remaining.splice(i, 1);
      return true;
    });
  }
  return false;
}
function validateNode(
  n: SumNode,
  bound: string[],
  variables: string[],
  sequences: Record<string, number>,
): void {
  const expression = (s: string, available: string[], symbols: Record<string, number>) =>
    logicalExpression(indexedCalls(s, symbols), available, symbols);
  if (n.kind === 'equation') {
    validateNode(n.left, bound, variables, sequences);
    validateNode(n.right, bound, variables, sequences);
    return;
  }
  if (n.kind === 'expression') {
    expression(n.source, [...variables, ...bound], sequences);
    return;
  }
  if (n.kind === 'add') {
    n.parts.forEach((x) => validateNode(x, bound, variables, sequences));
    return;
  }
  expression(n.lower, [...variables, ...bound], {});
  expression(n.upper, [...variables, ...bound], {});
  validateNode(n.body, [...bound, n.variable], variables, sequences);
}
function expandFinite(
  n: SumNode,
  variables: string[],
  sequences: Record<string, number>,
  budget = { remaining: 256 },
): SumNode {
  if (--budget.remaining < 0) fail('Use fewer finite sum terms.');
  if (n.kind === 'expression') return n;
  if (n.kind === 'equation')
    return {
      ...n,
      left: expandFinite(n.left, variables, sequences, budget),
      right: expandFinite(n.right, variables, sequences, budget),
    };
  if (n.kind === 'add')
    return { ...n, parts: n.parts.map((x) => expandFinite(x, variables, sequences, budget)) };
  if (n.body.kind !== 'expression')
    return { ...n, body: expandFinite(n.body, [...variables, n.variable], sequences, budget) };
  let lower: bigint, upper: bigint;
  try {
    lower = parseExpression(n.lower, variables).exact().integer();
    upper = parseExpression(n.upper, variables).exact().integer();
  } catch (e) {
    if (e instanceof InputError) return n;
    throw e;
  }
  if (upper - lower < 0n || upper - lower > 63n) return n;
  const body = indexedCalls(n.body.source, sequences),
    parts: SumNode[] = [];
  for (let value = lower; value <= upper; value++) {
    if (--budget.remaining < 0) fail('Use fewer finite sum terms.');
    parts.push({
      kind: 'expression',
      source: body.replace(new RegExp('\\b' + n.variable + '\\b', 'g'), '(' + value + ')'),
    });
  }
  return { kind: 'add', parts };
}
function collectTerms(n: SumNode): SumNode {
  if (n.kind === 'expression') return n;
  if (n.kind === 'sum') return { ...n, body: collectTerms(n.body) };
  if (n.kind === 'equation')
    return { ...n, left: collectTerms(n.left), right: collectTerms(n.right) };
  const flatten = (x: SumNode): SumNode[] =>
    x.kind === 'add' ? x.parts.flatMap(flatten) : [collectTerms(x)];
  const all = n.parts.flatMap(flatten),
    expressions = all.filter(
      (x): x is Extract<SumNode, { kind: 'expression' }> => x.kind === 'expression',
    ),
    others: SumNode[] = all.filter((x) => x.kind !== 'expression');
  if (expressions.length)
    others.push({
      kind: 'expression',
      source: expressions.map((x) => '(' + x.source + ')').join('+'),
    });
  return others.length === 1 ? others[0] : { kind: 'add', parts: others };
}
export function symbolicFormRequirement(r: AssessmentRequirement, a: StructuredResponse): boolean {
  const actual = clean(text(a, r.fields[0])),
    expected = clean(r.params.expected as string),
    variables = r.params.variables as string[],
    sequences = (r.params.sequences || {}) as Record<string, number>;
  if (r.validator === 'indexed-expression')
    return equivalent(actual, expected, [], [], variables, sequences);
  let left = parseSum(actual),
    right = parseSum(expected);
  validateNode(left, [], variables, sequences);
  if (r.params.allowFiniteExpansion === true) {
    left = collectTerms(expandFinite(left, variables, sequences));
    right = collectTerms(expandFinite(right, variables, sequences));
  }
  return sameSum(left, right, [], [], variables, sequences);
}
export function validateSymbolicForm(r: AssessmentRequirement): void {
  if (
    r.fields.length !== 1 ||
    typeof r.params.expected !== 'string' ||
    !Array.isArray(r.params.variables) ||
    r.params.variables.length > 8 ||
    r.params.variables.some((x) => typeof x !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(x))
  )
    throw Error('Invalid symbolic input definition.');
  const sequences = r.params.sequences || {};
  if (
    typeof sequences !== 'object' ||
    Array.isArray(sequences) ||
    Object.entries(sequences).some(
      ([name, n]) =>
        !/^[A-Za-z][A-Za-z0-9]*$/.test(name) ||
        !Number.isInteger(n) ||
        Number(n) < 1 ||
        Number(n) > 4,
    )
  )
    throw Error('Invalid indexed sequence definition.');
  const expected = clean(r.params.expected);
  if (r.validator === 'indexed-expression') {
    equivalent(expected, expected, [], [], r.params.variables, sequences as Record<string, number>);
    return;
  }
  const node = parseSum(expected);
  if (node.kind === 'expression') throw Error('A summation definition requires sum notation.');
  validateNode(node, [], r.params.variables, sequences as Record<string, number>);
}
