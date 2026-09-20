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
  number: 3,
  slug: 'calculus-differentiation-rules',
  title: 'Differentiation Rules and Trigonometric Functions',
  intro: R`The definition tells us what a derivative means, but expanding a new difference quotient for every calculation would hide the structure of complicated functions. Differentiation rules package valid limit arguments into reusable steps. We first exploit linearity and powers, then learn why products and quotients need extra terms. Trigonometric derivatives add periodic motion to the functions we can analyze. Keep algebra, domain restrictions, and angle units visible: a memorized rule is only useful when applied to the function actually given. This lesson treats sums, products, quotients, and elementary functions; the next lesson handles a function nested inside another function.`,
  sections: [
    {
      title: 'Linearity and the power rule',
      sources: [source('3.3', 'Constant, power, sum, difference and constant-multiple rules.')],
      body: R`For a constant $c$, $(d/dx)c=0$. For a positive integer $n$, the power rule says $(d/dx)x^n=nx^{n-1}$. The coefficient $n$ comes from the first-order term in $(x+h)^n-x^n$; terms containing higher powers of $h$ disappear after division by $h$ and passage to the limit. Thus the rule expresses the same limiting rate already computed for squares and cubes.

Differentiation is linear: $(af+bg)'=af'+bg'$ for constants $a,b$. To see the sum part, split the numerator $f(x+h)+g(x+h)-f(x)-g(x)$ into the two function increments. Dividing by $h$ and taking limits produces $f'+g'$. Constant factors similarly pass through the quotient and its limit. These arguments require the component derivatives to exist at the input under consideration.

As a worked example, let $p(x)=4x^5-3x^2+7x-8$. Applying the rules term by term gives $p'(x)=20x^4-6x+7$. The derivative of the constant is zero, while the derivative of $7x$ is $7$, not zero. At $x=1$ the rate is $21$. A second derivative is another application of the rules: $p''(x)=80x^3-6$. It describes the change in slope rather than repeating the original polynomial's values.

Choose a useful algebraic form before differentiating. For $f(x)=x(x+2)$, expanding gives $x^2+2x$ and hence derivative $2x+2$. This does not justify multiplying derivatives; it uses equality of the original expressions. The next section will supply the genuine product rule. Similarly, a symbol that is constant with respect to one variable may not be constant with respect to another. In $f(x)=ax^2$ with fixed parameter $a$, the derivative is $2ax$. If $a$ itself depends on $x$, this calculation no longer applies unchanged. Naming the independent variable keeps these assumptions clear.`,
      terms: [
        term(
          'power-rule',
          'Power rule',
          'Differentiate a power by multiplying by its exponent.',
          R`$(d/dx)x^n=nx^{n-1}$ at inputs where the stated power is differentiable.`,
          R`$(x^5)'=5x^4$.`,
          'The exponent decreases by one; the function is not divided by its exponent.',
        ),
        term(
          'linearity-differentiation',
          'Linearity of differentiation',
          'Sums and constant factors pass through differentiation.',
          R`$(af+bg)'=af'+bg'$ for fixed real constants $a,b$.`,
          R`$(3x^2-5x)'=6x-5$.`,
          'Linearity is not a rule for products of variable functions.',
        ),
      ],
      questions: [
        expr(R`Differentiate $x^7$.`, '7*x^6', R`The power rule gives $7x^6$.`),
        expr(R`Differentiate $5x^4-2x+9$.`, '20*x^3-2', R`Differentiate each term: $20x^3-2+0$.`),
        expr(
          R`Differentiate $(x+2)(x-2)$ by expanding first.`,
          '2*x',
          R`The original product is $x^2-4$, whose derivative is $2x$.`,
        ),
        exact(R`For $p(x)=x^4-3x^2$, find $p'(2)$.`, 20, R`$p'=4x^3-6x$, giving $32-12=20$.`),
        expr(
          R`Find the second derivative of $x^5-2x^3+4$.`,
          '20*x^3-12*x',
          R`The first derivative is $5x^4-6x^2$; differentiating again gives $20x^3-12x$.`,
        ),
        exact(
          R`Find the third derivative of $2x^3-5x^2+8$.`,
          12,
          R`The successive derivatives are $6x^2-10x$, $12x-10$, and $12$.`,
        ),
        expr(
          R`Differentiate $ax^2+bx+c$ with respect to $x$, where $a,b,c$ are constants.`,
          '2*a*x+b',
          R`Constants factor out, giving $2ax+b$.`,
          ['x', 'a', 'b', 'c'],
        ),
        exact(
          R`If $f'(2)=3$ and $g'(2)=-4$, find $(5f-2g)'(2)$.`,
          23,
          R`Linearity gives $5(3)-2(-4)=23$.`,
        ),
        open(
          R`Prove the constant-multiple rule using the difference quotient.`,
          R`For fixed $c$, $[cf(x+h)-cf(x)]/h=c[f(x+h)-f(x)]/h$. Taking the limit gives $(cf)'=cf'$.`,
          'prove',
        ),
        open(
          R`Explain why differentiating $x^2+x$ as $2x+1$ does not imply a rule $(fg)'=f'g'$.`,
          R`The numerator for a sum splits into a sum of increments. A product's increment contains contributions from changes in either factor. The claimed product rule already fails for $f=g=x$: the product derivative is $2x$, while $f'g'=1$.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $3x^6+x^2-11$.`,
          '18*x^5+2*x',
          R`The power and sum rules give $18x^5+2x$.`,
        ),
        exact(
          R`For $f(x)=x^3+2x$, calculate $f''(-2)$.`,
          -12,
          R`$f'=3x^2+2$ and $f''=6x$, giving $-12$.`,
        ),
        exact(R`If $u'(1)=-2$ and $v'(1)=5$, find $(3u+4v)'(1)$.`, 14, R`$3(-2)+4(5)=14$.`),
      ],
    },
    {
      title: 'Negative and fractional powers',
      sources: [
        source('3.3', 'Negative integer powers and derivative rules.'),
        source('3.7', 'Rational-power differentiation and domain limitations.'),
      ],
      body: R`The same power-rule formula extends beyond positive integers, but its domain matters. Write $1/x^m=x^{-m}$ for $x\ne0$. Then $(x^{-m})'=-mx^{-m-1}$. For example, $(4/x^3)'=(4x^{-3})'=-12x^{-4}=-12/x^4$. The negative exponent is part of the exponent multiplied into the coefficient, so it changes the derivative's sign.

Roots can also be written as powers. On $x>0$, $(\sqrt{x})'=(x^{1/2})'=(1/2)x^{-1/2}=1/(2\sqrt{x})$. More generally, for a rational exponent $r$, $(x^r)'=rx^{r-1}$ wherever the corresponding real function is differentiable. Restricting to $x>0$ gives one common domain on which all the rational powers used here are unambiguous. Odd roots can sometimes be extended to negative inputs, but that requires using the real-root interpretation consistently rather than a calculator's complex-power convention.

Consider $f(x)=3\sqrt{x}+2/x$ on $x>0$. Rewrite it as $3x^{1/2}+2x^{-1}$, then differentiate to get $f'(x)=3/(2\sqrt{x})-2/x^2$. At $x=4$, this gives $3/4-1/8=5/8$. Keeping exact fractions makes the combination transparent and avoids rounding errors in a quantity that may later be used as an answer itself.

A formula with a vanishing denominator at a boundary does not automatically settle differentiability at that boundary. Return to the definition. For $f(x)=x^{2/3}$ on the real line, the derivative formula is $(2/3)x^{-1/3}$ away from zero; the difference quotient at zero is $h^{-1/3}$, unbounded with opposite signs. For $x^{4/3}$, the quotient at zero is $h^{1/3}\to0$, so a derivative does exist there despite the fractional exponent. The exponent and domain together determine the behavior. Do not treat every root as having the same singularity as a square root.`,
      terms: [
        term(
          'fractional-power-derivative',
          'Fractional-power derivative',
          'The power rule with explicit real-domain conditions.',
          R`For rational $r$, $(x^r)'=rx^{r-1}$ wherever the real power is differentiable.`,
          R`For $x>0$, $(x^{3/2})'=(3/2)\sqrt{x}$.`,
          'Endpoints and negative inputs require checking the real domain.',
        ),
      ],
      questions: [
        expr(
          R`Differentiate $x^{-3}$ on $x\ne0$.`,
          '-3/x^4',
          R`Multiply by $-3$ and lower the exponent to $-4$.`,
        ),
        expr(
          R`Differentiate $2/x-5/x^2$ on $x\ne0$.`,
          '-2/x^2+10/x^3',
          R`Rewrite as $2x^{-1}-5x^{-2}$ and apply the power rule.`,
        ),
        calc(
          R`Differentiate $\sqrt{x}$ on $x>0$.`,
          '1/(2*sqrt(x))',
          R`The power rule with exponent $1/2$ gives $1/(2\sqrt{x})$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $x^{3/2}$ on $x>0$.`,
          '3*sqrt(x)/2',
          R`The exponent becomes $1/2$, giving $(3/2)\sqrt{x}$.`,
          { positive: ['x'] },
        ),
        calc(
          R`Differentiate $1/\sqrt{x}$ on $x>0$.`,
          '-1/(2*x^(3/2))',
          R`Write $x^{-1/2}$; the derivative is $-(1/2)x^{-3/2}$.`,
          { positive: ['x'] },
        ),
        exact(R`For $f(x)=4/x^2$, find $f'(2)$.`, -1, R`$f'=-8/x^3$, so $f'(2)=-8/8=-1$.`),
        exact(
          R`For $f(x)=x^{3/2}$ on positive inputs, find $f'(4)$.`,
          3,
          R`$f'=(3/2)\sqrt{x}$, giving $(3/2)(2)=3$.`,
        ),
        exact(
          R`Using the real cube root, find the derivative of $x^{4/3}$ at zero from its difference quotient.`,
          0,
          R`The quotient is $h^{1/3}$, which tends to $0$.`,
        ),
        open(
          R`Explain why the derivative formula for $\sqrt{x}$ on $x>0$ does not give a finite derivative at zero.`,
          R`The formula is undefined at zero, and the right-hand quotient there is $\sqrt{h}/h=1/\sqrt{h}\to\infty$. Thus even the one-sided finite derivative fails.`,
        ),
        open(
          R`Derive the rule for $(1/x)'$ independently from the difference quotient.`,
          R`For $x\ne0$ and sufficiently small nonzero $h$, $[1/(x+h)-1/x]/h=-1/[x(x+h)]\to-1/x^2$.`,
          'prove',
        ),
      ],
      review: [
        expr(
          R`Differentiate $7/x^4$ on $x\ne0$.`,
          '-28/x^5',
          R`Write $7x^{-4}$ and differentiate to obtain $-28x^{-5}$.`,
        ),
        exact(R`Find the derivative of $\sqrt{x}$ at $x=16$.`, '1/8', R`$1/(2\sqrt{16})=1/8$.`),
        calc(
          R`Differentiate $x^{5/2}-\sqrt{x}$ on $x>0$.`,
          '5*x^(3/2)/2-1/(2*sqrt(x))',
          R`Differentiate the two powers: $(5/2)x^{3/2}-(1/2)x^{-1/2}$.`,
          { positive: ['x'] },
        ),
      ],
    },
    {
      title: 'Products have two contributions',
      sources: [source('3.3', 'Product rule and its proof.')],
      body: R`If $f$ and $g$ are differentiable, their product satisfies $(fg)'=f'g+fg'$. Each term captures one factor's first-order change while retaining the other factor's value. This is why the derivative of a product is generally not the product of derivatives. Even the simple product $x\cdot x=x^2$ exposes that mistake: multiplying the two derivatives would give $1$, while the actual derivative is $2x$.

To see the source of the two terms, insert and subtract $f(x+h)g(x)$ in the product increment. After grouping and dividing by $h$, the quotient becomes

$f(x+h)\dfrac{g(x+h)-g(x)}{h}+g(x)\dfrac{f(x+h)-f(x)}{h}$.

Because differentiability implies continuity, $f(x+h)\to f(x)$. Taking limits gives $fg'+gf'$, the same product rule with its terms written in reverse order. The proof uses values as well as rates, so both pieces of data matter in a table-based problem.

For $p(x)=(x^2+1)(x^3-2)$, differentiate the two factors separately: $p'(x)=2x(x^3-2)+(x^2+1)3x^2$. This factored expression is already a complete derivative. Expanding it gives $5x^4+3x^2-4x$, which can serve as an independent algebraic check by first expanding $p=x^5+x^3-2x^2-2$. A shorter answer is not inherently more correct than a factored one.

The rule extends to three factors by treating two of them as a single function and applying the rule twice: $(fgh)'=f'gh+fg'h+fgh'$. Every term differentiates exactly one factor. In applications a quantity such as revenue $p(q)q$ contains both a changing price and changing quantity. Its derivative is $p'(q)q+p(q)$, not merely the current price. The extra term records the effect of the price change on all units in the continuous model.

There is also a geometric way to remember the product rule. Let the sides of a rectangle be $f(x)$ and $g(x)$ at the input of interest. A small input increment changes both sides. The area change splits into a strip along one side, a strip along the other, and a small corner. The strips contribute approximately $g(x)f'(x)h$ and $f(x)g'(x)h$. The corner involves the product of two small side changes, so after dividing by $h$ it vanishes in the differentiable limit. This picture explains the two terms and why there is no surviving $f'g'$ term in the first derivative. The algebraic proof is still needed for functions whose values are negative, since signed function values are not literal side lengths.`,
      terms: [
        term(
          'product-rule',
          'Product rule',
          'Differentiate each factor once and add the contributions.',
          R`$(fg)'=f'g+fg'$ for differentiable factors.`,
          R`$[(x^2+1)x]'=2x\cdot x+(x^2+1)$.`,
          'The derivative of a product is not the product of derivatives.',
        ),
      ],
      questions: [
        expr(
          R`Differentiate $(x^2+3)(x-1)$.`,
          '3*x^2-2*x+3',
          R`The product rule gives $2x(x-1)+(x^2+3)=3x^2-2x+3$.`,
        ),
        expr(
          R`Differentiate $(x^3+1)(x^2-2)$.`,
          '3*x^2*(x^2-2)+2*x*(x^3+1)',
          R`Differentiate each factor in turn, retaining the other factor.`,
        ),
        expr(
          R`Differentiate $x^2(1+1/x)$ on $x\ne0$.`,
          '2*x+1',
          R`Expanding first gives $x^2+x$ on the original domain; its derivative is $2x+1$.`,
        ),
        exact(
          R`If $f(2)=3,f'(2)=4,g(2)=-1,g'(2)=5$, find $(fg)'(2)$.`,
          11,
          R`$f'g+fg'=4(-1)+3(5)=-4+15=11$.`,
        ),
        exact(
          R`If $u(0)=0,u'(0)=2,v(0)=7,v'(0)=3$, find $(uv)'(0)$.`,
          14,
          R`$2(7)+0(3)=14$. A zero product value need not have zero derivative.`,
        ),
        expr(
          R`Differentiate $x(x+1)(x-2)$.`,
          '3*x^2-2*x-2',
          R`Expanding yields $x^3-x^2-2x$; its derivative is $3x^2-2x-2$.`,
        ),
        expr(
          R`A price model is $p(q)=20-q$. Differentiate revenue $R(q)=q(20-q)$.`,
          '20-2*q',
          R`The product rule gives $(20-q)+q(-1)=20-2q$.`,
          ['q'],
        ),
        exact(
          R`For $R(q)=q(20-q)$, find marginal revenue at $q=6$.`,
          8,
          R`$R'(q)=20-2q$, so $R'(6)=8$.`,
        ),
        open(
          R`Derive the three-factor product rule from the two-factor rule.`,
          R`Treat $fg$ as one factor: $[(fg)h]'=(fg)'h+(fg)h'=(f'g+fg')h+fgh'=f'gh+fg'h+fgh'$.`,
          'prove',
        ),
        open(
          R`Explain why knowing only $f'(a)$ and $g'(a)$ is usually insufficient to calculate $(fg)'(a)$.`,
          R`The product rule also requires $f(a)$ and $g(a)$. Functions differing by constants can have the same derivatives but different product derivatives because their values multiply the other rate.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $(x^2-4)(x+3)$.`,
          '3*x^2+6*x-4',
          R`The rule gives $2x(x+3)+(x^2-4)=3x^2+6x-4$.`,
        ),
        exact(
          R`Given $f(1)=-2,f'(1)=3,g(1)=4,g'(1)=-1$, calculate $(fg)'(1)$.`,
          14,
          R`$3(4)+(-2)(-1)=14$.`,
        ),
        expr(
          R`Differentiate $x^2(x^3+5)$.`,
          '5*x^4+10*x',
          R`Either expand or use $2x(x^3+5)+3x^4=5x^4+10x$.`,
        ),
      ],
      quickCheck: qc(
        R`Which is the derivative of $u(x)v(x)$?`,
        [R`$u'v'$`, R`$u'v+uv'$`, R`$u'+v'$`],
        1,
        'A change in either factor changes the product, producing two first-order contributions.',
      ),
    },
    {
      title: 'Quotients and algebraic checks',
      sources: [source('3.3', 'Quotient rule and denominator restrictions.')],
      body: R`For differentiable $f,g$ with $g(x)\ne0$, the quotient rule is $(f/g)'=(f'g-fg')/g^2$. Its order matters: derivative of the numerator times denominator, minus numerator times derivative of denominator. Reversing the subtraction reverses the answer. The denominator is squared, but squaring does not remove the original restriction that $g$ be nonzero.

One way to derive the rule is to write $q=f/g$, so $f=qg$ on the domain under consideration. The product rule gives $f'=q'g+qg'$. Solving for $q'$ gives $q'=f'/g-fg'/g^2=(f'g-fg')/g^2$. The division used here explains the nonzero-denominator condition rather than treating it as a separate memorization item.

For $q(x)=(x^2+1)/(x-2)$, the numerator of its derivative is $2x(x-2)-(x^2+1)=x^2-4x-1$. Thus $q'(x)=(x^2-4x-1)/(x-2)^2$ for $x\ne2$. At zero this gives $-1/4$. Parentheses around the full subtracted product are essential: the minus sign affects both terms of $x^2+1$.

Sometimes division before differentiation produces a simpler calculation. Since $(x^2+1)/x=x+1/x$ for $x\ne0$, its derivative is $1-1/x^2$. The quotient rule yields $(2x\cdot x-(x^2+1))/x^2$, which simplifies to the same expression. Comparing these independent forms can catch a sign or missing-factor error.

Domain restrictions survive cancellation. The original function $(x^2-1)/(x-1)$ is undefined at $1$, even though it agrees with $x+1$ elsewhere. Its derivative is $1$ on the original domain, but that derivative statement does not define an original function value or derivative at the missing point. If we explicitly extend the function continuously, we obtain a different domain and can then differentiate the extension. In a solution, separate simplifying the formula from extending the function.

A ratio can change even when both its numerator and denominator are increasing. Suppose at an input $a$ we know $f(a)=6$, $f'(a)=1$, $g(a)=3$, and $g'(a)=2$. Then the quotient derivative is $(1\cdot3-6\cdot2)/3^2=-1$. The denominator grows quickly enough relative to its current size to make the ratio decrease. This example also shows why table-based quotient problems need the two values as well as the two derivatives. The separate facts that both rates are positive do not determine the sign of their quotient's rate.`,
      terms: [
        term(
          'quotient-rule',
          'Quotient rule',
          'A difference of cross-products over the squared denominator.',
          R`$(f/g)'=(f'g-fg')/g^2$ where $g\ne0$.`,
          R`$[(x+1)/x]'=-1/x^2$.`,
          'The subtraction order and original denominator restriction both matter.',
        ),
      ],
      questions: [
        expr(
          R`Differentiate $(x+2)/(x-1)$ for $x\ne1$.`,
          '-3/(x-1)^2',
          R`The numerator is $(x-1)-(x+2)=-3$.`,
        ),
        expr(
          R`Differentiate $x^2/(x+1)$ for $x\ne-1$.`,
          '(x^2+2*x)/(x+1)^2',
          R`The quotient numerator is $2x(x+1)-x^2=x^2+2x$.`,
        ),
        expr(
          R`Differentiate $(x^2-3)/x$ for $x\ne0$.`,
          '1+3/x^2',
          R`Rewrite as $x-3/x$, giving $1+3/x^2$.`,
        ),
        expr(
          R`Differentiate $1/(x^2+1)$.`,
          '-2*x/(x^2+1)^2',
          R`The numerator is $0(x^2+1)-1(2x)$; the denominator is always positive.`,
        ),
        exact(
          R`If $f(1)=2,f'(1)=3,g(1)=4,g'(1)=5$, find $(f/g)'(1)$.`,
          '1/8',
          R`$[3(4)-2(5)]/4^2=2/16=1/8$.`,
        ),
        exact(
          R`For $q(x)=(x^2+1)/(x+2)$, find $q'(0)$.`,
          '-1/4',
          R`The numerator at zero is $0(2)-1(1)=-1$ and the squared denominator is $4$.`,
        ),
        expr(
          R`Differentiate $(x^3-x)/(x-1)$ on its original domain $x\ne1$.`,
          '2*x+1',
          R`Cancel to obtain $x(x+1)=x^2+x$ for $x\ne1$, then differentiate.`,
        ),
        bool(
          R`Does canceling $x-1$ from $(x^2-1)/(x-1)$ make the original function differentiable at $1$?`,
          false,
          R`The original domain still excludes $1$. An explicit extension is needed before discussing its derivative there.`,
        ),
        open(
          R`Derive the quotient rule by differentiating $f=qg$ and solving for $q'$.`,
          R`The product rule gives $f'=q'g+qg'$. Since $g\ne0$, $q'=(f'-qg')/g=f'/g-fg'/g^2=(f'g-fg')/g^2$.`,
          'prove',
        ),
        open(
          R`Check the derivative of $(x^2+4)/x$ by two algebraically different methods.`,
          R`Rewriting gives $x+4/x$, whose derivative is $1-4/x^2$. The quotient rule gives $[2x^2-(x^2+4)]/x^2=(x^2-4)/x^2$, equal on $x\ne0$.`,
        ),
      ],
      review: [
        expr(
          R`Differentiate $(2x-1)/(x+4)$ for $x\ne-4$.`,
          '9/(x+4)^2',
          R`The quotient numerator is $2(x+4)-(2x-1)=9$.`,
        ),
        exact(
          R`Given $u(2)=6,u'(2)=-1,v(2)=3,v'(2)=2$, find $(u/v)'(2)$.`,
          '-5/3',
          R`$[(-1)(3)-6(2)]/9=-15/9=-5/3$.`,
        ),
        expr(
          R`Differentiate $x/(x^2+2)$.`,
          '(2-x^2)/(x^2+2)^2',
          R`The numerator is $(x^2+2)-2x^2=2-x^2$.`,
        ),
      ],
    },
    {
      title: 'Trigonometric derivatives and radians',
      sources: [
        source(
          '3.5',
          'Radian limits, sine/cosine derivatives and all six elementary trigonometric derivatives.',
        ),
      ],
      body: R`When angles are measured in radians, $(\sin x)'=\cos x$ and $(\cos x)'=-\sin x$. Radians are essential because the underlying small-angle limit is $\lim_{h\to0}\sin h/h=1$ in radian measure. A degree-valued input changes the scale of the derivative; the unmodified formulas do not apply to it. This is a unit issue, not a calculator preference.

For sine, the addition formula rewrites the difference quotient as $\sin x(\cos h-1)/h+\cos x\sin h/h$. The first small-angle limit is zero and the second is one, giving $\cos x$. The cosine addition formula similarly supplies the negative sine derivative. The sign agrees with the graph: cosine decreases just to the right of zero, where sine is positive.

The other four formulas follow from reciprocals and quotients: $(\tan x)'=\sec^2x$, $(\cot x)'=-\csc^2x$, $(\sec x)'=\sec x\tan x$, and $(\csc x)'=-\csc x\cot x$. For example, differentiating $\sin x/\cos x$ gives $(\cos^2x+\sin^2x)/\cos^2x=1/\cos^2x$. The identity $\sin^2x+\cos^2x=1$ simplifies the result. Tangent and secant require $\cos x\ne0$; cotangent and cosecant require $\sin x\ne0$.

Combine these formulas with the earlier rules. For $f(x)=x\sin x$, the derivative is $\sin x+x\cos x$. At zero it equals zero. For $g(x)=\sin x/x$, the derivative is $(x\cos x-\sin x)/x^2$ on $x\ne0$. That formula does not settle a derivative of an extension at zero; an additional limit calculation would be needed.

Successive sine derivatives cycle through $\cos x,-\sin x,-\cos x,\sin x$. Thus if a displacement is $s(t)=3\cos t$ with its argument in radians, acceleration is $s''(t)=-3\cos t=-s(t)$. This expresses a specific mathematical oscillation model, not a claim that every periodic motion obeys the same law.`,
      terms: [
        term(
          'radian-derivatives',
          'Radian trigonometric derivatives',
          'Standard trigonometric rates assume radian input.',
          R`$(\sin x)'=\cos x$ and $(\cos x)'=-\sin x$ with angles in radians.`,
          R`The slope of $\sin x$ at $0$ is $1$.`,
          'Degree input introduces a conversion factor.',
        ),
        term(
          'reciprocal-trigonometric-functions',
          'Reciprocal trigonometric functions',
          'Secant and cosecant are reciprocals.',
          R`$\sec x=1/\cos x$, $\csc x=1/\sin x$, and $\cot x=\cos x/\sin x$ on their domains.`,
          R`$(\sec x)'=\sec x\tan x$.`,
          'Reciprocal functions are not inverse functions such as arcsine.',
        ),
      ],
      questions: [
        calc(
          R`Differentiate $3\sin x-2\cos x$, with $x$ in radians.`,
          '3*cos(x)+2*sin(x)',
          R`Linearity gives $3\cos x+2\sin x$.`,
        ),
        calc(
          R`Differentiate $x\cos x$, with $x$ in radians.`,
          'cos(x)-x*sin(x)',
          R`The product rule gives $\cos x+x(-\sin x)$.`,
        ),
        calc(
          R`Differentiate $\tan x$ where $\cos x\ne0$, using radians.`,
          'sec(x)^2',
          R`The quotient rule applied to $\sin x/\cos x$ gives $1/\cos^2x=\sec^2x$.`,
          { nonzero: ['cos(x)'] },
        ),
        calc(
          R`Differentiate $\cot x$ where $\sin x\ne0$, using radians.`,
          '-csc(x)^2',
          R`The quotient numerator is $-\sin^2x-\cos^2x=-1$.`,
          { nonzero: ['sin(x)'] },
        ),
        calc(
          R`Differentiate $\sec x$ where $\cos x\ne0$, using radians.`,
          'sec(x)*tan(x)',
          R`Differentiating $1/\cos x$ gives $\sin x/\cos^2x=\sec x\tan x$.`,
          { nonzero: ['cos(x)'] },
        ),
        calc(
          R`Differentiate $\csc x$ where $\sin x\ne0$, using radians.`,
          '-csc(x)*cot(x)',
          R`Differentiating $1/\sin x$ gives $-\cos x/\sin^2x$.`,
          { nonzero: ['sin(x)'] },
        ),
        exact(R`For $f(x)=\sin x$, find $f'(\pi)$ using radians.`, -1, R`$f'(\pi)=\cos\pi=-1$.`),
        calc(
          R`Find the second derivative of $2\cos x+\sin x$, with radian input.`,
          '-2*cos(x)-sin(x)',
          R`The first derivative is $-2\sin x+\cos x$; the next is $-2\cos x-\sin x$.`,
        ),
        open(
          R`Derive $(\tan x)'$ from the quotient rule and state its domain restriction.`,
          R`With $\cos x\ne0$, $(\tan x)'=(\cos^2x+\sin^2x)/\cos^2x=\sec^2x$. The original and derivative expressions both require a nonzero cosine.`,
          'prove',
        ),
        open(
          R`Why would an unmodified derivative formula for a radian sine function be wrong for an input explicitly measured in degrees?`,
          R`One degree represents $\pi/180$ radians, so the independent variable changes the input scale. A unit degree increment is not a unit radian increment. The derivative with respect to degree input must account for that conversion; the next lesson's chain rule supplies the factor.`,
        ),
      ],
      review: [
        calc(
          R`Differentiate $x^2\sin x$ with radian input.`,
          '2*x*sin(x)+x^2*cos(x)',
          R`The two product-rule contributions are $2x\sin x$ and $x^2\cos x$.`,
        ),
        exact(R`For $f(x)=\cos x$, find $f'(\pi/2)$.`, -1, R`$f'=-\sin x$, so $f'(\pi/2)=-1$.`),
        calc(
          R`Differentiate $\sin x/x$ for $x\ne0$, with radian input.`,
          '(x*cos(x)-sin(x))/x^2',
          R`The quotient rule gives numerator $x\cos x-\sin x$ over $x^2$.`,
          { nonzero: ['x'] },
        ),
      ],
      quickCheck: qc(
        R`Why is $d(\cos x)/dx=-\sin x$ stated with radian input?`,
        [
          'Radians determine the input scale used by the small-angle limits',
          'Degrees cannot describe angles',
          'The derivative changes only at right angles',
        ],
        0,
        'A derivative measures output change per input unit. Changing angle units changes that scale.',
      ),
    },
  ],
};
