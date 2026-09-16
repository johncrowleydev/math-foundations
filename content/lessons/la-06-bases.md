# Bases, Coordinates, and Dimension

A useful coordinate system provides enough building blocks to describe every vector under consideration, but no redundant ones. A basis captures this balance. This lesson turns span and independence into a practical way to describe a subspace: choose its building blocks, find coordinates, and count its genuine degrees of freedom. Keep the space being described in view throughout; a basis of a plane need not describe the whole space surrounding it.

## A basis gives unique coordinates

A basis of a subspace is a collection of vectors that spans that subspace and is linearly independent. Spanning means that every vector in the subspace has a representation using the basis vectors. Independence means that the representation is unique. When we use the coefficients as coordinates, we put the basis vectors in a specified order.

For the plane, take p=(1,1) and q=(1,-1). To express (4,2) as cp+dq, compare components: c+d=4 and c-d=2. Adding these equations gives 2c=6, so c=3; then d=1. Reconstruction checks the answer: three p plus one q is (3,3)+(1,-1)=(4,2). The coordinates in the ordered basis (p,q) are (3,1), while the standard horizontal and vertical coordinates remain (4,2).

This calculation works for every target (x,y): solve c+d=x and c-d=y to get c=(x+y)/2 and d=(x-y)/2. Thus p and q span the entire plane. For a zero target the same equations force c=d=0, proving independence. Both parts matter; solving for just one target would not prove that a list is a basis of the plane.

Order matters. In the ordered basis (q,p), that same vector (4,2) has coordinates (1,3). If instead we keep the ordered basis (p,q) but use the coefficients (1,3), reconstruction gives (4,-2), a different vector. A coordinate list is meaningful only together with its ordered basis.

### Why there cannot be two coordinate lists

Suppose two lists of coefficients produced the same vector from a basis. Subtract the representations. The result is a zero combination of the basis vectors, with coefficients equal to the differences between the two lists. Independence forces every difference to be zero. This proves uniqueness without assuming anything special about the particular basis above.

Spanning supplies existence only for vectors in the named subspace. If a basis describes a plane inside three-dimensional space, a vector outside that plane has no coordinates in that basis. That failure is not a failure of the basis; it is a mismatch between the target and the space.

## Extracting a basis rather than guessing one

Suppose a spanning list contains u=(1,0,1), v=(0,1,1), and w=(1,1,2). We can see that w=u+v. Removing w preserves the span: any combination au+bv+cw can be rewritten as (a+c)u+(b+c)v. Conversely, any combination of u and v is a combination of the original list with coefficient zero on w.

Now verify independence of what remains. A zero combination su+tv has components (s,t,s+t). The first two components force s=t=0. Therefore (u,v) is a basis of the original span. We have checked both requirements, rather than concluding that two surviving vectors must be a basis merely because one vector was removed.

We can also identify the space explicitly. Every combination of u and v has the form (s,t,s+t), and every vector whose third coordinate is the sum of its first two can be written this way. The basis describes exactly that plane. For example, (2,-1,1)=2u-v, so its coordinates in (u,v) are (2,-1). The vector (0,0,1) is outside the plane because its third coordinate is not the sum of its first two.

The same reasoning extracts a basis from a finite spanning list. Find a nontrivial zero combination, choose a vector whose coefficient is nonzero, and solve for that vector in terms of the others. Remove it and repeat until the remaining list is independent. Do not remove an arbitrary vector just because the whole list is dependent: in the list (1,0),(2,0),(0,1), removing (0,1) would destroy the ability to span the plane.

### Starting from a description of the space

A subspace may be given by a constraint rather than by a spanning list. For the plane z=2x+y, write (x,y,z)=(x,y,2x+y)=x(1,0,2)+y(0,1,1). This gives candidate basis vectors (1,0,2) and (0,1,1). The expression proves spanning, and their first two components prove independence. An arbitrary vector on this plane therefore has basis coordinates (x,y), even though its standard coordinate list has three entries.

In the opposite direction, extend an independent list by adding a vector outside its span. The new list stays independent: a zero combination with nonzero coefficient on the added vector would express it using the old list, contradicting the choice. For u and v above, adding (0,0,1) gives a basis of the entire three-dimensional space. Any target (x,y,z) equals xu+yv+(z-x-y)(0,0,1); a zero target forces all three coefficients to vanish.

## Dimension and the ambient space

The [dimension](ref:la-term-dimension) of a finite-dimensional subspace is the number of vectors in a basis. The ambient space is the larger space in which its vectors live. Our plane z=x+y has dimension two, while its ambient space has dimension three. Its vectors have three standard components but need only two independent basis coefficients. These counts answer different questions.

A line through the origin has dimension one: a single nonzero vector on the line spans it and is independent. For example, (2,-1,3) is a basis vector for the line of its multiples, despite having three components. The entire coordinate plane has dimension two, and the full three-dimensional coordinate space has dimension three.

The zero-only subspace has dimension zero and the empty basis. Its only vector is the empty linear combination, which is zero. A list containing the zero vector is not a basis: multiplying that vector by one already gives a nontrivial zero combination, so the list is dependent.

### Why every basis has the same size

Dimension would not be well defined if two bases of the same space could have different numbers of vectors. An exchange argument rules this out. Start with a spanning list of n vectors and an independent list u1 through um in the same space. Express u1 using the spanning list. Some coefficient is nonzero, so solve for that old vector and replace it by u1 without losing the span.

At step j, express uj using the previous replacements and the remaining old vectors. Some coefficient on an old vector must be nonzero: otherwise uj would be a combination of u1 through u(j-1), contradicting independence. Replace that old vector. If m exceeded n, after n replacements the next independent vector would already lie in their span, again a contradiction. Thus an independent list has no more vectors than any spanning list. Applying this to two bases in both directions forces equal sizes.

This also explains a useful test. If a space is already known to have dimension d, then d independent vectors in it form a basis, as do d vectors that span it. Without that known dimension, verify both spanning and independence. Always finish a basis claim by naming its space: two independent vectors in three-dimensional space describe their plane, not the entire ambient space.
