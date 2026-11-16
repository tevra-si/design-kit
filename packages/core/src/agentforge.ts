import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { isMissing, safePath, withLock, writeAtomic, writeJSON } from '../../filesystem/src/index.js';
import { kitRoot } from '../../filesystem/src/resources.js';
import { loadRegistry } from '../../registry/src/index.js';
import { skillReferences } from './install.js';
import { discoverSkills } from './skills.js';

// Limits and field names mirror AgentForge's project skill manifest (.agentforge/skills.json, schemaVersion 1).
const manifestPath = '.agentforge/skills.json';
const prefix = 'tevra-';
const maxSkills = 32; const maxInstructionBytes = 32 * 1024; const maxDescription = 240;
const providers = ['claude_code', 'codex', 'opencode', 'kiro', 'anthropic', 'deepseek', 'openai', 'openai_compatible', 'ollama'];

interface ForgeSkill { id: string; name: string; version: string; description: string; providers: string[]; permission: 'read_only' | 'workspace_write' }
interface ForgeManifest { schemaVersion: 1; skills: ForgeSkill[] }

function shorten(description: string): string {
  const characters = Array.from(description);
  if (characters.length <= maxDescription) return description;
  const head = characters.slice(0, maxDescription).join('');
  const sentenceEnd = head.lastIndexOf('. ');
  return sentenceEnd > 0 ? head.slice(0, sentenceEnd + 1) : `${characters.slice(0, maxDescription - 1).join('')}…`;
}
async function readManifest(root: string): Promise<ForgeManifest> {
  let text: string;
  try { text = await readFile(await safePath(root, manifestPath), 'utf8'); } catch (error) { if (isMissing(error)) return { schemaVersion: 1, skills: [] }; throw error; }
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error(`Unsupported AgentForge skill manifest: ${manifestPath}`); }
  if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 1 || !('skills' in value) || !Array.isArray(value.skills) || !value.skills.every((skill): skill is ForgeSkill => Boolean(skill) && typeof skill === 'object' && 'id' in skill && typeof skill.id === 'string')) throw new Error(`Unsupported AgentForge skill manifest: ${manifestPath}`);
  return { schemaVersion: 1, skills: value.skills };
}

// AgentForge injects one Markdown file per skill into the prompt, so each skill is flattened with its references.
// Passing `replaced` opts into overwriting edited tevra-* files and receives their paths; without it an edited file stops the export.
export async function exportAgentForgeSkills(root: string, dryRun = false, replaced?: string[]): Promise<string[]> {
  const source = resolve(kitRoot(), 'skills');
  const skills = await discoverSkills(source); const registry = await loadRegistry();
  const references = skillReferences(skills.map(skill => skill.name));
  const manifest = await readManifest(root);
  const writes: { name: string; content: string }[] = [];
  for (const skill of skills) {
    const entry = registry.skills.find(candidate => candidate.name === skill.name);
    if (!entry) throw new Error(`Skill is missing from the registry: ${skill.name}`);
    let content = (await readFile(skill.path, 'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '').trim();
    const title = /^#\s+(.+)$/mu.exec(content)?.[1]?.trim() ?? skill.name;
    let files: string[] = [];
    try { files = (await readdir(resolve(source, skill.name, 'references'))).filter(file => file.endsWith('.md')).sort(); } catch (error) { if (!isMissing(error)) throw error; }
    for (const file of files) content += `\n\n## Reference: ${basename(file, '.md')}\n\n${(await readFile(resolve(source, skill.name, 'references', file), 'utf8')).trim()}`;
    content = `${content.replace(/\]\(references\/([^)#]+)\.md(?:#[^)]*)?\)/gu, '](#reference-$1)').replace(references, `${prefix}$1`)}\n`;
    if (Buffer.byteLength(content) > maxInstructionBytes) throw new Error(`Skill exceeds AgentForge's 32 KiB instruction limit: ${skill.name}`);
    const id = `${prefix}${skill.name}`;
    const name = `${id}.md`;
    let existing: string | null = null;
    try { existing = await readFile(await safePath(root, `.agentforge/skills/${name}`), 'utf8'); } catch (error) { if (!isMissing(error)) throw error; }
    if (existing !== null && existing !== content) {
      if (!replaced) throw new Error(`Installation conflict; preserve local file: .agentforge/skills/${name} (run with --replace to overwrite edited tevra-* skills)`);
      replaced.push(`.agentforge/skills/${name}`);
    }
    // Guidance only: read_only keeps the skill selectable on every node and grants nothing.
    const metadata: ForgeSkill = { id, name: `Tevra ${title}`.slice(0, 80), version: entry.version, description: shorten(entry.description), providers, permission: 'read_only' };
    manifest.skills = [...manifest.skills.filter(existing => existing.id !== id), metadata];
    writes.push({ name: `.agentforge/skills/${name}`, content });
  }
  if (manifest.skills.length > maxSkills) throw new Error(`AgentForge allows at most ${maxSkills} project skills; this project would have ${manifest.skills.length}`);
  if (!dryRun) await withLock(root, '.tevra/install.lock', async () => {
    for (const write of writes) await writeAtomic(root, write.name, write.content);
    await writeJSON(root, manifestPath, manifest);
  });
  return [...writes.map(write => write.name), manifestPath];
}
