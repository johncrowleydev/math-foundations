import type { EvidenceSnapshot } from './evidenceTypes';
import type { Question } from './types';

// Wire models only: activation, due state and planning belong to the Go server.
export type ReviewMode = 'regular' | 'quick';
export type ReviewKind = 'scheduled-review' | 'focused-practice';
export type ReviewContext = {
  instanceId: string;
  kind: ReviewKind;
  templateId: string;
  concept: string;
  skill: string;
  objective?: string;
  scheduledFor: number;
  presentedAt: number;
  previousReviewAt?: number;
  intervalDays: number;
  seed?: string;
  parameters?: Record<string, unknown>;
};
export type ReviewState = {
  id: string;
  concept: string;
  skill: string;
  objective?: string;
  dueAt: number;
  intervalDays: number;
  lastReviewedAt?: number;
  activatedAt: number;
  reason: string;
  evidenceLevel: string;
  quick: boolean;
};
export type ReviewSummary = {
  due: number;
  quick: number;
  deeper: number;
  targets: ReviewState[];
  concepts: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  lessons: { slug: string; title: string }[];
};
export type ReviewInstance = {
  id: string;
  exercise: string;
  lesson: string;
  question: Question;
  sourceTarget?: string;
  context: ReviewContext;
  analytics?: EvidenceSnapshot;
  contentVersion: string;
};
export type ReviewSessionRequest = {
  kind: ReviewKind;
  mode: ReviewMode;
  lesson?: string;
  concept?: string;
  skill?: string;
};
export type ReviewSession = {
  id: string;
  kind: ReviewKind;
  mode: ReviewMode;
  instances: ReviewInstance[];
};
