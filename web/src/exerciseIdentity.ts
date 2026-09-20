// A lesson's location can change while its exercise history keeps the original keys.
export type ExerciseIdentity = { slug: string; exerciseNamespace?: string };
export const exerciseNamespace = (lesson: ExerciseIdentity) =>
  lesson.exerciseNamespace ?? lesson.slug;
export const exerciseKey = (lesson: ExerciseIdentity, id: number | string) =>
  exerciseNamespace(lesson) + '-' + id;

export function validateExerciseKeys(
  lessons: (ExerciseIdentity & { questions: { id: number; quickSource?: string }[] })[],
) {
  const owners = new Map<string, string>();
  const quickOwners = new Map<string, string>();
  for (const lesson of lessons)
    for (const question of lesson.questions) {
      const key = exerciseKey(lesson, question.id);
      if (owners.has(key))
        throw Error(`Duplicate exercise key ${key}: ${owners.get(key)} and ${lesson.slug}`);
      owners.set(key, lesson.slug);
      // Legacy choice restoration uses this key independently of the numeric ID.
      if (question.quickSource !== undefined) {
        const quickKey = 'quick/' + exerciseNamespace(lesson) + ':' + question.quickSource;
        if (quickOwners.has(quickKey))
          throw Error(
            `Duplicate legacy quick key ${quickKey}: ${quickOwners.get(quickKey)} and ${key}`,
          );
        quickOwners.set(quickKey, key);
      }
    }
  return new Set(owners.keys());
}
