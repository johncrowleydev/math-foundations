import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  truth,
  tuple,
  quick,
} from './helpers.mjs';
const mean = citation(
  'pn-3-2-2',
  'pishro-nik',
  '§3.2.2 Expectation',
  'https://www.probabilitycourse.com/chapter3/3_2_2_expectation.php',
  'Probability-weighted means, linearity, and expectations of indicator sums.',
);
const funcs = citation(
  'pn-3-2-3',
  'pishro-nik',
  '§3.2.3 Functions of Random Variables',
  'https://www.probabilitycourse.com/chapter3/3_2_3_functions_random_var.php',
  'Computing expected transformed values using the original PMF.',
);
const variance = citation(
  'pn-3-2-4',
  'pishro-nik',
  '§3.2.4 Variance',
  'https://www.probabilitycourse.com/chapter3/3_2_4_variance.php',
  'Variance, standard deviation, moment identity, scaling, and independent sums.',
);
const a = section(
  'Expectation is a probability-weighted mean',
  r`For a discrete variable, the expectation is $E[X]=\sum_x xp_X(x)$. Multiply each value by its probability and add. This is a weighted center of the distribution, expressed in the same units as the variable. It need not be a possible outcome or the most probable outcome. A fair die has mean $3.5$, even though no face equals $3.5$.

Suppose a job needs zero, one, or three replacement parts with probabilities $0.5,0.3,0.2$. Its expected count is $0(0.5)+1(0.3)+3(0.2)=0.9$. This does not predict that an individual job will use a fractional part. It describes the model's average requirement, useful for planning across many jobs. Actual sample averages fluctuate; precise convergence statements arrive later with the law of large numbers.

In a finite distribution the weighted sum always exists. For a countably infinite support, a finite expectation is guaranteed when $\sum_x|x|p_X(x)<\infty$. This absolute-integrability condition prevents an answer from depending on an arbitrary rearrangement of positive and negative terms. For a nonnegative variable, the expectation can legitimately be infinite. A normalized PMF alone does not ensure a finite mean.

Expectation also represents an expected payoff or cost, but the quantity must be defined correctly. If a game pays $8$ units with probability $1/4$ and zero otherwise, its expected gross payout is two units. Charging a fixed entry fee of three units changes expected net payoff to minus one unit. Gross payout, net payoff, and chance of winning are different summaries. State the variable and units before doing the weighted sum so that the final interpretation matches the question.`,
  [mean],
  [
    termEntry(
      'expectation',
      'Expectation',
      'The probability-weighted mean of a variable.',
      r`$E[X]=\sum_x xp_X(x)$, finite when $E[|X|]<\infty$.`,
      r`Counts $0,1,3$ with masses $0.5,0.3,0.2$ have mean $0.9$.`,
      'The mean need not be a possible or most likely outcome.',
    ),
    termEntry(
      'integrable-variable',
      'Integrable random variable',
      'A variable with finite expected absolute value.',
      r`$E[|X|]=\sum_x|x|p_X(x)<\infty$.`,
      r`Every finite-support real-valued variable is integrable.`,
      'A valid infinite-support PMF need not have a finite mean.',
    ),
  ],
);
a.questions = [
  q(
    r`$X$ has values $0,1,2$ with probabilities $1/4,1/2,1/4$. Find $E[X]$.`,
    r`The weighted sum is $0+1/2+2/4=1$.`,
    exact('1'),
  ),
  q(
    r`$X$ has values $-2,1,4$ with probabilities $1/2,1/4,1/4$. Find its mean.`,
    r`The mean is $-2(1/2)+1(1/4)+4(1/4)=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A fair eight-sided die is numbered $1$ through $8$. Find its mean.`,
    r`Its equally weighted values sum to $36$, so the mean is $36/8=9/2$.`,
    exact('9/2'),
  ),
  q(
    r`A payout is $12$ with probability $1/6$ and zero otherwise. Find expected gross payout.`,
    r`The weighted payout is $12(1/6)=2$.`,
    exact('2'),
  ),
  q(
    r`A payout is twelve with probability $1/6$ and zero otherwise. An entry fee of three is charged. Find expected net payoff.`,
    r`Subtract the fixed fee from expected gross payout: $2-3=-1$.`,
    exact('-1'),
  ),
  q(
    r`A variable is constantly $7$. Find its expectation.`,
    r`Its sole value has probability one, so $E[X]=7$.`,
    exact('7'),
  ),
  q(
    r`True or false: the expected value must be in the support.`,
    r`False. A fair binary variable has mean $1/2$ but support $\{0,1\}$.`,
    truth(false),
    'interpret',
  ),
  q(
    r`A nonnegative variable has mass $1/[k(k+1)]$ at $k=1,2,\ldots$. Show its expectation is infinite.`,
    r`The expectation sum is $\sum_{k\geq1}k/[k(k+1)]=\sum_{k\geq1}1/(k+1)$, a divergent harmonic tail. The PMF normalizes by telescoping, but the mean is infinite.`,
  ),
  q(
    r`$X$ takes $0$ or $5$ and has mean $2$. Find $P(X=5)$.`,
    r`Writing that probability as $p$ gives $5p=2$, hence $p=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Explain why a mean of $0.9$ replacement parts per job is compatible with integer-valued usage.`,
    r`The expectation averages across possible jobs with probability weights. Individual jobs use integer quantities, while their weighted average may be fractional.`,
  ),
];
a.review = [
  q(
    r`Masses $1/3,1/2,1/6$ are assigned to $-1,2,5$. Find the mean.`,
    r`The sum is $-1/3+1+5/6=3/2$.`,
    exact('3/2'),
  ),
  q(
    r`A reward is $20$ with probability $0.1$ and $2$ otherwise. Find expected reward.`,
    r`The expectation is $20(0.1)+2(0.9)=3.8=19/5$.`,
    exact('19/5'),
  ),
  q(
    r`Explain why knowing only the most likely value does not determine the expectation.`,
    r`The expectation uses every value and its probability. Different probabilities or extreme values outside the mode can change the weighted mean while leaving the mode unchanged.`,
  ),
];
a.quickCheck = quick(
  r`A fair die has mean $3.5$. What does this mean?`,
  [
    r`The next roll will be $3.5$.`,
    r`It is the probability-weighted average of the face values.`,
    r`Exactly half the rolls must be below $3.5$ in every finite run.`,
  ],
  1,
  r`An expectation summarizes a distribution and need not be a possible single observation.`,
  [
    r`No die face equals $3.5$; the mean is not a predicted literal outcome.`,
    r`Adding the six face values weighted by $1/6$ gives $3.5$.`,
    r`Finite observed proportions can fluctuate even though the model assigns equal probability to the lower and upper halves.`,
  ],
);
const b = section(
  'Transformations, linearity, and indicators',
  r`To average a transformed value, use $E[g(X)]=\sum_xg(x)p_X(x)$ whenever the expectation is defined. The formula evaluates the transformation at each original value and retains its probability. We do not need to construct the transformed PMF first, although doing so can verify the result. For nonlinear $g$, this is generally different from $g(E[X])$.

If $X$ is equally likely to be minus two or two, its mean is zero but $E[X^2]=4$. Squaring the mean instead gives zero. Linearity applies to affine transformations: $E[aX+b]=aE[X]+b$. It also gives $E[X+Y]=E[X]+E[Y]$ for integrable variables, with no independence requirement. Dependence changes joint behavior, but addition of expected values remains valid.

Indicators make counts easy to average. For event $A$, define $I_A$ to be one when $A$ occurs and zero otherwise. Then $E[I_A]=P(A)$. If $N$ counts how many of $m$ events occur, $N=\sum_iI_{A_i}$ and $E[N]=\sum_iP(A_i)$. The events can overlap or be dependent. This technique often avoids deriving an entire count distribution.

For example, choose three people uniformly from ten. Let $N$ count how many of four designated people are selected. Each designated person is selected with probability $3/10$, so $E[N]=4(3/10)=6/5$. The selection indicators are dependent because the sample size is fixed, yet linearity still applies. The distinction will matter for variance: adding variances requires extra information, whereas adding means does not. Use the simplest valid property for the requested summary instead of building an unnecessary full distribution.`,
  [mean, funcs],
  [
    termEntry(
      'linearity-expectation',
      'Linearity of expectation',
      'Expectations distribute over finite linear combinations.',
      r`$E[aX+bY+c]=aE[X]+bE[Y]+c$ for integrable variables.`,
      r`$E[X+Y]=E[X]+E[Y]$ even when the variables are dependent.`,
      'Linearity does not extend to arbitrary nonlinear functions.',
    ),
    termEntry(
      'indicator-variable',
      'Indicator variable',
      'A zero-one variable recording whether an event occurs.',
      r`$I_A=1$ on $A$ and zero otherwise; $E[I_A]=P(A)$.`,
      r`A count can be the sum of indicators for its contributing events.`,
      'Indicator expectations add without independence.',
    ),
  ],
);
b.questions = [
  q(r`If $E[X]=4$, find $E[3X-2]$.`, r`Linearity gives $3(4)-2=10$.`, exact('10')),
  q(
    r`If $E[X]=2$ and $E[Y]=-1$, find $E[2X+3Y+5]$.`,
    r`The expectation is $2(2)+3(-1)+5=6$.`,
    exact('6'),
  ),
  q(
    r`$X$ is equally likely to be $-3$ or $3$. Find $E[X^2]$.`,
    r`Both squared values equal nine, so $E[X^2]=9$.`,
    exact('9'),
  ),
  q(
    r`$X$ is equally likely to be $-3$ or $3$. Find $(E[X])^2$.`,
    r`Symmetry gives mean zero, so its square is $0$.`,
    exact('0'),
  ),
  q(
    r`An event has probability $0.35$. Find the mean of its indicator.`,
    r`The indicator mean equals the event probability: $7/20$.`,
    exact('7/20'),
  ),
  q(
    r`Five events each have probability $0.2$. Find the expected number that occur, without assuming independence.`,
    r`Write the count as five indicators. Their expected sum is $5(0.2)=1$.`,
    exact('1'),
  ),
  q(
    r`Select two people uniformly from eight, of whom three are designated. Find the expected number of designated people selected.`,
    r`Each designated person is selected with probability $2/8$, so the expected count is $3(2/8)=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`$X$ has values $0,1,3$ with probabilities $1/2,1/4,1/4$. Find $E[(X-1)^2]$.`,
    r`The transformed values are one, zero, and four, so the weighted mean is $1/2+0+4/4=3/2$.`,
    exact('3/2'),
  ),
  q(
    r`Prove $E[I_A]=P(A)$ from the expectation definition.`,
    r`The two contributions are $1\cdot P(A)+0\cdot P(A^c)=P(A)$.`,
    undefined,
    'prove',
  ),
  q(
    r`True or false: dependence can make $E[X+Y]\ne E[X]+E[Y]$ for finite-support variables.`,
    r`False. Linearity holds without independence when the expectations are finite.`,
    truth(false),
    'interpret',
  ),
];
b.review = [
  q(r`$E[X]=5$ and $E[Y]=2$. Find $E[X-Y/2]$.`, r`Linearity gives $5-2/2=4$.`, exact('4')),
  q(
    r`Seven events have probabilities $0.1,0.2,0.3,0.4,0.5,0.6,0.7$. Find the expected count.`,
    r`The indicator expectations sum to $2.8=14/5$.`,
    exact('14/5'),
  ),
  q(
    r`A variable is equally likely to be $-1$ or one. Compare $E[|X|]$ with $|E[X]|$.`,
    r`Every absolute value is one, so $E[|X|]=1$. Symmetry gives $E[X]=0$, hence $|E[X]|=0$. This shows failure of nonlinear interchange.`,
  ),
];
const c = section(
  'Variance and standard deviation measure spread',
  r`A mean does not describe how tightly values cluster. Variance measures squared distance from the mean: $\operatorname{Var}(X)=E[(X-\mu)^2]$, where $\mu=E[X]$. We assume a finite second moment when using a finite variance. Squaring prevents positive and negative deviations from canceling. Indeed, the expected unsquared deviation is always zero for an integrable variable.

Let $X$ be equally likely to take $1$ or $5$. Its mean is three, and both squared deviations are four, so its variance is four. A constant variable $Y=3$ has the same mean but variance zero. These distributions answer different questions about reliability despite sharing a center. Variance is nonnegative; a negative result signals an arithmetic error or an invalid model.

Expanding the square gives a convenient identity: $\operatorname{Var}(X)=E[X^2]-(E[X])^2$. To derive it, write $E[X^2-2\mu X+\mu^2]$ and use linearity; since $E[X]=\mu$, the last two terms combine to minus $\mu^2$. The identity is exact, but subtracting two nearly equal rounded quantities can lose accuracy. Keep fractions or sufficient digits during intermediate work.

Variance has squared units. If $X$ is measured in minutes, its variance is measured in square minutes. The standard deviation $\sigma_X=\sqrt{\operatorname{Var}(X)}$ returns to minutes and is often easier to interpret. It is a distributional spread measure, not the average absolute deviation and not an automatic interval containing a fixed percentage of observations. Later probability bounds will state what can be concluded from it with appropriate conditions.`,
  [variance, funcs],
  [
    termEntry(
      'variance',
      'Variance',
      'Expected squared deviation from the mean.',
      r`$\operatorname{Var}(X)=E[(X-E[X])^2]=E[X^2]-(E[X])^2$.`,
      r`Equal masses at one and five have variance four.`,
      'Variance has squared units and is not linear.',
    ),
    termEntry(
      'standard-deviation',
      'Standard deviation',
      'The nonnegative square root of variance.',
      r`$\sigma_X=\sqrt{\operatorname{Var}(X)}$.`,
      r`Variance four square minutes gives standard deviation two minutes.`,
      'It is not the expected absolute deviation.',
    ),
  ],
);
c.questions = [
  q(
    r`$X$ is equally likely to be $0$ or $4$. Find its variance.`,
    r`Its mean is two and each squared deviation is four, giving variance $4$.`,
    exact('4'),
  ),
  q(
    r`$X$ is equally likely to be $0$ or $4$. Find its standard deviation.`,
    r`The nonnegative square root of variance four is $2$.`,
    exact('2'),
  ),
  q(
    r`If $E[X]=3$ and $E[X^2]=13$, find the variance.`,
    r`Subtract the squared mean: $13-9=4$.`,
    exact('4'),
  ),
  q(
    r`If $E[X]=2$ and $\operatorname{Var}(X)=5$, find $E[X^2]$.`,
    r`Rearrange the moment identity: $E[X^2]=5+2^2=9$.`,
    exact('9'),
  ),
  q(
    r`Masses at $0,1,2$ are $1/4,1/2,1/4$. Find the variance.`,
    r`The mean is one and second moment is $1/2+4/4=3/2$. Thus variance is $3/2-1=1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Masses of $X$ at $0,1,2$ are $1/4,1/2,1/4$. Find the standard deviation exactly.`,
    r`The standard deviation is $\sqrt{1/2}=\sqrt2/2$.`,
    calc('sqrt(2)/2'),
  ),
  q(
    r`A variable equals $-5$ with probability one. Find its variance.`,
    r`It always equals its mean, so every squared deviation is zero and the variance is $0$.`,
    exact('0'),
  ),
  q(
    r`True or false: mean $4$ and second moment $10$ are possible for a real finite-variance variable.`,
    r`False. They would give variance $10-16=-6$, contradicting nonnegativity.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Derive the second-moment formula for variance.`,
    r`Expand and average: $E[(X-\mu)^2]=E[X^2]-2\mu E[X]+\mu^2=E[X^2]-\mu^2$, using $E[X]=\mu$.`,
  ),
  q(
    r`Explain why $E[X-E[X]]=0$ cannot serve as a useful measure of spread.`,
    r`Positive and negative deviations cancel for every integrable variable, so the expression cannot distinguish a constant from a widely dispersed distribution.`,
  ),
];
c.review = [
  q(
    r`A variable is equally likely to be $-2$ or $6$. Find its variance.`,
    r`The mean is two and both deviations have magnitude four, so the variance is $16$.`,
    exact('16'),
  ),
  q(
    r`Given mean $-1$ and second moment $7$, find variance.`,
    r`The variance is $7-(-1)^2=6$.`,
    exact('6'),
  ),
  q(
    r`If a duration's variance is $9$ square seconds, state its standard deviation in seconds.`,
    r`Take the nonnegative square root: the standard deviation is $3$ seconds.`,
    exact('3'),
  ),
];
c.quickCheck = quick(
  r`A variable has mean $2$ and second moment $9$. What is its variance?`,
  [r`$7$`, r`$5$`, r`$\sqrt5$`],
  1,
  r`Variance subtracts the square of the mean from the second moment.`,
  [
    r`Subtracting the mean itself gives $9-2$, but the formula requires subtracting $2^2$.`,
    r`The calculation is $9-2^2=5$.`,
    r`The square root of five is the standard deviation, while the question asks for variance.`,
  ],
);
const d = section(
  'Scaling, sums, and the role of dependence',
  r`For $Y=aX+b$, expectation becomes $aE[X]+b$, while variance becomes $a^2\operatorname{Var}(X)$. Translation moves every value and the mean together, leaving deviations unchanged. Scaling multiplies each deviation by $a$, so squared deviations gain a factor $a^2$. Standard deviation therefore scales by $|a|$, including when $a$ is negative.

If a measurement has mean ten and variance four, changing units by $Y=3X+2$ gives mean $32$ and variance $36$. The standard deviation changes from two to six. The offset two affects the mean but contributes nothing to the spread. These checks help detect the common mistake of applying the mean transformation rule to variance.

For independent variables with finite variances, variances add: $\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)$. Independence of discrete variables means their value events factor: $P(X=x,Y=y)=P(X=x)P(Y=y)$ for every pair of support values. This makes the expected product of centered deviations zero when the variance expansion is taken. The later joint-distribution lessons will describe covariance when that cross term does not vanish.

Dependence can change the answer dramatically. If $Y=X$, then $X+Y=2X$ has variance $4\operatorname{Var}(X)$, not twice the variance. If $Y=-X$, their sum is constant zero. For independent observations each of variance $\sigma^2$, the sum of $n$ observations has variance $n\sigma^2$, and their average has variance $\sigma^2/n$. This is an algebraic consequence of independence and scaling, not a promise that every individual average lies near the mean.`,
  [variance, mean],
  [
    termEntry(
      'variance-scaling',
      'Variance scaling',
      'Squared scaling changes variance; translation does not.',
      r`$\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)$.`,
      r`Tripling a variable multiplies its variance by nine.`,
      'The scale factor for standard deviation is $|a|$, not $a^2$.',
    ),
  ],
);
d.questions = [
  q(
    r`If $\operatorname{Var}(X)=3$, find $\operatorname{Var}(2X+7)$.`,
    r`The squared scale gives $2^2(3)=12$; the shift has no effect.`,
    exact('12'),
  ),
  q(
    r`If $\operatorname{Var}(X)=5$, find $\operatorname{Var}(-3X)$.`,
    r`Squaring the scale gives $9(5)=45$.`,
    exact('45'),
  ),
  q(
    r`If $\operatorname{SD}(X)=4$, find $\operatorname{SD}(-2X+1)$.`,
    r`Standard deviation scales by the absolute factor, giving $2(4)=8$.`,
    exact('8'),
  ),
  q(
    r`Independent $X,Y$ have variances $2,7$. Find $\operatorname{Var}(X+Y)$.`,
    r`Independent variances add, giving $2+7=9$.`,
    exact('9'),
  ),
  q(
    r`Independent $X,Y$ have variances $2,7$. Find $\operatorname{Var}(2X-Y)$.`,
    r`Scale before adding: $4(2)+1(7)=15$.`,
    exact('15'),
  ),
  q(
    r`Four independent observations each have variance $8$. Find the variance of their average.`,
    r`The sum has variance $32$; dividing by four scales variance by $1/16$, yielding $2$.`,
    exact('2'),
  ),
  q(
    r`If $Y=X$ and $\operatorname{Var}(X)=6$, find $\operatorname{Var}(X+Y)$.`,
    r`The sum is $2X$, so its variance is $4(6)=24$.`,
    exact('24'),
  ),
  q(
    r`If $Y=-X$, find $\operatorname{Var}(X+Y)$.`,
    r`The sum is identically zero, hence has variance $0$.`,
    exact('0'),
  ),
  q(
    r`Prove variance is unchanged by adding a constant.`,
    r`Since $E[X+b]=E[X]+b$, the centered difference is $(X+b)-(E[X]+b)=X-E[X]$. Its expected square is unchanged.`,
    undefined,
    'prove',
  ),
  q(
    r`True or false: independence is required to add means, just as it is a sufficient condition to add variances.`,
    r`False. Finite expectations add regardless of dependence. Independent variables have additive variances, but this is a different property.`,
    truth(false),
    'interpret',
  ),
];
d.review = [
  q(
    r`Independent $X,Y$ have variances $4,9$. Find $\operatorname{Var}(X/2+Y/3)$.`,
    r`The scaled independent variances add: $4/4+9/9=2$.`,
    exact('2'),
  ),
  q(
    r`Nine independent observations each have variance $36$. Find the standard deviation of their average.`,
    r`The average variance is $36/9=4$, so its standard deviation is $2$.`,
    exact('2'),
  ),
  q(
    r`Explain why adding a constant changes the second moment even though it leaves variance unchanged.`,
    r`Squaring $X+b$ introduces $2bX+b^2$, so its second moment changes. The squared mean changes by the corresponding terms, which cancel in the variance difference.`,
  ),
];
const e = section(
  'Use moments without losing the full model',
  r`The first two moments describe center and spread, but do not uniquely determine a distribution. A variable equally likely to be minus one or one has mean zero and variance one. Another variable with masses $1/8,3/4,1/8$ at $-2,0,2$ also has mean zero and second moment one. Their probabilities of zero and their extreme-value behavior differ. Matching moments is therefore a useful summary check, not proof that two probability models are equivalent.

Expected cost can guide a decision only when it matches the stated objective. Suppose action $A$ costs four units with certainty, while action $B$ costs zero with probability $0.8$ and twenty with probability $0.2$. Both have expected cost four. Yet action $B$ has variance $64$ and a chance of a much larger cost. If the question asks only for minimum expected cost, the actions tie; if constraints concern maximum cost or a tail probability, additional calculations are required. Do not silently replace those objectives by the mean.

We can also compute a mean inside a positive-probability event by first forming the conditional distribution. If $X$ has values $0,1,3$ with masses $1/2,1/4,1/4$, then given $X>0$ the remaining values one and three each have conditional probability $1/2$. The conditional mean is two, whereas the unconditional mean is one. This is ordinary expectation applied to a renormalized PMF, and will later become conditional expectation as a random variable.

An effective final check uses units, support, and inequalities. A finite-support mean lies between the smallest and largest values. Variance is nonnegative and unchanged by translation. The second moment is at least the squared mean. These facts can reject impossible calculations without recovering every detail of the PMF. They complement, rather than replace, direct verification from the stated probabilities.`,
  [mean, funcs, variance],
  [
    termEntry(
      'second-moment',
      'Second moment',
      'The expected square of a variable.',
      r`$E[X^2]=\sum_xx^2p_X(x)$.`,
      r`It equals variance plus the squared mean.`,
      'The second moment is not the square of the expectation.',
    ),
  ],
);
e.questions = [
  q(
    r`$X$ has masses $1/8,3/4,1/8$ at $-2,0,2$. Find its mean.`,
    r`The negative and positive contributions cancel: $-2/8+2/8=0$.`,
    exact('0'),
  ),
  q(
    r`$X$ has masses $1/8,3/4,1/8$ at $-2,0,2$. Find its second moment.`,
    r`The nonzero squared contributions total $4/8+4/8=1$.`,
    exact('1'),
  ),
  q(
    r`$X$ has masses $1/8,3/4,1/8$ at $-2,0,2$. Find its variance.`,
    r`The mean is zero, so variance equals the second moment, $1$.`,
    exact('1'),
  ),
  q(
    r`$X$ has masses $1/8,3/4,1/8$ at $-2,0,2$. Find $P(|X|\geq2)$.`,
    r`Both extreme values qualify, giving $1/8+1/8=1/4$.`,
    exact('1/4'),
  ),
  q(
    r`A cost is zero with probability $3/4$ and $8$ otherwise. Find its mean.`,
    r`The weighted cost is $8(1/4)=2$.`,
    exact('2'),
  ),
  q(
    r`A cost is zero with probability $3/4$ and eight otherwise. Find its variance.`,
    r`Its second moment is $64/4=16$ and squared mean is four, giving variance $12$.`,
    exact('12'),
  ),
  q(
    r`$X$ has values $0,2,5$ with masses $1/2,1/4,1/4$. Find $E[X\mid X>0]$ by renormalizing.`,
    r`Conditional masses at two and five are each $1/2$, so the conditional mean is $2/2+5/2=7/2$.`,
    exact('7/2'),
  ),
  q(
    r`True or false: two distributions with the same mean and variance must assign the same mass to zero.`,
    r`False. Equal masses at minus one and one have zero mass at zero; masses $1/8,3/4,1/8$ at minus two, zero, two have mass $3/4$ there. Both have mean zero and variance one.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Prove that a finite-support variable bounded between $a$ and $b$ has mean between $a$ and $b$.`,
    r`Multiply $a\leq x\leq b$ by each nonnegative mass and sum. Since masses total one, the resulting bounds are $a\leq E[X]\leq b$.`,
    undefined,
    'prove',
  ),
  q(
    r`Explain why a minimum-expected-cost objective need not minimize the probability of a very large cost.`,
    r`The mean combines all magnitudes with their probabilities. Different distributions can share a mean while assigning different probabilities to large costs, so the tail objective requires separate information.`,
  ),
];
e.review = [
  q(
    r`A variable takes $-4,0,4$ with probabilities $1/16,7/8,1/16$. Find its variance.`,
    r`Symmetry gives mean zero; the second moment is $16/16+16/16=2$, so variance is $2$.`,
    exact('2'),
  ),
  q(
    r`Values $1,3,9$ have probabilities $1/2,1/3,1/6$. Find the conditional mean given $X\geq3$.`,
    r`The retained total is $1/2$, giving conditional masses $2/3,1/3$ at three and nine. Their mean is $2+3=5$.`,
    exact('5'),
  ),
  q(
    r`A calculation reports mean $12$ for a variable supported on $\{1,4,7\}$. Explain why it cannot be correct.`,
    r`A probability-weighted average of values from one through seven must lie in that interval. Twelve violates the support bound, indicating incorrect weights or arithmetic.`,
  ),
];
a.body += r`

A weighted-average check is available before computing: if all possible costs lie between two and nine units, a valid expected cost must lie within that interval. A mean outside it indicates a missing probability weight, a normalization failure, or a different quantity than the one defined. Negative values do not invalidate expectation when they represent signed gains or losses; they must simply retain their signs in the weighted sum. By contrast, a negative probability invalidates the model. Keep the numerical values and their probability weights conceptually separate.`;
d.body += r`

For the average $\overline X=(X_1+\cdots+X_n)/n$, the independent equal-variance formula also gives standard deviation $\sigma/\sqrt n$. Quadrupling the number of independent observations halves this spread. The square-root change is slower than dividing by the sample size itself, because the sum introduces more random variation before division. If all observations are exact copies of one random variable, their average equals that variable and no variance reduction occurs. This extreme dependent case shows why independence or another justified dependence calculation matters.`;
e.body += r`

The phrase “almost surely constant” allows exceptional outcomes of probability zero. In a discrete positive-mass support, variance zero forces every support value to equal the mean: each term $(x-\mu)^2p_X(x)$ is nonnegative, and a positive term would make the sum positive. Thus zero variance is stronger than small variance. It identifies a distribution concentrated at one value, although the underlying sample space may still contain many detailed outcomes all mapped to that same value.`;
export default lesson(
  6,
  'expectation-variance',
  'Expectation and Variance',
  r`A full probability distribution contains more information than a single summary, but well-chosen summaries are powerful. Expectation gives a weighted center; variance and standard deviation describe spread around it. We will derive their main identities, use indicators to average counts without unnecessary enumeration, and distinguish properties that require independence from those that do not. Examples involving costs and conditional populations keep the meaning of each quantity visible alongside its algebra.`,
  [a, b, c, d, e],
);
