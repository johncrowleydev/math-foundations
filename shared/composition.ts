import type { AssessmentRequirement, StructuredResponse } from './assessment';
import { InputError } from './exact';
type Letter = { name: string; inverse: boolean };
type Options = {
  expected: string;
  functions: Record<string, [string, string]>;
  form?: 'individual-inverses';
};
function parse(
  source: string,
  functions: Options['functions'],
): { word: Letter[]; compoundInverse: boolean } {
  if (source.length > 4096) throw new InputError('Use a shorter composition.');
  const s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\circ\b|∘/g, ' o ')
    .replace(/\\(?:operatorname|mathrm)\{id\}/g, 'id')
    .replace(/\\(?:,|;|quad|qquad| )/g, ' ')
    .replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'))
    .replace(/−/g, '-');
  const tokens = s.match(/[A-Za-z][A-Za-z0-9_]*|\d+|[^\s]/g) || [];
  if (tokens.length > 256) throw new InputError('Use fewer composition factors.');
  let at = 0,
    compoundInverse = false;
  const take = (s: string) => (tokens[at] === s ? (at++, true) : false);
  const atom = (depth: number): Letter[] => {
    if (depth > 32) throw new InputError('Use fewer nested compositions.');
    let word: Letter[];
    if (take('(')) {
      word = product(depth + 1);
      if (!take(')')) throw new InputError('Close the composition parentheses.');
    } else {
      const name = tokens[at++];
      if (name === 'id' || name === 'I') word = [];
      else if (Object.hasOwn(functions, name)) word = [{ name, inverse: false }];
      else throw new InputError('Use the named functions, composition, and inverse exponents.');
    }
    while (take('^')) {
      const grouped = take('('),
        negative = take('-');
      if (!take('1') || (grouped && !take(')')))
        throw new InputError('Use exponent -1 for a function inverse.');
      if (negative) {
        if (word.length > 1) compoundInverse = true;
        word = [...word].reverse().map((x) => ({ ...x, inverse: !x.inverse }));
      }
    }
    return word;
  };
  const product = (depth: number): Letter[] => {
    let word = atom(depth);
    while (take('o')) word = [...word, ...atom(depth)];
    return word;
  };
  const word = product(0);
  if (at !== tokens.length) throw new InputError('Join function names with o or \\circ.');
  return { word, compoundInverse };
}
function reduced(word: Letter[]): Letter[] {
  const out: Letter[] = [];
  for (const x of word) {
    const previous = out.at(-1);
    if (previous?.name === x.name && previous.inverse !== x.inverse) out.pop();
    else out.push(x);
  }
  return out;
}
function typed(word: Letter[], functions: Options['functions']): [string, string] | null {
  if (!word.length) return ['', ''];
  const signatures = word.map((x) =>
    x.inverse ? [...functions[x.name]].reverse() : functions[x.name],
  );
  if (signatures.some((x, i) => i + 1 < signatures.length && x[0] !== signatures[i + 1][1]))
    return null;
  return [signatures.at(-1)![0], signatures[0][1]];
}
export function checkComposition(r: AssessmentRequirement, response: StructuredResponse): boolean {
  const p = r.params as unknown as Options,
    source = response[r.fields[0]];
  if (typeof source !== 'string') throw new InputError('Enter the inverse composition.');
  const actual = parse(source, p.functions),
    expected = parse(p.expected, p.functions),
    a = typed(actual.word, p.functions),
    b = typed(expected.word, p.functions);
  if (
    !a ||
    !b ||
    (actual.word.length && b.some((x, i) => a[i] !== x)) ||
    (!actual.word.length && b[0] !== b[1]) ||
    (p.form === 'individual-inverses' && actual.compoundInverse)
  )
    return false;
  const left = reduced(actual.word),
    right = reduced(expected.word);
  return (
    left.length === right.length &&
    left.every((x, i) => x.name === right[i].name && x.inverse === right[i].inverse)
  );
}
export function validateComposition(r: AssessmentRequirement): void {
  const p = r.params as unknown as Options;
  if (
    r.fields.length !== 1 ||
    typeof p.expected !== 'string' ||
    !p.functions ||
    typeof p.functions !== 'object' ||
    Array.isArray(p.functions) ||
    Object.keys(p.functions).length < 1 ||
    Object.keys(p.functions).length > 8 ||
    Object.entries(p.functions).some(
      ([name, signature]) =>
        !/^[A-Za-z][A-Za-z0-9_]*$/.test(name) ||
        ['id', 'I', 'o'].includes(name) ||
        !Array.isArray(signature) ||
        signature.length !== 2 ||
        signature.some((x) => typeof x !== 'string' || !x),
    ) ||
    (p.form !== undefined && p.form !== 'individual-inverses')
  )
    throw Error('Invalid composition definition.');
  if (!typed(parse(p.expected, p.functions).word, p.functions))
    throw Error('Composition target has incompatible domains.');
}
