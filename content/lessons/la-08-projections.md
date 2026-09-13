# Orthogonality, Projections, and Least Squares

An exact solution may not exist. Measurements may be noisy, or a target vector may lie outside the column space of a proposed model. Instead of pretending the inconsistency is a mistake, we can ask for the closest permitted output. Orthogonality makes this question tractable.

## Projecting onto a line

Let u be a nonzero real vector and b a target in the same coordinate space. The [projection](ref:linear-algebra-projections-1) p of b onto the line spanned by u is $p=\frac{b\cdot u}{u\cdot u}u$. Read this as “b dot u divided by u dot u, times u.” The denominator is positive because u is nonzero. The scalar coefficient tells us how far along the line to go.

The residual r is the difference b-p, pointing from the approximation to the target. Substitution into its dot product with u gives zero, so the residual is perpendicular to the permitted line. For b=(3,1) and u=(1,0), the projection is (3,0) and the residual (0,1).

Why does perpendicular mean closest? Any other point q on the line differs from p by a vector along the line, perpendicular to the residual. The Pythagorean theorem says the squared distance from b to q equals the squared residual length plus the squared distance from p to q. The extra term is nonnegative and vanishes only at p. This proves minimal distance rather than merely suggesting it from a picture.

![The closest point and residual](figure:la-projection)

## Orthonormal directions

An orthogonal collection has pairwise zero dot products between distinct vectors. It is orthonormal if each vector also has norm one. For an orthonormal basis q sub one through q sub k of a subspace, project b by adding, for each basis vector, b dot that vector times that vector. The unit lengths remove the denominators from the line formula.

For a matrix Q whose columns are these basis vectors, this becomes $p=QQ^Tb$. The transpose turns the columns into rows so that Q transpose times b computes the coefficients. The orthonormal condition is $Q^TQ=I$. The reverse product Q times Q transpose need not be the identity: it is the projection onto the column space, which may be smaller than the whole output space.

Gram–Schmidt is a procedure for turning an independent list into an orthonormal list spanning the same space. Keep the first vector's direction and normalize it. From the next vector, subtract its projections onto all the directions already retained, then normalize the remainder. Independence ensures the remainder is nonzero in exact arithmetic. Dependent input needs separate handling rather than division by zero.

## Least squares and the normal equations

For a matrix A and target b, a [least-squares](ref:linear-algebra-projections-3) solution chooses x to minimize the squared Euclidean norm of Ax-b. It does not usually satisfy every original equation. It selects the output in the column space nearest to b. The residual must be orthogonal to every column of A, giving $A^T(Ax-b)=0$. Rearranging produces the normal equations, $A^TAx=A^Tb$.

“Normal” here means perpendicular; it does not refer to a probability distribution. These equations characterize least-squares solutions even when A has dependent columns. If the columns are independent, A transpose A is invertible and the coefficient solution is unique. If they are dependent, the closest output is still unique, but more than one coefficient vector can produce it.

Suppose our model predicts the same number c for measurements 1, 2, and 6. A has one column of three ones. The normal equation is three c equals nine, giving c=3. The residual components sum to zero, so the residual is orthogonal to the constant-output direction. This derives the arithmetic mean as the best constant fit under squared error.

## What a best fit does and does not say

Least squares minimizes a specified measure of discrepancy. It does not prove a causal explanation or guarantee sensible predictions outside the observed range. Squaring residuals emphasizes large errors, and changing the relative scale of measured quantities can change the fitted result.

For another small example, approximate b=(2,0) on the line spanned by u=(1,1). Their dot product is 2 and u's squared length is 2, so the coefficient is one, the projection is (1,1), and the [residual](ref:linear-algebra-projections-4) is (1,-1). The original vector is not on the line; a nonzero residual is expected, not a failed calculation.

The normal equations are excellent for understanding the geometry and for hand calculations. Numerical software often uses QR factorization or SVD instead, because forming A transpose A can worsen sensitivity to rounding. We need not implement those algorithms here, but should distinguish a mathematical characterization from the best numerical recipe.

In a response, report the coefficient vector, the fitted output, and the residual when requested. They live in different spaces and answer different questions. Calling all three “the answer” can hide an otherwise correct calculation's meaning.
