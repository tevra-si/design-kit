import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContext } from '../../packages/design-context/src/index.js';
import { writeJSON, readJSON } from '../../packages/filesystem/src/index.js';
import { planWorkflow } from '../../packages/core/src/router.js';
import { runWorkflow } from '../../packages/workflow-engine/src/index.js';
import { loadRegistry } from '../../packages/registry/src/index.js';

test('runner executes evidence adapters, bounds retries and resumes a blocked instructional stage', async t => {
  const root = await mkdtemp(join(tmpdir(), 'tevra-run-')); t.after(() => rm(root, { recursive: true, force: true }));
  await writeJSON(root, '.tevra/design-context.json', createContext('test', 'owner'));
  const plan = planWorkflow('performance audit', { mode: 'quick', maxSteps: 1, maxMinutes: 5, maxRefinements: 0, contextRevision: 0 });
  await writeJSON(root, 'plan.json', plan);
  const blocked = await runWorkflow(root, 'plan.json', {}); assert.equal(blocked.status, 'blocked'); assert.equal(blocked.plan.steps[0]?.status, 'blocked');
  assert.equal(blocked.plan.steps[0]?.attempts, 0);
  assert.equal((await runWorkflow(root, 'plan.json', {})).status, 'blocked');
  assert.equal((await runWorkflow(root, 'plan.json', { 'performance-qa': async () => ({ status: 'passed', evidence: [], message: 'Recovered dependency' }) })).status, 'passed');
  const retryPlan = planWorkflow('performance audit', { mode: 'standard', maxSteps: 1, maxMinutes: 5, maxRefinements: 1, contextRevision: 0 });
  await writeJSON(root, 'plan.json', retryPlan);
  let calls = 0;
  const result = await runWorkflow(root, 'plan.json', { 'performance-qa': async () => ({ status: ++calls === 1 ? 'failed' : 'passed', evidence: [], message: 'Fixture adapter outcome' }) });
  assert.equal(calls, 2); assert.equal(result.status, 'passed');
  const evidence = result.plan.steps[0]?.evidence[0]; assert.ok(evidence); assert.ok(await readJSON(root, evidence));
});
test('runner blocks environment exceptions and refuses unapproved high-impact code', async t => {
  const root = await mkdtemp(join(tmpdir(), 'tevra-run-')); t.after(() => rm(root, { recursive: true, force: true }));
  await writeJSON(root, '.tevra/design-context.json', createContext('test', 'owner'));
  const plan = planWorkflow('performance audit', { mode: 'standard', maxSteps: 1, maxMinutes: 5, maxRefinements: 1, contextRevision: 0 });
  await writeJSON(root, 'plan.json', plan);
  const result = await runWorkflow(root, 'plan.json', { 'performance-qa': async () => { throw new Error('Browser unavailable'); } });
  assert.equal(result.status, 'blocked'); assert.equal(result.plan.steps[0]?.attempts, 0);
  await writeJSON(root, 'plan.json', { ...plan, approvalRequired: true });
  await assert.rejects(runWorkflow(root, 'plan.json', {}), /approval/u);
});
test('workflow routing resolves third-party capability ownership without engine edits', async () => {
  const registry = await loadRegistry(); const builtin = registry.skills.find(skill => skill.name === 'performance-qa'); assert.ok(builtin);
  registry.skills.push({ ...builtin, id: 'acme.performance', name: 'acme-performance', priority: 99 });
  const plan = planWorkflow('Lighthouse audit', { mode: 'standard', maxSteps: 1, maxMinutes: 5, maxRefinements: 0, contextRevision: 0 }, registry);
  assert.deepEqual(plan.steps.map(step => step.skill), ['acme-performance']);
});
