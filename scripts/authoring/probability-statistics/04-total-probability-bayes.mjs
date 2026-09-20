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
const total = citation(
  'pn-1-4-2',
  'pishro-nik',
  '§1.4.2 Law of Total Probability',
  'https://www.probabilitycourse.com/chapter1/1_4_2_total_probability.php',
  'Partitioning an event and weighting conditional probabilities by partition probabilities.',
);
const bayes = citation(
  'pn-1-4-3',
  'pishro-nik',
  "§1.4.3 Bayes' Rule",
  'https://www.probabilitycourse.com/chapter1/1_4_3_bayes_rule.php',
  'Bayes rule, normalization, reverse conditioning, and base-rate effects.',
);
const a = section(
  'Total probability is a weighted average',
  r`A partition divides the sample space into disjoint cases that cover all possibilities. If $B_1,\ldots,B_m$ form a partition with positive probabilities, every occurrence of $A$ belongs to exactly one event $A\cap B_i$. Additivity and the multiplication rule therefore give $P(A)=\sum_iP(A\mid B_i)P(B_i)$. This is the law of total probability. A zero-probability case contributes zero joint probability and can be omitted without trying to define its conditional ratio.

Suppose a request is routed to server $U$ with probability $0.7$ and server $V$ with probability $0.3$. The conditional timeout probabilities are $0.02$ and $0.08$. The overall timeout probability is $0.7(0.02)+0.3(0.08)=0.038$. The two products are joint probabilities for disjoint histories: routed to $U$ and timeout, or routed to $V$ and timeout. Adding the bare conditional probabilities, $0.02+0.08$, would count rates without their population weights.

This weighted-average interpretation gives a useful check. The overall probability must lie between the smallest and largest conditional probabilities, because the nonnegative weights sum to one. Equal averaging is valid only when the cases have equal probabilities, or when numerical coincidence makes it agree. A small group with a large rate need not dominate the total.

A partition need not describe a temporal first stage. It may classify records by source, divide a population into categories, or enumerate competing hypotheses. The essential properties are disjointness and coverage. If categories overlap, adding their contributions double-counts some outcomes. If a category is omitted, part of the event probability disappears. A table of case weights and conditional rates makes both mistakes visible before the arithmetic starts.`,
  [total],
  [
    termEntry(
      'total-probability',
      'Law of total probability',
      'Average conditional probabilities across a partition.',
      r`$P(A)=\sum_iP(A\mid B_i)P(B_i)$ for positive-probability partition pieces.`,
      r`Server timeout rates $0.02,0.08$ with weights $0.7,0.3$ yield $0.038$.`,
      'Conditional rates must be multiplied by the probabilities of their cases.',
    ),
  ],
);
a.questions = [
  q(
    r`A source is $U$ with probability $0.6$ and $V$ otherwise. Success rates are $0.9$ for $U$ and $0.5$ for $V$. Find overall success probability.`,
    r`Weight the rates: $0.6(0.9)+0.4(0.5)=0.74=37/50$.`,
    exact('37/50'),
  ),
  q(
    r`A source is $U$ with probability $0.6$ and $V$ otherwise. Success rates are $0.9$ under $U$ and $0.5$ under $V$. Find the joint probability of source $V$ and success.`,
    r`The $V$ branch contributes $0.4(0.5)=0.2=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`A source is $U$ with probability $0.6$ and $V$ otherwise. Success rates are $0.9$ under $U$ and $0.5$ under $V$. Find overall failure probability.`,
    r`Take the complement of success: $1-37/50=13/50$.`,
    exact('13/50'),
  ),
  q(
    r`Three partition weights are $1/2,1/3,1/6$, with event rates $1/5,2/5,3/5$. Find the event probability.`,
    r`The weighted sum is $1/10+2/15+1/10=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Two equally likely cases have event rates $0.3$ and $0.7$. Find the event probability.`,
    r`Equal weights give $(0.3+0.7)/2=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A partition has weights $0.2,0.5,0.3$. An event occurs only in the last case, where its conditional probability is $0.4$. Find its probability.`,
    r`The first two contributions vanish, leaving $0.3(0.4)=0.12=3/25$.`,
    exact('3/25'),
  ),
  q(
    r`True or false: a weighted average of conditional probabilities $0.2$ and $0.6$ can equal $0.8$.`,
    r`False. Nonnegative weights summing to one keep the average between $0.2$ and $0.6$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why total probability does not require the event $A$ to be independent of the partition cases.`,
    r`Each conditional rate $P(A\mid B_i)$ can differ. The multiplication rule uses that dependence explicitly when forming each joint contribution.`,
  ),
  q(
    r`An event has rate $0.4$ within every positive-probability partition piece. Find its overall probability.`,
    r`The common rate factors out: $0.4\sum_iP(B_i)=0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Prove the finite law of total probability from a partition.`,
    r`The sets $A\cap B_i$ are disjoint and have union $A$. Therefore $P(A)=\sum_iP(A\cap B_i)=\sum_iP(A\mid B_i)P(B_i)$, using additivity and the conditional definition.`,
    undefined,
    'prove',
  ),
];
a.review = [
  q(
    r`Case probabilities are $3/4,1/4$ and event rates $2/3,1/5$. Find the overall rate.`,
    r`The weighted sum is $(3/4)(2/3)+(1/4)(1/5)=1/2+1/20=11/20$.`,
    exact('11/20'),
  ),
  q(
    r`Three equally likely sources have error rates $0.01,0.04,0.07$. Find the overall error probability.`,
    r`Average the three rates: $(0.01+0.04+0.07)/3=0.04=1/25$.`,
    exact('1/25'),
  ),
  q(
    r`Why must overlapping source categories be refined before using them as a total-probability partition?`,
    r`An outcome lying in two categories would contribute twice. Refining into disjoint membership patterns preserves each outcome exactly once.`,
  ),
];
a.quickCheck = quick(
  r`A large group has weight $0.9$ and event rate $0.1$; a small group has weight $0.1$ and rate $0.9$. What is the overall rate?`,
  [r`$0.5$`, r`$0.18$`, r`$1$`],
  1,
  r`Both group contributions equal $0.09$, giving total probability $0.18$.`,
  [
    r`This averages the two rates equally and ignores the unequal group weights.`,
    r`The weighted sum is $0.9(0.1)+0.1(0.9)=0.18$.`,
    r`Adding the two conditional rates does not form an overall probability; each must be weighted by its group's share.`,
  ],
);
const b = section(
  'Reverse the question with Bayes rule',
  r`Total probability moves from case-specific behavior to an overall observation probability. Bayes rule asks the reverse question: after observing $E$, how should the case probabilities change? Starting from $P(B_i\cap E)=P(E\mid B_i)P(B_i)$ and dividing by $P(E)>0$ gives $P(B_i\mid E)=P(E\mid B_i)P(B_i)/P(E)$.

The prior $P(B_i)$ describes the case before the new evidence. The likelihood $P(E\mid B_i)$ describes how compatible that evidence is with the case. Their product is an unnormalized joint weight. The denominator is the sum of those products over the partition, so the posterior probabilities sum to one. A likelihood is not generally a probability distribution over hypotheses: its values need not add to one when the hypothesis varies.

Return to servers $U,V$ with routing probabilities $0.7,0.3$ and timeout rates $0.02,0.08$. Their timeout contributions are $0.014$ and $0.024$. Given a timeout, the posterior probability of server $V$ is $0.024/0.038=12/19$. Although $V$ receives fewer requests, its larger timeout rate makes it more common among timed-out requests. The denominator includes both possible timeout sources, not all requests and not only the selected source.

A practical calculation keeps a short row for each case: prior, likelihood, product, normalized product. Preserve exact products until the final normalization; rounding a small contribution early can noticeably change a posterior. Check that the normalized entries are nonnegative and sum to one. If every product is zero, the model assigns the observation probability zero, so this elementary update is undefined rather than a license to divide by zero.`,
  [bayes, total],
  [
    termEntry(
      'prior',
      'Prior probability',
      'A case probability before the specified new evidence.',
      r`$P(B_i)$ in a Bayes update.`,
      r`A source selected with probability $0.3$ has prior $0.3$.`,
      'Prior means before this evidence, not necessarily before all knowledge.',
    ),
    termEntry(
      'likelihood-event',
      'Likelihood of evidence',
      'Probability of the observed evidence under a case.',
      r`For observed event $E$, the likelihood under $B_i$ is $P(E\mid B_i)$.`,
      r`A timeout rate $0.08$ is the timeout likelihood under its server.`,
      'Likelihoods over cases need not sum to one.',
    ),
    termEntry(
      'posterior',
      'Posterior probability',
      'A case probability after conditioning on evidence.',
      r`$P(B_i\mid E)=P(E\mid B_i)P(B_i)/P(E)$.`,
      r`The timeout example gives posterior $12/19$ for server $V$.`,
      'Reverse conditioning requires the prior and the normalization denominator.',
    ),
  ],
);
b.questions = [
  q(
    r`Cases $A,B$ have priors $1/3,2/3$ and evidence likelihoods $3/4,1/4$. Find the evidence probability.`,
    r`The joint weights are $1/4$ and $1/6$, totaling $5/12$.`,
    exact('5/12'),
  ),
  q(
    r`Cases $A,B$ have priors $1/3,2/3$ and evidence likelihoods $P(E\mid A)=3/4$, $P(E\mid B)=1/4$. Find $P(A\mid E)$.`,
    r`Normalize the $A$ weight: $(1/4)/(5/12)=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Cases $A,B$ have priors $1/3,2/3$ and evidence likelihoods $P(E\mid A)=3/4$, $P(E\mid B)=1/4$. Find $P(B\mid E)$.`,
    r`The $B$ weight is $1/6$, so the posterior is $(1/6)/(5/12)=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Equally likely hypotheses have likelihoods $0.2,0.6,0.4$. Find the posterior of the second hypothesis.`,
    r`Equal priors cancel, leaving $0.6/(0.2+0.6+0.4)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A hypothesis has prior $0.2$, evidence likelihood $0.5$, and evidence probability $0.25$. Find its posterior.`,
    r`Bayes rule gives $0.2(0.5)/0.25=0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Two unnormalized posterior weights are $0.03$ and $0.07$. Give their normalized values as a pair.`,
    r`Their total is $0.10$, so the posterior pair is $(3/10,7/10)$.`,
    tuple(['3/10', '7/10']),
  ),
  q(
    r`True or false: likelihood values $0.8$ and $0.7$ for two hypotheses are invalid because they sum above one.`,
    r`False. Each is a probability under a different conditioning hypothesis. They need not sum to one over hypotheses.`,
    truth(false),
    'interpret',
  ),
  q(
    r`An event has the same positive likelihood under every hypothesis in a partition. Explain why the posterior equals the prior.`,
    r`The common likelihood cancels between numerator and denominator. Since the priors sum to one, the denominator is just that common likelihood.`,
  ),
  q(
    r`A case has prior zero and the observed evidence has positive overall probability. Find that case's posterior.`,
    r`The joint event is contained in a probability-zero case, so its joint probability is zero by monotonicity. Dividing by the positive evidence probability gives posterior $0$.`,
    exact('0'),
  ),
  q(
    r`Explain what fails when the model gives $P(E)=0$ but $E$ is reported.`,
    r`The elementary conditional update has zero denominator. One must reconsider the model or the representation of evidence; the formula supplies no posterior value.`,
  ),
];
b.review = [
  q(
    r`Two hypotheses have priors $0.8,0.2$ and likelihoods $0.1,0.6$. Find the second posterior.`,
    r`Their weights are $0.08$ and $0.12$, so the second posterior is $0.12/0.20=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Three unnormalized weights are $2,3,5$. Find the first posterior after normalization.`,
    r`Their sum is ten, so the first posterior is $2/10=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`Explain why the prior is multiplied by the likelihood before normalization.`,
    r`The product is the joint probability of the hypothesis and evidence. Conditioning divides each such joint contribution by the total probability of the evidence.`,
  ),
];
const c = section(
  'Base rates and screening tables',
  r`A rare category can remain uncommon among positive signals even when the signal is much more likely in that category. The reason is arithmetic: a large background population can contribute many false signals. This is the base-rate effect, and it is most transparent in a hypothetical population table.

Suppose two percent of manufactured items are defective. A flag appears on $90\%$ of defective items and $5\%$ of nondefective items. In a hypothetical collection of $10{,}000$ items, the model allocates $200$ defective items and $9{,}800$ nondefective items. It then allocates $180$ flagged defective items and $490$ flagged nondefective items. These are model-based expected counts, not a promise about an actual batch. Among the $670$ flagged items, the defective fraction is $180/670=18/67$, far below $90\%$.

Sensitivity denotes $P(+\mid D)$, the positive-signal probability in the target category. Specificity denotes $P(-\mid D^c)$, the negative-signal probability outside it. The false-positive rate is $1-\text{specificity}$, while the false-negative rate is $1-\text{sensitivity}$. The positive predictive probability is $P(D\mid+)$ and depends on the base rate as well as those conditional rates. These terms describe a supplied classification model here; they do not provide advice about real screening decisions.

A negative result has its own Bayes calculation. In the same model, the defective-and-negative weight is $0.02(0.10)=0.002$, and the negative probability is $0.002+0.98(0.95)=0.933$. Thus $P(D\mid-)=2/933$. Do not confuse a negative result with logical impossibility. Both positive and negative updates require all compatible paths and the correct denominator.`,
  [bayes, total],
  [
    termEntry(
      'base-rate',
      'Base rate',
      'The overall prevalence of a category before the signal.',
      r`The prior $P(D)$ in a screening model.`,
      r`Two percent defective means base rate $0.02$.`,
      'Signal accuracy alone does not determine the posterior.',
    ),
    termEntry(
      'sensitivity',
      'Sensitivity',
      'Positive-signal probability within the target category.',
      r`$P(+\mid D)$.`,
      r`Flagging $90\%$ of defective items gives sensitivity $0.9$.`,
      'It is not the probability an item is defective given a flag.',
    ),
    termEntry(
      'specificity',
      'Specificity',
      'Negative-signal probability outside the target category.',
      r`$P(-\mid D^c)$.`,
      r`False-positive rate $0.05$ corresponds to specificity $0.95$.`,
      'Specificity complements the false-positive rate, not sensitivity.',
    ),
  ],
);
c.questions = [
  q(
    r`A flag has specificity $0.96$. Find its false-positive rate.`,
    r`The rate is $1-0.96=0.04=1/25$.`,
    exact('1/25'),
  ),
  q(
    r`A flag has sensitivity $0.85$. Find its false-negative rate.`,
    r`The rate is $1-0.85=0.15=3/20$.`,
    exact('3/20'),
  ),
  q(
    r`The defect base rate is $0.1$, sensitivity $0.8$, and false-positive rate $0.2$. Find the flag probability.`,
    r`Total probability gives $0.1(0.8)+0.9(0.2)=0.26=13/50$.`,
    exact('13/50'),
  ),
  q(
    r`The defect base rate is $0.1$, sensitivity is $0.8$, and false-positive rate is $0.2$. Find the defect probability given a flag.`,
    r`The defective-and-flagged weight is $0.08$, so the posterior is $0.08/0.26=4/13$.`,
    exact('4/13'),
  ),
  q(
    r`The defect base rate is $0.1$, sensitivity is $0.8$, and false-positive rate is $0.2$. Find the defect probability given no flag.`,
    r`The defective-and-unflagged weight is $0.02$ and no-flag probability is $0.74$, giving $1/37$.`,
    exact('1/37'),
  ),
  q(
    r`A model has $100$ target and $900$ nontarget items. Its rates imply $90$ target flags and $45$ nontarget flags. Find the target fraction among flags.`,
    r`There are $135$ flags, so the target fraction is $90/135=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`A collection has one hundred target and nine hundred nontarget items; there are ninety target flags and forty-five nontarget flags. Find the false-positive rate.`,
    r`False positives are $45$ of the $900$ nontarget items, giving $45/900=1/20$.`,
    exact('1/20'),
  ),
  q(
    r`True or false: sensitivity $0.99$ alone determines the target probability after a positive signal.`,
    r`False. The base rate and the positive-signal rate outside the target category are also needed.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why increasing the base rate while holding positive likelihoods fixed increases the positive posterior, when both likelihoods are positive.`,
    r`The target joint weight grows while the nontarget joint weight shrinks. Since both likelihoods are positive, the target contribution becomes a larger fraction of their total, so its normalized posterior increases.`,
  ),
  q(
    r`A target has prior $1/5$, sensitivity $1$, and false-positive rate $0$. Find its posterior given a positive result.`,
    r`Only target items can produce a positive result, so the posterior is $1$. The evidence has positive probability $1/5$.`,
    exact('1'),
  ),
];
c.review = [
  q(
    r`A target has prior $0.05$, sensitivity $0.8$, and false-positive rate $0.04$. Find its positive posterior.`,
    r`The target weight is $0.04$ and background weight is $0.95(0.04)=0.038$, giving $0.04/0.078=20/39$.`,
    exact('20/39'),
  ),
  q(
    r`A model gives $30$ target positives and $70$ nontarget positives. Find the probability a positive is nontarget.`,
    r`Seventy of the hundred positives are nontarget, so the probability is $7/10$.`,
    exact('7/10'),
  ),
  q(
    r`Explain the denominator difference between false-positive rate and probability of a false alarm given a positive.`,
    r`The false-positive rate conditions on nontarget items. The false-alarm posterior conditions on all positive signals. Those reference groups generally have different sizes.`,
  ),
];
c.quickCheck = quick(
  r`A flag catches $95\%$ of defective items. Which additional information is needed to find the defect probability among flagged items?`,
  [
    r`Only the number of items inspected.`,
    r`The defect base rate and false-positive rate.`,
    r`No additional information; the answer is $95\%$.`,
  ],
  1,
  r`The posterior compares target and nontarget contributions to all flags.`,
  [
    r`A sample size alone does not specify how many flags arise from defective and nondefective items.`,
    r`These rates determine the two joint contributions that must be normalized.`,
    r`The $95\%$ conditions on defective items; the question conditions on flagged items, reversing the denominator.`,
  ],
);
const d = section(
  'Odds and sequential evidence',
  r`For an event with probability $p$ strictly between zero and one, its odds against its complement are $p/(1-p)$. Odds of $3$ to $1$ correspond to probability $3/4$, not probability three. The inverse conversion is $p=o/(1+o)$ for odds value $o$. Odds provide a compact way to compare two complementary hypotheses.

Dividing their Bayes formulas cancels the common evidence denominator: $P(H\mid E)/P(H^c\mid E)=[P(H)/P(H^c)]\,[P(E\mid H)/P(E\mid H^c)]$. The second ratio is the likelihood ratio. A value above one favors $H$ relative to its complement; a value below one favors the complement. A ratio of one leaves the prior odds unchanged. These statements compare probabilities within a specified model, without claiming certainty.

Suppose prior odds are $1$ to $4$ and an observed signal has likelihood ratio $6$. Posterior odds are $6/4=3/2$, giving posterior probability $3/5$. A large likelihood ratio can overcome prior odds against a hypothesis, but it need not do so. For a much smaller prior, the same evidence can leave the posterior below one half.

Sequential evidence requires attention to dependence. In general use $P(E_2\mid H,E_1)$ for the second likelihood. If $E_1,E_2$ are conditionally independent given each of $H,H^c$, then their likelihood ratios multiply. Without that assumption, two copies of the same observation do not provide twice the evidence. After observing an event, learning the identical event again changes nothing. This is a useful counterexample to mechanically multiplying repeated likelihoods.`,
  [bayes, total],
  [
    termEntry(
      'odds',
      'Odds',
      'Probability divided by its complementary probability.',
      r`For $0<p<1$, odds are $p/(1-p)$; probability is $o/(1+o)$.`,
      r`Probability $3/4$ gives odds $3:1$.`,
      'Odds and probability use different scales.',
    ),
    termEntry(
      'likelihood-ratio',
      'Likelihood ratio',
      'Relative compatibility of evidence under two cases.',
      r`$P(E\mid H)/P(E\mid H^c)$ when the denominator is positive.`,
      r`A ratio of six multiplies prior odds by six.`,
      'Repeated evidence ratios multiply only with the appropriate conditional likelihoods.',
    ),
  ],
);
d.questions = [
  q(
    r`Convert probability $2/5$ to odds as a numerical ratio.`,
    r`The odds are $(2/5)/(3/5)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Convert odds $5$ to $2$ into probability.`,
    r`The probability is $5/(5+2)=5/7$.`,
    exact('5/7'),
  ),
  q(
    r`Prior odds are $1/9$ and the evidence likelihood ratio is $3$. Find posterior odds.`,
    r`Multiply: $(1/9)3=1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Prior odds are $1/9$ and the evidence likelihood ratio is $3$. Find the posterior probability.`,
    r`Odds $1:3$ correspond to probability $1/(1+3)=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Evidence has likelihoods $0.6$ under $H$ and $0.15$ under $H^c$. Find the likelihood ratio.`,
    r`The ratio is $0.6/0.15=4$.`,
    exact('4'),
  ),
  q(
    r`Prior probability is $1/4$ and the likelihood ratio is $9$. Find the posterior probability.`,
    r`Prior odds are $1/3$, posterior odds are $3$, and posterior probability is $3/4$.`,
    exact('3/4'),
  ),
  q(
    r`Prior odds are one. Two signals are conditionally independent under each hypothesis and each has likelihood ratio two. Find the posterior probability after both.`,
    r`Posterior odds are $1\cdot2\cdot2=4$, so the probability is $4/5$.`,
    exact('4/5'),
  ),
  q(
    r`An event was already observed. The identical event is reported again without new information. What likelihood ratio does this second report contribute, assuming both posterior hypotheses have positive probability?`,
    r`Conditional on the existing evidence, the already-known event has probability one under either remaining hypothesis. The new ratio is $1/1=1$.`,
    exact('1'),
  ),
  q(
    r`Derive the odds form of Bayes rule from the two posterior formulas.`,
    r`Divide $P(E\mid H)P(H)/P(E)$ by $P(E\mid H^c)P(H^c)/P(E)$. The shared denominator cancels, leaving prior odds times the likelihood ratio.`,
  ),
  q(
    r`True or false: a likelihood ratio below one must make the posterior probability less than one half.`,
    r`False. It decreases the odds, but sufficiently large prior odds can still leave the posterior above one half.`,
    truth(false),
    'interpret',
  ),
];
d.review = [
  q(
    r`Prior probability is $2/3$ and evidence has likelihood ratio $1/4$. Find the posterior.`,
    r`Prior odds are $2$, updated odds are $1/2$, and probability is $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`Two conditionally independent signals have likelihood ratios $3$ and $5$ under complementary hypotheses. Starting from prior odds $1/10$, find posterior probability.`,
    r`Updated odds are $(1/10)3\cdot5=3/2$, so the posterior is $3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Why can multiplying likelihoods of highly redundant signals exaggerate evidence?`,
    r`It treats the second observation as if its conditional distribution were unaffected by the first. Redundant observations may contain little new information; their appropriate conditional likelihood ratio can be much closer to one.`,
  ),
];
const e = section(
  'Compare mechanisms and audit an update',
  r`The observation mechanism determines the likelihoods, so the same visible value can carry different information under different sampling rules. Suppose box $A$ contains two red and one blue token, while box $B$ contains one red and three blue tokens. Choosing a box uniformly and then a token uniformly gives $P(R)=(1/2)(2/3)+(1/2)(1/4)=11/24$. Given red, the box-$A$ posterior is $(1/3)/(11/24)=8/11$.

Pooling all seven tokens first and selecting one uniformly is a different experiment. Then the prior probability of a box-$A$ token is $3/7$, not $1/2$, and the red probability is $3/7$. Given red, two of the three red tokens originated in $A$, so the posterior is $2/3$. The difference is not a contradiction in Bayes rule; the priors encode different selection mechanisms.

Mixtures can also create dependence. Choose a hidden environment that makes repeated success probabilities high or low. Even if attempts are independent within each environment, observing a success shifts the posterior toward the high-success environment. The next success can therefore become more likely unconditionally. Total probability and Bayes rule describe the two directions of this reasoning without requiring a new formula: first weight each environment's behavior, then reweight environments after evidence.

Audit an update by checking the partition, translating each supplied rate with its conditioning bar, forming joint weights, and normalizing once. Interpret the result with the exact evidence stated. A posterior is a conclusion under the model and its assumptions. If the question asks about a different reporting rule, a changed population, or a new environment, determine which priors or likelihoods must change before reusing the earlier numerical answer.`,
  [bayes, total],
  [
    termEntry(
      'mixture-model',
      'Finite mixture model',
      'A probability model formed by weighting component models.',
      r`$P(E)=\sum_iP(E\mid B_i)P(B_i)$ with a latent or observed partition label.`,
      r`A hidden high-success or low-success environment determines conditional trial rates.`,
      'Independence within each component need not survive mixing.',
    ),
  ],
);
e.questions = [
  q(
    r`Choose one of two bags uniformly. Bag $A$ has three red and one blue; bag $B$ has one red and one blue. Select a token uniformly from the chosen bag. Find the red probability.`,
    r`The weighted rate is $(1/2)(3/4)+(1/2)(1/2)=5/8$.`,
    exact('5/8'),
  ),
  q(
    r`Choose a bag uniformly: bag $A$ has three red and one blue token; bag $B$ has one red and one blue. Then choose a token uniformly from that bag; let $R$ denote red. Find $P(A\mid R)$.`,
    r`The $A$ red contribution is $3/8$, so the posterior is $(3/8)/(5/8)=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Pool all tokens from bag $A$ (three red, one blue) and bag $B$ (one red, one blue), then choose a token uniformly. Find the probability the token is red.`,
    r`Four of the six tokens are red, so the probability is $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Pool all tokens from bag $A$ (three red, one blue) and bag $B$ (one red, one blue), then select a token uniformly. Given that the token is red, find the probability it came from bag $A$.`,
    r`Three of the four red tokens came from $A$, giving $3/4$.`,
    exact('3/4'),
  ),
  q(
    r`An environment is equally likely high or low. Independent conditional trials have success rates $3/4$ or $1/4$. Find the first-trial success probability.`,
    r`The mixture rate is $(1/2)(3/4)+(1/2)(1/4)=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`An environment is equally likely high or low. Conditional on that environment, trials are independent with success probability $3/4$ in high or $1/4$ in low. Find the probability both first two trials succeed.`,
    r`Within each environment multiply, then mix: $(1/2)(9/16)+(1/2)(1/16)=5/16$.`,
    exact('5/16'),
  ),
  q(
    r`An environment is equally likely high or low. Conditional on that environment, trials are independent with success probability $3/4$ in high or $1/4$ in low. Find the probability the second succeeds given the first succeeded.`,
    r`Divide the two-success probability by first success: $(5/16)/(1/2)=5/8$.`,
    exact('5/8'),
  ),
  q(
    r`An environment is equally likely high or low. Conditional on that environment, trials are independent with success probability $3/4$ in high or $1/4$ in low. Find the posterior probability of the high environment after one success.`,
    r`Its success weight is $3/8$ out of total $1/2$, giving $3/4$.`,
    exact('3/4'),
  ),
  q(
    r`An environment is equally likely high or low. Conditional on that environment, trials are independent with success probability $3/4$ in high or $1/4$ in low. Are the first two success events independent without conditioning on the environment?`,
    r`No. The joint probability $5/16$ differs from the marginal product $(1/2)^2=1/4$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why changing from uniform bag selection to uniform token selection can change a posterior.`,
    r`Unequal bag sizes give different probabilities of selecting each bag's token under pooling. Bayes rule uses these changed priors, so the normalized contributions can change even when each bag's internal color proportions stay fixed.`,
  ),
];
e.review = [
  q(
    r`A hidden setting has prior probabilities $1/3,2/3$ and conditional success probabilities $1,1/4$. Find the setting-one posterior after success.`,
    r`The contributions are $1/3$ and $1/6$, so the posterior is $(1/3)/(1/2)=2/3$.`,
    exact('2/3'),
  ),
  q(
    r`A hidden setting has prior probabilities $1/3,2/3$ and corresponding success probabilities $1,1/4$. Trials are conditionally independent within each setting. Find the probability of two successes.`,
    r`Mix the conditional joint probabilities: $(1/3)1+(2/3)(1/16)=1/3+1/24=3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Explain how to verify that a computed list of posterior probabilities was normalized correctly.`,
    r`Each posterior must be nonnegative, and their sum across the exhaustive disjoint hypotheses must be one. Reconstruct each entry by dividing its joint evidence weight by the same total evidence weight.`,
  ),
];
b.body += r`

For a three-case update, suppose priors are $1/2,1/3,1/6$ and evidence likelihoods are $1/5,3/5,3/5$. The products are $1/10,1/5,1/10$, totaling $2/5$. Posterior probabilities are therefore $1/4,1/2,1/4$. The first case was most probable beforehand but becomes less probable than the second after evidence. The third case has the same likelihood as the second, yet its smaller prior leaves a smaller posterior. Neither priors alone nor likelihoods alone decide the normalized ranking in general. Writing all three rows also checks that competing cases have not silently disappeared from the denominator.`;
e.body += r`

There is a useful consistency check across possible observations. If $E$ and $E^c$ both have positive probability, then $P(H)=P(H\mid E)P(E)+P(H\mid E^c)P(E^c)$. This is total probability applied with the observation as the partition. A posterior may increase after one result and decrease after another, but averaging over the model's result probabilities recovers the original prior. This identity does not say that each posterior equals the prior; it explains how the different possible updates fit one coherent joint model.`;
const conditionalIndependence = citation(
  'pn-1-4-4',
  'pishro-nik',
  '§1.4.4 Conditional Independence',
  'https://www.probabilitycourse.com/chapter1/1_4_4_conditional_independence.php',
  'Conditional independence within hypotheses and dependence after mixing.',
);
d.sources.push(conditionalIndependence);
e.sources.push(conditionalIndependence);
export default lesson(
  4,
  'total-probability-bayes',
  'Total Probability and Bayes Rule',
  r`Many probability problems become manageable after dividing them into cases. Total probability combines case-specific rates into an overall probability; Bayes rule reverses that calculation after evidence is observed. We will derive both rules from conditional probability, examine how base rates affect screening signals, and use odds to understand sequential updates. Every calculation will identify its partition and observation mechanism so that a changed denominator cannot hide behind familiar terminology.`,
  [a, b, c, d, e],
);
