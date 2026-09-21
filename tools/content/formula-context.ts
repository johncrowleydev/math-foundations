import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import type { TeachingData } from './teaching.js';

export function mathOccurrences(markdown: string): string[] {
  const result: string[] = [];
  visit(unified().use(remarkParse).use(remarkMath).parse(markdown), (node) => {
    if (node.type === 'math' || node.type === 'inlineMath')
      result.push((node as unknown as { value: string }).value);
  });
  return result;
}
export type FormulaSource = { lesson: string; source: string; markdown: string };
export function validateFormulaContexts(sources: FormulaSource[], teaching: TeachingData) {
  const normalized = (latex: string) => latex.trim().replace(/\s+/g, ' ');
  const keyed = new Map(
    sources.map((s) => [s.lesson + '\n' + s.source, mathOccurrences(s.markdown)]),
  );
  if (keyed.size !== sources.length) throw Error('Duplicate formula source context');
  const claimed = new Set<string>();
  for (const formula of teaching.formulas) {
    const key = formula.lesson + '\n' + formula.source;
    const occurrence = key + '\n' + formula.ordinal;
    if (claimed.has(occurrence)) throw Error('Ambiguous formula explanation: ' + formula.id);
    claimed.add(occurrence);
    const source = keyed.get(key)?.[formula.ordinal];
    if (source === undefined || normalized(source) !== normalized(formula.latex))
      throw Error('Formula explanation no longer matches its exact source: ' + formula.id);
  }
  return sources.flatMap((s) =>
    mathOccurrences(s.markdown).map((latex, ordinal) => ({
      lesson: s.lesson,
      source: s.source,
      ordinal,
      latex,
      hasExplanation: claimed.has(s.lesson + '\n' + s.source + '\n' + ordinal),
    })),
  );
}
