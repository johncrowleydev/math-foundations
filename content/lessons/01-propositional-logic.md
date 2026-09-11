# Propositional Logic

Propositional logic is the study of statements that are either true or false and the rules for combining those statements. It is one of the basic languages of mathematical reasoning and proof: a proof is a chain of justified reasoning that establishes a claim. These same two truth values are called **Boolean** values in programming. **Boolean algebra** studies calculations with them, and digital logic uses such calculations to describe circuits.

Imagine being given a rule and trying to decide what it actually guarantees. “If a number is divisible by four, it is even” is reliable. Reversing it sounds similar, but changes the claim: six is even without being divisible by four. Logic gives us a way to keep track of that difference, even when the sentences become too complicated to hold comfortably in our heads.

The symbols in this lesson are a compact way of recording reasoning that we will also describe in words. Read each formula as a sentence before trying to manipulate it. The aim is to recognize what follows from a set of assumptions and explain why, with the notation helping you keep your place.

## Propositions

A **proposition** is a statement with a definite truth value: it is either true or false.

Its **truth value** is that choice, true or false. “Definite” does not mean that we already know the answer. A claim about an enormous calculation may be a proposition even if no one has checked it. What matters is that it makes a claim that is true or false, rather than asking a question or issuing a command. A **variable**, such as $x$, can stand for a number whose value has not yet been specified; a sentence containing such a letter may not yet have a definite truth value.

Examples:

- $2+2=4$ is a true proposition.
- $7<3$ is a false proposition.
- "There are infinitely many integers" is a true proposition.

These are not propositions:

- "What time is it?" is a question.
- "Close the door." is a command.
- $x>5$ is not yet a proposition because its truth depends on the value of $x$.

A **propositional variable** is a letter standing for a proposition. We usually use letters such as $p$, $q$, and $r$. A **truth assignment**, or simply an **assignment**, chooses a truth value for each propositional variable under discussion. Those choices will let us evaluate statements formed with the operations introduced next.

For example:

$$
p = \text{"It is raining"}
$$

$$
q = \text{"I have an umbrella"}
$$

Naming the statements lets us focus on their relationship without repeatedly writing the whole sentences. A **logical operator** is a way to form a new statement from existing ones. We will begin with “not,” then add “and,” “or,” and “if … then.”

## Negation: NOT

The **negation** of $p$ is written

$$
\neg p
$$

and means "not $p$."

If $p$ is true, $\neg p$ is false. If $p$ is false, $\neg p$ is true.

For example, if $p$ says “the door is open,” its negation says “the door is not open.” Notice the precision: the negation of “the temperature is above 20 degrees” is “the temperature is at most 20 degrees,” which includes exactly 20. Replacing a statement by something that merely sounds opposite can leave a case out.

The table below is a **truth table**. Each row describes one possible truth value of the input, and the next column gives the resulting truth value. We abbreviate true as T and false as F. Reading both rows checks that our description covers every possibility.

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

It is true only when both propositions are true. The parts joined by AND are called **conjuncts**.

Suppose admission requires a ticket and identification. Bringing a ticket alone does not satisfy the combined requirement; neither does bringing identification alone. This is what the three false rows below record. You can read the table as four small scenarios rather than four facts to memorize.

| $p$ | $q$ | $p\land q$ |
| --- | --- | ---------- |
| T   | T   | T          |
| T   | F   | F          |
| F   | T   | F          |
| F   | F   | F          |

For Boolean-valued inputs in programming, this is the same truth operation written `p && q`, where `&&` means AND. Some programming languages also convert other values, such as numbers or text, into true or false before using this operation. Those conversion rules are called **truthiness** rules; here our inputs are already true or false.

## Disjunction: OR

The **disjunction** of $p$ and $q$ is

$$
p \lor q
$$

and means "$p$ or $q$."

The parts joined by OR are called **disjuncts**. Mathematical OR is normally **inclusive OR**: it is true when either proposition is true or when both are true.

An advertisement saying “applicants with teaching or research experience are welcome” would ordinarily welcome someone with both. That is the sense of OR used here. The statement asks for at least one of the two conditions, without excluding the possibility that both hold.

| $p$ | $q$ | $p\lor q$ |
| --- | --- | --------- |
| T   | T   | T         |
| T   | F   | T         |
| F   | T   | T         |
| F   | F   | F         |

This differs from **exclusive OR**, often abbreviated XOR, which is true only when exactly one input is true. A menu offering “soup or salad, but not both” makes that extra restriction explicit. When translating an ordinary sentence, decide whether that restriction is really intended; the bare symbol $\lor$ does not include it.

## Implication: IF ... THEN

An implication is written

$$
p \to q
$$

and is read as "$p$ implies $q$" or "if $p$, then $q$."

The first part, $p$, is the **antecedent**, the condition we start from. The second part, $q$, is the **consequent**, what the statement promises when that condition holds. These names will help us describe both sound reasoning and tempting mistakes later.

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

![Evaluate the implication on each truth assignment](figure:logic-implication)

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

Keep a finger on the two jobs in the original sentence: which condition is being assumed, and which result is being promised? The three transformations below change those jobs in specific ways. They are easy to confuse when learned as names alone, so we will apply all three to the same numerical example.

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

A **propositional variable**, such as $p$ or $q$, stands for a proposition. An **assignment** chooses a truth value for each such variable; we then evaluate the combined statement using those choices. Two statements are **logically equivalent**, written $\equiv$, when they have the same truth value for every assignment to their component propositions. We will examine how to check this systematically shortly. Of the three transformations, only the contrapositive is always equivalent to the original:

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

Why does the contrapositive preserve the claim? The original rules out a number that is divisible by four but not even. The contrapositive rules out exactly the same situation, approached from the other end. Reversing the sentence without negating it would rule out a different situation, which is why the converse need not work.

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

Think of a necessary condition as a requirement that cannot be missing, and a sufficient condition as enough to finish the job. Flour may be necessary for a particular bread recipe, but flour by itself is not sufficient to make the bread. The analogy helps with the words; in a mathematical claim, use the stated implication to determine exactly which condition plays which role.

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

For an integer $n$, “$n$ is even if and only if $n$ is divisible by two” says that the two descriptions pick out exactly the same integers. Each direction matters. An ordinary implication promises that one description leads to the other; a biconditional also promises the return trip.

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

A complete truth table checks every assignment. Variables are **independent** here when each can be assigned T or F without restrictions from the others. With two independent propositional variables there are $2^2=4$ rows:

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

Start with a sentence rather than the symbols: “It is not the case that both doors are locked.” That tells us at least one door is unlocked, but it does not tell us which one, or whether both are. This explains why negating an AND produces an OR:

$$
\neg(p\land q)\equiv\neg p\lor\neg q
$$

Now consider “It is not the case that either door is locked.” This is stronger: neither door is locked. We need both individual negations, so negating an OR produces an AND:

$$
\neg(p\lor q)\equiv\neg p\land\neg q.
$$

When the outer negation moves inward:

1. each individual proposition is negated, and
2. AND and OR swap.

For the programming examples below, `!` means NOT, `&&` means AND, and `||` means inclusive OR. Names such as `isAdmin` stand for true-or-false statements, just as $p$ and $q$ do. The semicolon ends a programming statement; it is not a logical operator.

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

A true condition adds no further demand to an AND: asking for $p$ and something already true leaves just $p$. A false alternative adds no new way to satisfy an OR. The other two laws describe the reverse effect: one certainly true alternative settles an OR, and one certainly false requirement defeats an AND.

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

Repeating the same requirement does not strengthen it. Saying “bring a ticket and bring a ticket” still asks for a ticket, and listing the same alternative twice does not create another way to succeed. That is the idea behind the word **idempotent** here: repetition leaves the result unchanged.

$$
p\lor p\equiv p
$$

$$
p\land p\equiv p
$$

### Commutative laws

For AND and OR, exchanging the two propositions does not change the truth condition. “Warm and sunny” and “sunny and warm” require the same two things. This permission to exchange inputs belongs to these operators; it does not apply to implication.

$$
p\lor q\equiv q\lor p
$$

$$
p\land q\equiv q\land p
$$

### Associative laws

When three propositions are joined by the same operator, changing the grouping does not change the answer. With AND, all three must hold however we put in the parentheses. With OR, at least one must hold. The parentheses can move because the truth condition stays the same.

$$
(p\lor q)\lor r\equiv p\lor(q\lor r)
$$

$$
(p\land q)\land r\equiv p\land(q\land r)
$$

### Distributive laws

Read $p\land(q\lor r)$ as “$p$ is required, together with at least one of $q$ and $r$.” We can split this into two acceptable routes: $p$ with $q$, or $p$ with $r$. This gives the first law below. The second law can feel less familiar from numerical algebra; its truth table confirms that it is correct for truth values as well.

$$
p\land(q\lor r)\equiv(p\land q)\lor(p\land r)
$$

$$
p\lor(q\land r)\equiv(p\lor q)\land(p\lor r)
$$

Notice that propositional logic has distribution in both directions: AND distributes over OR, and OR distributes over AND.

For the first law, let $p$ mean “you have a ticket,” $q$ mean “you have a passport,” and $r$ mean “you have a driving licence.” Requiring a ticket together with either kind of identification gives two ways to qualify: ticket and passport, or ticket and driving licence. The ticket appears in both alternatives because it is required whichever identification you use. Merely writing $(p\land q)\lor r$ would wrongly allow a driving licence without a ticket.

![Track the shared ticket requirement](figure:logic-distribution)

The second law deserves its own explanation. Suppose $p$ means “you have a guest pass,” $q$ means “you are a member,” and $r$ means “your membership is paid up.” The rule $p\lor(q\land r)$ allows either a guest pass or both membership conditions. In the rewritten rule $(p\lor q)\land(p\lor r)$, a guest pass satisfies both requirements at once. Without a guest pass, the first requirement forces membership and the second forces payment. The two versions therefore admit exactly the same cases. This reasoning checks both possibilities for $p$, rather than borrowing a rule from numerical algebra.

Distribution works backward as well. If two alternatives share a requirement, we can pull that requirement out:

$$
(p\land q)\lor(p\land r)\equiv p\land(q\lor r).
$$

This is often called **factoring**, by analogy with factoring a common multiplier in algebra. Expanding makes the separate routes visible; factoring makes the shared requirement visible. Neither direction is automatically the best simplification. Choose the direction that exposes something useful, such as a repeated term or a statement together with its negation.

### Absorption laws

In $p\lor(p\land q)$, the second alternative cannot rescue a situation in which $p$ is false, because it too requires $p$. If $p$ is true, the first alternative already settles the matter. The extra expression is therefore absorbed. For the AND version, once $p$ is required, the additional requirement “$p$ or $q$” is automatically met.

$$
p\lor(p\land q)\equiv p
$$

$$
p\land(p\lor q)\equiv p
$$

In ordinary language, “you must have a ticket, and you must have a ticket or a pass” still requires just a ticket. The second requirement adds nothing after the first has been met. Compare this with “a ticket or a pass,” which genuinely offers an alternative. Absorption applies because $p$ appears both on its own and inside the larger part; it does not allow us to remove any condition we find inconvenient.

### Implication and biconditional rewrites

These rewrites let us express conditional statements using only NOT, AND, and OR. The last line says that a biconditional holds in either of two situations: both propositions are true, or both are false. Keeping that sentence in mind makes the symbols easier to reconstruct if you forget their arrangement.

$$
p\to q\equiv\neg p\lor q
$$

$$
p\leftrightarrow q\equiv(p\to q)\land(q\to p)
$$

$$
p\leftrightarrow q\equiv(p\land q)\lor(\neg p\land\neg q)
$$

### A worked simplification: expose what is shared

Consider

$$
(p\land q)\lor(p\land\neg q)
$$

Both alternatives require $p$. They differ only in whether $q$ is true. Factoring is useful here because it puts those two remaining possibilities next to one another:

$$
p\land(q\lor\neg q).
$$

The parentheses now say “$q$ or not $q$,” which covers every possible truth value. Replacing that part by T leaves $p\land T$. The identity law then removes a requirement that is always satisfied:

$$
p\land T\equiv p.
$$

So

$$
(p\land q)\lor(p\land\neg q)\equiv p.
$$

The reason for choosing the first step was not simply that distribution was available. It exposed a part whose truth value no longer depended on any variable. Read the original in words as a final check: it allows $p$ together with either possibility for $q$, so $p$ is the only genuine requirement.

![Follow the simplification one justified step at a time](figure:logic-simplification)

### A worked simplification: remove a false alternative

Now try the related expression

$$
(p\lor q)\land(p\lor\neg q).
$$

This time OR is the shared operation. Using its distributive law backward gives $p\lor(q\land\neg q)$. Inside the parentheses, $q$ would have to be both true and false, so that part is F. Finally, $p\lor F\equiv p$: an impossible alternative contributes no way to make the statement true. The answer matches the previous example, but the intermediate connective and the reason it collapses are different.

### A worked simplification: decide what to rewrite first

Suppose we want to express $\neg((p\to q)\land p)$ using only NOT, AND, and OR. The arrow must go because the requested notation excludes it. Replacing the implication gives $\neg((\neg p\lor q)\land p)$. Commutativity lets us put the shared $p$ first, and distribution then gives

$$
\neg\bigl((p\land\neg p)\lor(p\land q)\bigr).
$$

The first alternative is impossible, so the expression becomes $\neg(p\land q)$. De Morgan's law finishes the job: $\neg p\lor\neg q$. Each replacement was made inside the original outer negation; we did not discard it. As a meaning check, an implication together with its true antecedent requires both $p$ and $q$ to be true. Negating that combined requirement says that at least one is false.

You do not need to discover the shortest route on your first attempt. A useful routine is to identify the allowed final notation, look for repeated parts, make one justified replacement, and read the new expression before proceeding. If a proposed step feels doubtful, a small truth table can check it. Several different-looking final expressions may still be equivalent; simplification is about making the relevant structure clearer, not finding a uniquely ordained arrangement of symbols.

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

A statement that is sometimes true and sometimes false is neither a tautology nor a contradiction. It is often called **contingent**, or a **contingency**.

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

An **argument** starts from one or more statements offered as assumptions, called **premises**. It then claims that another statement, its **conclusion**, follows from those premises. We assess the connection between the starting assumptions and the claimed result.

For example:

1. If the server is down, an alert is sent.
2. The server is down.
3. Therefore, an alert is sent.

An argument is **valid** when there is no possible truth-value assignment that makes all of its premises true and its conclusion false.

A **counterassignment** is an assignment that makes all premises true but the conclusion false; finding one demonstrates invalidity.

Validity is about logical structure. It does not require the premises to be true in the real world. A valid argument with false premises can still have perfectly correct logical form.

The symbol

$$
\therefore
$$

means "therefore." Another common notation is

$$
P_1,P_2,\ldots,P_n \vdash C,
$$

The symbols $P_1$ through $P_n$ name the individual premises; the subscript numbers identify them, and the dots mean that the list continues in the same way. $C$ names the conclusion. The **turnstile** $\vdash$ says that the conclusion is **derivable**: a sequence of permitted reasoning steps can lead from those premises to $C$. It is not a numerical inequality.

## Common rules of inference

An **inference rule** is a reusable pattern for passing from premises to a conclusion. You do not need a separate truth table every time you recognize a pattern whose validity has already been established. The important step is checking that your actual premises fit it: having an implication is different from having its consequent, and an attractive conclusion is not a missing premise.

### Modus ponens

$$
p,\quad p\to q \quad\therefore\quad q
$$

If $p$ is true and $p\to q$ is true, then $q$ must be true.

The Latin name **modus ponens** is commonly rendered “the affirming mode”: we affirm the condition of an implication and obtain its promised result. Suppose the premises say “if this file is saved, a copy exists on disk” and “this file is saved.” The conclusion is “a copy exists on disk.” The first premise supplies a rule; the second tells us that its condition has actually been met.

To see why the pattern is valid, try to make the conclusion false while keeping both premises true. A false $q$ together with the given true $p$ would make $p\to q$ false. That contradicts the requirement that this premise is true. There is no row of the truth table that breaks the inference.

### Modus tollens

$$
p\to q,\quad \neg q \quad\therefore\quad \neg p
$$

The Latin name **modus tollens** is commonly rendered “the denying mode.” Here we deny the promised result and work backward to rule out its condition. Suppose “if this integer is divisible by four, it is even,” and we know the integer is not even. It cannot be divisible by four: that would force the very result we have ruled out.

This is reasoning through the contrapositive. The original implication gives $\neg q\to\neg p$; combining that with $\neg q$ gives $\neg p$. Compare the two rules carefully: modus ponens starts with the antecedent, while modus tollens starts with the negation of the consequent. Neither licenses simply reversing an implication.

> **A little history.** These Latin labels are later than the reasoning patterns. Ancient Stoic logicians studied arguments corresponding to both rules using whole statements, long before today's symbolic notation. Learning the names connects us to that tradition, but explaining the steps in ordinary language is still the best way to check that we understand them. See the [Stanford Encyclopedia of Philosophy's account of ancient logic](https://plato.stanford.edu/entries/logic-ancient/).

### Hypothetical syllogism

$$
p\to q,\quad q\to r \quad\therefore\quad p\to r
$$

Here **hypothetical** refers to conditional statements, and a **syllogism** is a structured argument from premises to a conclusion. Imagine that every accepted application is reviewed and every reviewed application receives a response. Then every accepted application receives a response. The middle condition, being reviewed, joins the two promises.

Notice what the conclusion does not say: it does not say that any application was accepted. It says what follows _if_ one is accepted. Formally, assume $p$ for the moment. The first implication yields $q$, and the second then yields $r$. We have established the promised route from $p$ to $r$.

### Disjunctive syllogism

$$
p\lor q,\quad \neg p \quad\therefore\quad q
$$

If at least one of $p$ or $q$ is true and $p$ is false, $q$ must be true.

Suppose a missing key is in the desk drawer or in the coat pocket, and it is not in the drawer. The premises leave the coat pocket as the remaining possibility. **Disjunctive** refers to the OR statement: we eliminate one of its alternatives. The reasoning is valid only if that first premise really includes all possibilities under consideration. If the key might also be on a table, the stated OR premise has not been established.

Inclusive OR is enough for this rule. The first premise may allow both alternatives, but the second premise explicitly rules one out. That is why the other must hold.

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

Using the sidewalk example, “it is not raining” does not establish “the sidewalk is not wet”: a sprinkler could have wet it. Both invalid patterns ask a one-way implication to say more than it promises. When a real argument sounds persuasive, replacing its content with the simple rain example can expose the extra assumption.

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
