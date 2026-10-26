#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, realpathSync } from 'node:fs';
import { auditPerformance } from '../../performance-qa/src/index.js';
import { loadConfig } from '../../core/src/config.js';
import { loadContext } from '../../design-context/src/index.js';
import { loadRegistry, registryGraph, validateBundledProvenance } from '../../registry/src/index.js';
import { safePath } from '../../filesystem/src/index.js';
import { discoverSkills } from '../../core/src/skills.js';
import { installSkills } from '../../core/src/install.js';
import { searchPatterns } from '../../core/src/search.js';
import { projectRoot, redact } from '../../filesystem/src/index.js';
import { kitRoot } from '../../filesystem/src/resources.js';
import { parseCLI, flag, numeric } from './arguments.js';
import { agents, projectCommand } from './project-commands.js';
import { runCommand } from './run-command.js';
import { workflowCommand } from './workflow-commands.js';
import { visualCommand } from './visual-commands.js';

const help = `Tevra Design Kit — local agent skills and evidence tools

tevra-design init [--yes --agents codex,claude,cursor,kiro,gemini,copilot,opencode,windsurf | --skip-skills]
tevra-design doctor [--launch]
tevra-design analyze
tevra-design skills list|check|validate|graph [--registry extension.json]
tevra-design skills inspect <name> [--registry extension.json]
tevra-design skills install --agents codex,claude,cursor,kiro,gemini,copilot,opencode,windsurf [--dry-run]
tevra-design validate [design-context.json]
tevra-design context show|validate
tevra-design context migrate <legacy.json> [--out .tevra/migrated-context.json --owner name]
tevra-design context update <candidate.json> --revision N [--approve-constraints]
tevra-design memory list|inspect|reset [--yes]
tevra-design memory update <entry.json> --revision N
tevra-design search "query" [--category ux --limit 5]
tevra-design plan "request" [--mode quick|standard|full --max-steps 12 --max-minutes 60 --max-refinements 2]
tevra-design workflow plan "request" [--mode quick|standard|full]
tevra-design workflow run <plan.json> [--allow-network]
tevra-design workflow status <plan.json>
tevra-design workflow start|complete|fail <plan.json> --skill name [--evidence file1,file2]
tevra-design workflow approve <plan.json> --by human-name --yes
tevra-design handoff validate|save <handoff.json>
tevra-design tokens generate --new-system [--brand '#175a44']
tevra-design tokens export
tevra-design capture [--kind current|baseline --approve-baseline]
tevra-design compare
tevra-design test browser|visual|accessibility [--allow-custom-browser]
tevra-design test performance --allow-network [--lcp-ms 2500 --cls 0.1 --tbt-ms 200]
tevra-design a11y
tevra-design report|review [--checks checks.json --out .tevra/reports/quality.md]

Every command accepts --root <project-directory>. Paths are project-relative.
Custom executable paths require --allow-custom-browser on doctor/capture/a11y/review.
Exit: 0 success, 1 quality/check failure, 2 input/environment error.
The CLI executes local QA adapters; your coding agent executes design/implementation instructions.
`;
export async function run(argv: string[]): Promise<number> {
  try {
    const args = parseCLI(argv);
    if (args.command === 'help') { process.stdout.write(help); return 0; }
    const root = await projectRoot(flag(args, 'root', process.cwd())); let result: unknown;
    if (['skills list', 'skills inspect', 'skills validate', 'skills graph'].includes(args.command)) {
      const extension = typeof args.flags.registry === 'string' ? [await safePath(root, args.flags.registry)] : [];
      const registry = await loadRegistry(extension);
      if (args.command === 'skills inspect') {
        const name = args.positional[0]; const entry = registry.skills.find(skill => skill.name === name || skill.id === name);
        if (!entry) throw new Error(`Unknown skill: ${name}`); result = entry;
      } else if (args.command === 'skills graph') result = { format: 'mermaid', graph: registryGraph(registry) };
      else if (args.command === 'skills validate') {
        await validateBundledProvenance(registry);
        const canonical = await discoverSkills(resolve(kitRoot(), 'skills'));
        for (const skill of canonical) if (!registry.skills.some(entry => entry.name === skill.name)) throw new Error(`Unregistered skill ${skill.name}`);
        result = { valid: true, count: registry.skills.length };
      } else result = registry.skills;
    } else if (args.command === 'skills check') result = await discoverSkills(resolve(kitRoot(), 'skills'));
    else if (args.command === 'skills install') result = await installSkills(root, agents(flag(args, 'agents', 'codex')), args.flags['dry-run'] === true);
    else if (args.command === 'search') result = await searchPatterns(args.positional.join(' '), typeof args.flags.category === 'string' ? args.flags.category : undefined, numeric(args, 'limit', 5));
    else if (args.command === 'test performance') {
      const outcome = await auditPerformance(root, await loadConfig(root), (await loadContext(root)).revision, {
        allowNetwork: args.flags['allow-network'] === true, allowCustomBrowser: args.flags['allow-custom-browser'] === true,
        budgets: { lcpMs: numeric(args, 'lcp-ms', 2500), cls: numeric(args, 'cls', 0.1), tbtMs: numeric(args, 'tbt-ms', 200) }
      });
      process.stdout.write(`${redact(JSON.stringify(outcome, null, 2))}\n`); return outcome.checks.some(check => check.status === 'failed') ? 1 : 0;
    } else if (['test browser', 'test visual', 'test accessibility'].includes(args.command)) {
      const command = args.command === 'test visual' ? 'review' : args.command === 'test browser' ? 'browser' : 'a11y';
      const outcome = await visualCommand({ ...args, command }, root); process.stdout.write(`${redact(JSON.stringify(outcome.result, null, 2))}\n`); return outcome.failed ? 1 : 0;
    } else if (['capture', 'compare', 'a11y', 'report', 'review'].includes(args.command)) {
      const outcome = await visualCommand(args, root); process.stdout.write(`${redact(JSON.stringify(outcome.result, null, 2))}\n`); return outcome.failed ? 1 : 0;
    } else if (args.command === 'workflow run') {
      const outcome = await runCommand(args, root); process.stdout.write(`${redact(JSON.stringify(outcome, null, 2))}\n`);
      return typeof outcome === 'object' && outcome !== null && 'status' in outcome && outcome.status === 'passed' ? 0 : 1;
    } else if (args.command === 'plan' || args.command.startsWith('workflow ') || args.command.startsWith('handoff ')) result = await workflowCommand(args, root);
    else result = await projectCommand(args, root);
    process.stdout.write(`${redact(JSON.stringify(result, null, 2))}\n`); return 0;
  } catch (error) { process.stderr.write(`${redact(error instanceof Error ? error.message : String(error))}\n`); return 2; }
}
if (process.argv[1] && existsSync(process.argv[1]) && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) process.exitCode = await run(process.argv.slice(2));
