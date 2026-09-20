import { r, lesson, section, citation, termEntry, q, exact, truth, quick } from './helpers.mjs';
const cond = citation(
  'pn-1-4-0',
  'pishro-nik',
  '§1.4.0 Conditional Probability',
  'https://www.probabilitycourse.com/chapter1/1_4_0_conditional_probability.php',
  'Conditional probability, renormalization, complement rules, and the multiplication chain rule.',
);
const ind = citation(
  'pn-1-4-1',
  'pishro-nik',
  '§1.4.1 Independence',
  'https://www.probabilitycourse.com/chapter1/1_4_1_independence.php',
  'Independence, complement preservation, mutual versus pairwise independence, and independent repeated events.',
);
const a = section(
  'Conditioning changes the reference population',
  r`A conditional probability answers a question after information restricts the possibilities. The notation $P(A\mid B)$ means the probability of $A$ given that $B$ occurred. The event after the vertical bar is the information being used, not another event to be multiplied automatically. When $P(B)>0$, the definition is $P(A\mid B)=P(A\cap B)/P(B)$.

The numerator retains the outcomes satisfying both the question and the information. Dividing by $P(B)$ rescales the retained probability to total one. Suppose an equally weighted collection has $40$ records. Of $16$ records tagged $B$, $10$ are also tagged $A$. Then $P(A\mid B)=10/16=5/8$, whereas $P(A\cap B)=10/40=1/4$. The same ten records appear in the numerator, but the reference population changes. A conditional proportion and a joint proportion answer different questions.

For a fair die, knowing the face is greater than two leaves $\{3,4,5,6\}$. The chance it is even is therefore $2/4=1/2$. This counting shortcut works because the retained outcomes remain equally likely. With unequal original weights, conditioning retains their relative weights; it does not flatten them. We must divide the retained event weight by the total retained weight.

The elementary definition does not assign a value when $P(B)=0$. Saying the answer is zero confuses an undefined ratio with an impossible event. Continuous conditioning will require a different construction later. For now, every numerical conditional problem specifies a positive-probability conditioning event. Check this condition before simplifying. It is part of the mathematical meaning, not a minor technical exception.`,
  [cond],
  [
    termEntry(
      'conditional-probability',
      'Conditional probability',
      'Probability after restricting to given information.',
      r`$P(A\mid B)=P(A\cap B)/P(B)$ when $P(B)>0$.`,
      r`Ten matching records among sixteen retained records give $5/8$.`,
      'The denominator refers to the event after the bar.',
    ),
    termEntry(
      'joint-event-probability',
      'Joint event probability',
      'The probability that several events all occur.',
      r`For two events it is $P(A\cap B)$.`,
      r`Ten matching records among forty give joint probability $1/4$.`,
      'A joint probability does not renormalize to a subgroup.',
    ),
  ],
);
a.questions = [
  q(
    r`If $P(A\cap B)=0.18$ and $P(B)=0.3$, find $P(A\mid B)$.`,
    r`Divide the overlap by the conditioning probability: $0.18/0.3=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`A fair die is known to be at least $4$. Find the probability its face is even.`,
    r`The retained faces are $4,5,6$, of which two are even, so the probability is $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`A fair die is known to be even. Find the probability its face is at least $4$.`,
    r`The retained faces are $2,4,6$ and two qualify, giving $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Among $50$ equally weighted records, $20$ have tag $B$ and $8$ have both tags. Find $P(A\mid B)$.`,
    r`The conditioned reference group contains $20$ records, so the answer is $8/20=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Among fifty equally weighted records, twenty have tag $B$ and eight have both $A,B$. Find $P(A\cap B)$.`,
    r`The joint event uses all $50$ records as reference: $8/50=4/25$.`,
    exact('4/25'),
  ),
  q(
    r`Outcomes $a,b,c$ have probabilities $1/2,1/3,1/6$. Given $\{b,c\}$, find the probability of $b$.`,
    r`The retained weight is $1/2$, so the conditional probability is $(1/3)/(1/2)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`If $P(A\mid B)=0.72$, find $P(A^c\mid B)$, assuming $P(B)>0$.`,
    r`Within the conditioned model, complements sum to one: $1-0.72=0.28=7/25$.`,
    exact('7/25'),
  ),
  q(r`For $P(B)>0$, evaluate $P(B\mid B)$.`, r`The ratio is $P(B)/P(B)=1$.`, exact('1')),
  q(
    r`Explain why $P(A\mid B)$ is not assigned zero by the elementary definition when $P(B)=0$.`,
    r`The defining ratio has denominator zero. It therefore supplies no value; a zero probability would be an additional assertion unsupported by this definition.`,
  ),
  q(
    r`True or false: conditioning makes all retained outcomes equally likely.`,
    r`False. It divides all retained weights by the same positive number, preserving their relative ratios rather than equalizing them.`,
    truth(false),
    'interpret',
  ),
];
a.review = [
  q(
    r`If $P(C\cap D)=7/30$ and $P(D)=7/15$, find $P(C\mid D)$.`,
    r`The ratio is $(7/30)/(7/15)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A fair eight-sided die is known to exceed $5$. Find the probability of an odd face.`,
    r`Only $7$ among $6,7,8$ is odd, so the probability is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`What is the reference population for “the fraction of delayed deliveries among international deliveries”?`,
    r`International deliveries form the conditioning group. The numerator counts deliveries that are both international and delayed; the denominator counts international deliveries.`,
  ),
];
a.quickCheck = quick(
  r`There are $100$ records, $25$ tagged $B$, and $15$ tagged both $A$ and $B$. What is $P(A\mid B)$?`,
  [r`$15/100$`, r`$15/25$`, r`$25/100$`],
  1,
  r`Conditioning on $B$ restricts the denominator to the $25$ records carrying that tag.`,
  [
    r`This is the joint probability $P(A\cap B)$ over the full collection.`,
    r`Fifteen of the twenty-five retained records carry $A$, giving conditional probability $3/5$.`,
    r`This is the probability of the conditioning event itself, not the fraction of its records also in $A$.`,
  ],
);
const b = section(
  'Read tables and multiply along a history',
  r`A two-way table makes conditioning concrete. Suppose a collection has $12$ records in both $A,B$, $18$ in $A$ only, $8$ in $B$ only, and $22$ in neither. The total is $60$. Then $P(A\mid B)=12/20=3/5$, while $P(B\mid A)=12/30=2/5$. Reversing the bar changes the denominator, so these probabilities need not agree.

Rearranging the definition gives the multiplication rule $P(A\cap B)=P(B)P(A\mid B)$. This rule is always available when the conditional is defined; it does not require independence. For three events, $P(A\cap B\cap C)=P(A)P(B\mid A)P(C\mid A\cap B)$, with positive conditioning probabilities. Each factor describes the next requirement given the accumulated history. A probability tree labels branches with these conditional probabilities. Multiply along a complete path, then add disjoint paths for an event with several histories.

For example, a bag contains four red and two blue tokens. Drawing two uniformly without replacement, the probability of red then blue is $(4/6)(2/5)=4/15$. After a red draw, the remaining total is five while two blue tokens remain. Blue then red has probability $(2/6)(4/5)=4/15$. Exactly one of each has probability $8/15$ because the two histories are disjoint.

A branch probability is not generally the unconditional probability of its label. The second draw being blue has unconditional probability $2/6$, but given that the first was red it has probability $2/5$. Keeping the history visible avoids using the wrong denominator. When later choices depend on earlier observations, the chain rule remains valid even though simple multiplication of unchanged marginal probabilities fails.`,
  [cond],
  [
    termEntry(
      'multiplication-rule',
      'Probability multiplication rule',
      'Recover joint probability from a conditional probability.',
      r`$P(A\cap B)=P(A)P(B\mid A)$ when $P(A)>0$.`,
      r`Red then blue without replacement gives $(4/6)(2/5)$.`,
      'The second factor is conditional unless independence is justified.',
    ),
    termEntry(
      'probability-tree',
      'Probability tree',
      'A diagram of conditional branches through successive stages.',
      r`Path probabilities multiply conditional branch probabilities; disjoint path probabilities add.`,
      r`The red-blue and blue-red paths both contribute to one of each color.`,
      'Outgoing probabilities sum to one at each reachable node, not across unrelated nodes.',
    ),
  ],
);
b.questions = [
  q(
    r`A table has both $9$, only $A$ $21$, only $B$ $6$, neither $14$. Find $P(A\mid B)$.`,
    r`The $B$ total is $9+6=15$, so $P(A\mid B)=9/15=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`A table has both $A,B$ nine, only $A$ twenty-one, only $B$ six, and neither fourteen. Find $P(B\mid A)$.`,
    r`The $A$ total is $9+21=30$, so the ratio is $9/30=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`If $P(A)=0.4$ and $P(B\mid A)=0.7$, find the joint probability.`,
    r`Multiply along the conditional history: $0.4(0.7)=0.28=7/25$.`,
    exact('7/25'),
  ),
  q(
    r`If $P(A)=1/2$, $P(B\mid A)=2/3$, and $P(C\mid A\cap B)=3/4$, find $P(A\cap B\cap C)$.`,
    r`The chain rule gives $(1/2)(2/3)(3/4)=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A bag has five red and three blue tokens. Draw two uniformly without replacement. Find the probability of two red.`,
    r`The conditional factors are $5/8$ and $4/7$, so the probability is $5/14$.`,
    exact('5/14'),
  ),
  q(
    r`A bag contains five red and three blue tokens. Draw two uniformly without replacement. Find the probability of red then blue.`,
    r`The first probability is $5/8$, then three blue tokens remain among seven. The product is $(5/8)(3/7)=15/56$.`,
    exact('15/56'),
  ),
  q(
    r`A bag contains five red and three blue tokens. Draw two uniformly without replacement. Find the probability of exactly one red in two draws.`,
    r`The red-blue and blue-red paths each have probability $15/56$, so their disjoint sum is $15/28$.`,
    exact('15/28'),
  ),
  q(
    r`A reachable tree node has two outgoing branches, one of conditional probability $0.35$. Find the other probability.`,
    r`The two exhaustive disjoint branch probabilities must sum to one, so the other is $0.65=13/20$.`,
    exact('13/20'),
  ),
  q(
    r`Explain why reversing $P(A\mid B)$ generally changes the answer.`,
    r`Both ratios use $P(A\cap B)$, but one divides by $P(B)$ and the other by $P(A)$. Different reference probabilities generally produce different results.`,
  ),
  q(
    r`True or false: the chain rule requires all events in the history to be independent.`,
    r`False. Conditional factors explicitly account for dependence. Independence is needed only to replace them by marginal probabilities.`,
    truth(false),
    'interpret',
  ),
];
b.review = [
  q(
    r`A table has both $14$, only $C$ $6$, only $D$ $21$, and neither $9$. Find $P(C\mid D)$.`,
    r`There are $35$ records in $D$, so the ratio is $14/35=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`A bag has three green and four yellow tokens. Draw two without replacement. Find green then yellow.`,
    r`Multiply $(3/7)(4/6)=2/7$.`,
    exact('2/7'),
  ),
  q(
    r`A process reaches a branch with probability $0.3$ and then passes with conditional probability $0.8$. Find the probability of that branch and pass.`,
    r`The joint path probability is $0.3(0.8)=0.24=6/25$.`,
    exact('6/25'),
  ),
];
const c = section(
  'Independence is a testable factorization',
  r`Events $A$ and $B$ are independent when $P(A\cap B)=P(A)P(B)$. For $P(B)>0$, this is equivalent to $P(A\mid B)=P(A)$. Within the model, learning whether $B$ occurred does not change the probability of $A$. The product definition is symmetric and also handles zero-probability events without dividing by zero.

Consider a uniform choice from $\{1,2,3,4,5,6,7,8\}$. Let $A$ mean even and $B$ mean at most four. Each has probability $1/2$, and their intersection $\{2,4\}$ has probability $1/4$. They are independent even though both concern the same chosen number. Independence is a property of the event probabilities, not a requirement that the descriptions refer to physically separate objects.

By contrast, two disjoint events of positive probability are dependent. Their intersection probability is zero while the product of their positive marginal probabilities is positive. Observing one completely rules out the other. “Cannot both happen” therefore describes a strong form of dependence, not independence. An event is independent of itself only if its probability is zero or one, since $p=p^2$ has only those solutions in $[0,1]$.

Independence is preserved by taking complements. Indeed, $P(A\cap B^c)=P(A)-P(A\cap B)=P(A)(1-P(B))$. This equals $P(A)P(B^c)$. The other complement combinations follow similarly. It lets us calculate “neither” and “exactly one” using independent failure or success events. When independence is not supplied by a model or established by a table, state the missing information rather than multiplying as a default.`,
  [ind],
  [
    termEntry(
      'independent-events',
      'Independent events',
      'Events whose joint probability factors.',
      r`$P(A\cap B)=P(A)P(B)$.`,
      r`Two events of probabilities $1/2$ with overlap $1/4$ are independent.`,
      'Disjoint positive-probability events are dependent, not independent.',
    ),
  ],
);
c.questions = [
  q(
    r`Independent events have probabilities $2/5$ and $3/4$. Find their intersection probability.`,
    r`Independence gives $(2/5)(3/4)=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`Independent events have probabilities $2/5$ and $3/4$. Find the probability neither occurs.`,
    r`Their complements are independent, so the probability is $(3/5)(1/4)=3/20$.`,
    exact('3/20'),
  ),
  q(
    r`Independent events have probabilities $2/5$ and $3/4$. Find the probability at least one occurs.`,
    r`Subtract neither from one: $1-3/20=17/20$.`,
    exact('17/20'),
  ),
  q(
    r`If $P(A)=0.3$, $P(B)=0.6$, and $P(A\cap B)=0.18$, are the events independent?`,
    r`Yes. Their product is $0.3(0.6)=0.18$, exactly the supplied intersection.`,
    truth(true),
    'interpret',
  ),
  q(
    r`If $P(A)=0.3$, $P(B)=0.6$, and $P(A\cap B)=0.12$, are the events independent?`,
    r`No. The product $0.18$ differs from the actual overlap $0.12$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Independent events satisfy $P(A)=0.4$ and $P(B)=0.7$. Find $P(A\mid B)$.`,
    r`Since $B$ has positive probability and independence holds, $P(A\mid B)=P(A)=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`True or false: the empty event is independent of every event.`,
    r`True. Both $P(\varnothing\cap A)$ and $P(\varnothing)P(A)$ equal zero.`,
    truth(true),
    'interpret',
  ),
  q(
    r`A uniform choice from $1$ through $6$ defines $A=$ even and $B=$ at most $3$. Are these events independent?`,
    r`No. Each marginal is $1/2$, but their intersection contains only $2$, giving $1/6\ne1/4$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Prove that positive-probability disjoint events cannot be independent.`,
    r`Disjointness gives intersection probability zero, whereas their marginal product is strictly positive. Thus the defining independence equality fails.`,
    undefined,
    'prove',
  ),
  q(
    r`Prove that if $A$ and $B$ are independent, then $A$ and $B^c$ are independent.`,
    r`Subtract the overlap: $P(A\cap B^c)=P(A)-P(A\cap B)=P(A)-P(A)P(B)=P(A)P(B^c)$.`,
    undefined,
    'prove',
  ),
];
c.review = [
  q(
    r`Independent events have probabilities $1/3$ and $1/5$. Find the probability exactly one occurs.`,
    r`The disjoint exclusive cases give $(1/3)(4/5)+(2/3)(1/5)=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`An event has probability $0.4$. Is it independent of itself?`,
    r`No. Its intersection with itself has probability $0.4$, while its probability squared is $0.16$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`A uniform choice from $1$ through $12$ defines even and at most $6$. Test independence.`,
    r`Each event has probability $1/2$; their intersection $\{2,4,6\}$ has probability $1/4$. Hence they are independent.`,
    truth(true),
    'interpret',
  ),
];
c.quickCheck = quick(
  r`Two disjoint events each have positive probability. Which statement holds?`,
  [
    r`They are independent because they cannot overlap.`,
    r`They are dependent because one rules out the other.`,
    r`Their intersection equals the product of their probabilities.`,
  ],
  1,
  r`Disjointness makes the joint probability zero, while the marginal product is positive.`,
  [
    r`No overlap means observing one excludes the other; it does not preserve the other's probability.`,
    r`Given one event, the other has conditional probability zero instead of its positive marginal probability.`,
    r`The left side is zero and the product is strictly positive, so the equality fails.`,
  ],
);
const d = section(
  'Repeated trials and mutual independence',
  r`For more than two events, independence requires more than checking pairs. Mutual independence means that the probability of every intersection of any selected subcollection equals the product of its marginal probabilities. For three events this includes all three pair equations and the triple equation. Pairwise independence checks only the pair equations.

A small counterexample uses two independent fair bits $X,Y$. Let $A$ mean $X=1$, $B$ mean $Y=1$, and $C$ mean the bits agree. Each event has probability $1/2$. Each pair overlaps in one of the four equally likely outcomes, so every pair intersection has probability $1/4$. But all three events occur at $11$, with probability $1/4$, whereas the product of all three marginals is $1/8$. Thus pairwise independence does not justify multiplying three probabilities.

When repeated trials are modeled as mutually independent, a complete outcome pattern has probability equal to the product of the individual trial probabilities. Three independent attempts with success probabilities $0.5,0.6,0.8$ all fail with probability $0.5\cdot0.4\cdot0.2=0.04$. At least one succeeds with probability $0.96$. Equal success probabilities are not required for independence; identical probabilities are a separate assumption used by the binomial model later.

A process does not acquire independence merely because it is repeated. Sampling without replacement changes the pool. A shared operating condition can influence several attempts. An adaptive rule can depend on earlier results. Specify the independence assumption when it is a deliberate approximation, and use conditional probabilities when dependence is part of the supplied model. Repeated observations alone do not establish it.`,
  [ind],
  [
    termEntry(
      'mutual-independence',
      'Mutual independence',
      'Every subcollection has a factored intersection probability.',
      r`For each nonempty index set $I$, $P(\bigcap_{i\in I}A_i)=\prod_{i\in I}P(A_i)$.`,
      r`Independent trial outcomes satisfy the product rule for any selected trials.`,
      'Pairwise independence checks fewer equations.',
    ),
    termEntry(
      'pairwise-independence',
      'Pairwise independence',
      'Every pair of distinct events is independent.',
      r`$P(A_i\cap A_j)=P(A_i)P(A_j)$ for every $i\ne j$.`,
      r`Two fair bits and their agreement event form a pairwise-independent example.`,
      'Three-way or larger intersections may still fail factorization.',
    ),
  ],
);
d.questions = [
  q(
    r`Three mutually independent events each have probability $1/2$. Find the probability all occur.`,
    r`Multiply all three marginals: $(1/2)^3=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Four independent attempts each succeed with probability $1/3$. Find the probability none succeeds.`,
    r`All four fail with probability $(2/3)^4=16/81$.`,
    exact('16/81'),
  ),
  q(
    r`Four independent attempts each succeed with probability $1/3$. Find the probability at least one succeeds.`,
    r`The complement calculation gives $1-16/81=65/81$.`,
    exact('65/81'),
  ),
  q(
    r`Three independent attempts succeed with probabilities $1/2,2/3,3/4$. Find the probability all succeed.`,
    r`The product is $(1/2)(2/3)(3/4)=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Three independent attempts succeed with probabilities $1/2,2/3,3/4$. Find the probability all fail.`,
    r`Multiply the complement probabilities: $(1/2)(1/3)(1/4)=1/24$.`,
    exact('1/24'),
  ),
  q(
    r`Independent fair bits define $A=$ first is $1$, $B=$ second is $1$, $C=$ bits agree. Find $P(A\cap B\cap C)$.`,
    r`Only $11$ satisfies all three events, so the probability is $1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Independent fair bits define $A=$ first is $1$, $B=$ second is $1$, and $C=$ the bits agree. Find $P(A)P(B)P(C)$.`,
    r`Each marginal equals $1/2$, so the product is $1/8$.`,
    exact('1/8'),
  ),
  q(
    r`True or false: independent trials must have equal success probabilities.`,
    r`False. Independence concerns joint factorization; the marginal probabilities may differ.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why pairwise independence does not authorize a three-factor product.`,
    r`Pairwise conditions constrain only intersections of two events. Mutual independence also requires the triple intersection equation, which can fail in the fair-bit agreement example.`,
  ),
  q(
    r`An independent sequence has success probability $3/5$ on every attempt. Find the probability of failure, failure, success in that order.`,
    r`The specified pattern has probability $(2/5)^2(3/5)=12/125$.`,
    exact('12/125'),
  ),
];
d.review = [
  q(
    r`Five independent binary trials are fair. Find the probability all have the same result.`,
    r`All-zero and all-one are disjoint patterns, each of probability $1/32$. Their sum is $1/16$.`,
    exact('1/16'),
  ),
  q(
    r`Independent components fail with probabilities $0.1,0.2,0.3$. Find the probability at least one fails.`,
    r`All work with probability $0.9\cdot0.8\cdot0.7=0.504$. Thus any failure has probability $0.496=62/125$.`,
    exact('62/125'),
  ),
  q(
    r`Explain why drawing two objects without replacement usually creates dependence in their category indicators.`,
    r`The first category changes how many objects of that category remain and changes the second draw's conditional probability. Degenerate exceptions do not justify assuming independence in general.`,
  ),
];
const e = section(
  'Conditioning, selection, and causal restraint',
  r`Conditioning describes the distribution within a specified information set. It does not by itself describe what would happen if we intervened to change a variable. If $P(A\mid B)>P(A)$, the events are associated in the model, but the inequality alone does not establish that making $B$ happen would cause $A$. A common condition, selection rule, or reverse relationship may account for the association.

Even independent events can become dependent after information is supplied. Toss two independent fair coins and condition on at least one head. The retained outcomes are $HH,HT,TH$, each with conditional probability $1/3$. Each coin then has conditional head probability $2/3$, while both-head probability is $1/3$, not $(2/3)^2$. Learning that one coin is tails forces the other to be heads within the retained group. The selection rule has changed the relationships among the events.

Conditional independence means independence within a stated conditioning event. For $P(C)>0$, it requires $P(A\cap B\mid C)=P(A\mid C)P(B\mid C)$. This is a separate claim from unconditional independence. A common hidden setting can make observations independent within each setting but dependent when settings are mixed; the next lesson's total-probability calculations will make that mixture explicit.

When solving a problem, write the entire conditioning event in the denominator and retain it through every step. “At least one head” differs from “the first coin is heads,” even though both imply a head exists. Information about how an outcome was selected or reported can therefore change the relevant event. A well-specified probability question describes that reporting mechanism; if it does not, explain the ambiguity and show what additional information would settle the calculation.`,
  [cond, ind],
  [
    termEntry(
      'conditional-independence-events',
      'Conditional independence of events',
      'Independence inside a specified information set.',
      r`For $P(C)>0$, $P(A\cap B\mid C)=P(A\mid C)P(B\mid C)$.`,
      r`A shared setting can be included in $C$ before testing factorization.`,
      'Unconditional independence can fail after selection, and the converse can fail too.',
    ),
  ],
);
e.questions = [
  q(
    r`Two independent fair coins are known to contain at least one head. Find the probability of two heads.`,
    r`The retained outcomes are $HH,HT,TH$, so the probability is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Two independent fair coins are known to have heads on the first coin. Find the probability of two heads.`,
    r`The retained outcomes are $HH,HT$, so the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Given at least one head in two independent fair coins, find the probability the first coin is heads.`,
    r`Among $HH,HT,TH$, the first two have first-coin heads, giving $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Given at least one head in two independent fair coins, are the two head events independent?`,
    r`No. Their conditional marginal product is $4/9$, but their conditional joint probability is $1/3$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`If $P(A\mid C)=0.4$, $P(B\mid C)=0.5$, and the events are conditionally independent given $C$, find $P(A\cap B\mid C)$.`,
    r`Conditional factorization gives $0.4(0.5)=0.2=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`$P(C)=0.3$, $P(A\mid C)=0.4$, and $P(B\mid C)=0.5$; $A,B$ are conditionally independent given $C$. Find $P(A\cap B\cap C)$.`,
    r`Multiply by the conditioning weight: $(1/5)(3/10)=3/50$.`,
    exact('3/50'),
  ),
  q(
    r`A conditional table within $C$ has both $0.12$, only $A$ $0.18$, only $B$ $0.28$, and neither $0.42$. Are $A,B$ independent given $C$?`,
    r`The conditional marginals are $0.30$ and $0.40$, whose product is $0.12$, matching the joint entry. Yes.`,
    truth(true),
    'interpret',
  ),
  q(
    r`True or false: $P(A\mid B)>P(A)$ alone proves that causing $B$ would increase the chance of $A$.`,
    r`False. The comparison is an observational conditional association. It supplies no intervention model or exclusion of alternative explanations.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why “a randomly selected record has tag $B$” and “a record is chosen uniformly from those with tag $B$” lead to the same conditional distribution when the original records were uniform.`,
    r`Conditioning a uniform distribution on membership in $B$ gives equal weight to each retained record, normalized by their count. That matches uniform sampling directly from the retained set.`,
  ),
  q(
    r`Construct two different information events about two independent fair coins that both guarantee a head but give different probabilities of two heads.`,
    r`Conditioning on first-coin heads gives $1/2$. Conditioning on at least one head gives $1/3$. The first retains two ordered outcomes; the second retains three.`,
    undefined,
    'construct',
  ),
];
e.review = [
  q(
    r`Two independent fair dice are known to have at least one six. Find the probability both are six.`,
    r`There are $6+6-1=11$ retained ordered outcomes, only one with two sixes. The probability is $1/11$.`,
    exact('1/11'),
  ),
  q(
    r`If $P(A\mid C)=1/3$, $P(B\mid C)=3/5$, and $P(A\cap B\mid C)=1/4$, are the events conditionally independent?`,
    r`No. The product is $1/5$, different from the supplied joint probability $1/4$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why an unspecified report such as “one coin is heads” may be insufficient to identify a conditional model.`,
    r`It may mean at least one head was observed, a designated coin was observed heads, or a reporting rule selected a head. These correspond to different information events or mechanisms, so the condition must be specified.`,
  ),
];
e.body += r`

The selection example can be checked with a complete conditional table. Under at least one head, both-head probability is $1/3$, first-only-head probability is $1/3$, second-only-head probability is $1/3$, and neither has probability zero. Each conditional marginal is $2/3$, so the product test gives $4/9$ rather than the actual intersection $1/3$. The mismatch is numerical evidence of dependence within the selected population. By contrast, conditioning on the first coin being heads leaves that first head event certain; it is then independent of every event under the conditional model because its probability is one. These two forms of conditioning both involve a head, but they retain different outcome sets and lead to different probability relationships. Describing the retained population is therefore an essential part of any interpretation.`;
const conditionalIndependence = citation(
  'pn-1-4-4',
  'pishro-nik',
  '§1.4.4 Conditional Independence',
  'https://www.probabilitycourse.com/chapter1/1_4_4_conditional_independence.php',
  'Conditional independence and its distinction from unconditional independence.',
);
const causal = citation(
  'os-1-4',
  'openstax-statistics-2e',
  '§1.4 Experimental Design and Ethics, opening observational-study discussion',
  'https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics',
  'Observational association alone does not establish a causal effect.',
);
e.sources.push(conditionalIndependence, causal);
export default lesson(
  3,
  'conditional-probability-independence',
  'Conditional Probability and Independence',
  r`New information changes which outcomes remain relevant. This lesson turns that idea into conditional probability, uses tables and trees to keep denominators clear, and separates independence from disjointness. We will calculate probabilities along dependent histories, test independence from supplied data, and see why two independent observations can become dependent after selection. The previous lessons supply event notation and finite counting; those tools now support careful questions about what is known and what is still uncertain.`,
  [a, b, c, d, e],
);
