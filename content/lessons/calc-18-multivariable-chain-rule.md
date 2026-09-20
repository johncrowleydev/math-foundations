# Multivariable Chain Rule and Jacobians

Many useful models are compositions: parameters produce predictions, predictions produce errors, and errors produce an objective. The multivariable chain rule tracks how a change passes through those stages. This lesson connects scalar dependency paths to matrix multiplication and keeps the evaluation points visible.

## A moving input changes several coordinates

A partial derivative holds other inputs fixed. A moving input usually does not. If $z=f(x,y)$ while $x=x(t)$ and $y=y(t)$, both coordinates can transmit a change in t to the output. For differentiable functions, the chain rule adds these contributions: $dz/dt=f_x\,dx/dt+f_y\,dy/dt$. The partials are evaluated at the current pair $(x(t),y(t))$.

Take $f(x,y)=x^2y$, $x(t)=t+1$, and $y(t)=t^2$. First differentiate the outer function: $f_x=2xy$ and $f_y=x^2$. Differentiate the inputs: $x'=1$, $y'=2t$. The path derivative is $2(t+1)t^2+2t(t+1)^2$. At t=1 it is twelve. Substitution first gives $(t+1)^2t^2$, whose ordinary product-rule derivative agrees. These two routes provide a useful independent check.

The distinction matters even when a variable name is repeated. If $z=f(t,y(t))$, there is a direct t contribution and an indirect one through y. The total derivative is $f_t+f_y y'$. Treating $f_t$ alone as the total derivative silently holds y fixed, answering a different question.

### Evaluation points and units

Suppose $f_x=3$ degrees per meter and $f_y=-2$ degrees per second at a point, while a trajectory changes x at four meters per second and y at one second per second. The output rate is $3(4)-2(1)=10$ degrees per second. Each product must have output-per-parameter units before the products are added.

The chain rule requires differentiability of the relevant composition maps. Merely knowing coordinate partials at a pathological point is insufficient. For smooth polynomials and elementary functions on their valid domains the hypotheses are straightforward; at singular points they must be checked.

Related definitions: [total path derivative](ref:calculus-total-path-derivative).

## Dependency paths organize the sum

A dependency diagram records which variables feed which functions. Draw the independent parameter at one end, intermediate variables in the middle, and the output at the other. Along a path, multiply local derivatives. Add products over all paths leading from the chosen input to the output. The diagram is a bookkeeping device for the chain rule, not a replacement for the theorem's hypotheses.

Suppose $u=s+t$, $v=s-t$, and $z=u^2+3v$. Holding t fixed, both u and v change at rate one with s. Hence $z_s=2u+3$. Holding s fixed, their rates with t are one and negative one, so $z_t=2u-3$. After substitution these become $2(s+t)+3$ and $2(s+t)-3$.

For another layer, let $w=z^2$. Then $w_s=2z(2u+3)$. The derivative of the final squaring operation multiplies the total derivative already collected at z. Forgetting one branch under z would produce a wrong result even if the last chain factor were correct.

### Shared intermediates count once per path

Consider $u=t^2$, $v=u+1$, and $w=uv$. There are two paths from u to w: the direct factor u and the path through v. Thus $dw/du=v+u$ and $dw/dt=(v+u)2t$. Substituting v=u+1 gives $2t(2t^2+1)$. Calling u and v independent during the entire calculation would lose their dependency; treating both occurrences of u as a single factor would lose the product rule.

Name the independent variables first, identify what is held fixed, and label every edge with its local derivative. Only after the symbolic paths are correct should you substitute numerical values. This order reduces the risk of evaluating an intermediate at the wrong point or turning a variable into a constant too early.

Related definitions: [dependency path](ref:calculus-dependency-path).

## The Jacobian is the derivative matrix

When a function returns a vector, its derivative collects one row per output and one column per input. This matrix is the Jacobian. For $F(x,y)=(x^2+y,xy)$, the first row differentiates the first output and the second row differentiates the second output: $J_F=\begin{pmatrix}2x&1\\y&x\end{pmatrix}$. Multiplying by a small column displacement predicts the first-order output displacement.

At $(1,2)$ the matrix is $\begin{pmatrix}2&1\\2&1\end{pmatrix}$. For displacement $(h,k)$, both output changes are approximately $2h+k$. The nonlinear outputs need not be identical; their first-order behavior happens to agree at this point. A Jacobian describes local change, not the function's entire formula.

For a map from n inputs to m outputs the Jacobian has m rows and n columns. A scalar function has a one-row Jacobian. We write its gradient as a column vector when multiplying matrices, so that this Jacobian is the gradient transpose. Writing gradients as tuples in a hand calculation does not erase this orientation convention.

### A rectangular example

Let $G(s,t)=(s+t,s-t,2s)$. Its Jacobian has three rows and two columns: rows $(1,1)$, $(1,-1)$, and $(2,0)$. A two-component input displacement is mapped to a three-component output displacement. There is no determinant of this rectangular Jacobian; a derivative matrix need not be square.

To construct a Jacobian, state the input order and output order, differentiate each output with respect to each input, and verify the dimensions. If the map is already linear, the Jacobian is its constant matrix. If it is affine, the fixed offset disappears under differentiation while its matrix remains. This connects the new notation directly to earlier linear transformations.

Related definitions: [Jacobian matrix](ref:calculus-jacobian-matrix).

## Composition becomes matrix multiplication

Suppose G sends n inputs to m intermediate values and F sends those m values to p outputs. The derivative of the composition is $J_{F\circ G}(x)=J_F(G(x))J_G(x)$. The product has shape p by n. The rightmost matrix acts first, just as it did for composition of linear transformations.

Take $G(s,t)=(s+t,s-t)$ and $F(u,v)=(u^2,uv)$. At $(s,t)=(2,1)$, the intermediate point is $(u,v)=(3,1)$. The outer derivative there has rows $(6,0)$ and $(1,3)$. The inner derivative has rows $(1,1)$ and $(1,-1)$. Multiplying gives rows $(6,6)$ and $(4,-2)$.

Direct substitution produces the output pair $((s+t)^2,s^2-t^2)$. Differentiating it at $(2,1)$ gives the same rows. This check catches both a reversed multiplication order and evaluation of the outer Jacobian at the wrong coordinates.

For scalar output, the matrix product reduces to sums over dependency paths. Each entry of a row-times-column product sums the outer sensitivity to one intermediate multiplied by that intermediate's sensitivity to the original input. There is no new calculus rule hiding behind the matrix notation; the notation organizes the old one.

### Shapes are a mathematical check

If G maps two inputs to three intermediates and F maps three intermediates to one output, the matrices have shapes one-by-three and three-by-two. Their product is one-by-two. Reversing them is not even defined. When both happen to be square, dimensions alone cannot catch a reversal, so track what space each matrix accepts. Finally, numerical agreement at a single point is a useful arithmetic check but does not prove two symbolic derivative formulas agree everywhere.

Related definitions: [Jacobian chain rule](ref:calculus-jacobian-chain-rule).

## Implicit dependencies and computation graphs

A relation can define an output implicitly. Suppose $H(x,y)=0$ determines y as a differentiable function of x near a point, with $H_y\ne0$. Differentiating the relation along that curve gives $H_x+H_y y'=0$, hence $y'=-H_x/H_y$. The nonzero denominator condition is part of the local argument, not an optional arithmetic detail.

For $H(x,y)=x^2+2y^2-6$, at $(2,1)$ the partials are four and four, so the implicit slope is negative one. At a point with y=0, this formula cannot solve for y as a differentiable function of x. The curve might instead be describable using x as a function of y; changing the dependent variable changes the relevant hypothesis.

### A small model-error graph

Let a prediction be $p=wx+b$, a residual $r=p-y$, and a loss $L=r^2/2$. Here x and y are fixed data; w and b are adjustable parameters. The local derivatives are $dL/dr=r$, $dr/dp=1$, $\partial p/\partial w=x$, and $\partial p/\partial b=1$. Multiplying along paths gives $L_w=rx$ and $L_b=r$.

At x=2, y=5, w=1, b=1, the prediction is three and the residual is negative two. The two loss derivatives are negative four and negative two. These are parameter sensitivities; they are not new predictions or residuals. With several observations, sum the path contributions from their loss terms. Shared parameters receive contributions from every relevant observation.

This is the mathematical idea behind propagating derivatives through a computation graph. It does not require implementing an automatic differentiation system in this lesson. The learner's task is to identify dependencies, calculate local derivatives, combine all paths, and check the result by differentiating a substituted expression when feasible.

Related definitions: [implicit differentiation in several variables](ref:calculus-implicit-differentiation-in-several-variables).
