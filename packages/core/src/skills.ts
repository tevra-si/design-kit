import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseDocument } from 'yaml';
import type { SkillName } from '../../contracts/src/index.js';
import { safePath } from '../../filesystem/src/index.js';

export interface Skill { name: SkillName; description: string; path: string }
export async function discoverSkills(directory: string): Promise<Skill[]> {
  const discovered: Skill[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = await safePath(directory, `${entry.name}/SKILL.md`);
    const content = await readFile(path, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content);
    if (!match?.[1]) throw new Error(`Missing YAML frontmatter: ${path}`);
    const document = parseDocument(match[1], { uniqueKeys: true });
    if (document.errors.length) throw new Error(`Invalid YAML: ${path}`);
    const metadata: unknown = document.toJS({ maxAliasCount: 0 });
    if (!metadata || typeof metadata !== 'object' || !('name' in metadata) || !('description' in metadata)) throw new Error(`Missing skill metadata: ${path}`);
    const name = typeof metadata.name === 'string' && /^[a-z][a-z0-9-]{0,63}$/u.test(metadata.name) ? metadata.name : undefined;
    if (!name || name !== entry.name || typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024) throw new Error(`Invalid skill identity: ${entry.name}`);
    for (const link of content.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/gu)) {
      const target = link[1];
      if (!target || /^[a-z]+:/iu.test(target)) continue;
      await readFile(await safePath(resolve(directory, entry.name), target));
    }
    if (discovered.some(skill => skill.name === name)) throw new Error(`Duplicate skill: ${name}`);
    discovered.push({ name, description: metadata.description, path });
  }
  return discovered.sort((a, b) => a.name.localeCompare(b.name));
}
