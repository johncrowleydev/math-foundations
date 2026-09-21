import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import type { MDXComponents } from 'mdx/types';
import type { Curriculum, Lesson } from './types';
import { Exercise as ExerciseView } from './Exercise';
import { Figure as FigureView } from './Figure';
import { ContentContext, Copy, Rich } from './Rich';
import { Sources } from './Sources';

const Runtime = createContext<{ data: Curriculum; lesson: Lesson; tutorials: boolean } | null>(
  null,
);
export function LessonRuntime({
  data,
  lesson,
  tutorials = false,
  children,
}: {
  data: Curriculum;
  lesson: Lesson;
  tutorials?: boolean;
  children: ReactNode;
}) {
  return <Runtime.Provider value={{ data, lesson, tutorials }}>{children}</Runtime.Provider>;
}
export function LessonReady({ slug, onReady }: { slug: string; onReady: (slug: string) => void }) {
  useLayoutEffect(() => {
    onReady(slug);
  }, [slug, onReady]);
  return null;
}
function useLesson() {
  const runtime = useContext(Runtime);
  if (!runtime) throw new Error('Lesson components require LessonRuntime');
  return runtime;
}
function Exercise({ id }: { id: string }) {
  const { data, lesson } = useLesson();
  const question = lesson.questions.find((q) => String(q.id) === id);
  if (!question) throw new Error(`Unknown exercise ${lesson.slug}/${id}`);
  return <ExerciseView key={id} q={question} lesson={lesson} data={data} />;
}
function QuickCheck({ id }: { id: string }) {
  const { lesson } = useLesson();
  const check = lesson.sections.flatMap((s) => s.quickChecks).find((q) => q.id === id);
  if (!check?.exerciseId) throw new Error(`Unknown quick check ${lesson.slug}/${id}`);
  return <Exercise id={String(check.exerciseId)} />;
}
function Figure({ id }: { id: string; alt?: string }) {
  const { data } = useLesson();
  const figure = data.figures.find((f) => f.id === id);
  if (!figure) throw new Error(`Unknown figure ${id}`);
  return <FigureView figure={figure} sources={data.sources} />;
}
function LessonLink({ href, children }: { href?: string; children?: ReactNode }) {
  const context = useContext(ContentContext);
  return href?.startsWith('ref:') ? (
    <button
      className={'term ' + (href.includes('?repeat') ? 'repeat' : '')}
      onClick={() => context?.reference(href.slice(4).split('?')[0])}
    >
      {children}
    </button>
  ) : (
    <a href={href} {...(href?.startsWith('#') ? {} : { target: '_blank', rel: 'noreferrer' })}>
      {children}
    </a>
  );
}

/** The children are already compiled React elements, never parsed Markdown.
 * Figure boundaries retain existing formula-source identities for math popovers.
 */
function Prose({ children, prefix }: { children: ReactNode; prefix: string }) {
  const context = useContext(ContentContext);
  const result: ReactNode[] = [];
  let text: ReactNode[] = [];
  const flush = (suffix: string) => {
    if (!text.length) return;
    result.push(
      <div
        key={suffix}
        className="rich"
        onClick={(event) => {
          const math = (event.target as HTMLElement).closest('.katex');
          const latex = math?.querySelector('annotation')?.textContent;
          const formula = context?.data.formulas.find(
            (f) =>
              f.lesson === context.lesson &&
              f.source === prefix + ':' + suffix &&
              f.latex === latex,
          );
          if (formula) context.formula(formula);
        }}
      >
        {text}
      </div>,
    );
    text = [];
  };
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ id: string }>(child) && child.type === Figure) {
      flush('text-before-' + child.props.id);
      result.push(child);
    } else text.push(child);
  }
  flush('text-end');
  return result;
}
function LessonIntro({ children }: { children: ReactNode }) {
  const { data, lesson } = useLesson();
  return (
    <div className="lesson-intro" id="lesson-start">
      <span className="eyebrow">{lesson.eyebrow}</span>
      <Prose prefix="intro">{children}</Prose>
      <Sources catalog={data.sources} target={`${lesson.slug}/intro`} />
    </div>
  );
}
function LessonSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const { data, lesson, tutorials } = useLesson();
  // The worksheet appendix is presented by the existing Practice route.
  if (title === 'Practice') return null;
  const elements = Children.toArray(children);
  const firstAssessment = elements.findIndex(
    (child) => isValidElement(child) && (child.type === Exercise || child.type === QuickCheck),
  );
  const teaching = firstAssessment < 0 ? elements : elements.slice(0, firstAssessment);
  const assessments = firstAssessment < 0 ? [] : elements.slice(firstAssessment);
  return (
    <section id={'section-' + id} data-section data-title={title}>
      <div className="teaching">
        <Prose prefix={'section:' + id}>{teaching}</Prose>
        <Sources catalog={data.sources} target={`${lesson.slug}/${id}`} />
      </div>
      <Typing
        data={data}
        lesson={lesson.slug}
        section={id}
        show={tutorials}
        first={lesson.sections[0]?.id === id}
      />
      {assessments}
    </section>
  );
}
function Typing({
  data,
  lesson,
  section,
  show,
  first,
}: {
  data: Curriculum;
  lesson: string;
  section: string;
  show: boolean;
  first: boolean;
}) {
  const placement = data.placements.find((p) => p.lesson === lesson && p.section === section);
  const ids = [
    ...new Set([...(first ? data.basics.map((b) => b.id) : []), ...(placement?.entries || [])]),
  ];
  const entries = ids
    .map((id) => [...data.basics, ...data.syntax].find((e) => e.id === id))
    .filter((x) => !!x);
  return entries.length ? (
    <details className="typing" open={show}>
      <summary>Typing this math</summary>
      {entries.map((entry) => (
        <article key={entry.id}>
          <strong>{entry.title || (entry.command && '\\' + entry.command)}</strong>
          <Rich text={entry.text || entry.explanation} />
          <pre>{entry.source || entry.example}</pre>
          <Rich text={entry.source || (entry.example ? '$' + entry.example + '$' : '')} />
          <Copy text={entry.source || entry.example || ''} />
        </article>
      ))}
      <Sources catalog={data.sources} targets={ids.map((id) => `syntax:${id}`)} />
    </details>
  ) : null;
}

// Add a React component here to make it available in lessons. No parser change.
export const lessonComponents: MDXComponents = {
  Exercise,
  QuickCheck,
  Figure,
  LessonIntro,
  LessonSection,
  a: LessonLink,
};
