# Eigenvalues and Eigenvectors

A transformation can mix coordinates in a way that makes repeated application difficult to understand. Some directions are simpler: the transformation sends a vector straight along its existing line, perhaps reversing it or collapsing it to zero. Finding these directions can turn a matrix problem into several scalar scaling problems.

## Directions that are only scaled

For a square matrix A, a nonzero vector v is an [eigenvector](ref:linear-algebra-eigenvalues-1) if $Av=\lambda v$ for some scalar lambda, its eigenvalue. Read the equation as “A times v equals lambda times v.” The Greek letter lambda names a number; v must be nonzero, since zero would satisfy the equation for every number and tell us nothing.

For the diagonal matrix with entries 2 and 3, the first standard vector is scaled by two and the second by three. Those are eigenvectors with different eigenvalues. The vector (1,1) is sent to (2,3), so it is not an eigenvector: no single scalar multiplies both original components to give the result.

A negative eigenvalue reverses the vector as well as changing its length. A zero eigenvalue sends a nonzero vector to zero, so a matrix with zero as an eigenvalue is not invertible. Multiplying an eigenvector by any nonzero scalar produces another eigenvector for the same eigenvalue. An eigendirection therefore has many representative vectors.

## Finding eigenvalues in two dimensions

Rearrange the defining equation to $(A-\lambda I)v=0$. The identity has the same size as A. To have a nonzero solution v, the matrix A minus lambda times identity must be singular, meaning not invertible. For two by two matrices, its determinant must therefore be zero.

Take A with rows (2,1),(0,3). Its determinant condition is $(2-\lambda)(3-\lambda)=0$, so the possible eigenvalues are 2 and 3. For lambda equal to 2, solving the homogeneous equations forces the second component of v to zero, giving direction (1,0). For lambda equal to 3, the components must agree, giving direction (1,1). Check each direction in the original matrix equation.

For a fixed eigenvalue, the [eigenspace](ref:linear-algebra-eigenvalues-2) is the null space of A minus lambda times identity. It includes zero so that it is a subspace, although zero itself is not an eigenvector. The determinant equation identifies candidate scalars; solving a homogeneous system identifies their vectors. Do not stop after finding the eigenvalues if the question also asks for directions.

## An eigenbasis simplifies repeated action

A matrix is [diagonalizable](ref:linear-algebra-eigenvalues-3) over the real numbers if it has a basis of real eigenvectors. Put those basis vectors in the columns of P and their matching eigenvalues on the diagonal of D. The equation $AP=PD$ records all the eigenvector equations at once. Since P is invertible, this gives $A=PDP^{-1}$.

This factorization has an operational reading: change from standard coordinates to eigenvector coordinates, scale each coordinate separately with D, then change back. Repeating A repeatedly cancels adjacent inverse changes of basis. For a positive integer k, $A^k=PD^kP^{-1}$. Powers of a diagonal matrix simply raise its diagonal entries to the corresponding powers.

For the triangular example above, (2,1) equals one copy of (1,0) plus one copy of (1,1). Applying A twice gives four copies of the first eigenvector plus nine copies of the second, or (13,9). This explains the repeated transformation without multiplying out A squared first.

## Limits and interpretation

Not every real square matrix has an eigenbasis. The matrix with rows (1,1),(0,1) has only eigenvalue one, but its eigenvectors lie on the horizontal axis. There are not enough independent eigenvectors to form a basis of the plane. Repeating an eigenvalue on a list does not supply a missing direction.

A right-angle rotation has no real eigenvectors: every nonzero real direction turns to a perpendicular direction. Complex numbers extend the theory, but our calculations here stay over the real numbers. “No real eigenvector” is not the same claim as “no eigenvector over any number system.”

A real symmetric matrix, meaning A transpose equals A, has an orthonormal eigenbasis. This [spectral theorem](ref:linear-algebra-eigenvalues-4) is a structural result we use without proving it here. It will underpin the next lesson's SVD. General matrices need not have perpendicular eigenvectors; the two directions in our triangular example are not perpendicular.

Eigenvalues can reveal growth or decay under repeated transformations when an eigenbasis is available. A component in a direction with eigenvalue two doubles each time; one with eigenvalue one half shrinks. Whether a particular input exhibits a direction's behavior depends on whether it has a nonzero component in that direction. Avoid inferring every trajectory from the largest eigenvalue alone without checking the assumptions.
