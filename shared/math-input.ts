import { Exact, InputError, parseExact } from './exact';
function bad(s: string): never {
  throw new InputError(s);
}
function enclosed(s: string, left: string, right: string): boolean {
  if (!s.startsWith(left) || !s.endsWith(right)) return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === left) depth++;
    if (s[i] === right) depth--;
    if (depth === 0 && i < s.length - 1) return false;
  }
  return depth === 0;
}
export function splitValues(source: string): string[] {
  let s = source
    // A source newline after a TeX row break does not start an empty row.
    .replace(/\\\\\s*/g, ';')
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\(?:begin|end)\{[pbvBV]?matrix\}/g, '')
    .trim();
  if (enclosed(s, '(', ')') || enclosed(s, '[', ']')) s = s.slice(1, -1);
  const out: string[] = [];
  let start = 0,
    depth = 0;
  for (let i = 0; i < s.length; i++) {
    if ('([{'.includes(s[i])) depth++;
    if (')]}'.includes(s[i])) depth--;
    if (depth < 0) bad('Check the answer delimiters.');
    if (
      depth === 0 &&
      (s[i] === ',' ||
        s[i] === ';' ||
        s[i] === '&' ||
        s.slice(i, i + 2) === '\\\\' ||
        s[i] === '\n')
    ) {
      out.push(s.slice(start, i).trim());
      if (s.slice(i, i + 2) === '\\\\') i++;
      start = i + 1;
    }
  }
  if (depth !== 0) bad('Close the answer delimiters.');
  out.push(s.slice(start).trim());
  if (out.some((v) => !v)) bad('Fill each requested entry.');
  return out;
}
export function parseMatrix(source: string): Exact[][] {
  let s = source
    .replace(/\\\\\s*/g, ';')
    .trim()
    .replace(/^\$\$?|\$\$?$/g, '')
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\begin\{[pbvBV]?matrix\}/g, '')
    .replace(/\\end\{[pbvBV]?matrix\}/g, '')
    .trim();
  s = s.replace(/\\([{}])/g, '$1');
  if (enclosed(s, '[', ']') || enclosed(s, '{', '}')) s = s.slice(1, -1).trim();
  const grouped = splitValues(s);
  if (
    grouped.length > 1 &&
    grouped.every((row) => enclosed(row, '(', ')') || enclosed(row, '[', ']'))
  ) {
    const rows = grouped.map((row) => splitValues(row).map(parseExact));
    if (rows.some((row) => row.length !== rows[0].length)) bad('Use equal-length vector rows.');
    return rows;
  }
  const rows = s.split(/\\\\|;|\n|\]\s*,\s*\[/).map((r) => r.replace(/^\[|\]$/g, '').trim());
  const result = rows.map((r) => splitValues(r).map(parseExact));
  if (!result.length || result.some((r) => r.length !== result[0].length))
    bad('Use equal-length matrix rows, separated by semicolons.');
  return result;
}
