import { InputError } from './exact';
import { parseSetNode, parseFiniteSet, setNodeEqual, uniqueSetNodes, type SetNode } from './sets';
import type { AssessmentRequirement, StructuredResponse } from './assessment';
type MapSpec = {
  name: string;
  domain: string;
  codomain: string;
  field?: string;
  fields?: Record<string, string>;
};
type Params = {
  kind: string;
  domains: Record<string, string[]>;
  maps: MapSpec[];
  subsets?: { s: string; w: string; left: string; right: string };
};
const text = (x: unknown): string => {
  if (typeof x !== 'string') throw new InputError('Enter the requested function or set.');
  return x;
};
const atoms = (p: Params) => [
  ...new Set(
    Object.values(p.domains)
      .flat()
      .filter((s) => /^[A-Za-z][A-Za-z0-9_]*$/.test(s)),
  ),
];
const domainNodes = (p: Params, allowed: string[]) =>
  Object.fromEntries(
    Object.entries(p.domains).map(([name, xs]) => [name, xs.map((s) => parseSetNode(s, allowed))]),
  );
export function validateFiniteMap(r: AssessmentRequirement): void {
  const p = r.params as unknown as Params;
  if (
    ![
      'unique-fiber-noninjective',
      'injective-composite-noninjective-second',
      'bijective-composite-neither',
      'image-intersection-counterexample',
    ].includes(p.kind) ||
    !p.domains ||
    typeof p.domains !== 'object' ||
    Array.isArray(p.domains) ||
    !Array.isArray(p.maps) ||
    p.maps.length < 1 ||
    p.maps.length > 2
  )
    throw Error('Invalid finite function definition.');
  for (const xs of Object.values(p.domains))
    if (!Array.isArray(xs) || !xs.length || xs.length > 16 || xs.some((s) => typeof s !== 'string'))
      throw Error('Use explicit finite domains of at most16 members.');
  const domains = domainNodes(p, atoms(p));
  for (const xs of Object.values(domains))
    if (uniqueSetNodes(xs).length !== xs.length) throw Error('Domain members must be distinct.');
  const fields: string[] = [],
    names = new Set<string>();
  for (const m of p.maps) {
    if (
      !m ||
      names.has(m.name) ||
      !domains[m.domain] ||
      !domains[m.codomain] ||
      !!m.field === !!m.fields
    )
      throw Error('Invalid finite function fields.');
    names.add(m.name);
    if (m.field) fields.push(m.field);
    else {
      if (Object.keys(m.fields!).length !== p.domains[m.domain].length)
        throw Error('Give one output field for every domain member.');
      for (const x of p.domains[m.domain]) fields.push(text(m.fields![x]));
    }
  }
  const f = p.maps.find((m) => m.name === 'f'),
    g = p.maps.find((m) => m.name === 'g');
  if (!f) throw Error('Name the first function f.');
  if (p.kind.includes('composite')) {
    if (!g || p.maps.length !== 2 || f.codomain !== g.domain)
      throw Error('Use composable functions f and g.');
  } else if (p.maps.length !== 1) throw Error('Use one function f.');
  if (p.kind === 'image-intersection-counterexample') {
    if (!p.subsets) throw Error('Include both subsets and image results.');
    for (const k of ['s', 'w', 'left', 'right'] as const) fields.push(text(p.subsets[k]));
  }
  if (
    new Set(fields).size !== fields.length ||
    fields.length !== r.fields.length ||
    fields.some((f) => !r.fields.includes(f))
  )
    throw Error('Finite function fields must match the requested answers.');
}
export function checkFiniteMap(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const p = r.params as unknown as Params,
    allowed = atoms(p),
    domains = domainNodes(p, allowed),
    maps = new Map<string, number[]>();
  let valid = true;
  for (const m of p.maps) {
    const from = domains[m.domain],
      to = domains[m.codomain],
      values = Array(from.length).fill(-1) as number[];
    if (m.field) {
      const pairs = parseFiniteSet(text(response[m.field]), allowed);
      for (const pair of pairs.members) {
        if (pair.kind !== 'tuple' || pair.members.length !== 2) {
          valid = false;
          continue;
        }
        const i = from.findIndex((x) => setNodeEqual(x, pair.members[0])),
          j = to.findIndex((x) => setNodeEqual(x, pair.members[1]));
        if (i < 0 || j < 0 || values[i] >= 0) {
          valid = false;
          continue;
        }
        values[i] = j;
      }
    } else
      for (let i = 0; i < from.length; i++) {
        const got = parseSetNode(text(response[m.fields![p.domains[m.domain][i]]]), allowed);
        values[i] = to.findIndex((x) => setNodeEqual(x, got));
      }
    if (values.some((j) => j < 0)) valid = false;
    maps.set(m.name, values);
  }
  const subsets = p.subsets
    ? Object.fromEntries(
        Object.entries(p.subsets).map(([name, field]) => [
          name,
          parseFiniteSet(text(response[field]), allowed),
        ]),
      )
    : undefined;
  if (!valid) return false;
  const fSpec = p.maps.find((m) => m.name === 'f')!,
    f = maps.get('f')!,
    injective = (xs: number[]) => new Set(xs).size === xs.length;
  if (p.kind === 'unique-fiber-noninjective') {
    const counts = domains[fSpec.codomain].map((_, j) => f.filter((v) => v === j).length);
    return counts.includes(1) && counts.some((n) => n > 1);
  }
  if (p.kind.includes('composite')) {
    const g = maps.get('g')!,
      gSpec = p.maps.find((m) => m.name === 'g')!,
      composition = f.map((i) => g[i]);
    return (
      injective(composition) &&
      !injective(g) &&
      (p.kind !== 'bijective-composite-neither' ||
        (new Set(composition).size === domains[gSpec.codomain].length &&
          new Set(f).size < domains[fSpec.codomain].length))
    );
  }
  const from = domains[fSpec.domain],
    to = domains[fSpec.codomain];
  const indices = (set: SetNode): number[] =>
    set.kind === 'set' ? set.members.map((x) => from.findIndex((v) => setNodeEqual(x, v))) : [];
  const s = indices(subsets!.s),
    w = indices(subsets!.w);
  if ([...s, ...w].some((i) => i < 0)) return false;
  const image = (xs: number[]) => [...new Set(xs.map((i) => f[i]))],
    left = image(s.filter((i) => w.includes(i))),
    si = image(s),
    wi = image(w),
    right = si.filter((i) => wi.includes(i));
  const set = (xs: number[]): SetNode => ({ kind: 'set', members: xs.map((i) => to[i]) });
  return (
    !setNodeEqual(set(left), set(right)) &&
    setNodeEqual(set(left), subsets!.left) &&
    setNodeEqual(set(right), subsets!.right)
  );
}
