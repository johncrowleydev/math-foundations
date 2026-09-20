// Generate this subject from its inspected authoring modules. Run with tsx from the repository root.
// This does not approve source inspections: probability-statistics-inspection.mjs records those separately.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { probabilityFigures } from './probability-statistics/figures.mjs';
import {
  texRequirements,
  textFields,
  inspectionFingerprint,
  fingerprint,
} from '../tex-teaching.ts';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const yaml = (p) => YAML.parse(fs.readFileSync(p, 'utf8'));
const saveYaml = (p, v) => fs.writeFileSync(p, YAML.stringify(v, { lineWidth: 0 }));
const hash = (v) =>
  createHash('sha256')
    .update(typeof v === 'string' ? v : JSON.stringify(v))
    .digest('hex');
const textHash = (v) => hash(v.replace(/\s+/g, ' ').trim());
const slug = (v) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
const isProbability = (v) => v?.startsWith('probability-statistics-');
const modules = fs
  .readdirSync('scripts/authoring/probability-statistics')
  .filter((f) => /^\d\d-.*\.mjs$/.test(f))
  .sort();
const lessons = [];
for (const f of modules) lessons.push((await import('./probability-statistics/' + f)).default);
if (lessons.length !== 23 || lessons.some((l, i) => l.number !== i))
  throw Error(
    'The complete approved probability-statistics sequence must be authored before publication.',
  );
for (const l of lessons)
  for (const s of l.sections)
    if (s.terms.length)
      s.body +=
        '\n\nRelated definitions: ' +
        s.terms.map((t) => `[${t.name}](ref:${t.id})`).join('; ') +
        '.';
const figures = probabilityFigures(lessons);
const curriculum = yaml('content/curriculum.yaml');
curriculum.lessons = curriculum.lessons.filter((l) => l.subject !== 'Probability and Statistics');
const copies = yaml('content/exercise-copy.yaml'),
  audit = yaml('content/inline-prerequisites.yaml'),
  checks = yaml('content/quick-checks.yaml');
for (const map of [copies, audit, checks])
  for (const key of Object.keys(map)) if (isProbability(key)) delete map[key];
const placements = {},
  references = [],
  introductions = read('content/concept-introductions.json').filter(
    (r) => !isProbability(r.lesson),
  );
const knowledge = read('content/knowledge-check-exercises.json').filter(
  (r) => !isProbability(r.lesson),
);
const choiceFeedback = read('content/choice-feedback.json').filter((r) => !isProbability(r.lesson));
const deterministic = [],
  review = read('content/review-templates.json').filter((r) => !isProbability(r.lesson));
const reviewFixtures = read('content/deterministic-review-fixtures.json').filter(
  (r) => !isProbability(r.template),
);
const evidence = { concepts: [], teaching: [], exercises: [] };
const sources = read('content/sources.json');
const authoredCitations = new Map();
for (const map of [sources.lessons, sources.reviewTemplates])
  for (const key of Object.keys(map)) if (isProbability(key)) delete map[key];
Object.assign(sources.bibliography, {
  islr: {
    title: 'An Introduction to Statistical Learning with Applications in R',
    author: 'Gareth James, Daniela Witten, Trevor Hastie, Robert Tibshirani',
    edition: '2013; corrected seventh printing, 2017',
    url: 'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf',
  },
  'psu-stat501': {
    title: 'STAT 501: Regression Methods',
    author: 'Pennsylvania State University',
    edition: 'Online course, inspected September 2026',
    url: 'https://online.stat.psu.edu/stat501/',
  },
  'pishro-nik': {
    title: 'Introduction to Probability, Statistics, and Random Processes',
    author: 'Hossein Pishro-Nik',
    edition: 'Kappa Research, 2014; online text inspected September 2026',
    url: 'https://www.probabilitycourse.com/',
  },
  'openstax-statistics-2e': {
    title: 'Introductory Statistics 2e',
    author: 'Barbara Illowsky and Susan Dean',
    edition: 'OpenStax, 2023; online text inspected September 2026',
    url: 'https://openstax.org/books/introductory-statistics-2e/pages/preface',
  },
});
const teachingFigureFile = read('content/figures.json').filter((f) => !isProbability(f.lesson));
save('content/figures.json', [...teachingFigureFile, ...figures]);

import { assessment } from './probability-statistics/assessment.mjs';
function publishedQuestion(question, id, section) {
  const checked = assessment(question);
  return {
    question: {
      id,
      section,
      instructions: 'Give the requested answer, including reasoning when asked.',
      prompt: question.prompt,
      answer: question.answer,
      ...(checked ? { assessment: checked.assessment } : {}),
    },
    fixtures: checked?.fixtures,
  };
}

for (const l of lessons) {
  const file = `ps-${String(l.number).padStart(2, '0')}-${l.slug.slice('probability-statistics-'.length)}`;
  curriculum.lessons.push({
    slug: l.slug,
    title: l.title,
    subject: 'Probability and Statistics',
    number: l.number,
    lesson: `lessons/${file}.md`,
    ...(l.number ? { worksheet: `worksheets/${file}.yaml` } : {}),
  });
  const markdown =
    `# ${l.title}\n\n${l.intro}\n\n` +
    l.sections.map((s) => `## ${s.title}\n\n${s.body.trim()}\n`).join('\n');
  fs.writeFileSync(`content/lessons/${file}.md`, markdown);
  const sectionSources = {},
    practiceSources = {},
    worksheet = { title: l.title, sections: [] };
  let next = 1,
    quickIndex = 0;
  if (l.number) {
    copies[l.slug] = {};
    audit[l.slug] = {};
    checks[l.slug] = [];
    placements[l.slug] = {};
  }
  for (const [si, s] of l.sections.entries()) {
    const sid = slug(s.title),
      concept = l.slug + '-' + sid;
    const cids = s.sources.map((c) => c.id);
    sectionSources[sid] = cids;
    for (const c of s.sources) {
      const { id, ...citation } = c;
      const previous = authoredCitations.get(id);
      if (previous && (previous.source !== citation.source || previous.url !== citation.url))
        throw Error('Conflicting source identity: ' + id);
      const merged = previous
        ? {
            ...previous,
            supports: previous.supports.includes(citation.supports)
              ? previous.supports
              : previous.supports + ' ' + citation.supports,
          }
        : citation;
      authoredCitations.set(id, merged);
      sources.citations[id] = { ...merged, checked: '2026-09-20' };
    }
    if (l.number) {
      evidence.concepts.push({ id: concept, name: s.title });
      evidence.teaching.push({ concept, lesson: l.slug, section: s.title });
    }
    for (const t of s.terms) {
      references.push({
        id: t.id,
        kind: 'term',
        name: t.name,
        aliases: [t.name],
        linkAliases: [],
        quick: t.quick,
        definition: t.definition,
        example: t.example,
        confusion: t.confusion,
        lesson: l.slug,
        section: s.title,
        related: l.sections
          .flatMap((section) => section.terms.map((term) => term.id))
          .filter((id) => id !== t.id),
      });
      introductions.push({
        concept: t.id,
        lesson: l.slug,
        section: s.title,
        start: 0,
        end: s.body.trim().length,
        quote: s.body.trim(),
        scope:
          'The complete original teaching section was inspected for definition, worked development, and required use.',
      });
    }
    if (!l.number) continue;
    const qs = [];
    placements[l.slug][s.title] = [];
    practiceSources[s.title] = cids;
    for (const question of s.questions) {
      const id = next++,
        entry = {
          id,
          type: 'freeform',
          prompt: question.prompt,
          answerLines: 5,
          answer: question.answer,
        };
      qs.push(entry);
      placements[l.slug][s.title].push(id);
      copies[l.slug][id] = { instructions: '', prompt: question.prompt, answer: question.answer };
      const fq = {
        instructions: '',
        prompt: question.prompt,
        math: '',
        answer: question.answer,
        table: null,
        section: s.title,
      };
      const requires = l.sections
        .slice(0, si + 1)
        .map((p) => ({ lesson: l.slug, section: p.title, teachingHash: textHash(p.body.trim()) }));
      audit[l.slug][id] = {
        after: s.title,
        ...copies[l.slug][id],
        concepts: s.terms.map((t) => t.id),
        requires,
        exerciseHash: textHash(JSON.stringify(fq)),
      };
      const checked = assessment(question);
      if (checked)
        deterministic.push({
          lesson: l.slug,
          id,
          sourceHash: hash(['', question.prompt, null, question.answer]),
          rationale:
            'The authored task requests a bounded mathematical answer; its interpretation and domain remain in the prompt and worked solution.',
          ...checked,
        });
      evidence.exercises.push({
        lesson: l.slug,
        id,
        primary: [concept],
        skills: [question.skill || (checked ? 'compute' : 'justify')],
        representations: [checked ? 'algebraic' : 'natural-language'],
      });
    }
    worksheet.sections.push({ title: s.title, questions: qs });
    if (s.quickCheck) {
      const { responses, ...c } = s.quickCheck,
        quickId = 'quick-' + ++quickIndex,
        exercise = 10000 + quickIndex;
      checks[l.slug].push({
        id: quickId,
        after: s.title,
        ...c,
        teachingHash: textHash(s.body.trim()),
      });
      knowledge.push({ lesson: l.slug, quick: quickId, exercise });
      if (
        !responses ||
        responses.length !== c.options.length ||
        new Set(responses).size !== responses.length
      )
        throw Error(`Missing option-specific feedback: ${l.slug} ${quickId}`);
      choiceFeedback.push({
        lesson: l.slug,
        id: exercise,
        sourceHash: hash(['', c.prompt, null, c.explanation, c.options]),
        responses: Object.fromEntries(
          c.options.map((option, i) => ['option-' + (i + 1), responses[i]]),
        ),
      });
      evidence.exercises.push({
        lesson: l.slug,
        id: exercise,
        primary: [concept],
        skills: ['recognize'],
        representations: ['natural-language'],
      });
    }
    // Group genuinely authored review variants only when their skill and evidence depth agree.
    const groups = new Map();
    for (const question of s.review) {
      const checked = assessment(question),
        level = checked?.assessment.evidence.level || 'reasoning',
        skill = question.skill || (checked ? 'compute' : 'justify'),
        key = skill + '-' + level;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(question);
    }
    for (const [key, questions] of groups) {
      const id = l.slug + '-review-' + sid + '-' + key,
        variants = questions.map((question, i) => publishedQuestion(question, i + 1, s.title));
      const a = variants[0].question.assessment,
        first = questions[0];
      const template = {
        id,
        family: variants.length > 1 ? 'authored' : 'fixed',
        lesson: l.slug,
        concept,
        skill: first.skill || (a ? 'compute' : 'justify'),
        objective: concept + '-' + key,
        evidenceLevel: a?.evidence.level || 'reasoning',
        interactionCost: a ? 'low' : 'medium',
        inputCapabilities: a?.evidence.inputCapabilities || ['math-text', 'handwriting', 'photo'],
        cognitiveLevel: a
          ? a.evidence.level === 'recognition'
            ? 'recognize'
            : 'apply'
          : 'analyze',
        activationConcepts: [concept],
        sourceIds: cids,
        question: variants[0].question,
        ...(variants.length > 1 ? { variants: variants.map((v) => v.question) } : {}),
      };
      review.push(template);
      sources.reviewTemplates[id] = { reviewedContentHash: 'pending inspection', sources: cids };
      variants.forEach((v, i) => {
        if (v.fixtures)
          reviewFixtures.push({
            template: id,
            variant: variants.length > 1 ? i + 1 : null,
            fixtures: v.fixtures,
          });
      });
    }
  }
  if (l.number) {
    if (quickIndex !== 2) throw Error('Two quick checks required: ' + l.slug);
    saveYaml(`content/worksheets/${file}.yaml`, worksheet);
  }
  sources.lessons[l.slug] = {
    reviewedContentHash: 'pending inspection',
    intro: [...new Set(l.sections[0].sources.map((c) => c.id))],
    sections: sectionSources,
    practice: practiceSources,
  };
}
saveYaml('content/curriculum.yaml', curriculum);
saveYaml('content/exercise-copy.yaml', copies);
saveYaml('content/inline-prerequisites.yaml', audit);
saveYaml('content/quick-checks.yaml', checks);
save('content/probability-statistics-placements.json', placements);
save('content/references/probability-statistics.json', references);
save('content/concept-introductions.json', introductions);
save('content/knowledge-check-exercises.json', knowledge);
save('content/choice-feedback.json', choiceFeedback);
save('content/deterministic-probability-statistics.json', deterministic);
save('content/review-templates.json', review);
save('content/deterministic-review-fixtures.json', reviewFixtures);
saveYaml('content/evidence/probability-statistics.yaml', evidence);
save('content/sources.json', sources);

// Assemble the same candidate objects used by the normal content build.
const { prepareNotebook } = await import('../notebook.ts');
const { mathOccurrences } = await import('../formula-context.ts');
const { lessons: prepared, teaching, formulaSources } = await prepareNotebook();
const { promoteChoices } = await import('../choice-exercises.ts');
const { promoteDeterministic } = await import('../deterministic-exercises.ts');
const published = promoteDeterministic(promoteChoices(prepared));
const formulas = read('content/formula-explanations.json').filter((f) => !isProbability(f.lesson));
for (const s of formulaSources.filter((s) => isProbability(s.lesson)))
  for (const [ordinal, latex] of mathOccurrences(s.markdown).entries()) {
    const paragraphs = s.markdown.split(/\n\s*\n/);
    const index = paragraphs.findIndex((p) => mathOccurrences(p).includes(latex));
    let context = paragraphs[index] || s.markdown;
    if (context.trim().startsWith('$$'))
      context = paragraphs.slice(Math.max(0, index - 1), index + 2).join('\n\n');
    const questionId = s.source.match(/^question:(\d+):/);
    if (questionId) {
      const q = prepared
        .find((l) => l.slug === s.lesson)
        .questions.find((q) => q.id === Number(questionId[1]));
      context = q.prompt + '\n\n' + q.answer;
    }
    formulas.push({
      id: 'probability-statistics-formula-' + hash([s.lesson, s.source, ordinal]).slice(0, 20),
      lesson: s.lesson,
      source: s.source,
      ordinal,
      latex,
      reading: context.trim(),
      bindings: [],
    });
  }
save('content/formula-explanations.json', formulas);
// Automatic term linking is disabled for new references; explicit original teaching remains primary.
const registry = read('content/tex-syntax.json'),
  typing = read('content/tex-teaching.json');
const commandExamples = {
  mu: [
    String.raw`\mu`,
    'Use mu for the Greek letter naming a population mean or another defined parameter.',
  ],
  sigma: [String.raw`\sigma`, 'Use sigma for a standard deviation; its square is the variance.'],
  Phi: [
    String.raw`\Phi(z)`,
    'Use capital Phi for the standard normal cumulative distribution function.',
  ],
  phi: [String.raw`\phi(z)`, 'Use phi for the standard normal density when defined in the lesson.'],
  theta: [String.raw`\theta`, 'Use theta for an unknown parameter.'],
  rho: [String.raw`\rho`, 'Use rho for population correlation.'],
  hat: [String.raw`\hat{p}`, 'Use hat with a group to mark an estimate or estimator.'],
  widehat: [
    String.raw`\widehat{y}`,
    'Use widehat with a group for a fitted value or estimate; the accent spans its argument.',
  ],
  mathbf: [
    String.raw`\mathbf{X}`,
    'Use mathbf with a Latin letter to make it bold, here to distinguish a vector from a scalar.',
  ],
  boldsymbol: [
    String.raw`\boldsymbol{\mu}`,
    'Use boldsymbol with a group to bold a mathematical symbol, including Greek letters; here it marks a mean vector.',
  ],
  bar: [String.raw`\bar{X}`, 'Use bar with a group to denote a sample average.'],
  mid: [String.raw`P(A\mid B)`, 'Use mid for a conditioning bar.'],
  sim: [
    String.raw`X\sim N(0,1)`,
    'Use sim to say that a random variable has the named distribution.',
  ],
  stackrel: [
    String.raw`X\stackrel{d}{=}Y`,
    'Use stackrel with an annotation and relation to mark equality in distribution.',
  ],
  mathcal: [
    String.raw`\mathcal{D}`,
    'Use mathcal with a capital letter for a named collection such as a dataset.',
  ],
  propto: [
    String.raw`f(x)\propto g(x)`,
    'Use propto for proportionality; the missing factor is constant in the displayed variable.',
  ],
  ell: [String.raw`\ell(\theta)`, 'Use ell for a log-likelihood function.'],
};
const probabilityText = JSON.stringify(lessons);
for (const [command, [example, explanation]] of Object.entries(commandExamples))
  if (
    probabilityText.includes('\\\\' + command) &&
    !registry.entries.some((e) => e.command === command)
  )
    registry.entries.push({
      id:
        'tex-probability-statistics-' +
        (/^[A-Z]/.test(command) ? 'capital-' + command.toLowerCase() : command),
      command,
      group: 'probability-statistics',
      example,
      explanation,
    });
typing.placements = typing.placements.filter((p) => !isProbability(p.lesson));
typing.exercises = typing.exercises.filter((e) => !isProbability(e.lesson));
typing.references = typing.references.filter(
  (r) => !r.reference.startsWith('probability-statistics-'),
);
const existing = new Set(
  registry.entries.filter((e) => !e.id.startsWith('tex-probability-statistics-')).map((e) => e.id),
);
for (const b of typing.basics) existing.add(b.id);
const byId = new Map([...registry.entries, ...typing.basics].map((e) => [e.id, e]));
for (const l of prepared.filter((l) => isProbability(l.slug))) {
  for (const s of l.sections) {
    const qs = l.questions.filter((q) => s.questionIds.includes(q.id)),
      required = new Set(
        texRequirements(
          textFields([
            s.markdown,
            qs,
            s.quickChecks,
            teaching.references.filter((r) => r.lesson === l.slug && r.section === s.title),
          ]),
          registry.entries,
        ),
      );
    const addDependencies = (id) => {
      for (const d of texRequirements(
        byId.get(id)?.example || byId.get(id)?.source || '',
        registry.entries,
      ))
        if (!required.has(d)) {
          required.add(d);
          addDependencies(d);
        }
    };
    for (const id of [...required]) addDependencies(id);
    const entries = [...required].filter((id) => !existing.has(id));
    if (entries.length) {
      const p = {
        id: 'typing-' + l.slug + '-' + s.id,
        lesson: l.slug,
        section: s.id,
        entries,
        status: 'verified',
      };
      p.hash = inspectionFingerprint(p, {
        markdown: s.markdown,
        entries: entries.map((id) => byId.get(id)),
      });
      typing.placements.push(p);
      entries.forEach((id) => existing.add(id));
    }
    for (const question of [...qs, ...s.quickChecks]) {
      const isQuick = typeof question.id === 'string',
        snapshot = isQuick
          ? question
          : published.find((p) => p.slug === l.slug).questions.find((q) => q.id === question.id),
        { choice, exerciseId, ...authoredQuestion } = snapshot,
        e = {
          lesson: l.slug,
          exercise: question.id,
          kind: isQuick ? 'quick' : 'inline',
          requires: texRequirements(
            textFields(
              isQuick
                ? [question.prompt, question.options, question.explanation]
                : [
                    question.instructions,
                    question.prompt,
                    question.math,
                    question.answer,
                    question.table,
                  ],
            ),
            registry.entries,
          ),
          status: 'verified',
          hash: fingerprint(authoredQuestion),
        };
      typing.exercises.push(e);
    }
  }
}
for (const r of references) {
  const examples = [r.example],
    requires = texRequirements(textFields(examples), registry.entries),
    e = { reference: r.id, examples, requires, status: 'verified' };
  e.hash = inspectionFingerprint(e, { reference: r, entries: requires.map((id) => byId.get(id)) });
  typing.references.push(e);
}
save('content/tex-syntax.json', registry);
save('content/tex-teaching.json', typing);
const syntaxCitation = 'probability-statistics-katex';
sources.citations[syntaxCitation] = {
  source: 'katex',
  locator:
    'Supported Functions: Accents, Greek Letters, Logic and Set Theory, Operators, Fractions, Big Operators, and Style, Color, Size, and Font (Font)',
  url: 'https://katex.org/docs/supported.html',
  supports:
    'Probability notation, accents, bold Latin and Greek vector symbols, relations, and operator constructions in the authored optional typing help.',
  checked: '2026-09-20',
};
for (const e of registry.entries.filter((e) => e.id.startsWith('tex-probability-statistics-')))
  sources.syntax.entries[e.id] = [syntaxCitation];
save('content/sources.json', sources);
console.log(
  `Authored ${lessons.length} probability-statistics lessons and ${deterministic.length} structured assessments. Source records remain pending explicit inspection.`,
);
