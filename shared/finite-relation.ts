import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { InputError } from './exact';
import { parseFiniteSet, parseSetNode, setNodeEqual, uniqueSetNodes, type SetNode } from './sets';

type Params = { kind: string; atoms?: string[]; universe?: string[] };
type Pair = [SetNode, SetNode];
function relation(source: string, atoms: string[]): Pair[] {
  const set = parseFiniteSet(source, atoms);
  return set.members.map((member) => {
    if (member.kind !== 'tuple' || member.members.length !== 2)
      throw new InputError('Enter a set of ordered pairs, for example {(1,2),(2,1)}.');
    return member.members as Pair;
  });
}
const index = (nodes: SetNode[], node: SetNode) => nodes.findIndex((x) => setNodeEqual(x, node));
const carrier = (relations: Pair[][]): SetNode[] => {
  const nodes = uniqueSetNodes(relations.flatMap((r) => r.flat()));
  if (nodes.length > 16) throw new InputError('Use at most 16 elements in the finite relation.');
  return nodes;
};
const matrix = (pairs: Pair[], nodes: SetNode[]) =>
  nodes.map((a) =>
    nodes.map((b) => pairs.some(([x, y]) => setNodeEqual(a, x) && setNodeEqual(b, y))),
  );
export function finiteRelationRequirement(
  r: AssessmentRequirement,
  response: StructuredResponse,
): boolean {
  const p = r.params as Params;
  const atoms = [
    ...new Set([
      ...(p.atoms || []),
      ...r.fields.flatMap((f) =>
        typeof response[f] === 'string'
          ? (response[f] as string).match(/[A-Za-z][A-Za-z0-9_]*/g) || []
          : [],
      ),
      ...(p.universe || []).flatMap((s) => s.match(/[A-Za-z][A-Za-z0-9_]*/g) || []),
    ]),
  ];
  const value = (i: number): string => {
    const v = response[r.fields[i]];
    if (typeof v !== 'string' || !v.trim())
      throw new InputError('Enter the requested relation or witness.');
    return v;
  };
  const first = relation(value(0), atoms);
  if (p.kind === 'noncommuting-composition') {
    const second = relation(value(1), atoms),
      nodes = carrier([first, second]);
    const a = matrix(first, nodes),
      b = matrix(second, nodes);
    return nodes.some((_, i) =>
      nodes.some(
        (_, k) =>
          nodes.some((_, j) => a[i][j] && b[j][k]) !== nodes.some((_, j) => b[i][j] && a[j][k]),
      ),
    );
  }
  if (p.kind === 'distinct-triples-counterexample') {
    const nodes = carrier([first]);
    if (nodes.length !== 2) return false;
    const a = matrix(first, nodes);
    // All-distinct triples are impossible on this minimal carrier; repeated ones must fail.
    return nodes.some((_, i) =>
      nodes.some((_, j) => nodes.some((_, k) => a[i][j] && a[j][k] && !a[i][k])),
    );
  }
  const nodes = p.universe!.map((x) => parseSetNode(x, atoms));
  if (carrier([first]).some((x) => index(nodes, x) < 0)) return false;
  const a = matrix(first, nodes);
  if (a.some((row, i) => !row[i] || row.some((v, j) => v !== a[j][i]))) return false;
  const witness = parseSetNode(value(1), atoms);
  if (witness.kind !== 'tuple' || witness.members.length !== 3)
    throw new InputError('Enter the ordered witness triple (a,b,c).');
  const [i, j, k] = witness.members.map((x) => index(nodes, x));
  return i >= 0 && j >= 0 && k >= 0 && a[i][j] && a[j][k] && !a[i][k];
}
export function validateFiniteRelationRequirement(r: AssessmentRequirement): void {
  const p = r.params as Params;
  if (
    ![
      'noncommuting-composition',
      'reflexive-symmetric-not-transitive',
      'distinct-triples-counterexample',
    ].includes(p.kind) ||
    r.fields.length !== (p.kind === 'distinct-triples-counterexample' ? 1 : 2)
  )
    throw Error('Invalid finite relation requirement.');
  if (
    p.atoms !== undefined &&
    (!Array.isArray(p.atoms) ||
      p.atoms.length > 256 ||
      p.atoms.some((s) => typeof s !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(s)))
  )
    throw Error('Use explicit finite atom labels.');
  if (p.kind === 'reflexive-symmetric-not-transitive') {
    if (
      !Array.isArray(p.universe) ||
      !p.universe.length ||
      p.universe.length > 16 ||
      p.universe.some((s) => typeof s !== 'string')
    )
      throw Error('Use a finite authored universe of at most 16 elements.');
    const nodes = p.universe.map((s) => parseSetNode(s, p.atoms || []));
    if (uniqueSetNodes(nodes).length !== nodes.length)
      throw Error('The authored universe contains duplicate elements.');
  }
}
