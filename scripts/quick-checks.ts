import { z } from 'zod';
import { readYaml, validateMath, type loadContent } from './content.js';
import { auditHash, teachingSections } from './inline-prerequisites.js';
const check = z
  .object({
    id: z.string().regex(/^quick-[1-9]\d*$/),
    after: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    answer: z.number().int().min(0),
    explanation: z.string().min(1),
    teachingHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const quickChecks = z
  .record(z.string(), z.array(check))
  .parse(await readYaml('content/quick-checks.yaml'));
export function validateQuickChecks(
  lessons: Awaited<ReturnType<typeof loadContent>>['lessons'],
  checks = quickChecks,
) {
  if (Object.keys(checks).some((slug) => !lessons.some((l) => l.slug === slug)))
    throw Error('Unknown quick-check lesson');
  for (const l of lessons) {
    const list = checks[l.slug] || [];
    if (list.length !== 2 || new Set(list.map((c) => c.id)).size !== list.length)
      throw Error('Each lesson needs two distinct quick checks');
    for (const c of list) {
      const section = teachingSections(l.markdown).find((s) => s.title === c.after);
      if (!section || auditHash(section.text) !== c.teachingHash)
        throw Error('Re-audit quick-check teaching: ' + l.slug + '/' + c.id);
      if (c.answer >= c.options.length || new Set(c.options).size !== c.options.length)
        throw Error('Invalid quick-check options');
      validateMath([c.prompt, ...c.options, c.explanation].join('\n'));
    }
  }
}
