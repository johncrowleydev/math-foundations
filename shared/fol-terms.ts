import { Expression, InputError, parseExpression, sameExpressionDomain } from './exact';
export type FunctionTerm = { name: string; args: Expression[]; symbol: string };
/** Lift total uninterpreted function terms to shared symbols, keeping bound-variable identity. */
export function logicalExpression(
  source: string,
  variables: string[],
  functions: Record<string, number> = {},
  registry: FunctionTerm[] = [],
  depth = 0,
): Expression {
  if (depth > 64) throw new InputError('Function terms are nested too deeply.');
  const exclusions: Expression['exclusions'] = [];
  let result = '';
  for (let i = 0; i < source.length;) {
    const match = /^([A-Za-z][A-Za-z0-9_]*)\s*\(/.exec(source.slice(i));
    if (
      !match ||
      !Object.hasOwn(functions, match[1]) ||
      (i > 0 && /[A-Za-z0-9_]/.test(source[i - 1]))
    ) {
      result += source[i++];
      continue;
    }
    const name = match[1],
      start = i + match[0].length;
    let end = start,
      nesting = 1,
      part = start;
    const raw: string[] = [];
    while (end < source.length && nesting) {
      const c = source[end];
      if (c === '(') nesting++;
      if (c === ')') nesting--;
      if (c === ',' && nesting === 1) {
        raw.push(source.slice(part, end));
        part = end + 1;
      }
      if (nesting === 0) {
        raw.push(source.slice(part, end));
        break;
      }
      end++;
    }
    if (nesting || raw.length !== functions[name] || raw.some((s) => !s.trim()))
      throw new InputError(`Use ${name} with ${functions[name]} arguments.`);
    const args = raw.map((s) => logicalExpression(s, variables, functions, registry, depth + 1));
    args.forEach((arg) => exclusions.push(...arg.exclusions));
    let existing = registry.find(
      (term) =>
        term.name === name &&
        term.args.length === args.length &&
        args.every(
          (arg, index) => arg.eq(term.args[index]) && sameExpressionDomain(arg, term.args[index]),
        ),
    );
    if (!existing) {
      if (registry.length >= 128) throw new InputError('Use fewer function terms.');
      let id = registry.length,
        symbol: string;
      do {
        symbol = 'functionValue' + id++;
      } while (variables.includes(symbol) || registry.some((t) => t.symbol === symbol));
      existing = { name, args, symbol };
      registry.push(existing);
    }
    result += existing.symbol;
    i = end + 1;
  }
  const expression = parseExpression(result, [
    ...variables,
    ...registry.map((term) => term.symbol),
  ]);
  return new Expression(expression.num, expression.den, [...expression.exclusions, ...exclusions]);
}
