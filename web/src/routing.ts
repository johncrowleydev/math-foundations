import { exerciseKey, exerciseNamespace } from './exerciseIdentity';
import type { Lesson } from './types';

export type AppRoute = {
  slug: string;
  tab: 'read' | 'practice' | 'reference' | 'progress' | 'review' | 'review-library';
  exercise?: string;
  section?: string;
};

// Hash routes work with the offline app shell and local/static hosting alike.
export function readRoute(hash: string, lessons: Lesson[], savedLesson: string | null): AppRoute {
  let parts: string[];
  try {
    parts = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  } catch {
    parts = [];
  }
  const [page, slug, exercise] = parts;
  let lesson =
    lessons.find((l) => l.slug === slug) ||
    lessons.find((l) => l.slug === savedLesson) ||
    lessons[0];
  // A legacy URL names the original lesson, but a split may now own this ID.
  if (page === 'practice' && exercise && lesson.slug === slug) {
    const key = exerciseKey(lesson, exercise);
    lesson = lessons.find((l) => l.questions.some((q) => exerciseKey(l, q.id) === key)) || lesson;
  }
  const reading =
    page === 'learn' && exercise && lesson.slug === slug
      ? resolveReadingSection(lessons, slug, exercise)
      : undefined;
  if (reading) lesson = reading.lesson;
  const tab =
    page === 'reference' || page === 'progress' || page === 'review' || page === 'review-library'
      ? page
      : page === 'practice' && lesson.questions.length
        ? page
        : 'read';
  return {
    slug: lesson.slug,
    tab,
    ...(tab === 'read' && exercise && lesson.sections?.some((s) => s.id === exercise)
      ? { section: exercise }
      : {}),
    ...(tab === 'practice' && lesson.questions.some((q) => String(q.id) === exercise)
      ? { exercise }
      : {}),
  };
}

export function routeHash(route: AppRoute): string {
  return (
    '#/' +
    (route.tab === 'read' ? 'learn' : route.tab) +
    '/' +
    encodeURIComponent(route.slug) +
    (route.tab === 'practice' && route.exercise
      ? '/' + encodeURIComponent(route.exercise)
      : route.tab === 'read' && route.section
        ? '/' + encodeURIComponent(route.section)
        : '')
  );
}

// Retain old section IDs when moving teaching. Shared namespace metadata gives
// legacy bookmarks a destination without maintaining a separate migration table.
export function resolveReadingSection(lessons: Lesson[], slug: string, anchor: string) {
  const original = lessons.find((l) => l.slug === slug);
  if (!original) return undefined;
  const id = anchor.replace(/^section[:-]/, '');
  const match = (lesson: Lesson) => {
    const section = lesson.sections?.find((s) => s.id === id || s.title === anchor);
    return section ? { lesson, section } : undefined;
  };
  const direct = match(original);
  if (direct) return direct;
  const candidates = lessons
    .filter((l) => l.slug !== slug && exerciseNamespace(l) === exerciseNamespace(original))
    .flatMap((l) => {
      const target = match(l);
      return target ? [target] : [];
    });
  return candidates.length === 1 ? candidates[0] : undefined;
}
