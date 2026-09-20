import { R, source, term, exact, expr, text, bool, open, qc } from './differentiation-helpers.mjs';
export default {
  number: 1,
  slug: 'calculus-limits-continuity',
  title: 'Limits and Continuity',
  intro: R`A program can evaluate a formula at one input; calculus also asks what its outputs do throughout a neighborhood. A limit makes this second question precise. It will let us describe an instantaneous rate without dividing by zero and later describe accumulation without adding infinitely many numbers informally. Bring your knowledge of functions, factoring, inequalities, and quantifiers. We begin with numerical and geometric meaning, build reliable algebraic methods, and then distinguish approaching a value from actually taking that value. The final section gives a short proof using the precise definition. The purpose is to connect intuition with a guarantee, not to replace intuition with symbols.`,
  sections: [
    {
      title: 'Approaching a value from nearby inputs',
      sources: [
        source('2.2', 'Finite and one-sided limits; holes, jumps, tables and oscillation.'),
      ],
      body: R`For a function $f$, the statement $\lim_{x\to a}f(x)=L$ describes nearby inputs different from $a$. As those inputs approach $a$, the outputs become arbitrarily close to $L$ and remain close. The input may approach from either side. The statement neither requires $f(a)$ to exist nor specifies its value. Read the notation aloud as “the limit of $f(x)$ as $x$ approaches $a$ is $L$.” The letter $x$ varies; $a$ and $L$ are fixed in this statement.

Consider $f(x)=(x^2-9)/(x-3)$ for $x\ne3$. At $x=2.9$ and $3.1$ the outputs are $5.9$ and $6.1$; at $2.99$ and $3.01$ they are $5.99$ and $6.01$. Factoring shows why: every permitted nearby input gives $f(x)=x+3$. Thus the limit is $6$, although the original expression has no value at $3$. On a graph, draw the line $y=x+3$ with an open circle at $(3,6)$. If we separately define $f(3)=20$, the dot at $(3,20)$ changes the function value but leaves the nearby behavior intact.

A table provides evidence rather than a proof. Any finite table can miss a narrow spike or rapid oscillation. Always use both sides, then explain why the pattern persists. The left-hand limit $\lim_{x\to a^-}f(x)$ uses $x<a$; the right-hand limit uses $x>a$. For a finite two-sided limit, both one-sided limits must exist and agree. They are not averaged.

For example, let $g(x)=2x+1$ when $x<1$ and $g(x)=x+5$ when $x\ge1$. The left-hand limit at $1$ is $3$ and the right-hand limit is $6$. No single finite number describes both sides, so the two-sided limit does not exist. Changing only $g(1)$ cannot repair that jump. In practice, first identify which branch applies to nearby inputs, then substitute into that branch. The equality sign in a piecewise condition controls the value at the boundary, not the branch approached from the other side.`,
      terms: [
        term(
          'limit',
          'Limit',
          'A value approached by nearby outputs.',
          R`$\lim_{x\to a}f(x)=L$ means outputs approach $L$ as inputs approach $a$ through nearby domain points other than $a$.`,
          R`$\lim_{x\to3}(x+3)=6$.`,
          'A limit need not equal the function value.',
        ),
        term(
          'one-sided-limit',
          'One-sided limit',
          'A limit using inputs on one side.',
          R`The superscripts $a^-$ and $a^+$ restrict approach to inputs below or above $a$.`,
          R`$\lim_{x\to0^-}|x|/x=-1$.`,
          'Different one-sided limits do not average into a two-sided limit.',
        ),
      ],
      questions: [
        exact(
          R`A table for $f$ near $2$ has outputs $4.9,4.99$ from the left and $5.1,5.01$ from the right. What limit does it suggest?`,
          5,
          R`It suggests $5$: both columns approach $5$. A finite table alone does not prove this.`,
          'interpret',
        ),
        exact(
          R`Let $f(x)=x+4$ for $x\ne2$ and $f(2)=19$. Find $\lim_{x\to2}f(x)$.`,
          6,
          R`Nearby values obey $x+4$, which approaches $6$; the isolated value $19$ is irrelevant.`,
        ),
        exact(
          R`Let $f(x)=x+4$ for $x\ne2$ and $f(2)=19$. Find $f(2)$.`,
          19,
          R`The special definition gives $f(2)=19$, independently of its limit.`,
        ),
        exact(
          R`Let $g(x)=3x$ for $x<2$ and $g(x)=x-1$ for $x\ge2$. Find its left-hand limit at $2$.`,
          6,
          R`Inputs just below $2$ use $3x$, tending to $6$.`,
        ),
        exact(
          R`Let $g(x)=3x$ for $x<2$ and $g(x)=x-1$ for $x\ge2$. Find its right-hand limit at $2$.`,
          1,
          R`Inputs just above $2$ use $x-1$, tending to $1$.`,
        ),
        text(
          R`If a function has left-hand limit $6$ and right-hand limit $1$ at $2$, give its two-sided limit, or enter DNE.`,
          'DNE',
          R`DNE: a two-sided finite limit requires equal one-sided limits.`,
          ['does not exist'],
        ),
        exact(
          R`Find $\lim_{x\to0^-}|x|/x$.`,
          -1,
          R`For $x<0$, $|x|=-x$, so the quotient is constantly $-1$.`,
        ),
        exact(
          R`Find $\lim_{x\to0^+}|x|/x$.`,
          1,
          R`For $x>0$, $|x|=x$, so the quotient is constantly $1$.`,
        ),
        open(
          R`Construct two functions with the same limit at $4$ but different values at $4$. Explain why the limits agree.`,
          R`Take $f(x)=x$ everywhere and $g(x)=x$ except $g(4)=0$. Both equal $x$ at all nearby inputs other than $4$, so both limits are $4$, while their values at $4$ differ.`,
          'construct',
        ),
        open(
          'Explain why sampling a million nearby inputs still cannot establish a limit for an otherwise unspecified function.',
          'A finite sample leaves other nearby inputs unconstrained. A function can match every sampled value yet behave differently on a sequence of unsampled inputs approaching the target.',
        ),
      ],
      review: [
        exact(
          R`A graph follows $y=2x-3$ near $x=5$, except for an isolated filled dot at $(5,0)$. What is the limit at $5$?`,
          7,
          R`The nearby line approaches $2(5)-3=7$.`,
        ),
        text(
          R`A left-hand limit is $-2$ and a right-hand limit is $2$. State the two-sided limit, or enter DNE.`,
          'DNE',
          R`The unequal one-sided limits prevent a two-sided limit.`,
          ['does not exist'],
        ),
        exact(
          R`Let $h(x)=x^2$ for $x<0$ and $h(x)=7$ for $x\ge0$. Find $\lim_{x\to0^-}h(x)$.`,
          0,
          R`Only the $x^2$ branch is used, and it tends to $0$.`,
        ),
      ],
      quickCheck: qc(
        'Which change can alter a function value without altering its limit at that input?',
        [
          'Changing only the value at the input',
          'Changing all values just to its right',
          'Replacing both nearby branches by different constants',
        ],
        0,
        'The limit ignores the isolated input itself. Changing a whole nearby branch can change or destroy the limit.',
      ),
    },
    {
      title: 'Limit laws, cancellation, and squeezing',
      sources: [
        source(
          '2.3',
          'Limit laws with denominator conditions, factoring, conjugates and squeeze theorem.',
        ),
      ],
      body: R`Once finite limits exist, sums, differences, constant multiples, and products pass through the limit. Quotients do too if the denominator's limit is nonzero. Consequently a polynomial limit can be evaluated by substitution, and a rational function can be evaluated that way wherever its denominator is nonzero. This is a theorem-based shortcut, not a universal instruction to substitute regardless of the result.

For instance, $\lim_{x\to2}(x^2+3)/(x+1)=7/3$. Both component limits exist and the denominator tends to $3$. In contrast, substituting into $(x^2-4)/(x-2)$ produces the expression $0/0$, which is undefined. It indicates that this attempted calculation did not determine the limit. It is not a number and does not by itself mean the limit fails.

Factor before taking the limit: for $x\ne2$, $(x^2-4)/(x-2)=x+2$, so the limit is $4$. Cancellation is valid at all the nearby inputs used by the limit. It does not fill the original hole. If roots obstruct factoring, multiply numerator and denominator by a conjugate. For $x\ne9$,

$\dfrac{\sqrt{x}-3}{x-9}=\dfrac{1}{\sqrt{x}+3}$.

The right side tends to $1/6$. We used $(\sqrt{x}-3)(\sqrt{x}+3)=x-9$, and near $9$ the square root is defined. Check those domain facts before manipulating a formula.

Sometimes bounds are more useful than simplification. The squeeze theorem says that if $g(x)\le f(x)\le h(x)$ for nearby inputs, and both bounding functions tend to $L$, then $f$ also tends to $L$. Because $-1\le\sin(1/x)\le1$, we have $-|x|\le x\sin(1/x)\le|x|$. Both bounds tend to zero, so the middle expression does too. The oscillating factor alone has no limit; multiplication by a shrinking factor controls every oscillation. Notice that the product law could not be applied directly, because one factor has no limit. The squeeze argument supplies the missing reasoning.`,
      terms: [
        term(
          'indeterminate-form',
          'Indeterminate form',
          'A substitution pattern that does not settle a limit.',
          R`The symbol $0/0$ records vanishing numerator and denominator, not a valid quotient.`,
          R`$(x^2-4)/(x-2)$ has form $0/0$ at $2$ but limit $4$.`,
          'Indeterminate does not mean nonexistent.',
        ),
        term(
          'squeeze-theorem',
          'Squeeze theorem',
          'Matching bounds determine a limit.',
          R`If $g\le f\le h$ near $a$ and both bounds tend to $L$, then $f$ tends to $L$.`,
          R`$|x\sin(1/x)|\le|x|$ implies limit $0$.`,
          'The bounds must approach the same value.',
        ),
      ],
      questions: [
        exact(
          R`Evaluate $\lim_{x\to-1}(2x^3-x+4)$.`,
          3,
          R`Substitution into the polynomial gives $-2+1+4=3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to2}(x^2+5)/(x+1)$.`,
          3,
          R`The denominator tends to $3\ne0$, so the quotient tends to $9/3=3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to5}(x^2-25)/(x-5)$.`,
          10,
          R`Cancel $x-5$ for $x\ne5$; the remaining $x+5$ tends to $10$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to1}(x^3-1)/(x-1)$.`,
          3,
          R`Factor $x^3-1=(x-1)(x^2+x+1)$; the limit is $3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to4}(\sqrt{x}-2)/(x-4)$.`,
          '1/4',
          R`Conjugate multiplication gives $1/(\sqrt{x}+2)$, whose limit is $1/4$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(\sqrt{1+x}-1)/x$.`,
          '1/2',
          R`For $x\ne0$, the quotient is $1/(\sqrt{1+x}+1)$, tending to $1/2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}x^2\cos(1/x)$.`,
          0,
          R`Its absolute value is at most $x^2$, which tends to zero, so squeeze applies.`,
        ),
        exact(
          R`If $\lim f=2$ and $\lim g=-3$ at the same input, find $\lim(4f-g^2)$.`,
          -1,
          R`The limit laws give $4(2)-(-3)^2=8-9=-1$.`,
        ),
        open(
          R`Explain why the product law alone cannot evaluate $\lim_{x\to0}x\cos(1/x)$, then evaluate it.`,
          R`The cosine factor has no limit, so the product law's hypotheses fail. But $|x\cos(1/x)|\le|x|$, so squeezing gives $0$.`,
        ),
        open(
          R`Give examples showing that a $0/0$ substitution can lead to different finite limits.`,
          R`At $0$, $x/x$ tends to $1$ while $x^2/x=x$ tends to $0$. Both unreduced expressions have vanishing numerator and denominator.`,
          'construct',
        ),
      ],
      review: [
        exact(
          R`Evaluate $\lim_{x\to-2}(x^2+3x+2)/(x+2)$.`,
          -1,
          R`The numerator factors as $(x+1)(x+2)$, leaving the limit of $x+1$, which is $-1$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to16}(\sqrt{x}-4)/(x-16)$.`,
          '1/8',
          R`The conjugate reduces the quotient to $1/(\sqrt{x}+4)$, tending to $1/8$.`,
        ),
        exact(
          R`If $-|x|^3\le h(x)\le|x|^3$ near zero, find $\lim_{x\to0}h(x)$.`,
          0,
          R`Both bounding functions tend to $0$, so the squeeze theorem gives $0$.`,
        ),
      ],
    },
    {
      title: 'Unbounded behavior and limits at infinity',
      sources: [
        source('2.2', 'Infinite one-sided limits and vertical asymptotes.'),
        source('2.3', 'Algebraic limit manipulation and bounds.'),
        source(
          '4.6',
          'Limits at positive and negative infinity, leading-power comparisons and horizontal asymptotes.',
        ),
      ],
      body: R`The notation $\lim_{x\to a}f(x)=+\infty$ means that outputs exceed every proposed positive height once the input is sufficiently close to $a$ through the relevant domain. It does not assign the real number infinity to $f(a)$. We call this an infinite limit, while keeping it distinct from the existence of a finite real limit. Negative infinity describes outputs falling below every negative threshold.

For $1/(x-2)^2$, the denominator is positive on both sides of $2$ and becomes arbitrarily small, so both one-sided limits are $+\infty$. For $1/(x-2)$, the left-hand limit is $-\infty$ and the right-hand limit is $+\infty$. In either example $x=2$ is a vertical asymptote: at least one one-sided limit is infinite. A denominator that vanishes is a reason to investigate, not a sufficient test for an asymptote. The canceled factor in $(x^2-4)/(x-2)$ leaves a finite limit instead.

A different notation, $x\to+\infty$, asks what happens as inputs grow without bound. Here there is no finite input being approached. For $f(x)=(3x^2-2)/(x^2+5)$, divide numerator and denominator by $x^2$:

$f(x)=\dfrac{3-2/x^2}{1+5/x^2}\longrightarrow3$.

The horizontal line $y=3$ describes the long-run output. It need not be a barrier that the graph can never cross. For rational functions, comparing highest powers is a useful consequence of this division: lower numerator degree gives limit zero; equal degrees give the ratio of leading coefficients. Higher numerator degree requires checking the leading power and its sign.

Treat negative infinity separately when odd powers or absolute values occur. For example, $\sqrt{x^2+1}/x=\sqrt{1+1/x^2}$ for $x>0$, but equals $-\sqrt{1+1/x^2}$ for $x<0$. Its limits are therefore $1$ and $-1$. The reason is $\sqrt{x^2}=|x|$, not $x$. A sign check before simplification prevents a convincing-looking wrong answer.`,
      terms: [
        term(
          'vertical-asymptote',
          'Vertical asymptote',
          'A vertical line approached with unbounded output.',
          R`The line $x=a$ is a vertical asymptote if a one-sided limit at $a$ is infinite.`,
          R`$x=2$ is a vertical asymptote of $1/(x-2)$.`,
          'A removable hole is not a vertical asymptote.',
        ),
        term(
          'limit-at-infinity',
          'Limit at infinity',
          'Long-run output as inputs grow without bound.',
          R`$\lim_{x\to\infty}f(x)=L$ means outputs stay close to $L$ for sufficiently large inputs.`,
          R`$\lim_{x\to\infty}1/x=0$.`,
          'An infinite input limit can have a finite output limit.',
        ),
      ],
      questions: [
        text(
          R`Find $\lim_{x\to3^+}1/(x-3)$. Enter infinity or -infinity for unbounded behavior.`,
          'infinity',
          R`The denominator is positive and shrinks to zero, so the quotient grows without bound.`,
          ['+infinity', 'inf'],
        ),
        text(
          R`Find $\lim_{x\to3^-}1/(x-3)$. Enter infinity or -infinity.`,
          '-infinity',
          R`The denominator is negative and approaches zero, so the quotient decreases without bound.`,
          ['-inf'],
        ),
        text(
          R`Find $\lim_{x\to-1}[-2/(x+1)^2]$. Enter infinity or -infinity.`,
          '-infinity',
          R`The denominator is positive and tends to zero; the negative numerator makes the limit $-\infty$.`,
          ['-inf'],
        ),
        exact(
          R`Evaluate $\lim_{x\to\infty}(4x^2+1)/(2x^2-3)$.`,
          2,
          R`Divide by $x^2$: the limit is $4/2=2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to-\infty}(5x-1)/(x^2+7)$.`,
          0,
          R`Dividing by $x^2$ leaves numerator $5/x-1/x^2\to0$ and denominator tending to $1$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to\infty}\sqrt{x^2+4}/x$.`,
          1,
          R`Here $x>0$ eventually; the expression is $\sqrt{1+4/x^2}\to1$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to-\infty}\sqrt{x^2+4}/x$.`,
          -1,
          R`Here $|x|=-x$; the expression is $-\sqrt{1+4/x^2}\to-1$.`,
        ),
        bool(
          R`True or false: every zero of a rational expression's denominator is a vertical asymptote.`,
          false,
          R`A common factor can cancel and leave a finite limit; $(x-1)/(x-1)$ has a hole at $1$.`,
        ),
        open(
          R`Explain why $\infty-\infty$ cannot be evaluated as zero in a limit.`,
          R`The two unbounded quantities may grow at different rates. As $x\to\infty$, $(x+1)-x=1$ but $2x-x=x\to\infty$. Infinity is not an ordinary real number permitting cancellation.`,
        ),
        open(
          R`Construct a function with horizontal asymptote $y=0$ that crosses that line infinitely often.`,
          R`For $x>0$, take $f(x)=\sin x/x$. The bound $|f(x)|\le1/x$ gives limit $0$, and $f(n\pi)=0$ for every positive integer $n$.`,
          'construct',
        ),
      ],
      review: [
        exact(
          R`Evaluate $\lim_{x\to\infty}(7-2x^3)/(4x^3+1)$.`,
          '-1/2',
          R`Equal degrees give the ratio $-2/4=-1/2$.`,
        ),
        text(
          R`Find $\lim_{x\to0^+}[-1/x^2]$. Enter infinity or -infinity.`,
          '-infinity',
          R`The positive squared denominator approaches zero, and the numerator is negative.`,
          ['-inf'],
        ),
        exact(
          R`Find the finite limit $\lim_{x\to-\infty}(3x+8)/(x-5)$.`,
          3,
          R`Dividing by $x$ gives $(3+8/x)/(1-5/x)\to3$.`,
        ),
      ],
    },
    {
      title: 'Continuity and the intermediate value theorem',
      sources: [
        source(
          '2.4',
          'Continuity at a point and on intervals, removable discontinuities and intermediate value theorem.',
        ),
      ],
      body: R`Continuity joins nearby behavior to the value at the point. A function is continuous at an interior domain point $a$ when $f(a)$ is defined, the finite limit as $x\to a$ exists, and that limit equals $f(a)$. Each requirement rules out a different failure: a missing value, incompatible nearby behavior, or a misplaced value. At an endpoint of a stated interval, use the appropriate one-sided limit. A function is continuous on an interval if it is continuous at every point of that interval in this sense.

Polynomials are continuous everywhere; rational functions are continuous where their denominators are nonzero. Composing continuous functions preserves continuity wherever the composition is defined. Thus $\sqrt{x^2+1}$ is continuous for all real $x$, while $1/\sqrt{x}$ is continuous only on its domain $x>0$. “Continuous on its domain” does not mean “defined everywhere.”

A finite hole is removable because a single reassignment repairs it. Define $f(x)=(x^2-16)/(x-4)$ for $x\ne4$. The nearby limit is $8$, so setting $f(4)=8$ produces continuity. A jump cannot be repaired with one value because its one-sided limits disagree. For a piecewise definition, match the branch limits before choosing the boundary value. For example, the branches $kx+1$ for $x<2$ and $x^2-1$ for $x\ge2$ join continuously exactly when $2k+1=3$, giving $k=1$.

The intermediate value theorem, or IVT, says that a continuous function on $[a,b]$ takes every value between $f(a)$ and $f(b)$. If the endpoint values have opposite signs, at least one root lies between them. For $p(x)=x^3-x-1$, we have $p(1)=-1$ and $p(2)=5$; continuity guarantees a root in $(1,2)$. This is an existence argument, not a formula for the root and not a uniqueness proof. Without continuity the conclusion can fail: $1/x$ changes sign across zero but never equals zero and is not continuous on an interval containing zero. Always name the interval on which the theorem's hypotheses hold.`,
      terms: [
        term(
          'continuity',
          'Continuity',
          'The nearby limit equals the actual value.',
          R`At an interior point, continuity means $\lim_{x\to a}f(x)=f(a)$ with both sides defined.`,
          R`Setting the missing value of $(x^2-16)/(x-4)$ to $8$ repairs continuity.`,
          'Existence of a limit alone does not establish continuity.',
        ),
        term(
          'intermediate-value-theorem',
          'Intermediate value theorem',
          'A continuous function takes intermediate output values.',
          R`A function continuous on $[a,b]$ takes every value between $f(a)$ and $f(b)$.`,
          R`Opposite signs of a continuous polynomial at $1$ and $2$ guarantee a root between them.`,
          'The theorem gives existence, not uniqueness.',
        ),
      ],
      questions: [
        exact(
          R`Set $f(x)=(x^2-36)/(x-6)$ for $x\ne6$. What value of $f(6)$ makes it continuous?`,
          12,
          R`The reduced expression is $x+6$, whose limit is $12$.`,
        ),
        exact(
          R`Set $f(x)=(x^3-8)/(x-2)$ for $x\ne2$. What value at $2$ makes it continuous?`,
          12,
          R`Factoring leaves $x^2+2x+4$, which tends to $12$.`,
        ),
        exact(
          R`Let $f(x)=kx+2$ for $x<1$ and $f(x)=x^2+4$ for $x\ge1$. Find $k$ for continuity.`,
          3,
          R`The left limit $k+2$ must equal the right value $5$, so $k=3$.`,
        ),
        bool(
          R`A function has $f(0)=2$ and $\lim_{x\to0}f(x)=3$. Is it continuous at zero?`,
          false,
          R`The finite limit differs from the assigned value, violating continuity.`,
        ),
        bool(
          R`Is $1/(x-4)$ continuous at every point of its domain?`,
          true,
          R`It is a rational function with nonzero denominator at every point of its domain; $4$ is excluded.`,
        ),
        bool(
          R`Does the IVT guarantee a zero of $x^3+x-4$ between $1$ and $2$?`,
          true,
          R`The polynomial is continuous, with values $-2$ and $6$, so zero lies between them.`,
        ),
        bool(
          R`Does the IVT alone guarantee that the root of a continuous function with opposite endpoint signs is unique?`,
          false,
          R`It guarantees at least one root; the function may cross zero several times.`,
        ),
        exact(
          R`For $f(x)=\sqrt{x}$ on $[0,9]$, what one-sided limit is needed at the left endpoint? Give its value.`,
          0,
          R`The right-hand limit as $x\to0^+$ is $0=f(0)$.`,
        ),
        open(
          R`Use the IVT to show $x^5+x=3$ has a solution between $1$ and $2$.`,
          R`Let $p(x)=x^5+x-3$. It is continuous on $[1,2]$, with $p(1)=-1$ and $p(2)=31$. The IVT yields $c\in(1,2)$ with $p(c)=0$, which is the required equation.`,
        ),
        open(
          R`A sensor's recorded output jumps from $-1$ to $1$. Why must you establish continuity before claiming it recorded zero in between?`,
          R`An actual continuous output would pass through zero, but a discontinuous record can skip it. The piecewise function equal to $-1$ before a time and $1$ thereafter is a counterexample.`,
        ),
      ],
      review: [
        exact(
          R`Find $k$ so that $f(x)=2x+k$ for $x<3$ and $f(x)=x^2$ for $x\ge3$ is continuous.`,
          3,
          R`Continuity requires $6+k=9$, so $k=3$.`,
        ),
        bool(
          R`Does continuity of $f$ on $[0,2]$, with $f(0)=5$ and $f(2)=9$, guarantee $f(c)=7$ for some $c\in(0,2)$?`,
          true,
          R`The target $7$ lies strictly between the endpoint values, so IVT supplies an interior point.`,
        ),
        exact(
          R`What value fills the removable hole of $f(x)=(x^2+x-6)/(x-2)$ at $x=2$?`,
          5,
          R`Factoring gives $(x+3)(x-2)$, so the nearby limit is $5$.`,
        ),
      ],
      quickCheck: qc(
        R`A continuous function has $f(0)=-2$ and $f(3)=4$. What does the IVT guarantee?`,
        ['Exactly one root', 'At least one root in $(0,3)$', 'A root at the midpoint'],
        1,
        'Continuity forces the intermediate value zero to occur. Neither uniqueness nor a particular location follows.',
      ),
    },
    {
      title: 'A precise guarantee with epsilon and delta',
      sources: [
        source('2.5', 'Epsilon–delta definition, quantifier order, and linear-function proofs.'),
      ],
      body: R`The phrase “arbitrarily close” can be stated using two positive tolerances. The output tolerance $\epsilon$ specifies how close $f(x)$ must be to a proposed limit $L$. We must find an input tolerance $\delta$ so that every permitted input within that distance of $a$, except $a$ itself, meets the output requirement:

$\text{for every }\epsilon>0\text{ there exists }\delta>0\text{ such that }0<|x-a|<\delta\implies|f(x)-L|<\epsilon.$

The order matters. Someone specifies any positive $\epsilon$; we then choose $\delta$, which may depend on that tolerance and on the fixed function and target. It must not depend on the particular $x$ subsequently tested. One good nearby input is insufficient: the implication must hold for all inputs satisfying the condition. The puncture $0<|x-a|$ preserves the distinction between a limit and a point value.

To prove $\lim_{x\to2}(3x+1)=7$, start by examining the required output error: $|(3x+1)-7|=3|x-2|$. To make this less than $\epsilon$, it is enough to require $|x-2|<\epsilon/3$. The proof now runs forward. Given $\epsilon>0$, choose $\delta=\epsilon/3>0$. Whenever $0<|x-2|<\delta$, we obtain $|(3x+1)-7|=3|x-2|<3\delta=\epsilon$. This covers every permitted input and every requested tolerance, so the limit is established.

A suitable delta need not be the largest possible one. Choosing $\epsilon/6$ in the same proof also works. For a constant function already equal to $L$, any positive delta works because the error is zero. For nonlinear functions a preliminary neighborhood bound is useful: to prove $x^2\to4$ as $x\to2$, first require $|x-2|<1$, giving $|x+2|<5$. Then $|x^2-4|<5|x-2|$, and $\delta=\min(1,\epsilon/5)$ suffices. This is the same tolerance-control idea with one extra factor to bound; it is not a different definition.

A useful way to organize a limit solution is to state the proposed value, identify the mechanism that controls all nearby inputs, and check that the mechanism applies on the relevant domain. Factoring controls an entire punctured neighborhood through an identity. Squeezing controls it through inequalities. An epsilon–delta proof controls it through an explicit implication. These are different presentations of reliable evidence, unlike a collection of isolated samples. When a limit fails, give a reason such as incompatible one-sided values, unbounded behavior, or two sequences of inputs producing incompatible outputs. The phrase “the calculator cannot evaluate it” identifies a tool limitation, not a mathematical reason.`,
      terms: [
        term(
          'epsilon-delta',
          'Epsilon–delta guarantee',
          'Every output tolerance has a uniform input tolerance.',
          R`For each $\epsilon>0$, choose $\delta>0$ making $0<|x-a|<\delta$ imply $|f(x)-L|<\epsilon$.`,
          R`For $3x+1\to7$ at $2$, choose $\delta=\epsilon/3$.`,
          'Delta may depend on epsilon, but not on the subsequently chosen input.',
        ),
        term(
          'punctured-neighborhood',
          'Punctured neighborhood',
          'Nearby inputs excluding the center.',
          R`The condition $0<|x-a|<\delta$ excludes $a$ but includes inputs on both sides within distance $\delta$.`,
          R`$0<|x-2|<0.1$ describes nearby inputs other than $2$.`,
          'Excluding the center is deliberate, not a missing case.',
        ),
      ],
      questions: [
        exact(
          R`For $f(x)=5x-2$ at $a=1$, the output error is $5|x-1|$. If $\epsilon=0.1$, give the largest positive $\delta$ that works.`,
          '1/50',
          R`Requiring $|x-1|<0.1/5=1/50$ makes the error less than $0.1$.`,
        ),
        exact(
          R`For $f(x)=-4x$ at $a=2$, let $\epsilon=0.2$. Give the largest working $\delta$.`,
          '1/20',
          R`The error is $4|x-2|$, so $\delta=0.2/4=1/20$.`,
        ),
        bool(
          R`In the limit definition, may the chosen $\delta$ depend on $\epsilon$?`,
          true,
          R`Yes. The input tolerance is chosen after the requested output tolerance.`,
        ),
        bool(
          R`After choosing $\epsilon$, may you choose a different $\delta$ for each tested input $x$?`,
          false,
          R`One delta must control all inputs in the resulting punctured neighborhood.`,
        ),
        exact(
          R`For the constant function $f(x)=8$ and proposed limit $8$, what is $|f(x)-8|$?`,
          0,
          R`The output error is identically zero, so every positive input tolerance works.`,
        ),
        bool(
          R`If a positive $\delta$ works for a given $\epsilon$, does $\delta/2$ also work?`,
          true,
          R`Its permitted input set is smaller, so the already established implication still holds.`,
        ),
        exact(
          R`For $f(x)=2x+5$ at $a=-1$, what limit does the error identity $|f(x)-L|=2|x+1|$ use?`,
          3,
          R`Here $L=f(-1)=3$, and $|2x+5-3|=2|x+1|$.`,
        ),
        exact(
          R`To prove $x^2\to9$ as $x\to3$, first assume $|x-3|<1$. What is the least integer upper bound on $|x+3|$ under this restriction?`,
          7,
          R`The condition gives $2<x<4$, hence $5<x+3<7$ and $|x+3|<7$.`,
        ),
        open(
          R`Prove directly that $\lim_{x\to-2}(2x-1)=-5$.`,
          R`Given $\epsilon>0$, choose $\delta=\epsilon/2$. If $0<|x+2|<\delta$, then $|(2x-1)-(-5)|=2|x+2|<2\delta=\epsilon$.`,
          'prove',
        ),
        open(
          R`Prove directly that $\lim_{x\to3}x^2=9$ using a preliminary radius of $1$.`,
          R`Given $\epsilon>0$, set $\delta=\min(1,\epsilon/7)$. If $0<|x-3|<\delta$, then $2<x<4$ and $|x+3|<7$. Hence $|x^2-9|=|x-3||x+3|<7|x-3|<7\delta\le\epsilon$.`,
          'prove',
        ),
      ],
      review: [
        exact(
          R`For $f(x)=8x+1$ near $0$, find the largest $\delta$ ensuring output error below $0.04$.`,
          '1/200',
          R`The error is $8|x|$, so $\delta=0.04/8=0.005=1/200$.`,
        ),
        bool(
          R`Does verifying one tolerance $\epsilon=0.01$ prove a limit by the epsilon–delta definition?`,
          false,
          R`The definition demands a suitable delta for every positive epsilon.`,
        ),
        open(
          R`Explain why the exclusion $x\ne a$ is consistent with a function having a removable hole at $a$.`,
          R`The implication concerns nearby domain inputs only. Its output control can hold even when the center is undefined, which is precisely why a removable hole can have a limit.`,
        ),
      ],
    },
  ],
};
