# Functions

A function makes a promise: every allowed input has exactly one output. That promise is more specific than a general relation, and it does not imply that different inputs have different outputs. Understanding the domain, codomain, and uniqueness conditions makes claims about mappings precise.

This lesson builds on [Relations](../lessons/04-relations.md) and [Sets and Set Operations](../lessons/03-sets-and-set-operations.md). We will use quantified statements to distinguish existence, uniqueness, and invertibility.

## What a function specifies

The notation

$$
f:A\to B
$$

describes a function with **domain** $A$ and **codomain** $B$. For every $a\in A$, there must be exactly one $b\in B$ assigned to it. That output is denoted $f(a)$.

Equivalently, a function is a relation $F\subseteq A\times B$ satisfying

$$
\forall a\in A,\ \exists!b\in B,\ (a,b)\in F.
$$

The symbol $\exists!$ means “there exists exactly one.” A missing output violates existence; two different outputs for the same input violate uniqueness. Several inputs sharing one output cause neither problem.

For example, $f:\{1,2,3\}\to\{u,v\}$ given by $f(1)=u$, $f(2)=u$, and $f(3)=v$ is a function. The relation $\{(1,u),(1,v),(2,u),(3,v)\}$ is not, because input 1 has two outputs.

An expression alone is not a complete function specification. The rule $f(x)=x^2$ can define $\mathbb R\to\mathbb R$, $\mathbb R\to[0,\infty)$, or $[0,\infty)\to[0,\infty)$. These have different domains or codomains and different properties. Here $[0,\infty)$ denotes the set of nonnegative real numbers, including zero.

The rule $f(x)=1/x$ does not define a function $\mathbb R\to\mathbb R$ because no real output is specified at zero. It does define one on $\mathbb R\setminus\{0\}$. A partial function permits undefined inputs, but all functions in this lesson are total on their stated domains unless explicitly described otherwise.

## Image and preimage

For a subset $S\subseteq A$, its **image** under $f$ is

$$
f(S)=\{f(x):x\in S\}\subseteq B.
$$

The image $f(A)$ of the whole domain is also called the range. We use “codomain” for the declared target and “image” for the outputs actually reached, avoiding ambiguity in the word range.

For $f:\mathbb Z\to\mathbb Z$ with $f(n)=2n$, the codomain is every integer, but the image contains only even integers. If $S=\{-1,0,2\}$, then $f(S)=\{-2,0,4\}$.

For a subset $T\subseteq B$, its **preimage** is

$$
f^{-1}(T)=\{x\in A:f(x)\in T\}.
$$

The preimage collects inputs, not outputs. It exists for every function; the notation does not assert that $f$ has an inverse function.

With $g:\mathbb R\to\mathbb R$ given by $g(x)=x^2$, we obtain $g^{-1}(\{4\})=\{-2,2\}$, $g^{-1}(\{-1\})=\varnothing$, and $g^{-1}([0,4])=[-2,2]$. The last interval includes every real number between $-2$ and 2, not only integers.

Preimages preserve basic set operations:

$$
\begin{aligned}
f^{-1}(T\cup V)&=f^{-1}(T)\cup f^{-1}(V),\\
f^{-1}(T\cap V)&=f^{-1}(T)\cap f^{-1}(V),\\
f^{-1}(B\setminus T)&=A\setminus f^{-1}(T).
\end{aligned}
$$

For the intersection identity, an input belongs to the left side exactly when its output belongs to both $T$ and $V$, which is exactly membership in both preimages. The other identities follow the same element-by-element reasoning.

For input subsets $S,W\subseteq A$, images preserve unions, but in general only

$$
f(S\cap W)\subseteq f(S)\cap f(W).
$$

For $g(x)=x^2$, take $S=\{-1\}$ and $W=\{1\}$. Their intersection is empty, but both images are $\{1\}$. A shared output can arise from different inputs. These input subsets are distinct in role from the target subsets $T,V\subseteq B$ used in the preimage identities.

## Injective functions

A function is **injective**, or one-to-one, when equal outputs force equal inputs:

$$
\forall x,y\in A,\ f(x)=f(y)\to x=y.
$$

Equivalently, distinct inputs have distinct outputs. To disprove injectivity, provide two different domain elements with the same output. These are often called a collision.

Consider $f:\mathbb Z\to\mathbb Z$ defined by $f(n)=3n+2$. If $f(a)=f(b)$, then $3a+2=3b+2$. Subtracting 2 and dividing by 3 gives $a=b$. Since $a,b$ were arbitrary integers, this proves injectivity.

For $g:\mathbb R\to\mathbb R$ with $g(x)=x^2$, the inputs $-1$ and 1 are different but have equal outputs, so $g$ is not injective. Restricting the domain to nonnegative reals removes such collisions: if $a^2=b^2$ with $a,b\geq0$, then $(a-b)(a+b)=0$. Either $a=b$, or $a+b=0$, which forces $a=b=0$. Thus the restricted function is injective.

Injectivity is a property of the function on its specified domain. Showing uniqueness for one output does not prove it for all outputs.

## Surjective functions

A function is **surjective**, or onto, when every element of the codomain is reached:

$$
\forall b\in B,\ \exists a\in A,\ f(a)=b.
$$

This says $f(A)=B$. To disprove it, exhibit an element of the codomain with no preimage.

The function $f:\mathbb Z\to\mathbb Z$ with $f(n)=3n+2$ is not surjective: output 0 would require $n=-2/3$, which is not an integer. The same formula defines a surjective function $\mathbb R\to\mathbb R$, because any real target $b$ has the real preimage $(b-2)/3$.

Likewise, $g:\mathbb R\to\mathbb R$, $g(x)=x^2$, is not surjective because negative targets are missed. If its codomain is changed to $[0,\infty)$, it becomes surjective: every allowed target $b$ has the preimage $\sqrt b$. It remains noninjective on its full real domain.

A surjectivity proof must verify that the proposed preimage belongs to the domain. Merely solving an equation formally is insufficient when solutions have a type or domain restriction.

## Bijections and inverse functions

A **bijection** is both injective and surjective. Every codomain element then has exactly one preimage, so the arrows can be reversed to define an inverse function

$$
f^{-1}:B\to A.
$$

Its defining identities are

$$
f^{-1}(f(a))=a\quad(a\in A),\qquad
f(f^{-1}(b))=b\quad(b\in B).
$$

For $f:\mathbb R\to\mathbb R$, $f(x)=3x+2$, solve $y=3x+2$ for $x$. This gives $f^{-1}(y)=(y-2)/3$. Both identities follow by substitution.

For $g:[0,\infty)\to[0,\infty)$, $g(x)=x^2$, the inverse is $g^{-1}(y)=\sqrt y$. Over all real inputs, writing $\pm\sqrt y$ would assign two outputs for a positive input $y$, so it would not define an inverse function.

An injective function that is not onto its declared codomain still has an inverse from its **image** to its domain. For $f:\mathbb Z\to\mathbb Z$, $f(n)=2n$, this inverse maps even integers to their halves. It is not an inverse defined on every integer.

Keep the two uses of $f^{-1}$ separate: $f^{-1}(T)$ for a set is always a preimage; $f^{-1}(b)$ as a single inverse-function value requires a suitable bijection.

## Composition and types

If $f:A\to B$ and $g:B\to C$, their **composition** is

$$
g\circ f:A\to C,\qquad (g\circ f)(a)=g(f(a)).
$$

Read right to left: apply $f$ first, then $g$. More generally, composition is defined if every output of the inner function belongs to the outer function's domain. Matching the inner codomain to the outer domain is a convenient sufficient condition.

Let $f,g:\mathbb R\to\mathbb R$ satisfy $f(x)=x+1$ and $g(x)=x^2$. Then $(g\circ f)(x)=(x+1)^2$, whereas $(f\circ g)(x)=x^2+1$. At $x=1$ these are 4 and 2. Composition is generally not commutative.

Composition is associative when the types permit it: both $h\circ(g\circ f)$ and $(h\circ g)\circ f$ send $a$ to $h(g(f(a)))$. The identity function $\operatorname{id}_A(a)=a$ changes no value, so $f\circ\operatorname{id}_A=f$ and $\operatorname{id}_B\circ f=f$.

If both functions are injective, their composition is injective. Indeed, $g(f(x))=g(f(y))$ first gives $f(x)=f(y)$ by injectivity of $g$, then $x=y$ by injectivity of $f$.

If both are surjective, their composition is surjective. Given any target $c\in C$, choose $b\in B$ with $g(b)=c$, then $a\in A$ with $f(a)=b$. Consequently $g(f(a))=c$. For bijections, these facts show that the composition is a bijection, and reversing its steps gives

$$
(g\circ f)^{-1}=f^{-1}\circ g^{-1}.
$$

There are useful one-way deductions too: injectivity of $g\circ f$ forces injectivity of $f$, and surjectivity of $g\circ f$ forces surjectivity of $g$. It does not force the other two properties: an outer function may collide only outside the inner image, or an inner function may miss values unnecessary for reaching the final target.

## Restrictions, empty cases, and finite sizes

For $S\subseteq A$, the **restriction** $f|_S:S\to B$ keeps the same rule but permits fewer inputs. Restricting a domain can remove collisions and can lose reached outputs. Changing the codomain to a subset is allowed only if it still contains every output of the specified domain.

There is exactly one function from $\varnothing$ to any set $B$: the empty assignment. It is injective. It is surjective exactly when $B=\varnothing$. There is no function from a nonempty set into $\varnothing$, because even one input would need an impossible output.

For finite sets, if $|A|=m$ and $|B|=n$, there are $n^m$ functions $A\to B$ when $n>0$: each of $m$ inputs independently chooses one of $n$ outputs. An empty domain still gives exactly one function, including when the codomain is empty; we state this case directly rather than relying on a convention for $0^0$.

An injection requires $m\leq n$ because its $m$ distinct outputs must fit in $B$. A surjection requires $m\geq n$ because every target needs an input and one input supplies only one output. When $m=n$, either property forces the other. If $m$ distinct outputs fill an $m$-element codomain, none is missed; if every one of $m$ targets is reached by $m$ inputs, a collision would leave too few inputs for the remaining targets.

This last equivalence is specifically finite. The function $f:\mathbb N_0\to\mathbb N_0$, $f(n)=n+1$, is injective but misses 0, although its domain and codomain are the same infinite set.

## Floor and ceiling functions

The **floor** $\lfloor x\rfloor$ is the greatest integer at most the real number $x$. The **ceiling** $\lceil x\rceil$ is the least integer at least $x$. Thus

$$
\lfloor x\rfloor\leq x<\lfloor x\rfloor+1,
\qquad
\lceil x\rceil-1<x\leq\lceil x\rceil.
$$

Examples are $\lfloor2.7\rfloor=2$, $\lceil2.7\rceil=3$, $\lfloor-2.7\rfloor=-3$, and $\lceil-2.7\rceil=-2$. Floor does not mean truncation toward zero. At an integer, both functions return that integer.

Both define surjections $\mathbb R\to\mathbb Z$, but neither is injective. For example, floor sends both 2.1 and 2.9 to 2. The preimage of $\{k\}$ under floor is $[k,k+1)$, including its left endpoint but excluding its right.

If $N\geq0$ items must fit into containers of positive integer capacity $k$, the minimum number of containers is $\lceil N/k\rceil$. Seven items with capacity 3 need three containers, while zero items need zero. To justify the formula, an integer container count $c$ must satisfy $ck\geq N$, equivalently $c\geq N/k$; the ceiling is the smallest such integer.

## Checking a composed claim carefully

Let $A=\{a,b\}$, $B=\{1,2,3\}$, and $C=\{u,v\}$. Set $f(a)=1$, $f(b)=2$, and $g(1)=u$, $g(2)=v$, $g(3)=u$. The composition sends $a$ to $u$ and $b$ to $v$, so it is a bijection. However, $f$ is not surjective onto $B$, and $g$ is not injective on $B$. What matters for the composition's injectivity is the behavior of $g$ on $f(A)=\{1,2\}$; the collision involving 3 is outside the inner function's image.

This single mapping diagram, written as values, supplies counterexamples to two tempting converse claims. When a theorem says “if both functions have property $P$, then their composition has $P$,” reversing the implication needs a separate proof and may be false. Tiny finite examples are often enough to expose the missing condition.

The same data lets us check preimages through a pipeline. The target set $\{u\}$ has preimage $\{1,3\}$ under $g$, then preimage $\{a\}$ under $f$. Directly, $(g\circ f)^{-1}(\{u\})=\{a\}$ too. In general, an input reaches a target set under the composition exactly when its intermediate value belongs to the target's preimage under the outer function. This statement concerns sets of inputs and needs no inverse function.

## Readiness check

You should be able to:

- Verify that a rule gives exactly one allowed output for each domain element.
- Distinguish a codomain, an image, and a preimage.
- Prove injectivity and surjectivity using arbitrary inputs and targets.
- Find the domain on which a proposed inverse actually works.
- Compose functions in the correct order with compatible domains.
- Explain why finite-size conclusions may fail for infinite sets.
- Use floor and ceiling correctly for negative values and discrete counts.

Practice with the [Functions worksheet](../worksheets/05-functions.yaml). Continue to [Sequences and Summations](../lessons/06-sequences-and-summations.md).
