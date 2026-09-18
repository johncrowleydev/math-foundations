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

export async function loadReviewSummary() {
  const key = 'review-cache/summary';
  try {
    const summary = (await (await apiRequest('/review')).json()) as ReviewSummary;
    const fetchedAt = Date.now();
    await cache(key, { summary, fetchedAt });
    return { summary, cached: false, fetchedAt };
  } catch (error) {
    const saved = await get<RecordData>('records', key);
    if (!connected() || !saved) throw error;
    return {
      summary: saved.payload.summary as ReviewSummary,
      cached: true,
      fetchedAt: saved.payload.fetchedAt as number,
    };
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

export async function retainReviewSession(session: ReviewSession | null): Promise<void> {
  // Keeping this pointer in records makes an unfinished offline session part of
  // the existing browser export, without exporting credentials or all settings.
  await cache('review-cache/active', { session });
}

export async function cachedReviewSession(): Promise<ReviewSession | undefined> {
  const saved = await get<RecordData>('records', 'review-cache/active');
  return (saved?.payload.session as ReviewSession | null | undefined) || undefined;
}
