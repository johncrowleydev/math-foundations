import { exerciseKey } from '../../web/src/exerciseIdentity.js';
import type { Assessment } from '../../shared/assessment.js';
import type { EvidenceCatalog } from '../../web/src/evidenceTypes.js';
import type { AuthoredReviewTemplate } from './review-templates.js';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { validateMath } from './content.js';

const text = z.string().trim().min(1);
const writtenReview = z
  .object({
    instructions: text,
    overrides: z.record(
      text,
      z.object({ prompt: text.optional(), officialAnswer: text.optional() }).strict(),
    ),
  })
  .strict()
  .parse(JSON.parse(await readFile('content/written-review.json', 'utf8')));

type Question = {
  id: number;
  instructions: string;
  prompt?: string;
  answer?: string;
  math?: string;
  table?: { columns: string[]; rows: number };
  choice?: unknown;
  assessment?: Assessment;
};
type Lesson = { slug: string; exerciseNamespace?: string; questions: Question[] };
export type WrittenReviewQuestion = {
  instructions: string;
  prompt?: string;
  officialAnswer?: string;
  math?: string;
  table?: { columns: string[]; rows: number };
};
const depth = (level: string) => ({ recognition: 1, production: 2, reasoning: 3 })[level] ?? 0;
export function reviewSkillDepth(skill: string) {
  if (['prove', 'justify', 'explain', 'reason', 'evaluate'].includes(skill)) return 3;
  if (['recognize', 'identify', 'interpret', 'recall'].includes(skill)) return 1;
  return 2;
}
const target = (concept: string, skill: string, objective = '') =>
  `${concept}:${skill}:${objective}`;

// Compile existing canonical written exercises into review representations only
// where the published controls no longer cover a declared concept/skill. This
// does not author questions or remove the published deterministic representation.
export function compileWrittenReviewQuestions(
  originals: Lesson[],
  published: Lesson[],
  evidence: EvidenceCatalog,
  templates: AuthoredReviewTemplate[],
) {
  const required = new Map<string, number>();
  const available = new Map<string, number>();
  const record = (map: Map<string, number>, key: string, value: number) =>
    map.set(key, Math.max(map.get(key) ?? 0, value));
  const targets = (key: string) => {
    const row = evidence.exercises[key];
    return row.concepts
      .filter((c) => c.role === 'primary')
      .flatMap((c) =>
        row.skills
          .filter((s) => s.role === 'primary')
          .map((s) => ({ key: target(c.concept, s.skill), skill: s.skill })),
      );
  };
  for (const lesson of published) {
    for (const q of lesson.questions) {
      for (const t of targets(exerciseKey(lesson, q.id))) {
        // Open recall historically required producing the answer; retain that
        // requirement when an assessment replaces the original written input.
        const needed = t.skill === 'recall' && !q.choice ? 2 : reviewSkillDepth(t.skill);
        record(required, t.key, needed);
        const actual = q.assessment ? depth(q.assessment.evidence.level) : q.choice ? 1 : needed;
        if (actual >= needed) {
          record(required, t.key, actual);
          record(available, t.key, actual);
        }
      }
    }
  }
  for (const t of templates) {
    const key = target(t.concept, t.skill, t.objective);
    record(required, key, depth(t.evidenceLevel));
    for (const q of t.variants ?? [t.question]) {
      const actual = q.assessment
        ? depth(q.assessment.evidence.level)
        : q.choice
          ? 1
          : depth(t.evidenceLevel);
      record(available, key, actual);
    }
  }
  const missing = (key: string) => (available.get(key) ?? 0) < required.get(key)!;
  const questions: Record<string, WrittenReviewQuestion> = {};
  for (const lesson of originals) {
    for (const q of lesson.questions) {
      if (q.choice || q.assessment) continue;
      const key = exerciseKey(lesson, q.id);
      const supported = targets(key);
      if (!supported.some((t) => missing(t.key))) continue;
      if (!q.answer?.trim() || !(q.prompt?.trim() || q.math || q.table))
        throw Error('Incomplete written review question: ' + key);
      questions[key] = {
        instructions: [q.instructions, writtenReview.instructions].filter(Boolean).join('\n\n'),
        prompt: q.prompt,
        math: q.math,
        officialAnswer: q.answer,
        table: q.table,
        ...writtenReview.overrides[key],
      };
      for (const value of [
        questions[key].instructions,
        questions[key].prompt,
        questions[key].officialAnswer,
      ])
        if (value) validateMath(value);
      for (const t of supported) {
        const actual = t.skill === 'recall' ? 2 : reviewSkillDepth(t.skill);
        record(available, t.key, actual);
      }
    }
  }
  const gaps = [...required.keys()].filter(missing);
  if (gaps.length) throw Error('Review targets without compatible questions: ' + gaps.join(', '));
  return questions;
}
