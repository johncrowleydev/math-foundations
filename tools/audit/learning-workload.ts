import { readFile } from 'node:fs/promises';
import { classifyReviewCost } from '../../shared/reviewCost.js';
import { exerciseKey } from '../../web/src/exerciseIdentity.js';
import type { EvidenceCatalog } from '../../web/src/evidenceTypes.js';
type Question = Parameters<typeof classifyReviewCost>[0] & { id: number };
type Lesson = {
  slug: string;
  exerciseNamespace?: string;
  questions: Question[];
  sections: { questionIds: number[]; quickChecks: { exerciseId?: number }[] }[];
};

// Compare snapshots assembled through the normal content pipeline. This reports
// planning estimates; it neither authors content nor measures learner performance.
// Usage: tsx tools/audit/learning-workload.ts <snapshot.json|current> [lesson-slugs...]
const [input = 'current', ...slugs] = process.argv.slice(2);
const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
type Template = { lesson: string; skill: string; concept: string; objective?: string };
const snapshot: {
  lessons: Lesson[];
  evidence: EvidenceCatalog;
  reviewTemplates: Template[];
} =
  input === 'current'
    ? {
        ...(await read('output/content/notebook.json')),
        evidence: await read('output/content/learning-evidence.json'),
        reviewTemplates: await read('content/review-templates.json'),
      }
    : await read(input);
function workload(lesson: Lesson, questions: Question[]) {
  const costs = questions.map((question) =>
    classifyReviewCost(
      question,
      snapshot.evidence.exercises[exerciseKey(lesson, question.id)]?.skills
        .filter((skill) => skill.role === 'primary')
        .map((skill) => skill.skill),
    ),
  );
  return {
    exercises: costs.length,
    proofs: costs.filter((cost) => cost.category === 'proof').length,
    deepReasoning: costs.filter((cost) => cost.category === 'deep-reasoning').length,
    short: costs.filter((cost) => cost.estimatedSeconds <= 120).length,
    estimatedMinutes: Math.round(costs.reduce((n, cost) => n + cost.estimatedSeconds, 0) / 60),
  };
}
console.log(
  JSON.stringify(
    snapshot.lessons
      .filter((lesson) => slugs.length === 0 || slugs.includes(lesson.slug))
      .map((lesson) => {
        const ids = new Set(
          lesson.sections.flatMap((section) => [
            ...section.questionIds,
            ...section.quickChecks.flatMap((check) =>
              check.exerciseId === undefined ? [] : [check.exerciseId],
            ),
          ]),
        );
        const definitions = snapshot.reviewTemplates.filter(
          (template) => template.lesson === lesson.slug && template.skill === 'recall',
        );
        return {
          lesson: lesson.slug,
          fullBank: workload(lesson, lesson.questions),
          recommended: workload(
            lesson,
            lesson.questions.filter((question) => ids.has(question.id)),
          ),
          definitionTemplates: definitions.length,
          definitionObjectives: new Set(
            definitions.map((template) => [template.concept, template.objective || ''].join(':')),
          ).size,
        };
      }),
    null,
    2,
  ),
);
