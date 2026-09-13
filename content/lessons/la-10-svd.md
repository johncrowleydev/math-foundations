# Singular Value Decomposition

Eigenvectors are powerful, but a matrix may be rectangular or may lack an eigenbasis. Singular value decomposition provides a geometric description that works for every real matrix. It uses one orthonormal basis for input directions and another for output directions, instead of requiring the same direction on both sides.

## Perpendicular directions and scale factors

For an m by n real matrix A, a [singular value decomposition](ref:linear-algebra-svd-1) is $A=U\Sigma V^T$. Here U is an m by m [orthogonal matrix](ref:la-term-orthogonal-matrix), V is an n by n orthogonal matrix, and Sigma is an m by n rectangular diagonal matrix. Orthogonal matrix means a square matrix whose columns form an orthonormal basis; its transpose is its inverse. Sigma has nonnegative numbers on its diagonal and zero elsewhere.

The diagonal numbers are singular values, usually listed from largest to smallest. The columns of V are right singular vectors in the input space; columns of U are left singular vectors in the output space. The Greek capital Sigma names this matrix here, not a summation operation. We use the full SVD convention in this lesson; software may return smaller versions that omit unused directions. An individual singular value is written $\sigma_i$, read “sigma sub i,” where the lowercase Greek letter names one scale factor and the index i numbers a diagonal position from one through the smaller of m and n.

Read the product from right to left. V transpose expresses the input in perpendicular coordinates, Sigma scales those coordinates and may discard some, and U expresses the result in output coordinates. The orthogonal factors preserve Euclidean length; stretching and information loss occur in Sigma. Orthogonal factors can include reflections, so calling them only “rotations” would be too restrictive.

### Rectangular factors need a dimension check

An m-by-n matrix has only min(m,n) diagonal positions in its rectangular Sigma. Here min means the smaller of the two numbers. If there are more inputs than outputs, some input basis directions have no diagonal position at all and are necessarily erased. For example, the two-by-three matrix with rows (3,0,0),(0,2,0) has listed singular values three and two but still has the third standard vector in its null space. Always compute nullity as number of columns minus rank, not just by counting zeros in a shortened singular-value list.

For a tall matrix, the extra rows of Sigma are zero and describe unused output directions. Orthonormal changes of coordinates do not alter vector length within their own spaces; the rectangular diagonal factor is the step that changes dimension. This is why the shapes of all three factors matter as much as their entries.

## A small example you can verify

For the matrix with rows (0,2),(1,0), choose V to swap the two standard basis directions, Sigma with diagonal entries 2 and 1, and U equal to the identity. Then V transpose swaps the input coordinates and Sigma scales the first resulting coordinate by two, giving (2y,x) from input (x,y), exactly as the original matrix does.

The right singular direction (0,1) is stretched by two into output direction (1,0). The right singular direction (1,0) is stretched by one into output direction (0,1). The [singular values](ref:linear-algebra-svd-2) describe nonnegative length factors even though the input and output directions differ. In particular, singular values are not generally eigenvalues.

A semiaxis is the distance from the center of an ellipse to its boundary along one of its perpendicular principal directions.

![A circle becomes an ellipse](figure:la-svd-ellipse)

The input unit circle is sent to an ellipse with horizontal semiaxis two and vertical semiaxis one. If a singular value were zero, the corresponding direction would collapse and the ellipse could flatten into a line segment. An ellipsoid is the higher-dimensional analogue of an ellipse, obtained by scaling a sphere along perpendicular directions. In more dimensions the same stretching idea describes an ellipsoid, although a plane drawing cannot show every direction.

### Signs belong in the directions

For a diagonal matrix with entries -4 and 2, the singular values are four and two. Choose V as identity and U as the reflection with diagonal entries -1 and 1; Sigma then has entries four and two. Multiplying reconstructs the original signs. A negative matrix entry does not require a negative singular value.

For a rectangular matrix with rows (3,0),(0,2),(0,0), full U is three by three, full V two by two, and Sigma three by two. A unit circle in the input plane becomes an ellipse in the first two coordinates of the three-dimensional output. The third left basis vector completes the output basis but does not correspond to an additional positive singular value.

## Connection to rank and eigenvalues

For every input vector x, $x^TA^TAx=\|Ax\|^2\geq0$. The left side is a scalar quadratic expression: each term multiplies two input components, with a fixed matrix coefficient. The right side is squared length. Thus A transpose A is symmetric and [positive semidefinite](ref:linear-algebra-svd-3), meaning this quadratic expression is nonnegative for every real x. The spectral theorem supplies an orthonormal basis of eigenvectors for it, with nonnegative eigenvalues.

The right singular vectors can be chosen as those eigenvectors, and the singular values are the square roots of their eigenvalues. For a positive singular value sigma and corresponding unit right vector v, define the left vector by dividing Av by sigma. This produces the matching unit output direction. Zero singular values require completing orthonormal bases rather than dividing by zero. These facts explain why an SVD exists; they are not a prescription to implement a numerically stable algorithm by explicitly forming A transpose A.

The rank is the number of positive singular values. Each positive value supplies an output direction; each zero input direction lies in the null space. For exact mathematical data this count is exact. Floating-point software must decide which tiny values are effectively zero, so numerical rank depends on a tolerance, meaning a chosen threshold for treating a tiny computed value as zero, and on the scale of the problem.

### The two products live in different spaces

For the two-by-three matrix with rows (3,0,0),(0,2,0), A transpose A is three by three with diagonal (9,4,0). A A transpose is two by two with diagonal (9,4). Both have the same positive eigenvalues, but they have different counts of zero eigenvalues. Their eigenvectors belong to input and output spaces respectively. This resolves the apparent mismatch between two listed positive singular values and a nontrivial null space.

$
A^TA=\begin{pmatrix}9&0&0\\0&4&0\\0&0&0\end{pmatrix},\quad AA^T=\begin{pmatrix}9&0\\0&4\end{pmatrix}
$

For positive singular values, the constructed left vectors are orthonormal: the dot product of Av and Aw equals v transpose times A transpose A times w, which vanishes for distinct chosen orthonormal right directions and becomes the squared singular value for matching directions. Dividing by the positive scale factors gives unit lengths. A basis for any remaining output directions is chosen perpendicular to these. Repeated singular values permit several valid orthonormal choices; an SVD is not generally unique.

## Approximation and responsible interpretation

A rank-k [truncated SVD](ref:la-term-truncated-svd) keeps the k largest singular values and replaces the others by zero. Here k is a nonnegative integer no larger than the rank. Rank-k means at most k independent output directions. This simplification can store or process an approximation using fewer directions.

The [Frobenius norm](ref:linear-algebra-svd-4) of a matrix is the square root of the sum of the squares of all its entries. A fundamental approximation theorem says that truncated SVD minimizes the [Frobenius norm](ref:la-term-frobenius) of the difference among matrices of rank at most k. We state this theorem without its proof. Its squared error equals the sum of the squares of the discarded singular values. Tied singular values can make the best approximation nonunique.

For a diagonal matrix with entries 4 and 1, keeping only the first direction gives diagonal entries 4 and 0. The Frobenius error is one. A nonzero component of the original transformation was discarded; this is a controlled approximation, not exact recovery. In image compression, the entries can represent intensities; in data analysis, low-rank structure can summarize coordinated variation.

Large singular values do not automatically identify scientifically important causes, and a small singular value can still carry meaningful information. Data scaling and the chosen error measure matter. Your goal here is to read and verify a supplied SVD, connect it to rank and geometry, and explain what truncation keeps and loses. Computing a large SVD from scratch is beyond this introductory sequence.

### What a low-rank approximation promises

For singular values five, three, and one, retaining two directions discards squared error one; retaining only one discards squared error ten. The Frobenius errors are respectively one and square root of ten. Squared error and error norm are different quantities. Keeping zero directions gives the zero matrix and loses all three contributions; keeping every positive direction recovers A exactly.

The positive smallest singular value of a square invertible matrix controls its weakest stretch. Its reciprocal is the largest stretch of the inverse, so a very small value can amplify measurement errors when solving backward. For diagonal entries one and one hundredth, changing the second output by one hundredth changes the recovered second input by one. This is a concrete sensitivity calculation, not a reason to declare every small direction meaningless.

The roadmap's goal is conceptual SVD: interpret factor shapes, reconstruct small supplied decompositions, connect rank and null spaces, and quantify truncation error. It does not promise algorithms for large matrices or a proof of the approximation theorem. Those boundaries should remain explicit while the examples and practice within them are substantial.
