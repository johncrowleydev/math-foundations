"""Generate independent mathematical oracles; never import a grading implementation.

Run python3 scripts/authoring/deterministic-adversarial.py, then Prettier on the JSON.
The same materialized cases are consumed by TypeScript and Go.
"""
import itertools
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
definitions = {}
cases = []


def define(name, validator, params, fields=None, inputs=None):
    fields = fields or ["answer"]
    definitions[name] = {
        "version": 1,
        "inputs": inputs or [{"id": f, "kind": "math", "label": f} for f in fields],
        "requirements": [{"id": "result", "description": "Satisfy the stated mathematical condition", "validator": validator, "fields": fields, "params": params}],
        "feedback": {"correct": "Correct.", "incorrect": "Check the mathematical condition."},
        "evidence": {"level": "production", "interactionCost": "low", "inputCapabilities": ["math-text"]},
    }
    return name


def add(d, name, response, outcome="correct"):
    cases.append({"name": f"{d}: {name}", "definition": d, "response": {"answer": response} if isinstance(response, str) else response, "outcome": outcome})


def scalar(d, validator, params, good, wrong, malformed="@"):
    define(d, validator, params)
    for i, s in enumerate(good): add(d, f"equivalent {i}", s)
    for i, s in enumerate(wrong): add(d, f"counterexample {i}", s, "incorrect")
    add(d, "unsupported input", malformed, "input-error")


scalar("exact", "exact", {"expected": ["-7/12"]}, [" ( -14 ) / (24) ", "−7÷12", "7/(-12)", "-0.5-1/12"], ["7/12", "-7/11", "0"], "1/0")
scalar("tuple", "tuple", {"expected": ["-2", "3/4", "0"]}, ["(-2,6/8,-0)", "[-2,0.75,0]"], ["0,3/4,-2", "-2,3/4", "-2,3/4,1"], "-2,3/4,1/0")
scalar("unordered-tuple", "tuple", {"expected": ["1", "1", "2"], "ordered": False}, ["(2,1,1)"], ["(2,2,1)"])
scalar("matrix", "matrix", {"expected": [["1", "-2", "3/2"], ["0", "4", "-1"]]}, ["[1,-2,1.5;0,4,-1]", "\\begin{bmatrix}1&-2&3/2\\\\0&4&-1\\end{bmatrix}"], ["1,0;-2,4;3/2,-1", "1,-2,3/2;0,4,1"], "1,2;3")
scalar("term", "term", {"accepted": ["linearly independent"]}, ["  LINEARLY   independent\t"], ["independent", "linearly independent extra"], " ")
define("boolean", "boolean", {"expected": [False]}, inputs=[{"id": "answer", "kind": "boolean", "label": "answer"}])
for x, o in [(False, "correct"), (True, "incorrect"), ("false", "input-error"), (None, "input-error")]: add("boolean", str(x), {"answer": x}, o)
define("selection", "selection", {"expected": ["a", "c"]}, inputs=[{"id": "answer", "kind": "multiselect", "label": "answer", "options": [{"id": x, "label": x} for x in "abc"]}])
for xs, o in [(["c", "a"], "correct"), (["a"], "incorrect"), ([], "incorrect"), (["a", "c", "c"], "input-error"), (["a", "d"], "input-error")]: add("selection", str(xs), {"answer": xs}, o)
scalar("logic", "boolean-formula", {"variables": ["p", "q"], "expected": "p -> q"}, ["!q -> !p", "¬p ∨ q"], ["q -> p", "p & q"])
for s in ["not p or q", "NOT p OR q", "p ⇒ q", "p \\Rightarrow q", "!p \\, or q"]: add("logic", "server supported " + s, s)
for s in ["{p -> q)", "(p -> q}", "\\NEG p or q", "p \\LAND q"]: add("logic", "mismatched delimiters " + s, s, "input-error")
scalar("logic-property", "boolean-property", {"variables": ["p", "q"], "property": "tautology"}, ["(p & q) -> p", "p | !p"], ["p & !p", "p -> q"])
define("boolean-model", "boolean-model", {"variables": {"p": "p", "q": "q"}, "conditions": [{"formula": "p -> q", "value": False}]}, ["p", "q"], [{"id": x, "kind": "boolean", "label": x} for x in "pq"])
for p, q in itertools.product([False, True], repeat=2): add("boolean-model", f"truth table {p} {q}", {"p": p, "q": q}, "correct" if p and not q else "incorrect")
add("boolean-model", "wrong type", {"p": True, "q": "false"}, "input-error")
scalar("quantifier", "quantified-formula", {"expected": "forall x in D exists y in D R(x,y)", "domains": ["D"], "predicates": {"R": 2}}, ["forall a in D exists b in D R(a,b)", "not exists a in D forall b in D not R(a,b)"], ["exists b in D forall a in D R(a,b)", "forall a in D exists b in D R(b,a)"], "forall a in D R(a)")
scalar("quantifier-shadow", "quantified-formula", {"expected": "forall x in D (P(x) and exists y in D Q(y))", "domains": ["D"], "predicates": {"P": 1, "Q": 1}}, ["forall a in D (P(a) and exists a in D Q(a))"], ["forall a in D (P(a) and Q(a))"], "forall a in D P(b)")
scalar("set", "set", {"expected": ["1/2", "-2", "3"]}, ["{3,-2,0.5,1/2}", "{ -2, 3, 2/4 }"], ["{3,-2}", "{3,-2,1/2,0}", "{}"], "{1/0}")
scalar("set-expression", "set-expression", {"variables": ["A", "B", "C"], "expected": "A-(B|C)"}, ["A & B' & C'", "(A-B)-C", "A ∩ (B ∪ C)'"], ["A-(B&C)", "(A-B)|C"])
# Exhaust all 2^3 by 2^3 finite pairs: native Python set operations are the oracle.
define("set-model", "set-model", {"variables": {"A": "a", "B": "b"}, "conditions": [{"left": "A", "right": "B", "op": "subset"}, {"left": "B-A", "op": "nonempty"}]}, ["a", "b"])
finite = lambda xs: "{" + ",".join(map(str, xs)) + "}"
sets = [set(i for i in range(3) if bits & (1 << i)) for bits in range(8)]
for i, a in enumerate(sets):
    for j, b in enumerate(sets): add("set-model", f"subset {i} {j}", {"a": finite(sorted(a, reverse=True)), "b": finite(sorted(b))}, "correct" if a < b else "incorrect")
add("set-model", "malformed second field", {"a": "{}", "b": "{"}, "input-error")
scalar("nested-object", "nested-object", {"atoms": ["a", "b", "c"]}, ["((a,b),(c,a))", "(b,(a,b))"], ["(a,(b,c))", "{a,b}"], "((a,b)")
scalar("integer-class", "integer-class", {"modulus": "7", "residue": "3"}, ["{3-7j:j in Z}", "7Z-4", "{n in Z: 7 | n+4}"], ["{3+14j:j in Z}", "{3+7j:j in N}"], "{n in Z: 0 | n}")
scalar("integer-list", "integer-list", {"length": 3, "sum": 0, "distinctResiduesMod": 3}, ["-2,0,2", "1,-1,0"], ["-3,0,3", "-1,0,2", "-1/2,0,1/2"], "0,,0")
scalar("binomial-sum", "binomial-sum", {"terms": [[7, 2], [7, 3]]}, ["binom(7,3)+binom(7,2)", "(choose(7,2)+choose(7,3))"], ["56", "binom(8,3)"], "binom(7,-1)")
scalar("composition", "composition", {"expected": "f^-1 o g^-1", "functions": {"f": ["A", "B"], "g": ["B", "C"]}}, ["(g o f)^(-1)", "f^{-1} ∘ g^{-1}"], ["g^-1 o f^-1", "g o f"], "f^-2")
scalar("indexed-expression", "indexed-expression", {"expected": "b_{n+2}-b_n", "variables": ["n"], "sequences": {"b": 1}}, ["b(2+n)-b(n)", "-b_n+b_{n+2}"], ["b(n+1)-b(n)", "b(n)-b(n+2)"])
scalar("summation", "summation", {"expected": "\\sum_{k=1}^{5}k^2", "variables": [], "sequences": {}}, ["\\sum_{j=1}^{5} j*j"], ["\\sum_{j=0}^{4}j^2", "54", "55"])
scalar("recurrence", "recurrence", {"expected": "2*F(n-1)-F(n-3)+n", "sequence": "F", "variable": "n", "maxLag": 4}, ["n-F(n-3)+F(n-1)+F(n-1)", "2*F_{n-1}-F_{n-3}+n"], ["2*F(n-1)-F(n-2)+n", "2*F(n-1)+F(n-3)+n"], "2*F(n)-F(n-3)+n")
define("sequence-pair", "sequence-pair", {"variable": "n", "kind": "same-recurrence", "increment": "-2"}, ["a", "b"])
for i in range(5):
    add("sequence-pair", f"different constants {i}", {"a": f"-2*n+{i}", "b": f"{i+1}-2*n"})
    add("sequence-pair", f"wrong increment {i}", {"a": f"-2*n+{i}", "b": f"{i+1}-3*n"}, "incorrect")
add("sequence-pair", "malformed second", {"a": "-2*n", "b": "1/0"}, "input-error")
scalar("elementary", "elementary-expression", {"variable": "x", "domain": "real", "expected": "abs(x)"}, ["sqrt(x^2)", "sqrt(4*x^2)/2"], ["x", "-x"], "sqrt(x)")
interval_inputs = [{"id": "domain", "kind": "interval", "label": "domain"}]
interval_fields = ["domain.lower", "domain.upper", "domain.leftClosed", "domain.rightClosed"]
define("interval", "interval", {"lower": "-1/2", "upper": "infinity", "leftClosed": True, "rightClosed": False}, interval_fields, interval_inputs)
interval_response = {"domain.lower": "-0.5", "domain.upper": "+∞", "domain.leftClosed": True, "domain.rightClosed": False}
add("interval", "inclusive endpoint and unicode infinity", interval_response)
add("interval", "excluded endpoint", {**interval_response, "domain.leftClosed": False}, "incorrect")
add("interval", "undefined endpoint", {**interval_response, "domain.lower": "1/0"}, "input-error")
define("square-inverse", "square-inverse", {}, interval_fields+["inverse"], interval_inputs+[{"id": "inverse", "kind": "math", "label": "inverse"}])
inverse = {"domain.lower": "-∞", "domain.upper": "0", "domain.leftClosed": False, "domain.rightClosed": True, "inverse": "-sqrt(y)"}
add("square-inverse", "negative branch", inverse)
add("square-inverse", "wrong branch", {**inverse, "inverse": "sqrt(y)"}, "incorrect")
add("square-inverse", "undefined inverse", {**inverse, "inverse": "1/0"}, "input-error")
scalar("inequality", "inequality", {"expected": "x>=-2 and x<3", "variable": "x"}, ["[-2,3)", "-x<=2 and 2*x<6", "not (x<-2 or x>=3)"], ["(-2,3)", "[-2,3]", "x>-2 and x<3"], "x/x=1")
define("witness", "witness", {"variables": [{"name": "n", "field": "answer", "integer": True}], "conditions": [{"left": "n", "op": "divides", "right": "12"}, {"left": "n", "op": "<", "right": "0"}]})
for n in range(-8, 5): add("witness", f"divisor {n}", str(n), "correct" if n < 0 and 12 % n == 0 else "incorrect")
add("witness", "noninteger", "-3/2", "incorrect")
add("witness", "nonfinite", "Infinity", "input-error")
# Polynomial products and derivatives use coefficient arithmetic, independent of both parsers.
for a in [-3, -1, 2, 5]:
    for b in [-2, 0, 3]:
        d = define(f"polynomial-{a}-{b}", "expression", {"variables": ["x"], "expected": f"{a}*x^2+{b-a}*x-({b})"})
        add(d, "factored", f"(x-1)*({a}*x+{b})")
        add(d, "coefficient error", f"(x-1)*({a}*x+{b})+1", "incorrect")
        add(d, "removable singularity", f"((x-1)*({a}*x+{b})*x)/x", "incorrect")
scalar("rational-real-domain", "expression", {"variables": ["x", "y"], "expected": "x"}, ["(x^3+x)/(x^2+1)", "x*(x^2*y^2+2)/(x^2*y^2+2)", "x*(-x^4-3)/(-x^4-3)"], ["x*(x^2-1)/(x^2-1)", "x*(x^2+y^2)/(x^2+y^2)", "x*(x^2+y+2)/(x^2+y+2)"], "x/(x-x)")
scalar("rational-stated-domain", "expression", {"variables": ["x"], "expected": "x+1", "domain": ["x-1"]}, ["(x^2-1)/(x-1)", "(x-1)^2*(x+1)/(x-1)^2"], ["(x+1)*x/x"])
scalar("integer-exponential", "expression", {"variables": ["n"], "integerVariables": ["n"], "expected": "(-2)^(2*n)"}, ["4^n", "2^(n+n)"], ["(-2)^n", "2^n"], "2^(n*n)")
for degree in range(1, 7):
    for coefficient in [-3, 2]:
        d = define(f"derivative-{degree}-{coefficient}", "calculus-expression", {"variables": ["x"], "expected": f"{coefficient*degree}*x^{degree-1}"})
        add(d, "power rule", f"{degree}*({coefficient})*x^{degree-1}")
        add(d, "offset error", f"{degree}*({coefficient})*x^{degree-1}+1", "incorrect")
        d = define(f"primitive-{degree}-{coefficient}", "antiderivative", {"variable": "x", "integrand": f"{coefficient}*x^{degree-1}", "mode": "family"})
        add(d, "integrate coefficient", f"({coefficient}/{degree})*x^{degree}+C+7")
        add(d, "lost constant", f"({coefficient}/{degree})*x^{degree}", "incorrect")
        add(d, "nonconstant C", f"({coefficient}/{degree})*x^{degree}+C*x", "incorrect")
scalar("calculus-domain", "calculus-expression", {"variables": ["x"], "expected": "1"}, ["(x^2+1)/(x^2+1)", "exp(x)/exp(x)", "sin(x)^2+cos(x)^2"], ["sin(x)^2-cos(x)^2"], "x/x")
add("calculus-domain", "trigonometric removable singularities", "cos(x)^2/(1-sin(x)^2)", "input-error")
add("calculus-domain", "square root singularity", "sqrt(x)^2/x", "input-error")
scalar("calculus-inverse", "calculus-expression", {"variables": ["x"], "expected": "1/(1+x^2)"}, ["1/(x*x+1)"], ["-1/(1+x^2)"], "arctan(x)/x")
scalar("calculus-bounded-identity", "calculus-expression", {"variables": ["x"], "expected": "sin(x)"}, ["sin(x)+0"], ["2*sin(x)"], "cos(pi/2-x)")
scalar("antiderivative-log", "antiderivative", {"variable": "x", "integrand": "1/x", "mode": "family", "domain": {"positive": ["x"]}}, ["ln(x)+C", "ln(2*x)+C"], ["2*ln(x)+C", "ln(x)+C*x"], "ln(x-1)+C")
# Exact rational distances and inclusive/exclusive probability bounds.
for target in [0, 1, 5, 9, 10]:
    d = define(f"approximate-{target}", "approximate-number", {"expected": f"{target}/10", "tolerance": "1/100", "minimum": "0", "maximum": "1"})
    for delta in [-101, -100, -99, 0, 99, 100, 101]:
        numerator = target*1000 + delta
        add(d, f"exact delta {delta}", f"{numerator}/10000", "correct" if abs(delta) <= 100 and 0 <= numerator <= 10000 else "incorrect")
    for s in ["NaN", "Infinity", "1e-3", "50%", "0/0"]: add(d, s, s, "input-error")
scalar("approximate-radical", "approximate-number", {"expected": "sqrt(2)", "tolerance": "1/1000"}, ["sqrt(2)+1/1000", "sqrt(2)-1/1000"], ["sqrt(2)+1001/1000000", "sqrt(2)-1001/1000000"])
# Relation composition is independently enumerated as sets of pairs.
rels = [set((i,j) for i in range(2) for j in range(2) if bits & (1 << (2*i+j))) for bits in range(16)]
relation = lambda pairs: "{"+",".join(f"({i},{j})" for i,j in sorted(pairs, reverse=True))+"}"
define("finite-relation", "finite-relation", {"kind": "noncommuting-composition"}, ["r", "s"])
for i, r in enumerate(rels):
    for j, s in enumerate(rels):
        rs = {(a,d) for a,b in r for c,d in s if b == c}
        sr = {(a,d) for a,b in s for c,d in r if b == c}
        add("finite-relation", f"all 2-point relations {i} {j}", {"r": relation(r), "s": relation(s)}, "correct" if rs != sr else "incorrect")
add("finite-relation", "bad pair", {"r": "{}", "s": "{(0,1,2)}"}, "input-error")
define("relation-witness", "finite-relation", {"kind": "reflexive-symmetric-not-transitive", "universe": ["0", "1", "2"]}, ["r", "w"])
add("relation-witness", "path with loops", {"r": "{(0,0),(1,1),(2,2),(0,1),(1,0),(1,2),(2,1)}", "w": "(0,1,2)"})
add("relation-witness", "wrong witness", {"r": "{(0,0),(1,1),(2,2)}", "w": "(0,1,2)"}, "incorrect")
add("relation-witness", "malformed witness despite wrong relation", {"r": "{}", "w": "(0,1"}, "input-error")
define("finite-map", "finite-map", {"kind": "unique-fiber-noninjective", "domains": {"A": ["0", "1", "2"], "B": ["a", "b", "c"]}, "maps": [{"name": "f", "domain": "A", "codomain": "B", "fields": {str(i): f"f{i}" for i in range(3)}}]}, ["f0", "f1", "f2"])
for xs in itertools.product("abc", repeat=3):
    sizes = [xs.count(y) for y in "abc"]
    add("finite-map", "".join(xs), {f"f{i}": x for i,x in enumerate(xs)}, "correct" if 1 in sizes and any(n > 1 for n in sizes) else "incorrect")
add("finite-map", "outside codomain", {"f0": "a", "f1": "b", "f2": "1"}, "incorrect")
add("finite-map", "malformed image", {"f0": "a", "f1": "b", "f2": "("}, "input-error")
# Enumerate every DAG whose edges follow a,b,c,d, and every candidate order independently.
vertices = list("abcd")
possible_edges = list(itertools.combinations(vertices, 2))
for bits in [0, 1, 7, 13, 31, 63]:
    edges = [e for i,e in enumerate(possible_edges) if bits & (1 << i)]
    orders = [order for order in itertools.permutations(vertices) if all(order.index(a) < order.index(b) for a,b in edges)]
    d = define(f"dag-{bits}", "graph", {"kind": "all-topological-orders", "directed": True, "vertices": vertices, "edges": edges})
    render = lambda os: "; ".join(",".join(o) for o in os)
    add(d, "independently enumerated complete orders", render(list(reversed(orders))))
    add(d, "duplicate order", render(orders + [orders[0]]), "incorrect")
    add(d, "missing or wrong order", render(orders[:-1]) if len(orders) > 1 else "d,c,b,a", "incorrect")
    add(d, "irrelevant syntax", render(orders)+"; @", "input-error")
scalar("graph-route", "graph", {"kind": "euler-circuit", "vertices": list("abc"), "edges": [["a","b"],["b","c"],["c","a"]]}, ["b,c,a,b", "a → c → b → a"], ["a,b,c", "a,b,a,c,a"])
for s in ["a,b,c,a)", "(a,b,c,a]", "{a,b,c,a"]: add("graph-route", "unbalanced list " + s, s, "input-error")
define("asymptotic-bound", "asymptotic-bound", {"kind": "positive-polynomial-ratio", "leading": "3", "terms": [{"coefficient": "6", "power": 1}]}, ["lower", "upper", "at"])
for at in [1,2,3,6]:
    for upper in [3,4,5,6,9]:
        add("asymptotic-bound", f"monotone ratio at {at} upper {upper}", {"lower": "3", "upper": str(upper), "at": str(at)}, "correct" if (upper-3)*at >= 6 else "incorrect")
add("asymptotic-bound", "zero threshold", {"lower": "1", "upper": "20", "at": "0"}, "incorrect")
add("asymptotic-bound", "noninteger threshold", {"lower": "1", "upper": "20", "at": "1/2"}, "incorrect")
add("asymptotic-bound", "undefined bound", {"lower": "1", "upper": "1/0", "at": "1"}, "input-error")
# A=[a,b] has null space span((-b,a)) for a != 0; scalar multiples and redundant lists.
for a,b in [(-3,2),(1,0),(2,5),(4,-1)]:
    d = define(f"null-basis-{a}-{b}", "linear", {"kind": "basis", "space": "null", "a": [[str(a),str(b)]]})
    add(d, "scaled null direction", f"{-3*b},{3*a}")
    add(d, "non-null vector", f"{a},{b}", "incorrect")
    add(d, "redundant directions", f"{-b},{a};{-2*b},{2*a}", "incorrect")
    add(d, "wrong vector dimension", f"{-b},{a},0", "incorrect")
    add(d, "malformed vector", "0,1/0", "input-error")
scalar("zero-null-basis", "linear", {"kind": "basis", "space": "null", "a": [["1","0"],["0","1"]]}, ["{}", "∅"], ["0,0"])
scalar("eigenvector", "linear", {"kind": "eigenvector", "a": [["2","1"],["0","3"]], "lambda": "3"}, ["-7,-7", "1/2,1/2"], ["0,0", "1,0"])
define("rectangular-svd", "linear", {"kind": "svd", "form": "thin", "order": "descending", "a": [["3","0"],["0","2"],["0","0"]]}, ["u","s","v"])
svd = {"u": "-1,0;0,1;0,0", "s": "3,0;0,2", "v": "-1,0;0,1"}
add("rectangular-svd", "paired sign freedom", svd)
add("rectangular-svd", "unpaired sign", {**svd,"v":"1,0;0,1"}, "incorrect")
add("rectangular-svd", "wrong rectangular shape", {**svd,"u":"1,0;0,1"}, "incorrect")
add("rectangular-svd", "undefined entry", {**svd,"s":"3,0;0,1/0"}, "input-error")
# Reflexive symmetric relations on three points; transitivity witnesses use direct lookup.
for mask in range(8):
    relation_pairs = {(i,i) for i in range(3)}
    for bit,(i,j) in enumerate(itertools.combinations(range(3), 2)):
        if mask & (1 << bit): relation_pairs |= {(i,j),(j,i)}
    for i,j,k in itertools.product(range(3), repeat=3):
        violation = (i,j) in relation_pairs and (j,k) in relation_pairs and (i,k) not in relation_pairs
        add("relation-witness", f"symmetric relation {mask} witness {i}{j}{k}", {"r": relation(relation_pairs), "w": f"({i},{j},{k})"}, "correct" if violation else "incorrect")
define("affine-family", "linear", {"kind": "affine-family", "a": [["1","2","0"],["0","0","1"]], "b": ["3","4"]}, ["point","directions"])
add("affine-family", "shifted point and scaled direction", {"point":"1,1,4", "directions":"-6,3,0"})
add("affine-family", "incomplete singleton solution", {"point":"3,0,4", "directions":"{}"}, "incorrect")
add("affine-family", "wrong point", {"point":"1,0,4", "directions":"-2,1,0"}, "incorrect")
add("affine-family", "malformed despite wrong point", {"point":"1,0,4", "directions":"0,1/0,0"}, "input-error")
scalar("best-rank", "linear", {"kind":"best-rank", "a":[["3","0"],["0","2"]], "rank":1, "errorSquared":"4"}, ["3,0;0,0"], ["0,0;0,2", "3,0;0,2", "0,0;0,0"], "1,0;0,1/0")
scalar("eigenpairs", "linear", {"kind":"eigenpairs", "a":[["2","0"],["0","3"]], "eigenvalues":["2","3"], "orthogonal":True}, ["3,0,-4;2,7,0"], ["3,0,0;2,7,0", "2,1,0;2,2,0", "3,0,4;2,7,1"])
scalar("logic-iff", "boolean-formula", {"variables":["p","q"], "expected":"(p -> q) & (q -> p)"}, ["p ⇔ q", "p \\Leftrightarrow q"], ["p ⇒ q"])
# Real positivity must not silently change a quantified complex-domain formula.
scalar("quantifier-complex-domain", "quantified-formula", {"expected":"forall x in C P(x)", "domains":["C"], "predicates":{"P":1}}, ["forall z in C P(z)"], ["forall z in C P(z*(z^2+1)/(z^2+1))"])
# These two actual schemas explicitly prohibit relying on 0^0. Only the schema
# is copied; requested initial/later terms follow immediately from each recurrence.
for filename, lesson, number, valid, invalid in [
    ("deterministic-exercises.json", "sequences-and-summations", 18, {"value-1":"9", "value-2":"0"}, {"value-1":"9*0^0", "value-2":"0"}),
    ("deterministic-algorithms.json", "recurrence-relations", 8, {"answer-1":"7", "answer-2":"4"}, {"answer-1":"7*0^0", "answer-2":"4"}),
]:
    authored = json.loads((ROOT / "content" / filename).read_text())
    source = next(a for a in authored if a["lesson"] == lesson and a["id"] == number)
    d = f"{lesson}-{number}"
    definitions[d] = source["assessment"]
    add(d, "stated values without zero power", valid)
    add(d, "explicitly prohibited zero power", invalid, "input-error")
scalar("zero-power-source", "exact", {"expected":["1"]}, ["2^0", "0!"], ["0^1"], "0^0")
add("zero-power-source", "evaluated zero to zero", "(2-2)^(3-3)", "input-error")
scalar("zero-power-symbolic", "expression", {"variables":["x"], "expected":"1"}, ["x^0"], ["x^1"])
scalar("binomial-alias", "exact", {"expected":["10"]}, ["binomial(5,2)", "2binomial(5,1)"], ["binomial(5,1)"], "binomial(5,1001)")
scalar("binomial-bound", "exact", {"expected":["0"]}, ["binom(5,1000)", "binomial(5,6)"], ["binom(5,5)"], "binom(5,1001)")
# Shared structural checks reach every family using valid typed data as their base.
for d in list(definitions):
    exemplar = next(c for c in cases if c["definition"] == d and c["outcome"] == "correct")
    add(d, "unexpected response field", {**exemplar["response"], "unrequested": "1"}, "input-error")

out = {"description": "Independent finite enumeration, algebraic construction, domain and boundary adversaries. Generated by scripts/authoring/deterministic-adversarial.py.", "definitions": definitions, "cases": cases}
(ROOT / "shared/deterministic-adversarial-corpus.json").write_text(json.dumps(out, indent=2)+"\n")
print(f"Wrote {len(definitions)} definitions and {len(cases)} cases for {len({d['requirements'][0]['validator'] for d in definitions.values()})} validators")
