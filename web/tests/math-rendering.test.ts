import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import katex from 'katex';
import { Rich } from '../src/Rich';

test('Markdown and direct math share the renderer used by the stylesheet', () => {
  const require = createRequire(import.meta.url);
  const markdown = createRequire(require.resolve('rehype-katex'));
  assert.equal(markdown.resolve('katex'), require.resolve('katex'));
  for (const command of ['ne', 'neq']) {
    const tex = `5\\${command} 7`;
    const rendered = renderToStaticMarkup(createElement(Rich, { text: `$${tex}$` }));
    const classes = (html: string) =>
      [...html.matchAll(/class="([^"]+)"/g)].map((m) => m[1]).filter((c) => c !== 'rich ');
    assert.deepEqual(classes(rendered), classes(katex.renderToString(tex)));
    assert.ok(rendered.includes('katex-inner'));
  }
});
