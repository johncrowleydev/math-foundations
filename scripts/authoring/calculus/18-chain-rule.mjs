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
} from './multivariable-helpers.mjs';
const chain = source('4.5', 'The Chain Rule');
const sections = [
  section(
    'A moving input changes several coordinates',
    raw`A partial derivative holds other inputs fixed. A moving input usually does not. If $z=f(x,y)$ while $x=x(t)$ and $y=y(t)$, both coordinates can transmit a change in t to the output. For differentiable functions, the chain rule adds these contributions: $dz/dt=f_x\,dx/dt+f_y\,dy/dt$. The partials are evaluated at the current pair $(x(t),y(t))$.

Take $f(x,y)=x^2y$, $x(t)=t+1$, and $y(t)=t^2$. First differentiate the outer function: $f_x=2xy$ and $f_y=x^2$. Differentiate the inputs: $x'=1$, $y'=2t$. The path derivative is $2(t+1)t^2+2t(t+1)^2$. At t=1 it is twelve. Substitution first gives $(t+1)^2t^2$, whose ordinary product-rule derivative agrees. These two routes provide a useful independent check.

The distinction matters even when a variable name is repeated. If $z=f(t,y(t))$, there is a direct t contribution and an indirect one through y. The total derivative is $f_t+f_y y'$. Treating $f_t$ alone as the total derivative silently holds y fixed, answering a different question.

### Evaluation points and units

Suppose $f_x=3$ degrees per meter and $f_y=-2$ degrees per second at a point, while a trajectory changes x at four meters per second and y at one second per second. The output rate is $3(4)-2(1)=10$ degrees per second. Each product must have output-per-parameter units before the products are added.

The chain rule requires differentiability of the relevant composition maps. Merely knowing coordinate partials at a pathological point is insufficient. For smooth polynomials and elementary functions on their valid domains the hypotheses are straightforward; at singular points they must be checked.`,
    chain,
    'total path derivative',
    'The derivative of a scalar output along a parameterized input path, including every changing coordinate.',
    raw`For $z=xy$, the path derivative is $x'y+xy'$.`,
    'A partial derivative along one coordinate is not generally the rate along a moving path.',
  ),
  section(
    'Dependency paths organize the sum',
    raw`A dependency diagram records which variables feed which functions. Draw the independent parameter at one end, intermediate variables in the middle, and the output at the other. Along a path, multiply local derivatives. Add products over all paths leading from the chosen input to the output. The diagram is a bookkeeping device for the chain rule, not a replacement for the theorem's hypotheses.

Suppose $u=s+t$, $v=s-t$, and $z=u^2+3v$. Holding t fixed, both u and v change at rate one with s. Hence $z_s=2u+3$. Holding s fixed, their rates with t are one and negative one, so $z_t=2u-3$. After substitution these become $2(s+t)+3$ and $2(s+t)-3$.

For another layer, let $w=z^2$. Then $w_s=2z(2u+3)$. The derivative of the final squaring operation multiplies the total derivative already collected at z. Forgetting one branch under z would produce a wrong result even if the last chain factor were correct.

### Shared intermediates count once per path

Consider $u=t^2$, $v=u+1$, and $w=uv$. There are two paths from u to w: the direct factor u and the path through v. Thus $dw/du=v+u$ and $dw/dt=(v+u)2t$. Substituting v=u+1 gives $2t(2t^2+1)$. Calling u and v independent during the entire calculation would lose their dependency; treating both occurrences of u as a single factor would lose the product rule.

Name the independent variables first, identify what is held fixed, and label every edge with its local derivative. Only after the symbolic paths are correct should you substitute numerical values. This order reduces the risk of evaluating an intermediate at the wrong point or turning a variable into a constant too early.`,
    chain,
    'dependency path',
    'A route through intermediate variables along which local derivatives multiply in the chain rule.',
    raw`For $w=(u+v)^2$, both paths through u and v contribute to a changing input.`,
    'Products belong along paths; separate paths contribute by addition.',
  ),
  section(
    'The Jacobian is the derivative matrix',
    raw`When a function returns a vector, its derivative collects one row per output and one column per input. This matrix is the Jacobian. For $F(x,y)=(x^2+y,xy)$, the first row differentiates the first output and the second row differentiates the second output: $J_F=\begin{pmatrix}2x&1\\y&x\end{pmatrix}$. Multiplying by a small column displacement predicts the first-order output displacement.

At $(1,2)$ the matrix is $\begin{pmatrix}2&1\\2&1\end{pmatrix}$. For displacement $(h,k)$, both output changes are approximately $2h+k$. The nonlinear outputs need not be identical; their first-order behavior happens to agree at this point. A Jacobian describes local change, not the function's entire formula.

For a map from n inputs to m outputs the Jacobian has m rows and n columns. A scalar function has a one-row Jacobian. We write its gradient as a column vector when multiplying matrices, so that this Jacobian is the gradient transpose. Writing gradients as tuples in a hand calculation does not erase this orientation convention.

### A rectangular example

Let $G(s,t)=(s+t,s-t,2s)$. Its Jacobian has three rows and two columns: rows $(1,1)$, $(1,-1)$, and $(2,0)$. A two-component input displacement is mapped to a three-component output displacement. There is no determinant of this rectangular Jacobian; a derivative matrix need not be square.

To construct a Jacobian, state the input order and output order, differentiate each output with respect to each input, and verify the dimensions. If the map is already linear, the Jacobian is its constant matrix. If it is affine, the fixed offset disappears under differentiation while its matrix remains. This connects the new notation directly to earlier linear transformations.`,
    chain,
    'Jacobian matrix',
    'The matrix of partial derivatives, with outputs indexing rows and inputs indexing columns.',
    raw`A map from two inputs to three outputs has a three-by-two Jacobian.`,
    'A scalar gradient column is the transpose of the scalar function’s Jacobian row.',
  ),
  section(
    'Composition becomes matrix multiplication',
    raw`Suppose G sends n inputs to m intermediate values and F sends those m values to p outputs. The derivative of the composition is $J_{F\circ G}(x)=J_F(G(x))J_G(x)$. The product has shape p by n. The rightmost matrix acts first, just as it did for composition of linear transformations.

Take $G(s,t)=(s+t,s-t)$ and $F(u,v)=(u^2,uv)$. At $(s,t)=(2,1)$, the intermediate point is $(u,v)=(3,1)$. The outer derivative there has rows $(6,0)$ and $(1,3)$. The inner derivative has rows $(1,1)$ and $(1,-1)$. Multiplying gives rows $(6,6)$ and $(4,-2)$.

Direct substitution produces the output pair $((s+t)^2,s^2-t^2)$. Differentiating it at $(2,1)$ gives the same rows. This check catches both a reversed multiplication order and evaluation of the outer Jacobian at the wrong coordinates.

For scalar output, the matrix product reduces to sums over dependency paths. Each entry of a row-times-column product sums the outer sensitivity to one intermediate multiplied by that intermediate's sensitivity to the original input. There is no new calculus rule hiding behind the matrix notation; the notation organizes the old one.

### Shapes are a mathematical check

If G maps two inputs to three intermediates and F maps three intermediates to one output, the matrices have shapes one-by-three and three-by-two. Their product is one-by-two. Reversing them is not even defined. When both happen to be square, dimensions alone cannot catch a reversal, so track what space each matrix accepts. Finally, numerical agreement at a single point is a useful arithmetic check but does not prove two symbolic derivative formulas agree everywhere.`,
    chain,
    'Jacobian chain rule',
    'The derivative of a composition is the outer Jacobian at the intermediate point times the inner Jacobian.',
    raw`For compatible maps, $J_{F\circ G}=J_F(G(x))J_G(x)$.`,
    'The outer derivative must be evaluated at the intermediate output, not the original input.',
  ),
  section(
    'Implicit dependencies and computation graphs',
    raw`A relation can define an output implicitly. Suppose $H(x,y)=0$ determines y as a differentiable function of x near a point, with $H_y\ne0$. Differentiating the relation along that curve gives $H_x+H_y y'=0$, hence $y'=-H_x/H_y$. The nonzero denominator condition is part of the local argument, not an optional arithmetic detail.

For $H(x,y)=x^2+2y^2-6$, at $(2,1)$ the partials are four and four, so the implicit slope is negative one. At a point with y=0, this formula cannot solve for y as a differentiable function of x. The curve might instead be describable using x as a function of y; changing the dependent variable changes the relevant hypothesis.

### A small model-error graph

Let a prediction be $p=wx+b$, a residual $r=p-y$, and a loss $L=r^2/2$. Here x and y are fixed data; w and b are adjustable parameters. The local derivatives are $dL/dr=r$, $dr/dp=1$, $\partial p/\partial w=x$, and $\partial p/\partial b=1$. Multiplying along paths gives $L_w=rx$ and $L_b=r$.

At x=2, y=5, w=1, b=1, the prediction is three and the residual is negative two. The two loss derivatives are negative four and negative two. These are parameter sensitivities; they are not new predictions or residuals. With several observations, sum the path contributions from their loss terms. Shared parameters receive contributions from every relevant observation.

This is the mathematical idea behind propagating derivatives through a computation graph. It does not require implementing an automatic differentiation system in this lesson. The learner's task is to identify dependencies, calculate local derivatives, combine all paths, and check the result by differentiating a substituted expression when feasible.`,
    chain,
    'implicit differentiation in several variables',
    'Differentiation of a relation along its locally defined dependent-variable path.',
    raw`Where $H_y\ne0$, the relation $H(x,y)=0$ gives $y'=-H_x/H_y$.`,
    'Solving for a derivative requires checking the relevant partial derivative is nonzero.',
  ),
];
for (const [a, b] of [
  [1, 2],
  [-1, 3],
  [2, -1],
  [0, 2],
  [3, 1],
]) {
  sections[0].questions.push(
    q(
      raw`For $z=xy$, $x=t+${a}$ and $y=t^2+${b}$, find dz/dt.`,
      raw`The two contributions give $(t^2+${b})+2t(t+${a})$.`,
      expr(`t^2+${b}+2*t*(t+${a})`, ['t']),
    ),
    q(
      raw`At a point, $f_x=${a}$ and $f_y=${b}$. Along a path, x'=2 and y'=-3. Find the output rate.`,
      raw`The rate is $2(${a})-3(${b})=${2 * a - 3 * b}$.`,
      exact(2 * a - 3 * b),
    ),
  );
  sections[1].questions.push(
    q(
      raw`For $u=s+t$, $v=s-t$, and $z=${a}u^2+${b}v$, find z_s in terms of s and t.`,
      raw`Both inner s derivatives are one, giving $${2 * a}(s+t)+${b}$.`,
      expr(`${2 * a}*(s+t)+${b}`, ['s', 't']),
    ),
    q(
      raw`For the explicit definitions $u=s+t$, $v=s-t$, $z=${a}u^2+${b}v$, find z_t.`,
      raw`The v branch has derivative -1, so $z_t=${2 * a}(s+t)-(${b})$.`,
      expr(`${2 * a}*(s+t)-(${b})`, ['s', 't']),
    ),
  );
  sections[2].questions.push(
    q(
      raw`For $F(x,y)=(x^2+y,xy)$, give its Jacobian entries at $(${a},${b})$ in row-major order as a four-tuple.`,
      raw`The rows are (2x,1) and (y,x), so the tuple is (${2 * a},1,${b},${a}).`,
      tuple([2 * a, 1, b, a]),
    ),
    q(
      raw`For the map $G(s,t)=(s+t,s-t,${a}s+${b}t)$, give the final row of its Jacobian.`,
      raw`Differentiate the last output in input order (s,t): (${a},${b}).`,
      tuple([a, b]),
    ),
  );
  sections[3].questions.push(
    q(
      raw`Let $G(s,t)=(s+t,s-t)$ and $F(u,v)=(u^2,uv)$. At $(${a},${b})$, give the first row of the composition Jacobian.`,
      raw`The first output is $(s+t)^2$, so both entries are $2(s+t)=${2 * (a + b)}$.`,
      tuple([2 * (a + b), 2 * (a + b)]),
    ),
    q(
      raw`For the explicit maps $G(s,t)=(s+t,s-t)$ and $F(u,v)=(u^2,uv)$, give the second composition-Jacobian row at $(${a},${b})$.`,
      raw`The second output is $s^2-t^2$, giving (${2 * a},${-2 * b}).`,
      tuple([2 * a, -2 * b]),
    ),
  );
  const r = 2 * a + b - 5;
  sections[4].questions.push(
    q(
      raw`For fixed data x=2,y=5 and $L=(wx+b-y)^2/2$, find $L_w$ at $(w,b)=(${a},${b})$.`,
      raw`The residual is ${r}; multiply it by x=2 to get ${2 * r}.`,
      exact(2 * r),
    ),
    q(
      raw`For fixed data x=2,y=5 and $L=(wx+b-y)^2/2$, find $L_b$ at $(w,b)=(${a},${b})$.`,
      raw`The residual is ${r}, and the prediction's b derivative is one.`,
      exact(r),
    ),
  );
}
sections[2].questions.push(
  q(
    'Why does a map from two inputs to three outputs have a 3-by-2 Jacobian?',
    'Each of the three output functions contributes a row of derivatives with respect to the two inputs.',
  ),
);
sections[4].questions.push(
  q(
    'Explain why $-H_x/H_y$ needs $H_y$ nonzero.',
    'The derivation solves a local linear equation for the dependent-variable rate. A zero coefficient cannot be divided out and may signal that this dependent-variable description fails.',
  ),
);
sections[0].quickCheck = quick(
  'When both x and y depend on t, how do their chain-rule contributions combine?',
  ['Add them', 'Multiply the two complete contributions', 'Keep only the larger one'],
  0,
  'Each input transmits part of the first-order output change; the parts add.',
);
sections[3].quickCheck = quick(
  'Which Jacobian acts first on an input displacement in F composed with G?',
  ['The inner map G', 'The outer map F'],
  0,
  'The displacement first passes through the derivative of G, which appears on the right.',
);
sections[0].review = [
  q(
    'Given gradient (4,-1) and path velocity (2,3), find the output rate.',
    'The dot product is 8-3=5.',
    exact(5),
  ),
  q(
    'For $z=xy$, x=t and y=3t, find dz/dt.',
    'Substitution gives 3t squared, so the derivative is 6t.',
    expr('6*t', ['t']),
  ),
  q(
    'Explain why a partial derivative can differ from a path derivative.',
    'A partial holds other inputs fixed; a path may move them too.',
  ),
];
sections[1].review = [
  q('Let u=s+t,v=2s-t,z=u+3v. Find z_s.', 'Add paths:1+3(2)=7.', exact(7)),
  q('For u=s+t,v=2s-t,z=u+3v, find z_t.', 'Add paths:1-3=-2.', exact(-2)),
  q(
    'A shared parameter feeds two loss terms. Should both derivative contributions be included?',
    'Yes; differentiation of their sum adds both contributions.',
    truth(true),
    'interpret',
  ),
];
sections[2].review = [
  q(
    'A function has four inputs and two outputs. Give Jacobian dimensions as (rows,columns).',
    'Rows count outputs and columns count inputs: (2,4).',
    tuple([2, 4]),
  ),
  q(
    'For $F(x,y)=(x+y,2x-y)$, give the first Jacobian row.',
    'The derivatives are (1,1).',
    tuple([1, 1]),
  ),
  q('For $F(x,y)=(x+y,2x-y)$, give the second row.', 'The derivatives are (2,-1).', tuple([2, -1])),
];
sections[3].review = [
  q(
    'G maps two inputs to three intermediates; F maps three intermediates to one output. Give composition-Jacobian dimensions.',
    'The product is one-by-two.',
    tuple([1, 2]),
  ),
  q(
    'For $G(t)=(t,t^2)$ and $F(x,y)=x+y$, find the composition derivative.',
    'It is 1+2t.',
    expr('1+2*t', ['t']),
  ),
  q(
    'Explain where to evaluate the outer Jacobian.',
    'At the intermediate value G of the original input, since that is the input received by F.',
  ),
];
sections[4].review = [
  q(
    'For $H=x^2+y^2-25$, find the implicit y slope at (3,4).',
    'It is -2x/(2y)=-3/4.',
    exact('-3/4'),
  ),
  q(
    'For data x=3,y=4 and parameters w=1,b=0, find the w derivative of half squared residual.',
    'The residual is -1, so the derivative is -3.',
    exact(-3),
  ),
  q(
    'For those explicit data x=3,y=4,w=1,b=0, find the b derivative of half squared residual.',
    'The b derivative is the residual, -1.',
    exact(-1),
  ),
];
const jacobianSource = {
  id: 'calculus-mml-jacobian',
  source: 'mml',
  locator: '§5.3 pp.149–154, Definition5.6 and Example5.10 (PDF pp.155–160)',
  url: 'https://mml-book.github.io/book/mml-book.pdf#page=156',
  supports:
    'Jacobian output-row/input-column dimensions and matrix chain rule. This lesson writes scalar gradients as columns, the transpose of the book’s scalar derivative row.',
};
for (const i of [2, 3, 4]) sections[i].sources.push(jacobianSource);
export default {
  number: 18,
  slug: 'calculus-multivariable-chain-rule',
  title: 'Multivariable Chain Rule and Jacobians',
  intro:
    'Many useful models are compositions: parameters produce predictions, predictions produce errors, and errors produce an objective. The multivariable chain rule tracks how a change passes through those stages. This lesson connects scalar dependency paths to matrix multiplication and keeps the evaluation points visible.',
  sections,
};
