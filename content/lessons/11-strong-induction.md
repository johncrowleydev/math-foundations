# Strong Induction

Ordinary induction proves the next case using the immediately preceding case. Some problems naturally refer to several earlier cases, or to smaller inputs whose sizes are not known in advance. Strong induction makes all established smaller cases available in the inductive step.

This lesson builds on [Mathematical Induction](../lessons/10-mathematical-induction.md), [Sequences and Summations](../lessons/06-sequences-and-summations.md), and [Proof by Contradiction](../lessons/09-proof-by-contradiction.md). Indices and sizes are integers, and we state their starting values explicitly.

The word _strong_ describes the form of the hypothesis. The method proves no more integer-indexed statements than ordinary induction; it often expresses the useful information more directly.

## The strong induction principle

Let $P(n)$ be a statement for integers $n\geq n_0$. A familiar strong induction format is:

1. Establish the required initial cases.
2. Choose an arbitrary next index $n$ beyond those cases.
3. Assume $P(j)$ for **every** integer $j$ with $n_0\leq j<n$.
4. Use those assumptions to prove $P(n)$.

The collection of earlier statements is the **strong induction hypothesis**. Every use of it must meet the range conditions: the chosen index must be in the theorem's domain and strictly less than $n$.

An equivalent formulation proves, for each $n\geq n_0$, that if all earlier cases hold, then $P(n)$ holds. At $n=n_0$ there are no earlier cases, so that conditional requires proving $P(n_0)$ without any earlier hypothesis. The base has not disappeared; it is included in the first step.

For readable proofs, separate the bases from the general argument, especially when several initial values are necessary.

## Why it is equivalent to ordinary induction

Suppose strong induction would prove a family $P(n)$ for $n\geq n_0$. Define a new statement

$$
Q(n):\quad P(j)\text{ holds for every integer }j\text{ with }n_0\leq j\leq n.
$$

The base $Q(n_0)$ is just $P(n_0)$. Assuming $Q(k)$ makes every earlier case from $n_0$ through $k$ available. The proposed strong step then proves $P(k+1)$, which, together with $Q(k)$, establishes $Q(k+1)$.

Ordinary induction proves every $Q(n)$, and hence every $P(n)$. Conversely, a strong induction hypothesis includes the immediately previous case, so any ordinary induction step can use it and ignore the extra information.

Strong induction is therefore an organized way to prove an accumulating conjunction. Choosing between the two methods is a matter of clarity and the dependencies in the problem.

## Well-ordering and a smallest counterexample

The **well-ordering principle** says that every nonempty set of nonnegative integers has a least element. The same holds for integers bounded below by any fixed integer, by shifting the domain.

This explains induction through a smallest-counterexample argument. Suppose a theorem with a valid base and strong inductive step were false. The set of failing indices would have a least member $m$. Every allowed index smaller than $m$ would satisfy the theorem. The strong step would then establish the theorem at $m$, contradicting its failure.

The least counterexample cannot be one of the verified bases. That is why the argument reaches the range where the general step is valid.

Conversely, induction can establish well-ordering for subsets of $\mathbb{N}_0$: if a nonempty subset had no least member, 0 could not belong to it; if none of $0,\ldots,k$ belonged, then $k+1$ could not belong either, because it would be least. Induction would make the subset empty, a contradiction.

These principles describe the same discrete order structure. They do not extend unchanged to arbitrary sets of real numbers: the positive real numbers have no least element.

## Prime factorization: existence

Recall that a prime is a positive integer greater than 1 with no positive divisors other than 1 and itself.

**Claim.** Every integer $n\geq2$ can be expressed as a product of one or more primes.

**Proof by strong induction.** The base $n=2$ holds because 2 itself is prime.

Let $n\geq3$, and assume that every integer $j$ with $2\leq j<n$ is a product of primes. If $n$ is prime, it is already a product consisting of one prime.

If $n$ is composite, write $n=ab$ with integers $a,b$ satisfying

$$
2\leq a<n,\qquad 2\leq b<n.
$$

Such factors exist by compositeness: a proper divisor $a$ with $1<a<n$ has quotient $b=n/a$ strictly between 1 and $n$. By the induction hypothesis, both $a$ and $b$ are products of primes. Multiplying their prime products expresses $n$ as a product of primes.

Both cases establish $P(n)$, so strong induction proves the claim for every $n\geq2$.

Why is ordinary induction less natural here? Knowing only that $n-1$ factors gives no immediate information about the factors $a,b$ of $n$. Their sizes are smaller, but neither need equal $n-1$.

This proof establishes **existence**, not **uniqueness**. It does not prove that two prime products representing the same integer have the same factors. That requires an additional argument, commonly using a lemma about a prime dividing a product. Do not claim more than the induction established.

## Postage with several base cases

Suppose only stamps of values 4 and 7 units are available, with an unlimited supply of each. Values add normally; using zero stamps of one denomination is allowed.

**Claim.** Every integer amount $n\geq18$ can be made.

**Base cases.** Four consecutive amounts can be made:

$$
\begin{aligned}
18&=4+7+7,\\
19&=4+4+4+7,\\
20&=4+4+4+4+4,\\
21&=7+7+7.
\end{aligned}
$$

**Inductive step.** Let $n\geq22$ and assume every integer amount from 18 through $n-1$ can be made. Since

$$
18\leq n-4<n,
$$

the hypothesis supplies stamps totaling $n-4$. Add one 4-unit stamp to obtain $n$. Strong induction proves the claim.

Four consecutive bases matter because the step reduces the target by 4. A proof starting with 18 alone would reach only $18,22,26,\ldots$ by that construction. More generally, determine the base coverage from the step's actual dependencies, rather than guessing that one base always suffices.

The theorem does not assert that 18 is the first representable amount. It asserts that there are no gaps from 18 onward. Several smaller amounts, such as 4 and 7, are representable too.

## A recursive sequence bound

Define the Fibonacci sequence by

$$
F_0=0,\qquad F_1=1,\qquad F_n=F_{n-1}+F_{n-2}\quad(n\geq2).
$$

**Claim.** For every integer $n\geq1$, $F_n\leq2^{n-1}$.

**Base cases.** We have $F_1=1=2^0$ and $F_2=1\leq2^1$.

**Inductive step.** Let $n\geq3$ and assume the claimed bounds for all indices from 1 through $n-1$. Both $n-1$ and $n-2$ lie in that range. Therefore

$$
\begin{aligned}
F_n&=F_{n-1}+F_{n-2}\\
&\leq2^{n-2}+2^{n-3}\\
&=3\cdot2^{n-3}\\
&\leq4\cdot2^{n-3}=2^{n-1}.
\end{aligned}
$$

This proves the next bound, and hence all of them by strong induction.

Two bases ensure the recurrence can use two earlier covered indices. The separate value $F_0$ defines the sequence, but the claimed bound begins at 1. Do not substitute $n=0$ into a statement whose proof and stated range begin elsewhere.

We did not need every earlier value in this step, only the last two. Strong induction makes both available without introducing an additional paired statement, though ordinary induction on such a pair would also work.

## Recursive algorithms: termination and correctness

A recursive algorithm needs two different guarantees: its calls eventually stop, and its returned value satisfies the specification. Strong induction fits both when every recursive call has a smaller nonnegative integer measure.

Consider this function on nonnegative integers:

```text
power_of_two(n):
    if n == 0:
        return 1
    q = floor(n / 2)
    t = power_of_two(q)
    if n is even:
        return t * t
    else:
        return 2 * t * t
```

The notation $\lfloor x\rfloor$ means the greatest integer at most $x$. For every integer $n\geq1$, $q=\lfloor n/2\rfloor$ satisfies $0\leq q<n$.

**Termination.** At input 0 the function returns immediately. At an input $n\geq1$, the only recursive call has smaller nonnegative input $q$. By strong induction on the input, that call terminates, after which the remaining operations are finite. Thus every allowed call terminates.

**Correctness.** At input 0 the result is $1=2^0$. Assume every smaller allowed call returns the correct power. Then the recursive result is $t=2^q$. If $n=2q$ is even, the function returns $t^2=2^{2q}=2^n$. If $n=2q+1$ is odd, it returns $2t^2=2^{2q+1}=2^n$. These cases cover all nonnegative integers, establishing correctness.

This reasoning assumes exact integer arithmetic. The algorithm's value may exceed the range of a fixed-width machine integer, so an implementation must use a suitable representation or restrict its input.

“The input gets smaller” is not always enough for termination. It must decrease in a well-founded domain or measure: repeatedly halving a positive real number never reaches zero. Here the decreasing **integer** input is the crucial fact.

## A finite construction by splitting

Imagine a straight board consisting of $n\geq1$ unit cells. A construction may either stop with a single cell or split a longer board between cells into two nonempty smaller boards, then recursively split each piece.

**Claim.** Any such complete splitting into unit cells uses exactly $n-1$ splits.

**Proof.** For $n=1$, no split is needed, and $n-1=0$. For $n\geq2$, suppose the claim is true for every smaller positive length. The first split produces lengths $a,b\geq1$ with $a+b=n$ and both less than $n$. The two recursive constructions use $a-1$ and $b-1$ splits by the hypothesis. Including the first split, the total is

$$
1+(a-1)+(b-1)=a+b-1=n-1.
$$

Thus the count is independent of where the splits occur. The argument covers every permitted recursive construction, because $a,b$ were the arbitrary lengths created by its first split.

This is a small example of reasoning about recursively built objects. More general **structural induction** follows the constructors of an object, such as a finite expression: prove a property for the simplest objects, then show each construction rule preserves it. For this course, induction on an explicit integer size is enough for our examples.

## Common mistakes

**Using a case outside the range.** In the postage proof, invoking $P(n-4)$ at $n=19$ would require $P(15)$, which the theorem never promised. State the lower bound for the general step and verify the earlier targets separately.

**Using the current case.** In factorization, writing $n=1\cdot n$ does not help: the factor $n$ is not smaller, and the factor 1 is outside the claim's domain. Strong induction does not permit assuming the very case being proved.

**One successful decomposition proves every decomposition.** For the board claim, a proof analyzing only equal halves would not cover uneven splits. Its universal claim requires handling arbitrary legal $a,b$.

**Proving only correctness conditional on termination.** A recursive definition that calls itself on the same input may satisfy a plausible algebraic equation but never return. Analyze the decreasing measure as well as the returned value.

**Claiming uniqueness after an existence proof.** Building a prime factorization or a stamp representation does not show it is the only representation. The theorem and conclusion should match the work actually done.

## Readiness checklist

You should now be able to:

- State a strong induction hypothesis with exact lower and upper index bounds.
- Determine the necessary bases from a step's dependency pattern.
- Explain the equivalence of ordinary and strong induction through an accumulating statement.
- Use a smallest counterexample and identify where well-ordering applies.
- Prove prime-factorization existence without silently asserting uniqueness.
- Prove a recurrence bound using two earlier cases.
- Establish recursive termination and correctness with a decreasing integer measure.
- Distinguish an arbitrary recursive decomposition from a specially chosen example.

Use the [Strong Induction worksheet](../worksheets/11-strong-induction.yaml) to practice these proof structures. Next, [Combinatorics](../lessons/12-combinatorics.md) applies careful definitions, cases, and proofs to counting finite collections.
