// Record the version actually inspected in docs/calculus-*-inspection.md.
// Run explicitly after source/math inspection; normal builds never approve content.
import fs from 'node:fs';
import { prepareNotebook } from '../notebook.ts';
import { promoteChoices } from '../choice-exercises.ts';
import { promoteDeterministic } from '../deterministic-exercises.ts';
import { loadEvidence } from '../evidence.ts';
import { loadReviewTemplates } from '../review-templates.ts';
import { lessonSourceHash, sourceHash } from '../sources.ts';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const calculus = (s) => s?.startsWith('calculus-');
const { lessons, teaching } = await prepareNotebook();
const published = promoteDeterministic(promoteChoices(lessons));
const evidence = await loadEvidence(published);
const review = await loadReviewTemplates(
  evidence,
  published.map((l) => l.slug),
);
const syntax = read('content/tex-syntax.json'),
  typing = read('content/tex-teaching.json');
const sources = read('content/sources.json');
for (const lesson of published.filter((l) => calculus(l.slug)))
  sources.lessons[lesson.slug].reviewedContentHash = lessonSourceHash(lesson, teaching, typing);
for (const template of review.filter((t) => calculus(t.lesson)))
  sources.reviewTemplates[template.id].reviewedContentHash = sourceHash(template);
sources.syntax.reviewedContentHash = sourceHash({ syntax, typing });
save('content/sources.json', sources);
console.log('Recorded inspected calculus source versions; historical lesson records preserved.');

// The inventory phase requires a successful build and the documented visual checks.
if (process.argv.includes('--curriculum')) {
  const inventory = read('output/curriculum-inventory.json');
  const audit = read('content/curriculum-audit.json');
  audit.edition = 'discrete-linear-algebra-and-calculus';
  audit.date = '2026-09-20';
  const note =
    ' The calculus addition was checked against the four calculus source-inspection records, independent mathematical calculations, shared grading fixtures, and desktop/phone figure and saved-work checks; historical audit entries are retained.';
  if (!audit.method.includes('The calculus addition')) audit.method += note;
  audit.counts = inventory.counts;
  audit.units = [
    ...audit.units.filter((u) => !calculus(u.lesson)),
    ...inventory.units
      .filter((u) => calculus(u.lesson))
      .map(({ lesson, source, hash }) => ({ lesson, source, hash })),
  ];
  for (const category of ['references', 'formulas', 'figures']) {
    const entries = teaching[category].filter((e) => calculus(e.lesson));
    const ids = new Set(entries.map((e) => e.id));
    audit[category] = [
      ...audit[category].filter((e) => !ids.has(e.id)),
      ...entries.map((e) => ({
        id: e.id,
        hash: sourceHash(e),
        ...(category === 'figures'
          ? { authoredStates: e.frames.length, orientations: ['portrait', 'landscape'] }
          : {}),
      })),
    ];
  }
  save('content/curriculum-audit.json', audit);
  console.log('Recorded inspected calculus curriculum units and figure states.');
}
