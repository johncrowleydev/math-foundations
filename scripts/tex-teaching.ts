import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export type TexEntry = {
  id: string;
  command: string;
  group: string;
  example: string;
  explanation: string;
};
export type TexPlacement = {
  id: string;
  lesson: string;
  section: string;
  entries: string[];
  status: string;
  hash?: string;
};
export const fingerprint = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function texRequirements(text: string, entries: TexEntry[]): string[] {
  const commands = new Map(entries.map((e) => [e.command, e.id]));
  const required = new Set<string>();
  for (const match of text.matchAll(/\\([A-Za-z]+|[^A-Za-z])/g)) {
    const id = commands.get(match[1]);
    if (id) required.add(id);
  }
  if (text.includes('\\exists!')) required.add('tex-unique-existence');
  const structural = text.replace(/\\(?:[A-Za-z]+|[^A-Za-z])/g, '');
  if (structural.includes('^')) required.add('tex-superscripts');
  if (structural.includes('_')) required.add('tex-subscripts');
  if (structural.includes('{')) required.add('tex-groups');
  if (structural.includes('&') || text.includes('\\begin')) required.add('tex-multirow');
  return [...required].sort();
}
export function unsupportedTexCommands(text: string, entries: TexEntry[]): string[] {
  const supported = new Set(entries.map((e) => e.command));
  return [
    ...new Set(
      [...text.matchAll(/\\([A-Za-z]+|[^A-Za-z])/g)]
        .map((m) => m[1])
        .filter((command) => !supported.has(command)),
    ),
  ].sort();
}
export function inspectionFingerprint(record: any, context: unknown): string {
  const { status, hash, inspectedAt, ...authored } = record;
  return fingerprint({ authored, context });
}
export function textFields(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textFields).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(textFields).join(' ');
  return '';
}
export async function inspectTexTeaching(requireComplete = false) {
  const registry = JSON.parse(await readFile('content/tex-syntax.json', 'utf8'));
  const teaching = JSON.parse(await readFile('content/tex-teaching.json', 'utf8'));
  const notebook = JSON.parse(await readFile('output/content/notebook.json', 'utf8'));
  const refs = JSON.parse(await readFile('output/content/teaching.json', 'utf8'));
  const failures: string[] = [];
  const ids = new Set<string>([
    ...registry.entries.map((e: TexEntry) => e.id),
    ...teaching.basics.map((e: any) => e.id),
  ]);
  if (ids.size !== registry.entries.length + teaching.basics.length)
    failures.push('Duplicate syntax IDs');
  if (new Set(registry.entries.map((e: TexEntry) => e.command)).size !== registry.entries.length)
    failures.push('Duplicate TeX command');
  const entryById = new Map<string, any>(
    [...registry.entries, ...teaching.basics].map((entry: any) => [entry.id, entry]),
  );
  const contextFor = (entryIds: string[]) => entryIds.map((id) => entryById.get(id));
  function checkSource(source: string, key: string) {
    for (const command of unsupportedTexCommands(source, registry.entries))
      failures.push(`${key}: unsupported command \\${command}`);
  }
  for (const entry of [...registry.entries, ...teaching.basics])
    checkSource(entry.example ?? entry.source ?? '', entry.id);
  const known = new Set<string>(['tex-basics', 'tex-commands', 'tex-groups', 'tex-feedback']);
  const seenExercises = new Set<string>();
  const seenPlacements = new Set<string>();
  for (const lesson of notebook.lessons) {
    const before = new Map<string, Set<string>>();
    for (const section of lesson.sections) {
      const placements = teaching.placements.filter(
        (p: TexPlacement) => p.lesson === lesson.slug && p.section === section.id,
      );
      if (placements.length > 1)
        failures.push('Duplicate placement: ' + lesson.slug + '/' + section.id);
      for (const placement of placements) {
        seenPlacements.add(placement.id);
        for (const id of placement.entries) {
          if (!ids.has(id)) failures.push('Unknown syntax: ' + id);
          known.add(id);
        }
        if (
          requireComplete &&
          (placement.status !== 'verified' ||
            placement.hash !==
              inspectionFingerprint(placement, {
                markdown: section.markdown,
                entries: contextFor(placement.entries),
              }))
        )
          failures.push(placement.id + ': teaching audit missing or stale');
        // Examples may teach paired constructs together in one block, but may not
        // silently introduce commands only explained in a later block.
        for (const id of placement.entries) {
          const entry =
            registry.entries.find((e: TexEntry) => e.id === id) ??
            teaching.basics.find((e: any) => e.id === id);
          for (const dependency of new Set([
            ...(entry?.requires ?? []),
            ...texRequirements(entry?.example ?? entry?.source ?? '', registry.entries),
          ]))
            if (!known.has(dependency))
              failures.push(`${placement.id}: example needs earlier ${dependency}`);
        }
      }
      before.set(section.id, new Set(known));
      for (const check of section.quickChecks) verify(check, 'quick', known);
    }
    for (const q of lesson.questions) {
      if (q.quickSource) continue; // Same authored check verified above; no typed response required.
      const section = lesson.sections.find((s: any) => s.questionIds.includes(q.id));
      verify(q, section ? 'inline' : 'practice', section ? before.get(section.id)! : known);
    }
    function verify(q: any, kind: string, introduced: Set<string>) {
      const key = lesson.slug + '/' + q.id;
      const record = teaching.exercises.find(
        (e: any) => e.lesson === lesson.slug && e.exercise === q.id,
      );
      if (!record) {
        failures.push('Missing exercise: ' + key);
        return;
      }
      seenExercises.add(key);
      if (record.kind !== kind) failures.push('Wrong placement kind: ' + key);
      const text =
        kind === 'quick'
          ? textFields([q.prompt, q.options, q.explanation])
          : textFields([q.instructions, q.prompt, q.math, q.answer, q.table]);
      checkSource(text, key);
      if (q.table)
        for (const id of [
          'tex-multirow',
          'tex-command-begin',
          'tex-command-end',
          'tex-formatting-14',
          'tex-groups',
        ])
          if (!record.requires.includes(id)) failures.push(key + ': table response needs ' + id);
      for (const id of texRequirements(text, registry.entries))
        if (!record.requires.includes(id)) failures.push(key + ': inventory misses ' + id);
      for (const id of record.requires) {
        if (!ids.has(id)) failures.push(key + ': unknown ' + id);
        if (!introduced.has(id)) failures.push(key + ': exercise before syntax ' + id);
      }
      if (requireComplete && (record.status !== 'verified' || record.hash !== fingerprint(q)))
        failures.push(key + ': manual audit missing or stale');
    }
  }
  const expectedExercises = notebook.lessons.reduce(
    (n: number, l: any) =>
      n +
      l.questions.filter((q: any) => !q.quickSource).length +
      l.sections.reduce((s: number, section: any) => s + section.quickChecks.length, 0),
    0,
  );
  if (seenExercises.size !== expectedExercises || seenExercises.size !== teaching.exercises.length)
    failures.push('Exercise coverage must match every curriculum exercise and quick check');
  if (seenPlacements.size !== teaching.placements.length)
    failures.push('Invalid or duplicate teaching placement');
  const refIds = new Set(teaching.references.map((e: any) => e.reference));
  if (refIds.size !== refs.references.length || teaching.references.length !== refIds.size)
    failures.push('Reference coverage mismatch');
  for (const ref of refs.references) {
    const record = teaching.references.find((r: any) => r.reference === ref.id);
    if (!record) failures.push('Missing reference syntax: ' + ref.id);
    if (ref.kind === 'symbol' && !record?.examples.length)
      failures.push('Missing symbol syntax examples: ' + ref.id);
    if (record) {
      checkSource(record.examples.join(' '), 'reference/' + ref.id);
      for (const id of texRequirements(record.examples.join(' '), registry.entries))
        if (!record.requires.includes(id))
          failures.push(ref.id + ': reference inventory misses ' + id);
      for (const id of record.requires)
        if (!ids.has(id)) failures.push(ref.id + ': unknown reference syntax ' + id);
      if (
        requireComplete &&
        (record.status !== 'verified' ||
          record.hash !==
            inspectionFingerprint(record, { reference: ref, entries: contextFor(record.requires) }))
      )
        failures.push(ref.id + ': reference audit missing or stale');
    }
  }
  const taught = new Set([...known]);
  for (const entry of registry.entries)
    if (!taught.has(entry.id)) failures.push('Command has no teaching location: ' + entry.id);
  if (requireComplete) {
    if (
      teaching.primerHash !==
      fingerprint(
        teaching.basics.filter((e: any) =>
          ['tex-basics', 'tex-commands', 'tex-groups', 'tex-feedback'].includes(e.id),
        ),
      )
    )
      failures.push('Typing primer audit missing or stale');
    if (teaching.status !== 'complete') failures.push('TeX curriculum audit is still a draft');
    for (const p of teaching.placements)
      if (p.status !== 'verified') failures.push('Uninspected teaching block: ' + p.id);
  }
  return failures;
}
