import { lstat, readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { isMissing, safePath, withLock, writeAtomic } from '../../filesystem/src/index.js';
import { kitRoot } from '../../filesystem/src/resources.js';
import { discoverSkills } from './skills.js';

export const agentDirectories = {
  codex: '.agents/skills', claude: '.claude/skills', cursor: '.cursor/skills', kiro: '.kiro/skills',
  gemini: '.gemini/skills', copilot: '.github/skills', opencode: '.opencode/skills', windsurf: '.windsurf/skills'
} as const;
export type Agent = keyof typeof agentDirectories;
export function isAgent(name: string): name is Agent { return Object.hasOwn(agentDirectories, name); }
async function filesBelow(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink in installation source: ${entry.name}`);
    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...await filesBelow(full)); else if (entry.isFile()) found.push(full);
  }
  return found;
}
// Names followed by a file extension are artifact file names, not skill references.
export function skillReferences(names: string[]): RegExp { return new RegExp(`(?<![a-z0-9-])(${names.join('|')})(?![a-z0-9-]|\\.[a-z])`, 'gu'); }
// A prefix lets Tevra skills sit beside project skills of the same name in agents that have no plugin namespace.
export async function installSkills(root: string, agents: Agent[], dryRun = false, prefix = ''): Promise<string[]> {
  if (prefix && !/^[a-z][a-z0-9]{0,19}-$/u.test(prefix)) throw new Error('Skill prefix must be lowercase letters or digits followed by a hyphen, such as "tevra-"');
  const source = resolve(kitRoot(), 'skills');
  const skills = await discoverSkills(source);
  if (skills.some(skill => `${prefix}${skill.name}`.length > 64)) throw new Error('Skill prefix makes a skill name longer than 64 characters');
  const references = skillReferences(skills.map(skill => skill.name));
  const writes: { name: string; bytes: Buffer }[] = [];
  for (const agent of new Set(agents)) {
    const base = agentDirectories[agent];
    if (!base) throw new Error(`Unsupported agent: ${agent}`);
    for (const skill of skills) {
      const directory = resolve(source, skill.name);
      for (const file of await filesBelow(directory)) {
        const name = `${base}/${prefix}${skill.name}/${relative(directory, file).split('\\').join('/')}`;
        const destination = await safePath(root, name);
        const original = await readFile(file);
        const bytes = prefix && file.endsWith('.md') ? Buffer.from(original.toString('utf8').replace(references, `${prefix}$1`)) : original;
        try {
          const existing = await lstat(destination);
          if (!existing.isFile() || !(await readFile(destination)).equals(bytes)) throw new Error(`Installation conflict; preserve local file: ${name}`);
        } catch (error) { if (!isMissing(error)) throw error; }
        writes.push({ name, bytes });
      }
    }
  }
  if (!dryRun) await withLock(root, '.tevra/install.lock', async () => {
    for (const write of writes) {
      const destination = await safePath(root, write.name);
      try { if (!(await readFile(destination)).equals(write.bytes)) throw new Error(`Installation conflict; preserve local file: ${write.name}`); }
      catch (error) { if (!isMissing(error)) throw error; }
    }
    for (const write of writes) await writeAtomic(root, write.name, write.bytes);
  });
  return writes.map(write => write.name);
}
