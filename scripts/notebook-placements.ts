// Inline placement is authored explicitly in lesson MDX. No executable placement bank.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { extractLessonMetadata } from './lesson-metadata.js';

const manifest = parse(readFileSync('content/curriculum.yaml', 'utf8')) as {
  lessons: { slug: string; lesson: string; worksheet?: string }[];
};
export const inlinePlacements: Record<string, Record<string, number[]>> = Object.fromEntries(
  manifest.lessons
    .filter((lesson) => lesson.worksheet)
    .map((lesson) => [
      lesson.slug,
      extractLessonMetadata(readFileSync('content/' + lesson.lesson, 'utf8'), lesson.lesson)
        .components.exercises,
    ]),
);

export function placeNotebookExercises(slug: string, titles: string[], questionIds: number[]) {
  const placements = inlinePlacements[slug] ?? (questionIds.length === 0 ? {} : undefined);
  if (!placements) throw new Error(slug + ': missing inline exercise plan');
  const used = new Set<number>();
  const available = new Set(questionIds);
  for (const [title, ids] of Object.entries(placements)) {
    if (title === 'Practice' || titles.filter((t) => t === title).length !== 1)
      throw new Error(slug + ': missing or ambiguous teaching heading: ' + title);
    for (const id of ids) {
      if (used.has(id) || !available.has(id))
        throw new Error(slug + ': invalid or duplicate inline exercise ' + id);
      used.add(id);
    }
  }
  return {
    sectionQuestionIds: titles.map((title) => placements[title] || []),
    practiceIds: questionIds.filter((id) => !used.has(id)),
  };
}
