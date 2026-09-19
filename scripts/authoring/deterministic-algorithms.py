"""Source-pinned finite assessments for counting, recurrences, graphs and growth.

Run after publishing the audited source exercises. Inputs remain ordinary math,
short lists, or choices; proofs stay whole open. All fixtures are grading fixtures,
not sampled evidence for a universal mathematical assertion.
"""

from pathlib import Path
from hashlib import sha256
from copy import deepcopy
import json

ROOT = Path(__file__).resolve().parents[2]
SUBJECTS = [
    "recurrence-relations",
    "combinatorics",
    "graph-theory",
    "asymptotic-growth",
]
# These exact authored worksheets were inspected; re-audit source changes.
SOURCE_DIGESTS = {
    "content/worksheets/13-recurrence-relations.yaml": "9dec57d7f03e2481ac02514d1ffc373812b2755d19fb8847bf6184f6d23f4dc3",
    "content/worksheets/15-asymptotic-growth.yaml": "b912858147f1af5ee2711f81ea7c8c2946bbd17b3f0119e2edd803efa9e2ca72",
    "content/worksheets/14-graph-theory.yaml": "f5423d64cb3bf648ef43109148b6027952b3434a3ce0c524643e038c2ac2bb57",
    "content/worksheets/12-combinatorics.yaml": "7ed7ff77df399ea4c50ab5346aa5c2ed2b5dbf9ac6595523617653aeb174273a",
}
for source, digest in SOURCE_DIGESTS.items():
    assert sha256((ROOT / source).read_bytes()).hexdigest() == digest, (
        "Re-audit changed source: " + source
    )

AUDIT = {
    r["key"]: r
    for r in json.loads((ROOT / "docs/deterministic-grading-audit.json").read_text())[
        "exercises"
    ]
    if any(r["key"].startswith(s + "-") for s in SUBJECTS)
}
EXISTING = {
    f"{e['lesson']}-{e['id']}"
    for e in json.loads((ROOT / "content/deterministic-exercises.json").read_text())
}
ENTRIES, OPEN = {}, {}


class Task:
    def __init__(self, lesson, number):
        self.key = f"{lesson}-{number}"
        assert (
            self.key in AUDIT and self.key not in EXISTING and self.key not in ENTRIES
        ), self.key
        self.q = AUDIT[self.key]["publishedQuestion"]
        self.inputs, self.reqs, self.response, self.wrong, self.alt = [], [], {}, {}, {}
        self.shift = False

    def field(self, label, validator, params, value, wrong, alt=None, kind="math"):
        i = "answer-" + str(len(self.inputs) + 1)
        self.inputs.append({"id": i, "kind": kind, "label": label})
        self.reqs.append(
            {
                "id": i,
                "description": label + " is correct.",
                "validator": validator,
                "fields": [i],
                "params": params,
            }
        )
        self.response[i], self.wrong[i] = value, wrong
        if alt is not None:
            self.alt[i] = alt
        return i

    def num(self, label, value):
        v = str(value)
        return self.field(
            label, "exact", {"expected": [v]}, v, "(" + v + ")+1", "2*(" + v + ")/2"
        )

    def expr(
        self,
        label,
        value,
        variables=("n",),
        integer=True,
        positive=False,
        form=None,
        alt=None,
    ):
        p = {"variables": list(variables), "expected": value}
        if integer:
            p["integerVariables"] = list(variables)
        if positive:
            p["positiveVariables"] = list(variables)
        if "log2" in value:
            p["functions"] = ["log2"]
        if "floor" in value:
            p["functions"] = ["log2", "floor"]
        if form:
            p["form"] = form
        return self.field(
            label,
            "expression",
            p,
            value,
            "(" + value + ")+1",
            alt or "2*(" + value + ")/2",
        )

    def tuple(self, label, values, ordered=True):
        v = list(map(str, values))
        w = v[:]
        w[0] = "(" + w[0] + ")+1"
        return self.field(
            label,
            "tuple",
            {"expected": v, "ordered": ordered},
            "(" + ",".join(v) + ")",
            "(" + ",".join(w) + ")",
            "(" + ",".join("2*(" + x + ")/2" for x in v) + ")",
        )

    def boolean(self, label, value):
        return self.field(
            label, "boolean", {"expected": [value]}, value, not value, kind="boolean"
        )

    def select(self, label, correct, *wrong):
        i = "answer-" + str(len(self.inputs) + 1)
        opts = [
            {"id": f"option-{k + 1}", "label": v}
            for k, v in enumerate([correct, *wrong])
        ]
        k = int(self.key.rsplit("-", 1)[1]) % len(opts)
        opts = opts[k:] + opts[:k]
        self.inputs.append({"id": i, "kind": "select", "label": label, "options": opts})
        self.reqs.append(
            {
                "id": i,
                "description": label + " is correct.",
                "validator": "selection",
                "fields": [i],
                "params": {"expected": ["option-1"]},
            }
        )
        self.response[i], self.wrong[i] = "option-1", "option-2"
        self.shift = True

    def group(self, labels, validator, params, values, wrong, alt=None, kind="math"):
        fields = []
        for label, v, w in zip(labels, values, wrong):
            i = "answer-" + str(len(self.inputs) + 1)
            fields.append(i)
            self.inputs.append({"id": i, "kind": kind, "label": label})
            self.response[i], self.wrong[i] = v, w
        self.reqs.append(
            {
                "id": fields[0],
                "description": "All requested conditions hold.",
                "validator": validator,
                "fields": fields,
                "params": params,
            }
        )
        if alt:
            for i, v in zip(fields, alt):
                self.alt[i] = v
        return fields

    def finish(self, note="", prompt=None):
        original = [
            self.q["instructions"],
            self.q["prompt"],
            self.q.get("math"),
            self.q["officialAnswer"],
        ]
        digest = sha256(
            json.dumps(original, ensure_ascii=False, separators=(",", ":")).encode()
        ).hexdigest()
        lesson, number = self.key.rsplit("-", 1)
        fs = [{"response": self.response, "verdict": "correct"}]
        if self.alt:
            fs.append({"response": {**self.response, **self.alt}, "verdict": "correct"})
        # One wrong fixture per independent requirement prevents omitted subanswers.
        for r in self.reqs:
            bad = {**self.response}
            for i in r["fields"]:
                bad[i] = self.wrong[i]
            fs.append({"response": bad, "verdict": "incorrect"})
        first = next(iter(self.response))
        fs.append(
            {
                "response": {k: v for k, v in self.response.items() if k != first},
                "error": True,
            }
        )
        caps = list(
            dict.fromkeys(
                "tap"
                if i["kind"] in ["boolean", "select", "multiselect"]
                else "short-text"
                if i["kind"] == "text"
                else "math-text"
                for i in self.inputs
            )
        )
        a = {
            "version": 1,
            "inputs": self.inputs,
            "requirements": self.reqs,
            "feedback": {
                "correct": self.q["officialAnswer"],
                "incorrect": "Check each requested answer and selected reason.",
            },
            "evidence": {
                "level": "recognition" if caps == ["tap"] else "production",
                "interactionCost": "medium" if len(self.inputs) > 3 else "low",
                "inputCapabilities": caps,
            },
        }
        e = {
            "lesson": lesson,
            "id": number,
            "sourceHash": digest,
            "rationale": note
            or "The complete requested result has a finite deterministic check.",
            "assessment": a,
            "fixtures": fs,
        }
        if prompt:
            e["prompt"] = prompt
        if self.shift:
            # Preserve authored contexts, graph definitions and domain restrictions.
            e["instructions"] = (
                self.q["instructions"]
                + " "
                + (
                    "Enter the requested results and select the reason."
                    if caps != ["tap"]
                    else "Select the complete correct answer."
                )
            )
        ENTRIES[self.key] = e
        return e


def choice(s, n, c, *w):
    t = Task(s, n)
    t.select("Answer", c, *w)
    t.finish(
        "Short conceptual explanation becomes a complete answer-and-reason choice; no open response remains."
    )


def retain(s, n, reason):
    OPEN[f"{s}-{n}"] = reason


R = "recurrence-relations"
for n, v in {
    12: "3*4^n",
    14: "n^2",
    15: "2+n*(n+1)",
    16: "2^(n+1)-2",
    17: "3*n+2",
    21: "4*2^n-3",
    22: "3^(n+1)-1",
    23: "10-4*n",
    24: "2^n-1",
    25: "4+4*(1/2)^n",
    27: "3+4*(-1)^n",
    32: "(n+3)*2^n",
    33: "n*3^n",
    42: "2^n+3^n",
    43: "-2+3*2^n",
    44: "1+(-1)^n",
    46: "(1+2*n)*2^n",
    47: "3+2*n",
    65: "log2(n)+1",
    66: "2*n-1",
    67: "n*log2(n)+3*n",
    68: "2*n-1",
    77: "(n+1)*2^n",
}.items():
    t = Task(R, n)
    t.expr("Formula", v, positive=n >= 65 and n <= 68)
    t.finish(
        "Produce the complete closed formula with ordinary math input; exact symbolic equivalence on the authored integer domain."
    )
for n, terms, formula in [
    (6, [3, 7, 15], "2^(n+1)-1"),
    (7, [3, -3, 3, -3, 3], "3*(-1)^n"),
]:
    t = Task(R, n)
    t.tuple("Requested terms, in order", terms)
    t.expr("Formula", formula)
    t.finish()
for n, values in [
    (8, [("Initial term", 7), ("Value at every positive index", 4)]),
    (
        29,
        [
            ("Initial term", 5),
            ("Value at every positive index", -2),
            ("Equilibrium", -2),
        ],
    ),
]:
    t = Task(R, n)
    for label, v in values:
        t.num(label, v)
    t.finish(
        "Separate explicitly requested initial and later values avoid undefined zero-to-zero notation."
    )
t = Task(R, 26)
t.num("Equilibrium L", 4)
t.field(
    "Recurrence right side for b(n), where b(n)=a(n)−L",
    "recurrence",
    {"sequence": "b", "variable": "n", "maxLag": 8, "expected": "3*b(n-1)"},
    "3*b(n-1)",
    "b(n-1)",
    "b(n-1)+2*b(n-1)",
)
t.finish()
for n, seq, base in [(36, "F", 2), (38, "W", 1)]:
    t = Task(R, n)
    t.num(seq + "(0)", 1)
    t.num(seq + "(1)", base)
    v = f"{seq}(n-1)+{seq}(n-2)"
    t.field(
        "Recurrence right side for " + seq + "(n), n ≥ 2",
        "recurrence",
        {"sequence": seq, "variable": "n", "maxLag": 8, "expected": v},
        v,
        f"{seq}(n-1)-{seq}(n-2)",
        f"{seq}(n-2)+{seq}(n-1)",
    )
    t.finish(
        "Initial data and an ordinary typed recurrence; no coefficient slots or formula builder."
    )
t = Task(R, 39)
t.num("W(5)", 8)
t.select(
    "Why order matters",
    "Moves 1,2 and 2,1 are different ordered move sequences.",
    "The same move sizes in another order always count once.",
    "Order matters only if a move exceeds two steps.",
)
t.finish(
    "Keep the computed count as production and assess the short order explanation by selection."
)
t = Task(R, 41)
t.expr(
    "Characteristic polynomial (set equal to zero)",
    "r^2-5*r+6",
    variables=("r",),
    integer=False,
)
t.finish()
t = Task(R, 45)
t.expr(
    "Factored characteristic polynomial",
    "(r-2)^2",
    variables=("r",),
    integer=False,
    form="factored",
    alt="(r-2)*(r-2)",
)
t.finish("Polynomial equivalence and the requested factored form are both required.")
t = Task(R, 49)
t.num("a₀", 4)
t.num("a₁", 9)
t.num("Value at every index n ≥ 2", 0)
t.select(
    "Why the nonzero-root derivation fails",
    "It divides by powers of the root, which is zero here.",
    "Zero cannot be a characteristic root.",
    "The recurrence does not determine later terms.",
)
t.finish()
for n, base, step in [
    (30, 2, "3^(n+1)-1"),
    (57, 1, "2^n+1"),
    (58, 1, "2^(n+1)-1"),
    (74, 2, "4*2^n-n-2"),
    (79, 1, "3*n-2"),
]:
    t = Task(R, n)
    if n == 58:
        t.expr("Correct formula", "2^(n+1)-1")
    t.num("Value at the initial index", base)
    t.expr("Recurrence right side after substitution", step)
    if n == 57:
        t.select(
            "Conclusion",
            "The initial value passes, but the recurrence fails.",
            "Both defining conditions pass.",
            "The initial value fails, but the recurrence passes.",
        )
    t.finish(
        "Finite base and symbolic substitution results replace a brief verification; no proof narrative is requested.",
        prompt=t.q["prompt"]
        + " Enter the initial value and the recurrence right side after substitution.",
    )
t = Task(R, 62)
t.expr("Number of calls at level j", "2^j", variables=("j", "n"))
t.expr("Size of each subproblem", "n/2^j", variables=("j", "n"))
t.expr("Total nonrecursive work at level j", "n", variables=("j", "n"))
t.finish(
    "The question already requests a finite three-column description of one arbitrary level."
)
t = Task(R, 72)
t.expr("Constant counterexample T(n)", "1")
t.finish(
    "Explicitly bound the requested counterexample to constant functions; production remains typed.",
    prompt=t.q["prompt"].replace(
        "Give a counterexample if not.",
        "If not, give a constant-function counterexample.",
    ),
)
t = Task(R, 75)
t.expr("Formula", "1+2*n")
t.num("a₅", 11)
t.select(
    "Reason",
    "The recurrence preserves the first difference, which is 2.",
    "Every term doubles.",
    "The recurrence preserves a first difference of 1.",
)
t.finish()
t = Task(R, 76)
t.expr("Formula", "2^n")
t.select(
    "Why one component disappears",
    "The initial data make the coefficient of 3ⁿ zero.",
    "The characteristic equation has no root 3.",
    "Every second-order recurrence has only one component.",
)
t.finish()
for n, c, w1, w2 in [
    (
        4,
        "The initial value is unspecified; different starting values give different sequences.",
        "Adding 3 is not an explicit update rule.",
        "A recurrence can never determine a unique sequence.",
    ),
    (
        5,
        "Specify a₀ and a₁; apply the rule for n ≥ 2.",
        "Specify only a₀; apply it at n = 0.",
        "Specify a₀ and apply it at n = 1, using an unspecified a₋₁.",
    ),
    (
        20,
        "The telescoped left side is aₙ−a₀, so the initial value must be added.",
        "Each term n should be squared.",
        "There are n+1 increments from index 0 to n.",
    ),
    (
        28,
        "The denominator r−1 vanishes; direct iteration gives a₀+bn.",
        "The sequence is undefined when r=1.",
        "The numerator rⁿ−1 is never zero.",
    ),
    (
        40,
        "A disjoint, exhaustive decomposition is needed; a few counts do not determine later ones.",
        "Matching three terms proves the recurrence for every n.",
        "Initial counts are never useful even for testing a conjecture.",
    ),
    (
        54,
        "A legal strategy gives an upper bound; a lower bound must rule out every shorter strategy.",
        "A legal strategy automatically minimizes the move count.",
        "A strategy gives a lower bound only.",
    ),
    (
        59,
        "Both have a₀=1 but different a₁ values; a second initial condition distinguishes them.",
        "A second-order recurrence needs no initial data.",
        "Both sequences also agree at index 1.",
    ),
    (
        60,
        "No; the recurrence counts this program, while optimality needs a lower bound for every permitted program.",
        "Yes; every exactly solved recurrence proves optimality.",
        "No; exact recurrences cannot model programs.",
    ),
    (
        69,
        "Depth counts levels; total work also counts all calls on each level.",
        "Equal depth always gives equal work.",
        "Only leaf depth contributes to work.",
    ),
    (
        70,
        "Other sizes can produce floors and ceilings, so rounding requires separate bounds or proof.",
        "Every positive integer is a power of two.",
        "An exact formula never depends on the recurrence domain.",
    ),
    (
        73,
        "Substitution gives only cn+n, exceeding the target cn.",
        "The induction produces cn−n.",
        "A larger fixed c absorbs a new n at every level automatically.",
    ),
    (
        78,
        "Check the chosen operations, base cost, merge behavior and actual subproblem sizes.",
        "It is enough that the program has two recursive calls.",
        "The exact merge count is always n in every implementation.",
    ),
]:
    choice(R, n, c, w1, w2)
for n, reason in {
    10: "Inductive uniqueness argument over all sequence indices.",
    11: "Explicitly requests iteration as the solving method; preserve the work steps.",
    13: "Explicit telescoping derivation, not only the closed formula.",
    18: "Requests forming a sum and simplifying it; preserve the derivation.",
    19: "Explicit induction proof.",
    31: "Explicit normalization method and transformed recurrence work.",
    34: "Derivation of a general weighted-sum identity with arbitrary forcing function.",
    35: "Explicit weighted-contribution solution method.",
    48: "Universal repeated-root derivation justifying the factor n.",
    50: "Inductive uniqueness proof for a second-order recurrence.",
    51: "Derives optimal Hanoi cost, requiring matching construction and universal lower-bound reasoning.",
    53: "Explicit induction proof for Hanoi.",
    55: "General lower-bound proof covering every legal Hanoi strategy.",
    63: "Explicit recursion-tree derivation, not just the resulting cost.",
    64: "Explicit induction on the exponent.",
    71: "Universal recurrence-inequality induction.",
    80: "Open-ended description of a complete recurrence-solving workflow.",
}.items():
    retain(R, n, reason)

C = "combinatorics"
for n, count, reason, w1, w2 in [
    (
        2,
        28,
        "Each soup can be paired with each sandwich.",
        "The categories are alternatives, so add their counts.",
        "Divide by two because the foods are unordered.",
    ),
    (
        11,
        504,
        "The named offices distinguish positions, with 9, then 8, then 7 eligible people.",
        "Divide by 3! because the offices are identical.",
        "Each office has 9 choices even after someone is assigned.",
    ),
    (
        16,
        150,
        "Choose the two engineers and the two designers independently, then combine the groups.",
        "Choose any four people without regard to their groups.",
        "Choose one engineer and one designer, then double.",
    ),
    (
        17,
        315,
        "Count all four-person committees and subtract the all-engineer committees.",
        "Subtract all-designer committees instead.",
        "Choose exactly one designer; committees with more are forbidden.",
    ),
    (
        19,
        0,
        "Injectivity would require seven distinct outputs in a four-element codomain.",
        "Every input has four independent outputs, which always defines an injection.",
        "Only the first four domain elements need outputs.",
    ),
    (
        25,
        120,
        "Numbered seats distinguish assignments that a rotation would identify at an unnumbered table.",
        "Numbered seats identify every reflected assignment.",
        "Numbered seats force one designated person to sit first.",
    ),
    (
        27,
        36,
        "Seven stars and two separators encode occupancies of the three labeled boxes.",
        "Each distinct token independently chooses a box.",
        "Divide seven factorial by three factorial.",
    ),
    (
        28,
        15,
        "Place one token in each box first, then distribute the remaining four.",
        "Allow the boxes to be empty and use the original seven tokens.",
        "Assign each identical token a separate label.",
    ),
    (
        29,
        2187,
        "Each distinct token independently chooses one of three boxes.",
        "Stars and bars preserves every token identity.",
        "Only the final number of tokens in each box matters.",
    ),
    (
        31,
        120,
        "Every three-element subset occurs in 3! ordered selections.",
        "The denominator removes 10! copies of every subset.",
        "The denominator accounts for repetition being allowed.",
    ),
    (
        78,
        15,
        "Every unordered pair occurs in two orders, so divide the proposed count by two.",
        "The proposed count is already unordered.",
        "Divide by six because each object has five partners.",
    ),
]:
    t = Task(C, n)
    t.num("Count", count)
    t.select("Reason", reason, w1, w2)
    t.finish(
        "The count remains typed; its brief conceptual explanation becomes a reason choice."
    )
t = Task(C, 34)
t.expr(
    "Expanded polynomial",
    "a^4+4*a^3*b+6*a^2*b^2+4*a*b^3+b^4",
    variables=("a", "b"),
    integer=False,
    form="expanded",
    alt="b^4+4*b^3*a+6*b^2*a^2+4*b*a^3+a^4",
)
t.finish(
    "Require an expanded ordinary typed polynomial, not a supplied coefficient skeleton."
)
t = Task(C, 39)
t.field(
    "Sum of binomial coefficients",
    "binomial-sum",
    {"terms": [[6, 2], [6, 3]]},
    "binom(6,2)+binom(6,3)",
    "binom(6,1)+binom(6,3)",
    "binom(6,3)+binom(6,2)",
)
t.num("Value", 35)
t.finish(
    "Produce the complete binomial sum in ordinary math input; preserve the requested decomposition."
)
t = Task(C, 44)
t.num("Union size", 37)
t.select(
    "Accounting for overlaps",
    "Add the three single-set sizes, subtract all three pairwise intersections, and add the triple intersection.",
    "Add the single-set sizes and subtract the triple intersection only.",
    "Subtract each pairwise intersection and then subtract the triple intersection again.",
)
t.finish(
    "The answer remains produced; replace the short overlap-accounting explanation with its full inclusion–exclusion reason."
)
for n, count, boxes, occupancy, reason in [
    (
        52,
        49,
        12,
        4,
        "At most four in each of twelve months allows 48; one additional person forces five in a month.",
    ),
    (
        60,
        22,
        7,
        3,
        "At most three in each of seven residue classes allows 21; one additional integer forces four in a class.",
    ),
]:
    t = Task(C, n)
    t.num("Minimum number", count)
    t.tuple("Occupancies just below the threshold, one per class", [occupancy] * boxes)
    t.select(
        "Why this proves minimality",
        reason,
        "The displayed arrangement proves every class always has the same size.",
        "One less than the threshold already forces the requested occupancy.",
    )
    t.finish(
        "A finite extremal occupancy certificate plus the complete pigeonhole reason replaces brief minimality prose; no open part remains."
    )
t = Task(C, 53)
t.num("Guaranteed lower bound on the maximum occupancy", 5)
t.field(
    "An achieving occupancy list",
    "integer-list",
    {"length": 8, "sum": "37", "min": "0", "max": "5"},
    "(5,5,5,5,5,4,4,4)",
    "(5,5,5,5,5,5,5,5)",
    "(5,5,5,5,5,5,5,2)",
)
t.finish(
    "Accept every nonnegative eight-box occupancy certificate with total 37 and maximum at most five."
)
t = Task(C, 79)
t.field(
    "Counterexample integers",
    "integer-list",
    {"length": 5, "distinctResiduesMod": 5},
    "(0,1,2,3,4)",
    "(0,1,2,3,5)",
    "(-1,5,11,17,23)",
)
t.finish(
    "Check residues of the produced integers, accepting every valid counterexample."
)
t = Task(C, 75)
t.num("Count", 840)
t.select(
    "Two methods and their meanings",
    "4·C(10,4) chooses the committee then its chair; 10·C(9,3) chooses the chair then companions.",
    "C(10,4) counts chairs too; 10·C(10,3) allows the chair to be chosen again.",
    "4!·C(10,4) and 10·9·8·7 both assign all four members distinct offices.",
)
t.finish(
    "Keep the count as production; turn the short explanations of the two counts into one complete choice."
)
t = Task(C, 80)
t.num("Count", 140)
t.select(
    "Two counting methods",
    "C(10,4)−C(8,4) excludes sets containing neither; 2·C(8,3)+C(8,2) counts exactly one and both.",
    "C(10,4)−C(8,2) excludes sets containing neither; 2·C(8,3) includes both.",
    "C(10,4)−2·C(9,4) never needs overlap correction; C(8,2) counts exactly one.",
)
t.finish("Keep the count typed; select the complete pair of counting arguments.")
for n, c, w1, w2 in [
    (
        20,
        "There is exactly one empty subset and one whole-set subset, including when the universe is empty.",
        "A zero-element subset can be chosen in zero ways.",
        "Choosing the whole set has n! different orders, all counted as distinct subsets.",
    ),
    (
        40,
        "A fixed divisor works when every outcome has that same number of representations.",
        "Any divisor below the original count removes all overcounting.",
        "Variable representation counts can always be corrected by the largest one.",
    ),
    (
        45,
        "An element in all three sets has contribution 3−3=0 before the final +1 correction.",
        "The triple intersection was counted once before the correction.",
        "Adding the triple intersection makes each such element count three times.",
    ),
    (
        55,
        "At least two distinct inputs share a hash value: there are more inputs than possible values.",
        "Every hash value has exactly two inputs.",
        "A collision has positive probability but is not guaranteed.",
    ),
    (
        59,
        "No; ten distinct scores can be chosen from the 101 possible scores.",
        "Yes; all finite score sets force repeats among ten students.",
        "Yes; there are only ten possible integer scores.",
    ),
]:
    choice(C, n, c, w1, w2)
for n, reason in {
    32: "Explicit complement-bijection proof for all n and r.",
    33: "Explicit proof of Pascal’s identity by partitioning arbitrary subsets.",
    37: "Explicit counting proof of a general binomial sum.",
    38: "Derives a general double-counting identity with arbitrary n.",
    54: "Explicit pigeonhole proof for arbitrary six integers.",
    57: "Explicit pigeonhole proof over all six-element selections.",
    58: "Universal ceiling occupancy bound proof.",
}.items():
    retain(C, n, reason)

A = "asymptotic-growth"
for n, v, g in [
    (41, "n", "n"),
    (42, "4*n", "n"),
    (43, "n+n^2", "n²"),
    (44, "n^2", None),
    (45, "3*n", "n"),
    (46, "n*(n+1)/2", None),
    (47, "n*(n+1)/2", None),
    (48, "n*(n+1)", "n²"),
    (49, "n^2", "n²"),
    (55, "log2(n)+1", None),
    (57, "log2(n)+1", "log₂ n"),
    (58, "2*n-1", "n"),
]:
    t = Task(A, n)
    t.expr("Exact count", v, positive=True)
    if g:
        t.select(
            "Tight growth",
            "Θ(" + g + ")",
            *[x for x in ["Θ(1)", "Θ(n)", "Θ(n²)", "Θ(log₂ n)"] if x != "Θ(" + g + ")"][
                :2
            ],
        )
    t.finish(
        "Produce the exact count with ordinary math input; any requested growth classification is selected."
    )
for n, kind, params, labels, values, wrong, alt in [
    (
        15,
        "finite-exception",
        {"exceptionValue": "1000000"},
        ["Lower multiplier c₁", "Upper multiplier c₂", "Threshold n₀"],
        ["1", "1", "2"],
        ["1", "1", "1"],
        ["1/2", "1000000", "1"],
    ),
    (
        17,
        "parity-linear-quadratic",
        {},
        [
            "Quadratic upper multiplier",
            "Upper threshold",
            "Linear lower multiplier",
            "Lower threshold",
        ],
        ["1", "1", "1", "1"],
        ["1/2", "1", "1", "1"],
        ["2", "7", "1/2", "8"],
    ),
    (
        25,
        "positive-polynomial-ratio",
        {
            "leading": "5",
            "terms": [
                {"coefficient": "7", "power": 1},
                {"coefficient": "2", "power": 3},
            ],
        },
        ["Lower multiplier c₁", "Upper multiplier c₂", "Threshold n₀"],
        ["5", "14", "1"],
        ["6", "14", "1"],
        ["4", "9", "2"],
    ),
    (
        56,
        "n-log-n-plus-n",
        {},
        ["Lower multiplier c₁", "Upper multiplier c₂", "Threshold n₀"],
        ["1", "2", "2"],
        ["1", "1", "2"],
        ["1/2", "3/2", "3"],
    ),
]:
    t = Task(A, n)
    if n in [15, 25, 56]:
        t.select(
            "Tight growth",
            {15: "Θ(n)", 25: "Θ(n³)", 56: "Θ(n log₂ n)"}[n],
            "Θ(1)",
            "Θ(n²)",
        )
    t.group(labels, "asymptotic-bound", {"kind": kind, **params}, values, wrong, alt)
    t.finish(
        "Universal bounds are checked exactly using this authored function family, not sampled inputs; accept all valid constants and thresholds."
    )
t = Task(A, 34)
t.boolean("n is little o of n", False)
i = t.field(
    "One failing positive epsilon", "exact", {"expected": ["1/2"]}, "1/2", "2", "1/3"
)
t.reqs[-1] = {
    "id": i,
    "description": "The positive epsilon defeats every threshold.",
    "validator": "witness",
    "fields": [i],
    "params": {
        "variables": [{"name": "e", "field": i}],
        "conditions": [
            {"left": "e", "op": ">", "right": "0"},
            {"left": "e", "op": "<", "right": "1"},
        ],
    },
}
t.finish(
    "Accept any positive epsilon below one; the universal failure follows algebraically for this fixed pair of functions."
)
t = Task(A, 61)
t.num("Best-case comparisons", 1)
t.expr("Worst-case comparisons", "n", positive=True)
t.finish()
t = Task(A, 69)
t.expr("Lower bound on N (inclusive)", "2^(b-1)", variables=("b",), positive=True)
t.expr("Upper bound on N (exclusive)", "2^b", variables=("b",), positive=True)
t.select("Iteration growth as a function of bit length b", "Θ(2ᵇ)", "Θ(b)", "Θ(log₂ b)")
t.finish()
t = Task(A, 39)
t.field(
    "Labels from slowest to fastest",
    "graph",
    {"kind": "sequence", "expected": ["B", "E", "D", "F", "A", "C"]},
    "B,E,D,F,A,C",
    "E,B,D,F,A,C",
    "B E D F A C",
    kind="text",
)
t.finish(
    "Type a single ordered label list for the supplied expressions; no drag UI or formula construction.",
    prompt=t.q["prompt"]
    + " Use labels A: $n^2$, B: $1$, C: $2^n$, D: $n$, E: $\\log_2 n$, F: $n\\log_2 n$.",
)
for n, c, w1, w2 in [
    (
        1,
        "There exist c>0 and integer n₀≥1 such that every n≥n₀ satisfies 0≤f(n)≤c g(n).",
        "For every n there exists a new c>0 with f(n)≤c g(n).",
        "There exists n₀ such that every c>0 bounds every later f(n) by c g(n).",
    ),
    (
        2,
        "There exist c>0 and n₀ such that every n≥n₀ satisfies 0≤c g(n)≤f(n).",
        "There exist c>0 and n₀ such that every n≥n₀ satisfies f(n)≤c g(n).",
        "For each n choose a new lower multiplier c depending on n.",
    ),
    (
        3,
        "There exist fixed c₁,c₂>0 and n₀ such that c₁g(n)≤f(n)≤c₂g(n) for every n≥n₀.",
        "The functions must be equal at every sufficiently large n.",
        "Only an eventual upper bound by one fixed multiple is required.",
    ),
    (
        8,
        "Yes, n=O(n²), but the quadratic bound is not tight because there is no positive eventual quadratic lower multiplier.",
        "Yes, and every upper bound is tight.",
        "No, because n and n² are never equal for n>1.",
    ),
    (
        10,
        "No; the multiplier must be fixed independently of n.",
        "Yes; the comparison multiplier may depend on n.",
        "Yes; any exact inequality proves Big O regardless of its quantifiers.",
    ),
    (
        11,
        "For every c>0 and every sufficiently large threshold n₀, some n≥n₀ satisfies f(n)>c g(n).",
        "There is one c>0 for which some n violates the bound.",
        "Every n must violate the bound for every c>0.",
    ),
    (
        20,
        "The definition includes every later untested input; finite agreement cannot control the whole tail.",
        "A million inputs are always enough for any function.",
        "Asymptotic bounds concern only small inputs.",
    ),
    (
        22,
        "Above both thresholds, f+u≤a g+b v≤max(a,b)(g+v), so f+u=O(g+v).",
        "The sum is bounded by min(a,b)(g+v) in every case.",
        "Adding functions always multiplies their growth rates.",
    ),
    (
        23,
        "Above both thresholds, fu≤ab gv, so fu=O(gv).",
        "fu≤(a+b)gv always holds, so fu=O(g+v).",
        "fu=Θ(gv) follows from the upper bounds alone.",
    ),
    (
        26,
        "The difference is 1, hence Θ(1); dominant terms can cancel under subtraction.",
        "The difference is Θ(n²), since both original functions are.",
        "The difference is zero for every n.",
    ),
    (
        28,
        "The variable base gives logₙ n=1, while log₂ n is unbounded; the change-of-base multiplier is not fixed.",
        "Every change of base is a fixed multiplier even if the base varies.",
        "logₙ n=n for every n>1.",
    ),
    (
        29,
        "O(n²) follows, but Θ(n) need not: the constant function 1 is a counterexample.",
        "Both conclusions follow from an upper bound.",
        "Neither conclusion follows because Big O is not transitive.",
    ),
    (
        31,
        "For every ε>0 there exists n₀ such that every n≥n₀ satisfies 0≤f(n)≤εg(n).",
        "There exists one ε>0 and n₀ that bounds every later ratio.",
        "For every n there exists an ε depending on that n.",
    ),
    (
        35,
        "The binomial theorem expresses 2ⁿ as a sum of nonnegative coefficients, including the stated term.",
        "All binomial coefficients equal 2ⁿ.",
        "A summand always exceeds a sum of nonnegative terms.",
    ),
    (
        40,
        "The ratios (n log₂ n)/n² and (log₂ n)/n are equal, so the same epsilon threshold works.",
        "Multiplying by n changes little o to equality.",
        "Both numerators equal n² eventually.",
    ),
    (
        50,
        "The maximum can overestimate most inner lengths; tightness needs the actual sum or a matching lower bound.",
        "The maximum inner length always occurs on every outer iteration.",
        "Any upper bound is automatically a tight bound.",
    ),
    (
        54,
        "It is not tight: the geometric sum of actual inner lengths is Θ(n).",
        "It is tight because every inner loop runs n times.",
        "The actual total is Θ(log₂ n) because inner work is irrelevant.",
    ),
    (
        59,
        "Both have the same number of levels, but the two-child recurrence has more calls on the levels.",
        "Halving the argument forces the same total number of calls.",
        "Only the deepest call contributes to the cost.",
    ),
    (
        60,
        "No; the inequality yields an upper bound, and constant T(n)=1 rules out a forced matching lower bound.",
        "Yes; a recurrence upper bound always proves Theta.",
        "No asymptotic upper bound follows at all.",
    ),
    (
        62,
        "No; O and Ω are upper and lower bounds on whichever case-cost function is chosen.",
        "Yes; O always means worst case and Ω always means best case.",
        "Ω can never describe a worst-case function.",
    ),
    (
        64,
        "A probability distribution on inputs of each size is needed to define expected cost.",
        "Only the largest possible input cost is needed.",
        "All possible inputs automatically have the same probability.",
    ),
    (
        65,
        "One implementation gives an upper bound; a problem-wide lower bound must cover every permitted algorithm.",
        "An implementation’s upper bound is a lower bound for all algorithms.",
        "Exact operation counts cannot imply upper bounds.",
    ),
    (
        67,
        "A shared reference is a different required output, so the argument counting n element writes does not apply.",
        "A reference necessarily rewrites all n elements.",
        "Lower bounds are unchanged when the required task changes.",
    ),
    (
        70,
        "Operands may gain digits; additions can require more bit operations as their lengths grow.",
        "Arbitrary-precision additions always take one bit operation.",
        "Longer operands necessarily use fewer bit operations.",
    ),
    (
        74,
        "The quadratic upper bound holds, but the bound is not tight because log₂ n=o(n).",
        "Both O(n²) and Θ(n²) follow.",
        "Neither follows because log₂ n exceeds n eventually.",
    ),
    (
        75,
        "Θ(n+m), since the count n+2m lies between n+m and 2(n+m).",
        "Θ(nm), since every edge is inspected at every vertex.",
        "Θ(m), even when the graph has many isolated vertices.",
    ),
    (
        76,
        "A matrix may inspect n possible neighbors for each vertex, including nonedges; lists inspect stored entries.",
        "Matrices contain only edges, so scanning them costs exactly 2m.",
        "Lists must scan every possible nonedge too.",
    ),
]:
    choice(A, n, c, w1, w2)
for n in [
    4,
    5,
    6,
    7,
    9,
    12,
    13,
    14,
    16,
    18,
    19,
    21,
    24,
    27,
    30,
    32,
    33,
    37,
    38,
    66,
    71,
    72,
    73,
    77,
    78,
    80,
]:
    retain(
        A,
        n,
        "Preserve the whole requested proof/justification: "
        + AUDIT[f"{A}-{n}"]["publishedQuestion"]["prompt"],
    )
retain(
    A,
    36,
    "Requests a factorwise symbolic lower-bound derivation for arbitrary d; preserve the intermediate universal inequalities.",
)

G = "graph-theory"
BASE = {
    "vertices": list("abcde"),
    "edges": [["a", "b"], ["a", "c"], ["b", "c"], ["c", "d"], ["d", "e"]],
}
FOREST = {"vertices": list("abcdef"), "edges": [["a", "b"], ["b", "c"], ["d", "e"]]}
TREE = {
    "vertices": list("abcdef"),
    "edges": [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "f"]],
}
TRAV = {
    "vertices": list("abcdef"),
    "edges": [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "e"], ["e", "f"]],
}
DAG = {
    "vertices": list("abcde"),
    "edges": [["a", "c"], ["b", "c"], ["c", "d"], ["c", "e"], ["d", "e"]],
    "directed": True,
}


def labels(t, label, values, ordered=True):
    return t.field(
        label,
        "graph",
        {"kind": "sequence", "expected": list(values), "ordered": ordered},
        ",".join(values),
        "z",
        ",".join(values if ordered else reversed(values)),
        kind="text",
    )


for n, count, reason, w1, w2 in [
    (
        9,
        17,
        "Each arc contributes one incoming and one outgoing incidence.",
        "An arc contributes two incoming incidences.",
        "Incoming degree totals need not count arcs.",
    ),
    (
        10,
        7,
        "Connectivity does not follow: a disjoint triangle and four-cycle have the stated degrees.",
        "Every graph with all degrees two is connected.",
        "Every graph with seven edges is connected.",
    ),
]:
    t = Task(G, n)
    t.num("Sum of in-degrees" if n == 9 else "Number of edges", count)
    t.select("Reason", reason, w1, w2)
    t.finish()
t = Task(G, 11)
labels(t, "Neighbors of c", "abd", False)
t.num("Degree of c", 3)
t.finish()
t = Task(G, 12)
t.tuple("Degrees in order a,b,c,d,e", [2, 2, 3, 2, 1])
t.num("Number of edges", 5)
t.finish()
t = Task(G, 13)
t.num("Sum of degrees", 10)
t.num("Twice the edge count", 10)
t.finish("The requested numerical handshaking check has two exact scalar results.")
t = Task(G, 14)
labels(t, "Odd-degree vertices", "ce", False)
t.select(
    "Parity conclusion",
    "There are two odd-degree vertices, an even number.",
    "There are two odd-degree vertices, an odd number.",
    "There are no odd-degree vertices.",
)
t.finish()
t = Task(G, 16)
t.tuple("Adjacency row at c, columns a,b,c,d,e", [1, 1, 0, 1, 0])
t.finish()
t = Task(G, 20)
t.tuple("In-degrees in order a,b,c", [1, 1, 2])
t.tuple("Out-degrees in order a,b,c", [2, 1, 1])
t.finish()
for n, length, correct in [
    (21, 4, ["walk", "trail", "path"]),
    (22, 3, ["walk", "trail", "cycle"]),
    (23, 4, ["walk"]),
]:
    t = Task(G, n)
    i = t.field(
        "Every classification that applies",
        "selection",
        {"expected": correct},
        correct,
        ["cycle"],
        kind="multiselect",
    )
    t.inputs[-1]["options"] = [
        {"id": x, "label": x.title()} for x in ["walk", "trail", "path", "cycle"]
    ]
    t.num("Length", length)
    t.finish(
        "Select all applicable graph-route definitions and produce the edge count."
    )
t = Task(G, 26)
t.group(
    ["First path from a to c", "Second path from a to c"],
    "graph",
    {"kind": "two-paths", **BASE, "start": "a", "end": "c"},
    ["a,c", "a,b,c"],
    ["a,c", "a,c"],
    ["a,b,c", "a,c"],
    kind="text",
)
t.select(
    "Consequence",
    "The two paths give a cycle, so this connected graph is not a tree.",
    "Two paths imply the graph is disconnected.",
    "A tree must have two distinct paths between every pair.",
)
t.finish(
    "Accept either order of any two distinct simple paths; recognize their short structural consequence."
)
t = Task(G, 31)
t.field(
    "Components (vertex lists separated by semicolons)",
    "graph",
    {"kind": "components", **FOREST},
    "a,b,c;d,e;f",
    "a,b,c,d,e;f",
    "f;e,d;c,b,a",
    kind="text",
)
t.finish()
t = Task(G, 32)
t.num("Minimum new edges", 2)
t.field(
    "New edges, as pairs",
    "graph",
    {"kind": "connect-with-edges", **FOREST},
    "(c,d),(e,f)",
    "(a,c),(e,f)",
    "(a,f),(b,d)",
    kind="text",
)
t.select(
    "Why the number is minimal",
    "There are three components, and one edge can reduce the component count by at most one.",
    "Any added edge always makes the graph connected.",
    "Every pair of components needs its own joining edge.",
)
t.finish(
    "Typed new edges must connect the supplied graph with the minimum number; the brief minimality reason is selected."
)
for n, prop, vertices, edges, alt in [
    (40, "weak-not-strong", "a,b", "(a,b)", ["x,y,z", "(x,y),(y,z)"]),
    (
        45,
        "n-minus-one-not-tree",
        "a,b,c,d",
        "(a,b),(b,c),(c,a)",
        ["u,v,w,x,y", "(u,v),(v,w),(w,u),(x,y)"],
    ),
    (
        80,
        "euler-hamiltonian-mismatch",
        "a,b,c,d",
        "(a,b),(a,c),(a,d),(b,c),(b,d),(c,d)",
        ["u,v,w,x", "(u,v),(v,w),(w,u)"],
    ),
]:
    t = Task(G, n)
    t.group(
        [
            "Vertex list",
            "Edges as pairs" if n != 40 else "Directed arcs as ordered pairs",
        ],
        "graph",
        {"kind": "graph-property", "property": prop, "directed": n == 40},
        [vertices, edges],
        ["a,b", "(a,b),(b,a)"]
        if n == 40
        else (["a,b,c", "(a,b),(b,c),(c,a)"] if n == 80 else ["a,b", "(a,b)"]),
        alt,
        kind="text",
    )
    if n == 40:
        t.select(
            "Does strong connectivity imply weak connectivity?",
            "Yes; forgetting arc directions preserves every directed path.",
            "No; a strongly connected digraph can have a disconnected underlying graph.",
            "Only when every arc has its reverse.",
        )
    if n == 80:
        t.select(
            "Why this is evidence",
            "Euler conditions concern using edges; Hamiltonian cycles concern visiting vertices.",
            "Every Hamiltonian cycle uses every edge.",
            "Every Euler circuit visits each vertex exactly once.",
        )
    t.finish(
        "Produce a finite counterexample by typing vertices and edge pairs; check its properties exactly, accepting other valid constructions.",
        prompt=t.q["prompt"]
        + " Give a simple graph with at most 16 vertices as vertex and edge lists.",
    )
t = Task(G, 49)
edges = [["a", "b"], ["b", "c"], ["c", "a"], ["c", "d"]]
i = t.field(
    "Spanning-tree edges",
    "graph",
    {
        "kind": "spanning-tree",
        "vertices": list("abcd"),
        "edges": edges,
        "edgeIds": ["ab", "bc", "ca", "cd"],
    },
    ["ab", "bc", "cd"],
    ["ab", "bc", "ca"],
    ["ab", "ca", "cd"],
    kind="multiselect",
)
t.inputs[-1]["options"] = [
    {"id": a + b, "label": "{" + a + "," + b + "}"} for a, b in edges
]
t.finish("Select from the supplied edges; accept every connected spanning tree.")
for n, values in [(51, "aabbc"), (63, "aabbe")]:
    t = Task(G, n)
    labels(t, "Parents in vertex order b,c,d,e,f", values)
    t.finish()
for n, values in [(52, [0, 1, 1, 2, 2, 2]), (62, [0, 1, 1, 2, 2, 3])]:
    t = Task(G, n)
    t.tuple(
        ("Depths" if n == 52 else "Distances") + " in vertex order a,b,c,d,e,f", values
    )
    if n == 52:
        labels(t, "Rooted leaves", "def", False)
    t.finish()
t = Task(G, 57)
t.field(
    "All topological orders (separated by semicolons)",
    "graph",
    {"kind": "all-topological-orders", **DAG},
    "a,b,c,d,e;b,a,c,d,e",
    "a,b,c,d,e",
    "b,a,c,d,e;a,b,c,d,e",
    kind="text",
)
t.finish(
    "Produce all orders in one text field; the input does not reveal the number of answers."
)
for n, order in [(61, "abcdef"), (64, "abdecf")]:
    t = Task(G, n)
    labels(t, "Discovery order", order)
    t.finish("One typed vertex list with the authored neighbor-order policy.")
t = Task(G, 65)
for vertex, adj in zip("abcdef", ["bc", "ade", "ae", "b", "bcf", "e"]):
    labels(t, "Neighbors of " + vertex, adj, False)
t.num("Total neighbor entries", 12)
t.finish(
    "The naturally requested adjacency table uses one short unordered neighbor list per vertex."
)
t = Task(G, 70)
fs = t.group(
    ["Weight of edge a–b", "Weight of edge a–c", "Weight of edge c–b"],
    "witness",
    {},
    ["10", "1", "1"],
    ["1", "1", "1"],
    ["3", "0", "2"],
)
t.reqs[-1]["params"] = {
    "variables": [{"name": v, "field": f} for v, f in zip("xyz", fs)],
    "conditions": [{"left": v, "op": ">=", "right": "0"} for v in "xyz"]
    + [{"left": "x", "op": ">", "right": "y+z"}],
}
t.finish(
    "Explicitly limit the construction to a weighted triangle, preserving produced weights with no drawing.",
    prompt=t.q["prompt"]
    + " Use the triangle with vertices a,b,c and edges a–b, a–c, c–b; give nonnegative weights that make BFS from a choose a heavier route to b.",
)
CYCLE = {
    "vertices": list("abcd"),
    "edges": [["a", "b"], ["b", "c"], ["c", "d"], ["d", "a"]],
}
t = Task(G, 72)
for kind, label in [
    ("euler-circuit", "Euler circuit"),
    ("hamiltonian-cycle", "Hamiltonian cycle"),
]:
    t.field(
        label,
        "graph",
        {"kind": kind, **CYCLE},
        "a,b,c,d,a",
        "a,b,c,d",
        "c,b,a,d,c",
        kind="text",
    )
t.finish(
    "One vertex list for each requested route; any start and orientation are valid."
)
t = Task(G, 74)
t.field(
    "Euler trail",
    "graph",
    {"kind": "euler-trail", **BASE},
    "c,a,b,c,d,e",
    "a,b,c,d,e",
    "e,d,c,b,a,c",
    kind="text",
)
labels(t, "Endpoints", "ce", False)
t.finish()
for n, c, w1, w2 in [
    (
        4,
        "No; its degree sum is 13, but an undirected degree sum must be twice an integer edge count.",
        "Yes; every listed degree is at most four.",
        "Yes; an odd number of vertices requires an odd degree sum.",
    ),
    (
        8,
        "Yes; opposite directions are distinct ordered pairs, and neither is a loop.",
        "No; reversing endpoints never changes an arc.",
        "No; having both directions creates a loop at a.",
    ),
    (
        17,
        "No; only four other vertices can be neighbors in a simple loop-free graph.",
        "Yes; a vertex can count itself as a neighbor in a simple graph.",
        "Yes; parallel edges are allowed in a simple graph.",
    ),
    (
        19,
        "An undirected edge is an unordered two-element set; an arc is an ordered pair.",
        "Both are ordered pairs whose endpoint order matters.",
        "Both allow only one direction between distinct endpoints.",
    ),
    (
        24,
        "No; b and d are not adjacent.",
        "Yes; a vertex list always defines a walk.",
        "No; its endpoints must agree to be a walk.",
    ),
    (
        25,
        "No; it repeats edges and an interior vertex, although it is a closed walk.",
        "Yes; every closed walk is a cycle.",
        "No; no cycle can start at c.",
    ),
    (
        27,
        "It repeats the same edge and has length two; an undirected cycle here has at least three edges.",
        "It is always a cycle because it returns to the start.",
        "It is not even a walk.",
    ),
    (
        30,
        "It is the single vertex with no edges, establishing self-reachability without a loop.",
        "It is a self-loop of length one.",
        "It contains no vertices and connects every pair.",
    ),
    (
        38,
        "The singleton is connected by its length-zero path; the empty graph is disconnected with zero components.",
        "Both are connected because neither contains edges.",
        "Both have exactly one component.",
    ),
    (
        39,
        "The singleton is strongly and weakly connected; the empty digraph is neither.",
        "Both are strongly and weakly connected.",
        "The singleton is weakly but not strongly connected.",
    ),
    (
        50,
        "It is a forest but not a tree; n=c=m=0 satisfies m=n−c.",
        "It is a tree with one component and zero vertices.",
        "It is neither a forest nor a tree because it has no edges.",
    ),
    (
        53,
        "It is binary, but not full binary: c has exactly one child.",
        "It is full binary because each vertex has at most two children.",
        "It is not binary because a has two children.",
    ),
    (
        56,
        "It has undirected degree one, but is not a rooted leaf because it has a child.",
        "It is both a degree-one vertex and a rooted leaf.",
        "It has degree zero because it has no parent.",
    ),
    (
        58,
        "No; a→c→d→a is a directed cycle.",
        "Yes; adding an arc never destroys a topological order.",
        "Yes; every finite digraph has a topological order.",
    ),
    (
        66,
        "A matrix uses n² entries; adjacency lists use storage proportional to n+m.",
        "Both always use exactly n² entries.",
        "Lists use m entries with no vertex overhead, even for isolated vertices.",
    ),
    (
        67,
        "Direct matrix indexing is constant cost; an unsorted list can require scanning all neighbors of the vertex.",
        "Both always require scanning all n² matrix entries.",
        "An unsorted list always has constant-time membership queries.",
    ),
    (
        68,
        "Each vertex is discovered once and each list entry scanned once, giving work proportional to n+m.",
        "Every edge is scanned once per vertex, giving nm.",
        "Only reachable edge count matters even in a full traversal including isolated vertices.",
    ),
    (
        69,
        "Each of n vertices scans n possible neighbors, for n² entry inspections.",
        "Every matrix stores only m nonzero entries and no zeros.",
        "Only the diagonal entries are inspected.",
    ),
    (
        71,
        "An Euler trail uses every edge once; a Hamiltonian cycle visits every vertex once before returning.",
        "An Euler trail visits every vertex once; a Hamiltonian cycle uses every edge once.",
        "Both require using every edge exactly once.",
    ),
    (
        73,
        "No Euler trail because all four degrees are odd; a Hamiltonian cycle exists.",
        "Both exist because the graph is connected.",
        "Neither exists because all four degrees are odd.",
    ),
    (
        75,
        "No; the degree-one vertex e cannot have two distinct incident cycle edges.",
        "Yes; connectedness alone guarantees a Hamiltonian cycle.",
        "Yes; an Euler trail always implies a Hamiltonian cycle.",
    ),
    (
        77,
        "The triangle gives an Euler circuit using all edges; the isolated vertex prevents a Hamiltonian cycle covering all vertices.",
        "Neither exists because isolated vertices always prevent Euler circuits.",
        "Both exist because the triangle contains all edges.",
    ),
]:
    choice(G, n, c, w1, w2)
for n, reason in {
    18: "Explicit parity proof excluding all graphs with three odd vertices.",
    29: "General finite-walk simplification proof.",
    33: "General proof of reflexivity and symmetry of reachability.",
    34: "General proof of transitivity via walk simplification.",
    46: "Longest-path proof that every nontrivial finite tree has two leaves.",
    47: "Explicit induction proof of the tree edge count.",
    48: "General cycle-edge deletion connectivity proof.",
    55: "General counting proof of the full binary tree leaf identity.",
    59: "General finite-DAG source existence proof.",
    60: "Correctness argument for repeated source removal.",
    78: "General arrival/departure parity necessity proof.",
    79: "Constructive termination and coverage argument for Euler circuits.",
}.items():
    retain(G, n, reason)

# Preserve exact floor/log production without supplying a new intermediate variable.
for n, formula in [(51, "floor(log2(n))+1"), (53, "2^(floor(log2(n))+1)-1")]:
    t = Task(A, n)
    t.expr("Exact execution count", formula, positive=True)
    if n == 53:
        t.select("Tight growth in terms of n", "Θ(n)", "Θ(log₂ n)", "Θ(n log₂ n)")
    t.finish(
        "Produce the exact execution count. Item 53 requests the evaluated geometric sum instead of a summation notation expression.",
        prompt=t.q["prompt"].replace(
            "Give an exact sum and", "Give the exact count and"
        )
        if n == 53
        else None,
    )


# Structural requirements reject an equivalent expression in the wrong requested form.
for key, answer in [
    ("combinatorics-34", "(a+b)^4"),
    ("recurrence-relations-45", "r^2-4*r+4"),
]:
    entry = ENTRIES[key]
    entry["fixtures"].append(
        {
            "response": {**entry["fixtures"][0]["response"], "answer-1": answer},
            "verdict": "incorrect",
        }
    )
# These exact threshold boundaries distinguish universal checking from finite sampling.
for key, field, value in [
    ("asymptotic-growth-15", "answer-4", "0"),
    ("asymptotic-growth-25", "answer-3", "13"),
    ("asymptotic-growth-56", "answer-3", "3/2"),
]:
    entry = ENTRIES[key]
    entry["fixtures"].append(
        {
            "response": {**entry["fixtures"][0]["response"], field: value},
            "verdict": "incorrect",
        }
    )


def write(partial=False):
    rows = []
    for key, r in AUDIT.items():
        if key in ENTRIES:
            e = ENTRIES[key]
            a = e["assessment"]
            method = "deterministic"
            reason = e["rationale"]
            inputs = [{"label": i["label"], "kind": i["kind"]} for i in a["inputs"]]
            validators = [
                {"name": q["validator"], "params": q["params"]}
                for q in a["requirements"]
            ]
        elif key in EXISTING:
            method = "existing-deterministic"
            reason = "Preserve the separately authored deterministic assessment; no duplicate catalog entry."
            inputs = []
            validators = []
        elif r["category"] == "existing-choice":
            method = "existing-choice"
            reason = "Already a complete deterministic choice question."
            inputs = []
            validators = []
        elif key in OPEN:
            method = "open"
            reason = OPEN[key]
            inputs = []
            validators = []
        else:
            assert partial, "Missing item-specific disposition: " + key
            continue
        rows.append(
            {
                "key": key,
                "originalHash": r["questionHash"],
                "finalMethod": method,
                "minimalOutputs": inputs,
                "validators": validators,
                "reason": reason,
                "promptChange": ENTRIES.get(key, {}).get("prompt"),
                "evidenceChange": "Short explanations become recognition alongside typed requested results."
                if key in ENTRIES
                and any(
                    i["kind"] == "select" for i in ENTRIES[key]["assessment"]["inputs"]
                )
                else None,
                "batch": "algorithms",
                "sourceInspection": "docs/deterministic-algorithms-source-inspection.md",
            }
        )
    assert len(rows) == 328 or partial
    (ROOT / "content/deterministic-algorithms.json").write_text(
        json.dumps(list(ENTRIES.values()), ensure_ascii=False, indent=2) + "\n"
    )
    (ROOT / "docs/deterministic-algorithms-dispositions.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        json.dumps({"new": len(ENTRIES), "dispositions": len(rows), "open": len(OPEN)})
    )


if __name__ == "__main__":
    write()
