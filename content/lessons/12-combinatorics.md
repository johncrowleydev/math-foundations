# Combinatorics

Combinatorics studies finite choices: how many outcomes are possible, which restrictions matter, and why a counting formula counts each intended outcome exactly once. Its applications include selecting committees, designing test cases, analyzing algorithms, and estimating how many inputs a program must handle.

This lesson builds on [Sets](../lessons/03-sets-and-set-operations.md), [Functions](../lessons/05-functions.md), and [Mathematical Induction](../lessons/10-mathematical-induction.md). Before calculating, describe one outcome precisely. Are positions labeled? Can objects repeat? Does order matter? Two problems with the same numbers can have different answers because their outcomes differ.

## The sum and product principles

The **sum principle** says that if a finite set of outcomes is split into disjoint categories with sizes $a_1,\ldots,a_k$, the total number is

$$
a_1+\cdots+a_k.
$$

Disjointness matters: an outcome must not appear in two categories. If a menu offers 4 distinct soups and 6 distinct sandwiches, choosing exactly one item gives $4+6=10$ choices. Choosing one soup and one sandwich describes a different experiment.

The **product principle** counts a sequence of decisions. If there are $a_1$ choices for the first decision and, after each first choice, exactly $a_2$ choices for the second, and so on, the total is

$$
a_1a_2\cdots a_k.
$$

Thus one soup and one sandwich can be chosen in $4\cdot6=24$ ways. The available second choices need not be identical for every first choice; their number must be the same for this simple product formula.

For example, a two-letter string using distinct letters from an alphabet of size 5 has $5\cdot4=20$ possibilities. Which four letters remain depends on the first letter, but there are always four.

When branch sizes differ, partition first. Suppose a route can begin with road A or road B. A has 3 permitted continuations and B has 5. There are $3+5=8$ complete routes, not $2\cdot3$ or $2\cdot5$. A small decision tree often reveals the correct calculation.

## Complementary counting

If $U$ is a finite universe of outcomes and $A$ is the desired subset, then

$$
|A|=|U|-|U\setminus A|.
$$

Count the unwanted outcomes when they have a simpler description.

**Worked example: a required symbol.** How many length-6 binary strings contain at least one 1? Every position has two choices, so there are $2^6=64$ strings altogether. Exactly one, `000000`, has no 1. The answer is $64-1=63$.

**Worked example: at least one repeated digit.** There are $10^4$ length-4 digit strings when leading zero is allowed. Strings with no repetition number $10\cdot9\cdot8\cdot7$. Therefore strings with a repeated digit number

$$
10^4-10\cdot9\cdot8\cdot7=4960.
$$

This is about strings, not four-digit positive integers. For integers, the first position cannot be zero, and the counting model must change.

## Ordered selections and permutations

For $n\geq1$, define the factorial

$$
n!=n(n-1)\cdots2\cdot1,
\qquad 0!=1.
$$

The value $0!=1$ reflects that there is exactly one arrangement of no objects: the empty arrangement.

An ordered selection of $r$ distinct objects from $n$ distinct available objects, where $0\leq r\leq n$, has

$$
P(n,r)=n(n-1)\cdots(n-r+1)=\frac{n!}{(n-r)!}
$$

possibilities. The full arrangements, or **permutations**, of $n$ distinct objects number $n!$.

Assigning president, secretary, and treasurer to three different people from a group of 8 gives $8\cdot7\cdot6=336$ assignments. The offices distinguish positions, so exchanging two people changes the outcome.

With repetition allowed, an ordered length-$r$ selection from $n$ symbols instead has $n^r$ possibilities. A five-character code over a 26-letter alphabet has $26^5$ possibilities if letters may repeat. A code without repeated letters has $26\cdot25\cdot24\cdot23\cdot22$ possibilities. State the repetition rule before selecting the formula.

## Unordered selections and combinations

A **combination** is a subset of a specified size. Let $\binom nr$ denote the number of $r$-element subsets of an $n$-element set. For $0\leq r\leq n$,

$$
\binom nr=\frac{n!}{r!(n-r)!}.
$$

Why divide by $r!$? First count ordered selections, giving $P(n,r)$. Each particular $r$-element subset appears in exactly $r!$ orders. Dividing removes that uniform overcount.

Choosing three committee members from 8 people therefore gives

$$
\binom83=\frac{8\cdot7\cdot6}{3\cdot2\cdot1}=56.
$$

There are fewer committees than assignments to three named offices because committees do not record which person was selected first.

Choosing the selected $r$ objects is equivalent to choosing the $n-r$ excluded objects. This bijection proves

$$
\binom nr=\binom n{n-r}.
$$

For $1\leq r\leq n-1$, fix one particular object. An $r$-element subset either contains it or does not. Those disjoint cases prove **Pascal's identity**:

$$
\binom nr=\binom{n-1}{r-1}+\binom{n-1}r.
$$

These are counting proofs: the two expressions describe the same outcomes from different perspectives.

## Combining restrictions

**Worked example: a mixed committee.** Choose a four-person committee from disjoint groups of 6 engineers and 5 designers, with exactly two from each group. Choose the engineers in $\binom62$ ways and the designers in $\binom52$ ways. Each pair of selections produces one committee, so the result is

$$
\binom62\binom52=15\cdot10=150.
$$

For at least one designer, complementary counting gives

$$
\binom{11}4-\binom64=330-15=315.
$$

Alternatively, add the disjoint cases with one, two, three, or four designers:

$$
\binom51\binom63+\binom52\binom62
+\binom53\binom61+\binom54\binom60=315.
$$

The sum and complement methods agree because they partition the same set of committees. Do not multiply all four cases together: a committee belongs to exactly one of them.

## Repeated objects and circular arrangements

If $n$ positions contain indistinguishable objects of several types, with multiplicities $n_1,\ldots,n_k$ summing to $n$, the number of distinct arrangements is

$$
\frac{n!}{n_1!\cdots n_k!}.
$$

To justify this, temporarily label objects of each type. There are $n!$ labeled arrangements. Erasing labels maps exactly $n_1!\cdots n_k!$ labeled arrangements to each visible arrangement.

For the letters in `BANANA`, there are 6 positions, three identical A's, two identical N's, and one B. Hence the number is

$$
\frac{6!}{3!2!1!}=60.
$$

Circular arrangements require a different equivalence rule. Suppose $n\geq2$ distinct people sit around an unnumbered round table, rotations count as the same arrangement, and reflections count as different. Fix one particular person's position as an anchor. Reading clockwise from that person gives an ordering of the other $n-1$ people, so there are $(n-1)!$ arrangements.

If seats are numbered, rotations generally change the seating and the answer is $n!$. If mirror images also count as the same, that is another problem; one must examine the symmetry assumptions rather than automatically reusing the round-table formula.

## Repetition without order: distributing identical objects

How many ways can $r$ identical tokens be placed into $n\geq1$ labeled boxes, allowing empty boxes? An outcome is a solution in nonnegative integers to

$$
x_1+\cdots+x_n=r.
$$

Represent the tokens by $r$ stars and separate boxes by $n-1$ bars. For instance, `**| |***` represents $(2,0,3)$ after ignoring the displayed spacing. Each arrangement of stars and bars corresponds to exactly one allocation. Choose the bar positions among $r+n-1$ positions:

$$
\binom{r+n-1}{n-1}.
$$

Thus 7 identical tokens distributed among three labeled boxes give $\binom92=36$ allocations. If every box must be nonempty, first place one token in each box. When $r\geq n$, distributing the remaining $r-n$ tokens gives $\binom{r-1}{n-1}$ possibilities; when $r<n$, there are none.

This method does not count allocations of distinguishable tokens. For those, each of $r$ labeled tokens independently chooses one of $n$ boxes, giving $n^r$ allocations when there are no restrictions.

## The binomial theorem

For every integer $n\geq0$,

$$
(a+b)^n=\sum_{k=0}^n\binom nk a^{n-k}b^k.
$$

To expand the product of $n$ copies of $(a+b)$, choose one term from each factor. A term containing exactly $k$ copies of $b$ arises by choosing the $k$ factors supplying $b$, which can be done in $\binom nk$ ways. The other factors supply $a$. This proves the coefficient formula.

For example, the coefficient of $x^3$ in $(2+x)^5$ is

$$
\binom53 2^2=40.
$$

Setting $a=b=1$ proves $\sum_{k=0}^n\binom nk=2^n$. Combinatorially, the left side groups all subsets by size, while the right side decides independently whether each element belongs to a subset.

## Inclusion-exclusion

For two finite sets,

$$
|A\cup B|=|A|+|B|-|A\cap B|.
$$

An element in the intersection was counted twice in the sum, so subtract one copy. An element in only one set was already counted correctly.

For three finite sets,

$$
\begin{aligned}
|A\cup B\cup C|={}&|A|+|B|+|C|\\
&-|A\cap B|-|A\cap C|-|B\cap C|\\
&+|A\cap B\cap C|.
\end{aligned}
$$

An element in all three sets is initially counted three times and then subtracted three times, so it must be added once. Checking membership in zero, one, two, or three sets proves the formula.

**Worked example: divisibility.** Among the integers 1 through 100 inclusive, 50 are divisible by 2 and 33 by 3. Exactly 16 are divisible by both, since their common multiples are multiples of 6. Therefore $50+33-16=67$ are divisible by 2 or 3, and $100-67=33$ are divisible by neither.

## The pigeonhole principle

If more than $k$ objects are placed into $k\geq1$ boxes, some box contains at least two objects. If every box contained at most one, there would be at most $k$ objects, contradicting the assumption.

The generalized form says that placing $N\geq0$ objects into $k\geq1$ boxes forces some box to contain at least

$$
\left\lceil\frac Nk\right\rceil
$$

objects. Here $\lceil x\rceil$ is the smallest integer at least $x$. For $N>0$, if every box contained at most $\lceil N/k\rceil-1$ objects, the total would be at most $k(\lceil N/k\rceil-1)<N$, a contradiction. For $N=0$, every box has the required zero objects.

Among 25 people, at least 3 share a birth month, because $\lceil25/12\rceil=3$. This asserts existence; it does not identify the month.

**Worked example: equal remainders.** Among any 6 integers, two have the same remainder on division by 5. There are only five remainders, $0,1,2,3,4$. If the two integers are $5q+r$ and $5s+r$, their difference is $5(q-s)$, a multiple of 5.

A hash function mapping more than $m$ distinct inputs into $m$ hash values must have a collision. This follows from the same principle, regardless of how cleverly the function is implemented. It does not say that every pair collides or give a probability of collision.

## A complete counting solution

Consider a length-5 code using the ten digits. Leading zero is allowed, digits may repeat, and the code must contain exactly two zeros and at least one 7. A direct position-by-position product is awkward because the permitted choices depend on how many required symbols have appeared.

First choose the two positions containing zero: $\binom52$ choices. The remaining three positions must use nonzero digits, and at least one must be 7. They have $9^3$ unrestricted nonzero fillings. Exactly $8^3$ avoid 7, so the desired count is

$$
\binom52(9^3-8^3)=10(729-512)=2170.
$$

Why is there no extra division? Each finished code identifies exactly one pair of zero positions and exactly one ordered filling of the other positions. Why does the complement use eight symbols? Zero was already excluded from those positions, and now 7 is excluded as well. Counting from ten symbols at that stage would allow additional zeros and violate "exactly two."

A different problem might require five distinct digits with exactly two even digits. With leading zero still allowed, choose two of the five even digits and three of the five odd digits, then arrange the five selected digits:

$$
\binom52\binom53 5!=12{,}000.
$$

The order is introduced only after the two subsets are selected. If leading zero were forbidden, some of these arrangements would need to be excluded. This is why a reliable solution keeps the model visible throughout the calculation.

## Counting the same set in two ways

A **double-counting proof** defines one finite collection of objects and counts it by two methods. Equality follows because the collection is unchanged.

For example, for $n\geq1$, count pairs $(S,x)$ where $S$ is a subset of an $n$-element set and $x\in S$ is a distinguished member. If $|S|=r$, there are $\binom nr$ ways to choose $S$ and then $r$ ways to choose $x$. Summing over sizes gives

$$
\sum_{r=1}^n r\binom nr.
$$

Alternatively, choose $x$ first in $n$ ways. Every one of the remaining $n-1$ elements may independently be included or excluded from $S$, giving $2^{n-1}$ choices. Therefore

$$
\sum_{r=1}^n r\binom nr=n2^{n-1}.
$$

The distinguished member is part of the counted object. A subset with three elements appears in three different pairs, and a subset with five appears in five. That variation is intended and explains the factor $r$ in the sum.

This method also clarifies when division is legitimate. To divide one count by a number $d$, show that each desired outcome has exactly $d$ representations. If representation counts vary, one fixed divisor generally cannot correct the overcount.

## Choosing a model before a formula

For an $n$-element set, binary membership choices show that there are $2^n$ subsets. For functions from an $r$-element labeled domain to an $n$-element codomain, each input chooses one output, giving $n^r$ functions. Restricting to injective functions gives $P(n,r)$ when $r\leq n$, and zero when $r>n$.

These counts explain why exhaustive testing can grow quickly. Testing every assignment to 20 Boolean inputs requires $2^{20}=1{,}048{,}576$ cases. Counting possibilities is not yet a time estimate: the cost of processing each case also matters.

Common errors include using the sum principle on overlapping categories, treating an unordered committee as an ordered list, ignoring leading-zero rules, and dividing by a symmetry factor without showing that every outcome is counted equally often. A reliable solution names the outcomes, explains the choices, and justifies every multiplication, addition, and division.

## Readiness check

Before continuing, check that you can:

- Distinguish ordered choices, subsets, and allocations of identical objects.
- Derive a permutation or combination count from the product principle.
- State the repetition, labeling, and symmetry assumptions in a problem.
- Use a complement or disjoint cases to handle a restriction.
- Explain the binomial theorem and inclusion-exclusion by counting occurrences.
- Identify the objects and boxes in a pigeonhole argument and prove the forced bound.

The [Combinatorics worksheet](../worksheets/12-combinatorics.yaml) develops these skills through counting models, calculation, and short proofs.
