import { type FormulaSource } from './formula-context.js';
import { loadTeaching, teachingBlocks, linkTeachingTerms } from './teaching.js';
import { loadContent } from './content.js';
import { placeNotebookExercises } from './notebook-placements.js';
import { adaptNotebookQuestion, validateNotebookAdaptations } from './notebook-exercises.js';
import { adaptInlineQuestion, validateInlinePrerequisites } from './inline-prerequisites.js';
import { quickChecks, validateQuickChecks } from './quick-checks.js';

// Shared candidate assembly for publication and inspected authoring metadata.
export async function prepareNotebook() {
  const content = await loadContent();
  const teaching = await loadTeaching();
  validateNotebookAdaptations(content.lessons);
  validateInlinePrerequisites(content.lessons);
  validateQuickChecks(content.lessons);
  for (const lesson of content.lessons) {
    const expectedChecks = lesson.components.quickChecks;
    const checks: Record<string, string[]> = {};
    for (const check of quickChecks[lesson.slug] || []) (checks[check.after] ??= []).push(check.id);
    if (
      Object.keys(expectedChecks).length !== Object.keys(checks).length ||
      Object.entries(checks).some(
        ([section, ids]) => JSON.stringify(expectedChecks[section]) !== JSON.stringify(ids),
      )
    )
      throw new Error('MDX QuickCheck references differ from declared checks: ' + lesson.slug);
  }
  function forNotebook(markdown: string) {
    return markdown
      .replace(/\[([^\]]+)\]\(\.\.\/lessons\/[^)]+\)/g, '$1')
      .replace(/\[([^\]]+) worksheet\]\(\.\.\/worksheets\/[^)]+\)/gi, '$1 practice problems');
  }
  const lessons = content.lessons.map((lesson) => {
    const chunks = forNotebook(lesson.markdown).split(/^## /m);
    const intro = chunks.shift()!.trim();
    const questions = (lesson.worksheetData?.sections || []).flatMap((section) =>
      section.questions.map((q) =>
        adaptInlineQuestion(lesson.slug, {
          ...adaptNotebookQuestion(lesson.slug, q, section.instructions || ''),
          section: section.title.replace(/^[A-Z]\. /, ''),
        }),
      ),
    );
    const sections = chunks
      .map((chunk) => {
        const newline = chunk.indexOf('\n');
        return { title: chunk.slice(0, newline).trim(), markdown: chunk.slice(newline).trim() };
      })
      .filter((s) => s.title !== 'Practice');
    const { sectionQuestionIds, practiceIds } = placeNotebookExercises(
      lesson.slug,
      sections.map((s) => s.title),
      questions.map((q) => q.id),
    );
    return {
      slug: lesson.slug,
      ...(lesson.exerciseNamespace ? { exerciseNamespace: lesson.exerciseNamespace } : {}),
      subject: lesson.subject,
      number:
        lesson.number ??
        content.lessons.filter((l) => l.subject === lesson.subject).indexOf(lesson),
      title: lesson.title,
      eyebrow: lesson.eyebrow || content.course,
      intro,
      introBlocks: teachingBlocks(linkTeachingTerms(intro, lesson.slug, teaching), teaching),
      sections: sections.map((s, i) => ({
        ...s,
        id: s.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-$/, ''),
        blocks: teachingBlocks(linkTeachingTerms(s.markdown, lesson.slug, teaching), teaching),
        questionIds: sectionQuestionIds[i],
        quickChecks: (quickChecks[lesson.slug] || [])
          .filter((c) => c.after === s.title)
          .map((c) => ({
            ...c,
            prompt: linkTeachingTerms(c.prompt, lesson.slug, teaching),
            options: c.options.map((o) => linkTeachingTerms(o, lesson.slug, teaching)),
            explanation: linkTeachingTerms(c.explanation, lesson.slug, teaching),
          })),
      })),
      questions: questions.map((q) => ({
        ...q,
        instructions: linkTeachingTerms(q.instructions, lesson.slug, teaching),
        prompt: linkTeachingTerms(q.prompt || '', lesson.slug, teaching),
        answer: linkTeachingTerms(q.answer || '', lesson.slug, teaching),
      })),
      practiceIds,
    };
  });
  const formulaSources: FormulaSource[] = [];
  for (const lesson of lessons) {
    const add = (source: string, markdown: string) =>
      formulaSources.push({ lesson: lesson.slug, source, markdown });
    const blocks = (prefix: string, items: ReturnType<typeof teachingBlocks>) =>
      items.forEach((b) => {
        if (b.kind === 'markdown') add(prefix + ':' + b.id, b.markdown!);
      });
    blocks('intro', lesson.introBlocks);
    for (const section of lesson.sections) {
      blocks('section:' + section.id, section.blocks);
      for (const check of section.quickChecks) {
        add(`quick:${check.id}:prompt`, check.prompt);
        check.options.forEach((o, i) => add(`quick:${check.id}:option:${i}`, o));
        add(`quick:${check.id}:explanation`, check.explanation);
      }
    }
    for (const q of lesson.questions) {
      add(`question:${q.id}:instructions`, q.instructions);
      add(`question:${q.id}:prompt`, q.prompt || '');
      if (q.math) add(`question:${q.id}:math`, '$$' + q.math + '$$');
      add(`question:${q.id}:answer`, q.answer || '');
      q.table?.columns?.forEach((c, i) => add(`question:${q.id}:column:${i}`, '$' + c + '$'));
    }
  }
  for (const figure of teaching.figures)
    figure.frames.forEach((f, i) =>
      formulaSources.push({
        lesson: figure.lesson,
        source: `figure:${figure.id}:frame:${i}`,
        markdown: f.text,
      }),
    );
  for (const figure of teaching.figures)
    for (const [label, latex] of Object.entries(figure.mathLabels))
      formulaSources.push({
        lesson: figure.lesson,
        source: `figure:${figure.id}:label:${label}`,
        markdown: '$$' + latex + '$$',
      });
  for (const figure of teaching.figures)
    for (const field of ['creation', 'limitations'] as const)
      formulaSources.push({
        lesson: figure.lesson,
        source: `figure:${figure.id}:${field}`,
        markdown: figure[field],
      });
  return { content, teaching, lessons, formulaSources };
}
