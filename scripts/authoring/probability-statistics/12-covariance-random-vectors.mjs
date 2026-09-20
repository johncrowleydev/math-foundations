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
const cov = citation(
  'pn-5-3-1',
  'pishro-nik',
  '§5.3.1 Covariance and Correlation',
  'https://www.probabilitycourse.com/chapter5/5_3_1_covariance_correlation.php',
  'Covariance identities, correlation, variance of sums, and uncorrelated versus independent variables.',
);
const vectors = citation(
  'pn-6-1-5',
  'pishro-nik',
  '§6.1.5 Random Vectors',
  'https://www.probabilitycourse.com/chapter6/6_1_5_random_vectors.php',
  'Mean vectors, covariance matrices, affine transformations, positive semidefiniteness, and singular dependence.',
);
const s1 = section(
  'Covariance measures centered co-variation',
  r`Separate variances describe the spread of two variables, but they do not reveal whether their deviations tend to have the same sign. For variables with finite second moments, define $\operatorname{Cov}(X,Y)=E[(X-E[X])(Y-E[Y])]$. The product is positive when both variables are above their means or both are below, and negative when their centered deviations oppose each other. Covariance averages that product across the joint distribution.

Expanding the product and using linearity yields the computational identity $\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]$. The expectation $E[XY]$ generally needs joint information. Replacing it with $E[X]E[Y]$ without a reason assumes away the dependence we are trying to measure.

For an original binary example, let $p(0,0)=3/8$, $p(0,1)=1/8$, $p(1,0)=1/8$, and $p(1,1)=3/8$. Both means are $1/2$, while $E[XY]=P(X=1,Y=1)=3/8$. Thus the covariance is $3/8-1/4=1/8$. Agreement is favored, producing positive centered co-variation. If the diagonal and off-diagonal probabilities are exchanged, covariance becomes negative while the marginals remain unchanged.

Covariance has the product of the variables' units. If one variable is measured in seconds and another in bytes, their covariance is in second-bytes. Translating either variable by a constant changes neither centered deviations nor covariance. Scaling gives $\operatorname{Cov}(aX+b,cY+d)=ac\operatorname{Cov}(X,Y)$. A negative scaling reverses its sign; a positive unit conversion changes its numerical magnitude.

Special cases connect the new quantity to familiar ones: $\operatorname{Cov}(X,X)=\operatorname{Var}(X)$, and covariance with a constant is zero. Independence implies zero covariance when second moments are finite, because the joint expectation factors. The reverse implication requires separate examination; covariance records only a particular aspect of dependence.

The finite-moment assumption is substantive. If one or both required second moments diverge, the familiar covariance algebra may not be available, even when a drawing suggests a trend. In this subject, check moment existence before manipulating expectations of products. Under finite second moments, the product is integrable, so the centered and expanded formulas agree.`,
  [cov],
  [
    termEntry(
      'covariance',
      'Covariance',
      'The expected product of centered deviations.',
      r`$\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]$ for finite second moments.`,
      r`For fair bits with joint success probability $3/8$, covariance is $1/8$.`,
      `Zero covariance does not generally establish independence.`,
    ),
  ],
);
s1.questions = [
  q(r`If $E[X]=2,E[Y]=3,E[XY]=8$, find $\operatorname{Cov}(X,Y)$.`, r`$8-2(3)=2$.`, exact('2')),
  q(r`If $E[X]=-1,E[Y]=4,E[XY]=-6$, find the covariance.`, r`$-6-(-1)(4)=-2$.`, exact('-2')),
  q(
    r`If $\operatorname{Var}(X)=5$, find $\operatorname{Cov}(X,X)$.`,
    r`Covariance with itself is variance, so the result is $5$.`,
    exact('5'),
  ),
  q(
    r`If $\operatorname{Cov}(X,Y)=3$, find $\operatorname{Cov}(2X+7,4Y-1)$.`,
    r`Translations disappear and scaling gives $2(4)(3)=24$.`,
    exact('24'),
  ),
  q(
    r`If $\operatorname{Cov}(X,Y)=3$, find $\operatorname{Cov}(-2X,Y+9)$.`,
    r`$(-2)(1)(3)=-6$.`,
    exact('-6'),
  ),
  q(
    r`For fair binary marginals with $P(X=1,Y=1)=3/8$, find the covariance.`,
    r`$E[XY]-E[X]E[Y]=3/8-1/4=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`For fair binary marginals with $P(X=1,Y=1)=1/8$, find the covariance.`,
    r`$1/8-1/4=-1/8$.`,
    exact('-1/8'),
  ),
  q(
    r`Independent variables have finite second moments. Find their covariance.`,
    r`Independence gives $E[XY]=E[X]E[Y]$, so the covariance is $0$.`,
    exact('0'),
  ),
  q(
    r`Explain why adding a constant to $X$ does not change its covariance with $Y$.`,
    r`The mean shifts by the same constant. Thus $(X+b)-E[X+b]=X-E[X]$, leaving the centered product unchanged.`,
  ),
  q(
    r`Derive $\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]$ from the centered definition.`,
    r`Expand to $XY-XE[Y]-YE[X]+E[X]E[Y]$. Taking expectations produces $E[XY]-2E[X]E[Y]+E[X]E[Y]$, which is the stated identity.`,
    undefined,
    'prove',
  ),
];
s1.review = [
  q(
    r`If $E[X]=3,E[Y]=-2,\operatorname{Cov}(X,Y)=4$, find $E[XY]$.`,
    r`Rearrange the identity: $E[XY]=4+3(-2)=-2$.`,
    exact('-2'),
  ),
  q(
    r`If $\operatorname{Cov}(X,Y)=-2$, find $\operatorname{Cov}(3X-1,-Y+4)$.`,
    r`Multiply by $3(-1)$ to obtain $6$.`,
    exact('6'),
  ),
  q(
    r`If $X$ has finite variance, find $\operatorname{Cov}(X,12)$.`,
    r`The constant's centered deviation is zero, so the covariance is $0$.`,
    exact('0'),
  ),
];
const s2 = section(
  'Variance of a combination includes cross terms',
  r`Linearity of expectation never required independence. Variance behaves differently because it squares a centered sum. For finite second moments, $\operatorname{Var}(aX+bY)=a^2\operatorname{Var}(X)+b^2\operatorname{Var}(Y)+2ab\operatorname{Cov}(X,Y)$. Expand $[a(X-E[X])+b(Y-E[Y])]^2$ to see where each term comes from. A final added constant contributes nothing.

Suppose $\operatorname{Var}(X)=4$, $\operatorname{Var}(Y)=9$, and $\operatorname{Cov}(X,Y)=3$. Then $\operatorname{Var}(X+Y)=4+9+6=19$, while $\operatorname{Var}(X-Y)=4+9-6=7$. Positive co-variation reinforces fluctuations in a sum but cancels some fluctuation in a difference. Ignoring the covariance would incorrectly give thirteen for both.

For more variables, $\operatorname{Var}(\sum_i a_iX_i)=\sum_i a_i^2\operatorname{Var}(X_i)+2\sum_{i<j}a_ia_j\operatorname{Cov}(X_i,X_j)$. Each unordered pair appears once in the second sum, accompanied by a factor of two. Pairwise uncorrelated variables have all those covariance terms zero, which is enough for variance additivity; full independence is a stronger condition than needed for that identity.

Averages can reduce noise, but dependence limits the reduction. If two equally variable measurements have variance $v$ and covariance $c$, their average has variance $(v+c)/2$. With independent noise, $c=0$, and variance is halved. If the measurements are identical, $c=v$, and averaging produces no reduction at all. Repeating the same stored measurement is not equivalent to collecting new independent information.

Covariance also distributes over sums in either argument. For independent variables with variances one and four, $\operatorname{Cov}(X+Y,X-Y)=\operatorname{Var}(X)-\operatorname{Var}(Y)=-3$. Zero cross-covariances vanish, but the repeated appearances of each variable remain.

This distinction matters for measurements reused in several features. Even if original sensors are independent, two derived features that share a sensor can be correlated. Independence of the inputs justifies deleting cross terms between different sensors; it does not delete the variance contribution of a sensor that appears in both outputs. This provides a useful check when moving between different linear features of the same measurements.`,
  [cov],
  [
    termEntry(
      'variance-linear-combination',
      'Variance of a linear combination',
      'Variance includes both squared coefficients and covariance terms.',
      r`$\operatorname{Var}(aX+bY)=a^2\operatorname{Var}(X)+b^2\operatorname{Var}(Y)+2ab\operatorname{Cov}(X,Y)$.`,
      r`Variances four and nine with covariance three give sum variance nineteen.`,
      r`A minus sign on $Y$ changes the cross term, not $\operatorname{Var}(Y)$.`,
    ),
  ],
);
s2.questions = [
  q(
    r`Given variances $4,9$ and covariance $3$, find $\operatorname{Var}(X+Y)$.`,
    r`$4+9+2(3)=19$.`,
    exact('19'),
  ),
  q(
    r`Given variances $4,9$ and covariance $3$, find $\operatorname{Var}(X-Y)$.`,
    r`$4+9-2(3)=7$.`,
    exact('7'),
  ),
  q(
    r`Given variances $4,9$ and covariance $3$, find $\operatorname{Var}(2X-Y+5)$.`,
    r`$4(4)+9+2(2)(-1)(3)=16+9-12=13$.`,
    exact('13'),
  ),
  q(
    r`Independent variables have variances $2,5$. Find $\operatorname{Var}(3X+2Y)$.`,
    r`$9(2)+4(5)=38$.`,
    exact('38'),
  ),
  q(
    r`Two variables each have variance $9$ and covariance $3$. Find the variance of their average.`,
    r`$(9+9+2(3))/4=6$.`,
    exact('6'),
  ),
  q(
    r`If $Y=X$ and $\operatorname{Var}(X)=6$, find $\operatorname{Var}((X+Y)/2)$.`,
    r`The average equals $X$, so its variance is $6$.`,
    exact('6'),
  ),
  q(
    r`Three pairwise uncorrelated variables have variances $1,2,3$. Find the variance of their sum.`,
    r`All cross terms vanish, leaving $1+2+3=6$.`,
    exact('6'),
  ),
  q(
    r`Independent variables have variances one and four. Find $\operatorname{Cov}(X+Y,X-Y)$.`,
    r`Expand by bilinearity to $\operatorname{Var}(X)-\operatorname{Var}(Y)=1-4=-3$.`,
    exact('-3'),
  ),
  q(
    r`Explain why $\operatorname{Var}(X-Y)$ is not $\operatorname{Var}(X)-\operatorname{Var}(Y)$ even under independence.`,
    r`The coefficient of $Y$ is squared in its variance contribution. Under independence the correct value is $\operatorname{Var}(X)+\operatorname{Var}(Y)$.`,
  ),
  q(
    r`Derive the variance of the mean of $n$ pairwise uncorrelated variables each with variance $v$.`,
    r`The sum has variance $nv$. Dividing the sum by $n$ multiplies variance by $1/n^2$, giving $v/n$.`,
    undefined,
    'prove',
  ),
];
s2.review = [
  q(
    r`Given variances $5,2$ and covariance $-1$, find $\operatorname{Var}(X+2Y)$.`,
    r`$5+4(2)+4(-1)=9$.`,
    exact('9'),
  ),
  q(
    r`Given variances $5,2$ and covariance $-1$, find $\operatorname{Var}(2X-Y)$.`,
    r`$4(5)+2-4(-1)=26$.`,
    exact('26'),
  ),
  q(
    r`Four independent measurements each have variance $16$. Find the variance of their average.`,
    r`$16/4=4$.`,
    exact('4'),
  ),
];
s2.quickCheck = quick(
  r`For dependent variables, which extra quantity is generally needed to compute $\operatorname{Var}(X+Y)$ from their variances?`,
  [`Their covariance.`, `The sum of their means.`, `Their largest possible values.`],
  0,
  `Expanding the squared centered sum produces a covariance cross term.`,
  [
    `Correct. The formula adds twice the covariance to the two variances.`,
    `Means determine the center of the sum, but do not specify centered co-variation.`,
    `Upper bounds alone do not determine the expected cross product.`,
  ],
);
const s3 = section(
  'Correlation standardizes covariance but does not describe all dependence',
  r`When both variances are finite and strictly positive, the correlation coefficient is $\rho_{X,Y}=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$. It is dimensionless because the units cancel. Correlation lies in $[-1,1]$ and summarizes the strength and direction of linear co-variation. If either variable is constant, the denominator vanishes and correlation is undefined, even though covariance with that constant is zero.

For the binary model with covariance $1/8$, both standard deviations are $1/2$, so correlation is $(1/8)/(1/4)=1/2$. Converting either variable to a different positive unit does not change this value. Multiplying exactly one variable by a negative number reverses the sign. Adding constants leaves correlation unchanged.

The range can be understood without memorizing a separate inequality. Standardize the variables to $U,V$ with means zero and variances one. Then $E[(U-V)^2]=2-2\rho\ge0$ gives $\rho\le1$, and $E[(U+V)^2]=2+2\rho\ge0$ gives $\rho\ge-1$. Equality means a standardized sum or difference is zero with probability one, so the original variables satisfy an exact affine relation. “With probability one” allows exceptions having probability zero.

Zero correlation is not absence of every relationship. Let $X$ take $-1,0,1$ with equal probabilities and let $Y=X^2$. Symmetry gives $E[X]=E[X^3]=0$, so $\operatorname{Cov}(X,Y)=0$. Yet observing $X$ determines $Y$ exactly. Both variances are positive, making this a genuine zero-correlation dependent pair.

A correlation coefficient also does not establish causation. The mathematical joint model describes association. A common cause, selection effects, or reverse direction can explain the same correlation. Later study-design material will separate randomized interventions from observing variables together. For now, interpret correlation as a normalized feature of the joint distribution, never as a complete account of it.`,
  [
    cov,
    citation(
      'os-stat-1-4',
      'openstax-statistics-2e',
      '§1.4 Experimental Design and Ethics',
      'https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics',
      'Observational studies, explanatory/response variables, random assignment, masking, and responsible reporting.',
    ),
  ],
  [
    termEntry(
      'correlation',
      'Correlation coefficient',
      'Covariance normalized by the two standard deviations.',
      r`$\rho=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$ for positive finite variances.`,
      r`Covariance three with standard deviations two and three gives correlation $1/2$.`,
      `Correlation is undefined for a constant variable; zero correlation does not ensure independence.`,
    ),
  ],
);
s3.questions = [
  q(
    r`Standard deviations are $2,3$ and covariance is $3$. Find correlation.`,
    r`$3/(2\cdot3)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Standard deviations are $4,5$ and correlation is $-3/5$. Find covariance.`,
    r`$(-3/5)(4)(5)=-12$.`,
    exact('-12'),
  ),
  q(
    r`If $\rho(X,Y)=2/5$, find $\rho(3X+8,2Y-1)$.`,
    r`Positive changes of scale and translations preserve correlation, so it remains $2/5$.`,
    exact('2/5'),
  ),
  q(
    r`If $\rho(X,Y)=2/5$, find $\rho(-X,2Y)$.`,
    r`One negative scaling reverses the sign, giving $-2/5$.`,
    exact('-2/5'),
  ),
  q(
    r`If $X$ has positive finite variance and $Y=7-3X$, find $\rho(X,Y)$.`,
    r`The exact affine relation has negative slope, so correlation is $-1$.`,
    exact('-1'),
  ),
  q(
    r`True or false: correlation with a constant variable equals zero.`,
    r`False. Its zero standard deviation makes the correlation denominator zero, so correlation is undefined.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Let $X$ be uniform on $\{-1,0,1\}$ and $Y=X^2$. Find $E[Y]$.`,
    r`$E[Y]=(1+0+1)/3=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`For that explicitly defined pair $X\in\{-1,0,1\}$ uniformly and $Y=X^2$, find covariance.`,
    r`$E[XY]=E[X^3]=0$ and $E[X]=0$, so covariance is $0$.`,
    exact('0'),
  ),
  q(
    r`Explain why the pair $X\in\{-1,0,1\}$ uniformly and $Y=X^2$ is dependent despite zero covariance.`,
    r`For example, $P(Y=0\mid X=0)=1$, whereas $P(Y=0)=1/3$. The conditional distribution changes.`,
  ),
  q(
    r`Show that correlation cannot exceed one in absolute value using standardized variables.`,
    r`For standardized $U,V$, nonnegativity of $E[(U-V)^2]=2-2\rho$ gives $\rho\le1$, and of $E[(U+V)^2]=2+2\rho$ gives $\rho\ge-1$.`,
    undefined,
    'prove',
  ),
];
s3.review = [
  q(
    r`Standard deviations are $3,4$ and covariance is $-6$. Find correlation.`,
    r`$-6/(3\cdot4)=-1/2$.`,
    exact('-1/2'),
  ),
  q(
    r`For $X$ uniform on $\{-1,0,1\}$, find $\operatorname{Var}(X^2)$.`,
    r`$E[X^4]-E[X^2]^2=2/3-4/9=2/9$.`,
    exact('2/9'),
  ),
  q(
    r`If $\rho(X,Y)=-1/3$, find $\rho(-2X+1,-5Y)$.`,
    r`Both signs reverse, canceling each other; the correlation remains $-1/3$.`,
    exact('-1/3'),
  ),
];
const s4 = section(
  'Collect means and covariances into vectors and matrices',
  r`A random vector $\mathbf X=(X_1,\ldots,X_d)^T$ records several random quantities together. Its mean vector $\boldsymbol\mu=E[\mathbf X]$ is formed by taking the expectation of each component. Its covariance matrix is $\Sigma=E[(\mathbf X-\boldsymbol\mu)(\mathbf X-\boldsymbol\mu)^T]$, provided the components have finite second moments. The $(i,j)$ entry is $\operatorname{Cov}(X_i,X_j)$; diagonal entries are variances.

For a pair with variances four and nine and covariance three, $\Sigma=\begin{pmatrix}4&3\\3&9\end{pmatrix}$. It is symmetric because covariance is symmetric. A covariance matrix does not have to be diagonal, and a diagonal covariance matrix does not by itself imply independent components. It says that distinct coordinates are uncorrelated.

A fixed linear transformation uses the same matrix operations as in linear algebra. If $\mathbf Y=A\mathbf X+\mathbf b$, then $E[\mathbf Y]=A\boldsymbol\mu+\mathbf b$ and $\operatorname{Cov}(\mathbf Y)=A\Sigma A^T$. To derive the covariance rule, subtract the transformed mean, leaving $A(\mathbf X-\boldsymbol\mu)$; multiply that column vector by its transpose and take expectation. The final transpose belongs on the right, and the constant shift disappears.

If $A$ is $m\times d$, then $A\Sigma A^T$ is $m\times m$, as a covariance matrix for an $m$-component output must be. Dimension checking catches many errors before arithmetic begins.

For instance, a $3\times2$ transformation produces three features from two input coordinates. Their covariance is $3\times3$, even though its rank cannot exceed two. A large output covariance matrix therefore need not describe an equally large number of distinct variation directions. This is consistent with the rank limitations of a linear map. In the scalar case $Y=\mathbf a^T\mathbf X$, the formula reduces to $\operatorname{Var}(Y)=\mathbf a^T\Sigma\mathbf a$.

For independent unit-variance inputs $X_1,X_2$, define outputs $Y_1=X_1+X_2$ and $Y_2=X_1-X_2$. The transformation gives covariance matrix $\begin{pmatrix}2&0\\0&2\end{pmatrix}$. The outputs are uncorrelated. Independence would require additional distributional information; a rotation or other linear change of coordinates does not generally turn arbitrary data into independent features.`,
  [vectors, cov],
  [
    termEntry(
      'covariance-matrix',
      'Covariance matrix',
      'The matrix of all pairwise component covariances.',
      r`$\Sigma_{ij}=\operatorname{Cov}(X_i,X_j)$ and $\operatorname{Cov}(A\mathbf X+\mathbf b)=A\Sigma A^T$.`,
      r`Diagonal entries are variances; off-diagonal entries describe co-variation.`,
      r`A covariance matrix is not generally the matrix $E[\mathbf X\mathbf X^T]$ unless the mean is zero.`,
    ),
  ],
);
s4.questions = [
  q(
    r`A vector has component variances $4,9$ and covariance $3$. Fill its covariance matrix in component order $1,2$.`,
    r`The matrix is $\begin{pmatrix}4&3\\3&9\end{pmatrix}$; variances go on the diagonal and covariance appears symmetrically.`,
    grid(
      ['X1', 'X2'],
      ['X1', 'X2'],
      [
        ['4', '3'],
        ['3', '9'],
      ],
    ),
  ),
  q(
    r`A three-dimensional random vector is mapped by a $2\times3$ matrix. Give the dimensions of the output covariance matrix as $(\text{rows},\text{columns})$.`,
    r`There are two output coordinates, so the covariance dimensions are $(2,2)$.`,
    tuple(['2', '2']),
  ),
  q(
    r`The mean vector is $(2,-1)^T$. For $Y=X_1+3X_2+4$, find $E[Y]$.`,
    r`$2+3(-1)+4=3$.`,
    exact('3'),
  ),
  q(
    r`For covariance matrix $\begin{pmatrix}4&3\\3&9\end{pmatrix}$, find the variance of $X_1+X_2$.`,
    r`The quadratic form is $4+9+2(3)=19$.`,
    exact('19'),
  ),
  q(
    r`Independent variables have variances one and four. Fill the covariance matrix of $(X+Y,X-Y)^T$.`,
    r`Both variances are five; covariance is $1-4=-3$. The matrix is $\begin{pmatrix}5&-3\\-3&5\end{pmatrix}$.`,
    grid(
      ['X + Y', 'X - Y'],
      ['X + Y', 'X - Y'],
      [
        ['5', '-3'],
        ['-3', '5'],
      ],
    ),
  ),
  q(
    r`For covariance matrix $\begin{pmatrix}4&3\\3&9\end{pmatrix}$, find the covariance between $2X_1$ and $-X_2$.`,
    r`Scaling gives $2(-1)(3)=-6$.`,
    exact('-6'),
  ),
  q(
    r`If $E[\mathbf X]=(1,2)^T$ and $\Sigma=\begin{pmatrix}3&1\\1&4\end{pmatrix}$, find $E[X_1X_2]$.`,
    r`$E[X_1X_2]=\Sigma_{12}+E[X_1]E[X_2]=1+2=3$.`,
    exact('3'),
  ),
  q(
    r`True or false: adding a fixed vector to a random vector changes its covariance matrix.`,
    r`False. Centering cancels the fixed shift.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Derive $\operatorname{Cov}(A\mathbf X+\mathbf b)=A\Sigma A^T$ from the definition.`,
    r`The centered output is $A(\mathbf X-\boldsymbol\mu)$. Its outer product is $A(\mathbf X-\boldsymbol\mu)(\mathbf X-\boldsymbol\mu)^TA^T$. Taking expectations gives $A\Sigma A^T$.`,
    undefined,
    'prove',
  ),
  q(
    r`Explain the difference between $E[\mathbf X\mathbf X^T]$ and the covariance matrix.`,
    r`The first contains raw second moments. The covariance matrix subtracts the mean outer product: $\Sigma=E[\mathbf X\mathbf X^T]-\boldsymbol\mu\boldsymbol\mu^T$.`,
  ),
];
s4.review = [
  q(
    r`Independent components have variances two and three. Fill the covariance matrix of $(X_1,2X_2)^T$.`,
    r`The diagonal variances are two and twelve, and off-diagonal covariances are zero: $\begin{pmatrix}2&0\\0&12\end{pmatrix}$.`,
    grid(
      ['X1', '2 X2'],
      ['X1', '2 X2'],
      [
        ['2', '0'],
        ['0', '12'],
      ],
    ),
  ),
  q(
    r`A random vector has mean $(3,4)^T$. Find the mean of $2X_1-X_2$.`,
    r`$2(3)-4=2$.`,
    exact('2'),
  ),
  q(
    r`If covariance is $2$, and means are $-1$ and $5$, find the raw cross moment.`,
    r`$E[XY]=2+(-1)(5)=-3$.`,
    exact('-3'),
  ),
];
const s5 = section(
  'Covariance geometry, validity, and redundant features',
  r`Not every symmetric array with nonnegative diagonal entries can be a covariance matrix. For every fixed vector $\mathbf a$, $\mathbf a^T\Sigma\mathbf a=\operatorname{Var}(\mathbf a^T\mathbf X)\ge0$. Therefore covariance matrices are **positive semidefinite**, abbreviated PSD. This is a probabilistic reason for the quadratic-form condition introduced in linear algebra and optimization.

For example, $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ is symmetric with positive diagonal entries, but the direction $(1,-1)^T$ has quadratic form $-2$. It would claim a negative variance for $X_1-X_2$, so it is impossible. For a two-variable covariance matrix with variances $v_1,v_2$ and covariance $c$, the condition includes $c^2\le v_1v_2$, the same restriction expressed by the correlation bound when variances are positive.

A covariance matrix can be singular without being invalid. If $X_2=2X_1$ and $\operatorname{Var}(X_1)=1$, then $\Sigma=\begin{pmatrix}1&2\\2&4\end{pmatrix}$. The combination $2X_1-X_2$ has zero variance. Its repeated feature provides no independent direction of variation. More generally, a zero-variance linear combination is constant with probability one; the constant need not be zero before centering.

Eigenvectors connect this matrix to variation along directions. For a unit vector $\mathbf a$, the projected variance is $\mathbf a^T\Sigma\mathbf a$. A symmetric covariance matrix has nonnegative eigenvalues. Expressing $\mathbf a$ in an orthonormal eigenbasis shows that this variance is a weighted average of the eigenvalues, with squared coordinates as weights. Hence its largest possible value is the largest eigenvalue, achieved along a corresponding eigenvector. This gives the probability interpretation behind principal directions of variation.

For $\Sigma=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, unit directions $(1,1)^T/\sqrt2$ and $(1,-1)^T/\sqrt2$ have variances three and one. The cloud spreads more along the first direction. Such a description summarizes second moments; it neither supplies the full joint distribution nor establishes that the cloud is Gaussian.

A direction of high variance is also not automatically the direction most useful for predicting a response. Variation can come from irrelevant noise or changes of measurement scale. Covariance geometry answers where features vary; selecting useful predictive features requires a target and a loss or other task criterion, which belong to later modeling lessons.`,
  [vectors, cov],
  [
    termEntry(
      'covariance-psd',
      'Positive semidefinite covariance',
      'Every linear projection has nonnegative variance.',
      r`$\mathbf a^T\Sigma\mathbf a\ge0$ for every real vector $\mathbf a$.`,
      r`$\begin{pmatrix}1&2\\2&4\end{pmatrix}$ is valid but singular.`,
      `Positive diagonal entries alone are insufficient for covariance validity.`,
    ),
  ],
);
s5.questions = [
  q(
    r`For $\Sigma=\begin{pmatrix}1&2\\2&1\end{pmatrix}$, compute the quadratic form for $(1,-1)^T$.`,
    r`$1+1-2(2)=-2$.`,
    exact('-2'),
  ),
  q(
    r`Can $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ be a covariance matrix? Answer true or false.`,
    r`False. It gives negative variance $-2$ in direction $(1,-1)^T$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`If $\operatorname{Var}(X)=4$ and $\operatorname{Var}(Y)=9$, what is the largest possible covariance?`,
    r`$|\operatorname{Cov}(X,Y)|\le\sqrt{4\cdot9}=6$, so the largest is $6$.`,
    exact('6'),
  ),
  q(
    r`If $\operatorname{Var}(X)=1$ and $Y=2X$, find $\operatorname{Var}(2X-Y)$.`,
    r`The combination is identically zero, so its variance is $0$.`,
    exact('0'),
  ),
  q(
    r`For $\Sigma=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, find the variance along unit direction $(1,1)^T/\sqrt2$.`,
    r`The quadratic form is $(2+2+2)/2=3$.`,
    exact('3'),
  ),
  q(
    r`For $\Sigma=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, find the variance along unit direction $(1,-1)^T/\sqrt2$.`,
    r`The quadratic form is $(2+2-2)/2=1$.`,
    exact('1'),
  ),
  q(
    r`A covariance matrix has eigenvalues $1,4,7$. What is the greatest variance of a unit-length linear projection?`,
    r`The largest possible Rayleigh quotient is the largest eigenvalue, $7$.`,
    exact('7'),
  ),
  q(
    r`True or false: a singular covariance matrix is necessarily invalid.`,
    r`False. Exact affine dependence among features can produce a valid singular covariance matrix.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Prove covariance matrices are positive semidefinite.`,
    r`For any vector $a$, $a^T\Sigma a=E[(a^T(\mathbf X-\boldsymbol\mu))^2]\ge0$. This is the variance of a scalar projection.`,
    undefined,
    'prove',
  ),
  q(
    r`Explain why the direction vector must have unit length when comparing projected variances to find the greatest-variance direction.`,
    r`Scaling the direction by $c$ multiplies projected variance by $c^2$. Without a length restriction, arbitrarily large values could be produced merely by scaling, rather than by choosing a different direction.`,
  ),
];
s5.review = [
  q(
    r`A pair has variances nine and sixteen. Find the smallest possible covariance.`,
    r`The lower correlation bound gives covariance $-\sqrt{9\cdot16}=-12$.`,
    exact('-12'),
  ),
  q(
    r`A covariance matrix is diagonal with entries two and five. Find projected variance along $(1,1)^T/\sqrt2$.`,
    r`$(2+5)/2=7/2$.`,
    exact('7/2'),
  ),
  q(
    r`For $Y=3X+7$ with $\operatorname{Var}(X)=2$, find $\operatorname{Var}(Y-3X)$.`,
    r`The combination equals the constant seven, so its variance is $0$.`,
    exact('0'),
  ),
];
s5.quickCheck = quick(
  r`What does a zero eigenvalue of a covariance matrix imply?`,
  [
    `Some nonzero linear combination has zero variance.`,
    `Every component is independent.`,
    `The matrix has negative probability entries.`,
  ],
  0,
  `A zero eigenvector direction has zero quadratic-form variance.`,
  [
    `Correct. The projection in that direction is constant with probability one.`,
    `Zero projected variance describes affine dependence or a constant direction, not independence.`,
    `Covariance entries are not probabilities, and a zero eigenvalue does not mean any are negative.`,
  ],
);
export default lesson(
  12,
  'covariance-correlation-random-vectors',
  'Covariance, Correlation, and Random Vectors',
  r`We combine probability with linear algebra to describe joint variation. Covariance controls the uncertainty of sums and projections; correlation removes units; covariance matrices organize the same ideas for multiple features. Unless stated otherwise, all variables in this lesson have finite second moments.`,
  [s1, s2, s3, s4, s5],
);
