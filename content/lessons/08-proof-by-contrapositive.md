# Proof by Contrapositive

Some implications are difficult to prove by starting from their hypotheses. A condition such as “$n^2$ is even” describes a product without immediately revealing the form of $n$. Its contrapositive starts with a more useful description: “$n$ is odd.”

This lesson builds on [Propositional Logic](../lessons/01-propositional-logic.md), [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md), and [Direct Proof](../lessons/07-direct-proof.md). Keep the earlier definitions of even, odd, rational, and divides. Unless another domain is specified, variables in divisibility and parity claims are integers.

A proof by contrapositive is still a proof of the original implication. It works because two particular logical statements have exactly the same truth value, not because reversing a sentence is usually safe.

## The equivalence that makes the method work

The **contrapositive** of $P\to Q$ is

$$
\neg Q\to\neg P.
$$

These statements are logically equivalent:

$$
(P\to Q)\equiv(\neg Q\to\neg P).
$$

One explanation comes from the only way an implication can fail. The original fails exactly when $P$ is true and $Q$ is false. The contrapositive fails exactly when $\neg Q$ is true and $\neg P$ is false. Those are the same circumstances.

Do not confuse the contrapositive with these different statements:

| Name           | Statement         |
| -------------- | ----------------- |
| Original       | $P\to Q$          |
| Converse       | $Q\to P$          |
| Inverse        | $\neg P\to\neg Q$ |
| Contrapositive | $\neg Q\to\neg P$ |

The converse and inverse are equivalent to each other, but need not be equivalent to the original. For example, divisibility by 4 implies evenness; evenness does not imply divisibility by 4. The integer 6 refutes the converse.

## The proof template

To prove

$$
\forall x\in D,\quad P(x)\to Q(x)
$$

by contrapositive:

1. Keep the same domain $D$.
2. Choose an arbitrary $x\in D$.
3. Assume $\neg Q(x)$.
4. Deduce $\neg P(x)$.
5. State that the original implication follows by contraposition.

The universal quantifier stays universal. We are replacing each implication with an equivalent implication, not negating the entire theorem. Negating the entire theorem would instead produce $\exists x\in D$ with $P(x)\land\neg Q(x)$.

Writing the contrapositive explicitly before doing algebra helps prevent a proof of the wrong statement. It also reveals whether the new hypothesis is easier to use.

## Worked proof: an even square has an even root

**Claim.** For every integer $n$, if $n^2$ is even, then $n$ is even.

The contrapositive is: if $n$ is not even, then $n^2$ is not even. Since every integer is exactly one of even or odd, this becomes: if $n$ is odd, then $n^2$ is odd.

**Proof.** Let $n$ be an arbitrary odd integer. There is an integer $k$ such that $n=2k+1$. Then

$$
n^2=(2k+1)^2=4k^2+4k+1=2(2k^2+2k)+1.
$$

Because $2k^2+2k$ is an integer, $n^2$ is odd. We have proved the contrapositive, so an even square must have an even integer root.

The domain restriction matters. “Not even” can be replaced by “odd” because $n$ is an integer. Parity is not a classification of all real numbers. The proof must not silently treat a noninteger as odd.

## Negate compound conditions carefully

Suppose a theorem says

$$
P\to(Q\lor R).
$$

Its contrapositive is

$$
(\neg Q\land\neg R)\to\neg P,
$$

because the negation of an OR is an AND of negations. Similarly,

$$
(P\land R)\to Q
$$

has contrapositive

$$
\neg Q\to(\neg P\lor\neg R).
$$

Negation changes the connective as well as the individual clauses. For real numbers, the negation of $x>3$ is $x\leq3$, not $x<3$. Equality is a frequent missing boundary case.

Useful pairs include:

| Statement               | Negation                     |
| ----------------------- | ---------------------------- |
| $a=b$                   | $a\ne b$                     |
| $a<b$                   | $a\geq b$                    |
| $d\mid n$               | $d\nmid n$                   |
| $x\in A\cap B$          | $x\notin A$ or $x\notin B$   |
| $\forall x\in D,\ P(x)$ | $\exists x\in D,\ \neg P(x)$ |
| $\exists x\in D,\ P(x)$ | $\forall x\in D,\ \neg P(x)$ |

The last two rows become important when the hypothesis or conclusion is itself quantified.

## An even product has an even factor

**Claim.** If $a,b\in\mathbb{Z}$ and $ab$ is even, then $a$ is even or $b$ is even.

The conclusion is an OR. Its negation says that neither factor is even, so both are odd.

**Proof by contrapositive.** Assume $a,b$ are odd. Write $a=2r+1$ and $b=2s+1$ for integers $r,s$. Then

$$
ab=(2r+1)(2s+1)=2(2rs+r+s)+1.
$$

The quantity $2rs+r+s$ is an integer, so $ab$ is odd. Thus, if the product is even, at least one factor is even.

The theorem does not say exactly one factor is even. Both can be even: $2\cdot4=8$. It also does not say that an even product forces a specific factor to be even. For $3\cdot2$, the first factor is odd.

This is a special divisibility property of the prime number 2. Replacing 2 by an arbitrary positive integer makes a false theorem: $6\mid2\cdot3$, but 6 divides neither factor.

## Divisibility by 3 and remainders

Division with remainder says that every integer $n$ can be expressed as $n=3k+r$ with $r\in\{0,1,2\}$. This applies to negative integers too; the remainder is chosen from the same three values.

**Claim.** If $3\mid n^2$, then $3\mid n$.

**Proof by contrapositive.** Suppose $3\nmid n$. Its remainder is therefore 1 or 2.

- If $n=3k+1$, then $n^2=3(3k^2+2k)+1$.
- If $n=3k+2$, then $n^2=3(3k^2+4k+1)+1$.

In either case the square has remainder 1 on division by 3, so $3\nmid n^2$. This proves the contrapositive and hence the original claim.

Why does a remainder of 1 rule out divisibility? If the number were also $3t$, subtraction would yield $1=3(t-u)$ for some integer $u$, which is impossible. The uniqueness of remainders packages that argument.

This proof illustrates cases inside a contrapositive proof. Methods can be combined: contraposition chooses the logical direction, while cases organize the allowed inputs.

## Irrationality through a rational contrapositive

A real number is **irrational** when it is not rational. Sometimes rationality gives a useful fractional representation while irrationality gives no direct algebraic form.

**Claim.** If $x\in\mathbb{R}$ and $x^2$ is irrational, then $x$ is irrational.

**Proof by contrapositive.** Assume $x$ is rational. There are integers $a,b$ with $b\ne0$ such that $x=a/b$. Consequently,

$$
x^2=\frac{a^2}{b^2}.
$$

Both numerator and denominator are integers, and $b^2\ne0$, so $x^2$ is rational. This proves the claim.

The converse is false. The irrational number $\sqrt2$ has rational square 2; the next lesson proves its irrationality. Being irrational does not mean that every expression involving the number is irrational.

The strategy here was to replace a negative property, “not rational,” with its positive definition. A representation such as $a/b$ is usually easier to calculate with than the absence of every such representation.

## Contraposition in set and function arguments

For sets $A,B$, the claim $A\subseteq B$ is an elementwise implication: if $x\in A$, then $x\in B$. Its contrapositive says that $x\notin B$ implies $x\notin A$.

If both sets lie in a fixed universe $U$, this gives

$$
A\subseteq B\quad\Longrightarrow\quad U\setminus B\subseteq U\setminus A.
$$

**Proof.** Assume $A\subseteq B$ and choose $x\in U\setminus B$. Then $x\notin B$. By the contrapositive of the defining membership implication, $x\notin A$. Since $x\in U$, we have $x\in U\setminus A$.

For a function $f:A\to B$, injectivity is commonly stated as

$$
\forall x,y\in A,\quad f(x)=f(y)\to x=y.
$$

An equivalent form is

$$
\forall x,y\in A,\quad x\ne y\to f(x)\ne f(y).
$$

For $f:\mathbb{Z}\to\mathbb{Z}$ defined by $f(n)=3n+1$, distinct $x,y$ give $f(x)-f(y)=3(x-y)\ne0$. Thus distinct inputs have distinct outputs, proving injectivity. Alternatively, starting with equal outputs and cancelling gives a direct proof. Choose the form that makes the specific function easiest to analyze.

## Supporting a biconditional

**Claim.** An integer $n$ is even if and only if $n^2$ is even.

One direction has a short direct proof: if $n=2k$, then $n^2=2(2k^2)$ is even. The reverse direction was proved by contrapositive earlier.

A biconditional does not require using the same technique twice. What matters is establishing both directions, with assumptions clearly separated. Label them if there is any chance the reader will confuse which implication is being proved.

## When to choose this method

Contraposition is especially useful when:

- The negation of the conclusion has a simple defining form, such as an odd integer.
- The hypothesis is a divisibility statement about a square or product.
- A claimed negative property becomes a constructive positive assumption after negation.
- An equivalent characterization, such as injectivity by distinct inputs, fits the objects better.

It is less useful when negating the conclusion introduces a more complicated quantified statement. There is no prize for using an indirect method when a direct calculation is clearer.

The logical transformation must happen before judging convenience. “I will reverse the implication because that is easier” is not a valid strategy unless the reversed statement is separately known to imply the original.

## Diagnose flawed contrapositive proofs

Consider this attempted proof:

> To show that $4\mid n$ implies $n$ is even, assume $n$ is even. Write $n=2k$. Then $n$ is divisible by 4.

It assumes the conclusion and attempts the converse. The last sentence is false when $k$ is odd. The actual contrapositive assumes $n$ is odd and must show $4\nmid n$. Since a multiple of 4 is $2(2k)$, it cannot be odd; a direct proof of the original is even shorter.

Another attempt says:

> To prove that an even product has an even factor, assume one factor is odd and show that the product is odd.

The negation of “at least one factor is even” is **both factors are odd**. Assuming only one odd factor is insufficient: $3\cdot2$ is even. This mistake is a failure to apply De Morgan's law before starting the arithmetic.

Finally, never conclude that a theorem is false because your contrapositive proof attempt stalls. Difficulty with a chosen method says something about the proof attempt, not the truth of the statement.

## Readiness checklist

You should now be able to:

- Write the converse, inverse, and contrapositive without confusing them.
- Explain why only the contrapositive is automatically equivalent to the original.
- Negate compound conclusions and preserve boundary cases in inequalities.
- Prove parity and small-divisor claims using definitions and exhaustive remainders.
- Use contraposition for one direction of a biconditional.
- Recognize equivalent elementwise formulations of inclusion and injectivity.
- Explain why the method does not change the theorem's domain or outer universal quantifier.

Practice with the [Proof by Contrapositive worksheet](../worksheets/08-proof-by-contrapositive.yaml). Next, [Proof by Contradiction](../lessons/09-proof-by-contradiction.md) studies what happens when assuming the negation of an entire claim leads to an impossibility.
