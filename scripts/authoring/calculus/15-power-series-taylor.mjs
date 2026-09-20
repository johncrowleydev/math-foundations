import { r, source, term, n, e, t, o, qc } from './integration-helpers.mjs';
const power = source(
  2,
  6,
  1,
  'Power Series and Functions',
  'Centers, radii, intervals, and endpoint convergence.',
);
const operations = source(
  2,
  6,
  2,
  'Properties of Power Series',
  'Substitution and termwise differentiation/integration inside the convergence radius.',
);
const taylor = source(
  2,
  6,
  3,
  'Taylor and Maclaurin Series',
  'Derivative-matching coefficients, Taylor remainder, and equality to a Taylor series.',
);
const working = source(
  2,
  6,
  4,
  'Working with Taylor Series',
  'Standard expansions, binomial coefficients, and approximation of nonelementary integrals.',
);
export default {
  number: 15,
  slug: 'calculus-power-series-taylor',
  title: 'Power Series and Taylor Approximation',
  intro: r`A local linear model matches a function's value and slope. Taylor polynomials extend that idea by matching more derivatives, while power series ask whether infinitely many polynomial terms represent the function exactly. This lesson separates a finite approximation from an infinite identity, identifies the interval where a series works, and attaches meaningful error bounds to numerical uses. These approximations will reappear in multivariable linearization and optimization.`,
  sections: [
    {
      title: 'Power series and convergence intervals',
      sources: [power],
      terms: [
        term(
          'power-series',
          'Power series',
          'A series of powers around a chosen center.',
          r`A power series centered at $a$ has form $\sum_{n=0}^{\infty}c_n(x-a)^n$.`,
          r`$\sum(x-2)^n/3^n$ is centered at $2$.`,
          'The center is determined by the power factor, not by the coefficient index.',
        ),
        term(
          'convergence-radius',
          'Radius of convergence',
          'Distance from the center within which absolute convergence holds.',
          r`A radius $R$ gives convergence for $|x-a|<R$ and divergence for $|x-a|>R$; endpoints need separate tests.`,
          r`$\sum x^n/n$ has radius $1$, with different behavior at the two endpoints.`,
          'The radius alone does not determine whether boundary points are included.',
        ),
      ],
      body: r`A power series has the form $\sum_{n=0}^{\infty}c_n(x-a)^n$. The constants $c_n$ are coefficients and $a$ is the center. For each fixed $x$, this becomes an ordinary numerical series whose convergence must be determined. At the center, all positive-power terms vanish and the value is $c_0$, so every power series converges there.

A power series has a radius of convergence $R$, possibly zero or infinite. It converges absolutely when $|x-a|<R$ and diverges when $|x-a|>R$. If $0<R<\infty$, the two endpoints $a-R$ and $a+R$ are not settled by this rule. Substituting them produces numerical series that need individual tests. The full interval of convergence includes whichever endpoints actually converge.

For $\sum_{n=0}^{\infty}(x-2)^n/3^n$, the ratio magnitude is $|x-2|/3$. It is below one precisely when $-1<x<5$, so $R=3$. At $x=-1$ the terms are $(-1)^n$; at $x=5$ they are $1$. Neither endpoint has terms tending to zero. The interval is therefore $(-1,5)$, and inside it the geometric sum equals $1/[1-(x-2)/3]$.

Now consider $\sum_{n=1}^{\infty}x^n/n$. The ratio limit is $|x|$, so the radius is $1$. At $x=1$ the harmonic series diverges. At $x=-1$ the alternating harmonic series converges. The interval is $[-1,1)$, showing why the interior calculation is not the finished answer. At the included endpoint convergence is conditional, whereas the interior convergence is absolute.

A radius of zero can occur: for $\sum n!x^n$, the ratio grows without bound for every nonzero $x$, leaving only the center. Conversely, $\sum x^n/n!$ has ratio $|x|/(n+1)\to0$ for every fixed real $x$, so its radius is infinite. Treat these as mathematical outcomes rather than exceptional parser cases. The same ratio/root tools from numerical series now determine where the variable may safely range.`,
      questions: [
        n(
          r`Find the center of $\sum_{n=0}^{\infty}(x-4)^n/2^n$.`,
          '4',
          r`The powers are of $x-4$, so the center is $4$.`,
        ),
        n(
          r`Find the radius of $\sum_{n=0}^{\infty}(x-4)^n/2^n$.`,
          '2',
          r`The ratio magnitude is $|x-4|/2$, below one exactly within distance $2$.`,
        ),
        n(
          r`Find the radius of $\sum_{n=1}^{\infty}x^n/n$.`,
          '1',
          r`Its ratio limit is $|x|$, giving radius $1$.`,
        ),
        t(
          r`At $x=1$, does $\sum_{n=1}^{\infty}x^n/n$ converge or diverge? Enter converges or diverges.`,
          'diverges',
          r`It becomes the harmonic series.`,
        ),
        t(
          r`At $x=-1$, does $\sum_{n=1}^{\infty}x^n/n$ converge or diverge? Enter converges or diverges.`,
          'converges',
          r`It becomes an alternating harmonic series with decreasing magnitudes tending to zero.`,
        ),
        n(
          r`Find the radius of $\sum_{n=0}^{\infty}n!x^n$.`,
          '0',
          r`For any nonzero $x$, the ratio is $(n+1)|x|\to\infty$. Only the center converges.`,
        ),
        t(
          r`Is the radius of $\sum_{n=0}^{\infty}x^n/n!$ finite or infinite?`,
          'infinite',
          r`For every fixed $x$, the ratio $|x|/(n+1)$ tends to zero.`,
        ),
        n(
          r`Find the radius of $\sum_{n=1}^{\infty}(x+1)^n/(n\,2^n)$.`,
          '2',
          r`The ratio limit is $|x+1|/2$, so the radius around $-1$ is $2$.`,
        ),
        o(
          r`Determine the full convergence interval of $\sum_{n=1}^{\infty}(x+1)^n/(n\,2^n)$.`,
          r`The interior is $-3<x<1$. At $x=-3$ the series is $\sum(-1)^n/n$, which converges; at $x=1$ it is harmonic and diverges. Therefore the interval is $[-3,1)$.`,
        ),
        o(
          r`Why do ratio-test calculations usually leave the endpoints of a finite-radius power series unresolved?`,
          r`At the boundary the ratio limit becomes $1$, precisely the test's inconclusive value. Substituting each endpoint may reveal alternating, harmonic, or other behavior that the radius calculation cannot distinguish.`,
        ),
      ],
      review: [
        n(
          r`Find the radius of $\sum_{n=0}^{\infty}(x+2)^n/5^n$.`,
          '5',
          r`The geometric ratio is $(x+2)/5$, so the radius is $5$.`,
        ),
        n(
          r`Find the center of $\sum_{n=1}^{\infty}(x+2)^n/(n^2 5^n)$.`,
          '-2',
          r`The power factor is $x-(-2)$, so the center is $-2$.`,
        ),
        o(
          r`Find the endpoint behavior of $\sum_{n=1}^{\infty}x^n/n^2$ at $x=\pm1$.`,
          r`At $1$ it is the convergent $p=2$ series. At $-1$ its absolute series is the same convergent series. Both endpoints are included, and both converge absolutely.`,
        ),
      ],
      quickCheck: qc(
        r`A power series centered at $2$ has radius $3$. What is guaranteed without testing endpoints?`,
        [
          r`Convergence for $-1<x<5$`,
          r`Convergence at both $-1$ and $5$`,
          r`Divergence at both endpoints`,
        ],
        0,
        r`The radius settles the open interior and exterior; endpoint behavior requires separate tests.`,
      ),
    },
    {
      title: 'Taylor polynomials from matching derivatives',
      sources: [taylor],
      terms: [
        term(
          'taylor-polynomial',
          'Taylor polynomial',
          'A polynomial matching derivatives at a center.',
          r`$P_N(x)=\sum_{k=0}^N f^{(k)}(a)(x-a)^k/k!$.`,
          r`For $e^x$ at $0$, $P_2=1+x+x^2/2$.`,
          'The coefficient of $(x-a)^k$ is the derivative divided by $k!$.',
        ),
        term(
          'maclaurin-polynomial',
          'Maclaurin polynomial',
          'A Taylor polynomial centered at zero.',
          r`$P_N(x)=\sum_{k=0}^Nf^{(k)}(0)x^k/k!$.`,
          r`For $\sin x$, $P_3=x-x^3/6$.`,
          'Maclaurin names a center choice, not a separate approximation principle.',
        ),
      ],
      body: r`A first-degree approximation matches $f(a)$ and $f'(a)$. To match the second derivative as well, write $P_2(x)=c_0+c_1(x-a)+c_2(x-a)^2$. Evaluating at $a$ gives $c_0=f(a)$. Differentiating once gives $c_1=f'(a)$; differentiating twice gives $2c_2=f''(a)$. Thus $P_2=f(a)+f'(a)(x-a)+f''(a)(x-a)^2/2$.

Continuing this argument yields $P_N(x)=\sum_{k=0}^N f^{(k)}(a)(x-a)^k/k!$. Here $f^{(k)}$ denotes the $k$th derivative, $f^{(0)}=f$, and $k!=1\cdot2\cdots k$ with $0!=1$. The factorial compensates the repeated differentiation of a power. The Taylor polynomial has degree at most $N$; some highest coefficients can vanish, as they do for sine and cosine.

For $f(x)=e^x$ at zero, every derivative equals $1$, so $P_3(x)=1+x+x^2/2+x^3/6$. For $\sin x$, the derivative values cycle through $0,1,0,-1$, giving $P_3=x-x^3/6$. A Taylor polynomial centered at zero is called a Maclaurin polynomial. It is a finite algebraic object, so evaluating it never requires an infinite sum.

A nonzero center changes the powers and derivative values. For $f(x)=\ln x$ at $a=1$, $f(1)=0$, $f'(1)=1$, and $f''(1)=-1$. Thus $P_2(x)=(x-1)-(x-1)^2/2$. At $x=1.1$, it predicts $0.1-0.005=0.095$. This is an approximation until an error argument accompanies it; replacing the approximate sign by equality would assert more than derivative matching provides.

The polynomial is uniquely determined by those derivative conditions because its coefficients are forced one by one. Matching derivatives gives increasingly detailed local agreement, but does not promise good accuracy arbitrarily far from the center. Higher degree may help within a useful neighborhood; the size of the neighborhood and the remaining error depend on the function and its higher derivatives.`,
      questions: [
        e(
          r`Find the degree-two Maclaurin polynomial for $e^x$.`,
          '1+x+x^2/2',
          r`The value and first two derivatives at zero are all $1$, so $P_2=1+x+x^2/2$.`,
        ),
        e(
          r`Find the degree-three Maclaurin polynomial for $\sin x$.`,
          'x-x^3/6',
          r`The derivative values $0,1,0,-1$ give $x-x^3/3!$.`,
        ),
        e(
          r`Find the degree-four Maclaurin polynomial for $\cos x$.`,
          '1-x^2/2+x^4/24',
          r`The nonzero derivative values through order four are $1,-1,1$, giving $1-x^2/2!+x^4/4!$.`,
        ),
        e(
          r`Find the degree-two Taylor polynomial for $\ln x$ centered at $1$.`,
          '(x-1)-(x-1)^2/2',
          r`At $1$, the value is $0$, slope is $1$, and second derivative is $-1$.`,
        ),
        e(
          r`Find the degree-two Taylor polynomial for $x^3$ centered at $1$.`,
          '1+3*(x-1)+3*(x-1)^2',
          r`The needed derivative values are $1,3,6$; divide the quadratic coefficient by $2!$.`,
        ),
        n(
          r`If $f''(a)=12$, what is the coefficient of $(x-a)^2$ in its Taylor polynomial?`,
          '6',
          r`The coefficient is $f''(a)/2!=12/2=6$.`,
        ),
        n(
          r`If $f^{(3)}(a)=-18$, what is the cubic Taylor coefficient?`,
          '-3',
          r`Divide by $3!=6$: $-18/6=-3$.`,
        ),
        n(
          r`Use $P_2(x)=1+x+x^2/2$ to approximate $e^{0.2}$. Give the polynomial value exactly.`,
          '61/50',
          r`$1+1/5+(1/5)^2/2=1+1/5+1/50=61/50$.`,
        ),
        o(
          r`Derive the factorial in the Taylor coefficient by differentiating a power term.`,
          r`Differentiating $c_k(x-a)^k$ exactly $k$ times gives $k!c_k$. At $a$, lower-degree terms have already vanished and higher-degree terms still contain powers of $x-a$, so matching the $k$th derivative forces $c_k=f^{(k)}(a)/k!$.`,
          'prove',
        ),
        o(
          r`Explain why the third-order Maclaurin polynomial for cosine has no cubic term.`,
          r`The third derivative is $\sin x$, whose value at zero is zero. Its cubic coefficient is therefore zero, leaving the degree-two polynomial $1-x^2/2$ even though derivatives are matched through order three.`,
        ),
      ],
      review: [
        e(
          r`Find the degree-two Maclaurin polynomial for $e^{2x}$.`,
          '1+2*x+2*x^2',
          r`Derivative values are $1,2,4$, giving coefficient $4/2=2$ for $x^2$.`,
        ),
        e(
          r`Find the degree-two Taylor polynomial for $\sqrt{x}$ at $a=1$.`,
          '1+(x-1)/2-(x-1)^2/8',
          r`The values are $1,1/2,-1/4$, so the quadratic coefficient is $-1/8$.`,
        ),
        n(
          r`Use the quadratic Taylor polynomial of $\ln x$ at $1$ to approximate $\ln(1.2)$. Give the polynomial value.`,
          '9/50',
          r`The increment is $1/5$, so $1/5-(1/5)^2/2=1/5-1/50=9/50$.`,
        ),
      ],
    },
    {
      title: 'Standard series and legal operations',
      sources: [operations, taylor, working],
      terms: [
        term(
          'taylor-series',
          'Taylor series',
          'The infinite series of derivative-matching coefficients.',
          r`The Taylor series at $a$ is $\sum_{n=0}^{\infty}f^{(n)}(a)(x-a)^n/n!$. Equality to $f$ requires its remainder to tend to zero.`,
          r`$e^x=\sum_{n=0}^{\infty}x^n/n!$ for all real $x$.`,
          'Having derivatives of every order does not by itself prove equality to the Taylor series.',
        ),
        term(
          'termwise-calculus',
          'Termwise calculus for power series',
          'Differentiate or integrate each term inside the radius.',
          r`Inside a positive convergence radius, differentiation and integration preserve the radius; endpoint behavior may change.`,
          r`Differentiating $\sum x^n$ gives $\sum_{n=1}^{\infty}nx^{n-1}=1/(1-x)^2$ for $|x|<1$.`,
          'Endpoint convergence must be checked again after differentiation or integration.',
        ),
      ],
      body: r`Several standard series form a reusable vocabulary. The geometric identity is $1/(1-x)=\sum_{n=0}^{\infty}x^n$ for $|x|<1$. The exponential has $e^x=\sum_{n=0}^{\infty}x^n/n!$ for every real $x$. Sine and cosine have $\sin x=\sum_{n=0}^{\infty}(-1)^nx^{2n+1}/(2n+1)!$ and $\cos x=\sum_{n=0}^{\infty}(-1)^nx^{2n}/(2n)!$, also for all real $x$.

Within the radius of convergence, a power series may be differentiated or integrated term by term. Differentiating the geometric series gives $1/(1-x)^2=\sum_{n=1}^{\infty}nx^{n-1}$ for $|x|<1$. Integrating $1/(1+x)=\sum_{n=0}^{\infty}(-1)^nx^n$ from zero to $x$ gives $\ln(1+x)=\sum_{n=1}^{\infty}(-1)^{n+1}x^n/n$ in the interior. At $x=1$ this converges conditionally; at $x=-1$ it diverges. Endpoint conclusions require their own argument.

Similarly, integrating $1/(1+x^2)=1-x^2+x^4-\cdots$ gives $\arctan x=x-x^3/3+x^5/5-\cdots$ for $|x|<1$. Its endpoints converge by the alternating test, and continuity of the represented function together with the standard boundary extension argument identifies the limiting endpoint values. The central calculations here use interior points, where termwise operations are guaranteed directly.

Substitution and multiplication by a power generate new expansions. Replacing $x$ by $-x^2$ in the exponential series gives $e^{-x^2}=1-x^2+x^4/2!-x^6/3!+\cdots$ for every real $x$. Replacing $x$ by $2x$ in the geometric series gives $1/(1-2x)=1+2x+4x^2+\cdots$, but now only for $|x|<1/2$. Transform the validity condition along with the expression.

The binomial expansion generalizes ordinary finite binomial algebra: $(1+x)^\alpha=1+\alpha x+\alpha(\alpha-1)x^2/2!+\cdots$ for $|x|<1$, with separate endpoint questions unless the series terminates. For $\alpha=1/2$, the first terms are $1+x/2-x^2/8+x^3/16$. These identities represent their functions on the stated domains; a Taylor series is not automatically equal to every infinitely differentiable function that generated its coefficients. The remainder criterion in the next section is what justifies that equality.`,
      questions: [
        n(
          r`What is the coefficient of $x^4$ in the Maclaurin series for $e^x$?`,
          '1/24',
          r`The coefficient is $1/4!=1/24$.`,
        ),
        n(
          r`What is the coefficient of $x^5$ in the Maclaurin series for $\sin x$?`,
          '1/120',
          r`The fifth-power sine term is $x^5/5!=x^5/120$.`,
        ),
        n(
          r`What is the coefficient of $x^4$ in the Maclaurin series for $e^{-x^2}$?`,
          '1/2',
          r`The quadratic term of $e^u$ is $u^2/2$, which becomes $x^4/2$ at $u=-x^2$.`,
        ),
        e(
          r`Give the terms through degree three in the Maclaurin expansion of $1/(1-2x)$.`,
          '1+2*x+4*x^2+8*x^3',
          r`Substitute $2x$ into the geometric expansion and keep powers through three.`,
        ),
        n(
          r`Find the radius of that expansion of $1/(1-2x)$.`,
          '1/2',
          r`The geometric condition $|2x|<1$ gives radius $1/2$.`,
        ),
        e(
          r`Give the terms through degree three of $\ln(1+x)$ at zero.`,
          'x-x^2/2+x^3/3',
          r`Integrating $1-x+x^2-\cdots$ termwise gives $x-x^2/2+x^3/3$.`,
        ),
        e(
          r`Give the terms through degree five of $\arctan x$ at zero.`,
          'x-x^3/3+x^5/5',
          r`Integrate $1-x^2+x^4$ from zero to $x$.`,
        ),
        n(
          r`What is the coefficient of $x^3$ in the binomial series for $\sqrt{1+x}$?`,
          '1/16',
          r`It is $(1/2)(-1/2)(-3/2)/3!=3/(8\cdot6)=1/16$.`,
        ),
        o(
          r`Explain why differentiating a convergent power series may change whether an endpoint converges.`,
          r`Termwise differentiation multiplies coefficients by their indices, affecting borderline decay. For example, $\sum x^n/n$ converges at $x=-1$, but its differentiated series becomes a geometric-type series whose terms there do not approach zero.`,
        ),
        o(
          r`Derive the first four terms of $e^{-x^2}$ from the exponential series and state its real validity range.`,
          r`Replace the exponential argument by $-x^2$: $1+(-x^2)+(-x^2)^2/2!+(-x^2)^3/3!=1-x^2+x^4/2-x^6/6$. The exponential series converges for every real argument, so the full substituted series is valid for every real $x$.`,
          'prove',
        ),
      ],
      review: [
        e(
          r`Give the terms through degree four for $\cos(2x)$.`,
          '1-2*x^2+2*x^4/3',
          r`Substitute $2x$ into $1-u^2/2+u^4/24$: $1-2x^2+(2/3)x^4$.`,
        ),
        n(
          r`Find the coefficient of $x^3$ in $1/(1+x)^2$ at zero.`,
          '-4',
          r`Differentiating $1/(1+x)=1-x+x^2-x^3+x^4-\cdots$ and changing sign gives coefficients $1,-2,3,-4,\ldots$.`,
        ),
        o(
          r`Why must the constant term be checked when integrating a power series to obtain a function?`,
          r`Termwise integration produces an antiderivative plus a constant. A known value, such as $\ln(1+0)=0$ or $\arctan0=0$, fixes that constant and ensures the represented function has the intended level.`,
        ),
      ],
    },
    {
      title: 'Remainders and trustworthy approximations',
      sources: [taylor, working],
      terms: [
        term(
          'taylor-remainder',
          'Taylor remainder',
          'The difference between a function and its Taylor polynomial.',
          r`If $|f^{(N+1)}(t)|\le M$ between $a$ and $x$, then $|f(x)-P_N(x)|\le M|x-a|^{N+1}/(N+1)!$.`,
          r`For $e^x$ near zero, bound the next derivative by an upper bound for $e^t$ on the interval.`,
          'The derivative bound must hold throughout the interval between center and target, not just at the center.',
        ),
      ],
      body: r`Define the remainder by $R_N(x)=f(x)-P_N(x)$. Taylor's theorem states, when $f$ has continuous derivatives through order $N+1$ on the interval between $a$ and $x$, that $R_N(x)=f^{(N+1)}(\xi)(x-a)^{N+1}/(N+1)!$ for some intermediate point $\xi$. Usually we do not know $\xi$, but a bound $|f^{(N+1)}|\le M$ throughout that interval gives $|R_N(x)|\le M|x-a|^{N+1}/(N+1)!$.

For $e^{0.1}$ using $P_2=1+x+x^2/2$, the estimate is $1.105$. Since $e^t<2$ for $0\le t\le0.1$, take $M=2$. The error is at most $2(0.1)^3/3!=1/3000$. The bound is deliberately conservative but justified independently of the approximation. Using only $f^{(3)}(0)=1$ as a maximum would ignore the increase in $e^t$ along the interval.

Alternating series sometimes provide a sharper bound. For $\sin x\approx x-x^3/6$ at $x=1/2$, successive sine magnitudes decrease, so the error is at most the first omitted term $(1/2)^5/5!=1/3840$. The next term is positive, so the approximation is a lower bound. The sign information comes from the alternating remainder theorem, not merely from the absolute Taylor estimate.

Degree and number of nonzero terms are different. The polynomial $x-x^3/6$ contains two nonzero terms but has degree three. A cosine approximation $1-x^2/2$ matches derivatives through order three because the cubic coefficient vanishes; one may use the fourth-derivative remainder bound $|x|^4/24$. Choosing the correct order prevents an unnecessarily weak estimate.

To show that a full Taylor series equals $f$, prove $R_N(x)\to0$ for the target points. For the exponential, on any fixed bounded interval the derivative bound is a fixed constant and $|x|^{N+1}/(N+1)!\to0$, so the remainder vanishes. Matching infinitely many derivatives without a remainder argument is not enough in general. Smooth functions can be flat at a point yet nonzero nearby; infinite differentiability and representation by the Taylor series are distinct properties.`,
      questions: [
        n(
          r`Use $P_2(x)=1+x+x^2/2$ to approximate $e^{0.1}$. Give the polynomial value.`,
          '221/200',
          r`$1+1/10+1/200=221/200=1.105$.`,
        ),
        n(
          r`For $e^{0.1}$ approximated by $P_2(x)=1+x+x^2/2$ at $x=0.1$, use $M=2$ for the third derivative to give the Taylor error bound.`,
          '1/3000',
          r`$2(1/10)^3/3!=2/(1000\cdot6)=1/3000$.`,
        ),
        n(
          r`Using $\sin x\approx x-x^3/6$ at $x=1/2$, give the first-omitted-term error bound.`,
          '1/3840',
          r`The next magnitude is $(1/2)^5/5!=1/(32\cdot120)=1/3840$.`,
        ),
        n(
          r`Evaluate the sine polynomial $x-x^3/6$ at $x=1/2$.`,
          '23/48',
          r`$1/2-(1/8)/6=1/2-1/48=23/48$.`,
        ),
        n(
          r`For $\cos x\approx1-x^2/2$ at $x=1/5$, give the Taylor remainder bound using the fourth-derivative bound $M=1$.`,
          '1/15000',
          r`The cubic coefficient is zero, so use order three: $(1/5)^4/4!=1/(625\cdot24)=1/15000$.`,
        ),
        n(
          r`If $M=6$, $|x-a|=1/10$, and $N=2$, find the Taylor remainder bound.`,
          '1/1000',
          r`$6(1/10)^3/3!=1/1000$.`,
        ),
        n(
          r`How many nonzero terms are in the polynomial $x-x^3/6+x^5/120$?`,
          '3',
          r`There are three monomials with nonzero coefficients, despite the polynomial having degree five.`,
        ),
        t(
          r`At $x=1/2$, is $x-x^3/6$ an upper or lower bound for $\sin x$? Enter upper or lower.`,
          'lower',
          r`The first omitted sine-series term is positive, and the alternating remainder has that sign.`,
        ),
        o(
          r`Why must the derivative bound in Taylor's theorem cover the whole interval between the center and target?`,
          r`The remainder uses an unknown intermediate point $\xi$. A derivative value at the center does not bound its value at that point; a uniform interval bound does.`,
        ),
        o(
          r`Explain the additional condition needed to conclude that a function equals its infinite Taylor series.`,
          r`The remainder $f(x)-P_N(x)$ must tend to zero as $N$ increases. Derivative matching determines the coefficients, but only a vanishing remainder establishes equality with the limiting series.`,
        ),
      ],
      review: [
        n(
          r`Approximate $e^{-0.1}$ using $1+x+x^2/2$ and give the polynomial value.`,
          '181/200',
          r`$1-1/10+1/200=181/200$.`,
        ),
        n(
          r`For $e^{-0.1}$ approximated by $1+x+x^2/2$ at $x=-0.1$, give the alternating exponential series first-omitted-term error bound.`,
          '1/6000',
          r`At $x=-0.1$, magnitudes decrease and the first omitted term is $(0.1)^3/3!=1/6000$.`,
        ),
        o(
          r`For $\ln(1+x)$ at a positive $x<1$, explain how the sign of the first omitted term tells whether a partial sum is high or low.`,
          r`The magnitudes $x^n/n$ decrease, so the alternating remainder has the sign of the first omitted term. A positive next term means the approximation is below the function; a negative next term means it is above.`,
        ),
      ],
      quickCheck: qc(
        r`A Taylor remainder estimate uses a derivative at an unknown intermediate point. What makes the estimate usable?`,
        [
          'The derivative value at the center alone',
          'A bound on that derivative throughout the interval',
          'The number of decimal places in the approximation',
        ],
        1,
        r`A uniform bound controls the unknown intermediate derivative value.`,
      ),
    },
    {
      title: 'Using series for limits and integrals',
      sources: [operations, working, taylor],
      terms: [
        term(
          'series-leading-term',
          'Leading-term analysis',
          'Use the first noncancelled power while controlling the remainder.',
          r`If $f(x)=ax^k+o(x^k)$ with $a\ne0$, the ratio $f(x)/x^k$ tends to $a$.`,
          r`$\sin x-x=-x^3/6+o(x^3)$ gives a limit of $-1/6$ after division by $x^3$.`,
          'Cancelling low-order terms requires retaining enough higher-order terms to determine the result.',
        ),
      ],
      body: r`Taylor expansions can reveal a limit obscured by cancellation. Since $\sin x=x-x^3/6+R_3(x)$ with $R_3(x)=O(x^5)$ near zero, $(\sin x-x)/x^3=-1/6+O(x^2)\to-1/6$. Here $O(x^5)$ means that the remainder's magnitude is bounded by a constant times $|x|^5$ near zero. It records why the discarded part vanishes after division, rather than treating an approximation as an exact identity.

Similarly, $e^x=1+x+x^2/2+O(x^3)$ yields $(e^x-1-x)/x^2\to1/2$. To analyze $(\cos x-1+x^2/2)/x^4$, the quadratic approximation is insufficient because all its terms cancel. Retain $x^4/24$ and a smaller remainder to obtain the limit $1/24$. Choose expansion depth based on the cancellation in the question.

Termwise integration can approximate a definite integral whose elementary antiderivative is unavailable. From $e^{-x^2}=1-x^2+x^4/2-x^6/6+\cdots$, integrate from $0$ to $b$ inside a finite interval to get $\int_0^b e^{-x^2}dx=b-b^3/3+b^5/10-b^7/42+\cdots$. For $b=1/2$, the first three terms give $1/2-1/24+1/320=443/960$.

At $b=1/2$, the integrated series alternates with decreasing magnitudes. Its first omitted magnitude is $(1/2)^7/42=1/5376$, so the three-term approximation has error at most that amount and is an upper bound because the next term is negative. This is a controlled calculation of a non-elementary integral, using polynomial arithmetic plus a rigorous error estimate.

An approximation should be chosen around a useful center. For $\sqrt{1.04}$, the quadratic binomial approximation $1+0.04/2-(0.04)^2/8$ is convenient because the increment is small. Using the same low-degree polynomial at $x=100$ would have no comparable justification. In computation, low-degree local models can reduce expensive function evaluations, but domain and error checks remain part of the method. These ideas now prepare us to approximate functions of several variables, where tangent planes replace tangent lines and quadratic forms capture curvature.`,
      questions: [
        n(
          r`Evaluate $\lim_{x\to0}(\sin x-x)/x^3$.`,
          '-1/6',
          r`The expansion $\sin x=x-x^3/6+O(x^5)$ leaves $-1/6+O(x^2)$ after division.`,
        ),
        n(
          r`Evaluate $\lim_{x\to0}(e^x-1-x)/x^2$.`,
          '1/2',
          r`The first noncancelled term is $x^2/2$, and the divided remainder tends to zero.`,
        ),
        n(r`Evaluate $\lim_{x\to0}(1-\cos x)/x^2$.`, '1/2', r`$1-\cos x=x^2/2+O(x^4)$.`),
        n(
          r`Evaluate $\lim_{x\to0}(\cos x-1+x^2/2)/x^4$.`,
          '1/24',
          r`The fourth-order term is $x^4/24$ and the remainder is of higher order.`,
        ),
        n(
          r`Evaluate $\lim_{x\to0}[\ln(1+x)-x]/x^2$.`,
          '-1/2',
          r`$\ln(1+x)=x-x^2/2+O(x^3)$, so the ratio tends to $-1/2$.`,
        ),
        e(
          r`Integrate the polynomial $1-x^2+x^4/2$ from $0$ to $b$ and give the resulting polynomial in $b$.`,
          'b-b^3/3+b^5/10',
          r`Integrating each term gives $b-b^3/3+b^5/10$.`,
          ['b'],
        ),
        n(
          r`Use $1-x^2+x^4/2$ to approximate $\int_0^{1/2}e^{-x^2}dx$. Give the polynomial-integral value.`,
          '443/960',
          r`$1/2-1/24+1/320=(480-40+3)/960=443/960$.`,
        ),
        n(
          r`Approximate $\int_0^{1/2}e^{-x^2}dx$ by integrating $1-x^2+x^4/2$. Give the first-omitted-term bound for this integral approximation.`,
          '1/5376',
          r`The next integrated magnitude is $b^7/42$; at $b=1/2$ this is $1/(128\cdot42)=1/5376$.`,
        ),
        o(
          r`Why is the quadratic cosine approximation insufficient to determine $(\cos x-1+x^2/2)/x^4$?`,
          r`Its terms cancel completely in the numerator. The remaining behavior begins at degree four, so one must retain that coefficient and control the higher-order remainder before dividing by $x^4$.`,
        ),
        o(
          r`Explain why the three-term approximation $443/960$ to $\int_0^{1/2}e^{-x^2}dx$ is an upper bound.`,
          r`The integrated series alternates with decreasing magnitudes at $b=1/2$. The first omitted term is negative, so the actual sum lies below the retained three-term partial sum.`,
        ),
      ],
      review: [
        n(
          r`Evaluate $\lim_{x\to0}(\sin(2x)-2x)/x^3$.`,
          '-4/3',
          r`The cubic sine term is $-(2x)^3/6=-(4/3)x^3$, with a higher-order remainder.`,
        ),
        n(
          r`Approximate $\sqrt{1.04}$ with $1+u/2-u^2/8$ at $u=0.04$. Give the polynomial value.`,
          '5099/5000',
          r`$u=1/25$, so $1+1/50-1/5000=5099/5000$.`,
        ),
        o(
          r`How does a remainder estimate make cancellation-based limit calculations rigorous?`,
          r`It bounds the omitted terms at an order that vanishes after the same division applied to the retained terms. Thus the neglected contribution is proved to approach zero rather than merely assumed small.`,
        ),
      ],
    },
  ],
};
