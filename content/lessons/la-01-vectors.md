# Vectors and Linear Combinations

A single number can describe a temperature. Describing a position on a map needs two numbers, and describing one observation in a dataset may need hundreds. A vector lets us work with an ordered collection of numbers as one mathematical object. The coordinate order matters: if the first position records an eastward amount and the second a northward amount, swapping those amounts generally describes a different displacement. This is about which axis each number describes, not the order in which you travel along the axes.

## Coordinates and vectors

A real [coordinate vector](ref:linear-algebra-vectors-1) is an ordered list of real numbers. Its entries are called components. The notation $\mathbb{R}^n$ means the set of all lists with exactly n real components; read it as “R to the n,” or “real n-dimensional coordinate space.” Here n is a positive integer, the dimension of this coordinate space. The superscript specifies the number of coordinates rather than a numerical power of a set.

For example, $u=(3,2)$ is a vector with two components. As a displacement, it means three units right and two units up. As data, it could mean three hours spent on one activity and two on another. The arithmetic is the same, but units and interpretation come from the application. Adding measurements with incompatible meanings can be mathematically possible and scientifically meaningless.

A vector is not tied to a particular starting point. An arrow from the origin to (3,2) and an arrow from (1,1) to (4,3) represent the same displacement. A position is a point; its position vector is the displacement from the chosen origin. Keeping those ideas distinct helps when we later distinguish linear transformations from translations.

We can write the same components vertically as a column. Parentheses and square brackets are both common; a vertical arrangement does not change the [component](ref:la-term-component) values. Unless a lesson says otherwise, our matrix calculations use column vectors. In ordinary prose, coordinate tuples remain convenient shorthand.

### Coordinates carry meaning

Suppose a weather record is (12,5,-2), in the order temperature, wind speed, and overnight change in temperature. It has three components, but those components do not describe three spatial directions. A negative third component records a decrease; it does not invalidate the vector. Before doing arithmetic, write down the coordinate order and units. If another record uses a different order, reorder it before comparing corresponding components.

For a displacement, subtract start from finish in every coordinate. An arrow from (4,-2,1) to (1,3,1) has displacement (-3,5,0). Its zero third component means no change in that coordinate, not that the arrow is the zero vector. If only the starting point moves while the endpoint stays fixed, the displacement changes. It stays the same only when both endpoints are translated by the same amount.

## Adding and scaling

Vectors of the same size add component by component. For $u=(3,2)$ and $v=(-1,1)$, we obtain $u+v=(2,3)$. Geometrically, follow the displacement u and then the displacement v. The final displacement from the original starting point is their sum. Moving the second arrow so that its tail meets the first arrow's head does not change that second displacement.

A [scalar](ref:la-term-scalar) is an ordinary number used to multiply a vector. [Scalar multiplication](ref:linear-algebra-vectors-2) multiplies every component: $2u=(6,4)$. For a nonzero vector, a positive scalar stretches or shrinks its arrow while preserving its direction; a negative scalar reverses it as well. Multiplication by zero produces the zero vector, whose components are all zero and which has no direction.

Subtraction means adding the negative vector. Thus $u-v=(4,1)$ in this example. The difference is also the displacement from the point represented by v to the point represented by u. Notice the order: reversing the subtraction reverses the arrow.

![Adding displacements](figure:la-vector-addition)

### A calculation you can check backward

Take u=(2,-1,3) and v=(-4,2,1). First scale each entry: three u is (6,-3,9), while negative two v is (8,-4,-2). Their sum is (14,-7,7). To check the result, subtract three u and recover negative two v. This backward check catches the common mistake of applying a minus sign only to the first component.

Vector addition is commutative and associative because each coordinate uses ordinary real-number addition. Scaling distributes over addition for the same reason: the ith component of c(u+v) is c times the sum of the two ith components, which equals the sum of their separate products with c. This is an argument for arbitrary vectors, rather than a conclusion based on several successful examples. You may regroup a long sum, but you may not add vectors with different numbers of components.

## Building linear combinations

A [linear combination](ref:linear-algebra-vectors-3) is a sum of scalar multiples of given vectors. For example, $2u+3v=(3,7)$ with the vectors above. The numbers 2 and 3 are coefficients. The word linear here describes the allowed construction: scale each supplied vector, then add. We are not multiplying components together or applying squares to them.

The standard coordinate vectors in the plane are $e_1=(1,0)$ and $e_2=(0,1)$. Every vector $(a,b)$ can be written as $ae_1+be_2$. Read this as “a times e sub one plus b times e sub two.” The scalars a and b are arbitrary real numbers. The subscripts distinguish two named vectors; they are not extra coordinates.

Other building blocks can work too. Let p=(1,1) and q=(1,-1). To build (4,2), use three copies of p and one copy of q: the horizontal components add to four while the vertical components add to two. If we instead have only p and 2p, every combination still lies on the same diagonal line. Having more listed vectors does not necessarily provide more freedom. Later lessons will make that observation precise.

### Working backward to find coefficients

To express (7,1) using p=(1,1) and q=(2,-1), call the coefficients a and b. Matching first components gives a+2b=7; matching second components gives a-b=1. The second equation says a=1+b. Substitution into the first gives 1+3b=7, so b=2 and a=3. Check by rebuilding: three copies of p plus two copies of q give (7,1).

This uses familiar simultaneous equations, not a new rule for guessing coefficients. Sometimes no coefficients work, as with two diagonal building blocks and a target off their line. Sometimes many lists work: with p and 2p, the vector 4p can be made with coefficients (4,0), (2,1), or (0,2). Do not confuse the number of supplied vectors with the number of genuinely different directions.

$
3\begin{pmatrix}1\\1\end{pmatrix}+2\begin{pmatrix}2\\-1\end{pmatrix}=\begin{pmatrix}7\\1\end{pmatrix}
$

## Linear models and their limits

Suppose a small workshop makes two products. One unit of the first uses (2,1) units of two resources; one unit of the second uses (1,3). Making three units of the first and two of the second uses (8,9), obtained by scaling each resource vector by the production amount and adding.

This model assumes [resource use](ref:linear-algebra-vectors-4) is additive and proportional. It ignores setup costs, waste that changes with volume, and bulk discounts. A vector calculation does not establish that these assumptions are appropriate; it tells us what follows if they are. In applications, interpret the components and check the assumptions before trusting the result.

There is also a difference between a mathematical combination and a feasible production plan. Linear algebra permits negative real coefficients. A workshop usually requires nonnegative whole-number quantities. Constraints such as these belong to the model, even though the underlying vector operations remain the same.

For practice, show component arithmetic and briefly identify what the result represents. You can write vectors as tuples initially. Optional typing help also shows columns, using a matrix environment: ampersands separate columns and two backslashes separate rows. The preview should preserve the order of your components.

### Testing the model rather than only the arithmetic

If each batch uses (2,3) units of water and power, four batches use (8,12) under a proportional model. If starting the machine also consumes (1,5), the total is instead (9,17). The fixed startup cost is paid once, so doubling the number of batches does not double the whole total. A correct calculation with the wrong assumptions is still the wrong model.

Similarly, an average of two measurement vectors is obtained by adding them and scaling by one half, provided the measurements use matching units and order. That average need not be a feasible individual observation: the average number of children in a household may be fractional. Separate what the arithmetic represents from what an individual object is allowed to be.
