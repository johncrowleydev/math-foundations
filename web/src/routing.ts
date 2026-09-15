import type { Lesson } from './types';

export type AppRoute = {
  slug: string;
  tab: 'read' | 'practice' | 'reference' | 'progress';
  exercise?: string;
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
  const lesson =
    lessons.find((l) => l.slug === slug) ||
    lessons.find((l) => l.slug === savedLesson) ||
    lessons[0];
  const tab =
    page === 'reference' || page === 'progress'
      ? page
      : page === 'practice' && lesson.questions.length
        ? page
        : 'read';
  return {
    slug: lesson.slug,
    tab,
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
    (route.tab === 'practice' && route.exercise ? '/' + encodeURIComponent(route.exercise) : '')
  );
}
