# Sequences and Summations

A sequence stores values in positions. A sum combines a specified collection of terms. Both depend on careful indexing: changing a starting index, endpoint, or bound can change a mathematical claim or the cost of a computation. An **algorithm** is a specified step-by-step procedure for a task; its cost measures the work of following those steps.

This lesson builds on [Functions](../lessons/05-functions.md) and [Sets and Set Operations](../lessons/03-sets-and-set-operations.md). Our numeric terms and constants are real numbers unless a more restrictive domain is stated. We work with finite sums and products. Infinite sequences may supply terms, but we will not define or evaluate infinite series, which require additional ideas about limits.

## A sequence is an indexed function

A sequence is more than a bag of values: each value has an address. Daily temperatures, successive account balances, and the terms in a numerical pattern all depend on which position we are asking about. The subscript is that position label. Reading it as an input to a function connects the new notation to the previous lesson.

An **index** is an integer position label; a **term** is the value at that position. We write the entire sequence as $(a_n)$, read “the sequence a sub n,” and a single term as $a_n$, read “a sub n.” Here $n$ is an index, while $N$ below is a fixed nonnegative integer giving the length of a finite sequence. A sequence $(a_n)$ is a function whose domain is an index set such as $\mathbb N_0=\{0,1,2,\ldots\}$ or $\{1,2,\ldots,N\}$. The notation $a_n$ is the value at position $n$.

Order and repetition matter. The sequences $(2,5,2)$ and $(2,2,5)$ differ, even though their sets of values agree. A finite sequence can be empty, contain one term, or contain repeated terms.

Always state the first index. The rule $a_n=2n+1$ for $n\geq0$ gives $1,3,5,7,\ldots$; the same expression for $n\geq1$ starts $3,5,7,\ldots$. Neither convention is inherently correct for every problem.

An **explicit formula** gives a term directly from its index. For example, $a_n=(-1)^n(n+1)$ for $n\geq0$ begins $1,-2,3,-4,5$. The factor $(-1)^n$ is 1 for even $n$ and $-1$ for odd $n$.

A few listed terms do not uniquely determine an infinite sequence. Many rules can agree on an initial segment and diverge later. A claimed pattern needs a stated rule or additional assumptions.

## Recursive definitions and initial conditions

An explicit formula tells you how to jump directly to a term. A recursive definition instead tells you how to continue from what you already know. A starting point and a continuation rule do different jobs; neither can silently replace the other. Before calculating, check that the first application of the rule uses only values that have actually been defined.

A **recursive definition** gives later terms using earlier ones. Its **recurrence** is the equation relating those terms; its **initial conditions** specify the starting values. In $a_{n+1}$, the subscript $n+1$ means the next position, not one added to the value $a_n$. For instance,

$$
a_0=3,\qquad a_{n+1}=a_n+4\quad(n\geq0)
$$

generates $3,7,11,15,\ldots$. The initial value supplies a starting point; the recurrence supplies the next step.

The recurrence $a_{n+1}=a_n+4$ alone does not select a unique sequence. Starting at 3 and starting at 10 both satisfy it. A recurrence involving two preceding terms normally requires enough initial data for both:

$$
F_0=0,\quad F_1=1,\quad F_{n+2}=F_{n+1}+F_n\quad(n\geq0).
$$

This defines the Fibonacci sequence $0,1,1,2,3,5,8,\ldots$. The recurrence applies first when computing $F_2$; it does not refer to an undefined $F_{-1}$.

A claimed explicit solution must meet the initial conditions and the recurrence. For the first example, $a_n=3+4n$ gives $a_0=3$ and

$$
a_{n+1}=3+4(n+1)=(3+4n)+4=a_n+4.
$$

These checks show that the formula follows the specified generation rule. Later lessons on induction and recurrences develop systematic ways to prove and discover such formulas.

## Arithmetic and geometric sequences

Adding the same amount each time and multiplying by the same factor each time produce very different patterns. An account receiving a fixed deposit grows by addition; an idealized quantity increasing by a fixed percentage grows by multiplication. The formulas below come from counting how many times that repeated operation has happened since the initial term.

Let $c$ be the real starting value and let $n$ count nonnegative integer steps. An **arithmetic sequence** has a constant difference $d$, the amount added at each step:

$$
a_0=c,\quad a_{n+1}=a_n+d,
\qquad a_n=c+nd\quad(n\geq0).
$$

For indexing from 1 instead, $a_n=a_1+(n-1)d$. The subtraction by 1 counts how many steps occur after the initial term. Negative and zero differences are allowed.

A **geometric sequence** has a constant multiplier $r$:

$$
a_0=c,\quad a_{n+1}=ra_n,
\qquad a_n=cr^n\quad(n\geq0).
$$

Interpret the initial term as $c$ even when $r=0$; all later terms are then zero. This avoids making its definition depend on how $0^0$ is written. For $c=8$ and $r=1/2$, the sequence begins $8,4,2,1$. For $r=-2$ and $c=1$, it alternates signs: $1,-2,4,-8$.

Do not divide consecutive terms to test the multiplier if a denominator might be zero. The equation $a_{n+1}=ra_n$ is meaningful in those cases; the quotient may not be.

![Equal additions, indexed terms](figure:sequence-arithmetic)

![Equal ratios, different increments](figure:sequence-geometric)

## Summation notation and term counts

The large sigma is an instruction to add, with the bounds specifying exactly which terms to visit. Before using a formula, expand a small example: write the first term, the next one, and the last one. This turns an unfamiliar symbol into an ordinary addition problem and catches many indexing mistakes before they spread through the calculation.

The symbol $\sum$ is uppercase Greek sigma, read “sum.” The **summand** is the expression being added. The lower bound specifies the first index and the upper bound the last. Read the following expression as “the sum of a sub k, for k from m through n.” For integers $m\leq n$,

$$
\sum_{k=m}^{n}a_k=a_m+a_{m+1}+\cdots+a_n.
$$

The variable $k$ is a **dummy index**: consistently replacing its bound occurrences by a fresh name $j$ changes nothing. Choose a name that does not already have another role in the summand or bounds. Its bounds are inclusive, so there are $n-m+1$ terms.

For example,

$$
\sum_{k=2}^{5}(2k-1)=3+5+7+9=24.
$$

There are four terms, not three or five. If a summand does not depend on its index, it repeats:

$$
\sum_{k=m}^{n}c=(n-m+1)c.
$$

We use the convention that a sum over an empty integer index range is 0. Thus $\sum_{k=1}^{0}a_k=0$. This lets many formulas include zero-length cases without an exception in the surrounding reasoning. It is not a request to count backward through indices.

For $n\geq0$, a sequence's **partial sum** $S_n=\sum_{k=0}^{n}a_k$ contains its first $n+1$ terms under zero-based indexing. Another common convention uses $S_n=\sum_{k=1}^{n}a_k$ for the first $n$ terms. State which convention applies instead of assuming the symbol alone determines it.

## Algebra with finite sums

All the rules here come from ordinary finite addition and multiplication. A constant factor can be taken outside because it appears in every term. A varying factor cannot, because there is no single value to move. When a proposed manipulation feels uncertain, expand a two-term sum and see whether the two sides still describe the same arithmetic.

Let $(a_k)$ and $(b_k)$ be real sequences defined for integer indices from $m$ through $n$, and let $c,d$ be fixed real numbers independent of $k$. **Linearity** means that addition and constant scaling can be performed either before or after summing:

$$
\sum_{k=m}^{n}(ca_k+db_k)
=c\sum_{k=m}^{n}a_k+d\sum_{k=m}^{n}b_k.
$$

Here $c,d$ are constant with respect to $k$. A factor depending on $k$ cannot simply be pulled outside. Also, the sum of products generally differs from the product of sums. With $a_1=b_1=1$ and $a_2=b_2=2$, the former is $1+4=5$, while the latter is $(1+2)(1+2)=9$.

For $m\leq p<n$, split an interval without overlap:

$$
\sum_{k=m}^{n}a_k
=\sum_{k=m}^{p}a_k+\sum_{k=p+1}^{n}a_k.
$$

Starting the second sum at $p$ instead would double-count $a_p$.

For a small worked example, $\sum_{k=1}^{3}(3k+2)=3(1+2+3)+2(1+1+1)=24$. The next section derives a formula that lets us do the same calculation for any nonnegative term count.

## Deriving arithmetic sums

The useful observation is that pairing the smallest term with the largest produces the same total as pairing the next smallest with the next largest. Instead of handling an odd leftover term separately, we will add two full copies of the sum, one written in reverse. Every position then has a partner, and dividing by two returns the sum we wanted.

Let $S=1+2+\cdots+n$ for an integer $n\geq1$. Write it once forward and once backward, then add corresponding positions:

$$
\begin{aligned}
S&=1+2+\cdots+n,\\
S&=n+(n-1)+\cdots+1,\\
2S&=(n+1)+(n+1)+\cdots+(n+1).
\end{aligned}
$$

There are $n$ copies of $n+1$, so $S=n(n+1)/2$. For $n=0$, the empty-sum convention gives the same formula separately.

For $N\geq1$ terms of an arithmetic sequence $c,c+d,\ldots,c+(N-1)d$, the first-plus-last value is $2c+(N-1)d$. Pairing two reversed copies therefore gives

$$
\sum_{k=0}^{N-1}(c+kd)
=\frac{N\bigl(2c+(N-1)d\bigr)}2.
$$

Ten terms starting at 4 with difference 3 end at $4+9\cdot3=31$. Their sum is $10(4+31)/2=175$. Checking the last index before applying the formula prevents confusing ten increments with ten terms.

![Two triangles make a rectangle](figure:sum-triangles)

## Deriving finite geometric sums

For a geometric sum, reversing the order is less helpful than shifting it. Multiplication by the common ratio turns almost every term into the next term already present. Subtracting the shifted copy cancels the overlap and leaves only two boundary terms. The familiar formula is the result of arranging that cancellation deliberately.

Let $r$ be a fixed real multiplier and $N$ a positive integer term count. Write $S_N$ for the sum of these $N$ terms. For $N\geq1$, define

$$
S_N=1+r+r^2+\cdots+r^{N-1}.
$$

Multiply by $r$ and subtract:

$$
\begin{aligned}
S_N-rS_N
&=(1+r+\cdots+r^{N-1})-(r+r^2+\cdots+r^N)\\
&=1-r^N.
\end{aligned}
$$

If $r\ne1$, division by $1-r$ gives

$$
S_N=\frac{1-r^N}{1-r}.
$$

If $r=1$, every term is 1, so $S_N=N$. The formula with a denominator cannot be used at $r=1$. At $r=0$, the written sum has first term 1 and all later terms zero, giving 1. A zero-term geometric sum is separately defined as 0.

Multiplying by an initial value $c$ gives the corresponding sum of a geometric sequence. For example,

$$
3+6+12+24+48
=3\frac{1-2^5}{1-2}=93.
$$

There are five terms and the final exponent is 4; the numerator's exponent is the term count 5. This derivation is finite algebra and does not assume that an infinite sum converges.

## Reindexing and telescoping

Reindexing changes the addresses of terms without changing the terms themselves. It is like renumbering the pages of a document: both the page labels and the references to them must change together. Telescoping is a different maneuver, in which terms cancel. In both cases, writing out the endpoints makes it much easier to see what has actually changed.

**Reindexing** changes the labels of terms without changing which terms occur. If $j=k-2$, then $k=j+2$, and

$$
\sum_{k=2}^{n}(k-1)=\sum_{j=0}^{n-2}(j+1)\qquad(n\geq2).
$$

Transform both bounds and the summand. The old lower endpoint $k=2$ becomes $j=0$; the old upper endpoint $k=n$ becomes $j=n-2$.

A **telescoping sum** cancels consecutive differences. For integers $m\leq n$, with the sequence defined from $m$ through $n+1$,

$$
\sum_{k=m}^{n}(b_{k+1}-b_k)=b_{n+1}-b_m.
$$

Expanding the first few and last terms shows why: $-b_{m+1}$ cancels $b_{m+1}$, and every interior value behaves similarly. Only the endpoint terms remain.

For a positive integer $k$, observe that

$$
\frac1{k(k+1)}=\frac1k-\frac1{k+1}.
$$

Therefore

$$
\sum_{k=1}^{n}\frac1{k(k+1)}
=1-\frac1{n+1}.
$$

The starting index matters: at $k=0$, the original denominator would be zero. Cancellation cannot make an undefined original expression valid.

![Watch the middle values cancel](figure:sum-telescope)

## Products and factorials

Product notation is read in much the same way as summation notation, except that the visited terms are multiplied. The empty case therefore has a different neutral value. Adding no terms leaves a running total unchanged by adding zero; multiplying no factors leaves a running product unchanged by multiplying by one.

The symbol $\prod$ is uppercase Greek pi, read “product.” For integer bounds $m\leq n$ and real terms $a_m$ through $a_n$, read the following as “the product of a sub k, for k from m through n”:

$$
\prod_{k=m}^{n}a_k=a_m a_{m+1}\cdots a_n.
$$

An empty product is 1, the multiplicative identity. This parallels the empty sum being 0, the additive identity. For a nonnegative integer $n$, the **factorial** is

$$
n!=\prod_{k=1}^{n}k,
$$

Read $n!$ as “n factorial.” Thus $0!=1$, $1!=1$, and $4!=24$. When $n\geq1$, separating the last factor gives $n!=n(n-1)!$.

Products can telescope too. For $n\geq1$,

$$
\prod_{k=1}^{n}\frac{k+1}{k}
=\frac21\cdot\frac32\cdots\frac{n+1}{n}=n+1.
$$

Cancellation is legitimate because every denominator is nonzero. Unlike a sum, a product with even one zero factor is zero. There is no general rule that turns $\prod(a_k+b_k)$ into $\prod a_k+\prod b_k$; expansion creates additional terms.

## Nested sums and counting iterations

In a nested sum, hold the outer index fixed while completing the inner sum. Then move to the next outer value and repeat. You can picture rows of a display, with the outer index choosing the row and the inner index choosing entries within it. If the row lengths vary, multiplying two fixed bounds will not count the entries correctly.

In programming, a **loop** repeats a group of instructions, its **body**; one repetition is an **iteration**. Nested loops place one loop inside another. A nested sum evaluates the inner sum for each allowed outer index. If $n\geq1$,

$$
\sum_{i=1}^{n}\sum_{j=1}^{i}1
=\sum_{i=1}^{n}i
=\frac{n(n+1)}2.
$$

The inner loop has $i$ iterations, so the bounds describe the triangular set of pairs $1\leq j\leq i\leq n$. For $n=3$, those pairs are $(1,1),(2,1),(2,2),(3,1),(3,2),(3,3)$.

For a more general sum, write $a_{i,j}$, read “a sub i comma j,” for a real value labeled by the ordered pair $(i,j)$. This is an **array** of values, with $i$ selecting a row and $j$ a column. To reverse the order, describe the same pairs by choosing $j$ first. Then $j$ runs from 1 to $n$, while $i$ runs from $j$ to $n$:

$$
\sum_{i=1}^{n}\sum_{j=1}^{i}a_{i,j}
=\sum_{j=1}^{n}\sum_{i=j}^{n}a_{i,j}.
$$

Changing the order without changing the dependent bounds would count a different region. For rectangular finite bounds, reversal is simpler: both $\sum_{i=1}^{m}\sum_{j=1}^{n}a_{i,j}$ and the reversed version add every entry of the same $m$-by-$n$ array once.

## Bounding sums

Sometimes an estimate answers the question we care about without an exact total. If every box weighs between two and three kilograms, ten boxes weigh between twenty and thirty kilograms. A sum bound applies that same comparison term by term. The more subtle examples choose a useful portion of the terms to obtain a lower bound without calculating all of them.

A **closed formula** computes the result without leaving a recurrence or summation to carry out. An exact closed formula is not always necessary. If each of $N$ terms lies between real numbers $L$ and $U$, then

$$
NL\leq\sum_{k=1}^{N}a_k\leq NU.
$$

This follows by adding the $N$ individual inequalities. For $n\geq1$, every $k^2$ with $1\leq k\leq n$ is at most $n^2$, so $\sum_{k=1}^{n}k^2\leq n^3$.

For a lower bound when $n\geq2$, retain only indices from $\lceil n/2\rceil$ (the ceiling of $n/2$, meaning the smallest integer at least $n/2$) through $n$. There are at least $n/2$ such indices, and each square is at least $n^2/4$. All omitted terms are nonnegative, so

$$
\sum_{k=1}^{n}k^2\geq\frac n2\cdot\frac{n^2}4=\frac{n^3}{8}.
$$

Thus the sum lies between constant multiples of $n^3$ without needing its exact formula. This style of estimate will help analyze algorithms later. Dropping terms gives a lower bound when their total is nonnegative. Checking that every dropped term is nonnegative is a convenient sufficient condition; without a sign argument, dropping terms may instead increase the sum.

## Translating loop bounds into sums

Code can hide a counting problem inside a few short lines. Follow one outer-loop value at a time and ask how many times the inner body runs for that value. Those individual counts are the terms of a sum. Only after identifying the terms should we reach for a summation formula.

A **pseudocode** description uses programming-like instructions without committing to a particular programming language. Assignment replaces a stored value; indentation groups the instructions belonging to a loop. Consider this pseudocode, where the upper endpoint of each `for` loop is included:

```text
total = 0
for i = 0 through n - 1:
    for j = 0 through i - 1:
        total = total + 1
```

Assume $n$ is a nonnegative integer, and an upper endpoint below a lower endpoint gives zero iterations. When $i=0$, the inner loop is empty. For general $i$, its indices $0,1,\ldots,i-1$ give exactly $i$ iterations. The final total is therefore

$$
\sum_{i=0}^{n-1}i=\frac{n(n-1)}2.
$$

For $n=0$ and $n=1$, the total is zero, consistent with the formula. For $n=4$, the inner counts are $0,1,2,3$, totaling 6. This is not $n(n+1)/2$: excluding the pairs with $j=i$ (the diagonal of the index array) changes the triangular count.

Now suppose the body adds $i+j$ rather than 1. Counting iterations alone no longer gives the resulting value. For fixed $i\geq1$,

$$
\sum_{j=0}^{i-1}(i+j)=i\cdot i+\frac{i(i-1)}2.
$$

There are $i$ copies of the outer index $i$, while the inner index $j$ varies and must be summed. The outer sum then combines these expressions over $i=0,\ldots,n-1$, with the $i=0$ contribution zero. Keeping track of which variables are fixed at each stage avoids mistakenly treating both indices as constants or both as changing together.

This translation counts executions or accumulated values under the stated pseudocode semantics. It is not yet a complete runtime model: actual running time also depends on the costs of the operations being counted. Later algorithm analysis will make that distinction explicit.

When translating real code, inspect whether its comparison uses a strict or inclusive bound. A loop with `j < i` includes different indices from one with `j <= i`. The mathematical sum should describe the code's actual indices, not the pattern its author probably intended.

## Readiness check

You should be able to:

- State a sequence's index domain and generate terms from a valid recurrence.
- Distinguish a term's index from the number of terms being summed.
- Expand sums and products, including empty cases.
- Derive arithmetic and finite geometric sums with the required exceptions.
- Reindex a sum and identify exactly which telescoping endpoints remain.
- Reverse finite nested sums by describing their index pairs.
- Justify useful upper and lower bounds with sign conditions stated.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
