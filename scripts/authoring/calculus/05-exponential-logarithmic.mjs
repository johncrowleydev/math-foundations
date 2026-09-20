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
const S = () => [
  source(
    '3.9',
    'Natural and general exponential/logarithmic derivatives, logarithmic differentiation and domains.',
  ),
];
export default {
  number: 5,
  slug: 'calculus-exponential-logarithmic',
  title: 'Exponential and Logarithmic Differentiation',
  intro: R`Exponential functions describe multiplicative change, while logarithms reverse that relationship and convert products into sums. Their derivatives connect absolute rates, relative rates, growth, and sensitivity. This lesson extends the chain rule to these functions, then uses logarithmic differentiation when both the base and exponent depend on the input. We will state real domains before using logarithm identities and distinguish a model's instantaneous fractional rate from a finite percentage change. These distinctions are useful in science, computation, and model fitting, where an exponential or logarithm often sits inside a larger expression.`,
  sections: [
    {
      title: 'The natural exponential and logarithm',
      sources: S(),
      body: R`The natural exponential $e^x$ is distinguished by the identity $(e^x)'=e^x$. Its derivative equals its current value. From the difference quotient, $[e^{x+h}-e^x]/h=e^x(e^h-1)/h$; the special base $e$ makes the final limit factor equal to $1$. Here $e$ is the fixed positive constant approximately $2.71828$, not a variable or a unit.

The natural logarithm $\ln x$ is the inverse of $e^x$ and is defined for positive real $x$. The inverse derivative formula gives $(\ln x)'=1/x$. To see the matching input explicitly, let $y=\ln x$, so $e^y=x$. Differentiating gives $e^y y'=1$, hence $y'=1/e^y=1/x$. The output of a logarithm can be negative; its input must be positive. For example, $\ln(1/2)<0$ is perfectly defined.

The chain rule gives $[e^{u(x)}]'=e^{u(x)}u'(x)$ and $[\ln u(x)]'=u'(x)/u(x)$ on intervals where $u(x)>0$. For $e^{-3x^2}$, the derivative is $-6xe^{-3x^2}$. For $\ln(x^2+4)$, it is $2x/(x^2+4)$; the logarithm argument is positive for every real $x$. These examples show why the exponential factor keeps its entire original exponent and why the logarithm derivative still needs the inner rate.

For nonzero $u(x)$, the useful identity $[\ln|u(x)|]'=u'(x)/u(x)$ holds on intervals avoiding zeros. On a negative branch, $|u|=-u$ and differentiating $\ln(-u)$ yields $(-u')/(-u)=u'/u$. Absolute value extends this logarithmic expression to both signs, but it does not include zeros. Thus $\ln|x|$ is differentiable on each interval $x<0$ and $x>0$, whereas $\ln x$ is only defined on the positive interval. The same derivative formula can belong to functions with different domains.`,
      terms: [
        term(
          'natural-exponential',
          'Natural exponential',
          'The exponential whose derivative equals itself.',
          R`$(e^x)'=e^x$; composition adds the inner derivative.`,
          R`$(e^{2x})'=2e^{2x}$.`,
          'Do not lower the exponent as if applying the power rule.',
        ),
        term(
          'logarithmic-derivative-rule',
          'Logarithm derivative rule',
          'Inner rate divided by inner value.',
          R`$[\ln u]'=u'/u$ when $u>0$; $[\ln|u|]'=u'/u$ when $u\ne0$.`,
          R`$[\ln(x^2+1)]'=2x/(x^2+1)$.`,
          'The derivative formula does not erase the logarithm domain.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $e^{4x}$ for real $x$.`,
          '4*exp(4*x)',
          R`The exponential remains and is multiplied by inner derivative $4$.`,
        ),
        calc(
          R`Differentiate $e^{-x^2}$ for real $x$.`,
          '-2*x*exp(-x^2)',
          R`The exponent has derivative $-2x$, so the chain rule gives $-2xe^{-x^2}$.`,
        ),
        expr(
          R`Differentiate $\ln x$ on $x>0$.`,
          '1/x',
          R`The natural logarithm derivative is $1/x$ on its positive domain.`,
        ),
        expr(
          R`Differentiate $\ln(3x+2)$ where $3x+2>0$.`,
          '3/(3*x+2)',
          R`Divide the inner derivative $3$ by its value $3x+2$.`,
        ),
        expr(
          R`Differentiate $\ln(x^2+5)$ for real $x$.`,
          '2*x/(x^2+5)',
          R`The positive argument has derivative $2x$, giving the ratio $2x/(x^2+5)$.`,
        ),
        expr(
          R`Differentiate $\ln|x-2|$ on either interval avoiding $x=2$.`,
          '1/(x-2)',
          R`The absolute-log rule gives inner derivative $1$ over inner value $x-2$.`,
        ),
        exact(
          R`Find the derivative of $e^{2x}$ at $x=0$.`,
          2,
          R`The derivative is $2e^{2x}$; at zero it equals $2$.`,
        ),
        exact(
          R`Find the derivative of $\ln x$ at $x=4$.`,
          '1/4',
          R`The derivative value is $1/4$.`,
        ),
        open(
          R`Derive $(\ln x)'$ from the inverse relationship with $e^x$.`,
          R`If $y=\ln x$, then $e^y=x$. The chain rule yields $e^y y'=1$, so $y'=1/e^y=1/x$, with $x>0$.`,
          'prove',
        ),
        open(
          R`Explain why $\ln|x|$ and $\ln x$ have the same derivative on positive inputs but different real domains.`,
          R`For $x>0$, the functions are identical. The absolute value also supplies a positive logarithm argument when $x<0$, where its derivative is still $1/x$. Neither is defined at zero, and $\ln x$ has no negative real inputs.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $e^{1-5x}$ for real $x$.`,
          '-5*exp(1-5*x)',
          R`The inner derivative is $-5$.`,
        ),
        expr(
          R`Differentiate $\ln(7-x)$ on $x<7$.`,
          '-1/(7-x)',
          R`The inner derivative is $-1$ and the argument is positive on the stated domain.`,
        ),
        exact(
          R`Find the derivative of $\ln(x^2+1)$ at $x=2$.`,
          '4/5',
          R`The derivative is $2x/(x^2+1)$, yielding $4/5$.`,
        ),
      ],
    },
    {
      title: 'Other bases and valid logarithm identities',
      sources: S(),
      body: R`For a fixed base $a>0$, write $a^x=e^{x\ln a}$. The chain rule then gives $(a^x)'=a^x\ln a$. The base $a=1$ produces the constant function and zero derivative; bases between zero and one have negative logarithms and decreasing exponentials. If the exponent is a differentiable function $u(x)$, multiply once more by $u'(x)$.

For logarithms, the change-of-base identity is $\log_a x=\ln x/\ln a$, requiring $a>0$, $a\ne1$, and $x>0$. Since $\ln a$ is a nonzero constant, $(\log_a x)'=1/(x\ln a)$. The base factor is in the denominator for a logarithm and a multiplier for an exponential. Keeping the change-of-base derivation in mind is more reliable than trying to memorize the locations independently.

For $f(x)=2^{3x}$, the derivative is $3\ln2\,2^{3x}$. Its logarithmic rate $f'/f$ is $3\ln2$, so the exponent coefficient $3$ by itself is not the rate with respect to a natural exponential model. For $g(x)=\log_{10}(x^2+1)$, the derivative is $2x/[(x^2+1)\ln10]$. The argument is always positive, and the base contributes only a constant scaling.

Logarithm identities can simplify a derivative, but only when their domains are respected. On $x>0$, $\ln(x^3)=3\ln x$. On $x\ne0$, $\ln(x^2)=2\ln|x|$; replacing the latter by $2\ln x$ would discard the negative half of the original domain. Also, $\ln(u+v)$ is not $\ln u+\ln v$. The sum of logarithms corresponds to a product of positive arguments, not to adding those arguments.

When cancellation produces a simpler derivative, keep the original domain in the statement. The derivative of $\ln(x^2)$ is $2/x$ on $x\ne0$, but the same formula does not make the logarithm defined at zero. Domains belong to the modeled relationship and cannot be reconstructed from the final derivative formula alone.`,
      terms: [
        term(
          'general-exponential-derivative',
          'General-base exponential derivative',
          'A fixed base contributes its natural logarithm.',
          R`$(a^{u(x)})'=a^{u(x)}\ln(a)u'(x)$ for fixed $a>0$.`,
          R`$(2^x)'=2^x\ln2$.`,
          'A variable base needs a different argument.',
        ),
        term(
          'change-of-base',
          'Change of logarithm base',
          'Convert a logarithm into natural logarithms.',
          R`$\log_a x=\ln x/\ln a$ for $x>0$, $a>0$, $a\ne1$.`,
          R`$(\log_{10}x)'=1/(x\ln10)$.`,
          'The denominator depends on the base, not on a variable exponent.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $2^x$ for real $x$.`,
          '2^x*ln(2)',
          R`A fixed base contributes the factor $\ln2$.`,
        ),
        calc(
          R`Differentiate $5^{2x}$ for real $x$.`,
          '2*5^(2*x)*ln(5)',
          R`Multiply by both $\ln5$ and inner derivative $2$.`,
        ),
        calc(
          R`Differentiate $(1/2)^x$ for real $x$.`,
          '(1/2)^x*ln(1/2)',
          R`The derivative is the original exponential times $\ln(1/2)$, a negative number.`,
        ),
        calc(
          R`Differentiate $\log_3 x$ on $x>0$.`,
          '1/(x*ln(3))',
          R`Change base to $\ln x/\ln3$ and differentiate.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $\log_2(x+1)$ on $x>-1$.`,
          '1/((x+1)*ln(2))',
          R`The inner derivative is $1$ and the base contributes denominator $\ln2$.`,
          { positive: ['x+1'] },
        ),
        expr(
          R`Differentiate $\ln(x^2)$ for $x\ne0$.`,
          '2/x',
          R`The chain rule gives $2x/x^2=2/x$ on the original domain.`,
        ),
        expr(
          R`Differentiate $\ln(x^3)$ on $x>0$.`,
          '3/x',
          R`The positive-domain identity $\ln(x^3)=3\ln x$ yields $3/x$.`,
        ),
        bool(
          R`For positive $u,v$, is $\ln(u+v)=\ln u+\ln v$ an identity?`,
          false,
          R`The right side equals $\ln(uv)$, not $\ln(u+v)$. For $u=v=1$, the claimed equality would be $\ln2=0$.`,
        ),
        open(
          R`Derive the formula for $(a^x)'$ from the natural exponential rule.`,
          R`Write $a^x=e^{x\ln a}$ for fixed $a>0$. The chain rule gives $e^{x\ln a}\ln a=a^x\ln a$.`,
          'prove',
        ),
        open(
          R`Explain why $2\ln|x|$ is a more faithful simplification of $\ln(x^2)$ than $2\ln x$.`,
          R`The original argument $x^2$ is positive for every nonzero real $x$. The absolute-value form preserves both positive and negative inputs, whereas $2\ln x$ is only real for positive $x$.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $3^{x^2}$ for real $x$.`,
          '2*x*3^(x^2)*ln(3)',
          R`The inner derivative $2x$ multiplies the base factor $\ln3$ and the original exponential.`,
        ),
        calc(
          R`Differentiate $\log_5(2x-1)$ on $x>1/2$.`,
          '2/((2*x-1)*ln(5))',
          R`Use the inner rate $2$, the inner value $2x-1$, and the constant base factor.`,
          { positive: ['2*x-1'] },
        ),
        expr(
          R`Differentiate $\ln(x^4)$ for $x\ne0$.`,
          '4/x',
          R`The chain rule gives $4x^3/x^4=4/x$.`,
        ),
      ],
      quickCheck: qc(
        R`What factor accompanies $a^x$ in its derivative for fixed positive $a$?`,
        [R`$x$`, R`$\ln a$`, R`$1/\ln a$`],
        1,
        'Writing the function as $e^{x\ln a}$ shows that the exponent has derivative $\ln a$.',
      ),
    },
    {
      title: 'Logarithmic differentiation',
      sources: S(),
      body: R`Logarithmic differentiation is useful when a positive function is assembled from many products, quotients, or variable powers. Take its natural logarithm, use valid logarithm identities to reorganize the expression, differentiate implicitly, and finally multiply by the original function to recover its derivative. The intermediate quantity is $y'/y$, not $y'$ itself.

For $y=x^x$ on $x>0$, neither the ordinary power rule nor the fixed-base exponential rule applies alone: both base and exponent change. Taking logarithms gives $\ln y=x\ln x$. The product rule gives $y'/y=\ln x+1$, hence $y'=x^x(\ln x+1)$. Equivalently, rewrite $x^x=e^{x\ln x}$ and use the chain rule. This second route confirms why the two contributions appear.

More generally, if $u(x)>0$ and $y=u(x)^{v(x)}$, then $\ln y=v\ln u$. Differentiating yields $y'/y=v'\ln u+vu'/u$, so

$y'=u^v\left(v'\ln u+v\dfrac{u'}{u}\right)$.

This formula includes the fixed-base and fixed-exponent cases when the appropriate derivative vanishes. Stating $u>0$ makes arbitrary real variable exponents well-defined without introducing complex-valued conventions.

For a product example, let $y=x^2\sqrt{x+1}/(x+2)$ on $x>0$. Its logarithm is $2\ln x+(1/2)\ln(x+1)-\ln(x+2)$. Therefore $y'=y[2/x+1/(2(x+1))-1/(x+2)]$. Leaving the original function times this sum is both correct and easy to audit. The negative quotient term and fractional root coefficient remain visible.

For a nonzero function that can be negative, $\ln|y|$ sometimes permits the same method on intervals without zeros. At a zero, logarithmic division by $y$ fails even if the original function has a derivative there. Calculate such points directly from the original expression or another valid derivative rule. A method's restriction does not necessarily mean the function itself is singular.`,
      terms: [
        term(
          'logarithmic-differentiation',
          'Logarithmic differentiation',
          'Differentiate a logarithm, then recover the original rate.',
          R`For a positive $y(x)$, first calculate $(\ln y)'=y'/y$, then multiply by $y$.`,
          R`For $y=x^x$, $y'=x^x(\ln x+1)$ on $x>0$.`,
          'Stopping at the logarithmic derivative omits a factor of the original function.',
        ),
        term(
          'variable-power',
          'Variable power',
          'An expression with both base and exponent varying.',
          R`For $u>0$, $u^v=e^{v\ln u}$, so both $u'$ and $v'$ can contribute.`,
          R`$(x^x)'=x^x(\ln x+1)$.`,
          'Do not apply a fixed-base or fixed-exponent rule alone.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $x^x$ on $x>0$.`,
          'x^x*(ln(x)+1)',
          R`From $\ln y=x\ln x$, obtain $y'/y=\ln x+1$, then multiply by $x^x$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $x^{2x}$ on $x>0$.`,
          'x^(2*x)*(2*ln(x)+2)',
          R`The logarithm is $2x\ln x$, whose derivative is $2\ln x+2$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $(x+1)^x$ on $x>-1$.`,
          '(x+1)^x*(ln(x+1)+x/(x+1))',
          R`Differentiate $x\ln(x+1)$ and multiply by the original power.`,
          { positive: ['x+1'] },
        ),
        calc(
          R`Differentiate $x^{\sin x}$ on $x>0$, using radians.`,
          'x^sin(x)*(cos(x)*ln(x)+sin(x)/x)',
          R`The logarithm is $\sin x\ln x$, giving two product-rule terms.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $(\sin x)^x$ on $0<x<\pi$.`,
          'sin(x)^x*(ln(sin(x))+x*cos(x)/sin(x))',
          R`The sine is positive on this interval, so differentiate $x\ln(\sin x)$ and multiply by $(\sin x)^x$.`,
          { positive: ['sin(x)'] },
        ),
        exact(R`For $f(x)=x^x$ on $x>0$, find $f'(1)$.`, 1, R`$1^1(\ln1+1)=1$.`),
        expr(
          R`For positive $x$, let $y=x^3(x+1)^2$. Find the logarithmic derivative $y'/y$.`,
          '3/x+2/(x+1)',
          R`$\ln y=3\ln x+2\ln(x+1)$, so $y'/y=3/x+2/(x+1)$.`,
        ),
        expr(
          R`For positive $x$, let $y=x^2/(x+3)$. Find $y'/y$.`,
          '2/x-1/(x+3)',
          R`The logarithm is $2\ln x-\ln(x+3)$, whose derivative is the stated difference.`,
        ),
        open(
          R`Derive the variable-power derivative for $y=u(x)^{v(x)}$ assuming $u(x)>0$.`,
          R`Take logarithms: $\ln y=v\ln u$. Differentiate to get $y'/y=v'\ln u+vu'/u$. Multiply by $u^v$ to recover $y'$.`,
          'prove',
        ),
        open(
          R`Explain why using $\ln y$ to differentiate $y=x^2$ excludes a point where $y$ itself is differentiable.`,
          R`The logarithm is undefined at $x=0$, and the intermediate ratio $y'/y$ divides by zero there. But differentiating the original polynomial gives $y'=2x$, including derivative zero at $0$.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $x^{3x}$ on $x>0$.`,
          'x^(3*x)*(3*ln(x)+3)',
          R`Differentiate the logarithm $3x\ln x$ and multiply by the original function.`,
          { positive: ['x'] },
        ),
        expr(
          R`For $y=x^4/(x+2)^3$ with $x>0$, find $y'/y$.`,
          '4/x-3/(x+2)',
          R`Differentiate $4\ln x-3\ln(x+2)$.`,
        ),
        exact(
          R`For $f(x)=x^{2x}$ on $x>0$, find $f'(1)$.`,
          2,
          R`At $1$, the formula gives $1(2\ln1+2)=2$.`,
        ),
      ],
      quickCheck: qc(
        R`After differentiating $\ln y=x\ln x$, you obtain $y'/y=\ln x+1$. What remains?`,
        [
          'Nothing; this is already the derivative',
          'Multiply by the original function $y=x^x$',
          'Divide by $x^x$',
        ],
        1,
        'Implicit differentiation of a logarithm gives a relative rate. Multiplying by the original value recovers the absolute derivative.',
      ),
    },
    {
      title: 'Growth, decay, and relative rates',
      sources: [
        source('3.9', 'Exponential derivatives and logarithmic rates.'),
        source('3.4', 'Rates of change, units and local interpretations.'),
      ],
      body: R`For a positive quantity $P(t)$, the relative rate is $P'(t)/P(t)$: the absolute rate divided by the current amount. Its units are reciprocal time. The logarithmic derivative identity gives $d(\ln P)/dt=P'/P$, connecting relative change with logarithms. If the model is $P(t)=P_0e^{kt}$, differentiation gives $P'=kP$ and hence the constant relative rate $k$.

For $P(t)=80e^{0.03t}$ with time in days, the instantaneous fractional rate is $0.03$ per day, often expressed as three percent per day instantaneously. At $t=0$, the absolute rate is $2.4$ units per day. The exact one-day multiplicative factor is $e^{0.03}$, so the one-day percentage increase is $100(e^{0.03}-1)$, slightly larger than three percent. An instantaneous percentage and a finite-interval percentage coincide only as an approximation for small increments.

A negative $k$ models decay. If $Q(t)=Q_0e^{-ct}$ with $c>0$, then $Q'=-cQ$. The quantity remains positive while decreasing, and the negative derivative describes change rather than a negative amount. A half-life $T$ satisfies $e^{-cT}=1/2$, so $T=\ln2/c$. A doubling time for positive growth similarly satisfies $T=\ln2/k$. These times depend on the relative rate, not on the starting amount in this particular model.

Relative rates need not be constant. For $P(t)=(t+1)^2$ on $t>-1$, we obtain $P'/P=2/(t+1)$. The amount and its absolute derivative increase for positive time, while its relative rate decreases. This example separates three different comparisons: value, absolute rate, and fractional rate.

Modeling requires a domain and a reason to use the formula. Verifying $P'=kP$ shows a mathematical property of an exponential model; it does not establish that a measured population or workload will obey that model forever. Limited resources, changing conditions, and discreteness can make extrapolation inaccurate. Here we study the mathematical implication of a stated model, leaving full differential-equation modeling to later study.

For a concrete comparison of rates, take $P(t)=(t+1)^2$ at $t=1$ and $t=3$. The amounts are $4$ and $16$, and the absolute rates are $4$ and $8$. The corresponding relative rates are $1$ and $1/2$ per time unit. Thus the later absolute increase is faster but constitutes a smaller fraction of a much larger amount. A sentence such as “growth slowed” is ambiguous unless it identifies which rate is being compared. Logarithmic derivatives make that distinction explicit without changing the underlying quantity.`,
      terms: [
        term(
          'relative-rate',
          'Relative rate of change',
          'Absolute rate divided by current value.',
          R`For a positive differentiable quantity $P$, the relative rate is $P'/P=(\ln P)'$.`,
          R`If $P=80e^{0.03t}$, the relative rate is $0.03$ per time unit.`,
          'An instantaneous relative rate is not an exact finite percentage change.',
        ),
        term(
          'doubling-half-life',
          'Doubling time and half-life',
          'Times to multiply an exponential amount by two or one-half.',
          R`For constant growth rate $k>0$, doubling time is $\ln2/k$; for decay magnitude $c>0$, half-life is $\ln2/c$.`,
          R`The model $P_0e^{-(\ln2)t/5}$ halves every $5$ time units.`,
          'These constant times are properties of the exponential model.',
        ),
      ],
      questions: [
        exact(
          R`For $P(t)=100e^{0.04t}$, find the constant relative rate per time unit.`,
          '1/25',
          R`$P'/P=0.04=1/25$.`,
        ),
        exact(
          R`For $P(t)=100e^{0.04t}$, find $P'(0)$.`,
          4,
          R`$P'=4e^{0.04t}$, so the initial absolute rate is $4$.`,
        ),
        exact(
          R`For $Q(t)=60e^{-t/3}$, find $Q'(0)$.`,
          -20,
          R`The derivative is $-20e^{-t/3}$, giving $-20$ initially.`,
        ),
        exact(
          R`For $Q(t)=60e^{-t/3}$, find its relative rate.`,
          '-1/3',
          R`Dividing $Q'$ by $Q$ cancels the current amount and leaves $-1/3$.`,
        ),
        exact(
          R`A positive quantity is $50$ units and increasing at $2$ units per hour. Find its instantaneous relative rate per hour.`,
          '1/25',
          R`$P'/P=2/50=1/25$.`,
        ),
        exact(
          R`A positive amount is $120$ units with relative rate $-0.05$ per minute. Find its absolute rate in units per minute.`,
          -6,
          R`Multiply relative rate by current amount: $-0.05(120)=-6$.`,
        ),
        expr(
          R`For $P(t)=(t+1)^2$ on $t>-1$, find $P'(t)/P(t)$.`,
          '2/(t+1)',
          R`$P'=2(t+1)$, so the ratio simplifies to $2/(t+1)$.`,
          ['t'],
        ),
        exact(
          R`For $Q(t)=Q_0e^{-(\ln2)t/6}$ with $Q_0>0$, give the half-life in time units.`,
          6,
          R`At $t=6$, the multiplier is $e^{-\ln2}=1/2$.`,
        ),
        open(
          R`Derive the doubling time for $P(t)=P_0e^{kt}$ with $P_0,k>0$.`,
          R`Solve $P_0e^{kT}=2P_0$. Division by $P_0$ gives $e^{kT}=2$; taking logs yields $T=\ln2/k$.`,
        ),
        open(
          R`Explain why a constant instantaneous relative growth rate $0.1$ per year does not mean exactly ten percent growth over a full year.`,
          R`The exponential multiplier over one year is $e^{0.1}$, so the exact fractional increase is $e^{0.1}-1$, not $0.1$. The latter is the first-order approximation as the time increment shrinks.`,
        ),
      ],
      review: [
        exact(
          R`A quantity of $80$ units is decreasing at $12$ units per day. Find its relative rate per day.`,
          '-3/20',
          R`The signed rate is $-12/80=-3/20$.`,
        ),
        exact(
          R`For $P(t)=30e^{t/5}$, find the initial absolute growth rate.`,
          6,
          R`$P'=(30/5)e^{t/5}$, giving $6$ at zero.`,
        ),
        exact(
          R`For $P(t)=P_0e^{(\ln2)t/8}$, give the doubling time.`,
          8,
          R`After $8$ time units the multiplier is $e^{\ln2}=2$.`,
        ),
      ],
    },
    {
      title: 'Mixed formulas and model sensitivities',
      sources: [
        source('3.9', 'Combining exponential/logarithm derivatives with earlier rules.'),
        source('3.6', 'Composition dependencies.'),
        source('3.4', 'Interpreting derivative signs and units.'),
      ],
      body: R`A complicated formula is best read as a hierarchy of operations. Decide whether the outermost operation is a sum, product, quotient, or composition, then differentiate its parts. Exponentials and logarithms do not replace the earlier rules; they supply additional building blocks within them. For $f(x)=x^2e^{-x}$, the product rule gives $f'(x)=2xe^{-x}-x^2e^{-x}=xe^{-x}(2-x)$. The factored form immediately reveals that the positive exponential does not change the derivative's sign.

For $g(x)=\ln x/x$ on $x>0$, the quotient rule gives $g'(x)=[(1/x)x-\ln x]/x^2=(1-\ln x)/x^2$. The numerator controls its sign because the denominator is positive. A sign prediction is a useful reason to keep exact functions rather than rounding logarithms too early. We will turn such sign analysis into an optimization method in later lessons.

An important smooth transformation is the logistic-shaped function $\sigma(x)=1/(1+e^{-x})$. Its denominator is always positive. Differentiating gives $\sigma'(x)=e^{-x}/(1+e^{-x})^2$. Since $1-\sigma=e^{-x}/(1+e^{-x})$, this also equals $\sigma(1-\sigma)$. These are mathematically equivalent forms, and each highlights different information: the first exposes positivity; the second relates the rate to the current output. At zero, $\sigma=1/2$ and $\sigma'=1/4$.

A logarithmic penalty offers a different sensitivity. For $L(p)=-\ln p$ on $0<p\le1$, its derivative on the interior is $-1/p$. The slope is large in magnitude near zero, meaning a small input change can have a large effect on the penalty there. This is a property of the formula, not a general guarantee about the behavior of an entire learning algorithm.

After calculating, check the domain, expected sign, and units. A derivative involving $\ln(1+x)$ requires $x>-1$, even if a later rational simplification seems to accept other values. A correct expression at one test point does not prove two formulas are identical. Use algebraic identities and derivative rules for justification; use selected values only to catch mistakes.

Cancellation inside a composition can make the simplest method especially short. The identity $e^{\ln x}=x$ holds on $x>0$, so its derivative is $1$ there. Direct use of the chain rule gives the same result: $e^{\ln x}/x=x/x=1$. Conversely, $\ln(e^x)=x$ holds for every real $x$, since the exponential output is always positive. Its derivative is again $1$, now on the entire real line. These examples have identical simplified outputs and derivative formulas but different original domain statements. They are a useful check on the habit of simplifying first: retain the domain you started with, and use a mathematically valid identity before deleting a function layer.`,
      terms: [
        term(
          'logistic-sensitivity',
          'Logistic sensitivity',
          'The slope of a bounded exponential transformation.',
          R`For $\sigma(x)=1/(1+e^{-x})$, $\sigma'=\sigma(1-\sigma)=e^{-x}/(1+e^{-x})^2$.`,
          R`$\sigma'(0)=1/4$.`,
          'Equivalent formulas can emphasize different properties without changing the rate.',
        ),
        term(
          'log-penalty',
          'Logarithmic penalty',
          'A logarithm-based quantity sensitive near a zero input.',
          R`For $L(p)=-\ln p$ with $p>0$, $L'(p)=-1/p$.`,
          R`At $p=1/4$, the derivative is $-4$.`,
          'The input must remain positive; zero is not a finite penalty value.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $xe^x$ for real $x$.`,
          'exp(x)*(1+x)',
          R`The product rule gives $e^x+xe^x=e^x(1+x)$.`,
        ),
        calc(
          R`Differentiate $x^2e^{-x}$ for real $x$.`,
          'exp(-x)*(2*x-x^2)',
          R`The two terms are $2xe^{-x}$ and $-x^2e^{-x}$.`,
        ),
        calc(
          R`Differentiate $\ln x/x$ on $x>0$.`,
          '(1-ln(x))/x^2',
          R`The quotient numerator is $1-\ln x$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $e^x\sin x$ with radian arguments.`,
          'exp(x)*(sin(x)+cos(x))',
          R`Both factors change: $e^x\sin x+e^x\cos x$.`,
        ),
        calc(
          R`Differentiate $\ln(1+e^x)$ for real $x$.`,
          'exp(x)/(1+exp(x))',
          R`The logarithm argument is positive, and its derivative is $e^x$.`,
        ),
        calc(
          R`Differentiate $1/(1+e^{-x})$ for real $x$.`,
          'exp(-x)/(1+exp(-x))^2',
          R`The reciprocal's negative sign cancels the derivative sign from $e^{-x}$.`,
        ),
        exact(
          R`Find the derivative of $1/(1+e^{-x})$ at zero.`,
          '1/4',
          R`The formula gives $1/(1+1)^2=1/4$.`,
        ),
        exact(R`For $L(p)=-\ln p$, find $L'(1/4)$.`, -4, R`$L'(p)=-1/p$, giving $-4$.`),
        open(
          R`Show algebraically that $\sigma'(x)=\sigma(x)(1-\sigma(x))$ for $\sigma(x)=1/(1+e^{-x})$.`,
          R`Differentiate to obtain $e^{-x}/(1+e^{-x})^2$. Also $1-\sigma=e^{-x}/(1+e^{-x})$, so multiplication by $\sigma$ yields the identical expression.`,
          'prove',
        ),
        open(
          R`Explain how factoring the derivative of $x^2e^{-x}$ helps analyze the model.`,
          R`The derivative is $xe^{-x}(2-x)$. Since the exponential is positive, only $x$ and $2-x$ determine its sign. On positive inputs the rate is positive before $2$, zero at $2$, and negative after $2$.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $x\ln x$ on $x>0$.`,
          'ln(x)+1',
          R`The product rule gives $\ln x+x(1/x)=\ln x+1$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $e^{2x}/(1+e^{2x})$ for real $x$.`,
          '2*exp(2*x)/(1+exp(2*x))^2',
          R`The quotient numerator simplifies to $2e^{2x}$, with positive squared denominator.`,
        ),
        exact(R`For $L(p)=-\ln p$, find $L'(1/5)$.`, -5, R`Substitute $p=1/5$ into $-1/p$.`),
      ],
    },
  ],
};
