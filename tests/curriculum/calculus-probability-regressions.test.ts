import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gradeAssessment, InputError } from '../../shared/deterministic.js';

const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const notebook = await read('output/content/notebook.json');
const reviews = await read('content/review-templates.json');
const references = await read('content/references/probability-statistics.json');
const calculus = (suffix: string) => 'calculus-' + suffix;
const probability = (suffix: string) => 'probability-statistics-' + suffix;
const question = (lesson: string, id: number) => {
  const q = notebook.lessons
    .find((l: any) => l.slug === lesson)
    ?.questions.find((q: any) => q.id === id);
  assert.ok(q, `${lesson}:${id}`);
  return q;
};
const variants = (lesson: string) =>
  reviews.filter((t: any) => t.lesson === lesson).flatMap((t: any) => t.variants ?? [t.question]);
const number = (value: string): number => {
  // Independent numeric decoder for the rational literals used by these oracles.
  assert.match(value, /^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/);
  const [a, b = '1'] = value.split('/');
  return Number(a) / Number(b);
};
const expected = (q: any) => q.assessment.requirements[0].params.expected.map(number);
const equal = (actual: number, value: number) =>
  assert.ok(Math.abs(actual - value) < 1e-12, `${actual} != ${value}`);

test('finite probability answers agree with enumeration of labeled outcomes', () => {
  // Enumeration is independent of the authored binomial / hypergeometric formulas.
  const binomial = (n: number, p: number, predicate: (k: number) => boolean) => {
    let sum = 0;
    for (let mask = 0; mask < 2 ** n; mask++) {
      const k = mask.toString(2).replaceAll('0', '').length;
      if (predicate(k)) sum += p ** k * (1 - p) ** (n - k);
    }
    return sum;
  };
  const b = probability('bernoulli-binomial-geometric');
  const cases: [number, number, number, (k: number) => boolean][] = [
    [11, 4, 1 / 2, (k) => k === 2],
    [12, 3, 1 / 4, (k) => k === 1],
    [13, 3, 1 / 4, (k) => k === 3],
    [17, 5, 1 / 2, (k) => k === 2],
    [21, 3, 1 / 2, (k) => k >= 1],
    [22, 3, 1 / 2, (k) => k > 1],
    [23, 4, 1 / 3, (k) => k === 0],
    [24, 4, 1 / 3, (k) => k >= 1],
    [25, 4, 1 / 3, (k) => k <= 1],
    [26, 4, 1 / 3, (k) => k >= 2],
  ];
  for (const [id, n, p, predicate] of cases)
    equal(expected(question(b, id))[0], binomial(n, p, predicate));
  const hyper = (N: number, K: number, n: number) => {
    const counts: number[] = [];
    for (let mask = 0; mask < 2 ** N; mask++) {
      const selected = Array.from({ length: N }, (_, i) => i).filter((i) => mask & (1 << i));
      if (selected.length === n) counts.push(selected.filter((i) => i < K).length);
    }
    return counts;
  };
  const h = probability('hypergeometric-poisson');
  const counts = hyper(8, 3, 2);
  for (const [id, predicate] of [
    [1, (k: number) => k === 2],
    [2, (k: number) => k === 1],
    [3, (k: number) => k === 0],
    [4, (k: number) => k >= 1],
  ] as const)
    equal(expected(question(h, id))[0], counts.filter(predicate).length / counts.length);
  for (const [id, N, K, n] of [
    [13, 10, 4, 5],
    [18, 6, 3, 2],
  ]) {
    const values = hyper(N, K, n),
      mean = values.reduce((a, b) => a + b, 0) / values.length;
    equal(
      expected(question(h, id))[0],
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length,
    );
  }
});

test('sample-size and family-error tasks ask for unique certified boundaries', () => {
  const lesson = probability('concentration-monte-carlo');
  for (const [id, variance, epsNumerator, epsDenominator, failureDenominator] of [
    [25, 1, 1, 2, 10],
    [27, 4, 1, 2, 20],
    [29, 9, 1, 1, 10],
    [31, 2, 1, 5, 20],
    [33, 1, 1, 10, 100],
  ]) {
    const q = question(lesson, id),
      n = expected(q)[0];
    assert.match(q.prompt, /smallest integer.*certified/);
    // Exact integer cross-products verify sufficiency and minimality without rounding.
    const numerator = variance * epsDenominator ** 2 * failureDenominator;
    assert.ok(n * epsNumerator ** 2 >= numerator);
    assert.ok((n - 1) * epsNumerator ** 2 < numerator);
    assert.ok((n + 1) * epsNumerator ** 2 >= numerator); // valid under the old ambiguous wording
  }
  for (const [id, alpha, m] of [
    [49, 0.05, 5],
    [51, 0.05, 10],
    [53, 0.04, 4],
    [55, 0.1, 20],
    [57, 0.08, 8],
  ]) {
    const q = question(probability('hypothesis-testing'), id);
    assert.match(q.prompt, /largest common per-test/);
    equal(expected(q)[0] * m, alpha);
  }
  assert.match(question(calculus('limits-continuity'), 48).prompt, /least integer upper bound/);
  assert.match(question(calculus('double-integrals'), 9).prompt, /sharp lower and upper/);
  assert.match(question(probability('probability-models-events'), 28).prompt, /exactly four/);
});

test('direction and path rates explicitly require differentiability', () => {
  for (const id of [24, 25])
    assert.match(
      question(calculus('related-rates-approximation'), id).prompt,
      /nonnegative distance/,
    );
  const diagonal = variants(calculus('multivariable-extrema')).find((q: any) =>
    /H=diag/.test(q.prompt),
  );
  assert.ok(diagonal, 'The Hessian must specify zero off-diagonal entries.');
  for (const id of Array.from({ length: 10 }, (_, i) => 32 + i))
    assert.match(question(calculus('gradients'), id).prompt, /differentiable/);
  for (const [id, a, b] of [
    [2, 1, 2],
    [4, -1, 3],
    [6, 2, -1],
    [8, 0, 2],
    [10, 3, 1],
  ]) {
    const q = question(calculus('multivariable-chain-rule'), id);
    assert.match(q.prompt, /where \$f\$ is differentiable/);
    equal(expected(q)[0], 2 * a - 3 * b);
  }
  for (const q of variants(calculus('gradients')).filter((q: any) =>
    /gradient \(6,8\)/.test(q.prompt),
  ))
    assert.match(q.prompt, /differentiable/);
  const maximum = variants(calculus('multivariable-extrema')).find((q: any) =>
    /f_xx=-2/.test(q.prompt),
  );
  assert.match(maximum.prompt, /twice continuously differentiable/);
  // Counterexample underlying the fix: coordinate partials exist, diagonal continuity fails.
  const f = (x: number, y: number) =>
    x === 0 && y === 0 ? 0 : x + 2 * y + (x * y) / (x * x + y * y);
  equal(f(0.001, 0) / 0.001, 1);
  equal(f(0, 0.001) / 0.001, 2);
  assert.ok(f(0.001, 0.001) > 0.5);
  // The three second partials at zero are -2, -6, 0, but the point is a saddle.
  const h = (x: number, y: number) => -x * x - 3 * y * y + (10 * x * x * y * y) / (x * x + y * y);
  assert.ok(h(0.01, 0.01) > 0);
  assert.ok(h(0.01, 0) < 0);
});

test('Jacobian composition and squared-loss derivatives agree with direct expansion', () => {
  const lesson = calculus('multivariable-chain-rule');
  const points = [
    [1, 2],
    [-1, 3],
    [2, -1],
    [0, 2],
    [3, 1],
  ];
  points.forEach(([s, t], i) => {
    assert.deepEqual(expected(question(lesson, 32 + 2 * i)), [2 * (s + t), 2 * (s + t)]);
    assert.deepEqual(expected(question(lesson, 33 + 2 * i)), [2 * s, -2 * t]);
    // Expand (2w+b-5)^2/2 before differentiating, independently of a chain-rule evaluator.
    equal(expected(question(lesson, 42 + 2 * i))[0], 4 * s + 2 * t - 10);
    equal(expected(question(lesson, 43 + 2 * i))[0], 2 * s + t - 5);
  });
});

test('standalone calculus questions retain their own model and data', () => {
  const cases: [string, number, RegExp][] = [
    ['limits-continuity', 3, /f\(2\)=19/],
    ['definite-integrals', 43, /3.*2.*-2.*4/],
    ['applications-integration', 28, /0\\le y\\le x/],
    ['applications-integration', 42, /10.*4\+t.*6/],
    ['power-series-taylor', 32, /e\^\{0\.1\}/],
    ['power-series-taylor', 48, /1-x\^2\+x\^4\/2/],
    ['double-integrals', 27, /2x\+y<=4/],
    ['double-integrals', 34, /squared<=y<=4/],
    ['constrained-optimization', 23, /x squared\+2y squared.*x\+y=9/],
    ['constrained-optimization', 43, /g=x squared\+y squared=0/],
    ['gradient-descent', 12, /alpha=1\/8/],
    ['gradient-descent', 14, /alpha=3\/8/],
  ];
  for (const [slug, id, model] of cases) assert.match(question(calculus(slug), id).prompt, model);
  for (const id of [32, 33, 34, 35, 36, 37])
    assert.match(question(calculus('gradient-descent'), id).prompt, /L=\(x\^2-1\)\^2\+y\^2/);
  for (const id of [42, 43, 44, 45, 46, 48])
    assert.match(question(calculus('gradient-descent'), id).prompt, /b=\(1,2,2\)/);
  for (const slug of ['power-series-taylor', 'constrained-optimization', 'gradient-descent'])
    for (const q of variants(calculus(slug)))
      assert.doesNotMatch(
        q.prompt,
        /For that candidate|Find its minimum|that approximation|that scalar model|For that model|with that multiplier|Starting that loss/,
      );
});

test('standard sampling names are accepted with the word sampling', () => {
  for (const [id, name] of [
    [33, 'cluster'],
    [34, 'systematic'],
    [35, 'convenience'],
  ] as const) {
    const q = question(probability('data-samples-study-design'), id);
    assert.equal(gradeAssessment(q.assessment, { answer: `${name} sampling` }).verdict, 'correct');
    assert.equal(
      gradeAssessment(q.assessment, { answer: 'stratified sampling' }).verdict,
      'incorrect',
    );
  }
});

test('transformation CDF grading uses its stated upper support endpoint', () => {
  const q = question(probability('normal-distributions-transformations'), 31);
  assert.equal(
    gradeAssessment(q.assessment, { answer: 'sqrt(y)*(4-y)/(2*(4-y))' }).verdict,
    'correct',
  );
  assert.throws(
    () => gradeAssessment(q.assessment, { answer: 'sqrt(y)*(y-2)/(2*(y-2))' }),
    InputError,
  );
  assert.equal(gradeAssessment(q.assessment, { answer: 'sqrt(y)' }).verdict, 'incorrect');
});

test('published probability TeX and glossary preserve notation and hypotheses', () => {
  for (const [id, command] of [
    ['continuous-expectation', String.raw`\ne`],
    ['normal-cdf', String.raw`\Phi`],
    ['variance-linear-combination', String.raw`\operatorname`],
    ['covariance-matrix', String.raw`\mathbf`],
  ])
    assert.ok(
      references.find((r: any) => r.id === probability(id)).confusion.includes(command),
      id,
    );
  const feedback = (slug: string, id: number) => JSON.stringify(question(probability(slug), id));
  assert.ok(feedback('normal-distributions-transformations', 10002).includes('U\\\\le0'));
  assert.ok(feedback('joint-conditional-distributions', 10001).includes('x\\\\mid Y=y'));
  assert.match(
    references.find((r: any) => r.id === probability('concentration-guarantee')).definition,
    /common mean/,
  );
  assert.match(
    references.find((r: any) => r.id === probability('shared-noise')).definition,
    /common noise variance/,
  );
});
