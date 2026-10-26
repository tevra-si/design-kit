import { randomUUID } from 'node:crypto';
import type { Plan } from '../../contracts/src/index.js';
import { transitionPlan } from '../../core/src/workflow.js';
import { validate } from '../../design-context/src/validation.js';
import { loadContext } from '../../design-context/src/index.js';
import { readJSON, redact, withLock, writeJSON } from '../../filesystem/src/index.js';

export interface StageResult { status: 'passed' | 'failed' | 'blocked' | 'skipped'; evidence: string[]; message: string }
export type StageAdapter = () => Promise<StageResult>;
export async function runWorkflow(root: string, path: string, adapters: Record<string, StageAdapter>): Promise<{ status: 'passed' | 'failed' | 'blocked'; plan: Plan }> {
  return withLock(root, '.tevra/runner.lock', async () => {
    let plan = validate<Plan>('plan.schema.json', await readJSON(root, path));
    const revision = (await loadContext(root)).revision;
    if (plan.contextRevision !== revision) throw new Error('Workflow context revision is stale');
    if (plan.approvalRequired && !plan.approvedBy) throw new Error('Human approval required before executing this high-impact workflow');
    if (plan.steps.length > plan.budget.maxSteps || new Set(plan.steps.map(step => step.skill)).size !== plan.steps.length) throw new Error('Invalid workflow step budget or duplicate skills');
    for (const [index, step] of plan.steps.entries()) for (const dependency of step.dependsOn) if (!plan.steps.slice(0, index).some(candidate => candidate.skill === dependency)) throw new Error(`Dependency must precede ${step.skill}: ${dependency}`);
    for (const step of [...plan.steps]) {
      if (step.status === 'passed' || step.status === 'skipped') continue;
      if (step.status === 'running') throw new Error(`Stage already running: ${step.skill}; inspect its previous attempt before recovery`);
      if (step.dependsOn.some(dependency => plan.steps.find(candidate => candidate.skill === dependency)?.status !== 'passed')) continue;
      while (step.attempts < plan.budget.maxRefinements + 1) {
        plan = await transitionPlan(root, path, step.skill, 'running', [], revision);
        const started = plan.steps.find(candidate => candidate.skill === step.skill);
        if (!started) throw new Error('Workflow stage disappeared');
        step.attempts = started.attempts;
        const artifact = `.tevra/workflow-runs/${randomUUID()}.json`;
        let result: StageResult;
        try {
          const adapter = adapters[step.skill];
          result = adapter ? await adapter() : { status: 'blocked', evidence: [], message: 'This skill requires the coding agent to execute its instructions and submit validation evidence; no supported automatic agent adapter is configured.' };
        } catch (error) {
          result = { status: 'blocked', evidence: [], message: redact(error instanceof Error ? error.message : String(error)) };
        }
        await writeJSON(root, artifact, { skill: step.skill, contextRevision: revision, ...result });
        plan = await transitionPlan(root, path, step.skill, result.status, [artifact, ...result.evidence], revision);
        if (result.status !== 'failed') break;
      }
    }
    return { status: plan.steps.some(step => step.status === 'failed') ? 'failed' : plan.steps.every(step => step.status === 'passed') ? 'passed' : 'blocked', plan };
  });
}
