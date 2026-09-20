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
const rv = citation(
  'pn-3-1-1',
  'pishro-nik',
  '§3.1.1 Random Variables',
  'https://www.probabilitycourse.com/chapter3/3_1_1_random_variables.php',
  'Random variables as real-valued functions of outcomes and their ranges.',
);
const discrete = citation(
  'pn-3-1-2',
  'pishro-nik',
  '§3.1.2 Discrete Random Variables',
  'https://www.probabilitycourse.com/chapter3/3_1_2_discrete_random_var.php',
  'Finite and countably infinite discrete value sets.',
);
const pmf = citation(
  'pn-3-1-3',
  'pishro-nik',
  '§3.1.3 Probability Mass Function',
  'https://www.probabilitycourse.com/chapter3/3_1_3_pmf.php',
  'Mass functions, normalization, and summing probabilities over values.',
);
const cdf = citation(
  'pn-3-2-1',
  'pishro-nik',
  '§3.2.1 Cumulative Distribution Function',
  'https://www.probabilitycourse.com/chapter3/3_2_1_cdf.php',
  'CDF construction, jumps, endpoint conventions, and interval probabilities.',
);
const transform = citation(
  'pn-3-2-3',
  'pishro-nik',
  '§3.2.3 Functions of Random Variables',
  'https://www.probabilitycourse.com/chapter3/3_2_3_functions_random_var.php',
  'Distribution of a transformed discrete variable by summing preimage masses.',
);
const a = section(
  'A random variable records a numerical feature',
  r`A random variable is a real-valued function on the sample space: $X:\Omega\to\mathbb R$. It converts the detailed outcome into a numerical feature. The word random refers to uncertainty about the underlying outcome; the function itself has a fixed definition. Capital $X$ names the function, while lowercase $x$ usually denotes one possible numerical value.

For three binary inspection results, let $X$ count failures. Then $X(PFP)=1$ and $X(FFF)=3$. The event $\{X=1\}$ is shorthand for all underlying outcomes mapped to one: $\{FPP,PFP,PPF\}$. It is an event in the original sample space, not a new kind of probability object. Many outcomes can give the same value, so probabilities of those outcomes must be combined.

A discrete random variable has a finite or countably infinite collection of possible values. The values need not be integers: a cost taking values $0,2.5,7.5$ is discrete. A count can have infinitely many possible values, as with trials until a first success. We will reserve “support” here for values with positive probability. A function's full range can also include values reached only by probability-zero outcomes; this distinction avoids assuming every formally possible value has positive mass.

Choosing a variable depends on the question. The number of failures answers workload questions but loses station identity. A score can combine several features but loses information about their separate contributions. Two different random variables can have the same distribution, yet differ on individual outcomes. Keeping the function and its distribution separate will become essential when several variables are studied together.`,
  [rv, discrete, pmf],
  [
    termEntry(
      'random-variable',
      'Random variable',
      'A numerical function of an uncertain outcome.',
      r`$X:\Omega\to\mathbb R$.`,
      r`A failure count maps $PFP$ to $1$.`,
      'The random variable is a function; its realized value is a number.',
    ),
    termEntry(
      'discrete-support',
      'Discrete support',
      'Values with positive probability mass.',
      r`The set $\{x:P(X=x)>0\}$ for a discrete distribution.`,
      r`A count of two fair heads has support $\{0,1,2\}$.`,
      'Discrete values need not be integers or equally likely.',
    ),
  ],
);
a.questions = [
  q(
    r`Let $X$ count failures in four reports. Find $X(FPPF)$.`,
    r`There are two failures, so $X(FPPF)=2$.`,
    exact('2'),
  ),
  q(
    r`How many values can the failure count in five reports take?`,
    r`The values are $0,1,2,3,4,5$, so there are $6$.`,
    exact('6'),
  ),
  q(
    r`Three independent fair coins define $X=$ number of heads. Find $P(X=1)$.`,
    r`Three ordered outcomes have one head among eight equally likely outcomes, so the probability is $3/8$.`,
    exact('3/8'),
  ),
  q(
    r`Three independent fair coins define $X=$ number of heads. Find $P(X=3)$.`,
    r`Only $HHH$ qualifies, so the probability is $1/8$.`,
    exact('1/8'),
  ),
  q(
    r`Three independent fair coins define $X=$ number of heads. Find $P(X\geq2)$.`,
    r`Three outcomes have two heads and one has three, giving $4/8=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`True or false: a variable taking values $0,0.5,1.5$ is discrete.`,
    r`True. Its value set is finite; integer spacing is not required.`,
    truth(true),
    'interpret',
  ),
  q(
    r`True or false: a discrete variable must have finitely many possible values.`,
    r`False. Countably infinite value sets are also discrete.`,
    truth(false),
    'interpret',
  ),
  q(
    r`A fair die defines $X=$ face and $Y=7-X$. Find $P(Y=2)$.`,
    r`The event $Y=2$ is $X=5$, so its probability is $1/6$.`,
    exact('1/6'),
  ),
  q(
    r`Explain how $X=$ first fair die face and $Y=7-X$ can have the same distribution without being the same function.`,
    r`Each takes each value from one through six with probability $1/6$. But for an outcome with $X=1$, $Y=6$, so they differ on that outcome.`,
  ),
  q(
    r`Write the underlying event $\{X=2\}$ when $X$ counts heads in three coins.`,
    r`It is $\{HHT,HTH,THH\}$, the outcomes assigned numerical value two by the count function.`,
  ),
];
a.review = [
  q(
    r`A discrete cost has support $\{0,1.25,4\}$. How many support values are there?`,
    r`There are $3$ positive-probability values.`,
    exact('3'),
  ),
  q(
    r`Two independent fair dice define $X=$ sum. Find $P(X=3)$.`,
    r`Only $(1,2)$ and $(2,1)$ qualify, giving $2/36=1/18$.`,
    exact('1/18'),
  ),
  q(
    r`Explain one limitation of recording only the total score from two assessments.`,
    r`Different score pairs can have the same total, so the total alone cannot identify which assessment supplied which score.`,
  ),
];
const b = section(
  'Construct and check a probability mass function',
  r`The probability mass function, or PMF, is $p_X(x)=P(X=x)$. For a discrete distribution its masses are nonnegative and sum to one. We set $p_X(x)=0$ outside the support. To find the probability of any collection of values, add their masses: $P(X\in A)=\sum_{x\in A}p_X(x)$. These are the same additivity rules as before, applied to disjoint value events.

Suppose a repair count $X$ takes values $0,1,2,3$ with masses $0.2,0.4,0.3,0.1$. The chance of at least two repairs is $0.3+0.1=0.4$. The chance of fewer than two is $0.2+0.4=0.6$. Both computations can be checked by complements. A PMF table should state both the values and the masses; a bare list of probabilities leaves the value assignment unclear.

Sometimes normalization determines an unknown constant. If $p_X(k)=ck$ for $k=1,2,3,4$, then $c(1+2+3+4)=1$, hence $c=1/10$. All four masses are nonnegative, so the normalized formula is valid. Solving only the sum condition is insufficient if some resulting masses are negative. For an infinite support, the normalization check is an infinite series, not a finite truncation.

For example, $p_X(k)=2/3^k$ on positive integers is valid because $\sum_{k=1}^{\infty}2/3^k=1$. This uses the geometric-series result from calculus. A finite partial sum is less than one because it omits a positive tail, not because the model is defective. Conversely, assigning the same positive mass to every positive integer cannot normalize: its partial sums grow without bound.`,
  [pmf, discrete],
  [
    termEntry(
      'pmf',
      'Probability mass function',
      'The probability assigned to each discrete value.',
      r`$p_X(x)=P(X=x)$, with $p_X(x)\geq0$ and $\sum_xp_X(x)=1$.`,
      r`Masses $0.2,0.4,0.3,0.1$ on $0,1,2,3$ form a PMF.`,
      'Mass is probability at a value, not cumulative probability through it.',
    ),
  ],
);
b.questions = [
  q(
    r`Masses on $0,1,2$ are $1/5,1/2,c$. Find $c$.`,
    r`Normalization gives $c=1-1/5-1/2=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`Masses of $X$ at $0,1,2$ are $1/5,1/2,3/10$. Find $P(X>0)$.`,
    r`The complement of zero has probability $1-1/5=4/5$.`,
    exact('4/5'),
  ),
  q(
    r`Masses of $X$ at $0,1,2$ are $1/5,1/2,3/10$. Find $P(X=1/2)$.`,
    r`The value $1/2$ is outside the support, so its mass is $0$.`,
    exact('0'),
  ),
  q(
    r`A PMF is $p(k)=ck$ for $k=1,2,3$. Find $c$.`,
    r`The sum condition is $6c=1$, so $c=1/6$.`,
    exact('1/6'),
  ),
  q(
    r`The PMF of $X$ is $p(k)=k/6$ for $k=1,2,3$. Find $P(X\geq2)$.`,
    r`Add the masses $2/6+3/6=5/6$.`,
    exact('5/6'),
  ),
  q(
    r`True or false: masses $0.7,0.4,-0.1$ define a valid PMF.`,
    r`False. The negative mass violates nonnegativity even though the total is one.`,
    truth(false),
    'interpret',
  ),
  q(
    r`On positive integers let $p(k)=2/3^k$. Find $P(X=2)$.`,
    r`Substitution gives $2/3^2=2/9$.`,
    exact('2/9'),
  ),
  q(
    r`The PMF on positive integers is $p_X(k)=2/3^k$. Find $P(X\leq2)$.`,
    r`Add the first two masses: $2/3+2/9=8/9$.`,
    exact('8/9'),
  ),
  q(
    r`The PMF on positive integers is $p_X(k)=2/3^k$. Find $P(X>2)$.`,
    r`The omitted tail is $1-8/9=1/9$.`,
    exact('1/9'),
  ),
  q(
    r`Explain why a uniform distribution on all positive integers cannot assign one common singleton mass.`,
    r`If the common mass is positive, the infinite sum diverges; if it is zero, the sum is zero. Neither case gives total probability one.`,
  ),
];
b.review = [
  q(
    r`Masses on $-1,0,2$ are $c,2c,3c$. Find $P(X\geq0)$.`,
    r`Normalization gives $c=1/6$, so the requested probability is $2c+3c=5/6$.`,
    exact('5/6'),
  ),
  q(
    r`A PMF assigns $0.1,0.2,0.3,0.4$ to $1,3,5,7$. Find $P(2<X<7)$.`,
    r`The qualifying values are $3,5$, giving $0.2+0.3=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Show that $p(k)=1/2^{k+1}$ for $k=0,1,2,\ldots$ is normalized.`,
    r`The geometric sum is $(1/2)\sum_{k=0}^{\infty}(1/2)^k=(1/2)/(1-1/2)=1$, and all masses are nonnegative.`,
  ),
];
b.quickCheck = quick(
  r`A variable has positive masses only at $0,2,5$. What is $P(X=3)$?`,
  [
    r`$0$`,
    r`The average of the masses at $2$ and $5$.`,
    r`It cannot be determined without interpolation.`,
  ],
  0,
  r`A PMF assigns zero probability to values outside its support.`,
  [
    r`There is no probability mass at three, so the event has probability zero.`,
    r`Interpolating PMF heights would invent probability at a value the variable cannot take.`,
    r`The stated support already answers the question; no interpolation is involved.`,
  ],
);
const c = section(
  'Accumulate mass into a CDF',
  r`The cumulative distribution function is $F_X(t)=P(X\leq t)$ for every real threshold $t$. For a discrete variable, sum every mass at or below the threshold. The CDF therefore answers a threshold question, whereas the PMF answers an exact-value question. The CDF's argument need not itself be a support value.

Let $X$ have masses $1/4,1/2,1/4$ at $-1,1,4$. Then $F_X(t)=0$ for $t<-1$, equals $1/4$ for $-1\leq t<1$, equals $3/4$ for $1\leq t<4$, and equals one for $t\geq4$. At $t=1$, the mass at one is already included, so $F_X(1)=3/4$. Between one and four no new mass is encountered, leaving the CDF flat. Open and closed endpoints matter.

Every CDF is nondecreasing, is right-continuous, and approaches zero and one at the two infinite ends. In the finite discrete examples, right-continuity means the filled point at a jump belongs to the upper step. The jump size at a value $x$ is $F_X(x)-F_X(x^-)=p_X(x)$, where $F_X(x^-)$ denotes the limit from the left. The jump can be zero at values with no mass.

A PMF and a CDF contain the same distributional information, presented differently. A PMF makes individual masses easy to compare; a CDF makes threshold and interval questions easy to answer. To recover a finite-support PMF, subtract consecutive cumulative levels rather than treating those levels as masses. Summing CDF heights usually has no probability interpretation and can easily exceed one.`,
  [cdf, pmf],
  [
    termEntry(
      'cdf',
      'Cumulative distribution function',
      'Probability at or below a threshold.',
      r`$F_X(t)=P(X\leq t)$ for every real $t$.`,
      r`Masses $1/4,1/2,1/4$ at $-1,1,4$ give $F_X(2)=3/4$.`,
      'The equality at the threshold includes its probability mass.',
    ),
    termEntry(
      'cdf-jump',
      'CDF jump',
      'The point mass added at a value.',
      r`$p_X(x)=F_X(x)-F_X(x^-)$.`,
      r`A jump from $1/4$ to $3/4$ adds mass $1/2$.`,
      'A cumulative level itself is not the point mass.',
    ),
  ],
);
c.questions = [
  q(
    r`Masses at $0,2,5$ are $0.2,0.5,0.3$. Find $F_X(1)$.`,
    r`Only the mass at zero lies below one, so $F_X(1)=0.2=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`Masses of $X$ at $0,2,5$ are $0.2,0.5,0.3$. Find $F_X(2)$.`,
    r`Include masses at zero and two: $0.2+0.5=0.7=7/10$.`,
    exact('7/10'),
  ),
  q(
    r`Masses of $X$ at $0,2,5$ are $0.2,0.5,0.3$. Find $F_X(4.9)$.`,
    r`The threshold remains below five, so the CDF is still $7/10$.`,
    exact('7/10'),
  ),
  q(
    r`Masses of $X$ at $0,2,5$ are $0.2,0.5,0.3$. Find $F_X(5)$.`,
    r`All support values are included, giving $1$.`,
    exact('1'),
  ),
  q(
    r`Masses of $X$ at $0,2,5$ are $0.2,0.5,0.3$. Find the CDF jump at $2$.`,
    r`Subtract the lower level from the upper: $0.7-0.2=0.5=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`A CDF has left limit $0.35$ and value $0.6$ at $x=3$. Find $P(X=3)$.`,
    r`The jump is $0.6-0.35=0.25=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A CDF equals $0$ below $1$, $0.4$ from $1$ through values below $4$, and $1$ from $4$ onward. Find $P(X=4)$.`,
    r`The jump at four is $1-0.4=0.6=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`True or false: a CDF can decrease between two thresholds.`,
    r`False. Increasing the threshold includes all previously counted outcomes and perhaps more, so probability cannot decrease.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain why a CDF is defined at thresholds not in the support.`,
    r`The event $\{X\leq t\}$ is meaningful for every real threshold. Between support points it contains the same support values and hence has the same probability.`,
  ),
  q(
    r`Construct the full CDF for masses $1/3,2/3$ at $-2,3$.`,
    r`The CDF is $0$ for $t<-2$, $1/3$ for $-2\leq t<3$, and $1$ for $t\geq3$. Each jump includes the mass at its threshold.`,
    undefined,
    'construct',
  ),
];
c.review = [
  q(
    r`A variable has masses $0.15,0.25,0.60$ at $-3,0,8$. Find $F_X(0)$.`,
    r`The masses at $-3$ and zero sum to $0.40=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`A CDF jumps from $0.48$ to $0.83$ at a value. Find that value's probability mass.`,
    r`The jump is $0.83-0.48=0.35=7/20$.`,
    exact('7/20'),
  ),
  q(
    r`Explain why adding successive CDF levels does not generally compute total probability.`,
    r`The later levels already include earlier masses, so adding levels counts those masses repeatedly. Total probability is the sum of distinct masses or jumps, not cumulative heights.`,
  ),
];
const d = section(
  'Intervals, tails, and endpoint discipline',
  r`The identity $P(a<X\leq b)=F_X(b)-F_X(a)$ follows by subtracting the smaller threshold event from the larger one. It excludes mass at $a$ and includes mass at $b$. For discrete distributions, changing either endpoint can change the result. The formula $P(X>t)=1-F_X(t)$ uses the complement of “at most”; the complement of “at least” is strictly less.

For integer-valued $X$, the formulas simplify: $P(X\geq k)=1-F_X(k-1)$ and $P(a\leq X\leq b)=F_X(b)-F_X(a-1)$ for integer endpoints. These shifts use integer support. They cannot be copied unchanged to a distribution whose values are $0,0.5,1.5$, or to a continuous variable. Translate the inequality into included support values first.

Suppose masses at $0,1,2,3$ are $0.1,0.2,0.4,0.3$. Then $P(1<X\leq3)=0.7$, but $P(1\leq X\leq3)=0.9$. The difference is the $0.2$ mass at one. Likewise $P(X>2)=0.3$ whereas $P(X\geq2)=0.7$. A sketch of the PMF with qualifying values marked is a useful independent check on any CDF subtraction.

Conditioning on a range combines the new distribution notation with the earlier conditional rule. In this model, $P(X=2\mid X\geq1)=0.4/0.9=4/9$. The retained masses at one, two, and three are divided by $0.9$ and sum to one. Such conditioning is not a new distribution law; it is the same restriction and renormalization used for events. Keep strictness at the retained boundary explicit.`,
  [cdf, pmf],
  [
    termEntry(
      'tail-probability',
      'Tail probability',
      'Probability beyond a specified threshold.',
      r`An upper strict tail is $P(X>t)=1-F_X(t)$.`,
      r`For integer $X$, $P(X\geq3)=1-F_X(2)$.`,
      'Strict and inclusive tails differ by the mass at the threshold.',
    ),
  ],
);
d.questions = [
  q(
    r`Masses at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(1<X\leq3)$.`,
    r`Add the masses at two and three: $1/4+1/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Masses of $X$ at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(1\leq X\leq3)$.`,
    r`Include one as well: $3/8+1/4+1/4=7/8$.`,
    exact('7/8'),
  ),
  q(
    r`Masses of $X$ at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(X>2)$.`,
    r`Only value three qualifies, so the probability is $1/4$.`,
    exact('1/4'),
  ),
  q(
    r`Masses of $X$ at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(X\geq2)$.`,
    r`Values two and three give total $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Masses of $X$ at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(X=1\mid X>0)$.`,
    r`The retained total is $7/8$, giving $(3/8)/(7/8)=3/7$.`,
    exact('3/7'),
  ),
  q(
    r`Masses of $X$ at $0,1,2,3$ are $1/8,3/8,1/4,1/4$. Find $P(X\geq2\mid X>0)$.`,
    r`The qualifying weight is $1/2$ out of $7/8$, giving $4/7$.`,
    exact('4/7'),
  ),
  q(
    r`An integer-valued $X$ has $F_X(4)=0.7$. Find $P(X\geq5)$.`,
    r`This is the complement of $X\leq4$, giving $0.3=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`A CDF has $F_X(2)=0.4$ and $F_X(6)=0.85$. Find $P(2<X\leq6)$.`,
    r`Subtract cumulative probabilities: $0.85-0.4=0.45=9/20$.`,
    exact('9/20'),
  ),
  q(
    r`True or false: $1-F_X(2)$ always equals $P(X\geq2)$.`,
    r`False. It equals $P(X>2)$. The inclusive tail also contains the mass at two.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Derive $P(X<t)=F_X(t)-p_X(t)$ for a discrete variable.`,
    r`The event $X\leq t$ is the disjoint union of $X<t$ and $X=t$. Subtracting the latter probability gives the identity.`,
  ),
];
d.review = [
  q(
    r`Masses at $-1,2,6$ are $0.3,0.4,0.3$. Find $P(-1<X<6)$.`,
    r`Only two qualifies, giving $0.4=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`An integer variable has $F_X(7)=0.92$. Find $P(X\geq8)$.`,
    r`The complement gives $1-0.92=0.08=2/25$.`,
    exact('2/25'),
  ),
  q(
    r`For masses $1/4,1/2,1/4$ at $0,2,4$, find $P(X=4\mid X\geq2)$.`,
    r`The retained total is $3/4$, so the conditional mass is $(1/4)/(3/4)=1/3$.`,
    exact('1/3'),
  ),
];
d.quickCheck = quick(
  r`For an integer-valued variable, which expression gives $P(X\geq4)$?`,
  [r`$1-F_X(4)$`, r`$1-F_X(3)$`, r`$F_X(4)-F_X(3)$`],
  1,
  r`The complement of at least four is at most three for integer values.`,
  [
    r`This excludes the mass at four and gives $P(X>4)$.`,
    r`Subtracting the probability of values at most three retains every integer value from four upward.`,
    r`This difference gives only the mass at four, not the whole upper tail.`,
  ],
);
const e = section(
  'Transform values and combine their masses',
  r`If $Y=g(X)$, then $Y$ is another random variable. To find its mass at $y$, identify every original value mapped to $y$ and add their masses: $p_Y(y)=\sum_{x:g(x)=y}p_X(x)$. This is a preimage calculation. The transformation changes values, while probability is transferred from the original events. No derivative or change-of-variable factor is needed for a discrete PMF.

Let $X$ take $-2,-1,0,1,2$ with masses $0.1,0.2,0.3,0.1,0.3$. For $Y=X^2$, the support becomes $\{0,1,4\}$. The mass at zero is $0.3$; at one it is $0.2+0.1=0.3$; at four it is $0.1+0.3=0.4$. Squaring merges the negative and positive values with the same magnitude. These new masses sum to one, providing a check that no preimage was omitted or counted twice.

An affine transformation $Y=aX+b$ with $a\ne0$ is one-to-one, so each transformed value retains its original mass. If $a<0$, the order reverses, which matters for CDF thresholds. If $a=0$, all outcomes merge into the constant $b$ with probability one. Threshold indicators are another useful transformation: $I=1$ when $X$ exceeds a threshold and zero otherwise. Its mass at one is the corresponding tail probability.

Transforming a distribution is different from transforming the probability numbers. For example, $P(X^2=4)$ is not $P(X=2)^2$; it combines $X=2$ and $X=-2$. This distinction anticipates the next lesson: the average of $g(X)$ is generally not $g$ applied to the average of $X$. We will use these transformed-value tables to compute expectations and quantify spread.`,
  [transform, pmf],
  [
    termEntry(
      'transformed-variable',
      'Transformed random variable',
      'A new numerical feature obtained by applying a function.',
      r`If $Y=g(X)$, then $p_Y(y)=\sum_{x:g(x)=y}p_X(x)$.`,
      r`Squaring merges masses at $-2$ and $2$ into mass at $4$.`,
      'Transform values first; do not apply the value transformation to their probabilities.',
    ),
  ],
);
e.questions = [
  q(
    r`$X$ has masses $1/4,1/2,1/4$ at $-1,0,1$. For $Y=X^2$, find $P(Y=1)$.`,
    r`Both $-1$ and one map to one, giving $1/4+1/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`$X$ has masses $1/4,1/2,1/4$ at $-1,0,1$, and $Y=X^2$. Find $P(Y=0)$.`,
    r`Only $X=0$ maps to zero, so the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`$X$ is uniform on $\{-2,-1,1,2\}$. Find $P(|X|=2)$.`,
    r`Two of four values have magnitude two, so the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`$X$ is uniform on $\{-2,-1,1,2\}$. How many support values does $X^2$ have?`,
    r`The squared values are one and four, so the support has $2$ values.`,
    exact('2'),
  ),
  q(
    r`$X$ has masses $0.2,0.3,0.5$ at $0,1,2$. For $Y=3X+1$, find $P(Y=4)$.`,
    r`The equation $3X+1=4$ gives $X=1$, with probability $0.3=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`$X$ has masses $0.2,0.3,0.5$ at $0,1,2$. Let $Y=2-X$. Find $P(Y\leq1)$.`,
    r`The inequality becomes $X\geq1$, whose probability is $0.3+0.5=4/5$.`,
    exact('4/5'),
  ),
  q(
    r`$X$ has masses $0.2,0.3,0.5$ at $0,1,2$. Let $I$ indicate $X>0$. Give $(P(I=0),P(I=1))$.`,
    r`The zero event has mass $0.2$, and the positive event has mass $0.8$, so the pair is $(1/5,4/5)$.`,
    tuple(['1/5', '4/5']),
  ),
  q(
    r`For any $X$, define $Y=7$. Find $P(Y=7)$.`,
    r`Every outcome maps to seven, so the probability is $1$.`,
    exact('1'),
  ),
  q(
    r`Explain why $P(X^2=4)$ need not equal $P(X=2)^2$.`,
    r`The event $X^2=4$ is the disjoint union of $X=2$ and $X=-2$. Its probability is the sum of those masses; squaring a probability describes neither event.`,
  ),
  q(
    r`Prove that the transformed PMF remains normalized.`,
    r`The preimage sets for distinct transformed values are disjoint and together include every original support value. Summing their masses therefore reproduces the original total one.`,
    undefined,
    'prove',
  ),
];
e.review = [
  q(
    r`$X$ is uniform on $\{-3,-1,1,3\}$. Find $P(X^2>2)$.`,
    r`Only $-3$ and three have squares above two, giving $2/4=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Masses at $1,2,3$ are $0.4,0.1,0.5$. For $Y=5-2X$, find $P(Y<0)$.`,
    r`The inequality requires $X>2.5$, so only three qualifies and the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Explain why a one-to-one transformation preserves each individual mass but may change the CDF's shape.`,
    r`Each transformed value has exactly one original preimage, so its probability remains unchanged. Its location and ordering relative to thresholds can change, altering where cumulative jumps occur.`,
  ),
];
a.body += r`

Defining the variable explicitly prevents ambiguity about losses and gains. If a machine produces a numerical status code, that code is not automatically a measurement with meaningful arithmetic. A code of two may simply label a different state from a code of one, rather than representing twice a quantity. A count, duration, or specified payoff supplies the numerical meaning needed for later expectations. Probability can be assigned to either kind of label, but interpreting an average requires knowing what the numerical values stand for.`;
c.body += r`

The nondecreasing property has a direct event proof. If $s<t$, every outcome satisfying $X\leq s$ also satisfies $X\leq t$. Monotonicity of probability therefore gives $F_X(s)\leq F_X(t)$. At a finite support point, the difference between the value and the lower step is exactly the newly included singleton event. These facts explain the staircase picture rather than merely prescribing how to draw it. They also provide quick rejection tests: a descending step or a level above one cannot represent a CDF.`;
d.body += r`

An infinite-support tail need not require an infinite calculation. For $p_X(k)=2/3^k$ on positive integers, $P(X>m)=3^{-m}$ for nonnegative integer $m$, obtained by summing a geometric tail or subtracting the finite partial sum. Thus $P(2<X\leq4)=P(X>2)-P(X>4)=1/9-1/81=8/81$. The two tail events are nested, so their difference retains exactly values three and four. Directly adding $2/27+2/81$ gives the same result and checks the endpoint interpretation.`;
export default lesson(
  5,
  'discrete-random-variables',
  'Discrete Random Variables',
  r`Random variables let us study numerical features without carrying every detail of the underlying experiment. We will construct probability mass functions, accumulate them into cumulative distribution functions, and translate inequalities carefully at discrete endpoints. Transformations such as counts, scores, absolute values, and indicators will show how probability moves when several outcomes share one numerical value. The same tools will support expectation, variance, and the named discrete models in the next lessons.`,
  [a, b, c, d, e],
);
