import fs from 'node:fs';

// Capture metadata before a subject replaces its records in the shared aggregates.
export function createAuthoringJsonWriter() {
  const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
  // Regeneration must preserve the established catalog order, including families
  // added by later curriculum audits, and must not roll source-inspection dates back.
  const previousSources = read('content/sources.json');
  const previousOrder = new Map([
    ['content/review-templates.json', read('content/review-templates.json').map((v) => v.id)],
    [
      'content/deterministic-review-fixtures.json',
      read('content/deterministic-review-fixtures.json').map((v) => `${v.template}/${v.variant}`),
    ],
  ]);
  return (p, v) => {
    if (previousOrder.has(p)) {
      const order = new Map(previousOrder.get(p).map((id, i) => [id, i]));
      const key = (entry) => entry.id ?? `${entry.template}/${entry.variant}`;
      v.sort(
        (a, b) =>
          (order.get(key(a)) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(key(b)) ?? Number.MAX_SAFE_INTEGER),
      );
    }
    if (p === 'content/sources.json') {
      for (const field of ['citations', 'lessons', 'reviewTemplates']) {
        const keys = [
          ...new Set([...Object.keys(previousSources[field]), ...Object.keys(v[field])]),
        ];
        v[field] = Object.fromEntries(
          keys.filter((key) => key in v[field]).map((key) => [key, v[field][key]]),
        );
      }
      for (const [id, citation] of Object.entries(v.citations)) {
        const prior = previousSources.citations[id];
        if (!prior) continue;
        const { checked: priorDate, ...priorPassage } = prior;
        const { checked, ...passage } = citation;
        if (JSON.stringify(priorPassage) === JSON.stringify(passage) && priorDate > checked)
          citation.checked = priorDate;
      }
    }
    fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
  };
}
