# Proof by Contrapositive

Some implications are difficult to prove by starting from their hypotheses. A condition such as “$n^2$ is even” describes a product without immediately revealing the form of $n$. Its contrapositive starts with a more useful description: “$n$ is odd.”

This lesson builds on [Propositional Logic](../lessons/01-propositional-logic.md), [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md), and [Direct Proof](../lessons/07-direct-proof.md). Keep the earlier definitions of even, odd, rational, and divides. Unless another domain is specified, variables in divisibility and parity claims are integers.

A **proof by contrapositive** establishes an implication by proving its contrapositive: assume that the original conclusion fails and show that the original hypothesis must fail too. It works because two particular logical statements have exactly the same truth value, not because reversing a sentence is usually safe.

## The equivalence that makes the method work

Contraposition changes the route through an implication while preserving the situation it rules out. Rather than trying to force the promised result directly, we show that its failure makes the starting condition impossible. The equivalence below is the reason this is a proof method, rather than a persuasive analogy.

Let $P,Q$ stand for propositions. The **contrapositive** of $P\to Q$ is

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

Write the new assumption and new goal in ordinary language first. This gives you a quick check on which part is being negated and which direction the proof travels. Once those are correct, the argument itself is a direct proof of the new implication: start with its hypothesis and reason forward.

Let $D$ be the original domain and $P(x),Q(x)$ predicates describing its hypothesis and conclusion. To prove

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

Starting from an even square gives us $n^2=2k$, but taking a square root does not immediately reveal the parity of $n$. Starting from an odd $n$ gives a usable expression at once. This is the practical advantage of contraposition here: it replaces an awkward piece of information with a definition we can expand.

**Claim.** For every integer $n$, if $n^2$ is even, then $n$ is even.

The contrapositive is: if $n$ is not even, then $n^2$ is not even. Since every integer is exactly one of even or odd, this becomes: if $n$ is odd, then $n^2$ is odd.

**Proof.** Let $n$ be an arbitrary odd integer. There is an integer $k$ such that $n=2k+1$. Then

$$
n^2=(2k+1)^2=4k^2+4k+1=2(2k^2+2k)+1.
$$

Because $2k^2+2k$ is an integer, $n^2$ is odd. We have proved the contrapositive, so an even square must have an even integer root.

The domain restriction matters. “Not even” can be replaced by “odd” because $n$ is an integer. Parity is not a classification of all real numbers. The proof must not silently treat a noninteger as odd.

## Negate compound conditions carefully

A compound conclusion must fail as a whole. If a theorem promises at least one of two outcomes, denying the promise means ruling out both outcomes, not just one. It is worth doing this logical preparation before touching the numbers; otherwise a perfectly correct calculation can prove the wrong contrapositive.

Here $P,Q,R,S$ are propositions, and the connectives have the same meanings as in propositional logic. Suppose a theorem says

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

Negation changes the connective as well as the individual component statements. For real numbers, the negation of $x>3$ is $x\leq3$, not $x<3$. Equality is a frequent missing boundary case.

The notation $d\nmid n$, read “d does not divide n,” negates divisibility: no integer $k$ satisfies $n=dk$. Useful pairs include:

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

The direct claim leaves us unsure which factor is even. Its contrapositive removes that choice: we assume both factors are odd and calculate their product. This is a common reason to try the method when the conclusion contains an OR.

**Claim.** If $a,b\in\mathbb{Z}$ and $ab$ is even, then $a$ is even or $b$ is even.

The conclusion is an OR. Its negation says that neither factor is even, so both are odd.

**Proof by contrapositive.** Assume $a,b$ are odd. Write $a=2r+1$ and $b=2s+1$ for integers $r,s$. Then

$$
ab=(2r+1)(2s+1)=2(2rs+r+s)+1.
$$

The quantity $2rs+r+s$ is an integer, so $ab$ is odd. Thus, if the product is even, at least one factor is even.

The theorem does not say exactly one factor is even. Both can be even: $2\cdot4=8$. It also does not say that an even product forces a specific factor to be even. For $3\cdot2$, the first factor is odd.

Recall that a **prime** is an integer greater than 1 whose only positive divisors are 1 and itself. This is a special divisibility property of the prime number 2. Replacing 2 by an arbitrary positive integer makes a false theorem: $6\mid2\cdot3$, but 6 divides neither factor.

## Divisibility by 3 and remainders

For parity, “not even” had the single form “odd.” For divisibility by three, failure leaves two possible remainders. Contraposition still helps, but we must now carry out two cases. The method does not remove the need for complete coverage; it makes the cases manageable.

The **quotient** is the integer number of whole multiples removed; the **remainder** is what remains. Division with remainder says that every integer $n$ can be expressed as $n=3k+r$ with integer quotient $k$ and remainder $r\in\{0,1,2\}$. This applies to negative integers too; the remainder is chosen from the same three values.

**Claim.** If $3\mid n^2$, then $3\mid n$.

**Proof by contrapositive.** Suppose $3\nmid n$. Its remainder is therefore 1 or 2.

- If $n=3k+1$, then $n^2=3(3k^2+2k)+1$.
- If $n=3k+2$, then $n^2=3(3k^2+4k+1)+1$.

In either case the square has remainder 1 on division by 3, so $3\nmid n^2$. This proves the contrapositive and hence the original claim.

Why does a remainder of 1 rule out divisibility? A number with remainder 1 has the form $3u+1$ for an integer $u$. If it were also $3t$ for an integer $t$, subtraction would yield $1=3(t-u)$ for some integer $u$, which is impossible. The uniqueness of remainders packages that argument.

This proof illustrates cases inside a contrapositive proof. Methods can be combined: contraposition chooses the logical direction, while cases organize the allowed inputs.

## Irrationality through a rational contrapositive

A real number is **irrational** if it is not rational, meaning it has no representation as an integer numerator over a nonzero integer denominator. Some properties describe the absence of a representation. “Irrational” tells us that no suitable fraction exists, which gives us little to substitute into an expression. Its negation, rationality, supplies exactly such a fraction. This contrast often makes the contrapositive easier to calculate with than the original statement.

Sometimes rationality gives a useful fractional representation while irrationality gives no direct algebraic form.

**Claim.** If $x\in\mathbb{R}$ and $x^2$ is irrational, then $x$ is irrational.

**Proof by contrapositive.** Assume $x$ is rational. There are integers $a,b$ with $b\ne0$ such that $x=a/b$. Consequently,

$$
x^2=\frac{a^2}{b^2}.
$$

Both numerator and denominator are integers, and $b^2\ne0$, so $x^2$ is rational. This proves the claim.

The converse is false. The irrational number $\sqrt2$ has rational square 2; the next lesson proves its irrationality. Being irrational does not mean that every expression involving the number is irrational.

The strategy here was to replace a negative property, “not rational,” with its positive definition. A representation such as $a/b$ is usually easier to calculate with than the absence of every such representation.

## Contraposition in set and function arguments

The method is not tied to number properties. A subset claim is an implication about membership, while injectivity is an implication about equal outputs. Translating those definitions into their contrapositive forms gives us alternative ways to prove the same structural facts.

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

One half of an equivalence may be easy to prove directly while the other half needs a different idea. There is no requirement to make the two proofs look alike. The important thing is that each direction begins with its own hypothesis and ends with the appropriate conclusion.

**Claim.** An integer $n$ is even if and only if $n^2$ is even.

One direction has a short direct proof: if $n=2k$, then $n^2=2(2k^2)$ is even. The reverse direction was proved by contrapositive earlier.

A biconditional does not require using the same technique twice. What matters is establishing both directions, with assumptions clearly separated. Label them if there is any chance the reader will confuse which implication is being proved.

## When to choose this method

Try comparing the information available in the original hypothesis with the information available in the negated conclusion. Which one gives you an equation, a useful case split, or a simple object to work with? This comparison is a practical guide to choosing a route, after checking that the logical transformation itself is correct.

Contraposition is especially useful when:

- The negation of the conclusion has a simple defining form, such as an odd integer.
- The hypothesis is a divisibility statement about a square or product.
- A claimed negative property becomes a constructive positive assumption after negation.
- An equivalent characterization, such as injectivity by distinct inputs, fits the objects better.

It is less useful when negating the conclusion introduces a more complicated quantified statement. There is no prize for using an indirect method when a direct calculation is clearer.

The logical transformation must happen before judging convenience. “I will reverse the implication because that is easier” is not a valid strategy unless the reversed statement is separately known to imply the original.

## Diagnose flawed contrapositive proofs

Before judging any algebra in a claimed contrapositive proof, write down what its first assumption ought to be. Many errors can be located there: the proof starts with the converse, changes the domain, or negates only part of a compound statement. Repairing that first sentence often changes the entire argument that follows.

Consider this attempted proof:

> To show that $4\mid n$ implies $n$ is even, assume $n$ is even. Write $n=2k$. Then $n$ is divisible by 4.

It assumes the conclusion and attempts the converse. The last sentence is false when $k$ is odd. The actual contrapositive assumes $n$ is odd and must show $4\nmid n$. Since a multiple of 4 is $2(2k)$, it cannot be odd; a direct proof of the original is even shorter.

Another attempt says:

> To prove that an even product has an even factor, assume one factor is odd and show that the product is odd.

The negation of “at least one factor is even” is **both factors are odd**. Assuming only one odd factor is insufficient: $3\cdot2$ is even. This mistake is a failure to apply De Morgan's law before starting the arithmetic.

Finally, never conclude that a theorem is false because your contrapositive proof attempt stalls. Difficulty with a chosen method says something about the proof attempt, not the truth of the statement.

A related method is **proof by contradiction**: temporarily assume the entire statement is false and derive an impossibility. For $P\to Q$, that means assuming both $P$ and $\neg Q$, then deriving incompatible facts. Contraposition instead assumes $\neg Q$ and aims at $\neg P$; it need not also assume $P$. The next lesson develops contradiction in detail.

## Readiness checklist

You should now be able to:

- Write the converse, inverse, and contrapositive without confusing them.
- Explain why only the contrapositive is automatically equivalent to the original.
- Negate compound conclusions and preserve boundary cases in inequalities.
- Prove parity and small-divisor claims using definitions and exhaustive remainders.
- Use contraposition for one direction of a biconditional.
- Recognize equivalent elementwise formulations of inclusion and injectivity.
- Explain why the method does not change the theorem's domain or outer universal quantifier.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
