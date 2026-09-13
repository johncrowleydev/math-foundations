# Dot Products, Length, and Angle

Adding vectors gives another vector. Sometimes we instead want a single number describing how two vectors relate. The dot product supplies such a number. It connects a simple component calculation to length and perpendicularity, and later becomes the arithmetic behind matrix multiplication and projection.

## A scalar from two vectors

For real vectors of the same size, the [dot product](ref:linear-algebra-dot-products-1) multiplies corresponding components and adds the products. In two dimensions, $u\cdot v=u_1v_1+u_2v_2$. Here u and v are vectors, while u sub one, u sub two, and the corresponding v symbols are their real components. The centered dot means this operation, not a new vector component.

For u=(2,-1) and v=(3,4), the dot product is two times three plus negative one times four, which is 2. The result is a scalar. This is different from multiplying two vectors component by component and keeping a list of products; that operation exists in other contexts but is not the dot product.

The same rule works with any finite number of components. Because ordinary multiplication commutes, exchanging the two vectors leaves their dot product unchanged. It also distributes across vector addition. These facts will let us expand squared distances without drawing every example.

## Length and unit vectors

The [Euclidean norm](ref:linear-algebra-dot-products-2) is the usual geometric length of a vector. We write $\|u\|=\sqrt{u\cdot u}$, read “the norm of u equals the square root of u dot u.” The double vertical bars mean length here. Squaring and adding the components gives the familiar Pythagorean calculation, extended to more coordinates.

For u=(3,4), the squared length is 25 and the length is 5. Length is nonnegative, and it is zero only for the zero vector. Distance between two points is the norm of their difference, because that difference is the displacement connecting them.

A unit vector has length one. Normalizing a nonzero vector means dividing it by its norm. Thus (3/5,4/5) is a unit vector pointing in the direction of (3,4). Division here scales every component by the reciprocal of the length. The zero vector cannot be normalized: division by its zero length is undefined, and there is no direction to preserve.

## Angle and orthogonality

For nonzero vectors with angle theta between them, $u\cdot v=\|u\|\|v\|\cos\theta$. This identity connects the component calculation to geometry; it follows from the cosine rule applied to the triangle with sides u, v, and their difference. Theta is an angle between zero and pi radians, or between zero and 180 degrees.

A positive dot product corresponds to an acute angle, zero to a right angle, and a negative value to an obtuse angle. We call vectors [orthogonal](ref:linear-algebra-dot-products-3) when their dot product is zero. For nonzero vectors this means perpendicular. Algebraically the zero vector is orthogonal to every vector, although an angle involving it is not defined.

For example, (1,2) and (2,-1) are orthogonal because the two component products cancel. Neither vector needs to lie along a coordinate axis. Orthogonality depends on the relation between the vectors, not on their orientation on the page.

![Perpendicular vectors](figure:la-orthogonal-vectors)

## Weighted totals and similarity

A dot product also computes a weighted total. If prices are (2,5,3) and quantities are (4,1,2), their dot product is the total cost, 19. This reading does not require an angle, but it does require pairing the same product in the same coordinate position.

Comparing the dot product alone can confuse alignment with size: doubling one vector doubles the result even though its direction is unchanged. For two nonzero vectors, dividing their dot product by the product of their norms removes that scale effect and gives the cosine of their angle. This is called [cosine similarity](ref:linear-algebra-dot-products-4). Its values lie between negative one and one. A value of one means the vectors point in the same direction, not that their original measurements were identical.

There are practical limitations. Rescaling one feature can change angles in a dataset, and features measured in different units may need a carefully chosen scaling. Linear algebra explains the calculation; interpreting similarity still requires judgment about the data.

In your answers, distinguish a dot product, a norm, and a vector. They have different meanings even when some of their numerical values happen to coincide. Use an exact square root when a decimal approximation would hide a useful relationship.
