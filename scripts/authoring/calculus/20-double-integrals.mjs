import {
  raw,
  source,
  section,
  q,
  exact,
  expr,
  tuple,
  truth,
  quick,
  frac,
} from './multivariable-helpers.mjs';
const rectangles = source('5.1', 'Double Integrals over Rectangular Regions');
const regions = source('5.2', 'Double Integrals over General Regions');
const sections = [
  section(
    'Accumulate over an area',
    raw`A single integral accumulates contributions along an interval. A double integral accumulates them across a two-dimensional region. Divide a rectangle into small cells. In each cell, multiply a sampled function value by the cell's area, then add the contributions. If these sums approach one common value as the cells become arbitrarily small, that value is the double integral, written $\iint_R f(x,y)\,dA$. The symbol dA describes area, rather than a third independent variable.

For a continuous function on a closed rectangle, this limit exists. A grid with cell widths $\Delta x$ and $\Delta y$ has cell area $\Delta A=\Delta x\Delta y$. Using the width alone would give the wrong dimensions. If f is a height in meters and both coordinates measure meters, each product has cubic-meter units. If f is mass per square meter, the integral measures mass instead.

Take $f(x,y)=x+2y$ on $[0,2]\times[0,1]$. Divide the rectangle into two unit squares and sample their centers, $(1/2,1/2)$ and $(3/2,1/2)$. The sampled heights are $3/2$ and $5/2$. Multiplying each by area one gives the midpoint estimate four. Here the estimate happens to equal the exact integral because the function is affine; a single grid does not generally establish exactness.

A nonnegative height produces ordinary volume above the plane. Negative values instead contribute signed volume. Cancellation can make an integral zero even when the function is not zero throughout the region. For example, f=x on a rectangle symmetric about the y-axis has matching positive and negative contributions.

Before calculating, identify the region, the quantity per unit area, and the desired total. This interpretation prevents a common error: treating two integral signs as an instruction to square a one-variable integral. The two signs record accumulation across two coordinates.`,
    rectangles,
    'double integral',
    'A limit of sums of function values times small areas over a plane region.',
    raw`Integrating a constant height three over an area of two gives volume six.`,
    'A double integral is not the square of a single integral.',
  ),
  section(
    'Evaluate iterated integrals',
    raw`Fubini's theorem gives a practical method for continuous functions on closed rectangles: integrate one coordinate at a time, in either order. For $R=[a,b]\times[c,d]$, write $\int_a^b\int_c^d f(x,y)\,dy\,dx$. Read from the inside outward. During the inner y integral, x is held constant. The inner result is then a function of x to integrate over its interval.

For $f=x+2y$ on the rectangle from the preceding section, the inner calculation is $\int_0^1(x+2y)\,dy=[xy+y^2]_0^1=x+1$. The outer integral is $\int_0^2(x+1)\,dx=[x^2/2+x]_0^2=4$. Reversing the order gives $\int_0^1[ x^2/2+2xy]_0^2\,dy=\int_0^1(2+4y)\,dy=4$. The intermediate expressions differ while the total agrees.

An inner definite integral has no arbitrary constant. Its upper and lower substitutions already determine a unique function of the remaining coordinate. After the outer definite integral, no free x or y should remain. If one remains, recheck whether a bound was substituted or a variable was accidentally treated as a constant in both stages.

Linearity works as before: integrate sums term by term and pull constant factors outside. On a rectangle, a separated product $g(x)h(y)$ gives the product of the two corresponding one-variable integrals. Thus $\int_0^2\int_0^3 xy\,dy\,dx=(\int_0^2x\,dx)(\int_0^3y\,dy)=9$. This product shortcut depends on both the separated integrand and independent rectangular bounds.

An independent check can use a rough size bound before any antiderivative. If the integrand stays between zero and three over a rectangle of area two, the final total must lie between zero and six. A value outside that range signals an error in arithmetic or bounds.

Choose the order that makes the algebra easier, but justify that the theorem applies. Our examples use continuous functions on bounded regions. Singular or unbounded integrals need additional convergence analysis; changing order is not an unconditional rule for every expression with two integral signs.`,
    rectangles,
    'iterated integral',
    'An integral evaluated by integrating one coordinate and then the remaining coordinate.',
    raw`In $\int_0^2\int_0^1(x+2y)\,dy\,dx$, integrate y first while holding x fixed.`,
    'The inner differential determines the first integration variable.',
  ),
  section(
    'Describe simple regions with variable bounds',
    raw`A triangular or curved region usually cannot be represented by independent constant bounds. One useful description is $a\leq x\leq b$ together with $g(x)\leq y\leq h(x)$. For each fixed x, a vertical slice runs from its lower boundary g to its upper boundary h. Integrating over that region becomes $\int_a^b\int_{g(x)}^{h(x)}f(x,y)\,dy\,dx$. The inner bounds may depend on the outer variable; they must not depend on the variable currently being integrated.

Consider the triangle with vertices (0,0), (2,0), and (0,2). Its slanted edge is x+y=2, so a vertical slice has $0\leq y\leq 2-x$, with $0\leq x\leq 2$. Its area is $\int_0^2\int_0^{2-x}1\,dy\,dx=\int_0^2(2-x)\,dx=2$. Replacing the slanted bound by two would integrate the containing square and double the area.

To integrate x over the same triangle, first obtain $x(2-x)$ from the inner integral. The result is $\int_0^2(2x-x^2)\,dx=4/3$. The factor x is constant only during the y step, not throughout the entire calculation. Geometry also checks the result: the triangle has area two and average x coordinate two thirds, so its integral of x is four thirds.

Curved boundaries work the same way. Between $y=x^2$ and $y=x$ for $0\leq x\leq 1$, the upper curve is x because x is at least its square on this interval. Area is $\int_0^1(x-x^2)\,dx=1/6$. Solve intersections and test which curve is above before writing bounds.

Some regions require more than one set of slices because an upper or lower boundary changes. Split at those transition coordinates and add the integrals. A correct sketch and an explicit inequality description are part of the mathematics, even when the final task asks for a number.`,
    regions,
    'variable integration bounds',
    'Inner limits that describe a region boundary as a function of the outer coordinate.',
    raw`The triangle $x,y\geq 0$, $x+y\leq 2$ has y limits zero and $2-x$.`,
    'Bounds describe a region; changing them changes the quantity being accumulated.',
  ),
  section(
    'Reverse order by redescribing the same region',
    raw`Changing the order means describing the same set of points with slices in the other direction. It does not mean exchanging the differential symbols while leaving every bound in place. Start from the inequalities, find the full range of the new outer variable, and then find the endpoints of a slice at a fixed value of that variable.

For $0\leq x\leq 1$ and $x^2\leq y\leq x$, the y range is zero through one. Solving the curve equations for x gives $x=y$ and $x=\sqrt y$. On this interval y is no larger than its square root, so a horizontal slice runs from y to $\sqrt y$. Therefore $\int_0^1\int_{x^2}^x f\,dy\,dx=\int_0^1\int_y^{\sqrt y}f\,dx\,dy$ for the continuous functions considered here. Both descriptions give area one sixth.

Order can determine whether an elementary antiderivative is available. Consider $\int_0^1\int_x^1 e^{y^2}\,dy\,dx$. The inner y antiderivative is not elementary. The region is $0\leq x\leq y\leq 1$. In the other order, $\int_0^1\int_0^y e^{y^2}\,dx\,dy=\int_0^1 y e^{y^2}\,dy=(e-1)/2$. The inner x integration introduces the factor y needed for substitution in the outer integral.

A region can be simple in one direction but need several pieces in the other. For $0\leq x\leq 2$ and $0\leq y\leq\min(x,1)$, horizontal slices give $0\leq y\leq 1$, $y\leq x\leq 2$. Vertical slices must split at x=1. The two descriptions agree on the points even though one uses fewer integrals.

After reversing, test an interior point and a boundary point against both descriptions. These checks do not replace the derivation, but they quickly expose inverted inequalities or a missing piece. A change of order preserves the region and integrand; only their description changes.`,
    regions,
    'order of integration',
    'The sequence in which coordinates are integrated, together with bounds describing the same region.',
    raw`The region $0\leq x\leq y\leq 1$ can be sliced vertically or horizontally.`,
    'Swapping dx and dy without changing dependent bounds generally describes the wrong region.',
  ),
  section(
    'Volumes, averages, and normalized accumulation',
    raw`To compute the volume between a top surface and a bottom surface, integrate their vertical difference over the base region. Check which surface is higher on that region. Above the unit square, let the top be $3+x+y$ and the bottom be x. Their difference is $3+y$, so the volume is $\int_0^1\int_0^1(3+y)\,dy\,dx=7/2$. Integrating the top alone would measure volume relative to the plane z=0 instead.

An average value divides the accumulated quantity by the region's area: $f_{\mathrm{avg}}=\frac{1}{A(R)}\iint_R f\,dA$, for a region with positive area. On $[0,2]\times[0,1]$, the function x+2y has integral four and average two. The integral and average have different units: integrating temperature over area yields temperature times area; averaging restores temperature units.

For a continuous function, the average lies between its smallest and largest values on the region. This supplies a useful error check. Averaging a height that stays between two and five cannot produce seven. Sampling points uniformly in coordinate area and averaging their heights approximates this area average; using unequal cells requires weighting by their areas.

A nonnegative density can also be normalized so its total integral is one. For $p(x,y)=2x$ on the unit square, $\iint p\,dA=1$. The accumulated share in the half-square $0\leq x\leq 1/2$ is $\int_0^{1/2}\int_0^1 2x\,dy\,dx=1/4$, not one half: density increases toward the right. In probability, such a normalized density will describe how probability is distributed across pairs of continuous values. The integral over a region gives its share, rather than the density at a single point.

Keep the interpretations distinct. Signed functions can cancel; mass and probability densities are nonnegative. An average divides by area, while normalizing a density divides by its total mass. Each operation answers a different question.`,
    rectangles,
    'area average',
    'The integral of a function over a positive-area region divided by that area.',
    raw`An integral of twelve over an area of three gives average four.`,
    'Dividing by a side length instead of area gives the wrong average.',
  ),
];
sections[4].sources.push({
  id: 'mml-calculus-density',
  source: 'mml',
  locator:
    '§6.2 Discrete and Continuous Probabilities, Definition6.1 and equations6.15–6.16, printed p.181',
  url: 'https://mml-book.github.io/book/mml-book.pdf#page=187',
  supports:
    'Nonnegative normalized densities and their accumulation over regions, supporting the original two-variable probability bridge.',
});
sections[0].questions = [
  q(
    'A constant height 5 covers a rectangle of side lengths 2 and 3. Find its volume.',
    'The area is 6; height times area is 5 times 6=30.',
    exact(30),
  ),
  q(
    'A grid has cell widths 1/4 and 1/3. Find each cell area.',
    'Multiply the widths: (1/4)(1/3)=1/12.',
    exact('1/12'),
  ),
  q(
    'Four equal-area cells each have area 1/2 and sampled densities 2,4,6,8. Find the estimated mass.',
    'The sum of sampled densities is 20; multiplying by 1/2 gives 10.',
    exact(10),
  ),
  q(
    'On the unit square, use its center to estimate the integral of $x^2+y^2$.',
    'The center height is 1/4+1/4=1/2 and the area is 1, giving 1/2.',
    exact('1/2'),
  ),
  q(
    'On [0,2] by [0,2], use the center to estimate the integral of $x+3y$.',
    'At (1,1), the height is 4; area 4 gives 16.',
    exact(16),
  ),
  q(
    'Find the signed integral of x over [-2,2] by [0,3].',
    'For every positive-x contribution there is an equal negative-x contribution; the total is zero.',
    exact(0),
    'interpret',
  ),
  q(
    'Does a zero signed double integral force its continuous integrand to be zero everywhere?',
    'No. The function x on a symmetric rectangle has integral zero but is usually nonzero.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain why cell area, not cell width, multiplies a sampled density measured in kilograms per square meter.',
    'The density describes mass per unit area. Multiplying by square meters gives kilograms, whereas multiplying by width alone leaves kilograms per meter.',
  ),
  q(
    'A height is between 2 and 5 over area 3. Give lower and upper bounds for its volume as a pair.',
    'Multiply the area by both height bounds: (6,15).',
    tuple([6, 15]),
  ),
  q(
    'Why does one accurate midpoint estimate not prove that midpoint sampling is exact for every function?',
    'Exactness depends on the function and grid. Curvature generally creates errors; for example the unit-square midpoint estimate of x squared plus y squared is 1/2, whereas its integral is 2/3.',
  ),
];
sections[1].questions = [
  q(
    raw`Evaluate $\int_0^2\int_0^1(2x+3y)\,dy\,dx$.`,
    'The inner result is 2x+3/2. Integrating from 0 to 2 gives 4+3=7.',
    exact(7),
  ),
  q(
    raw`Evaluate $\int_0^1\int_0^2xy\,dx\,dy$.`,
    'The inner integral is 2y; its integral from 0 to 1 is 1.',
    exact(1),
  ),
  q(
    raw`Evaluate $\int_0^2\int_1^3 y\,dy\,dx$.`,
    'The inner value is (9-1)/2=4; the outer interval has length 2, so the total is 8.',
    exact(8),
  ),
  q(
    raw`Evaluate $\int_{-1}^1\int_0^2x^2\,dy\,dx$.`,
    'The inner result is 2x squared. Its symmetric integral is 4/3.',
    exact('4/3'),
  ),
  q(
    raw`Find the inner result $\int_0^2(x+y^2)\,dy$ as a formula in x.`,
    'Holding x constant gives 2x+8/3.',
    expr('2*x+8/3', ['x']),
  ),
  q(
    raw`Find $\int_0^1\int_0^1(x^2+y^2)\,dy\,dx$.`,
    'Integrating each term gives 1/3+1/3=2/3.',
    exact('2/3'),
  ),
  q(
    raw`Evaluate $\int_0^2\int_0^3 x^2y\,dy\,dx$.`,
    'The separated factors integrate to 8/3 and 9/2; their product is 12.',
    exact(12),
  ),
  q(
    raw`Does the inner definite integral in $\int_0^1\int_0^2 f(x,y)\,dx\,dy$ need an arbitrary C?`,
    'No. Subtracting endpoint values fixes the inner result as a function of y.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain why the product shortcut for xy on a rectangle cannot be applied unchanged on a triangle.',
    'On a triangle, one coordinate range depends on the other. The region is not the Cartesian product of two independent intervals, so the two factors cannot be separated in that way.',
  ),
  q(
    'What continuity assumption is sufficient to evaluate a rectangular double integral in either order?',
    'Continuity of the integrand throughout the closed rectangle is sufficient for the version of Fubini used here.',
  ),
];
sections[2].questions = [
  q(
    raw`Find the area of $0\leq x\leq 3$, $0\leq y\leq 3-x$.`,
    'Integrate 3-x from 0 to 3:9-9/2=9/2.',
    exact('9/2'),
  ),
  q(
    raw`Integrate x over $0\leq x\leq 3$, $0\leq y\leq 3-x$.`,
    'Integrate x(3-x):[3x squared/2-x cubed/3] from 0 to 3=9/2.',
    exact('9/2'),
  ),
  q(
    raw`Find the area between $y=x^2$ and $y=2x$ for $0\leq x\leq 2$.`,
    'The upper curve is 2x. Integrating 2x-x squared gives 4-8/3=4/3.',
    exact('4/3'),
  ),
  q(
    raw`Integrate y over $0\leq x\leq 1$, $0\leq y\leq x$.`,
    'The inner integral is x squared/2. Integrating it gives 1/6.',
    exact('1/6'),
  ),
  q(
    raw`Integrate xy over $0\leq x\leq 1$, $0\leq y\leq x$.`,
    'The inner integral is x cubed/2. Its integral is 1/8.',
    exact('1/8'),
  ),
  q(
    raw`A triangle has $x,y\geq 0$ and $2x+y\leq 4$. Give the upper y bound as a formula in x.`,
    'Solve 2x+y=4 for y:4-2x.',
    expr('4-2*x', ['x']),
  ),
  q(
    raw`For that triangle, give the outer x interval endpoints as a pair.`,
    'On y=0 the sloping boundary reaches x=2; the interval is[0,2].',
    tuple([0, 2]),
  ),
  q(
    raw`Find the area between $y=x^3$ and $y=x$ on $[0,1]$.`,
    'The area is the integral of x-x cubed:1/2-1/4=1/4.',
    exact('1/4'),
  ),
  q(
    'Explain why an inner y bound written as 2-y is not a valid vertical-slice upper limit.',
    'During the inner integral y is the running coordinate. Its endpoints must be fixed for each outer x, rather than depending on that same running y.',
  ),
  q(
    'What must be checked before using upper curve minus lower curve to find area?',
    'Find intersections, determine the coordinate interval, and determine which curve is above on each part. Split if the order changes.',
  ),
];
sections[3].questions = [
  q(
    raw`For $0\leq x\leq y\leq 3$, give the outer y interval endpoints when x is integrated first.`,
    'The y coordinate ranges from 0 through 3, so the endpoints are (0,3).',
    tuple([0, 3]),
  ),
  q(
    raw`For $0\leq x\leq y\leq 3$, give the upper x bound as a formula in y.`,
    'At a fixed y, x runs from 0 to y, so the upper bound is y.',
    expr('y', ['y']),
  ),
  q(
    raw`The region is $0\leq x\leq 2$, $x^2\leq y\leq 4$. Give the outer y interval endpoints after reversal.`,
    'The lowest y is 0 and the highest is 4, giving(0,4).',
    tuple([0, 4]),
  ),
  q(
    raw`For that region, give the upper x bound as a formula in y.`,
    'The condition x squared<=y with x>=0 becomes x<=sqrt(y).',
    {
      validator: 'calculus-expression',
      params: { variables: ['y'], expected: 'sqrt(y)', domain: { nonnegative: ['y'] } },
      correct: 'sqrt(y)',
      incorrect: 'y+1',
    },
  ),
  q(
    raw`Evaluate $\int_0^1\int_x^1 2y\,dy\,dx$.`,
    'After reversal, integrate 2y over x from 0 to y, then integrate 2y squared over y from 0 to 1:2/3.',
    exact('2/3'),
  ),
  q(
    raw`Evaluate $\int_0^1\int_x^1 y^3\,dy\,dx$.`,
    'Reversal gives the integral of y times y cubed from 0 to 1, namely 1/5.',
    exact('1/5'),
  ),
  q(
    raw`Find the area of $0\leq y\leq 1$, $y\leq x\leq 2$.`,
    'Integrating horizontal width 2-y gives 2-1/2=3/2.',
    exact('3/2'),
  ),
  q(
    raw`Does replacing dy dx by dx dy while keeping the bounds 0<=x<=1 and x<=y<=1 correctly reverse the order?`,
    'No. The new inner bounds must describe x at fixed y:0<=x<=y, with 0<=y<=1.',
    truth(false),
    'interpret',
  ),
  q(
    raw`Explain why reversing $\int_0^1\int_x^1 e^{y^2}\,dy\,dx$ helps.`,
    'Integrating x first contributes a factor y. Then substitution u=y squared evaluates the remaining integral of y exp(y squared), even though the original inner antiderivative is not elementary.',
  ),
  q(
    raw`Describe why vertical slices of $0\leq y\leq 1$, $y\leq x\leq 2$ need a split at x=1.`,
    'For x from 0 to 1 the top is y=x. For x from 1 to 2 the top is y=1. A single upper expression would omit or add points.',
  ),
];
sections[4].questions = [
  q(
    'A surface has integral 18 over a region of area 6. Find its area average.',
    'Divide the integral by area:18/6=3.',
    exact(3),
  ),
  q(
    'Find the average of x+2y on [0,2] by [0,1].',
    'The integral is 4 and area is 2, so the average is 2.',
    exact(2),
  ),
  q(
    'Find the volume between top 4+x+y and bottom x over the unit square.',
    'The height difference is 4+y. Its unit-square integral is 4+1/2=9/2.',
    exact('9/2'),
  ),
  q(
    'A nonnegative density 3x is defined on the unit square. Find its total mass.',
    'The y integral contributes length 1 and the x integral of 3x is 3/2.',
    exact('3/2'),
  ),
  q(
    'Find k so the density kx on the unit square has total integral 1.',
    'Its total is k/2, so k=2.',
    exact(2),
  ),
  q(
    'For density 2x on the unit square, find the accumulated share with 0<=x<=1/2.',
    'Integrate 2x over[0,1/2] and unit y length: x squared at 1/2 gives 1/4.',
    exact('1/4'),
  ),
  q(
    'For density 2x on the unit square, find the accumulated share with 1/2<=x<=1.',
    'Subtract squared endpoints:1-1/4=3/4.',
    exact('3/4'),
  ),
  q(
    'Can the area average of a continuous function taking values only between 2 and 5 be 7?',
    'No. Integrating the pointwise bounds and dividing by area keeps the average between 2 and 5.',
    truth(false),
    'interpret',
  ),
  q(
    'Explain the difference between normalizing a density and taking an area average.',
    'Normalization divides the density by its total integral so the new total is 1. An area average divides the accumulated quantity by the region area to obtain an average function value.',
  ),
  q(
    'A height changes sign. Why can its signed integral differ from the total geometric volume between its graph and the plane?',
    'Negative heights subtract in the signed integral. Geometric volume adds the magnitudes on both sides, so it uses the integral of the absolute height.',
  ),
];
sections[1].quickCheck = quick(
  'In an integral with inner differential dy, what is held constant during that step?',
  ['x', 'y', 'Neither'],
  0,
  'The inner integral varies y while x is the parameter.',
);
sections[3].quickCheck = quick(
  'What must remain the same when reversing integration order?',
  ['Every written bound', 'The region and integrand', 'The inner variable'],
  1,
  'Bounds change so the same points are described in the new order.',
);
sections[0].review = [
  q(
    'A density 4 covers area 3/2. Find total mass.',
    'Multiply density by area:4 times 3/2=6.',
    exact(6),
  ),
  q('Cells have widths 1/5 and 1/2. Find cell area.', 'The product is 1/10.', exact('1/10')),
  q(
    'Why can a nonzero function have zero signed integral?',
    'Contributions of opposite signs can cancel over the region.',
  ),
];
sections[1].review = [
  q(
    raw`Evaluate $\int_0^1\int_0^2(x+y)\,dy\,dx$.`,
    'The inner result is 2x+2; the outer integral gives 3.',
    exact(3),
  ),
  q(
    raw`Evaluate $\int_0^2\int_0^1 x^2y\,dy\,dx$.`,
    'The inner result is x squared/2; the outer result is 4/3.',
    exact('4/3'),
  ),
  q(
    raw`Find $\int_0^1(xy+y)\,dy$ as a formula in x.`,
    'Integrate(x+1)y in y to obtain (x+1)/2.',
    expr('(x+1)/2', ['x']),
  ),
];
sections[2].review = [
  q(
    raw`Find the area of $0\leq x\leq 1$, $0\leq y\leq 2x$.`,
    'Integrating 2x from 0 to 1 gives 1.',
    exact(1),
  ),
  q(
    raw`Integrate x over $0\leq x\leq 1$, $0\leq y\leq 2x$.`,
    'The inner result is 2x squared; its integral is 2/3.',
    exact('2/3'),
  ),
  q(
    'Why should the bounding curves be sketched before integrating?',
    'The sketch identifies the actual region, intersections, and which curve supplies each bound.',
  ),
];
sections[3].review = [
  q(
    raw`Reverse $0\leq x\leq y\leq 2$: give the lower and upper x bounds as expressions in y.`,
    'At fixed y the bounds are 0 and y; the outer y range is 0 to 2.',
  ),
  q(
    raw`Evaluate $\int_0^1\int_x^1 y^2\,dy\,dx$.`,
    'After reversal the integrand accumulates x width y, leaving the integral of y cubed:1/4.',
    exact('1/4'),
  ),
  q(
    raw`Find the area of $0\leq y\leq 2$, $y\leq x\leq 3$.`,
    'Integrate 3-y from 0 to 2 to get 6-2=4.',
    exact(4),
  ),
];
sections[4].review = [
  q('An integral equals 35 over area 7. Find the average.', 'Divide 35 by 7 to get 5.', exact(5)),
  q(
    'Find k so constant density k over a rectangle of area 4 has total 1.',
    'The total is 4k, so k=1/4.',
    exact('1/4'),
  ),
  q(
    'For density 2x on the unit square, find the share with 0<=x<=1/3.',
    'Integrate 2x up to 1/3 to obtain 1/9.',
    exact('1/9'),
  ),
];
export default {
  number: 20,
  slug: 'calculus-double-integrals',
  title: 'Introductory Double Integrals',
  intro:
    'Accumulation now has two input directions. We will connect area-based sums to iterated integration, use geometry to set and reverse bounds, and interpret the result as volume, an average, or a share of a normalized total. The one-variable integration rules still do the arithmetic; describing the region is the new central skill.',
  sections,
};
