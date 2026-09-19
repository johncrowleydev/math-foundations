"""Author deterministic assessment metadata from independently checked finite families.

This is the source of truth for content/deterministic-exercises.json. Existing
worksheet generators remain the source of the mathematics and exercise IDs.
The audit's published snapshot pins the task being adapted; the normal content
builder rejects a stale sourceHash rather than accepting changed prompts.
"""
from fractions import Fraction
from hashlib import sha256
from itertools import product
from math import comb, factorial, perm, floor, ceil
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
AUDIT = json.loads((ROOT / 'docs/deterministic-grading-audit.json').read_text())
EXERCISES = {row['key']: row for row in AUDIT['exercises']}
entries = []


def assessment(inputs, requirements, answer, cost='low', capabilities=None, level='production'):
    return {
        'version': 1, 'inputs': inputs, 'requirements': requirements,
        'feedback': {
            'correct': answer,
            'incorrect': 'Check the requested values and their labels, then try again.',
        },
        'evidence': {
            'level': level, 'interactionCost': cost,
            'inputCapabilities': capabilities or ['short-text'],
        },
    }


def requirement(identifier, validator, fields, params, description):
    return {'id': identifier, 'validator': validator, 'fields': fields,
            'params': params, 'description': description}


def fixtures(response, alternate=None):
    """The wrong fixture changes one required field, never a merely optional one."""
    correct = dict(response)
    wrong = dict(correct)
    field = next(iter(wrong))
    value = wrong[field]
    wrong[field] = not value if isinstance(value, bool) else f'({value})+1'
    result = [{'response': correct, 'verdict': 'correct'},
              {'response': wrong, 'verdict': 'incorrect'},
              {'response': {k: v for k, v in correct.items() if k != field}, 'error': True}]
    if alternate:
        result.insert(1, {'response': alternate, 'verdict': 'correct'})
    return result


def append(key, inputs, requirements, response, rationale, *, prompt=None,
           instructions=None, cost='low', capabilities=None, alternate=None):
    published = EXERCISES[key]['publishedQuestion']
    lesson, identifier = key.rsplit('-', 1)
    original = [published['instructions'], published['prompt'],
                published.get('math'), published['officialAnswer']]
    digest = sha256(json.dumps(original, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    entry = {
        'lesson': lesson, 'id': int(identifier), 'sourceHash': digest,
        'rationale': rationale,
        'assessment': assessment(inputs, requirements, published['officialAnswer'], cost, capabilities),
        'fixtures': fixtures(response, alternate),
    }
    if prompt is not None:
        entry['prompt'] = prompt
    if instructions is not None:
        entry['instructions'] = instructions
    entries.append(entry)


def numeric(key, values, labels=None):
    values = [str(x) for x in values]
    labels = labels or (['Answer'] if len(values) == 1 else [f'Value {i+1}' for i in range(len(values))])
    assert len(values) == len(labels)
    fields = [f'value-{i+1}' for i in range(len(values))]
    response = dict(zip(fields, values))
    alternate = dict(response)
    alternate[fields[0]] = f'(2*({values[0]}))/2'
    append(key, [{'id': f, 'kind': 'math', 'label': label} for f, label in zip(fields, labels)],
           [requirement('values', 'exact', fields, {'expected': values}, 'Every requested value is correct.')],
           response, 'The published task asks for definite numerical values; explanatory answer-key prose is not an additional response requirement.',
           capabilities=['math-text'], alternate=alternate)


# Counts independently evaluated from the stated finite counting problem.
counts = {
    1: 4+7, 3: 3+5, 4: 4**5, 5: 2**8-1, 6: perm(10, 4),
    7: 10**4-perm(10, 4), 8: 9*9*8*7, 9: 30-(18+15-8),
    10: 26**2+10**3, 12: comb(9, 3), 13: factorial(6),
    14: 2*factorial(5), 15: factorial(6)-2*factorial(5), 18: perm(7, 4),
    21: factorial(6)//(factorial(3)*factorial(2)),
    22: factorial(11)//(factorial(4)*factorial(4)*factorial(2)),
    23: comb(8, 3), 24: factorial(4), 26: 2*factorial(4), 30: comb(8, 2),
    35: comb(5, 3)*2**2, 36: comb(4, 2)*(-3)**2,
    41: sum(n % 2 == 0 or n % 3 == 0 for n in range(1, 101)),
    42: sum(n % 4 == 0 or n % 6 == 0 for n in range(1, 121)),
    43: sum(n % 4 != 0 and n % 6 != 0 for n in range(1, 121)),
    46: sum('A' in s and 'B' in s for s in product('ABC', repeat=5)),
    47: comb(5, 2)*(9**3-8**3), 48: comb(5, 2)*comb(5, 3)*factorial(5),
    49: sum(b-a > 1 for a in range(6) for b in range(a+1, 6)),
    50: comb(8, 3)-6, 51: ceil(Fraction(25, 12)), 61: 2**12, 62: 3**5,
    63: 2**7, 64: 2*2**6, 65: 2**6-2, 66: sum(comb(7, k) for k in range(3)),
    67: 2**4-2, 68: factorial(5), 69: 3*4*2, 70: (2+4+4)*2,
    71: comb(9, 3), 72: comb(5, 3), 73: factorial(4)//factorial(2),
    74: factorial(5)//(factorial(2)**2)-factorial(4)//factorial(2),
    76: 10**6-9**6, 77: 9*10**5-9**6,
}
for identifier, value in counts.items():
    numeric(f'combinatorics-{identifier}', [value])

sequences = {
    1: ([3*n-2 for n in range(5)], [f'$a_{n}$' for n in range(5)]),
    3: ([(-1)**n*(n+2) for n in (0, 1, 2, 5)], ['$a_0$', '$a_1$', '$a_2$', '$a_5$']),
    4: ([2, 7, 22, 67], ['$a_0$', '$a_1$', '$a_2$', '$a_3$']),
    7: ([8], ['$F_6$']), 13: ([4, -1], ['Common difference', '$a_0$']),
    14: ([sum(10-2*n for n in range(7))], None),
    15: ([sum(5+2*n for n in range(3, 9))], None),
    16: ([3*(-2)**5], ['$a_5$']), 17: ([64*Fraction(1, 2)**6], ['$a_7$']),
    25: ([sum(range(1, 21))], None), 26: ([sum(2*k-1 for k in range(1, 21))], None),
    31: ([sum(2**k for k in range(7))], None),
    32: ([sum(3**k for k in range(2, 6))], None),
    34: ([sum(Fraction(1, 2)**k for k in range(1, 5))], None),
    37: ([1, 0], ['Five-term expression at $r=0$', 'Zero-term sum']),
    38: ([sum((-1)**k for k in range(7))], None),
    46: ([sum(Fraction(1, k*(k+1)) for k in range(1, 5))], None),
    51: ([factorial(4)], None), 52: ([factorial(5)], None),
    55: ([2**4*factorial(4)], None),
    61: ([sum(i for i in range(1, 5))], None),
    62: ([sum(sum(range(1, i+1)) for i in range(1, 4))], None),
    63: ([sum(i+j for i in range(1, 3) for j in range(1, 4))], None),
}
for identifier, (values, labels) in sequences.items():
    numeric(f'sequences-and-summations-{identifier}', values, labels)

append('asymptotic-growth-52',
       [{'id': 'values', 'kind': 'math', 'label': 'Values of $i$ in execution order', 'hint': 'Separate values with commas.'},
        {'id': 'count', 'kind': 'math', 'label': 'Execution count'}],
       [requirement('execution-values', 'tuple', ['values'], {'expected': ['1', '2', '4', '8', '16']}, 'All execution values appear in order.'),
        requirement('execution-count', 'exact', ['count'], {'expected': ['5']}, 'The execution count is correct.')],
       {'count': '5', 'values': '1,2,4,8,16'},
       'A typed list preserves production of the execution sequence without revealing its length through a fixed number of blank cells.',
       capabilities=['math-text'])
numeric('asymptotic-growth-68', [(1000).bit_length()], ['Bit length'])
for identifier, values, labels in [
    (5, [0, 1, 2], ['$|\\varnothing|$', '$|\\{\\varnothing\\}|$', '$|\\{\\varnothing,\\{\\varnothing\\}\\}|$']),
    (36, [3*4, 2**12], ['$|A\\times B|$', '$|\\mathcal P(A\\times B)|$']),
    (41, [24+18-10], None), (42, [(24-10)+(18-10)], None),
    (43, [50-(24+18-10)], None), (44, [17+14-25], None),
    (46, [20+16+12-8-5-4+2], None), (47, [(8-2)+(5-2)+(4-2)], None),
    (48, [(20-8-5+2)+(16-8-4+2)+(12-5-4+2)], None),
    (74, [2**12], None), (75, [2**4], None),
]:
    numeric(f'sets-and-set-operations-{identifier}', values, labels)
for identifier, value in [(1, 2*3), (9, 1), (53, 1)]:
    numeric(f'relations-{identifier}', [value])
for identifier, values, labels in [
    (55, [4**3], None), (61, [floor(3.8), ceil(3.8)], ['Floor', 'Ceiling']),
    (62, [floor(-3.8), ceil(-3.8)], ['Floor', 'Ceiling']),
    (63, [-5, -5], ['Floor', 'Ceiling']), (67, [ceil(Fraction(25, 6))], ['Containers']),
]:
    numeric(f'functions-{identifier}', values, labels)
for identifier, values, labels in [
    (1, [comb(5, 2)], None), (2, [5*4], None), (3, [(3+3+2+2+2)//2], None),
    (41, [12-1], None), (42, [14-4], None), (54, [8, 15], ['Leaves', 'Total vertices']),
]:
    numeric(f'graph-theory-{identifier}', values, labels)


# Explicit Boolean subexpressions preserve the intermediate values the task asks for.
neg = lambda a: not a
conjunction = lambda a, b: a and b
disjunction = lambda a, b: a or b
implication = lambda a, b: not a or b
equivalence = lambda a, b: a == b
formulas = {
    15: [('\\neg p', lambda p,q: not p), ('\\neg p\\lor q', lambda p,q: not p or q)],
    16: [('\\neg q', lambda p,q: not q), ('p\\land\\neg q', lambda p,q: p and not q)],
    17: [('\\neg q', lambda p,q: not q), ('p\\lor\\neg q', lambda p,q: p or not q)],
    18: [('p\\land q', conjunction), ('\\neg(p\\land q)', lambda p,q: not(p and q))],
    19: [('p\\to q', implication)], 20: [('p\\to q', implication)],
    21: [('p\\to q', implication)], 22: [('q\\to p', lambda p,q: not q or p)],
    23: [('p\\leftrightarrow q', equivalence)], 24: [('p\\leftrightarrow q', equivalence)],
    25: [('\\neg p', lambda p,q: not p), ('p\\lor q', disjunction), ('\\neg p\\land(p\\lor q)', lambda p,q: not p and(p or q))],
    26: [('p\\to q', implication), ('\\neg(p\\to q)', lambda p,q: not implication(p,q)), ('\\neg(p\\to q)\\lor q', lambda p,q: not implication(p,q) or q)],
    27: [('p\\land r', lambda p,q,r: p and r), ('(p\\land r)\\to q', lambda p,q,r: not(p and r) or q)],
    28: [('\\neg q', lambda p,q,r: not q), ('p\\lor r', lambda p,q,r: p or r), ('\\neg q\\land(p\\lor r)', lambda p,q,r: not q and(p or r))],
    29: [('p\\to q', lambda p,q,r: not p or q), ('q\\to r', lambda p,q,r: not q or r), ('(p\\to q)\\lor(q\\to r)', lambda p,q,r: (not p or q) or(not q or r))],
    30: [('p\\leftrightarrow r', lambda p,q,r: p == r), ('\\neg q', lambda p,q,r: not q), ('(p\\leftrightarrow r)\\land\\neg q', lambda p,q,r: p == r and not q)],
    40: [('\\neg p', lambda p,q: not p), ('\\neg p\\lor q', lambda p,q: not p or q)],
    41: [('p\\land q', conjunction), ('\\neg(p\\land q)', lambda p,q: not(p and q))],
    42: [('p\\to q', implication), ('q\\to p', lambda p,q: not q or p)],
    43: [('p\\leftrightarrow q', equivalence)],
    44: [('p\\to q', implication), ('\\neg q\\to\\neg p', lambda p,q: q or not p)],
    45: [('p\\land q', lambda p,q,r: p and q), ('(p\\land q)\\to r', lambda p,q,r: not(p and q) or r)],
}
assignments = {15: [True,True], 16: [True,False], 17: [False,True], 18: [False,False],
               19: [True,False], 20: [False,True], 21: [False,False], 22: [True,False],
               23: [True,True], 24: [True,False], 25: [False,True], 26: [True,False]}
for identifier in range(27, 31):
    assignments[identifier] = [True, False, True]
for identifier, columns in formulas.items():
    n = 3 if identifier in (27, 28, 29, 30, 45) else 2
    given_rows = [assignments[identifier]] if identifier < 40 else list(product([True, False], repeat=n))
    rows, response = [], {}
    for r, given in enumerate(given_rows):
        cells = [{'given': value} for value in given]
        for c, (formula, evaluate) in enumerate(columns):
            field = f'r{r+1}-c{c+1}'
            cells.append({'id': field, 'kind': 'boolean'})
            response[field] = evaluate(*given)
        rows.append({'label': ', '.join(f'{v}={"T" if b else "F"}' for v,b in zip('pqr',given)), 'cells': cells})
    inputs = [{'id': 'truth-table', 'kind': 'grid', 'label': 'Truth values',
               'columns': [f'${v}$' for v in 'pqr'[:n]] + [f'${f}$' for f,_ in columns], 'rows': rows}]
    reqs = [requirement('truth-values', 'boolean', list(response), {'expected': list(response.values())}, 'Every required truth value is correct.')]
    if identifier in (42, 44):
        inputs.append({'id': 'comparison', 'kind': 'select', 'label': 'The final columns are',
                       'options': [{'id': 'same', 'label': 'Equal in every row'}, {'id': 'different', 'label': 'Different in at least one row'}]})
        comparison = 'same' if identifier == 44 else 'different'
        reqs.append(requirement('column-comparison', 'selection', ['comparison'], {'expected': [comparison]}, 'The final-column comparison is correct.'))
        response['comparison'] = comparison
    prompt = None
    if identifier >= 40:
        prompt = EXERCISES[f'propositional-logic-{identifier}']['publishedQuestion']['prompt'].replace('including the input columns.', 'using the supplied input columns.')
    append(f'propositional-logic-{identifier}', inputs, reqs, response,
           'Supplied assignments and blank Boolean cells preserve the requested intermediate/final truth values without handwriting table formatting.',
           prompt=prompt, cost='medium' if identifier >= 40 else 'low', capabilities=['tap'])


# These matrices are the explicit source data in the existing LA authoring generator.
matrices = {
    1: [[1,2,3],[4,5,6]], 3: [[1,2],[0,1]], 4: [[2,-1],[1,3]],
    5: [[0,1,2],[2,-1,0]], 6: [[1,0],[0,2],[1,-1]],
    7: [[2,0,-1],[0,1,3]], 8: [[1,2,0],[-1,0,1],[0,1,1]],
}
for identifier, matrix in matrices.items():
    nr, nc = len(matrix), len(matrix[0])
    transpose = [list(column) for column in zip(*matrix)]
    requested_entry = matrix[1][2] if identifier == 1 else matrix[-1][0]
    inputs = [{'id': 'rows', 'kind': 'math', 'label': 'Number of rows'},
              {'id': 'columns', 'kind': 'math', 'label': 'Number of columns'},
              {'id': 'entry', 'kind': 'math', 'label': 'Requested matrix entry'}]
    response = {'rows': str(nr), 'columns': str(nc), 'entry': str(requested_entry)}
    grid_rows, fields = [], []
    for r, row in enumerate(transpose):
        cells = []
        for c, value in enumerate(row):
            field = f't-{r+1}-{c+1}'
            fields.append(field)
            cells.append({'id': field, 'kind': 'text'})
            response[field] = str(value)
        grid_rows.append({'label': f'Row {r+1}', 'cells': cells})
    inputs.append({'id': 'transpose', 'kind': 'grid', 'label': 'Transpose',
                   'columns': [f'Column {c+1}' for c in range(nr)], 'rows': grid_rows})
    reqs = [requirement('shape-entry', 'exact', ['rows', 'columns', 'entry'],
                        {'expected': [str(nr), str(nc), str(requested_entry)]}, 'Shape and requested entry are correct.'),
            requirement('transpose', 'matrix', fields, {'expected': [[str(v) for v in row] for row in transpose]}, 'The transpose exchanges rows and columns.')]
    append(f'linear-algebra-matrices-{identifier}', inputs, reqs, response,
           'The task requests a shape, entry, and transpose; labeled scalar fields and a compact matrix remove formatting work.',
           cost='medium', capabilities=['math-text'])

assert len(entries) == 126, len(entries)
entries.sort(key=lambda e: (e['lesson'], e['id']))
(ROOT / 'content/deterministic-exercises.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
print(f'Authored {len(entries)} deterministic exercise definitions.')
