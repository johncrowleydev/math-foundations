// Authored, finite practice sets; these are not randomized runtime questions.
export function author({
  li,
  begin,
  q,
  task,
  v,
  rows,
  add,
  scale,
  dot,
  tr,
  mv,
  mm,
  frac,
  mats,
  pairs,
}) {
  const coeffs = [
    [1, 2],
    [2, -1],
    [-1, 3],
    [0, 2],
    [3, 0],
    [-2, -1],
  ];
  if (li === 3) {
    begin(0, 'encoding systems with missing coefficients');
    for (const a of mats) {
      const x = a[0].map((_, i) => i + 1),
        b = mv(a, x);
      q(
        `A system has coefficient matrix with rows ${rows(a)} and right-hand side ${v(b)}. Write the augmented rows in variable order x1, x2${x.length === 3 ? ', x3' : ''}, and check whether ${v(x)} solves it.`,
        `The augmented rows are ${rows(a.map((r, i) => [...r, b[i]]))}. Substitution of ${v(x)} gives ${v(b)}, so this one vector satisfies every equation simultaneously.`,
        { kind: 'mv', a, x, expected: b },
      );
    }
    begin(1, 'two-variable elimination');
    for (const [x, y] of coeffs) {
      const b = [x + 2 * y, 3 * x + 5 * y];
      q(
        `Solve x+2y=${b[0]} and 3x+5y=${b[1]} by elimination, and check the original equations.`,
        `Subtract three times row one from row two: -y=${-y}, hence y=${y}. Back substitution gives x=${x}. The original left sides are ${b[0]} and ${b[1]}.`,
        {
          kind: 'unique-system',
          a: [
            [1, 2],
            [3, 5],
          ],
          b,
          expected: [x, y],
        },
      );
    }
    begin(1, 'three-variable elimination');
    for (const x of [
      [1, 2, 3],
      [2, -1, 0],
      [-1, 0, 2],
      [0, 3, -2],
      [3, 1, -1],
      [-2, 2, 1],
    ]) {
      const a = [
          [1, 1, 1],
          [2, 3, 1],
          [1, 2, 3],
        ],
        b = mv(a, x);
      q(
        `Solve the three-variable system with coefficient rows ${rows(a)} and right-hand side ${v(b)}. Show elimination and back substitution.`,
        `Subtract twice the first row from the second and the first from the third. The new equations are y-z=${x[1] - x[2]} and y+2z=${x[1] + 2 * x[2]}. Subtraction gives 3z=${3 * x[2]}; then z=${x[2]}, y=${x[1]}, x=${x[0]}. Substitution gives ${v(b)}.`,
        { kind: 'unique-system', a, b, expected: x },
      );
    }
    begin(1, 'row swaps');
    for (const [x, y] of coeffs) {
      const b = [2 * y, 3 * x - y];
      q(
        `Solve 2y=${b[0]} and 3x-y=${b[1]}. If you use x as the first pivot variable, explain the row swap instead of dividing by a zero coefficient.`,
        `Put the second equation first to obtain a nonzero x pivot. The equation 2y=${b[0]} gives y=${y}; then 3x=${3 * x}, so x=${x}. Swapping entire equations preserves the solution set.`,
        {
          kind: 'unique-system',
          a: [
            [0, 2],
            [3, -1],
          ],
          b,
          expected: [x, y],
        },
      );
    }
    begin(2, 'consistency and redundant equations');
    for (const [c, d] of [
      [2, 4],
      [2, 5],
      [-1, -2],
      [-1, 3],
      [0, 0],
      [0, 2],
    ])
      q(
        `Classify x+2y=${c}, 2x+4y=${d}. If consistent, describe every real solution; otherwise display a contradiction.`,
        `Subtract twice row one from row two to get 0=${d - 2 * c}. ${d === 2 * c ? `This adds no restriction. With y=t arbitrary, x=${c}-2t; there are infinitely many solutions.` : 'This is impossible, so there is no solution.'}`,
        {
          kind: 'classification',
          a: [
            [1, 2],
            [2, 4],
          ],
          b: [c, d],
          consistent: d === 2 * c,
        },
      );
    begin(2, 'parameter-dependent systems');
    for (const [k, c] of [
      [2, 4],
      [2, 7],
      [3, 4],
      [0, 2],
      [-1, 7],
      [4, 0],
    ]) {
      const x = k !== 2 ? frac(2 * (k - 2) - (c - 4), k - 2) : null,
        y = k !== 2 ? frac(c - 4, k - 2) : null;
      q(
        `For the fixed values k=${k} and c=${c}, solve x+y=2 and 2x+ky=c. Explain which division is legal or which exceptional case applies.`,
        `Elimination gives (${k}-2)y=${c - 4}. ${k !== 2 ? `The coefficient is nonzero, so y=${y} and x=${x}.` : c === 4 ? 'The equation is 0=0; choose y=t and x=2-t for arbitrary real t.' : 'The equation is a contradiction, so no solution exists.'}`,
        {
          kind: 'classification',
          a: [
            [1, 1],
            [2, k],
          ],
          b: [2, c],
          consistent: k !== 2 || c === 4,
        },
      );
    }
    begin(2, 'two independent free parameters');
    for (const [a, b] of coeffs)
      q(
        `Describe every solution of x+2z-w=${a} and y-z=${b}. Identify both free variables and write a particular solution plus homogeneous directions.`,
        `Let z=s and w=t independently. Then x=${a}-2s+t and y=${b}+s. The vector is ${v([a, b, 0, 0])}+s(-2,1,1,0)+t(1,0,0,1). Every solution has some third and fourth coordinates s,t, and the equations force the others.`,
        {
          kind: 'affine-family',
          a: [
            [1, 0, 2, -1],
            [0, 1, -1, 0],
          ],
          b: [a, b],
          particular: [a, b, 0, 0],
          directions: [
            [-2, 1, 1, 0],
            [1, 0, 0, 1],
          ],
        },
      );
    begin(3, 'homogeneous solution families');
    for (const [a, b] of coeffs)
      q(
        `Find all real solutions of x+${a}y+${b}z=0. Give a nontrivial solution and explain why your parameterization is complete.`,
        `Let y=s and z=t. Then x=-(${a})s-(${b})t, giving s${v([-a, 1, 0])}+t${v([-b, 0, 1])}. The first direction is nonzero. Every solution is determined by its freely chosen y,z coordinates.`,
        {
          kind: 'affine-family',
          a: [[1, a, b]],
          b: [0],
          particular: [0, 0, 0],
          directions: [
            [-a, 1, 0],
            [-b, 0, 1],
          ],
        },
      );
    task(3, 'solution-set arguments', [
      [
        'Prove that the difference of any two solutions of Ax=b solves Ax=0.',
        'If Ap=b and Aq=b, distributivity gives A(p-q)=b-b=0.',
      ],
      [
        'Prove that adding any homogeneous solution to a particular solution preserves the right-hand side.',
        'If Ap=b and Az=0, then A(p+z)=Ap+Az=b.',
      ],
      [
        'Why does a homogeneous real system with five unknowns and three equations have a nonzero solution?',
        'It is consistent because zero solves it, and at most three variable columns can have pivots. At least two variables are free; choosing one nonzero yields a nonzero solution.',
      ],
      [
        'Can a real linear system have exactly two solutions? Prove your answer.',
        'No. If p and q are distinct solutions, p+t(q-p) is a solution for every real t. Their nonzero difference makes these infinitely many distinct vectors.',
      ],
      [
        'A reduced augmented matrix contains a row (0,0,1). What does this mean for a two-variable system?',
        'It means 0x+0y=1, a contradiction. The last column is the right-hand side, not another unknown.',
      ],
      [
        'Does an all-zero row prove a system has infinitely many solutions? Give a counterexample if not.',
        'No. The equations x=1, y=2, 0=0 have one solution. A zero row only indicates a redundant equation; free variables determine nonuniqueness in a consistent system.',
      ],
      [
        'Explain why assigning the same parameter to two free variables can omit solutions.',
        'The variables are allowed to vary independently. Equating them adds a restriction not present in the original system. For example y and z free may take values one and two, which one shared parameter would exclude.',
      ],
      [
        'Why is a reversible row operation sufficient to preserve all solutions in both directions?',
        'The forward operation sends every old solution to a solution of the rewritten equations, and its inverse sends every new solution back. Thus neither set contains extra solutions.',
      ],
      [
        'Can an inconsistent system have a free variable column? Explain.',
        'Yes. A contradiction row can occur even when some coefficient columns lack pivots. Free parameters are assigned only after consistency is established.',
      ],
      [
        'A proposed family passes substitution. What further argument is needed to show it is the complete solution set?',
        'Show that every solution must have the displayed form, typically by solving pivot variables in terms of all independently free variables. Substitution alone only proves inclusion in the solution set.',
      ],
      [
        'Is exchanging two variable columns the same operation as exchanging two equations? Explain.',
        'No. Row exchange reorders equations. Column exchange changes which coefficient belongs to which unknown, so it requires an explicit corresponding relabeling of variables.',
      ],
      [
        'Explain why a nontrivial homogeneous solution is a nonzero vector, not merely a solution found by a difficult calculation.',
        'Nontrivial is a definition here: at least one component is nonzero. The word does not assess the difficulty of the method.',
      ],
    ]);
  }
  if (li === 4) {
    begin(0, 'membership in a two-direction span');
    for (const [a, b] of coeffs) {
      const t = [a, b, 2 * a - b];
      q(
        `Determine whether ${v(t)} lies in the span of (1,0,2) and (0,1,-1), and find coefficients. Give one nearby target with the same first two coordinates that is unreachable.`,
        `The coefficients are ${a},${b}, producing third component ${2 * a - b}. Changing only that component to ${2 * a - b + 1} makes a target unreachable: every combination has third coordinate twice the first minus the second.`,
        {
          kind: 'combination',
          vectors: [
            [1, 0, 2],
            [0, 1, -1],
          ],
          coefficients: [a, b],
          expected: t,
        },
      );
    }
    begin(0, 'span equality by rebuilding');
    for (const c of [1, 2, -1, 3, -2, 4])
      q(
        `Let u=(1,0), v=(0,1), and w=u+${c}v. Prove that u,w and u,v have the same span, rather than only showing one inclusion.`,
        `w is a combination of u,v, so the first span is contained in the second. Conversely v=(w-u)/${c}, since ${c} is nonzero, so both u and v lie in the first span. Every combination can therefore be rebuilt in either collection.`,
      );
    begin(1, 'explicit dependence coefficients');
    for (const [a, b] of coeffs) {
      const w = [a, b, a + b];
      q(
        `For u=(1,0,1), v=(0,1,1), and w=${v(w)}, exhibit a nontrivial zero combination and identify a redundant vector.`,
        `w=${a}u+${b}v, hence coefficient list ${v([-a, -b, 1])} gives zero. Its last coefficient is one, so it is nontrivial. The vector w adds no direction beyond u,v.`,
        {
          kind: 'combination',
          vectors: [[1, 0, 1], [0, 1, 1], w],
          coefficients: [-a, -b, 1],
          expected: [0, 0, 0],
        },
      );
    }
    begin(1, 'independence by forced coefficients');
    for (const [a, b] of coeffs)
      q(
        `Prove that (1,0,${a}) and (0,1,${b}) are independent, then describe precisely what they span.`,
        `A combination with coefficients s,t is (s,t,${a}s+(${b})t). If it is zero, the first two coordinates force s=t=0. The span consists exactly of vectors with third coordinate ${a} times the first plus ${b} times the second. It is a plane, not the whole three-dimensional space.`,
      );
    begin(2, 'homogeneous constraints as subspaces');
    for (const [a, b] of coeffs)
      q(
        `Determine whether the vectors (x,y,z) satisfying x+${a}y+${b}z=0 form a subspace. Check all defining requirements.`,
        `Zero satisfies the equation. Adding two satisfying equations gives the same zero constraint for the sum; scaling a satisfying equation by any real number gives zero again. Thus addition and scalar multiplication stay inside. The set is a subspace.`,
      );
    begin(2, 'nonhomogeneous sets fail the zero test');
    for (const c of [1, 2, -1, 3, -2, 4])
      q(
        `Is the set of vectors (x,y,z) satisfying x+2y-z=${c} a subspace of real three-dimensional space? Give a decisive reason.`,
        `No. The zero vector makes the left side zero, not ${c}. Every subspace must contain zero. This nonzero offset cannot be ignored.`,
      );
    begin(3, 'independence from echelon structure');
    for (const [m, n, r] of [
      [3, 2, 2],
      [2, 3, 2],
      [4, 3, 2],
      [3, 3, 3],
      [2, 2, 1],
      [4, 4, 0],
    ])
      q(
        `An ${m}-by-${n} matrix has ${r} pivot columns after elimination. Are its columns independent? How many free variables occur in the homogeneous coefficient system?`,
        `There are ${n - r} free variables. ${r === n ? 'No variable is free, so the zero solution is the only homogeneous solution and the columns are independent.' : 'A free variable can be chosen nonzero, giving a nontrivial zero combination; the columns are dependent.'}`,
      );
    begin(3, 'coefficient space versus output space');
    for (const [m, n] of [
      [2, 3],
      [3, 2],
      [4, 3],
      [2, 4],
      [1, 3],
      [3, 4],
    ])
      q(
        `You place ${n} vectors from real ${m}-dimensional space into matrix columns. State the size of the matrix, the number of components in a dependence coefficient list, and the number of components in the resulting combination.`,
        `The matrix is ${m} by ${n}. A coefficient list has ${n} components, one per supplied vector. The combination has ${m} components in the output space. A dependence equation asks a nonzero coefficient list to produce the ${m}-component zero vector.`,
      );
    task(2, 'subspace proofs and counterexamples', [
      [
        'Prove that the intersection of two subspaces of the same real coordinate space is a subspace.',
        'Zero belongs to both. Sums and scalar multiples of vectors belonging to both stay in both by each subspace’s closure properties. Therefore they stay in the intersection.',
      ],
      [
        'Show that the union of two subspaces need not be a subspace.',
        'The coordinate axes are each subspaces, but their union contains (1,0) and (0,1) without their sum (1,1). Closure under addition fails.',
      ],
      [
        'Is the set consisting only of zero a subspace? Check the operations.',
        'Yes. It contains zero, adding its only vector to itself gives zero, and scaling it by any real scalar gives zero.',
      ],
      [
        'Show that vectors with nonnegative coordinates need not form a subspace even though their sums remain nonnegative.',
        'The vector (1,0) is included, but its scalar multiple (-1,0) is not. Closure under all real scalars fails.',
      ],
      [
        'Prove the null space of a matrix is closed under addition.',
        'If Au=0 and Av=0, then A(u+v)=Au+Av=0, so the sum is in the null space.',
      ],
      [
        'Why is the column space a subspace without checking its entries one target at a time?',
        'It is the span of the columns. Zero coefficients produce zero; adding and scaling combinations produces more combinations.',
      ],
      [
        'Why do row operations preserve row space?',
        'New rows are combinations of old rows, giving one inclusion of spans. Invertibility of each row operation gives the reverse inclusion.',
      ],
      [
        'For a two-by-four matrix, in which coordinate spaces do its row space, column space, and null space lie?',
        'The row space and null space lie in real four-dimensional input space. The column space lies in real two-dimensional output space.',
      ],
    ]);
    task(3, 'dependence and spanning arguments', [
      [
        'Give three plane vectors that are pairwise nonparallel but collectively dependent.',
        'Use (1,0),(0,1),(1,1). No pair is parallel, but the third is the sum of the first two.',
      ],
      [
        'Prove that a subset of an independent collection is independent.',
        'Any nontrivial zero combination in the subset would extend to the whole collection by giving omitted vectors coefficient zero, contradicting independence.',
      ],
      [
        'Prove that adding a vector outside the span of an independent list preserves independence.',
        'In a zero combination, a nonzero coefficient on the new vector would express it using the old list, contradicting the outside-span assumption. Its coefficient is therefore zero, and independence forces all the old coefficients to vanish.',
      ],
      [
        'Why must four vectors in real three-dimensional space be dependent?',
        'Their homogeneous coefficient system has four unknown coefficients but at most three pivots. It has a nontrivial solution, which is a dependence relation.',
      ],
      [
        'If a list is dependent, does deleting an arbitrary one of its vectors always preserve its span? Give a counterexample.',
        'No. From (1,0),(2,0),(0,1), deleting (0,1) loses the vertical direction. One must delete a vector expressible through the retained ones.',
      ],
      [
        'Explain why adding a vector already in the span does not enlarge that span.',
        'Substitute its existing combination whenever it occurs in a new combination. Every new output is still a combination of the old list; the reverse inclusion is immediate.',
      ],
      [
        'Can an independent list fail to span the intended space? Give a specific example with the space named.',
        'Yes. The single vector (1,0) is independent but does not span the real coordinate plane, since it cannot produce (0,1).',
      ],
      [
        'Explain why two different representations of one output imply dependence of the supplied vectors.',
        'Subtract the representations. Their different coefficient lists give a nonzero difference list producing zero, which is exactly dependence.',
      ],
    ]);
  }
  if (li === 5) {
    begin(0, 'coordinates in an ordered basis');
    for (const [a, b] of coeffs) {
      const x = [a + b, a - b];
      q(
        `Find the coordinates of ${v(x)} in the ordered basis p=(1,1), q=(1,-1). Reconstruct the original vector.`,
        `The coefficients c,d satisfy c+d=${x[0]}, c-d=${x[1]}, so c=${a},d=${b}. The basis-coordinate list is ${v([a, b])}; its reconstruction ${a}p+(${b})q is ${v(x)}.`,
        {
          kind: 'combination',
          vectors: [
            [1, 1],
            [1, -1],
          ],
          coefficients: [a, b],
          expected: x,
        },
      );
    }
    begin(0, 'bases for planes');
    for (const [a, b] of coeffs)
      q(
        `Give a basis and dimension for the subspace consisting of (x,y,z) with z=${a}x+${b}y. Prove both spanning and independence.`,
        `Every vector equals x${v([1, 0, a])}+y${v([0, 1, b])}. These two vectors span, and their first two coordinates force both coefficients to zero in a zero combination. They form a basis, and the dimension is two.`,
      );
    begin(1, 'rank-nullity and ambient bounds');
    for (const [m, n, r] of [
      [3, 5, 2],
      [4, 3, 3],
      [2, 4, 1],
      [3, 3, 0],
      [4, 4, 2],
      [2, 3, 2],
    ])
      q(
        `An ${m}-by-${n} matrix has rank ${r}. Find its nullity, the dimensions of its row and column spaces, and whether it has full row or full column rank.`,
        `Nullity is ${n}-${r}=${n - r}. Both row and column spaces have dimension ${r}. ${r === m ? 'It has full row rank.' : 'It does not have full row rank.'} ${r === n ? 'It has full column rank.' : 'It does not have full column rank.'}`,
      );
    begin(1, 'explicit column and null-space bases');
    for (const [a, b] of coeffs) {
      const A = [
        [1, 0, a],
        [0, 1, b],
      ];
      q(
        `For A with rows ${rows(A)}, give a basis of its column space and a basis of its null space. Verify both dimensions.`,
        `The first two original columns, (1,0),(0,1), form a column-space basis. The homogeneous equations give x=-(${a})z and y=-(${b})z, so ${v([-a, -b, 1])} alone is a null-space basis. Rank two plus nullity one equals three columns.`,
        {
          kind: 'spaces',
          a: A,
          columnBasis: [
            [1, 0],
            [0, 1],
          ],
          nullBasis: [[-a, -b, 1]],
          rank: 2,
        },
      );
    }
    begin(1, 'row reduction does not preserve column vectors');
    for (const k of [1, 2, -1, 3, -2, 4]) {
      const a = [
        [1, 2],
        [k, 2 * k],
      ];
      q(
        `A has rows ${rows(a)}. Reduce it and give a column-space basis from the original matrix. Explain why (1,0) from the reduced matrix is the wrong column-space basis here.`,
        `Subtract ${k} times row one from row two. The first column is the pivot column, so the original vector (1,${k}) is a basis. Reduced column (1,0) points along a different line because ${k} is nonzero; it describes the reduced matrix's column space, not A's.`,
        { kind: 'spaces', a, columnBasis: [[1, k]], nullBasis: [[-2, 1]], rank: 1 },
      );
    }
    begin(2, 'two-by-two inverses');
    for (const [a, b, c, d] of [
      [1, 2, 0, 1],
      [2, 1, 1, 1],
      [1, -1, 2, 1],
      [0, 1, 1, 0],
      [3, 0, 0, 2],
      [2, 3, 1, 2],
    ]) {
      const A = [
          [a, b],
          [c, d],
        ],
        det = a * d - b * c,
        inv = [
          [frac(d, det), frac(-b, det)],
          [frac(-c, det), frac(a, det)],
        ];
      q(
        `Find the inverse of A with rows ${rows(A)}. Compute its determinant and verify the proposed inverse by multiplication.`,
        `The determinant is ${a} times ${d} minus (${b}) times (${c}) = ${det}, nonzero. Swap the diagonal entries, negate the off-diagonal entries, and divide by ${det}, giving rows ${rows(inv)}. Both products give the identity.`,
        { kind: 'inverse', a: A, expected: inv, det },
      );
    }
    begin(2, 'determinant and area');
    for (const [u, w] of pairs.filter(([a]) => a.length === 2)) {
      const det = u[0] * w[1] - u[1] * w[0];
      q(
        `A has plane columns ${v(u)} and ${v(w)}. Find its determinant, the area of their parallelogram, and whether A is invertible.`,
        `The determinant is ${det}; the area is its absolute value, ${Math.abs(det)}. ${det ? 'Nonzero area means two independent directions and an inverse.' : 'The columns collapse into one line or zero, so there is no inverse.'}`,
        { kind: 'determinant', a: tr([u, w]), expected: det },
      );
    }
    begin(3, 'existence versus uniqueness');
    for (const [m, n, r] of [
      [3, 2, 2],
      [2, 3, 2],
      [3, 3, 3],
      [3, 3, 2],
      [2, 4, 1],
      [4, 2, 1],
    ])
      q(
        `For an ${m}-by-${n} matrix of rank ${r}, decide whether every output is reachable and whether a reachable output has a unique input. Justify separately.`,
        `${r === m ? 'Every output is reachable because rank equals the number of rows.' : 'Some outputs are missed because the column-space dimension is smaller than the number of rows.'} ${r === n ? 'A reachable output has a unique input because nullity is zero.' : `Every reachable output has infinitely many inputs because nullity is ${n - r}>0.`}`,
      );
    begin(3, 'solving with a known inverse');
    for (const [x, y] of coeffs) {
      const A = [
          [2, 1],
          [1, 1],
        ],
        b = mv(A, [x, y]);
      q(
        `A has rows (2,1),(1,1), with inverse rows (1,-1),(-1,2). Solve Ax=${v(b)} using that inverse and check the result in A.`,
        `Multiplying the inverse by the right-hand side gives ${v([x, y])}. Applying A returns ${v(b)}. Knowing the inverse allows this calculation; for an unknown inverse and one system, direct elimination would also work.`,
        { kind: 'unique-system', a: A, b, expected: [x, y] },
      );
    }
    task(3, 'basis rank inverse reasoning', [
      [
        'Give a basis for the zero-only subspace. Why is the list containing zero not a basis?',
        'The empty list is a basis and the dimension is zero. A list containing zero is dependent, so it is not a basis.',
      ],
      [
        'If a list spans a subspace but is dependent, explain how a basis can be extracted.',
        'Find a vector expressible through the others and remove it without changing the span. Repeat until the remaining spanning list is independent.',
      ],
      [
        'Why must coordinates in an ordered basis be unique?',
        'Subtracting two different coefficient representations would give a nontrivial zero combination of the basis vectors, contradicting independence.',
      ],
      [
        'Can a two-by-five matrix have rank three? Explain.',
        'No. Rank is at most the number of rows, two, as well as at most the number of columns.',
      ],
      [
        'Prove the inverse of AB is B inverse times A inverse when both square matrices are invertible.',
        'Multiplying AB by B inverse A inverse cancels the middle pair and then the outer pair to give identity. The reverse product similarly gives identity.',
      ],
      [
        'Why is entrywise reciprocal not the general matrix inverse? Give a simple obstruction.',
        'An invertible identity matrix contains zero entries, whose reciprocals are undefined. More generally matrix inverse is defined through matrix products, not independent entry products.',
      ],
      [
        'An n-by-n matrix has a nonzero null vector. Prove it has no inverse.',
        'If Az=0 and A inverse existed, multiplying would give z=0, contradicting the nonzero choice.',
      ],
      [
        'Explain why an inverse is unique if it exists.',
        'If B and C both invert A, then B=B(AC)=(BA)C=C using associativity and both identity equations.',
      ],
      [
        'Can vectors be a basis of a proper subspace but fail to be a basis of the ambient space? Give an example.',
        'The single vector (1,0,0) is a basis of the first coordinate axis but does not span the full three-dimensional space.',
      ],
      [
        'Why do nonzero echelon rows form a row-space basis?',
        'Reversible row operations preserve the row span. Distinct leading positions make the nonzero echelon rows independent, so they both span and are independent.',
      ],
      [
        'If A has full column rank, why does Ax=b have at most one solution even when it is inconsistent for some b?',
        'Full column rank gives zero-only null space. The difference of any two solutions would be a null vector and must vanish. This uniqueness argument does not establish existence.',
      ],
      [
        'Does determinant magnitude two imply every vector has its length doubled? Give a counterexample.',
        'No. The diagonal matrix with entries two and one has determinant two but leaves the second standard vector’s length unchanged. The determinant magnitude scales area in the plane.',
      ],
    ]);
  }
  if (li === 6) {
    begin(0, 'linearity proofs for coordinate rules');
    for (const a of mats)
      q(
        `Define T(x)=Ax for A with rows ${rows(a)}. State the input and output coordinate spaces and prove both linearity properties for arbitrary compatible vectors.`,
        `Inputs have ${a[0].length} components and outputs ${a.length}. Each row dot product distributes across u+v, so A(u+v)=Au+Av. Scalar factors can be taken outside each row's sum, so A(cu)=cAu. Both identities hold for every real c and every input pair.`,
      );
    begin(0, 'nonlinearity by a decisive counterexample');
    for (const c of [1, 2, -1, 3, -2, 4])
      q(
        `Is T(x,y)=(x squared, ${c}y) linear? Check the zero test and give a decisive argument.`,
        `Zero maps to zero, but T(1,0)+T(1,0)=(2,0) while T(2,0)=(4,0). Additivity fails regardless of the second coefficient ${c}. The zero test alone is insufficient.`,
      );
    begin(1, 'constructing maps from basis outputs');
    for (const a of mats) {
      const x = a[0].map((_, i) => i + 1);
      q(
        `A linear map sends successive standard basis inputs to ${rows(tr(a))}. Write its matrix and compute its output on ${v(x)}.`,
        `Use the given output vectors as columns, giving rows ${rows(a)}. The output on ${v(x)} is ${v(mv(a, x))}, the corresponding column combination.`,
        { kind: 'mv', a, x, expected: mv(a, x) },
      );
    }
    begin(1, 'geometric linear maps');
    for (const [name, a] of [
      [
        'reflection across the horizontal axis',
        [
          [1, 0],
          [0, -1],
        ],
      ],
      [
        'reflection across the vertical axis',
        [
          [-1, 0],
          [0, 1],
        ],
      ],
      [
        'counterclockwise right-angle rotation',
        [
          [0, -1],
          [1, 0],
        ],
      ],
      [
        'clockwise right-angle rotation',
        [
          [0, 1],
          [-1, 0],
        ],
      ],
      [
        'projection onto the horizontal axis',
        [
          [1, 0],
          [0, 0],
        ],
      ],
      [
        'projection onto the vertical axis',
        [
          [0, 0],
          [0, 1],
        ],
      ],
    ])
      q(
        `Find the matrix of ${name} by tracking the two standard basis vectors. Apply it to (2,3).`,
        `The standard inputs go to ${rows(tr(a))}, so the rows are ${rows(a)}. Applying it to (2,3) gives ${v(mv(a, [2, 3]))}.`,
        { kind: 'mv', a, x: [2, 3], expected: mv(a, [2, 3]) },
      );
    begin(2, 'kernel image and injectivity');
    for (const [a, b] of coeffs) {
      const A = [
        [1, 0, a],
        [0, 1, b],
      ];
      q(
        `For T(x,y,z)=(x+${a}z,y+${b}z), find kernel and image. Is it injective? Is it surjective onto the coordinate plane?`,
        `The kernel is all multiples of ${v([-a, -b, 1])}, so it is not injective. Any target (r,s) is reached from (r,s,0), so the image is the whole plane and the map is surjective.`,
        {
          kind: 'spaces',
          a: A,
          columnBasis: [
            [1, 0],
            [0, 1],
          ],
          nullBasis: [[-a, -b, 1]],
          rank: 2,
        },
      );
    }
    begin(2, 'embeddings and declared codomains');
    for (const [a, b] of coeffs)
      q(
        `For T(x,y)=(x,y,${a}x+${b}y), find the kernel and image. Compare surjectivity when the codomain is three-dimensional space versus the image plane.`,
        `The first two coordinates force zero-only kernel, so the map is injective. Its image is the plane with third coordinate ${a} times the first plus ${b} times the second. It is not onto the full three-dimensional space but is onto that plane if the plane is declared as codomain.`,
      );
    begin(3, 'change of basis through basis images');
    for (const [a, b] of [
      [2, 1],
      [3, -1],
      [0, 2],
      [-2, 4],
      [1, 1],
      [-1, -1],
    ]) {
      const C = [
        [frac(a + b, 2), frac(a - b, 2)],
        [frac(a - b, 2), frac(a + b, 2)],
      ];
      q(
        `A multiplies the first standard coordinate by ${a} and the second by ${b}. Find its matrix in the ordered basis (1,1),(1,-1), using that basis for input and output.`,
        `The first basis vector goes to (${a},${b}), whose basis coordinates are ${v(C.map((r) => r[0]))}. The second goes to (${a},${-b}), whose basis coordinates are ${v(C.map((r) => r[1]))}. These are the columns, so the new rows are ${rows(C)}.`,
        {
          kind: 'similarity',
          a: [
            [a, 0],
            [0, b],
          ],
          p: [
            [1, 1],
            [1, -1],
          ],
          expected: C,
        },
      );
    }
    begin(3, 'affine offsets and the origin');
    for (const b of [
      [1, 0],
      [0, 2],
      [-1, 3],
      [2, 2],
      [0, 0],
      [-3, -1],
    ])
      q(
        `Consider T(x,y)=(2x+y, y)+${v(b)}. Is it linear or only affine? Explain using the defining distinction.`,
        `${b.some(Boolean) ? `It is affine but not linear: T(0,0)=${v(b)} is nonzero.` : 'It is linear because the offset is zero and the remaining rule is a matrix rule.'} An affine rule is a linear matrix rule plus a fixed offset.`,
      );
    task(3, 'transformation arguments', [
      [
        'Prove any linear map sends zero to zero using additivity.',
        'T(0)=T(0+0)=T(0)+T(0). Subtract T(0) to obtain T(0)=0.',
      ],
      [
        'Prove that a linear map with zero-only kernel is injective.',
        'If T(u)=T(v), then T(u-v)=0. The kernel condition forces u-v=0, so u=v.',
      ],
      [
        'Prove that a nonzero kernel vector disproves injectivity.',
        'That nonzero vector and zero are distinct inputs with the same output zero.',
      ],
      [
        'Can changing a map’s codomain remove a nonzero kernel? Explain.',
        'No. The kernel depends on which inputs the unchanged rule sends to zero. Changing the declared output set can affect surjectivity but does not restore lost inputs.',
      ],
      [
        'Explain why an endomorphism with the same new basis on both sides uses P inverse A P rather than P A P inverse.',
        'New input coordinates first convert to standard coordinates through P, A acts next, and P inverse converts the standard output back. Products act from right to left.',
      ],
      [
        'For a rectangular map with separate new input and output bases, which basis matrix goes on each side?',
        'The input basis matrix goes on the right to convert input coordinates into standard coordinates. The inverse output basis matrix goes on the left to convert the result into the new output coordinates.',
      ],
      [
        'Give a linear map that changes angles.',
        'A shear (x,y) mapped to (x+y,y) sends perpendicular standard directions to (1,0) and (1,1), which are not perpendicular. It is a matrix rule and hence linear.',
      ],
      [
        'Give a linear map that loses information and explain exactly what is lost.',
        'Projection (x,y) mapped to (x,0) erases y. All inputs with the same x have the same output; the vertical axis is its kernel.',
      ],
      [
        'Prove that composing two linear maps gives a linear map.',
        'Apply the first map’s additivity and then the second’s to the sum, and likewise apply homogeneity successively. Both defining identities survive composition.',
      ],
      [
        'Why can a linear map be specified by its values on a basis?',
        'Every input has a unique basis-coordinate combination. Linearity forces its output to be the same combination of the specified basis outputs.',
      ],
      [
        'A function preserves straight lines. Must it be linear in the linear-algebra sense?',
        'No. A nonzero translation preserves straight lines but sends zero to a nonzero point and is therefore affine, not linear.',
      ],
      [
        'Why can a change of coordinates create off-diagonal entries without changing the underlying transformation?',
        'The new basis directions can each have components along several of the old scaling directions. Expressing their images in the new basis then mixes coordinate coefficients even though the geometric rule is unchanged.',
      ],
    ]);
  }
  if (li === 7) {
    begin(0, 'line projection and orthogonal residual');
    for (const [u, b] of pairs) {
      const den = dot(u, u),
        num = dot(u, b),
        p = u.map((x) => frac(num * x, den)),
        r = b.map((x, i) => frac(x * den - num * u[i], den));
      q(
        `Project b=${v(b)} onto the line spanned by u=${v(u)}. Give the scalar coefficient, projected vector, and residual b minus projection. Check orthogonality.`,
        `The coefficient is ${num}/${den}=${frac(num, den)}. Projection is ${v(p)} and residual ${v(r)}. Taking its dot product with u gives zero because the numerator is (b dot u)(u dot u) minus itself.`,
        { kind: 'projection', u, b, expected: p, residual: r },
      );
    }
    begin(0, 'projection independent of spanning scale');
    for (const c of [2, -1, 3, -2, 4, -3])
      q(
        `Project b=(3,1) onto the line generated by u=${v([c, c])}. Compare the result with projection using (1,1).`,
        `The coefficient for u is ${frac(4 * c, 2 * c * c)}, producing (2,2). Using (1,1) gives coefficient two and the same point. The nonzero rescaling changes the coefficient but not the line or projection.`,
        { kind: 'projection', u: [c, c], b: [3, 1], expected: [2, 2], residual: [1, -1] },
      );
    begin(1, 'orthonormal projection onto coordinate subspaces');
    for (const b of [
      [1, 2, 3],
      [-2, 1, 4],
      [0, 3, -1],
      [4, -2, 0],
      [2, 2, 2],
      [-1, -3, 2],
    ])
      q(
        `The orthonormal columns of Q are (1,0,0) and (0,0,1). Project ${v(b)} onto their span. Give Q transpose b and the residual.`,
        `Q transpose b gives coefficients ${v([b[0], b[2]])}. The projection is ${v([b[0], 0, b[2]])}; the residual is ${v([0, b[1], 0])}, perpendicular to both columns.`,
        {
          kind: 'projection-space',
          a: [
            [1, 0],
            [0, 0],
            [0, 1],
          ],
          b,
          expected: [b[0], 0, b[2]],
        },
      );
    begin(1, 'Gram-Schmidt with exact perpendicular remainders');
    for (const [a, b] of [
      [1, 1],
      [2, 1],
      [-1, 2],
      [3, -1],
      [1, -2],
      [-2, -1],
    ]) {
      const u = [1, 0, 0],
        w = [a, b, 1],
        rem = [0, b, 1];
      q(
        `Apply Gram–Schmidt to the ordered vectors (1,0,0) and ${v(w)}. Give the orthonormal vectors and verify that the span is unchanged.`,
        `The first vector already has unit length. Subtract its projection (${a},0,0) from the second, leaving ${v(rem)}. Divide that remainder by square root of ${b * b + 1} for the second unit vector. It is perpendicular to the first, and the original second vector is ${a} times the first plus square root of ${b * b + 1} times the second unit vector.`,
        { kind: 'gram-schmidt', a: [u, w], remainders: [u, rem] },
      );
    }
    begin(2, 'least-squares constant models');
    for (const b of [
      [1, 2, 6],
      [2, 4, 9],
      [-1, 0, 4],
      [3, 3, 3],
      [0, 0, 6],
      [2, -2, 3],
    ]) {
      const n = b.length,
        sum = b.reduce((a, b) => a + b, 0),
        c = frac(sum, n),
        p = b.map(() => c),
        r = b.map((x) => frac(n * x - sum, n));
      q(
        `Fit one constant c to observations ${v(b)} by least squares. Derive the normal equation and give fitted values and residual.`,
        `With a column of ${n} ones, the normal equation is ${n}c=${sum}. Thus c=${c}, fitted values ${v(p)}, residual ${v(r)}. Its components sum to zero, establishing orthogonality to the constant column.`,
        { kind: 'least-squares', a: b.map(() => [1]), b, x: [c], expected: p },
      );
    }
    begin(2, 'line fits with slope and intercept');
    for (const b of [
      [1, 2, 2],
      [0, 1, 3],
      [2, 0, 1],
      [3, 3, 3],
      [-1, 1, 2],
      [2, 4, 6],
    ]) {
      const sum = b.reduce((a, b) => a + b, 0),
        slope = frac(b[2] - b[0], 2),
        intercept = frac(2 * sum - 3 * (b[2] - b[0]), 6),
        fit = [0, 1, 2].map((t) => frac(2 * sum - 3 * (b[2] - b[0]) + 3 * t * (b[2] - b[0]), 6));
      q(
        `Fit c+dt to observations at t=0,1,2 with measured values ${v(b)}. Set up and solve the two normal equations, then give the fitted output.`,
        `The design rows are (1,0),(1,1),(1,2). The normal equations are 3c+3d=${sum} and 3c+5d=${b[1] + 2 * b[2]}. Subtracting gives 2d=${b[2] - b[0]}, so d=${slope} and c=${intercept}. Fitted values are ${v(fit)}; subtracting them from observations gives a residual orthogonal to both design columns.`,
        {
          kind: 'least-squares',
          a: [
            [1, 0],
            [1, 1],
            [1, 2],
          ],
          b,
          x: [intercept, slope],
          expected: fit,
        },
      );
    }
    begin(2, 'rank-deficient least squares');
    for (const b of [
      [1, 3],
      [2, 4],
      [-1, 2],
      [0, 4],
      [3, 3],
      [-2, -4],
    ]) {
      const c = frac(b[0] + b[1], 2);
      q(
        `A has rows (1,1),(1,1) and b=${v(b)}. Describe every least-squares coefficient vector and the unique fitted output.`,
        `Only the sum x1+x2 matters. Its best constant value is ${c}. All coefficients (${c}-t,t), t real, give fitted output (${c},${c}). The residual is perpendicular to (1,1). The coefficient vector is not unique even though this fitted output is.`,
        {
          kind: 'least-squares',
          a: [
            [1, 1],
            [1, 1],
          ],
          b,
          x: [c, 0],
          expected: [c, c],
        },
      );
    }
    begin(3, 'checking a proposed least-squares fit');
    for (const b of [
      [1, 2],
      [2, 0],
      [3, 1],
      [-1, 2],
      [0, 3],
      [4, -2],
    ]) {
      const c = frac(b[0] + 2 * b[1], 5),
        p = [frac(b[0] + 2 * b[1], 5), frac(2 * (b[0] + 2 * b[1]), 5)];
      q(
        `A has one column (1,2). A proposed coefficient for target ${v(b)} is ${c}. Verify that it is a least-squares solution by checking the residual rather than merely repeating the formula.`,
        `The output is ${v(p)}. Subtract it from b and take the dot product with (1,2): the result is b1+2b2-5 times (${c})=0. The residual is orthogonal to the whole one-column span, so the output is the closest point.`,
        { kind: 'least-squares', a: [[1], [2]], b, x: [c], expected: p },
      );
    }
    task(3, 'projection and fitting arguments', [
      [
        'Prove that the perpendicular projection onto a line is the unique closest point using the Pythagorean theorem.',
        'For projected point p and any other line point q, b-p is perpendicular to p-q. Thus the squared distance from b to q equals the squared residual length plus the nonnegative squared distance from p to q. Equality requires q=p.',
      ],
      [
        'What happens if Gram–Schmidt encounters a zero remainder? Why must you not normalize it?',
        'The current input lies in the span of previously retained directions, so it adds no independent direction. Its norm is zero and division is undefined; discard the redundant direction or handle dependence explicitly.',
      ],
      [
        'For a matrix Q with orthonormal columns, why can Q transpose Q be identity while Q Q transpose is not?',
        'The first product records pairwise dot products of the columns and is identity. The reverse product projects onto their span, which may be a proper subspace of the output space.',
      ],
      [
        'Does a zero least-squares residual prove the model is scientifically valid? Explain.',
        'It proves exact fit to these observations under this model, not a causal interpretation or valid extrapolation. A model can fit finite observations and still be unsuitable elsewhere.',
      ],
      [
        'Why are the normal equations still valid for dependent columns?',
        'A closest output has residual perpendicular to the entire column space, equivalent to A transpose times residual equal to zero. This characterization does not require unique coefficients.',
      ],
      [
        'Prove A transpose A is invertible when A has independent columns.',
        'If A transpose A x=0, multiply by x transpose to get squared norm of Ax equal to zero. Then Ax=0, and independent columns force x=0. The square matrix has zero-only null space and is invertible.',
      ],
      [
        'Why does the residual convention matter even though either sign gives the same squared error?',
        'The squared norm is unchanged by negation, but a reported residual component’s sign indicates whether the observation is above or below its fitted value under the chosen convention. Here residual is observation minus fitted output.',
      ],
      [
        'A fit minimizes squared error. Does it necessarily minimize the sum of absolute errors? Explain.',
        'No. Those are different objectives and can prefer different fits. For observations zero, zero, and six, squared-error constant fitting gives two, while zero has smaller total absolute error than two.',
      ],
      [
        'Why can one large residual strongly influence least squares?',
        'Squaring gives disproportionately large contributions to large discrepancies. This is a property of the chosen loss, not an arithmetic mistake.',
      ],
      [
        'What does QR factorization separate in a full-column-rank model matrix?',
        'Q contains orthonormal directions spanning the same column space, while upper-triangular R contains the coefficients reconstructing the original columns from those directions.',
      ],
      [
        'If b is already in the permitted subspace, what are its orthogonal projection and residual?',
        'The projection is b itself, giving residual zero and the smallest possible squared distance.',
      ],
      [
        'If b is perpendicular to every vector in the permitted subspace, what is its projection?',
        'Zero. Its residual is b, already perpendicular to the subspace; every nonzero candidate adds a positive squared distance term.',
      ],
    ]);
  }
  if (li === 8) {
    begin(0, 'checking eigenvectors directly');
    for (const [a, b] of [
      [2, 3],
      [-1, 2],
      [0, 4],
      [3, 3],
      [-2, -2],
      [1, -1],
    ])
      q(
        `A is diagonal with entries ${a},${b}. Test (1,0), (0,1), and (1,1) for being eigenvectors; state each associated eigenvalue when applicable.`,
        `The standard vectors have eigenvalues ${a} and ${b}. The vector (1,1) goes to (${a},${b}); ${a === b ? `it is an eigenvector with eigenvalue ${a}.` : 'the two scale factors differ, so it is not an eigenvector.'}`,
        {
          kind: 'diagonal-eigen',
          a: [
            [a, 0],
            [0, b],
          ],
          values: [a, b],
        },
      );
    begin(1, 'distinct triangular eigenvalues and directions');
    for (const [a, d, k] of [
      [2, 3, 1],
      [4, 2, 1],
      [-1, 2, 2],
      [0, 3, -1],
      [3, -2, 1],
      [1, 4, -2],
    ]) {
      const A = [
          [a, k],
          [0, d],
        ],
        w = [k, d - a];
      q(
        `Find every eigenvalue and a nonzero vector in each eigenspace of A with rows ${rows(A)}. Use the determinant equation and verify the vectors in A.`,
        `The characteristic polynomial is (${a}-lambda)(${d}-lambda), giving distinct roots ${a},${d}. For ${a}, use (1,0). For ${d}, use ${v(w)} because (${a}-${d})x+${k}y=0. Each eigenspace is the line spanned by its listed vector.`,
        { kind: 'eigen', a: A, values: [a, d], vectors: [[1, 0], w] },
      );
    }
    begin(1, 'symmetric two-by-two eigenspaces');
    for (const [a, b] of [
      [2, 1],
      [3, 2],
      [1, -2],
      [0, 3],
      [-1, 1],
      [4, -1],
    ]) {
      const A = [
        [a, b],
        [b, a],
      ];
      q(
        `Find the eigenvalues and eigenspaces for A with rows ${rows(A)}. Show why the two displayed directions can be chosen perpendicular.`,
        `The vectors (1,1) and (1,-1) have respective eigenvalues ${a + b} and ${a - b}. They span the two eigenspaces since the eigenvalues are distinct. Their dot product is zero; dividing each by square root of two gives an orthonormal eigenbasis.`,
        {
          kind: 'eigen',
          a: A,
          values: [a + b, a - b],
          vectors: [
            [1, 1],
            [1, -1],
          ],
        },
      );
    }
    begin(1, 'algebraic versus geometric multiplicity');
    for (const [a, k] of [
      [1, 0],
      [1, 2],
      [2, 0],
      [2, -1],
      [0, 3],
      [-2, 0],
    ])
      q(
        `For A with rows (${a},${k}),(0,${a}), find the only eigenvalue, its algebraic multiplicity, its eigenspace dimension, and whether A is diagonalizable.`,
        `The characteristic polynomial is (${a}-lambda) squared, so algebraic multiplicity is two. ${k === 0 ? 'A is scalar identity, so every vector lies in the eigenspace, its dimension is two, and a basis of eigenvectors exists.' : `The equation ${k}y=0 forces y=0. The eigenspace is the horizontal line with dimension one, so A is not diagonalizable.`}`,
        {
          kind: 'multiplicity',
          a: [
            [a, k],
            [0, a],
          ],
          value: a,
          geometric: k === 0 ? 2 : 1,
        },
      );
    begin(2, 'powers in eigenvector coordinates');
    for (const [a, b, k, c, d] of [
      [2, 3, 2, 1, 1],
      [2, -1, 3, 3, -2],
      [1, 0, 4, 2, 3],
      [-1, -2, 2, 1, -1],
      [3, 1, 3, -1, 2],
      [2, 1, 4, 0, 5],
    ])
      q(
        `Independent vectors u,v form a basis with Au=${a}u and Av=${b}v. Find A applied ${k} times to ${c}u+(${d})v and explain the coordinate calculation.`,
        `After ${k} applications the coefficients are ${c} times (${a}) to power ${k} and ${d} times (${b}) to power ${k}. The output is ${c * a ** k}u+(${d * b ** k})v. This uses the eigenvector basis, not an assumption about standard coordinates.`,
      );
    begin(2, 'reconstructing a diagonalization');
    for (const [a, b] of [
      [2, 3],
      [3, -1],
      [0, 2],
      [-2, 4],
      [1, 1],
      [-1, -1],
    ]) {
      const A = [
        [(a + b) / 2, (a - b) / 2],
        [(a - b) / 2, (a + b) / 2],
      ];
      q(
        `P has columns (1,1),(1,-1), and D is diagonal with entries ${a},${b}. Compute A=P D P inverse and verify both eigenvector equations.`,
        `P inverse has rows (1/2,1/2),(1/2,-1/2). The reconstructed A has rows ${rows(A)}. Its outputs on P's columns are ${a}(1,1) and ${b}(1,-1), matching the diagonal entries in order.`,
        {
          kind: 'eigen',
          a: A,
          values: [a, b],
          vectors: [
            [1, 1],
            [1, -1],
          ],
        },
      );
    }
    begin(3, 'growth decay and missing initial components');
    for (const [a, b, c, d] of [
      [2, 0.5, 1, 1],
      [3, 0.5, 0, 1],
      [1, -1, 2, 3],
      [-2, 0, 1, 4],
      [0.5, 0.25, 1, 1],
      [2, 1, 0, 2],
    ])
      q(
        `An eigenbasis u,v has scale factors ${a},${b}. The initial input is ${c}u+(${d})v. Describe each component after k positive integer steps and whether the largest-magnitude scale factor must dominate this particular input.`,
        `The components are ${c}(${a})^k u and ${d}(${b})^k v. A zero initial coefficient stays zero, regardless of its eigenvalue. Nonzero components grow if the magnitude exceeds one, decay if below one, and remain constant in magnitude if it equals one; negative factors alternate sign. Dominance cannot be inferred from a direction absent from the initial input.`,
      );
    task(3, 'eigenvalue structure and counterexamples', [
      [
        'Why can zero be an eigenvalue but not an eigenvector?',
        'A nonzero vector sent to zero supplies meaningful evidence of a kernel direction and eigenvalue zero. The zero vector satisfies every scalar eigenvector equation and identifies no distinguished direction.',
      ],
      [
        'Prove that nonzero scalar multiples of an eigenvector have the same eigenvalue.',
        'If Av=lambda v and c is nonzero, then A(cv)=cAv=lambda(cv). The new vector remains nonzero.',
      ],
      [
        'Prove two eigenvectors with distinct eigenvalues cannot be scalar multiples.',
        'If v=cu with c nonzero, applying A gives both c lambda u and c mu u. Since c and u are nonzero, the scalars must agree, contradicting distinctness.',
      ],
      [
        'Why does zero as an eigenvalue imply noninvertibility?',
        'Its nonzero eigenvector lies in the null space, contradicting the zero-only null space required for invertibility.',
      ],
      [
        'Does a repeated eigenvalue automatically prevent diagonalization? Give a counterexample.',
        'No. A scalar identity matrix has the repeated scalar eigenvalue but every standard vector is an eigenvector, forming a basis.',
      ],
      [
        'Does a real two-by-two matrix always have a real eigenvalue? Give an example supporting your answer.',
        'No. A right-angle rotation has characteristic polynomial lambda squared plus one, with no real roots. Every nonzero direction rotates off its own line.',
      ],
      [
        'Why is the zero vector included in an eigenspace?',
        'An eigenspace is a null space and therefore a subspace, so it includes zero. Eigenvectors are precisely its nonzero members.',
      ],
      [
        'Prove eigenvectors of a real symmetric matrix belonging to different eigenvalues are perpendicular.',
        'Symmetry makes u dot Av equal Au dot v. Substitution gives mu times u dot v equal lambda times u dot v. Distinct eigenvalues force u dot v=0.',
      ],
      [
        'If a matrix is diagonalizable, must its eigenvectors be perpendicular? Give a counterexample.',
        'No. Rows (2,1),(0,3) have independent eigenvectors (1,0),(1,1), whose dot product is one. They form an eigenbasis without being orthogonal.',
      ],
      [
        'What mistake occurs if P’s eigenvector columns and D’s eigenvalues are placed in different orders?',
        'Column equations AP=PD pair each column with the diagonal entry at the same position. A mismatched order generally scales a vector by the wrong eigenvalue and reconstructs a different matrix.',
      ],
      [
        'Why does checking one arbitrary vector that fails to be an eigenvector not prove the matrix has no eigenvectors?',
        'It only rules out that direction. Other directions may still satisfy their own eigenvalue equations.',
      ],
      [
        'Can a matrix with all eigenvalues one still fail to be identity? Give an example.',
        'Yes. The shear with rows (1,1),(0,1) has only eigenvalue one but sends (0,1) to (1,1), so it is not identity.',
      ],
    ]);
  }
  if (li === 9) {
    begin(0, 'full SVD rectangular dimensions');
    for (const [m, n] of [
      [3, 2],
      [2, 3],
      [4, 2],
      [2, 4],
      [3, 3],
      [1, 4],
    ])
      q(
        `For a real ${m}-by-${n} matrix, state the full SVD shapes of U, Sigma, V, and V transpose. How many diagonal positions does Sigma have, and how many columns does each full basis matrix contain?`,
        `U is ${m} by ${m}; Sigma ${m} by ${n}; V and its transpose ${n} by ${n}. There are ${Math.min(m, n)} diagonal positions. The full output basis has ${m} columns and the input basis ${n}. Extra input directions in a wide matrix can be erased even without a listed zero diagonal value.`,
      );
    begin(0, 'orthogonal factors versus stretches');
    for (const [a, b] of [
      [4, 2],
      [3, 1],
      [5, 0],
      [2, 2],
      [1, 0],
      [6, 3],
    ])
      q(
        `A full two-dimensional SVD has singular values ${a},${b}. Describe the possible output lengths of unit inputs at the strongest and weakest directions. Does either orthogonal factor cause these changes in length?`,
        `The maximum is ${a} and the minimum is ${b}. ${b === 0 ? 'A unit input in a null direction collapses to zero.' : 'These extrema occur along the corresponding right singular directions.'} Orthogonal U and V preserve length; Sigma produces the stretches.`,
      );
    begin(1, 'reconstructing supplied SVD factors');
    for (const [a, b] of [
      [3, 1],
      [4, 2],
      [2, 0],
      [5, 3],
      [1, 1],
      [6, 2],
    ]) {
      const A = [
          [0, a],
          [b, 0],
        ],
        x = [2, -1];
      q(
        `U is identity, Sigma is diagonal with entries ${a},${b}, and V swaps the two standard directions. Reconstruct A and find its output on ${v(x)}.`,
        `V transpose first swaps the coordinates. Sigma then scales them, so A has rows ${rows(A)} and the output is ${v(mv(A, x))}. The nonnegative diagonal entries are ordered as required.`,
        {
          kind: 'svd',
          a: A,
          u: [
            [1, 0],
            [0, 1],
          ],
          sigma: [
            [a, 0],
            [0, b],
          ],
          v: [
            [0, 1],
            [1, 0],
          ],
        },
      );
    }
    begin(1, 'signs and reflected singular directions');
    for (const [a, b] of [
      [-4, 2],
      [3, -1],
      [-2, -1],
      [0, -3],
      [-5, 0],
      [2, 2],
    ]) {
      const vals = [Math.abs(a), Math.abs(b)],
        order = vals[0] >= vals[1] ? [0, 1] : [1, 0],
        V = tr(order.map((i) => [0, 1].map((j) => (j === i ? 1 : 0)))),
        U = tr(order.map((i) => [0, 1].map((j) => (j === i ? Math.sign([a, b][i]) || 1 : 0)))),
        S = [
          [vals[order[0]], 0],
          [0, vals[order[1]]],
        ];
      q(
        `Give a valid SVD of the diagonal matrix with entries ${a},${b}, using nonnegative singular values in descending order. Explain how the original signs are retained.`,
        `One choice is U with rows ${rows(U)}, Sigma with rows ${rows(S)}, and V with rows ${rows(V)}. Permutations put the stretches in descending order; sign changes in U reconstruct negative original entries. Direct multiplication gives the original diagonal matrix.`,
        {
          kind: 'svd',
          a: [
            [a, 0],
            [0, b],
          ],
          u: U,
          sigma: S,
          v: V,
        },
      );
    }
    begin(2, 'rank nullity including wide matrices');
    for (const [m, n, diag] of [
      [2, 3, [3, 2]],
      [3, 2, [4, 0]],
      [3, 4, [5, 2, 0]],
      [4, 3, [3, 2, 1]],
      [2, 4, [2, 1]],
      [3, 3, [0, 0, 0]],
    ]) {
      const A = Array.from({ length: m }, (_, i) =>
          Array.from({ length: n }, (_, j) => (i === j ? diag[i] || 0 : 0)),
        ),
        r = diag.filter((x) => x > 0).length;
      q(
        `A is the ${m}-by-${n} rectangular diagonal matrix with diagonal ${v(diag)} and all other entries zero. Find rank, nullity, and all eigenvalues of A transpose A, counting zeros.`,
        `Rank is ${r}. Nullity is ${n - r}, from number of columns minus rank. A transpose A is ${n} by ${n} with diagonal ${v(Array.from({ length: n }, (_, i) => (diag[i] || 0) ** 2))}. In a wide matrix, extra zero eigenvalues arise from input directions beyond the rectangular diagonal.`,
        {
          kind: 'rank-spectrum',
          a: A,
          rank: r,
          ataEigen: Array.from({ length: n }, (_, i) => (diag[i] || 0) ** 2),
        },
      );
    }
    begin(2, 'left directions from positive singular values');
    for (const [a, b] of [
      [3, 1],
      [4, 2],
      [2, 0],
      [5, 3],
      [1, 1],
      [6, 2],
    ]) {
      const A = [
        [0, a],
        [b, 0],
      ];
      q(
        `For A with rows ${rows(A)}, the right singular vector (0,1) has positive singular value ${a}. Construct its left singular vector and verify its length and defining equation.`,
        `A(0,1)=(${a},0). Dividing by ${a} gives u=(1,0), which has norm one. The equation Av=${a}u holds. This construction is legal because ${a} is positive.`,
        { kind: 'singular-direction', a: A, right: [0, 1], left: [1, 0], sigma: a },
      );
    }
    begin(3, 'truncation errors at several ranks');
    for (const vals of [
      [6, 3, 1],
      [5, 2, 1],
      [4, 4, 2],
      [3, 1, 0],
      [7, 3, 2],
      [2, 2, 2],
    ]) {
      const err = vals[1] ** 2 + vals[2] ** 2;
      q(
        `A is diagonal with entries ${v(vals)} in descending order. Give one rank-at-most-one truncated SVD approximation, its exact Frobenius error, and the error after keeping two directions.`,
        `One approximation has diagonal (${vals[0]},0,0). The discarded squared entries sum to ${err}, so its Frobenius error is square root of ${err}. Keeping the first two gives error ${vals[2]}. If a cutoff splits tied positive singular values, other equally good choices can exist.`,
        { kind: 'truncation', values: vals, k: 1, errorSquared: err },
      );
    }
    begin(3, 'sensitivity of inverse scaling');
    for (const d of [2, 5, 10, 20, 50, 100])
      q(
        `A is diagonal with entries one and 1/${d}. If the second component of b changes by 1/${d}, with the first unchanged, how much does the recovered second component of the solution of Ax=b change? Relate this to the weak singular direction.`,
        `The second equation is x2/${d}=b2, so x2=${d}b2. The stated output change produces input change one. The smallest singular value is 1/${d}, and its reciprocal ${d} is the amplification in that inverse direction.`,
      );
    task(3, 'SVD interpretation and limits', [
      [
        'Can a two-by-three matrix have two positive listed singular values and still have a nontrivial null space? Explain.',
        'Yes. Its rank is two but it has three input coordinates, giving nullity one. Sigma has only two diagonal positions; the extra input direction is also erased.',
      ],
      [
        'Why must A transpose A have nonnegative eigenvalues?',
        'For a unit eigenvector v with eigenvalue lambda, lambda=v transpose A transpose A v, which is the squared norm of Av and is nonnegative. The symmetric spectral theorem supplies the eigenbasis.',
      ],
      [
        'Why do A transpose A and A A transpose have the same positive eigenvalues but potentially different numbers of zeros?',
        'Positive singular values contribute their squares to both. The two products act on input and output spaces of potentially different dimensions, so the leftover zero directions can differ.',
      ],
      [
        'Why is a negative eigenvalue compatible with a nonnegative singular value?',
        'Eigenvalues include direction reversal relative to the same input line. Singular values measure nonnegative lengths between independently chosen input and output directions; reversals belong in the orthogonal factors.',
      ],
      [
        'Is an SVD unique if two positive singular values are equal? Explain.',
        'Not generally. Orthonormal directions within the equal-stretch subspaces can be changed consistently without changing the matrix. Even simple sign changes can give multiple valid factors.',
      ],
      [
        'Why is division by a zero singular value not a method for constructing its left singular vector?',
        'The corresponding Av is zero, so the formula would be zero divided by zero. Remaining output directions must instead be chosen to complete an orthonormal basis.',
      ],
      [
        'If all positive singular directions are retained, what is the truncation error?',
        'Zero. No nonzero contribution is discarded, so the reconstructed matrix is exact.',
      ],
      [
        'Why is the Frobenius norm of a discarded diagonal (0,3,4) five rather than seven or twenty-five?',
        'The squared entries sum to 9+16=25; the norm is their square root, five. Seven is a sum of magnitudes and twenty-five is the squared norm.',
      ],
      [
        'Does the best low-rank approximation theorem prove that discarded features are irrelevant to the task?',
        'No. It minimizes a specified matrix error under a rank constraint. Scientific importance, causal meaning, and task-specific predictive value are separate judgments.',
      ],
      [
        'Can a zero matrix have an SVD? Describe one.',
        'Yes. Choose identity orthogonal factors of the required input and output sizes and a zero rectangular Sigma. The product is zero and all singular values are zero.',
      ],
      [
        'What does retaining zero directions produce, and what is its error?',
        'It produces the zero matrix. The error is the original matrix’s Frobenius norm, the square root of the sum of all squared singular values.',
      ],
      [
        'Explain why calling every orthogonal factor a rotation is too restrictive.',
        'A reflection also has orthonormal columns and preserves lengths and angles. Orthogonal matrices allow both orientation-preserving and orientation-reversing actions.',
      ],
      [
        'Can a real matrix without a real eigenbasis still have a real SVD? Explain the conceptual difference.',
        'Yes. The real SVD exists for every real matrix, using distinct orthonormal input and output bases. An eigenbasis requires the same directions to return as scalar multiples, a stronger and different condition.',
      ],
      [
        'Why can a finite singular-value tolerance change numerical rank without changing exact mathematical rank?',
        'Numerical rank treats sufficiently small computed values as effectively zero based on scale and rounding. Exact rank counts all exactly positive singular values, however small.',
      ],
      [
        'For a full-rank tall matrix, must every output direction be reachable? Explain.',
        'No. Full column rank means independent inputs are preserved, but when rows outnumber columns the image dimension is still smaller than the output space. Extra left basis directions are outside the image.',
      ],
      [
        'Why should a supplied SVD be checked for orthogonality as well as multiplication?',
        'Many factorizations multiply to A. An SVD additionally requires orthogonal U,V and nonnegative rectangular diagonal Sigma, which give its geometric and rank interpretations.',
      ],
    ]);
  }
}
