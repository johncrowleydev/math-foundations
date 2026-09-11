import { mkdir, writeFile } from 'node:fs/promises';
import { loadContent } from './content.js';
import { placeNotebookExercises } from './notebook-placements.js';
import { adaptNotebookQuestion, validateNotebookAdaptations } from './notebook-exercises.js';
import { adaptInlineQuestion, validateInlinePrerequisites } from './inline-prerequisites.js';

const content = await loadContent();
validateNotebookAdaptations(content.lessons);
validateInlinePrerequisites(content.lessons);
function forNotebook(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\(\.\.\/lessons\/[^)]+\)/g, '$1')
    .replace(/\[([^\]]+) worksheet\]\(\.\.\/worksheets\/[^)]+\)/gi, '$1 practice problems');
}
const lessons = content.lessons.map((lesson) => {
  const chunks = forNotebook(lesson.markdown).split(/^## /m);
  const intro = chunks.shift()!.trim();
  const questions = lesson.worksheetData!.sections.flatMap((section) =>
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
    title: lesson.title,
    eyebrow: lesson.eyebrow || content.course,
    intro,
    sections: sections.map((s, i) => ({ ...s, questionIds: sectionQuestionIds[i] })),
    questions,
    practiceIds,
  };
});
const dir = 'android/app/src/main/assets';
await mkdir(dir, { recursive: true });
await writeFile(
  `${dir}/notebook.json`,
  JSON.stringify({ currentLesson: content.currentLesson, lessons }),
);
console.log(
  `Android content: ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.questions.length, 0)} questions, ${lessons.reduce((n, l) => n + l.sections.reduce((s, c) => s + c.questionIds.length, 0), 0)} inline placements.`,
);
