# Proof by Contradiction

A proof by contradiction begins by assuming that the statement to be proved is false. It then derives an impossibility from that assumption together with the accepted background facts. The contradiction forces us to reject the assumption and accept the original statement.

This lesson builds on [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md), [Direct Proof](../lessons/07-direct-proof.md), and [Proof by Contrapositive](../lessons/08-proof-by-contrapositive.md). We use classical logic, the usual arithmetic of integers and real numbers, and the definitions of rationality and divisibility from those lessons.

The method is powerful, but it requires precision: a statement can seem surprising without being contradictory, and negating only part of a theorem can lead to proving the wrong result.

## The logical structure

To prove a statement $S$ by contradiction:

1. Assume $\neg S$.
2. Deduce consequences using that assumption and established facts.
3. Reach a contradiction, such as $T\land\neg T$, $0=1$, or two incompatible inequalities.
4. Conclude that $\neg S$ is false, hence $S$ is true.

The contradictory statements must concern the same object under the same assumptions. “One integer is even and another is odd” is perfectly possible. “This integer is both even and odd” is impossible.

If a theorem is an implication $P\to Q$, its negation is $P\land\neg Q$. A contradiction proof therefore assumes both the hypothesis and the failure of the conclusion.

For a quantified claim, negate the whole statement. The negation of

$$
\forall x\in D,\quad P(x)\to Q(x)
$$

is

$$
\exists x\in D,\quad P(x)\land\neg Q(x).
$$

We may choose such a counterexample under the temporary assumption and then show that no such object can exist.

## A first example: there is no greatest integer

**Claim.** There is no greatest integer.

**Proof.** Suppose, for contradiction, that a greatest integer $M$ exists. Then every integer is at most $M$. But $M+1$ is an integer and $M+1>M$, contradicting the defining property of $M$. Therefore there is no greatest integer.

The conclusion contradicts the assumption because the newly constructed integer exceeds the supposedly greatest one. Nothing here claims that $M+1$ is larger than _every_ integer; it only needs to violate the assumed bound $M$.

A direct formulation is also possible: for every integer $n$, the integer $n+1$ is larger. The two presentations make the same arithmetic observation with different logical organization.

## Contradiction versus contrapositive

To prove $P\to Q$, a contrapositive proof assumes $\neg Q$ and derives $\neg P$. A contradiction proof assumes $P$ and $\neg Q$ and derives an impossibility.

These approaches are closely related, but a clean presentation should name the actual structure. If all the work is “an odd integer has an odd square,” call it a contrapositive proof of “an even square has an even root.” There is no need to carry an unused contradictory assumption through the argument.

Contradiction is especially natural for assertions of nonexistence, irrationality, uniqueness, and infinitely many objects. Such claims often say that no object with certain properties can exist, so temporarily supposing such an object exists gives something concrete to analyze.

## Fractions in lowest terms

We will use a basic integer fact: every rational number can be written as $a/b$ with $a,b\in\mathbb{Z}$, $b>0$, and no common positive divisor of $a,b$ other than 1.

Here is why. Start with any integer fraction having nonzero denominator, and move its sign to the numerator if necessary. Among the positive common divisors of its numerator and denominator, choose the greatest, $g$. Such a greatest divisor exists because every positive divisor of the positive denominator is at most that denominator, and 1 is a common divisor. Divide numerator and denominator by $g$.

If the reduced numerator and denominator still shared a positive divisor $h>1$, then $gh>g$ would have divided both original numbers, contradicting the choice of $g$. The resulting fraction is in **lowest terms**.

This reduction does not require a theorem about unique prime factorization. It relies only on a greatest element of a finite nonempty set of positive integers.

## The irrationality of the square root of 2

**Claim.** The real number $\sqrt2$ is irrational.

**Proof.** Suppose, for contradiction, that $\sqrt2$ is rational. Choose integers $a,b$ in lowest terms with $b>0$ and

$$
\sqrt2=\frac ab.
$$

Squaring and multiplying by $b^2$ gives

$$
a^2=2b^2.
$$

Thus $a^2$ is even. By the parity result proved in the preceding lesson, $a$ is even. Write $a=2k$ for an integer $k$. Substitution gives

$$
4k^2=2b^2,
\qquad\text{so}\qquad
b^2=2k^2.
$$

Therefore $b^2$ is even, and the same parity result shows that $b$ is even. Both $a$ and $b$ are divisible by 2, contradicting the choice of a fraction in lowest terms. Hence $\sqrt2$ is irrational.

The contradiction is not simply that both numbers are even; many fractions have even numerator and denominator. It is that both are even **despite being chosen in lowest terms**. Omitting that choice leaves a real gap.

We also used a proved lemma rather than assuming that an even square obviously has an even root. Good proofs reveal their dependencies so the reader can distinguish an established fact from the result currently being proved.

## Rational and irrational combinations

**Claim.** If $x$ is irrational and $r$ is rational, then $x+r$ is irrational.

**Proof.** Let $x\in\mathbb{R}\setminus\mathbb{Q}$ and $r\in\mathbb{Q}$. Suppose $x+r$ were rational. Rational numbers are closed under subtraction, so

$$
x=(x+r)-r
$$

would be rational. This contradicts the choice of $x$. Therefore $x+r$ is irrational.

The same reasoning proves that $rx$ is irrational when $r$ is a **nonzero** rational number: if $rx$ were rational, division by $r$ would make $x$ rational. The nonzero condition is necessary because $0\cdot\sqrt2=0$ is rational.

There is no analogous universal rule saying that two irrational numbers have an irrational sum or product. For example,

$$
\sqrt2+(-\sqrt2)=0,
\qquad
\sqrt2\cdot\sqrt2=2.
$$

Both $\sqrt2$ and $-\sqrt2$ are irrational; otherwise negating a rational value for $-\sqrt2$ would make $\sqrt2$ rational. In contrast, $\sqrt2+\sqrt2=2\sqrt2$ is irrational by the nonzero-rational multiplier result. Different examples produce different outcomes.

These examples are a reminder to test a proposed claim before investing in a proof of it.

## A prime-divisor lemma

A positive integer $p>1$ is **prime** if its only positive divisors are 1 and $p$. A positive integer greater than 1 that is not prime is composite.

**Lemma.** Every integer $N>1$ has a prime divisor.

**Proof.** Among the positive divisors of $N$ greater than 1, choose the smallest, $d$. This collection is nonempty because $N$ itself belongs to it. If $d$ were composite, it would have a divisor $a$ with $1<a<d$. Since $a\mid d$ and $d\mid N$, divisibility is transitive, so $a\mid N$. That contradicts the minimality of $d$. Hence $d$ is prime and divides $N$.

Here the eligible divisors form a finite nonempty set, since they lie between 2 and $N$, so choosing the smallest needs only the finite-set fact already used above. More generally, the **well-ordering property** says that every nonempty set of positive integers has a least element, even if the set is infinite. We will explore its relation to induction later. This lemma proves existence of a prime divisor; it does not assert that a number is itself prime or that its entire factorization is unique.

## There are infinitely many primes

**Claim.** There are infinitely many prime numbers.

**Proof.** Suppose there were only finitely many primes, listed as $p_1,\ldots,p_k$. The list is nonempty because 2 is prime. Form the positive integer

$$
N=p_1p_2\cdots p_k+1.
$$

Since $N>1$, the prime-divisor lemma supplies a prime $q$ dividing $N$. The supposed complete list must contain $q$, so $q$ also divides $p_1p_2\cdots p_k$. A common divisor divides a difference, hence

$$
N-p_1p_2\cdots p_k=1,
\qquad\text{so}\qquad q\mid1.
$$

But no positive integer greater than 1 divides 1. This contradicts the fact that $q$ is prime. Therefore the primes cannot form a finite list.

The construction does **not** claim that the product plus 1 is always prime. For example,

$$
2\cdot3\cdot5\cdot7\cdot11\cdot13+1=30031=59\cdot509.
$$

The proof needs only a prime divisor missing from the proposed complete list. That distinction is essential both to correctness and to understanding why the argument works.

## Uniqueness proofs

To prove that exactly one object has a property, establish existence and at most one. Contradiction can organize the second part: assume two distinct objects have the property and derive that they must be equal.

**Claim.** For every integer $n$, there is exactly one integer $m$ with $n+m=0$.

**Existence.** The integer $m=-n$ satisfies the equation.

**Uniqueness.** Suppose two distinct integers $a,b$ both satisfy it. Then $n+a=0=n+b$. Subtracting $n$ gives $a=b$, contradicting distinctness. Thus there is at most one such integer; together with existence, this proves exactly one.

A direct uniqueness argument could simply derive $a=b$ without assuming they are distinct. Either is valid. Crucially, uniqueness alone does not guarantee existence: an equation with no solution also has at most one solution.

## Common errors and how to repair them

**Assuming something stronger than the negation.** To prove that infinitely many primes exist, assuming “there is exactly one prime” is insufficient. Refuting that assumption only shows that there is not exactly one. The actual negation is that there are finitely many.

**Calling an unexpected result a contradiction.** Deriving that a number is negative contradicts nothing unless it was also known to be nonnegative. State both incompatible facts explicitly.

**Importing the theorem being proved.** A proof of irrationality cannot cite that same irrationality in a disguised form. Keep track of which lemmas were established independently.

**Ignoring a side condition.** Dividing by a variable can invalidate the argument if zero is allowed. Choosing a lowest-terms representation or a nonzero denominator is mathematical work, not optional wording.

**Losing the temporary scope.** The assumption made for contradiction is discharged at the end. It is not a fact to reuse in later arguments after its impossibility has been shown.

## Readiness checklist

You should be able to:

- Negate an entire quantified or conditional theorem before starting a contradiction proof.
- Identify the exact pair of incompatible statements at the end.
- Explain the lowest-terms condition in the proof that $\sqrt2$ is irrational.
- Distinguish a theorem about a prime divisor from a claim that the original number is prime.
- Reproduce the infinitude-of-primes argument without assuming unique factorization.
- Separate existence from uniqueness.
- Choose direct proof, contraposition, or contradiction according to the statement's structure.

Use the [Proof by Contradiction worksheet](../worksheets/09-proof-by-contradiction.yaml) for proof construction and error analysis. Next, [Mathematical Induction](../lessons/10-mathematical-induction.md) gives a method for proving an infinite sequence of related statements.
