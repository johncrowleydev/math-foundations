import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import 'fake-indexeddb/auto';
import { createElement, useState, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import type { MDXComponents } from 'mdx/types';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { parse } from 'yaml';
import { remarkDocumentRules } from '../../scripts/lesson-mdx-policy';
import { remarkLessonLayout, remarkLessonReferences } from '../lesson-mdx-plugins';
import type { Curriculum, Lesson } from '../src/types';

// Exercise imports the browser storage/auth modules. Effects are not run by SSR;
// use a local event target and IndexedDB shim only while loading that registry.
const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const savedChannel = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: undefined });
const { LessonRuntime, lessonComponents } = await import('../src/LessonDocument');
const { Exercise } = await import('../src/Exercise');
if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
else Reflect.deleteProperty(globalThis, 'window');
if (savedChannel) Object.defineProperty(globalThis, 'BroadcastChannel', savedChannel);
else Reflect.deleteProperty(globalThis, 'BroadcastChannel');

const readJson = async (name: string) =>
  JSON.parse(
    await readFile(new URL('../../output/content/' + name + '.json', import.meta.url), 'utf8'),
  );
const [notebook, teaching, syntax, typing, grading, evidence, sources] = await Promise.all(
  [
    'notebook',
    'teaching',
    'tex-syntax',
    'tex-teaching',
    'grading-version',
    'learning-evidence',
    'sources',
  ].map(readJson),
);
const data: Curriculum = {
  ...teaching,
  lessons: notebook.lessons,
  syntax: syntax.entries,
  basics: typing.basics,
  placements: typing.placements,
  requirements: typing.exercises,
  referenceSyntax: typing.references,
  version: grading.version,
  evidence,
  sources,
};
const manifest = parse(
  await readFile(new URL('../../content/curriculum.yaml', import.meta.url), 'utf8'),
) as {
  lessons: { slug: string; lesson: string }[];
};
const lesson = data.lessons.find((item) => item.slug === 'calculus-definite-integrals')!;

async function document(source: string, path = 'registry-probe.mdx') {
  return (
    await evaluate(
      { value: source, path },
      {
        ...runtime,
        remarkPlugins: [
          remarkMath,
          remarkGfm,
          remarkDocumentRules,
          remarkLessonReferences,
          remarkLessonLayout,
        ],
        rehypePlugins: [[rehypeKatex, { throwOnError: false, trust: false, strict: 'ignore' }]],
      },
    )
  ).default;
}
function render(children: ReactNode, current = lesson) {
  return renderToStaticMarkup(createElement(LessonRuntime, { data, lesson: current, children }));
}

test('a new ordinary React component needs only a registry entry, including literal props and children', async () => {
  let received: { label: string; count: number; active: boolean } | undefined;
  function RegistryProbe({
    label,
    count,
    active,
    children,
  }: {
    label: string;
    count: number;
    active: boolean;
    children: ReactNode;
  }) {
    const [initialCount] = useState(count);
    received = { label, count, active };
    return createElement(
      'aside',
      { 'data-count': initialCount, 'data-active': active },
      label,
      children,
    );
  }
  const Document = await document(
    '# Registry test\n\n<RegistryProbe label="sample" count={4} active={true}>\n\n**Nested document text**\n\n</RegistryProbe>\n',
  );
  const html = render(
    createElement(Document, { components: { ...lessonComponents, RegistryProbe } }),
  );
  assert.deepEqual(received, { label: 'sample', count: 4, active: true });
  assert.match(html, /<aside data-count="4" data-active="true">sample/);
  assert.match(html, /<strong>Nested document text<\/strong>/);
});

test('Exercise and QuickCheck resolve to the existing React Exercise with unchanged learner identities', () => {
  const question = lesson.questions.find((item) => !item.quickSource)!;
  const check = lesson.sections.flatMap((section) => section.quickChecks)[0];
  for (const [name, id, expected] of [
    ['Exercise', String(question.id), question],
    ['QuickCheck', check.id, lesson.questions.find((item) => item.id === check.exerciseId)!],
  ] as const) {
    let element: ReactElement<{ q: typeof question; lesson: Lesson; data: Curriculum }> | undefined;
    function InspectResolvedComponent() {
      const Component = lessonComponents[name] as (props: { id: string }) => ReactElement;
      let resolved = Component({ id });
      // QuickCheck intentionally delegates through the same registered Exercise.
      if (resolved.type === lessonComponents.Exercise)
        resolved = (resolved.type as (props: { id: string }) => ReactElement)(
          resolved.props as { id: string },
        );
      element = resolved as typeof element;
      return null;
    }
    render(createElement(InspectResolvedComponent));
    assert.equal(element?.type, Exercise, name + ' must use the real React Exercise');
    assert.equal(element?.props.q, expected);
    assert.equal(element?.props.lesson, lesson);
    assert.equal(element?.props.data, data);
  }
});

test('Figure is a real React figure with the existing SVG and controls', async () => {
  const figure = data.figures.find((item) => item.lesson === lesson.slug)!;
  const Document = await document(`<Figure id="${figure.id}" />`);
  const html = render(createElement(Document, { components: lessonComponents }));
  assert.match(html, /<figure/);
  assert.match(html, /<svg/);
  assert.ok(html.includes(figure.title));
  assert.match(html, />Expand<\/button>/);
  assert.doesNotMatch(html, /src="figure:/);
});

test('all canonical lessons compile to React without legacy blocks or canonical source writes', async (t) => {
  for (const entry of manifest.lessons) {
    await t.test(entry.slug, async () => {
      const file = new URL('../../content/' + entry.lesson, import.meta.url);
      const source = await readFile(file, 'utf8');
      const current = data.lessons.find((item) => item.slug === entry.slug)!;
      const Document = await document(source, fileURLToPath(file));
      const components: MDXComponents = {
        ...lessonComponents,
        // Browser tests exercise the real stateful component. These probes make
        // SSR check every authored assessment tag without starting browser hooks.
        Exercise: ({ id }: { id: string }) => createElement('span', { 'data-exercise-id': id }),
        QuickCheck: ({ id }: { id: string }) => createElement('span', { 'data-check-id': id }),
      };
      const withoutLegacyBlocks = {
        ...current,
        introBlocks: [],
        sections: current.sections.map((section) => ({ ...section, blocks: [] })),
      };
      const html = render(createElement(Document, { components }), withoutLegacyBlocks);
      assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
      assert.equal(
        (html.match(/<figure(?:\s|>)/g) || []).length,
        (source.match(/<Figure\s/g) || []).length,
      );
      assert.deepEqual(
        [...html.matchAll(/data-(exercise|check)-id="([^"]+)"/g)].map(([, kind, id]) => [kind, id]),
        [...source.matchAll(/<(Exercise|QuickCheck)\s+id="([^"]+)"/g)].map(([, component, id]) => [
          component === 'Exercise' ? 'exercise' : 'check',
          id,
        ]),
      );
      for (const section of current.sections)
        assert.ok(html.includes(`id="section-${section.id}"`), 'Missing section ' + section.id);
      assert.doesNotMatch(html, /src="figure:/);
      assert.equal(
        await readFile(file, 'utf8'),
        source,
        'MDX compilation must never rewrite canonical content',
      );
    });
  }
});
