# Sets and Set Operations

A set is a collection in which membership is precise: an object either belongs or does not. Sets let us describe possible inputs, selected records, permitted states, and the objects over which a quantified claim ranges. They also provide a first setting in which a proof can be built directly from definitions.

This lesson uses [Predicates and Quantifiers](../lessons/02-predicates-and-quantifiers.md). In particular, remember that a universal claim needs reasoning about an arbitrary allowed object, whereas one counterexample disproves it.

## Elements, descriptions, and equality

We write $x\in A$ when $x$ is an **element** of the set $A$, and $x\notin A$ when it is not. Braces can list a finite set:

$$
A=\{2,4,6\}.
$$

Order and repeated entries do not change a set. Thus $\{2,4,6\}=\{6,2,4,2\}$. A set records membership, not sequence or multiplicity. A log containing the same event three times has information that a set of event types loses.

**Set-builder notation** describes membership using a condition:

$$
A=\{n\in\mathbb Z: 0<n<8\text{ and }n\text{ is even}\}.
$$

The colon means “such that.” This is the same set as the roster above. Specify the domain: $\{x\in\mathbb R:x^2=4\}=\{-2,2\}$, while allowing only positive integers gives $\{2\}$.

Two sets are equal exactly when they have the same elements:

$$
A=B\quad\Longleftrightarrow\quad
\forall x,\ (x\in A\leftrightarrow x\in B).
$$

The variables here range over an ambient collection containing both sets. Equality does not require that the descriptions of the sets look alike.

The **empty set**, $\varnothing$, has no elements. Be careful with braces: $\{\varnothing\}$ is a set with one element, that element being the empty set. Likewise, $\{0\}$ has one element and is not empty.

## Membership and subsets are different

We write $A\subseteq B$ when every element of $A$ belongs to $B$:

$$
A\subseteq B\quad\Longleftrightarrow\quad
\forall x,\ (x\in A\to x\in B).
$$

$A$ is then a **subset** of $B$. Equality is allowed. A **proper subset**, written $A\subsetneq B$, additionally requires $A\ne B$. We avoid $\subset$ because authors disagree about whether it permits equality.

For $B=\{1,2\}$, we have $1\in B$ and $\{1\}\subseteq B$. But $\{1\}\notin B$: the elements listed in $B$ are numbers, not sets. In contrast, if $C=\{\{1\},2\}$, then $\{1\}\in C$ but $1\notin C$.

Every set is a subset of itself. The empty set is a subset of every set because the implication “if $x\in\varnothing$, then $x\in B$” has a false antecedent for every $x$. This does **not** say $\varnothing\in B$; membership requires that the empty set actually be an element of $B$.

To disprove $A\subseteq B$, find an element of $A$ missing from $B$. For example, $\{2,4\}\nsubseteq\{1,2,3\}$ because $4$ belongs only to the first set.

## Union, intersection, difference, and complement

For sets $A$ and $B$:

| Operation                 | Definition by membership | Meaning            |
| ------------------------- | ------------------------ | ------------------ |
| Union $A\cup B$           | $x\in A\lor x\in B$      | In at least one    |
| Intersection $A\cap B$    | $x\in A\land x\in B$     | In both            |
| Difference $A\setminus B$ | $x\in A\land x\notin B$  | In $A$ but not $B$ |

Fix a **universe** $U$ containing the sets under discussion. The complement of $A$ relative to $U$ is

$$
A^c=U\setminus A.
$$

A complement is not meaningful without its universe. If $A=\{1,3\}$ and $U=\{1,2,3,4\}$, then $A^c=\{2,4\}$. With $U=\mathbb Z$, its complement contains every integer except 1 and 3.

For a complete finite example, let

$$
U=\{1,2,3,4,5,6\},\quad A=\{1,2,4\},\quad B=\{2,3,4\}.
$$

Then $A\cup B=\{1,2,3,4\}$, $A\cap B=\{2,4\}$, $A\setminus B=\{1\}$, $B\setminus A=\{3\}$, and $A^c=\{3,5,6\}$. Difference is directional: its two versions need not agree.

Sets are **disjoint** when $A\cap B=\varnothing$. Disjoint does not mean that their sizes differ, or merely that they are unequal. The empty set is disjoint from every set, including itself.

The **symmetric difference** $A\mathbin{\triangle}B$ contains elements in exactly one of the sets:

$$
A\mathbin{\triangle}B=(A\setminus B)\cup(B\setminus A).
$$

In the example it is $\{1,3\}$. This operation models which permissions changed when a previous permission set is replaced by a new one.

## Proving inclusions and identities

An element proof turns a set statement into logic. To prove $A\cap B\subseteq A$, let $x$ be an arbitrary element of $A\cap B$. By the definition of intersection, $x\in A$ and $x\in B$. In particular $x\in A$. Because this reasoning applies to every element of the intersection, the inclusion follows.

To prove equality, it is often convenient to prove **both inclusions**. Consider

$$
A\setminus B=A\cap B^c,
$$

with $A,B\subseteq U$. If $x\in A\setminus B$, then $x\in A$ and $x\notin B$. Since $x\in U$, it follows that $x\in B^c$, so $x\in A\cap B^c$. Conversely, if $x\in A\cap B^c$, then $x\in A$ and $x\notin B$, so $x\in A\setminus B$.

Neither direction alone establishes equality. $A\subseteq B$ can be true while $B$ contains additional elements.

Sometimes a chain of equivalences proves both directions at once. For any $x\in U$,

$$
\begin{aligned}
x\in(A\cup B)^c
&\Longleftrightarrow\neg(x\in A\lor x\in B)\\
&\Longleftrightarrow(x\notin A\land x\notin B)\\
&\Longleftrightarrow x\in A^c\cap B^c.
\end{aligned}
$$

This proves one of **De Morgan's laws**. Notice that the middle step is the logical law already studied; the other steps use set definitions.

## Laws of set operations

With all complements taken in the same universe:

| Law         | Union form                       | Intersection form                |
| ----------- | -------------------------------- | -------------------------------- |
| Commutative | $A\cup B=B\cup A$                | $A\cap B=B\cap A$                |
| Associative | $(A\cup B)\cup C=A\cup(B\cup C)$ | $(A\cap B)\cap C=A\cap(B\cap C)$ |
| Idempotent  | $A\cup A=A$                      | $A\cap A=A$                      |
| Identity    | $A\cup\varnothing=A$             | $A\cap U=A$                      |
| Absorption  | $A\cup(A\cap B)=A$               | $A\cap(A\cup B)=A$               |

Distributivity has two forms:

$$
\begin{aligned}
A\cap(B\cup C)&=(A\cap B)\cup(A\cap C),\\
A\cup(B\cap C)&=(A\cup B)\cap(A\cup C).
\end{aligned}
$$

The complement laws include $A\cup A^c=U$, $A\cap A^c=\varnothing$, $(A^c)^c=A$, and

$$
(A\cup B)^c=A^c\cap B^c,\qquad
(A\cap B)^c=A^c\cup B^c.
$$

Use these as justified transformations, not as guesses based on similar-looking symbols. For example,

$$
(A\cap B)\cup(A\cap B^c)
=A\cap(B\cup B^c)=A\cap U=A.
$$

A Venn diagram can help discover or remember these facts. An element argument establishes them without relying on a particular drawing.

## Power sets

The **power set** $\mathcal P(A)$ is the set of all subsets of $A$:

$$
\mathcal P(\{a,b\})=\{\varnothing,\{a\},\{b\},\{a,b\}\}.
$$

Thus $B\in\mathcal P(A)$ means exactly $B\subseteq A$. Every power set contains the empty set and the original set, although these coincide when $A=\varnothing$. In particular,

$$
\mathcal P(\varnothing)=\{\varnothing\}.
$$

If a finite set $A$ has $n$ elements, then $\mathcal P(A)$ has $2^n$ elements. A subset makes one independent include-or-exclude choice for each element. These $n$ binary choices give $2\cdot2\cdots2=2^n$ possibilities. For $n=0$, there is one possible collection of choices: choosing nothing, which produces the empty subset.

A bit mask with one bit per feature therefore represents a subset of the features. It represents membership, not an ordering of selected features.

## Ordered pairs and Cartesian products

An **ordered pair** $(a,b)$ records two positions. We have $(a,b)=(c,d)$ exactly when $a=c$ and $b=d$. Unlike sets, pairs generally change when their order is reversed.

The **Cartesian product** is

$$
A\times B=\{(a,b):a\in A\text{ and }b\in B\}.
$$

If $A=\{0,1\}$ and $B=\{u,v\}$, the product is $\{(0,u),(0,v),(1,u),(1,v)\}$. For finite sets, $|A\times B|=|A||B|$: each first coordinate can be paired with each second coordinate. Here $|A|$ denotes the number of elements, or **cardinality**, of a finite set.

If either factor is empty, the product is empty because no complete pair can be formed. In general $A\times B\ne B\times A$, even though finite products have the same cardinality. Equal size does not imply equal elements.

Products model combinations such as a user and a resource. In the next lesson, a relation will select some pairs from such a product.

## Counting unions without double-counting

For finite sets,

$$
|A\cup B|=|A|+|B|-|A\cap B|.
$$

Adding the individual sizes counts an element in both sets twice; subtracting the intersection leaves it counted once. If 24 students use Python, 18 use JavaScript, and 10 use both, then 32 use at least one. It does not follow that there are 32 students in the class: some may use neither.

For three finite sets, **inclusion-exclusion** gives

$$
\begin{aligned}
|A\cup B\cup C|={}&|A|+|B|+|C|\\
&-|A\cap B|-|A\cap C|-|B\cap C|\\
&+|A\cap B\cap C|.
\end{aligned}
$$

An element in all three sets is counted three times, removed three times, and added back once. An element in exactly two sets is counted twice and removed once. Pairwise intersections include the elements in the triple intersection; they do not mean “exactly these two.”

For example, suppose the three sizes are 20, 16, and 12; the pairwise intersection sizes are 8, 5, and 4; and the triple intersection size is 2. Their union has $20+16+12-8-5-4+2=33$ elements. These formulas concern finite cardinalities; do not subtract infinite quantities as though they were ordinary integers.

## Partitions and indexed families

A **partition** of a set $A$ is a collection of nonempty, pairwise disjoint subsets whose union is $A$. The subsets are its **blocks**. Each element of $A$ belongs to exactly one block.

For $A=\{1,2,3,4,5\}$, the blocks $\{1,3,5\}$ and $\{2,4\}$ form a partition. Adding an empty block violates nonemptiness; placing 3 in both blocks violates disjointness; omitting 5 violates coverage. Under this definition, the empty collection of blocks partitions the empty set.

More generally, a family $(A_i)_{i\in I}$ assigns a set to each index in an index set $I$. The notation $\bigcup_{i\in I}A_i$ means that an element belongs to at least one indexed set; $\bigcap_{i\in I}A_i$ means it belongs to all of them. For an empty index set, the union is empty. If a universe $U$ has been fixed and all $A_i\subseteq U$, the empty intersection is $U$: every element satisfies the condition of belonging to every one of zero sets.

Partitions connect directly to equivalence relations, which organize objects according to whether they are considered the same for a particular purpose.

## A worked access-policy example

Let $U$ be the set of all users, $E$ the employees, $T$ the users who completed training, and $S$ the suspended users. Suppose a policy permits access exactly to trained employees who are not suspended. Its allowed set is

$$
P=(E\cap T)\setminus S=E\cap T\cap S^c.
$$

The denied set, relative to all users, is

$$
P^c=E^c\cup T^c\cup S.
$$

This follows by applying De Morgan's law to the three-way intersection. A user is denied if they fail even one requirement: they are not an employee, have not completed training, or are suspended.

Now suppose an exception set $X$ may bypass training but never suspension, and only employees can receive access. The revised policy is $E\cap(T\cup X)\cap S^c$. It is different from $(E\cap T\cap S^c)\cup X$, which would grant access to suspended or nonemployee users in $X$. Parentheses encode the actual exception's scope.

To prove the revised policy still excludes suspended users, choose an arbitrary allowed user $u$. Membership gives $u\in S^c$, hence $u\notin S$. To disprove that guarantee for the second expression, take one user in $X\cap S$. This small example illustrates how set expressions, quantified reasoning, and a precise counterexample work together.

## Readiness check

Before continuing, you should be able to:

- Distinguish $x\in A$, $B\subseteq A$, and $B\in\mathcal P(A)$.
- Compute set operations with an explicit complement universe.
- Prove a subset claim and prove equality by two inclusions.
- Explain a set identity using propositional logic.
- List a small power set and Cartesian product, including empty cases.
- Apply inclusion-exclusion without confusing pairwise and exact-two overlaps.
- Test all three requirements for a partition.

Practice with the [Sets and Set Operations worksheet](../worksheets/03-sets-and-set-operations.yaml). Then continue to [Relations](../lessons/04-relations.md).
