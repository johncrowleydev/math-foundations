import { validateAssessment, gradeAssessment, InputError } from '../../shared/deterministic.js';
import type { AnswerFixture } from '../../shared/assessment.js';
import type { Assessment } from '../../shared/assessment.js';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { validateMath } from './content.js';
import type { EvidenceCatalog } from '../../web/src/evidenceTypes.js';

const generatorSlots = {
  'integer-witness-sum': ['a', 'sum', 'witness', 'witnessPlusOne', 'witnessMinusOne'],
  'propositional-truth-values': [
    'pTruth',
    'qTruth',
    'formula',
    'resultText',
    'oppositeText',
    'explanation',
  ],
  'integer-conditional-counterexample': ['a', 'b', 'below', 'above'],
} as const;
const text = z.string().trim().min(1);
export const reviewQuestion = z
  .object({
    id: z.number().int().positive(),
    section: text,
    instructions: text,
    prompt: text,
    answer: text,
    math: text.optional(),
    assessment: z
      .custom<Assessment>((a) => {
        try {
          validateAssessment(a);
          return true;
        } catch {
          return false;
        }
      })
      .optional(),
    choice: z
      .object({
        options: z.array(z.object({ id: text, text, feedback: text }).strict()).min(2),
        correctOption: text,
      })
      .strict()
      .optional(),
  })
  .strict();
const schema = z.array(
  z
    .object({
      id: text,
      family: z.enum(['fixed', 'authored', 'generated']),
      lesson: text,
      concept: text,
      skill: text,
      objective: text.optional(),
      evidenceLevel: z.enum(['recognition', 'production', 'reasoning']),
      interactionCost: z.enum(['low', 'medium', 'high']),
      inputCapabilities: z
        .array(z.enum(['tap', 'short-text', 'math-text', 'handwriting', 'photo']))
        .min(1),
      cognitiveLevel: text,
      activationConcepts: z.array(text).min(1),
      sourceIds: z.array(text).min(1),
      question: reviewQuestion,
      variants: z.array(reviewQuestion).min(2).optional(),
      generator: z
        .enum(
          Object.keys(generatorSlots) as [
            keyof typeof generatorSlots,
            ...Array<keyof typeof generatorSlots>,
          ],
        )
        .optional(),
    })
    .strict(),
);
export type AuthoredReviewTemplate = z.infer<typeof schema>[number];
export function validateReviewTemplates(
  raw: unknown,
  evidence: EvidenceCatalog,
  lessons: string[],
) {
  schema.parse(raw);
  const templates = raw as AuthoredReviewTemplate[];
  const seen = new Set<string>();
  for (const t of templates) {
    if (seen.has(t.id)) throw Error('Duplicate review template: ' + t.id);
    seen.add(t.id);
    if (!lessons.includes(t.lesson)) throw Error('Unknown review lesson: ' + t.lesson);
    if (
      ![t.concept, ...t.activationConcepts].every((id) =>
        evidence.concepts.some((c) => c.id === id),
      )
    )
      throw Error('Unknown review concept: ' + t.id);
    if (!evidence.skills.some((s) => s.id === t.skill))
      throw Error('Unknown review skill: ' + t.id);
    if ((t.family === 'generated') !== !!t.generator || (t.family === 'authored') !== !!t.variants)
      throw Error('Review family payload mismatch: ' + t.id);
    if (new Set(t.sourceIds).size !== t.sourceIds.length) throw Error('Duplicate review citation');
    for (const q of [t.question, ...(t.variants || [])]) {
      if (q.assessment && q.choice) throw Error('Conflicting review grading methods: ' + t.id);
      if (q.assessment) validateAssessment(q.assessment);
      if (q.choice) {
        const ids = q.choice.options.map((o) => o.id);
        if (new Set(ids).size !== ids.length || !ids.includes(q.choice.correctOption))
          throw Error('Invalid review choices: ' + t.id);
        if (t.evidenceLevel !== 'recognition')
          throw Error('Choices require recognition evidence: ' + t.id);
      }
      const serialized = JSON.stringify(q);
      const placeholders = [...serialized.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
      const supportedSlots: readonly string[] = t.generator ? generatorSlots[t.generator] : [];
      if (placeholders.some((p) => !supportedSlots.includes(p)))
        throw Error('Unknown review placeholder: ' + t.id);
      // Slots may contain integers, truth values, or formulas. This replacement
      // checks surrounding authored math; generator tests check rendered samples.
      for (const value of [
        q.instructions,
        q.prompt,
        q.answer,
        q.math || '',
        ...(q.choice?.options.flatMap((o) => [o.text, o.feedback]) || []),
      ])
        validateMath(value.replace(/\{\{[^}]+\}\}/g, '3'));
    }
  }
  return templates;
}
export async function loadReviewTemplates(evidence: EvidenceCatalog, lessons: string[]) {
  const templates = validateReviewTemplates(
    JSON.parse(await readFile('content/review-templates.json', 'utf8')),
    evidence,
    lessons,
  );
  const rows = JSON.parse(await readFile('content/deterministic-review-fixtures.json', 'utf8')) as {
    template: string;
    variant: number | null;
    fixtures: AnswerFixture[];
  }[];
  const seen = new Set<string>();
  for (const template of templates)
    for (const [index, q] of (template.variants || [template.question]).entries()) {
      if (!q.assessment) continue;
      const variant = template.variants ? index + 1 : null,
        key = template.id + '/' + variant;
      const matching = rows.filter(
        (row) => row.template === template.id && row.variant === variant,
      );
      if (matching.length !== 1)
        throw Error('Missing or duplicate Review assessment fixtures: ' + key);
      const fixtures = matching[0].fixtures;
      if (
        !fixtures.some((f) => f.verdict === 'correct') ||
        !fixtures.some((f) => f.verdict === 'incorrect')
      )
        throw Error('Review assessment needs accepted and rejected answers: ' + key);
      for (const fixture of fixtures) {
        if ((fixture.error === true) === (fixture.verdict !== undefined))
          throw Error('Review fixture needs exactly one expected outcome: ' + key);
        try {
          const result = gradeAssessment(q.assessment, fixture.response);
          if (fixture.error || result.verdict !== fixture.verdict)
            throw Error('Review assessment fixture mismatch: ' + key);
        } catch (e) {
          if (fixture.error && e instanceof InputError) continue;
          throw e;
        }
      }
      seen.add(key);
    }
  if (rows.length !== seen.size || rows.some((row) => !seen.has(row.template + '/' + row.variant)))
    throw Error('Unmatched Review assessment fixtures.');
  return templates;
}
