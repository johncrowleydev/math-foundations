# Propositional Logic

Propositional logic is the study of statements that are either true or false and the rules for combining those statements. It is one of the basic languages of mathematical reasoning, proof, Boolean algebra, digital logic, and programming.

The goal is not merely to memorize symbols or truth tables. The useful skill is learning to turn ordinary statements into precise logical objects, reason about their structure, and recognize what does or does not follow from a set of assumptions.

## Propositions

A **proposition** is a statement with a definite truth value: it is either true or false.

Its **truth value** is that choice, true or false. Letters such as $x$ can stand for numbers whose values have not yet been specified; a sentence containing such a letter may not yet have a definite truth value.

Examples:

- $2+2=4$ is a true proposition.
- $7<3$ is a false proposition.
- "There are infinitely many integers" is a true proposition.

These are not propositions:

- "What time is it?" is a question.
- "Close the door." is a command.
- $x>5$ is not yet a proposition because its truth depends on the value of $x$.

We usually represent propositions with letters such as $p$, $q$, and $r$.

For example:

$$
p = \text{"It is raining"}
$$

$$
q = \text{"I have an umbrella"}
$$

Once propositions have names, we can combine them with logical operators.

## Negation: NOT

The **negation** of $p$ is written

$$
\neg p
$$

and means "not $p$."

If $p$ is true, $\neg p$ is false. If $p$ is false, $\neg p$ is true.

| $p$ | $\neg p$ |
| --- | -------- |
| T   | F        |
| F   | T        |

## Conjunction: AND

The **conjunction** of $p$ and $q$ is

$$
p \land q
$$

and means "$p$ and $q$."

It is true only when both propositions are true.

| $p$ | $q$ | $p\land q$ |
| --- | --- | ---------- |
| T   | T   | T          |
| T   | F   | F          |
| F   | T   | F          |
| F   | F   | F          |

For Boolean-valued inputs in programming, this is the same basic truth operation represented by expressions such as `p && q`. Some languages also apply truthiness rules to non-Boolean values; here we reason only about true and false.

## Disjunction: OR

The **disjunction** of $p$ and $q$ is

$$
p \lor q
$$

and means "$p$ or $q$."

Mathematical OR is normally **inclusive OR**: it is true when either proposition is true or when both are true.

| $p$ | $q$ | $p\lor q$ |
| --- | --- | --------- |
| T   | T   | T         |
| T   | F   | T         |
| F   | T   | T         |
| F   | F   | F         |

This differs from exclusive OR (XOR), which is true only when exactly one input is true.

## Implication: IF ... THEN

An implication is written

$$
p \to q
$$

and is read as "$p$ implies $q$" or "if $p$, then $q$."

Its truth table is:

| $p$ | $q$ | $p\to q$ |
| --- | --- | -------- |
| T   | T   | T        |
| T   | F   | F        |
| F   | T   | T        |
| F   | F   | T        |

The only false case is

$$
T \to F.
$$

The easiest way to understand this is that an implication makes one promise: **whenever $p$ is true, $q$ must also be true**. If $p$ is false, the promise has not been violated.

For example:

> If I win the lottery, I will buy you a car.

The promise is broken only if I win the lottery and do not buy you a car. If I never win, the statement has not been falsified.

### Implication does not mean causation

Logic describes truth relationships, not causal relationships.

Suppose

$$
p = \text{"2 is even"}
$$

and

$$
q = \text{"Paris is in France"}.
$$

Both propositions are true, so $p\to q$ is logically true. That obviously does not mean that the evenness of 2 causes Paris to be in France.

## Converse, inverse, and contrapositive

Starting with an implication

$$
p\to q,
$$

there are three closely related statements.

When a statement claims that every number with one property has another property, a **counterexample** is one number with the first property but without the promised second property. One such number makes the claim false. For example, 6 is even but is not divisible by 4.

The **converse** reverses the implication:

$$
q\to p.
$$

The **inverse** negates both parts without reversing them:

$$
\neg p\to\neg q.
$$

The **contrapositive** both reverses and negates:

$$
\neg q\to\neg p.
$$

Only the original and contrapositive are always logically equivalent:

$$
p\to q \equiv \neg q\to\neg p.
$$

The converse and inverse are also logically equivalent to each other:

$$
q\to p \equiv \neg p\to\neg q.
$$

But neither pair is generally equivalent to the other pair.

Example:

> If an integer is divisible by 4, then it is even.

The original is true. Its converse is:

> If an integer is even, then it is divisible by 4.

That is false; 6 is a counterexample.

Its inverse is:

> If an integer is not divisible by 4, then it is not even.

That is also false; 6 is again a counterexample.

Its contrapositive is:

> If an integer is not even, then it is not divisible by 4.

That is true.

## Necessary and sufficient conditions

The implication

$$
p\to q
$$

can also be read as:

- **$p$ is sufficient for $q$**;
- **$q$ is necessary for $p$**.

If $p$ happens, that is enough to guarantee $q$. And if $p$ is to happen, $q$ must be available as a necessary condition.

For example:

> Being divisible by 4 is sufficient for being even.

and equivalently:

> Being even is necessary for being divisible by 4.

This wording is easy to reverse accidentally. Two phrases are especially worth memorizing:

- "$p$ **only if** $q$" means $p\to q$.
- "$p$ **if** $q$" means $q\to p$.

"Only if" introduces a necessary condition. "If" introduces a sufficient condition.

## Biconditional: IF AND ONLY IF

A **biconditional** is written

$$
p\leftrightarrow q
$$

and read as "$p$ if and only if $q$," often abbreviated **iff**.

It asserts both directions:

$$
p\to q
$$

and

$$
q\to p.
$$

Therefore it is true when $p$ and $q$ have the same truth value.

| $p$ | $q$ | $p\leftrightarrow q$ |
| --- | --- | -------------------- |
| T   | T   | T                    |
| T   | F   | F                    |
| F   | T   | F                    |
| F   | F   | T                    |

Equivalently,

$$
p\leftrightarrow q \equiv (p\to q)\land(q\to p).
$$

It can also be expressed as "both true or both false":

$$
p\leftrightarrow q \equiv (p\land q)\lor(\neg p\land\neg q).
$$

## Logical equivalence

Before comparing whole formulas, practice evaluating their intermediate parts. Let

$$
E=(p\lor q)\land\neg p.
$$

If $p=F$ and $q=T$, then $p\lor q=T$ and $\neg p=T$, so $E=T$. Parentheses specify which smaller expressions must be evaluated before the final conjunction.

A complete truth table checks every assignment. With two independent propositional variables there are $2^2=4$ rows:

| $p$ | $q$ | $p\lor q$ | $\neg p$ | $(p\lor q)\land\neg p$ | $\neg p\land q$ |
| --- | --- | --------- | -------- | ---------------------- | --------------- |
| T   | T   | T         | F        | F                      | F               |
| T   | F   | T         | F        | F                      | F               |
| F   | T   | T         | T        | T                      | T               |
| F   | F   | F         | T        | F                      | F               |

The last two columns agree in every row. In general, $n$ independent propositional variables require $2^n$ assignments. A systematic row order prevents accidentally omitting one; extra columns expose intermediate operations and make mistakes easier to locate.

Two expressions are **logically equivalent** when they have the same truth value under every possible assignment of their variables.

We write

$$
A\equiv B.
$$

For example,

$$
p\to q \equiv \neg q\to\neg p.
$$

A truth table can prove equivalence: if the final columns for two expressions match in every row, the expressions are logically equivalent.

A particularly useful equivalence is

$$
p\to q \equiv \neg p\lor q.
$$

This also explains the implication truth table. The expression $\neg p\lor q$ fails only when $p$ is true and $q$ is false.

## De Morgan's laws

De Morgan's laws describe how negation distributes across AND and OR:

$$
\neg(p\land q)\equiv\neg p\lor\neg q
$$

and

$$
\neg(p\lor q)\equiv\neg p\land\neg q.
$$

When the outer negation moves inward:

1. each individual proposition is negated, and
2. AND and OR swap.

In programming terms,

```ts
!(isAdmin && isActive);
```

is equivalent to

```ts
!isAdmin || !isActive;
```

and

```ts
!(isAdmin || isOwner);
```

is equivalent to

```ts
!isAdmin && !isOwner;
```

## Common equivalence laws

Truth tables can establish any propositional equivalence, but repeatedly building them is cumbersome. Once an equivalence has been established, it can be used algebraically as a rewrite rule.

### Negation laws

Negating a statement twice is called **double negation** and returns the original statement:

$$
\neg\neg p \equiv p
$$

$$
p\lor\neg p \equiv T
$$

$$
p\land\neg p \equiv F
$$

### Identity and domination

$$
p\land T\equiv p
$$

$$
p\lor F\equiv p
$$

$$
p\lor T\equiv T
$$

$$
p\land F\equiv F
$$

### Idempotent laws

$$
p\lor p\equiv p
$$

$$
p\land p\equiv p
$$

### Commutative laws

$$
p\lor q\equiv q\lor p
$$

$$
p\land q\equiv q\land p
$$

### Associative laws

$$
(p\lor q)\lor r\equiv p\lor(q\lor r)
$$

$$
(p\land q)\land r\equiv p\land(q\land r)
$$

### Distributive laws

$$
p\land(q\lor r)\equiv(p\land q)\lor(p\land r)
$$

$$
p\lor(q\land r)\equiv(p\lor q)\land(p\lor r)
$$

Notice that propositional logic has distribution in both directions: AND distributes over OR, and OR distributes over AND.

### Absorption laws

$$
p\lor(p\land q)\equiv p
$$

$$
p\land(p\lor q)\equiv p
$$

### Implication and biconditional rewrites

$$
p\to q\equiv\neg p\lor q
$$

$$
p\leftrightarrow q\equiv(p\to q)\land(q\to p)
$$

$$
p\leftrightarrow q\equiv(p\land q)\lor(\neg p\land\neg q)
$$

These laws let you simplify expressions much like algebra. For example,

$$
(p\land q)\lor(p\land\neg q)
$$

can be factored using the distributive law:

$$
p\land(q\lor\neg q).
$$

Since $q\lor\neg q\equiv T$,

$$
p\land T\equiv p.
$$

So

$$
(p\land q)\lor(p\land\neg q)\equiv p.
$$

## Tautologies, contradictions, and contingent statements

A **tautology** is true under every possible assignment of its variables.

Example:

$$
p\lor\neg p.
$$

Either $p$ is true or it is not, so the expression can never be false.

A **contradiction** is false under every possible assignment.

Example:

$$
p\land\neg p.
$$

A proposition cannot simultaneously be true and false.

A statement that is sometimes true and sometimes false is neither a tautology nor a contradiction. It is often called **contingent**.

## Counterexamples

A universal statement claims that something is true in every applicable case. To disprove it, one counterexample is enough.

For example:

> Every even integer is divisible by 4.

The integer 6 is even but is not divisible by 4. That single example disproves the universal statement.

The same idea is useful for logical equivalence. To prove that two expressions are **not** logically equivalent, it is enough to find one assignment of truth values on which they differ.

For example, compare

$$
p\to q
$$

and

$$
q\to p.
$$

Set $p=T$ and $q=F$. Then

$$
p\to q = F
$$

while

$$
q\to p = T.
$$

Therefore they are not logically equivalent.

## Arguments, premises, and conclusions

An **argument** consists of one or more **premises** followed by a **conclusion** that is claimed to follow from them.

For example:

1. If the server is down, an alert is sent.
2. The server is down.
3. Therefore, an alert is sent.

An argument is **valid** when there is no possible truth-value assignment that makes all of its premises true and its conclusion false.

Validity is about logical structure. It does not require the premises to be true in the real world. A valid argument with false premises can still have perfectly correct logical form.

The symbol

$$
\therefore
$$

means "therefore." Another common notation is

$$
P_1,P_2,\ldots,P_n \vdash C,
$$

meaning that conclusion $C$ is derivable from the premises.

## Common rules of inference

### Modus ponens

$$
p,\quad p\to q \quad\therefore\quad q
$$

If $p$ is true and $p\to q$ is true, then $q$ must be true.

### Modus tollens

$$
p\to q,\quad \neg q \quad\therefore\quad \neg p
$$

This is reasoning through the contrapositive.

### Hypothetical syllogism

$$
p\to q,\quad q\to r \quad\therefore\quad p\to r
$$

Implications can be chained.

### Disjunctive syllogism

$$
p\lor q,\quad \neg p \quad\therefore\quad q
$$

If at least one of $p$ or $q$ is true and $p$ is false, $q$ must be true.

## Two common invalid argument forms

Because the converse and inverse of an implication are not generally equivalent to the original implication, two tempting argument patterns are invalid.

### Affirming the consequent

$$
p\to q,\quad q \quad\therefore\quad p
$$

This is invalid. If "if it rains, the sidewalk is wet" and the sidewalk is wet, rain is not the only possible explanation.

A truth-value counterexample is $p=F$, $q=T$: the premise $p\to q$ is true and $q$ is true, but the conclusion $p$ is false.

### Denying the antecedent

$$
p\to q,\quad \neg p \quad\therefore\quad \neg q
$$

This is also invalid. Again, $p=F$, $q=T$ makes both premises true and the conclusion false.

## Satisfiability

A proposition is **satisfiable** if there is at least one assignment of truth values that makes it true. Such an assignment is sometimes called a **model** or **satisfying assignment**.

For example,

$$
p\land q
$$

is satisfiable because $p=T$, $q=T$ makes it true.

A proposition is **unsatisfiable** if no assignment makes it true. A contradiction is therefore unsatisfiable.

For example,

$$
p\land\neg p
$$

is unsatisfiable.

A tautology is true under every assignment, so every tautology is satisfiable. But not every satisfiable proposition is a tautology: $p$ is satisfiable, yet it is false when $p=F$.

These ideas matter directly in computer science. The Boolean satisfiability problem, usually called **SAT**, asks whether a propositional formula has any satisfying assignment. SAT is one of the foundational problems in theoretical computer science and appears in automated reasoning, verification, planning, constraint solving, and many other areas.

## A first proof by contrapositive

Let $n$ be an integer. Consider the statement:

> If $n^2$ is even, then $n$ is even.

Symbolically:

$$
n^2\text{ even}\to n\text{ even}.
$$

Trying to reason forward from $n^2$ can be awkward. The contrapositive is easier:

> If $n$ is odd, then $n^2$ is odd.

If $n$ is odd, then by definition there is some integer $k$ such that

$$
n=2k+1.
$$

Squaring gives

$$
n^2=(2k+1)^2=4k^2+4k+1.
$$

Factor 2 from the first two terms:

$$
n^2=2(2k^2+2k)+1.
$$

This has the form $2m+1$ for an integer $m$, so $n^2$ is odd. Therefore the contrapositive is true, and because an implication is logically equivalent to its contrapositive, the original statement is true.

This small proof illustrates several ideas at once: translating definitions into algebra, choosing a logically equivalent statement that is easier to prove, and writing a chain of reasoning that establishes the claim for every applicable integer rather than checking examples one by one.

## What to be able to do before moving on

You should be able to:

- identify whether a sentence is a proposition;
- translate between ordinary language and $\neg$, $\land$, $\lor$, $\to$, and $\leftrightarrow$;
- evaluate compound propositions from given truth values;
- explain why $p\to q$ is false only when $p=T$ and $q=F$;
- write the converse, inverse, and contrapositive of an implication;
- distinguish a statement from its converse and inverse;
- recognize that an implication and its contrapositive are equivalent, and that the converse and inverse are equivalent;
- identify necessary and sufficient conditions and correctly translate "if" and "only if";
- use $p\to q\equiv\neg p\lor q$;
- apply De Morgan's laws and the common equivalence laws;
- simplify propositional expressions algebraically;
- build and read truth tables;
- classify expressions as tautologies, contradictions, or contingent;
- use one counterexample to disprove a universal claim or proposed logical equivalence;
- identify premises and conclusions in an argument;
- recognize and use modus ponens, modus tollens, hypothetical syllogism, and disjunctive syllogism;
- recognize affirming the consequent and denying the antecedent as invalid;
- test an argument for validity by asking whether all premises can be true while the conclusion is false;
- determine whether a formula is satisfiable or unsatisfiable and give a satisfying assignment when one exists.

## Practice

Work through the accompanying [Propositional Logic Worksheet](../worksheets/01-propositional-logic.yaml). It contains extensive practice on all of these ideas, followed by an answer key. In the study app, this link downloads the printable PDF generated from the worksheet source.

Continue with [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md) to express claims about every object or about the existence of a witness.
