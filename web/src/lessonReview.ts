import { exerciseKey } from './exerciseIdentity';
import type { Curriculum, Lesson, Question } from './types';

// Prefer an explicit exercise/teaching placement; practice-only exercises use
// authored primary-concept teaching links rather than wording heuristics.
export function lessonReview(data: Curriculum, lesson: Lesson, question: Question) {
  const section =
    lesson.sections.find((s) => s.questionIds.includes(question.id)) ||
    lesson.sections.find((s) => s.title === question.section);
  if (section) return { slug: lesson.slug, section: section.id, title: section.title };
  const primary =
    data.evidence.exercises[exerciseKey(lesson, question.id)]?.concepts
      .filter((c) => c.role === 'primary')
      .map((c) => c.concept) || [];
  const anchors = data.evidence.teaching.filter((t) => primary.includes(t.concept));
  anchors.sort((a, b) => Number(b.lesson === lesson.slug) - Number(a.lesson === lesson.slug));
  for (const anchor of anchors) {
    const target = data.lessons.find((l) => l.slug === anchor.lesson);
    const section = target?.sections.find(
      (s) => s.title === anchor.section || s.id === anchor.section,
    );
    if (target && section) return { slug: target.slug, section: section.id, title: section.title };
  }
  throw new Error('Missing exercise teaching link: ' + exerciseKey(lesson, question.id));
}
