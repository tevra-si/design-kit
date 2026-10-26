import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { agentDirectories, installSkills, isAgent } from '../../packages/core/src/install.js';
import { discoverSkills } from '../../packages/core/src/skills.js';
import { inspectMemory, resetMemory, updateMemory } from '../../packages/design-memory/src/index.js';
import { createContext, contextPath } from '../../packages/design-context/src/index.js';
import { safePath, withLock, writeJSON } from '../../packages/filesystem/src/index.js';
import { planWorkflow } from '../../packages/core/src/router.js';
import { transitionPlan } from '../../packages/core/src/workflow.js';

async function project(t: TestContext): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-project-')); t.after(() => rm(root, { recursive: true, force: true })); return root;
}
test('every agent adapter installs twelve self-contained skills and preserves unrelated changes', async t => {
  const root = await project(t); const agents = Object.keys(agentDirectories).filter(isAgent); const written = await installSkills(root, agents); assert.ok(written.length >= 54);
  for (const directory of Object.values(agentDirectories)) assert.equal((await discoverSkills(resolve(root, directory))).length, 12);
  const local = resolve(root, '.agents/skills/design-research/SKILL.md'); await writeFile(local, 'local user edit');
  await assert.rejects(installSkills(root, ['codex']), /conflict/u); assert.equal(await readFile(local, 'utf8'), 'local user edit');
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
