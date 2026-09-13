import { z } from 'zod';
import { readYaml, validateMath, type Worksheet } from './content.js';

const copy = z
  .record(
    z.string(),
    z.record(
      z.string(),
      z
        .object({
          instructions: z.string(),
          prompt: z.string().min(1),
          answer: z.string().min(1),
        })
        .strict(),
    ),
  )
  .parse(await readYaml('content/exercise-copy.yaml'));
type Question = Worksheet['sections'][number]['questions'][number];

export function validateNotebookAdaptations(
  lessons: { slug: string; worksheetData?: Worksheet }[],
) {
  const known = new Set(lessons.filter((l) => l.worksheetData).map((l) => l.slug));
  if (Object.keys(copy).length !== known.size || Object.keys(copy).some((s) => !known.has(s)))
    throw new Error('Exercise copy must cover exactly the known lessons');
  for (const lesson of lessons) {
    const ids = new Set(
      lesson.worksheetData?.sections.flatMap((s) => s.questions.map((q) => q.id)),
    );
    const editedIds = Object.keys(copy[lesson.slug] || {}).map(Number);
    if (editedIds.length !== ids.size || editedIds.some((id) => !ids.has(id)))
      throw new Error('Exercise copy must cover every question: ' + lesson.slug);
  }
}

export function assertSelfContained(text: string, label: string) {
  const printedReference =
    /worksheet|answer key|student section|blank (?:response )?space|\b(?:for|in) \d+\s*[-–]\s*\d+|\bquestion \d+|\bas in \d+|\b(?:previous|preceding) (?:question|problem|proof|algorithm|graph|digraph|loop|data|theorem|union)|\bsame (?:group|roles)|lesson(?:'s)? (?:convention|definition)/i;
  if (printedReference.test(text))
    throw new Error('Notebook exercise still depends on printed context: ' + label);
}

export function adaptNotebookQuestion(
  slug: string,
  question: Question,
  _sectionInstructions: string,
) {
  const edited = copy[slug]?.[question.id];
  if (!edited) throw new Error('Missing self-contained exercise copy: ' + slug + '/' + question.id);
  const result = { ...question, ...edited };
  const text = result.prompt + '\n' + result.instructions + '\n' + result.answer;
  assertSelfContained(text, slug + '/' + question.id);
  validateMath(text);
  return result;
}
