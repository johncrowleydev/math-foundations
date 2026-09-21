import { readFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Root, RootContent, PhrasingContent } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const content = fileURLToPath(new URL('../content/', import.meta.url));
export const lessonFiles: Record<string, string> = Object.fromEntries(
  (
    parse(readFileSync(resolve(content, 'curriculum.yaml'), 'utf8')).lessons as {
      slug: string;
      lesson: string;
    }[]
  ).map((lesson) => [lesson.slug, '../../content/' + lesson.lesson]),
);
type Reference = {
  id: string;
  lesson: string;
  kind: string;
  aliases: string[];
  linkAliases?: string[];
};
const references: Reference[] = readdirSync(resolve(content, 'references'))
  .sort()
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(resolve(content, 'references', file), 'utf8')));
const sectionId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const headingText = (node: RootContent): string =>
  'value' in node
    ? String(node.value)
    : 'children' in node
      ? node.children.map(headingText).join('')
      : '';

/** Presentation only: decorate the standard MDX tree with section layout components.
 * Every authored component remains JSX and is compiled by @mdx-js/rollup unchanged.
 * This plugin does not read notebook blocks or the server metadata extractor.
 */
export const remarkLessonLayout: Plugin<[], Root> = () => (tree) => {
  const groups: { name: string; title: string; children: RootContent[] }[] = [
    { name: 'LessonIntro', title: '', children: [] },
  ];
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 2)
      groups.push({ name: 'LessonSection', title: headingText(node), children: [] });
    groups.at(-1)!.children.push(node);
  }
  tree.children = groups.map(
    ({ name, title, children }) =>
      ({
        type: 'mdxJsxFlowElement',
        name,
        attributes:
          name === 'LessonIntro'
            ? []
            : [
                { type: 'mdxJsxAttribute', name: 'id', value: sectionId(title) },
                { type: 'mdxJsxAttribute', name: 'title', value: title },
              ],
        children,
      }) as MdxJsxFlowElement,
  );
};

/** Add the existing reference links to text nodes, leaving math, code, headings,
 * authored JSX, and existing links intact. This is a normal remark presentation
 * transform; its input and output stay in the standard MDX compilation pipeline.
 */
export const remarkLessonReferences: Plugin<[], Root> = () => (tree, file) => {
  const lesson = Object.entries(lessonFiles).find(
    ([, path]) => basename(path) === basename(file.path || ''),
  )?.[0];
  const aliases = references
    .filter((r) => r.lesson === lesson && r.kind === 'term')
    .flatMap((r) => (r.linkAliases ?? r.aliases).map((alias) => ({ alias, id: r.id })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const pattern = aliases.length
    ? new RegExp(
        '(?<![a-zA-Z])(' +
          aliases.map(({ alias }) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
          ')(?![a-zA-Z])',
        'gi',
      )
    : null;
  let seen = new Set<string>();
  function link(id: string, children: PhrasingContent[]): PhrasingContent {
    const url = 'ref:' + id + (seen.has(id) ? '?repeat' : '');
    seen.add(id);
    return { type: 'link', url, children };
  }
  function transform(node: RootContent | Root): void {
    if (node.type === 'heading') return;
    if (node.type === 'link') {
      if (node.url.startsWith('ref:')) {
        const id = node.url.slice(4).split('?')[0];
        node.url = 'ref:' + id + (seen.has(id) ? '?repeat' : '');
        seen.add(id);
      } else if (node.url.includes('lessons/')) {
        const slug = Object.entries(lessonFiles).find(
          ([, path]) => basename(path) === basename(node.url),
        )?.[0];
        if (slug) node.url = '#/learn/' + slug;
      } else if (node.url.includes('worksheets/')) node.url = '#/learn/' + lesson + '/practice';
      return;
    }
    if (!('children' in node) || node.type.startsWith('mdx')) return;
    const children: RootContent[] = [];
    for (const child of node.children) {
      if (child.type === 'text' && pattern) {
        let start = 0;
        for (const match of child.value.matchAll(pattern)) {
          if (match.index > start)
            children.push({ type: 'text', value: child.value.slice(start, match.index) });
          const id = aliases.find(
            ({ alias }) => alias.toLowerCase() === match[0].toLowerCase(),
          )!.id;
          children.push(link(id, [{ type: 'text', value: match[0] }]));
          start = match.index + match[0].length;
        }
        children.push({ type: 'text', value: child.value.slice(start) });
      } else {
        transform(child);
        children.push(child);
      }
    }
    // The transform preserves each parent's original block/phrasing category.
    node.children = children as typeof node.children;
  }
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 2) seen = new Set();
    transform(node);
  }
};

/** Preserve display notation for the existing single-line double-dollar formulas. */
export const remarkLessonMath: Plugin<[], Root> = () => (tree, file) => {
  visit(tree, 'inlineMath', (node) => {
    const source = String(file).slice(node.position?.start.offset, node.position?.end.offset);
    if (source.startsWith('$$')) {
      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        className: ['language-math', 'math-display'],
      };
    }
  });
};
