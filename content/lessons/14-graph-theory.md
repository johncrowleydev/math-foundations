# Graph Theory

A graph models objects together with connections between them. Vertices might represent people, web pages, tasks, or computers; edges might represent friendships, links, dependencies, or communication channels. The same mathematical structure can answer questions about reachability, scheduling, and network design.

This lesson builds on [Sets](../lessons/03-sets-and-set-operations.md), [Relations](../lessons/04-relations.md), and [Strong Induction](../lessons/11-strong-induction.md). Graph terminology has several conventions, so we will state ours explicitly. The drawings can change without changing the graph: what matters is which vertices are connected, not where they sit on the page.

## Vertices, edges, and conventions

A graph deliberately forgets some details. A map may record road lengths, bends, and compass directions, while a simple connectivity question may need only to know which places have a direct road between them. Choosing vertices and edges is a modeling decision about which details matter. The conventions below say exactly what information our graph keeps.

A **finite simple undirected graph** is a pair $G=(V,E)$, where $V$ is a finite set of vertices and $E$ is a set of two-element subsets of $V$. Thus an edge $\{u,v\}$ joins two distinct vertices, has no direction, and appears at most once. Self-loops and parallel edges are excluded.

For example,

$$
V=\{a,b,c,d\},\qquad
E=\{\{a,b\},\{b,c\},\{c,a\},\{c,d\}\}.
$$

This is a triangle on $a,b,c$ with one extra edge from $c$ to $d$. The graph has four vertices and four edges. An edge crossing in a drawing does not create a vertex unless we explicitly make it one.

A **directed graph**, or digraph, uses ordered pairs $(u,v)$ called directed edges or arcs. In this lesson, directed graphs are finite, have no self-loops, and have at most one arc for each ordered pair. Both $(u,v)$ and $(v,u)$ may occur. A directed edge from a web page to another need not have a reverse edge.

Some applications need loops or multiple edges, but those are different graph models. Unless stated otherwise, an unqualified graph here is simple and undirected. Write $n=|V|$ and $m=|E|$.

## Adjacency and degree

Degree is a local count: stand at one vertex and count the edges touching it. Adding those local counts over the whole graph counts every edge twice, once from each end. That simple change of viewpoint—from vertices to edges—is a double-counting argument of the kind used in combinatorics.

Two vertices are **adjacent** if an edge joins them. An edge is **incident** to each of its endpoints. The **degree** $\deg(v)$ of an undirected vertex is the number of incident edges.

A **neighbor** of a vertex is a vertex adjacent to it. In a simple graph, counting a vertex's neighbors gives its degree.

In our example,

$$
\deg(a)=2,\quad\deg(b)=2,\quad\deg(c)=3,\quad\deg(d)=1.
$$

A degree-0 vertex is isolated. A degree-1 vertex is often called a leaf, especially in a tree.

The **handshaking lemma** is

$$
\sum_{v\in V}\deg(v)=2m.
$$

Proof: count vertex-edge incidences. Every edge has exactly two endpoints, so contributes exactly two to the sum of degrees. In the example, the degree sum is $2+2+3+1=8=2\cdot4$.

Consequently, the number of vertices of odd degree is even. The even-degree vertices contribute an even sum; because the total sum is even, the sum of the odd degrees is even too. A sum of odd integers is even exactly when there are an even number of terms.

For a digraph, the **out-degree** counts outgoing arcs and the **in-degree** counts incoming arcs. Each arc contributes once to each corresponding total:

$$
\sum_{v\in V}\deg^+(v)=m
=\sum_{v\in V}\deg^-(v).
$$

These are separate counts. A vertex can have large in-degree and zero out-degree.

## Walks, trails, paths, and cycles

Different travel questions permit different kinds of repetition. A traveler may revisit a city while avoiding repeated roads, or may need to avoid revisiting cities altogether. The terms below distinguish those requirements. Before classifying a proposed route, check the more basic point that every requested step is an edge in the graph.

A **walk** is a sequence $v_0,v_1,\ldots,v_k$ in which consecutive vertices are joined by edges. Its length is $k$, the number of traversed edges. Repetitions are allowed.

A **trail** is a walk with no repeated edge. A **simple path**, which we will usually shorten to **path**, has no repeated vertex. A length-0 path consists of a single vertex. Every path is a trail, and every trail is a walk; the converses need not hold.

In the example graph, $a,b,c,a,d$ is not even a walk: there is no edge from $a$ to $d$. The sequence $a,b,c,a,c,d$ is a walk but not a trail because edge $\{a,c\}$ is traversed twice. The sequence $a,b,c,a$ is a closed trail, but not a path because it repeats $a$.

An undirected **cycle** is a closed walk $v_0,v_1,\ldots,v_k$ with $k\geq3$, $v_k=v_0$, and all of $v_0,\ldots,v_{k-1}$ distinct. Thus $a,b,c,a$ is a cycle. Traversing a single undirected edge out and back is not a cycle: it repeats that edge and has length 2.

In directed walks, every step must follow an arc's direction. A directed cycle has distinct vertices except for the repeated start, and length at least 2 under our no-loop convention. Opposite arcs $(u,v)$ and $(v,u)$ therefore form a directed cycle of length 2.

## Connectivity and components

Two vertices can be connected without sharing a direct edge: a route through intermediate vertices is enough. A component gathers all vertices that can reach one another in this sense. An isolated vertex is its own component, while a missing edge between two vertices need not separate them if another route remains.

An undirected graph is **connected** if it is nonempty and every pair of vertices is joined by a path. A single vertex is connected by the length-0 path convention. We regard the empty graph as disconnected, with zero components. A **connected component** is a maximal connected group of vertices, together with the edges between them. Here maximal means that no further vertex can be added while preserving this property; it does not mean having the largest number of vertices among all components.

Why can reachability be defined with paths rather than arbitrary walks? If a walk repeats a vertex, remove the part between two occurrences. The remaining sequence is a shorter walk with the same endpoints. Repeating this deletion eventually produces a path. Thus existence of a walk implies existence of a path.

Reachability in an undirected graph is an equivalence relation on vertices: length-0 paths give reflexivity, reversing a path gives symmetry, and concatenating paths gives a walk that can be shortened to prove transitivity. Its equivalence classes are precisely the components.

Directed reachability need not be symmetric. A nonempty digraph is **strongly connected** if every vertex can reach every other by directed paths. It is **weakly connected** if ignoring directions produces a connected undirected graph. Under our convention the empty digraph is neither strongly nor weakly connected. The digraph $a\to b\to c$ is weakly connected but not strongly connected because $c$ cannot reach $a$.

## Trees and forests

A tree connects its vertices without retaining a cycle. Every edge is therefore doing indispensable work: removing it separates part of the graph. This balance between enough connection and no redundancy explains several tree properties. The leaf-removal proof below makes that balance precise one vertex at a time.

A **tree** is a nonempty connected undirected graph with no cycles. A **forest** is an undirected graph with no cycles, possibly disconnected or empty. Each nonempty component of a forest is a tree.

A single vertex with no edges is a tree. For any tree with at least two vertices, there are at least two leaves. To prove this, choose a path of maximum length; finiteness guarantees one exists. An endpoint has a neighbor along the path. Any additional neighbor on the path would create a cycle, and any neighbor outside the path would extend it. Both are impossible. Thus both endpoints have degree 1.

**Tree edge count.** Every tree on $n\geq1$ vertices has $n-1$ edges.

Proof by induction on $n$: a one-vertex tree has zero edges. For a larger tree, remove a leaf and its incident edge. The remaining graph is acyclic because deleting objects cannot create a cycle. It is connected because a leaf cannot be an interior vertex of a path between two remaining vertices. The smaller tree has $n-2$ edges by induction; restoring the removed edge gives $n-1$.

If a forest has $n$ vertices and $c$ components, apply the result to each component:

$$
m=\sum_{i=1}^c(n_i-1)=n-c.
$$

For the empty forest, $n=c=m=0$, so the formula still holds.

## Equivalent characterizations of trees

We can recognize the same structure through paths, cycles, or edge counts, but the conditions must be paired correctly. Having $n-1$ edges alone says how many connections exist, not how they are arranged. The equivalences below explain which additional information makes that count decisive.

For a finite undirected graph with $n\geq1$, the following conditions are equivalent:

1. The graph is connected and acyclic.
2. Every pair of distinct vertices has exactly one path between them.
3. The graph is connected and has $n-1$ edges.
4. The graph is acyclic and has $n-1$ edges.

Here is why the edge counts do not stand alone. A cycle on three vertices plus an isolated fourth vertex has $n-1=3$ edges, yet is disconnected and is not a tree.

To relate conditions 1 and 2, connectivity supplies a path. If two distinct paths join the same endpoints, follow them until they diverge and then first meet again; those portions form a cycle. Conversely, a cycle supplies two different paths between vertices on it. Thus uniqueness of paths is exactly the absence of cycles within a connected graph.

Every finite connected graph contains a **spanning tree**, a tree using all its vertices. Repeatedly delete an edge on a cycle. Connectivity remains because the rest of that cycle still connects the edge's endpoints. The process terminates in a connected acyclic graph. Hence every connected graph has at least $n-1$ edges. If it had exactly $n-1$ and contained a cycle, deleting a cycle edge would produce a connected graph with only $n-2$ edges, a contradiction. This proves condition 3 implies condition 1.

For condition 4, the forest identity gives $n-1=n-c$, hence $c=1$. The graph is connected and therefore a tree. The earlier edge-count proof gives the remaining implications.

## Rooted trees

Choosing a root gives an undirected tree a reference point. “Parent,” “child,” and “depth” then describe positions relative to that choice, rather than new edges. The same underlying tree can have different parent-child relationships if another vertex is chosen as root.

A **rooted tree** is a tree with one distinguished vertex called the root. The unique path from the root to a vertex determines that vertex's parent, unless it is the root. Vertices having a given parent are its children. A vertex's depth is its distance, in edges, from the root.

The root has no parent. Every other vertex has exactly one, which gives another explanation for the $n-1$ edges: associate each edge with its child endpoint. A rooted-tree leaf means a vertex with no children. A one-vertex rooted tree has a leaf root; a root with one child has undirected degree 1 but is not a rooted-tree leaf.

A binary tree has at most two children per vertex; it need not have exactly two. In a **full binary tree**, every nonleaf vertex has exactly two children. If there are $I$ internal vertices and $L$ leaves, counting parent-child edges gives $2I=I+L-1$, so $L=I+1$. This identity does not apply to every binary tree.

## Directed acyclic graphs and scheduling

Dependencies point in a direction: completing one task permits another to begin. A directed cycle would make a sequential schedule impossible because each task would wait for another in the cycle. Without cycles, there must be somewhere to start. The in-degree-zero argument explains why a finite acyclic dependency graph always provides such a starting task.

A **directed acyclic graph**, or DAG, has no directed cycles. A **topological ordering** lists all vertices so that every arc goes from an earlier vertex to a later one. If $u\to v$ means task $u$ must finish before task $v$ starts, such an ordering gives a valid sequential schedule.

Every nonempty finite DAG has a vertex of in-degree zero. Otherwise start anywhere and repeatedly follow an incoming arc backward. Since the vertex set is finite, some vertex repeats, producing a directed cycle, a contradiction.

Remove an in-degree-zero vertex, place it first, and repeat on the remaining DAG. Induction proves this constructs a topological ordering. Conversely, a directed cycle cannot fit such an ordering: each cycle vertex would need to come before the next, eventually requiring a vertex to come before itself.

For arcs $a\to c$, $b\to c$, and $c\to d$, both $a,b,c,d$ and $b,a,c,d$ are topological orderings. They need not be unique. If a scheduling algorithm becomes stuck with vertices remaining and no available in-degree-zero vertex, the remaining digraph contains a cycle.

## Representing a graph

An adjacency matrix reserves a place for every possible pair, making one specified connection easy to look up. An adjacency list instead records the connections that actually exist, making it convenient to enumerate neighbors. Neither representation changes the graph, but each makes different questions cheaper to answer.

An **adjacency matrix** has one row and column per vertex, with entry 1 for an edge and 0 otherwise. For a simple undirected graph it is symmetric with zeros on the diagonal. It uses $n^2$ entries, and checking a specified pair for adjacency takes constant time with direct array access.

An **adjacency list** stores each vertex's neighbors. Undirected edges appear in two lists, while directed arcs appear once in outgoing-neighbor lists. The storage is proportional to $n+m$. Lists are often preferable for sparse graphs, where relatively few vertex pairs are adjacent. Finding all neighbors takes time proportional to that list's length; testing one specific neighbor in an unsorted list may require scanning it.

The representation affects algorithms. A claim about efficiency should name the representation and the operations being counted.

## Breadth-first and depth-first search

Imagine exploring an unfamiliar network. One strategy finishes checking everything one step away before moving farther out; another follows one route as far as it can before backtracking. These are breadth-first and depth-first search. Marking visited vertices is essential in both, because otherwise a cycle could send the exploration around indefinitely.

**Breadth-first search** (BFS) explores vertices in increasing distance from a starting vertex, using a queue. Mark vertices when first discovered, so they enter the queue once.

A **queue** is a first-in, first-out list: **enqueue** adds an item at the back, and **dequeue** removes the item that has been waiting at the front the longest. A vertex is **discovered** when it is first marked and enqueued; it is processed later when dequeued. The **discovery order** lists vertices when they are first marked. If several neighbors are available, a stated order such as alphabetical order tells us which to examine first.

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

All distance-$d$ vertices are processed before distance-$(d+1)$ vertices. If a shorter path to a newly discovered vertex existed, its preceding vertex would have appeared in an earlier layer and discovered it earlier. Thus BFS finds minimum edge-count distances in an unweighted graph. For digraphs, scan outgoing arcs to find directed distances. With unequal edge weights, minimum edge count need not mean minimum total weight.

**Depth-first search** (DFS) explores an unvisited neighbor recursively, finishing that branch before returning, or uses an explicit stack. Both searches discover all vertices reachable from their starting vertex. Starting again at an undiscovered vertex finds another undirected component.

A **stack** is last-in, first-out: the most recently added item is the next removed. It records the most recent unfinished branch, whereas the BFS queue records the earliest waiting vertex. If an exercise asks for an exact traversal order, use its stated neighbor order; different tie choices can give different valid orders without changing which vertices are reachable.

With adjacency lists, a full traversal takes time proportional to $n+m$: each vertex is discovered once and each list entry examined once. With an adjacency matrix, scanning all possible neighbors for every vertex takes time proportional to $n^2$. These bounds assume constant-time marking and ordinary array or list operations.

## Euler trails and Hamiltonian cycles

Delivering along every road and visiting every city are different route-planning questions. The first cares about edges; the second cares about vertices. Distinguishing those goals before applying a theorem prevents a common error: using an edge-count parity rule to decide a question about visiting vertices.

An **Euler trail** uses every edge exactly once. It may revisit vertices. An Euler circuit is a closed Euler trail. A **Hamiltonian cycle** visits every vertex exactly once before returning to its start; it need not use every edge.

For an undirected graph with at least one edge, an Euler circuit exists exactly when all non-isolated vertices belong to one component and every degree is even. An open Euler trail with distinct endpoints exists exactly when the same connectivity condition holds and exactly two vertices have odd degree.

The parity necessity follows by pairing entries and departures at each vertex. A closed trail pairs all incident uses; an open trail leaves one unpaired use at each endpoint. For sufficiency in the even-degree case, follow unused edges until returning to the start. If edges remain in the connected edge-bearing part, begin another closed trail at a vertex of the existing trail and splice it in. Repeating exhausts the finite edge set. The two-odd-vertex case can be reduced to this by adding a temporary edge joining the odd vertices, allowing a parallel edge for this auxiliary argument, then removing that edge from the resulting circuit.

A square has both an Euler circuit and a Hamiltonian cycle. The complete graph on four vertices has a Hamiltonian cycle, but all four degrees are 3, so it has no Euler trail. Visiting every vertex and traversing every edge are different requirements; the Euler parity test is not a Hamiltonian criterion.

> **From a city walk to an abstract problem.** Euler's work on the seven bridges of Königsberg asked whether a walk could cross every bridge exactly once. The essential information was which land regions the bridges joined, not their lengths or the shape of the river. Some regions had multiple bridges between them, so that historical model permits parallel edges unlike our default simple graphs. It is a memorable example of finding the mathematical structure by deciding which physical details to ignore. See the [Mathematical Association of America's account of Euler's bridge problem](https://old.maa.org/press/periodicals/convergence/leonard-eulers-solution-to-the-konigsberg-bridge-problem).

## Readiness check

Before continuing, check that you can:

- State whether a model is directed, permits loops, or permits repeated edges.
- Distinguish walks, trails, paths, and cycles under the stated conventions.
- Use degree sums and parity to check a claimed graph.
- Prove a tree property rather than relying only on its appearance.
- Explain spanning trees, rooted-tree terminology, and topological orderings.
- Trace BFS and DFS and state the assumptions behind their running times.
- Distinguish edge-covering Euler questions from vertex-visiting Hamiltonian questions.

Open Practice for more problems, with space to develop each answer. Reveal the solution when you are ready to compare your reasoning.
