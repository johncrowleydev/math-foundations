import { get } from './storage';
import { mutation } from './sync';
import type { RecordData } from './types';
type Seen = { answerPreviouslyRevealed: boolean; priorIncorrectFeedbackSeen: boolean };
export async function seenAssistance(key: string): Promise<Seen> {
  const r = await get<RecordData>('records', 'assistance/' + key);
  const values = r ? [r, ...r.versions] : [];
  return {
    answerPreviouslyRevealed: values.some((v) => v.payload.answerPreviouslyRevealed === true),
    priorIncorrectFeedbackSeen: values.some((v) => v.payload.priorIncorrectFeedbackSeen === true),
  };
}
export async function markAssistance(key: string, field: keyof Seen) {
  const seen = await seenAssistance(key);
  if (seen[field]) return;
  await mutation('assistance/' + key, { ...seen, [field]: true });
}
