# Bases, Dimension, Rank, and Inverses

A useful coordinate system provides enough building blocks to describe every object under consideration, but no redundant ones. A basis captures this balance. It connects the number of genuine degrees of freedom to elimination and to the possibility of undoing a matrix operation.

## A basis gives unique coordinates

A basis of a subspace is an ordered list of vectors that is linearly independent and spans that subspace. Independence ensures uniqueness of the coefficient list; spanning ensures existence. Although the basis vectors themselves form a collection, we choose an order when using their coefficients as coordinates.

For the plane, p=(1,1) and q=(1,-1) form a basis. The vector (4,2) equals three p plus one q, so its coordinates in this ordered basis are (3,1). These are not its usual horizontal and vertical coordinates. Both lists describe the same vector relative to different building blocks.

The [dimension](ref:la-term-dimension) of a subspace is the number of vectors in a basis. A fundamental finite-dimensional result says that every basis of the same space has the same size. One way to understand why is an exchange argument: independent vectors can replace members of a spanning list one at a time, and there cannot be more independent replacements than available members. Applying this in both directions to two bases forces equal sizes.

Here is the replacement argument more explicitly. Start with a spanning list of n vectors and an independent list u1 through um. Express u1 using the spanning list. Some coefficient is nonzero, so solve for that spanning vector and replace it by u1 without losing the span. At step j, express uj using the previous replacements and the remaining old vectors. Some coefficient on an old vector must be nonzero: otherwise uj would be a combination of u1 through u(j-1), contradicting independence. Replace that old vector. If m exceeded n, after n replacements the next independent vector would already lie in their span, again a contradiction. Thus an independent list has no more vectors than any spanning list. Two bases give the two opposite inequalities.

Thus the coordinate plane has dimension two, a line through the origin has dimension one, and the subspace containing only zero has dimension zero, with an empty basis. Two vectors in three-dimensional space can be a basis of a plane without being a basis of the entire space.

### Extracting a basis rather than guessing one

If a spanning list contains a redundant vector, remove that vector without changing the span. Repeat until no redundancy remains; the resulting list is a basis. In the opposite direction, an independent list can be extended toward a desired finite-dimensional space by adding a vector outside its current span. Each addition expands the span while preserving independence.

For vectors (1,0,1), (0,1,1), and (1,1,2), the first two already span the third. They form a basis of the plane whose third coordinate is the sum of the first two, with dimension two. They do not form a basis of the full three-dimensional ambient space. A basis statement always names the space.

## Rank and nullity

The [rank](ref:la-term-rank) of a matrix is the dimension of its column space, the number of independent output directions its columns supply. Elimination finds it by counting pivot columns. To obtain a basis of the column space, take the pivot-indexed columns of the original matrix, not the changed columns of its row-reduced form. Row operations preserve dependencies among columns but can change the column space itself.

The [nullity](ref:la-term-nullity) is the dimension of the null space, or equivalently the number of free variables in the homogeneous system. For a matrix with n columns, $\operatorname{rank}(A)+\operatorname{nullity}(A)=n$. Read this as “rank of A plus nullity of A equals n.” Every input variable is either a pivot variable or a free variable, which explains the count.

For the matrix with columns (1,0), (0,1), and (1,1), rank is two and nullity is one. The third column adds no output direction, and coefficients (-1,-1,1) give a null-space direction. The matrix reaches every two-component output but loses some information about the three-component input.

### Finding both spaces in one reduction

Take A with rows (1,2,0),(0,0,1). The pivot columns are first and third, so a column-space basis is (1,0),(0,1). For the null space, the equations are x+2y=0 and z=0. Letting y=t gives all multiples of (-2,1,0). Rank is two, nullity one, and their sum is the three input coordinates.

$
\begin{pmatrix}1&2&0\\0&0&1\end{pmatrix}\begin{pmatrix}-2\\1\\0\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}
$

The nonzero rows of a row-echelon form form a basis of the row space. Their distinct leading positions make them independent, and reversible row operations preserve their span. Consequently row-space dimension equals column-space dimension: both count pivots. For an m-by-n matrix, rank is at most the smaller of m and n. A full-column-rank matrix has rank n; a full-row-rank matrix has rank m.

## Invertible matrices

A square matrix A is invertible if there is a matrix written $A^{-1}$ such that multiplying in either order gives the identity. The superscript negative one means matrix inverse here. It does not mean taking the reciprocal of each entry.

The inverse undoes A. If Ax=b, multiply on the left by the inverse to obtain x equal to A inverse times b. An n by n matrix is invertible exactly when its rank is n: elimination then leaves no free variables and permits every right-hand side. Its columns consequently form a basis of the full output space.

The diagonal matrix with diagonal entries 2 and 3 is inverted by the diagonal matrix with entries one half and one third. More generally, for a two by two matrix with rows (a,b),(c,d), the determinant is the scalar $ad-bc$. If it is nonzero, the inverse has rows (d,-b),(-c,a), all divided by that determinant. Multiplying the proposed inverse by the original verifies the formula. If the determinant is zero, elimination gives deficient rank and there is no inverse.

### What a determinant measures in the plane

For columns (a,c) and (b,d), the absolute value of ad-bc is the area of the parallelogram they form. Its sign records orientation relative to the standard axes. Zero means the parallelogram collapses into a line or point, precisely the loss of an independent direction that prevents a two-by-two inverse. Area scaling describes this [two-dimensional determinant](ref:la-term-determinant-plane); it is not the length scaling of every vector.

For rows (2,1),(1,1), the determinant is one and the inverse has rows (1,-1),(-1,2). The first product row is (2-1,-2+2)=(1,0), and the second is (1-1,-1+2)=(0,1). This verifies the proposed inverse directly. The inverse of a product AB of invertible square matrices is B inverse times A inverse: undo the last action first.

## Solving without unnecessary inverses

To compute an inverse by elimination, augment A with an identity matrix and row-reduce the left side to identity. The same operations transform the right side into the inverse. If the left side cannot become identity, the inverse does not exist.

For solving one system, however, applying elimination directly to its right-hand side is usually the more natural method. Knowing that an inverse exists is a structural statement; explicitly forming it is a separate computational choice. Numerical software often solves systems without constructing an inverse.

Rank also separates [uniqueness](ref:linear-algebra-bases-4) from existence. A rectangular matrix can have independent columns and therefore at most one solution for each output, while still missing some outputs. A matrix can reach every output and still admit many inputs for each. Only in the square full-rank case do these two requirements combine into invertibility.

When naming a basis, specify its space. When naming coordinates, specify the ordered basis. When counting rank, distinguish the number of rows or columns from the number of pivots: the whole point is that a large array can contain less independent information than its size suggests.

### Seeing inverse elimination as solving several systems

For A with rows (1,2),(0,1), start with augmented rows (1,2,1,0) and (0,1,0,1), where the last two columns are identity. Subtract twice row two from row one. The left side becomes identity and the right side has rows (1,-2),(0,1), the inverse. Each right-hand column has solved the same coefficient system with a different standard basis output.

The number of equations alone cannot decide existence or uniqueness. Full column rank means no two inputs share an output; full row rank means every declared output is reachable. In a square matrix these ranks coincide. For rectangular matrices they answer different questions, and a two-sided inverse of the usual kind is unavailable. A one-sided inverse can exist, but is a different claim that must specify the multiplication order.
