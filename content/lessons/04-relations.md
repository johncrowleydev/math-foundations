# Relations

A relation records which objects are connected in a particular way. “Has access to,” “is a prerequisite of,” “has the same remainder as,” and “is no larger than” describe different relations. Their logical properties determine what conclusions we can safely draw from a collection of pairs.

This lesson builds on [Sets and Set Operations](../lessons/03-sets-and-set-operations.md), especially Cartesian products and partitions, and on [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md).

## Relations as sets of ordered pairs

A set tells us which objects are present; a relation tells us which connections are present. Think of a table with users down one side and permissions across the top. Marking a cell records one permission for one user. The set-of-pairs definition is a precise way to store exactly those marked cells, without requiring every user to have the same number of permissions.

“Binary” means that the relation has two input positions. A **binary relation from $A$ to $B$** is a subset $R\subseteq A\times B$. We write $aRb$, read “a is related to b by R,” as an alternative to $(a,b)\in R$. The first input $a$ comes from $A$ and the second input $b$ from $B$. The order of the positions matters.

Let $A=\{\text{Ada},\text{Bo}\}$ be users and $B=\{\text{read},\text{write}\}$ be permissions. The relation

$$
R=\{(\text{Ada},\text{read}),(\text{Ada},\text{write}),(\text{Bo},\text{read})\}
$$

allows Ada both permissions and Bo only reading. A relation can connect an input to none, one, or several outputs. Requiring exactly one output will give the special kind of relation called a function in the next lesson.

A relation **on $A$** is a subset of $A\times A$. The properties below concern relations on one set. Specifying $A$ is part of specifying the problem: adding a new element without adding any pairs can change whether every object relates to itself.

A **matrix** is a rectangular table of entries with named or numbered rows and columns. A **Boolean matrix** uses only 0 and 1. For a finite relation, rows name first inputs, columns name second inputs, and the entry is 1 when the corresponding pair belongs to $R$, or 0 when it does not. For a relation on one set, use the same order for row and column labels. Its **main diagonal** consists of entries whose row and column identify the same object.

We can also draw the relation on one set as a **directed graph**. Each object is a **vertex**, shown as a labeled dot; the plural is **vertices**, and **node** is another name for a vertex. A **directed edge**, shown as an arrow from one dot to another, records an ordered connection: draw an arrow from $a$ to $b$ exactly when $aRb$. An arrow returning to its own dot is a **self-loop**, or loop, and represents $aRa$. This drawing shows objects and connections, rather than the numerical coordinates of a function plot. A relation drawing includes a loop whenever the corresponding same-object pair is present. A **directed walk** is a sequence of vertices following the arrows, with repeats permitted. Its **length** counts the arrows followed, not the physical distance drawn.

![One relation in two representations](figure:relation-representations)

## Four fundamental properties

These properties ask four different questions about a relation's connections. Does each object connect to itself? Can connections be reversed? Can distinct objects connect both ways? Can two consecutive connections be shortened to one? It helps to keep those questions separate instead of trying to classify the relation by its general appearance.

Let $R$ be a relation on $A$.

**Reflexive** means every object relates to itself:

$$
\forall a\in A,\ aRa.
$$

In a finite matrix every main-diagonal entry must be 1. A single missing loop disproves reflexivity.

Equality is reflexive because every object equals itself. By contrast, “is strictly smaller than” is not reflexive on a nonempty number domain: no number is strictly smaller than itself. Reflexivity asks for every self-pair, even if some objects have no connections to other objects.

**Symmetric** means every pair can be reversed:

$$
\forall a,b\in A,\ aRb\to bRa.
$$

To disprove symmetry, exhibit $aRb$ with $bRa$ false. Symmetry does not require any pair to exist in the first place.

“Has the same birthday month as” is symmetric: exchanging the two people cannot change whether their months agree. “Is a parent of” need not be symmetric. The word refers to reversibility of the relationship, not to the physical arrangement of a diagram.

**Antisymmetric** means two distinct objects cannot relate in both directions:

$$
\forall a,b\in A,\ (aRb\land bRa)\to a=b.
$$

Loops are permitted. If both $aRb$ and $bRa$ hold, antisymmetry forces the objects to be the same. It does not forbid unrelated distinct objects.

The numerical relation $\leq$ gives a familiar example. If $a\leq b$ and $b\leq a$, the two numbers must be equal. This explains the allowance for loops: $a\leq a$ is entirely consistent with antisymmetry.

**Transitive** means every two-step connection has the corresponding direct connection. The two steps must fit together: the second starts at the object where the first ends.

$$
\forall a,b,c\in A,\ (aRb\land bRc)\to aRc.
$$

The shorthand $aRbRc$ means $aRb$ and $bRc$: it records the two related pairs, not a new three-input relation. The variables may coincide. If $aRb$ and $bRa$, transitivity requires $aRa$ and $bRb$. It is a mistake to test only triples of distinct elements.

For ordinary numbers, $a\leq b$ and $b\leq c$ guarantee $a\leq c$. A friendship relation need not behave this way: your friend's friend is not automatically your friend. Transitivity is a specific mathematical requirement, not a general rule about anything we happen to draw with connecting lines.

Check each property from its definition; their names do not describe opposite alternatives. “Not symmetric” does not mean “antisymmetric.” For example, on $\{1,2,3\}$, the relation $\{(1,2),(2,1),(2,3)\}$ is neither: the pair $(2,3)$ has no reverse, while 1 and 2 form a bidirectional pair of distinct elements. Equality is both symmetric and antisymmetric. Properties can also interact: a relation that is both symmetric and antisymmetric contains only loops, and is therefore transitive.

## A complete finite check

The example below deliberately satisfies some properties and fails others. For each failed property we will identify the exact pair or chain responsible. For each satisfied property we need a reason that covers all relevant cases. This difference between finding one failure and establishing complete coverage is the same universal-claim distinction used in the earlier lessons.

On $A=\{1,2,3\}$, consider

$$
R=\{(1,1),(2,2),(3,3),(1,2),(2,3)\}.
$$

It is reflexive because every loop is listed. It is not symmetric because $(1,2)$ is present and $(2,1)$ is absent. It is antisymmetric because no pair of distinct elements appears in both directions. It is not transitive: $(1,2)$ and $(2,3)$ require $(1,3)$, which is missing.

![Inspecting the finite relation](figure:relation-finite-check)

Adding $(1,3)$ makes the relation transitive. The resulting relation is exactly $\leq$ restricted to $A$.

For a finite relation, a systematic transitivity test chooses every listed pair $(a,b)$, then every listed pair $(b,c)$, and checks for $(a,c)$. Randomly checking several triples may miss the one that fails. For a relation on an infinite set, use the defining condition algebraically instead of trying to enumerate pairs.

## Vacuous cases and related properties

Empty relations can feel strange because there is nothing to inspect. Return to the logical form: a property that says “whenever these pairs exist, another condition follows” cannot be violated if the required pairs never exist. Reflexivity is different because it demands pairs outright. Separating demands from conditional demands resolves the apparent paradox.

The empty relation on a nonempty set is symmetric, antisymmetric, and transitive: none of the implications has a true antecedent. It is not reflexive because the required loops are absent. On the empty set, the empty relation is reflexive as well, since there is no element missing its loop.

A relation is **irreflexive** when $\forall a\in A,\ \neg aRa$. Failure to be reflexive only requires one missing loop; irreflexivity requires every loop to be missing. A relation with some but not all loops is neither reflexive nor irreflexive.

A relation is **asymmetric** when $aRb$ always implies $\neg bRa$. This forbids loops too: setting $b=a$ would make a loop contradict the condition. The usual strict order $<$ is asymmetric, whereas $\leq$ is antisymmetric but not asymmetric on a nonempty set.

Use definitions to settle empty and boundary cases. Familiar words such as “opposite” or “reverse” are less reliable than the quantified formulas.

## Equivalence relations

Often we want to ignore differences that are irrelevant to a particular question. Two files may be different objects but have the same contents; two dates may fall in the same month. An equivalence relation makes this chosen sense of sameness consistent. Its three properties ensure that grouping objects by that feature does not produce contradictory overlaps.

An **equivalence relation** is reflexive, symmetric, and transitive. It formalizes “the same with respect to a chosen feature.”

For integers $d$ and $n$, **divisibility** means being an integer multiple: $d\mid n$, read “d divides n,” says $n=dk$ for some integer $k$. The vertical bar here does not mean cardinality.

Now fix a positive integer $m$, called the **modulus**. Two integers are **congruent modulo $m$** when their difference is divisible by $m$. We write $a\equiv b\pmod m$, read “a is congruent to b modulo m.” In this context $\equiv$ relates integers, rather than expressing logical equivalence. The definition is

$$
a\equiv b\pmod m\quad\Longleftrightarrow\quad m\mid(a-b).
$$

Equivalently, the two integers leave the same remainder when divided by $m$, using remainders from 0 through $m-1$. We can prove all three properties; the letters $k$ and $\ell$ below stand for integer multipliers witnessing divisibility:

- Reflexivity: $a-a=0=m\cdot0$.
- Symmetry: if $a-b=mk$, then $b-a=m(-k)$.
- Transitivity: if $a-b=mk$ and $b-c=m\ell$, then $a-c=m(k+\ell)$.

Thus congruence is an equivalence relation. For $m=3$, the integers 1, 4, and $-2$ are equivalent because their pairwise differences are multiples of 3.

A **string** is a finite ordered sequence of symbols; its **length** is the number of symbols. A **binary string** uses only 0 and 1, so 01 and 10 are different strings of length two. Other equivalence-relation examples include strings having the same length and people having the same birthday month. Having a shared friend is generally not an equivalence relation: two people might each share a friend with a third person without sharing a friend with each other.

## Equivalence classes and partitions

Once a notion of sameness is fixed, choose an object and collect everything equivalent to it. Choosing another object from the resulting group should give you the same group, not a partly overlapping rival. The proof in this section explains why the equivalence-relation properties guarantee exactly that behavior.

For an equivalence relation $R$ on $A$, the **equivalence class** of $a\in A$ is

$$
[a]=\{x\in A:xRa\}.
$$

For congruence modulo 3, the classes are

$$
[0]=\{3k:k\in\mathbb Z\},\quad
[1]=\{3k+1:k\in\mathbb Z\},\quad
[2]=\{3k+2:k\in\mathbb Z\}.
$$

Read $[a]$ as “the equivalence class of a.” A **representative** is a chosen member used to name its class. The label names the class through one member; it is not the entire class. For example, $[1]=[4]$ even though $1\ne4$.

Equivalence classes partition $A$. Reflexivity places each $a$ in $[a]$, so classes are nonempty and cover $A$. To see why overlapping classes are equal, suppose $z\in[a]\cap[b]$. Then $zRa$ and $zRb$. By symmetry $aRz$, and by transitivity $aRb$. If $x\in[a]$, then $xRa$ and $aRb$ imply $xRb$, so $x\in[b]$. Reversing the roles proves $[b]\subseteq[a]$.

Consequently, two classes are either equal or disjoint. They cannot partly overlap.

![Equivalence classes in a finite domain](figure:relation-classes)

Conversely, any partition defines an equivalence relation: declare $aRb$ when they belong to the same block. Each object shares its block with itself, sharing a block is symmetric, and two successive same-block claims place all three objects in one block. This establishes a correspondence between equivalence relations and partitions.

In software, grouping records by an exact key creates equivalence classes. A “similar enough” comparison may fail transitivity; for instance, relating real numbers whose distance is at most 1 does not give an equivalence relation because 0 relates to 1 and 1 to 2, while 0 does not relate to 2.

## Partial and total orders

Not every sensible comparison puts everything in a single line. One collection of permissions may contain another, while two other collections each have something the other lacks. A partial order allows this incomparability. It still preserves the consistency rules that make “below” and “above” meaningful where comparison is possible.

A **partial order** is reflexive, antisymmetric, and transitive. A set together with a partial order is called a **partially ordered set**, or poset. We often write its relation as $\preceq$ to avoid implying that it is ordinary numerical comparison.

For any set $S$, subset inclusion is a partial order on its power set $\mathcal P(S)$. Every subset contains itself; if $A\subseteq B$ and $B\subseteq A$, then $A=B$; and inclusions compose transitively.

Divisibility is a partial order on the **positive integers**. Reflexivity follows from $a=a\cdot1$. If $b=ak$ and $a=b\ell$ for positive integers, then $k\ell=1$, so $k=\ell=1$ and $a=b$. Transitivity follows by multiplying the factors.

The domain restriction matters: divisibility on all integers is not antisymmetric, since $2\mid-2$ and $-2\mid2$ but $2\ne-2$.

Elements $a,b$ are **comparable** if $a\preceq b$ or $b\preceq a$. A partial order is a **total order** when every pair is comparable. Numerical $\leq$ on $\mathbb Z$ is total. Subset inclusion on $\mathcal P(\{1,2\})$ is not total because $\{1\}$ and $\{2\}$ are incomparable.

Antisymmetry guarantees agreement when comparison goes both ways. It does not guarantee that at least one direction holds.

## Hasse diagrams and extreme elements

A drawing of every comparison in a finite order quickly becomes cluttered. A Hasse diagram leaves out comparisons we can recover by following upward connections. It is therefore a compressed description, not a new relation. Learning what has been omitted is just as important as reading the connections that remain.

For a finite poset, a **Hasse diagram** displays only the essential upward steps. Write $a\prec b$ for $a\preceq b$ together with $a\ne b$; read it as “a is strictly below b in this order.” An element $b$ **[covers](ref:cover)** $a$ when $a\prec b$ and no element $c$ satisfies $a\prec c\prec b$. Draw a dot for each element, place $b$ above $a$, and join the dots when $b$ [covers](ref:cover?repeat) $a$. An **upward path** follows a sequence of these joins, always moving upward. Omit loops and direct joins for comparisons already implied by a longer upward path.

Under inclusion, $\mathcal P(\{1,2\})$ has $\varnothing$ at the bottom, $\{1\}$ and $\{2\}$ above it, and $\{1,2\}$ at the top. The four cover connections form a diamond. There is no direct cover from $\varnothing$ to $\{1,2\}$ because intermediate subsets exist.

![The subset order as a Hasse diagram](figure:relation-hasse)

Although arrowheads are omitted, each join is read upward. A **directed cycle** would follow arrows and return to its starting vertex without repeating any other vertex; an **acyclic** directed graph has no such cycle. The upward connections are acyclic, because returning to a different earlier element would contradict antisymmetry. **Reachability** means that one vertex can be reached from another by following the allowed directions. Here an upward path from $a$ to $b$, or equality $a=b$, recovers exactly the comparison $a\preceq b$. For a prerequisite graph, distinguish an immediate prerequisite edge from the transitive relation “must be completed before.”

A **least element** $a$ satisfies $a\preceq x$ for every element $x$, including itself. A **minimal element** has no strictly smaller element. Least implies minimal, but several incomparable elements can all be minimal. Under divisibility on $\{2,3,6\}$, both 2 and 3 are minimal and neither is least; 6 is the greatest element. A **greatest element** is above every element. A **maximal element** has no strictly larger element; there can be several incomparable maximal elements, just as there can be several minimal ones. A least or greatest element, when it exists, is unique by antisymmetry.

## Inverses and composition of relations

Suppose one relation records which people belong to which clubs, and another records which clubs meet in which rooms. Following the two relationships gives a people-to-rooms relation. There may be several routes to the same final pair, but membership in the resulting relation records only whether at least one route exists. That is the existential condition in composition.

For $R\subseteq A\times B$, its **inverse relation** is

$$
R^{-1}=\{(b,a):(a,b)\in R\}\subseteq B\times A.
$$

Read $R^{-1}$ as “the inverse relation of R.” The superscript $-1$ is an operation name here, not a reciprocal. It reverses every pair. For a relation on one set, symmetry means $R=R^{-1}$.

Let $R\subseteq A\times B$ and $S\subseteq B\times C$. These relations are **compatible** for this composition because the second-input set of $R$ matches the first-input set of $S$. We use the function-style convention: **$S\circ R$ means first $R$, then $S$**. Specifically,

$$
(a,c)\in S\circ R\quad\Longleftrightarrow\quad
\exists b\in B,\ ((a,b)\in R\land(b,c)\in S).
$$

If $R=\{(1,u),(2,u),(2,v)\}$ and $S=\{(u,p),(v,q)\}$, then $S\circ R=\{(1,p),(2,p),(2,q)\}$. A pair is included once even if several intermediate objects justify it.

**Reachability** asks whether following the permitted arrows can lead from one object to another. We must specify whether a walk of length zero is allowed, since that lets an object reach itself without moving. For a relation $R$ on $A$, transitivity is exactly $R\circ R\subseteq R$: every two-step connection already belongs to $R$. Adding all pairs connected by one or more steps produces the **transitive closure**. For a finite relation, repeatedly adding missing shortcuts eventually stops because only finitely many pairs are possible. If reachability in zero steps is included as well, every object reaches itself without moving. Add every loop to record these cases; this gives the **reflexive-transitive closure**.

## Building closures without losing the meaning

A closure adds just enough pairs to enforce a chosen property. Imagine repairing a list of connections while leaving all existing entries in place. The word “smallest” matters: adding every possible pair would often satisfy the property, but would discard the information in the original relation by claiming far more connections than necessary.

Different properties require different repairs. On $A=\{a,b,c\}$, start with $R=\{(a,b),(b,c)\}$.

The **reflexive closure** adds $(a,a),(b,b),(c,c)$. The **symmetric closure** adds $(b,a),(c,b)$. The **transitive closure** adds $(a,c)$. None of these names means “make every relation property true”; each is the smallest relation containing $R$ with the named property.

If we require an equivalence relation, repairs can interact. Adding reverses gives $(b,a)$ and $(c,b)$. Transitivity then requires $(a,c)$ and $(c,a)$ as well as loops, so the smallest equivalence relation containing this $R$ is all of $A\times A$. The chain connects all three objects into one equivalence class.

For a finite relation, repeatedly adding pairs required by the chosen properties stops eventually, because additions never remove a pair and at most $|A|^2$ pairs exist. This explains why the repeated procedure must eventually stop; we must separately check what its resulting relation means.

Not every desired repair can be achieved solely by adding pairs. If a relation already contains $(a,b)$ and $(b,a)$ for distinct elements, adding more pairs cannot make it antisymmetric. That violation persists. Either remove a conflicting pair, change the requirement, or replace objects by appropriately defined equivalence classes; those are different modeling decisions.

## Readiness check

You should now be able to:

- Move between pairs, a finite matrix, and directed arrows.
- Test the four relation properties using their exact quantifiers.
- Give explicit witnesses when a property fails, including repeated vertices in transitivity tests.
- Explain why equivalence classes form a partition.
- Distinguish partial from total orders and minimal from least elements.
- Interpret a finite Hasse diagram and recover implied comparisons.
- Compute a relation composition with its direction stated.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
