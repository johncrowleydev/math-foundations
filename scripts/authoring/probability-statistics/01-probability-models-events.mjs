import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  truth,
  tuple,
  quick,
} from './helpers.mjs';
const experiments = citation(
  'pn-1-3-1',
  'pishro-nik',
  '§1.3.1 Random Experiments',
  'https://www.probabilitycourse.com/chapter1/1_3_1_random_experiments.php',
  'Experiments, outcomes, sample spaces, and event set operations.',
);
const axioms = citation(
  'pn-1-3-2',
  'pishro-nik',
  '§1.3.2 Probability',
  'https://www.probabilitycourse.com/chapter1/1_3_2_probability.php',
  'Nonnegativity, normalization, and countable additivity for disjoint events.',
);
const rules = citation(
  'pn-1-3-3',
  'pishro-nik',
  '§1.3.3 Finding Probabilities',
  'https://www.probabilitycourse.com/chapter1/1_3_3_finding_probabilities.php',
  'Finite probability weights, complements, monotonicity, and inclusion-exclusion.',
);
const a = section(
  'Specify the experiment before calculating',
  r`Probability begins with a description of what is uncertain. A random experiment produces an outcome; its sample space $\Omega$ lists the outcomes our model distinguishes. An event is a subset of $\Omega$. It occurs when the observed outcome belongs to that subset. These are different objects: an individual outcome, a collection of outcomes, and a number assigned to that collection.

Suppose two inspection stations each report pass or fail, and order identifies the station. A useful space is $\Omega=\{PP,PF,FP,FF\}$. The event that exactly one station reports fail is $\{PF,FP\}$. The event that the first station reports pass is $\{PP,PF\}$. Both events occur for the single outcome $PF$. Events do not have to be mutually exclusive descriptions.

If we instead record only the number of failures, the recorded possibilities are $\{0,1,2\}$. This smaller space answers count questions but cannot distinguish which station failed. Neither representation alone says that its outcomes are equally likely. Indeed, when the four ordered reports are equally likely, the three counts have probabilities $1/4,1/2,1/4$. Forgetting detail merges outcomes and can destroy equal likelihood.

A model should state the experiment, observation rule, and assumptions before arithmetic begins. A fair die means equal probability for its six faces. A die with six visible faces is not automatically fair. Likewise, an observed frequency from a short run is evidence about a model, not a mathematical reason that each future run must reproduce that frequency. We will study estimation later; for now probabilities are supplied or justified by explicit modeling assumptions. Keep track of which claims follow from those assumptions and which would require data.`,
  [experiments, rules],
  [
    termEntry(
      'sample-space',
      'Sample space',
      'The outcomes distinguished by a model.',
      r`The set $\Omega$ of possible outcomes of a specified experiment.`,
      r`Two ordered binary reports give $\{PP,PF,FP,FF\}$.`,
      'A coarser recording rule can merge outcomes with unequal total probabilities.',
    ),
    termEntry(
      'event',
      'Event',
      'A set of outcomes.',
      r`A subset $A\subseteq\Omega$; it occurs when the observed outcome lies in $A$.`,
      r`Exactly one failure is $\{PF,FP\}$.`,
      'An event may contain several outcomes.',
    ),
  ],
);
a.questions = [
  q(
    r`Two ordered binary reports form $\{PP,PF,FP,FF\}$. How many outcomes have at least one failure?`,
    r`The outcomes are $PF,FP,FF$, so the number is $3$.`,
    exact('3'),
  ),
  q(
    r`Two ordered binary reports form $\{PP,PF,FP,FF\}$. How many outcomes have exactly one failure?`,
    r`Only $PF$ and $FP$ qualify, so the number is $2$.`,
    exact('2'),
  ),
  q(
    r`A fair die is rolled once. Find the probability of a face greater than $4$.`,
    r`The qualifying faces are $5,6$, each with probability $1/6$, so the probability is $2/6=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`A fair die is rolled once. Find the probability of a face that is both even and greater than $3$.`,
    r`The event is $\{4,6\}$, so its probability is $2/6=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Four ordered reports $PP,PF,FP,FF$ are equally likely. Find the probability of exactly one failure.`,
    r`Two of the four outcomes qualify, giving $2/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`The probabilities of $PP,PF,FP,FF$ are $0.5,0.2,0.1,0.2$. Find the probability of exactly one failure.`,
    r`Add the probabilities of $PF$ and $FP$: $0.2+0.1=0.3=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`True or false: writing three possible counts $0,1,2$ makes them equally likely.`,
    r`False. A recording rule determines possible values, not their weights; two equally likely binary trials give count probabilities $1/4,1/2,1/4$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`A survey records whether a household owns a bicycle and whether it owns a car. Describe a sample space retaining both facts.`,
    r`Use $\{(0,0),(0,1),(1,0),(1,1)\}$, with the first coordinate indicating bicycle ownership and the second car ownership. The labels retain which item is owned.`,
  ),
  q(
    r`A log records only the total number of failed stations. Explain why it cannot answer which station failed when the count is $1$.`,
    r`Both $PF$ and $FP$ map to the recorded count $1$. Since the map merges these distinct outcomes, the recorded value cannot recover station identity.`,
  ),
  q(
    r`An experiment has outcomes $u,v,w$ with probabilities $1/2,1/3,1/6$. Find $P(\{u,w\})$.`,
    r`The singleton outcomes are disjoint, so $P(\{u,w\})=1/2+1/6=2/3$.`,
    exact('2/3'),
  ),
];
a.review = [
  q(
    r`A fair eight-sided die is numbered $1$ through $8$. Find the probability of a multiple of $3$.`,
    r`Only $3$ and $6$ qualify, giving $2/8=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A record stores only whether two reports agree. Explain one piece of information it loses.`,
    r`An agreement record merges $PP$ with $FF$, so it cannot say whether both passed or both failed. A disagreement record similarly loses which station failed.`,
  ),
  q(
    r`Outcomes $a,b,c,d$ have probabilities $1/10,2/10,3/10,4/10$. Find the probability of $\{a,c,d\}$.`,
    r`Sum the three specified weights: $1/10+3/10+4/10=4/5$.`,
    exact('4/5'),
  ),
];
a.quickCheck = quick(
  r`The ordered coin outcomes $HH,HT,TH,TT$ are equally likely, and only the number of heads is recorded. Which count is most likely?`,
  [r`$0$`, r`$1$`, r`All three counts are equally likely.`],
  1,
  r`The four equally likely ordered outcomes merge into counts with weights $1/4,1/2,1/4$.`,
  [
    r`Zero heads corresponds only to $TT$, so its probability is $1/4$.`,
    r`One head corresponds to $HT$ or $TH$, so its probability is $1/2$.`,
    r`The count $1$ has two underlying outcomes; each other count has only one.`,
  ],
);
const b = section(
  'Translate event language into sets',
  r`The word “or” in probability normally includes the possibility of both events. Thus $A\cup B$ means at least one of $A,B$ occurs, whereas $A\cap B$ means both occur. The complement $A^c$ consists of the outcomes in the sample space that are not in $A$. A complement is always relative to the chosen space; “not an even die face” has a different meaning from “not an even integer.”

For one die roll let $A=\{2,4,6\}$ and $B=\{4,5,6\}$. Then $A\cap B=\{4,6\}$, $A\cup B=\{2,4,5,6\}$, and $A\cap B^c=\{2\}$. The last event says even but not greater than three. “Exactly one of $A,B$” combines $A\cap B^c$ and $A^c\cap B$, giving $\{2,5\}$. It excludes the overlap, unlike the ordinary inclusive “or.”

Two events are disjoint when their intersection is empty. This describes which combinations can occur; it is not a statement about whether knowledge of one changes the probability of the other. Independence, introduced later, is a separate property. Two positive-probability disjoint events will actually fail the independence test.

Negating a statement often simplifies a calculation. De Morgan's laws give $(A\cup B)^c=A^c\cap B^c$ and $(A\cap B)^c=A^c\cup B^c$. “Not both succeeded” includes either single failure and also two failures. “Neither succeeded” requires two failures. Test translations against a small list of outcomes before trusting algebra. A four-region diagram—both, only $A$, only $B$, neither—provides the same check and will become a useful probability table.`,
  [experiments, rules],
  [
    termEntry(
      'disjoint-events',
      'Disjoint events',
      'Events with no common outcome.',
      r`$A\cap B=\varnothing$.`,
      r`A single die roll cannot equal both $1$ and $2$.`,
      'Disjoint does not mean independent.',
    ),
    termEntry(
      'complement',
      'Complement',
      'All outcomes outside the event.',
      r`$A^c=\Omega\setminus A$.`,
      r`The complement of at least one failure is no failures.`,
      'The complement of both is not both, not neither.',
    ),
  ],
);
b.questions = [
  q(
    r`On a fair die, $A=\{1,2,3\}$ and $B=\{3,4\}$. Find $P(A\cap B)$.`,
    r`The overlap is $\{3\}$, so $P(A\cap B)=1/6$.`,
    exact('1/6'),
  ),
  q(
    r`On a fair die, $A=\{1,2,3\}$ and $B=\{3,4\}$. Find $P(A\cup B)$.`,
    r`The union is $\{1,2,3,4\}$, giving $4/6=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`On a fair die, $A=\{1,2,3\}$ and $B=\{3,4\}$. Find $P(A\cap B^c)$.`,
    r`The event is $\{1,2\}$, so the probability is $2/6=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`On a fair die, $A=\{1,2,3\}$ and $B=\{3,4\}$. Find the probability that exactly one of $A,B$ occurs.`,
    r`Exactly one means $\{1,2,4\}$, so the probability is $3/6=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`True or false: if $A\cap B=\varnothing$, the events can occur together.`,
    r`False. No outcome belongs to both, so simultaneous occurrence is impossible.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Translate “at least one of three components fails” into an event using failure events $A,B,C$.`,
    r`The event is $A\cup B\cup C$. This includes one, two, or three failures.`,
  ),
  q(
    r`Translate “not all three components fail” using $A,B,C$ and complements.`,
    r`The event is $(A\cap B\cap C)^c=A^c\cup B^c\cup C^c$: at least one component does not fail.`,
  ),
  q(
    r`For a fair die, find $P((\{1,3,5\}\cup\{5,6\})^c)$.`,
    r`The union is $\{1,3,5,6\}$, so the complement is $\{2,4\}$ and its probability is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`True or false: the events “at most two arrivals” and “at least two arrivals” are disjoint.`,
    r`False. An outcome with exactly two arrivals belongs to both.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Describe the difference between “neither $A$ nor $B$” and “not both $A$ and $B$,” giving an outcome that separates them.`,
    r`Neither is $A^c\cap B^c$; not both is $(A\cap B)^c$. An outcome in $A\cap B^c$ satisfies not both but fails neither.`,
  ),
];
b.review = [
  q(
    r`On a fair ten-sided die, $A=\{2,4,6,8,10\}$ and $B=\{8,9,10\}$. Find the probability of exactly one event.`,
    r`The only-$A$ outcomes are $2,4,6$ and the only-$B$ outcome is $9$, giving $4/10=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`True or false: “not at least one failure” means every component succeeds.`,
    r`True. Negating the union of failure events gives the intersection of all success events.`,
    truth(true),
    'interpret',
  ),
  q(
    r`If $A\subseteq B$, simplify $A\cap B^c$ and explain.`,
    r`It is $\varnothing$: every outcome in $A$ already belongs to $B$, so none can also be outside $B$.`,
  ),
];
const c = section(
  'Probability weights and the axioms',
  r`A probability assignment must be internally consistent. It gives every event a nonnegative number, assigns $P(\Omega)=1$, and adds probabilities across disjoint events. For a countable collection of pairwise disjoint events, this addition extends to an infinite sum. In a finite model, assigning nonnegative weights to individual outcomes that sum to one determines every event probability by addition.

Consider outcomes $a,b,c,d$ with weights $k,2k,3k,4k$. Normalization requires $10k=1$, so $k=1/10$. The event $\{a,d\}$ then has probability $1/10+4/10=1/2$. The count of favorable outcomes is two, but $2/4$ happens to agree only accidentally here. For $\{a,b\}$ the probability is $3/10$, not $1/2$.

The familiar ratio $P(A)=|A|/|\Omega|$ requires a finite space with equally likely outcomes. If there are $N$ such outcomes, additivity and normalization force each singleton probability to be $1/N$. Counting is therefore a consequence of the probability model, not an alternative to specifying it. A spinner divided into unequal sectors should be weighted by the specified sector probabilities, even when its labels look symmetric.

Some proposed assignments fail before any event is calculated. The list $0.4,0.4,0.4$ sums to more than one. The list $-0.1,0.4,0.7$ sums to one but violates nonnegativity. Both checks are essential. Zero-weight outcomes are allowed mathematically, although in a finite model it is often convenient to omit them. Later continuous models require extra care: a probability-zero event need not be empty. The axioms distinguish probability from simple logical possibility; do not silently replace one with the other.`,
  [axioms, rules],
  [
    termEntry(
      'probability-model',
      'Probability model',
      'Outcomes together with consistent probability assignments.',
      r`A sample space and event probabilities satisfying nonnegativity, normalization, and countable additivity.`,
      r`Four outcomes may have weights $0.1,0.2,0.3,0.4$.`,
      'A list of possibilities does not supply their probabilities.',
    ),
    termEntry(
      'equally-likely',
      'Equally likely outcomes',
      'Outcomes assigned the same probability.',
      r`In a finite space of size $N$, equal singleton weights are $1/N$.`,
      r`A fair eight-sided die gives each face probability $1/8$.`,
      'Equal labels or an unknown bias do not justify equal weights.',
    ),
  ],
);
c.questions = [
  q(
    r`Weights on three outcomes are $k,2k,5k$. Find $k$.`,
    r`Normalization gives $8k=1$, so $k=1/8$. All weights are nonnegative.`,
    exact('1/8'),
  ),
  q(
    r`With weights $k,2k,5k$, find the probability of the first two outcomes.`,
    r`Since $k=1/8$, their total weight is $3k=3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Weights are $0.15,0.25,t,0.1$. Find $t$.`,
    r`The listed weights sum to $0.5+t$, so $t=0.5=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`True or false: $(-0.2,0.6,0.6)$ is a valid probability list.`,
    r`False. The first weight is negative, even though the sum is one.`,
    truth(false),
    'interpret',
  ),
  q(
    r`True or false: $(0,1/3,2/3)$ is a valid finite probability list.`,
    r`True. Every weight is nonnegative and their sum is one; a zero weight is permitted.`,
    truth(true),
    'interpret',
  ),
  q(
    r`A fair twelve-sided die has faces $1$ through $12$. Find the probability of a prime face.`,
    r`The prime faces are $2,3,5,7,11$, so the probability is $5/12$.`,
    exact('5/12'),
  ),
  q(
    r`Disjoint events have probabilities $1/8,1/4,3/8$. Find the probability of their union.`,
    r`Add the disjoint weights: $1/8+2/8+3/8=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`A model has exactly four possible outcomes. One outcome has weight twice that of each of the other three. Find its probability.`,
    r`Writing the four weights as $2k,k,k,k$ gives $5k=1$. The distinguished probability is $2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Explain why favorable-outcome counting fails for a spinner with three sector probabilities $1/2,1/3,1/6$.`,
    r`Counting would give every label weight $1/3$, contradicting the supplied sector weights. An event probability must add its actual sector probabilities.`,
  ),
  q(
    r`Prove that $P(\varnothing)=0$ using finite additivity and normalization.`,
    r`The disjoint union $\Omega\cup\varnothing=\Omega$ gives $1=1+P(\varnothing)$. Subtracting one yields $P(\varnothing)=0$.`,
    undefined,
    'prove',
  ),
];
c.review = [
  q(
    r`Four outcome weights are $2k,3k,4k,6k$. Find the last weight.`,
    r`Their sum is $15k=1$, so the last weight is $6/15=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`True or false: four nonnegative numbers totaling $0.9$ fully specify probabilities for an exhaustive four-outcome model.`,
    r`False. An exhaustive model must have total probability one; $0.1$ is unaccounted for.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Eight equally likely outcomes include three favorable ones. Find the event probability.`,
    r`Each outcome has weight $1/8$, so three favorable outcomes give $3/8$.`,
    exact('3/8'),
  ),
];
const d = section(
  'Complements, overlap, and bounds',
  r`Since $A$ and $A^c$ partition the sample space, additivity gives $P(A)+P(A^c)=1$. Thus $P(A^c)=1-P(A)$. This is especially useful when the complement has a simpler description: “at least one” can be found from “none.” No independence assumption is needed for this identity.

For overlapping events, adding $P(A)$ and $P(B)$ counts the intersection twice. Subtracting one copy gives $P(A\cup B)=P(A)+P(B)-P(A\cap B)$. Suppose a service uses channel $A$ with probability $0.55$, channel $B$ with probability $0.35$, and both with probability $0.15$. The probability of at least one channel is $0.55+0.35-0.15=0.75$. The probability of neither is $0.25$. Only $A$ has probability $0.40$; only $B$ has probability $0.20$. These four disjoint regions sum to one.

The same picture supplies bounds. Because $A\cap B\subseteq A,B$, its probability cannot exceed $\min(P(A),P(B))$. Because the union cannot exceed one, the intersection cannot be smaller than $P(A)+P(B)-1$, or zero when that expression is negative. Therefore $\max(0,P(A)+P(B)-1)\leq P(A\cap B)\leq\min(P(A),P(B))$.

Without an overlap or another assumption, two marginal probabilities usually do not determine the union. A useful weaker conclusion is the union bound $P(A\cup B)\leq P(A)+P(B)$, extended to any finite list. It remains valid with dependence and overlapping failure modes. A bound greater than one is mathematically true but uninformative; combine it with the universal upper bound one. A small union bound, by contrast, can certify that any one of many undesirable events is unlikely under the stated model.`,
  [rules],
  [
    termEntry(
      'inclusion-exclusion',
      'Inclusion-exclusion',
      'Add individual probabilities and correct for overlap.',
      r`$P(A\cup B)=P(A)+P(B)-P(A\cap B)$.`,
      r`$0.6+0.5-0.2=0.9$.`,
      'Subtract the intersection once, because it was counted twice.',
    ),
    termEntry(
      'union-bound',
      'Union bound',
      'An upper bound that needs no independence.',
      r`$P(\bigcup_{i=1}^n A_i)\leq\sum_{i=1}^nP(A_i)$.`,
      r`Three failure probabilities $0.01$ give an any-failure bound $0.03$.`,
      'The sum need not equal the union probability.',
    ),
  ],
);
d.questions = [
  q(
    r`If $P(A)=7/12$, find $P(A^c)$.`,
    r`The complement has probability $1-7/12=5/12$.`,
    exact('5/12'),
  ),
  q(
    r`If $P(A)=0.6$, $P(B)=0.4$, and $P(A\cap B)=0.25$, find $P(A\cup B)$.`,
    r`Inclusion-exclusion gives $0.6+0.4-0.25=0.75=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`$P(A)=0.6$, $P(B)=0.4$, and $P(A\cap B)=0.25$. Find the probability of neither event.`,
    r`The union probability is $3/4$, so neither has probability $1-3/4=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`$P(A)=0.6$, $P(B)=0.4$, and $P(A\cap B)=0.25$. Find the probability of exactly one event.`,
    r`Subtract both copies of the overlap from the marginal sum: $0.6+0.4-2(0.25)=0.5=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`If $P(A)=0.8$ and $P(B)=0.7$, give the smallest possible $P(A\cap B)$.`,
    r`The union can be at most one, so the minimum overlap is $0.8+0.7-1=0.5=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`If $P(A)=0.8$ and $P(B)=0.7$, give the largest possible $P(A\cap B)$.`,
    r`The overlap cannot exceed the smaller event, so its maximum is $0.7=7/10$.`,
    exact('7/10'),
  ),
  q(
    r`Four failure events each have probability $0.02$. Give the union-bound upper bound for any failure.`,
    r`The union bound gives $4(0.02)=0.08=2/25$, without requiring independence.`,
    exact('2/25'),
  ),
  q(
    r`True or false: $P(A)=0.7$, $P(B)=0.6$, and $P(A\cap B)=0.1$ are jointly possible.`,
    r`False. They imply a union probability $0.7+0.6-0.1=1.2$, exceeding one.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Prove monotonicity: if $A\subseteq B$, then $P(A)\leq P(B)$.`,
    r`Write $B=A\cup(B\setminus A)$ as a disjoint union. Then $P(B)=P(A)+P(B\setminus A)\geq P(A)$ by nonnegativity.`,
    undefined,
    'prove',
  ),
  q(
    r`Events $A,B,C$ have probabilities $0.4,0.3,0.2$, pairwise intersections $0.1,0.08,0.06$, and triple intersection $0.02$. Find the union probability.`,
    r`Three-event inclusion-exclusion gives $0.4+0.3+0.2-0.1-0.08-0.06+0.02=0.68=17/25$.`,
    exact('17/25'),
  ),
];
d.review = [
  q(
    r`Events have probabilities $2/3,1/2$ and overlap $1/4$. Find their union probability.`,
    r`The union probability is $2/3+1/2-1/4=11/12$.`,
    exact('11/12'),
  ),
  q(
    r`For event probabilities $0.45,0.8$, give the sharp lower and upper bounds for their overlap as an ordered pair.`,
    r`The bounds are $\max(0,0.45+0.8-1)=0.25$ and $\min(0.45,0.8)=0.45$, so the pair is $(1/4,9/20)$.`,
    tuple(['1/4', '9/20']),
  ),
  q(
    r`Six events each have probability at most $0.005$. Give the lower bound for the probability that none occurs obtained by subtracting the union bound from one.`,
    r`Their union has probability at most $0.03$, so its complement has probability at least $0.97=97/100$.`,
    exact('97/100'),
  ),
];
d.quickCheck = quick(
  r`If $P(A)=0.6$ and $P(B)=0.7$, which proposed overlap is impossible?`,
  [r`$0.2$`, r`$0.3$`, r`$0.6$`],
  0,
  r`The overlap must lie between $0.3$ and $0.6$.`,
  [
    r`An overlap of $0.2$ would give a union of $1.1$, violating normalization.`,
    r`An overlap of $0.3$ gives a union of exactly one and is feasible.`,
    r`An overlap of $0.6$ is feasible when $A$ is contained in $B$.`,
  ],
);
const e = section(
  'Build and audit a complete event model',
  r`A reliable solution does more than produce a plausible number. It names the event, identifies the supplied probabilities, and checks whether the resulting regions can all be nonnegative. This is particularly useful when a word problem gives partly overlapping descriptions instead of an outcome table.

Suppose $P(A)=0.65$, $P(B)=0.50$, and the probability of neither is $0.20$. First obtain $P(A\cup B)=0.80$ by taking a complement. Then the overlap is $0.65+0.50-0.80=0.35$. Only $A$ has probability $0.30$ and only $B$ has probability $0.15$. The complete four-region model is therefore $(0.35,0.30,0.15,0.20)$ in the order both, only $A$, only $B$, neither. Each entry is nonnegative and the sum is one. This independently checks the calculation and demonstrates that the supplied numbers are consistent.

If a problem instead supplies only $P(A)=0.65$ and $P(B)=0.50$, the overlap remains free between $0.15$ and $0.50$. There are many valid models. Choosing an overlap without an additional assumption is inventing information. A correct answer may be a bound or a statement of underdetermination, accompanied by two concrete models showing why uniqueness fails.

Finally separate model conclusions from physical conclusions. A model may assume all tickets are equally likely to be selected; its calculated probability is conditional on that selection mechanism. Duplicate entries, unequal selection weights, or an incomplete sample space change the model. Checking arithmetic cannot validate these assumptions. When writing a solution, state what is assumed, show how the rules apply, and interpret the result in terms of the original experiment. This discipline will carry into conditional probability, statistical estimation, and fitting models from observed data.`,
  [experiments, axioms, rules],
  [
    termEntry(
      'partition',
      'Partition',
      'Disjoint pieces covering the whole space.',
      r`Events $B_i$ are pairwise disjoint and satisfy $\bigcup_iB_i=\Omega$.`,
      r`Both, only $A$, only $B$, and neither form a partition.`,
      'Coverage alone is insufficient if the pieces overlap.',
    ),
  ],
);
e.questions = [
  q(
    r`If $P(A)=0.7$, $P(B)=0.4$, and neither has probability $0.2$, find the overlap.`,
    r`The union has probability $0.8$, so the overlap is $0.7+0.4-0.8=0.3=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`$P(A)=0.7$, $P(B)=0.4$, and neither has probability $0.2$. Find $P(A\cap B^c)$.`,
    r`Subtract the overlap from $P(A)$: $0.7-0.3=0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Four disjoint region probabilities are both $0.12$, only $A$ $0.28$, only $B$ $0.18$, and neither $0.42$. Find $P(A)$.`,
    r`Event $A$ consists of both and only $A$, so $P(A)=0.12+0.28=0.40=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Both $A,B$, only $A$, only $B$, and neither have probabilities $0.12,0.28,0.18,0.42$, respectively. Find $P(B^c)$.`,
    r`Outside $B$ are only $A$ and neither, giving $0.28+0.42=0.70=7/10$.`,
    exact('7/10'),
  ),
  q(
    r`If $A\subseteq B$, $P(A)=0.2$, and $P(B)=0.6$, find $P(B\setminus A)$.`,
    r`The disjoint remainder has probability $0.6-0.2=0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Two events each have probability $1/2$. Give two possible overlap probabilities showing that their union is not determined.`,
    r`Disjoint halves have overlap $0$ and union $1$. Identical halves have overlap $1/2$ and union $1/2$. Thus the same marginal probabilities allow different unions.`,
  ),
  q(
    r`True or false: two events whose union is the sample space necessarily form a partition.`,
    r`False. They must also be disjoint. Taking $A=B=\Omega$ gives coverage with complete overlap.`,
    truth(false),
    'interpret',
  ),
  q(
    r`A model assigns probabilities $0.45$ and $0.55$ to two exhaustive disjoint outcomes. Find the probability that exactly one occurs.`,
    r`Every outcome belongs to exactly one partition piece, so the probability is $1$.`,
    exact('1'),
  ),
  q(
    r`If $P(A)=0.3$ and $P(B)=0.4$, give the largest possible union probability.`,
    r`The sum is $0.7$ and is achievable with disjoint events, so the maximum is $7/10$.`,
    exact('7/10'),
  ),
  q(
    r`A report says “twenty possible labels, so each has probability $1/20$.” Identify the missing modeling assumption.`,
    r`The labels must be equally likely under the actual selection mechanism. The number of labels alone does not establish equal probabilities; weighting or multiple underlying outcomes can change them.`,
  ),
];
e.review = [
  q(
    r`If $P(A)=0.58$, $P(B)=0.47$, and neither has probability $0.19$, find the overlap.`,
    r`The union is $0.81$, so the overlap is $0.58+0.47-0.81=0.24=6/25$.`,
    exact('6/25'),
  ),
  q(
    r`Only $A$, only $B$, both, and neither have probabilities $0.2,0.3,0.1,0.4$. Find the probability of exactly one.`,
    r`Add the two exclusive regions: $0.2+0.3=0.5=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Explain why showing that probabilities sum to one does not by itself validate a proposed outcome model.`,
    r`The weights must also be nonnegative, the outcomes must describe the experiment without omitted possibilities or unintended duplication, and their weights must be justified by assumptions or evidence.`,
  ),
];
d.body += r`

For three events, begin with the two-event rule applied to $(A\cup B)\cup C$. The overlap with $C$ is $(A\cap C)\cup(B\cap C)$, whose probability is $P(A\cap C)+P(B\cap C)-P(A\cap B\cap C)$. Substitution gives $P(A\cup B\cup C)=P(A)+P(B)+P(C)-P(A\cap B)-P(A\cap C)-P(B\cap C)+P(A\cap B\cap C)$. The triple overlap is added back because the first three terms count it three times and the three pair subtractions remove it three times. It should ultimately be counted once. For example, individual probabilities $0.3,0.4,0.2$, pair overlaps $0.1,0.05,0.08$, and triple overlap $0.02$ give union probability $0.69$.`;
e.body += r`

Check the difference between a constraint and a complete specification. Saying two events have probabilities $0.2$ and $0.3$ supplies two numbers, but their four-region table still needs an overlap. Setting that overlap to zero gives union $0.5$; setting it to $0.2$ gives union $0.3$. Both tables can have nonnegative entries totaling one. Presenting these two explicit models is stronger than merely saying there is “not enough information”: it demonstrates which missing quantity changes the answer.`;
export default lesson(
  1,
  'probability-models-events',
  'Probability Models and Events',
  r`A probability calculation connects a clearly described experiment to a number between zero and one. This lesson establishes that connection before introducing formulas for repeated trials or inference. We will distinguish outcomes from events, translate verbal conditions into sets, and build consistent finite models. Familiar set notation from discrete mathematics helps, but every operation needed here is refreshed in context. The central habit is to specify what is recorded and why particular outcomes receive particular weights. Once that is clear, complements and overlap corrections turn many complicated descriptions into short calculations. When the supplied information is insufficient, we will describe what can still be bounded instead of inventing an assumption.`,
  [a, b, c, d, e],
);
