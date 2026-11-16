import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { planWorkflow } from '../../packages/core/src/router.js';
import { readSpecKit } from '../../packages/core/src/spec-kit.js';

const spec = `# Feature Specification: Checkout

### User Story 1 - Pay for a cart (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a cart with items, **When** the user pays, **Then** an order is created
2. **Given** an expired card, **When** the user pays, **Then** an error explains how to recover

---

### User Story 2 - Review the order (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a paid order, **When** the user opens it, **Then** the items and total are listed
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases

1. Not an acceptance scenario
`;
async function project(t: TestContext, feature?: string): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-spec-kit-')); t.after(() => rm(root, { recursive: true, force: true }));
  if (feature !== undefined) { await mkdir(resolve(root, '.specify')); await writeFile(resolve(root, '.specify/feature.json'), feature); }
  return root;
}
test('projects without Spec Kit or without an active feature are left to the Tevra flow', async t => {
  assert.equal(await readSpecKit(await project(t)), null);
  const initialized = await project(t); await mkdir(resolve(initialized, '.specify'));
  assert.equal(await readSpecKit(initialized), null);
});
test('the active Spec Kit feature yields stable acceptance IDs without modifying the spec', async t => {
  const root = await project(t, JSON.stringify({ feature_directory: 'specs/001-checkout' }));
  await mkdir(resolve(root, 'specs/001-checkout'), { recursive: true }); await writeFile(resolve(root, 'specs/001-checkout/spec.md'), spec);
  assert.deepEqual(await readSpecKit(root), { feature: 'specs/001-checkout', hasSpec: true, hasPlan: false, acceptance: [
    'AC-101: Given a cart with items, When the user pays, Then an order is created',
    'AC-102: Given an expired card, When the user pays, Then an error explains how to recover',
    'AC-201: Given a paid order, When the user opens it, Then the items and total are listed'
  ] });
  assert.equal(await readFile(resolve(root, 'specs/001-checkout/spec.md'), 'utf8'), spec);
  const absolute = await project(t); await mkdir(resolve(absolute, '.specify')); await mkdir(resolve(absolute, 'specs/002-search'), { recursive: true });
  await writeFile(resolve(absolute, '.specify/feature.json'), JSON.stringify({ feature_directory: resolve(absolute, 'specs/002-search') }));
  assert.deepEqual(await readSpecKit(absolute), { feature: 'specs/002-search', hasSpec: false, hasPlan: false, acceptance: [] });
});
test('a malformed Spec Kit feature pointer is reported instead of ignored', async t => {
  await assert.rejects(readSpecKit(await project(t, '{not json')), /feature\.json/u);
  await assert.rejects(readSpecKit(await project(t, JSON.stringify({ feature_directory: 7 }))), /feature_directory/u);
  await assert.rejects(readSpecKit(await project(t, JSON.stringify({ feature_directory: '../outside' }))), /outside the project/u);
  await assert.rejects(readSpecKit(await project(t, JSON.stringify({ feature_directory: 'specs/missing' }))), /does not exist/u);
});
test('an existing spec replaces Tevra research in standard plans and is ignored in quick mode', () => {
  const options = { maxSteps: 9, maxMinutes: 60, maxRefinements: 2, contextRevision: 0 };
  const feature = { feature: 'specs/001-checkout', hasSpec: true, hasPlan: false };
  const plan = planWorkflow('Build a dashboard', { ...options, specKit: feature });
  assert.equal(plan.steps.some(step => step.skill === 'design-research'), false);
  assert.match(plan.routing?.excluded.find(entry => entry.skill === 'design-research')?.reason ?? '', /Spec Kit feature specs\/001-checkout/u);
  assert.ok(planWorkflow('Build a dashboard', { ...options, specKit: { ...feature, hasSpec: false } }).steps.some(step => step.skill === 'design-research'));
  assert.match(planWorkflow('Build a dashboard', { ...options, mode: 'quick', specKit: feature }).routing?.excluded.find(entry => entry.skill === 'design-research')?.reason ?? '', /Quick mode/u);
});
