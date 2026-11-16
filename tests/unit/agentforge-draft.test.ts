import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentForgeDraft } from '../../packages/core/src/agentforge-draft.js';
import { planWorkflow } from '../../packages/core/src/router.js';
import { validate } from '../../packages/design-context/src/validation.js';
import { loadRegistry } from '../../packages/registry/src/index.js';

const options = { mode: 'standard', maxSteps: 12, maxMinutes: 60, maxRefinements: 1, contextRevision: 0 } as const;

test('a plan collapses into at most one step per role with the kit reasons and tevra skill ids', async () => {
  const registry = await loadRegistry();
  const plan = planWorkflow('Improve the pricing card', options, registry);
  const draft = await agentForgeDraft(plan, registry);
  assert.deepEqual(draft.steps.map(step => step.kind), draft.steps.map(step => step.id));
  assert.ok(draft.steps.some(step => step.kind === 'develop'));
  for (const [index, step] of draft.steps.entries()) {
    assert.deepEqual(step.dependsOn, index === 0 ? [] : [draft.steps[index - 1]?.kind]);
    assert.ok(step.suggestedSkillIds.length > 0 && step.suggestedSkillIds.every(id => id.startsWith('tevra-')));
    assert.ok(step.reason.length > 0 && step.reason.length <= 400);
  }
  assert.equal(draft.source.tool, 'tevra-design-kit'); assert.equal(draft.name, 'Improve the pricing card');
});

test('a plan without a developer skill is refused with the reason', async () => {
  const registry = await loadRegistry();
  const plan = planWorkflow('Improve the pricing card', options, registry);
  const reviewOnly = { ...plan, steps: plan.steps.filter(step => registry.skills.find(skill => skill.name === step.skill)?.agentRole === 'reviewer') };
  await assert.rejects(agentForgeDraft(reviewOnly, registry), /no developer skill/u);
});

test('the draft contract rejects extra fields, a fourth step and unprefixed skill ids', async () => {
  const registry = await loadRegistry();
  const draft = await agentForgeDraft(planWorkflow('Improve the pricing card', options, registry), registry);
  assert.throws(() => validate('agentforge-draft.schema.json', { ...draft, extra: true }));
  assert.throws(() => validate('agentforge-draft.schema.json', { ...draft, steps: [...draft.steps, ...draft.steps] }));
  assert.throws(() => validate('agentforge-draft.schema.json', { ...draft, steps: draft.steps.map(step => ({ ...step, suggestedSkillIds: ['ui-builder'] })) }));
});
