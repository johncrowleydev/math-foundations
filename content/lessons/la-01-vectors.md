# Vectors and Linear Combinations

A single number can describe a temperature. Describing a position on a map needs two numbers, and describing one observation in a dataset may need hundreds. A vector lets us work with an ordered collection of numbers as one mathematical object. The coordinate order matters: if the first position records an eastward amount and the second a northward amount, swapping those amounts generally describes a different displacement. This is about which axis each number describes, not the order in which you travel along the axes.

## Coordinates and vectors

A real [coordinate vector](ref:linear-algebra-vectors-1) is an ordered list of real numbers. Its entries are called components. The notation $\mathbb{R}^n$ means the set of all lists with exactly n real components; read it as “R to the n,” or “real n-dimensional coordinate space.” Here n is a positive integer, and the superscript specifies the number of coordinates rather than a numerical power of a set.

For example, $u=(3,2)$ is a vector with two components. As a displacement, it means three units right and two units up. As data, it could mean three hours spent on one activity and two on another. The arithmetic is the same, but units and interpretation come from the application. Adding measurements with incompatible meanings can be mathematically possible and scientifically meaningless.

A vector is not tied to a particular starting point. An arrow from the origin to (3,2) and an arrow from (1,1) to (4,3) represent the same displacement. A position is a point; its position vector is the displacement from the chosen origin. Keeping those ideas distinct helps when we later distinguish linear transformations from translations.

We can write the same components vertically as a column. Parentheses and square brackets are both common; a vertical arrangement does not change the component values. Unless a lesson says otherwise, our matrix calculations use column vectors. In ordinary prose, coordinate tuples remain convenient shorthand.

## Adding and scaling

Vectors of the same size add component by component. For $u=(3,2)$ and $v=(-1,1)$, we obtain $u+v=(2,3)$. Geometrically, follow the displacement u and then the displacement v. The final displacement from the original starting point is their sum. Moving the second arrow so that its tail meets the first arrow's head does not change that second displacement.

A scalar is an ordinary number used to multiply a vector. [Scalar multiplication](ref:linear-algebra-vectors-2) multiplies every component: $2u=(6,4)$. A positive scalar stretches or shrinks an arrow while preserving its direction; a negative scalar reverses it as well. Multiplication by zero produces the zero vector, whose components are all zero and which has no direction.

Subtraction means adding the negative vector. Thus $u-v=(4,1)$ in this example. The difference is also the displacement from the point represented by v to the point represented by u. Notice the order: reversing the subtraction reverses the arrow.

![Adding displacements](figure:la-vector-addition)

## Building linear combinations

A [linear combination](ref:linear-algebra-vectors-3) is a sum of scalar multiples of given vectors. For example, $2u+3v=(3,7)$ with the vectors above. The numbers 2 and 3 are coefficients. The word linear here describes the allowed construction: scale each supplied vector, then add. We are not multiplying components together or applying squares to them.

The standard coordinate vectors in the plane are $e_1=(1,0)$ and $e_2=(0,1)$. Every vector $(a,b)$ can be written as $ae_1+be_2$. Read this as “a times e sub one plus b times e sub two.” The scalars a and b are arbitrary real numbers. The subscripts distinguish two named vectors; they are not extra coordinates.

Other building blocks can work too. Let p=(1,1) and q=(1,-1). To build (4,2), use three copies of p and one copy of q: the horizontal components add to four while the vertical components add to two. If we instead have only p and 2p, every combination still lies on the same diagonal line. Having more listed vectors does not necessarily provide more freedom. Later lessons will make that observation precise.

## Linear models and their limits

Suppose a small workshop makes two products. One unit of the first uses (2,1) units of two resources; one unit of the second uses (1,3). Making three units of the first and two of the second uses (8,9), obtained by scaling each resource vector by the production amount and adding.

This model assumes [resource use](ref:linear-algebra-vectors-4) is additive and proportional. It ignores setup costs, waste that changes with volume, and bulk discounts. A vector calculation does not establish that these assumptions are appropriate; it tells us what follows if they are. In applications, interpret the components and check the assumptions before trusting the result.

There is also a difference between a mathematical combination and a feasible production plan. Linear algebra permits negative real coefficients. A workshop usually requires nonnegative whole-number quantities. Constraints such as these belong to the model, even though the underlying vector operations remain the same.

For practice, show component arithmetic and briefly identify what the result represents. You can write vectors as tuples initially. Optional typing help also shows columns, using a matrix environment: ampersands separate columns and two backslashes separate rows. The preview should preserve the order of your components.
