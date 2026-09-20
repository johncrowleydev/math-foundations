# Introduction

Probability and statistics provide a language for uncertainty. Probability describes what a model says can happen; statistics uses observations to learn about unknown features of a model or population. This final subject connects the earlier mathematics to random algorithms, measurements, predictions, and the interpretation of evidence.

## Two directions between models and data

Imagine a service whose requests sometimes fail. If a model supplies the failure probability and says requests behave independently, probability can describe the number of failures in a batch. If instead we observe a batch and do not know the failure probability, statistics asks how to estimate it and describe the uncertainty in that estimate. The same observations can support many possible models, so assumptions remain part of the answer.

A random outcome is not the same as an unknown parameter. One future request may succeed or fail; an unknown parameter describes the mechanism that produces such outcomes. An estimate is a numerical summary derived from data, and its precision depends on the sampling process. Later lessons develop these distinctions carefully instead of treating every uncertainty as interchangeable.

A useful solution therefore has two parts: a mathematical calculation and an interpretation within the stated model. A precise answer to the wrong question can be misleading. Before computing, identify what is random, what is observed, what is unknown, and what assumptions connect them.

## Applications in algorithms and learning

Randomized algorithms deliberately make random choices. Probability helps describe collisions, repeated attempts, expected work, and the chance that an algorithm fails under its stated conditions. Expected work is an average over possible runs; it need not be a bound on the work of every run. The subject will develop tools for expressing both averages and failure guarantees.

Machine learning fits models to examples and uses them to predict new cases. Statistics helps distinguish fitting the observed data from predicting unseen observations. We will connect the least-squares calculations already studied to a model of noisy measurements, and distinguish uncertainty about a mean prediction from variation in a new observation.

The same ideas apply when interpreting sampled data more generally. A large dataset can still omit important groups, repeat dependent observations, or encode measurement errors. Mathematical uncertainty statements describe particular sources of variation under assumptions; they do not automatically justify a causal conclusion. Examples in these lessons are original, deliberately small enough to inspect, and designed to make the reasoning visible.

## What to bring from the earlier subjects

Discrete mathematics supplies sets, functions, logic, counting, sums, and proof methods. Events will be sets of outcomes, and a random variable will be a numerical function of an outcome. We refresh counting with and without replacement and explain when counting ratios really produce probabilities. Do not assume equally likely outcomes merely because a list looks symmetric.

Linear algebra supplies vectors, matrices, quadratic forms, and least squares. These become useful when several measurements vary together. A covariance matrix will record their pairwise linear variation, and transformations of random vectors will reuse familiar matrix calculations. The relevant definitions will be introduced before they are required.

Calculus supplies integrals for accumulated probability, derivatives for likelihood optimization, and limits for large-sample arguments. A density is a function whose area describes probability; its height is not itself a probability. We begin with finite models before using integration, and each new notation is explained locally. Algebra, fractions, powers, logarithms, and careful units remain useful throughout.

## The learning journey

The opening lessons build probability models, counting methods, conditional probability, and Bayes’ theorem. We then describe numerical random quantities through their distributions, expectations, and variances. Standard distributions provide reusable models, but the lesson is to recognize their assumptions rather than assign a familiar name to every dataset.

Next come several variables together, dependence, conditional averages, and sampling. Limit theorems explain what happens to sample averages, while concentration bounds give explicit probability guarantees. Monte Carlo estimation uses simulated averages to approximate quantities; its sampling error must be distinguished from choosing an incorrect simulation model.

The final block develops estimation, confidence intervals, hypothesis tests, and Bayesian updating. Regression and model assessment connect the full curriculum to prediction. A confidence interval describes a repeated-sampling procedure; a Bayesian credible interval describes probability under a posterior model. We will explain these different claims rather than treating similar-looking endpoints as interchangeable.

This is a foundation for further study, with depth in the selected methods. Advanced stochastic processes, measure-theoretic probability, broad surveys of statistical procedures, and full machine-learning algorithms belong to later courses.

## How to study uncertainty carefully

Work through the definitions and examples before attempting the adjacent practice. For each problem, write a short description of the experiment or dataset, the target quantity, and the assumptions. Distinguish a derivation from a numerical approximation and a model consequence from evidence that the model fits reality. Check whether your result has sensible units, lies in an allowed range, and changes plausibly when a parameter changes.

Use exact fractions and expressions when requested. When an exercise needs numerical distribution values, the required values or a table excerpt are supplied. Follow the stated probability-versus-percentage convention and rounding precision. More decimal places do not make the model assumptions more reliable.

Review terminology and short computations regularly, and also return to explanations, counterexamples, and modeling questions. Being able to recognize the correct statement is different from producing a calculation or defending an inference. Use the revealed solution to compare reasoning, not only a final number.

This introduction is reading only. Begin assessed work in Lesson 01, and pace the subject by working understanding rather than a fixed calendar. The earlier subjects remain available for focused prerequisite refreshers.
