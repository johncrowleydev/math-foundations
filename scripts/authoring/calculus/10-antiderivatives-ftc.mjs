import { r, source, term, n, e, a, o, qc } from './integration-helpers.mjs';
const anti = source(
  1,
  4,
  10,
  'Antiderivatives',
  'Antiderivative families on intervals, basic formulas, and initial conditions.',
);
const ftc = source(
  1,
  5,
  3,
  'The Fundamental Theorem of Calculus',
  'Differentiation of accumulation functions and evaluation using antiderivatives.',
);
const sub = source(
  1,
  5,
  5,
  'Substitution',
  'Reverse chain rule and change of bounds for definite integrals.',
);
export default {
  number: 10,
  slug: 'calculus-antiderivatives-ftc',
  title: 'Antiderivatives, Fundamental Theorem, and Substitution',
  intro: r`The integral was defined by adding small contributions. This lesson connects that definition to differentiation, giving an efficient way to compute many accumulations. We first reverse familiar derivative rules, then explain why this reverse operation evaluates definite integrals. Finally, substitution reverses the chain rule. At each stage distinguish three possible requests: one antiderivative, its full family, or a definite integral value.`,
  sections: [
    {
      title: 'Antiderivatives and the missing constant',
      sources: [anti],
      terms: [
        term(
          'antiderivative',
          'Antiderivative',
          'A function whose derivative is the given function.',
          r`$F$ is an antiderivative of $f$ on an interval if $F'(x)=f(x)$ at every interior point.`,
          r`$x^3$ is an antiderivative of $3x^2$.`,
          'An antiderivative is a function, while a fixed-bound integral is a number.',
        ),
        term(
          'integration-constant',
          'Constant of integration',
          'The arbitrary additive constant in a family.',
          r`On a connected interval all antiderivatives of $f$ have the form $F(x)+C$.`,
          r`$\int 2x\,dx=x^2+C$.`,
          'The constant is added; an arbitrary multiplier generally changes the derivative.',
        ),
      ],
      body: r`If $F'(x)=f(x)$ throughout an interval, $F$ is an antiderivative of $f$. For $f(x)=6x^2$, one choice is $F(x)=2x^3$. Adding any constant leaves the derivative unchanged, so $2x^3+7$ and $2x^3-100$ work too. The notation $\int f(x)\,dx=F(x)+C$ describes this entire family and is called an indefinite integral.

Why are there no other possibilities on an interval? If $F'=G'$, then $(F-G)'=0$. The mean value theorem implies that $F-G$ is constant between any two points in that interval. Connectedness matters: on $x\ne0$, different constants may be chosen independently on the negative and positive intervals. We state a connected interval when asking for an antiderivative so that a single $C$ describes the family correctly.

Reverse the power rule carefully. For $p\ne-1$, $\int x^p\,dx=x^{p+1}/(p+1)+C$ wherever the real power is defined and differentiable. The coefficient is a division by the new exponent because differentiating multiplies by that exponent. For example, $\int(4x^3-6x+2)\,dx=x^4-3x^2+2x+C$. Differentiating the proposed answer term by term checks every coefficient.

The exceptional exponent gives $\int 1/x\,dx=\ln|x|+C$ on either side of zero. For positive $x$, this is $\ln x+C$; for negative $x$, it is $\ln(-x)+C$. Other reverse rules include $\int e^x\,dx=e^x+C$, $\int\cos x\,dx=\sin x+C$, $\int\sin x\,dx=-\cos x+C$, $\int\sec^2x\,dx=\tan x+C$, and $\int1/(1+x^2)\,dx=\arctan x+C$.

An answer requesting a particular antiderivative can use $C=0$ or any other fixed number. A request for the general family must retain an arbitrary constant. A condition such as $F(0)=4$ selects one member: if $F'=6x^2$, then $F(x)=2x^3+C$ and substitution gives $C=4$. The derivative and the initial condition are separate checks; satisfying only one is insufficient.`,
      questions: [
        a(
          r`Find the general antiderivative of $8x^3-2x$ on $\mathbb R$.`,
          '8*x^3-2*x',
          '2*x^4-x^2+C',
          r`Increase each exponent and divide: $2x^4-x^2+C$. Its derivative is $8x^3-2x$.`,
        ),
        a(
          r`Find the general antiderivative of $x^{-2}$ on $(0,\infty)$.`,
          'x^(-2)',
          '-1/x+C',
          r`The power rule gives $x^{-1}/(-1)+C=-1/x+C$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $\sqrt{x}$ on $(0,\infty)$.`,
          'sqrt(x)',
          '2*x^(3/2)/3+C',
          r`$\sqrt{x}=x^{1/2}$, so the result is $(2/3)x^{3/2}+C$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $1/x$ on $(0,\infty)$.`,
          '1/x',
          'ln(x)+C',
          r`The exceptional power has logarithmic antiderivative $\ln x+C$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $3e^x+2\cos x$ on $\mathbb R$.`,
          '3*exp(x)+2*cos(x)',
          '3*exp(x)+2*sin(x)+C',
          r`The derivative of $3e^x+2\sin x+C$ is the integrand.`,
        ),
        a(
          r`Find one particular antiderivative of $\sin x$ on $\mathbb R$; do not include an arbitrary constant.`,
          'sin(x)',
          '-cos(x)',
          r`$(-\cos x)'=\sin x$, so $-\cos x$ is one valid choice.`,
          undefined,
          'particular',
        ),
        a(
          r`Find $F$ on $\mathbb R$ with $F'(x)=2x+3$ and $F(0)=5$.`,
          '2*x+3',
          'x^2+3*x+5',
          r`Integrating gives $x^2+3x+C$, and $F(0)=5$ makes $C=5$.`,
          undefined,
          'initial-value',
          { at: '0', value: '5' },
        ),
        a(
          r`Find the general antiderivative of $1/(1+x^2)$ on $\mathbb R$.`,
          '1/(1+x^2)',
          'atan(x)+C',
          r`The derivative of $\arctan x$ is $1/(1+x^2)$.`,
        ),
        o(
          r`Explain why $Cx^2$ is not the general antiderivative of $2x$.`,
          r`Its derivative is $2Cx$, which equals $2x$ only when $C=1$. The freedom is additive: $x^2+C$ differentiates to $2x$ for every constant.`,
        ),
        o(
          r`Construct two antiderivatives of $1/x$ on $\mathbb R\setminus\{0\}$ whose difference is not one constant on the whole domain.`,
          r`Take $F(x)=\ln|x|$ and define $G(x)=\ln|x|$ for $x>0$, $G(x)=\ln|x|+1$ for $x<0$. Both derivatives equal $1/x$, but $G-F$ is $0$ on one component and $1$ on the other.`,
          'construct',
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $5x^4+1$ on $\mathbb R$.`,
          '5*x^4+1',
          'x^5+x+C',
          r`Integrating each term gives $x^5+x+C$.`,
        ),
        a(
          r`Find $F$ with $F'=3x^2$ and $F(1)=4$ on $\mathbb R$.`,
          '3*x^2',
          'x^3+3',
          r`$F=x^3+C$ and $1+C=4$, so $C=3$.`,
          undefined,
          'initial-value',
          { at: '1', value: '4' },
        ),
        a(
          r`Find the general antiderivative of $2/x$ on $(-\infty,0)$.`,
          '2/x',
          '2*ln(-x)+C',
          r`On this interval $-x>0$ and $[2\ln(-x)]'=2/x$.`,
          { positive: ['-x'] },
        ),
      ],
      quickCheck: qc(
        r`Which describes every antiderivative of $4x^3$ on $\mathbb R$?`,
        [r`$x^4$`, r`$Cx^4$`, r`$x^4+C$`],
        2,
        r`Differentiation loses an additive constant, and the mean value theorem shows this is the only freedom on an interval.`,
      ),
    },
    {
      title: 'Differentiating accumulated area',
      sources: [ftc],
      terms: [
        term(
          'accumulation-function',
          'Accumulation function',
          'An integral with a moving bound.',
          r`For continuous $f$, $A(x)=\int_a^x f(t)\,dt$ satisfies $A'(x)=f(x)$.`,
          r`If $A(x)=\int_0^x e^{-t^2}\,dt$, then $A'(x)=e^{-x^2}$.`,
          'The dummy integration variable is replaced by the current bound after differentiation.',
        ),
      ],
      body: r`Fix a starting point $a$ and let the ending point move. The number $A(x)=\int_a^x f(t)\,dt$ now depends on $x$, so it defines a function. We use $t$ inside the integral to separate the integration variable from the moving endpoint. In particular, $A(a)=0$, regardless of the value of $f(a)$.

If $f$ is continuous, the first part of the fundamental theorem of calculus states that $A'(x)=f(x)$ at interior points. To understand why, subtract two accumulated amounts: $A(x+h)-A(x)=\int_x^{x+h}f(t)\,dt$. Dividing by $h$ gives an average height over a shrinking interval. Continuity makes those nearby heights approach $f(x)$, so the difference quotient does too. Differentiation recovers the current contribution rate from accumulated history.

For example, $A(x)=\int_1^x(t^2-4)\,dt$ has derivative $x^2-4$. Its value at $x=1$ is zero, while its derivative there is $-3$. A function value and its rate need not share a sign. On $(-2,2)$ the accumulation decreases; outside that range it increases. Its second derivative is $2x$, so the slope of the original integrand determines the concavity of the accumulation.

The chain rule remains necessary when the endpoint is itself a function. If $B(x)=\int_a^{g(x)}f(t)\,dt$, then $B'(x)=f(g(x))g'(x)$. For $B(x)=\int_0^{x^2}\cos t\,dt$, the answer is $2x\cos(x^2)$, not merely $\cos(x^2)$. A moving lower bound contributes the opposite sign. Splitting at a fixed reference point gives $\frac d{dx}\int_{u(x)}^{v(x)}f(t)\,dt=f(v(x))v'(x)-f(u(x))u'(x)$.

This theorem supplies derivatives even when no elementary antiderivative is available. The function $\int_0^x e^{-t^2}\,dt$ is perfectly well defined and differentiable although the usual elementary functions do not provide a formula for that antiderivative. A definition by an integral can be a final, useful description of a function. Check continuity before invoking the pointwise derivative conclusion, especially at a jump.`,
      questions: [
        e(
          r`Differentiate $A(x)=\int_2^x(t^3+1)\,dt$.`,
          'x^3+1',
          r`The integrand is continuous, so $A'(x)=x^3+1$.`,
        ),
        e(
          r`Differentiate $B(x)=\int_0^{x^2}e^t\,dt$.`,
          '2*x*exp(x^2)',
          r`Evaluate at the upper bound and multiply by its derivative: $e^{x^2}(2x)$.`,
        ),
        e(
          r`Differentiate $C(x)=\int_x^4\cos t\,dt$.`,
          '-cos(x)',
          r`The moving lower bound contributes $-\cos x$.`,
        ),
        e(
          r`Differentiate $D(x)=\int_x^{2x}t^2\,dt$.`,
          '7*x^2',
          r`The endpoint contributions are $(2x)^2(2)-x^2=7x^2$.`,
        ),
        e(
          r`For $x>0$, differentiate $E(x)=\int_1^{\sqrt{x}}\ln t\,dt$.`,
          'ln(sqrt(x))/(2*sqrt(x))',
          r`The chain rule gives $\ln(\sqrt{x})/(2\sqrt{x})$.`,
          ['x'],
          { positive: ['x'] },
        ),
        n(
          r`If $A(x)=\int_3^x(t^2+7)\,dt$, find $A(3)$.`,
          '0',
          r`Equal bounds make the integral zero.`,
        ),
        n(r`For $A(x)=\int_0^x(t^2-4)\,dt$, find $A'(1)$.`, '-3', r`$A'(1)=1^2-4=-3$.`),
        e(
          r`Find $A''(x)$ for $A(x)=\int_0^x\sin t\,dt$.`,
          'cos(x)',
          r`First $A'=\sin x$; differentiating again gives $A''=\cos x$.`,
        ),
        o(
          r`Explain why positive $A(x)$ does not force positive $A'(x)$ for an accumulation function.`,
          r`$A(x)$ records the accumulated history, while $A'(x)=f(x)$ is the current rate. Earlier positive contributions can leave a positive total even after the current rate becomes negative.`,
        ),
        o(
          r`Let $f(t)=0$ for $t<0$ and $f(t)=1$ for $t\ge0$. Is $A(x)=\int_{-1}^xf(t)\,dt$ differentiable at zero? Explain.`,
          r`For $x<0$, $A(x)=0$; for $x>0$, $A(x)=x$. The left derivative at zero is $0$ and the right derivative is $1$, so there is no derivative there. Continuity of the integrand cannot be omitted from the usual FTC statement.`,
        ),
      ],
      review: [
        e(
          r`Differentiate $\int_1^{3x}\sin(t^2)\,dt$.`,
          '3*sin(9*x^2)',
          r`FTC at $3x$ gives $\sin((3x)^2)$, then the chain factor is $3$.`,
        ),
        e(
          r`Differentiate $\int_{x^2}^{x^3}e^t\,dt$.`,
          '3*x^2*exp(x^3)-2*x*exp(x^2)',
          r`Subtract the lower-bound contribution from the upper-bound contribution.`,
        ),
        o(
          r`Explain why $A(x)=\int_0^x f(t)\,dt$ is concave upward wherever a differentiable $f$ is increasing.`,
          r`FTC gives $A'=f$, so $A''=f'$. When $f'>0$, $A''>0$, giving upward concavity; the nonstrict version uses $f'\ge0$.`,
        ),
      ],
    },
    {
      title: 'Evaluating definite integrals',
      sources: [ftc, anti],
      terms: [
        term(
          'ftc-evaluation',
          'FTC evaluation formula',
          'Evaluate an antiderivative at the two bounds and subtract.',
          r`For continuous $f$ and $F'=f$ on $[a,b]$, $\int_a^b f(x)\,dx=F(b)-F(a)$.`,
          r`$\int_1^2 3x^2\,dx=2^3-1^3=7$.`,
          'The rule requires an antiderivative valid across the integration interval.',
        ),
      ],
      body: r`The second part of the fundamental theorem turns accumulation into an endpoint calculation. If $f$ is continuous on $[a,b]$ and $F'=f$, then $\int_a^b f(x)\,dx=F(b)-F(a)$. We abbreviate this difference by $[F(x)]_a^b$. The brackets mean “evaluate at the upper bound, then subtract the value at the lower bound.” They are not another differentiation operation.

To connect this result with the first part, let $A(x)=\int_a^x f(t)\,dt$. Both $A$ and $F$ have derivative $f$, so their difference is constant. Since $A(a)=0$, we obtain $A(x)=F(x)-F(a)$. Evaluating at $b$ gives the endpoint formula. This argument explains why the theorem evaluates the Riemann-sum integral; it is not a new unrelated definition.

For $\int_1^3(2x+1)\,dx$, an antiderivative is $x^2+x$. The upper evaluation is $12$ and the lower is $2$, giving $10$. Parentheses protect the subtraction in less friendly examples: $[x^3-2x]_{-1}^2=(8-4)-(-1+2)=3$. Subtract the whole lower expression, not just its first term.

Any antiderivative gives the same result because constants cancel: $(F(b)+C)-(F(a)+C)=F(b)-F(a)$. Therefore a fixed-bound integral answer does not contain $+C$. Conversely, forgetting the initial value when recovering a quantity from its derivative loses real information. If $Q'=r$, then $Q(b)=Q(a)+\int_a^b r$, which is the net-change theorem expressed with an initial quantity.

Always check the interval before applying the shortcut. Although $-1/x$ differentiates to $1/x^2$ away from zero, substituting bounds $-1$ and $1$ into it does not evaluate an ordinary integral across the singularity. There is no continuous integrand on that whole interval, and the actual improper integral diverges. The endpoint formula cannot jump over a missing part of the domain. This domain check is as essential as finding the antiderivative.`,
      questions: [
        n(r`Evaluate $\int_0^2(3x^2+1)\,dx$.`, '10', r`$[x^3+x]_0^2=8+2=10$.`),
        n(r`Evaluate $\int_{-1}^2(2x-3)\,dx$.`, '-6', r`$[x^2-3x]_{-1}^2=(4-6)-(1+3)=-6$.`),
        n(r`Evaluate $\int_1^4 x^{-2}\,dx$.`, '3/4', r`$[-1/x]_1^4=-1/4+1=3/4$.`),
        n(r`Evaluate $\int_1^e1/x\,dx$.`, '1', r`$[\ln x]_1^e=1-0=1$.`),
        n(r`Evaluate $\int_0^{\pi/2}\cos x\,dx$.`, '1', r`$[\sin x]_0^{\pi/2}=1$.`),
        n(r`Evaluate $\int_0^1 e^x\,dx$.`, 'e-1', r`$[e^x]_0^1=e-1$.`),
        n(r`Evaluate $\int_2^0 x^3\,dx$.`, '-4', r`$[x^4/4]_2^0=0-4=-4$.`),
        n(
          r`A quantity starts at $6$ and has rate $r(t)=2t+1$ on $[0,3]$. Find its final value.`,
          '18',
          r`The change is $[t^2+t]_0^3=12$; add the initial $6$ to obtain $18$.`,
        ),
        o(
          r`Explain algebraically why adding $17$ to an antiderivative cannot change a fixed-bound integral.`,
          r`The evaluated difference becomes $(F(b)+17)-(F(a)+17)=F(b)-F(a)$. The additive shift cancels exactly.`,
        ),
        o(
          r`A student writes $\int_{-1}^1x^{-2}\,dx=[-1/x]_{-1}^1=-2$. Identify the invalid step.`,
          r`The integrand is undefined and unbounded at zero, so the ordinary FTC hypotheses fail across the interval. The negative result also contradicts positivity. The two one-sided improper contributions must be considered separately and both diverge.`,
        ),
      ],
      review: [
        n(r`Evaluate $\int_1^2(4x^3-2)\,dx$.`, '13', r`$[x^4-2x]_1^2=(16-4)-(1-2)=13$.`),
        n(r`Evaluate $\int_0^{\pi}\sin x\,dx$.`, '2', r`$[-\cos x]_0^\pi=1-(-1)=2$.`),
        n(
          r`Given $F'=f$, $F(2)=8$, and $\int_2^5f=-3$, find $F(5)$.`,
          '5',
          r`FTC gives $F(5)-8=-3$, hence $F(5)=5$.`,
        ),
      ],
      quickCheck: qc(
        r`If $F'=f$ and both are valid across $[a,b]$, which evaluates $\int_a^b f$?`,
        [r`$F(b)-F(a)$`, r`$f(b)-f(a)$`, r`$F(b)+C$`],
        0,
        r`The endpoint difference uses an antiderivative. Its arbitrary constant cancels.`,
      ),
    },
    {
      title: 'Substitution reverses the chain rule',
      sources: [sub],
      terms: [
        term(
          'u-substitution',
          'Substitution in integration',
          'A change of variable that reverses the chain rule.',
          r`If $u=g(x)$, then $du=g'(x)dx$ and $\int f(g(x))g'(x)\,dx=\int f(u)\,du$.`,
          r`$\int2x\cos(x^2)\,dx=\sin(x^2)+C$.`,
          'The differential and every remaining variable must be transformed consistently.',
        ),
      ],
      body: r`Differentiating a composition produces an outer derivative and an inner derivative. Integration can reverse that pattern. If $F'=f$, then $[F(g(x))]'=f(g(x))g'(x)$, so $\int f(g(x))g'(x)\,dx=F(g(x))+C$. The notation $u=g(x)$ and $du=g'(x)\,dx$ packages the chain factor into a new variable.

For $\int 6x(x^2+4)^2\,dx$, choose $u=x^2+4$. Then $du=2x\,dx$, so $6x\,dx=3\,du$. The integral becomes $3\int u^2\,du=u^3+C=(x^2+4)^3+C$. A derivative check gives $3(x^2+4)^2(2x)$, exactly the original integrand. This check catches the common missing factor of $3$.

The inner derivative may differ by a constant, which can be compensated. For $\int e^{5x}\,dx$, $u=5x$ gives $dx=du/5$, hence $e^{5x}/5+C$. But a variable factor cannot be invented. Choosing $u=x^2$ in $\int e^{x^2}\,dx$ does not produce $\int e^u\,du$ because the required $2x$ factor is absent. Expressing $dx$ in terms of $u$ introduces another nonconstant factor rather than solving the difficulty.

Look for structure before expanding. The derivative-over-function pattern gives $\int g'(x)/g(x)\,dx=\ln|g(x)|+C$ on intervals where $g$ never vanishes. For example, $\int2x/(x^2+3)\,dx=\ln(x^2+3)+C$, with no absolute value needed because the argument is positive. Similarly, an inverse-trigonometric derivative can be recognized after rescaling: $\int1/(9+x^2)\,dx=(1/3)\arctan(x/3)+C$.

Substitution is a change in the entire expression, not just a nickname for part of it. Once the integral is written in $u$, no unexplained $x$ should remain. After an indefinite integration, return to the original variable. Different correct substitutions may yield answers that look different but differ only by a constant on the stated interval; differentiation is the natural way to compare them.`,
      questions: [
        a(
          r`Find the general antiderivative of $2x(x^2+1)^3$ on $\mathbb R$.`,
          '2*x*(x^2+1)^3',
          '(x^2+1)^4/4+C',
          r`Let $u=x^2+1$, $du=2x\,dx$; integrate $u^3$ to get $(x^2+1)^4/4+C$.`,
        ),
        a(
          r`Find the general antiderivative of $e^{3x}$ on $\mathbb R$.`,
          'exp(3*x)',
          'exp(3*x)/3+C',
          r`The chain factor $3$ is compensated by dividing by $3$.`,
        ),
        a(
          r`Find the general antiderivative of $\cos(2x)$ on $\mathbb R$.`,
          'cos(2*x)',
          'sin(2*x)/2+C',
          r`$[\sin(2x)/2]'=\cos(2x)$.`,
        ),
        a(
          r`Find the general antiderivative of $2x/(x^2+5)$ on $\mathbb R$.`,
          '2*x/(x^2+5)',
          'ln(x^2+5)+C',
          r`Use $u=x^2+5>0$, $du=2x\,dx$, giving $\ln(x^2+5)+C$.`,
          { positive: ['x^2+5'] },
        ),
        a(
          r`Find the general antiderivative of $1/(4+x^2)$ on $\mathbb R$.`,
          '1/(4+x^2)',
          'atan(x/2)/2+C',
          r`With $u=x/2$, the integral is $(1/2)\int1/(1+u^2)\,du$.`,
        ),
        a(
          r`Find the general antiderivative of $x/\sqrt{x^2+1}$ on $\mathbb R$.`,
          'x/sqrt(x^2+1)',
          'sqrt(x^2+1)+C',
          r`Using $u=x^2+1$ gives $(1/2)\int u^{-1/2}\,du=\sqrt{u}+C$.`,
          { positive: ['x^2+1'] },
        ),
        a(
          r`Find the general antiderivative of $\ln x/x$ on $(0,\infty)$.`,
          'ln(x)/x',
          'ln(x)^2/2+C',
          r`Use $u=\ln x$ and $du=dx/x$, giving $u^2/2+C$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $\sin^2x\cos x$ on $\mathbb R$.`,
          'sin(x)^2*cos(x)',
          'sin(x)^3/3+C',
          r`Use $u=\sin x$, $du=\cos x\,dx$, giving $u^3/3+C$.`,
        ),
        o(
          r`Explain the error in $\int e^{x^2}\,dx=e^{x^2}+C$ by differentiating the proposed answer.`,
          r`The derivative is $2xe^{x^2}$, which contains an extra factor $2x$. The integrand does not have the chain factor needed for this substitution shortcut.`,
        ),
        o(
          r`Two students obtain $\tfrac12\ln(2x+2)$ and $\tfrac12\ln(x+1)$ as particular antiderivatives of $1/(2x+2)$ on $x>-1$. Reconcile them.`,
          r`Since $\ln(2x+2)=\ln2+\ln(x+1)$ on that interval, their answers differ by the constant $(\ln2)/2$. Both derivatives equal $1/(2x+2)$.`,
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $4x e^{2x^2}$ on $\mathbb R$.`,
          '4*x*exp(2*x^2)',
          'exp(2*x^2)+C',
          r`The inner derivative of $2x^2$ is $4x$, so substitution gives $e^{2x^2}+C$.`,
        ),
        a(
          r`Find the general antiderivative of $3/(3x+2)$ on $(-2/3,\infty)$.`,
          '3/(3*x+2)',
          'ln(3*x+2)+C',
          r`The numerator is the derivative of the positive denominator.`,
          { positive: ['3*x+2'] },
        ),
        a(
          r`Find the general antiderivative of $\sin(4x)$ on $\mathbb R$.`,
          'sin(4*x)',
          '-cos(4*x)/4+C',
          r`The negative sign reverses the cosine derivative and $1/4$ compensates the chain factor.`,
        ),
      ],
    },
    {
      title: 'Changing bounds and checking the model',
      sources: [sub, ftc],
      terms: [
        term(
          'transformed-bounds',
          'Transformed bounds',
          'The old endpoints evaluated in the new variable.',
          r`With $u=g(x)$, a definite substitution changes $a,b$ to $g(a),g(b)$.`,
          r`For $u=x^2+1$, the interval endpoints $x=0,2$ become $u=1,5$.`,
          'Bounds belong to their integration variable; mixing old bounds with a new variable is invalid.',
        ),
      ],
      body: r`A definite integral offers two consistent routes after substitution. You can transform the bounds and finish entirely in the new variable, or find an antiderivative in the original variable and then use the original bounds. Mixing these routes is the mistake to avoid. Bounds record values of the current variable, not numbers that can be copied mechanically.

For $I=\int_0^2 2x(x^2+1)^2\,dx$, let $u=x^2+1$. At the original lower endpoint $x=0$, $u=1$; at the upper endpoint $x=2$, $u=5$. Thus $I=\int_1^5u^2\,du=[u^3/3]_1^5=(125-1)/3=124/3$. Alternatively, use $(x^2+1)^3/3$ and evaluate from $0$ to $2$, obtaining the same value. Evaluating $u^3/3$ from $0$ to $2$ would solve a different problem.

A decreasing substitution reverses the transformed bounds and also introduces a negative differential. These two signs work together. For $\int_0^1e^{-x}\,dx$, setting $u=-x$ yields $-\int_0^{-1}e^u\,du=\int_{-1}^0e^u\,du=1-e^{-1}$. The answer must be positive because the integrand is positive on a forward interval.

The derivative-matched substitution formula does not require the inner function to be one-to-one. For instance, $\int_{-1}^1 2x\cos(x^2)\,dx$ transforms to equal endpoint values and is zero. As $x$ travels toward zero and then away, $u=x^2$ runs backward and forward, so the signed contributions cancel. This does not say every integral under a non-injective change of coordinates can be transformed without care; the chain factor is essential here.

Finally, combine the symbolic result with its meaning. If a rate is $r(t)=2t/(t^2+1)$ on $[0,2]$, its accumulated change is $\ln5$. A starting amount still has to be added. If an answer violates a sign bound, has the wrong units, or leaves the integration variable in a fixed-bound result, revisit the setup before trusting algebra. A complete solution includes the interval, substitution, endpoint interpretation, and final quantity.`,
      questions: [
        n(
          r`Evaluate $\int_0^1 2x(x^2+2)\,dx$.`,
          '5/2',
          r`Use $u=x^2+2$ with bounds $2,3$: $[u^2/2]_2^3=(9-4)/2=5/2$.`,
        ),
        n(
          r`Evaluate $\int_0^2 2x/(x^2+1)\,dx$.`,
          'ln(5)',
          r`The new bounds are $1,5$, giving $\int_1^5du/u=\ln5$.`,
        ),
        n(
          r`Evaluate $\int_0^{\pi/4}2\cos(2x)\,dx$.`,
          '1',
          r`Set $u=2x$; $u$ runs from $0$ to $\pi/2$, giving $[\sin u]_0^{\pi/2}=1$.`,
        ),
        n(
          r`Evaluate $\int_0^1 e^{-x}\,dx$.`,
          '1-exp(-1)',
          r`An antiderivative is $-e^{-x}$, so the value is $1-e^{-1}$.`,
        ),
        n(
          r`Evaluate $\int_1^e\ln x/x\,dx$.`,
          '1/2',
          r`Set $u=\ln x$; the bounds become $0,1$ and $\int_0^1u\,du=1/2$.`,
        ),
        n(
          r`For $u=3x+1$, what is the new upper bound when the original upper bound is $x=2$?`,
          '7',
          r`Evaluate the substitution at the endpoint: $u=3(2)+1=7$.`,
        ),
        n(
          r`Evaluate $\int_{-1}^1 2x\cos(x^2)\,dx$.`,
          '0',
          r`The antiderivative is $\sin(x^2)$, with identical values at both endpoints. Equivalently, the integrand is odd.`,
        ),
        n(
          r`Evaluate $\int_0^3 x/\sqrt{x^2+7}\,dx$.`,
          '4-sqrt(7)',
          r`The antiderivative is $\sqrt{x^2+7}$, giving $4-\sqrt7$.`,
        ),
        o(
          r`Diagnose $\int_0^2 2x(x^2+1)^2\,dx=\int_0^2u^2\,du$ after setting $u=x^2+1$.`,
          r`The differential was transformed correctly but the bounds were not. Original $x$ endpoints $0,2$ correspond to $u$ endpoints $1,5$. The correct transformed integral is $\int_1^5u^2\,du$.`,
        ),
        o(
          r`Why can equal transformed endpoints be correct even when the original endpoints differ?`,
          r`For a derivative-matched integrand $f(g(x))g'(x)$, an antiderivative is $F(g(x))$. If $g(a)=g(b)$, its endpoint values agree and the signed integral is zero. The inner coordinate may retrace values, causing cancellation.`,
        ),
      ],
      review: [
        n(
          r`Evaluate $\int_0^1 6x(x^2+1)^2\,dx$.`,
          '7',
          r`Use $u=x^2+1$; $6x\,dx=3du$, so $3[u^3/3]_1^2=8-1=7$.`,
        ),
        n(
          r`Evaluate $\int_0^{\ln2}e^x/(1+e^x)\,dx$.`,
          'ln(3)-ln(2)',
          r`The denominator substitution gives bounds $2,3$ and integral $\ln3-\ln2$.`,
        ),
        o(
          r`A rate integral is evaluated after substituting $u=t^2+1$, but the final answer still contains $u$. What is unfinished?`,
          r`A fixed-bound rate integral should be a number with the quantity's units. The transformed antiderivative still needs endpoint evaluation (or back-substitution followed by evaluation), and an initial amount must be added if the requested quantity is final level.`,
          'interpret',
        ),
      ],
    },
  ],
};
