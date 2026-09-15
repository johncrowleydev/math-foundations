import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sources, type SourceCatalog } from '../src/Sources';
const catalog: SourceCatalog = {
  bibliography: {
    book: {
      title: 'A textbook',
      author: 'An author',
      edition: 'University, 2026',
      url: 'https://example.org',
    },
  },
  citations: {
    section: {
      source: 'book',
      locator: '§2.1',
      url: 'https://example.org/chapter',
      supports: 'A definition.',
    },
  },
  targets: { 'lesson/section': ['section'], 'reference:term': ['section'] },
};
test('sources are collapsed, deduplicated, keyboard-native disclosures with safe external links', () => {
  const html = renderToStaticMarkup(
    createElement(Sources, { catalog, targets: ['lesson/section', 'reference:term'] }),
  );
  assert.match(html, /<details class="content-sources">/);
  assert.doesNotMatch(html, /<details[^>]* open/);
  assert.match(html, /<summary>Sources<\/summary>/);
  assert.equal((html.match(/<li>/g) || []).length, 1);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /A definition/);
});
test('exercise sources explain their scope and empty sources add no chrome', () => {
  const html = renderToStaticMarkup(
    createElement(Sources, { catalog, target: 'lesson/section', exercise: true }),
  );
  assert.match(html, /Background for this original exercise/);
  assert.equal(renderToStaticMarkup(createElement(Sources, { catalog, target: 'missing' })), '');
});
