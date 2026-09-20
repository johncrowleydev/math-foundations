# Linearization, Gradients, and Directional Derivatives

Partial derivatives describe coordinate slices. We now ask whether those rates combine into a reliable prediction for any small input displacement. The answer connects differentiability to tangent planes and connects the gradient to dot products. Keep the geometric objects distinct: the graph lives above the input plane, while directions and contour curves live in the input plane itself.

## One approximation for every small displacement

In one variable, differentiability means that a small change is described by a linear term plus an error that is small compared with the input change. In two variables the same idea must hold for every small displacement $(h,k)$. We require $f(a+h,b+k)=f(a,b)+Ah+Bk+E(h,k)$, where $E(h,k)/\sqrt{h^2+k^2}$ tends to zero. This is the definition of differentiability at $(a,b)$.

Setting $k=0$ identifies $A=f_x(a,b)$; setting $h=0$ identifies $B=f_y(a,b)$. Thus the partial derivatives determine the only possible linear approximation, but their existence does not prove that its error is sufficiently small along every path. Continuity of the first partials in a neighborhood is a useful sufficient condition.

For $f(x,y)=x^2+xy$ at $(1,2)$, expansion gives $f(1+h,2+k)=3+4h+k+h^2+hk$. The proposed linear change is $4h+k$ and the error is $h^2+hk$. Put $r=\sqrt{h^2+k^2}$. Because $|h|\leq r$ and $|k|\leq r$, the error has magnitude at most $2r^2$. Dividing by $r$ gives a bound $2r$ tending to zero. This checks the definition, not merely the coordinate directions.

Differentiability implies continuity: the linear change tends to zero and so does the remainder. A discontinuous function therefore cannot be differentiable. The converse is false. The function $\sqrt{x^2+y^2}$ is continuous at the origin but has a cone-like point there. Along the x axis its difference quotient is $|h|/h$, whose two-sided limit fails. Remember which implication a theorem actually supplies before using it to classify a function.

Related definitions: [multivariable differentiability](ref:calculus-multivariable-differentiability).

## Tangent planes and differentials

The linearization at $(a,b)$ is $L(x,y)=f(a,b)+f_x(a,b)(x-a)+f_y(a,b)(y-b)$. Its graph is a plane through $(a,b,f(a,b))$, with slopes matching the two coordinate derivatives. We call it the tangent plane when the function is differentiable. The variables in this formula are nearby input coordinates, not derivative evaluation points.

For $f(x,y)=x^2+xy$ at $(1,2)$, the plane is $L(x,y)=3+4(x-1)+(y-2)$. To estimate $f(1.02,1.97)$, use $h=0.02$ and $k=-0.03$, obtaining $3+0.08-0.03=3.05$. Direct evaluation gives $3.0498$, so the approximation error is $-0.0002$. The expansion in the preceding teaching section explains this difference: $h^2+hk=0.0004-0.0006$.

The total differential is the linear expression $df=f_x\,dx+f_y\,dy$. It describes the first-order output change for specified small input changes. The actual finite change is usually not exactly equal to the differential. A zero differential may mean that second-order terms decide the output change; it does not mean there is no change at all.

### Keeping units and uncertainty visible

For a rectangular area $A=lw$, a small measurement change gives $dA=w\,dl+l\,dw$. At lengths three and four meters, changes of 0.01 and -0.02 meters give an estimated area change $4(0.01)+3(-0.02)=-0.02$ square meters. The exact change also includes the product of the two measurement changes.

If only bounds on input errors are known, use absolute values: $|df|\leq|f_x||dx|+|f_y||dy|$. This is a conservative first-order bound, not a guarantee for arbitrarily large errors. Report the base point, input displacement, approximation, and what was neglected.

Related definitions: [total differential](ref:calculus-total-differential).

## The gradient collects partial derivatives

The gradient of a scalar function is the vector of its first partial derivatives in the stated coordinate order. In two dimensions, $\nabla f=(f_x,f_y)$. At a point, these entries are numbers. Before evaluation, the gradient is a vector-valued function. This convention uses the usual Euclidean coordinates and the same component order as the input vector.

For $f(x,y)=x^2+3y^2$, the gradient is $(2x,6y)$. At $(1,-1)$ it is $(2,-6)$. The linear change for displacement $(h,k)$ is the dot product $(2,-6)\cdot(h,k)=2h-6k$. Thus the gradient packages all first-order directional information into one familiar linear-algebra object.

For $F(x,y,z)=xy+z^2$, the gradient has three components: $(y,x,2z)$. A common error is to return only the partial with respect to the variable that appears first, or to change the component order halfway through a calculation. Check the number of inputs against the number of gradient components before doing arithmetic.

### Coordinates have meaning

If coordinates have different physical units, gradient components have different reciprocal input units. A dot product with a compatible displacement still produces the correct output units. However, comparing directions using a Euclidean norm implicitly chooses a scale for the coordinates. Rescaling a parameter from meters to centimeters changes its numerical gradient component.

A zero gradient means that the first-order linear change vanishes in every direction. It does not decide whether the point is a minimum, maximum, or saddle, nor does it make a function constant nearby. Both $x^2+y^2$ and $x^2-y^2$ have zero gradients at the origin, with very different nearby behavior. Later we will use second derivatives and actual function values to resolve such cases.

Related definitions: [gradient](ref:calculus-gradient).

## Directional derivatives and unit directions

A directional derivative measures output change per unit distance along a specified direction. With a unit vector $u$, define $D_uf(p)=\lim_{t\to0}(f(p+tu)-f(p))/t$. For a differentiable function, substituting the linear approximation gives $D_uf(p)=\nabla f(p)\cdot u$.

Suppose the gradient at a point is $(3,-4)$ and the requested direction is toward the vector $(4,3)$. Its length is five, so use $u=(4/5,3/5)$. The directional derivative is $3(4/5)-4(3/5)=0$. Using $(4,3)$ directly would describe change along a path with speed five rather than a unit-speed direction. In this zero example both happen to vanish; in general they differ by the speed factor.

For direction $(1,0)$, the directional derivative is the x partial. For the opposite direction, its sign reverses. A zero vector has no direction and cannot be normalized. An instruction giving two points usually means to subtract the starting point from the target, then normalize that displacement.

If the gradient is nonzero, Cauchy–Schwarz gives $\nabla f\cdot u\leq\|\nabla f\|$ for unit u. Equality occurs for $u=\nabla f/\|\nabla f\|$. This is the steepest ascent direction, and its rate is the gradient norm. The opposite direction produces the steepest descent rate, the negative of that norm.

These statements concern first-order local rates. A long straight step in the ascent direction can eventually go downhill, and a large descent step can increase the function. When the gradient is zero, all first-order directional derivatives vanish and there is no distinguished direction from this test.

Related definitions: [directional derivative](ref:calculus-directional-derivative).

## Gradients and contour geometry

Imagine moving along a smooth level curve on which the output is constant. The output change along its tangent direction must be zero. For a differentiable function, the gradient dot that tangent direction is therefore zero. At a regular point where the gradient is nonzero, the gradient is perpendicular to the level curve.

For $f(x,y)=x^2+2y^2$, the point $(2,1)$ lies on the level six and has gradient $(4,4)$. A tangent direction is $(1,-1)$ because their dot product vanishes. The tangent line in the input plane is $4(x-2)+4(y-1)=0$, or $x+y=3$. This line is not the tangent plane to the graph: it lies in the two-dimensional input plane and describes a level-curve direction.

Taking the straight displacement $(h,-h)$ from $(2,1)$ gives an actual change $3h^2$. Its first-order change is zero, but the straight line leaves the ellipse at second order. Moving exactly along the curved contour would keep the output constant. This example separates a tangent approximation from the curve itself.

### Using the geometry responsibly

For $f=x^2-y^2$, the zero level has two crossing lines at the origin and the gradient there is zero. The perpendicular-gradient rule does not identify one normal direction at that singular point. Its nonzero-gradient hypothesis matters. A contour drawing that hides the crossing cannot repair the failed hypothesis.

For a small change in measured inputs, compute a differential. For a unit direction, compute a normalized dot product. For the greatest local increase, normalize the gradient. For a constant-output direction, seek a vector perpendicular to it. These are related questions with different requested outputs. State whether the answer is a scalar rate, a vector direction, a line, or a plane, and check it by substitution or a dot product.

Related definitions: [regular level curve](ref:calculus-regular-level-curve).

![A gradient is normal to a regular contour](figure:calculus-figure-17)
