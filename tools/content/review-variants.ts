import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { reviewQuestion, type AuthoredReviewTemplate } from './review-templates.js';
import { validateMath } from './content.js';

const text = z.string().trim().min(1);
const byte = z.number().int().min(0).max(31);
const schema = z.record(
  text,
  z
    .object({
      selection: z
        .object({
          hashBytes: z.array(byte).min(1),
          moduli: z.array(z.number().int().min(1).max(256)).min(1),
          choiceRotationByte: byte.optional(),
        })
        .strict(),
      variants: z
        .array(
          z
            .object({
              id: text,
              parameters: z.record(text, z.number().int()),
              question: reviewQuestion,
            })
            .strict(),
        )
        .min(1),
    })
    .strict(),
);
export type ReviewVariants = z.infer<typeof schema>;

// Every question and parameter value is authored data. This validates the finite
// table and its historical seed lookup, without constructing curriculum.
export function validateReviewVariants(raw: unknown, templates: AuthoredReviewTemplate[]) {
  const banks = schema.parse(raw);
  const expected = templates.filter((t) => t.family === 'generated');
  if (Object.keys(banks).length !== expected.length || expected.some((t) => !banks[t.id]))
    throw Error('Review variant coverage mismatch');
  for (const template of expected) {
    const bank = banks[template.id];
    const { hashBytes, moduli, choiceRotationByte } = bank.selection;
    if (hashBytes.length !== moduli.length || new Set(hashBytes).size !== hashBytes.length)
      throw Error('Invalid review variant selection: ' + template.id);
    if (moduli.reduce((n, m) => n * m, 1) !== bank.variants.length)
      throw Error('Incomplete review variant table: ' + template.id);
    for (const [index, variant] of bank.variants.entries()) {
      let remaining = index;
      const digits = moduli.map(() => 0);
      for (let i = moduli.length - 1; i >= 0; i--) {
        digits[i] = remaining % moduli[i];
        remaining = Math.floor(remaining / moduli[i]);
      }
      if (variant.id !== digits.join(':'))
        throw Error('Review variant identity/order mismatch: ' + template.id);
      const q = variant.question;
      if (/\{\{[^}]+\}\}/.test(JSON.stringify(q)))
        throw Error('Review variants must contain complete questions: ' + template.id);
      if (q.choice && q.assessment) throw Error('Conflicting review grading methods');
      if (q.choice) {
        const ids = q.choice.options.map((o) => o.id);
        if (new Set(ids).size !== ids.length || !ids.includes(q.choice.correctOption))
          throw Error('Invalid review variant choices: ' + template.id);
        if (template.evidenceLevel !== 'recognition')
          throw Error('Choices require recognition evidence: ' + template.id);
      } else if (choiceRotationByte !== undefined) {
        throw Error('Review choice rotation requires choices: ' + template.id);
      }
      for (const value of [
        q.instructions,
        q.prompt,
        q.answer,
        q.math || '',
        ...(q.choice?.options.flatMap((o) => [o.text, o.feedback]) || []),
      ])
        validateMath(value);
    }
  }
  // Preserve authored key ordering for source review digests.
  return raw as ReviewVariants;
}
export async function loadReviewVariants(templates: AuthoredReviewTemplate[]) {
  return validateReviewVariants(
    JSON.parse(await readFile('content/review-variants.json', 'utf8')),
    templates,
  );
}
