import { apiRequest, connected } from './sync';
import { get, put } from './storage';
import type { RecordData } from './types';
import type {
  ReviewCatalog,
  ReviewCatalogPreview,
  ReviewSession,
  ReviewSessionRequest,
  ReviewSummary,
} from './reviewTypes';

// Authoring inspection is read-only and does not create or cache learner records.
export async function loadReviewCatalog(): Promise<ReviewCatalog> {
  return (await apiRequest('/review/catalog')).json();
}

export async function previewReviewTemplate(
  id: string,
  seed: string,
): Promise<ReviewCatalogPreview> {
  return (
    await apiRequest(
      '/review/catalog/' + encodeURIComponent(id) + '/preview?seed=' + encodeURIComponent(seed),
    )
  ).json();
}

// Cached server responses are presentation/offline work, never a local scheduler.
async function cache(key: string, payload: Record<string, unknown>) {
  await put('records', key, {
    key,
    revision: 0,
    id: key,
    payload,
    device: 'local-cache',
    updated: Date.now(),
    versions: [],
    conflicts: [],
  } satisfies RecordData);
}

export async function cachedReviewSummary() {
  const saved = await get<RecordData>('records', 'review-cache/summary');
  if (!saved) return undefined;
  return {
    summary: saved.payload.summary as ReviewSummary,
    cached: true,
    fetchedAt: saved.payload.fetchedAt as number,
  };
}

export async function loadReviewSummary(budgetMinutes?: number) {
  const key = 'review-cache/summary';
  try {
    const query = budgetMinutes === undefined ? '' : '?budgetMinutes=' + budgetMinutes;
    const summary = (await (await apiRequest('/review' + query)).json()) as ReviewSummary;
    const fetchedAt = Date.now();
    await cache(key, { summary, fetchedAt });
    return { summary, cached: false, fetchedAt };
  } catch (error) {
    const saved = await cachedReviewSummary();
    if (!connected() || !saved) throw error;
    return saved;
  }
}

export async function startReviewSession(request: ReviewSessionRequest): Promise<ReviewSession> {
  const session = (await (
    await apiRequest('/review/sessions', 'POST', request)
  ).json()) as ReviewSession;
  // Persist the issued instances immediately, before the next background sync:
  // an export made right after planning must still restore queued offline work.
  await cache('review-session/' + session.id, { ...session });
  for (const instance of session.instances)
    await cache('review-instance/' + instance.id, { ...instance });
  await retainReviewSession(session);
  return session;
}

export async function retainReviewSession(
  session: ReviewSession | null,
  view: { paused?: boolean; index?: number } = {},
): Promise<void> {
  // Keeping this pointer in records makes an unfinished offline session part of
  // the existing browser export, without exporting credentials or all settings.
  await cache('review-cache/active', { session, ...view });
}

export async function cachedReviewSession(): Promise<ReviewSession | undefined> {
  return (await cachedReviewSessionState())?.session;
}

export async function cachedReviewSessionState() {
  const saved = await get<RecordData>('records', 'review-cache/active');
  const session = saved?.payload.session as ReviewSession | null | undefined;
  if (!session) return undefined;
  const index = Number(saved?.payload.index);
  return {
    session,
    paused: saved?.payload.paused === true,
    index: Number.isInteger(index) && index >= 0 && index <= session.instances.length ? index : 0,
  };
}
