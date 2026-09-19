"""Source-pinned discrete assessments that preserve ordinary answer creation."""
from itertools import product
import re


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
                '!((p->q)<->(q->p))': lambda: (not env['p'] or env['q']) != (not env['q'] or env['p']),
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
    model(37, ['p', 'q'], [('p->q', False)], [True, False])
    model(57, ['p', 'q'], [('!((p->q)<->(q->p))', True)], [True, False], [False, True],
          choice=('decision', 'Are the formulas equivalent?', [('yes', 'Yes'), ('no', 'No')], 'no'))
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

    def witness(key, variables, conditions, correct, alternatives, wrong, choice=None, prompt=None):
        inputs = [{'id': name, 'kind': 'math', 'label': label} for name, label, _ in variables]
        reqs = [requirement('witness', 'witness', [name for name, _, _ in variables],
                            {'variables': [{'name': name, 'field': name, **constraints} for name, _, constraints in variables],
                             'conditions': [{'left': c[0], 'op': c[1], **({'right': c[2]} if len(c) > 2 else {})} for c in conditions]},
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
               prompt=prompt, capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)

    integer = {'integer': True}
    witness('propositional-logic-72', [('n', '$n$', integer)], [('2', 'divides', 'n'), ('4', 'not-divides', 'n')], [6], [[2], [-2]], [[4], [3], [0], ['3/2']])
    witness('predicates-and-quantifiers-70', [('x', '$x$', {})], [('x^2', '>', '4'), ('x', '<=', '2')], [-3], [[-4], ['-5/2']], [[-2], [3], [0]])
    witness('predicates-and-quantifiers-69', [('n', 'Prime counterexample', integer)], [('n', '=', '2')], [2], [['4/2']], [[1], [3], [4]],
            choice=('reason', 'Why is 1 unsuitable?', [('not-prime', '1 is not prime, so the hypothesis fails.'), ('odd', '1 is odd, so the hypothesis fails.'), ('integer', '1 is not an integer.')], 'not-prime'))
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

    def expressions(key, answers, numeric=None, choice=None, options=None):
        inputs, reqs, response, alternative = [], [], {}, {}
        for i, (label, expected, variables, domain, equivalent) in enumerate(answers):
            field = f'formula-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label})
            reqs.append(requirement(field, 'expression', [field], {'expected': expected, 'variables': variables, **({'domain': domain} if domain else {}), **(options or {})},
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

    def recognition(key, correct, wrong, prompt=None):
        options = [('answer', correct)] + [(f'alternative-{i+1}', label) for i, label in enumerate(wrong)]
        offset = int(key.rsplit('-', 1)[1]) % len(options)
        options = options[offset:] + options[:offset]
        original = exercises[key]['publishedQuestion']['prompt']
        if prompt is None:
            prompt = re.sub(r'Explain your answer\.|Explain your classification\.|Explain the distinction\.|Explain, giving.*?if it is \[invalid\].*?\.|Explain, giving a counterexample interpretation if it does not\.|Explain why it holds, or give a \[domain\].*?fail\.|Explain\.|Justify\.', '', original)
            prompt = prompt.strip() + '\n\nSelect the answer and reason.'
        append(key, [decision('answer', 'Answer and reason', options)],
               [choice_requirement('answer', 'answer', 'The selected response includes the correct decision and reason.')],
               {'answer': 'answer'},
               'This brief conceptual decision has a concise complete answer-and-reason choice. It measures recognition and does not claim proof or formula-production evidence.',
               prompt=prompt, capabilities=['tap'], level='recognition',
               test_cases=[{'response': {'answer': identifier}, 'verdict': 'correct' if identifier == 'answer' else 'incorrect'} for identifier, _ in options]
               + [{'response': {}, 'error': True}])

    logic_choices = {
        1: ('True proposition: the arithmetic equality holds.', ['False proposition: the arithmetic equality fails.', 'Not a proposition: it contains numbers.']),
        2: ('Not a proposition: it is a command.', ['True proposition: the laptop can be closed.', 'False proposition: the laptop is open.']),
        3: ('False proposition: 2 is prime and even.', ['True proposition: every prime is odd.', 'Not a proposition: it refers to infinitely many numbers.']),
        4: ('Not a proposition as written: x is unspecified.', ['True proposition: x can equal 6.', 'False proposition: x can equal 0.']),
        5: ('Not a proposition: it asks a question.', ['True proposition: 17 is prime.', 'False proposition: questions are always false.']),
        6: ('True proposition: the integers do not end.', ['False proposition: there is a largest integer.', 'Not a proposition: an infinite set has no truth value.']),
        7: ('False proposition: zero is not positive.', ['True proposition: zero is positive.', 'Not a proposition: zero is neither positive nor negative.']),
        8: ('True proposition: the sentence is in English.', ['False proposition: it is not written in English.', 'Not a proposition: a sentence cannot refer to itself.']),
        36: ('Implication specifies truth conditions, not a causal mechanism.', ['A true implication always identifies a cause.', 'Implication is false when its statements are unrelated.']),
        38: ('Both statements have the same truth value.', ['Both statements must be true.', 'The statements must have opposite truth values.']),
        56: ('Equivalent: implication rewrites as not-p OR q.', ['Not equivalent: implication always requires p to be true.', 'Equivalent: both formulas require p and q to be true.']),
        58: ('Equivalent by De Morgan’s law: neither p nor q is true.', ['Equivalent because negation preserves OR.', 'Not equivalent: the right side allows both to be true.']),
        59: ('Equivalent: a biconditional requires both directions.', ['Not equivalent: only one direction is needed.', 'Equivalent: either direction alone forces equal truth values.']),
        60: ('Tautology: at least one of p and not-p is true.', ['Contradiction: p and not-p cannot both be true.', 'Contingent: it depends on p.']),
        61: ('Contradiction: p and not-p cannot both be true.', ['Tautology: one of the conjuncts is true.', 'Contingent: it is true when p is true.']),
        62: ('Tautology: the two implications cannot both be false.', ['Contradiction: the implications point in different directions.', 'Contingent: both implications fail when p and q differ.']),
        63: ('Contradiction: it requires both p and not-p.', ['Tautology: conjunction always implies p.', 'Contingent: q can make the whole formula true.']),
        64: ('Tautology: its antecedent and consequent cannot be true and false.', ['Contradiction: the two sides repeat the same statement.', 'Contingent: the implication is false when p is false.']),
        65: ('Contradiction: p and not-p always differ.', ['Tautology: one side is always true.', 'Contingent: it is true when p is false.']),
        66: ('Tautology: a true conjunction guarantees p.', ['Contingent: a false conjunction makes the implication false.', 'Contradiction: p appears on both sides.']),
        67: ('Tautology: when p is true, p OR q is true.', ['Contingent: q must also be true.', 'Contradiction: one statement cannot imply a disjunction.']),
        68: ('Tautology: p and p implies q force q.', ['Contingent: q may be false while both premises are true.', 'Contradiction: a formula cannot imply its consequent.']),
        69: ('Contradiction: p true and q false make the implication false.', ['Tautology: it contains an implication and its antecedent.', 'Contingent: set p true and q false.']),
        73: ('A universal statement allows no exception.', ['One example establishes any universal statement.', 'A counterexample changes the domain to one object.']),
        75: ('q is true; otherwise the implication would be true implies false.', ['q is false because p is true.', 'q is undetermined because implication only expresses causation.']),
        79: ('Yes: at least one is true, and both cannot be true.', ['No: both conjuncts allow p and q to be true.', 'No: both conjuncts require p and q to be false.']),
        119: ('Valid: the implication chain and p force r.', ['Invalid: an implication chain cannot be combined.', 'Valid: q implies p, and r implies q.']),
        120: ('Valid: the disjunction and not-p force q.', ['Invalid: q must be assumed separately.', 'Valid: every disjunction makes both sides true.']),
        121: ('Valid by modus tollens: q false forces p false.', ['Invalid: it affirms the consequent.', 'Valid because an implication and its converse are equivalent.']),
        125: ('Valid: either true alternative forces r.', ['Invalid: p and q cannot both be true.', 'Valid because r implies both p and q.']),
        126: ('Valid: not-r forces not-q, then not-p.', ['Invalid: negations prevent chaining implications.', 'Valid because r false makes every premise false.']),
        127: ('Unsatisfiable: p and not-p cannot both be true.', ['Satisfiable: choose p true.', 'Satisfiable: choose p false.']),
        128: ('Satisfiable and a tautology: every assignment makes it true.', ['Satisfiable but not a tautology: choose p true.', 'Unsatisfiable: the two disjuncts cannot both be true.']),
        130: ('Unsatisfiable: the required p true and q false violate the implication.', ['Satisfiable: choose p true and q false.', 'Satisfiable: choose p false and q false.']),
        132: ('Unsatisfiable: the biconditional needs equal values, but p AND not-q needs different values.', ['Satisfiable: choose p true and q false.', 'Satisfiable: choose p and q both true.']),
        133: ('Unsatisfiable: p forces q, then r, contradicting not-r.', ['Satisfiable: choose p true and r false.', 'Satisfiable: choose all three false.']),
        135: ('Unsatisfiable: the disjunction needs a true variable, but both are required false.', ['Satisfiable: choose both false.', 'Satisfiable: choose both true.']),
        136: ('Yes: true under every assignment implies true under at least one.', ['No: satisfiable means true under exactly one assignment.', 'No: tautologies have no assignments.']),
        137: ('No: a contradiction is false under every assignment.', ['Yes: choose all variables false.', 'Yes: every well-formed formula has a satisfying assignment.']),
        144: ('Tautology: an implication and its contrapositive are equivalent.', ['Contingency: they agree only when p and q are true.', 'Contradiction: reversing the implication always changes its value.']),
        148: ('Valid: whichever of p or q is true forces r.', ['Invalid: r must imply both p and q.', 'Invalid: a disjunction cannot support a conclusion.']),
        153: ('Yes: validity rules out true premises with a false conclusion; it does not assert the premises.', ['No: validity requires every premise to be factually true.', 'Yes: false premises force the conclusion to be true.']),
    }
    for identifier, (correct, wrong) in logic_choices.items():
        recognition(f'propositional-logic-{identifier}', correct, wrong)

    predicate_choices = {
        1: ('True: substituting 5 gives 5 greater than 3.', ['False: substituting 5 gives 5 less than 3.', 'True: P is true for every integer input.']),
        2: ('False: substituting 3 gives 3 greater than 3, which fails.', ['True: greater than includes equality.', 'False: 3 is not an integer input.']),
        3: ('False: substituting -4 gives -4 greater than 3, which fails.', ['True: negative integers are greater than positive integers.', 'False: the predicate excludes negative inputs.']),
        4: ('True: substitution gives 1 + 2 times 3 = 7.', ['False: substitution gives 3 + 2 times 1 = 5.', 'True: every pair of integer inputs gives 7.']),
        5: ('False: substitution gives 3 + 2 times 1 = 5, not 7.', ['True: substitution gives 1 + 2 times 3 = 7.', 'False: unequal inputs are forbidden.']),
        7: ('Closed: both x and y are bound.', ['Open: y is bound by an existential quantifier.', 'Open: the interpretation of R is unspecified.']),
        11: ('True: the possible squares are 0, 1 and 4, all nonnegative.', ['False: negative inputs have negative squares.', 'False: zero is not positive.']),
        12: ('False: the possible squares are 0, 1 and 4.', ['True: x=2 has square 2.', 'True: square root of 2 belongs to the stated domain.']),
        13: ('False: x=0 has square 0.', ['True: squares are nonnegative.', 'False: x=-2 has a negative square.']),
        14: ('True: x=-2 is a witness.', ['False: x+2 is always positive.', 'True: x=2 is a witness.']),
        15: ('True: every domain element is at most 2.', ['False: x=3 is a counterexample in the domain.', 'False: negative integers are greater than 3.']),
        16: ('False: the largest domain element is 2.', ['True: x=3 is a witness in the domain.', 'True: x=2 is greater than 2.']),
        17: ('True: every integer is either odd or even.', ['False: zero has neither parity.', 'False: negative integers have neither parity.']),
        18: ('False: no integer is both odd and even.', ['True: zero is both odd and even.', 'True: the domain contains both odd and even elements.']),
        51: ('True: for each integer x, choose the integer y=x+1.', ['False: there is no single greatest integer.', 'True: choose y=x.']),
        52: ('False: any proposed fixed y fails when x=y.', ['True: choose y=x+1 after seeing x.', 'True: choose the largest integer y.']),
        53: ('True: choose the integer y=-x for each x.', ['False: no single y works for every x.', 'True: choose y=x for every x.']),
        54: ('False: for any fixed y, x=1-y makes the sum 1.', ['True: choose y=-x after seeing x.', 'True: choose y=0 for every integer x.']),
        55: ('True: y=1 works for every x; permitted dependence need not be used.', ['False: y must actually change with x.', 'True: y=0 works for every x.']),
        56: ('True: the single integer y=1 works for every x.', ['False: the witness must depend on x.', 'True: choose y=x separately for each x.']),
        57: ('True: for each element, choose the other element.', ['False: no single y differs from both elements.', 'True: choose y=x.']),
        58: ('False: for any fixed y, the choice x=y defeats it.', ['True: each x has some different y.', 'True: choose y=0 for every x.']),
        59: ('Exists-y for every-x is stronger: one fixed witness works for every x.', ['For every-x exists-y is stronger: its witness must be fixed.', 'They are equivalent: mixed quantifiers always commute.']),
        60: ('Both swaps are valid: universal pairs check all choices; existential pairs ask for a choice.', ['Only universal quantifiers can be swapped.', 'Neither swap is valid because quantifier order always matters.']),
        61: ('False over integers; true over reals, with witness square root of 2.', ['True over both domains because 2 is an integer.', 'False over both domains because no integer squares to 2.']),
        62: ('True on Z: no integer lies between 0 and 1. False on R: x=1/2 fails.', ['True on both domains because every square exceeds its input.', 'False on both domains because x=1/2 is an integer counterexample.']),
        64: ('False: x=0 has no reciprocal.', ['True: choose y=1/x for every real x.', 'False: positive inputs have no reciprocal.']),
        66: ('False: no nonnegative integer is smaller than 0.', ['True: always choose m=n-1 in the stated domain.', 'True: always choose m=0.']),
        67: ('True: m=n-1 is an integer smaller than n.', ['False: there is a smallest integer.', 'False: negative integers have no predecessors.']),
        68: ('No: 3 has odd square, so the antecedent fails.', ['Yes: 3 is odd.', 'Yes: a false antecedent refutes an implication.']),
        73: ('True: zero solutions is at most one solution.', ['False: at most one means exactly one.', 'False: the two integer solutions are 1 and -1.']),
        76: ('There are no witnesses, or there are at least two distinct witnesses.', ['There is one witness, or there are two names for it.', 'There are finitely many witnesses, or infinitely many.']),
        77: ('Universal true; existential false: no counterexample and no witness.', ['Both false because the domain is empty.', 'Both true because the domain is empty.']),
        79: ('True, and no existence is asserted: every antecedent is false.', ['False because no large file exists.', 'True, so at least one large file must exist.']),
        80: ('Implication formula true; conjunction formula false: false implies false is true.', ['Both false because both predicates are false.', 'Both true because the domain has an element.']),
        81: ('Yes: both require every element to satisfy both predicates.', ['No: universal quantifiers cannot distribute over conjunction.', 'Yes: each predicate may hold only at a different element.']),
        82: ('Yes: a witness for either predicate establishes the disjunction.', ['No: both predicates need the same witness.', 'Yes: every element must satisfy both predicates.']),
        85: ('Yes: the predicate true everywhere makes each local disjunction true.', ['No: the two universal quantifiers must have different domains.', 'Yes: the premise forces both predicates to hold everywhere.']),
        86: ('Yes: the common witness works for both separate existential claims.', ['No: separate claims cannot share a witness.', 'Yes: the two witnesses must be distinct.']),
        88: ('Yes: denying every possible witness says each object fails P.', ['No: no P-object means no objects exist.', 'No: the universal requires a P-object.']),
        90: ('Equivalent for nonempty domains; on an empty domain B=false separates them.', ['Equivalent even on empty domains because quantifiers always distribute.', 'Never equivalent because B has no bound variable.']),
        91: ('Valid: instantiate the universal statement at the domain element a.', ['Invalid: a universal cannot describe a named element.', 'Valid: the premise says only that some element satisfies P.']),
        92: ('Valid: a supplies the required existential witness.', ['Invalid: existence requires two witnesses.', 'Valid: the premise implies P holds for every element.']),
        93: ('Invalid: an existential witness need not be the previously fixed a.', ['Valid: every fixed a is the existential witness.', 'Valid: existence implies universality.']),
        94: ('Valid: the P-witness also satisfies Q by the universal implication.', ['Invalid: existential witnesses cannot be used with universal statements.', 'Valid: Q implies P for every element.']),
        100: ('A specially chosen witness was treated as an arbitrary integer.', ['The witness 3 does not satisfy n squared equals 9.', 'Existential witnesses must be unique.']),
        101: ('True: (a,b) is a stated true case.', ['False: (b,a) is not a stated true case.', 'True: every pair in D is related.']),
        102: ('False: (b,a) is not a stated true case.', ['True: (a,b) is true, so symmetry follows.', 'True: every pair in D is related.']),
        103: ('True: every row has a true entry.', ['False: no column is entirely true.', 'True: one fixed y works for every x.']),
        104: ('False: no column is entirely true.', ['True: every row has a true entry.', 'True: y=b works for every x.']),
        105: ('True: every column has a true entry.', ['False: no row is entirely true.', 'True: one fixed x works for every y.']),
        106: ('False: no row is entirely true.', ['True: every column has a true entry.', 'True: x=a works for every y.']),
        107: ('False: a is related to both a and b.', ['True: every row has at least one true entry.', 'False: b has no related element.']),
        108: ('True: R(a,a) is a witness.', ['False: R(b,b) is false.', 'True: every diagonal entry is true.']),
        109: ('False: R(a,b) is true but R(b,a) is false.', ['True: R(b,c) and R(c,b) are both true.', 'True: a true diagonal entry guarantees symmetry.']),
        110: ('True: use a to b, b to c, and c to b.', ['False: R(a,a) is true.', 'True: every pair of distinct elements is related.']),
        118: ('every returns true; some returns false; a finite sample does not prove an infinite universal.', ['Both return false; a finite sample proves any universal.', 'Both return true; empty arrays establish existence.']),
        119: ('A valid input with an incorrect output refutes it; an invalid input does not.', ['Any incorrect output refutes it, even for an invalid input.', 'A valid input with a correct output refutes it.']),
    }
    for identifier, (correct, wrong) in predicate_choices.items():
        recognition(f'predicates-and-quantifiers-{identifier}', correct, wrong)

    for identifier, expected, predicates, domain in [
        (41, 'exists x in D (!P(x))', {'P': 1}, 'D'),
        (42, 'forall x in D (!P(x))', {'P': 1}, 'D'),
        (43, 'exists n in Z (n<=0)', {}, 'Z'),
        (44, 'forall n in Z (n>=0|!P(n))', {'P': 1}, 'Z'),
        (45, 'exists x in D (P(x)&!Q(x))', {'P': 1, 'Q': 1}, 'D'),
        (46, 'forall x in D (!P(x)|!Q(x))', {'P': 1, 'Q': 1}, 'D'),
        (47, 'exists x in D forall y in D (!R(x,y))', {'R': 2}, 'D'),
        (48, 'forall x in D exists y in D (!R(x,y))', {'R': 2}, 'D'),
        (49, 'exists x in D (P(x)&forall y in D (!R(x,y)))', {'P': 1, 'R': 2}, 'D'),
        (50, 'forall x in D exists y in D (R(x,y)&!S(y))', {'R': 2, 'S': 1}, 'D'),
    ]:
        alternate = re.sub(r'\bx\b', 'u', re.sub(r'\by\b', 'v', re.sub(r'\bn\b', 't', expected)))
        wrong = expected.replace('exists', 'forall', 1) if expected.startswith('exists') else expected.replace('forall', 'exists', 1)
        append(f'predicates-and-quantifiers-{identifier}',
               [{'id': 'formula', 'kind': 'math', 'label': 'Negated formula',
                 'hint': f'Include each domain, for example “forall x in {domain}”. Use ! for NOT, & for AND, and | for OR; TeX is also accepted.'}],
               [requirement('formula', 'quantified-formula', ['formula'], {'expected': expected, 'domains': [domain], 'predicates': predicates, 'form': 'nnf'},
                            'The negation preserves domains and scope, with negation only on predicates or comparisons.')], {'formula': expected},
               'The student writes the quantified formula. The validator preserves binding order and domain while accepting renamed bound variables and reordered conjunctions/disjunctions.',
               capabilities=['math-text'], test_cases=[{'response': {'formula': s}, 'verdict': verdict} for s, verdict in
                                                     [(expected, 'correct'), (alternate, 'correct'), (wrong, 'incorrect')]]
               + [{'response': {}, 'error': True}])

    for identifier, predicates, conditions, values, alternatives in [
        (83, ['P', 'Q'], [('(pa|qa)&(pb|qb)', True), ('(pa&pb)|(qa&qb)', False)], [True, False, False, True], [[False, True, True, False]]),
        (84, ['P', 'Q'], [('(pa|pb)&(qa|qb)', True), ('(pa&qa)|(pb&qb)', False)], [True, False, False, True], [[False, True, True, False]]),
        (87, ['P', 'Q'], [('!(((pa->qa)&(pb->qb))<->((pa&pb)->(qa&qb)))', True)], [True, False, False, False], [[False, False, True, False]]),
        (89, ['P'], [('!(pa&pb)', True), ('!pa&!pb', False)], [True, False], [[False, True]]),
        (95, ['P', 'Q'], [('(pa->qa)&(pb->qb)', True), ('qa|qb', True), ('pa|pb', False)], [False, True, False, False], [[False, False, False, True]]),
        (96, ['P', 'Q'], [('(pa|pb)&(qa|qb)', True), ('(pa&qa)|(pb&qb)', False)], [True, False, False, True], [[False, True, True, False]]),
    ]:
        fields = [predicate.lower()+v for v in ['a', 'b'] for predicate in predicates]
        inputs = [decision('decision', 'Does the claim hold?', [('yes', 'Yes'), ('no', 'No')]),
                  {'id': 'interpretation', 'kind': 'grid', 'label': 'Counterexample on D = {a, b}', 'columns': predicates,
                   'rows': [{'label': v, 'cells': [{'id': predicate.lower()+v, 'kind': 'boolean'} for predicate in predicates]} for v in ['a', 'b']]}]
        response = {'decision': 'no', **dict(zip(fields, values))}
        reqs = [choice_requirement('decision', 'no', 'The proposed inference or equivalence fails.'),
                requirement('countermodel', 'boolean-model', fields,
                            {'variables': {f: f for f in fields}, 'conditions': [{'formula': f, 'value': b} for f, b in conditions], 'checks': {}},
                            'The constructed interpretation actually refutes the inference or equivalence.')]
        prompt = exercises[f'predicates-and-quantifiers-{identifier}']['publishedQuestion']['prompt']
        prompt = re.sub(r'Explain why it holds, or give a \[domain\].*?fail\.|Explain, giving a counterexample interpretation if it does not\.', '', prompt).strip()
        prompt += '\n\nSelect the decision and construct a counterexample on the two-element domain $D=\\{a,b\\}$ by assigning the predicate truth values.'
        append(f'predicates-and-quantifiers-{identifier}', inputs, reqs, response,
               'The revised prompt explicitly asks for a finite two-element countermodel. The complete constructed interpretation establishes the failure without a prose argument; this is production evidence.',
               prompt=prompt, capabilities=['tap'], test_cases=[{'response': response, 'verdict': 'correct'}]
               + [{'response': {'decision': 'no', **dict(zip(fields, vals))}, 'verdict': 'correct'} for vals in alternatives]
               + [{'response': {'decision': 'no', **{f: False for f in fields}}, 'verdict': 'incorrect'}, {'response': {}, 'error': True}])

    def quantified(identifier, expected, predicates, domains, *, alternatives=None, constants=None, free=None, choice=None, wrong=None, lesson='predicates-and-quantifiers', notation=None, functions=None, named_sets=None, form=None):
        inputs = [{'id': 'formula', 'kind': 'math', 'label': 'Formula',
                   'hint': 'Use forall / exists with domains '+', '.join(domains)+', or equivalent TeX notation.'}]
        params = {'expected': expected, 'domains': domains, 'predicates': predicates}
        if functions:
            params['functions'] = functions
        if named_sets:
            params['sets'] = named_sets
        if form:
            params['form'] = form
        if alternatives:
            params['alternatives'] = alternatives
        if constants:
            params['constants'] = constants
            inputs[0]['hint'] = 'Use the named objects '+', '.join(constants)+'; & means AND and | means OR. TeX is also accepted.'
        if free:
            params['freeVariables'] = free
        if notation:
            inputs[0]['hint'] += ' '+notation
        reqs = [requirement('formula', 'quantified-formula', ['formula'], params, 'The formula has the requested quantifiers, domain, binding and meaning.')]
        response = {'formula': expected}
        tests = [{'response': {'formula': s}, 'verdict': 'correct'} for s in [expected]+(alternatives or [])]
        tests += [{'response': {'formula': s}, 'verdict': 'incorrect'} for s in (wrong or [])]
        if choice:
            field, label, options, expected_choice = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected_choice, 'The interpretation of the formula is correct.'))
            response[field] = expected_choice
            for test in tests:
                test['response'][field] = expected_choice
            tests.append({'response': {**response, field: next(k for k, _ in options if k != expected_choice)}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(f'{lesson}-{identifier}', inputs, reqs, response,
               'Ordinary formula entry preserves construction. Named objects and free variables retain their identities; bound variables may be renamed without capture.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)

    quantified(10, 'forall t in D R(t,y)', {'R': 2}, ['D'], free=['y'],
               alternatives=['forall z in D R(z,y)'], wrong=['forall y in D R(y,y)', 'forall t in D R(y,t)'],
               choice=('reason', 'Why not rename x to y?', [('capture', 'It would bind the formerly free y.'), ('existence', 'It would introduce an existential quantifier.'), ('domain', 'y cannot belong to the domain.')], 'capture'))
    quantified(19, 'P(a)&P(b)&P(c)', {'P': 1}, ['D'], constants=['a', 'b', 'c'], alternatives=['P(c)&P(a)&P(b)'], wrong=['P(a)|P(b)|P(c)', 'P(a)&P(b)'])
    quantified(20, 'P(a)|P(b)|P(c)', {'P': 1}, ['D'], constants=['a', 'b', 'c'], alternatives=['P(c)|P(a)|P(b)'], wrong=['P(a)&P(b)&P(c)', 'P(a)|P(b)'])
    quantified(74, 'exists x in D (P(x)&forall y in D (P(y)->y=x))', {'P': 1}, ['D'],
               alternatives=['exists x in D forall y in D (P(y)<->y=x)', 'exists x in D (P(x)&forall y in D (y!=x->!P(y)))'],
               wrong=['exists x in D P(x)', 'forall x in D forall y in D ((P(x)&P(y))->x=y)'])
    quantified(75, 'forall x in D forall y in D ((P(x)&P(y))->x=y)', {'P': 1}, ['D'],
               alternatives=['forall x in D (P(x)->forall y in D (P(y)->x=y))', '!exists x in D exists y in D (P(x)&P(y)&x!=y)'],
               wrong=['exists x in D P(x)', 'forall x in D P(x)'])
    quantified(117, 'exists r in R forall w in W !A(r,w)', {'A': 2}, ['R', 'W'],
               alternatives=['exists x in R forall y in W !A(x,y)'], wrong=['forall r in R exists w in W !A(r,w)'],
               choice=('interpretation', 'Interpretation', [('unserved', 'At least one request has no assigned worker.'), ('none', 'No request has any assigned worker.'), ('idle', 'At least one worker has no request.')], 'unserved'))
    quantified(116, 'forall r in R exists! w in W A(r,w)', {'A': 2}, ['R', 'W'],
               alternatives=['forall r in R exists w in W (A(r,w)&forall v in W (A(r,v)->v=w))'],
               wrong=['exists! w in W forall r in R A(r,w)', 'forall r in R exists w in W A(r,w)'],
               choice=('sharing', 'May one worker serve two requests?', [('yes', 'Yes: uniqueness applies separately to each request.'), ('no', 'No: each worker can appear only once.')], 'yes'))
    quantified(2, 'exists k in Z (n=d*k)', {}, ['Z'], free=['d', 'n'], lesson='direct-proof',
               alternatives=['exists t in Z (d*t=n)'], wrong=['exists k in Z (d=n*k)'],
               choice=('zero', 'Is d = 0 excluded?', [('allowed', 'No: zero divides exactly zero.'), ('excluded', 'Yes: divisors must be nonzero.')], 'allowed'))

    for lesson, choices in {
        'sets-and-set-operations': {
            10: ('Each membership implication implies itself; the empty set has no violating element.', ['Reflexive inclusion requires at least one element.', 'The empty set contains every element.']),
            20: ('The first pair is not disjoint because of 4; the empty set is disjoint from itself.', ['Both pairs are disjoint because their elements are distinct.', 'Neither pair is disjoint because a set cannot be disjoint from itself.']),
            51: ('Yes: both blocks are nonempty, disjoint, and together cover the set.', ['No: every partition must have singleton blocks.', 'No: blocks of the same size cannot form a partition.']),
            54: ('No: it includes an empty block.', ['Yes: coverage alone defines a partition.', 'No: its blocks overlap.']),
            55: ('The empty collection of blocks: its union is empty and no block violates the requirements.', ['The collection containing the empty set: its empty block is allowed.', 'There is no partition because every set needs a nonempty block.']),
            59: ('Union is empty; intersection is U, by the existential and universal membership conditions.', ['Both are empty because the index set is empty.', 'Both are U because there are no restrictions.']),
            71: ('Membership was confused with inclusion: the empty set is always a subset, not always a member.', ['Every subset is automatically a member.', 'The empty set is never a member of any set.']),
            72: ('Prove B is a subset of A; one-way inclusion permits extra elements in B.', ['Nothing remains: one-way inclusion is equality.', 'Prove A and B are nonempty; nonempty subsets are equal.']),
            77: ('No: every member of the intersection is already a member of A.', ['Yes: an intersection counts overlapping elements twice.', 'Yes: choose B larger than A.']),
        },
        'relations': {
            10: ('No: {(1,1)} is reflexive on {1}, but not on {1,2}.', ['Yes: a relation with any loop is reflexive on every set.', 'Yes: reflexivity depends only on the number of pairs.']),
            16: ('Transitive, but not reflexive: the only two-step chain has its shortcut; loops are absent.', ['Reflexive and transitive because all objects occur.', 'Neither: transitivity requires every possible pair.']),
            19: ('Yes: no two related pairs form a composable chain.', ['No: the pair (1,3) is missing.', 'No: a transitive relation must contain a loop.']),
            27: ('Mutual divisibility gives positive integer multipliers with product 1; both are 1, so the objects are equal.', ['Every two positive integers divide one another.', 'A positive divisor must equal the number it divides.']),
            33: ('Yes: 1 and 9 have the same remainder modulo 4.', ['No: equal classes must have equal representatives.', 'No: 9 is larger than the modulus.']),
            41: ('Inclusion is reflexive, antisymmetric and transitive; {1} and {2} are incomparable.', ['Inclusion is not a partial order because {1} and {2} are incomparable.', 'Inclusion is total because every pair of subsets has the same size.']),
            48: ('Intermediate subsets {1} and {2} prevent that comparison from being a cover.', ['There is no inclusion from the empty set to a nonempty set.', 'Hasse diagrams omit every edge incident to the empty set.']),
            49: ('b and c are incomparable; a precedes d through an upward two-edge path.', ['b precedes c because both precede d; a does not precede d.', 'b and c are comparable because they have the same depth.']),
            50: ('A strict cycle gives comparisons both ways between distinct elements, contradicting antisymmetry.', ['Every partial order is a total order, so branching is impossible.', 'A strict cycle would violate reflexivity because it has edges.']),
            58: ('Empty: no first relation pair can supply an intermediate object.', ['The second relation: composing with empty changes nothing.', 'The full relation: an empty condition is always satisfied.']),
            69: ('At most n squared pairs can be added, and productive steps never remove pairs.', ['The process stops after exactly n steps.', 'Every added pair reduces the size of the underlying set.']),
            71: ('Antisymmetry allows loops; distinct objects cannot relate in both directions.', ['Antisymmetry forbids loops and every reverse arrow.', 'Antisymmetry requires every arrow to have a reverse.']),
            78: ('Yes, exactly equality: reflexivity requires loops; symmetry and antisymmetry exclude other pairs.', ['No: equivalence and order properties are incompatible.', 'Yes, the full relation, because every pair is present.']),
        },
        'functions': {
            1: ('Yes: every domain element has exactly one output; outputs may be shared.', ['No: distinct inputs must always have distinct outputs.', 'No: every relation pair must use a different codomain element.']),
            7: ('Domain Z, codomain Z, image the odd integers.', ['Domain Z, codomain the odd integers, image Z.', 'Domain and image the odd integers, codomain Z.']),
            8: ('Their codomains differ; only the specification with nonnegative codomain is onto.', ['They are identical specifications because the formulas match.', 'Their domains differ, so only one is a function.']),
            20: ('A preimage is the set of all inputs mapping into the target set; an inverse function is unnecessary.', ['A preimage exists only for bijective functions.', 'A preimage chooses exactly one input for each target.']),
            28: ('Surjective only: 0 is reached, but three distinct inputs share it.', ['Bijective: the codomain has only one element.', 'Injective only: the three inputs are distinct.']),
            34: ('A positive target has two preimages; a function cannot return both as a single real output.', ['The square function misses every nonnegative target.', 'An inverse function must have the same formula as the original.']),
            37: ('No: input 0 produces 0, outside the proposed codomain.', ['Yes: a codomain may omit outputs the function actually produces.', 'Yes: all real squares are at least 1.']),
            40: ('The other composition must also fix every codomain element, including any missed targets.', ['One composition always implies the other.', 'It is enough to verify the first identity at a single input.']),
            53: ('The unique empty function is bijective: neither injectivity nor surjectivity has a counterexample.', ['It is neither, because bijections require a nonempty domain.', 'It is injective but not onto because no output is produced.']),
            77: ('The preimage must be an integer; odd targets give a value outside the domain.', ['The preimage must be positive; all negative targets are forbidden.', 'The output must be even because the codomain contains only even integers.']),
        },
    }.items():
        for identifier, (correct, wrong) in choices.items():
            recognition(f'{lesson}-{identifier}', correct, wrong)

    for key, label, value, reason, distractors in [
        ('sets-and-set-operations-33', 'Number of subsets', 32, 'Each of five elements is independently included or excluded.', ['Every subset must contain exactly one element.', 'Only the ordering of all five elements matters.']),
        ('sets-and-set-operations-45', 'Minimum intersection size', 7, 'Disjointness is impossible: the union has at most 20 members.', ['Disjointness is possible because each set has fewer than 20 members.', 'The intersection must have the smaller set’s full size.']),
        ('sets-and-set-operations-49', 'Net coefficient', 1, 'Three individual counts, minus three pair counts, plus one triple count.', ['Three individual counts plus three pair counts.', 'One individual count minus one triple count.']),
        ('sets-and-set-operations-78', 'Set size', 12, 'Partition blocks are pairwise disjoint, so no overlap is counted twice.', ['All partition blocks have the same members.', 'A partition always has one block.']),
        ('relations-8', 'Number of relations', 64, 'Each of the six ordered pairs is independently included or excluded.', ['Each input must choose exactly one output.', 'Every relation must include all six ordered pairs.']),
        ('relations-79', 'Least element', 0, 'There is no greatest or maximal element: n+1 is always larger.', ['Zero is also greatest and maximal.', 'There is a maximal element but no greatest element.']),
        ('functions-51', 'Number of functions', 1, 'The empty function is injective because no distinct inputs can collide.', ['No function exists because the domain is empty.', 'The empty function is not injective because it has no outputs.']),
        ('functions-56', 'Number of injective functions', 24, 'Successive inputs have 4, then 3, then 2 unused output choices.', ['Each input has all four output choices independently.', 'The three inputs must use all four targets.']),
        ('functions-68', 'Number of containers', 0, 'The ceiling of 0/k is 0 for positive k.', ['At least one container is needed even when there are no items.', 'Division by a positive capacity is undefined at zero.']),
    ]:
        expressions(key, [], [(label, value)], choice=('reason', 'Reason', [('reason', reason)]+[(f'wrong-{i}', s) for i, s in enumerate(distractors)], 'reason'))

    def sets(key, answers, atoms=None, numbers=None):
        inputs, reqs, response, reordered = [], [], {}, {}
        for i, (label, expected) in enumerate(answers):
            field = f'set-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label,
                           'hint': 'Enter a set with braces; use parentheses for ordered pairs and {} for the empty set.'})
            params = {'expected': expected}
            if atoms:
                params['atoms'] = atoms
            reqs.append(requirement(field, 'set', [field], params, 'Exactly the requested members are present, with order preserved inside ordered pairs.'))
            response[field] = '{'+','.join(expected)+'}'
            reordered[field] = '{'+','.join(reversed(expected))+'}'
        for i, (label, value) in enumerate(numbers or []):
            field = f'value-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label})
            reqs.append(requirement(field, 'exact', [field], {'expected': [str(value)]}, 'The requested value is correct.'))
            response[field] = reordered[field] = str(value)
        first = next(iter(response))
        wrong = {**response, first: '{}'} if answers[0][1] else {**response, first: '{1}'}
        append(key, inputs, reqs, response,
               'Ordinary typed set notation preserves answer creation, including nested sets and ordered pairs. The checker ignores only outer set order and duplicate members.',
               capabilities=['math-text'], test_cases=[{'response': response, 'verdict': 'correct'}, {'response': reordered, 'verdict': 'correct'},
                                                       {'response': wrong, 'verdict': 'incorrect'}, {'response': {}, 'error': True}])

    sets('sets-and-set-operations-31', [('Power set', ['{}', '{a}', '{b}', '{a,b}'])], ['a', 'b'])
    sets('sets-and-set-operations-32', [('Power set', ['{}'])], numbers=[('Size', 1)])
    sets('sets-and-set-operations-35', [('Cartesian product', ['(0,a)', '(0,b)', '(1,a)', '(1,b)'])], ['a', 'b'])
    sets('relations-3', [('Outputs related to 1', ['u']), ('Outputs related to 2', ['v', 'w'])], ['u', 'v', 'w'])
    for identifier, pairs, atoms in [
        (5, ['(a,b)', '(b,a)', '(b,b)'], ['a', 'b']),
        (6, ['(a,b)', '(b,c)', '(c,c)'], ['a', 'b', 'c']),
        (7, ['(1,a)', '(2,a)', '(2,b)'], ['a', 'b']),
        (40, ['(a,a)', '(a,c)', '(c,a)', '(c,c)', '(b,b)'], ['a', 'b', 'c']),
        (42, ['({},{1})', '({},{2})', '({1},{1,2})', '({2},{1,2})'], []),
        (51, ['(1,u)', '(2,v)'], ['u', 'v']),
        (52, ['(1,u)', '(1,v)', '(2,v)'], ['u', 'v']),
        (54, ['(1,3)'], []), (55, ['(1,1)', '(2,2)'], []),
        (61, ['(a,a)', '(b,b)', '(c,c)', '(a,b)', '(b,c)'], ['a', 'b', 'c']),
        (62, ['(a,b)', '(b,a)', '(b,c)', '(c,b)'], ['a', 'b', 'c']),
        (63, ['(a,b)', '(b,c)', '(a,c)'], ['a', 'b', 'c']),
        (64, ['(1,3)', '(2,4)', '(1,4)'], []),
        (65, ['(a,a)', '(a,b)', '(b,a)', '(b,b)'], ['a', 'b']),
        (66, ['(1,1)', '(2,2)', '(3,3)', '(1,2)'], []),
        (67, [f'({a},{b})' for a, b in product('abc', repeat=2)], ['a', 'b', 'c']),
    ]:
        sets(f'relations-{identifier}', [('Requested pairs', pairs)], atoms)
    sets('relations-37', [('Partition', ['{0,3,6}', '{1,4,7}', '{2,5}'])])
    sets('relations-38', [('Equivalence class', ['00', '01', '10', '11'])], ['00', '01', '10', '11'])
    sets('relations-43', [('Cover pairs', ['(1,2)', '(1,3)', '(2,6)', '(3,6)'])], numbers=[('Least element', 1), ('Greatest element', 6)])
    sets('functions-17', [('$f(\\varnothing)$', []), ('$f^{-1}(\\varnothing)$', [])])
    sets('functions-39', [('Inverse pairs', ['(2,a)', '(1,b)'])], ['a', 'b'])
    sets('functions-46', [('Composite pairs', ['(a,u)', '(b,v)'])], ['a', 'b', 'u', 'v'])

    fields = [f'cell-{r}-{c}' for r in range(1, 4) for c in range(1, 4)]
    matrix = [['1', '0', '1'], ['0', '1', '0'], ['1', '0', '0']]
    response = dict(zip(fields, sum(matrix, [])))
    append('relations-4', [{'id': 'matrix', 'kind': 'grid', 'label': 'Boolean matrix', 'columns': ['1', '2', '3'],
                            'rows': [{'label': str(r), 'cells': [{'id': f'cell-{r}-{c}', 'kind': 'text'} for c in range(1, 4)]} for r in range(1, 4)]}],
           [requirement('matrix', 'matrix', fields, {'expected': matrix}, 'An entry is one exactly for a related pair.')], response,
           'The supplied row and column labels remove matrix formatting while preserving every constructed entry.', capabilities=['math-text'])
    for identifier, names, values in [
        (11, ['Reflexive', 'Symmetric', 'Antisymmetric', 'Transitive'], [True, False, True, True]),
        (22, ['Reflexive', 'Irreflexive', 'Symmetric', 'Antisymmetric', 'Asymmetric', 'Transitive'], [False, True, False, True, True, True]),
    ]:
        fields = [n.lower() for n in names]
        response = dict(zip(fields, values))
        append(f'relations-{identifier}', [{'id': 'properties', 'kind': 'grid', 'label': 'Properties that hold', 'columns': names,
                                           'rows': [{'cells': [{'id': f, 'kind': 'boolean'} for f in fields]}]}],
               [requirement('properties', 'boolean', fields, {'expected': values}, 'Each property is classified separately.')], response,
               'The prompt asks only for classification; a compact truth-value row covers every named property.',
               capabilities=['tap'], level='recognition')
    for identifier, reasons in {
        12: [('Reflexive', 'No: neither loop is present.', 'Yes: every element occurs in a pair.'),
             ('Symmetric', 'Yes: both pairs have their reverse.', 'No: there are no loops.'),
             ('Antisymmetric', 'No: distinct objects relate in both directions.', 'Yes: there are no loops.'),
             ('Transitive', 'No: the chain 1,2,1 lacks its loop shortcut.', 'Yes: every pair has a reverse.')],
        13: [('Reflexive', 'Yes: every diagonal pair is present.', 'No: distinct elements are unrelated.'),
             ('Symmetric', 'Yes: each loop is its own reverse.', 'No: reverses must connect distinct elements.'),
             ('Antisymmetric', 'Yes: relatedness forces equal objects.', 'No: loops violate antisymmetry.'),
             ('Transitive', 'Yes: every composable chain is the same loop.', 'No: there are no chains of distinct elements.')],
        14: [('Reflexive', 'Yes: all loops are included.', 'No: nonloop pairs are also included.'),
             ('Symmetric', 'Yes: all reverse pairs are included.', 'No: both directions cannot coexist.'),
             ('Antisymmetric', 'No: 1 and 2 relate in both directions.', 'Yes: every loop is present.'),
             ('Transitive', 'Yes: every possible shortcut is included.', 'No: there are too many pairs.')],
        15: [('Reflexive', 'No: the required loops are missing.', 'Yes: no pair violates reflexivity.'),
             ('Symmetric', 'Yes: no pair lacks its required reverse.', 'No: symmetry requires at least one pair.'),
             ('Antisymmetric', 'Yes: no distinct elements relate both ways.', 'No: antisymmetry requires all loops.'),
             ('Transitive', 'Yes: no two-step chain lacks a shortcut.', 'No: transitivity requires a chain.')],
        21: [('Reflexive', 'Yes: every integer is at most itself.', 'No: equal integers cannot be compared.'),
             ('Symmetric', 'No: 1 is at most 2, but 2 is not at most 1.', 'Yes: every comparison can be reversed.'),
             ('Antisymmetric', 'Yes: inequalities in both directions force equality.', 'No: equal inputs relate in both directions.'),
             ('Transitive', 'Yes: a at most b and b at most c imply a at most c.', 'No: a shortcut requires consecutive integers.')],
    }.items():
        inputs, reqs, response = [], [], {}
        for name, correct, wrong in reasons:
            field = name.lower()
            opts = [('correct', correct), ('incorrect', wrong)]
            if (identifier+len(field)) % 2:
                opts.reverse()
            inputs.append(decision(field, name, opts))
            reqs.append(choice_requirement(field, 'correct', f'The {name.lower()} decision has the correct reason.'))
            response[field] = 'correct'
        tests = [{'response': response, 'verdict': 'correct'}, {'response': {}, 'error': True}]
        tests += [{'response': {**response, f: 'incorrect'}, 'verdict': 'incorrect'} for f in response]
        append(f'relations-{identifier}', inputs, reqs, response,
               'Each requested property keeps its own concise decision and reason. This is recognition of finite defining conditions, not a general proof.',
               prompt=exercises[f'relations-{identifier}']['publishedQuestion']['prompt'].replace('Justify each decision.', 'Select each decision and its reason.'),
               capabilities=['tap'], level='recognition', test_cases=tests)
    witness('relations-17', [('a', 'First object', integer), ('b', 'Middle object', integer), ('c', 'Last object', integer)],
            [('a', '=', '1'), ('b', '=', '2'), ('c', '=', '3')], [1, 2, 3], [['2/2', 2, 3]], [[1, 1, 2], [3, 2, 1]])
    witness('relations-23', [('a', 'First integer', integer), ('b', 'Middle integer', integer), ('c', 'Last integer', integer)],
            [('a', '!=', 'b'), ('b', '!=', 'c'), ('a', '=', 'c')], [1, 2, 1], [[0, -3, 0], [2, 1, 2]], [[1, 2, 3], [1, 1, 1]],
            choice=('transitive', 'Transitive?', [('yes', 'Yes'), ('no', 'No')], 'no'))
    witness('relations-28', [('a', 'First integer', integer), ('b', 'Second integer', integer)],
            [('a', 'divides', 'b'), ('b', 'divides', 'a'), ('a', '!=', 'b')], [2, -2], [[-3, 3], [1, -1]], [[0, 0], [2, 2], [2, 4]])

    from deterministic_proof_decisions import author as author_proof_decisions
    author_proof_decisions(recognition)

    witness('direct-proof-47', [('n', 'Integer witness', integer)], [('4', 'divides', 'n'), ('6', 'divides', 'n'), ('5', 'not-divides', 'n')],
            [12], [[-12], [24], [36]], [[60], [6], [0], ['12/5']])
    witness('direct-proof-66', [('a', '$a$', {}), ('b', '$b$', {}), ('c', '$c$', {})],
            [('a*b', '=', 'a*c'), ('b', '!=', 'c')], [0, 1, 2], [[0, -3, 4], [0, '1/2', '3/2']], [[1, 2, 2], [1, 2, 3]],
            choice=('condition', 'Missing assumption', [('nonzero', 'a is nonzero'), ('positive-b', 'b is positive'), ('equal', 'b and c are equal')], 'nonzero'))
    witness('proof-by-contrapositive-46', [('a', 'First input', {}), ('b', 'Second input', {})], [('a', '!=', 'b'), ('a^2', '=', 'b^2')],
            [1, -1], [[-2, 2], ['1/2', '-1/2']], [[0, 0], [1, 2]],
            choice=('reason', 'Why does the argument fail?', [('zero-sum', 'Distinct real inputs can have sum zero.'), ('difference', 'Distinct real inputs can have difference zero.'), ('negative-square', 'Real squares can be negative.')], 'zero-sum'))
    witness('proof-by-contrapositive-66', [('a', 'Negative integer congruent to 1 modulo 3', integer), ('b', 'Negative integer congruent to 2 modulo 3', integer)],
            [('a', '<', '0'), ('b', '<', '0'), ('3', 'divides', 'a-1'), ('3', 'divides', 'b-2')],
            [-2, -1], [[-5, -4], [-8, -7]], [[1, 2], [-1, -2], [-3, -6]])
    for key, values, reason, distractors in [
        ('proof-by-contradiction-47', [('Product plus one', 31)], 'It illustrates the construction; one example does not prove a universal claim.', ['It proves every such product plus one is prime.', 'It proves that there are exactly four primes.']),
        ('proof-by-contradiction-48', [('$59\\cdot509$', 30031)], 'Both factors exceed 1, so this product-plus-one is composite.', ['Every product-plus-one must be prime.', 'A factorization proves the factors belong to the original list.']),
        ('mathematical-induction-50', [('Candidate value at index 0', 0)], 'It satisfies the recurrence but fails the specified initial condition.', ['It satisfies both initial condition and recurrence.', 'It satisfies the initial condition but fails the recurrence.']),
        ('strong-induction-37', [('Candidate value at index 0', 3), ('Candidate value at index 1', 3)], 'The first base fails and the second matches; one failed base rejects the candidate.', ['Both bases match, so the candidate is proved.', 'The second matching base repairs the first failed base.']),
        ('strong-induction-57', [('$t_2$', 2), ('$t_3$', 3), ('$t_4$', 5)], 'The empty rectangle has one empty completion, preserving a valid tiling when no cells remain.', ['The empty rectangle has no tilings because it has no cells.', 'The empty rectangle has two tilings, one for each orientation.']),
    ]:
        expressions(key, [], values, choice=('reason', 'Interpretation', [('reason', reason)]+[(f'wrong-{i}', t) for i, t in enumerate(distractors)], 'reason'))
    expressions('strong-induction-68', [('Length-a piece', 'a-1', ['a'], [], 'a+(-1)'), ('Length-b piece', 'b-1', ['b'], [], 'b+(-1)'),
                                        ('Total, in terms of n', 'n-1', ['n'], [], '1+n-2')])
    sets('strong-induction-30', [('Consecutive bases', [str(n) for n in range(30, 37)])], numbers=[('First usable target', 37)])
    fields = [(f'a{amount}', f'b{amount}') for amount in range(18, 22)]
    counts = [(1, 2), (3, 1), (5, 0), (0, 3)]
    response = {field: str(value) for pair, pairvalues in zip(fields, counts) for field, value in zip(pair, pairvalues)}
    variables = [{'name': f, 'field': f, 'integer': True} for pair in fields for f in pair]
    conditions = [{'left': f, 'op': '>=', 'right': '0'} for pair in fields for f in pair]
    conditions += [{'left': f'4*{a}+7*{b}', 'op': '=', 'right': str(amount)} for amount, (a, b) in zip(range(18, 22), fields)]
    append('strong-induction-21', [{'id': 'counts', 'kind': 'grid', 'label': 'Stamp combinations', 'columns': ['4-unit stamps', '7-unit stamps'],
                                  'rows': [{'label': str(amount), 'cells': [{'id': f, 'kind': 'text'} for f in pair]} for amount, pair in zip(range(18, 22), fields)]}],
           [requirement('counts', 'witness', [f for pair in fields for f in pair], {'variables': variables, 'conditions': conditions},
                        'Each amount is made with nonnegative integer counts of the specified stamps.')], response,
           'The compact count table matches the four requested combinations; each row is checked against its amount without requiring an explanation.',
           capabilities=['math-text'])

    def boolean_written(key, answers, *, choice=None, hint=None, atoms_only=False, wrong_forms=None):
        inputs, reqs, response = [], [], {}
        for i, (label, expected, variables, structure) in enumerate(answers):
            field = f'formula-{i+1}'
            inputs.append({'id': field, 'kind': 'math', 'label': label, **({'hint': hint} if hint else {})})
            params = {'expected': expected, 'variables': variables}
            if structure:
                params['structure'] = structure
            if atoms_only:
                params['negationsOnAtoms'] = True
            reqs.append(requirement(field, 'boolean-formula', [field], params, 'The typed formula has the requested meaning and outer logical structure.'))
            response[field] = expected
        if choice:
            field, label, options, expected = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The accompanying interpretation is correct.'))
            response[field] = expected
        first = next(iter(response))
        tests = [{'response': response, 'verdict': 'correct'}, {'response': {}, 'error': True},
                 {'response': {**response, first: '!('+response[first]+')'}, 'verdict': 'incorrect'}]
        tests += [{'response': {**response, first: s}, 'verdict': 'incorrect'} for s in (wrong_forms or [])]
        if choice:
            tests.append({'response': {**response, choice[0]: next(k for k, _ in choice[2] if k != choice[3])}, 'verdict': 'incorrect'})
        append(key, inputs, reqs, response,
               'The transformation remains an ordinary typed formula. Structural checks distinguish converse, inverse and contrapositive; any requested short explanation is a recognition requirement.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)

    boolean_written('proof-by-contrapositive-1', [('Contrapositive', '!Q->!P', ['P', 'Q'], '!Q->!P')],
                    choice=('reason', 'Why equivalent?', [('false-case', 'Both fail exactly when P is true and Q is false.'), ('reverse', 'Reversing any implication preserves truth.'), ('all-true', 'Both are true under every assignment.')], 'false-case'))
    boolean_written('proof-by-contrapositive-2', [('Converse', 'Q->P', ['P', 'Q'], 'Q->P'), ('Inverse', '!P->!Q', ['P', 'Q'], '!P->!Q')],
                    choice=('equivalence', 'Equivalent to the original in general?', [('no', 'No; the converse and inverse are equivalent to each other.'), ('yes', 'Yes; all three implications are equivalent.')], 'no'))
    boolean_written('proof-by-contrapositive-5', [('Contrapositive', '!Q->!P', ['P', 'Q'], '!Q->!P'), ('Negation', 'P&!Q', ['P', 'Q'], None)])
    for identifier, expected, variables, wrong in [
        (11, '(!Q&!R)->!P', ['P', 'Q', 'R'], '!(Q|R)->!P'),
        (12, '!Q->(!P|!R)', ['P', 'Q', 'R'], '!Q->!(P&R)'),
        (13, '(!Q|!S)->(!P&!R)', ['P', 'Q', 'R', 'S'], '!(Q&S)->!(P|R)'),
    ]:
        boolean_written(f'proof-by-contrapositive-{identifier}', [('Contrapositive', expected, variables, expected)], atoms_only=True, wrong_forms=[wrong])
    boolean_written('propositional-logic-74', [('Contrapositive', '!q->!p', ['p', 'q'], '!q->!p')], hint='Use p for “n squared is even” and q for “n is even”.')
    for identifier, hint in [(89, 'Use p for “the integer is divisible by 8” and q for “the integer is even”.'),
                             (90, 'Use p for “x > 2” and q for “x squared > 4”.')]:
        boolean_written(f'propositional-logic-{identifier}', [('Inverse', '!p->!q', ['p', 'q'], '!p->!q')], hint=hint,
                        choice=('truth', 'Is the inverse true on the stated domain?', [('true', 'True'), ('false', 'False')], 'false'))
    boolean_written('propositional-logic-139', [('First premise', 'p->q', ['p', 'q', 'r'], None), ('Second premise', 'q->r', ['p', 'q', 'r'], None),
                                               ('Third premise', 'p', ['p', 'q', 'r'], None), ('Conclusion', 'r', ['p', 'q', 'r'], None)],
                    hint='p: application accepted; q: interview scheduled; r: confirmation sent.',
                    choice=('reason', 'Validity and reason', [('valid', 'Valid: apply modus ponens twice.'), ('converse', 'Invalid: it affirms the consequent.'), ('invalid', 'Invalid: the final conclusion is independent of the premises.')], 'valid'))
    boolean_written('propositional-logic-151', [('Reordered and regrouped formula', 'p&(q&r)', ['p', 'q', 'r'], 'p&(q&r)')], wrong_forms=['(p&q)&r'])

    for identifier, expected, domain, predicates in [
        (14, 'forall x in R (x^2<=9->x<=3)', 'R', {}),
        (15, 'forall a in Z forall b in Z ((E(a)|E(b))->E(a*b))', 'Z', {'E': 1}),
        (16, 'forall a in Z forall b in Z ((!E(a)&!E(b))->!E(a*b))', 'Z', {'E': 1}),
    ]:
        quantified(identifier, expected, predicates, [domain], lesson='proof-by-contrapositive',
                   wrong=[expected.replace('->', '&')], notation='E(t) means t is even.' if predicates else None)

    for key, values, reason, distractors in [
        ('sequences-and-summations-2', [(f'$a_{n}$', 3*n-2) for n in range(1, 6)], 'Index 1 starts the sequence, so the term at index 0 is excluded.', ['Changing the starting index changes the rule to 3n+2.', 'Index 0 is always part of every sequence.']),
        ('sequences-and-summations-23', [('Sum', 0)], 'No integer lies between the lower bound 1 and upper bound 0.', ['The single term at index 0 must be included.', 'An empty sum equals the first omitted term.']),
        ('sequences-and-summations-58', [('Product', 0)], 'The factor at index 0 is zero.', ['A product over negative indices is always zero.', 'Every symmetric product has an even number of factors.']),
        ('sequences-and-summations-79', [('Sum', 1023), ('Number of terms', 10)], 'Both index endpoints are included.', ['The index 0 contributes no term.', 'Only strictly positive indices count.']),
    ]:
        expressions(key, [], values, choice=('reason', 'Reason', [('correct', reason)]+[(f'wrong-{i}', s) for i, s in enumerate(distractors)], 'correct'))
    for identifier, correct, wrong in [
        (8, 'The initial value a_1 is also needed; different choices produce different sequences.', ['Only a_0 is ever needed for a second-order recurrence.', 'No initial values are needed when a recurrence is given.']),
        (9, 'The sequences differ, but both have the value set {1,2}; a set forgets order and repetition.', ['The sequences are equal because their value sets agree.', 'Their value sets differ because 1 occurs in different positions.']),
        (29, 'The index k varies across terms, so it cannot be treated as a constant.', ['Every summation index is a fixed constant.', 'The sum always contains k terms rather than n terms.']),
        (40, 'An infinite sum needs a definition and convergence argument beyond finite cancellation.', ['Every finite sum formula automatically gives an infinite sum.', 'All infinite series have the value of their last term.']),
        (48, 'At k=0 both sides are undefined; cancellation cannot define the original term.', ['The identity remains valid at zero because infinity cancels.', 'An undefined term can always be omitted from a sum.']),
        (54, 'It is an empty product, whose multiplicative identity is 1.', ['It is an empty sum, whose value is 1.', 'Zero factors must make the product zero.']),
    ]:
        recognition(f'sequences-and-summations-{identifier}', correct, wrong)
    expressions('sequences-and-summations-18', [], [('$a_0$', 9), ('$a_n$ for every $n\\geq1$', 0)])
    expressions('sequences-and-summations-22', [], [('Sum', 18), ('Term count', 6)])
    expressions('sequences-and-summations-53', [], [('Empty product', 1), ('Empty sum', 0)])
    expressions('sequences-and-summations-36', [('Sum', 'N', ['N'], [], '1*N')],
                choice=('reason', 'Why not substitute in the quotient?', [('zero', 'Its denominator is zero when r=1.'), ('no-terms', 'There are no terms when r=1.'), ('infinite', 'The finite sum becomes infinite when r=1.')], 'zero'))
    expressions('sequences-and-summations-70', [('Lower bound from the smallest term', '1', ['n'], ['n'], 'n*(1/n)'),
                                             ('Upper bound from the largest term', 'n', ['n'], [], 'n*1')])
    expressions('sequences-and-summations-76', [('Correct sum', 'N*(2*c+(N-1)*d)/2', ['N', 'c', 'd'], [], 'N*c+N*(N-1)*d/2')],
                choice=('issues', 'The two errors', [('both', 'One copy of c is missing, and N-1 increments were counted as N.'), ('order', 'The terms are unordered, and the first index must be 0.'), ('ratio', 'The ratio should be c, and the term count should be d.')], 'both'))
    witness('sequences-and-summations-66', [('lower', 'Finite lower bound', {}), ('upper', 'Finite upper bound', {})],
            [('lower', '<=', '-24'), ('upper', '>=', '60')], [-24, 60], [[-25, 61], [-100, 100]], [[-23, 60], [-24, 59]])
    witness('sequences-and-summations-69', [('discarded', 'Term to discard', {}), ('kept', 'Term to keep', {})],
            [('discarded', '<', '0'), ('kept', '>', 'discarded+kept')], [-5, 2], [[-1, 0], ['-1/2', -3]], [[1, 2], [0, 2]],
            choice=('always', 'Does discarding always give a lower bound?', [('yes', 'Yes'), ('no', 'No')], 'no'),
            prompt='Is discarding terms always a valid lower-bound operation on a sum of real numbers? If not, give a two-term counterexample, identifying the discarded term and the term kept.')
    append('sequences-and-summations-21', [{'id': 'terms', 'kind': 'math', 'label': 'Expanded terms, in index order', 'hint': 'Separate the terms with commas.'},
                                          {'id': 'sum', 'kind': 'math', 'label': 'Sum'}],
           [requirement('terms', 'tuple', ['terms'], {'expected': ['3', '5', '7', '9'], 'ordered': True}, 'The expansion includes every term in index order.'),
            requirement('sum', 'exact', ['sum'], {'expected': ['24']}, 'The expanded sum is correct.')], {'terms': '3,5,7,9', 'sum': '24'},
           'A single typed term list preserves constructing the expansion without revealing its length through prefilled slots.',
           capabilities=['math-text'], test_cases=[{'response': {'terms': '3,5,7,9', 'sum': '24'}, 'verdict': 'correct'},
                                                  {'response': {'terms': '2*2-1,2*3-1,2*4-1,2*5-1', 'sum': '3+5+7+9'}, 'verdict': 'correct'},
                                                  {'response': {'terms': '3,5,7', 'sum': '15'}, 'verdict': 'incorrect'}, {'response': {}, 'error': True}])

    for identifier, correct, wrong in [
        (22, 'Bijective: equal outputs force equal inputs, and y is reached at (y-1)/3.', ['Injective only: real targets below 1 are missed.', 'Surjective only: opposite inputs always collide.']),
        (23, 'Neither: -1 and 1 collide, and negative targets are missed.', ['Bijective: every real has exactly one real square root.', 'Surjective only: negative targets have negative square roots.']),
        (24, 'Surjective only: every nonnegative target has a square root, but -1 and 1 collide.', ['Bijective: restricting the codomain removes input collisions.', 'Injective only: zero has no preimage.']),
        (25, 'Bijective: each nonnegative target has exactly one nonnegative square root.', ['Surjective only: -1 and 1 are both allowed inputs.', 'Injective only: positive targets are missed.']),
        (26, 'Injective only: cancellation gives equal inputs, but 0 is missed.', ['Bijective: every nonnegative target has a nonnegative predecessor.', 'Neither: consecutive inputs have equal outputs.']),
        (27, 'Surjective only: k is reached at k, but -1 and 1 collide.', ['Bijective: every target has exactly one integer preimage.', 'Injective only: nonnegative targets are missed.']),
        (66, 'Surjective only: each integer maps to itself, but 2.1 and 2.9 collide.', ['Bijective: distinct real numbers always have different floors.', 'Injective only: negative integer targets are missed.']),
    ]:
        recognition(f'functions-{identifier}', correct, wrong,
                    prompt=exercises[f'functions-{identifier}']['publishedQuestion']['prompt'].replace('Justify your answer.', 'Select the classification and reason.'))

    append('functions-10', [{'id': 'pairs', 'kind': 'math', 'label': 'Identity pairs'},
                            decision('reason', 'Why do both compositions equal f?', [('fixed', 'Identity fixes the input or output; domains, codomains, and values agree.'), ('constant', 'Identity sends every input to the same output.'), ('reverse', 'Every composition of functions is commutative.')])],
           [requirement('pairs', 'set', ['pairs'], {'expected': ['(a,a)', '(b,b)', '(c,c)'], 'atoms': ['a', 'b', 'c']}, 'Every element maps to itself.'),
            choice_requirement('reason', 'fixed', 'The identity changes neither the permitted types nor any value.')],
           {'pairs': '{(a,a),(b,b),(c,c)}', 'reason': 'fixed'},
           'The identity is still constructed by typing its pairs; the short explanation is a concise conceptual choice.',
           capabilities=['math-text', 'tap'], test_cases=[
               {'response': {'pairs': p, 'reason': r}, 'verdict': v} for p, r, v in [
                   ('{(a,a),(b,b),(c,c)}', 'fixed', 'correct'), ('{(c,c),(a,a),(b,b)}', 'fixed', 'correct'),
                   ('{(a,a),(b,b)}', 'fixed', 'incorrect'), ('{(a,a),(b,b),(c,c)}', 'reverse', 'incorrect')]])
    append('functions-33', [decision('source', 'Restricted codomain of f / domain of its inverse', [('even', 'Even integers'), ('all', 'All integers'), ('nonnegative', 'Nonnegative integers')]),
                            decision('target', 'Codomain of the inverse', [('even', 'Even integers'), ('all', 'All integers'), ('nonnegative', 'Nonnegative integers')]),
                            {'id': 'inverse', 'kind': 'math', 'label': 'Inverse at m'}],
           [choice_requirement('source', 'even', 'The image is exactly the even integers.'), choice_requirement('target', 'all', 'The inverse returns to the original integer domain.'),
            requirement('inverse', 'expression', ['inverse'], {'expected': 'm/2', 'variables': ['m']}, 'The inverse undoes multiplication by two.')],
           {'source': 'even', 'target': 'all', 'inverse': 'm/2'},
           'The inverse formula remains typed; the domain and codomain are concise type decisions.', capabilities=['math-text', 'tap'], test_cases=[
               {'response': {'source': s, 'target': t, 'inverse': f}, 'verdict': v} for s, t, f, v in [
                   ('even', 'all', 'm/2', 'correct'), ('even', 'all', '0.5*m', 'correct'), ('all', 'all', 'm/2', 'incorrect'),
                   ('even', 'even', 'm/2', 'incorrect'), ('even', 'all', '2*m', 'incorrect')]])

    def set_model(key, variables, conditions, valid, invalid, *, choice=None, prompt=None, atoms=None):
        inputs = [{'id': v, 'kind': 'math', 'label': f'${v}$', 'hint': 'Enter a finite set in braces; {} is the empty set.'} for v in variables]
        params = {'variables': {v: v for v in variables}, 'conditions': conditions}
        if atoms:
            params['atoms'] = atoms
        reqs = [requirement('model', 'set-model', variables, params, 'The proposed finite sets satisfy the exact requested properties.')]
        tests = [{'response': dict(zip(variables, values)), 'verdict': verdict} for values, verdict in [(v, 'correct') for v in valid]+[(v, 'incorrect') for v in invalid]]
        response = dict(tests[0]['response'])
        if choice:
            field, label, options, expected = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The short explanation distinguishes the failed property.'))
            response[field] = expected
            for t in tests:
                t['response'][field] = expected
            tests.append({'response': {**response, field: next(k for k, _ in options if k != expected)}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(key, inputs, reqs, response,
               'Ordinary finite-set entry preserves constructing a counterexample. The checker evaluates the stated set operations, so different valid constructions are accepted.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], prompt=prompt, test_cases=tests)

    set_model('sets-and-set-operations-29', ['A', 'B', 'C'], [{'left': 'A-(B|C)', 'op': '!=', 'right': '(A-B)|(A-C)'}],
              [['{1,2}', '{1}', '{2}'], ['{3}', '{}', '{3}']], [['{}', '{1}', '{2}'], ['{1}', '{1}', '{1}']],
              prompt='Refute the claimed identity $A\\setminus(B\\cup C)=(A\\setminus B)\\cup(A\\setminus C)$ by constructing finite sets.')
    set_model('sets-and-set-operations-38', ['A', 'B'], [{'left': 'A', 'op': 'nonempty'}, {'left': 'B', 'op': 'nonempty'}, {'left': 'A*B', 'op': '!=', 'right': 'B*A'}],
              [['{1}', '{2}'], ['{1,2}', '{2,3}']], [['{}', '{2}'], ['{1}', '{1}']])
    set_model('sets-and-set-operations-50', ['A', 'B'], [{'left': 'A', 'op': 'same-size', 'right': 'B'}, {'left': 'A', 'op': '!=', 'right': 'B'}],
              [['{1,2}', '{3,4}'], ['{0}', '{1}']], [['{1}', '{1}'], ['{}', '{1}']],
              choice=('reason', 'Why is cardinality insufficient?', [('members', 'Equality requires the same members; cardinality records only their count.'), ('order', 'Equality also requires the same order of listing.'), ('size', 'Equal finite sets must have different cardinalities.')], 'members'))
    set_model('sets-and-set-operations-60', ['A', 'B', 'C'], [{'left': s, 'op': 'nonempty'} for s in ['A&B', 'A&C', 'B&C']]+[{'left': 'A&B&C', 'op': '=', 'right': '{}'}],
              [['{1,2}', '{2,3}', '{1,3}'], ['{0,1}', '{1,2}', '{0,2}']], [['{1}', '{1}', '{1}'], ['{1}', '{2}', '{1,2}']],
              prompt='Construct three finite sets whose pairwise intersections are nonempty but whose three-way intersection is empty.')
    set_model('sets-and-set-operations-64', ['E', 'T', 'S', 'X'], [{'left': '(((E&T)-S)|X)&S', 'op': 'nonempty'}],
              [['{}', '{}', '{1}', '{1}'], ['{1,2}', '{1,2}', '{2}', '{2}']], [['{1}', '{1}', '{1}', '{}'], ['{}', '{}', '{}', '{1}']],
              prompt='Give finite sets of users showing that $(E\\cap T\\cap S^c)\\cup X$ can admit a suspended user. Use numeric user labels; the universe contains all users you enter.')
    set_model('sets-and-set-operations-66', ['A', 'B', 'C'], [{'left': 'A|B', 'op': '=', 'right': 'A|C'}, {'left': 'B', 'op': '!=', 'right': 'C'}],
              [['{1}', '{}', '{1}'], ['{1,2}', '{1}', '{2}']], [['{1}', '{2}', '{2}'], ['{}', '{1}', '{2}']])
    set_model('sets-and-set-operations-69', ['A', 'B'], [{'left': 'P(A|B)', 'op': '!=', 'right': 'P(A)|P(B)'}],
              [['{1}', '{2}'], ['{1,2}', '{2,3}']], [['{}', '{1}'], ['{1}', '{1}']])
    set_model('direct-proof-56', ['A', 'B'], [{'left': 'A-B', 'op': '!=', 'right': 'B-A'}],
              [['{1}', '{2}'], ['{}', '{1}']], [['{1}', '{1}'], ['{}', '{}']])
    set_model('direct-proof-57', ['A', 'B', 'C'], [{'left': 'A|B', 'op': '=', 'right': 'A|C'}, {'left': 'B', 'op': '!=', 'right': 'C'}],
              [['{1}', '{}', '{1}'], ['{1,2}', '{1}', '{2}']], [['{1}', '{2}', '{2}'], ['{}', '{1}', '{2}']])
    set_model('direct-proof-60', ['A', 'B'], [{'left': 'A', 'op': 'subset', 'right': 'B'}, {'left': 'A', 'op': '!=', 'right': 'B'}],
              [['{1}', '{1,2}'], ['{}', '{1}']], [['{1}', '{1}'], ['{1,2}', '{1}']])
    set_model('relations-75', ['A', 'B', 'C'], [{'left': s, 'op': 'subset', 'right': '{1,2}'} for s in ['A', 'B', 'C']]+[{'left': s, 'op': 'nonempty'} for s in ['A&B', 'B&C']]+[{'left': 'A&C', 'op': '=', 'right': '{}'}],
              [['{1}', '{1,2}', '{2}'], ['{2}', '{1,2}', '{1}']], [['{1}', '{1}', '{1}'], ['{}', '{1,2}', '{2}']],
              choice=('property', 'Failed equivalence-relation property', [('reflexive', 'Reflexivity'), ('symmetric', 'Symmetry'), ('transitive', 'Transitivity')], 'transitive'),
              prompt='On the nonempty subsets of $\\{1,2\\}$, let $A\\,R\\,B$ mean $A\\cap B\\ne\\varnothing$. Construct $A,B,C$ that violate an equivalence-relation property and select the failed property.')

    def set_formula(key, expected, variables, alternatives, wrong, *, choice=None, operations=None):
        inputs = [{'id': 'formula', 'kind': 'math', 'label': 'Set expression', 'hint': 'Use union, intersection, difference and complement notation, or |, &, -, and a trailing apostrophe.'}]
        params = {'expected': expected, 'variables': variables}
        if operations:
            params['operations'] = operations
        reqs = [requirement('formula', 'set-expression', ['formula'], params, 'The expression has exactly the requested membership condition.')]
        tests = [{'response': {'formula': f}, 'verdict': v} for f, v in [(expected, 'correct')]+[(f, 'correct') for f in alternatives]+[(f, 'incorrect') for f in wrong]]
        response = {'formula': expected}
        if choice:
            field, label, options, answer = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, answer, 'The reason explains the membership condition.'))
            response[field] = answer
            for t in tests:
                t['response'][field] = answer
            tests.append({'response': {**response, field: next(k for k, _ in options if k != answer)}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(key, inputs, reqs, response, 'Typed set notation preserves formula construction, checked by exact membership equivalence across all assignments.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)

    set_formula('sets-and-set-operations-28', 'A&B', ['A', 'B'], ['B intersection A'], ['A-B'],
                choice=('reason', 'Membership reason', [('both', 'An element remains exactly when it belongs to both A and B.'), ('either', 'An element remains when it belongs to either set.'), ('outside', 'Every element outside A remains.')], 'both'))
    set_formula('sets-and-set-operations-61', "E&T&S'", ['E', 'T', 'S', 'X'], [r'E\cap T\cap S^c'], ['E|T|S'])
    set_formula('sets-and-set-operations-62', "E'|T'|S", ['E', 'T', 'S', 'X'], [r'S\cup T^c\cup E^c'], ["E'&T'&S", "(E&T&S')'"], operations=['union', 'complement'])
    set_formula('sets-and-set-operations-63', "E&(T|X)&S'", ['E', 'T', 'S', 'X'], [r'S^c\cap (X\cup T)\cap E'], ["(E&T&S')|X"])
    append('propositional-logic-138', [{'id': 'example', 'kind': 'math', 'label': 'Counterexample formula', 'hint': 'Use p, q, and/or r.'},
                                      decision('decision', 'Must every satisfiable formula be a tautology?', [('yes', 'Yes'), ('no', 'No')])],
           [requirement('example', 'boolean-property', ['example'], {'variables': ['p', 'q', 'r'], 'property': 'contingent'}, 'The formula is true on some assignments and false on others.'),
            choice_requirement('decision', 'no', 'Satisfiability does not require truth on every assignment.')],
           {'example': 'p', 'decision': 'no'}, 'The learner creates any contingent formula; exhaustive truth evaluation accepts all valid counterexamples.',
           capabilities=['math-text', 'tap'], test_cases=[{'response': {'example': f, 'decision': d}, 'verdict': v} for f, d, v in [
               ('p', 'no', 'correct'), ('p&q', 'no', 'correct'), ('p|!p', 'no', 'incorrect'), ('p&!p', 'no', 'incorrect'), ('p', 'yes', 'incorrect')]])
    append('strong-induction-60', [{'id': 'example', 'kind': 'math', 'label': 'Nested object with a repeated label', 'hint': 'Use atom labels a, b, c and binary pairs, such as (a,b).'},
                                    decision('reason', 'Why count occurrences?', [('occurrences', 'Pairing adds both children’s weights; a repeated label contributes again.'), ('distinct', 'Pairing removes repeated labels before adding weights.'), ('level', 'Only atoms at different depths count separately.')])],
           [requirement('example', 'nested-object', ['example'], {'atoms': ['a', 'b', 'c']}, 'The binary nested object contains a repeated atom label.'),
            choice_requirement('reason', 'occurrences', 'Weight counts occurrences because it adds child weights.')],
           {'example': '(a,a)', 'reason': 'occurrences'}, 'One ordinary nested-pair entry replaces an unrestricted drawing; the conceptual distinction is a concise reason choice.',
           capabilities=['math-text', 'tap'], test_cases=[{'response': {'example': f, 'reason': r}, 'verdict': v} for f, r, v in [
               ('(a,a)', 'occurrences', 'correct'), ('((b,c),b)', 'occurrences', 'correct'), ('(a,b)', 'occurrences', 'incorrect'), ('a', 'occurrences', 'incorrect'), ('(a,a)', 'distinct', 'incorrect')]])

    for identifier, expected, domains, predicates, free, wrong in [
        (17, '(exists x in R !R(c,x))->!A', ['R'], {'A': 0, 'R': 2}, ['c'], ['(!forall x in R R(c,x))->!A']),
        (18, '!Q->forall x in D !P(x)', ['D'], {'Q': 0, 'P': 1}, [], ['!Q->!exists x in D P(x)']),
        (19, '(exists x in D forall y in E !R(x,y))->!A', ['D', 'E'], {'A': 0, 'R': 2}, [], ['(!forall x in D exists y in E R(x,y))->!A']),
    ]:
        quantified(identifier, expected, predicates, domains, free=free, wrong=wrong, lesson='proof-by-contrapositive', form='negations-on-atoms')
    quantified(69, '(forall x in D !P(x))->!A', {'A': 0, 'P': 1}, ['D'], lesson='proof-by-contrapositive',
               wrong=['(exists x in D !P(x))->!A'])
    boolean_written('proof-by-contrapositive-20', [('Contrapositive', '!q->(!p|!r)', ['p', 'q', 'r'], '!q->(!p|!r)')],
                    hint='p: user is an administrator; r: user is active; q: access is allowed.')
    boolean_written('proof-by-contrapositive-63', [('Correct negation', '!p|!q', ['p', 'q'], None)],
                    hint='p: first factor is even; q: second factor is even.')
    for lesson, identifier in [('sets-and-set-operations', 9), ('proof-by-contradiction', 7)]:
        quantified(identifier, 'exists x in U (x in A & x notin B)', {'A': 1, 'B': 1}, ['U'], named_sets=['A', 'B'], lesson=lesson,
                   notation='U is the common universe; membership notation x in A and x notin B is accepted.',
                   alternatives=[r'exists z in U (z\in A & z\notin B)'], wrong=['forall x in U (x in A & x notin B)'])
    for identifier, expected in [(42, 'forall x in U (x notin C -> (x notin A | x notin B))'),
                                 (43, 'forall x in U (x notin C -> (x notin A & x notin B))')]:
        quantified(identifier, expected, {'A': 1, 'B': 1, 'C': 1}, ['U'], named_sets=['A', 'B', 'C'], lesson='proof-by-contrapositive',
                   notation='U is the common universe; use ordinary membership notation.', wrong=[expected.replace('notin C', 'in C')])
    for identifier, expected, domains, predicates, wrong, notation in [
        (1, 'exists n in Z forall m in Z (m<=n)', ['Z'], {}, ['forall n in Z exists m in Z (m<=n)'], None),
        (2, 'exists x in Q (x^2=2)', ['Q'], {}, ['forall x in Q (x^2=2)'], None),
        (3, 'exists n in Z (E(n^2)&!E(n))', ['Z'], {'E': 1}, ['exists n in Z (!E(n^2)&E(n))'], 'E(t) means t is even.'),
        (5, 'exists x in Z exists y in Z (S(x)&S(y)&x!=y)', ['Z'], {'S': 1}, ['exists x in Z S(x)'], 'S(t) means t solves the given equation.'),
        (6, '(!exists x in Z S(x))|exists x in Z exists y in Z (S(x)&S(y)&x!=y)', ['Z'], {'S': 1}, ['!exists x in Z S(x)'], 'S(t) means t solves the given equation.'),
    ]:
        quantified(identifier, expected, predicates, domains, lesson='proof-by-contradiction', wrong=wrong, notation=notation)
    for lesson, identifiers in [('functions', [29, 30]), ('proof-by-contradiction', [8, 9])]:
        quantified(identifiers[0], 'exists a in A exists b in A (a!=b&f(a)=f(b))', {}, ['A', 'B'], functions={'f': 1}, lesson=lesson,
                   alternatives=['exists x in A exists y in A (f(y)=f(x)&y!=x)'], wrong=['exists a in A exists b in A (a=b&f(a)=f(b))'])
        quantified(identifiers[1], 'exists b in B forall a in A (f(a)!=b)', {}, ['A', 'B'], functions={'f': 1}, lesson=lesson,
                   alternatives=['exists y in B forall x in A (y!=f(x))'], wrong=['forall b in B exists a in A (f(a)!=b)'])
    quantified(9, 'forall a in A exists! b in B F(a,b)', {'F': 2}, ['A', 'B'], lesson='functions',
               alternatives=['forall x in A exists y in B (F(x,y)&forall z in B (F(x,z)->z=y))'],
               wrong=['forall a in A exists b in B F(a,b)'], notation='F(a,b) means the ordered pair (a,b) belongs to the relation F.')
    quantified(69, 'exists r in R forall w in W !A(r,w)', {'A': 2}, ['R', 'W'], lesson='proof-by-contradiction',
               notation='R is requests, W is workers, and A(r,w) means worker w is assigned to request r.',
               wrong=['forall r in R forall w in W !A(r,w)'])
    witness('proof-by-contrapositive-55', [('x', 'Irrational counterexample', {'irrational': True})], [('x^2', 'rational')],
            ['sqrt(2)'], [['sqrt(3)'], ['-sqrt(2)']], [[2], [0]])
    witness('proof-by-contradiction-34', [('x', 'Irrational x (with r = 0)', {'irrational': True})], [('0*x', 'rational')],
            ['sqrt(2)'], [['sqrt(3)'], ['-sqrt(6)']], [[2], [0]])
    witness('proof-by-contradiction-40', [('a', 'First irrational factor, rational product', {'irrational': True}),
                                       ('b', 'Second irrational factor, rational product', {'irrational': True}),
                                       ('c', 'First irrational factor, irrational product', {'irrational': True}),
                                       ('d', 'Second irrational factor, irrational product', {'irrational': True})],
            [('a*b', 'rational'), ('c*d', 'irrational')], ['sqrt(2)', 'sqrt(2)', 'sqrt(2)', 'sqrt(3)'],
            [['sqrt(3)', '-sqrt(3)', 'sqrt(3)', 'sqrt(6)']], [[2, 'sqrt(2)', 'sqrt(2)', 'sqrt(3)'], ['sqrt(2)', 'sqrt(3)', 'sqrt(2)', 'sqrt(3)'], ['sqrt(2)', 'sqrt(2)', 'sqrt(3)', 'sqrt(3)']])
    append('proof-by-contrapositive-62', [{'id': 'negation', 'kind': 'math', 'label': 'Correct negation'},
                                        decision('reason', 'Error', [('boundary', 'The equality case x=3 was omitted.'), ('sign', 'The value 3 must change sign.'), ('domain', 'Negation changes the real domain to integers.')])],
           [requirement('negation', 'inequality', ['negation'], {'expected': 'x<=3', 'variable': 'x'}, 'The negation includes equality.'), choice_requirement('reason', 'boundary', 'The missing boundary is the error.')],
           {'negation': 'x<=3', 'reason': 'boundary'}, 'The correction is typed; the explanation is a concise decision about the missing endpoint.',
           capabilities=['math-text', 'tap'], test_cases=[{'response': {'negation': f, 'reason': r}, 'verdict': v} for f, r, v in [
               ('x<=3', 'boundary', 'correct'), ('3>=x', 'boundary', 'correct'), ('x<3', 'boundary', 'incorrect'), ('x<=3', 'sign', 'incorrect')]])
    roles = [('first', 'If it rains, I carry an umbrella.', 'premise'), ('second', 'It rains.', 'premise'), ('third', 'I carry an umbrella.', 'conclusion')]
    append('propositional-logic-111', [decision(f, label, [('premise', 'Premise'), ('conclusion', 'Conclusion')]) for f, label, _ in roles],
           [choice_requirement(f, role, 'The statement has the requested argument role.') for f, _, role in roles],
           {f: role for f, _, role in roles}, 'Three short role labels directly express the requested premise/conclusion identification.',
           capabilities=['tap'], level='recognition', test_cases=[{'response': {'first': 'premise', 'second': 'premise', 'third': 'conclusion'}, 'verdict': 'correct'},
                                                                 {'response': {'first': 'conclusion', 'second': 'premise', 'third': 'premise'}, 'verdict': 'incorrect'}, {'response': {}, 'error': True}])
    expressions('sequences-and-summations-39', [('Sum', '5*(2^(n+1)-1)', ['n'], [], '10*2^n-5')], options={'integerVariables': ['n']})
    expressions('sequences-and-summations-77', [('Correct sum', '2^(n+1)-1', ['n'], [], '2*2^n-1')], [('Smallest counterexample index', 0)], options={'integerVariables': ['n']})

    def interval(key, lower, upper, lc, rc, *, variables=None, choice=None):
        inputs = [{'id': 'range', 'kind': 'interval', 'label': 'Interval'}]
        fields = ['range.lower', 'range.upper', 'range.leftClosed', 'range.rightClosed']
        params = {'lower': lower or '-infinity', 'upper': upper or 'infinity', 'leftClosed': lc, 'rightClosed': rc}
        if variables:
            params['variables'] = variables
        reqs = [requirement('range', 'interval', fields, params, 'The endpoints and their inclusion match the requested set.')]
        response = dict(zip(fields, [lower or '-infinity', upper or 'infinity', lc, rc]))
        tests = [{'response': dict(response), 'verdict': 'correct'}, {'response': {**response, 'range.leftClosed': not lc}, 'verdict': 'incorrect'}]
        if choice:
            field, label, options, expected = choice
            inputs.append(decision(field, label, options))
            reqs.append(choice_requirement(field, expected, 'The domain decision is correct.'))
            response[field] = expected
            for t in tests:
                t['response'][field] = expected
            tests.append({'response': {**response, field: next(k for k, _ in options if k != expected)}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(key, inputs, reqs, response, 'A compact interval entry directly records the requested endpoints and open or closed boundaries.',
               capabilities=['math-text', 'tap'], test_cases=tests)

    interval('functions-6', '2', None, True, False)
    interval('functions-16', '0', '9', True, True)
    interval('functions-45', '2', None, True, False,
             choice=('all', 'Defined on all reals?', [('yes', 'Yes'), ('no', 'No')], 'no'))
    interval('functions-64', 'k', 'k+1', True, False, variables=['k'])
    interval('functions-65', 'k-1', 'k', False, True, variables=['k'])
    for identifier, expected, alternatives, wrong in [(5, 'x!=3', [r'R\{3}', '(-infinity,3) union (3,infinity)'], 'x=3'),
                                                     (15, '(x>=-2 & x<=-1) | (x>=1 & x<=2)', ['[-2,-1] union [1,2]', r'[-2,-1]\cup[1,2]'], '[-2,2]')]:
        append(f'functions-{identifier}', [{'id': 'set', 'kind': 'math', 'label': 'Real set', 'hint': 'Use interval notation, interval unions, or inequalities in x.'}],
               [requirement('set', 'inequality', ['set'], {'expected': expected, 'variable': 'x'}, 'The real set is exactly the requested domain or preimage.')],
               {'set': expected}, 'An ordinary typed real-set answer supports disconnected intervals and excluded points without adding multiple widgets.',
               capabilities=['math-text'], test_cases=[{'response': {'set': f}, 'verdict': v} for f, v in [(expected, 'correct')]+[(f, 'correct') for f in alternatives]+[(wrong, 'incorrect')]])
    append('functions-35', [{'id': 'domain', 'kind': 'interval', 'label': 'Restricted domain'}, {'id': 'inverse', 'kind': 'math', 'label': 'Inverse at y'}],
           [requirement('inverse', 'square-inverse', ['domain.lower', 'domain.upper', 'domain.leftClosed', 'domain.rightClosed', 'inverse'], {}, 'The interval and inverse form a compatible bijective branch.')],
           {'domain.lower': '0', 'domain.upper': 'infinity', 'domain.leftClosed': True, 'domain.rightClosed': False, 'inverse': 'sqrt(y)'},
           'Both nonnegative and nonpositive interval restrictions are accepted with their matching typed inverse. No branch choice or inverse formula is supplied.',
           prompt='Restrict the domain of the real square function to an interval to obtain a bijection onto $[0,\\infty)$, and give its inverse.',
           capabilities=['math-text', 'tap'], test_cases=[{'response': dict(zip(['domain.lower', 'domain.upper', 'domain.leftClosed', 'domain.rightClosed', 'inverse'], values)), 'verdict': verdict}
               for values, verdict in [(['0', 'infinity', True, False, 'sqrt(y)'], 'correct'), (['-infinity', '0', False, True, '-sqrt(y)'], 'correct'),
                                      (['0', 'infinity', True, False, '-sqrt(y)'], 'incorrect'), (['-infinity', '0', False, True, 'sqrt(y)'], 'incorrect'),
                                      (['0', 'infinity', False, False, 'sqrt(y)'], 'incorrect')]])
    append('functions-43', [{'id': 'formula', 'kind': 'math', 'label': '$g(f(x))$'}],
           [requirement('formula', 'elementary-expression', ['formula'], {'variable': 'x', 'expected': 'abs(x)', 'domain': 'real'}, 'The expression equals the nonnegative square root of x squared for every real x.')],
           {'formula': 'abs(x)'}, 'Ordinary math entry accepts absolute-value and equivalent radical forms while checking negative real inputs exactly.',
           capabilities=['math-text'], test_cases=[{'response': {'formula': f}, 'verdict': v} for f, v in [('abs(x)', 'correct'), ('sqrt(x^2)', 'correct'), ('2*sqrt((x/2)^2)', 'correct'), ('x', 'incorrect'), ('-x', 'incorrect')]])
    expressions('functions-31', [('Inverse at x', '(x+2)/5', ['x'], [], 'x/5+2/5'), ('f(f inverse(x))', 'x', ['x'], [], '5*((x+2)/5)-2'),
                                ('f inverse(f(x))', 'x', ['x'], [], '((5*x-2)+2)/5')])
    expressions('functions-41', [('$(g\\circ f)(x)$', '3*x+6', ['x'], [], '3*(x+2)'),
                                ('$h((g\\circ f)(x))$', '3*x+5', ['x'], [], '3*(x+2)-1'),
                                ('$((h\\circ g)\\circ f)(x)$', '3*x+5', ['x'], [], '3*(x+2)-1')])
    append('strong-induction-55', [{'id': 'vertices', 'kind': 'math', 'label': 'Vertices', 'hint': 'Enter a finite set of labels, such as {a,b}.'},
                                   {'id': 'edges', 'kind': 'math', 'label': 'Edges', 'hint': 'Enter endpoint pairs in a set.'}, {'id': 'root', 'kind': 'text', 'label': 'Root'}],
           [requirement('tree', 'graph', ['vertices', 'edges', 'root'], {'kind': 'graph-property', 'property': 'rooted-leaf-counterexample'}, 'The rooted tree has a one-child node and violates the stated leaf/internal-node identity.')],
           {'vertices': '{a,b}', 'edges': '{(a,b)}', 'root': 'a'},
           'Three ordinary entries describe the constructed tree; deterministic traversal checks child counts without requiring a drawing tool.',
           capabilities=['math-text', 'short-text'], test_cases=[{'response': {'vertices': v, 'edges': e, 'root': r}, 'verdict': verdict} for v, e, r, verdict in [
               ('{a,b}', '{(a,b)}', 'a', 'correct'), ('{a,b,c}', '{(a,b),(b,c)}', 'a', 'correct'),
               ('{a,b,c}', '{(a,b),(a,c)}', 'a', 'incorrect'), ('{a}', '{}', 'a', 'incorrect')]])

    def finite_map(key, kind, domains, maps, valid, invalid, *, subsets=None, prompt=None):
        inputs, fields = [], []
        for m in maps:
            if 'field' in m:
                fields.append(m['field'])
                inputs.append({'id': m['field'], 'kind': 'math', 'label': '$'+m['name']+'$ as a set of pairs'})
            else:
                cells = []
                for argument, field in m['fields'].items():
                    fields.append(field)
                    cells.append({'label': '$'+m['name']+'('+argument+')$', 'cells': [{'id': field, 'kind': 'text'}]})
                inputs.append({'id': m['name']+'-table', 'kind': 'grid', 'label': '$'+m['name']+'$', 'columns': ['Output'], 'rows': cells})
        if subsets:
            for name, label in [('s', '$S$'), ('w', '$W$'), ('left', '$f(S\\cap W)$'), ('right', '$f(S)\\cap f(W)$')]:
                fields.append(subsets[name])
                inputs.append({'id': subsets[name], 'kind': 'math', 'label': label})
        params = {'kind': kind, 'domains': domains, 'maps': maps}
        if subsets:
            params['subsets'] = subsets
        append(key, inputs, [requirement('construction', 'finite-map', fields, params, 'The total finite maps satisfy the requested properties and every requested set calculation.')],
               valid[0], 'A small typed mapping table or pair-set preserves construction. All maps are total on the stated finite domains, and the checker accepts every valid assignment.',
               capabilities=['math-text', 'short-text'], prompt=prompt,
               test_cases=[{'response': r, 'verdict': 'correct'} for r in valid]+[{'response': r, 'verdict': 'incorrect'} for r in invalid]+[{'response': {}, 'error': True}])

    finite_map('direct-proof-59', 'unique-fiber-noninjective', {'A': ['1', '2', '3'], 'B': ['a', 'b']},
               [{'name': 'f', 'domain': 'A', 'codomain': 'B', 'fields': {'1': 'f1', '2': 'f2', '3': 'f3'}}],
               [{'f1': 'a', 'f2': 'b', 'f3': 'b'}, {'f1': 'b', 'f2': 'a', 'f3': 'a'}], [{'f1': 'a', 'f2': 'a', 'f3': 'a'}],
               prompt='Refute “a function is injective if one output has exactly one preimage” by constructing $f:\\{1,2,3\\}\\to\\{a,b\\}$.')
    map_domains = {'A': ['a', 'b'], 'B': ['1', '2', '3'], 'C': ['u', 'v']}
    map_pair = [{'name': 'f', 'domain': 'A', 'codomain': 'B', 'fields': {'a': 'fa', 'b': 'fb'}},
                {'name': 'g', 'domain': 'B', 'codomain': 'C', 'fields': {'1': 'g1', '2': 'g2', '3': 'g3'}}]
    map_valid = [{'fa': '1', 'fb': '2', 'g1': 'u', 'g2': 'v', 'g3': 'u'}, {'fa': '2', 'fb': '3', 'g1': 'v', 'g2': 'u', 'g3': 'v'}]
    map_invalid = [{'fa': '1', 'fb': '1', 'g1': 'u', 'g2': 'v', 'g3': 'u'}, {'fa': '1', 'fb': '2', 'g1': 'u', 'g2': 'u', 'g3': 'v'}]
    for key, kind, objective in [('proof-by-contrapositive-50', 'injective-composite-noninjective-second', 'so that $g\\circ f$ is injective but $g$ is not injective on its entire domain'),
                                  ('functions-76', 'bijective-composite-neither', 'so that $g\\circ f$ is bijective, $f$ is not onto, and $g$ is not injective')]:
        finite_map(key, kind, map_domains, map_pair, map_valid, map_invalid,
                   prompt='Construct $f:A\\to B$ and $g:B\\to C$ '+objective+'. Use $A=\\{a,b\\}$, $B=\\{1,2,3\\}$, and $C=\\{u,v\\}$.')
    finite_map('functions-73', 'image-intersection-counterexample', {'A': ['1', '2', '3'], 'B': ['a', 'b']},
               [{'name': 'f', 'domain': 'A', 'codomain': 'B', 'field': 'f'}],
               [{'f': '{(1,a),(2,a),(3,b)}', 's': '{1}', 'w': '{2}', 'left': '{}', 'right': '{a}'},
                {'f': '{(1,b),(2,a),(3,a)}', 's': '{2}', 'w': '{3}', 'left': '{}', 'right': '{a}'}],
               [{'f': '{(1,a),(2,a),(3,b)}', 's': '{1}', 'w': '{1}', 'left': '{a}', 'right': '{a}'},
                {'f': '{(1,a),(2,a),(3,b)}', 's': '{1}', 'w': '{2}', 'left': '{a}', 'right': '{a}'}],
               subsets={'s': 's', 'w': 'w', 'left': 'left', 'right': 'right'},
               prompt='Construct $f:A\\to B$ and subsets $S,W\\subseteq A$ for which $f(S\\cap W)\\ne f(S)\\cap f(W)$. Use $A=\\{1,2,3\\}$ and $B=\\{a,b\\}$, and calculate both sides.')

    append('relations-57', [{'id': 'R', 'kind': 'math', 'label': '$R$', 'hint': 'Enter a finite set of ordered pairs.'},
                             {'id': 'S', 'kind': 'math', 'label': '$S$', 'hint': 'Use numeric labels or a, b, c; the common carrier contains every endpoint.'}],
           [requirement('relations', 'finite-relation', ['R', 'S'], {'kind': 'noncommuting-composition', 'atoms': ['a', 'b', 'c']}, 'The two relation compositions differ on their common finite carrier.')],
           {'R': '{(1,2)}', 'S': '{(2,1)}'}, 'Two ordinary pair-set entries construct a complete finite counterexample without a relation editor or supplied size.',
           capabilities=['math-text'], test_cases=[{'response': {'R': r, 'S': s}, 'verdict': v} for r, s, v in [
               ('{(1,2)}', '{(2,1)}', 'correct'), ('{(a,a)}', '{(a,b)}', 'correct'), ('{(1,2)}', '{(1,2)}', 'incorrect'), ('{}', '{(1,2)}', 'incorrect')]])
    append('relations-74', [{'id': 'R', 'kind': 'math', 'label': '$R$ as ordered pairs'},
                             {'id': 'witness', 'kind': 'math', 'label': 'Transitivity counterexample $(a,b,c)$'}],
           [requirement('relation', 'finite-relation', ['R', 'witness'], {'kind': 'reflexive-symmetric-not-transitive', 'universe': ['1', '2', '3']}, 'The relation is reflexive and symmetric, and the entered triple has aRb and bRc but not aRc.')],
           {'R': '{(1,1),(2,2),(3,3),(1,2),(2,1),(2,3),(3,2)}', 'witness': '(1,2,3)'},
           'Typing the relation and one witness triple directly answers both requested construction components.',
           capabilities=['math-text'], test_cases=[{'response': {'R': r, 'witness': w}, 'verdict': v} for r, w, v in [
               ('{(1,1),(2,2),(3,3),(1,2),(2,1),(2,3),(3,2)}', '(1,2,3)', 'correct'),
               ('{(1,1),(2,2),(3,3),(1,3),(3,1),(3,2),(2,3)}', '(1,3,2)', 'correct'),
               ('{(1,1),(2,2),(3,3)}', '(1,2,3)', 'incorrect'), ('{(1,2),(2,1),(2,3),(3,2)}', '(1,2,3)', 'incorrect')]])
    append('relations-80', [{'id': 'R', 'kind': 'math', 'label': 'Smallest counterexample relation', 'hint': 'Enter ordered pairs; the carrier contains their endpoints. Use numeric labels or a, b, c.'},
                             decision('reason', 'Flaw', [('repeat', 'The transitivity definition allows repeated objects, so missing loops can violate it.'), ('order', 'The transitivity definition ignores pair order.'), ('symmetric', 'Every transitive relation must be symmetric.')])],
           [requirement('relation', 'finite-relation', ['R'], {'kind': 'distinct-triples-counterexample', 'atoms': ['a', 'b', 'c']}, 'The smallest finite carrier passes the distinct-triple check but fails transitivity.'),
            choice_requirement('reason', 'repeat', 'The explanation identifies the omitted repeated-variable cases.')],
           {'R': '{(a,b),(b,a)}', 'reason': 'repeat'}, 'One typed relation preserves finding the minimum-size counterexample; a concise reason identifies why the faulty test misses it.',
           capabilities=['math-text', 'tap'], test_cases=[{'response': {'R': r, 'reason': why}, 'verdict': v} for r, why, v in [
               ('{(a,b),(b,a)}', 'repeat', 'correct'), ('{(1,2),(2,1),(1,1)}', 'repeat', 'correct'),
               ('{(a,b),(b,a),(a,a),(b,b)}', 'repeat', 'incorrect'), ('{(a,b),(b,a)}', 'symmetric', 'incorrect')]])

    recognition('proof-by-contradiction-4', 'There are finitely many primes.', ['There are no primes.', 'There is exactly one prime.'],
                prompt='Select the negation of “There are infinitely many primes.”')
    for identifier, kind, params, valid, invalid, choice in [
        (6, 'same-recurrence', {'increment': '3'}, [('3*n', '3*n+1'), ('3*n-8', '3*n+12')], [('3*n', '3*n'), ('3*n', '2*n+1')],
         ('reason', 'Why is the sequence not unique?', [('initial', 'No initial value was specified.'), ('step', 'The increment changes at each index.'), ('indices', 'A recurrence cannot define an infinite sequence.')], 'initial')),
        (10, 'prefix-counterexample', {'indices': ['0', '1', '2']}, [('n', 'n+n*(n-1)*(n-2)'), ('0', 'n*(n-1)*(n-2)')], [('n', 'n'), ('0', 'n*(n-1)')], None),
    ]:
        inputs = [{'id': 'a', 'kind': 'math', 'label': 'First rule at n'}, {'id': 'b', 'kind': 'math', 'label': 'Second rule at n'}]
        reqs = [requirement('pair', 'sequence-pair', ['a', 'b'], {'kind': kind, 'variable': 'n', **params}, 'Both typed sequence rules meet the requested recurrence or prefix conditions and are not identical.')]
        tests = [{'response': {'a': a, 'b': b}, 'verdict': verdict} for a, b, verdict in [(a, b, 'correct') for a, b in valid]+[(a, b, 'incorrect') for a, b in invalid]]
        response = dict(tests[0]['response'])
        if choice:
            f, label, options, expected = choice
            inputs.append(decision(f, label, options))
            reqs.append(choice_requirement(f, expected, 'The missing initial value explains nonuniqueness.'))
            response[f] = expected
            for t in tests:
                t['response'][f] = expected
            tests.append({'response': {**response, f: 'step'}, 'verdict': 'incorrect'})
        tests.append({'response': {}, 'error': True})
        append(f'sequences-and-summations-{identifier}', inputs, reqs, response,
               'Two ordinary typed rules preserve constructing distinct sequences. The checker proves exact identities or nonidentities and checks every explicitly requested prefix index.',
               capabilities=['math-text', 'tap'] if choice else ['math-text'], test_cases=tests)
