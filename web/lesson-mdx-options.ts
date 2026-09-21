import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import type { Options } from '@mdx-js/rollup';
import { remarkDocumentRules } from '../scripts/lesson-mdx-policy.ts';
import {
  remarkLessonLayout,
  remarkLessonReferences,
  remarkLessonMath,
} from './lesson-mdx-plugins.ts';

// Both Vite and the rendering tests use this standard MDX compiler configuration.
export const lessonMdxOptions: Options = {
  remarkPlugins: [
    remarkMath,
    remarkGfm,
    remarkDocumentRules,
    remarkLessonMath,
    remarkLessonReferences,
    remarkLessonLayout,
  ],
  rehypePlugins: [[rehypeKatex, { throwOnError: false, trust: false, strict: 'ignore' }]],
};
