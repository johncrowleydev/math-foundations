import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';

type Element = MdxJsxFlowElement | MdxJsxTextElement;
export type LiteralProp = string | number | boolean | null;

/** Read a literal without evaluating the MDX document or an expression. */
export function literalProps(node: Element): Record<string, LiteralProp> {
  const props: Record<string, LiteralProp> = {};
  for (const attribute of node.attributes) {
    if (attribute.type !== 'mdxJsxAttribute') throw Error('Component spreads are not allowed');
    if (Object.hasOwn(props, attribute.name)) throw Error('Duplicate component property');
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(attribute.name) || /^on[A-Z]/.test(attribute.name))
      throw Error('Component properties must be explicit data properties');
    props[attribute.name] = literalValue(attribute);
  }
  return props;
}

function literalValue(attribute: MdxJsxAttribute): LiteralProp {
  if (attribute.value === null) return true;
  if (typeof attribute.value === 'string') return attribute.value;
  const program = attribute.value?.data?.estree;
  const statement = program?.body[0];
  if (program?.body.length === 1 && statement?.type === 'ExpressionStatement') {
    const expression = statement.expression;
    if (
      expression.type === 'Literal' &&
      (expression.value === null || ['string', 'boolean', 'number'].includes(typeof expression.value))
    ) {
      if (typeof expression.value !== 'number' || Number.isFinite(expression.value))
        return expression.value as LiteralProp;
    }
    if (
      expression.type === 'UnaryExpression' &&
      expression.operator === '-' &&
      expression.argument.type === 'Literal' &&
      typeof expression.argument.value === 'number' &&
      Number.isFinite(expression.argument.value)
    )
      return -expression.argument.value;
  }
  throw Error('Component properties must be literal strings, numbers, booleans, or null');
}

/** Generic document policy, independent of the component registry and metadata schema. */
export function validateLessonTree(tree: Root, file = 'lesson.mdx') {
  try {
    visit(tree, (node) => {
      if (!node.type.startsWith('mdx')) {
        if (node.type === 'image' && node.url.startsWith('figure:'))
          throw Error('Use an explicit <Figure id="…" /> component');
        return;
      }
      if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')
        throw Error('Lesson documents cannot contain imports, exports, or JavaScript expressions');
      if (!node.name || !/^[A-Z][A-Za-z0-9]*$/.test(node.name))
        throw Error('Use named React components from the lesson component registry');
      literalProps(node);
    });
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }
}

/** Standard remark validation plugin. It validates; it never rewrites the document. */
export function remarkDocumentRules() {
  return (tree: Root, file: { path?: string }) => validateLessonTree(tree, file.path);
}
