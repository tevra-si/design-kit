import { access, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Config, Handoff, Plan, SkillName } from '../../contracts/src/index.js';
import { resolveLighthouseCli } from '../../performance-qa/src/index.js';
import { browserExecutable } from './project-commands.js';
import { loadRegistry } from '../../registry/src/index.js';
import { planWorkflow } from '../../core/src/router.js';
import { readSpecKit } from '../../core/src/spec-kit.js';
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
async function availableTools(config: Config): Promise<string[]> {
  const tools: string[] = [];
  const executable = browserExecutable(config);
  try { if (executable) await access(executable); tools.push('browser'); } catch (error) { if (!isMissing(error)) throw error; }
  try { resolveLighthouseCli(); tools.push('lighthouse'); } catch (error) { if (!(error instanceof Error) || !error.message.startsWith('Lighthouse is not installed')) throw error; }
  return tools;
}
export async function workflowCommand(args: Arguments, root: string): Promise<unknown> {
  const context = await loadContext(root);
  if (args.command === 'plan' || args.command === 'workflow plan') {
    const configuration = await loadConfig(root);
    const mode = args.flags.mode === undefined ? undefined : flag(args, 'mode');
    if (mode !== undefined && mode !== 'quick' && mode !== 'standard' && mode !== 'full') throw new Error('Mode must be quick, standard or full');
    const risk = flag(args, 'risk', 'medium');
    if (risk !== 'low' && risk !== 'medium' && risk !== 'high') throw new Error('Risk must be low, medium or high');
    const projectMode = args.flags['project-mode'];
    if (projectMode !== undefined && projectMode !== 'greenfield' && projectMode !== 'existing') throw new Error('Project mode must be greenfield or existing');
    const changedFiles = flag(args, 'changed-files', '').split(',').filter(Boolean);
    const explicitRisk = typeof args.flags.risk === 'string';
    const acceptance = typeof args.flags.acceptance === 'string' ? await readJSON(root, args.flags.acceptance) : undefined;
    if (acceptance !== undefined && (!Array.isArray(acceptance) || !acceptance.every((criterion): criterion is string => typeof criterion === 'string'))) throw new Error('--acceptance must be a JSON array of criteria such as "AC-001: text"');
    // Quick work never depends on Spec Kit, so a broken feature pointer cannot block a trivial change.
    const specKit = mode === 'quick' || (!mode && risk === 'low') ? null : await readSpecKit(root);
    const criteria = acceptance ?? (specKit?.acceptance.length ? specKit.acceptance : undefined);
    const plan = planWorkflow(args.positional.join(' '), { ...(mode ? { mode } : {}), ...(criteria ? { acceptance: criteria } : {}), ...(specKit ? { specKit } : {}), ...(projectMode ? { projectMode } : {}), ...(changedFiles.length ? { changedFiles } : {}), ...(explicitRisk ? { risk } : {}), availableTools: await availableTools(configuration), maxSteps: numeric(args, 'max-steps', 12), maxMinutes: numeric(args, 'max-minutes', 60), maxRefinements: numeric(args, 'max-refinements', configuration.maxRefinements), contextRevision: context.revision, platform: ['react-native', 'expo'].includes(context.project.framework) ? 'native' : 'web', ...(context.project.framework === 'unknown' ? {} : { framework: context.project.framework }) }, await loadRegistry(typeof args.flags.registry === 'string' ? [await safePath(root, args.flags.registry)] : []));
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
