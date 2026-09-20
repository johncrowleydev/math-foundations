const overview = {
  id: 'os1-calculus-preface',
  source: 'openstax-calculus-1',
  locator: 'Preface: Coverage and scope',
  url: 'https://openstax.org/books/calculus-volume-1/pages/preface',
  supports:
    'The relationships among change, accumulation, single-variable calculus, and the later multivariable sequence. App study instructions describe this curriculum rather than a textbook claim.',
};
const make = (title, body) => ({
  title,
  body,
  sources: [overview],
  terms: [],
  questions: [],
  review: [],
});
export default {
  number: 0,
  slug: 'calculus-introduction',
  title: 'Introduction',
  intro:
    'Calculus studies change, accumulation, and approximation. It lets us describe how a quantity responds to a small change, recover totals from continuously varying rates, and find inputs that improve an outcome. This subject builds those ideas carefully in one variable before extending them to several variables. The introduction is a reading-only orientation; there is nothing to submit here.',
  sections: [
    make(
      'The questions calculus answers',
      'Imagine tracking a moving vehicle. Its average speed over a trip is easy to calculate, but its speed at one instant requires a more precise idea of change. Now reverse the question: if its speed changes throughout the trip, how can we recover the distance traveled? Differentiation and integration develop these two perspectives, and the fundamental theorem of calculus explains their relationship.\n\nAnother recurring question is how to replace a complicated function with a simpler local approximation. A straight line can predict a small change; a polynomial can capture more curvature. We will learn not only how to calculate those approximations, but also how to describe their errors and the conditions under which they are useful.\n\nAn optimization problem asks which permitted inputs make a chosen output smallest or largest. Calculus provides useful necessary conditions and tests, but an answer also depends on the feasible domain and on what the objective actually measures. A stationary point, where first-order change vanishes, is not automatically the best answer. We will develop the meaning of that term before relying on it.',
    ),
    make(
      'Applications and mathematical foundations',
      'Calculus appears in motion, growth, geometry, economics, engineering, and data analysis. Integrating a density can produce a total quantity; differentiating an objective can describe sensitivity to a model parameter. Computer science provides motivating examples through approximation, computational graphs, and gradient-based model fitting, but the explanations and practice also develop the general mathematical foundation.\n\nA derivative is a mathematical limit, not just a rule for moving an exponent. An integral describes accumulation, not just a symbol that asks for an antiderivative. Learning the underlying meanings makes it possible to recognize when a familiar calculation is appropriate and when its assumptions fail. Graphs, units, counterexamples, and theorem hypotheses are part of the subject alongside symbolic fluency.\n\nThe material is original teaching supported by pinpoint references. Source details are available in collapsed panels. They help you consult the underlying definitions and results without interrupting the reading. The numerical examples and exercises are checked applications of those results, rather than claims that the textbook contains the same examples.',
    ),
    make(
      'What to bring from earlier mathematics',
      'You should be comfortable manipulating algebraic expressions, solving equations and inequalities, reading graphs, and working with functions, exponents, logarithms, and basic trigonometry. Radian measure matters when trigonometric derivatives arrive. Refresh these ideas as needed; a difficulty simplifying a fraction is different from a difficulty understanding a limit.\n\nEarlier discrete mathematics supplies useful habits: interpreting quantifiers, distinguishing a statement from its converse, constructing counterexamples, and keeping finite sums separate from limiting processes. We will revisit the required ideas in context rather than assuming that every earlier exercise is memorized.\n\nThe later multivariable block uses vectors, dot products, matrices, and linear transformations. Linear algebra makes the gradient and Jacobian easier to understand because they organize rates of change into vectors and matrices. Their calculus meanings will be introduced before they are used. You do not need prior multivariable calculus to begin this subject.',
    ),
    make(
      'The journey from one input to several',
      'The first block develops limits, continuity, derivatives, differentiation rules, and applications. It includes implicit differentiation, related rates, local approximation, the mean value theorem, and optimization. We will examine both ordinary calculations and situations where a theorem cannot be applied.\n\nThe second block develops integration as accumulation, the fundamental theorem, useful integration techniques, applications, and numerical and improper integration. Sequences, series, and Taylor approximation then extend the study of limits and approximation, including the difference between a formal expression and a convergent representation.\n\nThe final block introduces functions with several inputs. Partial derivatives lead to linearization and gradients; the chain rule becomes a calculation over dependency paths and Jacobian matrices. Higher derivatives, double integrals, constrained optimization, and gradient descent complete the connection between geometry, accumulation, and model fitting.\n\nThis is a substantial foundation, not an entire mathematics degree. Differential equations, a full real-analysis treatment, advanced vector calculus, and sophisticated optimization algorithms are later subjects. The original study calendar can guide your pace, but understanding and practice determine when to move on.',
    ),
    make(
      'How to use these lessons',
      'Read an explanation and work its examples by hand before attempting the nearby practice. For a new symbol, state what it represents and what kind of object it is: a number, a function, a vector, a set, or an operation. For a formula, name the inputs, outputs, units, domain, and relevant assumptions.\n\nPractice mixes calculation with interpretation, derivation, counterexample, and application. Some questions accept short typed mathematical answers with automatic grading. Others ask for reasoning that needs an open response. A calculation being automatically checkable does not make it unimportant, and a correct final expression does not substitute for a requested explanation.\n\nUse worked solutions to locate the first unsupported step in your reasoning. Then try a related problem without looking at the answer. Review revisits terminology, distinctions, calculations, and deeper tasks through the existing study system. The large practice bank provides variety and additional work where needed; it is not an instruction to finish every problem in a single sitting.\n\nAs you progress, connect the ideas: a derivative measures local change, an integral accumulates it, a theorem explains when operations are justified, and an approximation comes with limits. Those connections are the foundation you will carry into probability, algorithms, and machine learning.',
    ),
  ],
};
