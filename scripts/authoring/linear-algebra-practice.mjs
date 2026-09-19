// Original authored practice families. Run from the repository root.
// Exercise IDs retain their original numbering across lesson splits. Numerical data are explicit,
// deterministic, and checked separately by verify-linear-algebra.py using SymPy.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
const read = (p) => fs.readFileSync(p, 'utf8');
const core = JSON.parse(read('scripts/authoring/linear-algebra-core.json'));
const curriculum = YAML.parse(read('content/curriculum.yaml'));
// Families retain their original order and IDs even when their teaching is split.
const data = core
  .map((original) => curriculum.lessons.find((l) => l.slug === original.slug))
  .map((l) => ({
    ...l,
    file: l.worksheet
      .split('/')
      .at(-1)
      .replace(/\.yaml$/, ''),
  }));
const copies = YAML.parse(read('content/exercise-copy.yaml'));
const pacing = ['bases', 'projections'].map((name) =>
  JSON.parse(read(`scripts/authoring/linear-algebra-${name}-pacing.json`)),
);
const placements = JSON.parse(read('content/linear-algebra-placements.json'));
const fixtures = [],
  coverage = [];
let lesson, sections, questions, next, family, section;
const v = (x) => '(' + x.join(', ') + ')';
const rows = (a) => a.map(v).join(', ');
const add = (a, b) => a.map((x, i) => x + b[i]);
const scale = (c, a) => a.map((x) => c * x);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const tr = (a) => a[0].map((_, j) => a.map((r) => r[j]));
const mv = (a, x) => a.map((r) => dot(r, x));
const mm = (a, b) => a.map((r) => tr(b).map((c) => dot(r, c)));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (a, b) => {
  if (b < 0) {
    a = -a;
    b = -b;
  }
  const g = gcd(a, b);
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
};
function q(prompt, answer, fixture) {
  prompt = prompt.replace(/\+\s*-/g, '- ');
  answer = answer.replace(/\+\s*-/g, '- ');
  const id = next++;
  questions[section].push({ id, type: 'freeform', prompt, answerLines: 5, answer });
  copies[lesson.slug][id] = { instructions: '', prompt, answer };
  coverage.push({
    lesson: lesson.slug,
    id,
    section: sections[section],
    objective: family,
    mode: fixture ? 'calculation-and-interpretation' : 'reasoning',
    verification: fixture ? 'exact-independent-calculation' : 'authored-argument',
  });
  if (fixture) fixtures.push({ lesson: lesson.slug, id, prompt, answer, ...fixture });
}
function begin(i, s, name) {
  lesson = data[i];
  section = s;
  family = name;
}
function task(i, s, name, items) {
  begin(i, s, name);
  for (const [p, a] of items) q(p, a);
}
const pairs = [
  [
    [2, -1],
    [3, 4],
  ],
  [
    [0, 3],
    [-2, 1],
  ],
  [
    [-3, 2],
    [1, -4],
  ],
  [
    [1, 0, 2],
    [0, -3, 1],
  ],
  [
    [2, -1, 0],
    [-1, 2, 3],
  ],
  [
    [1, 2, -2, 0],
    [3, 0, 1, -1],
  ],
];
const mats = [
  [
    [1, 2],
    [0, 1],
  ],
  [
    [2, -1],
    [1, 3],
  ],
  [
    [0, 1, 2],
    [2, -1, 0],
  ],
  [
    [1, 0],
    [0, 2],
    [1, -1],
  ],
  [
    [2, 0, -1],
    [0, 1, 3],
  ],
  [
    [1, 2, 0],
    [-1, 0, 1],
    [0, 1, 1],
  ],
];
for (let li = 0; li < data.length; li++) {
  lesson = data[li];
  const path = 'content/worksheets/' + lesson.file + '.yaml';
  const original = structuredClone(core.find((l) => l.slug === lesson.slug));
  delete original.slug;
  sections = original.sections.map((s) => s.title);
  questions = original.sections.map((s) => s.questions.filter((q) => q.id <= 8));
  next = 9;
  for (const [i, list] of questions.entries())
    for (const question of list)
      coverage.push({
        lesson: lesson.slug,
        id: question.id,
        section: sections[i],
        objective: sections[i] + ' — original practice',
        mode: 'mixed',
        verification: 'authored-argument-and-worked-calculation',
      });
  copies[lesson.slug] = Object.fromEntries(
    questions.flat().map((q) => [q.id, { instructions: '', prompt: q.prompt, answer: q.answer }]),
  );
  if (li === 0) {
    begin(li, 0, 'displacement and translation');
    for (const [a, b] of pairs) {
      const d = add(b, scale(-1, a));
      q(
        `An arrow runs from ${v(a)} to ${v(b)}. Find its displacement. Then translate both endpoints by ${v(a.map(() => 2))} and check that the displacement is unchanged.`,
        `Subtract start from finish to obtain ${v(d)}. Adding two to each corresponding endpoint cancels in the subtraction, so the translated arrow has the same displacement.`,
        { kind: 'difference', a, b, expected: d },
      );
    }
    begin(li, 0, 'coordinate interpretation');
    for (const [names, values] of [
      [
        ['east displacement', 'north displacement'],
        [-2, 3],
      ],
      [
        ['height', 'width', 'depth'],
        [2, 4, 1],
      ],
      [
        ['Monday sales', 'Tuesday sales', 'Wednesday sales'],
        [0, 3, 2],
      ],
      [
        ['temperature change', 'pressure change'],
        [-3, 0],
      ],
      [
        ['red intensity', 'green intensity', 'blue intensity'],
        [1, 0, 1],
      ],
      [
        ['hours reading', 'hours practicing'],
        [2, 5],
      ],
    ])
      q(
        `A record uses coordinate order ${names.join(', ')} and has value ${v(values)}. State its dimension, interpret each component, and explain what changes if the first two entries are exchanged.`,
        `It has ${values.length} components. ${names.map((n, i) => `${n}: ${values[i]}`).join('; ')}. Exchanging just the first two values assigns them to different measurements; coordinate order is part of the record's meaning.`,
      );
    begin(li, 1, 'component arithmetic and checking');
    for (const [u, w] of pairs) {
      const ans = add(scale(3, u), scale(-2, w));
      q(
        `For u=${v(u)} and v=${v(w)}, calculate 3u-2v. Check by adding 2v to your result.`,
        `Three u is ${v(scale(3, u))}; negative two v is ${v(scale(-2, w))}. Their sum is ${v(ans)}. Adding ${v(scale(2, w))} recovers ${v(scale(3, u))}, as required.`,
        { kind: 'combination', vectors: [u, w], coefficients: [3, -2], expected: ans },
      );
    }
    begin(li, 1, 'recovering an unknown vector');
    for (const [u, b] of pairs) {
      const ans = add(b, scale(-2, u));
      q(
        `Solve 2u+w=b for the unknown vector w, where u=${v(u)} and b=${v(b)}. Explain why the equation determines every component of w.`,
        `Subtract 2u component by component: w=${v(ans)}. Each component has coefficient one, so there is exactly one value for it. Adding 2u back gives b.`,
        { kind: 'combination', vectors: [b, u], coefficients: [1, -2], expected: ans },
      );
    }
    begin(li, 1, 'displacement versus route length');
    for (const [a, b] of [
      [1, 2],
      [2, 3],
      [3, 1],
      [4, 2],
      [2, 5],
      [3, 4],
    ])
      q(
        `A path moves ${v([a, 0])}, then ${v([0, b])}, then ${v([-a, 0])}. Find its total displacement and its distance traveled. Explain the difference.`,
        `The displacement is ${v([0, b])}; the horizontal movements cancel. Distance traveled is ${a}+${b}+${a}=${2 * a + b} units. The length of the final displacement is only ${b}; cancellation of displacement does not cancel distance traveled.`,
      );
    begin(li, 2, 'solving for combination coefficients');
    for (const [a, b] of [
      [2, 1],
      [-1, 3],
      [0, 4],
      [3, -2],
      [1, 0],
      [-2, -1],
    ]) {
      const target = [a + 2 * b, a - b];
      q(
        `Express ${v(target)} as a linear combination of p=(1,1) and q=(2,-1). Derive the coefficients by matching components, then rebuild the target.`,
        `Writing coefficients c,d gives c+2d=${target[0]} and c-d=${target[1]}. Subtracting the second equation from the first gives 3d=${3 * b}, so d=${b} and c=${a}. Thus the coefficients are ${v([a, b])}; rebuilding gives ${v(target)}.`,
        {
          kind: 'combination',
          vectors: [
            [1, 1],
            [2, -1],
          ],
          coefficients: [a, b],
          expected: target,
        },
      );
    }
    begin(li, 2, 'reachable and unreachable targets');
    for (const [u, k] of [
      [[1, 2], 3],
      [[2, -1], -2],
      [[0, 1], 4],
      [[1, 1, 2], 2],
      [[2, 0, -1], -1],
      [[1, -2, 3], 0],
    ]) {
      const yes = scale(k, u),
        no = add(
          yes,
          u.map((_, i) => (i === 0 ? 1 : 0)),
        );
      q(
        `Using only scalar multiples of u=${v(u)}, determine which targets ${v(yes)} and ${v(no)} can be reached. Justify the impossible case with components.`,
        `${v(yes)} equals ${k}u and is reachable. ${v(no)} is not: a nonzero component after the first forces the scalar to be ${k}, but that scalar gives first component ${yes[0]}, not ${no[0]}.`,
        { kind: 'span-pair', u, yes, no },
      );
    }
    begin(li, 3, 'resource totals with assumptions');
    for (const [a, b] of [
      [1, 2],
      [3, 1],
      [2, 4],
      [0, 5],
      [4, 3],
      [5, 0],
    ]) {
      const ans = [2 * a + b, a + 3 * b];
      q(
        `Products P and Q consume water and power in vectors (2,1) and (1,3) per item. Find total resources for ${a} of P and ${b} of Q, then include a once-only startup cost (2,4). Is the complete rule proportional to production?`,
        `Without startup the total is ${v(ans)}. Including startup gives ${v(add(ans, [2, 4]))}. The fixed cost breaks proportionality: zero production would still have the startup cost if the machine is started. Resource units and product counts must use the stated coordinate order.`,
        {
          kind: 'combination',
          vectors: [
            [2, 1],
            [1, 3],
          ],
          coefficients: [a, b],
          expected: ans,
        },
      );
    }
    begin(li, 3, 'averages and weighted combinations');
    for (const [a, b] of pairs) {
      const avg = add(a, b).map((x) => frac(x, 2));
      q(
        `Two observations with matching coordinate meanings are ${v(a)} and ${v(b)}. Find their componentwise average. Explain why the average need not be an actually observed record.`,
        `Add first, then multiply every component by one half: ${v(avg)}. The calculation summarizes the two records; it does not assert that an object with these values was observed or is physically feasible.`,
        { kind: 'combination', vectors: [a, b], coefficients: ['1/2', '1/2'], expected: avg },
      );
    }
    task(li, 1, 'vector-law reasoning', [
      [
        'Prove for arbitrary real coordinate vectors u,v that u+v=v+u. Do not use a single numerical example.',
        'In every coordinate, the entries are ui+vi and vi+ui. Real addition commutes, so corresponding entries agree in every position and the vectors are equal.',
      ],
      [
        'A student writes -2(1,-3,2)=(-2,-3,2). Identify and repair the error.',
        'The scalar must multiply every component, giving (-2,6,-4). Scaling only the first entry is not vector scalar multiplication.',
      ],
      [
        'If cu=0 for a real scalar c and a nonzero vector u, prove c=0.',
        'Some component of u is nonzero. In that coordinate, c times a nonzero real number equals zero, forcing c=0.',
      ],
      [
        'Can a two-component displacement be added directly to a three-component displacement? Explain what additional modeling choice would be needed.',
        'Not as currently specified: addition requires the same coordinate space. One could explicitly embed the plane in a chosen three-dimensional plane, such as by appending a zero third component, but that is an extra interpretation.',
      ],
    ]);
    task(li, 2, 'combination reasoning', [
      [
        'Show that every combination of u and 2u is a multiple of u. Does the converse hold?',
        'With coefficients a,b the combination is (a+2b)u. Conversely every cu is obtained by choosing a=c,b=0. Thus the two ways of describing the reachable set agree.',
      ],
      [
        'If p+q=r, give two different coefficient lists using p,q,r that both produce r, without assuming any coordinates.',
        'The lists (1,1,0) and (0,0,1) both produce r. They are different coefficient lists even if some supplied vectors happen to agree.',
      ],
      [
        'Prove that the zero vector is a linear combination of any nonempty supplied collection.',
        'Choose zero for every coefficient. Each scaled vector is zero, and their sum is zero.',
      ],
      [
        'For real a,b, express (a,b) using (1,1) and (1,-1), and explain why the result works for every target.',
        'Use coefficients (a+b)/2 and (a-b)/2. Their sum is a and their difference is b, so the two coordinates match for arbitrary real a,b.',
      ],
    ]);
    task(li, 3, 'model criticism', [
      [
        'A model doubles its output when production doubles in one experiment. Has proportionality for all production amounts been proved? Explain.',
        'No. One successful test is evidence for one input pair, not a universal property. Setup thresholds or changing waste rates could still make other amounts fail.',
      ],
      [
        'A mixture recipe uses coefficients one half and one half. Why can fractional coefficients be meaningful here even if they were disallowed for numbers of finished products?',
        'The coefficients can denote fractions of an amount of mixture. Feasibility comes from the application; it is not a universal restriction to integer coefficients.',
      ],
      [
        'Explain why adding a vector of temperatures to a vector of prices is not made meaningful merely by their having the same length.',
        'Matching component counts makes the formal operation defined, but the coordinates have incompatible quantities and units. The application has not specified a meaningful combined measurement.',
      ],
      [
        'A traveler ends where they started after a long walk. What can you conclude about displacement and distance?',
        'Displacement is zero because the endpoints agree. Distance can be positive; it records the total lengths of the traveled pieces.',
      ],
    ]);
  }
  if (li === 1) {
    begin(li, 0, 'dot products across dimensions');
    for (const [a, b] of pairs)
      q(
        `Compute the dot product of ${v(a)} and ${v(b)}. Show each component product and state the type of the result.`,
        `The component products are ${a.map((x, i) => x * b[i]).join(', ')}. Adding gives ${dot(a, b)}, a real scalar.`,
        { kind: 'dot', a, b, expected: dot(a, b) },
      );
    begin(li, 0, 'distribution with cross terms');
    for (const [a, b] of pairs) {
      const w = add(a, b);
      q(
        `For u=${v(a)} and v=${v(b)}, compute u dot (u+v) directly and by distribution.`,
        `The sum is ${v(w)}, giving dot product ${dot(a, w)}. Distribution gives u dot u plus u dot v = ${dot(a, a)} + (${dot(a, b)}) = ${dot(a, w)}.`,
        { kind: 'dot', a, b: w, expected: dot(a, w) },
      );
    }
    begin(li, 1, 'exact norms and normalization');
    for (const aof of [
      [3, 4],
      [-5, 12],
      [0, -7],
      [1, 2, 2],
      [-2, 1, 2],
      [1, -1, 1, -1],
    ]) {
      const n = Math.sqrt(dot(aof, aof)),
        unit = aof.map((x) => frac(x, n));
      q(
        `Find the Euclidean norm of ${v(aof)} and the unit vector in its direction. Verify unit length.`,
        `The squared length is ${dot(aof, aof)}, so the norm is ${n}. Dividing every component gives ${v(unit)}; its squared components sum to one.`,
        { kind: 'normalize', a: aof, expected: unit, norm: n },
      );
    }
    begin(li, 1, 'distances and invariance');
    for (const [a, b] of pairs) {
      const d = add(b, scale(-1, a));
      q(
        `Find the exact distance between ${v(a)} and ${v(b)}. Explain why reversing the subtraction does not change it.`,
        `The difference is ${v(d)} with squared length ${dot(d, d)}, so the distance is square root of ${dot(d, d)}. Reversing subtraction negates every component but leaves all squares unchanged.`,
        { kind: 'squared-distance', a, b, expected: dot(d, d) },
      );
    }
    begin(li, 1, 'recovering a component from length');
    for (const [a, b] of [
      [3, 4],
      [5, 12],
      [8, 15],
      [7, 24],
      [0, 6],
      [4, 3],
    ])
      q(
        `A vector (${a},t) has norm ${Math.hypot(a, b)}. Find every possible real t, and explain why a length does not normally determine its sign.`,
        `Squaring gives ${a * a}+t squared=${a * a + b * b}, hence t squared=${b * b}. Thus t=${b} or t=${-b}. Both signs give the same square and therefore the same length.`,
      );
    begin(li, 2, 'constructing orthogonal directions');
    for (const [a, b] of [
      [1, 2],
      [2, -3],
      [-3, -1],
      [0, 4],
      [5, 0],
      [3, 4],
    ]) {
      const u = [a, b],
        w = [-b, a];
      q(
        `Find a nonzero vector perpendicular to ${v(u)} and explain why your construction works without estimating an angle.`,
        `One choice is ${v(w)}. The dot product is ${a} times ${-b} plus ${b} times ${a}, or zero. The vector is nonzero because the given vector is nonzero.`,
        { kind: 'dot', a: u, b: w, expected: 0 },
      );
    }
    begin(li, 2, 'angle cases including endpoints');
    for (const [a, b] of [
      [
        [1, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [-1, 0],
      ],
      [
        [1, 0],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
      ],
      [
        [1, 0],
        [-1, 1],
      ],
      [
        [0, 2],
        [2, 0],
      ],
    ]) {
      const cos = dot(a, b) / Math.hypot(...a) / Math.hypot(...b),
        angle = Math.round((Math.acos(cos) * 180) / Math.PI);
      q(
        `Find the angle between ${v(a)} and ${v(b)}, including whether it is a parallel endpoint case.`,
        `Divide dot product ${dot(a, b)} by the positive product of norms. The resulting cosine gives ${angle} degrees. ${angle === 0 ? 'The vectors point in the same direction.' : angle === 180 ? 'They point in opposite directions.' : angle === 90 ? 'They are perpendicular.' : angle < 90 ? 'This is strictly acute.' : 'This is strictly obtuse.'}`,
        { kind: 'angle', a, b, expected: angle },
      );
    }
    begin(li, 3, 'weighted totals');
    for (const [a, b] of [
      [
        [2, 3],
        [4, 1],
      ],
      [
        [1, 5, 2],
        [3, 0, 4],
      ],
      [
        [3, 2, 4],
        [2, 5, 1],
      ],
      [
        [4, 1],
        [0, 7],
      ],
      [
        [2, 2, 3],
        [3, 1, 2],
      ],
      [
        [1, 2, 3, 4],
        [4, 3, 2, 1],
      ],
    ])
      q(
        `Unit prices are ${v(a)} and quantities are ${v(b)} in matching product order. Find the total cost and explain why ordinary componentwise multiplication alone is not yet the total.`,
        `The item costs are ${v(a.map((x, i) => x * b[i]))}; sum them to get ${dot(a, b)}. The dot product includes this final addition, producing one total rather than a list.`,
        { kind: 'dot', a, b, expected: dot(a, b) },
      );
    begin(li, 3, 'cosine scale invariance');
    for (const [a, c] of [
      [[1, 2], 2],
      [[2, -1], 3],
      [[1, 0], -4],
      [[0, 3], -2],
      [[1, 2, 2], 5],
      [[-2, 1, 2], -1],
    ])
      q(
        `Let u=${v(a)} and v=${c}u. Find their cosine similarity and explain the roles of the sign and magnitude of the scale factor.`,
        `The dot product is ${c * dot(a, a)} and the norm product is ${Math.abs(c) * dot(a, a)}. Their ratio is ${Math.sign(c)}. A positive factor preserves direction, a negative factor reverses it, and its nonzero magnitude cancels from the ratio.`,
        { kind: 'cosine', a, b: scale(c, a), expected: Math.sign(c) },
      );
    task(li, 2, 'geometric reasoning', [
      [
        'Prove that nonzero orthogonal vectors cannot be nonzero scalar multiples of one another.',
        'If v=cu with c nonzero and u nonzero, then u dot v=c times the positive quantity u dot u, which cannot be zero.',
      ],
      [
        'Is the zero vector orthogonal to itself? Is the angle between zero and itself defined? Distinguish the answers.',
        'Its dot product with itself is zero, so it is orthogonal algebraically. The angle is undefined because the angle formula would divide by zero lengths.',
      ],
      [
        'If u and v have the same norm, prove that u+v and u-v are orthogonal.',
        'Their dot product expands to u dot u minus v dot v; the mixed terms cancel. Equal squared norms make the result zero.',
      ],
      [
        'If nonzero u and v satisfy u dot v=0, prove the Pythagorean identity for their sum.',
        'Expand (u+v) dot (u+v). The two cross terms vanish, leaving the sum of u dot u and v dot v, which are the squared lengths.',
      ],
      [
        'A student says a positive dot product always means a strictly acute angle. Give a counterexample.',
        'For u=v=(1,0), the dot product is one but the angle is zero, not strictly acute.',
      ],
      [
        'Can two unequal vectors have cosine similarity one? Give an example and explain.',
        'Yes: (1,0) and (2,0) have the same direction and cosine one but different lengths.',
      ],
    ]);
    task(li, 3, 'interpretation and counterexamples', [
      [
        'Can cosine similarity be used for a zero record without an additional convention? Explain.',
        'No. Its denominator contains the zero record’s norm, so the formula is undefined. Software may choose a convention but must identify it as such.',
      ],
      [
        'Explain why changing only one coordinate’s units can change cosine similarity, even though multiplying every coordinate of one vector by a positive constant cannot.',
        'Changing one coordinate changes the vector’s direction in general. Uniform positive scaling preserves its direction, and the scaling cancels between numerator and denominator.',
      ],
      [
        'Give two different vectors with equal Euclidean norm and explain why equal norm does not imply equal direction.',
        'For example (1,0) and (0,1) both have length one but are perpendicular. Length describes size, not the complete vector.',
      ],
      [
        'Prove that the dot product of a real vector with itself cannot be negative.',
        'It is a sum of squares of real components. Each term is nonnegative, so the sum is nonnegative.',
      ],
      [
        'A vector has components (1,1,1). Is it a unit vector? Give the exact reason.',
        'No. Its squared norm is three, so its norm is square root of three rather than one.',
      ],
      [
        'Why should price and quantity vectors use the same product ordering in a cost calculation?',
        'Otherwise the dot product pairs some prices with quantities of different products. The arithmetic remains defined but no longer computes the intended total.',
      ],
    ]);
  }
  if (li === 2) {
    begin(li, 0, 'shape entries transpose');
    for (const a of mats)
      q(
        `For the matrix with rows ${rows(a)}, state its shape, its last-row first-column entry, and the rows of its transpose.`,
        `The shape is ${a.length} by ${a[0].length}; the requested entry is ${a.at(-1)[0]}. The transpose has rows ${rows(tr(a))}, with the shape reversed.`,
        { kind: 'transpose', a, expected: tr(a) },
      );
    begin(li, 0, 'matrix arithmetic');
    for (const a of mats) {
      const b = a.map((r, i) => r.map((x, j) => i - j + 1)),
        c = a.map((r, i) => r.map((x, j) => 2 * x - b[i][j]));
      q(
        `A has rows ${rows(a)} and B has rows ${rows(b)}. Compute 2A-B and explain the shape condition.`,
        `Both matrices have the same shape. Scale all entries of A and subtract corresponding entries of B, giving rows ${rows(c)}.`,
        { kind: 'matrix-combination', a, b, expected: c },
      );
    }
    begin(li, 1, 'row and column product readings');
    for (const a of mats) {
      const x = a[0].map((_, i) => (i % 2 ? -1 : 2)),
        y = mv(a, x);
      q(
        `A has rows ${rows(a)}. Find its output on x=${v(x)} using row dot products, then explain the matching column combination.`,
        `The output is ${v(y)}. Row i computes its dot product with x. Equivalently use coefficients ${v(x)} on A's columns and add; the ith entry of that sum is exactly the same row calculation.`,
        { kind: 'mv', a, x, expected: y },
      );
    }
    begin(li, 1, 'standard inputs and columns');
    for (const a of mats) {
      const j = a[0].length - 1,
        x = a[0].map((_, i) => (i === j ? 1 : 0));
      q(
        `A has rows ${rows(a)}. Find A applied to ${v(x)} without a full row-by-row multiplication. Why does this input select one column?`,
        `The output is the last column, ${v(a.map((r) => r[j]))}. All other input coefficients are zero and the last is one.`,
        { kind: 'mv', a, x, expected: mv(a, x) },
      );
    }
    begin(li, 2, 'rectangular matrix products');
    for (const a of mats) {
      const b = a[0].map((_, i) => [i + 1, 1 - i]),
        c = mm(a, b);
      q(
        `A has rows ${rows(a)} and B has rows ${rows(b)}. Compute AB, state its shape, and identify which matrix acts first on an input.`,
        `Each output column is A times the corresponding column of B. The product has rows ${rows(c)} and shape ${c.length} by two. B acts first, followed by A.`,
        { kind: 'mm', a, b, expected: c },
      );
    }
    begin(li, 2, 'order matters');
    for (const k of [1, 2, -1, 3, -2, 4]) {
      const a = [
          [1, k],
          [0, 1],
        ],
        b = [
          [2, 0],
          [0, 3],
        ],
        ab = mm(a, b),
        ba = mm(b, a);
      q(
        `Let A have rows ${rows(a)} and B have rows ${rows(b)}. Compute AB and BA. Explain which coordinate is stretched before versus after the shear.`,
        `AB has rows ${rows(ab)}, while BA has rows ${rows(ba)}. In AB the input coordinates are stretched before the shear; in BA the shear's output coordinates are stretched afterward. The differing off-diagonal entries show these are different rules.`,
        { kind: 'two-products', a, b, ab, ba },
      );
    }
    begin(li, 2, 'dimension compatibility');
    for (const [m, n, p] of [
      [2, 3, 4],
      [3, 2, 3],
      [1, 4, 2],
      [4, 1, 3],
      [2, 2, 2],
      [3, 4, 3],
    ])
      q(
        `A is ${m} by ${n} and B is ${n} by ${p}. Give the shape of AB. Is BA defined? If so, give its shape; do not assume it equals AB.`,
        `AB is ${m} by ${p}. ${p === m ? `BA is defined and has shape ${n} by ${n}. Existence alone says nothing about equality.` : `BA is undefined because its inner dimensions ${p} and ${m} differ.`}`,
      );
    begin(li, 3, 'checking a product by standard inputs');
    for (const a of mats) {
      const b = a[0].map((_, i) => [1, i]),
        c = mm(a, b);
      q(
        `A has rows ${rows(a)}, B has rows ${rows(b)}, and a claimed product C has rows ${rows(c)}. Verify C=AB by using both standard inputs of the two-dimensional input space. Explain why these checks suffice.`,
        `The first standard input is sent by B to ${v(b.map((r) => r[0]))}, then by A to ${v(c.map((r) => r[0]))}. The second similarly reaches ${v(c.map((r) => r[1]))}. These are C's two columns. Every input is a combination of the standard inputs, so linearity establishes the full equality.`,
        { kind: 'mm', a, b, expected: c },
      );
    }
    task(li, 3, 'matrix misconceptions', [
      [
        'Give nonzero two-by-two matrices A and B with AB=0 and show the product.',
        'Use A with rows (1,0),(0,0) and B with rows (0,0),(0,1). A erases every output B can produce, so every product entry is zero, although each factor is nonzero.',
      ],
      [
        'Give matrices A,B,C with AB=AC but B different from C.',
        'Take A with rows (1,0),(0,0), B=identity, and C with rows (1,0),(0,2). Both products have rows (1,0),(0,0), but B and C have different second diagonal entries.',
      ],
      [
        'Why is testing only the zero input useless for proving two matrices equal?',
        'Every matrix sends zero to zero. Agreement at that single input places no restriction on their columns.',
      ],
      [
        'Explain why (AB) transpose reverses the order of the factors.',
        'A row-column product entry becomes a column-row entry under transpose. B transpose times A transpose pairs the same entries, with compatible reversed shapes. Keeping the original factor order generally computes different entries or is undefined.',
      ],
      [
        'If A is two by three, compare the shapes of A transpose A and A A transpose.',
        'A transpose A is three by three and acts in the input coordinate space. A A transpose is two by two and acts in the output coordinate space. They cannot be the same matrix because their shapes differ.',
      ],
      [
        'Must a square matrix be symmetric? Give a counterexample.',
        'No. Rows (1,2),(0,1) make a square matrix, but its transpose has rows (1,0),(2,1), which differ.',
      ],
      [
        'For compatible matrices, justify A(B+C)=AB+AC using columns or entries.',
        'Each column of B+C is the sum of the corresponding columns. Multiplication by A distributes over that vector sum, producing the matching columns of AB+AC.',
      ],
      [
        'Why is a matrix-vector product generally not componentwise multiplication producing a matrix of the original shape?',
        'Each row forms one dot product and sums over the input components. The result has one entry per row, not one entry for each original matrix position.',
      ],
      [
        'If two linear matrix rules agree on every standard basis vector, prove they agree on every input.',
        'Write any input as the sum of its components times those standard vectors. Linearity lets both rules act on that combination, and their corresponding basis outputs agree term by term.',
      ],
      [
        'Can AB exist while BA does not? Give dimensions demonstrating this.',
        'Yes. A two-by-three matrix times a three-by-four matrix produces a two-by-four matrix. The reverse has inner dimensions four and two, so it is not defined.',
      ],
      [
        'A student computes each entry of AB by multiplying entries in the same position. What operation was missed?',
        'Matrix multiplication requires row-column dot products, including a sum over the matching inner dimension. Positionwise products are a different operation and do not in general represent composition.',
      ],
      [
        'Explain how matrix columns encode the per-product resource requirements of a workshop.',
        'Column j gives all resources required for one unit of product j. Multiplying by production counts scales each such column by its count and adds them into the total resource vector.',
      ],
    ]);
  }
  // Later chapters are authored in the companion module to keep each source readable.
  if (li >= 3) {
    const { author } = await import('./linear-algebra-advanced.mjs');
    author({
      li,
      begin: (s, n) => begin(li, s, n),
      q,
      task: (s, n, a) => task(li, s, n, a),
      v,
      rows,
      add,
      scale,
      dot,
      tr,
      mv,
      mm,
      frac,
      mats,
      pairs,
    });
  }
  original.sections = sections.map((title, i) => ({ title, questions: questions[i] }));
  const renumber = new Map(
    original.sections.flatMap((s) => s.questions).map((q, i) => [q.id, i + 1]),
  );
  for (const q of original.sections.flatMap((s) => s.questions)) q.id = renumber.get(q.id);
  for (const f of fixtures.filter((f) => f.lesson === lesson.slug)) f.id = renumber.get(f.id);
  for (const o of coverage.filter((o) => o.lesson === lesson.slug)) o.id = renumber.get(o.id);
  copies[lesson.slug] = Object.fromEntries(
    original.sections
      .flatMap((s) => s.questions)
      .map((q) => [q.id, { instructions: '', prompt: q.prompt, answer: q.answer }]),
  );
  const plan = pacing.find((p) => p.lessons[0].slug === lesson.slug);
  if (!plan) {
    fs.writeFileSync(path, YAML.stringify(original, { lineWidth: 0 }));
    continue;
  }
  const byId = new Map(original.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));
  const assigned = plan.lessons.flatMap((l) => l.sections.flatMap((s) => s.questionIds));
  if (
    assigned.length !== byId.size ||
    new Set(assigned).size !== byId.size ||
    assigned.some((id) => !byId.has(id))
  )
    throw Error(`Pacing plan must preserve every exercise exactly once: ${lesson.slug}`);
  const originalCopies = copies[lesson.slug];
  const originalCoverage = coverage.filter((o) => o.lesson === lesson.slug);
  const originalFixtures = fixtures.filter((f) => f.lesson === lesson.slug);
  for (const target of plan.lessons) {
    const sections = target.sections.map((s) => ({
      title: s.title,
      questions: s.questionIds.map((id) => byId.get(id)),
    }));
    copies[target.slug] = Object.fromEntries(
      sections.flatMap((s) => s.questions).map((q) => [q.id, originalCopies[q.id]]),
    );
    placements[target.slug] = Object.fromEntries(
      target.sections.map((s) => {
        if (s.inlineIds.some((id) => !s.questionIds.includes(id)))
          throw Error(`Inline question outside its teaching section: ${target.slug}/${s.title}`);
        return [s.title, s.inlineIds];
      }),
    );
    for (const section of sections)
      for (const question of section.questions) {
        const objective = originalCoverage.find((o) => o.id === question.id);
        Object.assign(objective, { lesson: target.slug, section: section.title });
        const fixture = originalFixtures.find((f) => f.id === question.id);
        if (fixture) fixture.lesson = target.slug;
      }
    fs.writeFileSync(
      'content/' + target.worksheet,
      YAML.stringify({ title: target.title, sections }, { lineWidth: 0 }),
    );
  }
}
fs.writeFileSync(
  'content/linear-algebra-placements.json',
  JSON.stringify(placements, null, 2) + '\n',
);
fs.writeFileSync('content/exercise-copy.yaml', YAML.stringify(copies, { lineWidth: 0 }));
fs.writeFileSync(
  'content/linear-algebra-verification.json',
  JSON.stringify(fixtures, null, 2) + '\n',
);
fs.writeFileSync(
  'content/linear-algebra-objectives.json',
  JSON.stringify(coverage, null, 2) + '\n',
);
// Deterministic response metadata consumes these exact numerical fixture records.
// Changed authored prompts still require an inspected source pin before publication.
execFileSync('python3', ['scripts/authoring/deterministic-exercises.py'], { stdio: 'inherit' });
