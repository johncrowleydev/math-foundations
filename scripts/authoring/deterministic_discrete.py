"""Source-pinned discrete assessments that preserve ordinary answer creation."""
from itertools import product


def author(append, requirement, exercises):
    def decision(field, label, options):
        return {'id': field, 'kind': 'select', 'label': label,
                'options': [{'id': key, 'label': text} for key, text in options]}

    def choice_requirement(field, expected, description):
        return {**requirement(field, 'selection', [field], {'expected': [expected]}, description),
                'evidenceLevel': 'recognition'}

    def model(identifier, variables, conditions, correct, alternate=None, choice=None):
        inputs = [{'id': 'assignment', 'kind': 'grid', 'label': 'Assignment',
                   'columns': variables, 'rows': [{'cells': [{'id': v, 'kind': 'boolean'} for v in variables]}]}]
        reqs = [requirement('model', 'boolean-model', variables,
                            {'variables': {v: v for v in variables},
                             'conditions': [{'formula': f, 'value': b} for f, b in conditions], 'checks': {}},
                            'The chosen assignment has every requested property.')]
        response = dict(zip(variables, correct))
        alternative = dict(zip(variables, alternate)) if alternate else None
        if choice:
            field, label, options, expected = choice
            inputs.insert(0, decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The conceptual decision is correct.'))
            response[field] = expected
            if alternative:
                alternative[field] = expected
        tests = [{'response': response, 'verdict': 'correct'}, {'response': {}, 'error': True}]
        if alternative:
            tests.append({'response': alternative, 'verdict': 'correct'})
        # Exhaust all assignments; the authoritative condition is independently
        # evaluated here so fixtures include every valid nonunique witness.
        def truth(formula, env):
            known = {
                'p->q': lambda: not env['p'] or env['q'], 'q->p': lambda: not env['q'] or env['p'],
                '!p': lambda: not env['p'], '!q': lambda: not env['q'], 'p': lambda: env['p'],
                'q': lambda: env['q'], 'p&q': lambda: env['p'] and env['q'],
                '(p|q)&!p': lambda: (env['p'] or env['q']) and not env['p'],
                '(p|q)&(!p|r)&!q': lambda: (env['p'] or env['q']) and (not env['p'] or env['r']) and not env['q'],
                '(p|q)&!(p&q)': lambda: env['p'] != env['q'],
                'r->q': lambda: not env['r'] or env['q'], 'p|r': lambda: env['p'] or env['r'],
            }
            return known[formula]()
        for values in product([True, False], repeat=len(variables)):
            candidate = {**response, **dict(zip(variables, values))}
            expected = all(truth(f, candidate) == b for f, b in conditions)
            tests.append({'response': candidate, 'verdict': 'correct' if expected else 'incorrect'})
        if choice:
            tests.append({'response': {**response, choice[0]: next(k for k, _ in choice[2] if k != choice[3])}, 'verdict': 'incorrect'})
        append(f'propositional-logic-{identifier}', inputs, reqs, response,
               'The finite assignment itself verifies the requested witness or counterexample. A requested classification remains a separate deterministic decision; no written derivation is requested.',
               capabilities=['tap'], test_cases=tests)

    validity = ('validity', 'Argument', [('valid', 'Valid'), ('invalid', 'Invalid')], 'invalid')
    satisfiable = ('satisfiable', 'Satisfiable?', [('yes', 'Yes'), ('no', 'No')], 'yes')
    model(39, ['p', 'q'], [('p->q', True), ('q->p', False)], [False, True],
          choice=('decision', 'Must the converse also be true?', [('yes', 'Yes'), ('no', 'No')], 'no'))
    model(122, ['p', 'q'], [('p->q', True), ('!p', True), ('!q', False)], [False, True], choice=validity)
    model(123, ['p', 'q'], [('p->q', True), ('q', True), ('p', False)], [False, True])
    model(124, ['p', 'q'], [('p->q', True), ('!p', True), ('!q', False)], [False, True])
    model(129, ['p', 'q'], [('p&q', True)], [True, True], choice=satisfiable)
    model(131, ['p', 'q'], [('(p|q)&!p', True)], [False, True], choice=satisfiable)
    model(134, ['p', 'q', 'r'], [('(p|q)&(!p|r)&!q', True)], [True, False, True], choice=satisfiable)
    model(146, ['p', 'q'], [('(p|q)&!(p&q)', True)], [True, False], [False, True],
          choice=('relationship', 'Relationship', [('xor', 'Exactly one is true'), ('both', 'Both are true'),
                                                     ('same', 'Both have the same truth value'), ('neither', 'Both are false')], 'xor'))
    model(147, ['p', 'q', 'r'], [('p->q', True), ('r->q', True), ('q', True), ('p|r', False)], [False, True, False], choice=validity)

    append('propositional-logic-150', [{'id': 'models', 'kind': 'math', 'label': 'All satisfying assignments',
                                      'hint': 'Write each assignment in p,q,r order, for example {TTF, FTF}.'}],
           [requirement('models', 'set', ['models'], {'expected': ['TTT', 'FFF'], 'atoms': [''.join(v) for v in product('TF', repeat=3)]},
                        'Every satisfying assignment, and only satisfying assignments, is present.')], {'models': '{TTT,FFF}'},
           'Typed set entry preserves finding all models without exposing their number through a fixed number of response slots.',
           capabilities=['math-text'], test_cases=[{'response': {'models': v}, 'verdict': verdict} for v, verdict in
                                                  [('{TTT,FFF}', 'correct'), ('{FFF,TTT,FFF}', 'correct'), ('{TTT}', 'incorrect'), ('{TTT,FFF,TTF}', 'incorrect')]])

    def witness(key, variables, conditions, correct, alternatives, wrong, choice=None):
        inputs = [{'id': name, 'kind': 'math', 'label': label} for name, label, _ in variables]
        reqs = [requirement('witness', 'witness', [name for name, _, _ in variables],
                            {'variables': [{'name': name, 'field': name, **constraints} for name, _, constraints in variables],
                             'conditions': [{'left': a, 'op': op, 'right': b} for a, op, b in conditions]},
                            'The proposed values satisfy the requested hypotheses and violate the claimed conclusion.')]
        response = {name: str(value) for (name, _, _), value in zip(variables, correct)}
        tests = []
        for values, verdict in [(correct, 'correct')] + [(v, 'correct') for v in alternatives] + [(v, 'incorrect') for v in wrong]:
            tests.append({'response': {name: str(value) for (name, _, _), value in zip(variables, values)}, 'verdict': verdict})
        if choice:
            field, label, options, expected = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The short explanation identifies the relevant condition.'))
            response[field] = expected
            for test in tests:
                test['response'][field] = expected
            tests.append({'response': {**response, field: next(k for k, _ in options if k != expected)}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(key, inputs, reqs, response,
               'A freely created numeric witness is checked against the statement itself, including domain and boundary conditions; the official example is not the only accepted answer.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)

    integer = {'integer': True}
    witness('propositional-logic-72', [('n', '$n$', integer)], [('2', 'divides', 'n'), ('4', 'not-divides', 'n')], [6], [[2], [-2]], [[4], [3], [0], ['3/2']])
    witness('predicates-and-quantifiers-70', [('x', '$x$', {})], [('x^2', '>', '4'), ('x', '<=', '2')], [-3], [[-4], ['-5/2']], [[-2], [3], [0]])
    witness('sequences-and-summations-59', [(n, '$'+n[0]+'_'+n[1]+'$', {}) for n in ['a1', 'a2', 'b1', 'b2']],
            [('(a1+b1)*(a2+b2)', '!=', 'a1*a2+b1*b2')], [1, 1, 1, 1], [[2, 3, 4, 5]], [[0, 0, 0, 0], [1, 1, 0, 0]])
    witness('direct-proof-3', [('k', 'Witness in $-8=2k$', integer), ('m', 'Witness in $-7=2m+1$', integer)],
            [('2*k', '=', '-8'), ('2*m+1', '=', '-7')], [-4, -4], [['-8/2', '-12/3']], [[4, 4], [-4, -3]])
    witness('direct-proof-51', [('n', 'Integer counterexample', integer)], [('2', 'not-divides', 'n')], [1], [[3], [-5]], [[2], [0]],
            choice=('reason', 'Why can it not be a sum of two even integers?', [('even', 'A sum of two even integers is even.'), ('positive', 'A sum of two even integers is positive.'), ('four', 'A sum of two even integers is divisible by 4.')], 'even'))
    witness('direct-proof-52', [('a', '$a$', integer), ('b', '$b$', integer)], [('2', 'divides', 'a*b'), ('2', 'not-divides', 'a+b')],
            [2, 3], [[3, 2], [0, 1], [-2, -3]], [[2, 4], [1, 3]])
    witness('direct-proof-53', [('a', '$a$', integer), ('b', '$b$', integer)], [('a', 'divides', 'b'), ('b', 'not-divides', 'a')],
            [2, 6], [[-2, 6], [1, 0]], [[2, 2], [0, 0], [2, 3]])
    witness('direct-proof-55', [('a', 'First integer', integer), ('b', 'Second integer', integer)], [('(a-b)^2', '=', '1')],
            [2, 3], [[3, 2], [-1, 0]], [[2, 4], [2, 2]])
    witness('direct-proof-58', [('n', '$n$', {'nonInteger': True})], [('n^2', '>=', 'n')], ['3/2'], [['-1/2'], ['5/2']], [[2], ['1/2'], [0]])
    witness('direct-proof-70', [('n', 'Valid counterexample', integer)], [('2', 'divides', 'n'), ('4', 'not-divides', 'n')], [6], [[2], [-2]], [[3], [4]],
            choice=('reason', 'Why does 3 fail?', [('hypothesis', '3 does not satisfy the hypothesis that n is even.'), ('conclusion', '3 is divisible by 4.'), ('domain', '3 is not an integer.')], 'hypothesis'))
    witness('proof-by-contrapositive-39', [('d', '$d$', integer), ('n', '$n$', integer)], [('d', '>', '0'), ('d', 'divides', 'n^2'), ('d', 'not-divides', 'n')],
            [4, 2], [[9, 3], [4, -2]], [[-4, 2], [4, 4], [3, 2], [0, 0]])
    witness('proof-by-contrapositive-40', [('a', '$a$', integer), ('b', '$b$', integer)], [('6', 'divides', 'a*b'), ('6', 'not-divides', 'a'), ('6', 'not-divides', 'b')],
            [2, 3], [[3, 2], [-2, 3]], [[6, 1], [2, 2], [0, 3]])
    witness('proof-by-contrapositive-60', [('x', '$x$', {})], [('x^2', '>', '9'), ('x', '<=', '3')], [-4], [['-7/2'], [-5]], [[-3], [4], [0]])

    def expressions(key, answers, numeric=None, choice=None):
        inputs, reqs, response, alternative = [], [], {}, {}
        for i, (label, expected, variables, domain, equivalent) in enumerate(answers):
            field = f'formula-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label})
            reqs.append(requirement(field, 'expression', [field], {'expected': expected, 'variables': variables, **({'domain': domain} if domain else {})},
                                    'The typed expression is equivalent on the stated domain.'))
            response[field], alternative[field] = expected, equivalent
        for i, (label, expected) in enumerate(numeric or []):
            field = f'value-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label})
            reqs.append(requirement(field, 'exact', [field], {'expected': [str(expected)]}, 'The requested value is correct.'))
            response[field] = alternative[field] = str(expected)
        if choice:
            field, label, options, expected = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The comparison is correct.'))
            response[field] = alternative[field] = expected
        first = next(iter(response))
        append(key, inputs, reqs, response,
               'The prompt asks for a formula or result without a derivation. Ordinary typed math preserves answer creation, and symbolic equivalence accepts rearranged results.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=[
                   {'response': response, 'verdict': 'correct'}, {'response': alternative, 'verdict': 'correct'},
                   {'response': {**response, first: f'({response[first]})+1'}, 'verdict': 'incorrect'}, {'response': {}, 'error': True}])

    expressions('functions-32', [('$f^{-1}(m)$', 'm+7', ['m'], [], '7+m')])
    expressions('functions-42', [('$(f\\circ g)(x)$', '3*x+2', ['x'], [], '2+3*x'), ('$(g\\circ f)(x)$', '3*x+6', ['x'], [], '3*(x+2)')],
                choice=('comparison', 'Compare the compositions', [('same', 'They are equal'), ('different', 'They are different')], 'different'))
    expressions('functions-44', [('$f(g(y))$', 'y', ['y'], [], '(2*y)/2')])
    for identifier, expected, equivalent, domain in [(27, '2*n^2+5*n', 'n*(2*n+5)', []), (47, '1/2-1/(n+1)', '(n-1)/(2*(n+1))', ['n+1']),
                                                    (56, 'n+1', '1+n', []), (57, '1/n', '2/(2*n)', ['n']),
                                                    (71, 'n*(n-1)/2', '(n^2-n)/2', [])]:
        expressions(f'sequences-and-summations-{identifier}', [('Result', expected, ['n'], domain, equivalent)])
    expressions('sequences-and-summations-72', [('Total count', 'n*(n+1)/2', ['n'], [], '(n^2+n)/2'), ('Increase', 'n', ['n'], [], 'n*(n+1)/2-n*(n-1)/2')])
    expressions('sequences-and-summations-73', [('Result', '(3*i^2-i)/2', ['i'], [], 'i^2+i*(i-1)/2')])
    expressions('sequences-and-summations-5', [('$b_n$', '7-2*n', ['n'], [], '5-2*(n-1)')], [('$b_4$', -1)])
    expressions('sequences-and-summations-11', [('$a_n$', '7+4*n', ['n'], [], '4*n+7')], [('$a_{10}$', 47)])
    expressions('sequences-and-summations-12', [('$a_n$', '7+4*(n-1)', ['n'], [], '3+4*n')], [('$a_{10}$', 43)])
