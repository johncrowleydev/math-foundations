import { z } from 'zod';
import { readYaml, validateMath, type Worksheet } from './content.js';

const rule = z
  .object({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    context: z.string().min(1),
  })
  .strict()
  .refine((r) => r.to >= r.from);
const override = z
  .object({
    prompt: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
  })
  .strict();
const schema = z
  .object({
    defaults: z.record(z.string(), z.string().min(1)),
    rules: z.record(z.string(), z.array(rule)),
    overrides: z.record(z.string(), z.record(z.string().regex(/^[1-9]\d*$/), override)),
  })
  .strict();
const adaptations = schema.parse(await readYaml('content/notebook-adaptations.yaml'));
type Question = Worksheet['sections'][number]['questions'][number];

export function validateNotebookAdaptations(
  lessons: { slug: string; worksheetData?: Worksheet }[],
) {
  const known = new Set(lessons.map((l) => l.slug));
  for (const group of [adaptations.defaults, adaptations.rules, adaptations.overrides]) {
    for (const slug of Object.keys(group))
      if (!known.has(slug)) throw new Error('Unknown notebook lesson: ' + slug);
  }
  for (const lesson of lessons) {
    const ids = new Set(
      lesson.worksheetData?.sections.flatMap((s) => s.questions.map((q) => q.id)),
    );
    const scoped = new Set<number>();
    for (const r of adaptations.rules[lesson.slug] || []) {
      for (let id = r.from; id <= r.to; id++) {
        if (!ids.has(id) || scoped.has(id))
          throw new Error('Invalid or overlapping notebook context: ' + lesson.slug + '/' + id);
        scoped.add(id);
      }
    }
    for (const id of Object.keys(adaptations.overrides[lesson.slug] || {})) {
      if (!ids.has(Number(id)))
        throw new Error('Unknown notebook question: ' + lesson.slug + '/' + id);
    }
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
  sectionInstructions: string,
) {
  const scoped = adaptations.rules[slug]?.find((r) => question.id >= r.from && question.id <= r.to);
  const instructions = [
    ...new Set(
      [adaptations.defaults[slug] || '', scoped ? scoped.context : sectionInstructions].filter(
        Boolean,
      ),
    ),
  ].join(' ');
  const result = { ...question, ...adaptations.overrides[slug]?.[question.id], instructions };
  const text = result.prompt + '\n' + instructions + '\n' + result.answer;
  assertSelfContained(text, slug + '/' + question.id);
  validateMath(text);
  return result;
}
