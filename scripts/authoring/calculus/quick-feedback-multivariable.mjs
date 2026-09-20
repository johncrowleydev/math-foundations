export default {
  'calculus-multivariable-functions': [
    [
      'Correct. The ordered pair supplies the two input coordinates; the function returns one scalar.',
      'These would be two outputs. A scalar function has one output for each permitted input pair.',
      'The height is the output on the graph. Its input is the pair of coordinates below it.',
    ],
    [
      'Coordinate partials inspect only the axes. A function can have both partials and still have incompatible diagonal limits.',
      'Correct. Existing coordinate partials do not control all approaches; the lesson gives a discontinuous counterexample.',
    ],
  ],
  'calculus-gradients': [
    [
      'The differential keeps only the linear terms. A finite displacement can also contribute quadratic or higher-order terms.',
      'Correct. It approximates the finite change to first order; equality needs additional information, such as an affine function.',
    ],
    [
      'This vector has length ten, so its dot product with the gradient gives a rate along a speed-ten path.',
      'Correct. Dividing both coordinates by ten gives a unit vector in the requested direction.',
      'Swapping coordinates changes the direction and still leaves a vector of length ten.',
    ],
  ],
  'calculus-multivariable-chain-rule': [
    [
      'Correct. Each changing coordinate contributes to the total first-order change, and those contributions add.',
      'Multiply derivatives along each dependency path, then add the different paths. Multiplying the complete contributions loses that sum.',
      'Both coordinates contribute, even when one contribution is smaller or has the opposite sign.',
    ],
    [
      'Correct. The original displacement first enters G, so its Jacobian is the rightmost factor in the product.',
      'F receives the intermediate output of G. Its Jacobian acts after the input displacement has passed through G.',
    ],
  ],
  'calculus-multivariable-extrema': [
    [
      'A minimum would require positive discriminant and positive first pure second derivative under this test.',
      'A maximum would require positive discriminant and negative first pure second derivative under this test.',
      'Correct. Negative discriminant gives both positive and negative quadratic changes, hence a saddle.',
    ],
    [
      'A zero discriminant does not exclude extrema: a sum of fourth powers has a minimum at the origin.',
      'Correct. The quadratic information is insufficient; inspect the function or higher-order terms.',
      'A minimum is possible but not guaranteed. A difference of fourth powers has a saddle with the same zero discriminant.',
    ],
  ],
  'calculus-double-integrals': [
    [
      'Correct. During the inner y integral, x is a fixed parameter; the outer integral will vary it later.',
      'The differential dy identifies y as the variable being integrated, so y varies during this step.',
      'An iterated integral varies one coordinate at a time. Letting both vary would not implement the stated inner integral.',
    ],
    [
      'The bounds usually change because horizontal and vertical slices describe the region differently.',
      'Correct. Reversing order changes the description of the same region, while preserving the function being accumulated.',
      'The inner variable changes when the order is reversed; preserving it would keep the original order.',
    ],
  ],
  'calculus-constrained-optimization': [
    [
      'The objective need not be zero. Its value is compared at feasible candidates.',
      'Correct. The original constraint is needed to ensure that the candidate lies in the feasible set.',
      'The multiplier is an unknown to solve for and need not vanish at an optimum.',
    ],
    [
      'A singular feasible point can still optimize the objective. Failure of the theorem’s hypothesis does not exclude it.',
      'Correct. Check the singular point directly or use a regular description of the feasible set.',
      'A zero constraint gradient says nothing by itself about whether the objective is constant.',
    ],
  ],
  'calculus-gradient-descent': [
    [
      'The gradient points toward greatest first-order increase, so adding a positive multiple normally moves uphill locally.',
      'Correct. Subtracting a positive multiple of the gradient gives the steepest first-order decrease in Euclidean coordinates.',
      'A fixed coordinate direction ignores the current objective sensitivities and is not the gradient-descent update.',
    ],
    [
      'For a nonconvex objective, a stationary point can be a saddle or local maximum; global minimality does not follow.',
      'Correct. A zero gradient makes the ordinary update displacement zero, whatever the objective value.',
      'Stationarity concerns derivatives. Adding a constant changes the loss value without changing its gradient.',
    ],
  ],
};
