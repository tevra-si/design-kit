import { stat } from 'node:fs/promises';
import type { Check } from '../../contracts/src/index.js';
import { loadConfig } from '../../core/src/config.js';
import { loadContext } from '../../design-context/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { isMissing, readJSON, redact, safePath, writeAtomic, writeJSON } from '../../filesystem/src/index.js';
import { htmlReport } from '../../quality-engine/src/html.js';
import { evaluateQuality, markdownReport } from '../../quality-engine/src/index.js';
import { capture, manifestHash, comparisonSettingsHash } from '../../visual-testing/src/capture.js';
import { compare, validateCaptureAttempt, assertCaptureMatchesConfig } from '../../visual-testing/src/compare.js';
import { captureChecks } from '../../visual-testing/src/checks.js';
import type { CaptureManifest, ComparisonResult } from '../../visual-testing/src/types.js';
import { flag } from './arguments.js';
import type { Arguments } from './arguments.js';

export async function visualCommand(args: Arguments, root: string): Promise<{ result: unknown; failed: boolean }> {
  const config = await loadConfig(root); const context = await loadContext(root);
  if (args.command === 'capture' || args.command === 'a11y' || args.command === 'browser') {
    const kind = flag(args, 'kind', 'current'); if (kind !== 'baseline' && kind !== 'current') throw new Error('Capture kind must be baseline or current');
    const manifest = await capture(root, config, kind, context.revision, args.flags['approve-baseline'] === true, args.flags['allow-custom-browser'] === true);
    const checks = captureChecks(manifest); await writeJSON(root, `.tevra/artifacts/${kind}/checks.json`, checks);
    return { result: { manifest: `.tevra/artifacts/${kind}/manifest.json`, captures: manifest.entries.length, checks }, failed: args.command === 'browser' ? checks.some(check => check.status !== 'passed') : checks.some(check => check.status === 'failed' && check.severity === 'critical') };
  }
  if (args.command === 'compare') { const result = await compare(root, config); return { result, failed: result.comparisons.some(comparison => !comparison.passed) }; }
  if (args.command === 'review') { await capture(root, config, 'current', context.revision, false, args.flags['allow-custom-browser'] === true); await compare(root, config); }
  const manifest = validate<CaptureManifest>('capture-manifest.schema.json', await readJSON(root, '.tevra/artifacts/current/manifest.json'));
  if (manifest.kind !== 'current') throw new Error('Expected current capture evidence');
  await validateCaptureAttempt(root, manifest);
  assertCaptureMatchesConfig(manifest, config);
  if (manifest.contextRevision !== context.revision) throw new Error('Capture evidence has a stale context revision');
  const checks = captureChecks(manifest);
  try {
    await stat(await safePath(root, '.tevra/artifacts/comparison.json'));
    const comparison = validate<ComparisonResult>('comparison.schema.json', await readJSON(root, '.tevra/artifacts/comparison.json'));
    if (comparison.currentManifestHash !== manifestHash(manifest)) throw new Error('Comparison is stale; compare the latest capture first');
    if (comparison.settingsHash !== comparisonSettingsHash(config)) throw new Error('Comparison thresholds changed; run compare again');
    checks.push(...comparison.checks);
  } catch (error) { if (!isMissing(error)) throw error; }
  if (args.flags.checks) {
    const supplied = validate<Check[]>('checks.schema.json', await readJSON(root, flag(args, 'checks')));
    for (const check of supplied) {
      const previous = checks.findIndex(candidate => candidate.id === check.id && candidate.status === 'unverified');
      if (previous >= 0) checks.splice(previous, 1);
      checks.push(check);
    }
  }
  for (const check of checks) for (const evidence of check.evidence) if (!(await stat(await safePath(root, evidence))).isFile()) throw new Error(`Evidence must refer to an existing local file: ${evidence}`);
  const report = evaluateQuality(checks, config, context.revision); const output = flag(args, 'out', '.tevra/reports/quality.md');
  await writeJSON(root, '.tevra/reports/quality.json', JSON.parse(redact(JSON.stringify(report))) as unknown);
  await writeAtomic(root, output, markdownReport(report));
  await writeAtomic(root, '.tevra/reports/quality.html', htmlReport(report));
  return { result: { report: output, html: '.tevra/reports/quality.html', status: report.status, score: report.score, blockers: report.blockers, missing: report.missing }, failed: report.status === 'FAIL' };
}
