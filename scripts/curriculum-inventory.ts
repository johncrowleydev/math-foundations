import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inlineAudit } from './inline-prerequisites.js';

// This inventory records authored dependencies and reading units. It does not infer
// that a keyword match is an adequate introduction or assign manual audit approval.
const notebook = JSON.parse(await readFile('output/content/notebook.json', 'utf8'));
const teaching = JSON.parse(await readFile('output/content/teaching.json', 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const units: any[] = [];
const introductions = JSON.parse(await readFile('content/concept-introductions.json', 'utf8'));
const renderedFields = (blocks: any[]) =>
  Object.fromEntries(
    blocks.filter((b) => b.kind === 'markdown').map((b) => ['block:' + b.id, b.markdown]),
  );
for (const e of introductions) {
  const lesson = notebook.lessons.find((l: any) => l.slug === e.lesson);
  const passage = (
    e.section === 'Introduction'
      ? lesson?.intro
      : lesson?.sections.find((s: any) => s.title === e.section)?.markdown
  )?.replace(/\r\n/g, '\n');
  if (!passage || passage.slice(e.start, e.end) !== e.quote)
    throw new Error('Stale introduction evidence: ' + e.concept);
}
if (new Set(introductions.map((e: any) => e.concept)).size !== introductions.length)
  throw new Error('Duplicate introduction evidence');
const add = (
  lesson: string,
  source: string,
  position: any,
  fields: Record<string, string>,
  requirements: string[] = [],
) => {
  const formulaContexts = teaching.formulas.filter(
    (f: any) => f.lesson === lesson && (f.source === source || f.source.startsWith(source + ':')),
  );
  const linkedUses = Object.entries(fields).flatMap(([field, text]) =>
    [...text.matchAll(/\[[^\[\]]+\]\(ref:([a-z0-9-]+)(?:\?repeat)?\)/g)].map((m) => ({
      concept: m[1],
      field,
      offset: m.index,
      excerpt: text.slice(Math.max(0, m.index! - 60), m.index! + m[0].length + 100),
    })),
  );
  units.push({
    lesson,
    source,
    position,
    hash: hash(fields),
    fields,
    linkedUses,
    formulaContexts: formulaContexts.map((f: any) => ({
      id: f.id,
      source: f.source,
      ordinal: f.ordinal,
      latex: f.latex,
      reading: f.reading,
      bindings: f.bindings,
    })),
    requirements,
  });
};
for (const l of notebook.lessons) {
  add(l.slug, 'intro', { section: -1 }, { text: l.intro, ...renderedFields(l.introBlocks) });
  for (const [index, s] of l.sections.entries()) {
    add(
      l.slug,
      'section:' + s.id,
      { section: index },
      { title: s.title, text: s.markdown, ...renderedFields(s.blocks) },
    );
    for (const c of s.quickChecks)
      add(
        l.slug,
        'quick:' + c.id,
        { section: index, afterTeaching: true },
        {
          prompt: c.prompt,
          ...Object.fromEntries(c.options.map((o: string, i: number) => ['option:' + i, o])),
          explanation: c.explanation,
        },
      );
  }
  for (const q of l.questions) {
    // Promoted checks are the same authored unit inventoried above as quick:<id>.
    if (q.quickSource) continue;
    const inline = l.sections.findIndex((s: any) => s.questionIds.includes(q.id));
    add(
      l.slug,
      'question:' + q.id,
      {
        section: inline < 0 ? l.sections.length : inline,
        afterTeaching: true,
        mode: inline < 0 ? 'practice' : 'inline',
      },
      {
        instructions: q.instructions,
        prompt: q.prompt ?? '',
        math: q.math ?? '',
        tableRows: q.table ? String(q.table.rows) : '',
        answer: q.answer ?? '',
        ...Object.fromEntries(
          (Array.isArray(q.table?.rows) ? q.table.rows : []).flatMap((row: string[], i: number) =>
            row.map((cell: string, j: number) => ['cell:' + i + ':' + j, cell]),
          ),
        ),
        ...Object.fromEntries(
          (q.table?.columns ?? []).map((x: string, i: number) => ['column:' + i, x]),
        ),
      },
      inlineAudit[l.slug]?.[q.id]?.concepts ?? [],
    );
  }
}
for (const f of teaching.figures) {
  const l = notebook.lessons.find((l: any) => l.slug === f.lesson);
  const s = l.sections.find((s: any) => s.title === f.section);
  add(
    f.lesson,
    'figure:' + f.id,
    { section: l.sections.indexOf(s), block: s.blocks.findIndex((b: any) => b.figureId === f.id) },
    {
      title: f.title,
      ...Object.fromEntries(f.frames.map((x: any, i: number) => ['frame:' + i, x.text])),
      ...Object.fromEntries(
        Object.entries(f.mathLabels).map(([k, v]) => ['label:' + k, String(v)]),
      ),
      creation: f.creation,
      limitations: f.limitations,
    },
    f.requires,
  );
}
const concepts = teaching.references.map((r: any) => ({
  id: r.id,
  kind: r.kind,
  introductionEvidence: introductions.find((e: any) => e.concept === r.id) ?? null,
  teaching: { lesson: r.lesson, section: r.section },
  uses: units.flatMap((u) => [
    ...u.linkedUses
      .filter((x: any) => x.concept === r.id)
      .map((x: any) => ({ lesson: u.lesson, source: u.source, field: x.field, offset: x.offset })),
    ...u.formulaContexts.flatMap((f: any) =>
      f.bindings
        .filter((b: any) => b.reference === r.id)
        .map((b: any) => ({
          lesson: u.lesson,
          source: f.source,
          ordinal: f.ordinal,
          symbol: b.symbol,
        })),
    ),
    ...(u.requirements.includes(r.id)
      ? [{ lesson: u.lesson, source: u.source, requirement: true }]
      : []),
  ]),
}));
const counts = {
  lessons: notebook.lessons.length,
  exercises: units.filter((u) => u.source.startsWith('question:')).length,
  quickChecks: units.filter((u) => u.source.startsWith('quick:')).length,
  figures: teaching.figures.length,
  formulas: teaching.formulas.length,
  concepts: concepts.length,
};
if (counts.lessons !== 27 || counts.exercises !== 2010 || counts.quickChecks !== 50)
  throw new Error('Curriculum coverage changed: ' + JSON.stringify(counts));
await mkdir('output', { recursive: true });
await writeFile(
  'output/curriculum-inventory.json',
  JSON.stringify(
    {
      notice:
        'Authored dependency inventory; manual introduction evidence is recorded separately. Unlinked concepts must also be checked in the complete reading pass.',
      counts,
      concepts,
      units,
    },
    null,
    2,
  ) + '\n',
);
console.log(counts);
