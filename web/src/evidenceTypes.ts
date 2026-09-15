export type Link = { concept: string; role: 'primary' | 'supporting' };
export type SkillLink = { skill: string; role: 'primary' | 'supporting' };
export type Concept = { id: string; name: string; parent?: string; prerequisites?: string[] };
export type ExerciseEvidence = {
  concepts: Link[];
  skills: SkillLink[];
  representations: string[];
  attributes?: Record<string, string | number | boolean>;
};
export type EvidenceCatalog = {
  version: string;
  concepts: Concept[];
  skills: { id: string; name: string }[];
  representations: { id: string; name: string }[];
  exercises: Record<string, ExerciseEvidence>;
  teaching: { concept: string; lesson: string; section: string }[];
};
export type EvidenceSnapshot = ExerciseEvidence & {
  version: string;
  provenance: 'submission' | 'historical-backfill';
  conceptDefinitions: Concept[];
  skillDefinitions: { id: string; name: string }[];
  representationDefinitions: { id: string; name: string }[];
};
export type Assistance = {
  answerPreviouslyRevealed: boolean;
  priorIncorrectFeedbackSeen: boolean;
  copiedFromRetry: boolean;
};
export type Effort = {
  startedAt?: number;
  activeDurationMs?: number;
  unsure?: boolean;
  assistance?: Assistance;
};
export type Exposure = {
  concept: string;
  source: 'lesson' | 'exercise' | 'feedback';
  sourceId: string;
  at: number;
};
export type Diagnosis = {
  class:
    | 'conceptual'
    | 'procedural'
    | 'reasoning'
    | 'representation'
    | 'justification'
    | 'clerical'
    | 'prompt-compliance'
    | 'technical'
    | 'unknown';
  severity?: 'minor' | 'substantive';
  tags?: string[];
  concepts?: string[];
  skills?: string[];
};
export type GradeEvidence = {
  requirements?: { id: string; description: string; satisfied: boolean }[];
  diagnosis?: Diagnosis[];
  confidence?: 'high' | 'medium' | 'low';
  notGradedReason?:
    | 'unreadable'
    | 'missing-image'
    | 'ambiguous-problem'
    | 'insufficient-context'
    | 'grader-failure'
    | '';
};
export function snapshot(
  c: EvidenceCatalog,
  key: string,
  provenance: EvidenceSnapshot['provenance'] = 'submission',
): EvidenceSnapshot | undefined {
  const m = c.exercises[key];
  if (!m) return;
  return {
    ...m,
    version: c.version,
    provenance,
    conceptDefinitions: c.concepts.filter((x) => m.concepts.some((l) => l.concept === x.id)),
    skillDefinitions: c.skills.filter((x) => m.skills.some((l) => l.skill === x.id)),
    representationDefinitions: c.representations.filter((x) => m.representations.includes(x.id)),
  };
}
