# Mathematical Induction

Checking a formula for $n=1,2,3$ gives evidence. Mathematical induction explains why a pattern holds for every allowed integer, using a verified starting point and a general rule that carries truth from one integer to the next.

This lesson builds on [Sequences and Summations](../lessons/06-sequences-and-summations.md) and the proof methods in [Direct Proof](../lessons/07-direct-proof.md), [Proof by Contrapositive](../lessons/08-proof-by-contrapositive.md), and [Proof by Contradiction](../lessons/09-proof-by-contradiction.md). We use $\mathbb{N}_0=\{0,1,2,\ldots\}$ and write integer starting indices explicitly.

Induction is a method for proving statements indexed by integers. It does not mean guessing from examples, and it does not justify a claim about every real number by checking consecutive integers.

## The induction principle

This method, which advances from one integer to the next, is called **ordinary induction**.

Let $P(n)$ be a statement for each integer $n\geq n_0$. To prove that $P(n)$ holds for all such $n$, establish:

1. **Base case:** $P(n_0)$ is true.
2. **Inductive step:** for every integer $k\geq n_0$, if $P(k)$ is true, then $P(k+1)$ is true.

The temporary assumption $P(k)$ is the **induction hypothesis**. After proving the conditional step for an arbitrary $k$, conclude that $P(n)$ holds for every integer $n\geq n_0$.

The base supplies $P(n_0)$. The step then supplies $P(n_0+1)$, then $P(n_0+2)$, and so on. For any particular integer at or beyond the starting point, finitely many applications reach it.

This argument depends on the discrete order of the integers. There is no “next real number” after 0, so the same principle cannot cover a real interval by incrementing one unit at a time.

## Why the hypothesis is not circular

In the inductive step, we do not declare the whole theorem true. We prove an implication: **if** the statement is true at one arbitrary index $k$, **then** it is true at the next index.

Assuming the hypothesis of an implication is legitimate, just as in a direct proof. The base case and the induction principle are what ultimately establish the whole family of statements.

Circular reasoning would assume $P(k+1)$ while attempting to prove $P(k+1)$, or assume $P(n)$ for every $n$ without restricting and discharging that assumption. Keep the index in the hypothesis distinct from the index in the goal.

Before calculating, write both $P(k)$ and $P(k+1)$ explicitly. This simple habit prevents many substitution mistakes.

## Worked proof: the sum of the first positive integers

**Claim.** For every integer $n\geq1$,

$$
\sum_{i=1}^{n}i=\frac{n(n+1)}2.
$$

**Base case.** When $n=1$, the left side is 1 and the right side is $1\cdot2/2=1$.

**Inductive step.** Let $k\geq1$ be an arbitrary integer, and assume

$$
\sum_{i=1}^{k}i=\frac{k(k+1)}2.
$$

Then

$$
\begin{aligned}
\sum_{i=1}^{k+1}i
&=\left(\sum_{i=1}^{k}i\right)+(k+1)\\
&=\frac{k(k+1)}2+(k+1)\\
&=\frac{(k+1)(k+2)}2.
\end{aligned}
$$

The second equality uses the induction hypothesis. The final expression is precisely the proposed formula with $n=k+1$. Thus $P(k)\to P(k+1)$, and induction proves the formula for every integer $n\geq1$.

Notice the change from $k+1$ to $k+2$ in the second factor. Replacing only some occurrences of $n$ would target the wrong formula.

## Empty sums and a base at zero

An empty sum has value 0. Therefore the preceding formula also makes sense at $n=0$: both sides are zero. We could instead prove it for all $n\in\mathbb{N}_0$ by using that base case and the same step.

Changing the base changes the theorem's stated domain. A proof starting at 1 does not, by itself, establish the case 0 even when that case happens to be true. Either include it as a base or verify it separately.

For a geometric sum, a zero base is especially natural.

**Claim.** For every integer $n\geq0$,

$$
\sum_{i=0}^{n}2^i=2^{n+1}-1.
$$

**Proof.** At $n=0$, both sides equal 1. Suppose the identity holds for an arbitrary integer $k\geq0$. Adding the next term gives

$$
\sum_{i=0}^{k+1}2^i=(2^{k+1}-1)+2^{k+1}=2^{k+2}-1.
$$

This is the required next case, so the identity follows by induction. Here the starting sum is not empty: its single term is $2^0=1$.

## Divisibility by induction

**Claim.** For every integer $n\geq0$, $3\mid(4^n-1)$.

**Base case.** At $n=0$, $4^0-1=0=3\cdot0$, so the divisibility statement is true.

**Inductive step.** Let $k\geq0$ and suppose $4^k-1=3t$ for some integer $t$. Then

$$
4^{k+1}-1=4(4^k-1)+3=4(3t)+3=3(4t+1).
$$

Since $4t+1$ is an integer, $3\mid(4^{k+1}-1)$. Induction establishes the claim.

The useful rearrangement was chosen to expose $4^k-1$, the expression controlled by the hypothesis. Trying to replace $4^k$ by an arbitrary multiple of 3 would be incorrect: it is $4^k-1$ that is divisible by 3.

Induction does not always provide the shortest divisibility proof, but it provides a reliable way to reason about a growing exponent or recursively changing expression.

## Inequalities require a bridge

When proving an equality, substitution and algebra often finish the step. For an inequality, the induction hypothesis may provide only an intermediate bound; another inequality must connect it to the desired next bound.

**Claim.** For every integer $n\geq4$,

$$
2^n\geq n^2.
$$

**Base case.** For $n=4$, both sides equal 16.

**Inductive step.** Let $k\geq4$, and assume $2^k\geq k^2$. Multiplying by positive 2 gives

$$
2^{k+1}=2\cdot2^k\geq2k^2.
$$

We still need $2k^2\geq(k+1)^2$. For $k\geq4$,

$$
2k^2-(k+1)^2=k^2-2k-1=(k-1)^2-2\geq7>0.
$$

Thus $2^{k+1}\geq(k+1)^2$, completing the step and the induction.

The statement fails at $n=3$, where $8<9$. Choosing the starting index is part of the theorem, not a cosmetic detail. Also, one must justify the bridge inequality; “the exponential grows faster” is an intuition, not this proof.

Multiplying an inequality by a negative quantity reverses its direction. Whenever an inductive estimate involves multiplication or division, check the sign conditions before proceeding.

## A recurrence and a claimed closed form

Suppose a sequence is defined by

$$
a_0=2,\qquad a_{n+1}=3a_n+1\quad(n\geq0).
$$

Computing a few terms gives $2,7,22,67$. A proposed formula is

$$
a_n=\frac{5\cdot3^n-1}{2}.
$$

**Proof.** At $n=0$, the formula gives $(5-1)/2=2=a_0$. For an arbitrary $k\geq0$, assume the formula for $a_k$. Using the defining recurrence,

$$
a_{k+1}=3\left(\frac{5\cdot3^k-1}{2}\right)+1
=\frac{5\cdot3^{k+1}-1}{2}.
$$

This is the formula at $k+1$, so induction proves it for all $n\geq0$.

The recurrence is a definition available at every allowed index. The closed form is the statement being proved. Keeping those roles separate prevents accidentally assuming the desired formula in the step.

## Strengthening the statement

Sometimes a hypothesis is too weak to support the next case. Proving a stronger statement can provide exactly the extra information needed.

Let $a_0=0$ and $a_{n+1}=a_n+2n+1$ for integers $n\geq0$. Suppose we want to prove $a_n\geq0$ for every such index. The recurrence already supports that inequality directly, but its pattern suggests the stronger and more informative statement

$$
a_n=n^2.
$$

The base gives $a_0=0^2$. Assuming $a_k=k^2$ yields

$$
a_{k+1}=k^2+2k+1=(k+1)^2.
$$

The equality gives both the requested nonnegativity and an exact description of the sequence.

A more structural strengthening can track a pair of quantities together. If two sequences are defined by $u_0=0,v_0=1$ and

$$
u_{n+1}=u_n+v_n,\qquad v_{n+1}=2v_n\quad(n\geq0),
$$

then proving only a formula for $u_n$ leaves the next step dependent on $v_n$. Prove the conjunction

$$
u_n=2^n-1\quad\text{and}\quad v_n=2^n
$$

instead. Both formulas hold at 0. Assuming both at $k$ gives $u_{k+1}=(2^k-1)+2^k=2^{k+1}-1$ and $v_{k+1}=2\cdot2^k=2^{k+1}$. Ordinary induction can prove a conjunction just as it can prove a single equation.

## Induction and repeated computation

An iterative program often performs one state change per iteration. Induction can prove a **loop invariant**, a property that holds after each allowed number of iterations.

Consider this integer computation for an input $N\geq0$:

```text
total = 0
for i = 1, ..., N:
    total = total + i
```

After $k$ iterations, the invariant is

$$
\text{total}=\sum_{i=1}^{k}i=\frac{k(k+1)}2.
$$

At $k=0$, the initialized total is the empty sum 0. If the invariant holds after $k<N$ iterations, adding $k+1$ establishes it after $k+1$. At termination, $k=N$, so the output is $N(N+1)/2$.

This proof uses exact integer arithmetic. An implementation with bounded machine integers needs a separate guarantee against overflow. Mathematical correctness of an algorithm and correctness under a particular numeric representation are related but distinct obligations.

## Common invalid induction arguments

**Missing base.** The implication “if $n=n+1$, then $n+1=n+2$” is valid after adding 1, but no integer satisfies the starting equality. A chain with no established starting point proves nothing about its members.

**Assuming the next case.** Rewriting $P(k+1)$ until it resembles $P(k)$ can be useful scratch work, but if the transformations are not shown to be reversible, it does not prove the next case. Present a chain beginning with established facts or justify each equivalence.

**Skipping indices.** A step $P(k)\to P(k+2)$ together with $P(0)$ establishes only the even nonnegative cases. A second base $P(1)$ is needed to reach the odd cases, unless another argument supplies them.

**A step with an unnoticed lower bound.** If the algebra establishing the step requires $k\geq2$, a base at 0 does not bridge the missing steps. Verify enough bases to reach the valid range and state that range.

**The all-horses-same-color fallacy.** A supposed proof compares two overlapping groups of $k$ horses inside a group of $k+1$. It uses a shared horse to transfer the common color between groups. At the transition from one horse to two, the two one-horse groups do not overlap. The inductive step fails at precisely the first needed transition. This is a logical example about an argument's structure, not a claim that finite samples establish a biological rule.

## Readiness checklist

Before proceeding, you should be able to:

- Define $P(n)$ and its integer starting index explicitly.
- Verify a base by substituting into the actual statement.
- State an induction hypothesis for arbitrary $k$ and target $P(k+1)$.
- Identify exactly where the induction hypothesis is used.
- Supply the additional bound needed in an inequality proof.
- Verify a proposed closed form from a recurrence.
- Strengthen a statement or prove related facts together when the step needs more information.
- Diagnose missing bases, skipped indices, and circular next-case assumptions.

Practice with the [Mathematical Induction worksheet](../worksheets/10-mathematical-induction.yaml). [Strong Induction](../lessons/11-strong-induction.md) extends the available hypothesis to all earlier cases, which fits recursive decompositions especially well.
