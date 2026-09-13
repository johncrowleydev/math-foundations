# Singular Value Decomposition

Eigenvectors are powerful, but a matrix may be rectangular or may lack an eigenbasis. Singular value decomposition provides a geometric description that works for every real matrix. It uses one orthonormal basis for input directions and another for output directions, instead of requiring the same direction on both sides.

## Perpendicular directions and scale factors

For an m by n real matrix A, a [singular value decomposition](ref:linear-algebra-svd-1) is $A=U\Sigma V^T$. Here U is an m by m orthogonal matrix, V is an n by n orthogonal matrix, and Sigma is an m by n rectangular diagonal matrix. Orthogonal matrix means a square matrix whose columns form an orthonormal basis; its transpose is its inverse. Sigma has nonnegative numbers on its diagonal and zero elsewhere.

The diagonal numbers are singular values, usually listed from largest to smallest. The columns of V are right singular vectors in the input space; columns of U are left singular vectors in the output space. The Greek capital Sigma names this matrix here, not a summation operation. We use the full SVD convention in this lesson; software may return smaller versions that omit unused directions.

Read the product from right to left. V transpose expresses the input in perpendicular coordinates, Sigma scales those coordinates and may discard some, and U expresses the result in output coordinates. The orthogonal factors preserve Euclidean length; stretching and information loss occur in Sigma. Orthogonal factors can include reflections, so calling them only “rotations” would be too restrictive.

## A small example you can verify

For the matrix with rows (0,2),(1,0), choose V to swap the two standard basis directions, Sigma with diagonal entries 2 and 1, and U equal to the identity. Then V transpose swaps the input coordinates and Sigma scales the first resulting coordinate by two, giving (2y,x) from input (x,y), exactly as the original matrix does.

The right singular direction (0,1) is stretched by two into output direction (1,0). The right singular direction (1,0) is stretched by one into output direction (0,1). The [singular values](ref:linear-algebra-svd-2) describe nonnegative length factors even though the input and output directions differ. In particular, singular values are not generally eigenvalues.

![A circle becomes an ellipse](figure:la-svd-ellipse)

The input unit circle is sent to an ellipse with horizontal semiaxis two and vertical semiaxis one. If a singular value were zero, the corresponding direction would collapse and the ellipse could flatten into a line segment. In more dimensions the same idea describes an ellipsoid, although a plane drawing cannot show every direction.

## Connection to rank and eigenvalues

For every input vector x, $x^TA^TAx=\|Ax\|^2\geq0$. The left side is a scalar, and the right side is squared length. Thus A transpose A is symmetric and [positive semidefinite](ref:linear-algebra-svd-3), meaning this quadratic expression is nonnegative for every real x. The spectral theorem supplies an orthonormal basis of eigenvectors for it, with nonnegative eigenvalues.

The right singular vectors can be chosen as those eigenvectors, and the singular values are the square roots of their eigenvalues. For a positive singular value sigma and corresponding unit right vector v, define the left vector by dividing Av by sigma. This produces the matching unit output direction. Zero singular values require completing orthonormal bases rather than dividing by zero. These facts explain why an SVD exists; they are not a prescription to implement a numerically stable algorithm by explicitly forming A transpose A.

The rank is the number of positive singular values. Each positive value supplies an output direction; each zero input direction lies in the null space. For exact mathematical data this count is exact. Floating-point software must decide which tiny values are effectively zero, so numerical rank depends on a tolerance and the scale of the problem.

## Approximation and responsible interpretation

A rank-k truncated SVD keeps the k largest singular values and replaces the others by zero. Here k is a nonnegative integer no larger than the rank. Rank-k means at most k independent output directions. This simplification can store or process an approximation using fewer directions.

The [Frobenius norm](ref:linear-algebra-svd-4) of a matrix is the square root of the sum of the squares of all its entries. A fundamental approximation theorem says that truncated SVD minimizes the Frobenius norm of the difference among matrices of rank at most k. We state this theorem without its proof. Its squared error equals the sum of the squares of the discarded singular values. Tied singular values can make the best approximation nonunique.

For a diagonal matrix with entries 4 and 1, keeping only the first direction gives diagonal entries 4 and 0. The Frobenius error is one. A nonzero component of the original transformation was discarded; this is a controlled approximation, not exact recovery. In image compression, the entries can represent intensities; in data analysis, low-rank structure can summarize coordinated variation.

Large singular values do not automatically identify scientifically important causes, and a small singular value can still carry meaningful information. Data scaling and the chosen error measure matter. Your goal here is to read and verify a supplied SVD, connect it to rank and geometry, and explain what truncation keeps and loses. Computing a large SVD from scratch is beyond this introductory sequence.
