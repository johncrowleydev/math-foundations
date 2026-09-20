# Conditional Probability and Independence

New information changes which outcomes remain relevant. This lesson turns that idea into conditional probability, uses tables and trees to keep denominators clear, and separates independence from disjointness. We will calculate probabilities along dependent histories, test independence from supplied data, and see why two independent observations can become dependent after selection. The previous lessons supply event notation and finite counting; those tools now support careful questions about what is known and what is still uncertain.

## Conditioning changes the reference population

A conditional probability answers a question after information restricts the possibilities. The notation $P(A\mid B)$ means the probability of $A$ given that $B$ occurred. The event after the vertical bar is the information being used, not another event to be multiplied automatically. When $P(B)>0$, the definition is $P(A\mid B)=P(A\cap B)/P(B)$.

The numerator retains the outcomes satisfying both the question and the information. Dividing by $P(B)$ rescales the retained probability to total one. Suppose an equally weighted collection has $40$ records. Of $16$ records tagged $B$, $10$ are also tagged $A$. Then $P(A\mid B)=10/16=5/8$, whereas $P(A\cap B)=10/40=1/4$. The same ten records appear in the numerator, but the reference population changes. A conditional proportion and a joint proportion answer different questions.

For a fair die, knowing the face is greater than two leaves $\{3,4,5,6\}$. The chance it is even is therefore $2/4=1/2$. This counting shortcut works because the retained outcomes remain equally likely. With unequal original weights, conditioning retains their relative weights; it does not flatten them. We must divide the retained event weight by the total retained weight.

The elementary definition does not assign a value when $P(B)=0$. Saying the answer is zero confuses an undefined ratio with an impossible event. Continuous conditioning will require a different construction later. For now, every numerical conditional problem specifies a positive-probability conditioning event. Check this condition before simplifying. It is part of the mathematical meaning, not a minor technical exception.

Related definitions: [Conditional probability](ref:probability-statistics-conditional-probability); [Joint event probability](ref:probability-statistics-joint-event-probability).

![Conditioning changes the reference set](figure:probability-statistics-figure-3)

## Read tables and multiply along a history

A two-way table makes conditioning concrete. Suppose a collection has $12$ records in both $A,B$, $18$ in $A$ only, $8$ in $B$ only, and $22$ in neither. The total is $60$. Then $P(A\mid B)=12/20=3/5$, while $P(B\mid A)=12/30=2/5$. Reversing the bar changes the denominator, so these probabilities need not agree.

Rearranging the definition gives the multiplication rule $P(A\cap B)=P(B)P(A\mid B)$. This rule is always available when the conditional is defined; it does not require independence. For three events, $P(A\cap B\cap C)=P(A)P(B\mid A)P(C\mid A\cap B)$, with positive conditioning probabilities. Each factor describes the next requirement given the accumulated history. A probability tree labels branches with these conditional probabilities. Multiply along a complete path, then add disjoint paths for an event with several histories.

For example, a bag contains four red and two blue tokens. Drawing two uniformly without replacement, the probability of red then blue is $(4/6)(2/5)=4/15$. After a red draw, the remaining total is five while two blue tokens remain. Blue then red has probability $(2/6)(4/5)=4/15$. Exactly one of each has probability $8/15$ because the two histories are disjoint.

A branch probability is not generally the unconditional probability of its label. The second draw being blue has unconditional probability $2/6$, but given that the first was red it has probability $2/5$. Keeping the history visible avoids using the wrong denominator. When later choices depend on earlier observations, the chain rule remains valid even though simple multiplication of unchanged marginal probabilities fails.

Related definitions: [Probability multiplication rule](ref:probability-statistics-multiplication-rule); [Probability tree](ref:probability-statistics-probability-tree).

## Independence is a testable factorization

Events $A$ and $B$ are independent when $P(A\cap B)=P(A)P(B)$. For $P(B)>0$, this is equivalent to $P(A\mid B)=P(A)$. Within the model, learning whether $B$ occurred does not change the probability of $A$. The product definition is symmetric and also handles zero-probability events without dividing by zero.

Consider a uniform choice from $\{1,2,3,4,5,6,7,8\}$. Let $A$ mean even and $B$ mean at most four. Each has probability $1/2$, and their intersection $\{2,4\}$ has probability $1/4$. They are independent even though both concern the same chosen number. Independence is a property of the event probabilities, not a requirement that the descriptions refer to physically separate objects.

By contrast, two disjoint events of positive probability are dependent. Their intersection probability is zero while the product of their positive marginal probabilities is positive. Observing one completely rules out the other. “Cannot both happen” therefore describes a strong form of dependence, not independence. An event is independent of itself only if its probability is zero or one, since $p=p^2$ has only those solutions in $[0,1]$.

Independence is preserved by taking complements. Indeed, $P(A\cap B^c)=P(A)-P(A\cap B)=P(A)(1-P(B))$. This equals $P(A)P(B^c)$. The other complement combinations follow similarly. It lets us calculate “neither” and “exactly one” using independent failure or success events. When independence is not supplied by a model or established by a table, state the missing information rather than multiplying as a default.

Related definitions: [Independent events](ref:probability-statistics-independent-events).

## Repeated trials and mutual independence

For more than two events, independence requires more than checking pairs. Mutual independence means that the probability of every intersection of any selected subcollection equals the product of its marginal probabilities. For three events this includes all three pair equations and the triple equation. Pairwise independence checks only the pair equations.

A small counterexample uses two independent fair bits $X,Y$. Let $A$ mean $X=1$, $B$ mean $Y=1$, and $C$ mean the bits agree. Each event has probability $1/2$. Each pair overlaps in one of the four equally likely outcomes, so every pair intersection has probability $1/4$. But all three events occur at $11$, with probability $1/4$, whereas the product of all three marginals is $1/8$. Thus pairwise independence does not justify multiplying three probabilities.

When repeated trials are modeled as mutually independent, a complete outcome pattern has probability equal to the product of the individual trial probabilities. Three independent attempts with success probabilities $0.5,0.6,0.8$ all fail with probability $0.5\cdot0.4\cdot0.2=0.04$. At least one succeeds with probability $0.96$. Equal success probabilities are not required for independence; identical probabilities are a separate assumption used by the binomial model later.

A process does not acquire independence merely because it is repeated. Sampling without replacement changes the pool. A shared operating condition can influence several attempts. An adaptive rule can depend on earlier results. Specify the independence assumption when it is a deliberate approximation, and use conditional probabilities when dependence is part of the supplied model. Repeated observations alone do not establish it.

Related definitions: [Mutual independence](ref:probability-statistics-mutual-independence); [Pairwise independence](ref:probability-statistics-pairwise-independence).

## Conditioning, selection, and causal restraint

Conditioning describes the distribution within a specified information set. It does not by itself describe what would happen if we intervened to change a variable. If $P(A\mid B)>P(A)$, the events are associated in the model, but the inequality alone does not establish that making $B$ happen would cause $A$. A common condition, selection rule, or reverse relationship may account for the association.

Even independent events can become dependent after information is supplied. Toss two independent fair coins and condition on at least one head. The retained outcomes are $HH,HT,TH$, each with conditional probability $1/3$. Each coin then has conditional head probability $2/3$, while both-head probability is $1/3$, not $(2/3)^2$. Learning that one coin is tails forces the other to be heads within the retained group. The selection rule has changed the relationships among the events.

Conditional independence means independence within a stated conditioning event. For $P(C)>0$, it requires $P(A\cap B\mid C)=P(A\mid C)P(B\mid C)$. This is a separate claim from unconditional independence. A common hidden setting can make observations independent within each setting but dependent when settings are mixed; the next lesson's total-probability calculations will make that mixture explicit.

When solving a problem, write the entire conditioning event in the denominator and retain it through every step. “At least one head” differs from “the first coin is heads,” even though both imply a head exists. Information about how an outcome was selected or reported can therefore change the relevant event. A well-specified probability question describes that reporting mechanism; if it does not, explain the ambiguity and show what additional information would settle the calculation.

The selection example can be checked with a complete conditional table. Under at least one head, both-head probability is $1/3$, first-only-head probability is $1/3$, second-only-head probability is $1/3$, and neither has probability zero. Each conditional marginal is $2/3$, so the product test gives $4/9$ rather than the actual intersection $1/3$. The mismatch is numerical evidence of dependence within the selected population. By contrast, conditioning on the first coin being heads leaves that first head event certain; it is then independent of every event under the conditional model because its probability is one. These two forms of conditioning both involve a head, but they retain different outcome sets and lead to different probability relationships. Describing the retained population is therefore an essential part of any interpretation.

Related definitions: [Conditional independence of events](ref:probability-statistics-conditional-independence-events).
