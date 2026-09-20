// Record the version actually inspected in docs/probability-*-inspection.md.
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
const probabilityStatistics = (s) => s?.startsWith('probability-statistics-');
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
for (const lesson of published.filter((l) => probabilityStatistics(l.slug)))
  sources.lessons[lesson.slug].reviewedContentHash = lessonSourceHash(lesson, teaching, typing);
for (const template of review.filter((t) => probabilityStatistics(t.lesson)))
  sources.reviewTemplates[template.id].reviewedContentHash = sourceHash(template);
sources.syntax.reviewedContentHash = sourceHash({ syntax, typing });
save('content/sources.json', sources);
console.log(
  'Recorded inspected probability-statistics source versions; historical lesson records preserved.',
);

// The inventory phase requires a successful build and the documented visual checks.
if (process.argv.includes('--curriculum')) {
  const inventory = read('output/curriculum-inventory.json');
  const audit = read('content/curriculum-audit.json');
  audit.edition = 'complete-foundations-curriculum';
  audit.date = '2026-09-20';
  const note =
    ' The probability and statistics addition was checked against the probability and statistics source-inspection records, independent mathematical calculations, shared grading fixtures, and desktop/phone figure and saved-work checks; historical audit entries are retained.';
  if (!audit.method.includes('The probability and statistics addition')) audit.method += note;
  audit.counts = inventory.counts;
  audit.units = [
    ...audit.units.filter((u) => !probabilityStatistics(u.lesson)),
    ...inventory.units
      .filter((u) => probabilityStatistics(u.lesson))
      .map(({ lesson, source, hash }) => ({ lesson, source, hash })),
  ];
  for (const category of ['references', 'formulas', 'figures']) {
    const entries = teaching[category].filter((e) => probabilityStatistics(e.lesson));
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
  console.log('Recorded inspected probability-statistics curriculum units and figure states.');
}
