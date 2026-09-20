// Original sampled coordinates; each caption states what sampling does and does not prove.
const curve = (id, label, f, a, b, dashed = false) => ({
  id,
  label,
  points: Array.from({ length: 161 }, (_, i) => {
    const x = a + ((b - a) * i) / 160;
    return [x, f(x)];
  }),
  dashed,
});
const contour = (id, label, c) => ({
  id,
  label,
  points: Array.from({ length: 161 }, (_, i) => {
    const t = (2 * Math.PI * i) / 160;
    return [Math.sqrt(c) * Math.cos(t), Math.sqrt(c / 2) * Math.sin(t)];
  }),
  dashed: false,
});
export function calculusFigures(lessons) {
  const figures = [];
  function add(number, index, title, bounds, curves, text, extras = {}) {
    const lesson = lessons.find((l) => l.number === number);
    if (!lesson) return;
    const section = lesson.sections[index];
    const f = {
      id: `calculus-figure-${number}`,
      kind: 'cartesian',
      title,
      lesson: lesson.slug,
      section: section.title,
      bounds,
      curves,
      regions: [],
      markers: [],
      arrows: [],
      frames: [{ text, route: [], highlight: [] }],
      requires: section.terms.map((t) => t.id),
      mathLabels: {},
      creation:
        'Coordinates are calculated from the explicitly stated functions at 161 equally spaced parameter values. Separate curve segments preserve the stated breaks. The caption gives the exact mathematics independently of the plotted approximation.',
      limitations:
        'Straight segments approximate the curve between sampled points. Axis scales may differ. The picture illustrates the supplied calculation; it does not establish a limit, convergence, or optimality by visual inspection.',
      ...extras,
    };
    figures.push(f);
    section.body += `\n\n![${title}](figure:${f.id})`;
  }
  add(
    1,
    0,
    'A limit and an assigned value',
    { x: [-1, 3], y: [-1, 5] },
    [
      curve('left', 'y = x + 1 (left)', (x) => x + 1, -1, 0.99),
      curve('right', 'y = x + 1 (right)', (x) => x + 1, 1.01, 3),
    ],
    'Both punctured branches approach height two as x approaches one. The filled point assigns height four at x=1; it changes the function value but not the limit.',
    {
      markers: [
        { at: [1, 2], label: 'hole', open: true },
        { at: [1, 4], label: 'assigned value', open: false },
      ],
    },
  );
  add(
    2,
    0,
    'Secant and tangent to a parabola',
    { x: [-1, 3], y: [-2, 9] },
    [
      curve('parabola', 'y = x²', (x) => x * x, -1, 3),
      curve('secant', 'secant: y = 3x - 2', (x) => 3 * x - 2, -1, 3, true),
      curve('tangent', 'tangent: y = 2x - 1', (x) => 2 * x - 1, -1, 3, true),
    ],
    'The secant through (1,1) and (2,4) has slope three. The derivative of x² at one gives tangent slope two. Shrinking the second-point displacement makes the secant slope approach two.',
  );
  add(
    7,
    2,
    'A function can rise and then fall',
    { x: [-2, 2], y: [-3, 3] },
    [curve('cubic', 'y = x³ - 3x', (x) => x * x * x - 3 * x, -2, 2)],
    'The derivative 3x²-3 changes sign at -1 and 1. The function rises before -1, falls between -1 and 1, and rises after 1. The plotted extrema have heights two and negative two.',
  );
  add(
    9,
    1,
    'Accumulation as signed area',
    { x: [-1, 3], y: [-1, 3] },
    [curve('rate', 'rate y = x', (x) => x, -1, 3)],
    'From x=0 to x=2, the integral of x is the triangle area two. The graph also extends below the axis for negative x, where signed contributions are negative.',
    {
      regions: [
        {
          points: [
            [0, 0],
            [2, 0],
            [2, 2],
          ],
        },
      ],
    },
  );
  add(
    15,
    3,
    'A cubic Taylor approximation near zero',
    { x: [-2, 2], y: [-1.5, 1.5] },
    [
      curve('sine', 'sin(x)', Math.sin, -2, 2),
      curve('taylor', 'x - x³/6', (x) => x - (x * x * x) / 6, -2, 2, true),
    ],
    'The cubic Taylor polynomial agrees with sine through the cubic term at zero. For |x|≤2, the fourth-order Taylor remainder bound |x|⁵/120 applies because the fifth derivative has magnitude at most one. Agreement near zero does not mean the two functions are identical.',
  );
  add(
    16,
    1,
    'Level curves of a quadratic function',
    { x: [-6, 6], y: [-3, 3] },
    [contour('level2', 'x² + 2y² = 2', 2), contour('level8', 'x² + 2y² = 8', 8)],
    'Each ellipse consists of input pairs with the same labeled function value. These contours lie in the input plane; they are not vertical slices of the surface.',
  );
  add(
    17,
    4,
    'A gradient is normal to a regular contour',
    { x: [-6.5, 7.5], y: [-3, 4] },
    [
      contour('level6', 'x² + 2y² = 6', 6),
      curve('tangent', 'tangent: y = 3 - x', (x) => 3 - x, -1, 4, true),
    ],
    'At (2,1), the gradient of x²+2y² is (4,4), perpendicular to the tangent direction (1,-1). The arrow is scaled to one quarter of the gradient for readability.',
    {
      markers: [{ at: [2, 1], label: '(2,1)', open: false }],
      arrows: [{ from: [2, 1], to: [3, 2], label: 'gradient direction', dashed: false }],
    },
  );
  add(
    22,
    1,
    'Small and excessive descent steps',
    { x: [-3, 3], y: [-0.5, 10] },
    [curve('objective', 'f(x) = x²', (x) => x * x, -3, 3)],
    'From x=1, gradient descent with step size 1/4 gives 1/2 and then 1/4. With step size 5/4 it gives -3/2 and then 9/4: the signs alternate and objective values grow. These are exact iterates of x_next=(1-2α)x.',
    {
      markers: [
        { at: [1, 1], label: 'start', open: false },
        { at: [0.5, 0.25], label: '1/2', open: false },
        { at: [-1.5, 2.25], label: 'overshoot', open: false },
        { at: [2.25, 5.0625], label: 'growing error', open: false },
      ],
    },
  );
  return figures;
}
