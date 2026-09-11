import { mkdir, writeFile } from 'node:fs/promises';
import { loadContent } from './content.js';
import { inlineAudit, validateInlinePrerequisites } from './inline-prerequisites.js';
const content = await loadContent();
validateInlinePrerequisites(content.lessons);
let report =
  '# Inline exercise prerequisite audit\n\nAll 121 inline exercises across 15 lessons were checked, including exercise-specific instructions, prompt, math, revealed answer, and the label shown when expanded into the writing workspace. Required course concepts are tied to preceding teaching sections below. Elementary arithmetic, numerical comparisons, and basic algebra are the entry skills of this course.\n\nShared worksheet instructions no longer flow into inline cards. New teaching text explicitly introduces truth values, counterexamples, double negation, hypotheses, integral values, additive inverses, ordinary induction, normalization, base-2 logarithms, graph neighbors, queues and discovery order, epsilon, loop bodies, and tight growth bounds where needed. Answers avoid unexplained absolute-value notation, disjunct terminology, and parent-mapping shorthand. Early predicate exercises contain no request for a witness.\n\nThe audit is stored in `content/inline-prerequisites.yaml`. The build rejects unaudited exercises, changed displayed content, changed prerequisite text, missing headings, and prerequisites placed after their exercises. These checks preserve a completed editorial audit; they do not substitute for examining new prose. After a content edit, inspect every affected entry and update its audit only after verifying the teaching order.\n';
for (const [index, lesson] of content.lessons.entries()) {
  report += `\n## ${index + 1}. ${lesson.title}\n\n| Exercise | Appears after | Concepts checked | Preceding explanations |\n| --- | --- | --- | --- |\n`;
  for (const [id, entry] of Object.entries(inlineAudit[lesson.slug])) {
    const references = entry.requires
      .map((r) => `${content.lessons.findIndex((l) => l.slug === r.lesson) + 1}: ${r.section}`)
      .join('; ');
    report += `| ${id} | ${entry.after} | ${entry.concepts.join('; ')} | ${references} |\n`;
  }
}
await mkdir('docs', { recursive: true });
await writeFile('docs/inline-prerequisite-audit.md', report);
console.log('Wrote 121 exercise prerequisite traces.');
