import { isMissing, readJSON, redact, safePath, withLock, writeJSON } from '../../filesystem/src/index.js';
import { stat } from 'node:fs/promises';
import { validate } from '../../design-context/src/validation.js';
import { isDeepStrictEqual } from 'node:util';

export interface MemoryEntry {
  id: string; kind: 'direction' | 'tokens' | 'convention' | 'rejected' | 'redesign' | 'constraint' | 'regression';
  text: string; approved: boolean; owner: string; updatedAt: string;
}
export interface Memory { version: 1; revision: number; entries: MemoryEntry[] }
const path = '.tevra/memory.json';
export async function inspectMemory(root: string): Promise<Memory> {
  try { await stat(await safePath(root, path)); }
  catch (error) { if (isMissing(error)) return { version: 1, revision: 0, entries: [] }; throw error; }
  return validate('memory.schema.json', await readJSON(root, path));
}
export async function updateMemory(root: string, entry: unknown, expectedRevision: number): Promise<Memory> {
  const serialized = JSON.stringify(entry);
  if (typeof serialized !== 'string' || redact(serialized) !== serialized) throw new Error('Possible secret in memory; remove sensitive values before persistence');
  return withLock(root, '.tevra/memory.lock', async () => {
    const memory = await inspectMemory(root);
    if (expectedRevision !== memory.revision) throw new Error('Stale memory revision');
    const candidate = validate<Memory>('memory.schema.json', { ...memory, entries: [entry] }).entries[0];
    if (!candidate) throw new Error('Memory entry missing');
    const previous = memory.entries.find(value => value.id === candidate.id);
    if (previous?.approved && !isDeepStrictEqual(previous, candidate)) throw new Error('Approved memory is immutable; append a new decision');
    memory.entries = [...memory.entries.filter(value => value.id !== candidate.id), candidate]; memory.revision++;
    await writeJSON(root, path, memory); return memory;
  });
}
export async function resetMemory(root: string, confirmed: boolean): Promise<Memory> {
  if (!confirmed) throw new Error('Memory reset requires --yes');
  return withLock(root, '.tevra/memory.lock', async () => {
    const current = await inspectMemory(root);
    const reset: Memory = { version: 1, revision: current.revision + 1, entries: [] };
    await writeJSON(root, path, reset); return reset;
  });
}
