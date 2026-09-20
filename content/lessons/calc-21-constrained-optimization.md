# Basic Constrained Optimization

Optimization changes when inputs must stay on a line, a curve, or another feasible set. We will compare direct substitution with Lagrange multipliers, explain the geometry behind the equations, and learn why constraints, exceptional points, and boundary checks are inseparable from a correct result.

## Optimize over the feasible set

An objective is the quantity to minimize or maximize. A constraint restricts the allowed inputs, whose collection is the feasible set. A point can optimize a function on a curve without optimizing it over the entire plane. Distinguishing those questions is the first step in a constrained problem.

For example, minimize $f(x,y)=x^2+y^2$ subject to x+y=6. Without the constraint, the origin gives value zero, but it is not feasible. On the line, the closest point to the origin is (3,3), with objective value eighteen. The gradient of f there is (6,6), which is not zero. An unconstrained stationary-point test would miss this minimum because movement is allowed only along the constraint line.

At a smooth point on a constraint curve, its tangent direction describes an infinitesimal feasible movement. The gradient of a function defining the curve is perpendicular to that tangent. At a constrained extremum, the objective cannot increase or decrease to first order along the tangent, so its gradient is also perpendicular to that tangent. In two dimensions, these two gradients are parallel, provided the constraint gradient is nonzero.

Level curves offer another view. For $x^2+y^2$, they are circles centered at the origin. The smallest circle that reaches x+y=6 just touches it at (3,3). A larger circle intersects the line elsewhere, and a smaller circle does not reach the feasible set. Tangency identifies a candidate; its geometric meaning explains why an ordinary zero-gradient equation is not the appropriate condition.

Always translate the model completely. A statement such as x+y=6 with x,y nonnegative gives a closed line segment, whereas the equality alone gives an unbounded line. These feasible sets have the same interior candidate but different maximum behavior. The segment has a largest squared distance at its endpoints; the unbounded line has none. Constraints include inequalities, exclusions, and units, even when our main calculation uses one equality.

Related definitions: [feasible set](ref:calculus-feasible-set).

## Use substitution when it simplifies the problem

If a constraint can be solved conveniently for one variable, substitution converts the problem to one-variable optimization. Preserve the domain while substituting. From x+y=6, obtain y=6-x. The objective becomes $F(x)=x^2+(6-x)^2=2(x-3)^2+18$. The completed square proves the minimum eighteen at x=3, y=3, over the full line. There is no maximum because the squared term grows without bound.

If the original model also requires x,y nonnegative, then x lies in [0,6]. Differentiate to find the interior candidate x=3, then compare it with endpoints zero and six. The values are eighteen, thirty-six, and thirty-six. Both endpoints maximize the objective on the segment. A derivative calculation alone would have found the minimum but omitted the maximum.

Substitution also handles models whose objective is not a distance. Suppose a rectangle has positive side lengths x and y and fixed perimeter twenty. Its constraint is x+y=10, and its area is $A(x)=x(10-x)$ for $0<x<10$. The derivative is 10-2x, so the largest area is twenty-five at the square (5,5). No smallest positive area is attained: areas approach zero as a side approaches zero, but a zero-length side is excluded.

Elimination must preserve every branch. Solving $x^2+y^2=1$ as $y=\sqrt{1-x^2}$ describes only the upper semicircle. The lower branch has a minus sign. If the full circle is feasible, optimizing on one branch alone may miss a candidate. Parameterizing by x=cos t, y=sin t is another possible approach, using a parameter range that covers the entire circle.

Choose substitution for convenience, not as a rule that it always reduces the work. A symmetric constraint or several tightly linked variables may be clearer with gradient equations. Both methods must optimize over exactly the same feasible inputs and must distinguish an attained extremum from a merely approached bound.

Related definitions: [constraint substitution](ref:calculus-constraint-substitution).

## Set up and solve the Lagrange equations

Let f be the objective and let g(x,y)=c describe one equality constraint. Assume both functions have continuous first partial derivatives near the point, and $\nabla g\ne 0$ there. A local extremum along the smooth constraint must satisfy $\nabla f=\lambda\nabla g$ together with g=c. The extra scalar $\lambda$, pronounced lambda, is the Lagrange multiplier. It expresses how the two normal vectors are scaled relative to each other.

For $f=x^2+2y^2$ with x+y=6, choose g=x+y. The equations are $2x=\lambda$, $4y=\lambda$, and x+y=6. The first two imply x=2y; substitution into the constraint gives y=2, x=4, and lambda=8. The objective value is sixteen plus eight, or twenty-four. To establish the global minimum, substitute y=6-x into f or complete a square; merely solving the multiplier equations gives a candidate.

An equivalent method introduces the Lagrangian $L(x,y,\lambda)=f(x,y)-\lambda(g(x,y)-c)$. Setting all its first partial derivatives to zero reproduces the same three equations. Some books use a plus sign instead; that changes the sign of the reported multiplier, not the candidate x and y. We use the minus convention throughout this lesson.

Do not omit the constraint equation. Parallel gradients at an infeasible point do not solve the problem. Also avoid dividing by a variable before considering whether it might be zero. For extrema on a circle, equations such as x times an expression equals zero can produce several separate branches of candidates.

The method extends to a scalar objective in three variables with one smooth equality: there are three gradient-component equations and one constraint. We remain with one equality here. Multiple equalities and general inequality methods require additional conditions. Even within this scope, record the regularity assumption and compare candidate objective values before reporting an optimum.

Related definitions: [Lagrange multiplier](ref:calculus-lagrange-multiplier).

## Compare all candidates and boundaries

A continuous objective on a nonempty closed bounded feasible set attains both a minimum and a maximum. The multiplier method can locate candidates on smooth pieces, but the global result requires a complete candidate list and comparison. Any additional endpoints, corners, or singular points must be checked separately.

For $f(x,y)=xy$ on the unit circle, take g=x squared plus y squared. The equations are $y=2\lambda x$, $x=2\lambda y$, and $x^2+y^2=1$. Neither x nor y can be zero in these equations: one zero would force the other zero and violate the circle constraint. Substitution gives $4\lambda^2=1$, hence lambda is one half or minus one half. Therefore y=x or y=-x.

On each branch, the constraint gives $x^2=1/2$. The two same-sign points give f=1/2; the two opposite-sign points give f=-1/2. These are respectively the global maximum and minimum. The circle is compact, the constraint gradient never vanishes on it, and every candidate has been considered. The inequality $2|xy|\leq x^2+y^2=1$ supplies an independent bound confirming the result.

Now restrict the circle to the first quadrant, including its endpoints. Only the positive same-sign point remains as an interior candidate on the arc. It gives maximum one half. The endpoints (1,0) and (0,1) give the minimum zero. The endpoints were not stationary for the full-circle problem, yet they matter for the restricted feasible set.

Write down all branches before simplifying, label candidate locations and their objective values separately, and check each location against every constraint. Existence and classification are different tasks: compactness guarantees that extrema exist, whereas the calculations identify them. On an open or unbounded set, one or both may fail to be attained even when some constrained stationary points exist.

Related definitions: [constrained extremum comparison](ref:calculus-constrained-extremum-comparison).

## Recognize singular constraints and modeling limits

The condition $\nabla g\ne 0$ is part of the multiplier theorem, not a technical decoration. If it fails, the equation $\nabla f=\lambda\nabla g$ can miss a constrained optimum. Consider minimizing f=x subject to $g=x^2+y^2=0$. The feasible set contains only (0,0), so that point is both a minimum and maximum. But the objective gradient is (1,0) while the constraint gradient is (0,0); no multiplier makes them equal.

The failure is in the regularity assumption. There is no smooth curve of nearby feasible directions at this isolated point. Direct inspection of the constraint solves the problem. This example also explains why an empty list from the multiplier equations does not establish that a constrained problem has no optimum.

How the same set is described can affect regularity. The line x+y=2 has a nonzero normal (1,1). Writing the equivalent constraint $(x+y-2)^2=0$ makes its gradient zero along the entire line. The feasible set is unchanged, but the squared representation destroys the hypothesis needed by the simple multiplier equations. Use the unsquared regular equation when possible.

Check other limitations as well. A differentiable objective may lack a maximum on an unbounded feasible line. An open segment may approach an endpoint value without attaining it. A physical requirement such as positive length excludes a degenerate rectangle even if its limiting area looks attractive. A mathematically feasible result can still be unusable if a relevant modeling constraint was omitted.

A reliable solution states the objective, all constraints, regular candidates, exceptional points, and the comparison establishing the conclusion. If a bound is approached but not attained, report that explicitly. If the model uses approximate measurements or a simplified cost, its optimum describes that model. Calculus does not turn an incomplete objective into a complete decision; it makes the consequences of the chosen objective and feasible set precise.

Related definitions: [regular constraint point](ref:calculus-regular-constraint-point).
