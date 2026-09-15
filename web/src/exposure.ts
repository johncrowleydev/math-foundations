import { all, get, put, deviceId } from './storage';
import { mutation } from './sync';
import type { Exposure } from './evidenceTypes';
import type { RecordData } from './types';
const pending = new Set<string>();
// One record per concept/source/device: bounded by curriculum, not by visits.
export async function expose(concept: string, source: Exposure['source'], sourceId: string) {
  const device = await deviceId();
  const key = 'exposure/' + device + ':' + concept + ':' + source;
  if (pending.has(key)) return;
  pending.add(key);
  try {
    if ((await get('records', key)) || (await get('settings', key))) return;
    const e: Exposure = { concept, source, sourceId, at: Date.now() };
    await mutation(key, e);
    await put('settings', key, e);
  } finally {
    pending.delete(key);
  }
}
export async function exposures(): Promise<Exposure[]> {
  const rs = await all<RecordData>('records');
  const earliest = new Map<string, Exposure>();
  for (const r of rs.filter((r) => r.key.startsWith('exposure/')))
    for (const v of [r, ...r.versions]) {
      const e = v.payload as unknown as Exposure;
      if (!e?.concept || !e.at) continue;
      const key = e.concept + ':' + e.source;
      if (!earliest.has(key) || e.at < earliest.get(key)!.at) earliest.set(key, e);
    }
  return [...earliest.values()];
}
