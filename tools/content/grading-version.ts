import { readFileSync } from 'node:fs';

// Native MDX figure references changed serialization without changing grading.
// Keep this exact deployed version valid for saved offline submissions. Every
// other representation receives its own hash; this is not a general alias table.
const compatibility = JSON.parse(
  readFileSync(new URL('./compatibility/grading-version.json', import.meta.url), 'utf8'),
) as { representationHash: string; gradingVersion: string };

export function gradingVersionFor(representationHash: string): string {
  return representationHash === compatibility.representationHash
    ? compatibility.gradingVersion
    : representationHash;
}
