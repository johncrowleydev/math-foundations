import { r, lesson, section, citation, termEntry, q, exact, truth, quick } from './helpers.mjs';
const rep = citation(
  'pn-2-1-1',
  'pishro-nik',
  '§2.1.1 Ordered Sampling with Replacement',
  'https://www.probabilitycourse.com/chapter2/2_1_1_ordered_with_replacement.php',
  'Product counting and ordered repeated choices.',
);
const perm = citation(
  'pn-2-1-2',
  'pishro-nik',
  '§2.1.2 Ordered Sampling without Replacement',
  'https://www.probabilitycourse.com/chapter2/2_1_2_ordered_without_replacement.php',
  'Permutations, factorials, and collision probabilities by complements.',
);
const comb = citation(
  'pn-2-1-3',
  'pishro-nik',
  '§2.1.3 Unordered Sampling without Replacement',
  'https://www.probabilitycourse.com/chapter2/2_1_3_unordered_without_replacement.php',
  'Combinations, binary arrangements, multinomial counting, and counting identities.',
);
const a = section(
  'Count stages and identify the sampling rule',
  r`Counting turns an equally likely finite model into a probability ratio. Before using that ratio, identify what one outcome contains. Is it an ordered list, an unordered selection, or a sequence that allows repeated values? These distinctions are mathematical properties of the experiment, not preferences about how to write an answer.

The multiplication principle counts a process assembled in stages. If the first stage has $m$ choices and every first-stage choice allows $n$ second-stage choices, there are $mn$ complete outcomes. A badge with one of four shapes and one of three colors has $12$ possibilities. The second-stage count may be constant even when its available choices depend on the first stage. For example, choosing two different people from a group of six for two named roles gives $6\cdot5$ possibilities.

When the number of continuations varies, separate cases and add their counts. Suppose a route begins at one of two gates. One gate connects to three exits and the other to five. There are $3+5=8$ routes, not $2\cdot3$ or $2\cdot5$. Addition applies to disjoint alternatives; multiplication applies to linked choices. A tree with one complete path per outcome helps expose missed cases and duplicate descriptions.

Replacement means an item becomes available again for later draws; it is not the same as ignoring order. Drawing twice with replacement from three labels gives nine ordered lists, including repeated labels. If each draw is uniform and independent, these lists are equally likely. If a selection mechanism favors some labels, the list count remains nine but the probability ratio need not apply. Counting tells us the size of an event; the model tells us whether size alone determines probability.`,
  [rep, perm],
  [
    termEntry(
      'multiplication-principle',
      'Multiplication principle',
      'Count successive choices by multiplying their counts.',
      r`With $n_i$ choices at stage $i$ for each prior history, the number of complete outcomes is $\prod_i n_i$.`,
      r`Four shapes and three colors give $12$ badges.`,
      'Varying branch counts must be handled separately.',
    ),
    termEntry(
      'replacement',
      'Sampling with replacement',
      'Selected items remain available for later draws.',
      r`After selection the item returns to the pool, so repetition is possible.`,
      r`Two draws from three labels have $3^2$ ordered outcomes.`,
      'Replacement alone does not imply uniform or independent draws.',
    ),
  ],
);
a.questions = [
  q(
    r`A label has one of $5$ colors and one of $4$ shapes. Count labels.`,
    r`The two choices combine freely, giving $5\cdot4=20$ labels.`,
    exact('20'),
  ),
  q(
    r`A route uses one of $3$ entrances, then one of $2$ lifts, then one of $4$ exits. Count routes.`,
    r`Each stage has a fixed number of choices, so the count is $3\cdot2\cdot4=24$.`,
    exact('24'),
  ),
  q(
    r`A menu offers either $4$ soups or $3$ salads as one starter. Count starter choices.`,
    r`The alternatives are disjoint, so add: $4+3=7$.`,
    exact('7'),
  ),
  q(
    r`One gateway allows $2$ destinations and another allows $5$. Count gateway-destination routes.`,
    r`Separate the two gateway cases: $2+5=7$ routes.`,
    exact('7'),
  ),
  q(
    r`Draw three ordered labels with replacement from four labels. Count outcomes.`,
    r`There are four possibilities at each draw, so the count is $4^3=64$.`,
    exact('64'),
  ),
  q(
    r`Two independent uniform draws use labels $1,2,3,4$. Find the probability both labels are even.`,
    r`There are $4^2=16$ ordered outcomes and $2^2=4$ favorable ones, giving $4/16=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A four-position binary string starts with $1$. Count possible strings.`,
    r`The first position is fixed and the remaining three each have two choices, giving $2^3=8$.`,
    exact('8'),
  ),
  q(
    r`True or false: a process with $4$ possibilities always assigns each probability $1/4$.`,
    r`False. Equal likelihood is an additional property of the probability model, not a consequence of the count.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why counting two named roles differs from counting an unordered two-person committee.`,
    r`Swapping the two people changes who holds each named role, so it changes a role assignment. Swapping the written order of committee members leaves the committee unchanged.`,
  ),
  q(
    r`A code uses two letters from $\{A,B,C\}$ followed by one digit from $\{0,1,2,3\}$; repetitions are allowed. Count codes.`,
    r`Multiply the position choices: $3\cdot3\cdot4=36$.`,
    exact('36'),
  ),
];
a.review = [
  q(
    r`A uniform four-symbol alphabet generates a two-position string. Find the probability its first symbol is a specified symbol.`,
    r`Four of the $16$ strings have that first symbol, so the probability is $1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A route starts on a red line with $4$ exits or a blue line with $6$ exits. Count routes.`,
    r`The two starting-line cases are distinct, giving $4+6=10$ routes.`,
    exact('10'),
  ),
  q(
    r`Explain why multiplying $3\cdot3$ is wrong for two ordered draws without replacement from three distinct objects.`,
    r`After the first draw only two objects remain, so there are $3\cdot2=6$ outcomes. The product $3\cdot3$ includes prohibited repetitions.`,
  ),
];
const b = section(
  'Ordered selections and factorials',
  r`For $k$ distinct selections in order from $n$ objects, the available counts decrease: $n,n-1,\ldots,n-k+1$. Their product is written $(n)_k=n!/(n-k)!$ for integers $0\leq k\leq n$. Here $n!=n(n-1)\cdots1$, and $0!=1$. The empty selection counts as one choice, consistent with the product convention. Selecting more distinct objects than are available gives zero possibilities.

For example, assigning captain, recorder, and presenter from seven people produces $7\cdot6\cdot5=210$ assignments. The roles are distinct, so a different order is a different outcome. Arranging all seven people uses $7!$ possibilities. A condition can be enforced before multiplying: if one specified person must be captain, there are $6\cdot5=30$ assignments for the remaining roles.

Repeated symbols require a correction when identical copies cannot be distinguished. If a string contains three $A$s and two $B$s, pretending all five copies are labeled gives $5!$ arrangements, but every visible string occurs $3!2!$ times under that labeling. Hence there are $5!/(3!2!)=10$ distinct strings. More generally counts $n_1,\ldots,n_r$ totaling $n$ give $n!/(n_1!\cdots n_r!)$ arrangements.

A useful habit is to explain every factorial denominator. It removes a specific multiplicity, not a vague sense that order “does not matter.” Dividing by $k!$ is valid only when every counted object appears exactly $k!$ times. If repeated values cause some unordered records to have fewer ordered representations than others, a blanket division fails. This warning will matter when probabilities are aggregated from ordered samples.`,
  [perm, comb],
  [
    termEntry(
      'permutation',
      'Ordered selection',
      'A list of distinct selected objects.',
      r`The count of length-$k$ ordered selections is $(n)_k=n!/(n-k)!$.`,
      r`Three named roles among seven people give $210$ assignments.`,
      'Named roles retain order; a committee does not.',
    ),
    termEntry(
      'factorial',
      'Factorial',
      'The product of the positive integers through $n$.',
      r`$n!=n(n-1)\cdots1$, with $0!=1$.`,
      r`$4!=24$.`,
      'Factorials count arrangements of distinct labeled objects before any symmetry correction.',
    ),
  ],
);
b.questions = [
  q(
    r`Assign two named roles to distinct people from $8$ candidates. Count assignments.`,
    r`There are $8$ choices then $7$, so $8\cdot7=56$.`,
    exact('56'),
  ),
  q(
    r`Count ordered lists of length $3$ without repetition from $5$ labels.`,
    r`The count is $5\cdot4\cdot3=60$.`,
    exact('60'),
  ),
  q(
    r`Count arrangements of six distinct books on a shelf.`,
    r`All six positions are ordered, giving $6!=720$.`,
    exact('720'),
  ),
  q(
    r`Six distinct books are arranged with a specified book first. Count arrangements.`,
    r`The first position is fixed, leaving $5!=120$ arrangements.`,
    exact('120'),
  ),
  q(
    r`Count distinct strings containing two $A$s and three $B$s.`,
    r`Permuting labeled copies overcounts by $2!3!$, so the count is $5!/(2!3!)=10$.`,
    exact('10'),
  ),
  q(
    r`Count distinct strings containing two $A$s, two $B$s, and one $C$.`,
    r`Divide labeled arrangements by the permutations of identical copies: $5!/(2!2!1!)=30$.`,
    exact('30'),
  ),
  q(
    r`Three named roles are assigned uniformly among distinct people from $6$. Find the probability a specified person gets the first role.`,
    r`There are $6\cdot5\cdot4=120$ assignments; fixing that person first leaves $5\cdot4=20$. The ratio is $1/6$.`,
    exact('1/6'),
  ),
  q(
    r`How many ordered selections of four distinct objects can be made from three objects?`,
    r`There are insufficient distinct objects, so the count is $0$.`,
    exact('0'),
  ),
  q(
    r`Explain why $0!=1$ is compatible with counting arrangements.`,
    r`There is exactly one arrangement of no objects: the empty arrangement. This also makes $n!/(n-0)!=1$ count the unique empty ordered selection.`,
  ),
  q(
    r`Count arrangements of five distinct people if two specified people must occupy the first two positions, in either order.`,
    r`Order the specified pair in $2!$ ways and the others in $3!$ ways, giving $2\cdot6=12$.`,
    exact('12'),
  ),
];
b.review = [
  q(
    r`Count distinct strings with three $X$s, one $Y$, and two $Z$s.`,
    r`The count is $6!/(3!1!2!)=60$.`,
    exact('60'),
  ),
  q(
    r`Assign president, deputy, and treasurer from nine people without repeated officeholders. Count assignments.`,
    r`The decreasing choices give $9\cdot8\cdot7=504$.`,
    exact('504'),
  ),
  q(
    r`Why does dividing $n!$ by $2!$ correctly count arrangements of $n$ symbols when exactly two copies are identical and every other symbol is distinct?`,
    r`Each visible arrangement has exactly two labelings of the identical pair. Dividing by this constant multiplicity counts each visible arrangement once.`,
  ),
];
b.quickCheck = quick(
  r`Which count describes choosing a chair and a secretary from six people, with different people in the roles?`,
  [r`$6^2$`, r`$6\cdot5$`, r`$\binom62$`],
  1,
  r`The roles are distinct and the second person must differ from the first.`,
  [
    r`The count $6^2$ includes six assignments in which one person holds both roles.`,
    r`Six chair choices each leave five secretary choices, producing $30$ assignments.`,
    r`A committee count merges the two role assignments for each pair of people.`,
  ],
);
const c = section(
  'Unordered selections and combinations',
  r`An unordered selection of $k$ distinct objects is a $k$-element subset. Each such subset has exactly $k!$ ordered listings. Dividing the ordered count by that multiplicity gives $\binom nk=n!/[k!(n-k)!]$. We read this as “$n$ choose $k$.” The permitted integers satisfy $0\leq k\leq n$; outside that range the combinatorial count is zero.

Selecting three reviewers from eight candidates gives $\binom83=56$ committees. Selecting the five people who are not reviewers describes the same choice, explaining $\binom83=\binom85$. This complement correspondence proves the general symmetry $\binom nk=\binom n{n-k}$. Selecting no objects or selecting all objects each gives exactly one subset.

Conditions often split a selection across disjoint groups. Suppose five candidates are experienced and four are new. A four-person committee with exactly two experienced members can be chosen in $\binom52\binom42=60$ ways. “At least two” requires the separate possibilities two, three, and four experienced members. Add the counts of those disjoint cases; do not add incompatible group sizes inside one product.

The coefficient also counts binary strings by positions: a length-six string with two ones is determined by choosing its two one-positions, giving $\binom62=15$. This connects subset counting to the binomial theorem. In expanding $(a+b)^n$, choosing the $a$ term in exactly $k$ of the $n$ factors produces $\binom nk a^k b^{n-k}$. Taking $a=b=1$ shows that the sum of all subset-size counts is $2^n$. The algebra and the counting describe the same finite choices.`,
  [comb],
  [
    termEntry(
      'combination',
      'Combination',
      'An unordered selection of distinct objects.',
      r`There are $\binom nk=n!/[k!(n-k)!]$ subsets of size $k$ from $n$ objects.`,
      r`$\binom83=56$.`,
      'A combination does not distinguish role assignments among the selected objects.',
    ),
    termEntry(
      'binomial-coefficient',
      'Binomial coefficient',
      'A subset count and expansion coefficient.',
      r`$\binom nk$ counts choices of $k$ positions and multiplies $a^kb^{n-k}$ in $(a+b)^n$.`,
      r`$\binom62=15$ counts six-bit strings with two ones.`,
      'It counts arrangements of success positions, not their probabilities.',
    ),
  ],
);
c.questions = [
  q(
    r`Count three-person committees from $7$ people.`,
    r`A committee ignores order, so the count is $\binom73=35$.`,
    exact('35'),
  ),
  q(
    r`Count two-element subsets of a six-element set.`,
    r`The count is $\binom62=6\cdot5/2=15$.`,
    exact('15'),
  ),
  q(
    r`Count length-seven binary strings with exactly three ones.`,
    r`Choose the three one-positions: $\binom73=35$.`,
    exact('35'),
  ),
  q(
    r`A group has $4$ experienced and $5$ new members. Count committees with two of each.`,
    r`Choose each category separately: $\binom42\binom52=6\cdot10=60$.`,
    exact('60'),
  ),
  q(
    r`A group contains four experienced and five new members. Count three-person committees with exactly one experienced member.`,
    r`Choose one of four experienced and two of five new members: $4\binom52=40$.`,
    exact('40'),
  ),
  q(
    r`How many subsets of a five-element set are nonempty?`,
    r`There are $2^5=32$ subsets in total; remove the empty subset to obtain $31$.`,
    exact('31'),
  ),
  q(
    r`Evaluate $\binom90+\binom99$.`,
    r`Each coefficient equals one, so their sum is $2$.`,
    exact('2'),
  ),
  q(
    r`Find the coefficient of $a^2b^4$ in $(a+b)^6$.`,
    r`Choose which two factors contribute $a$: $\binom62=15$.`,
    exact('15'),
  ),
  q(
    r`Give a counting proof of $\binom nk=\binom n{n-k}$.`,
    r`Taking complements is a bijection between $k$-element subsets and $(n-k)$-element subsets of the same $n$-element set. Therefore their counts are equal.`,
    undefined,
    'prove',
  ),
  q(
    r`Explain why selecting two people from a five-person group and then naming one chair gives $2\binom52$ possibilities.`,
    r`There are $\binom52=10$ pairs, and each pair admits two choices of chair. Thus the count is $20$, agreeing with $5\cdot4$ ordered role assignments.`,
  ),
];
c.review = [
  q(
    r`Count eight-position binary strings with exactly six zeros.`,
    r`Choose the six zero-positions, giving $\binom86=28$.`,
    exact('28'),
  ),
  q(
    r`Choose three members from a group of six experts and four novices, requiring exactly two experts. Count committees.`,
    r`The count is $\binom62\binom41=15\cdot4=60$.`,
    exact('60'),
  ),
  q(
    r`Evaluate $\sum_{k=0}^6\binom6k$ by a counting argument.`,
    r`The sum counts every subset of a six-element set once, grouped by size. Each element is included or excluded, so the result is $2^6=64$.`,
    exact('64'),
  ),
];
const d = section(
  'Use compatible numerator and denominator counts',
  r`For a uniform selection, the event probability is the favorable count divided by the total count, provided both counts describe outcomes in the same way. An ordered numerator over an unordered denominator is a unit mismatch: it compares lists to subsets. Either representation can work, but it must be used consistently.

A bag contains three marked and four unmarked distinct tokens. Draw two uniformly without replacement. Using unordered pairs, the probability both are marked is $\binom32/\binom72=3/21=1/7$. Using ordered draws, it is $(3\cdot2)/(7\cdot6)=6/42=1/7$. Each unordered pair has exactly two ordered realizations, so both numerator and denominator receive the same factor.

For exactly one marked token, the subset method gives $\binom31\binom41/\binom72=12/21=4/7$. In the ordered method, marked-then-unmarked and unmarked-then-marked are distinct cases. Their favorable counts are $3\cdot4$ and $4\cdot3$, totaling $24$ of $42$. Missing one order would halve the result. For at least one marked token, count the complement: $1-\binom42/\binom72=1-6/21=5/7$.

These formulas describe a uniform subset sample, as produced by uniform sequential draws without replacement. They do not automatically apply to a process that selects a category first and then selects uniformly within that category. A category containing fewer objects can then give each of its objects a larger probability. Always connect the mathematical space to the stated mechanism. “Random” by itself does not specify which collection is uniform, particularly after information is discarded or categories are grouped.`,
  [perm, comb],
  [
    termEntry(
      'uniform-subset-sample',
      'Uniform subset sample',
      'Every subset of the specified size has the same probability.',
      r`A size-$k$ sample from $n$ objects assigns probability $1/\binom nk$ to each subset.`,
      r`A pair from seven tokens has $21$ equally likely possibilities.`,
      'Uniform categories need not produce uniform objects.',
    ),
  ],
);
d.questions = [
  q(
    r`A bag contains $4$ marked and $6$ unmarked distinct tokens. Select two uniformly without replacement. Find the probability both are marked.`,
    r`The probability is $\binom42/\binom{10}2=6/45=2/15$.`,
    exact('2/15'),
  ),
  q(
    r`A bag contains four marked and six unmarked distinct tokens. Select two uniformly without replacement. Find the probability of exactly one marked token.`,
    r`There are $4\cdot6=24$ favorable pairs out of $45$, giving $8/15$.`,
    exact('8/15'),
  ),
  q(
    r`A bag contains four marked and six unmarked distinct tokens. Select two uniformly without replacement. Find the probability of at least one marked token.`,
    r`The complement contains $\binom62=15$ unmarked pairs, so the result is $1-15/45=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Choose three of eight people uniformly. Find the probability a specified person is included.`,
    r`There are $\binom72=21$ committees containing the person out of $\binom83=56$, giving $3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Choose three of eight people uniformly. Find the probability two specified people are both included.`,
    r`Choose the third person from the other six: $6/\binom83=6/56=3/28$.`,
    exact('3/28'),
  ),
  q(
    r`A uniform length-four binary string is chosen. Find the probability it has exactly two ones.`,
    r`There are $\binom42=6$ favorable strings out of $2^4=16$, giving $3/8$.`,
    exact('3/8'),
  ),
  q(
    r`A uniform length-four binary string is chosen. Find the probability it has at least one one.`,
    r`Only the all-zero string fails, so the probability is $1-1/16=15/16$.`,
    exact('15/16'),
  ),
  q(
    r`Two independent fair dice are rolled. Find the probability their sum is $8$.`,
    r`The five ordered pairs are $(2,6),(3,5),(4,4),(5,3),(6,2)$, among $36$ equally likely pairs. The probability is $5/36$.`,
    exact('5/36'),
  ),
  q(
    r`Explain why the possible sums $2,3,\ldots,12$ of two fair dice are not equally likely.`,
    r`Different sums have different numbers of ordered realizations. Sum two has only $(1,1)$, while sum seven has six pairs; their probabilities are $1/36$ and $6/36$.`,
  ),
  q(
    r`A calculation uses $4\cdot3/\binom{10}2$ for two marked tokens among ten, four marked. Identify and repair the error.`,
    r`The numerator counts ordered marked pairs but the denominator counts unordered pairs. Use $\binom42/\binom{10}2=2/15$, or divide $4\cdot3$ by $10\cdot9$.`,
  ),
];
d.review = [
  q(
    r`Select two uniformly from a bag of five blue and three orange distinct tokens. Find the probability their colors differ.`,
    r`There are $5\cdot3=15$ mixed pairs out of $\binom82=28$, giving $15/28$.`,
    exact('15/28'),
  ),
  q(
    r`A uniform six-bit string is selected. Find the probability of exactly one zero.`,
    r`The zero has six possible positions among $2^6=64$ strings, giving $6/64=3/32$.`,
    exact('3/32'),
  ),
  q(
    r`Explain why uniform ordered draws without replacement produce a uniform unordered subset.`,
    r`Every size-$k$ subset has exactly $k!$ ordered listings, each with the same ordered probability. Summing those equal contributions gives the same probability for every subset.`,
  ),
];
d.quickCheck = quick(
  r`Two tokens are drawn without replacement from three marked and five unmarked tokens. Which expression gives exactly one marked token?`,
  [r`$\binom31\binom51/\binom82$`, r`$3\cdot5/(8\cdot7)$`, r`$\binom32/\binom82$`],
  0,
  r`Select one token from each category and divide by all unordered pairs.`,
  [
    r`The numerator counts each mixed pair once, giving $15$ of $28$ equally likely pairs.`,
    r`This ordered expression includes marked-then-unmarked but misses unmarked-then-marked.`,
    r`Selecting two of the three marked tokens describes two marked tokens, not exactly one.`,
  ],
);
const e = section(
  'Complements, collisions, and counting arguments',
  r`An event involving “at least one repeated value” is often easier to count through its complement. Suppose three independent uniform selections use five labels. There are $5^3=125$ ordered outcomes. The no-repeat outcomes number $5\cdot4\cdot3=60$. Hence a collision has probability $1-60/125=13/25$. A collision means some pair agrees; it does not specify a particular pair in advance.

For $k\leq n$ independent uniform labels, the general no-collision probability is $(n)_k/n^k$. For $k>n$, no collision is impossible by the pigeonhole principle. A different question asks whether anyone matches one distinguished person's label. With $k-1$ other people, the no-match count gives probability $((n-1)/n)^{k-1}$. The two events differ because others can collide with each other without matching the distinguished person.

Counting also proves identities without expanding factorials. To choose a size-$k$ subset from $n$ objects, distinguish one object and split cases according to whether it is included. Excluding it gives $\binom{n-1}k$ choices; including it leaves $k-1$ choices from the others, giving $\binom{n-1}{k-1}$. Thus Pascal's identity follows by a disjoint case split. The same reasoning justifies adding favorable counts across different category compositions.

Before accepting a count, test a small case by enumeration, check impossible and empty cases, and ask whether every outcome has exactly one description. These checks are not substitutes for a general argument, but they expose the most common errors: omitted orders, overlapping cases, or division by a multiplicity that is not constant. In probability applications, add one more check: whether the counted outcomes are truly equally likely under the experiment.`,
  [perm, comb],
  [
    termEntry(
      'collision',
      'Collision',
      'Two or more selections share a value.',
      r`For independent uniform labels, a collision is the complement of all labels being distinct.`,
      r`Three labels from five collide with probability $13/25$.`,
      'Any matching pair is a larger event than a match with one designated selection.',
    ),
  ],
);
e.questions = [
  q(
    r`Three independent uniform draws use four labels. Find the probability that all labels differ.`,
    r`There are $4\cdot3\cdot2=24$ no-repeat lists among $4^3=64$, so the probability is $3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Three independent uniform draws use four labels. Find the probability of a collision.`,
    r`Take the complement of all distinct: $1-3/8=5/8$.`,
    exact('5/8'),
  ),
  q(
    r`Five draws use four labels. Find the probability of at least one repeated label, regardless of their probability weights.`,
    r`Five positions cannot all have distinct values from four labels. The pigeonhole principle makes a repetition certain, so the probability is $1$.`,
    exact('1'),
  ),
  q(
    r`Four independent uniform labels use six possible values. Find the probability that none of the last three matches the first.`,
    r`For each of the other positions five of six labels avoid the first, giving $(5/6)^3=125/216$.`,
    exact('125/216'),
  ),
  q(
    r`Evaluate $\binom52+\binom53$ using Pascal's identity.`,
    r`The sum equals $\binom63=20$.`,
    exact('20'),
  ),
  q(
    r`A uniform committee of three is chosen from four experts and three novices. Find the probability of at least two experts.`,
    r`The favorable count is $\binom42\binom31+\binom43=18+4=22$, out of $\binom73=35$, so the probability is $22/35$.`,
    exact('22/35'),
  ),
  q(
    r`Count subsets of a six-element set that contain a specified element.`,
    r`The specified element is fixed as included; each of the other five is included or excluded. The count is $2^5=32$.`,
    exact('32'),
  ),
  q(
    r`Two independent uniform draws use $n$ labels, where $n$ is a positive integer. Derive the probability of equal labels.`,
    r`There are $n^2$ ordered outcomes and $n$ matching pairs $(i,i)$. Their ratio is $1/n$.`,
  ),
  q(
    r`Prove Pascal's identity $\binom nk=\binom{n-1}k+\binom{n-1}{k-1}$ for $1\leq k<n$.`,
    r`Partition the size-$k$ subsets according to whether they contain one distinguished element. Excluding it gives the first term, while including it leaves $k-1$ elements to choose and gives the second. The disjoint cases exhaust all subsets.`,
    undefined,
    'prove',
  ),
  q(
    r`Two uniform independent draws use labels $A,B$. If order is discarded, are $\{A,A\},\{A,B\},\{B,B\}$ equally likely?`,
    r`No. Their probabilities are $1/4,1/2,1/4$ because the mixed record has two ordered realizations. Discarding order does not produce a uniform collection of multisets.`,
    truth(false),
    'interpret',
  ),
];
e.review = [
  q(
    r`Three independent uniform draws use six labels. Find the collision probability.`,
    r`The no-collision probability is $6\cdot5\cdot4/6^3=5/9$, so the collision probability is $4/9$.`,
    exact('4/9'),
  ),
  q(
    r`Count five-person committees from eight candidates that contain a specified pair.`,
    r`Fix the pair and choose three of the remaining six, giving $\binom63=20$.`,
    exact('20'),
  ),
  q(
    r`Explain why summing probabilities of all matching pairs can overcount the probability of any collision.`,
    r`An outcome with three equal labels lies in three different pair-match events. These events overlap, so their probabilities cannot simply be added as disjoint cases.`,
  ),
];
b.body += r`

Restrictions on adjacent objects can also be counted by changing the units being arranged. If two specified books must be adjacent among five distinct books, treat that pair as one block. The block and three other books can be ordered in $4!$ ways, and the pair has two internal orders, giving $48$ arrangements. This argument works because every qualifying arrangement has one uniquely identified block and one internal order. It illustrates the same constant-multiplicity principle used for repeated symbols, although the objects being counted are different. Always explain how a counted representation corresponds back to a real arrangement.`;
e.body += r`

A probability calculation can be checked through two independent counts of the same event. For a uniform two-person committee from six people, inclusion of a designated person has probability $5/\binom62=1/3$. Alternatively imagine a uniform ordered selection of two distinct people: the designated person can be first in five outcomes or second in five, giving $10/(6\cdot5)=1/3$. Agreement is informative because the two calculations organize the favorable event differently. It would be less informative to write the same factorial ratio twice with only superficial rearrangement.`;
export default lesson(
  2,
  'counting-finite-probability',
  'Counting and Finite Probability',
  r`Finite probability becomes much more useful when we can count large outcome spaces without listing every element. We will refresh product counting, ordered selections, combinations, and complements, always linking the count to the experiment that makes its outcomes equally likely. The purpose is not to memorize a menu of factorial formulas. It is to recognize what distinguishes one outcome from another and to justify every multiplication, addition, and division. Worked examples compare two legitimate representations of the same sample, while collision problems show why counting the complement can make an apparently tangled event manageable.`,
  [a, b, c, d, e],
);
