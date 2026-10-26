import { readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Handoff, Plan, SkillName } from '../../contracts/src/index.js';
import { loadRegistry } from '../../registry/src/index.js';
import { planWorkflow } from '../../core/src/router.js';
import { assertHandoff, transitionPlan } from '../../core/src/workflow.js';
import { loadContext } from '../../design-context/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { isMissing, readJSON, safePath, withLock, writeJSON } from '../../filesystem/src/index.js';
import { flag, inputPath, numeric } from './arguments.js';
import type { Arguments } from './arguments.js';
import { loadConfig } from '../../core/src/config.js';

function skill(args: Arguments): SkillName {
  const selected = flag(args, 'skill');
  if (!/^[a-z][a-z0-9-]{0,63}$/u.test(selected)) throw new Error(`Invalid skill: ${selected}`); return selected;
}
export async function workflowCommand(args: Arguments, root: string): Promise<unknown> {
  const context = await loadContext(root);
  if (args.command === 'plan' || args.command === 'workflow plan') {
    const configuration = await loadConfig(root);
    const mode = flag(args, 'mode', 'standard'); if (!['quick', 'standard', 'full'].includes(mode)) throw new Error('Mode must be quick, standard or full');
    const plan = planWorkflow(args.positional.join(' '), { mode: mode === 'quick' ? 'quick' : mode === 'full' ? 'full' : 'standard', maxSteps: numeric(args, 'max-steps', 12), maxMinutes: numeric(args, 'max-minutes', 60), maxRefinements: numeric(args, 'max-refinements', configuration.maxRefinements), contextRevision: context.revision, platform: ['react-native', 'expo'].includes(context.project.framework) ? 'native' : 'web', ...(context.project.framework === 'unknown' ? {} : { framework: context.project.framework }) }, await loadRegistry(typeof args.flags.registry === 'string' ? [await safePath(root, args.flags.registry)] : []));
    const output = flag(args, 'out', `.tevra/plans/${plan.id}.json`); await writeJSON(root, output, plan); return { path: output, plan };
  }
  if (args.command === 'workflow status') return validate<Plan>('plan.schema.json', await readJSON(root, inputPath(args)));
  if (args.command === 'workflow approve') {
    if (!args.flags.yes) throw new Error('Approval requires --yes and --by to record the authorized human decision');
    return withLock(root, '.tevra/workflow.lock', async () => {
      const path = inputPath(args); const plan = validate<Plan>('plan.schema.json', await readJSON(root, path));
      if (plan.contextRevision !== context.revision) throw new Error('Workflow context revision is stale');
      plan.approvedBy = flag(args, 'by'); await writeJSON(root, path, plan); return plan;
    });
  }
  if (args.command.startsWith('workflow ')) {
    const status = args.command === 'workflow start' ? 'running' : args.command === 'workflow complete' ? 'passed' : 'failed';
    return transitionPlan(root, inputPath(args), skill(args), status, flag(args, 'evidence', '').split(',').filter(Boolean), context.revision);
  }
  if (args.command.startsWith('handoff ')) {
    const value = await readJSON(root, inputPath(args));
    return withLock(root, '.tevra/context.lock', () => withLock(root, '.tevra/handoff.lock', async () => {
      const freshContext = await loadContext(root);
      const active: Handoff[] = [];
      try {
        const directory = await safePath(root, '.tevra/handoffs');
        for (const file of await readdir(directory)) if (file.endsWith('.json')) active.push(validate('handoff.schema.json', await readJSON(root, `.tevra/handoffs/${file}`)));
      } catch (error) { if (!isMissing(error)) throw error; }
      const handoff = assertHandoff(value, freshContext.revision, active);
      for (const file of [...handoff.files, ...handoff.inputs, ...handoff.outputs, ...handoff.evidence]) await safePath(root, file);
      if (args.command === 'handoff save') await writeJSON(root, `.tevra/handoffs/${handoff.taskId || randomUUID()}.json`, handoff);
      return handoff;
    }));
  }
  throw new Error(`Unsupported workflow command: ${args.command}`);
}
