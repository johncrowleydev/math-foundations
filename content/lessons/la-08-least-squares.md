# Least Squares and Model Fitting

Measurements may be noisy, or the model we chose may be unable to match all of them. When an exact solution does not exist, least squares asks which permitted output is closest to the observed vector. The previous lesson's projection geometry supplies both a method and a way to check the result.

You will first derive a best constant fit, then build and solve a model with an intercept and slope. Use your knowledge of column spaces, matrix multiplication, linear systems, and perpendicular residuals. A best output can be unique even when its parameters are not, and the smallest observed error does not by itself establish a model's usefulness beyond those observations.

## Least squares and the normal equations

For a real matrix A and target b, a [least-squares](ref:linear-algebra-projections-3) solution chooses a coefficient vector x to minimize the squared Euclidean norm of Ax-b: square each discrepancy and add. If A has m rows and n columns, x has n components, while Ax and b have m. The permitted outputs Ax form the column space of A. Choosing x is therefore a way of choosing an output in that subspace.

Define the residual throughout as observations minus fitted output, b-Ax. Its squared length is the same as that of Ax-b, but its signs have a meaning: a positive component says the observation is above its fitted value. A coefficient, a fitted output, and a residual answer different questions and may even have different numbers of components.

The closest output has residual perpendicular to every column of A. Multiplying by A transpose collects all those dot products at once. Equivalently, with the residual sign reversed, $A^T(Ax-b)=0$. Rearranging gives the [normal equations](ref:la-term-normal-equations), $A^TAx=A^Tb$. “Normal” means perpendicular here; it does not refer to a probability distribution or mean that the original system has an exact solution.

These equations are sufficient as well as necessary. If a fitted output has perpendicular residual, changing the coefficients changes the output by a vector in the column space. The Pythagorean argument then adds a nonnegative squared length to the original squared error. No alternative output can improve it. This argument does not require independent columns; we will examine uniqueness of the coefficients later.

For a small connection to line projection, let A have one column (1,1) and b=(2,0). The normal equation is 2x=2, so the coefficient is one, the fitted output is (1,1), and the residual is (1,-1). Its dot product with the column is zero. The original vector is not on the line; a nonzero residual is expected, not a failed calculation.

## Fitting a constant

Suppose our model predicts the same number c for observations 1, 2, and 6. Each observation supplies one equation: c=1, c=2, and c=6. They cannot all hold. In matrix form A has one column of three ones, x contains the single unknown c, and b=(1,2,6). Thus Ax=(c,c,c).

Compute A transpose A by taking the dot product of the column of ones with itself: the result is three. A transpose b is 1+2+6=9. The normal equation is 3c=9, giving c=3. The fitted output is (3,3,3), and the residual is (-2,-1,3). Its components sum to zero, so it is perpendicular to the constant-output direction (1,1,1).

The squared error is 4+1+9=14. To check minimality directly, change the constant from 3 to 3+h. Each residual decreases by h. On expanding the three squares, the terms linear in h cancel because the original residuals sum to zero. The new squared error is 14 plus three times the square of h. It is smallest only when h=0.

For any nonempty list of m observations, the same calculation gives m times c equal to the sum of the observations. The best constant under squared error is therefore the arithmetic mean. This conclusion follows from the selected error measure; another way to penalize errors can select another constant.

## Fitting a line rather than a constant

Now fit predicted values c+dt to observations (t,y)=(0,1),(1,2),(2,2). The intercept c is the predicted value at t=0; the slope d is the change in prediction for a one-unit increase in t. The three observation equations would be c=1, c+d=2, and c+2d=2. The first two imply c=1 and d=1, which would predict three at t=2, so no exact line matches all three points.

The [design matrix](ref:la-term-design-matrix) is the matrix of coefficients multiplying the unknown model parameters. Put one observation in each row and one parameter in each column. With parameter order (c,d), the rows are (1,0),(1,1),(1,2): the first column multiplies the intercept and the second multiplies the slope. The measured y values belong in b, not in A.

$
A=\begin{pmatrix}1&0\\1&1\\1&2\end{pmatrix},\quad x=\begin{pmatrix}c\\d\end{pmatrix},\quad b=\begin{pmatrix}1\\2\\2\end{pmatrix}
$

Multiplying verifies the construction: Ax=(c,c+d,c+2d). It has three fitted values even though x has only two parameters. The affine prediction c+dt as a function of t is still linear in the unknowns c and d, which is the linearity needed for this matrix problem.

### Form and solve the normal equations

A transpose A contains all pairwise column dot products. The ones column has squared length three, its dot product with (0,1,2) is three, and (0,1,2) has squared length five. A transpose b has entries 1+2+2=5 and 0 times 1 plus 1 times 2 plus 2 times 2=6. Thus

$
\begin{pmatrix}3&3\\3&5\end{pmatrix}\begin{pmatrix}c\\d\end{pmatrix}=\begin{pmatrix}5\\6\end{pmatrix}
$

The scalar equations are 3c+3d=5 and 3c+5d=6. Subtracting the first from the second gives 2d=1, so d=1/2. Substitution into the first gives 3c=7/2, so c=7/6.

### Check the output and residual

Evaluate the model at each observed input: the fitted output is (7/6,5/3,13/6). Subtract it from (1,2,2) to get the residual (-1/6,1/3,-1/6). Its dot product with (1,1,1) is -1/6+1/3-1/6=0; its dot product with (0,1,2) is 0+1/3-2/6=0. These checks establish orthogonality to every column, hence the least-squares property. The squared error is 1/36+1/9+1/36=1/6.

This problem minimizes squared vertical discrepancies in the y values at the fixed inputs t. It does not minimize perpendicular distances from the plotted points to the line in the (t,y) plane. The projection geometry instead lives in the three-dimensional space of output vectors, with b=(1,2,2) and permitted outputs (c,c+d,c+2d). Keep those two pictures distinct when interpreting a line fit.

## A fit can be unique even when its parameters are not

If A has independent columns, A transpose A is invertible and the least-squares coefficient vector is unique. Here is the algebraic reason. Suppose A transpose A sends a vector z to zero. Multiplying on the left by z transpose shows that the squared length of Az is zero. Thus Az=0, and column independence forces z=0. The square matrix A transpose A has only the zero vector in its null space, so it is invertible.

Dependent columns are different. Suppose A has rows (1,1),(1,1) and b=(0,6). Both columns equal (1,1), so the fitted output depends only on the sum of the two coefficients: it is (x1+x2,x1+x2). The constant-fit calculation makes the best sum three. The normal equations both reduce to 2x1+2x2=6, leaving one free parameter. Every coefficient vector (3-s,s), for real s, gives the same unique fitted output (3,3). Its residual (-3,3) is perpendicular to both columns.

Changing the coefficients by (h,-h) leaves the output unchanged because that change lies in A's null space. More generally, adding any null-space vector to a least-squares coefficient vector gives another coefficient vector for the same output. The closest output remains unique by the projection argument, but dependent columns prevent a unique parameter representation. Inverting the normal-equation matrix here is invalid; solve the consistent normal equations with free parameters instead.

Exact uniqueness also differs from numerical reliability. Nearly dependent columns can make recovered coefficients very sensitive to small measurement changes even when the columns are independent in exact arithmetic. The normal equations are useful for understanding the geometry and for hand calculations, but forming A transpose A can worsen sensitivity to rounding. Numerical libraries such as LAPACK provide QR-based and SVD-based least-squares methods. QR separates orthonormal directions from combination coefficients; SVD will be introduced later. Implementing those algorithms is outside this lesson's scope.

## What a best fit does and does not say

The [residual](ref:linear-algebra-projections-4) measures discrepancies under a chosen model. Zero residual means the observations were reproduced exactly. It does not prove a causal explanation or guarantee sensible predictions outside the observed range: neither of those conclusions is part of the distance-minimization calculation. Even a very small error on the observations used for fitting must be distinguished from performance on unseen observations.

Squared error is a specific choice. A residual of size ten contributes one hundred, whereas a residual of size one contributes one. Large discrepancies can therefore strongly influence a least-squares fit. Squared error also differs from total absolute error. For observations (0,0,6), the best squared-error constant is two: its squared error is 4+4+16=24, compared with 36 at zero. But its total absolute error is 2+2+4=8, while the constant zero gives total absolute error six. Minimizing one objective need not minimize the other.

Relative weighting matters too. Multiplying one observation equation and its fitted expression by two makes its contribution to the squared-error objective four times as large. This can change the fit; it changes how discrepancies are measured. By contrast, merely expressing an input such as t in different units and compensating in the slope does not change the available fitted outputs in this unregularized model. Distinguish a change of parameter units from a change of error weights.

Report the coefficient vector, fitted output, and residual when requested. Verify dimensions, substitute the coefficients into the model, and check residual dot products against all columns. Then state the scope of the conclusion: this output is closest for the specified observations, model, and error measure.
