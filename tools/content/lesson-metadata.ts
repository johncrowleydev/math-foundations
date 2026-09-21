import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import { literalProps, validateLessonTree } from './lesson-mdx-policy.js';

const parser = unified().use(remarkParse).use(remarkMath).use(remarkMdx);
export type LessonComponents = {
  exercises: Record<string, number[]>;
  quickChecks: Record<string, string[]>;
};

export function parseLessonMdx(source: string, file = 'lesson.mdx') {
  const tree = parser.parse(source);
  validateLessonTree(tree, file);
  return tree;
}

/**
 * Static catalog metadata only. The browser compiles the original MDX through the
 * standard MDX React compiler; neither this tree nor these records renders lessons.
 * Assessment references are omitted from grader teaching context. All remaining
 * prose and component references retain their native MDX spelling.
 */
export function extractLessonMetadata(source: string, file = 'lesson.mdx') {
  const tree = parseLessonMdx(source, file);
  const components: LessonComponents = { exercises: {}, quickChecks: {} };
  const assessments: { start: number; end: number }[] = [];
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
    const assessment =
      (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
      (node.name === 'Exercise' || node.name === 'QuickCheck');
    if (!assessment) {
      if (parent === tree && assessmentStarted)
        fail('Exercise and QuickCheck references must follow the complete teaching section');
      return;
    }
    if (node.type !== 'mdxJsxFlowElement' || parent !== tree || node.children.length)
      fail('Assessment references must be self-closing document-level components');
    const props = literalProps(node);
    if (Object.keys(props).some((key) => key !== 'id'))
      fail('Assessment references accept only a declarative id');
    if (!section || section === 'Practice')
      fail('Assessment references must follow a named teaching section');
    assessmentStarted = true;
    if (node.name === 'Exercise') {
      const id = Number(props.id);
      if (!/^[1-9]\d*$/.test(String(props.id)) || !Number.isSafeInteger(id))
        fail('Exercise id must be a positive worksheet question ID');
      if (seenExercises.has(id)) fail('Duplicate Exercise reference: ' + id);
      seenExercises.add(id);
      (components.exercises[section] ??= []).push(id);
    } else {
      if (typeof props.id !== 'string' || !/^quick-[1-9]\d*$/.test(props.id))
        fail('Invalid QuickCheck id');
      const id = props.id as string;
      if (seenChecks.has(id)) fail('Duplicate QuickCheck reference: ' + id);
      seenChecks.add(id);
      (components.quickChecks[section] ??= []).push(id);
    }
    assessments.push({ start: node.position!.start.offset!, end: node.position!.end.offset! });
  });
  let mdx = source;
  for (const assessment of assessments.reverse())
    mdx = mdx.slice(0, assessment.start) + mdx.slice(assessment.end);
  return { mdx: mdx.replace(/\n{3,}/g, '\n\n'), components };
}
