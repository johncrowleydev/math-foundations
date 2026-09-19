import { validateAssessment } from '../shared/deterministic.js';
import type { Assessment } from '../shared/assessment.js';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { validateMath } from './content.js';
import type { EvidenceCatalog } from '../web/src/evidenceTypes.js';

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
const question = z
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
      question,
      variants: z.array(question).min(2).optional(),
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
  return validateReviewTemplates(
    JSON.parse(await readFile('content/review-templates.json', 'utf8')),
    evidence,
    lessons,
  );
}
