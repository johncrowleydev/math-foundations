import type { Diagnostic } from '@codemirror/lint';
import type { Syntax } from './types';
import katex from 'katex';
export function mathRanges(text: string) {
  const result: { from: number; to: number; body: string; display: boolean; closed: boolean }[] =
    [];
  const escaped = (i: number) => {
    let n = 0;
    while (i > 0 && text[--i] === '\\') n++;
    return n % 2 === 1;
  };
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '$' || escaped(i)) continue;
    const from = i;
    const display = text[i + 1] === '$';
    const size = display ? 2 : 1;
    i += size;
    const start = i;
    while (
      i < text.length &&
      !(text[i] === '$' && !escaped(i) && (!display || text[i + 1] === '$'))
    )
      i++;
    const closed = i < text.length;
    result.push({ from, to: closed ? i + size : i, body: text.slice(start, i), display, closed });
    i += size - 1;
  }
  return result;
}
export function diagnostics(text: string, syntax: Syntax[]): Diagnostic[] {
  const commands = new Set(syntax.flatMap((s) => (s.command ? [s.command] : [])));
  return mathRanges(text).flatMap((r) => {
    const errors: Diagnostic[] = [];
    if (!r.closed)
      errors.push({
        from: r.from,
        to: r.to,
        severity: 'warning',
        message: 'Close this math block with ' + (r.display ? '$$' : '$'),
      });
    for (const m of r.body.matchAll(/\\([a-zA-Z]+)/g)) {
      if (!commands.has(m[1]))
        errors.push({
          from: r.from + (r.display ? 2 : 1) + m.index!,
          to: r.from + (r.display ? 2 : 1) + m.index! + m[0].length,
          severity: 'warning',
          message: 'Command not in the taught syntax library: ' + m[0],
        });
    }
    try {
      katex.renderToString(r.body, { throwOnError: true, trust: false, strict: 'ignore' });
    } catch (e) {
      errors.push({
        from: r.from,
        to: r.to,
        severity: 'error',
        message: String(e).replace('ParseError: KaTeX parse error: ', ''),
      });
    }
    return errors;
  });
}
