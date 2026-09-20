#!/usr/bin/env python3
"""Regenerate the per-item decision ledger from inspected prompts and published catalogs.

An unhandled non-proof task is an error: audit family labels never default to open.
Run after deterministic-exercises.py. --pending prints tasks still awaiting authoring.
"""
import argparse
import json
from hashlib import sha256
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIT = json.loads((ROOT / 'docs/deterministic-grading-audit.json').read_text())
CATALOG = {f"{e['lesson']}-{e['id']}": e for e in json.loads((ROOT / 'content/deterministic-exercises.json').read_text())}
EXCLUDED = {'recurrence-relations', 'combinatorics', 'graph-theory', 'asymptotic-growth'}
OWNED = [e for e in AUDIT['exercises'] if not e['displayLessonSlug'].startswith('linear-algebra') and e['displayLessonSlug'] not in EXCLUDED]
assert len(OWNED) == 1015
RELATION_SELECTION = {f'predicates-and-quantifiers-{i}' for i in (83, 84, 87, 89, 95, 96)}
RELATION_SELECTION_INSPECTION = 'docs/deterministic-relation-selection-inspection.md'

def plain(s):
    return re.sub(r'\[([^]]+)\]\(ref:[^)]+\)', r'\1', s).strip()

# These specific prompts have requirements not captured by a generic "prove" verb.
RETAIN = {
    'propositional-logic-31': 'Requires two English rewrites, truth decisions for three statements, and a counterexample for each false integer-divisibility claim. Fixed witness slots disclose which claim fails; a conditional multi-question interface would be more cumbersome.',
    'propositional-logic-32': 'Requires two English rewrites, three truth decisions, and geometric counterexamples for false shape claims. Capturing arbitrary shapes plus prose in deterministic controls adds a drawing/formula construction interface.',
    'propositional-logic-33': 'Requires English converse/contrapositive production and conditional integer counterexamples for whichever divisibility claims are false; fixed answer slots disclose the false claims, while conditional controls increase interaction.',
    'propositional-logic-34': 'Requires English converse/contrapositive production, three truth decisions, and counterexamples only if a parity claim fails. Supplying witness slots or their absence reveals the decisions; the unrestricted combined response stays open.',
    'propositional-logic-35': 'Requires English converse/contrapositive production and conditional real-number counterexamples for false sign/threshold claims. A fixed or conditional questionnaire would reveal the classification or add unnecessary controls.',
    'predicates-and-quantifiers-115': 'Refuting a smallest integer requires a smaller-integer construction for an arbitrary alleged minimum and an argument that it always works; one numeric example does not discharge that quantifier.',
    'functions-60': 'The learner chooses an arbitrary infinite carrier and an injection from that carrier to itself, establishes injectivity, and identifies a missed target. Restricting to an affine formula on a supplied carrier changes that unrestricted construction and justification task.',
    'direct-proof-61': 'Repair requires replacing the single n=8 calculation by a universal even-integer representation and carrying its square argument through; choosing the error alone omits the requested repaired proof.',
    'direct-proof-62': 'Repair requires independent integer witnesses for arbitrary odd inputs and a completed sum argument; recognizing the shared-witness mistake alone does not complete the task.',
    'direct-proof-64': 'The learner must complete the rational-addition proof by establishing integer numerator/denominator and a nonzero product denominator from arbitrary rational inputs.',
    'direct-proof-68': 'Repair requires a witness depending on an arbitrary integer n and verification that it is an allowed larger integer; an isolated numerical witness or recognition choice omits the repaired universal proof.',
    'proof-by-contrapositive-8': 'The learner invents an unrestricted true implication and a false converse, then verifies its counterexample; no fixed proposition domain or mathematical construction language is supplied.',
    'proof-by-contradiction-39': 'The prompt explicitly requires justifying each chosen input’s irrationality as well as constructing a rational sum; checking two radical values would omit those irrationality arguments.',
    'proof-by-contradiction-60': 'The counterexample equation and its domain are unrestricted, and the learner must explain why uniqueness without existence is insufficient. Supplying a fixed equation would replace the requested construction.',
    'proof-by-contradiction-64': 'Repair requires a smaller-positive-real rule valid for every alleged least positive r, with both positivity and strict inequality justified; a single value does not repair the proof.',
    'strong-induction-5': 'The learner chooses an arbitrary nonempty set of positive reals and argues that it has no minimum. A fixed interval or example choice removes the unrestricted construction and no-minimum proof.',
    'strong-induction-15': 'Explicitly requires repeatedly decomposing composite factors of 84 and showing the decomposition; checking only its final prime multiset omits the requested process, while a mandatory decomposition stepper adds interaction.',
    'strong-induction-18': 'Explicitly requires repeated division of 23 by 2 and recording each remainder. A final power-of-two representation does not assess that trace, and a required row-by-row stepper is outside the approved UI scope.',
    'strong-induction-24': 'Requires showing that no nonnegative integer stamp counts make 17 from 4 and 7. Entering “impossible” gives the conclusion but omits the exclusion argument.',
    'strong-induction-56': 'Requires justifying both tiling base values and deriving the recurrence by exhaustive placement cases; entering the already supplied recurrence or selecting a case does not supply the requested derivation.',
    'strong-induction-80': 'Requires the learner to explain proof-method selection with three examples of their own. The examples and their explanations are unrestricted and cannot be preserved by a small fixed choice list.',
    'sequences-and-summations-33': 'Explicitly requires using the finite geometric formula for the six-term sum; entering 189 alone does not show the requested substitution/method, and adding required work-step controls would increase interaction.',
    'sequences-and-summations-44': 'Explicitly requires evaluating by telescoping; the cancellation of intermediate terms is part of the requested work, not just the final value 35.',
    'sequences-and-summations-49': 'Requires simplifying the same sum in two different ways. A final exponential formula checks only the result and cannot establish that both derivations were supplied.',
    'sequences-and-summations-74': 'Requires a verification for every n of both the initial value and the recurrence. The rule and target are already supplied; repeating their final expressions is not the requested substitution argument.',
}

for i in range(48, 56):
    RETAIN[f'propositional-logic-{i}'] = 'Requires producing the equivalence-law rewrite sequence for the displayed formula. A final formula alone omits the named laws and intermediate work; a mandatory formula stepper is outside the approved UI scope.'
for i in [108, 109, 110, 140]:
    RETAIN[f'propositional-logic-{i}'] = 'The prompt specifically requires showing the key rewrite or equivalence-law argument. Equivalent final formulas alone do not establish that requested work.'
RETAIN['propositional-logic-143'] = 'Offers a proof in words, by truth table, or by equivalence laws. Requiring only the truth-table route would remove the explicit method choice; preserving all routes requires an unrestricted proof response.'
RETAIN['sets-and-set-operations-27'] = 'Requires the simplification together with the equivalence laws used. Checking only the simplified set loses the law-based derivation.'
RETAIN['sets-and-set-operations-56'] = 'Requires a partition of all integers and proofs of coverage and disjointness; listing parity blocks alone does not establish the two universal obligations.'

def open_reason(row):
    key = row['key']
    if key in RETAIN:
        return RETAIN[key]
    q = row['publishedQuestion']
    prompt = plain(q['prompt'])
    # A proof request is preserved only after inspecting its actual statement,
    # never because its old audit category happened to be "open" or "mixed".
    if re.search(r'\b(prove|proof|derive|show that|extend it)\b', prompt, re.I):
        if 'induction' in prompt.lower() or key.startswith('mathematical-induction-'):
            obligation = 'The response must supply the base case, valid hypothesis range, and induction step (plus any stated extension or side condition); accepting the given identity or a selected outline would omit those arguments.'
        elif 'contradiction' in prompt.lower():
            obligation = 'The response must construct the contradiction from a valid temporary assumption and justify its deductions; the claim’s truth or a selected contradiction is not the proof.'
        elif 'contraposit' in prompt.lower():
            obligation = 'The response must formulate and prove the contrapositive on the stated domain; grading only a transformed statement would omit the argument.'
        elif 'both inclusions' in prompt or 'element' in prompt.lower():
            obligation = 'The response must reason about arbitrary elements and establish the specified inclusion directions; checking the resulting set identity would not check that element proof.'
        elif 'termination' in prompt.lower():
            obligation = 'The response must establish decreasing recursive inputs, termination, and any stated result invariant for all allowed inputs, not merely return a sample result.'
        elif 'derive' in prompt.lower() or 'two ways' in prompt.lower():
            obligation = 'The response must show the requested derivation and algebraic steps; checking a final formula alone omits the requested work.'
        else:
            obligation = 'The response must give a valid argument on the stated domain, including the requested cases and side conditions; checking a final value, example, or recognition choice would omit that proof.'
        return f'Requested work: {prompt} {obligation}'
    return None

def ledger():
    result, pending = [], []
    for row in OWNED:
        key = row['key']
        q = row['publishedQuestion']
        inspection = RELATION_SELECTION_INSPECTION if key in RELATION_SELECTION else 'docs/deterministic-source-inspection.md'
        base = {'key': key, 'originalHash': row['questionHash'], 'originalTask': q,
                'sourceInspection': inspection, 'source': inspection}
        if key in CATALOG:
            e = CATALOG[key]
            a = e['assessment']
            recognition = a['evidence']['level'] == 'recognition'
            reason_part = any(r.get('evidenceLevel') == 'recognition' for r in a['requirements'])
            outputs = [i['label'] for i in a['inputs']]
            result.append({**base, 'finalMethod': 'deterministic', 'minimalOutputs': outputs,
                           'input': [i['kind'] for i in a['inputs']], 'validator': sorted({r['validator'] for r in a['requirements']}),
                           'reason': f"Requested answer components: {'; '.join(outputs)}. {e['rationale']}",
                           'evidenceChange': 'Brief answer/reason recognition replaces prose; historical production or reasoning records remain distinct.' if recognition else
                                             'Answer creation remains production; any short reason selection records recognition separately.' if reason_part else 'Production preserved.',
                           'batch': 'discrete-conversion', 'promptChange': 'prompt' in e or 'instructions' in e,
                           'sourceHash': e['sourceHash'], 'fixtureCount': len(e['fixtures'])})
        elif row['category'] == 'existing-choice':
            result.append({**base, 'finalMethod': 'deterministic', 'minimalOutputs': ['Existing authored choice'], 'input': ['choice'], 'validator': ['existing-choice'],
                           'reason': f"Already graded by the authored option key for: {plain(q['prompt'])}" + (f" Displayed formula: {q['math']}." if q.get('math') else ''),
                           'evidenceChange': 'Existing recognition objective unchanged.', 'batch': 'existing-deterministic', 'promptChange': False})
        else:
            reason = open_reason(row)
            if reason is None:
                pending.append(key)
                continue
            result.append({**base, 'finalMethod': 'llm', 'minimalOutputs': ['Complete original free response'], 'input': ['open'], 'validator': [],
                           'reason': reason, 'evidenceChange': 'Original reasoning/production contract retained wholly open.', 'batch': 'retained-open', 'promptChange': False})
    return result, pending

REVIEW_RETAIN = {
    'witness-definition/question': 'Definition recall explicitly asks for a brief answer from memory. Valid unrestricted definitions may be paraphrased; a supplied phrase bank would duplicate the separate existing recognition items.',
    'witness-definition-variants/variant-2': 'Definition completion asks the learner to produce the missing meaning. Many concise English completions are valid; a choice control would replace that recall objective with recognition.',
    'dependent-witness-construction-variants/variant-2': 'Requires any integer-valued rule m(n)>n² and an explanation that it works for every integer n. The rule is unrestricted; checking only n²+1 or a fixed formula family would narrow it and omit the universal argument.',
    'quantifier-negation-production-variants/variant-3': 'Explicitly requires one English sentence negating the device/test claim without merely saying not. Free wording is part of the task; a symbolic input or sentence builder would change that English production requirement.',
}

def review_ledger():
    templates = {t['id']: t for t in json.loads((ROOT / 'content/review-templates.json').read_text())}
    result = []
    for row in AUDIT['dedicatedReviewQuestions']:
        t = templates[row['template']]
        q = t['variants'][row['variant']-1] if row['variant'] is not None else t['question']
        a = q.get('assessment')
        base = {'key': row['key'], 'template': row['template'], 'variant': row['variant'], 'originalTask': row['question'],
                'originalHash': sha256(json.dumps(row['question'], ensure_ascii=False, separators=(',', ':')).encode()).hexdigest(),
                'sourceInspection': RELATION_SELECTION_INSPECTION if row['template'] == 'quantifier-order-countermodel-variants' else 'docs/deterministic-source-inspection.md',
                'source': t.get('sourceIds', [])}
        if a:
            labels = [i['label'] for i in a['inputs']]
            result.append({**base, 'finalMethod': 'deterministic', 'minimalOutputs': labels, 'input': [i['kind'] for i in a['inputs']],
                           'validator': sorted({r['validator'] for r in a['requirements']}),
                           'reason': f"Requested components ({'; '.join(labels)}) are checked together by the authored exact requirement predicates; no LLM fallback is needed.",
                           'evidenceChange': 'Finite countermodel construction and interpretation replace an unrestricted justification target; historical reasoning records are preserved.' if 'countermodel' in row['template'] else 'Typed answer creation or finite witness construction preserved; reason selections record recognition.',
                           'batch': 'review-conversion', 'promptChange': q.get('prompt') != row['question'].get('prompt') or q.get('instructions') != row['question'].get('instructions')})
        elif row['key'] in REVIEW_RETAIN:
            result.append({**base, 'finalMethod': 'llm', 'minimalOutputs': ['Complete original free response'], 'input': ['open'], 'validator': [],
                           'reason': REVIEW_RETAIN[row['key']], 'evidenceChange': 'Original free production/justification retained.', 'batch': 'retained-open', 'promptChange': False})
        else:
            assert row['category'] == 'existing-choice', row['key']
            result.append({**base, 'finalMethod': 'deterministic', 'minimalOutputs': ['Existing authored choice'], 'input': ['choice'], 'validator': ['existing-choice'],
                           'reason': f"The existing {'seeded generator' if row['generator'] else 'authored option key'} checks the selected response to: {plain(row['question']['prompt'])}",
                           'evidenceChange': 'Existing recognition objective unchanged.', 'batch': 'existing-deterministic', 'promptChange': False})
    assert len(result) == 173
    return result

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--pending', action='store_true')
    args = args.parse_args()
    rows, pending = ledger()
    reviews = review_ledger()
    if pending:
        print('Unhandled tasks requiring an explicit conversion or retention rationale:')
        print('\n'.join(pending))
        if not args.pending:
            raise SystemExit(1)
    else:
        assert len(rows) == 1015
        (ROOT / 'docs/deterministic-discrete-dispositions.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
    (ROOT / 'docs/deterministic-review-dispositions.json').write_text(json.dumps(reviews, ensure_ascii=False, indent=2)+'\n')
    print('Lessons:', dict(Counter(r['finalMethod'] for r in rows)), 'pending:', len(pending))
    print('Dedicated Review:', dict(Counter(r['finalMethod'] for r in reviews)))
