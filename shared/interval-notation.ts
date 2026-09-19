import { InputError } from './exact';
import { splitValues } from './math-input';
/** Translate ordinary finite interval notation into the existing exact linear-set checker. */
export function intervalNotation(source: string, variable: string): string {
  const s = source
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\mathbb\{R\}/g, 'R')
    .replace(/\\(?:infty)\b|∞/g, 'infinity')
    .replace(/\\(?:cup)\b|∪|\bunion\b/g, ' UNION ')
    .replace(/\\(?:setminus|backslash)\b|∖/g, '\\')
    .replace(/^R\s*\\\{/, 'R SETMINUS {')
    .replace(/\\([{}])/g, '$1')
    .replace('SETMINUS', '\\')
    .replace(/\\(?:emptyset|varnothing)\b|∅/g, '{}')
    .trim();
  if (s === 'R') return `${variable}=${variable}`;
  if (s === '{}') return `${variable}!=${variable}`;
  const minus = /^R\s*\\\s*\{(.*)\}$/.exec(s);
  if (minus)
    return (
      splitValues(minus[1])
        .map((x) => `${variable}!=(${x})`)
        .join(' and ') || `${variable}=${variable}`
    );
  const pieces = s.split(' UNION ');
  if (pieces.length > 64) throw new InputError('Use at most 64 intervals.');
  const convert = (raw: string): string | null => {
    const p = raw.trim();
    if (!/^[[(]/.test(p) || !/[\])]$/.test(p)) return null;
    // Ordinary parentheses in an inequality remain untouched unless there is a top-level comma.
    const interior = p.slice(1, -1);
    let depth = 0,
      comma = false;
    for (const c of interior) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
      if (c === ',' && depth === 0) comma = true;
    }
    if (!comma) return null;
    const values = splitValues(interior);
    if (values.length !== 2) return null;
    const [a, b] = values,
      lo = a.trim().replace(/^\+/, ''),
      hi = b.trim().replace(/^\+/, '');
    const lower = lo === '-infinity',
      upper = hi === 'infinity';
    if (
      lo === 'infinity' ||
      hi === '-infinity' ||
      (lower && p[0] === '[') ||
      (upper && p.at(-1) === ']')
    )
      throw new InputError('Use an open endpoint at infinity.');
    const parts = [];
    if (!lower) parts.push(`${variable}${p[0] === '[' ? '>=' : '>'}(${a})`);
    if (!upper) parts.push(`${variable}${p.at(-1) === ']' ? '<=' : '<'}(${b})`);
    return parts.join(' and ') || `${variable}=${variable}`;
  };
  const converted = pieces.map(convert);
  if (converted.every((x) => x !== null)) return converted.map((x) => `(${x})`).join(' or ');
  if (pieces.length > 1)
    throw new InputError('Write each interval with two endpoints, such as [-2,-1] union [1,2].');
  return source;
}
