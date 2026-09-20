import { r, source, term, n, e, a, t, o, qc } from './integration-helpers.mjs';
const parts = source(
  2,
  3,
  1,
  'Integration by Parts',
  'Product-rule derivation, definite integration by parts, and repeated applications.',
);
const fractions = source(
  2,
  3,
  4,
  'Partial Fractions',
  'Polynomial division, distinct and repeated linear factors, and irreducible quadratic factors.',
);
const trig = source(
  2,
  3,
  2,
  'Trigonometric Integrals',
  'Odd powers, even-power identities, and tangent/secant patterns.',
);
const trigsub = source(
  2,
  3,
  3,
  'Trigonometric Substitution',
  'Radical substitutions and restrictions ensuring the correct square-root sign.',
);
export default {
  number: 11,
  slug: 'calculus-integration-techniques',
  title: 'Basic Integration Techniques',
  intro: r`Differentiation follows a short collection of rules in a predictable order; integration requires recognizing which derivative pattern could have produced the expression. Substitution reverses composition, integration by parts reverses a product, and partial fractions rewrites a rational function into recognizable pieces. Trigonometric identities and substitutions supply additional rewrites. The aim is a small usable toolkit, with a reason for each choice and a derivative check at the end.`,
  sections: [
    {
      title: 'Integration by parts',
      sources: [parts],
      terms: [
        term(
          'integration-by-parts',
          'Integration by parts',
          'The product rule read in reverse.',
          r`$\int u\,dv=uv-\int v\,du$, where $du=u'\,dx$ and $dv=v'\,dx$.`,
          r`$\int xe^x\,dx=xe^x-e^x+C$.`,
          'The remaining integral must be evaluated; the product alone is not an answer.',
        ),
      ],
      body: r`The product rule says $(uv)'=u'v+uv'$. Integrating and rearranging gives $\int uv'\,dx=uv-\int vu'\,dx$, usually written $\int u\,dv=uv-\int v\,du$. The notation $dv$ contains both a derivative factor and its differential. Choosing $u$ and $dv$ is a mathematical decision: we want differentiation to simplify $u$ and integration of $dv$ to be feasible.

For $\int xe^x\,dx$, choose $u=x$ and $dv=e^x\,dx$. Then $du=dx$ and $v=e^x$. The formula gives $xe^x-\int e^x\,dx=xe^x-e^x+C$. Differentiating the result produces $e^x+xe^x-e^x=xe^x$. The two extra terms cancel because the method reversed the product rule.

A function can be regarded as a product with $1$. For $\int\ln x\,dx$ on $x>0$, choose $u=\ln x$, $dv=dx$. Then $du=dx/x$ and $v=x$, giving $x\ln x-\int1\,dx=x\ln x-x+C$. The logarithm becomes easier under differentiation, while its direct antiderivative was not previously known. This explains the choice instead of requiring a mnemonic.

Polynomial factors may need repeated applications. For $\int x^2e^x\,dx$, the first pass gives $x^2e^x-2\int xe^x\,dx$. Substituting the earlier result gives $e^x(x^2-2x+2)+C$. Each pass reduces the polynomial degree. Choosing the exponential as $u$ instead would increase the polynomial degree in the remaining integral and usually move away from a solution.

For definite integrals, keep the endpoint term: $\int_a^b u v'\,dx=[uv]_a^b-\int_a^bvu'\,dx$. Thus $\int_0^1xe^x\,dx=[xe^x]_0^1-[e^x]_0^1=e-(e-1)=1$. There is no arbitrary constant in this number. Sometimes integration by parts produces the original integral again; then collect that integral algebraically rather than repeating the method indefinitely. The key question after each pass is whether the new equation is simpler or solvable.`,
      questions: [
        a(
          r`Find the general antiderivative of $xe^x$ on $\mathbb R$.`,
          'x*exp(x)',
          '(x-1)*exp(x)+C',
          r`With $u=x$ and $dv=e^x dx$, obtain $xe^x-e^x+C$.`,
        ),
        a(
          r`Find the general antiderivative of $x\cos x$ on $\mathbb R$.`,
          'x*cos(x)',
          'x*sin(x)+cos(x)+C',
          r`Take $u=x$, $v=\sin x$: $x\sin x-\int\sin x\,dx=x\sin x+\cos x+C$.`,
        ),
        a(
          r`Find the general antiderivative of $x\sin x$ on $\mathbb R$.`,
          'x*sin(x)',
          '-x*cos(x)+sin(x)+C',
          r`Take $u=x$, $v=-\cos x$, giving $-x\cos x+\sin x+C$.`,
        ),
        a(
          r`Find the general antiderivative of $\ln x$ on $(0,\infty)$.`,
          'ln(x)',
          'x*ln(x)-x+C',
          r`Use $u=\ln x$, $dv=dx$; the remaining integral is $\int1dx$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $x\ln x$ on $(0,\infty)$.`,
          'x*ln(x)',
          'x^2*ln(x)/2-x^2/4+C',
          r`Take $u=\ln x$, $v=x^2/2$, giving $(x^2/2)\ln x-(1/2)\int xdx$.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $x^2e^x$ on $\mathbb R$.`,
          'x^2*exp(x)',
          'exp(x)*(x^2-2*x+2)+C',
          r`Two passes of parts lower the polynomial degree: $x^2e^x-2(xe^x-e^x)+C$.`,
        ),
        n(r`Evaluate $\int_0^1xe^x\,dx$.`, '1', r`$[(x-1)e^x]_0^1=0-(-1)=1$.`),
        n(r`Evaluate $\int_0^\pi x\sin x\,dx$.`, 'pi', r`$[-x\cos x+\sin x]_0^\pi=\pi$.`),
        o(
          r`Derive the integration-by-parts formula from the product rule.`,
          r`Integrate $(uv)'=u'v+uv'$ to get $uv=\int u'v\,dx+\int uv'\,dx$, up to an additive constant absorbed in the final indefinite answer. Rearranging gives $\int uv'\,dx=uv-\int vu'\,dx$.`,
          'prove',
        ),
        o(
          r`Explain why choosing $u=e^x$ for $\int x^2e^x\,dx$ is usually less useful than choosing $u=x^2$.`,
          r`Differentiating $e^x$ does not simplify it, while integrating $x^2$ raises the degree. The remaining integral contains $x^3e^x$. Choosing the polynomial as $u$ instead lowers its degree and eventually reaches an elementary exponential integral.`,
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $xe^{2x}$ on $\mathbb R$.`,
          'x*exp(2*x)',
          'exp(2*x)*(x/2-1/4)+C',
          r`Use $v=e^{2x}/2$; then integrate the remaining $e^{2x}/2$ to get $e^{2x}/4$.`,
        ),
        a(
          r`Find the general antiderivative of $\arctan x$ on $\mathbb R$.`,
          'atan(x)',
          'x*atan(x)-ln(1+x^2)/2+C',
          r`Parts gives $x\arctan x-\int x/(1+x^2)dx=x\arctan x-\tfrac12\ln(1+x^2)+C$.`,
          { positive: ['1+x^2'] },
        ),
        n(r`Evaluate $\int_1^e\ln x\,dx$.`, '1', r`$[x\ln x-x]_1^e=0-(-1)=1$.`),
      ],
      quickCheck: qc(
        r`For $\int x\ln x\,dx$, which choice makes the remaining integral simpler?`,
        [r`$u=\ln x,\ dv=x\,dx$`, r`$u=x,\ dv=\ln x\,dx$`],
        0,
        r`The first choice differentiates the logarithm to $1/x$ and integrates the polynomial directly.`,
      ),
    },
    {
      title: 'Rational functions and partial fractions',
      sources: [fractions],
      terms: [
        term(
          'partial-fractions',
          'Partial fractions',
          'Decomposing a rational function into simpler rational terms.',
          r`After division if necessary, factor the denominator and solve a polynomial identity for the decomposition coefficients.`,
          r`$1/[x(x+1)]=1/x-1/(x+1)$.`,
          'One fraction does not split by dividing its numerator separately by the denominator terms.',
        ),
      ],
      body: r`A rational function is a quotient of polynomials. Before integrating, compare their degrees. If the numerator degree is at least the denominator degree, polynomial division separates a polynomial part from a proper rational remainder. For example, $(x^2+1)/(x+1)=x-1+2/(x+1)$. On $x>-1$, its antiderivative is $x^2/2-x+2\ln(x+1)+C$.

For a proper fraction with distinct linear factors, assign one constant numerator to each factor. To decompose $1/[x(x+2)]$, write $A/x+B/(x+2)$. Multiplying by the common denominator gives the identity $1=A(x+2)+Bx$. At $x=0$, $A=1/2$; at $x=-2$, $B=-1/2$. Consequently the antiderivative is $\tfrac12\ln|x|-\tfrac12\ln|x+2|+C$ on any interval avoiding both poles.

The coefficient equation is a polynomial identity, so evaluating it at a root of the old denominator is legitimate after clearing denominators. The original rational function remains undefined there. This distinction explains a useful calculation step without erasing the domain restriction from the integral.

Repeated factors need all powers. A denominator $(x-a)^2$ can require both $A/(x-a)$ and $B/(x-a)^2$. For example, $(x+1)/x^2=1/x+1/x^2$, which integrates to $\ln|x|-1/x+C$. Omitting the first-power term or the second-power term would make some numerators impossible to represent.

An irreducible quadratic gets a linear numerator. For instance, $(2x+3)/(x^2+1)$ separates naturally into $2x/(x^2+1)+3/(x^2+1)$, yielding $\ln(x^2+1)+3\arctan x+C$. The first part matches a logarithmic derivative; the second matches an inverse tangent. More complicated factorizations use the same principle, but the present goal is confident handling of simple patterns. Recombine any proposed decomposition into a single fraction before integrating, then differentiate the final answer. These independent algebra and calculus checks catch different errors.`,
      questions: [
        n(
          r`In $1/[x(x+1)]=A/x+B/(x+1)$, find $A$.`,
          '1',
          r`Clearing denominators gives $1=A(x+1)+Bx$; at $x=0$, $A=1$.`,
        ),
        n(
          r`In $1/[x(x+1)]=A/x+B/(x+1)$, find $B$.`,
          '-1',
          r`The coefficient of $x$ must vanish, so $A+B=0$. With $A=1$, $B=-1$.`,
        ),
        a(
          r`Find the general antiderivative of $1/[x(x+1)]$ on $(0,\infty)$.`,
          '1/(x*(x+1))',
          'ln(x)-ln(x+1)+C',
          r`Decompose as $1/x-1/(x+1)$, then integrate each logarithmic derivative.`,
          { positive: ['x', 'x+1'] },
        ),
        a(
          r`Find the general antiderivative of $(x+1)/x^2$ on $(0,\infty)$.`,
          '(x+1)/x^2',
          'ln(x)-1/x+C',
          r`Rewrite as $1/x+1/x^2$ and use logarithm plus power rule.`,
          { positive: ['x'] },
        ),
        a(
          r`Find the general antiderivative of $(x^2+1)/(x+1)$ on $(-1,\infty)$.`,
          '(x^2+1)/(x+1)',
          'x^2/2-x+2*ln(x+1)+C',
          r`Division gives $x-1+2/(x+1)$, leading to $x^2/2-x+2\ln(x+1)+C$.`,
          { positive: ['x+1'] },
        ),
        a(
          r`Find the general antiderivative of $(2x+3)/(x^2+1)$ on $\mathbb R$.`,
          '(2*x+3)/(x^2+1)',
          'ln(x^2+1)+3*atan(x)+C',
          r`Split into a logarithmic derivative and $3$ times the inverse-tangent derivative.`,
          { positive: ['x^2+1'] },
        ),
        n(
          r`Evaluate $\int_1^2[1/x-1/(x+1)]\,dx$.`,
          '2*ln(2)-ln(3)',
          r`$[\ln x-\ln(x+1)]_1^2=(\ln2-\ln3)-(-\ln2)$.`,
        ),
        e(
          r`Give the polynomial quotient when $x^3+1$ is divided by $x+1$.`,
          'x^2-x+1',
          r`Multiplying $(x+1)(x^2-x+1)$ recovers $x^3+1$, with no remainder.`,
        ),
        o(
          r`Why must the numerator over an irreducible quadratic be allowed to be linear rather than only constant?`,
          r`A proper remainder over a degree-two factor can have degree one. For example, $x/(x^2+1)$ cannot be represented by $A/(x^2+1)$ with constant $A$. Allowing $Ax+B$ spans both possible numerator coefficients.`,
        ),
        o(
          r`Explain why cancelling $(x-1)$ from $(x^2-1)/(x-1)$ does not authorize ordinary integration across the original hole without comment.`,
          r`The original expression is undefined at $x=1$, whereas the simplified function $x+1$ is defined there. One may explicitly fill the removable hole without changing the bounded integral, but the extension is a stated interpretation, not an algebraic restoration of the original domain.`,
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $1/[x(x+2)]$ on $(0,\infty)$.`,
          '1/(x*(x+2))',
          'ln(x)/2-ln(x+2)/2+C',
          r`The decomposition is $(1/2)/x-(1/2)/(x+2)$.`,
          { positive: ['x', 'x+2'] },
        ),
        a(
          r`Find the general antiderivative of $(3x+2)/x^2$ on $(0,\infty)$.`,
          '(3*x+2)/x^2',
          '3*ln(x)-2/x+C',
          r`Rewrite as $3/x+2/x^2$ and integrate termwise.`,
          { positive: ['x'] },
        ),
        o(
          r`A decomposition of $1/[x(x-1)^2]$ includes only $A/x+B/(x-1)^2$. Explain the missing structural term.`,
          r`The repeated factor requires a term $D/(x-1)$ as well. Including every power up to multiplicity provides enough freedom for the polynomial identity; omitting it is not generally valid.`,
        ),
      ],
    },
    {
      title: 'Products and powers of trigonometric functions',
      sources: [trig],
      terms: [
        term(
          'power-reduction',
          'Power reduction',
          'Replacing even trigonometric powers with lower powers.',
          r`$\sin^2x=(1-\cos2x)/2$ and $\cos^2x=(1+\cos2x)/2$.`,
          r`$\int\sin^2x\,dx=x/2-\sin(2x)/4+C$.`,
          'Squaring a trig function does not permit applying the ordinary power rule directly.',
        ),
      ],
      body: r`A product of trigonometric functions often hides a substitution. For $\int\sin^3x\cos x\,dx$, $u=\sin x$ makes $du=\cos x\,dx$, leaving $\int u^3du$. The result is $\sin^4x/4+C$. This works because the derivative of the chosen inner function is already present, not because trigonometric powers obey the polynomial power rule without a chain factor.

If the sine power is odd, save one sine factor and replace the remaining even power using $\sin^2x=1-\cos^2x$. For example, $\int\sin^3x\,dx=\int(1-\cos^2x)\sin x\,dx$. With $u=\cos x$, $du=-\sin x\,dx$, this becomes $-\int(1-u^2)du=-\cos x+\cos^3x/3+C$. An odd cosine power works similarly with $u=\sin x$.

When both powers are even, half-angle identities lower the degree: $\sin^2x=(1-\cos2x)/2$ and $\cos^2x=(1+\cos2x)/2$. Thus $\int\cos^2x\,dx=x/2+\sin(2x)/4+C$. The factor $1/4$ combines the identity's $1/2$ with the chain-rule compensation for $2x$. Over $[0,\pi]$, the oscillating term vanishes at both endpoints, leaving $\pi/2$.

For tangent and secant, the useful derivatives are $(\tan x)'=\sec^2x$ and $(\sec x)'=\sec x\tan x$. A saved $\sec^2x$ factor suggests $u=\tan x$; a saved $\sec x\tan x$ suggests $u=\sec x$. The identity $\tan^2x=\sec^2x-1$ also gives $\int\tan^2x\,dx=\tan x-x+C$ on an interval avoiding tangent's poles.

These are choices guided by structure, not a requirement to memorize a separate formula for every power. First identify which derivative factor can be saved, then rewrite the rest entirely in the chosen variable. If no such factor is available, an even-power identity may be the better first step. State a connected interval excluding any poles when tangent, secant, cotangent, or cosecant is involved. Trigonometric identities preserve values only where the original functions exist.`,
      questions: [
        a(
          r`Find the general antiderivative of $\sin^3x\cos x$ on $\mathbb R$.`,
          'sin(x)^3*cos(x)',
          'sin(x)^4/4+C',
          r`Use $u=\sin x$, giving $u^4/4+C$.`,
        ),
        a(
          r`Find the general antiderivative of $\cos^3x\sin x$ on $\mathbb R$.`,
          'cos(x)^3*sin(x)',
          '-cos(x)^4/4+C',
          r`Use $u=\cos x$, whose differential contributes a minus sign.`,
        ),
        a(
          r`Find the general antiderivative of $\sin^3x$ on $\mathbb R$.`,
          'sin(x)^3',
          '-cos(x)+cos(x)^3/3+C',
          r`Write $\sin^3x=(1-\cos^2x)\sin x$ and substitute $u=\cos x$.`,
        ),
        a(
          r`Find the general antiderivative of $\cos^3x$ on $\mathbb R$.`,
          'cos(x)^3',
          'sin(x)-sin(x)^3/3+C',
          r`Write $\cos^3x=(1-\sin^2x)\cos x$ and use $u=\sin x$.`,
        ),
        a(
          r`Find the general antiderivative of $\sin^2x$ on $\mathbb R$.`,
          'sin(x)^2',
          'x/2-sin(2*x)/4+C',
          r`Use $(1-\cos2x)/2$ and integrate each term.`,
        ),
        a(
          r`Find the general antiderivative of $\cos^2x$ on $\mathbb R$.`,
          'cos(x)^2',
          'x/2+sin(2*x)/4+C',
          r`Use $(1+\cos2x)/2$, compensating the chain factor in the sine term.`,
        ),
        n(
          r`Evaluate $\int_0^\pi\sin^2x\,dx$.`,
          'pi/2',
          r`The antiderivative is $x/2-\sin2x/4$; the sine endpoints vanish.`,
        ),
        n(
          r`Evaluate $\int_0^{\pi/2}\sin^3x\,dx$.`,
          '2/3',
          r`$[-\cos x+\cos^3x/3]_0^{\pi/2}=0-(-1+1/3)=2/3$.`,
        ),
        o(
          r`Explain the error in $\int\sin^2x\,dx=\sin^3x/3+C$.`,
          r`Differentiation gives $\sin^2x\cos x$, with an unwanted factor $\cos x$. The power rule applies to the integration variable; a composition needs its chain factor.`,
        ),
        o(
          r`Find a general antiderivative of $\tan^2x$ on $(-\pi/2,\pi/2)$ and verify it.`,
          r`Since $\tan^2x=\sec^2x-1$, an antiderivative family is $\tan x-x+C$. Its derivative is $\sec^2x-1=\tan^2x$, valid throughout the pole-free interval.`,
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $\sin x\cos^2x$ on $\mathbb R$.`,
          'sin(x)*cos(x)^2',
          '-cos(x)^3/3+C',
          r`With $u=\cos x$, integrate $-u^2du$.`,
        ),
        n(
          r`Evaluate $\int_0^{\pi/2}\cos^2x\,dx$.`,
          'pi/4',
          r`Using $x/2+\sin2x/4$, the endpoint result is $\pi/4$.`,
        ),
        o(
          r`Choose a substitution for $\int\tan^3x\sec^2x\,dx$ on $(-\pi/2,\pi/2)$ and complete it.`,
          r`Take $u=\tan x$, $du=\sec^2x\,dx$. The result is $u^4/4+C=\tan^4x/4+C$.`,
        ),
      ],
      quickCheck: qc(
        r`Which rewrite is useful for integrating $\sin^2x$?`,
        [r`$\sin^3x/3$`, r`$(1-\cos2x)/2$`, r`$1-\cos x$`],
        1,
        r`The half-angle identity replaces the even power with a constant and an elementary cosine term.`,
      ),
    },
    {
      title: 'Trigonometric substitution and domains',
      sources: [trigsub, trig],
      terms: [
        term(
          'trigonometric-substitution',
          'Trigonometric substitution',
          'Using a trig identity to simplify a radical.',
          r`For $a>0$, $x=a\sin\theta$ simplifies $\sqrt{a^2-x^2}$ on $-\pi/2\le\theta\le\pi/2$.`,
          r`With $x=2\sin\theta$, $\sqrt{4-x^2}=2\cos\theta$ on the chosen angle interval.`,
          r`In general $\sqrt{z^2}=|z|$, so angle restrictions matter.`,
        ),
      ],
      body: r`Some radicals resemble a trigonometric identity. For $\sqrt{a^2-x^2}$ with $a>0$, let $x=a\sin\theta$. Then $a^2-x^2=a^2(1-\sin^2\theta)=a^2\cos^2\theta$. Choosing $-\pi/2\le\theta\le\pi/2$ makes cosine nonnegative, so the radical becomes $a\cos\theta$. Without that angle restriction the correct expression would be $a|\cos\theta|$.

Consider $\int dx/\sqrt{9-x^2}$ on $(-3,3)$. Set $x=3\sin\theta$, so $dx=3\cos\theta\,d\theta$ and the denominator is $3\cos\theta$. The factors cancel, leaving $\int d\theta=\theta+C=\arcsin(x/3)+C$. The inverse sine returns the angle in the chosen range. Differentiating gives $(1/3)/\sqrt{1-x^2/9}=1/\sqrt{9-x^2}$, where positivity of the scale is used.

A radical in the numerator requires the differential too. For $\int\sqrt{a^2-x^2}\,dx$, substitution gives $a^2\int\cos^2\theta\,d\theta$. Applying the half-angle identity yields $(a^2/2)(\theta+\sin\theta\cos\theta)+C$. Since $\sin\theta=x/a$ and $\cos\theta=\sqrt{a^2-x^2}/a$, the answer is $\tfrac12x\sqrt{a^2-x^2}+\tfrac12a^2\arcsin(x/a)+C$. This connects the algebraic formula with circle geometry.

For a sum $\sqrt{a^2+x^2}$, choose $x=a\tan\theta$ on $(-\pi/2,\pi/2)$, where secant is positive. The radical becomes $a\sec\theta$ and $dx=a\sec^2\theta\,d\theta$. For a difference $\sqrt{x^2-a^2}$ on $x>a$, choosing $x=a\sec\theta$ with $0<\theta<\pi/2$ gives $a\tan\theta$. These substitutions are introductions to the patterns, not a demand to solve every resulting trigonometric integral here.

Do not use a sophisticated substitution when a simpler one works. In $\int x/\sqrt{x^2+4}\,dx$, the numerator supplies the derivative of the radicand, so $u=x^2+4$ immediately gives $\sqrt{x^2+4}+C$. Method selection begins by checking for this direct chain-rule structure.`,
      questions: [
        a(
          r`Find the general antiderivative of $1/\sqrt{4-x^2}$ on $(-2,2)$.`,
          '1/sqrt(4-x^2)',
          'asin(x/2)+C',
          r`Use $x=2\sin\theta$; the differential cancels the radical and leaves $\theta=\arcsin(x/2)$.`,
          { positive: ['4-x^2', '1-x^2/4'] },
        ),
        a(
          r`Find the general antiderivative of $1/\sqrt{1-x^2}$ on $(-1,1)$.`,
          '1/sqrt(1-x^2)',
          'asin(x)+C',
          r`This is the derivative of $\arcsin x$.`,
          { positive: ['1-x^2'] },
        ),
        a(
          r`Find the general antiderivative of $x/\sqrt{x^2+4}$ on $\mathbb R$.`,
          'x/sqrt(x^2+4)',
          'sqrt(x^2+4)+C',
          r`Direct substitution $u=x^2+4$ is simpler than a trigonometric substitution.`,
          { positive: ['x^2+4'] },
        ),
        n(r`Evaluate $\int_0^1 dx/\sqrt{4-x^2}$.`, 'pi/6', r`$[\arcsin(x/2)]_0^1=\pi/6$.`),
        n(
          r`Evaluate $\int_0^2\sqrt{4-x^2}\,dx$.`,
          'pi',
          r`This is the area of a quarter circle of radius $2$, namely $\pi$.`,
        ),
        e(
          r`If $x=3\sin\theta$, give $dx/d\theta$ as an expression in $\theta$.`,
          '3*cos(theta)',
          r`Differentiate the substitution: $dx/d\theta=3\cos\theta$.`,
          ['theta'],
        ),
        e(
          r`On $-\pi/2<\theta<\pi/2$, simplify $\sqrt{9-9\sin^2\theta}$.`,
          '3*cos(theta)',
          r`The radicand is $9\cos^2\theta$ and cosine is positive on the specified interval.`,
          ['theta'],
          { positive: ['cos(theta)'] },
        ),
        t(
          r`For a radical $\sqrt{a^2+x^2}$, which usual substitution is appropriate: sine, tangent, or secant?`,
          'tangent',
          r`$x=a\tan\theta$ invokes $1+\tan^2\theta=\sec^2\theta$.`,
        ),
        o(
          r`Why is $\sqrt{a^2\cos^2\theta}=a\cos\theta$ false for unrestricted $\theta$, even when $a>0$?`,
          r`The square root is nonnegative, so it equals $a|\cos\theta|$. At $\theta=\pi$, the proposed right side is $-a$ while the radical is $a$. An angle restriction is required.`,
        ),
        o(
          r`Derive $\int\sqrt{1-x^2}\,dx$ on $(-1,1)$ using $x=\sin\theta$.`,
          r`The integral becomes $\int\cos^2\theta\,d\theta=\theta/2+\sin\theta\cos\theta/2+C$. Since $\theta=\arcsin x$ and cosine is positive, this is $(\arcsin x+x\sqrt{1-x^2})/2+C$.`,
          'prove',
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $1/\sqrt{16-x^2}$ on $(-4,4)$.`,
          '1/sqrt(16-x^2)',
          'asin(x/4)+C',
          r`The scale factors cancel under $x=4\sin\theta$.`,
          { positive: ['16-x^2', '1-x^2/16'] },
        ),
        n(
          r`Evaluate $\int_0^{3/2}dx/\sqrt{9-x^2}$.`,
          'pi/6',
          r`The endpoint ratio is $(3/2)/3=1/2$, so the inverse-sine difference is $\pi/6$.`,
        ),
        o(
          r`For $x=2\tan\theta$ on $(-\pi/2,\pi/2)$, rewrite both $\sqrt{4+x^2}$ and $dx$.`,
          r`The radical is $2\sec\theta$ because secant is positive on this interval, and $dx=2\sec^2\theta\,d\theta$. Both replacements are needed in the transformed integral.`,
        ),
      ],
    },
    {
      title: 'Choosing, combining, and checking methods',
      sources: [parts, fractions, trig, trigsub],
      terms: [
        term(
          'integral-verification',
          'Verification by differentiation',
          'Check a proposed antiderivative against the original integrand.',
          r`Compute $F'$ and compare with $f$ on the stated domain; an initial condition needs a separate value check.`,
          r`For $F=(x-1)e^x$, the product rule gives $F'=xe^x$.`,
          'Matching at a few numerical points does not prove symbolic equality.',
        ),
      ],
      body: r`Integration methods are transformations, so a good first step is inspection rather than commitment to a favorite formula. Simplify algebraically, note poles and radical restrictions, then look for a known derivative or a composition with its chain factor. Products involving a polynomial and an exponential, logarithm, or trigonometric function often suggest parts. Proper rational functions suggest factoring and partial fractions. Trigonometric powers suggest identities before substitution.

Compare $\int xe^{x^2}\,dx$ with $\int xe^x\,dx$. Their appearances are similar, but the first has an inner derivative: $u=x^2$ gives $e^{x^2}/2+C$. The second is better handled by parts. In $\int x\ln(x^2+1)\,dx$, substitution first gives $\tfrac12\int\ln u\,du$; parts then gives $\tfrac12[(x^2+1)\ln(x^2+1)-(x^2+1)]+C$. Combining methods is often simpler than forcing one method to do everything.

Some integrations by parts produce a solvable cycle. Let $I=\int e^x\cos x\,dx$. Integrating the exponential and differentiating cosine gives $I=e^x\cos x+\int e^x\sin x\,dx$. Applying parts to the remaining integral gives $e^x\sin x-I$. Therefore $2I=e^x(\cos x+\sin x)$, and $I=\tfrac12e^x(\cos x+\sin x)+C$. The return of $I$ is useful because it appears in a linear equation.

A proposed result should survive three checks. Differentiate it symbolically, preserving the original domain. For a definite integral, evaluate both bounds with parentheses and compare with sign or magnitude estimates. For an application, attach units and check whether the requested quantity is change or final amount. These checks are complementary: a correct derivative does not rescue incorrect endpoints, and plausible units do not establish algebraic correctness.

Finally, failure to find an elementary antiderivative is not evidence that an integral is undefined. Continuous functions such as $e^{-x^2}$ still have accumulation functions and finite integrals on bounded intervals. A definite answer can be expressed using an integral or approximated numerically. The next lesson uses integrals as models; the later numerical-integration lesson handles evaluation when the present symbolic toolkit is not appropriate.`,
      questions: [
        a(
          r`Find the general antiderivative of $xe^{x^2}$ on $\mathbb R$.`,
          'x*exp(x^2)',
          'exp(x^2)/2+C',
          r`Use $u=x^2$, so $x\,dx=du/2$.`,
        ),
        a(
          r`Find the general antiderivative of $e^x\cos x$ on $\mathbb R$.`,
          'exp(x)*cos(x)',
          'exp(x)*(cos(x)+sin(x))/2+C',
          r`Two applications of parts give $I=e^x\cos x+e^x\sin x-I$, hence the stated family.`,
        ),
        a(
          r`Find the general antiderivative of $x\ln(x^2+1)$ on $\mathbb R$.`,
          'x*ln(x^2+1)',
          '((x^2+1)*ln(x^2+1)-(x^2+1))/2+C',
          r`Substitute $u=x^2+1$ to obtain $(1/2)\int\ln u\,du$, then use parts.`,
          { positive: ['x^2+1'] },
        ),
        a(
          r`Find the general antiderivative of $x^3/(x^2+1)$ on $\mathbb R$.`,
          'x^3/(x^2+1)',
          'x^2/2-ln(x^2+1)/2+C',
          r`Division gives $x-x/(x^2+1)$; integrate the first term and substitute in the second.`,
          { positive: ['x^2+1'] },
        ),
        n(
          r`Evaluate $\int_0^1 x/(x^2+1)\,dx$.`,
          'ln(2)/2',
          r`The antiderivative is $\ln(x^2+1)/2$ and the endpoint difference is $\ln2/2$.`,
        ),
        n(
          r`Evaluate $\int_0^1x^3/(x^2+1)\,dx$.`,
          '(1-ln(2))/2',
          r`Using $x^2/2-\ln(x^2+1)/2$ gives $(1-\ln2)/2$.`,
        ),
        t(
          r`Which first method best fits $\int x^2\ln x\,dx$: parts, partial fractions, or trigonometric substitution?`,
          'parts',
          r`Differentiating the logarithm simplifies it, while the polynomial factor is easy to integrate.`,
        ),
        t(
          r`Which first method best fits $\int 2x\cos(x^2)\,dx$: substitution or parts?`,
          'substitution',
          r`The derivative of the inner $x^2$ is already present as $2x$.`,
        ),
        o(
          r`A numerical check matches a proposed antiderivative's derivative at three points. Why is that not a proof?`,
          r`Distinct functions can agree at finitely many points. For example, adding a nonzero polynomial with derivative vanishing at those points would evade that check. Symbolic differentiation and equality on the stated interval are needed.`,
        ),
        o(
          r`Explain why a continuous integrand with no known elementary antiderivative can still have a well-defined definite integral.`,
          r`The Riemann-sum definition requires a common limit, and continuity on a closed interval guarantees it. An elementary expression for an antiderivative is a computational convenience, not part of the definition of integrability.`,
        ),
      ],
      review: [
        a(
          r`Find the general antiderivative of $e^x\sin x$ on $\mathbb R$.`,
          'exp(x)*sin(x)',
          'exp(x)*(sin(x)-cos(x))/2+C',
          r`A two-step parts cycle yields this result; differentiating cancels the cosine terms and doubles the sine term.`,
        ),
        n(
          r`Evaluate $\int_0^1 2xe^{x^2}\,dx$.`,
          'e-1',
          r`Substitution $u=x^2$ gives $\int_0^1 e^u du=e-1$.`,
        ),
        o(
          r`Compare the method choices for $\int x/(x^2+1)\,dx$ and $\int1/[x(x+1)]\,dx$.`,
          r`The first numerator matches the denominator derivative up to a constant, so substitution works directly. The second denominator factors into distinct linear terms, so partial fractions exposes two logarithmic derivatives.`,
        ),
      ],
    },
  ],
};
