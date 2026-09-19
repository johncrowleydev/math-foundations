"""Author the 22 finite Review assessments while retaining their stable IDs."""
from copy import deepcopy
from itertools import product
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
templates = json.loads((ROOT / 'content/review-templates.json').read_text())
by_id = {t['id']: t for t in templates}
cases = []


def req(identifier, validator, fields, params, description, level='production'):
    return {'id': identifier, 'validator': validator, 'fields': fields, 'params': params,
            'description': description, 'evidenceLevel': level}


def math(field, label, hint=None):
    out = {'id': field, 'kind': 'math', 'label': label}
    if hint:
        out['hint'] = hint
    return out


def tf(field, label):
    return {'id': field, 'kind': 'boolean', 'label': label}


def set_variant(template, variant, inputs, requirements, fixtures, *, instructions=None,
                prompt=None, cost='low', capabilities=None):
    t = by_id[template]
    q = t['variants'][variant-1]
    if instructions is not None:
        q['instructions'] = instructions
    if prompt is not None:
        q['prompt'] = prompt
    q['assessment'] = {
        'version': 1, 'inputs': inputs, 'requirements': requirements,
        'feedback': {'correct': q['answer'], 'incorrect': 'Check the requested formula or values and each stated condition, then try again.'},
        'evidence': {'level': 'production', 'interactionCost': cost,
                     'inputCapabilities': capabilities or ['math-text']},
    }
    if variant == 1:
        t['question'] = deepcopy(q)
    cases.append({'template': template, 'variant': variant, 'fixtures': fixtures + [{'response': {}, 'error': True}]})


def ok(response):
    return {'response': response, 'verdict': 'correct'}


def wrong(response):
    return {'response': response, 'verdict': 'incorrect'}


set_variant('witness-definition-variants', 1,
            [{'id': 'term', 'kind': 'text', 'label': 'Term'}],
            [req('term', 'term', ['term'], {'accepted': ['witness', 'a witness', 'witness.', 'a witness.']}, 'The complete answer names the requested term.')],
            [ok({'term': 'witness'}), ok({'term': ' A WITNESS. '}), wrong({'term': 'not a witness'}), wrong({'term': 'counterexample'})],
            capabilities=['short-text'])

for template, variant, expected, alternative, variables in [
    ('implication-negation-production-review', 1, '(a|b)&!c', '!c&(b|a)', ['a','b','c']),
    ('implication-negation-production-review', 2, 'a&(!b|!c)', '(!c|!b)&a', ['a','b','c']),
    ('de-morgan-production-review', 1, '(!a&b)|!c', '!c|(b&!a)', ['a','b','c']),
    ('de-morgan-production-review', 2, '!a&(b|!c)', '(b|!c)&!a', ['a','b','c']),
    ('de-morgan-production-review', 3, '!S|(!L&!M)', '(!M&!L)|!S', ['S','L','M']),
]:
    set_variant(template, variant, [math('formula', 'Negated formula')],
                [req('formula', 'boolean-formula', ['formula'], {'expected': expected, 'variables': variables, 'form': 'nnf'}, 'The formula is equivalent to the requested negation, with negation only on variables.')],
                [ok({'formula': expected}), ok({'formula': alternative}), wrong({'formula': variables[0]}), wrong({'formula': f'!({expected})'})])

set_variant('implication-negation-production-review', 3,
            [math('condition', 'Negated condition', 'Use inequalities joined by AND or OR.')],
            [req('condition', 'inequality', ['condition'], {'expected': 'x<=0', 'variable': 'x'}, 'The inequalities describe precisely the negated condition over the real numbers.')],
            [ok({'condition':'x<=0'}), ok({'condition':'x<=2 and x<=0'}), ok({'condition':'0>=x'}), wrong({'condition':'x<0'}), wrong({'condition':'x>0'})],
            prompt='For a fixed real number $x$, negate “If $x\\leq2$, then $x>0$.” Give equivalent inequalities joined by AND or OR.')

for variant, variables, checks, conditions, accepted, rejected in [
    (1, ['p','q'], {'implication':'p->q', 'equivalence':'p<->q'},
     [{'formula':'!((p->q)<->(p<->q))', 'value': True}],
     [{'p':False,'q':True,'implication':True,'equivalence':False}],
     {'p':True,'q':False,'implication':False,'equivalence':False}),
    (2, ['p','q','r'], {'premise-1':'(p|q)->r','premise-2':'r','conclusion':'p|q'},
     [{'formula':'(p|q)->r','value':True},{'formula':'r','value':True},{'formula':'p|q','value':False}],
     [{'p':False,'q':False,'r':True,'premise-1':True,'premise-2':True,'conclusion':False}],
     {'p':True,'q':False,'r':True,'premise-1':True,'premise-2':True,'conclusion':True}),
    (3, ['p','q','r'], {'premise-1':'p->(q|r)','premise-2':'p','conclusion':'q&r'},
     [{'formula':'p->(q|r)','value':True},{'formula':'p','value':True},{'formula':'q&r','value':False}],
     [{'p':True,'q':True,'r':False,'premise-1':True,'premise-2':True,'conclusion':False},
      {'p':True,'q':False,'r':True,'premise-1':True,'premise-2':True,'conclusion':False}],
     {'p':True,'q':True,'r':True,'premise-1':True,'premise-2':True,'conclusion':True}),
]:
    fields = variables + list(checks)
    labels = {'p':'$p$','q':'$q$','r':'$r$','implication':'$p\\to q$','equivalence':'$p\\leftrightarrow q$',
              'premise-1':'First premise','premise-2':'Second premise','conclusion':'Conclusion'}
    grid = {'id':'assignment','kind':'grid','label':'Counterassignment',
            'columns':[labels[f] for f in fields],
            'rows':[{'label':'Your assignment','cells':[{'id':f,'kind':'boolean'} for f in fields]}]}
    false_check = {**accepted[0], next(iter(checks)): not accepted[0][next(iter(checks))]}
    set_variant('counterassignment-construction-review', variant, [grid],
                [req('counterassignment','boolean-model',fields,
                     {'variables':{v:v for v in variables},'checks':checks,'conditions':conditions},
                     'The assignment is a counterexample and every requested resulting truth value is correct.')],
                [*(ok(a) for a in accepted),wrong(rejected),wrong(false_check)],capabilities=['tap'])


def witness(template, variant, variables, conditions, inputs, truth_checks, accepted, rejected):
    fields = [v['field'] for v in variables]
    requirements = [req('witness','witness',fields,{'variables':variables,'conditions':conditions},
                        'The value is in the stated domain and satisfies every required numerical condition and substitution check.')]
    if truth_checks:
        requirements.append(req('verification','boolean',list(truth_checks),{'expected':list(truth_checks.values())},
                                'Each requested condition has the correct truth value.'))
    all_inputs = inputs + [tf(field,label) for field,label in truth_labels.items() if field in truth_checks]
    set_variant(template,variant,all_inputs,requirements,
                [*(ok({**a,**truth_checks}) for a in accepted),wrong({**rejected,**truth_checks}),
                 *([wrong({**accepted[0],**truth_checks,next(iter(truth_checks)):not truth_checks[next(iter(truth_checks))]})] if truth_checks else [])],
                capabilities=['math-text','tap'])


truth_labels = {'negative':'The chosen value is negative', 'between':'The chosen value is strictly between the stated bounds',
                'square-less':'Its square is less than the chosen value',
                'antecedent':'Antecedent', 'consequent':'Consequent'}
var = lambda name, field, integer=False: {'name':name,'field':field,**({'integer':True} if integer else {})}
cond = lambda left, op, right: {'left':left,'op':op,'right':right}
witness('existential-witness-construction-variants',1,
        [var('n','value',True),var('s','square')],
        [cond('n','<','0'),cond('n^2','=','25'),cond('s','=','n^2')],
        [math('value','Integer witness $n$'),math('square','$n^2$')],{'negative':True},
        [{'value':'-5','square':'25'},{'value':'-10/2','square':'5^2'}],{'value':'5','square':'25'})
witness('existential-witness-construction-variants',2,[var('n','value',True)],
        [cond('n','>','4'),cond('n','<','8')],[math('value','Integer witness $n$')],{'between':True},
        [{'value':str(n)} for n in (5,6,7)],{'value':'11/2'})
witness('existential-witness-construction-variants',3,[var('x','value'),var('s','square')],
        [cond('x','>','0'),cond('x','<','1'),cond('s','=','x^2'),cond('s','<','x')],
        [math('value','Real witness $x$'),math('square','$x^2$')],{'between':True,'square-less':True},
        [{'value':'1/2','square':'1/4'},{'value':'1/3','square':'1/9'},{'value':'3/4','square':'9/16'}],{'value':'1','square':'1'})

for variant, variables, conditions, inputs, accepted, rejected in [
    (1,[var('n','value',True)],[cond('n','<=','0'),cond('n','>=','0')],
     [math('value','Integer counterexample $n$')],[{'value':'0'}],{'value':'-1'}),
    (2,[var('n','value',True),var('s','square')],[cond('n^2','=','1'),cond('n','!=','1'),cond('s','=','n^2')],
     [math('value','Integer counterexample $n$'),math('square','$n^2$')],[{'value':'-1','square':'1'}],{'value':'1','square':'1'}),
    (3,[var('x','value'),var('s','square')],[cond('x','<','2'),cond('x^2','>=','4'),cond('s','=','x^2')],
     [math('value','Real counterexample $x$'),math('square','$x^2$')],
     [{'value':'-2','square':'4'},{'value':'-3','square':'9'},{'value':'-5/2','square':'25/4'}],{'value':'-1','square':'1'}),
]:
    witness('quantified-counterexample-construction-variants',variant,variables,conditions,inputs,
            {'antecedent':True,'consequent':False},accepted,rejected)

set_variant('dependent-witness-construction-variants',1,
            [math('formula','Integer choice $m$, in terms of $n$'),math('verification','Substitute your choice into $n+m$ and simplify')],
            [req('dependent-choice','expression',['formula'],{'expected':'9-n','variables':['n']},'The chosen integer expression works for every integer n.'),
             req('substitution','expression',['verification'],{'expected':'9','variables':['n']},'The substituted left side is identically nine.')],
            [ok({'formula':'9-n','verification':'n+(9-n)'}),ok({'formula':'-n+9','verification':'9'}),wrong({'formula':'9+n','verification':'9'})])
set_variant('dependent-witness-construction-variants',3,
            [math('constant','Fixed integer $c$'),math('verification','Substitute your choice into $n+c$')],
            [req('constant','exact',['constant'],{'expected':['-4']},'The same integer works independently of n.'),
             req('identity','expression',['verification'],{'expected':'n-4','variables':['n']},'The substituted expression equals n minus four for every integer n.')],
            [ok({'constant':'-4','verification':'n-4'}),ok({'constant':'-8/2','verification':'-4+n'}),wrong({'constant':'4','verification':'n+4'})])

for variant, expected, alternatives, domains, predicates, rejected in [
    (1,'exists n in Z forall m in Z (m<n+2)',
     ['exists a in Z forall b in Z (b<a+2)','exists n in Z forall m in Z (m<=n+1)'],['Z'],{},
     'forall n in Z exists m in Z (m<n+2)'),
    (2,'forall u in D exists v in D (A(u) and not B(u,v))',
     ['forall x in D exists y in D (not B(x,y) and A(x))'],['D'],{'A':1,'B':2},
     'exists u in D forall v in D (A(u) and not B(u,v))'),
]:
    set_variant('quantifier-negation-production-variants',variant,
                [math('formula','Negated quantified statement','Include each quantifier and its domain; ordinary text or TeX notation is accepted.')],
                [req('quantified-formula','quantified-formula',['formula'],
                     {'expected':expected,'domains':domains,'predicates':predicates,'form':'nnf'},
                     'The negation preserves domains and scope, reverses the required quantifiers, and leaves negation only on atomic predicates.')],
                [ok({'formula':expected}),*(ok({'formula':f}) for f in alternatives),wrong({'formula':rejected})])

countermodel_template = by_id['quantifier-order-countermodel-variants']
countermodel_template.update({'skill':'construct','objective':'finite-quantifier-countermodel',
                              'evidenceLevel':'production','inputCapabilities':['tap']})
for variant in (1,2):
    row_names, col_names = (['a','b'],['a','b']) if variant==1 else (['Ada','Ben'],['Gia','Hal'])
    fields = ['r00','r01','r10','r11']
    pairs = {'id':'pairs','kind':'multiselect','label':'Pairs in the relation' if variant==1 else 'Visitor → guide',
             'emptyLabel':'None','options':[
                 {'id':fields[2*r+c], 'label':f'$({row_names[r]},{col_names[c]})$' if variant==1 else f'{row_names[r]} → {col_names[c]}'}
                 for r in range(2) for c in range(2)]}
    reason = {'id':'reason','kind':'select','label':'Why does this separate the quantifier orders?',
              'options':[
                  {'id':'varying-witness','label':'Each input has a witness, but no output works for every input.'},
                  {'id':'common-witness','label':'One output is a witness for every input.'},
                  {'id':'missing-witness','label':'One input has no witness.'},
              ]}
    requirements = [req('countermodel','boolean-model',['pairs'],
                         {'selectionField':'pairs','variables':{f:f for f in fields},'conditions':[
                             {'formula':'(r00|r01)&(r10|r11)','value':True},
                             {'formula':'(r00&r10)|(r01&r11)','value':False}], 'checks':{}},
                         'Every input has a witness, while no single output witnesses every input.'),
                    req('quantifier-interpretation','selection',['reason'],{'expected':['varying-witness']},
                        'The selected explanation correctly identifies the two quantified conditions.',level='recognition')]
    diagonal={'pairs':['r00','r11'],'reason':'varying-witness'}
    tests=[]
    for values in product([False,True],repeat=4):
        correct=all(any(values[2*r+c] for c in range(2)) for r in range(2)) and not any(all(values[2*r+c] for r in range(2)) for c in range(2))
        tests.append({'response':{'pairs':[f for f,value in zip(fields,values) if value],'reason':'varying-witness'},
                      'verdict':'correct' if correct else 'incorrect'})
    tests += [ok({**diagonal,'pairs':['r11','r00']}),wrong({**diagonal,'reason':'common-witness'}),
              {'response':{'reason':'varying-witness'},'error':True},
              {'response':{'reason':'varying-witness','pairs':None},'error':True},
              {'response':{'reason':'varying-witness','pairs':['unknown']},'error':True}]
    prompt = ('Use exactly $D=\\{a,b\\}$ to define a relation $R$ for which $\\forall x\\exists y\\,R(x,y)$ is true but $\\exists y\\forall x\\,R(x,y)$ is false. Select the pairs in the relation and the explanation. Unselected pairs are absent; select None for the empty relation.'
              if variant==1 else 'There are exactly two visitors, Ada and Ben, and exactly two guides, Gia and Hal. Select who guides whom so each visitor has a guide but no guide serves every visitor. Unselected pairs are absent; select None if nobody guides anyone. Select the explanation of the two quantifier orders.')
    set_variant('quantifier-order-countermodel-variants',variant,[pairs,reason],requirements,tests,
                instructions='Construct the relation and select its explanation.',prompt=prompt,cost='medium',capabilities=['tap'])

assert len(cases)==22,len(cases)
(ROOT/'content/review-templates.json').write_text(json.dumps(templates,ensure_ascii=False,indent=2)+'\n')
(ROOT/'content/deterministic-review-fixtures.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2)+'\n')
print(f'Authored {len(cases)} deterministic Review variants.')
