# Systems of Linear Equations

A system asks several equations to hold at once. Each linear equation contains unknowns only to the first power, multiplied by fixed coefficients and added. A solution is one assignment of values that satisfies every equation, not a separate choice of values for each line.

## Constraints and augmented matrices

Consider $x+y=3$ together with $2x-y=0$. Each equation describes a line in the plane, and a solution is a point on both lines. Adding the equations gives three x equals three, so x is one; substituting gives y equal to two. Checking both original equations confirms the answer.

The coefficient matrix contains the coefficients of the unknowns, while the right-hand-side vector contains the constants. Writing the system as $Ax=b$ treats x as a column of unknowns and b as the required output. In this notation x is a vector, unlike the scalar x used in the two displayed equations above.

An [augmented matrix](ref:linear-algebra-systems-1) places the right-hand-side column beside the coefficient columns, usually separated visually by a bar. It records the same system compactly. Keep the variable order fixed: if the columns mean x then y, they must keep that meaning through every row operation.

## Elimination preserves solutions

Three elementary row operations preserve the solution set: swap two equations, multiply an equation by a nonzero number, or add a multiple of one equation to another. Each operation can be undone, which is why it cannot gain or lose solutions. Multiplying an entire equation by zero would erase information and is not allowed.

Gaussian elimination uses these operations to remove coefficients below successive leading entries. A [pivot](ref:linear-algebra-systems-2) is a leading nonzero entry chosen to eliminate other entries in its column. In row echelon form, all zero rows are at the bottom, each nonzero row's leading entry is farther right than the one above, and entries below each leading entry are zero.

For the system above, replace the second row by the second row minus twice the first. The second equation becomes negative three y equals negative six. Solve it first, then substitute upward; this is back substitution. Reduced row echelon form goes further: each leading entry is one, and all other entries in its column are zero. Either form can be used to solve a system.

## No solution or a family of solutions

A system is consistent if it has at least one solution. An equation such as zero equals one is impossible, so an augmented row with all zero coefficient entries and a nonzero last entry proves inconsistency. A row representing zero equals zero adds no restriction and does not itself indicate failure.

For example, x+y=3 and twice x plus twice y equals six describe the same line. One variable may be chosen freely. Writing $y=t,\quad x=3-t$ describes every solution, with t an arbitrary real parameter. A parameter is a symbol that ranges over allowed values to describe a family of objects.

A variable whose column has a pivot is a pivot variable; a non-pivot variable is free in a consistent system. Express pivot variables in terms of the free ones. Over the real numbers, a consistent linear system has either one solution, when there are no free variables, or infinitely many, when at least one variable is free. A [free variable](ref:linear-algebra-systems-3) alone does not rescue an inconsistent system.

## Homogeneous systems and verification

A [homogeneous system](ref:linear-algebra-systems-4) has a zero right-hand side: $Ax=0$. Here zero denotes the zero output vector of the appropriate size. Such a system is always consistent, because the zero input works. A nontrivial solution means a solution other than the zero vector; the adjective says nothing about how difficult it was to find.

If p is one solution of Ax=b and z solves Az=0, then p+z is another solution of Ax=b, because matrix multiplication distributes over addition. Conversely, subtracting any two solutions of Ax=b gives a solution of the homogeneous system. Thus the homogeneous solutions describe the freedom remaining after one particular solution has been found.

For the equation x+y=3, one particular solution is (3,0), and homogeneous solutions are all multiples of (-1,1). This gives exactly the family written with t above. The connection between elimination and vector combinations is beginning to emerge.

Check a claimed family by substitution, and explain why it includes every solution rather than merely some solutions. In small examples, exact fractions are preferable to rounded decimals: an apparent tiny nonzero quantity caused by rounding should not be mistaken for an exact contradiction.
