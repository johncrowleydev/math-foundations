# Graph Theory

A **graph** models objects together with connections between them. Each object is called a **[vertex](ref:vertex)** (plural **[vertices](ref:vertex?repeat)**) and is usually drawn as a labeled dot. An **[edge](ref:edge)** records a connection between two [vertices](ref:vertex?repeat) and is drawn as a line joining their dots. Another common word for a [vertex](ref:vertex?repeat) is **[node](ref:vertex?repeat)**.

The objects might be people, web pages, tasks, or computers; the connections might be friendships, links, dependencies, or communication channels. We can then ask whether one object can be reached from another, which tasks must happen first, or which connections a network needs. This meaning of graph is different from the coordinate plot of a function: the dots need not be numerical coordinates.

This lesson builds on [Sets](../lessons/03-sets-and-set-operations.md), [Relations](../lessons/04-relations.md), and [Strong Induction](../lessons/11-strong-induction.md). Graph terminology has several conventions, so we will state ours explicitly. The drawings can change without changing the graph: what matters is which pairs of [vertices](ref:vertex?repeat) share an edge, not where they sit on the page.

## Vertices, edges, and conventions

A graph deliberately forgets some details. A map may record road lengths, bends, and compass directions, while a question about which places can be reached may need only to know which places have a direct road between them. Choosing [vertices](ref:vertex?repeat) and [edges](ref:edge?repeat) is a modeling decision about which details matter. The conventions below say exactly what information our graph keeps.

![Four vertices joined by four edges](figure:graph-first)

An [edge](ref:edge?repeat)’s two [vertices](ref:vertex?repeat) are its **endpoints**. A **[self-loop](ref:self-loop)** would connect a [vertex](ref:vertex?repeat) to itself. **Parallel [edges](ref:edge?repeat)** would be distinct connections between the same pair of endpoints. In a simple graph neither is allowed. Undirected means that a connection has no preferred direction; we can follow it either way. Finite means there are only finitely many [vertices](ref:vertex?repeat).

A **finite simple undirected graph** is a pair $G=(V,E)$, where $V$ is a finite set of [vertices](ref:vertex?repeat) and $E$ is a set of two-element subsets of $V$. Thus an [edge](ref:edge?repeat) $\{u,v\}$ joins two distinct [vertices](ref:vertex?repeat), has no direction, and appears at most once. [Self-loops](ref:self-loop?repeat) and parallel [edges](ref:edge?repeat) are excluded.

For example,

$$
V=\{a,b,c,d\},\qquad
E=\{\{a,b\},\{b,c\},\{c,a\},\{c,d\}\}.
$$

This is a triangle on $a,b,c$ with one extra [edge](ref:edge?repeat) from $c$ to $d$. The graph has four [vertices](ref:vertex?repeat) and four [edges](ref:edge?repeat). An [edge](ref:edge?repeat) crossing in a drawing does not create a [vertex](ref:vertex?repeat) unless we explicitly make it one.

A **[directed graph](ref:digraph)**, or [digraph](ref:digraph?repeat), uses ordered pairs $(u,v)$ called directed [edges](ref:edge?repeat) or [arcs](ref:digraph?repeat). In this lesson, [directed graphs](ref:digraph?repeat) are finite, have no [self-loops](ref:self-loop?repeat), and have at most one [arc](ref:digraph?repeat) for each ordered pair. Both $(u,v)$ and $(v,u)$ may occur. A directed [edge](ref:edge?repeat) from a web page to another need not have a reverse [edge](ref:edge?repeat).

Some applications need [loops](ref:self-loop?repeat) or multiple [edges](ref:edge?repeat), but those are different graph models. Unless stated otherwise, an unqualified graph here is simple and undirected. Write $n=|V|$ and $m=|E|$.

## Adjacency and degree

Degree is a local count: stand at one [vertex](ref:vertex) and count the [edges](ref:edge) touching it. Adding those local counts over the whole graph counts every [edge](ref:edge?repeat) twice, once from each end. That simple change of viewpoint—from [vertices](ref:vertex?repeat) to [edges](ref:edge?repeat)—is a double-counting argument of the kind used in combinatorics.

Two [vertices](ref:vertex?repeat) are **adjacent** if an [edge](ref:edge?repeat) joins them. An [edge](ref:edge?repeat) is **incident** to each of its endpoints. The **degree** $\deg(v)$ of an undirected [vertex](ref:vertex?repeat) is the number of incident [edges](ref:edge?repeat).

A **neighbor** of a [vertex](ref:vertex?repeat) is a [vertex](ref:vertex?repeat) adjacent to it. In a simple graph, counting a [vertex](ref:vertex?repeat)'s neighbors gives its degree.

In our example,

$$
\deg(a)=2,\quad\deg(b)=2,\quad\deg(c)=3,\quad\deg(d)=1.
$$

A **degree list** records one degree for each [vertex](ref:vertex?repeat). The **parity** of an integer is whether it is even or odd.

![Count the incident edges at each vertex](figure:graph-degree)

A degree-0 [vertex](ref:vertex?repeat) is isolated. A degree-1 [vertex](ref:vertex?repeat) is often called a leaf.

The **handshaking lemma** is

$$
\sum_{v\in V}\deg(v)=2m.
$$

Proof: count [vertex](ref:vertex?repeat)-[edge](ref:edge?repeat) incidences. Every [edge](ref:edge?repeat) has exactly two endpoints, so contributes exactly two to the sum of degrees. In the example, the degree sum is $2+2+3+1=8=2\cdot4$.

Consequently, the number of [vertices](ref:vertex?repeat) of odd degree is even. The even-degree [vertices](ref:vertex?repeat) contribute an even sum; because the total sum is even, the sum of the odd degrees is even too. A sum of odd integers is even exactly when there are an even number of terms.

For a [digraph](ref:digraph), the **out-degree** counts outgoing [arcs](ref:digraph?repeat) and the **in-degree** counts incoming [arcs](ref:digraph?repeat). In the notation below, the plus superscript denotes out-degree and the minus superscript denotes in-degree. Each [arc](ref:digraph?repeat) contributes once to each corresponding total:

$$
\sum_{v\in V}\deg^+(v)=m
=\sum_{v\in V}\deg^-(v).
$$

These are separate counts. A [vertex](ref:vertex?repeat) can have large in-degree and zero out-degree.

## Walks, trails, paths, and cycles

Different travel questions permit different kinds of repetition. A traveler may revisit a city while avoiding repeated roads, or may need to avoid revisiting cities altogether. The terms below distinguish those requirements. Before classifying a proposed route, check the more basic point that every requested step is an [edge](ref:edge) in the graph.

A **[walk](ref:walk?repeat)** is a sequence $v_0,v_1,\ldots,v_k$ in which consecutive [vertices](ref:vertex) are joined by [edges](ref:edge?repeat). Its length is $k$, the number of traversed [edges](ref:edge?repeat). Repetitions are allowed.

A **trail** is a [walk](ref:walk?repeat) with no repeated [edge](ref:edge?repeat). A **simple path**, which we will usually shorten to **path**, has no repeated [vertex](ref:vertex?repeat). A length-0 path consists of a single [vertex](ref:vertex?repeat). Every path is a trail, and every trail is a [walk](ref:walk?repeat); the converses need not hold. A **closed** walk or trail ends at its starting vertex.

In the example graph, $a,b,c,a,d$ is not even a [walk](ref:walk?repeat): there is no [edge](ref:edge?repeat) from $a$ to $d$. The sequence $a,b,c,a,c,d$ is a [walk](ref:walk?repeat) but not a trail because [edge](ref:edge?repeat) $\{a,c\}$ is traversed twice. The sequence $a,b,c,a$ is a closed trail, but not a path because it repeats $a$.

An undirected **cycle** is a closed [walk](ref:walk?repeat) $v_0,v_1,\ldots,v_k$ with $k\geq3$, $v_k=v_0$, and all of $v_0,\ldots,v_{k-1}$ distinct. Thus $a,b,c,a$ is a cycle. Traversing a single undirected [edge](ref:edge?repeat) out and back is not a cycle: it repeats that [edge](ref:edge?repeat) and has length 2.

In directed [walks](ref:walk?repeat), every step must follow an [arc](ref:digraph)'s direction. A directed cycle has distinct [vertices](ref:vertex?repeat) except for the repeated start, and length at least 2 under our no-[loop](ref:self-loop) convention. Opposite [arcs](ref:digraph?repeat) $(u,v)$ and $(v,u)$ therefore form a directed cycle of length 2.

![Compare a path, a cycle, and a repeated-edge walk](figure:graph-routes)

## Connectivity and components

Two [vertices](ref:vertex) can be connected without sharing a direct [edge](ref:edge): a route through intermediate [vertices](ref:vertex?repeat) is enough. A component gathers all [vertices](ref:vertex?repeat) that can reach one another in this sense. An isolated [vertex](ref:vertex?repeat) is its own component, while a missing [edge](ref:edge?repeat) between two [vertices](ref:vertex?repeat) need not separate them if another route remains.

An undirected graph is **connected** if it is nonempty and every pair of [vertices](ref:vertex?repeat) is joined by a path. A single [vertex](ref:vertex?repeat) is connected by the length-0 path convention. We regard the empty graph as disconnected, with zero components. A **connected component** is a maximal connected group of [vertices](ref:vertex?repeat), together with the [edges](ref:edge?repeat) between them. Here maximal means that no further [vertex](ref:vertex?repeat) can be added while preserving this property; it does not mean having the largest number of [vertices](ref:vertex?repeat) among all components.

**Reachability** is the relationship “there is a route from this [vertex](ref:vertex?repeat) to that one.” The **distance** between reachable [vertices](ref:vertex?repeat) is the minimum number of [edges](ref:edge?repeat) in a path joining them.

![Two separate connected components](figure:graph-components)

Why can reachability be defined with paths rather than arbitrary [walks](ref:walk)? If a [walk](ref:walk?repeat) repeats a [vertex](ref:vertex?repeat), remove the part between two occurrences. The remaining sequence is a shorter [walk](ref:walk?repeat) with the same endpoints. Repeating this deletion eventually produces a path. Thus existence of a [walk](ref:walk?repeat) implies existence of a path.

Reachability in an undirected graph is an equivalence relation on [vertices](ref:vertex?repeat): length-0 paths give reflexivity, reversing a path gives symmetry, and concatenating paths gives a [walk](ref:walk?repeat) that can be shortened to prove transitivity. Its equivalence classes are precisely the components.

Directed reachability need not be symmetric. A nonempty [digraph](ref:digraph) is **strongly connected** if every [vertex](ref:vertex?repeat) can reach every other by directed paths. It is **weakly connected** if ignoring directions produces a connected undirected graph. Under our convention the empty [digraph](ref:digraph?repeat) is neither strongly nor weakly connected. The [digraph](ref:digraph?repeat) $a\to b\to c$ is weakly connected but not strongly connected because $c$ cannot reach $a$.

## Trees and forests

A graph is **acyclic** when it contains no cycles. A tree connects its [vertices](ref:vertex) without retaining a cycle. Every [edge](ref:edge) is therefore doing indispensable work: removing it separates part of the graph. This balance between enough connection and no redundancy explains several tree properties. The leaf-removal proof below makes that balance precise one [vertex](ref:vertex?repeat) at a time.

A **tree** is a nonempty connected undirected graph with no cycles. A **forest** is an undirected graph with no cycles, possibly disconnected or empty. Each nonempty component of a forest is a tree.

![A connected graph with no cycle](figure:graph-tree)

A single [vertex](ref:vertex?repeat) with no [edges](ref:edge?repeat) is a tree. For any tree with at least two [vertices](ref:vertex?repeat), there are at least two leaves. To prove this, choose a path of maximum length; finiteness guarantees one exists. An endpoint has a neighbor along the path. Any additional neighbor on the path would create a cycle, and any neighbor outside the path would extend it. Both are impossible. Thus both endpoints have degree 1.

**Tree [edge](ref:edge?repeat) count.** Every tree on $n\geq1$ [vertices](ref:vertex?repeat) has $n-1$ [edges](ref:edge?repeat).

Proof by induction on $n$: a one-[vertex](ref:vertex?repeat) tree has zero [edges](ref:edge?repeat). For a larger tree, remove a leaf and its incident [edge](ref:edge?repeat). The remaining graph is acyclic because deleting objects cannot create a cycle. It is connected because a leaf cannot be an interior [vertex](ref:vertex?repeat) of a path between two remaining [vertices](ref:vertex?repeat). The smaller tree has $n-2$ [edges](ref:edge?repeat) by induction; restoring the removed [edge](ref:edge?repeat) gives $n-1$.

If a forest has $n$ [vertices](ref:vertex?repeat) and $c$ components, let $n_i$ be the number of [vertices](ref:vertex?repeat) in component $i$. The subscript $i$ identifies which component we mean; $i$ runs from 1 to $c$. Apply the result to each component and add the counts to obtain the total number $m$ of [edges](ref:edge?repeat):

$$
m=\sum_{i=1}^c(n_i-1)=n-c.
$$

For the empty forest, $n=c=m=0$, so the formula still holds.

## Equivalent characterizations of trees

We can recognize the same structure through paths, cycles, or [edge](ref:edge) counts, but the conditions must be paired correctly. Having $n-1$ [edges](ref:edge?repeat) alone says how many connections exist, not how they are arranged. The equivalences below explain which additional information makes that count decisive.

For a finite undirected graph with $n\geq1$, the following conditions are equivalent:

1. The graph is connected and acyclic.
2. Every pair of distinct [vertices](ref:vertex) has exactly one path between them.
3. The graph is connected and has $n-1$ [edges](ref:edge?repeat).
4. The graph is acyclic and has $n-1$ [edges](ref:edge?repeat).

Here is why the [edge](ref:edge?repeat) counts do not stand alone. A cycle on three [vertices](ref:vertex?repeat) plus an isolated fourth [vertex](ref:vertex?repeat) has $n-1=3$ [edges](ref:edge?repeat), yet is disconnected and is not a tree.

To relate conditions 1 and 2, connectivity supplies a path. If two distinct paths join the same endpoints, follow them until they diverge and then first meet again; those portions form a cycle. Conversely, a cycle supplies two different paths between [vertices](ref:vertex?repeat) on it. Thus uniqueness of paths is exactly the absence of cycles within a connected graph.

Every finite connected graph contains a **spanning tree**, a tree using all its [vertices](ref:vertex?repeat). Repeatedly delete an [edge](ref:edge?repeat) on a cycle. Connectivity remains because the rest of that cycle still connects the [edge](ref:edge?repeat)'s endpoints. The process terminates in a connected acyclic graph. Hence every connected graph has at least $n-1$ [edges](ref:edge?repeat). If it had exactly $n-1$ and contained a cycle, deleting a cycle [edge](ref:edge?repeat) would produce a connected graph with only $n-2$ [edges](ref:edge?repeat), a contradiction. This proves condition 3 implies condition 1.

For condition 4, the forest identity gives $n-1=n-c$, hence $c=1$. The graph is connected and therefore a tree. The earlier [edge](ref:edge?repeat)-count proof gives the remaining implications.

## Rooted trees

Choosing a root gives an undirected tree a reference point. “Parent,” “child,” and “depth” then describe positions relative to that choice, rather than new [edges](ref:edge). The same underlying tree can have different parent-child relationships if another [vertex](ref:vertex) is chosen as root.

A **rooted tree** is a tree with one distinguished [vertex](ref:vertex?repeat) called the root. The unique path from the root to a [vertex](ref:vertex?repeat) determines that [vertex](ref:vertex?repeat)'s parent: the vertex immediately preceding it along that path. The root itself has no parent. [Vertices](ref:vertex?repeat) having a given parent are its children. A [vertex](ref:vertex?repeat)'s depth is its distance, in [edges](ref:edge?repeat), from the root.

The root has no parent. Every other [vertex](ref:vertex?repeat) has exactly one, which gives another explanation for the $n-1$ [edges](ref:edge?repeat): associate each [edge](ref:edge?repeat) with its child endpoint. A rooted-tree leaf means a [vertex](ref:vertex?repeat) with no children. A one-[vertex](ref:vertex?repeat) rooted tree has a leaf root; a root with one child has undirected degree 1 but is not a rooted-tree leaf.

An **internal [vertex](ref:vertex?repeat)** is a [vertex](ref:vertex?repeat) with at least one child; it is a nonleaf [vertex](ref:vertex?repeat). A **binary tree** has at most two children per [vertex](ref:vertex?repeat); it need not have exactly two. In a **full binary tree**, every nonleaf [vertex](ref:vertex?repeat) has exactly two children. If there are $I$ internal [vertices](ref:vertex?repeat) and $L$ leaves, counting parent-child [edges](ref:edge?repeat) gives $2I=I+L-1$, so $L=I+1$. This identity does not apply to every binary tree.

![Choose a root and read the parent relationships](figure:graph-root)

## Directed acyclic graphs and scheduling

Dependencies point in a direction: completing one task permits another to begin. A directed cycle would make a sequential schedule impossible because each task would wait for another in the cycle. Without cycles, there must be somewhere to start. The in-degree-zero argument explains why a finite acyclic dependency graph always provides such a starting task.

A **directed acyclic graph**, or DAG, has no directed cycles. A **topological ordering** lists all [vertices](ref:vertex) so that every [arc](ref:digraph) goes from an earlier [vertex](ref:vertex?repeat) to a later one. If $u\to v$ means task $u$ must finish before task $v$ starts, such an ordering gives a valid sequential schedule.

Every nonempty finite DAG has a [vertex](ref:vertex?repeat) of in-degree zero. Otherwise start anywhere and repeatedly follow an incoming [arc](ref:digraph?repeat) backward. Since the [vertex](ref:vertex?repeat) set is finite, some [vertex](ref:vertex?repeat) repeats, producing a directed cycle, a contradiction.

Remove an in-degree-zero [vertex](ref:vertex?repeat), place it first, and repeat on the remaining DAG. Induction proves this constructs a topological ordering. Conversely, a directed cycle cannot fit such an ordering: each cycle [vertex](ref:vertex?repeat) would need to come before the next, eventually requiring a [vertex](ref:vertex?repeat) to come before itself.

For [arcs](ref:digraph?repeat) $a\to c$, $b\to c$, and $c\to d$, both $a,b,c,d$ and $b,a,c,d$ are topological orderings. They need not be unique. If a scheduling algorithm becomes stuck with [vertices](ref:vertex?repeat) remaining and no available in-degree-zero [vertex](ref:vertex?repeat), the remaining [digraph](ref:digraph?repeat) contains a cycle.

![Compare two valid topological orderings](figure:graph-dag)

## Representing a graph

An **algorithm** is a specified step-by-step procedure. An **array** stores entries in numbered positions; **direct indexing** means selecting an entry by its position rather than searching through earlier entries. A **constant-time** operation has a bounded cost independent of the number of [vertices](ref:vertex) under the chosen model of computation. These are assumptions about the operations available, not promises that every computer takes the same number of seconds.

A **matrix** is a rectangular table of entries, organized into rows and columns. An adjacency matrix reserves a place for every possible pair, making one specified connection easy to look up. An adjacency list instead records the connections that actually exist, making it convenient to enumerate neighbors. Neither representation changes the graph, but each makes different questions cheaper to answer.

An **adjacency matrix** has one row and column per [vertex](ref:vertex?repeat), with entry 1 for an [edge](ref:edge) and 0 otherwise. For a simple undirected graph it is symmetric with zeros on the diagonal. It uses $n^2$ entries, and checking a specified pair for adjacency takes constant time with direct array access.

An **adjacency list** stores each [vertex](ref:vertex?repeat)'s neighbors. Undirected [edges](ref:edge?repeat) appear in two lists, while directed [arcs](ref:digraph) appear once in outgoing-neighbor lists. The storage is proportional to $n+m$. Lists are often preferable for sparse graphs, where relatively few [vertex](ref:vertex?repeat) pairs are adjacent. Finding all neighbors takes time proportional to that list's length; testing one specific neighbor in an unsorted list may require scanning it.

![Read the graph as a matrix or as neighbor lists](figure:graph-matrix)

The representation affects algorithms. A claim about efficiency should name the representation and the operations being counted.

## Breadth-first and depth-first search

A **traversal** systematically visits the [vertices](ref:vertex) reachable from a starting [vertex](ref:vertex?repeat). To **mark** a [vertex](ref:vertex?repeat) means to record that it has already been found. **Backtracking** means returning to an earlier unfinished part of the search. Imagine exploring an unfamiliar network. One strategy finishes checking everything one step away before moving farther out; another follows one route as far as it can before backtracking. These are breadth-first and depth-first search. Marking visited [vertices](ref:vertex?repeat) is essential in both, because otherwise a cycle could send the exploration around indefinitely.

A **queue** is a first-in, first-out list: **enqueue** adds an item at the back, and **dequeue** removes the item that has been waiting at the front the longest. In BFS, a [vertex](ref:vertex?repeat) is **discovered** when it is first marked and enqueued; it is processed later when dequeued. The **discovery order** lists [vertices](ref:vertex?repeat) when they are first marked. If several neighbors are available, a stated order such as alphabetical order tells us which to examine first.

**Breadth-first search** (BFS) explores [vertices](ref:vertex?repeat) in increasing distance from a starting [vertex](ref:vertex?repeat), using that queue. Mark [vertices](ref:vertex?repeat) when first discovered, so they enter the queue once. The **parent** recorded by this search is the [vertex](ref:vertex?repeat) from which a new [vertex](ref:vertex?repeat) was first discovered. These parent connections form a rooted tree on the reached [vertices](ref:vertex?repeat).

```text
mark start; distance[start] = 0; enqueue start
while the queue is not empty:
    u = dequeue
    for each neighbor v of u:
        if v is unmarked:
            mark v
            distance[v] = distance[u] + 1
            parent[v] = u
            enqueue v
```

A **weighted graph** assigns a numerical cost or length, called a **weight**, to each [edge](ref:edge). An **unweighted graph** counts every [edge](ref:edge?repeat) as one step.

All distance-$d$ [vertices](ref:vertex?repeat) are processed before distance-$(d+1)$ [vertices](ref:vertex?repeat). If a shorter path to a newly discovered [vertex](ref:vertex?repeat) existed, its preceding [vertex](ref:vertex?repeat) would have appeared in an earlier layer and discovered it earlier. Thus BFS finds minimum [edge](ref:edge?repeat)-count distances in an unweighted graph. For digraphs, scan outgoing [arcs](ref:digraph) to find directed distances. With unequal [edge](ref:edge?repeat) weights, minimum [edge](ref:edge?repeat) count need not mean minimum total weight.

A **stack** is last-in, first-out: the most recently added item is the next removed. It records the most recent unfinished branch, whereas the BFS queue records the earliest waiting [vertex](ref:vertex?repeat). If an exercise asks for an exact traversal order, use its stated neighbor order; different tie choices can give different valid orders without changing which [vertices](ref:vertex?repeat) are reachable.

**Depth-first search** (DFS) explores an unvisited neighbor recursively, finishing that branch before returning, or uses an explicit stack. Both searches discover all [vertices](ref:vertex?repeat) reachable from their starting [vertex](ref:vertex?repeat). Starting again at an undiscovered [vertex](ref:vertex?repeat) finds another undirected component.

![Step through breadth-first and depth-first discovery](figure:graph-search)

With adjacency lists, a full traversal takes time proportional to $n+m$: each [vertex](ref:vertex?repeat) is discovered once and each list entry examined once. With an adjacency matrix, scanning all possible neighbors for every [vertex](ref:vertex?repeat) takes time proportional to $n^2$. These bounds assume constant-time marking and ordinary array or list operations.

## Euler trails and Hamiltonian cycles

Delivering along every road and visiting every city are different route-planning questions. The first cares about [edges](ref:edge); the second cares about [vertices](ref:vertex). Distinguishing those goals before applying a theorem prevents a common error: using an [edge](ref:edge?repeat)-count parity rule to decide a question about visiting [vertices](ref:vertex?repeat).

An **Euler trail** uses every [edge](ref:edge?repeat) exactly once. It may revisit [vertices](ref:vertex?repeat). An Euler circuit is a closed Euler trail. A **Hamiltonian cycle** visits every [vertex](ref:vertex?repeat) exactly once before returning to its start; it need not use every [edge](ref:edge?repeat).

For an undirected graph with at least one [edge](ref:edge?repeat), an Euler circuit exists exactly when all non-isolated [vertices](ref:vertex?repeat) belong to one component and every degree is even. An open Euler trail with distinct endpoints exists exactly when the same connectivity condition holds and exactly two [vertices](ref:vertex?repeat) have odd degree.

The parity necessity follows by pairing entries and departures at each [vertex](ref:vertex?repeat). A closed trail pairs all incident uses; an open trail leaves one unpaired use at each endpoint. For sufficiency in the even-degree case, follow unused [edges](ref:edge?repeat) until returning to the start. If [edges](ref:edge?repeat) remain in the connected [edge](ref:edge?repeat)-bearing part, begin another closed trail at a [vertex](ref:vertex?repeat) of the existing trail and splice it in. Repeating exhausts the finite [edge](ref:edge?repeat) set. The two-odd-[vertex](ref:vertex?repeat) case can be reduced to this by adding a temporary [edge](ref:edge?repeat) joining the odd [vertices](ref:vertex?repeat), allowing a parallel [edge](ref:edge?repeat) for this auxiliary argument, then removing that [edge](ref:edge?repeat) from the resulting circuit.

A square has both an Euler circuit and a Hamiltonian cycle. A **complete graph** contains an [edge](ref:edge?repeat) between every pair of distinct [vertices](ref:vertex?repeat). The complete graph on four [vertices](ref:vertex?repeat) has a Hamiltonian cycle, but all four degrees are 3, so it has no Euler trail. Visiting every [vertex](ref:vertex?repeat) and traversing every [edge](ref:edge?repeat) are different requirements; the Euler parity test is not a Hamiltonian criterion.

![A Hamiltonian cycle that leaves edges unused](figure:graph-euler-hamilton)

> **From a city [walk](ref:walk) to an abstract problem.** Euler's work on the seven bridges of Königsberg asked whether a [walk](ref:walk?repeat) could cross every bridge exactly once. The essential information was which land regions the bridges joined, not their lengths or the shape of the river. Some regions had multiple bridges between them, so that historical model permits parallel [edges](ref:edge?repeat) unlike our default simple graphs. It is a memorable example of finding the mathematical structure by deciding which physical details to ignore. See the [Mathematical Association of America's account of Euler's bridge problem](https://old.maa.org/press/periodicals/convergence/leonard-eulers-solution-to-the-konigsberg-bridge-problem).

## Readiness check

Before continuing, check that you can:

- State whether a model is directed, permits [loops](ref:self-loop), or permits repeated [edges](ref:edge).
- Distinguish [walks](ref:walk), trails, paths, and cycles under the stated conventions.
- Use degree sums and parity to check a claimed graph.
- Prove a tree property rather than relying only on its appearance.
- Explain spanning trees, rooted-tree terminology, and topological orderings.
- Trace BFS and DFS and state the assumptions behind their running times.
- Distinguish [edge](ref:edge?repeat)-covering Euler questions from [vertex](ref:vertex)-visiting Hamiltonian questions.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
