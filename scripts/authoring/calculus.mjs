// Generate this subject from its inspected authoring modules. Run with tsx from the repository root.
// This does not approve source inspections: calculus-inspection.mjs records those separately.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import differentiationFeedback from './calculus/quick-feedback-differentiation.mjs';
import integrationFeedback from './calculus/quick-feedback-integration.mjs';
import multivariableFeedback from './calculus/quick-feedback-multivariable.mjs';
const feedback = { ...differentiationFeedback, ...integrationFeedback, ...multivariableFeedback };
import { calculusFigures } from './calculus/figures.mjs';
import { validateAssessment, gradeAssessment } from '../../shared/deterministic.ts';
import {
  texRequirements,
  textFields,
  inspectionFingerprint,
  fingerprint,
} from '../tex-teaching.ts';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
// Regeneration must preserve the established catalog order, including families
// added by later curriculum audits, and must not roll source-inspection dates back.
const previousSources = read('content/sources.json');
const previousOrder = new Map([
  ['content/review-templates.json', read('content/review-templates.json').map((v) => v.id)],
  [
    'content/deterministic-review-fixtures.json',
    read('content/deterministic-review-fixtures.json').map((v) => `${v.template}/${v.variant}`),
  ],
]);
const save = (p, v) => {
  if (previousOrder.has(p)) {
    const order = new Map(previousOrder.get(p).map((id, i) => [id, i]));
    const key = (entry) => entry.id ?? `${entry.template}/${entry.variant}`;
    v.sort(
      (a, b) =>
        (order.get(key(a)) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(key(b)) ?? Number.MAX_SAFE_INTEGER),
    );
  }
  if (p === 'content/sources.json') {
    for (const field of ['citations', 'lessons', 'reviewTemplates']) {
      const keys = [...new Set([...Object.keys(previousSources[field]), ...Object.keys(v[field])])];
      v[field] = Object.fromEntries(
        keys.filter((key) => key in v[field]).map((key) => [key, v[field][key]]),
      );
    }
    for (const [id, citation] of Object.entries(v.citations)) {
      const prior = previousSources.citations[id];
      if (!prior) continue;
      const { checked: priorDate, ...priorPassage } = prior;
      const { checked, ...passage } = citation;
      if (JSON.stringify(priorPassage) === JSON.stringify(passage) && priorDate > checked)
        citation.checked = priorDate;
    }
  }
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
};
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
const isCalc = (v) => v?.startsWith('calculus-');
const modules = fs
  .readdirSync('scripts/authoring/calculus')
  .filter((f) => /^\d\d-.*\.mjs$/.test(f))
  .sort();
const lessons = [];
for (const f of modules) lessons.push((await import('./calculus/' + f)).default);
if (lessons.length !== 23 || lessons.some((l, i) => l.number !== i))
  throw Error('The complete approved calculus sequence must be authored before publication.');
for (const l of lessons)
  for (const s of l.sections)
    if (s.terms.length)
      s.body +=
        '\n\nRelated definitions: ' +
        s.terms.map((t) => `[${t.name}](ref:${t.id})`).join('; ') +
        '.';
const figures = calculusFigures(lessons);
const curriculum = yaml('content/curriculum.yaml');
curriculum.lessons = curriculum.lessons.filter((l) => l.subject !== 'Calculus');
const copies = yaml('content/exercise-copy.yaml'),
  audit = yaml('content/inline-prerequisites.yaml'),
  checks = yaml('content/quick-checks.yaml');
for (const map of [copies, audit, checks])
  for (const key of Object.keys(map)) if (isCalc(key)) delete map[key];
const placements = {},
  references = [],
  introductions = read('content/concept-introductions.json').filter((r) => !isCalc(r.lesson));
const knowledge = read('content/knowledge-check-exercises.json').filter((r) => !isCalc(r.lesson));
const choiceFeedback = read('content/choice-feedback.json').filter((r) => !isCalc(r.lesson));
const deterministic = [],
  review = read('content/review-templates.json').filter((r) => !isCalc(r.lesson));
const reviewFixtures = read('content/deterministic-review-fixtures.json').filter(
  (r) => !isCalc(r.template),
);
const evidence = { concepts: [], teaching: [], exercises: [] };
const sources = read('content/sources.json');
for (const map of [sources.lessons, sources.reviewTemplates])
  for (const key of Object.keys(map)) if (isCalc(key)) delete map[key];
for (const n of [1, 2, 3])
  sources.bibliography['openstax-calculus-' + n] = {
    title: `Calculus Volume ${n}`,
    author: 'Gilbert Strang and Edwin Herman',
    edition: 'OpenStax, Rice University; online edition inspected September 2026',
    url: `https://openstax.org/books/calculus-volume-${n}/pages/preface`,
  };
const teachingFigureFile = read('content/figures.json').filter((f) => !isCalc(f.lesson));
save('content/figures.json', [...teachingFigureFile, ...figures]);

function assessment(question) {
  if (!question.check) return undefined;
  const c = question.check,
    recognition = ['boolean', 'term', 'selection'].includes(c.validator),
    bool = c.validator === 'boolean';
  const a = {
    version: 1,
    inputs: [
      {
        id: 'answer',
        kind: bool ? 'boolean' : c.validator === 'term' ? 'text' : 'math',
        label: bool ? 'Answer true or false' : 'Answer',
      },
    ],
    requirements: [
      {
        id: 'answer',
        description: 'The requested mathematical answer',
        validator: c.validator,
        fields: ['answer'],
        params: c.params,
      },
    ],
    feedback: { correct: question.answer, incorrect: question.answer },
    evidence: {
      level: recognition ? 'recognition' : 'production',
      interactionCost: 'low',
      inputCapabilities: [bool ? 'tap' : c.validator === 'term' ? 'short-text' : 'math-text'],
    },
  };
  validateAssessment(a);
  const fixtures = [
    { response: { answer: c.correct }, verdict: 'correct' },
    { response: { answer: c.incorrect }, verdict: 'incorrect' },
  ];
  for (const value of c.extraValid || [])
    fixtures.push({ response: { answer: value }, verdict: 'correct' });
  for (const f of fixtures) {
    let result;
    try {
      result = gradeAssessment(a, f.response);
    } catch (e) {
      throw Error(question.prompt + '\n' + JSON.stringify(f) + '\n' + e.message);
    }
    if (result.verdict !== f.verdict)
      throw Error('Authoring answer fixture failed: ' + question.prompt + ' ' + JSON.stringify(f));
  }
  return { assessment: a, fixtures };
}
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
  const file = `calc-${String(l.number).padStart(2, '0')}-${l.slug.slice(9)}`;
  curriculum.lessons.push({
    slug: l.slug,
    title: l.title,
    subject: 'Calculus',
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
      sources.citations[id] = { ...citation, checked: '2026-09-19' };
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
      const c = s.quickCheck,
        quickId = 'quick-' + ++quickIndex,
        exercise = 10000 + quickIndex;
      checks[l.slug].push({
        id: quickId,
        after: s.title,
        ...c,
        teachingHash: textHash(s.body.trim()),
      });
      knowledge.push({ lesson: l.slug, quick: quickId, exercise });
      const responses = feedback[l.slug]?.[quickIndex - 1];
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
        cognitiveLevel: a ? 'apply' : 'analyze',
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
save('content/calculus-placements.json', placements);
save('content/references/calculus.json', references);
save('content/concept-introductions.json', introductions);
save('content/knowledge-check-exercises.json', knowledge);
save('content/choice-feedback.json', choiceFeedback);
save('content/deterministic-calculus.json', deterministic);
save('content/review-templates.json', review);
save('content/deterministic-review-fixtures.json', reviewFixtures);
saveYaml('content/evidence/calculus.yaml', evidence);
save('content/sources.json', sources);

// Assemble the same candidate objects used by the normal content build.
const { prepareNotebook } = await import('../notebook.ts');
const { mathOccurrences } = await import('../formula-context.ts');
const { lessons: prepared, teaching, formulaSources } = await prepareNotebook();
const { promoteChoices } = await import('../choice-exercises.ts');
const { promoteDeterministic } = await import('../deterministic-exercises.ts');
const published = promoteDeterministic(promoteChoices(prepared));
const formulas = read('content/formula-explanations.json').filter((f) => !isCalc(f.lesson));
for (const s of formulaSources.filter((s) => isCalc(s.lesson)))
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
      id: 'calculus-formula-' + hash([s.lesson, s.source, ordinal]).slice(0, 20),
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
  partial: [
    String.raw`\frac{\partial f}{\partial x}`,
    'Use partial for the curved derivative symbol; frac groups its numerator and denominator.',
  ],
  nabla: [
    String.raw`\nabla f`,
    'Use nabla before the scalar function whose gradient is being described.',
  ],
  int: [
    String.raw`\int_a^b f(x)\,dx`,
    'Use int for an integral and subscripts/superscripts for its limits.',
  ],
  iint: [
    String.raw`\iint_R f(x,y)\,dA`,
    'Use iint for a double integral; its subscript names the region.',
  ],
  lim: [
    String.raw`\lim_{x\to a}f(x)`,
    'Use lim with a grouped subscript naming the approaching input.',
  ],
  sin: [
    String.raw`\sin(x)`,
    'Use sin for the sine function and parentheses to make its argument explicit.',
  ],
  tan: [String.raw`\tan(x)`, 'Use tan for the tangent function.'],
  sec: [String.raw`\sec(x)`, 'Use sec for the secant function.'],
  csc: [String.raw`\csc(x)`, 'Use csc for the cosecant function.'],
  cot: [String.raw`\cot(x)`, 'Use cot for the cotangent function.'],
  arcsin: [
    String.raw`\arcsin(x)`,
    'Use arcsin for inverse sine, with its principal-value convention supplied by the lesson.',
  ],
  arccos: [String.raw`\arccos(x)`, 'Use arccos for inverse cosine.'],
  arctan: [String.raw`\arctan(x)`, 'Use arctan for inverse tangent.'],
  ln: [String.raw`\ln(x)`, 'Use ln for the natural logarithm.'],
  exp: [String.raw`\exp(x)`, 'Use exp for the natural exponential function.'],
  tfrac: [
    String.raw`\tfrac{a}{b}`,
    'Use tfrac with numerator and denominator groups for a compact fraction.',
  ],
  dfrac: [String.raw`\dfrac{a}{b}`, 'Use dfrac with two groups for a display-size fraction.'],
  epsilon: [
    String.raw`\epsilon`,
    'Use epsilon for the Greek symbol representing a positive tolerance when specified.',
  ],
  delta: [
    String.raw`\delta`,
    'Use delta for the Greek symbol; its meaning is given by the limit statement.',
  ],
  alpha: [
    String.raw`\alpha`,
    'Use alpha for a parameter such as a step size, as defined in context.',
  ],
  lambda: [String.raw`\lambda`, 'Use lambda for a multiplier or parameter, as defined in context.'],
  pi: [String.raw`\pi`, 'Use pi for the circle constant.'],
  infty: [String.raw`\infty`, 'Use infty for infinity; it is not a finite endpoint value.'],
  approx: [String.raw`a\approx b`, 'Use approx to distinguish an approximation from equality.'],
  Delta: [String.raw`\Delta x`, 'Use capital Delta before a quantity to denote its finite change.'],
  min: [String.raw`\min(a,b)`, 'Use min for the smaller of the listed values.'],
  max: [String.raw`\max(a,b)`, 'Use max for the larger of the listed values.'],
  beta: [String.raw`\beta`, 'Use beta for a parameter named in the surrounding mathematics.'],
  xi: [
    String.raw`\xi`,
    'Use xi for the Greek symbol naming an intermediate point in a remainder formula.',
  ],
  downarrow: [
    String.raw`x\downarrow a`,
    'Use downarrow to describe decreasing toward a from above.',
  ],
  uparrow: [String.raw`x\uparrow a`, 'Use uparrow to describe increasing toward a from below.'],
  le: [String.raw`a\le b`, 'Use le for less than or equal to; leq gives the same relation.'],
  ge: [String.raw`a\ge b`, 'Use ge for greater than or equal to; geq gives the same relation.'],
  not: [String.raw`a\not=b`, 'Use not immediately before a relation to negate it.'],
  Pi: [
    String.raw`\Pi`,
    'Use capital Pi for the Greek letter; here it names a profit function. It is distinct from the circle constant pi.',
  ],
  dots: [String.raw`1,2,\dots`, 'Use dots for an ellipsis indicating a stated continuing pattern.'],
  eta: [
    String.raw`\eta`,
    'Use eta for a named tolerance or parameter, with its meaning stated in the argument.',
  ],
  implies: [String.raw`P\implies Q`, 'Use implies between a hypothesis and its consequence.'],
  longrightarrow: [
    String.raw`x\longrightarrow a`,
    'Use longrightarrow for a longer approach arrow.',
  ],
};
const calculusText = JSON.stringify(lessons);
for (const [command, [example, explanation]] of Object.entries(commandExamples))
  if (
    calculusText.includes('\\\\' + command) &&
    !registry.entries.some((e) => e.command === command)
  )
    registry.entries.push({
      id: 'tex-calculus-' + (/^[A-Z]/.test(command) ? 'capital-' + command.toLowerCase() : command),
      command,
      group: 'calculus',
      example,
      explanation,
    });
typing.placements = typing.placements.filter((p) => !isCalc(p.lesson));
typing.exercises = typing.exercises.filter((e) => !isCalc(e.lesson));
typing.references = typing.references.filter((r) => !r.reference.startsWith('calculus-'));
const existing = new Set(
  registry.entries.filter((e) => !e.id.startsWith('tex-calculus-')).map((e) => e.id),
);
for (const b of typing.basics) existing.add(b.id);
const byId = new Map([...registry.entries, ...typing.basics].map((e) => [e.id, e]));
for (const l of prepared.filter((l) => isCalc(l.slug))) {
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
const syntaxCitation = 'calculus-katex';
sources.citations[syntaxCitation] = {
  source: 'katex',
  locator:
    'Supported Functions: Logic and Set Theory, Operators, Fractions, Greek Letters, and Big Operators',
  url: 'https://katex.org/docs/supported.html',
  supports:
    'The supported calculus commands, grouping, function notation, derivatives, and integral limits in the authored optional typing help.',
  checked: '2026-09-19',
};
for (const e of registry.entries.filter((e) => e.id.startsWith('tex-calculus-')))
  sources.syntax.entries[e.id] = [syntaxCitation];
save('content/sources.json', sources);
console.log(
  `Authored ${lessons.length} calculus lessons and ${deterministic.length} structured assessments. Source records remain pending explicit inspection.`,
);
