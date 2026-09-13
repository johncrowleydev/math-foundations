# Span and Linear Independence

Elimination tells us whether a target output can be built from a matrix's columns. We now give that question a name and ask a second one: if an output can be built, is there only one way to build it? These are different questions. A collection may reach every desired vector yet contain unnecessary building blocks.

## Span is everything you can build

The span of a collection of vectors is the set of all their linear combinations, using arbitrary real coefficients. We write $\operatorname{span}\{u,v\}$ for the span of u and v, read “the span of u and v.” Braces specify the supplied collection, while span denotes all outputs obtainable from it. The vectors in this lesson belong to a fixed real coordinate space.

The span of a single nonzero vector is a line through the origin. The span of (1,0) and (0,1) is the whole coordinate plane. The span of (1,1) and (2,2) is only the diagonal line through (1,1): the second vector gives no direction that the first could not already produce. The zero vector belongs to every span, because all coefficients can be zero.

To test whether b lies in a given span, place the supplied vectors in the columns of a matrix A and solve Ax=b. A solution provides coefficients that build b. An inconsistent system proves that no such combination exists. This turns a geometric reachability question into a calculation you already know.

## Independence means no redundant direction

A collection is [linearly independent](ref:linear-algebra-span-2) if the only linear combination producing the zero vector has every coefficient zero. It is linearly dependent if a zero combination exists with at least one nonzero coefficient. “Nonzero combination” here refers to the coefficients; the resulting vector is zero.

Why test combinations that give zero? If two different coefficient lists produce the same output, subtracting the two equations gives a zero combination with some nonzero coefficient. Conversely, a nonzero coefficient in a zero combination allows one vector to be expressed using the others. Dependence is therefore exactly a form of redundancy.

For u=(1,1) and v=(2,2), $2u-v=0$ exhibits dependence. For the standard vectors (1,0) and (0,1), a zero combination forces each coordinate coefficient to zero, so they are independent. Any collection containing the zero vector is dependent: put coefficient one on that vector and zero on all the others.

## Subspaces and the origin

A [subspace](ref:linear-algebra-span-3) of a real coordinate space is a subset that contains zero and is closed under vector addition and real scalar multiplication. Closed means that performing the operation on members stays inside the subset. These conditions let the subset function as a vector space with the inherited operations.

Every span is a subspace. Adding two combinations adds their coefficients, and scaling a combination scales its coefficients, so neither operation escapes the span. A line through the origin is an example; the line of points satisfying x+y=1 is not, because it does not contain zero.

The null space of A is the set of solutions of Ax=0. It is a subspace of the input space: zero solves the equation, sums of solutions solve it, and scalar multiples solve it. The column space of A is the span of its columns, hence the set of possible outputs. It is a subspace of the output space. These spaces need not have the same ambient dimension when A is rectangular.

## Reading independence from elimination

Put the proposed vectors in the columns of A. They are [independent](ref:linear-algebra-span-4) exactly when Ax=0 has no free variables, since that is exactly when its only solution is zero. For example, columns (1,0,1) and (0,1,1) are independent: a combination producing zero forces its coefficients to zero by looking at the first two coordinates.

Those two independent vectors do not span all three-dimensional space. Their combinations have third coordinate equal to the sum of the first two. They span a plane through the origin. Independence describes the absence of redundancy; spanning a specified space describes coverage. Always name the space you claim to span.

If you seek a target in this plane, its coefficients are unique. A target outside it has no representation. If you add a redundant third vector to the collection, some targets can have many representations without expanding the plane at all. The next lesson uses a basis to retain both coverage and uniqueness.

When presenting a dependence argument, give actual coefficients or an explicit expression of one vector through the others. When presenting independence, explain why every zero combination forces all coefficients to vanish. A drawing can suggest the answer, but the component argument establishes it.
