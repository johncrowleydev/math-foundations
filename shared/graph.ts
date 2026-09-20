import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { InputError } from './exact';

type Graph = { vertices: string[]; edges: string[][]; directed?: boolean };
type Params = Graph & {
  kind: string;
  expected?: string[];
  ordered?: boolean;
  start?: string;
  end?: string;
  edgeIds?: string[];
  property?: string;
};
const label = /^[A-Za-z0-9_]{1,32}$/;
const unique = (xs: string[]) => new Set(xs).size === xs.length;
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const key = (a: string, b: string, directed = false) =>
  JSON.stringify(directed || a <= b ? [a, b] : [b, a]);
function list(s: string): string[] {
  if (s.length > 8192) throw new InputError('Use a shorter vertex list.');
  s = s
    .trim()
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\([{}])/g, '$1')
    .replace(/(?:→|->|\\to)/g, ',');
  const delimiters: string[] = [];
  const opening = '{([',
    closing = '})]';
  for (const c of s) {
    if (opening.includes(c)) delimiters.push(c);
    else if (closing.includes(c) && delimiters.pop() !== opening[closing.indexOf(c)])
      throw new InputError('Check the vertex-list delimiters.');
  }
  if (delimiters.length) throw new InputError('Close the vertex-list delimiters.');
  s = s.replace(/[{}()[\]]/g, '');
  if (!s || /,\s*,|^\s*,|,\s*$/.test(s))
    throw new InputError('Enter vertex labels separated by commas or spaces.');
  const xs = s.split(/[\s,]+/);
  if (xs.length > 512 || xs.some((x) => !label.test(x)))
    throw new InputError('Use vertex labels containing letters, digits or underscores.');
  return xs;
}
function pairs(s: string): string[][] {
  if (/^(?:\{\}|\[\]|∅|\\emptyset|\\varnothing)$/.test(s.trim())) return [];
  const xs = list(s.replace(/;/g, ',').replace(/-/g, ','));
  if (xs.length % 2) throw new InputError('Enter edges as pairs, for example (a,b),(b,c).');
  return Array.from({ length: xs.length / 2 }, (_, i) => xs.slice(2 * i, 2 * i + 2));
}
function graphValid(g: Graph): boolean {
  return (
    Array.isArray(g.vertices) &&
    g.vertices.length > 0 &&
    g.vertices.length <= 16 &&
    unique(g.vertices) &&
    g.vertices.every((s) => typeof s === 'string' && label.test(s)) &&
    Array.isArray(g.edges) &&
    g.edges.length <= 240 &&
    g.edges.every(
      (e) =>
        Array.isArray(e) &&
        e.length === 2 &&
        e[0] !== e[1] &&
        e.every((v) => g.vertices.includes(v)),
    ) &&
    unique(g.edges.map(([a, b]) => key(a, b, g.directed)))
  );
}
function reachable(g: Graph, start: string, undirected = false): Set<string> {
  const seen = new Set([start]),
    pending = [start];
  while (pending.length) {
    const v = pending.pop()!;
    for (const [a, b] of g.edges) {
      const w = a === v ? b : (!g.directed || undirected) && b === v ? a : undefined;
      if (w !== undefined && !seen.has(w)) {
        seen.add(w);
        pending.push(w);
      }
    }
  }
  return seen;
}
const connected = (g: Graph, weak = false) =>
  g.vertices.length > 0 && reachable(g, g.vertices[0], weak).size === g.vertices.length;
function components(g: Graph): string[][] {
  const todo = new Set(g.vertices),
    out: string[][] = [];
  while (todo.size) {
    const found = [...reachable(g, todo.values().next().value!, true)].sort();
    out.push(found);
    for (const x of found) todo.delete(x);
  }
  return out;
}
function route(g: Graph, xs: string[], kind: string): boolean {
  if (xs.some((v) => !g.vertices.includes(v))) return false;
  const edges = new Set(g.edges.map(([a, b]) => key(a, b, g.directed)));
  const used = xs.slice(1).map((v, i) => key(xs[i], v, g.directed));
  if (used.some((e) => !edges.has(e))) return false;
  if (kind === 'path') return unique(xs);
  if (kind === 'hamiltonian-cycle')
    return (
      g.vertices.length >= (g.directed ? 2 : 3) &&
      xs.length === g.vertices.length + 1 &&
      xs[0] === xs.at(-1) &&
      unique(xs.slice(0, -1))
    );
  return (
    used.length === edges.size && unique(used) && (kind !== 'euler-circuit' || xs[0] === xs.at(-1))
  );
}
function topological(g: Graph): string[] {
  const results: string[] = [];
  function visit(prefix: string[]) {
    if (prefix.length === g.vertices.length) {
      results.push(JSON.stringify(prefix));
      return;
    }
    for (const v of g.vertices)
      if (!prefix.includes(v) && g.edges.every(([a, b]) => b !== v || prefix.includes(a)))
        visit([...prefix, v]);
  }
  visit([]);
  return results.sort();
}
function hamiltonian(g: Graph): boolean {
  const n = g.vertices.length;
  if (n < 3) return false;
  const neighbors = g.vertices.map((v) =>
    g.edges.reduce(
      (bits, [a, b]) =>
        bits | (a === v ? 1 << g.vertices.indexOf(b) : b === v ? 1 << g.vertices.indexOf(a) : 0),
      0,
    ),
  );
  // Fixed start removes rotational duplicates; state stores all reachable last vertices.
  const dp = new Uint32Array(1 << n);
  dp[1] = 1;
  for (let mask = 1; mask < dp.length; mask += 2) {
    let ends = dp[mask];
    while (ends) {
      const end = 31 - Math.clz32(ends & -ends);
      ends &= ends - 1;
      let choices = neighbors[end] & ~mask;
      while (choices) {
        const bit = choices & -choices;
        choices &= choices - 1;
        dp[mask | bit] |= bit;
      }
    }
  }
  return !!(dp.at(-1)! & neighbors[0]);
}
function eulerExists(g: Graph): boolean {
  const active = g.vertices.filter((v) => g.edges.some((e) => e.includes(v)));
  if (!active.length) return true;
  if (reachable(g, active[0]).size !== active.length) return false;
  const odd = active.filter((v) => g.edges.filter((e) => e.includes(v)).length % 2).length;
  return odd === 0 || odd === 2;
}
export function graphRequirement(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const p = r.params as unknown as Params;
  const value = (i: number): string => {
    const x = response[r.fields[i]];
    if (typeof x !== 'string' || !x.trim())
      throw new InputError('Enter the requested vertex or edge list.');
    return x;
  };
  if (p.kind === 'sequence') {
    const xs = list(value(0));
    return p.ordered === false
      ? unique(xs) && same(xs.sort(), [...p.expected!].sort())
      : same(xs, p.expected!);
  }
  if (p.kind === 'graph-property') {
    const g: Graph = { vertices: list(value(0)), edges: pairs(value(1)), directed: p.directed };
    if (!graphValid(g)) return false;
    if (p.property === 'rooted-leaf-counterexample') {
      const roots = list(value(2));
      if (
        roots.length !== 1 ||
        !g.vertices.includes(roots[0]) ||
        g.edges.length !== g.vertices.length - 1 ||
        !connected(g)
      )
        return false;
      const children = g.vertices.map(
        (v) => g.edges.filter((e) => e.includes(v)).length - (v === roots[0] ? 0 : 1),
      );
      const leaves = children.filter((n) => n === 0).length;
      return children.includes(1) && leaves !== g.vertices.length - leaves + 1;
    }
    if (p.property === 'weak-not-strong')
      return (
        connected(g, true) && !g.vertices.every((v) => reachable(g, v).size === g.vertices.length)
      );
    if (p.property === 'n-minus-one-not-tree')
      return g.edges.length === g.vertices.length - 1 && !connected(g);
    return eulerExists(g) !== hamiltonian(g);
  }
  if (p.kind === 'spanning-tree') {
    const ids = response[r.fields[0]];
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string'))
      throw new InputError('Select the edges of a spanning tree.');
    if (!unique(ids) || ids.some((id) => !p.edgeIds!.includes(id))) return false;
    const edges = ids.map((id) => p.edges[p.edgeIds!.indexOf(id)]);
    return edges.length === p.vertices.length - 1 && connected({ ...p, edges });
  }
  if (p.kind === 'connect-with-edges') {
    const edges = pairs(value(0)),
      g = { ...p, edges: [...p.edges, ...edges] };
    return graphValid(g) && edges.length === components(p).length - 1 && connected(g);
  }
  if (p.kind === 'components' || p.kind === 'all-topological-orders') {
    const rows = value(0)
      .split(/[;\n]+/)
      .map((s) => list(s));
    const actual = rows
      .map((row) => JSON.stringify(p.kind === 'components' ? row.sort() : row))
      .sort();
    if (!unique(actual)) return false;
    const expected =
      p.kind === 'components'
        ? components(p)
            .map((row) => JSON.stringify(row))
            .sort()
        : topological(p);
    return same(actual, expected);
  }
  if (p.kind === 'two-paths') {
    const a = list(value(0)),
      b = list(value(1));
    return (
      !same(a, b) &&
      [a, b].every((xs) => xs[0] === p.start && xs.at(-1) === p.end && route(p, xs, 'path'))
    );
  }
  return route(p, list(value(0)), p.kind);
}
export function validateGraphRequirement(r: AssessmentRequirement): void {
  const p = r.params as unknown as Params;
  if (
    (p.directed !== undefined && typeof p.directed !== 'boolean') ||
    (p.ordered !== undefined && typeof p.ordered !== 'boolean')
  )
    throw Error('Invalid graph flags.');
  const kinds = [
    'sequence',
    'graph-property',
    'spanning-tree',
    'connect-with-edges',
    'components',
    'all-topological-orders',
    'two-paths',
    'euler-trail',
    'euler-circuit',
    'hamiltonian-cycle',
  ];
  if (
    !kinds.includes(p.kind) ||
    r.fields.length !==
      (p.kind === 'graph-property' && p.property === 'rooted-leaf-counterexample'
        ? 3
        : ['two-paths', 'graph-property'].includes(p.kind)
          ? 2
          : 1)
  )
    throw Error('Invalid graph requirement fields or kind.');
  if (p.kind === 'sequence') {
    if (
      !Array.isArray(p.expected) ||
      !p.expected.length ||
      p.expected.length > 512 ||
      p.expected.some((v) => typeof v !== 'string' || !label.test(v)) ||
      (p.ordered === false && !unique(p.expected))
    )
      throw Error('Invalid expected vertex sequence.');
    return;
  }
  if (p.kind === 'graph-property') {
    if (
      ![
        'weak-not-strong',
        'n-minus-one-not-tree',
        'euler-hamiltonian-mismatch',
        'rooted-leaf-counterexample',
      ].includes(p.property || '') ||
      !!p.directed !== (p.property === 'weak-not-strong')
    )
      throw Error('Invalid graph property.');
    return;
  }
  if (!graphValid(p)) throw Error('Use a finite simple authored graph with at most 16 vertices.');
  if (
    p.kind === 'all-topological-orders' &&
    (!p.directed || p.vertices.length > 8 || !topological(p).length)
  )
    throw Error('Topological enumeration requires a DAG with at most eight vertices.');
  if (
    p.kind === 'two-paths' &&
    (!p.vertices.includes(p.start!) || !p.vertices.includes(p.end!) || p.start === p.end)
  )
    throw Error('Paths need distinct authored endpoints.');
  if (
    p.kind === 'spanning-tree' &&
    (!Array.isArray(p.edgeIds) ||
      p.edgeIds.length !== p.edges.length ||
      !unique(p.edgeIds) ||
      p.edgeIds.some((id) => typeof id !== 'string' || !id))
  )
    throw Error('Spanning-tree edges need unique IDs.');
  if (['spanning-tree', 'connect-with-edges', 'components'].includes(p.kind) && p.directed)
    throw Error('This graph task requires undirected edges.');
}
