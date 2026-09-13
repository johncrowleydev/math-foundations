# Introduction

Mathematics is not only the study of numbers and curves. It is also the study of what follows from what: whether a claim really holds, how many possibilities a situation contains, and which connections matter. Discrete mathematics brings these questions into focus. The word **discrete** means separate or individually distinguishable. A computer's possible states, the members of a group, and the links in a road network are examples of discrete objects. Contrast these with a continuously varying quantity, such as the temperature along a metal rod.

This distinction is useful rather than absolute. Discrete and continuous mathematics often work together. A navigation application can represent roads as individual connections while using continuous measurements of distance and time. We study the discrete structure because it lets us ask precise questions about possible routes without reproducing every detail of the physical world.

## Why this subject matters

Suppose a program allows access only when a user has permission and a document is available. Before writing code, we need to understand exactly what that sentence permits. What happens when the document is unavailable? Does reversing an implication preserve its meaning? Logic gives us a language for answering such questions without relying on how convincing an English sentence happens to sound.

Other problems are about organization. Which records belong in a search result? Can two different inputs produce the same output? How can we describe the dependencies among tasks? Sets, relations, and functions let us describe these structures carefully. They are not merely notation to memorize: they help expose assumptions that would otherwise stay hidden.

Still other problems concern scale. A procedure that examines every possible ordering may work for a handful of objects and become hopeless for a larger collection. Counting and the study of algorithm growth explain why. A proof can establish that an algorithm works for every allowed input, including inputs we will never have time to test individually.

You do not need to be a programmer to benefit from these ideas. They are equally useful when checking an argument, interpreting a rule, planning a schedule, or deciding whether a few successful examples support a general claim. The applications provide motivation; the central skill is learning to reason with enough precision that another person can check your work.

## The journey through these lessons

We begin with **logic**, the study of statements and valid reasoning. You will learn how words such as “and,” “or,” “if,” “every,” and “some” behave in mathematical arguments. The notation will be introduced gradually and read aloud in ordinary language. A symbol is a compact way to write an idea you understand, not a substitute for understanding it.

Next come sets, relations, functions, and sequences. A **set** is a collection described by its members. A **relation** specifies which objects are associated with which others. A **function** assigns one output to each allowed input. A **sequence** is an indexed list of terms. These brief descriptions are orientation; their lessons will develop the precise definitions, conventions, and examples before asking you to use them.

The middle of the subject concentrates on **proof**: an explanation that establishes a mathematical claim from stated assumptions. You will practice direct arguments and learn when reasoning through a contrapositive or a contradiction is helpful. Those names will be explained when we reach them. We then study induction, a method for proving claims about whole-number stages by connecting a starting case to later cases.

Finally, we use this language to count possibilities, analyze recursively defined quantities, study networks, and compare rates of algorithm growth. A **graph**, in this subject, is a collection of objects and connections; it need not be a plotted curve. Graph theory will connect drawings of networks to exact mathematical descriptions.

The goal is not to finish with a bag of unrelated formulas. It is to recognize a recurring pattern: describe the objects, make the assumptions visible, choose a useful representation, and justify the conclusion.

## How to learn from the notebook

The lessons assume ordinary algebra, functions, and coordinate geometry through precalculus. They do not assume previous experience writing proofs. If a familiar word has a specialized meaning here, treat that definition as part of the lesson. In mathematics, a small change in a condition can change an entire claim.

Read a worked example actively. Pause before its conclusion and ask what you would do next. When an inline exercise appears, try it before revealing the official answer. A wrong attempt can be useful evidence: perhaps the definition was unclear, perhaps a condition was missed, or perhaps the claim was stronger than the examples suggested. The purpose of feedback is to help you identify that difference.

For proofs and explanations, write enough that someone else can follow the connection between steps. A correct final word is not always a complete response. Conversely, a short argument can be excellent when it identifies exactly the relevant definition or gives a decisive counterexample—a particular case that disproves a general claim.

You can type ordinary prose and add mathematics with TeX, or use handwriting. Optional typing explanations show how to enter the notation. The reference library offers reminders, but the main text introduces the ideas before you need them. Use the dedicated practice view when you want more questions on a topic without rereading the whole lesson.

## What success will look like

By the end, you should be more comfortable asking “What does this statement actually say?” and “Why is this step justified?” You should be able to distinguish an example from a proof, a plausible implication from a valid one, and a computation from an explanation of why a method works.

These habits carry directly into linear algebra, probability, algorithms, and later computer science. You are building both vocabulary and judgment. Neither develops instantly, and needing to reread a definition is normal. This introduction has no exercises; begin with Propositional Logic when you are ready to work through the first ideas in detail.
