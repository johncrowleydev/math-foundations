import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  deterministicExercises,
  promoteDeterministic,
  validateDeterministicEntry,
} from './deterministic-exercises.js';
import { gradeAssessment } from '../shared/deterministic.js';
import { prepareNotebook } from './notebook.js';
import { promoteChoices } from './choice-exercises.js';

const entry = (lesson: string, id: number) =>
  deterministicExercises.find((e) => e.lesson === lesson && e.id === id)!;
const fixed = [
  ['predicates-and-quantifiers', 83, String.raw`D=\{a,b\}`],
  ['predicates-and-quantifiers', 84, String.raw`D=\{a,b\}`],
  ['predicates-and-quantifiers', 95, String.raw`P(a)=P(b)=F`],
  ['functions', 73, String.raw`f(3)=b`],
  ['proof-by-contrapositive', 50, String.raw`g(3)=u`],
  ['sets-and-set-operations', 64, String.raw`S=X=\{1\}`],
] as const;

test('converted counterexamples publish explanations for their actual domains and retain historical pins', async () => {
  const historical = JSON.parse(await readFile('docs/deterministic-grading-audit.json', 'utf8'));
  const { lessons } = await prepareNotebook();
  const published = promoteDeterministic(promoteChoices(lessons));
  for (const [slug, id, domainFragment] of fixed) {
    const e = entry(slug, id);
    const old = historical.exercises.find(
      (row: { key: string }) => row.key === `${slug}-${id}`,
    ).publishedQuestion;
    const q = published.find((l) => l.slug === slug)!.questions.find((q) => q.id === id)!;
    assert.equal(
      e.sourceHash,
      createHash('sha256')
        .update(JSON.stringify([old.instructions, old.prompt, old.math, old.officialAnswer]))
        .digest('hex'),
    );
    assert.notEqual(
      q.answer,
      old.officialAnswer,
      `${slug}-${id} must not reveal the old domain example`,
    );
    assert.equal(q.answer, e.assessment.feedback.correct);
    assert.ok(
      q.answer.includes(domainFragment),
      `${slug}-${id} must use the requested finite domain`,
    );
    const stale = structuredClone(e);
    stale.assessment.feedback.correct = old.officialAnswer;
    assert.throws(() => validateDeterministicEntry(stale), /Converted answer must match/);
  }
});

test('two-element quantifier countermodels agree with independent exhaustive truth conditions', () => {
  const names = ['pa', 'qa', 'pb', 'qb'];
  for (let mask = 0; mask < 16; mask++) {
    const [pa, qa, pb, qb] = names.map((_, bit) => !!(mask & (1 << bit)));
    const truth = new Set(names.filter((_, bit) => !!(mask & (1 << bit))));
    const expected = [
      [83, (pa || qa) && (pb || qb) && !(pa && pb) && !(qa && qb)],
      [84, (pa || pb) && (qa || qb) && !(pa && qa) && !(pb && qb)],
      [95, (!pa || qa) && (!pb || qb) && (qa || qb) && !(pa || pb)],
    ] as const;
    for (const [id, correct] of expected) {
      assert.equal(
        gradeAssessment(entry('predicates-and-quantifiers', id).assessment, {
          decision: 'no',
          pairs: [...truth],
        }).verdict,
        correct ? 'correct' : 'incorrect',
        `${id}: ${mask}`,
      );
    }
  }
});

test('composition counterexamples check both domain inputs and all outer-function inputs', () => {
  const a = entry('proof-by-contrapositive', 50).assessment;
  for (let first = 1; first <= 3; first++)
    for (let second = 1; second <= 3; second++) {
      for (let mask = 0; mask < 8; mask++) {
        const outputs = Array.from({ length: 3 }, (_, i) => (mask & (1 << i) ? 'u' : 'v'));
        const compositeInjective = outputs[first - 1] !== outputs[second - 1];
        const outerInjective = new Set(outputs).size === outputs.length;
        assert.equal(
          gradeAssessment(a, {
            fa: String(first),
            fb: String(second),
            g1: outputs[0],
            g2: outputs[1],
            g3: outputs[2],
          }).verdict,
          compositeInjective && !outerInjective ? 'correct' : 'incorrect',
        );
      }
    }
});

test('finite images and numeric access policies use actual sets, not the old explanatory domains', () => {
  const set = (items: Iterable<string | number>) => `{${[...items].join(',')}}`;
  const a = entry('functions', 73).assessment;
  for (let map = 0; map < 8; map++)
    for (let left = 0; left < 8; left++)
      for (let right = 0; right < 8; right++) {
        const outputs = [0, 1, 2].map((i) => (map & (1 << i) ? 'a' : 'b'));
        const s = [1, 2, 3].filter((i) => left & (1 << (i - 1)));
        const w = [1, 2, 3].filter((i) => right & (1 << (i - 1)));
        const imageS = new Set(s.map((i) => outputs[i - 1]));
        const imageW = new Set(w.map((i) => outputs[i - 1]));
        const imageIntersection = new Set(
          s.filter((i) => w.includes(i)).map((i) => outputs[i - 1]),
        );
        const intersectionImages = new Set([...imageS].filter((v) => imageW.has(v)));
        const unequal = imageIntersection.size !== intersectionImages.size;
        assert.equal(
          gradeAssessment(a, {
            f: set(outputs.map((value, i) => `(${i + 1},${value})`)),
            s: set(s),
            w: set(w),
            left: set(imageIntersection),
            right: set(intersectionImages),
          }).verdict,
          unequal ? 'correct' : 'incorrect',
        );
      }
  const policy = entry('sets-and-set-operations', 64).assessment;
  for (let mask = 0; mask < 16; mask++) {
    const fields = ['E', 'T', 'S', 'X'];
    const [employee, trained, suspended, exception] = fields.map((_, i) => !!(mask & (1 << i)));
    const admitted = (employee && trained && !suspended) || exception;
    const response = Object.fromEntries(
      fields.map((field, i) => [field, mask & (1 << i) ? '{1}' : '{}']),
    );
    assert.equal(
      gradeAssessment(policy, response).verdict,
      admitted && suspended ? 'correct' : 'incorrect',
    );
  }
});
