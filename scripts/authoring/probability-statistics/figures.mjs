const curve = (id, label, f, a, b) => ({
  id,
  label,
  points: Array.from({ length: 121 }, (_, i) => {
    const x = a + ((b - a) * i) / 120;
    return [x, f(x)];
  }),
  dashed: false,
});
const line = (id, label, points) => ({ id, label, points, dashed: false });
const ticks = (values) => values.map((value) => ({ value, label: String(value) }));
const normal = (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
export function probabilityFigures(lessons) {
  const figures = [];
  function attach(number, index, suffix, title, data, text, creation, limitations) {
    const l = lessons.find((l) => l.number === number),
      s = l.sections[index];
    const f = {
      id: `probability-statistics-figure-${number}${suffix}`,
      title,
      lesson: l.slug,
      section: s.title,
      requires: s.terms.map((t) => t.id),
      mathLabels: {},
      frames: [{ text, route: [], highlight: [] }],
      creation,
      limitations,
      ...data,
    };
    figures.push(f);
    s.body += `\n\n![${title}](figure:${f.id})`;
    return f;
  }
  const venn = {
    kind: 'venn',
    universe: ['1', '2', '3', '4', '5', '6'],
    a: ['2', '4', '6'],
    b: ['4', '5', '6'],
    mathLabels: Object.fromEntries(
      ['1', '2', '3', '4', '5', '6', 'U', 'A', 'B'].map((s) => [s, s]),
    ),
  };
  const v1 = attach(
    1,
    3,
    '',
    'Events overlap without double-counting',
    venn,
    'For a fair die, A is the even faces and B is the faces at least four. The union contains 2, 4, 5, and 6, so its probability is 4/6. The two common faces are counted once.',
    'Original Venn membership construction for the stated six equally likely outcomes.',
    'Circle areas do not encode probabilities. Count the labeled equally likely outcomes.',
  );
  v1.frames[0].operation = 'union';
  const v3 = attach(
    3,
    0,
    '',
    'Conditioning changes the reference set',
    venn,
    'For a fair die, B contains 4, 5, and 6. Within that conditional sample space, the even faces are 4 and 6, so P(A given B)=2/3. The intersection has unconditional probability 2/6.',
    'Original membership construction: restrict six equally likely outcomes to the three members of B.',
    'The conditional probability uses the mass of B as its denominator. Circle areas do not represent that mass.',
  );
  v3.frames[0].operation = 'intersection';
  function cart(n, i, suffix, title, bounds, curves, text, extras = {}) {
    return attach(
      n,
      i,
      suffix,
      title,
      { kind: 'cartesian', bounds, curves, regions: [], markers: [], arrows: [], ...extras },
      text,
      'Coordinates are original values computed from the equations or finite observations stated in the caption. Curves use 121 equally spaced inputs; discrete segments and rectangles are authored separately.',
      'Sampled curves approximate the shape between points. Axis units and scales are stated separately. The caption supplies the mathematical interpretation; the picture alone does not establish a probability or guarantee.',
    );
  }
  const masses = [
    [0, 0.25],
    [1, 0.5],
    [2, 0.25],
  ];
  cart(
    5,
    1,
    '-pmf',
    'Heights are probability masses',
    { x: [-0.5, 2.5], y: [0, 0.6] },
    [],
    'A random variable taking 0, 1, and 2 with probabilities 1/4, 1/2, and 1/4 has these PMF heights. The three heights sum to one. Bar width is only a drawing choice.',
    {
      axisLabels: { x: 'value', y: 'mass' },
      ticks: { x: ticks([0, 1, 2]), y: ticks([0, 0.25, 0.5]) },
      regions: masses.map(([x, p]) => ({
        points: [
          [x - 0.2, 0],
          [x + 0.2, 0],
          [x + 0.2, p],
          [x - 0.2, p],
        ],
      })),
    },
  );
  cart(
    5,
    2,
    '-cdf',
    'A CDF accumulates the point masses',
    { x: [-0.5, 2.5], y: [0, 1.1] },
    [
      line('left', 'x < 0', [
        [-0.5, 0],
        [0, 0],
      ]),
      line('first', '0 ≤ x < 1', [
        [0, 0.25],
        [1, 0.25],
      ]),
      line('second', '1 ≤ x < 2', [
        [1, 0.75],
        [2, 0.75],
      ]),
      line('last', 'x ≥ 2', [
        [2, 1],
        [2.5, 1],
      ]),
    ],
    'For masses 1/4, 1/2, and 1/4 at 0, 1, and 2, the CDF jumps to 1/4, 3/4, and 1. Filled endpoints specify the value at each jump, and open endpoints exclude the earlier plateau.',
    {
      axisLabels: { x: 'value', y: 'CDF' },
      ticks: { x: ticks([0, 1, 2]), y: ticks([0, 0.25, 0.75, 1]) },
      markers: [
        { at: [0, 0], open: true },
        { at: [0, 0.25], open: false },
        { at: [1, 0.25], open: true },
        { at: [1, 0.75], open: false },
        { at: [2, 0.75], open: true },
        { at: [2, 1], open: false },
      ],
    },
  );
  cart(
    9,
    1,
    '',
    'Density area becomes cumulative probability',
    { x: [0, 1], y: [0, 2.2] },
    [curve('density', 'density 2x', (x) => 2 * x, 0, 1)],
    'The density 2x on [0,1] integrates to one. The shaded triangle from 0 to 1/2 has area 1/4, so P(X≤1/2)=1/4. The density height at 1/2 is 1, which is a different quantity.',
    {
      axisLabels: { x: 'x', y: 'density' },
      ticks: { x: ticks([0, 0.25, 0.5, 0.75, 1]), y: ticks([0, 1, 2]) },
      regions: [
        {
          points: [
            [0, 0],
            [0.5, 0],
            [0.5, 1],
          ],
        },
      ],
    },
  );
  const shaded = curve('shade', '', normal, -1, 1).points;
  cart(
    10,
    1,
    '',
    'Central area under the standard normal density',
    { x: [-3.5, 3.5], y: [0, 0.45] },
    [curve('normal', 'standard normal', normal, -3.5, 3.5)],
    'The shaded area between −1 and 1 is Φ(1)−Φ(−1), approximately 0.6827. These are standardized coordinates; the area is a probability and the curve height is a density.',
    {
      axisLabels: { x: 'z', y: 'density' },
      ticks: { x: ticks([-3, -2, -1, 0, 1, 2, 3]), y: ticks([0, 0.2, 0.4]) },
      regions: [{ points: [[-1, 0], ...shaded, [1, 0]] }],
    },
  );
  cart(
    12,
    2,
    '',
    'Linear association differs from units',
    { x: [-2.5, 2.5], y: [-5, 5] },
    [
      line('line', 'Y = 2X', [
        [-2, -4],
        [2, 4],
      ]),
    ],
    'Give each of the five plotted pairs equal probability. With X at −2, −1, 0, 1, 2 and Y=2X, the covariance is 4 and correlation is 1. Rescaling Y changes covariance and units while preserving positive perfect correlation.',
    {
      axisLabels: { x: 'X', y: 'Y' },
      ticks: { x: ticks([-2, -1, 0, 1, 2]), y: ticks([-4, -2, 0, 2, 4]) },
      markers: [-2, -1, 0, 1, 2].map((x) => ({ at: [x, 2 * x], open: false })),
    },
  );
  cart(
    15,
    3,
    '',
    'Averages of normal observations have smaller spread',
    { x: [-3, 3], y: [0, 0.9] },
    [
      curve('one', 'one observation', normal, -3, 3),
      curve('four', 'mean of four', (x) => 2 * normal(2 * x), -3, 3),
    ],
    'For independent N(0,1) observations, one observation has standard deviation 1 and the average of four has standard deviation 1/2. Both densities have total area one. These normal sampling distributions are exact for this stated population.',
    {
      axisLabels: { x: 'value', y: 'density' },
      ticks: { x: ticks([-3, -2, -1, 0, 1, 2, 3]), y: ticks([0, 0.4, 0.8]) },
    },
  );
  cart(
    17,
    4,
    '',
    'Likelihood is a function of a candidate parameter',
    { x: [0, 1], y: [0, 0.04] },
    [curve('likelihood', 'p³(1−p)²', (p) => p ** 3 * (1 - p) ** 2, 0, 1)],
    'For an ordered sequence with three successes and two failures, likelihood is p³(1−p)². It reaches its maximum at p=3/5. This curve is not a normalized posterior density for p.',
    {
      axisLabels: { x: 'p', y: 'likelihood' },
      ticks: { x: ticks([0, 0.2, 0.4, 0.6, 0.8, 1]), y: ticks([0, 0.02, 0.04]) },
      markers: [{ at: [0.6, 0.6 ** 3 * 0.4 ** 2], label: 'maximum', open: false }],
    },
  );
  cart(
    18,
    0,
    '',
    'Coverage compares intervals with one fixed target',
    { x: [7.5, 12.5], y: [0, 5] },
    [
      line('i1', 'interval 1', [
        [9, 1],
        [11, 1],
      ]),
      line('i2', 'interval 2', [
        [10.5, 2],
        [12, 2],
      ]),
      line('i3', 'interval 3', [
        [8, 3],
        [10, 3],
      ]),
      line('i4', 'interval 4', [
        [9.5, 4],
        [10.5, 4],
      ]),
    ],
    'The fixed target is 10. Intervals 1, 3, and 4 contain it; interval 2 does not. Three of these four illustrative intervals cover the target. Four selected examples do not establish a procedure’s long-run coverage.',
    {
      axisLabels: { x: 'parameter value', y: 'repetition' },
      ticks: { x: ticks([8, 9, 10, 11, 12]), y: ticks([1, 2, 3, 4]) },
      arrows: [{ from: [10, 0.2], to: [10, 4.4], label: 'target 10', dashed: true }],
      markers: [
        [9, 1],
        [11, 1],
        [10.5, 2],
        [12, 2],
        [8, 3],
        [10, 3],
        [9.5, 4],
        [10.5, 4],
      ].map((at) => ({ at, open: false })),
    },
  );
  cart(
    20,
    2,
    '',
    'Updating a beta prior with observed trials',
    { x: [0, 1], y: [0, 2.7] },
    [
      curve('prior', 'prior Beta(2,3)', (p) => 12 * p * (1 - p) ** 2, 0, 1),
      curve('posterior', 'posterior Beta(5,4)', (p) => 280 * p ** 4 * (1 - p) ** 3, 0, 1),
    ],
    'Three successes in four conditionally independent trials update Beta(2,3) to Beta(5,4). Both curves integrate to one. The posterior mean is 5/9; the density peak and the mean need not coincide.',
    {
      axisLabels: { x: 'p', y: 'density' },
      ticks: { x: ticks([0, 0.25, 0.5, 0.75, 1]), y: ticks([0, 1, 2]) },
    },
  );
  cart(
    21,
    1,
    '',
    'Residuals connect a fitted line with observations',
    { x: [-0.25, 2.25], y: [0, 5.5] },
    [curve('fit', 'fitted y = 2/3 + 2x', (x) => 2 / 3 + 2 * x, 0, 2)],
    'For observations (0,1), (1,2), and (2,5), the least-squares line is y=2/3+2x. The residuals are 1/3, −2/3, and 1/3; they sum to zero. A fitted line describes this model and sample, not a causal mechanism.',
    {
      axisLabels: { x: 'x', y: 'response' },
      ticks: { x: ticks([0, 1, 2]), y: ticks([0, 1, 2, 3, 4, 5]) },
      markers: [
        [0, 1],
        [1, 2],
        [2, 5],
      ].map((at) => ({ at, open: false })),
      arrows: [
        [0, 1],
        [1, 2],
        [2, 5],
      ].map(([x, y]) => ({ from: [x, 2 / 3 + 2 * x], to: [x, y], label: '', dashed: false })),
    },
  );
  // Empty labels are unnecessary for the short residual segments; use distinct nonempty authored labels.
  figures.at(-1).arrows.forEach((a, i) => (a.label = ['r₁', 'r₂', 'r₃'][i]));
  cart(
    22,
    0,
    '',
    'The bootstrap mean has an empirical distribution',
    { x: [1, 7], y: [0, 0.6] },
    [],
    'From the observed sample (2,6), draw two times with replacement. The four ordered bootstrap samples give means 2, 4, 4, and 6, so the bootstrap masses are 1/4, 1/2, and 1/4. This resamples the empirical distribution, not new observations from an unknown population.',
    {
      axisLabels: { x: 'bootstrap mean', y: 'mass' },
      ticks: { x: ticks([2, 4, 6]), y: ticks([0, 0.25, 0.5]) },
      regions: [
        [2, 0.25],
        [4, 0.5],
        [6, 0.25],
      ].map(([x, p]) => ({
        points: [
          [x - 0.3, 0],
          [x + 0.3, 0],
          [x + 0.3, p],
          [x - 0.3, p],
        ],
      })),
    },
  );
  return figures;
}
