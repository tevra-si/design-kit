import test from 'node:test';
import assert from 'node:assert/strict';
import type { Handoff } from '../../packages/contracts/src/index.js';
import { planWorkflow } from '../../packages/core/src/router.js';
import { assertHandoff } from '../../packages/core/src/workflow.js';
import { parseCLI } from '../../packages/cli/src/arguments.js';
import { searchPatterns } from '../../packages/core/src/search.js';

const options = { mode: 'standard', maxSteps: 9, maxMinutes: 60, maxRefinements: 2, contextRevision: 0 } as const;
test('new dashboard, focused redesign and screenshot flows choose different scoped skills', () => {
  assert.deepEqual(planWorkflow('Build a dashboard', options).steps.map(step => step.skill), ['design-research', 'design-direction', 'design-system', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa']);
  assert.deepEqual(planWorkflow('Improve this pricing card', options).steps.map(step => step.skill), ['ui-redesign', 'ui-builder', 'visual-review']);
  const screenshot = planWorkflow('Convert screenshot to React', options); assert.equal(screenshot.steps[0]?.skill, 'design-direction'); assert.ok(screenshot.steps.some(step => step.skill === 'responsive-design'));
});
test('quick mode and budgets constrain the work without silently dropping required steps', () => {
  const quick = planWorkflow('Improve pricing card', { ...options, mode: 'quick' }); assert.equal(quick.budget.maxRefinements, 0);
  assert.throws(() => planWorkflow('Build dashboard', { ...options, maxSteps: 2 }), /budget/u);
  assert.ok(planWorkflow('Transformative redesign', options).approvalRequired);
});
test('routing matches whole words and keeps the owning skill in quick mode', () => {
  const skills = (request: string, mode: 'quick' | 'standard' = 'standard'): string[] => planWorkflow(request, { ...options, mode }).steps.map(step => step.skill);
  assert.equal(skills('fix mobile overflow on dashboard', 'quick')[0], 'responsive-design');
  assert.deepEqual(skills('Build a dashboard', 'quick').includes('design-research'), false);
  assert.deepEqual(skills('make the button accessible'), ['accessibility-qa']);
  assert.deepEqual(skills('improve the information panel'), ['ui-redesign', 'design-direction', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa']);
  assert.deepEqual(skills('restyle the pricing cards'), ['ui-redesign', 'ui-builder', 'visual-review']);
});
test('routing rules cover common frontend requests', () => {
  const skills = (request: string, extra: Partial<Parameters<typeof planWorkflow>[1]> = {}): string[] => planWorkflow(request, { ...options, ...extra }).steps.map(step => step.skill);
  assert.deepEqual(skills('Redesign the React dashboard', { framework: 'react' }), ['ui-redesign', 'design-direction', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa']);
  assert.ok(skills('Create a Svelte 5 card component', { framework: 'sveltekit' }).includes('ui-builder'));
  assert.deepEqual(skills('Adjust button spacing'), ['ui-redesign', 'ui-builder', 'visual-review']);
  assert.equal(skills('Convert this screenshot to code')[0], 'design-direction');
  assert.deepEqual(skills('Compare the old and new site after migration'), ['visual-review', 'accessibility-qa']);
  assert.deepEqual(skills('Fix accessibility issues on the checkout form'), ['ui-builder', 'visual-review', 'accessibility-qa']);
  assert.deepEqual(skills('Optimize performance of the landing page'), ['performance-qa']);
  assert.deepEqual(skills('Fix the Next.js runtime configuration bug', { framework: 'nextjs' }), ['frontend-debugging']);
  assert.deepEqual(skills('sửa lỗi nút thanh toán'), ['frontend-debugging']);
  assert.deepEqual(skills('Fix the mobile overflow bug')[0], 'responsive-design');
  assert.deepEqual(skills('cải thiện nút thanh toán'), ['ui-redesign', 'ui-builder', 'visual-review']);
});
test('risk selects the smallest safe mode and an explicit mode overrides it', () => {
  const { mode: _mode, ...withoutMode } = options;
  assert.equal(planWorkflow('Adjust button spacing', { ...withoutMode, risk: 'low' }).mode, 'quick');
  assert.equal(planWorkflow('Adjust button spacing', withoutMode).mode, 'standard');
  const form = planWorkflow('Implement an authentication form', { ...withoutMode, risk: 'high', maxSteps: 12 });
  assert.equal(form.mode, 'full'); assert.ok(form.steps.some(step => step.skill === 'browser-testing'));
  assert.equal(planWorkflow('Adjust button spacing', { ...options, risk: 'high' }).mode, 'standard');
  assert.throws(() => planWorkflow('Adjust button spacing', { ...withoutMode, risk: 'severe' as 'high' }), /Risk/u);
});
test('plans explain selected and excluded skills and report unavailable tools', () => {
  const plan = planWorkflow('Build a dashboard', { ...options, mode: 'quick', availableTools: [] });
  assert.equal(plan.routing?.rule, 'new-interface');
  assert.deepEqual(plan.routing?.selected.map(entry => entry.skill), plan.steps.map(step => step.skill));
  assert.match(plan.routing?.excluded.find(entry => entry.skill === 'design-research')?.reason ?? '', /quick mode/iu);
  assert.match(plan.routing?.excluded.find(entry => entry.skill === 'performance-qa')?.reason ?? '', /new-interface/u);
  assert.deepEqual(plan.routing?.missingTools, [{ skill: 'visual-review', tool: 'browser' }]);
  assert.deepEqual(planWorkflow('Optimize performance', { ...options, availableTools: ['browser'] }).routing?.missingTools, [{ skill: 'performance-qa', tool: 'lighthouse' }]);
  assert.deepEqual(planWorkflow('Build a dashboard', options).routing?.missingTools, []);
});
test('CLI rejects unknown commands, flags, boolean values and missing command groups', () => {
  assert.throws(() => parseCLI(['deploy'])); assert.throws(() => parseCLI(['capture', '--pretend-success'])); assert.throws(() => parseCLI(['init', '--yes=false']));
  assert.throws(() => parseCLI(['skills'])); assert.equal(parseCLI(['capture', '--root', '/tmp/project', '--kind', 'current']).flags.kind, 'current');
});
test('local research retrieves relevant sourced results and preserves no-match results', async () => {
  const matches = await searchPatterns('form error validation mobile', 'ux', 3); assert.equal(matches[0]?.id, 'form-recovery'); assert.ok(matches[0]?.source);
  assert.deepEqual(await searchPatterns('zzzzunmatchedconcept'), []);
  assert.ok((await searchPatterns('motion reduced')).some(match => match.id === 'upstream-reduced-motion'));
});
function handoff(taskId: string): Handoff { return { version: 1, taskId, objective: 'Improve pricing', skill: 'ui-builder', contextVersion: '2.0', contextRevision: 0, owner: 'builder', files: ['src/card.tsx'], inputs: [], outputs: ['src/card.tsx'], constraints: ['Preserve purchase action'], acceptance: ['Purchase action still works'], evidence: [], status: 'running', error: null }; }
test('handoffs reject stale context and overlapping active ownership including directory claims', () => {
  assert.throws(() => assertHandoff(handoff('a'), 1, []), /stale/u);
  assert.throws(() => assertHandoff(handoff('b'), 0, [handoff('a')]), /Conflicting/u);
  assert.throws(() => assertHandoff(handoff('b'), 0, [{ ...handoff('a'), files: ['src'] }]), /Conflicting/u);
  assert.equal(assertHandoff({ ...handoff('b'), files: ['src/header.tsx'] }, 0, [handoff('a')]).taskId, 'b');
});
test('failed and passed handoffs require error details or validation evidence', () => {
  assert.throws(() => assertHandoff({ ...handoff('a'), status: 'failed' }, 0, []), /error/u);
  assert.throws(() => assertHandoff({ ...handoff('a'), status: 'passed' }, 0, []), /evidence/u);
});
test('acceptance criteria keep stable unique IDs in plans and handoffs', () => {
  assert.deepEqual(planWorkflow('Adjust button spacing', { ...options, acceptance: ['AC-001: Spacing matches the token'] }).acceptance, ['AC-001: Spacing matches the token']);
  assert.equal(planWorkflow('Adjust button spacing', options).acceptance, undefined);
  assert.throws(() => planWorkflow('Adjust button spacing', { ...options, acceptance: ['Spacing matches'] }), /AC-/u);
  assert.throws(() => planWorkflow('Adjust button spacing', { ...options, acceptance: ['AC-001: One', 'AC-001: Two'] }), /Duplicate/u);
  assert.throws(() => assertHandoff({ ...handoff('a'), acceptance: ['AC-001: One', 'AC-001: Two'] }, 0, []), /Duplicate/u);
  assert.equal(assertHandoff({ ...handoff('a'), acceptance: ['AC-001: One', 'Legacy criterion without an ID'] }, 0, []).taskId, 'a');
});
test('handoff paths reject traversal, canonicalize Windows claims and prevent task-owner takeover', () => {
  assert.throws(() => assertHandoff({ ...handoff('a'), files: ['../secret'] }, 0, []), /Unsafe/u);
  assert.throws(() => assertHandoff({ ...handoff('b'), files: ['src\\card.tsx'] }, 0, [handoff('a')]), /Conflicting/u);
  assert.throws(() => assertHandoff({ ...handoff('a'), owner: 'other-agent' }, 0, [handoff('a')]), /ownership/u);
});
