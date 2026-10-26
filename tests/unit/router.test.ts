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
test('handoff paths reject traversal, canonicalize Windows claims and prevent task-owner takeover', () => {
  assert.throws(() => assertHandoff({ ...handoff('a'), files: ['../secret'] }, 0, []), /Unsafe/u);
  assert.throws(() => assertHandoff({ ...handoff('b'), files: ['src\\card.tsx'] }, 0, [handoff('a')]), /Conflicting/u);
  assert.throws(() => assertHandoff({ ...handoff('a'), owner: 'other-agent' }, 0, [handoff('a')]), /ownership/u);
});
