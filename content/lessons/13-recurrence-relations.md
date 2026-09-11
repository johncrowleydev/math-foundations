# Recurrence Relations

A recurrence relation specifies a sequence using earlier values. It can describe a growing balance, a recursively defined combinatorial count, or the work performed by a recursive algorithm. The central questions are whether the definition determines the sequence, how to compute its terms, and how to prove a proposed formula.

This lesson builds on [Sequences and Summations](../lessons/06-sequences-and-summations.md), [Mathematical Induction](../lessons/10-mathematical-induction.md), and [Strong Induction](../lessons/11-strong-induction.md). Sequence values and coefficients are real unless another domain is stated. We will work with integer indices and use algebra and finite sums. No calculus is needed.

## A recurrence needs a domain and initial conditions

A recurrence is a rule for continuing a sequence, so first ask where the continuation begins. Without a starting value, “add three each time” describes many sequences. Without an index range, even a familiar-looking rule can request a term that has never been defined. These details determine the mathematical object we are trying to solve for.

Consider

$$
a_n=a_{n-1}+3.
$$

This says how consecutive terms relate, but does not specify which sequence we mean. The sequences $0,3,6,\ldots$ and $10,13,16,\ldots$ both fit. A complete definition is

$$
a_0=2,\qquad a_n=a_{n-1}+3\quad(n\geq1).
$$

Now the first terms are $2,5,8,11,\ldots$. Every nonnegative-indexed term is uniquely determined by repeated application of the rule.

A recurrence referring to two earlier terms generally needs two initial values. For example,

$$
a_0=0,\quad a_1=1,\quad a_n=a_{n-1}+a_{n-2}\quad(n\geq2)
$$

defines the Fibonacci sequence. Starting the recurrence at $n=1$ would refer to the undefined value $a_{-1}$.

A **closed form** expresses $a_n$ directly in terms of $n$ and fixed constants, without recursively requesting earlier values. A recurrence and a closed form are different descriptions of the same sequence when they agree on the initial conditions and recurrence rule.

## Iteration: unfold the definition

Unfolding means substituting the rule into itself until the pattern of earlier contributions becomes visible. Keep track of two things at once: how far the index has moved and how much has accumulated along the way. Stopping at the actual initial term determines the number of steps.

For the recurrence $a_0=2$, $a_n=a_{n-1}+3$ at integer indices $n\geq1$, repeatedly substituting gives the following chain when $n\geq3$ (for $n=1,2$, stop sooner at $a_0$):

$$
\begin{aligned}
a_n&=a_{n-1}+3\\
&=a_{n-2}+2\cdot3\\
&=a_{n-3}+3\cdot3\\
&=a_0+3n=2+3n.
\end{aligned}
$$

There are $n$ increments because the index descends from $n$ to 0. Writing the last step prevents an off-by-one error.

If $a_0=5$ and $a_n=2a_{n-1}$ for $n\geq1$, each substitution supplies one factor of 2, giving $a_n=5\cdot2^n$.

These observations can guide a **conjecture**, a proposed statement whose truth has not yet been established. A proof by induction verifies it for all allowed indices: check $n=0$, assume the formula at $n-1$, and substitute into the recurrence. Verification matters because an early numerical pattern can be misleading.

![Substitute until the initial value](figure:recurrence-unfold)

## Differences and telescoping

If a recurrence tells us how much changes at each step, adding those changes should recover the total change. This is exactly what telescoping does. The intermediate sequence values cancel because each appears once as a new value and once as an old value; only the starting and ending values remain.

Suppose

$$
a_0=1,\qquad a_n=a_{n-1}+n\quad(n\geq1).
$$

Rewrite the recurrence as $a_n-a_{n-1}=n$ and sum from 1 to $n$:

$$
(a_1-a_0)+(a_2-a_1)+\cdots+(a_n-a_{n-1})
=1+2+\cdots+n.
$$

Every interior sequence term cancels. Thus

$$
a_n=1+\frac{n(n+1)}2.
$$

More generally, let $f$ be a specified real-valued function on the positive integer indices. If $a_n-a_{n-1}=f(n)$ for $n\geq1$, then

$$
a_n=a_0+\sum_{j=1}^n f(j).
$$

The empty sum at $n=0$ is zero, so the formula includes the initial condition.

**Worked example: odd increments.** If $b_0=0$ and $b_n=b_{n-1}+2n-1$, then

$$
b_n=\sum_{j=1}^n(2j-1)
=2\frac{n(n+1)}2-n=n^2.
$$

The recurrence expresses the fact that adding the next odd number grows one square number into the next.

## First-order linear recurrences

The term **first-order** means the rule reaches back one index. **Linear** means the earlier sequence value appears only to the first power, multiplied by a coefficient that does not depend on that value. In general the coefficient may depend on the index; this section keeps both the coefficient and the added amount fixed. Unfolding shows how the original value and each later addition are multiplied as time passes.

Fix real constants $r,b$ and an initial real value $a_0$. A common form is

$$
a_n=ra_{n-1}+b\quad(n\geq1),
$$

A linear recurrence is **homogeneous** if there is no added term independent of earlier sequence values; otherwise it is **nonhomogeneous**. Here the homogeneous case has $b=0$ and solution $a_n=r^na_0$ for $n\geq1$, with the specified initial value handled separately. This also covers $r=0$ without needing to interpret $0^0$.

Unfolding the general case gives, for $n\geq1$,

$$
a_n=r^na_0+b\sum_{j=0}^{n-1}r^j.
$$

In this finite sum, $r^0$ is the empty product 1, including when $r=0$.

If $r\neq1$, the finite geometric sum yields

$$
a_n=r^na_0+b\frac{r^n-1}{r-1}.
$$

If $r=1$, the recurrence instead gives $a_n=a_0+bn$. Do not substitute $r=1$ into a formula whose denominator is $r-1$.

For $a_0=1$ and $a_n=2a_{n-1}+3$, the result is

$$
a_n=2^n+3(2^n-1)=4\cdot2^n-3.
$$

The first terms are $1,5,13,29$, consistent with the formula. To prove it, the base case gives $4-3=1$, and the induction step gives

$$
2(4\cdot2^{n-1}-3)+3=4\cdot2^n-3.
$$

An **equilibrium** is a value $L$ unchanged by the update: substituting $L$ must give $L=rL+b$. Finding one provides an alternative solution method. For $r\neq1$, $L=b/(1-r)$. Subtracting this constant transforms the recurrence into

$$
a_n-L=r(a_{n-1}-L).
$$

That is geometric growth or decay measured from $L$. In the example, $L=-3$, so $a_n+3=2(a_{n-1}+3)$.

## A varying nonhomogeneous term

The added contribution need not be the same at every step. An amount introduced early gets multiplied again on every later step, while the most recent contribution has not yet been multiplied at all. Reading the powers of $r$ this way explains the weighted sum below without treating it as a formula to memorize.

Fix a real multiplier $r$ and a specified real contribution $f(n)$ at each positive integer index. The same unfolding idea handles $a_n=ra_{n-1}+f(n)$ for $n\geq1$:

$$
a_n=r^na_0+\sum_{j=1}^n r^{n-j}f(j).
$$

Each contribution $f(j)$ is multiplied by $r$ once for every later step, explaining the factor $r^{n-j}$. For $j=n$, this factor is the empty product 1, including when $r=0$.

For example, let $a_0=0$ and $a_n=2a_{n-1}+2^n$. **Normalizing** here means dividing out the known exponential factor: divide both sides by $2^n$ and set $b_n=a_n/2^n$. Then

$$
b_n=b_{n-1}+1,\qquad b_0=0.
$$

Therefore $b_n=n$ and $a_n=n2^n$. A nonhomogeneous contribution that grows at the same rate as the homogeneous solution can introduce an extra factor of $n$.

Checking the formula directly is short:

$$
2(n-1)2^{n-1}+2^n=n2^n.
$$

## Second-order homogeneous recurrences

**Second-order** means the recurrence reaches back two indices. Now two earlier values influence the next one, so we need two starting values and a richer family of candidate solutions. **Homogeneous** means there is no extra term independent of those sequence values. Geometric sequences are useful candidates because shifting an index merely changes a power by a fixed factor, turning the recurrence into an algebraic equation for that factor.

Fix real coefficients $p,q$. Consider

$$
a_n=pa_{n-1}+qa_{n-2}\quad(n\geq2)
$$

with two specified initial values. For a nonzero candidate base $r$, trying $a_n=r^n$ leads to

$$
r^2-pr-q=0.
$$

This is the **characteristic equation**. The polynomial on its left side is the **characteristic polynomial**. If it has two distinct real roots $r_1,r_2$, each corresponding geometric sequence satisfies the recurrence, and linearity shows that

$$
a_n=Ar_1^n+Br_2^n
$$

does too. Constants $A,B$ are chosen to match $a_0,a_1$. For a zero root, the associated sequence is interpreted as $1,0,0,\ldots$, rather than leaving $0^0$ ambiguous.

Why does finding such a sequence solve the problem? Two sequences satisfying the same recurrence and the same two initial conditions must agree. If they agree through index $n-1$, the recurrence forces them to agree at $n$. Induction proves uniqueness. Thus no further candidate solutions need to be classified once we have matched the initial data.

**Worked example: two distinct roots.** Let

$$
a_0=2,\quad a_1=5,\quad a_n=5a_{n-1}-6a_{n-2}.
$$

The characteristic polynomial is $(r-2)(r-3)$, so try $a_n=A2^n+B3^n$. Initial conditions give $A+B=2$ and $2A+3B=5$, hence $A=B=1$. Therefore

$$
a_n=2^n+3^n.
$$

Substituting verifies the recurrence, and uniqueness finishes the proof.

![A term depends on two predecessors](figure:recurrence-dependencies)

## Repeated roots

A **repeated root** occurs when the same linear factor appears twice. If the characteristic equation has the same root twice, writing two constant multiples of the same geometric sequence does not give two independent choices: the constants simply combine. The extra factor of $n$ supplies the missing flexibility. Dividing out the common geometric factor explains why that particular form works.

Write $\rho$, the Greek letter rho, for this repeated real root; $A,B$ below are real constants chosen from the initial values. When the characteristic polynomial is $(r-\rho)^2$ with $\rho\neq0$, two usable solutions are $\rho^n$ and $n\rho^n$. The general candidate is

$$
a_n=(A+Bn)\rho^n.
$$

To justify the extra factor, the recurrence is

$$
a_n=2\rho a_{n-1}-\rho^2a_{n-2}.
$$

Divide by $\rho^n$ and write $b_n=a_n/\rho^n$. Then $b_n=2b_{n-1}-b_{n-2}$, so $b_n-b_{n-1}=b_{n-1}-b_{n-2}$. Its consecutive differences are constant; therefore $b_n=A+Bn$.

For $a_0=1$, $a_1=6$, and $a_n=4a_{n-1}-4a_{n-2}$, the repeated root is 2. The conditions give $A=1$ and $2(A+B)=6$, so $B=2$ and

$$
a_n=(1+2n)2^n.
$$

The nonzero-root assumption was needed for division. If the repeated root is zero, then $p=q=0$: the recurrence directly says $a_n=0$ for all $n\geq2$, while $a_0,a_1$ remain their specified values.

## Recurrences from counting

To derive a counting recurrence, split larger objects into cases that correspond exactly to smaller objects. Both directions of the correspondence matter: removing an initial piece should produce a valid smaller object, and every valid smaller object should extend back to an object in that case. This is stronger evidence than recognizing a familiar numerical pattern.

In this section $F_n$ denotes a new counting sequence, with the initial values specified here rather than the earlier Fibonacci initial values. Let $F_n$ count binary strings of length $n$ with no adjacent 1s. There is one empty string, so $F_0=1$, and $F_1=2$.

For $n\geq2$, partition valid strings by their beginning. A string beginning with 0 can be followed by any valid length-$(n-1)$ string. A string beginning with 1 must begin with 10, followed by any valid length-$(n-2)$ string. These cases are disjoint and exhaustive, giving

$$
F_n=F_{n-1}+F_{n-2}.
$$

Consequently $F_2=3$, $F_3=5$, and $F_4=8$. The recurrence comes from a bijection between smaller valid objects and each case, not merely from noticing the numbers resemble Fibonacci terms.

## A recurrence for a recursive construction

The Tower of Hanoi puzzle has $n$ disks of distinct sizes on one of three pegs. A legal move transfers one top disk to another peg, and a larger disk may never be placed on a smaller one. Let $H_n$ be the minimum number of moves needed to transfer the whole ordered stack to another peg, with $H_0=0$.

A recursive strategy tells us how many moves one method uses. An **optimal** strategy uses the minimum possible number of moves. A minimum requires an additional argument that every legal strategy needs at least that many. The Tower of Hanoi makes this distinction concrete: the largest disk creates unavoidable work before and after its movement, which is what lets the construction's count become an optimal count.

For $n\geq1$, a construction is to move the top $n-1$ disks to the spare peg, move the largest disk directly to its destination, and move the smaller stack onto it. This gives an upper bound

$$
H_n\leq2H_{n-1}+1.
$$

Why is this also a lower bound? Before the largest disk moves for the first time, all smaller disks must be stacked on the third peg: its starting peg must be clear above it and the receiving peg must be empty. Moving the smaller stack there requires at least $H_{n-1}$ moves. After the largest disk moves for the last time into its final position, all smaller disks are again stacked on the remaining peg, and transferring them onto it requires at least another $H_{n-1}$ moves. Those before-first and after-last portions are disjoint, and there is at least one move of the largest disk between them. Thus every solution needs at least $2H_{n-1}+1$ moves.

Together the bounds prove the recurrence

$$
H_n=2H_{n-1}+1.
$$

The first-order formula gives $H_n=2^n-1$. Induction verifies the construction's count, while the lower-bound argument proves optimality. Merely presenting a recursive strategy would establish only how many moves that strategy uses, not that no better strategy exists.

## Testing and correcting a proposed formula

Test a candidate against the definition in two separate places: the initial data and the general recurrence. Passing the initial check only shows that the sequence starts correctly. Passing the recurrence check shows that the candidate advances correctly. The uniqueness supplied by the definition is what makes the two checks together decisive.

Suppose someone claims that $a_n=2^n$ solves $a_0=1$ and $a_n=2a_{n-1}+1$. The initial condition passes, but substitution gives $2\cdot2^{n-1}+1=2^n+1$, which differs from the candidate. The recurrence check detects the error for every positive index at once.

Using the correct first-order calculation gives

$$
a_n=2^n+(2^n-1)=2^{n+1}-1.
$$

Now both checks succeed: at zero the value is 1, and substituting the preceding term gives $2(2^n-1)+1=2^{n+1}-1$. This illustrates a useful distinction between discovering a formula and verifying it. Discovery can involve experimentation, tables, or guessing. Verification must show agreement with all the defining conditions.

For a second-order recurrence, checking only one starting value is similarly insufficient. The recurrence $a_n=3a_{n-1}-2a_{n-2}$ admits both the constant sequence $a_n=1$ and the sequence $a_n=2^n$. Both have $a_0=1$, but their values at index 1 differ. Initial data select the intended combination of solutions.

## Divide-and-conquer recurrences

**Divide and conquer** splits a problem into smaller subproblems, solves them, and combines their results. A **recursion tree** draws one node per call, connecting it to the calls it makes. A node's **level** counts connections from the root, starting at 0; the **depth** is the greatest level reached. Some recursive calls reduce size by a factor rather than by one. To follow all the work, organize calls into levels: the original call, its children, their children, and so on. At each level we need both the number of calls and the work per call. A shallow tree can still contain many calls, so depth alone is not the answer.

Some algorithms reduce input size multiplicatively. To avoid hidden rounding assumptions, first define the domain explicitly: let $n=2^k$ for an integer $k\geq0$.

The base-2 logarithm $\log_2 n$ is the exponent $k$ for which $2^k=n$. Thus $\log_2 8=3$, $\log_2 1=0$, and $\log_2(n/2)=\log_2 n-1$ for these positive powers of two.

Let $T(n)$ count total work at input size $n$, including all recursive calls. Suppose

$$
T(1)=1,\qquad T(n)=2T(n/2)+n\quad(n\geq2).
$$

This models two recursive half-size tasks plus exactly $n$ units of additional work. At integer level $j$, with $0\leq j\leq k$, a recursion tree has $2^j$ nodes of size $n/2^j$ at level $j$. Before the leaves, the level's additional work is

$$
2^j\frac{n}{2^j}=n.
$$

There are $k=\log_2 n$ such internal levels. At level $k$, there are $n$ leaves, each costing 1. Therefore

$$
T(n)=n\log_2 n+n.
$$

The leaf cost is part of the answer. Multiplying the root cost by the depth and forgetting leaves can produce an incorrect exact formula even when it suggests the correct growth order.

![Count calls and work at each level](figure:recurrence-levels)

## Proving a recursion-tree formula

The tree suggests a formula, and induction checks that the formula really satisfies the recurrence. Since the allowed sizes double, the natural integer induction variable is the exponent $k$ in $n=2^k$. This choice matches the recurrence's halving step with an ordinary one-step change in the induction index.

Induct on $k$, where $n=2^k$. At $k=0$, the formula gives $T(1)=1\cdot0+1=1$. Assume it holds at size $n/2$. Then

$$
\begin{aligned}
T(n)
&=2\left(\frac n2\log_2\frac n2+\frac n2\right)+n\\
&=n(\log_2 n-1)+2n\\
&=n\log_2 n+n.
\end{aligned}
$$

This proof covers precisely the powers-of-two domain. For arbitrary positive integers, an algorithm may generate subproblems of sizes $\lfloor n/2\rfloor$ and $\lceil n/2\rceil$. That is a different recurrence, requiring its own argument. One may obtain comparable growth bounds, but the exact powers-of-two formula cannot simply be asserted unchanged.

**Merge sort** motivates this model: sort two halves, then **merge** them by repeatedly taking the smaller next item to produce a single sorted list with work proportional to the total length. A real implementation's work is usually bounded above and below by constants times $n$, rather than exactly equal to $n$. Such bounds lead to a conclusion about eventual growth, not this particular exact operation count.

## Different amounts of branching

Two algorithms may halve their input at each recursive step and still do very different amounts of work. One may follow only one half, while the other explores both. Compare the total number of calls across each level, not just the length of one route from the root to a leaf.

On the same powers-of-two domain, let $S(1)=1$ and $S(n)=S(n/2)+1$. There is one recursive branch and one unit of work per internal level. Hence

$$
S(n)=\log_2 n+1.
$$

By contrast, let $U(1)=1$ and $U(n)=2U(n/2)+1$. The recursion tree has $n$ leaves and $n-1$ internal nodes, so $U(n)=2n-1$. Substitution confirms it: $2(2(n/2)-1)+1=2n-1$.

Both recurrences halve the input, yet their total work differs because one explores a single subproblem and the other explores both. Recursion depth alone does not determine running time.

## Guessing bounds and proving them

A bound is a promise in one direction, so the induction must preserve that direction. If substitution leaves an extra positive term beyond the proposed upper bound, the proof has not closed. Instead of hiding that term by choosing a vague “large enough” constant, use the failed calculation to diagnose what kind of bound the recurrence needs.

An exact formula is sometimes unnecessary. For example, if a nonnegative cost satisfies $T(1)=1$ and $T(n)\leq2T(n/2)+n$ on powers of two, induction with the same calculation proves

$$
T(n)\leq n\log_2 n+n.
$$

It does not prove equality or a matching lower bound. Preserve the direction of the information given by the recurrence.

When an induction guess fails, inspect the algebra. A guess $T(n)\leq cn$ for $T(n)=2T(n/2)+n$ leads to $T(n)\leq cn+n$, which does not establish the target. Raising $c$ within that same calculation does not remove the extra $n$. The recursion tree suggests including a logarithmic factor, and the verified exact formula explains why.

Common errors include omitting initial conditions, using a rule below its valid index range, confusing an observed pattern with proof, using only one constant for a second-order recurrence, forgetting repeated roots, and silently treating all input sizes as powers of two.

## Readiness check

Before continuing, check that you can:

- State a recurrence's index domain and sufficient initial conditions.
- Unfold a recurrence and count the substitution steps correctly.
- Use telescoping and finite geometric sums to obtain a formula.
- Solve the illustrated first- and second-order recurrences and verify the result.
- Derive a recurrence from a disjoint partition of counted objects.
- Account for both internal work and leaves in a recursion tree.
- Prove a proposed formula or bound on exactly its stated domain.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
