// Each exercise follows the complete named teaching section, including its H3 subsections.
// Audited against the adapted prompt, instructions, and answer across all 15 lessons.
// Use teaching headings rather than ordinal positions: inserted sections must not shift exercises.
export const inlinePlacements: Record<string, Record<string, number[]>> = {
  'propositional-logic': {
    Propositions: [1, 4],
    'Negation: NOT': [9],
    'Conjunction: AND': [10],
    'Disjunction: OR': [11],
    'Converse, inverse, and contrapositive': [31, 35],
    'Necessary and sufficient conditions': [81],
    "De Morgan's laws": [46, 47],
    'Common equivalence laws': [95],
    'Tautologies, contradictions, and contingent statements': [60],
    'Common rules of inference': [111],
    'Two common invalid argument forms': [70],
    Satisfiability: [127],
    'A first proof by contrapositive': [152],
  },
  'predicates-and-quantifiers': {
    'Predicates and substitution': [1],
    'Universal quantification: for every': [11],
    'Translating all, some, none, and only': [21],
    'Negating quantified statements': [41],
    'Several variables and quantifier order': [51],
    'Relationships in ordinary language': [101],
    'Existence, uniqueness, and exactly one': [71],
    'Which distributions are valid?': [81],
    'Valid reasoning with quantifiers': [91],
    'Writing a quantified proof': [111],
  },
  'sets-and-set-operations': {
    'Membership and subsets are different': [1],
    'Union, intersection, difference, and complement': [11],
    'Laws of set operations': [21],
    'Ordered pairs and Cartesian products': [31],
    'Counting unions without double-counting': [41],
    'Partitions and indexed families': [51],
    'A worked access-policy example': [61],
  },
  relations: {
    'Relations as sets of ordered pairs': [1],
    'A complete finite check': [11],
    'Vacuous cases and related properties': [21],
    'Equivalence classes and partitions': [31],
    'Hasse diagrams and extreme elements': [41],
    'Inverses and composition of relations': [51],
    'Building closures without losing the meaning': [61],
  },
  functions: {
    'What a function specifies': [1],
    'Image and preimage': [11],
    'Surjective functions': [21],
    'Composition and types': [31, 41],
    'Restrictions, empty cases, and finite sizes': [51],
    'Floor and ceiling functions': [61],
  },
  'sequences-and-summations': {
    'Recursive definitions and initial conditions': [1],
    'Arithmetic and geometric sequences': [11],
    'Deriving arithmetic sums': [21],
    'Deriving finite geometric sums': [31],
    'Reindexing and telescoping': [41],
    'Products and factorials': [51],
    'Bounding sums': [61],
    'Translating loop bounds into sums': [71],
  },
  'direct-proof': {
    'Unpack definitions': [1],
    'Worked proof: the sum of two odd integers': [11],
    'Closure claims': [21],
    'Biconditionals need both directions': [31],
    'Constructive existence': [41],
    'When the claim is false': [51],
    'Diagnose and revise a proof': [61],
  },
  'proof-by-contrapositive': {
    'The proof template': [1],
    'Worked proof: an even square has an even root': [21],
    'Negate compound conditions carefully': [11],
    'Divisibility by 3 and remainders': [31],
    'Irrationality through a rational contrapositive': [51],
    'Contraposition in set and function arguments': [41],
    'Diagnose flawed contrapositive proofs': [61],
  },
  'proof-by-contradiction': {
    'The logical structure': [1],
    'Contradiction versus contrapositive': [11],
    'The irrationality of the square root of 2': [21],
    'Rational and irrational combinations': [31],
    'There are infinitely many primes': [41],
    'Uniqueness proofs': [51],
    'Common errors and how to repair them': [61],
  },
  'mathematical-induction': {
    'Why the hypothesis is not circular': [1],
    'Empty sums and a base at zero': [11],
    'Divisibility by induction': [21],
    'Inequalities require a bridge': [31],
    'A recurrence and a claimed closed form': [41],
    'Induction and repeated computation': [51],
    'Common invalid induction arguments': [61],
  },
  'strong-induction': {
    'Well-ordering and a smallest counterexample': [1],
    'Prime factorization: existence': [11],
    'Postage with several base cases': [21],
    'A recursive sequence bound': [31],
    'Recursive algorithms: termination and correctness': [41],
    'A finite construction by splitting': [51],
    'Common mistakes': [61],
  },
  combinatorics: {
    'Complementary counting': [1],
    'Unordered selections and combinations': [11],
    'Repeated objects and circular arrangements': [21],
    'The binomial theorem': [31],
    'Inclusion-exclusion': [41],
    'The pigeonhole principle': [51],
    'Choosing a model before a formula': [71],
  },
  'recurrence-relations': {
    'A recurrence needs a domain and initial conditions': [1],
    'Differences and telescoping': [11],
    'First-order linear recurrences': [21],
    'A varying nonhomogeneous term': [31],
    'Repeated roots': [41],
    'A recurrence for a recursive construction': [51],
    'Different amounts of branching': [61],
    'Guessing bounds and proving them': [71],
  },
  'graph-theory': {
    'Vertices, edges, and conventions': [1],
    'Adjacency and degree': [11],
    'Walks, trails, paths, and cycles': [21],
    'Connectivity and components': [31],
    'Equivalent characterizations of trees': [41],
    'Directed acyclic graphs and scheduling': [51],
    'Breadth-first and depth-first search': [61],
    'Euler trails and Hamiltonian cycles': [71],
  },
  'asymptotic-growth': {
    'Big Omega and Big Theta': [1],
    'Negating an asymptotic claim': [11],
    'Polynomials and logarithm bases': [21],
    'Why exponentials outrun fixed powers': [31],
    'Dependent loop bounds': [41],
    'Doubling and halving': [51],
    'An upper-bound proof is not an algorithm lower bound': [61],
    'Recurrences and input size': [71],
  },
};

export function placeNotebookExercises(slug: string, titles: string[], questionIds: number[]) {
  const placements = inlinePlacements[slug];
  if (!placements) throw new Error(slug + ': missing inline exercise plan');
  const used = new Set<number>();
  const available = new Set(questionIds);
  for (const [title, ids] of Object.entries(placements)) {
    if (title === 'Practice' || titles.filter((t) => t === title).length !== 1)
      throw new Error(slug + ': missing or ambiguous teaching heading: ' + title);
    for (const id of ids) {
      if (used.has(id) || !available.has(id))
        throw new Error(slug + ': invalid or duplicate inline exercise ' + id);
      used.add(id);
    }
  }
  return {
    sectionQuestionIds: titles.map((title) => placements[title] || []),
    practiceIds: questionIds.filter((id) => !used.has(id)),
  };
}
