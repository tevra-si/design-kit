import { lstat, mkdir, open, readFile, realpath, rename, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function projectRoot(path: string): Promise<string> { return realpath(resolve(path)); }

export async function safePath(root: string, name: string): Promise<string> {
  if (!name || isAbsolute(name) || name.split(/[\\/]/u).includes('..') || name.includes('\0')) throw new Error(`Unsafe project path: ${name}`);
  const destination = resolve(root, name);
  const local = relative(root, destination);
  if (!local || local.startsWith(`..${sep}`) || isAbsolute(local)) throw new Error(`Path escapes project: ${name}`);
  let current = root;
  for (const segment of local.split(sep)) {
    current = resolve(current, segment);
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink path refused: ${name}`); }
    catch (error) { if (!isMissing(error)) throw error; }
  }
  return destination;
}

export function isMissing(error: unknown): boolean { return error instanceof Error && 'code' in error && error.code === 'ENOENT'; }

export async function readJSON(root: string, name: string): Promise<unknown> {
  const path = await safePath(root, name);
  try { return JSON.parse(await readFile(path, 'utf8')) as unknown; }
  catch (error) { throw new Error(`Cannot read JSON ${name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); }
}

export async function writeAtomic(root: string, name: string, content: string | Uint8Array): Promise<void> {
  const destination = await safePath(root, name);
  await mkdir(dirname(destination), { recursive: true });
  await safePath(root, name);
  const tempName = `${name}.${randomUUID()}.tmp`;
  const temporary = await safePath(root, tempName);
  try {
    await open(temporary, 'wx', 0o600).then(async file => { try { await file.writeFile(content); await file.sync(); } finally { await file.close(); } });
    await rename(temporary, destination);
  } finally { try { await unlink(temporary); } catch (error) { if (!isMissing(error)) throw error; } }
}

export async function writeJSON(root: string, name: string, value: unknown): Promise<void> { await writeAtomic(root, name, `${JSON.stringify(value, null, 2)}\n`); }

export async function withLock<T>(root: string, name: string, action: () => Promise<T>): Promise<T> {
  const path = await safePath(root, name);
  await mkdir(dirname(path), { recursive: true });
  const lock = await open(path, 'wx', 0o600).catch(error => { throw new Error(`Write lock unavailable (${name}); check concurrent work or inspect a stale lock`, { cause: error }); });
  try { await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })); return await action(); }
  finally { await lock.close(); await unlink(path); }
}

export function redact(text: string): string {
  return text.replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gu, '$1[REDACTED]@')
    .replace(/([?&][^=\s]+)=([^&\s#]*)/gu, '$1=[REDACTED]')
    .replace(/\b(?:sk-[a-zA-Z0-9_-]{10,}|gh[pousr]_[a-zA-Z0-9_]{10,})\b/gu, '[REDACTED]')
    .replace(/\b(?:AKIA[0-9A-Z]{16}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/gu, '[REDACTED]')
    .replace(/((?:authorization|password|api[_-]?key|access[_-]?token|secret|cookie|session[_-]?id)\s*[=:]\s*)(?:Bearer\s+)?[^\s,;]+/giu, '$1[REDACTED]');
}
