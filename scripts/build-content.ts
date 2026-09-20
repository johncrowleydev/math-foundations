import { exerciseKey, validateExerciseKeys } from '../web/src/exerciseIdentity.js';
import { mathOccurrences, validateFormulaContexts, type FormulaSource } from './formula-context.js';
import { loadTeaching, teachingBlocks, linkTeachingTerms } from './teaching.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { loadContent } from './content.js';
import { createHash } from 'node:crypto';
import { placeNotebookExercises } from './notebook-placements.js';
import { adaptNotebookQuestion, validateNotebookAdaptations } from './notebook-exercises.js';
import { adaptInlineQuestion, validateInlinePrerequisites } from './inline-prerequisites.js';
import { quickChecks, validateQuickChecks } from './quick-checks.js';
import { promoteChoices } from './choice-exercises.js';
import { promoteDeterministic } from './deterministic-exercises.js';
import { loadEvidence } from './evidence.js';
import { snapshot } from '../web/src/evidenceTypes.js';
import { loadSources } from './sources.js';
import { loadReviewTemplates } from './review-templates.js';

const content = await loadContent();
const teaching = await loadTeaching();
validateNotebookAdaptations(content.lessons);
validateInlinePrerequisites(content.lessons);
validateQuickChecks(content.lessons);
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
      lesson.number ?? content.lessons.filter((l) => l.subject === lesson.subject).indexOf(lesson),
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
// Authoring inventory does not validate or publish assets; the normal build always enforces coverage.
if (process.argv.includes('--inventory-only')) {
  const inventory = formulaSources.flatMap((s) =>
    mathOccurrences(s.markdown).map((latex, ordinal) => ({
      lesson: s.lesson,
      source: s.source,
      ordinal,
      latex,
      hasExplanation: false,
    })),
  );
  await mkdir('output', { recursive: true });
  await writeFile('output/formula-inventory.json', JSON.stringify(inventory, null, 2) + '\n');
  console.log(
    `Inventoried ${inventory.length} formula occurrences; no assets written or audit status assigned.`,
  );
  process.exit(0);
}
const formulaInventory = validateFormulaContexts(formulaSources, teaching);
const missingFormulaContexts = formulaInventory.filter((f) => !f.hasExplanation);
if (missingFormulaContexts.length)
  throw new Error(
    'Missing contextual formula explanations: ' +
      JSON.stringify(missingFormulaContexts.slice(0, 10)),
  );
await mkdir('output', { recursive: true });
await writeFile('output/formula-inventory.json', JSON.stringify(formulaInventory, null, 2) + '\n');
const dir = 'output/content';
const publishedLessons = promoteDeterministic(promoteChoices(lessons));
validateExerciseKeys(publishedLessons);
const evidence = await loadEvidence(publishedLessons);
const reviewTemplates = await loadReviewTemplates(
  evidence,
  publishedLessons.map((l) => l.slug),
);
const sources = await loadSources(publishedLessons, teaching, reviewTemplates);
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/sources.json`, JSON.stringify(sources));
await writeFile(`${dir}/review-templates.json`, JSON.stringify(reviewTemplates));
await writeFile(`${dir}/learning-evidence.json`, JSON.stringify(evidence));
await writeFile(
  `${dir}/notebook.json`,
  JSON.stringify({ currentLesson: content.currentLesson, lessons: publishedLessons }),
);
await writeFile(`${dir}/teaching.json`, JSON.stringify(teaching));
await writeFile(`${dir}/reading-order-v7.json`, await readFile('content/reading-order-v7.json'));
console.log(
  `Curriculum: ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.questions.length, 0)} questions, ${lessons.reduce((n, l) => n + l.sections.reduce((s, c) => s + c.questionIds.length, 0), 0)} inline placements.`,
);

await writeFile(`${dir}/tex-syntax.json`, await readFile('content/tex-syntax.json'));

await writeFile(`${dir}/tex-teaching.json`, await readFile('content/tex-teaching.json'));

// The grader sees precisely the adapted questions shipped in the app, not worksheet originals.
const gradingVersion = createHash('sha256')
  .update(JSON.stringify({ publishedLessons, evidence, reviewTemplates }))
  .digest('hex');
const gradingExercises = Object.fromEntries(
  publishedLessons.flatMap((lesson) =>
    lesson.questions.map((q) => {
      const placement = lesson.sections.findIndex((s) => s.questionIds.includes(q.id));
      const preceding = placement < 0 ? lesson.sections : lesson.sections.slice(0, placement + 1);
      const blocks = [...(lesson.introBlocks || []), ...preceding.flatMap((s) => s.blocks)];
      const figureIds = new Set(blocks.filter((b) => b.kind === 'figure').map((b) => b.figureId));
      const referenced = JSON.stringify({ q, blocks });
      const referenceIds = new Set([...referenced.matchAll(/ref:([a-z0-9-]+)/g)].map((m) => m[1]));
      return [
        exerciseKey(lesson, q.id),
        {
          lesson: lesson.title,
          analytics: snapshot(evidence, exerciseKey(lesson, q.id)),
          choice: q.choice,
          assessment: q.assessment,
          question: {
            instructions: q.instructions,
            prompt: q.prompt,
            math: q.math,
            officialAnswer: q.answer,
            table: q.table,
          },
          introduction: lesson.intro,
          teaching: preceding.map((s) => ({
            title: s.title,
            markdown: s.markdown,
            blocks: s.blocks,
          })),
          figures: teaching.figures.filter((f) => figureIds.has(f.id)),
          definitions: teaching.references.filter((r) => referenceIds.has(r.id)),
        },
      ];
    }),
  ),
);
await writeFile(
  'output/grading-catalog.json',
  JSON.stringify({ version: gradingVersion, exercises: gradingExercises, reviewTemplates }),
);
await writeFile(`${dir}/grading-version.json`, JSON.stringify({ version: gradingVersion }));
