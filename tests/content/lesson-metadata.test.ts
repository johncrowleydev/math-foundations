import assert from 'node:assert/strict';
import test from 'node:test';
import { extractLessonMetadata } from '../../tools/content/lesson-metadata.js';

test('document MDX preserves mathematics and explicit React component placements', () => {
  const compiled = extractLessonMetadata(`# Example

Read $\\{x:x<2\\}$ first.

## An example

Use $x^2$.

<Figure id="sample" alt="A &amp; B" />

<Exercise id="14" />

<QuickCheck id="quick-2" />
`);
  assert.equal(
    compiled.mdx,
    '# Example\n\nRead $\\{x:x<2\\}$ first.\n\n## An example\n\nUse $x^2$.\n\n<Figure id="sample" alt="A &amp; B" />\n\n',
  );
  assert.deepEqual(compiled.components, {
    exercises: { 'An example': [14] },
    quickChecks: { 'An example': ['quick-2'] },
  });
});

test('plain reading-only lessons need no components and retain Markdown source', () => {
  const source = '# Introduction\n\nRead a paragraph.\n\n## Study\n\nTake your time.\n';
  assert.deepEqual(extractLessonMetadata(source), {
    mdx: source,
    components: { exercises: {}, quickChecks: {} },
  });
});

for (const [name, source] of Object.entries({
  import: 'import { makeLesson } from "./authoring";\n\n## Example\n',
  export: 'export const content = "text";\n',
  loop: '{Array.from({length: 2}, (_, i) => <Exercise id={i} />)}',
  expression: 'The result is {1 + 2}.',
  spread: '<Exercise {...props} />',
  eventHandler: '<Exercise id="14" onClick="run()" />',
  rawHtml: '<script>alert(1)</script>',
  nestedContent: '<Exercise id="14">Some text</Exercise>',
  inlineComponent: 'Read <Exercise id="14" /> now.',
  figureImage: '![A figure](figure:sample)',
  duplicateProperty: '<Exercise id="14" id="15" />',
  duplicateExercise: '<Exercise id="14" />\n\n<Exercise id="14" />',
  duplicateCheck: '<QuickCheck id="quick-1" />\n\n<QuickCheck id="quick-1" />',
  invalidId: '<Exercise id="0" />',
  unsafeInteger: '<Exercise id="99999999999999999" />',
  trailingProse: '<Exercise id="14" />\n\nThis teaches a prerequisite too late.',
  trailingSubsection: '<Exercise id="14" />\n\n### More teaching\n\nRead this.',
  trailingFigure: '<Exercise id="14" />\n\n<Figure id="sample" alt="Sample" />',
  duplicateHeading: '## Example\n\nMore teaching.',
})) {
  test('document MDX rejects ' + name, () => {
    assert.throws(() => extractLessonMetadata('## Example\n\n' + source, 'invalid.mdx'));
  });
}

test('reading introductions and practice headings cannot hide inline assessments', () => {
  assert.throws(
    () => extractLessonMetadata('# Introduction\n\n<Exercise id="1" />'),
    /named teaching section/,
  );
  assert.throws(
    () => extractLessonMetadata('## Practice\n\n<Exercise id="1" />'),
    /named teaching section/,
  );
});

test('component-looking examples inside code are inert documentation', () => {
  const source = '# Example\n\n```mdx\n<Exercise id={dynamic} />\n```\n';
  assert.equal(extractLessonMetadata(source).mdx, source);
});

test('metadata accepts a new React component and literal props without parser registration', () => {
  const source =
    '# Example\n\n<TruthTableBuilder rows={4} from={-2} compact={false} label="Truth table" optional={null} />\n';
  assert.equal(extractLessonMetadata(source).mdx, source);
  assert.deepEqual(
    extractLessonMetadata('## Example\n\n<Exercise id={14} />').components.exercises,
    { Example: [14] },
  );
});

test('generic React components may wrap readable document children or appear inline', () => {
  const source =
    '# Example\n\n<Callout>\n\nRead this **carefully**.\n\n</Callout>\n\nHere is an <InlineBadge label="example" />.\n';
  assert.equal(extractLessonMetadata(source).mdx, source);
});

for (const expression of [
  'makeLesson()',
  'items.map(x => x)',
  '[1, 2]',
  '{content: "prose"}',
  'Infinity',
]) {
  test('component props reject executable or constructed content: ' + expression, () => {
    assert.throws(() => extractLessonMetadata('<TruthTableBuilder value={' + expression + '} />'));
  });
}
