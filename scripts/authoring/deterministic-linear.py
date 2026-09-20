"""Source-pinned linear algebra assessments; regenerate after the LA worksheet author.

Numerical families use the author's emitted verification data. Exact Fraction
arithmetic below independently checks computations before publishing metadata.
No generated worksheet or numeric family parameter is copied by hand.
"""

from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
from copy import deepcopy
import json, re

ROOT = Path(__file__).resolve().parents[2]
AUDIT = {
    r["key"]: r
    for r in json.loads((ROOT / "docs/deterministic-grading-audit.json").read_text())[
        "exercises"
    ]
    if r["key"].startswith("linear-algebra-")
}
VERIFY = json.loads((ROOT / "content/linear-algebra-verification.json").read_text())
CORE = json.loads((ROOT / "scripts/authoring/linear-algebra-core.json").read_text())
# Match originals by prompt because pacing deliberately renumbered exercise IDs.
for lesson in CORE:
    for section in lesson["sections"]:
        for question in section["questions"]:
            matches = [
                r
                for r in AUDIT.values()
                if r["key"].startswith(lesson["slug"] + "-")
                and r["publishedQuestion"]["prompt"] == question["prompt"]
            ]
            assert len(matches) == 1, (
                "Re-audit changed core authoring before publishing: "
                + question["prompt"]
            )
            assert (
                matches[0]["publishedQuestion"]["officialAnswer"] == question["answer"]
            ), "Core answer changed: re-audit required."
EXISTING = {
    f"{e['lesson']}-{e['id']}": e
    for e in json.loads((ROOT / "content/deterministic-exercises.json").read_text())
}
ENTRIES = {}
NOTES = {}


def canon(lesson):
    return lesson.replace("rank-inverses", "bases").replace(
        "least-squares", "projections"
    )


def keyof(v):
    key = canon(v["lesson"]) + "-" + str(v["id"])
    assert AUDIT[key]["publishedQuestion"]["prompt"] == v["prompt"], (
        "Re-audit changed generated prompt: " + key
    )
    assert AUDIT[key]["publishedQuestion"]["officialAnswer"] == v["answer"], (
        "Re-audit changed generated answer: " + key
    )
    return key


def s(x):
    return str(F(str(x)))


def vs(v):
    return [s(x) for x in v]


def ms(a):
    return [vs(r) for r in a]


def vec(v):
    return "(" + ", ".join(map(str, v)) + ")"


def mat(a):
    return "; ".join(", ".join(map(str, r)) for r in a) if a else "{}"


def dot(a, b):
    return sum(F(str(x)) * F(str(y)) for x, y in zip(a, b))


def tr(a):
    return list(map(list, zip(*a)))


def mv(a, x):
    return [dot(r, x) for r in a]


def mm(a, b):
    return [[dot(r, c) for c in tr(b)] for r in a]


def add(a, b):
    return [F(str(x)) + F(str(y)) for x, y in zip(a, b)]


def scale(c, a):
    return [F(str(c)) * F(str(x)) for x in a]


def identity(n):
    return [[int(i == j) for j in range(n)] for i in range(n)]


def rref(a):
    a = [[F(str(v)) for v in r] for r in a]
    piv = []
    i = 0
    for j in range(len(a[0])):
        k = next((k for k in range(i, len(a)) if a[k][j]), None)
        if k is None:
            continue
        a[i], a[k] = a[k], a[i]
        a[i] = scale(1 / a[i][j], a[i])
        for k in range(len(a)):
            if k != i:
                a[k] = add(a[k], scale(-a[k][j], a[i]))
        piv.append(j)
        i += 1
        if i == len(a):
            break
    return a, piv


def null(a):
    r, p = rref(a)
    n = len(a[0])
    out = []
    for j in range(n):
        if j in p:
            continue
        x = [F(0)] * n
        x[j] = F(1)
        for i, k in enumerate(p):
            x[k] = -r[i][j]
        out.append(x)
    return out


def particular(a, b):
    r, p = rref([row + [b[i]] for i, row in enumerate(a)])
    n = len(a[0])
    x = [F(0)] * n
    assert n not in p
    for i, j in enumerate(p):
        x[j] = r[i][-1]
    return x


class Task:
    def __init__(self, key):
        assert key in AUDIT and key not in ENTRIES and key not in EXISTING, key
        self.key = key
        self.q = AUDIT[key]["publishedQuestion"]
        self.inputs = []
        self.reqs = []
        self.response = {}
        self.wrong = {}
        self.alt = {}
        self.shift = False
        self.note = ""
        self.prompt = None

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
        self.response[i] = value
        self.wrong[i] = wrong
        if alt is not None:
            self.alt[i] = alt
        return i

    def num(self, label, value):
        value = str(value)
        return self.field(
            label,
            "exact",
            {"expected": [value]},
            value,
            "(" + value + ")+1",
            "2*(" + value + ")/2",
        )

    def tuple(self, label, value, ordered=True):
        value = list(map(str, value))
        wrong = value[:]
        wrong[0] = "(" + wrong[0] + ")+1"
        return self.field(
            label,
            "tuple",
            {"expected": value, "ordered": ordered},
            vec(value),
            vec(wrong),
            vec(["2*(" + x + ")/2" for x in value]),
        )

    def matrix(self, label, value):
        value = ms(value)
        wrong = deepcopy(value)
        wrong[0][0] = "(" + wrong[0][0] + ")+1"
        return self.field(
            label,
            "matrix",
            {"expected": value},
            mat(value),
            mat(wrong),
            mat([["2*(" + x + ")/2" for x in r] for r in value]),
        )

    def matrix_grid(self, label, value):
        # Use only when the prompt does not assess the result's dimensions.
        value = ms(value)
        i = "answer-" + str(len(self.inputs) + 1)
        rows = []
        fields = []
        for r, values in enumerate(value):
            cells = []
            for c, v in enumerate(values):
                field = f"{i}-r{r + 1}-c{c + 1}"
                cells.append({"id": field, "kind": "text"})
                fields.append(field)
                self.response[field] = v
                self.wrong[field] = "(" + v + ")+1"
                self.alt[field] = "2*(" + v + ")/2"
            rows.append({"label": f"Row {r + 1}", "cells": cells})
        self.inputs.append(
            {
                "id": i,
                "kind": "grid",
                "label": label,
                "columns": [f"Column {c + 1}" for c in range(len(value[0]))],
                "rows": rows,
            }
        )
        self.reqs.append(
            {
                "id": i,
                "description": label + " is correct.",
                "validator": "matrix",
                "fields": fields,
                "params": {"expected": value},
            }
        )
        return fields

    def boolean(self, label, value):
        return self.field(
            label, "boolean", {"expected": [value]}, value, not value, kind="boolean"
        )

    def select(self, label, correct, *wrong, shift=True):
        i = "answer-" + str(len(self.inputs) + 1)
        options = [
            {"id": f"option-{n + 1}", "label": v}
            for n, v in enumerate([correct, *wrong])
        ]
        # Stable rotation prevents a published first-answer pattern.
        n = int(self.key.rsplit("-", 1)[1]) % len(options)
        options = options[n:] + options[:n]
        self.inputs.append(
            {"id": i, "kind": "select", "label": label, "options": options}
        )
        self.reqs.append(
            {
                "id": i,
                "description": label + " is correct.",
                "validator": "selection",
                "fields": [i],
                "params": {"expected": ["option-1"]},
            }
        )
        self.response[i] = "option-1"
        self.wrong[i] = "option-2"
        self.shift |= shift
        return i

    def linear(self, label, params, value, wrong, alt=None):
        return self.field(label, "linear", params, value, wrong, alt)

    def basis(self, label, a, space, original=False):
        r, p = rref(a)
        value = (
            null(a)
            if space == "null"
            else [tr(a)[j] for j in p]
            if space == "column"
            else r[: len(p)]
        )
        params = {"kind": "basis", "a": ms(a), "space": space}
        if original:
            params["originalColumns"] = True
        alt = (
            list(reversed(value))
            if original
            else [scale(-2, r) for r in reversed(value)]
        )
        return self.linear(
            label + " (one vector per row; {} for the empty basis)",
            params,
            mat(ms(value)),
            mat([[0] * len(value[0])]) if value else "1",
            mat(ms(alt)),
        )

    def affine(self, a, b):
        p = particular(a, b)
        d = null(a)
        i = self.field(
            "Particular solution",
            "tuple",
            {"expected": vs(p)},
            vec(vs(p)),
            vec(vs(add(p, [1] + [0] * (len(p) - 1)))),
        )
        j = self.field(
            "Homogeneous directions (one vector per row; {} if none)",
            "matrix",
            {"expected": [["0"]]},
            mat(ms(d)),
            mat([[0] * len(p)]),
        )
        self.reqs = self.reqs[:-2] + [
            {
                "id": "family",
                "description": "The complete affine solution family is correct.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "affine-family", "a": ms(a), "b": vs(b)},
            }
        ]
        self.alt[i] = vec(vs(add(p, d[0]))) if d else vec(vs(p))
        self.alt[j] = mat(ms([scale(-2, x) for x in reversed(d)]))

    def witness(self, labels, values, conditions, integer=False, alternate=None):
        fields = []
        variables = []
        for name, label, value in zip("abcdefghijklmnpqrstuvwxyz", labels, values):
            i = "answer-" + str(len(self.inputs) + 1)
            self.inputs.append({"id": i, "kind": "math", "label": label})
            self.response[i] = str(value)
            self.wrong[i] = "0"
            variables.append({"name": name, "field": i, "integer": integer})
            fields.append(i)
        self.reqs.append(
            {
                "id": "witness-" + fields[0],
                "description": "The values satisfy every requested condition.",
                "validator": "witness",
                "fields": fields,
                "params": {
                    "variables": variables,
                    "conditions": [
                        {"left": l, "op": o, "right": r} for l, o, r in conditions
                    ],
                },
            }
        )
        if alternate:
            for i, v in zip(fields, alternate):
                self.alt[i] = str(v)
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
        lesson, id = self.key.rsplit("-", 1)
        fixtures = [{"response": self.response, "verdict": "correct"}]
        if self.alt:
            fixtures.append(
                {"response": {**self.response, **self.alt}, "verdict": "correct"}
            )
        # Reject a single independently altered required answer; witness fields use all-zero rejection.
        first = next(iter(self.response))
        bad = {**self.response, first: self.wrong[first]}
        if any(r["validator"] == "witness" and first in r["fields"] for r in self.reqs):
            bad = {**self.response, **self.wrong}
        fixtures.extend(
            [
                {"response": bad, "verdict": "incorrect"},
                {
                    "response": {k: v for k, v in self.response.items() if k != first},
                    "error": True,
                },
            ]
        )
        evidence = (
            "recognition"
            if all(x["kind"] in ["select", "boolean"] for x in self.inputs)
            else "production"
        )
        a = {
            "version": 1,
            "inputs": self.inputs,
            "requirements": self.reqs,
            "feedback": {
                "correct": self.q["officialAnswer"],
                "incorrect": "Check each requested result and the selected reason.",
            },
            "evidence": {
                "level": evidence,
                "interactionCost": "medium"
                if len(self.inputs) > 3 or any(i["kind"] == "grid" for i in self.inputs)
                else "low",
                "inputCapabilities": list(
                    dict.fromkeys(
                        "tap"
                        if i["kind"] in ["select", "boolean"]
                        else "short-text"
                        if i["kind"] == "grid"
                        else "math-text"
                        for i in self.inputs
                    )
                ),
            },
        }
        e = {
            "lesson": lesson,
            "id": int(id),
            "sourceHash": digest,
            "rationale": note
            or "The requested outputs are finite and exact; equivalent numerical forms and nonunique constructions are checked mathematically.",
            "assessment": a,
            "fixtures": fixtures,
        }
        if self.shift or prompt:
            e["prompt"] = (
                prompt
                or self.q["prompt"]
                + " Enter the requested values and select the matching reason below."
            )
            e["instructions"] = "Complete the answer fields."
        ENTRIES[self.key] = e
        NOTES[self.key] = {
            "evidenceChange": "Short explanation becomes reason recognition; numerical or construction outputs remain production."
            if self.shift
            else "Production preserved.",
            "source": "docs/deterministic-linear-source-inspection.md",
            "batch": "linear-algebra-exact",
            "promptChange": e.get("prompt", "") != self.q["prompt"],
        }


# Finite generated families, evaluated from the common authoring parameters.
for v in VERIFY:
    key = keyof(v)
    if key in EXISTING:
        continue
    family = canon(v["lesson"]).removeprefix("linear-algebra-")
    n = v["id"]
    k = v["kind"]
    t = Task(key)
    if k == "difference":
        d = add(v["b"], scale(-1, v["a"]))
        assert vs(d) == vs(v["expected"])
        t.tuple("Displacement", d)
        t.tuple("Displacement after translating both endpoints", d)
    elif family == "vectors" and k == "combination":
        if 41 <= n <= 46:
            continue  # Explicit derivation of coefficients is the assessed work.
        out = [
            sum(
                F(str(c)) * F(str(vv[j]))
                for c, vv in zip(v["coefficients"], v["vectors"])
            )
            for j in range(len(v["vectors"][0]))
        ]
        assert vs(out) == vs(v["expected"])
        t.tuple("Result", out)
        if 17 <= n <= 22:
            t.tuple("Result after adding 2v", scale(3, v["vectors"][0]))
        elif 23 <= n <= 28:
            t.select(
                "Why is the recovered vector unique?",
                "Each coordinate is fixed by subtracting the known vector from the target.",
                "Any vector of the same length gives the same sum.",
                "The components can be freely reordered.",
            )
        elif 59 <= n <= 64:
            t.tuple("Total including startup use", add(out, [2, 4]))
            t.select(
                "Is the complete rule proportional?",
                "No: the fixed nonzero startup use remains even at zero production.",
                "Yes: a fixed startup cost scales with every production count.",
                "Yes: adding vectors always describes a proportional rule.",
            )
        elif 65 <= n <= 70:
            t.select(
                "Must this average be an observed record?",
                "No: an average combines coordinates and need not match any observation.",
                "Yes: averaging always selects one observed record.",
                "Yes: equal weights force the two observations to coincide.",
            )
    elif k == "span-pair":
        j = next(j for j, x in enumerate(v["u"]) if x)
        c = F(v["yes"][j], v["u"][j])
        t.num("Scalar reaching the first target", c)
        t.select(
            "Which targets are reachable?",
            "Only the first: one common scalar must match every component.",
            "Both: a separate scalar may be chosen for each component.",
            "Neither: scalar multiples cannot change vector length.",
        )
    elif k == "dot" and family == "dot-products":
        assert dot(v["a"], v["b"]) == F(v["expected"])
        if 9 <= n <= 14:
            continue  # Two explicitly requested calculation methods.
        if 37 <= n <= 42:
            a, b = v["a"]
            t.witness(
                [
                    "First component of a nonzero perpendicular vector",
                    "Second component",
                ],
                [-b, a],
                [
                    ("(" + str(a) + ")*a+(" + str(b) + ")*b", "=", "0"),
                    ("a*a+b*b", ">", "0"),
                ],
                alternate=[-2 * b, 2 * a],
            )
        else:
            if 3 <= n <= 8:
                t.tuple(
                    "Component products", [F(x) * F(y) for x, y in zip(v["a"], v["b"])]
                )
            t.num("Dot product" if n < 57 else "Total cost", v["expected"])
            t.select(
                "Interpretation",
                "A scalar sum of products of matching components.",
                "A vector containing the separate component products.",
                "The product of the two sums of components.",
            )
    elif k == "normalize":
        assert dot(v["a"], v["a"]) == v["norm"] ** 2
        t.num("Norm", v["norm"])
        t.tuple(
            "Unit vector in the given direction", vs(scale(F(1, v["norm"]), v["a"]))
        )
        t.num("Squared norm of the unit vector", 1)
    elif k == "squared-distance":
        d = add(v["b"], scale(-1, v["a"]))
        sq = dot(d, d)
        assert sq == v["expected"]
        t.num("Exact distance", f"sqrt({sq})")
        t.select(
            "Why is subtraction order irrelevant?",
            "Reversing subtraction negates every component, leaving its square unchanged.",
            "Reversing subtraction leaves each component unchanged.",
            "The distance is the sum of the signed components.",
        )
    elif k == "angle":
        t.num("Angle in degrees", v["expected"])
        correct = (
            "Same direction"
            if v["expected"] == 0
            else "Opposite directions"
            if v["expected"] == 180
            else "Perpendicular"
            if v["expected"] == 90
            else "Neither parallel nor perpendicular"
        )
        t.select(
            "Direction classification",
            correct,
            *[
                x
                for x in [
                    "Same direction",
                    "Opposite directions",
                    "Perpendicular",
                    "Neither parallel nor perpendicular",
                ]
                if x != correct
            ],
            shift=False,
        )
    elif k == "cosine":
        t.num("Cosine similarity", v["expected"])
        t.select(
            "Effect of the nonzero scale factor",
            "Its sign determines direction; its magnitude cancels from the ratio.",
            "Both sign and magnitude cancel, so the ratio is always positive.",
            "The ratio equals the scale factor, including its magnitude.",
        )
    elif k == "matrix-combination":
        out = [add(scale(2, a), scale(-1, b)) for a, b in zip(v["a"], v["b"])]
        assert ms(out) == ms(v["expected"])
        t.matrix("2A − B", out)
        t.select(
            "Required shape condition",
            "The matrices must have the same number of rows and columns.",
            "Only the inner dimensions must agree.",
            "The matrices must both be square.",
        )
    elif k == "mv":
        out = mv(v["a"], v["x"])
        assert vs(out) == vs(v["expected"])
        if family == "systems":
            t.matrix("Augmented matrix", [r + [out[i]] for i, r in enumerate(v["a"])])
            t.tuple("Result of substituting the proposed vector", out)
            t.boolean("The proposed vector solves every equation", True)
        elif family == "transformations":
            t.matrix("Matrix of the transformation", v["a"])
            t.tuple("Output vector", out)
        else:
            t.tuple("Output vector", out)
            t.select(
                "Column interpretation",
                "The input entries weight the corresponding columns, which are then added.",
                "Each input entry multiplies a whole row to form the output vector.",
                "The output is a single column regardless of the input.",
            )
    elif k == "mm":
        out = mm(v["a"], v["b"])
        assert ms(out) == ms(v["expected"])
        if 51 <= n <= 56:
            for j, c in enumerate(tr(v["b"])):
                t.tuple(f"B applied to standard input {j + 1}", c)
                t.tuple(f"A applied to that output {j + 1}", mv(v["a"], c))
            t.select(
                "Why do these tests suffice?",
                "The standard inputs form a basis; linearity determines all other outputs.",
                "Every matrix has the same outputs on these inputs.",
                "Agreement on any one input proves matrices equal.",
            )
        else:
            t.matrix("AB", out)
            t.tuple("Shape of AB (rows, columns)", [len(out), len(out[0])])
            t.select("Which matrix acts first?", "B", "A", shift=False)
    elif k == "two-products":
        assert ms(mm(v["a"], v["b"])) == ms(v["ab"]) and ms(mm(v["b"], v["a"])) == ms(
            v["ba"]
        )
        t.matrix("AB", v["ab"])
        t.matrix("BA", v["ba"])
        t.select(
            "Order of stretching and shearing",
            "AB stretches inputs before the shear; BA stretches outputs after the shear.",
            "AB shears first; BA stretches first.",
            "Both products perform identical operations in identical order.",
        )
    elif k == "unique-system":
        if family == "systems" and n <= 22:
            continue
        assert vs(mv(v["a"], v["expected"])) == vs(v["b"])
        t.tuple("Solution", v["expected"])
        t.tuple("Check: A times the solution", v["b"])
        if family == "systems":
            t.select(
                "Why is a row swap allowed?",
                "It reorders whole equations while providing a nonzero first pivot.",
                "It changes the variables so a zero coefficient becomes nonzero.",
                "It discards the equation with a zero first coefficient.",
            )
    elif k == "spaces":
        if family == "bases" and n >= 29:
            continue  # Explicit reduction retained in first batch.
        t.basis(
            "Column-space basis" if family == "bases" else "Image basis",
            v["a"],
            "column",
        )
        t.basis(
            "Null-space basis" if family == "bases" else "Kernel basis", v["a"], "null"
        )
        if family == "bases":
            t.num("Column-space dimension", v["rank"])
            t.num("Null-space dimension", len(v["a"][0]) - v["rank"])
        else:
            t.boolean("Injective", v["rank"] == len(v["a"][0]))
            t.boolean("Surjective onto the stated codomain", v["rank"] == len(v["a"]))
    elif k == "inverse":
        assert ms(mm(v["a"], v["expected"])) == ms(identity(len(v["a"])))
        t.matrix("Inverse", v["expected"])
        t.num("Determinant", v["det"])
        t.matrix("Check: A times the inverse", identity(len(v["a"])))
    elif k == "determinant":
        a = v["a"]
        d = a[0][0] * a[1][1] - a[0][1] * a[1][0]
        assert d == v["expected"]
        t.num("Determinant", d)
        t.num("Parallelogram area", abs(d))
        t.boolean("Invertible", d != 0)
    elif k == "similarity":
        p = v["p"]
        inv = [[F(1, 2), F(1, 2)], [F(1, 2), F(-1, 2)]]
        assert ms(mm(mm(inv, v["a"]), p)) == ms(v["expected"])
        t.matrix("Matrix in the specified basis", v["expected"])
    elif k == "projection":
        c = dot(v["b"], v["u"]) / dot(v["u"], v["u"])
        out = scale(c, v["u"])
        res = add(v["b"], scale(-1, out))
        assert vs(out) == vs(v["expected"]) and vs(res) == vs(v["residual"])
        if n <= 8:
            t.num("Projection coefficient", c)
            t.tuple("Projection", out)
            t.tuple("Residual", res)
            t.num("Residual dot the line direction", dot(res, v["u"]))
        else:
            t.tuple("Projection using the supplied direction", out)
            t.tuple("Projection using (1,1)", out)
            t.select(
                "Why do the projections agree?",
                "A nonzero rescaling leaves the spanned line unchanged.",
                "The projection coefficient is unchanged under every rescaling.",
                "Every target projects to itself on this line.",
            )
    elif k == "projection-space":
        coeff = mv(tr(v["a"]), v["b"])
        out = mv(v["a"], coeff)
        assert vs(out) == vs(v["expected"])
        t.tuple("Q transpose b", coeff)
        t.tuple("Projection", out)
        t.tuple("Residual", add(v["b"], scale(-1, out)))
    elif k == "least-squares":
        if 31 <= n <= 42:
            continue  # Explicit derivation/setup of equations and solution method.
        out = mv(v["a"], v["x"])
        assert vs(out) == vs(v["expected"])
        res = add(v["b"], scale(-1, out))
        assert not any(mv(tr(v["a"]), res))
        if 43 <= n <= 48:
            t.affine(mm(tr(v["a"]), v["a"]), mv(tr(v["a"]), v["b"]))
            t.tuple("Unique fitted output", out)
        else:
            t.tuple("Residual", res)
            t.tuple("A transpose times the residual", mv(tr(v["a"]), res))
            t.select(
                "Why does this certify a least-squares fit?",
                "The residual is perpendicular to every column of A.",
                "The residual must itself be zero for every best fit.",
                "The coefficient must have the smallest possible magnitude.",
            )
    elif k == "diagonal-eigen":
        for j, x in enumerate(v["values"]):
            t.num(f"Eigenvalue for standard vector {j + 1}", x)
        t.field(
            "Eigenvalue for (1,1), or none",
            "term",
            {"accepted": ["none", "not an eigenvector"]},
            "none",
            "0",
            kind="text",
        )
    elif k == "multiplicity":
        t.num("Eigenvalue", v["value"])
        t.num("Algebraic multiplicity", 2)
        t.num("Eigenspace dimension", v["geometric"])
        t.boolean("Diagonalizable", v["geometric"] == 2)
    elif k == "eigen":
        if n < 37:
            continue  # Characteristic-equation / eigenspace verification checkpoints pending.
        # Here the supplied P,D determine A; the task requests direct eigenvector checks.
        a = v["a"]
        t.matrix("A", a)
        for j, (value, x) in enumerate(zip(v["values"], v["vectors"])):
            t.tuple(f"A times eigenvector {j + 1}", mv(a, x))
    elif k == "svd":
        assert ms(mm(mm(v["u"], v["sigma"]), tr(v["v"]))) == ms(v["a"])
        if n < 23:
            x = [
                F(x.strip())
                for x in re.findall(r"\(([^()]*)\)", v["prompt"])[-1].split(",")
            ]
            t.matrix("Reconstructed A", v["a"])
            t.tuple("Output vector", mv(v["a"], x))
        else:
            fields = []
            for label, name in [("U", "u"), ("Sigma", "sigma"), ("V", "v")]:
                fields.append(t.matrix(label, v[name]))
            t.reqs = [
                {
                    "id": "svd",
                    "description": "The supplied factors form a descending full SVD.",
                    "validator": "linear",
                    "fields": fields,
                    "params": {"kind": "svd", "a": ms(v["a"]), "order": "descending"},
                }
            ]
            t.alt = {
                fields[0]: mat(ms([scale(-1, r) for r in v["u"]])),
                fields[2]: mat(ms([scale(-1, r) for r in v["v"]])),
            }
            t.select(
                "Where are the original signs retained?",
                "In the orthogonal factors; singular values stay nonnegative.",
                "In negative entries on the diagonal of Sigma.",
                "They disappear because an SVD preserves only magnitudes.",
            )
    elif k == "rank-spectrum":
        t.num("Rank", v["rank"])
        t.num("Nullity", len(v["a"][0]) - v["rank"])
        t.tuple(
            "Eigenvalues of A transpose A, including multiplicity", v["ataEigen"], False
        )
    elif k == "singular-direction":
        assert vs(mv(v["a"], v["right"])) == vs(scale(v["sigma"], v["left"]))
        t.tuple("Left singular vector", v["left"])
        t.num("Its squared norm", dot(v["left"], v["left"]))
        t.tuple("Check: A times the right singular vector", mv(v["a"], v["right"]))
    elif k == "truncation":
        a = [
            [x if i == j else 0 for j in range(len(v["values"]))]
            for i, x in enumerate(v["values"])
        ]
        approx = deepcopy(a)
        for i in range(v["k"], len(a)):
            approx[i][i] = 0
        sq = sum(x * x for x in v["values"][v["k"] :])
        assert sq == v["errorSquared"]
        t.linear(
            "One best rank-at-most-one approximation",
            {"kind": "best-rank", "a": ms(a), "rank": v["k"], "errorSquared": str(sq)},
            mat(approx),
            mat(a),
        )
        t.num("Exact Frobenius error", f"sqrt({sq})")
        t.num(
            "Error after keeping two directions",
            f"sqrt({sum(x * x for x in v['values'][2:])})",
        )
    else:
        continue
    t.finish()


# Parse the authored prompt's numerical tuples for original, non-family tasks.
def tuples(prompt):
    return [
        [F(x.strip()) for x in m.split(",")]
        for m in re.findall(r"\(([-\d\s,./]+)\)", prompt)
        if "," in m
    ]


def task(lesson, n):
    return Task("linear-algebra-" + lesson + "-" + str(n))


def reason(t, correct, wrong1, wrong2):
    t.select("Reason", correct, wrong1, wrong2)


for n in [1, 2, *range(9, 17), *range(29, 35), 36, 39, 40, 54, 56, 57, 74]:
    t = task("vectors", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 1:
        t.tuple("Displacement", add(vv[1], scale(-1, vv[0])))
        reason(
            t,
            "Moving both endpoints by the same vector preserves their difference; moving only the start changes it.",
            "Either endpoint change preserves the difference.",
            "Both changes alter the displacement in the same way.",
        )
    elif n == 2 or 9 <= n <= 14:
        if n == 2:
            labels = ["hours studied", "exercises attempted"]
            vv = vv[:2]
        else:
            labels = (
                p.split("coordinate order ", 1)[1]
                .split(" and has value", 1)[0]
                .split(", ")
            )
        t.num("Number of components", len(vv[0]))
        correct = "; ".join(f"{label}: {v}" for label, v in zip(labels, vv[0]))
        swapped = vv[0][:]
        swapped[0], swapped[1] = swapped[1], swapped[0]
        t.select(
            "Interpret the first listed record",
            correct,
            "; ".join(f"{label}: {v}" for label, v in zip(labels, swapped)),
            "The entries are unordered measurements with no assigned coordinates.",
        )
        reason(
            t,
            "Exchanging the first two values assigns them to different measurements.",
            "Exchanging values leaves their assigned measurements unchanged.",
            "Only the number of components gives a record its meaning.",
        )
    elif n == 15:
        u, v = vv
        t.tuple("u + v", add(u, v))
        t.tuple("u − v", add(u, scale(-1, v)))
        t.tuple("−2u", scale(-2, u))
        reason(
            t,
            "The negative sign reverses direction; magnitude two doubles length.",
            "A negative factor reverses coordinate order without changing direction.",
            "Only the first component changes under negative scaling.",
        )
    elif n == 16:
        t.tuple("Total displacement", [sum(x[j] for x in vv) for j in range(2)])
        reason(
            t,
            "Displacement gives endpoint change; different routes can have different traveled distances.",
            "The norm of displacement always equals total traveled distance.",
            "Displacement determines the length of every piece of the route.",
        )
    elif 29 <= n <= 34:
        t.tuple("Total displacement", [sum(x[j] for x in vv) for j in range(2)])
        t.num("Distance traveled", sum(abs(x) for v in vv for x in v))
        reason(
            t,
            "Opposite displacements cancel, while lengths of traveled pieces add.",
            "Opposite movements cancel both displacement and traveled distance.",
            "Distance is the sum of the signed final coordinates.",
        )
    elif n == 36:
        t.tuple("Corrected result", scale(-2, vv[0]))
        reason(
            t,
            "The scalar multiplies every component.",
            "The scalar multiplies only the first component.",
            "A negative scalar reverses component order.",
        )
    elif n == 39:
        u, v = vv
        t.tuple("3u", scale(3, u))
        t.tuple("−2v", scale(-2, v))
        t.tuple("3u − 2v", add(scale(3, u), scale(-2, v)))
    elif n == 40:
        reason(
            t,
            "No: every combination has equal components, but the target does not.",
            "Yes: two supplied vectors always span the plane.",
            "No: only integer coefficients are permitted in a real span.",
        )
    elif n == 54:
        # Under r=p+q, (a,b,c) produces r universally iff a+c=b+c=1.
        t.witness(
            [
                "First list: coefficient of p",
                "First list: coefficient of q",
                "First list: coefficient of r",
                "Second list: coefficient of p",
                "Second list: coefficient of q",
                "Second list: coefficient of r",
            ],
            [1, 1, 0, 0, 0, 1],
            [
                ("a+c", "=", "1"),
                ("b+c", "=", "1"),
                ("d+f", "=", "1"),
                ("e+f", "=", "1"),
                ("(a-d)^2+(b-e)^2+(c-f)^2", ">", "0"),
            ],
            alternate=[2, 2, -1, -1, -1, 2],
        )
    elif n == 56:
        t.field(
            "Coefficient of (1,1)",
            "expression",
            {"variables": ["a", "b"], "expected": "(a+b)/2"},
            "(a+b)/2",
            "a+b",
        )
        t.field(
            "Coefficient of (1,−1)",
            "expression",
            {"variables": ["a", "b"], "expected": "(a-b)/2"},
            "(a-b)/2",
            "a-b",
        )
        reason(
            t,
            "The coefficients sum to a and differ by b for every real a,b.",
            "The coefficients must always equal the original components.",
            "This works only when a and b are equal.",
        )
    elif n == 57:
        t.tuple("Resources", add(scale(2, vv[0]), scale(3, vv[1])))
        reason(
            t,
            "Resource use is additive and proportional, without extra setup use.",
            "Every real coefficient necessarily describes feasible production.",
            "The model permits resource use to change arbitrarily with volume.",
        )
    elif n == 74:
        reason(
            t,
            "Displacement is zero; traveled distance can be positive.",
            "Both displacement and traveled distance must be zero.",
            "Distance is zero while displacement can be nonzero.",
        )
    t.finish()

for n in [1, 2, 15, 16, *range(29, 35), 35, 55, 56, 73]:
    t = task("dot-products", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 1:
        t.num("Dot product", dot(*vv))
        t.select("Result type", "Scalar", "Vector", shift=False)
    elif n == 2:
        u, v, w = vv
        t.num("u dot (v+w)", dot(u, add(v, w)))
        t.num("u dot v", dot(u, v))
        t.num("u dot w", dot(u, w))
        t.num("(u dot v)+(u dot w)", dot(u, v) + dot(u, w))
    elif n == 15:
        t.num("Norm", 10)
        t.tuple("Unit vector", scale(F(1, 10), vv[0]))
        t.num("Squared norm of that vector", 1)
    elif n == 16:
        d = add(vv[1], scale(-1, vv[0]))
        t.num("Distance", f"sqrt({dot(d, d)})")
        reason(
            t,
            "Reversing the difference negates its entries without changing their squares.",
            "Distance is the signed sum of the difference entries.",
            "Reversing the difference exchanges the coordinates.",
        )
    elif 29 <= n <= 34:
        a, length = map(int, re.search(r"\((\d+),t\) has norm (\d+)", p).groups())
        sq = length * length - a * a
        t.tuple("All real values of t", [f"sqrt({sq})", f"-sqrt({sq})"], False)
        reason(
            t,
            "Both signs have the same square and therefore the same norm.",
            "Norm records the signs of individual coordinates.",
            "Only the nonnegative value can be a real coordinate.",
        )
    elif n == 35:
        t.num("u dot v", dot(*vv))
        t.select(
            "Conclusion",
            "Orthogonal, but neither is a unit vector.",
            "Orthogonal, so both are unit vectors.",
            "Not orthogonal because their lengths exceed one.",
        )
    elif n == 55:
        t.num("Total cost", dot(*vv))
        reason(
            t,
            "Pair each price with its corresponding quantity and add the costs.",
            "Multiply the sum of prices by the sum of quantities.",
            "Add the component products as a vector without summing them.",
        )
    elif n == 56:
        t.num("Cosine similarity", 1)
        reason(
            t,
            "The vectors point in the same direction but have different lengths.",
            "Cosine one means all matching components are equal.",
            "Cosine similarity depends only on vector lengths.",
        )
    elif n == 73:
        t.num("Squared norm", dot(vv[0], vv[0]))
        t.boolean("Unit vector", False)
    t.finish()

for n in [2, 15, 16, 29, 30, *range(43, 51), 57, 58, 61, 62, 66]:
    if "linear-algebra-matrices-" + str(n) in ENTRIES:
        continue
    t = task("matrices", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 2:
        t.matrix("2A + B", [add(scale(2, a), b) for a, b in zip(vv[:2], vv[2:])])
    elif n == 15:
        a = vv[:2]
        x = vv[2]
        t.tuple("Output from row dot products", mv(a, x))
        t.tuple("First weighted column", scale(x[0], tr(a)[0]))
        t.tuple("Second weighted column", scale(x[1], tr(a)[1]))
        t.tuple("Sum of weighted columns", mv(a, x))
    elif n == 16:
        t.tuple("Output", vv[1])
        reason(
            t,
            "The standard input selects the second column.",
            "The input adds every column with coefficient one.",
            "The input selects the second row.",
        )
    elif n == 29:
        a, b = vv[:2], vv[2:]
        t.matrix_grid("AB", mm(a, b))
        t.matrix_grid("BA", mm(b, a))
        t.select("First transformation in ABx", "B", "A", shift=False)
    elif n == 30 or 43 <= n <= 48:
        dims = (
            [2, 3, 3, 4]
            if n == 30
            else list(
                map(
                    int,
                    re.search(
                        r"A is (\d+) by (\d+) and B is (\d+) by (\d+)", p
                    ).groups(),
                )
            )
        )
        m, k, k2, q = dims
        assert k == k2
        t.tuple("Shape of AB (rows, columns)", [m, q])
        if m == q:
            t.tuple("Shape of BA (rows, columns), or undefined", [k, k])
        else:
            t.field(
                "Shape of BA (rows, columns), or undefined",
                "term",
                {"accepted": ["undefined", "not defined"]},
                "undefined",
                "(1,1)",
                kind="text",
            )
    elif n == 49:
        t.matrix("AB", mm(vv[:2], vv[2:]))
        reason(
            t,
            "A zero matrix product can have two nonzero factors.",
            "A zero matrix product forces both factors to be zero.",
            "Two nonzero matrices always have a nonzero product.",
        )
    elif n == 50:
        t.tuple("Output on (1,0)", vv[0])
        t.tuple("Output on (0,1)", vv[1])
        reason(
            t,
            "Compare each column with successive component transformations on the corresponding standard input.",
            "Testing only zero determines all columns.",
            "Compare the individual entries without forming row-column products.",
        )
    elif n == 57:
        fields = [
            t.matrix("A", [[1, 0], [0, 0]]),
            t.matrix("B", [[0, 0], [0, 1]]),
            t.matrix("AB", [[0, 0], [0, 0]]),
        ]
        t.reqs = [
            {
                "id": "witness",
                "description": "Both factors are nonzero and the displayed product is zero.",
                "validator": "linear",
                "fields": fields,
                "params": {"kind": "zero-product"},
            }
        ]
        t.alt = {fields[0]: "2,0;0,0", fields[1]: "0,0;0,3"}
        t.wrong[fields[0]] = "1,0;0,1"
    elif n == 58:
        fields = [
            t.matrix("A", [[1, 0], [0, 0]]),
            t.matrix("B", identity(2)),
            t.matrix("C", [[1, 0], [0, 2]]),
        ]
        t.reqs = [
            {
                "id": "witness",
                "description": "AB=AC and B differs from C.",
                "validator": "linear",
                "fields": fields,
                "params": {"kind": "cancellation"},
            }
        ]
        t.alt = {fields[0]: "0", fields[1]: "1", fields[2]: "2"}
        t.wrong[fields[0]] = "1,0;0,1"
    elif n == 61:
        t.tuple("Shape of A transpose A (rows, columns)", [3, 3])
        t.tuple("Shape of A A transpose (rows, columns)", [2, 2])
    elif n == 62:
        t.linear(
            "A square counterexample matrix",
            {"kind": "nonsymmetric"},
            "1,2;0,1",
            "1,0;0,1",
            "0,1,0;0,0,0;0,0,0",
        )
    elif n == 66:
        t.witness(
            ["Rows of A", "Columns of A", "Rows of B", "Columns of B"],
            [2, 3, 3, 4],
            [
                ("a", ">", "0"),
                ("b", ">", "0"),
                ("c", ">", "0"),
                ("d", ">", "0"),
                ("b", "=", "c"),
                ("a", "!=", "d"),
            ],
            True,
            [1, 2, 2, 3],
        )
    t.finish()
    if n == 29:
        note = (
            "AB and BA use compact grids because this prompt asks for their entries and "
            "composition order, not their shapes. Shape questions 30–36 retain typed answers."
        )
        ENTRIES[t.key]["rationale"] = note
        NOTES[t.key]["controlRationale"] = note
        NOTES[t.key]["promptChange"] = False

for n in [1, 2]:
    t = task("systems", n)
    if n == 1:
        t.tuple("Solution (x,y)", [3, 2])
        t.num("Check: x+y", 5)
        t.num("Check: x−y", 1)
    else:
        t.matrix("Augmented matrix", [[2, 3, 7], [-1, 1, 4]])
    t.finish()

for n in [1, 2, 15, 50, 52, *range(53, 66)]:
    t = task("span", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 1:
        t.tuple("Coefficients of u,v", [1, 2])
    elif n == 2:
        t.select(
            "Geometric span",
            "The line through zero in the given direction.",
            "The entire plane.",
            "Only the original vector.",
        )
        t.boolean("First target belongs", True)
        t.boolean("Second target belongs", False)
    elif n == 15:
        t.witness(
            ["Coefficient of u", "Coefficient of v"],
            [2, -1],
            [("a+2*b", "=", "0"), ("a*a+b*b", ">", "0")],
            alternate=[-4, 2],
        )
        t.boolean("Linearly independent", False)
    elif n == 50:
        t.num("Dimension of ambient row space", 4)
        t.num("Dimension of ambient column space", 2)
        t.num("Dimension of ambient null space", 4)
    elif n == 52:
        t.field(
            "Third coordinate z as a function of x,y",
            "expression",
            {"variables": ["x", "y"], "expected": "x+y"},
            "x+y",
            "x-y",
        )
        t.witness(
            ["Unreachable target x", "Unreachable target y", "Unreachable target z"],
            [0, 0, 1],
            [("a+b", "!=", "c")],
            alternate=[1, 2, 0],
        )
    elif 53 <= n <= 58:
        m, q, r = map(
            int, re.search(r"(\d+)-by-(\d+) matrix has (\d+) pivot", p).groups()
        )
        t.num("Number of free variables", q - r)
        t.select(
            "Column independence",
            "Independent: no free variable permits a nontrivial zero combination."
            if r == q
            else "Dependent: a free variable permits a nontrivial zero combination.",
            "Dependent: every homogeneous system has the zero solution."
            if r == q
            else "Independent: the homogeneous system contains the zero solution.",
            "The row count alone determines independence.",
        )
    elif 59 <= n <= 64:
        q, m = map(
            int,
            re.search(r"place (\d+) vectors from real (\d+)-dimensional", p).groups(),
        )
        t.tuple("Matrix shape (rows, columns)", [m, q])
        t.num("Components in a coefficient list", q)
        t.num("Components in the resulting combination", m)
    elif n == 65:
        t.linear(
            "Vectors, one per row",
            {"kind": "nonparallel-dependent"},
            "1,0;0,1;1,1",
            "1,0;2,0;0,1",
            "1,1;1,-1;2,1",
        )
    t.finish()

for n in [1, 2, 15, 16, *range(17, 23), 35, 36, 46, *range(48, 54), 60, 71]:
    t = task("bases", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 1:
        t.tuple("Coordinates in the specified basis", [3, 2])
        t.tuple("Standard coordinates", vv[-1])
    elif n == 2:
        t.basis("Basis", tr([vv[0]]), "column")
        t.num("Dimension", 1)
        reason(
            t,
            "The supplied nonzero vector spans the line and is independent.",
            "A basis must include both the vector and its negative.",
            "A single vector cannot be independent.",
        )
    elif n == 15:
        t.num("Rank", 3)
        t.num("Nullity", 2)
        reason(
            t,
            "Free variables describe independent homogeneous input directions with zero output.",
            "Free variables describe arbitrary changes in output space.",
            "Each free variable produces a new pivot column.",
        )
    elif n == 16:
        a = tr(vv)
        t.basis("Column-space basis", a, "column", True)
        t.basis("Null-space basis", a, "null")
    elif 17 <= n <= 22:
        m, q, r = map(
            int, re.search(r"(\d+)-by-(\d+) matrix has rank (\d+)", p).groups()
        )
        t.num("Nullity", q - r)
        t.num("Row-space dimension", r)
        t.num("Column-space dimension", r)
        t.boolean("Full row rank", m == r)
        t.boolean("Full column rank", q == r)
    elif n == 35:
        t.matrix("Inverse", [[1, -2], [0, 1]])
        t.matrix("Verification product", identity(2))
    elif n == 36:
        t.num("Determinant", 0)
        t.num("Scalar expressing column 2 as a multiple of column 1", 2)
        t.boolean("Invertible", False)
    elif n == 46 or 48 <= n <= 53:
        m, q, r = (
            (3, 2, 2)
            if n == 46
            else map(int, re.search(r"(\d+)-by-(\d+) matrix of rank (\d+)", p).groups())
        )
        t.select(
            "Is every target reachable?",
            "Yes: rank equals the number of output coordinates."
            if m == r
            else "No: the image dimension is smaller than the output space.",
            "No: no rectangular matrix can reach every output."
            if m == r
            else "Yes: any matrix reaches every output by definition.",
        )
        t.select(
            "Does each reachable target have a unique input?",
            "Yes: nullity is zero."
            if q == r
            else "No: positive nullity gives multiple inputs for each reachable output.",
            "No: reaching a target always allows arbitrary inputs."
            if q == r
            else "Yes: existence automatically guarantees uniqueness.",
        )
    elif n == 60:
        t.field(
            "Basis for the zero-only subspace",
            "term",
            {"accepted": ["{}", "empty", "empty list", "empty set"]},
            "{}",
            "{0}",
            kind="text",
        )
        reason(
            t,
            "The empty list is independent and spans zero; including a zero vector would create dependence.",
            "The list containing zero is independent because zero has no direction.",
            "The zero-only subspace has no possible basis.",
        )
    elif n == 71:
        t.linear(
            "Counterexample matrix",
            {"kind": "determinant-scale", "determinantAbs": "2", "scaleSquared": "4"},
            "2,0;0,1",
            "2,0;0,2",
            "0,2;1,0",
        )
    t.finish()

for n in [2, *range(9, 17), 29, *range(37, 44), *range(51, 57), 63]:
    t = task("transformations", n)
    p = t.q["prompt"]
    vv = tuples(p)
    if n == 2 or 9 <= n <= 14:
        t.tuple("T(0,0)", [0, 0])
        t.witness(
            [
                "First coordinate of a counterexample input (second coordinate zero)",
                "Scalar multiplier",
            ],
            [1, 2],
            [("b*b*a*a", "!=", "b*a*a")],
            alternate=[2, 3],
        )
        t.boolean("Linear", False)
    elif n == 15:
        a = tr([vv[1], vv[3]])
        t.matrix("Matrix", a)
        t.tuple("Output", mv(a, vv[4]))
    elif n == 16:
        t.tuple("Image of (1,0)", [0, 1])
        t.tuple("Image of (0,1)", [-1, 0])
        t.tuple("Image of the target", [-vv[0][1], vv[0][0]])
    elif n == 29:
        a = [[1, 0, 0], [0, 1, 0]]
        t.basis("Kernel basis", a, "null")
        t.basis("Image basis", a, "column")
        t.boolean("Injective", False)
        t.boolean("Surjective", True)
    elif 37 <= n <= 42:
        nums = re.search(r"\(x,y,([+-]?\d+)x([+-])\s*(\d+)y\)", p)
        a, b = int(nums[1]), int(nums[3]) * (1 if nums[2] == "+" else -1)
        m = [[1, 0], [0, 1], [a, b]]
        t.basis("Kernel basis", m, "null")
        t.basis("Image basis", m, "column")
        t.boolean("Surjective onto three-dimensional space", False)
        t.boolean("Surjective onto its image plane", True)
    elif n == 43 or 51 <= n <= 56:
        offset = [2, -1] if n == 43 else vv[-1]
        t.tuple("Value at zero", offset)
        t.select(
            "Classification",
            "Linear: zero offset leaves a matrix rule."
            if not any(offset)
            else "Affine but not linear: the nonzero offset moves the origin.",
            "Affine but not linear: every matrix rule moves the origin."
            if not any(offset)
            else "Linear: every affine offset preserves zero.",
            "Neither linear nor affine: adding an offset cannot define an affine rule.",
        )
    elif n == 63:
        t.linear(
            "Matrix of a map that changes angles",
            {"kind": "changes-angles"},
            "1,1;0,1",
            "1,0;0,1",
            "2,0;0,1",
        )
    t.finish()

# Deliberate short-reason rewrites: each option is a complete, distinguishable claim.
CHOICES = {
    "vectors": {
        38: (
            "Addition needs a shared coordinate space; embedding the plane in space is an extra modeling choice.",
            "Any two vectors can be added by ignoring unmatched coordinates.",
            "Appending a zero component is automatic and requires no interpretation.",
        ),
        58: (
            "Negative mathematical coefficients need not represent feasible production quantities.",
            "Every real linear combination must be physically feasible.",
            "Vector addition itself restricts all coefficients to nonnegative integers.",
        ),
        71: (
            "One experiment checks one case; proportionality is a statement about all inputs.",
            "One successful doubling experiment proves proportionality for every amount.",
            "Proportionality can never be investigated with experiments.",
        ),
        72: (
            "Mixture coefficients can represent fractions of amounts; feasibility depends on the application.",
            "Linear combinations always require integer coefficients.",
            "Fractional coefficients mean the two ingredient vectors have fractional dimensions.",
        ),
        73: (
            "Equal component counts define the formal sum but do not reconcile incompatible units.",
            "Matching lengths makes every physical interpretation meaningful.",
            "The sum is formally undefined even when the component counts match.",
        ),
    },
    "dot-products": {
        36: (
            "The angle is greater than 90° and at most 180°: positive norms make the cosine negative.",
            "The angle is strictly between 0° and 90° because both norms are positive.",
            "The angle must be exactly 180° whenever the dot product is negative.",
        ),
        50: (
            "Zero is orthogonal to itself, but the angle is undefined because its length is zero.",
            "Zero is orthogonal to itself and makes an angle of 90° with itself.",
            "Zero is not orthogonal to itself because it has no direction.",
        ),
        69: (
            "No: the denominator contains a zero norm, so an additional convention would be needed.",
            "Yes: the usual formula always assigns cosine zero to a zero record.",
            "Yes: the usual formula always assigns cosine one to a zero record.",
        ),
        70: (
            "Changing one coordinate can change direction; uniform positive scaling cancels from the ratio.",
            "Changing one coordinate always preserves direction just like uniform scaling.",
            "Uniform positive scaling changes cosine in proportion to the scale factor.",
        ),
        74: (
            "Matching order pairs each price with the quantity of that same product.",
            "The dot product automatically sorts prices and quantities into matching order.",
            "Any permutation of just one vector preserves the intended total cost.",
        ),
    },
    "matrices": {
        59: (
            "Every matrix sends zero to zero, so this test places no restriction on the columns.",
            "Only the identity matrix sends zero to zero.",
            "Agreement on zero determines a linear transformation completely.",
        ),
        64: (
            "Each row produces one dot product, summed over the input components.",
            "Each matrix position produces a separate output entry.",
            "The output always has the same shape as the matrix.",
        ),
        67: (
            "Row-column dot products and their sums over the inner dimension were omitted.",
            "The missing operation is sorting both matrices by entry size.",
            "Only the diagonal entries should have been multiplied.",
        ),
        68: (
            "Each column records one product’s resource needs; production counts weight and add those columns.",
            "Each column records a possible total regardless of production counts.",
            "Production counts independently multiply matching positions without summation.",
        ),
    },
    "systems": {
        59: (
            "At most three pivots leave at least two free variables; homogeneity ensures consistency.",
            "Three equations force all five variables to zero.",
            "Every system with more unknowns than equations is inconsistent.",
        ),
        61: (
            "It asserts 0x+0y=1, so the system is inconsistent.",
            "It asserts the third unknown equals one.",
            "It is a redundant zero equation and imposes no restriction.",
        ),
        63: (
            "Using one shared parameter adds a relation between variables that may vary independently.",
            "Free variables must always have equal values.",
            "Two independently chosen parameters cannot represent one solution vector.",
        ),
        65: (
            "Yes: a contradiction row can coexist with nonpivot coefficient columns.",
            "No: any free variable makes every system consistent.",
            "No: an inconsistent system must have a pivot in every coefficient column.",
        ),
        66: (
            "Show every solution has the proposed form; substitution establishes only one inclusion.",
            "Nothing further: checking some members proves the family complete.",
            "Only show that one member is nonzero.",
        ),
        67: (
            "Row exchange reorders equations; column exchange requires relabeling variables.",
            "Both operations merely reorder equations.",
            "Column exchange never changes the meaning of the variable coefficients.",
        ),
        68: (
            "Nontrivial means at least one coordinate is nonzero.",
            "Nontrivial means the calculation required several elimination steps.",
            "Nontrivial means every coordinate must be nonzero.",
        ),
    },
    "span": {
        45: (
            "Yes: zero plus zero and every scalar multiple of zero are zero.",
            "No: a subspace must contain at least two distinct vectors.",
            "No: a subspace must contain a nonzero vector.",
        ),
        51: (
            "Dependent: choosing a nonzero free parameter gives a nontrivial zero combination.",
            "Independent: the zero vector is a solution of the homogeneous system.",
            "Independent: the three columns can be assigned different coefficients.",
        ),
        68: (
            "Four unknown coefficients and at most three pivots give a nontrivial homogeneous solution.",
            "Four vectors always include two identical vectors.",
            "Three-dimensional vectors cannot be added in collections of four.",
        ),
    },
    "bases": {
        61: (
            "Repeatedly remove a vector expressible through the others until the spanning list is independent.",
            "Delete any vectors until the list has as many vectors as the ambient dimension.",
            "Normalize every vector; normalization removes all dependence.",
        ),
        63: (
            "No: rank is bounded by the number of rows, which is two.",
            "Yes: rank is determined only by the five columns.",
            "Yes: a wide matrix always has rank greater than its row count.",
        ),
        47: (
            "Reduction preserves column dependence relations but can change the column space itself.",
            "Reduced columns always equal the corresponding original columns.",
            "Every nonzero reduced column belongs to the original column space.",
        ),
        65: (
            "An invertible identity matrix has zero entries with undefined reciprocals; inversion is defined by matrix products.",
            "Entrywise reciprocals work whenever the matrix is square.",
            "An identity matrix is not invertible because it contains zeros.",
        ),
    },
    "transformations": {
        44: (
            "P converts new input coordinates to standard, A acts, then P inverse converts the output back.",
            "P inverse converts input first, A acts, then P converts output back.",
            "P acts on both input and output in the same direction.",
        ),
        60: (
            "No: the kernel depends on inputs sent to zero by the unchanged rule.",
            "Yes: any larger codomain removes lost input directions.",
            "Yes: surjectivity and injectivity are the same property.",
        ),
        61: (
            "P converts input to standard coordinates; P inverse converts the transformed output back.",
            "P inverse must act first because it is written first on the left.",
            "The factors can be reordered because change-of-basis matrices commute.",
        ),
        62: (
            "The input basis matrix is on the right; the inverse output basis matrix is on the left.",
            "The inverse input basis matrix is on the left; the output basis matrix is on the right.",
            "Use the same basis matrix on both sides for every rectangular map.",
        ),
        68: (
            "New basis directions may mix the old scaling directions, creating off-diagonal coordinate entries.",
            "An off-diagonal entry proves the underlying geometric transformation changed.",
            "Changing coordinates preserves every individual matrix entry.",
        ),
    },
    "projections": {
        2: (
            "Numerator doubles, denominator quadruples, and the direction doubles; the factors cancel.",
            "Both the coefficient and direction remain unchanged under rescaling.",
            "Doubling the direction doubles the final projection.",
        ),
        49: (
            "No: an unreachable target has a nonzero residual even at its closest permitted output.",
            "Yes: a correct least-squares residual must always be zero.",
            "Yes: a nonzero residual means the normal equations have no solutions.",
        ),
        50: (
            "A nonzero null-space direction changes coefficients without changing the fitted output.",
            "Every distinct coefficient vector must produce a distinct output.",
            "A unique closest output forces columns to be independent.",
        ),
        58: (
            "The direction is dependent on earlier ones; its zero norm cannot be used as a divisor.",
            "A zero remainder is already a unit vector and should be retained.",
            "A zero remainder proves the earlier vectors were not perpendicular.",
        ),
        59: (
            "Q transpose Q records orthonormal column dot products; Q Q transpose projects onto their possibly proper span.",
            "Both products must always be identity of the same size.",
            "Q Q transpose is never a projection.",
        ),
        60: (
            "No: exact fit to the observed data does not establish causality or reliable extrapolation.",
            "Yes: zero residual proves the model captures the scientific mechanism.",
            "Yes: exact fit guarantees correct predictions on all new data.",
        ),
        61: (
            "Residual orthogonality to the entire column space does not require unique coefficients.",
            "Dependent columns make the normal equations invalid.",
            "The normal equations require A itself to be square and invertible.",
        ),
        63: (
            "Negation preserves squared error but reverses which side of the fitted value a signed residual describes.",
            "Residual sign changes the squared error.",
            "Residual convention has no effect on interpreting signed components.",
        ),
        64: (
            "No: squaring and absolute values define different losses and can prefer different fits.",
            "Yes: every increasing loss has the same minimizing fit.",
            "Yes: taking square roots of individual squared errors preserves their total minimizer.",
        ),
        65: (
            "Squaring weights large discrepancies disproportionately in the total loss.",
            "Large residuals receive smaller weights because they are squared.",
            "Any influence from a large residual means arithmetic was performed incorrectly.",
        ),
        66: (
            "Q gives orthonormal column-space directions; triangular R reconstructs the original columns from them.",
            "Q stores the residual and R stores the fitted observations.",
            "Q must be square and R must be an orthogonal matrix.",
        ),
        67: (
            "The projection is b and the residual is zero.",
            "The projection is zero and the residual is b.",
            "The projection is b/2 and the residual is b/2.",
        ),
        68: (
            "The projection is zero and the residual is b.",
            "The projection is b because b is already perpendicular.",
            "The projection is any nonzero vector in the subspace.",
        ),
    },
    "eigenvalues": {
        2: (
            "Zero identifies no direction, while eigenvalue zero describes a nonzero vector sent to zero.",
            "Zero cannot be either an eigenvector or an eigenvalue.",
            "Zero is an eigenvector only when the matrix is invertible.",
        ),
        30: (
            "Matching columns satisfy their eigenvalue equations; independence makes P invertible for a coordinate change.",
            "The equation holds in any ordering and P need not be invertible.",
            "P is invertible whenever its columns are nonzero, even if dependent.",
        ),
        44: (
            "Every nonzero real direction turns perpendicular, so it cannot return as a real multiple of itself.",
            "The rotation has eigenvalue zero because it sends every vector to zero.",
            "Every real square matrix must have a real eigenvector.",
        ),
        51: (
            "A nonzero null vector gives eigenvalue zero; the zero vector itself distinguishes no direction.",
            "The zero vector has one unique eigenvalue.",
            "An eigenvalue must always be positive.",
        ),
        54: (
            "The associated nonzero eigenvector lies in the kernel, preventing invertibility.",
            "Zero eigenvalues imply all entries of the matrix are zero.",
            "An invertible matrix must have only positive eigenvalues.",
        ),
        57: (
            "An eigenspace is a null space and contains zero; eigenvectors are its nonzero members.",
            "Zero is omitted from an eigenspace just as it is from eigenvectors.",
            "Zero is included only for eigenvalue zero.",
        ),
        60: (
            "Each diagonal entry must match its eigenvector column; mismatching them generally reconstructs another matrix.",
            "The ordering never affects P D P inverse.",
            "Only the numerical order of eigenvalues matters, regardless of column order.",
        ),
        61: (
            "It rules out only that direction; other directions can satisfy eigenvector equations.",
            "Every input is an eigenvector or no input is.",
            "A single failed direction implies the determinant is nonzero.",
        ),
    },
    "svd": {
        2: (
            "Reflections are allowed; orthonormal columns and length preservation are required.",
            "Only rotations are allowed because singular values are nonnegative.",
            "Any invertible factor is orthogonal.",
        ),
        30: (
            "Av is zero; dividing it by sigma would divide by zero.",
            "Av is a unit vector even when sigma is zero.",
            "A zero singular value means its right singular vector is zero.",
        ),
        44: (
            "The theorem optimizes a specified norm and rank constraint; scientific importance requires context.",
            "Every discarded component is scientifically irrelevant by the approximation theorem.",
            "A small singular value proves the associated data were measured incorrectly.",
        ),
        57: (
            "Yes: rank two with three input coordinates leaves nullity one.",
            "No: positive listed singular values rule out every null direction.",
            "No: a rectangular matrix cannot have a null space.",
        ),
        59: (
            "Both have squared positive singular values; differing ambient dimensions allow different zero counts.",
            "They always have the same size and the same number of zeros.",
            "One product contains negative eigenvalues while the other contains positive ones.",
        ),
        60: (
            "Eigenvalues can encode reversal; singular values are lengths, with reversals in orthogonal factors.",
            "Negative eigenvalues force negative singular values.",
            "A matrix with a negative eigenvalue cannot have a real SVD.",
        ),
        61: (
            "No: equal-stretch directions can be changed consistently within their subspaces.",
            "Yes: repeated singular values force unique orthogonal directions.",
            "Yes: the nonnegative singular values uniquely determine U and V.",
        ),
        62: (
            "Av is zero, so division by zero is undefined; complete the remaining output basis separately.",
            "A zero singular value always yields the zero left singular vector.",
            "Divide by any small nonzero value to obtain an exact singular vector.",
        ),
        64: (
            "The norm is the square root of the sum of squares: sqrt(9+16)=5.",
            "The norm is the sum of magnitudes: 3+4=7.",
            "The norm is the sum of squares without a square root: 25.",
        ),
        65: (
            "No: optimal matrix error under a rank limit does not establish task relevance or causality.",
            "Yes: discarded features cannot contain useful information.",
            "Yes: minimizing any matrix norm guarantees best prediction for every task.",
        ),
        66: (
            "Yes: identity U,V and zero rectangular Sigma reconstruct a zero matrix.",
            "No: SVD requires at least one strictly positive singular value.",
            "Yes: take U and V themselves to be zero matrices.",
        ),
        67: (
            "The approximation is zero; its error is the Frobenius norm of the original matrix.",
            "The approximation is unchanged; its error is zero.",
            "The approximation is identity; its error is the largest singular value.",
        ),
        68: (
            "Reflections also preserve lengths and angles and have orthonormal columns.",
            "Reflections cannot have orthonormal columns.",
            "Every orthogonal matrix has determinant positive one.",
        ),
        69: (
            "Yes: an SVD uses separate orthonormal input and output bases and exists for every real matrix.",
            "No: a real eigenbasis is required to construct any real SVD.",
            "Yes: an SVD makes every real matrix diagonalizable using the same basis.",
        ),
        70: (
            "Numerical rank treats sufficiently small computed values as zero; exact rank counts every exactly positive value.",
            "A chosen tolerance changes the exact algebraic dependence of the original columns.",
            "Every small positive singular value is exactly zero by definition.",
        ),
        71: (
            "No: with more rows than columns, full column rank still leaves a proper image in output space.",
            "Yes: full column rank always means every output direction is reachable.",
            "Yes: orthogonal U forces Sigma to reach every output direction.",
        ),
        72: (
            "An SVD also requires orthogonal U,V and nonnegative diagonal Sigma; multiplication alone is insufficient.",
            "Any three factors multiplying to A are an SVD.",
            "Orthogonality is only a numerical convenience and not part of the definition.",
        ),
    },
}
for lesson, items in CHOICES.items():
    for n, options in items.items():
        key = f"linear-algebra-{lesson}-{n}"
        if key in EXISTING or key in ENTRIES:
            continue
        t = Task(key)
        t.select("Select the complete answer", *options)
        t.finish(
            "The original short explanation is deliberately assessed through recognition of a complete reason; no numerical or construction production requirement is removed."
        )
for n in range(37, 43):
    t = task("span", n)
    t.select(
        "Subspace decision and reason",
        "No: the nonzero offset excludes the zero vector.",
        "Yes: every linear-looking equation defines a subspace.",
        "Yes: containing some nonzero vectors is sufficient.",
    )
    t.finish()


# Complete solution families retain the same fields even for inconsistent systems.
def solution(t, a, b, free=False):
    inconsistent = len(a[0]) in rref([row + [b[i]] for i, row in enumerate(a)])[1]
    if inconsistent:
        i = t.field(
            "Particular solution, or none if inconsistent",
            "term",
            {"accepted": ["none"]},
            "none",
            "(0,0)",
            kind="math",
        )
        j = t.field(
            "Homogeneous directions, one per row; {} if none or inconsistent",
            "term",
            {"accepted": ["{}"]},
            "{}",
            "1,0",
            kind="math",
        )
        t.reqs = t.reqs[:-2] + [
            {
                "id": "family",
                "description": "The full solution set is correctly identified.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "affine-family", "a": ms(a), "b": vs(b)},
            }
        ]
    else:
        t.affine(a, b)
        t.inputs[-2]["label"] = "Particular solution, or none if inconsistent"
        t.inputs[-1]["label"] = (
            "Homogeneous directions, one per row; {} if none or inconsistent"
        )
    if free:
        _, p = rref(a)
        indices = [j + 1 for j in range(len(a[0])) if j not in p]
        field = t.tuple(
            "Indices of free variables in your parameterization (x1=1, x2=2, …)",
            indices,
            False,
        )
        t.reqs.pop()
        t.reqs[-1]["fields"].append(field)
        t.reqs[-1]["params"]["freeVariables"] = True


for v in VERIFY:
    key = keyof(v)
    if key in ENTRIES or key in EXISTING:
        continue
    family = canon(v["lesson"]).removeprefix("linear-algebra-")
    n = v["id"]
    k = v["kind"]
    t = Task(key)
    if family == "span" and k == "combination":
        if n <= 8:
            assert vs(mv(tr(v["vectors"]), v["coefficients"])) == vs(v["expected"])
            t.tuple("Coefficients in the supplied order", v["coefficients"])
            z = v["expected"][2]
            t.witness(
                [
                    "Third coordinate of an unreachable target (keep the first two coordinates)"
                ],
                [z + 1],
                [("a", "!=", str(z))],
                alternate=[z - 1],
            )
        else:
            a = tr(v["vectors"])
            co = v["coefficients"]
            conds = [
                ("+".join(f"({x})*{name}" for x, name in zip(row, "abc")), "=", "0")
                for row in a
            ] + [("a*a+b*b+c*c", ">", "0")]
            t.witness(
                ["Coefficient of u", "Coefficient of v", "Coefficient of w"],
                co,
                conds,
                alternate=scale(3, co),
            )
            accepted = [name for name, x in zip(["u", "v", "w"], co) if x]
            t.field(
                "One redundant vector (u, v, or w)",
                "term",
                {"accepted": accepted},
                accepted[0],
                "none",
                kind="text",
            )
    elif family == "bases" and k == "combination":
        assert vs(mv(tr(v["vectors"]), v["coefficients"])) == vs(v["expected"])
        t.tuple("Coordinates in the ordered basis", v["coefficients"])
        t.tuple("Reconstructed standard vector", v["expected"])
    elif family == "systems" and k in ["classification", "affine-family"]:
        a, b = v["a"], v["b"]
        solution(t, a, b, free=(43 <= n <= 48))
        if 31 <= n <= 36:
            t.num("Right side after row 2 minus twice row 1", b[1] - 2 * b[0])
            t.select(
                "Classification",
                "Infinitely many solutions" if v["consistent"] else "No solution",
                "No solution" if v["consistent"] else "Infinitely many solutions",
                "Exactly one solution",
                shift=False,
            )
        elif 37 <= n <= 42:
            rank = len(rref(a)[1])
            consistent = len(a[0]) not in rref([r + [b[i]] for i, r in enumerate(a)])[1]
            t.select(
                "Division or exceptional case",
                "The remaining y coefficient is nonzero, so division is legal."
                if rank == 2
                else "The remaining equation is 0=0, so one parameter is free."
                if consistent
                else "The remaining equation is 0 equal to a nonzero constant, so no solution exists.",
                "Every y coefficient, including zero, permits division.",
                "A zero y coefficient always implies exactly one solution.",
            )
        elif n >= 51:
            d = null(a)[0]
            t.witness(
                [f"Nontrivial solution: coordinate {j + 1}" for j in range(len(d))],
                d,
                [
                    ("+".join(f"({x})*{name}" for x, name in zip(row, "abc")), "=", "0")
                    for row in a
                ]
                + [("a*a+b*b+c*c", ">", "0")],
                alternate=scale(2, d),
            )
            t.select(
                "Why is this the complete family?",
                "All independent free coordinates may vary, and the equations determine the remaining coordinates.",
                "Substitution of one example proves no other solutions exist.",
                "Using one shared parameter for every free coordinate captures all solutions.",
            )
    else:
        continue
    t.finish()

for n in [30, 49]:
    t = task("systems", n)
    if n == 30:
        solution(t, [[1, 2], [2, 4]], [4, 8], True)
    else:
        solution(t, [[1, 1]], [0])
        t.witness(
            ["First coordinate of a nontrivial solution", "Second coordinate"],
            [-1, 1],
            [("a+b", "=", "0"), ("a*a+b*b", ">", "0")],
            alternate=[2, -2],
        )
        reason(
            t,
            "Zero solves every homogeneous system because multiplying zero inputs gives zero output.",
            "Homogeneity requires every solution to be nonzero.",
            "The zero vector is omitted whenever nontrivial solutions exist.",
        )
    t.finish()

for lesson, n in [("span", 69), ("span", 71), ("bases", 68), ("transformations", 64)]:
    t = task(lesson, n)
    if n == 69:
        i = t.matrix("Original vectors, one per row", [[1, 0], [2, 0], [0, 1]])
        j = t.num("Index of the vector to delete (first row is 1)", 3)
        t.reqs = [
            {
                "id": "witness",
                "description": "The dependent list loses span after the specified deletion.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "dependent-list-deletion"},
            }
        ]
        t.wrong[i] = "1,0;0,1;1,1"
        t.alt = {i: "1,1;2,2;1,-1", j: "3"}
    elif n == 71 or lesson == "bases":
        i = t.matrix("Independent vectors, one per row", [[1, 0]])
        j = t.num("Ambient coordinate-space dimension n (the space is R^n)", 2)
        t.reqs = [
            {
                "id": "witness",
                "description": "The list is independent but spans a proper subspace of the named ambient space.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "proper-independent"},
            }
        ]
        t.wrong[i] = "0,0"
        t.alt = {i: "1,0,0;0,1,0", j: "3"}
    else:
        i = t.matrix("Matrix of the linear map", [[1, 0], [0, 0]])
        j = t.matrix(
            "Basis for the lost input directions, one vector per row", [[0, 1]]
        )
        t.reqs = [
            {
                "id": "witness",
                "description": "The nontrivial kernel is described completely.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "information-loss"},
            }
        ]
        t.wrong[i] = "1,0;0,1"
        t.alt = {i: "1,0,0", j: "0,1,0;0,0,1"}
    t.finish()

for n in [1, 16, 29, 30]:
    t = task("projections", n)
    vv = tuples(t.q["prompt"])
    if n == 1:
        b, u = vv
        c = dot(b, u) / dot(u, u)
        p = scale(c, u)
        r = add(b, scale(-1, p))
        t.tuple("Projection", p)
        t.tuple("Residual", r)
        t.num("Residual dot u", dot(r, u))
    elif n == 16:
        q = tr([vv[0]])
        t.matrix("Q transpose Q", mm(tr(q), q))
        t.matrix("Q Q transpose", mm(q, tr(q)))
        reason(
            t,
            "The first product records a unit-column dot product; the second projects onto a proper line.",
            "A matrix and its transpose always commute.",
            "Both products must have the same dimensions.",
        )
    elif n == 29:
        b = list(
            map(int, re.search(r"observations ([\d,]+)", t.q["prompt"])[1].split(","))
        )
        c = F(sum(b), len(b))
        t.num("Best constant c", c)
        t.tuple("Fitted output", [c] * len(b))
        t.tuple("Residual", add(b, [-c] * len(b)))
    else:
        u, b = vv
        c = dot(u, b) / dot(u, u)
        t.num("Coefficient", c)
        t.tuple("Fitted output", scale(c, u))
    t.finish()

for n in [1, 29, *range(31, 37), 43]:
    t = task("eigenvalues", n)
    p = t.q["prompt"]
    if n == 1:
        t.num("Eigenvalue for (1,0)", 2)
        t.num("Eigenvalue for (0,1)", -1)
        t.field(
            "Eigenvalue for (1,1), or none",
            "term",
            {"accepted": ["none", "not an eigenvector"]},
            "none",
            "0",
            kind="text",
        )
    elif n == 29:
        t.tuple("Coordinates in the eigenbasis (u,v)", [2**3, -2 * 3**3])
    elif 31 <= n <= 36:
        a, b, k, c, d = map(
            int,
            re.search(
                r"Au=(-?\d+)u and Av=(-?\d+)v.*applied (\d+) times to (-?\d+)u\+\((-?\d+)\)v",
                p,
            ).groups(),
        )
        t.tuple("Coordinates in the eigenbasis (u,v)", [c * a**k, d * b**k])
        reason(
            t,
            "Each eigenbasis coefficient is multiplied by its eigenvalue once per application.",
            "Each coordinate is multiplied by the eigenvalue only once regardless of the number of steps.",
            "The calculation assumes the given eigenbasis is the standard basis.",
        )
    elif n == 43:
        a = tuples(p)
        t.basis("Basis of the eigenspace for eigenvalue one", [[0, 1], [0, 0]], "null")
        reason(
            t,
            "All eigenvectors lie on one line, so they cannot form a basis of the plane.",
            "A repeated eigenvalue always prevents diagonalization, even for identity matrices.",
            "Every nonzero vector is an eigenvector, so a basis exists.",
        )
    t.finish()

for n in [1, *range(3, 16), 29, 43, *range(51, 57), 63]:
    t = task("svd", n)
    p = t.q["prompt"]
    if n == 1 or 3 <= n <= 8:
        m, q = (
            (3, 2)
            if n == 1
            else map(int, re.search(r"(\d+)-by-(\d+) matrix", p).groups())
        )
        t.tuple("Shape of U (rows, columns)", [m, m])
        t.tuple("Shape of Sigma (rows, columns)", [m, q])
        t.tuple("Shape of V (rows, columns)", [q, q])
        if n == 1:
            t.select(
                "Factor carrying the length scale factors",
                "Sigma",
                "U",
                "V",
                shift=False,
            )
        else:
            t.tuple("Shape of V transpose (rows, columns)", [q, q])
            t.num("Number of diagonal positions in Sigma", min(m, q))
            t.num("Number of columns of full U", m)
            t.num("Number of columns of full V", q)
    elif 9 <= n <= 14:
        a, b = map(int, re.search(r"singular values (\d+),(\d+)", p).groups())
        t.num("Greatest output length for unit inputs", max(a, b))
        t.num("Least output length for unit inputs", min(a, b))
        reason(
            t,
            "U and V preserve lengths; Sigma produces the stretches.",
            "U causes the greatest stretch while V causes the least stretch.",
            "Orthogonal factors can independently change vector lengths.",
        )
    elif n == 15:
        t.matrix("U Sigma V transpose", [[0, 3], [1, 0]])
        t.tuple("Output on (2,4)", [12, 2])
    elif n == 29:
        vals = list(map(int, re.search(r"singular values ([\d,]+)", p)[1].split(",")))
        t.num("Rank", sum(x > 0 for x in vals))
        t.num("Nullity", len(vals) - sum(x > 0 for x in vals))
        t.tuple("Eigenvalues of A transpose A", [x * x for x in vals], False)
    elif n == 43:
        vals = list(map(int, re.search(r"entries ([\d,]+)", p)[1].split(",")))
        a = [[vals[i] if i == j else 0 for j in range(3)] for i in range(3)]
        sq = sum(x * x for x in vals[1:])
        t.linear(
            "One rank-one approximation",
            {"kind": "best-rank", "a": ms(a), "rank": 1, "errorSquared": str(sq)},
            mat([[vals[0], 0, 0], [0, 0, 0], [0, 0, 0]]),
            mat(a),
        )
        t.num("Exact Frobenius error", f"sqrt({sq})")
    elif 51 <= n <= 56:
        denom = int(re.search(r"entries one and 1/(\d+)", p)[1])
        t.num("Change in the recovered second component", 1)
        t.num("Inverse amplification in that direction", denom)
        reason(
            t,
            "The weak singular direction amplifies output changes by the reciprocal singular value.",
            "The recovered component changes by the singular value times the output change.",
            "Every invertible direction has amplification one.",
        )
    else:
        t.num("Truncation error", 0)
    t.finish()

for v in VERIFY:
    key = keyof(v)
    if key in ENTRIES or key in EXISTING:
        continue
    n = v["id"]
    f = canon(v["lesson"]).removeprefix("linear-algebra-")
    t = Task(key)
    if f == "dot-products" and 9 <= n <= 14:
        u, vv = v["a"], v["b"]
        t.num("Direct dot product u dot (u+v)", dot(u, add(u, vv)))
        t.num("First distributed term u dot u", dot(u, u))
        t.num("Second distributed term u dot v", dot(u, vv))
        t.num("Sum of distributed terms", dot(u, u) + dot(u, vv))
    elif f == "bases" and 29 <= n <= 34:
        a = v["a"]
        t.matrix("Reduced row echelon form", rref(a)[0])
        t.basis("Column-space basis from original columns", a, "column", True)
        reason(
            t,
            "Row reduction preserves dependence relations but changes the actual column vectors and their span.",
            "Row reduction preserves every original column vector.",
            "Any nonzero vector is a basis for every one-dimensional column space.",
        )
    elif f == "projections" and v["kind"] == "gram-schmidt":
        first, second = v["a"]
        remainder = add(second, scale(-dot(first, second) / dot(first, first), first))
        sq = dot(remainder, remainder)
        t.field(
            "Ordered orthonormal vectors, one per row",
            "matrix",
            {"expected": [vs(first), [f"{x}/sqrt({sq})" for x in remainder]]},
            mat([vs(first), [f"{x}/sqrt({sq})" for x in remainder]]),
            mat([vs(first), vs(second)]),
        )
        t.tuple(
            "Coefficients reconstructing the original second vector from the orthonormal pair",
            [str(dot(first, second)), f"sqrt({sq})"],
        )
        reason(
            t,
            "The nonzero perpendicular remainder adds the same second direction, and reconstruction recovers the original vector.",
            "Subtracting a projection always changes the spanned subspace.",
            "Normalizing a vector removes its direction from the span.",
        )
    elif f == "projections" and 37 <= n <= 42:
        a, b = v["a"], v["b"]
        ata = mm(tr(a), a)
        atb = mv(tr(a), b)
        t.matrix(
            "Augmented normal equations in order c,d",
            [r + [atb[i]] for i, r in enumerate(ata)],
        )
        t.tuple("Least-squares coefficients (c,d)", v["x"])
        t.tuple("Fitted output", mv(a, v["x"]))
    else:
        continue
    t.finish()

for n, prop, u, v, altu, altv in [
    (53, "positive-nonacute", [1, 0], [1, 0], [1, 2, 3], [2, 4, 6]),
    (54, "unequal-cosine-one", [1, 0], [2, 0], [1, 2], [3, 6]),
    (71, "unequal-equal-norm", [1, 0], [0, 1], [1, 2], [-1, -2]),
]:
    t = task("dot-products", n)
    i = t.tuple("First vector", u)
    j = t.tuple("Second vector", v)
    t.reqs = [
        {
            "id": "witness",
            "description": "The vectors give the requested counterexample.",
            "validator": "linear",
            "fields": [i, j],
            "params": {"kind": "vector-pair", "property": prop},
        }
    ]
    t.alt = {i: vec(altu), j: vec(altv)}
    t.wrong[i] = vec([0] * len(u))
    if n == 54:
        reason(
            t,
            "Positive parallel vectors can have different lengths while their cosine is one.",
            "Cosine one requires corresponding vector entries to be equal.",
            "Cosine one occurs only for perpendicular vectors.",
        )
    if n == 71:
        reason(
            t,
            "Norm determines length, while unequal directions can share that length.",
            "Equal norms force all corresponding components to agree.",
            "Norm measures only direction and ignores length.",
        )
    t.finish()

t = task("systems", 10)
t.witness(
    ["Coefficient a in the example equation ax=b", "Right side b"],
    [1, 1],
    [("a", "!=", "0")],
    alternate=[2, 3],
)
reason(
    t,
    "Multiplying by zero erases the restriction and cannot be reversed.",
    "Multiplying by zero preserves the unique solution because zero equals zero.",
    "Only the right side changes when a row is multiplied by zero.",
)
t.finish(prompt=t.q["prompt"] + " Enter a one-variable example as ax=b.")
t = task("systems", 62)
t.linear(
    "Counterexample augmented matrix (last column is the right side)",
    {"kind": "zero-row-not-infinite"},
    "1,0,1;0,1,2;0,0,0",
    "1,0,1;0,0,0",
    "0,1;0,0",
)
t.finish()

for n in [30, 46]:
    t = task("span", n)
    if n == 30:
        t.witness(
            [
                "First coordinate of a vector in the set",
                "Second coordinate",
                "Scalar multiplier",
            ],
            [1, 0, -1],
            [("a", ">=", "0"), ("a*c", "<", "0")],
            alternate=[2, 5, -2],
        )
        t.boolean("A subspace", False)
    else:
        i = t.tuple("Vector with nonnegative coordinates", [1, 0])
        j = t.num("Scalar multiplier", -1)
        t.reqs = [
            {
                "id": "counterexample",
                "description": "A vector in the set has a scalar multiple outside the set.",
                "validator": "linear",
                "fields": [i, j],
                "params": {"kind": "nonnegative-closure"},
            }
        ]
        t.alt = {i: "(0,2,0)", j: "-3"}
        t.wrong[i] = "(0,0)"
    t.finish()

t = task("projections", 15)
t.tuple("First normalized vector", [1, 0])
t.tuple("Second vector after subtracting its projection", [0, 1])
t.tuple("Second normalized vector", [0, 1])
t.finish()

for n, prop, good, bad, alt in [
    (55, "repeated-diagonalizable", "2,0;0,2", "1,1;0,1", "0,0;0,0"),
    (56, "no-real-eigenvalue", "0,-1;1,0", "1,0;0,1", "1,-2;2,1"),
    (59, "nonorthogonal-eigenbasis", "2,1;0,3", "2,0;0,3", "1,0;0,1"),
    (62, "unit-spectrum-not-identity", "1,1;0,1", "1,0;0,1", "2,1;-1,0"),
]:
    t = task("eigenvalues", n)
    t.linear(
        "A two-by-two counterexample matrix",
        {"kind": "spectral-example", "property": prop},
        good,
        bad,
        alt,
    )
    prompt = (
        t.q["prompt"] + " Give a two-by-two example."
        if n != 59
        else "Must an independent eigenbasis of a diagonalizable real matrix be orthogonal? Give a two-by-two counterexample."
    )
    t.finish(
        "The construction remains typed matrix production; the general request is explicitly bounded to two-by-two examples, sufficient to refute the claim.",
        prompt=prompt,
    )
    NOTES[t.key]["evidenceChange"] = (
        "Matrix production preserved; construction explicitly bounded to 2×2 counterexamples."
    )

for n in range(45, 51):
    t = task("eigenvalues", n)
    p = t.q["prompt"]
    a, b, c, d = map(
        F,
        re.search(
            r"scale factors ([\d.-]+),([\d.-]+)\. The initial input is ([\d.-]+)u\+\(([\d.-]+)\)v",
            p,
        ).groups(),
    )
    for name, co, base in [("u", c, a), ("v", d, b)]:
        expected = "0" if not co or not base else f"({co})*({base})^k"
        t.field(
            "Coefficient of " + name + " after k positive integer steps",
            "expression",
            {
                "variables": ["k"],
                "integerVariables": ["k"],
                "positiveVariables": ["k"],
                "expected": expected,
            },
            expected,
            expected + "+1",
            "0" if not co or not base else None,
        )
    if abs(a) == abs(b):
        conclusion = "The magnitudes tie, so neither direction has a strictly larger eigenvalue magnitude."
    elif (c if abs(a) > abs(b) else d) == 0:
        conclusion = "No: the largest-magnitude direction is absent and its coefficient remains zero."
    else:
        conclusion = "Yes asymptotically: the larger-magnitude direction is present, so its ratio to the other grows."
    t.select(
        "Dominance for this initial input",
        conclusion,
        *[
            x
            for x in [
                "The magnitudes tie, so neither direction has a strictly larger eigenvalue magnitude.",
                "No: the largest-magnitude direction is absent and its coefficient remains zero.",
                "Yes asymptotically: the larger-magnitude direction is present, so its ratio to the other grows.",
            ]
            if x != conclusion
        ],
    )
    t.finish()


for v in VERIFY:
    key = keyof(v)
    if canon(v["lesson"]) != "linear-algebra-eigenvalues" or not 11 <= v["id"] <= 22:
        continue
    t = Task(key)
    a = v["a"]
    roots = v["values"]
    pairs = [[value] + vector for value, vector in zip(roots, v["vectors"])]
    if v["id"] <= 16:
        trace = a[0][0] + a[1][1]
        det = a[0][0] * a[1][1] - a[0][1] * a[1][0]
        poly = f"lambda^2-({trace})*lambda+({det})"
        t.field(
            "Characteristic polynomial det(A − lambda I)",
            "expression",
            {"variables": ["lambda"], "expected": poly},
            poly,
            poly + "+1",
        )
    field = t.matrix(
        "Eigenpairs: one row per eigenvalue, followed by a nonzero eigenvector’s coordinates",
        pairs,
    )
    t.reqs.pop()
    params = {"kind": "eigenpairs", "a": ms(a), "eigenvalues": vs(roots)}
    fields = [field]
    t.wrong[field] = mat([[roots[0]] + [0, 0], pairs[1]])
    t.alt[field] = mat(
        [
            [value] + scale(-2, vector)
            for value, vector in reversed(list(zip(roots, v["vectors"])))
        ]
    )
    if v["id"] <= 16:
        residual = t.matrix(
            "Direct checks: Av − lambda v, one row per eigenpair in the same order",
            [[0, 0], [0, 0]],
        )
        t.reqs.pop()
        fields.append(residual)
        params["checks"] = True
    else:
        params["orthogonal"] = True
        t.num("Dot product of your eigenvectors", 0)
        reason(
            t,
            "The displayed eigenvector directions have zero dot product and so are perpendicular.",
            "Distinct eigenvectors of every real matrix are always perpendicular.",
            "Eigenvectors are perpendicular only when their eigenvalues have equal magnitude.",
        )
    t.reqs.append(
        {
            "id": "eigenpairs",
            "description": "Every eigenvalue and a valid nonzero eigenvector are supplied, with the requested checks.",
            "validator": "linear",
            "fields": fields,
            "params": params,
        }
    )
    t.finish()


# Nonunique accepted alternatives tied to the actual published numerical cases.
for key, approx in [
    ("linear-algebra-svd-47", [[2, 2, 0], [2, 2, 0], [0, 0, 0]]),
    ("linear-algebra-svd-50", [[0, 0, 0], [0, 0, 0], [0, 0, 2]]),
]:
    entry = ENTRIES[key]
    entry["fixtures"].append(
        {
            "response": {**entry["fixtures"][0]["response"], "answer-1": mat(approx)},
            "verdict": "correct",
        }
    )
entry = ENTRIES["linear-algebra-svd-28"]
entry["fixtures"].append(
    {
        "response": {
            **entry["fixtures"][0]["response"],
            "answer-1": "3/5,-4/5;4/5,3/5",
            "answer-3": "3/5,-4/5;4/5,3/5",
        },
        "verdict": "correct",
    }
)
for entry in ENTRIES.values():
    good = entry["fixtures"][0]["response"]
    for requirement in entry["assessment"]["requirements"]:
        # Independently falsify each decision; multi-requirement exercises must not
        # accidentally accept a correct numerical part with the wrong reason.
        field = requirement["fields"][0]
        if requirement["validator"] == "selection":
            control = next(i for i in entry["assessment"]["inputs"] if i["id"] == field)
            wrong = next(
                o["id"]
                for o in control["options"]
                if o["id"] not in requirement["params"]["expected"]
            )
            entry["fixtures"].append(
                {"response": {**good, field: wrong}, "verdict": "incorrect"}
            )
        elif requirement["validator"] == "matrix" and any(
            i["kind"] == "grid" and i["id"] == requirement["id"]
            for i in entry["assessment"]["inputs"]
        ):
            for field in requirement["fields"]:
                entry["fixtures"].append(
                    {
                        "response": {**good, field: "(" + good[field] + ")+1"},
                        "verdict": "incorrect",
                    }
                )
        elif requirement["validator"] == "boolean":
            entry["fixtures"].append(
                {"response": {**good, field: not good[field]}, "verdict": "incorrect"}
            )

# Explicit process requirements stay open; no hybrid grading or generic stepper.
RETAIN = {}


def retain(lesson, ids, reason):
    for n in ids:
        RETAIN[f"linear-algebra-{lesson}-{n}"] = reason


retain(
    "vectors",
    range(41, 47),
    "The task explicitly assesses deriving coefficients by matching component equations, then reconstruction. A final coefficient list would omit that derivation.",
)
retain(
    "systems",
    [9, *range(11, 23), 29],
    "The task explicitly requires a specified elimination operation, elimination method or back-substitution trace. Grading only the final solution would omit the requested process.",
)
retain(
    "span",
    [44],
    "The task asks for an original argument that a union of two chosen subspaces need not be a subspace, including closure failure. A general subspace-construction interface would add substantial setup.",
)
retain(
    "projections",
    range(31, 37),
    "The task explicitly asks to derive the scalar normal equation, rather than only state fitted values and residuals. That derivation remains part of the single open response.",
)
retain(
    "eigenvalues",
    [9],
    "The task explicitly asks to show how the determinant condition and homogeneous equations are used; preserving that process requires the single open response.",
)


# Additional authored tasks are added below. Every baseline row is recorded,
# including proof/derivation tasks and the previously converted seven matrices.
def write():
    entries = sorted(ENTRIES.values(), key=lambda e: (e["lesson"], e["id"]))
    (ROOT / "content/deterministic-linear.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n"
    )
    ledger = []
    for key, row in AUDIT.items():
        e = ENTRIES.get(key) or EXISTING.get(key)
        method = (
            "deterministic"
            if e or key in EXISTING
            else "choice"
            if row["category"] == "existing-choice"
            else "pending"
        )
        record = {
            "key": key,
            "originalHash": row["questionHash"],
            "finalMethod": method,
            "minimalOutputs": [i["label"] for i in e["assessment"]["inputs"]]
            if e
            else row["requirements"],
            "input": [i["kind"] for i in e["assessment"]["inputs"]]
            if e
            else row["inputFamily"],
            "validator": sorted(
                set(r["validator"] for r in e["assessment"]["requirements"])
            )
            if e
            else [],
            "sourceInspection": "docs/deterministic-linear-source-inspection.md",
            **NOTES.get(key, {}),
        }
        if method == "pending" and (
            key in RETAIN or row["category"] in ["open", "mixed"]
        ):
            record["finalMethod"] = "open"
            record["retainOpenReason"] = (
                RETAIN.get(key)
                or "The task assesses an authored general proof or closure argument, rather than finite outputs: "
                + row["publishedQuestion"]["prompt"]
            )
        ledger.append(record)
    (ROOT / "docs/deterministic-linear-dispositions.json").write_text(
        json.dumps(ledger, ensure_ascii=False, indent=2) + "\n"
    )
    assert not any(x["finalMethod"] == "pending" for x in ledger), (
        "Every LA item requires an explicit disposition."
    )
    from collections import Counter

    print(
        len(entries),
        "new assessments;",
        dict(Counter(x["finalMethod"] for x in ledger)),
    )


if __name__ == "__main__":
    write()
