import type { EvidenceCatalog, EvidenceSnapshot, Effort, GradeEvidence } from './evidenceTypes';
export type Block = { id: string; kind: string; markdown?: string; figure?: string };
export type Question = {
  id: number;
  displayNumber?: number;
  instructions: string;
  prompt?: string;
  math?: string;
  answer?: string;
  section: string;
  table?: { columns: string[]; rows: number };
  choice?: ChoiceAssessment;
  quickSource?: string;
};
export type ChoiceAssessment = {
  options: { id: string; text: string; feedback: string }[];
  correctOption: string;
};
export const questionLabel = (q: Question) => 'Exercise ' + (q.displayNumber ?? q.id);
export type Quick = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  correctIndex?: number;
  explanation: string;
  exerciseId?: number;
};
export type Section = {
  id: string;
  title: string;
  blocks: Block[];
  questionIds: number[];
  quickChecks: Quick[];
};
export type Lesson = {
  subject?: string;
  number?: number;
  slug: string;
  title: string;
  eyebrow: string;
  introBlocks: Block[];
  sections: Section[];
  questions: Question[];
  practiceIds: number[];
};
export type Reference = {
  id: string;
  kind: string;
  name: string;
  aliases: string[];
  quick: string;
  definition: string;
  example: string;
  confusion: string;
  lesson: string;
  section: string;
  related: string[];
};
export type Formula = {
  id: string;
  lesson: string;
  source: string;
  latex: string;
  ordinal: number;
  reading: string;
  bindings: { symbol: string; meaning: string; reference: string }[];
};
export type Syntax = {
  id: string;
  command?: string;
  group?: string;
  example?: string;
  source?: string;
  explanation?: string;
  text?: string;
  title?: string;
  requires?: string[];
};
export type Figure = {
  extent?: number;
  arrows?: {
    label: string;
    from: [number, number];
    to: [number, number];
    dashed: boolean;
    labelOffset?: [number, number];
  }[];
  ellipses?: [number, number][];
  id: string;
  kind: string;
  title: string;
  lesson: string;
  section: string;
  creation: string;
  limitations: string;
  mathLabels: Record<string, string>;
  frames: {
    text: string;
    highlight: string[];
    route: string[];
    regions?: number[][];
    n?: number;
    active?: number;
    operation?: string;
  }[];
  nodes?: { id: string; x: number; y: number }[];
  edges?: string[][];
  directed?: boolean;
  presentation?: string;
  domain?: string[];
  codomain?: string[];
  pairs?: string[][];
  universe?: string[];
  a?: string[];
  b?: string[];
  collections?: { label: string; elements: (string | string[])[] }[];
  values?: number[] | boolean[][];
  rows?: number | string[];
  columns?: number | string[];
  rowLabel?: string;
  columnLabel?: string;
  counts?: number[];
  firstIndex?: number;
  rule?: string;
  xMax?: number;
  yMax?: number;
  threshold?: number;
  series?: { label: string; model: string; coefficients?: number[]; base?: number }[];
};
export type Curriculum = {
  evidence: EvidenceCatalog;
  lessons: Lesson[];
  references: Reference[];
  figures: Figure[];
  formulas: Formula[];
  syntax: Syntax[];
  basics: Syntax[];
  placements: { id: string; lesson: string; section: string; entries: string[] }[];
  requirements: { lesson: string; exercise: number; requires: string[] }[];
  referenceSyntax: { reference: string; examples: string[]; requires: string[] }[];
  version: string;
};
export type Grade = GradeEvidence & {
  promptVersion?: string;
  model?: string;
  verdict: string;
  feedback: string;
  issue?: string;
  improvement?: string;
  transcription?: string;
  reason?: string;
  at: number;
};
export type Attempt = Effort & {
  analytics?: EvidenceSnapshot;
  recheckReason?: string;
  transcription?: string;
  id: string;
  exercise: string;
  submitted: number;
  contentVersion: string;
  mode: string;
  choiceId?: string;
  text: string;
  images: string[];
  photos?: { hash: string; rotation: number }[];
  ink?: unknown;
  revealed: boolean;
  status: string;
  verdict?: string;
  error?: string;
  grades: Grade[];
};
export type Stroke = {
  points: { x: number; y: number; p: number }[];
  color: string;
  width: number;
};
export type Photo = { hash: string; rotation: number };
export type Draft = Effort & {
  choiceId?: string;
  text: string;
  mode: 'type' | 'pen' | 'photo';
  strokes: Stroke[];
  photos: Photo[];
  revealed: boolean;
  editing?: boolean;
  recovery?: boolean;
  updated: number;
};
export type RecordData = {
  key: string;
  revision: number;
  id: string;
  payload: Record<string, unknown>;
  device: string;
  updated: number;
  versions: { id: string; payload: Record<string, unknown>; updated: number; device: string }[];
  conflicts: string[];
};
export async function loadCurriculum(): Promise<Curriculum> {
  const [n, t, s, x, v, evidence] = await Promise.all(
    [
      'notebook',
      'teaching',
      'tex-syntax',
      'tex-teaching',
      'grading-version',
      'learning-evidence',
    ].map(async (f) => {
      const r = await fetch(`/${f}.json`);
      if (!r.ok) throw Error('Could not load bundled lessons');
      return r.json();
    }),
  );
  return {
    evidence,
    lessons: n.lessons.map((lesson: Lesson) => ({
      ...lesson,
      questions: lesson.questions.map((q, index) => ({ ...q, displayNumber: index + 1 })),
    })),
    ...t,
    syntax: s.entries,
    basics: x.basics,
    placements: x.placements,
    requirements: x.exercises,
    referenceSyntax: x.references,
    version: v.version,
  };
}
