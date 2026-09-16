# Orthogonality and Projections

A target vector may lie outside the subspace we are allowed to use. We can still ask for the closest vector in that subspace. Orthogonality turns this distance question into a calculation: the part left over must be perpendicular to every permitted direction.

You will use dot products, lengths, spans, and matrix multiplication to construct projections, explain why they are closest, and build orthonormal directions with Gram–Schmidt. Keep three objects separate as you work: a scalar coefficient, the projected vector, and the residual vector. The next lesson uses this geometry to fit models to observations that cannot all be matched exactly.

## Projecting onto a line

Let u be a nonzero real vector and b a target in the same coordinate space. Every point on the line spanned by u has the form c times u, where c is a real scalar. To find the [projection](ref:linear-algebra-projections-1), choose c so that the difference b minus c times u is perpendicular to u. Taking its dot product with u gives b dot u minus c times u dot u equal to zero. Solving for c gives

$p=\frac{b\cdot u}{u\cdot u}u$.

Read this as “b dot u divided by u dot u, times u.” The denominator is positive because u is nonzero. The fraction is the scalar coefficient; multiplying by u produces the vector p on the permitted line. A negative coefficient is allowed: it places p in the direction opposite to u.

The [residual](ref:la-term-residual) r is the difference b-p, pointing from the approximation to the target. Substituting the coefficient just found makes its dot product with u zero. For b=(3,1) and u=(1,0), the projection is (3,0) and the residual is (0,1). Adding the projection and residual recovers b.

![The closest point and residual](figure:la-projection)

### A non-axis projection with exact arithmetic

Let b=(3,0) and u=(1,2). Their dot product is three and u dot u is five, so the coefficient is 3/5. The projected vector is (3/5,6/5), and the residual b-p is (12/5,-6/5). Its dot product with u is 12/5-12/5=0. Squaring and adding its components gives 144/25+36/25=36/5. This is the squared distance to the line; the distance itself is the square root of 36/5. Reporting only the coefficient 3/5 would not report the point on the line.

Replacing u by any nonzero scalar multiple gives the same line and the same projected vector. For instance, using (2,4) changes the coefficient to 3/10 but still gives (3/5,6/5). In general, the numerator scales once, the denominator twice, and the final direction vector once, so the changes cancel. Zero is excluded: it supplies no line direction and would make the denominator zero.

## Why perpendicular means closest

The line formula gives a perpendicular residual, but why does that prove minimal distance? Let p be the projected point and q any other point on the line. The displacement from q to b is the sum of p-q, which lies along the line, and b-p, which is perpendicular to it. The Pythagorean theorem says the squared distance from b to q equals the squared residual length plus the squared distance from p to q. The extra term is nonnegative and vanishes only when q=p. Thus p is the unique closest point.

The same argument works for a plane or any subspace: if p lies in that subspace and b-p is perpendicular to every vector in it, p is the unique closest point. Perpendicularity to one direction is enough for a line, but a larger subspace requires a check against every basis direction. Perpendicularity to a basis then implies perpendicularity to every linear combination of those basis vectors, by distributing the dot product.

Two limiting cases are useful checks. If b already lies in the permitted subspace, p=b and the residual is zero. If b is perpendicular to the whole subspace, p=0 and the residual is b. In the second case every nonzero candidate adds a positive squared distance term. A nonzero residual therefore need not signal a mistake: it measures the part of the target the permitted subspace cannot reproduce.

## Orthonormal directions

A collection of nonzero vectors is orthogonal when distinct vectors have zero dot product. It is [orthonormal](ref:linear-algebra-projections-2) when each vector also has norm one. For example, (2,0,0) and (0,0,3) are orthogonal but not orthonormal. Dividing each by its own length gives (1,0,0) and (0,0,1). Nonzero orthogonal vectors are independent: taking the dot product of a zero linear combination with each vector in turn forces each coefficient to be zero. They therefore form a basis for their span.

For an orthogonal basis, add the line projection onto each basis direction to project onto the whole subspace. For an orthonormal basis q1 through qk, the unit lengths remove the denominators: add b dot q1 times q1, then b dot q2 times q2, and so on. Each residual dot product is zero because all cross terms vanish. This is why independently adding line projections requires orthogonal directions; arbitrary basis vectors can count overlapping components more than once.

For a matrix Q whose columns are these orthonormal basis vectors, this becomes $p=QQ^Tb$. Read the multiplication from right to left. Q transpose times b computes one dot product per column; multiplying those coefficients by Q rebuilds p. If Q has n rows and k columns, the coefficient vector has k components, while b and p each have n.

The orthonormal condition is $Q^TQ=I$. Each entry of this k-by-k product is a dot product of two columns: one on the diagonal, zero elsewhere. The reverse product Q times Q transpose is n-by-n and need not be the identity. It projects onto Q's column space, which may be smaller than the whole output space.

For example, let Q have columns (1,0,0) and (0,0,1), and take b=(2,-1,4). The coefficient vector is (2,4), the projection is (2,0,4), and the residual is (0,-1,0). The residual is perpendicular to both columns. Here Q transpose Q is the two-by-two identity, whereas Q Q transpose has diagonal entries 1,0,1: it removes the middle component.

## Carrying out Gram–Schmidt

An independent list usually does not arrive orthogonal. [Gram–Schmidt](ref:la-term-gram-schmidt) turns it into an orthonormal list with the same span. First normalize the first vector. For each later vector, subtract its projections onto all the orthonormal directions already retained. Normalize the remainder to get the next direction. Subtract before normalizing: normalization changes length but cannot remove an unwanted component along an earlier direction.

Start with independent vectors a=(1,1,0) and b=(1,0,1). The length of a is the square root of two, so q1=(1,1,0) divided by the square root of two. The dot product of b with q1 is 1 divided by the square root of two. Multiplying this coefficient by q1 gives the projection (1/2,1/2,0).

Subtracting from b leaves (1/2,-1/2,1). Its dot product with a is 1/2-1/2=0, as required. Its squared length is 1/4+1/4+1=3/2. Dividing by the square root of 3/2 gives q2=(1,-1,2) divided by the square root of six. The squared length of q2 is (1+1+4)/6=1, and q1 dot q2 is zero.

Check the span as well as the dot products. The original a is the square root of two times q1. The original b is 1 divided by the square root of two times q1, plus the square root of 3/2 times q2. Conversely, each new direction was made from the original vectors by subtraction and nonzero scaling. Each list can therefore rebuild the other.

Independent input guarantees a nonzero remainder in exact arithmetic. If a later vector is already in the span of retained directions, subtracting its entire projection leaves zero. For instance, following a=(1,1,0) with (2,2,0) leaves no new direction. Zero has norm zero and cannot be normalized. Discard the redundant vector and continue if the aim is a basis for the same span. The order can change the orthonormal basis produced, while preserving the final span.

## QR as a record of the construction

Gram–Schmidt also explains the meaning of [QR factorization](ref:la-term-qr). For a matrix A with independent columns, put the orthonormal directions in Q and the coefficients rebuilding the original columns in R, so A=QR. R is upper triangular: entries below its main diagonal are zero. The first original column uses only the first retained direction, the second uses only the first two, and so on.

In the two-vector construction above, R has first row (square root of two, 1 divided by the square root of two) and second row (0, square root of 3/2). Multiplying Q by the first column of R gives a; multiplying by the second gives b. This is a record of the reconstruction already checked, not a second basis change to perform.

Here Q can be rectangular: it has as many rows as A and one column per independent direction. Q transpose Q is identity, but Q transpose need not be a two-sided inverse. We introduce QR to distinguish orthonormal directions from their combination coefficients and to prepare for the numerical-method discussion in least squares. The required construction remains the small Gram–Schmidt example, rather than a full numerical QR algorithm.
