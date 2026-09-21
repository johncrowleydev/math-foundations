import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import { literalProps } from './lesson-mdx-policy.js';

const parser = unified().use(remarkParse).use(remarkMath).use(remarkMdx);

/**
 * Migration comparison only: normalize OLD image markers and native MDX figures to
 * the same semantic records. This never creates legacy Markdown or renders content.
 */
export function comparableTeaching(source: string) {
  const tree = parser.parse(source);
  const parts: ({ text: string } | { figureId: string; alt: string | null })[] = [];
  let start = 0;
  for (const node of tree.children) {
    let figure: { figureId: string; alt: string | null } | undefined;
    if (node.type === 'mdxJsxFlowElement' && node.name === 'Figure') {
      const props = literalProps(node);
      if (typeof props.id !== 'string') throw Error('Figure comparison requires an id');
      figure = { figureId: props.id, alt: typeof props.alt === 'string' ? props.alt : null };
    } else if (
      node.type === 'paragraph' &&
      node.children.length === 1 &&
      node.children[0].type === 'image' &&
      node.children[0].url.startsWith('figure:')
    ) {
      const image = node.children[0];
      figure = { figureId: image.url.slice('figure:'.length), alt: image.alt ?? null };
    }
    if (!figure) continue;
    const text = source.slice(start, node.position!.start.offset!).trim();
    if (text) parts.push({ text });
    parts.push(figure);
    start = node.position!.end.offset!;
  }
  const text = source.slice(start).trim();
  if (text) parts.push({ text });
  return parts;
}

// Only editorial digests and the figure spelling differ. Everything else,
// including exact prose, block IDs, assessment order, and contracts, is compared.
export function comparableNotebook(notebook: any) {
  const copy = structuredClone(notebook);
  for (const lesson of copy.lessons) {
    lesson.intro = comparableTeaching(lesson.intro);
    for (const section of lesson.sections) {
      section.markdown = comparableTeaching(section.markdown);
      for (const check of section.quickChecks) delete check.teachingHash;
    }
  }
  return copy;
}

export function comparableCatalog(catalog: any) {
  const copy = structuredClone(catalog);
  delete copy.version;
  // The original pre-authoring-migration baseline predates this additive bank.
  // Exhaustive Go fixtures independently cover all 521 variants and rotations.
  delete copy.reviewVariants;
  const cache = new Map<string, ReturnType<typeof comparableTeaching>>();
  const compare = (source: string) => {
    if (!cache.has(source)) cache.set(source, comparableTeaching(source));
    return cache.get(source);
  };
  for (const exercise of Object.values(copy.exercises) as any[]) {
    exercise.introduction = compare(exercise.introduction);
    for (const section of exercise.teaching) section.markdown = compare(section.markdown);
  }
  return copy;
}

export function gradingContracts(catalog: any) {
  return Object.fromEntries(
    Object.entries(catalog.exercises).map(([id, item]: [string, any]) => [
      id,
      {
        lessonSlug: item.lessonSlug,
        analytics: item.analytics,
        choice: item.choice,
        assessment: item.assessment,
        question: item.question,
      },
    ]),
  );
}
