import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

const parser = unified().use(remarkParse).use(remarkMath).use(remarkMdx);
export type LessonComponents = {
  exercises: Record<string, number[]>;
  quickChecks: Record<string, string[]>;
};

/**
 * Parse document MDX, without evaluating JavaScript. Explicit component references
 * compile to the existing React reader's blocks/placements. Keeping its Markdown
 * representation stable also preserves source inspections and frozen grader context.
 */
export function compileLessonMdx(source: string, file = 'lesson.mdx') {
  const tree = parser.parse(source);
  const components: LessonComponents = { exercises: {}, quickChecks: {} };
  const replacements: { start: number; end: number; text: string }[] = [];
  const seenExercises = new Set<number>();
  const seenChecks = new Set<string>();
  const seenSections = new Set<string>();
  let section = '';
  let assessmentStarted = false;
  const fail = (message: string): never => {
    throw new Error(`${file}: ${message}`);
  };
  visit(tree, (node, _index, parent) => {
    if (node.type === 'heading' && node.depth === 2) {
      if (parent !== tree) fail('Teaching headings must be at document level');
      section = source.slice(node.position!.start.offset! + 3, node.position!.end.offset!).trim();
      if (seenSections.has(section)) fail('Duplicate teaching heading: ' + section);
      seenSections.add(section);
      assessmentStarted = false;
    }
    if (!node.type.startsWith('mdx')) {
      if (parent === tree && assessmentStarted)
        fail('Exercise and QuickCheck references must follow the complete teaching section');
      if (node.type === 'image' && node.url.startsWith('figure:'))
        fail('Use an explicit <Figure id="…" alt="…" /> component');
      return;
    }
    if (node.type !== 'mdxJsxFlowElement' || parent !== tree)
      fail('Only document-level component tags are allowed; no imports, exports, or JavaScript');
    if (node.type !== 'mdxJsxFlowElement') return;
    if (!['Figure', 'Exercise', 'QuickCheck'].includes(node.name || ''))
      fail('Unknown lesson component: ' + node.name);
    const raw = source.slice(node.position!.start.offset!, node.position!.end.offset!);
    if (node.children.length || !raw.trimEnd().endsWith('/>'))
      fail('Lesson components must be self-closing references');
    const props: Record<string, string> = {};
    const allowed = node.name === 'Figure' ? ['id', 'alt'] : ['id'];
    for (const attribute of node.attributes) {
      if (attribute.type !== 'mdxJsxAttribute') fail('Component spreads are not allowed');
      if (attribute.type !== 'mdxJsxAttribute') continue;
      if (!allowed.includes(attribute.name) || typeof attribute.value !== 'string')
        fail('Component properties must be explicit, supported string literals');
      if (Object.hasOwn(props, attribute.name)) fail('Duplicate component property');
      props[attribute.name] = attribute.value as string;
    }
    if (!props.id) fail('Component id is required');
    let text = '';
    if (node.name === 'Figure') {
      if (assessmentStarted) fail('Figures must precede section exercises');
      if (!/^[a-z0-9-]+$/.test(props.id) || props.alt === undefined || /[\]\r\n]/.test(props.alt))
        fail('Figure needs a stable id and plain alt text');
      // Runtime-only compatibility representation; never written to authored sources.
      text = `![${props.alt}](figure:${props.id})`;
    } else {
      if (!section || section === 'Practice')
        fail('Assessment references must follow a named teaching section');
      assessmentStarted = true;
      if (node.name === 'Exercise') {
        if (!/^[1-9]\d*$/.test(props.id) || !Number.isSafeInteger(Number(props.id)))
          fail('Exercise id must be a positive worksheet question ID');
        const id = Number(props.id);
        if (seenExercises.has(id)) fail('Duplicate Exercise reference: ' + id);
        seenExercises.add(id);
        (components.exercises[section] ??= []).push(id);
      } else {
        if (!/^quick-[1-9]\d*$/.test(props.id)) fail('Invalid QuickCheck id');
        if (seenChecks.has(props.id)) fail('Duplicate QuickCheck reference: ' + props.id);
        seenChecks.add(props.id);
        (components.quickChecks[section] ??= []).push(props.id);
      }
    }
    replacements.push({
      start: node.position!.start.offset!,
      end: node.position!.end.offset!,
      text,
    });
  });
  let markdown = source;
  for (const replacement of replacements.reverse()) {
    markdown =
      markdown.slice(0, replacement.start) + replacement.text + markdown.slice(replacement.end);
  }
  // Assessment tags are metadata, not prose; do not add blank paragraphs to frozen context.
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  return { markdown, components };
}
