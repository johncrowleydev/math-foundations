# Math Study Plan

Preparation for starting the CU Boulder online MS in Computer Science around January 2027.

The goal is not to recreate an entire undergraduate math curriculum before starting the degree. The goal is to build enough working fluency in the math most relevant to algorithms, computer science, and machine learning that graduate coursework can build on it directly.

## Study Materials

### Discrete mathematics and proofs

| Lesson                                                                                        | Worksheet source                                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 01. [Propositional Logic](../content/lessons/01-propositional-logic.md)                       | [YAML](../content/worksheets/01-propositional-logic.yaml)        |
| 02. [Predicates and Quantifiers](../content/lessons/02-predicates-and-quantifiers.md)         | [YAML](../content/worksheets/02-predicates-and-quantifiers.yaml) |
| 03. [Sets and Set Operations](../content/lessons/03-sets-and-set-operations.md)               | [YAML](../content/worksheets/03-sets-and-set-operations.yaml)    |
| 04. [Relations](../content/lessons/04-relations.md)                                           | [YAML](../content/worksheets/04-relations.yaml)                  |
| 05. [Functions](../content/lessons/05-functions.md)                                           | [YAML](../content/worksheets/05-functions.yaml)                  |
| 06. [Sequences and Summations](../content/lessons/06-sequences-and-summations.md)             | [YAML](../content/worksheets/06-sequences-and-summations.yaml)   |
| 07. [Direct Proof](../content/lessons/07-direct-proof.md)                                     | [YAML](../content/worksheets/07-direct-proof.yaml)               |
| 08. [Proof by Contrapositive](../content/lessons/08-proof-by-contrapositive.md)               | [YAML](../content/worksheets/08-proof-by-contrapositive.yaml)    |
| 09. [Proof by Contradiction](../content/lessons/09-proof-by-contradiction.md)                 | [YAML](../content/worksheets/09-proof-by-contradiction.yaml)     |
| 10. [Mathematical Induction](../content/lessons/10-mathematical-induction.md)                 | [YAML](../content/worksheets/10-mathematical-induction.yaml)     |
| 11. [Strong Induction](../content/lessons/11-strong-induction.md)                             | [YAML](../content/worksheets/11-strong-induction.yaml)           |
| 12. [Combinatorics](../content/lessons/12-combinatorics.md)                                   | [YAML](../content/worksheets/12-combinatorics.yaml)              |
| 13. [Recurrence Relations](../content/lessons/13-recurrence-relations.md)                     | [YAML](../content/worksheets/13-recurrence-relations.yaml)       |
| 14. [Graph Theory](../content/lessons/14-graph-theory.md)                                     | [YAML](../content/worksheets/14-graph-theory.yaml)               |
| 15. [Asymptotic Growth and Algorithmic Reasoning](../content/lessons/15-asymptotic-growth.md) | [YAML](../content/worksheets/15-asymptotic-growth.yaml)          |

Download generated PDFs with answer keys from each lesson in the study app.

## Timeline

Target: begin the first CU Boulder MS-CS algorithms pathway course around the start of 2027.

| Dates                            | Focus                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| Sep 5 – Oct 4                    | Discrete math and proofs                                        |
| Oct 5 – Nov 1                    | Linear algebra                                                  |
| After linear algebra             | Calculus, paced by working fluency across the expanded sequence |
| After calculus                   | Probability and statistics                                      |
| Throughout and before coursework | Review, mixed problems, and weak areas                          |

Algebra, functions, exponents, logarithms, inequalities, and summation notation should be refreshed as needed throughout rather than treated as a separate major phase.

Calculus includes single-variable foundations, integration and series, followed by multivariable calculus. Probability and statistics then develops foundations, inference, and the modeling bridge. Completeness takes precedence over the original time estimates; later dates are flexible.

## 1. Discrete Mathematics and Proofs

Highest priority for the algorithms pathway.

### Topics

- Propositional logic
- Predicates and quantifiers
- Sets and set operations
- Relations
- Functions
  - injective
  - surjective
  - bijective
- Sequences and summations
- Direct proof
- Proof by contrapositive
- Proof by contradiction
- Mathematical induction
- Strong induction
- Combinatorics
  - permutations
  - combinations
  - pigeonhole principle
- Recurrence relations
- Graph theory
  - vertices and edges
  - paths and cycles
  - trees
  - connectedness
  - directed and undirected graphs
- Asymptotic growth and algorithmic reasoning

### Goal

Be able to read mathematical statements comfortably and construct basic proofs rather than only follow them.

## 2. Linear Algebra

Especially important for later machine-learning coursework.

### Topics

- Vectors
- Scalar multiplication
- Dot products
- Matrices
- Matrix multiplication
- Systems of linear equations
- Linear combinations
- Span
- Linear independence
- Basis
- Dimension
- Rank
- Matrix inverse
- Linear transformations
- Orthogonality
- Projections
- Eigenvalues and eigenvectors
- Conceptual introduction to singular value decomposition

### Goal

Develop enough fluency that vectors and matrices feel like ordinary mathematical objects rather than unfamiliar notation.

## 3. Calculus

Develop change, accumulation and approximation before applying them to functions of several variables, optimization and model fitting. Assume precalculus and the existing linear algebra material, with local prerequisite refreshers.

### Topics

- Reading-only 00 Introduction
- Limits, continuity, the intermediate value theorem and an accessible epsilon–delta introduction
- Derivative definitions; algebraic, trigonometric, inverse, exponential and logarithmic rules
- Related rates, linear approximation, mean value theorem, function behavior and optimization
- Riemann sums, definite integrals, antiderivatives, the fundamental theorem and substitution
- Integration techniques, applications, numerical approximation and improper integrals
- Sequences, convergence tests, power series, Taylor polynomials and remainder bounds
- Multivariable domains, limits, partial derivatives, linearization and gradients
- Dependency paths, Jacobians, Hessians and local/global extrema
- Double integrals, equality constraints, gradient descent and least-squares connections

The subject has 22 instructional lessons following Introduction. Differential-equation courses, rigorous real analysis, extensive polar/parametric techniques, triple integrals, vector-calculus integral theorems and advanced optimization algorithms remain outside this sequence.

### Goal

Compute and interpret derivatives and integrals, justify convergence and approximation claims at an introductory level, and connect multivariable derivatives to gradients, constraints and model fitting. Practice and dedicated review combine exact computational answers with open explanations, proofs and modeling judgments. Deterministic grading is an authoring preference, with roughly 70% as a loose aim rather than a threshold.

## 4. Probability and Statistics

The final subject develops probability foundations, statistical inference, and a bridge to machine-learning modeling. It assumes discrete mathematics, linear algebra, and calculus, with local refreshers. Its reading-only 00 Introduction is followed by 22 instructional lessons; pacing follows working fluency rather than a fixed week count.

### Topics

- Probability models, events, counting, conditioning, independence, and Bayes' theorem
- Discrete random variables, expectation, variance, and standard count/waiting-time models
- Continuous variables, normal distributions, transformations, and joint/conditional laws
- Covariance, correlation, random vectors, and conditional expectation
- Data summaries, empirical distributions, sampling, bias, confounding, and randomization
- Laws of large numbers, the central limit theorem, concentration, and Monte Carlo estimation
- Point estimation, likelihood, confidence intervals, and hypothesis testing
- Bayesian updating, beta models, posterior prediction, and credible intervals
- Regression, coefficient uncertainty, prediction intervals, and causal limitations
- Bootstrap uncertainty, held-out assessment, overfitting, leakage, and predictive metrics

Broader two-sample procedures, ANOVA, extensive categorical testing, stochastic processes, measure-theoretic probability, advanced asymptotics, MCMC, and full machine-learning algorithms remain outside this sequence.

### Goal

Build and interrogate probability models, calculate and interpret uncertainty, explain inference assumptions, and connect statistical reasoning to algorithms and model assessment. Practice and dedicated review combine exact and rounded numerical answers with open explanations and modeling judgments. Roughly 70% deterministic grading remains an authoring preference, without a percentage gate.

## Study Approach

Prioritize solving problems over passive reading or videos.

For each topic:

1. Learn the core idea and notation.
2. Work examples by hand.
3. Solve problems without looking at the solution.
4. Review mistakes and weak spots.
5. Move on once the fundamentals are usable rather than waiting for complete mastery.

The target by January is not mastery of undergraduate mathematics. It is to be able to:

- read mathematical notation comfortably;
- manipulate equations, logs, exponents, and summations;
- follow and write basic proofs;
- reason about recurrences and graphs;
- work confidently with vectors and matrices;
- differentiate common single- and multivariable expressions;
- understand gradients and basic optimization;
- solve foundational probability problems.

## Next Step

Around January 2027, begin the first for-credit course in CU Boulder's Data Structures and Algorithms performance-based admission pathway. Use that first course to measure the real workload before deciding how many courses to take in subsequent terms.
