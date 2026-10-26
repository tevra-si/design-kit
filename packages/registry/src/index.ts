import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validate } from '../../design-context/src/validation.js';
import { kitRoot } from '../../filesystem/src/resources.js';

export interface RegistrySkill {
  id: string; name: string; description: string; version: string; capabilities: string[];
  activation: { intents: string[] }; inputs: string[]; outputs: string[];
  dependencies: string[]; conflicts: string[]; frameworks: string[]; platforms: string[]; agents: string[];
  source: { type: string; references: string[] }; license: string; priority: number;
  estimatedCost: { minutes: number; contextTokens: number }; requiredTools: string[];
  validation: string[]; entrypoint: string;
}
export interface Registry { version: 1; skills: RegistrySkill[] }
export interface Selection { skills: RegistrySkill[]; owners: Record<string, string>; duplicates: Record<string, string[]> }

export function validateRegistry(input: unknown): Registry {
  const registry = validate<Registry>('skill-registry.schema.json', input);
  const identities = new Map<string, RegistrySkill>();
  const names = new Set<string>();
  for (const skill of registry.skills) {
    if (identities.has(skill.id) || names.has(skill.name)) throw new Error(`Duplicate skill identity: ${skill.id}`);
    if (/^(?:[a-z]:|[\\/])/iu.test(skill.entrypoint) || skill.entrypoint.split(/[\\/]/u).some(part => part === '..' || part === '.') || skill.entrypoint.includes('\0')) throw new Error(`Unsafe entrypoint: ${skill.id}`);
    identities.set(skill.id, skill); names.add(skill.name);
  }
  for (const skill of registry.skills) {
    for (const id of [...skill.dependencies, ...skill.conflicts]) {
      if (!identities.has(id)) throw new Error(`Missing dependency or conflict ${id} for ${skill.id}`);
      if (id === skill.id) throw new Error(`Self dependency or conflict: ${id}`);
    }
  }
  const visited = new Set<string>(); const active = new Set<string>();
  function visit(skill: RegistrySkill): void {
    if (active.has(skill.id)) throw new Error(`Dependency cycle: ${skill.id}`);
    if (visited.has(skill.id)) return;
    active.add(skill.id);
    for (const id of skill.dependencies) {
      const dependency = identities.get(id);
      if (!dependency) throw new Error(`Missing dependency: ${id}`);
      visit(dependency);
    }
    active.delete(skill.id); visited.add(skill.id);
  }
  for (const skill of registry.skills) visit(skill);
  return registry;
}

export async function loadRegistry(extensionFiles: string[] = []): Promise<Registry> {
  const files = [resolve(kitRoot(), 'registry/skills.json'), ...extensionFiles];
  const skills: RegistrySkill[] = [];
  for (const path of files) {
    const extension = validate<Registry>('skill-registry.schema.json', JSON.parse(await readFile(path, 'utf8')));
    skills.push(...extension.skills);
  }
  return validateRegistry({ version: 1, skills });
}

export function selectCapabilities(registryInput: unknown, capabilities: string[], options: {
  framework?: string; platform?: string; agent?: string; overrides?: Record<string, string>;
} = {}): Selection {
  const registry = validateRegistry(registryInput);
  const owners: Record<string, string> = {}; const duplicates: Record<string, string[]> = {};
  const selected = new Map<string, RegistrySkill>();
  const compatible = (skill: RegistrySkill): boolean =>
    (!options.framework || skill.frameworks.includes(options.framework)) &&
    (!options.platform || skill.platforms.includes(options.platform)) &&
    (!options.agent || skill.agents.includes(options.agent));
  for (const capability of [...new Set(capabilities)].sort()) {
    const candidates = registry.skills.filter(skill => skill.capabilities.includes(capability) && compatible(skill))
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id, 'en'));
    const override = options.overrides?.[capability];
    const winner = override ? candidates.find(skill => skill.id === override) : candidates[0];
    if (!winner) throw new Error(`No compatible owner for ${capability}${override ? ` (override ${override})` : ''}`);
    owners[capability] = winner.id; selected.set(winner.id, winner);
    if (candidates.length > 1) duplicates[capability] = candidates.map(skill => skill.id);
  }
  const ordered: RegistrySkill[] = []; const added = new Set<string>();
  function add(skill: RegistrySkill): void {
    if (added.has(skill.id)) return;
    if (!compatible(skill)) throw new Error(`Incompatible dependency: ${skill.id}`);
    for (const id of skill.dependencies) {
      const dependency = registry.skills.find(candidate => candidate.id === id);
      if (!dependency) throw new Error(`Missing dependency: ${id}`);
      add(dependency);
    }
    added.add(skill.id); ordered.push(skill);
  }
  for (const skill of selected.values()) add(skill);
  for (const skill of ordered) {
    const conflict = skill.conflicts.find(id => added.has(id));
    if (conflict) throw new Error(`Capability conflict: ${skill.id} conflicts with ${conflict}`);
  }
  return { skills: ordered, owners, duplicates };
}

export function registryGraph(registry: Registry): string {
  validateRegistry(registry);
  const lines = ['graph TD'];
  const nodes = new Map(registry.skills.map((skill, index) => [skill.id, `s${index}`]));
  for (const skill of registry.skills) {
    lines.push(`  ${nodes.get(skill.id)}["${skill.id}"]`);
    for (const dependency of skill.dependencies) lines.push(`  ${nodes.get(dependency)} --> ${nodes.get(skill.id)}`);
    for (const conflict of skill.conflicts) lines.push(`  ${nodes.get(skill.id)} -. conflict .-> ${nodes.get(conflict)}`);
  }
  return lines.join('\n');
}

export async function validateBundledProvenance(registry: Registry): Promise<void> {
  const sources = validate<{ version: 1; sources: { id: string }[] }>('sources.schema.json', JSON.parse(await readFile(resolve(kitRoot(), 'registry/sources.json'), 'utf8')));
  if (new Set(sources.sources.map(source => source.id)).size !== sources.sources.length) throw new Error('Duplicate source IDs');
  for (const skill of registry.skills.filter(skill => skill.id.startsWith('tevra.'))) for (const id of skill.source.references) if (!sources.sources.some(source => source.id === id)) throw new Error(`Missing source provenance: ${id}`);
  const ownership = validate<{ version: 1; capabilities: { id: string; primary: string | null; supporting: string[] }[] }>('capability-ownership.schema.json', JSON.parse(await readFile(resolve(kitRoot(), 'registry/capability-ownership.json'), 'utf8')));
  if (new Set(ownership.capabilities.map(capability => capability.id)).size !== ownership.capabilities.length) throw new Error('Duplicate capability ownership');
  for (const capability of ownership.capabilities) {
    if (capability.primary && !registry.skills.some(skill => skill.id === capability.primary && skill.capabilities.includes(capability.id))) throw new Error(`Invalid capability owner: ${capability.id}`);
    for (const supporting of capability.supporting) if (!registry.skills.some(skill => skill.id === supporting)) throw new Error(`Unknown supporting skill: ${supporting}`);
  }
}
