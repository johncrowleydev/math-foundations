# Introduction

Imagine recording several measurements for each object: a home's floor area, age, and price, or a document's counts of several words. Keeping each measurement separately soon becomes awkward. Linear algebra gives us a way to treat a whole list of numbers as one object, transform many such lists consistently, and understand which information those transformations preserve or lose.

Its starting operations are familiar: addition and multiplication by a number. What changes is the scale of the objects on which we perform them. We add lists to lists, combine columns of numbers, and study entire systems of equations together. The resulting theory connects computation to geometry in a particularly useful way.

## Why linear algebra appears everywhere

In graphics, a transformation can stretch, rotate, or project an object. In data analysis, a table organizes measurements and a model combines them to predict an outcome. In engineering, several unknown quantities can be linked by simultaneous constraints. Linear algebra supplies a common language for all three situations.

Machine learning uses this language heavily. A **feature** is a numerical measurement supplied to a model. A list of features can describe one observation; a table can collect many observations. You do not need to know machine learning now. We will use small examples that can be checked by hand, while explaining how the same structures scale to larger problems.

Not everything is linear. Squaring a measurement or applying a threshold changes the kind of relationship involved. Learning to recognize where linear methods apply—and where they do not—is as important as learning to calculate with them.

## What you will learn

We begin with **vectors**, ordered lists of numbers that can also represent displacements, and with their addition and scaling. Dot products then connect arithmetic to length, angle, and perpendicularity. Next, **matrices**, rectangular arrays of numbers, let us describe many linear combinations at once.

Solving systems of equations will lead to deeper questions. Which outputs can a matrix produce? When is a representation unique? How many independent directions are really present? The concepts of span, independence, basis, dimension, and rank answer these questions. Each will be defined with examples before you are asked to use it.

We then connect matrices to linear transformations and study projections: how to find the closest point in a permitted collection when an exact solution is impossible. This gives a first mathematical account of fitting a model to data.

The final lessons introduce eigenvalues and eigenvectors, which identify directions that a transformation merely scales, and the singular value decomposition, usually abbreviated SVD. The SVD describes a matrix through perpendicular input and output directions and their scale factors. Our treatment is conceptual but precise: you will understand what the pieces mean and check small examples without being expected to implement a numerical SVD algorithm.

## How this subject builds on what you know

Algebra and coordinate geometry are the main prerequisites. We use functions, sets, implication, and proof habits from discrete mathematics, with reminders where those ideas return. Unless stated otherwise, our numbers are real numbers. Complex numbers receive only a brief mention when explaining why a real matrix need not have real eigenvectors.

The same equation will often have several useful readings. It might be a system of scalar equations, a combination of columns, or a transformation of a vector. Moving between these readings is a central skill. A drawing helps when it explains such a connection; it does not replace an algebraic argument, especially in dimensions we cannot draw.

Work through the calculations, but also state what they mean. If a system has infinitely many solutions, explain what is free to vary. If a projection produces a nonzero error, explain why an exact fit was impossible. These interpretations prepare you for later calculus, probability, and machine learning better than memorizing procedures alone.

## A note on notation and practice

We will use small examples so you can verify the arithmetic yourself. Vectors will usually be written as columns or coordinate tuples, and the text will specify which interpretation is intended. A superscript T means transpose when introduced; it does not mean an exponent in that context. Such conventions are explained locally and collected in the reference library.

Every working lesson includes examples and practice with full answers. The optional typing help introduces TeX constructions such as column vectors and matrices before the exercises that benefit from them. Plain-language reasoning remains important even when your calculation is correct.

There are no exercises in this introduction. Start with Vectors and Linear Combinations, and keep returning to the question that ties the subject together: what can we build by adding and scaling the objects we have?
