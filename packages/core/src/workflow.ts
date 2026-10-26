import { stat } from 'node:fs/promises';
import type { Handoff, Plan, SkillName, Status } from '../../contracts/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { readJSON, safePath, withLock, writeJSON } from '../../filesystem/src/index.js';
import { loadContext } from '../../design-context/src/index.js';

export function assertHandoff(value: unknown, contextRevision: number, active: Handoff[]): Handoff {
  const handoff = validate<Handoff>('handoff.schema.json', value);
  const canonical = (file: string): string => {
    const normalized = file.replaceAll('\\', '/').replace(/\/$/u, '');
    if (!normalized || normalized.startsWith('/') || /^[a-z]:/iu.test(normalized) || normalized.split('/').some(segment => segment === '..' || segment === '.' || !segment)) throw new Error(`Unsafe handoff path: ${file}`);
    return normalized;
  };
  handoff.files = handoff.files.map(canonical); handoff.inputs = handoff.inputs.map(canonical); handoff.outputs = handoff.outputs.map(canonical); handoff.evidence = handoff.evidence.map(canonical);
  if (handoff.contextRevision !== contextRevision) throw new Error('Handoff context revision is stale');
  if (active.some(existing => existing.taskId === handoff.taskId && existing.owner !== handoff.owner)) throw new Error('Task ownership transfer requires explicit coordination');
  for (const existing of active.filter(task => ['pending', 'running', 'awaiting-approval', 'blocked'].includes(task.status) && task.taskId !== handoff.taskId)) {
    if (handoff.files.some(file => existing.files.map(canonical).some(other => file === other || file.startsWith(`${other}/`) || other.startsWith(`${file}/`)))) throw new Error(`Conflicting file ownership with ${existing.taskId}`);
  }
  if (handoff.status === 'passed' && !handoff.evidence.length) throw new Error('Passed handoff requires validation evidence');
  if (handoff.status === 'failed' && !handoff.error) throw new Error('Failed handoff requires error information');
  return handoff;
}
export async function transitionPlan(root: string, path: string, skill: SkillName, status: Status, evidence: string[], currentRevision: number): Promise<Plan> {
  return withLock(root, '.tevra/context.lock', () => withLock(root, '.tevra/workflow.lock', async () => {
    if ((await loadContext(root)).revision !== currentRevision) throw new Error('Workflow context revision is stale');
    const plan = validate<Plan>('plan.schema.json', await readJSON(root, path));
    if (plan.contextRevision !== currentRevision) throw new Error('Workflow context revision is stale');
    const step = plan.steps.find(value => value.skill === skill);
    if (!step) throw new Error(`Skill is outside this workflow: ${skill}`);
    if (Date.now() > Date.parse(plan.createdAt) + plan.budget.maxMinutes * 60000) throw new Error('Workflow time budget exhausted');
    if (status === 'running') {
      if (!['pending', 'failed', 'awaiting-approval', 'blocked'].includes(step.status)) throw new Error('Only pending or failed work can start');
      if (plan.approvalRequired && !plan.approvedBy) throw new Error('Human approval required before starting this high-impact workflow');
      if (step.dependsOn.some(dependency => plan.steps.find(candidate => candidate.skill === dependency)?.status !== 'passed')) throw new Error('Workflow dependency has not passed');
      if (step.attempts >= plan.budget.maxRefinements + 1) throw new Error('Maximum refinement count reached');
      step.attempts++;
    } else if (status === 'passed' || status === 'failed' || status === 'blocked' || status === 'skipped') {
      if (step.status !== 'running') throw new Error('Start the step before completing it');
      if (!evidence.length) throw new Error('Completion or failure requires evidence');
      for (const artifact of evidence) if (!(await stat(await safePath(root, artifact))).isFile()) throw new Error(`Evidence is not a file: ${artifact}`);
    } else throw new Error('Supported transitions: running, passed, failed, blocked, skipped');
    if (status === 'blocked') step.attempts = Math.max(0, step.attempts - 1);
    step.status = status; step.evidence = evidence;
    await writeJSON(root, path, plan); return plan;
  }));
}
