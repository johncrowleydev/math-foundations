import {
  R,
  source,
  term,
  exact,
  expr,
  calc,
  text,
  bool,
  open,
  qc,
} from './differentiation-helpers.mjs';
export default {
  number: 7,
  slug: 'calculus-mvt-function-behavior',
  title: 'Mean Value Theorem and Function Behavior',
  intro: R`A derivative gives local information. The mean value theorem connects that information to an entire interval, explaining why derivative signs control monotonicity and why bounds on slope limit changes in output. We then use the second derivative to describe how slopes change and distinguish concavity from increasing or decreasing behavior. The final sections introduce L’Hôpital’s rule for certain indeterminate limits. Theorems in this lesson are conditional tools: checking continuity, differentiability, interval structure, and the form of a limit is part of the mathematics, not a formality after using a formula.`,
  sections: [
    {
      title: 'Rolle’s theorem and the mean value theorem',
      sources: [
        source('4.4', 'Rolle and mean value theorems, hypotheses and secant-slope conclusions.'),
      ],
      body: R`Rolle’s theorem starts with a function continuous on a closed interval $[a,b]$, differentiable on its interior $(a,b)$, and satisfying $f(a)=f(b)$. It guarantees an interior point $c$ with $f'(c)=0$. If the function is constant, every interior point works. If it varies, continuity ensures its extreme values occur somewhere, and equal endpoint values force an appropriate nonconstant extreme into the interior; a differentiable interior extremum has zero derivative.

For $f(x)=x^2-4x$ on $[0,4]$, the endpoints both give zero. The function is polynomial, so the regularity hypotheses hold. Its derivative is $2x-4$, which vanishes at $c=2$. This point lies strictly inside the interval, as required. The theorem guarantees existence rather than prescribing a midpoint; symmetry happens to locate the point in this example.

The mean value theorem, or MVT, removes the equal-endpoint assumption. If $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then some $c\in(a,b)$ satisfies $f'(c)=[f(b)-f(a)]/(b-a)$. At some instant the local slope matches the average slope across the interval. Subtracting the secant line from $f$ creates a function with equal endpoint values, so Rolle’s theorem supplies a proof.

For $f(x)=x^2$ on $[1,5]$, the average slope is $(25-1)/4=6$. Solving $2c=6$ gives $c=3$. For a square root on an interval starting at zero, the derivative need not exist at the endpoint: continuity is required there, while differentiability is required only in the interior.

The hypotheses cannot be dropped merely because the picture looks plausible. The function $|x|$ on $[-1,1]$ has equal endpoint values but no point with derivative zero: it has a corner at zero. Thus Rolle’s theorem does not apply. Likewise, a jump can break the connection between a secant slope and the available tangent slopes. Check the whole stated interval, not just its endpoints.`,
      terms: [
        term(
          'rolle-theorem',
          'Rolle’s theorem',
          'Equal endpoint values force a zero interior slope under regularity hypotheses.',
          R`Continuity on $[a,b]$, differentiability on $(a,b)$, and $f(a)=f(b)$ imply some interior $f'(c)=0$.`,
          R`For $x^2-4x$ on $[0,4]$, $c=2$.`,
          'The conclusion can fail at a corner.',
        ),
        term(
          'mean-value-theorem',
          'Mean value theorem',
          'An interior derivative equals the interval’s average rate.',
          R`Under continuity on $[a,b]$ and differentiability on $(a,b)$, some $f'(c)=(f(b)-f(a))/(b-a)$.`,
          R`For $x^2$ on $[1,5]$, $c=3$.`,
          'It guarantees existence, not necessarily uniqueness or a midpoint.',
        ),
      ],
      questions: [
        exact(
          R`For $f(x)=x^2$ on $[2,6]$, find the MVT point $c$.`,
          4,
          R`The average slope is $(36-4)/4=8$; $2c=8$ gives $c=4$.`,
        ),
        exact(
          R`For $f(x)=x^2-6x$ on $[0,6]$, find the Rolle point.`,
          3,
          R`Endpoints both give zero, and $f'(c)=2c-6=0$ yields $c=3$.`,
        ),
        exact(
          R`For $f(x)=\sqrt{x}$ on $[0,16]$, find the MVT point.`,
          4,
          R`The secant slope is $4/16=1/4$. Solve $1/(2\sqrt{c})=1/4$, obtaining $c=4$.`,
        ),
        exact(
          R`For $f(x)=1/x$ on $[1,4]$, find the MVT point.`,
          2,
          R`The average slope is $(1/4-1)/3=-1/4$. Solve $-1/c^2=-1/4$ in $(1,4)$, giving $c=2$.`,
        ),
        bool(
          R`Does Rolle’s theorem apply to $|x|$ on $[-1,1]$?`,
          false,
          R`It fails differentiability at the interior point zero.`,
        ),
        bool(
          R`Does the MVT require derivatives at the two interval endpoints?`,
          false,
          R`It requires continuity on the closed interval and differentiability only in its open interior.`,
        ),
        bool(
          R`Does the MVT guarantee a unique point $c$?`,
          false,
          R`For a linear function every interior point has the secant slope, so uniqueness does not follow.`,
        ),
        exact(
          R`A differentiable position function increases by $150$ meters in $30$ seconds and is continuous on the closed interval. What velocity must occur at an interior time?`,
          5,
          R`The MVT guarantees the average velocity $150/30=5$ meters per second.`,
        ),
        open(
          R`Prove the MVT from Rolle’s theorem by subtracting a secant line.`,
          R`Set $m=(f(b)-f(a))/(b-a)$ and $g(x)=f(x)-[f(a)+m(x-a)]$. Then $g(a)=g(b)=0$, and $g$ inherits the required continuity and differentiability. Rolle gives $g'(c)=0$, so $f'(c)=m$.`,
          'prove',
        ),
        open(
          R`Explain exactly why $1/x$ on $[-1,1]$ cannot be used with the MVT despite having endpoint values.`,
          R`It is undefined at the interior point zero, so it is not continuous on the closed interval. The theorem requires the entire interval, not just defined endpoints.`,
        ),
      ],
      review: [
        exact(
          R`For $f(x)=x^2$ on $[-3,1]$, find the MVT point.`,
          -1,
          R`The average slope is $(1-9)/4=-2$, so $2c=-2$ and $c=-1$.`,
        ),
        exact(
          R`For $f(x)=\sqrt{x}$ on $[1,9]$, find the MVT point.`,
          4,
          R`The average slope is $(3-1)/8=1/4$, matched by $1/(2\sqrt{c})$ at $c=4$.`,
        ),
        bool(
          R`Does Rolle’s theorem apply to $f(x)=x^3-x$ on $[-1,1]$?`,
          true,
          R`The polynomial is continuous and differentiable, and both endpoint values are zero.`,
        ),
      ],
      quickCheck: qc(
        'Which hypothesis belongs to the MVT?',
        [
          'Differentiability only at the endpoints',
          'Continuity on the closed interval and differentiability inside it',
          'Equal endpoint values are always required',
        ],
        1,
        'Equal endpoints are the additional special condition for Rolle’s theorem. The MVT permits any endpoint values.',
      ),
    },
    {
      title: 'Monotonicity, uniqueness, and change bounds',
      sources: [source('4.4', 'MVT consequences, constant derivatives and monotonicity.')],
      body: R`Suppose $f'(x)>0$ throughout an interval. Choose any two inputs $u<v$ in that interval. Applying the MVT on $[u,v]$ gives $f(v)-f(u)=f'(c)(v-u)>0$, so $f$ is strictly increasing. Similarly a negative derivative throughout an interval gives strict decrease, while $f'\ge0$ gives nondecrease. The interval matters because the theorem must connect each chosen pair without crossing a gap in the domain.

A zero derivative throughout an interval forces a constant function there: the same equation gives $f(v)-f(u)=0$. Thus if two differentiable functions have identical derivatives on an interval, their difference is constant. This result will explain the arbitrary constant in antiderivatives. On a disconnected domain, the constants may differ between components. For example, a function equal to $1$ on $x<0$ and $7$ on $x>0$ has zero derivative everywhere it is defined, but is not one constant across both pieces.

Derivative bounds produce output bounds. If $|f'(x)|\le M$ throughout an interval and the MVT applies between $u$ and $v$, then $|f(v)-f(u)|\le M|v-u|$. If instead $m\le f'\le M$ and $u<v$, then $m(v-u)\le f(v)-f(u)\le M(v-u)$. These are guaranteed bounds under their stated hypotheses, unlike an unqualified tangent estimate.

For $f(x)=\sin x$, the derivative satisfies $|\cos x|\le1$. Hence $|\sin v-\sin u|\le|v-u|$ for all real inputs. A radian input error at most $0.01$ therefore produces sine output error at most $0.01$. The bound need not be attained to be useful.

Monotonicity also proves uniqueness when combined with an existence theorem. The polynomial $p(x)=x^3+x-3$ has opposite signs at $1$ and $2$, so IVT gives a root there. Its derivative $3x^2+1$ is positive everywhere, so it is strictly increasing and cannot have two distinct roots. Keep the two logical jobs separate: continuity supplies existence, and the derivative sign supplies uniqueness.`,
      terms: [
        term(
          'monotonicity-from-derivative',
          'Monotonicity from derivative sign',
          'A sign condition throughout an interval controls ordering.',
          R`If $f'>0$ on an interval, then $f$ is strictly increasing there.`,
          R`$x^3+x$ is strictly increasing because $3x^2+1>0$.`,
          'The conclusion must not be applied across a domain gap.',
        ),
        term(
          'derivative-change-bound',
          'Derivative change bound',
          'A slope bound limits total change.',
          R`If $|f'|\le M$ between $u,v$, then $|f(v)-f(u)|\le M|v-u|$ under the MVT hypotheses.`,
          R`Sine changes by at most the magnitude of its radian input change.`,
          'A bound valid throughout an interval differs from a derivative known at one point.',
        ),
      ],
      questions: [
        exact(
          R`If $|f'|\le3$ between inputs $2$ and $2.2$, give the guaranteed upper bound $3|2.2-2|$ on output change magnitude.`,
          '3/5',
          R`The bound is $3(0.2)=0.6$.`,
        ),
        exact(
          R`If $2\le f'\le5$ on $[1,4]$, give the sharp lower bound on $f(4)-f(1)$ implied by these derivative bounds.`,
          6,
          R`Multiply the minimum slope by interval width: $2(3)=6$.`,
        ),
        exact(
          R`If $2\le f'\le5$ on $[1,4]$, give the sharp upper bound on $f(4)-f(1)$ implied by these derivative bounds.`,
          15,
          R`The maximum slope bound gives $5(3)=15$.`,
        ),
        exact(
          R`If $f'=0$ throughout $[0,5]$ and $f(2)=9$, find $f(4)$.`,
          9,
          R`The function is constant on the interval, so all values are $9$.`,
        ),
        text(
          R`Classify $f(x)=x^3+2x$ on the real line as strictly increasing or strictly decreasing.`,
          'strictly increasing',
          R`Its derivative $3x^2+2$ is positive everywhere.`,
        ),
        text(
          R`Classify $f(x)=-x^3-x$ on the real line as strictly increasing or strictly decreasing.`,
          'strictly decreasing',
          R`Its derivative $-3x^2-1$ is negative everywhere.`,
        ),
        bool(
          R`Can a strictly increasing function have two distinct zeros?`,
          false,
          R`Two ordered inputs must have ordered distinct outputs, so both cannot produce zero.`,
        ),
        exact(
          R`Using the derivative bound $|\cos x|\le1$, give the bound $1|\Delta x|$ on sine-output error for a radian input error of at most $0.03$.`,
          '3/100',
          R`MVT gives output error at most $1(0.03)=0.03$.`,
        ),
        open(
          R`Prove that equal derivatives on an interval imply the two functions differ by a constant.`,
          R`For $h=f-g$, equality of derivatives gives $h'=0$. Apply MVT between any two inputs to obtain $h(v)-h(u)=h'(c)(v-u)=0$. Thus $h$ is constant.`,
          'prove',
        ),
        open(
          R`Prove $x^3+x-3=0$ has exactly one real solution.`,
          R`The polynomial is continuous and has values $-1$ at $1$ and $7$ at $2$, so IVT gives a root. Its derivative $3x^2+1>0$ makes it strictly increasing on the real line, so it has at most one root.`,
          'prove',
        ),
      ],
      review: [
        exact(
          R`If $|g'|\le8$ on an interval of width $1/20$, give the mean-value-theorem bound $M|b-a|$ on the magnitude of its endpoint change.`,
          '2/5',
          R`$8(1/20)=2/5$.`,
        ),
        exact(
          R`If $f'=4$ on $[0,3]$ and $f(0)=2$, find $f(3)$.`,
          14,
          R`The constant derivative gives change $4(3)=12$, so $f(3)=14$.`,
        ),
        bool(
          R`A function has derivative zero on $(-\infty,0)\cup(0,\infty)$. Must the constants on both components be equal?`,
          false,
          R`MVT cannot cross the domain gap at zero; each interval may have a different constant.`,
        ),
      ],
    },
    {
      title: 'Reading derivative signs and concavity',
      sources: [source('4.5', 'Increasing/decreasing intervals, concavity and inflection points.')],
      body: R`The first derivative describes whether a function rises or falls; the second describes whether its slopes rise or fall. A function is concave up on an interval when its slopes are nondecreasing, and concave down when they are nonincreasing. For a twice-differentiable function, $f''>0$ is a sufficient condition for concavity up and $f''<0$ for concavity down. An increasing function can have either kind of concavity, and so can a decreasing function.

For $f(x)=x^3-3x$, the first derivative is $3(x-1)(x+1)$. It is positive on $(-\infty,-1)$ and $(1,\infty)$, and negative on $(-1,1)$. Thus the graph rises, falls, and rises across those intervals. Choose a test input in each interval or reason directly about the signs of the factors. Do not infer the whole sign chart from a derivative value at only one location.

The second derivative is $6x$. The function is concave down for $x<0$ and concave up for $x>0$. At zero it changes concavity and is continuous, so $(0,0)$ is an inflection point. Its first derivative there is $-3$, demonstrating that an inflection point does not require a horizontal tangent. Conversely, $x^4$ has second derivative zero at zero but stays concave up on both sides, so zero is not an inflection point.

A derivative graph must be interpreted as a graph of rates, not original heights. If $f'$ is below its horizontal axis but increasing, then $f$ decreases while becoming less steep: it is concave up. If $f'$ is above the axis but decreasing, then $f$ increases at a diminishing rate and is concave down. These combinations are useful when reading velocity and acceleration data.

An inflection candidate can occur where the second derivative vanishes or fails to exist, but the defining question is whether concavity changes at a point of the original graph. A discontinuity or missing point is not an inflection point merely because curvature signs differ on separated intervals. Keep the function's domain and continuity in view throughout the sign analysis.`,
      terms: [
        term(
          'concavity',
          'Concavity',
          'How slopes change across an interval.',
          R`Positive second derivative implies concavity up; negative second derivative implies concavity down.`,
          R`$e^{-x}$ is decreasing but concave up because its first derivative is negative and second is positive.`,
          'Concavity is not the same as increasing or decreasing.',
        ),
        term(
          'inflection-point',
          'Inflection point',
          'A continuous graph point where concavity changes.',
          R`A sign change of the second derivative across a continuous point can establish an inflection.`,
          R`$x^3$ changes concavity at zero; $x^4$ does not.`,
          'A zero second derivative alone is only a candidate.',
        ),
      ],
      questions: [
        text(
          R`For $f(x)=x^3-3x$, is $f$ increasing or decreasing on $(0,1)$?`,
          'decreasing',
          R`$f'=3x^2-3<0$ on that interval.`,
        ),
        text(
          R`For $f(x)=x^3-3x$, is $f$ increasing or decreasing on $(2,3)$?`,
          'increasing',
          R`$f'=3x^2-3>0$ there.`,
        ),
        text(
          R`For $f(x)=x^3-3x$, state the concavity on $(-2,-1)$.`,
          'concave down',
          R`$f''=6x<0$ on negative inputs.`,
        ),
        text(
          R`For $f(x)=x^3-3x$, state the concavity on $(1,2)$.`,
          'concave up',
          R`$f''=6x>0$ on positive inputs.`,
        ),
        exact(
          R`Find the inflection input of $f(x)=x^3-6x^2$.`,
          2,
          R`$f''=6x-12$ changes sign at $x=2$, and the polynomial is continuous there.`,
        ),
        bool(
          R`Does $x^4$ have an inflection point at zero?`,
          false,
          R`Its second derivative is $12x^2$, positive on both sides, so concavity does not change.`,
        ),
        text(
          R`A function has $f'<0$ and $f''>0$ throughout an interval. State its concavity.`,
          'concave up',
          R`The positive second derivative means slopes increase, even though the function itself decreases.`,
        ),
        text(
          R`A function has $f'>0$ and $f''<0$ throughout an interval. Is it increasing or decreasing?`,
          'increasing',
          R`The first derivative controls rise/fall; positive slope means increasing.`,
        ),
        open(
          R`Construct a function that decreases while remaining concave up, and verify both properties.`,
          R`Take $f(x)=e^{-x}$. Its derivative $-e^{-x}<0$ shows decrease, and its second derivative $e^{-x}>0$ shows concavity up.`,
          'construct',
        ),
        open(
          R`Explain why solving $f''(x)=0$ is insufficient to list all inflection points.`,
          R`A zero may have no concavity change, as for $x^4$ at zero. Also a concavity change can occur where the second derivative is undefined. Candidates must be checked against actual concavity and the original function's continuity.`,
        ),
      ],
      review: [
        text(
          R`For $f(x)=\ln x$ on $x>0$, state its concavity.`,
          'concave down',
          R`The second derivative is $-1/x^2<0$.`,
        ),
        exact(
          R`Find the inflection input of $f(x)=x^3+3x^2$.`,
          -1,
          R`$f''=6x+6$ changes sign at $-1$.`,
        ),
        bool(
          R`Must an inflection point have first derivative zero?`,
          false,
          R`The function $x^3+x$ changes concavity at zero, but its first derivative there is $1$.`,
        ),
      ],
    },
    {
      title: 'L’Hôpital’s rule for vanishing quotients',
      sources: [
        source('4.8', 'L’Hôpital zero-over-zero form, hypotheses and repeated application.'),
      ],
      body: R`Some limits remain inconvenient after algebraic simplification. L’Hôpital’s rule handles certain quotients whose numerator and denominator both approach zero. Suppose $f,g$ are differentiable on a punctured neighborhood of the target, $g'(x)\ne0$ there, and $f(x)\to0,g(x)\to0$. If $f'(x)/g'(x)$ has a finite or infinite limit, then $f(x)/g(x)$ has that same limit. Appropriate one-sided versions also hold. These hypotheses are part of the rule; the label $0/0$ alone is not a proof that every required condition holds.

For $\lim_{x\to0}(e^{3x}-1)/x$, the original numerator and denominator both vanish. The differentiated quotient is $3e^{3x}/1\to3$, so the original limit is $3$. Notice that we differentiated numerator and denominator separately. We did not differentiate the original quotient with the quotient rule; that would calculate its derivative, a different object.

For $\lim_{x\to0}(1-\cos x)/x^2$, one application gives $\sin x/(2x)$, which is again a vanishing quotient. After rechecking the hypotheses, another application gives $\cos x/2\to1/2$. Repetition is allowed because the new expression meets the conditions, not because we may differentiate until an attractive answer appears.

A quotient with a nonzero denominator limit should normally use direct substitution. At $x\to0$, $(1+x)/(2+x)$ tends to $1/2$. Differentiating numerator and denominator would incorrectly produce $1$. The initial form is not indeterminate and does not authorize L’Hôpital’s rule.

A derivative quotient that lacks a limit also leaves the original problem unresolved by this sufficient condition. It does not prove that the original quotient has no limit. Finally, do not use this rule circularly to establish the basic trigonometric derivative formulas from the same small-angle limits those derivatives relied on. Here those limits and derivative rules have already been developed independently, so applications using sine and cosine are legitimate.`,
      terms: [
        term(
          'lhopital-rule',
          'L’Hôpital’s rule',
          'Certain indeterminate quotient limits can be evaluated through derivative quotients.',
          R`Under the rule's differentiability and nonzero-denominator-derivative hypotheses, $0/0$ or infinite-over-infinite limits can pass to $f'/g'$ if that limit exists finitely or infinitely.`,
          R`$\lim_{x\to0}(e^{3x}-1)/x=3$.`,
          'This is not the quotient rule and does not apply to arbitrary quotients.',
        ),
      ],
      questions: [
        exact(
          R`Evaluate $\lim_{x\to0}(e^{2x}-1)/x$ using L’Hôpital’s rule.`,
          2,
          R`The form is $0/0$; the derivative quotient is $2e^{2x}\to2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}\sin(5x)/x$ using radians.`,
          5,
          R`The form is $0/0$; differentiating gives $5\cos(5x)\to5$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}\ln(1+3x)/x$.`,
          3,
          R`The logarithm is defined nearby; the derivative quotient is $3/(1+3x)\to3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(1-\cos(2x))/x^2$.`,
          2,
          R`After one differentiation the quotient is $\sin(2x)/x$, still $0/0$; a second gives $2\cos(2x)\to2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(e^x-1-x)/x^2$.`,
          '1/2',
          R`The first derivative quotient is $(e^x-1)/(2x)$; the second is $e^x/2\to1/2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(\tan x-x)/x^3$.`,
          '1/3',
          R`One derivative gives $\tan^2x/(3x^2)$. Since $\tan x/x\to1$, the limit is $1/3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(2+x)/(4+x)$ by the appropriate method.`,
          '1/2',
          R`The denominator tends to $4\ne0$, so substitution gives $2/4=1/2$; L’Hôpital is not applicable.`,
        ),
        bool(
          R`Does the rule instruct you to differentiate the entire quotient with the quotient rule?`,
          false,
          R`It compares the original limit with the quotient of separate derivatives, $f'/g'$.`,
        ),
        open(
          R`Justify every application of L’Hôpital when evaluating $(1-\cos x)/x^2$ at zero.`,
          R`Initially both numerator and denominator vanish, their derivatives exist near zero, and $2x\ne0$ away from zero. The derivative quotient $\sin x/(2x)$ is again $0/0$ with nonzero denominator derivative $2$. Its derivative quotient is $\cos x/2\to1/2$, establishing both successive limits.`,
        ),
        open(
          R`Give a numerical counterexample to applying L’Hôpital to an arbitrary quotient with a finite nonzero denominator limit.`,
          R`As $x\to0$, $(1+x)/(3+x)\to1/3$ by substitution. The quotient of derivatives is $1$, showing the indiscriminate procedure fails.`,
          'construct',
        ),
      ],
      review: [
        exact(
          R`Evaluate $\lim_{x\to0}(e^{4x}-1)/(2x)$.`,
          2,
          R`The derivative quotient is $4e^{4x}/2\to2$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}\ln(1+x)/(5x)$.`,
          '1/5',
          R`The derivative quotient is $1/[5(1+x)]\to1/5$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0}(1-\cos(3x))/x^2$.`,
          '9/2',
          R`Two valid differentiations give $9\cos(3x)/2\to9/2$.`,
        ),
      ],
      quickCheck: qc(
        R`Which limit has the required indeterminate form for a possible direct L’Hôpital application?`,
        [R`$\lim_{x\to0}(x+1)/(x+2)$`, R`$\lim_{x\to0}(e^x-1)/x$`, R`$\lim_{x\to0}1/x$`],
        1,
        'Only the middle quotient has numerator and denominator both approaching zero. The other conditions still need checking.',
      ),
    },
    {
      title: 'Infinite quotients and transformed indeterminate forms',
      sources: [
        source('4.8', 'Infinite-over-infinite limits, products, differences and variable powers.'),
      ],
      body: R`L’Hôpital’s rule also applies to an infinite-over-infinite form under corresponding differentiability hypotheses: numerator and denominator each grow in magnitude without bound, the denominator derivative is nonzero eventually, and the derivative quotient has a finite or infinite limit. The target input may itself approach positive or negative infinity. Infinity is still not a real number being divided; the notation describes a growth comparison.

For $\lim_{x\to\infty}\ln x/x$, both numerator and denominator diverge. The derivative quotient is $(1/x)/1\to0$, so the original ratio tends to zero. A logarithm grows without bound but more slowly than this linear function. For $x^2/e^x$, repeated applications give $2x/e^x$ and then $2/e^x\to0$. Each stage remains an infinite-over-infinite form until the last simple limit settles the comparison.

Products must be rewritten before applying the quotient rule for limits. As $x\to0^+$, the expression $x\ln x$ has a shrinking positive factor and an unbounded negative factor. Write it as $\ln x/(1/x)$. Differentiation gives $(1/x)/(-1/x^2)=-x\to0$, so the product tends to zero. The sign of the original expression is negative, but a negative quantity may approach the finite limit zero.

For a variable power, taking a logarithm converts the exponent into a product. Let $y=x^x$ for $x>0$. Since $\ln y=x\ln x\to0$ as $x\to0^+$, continuity of the exponential gives $y\to e^0=1$. The superficial form $0^0$ does not determine the limit by itself; the calculation uses this specific relationship between base and exponent.

Differences of unbounded terms may be handled by a common denominator or conjugate. For $\sqrt{x^2+x}-x$ as $x\to\infty$, rationalization gives $x/(\sqrt{x^2+x}+x)=1/(\sqrt{1+1/x}+1)\to1/2$. L’Hôpital is not needed once algebra makes the behavior clear. Select the simplest justified method rather than treating every new limit as an instruction to differentiate.`,
      terms: [
        term(
          'growth-comparison',
          'Growth comparison by limits',
          'A quotient measures relative long-run growth.',
          R`If $f/g\to0$, then $f$ is small relative to $g$ in the stated limit, even when both grow.`,
          R`$\ln x/x\to0$ as $x\to\infty$.`,
          'Unbounded functions can grow at very different rates.',
        ),
        term(
          'indeterminate-power',
          'Indeterminate power',
          'A base/exponent limiting pattern requiring further analysis.',
          R`For positive bases, taking logarithms changes a variable power into a product whose limit can be studied.`,
          R`$x^x\to1$ as $x\to0^+$ because $x\ln x\to0$.`,
          'Symbols such as $0^0$ do not assign a universal limit.',
        ),
      ],
      questions: [
        exact(
          R`Evaluate $\lim_{x\to\infty}\ln x/x$.`,
          0,
          R`The infinite-over-infinite form passes to derivative quotient $1/x\to0$.`,
        ),
        exact(R`Evaluate $\lim_{x\to\infty}x/e^x$.`, 0, R`L’Hôpital gives $1/e^x\to0$.`),
        exact(R`Evaluate $\lim_{x\to\infty}x^2/e^x$.`, 0, R`Two applications give $2/e^x\to0$.`),
        exact(
          R`Evaluate $\lim_{x\to0^+}x\ln x$.`,
          0,
          R`Rewrite as $\ln x/(1/x)$; the derivative quotient is $-x\to0$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0^+}x^x$.`,
          1,
          R`The logarithm is $x\ln x\to0$, so the original positive quantity tends to $e^0=1$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to\infty}(\sqrt{x^2+2x}-x)$.`,
          1,
          R`Rationalizing gives $2/(\sqrt{1+2/x}+1)\to1$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to\infty}\ln(x^2)/\ln x$.`,
          2,
          R`For positive $x$, the numerator equals $2\ln x$, so the quotient is $2$ eventually.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to0^+}x^{2x}$.`,
          1,
          R`Its logarithm is $2x\ln x\to0$, hence the power tends to $1$.`,
        ),
        open(
          R`Evaluate $\lim_{x\to\infty}(1+1/x)^x$ by taking logarithms and justify the transformation back.`,
          R`Let $y=(1+1/x)^x>0$. Then $\ln y=\ln(1+1/x)/(1/x)$, a $0/0$ form. Differentiating numerator and denominator gives $1/(1+1/x)\to1$. Continuity of the exponential gives $y\to e$.`,
        ),
        open(
          R`Explain why the phrase “exponential beats polynomial” is not a substitute for checking the signs and target direction of a limit.`,
          R`For positive $x\to\infty$, $e^x$ dominates fixed powers. But $e^x\to0$ as $x\to-\infty$, so the same quotient may behave completely differently. The precise functions and direction of approach determine which comparison applies.`,
        ),
      ],
      review: [
        exact(R`Evaluate $\lim_{x\to\infty}x/e^{2x}$.`, 0, R`L’Hôpital gives $1/(2e^{2x})\to0$.`),
        exact(
          R`Evaluate $\lim_{x\to0^+}3x\ln x$.`,
          0,
          R`The known limit $x\ln x\to0$ remains zero after multiplication by $3$.`,
        ),
        exact(
          R`Evaluate $\lim_{x\to\infty}(\sqrt{x^2+6x}-x)$.`,
          3,
          R`Rationalization gives $6/(\sqrt{1+6/x}+1)\to3$.`,
        ),
      ],
    },
  ],
};
