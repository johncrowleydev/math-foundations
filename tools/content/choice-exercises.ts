import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { validateMath } from './content.js';

const option = z.object({ id: z.string(), text: z.string().min(1), feedback: z.string().min(1) });
const entry = z.object({
  lesson: z.string(),
  id: z.number().int(),
  sourceHash: z.string(),
  rationale: z.string(),
  options: z.array(option).min(2).max(4),
  correctOption: z.string(),
});
export const choiceExercises = z
  .array(entry)
  .parse(JSON.parse(await readFile('content/choice-exercises.json', 'utf8')));
export const knowledgeExercises = z
  .array(z.object({ lesson: z.string(), quick: z.string(), exercise: z.number().int().positive() }))
  .parse(JSON.parse(await readFile('content/knowledge-check-exercises.json', 'utf8')));
const feedbackEntries = z
  .array(
    z.object({
      lesson: z.string(),
      id: z.number().int(),
      sourceHash: z.string(),
      responses: z.record(z.string(), z.string().min(1)),
    }),
  )
  .parse(JSON.parse(await readFile('content/choice-feedback.json', 'utf8')));
export type ChoiceAssessment = { options: z.infer<typeof option>[]; correctOption: string };
type Q = {
  id: number;
  instructions: string;
  prompt?: string;
  math?: string;
  answer?: string;
  section: string;
  table?: { columns: string[]; rows: number };
  choice?: ChoiceAssessment;
  quickSource?: string;
};
type Check = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  exerciseId?: number;
};
type S = { title: string; questionIds: number[]; quickChecks: Check[] };
export function promoteChoices<
  L extends { slug: string; questions: Q[]; sections: S[]; practiceIds: number[] },
>(lessons: L[]): (Omit<L, 'questions'> & { questions: Q[] })[] {
  const seen = new Set<string>();
  const seenFeedback = new Set<string>();
  const result = lessons.map((l) => {
    const questions: Q[] = l.questions.map((q) => {
      const c = choiceExercises.find((c) => c.lesson === l.slug && c.id === q.id);
      if (!c) return q;
      const key = l.slug + '/' + q.id;
      if (seen.has(key)) throw Error('Duplicate choice ' + key);
      seen.add(key);
      const hash = createHash('sha256')
        .update(JSON.stringify([q.instructions, q.prompt, q.math, q.answer]))
        .digest('hex');
      if (hash !== c.sourceHash) throw Error('Reinspect changed choice exercise ' + key);
      validateChoice(c);
      return { ...q, choice: { options: c.options, correctOption: c.correctOption } };
    });
    const sections = l.sections.map((s) => ({
      ...s,
      quickChecks: s.quickChecks.map((c) => {
        const mapping = knowledgeExercises.find((k) => k.lesson === l.slug && k.quick === c.id);
        if (!mapping || questions.some((q) => q.id === mapping.exercise))
          throw Error('Invalid knowledge-check exercise ID');
        const choice = {
          options: c.options.map((text, i) => ({
            id: 'option-' + (i + 1),
            text,
            feedback: c.explanation,
          })),
          correctOption: 'option-' + (c.answer + 1),
        };
        validateChoice(choice);
        questions.push({
          id: mapping.exercise,
          section: s.title,
          instructions: '',
          prompt: c.prompt,
          answer: c.explanation,
          choice,
          quickSource: c.id,
        });
        return { ...c, exerciseId: mapping.exercise };
      }),
    }));
    // Interleave each knowledge check beside the practice for its teaching section.
    const promoted = questions.filter((q) => q.quickSource);
    const ordered = questions.filter((q) => !q.quickSource);
    const lastIndex = (test: (q: Q) => boolean) => {
      for (let i = ordered.length - 1; i >= 0; i--) if (test(ordered[i])) return i;
      return -1;
    };
    for (const q of promoted) {
      let at = lastIndex((p) => p.section === q.section);
      if (at < 0) {
        const section = sections.find((s) => s.title === q.section)!;
        at = lastIndex((p) => section.questionIds.includes(p.id));
      }
      ordered.splice(at < 0 ? ordered.length : at + 1, 0, q);
    }
    return {
      ...l,
      sections,
      questions: ordered.map((q) => {
        if (!q.choice) return q;
        const key = l.slug + '/' + q.id;
        const authored = feedbackEntries.find((e) => e.lesson === l.slug && e.id === q.id);
        const sourceHash = createHash('sha256')
          .update(
            JSON.stringify([
              q.instructions,
              q.prompt,
              q.math,
              q.answer,
              q.choice.options.map((o) => o.text),
            ]),
          )
          .digest('hex');
        if (!authored || authored.sourceHash !== sourceHash)
          throw Error('Reinspect choice feedback: ' + key);
        if (Object.keys(authored.responses).length !== q.choice.options.length)
          throw Error('Choice feedback coverage: ' + key);
        const choice = {
          ...q.choice,
          options: q.choice.options.map((o) => {
            const feedback = authored.responses[o.id];
            if (!feedback) throw Error('Missing option feedback: ' + key + '/' + o.id);
            return { ...o, feedback };
          }),
        };
        validateChoice(choice);
        seenFeedback.add(key);
        return { ...q, choice };
      }),
      practiceIds: [...l.practiceIds, ...promoted.map((q) => q.id)],
    };
  });
  if (seen.size !== choiceExercises.length) throw Error('Unknown or duplicate converted exercise');
  if (seenFeedback.size !== feedbackEntries.length)
    throw Error('Unknown or duplicate choice feedback');
  if (
    result.reduce((n, l) => n + l.questions.filter((q) => q.quickSource).length, 0) !==
    knowledgeExercises.length
  )
    throw Error('Unknown or duplicate knowledge-check mapping');
  return result;
}
export function validateChoice(c: ChoiceAssessment) {
  if (
    c.options.length < 2 ||
    c.options.length > 4 ||
    new Set(c.options.map((o) => o.id)).size !== c.options.length ||
    new Set(c.options.map((o) => o.text)).size !== c.options.length ||
    !c.options.some((o) => o.id === c.correctOption)
  )
    throw Error('Invalid deterministic choices');
  for (const o of c.options) validateMath(o.text + '\n' + o.feedback);
}
