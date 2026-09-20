# Covariance, Correlation, and Random Vectors

We combine probability with linear algebra to describe joint variation. Covariance controls the uncertainty of sums and projections; correlation removes units; covariance matrices organize the same ideas for multiple features. Unless stated otherwise, all variables in this lesson have finite second moments.

## Covariance measures centered co-variation

Separate variances describe the spread of two variables, but they do not reveal whether their deviations tend to have the same sign. For variables with finite second moments, define $\operatorname{Cov}(X,Y)=E[(X-E[X])(Y-E[Y])]$. The product is positive when both variables are above their means or both are below, and negative when their centered deviations oppose each other. Covariance averages that product across the joint distribution.

Expanding the product and using linearity yields the computational identity $\operatorname{Cov}(X,Y)=E[XY]-E[X]E[Y]$. The expectation $E[XY]$ generally needs joint information. Replacing it with $E[X]E[Y]$ without a reason assumes away the dependence we are trying to measure.

For an original binary example, let $p(0,0)=3/8$, $p(0,1)=1/8$, $p(1,0)=1/8$, and $p(1,1)=3/8$. Both means are $1/2$, while $E[XY]=P(X=1,Y=1)=3/8$. Thus the covariance is $3/8-1/4=1/8$. Agreement is favored, producing positive centered co-variation. If the diagonal and off-diagonal probabilities are exchanged, covariance becomes negative while the marginals remain unchanged.

Covariance has the product of the variables' units. If one variable is measured in seconds and another in bytes, their covariance is in second-bytes. Translating either variable by a constant changes neither centered deviations nor covariance. Scaling gives $\operatorname{Cov}(aX+b,cY+d)=ac\operatorname{Cov}(X,Y)$. A negative scaling reverses its sign; a positive unit conversion changes its numerical magnitude.

Special cases connect the new quantity to familiar ones: $\operatorname{Cov}(X,X)=\operatorname{Var}(X)$, and covariance with a constant is zero. Independence implies zero covariance when second moments are finite, because the joint expectation factors. The reverse implication requires separate examination; covariance records only a particular aspect of dependence.

The finite-moment assumption is substantive. If one or both required second moments diverge, the familiar covariance algebra may not be available, even when a drawing suggests a trend. In this subject, check moment existence before manipulating expectations of products. Under finite second moments, the product is integrable, so the centered and expanded formulas agree.

Related definitions: [Covariance](ref:probability-statistics-covariance).

## Variance of a combination includes cross terms

Linearity of expectation never required independence. Variance behaves differently because it squares a centered sum. For finite second moments, $\operatorname{Var}(aX+bY)=a^2\operatorname{Var}(X)+b^2\operatorname{Var}(Y)+2ab\operatorname{Cov}(X,Y)$. Expand $[a(X-E[X])+b(Y-E[Y])]^2$ to see where each term comes from. A final added constant contributes nothing.

Suppose $\operatorname{Var}(X)=4$, $\operatorname{Var}(Y)=9$, and $\operatorname{Cov}(X,Y)=3$. Then $\operatorname{Var}(X+Y)=4+9+6=19$, while $\operatorname{Var}(X-Y)=4+9-6=7$. Positive co-variation reinforces fluctuations in a sum but cancels some fluctuation in a difference. Ignoring the covariance would incorrectly give thirteen for both.

For more variables, $\operatorname{Var}(\sum_i a_iX_i)=\sum_i a_i^2\operatorname{Var}(X_i)+2\sum_{i<j}a_ia_j\operatorname{Cov}(X_i,X_j)$. Each unordered pair appears once in the second sum, accompanied by a factor of two. Pairwise uncorrelated variables have all those covariance terms zero, which is enough for variance additivity; full independence is a stronger condition than needed for that identity.

Averages can reduce noise, but dependence limits the reduction. If two equally variable measurements have variance $v$ and covariance $c$, their average has variance $(v+c)/2$. With independent noise, $c=0$, and variance is halved. If the measurements are identical, $c=v$, and averaging produces no reduction at all. Repeating the same stored measurement is not equivalent to collecting new independent information.

Covariance also distributes over sums in either argument. For independent variables with variances one and four, $\operatorname{Cov}(X+Y,X-Y)=\operatorname{Var}(X)-\operatorname{Var}(Y)=-3$. Zero cross-covariances vanish, but the repeated appearances of each variable remain.

This distinction matters for measurements reused in several features. Even if original sensors are independent, two derived features that share a sensor can be correlated. Independence of the inputs justifies deleting cross terms between different sensors; it does not delete the variance contribution of a sensor that appears in both outputs. This provides a useful check when moving between different linear features of the same measurements.

Related definitions: [Variance of a linear combination](ref:probability-statistics-variance-linear-combination).

## Correlation standardizes covariance but does not describe all dependence

When both variances are finite and strictly positive, the correlation coefficient is $\rho_{X,Y}=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$. It is dimensionless because the units cancel. Correlation lies in $[-1,1]$ and summarizes the strength and direction of linear co-variation. If either variable is constant, the denominator vanishes and correlation is undefined, even though covariance with that constant is zero.

For the binary model with covariance $1/8$, both standard deviations are $1/2$, so correlation is $(1/8)/(1/4)=1/2$. Converting either variable to a different positive unit does not change this value. Multiplying exactly one variable by a negative number reverses the sign. Adding constants leaves correlation unchanged.

The range can be understood without memorizing a separate inequality. Standardize the variables to $U,V$ with means zero and variances one. Then $E[(U-V)^2]=2-2\rho\ge0$ gives $\rho\le1$, and $E[(U+V)^2]=2+2\rho\ge0$ gives $\rho\ge-1$. Equality means a standardized sum or difference is zero with probability one, so the original variables satisfy an exact affine relation. “With probability one” allows exceptions having probability zero.

Zero correlation is not absence of every relationship. Let $X$ take $-1,0,1$ with equal probabilities and let $Y=X^2$. Symmetry gives $E[X]=E[X^3]=0$, so $\operatorname{Cov}(X,Y)=0$. Yet observing $X$ determines $Y$ exactly. Both variances are positive, making this a genuine zero-correlation dependent pair.

A correlation coefficient also does not establish causation. The mathematical joint model describes association. A common cause, selection effects, or reverse direction can explain the same correlation. Later study-design material will separate randomized interventions from observing variables together. For now, interpret correlation as a normalized feature of the joint distribution, never as a complete account of it.

Related definitions: [Correlation coefficient](ref:probability-statistics-correlation).

![Linear association differs from units](figure:probability-statistics-figure-12)

## Collect means and covariances into vectors and matrices

A random vector $\mathbf X=(X_1,\ldots,X_d)^T$ records several random quantities together. Its mean vector $\boldsymbol\mu=E[\mathbf X]$ is formed by taking the expectation of each component. Its covariance matrix is $\Sigma=E[(\mathbf X-\boldsymbol\mu)(\mathbf X-\boldsymbol\mu)^T]$, provided the components have finite second moments. The $(i,j)$ entry is $\operatorname{Cov}(X_i,X_j)$; diagonal entries are variances.

For a pair with variances four and nine and covariance three, $\Sigma=\begin{pmatrix}4&3\\3&9\end{pmatrix}$. It is symmetric because covariance is symmetric. A covariance matrix does not have to be diagonal, and a diagonal covariance matrix does not by itself imply independent components. It says that distinct coordinates are uncorrelated.

A fixed linear transformation uses the same matrix operations as in linear algebra. If $\mathbf Y=A\mathbf X+\mathbf b$, then $E[\mathbf Y]=A\boldsymbol\mu+\mathbf b$ and $\operatorname{Cov}(\mathbf Y)=A\Sigma A^T$. To derive the covariance rule, subtract the transformed mean, leaving $A(\mathbf X-\boldsymbol\mu)$; multiply that column vector by its transpose and take expectation. The final transpose belongs on the right, and the constant shift disappears.

If $A$ is $m\times d$, then $A\Sigma A^T$ is $m\times m$, as a covariance matrix for an $m$-component output must be. Dimension checking catches many errors before arithmetic begins.

For instance, a $3\times2$ transformation produces three features from two input coordinates. Their covariance is $3\times3$, even though its rank cannot exceed two. A large output covariance matrix therefore need not describe an equally large number of distinct variation directions. This is consistent with the rank limitations of a linear map. In the scalar case $Y=\mathbf a^T\mathbf X$, the formula reduces to $\operatorname{Var}(Y)=\mathbf a^T\Sigma\mathbf a$.

For independent unit-variance inputs $X_1,X_2$, define outputs $Y_1=X_1+X_2$ and $Y_2=X_1-X_2$. The transformation gives covariance matrix $\begin{pmatrix}2&0\\0&2\end{pmatrix}$. The outputs are uncorrelated. Independence would require additional distributional information; a rotation or other linear change of coordinates does not generally turn arbitrary data into independent features.

Related definitions: [Covariance matrix](ref:probability-statistics-covariance-matrix).

## Covariance geometry, validity, and redundant features

Not every symmetric array with nonnegative diagonal entries can be a covariance matrix. For every fixed vector $\mathbf a$, $\mathbf a^T\Sigma\mathbf a=\operatorname{Var}(\mathbf a^T\mathbf X)\ge0$. Therefore covariance matrices are **positive semidefinite**, abbreviated PSD. This is a probabilistic reason for the quadratic-form condition introduced in linear algebra and optimization.

For example, $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ is symmetric with positive diagonal entries, but the direction $(1,-1)^T$ has quadratic form $-2$. It would claim a negative variance for $X_1-X_2$, so it is impossible. For a two-variable covariance matrix with variances $v_1,v_2$ and covariance $c$, the condition includes $c^2\le v_1v_2$, the same restriction expressed by the correlation bound when variances are positive.

A covariance matrix can be singular without being invalid. If $X_2=2X_1$ and $\operatorname{Var}(X_1)=1$, then $\Sigma=\begin{pmatrix}1&2\\2&4\end{pmatrix}$. The combination $2X_1-X_2$ has zero variance. Its repeated feature provides no independent direction of variation. More generally, a zero-variance linear combination is constant with probability one; the constant need not be zero before centering.

Eigenvectors connect this matrix to variation along directions. For a unit vector $\mathbf a$, the projected variance is $\mathbf a^T\Sigma\mathbf a$. A symmetric covariance matrix has nonnegative eigenvalues. Expressing $\mathbf a$ in an orthonormal eigenbasis shows that this variance is a weighted average of the eigenvalues, with squared coordinates as weights. Hence its largest possible value is the largest eigenvalue, achieved along a corresponding eigenvector. This gives the probability interpretation behind principal directions of variation.

For $\Sigma=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, unit directions $(1,1)^T/\sqrt2$ and $(1,-1)^T/\sqrt2$ have variances three and one. The cloud spreads more along the first direction. Such a description summarizes second moments; it neither supplies the full joint distribution nor establishes that the cloud is Gaussian.

A direction of high variance is also not automatically the direction most useful for predicting a response. Variation can come from irrelevant noise or changes of measurement scale. Covariance geometry answers where features vary; selecting useful predictive features requires a target and a loss or other task criterion, which belong to later modeling lessons.

Related definitions: [Positive semidefinite covariance](ref:probability-statistics-covariance-psd).
