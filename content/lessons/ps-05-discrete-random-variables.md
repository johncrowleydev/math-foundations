# Discrete Random Variables

Random variables let us study numerical features without carrying every detail of the underlying experiment. We will construct probability mass functions, accumulate them into cumulative distribution functions, and translate inequalities carefully at discrete endpoints. Transformations such as counts, scores, absolute values, and indicators will show how probability moves when several outcomes share one numerical value. The same tools will support expectation, variance, and the named discrete models in the next lessons.

## A random variable records a numerical feature

A random variable is a real-valued function on the sample space: $X:\Omega\to\mathbb R$. It converts the detailed outcome into a numerical feature. The word random refers to uncertainty about the underlying outcome; the function itself has a fixed definition. Capital $X$ names the function, while lowercase $x$ usually denotes one possible numerical value.

For three binary inspection results, let $X$ count failures. Then $X(PFP)=1$ and $X(FFF)=3$. The event $\{X=1\}$ is shorthand for all underlying outcomes mapped to one: $\{FPP,PFP,PPF\}$. It is an event in the original sample space, not a new kind of probability object. Many outcomes can give the same value, so probabilities of those outcomes must be combined.

A discrete random variable has a finite or countably infinite collection of possible values. The values need not be integers: a cost taking values $0,2.5,7.5$ is discrete. A count can have infinitely many possible values, as with trials until a first success. We will reserve “support” here for values with positive probability. A function's full range can also include values reached only by probability-zero outcomes; this distinction avoids assuming every formally possible value has positive mass.

Choosing a variable depends on the question. The number of failures answers workload questions but loses station identity. A score can combine several features but loses information about their separate contributions. Two different random variables can have the same distribution, yet differ on individual outcomes. Keeping the function and its distribution separate will become essential when several variables are studied together.

Defining the variable explicitly prevents ambiguity about losses and gains. If a machine produces a numerical status code, that code is not automatically a measurement with meaningful arithmetic. A code of two may simply label a different state from a code of one, rather than representing twice a quantity. A count, duration, or specified payoff supplies the numerical meaning needed for later expectations. Probability can be assigned to either kind of label, but interpreting an average requires knowing what the numerical values stand for.

Related definitions: [Random variable](ref:probability-statistics-random-variable); [Discrete support](ref:probability-statistics-discrete-support).

## Construct and check a probability mass function

The probability mass function, or PMF, is $p_X(x)=P(X=x)$. For a discrete distribution its masses are nonnegative and sum to one. We set $p_X(x)=0$ outside the support. To find the probability of any collection of values, add their masses: $P(X\in A)=\sum_{x\in A}p_X(x)$. These are the same additivity rules as before, applied to disjoint value events.

Suppose a repair count $X$ takes values $0,1,2,3$ with masses $0.2,0.4,0.3,0.1$. The chance of at least two repairs is $0.3+0.1=0.4$. The chance of fewer than two is $0.2+0.4=0.6$. Both computations can be checked by complements. A PMF table should state both the values and the masses; a bare list of probabilities leaves the value assignment unclear.

Sometimes normalization determines an unknown constant. If $p_X(k)=ck$ for $k=1,2,3,4$, then $c(1+2+3+4)=1$, hence $c=1/10$. All four masses are nonnegative, so the normalized formula is valid. Solving only the sum condition is insufficient if some resulting masses are negative. For an infinite support, the normalization check is an infinite series, not a finite truncation.

For example, $p_X(k)=2/3^k$ on positive integers is valid because $\sum_{k=1}^{\infty}2/3^k=1$. This uses the geometric-series result from calculus. A finite partial sum is less than one because it omits a positive tail, not because the model is defective. Conversely, assigning the same positive mass to every positive integer cannot normalize: its partial sums grow without bound.

Related definitions: [Probability mass function](ref:probability-statistics-pmf).

![Heights are probability masses](figure:probability-statistics-figure-5-pmf)

## Accumulate mass into a CDF

The cumulative distribution function is $F_X(t)=P(X\leq t)$ for every real threshold $t$. For a discrete variable, sum every mass at or below the threshold. The CDF therefore answers a threshold question, whereas the PMF answers an exact-value question. The CDF's argument need not itself be a support value.

Let $X$ have masses $1/4,1/2,1/4$ at $-1,1,4$. Then $F_X(t)=0$ for $t<-1$, equals $1/4$ for $-1\leq t<1$, equals $3/4$ for $1\leq t<4$, and equals one for $t\geq4$. At $t=1$, the mass at one is already included, so $F_X(1)=3/4$. Between one and four no new mass is encountered, leaving the CDF flat. Open and closed endpoints matter.

Every CDF is nondecreasing, is right-continuous, and approaches zero and one at the two infinite ends. In the finite discrete examples, right-continuity means the filled point at a jump belongs to the upper step. The jump size at a value $x$ is $F_X(x)-F_X(x^-)=p_X(x)$, where $F_X(x^-)$ denotes the limit from the left. The jump can be zero at values with no mass.

A PMF and a CDF contain the same distributional information, presented differently. A PMF makes individual masses easy to compare; a CDF makes threshold and interval questions easy to answer. To recover a finite-support PMF, subtract consecutive cumulative levels rather than treating those levels as masses. Summing CDF heights usually has no probability interpretation and can easily exceed one.

The nondecreasing property has a direct event proof. If $s<t$, every outcome satisfying $X\leq s$ also satisfies $X\leq t$. Monotonicity of probability therefore gives $F_X(s)\leq F_X(t)$. At a finite support point, the difference between the value and the lower step is exactly the newly included singleton event. These facts explain the staircase picture rather than merely prescribing how to draw it. They also provide quick rejection tests: a descending step or a level above one cannot represent a CDF.

Related definitions: [Cumulative distribution function](ref:probability-statistics-cdf); [CDF jump](ref:probability-statistics-cdf-jump).

![A CDF accumulates the point masses](figure:probability-statistics-figure-5-cdf)

## Intervals, tails, and endpoint discipline

The identity $P(a<X\leq b)=F_X(b)-F_X(a)$ follows by subtracting the smaller threshold event from the larger one. It excludes mass at $a$ and includes mass at $b$. For discrete distributions, changing either endpoint can change the result. The formula $P(X>t)=1-F_X(t)$ uses the complement of “at most”; the complement of “at least” is strictly less.

For integer-valued $X$, the formulas simplify: $P(X\geq k)=1-F_X(k-1)$ and $P(a\leq X\leq b)=F_X(b)-F_X(a-1)$ for integer endpoints. These shifts use integer support. They cannot be copied unchanged to a distribution whose values are $0,0.5,1.5$, or to a continuous variable. Translate the inequality into included support values first.

Suppose masses at $0,1,2,3$ are $0.1,0.2,0.4,0.3$. Then $P(1<X\leq3)=0.7$, but $P(1\leq X\leq3)=0.9$. The difference is the $0.2$ mass at one. Likewise $P(X>2)=0.3$ whereas $P(X\geq2)=0.7$. A sketch of the PMF with qualifying values marked is a useful independent check on any CDF subtraction.

Conditioning on a range combines the new distribution notation with the earlier conditional rule. In this model, $P(X=2\mid X\geq1)=0.4/0.9=4/9$. The retained masses at one, two, and three are divided by $0.9$ and sum to one. Such conditioning is not a new distribution law; it is the same restriction and renormalization used for events. Keep strictness at the retained boundary explicit.

An infinite-support tail need not require an infinite calculation. For $p_X(k)=2/3^k$ on positive integers, $P(X>m)=3^{-m}$ for nonnegative integer $m$, obtained by summing a geometric tail or subtracting the finite partial sum. Thus $P(2<X\leq4)=P(X>2)-P(X>4)=1/9-1/81=8/81$. The two tail events are nested, so their difference retains exactly values three and four. Directly adding $2/27+2/81$ gives the same result and checks the endpoint interpretation.

Related definitions: [Tail probability](ref:probability-statistics-tail-probability).

## Transform values and combine their masses

If $Y=g(X)$, then $Y$ is another random variable. To find its mass at $y$, identify every original value mapped to $y$ and add their masses: $p_Y(y)=\sum_{x:g(x)=y}p_X(x)$. This is a preimage calculation. The transformation changes values, while probability is transferred from the original events. No derivative or change-of-variable factor is needed for a discrete PMF.

Let $X$ take $-2,-1,0,1,2$ with masses $0.1,0.2,0.3,0.1,0.3$. For $Y=X^2$, the support becomes $\{0,1,4\}$. The mass at zero is $0.3$; at one it is $0.2+0.1=0.3$; at four it is $0.1+0.3=0.4$. Squaring merges the negative and positive values with the same magnitude. These new masses sum to one, providing a check that no preimage was omitted or counted twice.

An affine transformation $Y=aX+b$ with $a\ne0$ is one-to-one, so each transformed value retains its original mass. If $a<0$, the order reverses, which matters for CDF thresholds. If $a=0$, all outcomes merge into the constant $b$ with probability one. Threshold indicators are another useful transformation: $I=1$ when $X$ exceeds a threshold and zero otherwise. Its mass at one is the corresponding tail probability.

Transforming a distribution is different from transforming the probability numbers. For example, $P(X^2=4)$ is not $P(X=2)^2$; it combines $X=2$ and $X=-2$. This distinction anticipates the next lesson: the average of $g(X)$ is generally not $g$ applied to the average of $X$. We will use these transformed-value tables to compute expectations and quantify spread.

Related definitions: [Transformed random variable](ref:probability-statistics-transformed-variable).
