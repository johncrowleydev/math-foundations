import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import type { Assessment, AssessmentInput } from '../../shared/assessment.js';

type Question = Record<string, unknown> & {
  prompt: string;
  instructions?: string;
  math?: string;
  answer?: string;
  officialAnswer?: string;
  assessment?: Assessment;
  choice?: { options: { id: string; text: string }[]; correctOption: string };
};
type AuditLesson = {
  key: string;
  lesson: string;
  displayLessonSlug: string;
  questionHash: string;
  category: string;
  inputFamily: string;
  reason: string;
  requirements: string;
  publishedQuestion: Question;
};
type AuditReview = Omit<AuditLesson, 'questionHash' | 'publishedQuestion'> & {
  template: string;
  variant: number | null;
  question: Question;
};
type Disposition = {
  key: string;
  originalHash: string;
  finalMethod: string;
  reason?: string;
  retainOpenReason?: string;
  evidenceChange?: string | null;
  sourceInspection?: string;
};
type Entry = {
  lesson: string;
  id: number;
  sourceHash: string;
  rationale: string;
  assessment: Assessment;
  prompt?: string;
  instructions?: string;
  answer?: string;
};
type ReviewTemplate = {
  id: string;
  lesson: string;
  family: string;
  generator?: string;
  evidenceLevel: string;
  question: Question;
  variants?: Question[];
};
export type CoverageInput = {
  audit: {
    metadata: Record<string, unknown>;
    exercises: AuditLesson[];
    dedicatedReviewQuestions: AuditReview[];
  };
  lessonLedgers: { path: string; rows: Disposition[] }[];
  reviewLedger: { path: string; rows: Disposition[] };
  authoredCatalogs: { path: string; entries: Entry[] }[];
  authoredReview: ReviewTemplate[];
  published: {
    version: string;
    exercises: Record<
      string,
      { lesson: string; question: Question; assessment?: Assessment; choice?: Question['choice'] }
    >;
    reviewTemplates: ReviewTemplate[];
  };
};
type Method = 'structured' | 'choice' | 'open';
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const unique = <T extends { key: string }>(rows: T[], label: string) => {
  const map = new Map<string, T>();
  for (const row of rows) {
    assert(!map.has(row.key), `Duplicate ${label}: ${row.key}`);
    map.set(row.key, row);
  }
  return map;
};
const sameKeys = (actual: Iterable<string>, expected: Iterable<string>, label: string) => {
  const a = new Set(actual),
    e = new Set(expected);
  for (const key of e) assert(a.has(key), `Missing ${label}: ${key}`);
  for (const key of a) assert(e.has(key), `Unexpected ${label}: ${key}`);
};
const method = (q: { assessment?: Assessment; choice?: unknown }): Method => {
  assert(!(q.assessment && q.choice), 'An item cannot have both choice and structured grading.');
  return q.assessment ? 'structured' : q.choice ? 'choice' : 'open';
};
const deterministicDisposition = (d: Disposition) => {
  assert(
    [
      'deterministic',
      'existing-deterministic',
      'choice',
      'existing-choice',
      'llm',
      'open',
    ].includes(d.finalMethod),
    `Unknown disposition method: ${d.key}`,
  );
  return !['llm', 'open'].includes(d.finalMethod);
};
function fields(input: AssessmentInput): string[] {
  if (input.kind === 'grid')
    return input.rows.flatMap((r) => r.cells.flatMap((c) => ('id' in c ? [c.id] : [])));
  if (input.kind === 'interval')
    return ['lower', 'upper', 'leftClosed', 'rightClosed'].map((suffix) => `${input.id}.${suffix}`);
  return [input.id];
}
function outputContract(q: { assessment?: Assessment; choice?: Question['choice'] }) {
  if (q.assessment) {
    const a = q.assessment;
    return {
      minimalOutputs: a.inputs.map((input) => ({
        id: input.id,
        label: input.label,
        kind: input.kind,
        fields: fields(input),
      })),
      input: a.inputs.map((input) => input.kind),
      validators: a.requirements.map((r) => ({
        id: r.id,
        name: r.validator,
        fields: r.fields,
        description: r.description,
      })),
      evidenceLevel: a.evidence.level,
    };
  }
  if (q.choice)
    return {
      minimalOutputs: [
        {
          id: 'selectedOptionId',
          label: 'Select one authored answer',
          kind: 'choice',
          fields: ['selectedOptionId'],
        },
      ],
      input: ['choice'],
      validators: [
        {
          id: 'choice',
          name: 'selected-option',
          fields: ['selectedOptionId'],
          description: 'The selected option matches the authored correct-option key.',
        },
      ],
      evidenceLevel: 'recognition',
    };
  return {
    minimalOutputs: [
      { id: 'answer', label: 'Complete original free response', kind: 'open', fields: ['answer'] },
    ],
    input: ['open'],
    validators: [],
    evidenceLevel: 'original-open-contract',
  };
}
function reviewDefinitions(templates: ReviewTemplate[]) {
  const rows = templates.flatMap<{
    key: string;
    template: ReviewTemplate;
    variant: number | null;
    question: Question;
  }>((t) =>
    t.variants?.length
      ? t.variants.map((q, i) => ({
          key: `${t.id}/variant-${i + 1}`,
          template: t,
          variant: i + 1,
          question: q,
        }))
      : [{ key: `${t.id}/question`, template: t, variant: null, question: t.question }],
  );
  unique(
    templates.map((t) => ({ key: t.id })),
    'Review template',
  );
  return unique(rows, 'Review definition');
}
export function assembleCoverage(input: CoverageInput) {
  const { audit, published } = input;
  assert(
    audit.exercises.length === 2064,
    'The historical lesson audit must contain exactly 2064 rows.',
  );
  assert(
    audit.dedicatedReviewQuestions.length === 173,
    'The historical dedicated Review audit must contain exactly 173 rows.',
  );
  const originalLessons = unique(audit.exercises, 'audit lesson');
  const originalReview = unique(audit.dedicatedReviewQuestions, 'audit Review');
  const dispositions = unique(
    input.lessonLedgers.flatMap((ledger) =>
      ledger.rows.map((d) => ({ ...d, ledger: ledger.path })),
    ),
    'lesson disposition',
  );
  const reviewDispositions = unique(input.reviewLedger.rows, 'Review disposition');
  sameKeys(dispositions.keys(), originalLessons.keys(), 'lesson disposition');
  sameKeys(Object.keys(published.exercises), originalLessons.keys(), 'published lesson');
  sameKeys(reviewDispositions.keys(), originalReview.keys(), 'Review disposition');
  const entries = unique(
    input.authoredCatalogs.flatMap((catalog) =>
      catalog.entries.map((e) => ({ ...e, key: `${e.lesson}-${e.id}`, catalog: catalog.path })),
    ),
    'authored structured definition',
  );
  const structuredPublished = Object.entries(published.exercises)
    .filter(([, q]) => method(q) === 'structured')
    .map(([key]) => key);
  sameKeys(entries.keys(), structuredPublished, 'published structured assessment');

  const lessons = audit.exercises.map((original) => {
    const d = dispositions.get(original.key)!;
    const q = published.exercises[original.key];
    const finalMethod = method(q);
    assert(
      d.originalHash === original.questionHash,
      `Original lesson hash differs from audit: ${original.key}`,
    );
    assert(
      deterministicDisposition(d) === (finalMethod !== 'open'),
      `Disposition/published grading mismatch: ${original.key}`,
    );
    if (['choice', 'existing-choice'].includes(d.finalMethod))
      assert(finalMethod === 'choice', `Expected existing choice: ${original.key}`);
    const entry = entries.get(original.key);
    if (entry) {
      const old = original.publishedQuestion;
      assert(
        entry.sourceHash === hash([old.instructions, old.prompt, old.math, old.officialAnswer]),
        `Structured source pin differs from audit question: ${original.key}`,
      );
      assert(
        isDeepStrictEqual(entry.assessment, q.assessment),
        `Published assessment differs from authoring catalog: ${original.key}`,
      );
      const intended = {
        ...old,
        ...(entry.prompt === undefined ? {} : { prompt: entry.prompt }),
        ...(entry.instructions === undefined ? {} : { instructions: entry.instructions }),
        ...(entry.answer === undefined ? {} : { officialAnswer: entry.answer }),
      };
      assert(
        isDeepStrictEqual(intended, q.question),
        `Published prompt differs from pinned conversion: ${original.key}`,
      );
    } else
      assert(
        isDeepStrictEqual(original.publishedQuestion, q.question),
        `Unconverted published question changed: ${original.key}`,
      );
    const reason =
      finalMethod === 'open'
        ? d.retainOpenReason || d.reason
        : entry?.rationale || d.reason || 'Existing authored choice grading is preserved.';
    assert(
      typeof reason === 'string' && reason.trim().length > 0,
      `Missing item disposition reason: ${original.key}`,
    );
    const converted = original.category !== 'existing-choice' && finalMethod !== 'open';
    assert(
      !(original.category === 'existing-choice' && finalMethod !== 'choice'),
      `Historical choice grading was lost: ${original.key}`,
    );
    return {
      key: original.key,
      lesson: original.displayLessonSlug,
      lessonTitle: original.lesson,
      exerciseId: Number(original.key.slice(original.key.lastIndexOf('-') + 1)),
      originalHash: original.questionHash,
      originalCategory: original.category,
      originalInputFamily: original.inputFamily,
      originalAuditReason: original.reason,
      originalRequirements: original.requirements,
      originalQuestion: original.publishedQuestion,
      finalMethod,
      deterministic: finalMethod !== 'open',
      conversion: converted
        ? 'converted'
        : finalMethod === 'open'
          ? 'retained-open'
          : 'already-deterministic',
      ...outputContract(q),
      reason,
      evidenceChange:
        d.evidenceChange ||
        (entry
          ? 'See the authored assessment evidence level and individual requirements.'
          : 'Original evidence contract preserved.'),
      promptChange: !isDeepStrictEqual(original.publishedQuestion, q.question),
      sourceInspection: d.sourceInspection,
      dispositionSource: d.ledger,
      ...(entry ? { assessmentSource: entry.catalog, sourceHash: entry.sourceHash } : {}),
    };
  });
  const authoredReview = reviewDefinitions(input.authoredReview);
  const publishedReview = reviewDefinitions(published.reviewTemplates);
  sameKeys(publishedReview.keys(), originalReview.keys(), 'published Review definition');
  sameKeys(authoredReview.keys(), originalReview.keys(), 'authored Review definition');
  assert(published.reviewTemplates.length === 69, 'Expected 69 dedicated Review templates.');
  const review = audit.dedicatedReviewQuestions.map((original) => {
    const d = reviewDispositions.get(original.key)!;
    const actual = publishedReview.get(original.key)!;
    const authored = authoredReview.get(original.key)!;
    const q = actual.question;
    const finalMethod = method(q);
    assert(
      d.originalHash === hash(original.question),
      `Original Review hash differs from audit: ${original.key}`,
    );
    assert(
      isDeepStrictEqual(authored.template, actual.template),
      `Published Review template differs from authoring: ${original.key}`,
    );
    assert(
      deterministicDisposition(d) === (finalMethod !== 'open'),
      `Review disposition/published grading mismatch: ${original.key}`,
    );
    assert(
      typeof d.reason === 'string' && d.reason.trim().length > 0,
      `Missing Review disposition reason: ${original.key}`,
    );
    if (original.category === 'existing-choice')
      assert(
        finalMethod === 'choice',
        `Historical Review choice grading was lost: ${original.key}`,
      );
    return {
      key: original.key,
      lesson: actual.template.lesson,
      template: original.template,
      variant: original.variant,
      family: actual.template.family,
      ...(actual.template.generator ? { generator: actual.template.generator } : {}),
      originalHash: d.originalHash,
      originalCategory: original.category,
      originalInputFamily: original.inputFamily,
      originalAuditReason: original.reason,
      originalRequirements: original.requirements,
      originalQuestion: original.question,
      finalMethod,
      deterministic: finalMethod !== 'open',
      conversion:
        original.category === 'existing-choice'
          ? 'already-deterministic'
          : finalMethod === 'open'
            ? 'retained-open'
            : 'converted',
      ...outputContract(q),
      reason: d.reason,
      evidenceChange: d.evidenceChange,
      promptChange:
        original.question.prompt !== q.prompt || original.question.instructions !== q.instructions,
      sourceInspection: d.sourceInspection,
      dispositionSource: input.reviewLedger.path,
      assessmentSource: 'content/review-templates.json',
    };
  });
  const counts = (rows: { finalMethod: Method; conversion: string }[]) => ({
    total: rows.length,
    structured: rows.filter((r) => r.finalMethod === 'structured').length,
    choice: rows.filter((r) => r.finalMethod === 'choice').length,
    open: rows.filter((r) => r.finalMethod === 'open').length,
    converted: rows.filter((r) => r.conversion === 'converted').length,
    alreadyDeterministic: rows.filter((r) => r.conversion === 'already-deterministic').length,
  });
  return {
    version: 1,
    auditDate: String(audit.metadata.date),
    publishedCatalogVersion: published.version,
    historicalAuditMetadata: audit.metadata,
    countingRules: [
      'The 2064 lesson identities include all 54 promoted checks; the two reading-only introductions contribute no exercises.',
      'The 69 dedicated Review templates contribute 173 definitions: authored variants, fixed questions, and generator declarations. Representative questions that duplicate variant 1 are not counted twice.',
      'Lesson-derived Review templates reuse lesson identities; they are not additional authored questions.',
      'Historical feasibility categories are retained for traceability. Final grading methods come from the published grading catalog and must agree with every disposition.',
      'Structured definitions are matched exactly to their source-pinned authoring catalogs. Every open item retains a specific reason.',
    ],
    totals: { lessons: counts(lessons), dedicatedReview: counts(review) },
    perLesson: [...new Set(lessons.map((r) => r.lesson))].map((lesson) => ({
      lesson,
      title: lessons.find((r) => r.lesson === lesson)!.lessonTitle,
      ...counts(lessons.filter((r) => r.lesson === lesson)),
    })),
    lessons,
    dedicatedReview: review,
  };
}
export type Coverage = ReturnType<typeof assembleCoverage>;
// Ignore JSON object key order, as the former full-ledger comparison did.
export function coverageDigest(coverage: Coverage): string {
  const normalized = JSON.stringify(coverage, (_key, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : value,
  );
  return createHash('sha256').update(normalized).digest('hex');
}
const json = async <T>(root: string, path: string): Promise<T> =>
  JSON.parse(await readFile(resolve(root, path), 'utf8'));
export async function loadCoverageInput(root = process.cwd()): Promise<CoverageInput> {
  const lessonPaths = ['discrete', 'linear', 'algorithms'].map(
    (name) => `tools/audit/deterministic/${name}-dispositions.json`,
  );
  const catalogPaths = [
    'content/deterministic-exercises.json',
    'content/deterministic-linear.json',
    'content/deterministic-algorithms.json',
  ];
  const reviewPath = 'tools/audit/deterministic/review-dispositions.json';
  const [audit, lessonLedgers, reviewRows, authoredCatalogs, authoredReview, published] =
    await Promise.all([
      json<CoverageInput['audit']>(root, 'tools/audit/deterministic/original-audit.json'),
      Promise.all(
        lessonPaths.map(async (path) => ({ path, rows: await json<Disposition[]>(root, path) })),
      ),
      json<Disposition[]>(root, reviewPath),
      Promise.all(
        catalogPaths.map(async (path) => ({ path, entries: await json<Entry[]>(root, path) })),
      ),
      json<ReviewTemplate[]>(root, 'content/review-templates.json'),
      json<CoverageInput['published']>(root, 'output/grading-catalog.json'),
    ]);
  // This ledger audits the original conversion project. Later subjects are
  // validated by the content pipeline without expanding its historical scope.
  const lessonKeys = new Set(audit.exercises.map((q) => q.key));
  const templateIds = new Set(audit.dedicatedReviewQuestions.map((q) => q.template));
  return {
    audit,
    lessonLedgers,
    reviewLedger: { path: reviewPath, rows: reviewRows },
    authoredCatalogs,
    authoredReview: authoredReview.filter((t) => templateIds.has(t.id)),
    published: {
      ...published,
      exercises: Object.fromEntries(
        Object.entries(published.exercises).filter(([key]) => lessonKeys.has(key)),
      ),
      reviewTemplates: published.reviewTemplates.filter((t) => templateIds.has(t.id)),
    },
  };
}
const markdown = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
export function coverageReport(c: Coverage): string {
  const l = c.totals.lessons,
    r = c.totals.dedicatedReview;
  const lines = [
    '# Deterministic grading coverage',
    '',
    `Validated against published grading catalog \`${c.publishedCatalogVersion}\`.`,
    '',
    `${l.total.toLocaleString('en-US')} lesson exercises: **${l.structured.toLocaleString('en-US')} new structured assessments**, **${l.choice} multiple-choice assessments**, and **${l.open} open responses**. The deterministic total is **${(l.structured + l.choice).toLocaleString('en-US')}** (${(((l.structured + l.choice) / l.total) * 100).toFixed(1)}%).`,
    '',
    `${r.total} dedicated Review definitions from 69 templates: **${r.structured} conversions**, **${r.choice} existing choices**, and **${r.open} open responses**. The deterministic total is **${r.structured + r.choice}**. The three seeded generator declarations are included once each; duplicated representative questions and lesson-derived Review mappings are not counted again.`,
    '',
    'The combined [machine-readable ledger](deterministic-coverage.json) preserves every original identity, question hash, feasibility category and requirement. It resolves the actual published inputs and validators even where an earlier ledger said only “existing deterministic.” Each retained item remains wholly open.',
    '',
    '## Lesson counts',
    '',
    '| Lesson | New structured | Choices | Open | Total |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...c.perLesson.map(
      (p) => `| ${markdown(p.title)} | ${p.structured} | ${p.choice} | ${p.open} | ${p.total} |`,
    ),
    '',
    '## Historical feasibility categories',
    '',
    '| Original category | Implemented structured | Choice | Retained open |',
    '| --- | ---: | ---: | ---: |',
    ...[...new Set(c.lessons.map((x) => x.originalCategory))].map((category) => {
      const rows = c.lessons.filter((x) => x.originalCategory === category);
      return `| ${category} | ${rows.filter((x) => x.finalMethod === 'structured').length} | ${rows.filter((x) => x.finalMethod === 'choice').length} | ${rows.filter((x) => x.finalMethod === 'open').length} |`;
    }),
    '',
    `The new structured assessments include ${c.lessons.filter((x) => x.finalMethod === 'structured' && x.evidenceLevel === 'production').length} production tasks and ${c.lessons.filter((x) => x.finalMethod === 'structured' && x.evidenceLevel === 'recognition').length} recognition tasks. “Structured” covers ordinary typed answers, compact grids and concise choices. The old choice-conversion category does not mean that every item became multiple choice.`,
    '',
    '## Validation',
    '',
    'Run `npm run content:build` followed by `npm run audit:deterministic`. The generated ledger and report are written to `output/`. The original conversion inputs and coverage digest live under `tools/audit/deterministic/`. An intentional, inspected contract change requires updating the digest with `npm run audit:deterministic -- --write`.',
    '',
    'The check rejects missing or duplicate identities, mismatched historical hashes, missing open-item reasons, disagreement between dispositions and published grading methods, untracked structured definitions, changed source pins, mismatched published assessments, and missing or changed dedicated Review definitions. The committed digest pins the complete generated ledger, independent of formatting or JSON object key order. Inspection references in the ledger use Git commit:path notation.',
    '',
    '## Retained open Review definitions',
    '',
    '| Definition | Required open work |',
    '| --- | --- |',
    ...c.dedicatedReview
      .filter((x) => x.finalMethod === 'open')
      .map((x) => `| \`${x.key}\` | ${markdown(x.reason)} |`),
    '',
    '## Retained open lesson exercises',
    '',
    'The complete key list and individual reasons follow. Original prompts and formulas are also preserved beside each row in the combined ledger.',
    '',
  ];
  for (const p of c.perLesson) {
    const rows = c.lessons.filter((x) => x.lesson === p.lesson && x.finalMethod === 'open');
    if (!rows.length) continue;
    lines.push(`### ${p.title}`, '', '| Exercise | Required open work |', '| --- | --- |');
    lines.push(...rows.map((x) => `| \`${x.key}\` | ${markdown(x.reason)} |`), '');
  }
  return lines.join('\n') + '\n';
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const coverage = assembleCoverage(await loadCoverageInput());
  const baselinePath = 'tools/audit/deterministic/coverage-baseline.json';
  const sha256 = coverageDigest(coverage);
  const { format, resolveConfig } = await import('prettier');
  const options = await resolveConfig('output/deterministic-coverage.md');
  const report = await format(coverageReport(coverage), {
    ...options,
    filepath: 'output/deterministic-coverage.md',
  });
  await mkdir('output', { recursive: true });
  await writeFile(
    'output/deterministic-coverage.json',
    await format(JSON.stringify(coverage), {
      ...options,
      filepath: 'output/deterministic-coverage.json',
    }),
  );
  await writeFile('output/deterministic-coverage.md', report);
  if (process.argv.includes('--write')) {
    await writeFile(baselinePath, JSON.stringify({ sha256 }, null, 2) + '\n');
  } else {
    const baseline = await json<{ sha256: string }>(process.cwd(), baselinePath);
    assert(
      sha256 === baseline.sha256,
      'Coverage differs from the committed baseline; inspect output/deterministic-coverage.json and source changes before updating with --write.',
    );
  }
  console.log(JSON.stringify(coverage.totals));
}
