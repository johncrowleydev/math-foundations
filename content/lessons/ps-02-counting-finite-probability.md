# Counting and Finite Probability

Finite probability becomes much more useful when we can count large outcome spaces without listing every element. We will refresh product counting, ordered selections, combinations, and complements, always linking the count to the experiment that makes its outcomes equally likely. The purpose is not to memorize a menu of factorial formulas. It is to recognize what distinguishes one outcome from another and to justify every multiplication, addition, and division. Worked examples compare two legitimate representations of the same sample, while collision problems show why counting the complement can make an apparently tangled event manageable.

## Count stages and identify the sampling rule

Counting turns an equally likely finite model into a probability ratio. Before using that ratio, identify what one outcome contains. Is it an ordered list, an unordered selection, or a sequence that allows repeated values? These distinctions are mathematical properties of the experiment, not preferences about how to write an answer.

The multiplication principle counts a process assembled in stages. If the first stage has $m$ choices and every first-stage choice allows $n$ second-stage choices, there are $mn$ complete outcomes. A badge with one of four shapes and one of three colors has $12$ possibilities. The second-stage count may be constant even when its available choices depend on the first stage. For example, choosing two different people from a group of six for two named roles gives $6\cdot5$ possibilities.

When the number of continuations varies, separate cases and add their counts. Suppose a route begins at one of two gates. One gate connects to three exits and the other to five. There are $3+5=8$ routes, not $2\cdot3$ or $2\cdot5$. Addition applies to disjoint alternatives; multiplication applies to linked choices. A tree with one complete path per outcome helps expose missed cases and duplicate descriptions.

Replacement means an item becomes available again for later draws; it is not the same as ignoring order. Drawing twice with replacement from three labels gives nine ordered lists, including repeated labels. If each draw is uniform and independent, these lists are equally likely. If a selection mechanism favors some labels, the list count remains nine but the probability ratio need not apply. Counting tells us the size of an event; the model tells us whether size alone determines probability.

Related definitions: [Multiplication principle](ref:probability-statistics-multiplication-principle); [Sampling with replacement](ref:probability-statistics-replacement).

## Ordered selections and factorials

For $k$ distinct selections in order from $n$ objects, the available counts decrease: $n,n-1,\ldots,n-k+1$. Their product is written $(n)_k=n!/(n-k)!$ for integers $0\leq k\leq n$. Here $n!=n(n-1)\cdots1$, and $0!=1$. The empty selection counts as one choice, consistent with the product convention. Selecting more distinct objects than are available gives zero possibilities.

For example, assigning captain, recorder, and presenter from seven people produces $7\cdot6\cdot5=210$ assignments. The roles are distinct, so a different order is a different outcome. Arranging all seven people uses $7!$ possibilities. A condition can be enforced before multiplying: if one specified person must be captain, there are $6\cdot5=30$ assignments for the remaining roles.

Repeated symbols require a correction when identical copies cannot be distinguished. If a string contains three $A$s and two $B$s, pretending all five copies are labeled gives $5!$ arrangements, but every visible string occurs $3!2!$ times under that labeling. Hence there are $5!/(3!2!)=10$ distinct strings. More generally counts $n_1,\ldots,n_r$ totaling $n$ give $n!/(n_1!\cdots n_r!)$ arrangements.

A useful habit is to explain every factorial denominator. It removes a specific multiplicity, not a vague sense that order “does not matter.” Dividing by $k!$ is valid only when every counted object appears exactly $k!$ times. If repeated values cause some unordered records to have fewer ordered representations than others, a blanket division fails. This warning will matter when probabilities are aggregated from ordered samples.

Restrictions on adjacent objects can also be counted by changing the units being arranged. If two specified books must be adjacent among five distinct books, treat that pair as one block. The block and three other books can be ordered in $4!$ ways, and the pair has two internal orders, giving $48$ arrangements. This argument works because every qualifying arrangement has one uniquely identified block and one internal order. It illustrates the same constant-multiplicity principle used for repeated symbols, although the objects being counted are different. Always explain how a counted representation corresponds back to a real arrangement.

Related definitions: [Ordered selection](ref:probability-statistics-permutation); [Factorial](ref:probability-statistics-factorial).

## Unordered selections and combinations

An unordered selection of $k$ distinct objects is a $k$-element subset. Each such subset has exactly $k!$ ordered listings. Dividing the ordered count by that multiplicity gives $\binom nk=n!/[k!(n-k)!]$. We read this as “$n$ choose $k$.” The permitted integers satisfy $0\leq k\leq n$; outside that range the combinatorial count is zero.

Selecting three reviewers from eight candidates gives $\binom83=56$ committees. Selecting the five people who are not reviewers describes the same choice, explaining $\binom83=\binom85$. This complement correspondence proves the general symmetry $\binom nk=\binom n{n-k}$. Selecting no objects or selecting all objects each gives exactly one subset.

Conditions often split a selection across disjoint groups. Suppose five candidates are experienced and four are new. A four-person committee with exactly two experienced members can be chosen in $\binom52\binom42=60$ ways. “At least two” requires the separate possibilities two, three, and four experienced members. Add the counts of those disjoint cases; do not add incompatible group sizes inside one product.

The coefficient also counts binary strings by positions: a length-six string with two ones is determined by choosing its two one-positions, giving $\binom62=15$. This connects subset counting to the binomial theorem. In expanding $(a+b)^n$, choosing the $a$ term in exactly $k$ of the $n$ factors produces $\binom nk a^k b^{n-k}$. Taking $a=b=1$ shows that the sum of all subset-size counts is $2^n$. The algebra and the counting describe the same finite choices.

Related definitions: [Combination](ref:probability-statistics-combination); [Binomial coefficient](ref:probability-statistics-binomial-coefficient).

## Use compatible numerator and denominator counts

For a uniform selection, the event probability is the favorable count divided by the total count, provided both counts describe outcomes in the same way. An ordered numerator over an unordered denominator is a unit mismatch: it compares lists to subsets. Either representation can work, but it must be used consistently.

A bag contains three marked and four unmarked distinct tokens. Draw two uniformly without replacement. Using unordered pairs, the probability both are marked is $\binom32/\binom72=3/21=1/7$. Using ordered draws, it is $(3\cdot2)/(7\cdot6)=6/42=1/7$. Each unordered pair has exactly two ordered realizations, so both numerator and denominator receive the same factor.

For exactly one marked token, the subset method gives $\binom31\binom41/\binom72=12/21=4/7$. In the ordered method, marked-then-unmarked and unmarked-then-marked are distinct cases. Their favorable counts are $3\cdot4$ and $4\cdot3$, totaling $24$ of $42$. Missing one order would halve the result. For at least one marked token, count the complement: $1-\binom42/\binom72=1-6/21=5/7$.

These formulas describe a uniform subset sample, as produced by uniform sequential draws without replacement. They do not automatically apply to a process that selects a category first and then selects uniformly within that category. A category containing fewer objects can then give each of its objects a larger probability. Always connect the mathematical space to the stated mechanism. “Random” by itself does not specify which collection is uniform, particularly after information is discarded or categories are grouped.

Related definitions: [Uniform subset sample](ref:probability-statistics-uniform-subset-sample).

## Complements, collisions, and counting arguments

An event involving “at least one repeated value” is often easier to count through its complement. Suppose three independent uniform selections use five labels. There are $5^3=125$ ordered outcomes. The no-repeat outcomes number $5\cdot4\cdot3=60$. Hence a collision has probability $1-60/125=13/25$. A collision means some pair agrees; it does not specify a particular pair in advance.

For $k\leq n$ independent uniform labels, the general no-collision probability is $(n)_k/n^k$. For $k>n$, no collision is impossible by the pigeonhole principle. A different question asks whether anyone matches one distinguished person's label. With $k-1$ other people, the no-match count gives probability $((n-1)/n)^{k-1}$. The two events differ because others can collide with each other without matching the distinguished person.

Counting also proves identities without expanding factorials. To choose a size-$k$ subset from $n$ objects, distinguish one object and split cases according to whether it is included. Excluding it gives $\binom{n-1}k$ choices; including it leaves $k-1$ choices from the others, giving $\binom{n-1}{k-1}$. Thus Pascal's identity follows by a disjoint case split. The same reasoning justifies adding favorable counts across different category compositions.

Before accepting a count, test a small case by enumeration, check impossible and empty cases, and ask whether every outcome has exactly one description. These checks are not substitutes for a general argument, but they expose the most common errors: omitted orders, overlapping cases, or division by a multiplicity that is not constant. In probability applications, add one more check: whether the counted outcomes are truly equally likely under the experiment.

A probability calculation can be checked through two independent counts of the same event. For a uniform two-person committee from six people, inclusion of a designated person has probability $5/\binom62=1/3$. Alternatively imagine a uniform ordered selection of two distinct people: the designated person can be first in five outcomes or second in five, giving $10/(6\cdot5)=1/3$. Agreement is informative because the two calculations organize the favorable event differently. It would be less informative to write the same factorial ratio twice with only superficial rearrangement.

Related definitions: [Collision](ref:probability-statistics-collision).
