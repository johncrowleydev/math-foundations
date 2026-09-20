import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  tuple,
  truth,
  grid,
  quick,
} from './helpers.mjs';
const pmf = citation(
  'pn-5-1-1',
  'pishro-nik',
  '§5.1.1 Joint Probability Mass Function',
  'https://www.probabilitycourse.com/chapter5/5_1_1_joint_pmf.php',
  'Joint PMFs, event sums, and marginal distributions.',
);
const disc = citation(
  'pn-5-1-3',
  'pishro-nik',
  '§5.1.3 Conditioning and Independence',
  'https://www.probabilitycourse.com/chapter5/5_1_3_conditioning_independence.php',
  'Conditional PMFs, independence, and reconstructing joint probabilities.',
);
const pdf = citation(
  'pn-5-2-1',
  'pishro-nik',
  '§5.2.1 Joint Probability Density Function',
  'https://www.probabilitycourse.com/chapter5/5_2_1_joint_pdf.php',
  'Joint densities, normalization, marginal integration, and region probabilities.',
);
const cond = citation(
  'pn-5-2-3',
  'pishro-nik',
  '§5.2.3 Conditioning and Independence',
  'https://www.probabilitycourse.com/chapter5/5_2_3_conditioning_independence.php',
  'Truncation, conditional densities, positive-density denominators, and independence.',
);
const cdf = citation(
  'pn-5-2-2',
  'pishro-nik',
  '§5.2.2 Joint Cumulative Distribution Function',
  'https://www.probabilitycourse.com/chapter5/5_2_2_joint_cdf.php',
  'Joint CDFs, rectangular inclusion-exclusion, and mixed derivatives.',
);
const table = r`The joint PMF has rows $X=0,1$ and columns $Y=0,1,2$, with entries $\begin{pmatrix}1/10&2/10&1/10\\2/10&1/10&3/10\end{pmatrix}$.`;
const s1 = section(
  'A joint table retains how variables occur together',
  r`Two measurements on the same outcome need a joint model. Knowing how often a request is slow and how often it fails does not reveal how often it is both slow and failed. A **joint PMF** records $p_{X,Y}(x,y)=P(X=x,Y=y)$; the comma means both events occur. Every cell is nonnegative and the total over all cells is one.

As an original example, use rows $X=0,1$ and columns $Y=0,1,2$ with joint PMF $\begin{pmatrix}1/10&2/10&1/10\\2/10&1/10&3/10\end{pmatrix}$. The probability of $X=1$ and $Y\ge1$ is $1/10+3/10=2/5$. The event $X+Y=2$ selects cells $(0,2)$ and $(1,1)$, giving $1/5$. Translate the event into cells before adding; a rectangular region is only one possible event shape.

A **marginal distribution** ignores one coordinate by summing over it: $p_X(x)=\sum_y p_{X,Y}(x,y)$ and $p_Y(y)=\sum_x p_{X,Y}(x,y)$. Here the row sums are $(2/5,3/5)$ and the column sums are $(3/10,3/10,2/5)$. These sums are the probability version of eliminating a coordinate, not selecting its zero value.

The joint distribution determines the marginals, but the marginals generally do not determine the joint distribution. Two fair binary variables could always agree, always disagree, or be independent, while each remains marginally Bernoulli with parameter one half. The coupling between coordinates is extra information. In particular, the number of rows and columns alone does not justify equal cell probabilities.

Expectations of functions of the pair can be computed directly: $E[g(X,Y)]=\sum_x\sum_y g(x,y)p_{X,Y}(x,y)$ when the expectation exists. For an event indicator, this weighted sum reduces to adding exactly the cells in that event.`,
  [pmf, disc],
  [
    termEntry(
      'joint-pmf',
      'Joint PMF',
      'Probabilities of simultaneous values of discrete variables.',
      r`$p_{X,Y}(x,y)=P(X=x,Y=y)$, with all cell probabilities summing to one.`,
      r`For fair independent bits, each of the four pairs has probability $1/4$.`,
      `Marginal probabilities alone do not specify the joint PMF.`,
    ),
    termEntry(
      'marginal-distribution',
      'Marginal distribution',
      'The distribution of one coordinate after summing or integrating out the other.',
      r`$p_X(x)=\sum_y p_{X,Y}(x,y)$ in the discrete case.`,
      r`A row sum gives $P(X=x)$ when rows index $X$.`,
      `Marginalizing is not conditioning on a particular value.`,
    ),
  ],
);
s1.questions = [
  q(table + r` Find $P(X=0)$.`, r`Add the first row: $(1+2+1)/10=2/5$.`, exact('2/5')),
  q(table + r` Find $P(Y=2)$.`, r`Add the last column: $(1+3)/10=2/5$.`, exact('2/5')),
  q(table + r` Find $P(X=1,Y\ge1)$.`, r`The selected cells total $1/10+3/10=2/5$.`, exact('2/5')),
  q(
    table + r` Find $P(X+Y=1)$.`,
    r`Cells $(0,1)$ and $(1,0)$ contribute $2/10+2/10=2/5$.`,
    exact('2/5'),
  ),
  q(
    table + r` Find $P(X=Y)$.`,
    r`Cells $(0,0)$ and $(1,1)$ contribute $1/10+1/10=1/5$.`,
    exact('1/5'),
  ),
  q(
    table + r` Give the marginal probabilities for $Y=0,1,2$ in that order.`,
    r`The column sums are $(3/10,3/10,2/5)$.`,
    tuple(['3/10', '3/10', '2/5']),
  ),
  q(table + r` Find $E[Y]$.`, r`$0(3/10)+1(3/10)+2(2/5)=11/10$.`, exact('11/10')),
  q(
    r`Fair binary variables always agree. Fill the joint table with rows $X=0,1$ and columns $Y=0,1$.`,
    r`The only possible pairs are $(0,0)$ and $(1,1)$, each with probability $1/2$. The table is $\begin{pmatrix}1/2&0\\0&1/2\end{pmatrix}$.`,
    grid(
      ['X = 0', 'X = 1'],
      ['Y = 0', 'Y = 1'],
      [
        ['1/2', '0'],
        ['0', '1/2'],
      ],
    ),
  ),
  q(
    r`Construct two different joint PMFs having fair binary marginals.`,
    r`The diagonal table $\begin{pmatrix}1/2&0\\0&1/2\end{pmatrix}$ and the independent table $\begin{pmatrix}1/4&1/4\\1/4&1/4\end{pmatrix}$ have the same row and column sums but different dependence.`,
    undefined,
    'construct',
  ),
  q(
    r`Explain why summing a row yields a marginal probability.`,
    r`The cells in a row are disjoint cases for the other variable, and their union is the event specifying that row's value of $X$. Additivity therefore gives $P(X=x)$.`,
  ),
];
s1.review = [
  q(
    r`A joint PMF with rows $X=0,1$ and columns $Y=0,1$ is $\begin{pmatrix}1/8&3/8\\1/4&1/4\end{pmatrix}$. Find $P(Y=1)$.`,
    r`$3/8+1/4=5/8$.`,
    exact('5/8'),
  ),
  q(
    r`For the joint PMF $\begin{pmatrix}1/8&3/8\\1/4&1/4\end{pmatrix}$ on binary rows and columns, find $P(X\ne Y)$.`,
    r`The off-diagonal cells sum to $3/8+1/4=5/8$.`,
    exact('5/8'),
  ),
  q(
    r`Fair binary variables always disagree. Fill their joint table with rows and columns ordered $0,1$.`,
    r`The table is $\begin{pmatrix}0&1/2\\1/2&0\end{pmatrix}$ because exactly one variable is one.`,
    grid(
      ['X = 0', 'X = 1'],
      ['Y = 0', 'Y = 1'],
      [
        ['0', '1/2'],
        ['1/2', '0'],
      ],
    ),
  ),
];
const s2 = section(
  'Condition a table and test independence',
  r`Conditioning narrows the population of possible outcomes and renormalizes the retained probabilities. For a discrete value with $p_X(x)>0$, $p_{Y\mid X}(y\mid x)=p_{X,Y}(x,y)/p_X(x)$. In a row-indexed table, divide each entry of the retained row by that row's sum. The resulting conditional PMF sums to one. Conditioning on a value with zero marginal probability is not defined by this ratio.

Using the six-cell table from the preceding section, the row for $X=1$ totals $3/5$. The conditional probabilities of $Y=0,1,2$ are consequently $(1/3,1/6,1/2)$. The distribution differs from the marginal $(3/10,3/10,2/5)$, so knowing $X=1$ changes the probability model for $Y$.

Independence requires $p_{X,Y}(x,y)=p_X(x)p_Y(y)$ for every pair. One failed equality proves dependence; one successful equality does not generally prove independence. In the example, $p(1,2)=3/10$ differs from $(3/5)(2/5)=6/25$. Zero cells matter too: if both marginals are positive at a pair, independence would assign that pair positive probability.

You can also build a joint model from a marginal and conditional PMFs using $p_{X,Y}(x,y)=p_X(x)p_{Y\mid X}(y\mid x)$. Suppose a load indicator is one with probability $1/4$, and the conditional failure probabilities are $1/10$ at low load and $1/2$ at high load. The joint high-load/failure probability is $(1/4)(1/2)=1/8$. The overall failure probability combines both paths: $(3/4)(1/10)+(1/4)(1/2)=1/5$.

This construction formalizes different operating regimes without assuming independence. It also separates the probability of a regime from the behavior within it. Reversing the conditioning requires dividing the joint probability by the new conditioning marginal; one cannot simply reverse the vertical bar.

In the load example, the probability of high load given failure is $(1/8)/(1/5)=5/8$. This exceeds the prior high-load probability $1/4$, because failures are more common under high load. The conditional failure rate $1/2$ and the posterior high-load probability $5/8$ answer different questions even though they refer to the same joint cell.`,
  [disc, pmf],
  [
    termEntry(
      'conditional-pmf',
      'Conditional PMF',
      'A discrete distribution within a specified positive-probability condition.',
      r`$p_{Y\mid X}(y\mid x)=p_{X,Y}(x,y)/p_X(x)$ when $p_X(x)>0$.`,
      r`A row of joint probabilities is normalized by its row total.`,
      `A joint table row usually sums to less than one; its conditional version sums to one.`,
    ),
  ],
);
s2.questions = [
  q(table + r` Find $P(Y=2\mid X=1)$.`, r`Divide $3/10$ by $6/10$ to obtain $1/2$.`, exact('1/2')),
  q(table + r` Find $P(X=1\mid Y=2)$.`, r`Divide $3/10$ by $4/10$ to obtain $3/4$.`, exact('3/4')),
  q(
    table + r` Give the conditional PMF of $Y=0,1,2$ given $X=0$.`,
    r`Divide the first row by $4/10$ to get $(1/4,1/2,1/4)$.`,
    tuple(['1/4', '1/2', '1/4']),
  ),
  q(
    table + r` Are $X$ and $Y$ independent? Answer true or false.`,
    r`False. $P(Y=2\mid X=1)=1/2$ differs from $P(Y=2)=2/5$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Independent bits have $P(X=1)=1/3$ and $P(Y=1)=1/4$. Fill their joint table with rows and columns ordered $0,1$.`,
    r`Multiply marginal probabilities to get $\begin{pmatrix}1/2&1/6\\1/4&1/12\end{pmatrix}$.`,
    grid(
      ['X = 0', 'X = 1'],
      ['Y = 0', 'Y = 1'],
      [
        ['1/2', '1/6'],
        ['1/4', '1/12'],
      ],
    ),
  ),
  q(
    r`A high-load regime has probability $1/4$. Failure probabilities given low and high load are $1/10$ and $1/2$. Find overall failure probability.`,
    r`$(3/4)(1/10)+(1/4)(1/2)=3/40+5/40=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`In that two-regime model, high load has probability $1/4$, and failure probabilities are $1/10$ at low load and $1/2$ at high load. Find the probability of high load given failure.`,
    r`The joint high-load/failure probability is $1/8$, and overall failure probability is $1/5$. Their ratio is $5/8$.`,
    exact('5/8'),
  ),
  q(
    r`If independent variables satisfy $P(X=0)=2/5$ and $P(Y=0)=1/3$, find $P(X=0,Y=0)$.`,
    r`Independence gives $(2/5)(1/3)=2/15$.`,
    exact('2/15'),
  ),
  q(
    r`Explain why dividing an entire joint table by one row sum does not produce the conditional PMF given that row.`,
    r`Conditioning first discards outcomes outside the row. Dividing all cells retains forbidden outcomes and generally produces total mass greater than one.`,
  ),
  q(
    r`If $P(X=0)>0$, $P(Y=0)>0$, and $P(X=0,Y=0)=0$, prove the variables are dependent.`,
    r`Independence would require $P(X=0,Y=0)=P(X=0)P(Y=0)>0$, contradicting the zero joint probability.`,
    undefined,
    'prove',
  ),
];
s2.review = [
  q(
    r`For binary joint table $\begin{pmatrix}1/8&3/8\\1/4&1/4\end{pmatrix}$, find $P(X=0\mid Y=1)$.`,
    r`$(3/8)/(5/8)=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`For binary joint table $\begin{pmatrix}1/8&3/8\\1/4&1/4\end{pmatrix}$, find $P(Y=0\mid X=1)$.`,
    r`$(1/4)/(1/2)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Independent bits each have success probability $1/3$. Find the probability that both are zero.`,
    r`$(2/3)(2/3)=4/9$.`,
    exact('4/9'),
  ),
];
s2.quickCheck = quick(
  r`How do you obtain $P(Y=y\mid X=x)$ from a joint table with rows indexed by $X$?`,
  [
    `Divide the selected cell by its row total.`,
    `Divide the selected cell by its column total.`,
    `Use the selected cell without normalization.`,
  ],
  0,
  `The conditioning event determines the denominator.`,
  [
    `Correct. The row total is $P(X=x)$, provided it is positive.`,
    r`This reverses the conditioning and instead gives $P(X=x\mid Y=y)$.`,
    `The cell is a joint probability; a conditional PMF must sum to one over the retained row.`,
  ],
);
const s3 = section(
  'A joint density assigns probability to regions',
  r`For a jointly continuous pair, probability is a double integral: $P((X,Y)\in A)=\iint_A f_{X,Y}(x,y)\,dx\,dy$. The joint density is nonnegative and integrates to one over the plane. Its units are reciprocal units of both coordinates. Small rectangular probabilities are approximately density times the two side lengths, when the density varies little across the rectangle.

Reuse the region-integration skills from calculus. If $f(x,y)=4xy$ on the unit square and zero elsewhere, normalization is $\int_0^1\int_0^1 4xy\,dy\,dx=1$. The lower-left half-by-half square has probability $(1/2)^4=1/16$. A request involving $X+Y<1$ is triangular, not rectangular: integrate $x$ from zero to one and $y$ from zero to $1-x$. The result is $\int_0^1 2x(1-x)^2\,dx=1/6$.

Marginalization integrates out the unwanted coordinate. In the square example, $f_X(x)=\int_0^14xy\,dy=2x$ on $(0,1)$, and similarly $f_Y(y)=2y$. This step is not the same as evaluating the joint density on an axis; $f(x,0)=0$ tells us nothing about the entire vertical slice's area.

Joint expectations use the same region and weighting: $E[g(X,Y)]=\iint g(x,y)f_{X,Y}(x,y)\,dx\,dy$ when integrable. In the square model, $E[XY]=\int_0^1\int_0^1 4x^2y^2\,dy\,dx=4/9$. This is a weighted integral over outcomes, not the value of the density at the two separate means.

Support geometry can determine the bounds. Consider the uniform density $2$ on the triangle $0<x<y<1$, zero elsewhere. For fixed $x$, $y$ ranges from $x$ to one, yielding $f_X(x)=2(1-x)$. For fixed $y$, $x$ ranges from zero to $y$, yielding $f_Y(y)=2y$. The variables have different marginals despite the constant joint density. The triangular constraint makes larger values of $Y$ more compatible with larger values of $X$.

Write the density as zero outside its support, draw the region, and intersect the event with that support before integrating. Reversing integration order changes the bounds, not the probability. A correct final number should lie in $[0,1]$, but that check alone cannot validate incorrect bounds.`,
  [pdf],
  [
    termEntry(
      'joint-density',
      'Joint density',
      'Probability per unit area in a pair of continuous coordinates.',
      r`$P((X,Y)\in A)=\iint_A f_{X,Y}(x,y)\,dx\,dy$.`,
      r`Density $2$ on $0<x<y<1$ integrates to one.`,
      `A constant density over a nonrectangular region need not make its coordinates independent.`,
    ),
  ],
);
s3.questions = [
  q(
    r`Find $c$ so that $f(x,y)=c$ on $0<x<2,0<y<3$, zero elsewhere, is a joint density.`,
    r`The rectangle has area six, so $6c=1$ and $c=1/6$.`,
    exact('1/6'),
  ),
  q(
    r`For density $4xy$ on the unit square, find $P(X<1/2,Y<1/2)$.`,
    r`$\int_0^{1/2}\int_0^{1/2}4xy\,dy\,dx=1/16$.`,
    exact('1/16'),
  ),
  q(
    r`For density $4xy$ on the unit square, give $f_X(x)$ for $0<x<1$.`,
    r`Integrating out $y$ gives $f_X(x)=\int_0^14xy\,dy=2x$.`,
    calc('2*x', ['x']),
  ),
  q(
    r`For density $4xy$ on the unit square, find $P(X+Y<1)$.`,
    r`$\int_0^1\int_0^{1-x}4xy\,dy\,dx=\int_0^12x(1-x)^2\,dx=1/6$.`,
    exact('1/6'),
  ),
  q(
    r`Normalize constant density $c$ on $0<x<y<1$.`,
    r`The triangle has area $1/2$, so $c=2$.`,
    exact('2'),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, give $f_X(x)$ on $0<x<1$.`,
    r`$\int_x^12\,dy=2(1-x)$.`,
    calc('2*(1-x)', ['x']),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, give $f_Y(y)$ on $0<y<1$.`,
    r`$\int_0^y2\,dx=2y$.`,
    calc('2*y', ['y']),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(Y<1/2)$.`,
    r`Integrate the marginal: $\int_0^{1/2}2y\,dy=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(X>1/2)$.`,
    r`$\int_{1/2}^12(1-x)\,dx=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Explain why integrating the density $2$ over the whole unit square is wrong for the model supported on $0<x<y<1$.`,
    r`The density is zero outside the triangle. Integrating the nonzero formula across the square includes impossible pairs and gives mass two instead of one.`,
  ),
];
s3.review = [
  q(
    r`Normalize constant density on $0<x<y<2$.`,
    r`The triangular area is two, so the constant is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For density $1/2$ on $0<x<y<2$, find $P(Y<1)$.`,
    r`The subtriangle has area $1/2$, so its probability is $(1/2)(1/2)=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`For density $6xy^2$ on the unit square, give $f_Y(y)$ on $0<y<1$.`,
    r`$\int_0^16xy^2\,dx=3y^2$.`,
    calc('3*y^2', ['y']),
  ),
];
const s4 = section(
  'Condition continuous variables using densities',
  r`Observing one continuous coordinate changes the distribution of the other. At a value with $f_X(x)>0$, define $f_{Y\mid X}(y\mid x)=f_{X,Y}(x,y)/f_X(x)$. The denominator is a marginal **density**, not $P(X=x)$, which is zero in this model. At zero marginal density this ratio is unavailable; its value there is not determined by this formula.

The ratio can be understood by conditioning on a thin vertical strip around $x$. The strip's total probability is approximately $f_X(x)\Delta x$. Its intersection with a small interval near $y$ has probability approximately $f_{X,Y}(x,y)\Delta x\Delta y$. Divide, cancel $\Delta x$, and then interpret the coefficient of $\Delta y$ as a conditional density. This limiting explanation connects continuous conditioning with the ordinary positive-probability event rule.

For density $2$ on $0<x<y<1$, the marginal is $f_X(x)=2(1-x)$. Therefore $Y\mid X=x$ is uniform on $(x,1)$, with density $1/(1-x)$ there. At $x=1/4$, the conditional chance that $Y>1/2$ is the retained length $1/2$ divided by the total length $3/4$, giving $2/3$. In the other direction, $X\mid Y=y$ is uniform on $(0,y)$ with density $1/y$. These are different conditional distributions.

A conditional density must integrate to one over its conditional support. The support is as important as the algebraic expression: $1/(1-x)$ integrated over $(0,1)$ is generally not one, while over $(x,1)$ it is. Keeping the conditioning value fixed clarifies which symbol is the integration variable.

Conditioning on an interval of values still uses an ordinary ratio of event probabilities. For example, $P(Y>1/2\mid X<1/4)$ requires integrating over a two-dimensional region before dividing by $P(X<1/4)$. It is generally not the same as substituting $x=1/4$ into a conditional density, because it averages over many possible values of $X$.`,
  [cond, pdf],
  [
    termEntry(
      'conditional-density',
      'Conditional density',
      'A density for one variable when another is specified.',
      r`$f_{Y\mid X}(y\mid x)=f_{X,Y}(x,y)/f_X(x)$ where $f_X(x)>0$.`,
      r`Under density $2$ on $0<x<y<1$, $Y\mid X=x$ is uniform on $(x,1)$.`,
      `The denominator is a density, not the zero point probability $P(X=x)$.`,
    ),
  ],
);
s4.questions = [
  q(
    r`For density $2$ on $0<x<y<1$, give $f_{Y\mid X}(y\mid x)$ on $x<y<1$, for fixed $0<x<1$.`,
    r`Divide by $f_X(x)=2(1-x)$ to get $1/(1-x)$.`,
    calc('1/(1-x)', ['x', 'y'], { positive: ['1-x'] }),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, give $f_{X\mid Y}(x\mid y)$ on $0<x<y$, for fixed $0<y<1$.`,
    r`Divide by $f_Y(y)=2y$ to get $1/y$.`,
    calc('1/y', ['x', 'y'], { positive: ['y'] }),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(Y>1/2\mid X=1/4)$.`,
    r`The conditional distribution is uniform on $(1/4,1)$, giving $(1/2)/(3/4)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(X<1/4\mid Y=1/2)$.`,
    r`The conditional distribution is uniform on $(0,1/2)$, giving $(1/4)/(1/2)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(Y<X\mid X=1/3)$.`,
    r`The conditional support is $1/3<Y<1$, so $Y<X$ is impossible and its probability is zero.`,
    exact('0'),
  ),
  q(
    r`For density $x+y$ on the unit square, give $f_X(x)$ on $0<x<1$.`,
    r`$\int_0^1(x+y)\,dy=x+1/2$.`,
    calc('x+1/2', ['x']),
  ),
  q(
    r`For density $x+y$ on the unit square, give $f_{Y\mid X}(y\mid x)$ for $0<x,y<1$.`,
    r`Normalize the slice: $(x+y)/(x+1/2)$.`,
    calc('(x+y)/(x+1/2)', ['x', 'y'], { positive: ['x+1/2'] }),
  ),
  q(
    r`For density $x+y$ on the unit square, find $P(Y<1/2\mid X=1/2)$.`,
    r`At $x=1/2$ the conditional density is $1/2+y$. Its integral from zero to $1/2$ is $1/4+1/8=3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Explain why $P(Y>1/2\mid X=1/4)$ is not computed by dividing by $P(X=1/4)$ for a jointly continuous pair.`,
    r`The denominator would be zero. A conditional density is defined using the joint-to-marginal density ratio, motivated by shrinking positive-probability strips.`,
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(Y>1/2\mid X<1/4)$.`,
    r`The numerator is the rectangle integral $2(1/4)(1/2)=1/4$. The denominator is $\int_0^{1/4}2(1-x)\,dx=7/16$. The ratio is $4/7$.`,
    exact('4/7'),
  ),
];
s4.review = [
  q(
    r`For density $2$ on $0<x<y<1$, find $P(Y>3/4\mid X=1/2)$.`,
    r`The conditional uniform interval is $(1/2,1)$, so the probability is $(1/4)/(1/2)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`For density $2$ on $0<x<y<1$, find $P(X<1/2\mid Y=3/4)$.`,
    r`Under the uniform $(0,3/4)$ conditional distribution, the probability is $(1/2)/(3/4)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For density $x+y$ on the unit square, find $P(X<1/2\mid Y=1/4)$.`,
    r`The numerator integral is $1/8+1/8=1/4$ and the marginal density is $3/4$, giving $1/3$.`,
    exact('1/3'),
  ),
];
const s5 = section(
  'Check the whole joint model',
  r`For jointly continuous variables, independence means that the joint density factors into the two marginal densities almost everywhere: $f_{X,Y}(x,y)=f_X(x)f_Y(y)$. Here “almost everywhere” allows differences on sets of area zero, which do not change probabilities. For the piecewise smooth examples in this subject, check the formula throughout each region where probability is accumulated, including the support restrictions.

The density $4xy$ on the unit square factors as $(2x)(2y)$ with both marginal factors supported on $(0,1)$, so the coordinates are independent. By contrast, constant density $2$ on $0<x<y<1$ does not describe independent coordinates. The formula looks separable, but the triangular support is not. A pair with $x>y$ is impossible even though both marginal densities are positive at many such coordinates.

A joint CDF unifies discrete and continuous descriptions: $F(x,y)=P(X\le x,Y\le y)$. It accumulates over a lower-left region. For density $4xy$ on the unit square, $F(x,y)=x^2y^2$ within the square, with appropriate zero or marginal extensions outside. Where smoothness permits, differentiating once in each coordinate recovers the joint density.

Outside the square, the same CDF must respect the support. For example, $F(2,y)=y^2$ when $0<y<1$, since the condition $X\le2$ includes all possible $X$. If either threshold is negative, the joint CDF is zero. Extending the interior formula $x^2y^2$ to all real pairs would violate these probability constraints.

Rectangle probabilities require two-dimensional inclusion–exclusion. For $a<b$ and $c<d$, $P(a<X\le b,c<Y\le d)=F(b,d)-F(a,d)-F(b,c)+F(a,c)$. The last term restores the lower-left overlap that was subtracted twice. Independence would simplify the answer into a product, but the four-CDF formula does not require independence.

Finally, continuous marginals do not guarantee a two-dimensional density. If $X$ is uniform on $(0,1)$ and $Y=X$, both marginals have densities, yet the entire joint probability sits on a diagonal line of area zero. An ordinary joint density cannot assign probability one to that line. Joint modeling requires attention to how variables are related, not merely a label attached to each marginal.`,
  [cond, cdf, pdf],
  [
    termEntry(
      'joint-cdf',
      'Joint CDF',
      'Probability that both coordinates lie below their thresholds.',
      r`$F(x,y)=P(X\le x,Y\le y)$.`,
      r`For independent uniform coordinates on $(0,1)$, $F(x,y)=xy$ inside the square.`,
      `Rectangle probabilities need four CDF terms, not just two.`,
    ),
  ],
);
s5.questions = [
  q(
    r`True or false: density $4xy$ on the unit square, zero elsewhere, gives independent coordinates.`,
    r`True. It is the product of the marginal densities $2x$ and $2y$, each on $(0,1)$.`,
    truth(true),
    'interpret',
  ),
  q(
    r`True or false: density $2$ on $0<x<y<1$, zero elsewhere, gives independent coordinates.`,
    r`False. The triangular support excludes pairs with $x>y$ where both marginals are positive.`,
    truth(false),
    'interpret',
  ),
  q(
    r`For density $4xy$ on the unit square, give the joint CDF inside the square.`,
    r`$\int_0^x\int_0^y4uv\,dv\,du=x^2y^2$.`,
    calc('x^2*y^2', ['x', 'y']),
  ),
  q(
    r`For joint CDF $F(x,y)=x^2y^3$ on the unit square, give the joint density in its interior.`,
    r`The mixed derivative is $\partial^2F/(\partial x\partial y)=6xy^2$.`,
    calc('6*x*y^2', ['x', 'y']),
  ),
  q(
    r`Suppose $F(b,d)=4/5,F(a,d)=1/5,F(b,c)=3/10,F(a,c)=1/10$, with $a<b,c<d$. Find the probability of $(a,b]\times(c,d]$.`,
    r`Inclusion–exclusion gives $4/5-1/5-3/10+1/10=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`For independent uniform $(0,1)$ variables, find $P(X<1/3,Y>1/2)$.`,
    r`Multiply the event probabilities: $(1/3)(1/2)=1/6$.`,
    exact('1/6'),
  ),
  q(
    r`For independent uniform $(0,1)$ variables, find $P(X+Y<1)$.`,
    r`The region is a triangle of area $1/2$ under density one, so the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`True or false: continuous marginal distributions ensure a joint density exists.`,
    r`False. For $Y=X$ with continuous $X$, joint probability is concentrated on a line.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why a factorized algebraic density formula is insufficient to establish independence unless support is also checked.`,
    r`The full density includes its zero region. A nonrectangular support can couple the variables even when the positive formula has separate factors. Independence requires factorization of the entire distribution.`,
  ),
  q(
    r`Derive the four-term rectangle formula using event subtraction.`,
    r`Begin with the lower-left region ending at $(b,d)$. Subtract portions ending at $(a,d)$ and $(b,c)$. Their overlap ending at $(a,c)$ was removed twice, so add it once. This leaves exactly $(a,b]\times(c,d]$.`,
    undefined,
    'prove',
  ),
];
s5.review = [
  q(
    r`For joint CDF $F(x,y)=x^3y^2$ on the unit square, find $F(1/2,1/2)$.`,
    r`$(1/2)^3(1/2)^2=1/32$.`,
    exact('1/32'),
  ),
  q(
    r`For independent uniform $(0,2)$ variables, find $P(X>1,Y>3/2)$.`,
    r`The marginal probabilities are $1/2$ and $1/4$, so their product is $1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Suppose the four rectangle CDF terms $F(b,d),F(a,d),F(b,c),F(a,c)$ are $9/10,2/5,1/2,1/5$. Find the rectangle probability.`,
    r`$9/10-2/5-1/2+1/5=1/5$.`,
    exact('1/5'),
  ),
];
s5.quickCheck = quick(
  r`Why are coordinates under uniform density on $0<x<y<1$ dependent?`,
  [
    `The density is greater than one.`,
    `The support restricts one coordinate according to the other.`,
    `All continuous variables are dependent.`,
  ],
  1,
  `The triangular support rules out combinations that independent marginals would allow.`,
  [
    `Joint density height can exceed one; only its integrated probability is bounded by one.`,
    `Correct. Knowing one coordinate changes the possible interval for the other.`,
    `Independent continuous variables exist, for example independent uniform coordinates on a square.`,
  ],
);
export default lesson(
  11,
  'joint-conditional-distributions',
  'Joint and Conditional Distributions',
  r`A joint distribution records how quantities vary together. We move from finite probability tables to double integrals, then use marginalization, conditioning, and independence to read and construct complete models.`,
  [s1, s2, s3, s4, s5],
);
