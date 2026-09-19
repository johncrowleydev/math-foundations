import { checkAsymptotic, validateAsymptotic } from './asymptotic';
import {
  extendedExpressionEquivalent,
  hasExtendedExpression,
  validateExtendedExpression,
  type ExpressionOptions,
} from './exponential';
import { linearRequirement, validateLinearRequirement } from './linear';
import { splitValues, parseMatrix } from './math-input';
import { setEqual } from './sets';
import { inequalityEquivalent } from './inequality';
import {
  assessmentFields,
  type Assessment,
  type AssessmentRequirement,
  type AssessmentResult,
  type StructuredResponse,
} from './assessment';
import { Exact, InputError, parseExact, parseExpression, sameExpressionDomain } from './exact';
import {
  booleanEquivalent,
  booleanForm,
  booleanStructure,
  booleanNodeCount,
  negationsOnAtoms,
  evaluateBoolean,
  parseBoolean,
} from './logic';
import { quantifiedEquivalent, parseQuantified } from './quantified';
export { InputError } from './exact';
function bad(s: string): never {
  throw new InputError(s);
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const strings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((s) => typeof s === 'string');
const text = (x: unknown, label = 'answer'): string =>
  typeof x === 'string' && x.trim() ? x : bad(`Enter ${label}.`);
const array = (x: unknown): unknown[] =>
  Array.isArray(x) ? x : bad('Invalid assessment parameters.');
const strlist = (x: unknown): string[] => (strings(x) ? x : bad('Invalid assessment parameters.'));
const normalize = (s: string, caseSensitive = false) => {
  s = s.trim().replace(/\s+/g, ' ');
  return caseSensitive ? s : s.toLowerCase();
};
const exacts = (values: string[]) => values.map(parseExact);
const equalSet = (a: string[], b: string[]) =>
  a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));
function tupleEqual(got: Exact[], expected: Exact[], ordered = true): boolean {
  if (got.length !== expected.length) return false;
  if (ordered) return got.every((x, i) => x.eq(expected[i]));
  const remaining = [...expected];
  return got.every((x) => {
    const i = remaining.findIndex((y) => x.eq(y));
    if (i < 0) return false;
    remaining.splice(i, 1);
    return true;
  });
}
const validators: Record<
  string,
  (r: AssessmentRequirement, response: StructuredResponse) => boolean
> = {
  linear: linearRequirement,
  boolean: (r, a) => r.fields.every((f, i) => a[f] === array(r.params.expected)[i]),
  term: (r, a) =>
    strlist(r.params.accepted).some(
      (s) =>
        normalize(text(a[r.fields[0]]), r.params.caseSensitive === true) ===
        normalize(s, r.params.caseSensitive === true),
    ),
  selection: (r, a) => {
    const value = a[r.fields[0]];
    return equalSet(
      typeof value === 'string' ? [value] : strlist(value),
      strlist(r.params.expected),
    );
  },
  exact: (r, a) =>
    r.fields
      .map((f) => parseExact(text(a[f])))
      .every((x, i) => x.eq(parseExact(strlist(r.params.expected)[i]))),
  tuple: (r, a) =>
    tupleEqual(
      exacts(splitValues(text(a[r.fields[0]]))),
      exacts(strlist(r.params.expected)),
      r.params.ordered !== false,
    ),
  matrix: (r, a) => {
    const expected = array(r.params.expected).map(strlist).map(exacts);
    const got =
      r.fields.length === 1
        ? parseMatrix(text(a[r.fields[0]]))
        : Array.from({ length: expected.length }, (_, i) =>
            r.fields
              .slice(i * expected[0].length, (i + 1) * expected[0].length)
              .map((f) => parseExact(text(a[f]))),
          );
    return got.length === expected.length && got.every((row, i) => tupleEqual(row, expected[i]));
  },
  'boolean-formula': (r, a) => {
    const vars = strlist(r.params.variables),
      got = parseBoolean(text(a[r.fields[0]]), vars),
      expected = parseBoolean(text(r.params.expected), vars);
    return (
      booleanEquivalent(got, expected, vars) &&
      booleanForm(got, typeof r.params.form === 'string' ? r.params.form : undefined) &&
      (!r.params.maxNodes || booleanNodeCount(got) <= Number(r.params.maxNodes)) &&
      (!r.params.negationsOnAtoms || negationsOnAtoms(got)) &&
      (!r.params.structure ||
        booleanStructure(got, parseBoolean(text(r.params.structure), vars), vars))
    );
  },
  'boolean-model': (r, a) => {
    const variableFields = r.params.variables as Record<string, string>;
    const variables = Object.keys(variableFields),
      assignment = Object.fromEntries(variables.map((v) => [v, a[variableFields[v]] as boolean]));
    const conditions = array(r.params.conditions).map((raw) => {
      if (!object(raw)) bad('Invalid Boolean model condition.');
      return evaluateBoolean(parseBoolean(text(raw.formula), variables), assignment) === raw.value;
    });
    const checks = Object.entries((r.params.checks || {}) as Record<string, string>).map(
      ([field, formula]) =>
        a[field] === evaluateBoolean(parseBoolean(formula, variables), assignment),
    );
    return [...conditions, ...checks].every(Boolean);
  },
  'quantified-formula': (r, a) =>
    [text(r.params.expected), ...strlist(r.params.alternatives || [])].some((expected) =>
      quantifiedEquivalent(
        text(a[r.fields[0]]),
        expected,
        strlist(r.params.domains),
        r.params.predicates as Record<string, number>,
        typeof r.params.form === 'string' ? r.params.form : undefined,
        {
          constants: strlist(r.params.constants || []),
          freeVariables: strlist(r.params.freeVariables || []),
          functions: (r.params.functions || {}) as Record<string, number>,
        },
      ),
    ),
  set: (r, a) =>
    setEqual(
      text(a[r.fields[0]]),
      strlist(r.params.expected),
      r.params.atoms ? strlist(r.params.atoms) : [],
    ),
  inequality: (r, a) =>
    inequalityEquivalent(text(a[r.fields[0]]), text(r.params.expected), text(r.params.variable)),
  'asymptotic-bound': checkAsymptotic,
  expression: (r, a) => {
    const options = r.params as unknown as ExpressionOptions;
    if (hasExtendedExpression(options))
      return extendedExpressionEquivalent(text(a[r.fields[0]]), text(r.params.expected), options);
    const vars = strlist(r.params.variables),
      got = parseExpression(text(a[r.fields[0]]), vars),
      expected = parseExpression(text(r.params.expected), vars),
      domain = r.params.domain ? strlist(r.params.domain).map((s) => parseExpression(s, vars)) : [];
    return got.eq(expected) && sameExpressionDomain(got, expected, domain);
  },
  witness: (r, a) => {
    const values: Record<string, Exact> = {};
    let domainValid = true;
    for (const raw of array(r.params.variables)) {
      if (!object(raw)) bad('Invalid witness definition.');
      const value = parseExact(text(a[text(raw.field)]));
      if (raw.integer === true) {
        try {
          value.integer();
        } catch (e) {
          if (e instanceof InputError) domainValid = false;
          else throw e;
        }
      }
      if (raw.nonInteger === true) {
        try {
          value.integer();
          domainValid = false;
        } catch (e) {
          if (!(e instanceof InputError)) throw e;
        }
      }
      if (raw.rational === true || raw.irrational === true) {
        let rational = true;
        try {
          value.rational();
        } catch (e) {
          if (e instanceof InputError) rational = false;
          else throw e;
        }
        if ((raw.rational === true && !rational) || (raw.irrational === true && rational))
          domainValid = false;
      }
      values[text(raw.name)] = value;
    }
    if (!domainValid) return false;
    const evaluate = (s: string) => {
      const vars = Object.keys(values);
      let expression = s;
      for (const v of vars.sort((a, b) => b.length - a.length)) {
        // Substitution is token bounded; field values are parsed independently first.
        const raw = array(r.params.variables).find((x) => object(x) && x.name === v) as Record<
          string,
          unknown
        >;
        expression = expression.replace(
          new RegExp('\\b' + v + '\\b', 'g'),
          '(' + text(a[text(raw.field)]) + ')',
        );
      }
      return parseExact(expression);
    };
    return array(r.params.conditions).every((raw) => {
      if (!object(raw)) bad('Invalid witness condition.');
      const left = evaluate(text(raw.left));
      if (raw.op === 'rational' || raw.op === 'irrational') {
        let rational = true;
        try {
          left.rational();
        } catch (e) {
          if (e instanceof InputError) rational = false;
          else throw e;
        }
        return raw.op === 'rational' ? rational : !rational;
      }
      const right = evaluate(text(raw.right));
      if (raw.op === 'divides' || raw.op === 'not-divides') {
        let divisor: bigint, dividend: bigint;
        try {
          divisor = left.integer();
          dividend = right.integer();
        } catch (e) {
          if (e instanceof InputError) return false;
          throw e;
        }
        const divides = divisor === 0n ? dividend === 0n : dividend % divisor === 0n;
        return raw.op === 'divides' ? divides : !divides;
      }
      const difference = left.sub(right);
      switch (raw.op) {
        case '=':
          return difference.isZero();
        case '!=':
          return !difference.isZero();
        case '<':
          return difference.sign() < 0;
        case '<=':
          return difference.sign() <= 0;
        case '>':
          return difference.sign() > 0;
        case '>=':
          return difference.sign() >= 0;
        default:
          return bad('Unknown witness condition.');
      }
    });
  },
  interval: (r, a) => {
    const lower = a[r.fields[0]],
      upper = a[r.fields[1]];
    const endpoint = (x: unknown, y: unknown) => {
      const aliases = (s: string) =>
        s
          .trim()
          .replace(/\\infty|∞/g, 'infinity')
          .replace(/^\+/, '');
      const sx = text(x),
        sy = text(y);
      if (/infinity|infty|∞/.test(sx + sy)) return aliases(sx) === aliases(sy);
      return parseExact(sx).eq(parseExact(sy));
    };
    return (
      endpoint(lower, r.params.lower) &&
      endpoint(upper, r.params.upper) &&
      a[r.fields[2]] === r.params.leftClosed &&
      a[r.fields[3]] === r.params.rightClosed
    );
  },
};
export const validatorNames = Object.keys(validators);
export function validateAssessment(value: unknown): asserts value is Assessment {
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.inputs) ||
    !value.inputs.length ||
    value.inputs.length > 128 ||
    !Array.isArray(value.requirements) ||
    !value.requirements.length ||
    value.requirements.length > 1024
  )
    throw Error('Invalid deterministic assessment definition.');
  if (
    !object(value.feedback) ||
    typeof value.feedback.correct !== 'string' ||
    !value.feedback.correct.trim() ||
    typeof value.feedback.incorrect !== 'string' ||
    !value.feedback.incorrect.trim()
  )
    throw Error('Assessment feedback is required.');
  if (
    !object(value.evidence) ||
    !['recognition', 'production', 'reasoning'].includes(String(value.evidence.level)) ||
    !['low', 'medium', 'high'].includes(String(value.evidence.interactionCost)) ||
    !Array.isArray(value.evidence.inputCapabilities) ||
    !value.evidence.inputCapabilities.length ||
    value.evidence.inputCapabilities.some(
      (x) => !['tap', 'short-text', 'math-text'].includes(String(x)),
    )
  )
    throw Error('Invalid assessment evidence.');
  const inputIds = new Set<string>();
  for (const input of value.inputs) {
    if (
      !object(input) ||
      typeof input.id !== 'string' ||
      !input.id ||
      inputIds.has(input.id) ||
      typeof input.label !== 'string' ||
      !input.label.trim()
    )
      throw Error('Every input needs a unique ID and label.');
    inputIds.add(input.id);
    if (
      !['text', 'math', 'boolean', 'select', 'multiselect', 'grid', 'interval'].includes(
        String(input.kind),
      )
    )
      throw Error('Unknown assessment input.');
    if (input.kind === 'grid') {
      if (
        !strings(input.columns) ||
        !input.columns.length ||
        input.columns.length > 64 ||
        !Array.isArray(input.rows) ||
        !input.rows.length ||
        input.rows.length > 256
      )
        throw Error('Invalid grid shape.');
      for (const row of input.rows) {
        if (!object(row) || !Array.isArray(row.cells) || row.cells.length !== input.columns.length)
          throw Error('Invalid grid row.');
        for (const cell of row.cells) {
          if (!object(cell)) throw Error('Invalid grid cell.');
          if ('given' in cell) {
            if (typeof cell.given !== 'string' && typeof cell.given !== 'boolean')
              throw Error('Invalid given cell.');
            if ('id' in cell) throw Error('Given cells cannot be editable.');
          } else if (
            typeof cell.id !== 'string' ||
            !['boolean', 'text'].includes(String(cell.kind))
          )
            throw Error('Invalid editable cell.');
        }
      }
    }
    if (input.kind === 'select' || input.kind === 'multiselect') {
      if (!Array.isArray(input.options) || !input.options.length || input.options.length > 256)
        throw Error('Selection options required.');
      const ids = new Set<string>();
      for (const o of input.options) {
        if (
          !object(o) ||
          typeof o.id !== 'string' ||
          !o.id ||
          ids.has(o.id) ||
          typeof o.label !== 'string' ||
          !o.label.trim()
        )
          throw Error('Invalid selection option.');
        ids.add(o.id);
      }
    }
  }
  const a = value as unknown as Assessment,
    fields = assessmentFields(a),
    ids = new Set<string>();
  if (fields.length > 2048) throw Error('Too many assessment fields.');
  for (const f of fields) {
    if (
      f.id.length > 200 ||
      ['__proto__', 'prototype', 'constructor'].includes(f.id) ||
      !/^[A-Za-z0-9_.:-]+$/.test(f.id) ||
      ids.has(f.id)
    )
      throw Error('Invalid or duplicate assessment field: ' + f.id);
    ids.add(f.id);
  }
  const requirements = new Set<string>(),
    covered = new Set<string>();
  for (const r of a.requirements) {
    if (
      !object(r) ||
      typeof r.id !== 'string' ||
      !r.id ||
      requirements.has(r.id) ||
      typeof r.description !== 'string' ||
      !r.description.trim() ||
      !strings(r.fields) ||
      !r.fields.length ||
      new Set(r.fields).size !== r.fields.length ||
      r.fields.some((f) => !ids.has(f)) ||
      !object(r.params) ||
      !Object.hasOwn(validators, r.validator)
    )
      throw Error('Invalid assessment requirement.');
    if (
      r.evidenceLevel !== undefined &&
      !['recognition', 'production', 'reasoning'].includes(r.evidenceLevel)
    )
      throw Error('Invalid requirement evidence level.');
    requirements.add(r.id);
    r.fields.forEach((f) => covered.add(f));
    if (
      r.validator === 'boolean' &&
      (!Array.isArray(r.params.expected) ||
        r.params.expected.length !== r.fields.length ||
        r.params.expected.some((x) => typeof x !== 'boolean'))
    )
      throw Error('Boolean expected values must match fields.');
    if (
      r.validator === 'exact' &&
      (!strings(r.params.expected) || r.params.expected.length !== r.fields.length)
    )
      throw Error('Exact expected values must match fields.');
    if (
      ['term', 'selection', 'tuple', 'boolean-formula', 'expression'].includes(r.validator) &&
      r.fields.length !== 1
    )
      throw Error('This validator takes one field.');
    if (r.validator === 'term' && (!strings(r.params.accepted) || !r.params.accepted.length))
      throw Error('Accepted terms required.');
    if (['selection', 'tuple'].includes(r.validator) && !strings(r.params.expected))
      throw Error('Expected values required.');
    if (r.validator === 'linear') validateLinearRequirement(r);
    if (r.validator === 'boolean-formula') {
      if (
        r.params.maxNodes !== undefined &&
        (!Number.isInteger(r.params.maxNodes) ||
          Number(r.params.maxNodes) < 1 ||
          Number(r.params.maxNodes) > 128)
      )
        throw Error('Invalid formula complexity bound.');
      if (
        !strings(r.params.variables) ||
        !r.params.variables.length ||
        r.params.variables.length > 8
      )
        throw Error('Invalid Boolean variables.');
      parseBoolean(text(r.params.expected), r.params.variables);
      if (
        r.params.form &&
        !['nnf', 'no-implication', 'contrapositive'].includes(String(r.params.form))
      )
        throw Error('Unknown Boolean form.');
      if (r.params.form === 'contrapositive' && !r.params.structure)
        throw Error('Contrapositive requires an authored structural target.');
    }
    if (r.validator === 'boolean-model') {
      if (
        !object(r.params.variables) ||
        !Object.keys(r.params.variables).length ||
        Object.keys(r.params.variables).length > 8 ||
        Object.values(r.params.variables).some(
          (f) =>
            typeof f !== 'string' ||
            !r.fields.includes(f) ||
            fields.find((x) => x.id === f)?.kind !== 'boolean',
        ) ||
        !Array.isArray(r.params.conditions)
      )
        throw Error('Invalid Boolean model definition.');
      const variables = Object.keys(r.params.variables);
      for (const raw of r.params.conditions) {
        if (!object(raw) || typeof raw.value !== 'boolean')
          throw Error('Invalid Boolean model condition.');
        parseBoolean(text(raw.formula), variables);
      }
      if (r.params.checks) {
        if (!object(r.params.checks)) throw Error('Invalid Boolean model checks.');
        for (const [field, formula] of Object.entries(r.params.checks)) {
          if (!r.fields.includes(field) || fields.find((x) => x.id === field)?.kind !== 'boolean')
            throw Error('Invalid Boolean model check field.');
          parseBoolean(text(formula), variables);
        }
      }
    }
    if (r.validator === 'quantified-formula') {
      if (
        r.fields.length !== 1 ||
        !strings(r.params.domains) ||
        !r.params.domains.length ||
        !object(r.params.predicates) ||
        Object.values(r.params.predicates).some(
          (n) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 8,
        ) ||
        (r.params.form && r.params.form !== 'nnf')
      )
        throw Error('Invalid quantified formula definition.');
      if (
        r.params.functions !== undefined &&
        (!object(r.params.functions) ||
          Object.values(r.params.functions).some(
            (n) => !Number.isInteger(n) || Number(n) < 1 || Number(n) > 8,
          ))
      )
        throw Error('Invalid function symbols.');
      for (const name of ['constants', 'freeVariables', 'alternatives'])
        if (r.params[name] !== undefined && !strings(r.params[name]))
          throw Error('Invalid quantified formula ' + name);
      for (const target of [text(r.params.expected), ...strlist(r.params.alternatives || [])])
        parseQuantified(target, r.params.domains, r.params.predicates as Record<string, number>, {
          constants: strlist(r.params.constants || []),
          freeVariables: strlist(r.params.freeVariables || []),
          functions: (r.params.functions || {}) as Record<string, number>,
        });
    }
    if (r.validator === 'set') {
      if (
        r.fields.length !== 1 ||
        !strings(r.params.expected) ||
        (r.params.atoms !== undefined && !strings(r.params.atoms))
      )
        throw Error('Invalid set definition.');
      setEqual(
        '{' + r.params.expected.join(',') + '}',
        r.params.expected,
        (r.params.atoms || []) as string[],
      );
    }
    if (r.validator === 'inequality') {
      if (r.fields.length !== 1 || !/^[A-Za-z][A-Za-z0-9_]*$/.test(text(r.params.variable)))
        throw Error('Invalid inequality definition.');
      inequalityEquivalent(
        text(r.params.expected),
        text(r.params.expected),
        text(r.params.variable),
      );
    }
    if (r.validator === 'asymptotic-bound') validateAsymptotic(r);
    if (r.validator === 'expression') {
      if (
        !strings(r.params.variables) ||
        r.params.variables.some((v) => !/^[_A-Za-z][_A-Za-z0-9]*$/.test(v))
      )
        throw Error('Invalid expression variables.');
      const options = r.params as unknown as ExpressionOptions;
      if (hasExtendedExpression(options)) {
        validateExtendedExpression(text(r.params.expected), options);
        continue;
      }
      parseExpression(text(r.params.expected), r.params.variables);
      if (r.params.domain)
        strlist(r.params.domain).forEach((s) => parseExpression(s, r.params.variables as string[]));
    }
    if (r.validator === 'exact' || r.validator === 'tuple')
      strlist(r.params.expected).forEach(parseExact);
    if (r.validator === 'matrix') {
      const expected = array(r.params.expected).map(strlist);
      if (
        !expected.length ||
        !expected[0].length ||
        expected.some((row) => row.length !== expected[0].length) ||
        (r.fields.length !== 1 && r.fields.length !== expected.length * expected[0].length)
      )
        throw Error('Invalid expected matrix shape.');
      expected.flat().forEach(parseExact);
    }
    if (r.validator === 'selection') {
      const field = fields.find((f) => f.id === r.fields[0]);
      if (
        !field?.options ||
        strlist(r.params.expected).some((id) => !field.options!.some((o) => o.id === id))
      )
        throw Error('Unknown expected selection.');
    }
    if (
      r.validator === 'interval' &&
      (r.fields.length !== 4 ||
        typeof r.params.leftClosed !== 'boolean' ||
        typeof r.params.rightClosed !== 'boolean')
    )
      throw Error('Invalid interval definition.');
  }
  if ([...ids].some((id) => !covered.has(id)))
    throw Error('Every editable field needs a grading requirement.');
}
export function gradeAssessment(a: Assessment, response: StructuredResponse): AssessmentResult {
  validateAssessment(a);
  if (!object(response)) bad('Enter an answer before submitting.');
  const fields = assessmentFields(a),
    ids = new Set(fields.map((f) => f.id));
  if (Object.keys(response).some((id) => !ids.has(id)))
    bad('This saved answer uses a different input definition. Restore it as earlier work.');
  for (const f of fields) {
    const v = response[f.id];
    if (v === null || v === undefined || v === '') bad(`Complete ${f.label}.`);
    switch (f.kind) {
      case 'boolean':
        if (typeof v !== 'boolean') bad(`Choose true or false for ${f.label}.`);
        break;
      case 'select':
        if (typeof v !== 'string' || !f.options?.some((o) => o.id === v))
          bad(`Select an answer for ${f.label}.`);
        break;
      case 'multiselect':
        if (
          !strings(v) ||
          new Set(v).size !== v.length ||
          v.some((id) => !f.options?.some((o) => o.id === id))
        )
          bad(`Select the members of ${f.label}, or mark it empty.`);
        break;
      default:
        text(v, f.label);
    }
  }
  // Evaluate every condition even when an earlier one fails, so invalid syntax
  // anywhere cannot be hidden behind a mathematically incorrect first field.
  const requirements = a.requirements.map((r) => ({
    id: r.id,
    description: r.description,
    satisfied: validators[r.validator](r, response),
  }));
  const verdict = requirements.every((r) => r.satisfied) ? 'correct' : 'incorrect';
  return { verdict, feedback: a.feedback[verdict], requirements };
}
