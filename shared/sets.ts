import { Exact, InputError, parseExact } from './exact';
export type SetNode =
  | { kind: 'set' | 'tuple'; members: SetNode[] }
  | { kind: 'number'; value: Exact }
  | { kind: 'atom'; value: string };
function topLevel(s: string): string[] {
  if (!s.trim()) return [];
  const result: string[] = [];
  let depth = 0,
    start = 0;
  for (let i = 0; i < s.length; i++) {
    if ('({['.includes(s[i])) depth++;
    if (')}]'.includes(s[i])) depth--;
    if (depth < 0) throw new InputError('Check the set delimiters.');
    if (s[i] === ',' && depth === 0) {
      result.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (depth) throw new InputError('Close each set or tuple delimiter.');
  result.push(s.slice(start).trim());
  if (result.some((x) => !x)) throw new InputError('Enter a value between commas.');
  return result;
}
export function setNodeEqual(a: SetNode, b: SetNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'number' && b.kind === 'number') return a.value.eq(b.value);
  if (a.kind === 'atom' && b.kind === 'atom') return a.value === b.value;
  if ((a.kind === 'set' || a.kind === 'tuple') && (b.kind === 'set' || b.kind === 'tuple')) {
    const aa = a.members,
      bb = b.members;
    return (
      aa.length === bb.length &&
      (a.kind === 'tuple'
        ? aa.every((x, i) => setNodeEqual(x, bb[i]))
        : aa.every((x) => bb.some((y) => setNodeEqual(x, y))))
    );
  }
  return false;
}
export function uniqueSetNodes(nodes: SetNode[]): SetNode[] {
  const result: SetNode[] = [];
  for (const n of nodes) if (!result.some((x) => setNodeEqual(x, n))) result.push(n);
  return result;
}
export function parseSetNode(source: string, atoms: string[], depth = 0): SetNode {
  if (source.length > 4096 || depth > 32) throw new InputError('Use a shorter finite set.');
  const s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:varnothing|emptyset)\b|∅/g, '{}')
    .replace(/\\([{}])/g, '$1')
    .trim();
  if (!s) throw new InputError('Enter a set, or {} for the empty set.');
  if (s.startsWith('{') && s.endsWith('}'))
    return {
      kind: 'set',
      members: uniqueSetNodes(
        topLevel(s.slice(1, -1)).map((x) => parseSetNode(x, atoms, depth + 1)),
      ),
    };
  if (s.startsWith('(') && s.endsWith(')')) {
    const values = topLevel(s.slice(1, -1));
    if (values.length > 1)
      return { kind: 'tuple', members: values.map((x) => parseSetNode(x, atoms, depth + 1)) };
  }
  if (atoms.includes(s)) return { kind: 'atom', value: s };
  return { kind: 'number', value: parseExact(s) };
}
export function setEqual(actual: string, expected: string[], atoms: string[] = []): boolean {
  const collect = (s: string): string[] =>
    s
      .match(/\b[A-Za-z][A-Za-z0-9_]*\b/g)
      ?.filter(
        (a) =>
          ![
            'sqrt',
            'frac',
            'dfrac',
            'tfrac',
            'binom',
            'begin',
            'end',
            'varnothing',
            'emptyset',
          ].includes(a),
      ) || [];
  const allowed = [...new Set([...atoms, ...expected.flatMap(collect)])];
  const target: SetNode = {
    kind: 'set',
    members: uniqueSetNodes(expected.map((x) => parseSetNode(x, allowed))),
  };
  let entered = actual
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .trim();
  if (
    !entered.startsWith('{') &&
    !entered.startsWith('\\{') &&
    !entered.startsWith('\\left\\{') &&
    !/^(?:\\(?:varnothing|emptyset)|∅)/.test(entered)
  )
    entered = '{' + entered + '}';
  const got = parseSetNode(entered, allowed);
  return got.kind === 'set' && setNodeEqual(got, target);
}

export function parseFiniteSet(
  source: string,
  atoms: string[] = [],
): Extract<SetNode, { kind: 'set' | 'tuple' }> {
  const node = parseSetNode(source, atoms);
  if (node.kind !== 'set')
    throw new InputError('Use braces for a finite set, or {} for the empty set.');
  if (node.members.length > 256) throw new InputError('Use a set with at most 256 members.');
  return node;
}
