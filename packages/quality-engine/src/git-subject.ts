import { readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

export interface ReportSubject { commit: string; branch?: string }

const maxSmallFile = 4096; const maxPackedRefs = 1024 * 1024;
const objectId = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;

async function readText(path: string, limit: number): Promise<string | null> {
  try { const info = await stat(path); if (!info.isFile() || info.size > limit) return null; return (await readFile(path, 'utf8')).trim(); } catch { return null; }
}
async function findGitDirectory(start: string): Promise<string | null> {
  for (let directory = resolve(start); ; directory = dirname(directory)) {
    const candidate = join(directory, '.git');
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) return candidate;
      const pointer = /^gitdir: (.+)$/mu.exec(await readText(candidate, maxSmallFile) ?? '')?.[1];
      if (pointer) return isAbsolute(pointer) ? pointer : resolve(directory, pointer);
    } catch { /* keep walking up */ }
    if (dirname(directory) === directory) return null;
  }
}

// Reads HEAD straight from .git so a report can name its commit without spawning git. Anything unexpected yields no subject.
export async function gitSubject(root: string): Promise<ReportSubject | null> {
  const gitDirectory = await findGitDirectory(root);
  if (!gitDirectory) return null;
  const head = await readText(join(gitDirectory, 'HEAD'), maxSmallFile);
  if (!head) return null;
  if (objectId.test(head)) return { commit: head };
  const reference = /^ref: (refs\/[A-Za-z0-9._/-]+)$/u.exec(head)?.[1];
  if (!reference || reference.split('/').includes('..')) return null;
  const common = await readText(join(gitDirectory, 'commondir'), maxSmallFile);
  const commonDirectory = common ? resolve(gitDirectory, common) : gitDirectory;
  let commit = await readText(join(gitDirectory, reference), maxSmallFile) ?? await readText(join(commonDirectory, reference), maxSmallFile);
  if (!commit) {
    const packed = await readText(join(commonDirectory, 'packed-refs'), maxPackedRefs) ?? '';
    commit = packed.split('\n').map(line => line.split(' ')).find(([, name]) => name === reference)?.[0] ?? null;
  }
  if (!commit || !objectId.test(commit)) return null;
  return { commit, ...(reference.startsWith('refs/heads/') ? { branch: reference.slice('refs/heads/'.length) } : {}) };
}
