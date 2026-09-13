# Linear Transformations

So far we have calculated with matrices and interpreted their columns. We now describe the underlying kind of function without depending on a particular array of numbers. This separates a transformation from the coordinates chosen to represent it.

## What linearity requires

A transformation is a function from one vector space to another. It is linear if it preserves addition and scalar multiplication. For every input pair u,v and every real scalar c, it must satisfy $T(u+v)=T(u)+T(v)$ and $T(cu)=cT(u)$. T names the function. These equations must hold for every allowed input, not just the examples we happen to test.

Every matrix rule T(x)=Ax is linear because matrix multiplication has these properties. Conversely, every [linear transformation](ref:linear-algebra-transformations-1) between real coordinate spaces has a matrix representation in standard coordinates. Its action on the standard basis determines everything: write an input as a combination of basis vectors and use linearity to move the coefficients through the transformation.

In particular, a linear transformation must take zero to zero. This is a useful way to disprove linearity, but passing the zero test is not sufficient. The function that squares each coordinate takes zero to zero yet fails to preserve addition.

## Read the matrix from its columns

In two dimensions, the first column is where the first standard basis vector goes, and the second column is where the second goes. A transformation sending (1,0) to (2,0) and (0,1) to (1,1) therefore has columns (2,0) and (1,1). An arbitrary input (a,b) goes to (2a+b,b).

A rotation through a right angle counterclockwise sends (1,0) to (0,1) and (0,1) to (-1,0). Its matrix has rows (0,-1),(1,0). Applying it to (2,1) gives (-1,2). This is a concrete way to check both the direction of rotation and the column convention without memorizing a sign pattern.

A [shear](ref:linear-algebra-transformations-2) slides points horizontally by an amount proportional to their vertical coordinate. For example, the rule (a,b) goes to (a+b,b) fixes the horizontal axis and tilts the vertical basis direction. It is linear even though it changes angles. Linear does not mean “preserves all geometric features.”

![A shear and its basis directions](figure:la-shear)

## Kernel, image, and information loss

The kernel of a linear transformation is the set of inputs sent to zero. The image is the set of outputs it actually reaches. For a matrix rule, these are respectively the null space and column space already studied. The domain specifies permitted inputs, while the codomain specifies the declared output space; the image may be smaller than the codomain.

A linear transformation is injective, meaning distinct inputs have distinct outputs, exactly when its kernel contains only zero. If T(u)=T(v), linearity gives T(u-v)=0. A zero-only kernel forces u=v. Conversely, a nonzero vector in the kernel has the same output as zero and disproves injectivity.

It is surjective onto its stated codomain exactly when its image equals that codomain. The projection (a,b) goes to (a,0), considered as a function from the plane to the plane, is neither injective nor surjective. Its kernel is the vertical axis and its image the horizontal axis. Declaring the horizontal axis as the codomain changes the surjectivity answer but does not change the rule.

## Coordinates, composition, and affine rules

Changing a basis changes the coordinate matrix of a transformation without changing the transformation itself. Suppose the columns of an invertible matrix P are a new input basis in standard coordinates. Then P converts new coordinates to standard coordinates, while its inverse converts back. If both input and output use that new basis, the transformed coordinate matrix is $P^{-1}AP$. The order follows the journey: convert in, apply A, convert back.

Composition of linear transformations is linear, and its matrix product acts from right to left. This explains why rotating and then stretching need not agree with stretching and then rotating. Try tracking a single off-axis vector when the order is unclear.

A rule Ax+b with a fixed offset vector b is called affine. It is linear precisely when b is zero. Translations are affine and preserve straight lines, but a nonzero translation does not preserve the origin. In everyday language “linear graph” can mean a straight line with an intercept; in linear algebra, the zero-preserving condition is essential.

When you decide whether a rule is linear, either justify both defining properties for arbitrary inputs or give one counterexample to a required property. A handful of successful tests cannot prove a universal statement.
