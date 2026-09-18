const object = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown) => typeof value === 'string' && value.length > 0;
const time = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;

// Old lesson attempts have no review context; absence remains unknown/lesson,
// rather than inventing a historical presentation or retention interval.
export function validReviewContext(value: unknown): boolean {
  if (value === undefined) return true;
  if (!object(value)) return false;
  return (
    ['scheduled-review', 'focused-practice'].includes(value.kind) &&
    ['instanceId', 'templateId', 'concept', 'skill'].every((key) => text(value[key])) &&
    (value.objective === undefined || text(value.objective)) &&
    time(value.scheduledFor) &&
    time(value.presentedAt) &&
    (value.previousReviewAt === undefined || time(value.previousReviewAt)) &&
    (value.previousEvidenceAt === undefined || time(value.previousEvidenceAt)) &&
    typeof value.intervalDays === 'number' &&
    Number.isFinite(value.intervalDays) &&
    value.intervalDays >= 0 &&
    (value.seed === undefined || text(value.seed)) &&
    (value.parameters === undefined || object(value.parameters))
  );
}

export function validReviewSession(value: unknown): boolean {
  if (!object(value)) return false;
  return (
    text(value.id) &&
    ['scheduled-review', 'focused-practice'].includes(value.kind) &&
    ['regular', 'quick'].includes(value.mode) &&
    Array.isArray(value.instances) &&
    value.instances.every(
      (instance: unknown) =>
        object(instance) &&
        ['id', 'exercise', 'lesson', 'contentVersion'].every((key) => text(instance[key])) &&
        instance.context !== undefined &&
        validReviewContext(instance.context) &&
        instance.context.instanceId === instance.id &&
        instance.context.kind === value.kind &&
        object(instance.question) &&
        Number.isSafeInteger(instance.question.id) &&
        typeof instance.question.instructions === 'string',
    )
  );
}
