import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { access, mkdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import type { Check, Config } from '../../contracts/src/index.js';
import { redact, safePath, withLock, writeAtomic, writeJSON } from '../../filesystem/src/index.js';

export interface PerformanceBudgets { lcpMs: number; cls: number; tbtMs: number }
export interface PerformanceMetrics { lcpMs: number; cls: number; tbtMs: number }
export const defaultBudgets: PerformanceBudgets = { lcpMs: 2500, cls: 0.1, tbtMs: 200 };
const lighthouseMissing = 'Lighthouse is not installed. It is an optional dependency: run `npm install --save-dev lighthouse` next to tevra-design-kit (or `npm install --global lighthouse` for a global install) and retry';
// Resolved only from where Tevra is installed, never from the audited project's node_modules.
export function resolveLighthouseCli(from: string = import.meta.url): string {
  try { return createRequire(from).resolve('lighthouse/cli/index.js'); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') throw new Error(lighthouseMissing, { cause: error }); throw error; }
}
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function extractMetrics(input: unknown): PerformanceMetrics {
  if (!record(input) || !record(input.audits)) throw new Error('Invalid Lighthouse report: missing audits');
  if (input.runtimeError) throw new Error('Lighthouse reported a runtime error; metrics are unverified');
  const audits = input.audits;
  function metric(name: string): number {
    const audit = audits[name];
    if (!record(audit) || audit.errorMessage || typeof audit.numericValue !== 'number' || !Number.isFinite(audit.numericValue) || audit.numericValue < 0) throw new Error(`Missing or invalid Lighthouse metric: ${name}`);
    return audit.numericValue;
  }
  return { lcpMs: metric('largest-contentful-paint'), cls: metric('cumulative-layout-shift'), tbtMs: metric('total-blocking-time') };
}
export function performanceChecks(metrics: PerformanceMetrics, budgets: PerformanceBudgets, evidence: string): Check[] {
  return (['lcpMs', 'cls', 'tbtMs'] as const).map(name => {
    const budget = budgets[name]; const value = metrics[name];
    if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(value) || value < 0) throw new Error(`Invalid performance metric or budget: ${name}`);
    return { id: `performance-${name}`, category: 'performance', kind: 'deterministic', status: value <= budget ? 'passed' : 'failed', severity: 'major', evidence: [evidence], issue: `${name}: ${value}; laboratory budget: ${budget}`, component: 'audited navigation', correction: 'Inspect the saved Lighthouse diagnostics; repeat under equivalent conditions.' };
  });
}
export async function auditPerformance(root: string, config: Config, revision: number, options: {
  allowNetwork: boolean; allowCustomBrowser?: boolean; budgets?: PerformanceBudgets;
}): Promise<{ metrics: PerformanceMetrics; checks: Check[]; report: string; html: string }> {
  if (!options.allowNetwork) throw new Error('Lighthouse loads the target and its resources; review the application and pass --allow-network explicitly');
  if (config.browser.executablePath && !options.allowCustomBrowser) throw new Error('Custom browser requires --allow-custom-browser');
  const cli = resolveLighthouseCli();
  const budgets = options.budgets ?? defaultBudgets;
  for (const value of Object.values(budgets)) if (!Number.isFinite(value) || value < 0) throw new Error('Invalid performance budgets');
  const target = new URL(config.baseURL);
  if (!config.permittedOrigins.includes(target.origin) || target.username || target.password || !['http:', 'https:'].includes(target.protocol)) throw new Error('Performance URL must use an explicitly permitted origin without credentials');
  const executable = config.browser.executablePath ?? (config.browser.channel === 'chrome' && process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : chromium.executablePath());
  await access(executable);
  return withLock(root, '.tevra/performance.lock', async () => {
    const id = randomUUID(); const directory = `.tevra/artifacts/performance/${id}`;
    await mkdir(await safePath(root, directory), { recursive: true });
    const output = await safePath(root, `${directory}/lighthouse`);
    const report = `${directory}/lighthouse.report.json`; const html = `${directory}/lighthouse.report.html`;
    await writeJSON(root, '.tevra/artifacts/performance/attempt.json', { status: 'running', id, contextRevision: revision });
    try {
      await promisify(execFile)(process.execPath, [cli, target.href, '--only-categories=performance', '--output=json', '--output=html', `--output-path=${output}`, '--chrome-flags=--headless', '--quiet', '--enable-error-reporting=false'], {
        cwd: root, env: { ...process.env, CHROME_PATH: executable }, timeout: 120000, maxBuffer: 1024 * 1024, windowsHide: true
      });
      const raw: unknown = JSON.parse(await readFile(await safePath(root, report), 'utf8'));
      const metrics = extractMetrics(raw);
      await writeAtomic(root, report, redact(JSON.stringify(raw, null, 2)));
      await writeAtomic(root, html, redact(await readFile(await safePath(root, html), 'utf8')));
      const checks = performanceChecks(metrics, budgets, report);
      const result = { metrics, checks, report, html };
      await writeJSON(root, `${directory}/summary.json`, { ...result, contextRevision: revision, budgets, measurement: 'laboratory', caveat: 'Navigation TBT is not real-user INP. A single run does not establish a field regression.' });
      await writeJSON(root, '.tevra/artifacts/performance/attempt.json', { status: 'passed', id, contextRevision: revision, summary: `${directory}/summary.json` });
      return result;
    } catch (error) {
      await writeJSON(root, '.tevra/artifacts/performance/attempt.json', { status: 'failed', id, contextRevision: revision, error: redact(error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  });
}
