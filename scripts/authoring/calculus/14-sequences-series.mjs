import { r, source, term, n, e, t, o, qc } from './integration-helpers.mjs';
const seq = source(
  2,
  5,
  1,
  'Sequences',
  'Sequence limits, squeeze arguments, subsequences, and bounded monotone convergence.',
);
const sums = source(
  2,
  5,
  2,
  'Infinite Series',
  'Partial sums, geometric sums, and telescoping series.',
);
const integral = source(
  2,
  5,
  3,
  'The Divergence and Integral Tests',
  'Necessary term condition, integral-test hypotheses, p-series, and remainder estimates.',
);
const comp = source(2, 5, 4, 'Comparison Tests', 'Direct and positive finite limit comparison.');
const alt = source(
  2,
  5,
  5,
  'Alternating Series',
  'Alternating-series convergence/error and absolute versus conditional convergence.',
);
const ratio = source(
  2,
  5,
  6,
  'Ratio and Root Tests',
  'Absolute convergence via ratio/root limits and inconclusive boundary value.',
);
export default {
  number: 14,
  slug: 'calculus-sequences-series',
  title: 'Sequences and Infinite Series',
  intro: r`An infinite process needs a limit before it can be assigned a final value. A sequence asks whether individual terms approach a number; a series asks whether their running totals do. Those are different questions. This lesson builds a small collection of convergence arguments and explains when each applies. Identifying the right hypotheses matters more than memorizing a list of test names, and deciding convergence usually does not require finding the exact sum.`,
  sections: [
    {
      title: 'Sequences and limits',
      sources: [seq],
      terms: [
        term(
          'sequence-limit',
          'Limit of a sequence',
          'A value approached by all sufficiently late terms.',
          r`$a_n\to L$ means that for every $\varepsilon>0$, eventually $|a_n-L|<\varepsilon$.`,
          r`$n/(n+1)\to1$.`,
          'A long initial pattern does not establish eventual behavior.',
        ),
        term(
          'monotone-convergence',
          'Monotone convergence for sequences',
          'A bounded monotone real sequence has a finite limit.',
          r`An increasing sequence bounded above converges; the decreasing/bounded-below version is analogous.`,
          r`$1-1/n$ increases and is bounded above by $1$.`,
          'Boundedness alone does not prevent oscillation.',
        ),
      ],
      body: r`A sequence is a function whose input is an integer index: $a_1,a_2,a_3,\ldots$. Its terms may repeat, and their order matters. We write $a_n\to L$ if every sufficiently late term lies as close to $L$ as desired. Formally, for every $\varepsilon>0$, there is an integer $N$ such that $n\ge N$ implies $|a_n-L|<\varepsilon$. A finite number of early terms cannot alter that limit.

For $a_n=(3n+2)/(n+1)$, divide numerator and denominator by $n$ to obtain $(3+2/n)/(1+1/n)\to3$. The same limit laws used for real-variable functions apply to sequences when their component limits exist and a quotient's limiting denominator is nonzero. A real-variable limit can establish a sequence limit by restriction to integer inputs, but the reverse is not automatic between those inputs.

Oscillation needs care. The sequence $(-1)^n$ is bounded but does not converge: even-indexed terms equal $1$ and odd-indexed terms equal $-1$. In contrast, $(-1)^n/n\to0$ because its absolute value is $1/n\to0$. This is a squeeze argument: a shrinking envelope forces the oscillations to shrink as well.

Monotonicity supplies another route. Every increasing sequence bounded above converges, and every decreasing sequence bounded below converges. Both ingredients are needed. The increasing sequence $n$ is unbounded and diverges; the bounded alternating sequence just discussed is not monotone and diverges. For a recursively defined sequence, proving these properties can justify a limit before solving the equation it must satisfy.

For example, starting with $a_1=1$ and $a_{n+1}=(a_n+2)/2$ keeps every term below $2$ and increases the terms because $a_{n+1}-a_n=(2-a_n)/2>0$. It therefore converges. Passing to the limit in the recurrence gives $L=(L+2)/2$, hence $L=2$. Solving that fixed-point equation without first justifying convergence would only identify a candidate, not prove the sequence reaches it.`,
      questions: [
        n(r`Find $\lim_{n\to\infty}(3n+2)/(n+1)$.`, '3', r`Divide by $n$: $(3+2/n)/(1+1/n)\to3$.`),
        n(
          r`Find $\lim_{n\to\infty}n^2/(2n^2+1)$.`,
          '1/2',
          r`After dividing by $n^2$, the limit is $1/(2+0)=1/2$.`,
        ),
        n(
          r`Find $\lim_{n\to\infty}(-1)^n/n$.`,
          '0',
          r`Its absolute value is $1/n\to0$, so the squeeze theorem gives zero.`,
        ),
        n(
          r`Find $\lim_{n\to\infty}(1/3)^n$.`,
          '0',
          r`A geometric sequence with ratio magnitude below one tends to zero.`,
        ),
        n(
          r`Find $\lim_{n\to\infty}\sqrt{n^2+n}-n$.`,
          '1/2',
          r`Rationalize to $n/(\sqrt{n^2+n}+n)=1/(\sqrt{1+1/n}+1)\to1/2$.`,
        ),
        n(r`If $a_n=2-1/n$, find $a_4$.`, '7/4', r`$a_4=2-1/4=7/4$.`),
        t(
          r`Does the sequence $(-1)^n$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`Its even and odd subsequences have distinct constant values, so no common limit exists.`,
        ),
        t(
          r`An increasing real sequence is bounded above. Does it converge or diverge? Enter converges or diverges.`,
          'converges',
          r`The monotone convergence theorem applies because both monotonicity and the appropriate bound are supplied.`,
        ),
        o(
          r`Prove that $1/n\to0$ directly from the epsilon definition.`,
          r`Given $\varepsilon>0$, choose an integer $N>1/\varepsilon$. For $n\ge N$, $|1/n-0|\le1/N<\varepsilon$, as required.`,
          'prove',
        ),
        o(
          r`For $a_1=1$, $a_{n+1}=(a_n+2)/2$, prove convergence and identify the limit.`,
          r`Inductively $a_n<2$, since averaging a number below $2$ with $2$ stays below $2$. Also $a_{n+1}-a_n=(2-a_n)/2>0$. Bounded monotone convergence gives a limit, and $L=(L+2)/2$ forces $L=2$.`,
          'prove',
        ),
      ],
      review: [
        n(
          r`Find $\lim_{n\to\infty}(5n-1)/(2n+7)$.`,
          '5/2',
          r`Dividing by $n$ gives $(5-1/n)/(2+7/n)\to5/2$.`,
        ),
        n(
          r`Find $\lim_{n\to\infty}\sin(n)/n$.`,
          '0',
          r`The absolute value is at most $1/n$, which tends to zero.`,
        ),
        o(
          r`Give a bounded divergent sequence and explain why boundedness is insufficient.`,
          r`$a_n=(-1)^n$ stays in $[-1,1]$ but alternates between two distinct values forever. A bound prevents escape to infinity without forcing terms toward one point.`,
          'construct',
        ),
      ],
    },
    {
      title: 'Partial sums, geometric series, and telescoping',
      sources: [sums],
      terms: [
        term(
          'partial-sum',
          'Partial sum',
          'The finite running total of a series.',
          r`$S_N=\sum_{n=1}^N a_n$; the series converges to $S$ when $S_N\to S$.`,
          r`For $a_n=2^{-n}$, $S_N=1-2^{-N}$.`,
          'The limit of the terms is not the sum of the series.',
        ),
        term(
          'geometric-series',
          'Geometric series',
          'Terms with a constant ratio.',
          r`$\sum_{n=0}^{\infty}ar^n=a/(1-r)$ for $|r|<1$.`,
          r`$\sum_{n=0}^{\infty}3(1/2)^n=6$.`,
          'The starting index determines the first term.',
        ),
        term(
          'telescoping-series',
          'Telescoping series',
          'A sum in which intermediate terms cancel.',
          r`Writing $a_n=b_n-b_{n+1}$ gives $S_N=b_1-b_{N+1}$.`,
          r`$\sum_{n=1}^{\infty}1/[n(n+1)]=1$.`,
          'Cancel in a finite partial sum before passing to the limit.',
        ),
      ],
      body: r`The expression $\sum_{n=1}^{\infty}a_n$ means a limit of finite running totals, not an instruction to finish infinitely many additions. Define $S_N=a_1+\cdots+a_N$. If $S_N$ approaches a finite $S$, the series converges and its sum is $S$; otherwise it diverges. The sequence of terms and the sequence of partial sums must be kept separate.

For a geometric series starting at index zero, $S_N=a+ar+\cdots+ar^N$. Multiplying by $r$ and subtracting cancels the interior terms: $(1-r)S_N=a(1-r^{N+1})$. When $r\ne1$, $S_N=a(1-r^{N+1})/(1-r)$. If $|r|<1$, the remaining power tends to zero and the infinite sum is $a/(1-r)$. For nonzero $a$ and $|r|\ge1$, the terms fail to approach zero or grow, so the series diverges.

Starting indices matter. The series $\sum_{n=1}^{\infty}(1/2)^n$ begins at $1/2$, so its sum is $(1/2)/(1-1/2)=1$. Starting at zero adds the missing first term $1$ and makes the sum $2$. Negative ratios are allowed: $\sum_{n=0}^{\infty}(-1/3)^n=1/(1+1/3)=3/4$.

Telescoping uses a different cancellation. Partial fractions give $1/[n(n+1)]=1/n-1/(n+1)$. Adding only through $N$ yields $S_N=1-1/(N+1)$ because the interior reciprocals cancel. Its limit is $1$. Writing the finite boundary terms before taking a limit prevents losing an uncancelled first or last term.

A finite initial change affects the sum but not convergence. Adding, removing, or modifying finitely many terms changes every sufficiently late partial sum by one fixed number. That shift cannot turn a convergent sequence of partial sums into a divergent one. This fact lets later tests focus on eventual behavior, while still requiring careful indices when an exact sum is requested.`,
      questions: [
        n(
          r`Find $\sum_{n=0}^{\infty}3(1/2)^n$.`,
          '6',
          r`First term $3$ and ratio $1/2$ give $3/(1-1/2)=6$.`,
        ),
        n(
          r`Find $\sum_{n=1}^{\infty}(1/2)^n$.`,
          '1',
          r`The first term is $1/2$, so the sum is $(1/2)/(1-1/2)=1$.`,
        ),
        n(
          r`Find $\sum_{n=0}^{\infty}(-1/3)^n$.`,
          '3/4',
          r`The ratio is $-1/3$, giving $1/(1+1/3)=3/4$.`,
        ),
        n(
          r`Find $\sum_{n=2}^{\infty}(1/3)^n$.`,
          '1/6',
          r`The first term is $1/9$, so $(1/9)/(1-1/3)=1/6$.`,
        ),
        n(
          r`Find $S_3$ for the series with terms $a_n=1/n$, starting at $n=1$.`,
          '11/6',
          r`$S_3=1+1/2+1/3=11/6$.`,
        ),
        e(
          r`Give the finite sum $\sum_{n=1}^N1/[n(n+1)]$ as a formula in $N$.`,
          '1-1/(N+1)',
          r`Writing each term as $1/n-1/(n+1)$ cancels all interior terms, leaving $1-1/(N+1)$.`,
          ['N'],
          { positive: ['N'] },
        ),
        n(
          r`Evaluate $\sum_{n=1}^{\infty}1/[n(n+1)]$.`,
          '1',
          r`The partial sum is $1-1/(N+1)$, tending to $1$.`,
        ),
        n(
          r`Evaluate $\sum_{n=1}^{\infty}[1/(n+1)-1/(n+2)]$.`,
          '1/2',
          r`The partial sum leaves $1/2-1/(N+2)$, whose limit is $1/2$.`,
        ),
        o(
          r`Derive the finite geometric sum by multiplying and subtracting.`,
          r`For $S_N=a+ar+\cdots+ar^N$, $rS_N=ar+\cdots+ar^{N+1}$. Subtraction leaves $(1-r)S_N=a-ar^{N+1}$, giving the formula when $r\ne1$.`,
          'prove',
        ),
        o(
          r`Explain why changing the first ten terms of a series cannot change whether it converges.`,
          r`Every partial sum after the tenth changes by the same fixed difference between the two ten-term totals. Adding a fixed constant preserves convergence or divergence of the running totals.`,
        ),
      ],
      review: [
        n(r`Find $\sum_{n=0}^{\infty}5(1/4)^n$.`, '20/3', r`The sum is $5/(1-1/4)=20/3$.`),
        n(
          r`Find $\sum_{n=1}^{\infty}2/[n(n+1)]$.`,
          '2',
          r`Twice the telescoping series with sum $1$ gives $2$.`,
        ),
        n(
          r`Find the sum $\sum_{n=0}^{\infty}2(-1/2)^n$.`,
          '4/3',
          r`The first term is $2$ and ratio $-1/2$, so the sum is $2/(3/2)=4/3$.`,
        ),
      ],
      quickCheck: qc(
        r`Which sequence's convergence defines convergence of a series?`,
        ['Its individual terms alone', 'Its partial sums', 'Its indices'],
        1,
        r`Series convergence is defined through the sequence of finite running totals.`,
      ),
    },
    {
      title: 'The term test and integral test',
      sources: [integral],
      terms: [
        term(
          'series-term-test',
          'Term test for divergence',
          'A convergent series must have terms tending to zero.',
          r`If $a_n\not\to0$, then $\sum a_n$ diverges; $a_n\to0$ alone is inconclusive.`,
          r`$\sum n/(n+1)$ diverges because its terms tend to $1$.`,
          'The converse is false: the harmonic series has terms tending to zero but diverges.',
        ),
        term(
          'integral-test',
          'Integral test',
          'Compare a positive decreasing series with an improper integral.',
          r`For eventually positive, continuous, decreasing $f$ with $a_n=f(n)$, $\sum a_n$ and $\int f$ have the same convergence behavior.`,
          r`$\sum1/n^p$ converges exactly for $p>1$.`,
          'The integral and series need not have the same numerical value.',
        ),
      ],
      body: r`A convergent series must have $a_n\to0$. If its partial sums satisfy $S_n\to S$, then $a_n=S_n-S_{n-1}\to S-S=0$. The contrapositive is the term test: if terms approach a nonzero value or have no limit, the series diverges. This is an efficient first check, but it never proves convergence. The harmonic series $\sum1/n$ has vanishing terms and still diverges.

For positive decreasing terms, rectangles connect sums with integrals. Suppose $a_n=f(n)$ where $f$ is continuous, positive, and decreasing on a tail. The rectangles of height $f(n)$ lie on opposite sides of the neighboring areas, so the series converges exactly when the corresponding improper integral does. Eventual hypotheses suffice because finitely many initial terms do not affect convergence.

Applying the test to $f(x)=x^{-p}$ yields the $p$-series rule: $\sum_{n=1}^{\infty}1/n^p$ converges for $p>1$ and diverges for $p\le1$. For $p\le0$ the term test already proves divergence; for positive $p$ the integral test supplies the threshold. The series and integral share behavior, not exact value. In particular, $\int_1^\infty x^{-2}dx=1$ does not imply $\sum1/n^2=1$.

The same rectangle comparison bounds a positive remainder. If $R_N=\sum_{n=N+1}^{\infty}f(n)$, then $\int_{N+1}^{\infty}f(x)dx\le R_N\le\int_N^{\infty}f(x)dx$. For $f(x)=x^{-2}$, this gives $1/(N+1)\le R_N\le1/N$. The upper bound certifies an approximation error without requiring the exact series sum.

Logarithms often suggest the integral test. For $n\ge2$, $f(x)=1/[x(\ln x)^2]$ is positive and decreasing. Substitution $u=\ln x$ converts its tail integral into $\int u^{-2}du$, which converges. In contrast, $1/[x\ln x]$ produces $\ln\ln x$ and diverges. Slowly changing logarithmic factors can therefore decide convergence at the harmonic boundary.`,
      questions: [
        t(
          r`Classify $\sum_{n=1}^{\infty}n/(n+1)$ as converges or diverges.`,
          'diverges',
          r`Its terms tend to $1$, not zero, so the term test proves divergence.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}1/n^2$ as converges or diverges.`,
          'converges',
          r`This is a $p$-series with $p=2>1$.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}1/\sqrt n$ as converges or diverges.`,
          'diverges',
          r`Its $p$ exponent is $1/2\le1$.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}1/n$ as converges or diverges.`,
          'diverges',
          r`The harmonic series corresponds to $p=1$ and its integral grows logarithmically.`,
        ),
        t(
          r`Classify $\sum_{n=2}^{\infty}1/[n(\ln n)^2]$ as converges or diverges.`,
          'converges',
          r`Its positive decreasing integral becomes $\int u^{-2}du$ under $u=\ln x$, so it converges.`,
        ),
        t(
          r`Classify $\sum_{n=2}^{\infty}1/[n\ln n]$ as converges or diverges.`,
          'diverges',
          r`Its positive decreasing integral has antiderivative $\ln\ln x$, unbounded on the tail.`,
        ),
        n(
          r`For $\sum1/n^2$, use the integral-test upper bound to bound the tail after $N=20$.`,
          '1/20',
          r`$R_{20}\le\int_{20}^{\infty}x^{-2}dx=1/20$.`,
        ),
        n(
          r`What minimum integer $N$ makes that upper bound for the $1/n^2$ tail at most $1/100$?`,
          '100',
          r`Require $1/N\le1/100$, giving $N\ge100$.`,
        ),
        o(
          r`Prove that series convergence forces $a_n\to0$, using partial sums.`,
          r`Since $a_n=S_n-S_{n-1}$ and both partial-sum sequences approach the same finite sum $S$, limit subtraction gives $a_n\to S-S=0$.`,
          'prove',
        ),
        o(
          r`Explain why the integral test cannot simply be applied to an arbitrary sign-changing function that agrees with the terms at integers.`,
          r`The rectangle inequalities rely on positive, decreasing heights. An arbitrary interpolating function may oscillate or have large signed areas between integers, unrelated to the series. The test's continuity, positivity, and monotonicity assumptions prevent that mismatch.`,
        ),
      ],
      review: [
        t(
          r`Classify $\sum_{n=1}^{\infty}1/n^{3/2}$ as converges or diverges.`,
          'converges',
          r`The $p$ exponent $3/2$ exceeds one.`,
        ),
        n(
          r`Use the integral upper bound for the tail of $\sum1/n^3$ after $N=10$.`,
          '1/200',
          r`$R_{10}\le\int_{10}^{\infty}x^{-3}dx=1/(2\cdot10^2)=1/200$.`,
        ),
        o(
          r`Explain the logical error in “the terms approach zero, therefore the series converges.”`,
          r`Vanishing terms are necessary but not sufficient. The harmonic series supplies a counterexample: its terms vanish while its partial sums grow without bound.`,
        ),
      ],
    },
    {
      title: 'Direct and limit comparison',
      sources: [comp],
      terms: [
        term(
          'series-comparison',
          'Direct comparison test',
          'Bound positive terms by a known series.',
          r`If eventually $0\le a_n\le b_n$, convergence of $\sum b_n$ implies convergence of $\sum a_n$; divergence of $\sum a_n$ implies divergence of $\sum b_n$.`,
          r`$1/(n^2+1)\le1/n^2$ proves convergence.`,
          'The reverse implications do not follow.',
        ),
        term(
          'limit-comparison',
          'Limit comparison test',
          'Compare the eventual scale of positive terms.',
          r`If $a_n,b_n>0$ and $a_n/b_n\to L$ with $0<L<\infty$, both series have the same convergence behavior.`,
          r`$(3n+1)/(n^3+2)$ compared with $1/n^2$ has ratio limit $3$.`,
          'A ratio limit of zero or infinity is not the positive finite version of this theorem.',
        ),
      ],
      body: r`Known series can serve as benchmarks. If $0\le a_n\le b_n$ eventually and $\sum b_n$ converges, the partial sums of $a_n$ increase within a finite bound, so they converge. If the smaller series diverges, the larger one also diverges. These conclusions are directional: being below a divergent benchmark or above a convergent one is inconclusive.

For example, $0<1/(n^2+1)<1/n^2$, so $\sum1/(n^2+1)$ converges. In the opposite direction, $1/(n-1/2)>1/n$ for $n\ge1$, so its series diverges with the harmonic benchmark. Write the inequality explicitly. Replacing a denominator by a larger one makes a positive fraction smaller, a common source of reversed arguments.

Limit comparison handles similar leading behavior when an exact inequality is inconvenient. If positive terms satisfy $a_n/b_n\to L$ with $0<L<\infty$, then eventually the ratio lies, for example, between $L/2$ and $3L/2$. Thus constant multiples of $b_n$ bound $a_n$ above and below, forcing the same convergence behavior.

For $a_n=(3n+1)/(n^3+2)$, compare with $b_n=1/n^2$. The ratio is $(3n^3+n^2)/(n^3+2)\to3$. Since $\sum b_n$ converges, so does $\sum a_n$. For $a_n=1/\sqrt{n^2+1}$, comparison with $1/n$ gives ratio $n/\sqrt{n^2+1}\to1$, so that series diverges. A square root changes degree estimates and should be simplified carefully.

Sometimes the ratio tends to zero or infinity. The positive finite theorem then does not apply as stated; return to a suitable one-sided comparison or choose a better benchmark. In particular, a zero limit can prove convergence when the denominator benchmark converges, because the smaller terms are eventually bounded above by it. But zero relative to a divergent benchmark gives no universal conclusion. The aim is a justified relation between tails, not merely computing a limit and assigning a memorized label.`,
      questions: [
        t(
          r`Classify $\sum1/(n^2+1)$ for $n\ge1$ as converges or diverges.`,
          'converges',
          r`It is bounded above termwise by the convergent positive series $\sum1/n^2$.`,
        ),
        t(
          r`Classify $\sum1/(n-1/2)$ for $n\ge1$ as converges or diverges.`,
          'diverges',
          r`Its terms exceed $1/n$, whose series diverges.`,
        ),
        n(
          r`Compute the limit-comparison ratio limit of $(3n+1)/(n^3+2)$ to $1/n^2$.`,
          '3',
          r`The ratio is $(3n^3+n^2)/(n^3+2)$, tending to $3$.`,
        ),
        t(
          r`Classify $\sum(3n+1)/(n^3+2)$ for $n\ge1$ as converges or diverges.`,
          'converges',
          r`Limit comparison with $1/n^2$ has positive finite limit $3$.`,
        ),
        n(
          r`Compute the ratio limit of $1/\sqrt{n^2+1}$ to $1/n$.`,
          '1',
          r`The ratio is $n/\sqrt{n^2+1}=1/\sqrt{1+1/n^2}\to1$.`,
        ),
        t(
          r`Classify $\sum1/\sqrt{n^2+1}$ for $n\ge1$ as converges or diverges.`,
          'diverges',
          r`Limit comparison with the harmonic series has limit $1$.`,
        ),
        t(
          r`Classify $\sum(2n^2+1)/(n^3+5)$ for $n\ge1$ as converges or diverges.`,
          'diverges',
          r`Compare with $1/n$: the ratio tends to $2$, so harmonic divergence transfers.`,
        ),
        t(
          r`If $0\le a_n\le1/n$, does this alone prove convergence? Enter yes or no.`,
          'no',
          r`Both $a_n=1/n$ and $a_n=1/n^2$ satisfy the inequality but have different convergence behavior.`,
        ),
        o(
          r`Explain why a positive finite ratio limit yields two-sided constant bounds.`,
          r`For limit $L>0$, choose an error margin $L/2$. Eventually $L/2<a_n/b_n<3L/2$. Multiplying by positive $b_n$ gives $(L/2)b_n<a_n<(3L/2)b_n$, enabling comparison both ways.`,
          'prove',
        ),
        o(
          r`Give two examples showing that $a_n/(1/n)\to0$ does not decide convergence of $\sum a_n$.`,
          r`For $a_n=1/n^2$, the ratio is $1/n\to0$ and the series converges. For $a_n=1/[n\ln n]$ with $n\ge2$, the ratio is $1/\ln n\to0$ but the series diverges by the integral test.`,
          'construct',
        ),
      ],
      review: [
        t(
          r`Classify $\sum_{n=1}^{\infty}1/(n^3+7)$ as converges or diverges.`,
          'converges',
          r`Each term is at most $1/n^3$, a convergent $p$-series.`,
        ),
        n(
          r`Find the ratio limit of $(5n^2+1)/(n^4+3)$ to $1/n^2$.`,
          '5',
          r`Multiplying by $n^2$ gives $(5n^4+n^2)/(n^4+3)\to5$.`,
        ),
        o(
          r`A student says $1/(n^2+1)<1/n$ and concludes convergence. Repair the argument.`,
          r`The harmonic upper bound is divergent and gives no convergence conclusion. Use the sharper bound $1/(n^2+1)\le1/n^2$, whose series converges.`,
        ),
      ],
    },
    {
      title: 'Alternating, absolute, and conditional convergence',
      sources: [alt],
      terms: [
        term(
          'alternating-series-test',
          'Alternating-series test',
          'Decreasing magnitudes tending to zero make alternating sums converge.',
          r`If $b_n\ge0$ decreases to zero, then $\sum(-1)^{n+1}b_n$ converges and $|R_N|\le b_{N+1}$.`,
          r`The alternating harmonic remainder after $N$ terms is at most $1/(N+1)$.`,
          'Alternation alone is insufficient without the magnitude conditions.',
        ),
        term(
          'absolute-convergence',
          'Absolute convergence',
          'Convergence after replacing every term by its magnitude.',
          r`$\sum a_n$ converges absolutely when $\sum|a_n|$ converges. Absolute convergence implies convergence.`,
          r`$\sum(-1)^n/n^2$ converges absolutely.`,
          'A convergent series whose absolute series diverges is conditionally convergent.',
        ),
      ],
      body: r`Alternating signs can create convergence even when the positive magnitudes have a divergent sum. Suppose $b_n\ge0$ decreases to zero. Then $\sum_{n=1}^{\infty}(-1)^{n+1}b_n$ converges. The even partial sums rise and the odd partial sums fall, trapping the sum between them. Their separation is one shrinking term, which forces both limits to agree.

The same picture gives an error bound. After $N$ terms, the remainder has magnitude at most $b_{N+1}$ and has the sign of the first omitted term. For $1-1/2+1/3-1/4+\cdots$, the fourth partial sum is $7/12$ and the next term is positive $1/5$. The true sum lies between $7/12$ and $7/12+1/5$. The bound is not an equality: later cancellations generally make the actual error smaller.

A series converges **absolutely** if $\sum|a_n|$ converges. Absolute convergence guarantees ordinary convergence. Thus $\sum(-1)^n/n^2$ converges absolutely because the corresponding $p$-series has exponent $2$. A series is **conditionally convergent** if it converges but its absolute series diverges. The alternating harmonic series is the standard example: alternation yields convergence, while the harmonic magnitudes diverge.

Check every hypothesis. The alternating sequence of terms $(-1)^n$ does not tend to zero and its series diverges. Even vanishing alternating terms require a monotonicity argument or another test; isolated decreases are not enough. Eventual monotonicity suffices, because an initial finite segment does not affect convergence or the later remainder reasoning.

Use an alternating remainder bound only after establishing decreasing magnitudes on the tail being estimated. To guarantee an error at most $1/100$ for the alternating harmonic series, it suffices that $1/(N+1)\le1/100$, so $N\ge99$. For an alternating $1/n^2$ series, the bound improves to $1/(N+1)^2$. The convergence classification and a numerical error guarantee answer related but distinct questions.`,
      questions: [
        t(
          r`Classify $\sum_{n=1}^{\infty}(-1)^{n+1}/n$ as absolute, conditional, or divergent.`,
          'conditional',
          r`The magnitudes decrease to zero, so alternation gives convergence; the harmonic absolute series diverges.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}(-1)^n/n^2$ as absolute, conditional, or divergent.`,
          'absolute',
          r`The absolute series is a convergent $p$-series with $p=2$.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}(-1)^n$ as absolute, conditional, or divergent.`,
          'divergent',
          r`Its terms do not approach zero, so the term test rules out convergence.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}(-1)^{n+1}/\sqrt n$ as absolute, conditional, or divergent.`,
          'conditional',
          r`Magnitudes decrease to zero, but the absolute $p$-series with $p=1/2$ diverges.`,
        ),
        n(
          r`Find the alternating-series error bound after $10$ terms of $\sum_{n=1}^{\infty}(-1)^{n+1}/n$.`,
          '1/11',
          r`The first omitted magnitude is $1/(10+1)=1/11$.`,
        ),
        n(
          r`What minimum $N$ guarantees error at most $1/100$ by that bound?`,
          '99',
          r`Require $1/(N+1)\le1/100$, giving $N\ge99$.`,
        ),
        n(
          r`Find $S_4$ for $1-1/2+1/3-1/4+\cdots$.`,
          '7/12',
          r`A common denominator gives $12/12-6/12+4/12-3/12=7/12$.`,
        ),
        n(
          r`For $\sum_{n=1}^{\infty}(-1)^{n+1}/n^2$, bound the error after $9$ terms.`,
          '1/100',
          r`The first omitted term has magnitude $1/10^2=1/100$.`,
        ),
        o(
          r`Explain why the fourth alternating harmonic partial sum is a lower bound for the sum.`,
          r`The first omitted term is positive. Under decreasing magnitudes, later negative terms cannot cancel more than the preceding positive increments, so the remainder is positive and no larger than the fifth term.`,
        ),
        o(
          r`Describe how to establish conditional convergence without confusing it with simple convergence.`,
          r`First prove the signed series converges, for example with the alternating-series test. Then separately prove the absolute-value series diverges. Both conclusions are necessary for the conditional classification.`,
          'interpret',
        ),
      ],
      review: [
        t(
          r`Classify $\sum_{n=1}^{\infty}(-1)^n/n^3$ as absolute, conditional, or divergent.`,
          'absolute',
          r`Its magnitude series has $p=3>1$.`,
        ),
        n(
          r`For an alternating series with decreasing magnitudes $b_n=1/(2n+1)$, bound the error after $N=4$ terms, starting at $n=1$.`,
          '1/11',
          r`The first omitted index is $5$, so its magnitude is $1/(2\cdot5+1)=1/11$.`,
        ),
        o(
          r`An alternating series has magnitudes tending to zero but they are not known to decrease. What can be concluded from the alternating-series test alone?`,
          r`Its hypotheses have not been verified, so that test alone yields no conclusion. One must establish eventual decrease or use another valid convergence argument.`,
        ),
      ],
      quickCheck: qc(
        r`A signed series converges, but its absolute-value series diverges. What is its classification?`,
        ['Absolutely convergent', 'Conditionally convergent', 'Divergent'],
        1,
        r`Conditional convergence means convergence that depends on the signs rather than convergence of total magnitudes.`,
      ),
    },
    {
      title: 'Ratio and root tests, with method selection',
      sources: [ratio, integral],
      terms: [
        term(
          'ratio-test',
          'Ratio test',
          'Compare successive term magnitudes.',
          r`If $L=\lim|a_{n+1}/a_n|$, then $L<1$ implies absolute convergence, $L>1$ implies divergence, and $L=1$ is inconclusive.`,
          r`For $a_n=2^n/n!$, the ratio is $2/(n+1)\to0$.`,
          'A ratio limit of one does not establish divergence.',
        ),
        term(
          'root-test',
          'Root test',
          'Measure the exponential scale of term magnitudes.',
          r`If $L=\lim\sqrt[n]{|a_n|}$, the same below-one/above-one/inconclusive-at-one conclusions hold.`,
          r`For $a_n=((2n+1)/(3n+1))^n$, the root limit is $2/3$.`,
          'Take the absolute value before an even root of a signed term.',
        ),
      ],
      body: r`Factorials and exponentials often simplify when successive terms are divided. The ratio test uses $L=\lim_{n\to\infty}|a_{n+1}/a_n|$, assuming the ratios are defined eventually. If $L<1$, the series converges absolutely; if $L>1$, including an infinite limit, it diverges. At $L=1$ the test is inconclusive. Both the harmonic series and the convergent $1/n^2$ series have ratio limit one.

For $a_n=2^n/n!$, the ratio is $[2^{n+1}/(n+1)!]/[2^n/n!]=2/(n+1)\to0$. Thus the series converges absolutely. For $a_n=n!/3^n$, the ratio is $(n+1)/3\to\infty$, proving divergence. Write the factorial cancellation explicitly: $(n+1)!=(n+1)n!$.

The root test is useful when the entire term is raised to the index. If $L=\lim\sqrt[n]{|a_n|}$, the same three outcomes apply. For $a_n=((2n+1)/(3n+1))^n$, the root is $(2n+1)/(3n+1)\to2/3$, giving convergence. Both tests work by comparison with geometric behavior: an eventual ratio or root below one bounds the tail by a decaying geometric series.

A practical sequence is to check whether the terms vanish, then look for a geometric or telescoping form. Positive rational or power-like terms often fit comparison; logarithmic boundary cases often fit the integral test. Alternating terms invite absolute-convergence analysis first, then the alternating test if needed. Factorials favor the ratio test, while index powers favor the root test. These are useful tendencies, not exclusive rules.

When a test is inconclusive, change the argument rather than reinterpret its conclusion. For $a_n=1/n^2$, ratio and root limits equal one, but the $p$-series theorem settles convergence immediately. Record both the test's hypotheses and what it actually establishes. A convergence proof does not automatically evaluate the sum or bound the remainder; those require the additional tools appropriate to the series.`,
      questions: [
        n(r`Find the ratio-test limit for $a_n=2^n/n!$.`, '0', r`$|a_{n+1}/a_n|=2/(n+1)\to0$.`),
        t(
          r`Classify $\sum_{n=1}^{\infty}2^n/n!$ as converges or diverges.`,
          'converges',
          r`The ratio limit is $0<1$, proving absolute convergence.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}n!/3^n$ as converges or diverges.`,
          'diverges',
          r`The successive ratio $(n+1)/3$ tends to infinity.`,
        ),
        n(
          r`Find the ratio-test limit for $a_n=n/2^n$.`,
          '1/2',
          r`The ratio is $(n+1)/(2n)\to1/2$.`,
        ),
        n(
          r`Find the root-test limit for $a_n=((2n+1)/(3n+1))^n$.`,
          '2/3',
          r`Taking the $n$th root leaves $(2n+1)/(3n+1)\to2/3$.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}((2n+1)/(3n+1))^n$ as converges or diverges.`,
          'converges',
          r`Its root limit is $2/3<1$.`,
        ),
        n(
          r`Find the ratio-test limit for $a_n=1/n^2$.`,
          '1',
          r`$a_{n+1}/a_n=n^2/(n+1)^2\to1$. This limit alone is inconclusive.`,
        ),
        t(
          r`A root-test limit equals $1$. Enter converges, diverges, or inconclusive for this test's conclusion.`,
          'inconclusive',
          r`Both convergence and divergence are possible when the limit is one.`,
        ),
        o(
          r`Explain why a ratio limit below one leads to a geometric upper bound on the tail.`,
          r`Choose $q$ strictly between the limit and $1$. Eventually $|a_{n+1}|\le q|a_n|$. Iterating gives $|a_{N+k}|\le|a_N|q^k$, whose geometric sum converges.`,
          'prove',
        ),
        o(
          r`Choose and justify tests for $\sum1/n^3$, $\sum3^n/n!$, and $\sum(-1)^n/\sqrt n$.`,
          r`Use the $p$-series test with $p=3$ for the first. Use the ratio test, whose ratio tends to zero, for the factorial denominator. For the third, decreasing magnitudes give alternating convergence, while the absolute $p=1/2$ series diverges, so convergence is conditional.`,
        ),
      ],
      review: [
        n(
          r`Find the ratio limit for $a_n=n^2/3^n$.`,
          '1/3',
          r`The ratio is $(n+1)^2/(3n^2)\to1/3$.`,
        ),
        t(
          r`Classify $\sum_{n=1}^{\infty}((3n+1)/(2n+1))^n$ as converges or diverges.`,
          'diverges',
          r`The root limit is $3/2>1$.`,
        ),
        o(
          r`Why does a ratio limit of one for $1/n^3$ not conflict with convergence of its series?`,
          r`The ratio test is explicitly inconclusive at one. The independent $p$-series criterion with exponent $3>1$ establishes convergence; the two statements are consistent.`,
        ),
      ],
    },
  ],
};
