import { classifyReviewCost } from '../../shared/reviewCost.js';
import { exerciseKey, validateExerciseKeys } from '../../web/src/exerciseIdentity.js';
import { mathOccurrences, validateFormulaContexts } from './formula-context.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { promoteChoices } from './choice-exercises.js';
import { promoteDeterministic } from './deterministic-exercises.js';
import { loadEvidence } from './evidence.js';
import { snapshot } from '../../web/src/evidenceTypes.js';
import { loadSources } from './sources.js';
import { loadReviewTemplates } from './review-templates.js';
import { loadReviewVariants } from './review-variants.js';
import { gradingVersionFor } from './grading-version.js';

import { prepareNotebook } from './notebook.js';
const { content, teaching, lessons, formulaSources } = await prepareNotebook();
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
const publishedLessons = promoteDeterministic(promoteChoices(lessons));
validateExerciseKeys(publishedLessons);
const evidence = await loadEvidence(publishedLessons);
const reviewTemplates = await loadReviewTemplates(
  evidence,
  publishedLessons.map((l) => l.slug),
);
const reviewVariants = await loadReviewVariants(reviewTemplates);
const sources = await loadSources(publishedLessons, teaching, reviewTemplates, reviewVariants);
console.log(
  `Curriculum: ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.questions.length, 0)} questions, ${lessons.reduce((n, l) => n + l.sections.reduce((s, c) => s + c.questionIds.length, 0), 0)} inline placements.`,
);

// The grader sees precisely the adapted questions shipped in the app, not worksheet originals.
const representationHash = createHash('sha256')
  .update(JSON.stringify({ publishedLessons, evidence, reviewTemplates }))
  .digest('hex');
const gradingVersion = gradingVersionFor(representationHash);
const gradingExercises = Object.fromEntries(
  publishedLessons.flatMap((lesson) =>
    lesson.questions.map((q) => {
      const placement = lesson.sections.findIndex((s) => s.questionIds.includes(q.id));
      const preceding = placement < 0 ? lesson.sections : lesson.sections.slice(0, placement + 1);
      const blocks = [...(lesson.introBlocks || []), ...preceding.flatMap((s) => s.blocks)];
      const figureIds = new Set(blocks.filter((b) => b.kind === 'figure').map((b) => b.figureId));
      const referenced = JSON.stringify({ q, blocks });
      const referenceIds = new Set([...referenced.matchAll(/ref:([a-z0-9-]+)/g)].map((m) => m[1]));
      const evidenceLevel = evidence.exercises[exerciseKey(lesson, q.id)].attributes?.evidenceLevel;
      return [
        exerciseKey(lesson, q.id),
        {
          ...classifyReviewCost(
            q,
            evidence.exercises[exerciseKey(lesson, q.id)].skills
              .filter((s) => s.role === 'primary')
              .map((s) => s.skill),
            typeof evidenceLevel === 'string' ? evidenceLevel : undefined,
          ),
          lesson: lesson.title,
          lessonSlug: lesson.slug,
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
const copiedAssets = {
  'reading-order-v7.json': await readFile('content/reading-order-v7.json'),
  'tex-syntax.json': await readFile('content/tex-syntax.json'),
  'tex-teaching.json': await readFile('content/tex-teaching.json'),
};
if (process.argv.includes('--validate-only')) {
  console.log('Content validation passed; no artifacts written.');
} else {
  const dir = 'output/content';
  await mkdir(dir, { recursive: true });
  const artifacts = {
    'output/formula-inventory.json': JSON.stringify(formulaInventory, null, 2) + '\n',
    [`${dir}/sources.json`]: JSON.stringify(sources),
    [`${dir}/review-templates.json`]: JSON.stringify(reviewTemplates),
    [`${dir}/learning-evidence.json`]: JSON.stringify(evidence),
    [`${dir}/notebook.json`]: JSON.stringify({
      currentLesson: content.currentLesson,
      lessons: publishedLessons,
    }),
    [`${dir}/teaching.json`]: JSON.stringify(teaching),
    ...Object.fromEntries(
      Object.entries(copiedAssets).map(([name, bytes]) => [`${dir}/${name}`, bytes]),
    ),
    'output/grading-catalog.json': JSON.stringify({
      version: gradingVersion,
      exercises: gradingExercises,
      reviewTemplates,
      reviewVariants,
    }),
    [`${dir}/grading-version.json`]: JSON.stringify({ version: gradingVersion }),
  };
  for (const [path, bytes] of Object.entries(artifacts)) await writeFile(path, bytes);
}
