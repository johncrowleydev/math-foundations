import { createHash } from 'node:crypto';
import { z } from 'zod';
import { readYaml, validateMath, type loadContent } from './content.js';
import { adaptNotebookQuestion, assertSelfContained } from './notebook-exercises.js';
import { inlinePlacements } from './notebook-placements.js';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const entry = z
  .object({
    after: z.string().min(1),
    instructions: z.string(),
    prompt: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    concepts: z.array(z.string().min(1)).min(1),
    requires: z
      .array(z.object({ lesson: z.string(), section: z.string(), teachingHash: hash }).strict())
      .min(1),
    exerciseHash: hash,
  })
  .strict();
export const inlineAudit = z
  .record(z.string(), z.record(z.string(), entry))
  .parse(await readYaml('content/inline-prerequisites.yaml'));
type Lessons = Awaited<ReturnType<typeof loadContent>>['lessons'];
type Question = ReturnType<typeof adaptNotebookQuestion> & { section: string };
export const auditHash = (text: string) =>
  createHash('sha256').update(text.replace(/\s+/g, ' ').trim()).digest('hex');
export function exerciseHash(q: Question) {
  return auditHash(
    JSON.stringify({
      instructions: q.instructions,
      prompt: q.prompt,
      math: q.math || '',
      answer: q.answer,
      table: q.table || null,
      section: q.section,
    }),
  );
}
export function teachingSections(markdown: string) {
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((chunk) => ({
      title: chunk.slice(0, chunk.indexOf('\n')).trim(),
      text: chunk.slice(chunk.indexOf('\n')).trim(),
    }));
}
export function adaptInlineQuestion(slug: string, q: Question, audit = inlineAudit) {
  const checked = audit[slug]?.[q.id];
  if (!checked) return q;
  const result = {
    ...q,
    section: checked.after,
  };
  if (
    checked.instructions !== q.instructions ||
    checked.prompt !== q.prompt ||
    checked.answer !== q.answer
  )
    throw new Error(`Re-audit changed inline exercise: ${slug}/${q.id}`);
  assertSelfContained(
    `${result.instructions}\n${result.prompt}\n${result.answer}`,
    `${slug}/${q.id}`,
  );
  validateMath(`${result.instructions}\n${result.prompt}\n${result.answer}`);
  if (exerciseHash(result) !== checked.exerciseHash)
    throw new Error(`Re-audit changed inline exercise: ${slug}/${q.id}`);
  return result;
}

export function validateInlinePrerequisites(
  lessons: Lessons,
  audit = inlineAudit,
  placements = inlinePlacements,
) {
  const slugs = lessons.map((l) => l.slug);
  if (Object.keys(audit).some((slug) => !slugs.includes(slug)))
    throw new Error('Unknown lesson in inline audit');
  for (const [lessonIndex, lesson] of lessons.entries()) {
    const sections = teachingSections(lesson.markdown);
    const expected = Object.values(placements[lesson.slug])
      .flat()
      .sort((a, b) => a - b);
    const audited = Object.keys(audit[lesson.slug] || {})
      .map(Number)
      .sort((a, b) => a - b);
    if (JSON.stringify(expected) !== JSON.stringify(audited))
      throw new Error(`Every inline exercise must have exactly one audit: ${lesson.slug}`);
    for (const id of expected) {
      const checked = audit[lesson.slug][id];
      if (!placements[lesson.slug][checked.after]?.includes(id))
        throw new Error(`Placement differs from audited teaching section: ${lesson.slug}/${id}`);
      const position = sections.findIndex((s) => s.title === checked.after);
      if (position < 0) throw new Error(`Missing exercise teaching section: ${checked.after}`);
      for (const requirement of checked.requires) {
        const sourceIndex = slugs.indexOf(requirement.lesson);
        const sources = sourceIndex < 0 ? [] : teachingSections(lessons[sourceIndex].markdown);
        const sourcePosition = sources.findIndex((s) => s.title === requirement.section);
        if (sourceIndex < 0 || sourcePosition < 0)
          throw new Error(`Missing prerequisite: ${requirement.section}`);
        if (sourceIndex > lessonIndex || (sourceIndex === lessonIndex && sourcePosition > position))
          throw new Error(`Untaught prerequisite for ${lesson.slug}/${id}: ${requirement.section}`);
        if (auditHash(sources[sourcePosition].text) !== requirement.teachingHash)
          throw new Error(
            `Re-audit changed prerequisite for ${lesson.slug}/${id}: ${requirement.section}`,
          );
      }
      const sourceSection = lesson.worksheetData!.sections.find((s) =>
        s.questions.some((q) => q.id === id),
      )!;
      const q = sourceSection.questions.find((q) => q.id === id)!;
      adaptInlineQuestion(
        lesson.slug,
        {
          ...adaptNotebookQuestion(lesson.slug, q, sourceSection.instructions || ''),
          section: sourceSection.title.replace(/^[A-Z]\. /, ''),
        },
        audit,
      );
    }
  }
}
