# Matrices and Matrix Multiplication

A matrix organizes numbers into rows and columns. More importantly, it can organize a rule: each output coordinate is a specified linear combination of input coordinates. This viewpoint explains both how matrix multiplication works and why its order matters.

## Shape, entries, and transpose

An m by n matrix has m rows and n columns, where m and n are positive integers. An entry is one number in the array. We write $A_{ij}$ for the entry in row i and column j of matrix A, numbering rows and columns from one. The first subscript is always the row in this convention.

For example, $A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$ has two rows and two columns, and its entry in row two, column one is 3. A square matrix has the same number of rows and columns. A column vector is an n by one matrix when we use matrix notation.

The transpose exchanges rows and columns. The notation $A^T$ is read “A transpose”; T is a label for this operation, not an exponent. The example's transpose has rows (1,3) and (2,4). Transposing an m by n matrix produces an n by m matrix. Adding matrices requires equal shapes and adds corresponding entries; scalar multiplication scales every entry.

## A matrix acting on a vector

For the matrix A above and x=(2,1), $Ax=\begin{pmatrix}4\\10\end{pmatrix}$. The first output is the dot product of row (1,2) with x; the second is the dot product of row (3,4) with x. An m by n matrix therefore accepts an n-component column and returns an m-component column.

There is an equally useful column reading. Multiply the first column of A by the first component of x and the second column by the second component, then add. Here two copies of (1,3) plus one copy of (2,4) give (4,10). The row reading calculates each output; the column reading explains how the output is built.

An [identity matrix](ref:linear-algebra-matrices-2) leaves every compatible vector unchanged. In two dimensions it has rows (1,0) and (0,1). It is written $I_2$, with the subscript giving its size. More generally, an identity matrix has ones on its main diagonal, the entries whose row and column numbers agree, and zeros elsewhere.

## Composition determines the product

Suppose B first transforms an input vector and A then transforms the result. The combined matrix is AB, with B acting first. The product exists when the number of columns of A equals the number of rows of B. If A is m by n and B is n by p, AB is m by p.

Each column of AB is A applied to the corresponding column of B. Equivalently, each entry is the dot product of a row of A with a column of B. This rule is not an arbitrary complication: it makes $A(Bx)=(AB)x$ hold for every compatible input x. Parentheses can change the order in which we carry out the calculation without changing which transformation acts first.

For A with rows (1,2),(3,4) and B with rows (2,0),(0,1), AB has rows (2,2),(6,4). The first column of A is doubled because B doubles the first input coordinate. BA instead has rows (2,4),(3,4): applying B afterward doubles the first output coordinate. These are different operations, so [matrix multiplication](ref:linear-algebra-matrices-3) is generally not commutative.

## Checking a matrix calculation

Always check dimensions first. A two by three matrix times a three by four matrix gives a two by four result. Reversing their order would require matching four with two, so that reversed product is not defined. “Not defined” is different from “defined but unequal.”

Then check a strategically chosen input. The first standard coordinate vector extracts the first column of a matrix; the second extracts the second column. If you claim a product has a particular first column, you can verify it by applying the transformations successively to the first standard vector.

Matrix multiplication distributes over addition when the shapes match, but familiar scalar shortcuts need care. A product of two nonzero matrices can be the zero matrix, and an equation involving a matrix factor does not automatically permit [cancellation](ref:linear-algebra-matrices-4). We will explain exactly when a matrix can be undone in the lesson on bases and inverses.

When typing matrices, use `\begin{pmatrix}` and `\end{pmatrix}`, separate entries in a row with `&`, and separate rows with `\\`. Check the preview's shape as well as its entries. A missing row separator can turn a correct list of numbers into the wrong mathematical object.
