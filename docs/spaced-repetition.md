# Spaced repetition and review design

Status: product/design direction. The first implementation is documented in [Review system v1](review-system.md), including concrete scheduling rules and intentional limits. The broader curriculum mix and future statistical modeling below remain design guidance.

## Purpose

The review system should provide ongoing, spaced retrieval of concepts and skills without reducing mathematics study to a conventional flashcard deck.

It must preserve meaningful differences between recognizing an idea, recalling terminology, interpreting notation, applying a concept, constructing a witness or counterexample, explaining reasoning, and proving a statement.

The central goal is **evidence-efficient review**: frequent low-cost retrieval where that is sufficient, with less frequent but essential higher-cost construction and proof tasks.

The evidence from the first two lessons is enough to begin with a simple scheduler. It is not enough to justify numerical mastery probabilities, personalized forgetting curves, or a psychometric model. The first review system should therefore be transparent and deliberately conservative while it collects real delayed-retrieval evidence.

## Architectural ownership

The Go server is authoritative for review scheduling and review state.

The server should own:

- activation of review targets;
- due dates and intervals;
- target state;
- queue construction;
- session planning;
- selection and instantiation of review templates;
- deterministic review generation where applicable;
- interpretation of review outcomes for future scheduling;
- persistence of review context with attempts.

The React/TypeScript client should own presentation and local interaction concerns:

- displaying the review queue and counts;
- selecting study mode and optional practice filters;
- rendering review instances through the existing exercise UI;
- collecting uncertainty, effort, handwriting, photos, and other existing attempt input;
- submitting attempts to the server;
- offline-compatible local work where supported by the existing synchronization model.

The client may have API-facing TypeScript types corresponding to server models, but the scheduling model should not be client-owned.

Conceptually:

```text
immutable learning evidence
          |
          v
      Go scheduler
          |
          v
      due targets
          |
          v
   Go session planner
          |
          v
   review instances
          |
          v
 React exercise UI
          |
          v
 attempt submission
          |
          v
Go grading/evidence pipeline
          |
          v
new delayed evidence
          |
          +----------> Go scheduler
```

## Schedule knowledge targets, not questions

The scheduler should normally schedule a **knowledge target**, not a particular authored exercise.

The basic target is expected to be approximately:

```text
concept x skill
```

Examples:

```text
quantifier-order x interpret
quantifier-order x construct
counterexample x construct
logical-equivalence x transform
```

Some discrete facts or terminology may need an optional finer-grained objective:

```text
concept x skill x objective
```

Examples:

```text
conditional-language x recall x only-if-direction
existential-quantification x recall x witness-definition
```

An objective should be used when useful; it should not turn every vocabulary item into a new top-level concept.

The scheduler answers, "What knowledge needs testing now?" A separate template system answers, "How should that knowledge be tested this time?" Keeping those responsibilities separate is a core design decision.

## Lessons and Review have different jobs

Lessons remain authored instructional sequences. They contain explanations, examples, quick checks, practice, and occasional deeper exercises.

Review is dynamic. It draws from currently eligible and due review targets rather than from a fixed ordered problem set.

The application should eventually expose a top-level **Review** destination. Its question view can reuse the existing exercise UI and grading pipeline rather than introducing a parallel interaction system.

## Review templates

A review template describes a family of tasks capable of producing evidence for one or more targets.

Three template families are expected.

### Fixed

Fixed templates are useful when repetition is itself appropriate, especially for definitions, terminology, canonical rules, and theorem statements.

Examples include "What is a predicate?", "What is a witness?", "Define injective", and "What is the contrapositive of `P -> Q`?"

### Authored variants

A small set of human-authored alternate forms can test the same knowledge from different directions.

For terminology these may include:

- term to definition;
- definition to term;
- cloze deletion;
- recognition among alternatives;
- distinction from a closely related term;
- slight restatements.

### Deterministically generated variants

Symbolic, algebraic, logical, and numeric tasks should use deterministic parameterized generators where safe and useful.

For example, rather than repeatedly showing exactly:

```text
forall x exists y (x + y = 0)
```

a review family could instantiate related tasks such as:

```text
forall x exists y (x + y = 4)
```

or:

```text
forall x exists y (x - y = 0)
```

The purpose is to test the underlying witness-dependence idea instead of memory of a particular lesson exercise.

Generated instances should be reproducible. A review attempt should retain the template identifier, seed, and relevant parameters so that the exact task can later be reconstructed and audited.

Unrestricted LLM problem generation is not required for the initial system and should not be the default. Deterministic generation preserves known answers, known educational intent, reproducibility, and reliable metadata.

## Definition and terminology review

Exact or near-exact repetition is acceptable for terminology. Some vocabulary should eventually become immediately retrievable.

A definition may be tested in several directions. For example, `witness` might appear as:

- "What is a witness?"
- "What term describes a value demonstrating an existential statement?"
- "A _____ is a value satisfying an existentially quantified condition."
- a recognition or distinction question.

Recognition and free recall should remain distinguishable where useful. Recognizing the correct definition among choices is not the same evidence as producing it from memory.

## Activation: reading is not enough

Reading position is not a trustworthy activation signal because reading is nonlinear. A learner may preview future sections, reread old material, jump between sections, or consult reference material repeatedly.

Therefore merely viewing content should not start spaced repetition.

The system should distinguish **encountered** from **activated**.

### Encountered

Encountered is weak evidence that material has been seen. Examples include viewing a section, opening a definition in Reference, or seeing a term in feedback.

Encounter data may be retained as exposure evidence, but encounter alone does not schedule review.

### Activated

Activated means the learner has actively worked with the knowledge.

Typical activation events are:

- submitting an exercise tagged with the concept or objective;
- completing a deterministic concept check;
- deliberately requesting practice for that concept or objective.

Only activated review targets become eligible for scheduling.

## Cheap checks provide clean activation points

If terminology matters enough to retain, the curriculum should provide an active checkpoint instead of relying on scroll telemetry.

For example, after introducing free and bound variables:

> In `forall x P(x, y)`, which variable is free?

That quick deterministic question checks initial understanding, gives the system a clean activation boundary, produces first retrieval evidence, and allows associated definition objectives to enter Review.

A useful future lesson pattern is:

```text
explain concept
    |
introduce terminology
    |
1-3 cheap deterministic checks
    |
application exercises
    |
occasional deeper reasoning/proof
```

A definition does not have to be explicitly asked in the activating exercise. An exercise about constructing an existential witness can activate a separate `witness-definition` review objective even if the original exercise never asks for the word "witness."

## Evidence cost and exercise balance

The first two lessons show that free-response and proof-style exercises provide important evidence but are substantially more expensive in time and attention than deterministic T/F, multiple-choice, matching, and similar questions.

The curriculum should therefore deliberately balance evidence cost.

The intended hierarchy is:

- **Rapid drill, low cost:** T/F, MCQ, matching, classification.
- **Short construction, medium cost:** witness, short symbolic response, brief counterexample.
- **Full reasoning, high cost:** explanation, derivation, proof, model construction.

A rough initial lesson mix might be 60-70% rapid deterministic questions, 20-25% short constructive questions, and 10-20% full open-ended reasoning. These percentages are guidelines, not quotas.

The durable principle is:

> Use cheap questions for breadth and frequent retrieval, and use expensive questions strategically for depth.

## Prefer deterministic grading where possible

If correctness can be represented cleanly as structured data, grading should normally be deterministic.

Examples include:

- true/false;
- multiple choice;
- multi-select;
- matching;
- ordering;
- classification;
- numeric responses;
- some constrained symbolic responses;
- truth tables;
- structured witness selection.

AI grading should be reserved for responses whose correctness genuinely depends on interpreting free-form mathematical reasoning.

This reduces learner friction, grading latency, model cost, and grader noise.

## Cheap evidence does not replace deep evidence

Many recognition successes must not indefinitely substitute for production or proof.

For example, five correct multiple-choice questions about quantifier order should not automatically satisfy a due target such as:

```text
quantifier-order x construct
```

or:

```text
quantifier-order x justify
```

The system should distinguish evidence levels such as:

```text
recognition
production
reasoning
```

A stronger task may provide evidence for several weaker requirements when its structure genuinely demonstrates them. A proof may, for example, provide interpretation, construction, and justification evidence simultaneously. The reverse should not happen automatically.

## Initial scheduler

The first scheduler should be simple, deterministic, and inspectable.

Possible starting rules are:

- clean first-try success: first review in about 5-7 days;
- correct but marked Unsure: about 2-3 days;
- correct after one substantive error: about 1-2 days;
- multiple substantive errors: about 1 day;
- primarily clerical or prompt-compliance error: about 5-7 days;
- answer or reasoning effectively revealed: about 1 day.

Likewise, a delayed review might initially use simple rules such as:

```text
clean delayed success -> substantially expand interval
success but Unsure    -> expand interval less
failure               -> sharply contract/reset interval
```

The exact constants are not yet decisions. They should be easy to inspect and change while delayed-retention data accumulates.

The scheduler should not initially emit an opaque numerical mastery score.

## Scheduling state is separate from immutable evidence

Attempts and grades remain historical observations. Review scheduling is mutable state derived from those observations.

A server-side model might eventually resemble:

```go
type ReviewState struct {
    Concept   string  `json:"concept"`
    Skill     string  `json:"skill"`
    Objective *string `json:"objective,omitempty"`

    DueAt        int64   `json:"dueAt"`
    IntervalDays float64 `json:"intervalDays"`

    LastReviewedAt              *int64 `json:"lastReviewedAt,omitempty"`
    ConsecutiveDelayedSuccesses int    `json:"consecutiveDelayedSuccesses"`
}
```

This is illustrative rather than a committed schema.

The important rule is that the scheduler consumes evidence and updates review state; it does not rewrite historical observations into a permanent `mastery = 0.74` field.

## Preserve review context with attempts

A review attempt should record why and how the task was presented so later analysis can distinguish immediate practice from genuine delayed retrieval.

Illustratively:

```go
type ReviewContext struct {
    Kind string `json:"kind"`

    TemplateID string `json:"templateId"`

    ScheduledFor int64 `json:"scheduledFor"`
    PresentedAt  int64 `json:"presentedAt"`

    Concept   string  `json:"concept"`
    Skill     string  `json:"skill"`
    Objective *string `json:"objective,omitempty"`

    PreviousReviewAt *int64  `json:"previousReviewAt,omitempty"`
    IntervalDays     float64 `json:"intervalDays"`

    Seed       *string        `json:"seed,omitempty"`
    Parameters map[string]any `json:"parameters,omitempty"`
}
```

This makes it possible to distinguish correct performance during immediate practice from correct, unassisted performance on a novel variant after fourteen days. Those should not be treated as equivalent evidence.

## Session planning is separate from long-term scheduling

There are two distinct scheduling problems.

### Long-term scheduler

The long-term scheduler determines when a target should next be tested.

### Session planner

The session planner determines which currently eligible task should appear next.

The session planner should interleave topics rather than presenting several near-identical tasks consecutively. Blocked practice can make performance look stronger than it is.

A session might intentionally alternate:

```text
quantifier order
-> terminology
-> set identity
-> countermodel
-> definition
-> quantifier order
```

## Study modes

The learner will sometimes be in a context where only low-friction interaction is practical. A phone is the clearest example: tapping a choice is easy, while entering TeX, handwriting on paper, or photographing work is cumbersome.

Review should therefore support at least two modes:

- **Regular**
- **Quick**

There is still one underlying due queue. The selected mode filters which due targets have compatible review instances for the current session.

### Quick mode

Quick mode may include definitions, T/F, MCQ, matching, classification, other tap-oriented tasks, and possibly very short text responses.

Longer construction, proof, handwriting, or photo-based tasks are not discarded or downgraded. They remain due for a later compatible session.

For example:

```text
11 reviews due
8 quick-compatible
3 deeper reviews
```

Completing Quick mode may clear the eight compatible reviews while the remaining three continue to be due.

Core rule:

> Study modes filter eligible review instances; they never erase unmet review targets.

## Interaction cost is not cognitive difficulty

A difficult conceptual multiple-choice question can be quick to answer. A mathematically easy derivation can still be awkward on a phone.

Review metadata should therefore keep distinct notions for cognitive level, interaction cost, and input requirements.

Possible input requirements include:

```text
tap
short-text
math-text
handwriting
photo
```

Study-mode filtering should primarily concern interaction compatibility, not mathematical difficulty.

## Deferred deep work remains visible

Quick mode should not falsely report that Review is complete when deeper targets remain due.

The UI should expose the distinction without guilt-oriented language, for example:

```text
Due: 11
Quick: 8
Deep: 3
```

After a quick session it might say, "Quick reviews complete. Three deeper reviews remain due."

A deferred deep target keeps its original due state. Quick study should not silently move its due date forward. When Regular mode resumes, overdue deeper targets can receive appropriate priority.

## User-directed Practice

The scheduler should guide study rather than prevent intentional study.

The learner should be able to request focused practice by lesson, concept, skill, combinations of those filters, and compatible study mode.

Examples:

```text
Sets -> Set inclusion -> Prove
Quantifier order -> Quick
Lesson 2 -> all compatible practice
```

This should be conceptually separate from scheduler-driven Review.

A useful product distinction is:

- **Review:** what the scheduler says is due.
- **Quick Review:** the same due system filtered to low-friction tasks.
- **Practice:** what the learner deliberately chooses to work on.

They can share the same template and grading infrastructure.

## Focused practice produces evidence, but context matters

A manually requested practice item still produces real evidence. It should not be ignored.

However, repeated same-topic practice is not equivalent to cold delayed retrieval. The fifth set-inclusion proof in a focused session is weaker evidence of long-term retention than one correct proof after a twelve-day delay.

Attempts should therefore retain their context, such as:

```text
lesson
scheduled-review
focused-practice
```

If focused practice happens to satisfy an already-due target, it should generally count. The system should not pretend the learner failed to demonstrate a skill merely because they selected the topic manually.

Future scheduling may choose to expand the interval less aggressively from intentionally primed focused practice than from an equivalent cold scheduled review.

## Lesson scope is a UI filter, not the memory model

"Practice Lesson 2" is a useful learner-facing request, but the underlying selection should still be based on concept/skill/objective metadata.

A concept may span multiple lessons. The memory model should not duplicate knowledge simply because it appeared in more than one lesson.

## Explainability

Review scheduling should remain inspectable.

A target may eventually display something like:

> **Quantifier order - Interpret**
>
> Due today
>
> Reason: two substantive first-attempt errors; last delayed review six days ago.

The system should prefer concrete evidence over an opaque mastery percentage.

## The first review system is also a data-collection system

Once spaced review exists, it begins generating the longitudinal evidence that is currently missing:

```text
concept / skill / objective
        |
time since meaningful exposure
        |
review template and representation
        |
novel or repeated variant
        |
correctness
        |
uncertainty
        |
assistance
        |
effort
        |
error diagnosis
```

After enough delayed reviews accumulate, the project can investigate questions such as:

- How predictive is Unsure of later forgetting?
- How much should a first-attempt miss shorten an interval?
- How much retention evidence does an immediate retry provide?
- Do different skills decay at different rates?
- How much stronger is a fourteen-day success than a two-day success?
- Does representation affect retention?
- How should focused practice affect future intervals?
- How much can fast deterministic evidence substitute for expensive open-ended evidence before a deep check is needed?

Only then should a more sophisticated statistical scheduler be considered.

## High-level data flow

```text
Curriculum
|
+-- Lessons
|   +-- instructional content
|   +-- authored checks and practice
|
+-- Concept / skill / objective catalog
|
+-- Review templates
    +-- fixed recall
    +-- authored variants
    +-- deterministic generators

Immutable learning evidence
          |
          v
     Go scheduler
          |
          v
      Due targets
          |
          v
  Go session planner
          |
          +---- mode/filter constraints
          |
          v
  Template selection
          |
          v
   Review instance
          |
          v
React/TypeScript exercise UI
          |
          v
Existing grading/evidence pipeline
          |
          v
 New delayed evidence
          |
          +----------> Go scheduler
```

## Guiding principles

1. Do not equate reading with learning.
2. Schedule knowledge targets rather than individual questions.
3. Keep the Go server authoritative for scheduling and queue state.
4. Let review templates determine how a due target is tested.
5. Use many cheap probes and fewer expensive reasoning tasks.
6. Do not let recognition substitute indefinitely for production or proof.
7. Prefer deterministic grading whenever correctness can be represented structurally.
8. Use novel or isomorphic variants for application skills where practical.
9. Allow exact repetition for vocabulary when repetition is pedagogically useful.
10. Keep review scheduling state separate from immutable learning evidence.
11. Let Quick mode filter the queue without discarding deeper due work.
12. Support learner-directed Practice without allowing it to erase the distinction between massed practice and delayed retrieval.
13. Keep scheduling decisions explainable.
14. Use the first scheduler to collect genuine delayed-retention data before attempting mastery scores, forgetting curves, or psychometric optimization.
