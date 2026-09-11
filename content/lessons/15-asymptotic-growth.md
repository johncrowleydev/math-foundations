# Asymptotic Growth

An exact operation count can be useful, but it often depends on implementation details that obscure the main pattern. Asymptotic notation describes how functions compare for sufficiently large inputs. It helps distinguish linear work from quadratic or exponential work while keeping the underlying claims precise.

This lesson builds on [Functions](../lessons/05-functions.md), [Sequences and Summations](../lessons/06-sequences-and-summations.md), and [Recurrence Relations](../lessons/13-recurrence-relations.md). We will use integer input sizes and elementary inequalities. No limit or calculus machinery is required.

## State the function and the model

Let $n\in\mathbb N$ be a positive integer measuring input size. Unless a different domain is specified, the functions compared below are real-valued and nonnegative for all sufficiently large $n$. The comparison function $g(n)$ will be strictly positive for all sufficiently large $n$.

A cost function might count comparisons, array accesses, or arithmetic operations. These are different models. Saying that a loop takes $n$ steps assumes that the work counted in one iteration has bounded constant cost in the chosen model.

The parameter also needs a meaning. For sorting, $n$ often means the number of array elements. For a graph, two parameters, vertices and edges, may be necessary. For an integer, its numeric value and its number of binary digits are very different input sizes.

Asymptotic notation compares functions. To apply it to an algorithm, first identify which function you are bounding.

## Big O: an eventual upper bound

We write $f(n)=O(g(n))$ if there exist constants $c>0$ and an integer $n_0\geq1$ such that

$$
0\leq f(n)\leq c g(n)\qquad\text{for every integer }n\geq n_0.
$$

The constant $c$ and threshold $n_0$ must be fixed independently of $n$. A larger multiplier may make the inequality work after a convenient threshold. Behavior at finitely many smaller inputs does not affect the classification.

**Worked proof.** Let $f(n)=3n^2+5n+7$. For $n\geq1$, both $n\leq n^2$ and $1\leq n^2$, so

$$
3n^2+5n+7\leq15n^2.
$$

Thus $f(n)=O(n^2)$ with $c=15$ and $n_0=1$.

Big O need not be tight. The same function is also $O(n^3)$, since $n^2\leq n^3$ for $n\geq1$. The statement $f(n)=O(n^3)$ is true but gives less precise information.

The equals sign is conventional shorthand for membership in a class of functions. It does not mean that $O(n^2)$ is one particular function or that algebraic equality can be freely reversed.

## Big Omega and Big Theta

We write $f(n)=\Omega(g(n))$ if there exist $c>0$ and $n_0\geq1$ such that

$$
0\leq c g(n)\leq f(n)\qquad(n\geq n_0).
$$

This is an eventual lower bound. We write $f(n)=\Theta(g(n))$ when both an upper and a lower bound hold: there are positive constants $c_1,c_2$ and a threshold $n_0$ with

$$
0\leq c_1g(n)\leq f(n)\leq c_2g(n)\qquad(n\geq n_0).
$$

For $f(n)=3n^2+5n+7$, the earlier upper bound and the inequality $f(n)\geq3n^2$ show $f(n)=\Theta(n^2)$, using $c_1=3$, $c_2=15$, and $n_0=1$.

The symbols describe different claims. An $O(n^2)$ algorithm might have linear cost. An $\Omega(n)$ bound alone permits linear, quadratic, or exponential cost. Only matching bounds justify a $\Theta$ conclusion.

## Negating an asymptotic claim

To prove that a nonnegative $f$ is not $O(g)$, show that every proposed constant and threshold eventually fail:

$$
\forall c>0\ \forall n_0\geq1\ \exists n\geq n_0:
f(n)>c g(n).
$$

The threshold and witness indices here are integers. This quantifier order matters: a finite collection of failed multipliers does not eliminate every possible multiplier.

**Worked counterexample.** The function $n^2$ is not $O(n)$. Given arbitrary $c>0$ and $n_0$, choose an integer $n>\max(c,n_0)$. Then $n^2>cn$. Since this defeats every proposed pair $(c,n_0)$, no linear upper bound exists.

Choosing $c=n$ would make $n^2\leq cn$ true, but it is invalid in the definition: $c$ must be fixed while $n$ varies.

## Useful rules, with reasons

For eventually nonnegative functions, if $f=O(g)$ and $h=O(k)$, then

$$
f+h=O(g+k),\qquad fh=O(gk).
$$

Above the larger of the two thresholds, suppose $f\leq ag$ and $h\leq bk$. The sum is at most $\max(a,b)(g+k)$, and the product is at most $abgk$. This proves both rules.

Upper bounds are transitive: if $f\leq ag$ eventually and $g\leq bh$ eventually, then $f\leq ab h$ eventually. Also,

$$
g+k=\Theta(\max(g,k))
$$

for nonnegative $g,k$, because $\max(g,k)\leq g+k\leq2\max(g,k)$.

Subtraction requires care. Two functions can both be $\Theta(n^2)$ while their difference is constant: $(n^2+1)-n^2=1$. Cancellation can remove the dominant terms. Do not infer a lower bound for a difference by subtracting unrelated asymptotic descriptions.

## Polynomials and logarithm bases

For a polynomial with positive leading coefficient and degree $d\geq0$, the eventual growth is $\Theta(n^d)$. Lower-degree terms become bounded by constant multiples of the leading power. If some coefficients are negative, choose the threshold large enough that their combined magnitude is at most, for example, half the positive leading term.

For a concrete example, $f(n)=2n^2-5n$ is not nonnegative at every small positive integer. For $n\geq5$, however,

$$
n^2\leq2n^2-5n\leq2n^2,
$$

so it is $\Theta(n^2)$. Eventual bounds allow these finite initial exceptions.

For fixed bases $a,b>1$, the change-of-base identity gives

$$
\log_a n=\frac{\log_b n}{\log_b a}.
$$

The denominator is a positive constant, so all such fixed logarithm bases have the same $\Theta$ growth. We use $\log_2$ when counting binary halving steps.

This rule does not allow a base depending on $n$: $\log_n n=1$ for $n>1$ is constant. Nor are exponential bases interchangeable; $2^n$ and $3^n$ are not $\Theta$ of each other.

## Strictly slower growth

The notation $f(n)=o(g(n))$, read "little o," means that for every $\varepsilon>0$ there is a threshold $n_0$ such that

$$
0\leq f(n)\leq\varepsilon g(n)\qquad(n\geq n_0).
$$

Big O needs one successful positive multiplier; little o requires every positive multiplier to work eventually. For example, $n=o(n^2)$: given $\varepsilon>0$, choose $n_0\geq1/\varepsilon$. Then $n\leq\varepsilon n^2$ for all $n\geq n_0$.

But $n$ is not $o(n)$, since the inequality fails for $\varepsilon=1/2$. Equal-order functions generally do not become arbitrarily small multiples of each other.

For fixed positive integer $d$, a useful hierarchy is

$$
1\prec\log_2 n\prec n\prec n\log_2 n\prec n^2,
\qquad n^d\prec2^n,
$$

where $f\prec g$ means $f=o(g)$. These comparisons concern sufficiently large inputs, not every small value.

## Why exponentials outrun fixed powers

We can justify $n^d=o(2^n)$ without calculus. The binomial theorem gives, for $n\geq d+1$,

$$
2^n=\sum_{j=0}^n\binom nj\geq\binom n{d+1}.
$$

When $n\geq2(d+1)$, every factor in $n(n-1)\cdots(n-d)$ is at least $n/2$, so

$$
2^n\geq\frac{(n/2)^{d+1}}{(d+1)!}.
$$

Consequently,

$$
\frac{n^d}{2^n}\leq\frac{2^{d+1}(d+1)!}{n}.
$$

For any positive $\varepsilon$, the right side is at most $\varepsilon$ once $n$ exceeds a suitable constant. This proves the little-o statement.

The same bound with $d=1$ shows $k/2^k$ becomes arbitrarily small. If $2^k\leq n<2^{k+1}$, then $\log_2 n/n\leq(k+1)/2^k$, which also becomes arbitrarily small. Thus $\log_2 n=o(n)$. This establishes the logarithmic-versus-linear comparison behind the displayed hierarchy.

To distinguish $2^n$ from $3^n$, note $(3/2)^n\geq1+n/2$ by the binomial theorem. This ratio exceeds every constant for sufficiently large $n$, so $3^n$ cannot be $O(2^n)$.

## Counting simple and consecutive loops

Assume the indicated body has constant positive cost and the loop runs over the stated integer values.

```text
for i = 1 to n:
    perform one constant-cost operation
```

There are exactly $n$ body executions, so the cost is $\Theta(n)$. Loop control contributes only a constant amount per iteration under the usual unit-cost model.

Two consecutive loops of lengths $n$ and $n^2$ perform $n+n^2$ body executions and have total cost $\Theta(n^2)$. Sequential phases add their costs. They do not multiply simply because both appear in the same program.

For independent nested loops,

```text
for i = 1 to n:
    for j = 1 to n:
        perform one constant-cost operation
```

the body executes $n^2$ times. Each outer iteration runs the complete inner loop. The cost is $\Theta(n^2)$.

## Dependent loop bounds

Now consider

```text
for i = 1 to n:
    for j = 1 to i:
        perform one constant-cost operation
```

The inner bound varies with $i$, so count a sum:

$$
\sum_{i=1}^n i=\frac{n(n+1)}2=\Theta(n^2).
$$

The exact count is about half that of the independent loops, but both have quadratic growth. A constant factor changes the count without changing its $\Theta$ class.

By contrast,

```text
for i = 1 to n:
    for j = 1 to 3:
        perform one constant-cost operation
```

has $3n$ executions and linear cost. Counting indentation levels is not a valid general method: a nested loop need not be quadratic in $n$.

An inner loop with expensive work also changes the result. If its body copies a length-$n$ array, treating that copy as one constant-cost step understates the actual cost in an element-copy model.

## Doubling and halving

Consider

```text
i = 1
while i <= n:
    perform one constant-cost operation
    i = 2*i
```

The values are $1,2,4,\ldots,2^k$, where $k=\lfloor\log_2 n\rfloor$. The body executes $\lfloor\log_2 n\rfloor+1$ times, giving $\Theta(\log n)$ for $n\geq2$.

A related dependent loop is

```text
i = 1
while i <= n:
    for j = 1 to i:
        perform one constant-cost operation
    i = 2*i
```

Its total body count is

$$
1+2+4+\cdots+2^k=2^{k+1}-1.
$$

Because $2^k\leq n<2^{k+1}$, this count is between a positive constant multiple of $n$ and $2n$. Thus the total cost is $\Theta(n)$, even though there are logarithmically many outer iterations. Multiplying the number of iterations by the largest inner cost gives an upper bound $O(n\log n)$, but it misses the tighter bound supplied by the geometric sum.

Repeated halving also explains binary search's number of search steps. The remaining candidate interval shrinks by about a factor of two per comparison. Whether each step has constant cost depends on the representation and access operations.

## Worst case is a different axis

For a fixed size $n$, an algorithm may run differently on different inputs. The **worst-case cost** is the maximum cost among those inputs; the **best-case cost** is the minimum. Average-case analysis requires a specified probability distribution.

Linear search illustrates the distinction. Searching an array of length $n$ stops after one comparison if the first element matches, but may inspect all $n$ elements. Under unit-cost comparisons, its best-case cost is $\Theta(1)$ and its worst-case cost is $\Theta(n)$.

Big O does not mean "worst case," and Omega does not mean "best case." We can give an upper or lower bound for either cost function. Saying the worst-case cost is $\Omega(n)$ means some size-$n$ input requires at least a constant times $n$ work eventually; it does not mean every input does.

## An upper-bound proof is not an algorithm lower bound

Suppose an implementation sorts an array using at most $n^2$ comparisons. This proves an upper bound for that implementation. It does not show that every sorting algorithm needs quadratic work. A different algorithm may organize the information more efficiently.

Even a demonstrated input requiring quadratic work proves a worst-case lower bound only for the algorithm whose execution was analyzed. A lower bound for an entire problem must apply to every algorithm in a specified computational model. These are stronger quantifiers, much like the distinction between one witness and a universal statement in the quantifier lesson.

For a simple example, copying an $n$-element array into a separate explicitly stored array requires writing $n$ output elements in a model where one operation writes at most one element. This supplies an $\Omega(n)$ lower bound for that task under that output requirement. A loop that writes each element once supplies an $O(n)$ upper bound, giving a matching $\Theta(n)$ bound. If the task were instead to create a shared reference to an existing array, the output requirement would be different and this argument would not apply.

The practical habit is to name both the subject and the claim: "this implementation has worst-case cost $O(n^2)$" is more informative than an unexplained "$O(n^2)$," and avoids suggesting an unproved optimality result.

## Irregular functions still use the definitions

Asymptotic notation does not require smooth or steadily increasing functions. Define $f(n)=n$ for even $n$ and $f(n)=2n$ for odd $n$. For every positive integer,

$$
n\leq f(n)\leq2n,
$$

so $f(n)=\Theta(n)$ despite its alternating multiplier.

Now define $h(n)=n$ for even $n$ and $h(n)=n^2$ for odd $n$. We have $h=O(n^2)$ and $h=\Omega(n)$. But $h$ is not $O(n)$: arbitrarily large odd indices defeat every fixed linear multiplier. It is also not $\Omega(n^2)$: arbitrarily large even indices make $h(n)/n^2=1/n$ smaller than any proposed positive lower-bound constant.

Thus neither $\Theta(n)$ nor $\Theta(n^2)$ describes this function. Looking only at one subsequence can suggest a false tight bound. The definition requires the inequality to hold at every index beyond a single threshold.

## Recurrences and input size

The earlier recurrence $T(1)=1$, $T(n)=2T(n/2)+n$ on powers of two has exact solution $n\log_2 n+n$, hence $\Theta(n\log n)$ on that domain. The recurrence $S(n)=S(n/2)+1$ gives $\Theta(\log n)$. Same recursion depth, different total work.

An integer's bit length is approximately its base-2 logarithm: a positive integer $N$ has $b=\lfloor\log_2 N\rfloor+1$ binary digits. A loop running $N$ times is linear in the numeric value $N$, but may require about $2^b$ iterations when measured by bit length $b$. Calling it simply "linear in the input" would hide an essential distinction.

Similarly, arbitrary-precision addition is not constant cost in a bit-operation model: longer numbers require processing more digits. A unit-cost arithmetic model can be useful, but its assumptions must be stated when operands grow.

## Readiness check

Before continuing, check that you can:

- Prove an $O$, $\Omega$, or $\Theta$ claim using constants and a threshold.
- Negate an upper-bound claim with the correct quantifier order.
- Distinguish a valid upper bound from a tight bound.
- Analyze consecutive, nested, and geometrically changing loops with sums.
- Explain the difference between worst-case selection and asymptotic bounds.
- State input-size and operation-cost assumptions, especially for large integers.

The [Asymptotic Growth worksheet](../worksheets/15-asymptotic-growth.yaml) combines explicit inequality proofs, loop counts, recurrence comparisons, and cost-model reasoning. This completes the discrete mathematics and proofs sequence; later subjects require separate study rather than extending this lesson's scope.
