import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import katex from 'katex';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

const text = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => !/[\u0000-\u0009\u000b-\u001f\u007f]/.test(value),
    'Control characters are not allowed; use single-quoted YAML for TeX backslashes',
  );
const sourcePath = (folder: string, extension: string) =>
  text.refine(
    (value) =>
      value.startsWith(`${folder}/`) &&
      value.endsWith(extension) &&
      !value.includes('..') &&
      !value.includes('\\'),
    `Expected a relative ${folder}/*${extension} path without traversal`,
  );
export const curriculumSchema = z
  .object({
    course: text,
    currentLesson: text,
    lessons: z
      .array(
        z
          .object({
            slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
            title: text,
            eyebrow: text.optional(),
            subject: text.default('Discrete mathematics'),
            number: z.number().int().nonnegative().optional(),
            lesson: sourcePath('lessons', '.md'),
            worksheet: sourcePath('worksheets', '.yaml').optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const slugs = value.lessons.map((lesson) => lesson.slug);
    if (new Set(slugs).size !== slugs.length)
      ctx.addIssue({ code: 'custom', message: 'Lesson slugs must be unique' });
    if (!slugs.includes(value.currentLesson))
      ctx.addIssue({ code: 'custom', message: 'currentLesson must reference a lesson slug' });
    for (const subject of new Set(value.lessons.map((l) => l.subject))) {
      const lessons = value.lessons.filter((l) => l.subject === subject);
      if (lessons.every((l) => l.number !== undefined)) {
        if (lessons[0].number !== 0 || lessons[0].title !== 'Introduction' || lessons[0].worksheet)
          ctx.addIssue({
            code: 'custom',
            message: `${subject} must begin with a reading-only 00 Introduction`,
          });
        if (lessons.some((l, i) => l.number !== i))
          ctx.addIssue({
            code: 'custom',
            message: `${subject} lesson numbers must be consecutive from zero`,
          });
      }
    }
  });

export const worksheetSchema = z
  .object({
    title: text,
    instructions: text.optional(),
    sections: z
      .array(
        z
          .object({
            title: text,
            instructions: text.optional(),
            questions: z
              .array(
                z
                  .object({
                    id: z.number().int().positive(),
                    type: z
                      .enum([
                        'freeform',
                        'truth-value',
                        'translation',
                        'truth-table',
                        'equivalence',
                        'classification',
                        'reasoning',
                        'argument',
                      ])
                      .default('freeform'),
                    prompt: text,
                    math: text.optional(),
                    answerLines: z.number().int().min(1).max(12),
                    answer: text,
                    table: z
                      .object({
                        columns: z.array(text).min(2).max(6),
                        rows: z.number().int().min(2).max(8),
                      })
                      .strict()
                      .optional(),
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const questions = value.sections.flatMap((section) => section.questions);
    if (new Set(questions.map((q) => q.id)).size !== questions.length)
      ctx.addIssue({ code: 'custom', message: 'Question IDs must be unique' });
    for (const q of questions) {
      if (q.type === 'truth-table' && !q.table)
        ctx.addIssue({ code: 'custom', message: `Question ${q.id}: truth-table requires table` });
    }
  });
export type Worksheet = z.infer<typeof worksheetSchema>;
export const contentRoot = path.resolve('content');
export async function readYaml(file: string): Promise<unknown> {
  return parse(await readFile(file, 'utf8'), { uniqueKeys: true });
}
export function validateMath(markdown: string) {
  const tree = unified().use(remarkParse).use(remarkMath).parse(markdown);
  visit(tree, (node) => {
    if (node.type === 'math' || node.type === 'inlineMath') {
      katex.renderToString((node as unknown as { value: string }).value, {
        throwOnError: true,
        strict: 'error',
      });
    }
  });
}
export async function loadContent() {
  const curriculum = curriculumSchema.parse(
    await readYaml(path.join(contentRoot, 'curriculum.yaml')),
  );
  const lessons = await Promise.all(
    curriculum.lessons.map(async (lesson) => {
      let markdown = await readFile(path.join(contentRoot, lesson.lesson), 'utf8');
      validateMath(markdown);
      // The manifest owns the page title. Markdown retains its H1 for repository readers.
      markdown = markdown.replace(/^# .+\r?\n/, '').trim();
      let worksheet: Worksheet | undefined;
      if (lesson.worksheet) {
        worksheet = worksheetSchema.parse(await readYaml(path.join(contentRoot, lesson.worksheet)));
        validateMath(worksheet.instructions || '');
        for (const section of worksheet.sections) {
          validateMath(section.instructions || '');
          for (const q of section.questions) {
            validateMath(`${q.prompt}\n${q.answer}`);
            for (const math of [q.math, ...(q.table?.columns || [])]) {
              if (math) katex.renderToString(math, { throwOnError: true, strict: 'error' });
            }
          }
        }
      }
      return { ...lesson, markdown, worksheetData: worksheet };
    }),
  );
  return { ...curriculum, lessons };
}
