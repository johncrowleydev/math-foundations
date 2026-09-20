# Rank, Nullity, Determinants, and Inverses

A matrix can have many entries yet supply only a few independent output directions. Bases let us count those directions and the input freedom that disappears. This lesson uses elimination to find both kinds of information, then connects them to determinants, inverse matrices, and the separate questions of whether a system has a solution and whether that solution is unique. You will use the basis, dimension, and ordered-coordinate ideas from the preceding lesson, together with row reduction and matrix multiplication.

## Rank and nullity

The column space of a matrix is the span of its columns, hence the set of reachable outputs. The [rank](ref:la-term-rank) is its dimension. Elimination finds rank by counting pivots: each pivot column supplies an independent output direction, and the other columns add no new direction.

The null space is the set of input vectors sent to zero. Its dimension is the [nullity](ref:la-term-nullity), the number of free variables in the homogeneous system. These are input changes that leave the output unchanged. For a matrix with n columns, $\operatorname{rank}(A)+\operatorname{nullity}(A)=n$. Read this as “rank of A plus nullity of A equals n.” Every input variable is either a pivot variable or a free variable, which explains the count. The sum counts columns, not rows or matrix entries.

For the matrix with columns (1,0), (0,1), and (1,1), rank is two. The first two columns already reach every two-component output, and the third is their sum. The zero-output equations are x+z=0 and y+z=0. Setting z=t gives (x,y,z)=t(-1,-1,1), so nullity is one. Direct substitution gives (-t+t,-t+t)=(0,0). This matrix reaches every two-component output but loses one independent direction of its three-component input.

For an m-by-n matrix, rank is at most the smaller of m and n: there cannot be more pivots than rows or columns. Full column rank means rank n; full row rank means rank m. A four-by-three matrix of rank three has full column rank and nullity zero, but not full row rank. A two-by-three matrix of rank two has full row rank but nullity one. The number of equations alone cannot decide how much freedom remains.

## Finding both spaces in one reduction

Take A with rows (1,2,1), (2,4,3), and (1,2,1). Reduce it using the following reversible steps:

1. Subtract twice row one from row two, giving (0,0,1).
2. Subtract row one from row three, giving (0,0,0).
3. Subtract the new row two from row one, giving (1,2,0).

The reduced rows are (1,2,0), (0,0,1), and (0,0,0). Pivots occur in columns one and three, so rank is two. A basis of the column space is the corresponding pair of **original** columns, (1,2,1) and (1,3,1). The second original column is twice the first. The chosen columns are independent: subtracting twice the first-coordinate equation from the second-coordinate equation in a zero combination forces the coefficient on (1,3,1) to vanish, and then the other coefficient vanishes too.

Do not take (1,0,0) and (0,1,0) from the reduced matrix as a basis of the original column space. Every original column has equal first and third components, whereas (1,0,0) does not. Row operations preserve the coefficient relations among columns because they preserve solutions of the homogeneous system. They can change the actual output vectors and the column space itself.

For the null space, use the reduced equations x+2y=0 and z=0. Let y=t; then every solution is t(-2,1,0). Thus the single vector (-2,1,0) is a null-space basis. It spans all solutions and is nonzero, hence independent. Check it in the original matrix: the row products are -2+2=0, -4+4=0, and -2+2=0. Rank two plus nullity one equals the three input coordinates.

The same homogeneous equations arise for the smaller matrix with rows (1,2,0),(0,0,1). Its column-space basis is (1,0),(0,1), and its null-space basis is again (-2,1,0). Here the column space lies in the two-component output space while the null space lies in the three-component input space:

$
\begin{pmatrix}1&2&0\\0&0&1\end{pmatrix}\begin{pmatrix}-2\\1\\0\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}
$

### The row space uses a different rule

The row space is the span of the row vectors. Reversible row operations preserve that span: each new row is a combination of old rows, and the reverse operations express old rows using new ones. The nonzero rows of an echelon form are independent because their leading nonzero positions are distinct. In a zero combination, inspect the first pivot column to force the first coefficient to zero, then the next pivot column, and continue. Those rows therefore form a row-space basis.

For the three-by-three example, (1,2,0) and (0,0,1) are a row-space basis. Both the row-space and column-space dimensions equal the pivot count, two, even though the actual spaces need not be equal. Original pivot columns, reduced nonzero rows, and homogeneous solution vectors are three different recipes; choose the one that answers the question asked.

## What a determinant measures in the plane

For a two-by-two matrix with rows (a,b),(c,d), the determinant is the scalar $ad-bc$. The letters are the four entries; this is one number, not a matrix. For rows (2,1),(1,1), the calculation is 2 times 1 minus 1 times 1, giving one.

For columns (a,c) and (b,d), the absolute value of the determinant is the area of their parallelogram. Its sign records orientation relative to the standard axes. Zero means the parallelogram collapses into a line or point, so an independent output direction has been lost. A two-by-two matrix has a two-sided inverse exactly when this determinant is nonzero; we will calculate that inverse next.

For example, rows (1,2),(2,4) give determinant 4-4=0. The second column is twice the first, so all outputs lie on the line of multiples of (1,2). The distinct inputs (0,0) and (-2,1) both produce zero. No operation can recover which input was used from that output alone.

Area scaling describes this [two-dimensional determinant](ref:la-term-determinant-plane); it does not describe the length scaling of every vector. The diagonal matrix with entries two and one doubles areas, but it leaves (0,1) unchanged. Swapping the standard coordinate directions has determinant negative one: it reverses orientation while leaving area magnitude unchanged. Keep the sign and magnitude separate when interpreting a determinant.

## Invertible matrices

A square matrix A is invertible if there is a matrix written $A^{-1}$ such that multiplying in either order gives the identity. The superscript negative one means matrix inverse here. It does not mean taking the reciprocal of each entry. The identity matrix itself contains zeros, so entrywise reciprocals are not even defined for every invertible matrix.

The inverse undoes A. If Ax=b, multiply on the left by the inverse to obtain x equal to A inverse times b. An n-by-n matrix is invertible exactly when its rank is n: elimination then leaves no free variables and permits every right-hand side. Its columns consequently form a basis of the full output space. If a nonzero vector z satisfies Az=0, an inverse would force z=0 after multiplying, a contradiction.

### Calculating and checking a two-by-two inverse

For rows (a,b),(c,d) with nonzero determinant, swap the diagonal entries, negate the off-diagonal entries, and divide every entry by the determinant. The proposed inverse has rows (d,-b),(-c,a), divided by ad-bc. Multiplying gives diagonal entries (ad-bc)/(ad-bc)=1 and off-diagonal entries zero in both orders. This verifies the rule and also explains why division by a zero determinant is forbidden.

For rows (2,1),(1,1), the determinant is one, so the inverse has rows (1,-1),(-1,2). In the product of A with this inverse, the first row is (2-1,-2+2)=(1,0), and the second is (1-1,-1+2)=(0,1). In the reverse product, the rows are (2-1,1-1)=(1,0) and (-2+2,-1+2)=(0,1). Both checks return identity.

For the diagonal matrix with entries two and three, this rule gives diagonal entries one half and one third. Diagonal matrices are a special easy case; their behavior does not justify reciprocating every entry of an arbitrary matrix.

### Two short proofs about undoing a matrix

An inverse, if it exists, is unique. If B and C both invert A, then B=B(AC)=(BA)C=C. Each substitution uses one identity equation, and the middle rearrangement uses associativity. It never exchanges the order of the factors.

For invertible square A and B of the same size, the inverse of AB is B inverse times A inverse. In the forward product, the adjacent B and B inverse cancel first, leaving A times A inverse. In the reverse product, A inverse and A cancel first, leaving B inverse times B. Both products are identity. Read the action order carefully: AB applies B first, then A; undo A first, then B. Reversing the factors is essential.

## Solving without unnecessary inverses

To compute an inverse by elimination, augment A with an identity matrix and row-reduce the left side to identity. The same operations transform the right side into the inverse. If the left side cannot become identity, the inverse does not exist. Each right-hand column is solving the same coefficient system with a different standard basis output.

For A with rows (1,2),(0,1), start with augmented rows (1,2 | 1,0) and (0,1 | 0,1). Subtract twice row two from row one. The rows become (1,0 | 1,-2) and (0,1 | 0,1). The left side is identity; the right side has rows (1,-2),(0,1), the inverse. Its first column solves Ax=(1,0), and its second column solves Ax=(0,1).

A known inverse can be useful. With A having rows (2,1),(1,1) and inverse rows (1,-1),(-1,2), solving Ax=(5,3) gives x=(5-3,-5+6)=(2,1). Check in the original equations: twice 2 plus 1 is 5, and 2 plus 1 is 3.

For one system, direct elimination is usually the more natural method. In this example the equations are 2x+y=5 and x+y=3. Subtract the second from the first to get x=2, then y=1. There was no need to solve the additional systems required to find an inverse. Knowing an inverse exists is a structural statement; explicitly forming it is a separate computational choice. Numerical software also provides system solvers that factor the matrix and solve without constructing its inverse.

## Existence and uniqueness

Rank separates [uniqueness](ref:linear-algebra-bases-4) from existence. For a particular right-hand side b, a solution exists exactly when b is in the column space. Every right-hand side is reachable exactly when the matrix has full row rank. A reachable right-hand side has a unique input exactly when the null space contains only zero, equivalently when the matrix has full column rank.

To see the uniqueness claim, subtract any two solutions of Ax=b. Their difference is a null vector. If nullity is zero, that difference must vanish. If there is a nonzero null vector, adding any multiple of it to one solution gives another solution with the same output. This produces infinitely many solutions for every reachable output, but does not make an unreachable output reachable.

For a concrete tall matrix, take columns (1,0,1) and (0,1,1). It sends input (s,t) to (s,t,s+t), has rank two, and has nullity zero. Target (2,-1,1) has exactly one input, (2,-1); target (0,0,1) has none. Independent columns ensure at most one solution, not existence for every three-component target.

For a concrete wide matrix, take rows (1,0,1),(0,1,1). Given any target (r,s), input (r,s,0) reaches it. So does (r-t,s-t,t) for every real t. Its rank is two, equal to its number of rows, and nullity is one. Here every target is reachable, but none has a unique input.

Only in the square full-rank case do both requirements combine into invertibility. A square matrix with deficient rank can miss outputs and also have many inputs for the outputs it does reach. For rectangular matrices, a two-sided inverse of the usual kind is unavailable. A one-sided inverse can exist, but that is a different claim and must specify the multiplication order.

When naming a basis, specify its space. When naming coordinates, specify the ordered basis. When counting rank, distinguish the number of rows or columns from the number of pivots. When deciding whether Ax=b can be solved, ask about existence and uniqueness separately.
