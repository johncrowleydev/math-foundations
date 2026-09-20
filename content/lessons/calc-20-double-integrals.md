# Introductory Double Integrals

Accumulation now has two input directions. We will connect area-based sums to iterated integration, use geometry to set and reverse bounds, and interpret the result as volume, an average, or a share of a normalized total. The one-variable integration rules still do the arithmetic; describing the region is the new central skill.

## Accumulate over an area

A single integral accumulates contributions along an interval. A double integral accumulates them across a two-dimensional region. Divide a rectangle into small cells. In each cell, multiply a sampled function value by the cell's area, then add the contributions. If these sums approach one common value as the cells become arbitrarily small, that value is the double integral, written $\iint_R f(x,y)\,dA$. The symbol dA describes area, rather than a third independent variable.

For a continuous function on a closed rectangle, this limit exists. A grid with cell widths $\Delta x$ and $\Delta y$ has cell area $\Delta A=\Delta x\Delta y$. Using the width alone would give the wrong dimensions. If f is a height in meters and both coordinates measure meters, each product has cubic-meter units. If f is mass per square meter, the integral measures mass instead.

Take $f(x,y)=x+2y$ on $[0,2]\times[0,1]$. Divide the rectangle into two unit squares and sample their centers, $(1/2,1/2)$ and $(3/2,1/2)$. The sampled heights are $3/2$ and $5/2$. Multiplying each by area one gives the midpoint estimate four. Here the estimate happens to equal the exact integral because the function is affine; a single grid does not generally establish exactness.

A nonnegative height produces ordinary volume above the plane. Negative values instead contribute signed volume. Cancellation can make an integral zero even when the function is not zero throughout the region. For example, f=x on a rectangle symmetric about the y-axis has matching positive and negative contributions.

Before calculating, identify the region, the quantity per unit area, and the desired total. This interpretation prevents a common error: treating two integral signs as an instruction to square a one-variable integral. The two signs record accumulation across two coordinates.

Related definitions: [double integral](ref:calculus-double-integral).

## Evaluate iterated integrals

Fubini's theorem gives a practical method for continuous functions on closed rectangles: integrate one coordinate at a time, in either order. For $R=[a,b]\times[c,d]$, write $\int_a^b\int_c^d f(x,y)\,dy\,dx$. Read from the inside outward. During the inner y integral, x is held constant. The inner result is then a function of x to integrate over its interval.

For $f=x+2y$ on the rectangle from the preceding section, the inner calculation is $\int_0^1(x+2y)\,dy=[xy+y^2]_0^1=x+1$. The outer integral is $\int_0^2(x+1)\,dx=[x^2/2+x]_0^2=4$. Reversing the order gives $\int_0^1[ x^2/2+2xy]_0^2\,dy=\int_0^1(2+4y)\,dy=4$. The intermediate expressions differ while the total agrees.

An inner definite integral has no arbitrary constant. Its upper and lower substitutions already determine a unique function of the remaining coordinate. After the outer definite integral, no free x or y should remain. If one remains, recheck whether a bound was substituted or a variable was accidentally treated as a constant in both stages.

Linearity works as before: integrate sums term by term and pull constant factors outside. On a rectangle, a separated product $g(x)h(y)$ gives the product of the two corresponding one-variable integrals. Thus $\int_0^2\int_0^3 xy\,dy\,dx=(\int_0^2x\,dx)(\int_0^3y\,dy)=9$. This product shortcut depends on both the separated integrand and independent rectangular bounds.

An independent check can use a rough size bound before any antiderivative. If the integrand stays between zero and three over a rectangle of area two, the final total must lie between zero and six. A value outside that range signals an error in arithmetic or bounds.

Choose the order that makes the algebra easier, but justify that the theorem applies. Our examples use continuous functions on bounded regions. Singular or unbounded integrals need additional convergence analysis; changing order is not an unconditional rule for every expression with two integral signs.

Related definitions: [iterated integral](ref:calculus-iterated-integral).

## Describe simple regions with variable bounds

A triangular or curved region usually cannot be represented by independent constant bounds. One useful description is $a\leq x\leq b$ together with $g(x)\leq y\leq h(x)$. For each fixed x, a vertical slice runs from its lower boundary g to its upper boundary h. Integrating over that region becomes $\int_a^b\int_{g(x)}^{h(x)}f(x,y)\,dy\,dx$. The inner bounds may depend on the outer variable; they must not depend on the variable currently being integrated.

Consider the triangle with vertices (0,0), (2,0), and (0,2). Its slanted edge is x+y=2, so a vertical slice has $0\leq y\leq 2-x$, with $0\leq x\leq 2$. Its area is $\int_0^2\int_0^{2-x}1\,dy\,dx=\int_0^2(2-x)\,dx=2$. Replacing the slanted bound by two would integrate the containing square and double the area.

To integrate x over the same triangle, first obtain $x(2-x)$ from the inner integral. The result is $\int_0^2(2x-x^2)\,dx=4/3$. The factor x is constant only during the y step, not throughout the entire calculation. Geometry also checks the result: the triangle has area two and average x coordinate two thirds, so its integral of x is four thirds.

Curved boundaries work the same way. Between $y=x^2$ and $y=x$ for $0\leq x\leq 1$, the upper curve is x because x is at least its square on this interval. Area is $\int_0^1(x-x^2)\,dx=1/6$. Solve intersections and test which curve is above before writing bounds.

Some regions require more than one set of slices because an upper or lower boundary changes. Split at those transition coordinates and add the integrals. A correct sketch and an explicit inequality description are part of the mathematics, even when the final task asks for a number.

Related definitions: [variable integration bounds](ref:calculus-variable-integration-bounds).

## Reverse order by redescribing the same region

Changing the order means describing the same set of points with slices in the other direction. It does not mean exchanging the differential symbols while leaving every bound in place. Start from the inequalities, find the full range of the new outer variable, and then find the endpoints of a slice at a fixed value of that variable.

For $0\leq x\leq 1$ and $x^2\leq y\leq x$, the y range is zero through one. Solving the curve equations for x gives $x=y$ and $x=\sqrt y$. On this interval y is no larger than its square root, so a horizontal slice runs from y to $\sqrt y$. Therefore $\int_0^1\int_{x^2}^x f\,dy\,dx=\int_0^1\int_y^{\sqrt y}f\,dx\,dy$ for the continuous functions considered here. Both descriptions give area one sixth.

Order can determine whether an elementary antiderivative is available. Consider $\int_0^1\int_x^1 e^{y^2}\,dy\,dx$. The inner y antiderivative is not elementary. The region is $0\leq x\leq y\leq 1$. In the other order, $\int_0^1\int_0^y e^{y^2}\,dx\,dy=\int_0^1 y e^{y^2}\,dy=(e-1)/2$. The inner x integration introduces the factor y needed for substitution in the outer integral.

A region can be simple in one direction but need several pieces in the other. For $0\leq x\leq 2$ and $0\leq y\leq\min(x,1)$, horizontal slices give $0\leq y\leq 1$, $y\leq x\leq 2$. Vertical slices must split at x=1. The two descriptions agree on the points even though one uses fewer integrals.

After reversing, test an interior point and a boundary point against both descriptions. These checks do not replace the derivation, but they quickly expose inverted inequalities or a missing piece. A change of order preserves the region and integrand; only their description changes.

Related definitions: [order of integration](ref:calculus-order-of-integration).

## Volumes, averages, and normalized accumulation

To compute the volume between a top surface and a bottom surface, integrate their vertical difference over the base region. Check which surface is higher on that region. Above the unit square, let the top be $3+x+y$ and the bottom be x. Their difference is $3+y$, so the volume is $\int_0^1\int_0^1(3+y)\,dy\,dx=7/2$. Integrating the top alone would measure volume relative to the plane z=0 instead.

An average value divides the accumulated quantity by the region's area: $f_{\mathrm{avg}}=\frac{1}{A(R)}\iint_R f\,dA$, for a region with positive area. On $[0,2]\times[0,1]$, the function x+2y has integral four and average two. The integral and average have different units: integrating temperature over area yields temperature times area; averaging restores temperature units.

For a continuous function, the average lies between its smallest and largest values on the region. This supplies a useful error check. Averaging a height that stays between two and five cannot produce seven. Sampling points uniformly in coordinate area and averaging their heights approximates this area average; using unequal cells requires weighting by their areas.

A nonnegative density can also be normalized so its total integral is one. For $p(x,y)=2x$ on the unit square, $\iint p\,dA=1$. The accumulated share in the half-square $0\leq x\leq 1/2$ is $\int_0^{1/2}\int_0^1 2x\,dy\,dx=1/4$, not one half: density increases toward the right. In probability, such a normalized density will describe how probability is distributed across pairs of continuous values. The integral over a region gives its share, rather than the density at a single point.

Keep the interpretations distinct. Signed functions can cancel; mass and probability densities are nonnegative. An average divides by area, while normalizing a density divides by its total mass. Each operation answers a different question.

Related definitions: [area average](ref:calculus-area-average).
