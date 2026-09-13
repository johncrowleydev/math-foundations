# Orthogonality, Projections, and Least Squares

An exact solution may not exist. Measurements may be noisy, or a target vector may lie outside the column space of a proposed model. Instead of pretending the inconsistency is a mistake, we can ask for the closest permitted output. Orthogonality makes this question tractable.

## Projecting onto a line

Let u be a nonzero real vector and b a target in the same coordinate space. The [projection](ref:linear-algebra-projections-1) p of b onto the line spanned by u is $p=\frac{b\cdot u}{u\cdot u}u$. Read this as “b dot u divided by u dot u, times u.” The denominator is positive because u is nonzero. The scalar coefficient tells us how far along the line to go.

The [residual](ref:la-term-residual) r is the difference b-p, pointing from the approximation to the target. Substitution into its dot product with u gives zero, so the residual is perpendicular to the permitted line. For b=(3,1) and u=(1,0), the projection is (3,0) and the residual (0,1).

Why does perpendicular mean closest? Any other point q on the line differs from p by a vector along the line, perpendicular to the residual. The Pythagorean theorem says the squared distance from b to q equals the squared residual length plus the squared distance from p to q. The extra term is nonnegative and vanishes only at p. This proves minimal distance rather than merely suggesting it from a picture.

![The closest point and residual](figure:la-projection)

### A non-axis projection with exact arithmetic

Let b=(3,0) and u=(1,2). Their dot product is three and u dot u is five, so the coefficient is 3/5. The projected vector is (3/5,6/5), and the residual b-p is (12/5,-6/5). Its dot product with u is 12/5-12/5=0. The residual's squared norm is 36/5. Reporting only the coefficient 3/5 would not report the point on the line.

Replacing u by any nonzero scalar multiple gives the same line and the same projected vector. The coefficient changes to compensate for the changed building block. If b already lies on the line, its residual is zero. If b is perpendicular to the line, the projection is zero.

## Orthonormal directions

An orthogonal collection has pairwise zero dot products between distinct vectors. It is orthonormal if each vector also has norm one. For an orthonormal basis q sub one through q sub k of a subspace, project b by adding, for each basis vector, b dot that vector times that vector. The unit lengths remove the denominators from the line formula.

For a matrix Q whose columns are these basis vectors, this becomes $p=QQ^Tb$. The transpose turns the columns into rows so that Q transpose times b computes the coefficients. The orthonormal condition is $Q^TQ=I$. The reverse product Q times Q transpose need not be the identity: it is the projection onto the column space, which may be smaller than the whole output space.

Gram–Schmidt is a procedure for turning an independent list into an orthonormal list spanning the same space. Keep the first vector's direction and normalize it. From the next vector, subtract its projections onto all the directions already retained, then normalize the remainder. Independence ensures the remainder is nonzero in exact arithmetic. Dependent input needs separate handling rather than division by zero.

### Carrying out Gram–Schmidt

Start with independent vectors a=(1,1,0) and b=(1,0,1). Normalize a to get q1=(1,1,0) divided by square root of two. The projection of b onto a's line is (1/2,1/2,0). Subtracting gives (1/2,-1/2,1), which is orthogonal to a. Normalize this remainder to obtain q2=(1,-1,2) divided by square root of six. Both vectors now have length one, their dot product is zero, and the original vectors can be rebuilt from them.

This construction also explains [QR factorization](ref:la-term-qr): for an independent-column matrix A, put the orthonormal directions in Q and their combination coefficients in an upper-triangular matrix R, so A=QR. Upper triangular means entries below the main diagonal are zero. We name QR here to explain the numerical-method reference later; the practice requires only the small Gram–Schmidt construction just shown.

## Least squares and the normal equations

For a matrix A and target b, a [least-squares](ref:linear-algebra-projections-3) solution chooses x to minimize the squared Euclidean norm of Ax-b. It does not usually satisfy every original equation. It selects the output in the column space nearest to b. The residual must be orthogonal to every column of A, giving $A^T(Ax-b)=0$. Rearranging produces the [normal equations](ref:la-term-normal-equations), $A^TAx=A^Tb$.

“Normal” here means perpendicular; it does not refer to a probability distribution. These equations characterize least-squares solutions even when A has dependent columns. If the columns are independent, A transpose A is invertible and the coefficient solution is unique. If they are dependent, the closest output is still unique, but more than one coefficient vector can produce it.

Suppose our model predicts the same number c for measurements 1, 2, and 6. A has one column of three ones. The normal equation is three c equals nine, giving c=3. The residual components sum to zero, so the residual is orthogonal to the constant-output direction. This derives the arithmetic mean as the best constant fit under squared error.

### Fitting a line rather than a constant

Fit predicted values c+dt to observations (t,y)=(0,1),(1,2),(2,2). The [design matrix](ref:la-term-design-matrix), meaning the matrix of model coefficients, has rows (1,0),(1,1),(1,2). Its first column multiplies the intercept c; its second multiplies the slope d. The normal equations are 3c+3d=5 and 3c+5d=6. Subtraction gives 2d=1, so d=1/2 and c=7/6.

The fitted output is (7/6,5/3,13/6), and the residual, defined throughout as observations minus fitted output, is (-1/6,1/3,-1/6). Its dot product with (1,1,1) is zero; its dot product with (0,1,2) is also zero. These two checks establish the required orthogonality to every column. The squared error is 1/6, obtained by squaring and adding those three residuals.

$
\begin{pmatrix}3&3\\3&5\end{pmatrix}\begin{pmatrix}c\\d\end{pmatrix}=\begin{pmatrix}5\\6\end{pmatrix}
$

## What a best fit does and does not say

Least squares minimizes a specified measure of discrepancy. It does not prove a causal explanation or guarantee sensible predictions outside the observed range. Squaring residuals emphasizes large errors, and changing the relative scale of measured quantities can change the fitted result.

For another small example, approximate b=(2,0) on the line spanned by u=(1,1). Their dot product is 2 and u's squared length is 2, so the coefficient is one, the projection is (1,1), and the [residual](ref:linear-algebra-projections-4) is (1,-1). The original vector is not on the line; a nonzero residual is expected, not a failed calculation.

The normal equations are excellent for understanding the geometry and for hand calculations. Numerical software often uses QR factorization or SVD instead, because forming A transpose A can worsen sensitivity to rounding. We need not implement those algorithms here, but should distinguish a mathematical characterization from the best numerical recipe.

In a response, report the coefficient vector, the fitted output, and the residual when requested. They live in different spaces and answer different questions. Calling all three “the answer” can hide an otherwise correct calculation's meaning.

### A fit can be unique even when its parameters are not

If A has two identical columns u, the fitted vector depends only on the sum of the two coefficients. Changing them by (t,-t) leaves the output unchanged. The least-squares fitted vector is still the unique closest point in the column space, but the coefficients are not unique. Inverting the normal-equation matrix in this situation is invalid; solve the consistent normal equations with free parameters instead.

For full independent columns, A transpose A is invertible because any vector sent to zero by it has zero squared output length under A and must itself be zero. This ties uniqueness to the rank criterion already established. It also distinguishes an exact algebraic theorem from a numerical warning: nearly dependent columns can make recovered coefficients very sensitive to small measurement changes even when exact uniqueness holds.
