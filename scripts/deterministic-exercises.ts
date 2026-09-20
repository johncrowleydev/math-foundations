import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { validateMath } from './content.js';
import { validateAssessment, gradeAssessment, InputError } from '../shared/deterministic.js';
import type { Assessment, AnswerFixture } from '../shared/assessment.js';
import { exerciseKey } from '../web/src/exerciseIdentity.js';

const entrySchema = z
  .object({
    lesson: z.string().min(1),
    id: z.number().int().positive(),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    rationale: z.string().min(1),
    assessment: z.unknown(),
    fixtures: z
      .array(
        z
          .object({
            response: z.record(
              z.string(),
              z.union([z.string(), z.boolean(), z.array(z.string()), z.null()]),
            ),
            verdict: z.enum(['correct', 'incorrect']).optional(),
            error: z.boolean().optional(),
          })
          .strict(),
      )
      .min(2),
    instructions: z.string().optional(),
    prompt: z.string().optional(),
  })
  .strict();
export type DeterministicEntry = Omit<z.infer<typeof entrySchema>, 'assessment' | 'fixtures'> & {
  assessment: Assessment;
  fixtures: AnswerFixture[];
};
export function validateDeterministicEntry(raw: unknown): DeterministicEntry {
  const entry = entrySchema.parse(raw);
  validateAssessment(entry.assessment);
  const fixtures = entry.fixtures;
  if (
    !fixtures.some((f) => f.verdict === 'correct') ||
    !fixtures.some((f) => f.verdict === 'incorrect')
  )
    throw Error('Assessment needs accepted and rejected fixtures.');
  for (const fixture of fixtures) {
    if ((fixture.error === true) === (fixture.verdict !== undefined))
      throw Error('Fixture needs exactly one expected outcome.');
    try {
      const result = gradeAssessment(entry.assessment, fixture.response);
      if (fixture.error || result.verdict !== fixture.verdict)
        throw Error('Assessment fixture mismatch: ' + entry.lesson + '-' + entry.id);
    } catch (e) {
      if (fixture.error && e instanceof InputError) continue;
      throw e;
    }
  }
  for (const input of entry.assessment.inputs) {
    validateMath(input.label);
    if (input.kind === 'select' || input.kind === 'multiselect')
      input.options.forEach((o) => validateMath(o.label));
    if (input.kind === 'grid') input.columns.forEach(validateMath);
  }
  validateMath(entry.assessment.feedback.correct);
  validateMath(entry.assessment.feedback.incorrect);
  if (entry.instructions) validateMath(entry.instructions);
  if (entry.prompt) validateMath(entry.prompt);
  return entry as DeterministicEntry;
}
export const deterministicExercises: DeterministicEntry[] = [];
for (const file of [
  'content/deterministic-exercises.json',
  'content/deterministic-linear.json',
  'content/deterministic-algorithms.json',
  'content/deterministic-calculus.json',
  'content/deterministic-probability-statistics.json',
])
  deterministicExercises.push(
    ...JSON.parse(await readFile(file, 'utf8')).map(validateDeterministicEntry),
  );
type Q = {
  id: number;
  instructions: string;
  prompt?: string;
  math?: string;
  answer?: string;
  choice?: unknown;
  assessment?: Assessment;
};
export function promoteDeterministic<
  L extends { slug: string; exerciseNamespace?: string; questions: Q[] },
>(
  lessons: L[],
): (Omit<L, 'questions'> & {
  questions: (L['questions'][number] & { assessment?: Assessment })[];
})[] {
  const entries = new Map<string, DeterministicEntry>();
  for (const e of deterministicExercises) {
    const key = e.lesson + '-' + e.id;
    if (entries.has(key)) throw Error('Duplicate deterministic conversion ' + key);
    entries.set(key, e);
  }
  const seen = new Set<string>();
  const result = lessons.map((l) => ({
    ...l,
    questions: l.questions.map((q) => {
      const key = exerciseKey(l, q.id),
        entry = entries.get(key);
      if (!entry) return q;
      if (q.choice || q.assessment) throw Error('Conflicting grading methods ' + key);
      const sourceHash = createHash('sha256')
        .update(JSON.stringify([q.instructions, q.prompt, q.math, q.answer]))
        .digest('hex');
      if (sourceHash !== entry.sourceHash)
        throw Error('Reinspect changed deterministic exercise ' + key);
      seen.add(key);
      return {
        ...q,
        ...(entry.instructions !== undefined ? { instructions: entry.instructions } : {}),
        ...(entry.prompt !== undefined ? { prompt: entry.prompt } : {}),
        assessment: entry.assessment,
      };
    }),
  }));
  if (seen.size !== entries.size)
    throw Error(
      'Unknown deterministic conversion: ' +
        [...entries.keys()].filter((k) => !seen.has(k)).join(', '),
    );
  return result;
}
