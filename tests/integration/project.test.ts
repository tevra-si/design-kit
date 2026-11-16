import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { agentDirectories, installSkills, isAgent } from '../../packages/core/src/install.js';
import { exportAgentForgeSkills } from '../../packages/core/src/agentforge.js';
import { discoverSkills } from '../../packages/core/src/skills.js';
import { inspectMemory, resetMemory, updateMemory } from '../../packages/design-memory/src/index.js';
import { createContext, contextPath } from '../../packages/design-context/src/index.js';
import { safePath, withLock, writeJSON } from '../../packages/filesystem/src/index.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';
import { planWorkflow } from '../../packages/core/src/router.js';
import { transitionPlan } from '../../packages/core/src/workflow.js';

async function project(t: TestContext): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-project-')); t.after(() => rm(root, { recursive: true, force: true })); return root;
}
test('every agent adapter installs thirteen self-contained skills and preserves unrelated changes', async t => {
  const root = await project(t); const agents = Object.keys(agentDirectories).filter(isAgent); const written = await installSkills(root, agents); assert.ok(written.length >= 54);
  for (const directory of Object.values(agentDirectories)) assert.equal((await discoverSkills(resolve(root, directory))).length, 13);
  const local = resolve(root, '.agents/skills/design-research/SKILL.md'); await writeFile(local, 'local user edit');
  await assert.rejects(installSkills(root, ['codex']), /conflict/u); assert.equal(await readFile(local, 'utf8'), 'local user edit');
});
test('a prefix installs skills beside existing ones of the same name and renames every reference', async t => {
  const root = await project(t); const foreign = resolve(root, '.agents/skills/design-system/SKILL.md');
  await mkdir(resolve(root, '.agents/skills/design-system'), { recursive: true }); await writeFile(foreign, '---\nname: design-system\ndescription: Another kit\n---\n');
  await assert.rejects(installSkills(root, ['codex']), /conflict/u);
  await installSkills(root, ['codex'], false, 'tevra-');
  assert.match(await readFile(foreign, 'utf8'), /Another kit/u);
  const installed = await discoverSkills(resolve(root, '.agents/skills'));
  assert.equal(installed.filter(skill => skill.name.startsWith('tevra-')).length, 13); assert.equal(installed.length, 14);
  const names = (await discoverSkills(resolve(kitRoot(), 'skills'))).map(skill => skill.name);
  const unprefixed = new RegExp(`(?<![a-z0-9-])(${names.join('|')})(?![a-z0-9-]|\\.[a-z])`, 'u');
  for (const skill of installed.filter(candidate => candidate.name.startsWith('tevra-'))) assert.doesNotMatch(await readFile(skill.path, 'utf8'), unprefixed, skill.name);
  assert.match(await readFile(resolve(root, '.agents/skills/tevra-frontend-review/references/guide.md'), 'utf8'), /tevra-ui-builder references/u);
  assert.match(await readFile(resolve(root, '.agents/skills/tevra-design-research/SKILL.md'), 'utf8'), /design-research\.md/u);
  await installSkills(root, ['codex'], false, 'tevra-');
  for (const prefix of ['Tevra-', 'tevra', '../x-', '-']) await assert.rejects(installSkills(root, ['codex'], true, prefix), /prefix/iu);
});
test('installer dry run makes no agent directory and validates destinations first', async t => {
  const root = await project(t); const files = await installSkills(root, ['codex'], true); assert.ok(files.length > 9);
  await assert.rejects(readFile(resolve(root, '.agents/skills/design-research/SKILL.md')));
});
test('memory persists with revision checks, protects approvals and resets only with confirmation', async t => {
  const root = await project(t); const entry = { id: 'brand', kind: 'constraint', text: 'Preserve brand', approved: true, owner: 'human', updatedAt: new Date().toISOString() };
  assert.equal((await inspectMemory(root)).revision, 0); assert.equal((await updateMemory(root, entry, 0)).revision, 1);
  await assert.rejects(updateMemory(root, entry, 0), /Stale/u); await assert.rejects(updateMemory(root, { ...entry, text: 'Replace brand' }, 1), /immutable/u);
  await assert.rejects(resetMemory(root, false), /requires/u); assert.equal((await resetMemory(root, true)).entries.length, 0);
  await assert.rejects(updateMemory(root, { ...entry, text: 'api_key=secret-value' }, 2), /secret/u);
});
test('traversal, absolute writes, symlink ancestors and concurrent locks fail explicitly', async t => {
  const root = await project(t); await assert.rejects(safePath(root, '../escape')); await assert.rejects(safePath(root, '/tmp/escape'));
  await symlink(tmpdir(), resolve(root, 'linked')); await assert.rejects(safePath(root, 'linked/escape'), /Symlink/u);
  await withLock(root, 'owner.lock', async () => { await assert.rejects(withLock(root, 'owner.lock', async () => undefined), /lock unavailable/u); });
});
test('workflow enforces dependencies, evidence, approval and bounded retries', async t => {
  const root = await project(t); await writeJSON(root, contextPath, createContext('Example', 'owner'));
  const plan = planWorkflow('Improve pricing card', { mode: 'standard', maxSteps: 9, maxMinutes: 60, maxRefinements: 0, contextRevision: 0 });
  const path = '.tevra/plan.json'; await writeJSON(root, path, plan);
  await assert.rejects(transitionPlan(root, path, 'ui-builder', 'running', [], 0), /dependency/u);
  await transitionPlan(root, path, 'ui-redesign', 'running', [], 0);
  await assert.rejects(transitionPlan(root, path, 'ui-redesign', 'passed', [], 0), /evidence/u);
  await writeJSON(root, 'evidence.json', { audit: 'recorded' }); await transitionPlan(root, path, 'ui-redesign', 'failed', ['evidence.json'], 0);
  await assert.rejects(transitionPlan(root, path, 'ui-redesign', 'running', [], 0), /refinement/u);
  const highImpact = planWorkflow('Transformative redesign', { mode: 'full', maxSteps: 9, maxMinutes: 60, maxRefinements: 2, contextRevision: 0 }); await writeJSON(root, path, highImpact);
  const first = highImpact.steps[0]; assert.ok(first); await assert.rejects(transitionPlan(root, path, first.skill, 'running', [], 0), /approval/u);
});
test('AgentForge export flattens each skill into one bounded instruction file and merges the project manifest', async t => {
  const root = await project(t); await mkdir(resolve(root, '.agentforge/skills'), { recursive: true });
  const foreign = { id: 'house-rules', name: 'House rules', version: '1.0.0', description: 'Project conventions', providers: ['claude_code'], permission: 'read_only' };
  await writeJSON(root, '.agentforge/skills.json', { schemaVersion: 1, skills: [foreign] });
  assert.equal((await exportAgentForgeSkills(root, true)).length, 14);
  await assert.rejects(readFile(resolve(root, '.agentforge/skills/tevra-ui-builder.md')));
  await exportAgentForgeSkills(root);
  const manifest = JSON.parse(await readFile(resolve(root, '.agentforge/skills.json'), 'utf8')) as { schemaVersion: number; skills: { id: string; name: string; version: string; description: string; providers: string[]; permission: string }[] };
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.skills.length, 14); assert.deepEqual(manifest.skills[0], foreign);
  const names = (await discoverSkills(resolve(kitRoot(), 'skills'))).map(skill => skill.name);
  const unprefixed = new RegExp(`(?<![a-z0-9-])(${names.join('|')})(?![a-z0-9-]|\\.[a-z])`, 'u');
  for (const skill of manifest.skills.slice(1)) {
    assert.match(skill.id, /^tevra-[a-z0-9-]{1,42}$/u); assert.ok(skill.name.length <= 80 && skill.name.startsWith('Tevra '));
    assert.match(skill.version, /^[A-Za-z0-9.+-]{1,40}$/u); assert.ok(Array.from(skill.description).length <= 240 && skill.description.length > 20, skill.id);
    assert.equal(skill.permission, 'read_only'); assert.equal(skill.providers.length, 9);
    const content = await readFile(resolve(root, `.agentforge/skills/${skill.id}.md`), 'utf8');
    assert.ok(Buffer.byteLength(content) <= 32 * 1024 && content.startsWith('# '), skill.id);
    assert.doesNotMatch(content, /\]\(references\//u); assert.doesNotMatch(content, unprefixed, skill.id);
  }
  assert.match(await readFile(resolve(root, '.agentforge/skills/tevra-frontend-debugging.md'), 'utf8'), /\[evidence guidance\]\(#reference-guide\)[\s\S]*## Reference: guide/u);
  await exportAgentForgeSkills(root);
  assert.equal((JSON.parse(await readFile(resolve(root, '.agentforge/skills.json'), 'utf8')) as { skills: unknown[] }).skills.length, 14);
  await writeFile(resolve(root, '.agentforge/skills/tevra-ui-builder.md'), 'edited in AgentForge');
  await assert.rejects(exportAgentForgeSkills(root), /conflict/u);
  const preview: string[] = []; await exportAgentForgeSkills(root, true, preview);
  assert.deepEqual(preview, ['.agentforge/skills/tevra-ui-builder.md']); assert.equal(await readFile(resolve(root, '.agentforge/skills/tevra-ui-builder.md'), 'utf8'), 'edited in AgentForge');
  await writeFile(resolve(root, '.agentforge/skills/house-rules.md'), 'mine');
  const replaced: string[] = []; await exportAgentForgeSkills(root, false, replaced);
  assert.deepEqual(replaced, ['.agentforge/skills/tevra-ui-builder.md']); assert.match(await readFile(resolve(root, '.agentforge/skills/tevra-ui-builder.md'), 'utf8'), /^# /u);
  assert.equal(await readFile(resolve(root, '.agentforge/skills/house-rules.md'), 'utf8'), 'mine');
  const full = await project(t); await writeJSON(full, '.agentforge/skills.json', { schemaVersion: 1, skills: Array.from({ length: 20 }, (_, index) => ({ ...foreign, id: `skill-${index}` })) });
  await assert.rejects(exportAgentForgeSkills(full), /at most 32/u);
  const fresh = await project(t); assert.equal((await exportAgentForgeSkills(fresh)).length, 14);
  assert.equal((JSON.parse(await readFile(resolve(fresh, '.agentforge/skills.json'), 'utf8')) as { skills: unknown[] }).skills.length, 13);
  const broken = await project(t); await writeJSON(broken, '.agentforge/skills.json', { schemaVersion: 2, skills: [] });
  await assert.rejects(exportAgentForgeSkills(broken), /Unsupported AgentForge skill manifest/u);
});
