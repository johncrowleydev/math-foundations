import { readdir, readFile } from 'node:fs/promises';
import { z } from 'zod';
import { validateMath } from './content.js';

const text = z.string().min(1);
const entrySchema = z
  .object({
    id: text,
    kind: z.enum(['term', 'symbol']),
    name: text,
    aliases: z.array(text),
    linkAliases: z.array(text).optional(),
    quick: text,
    definition: text,
    example: text,
    confusion: text,
    lesson: text,
    section: text,
    related: z.array(text),
  })
  .strict();
const node = z
  .object({ id: text, x: z.number().min(30).max(570), y: z.number().min(30).max(330) })
  .strict();
const figureBase = z.object({
  id: text,
  title: text,
  lesson: text,
  section: text,
  frames: z
    .array(
      z
        .object({
          text,
          route: z.array(text).default([]),
          highlight: z.array(text).default([]),
          active: z.number().int().min(0).optional(),
          representation: z.enum(['graph', 'matrix']).optional(),
          steps: z.array(text).min(2).max(6).optional(),
          operation: z
            .enum([
              'union',
              'intersection',
              'difference',
              'complement',
              'symmetric-difference',
              'union-complement',
              'intersection-complement',
            ])
            .optional(),
          n: z.number().int().min(1).max(8).optional(),
          regions: z
            .array(
              z.tuple([
                z.number().int().nonnegative(),
                z.number().int().nonnegative(),
                z.number().int().positive(),
                z.number().int().positive(),
              ]),
            )
            .optional(),
        })
        .strict(),
    )
    .min(1),
  requires: z.array(text),
  creation: text,
  limitations: text,
  mathLabels: z.record(z.string(), text).default({}),
});
const figureSchema = z.discriminatedUnion('kind', [
  figureBase
    .extend({
      kind: z.literal('cartesian'),
      bounds: z
        .object({ x: z.tuple([z.number(), z.number()]), y: z.tuple([z.number(), z.number()]) })
        .strict(),
      curves: z
        .array(
          z
            .object({
              id: text,
              label: text,
              points: z
                .array(z.tuple([z.number(), z.number()]))
                .min(2)
                .max(1000),
              dashed: z.boolean().default(false),
            })
            .strict(),
        )
        .max(4),
      regions: z
        .array(
          z
            .object({
              points: z
                .array(z.tuple([z.number(), z.number()]))
                .min(3)
                .max(1000),
            })
            .strict(),
        )
        .default([]),
      markers: z
        .array(
          z
            .object({
              at: z.tuple([z.number(), z.number()]),
              label: text,
              open: z.boolean().default(false),
            })
            .strict(),
        )
        .default([]),
      arrows: z
        .array(
          z
            .object({
              from: z.tuple([z.number(), z.number()]),
              to: z.tuple([z.number(), z.number()]),
              label: text,
              dashed: z.boolean().default(false),
            })
            .strict(),
        )
        .default([]),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('coordinates'),
      extent: z.number().positive(),
      arrows: z.array(
        z
          .object({
            label: text,
            from: z.tuple([z.number(), z.number()]),
            to: z.tuple([z.number(), z.number()]),
            dashed: z.boolean().default(false),
            labelOffset: z.tuple([z.number(), z.number()]).optional(),
          })
          .strict(),
      ),
      ellipses: z.array(z.tuple([z.number().positive(), z.number().positive()])).default([]),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('collections'),
      collections: z
        .array(
          z
            .object({
              label: text,
              elements: z.array(z.union([text, z.array(text).max(3)])).max(4),
            })
            .strict(),
        )
        .min(1)
        .max(4),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('graph'),
      nodes: z.array(node).min(1),
      edges: z.array(z.tuple([text, text])),
      directed: z.boolean(),
      allowLoops: z.boolean().default(false),
      presentation: z.enum(['network', 'hasse']).default('network'),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('venn'),
      universe: z.array(text).min(1).max(12),
      a: z.array(text),
      b: z.array(text),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('mapping'),
      domain: z.array(text).min(1).max(4),
      codomain: z.array(text).min(1).max(4),
      pairs: z.array(z.tuple([text, text])),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('predicate-table'),
      rows: z.array(text).min(1).max(4),
      columns: z.array(text).min(1).max(4),
      values: z.array(z.array(z.boolean()).min(1).max(4)).min(1).max(4),
      rowLabel: text,
      columnLabel: text,
    })
    .strict(),
  figureBase.extend({ kind: z.literal('flow'), steps: z.array(text).min(2).max(6) }).strict(),
  figureBase
    .extend({
      kind: z.literal('board'),
      rows: z.number().int().min(1).max(6),
      columns: z.number().int().min(1).max(8),
    })
    .strict(),
  figureBase
    .extend({ kind: z.literal('sum'), arrangement: z.enum(['triangle', 'rectangle']) })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('sequence'),
      values: z.array(z.number().nonnegative()).min(2).max(8),
      firstIndex: z.number().int(),
      rule: text,
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('bins'),
      starsAndBars: z.boolean().default(false),
      counts: z.array(z.number().int().min(0).max(6)).min(2).max(5),
    })
    .strict(),
  figureBase
    .extend({
      kind: z.literal('plot'),
      xMax: z.number().int().min(2).max(32),
      yMax: z.number().positive(),
      threshold: z.number().min(1).optional(),
      series: z
        .array(
          z
            .object({
              label: text,
              model: z.enum(['polynomial', 'exponential', 'logarithm', 'nlogn']),
              coefficients: z.array(z.number()).max(4),
              base: z.number().positive().optional(),
            })
            .strict(),
        )
        .min(1)
        .max(3),
    })
    .strict(),
]);
const formulaSchema = z
  .object({
    id: text,
    lesson: text,
    latex: text,
    source: text,
    ordinal: z.number().int().nonnegative(),
    reading: text,
    bindings: z.array(z.object({ symbol: text, meaning: text, reference: text }).strict()),
  })
  .strict();
export async function loadTeaching() {
  const files = (await readdir('content/references')).filter((f) => f.endsWith('.json')).sort();
  const references = z
    .array(entrySchema)
    .parse(
      (
        await Promise.all(
          files.map(async (f) => JSON.parse(await readFile('content/references/' + f, 'utf8'))),
        )
      ).flat(),
    );
  const figures = z
    .array(figureSchema)
    .parse(JSON.parse(await readFile('content/figures.json', 'utf8')));
  const formulas = z
    .array(formulaSchema)
    .parse(JSON.parse(await readFile('content/formula-explanations.json', 'utf8')));
  for (const group of [references, figures, formulas]) {
    if (new Set(group.map((x) => x.id)).size !== group.length) throw Error('Duplicate teaching ID');
  }
  const ids = new Set(references.map((x) => x.id));
  for (const r of references) {
    for (const id of r.related) if (!ids.has(id)) throw Error('Unknown related reference: ' + id);
    validateMath([r.quick, r.definition, r.example, r.confusion].join('\n'));
  }
  for (const f of formulas) {
    validateMath('$$\n' + f.latex + '\n$$');
    for (const b of f.bindings)
      if (!ids.has(b.reference)) throw Error('Unknown symbol reference: ' + b.reference);
  }
  for (const f of figures) {
    if (f.kind === 'cartesian') {
      if (f.bounds.x[0] >= f.bounds.x[1] || f.bounds.y[0] >= f.bounds.y[1])
        throw Error('Invalid Cartesian bounds: ' + f.id);
      if (new Set(f.curves.map((c) => c.id)).size !== f.curves.length)
        throw Error('Duplicate Cartesian curve: ' + f.id);
    }
    for (const latex of Object.values(f.mathLabels)) validateMath('$$\n' + latex + '\n$$');
    const requiredLabels: string[] = [];
    if (f.kind === 'graph') requiredLabels.push(...f.nodes.map((n) => n.id));
    if (f.kind === 'venn') requiredLabels.push('U', 'A', 'B', ...f.universe);
    if (f.kind === 'predicate-table') requiredLabels.push(...f.rows, ...f.columns, 'T', 'F');
    if (f.kind === 'mapping') requiredLabels.push(...f.domain, ...f.codomain);
    if (f.kind === 'collections')
      for (const c of f.collections)
        requiredLabels.push(
          c.label,
          ...c.elements.map((x) => (Array.isArray(x) ? '{' + x.join(',') + '}' : x)),
        );
    if (f.kind === 'flow')
      requiredLabels.push(...f.steps, ...f.frames.flatMap((frame) => frame.steps || []));
    for (const label of requiredLabels)
      if (!f.mathLabels[label]) throw Error('Missing authored figure TeX: ' + f.id + ' / ' + label);

    if (f.kind === 'graph') {
      if (f.frames.some((frame) => frame.representation === 'matrix') && f.nodes.length > 4)
        throw Error('Matrix labels exceed readable limit: ' + f.id);
      if (f.allowLoops && !f.directed)
        throw Error('Loop diagrams require directed relation semantics: ' + f.id);
      if (f.presentation === 'hasse' && (f.directed || f.allowLoops))
        throw Error('Hasse drawings omit arrowheads and loops: ' + f.id);
      for (const [a, b] of f.edges) {
        if (a === b && (f.nodes.find((n) => n.id === a)?.y ?? 0) < 85)
          throw Error('Loop would clip: ' + f.id);
        if (
          f.presentation === 'hasse' &&
          (f.nodes.find((n) => n.id === a)?.y ?? 0) <= (f.nodes.find((n) => n.id === b)?.y ?? 0)
        )
          throw Error('Hasse cover does not point upward: ' + f.id);
      }
      const vertices = new Set(f.nodes.map((v) => v.id));
      if (vertices.size !== f.nodes.length) throw Error('Duplicate vertex: ' + f.id);
      const edgeKey = (a: string, b: string) =>
        (f.directed || f.presentation === 'hasse' ? [a, b] : [a, b].sort()).join(':');
      const edges = new Set(f.edges.map(([a, b]) => edgeKey(a, b)));
      if (edges.size !== f.edges.length) throw Error('Repeated edge: ' + f.id);
      for (const [a, b] of f.edges)
        if ((a === b && !f.allowLoops) || !vertices.has(a) || !vertices.has(b))
          throw Error('Invalid simple edge: ' + f.id);
      for (const frame of f.frames) {
        validateMath(frame.text);
        for (const v of [...frame.route, ...frame.highlight])
          if (!vertices.has(v)) throw Error('Unknown highlighted vertex: ' + f.id);
        for (let i = 1; i < frame.route.length; i++)
          if (!edges.has(edgeKey(frame.route[i - 1], frame.route[i])))
            throw Error('Nonexistent route step: ' + f.id);
      }
    }
    for (const frame of f.frames) validateMath(frame.text);
    if (f.kind === 'collections') {
      const keys = f.collections.map((c) => c.label);
      if (new Set(keys).size !== keys.length) throw Error('Repeated collection label: ' + f.id);
      for (const c of f.collections) {
        const canonical = c.elements.map((x) =>
          JSON.stringify(Array.isArray(x) ? [...x].sort() : x),
        );
        if (new Set(canonical).size !== canonical.length)
          throw Error('Repeated member in collection: ' + f.id);
        for (const x of c.elements)
          if (Array.isArray(x) && new Set(x).size !== x.length)
            throw Error('Repeated nested member: ' + f.id);
      }
      for (const frame of f.frames)
        if (frame.highlight.some((x) => !keys.includes(x)))
          throw Error('Unknown highlighted collection: ' + f.id);
    }
    if (f.kind === 'venn') {
      if (
        new Set(f.universe).size !== f.universe.length ||
        [...f.a, ...f.b].some((x) => !f.universe.includes(x))
      )
        throw Error('Invalid finite sets: ' + f.id);
      for (const region of [0, 1, 2, 3])
        if (
          f.universe.filter((x) => (f.a.includes(x) ? 1 : 0) + (f.b.includes(x) ? 2 : 0) === region)
            .length > 5
        )
          throw Error('Too many labels in a set region: ' + f.id);
      if (new Set(f.a).size !== f.a.length || new Set(f.b).size !== f.b.length)
        throw Error('Repeated set element: ' + f.id);
    }
    if (f.kind === 'plot') {
      if (f.threshold !== undefined && f.threshold > f.xMax)
        throw Error('Threshold outside plot: ' + f.id);
      for (const series of f.series)
        if ((series.model === 'logarithm' || series.model === 'nlogn') && (series.base ?? 2) <= 1)
          throw Error('Logarithmic plot needs base greater than one: ' + f.id);
    }
    if (f.kind === 'mapping') {
      if (
        new Set(f.domain).size !== f.domain.length ||
        new Set(f.codomain).size !== f.codomain.length
      )
        throw Error('Repeated mapping element');
      for (const [a, b] of f.pairs)
        if (!f.domain.includes(a) || !f.codomain.includes(b))
          throw Error('Unknown mapping endpoint: ' + f.id);
    }
    if (f.kind === 'predicate-table') {
      if (
        f.values.length !== f.rows.length ||
        f.values.some((row) => row.length !== f.columns.length)
      )
        throw Error('Predicate table dimensions disagree: ' + f.id);
      if (new Set(f.rows).size !== f.rows.length || new Set(f.columns).size !== f.columns.length)
        throw Error('Repeated table label: ' + f.id);
      for (const frame of f.frames)
        for (const key of frame.highlight)
          if (
            ![...f.rows.map((x) => 'row:' + x), ...f.columns.map((x) => 'column:' + x)].includes(
              key,
            )
          )
            throw Error('Unknown table highlight: ' + f.id);
    }
    if (f.kind === 'flow' && f.frames.some((s) => s.steps && s.steps.length !== f.steps.length))
      throw Error('Flow frame changes layout length: ' + f.id);
    if (
      f.kind === 'flow' &&
      f.frames.some((s) => s.active !== undefined && s.active >= f.steps.length)
    )
      throw Error('Unknown active proof step');
    if (f.kind === 'board')
      for (const frame of f.frames) {
        if (!frame.regions?.length) throw Error('Missing board partition: ' + f.id);
        const counts = Array(f.rows * f.columns).fill(0);
        for (const [x, y, w, h] of frame.regions) {
          if (x + w > f.columns || y + h > f.rows)
            throw Error('Board region outside board: ' + f.id);
          for (let j = y; j < y + h; j++)
            for (let i = x; i < x + w; i++) counts[j * f.columns + i]++;
        }
        if (counts.some((n) => n !== 1))
          throw Error('Board partition overlaps or omits cells: ' + f.id);
      }
    if (f.kind === 'sum' && f.frames.some((s) => s.n === undefined))
      throw Error('A sum figure needs its finite n');
    for (const r of f.requires) if (!ids.has(r)) throw Error('Unknown figure prerequisite: ' + r);
  }
  return { references, figures, formulas };
}
export type TeachingData = Awaited<ReturnType<typeof loadTeaching>>;
export function teachingBlocks(markdown: string, teaching: TeachingData) {
  const pattern = /^!\[([^\]]*)\]\(figure:([a-z0-9-]+)\)\s*$/gm;
  const blocks: { id: string; kind: string; markdown?: string; figureId?: string }[] = [];
  let start = 0;
  for (const match of markdown.matchAll(pattern)) {
    const before = markdown.slice(start, match.index).trim();
    if (before) blocks.push({ id: 'text-before-' + match[2], kind: 'markdown', markdown: before });
    if (!teaching.figures.some((f) => f.id === match[2]))
      throw Error('Unknown figure placement: ' + match[2]);
    blocks.push({ id: match[2], kind: 'figure', figureId: match[2] });
    start = match.index! + match[0].length;
  }
  const after = markdown.slice(start).trim();
  if (after) blocks.push({ id: 'text-end', kind: 'markdown', markdown: after });
  if (blocks.some((b) => b.markdown && /!\[[^\]]*\]\(figure:/.test(b.markdown)))
    throw Error('A figure declaration must occupy its own line');
  return blocks;
}

// Match only aliases authored for this lesson. Cross-lesson links are explicit in the source.
// Do not touch TeX, code, existing links, or figure declarations.
export function linkTeachingTerms(markdown: string, lesson: string, teaching: TeachingData) {
  if (/ref:[^)]*\[/.test(markdown)) throw Error('Malformed nested reference target');
  const seen = new Set<string>();
  const aliases = teaching.references
    .filter((r) => r.lesson === lesson && r.kind === 'term')
    .flatMap((r) => (r.linkAliases ?? r.aliases).map((alias) => ({ alias, id: r.id })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const escaped = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = aliases.length
    ? new RegExp(
        '(?<![a-zA-Z])(' + aliases.map((a) => escaped(a.alias)).join('|') + ')(?![a-zA-Z])',
        'gi',
      )
    : null;
  const protectedParts =
    /(^#{1,6} .*$|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|```[\s\S]*?```|`[^`]*`|!?\[[^\]]*\]\([^)]*\))/gm;
  return markdown
    .split(protectedParts)
    .map((part, index) =>
      index % 2
        ? part.replace(/\[([^\]]+)\]\(ref:([a-z0-9-]+)(?:\?repeat)?\)/g, (_match, word, id) => {
            const repeat = seen.has(id);
            seen.add(id);
            return '[' + word + '](ref:' + id + (repeat ? '?repeat' : '') + ')';
          })
        : pattern
          ? part.replace(pattern, (word: string) => {
              const entry = aliases.find((a) => a.alias.toLowerCase() === word.toLowerCase())!;
              const repeated = seen.has(entry.id);
              seen.add(entry.id);
              return '[' + word + '](ref:' + entry.id + (repeated ? '?repeat' : '') + ')';
            })
          : part,
    )
    .join('');
}
