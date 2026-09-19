import { InputError } from './exact';
export type BooleanNode =
  | { op: 'atom'; name: string }
  | { op: 'not'; child: BooleanNode }
  | { op: 'and' | 'or' | 'implies' | 'iff'; left: BooleanNode; right: BooleanNode };
export function parseBoolean(source: string, variables: string[]): BooleanNode {
  if (source.length > 4096) throw new InputError('Use a shorter formula.');
  const s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\(?:neg|lnot)\b|¬|~/g, ' ! ')
    .replace(/\\(?:land|wedge)\b|∧|&&|\band\b/gi, ' & ')
    .replace(/\\(?:lor|vee)\b|∨|\|\||\bor\b/gi, ' | ')
    .replace(/\\(?:leftrightarrow|iff)\b|↔|<->|<=>/g, ' @ ')
    .replace(/\\(?:to|rightarrow|implies)\b|→|->|=>/g, ' > ')
    .replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'));
  const tokens = s.match(/[A-Za-z][A-Za-z_0-9]*|[!&|>@()]|\S/g) || [];
  if (tokens.length > 1024) throw new InputError('Use a shorter formula.');
  let at = 0,
    depth = 0;
  const take = (t: string) => {
    if (tokens[at] === t) {
      at++;
      return true;
    }
    return false;
  };
  const primary = (): BooleanNode => {
    if (++depth > 64) throw new InputError('The formula is nested too deeply.');
    let node: BooleanNode;
    if (take('!')) node = { op: 'not', child: primary() };
    else if (take('(')) {
      node = iff();
      if (!take(')')) throw new InputError('Close the formula parentheses.');
    } else {
      const name = tokens[at++];
      if (!variables.includes(name))
        throw new InputError(`Use ${variables.join(', ')} with not, and, or, ->, or <->.`);
      node = { op: 'atom', name };
    }
    depth--;
    return node;
  };
  const and = (): BooleanNode => {
    let n = primary();
    while (take('&')) n = { op: 'and', left: n, right: primary() };
    return n;
  };
  const or = (): BooleanNode => {
    let n = and();
    while (take('|')) n = { op: 'or', left: n, right: and() };
    return n;
  };
  const implies = (): BooleanNode => {
    const n = or();
    return take('>') ? { op: 'implies', left: n, right: implies() } : n;
  };
  const iff = (): BooleanNode => {
    let n = implies();
    while (take('@')) n = { op: 'iff', left: n, right: implies() };
    return n;
  };
  const n = iff();
  if (at !== tokens.length)
    throw new InputError(`Unexpected “${tokens[at]}”. Check the logical formula.`);
  return n;
}
export function evaluateBoolean(n: BooleanNode, assignment: Record<string, boolean>): boolean {
  switch (n.op) {
    case 'atom':
      return assignment[n.name];
    case 'not':
      return !evaluateBoolean(n.child, assignment);
    case 'and':
      return evaluateBoolean(n.left, assignment) && evaluateBoolean(n.right, assignment);
    case 'or':
      return evaluateBoolean(n.left, assignment) || evaluateBoolean(n.right, assignment);
    case 'implies':
      return !evaluateBoolean(n.left, assignment) || evaluateBoolean(n.right, assignment);
    case 'iff':
      return evaluateBoolean(n.left, assignment) === evaluateBoolean(n.right, assignment);
  }
}
export function booleanEquivalent(a: BooleanNode, b: BooleanNode, variables: string[]): boolean {
  if (variables.length > 8) throw new InputError('At most eight Boolean variables are supported.');
  for (let row = 0; row < 2 ** variables.length; row++) {
    const assignment = Object.fromEntries(variables.map((v, i) => [v, !!(row & (1 << i))]));
    if (evaluateBoolean(a, assignment) !== evaluateBoolean(b, assignment)) return false;
  }
  return true;
}
export function booleanForm(n: BooleanNode, form?: string): boolean {
  if (!form) return true;
  if (form === 'contrapositive') return n.op === 'implies';
  if (n.op === 'atom') return true;
  if (n.op === 'not') return form === 'nnf' ? n.child.op === 'atom' : booleanForm(n.child, form);
  return (
    !['implies', 'iff'].includes(n.op) && booleanForm(n.left, form) && booleanForm(n.right, form)
  );
}
export function booleanStructure(a: BooleanNode, b: BooleanNode, variables: string[]): boolean {
  if (a.op !== b.op) return false;
  if (a.op === 'atom' && b.op === 'atom') return a.name === b.name;
  if (a.op === 'not' && b.op === 'not') return booleanEquivalent(a.child, b.child, variables);
  if (a.op !== 'atom' && a.op !== 'not' && b.op !== 'atom' && b.op !== 'not')
    return (
      booleanEquivalent(a.left, b.left, variables) && booleanEquivalent(a.right, b.right, variables)
    );
  return false;
}
export function booleanNodeCount(n: BooleanNode): number {
  if (n.op === 'atom') return 1;
  if (n.op === 'not') return 1 + booleanNodeCount(n.child);
  return 1 + booleanNodeCount(n.left) + booleanNodeCount(n.right);
}
