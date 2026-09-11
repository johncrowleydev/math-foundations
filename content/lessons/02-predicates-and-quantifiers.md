# Predicates and Quantifiers

Propositional logic gives us a language for combining complete statements. But mathematics constantly makes claims about objects whose values have not yet been specified:

> Every integer has a larger integer.

> Some integers are divisible by both 2 and 3.

> Every request is assigned to a worker.

To express these precisely, we need **predicates**, which describe properties or relationships, and **quantifiers**, which say how many objects satisfy them. This lesson builds on [Propositional Logic](../lessons/01-propositional-logic.md), especially implication, negation, and counterexamples.

The goal is to read a quantified statement, explain exactly what it promises, and know what would prove or disprove it. Quantifier order is particularly important: a choice that can vary for each input is very different from one fixed choice that must work for every input.

## Domains come first

“There is a solution” sounds complete until someone asks what counts as an allowed answer. If we are assigning whole seats on a bus, half a seat will not do; if we are measuring a length, fractions may be perfectly appropriate. Specifying the domain gives a mathematical statement this missing context. It is part of the claim, not a technical detail to add afterward.

A **domain**, or universe of discourse, is the collection of objects a variable is allowed to represent. The same expression can give different mathematical claims over different domains.

For example, consider:

$$
x^2=2.
$$

There is no integer satisfying this equation, but there is a real number satisfying it: $\sqrt{2}$. Before asking whether a quantified statement is true, specify where its variables live.

We will use:

| Notation       | Domain                                           |
| -------------- | ------------------------------------------------ |
| $\mathbb{Z}$   | Integers: $\ldots,-2,-1,0,1,2,\ldots$            |
| $\mathbb{N}_0$ | Nonnegative integers: $0,1,2,\ldots$             |
| $\mathbb{R}$   | Real numbers                                     |
| $D=\{1,2,3\}$  | The finite domain containing exactly 1, 2, and 3 |

The symbol $\in$ means "is an element of." Thus $x\in\mathbb{Z}$ says that $x$ is an integer. Braces list the elements of a finite domain; we will study sets more fully in the next topic.

Unless we explicitly discuss an empty domain, assume the domains in this lesson are nonempty. Different variables can have different domains: requests and workers, for example, need not be the same kind of object.

## Predicates and substitution

A **predicate** is a property or relationship that becomes a proposition when its unspecified inputs have values. Think of “___ is greater than five” as a sentence with a place to fill. The notation names the sentence and its input together, so we can reuse the same test with different objects.

Let the domain be $\mathbb{Z}$ and define

$$
P(x):\quad x>5.
$$

$P(x)$ is not a complete proposition while $x$ is unspecified. But substituting a particular integer gives one:

Substituting 8 produces the proposition $8>5$, so $P(8)$ is true. Substituting 5 gives $5>5$, which is false because the inequality is strict. Substituting $-2$ also gives a false proposition. In each case we use the same condition; changing the input changes the statement being tested.

Predicates can have several arguments. For integers $x,y$, define

$$
R(x,y):\quad x<y.
$$

Then $R(2,7)$ is true and $R(7,2)$ is false. Argument order matters: the first input goes into the first position.

We can combine predicates with the operators from propositional logic. If $E(n)$ means "the integer $n$ is even," then

$$
E(n)\land(n>10)
$$

says that $n$ is even and greater than 10. An occurrence of a variable left unspecified in this way is called **free**. Assigning a value is one way to complete the statement. Quantifying it—saying something about every allowed value or about at least one—is the other way we will now develop. Later we will examine exactly which variable occurrences a quantifier controls.

## Universal quantification: for every

Suppose someone claims that every book on a shelf has a blue cover. To defeat the claim, you need only find one book with a different cover. To establish it by inspection, you must check the entire shelf. Universal statements have this same asymmetry: their promise covers every allowed object, so one exception matters as much as a thousand agreeing examples.

The symbol $\forall$ means **for every** or **for all**. The statement

$$
\forall x\in D,\ P(x)
$$

says that every allowed value of $x$ makes $P(x)$ true.

For example,

$$
\forall n\in\mathbb{Z},\ n^2\geq0
$$

is true: the square of any integer is nonnegative.

But

$$
\forall n\in\mathbb{Z},\ n^2>0
$$

is false because $n=0$ is a **counterexample**.

To prove a universal claim, your reasoning must cover every element of its domain. To disprove it, one genuine counterexample is enough. Checking many examples can suggest a pattern, but it does not prove an infinite universal claim.

For a finite domain $D=\{a,b,c\}$, universal quantification is a finite conjunction:

$$
\forall x\in D,\ P(x)
\quad\equiv\quad
P(a)\land P(b)\land P(c).
$$

An exhaustive check is therefore a proof when the domain is finite and every element really has been checked.

## Existential quantification: there exists

The symbol $\exists$ means **there exists at least one**. The statement

$$
\exists x\in D,\ P(x)
$$

says that some allowed value makes $P(x)$ true. Such a value is called a **witness**.

The word is useful because the object provides evidence for the claim. If someone says there is a blue book on the shelf, pointing to one blue book and checking its cover finishes the job. You do not need to find all the blue books. In mathematics, giving the object is only the first step: you must also verify that it belongs to the domain and has the stated property.

For example,

$$
\exists n\in\mathbb{Z},\ n^2=9
$$

is true. Either $n=3$ or $n=-3$ is a witness. An existential statement does not claim that its witness is unique.

To disprove an existential claim, showing that one candidate fails is not enough. You must show that every candidate fails. For example,

$$
\exists n\in\mathbb{Z},\ n^2=-1
$$

is false because every integer square is nonnegative.

For $D=\{a,b,c\}$, existential quantification is a finite disjunction:

$$
\exists x\in D,\ P(x)
\quad\equiv\quad
P(a)\lor P(b)\lor P(c).
$$

These two quantifiers have opposite proof obligations:

| Claim             | To establish it              | To refute it                  |
| ----------------- | ---------------------------- | ----------------------------- |
| $\forall x\,P(x)$ | Cover every allowed $x$      | Give one $x$ with $\neg P(x)$ |
| $\exists x\,P(x)$ | Give a witness and verify it | Show no allowed $x$ works     |

## Scope, free variables, and bound variables

When a sentence contains several variables, we need to know which instruction controls each one. The scope of a quantifier is the portion of the formula to which its “for every” or “there exists” applies. Parentheses play the role of boundaries. A repeated letter outside that boundary does not automatically become part of the quantified statement.

A quantifier binds occurrences of its variable **within its scope**. Parentheses make that scope visible.

In

$$
\forall x\,(P(x)\to Q(x)),
$$

both occurrences of $x$ are bound by $\forall x$. Once the predicates and domain are specified, this is a proposition.

In

$$
(\forall x\,P(x))\land Q(x),
$$

the $x$ in $Q(x)$ is free. The quantifier inside the parentheses does not bind a variable outside them. It is clearer to rewrite this as

$$
(\forall t\,P(t))\land Q(x).
$$

A bound variable is a placeholder, so it can be renamed consistently without changing the statement, provided the renaming does not change which quantifier binds any occurrence. Choosing a fresh name not already used anywhere in the formula avoids both capturing free variables and collisions with nested quantifiers. For example,

$$
\forall x\,P(x)\equiv\forall t\,P(t).
$$

But replacing $x$ with $y$ in $\forall x\,R(x,y)$ would change the free $y$ into a bound variable. Use a fresh name such as $t$ instead: $\forall t\,R(t,y)$.

An expression with a free variable is sometimes called an **open formula**. A formula with no free variables is **closed**. A closed formula has a truth value once its domain and predicate meanings have been fixed.

## Translating all, some, none, and only

Let the domain be all people. Let $S(x)$ mean "$x$ is a student" and $C(x)$ mean "$x$ owns a computer."

| English                              | Logical form                      |
| ------------------------------------ | --------------------------------- |
| Every student owns a computer        | $\forall x\,(S(x)\to C(x))$       |
| Some student owns a computer         | $\exists x\,(S(x)\land C(x))$     |
| No student owns a computer           | $\forall x\,(S(x)\to\neg C(x))$   |
| Some student does not own a computer | $\exists x\,(S(x)\land\neg C(x))$ |
| Only students own computers          | $\forall x\,(C(x)\to S(x))$       |

The first two translations are worth comparing carefully. Imagine checking people one at a time. For “every student owns a computer,” a nonstudent imposes no obligation: the statement is about students. For “some student owns a computer,” a nonstudent is no help at all: we must actually find a student who owns one. This difference determines which connective belongs inside the quantifier.

**Universal restrictions usually use implication.** "Every student owns a computer" imposes a condition on people who are students. It does not claim that every person is a student. Writing $\forall x(S(x)\land C(x))$ would make that much stronger claim.

**Existential restrictions usually use conjunction.** "Some student owns a computer" requires one person who is both a student and a computer owner. The formula $\exists x(S(x)\to C(x))$ is too weak: a nonstudent makes the implication true, even if no student owns a computer.

"Only" introduces a necessary condition. "Only administrators can delete accounts" means that anyone who can delete accounts must be an administrator. It does not claim that every administrator can delete accounts.

Restricted-domain notation packages the same idea more compactly:

$$
\forall n\in\mathbb{Z},\ (n>0\to n^2>0).
$$

This says something about positive integers while keeping the surrounding domain explicit.

## Negating quantified statements

The negation of "everything has the property" is "something lacks the property":

$$
\neg\forall x\,P(x)\equiv\exists x\,\neg P(x).
$$

The negation of "something has the property" is "everything lacks the property":

$$
\neg\exists x\,P(x)\equiv\forall x\,\neg P(x).
$$

These are the quantifier versions of De Morgan's laws. On a finite domain, they are exactly the familiar rules for negating conjunctions and disjunctions.

For example, “not every file is encrypted” reports at least one unencrypted file. It does not say that the rest are unencrypted. By contrast, “there is no encrypted file” rules out every possible example of an encrypted file. The same distinction separates “not every student passed” from “every student failed.” A negation says just enough to make the original claim false; it need not assert the most extreme opposite situation.

Keep the domain unchanged when negating. If a statement is about integers, its negation is still about integers.

For an implication inside a universal statement,

$$
\neg\forall x\,(P(x)\to Q(x))
\equiv
\exists x\,(P(x)\land\neg Q(x)).
$$

A counterexample to "Every $P$ is $Q$" must actually be a $P$ and must fail to be a $Q$. An object that is not a $P$ does not refute the claim.

Also negate comparisons correctly: the negation of $x>3$ is $x\leq3$, not $x<3$.

## Several variables and quantifier order

Quantifier order tells us when we may make a choice. “Every guest can choose a dish they like” allows different dishes for different guests. “There is one dish every guest likes” requires a single dish to satisfy everyone. The ingredients of the two claims are nearly identical, but the second imposes a much stronger demand. Reading left to right helps us see when the choice must be fixed.

Consider the integer statement

$$
\forall x\in\mathbb{Z},\ \exists y\in\mathbb{Z},\ y>x.
$$

Read it from left to right:

1. Someone gives you an arbitrary integer $x$.
2. You must produce an integer $y$ larger than that particular $x$.

You can always choose $y=x+1$, so the statement is true. The chosen $y$ is allowed to depend on $x$.

Now reverse the quantifiers:

$$
\exists y\in\mathbb{Z},\ \forall x\in\mathbb{Z},\ y>x.
$$

This requires one fixed integer larger than every integer. It is false. Whatever candidate $y$ you propose, choose $x=y$; then $y>x$ fails.

> $\forall x\exists y$ allows a potentially different witness for each input. $\exists y\forall x$ requires one witness that works for all inputs.

For nonempty domains, $\exists y\forall x\,R(x,y)$ implies $\forall x\exists y\,R(x,y)$: use the same global witness every time. The reverse implication is not generally valid.

Quantifiers of the same kind can be interchanged:

$$
\forall x\forall y\,R(x,y)\equiv\forall y\forall x\,R(x,y),
$$

$$
\exists x\exists y\,R(x,y)\equiv\exists y\exists x\,R(x,y).
$$

Mixed quantifiers generally cannot.

## Relationships in ordinary language

Let the domain be people, and let $L(x,y)$ mean "$x$ likes $y$."

| Formula                      | Meaning                              |
| ---------------------------- | ------------------------------------ |
| $\forall x\exists y\,L(x,y)$ | Everyone likes someone               |
| $\exists x\forall y\,L(x,y)$ | Someone likes everyone               |
| $\exists y\forall x\,L(x,y)$ | There is someone whom everyone likes |
| $\forall y\exists x\,L(x,y)$ | Everyone is liked by someone         |

Keep both the quantifier order and the predicate's argument order straight. "Someone likes everyone" and "Everyone likes the same person" are different claims.

Unless you explicitly write $x\ne y$, a person may count as their own witness. "Everyone likes someone else" is

$$
\forall x\exists y\,(y\ne x\land L(x,y)).
$$

For a finite relationship table, a true entry in row $x$, column $y$ means that $L(x,y)$ holds. Then:

- $\forall x\exists y$ asks whether every row has a true entry.
- $\exists x\forall y$ asks whether one row is entirely true.
- $\exists y\forall x$ asks whether one column is entirely true.
- $\forall y\exists x$ asks whether every column has a true entry.

This gives a useful way to check your reading of a nested formula.

For instance, three true entries scattered across three different rows can satisfy “everyone likes someone” without producing any entirely true row. Drawing a small table separates the two questions visually. It also makes clear why exchanging the two argument positions changes who is doing the liking, even when the quantifiers themselves stay in the same order.

## Negating nested quantifiers

Ask what a failure of the whole promise would look like before moving any symbols. If every request should have some worker, a failure is one request left without any worker. That gives us both pieces of the negation: an existential choice of the failed request, followed by a universal statement that each worker fails to serve it. The formal rule below records this reasoning.

Move the negation inward one quantifier at a time. Each quantifier switches kind; the order of the variables stays the same.

$$
\neg\forall x\exists y\,R(x,y)
\equiv
\exists x\forall y\,\neg R(x,y).
$$

For example, the negation of "Every request has an assigned worker" is:

> There is a request for which no worker is assigned.

It is not "No request has an assigned worker." One unassigned request already falsifies the original universal claim.

Similarly,

$$
\neg\exists x\forall y\,R(x,y)
\equiv
\forall x\exists y\,\neg R(x,y).
$$

For a more involved example:

$$
\neg\forall x\,(P(x)\to\exists y\,R(x,y)).
$$

First switch the outer quantifier:

$$
\exists x\,\neg(P(x)\to\exists y\,R(x,y)).
$$

Then negate the implication and the existential:

$$
\exists x\,(P(x)\land\forall y\,\neg R(x,y)).
$$

This describes a particular $P$-object with no related $y$ at all.

## Existence, uniqueness, and exactly one

"There is exactly one" combines two claims: **at least one exists** and **at most one exists**.

Think of a system that promises exactly one assigned seat per passenger. An unassigned passenger violates existence; a passenger with two distinct assigned seats violates uniqueness. Preventing double assignments does not by itself guarantee that everyone gets a seat. A mathematical proof of “exactly one” must close both gaps.

The notation

$$
\exists!x\,P(x)
$$

means that exactly one domain element satisfies $P$. An expansion using ordinary quantifiers is

$$
\exists x\bigl(P(x)\land\forall y\,(P(y)\to y=x)\bigr).
$$

The first part gives a witness. The second says that every other candidate with the property must be that same element.

At most one is weaker:

$$
\forall x\forall y\,((P(x)\land P(y))\to x=y).
$$

It allows there to be no $P$-objects at all.

For example, over $\mathbb{Z}$:

- $n+3=5$ has exactly one solution, $n=2$.
- $n^2=4$ has two solutions, so existence holds but uniqueness fails.
- $n^2=-1$ has no solutions. "At most one solution" is true, but "exactly one solution" is false.

To refute an exactly-one claim, either show that no witness exists or give two distinct witnesses.

## Vacuous truth and empty cases

Recall that an implication with a false antecedent is true. Therefore

$$
\forall x\,(P(x)\to Q(x))
$$

is true if no domain element satisfies $P$. This is **vacuous truth**.

For example, "Every file larger than 1 GB is archived" is true if there are no files larger than 1 GB. It does not claim that a large file exists.

If we explicitly allow an empty domain $D=\varnothing$, then

$$
\forall x\in D,\ P(x)
$$

is true: there is no counterexample. But

$$
\exists x\in D,\ P(x)
$$

is false: there is no witness.

This explains an important qualification: inferring $\exists xP(x)$ from $\forall xP(x)$ requires a nonempty domain. On the empty domain the premise is true and the conclusion false.

Vacuous truth is about the truth conditions of the statement, not whether the statement is informative or whether its wording is useful in ordinary conversation.

A helpful way to read the empty case is to look for a violation. An empty shelf has no book with the wrong cover, so “every book on this shelf is blue” has no counterexample. But the same shelf cannot provide a blue book when asked to exhibit one. This is why the universal and existential statements receive different truth values; we are following their different promises consistently.

## Which distributions are valid?

Some equivalence laws extend cleanly to quantifiers:

If every attendee both registered and paid, then every attendee registered and every attendee paid. Splitting the conjunction loses nothing because each universal statement still covers the entire domain. Similarly, finding someone who registered or paid gives us at least one of those two kinds of example. The formulas below express these two safe ways to separate a combined statement.

$$
\forall x\,(P(x)\land Q(x))
\equiv
(\forall x\,P(x))\land(\forall x\,Q(x)),
$$

$$
\exists x\,(P(x)\lor Q(x))
\equiv
(\exists x\,P(x))\lor(\exists x\,Q(x)).
$$

But changing the connectives gives common mistakes.

Over $D=\{1,2\}$, let $P(x)$ mean "$x$ is odd" and $Q(x)$ mean "$x$ is even." Every element is odd or even, so $\forall x(P(x)\lor Q(x))$ is true. Yet neither "every element is odd" nor "every element is even" is true. Thus universal quantification does not generally distribute over OR.

There is also an odd element and an even element, so $(\exists xP(x))\land(\exists xQ(x))$ is true. But no element is both odd and even, so $\exists x(P(x)\land Q(x))$ is false. The two existential statements may use different witnesses.

When comparing quantified formulas, ask whether one expression requires the **same object** to satisfy several conditions while the other permits different objects.

## Valid reasoning with quantifiers

Several basic reasoning steps will appear repeatedly in proofs.

**Universal instantiation:** from $\forall x\in D\,P(x)$, conclude $P(a)$ for any particular $a\in D$.

“Instantiation” means applying a general statement to a particular instance. If every book in a collection is catalogued, and this book belongs to the collection, we may conclude that this book is catalogued. Its membership is essential: the general statement says nothing about an unrelated book elsewhere.

**Existential introduction:** if you have established $P(a)$ for some $a\in D$, conclude $\exists x\in D\,P(x)$.

This moves in a different direction: one verified example supports an existence claim. Showing that 12 is an integer divisible by six establishes that some integer is divisible by six. The existential conclusion deliberately says less than the example; it no longer specifies which integer works.

**Using an existential witness:** from $\exists xP(x)$, you may introduce a fresh name for a witness and reason from its stated property. You may not assume it is a previously chosen object, and you may not assume it has properties beyond those established.

If you know that someone in a room has the key, you can call that person $a$. This is a name for whoever satisfies the claim, not permission to choose your favorite person and announce that they have it. That distinction becomes important when two separate existence statements may refer to different people.

**Universal generalization:** to prove $\forall x\in D\,P(x)$, take an arbitrary element of $D$ and prove $P$ without giving that element any extra assumptions. A proof about one specially selected example does not establish a universal statement.

“Arbitrary” means the argument has to work no matter which allowed object was handed to us. We may use that it belongs to $D$, together with any stated premises, but we cannot quietly choose a convenient value. This is how a finite piece of reasoning can establish a claim about infinitely many objects.

For example, from

$$
\forall x\,(P(x)\to Q(x))
\quad\text{and}\quad
\exists x\,P(x),
$$

we may conclude $\exists xQ(x)$. Take a witness $a$ with $P(a)$. The universal implication gives $P(a)\to Q(a)$, so modus ponens gives $Q(a)$.

By contrast, $\exists xP(x)$ and $\exists xQ(x)$ do not justify $\exists x(P(x)\land Q(x))$. The witnesses may differ.

To refute a proposed quantified inference, give a **countermodel**: a domain and predicate meanings that make all premises true and the conclusion false. A small finite domain is often enough.

## Writing a quantified proof

Consider:

$$
\forall n\in\mathbb{Z},\ \exists m\in\mathbb{Z},\ m>n.
$$

A short complete proof is:

> Let $n$ be an arbitrary integer. Choose $m=n+1$. Then $m$ is an integer and $m>n$. Therefore every integer has a larger integer.

Notice the structure: introduce the arbitrary input, choose a witness, verify that it belongs to the required domain, and verify the required property.

Now consider:

$$
\forall n\in\mathbb{Z},\ (n\text{ odd}\to n^2\text{ odd}).
$$

Take an arbitrary integer $n$ and assume it is odd. By definition, $n=2k+1$ for some integer $k$. Then

$$
n^2=(2k+1)^2=2(2k^2+2k)+1.
$$

Since $2k^2+2k$ is an integer, $n^2$ is odd. This proves the implication for an arbitrary integer $n$. It does not assert that every integer is odd.

The words "arbitrary," "assume," and "choose" mark different logical roles. Keeping those roles distinct prevents many proof errors.

When drafting your own proof, it can help to write those roles in words before filling in the algebra. Who supplies the input? What conditions may you use? Which object must you construct? The finished proof need not be long, but the reader should be able to answer those questions without guessing.

## Quantifiers in programs and specifications

Quantifiers are useful outside a mathematics exercise because they force a requirement to say precisely what success means. A software check can inspect a finite list, while a mathematical specification can describe all inputs the program is intended to handle. Keeping these two jobs separate prevents a successful test run from being mistaken for a proof of universal correctness.

For a finite list, universal and existential checks correspond to familiar operations:

```ts
const everyPositive = values.every((x) => x > 0);
const somePositive = values.some((x) => x > 0);
```

On an empty list, `every` returns true and `some` returns false, matching the empty-domain conventions above. These checks quantify over the elements actually in the list. Checking a finite sample of integers is not a proof about all integers.

Suppose $A(r,w)$ means "worker $w$ is assigned to request $r$." Then

$$
\forall r\in R,\ \exists w\in W,\ A(r,w)
$$

requires every request to have at least one worker. It does not require the same worker for every request or prevent multiple workers from being assigned.

If every request must have exactly one worker, use

$$
\forall r\in R,\ \exists!w\in W,\ A(r,w).
$$

That still does not prevent one worker from serving several requests. Each requirement should say exactly what it promises, without silently adding a different constraint.

## What to be able to do before moving on

You should be able to:

- specify the domain and interpret a predicate's arguments;
- identify free and bound variables and make quantifier scope explicit;
- distinguish universal claims from existential claims;
- provide witnesses and genuine counterexamples;
- translate all, some, none, only, and exactly one;
- distinguish $\forall x\exists y$ from $\exists y\forall x$;
- negate nested quantifiers without changing their order or domain;
- explain vacuous truth and empty-domain cases;
- recognize valid quantifier distributions and produce countermodels to invalid ones;
- use universal statements and existential witnesses correctly in arguments;
- write a short proof that separates arbitrary inputs from chosen witnesses;
- read finite checks and simple program requirements as quantified statements.
