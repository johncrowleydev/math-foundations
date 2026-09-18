import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const text = z.string().trim().min(1);
const ids = z
  .array(text)
  .min(1)
  .refine((v) => new Set(v).size === v.length, 'Duplicate citation');
const url = z.url().refine((v) => v.startsWith('https://'), 'Use an HTTPS source');
const schema = z
  .object({
    version: z.literal(1),
    bibliography: z.record(
      text,
      z.object({ title: text, author: text, edition: text, url }).strict(),
    ),
    citations: z.record(
      text,
      z
        .object({ source: text, locator: text, url, supports: text, checked: z.iso.date() })
        .strict(),
    ),
    lessons: z.record(
      text,
      z
        .object({
          reviewedContentHash: text,
          intro: ids,
          sections: z.record(text, ids),
          practice: z.record(text, ids),
        })
        .strict(),
    ),
    reviewTemplates: z
      .record(text, z.object({ reviewedContentHash: text, sources: ids }).strict())
      .default({}),
    syntax: z.object({ reviewedContentHash: text, entries: z.record(text, ids) }).strict(),
  })
  .strict();

type Lesson = {
  slug: string;
  sections: { id: string; title: string }[];
  questions: { id: number; section: string }[];
};
type Teaching = {
  references: { id: string; lesson: string; section: string }[];
  figures: { id: string; lesson: string; section: string }[];
  formulas: { id: string; lesson: string }[];
};
type Syntax = { entries: { id: string }[] };
type Typing = { basics: { id: string }[]; placements: { lesson: string }[] };
export const sourceHash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function lessonSourceHash(lesson: Lesson, teaching: Teaching, typing: Typing) {
  return sourceHash({
    lesson,
    references: teaching.references.filter((r) => r.lesson === lesson.slug),
    figures: teaching.figures.filter((f) => f.lesson === lesson.slug),
    formulas: teaching.formulas.filter((f) => f.lesson === lesson.slug),
    placements: typing.placements.filter((p) => p.lesson === lesson.slug),
  });
}
export function validateSources(
  raw: unknown,
  lessons: Lesson[],
  teaching: Teaching,
  syntax: Syntax,
  typing: Typing,
  reviewTemplates: { id: string; sourceIds: string[] }[] = [],
) {
  const catalog = schema.parse(raw);
  const targets: Record<string, string[]> = {};
  const used = new Set<string>();
  const assign = (key: string, references: string[] | undefined) => {
    if (!references?.length) throw Error(`Missing sources: ${key}`);
    for (const id of references) {
      if (!catalog.citations[id]) throw Error(`Unknown citation ${id}: ${key}`);
      used.add(id);
    }
    targets[key] = references;
  };
  const exactKeys = (actual: string[], expected: string[], label: string) => {
    if (actual.length !== expected.length || actual.some((k) => !expected.includes(k)))
      throw Error(`Source coverage mismatch: ${label}`);
  };
  exactKeys(
    Object.keys(catalog.lessons),
    lessons.map((l) => l.slug),
    'lessons',
  );
  for (const [id, citation] of Object.entries(catalog.citations)) {
    if (!catalog.bibliography[citation.source]) throw Error(`Unknown bibliography source: ${id}`);
  }
  for (const lesson of lessons) {
    const authored = catalog.lessons[lesson.slug];
    if (authored.reviewedContentHash !== lessonSourceHash(lesson, teaching, typing))
      throw Error(
        `Sources need reinspection after content changes: ${lesson.slug}. See docs/content-sources.md.`,
      );
    assign(`${lesson.slug}/intro`, authored.intro);
    exactKeys(
      Object.keys(authored.sections),
      lesson.sections.map((s) => s.id),
      lesson.slug + ' sections',
    );
    for (const section of lesson.sections)
      assign(`${lesson.slug}/${section.id}`, authored.sections[section.id]);
    const practice = [...new Set(lesson.questions.map((q) => q.section))];
    exactKeys(Object.keys(authored.practice), practice, lesson.slug + ' exercise groups');
    for (const question of lesson.questions)
      assign(`exercise:${lesson.slug}-${question.id}`, authored.practice[question.section]);
    for (const kind of ['references', 'figures'] as const) {
      for (const item of teaching[kind].filter((r) => r.lesson === lesson.slug)) {
        const section = lesson.sections.find(
          (s) => s.title === item.section || s.id === item.section,
        );
        if (!section && item.section !== 'Introduction')
          throw Error(`Unknown source teaching location: ${item.id}`);
        assign(
          `${kind === 'references' ? 'reference' : 'figure'}:${item.id}`,
          section ? authored.sections[section.id] : authored.intro,
        );
      }
    }
  }
  exactKeys(
    Object.keys(catalog.reviewTemplates),
    reviewTemplates.map((t) => t.id),
    'review templates',
  );
  for (const template of reviewTemplates) {
    const authored = catalog.reviewTemplates[template.id];
    if (authored.reviewedContentHash !== sourceHash(template))
      throw Error('Review template sources need reinspection: ' + template.id);
    if (JSON.stringify(authored.sources) !== JSON.stringify(template.sourceIds))
      throw Error('Review template source assignment mismatch: ' + template.id);
    assign('review:' + template.id, authored.sources);
  }
  if (catalog.syntax.reviewedContentHash !== sourceHash({ syntax, typing }))
    throw Error('TeX sources need reinspection after content changes');
  const syntaxIds = [...syntax.entries, ...typing.basics].map((e) => e.id);
  exactKeys(Object.keys(catalog.syntax.entries), syntaxIds, 'TeX constructions');
  for (const id of syntaxIds) assign(`syntax:${id}`, catalog.syntax.entries[id]);
  for (const id of Object.keys(catalog.citations))
    if (!used.has(id)) throw Error(`Unused citation: ${id}`);
  return {
    version: catalog.version,
    bibliography: catalog.bibliography,
    citations: catalog.citations,
    targets,
  };
}
export async function loadSources(
  lessons: Lesson[],
  teaching: Teaching,
  reviewTemplates: { id: string; sourceIds: string[] }[] = [],
) {
  const [raw, syntax, typing] = await Promise.all(
    ['content/sources.json', 'content/tex-syntax.json', 'content/tex-teaching.json'].map(
      async (file) => JSON.parse(await readFile(file, 'utf8')),
    ),
  );
  return validateSources(raw, lessons, teaching, syntax, typing, reviewTemplates);
}
