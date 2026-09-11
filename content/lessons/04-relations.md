# Relations

A relation records which objects are connected in a particular way. “Has access to,” “is a prerequisite of,” “has the same remainder as,” and “is no larger than” describe different relations. Their logical properties determine what conclusions we can safely draw from a collection of pairs.

This lesson builds on [Sets and Set Operations](../lessons/03-sets-and-set-operations.md), especially Cartesian products and partitions, and on [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md).

## Relations as sets of ordered pairs

A **binary relation from $A$ to $B$** is a subset $R\subseteq A\times B$. We write $aRb$ as an alternative to $(a,b)\in R$. The order of the positions matters.

Let $A=\{\text{Ada},\text{Bo}\}$ be users and $B=\{\text{read},\text{write}\}$ be permissions. The relation

$$
R=\{(\text{Ada},\text{read}),(\text{Ada},\text{write}),(\text{Bo},\text{read})\}
$$

allows Ada both permissions and Bo only reading. A relation can connect an input to none, one, or several outputs. Requiring exactly one output will give the special kind of relation called a function in the next lesson.

A relation **on $A$** is a subset of $A\times A$. The properties below concern relations on one set. Specifying $A$ is part of specifying the problem: adding a new element without adding any pairs can change whether a relation is reflexive.

For finite sets, a relation can be displayed as a Boolean matrix. Rows name first coordinates, columns name second coordinates, and an entry is 1 when the pair belongs. A directed graph gives another representation: draw an arrow from $a$ to $b$ when $aRb$. A loop represents $aRa$.

## Four fundamental properties

Let $R$ be a relation on $A$.

**Reflexive** means every object relates to itself:

$$
\forall a\in A,\ aRa.
$$

In a finite matrix every diagonal entry must be 1. A single missing loop disproves reflexivity.

**Symmetric** means every pair can be reversed:

$$
\forall a,b\in A,\ aRb\to bRa.
$$

To disprove symmetry, exhibit $aRb$ with $bRa$ false. Symmetry does not require any pair to exist in the first place.

**Antisymmetric** means two distinct objects cannot relate in both directions:

$$
\forall a,b\in A,\ (aRb\land bRa)\to a=b.
$$

Loops are permitted. If both $aRb$ and $bRa$ hold, antisymmetry forces the objects to be the same. It does not forbid unrelated distinct objects.

**Transitive** means every composable two-step connection has the corresponding direct connection:

$$
\forall a,b,c\in A,\ (aRb\land bRc)\to aRc.
$$

The variables may coincide. If $aRb$ and $bRa$, transitivity requires $aRa$ and $bRb$. It is a mistake to test only triples of distinct elements.

Check each property from its definition; their names do not describe opposite alternatives. “Not symmetric” does not mean “antisymmetric.” For example, on $\{1,2,3\}$, the relation $\{(1,2),(2,1),(2,3)\}$ is neither: the pair $(2,3)$ has no reverse, while 1 and 2 form a bidirectional pair of distinct elements. Equality is both symmetric and antisymmetric. Properties can also interact: a relation that is both symmetric and antisymmetric contains only loops, and is therefore transitive.

## A complete finite check

On $A=\{1,2,3\}$, consider

$$
R=\{(1,1),(2,2),(3,3),(1,2),(2,3)\}.
$$

It is reflexive because every loop is listed. It is not symmetric because $(1,2)$ is present and $(2,1)$ is absent. It is antisymmetric because no pair of distinct elements appears in both directions. It is not transitive: $(1,2)$ and $(2,3)$ require $(1,3)$, which is missing.

Adding $(1,3)$ makes the relation transitive. The resulting relation is exactly $\leq$ restricted to $A$.

For a finite relation, a systematic transitivity test chooses every listed pair $(a,b)$, then every listed pair $(b,c)$, and checks for $(a,c)$. Randomly checking several triples may miss the one that fails. For a relation on an infinite set, use the defining condition algebraically instead of trying to enumerate pairs.

## Vacuous cases and related properties

The empty relation on a nonempty set is symmetric, antisymmetric, and transitive: none of the implications has a true antecedent. It is not reflexive because the required loops are absent. On the empty set, the empty relation is reflexive as well, since there is no element missing its loop.

A relation is **irreflexive** when $\forall a\in A,\ \neg aRa$. Failure to be reflexive only requires one missing loop; irreflexivity requires every loop to be missing. A relation with some but not all loops is neither reflexive nor irreflexive.

A relation is **asymmetric** when $aRb$ always implies $\neg bRa$. This forbids loops too: setting $b=a$ would make a loop contradict the condition. The usual strict order $<$ is asymmetric, whereas $\leq$ is antisymmetric but not asymmetric on a nonempty set.

Use definitions to settle edge cases. Familiar words such as “opposite” or “reverse” are less reliable than the quantified formulas.

## Equivalence relations

An **equivalence relation** is reflexive, symmetric, and transitive. It formalizes “the same with respect to a chosen feature.”

Fix a positive integer $m$. Define congruence modulo $m$ on $\mathbb Z$ by

$$
a\equiv b\pmod m\quad\Longleftrightarrow\quad m\mid(a-b).
$$

Here $m\mid d$ means $d=mk$ for some integer $k$. We can prove all three properties:

- Reflexivity: $a-a=0=m\cdot0$.
- Symmetry: if $a-b=mk$, then $b-a=m(-k)$.
- Transitivity: if $a-b=mk$ and $b-c=m\ell$, then $a-c=m(k+\ell)$.

Thus congruence is an equivalence relation. For $m=3$, the integers 1, 4, and $-2$ are equivalent because their pairwise differences are multiples of 3.

Other examples include strings having the same length and people having the same birthday month. Having a shared friend is generally not an equivalence relation: two people might each share a friend with a third person without sharing a friend with each other.

## Equivalence classes and partitions

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

The labels are representatives, not the entire classes. For example, $[1]=[4]$ even though $1\ne4$.

Equivalence classes partition $A$. Reflexivity places each $a$ in $[a]$, so classes are nonempty and cover $A$. To see why overlapping classes are equal, suppose $z\in[a]\cap[b]$. Then $zRa$ and $zRb$. By symmetry $aRz$, and by transitivity $aRb$. If $x\in[a]$, then $xRa$ and $aRb$ imply $xRb$, so $x\in[b]$. Reversing the roles proves $[b]\subseteq[a]$.

Consequently, two classes are either equal or disjoint. They cannot partly overlap.

Conversely, any partition defines an equivalence relation: declare $aRb$ when they belong to the same block. Each object shares its block with itself, sharing a block is symmetric, and two successive same-block claims place all three objects in one block. This establishes a correspondence between equivalence relations and partitions.

In software, grouping records by an exact key creates equivalence classes. A “similar enough” comparison may fail transitivity; for instance, relating real numbers whose distance is at most 1 does not give an equivalence relation because 0 relates to 1 and 1 to 2, while 0 does not relate to 2.

## Partial and total orders

A **partial order** is reflexive, antisymmetric, and transitive. A set together with a partial order is called a **partially ordered set**, or poset. We often write its relation as $\preceq$ to avoid implying that it is ordinary numerical comparison.

Subset inclusion is a partial order on $\mathcal P(S)$. Every subset contains itself; if $A\subseteq B$ and $B\subseteq A$, then $A=B$; and inclusions compose transitively.

Divisibility is a partial order on the **positive integers**. Reflexivity follows from $a=a\cdot1$. If $b=ak$ and $a=b\ell$ for positive integers, then $k\ell=1$, so $k=\ell=1$ and $a=b$. Transitivity follows by multiplying the factors.

The domain restriction matters: divisibility on all integers is not antisymmetric, since $2\mid-2$ and $-2\mid2$ but $2\ne-2$.

Elements $a,b$ are **comparable** if $a\preceq b$ or $b\preceq a$. A partial order is a **total order** when every pair is comparable. Numerical $\leq$ on $\mathbb Z$ is total. Subset inclusion on $\mathcal P(\{1,2\})$ is not total because $\{1\}$ and $\{2\}$ are incomparable.

Antisymmetry guarantees agreement when comparison goes both ways. It does not guarantee that at least one direction holds.

## Hasse diagrams and extreme elements

For a finite poset, a **Hasse diagram** displays only the essential upward steps. An element $b$ **covers** $a$ when $a\prec b$ and no element lies strictly between them, where $a\prec b$ means $a\preceq b$ and $a\ne b$. Draw $b$ above $a$ and connect their covers. Omit loops and all edges already implied by a longer upward path.

Under inclusion, $\mathcal P(\{1,2\})$ has $\varnothing$ at the bottom, $\{1\}$ and $\{2\}$ above it, and $\{1,2\}$ at the top. The four cover connections form a diamond. There is no direct cover from $\varnothing$ to $\{1,2\}$ because intermediate subsets exist.

The upward edges form a directed acyclic graph: a directed cycle among distinct elements would contradict antisymmetry. Reachability, together with equality, recovers the finite partial order. For a prerequisite graph, distinguish an immediate prerequisite edge from the transitive relation “must be completed before.”

A **least element** is below every element. A **minimal element** has no strictly smaller element. Least implies minimal, but several incomparable elements can all be minimal. Under divisibility on $\{2,3,6\}$, both 2 and 3 are minimal and neither is least; 6 is the greatest element. Greatest and maximal are defined by reversing the comparisons. A least or greatest element, when it exists, is unique by antisymmetry.

## Inverses and composition of relations

For $R\subseteq A\times B$, its **inverse relation** is

$$
R^{-1}=\{(b,a):(a,b)\in R\}\subseteq B\times A.
$$

This reverses every pair. For a relation on one set, symmetry means $R=R^{-1}$.

Let $R\subseteq A\times B$ and $S\subseteq B\times C$. We use the function-style convention: **$S\circ R$ means first $R$, then $S$**. Specifically,

$$
(a,c)\in S\circ R\quad\Longleftrightarrow\quad
\exists b\in B,\ ((a,b)\in R\land(b,c)\in S).
$$

If $R=\{(1,u),(2,u),(2,v)\}$ and $S=\{(u,p),(v,q)\}$, then $S\circ R=\{(1,p),(2,p),(2,q)\}$. A pair is included once even if several intermediate objects justify it.

For a relation $R$ on $A$, transitivity is exactly $R\circ R\subseteq R$: every two-step connection already belongs to $R$. Adding all pairs connected by one or more steps produces the **transitive closure**. For a finite relation, repeatedly adding missing shortcuts eventually stops because only finitely many pairs are possible. If reachability in zero steps is included as well, also add every loop; that gives the reflexive-transitive closure.

## Building closures without losing the meaning

Different properties require different repairs. On $A=\{a,b,c\}$, start with $R=\{(a,b),(b,c)\}$.

The **reflexive closure** adds $(a,a),(b,b),(c,c)$. The **symmetric closure** adds $(b,a),(c,b)$. The **transitive closure** adds $(a,c)$. None of these names means “make every relation property true”; each is the smallest relation containing $R$ with the named property.

If we require an equivalence relation, repairs can interact. Adding reverses gives $(b,a)$ and $(c,b)$. Transitivity then requires $(a,c)$ and $(c,a)$ as well as loops, so the smallest equivalence relation containing this $R$ is all of $A\times A$. The chain connects all three objects into one equivalence class.

For a finite relation, repeatedly adding pairs required by the chosen properties stops eventually, because additions never remove a pair and at most $|A|^2$ pairs exist. This is an algorithmic justification for termination, separate from checking what the final relation means.

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

Practice with the [Relations worksheet](../worksheets/04-relations.yaml). Continue to [Functions](../lessons/05-functions.md).
