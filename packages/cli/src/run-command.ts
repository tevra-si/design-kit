import { runWorkflow } from '../../workflow-engine/src/index.js';
import type { StageAdapter } from '../../workflow-engine/src/index.js';
import { loadConfig } from '../../core/src/config.js';
import { loadContext } from '../../design-context/src/index.js';
import { capture } from '../../visual-testing/src/capture.js';
import { captureChecks } from '../../visual-testing/src/checks.js';
import { compare } from '../../visual-testing/src/compare.js';
import { auditPerformance } from '../../performance-qa/src/index.js';
import type { Arguments } from './arguments.js';
import { inputPath } from './arguments.js';

export async function runCommand(args: Arguments, root: string): Promise<unknown> {
  const config = await loadConfig(root); const revision = (await loadContext(root)).revision;
  const captureStage: StageAdapter = async () => {
    const manifest = await capture(root, config, 'current', revision, false, args.flags['allow-custom-browser'] === true);
    const checks = captureChecks(manifest);
    return { status: checks.some(check => check.status === 'failed') ? 'failed' : checks.some(check => check.status === 'unverified') ? 'blocked' : 'passed', evidence: ['.tevra/artifacts/current/manifest.json'], message: 'Configured matrix capture, browser assertions, runtime, overflow and axe checks. Manual accessibility remains unverified.' };
  };
  const adapters: Record<string, StageAdapter> = {
    'browser-testing': captureStage,
    'responsive-design': captureStage,
    'accessibility-qa': captureStage,
    'visual-review': async () => {
      const captured = await captureStage();
      if (captured.status !== 'passed') return captured;
      const result = await compare(root, config);
      return { status: result.comparisons.every(comparison => comparison.passed) ? 'passed' : 'failed', evidence: ['.tevra/artifacts/current/manifest.json', '.tevra/artifacts/comparison.json'], message: 'Pixel differences are change signals; subjective visual approval remains separate.' };
    },
    'performance-qa': async () => {
      const result = await auditPerformance(root, config, revision, { allowNetwork: args.flags['allow-network'] === true, allowCustomBrowser: args.flags['allow-custom-browser'] === true });
      return { status: result.checks.every(check => check.status === 'passed') ? 'passed' : 'failed', evidence: [result.report, result.html], message: 'Lighthouse laboratory navigation audit; no real-user INP claim.' };
    }
  };
  return runWorkflow(root, inputPath(args), adapters);
}
