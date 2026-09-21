import { lazy, type LazyExoticComponent } from 'react';
import type { MDXContent } from 'mdx/types';

// Vite builds this index from the canonical curriculum manifest, then compiles
// these source modules using @mdx-js/rollup. Each lesson is a separate chunk;
// the PWA precaches every chunk for offline navigation.
declare const __LESSON_FILES__: Record<string, string>;
const modules = import.meta.glob<{ default: MDXContent }>('../../content/lessons/*.mdx');
const documents = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [path, lazy(load)]),
);
export function lessonDocument(slug: string): LazyExoticComponent<MDXContent> {
  const document = documents[__LESSON_FILES__[slug]];
  if (!document) throw new Error(`No MDX document for lesson ${slug}`);
  return document;
}
