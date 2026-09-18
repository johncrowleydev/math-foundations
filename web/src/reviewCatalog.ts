import type { ReviewCatalogItem } from './reviewTypes';

export type CatalogFilters = {
  search: string;
  lesson: string;
  concept: string;
  skill: string;
  objective: string;
  family: string;
  evidenceLevel: string;
  quick: string;
  provenance: string;
};
export const emptyCatalogFilters: CatalogFilters = {
  search: '',
  lesson: '',
  concept: '',
  skill: '',
  objective: '',
  family: '',
  evidenceLevel: '',
  quick: '',
  provenance: '',
};

const searchable = (value: string) => value.toLowerCase().replaceAll('-', ' ');

export function filterReviewCatalog(
  items: ReviewCatalogItem[],
  filters: CatalogFilters,
): ReviewCatalogItem[] {
  const query = searchable(filters.search.trim());
  return items.filter((item) => {
    for (const key of [
      'lesson',
      'concept',
      'skill',
      'family',
      'evidenceLevel',
      'provenance',
    ] as const)
      if (filters[key] && filters[key] !== item[key]) return false;
    if (filters.quick && item.quick !== (filters.quick === 'yes')) return false;
    if (filters.objective === ':present' && !item.objective) return false;
    if (filters.objective === ':none' && item.objective) return false;
    if (
      filters.objective &&
      !filters.objective.startsWith(':') &&
      item.objective !== filters.objective
    )
      return false;
    if (!query) return true;
    return searchable(
      [
        item.id,
        item.concept,
        item.skill,
        item.objective,
        item.lesson,
        ...[item.question, ...(item.variants || [])].flatMap((q) => [
          q.instructions,
          q.prompt,
          q.math,
        ]),
      ].join(' '),
    ).includes(query);
  });
}

export type ReviewCoverage = {
  key: string;
  concept: string;
  skill: string;
  objective?: string;
  total: number;
  quick: number;
  recognition: number;
  production: number;
  reasoning: number;
  fixed: number;
  authored: number;
  generated: number;
};

// Count server-supplied templates, without inferring eligibility or required evidence depth.
export function reviewCoverage(items: ReviewCatalogItem[]): ReviewCoverage[] {
  const groups = new Map<string, ReviewCoverage>();
  for (const item of items) {
    const key = JSON.stringify([item.concept, item.skill, item.objective || '']);
    const group = groups.get(key) || {
      key,
      concept: item.concept,
      skill: item.skill,
      objective: item.objective,
      total: 0,
      quick: 0,
      recognition: 0,
      production: 0,
      reasoning: 0,
      fixed: 0,
      authored: 0,
      generated: 0,
    };
    group.total++;
    group.quick += Number(item.quick);
    group[item.evidenceLevel]++;
    group[item.family]++;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function coverageObservations(group: ReviewCoverage): string[] {
  const observations: string[] = [];
  if (!group.quick) observations.push('No Quick-compatible template');
  if (group.recognition === group.total) observations.push('Recognition only');
  if (!group.production) observations.push('No production-level template');
  if (!group.reasoning) observations.push('No reasoning/proof template');
  if (group.total === 1 && group.fixed === 1) observations.push('Only one fixed template');
  if (!group.authored && !group.generated) observations.push('No variant/generator coverage');
  return observations;
}
