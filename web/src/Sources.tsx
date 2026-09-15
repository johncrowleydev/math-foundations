export type SourceCatalog = {
  bibliography: Record<string, { title: string; author: string; edition: string; url: string }>;
  citations: Record<string, { source: string; locator: string; url: string; supports: string }>;
  targets: Record<string, string[]>;
};

/** Bibliographic support, not an attribution of the app's original wording or exercises. */
export function Sources({
  catalog,
  target,
  targets,
  exercise = false,
}: {
  catalog?: SourceCatalog;
  target?: string;
  targets?: string[];
  exercise?: boolean;
}) {
  const ids = [
    ...new Set((targets || (target ? [target] : [])).flatMap((key) => catalog?.targets[key] || [])),
  ];
  if (!catalog || !ids.length) return null;
  return (
    <details className="content-sources">
      <summary>Sources</summary>
      <p className="sources-note">
        {exercise
          ? 'Background for this original exercise and its explanation.'
          : 'References supporting the mathematics; explanations and examples are authored for Foundations.'}{' '}
        External links open in a new tab.
      </p>
      <ul>
        {ids.map((id) => {
          const citation = catalog.citations[id];
          const source = catalog.bibliography[citation.source];
          return (
            <li key={id}>
              <a href={citation.url} target="_blank" rel="noopener noreferrer">
                {source.title} — {citation.locator}
              </a>
              <span className="source-credit">
                {source.author}. {source.edition}.
              </span>
              <span className="source-scope">{citation.supports}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
