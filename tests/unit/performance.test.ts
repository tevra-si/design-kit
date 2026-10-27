import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMetrics, performanceChecks, defaultBudgets, auditPerformance, resolveLighthouseCli } from '../../packages/performance-qa/src/index.js';
import { defaultConfig } from '../../packages/core/src/config.js';
import { htmlReport } from '../../packages/quality-engine/src/html.js';
import { evaluateQuality } from '../../packages/quality-engine/src/index.js';

test('Lighthouse metrics extract units and reject runtime errors and missing values', () => {
  const input = { audits: { 'largest-contentful-paint': { numericValue: 2400 }, 'cumulative-layout-shift': { numericValue: 0.05 }, 'total-blocking-time': { numericValue: 250 } } };
  assert.deepEqual(extractMetrics(input), { lcpMs: 2400, cls: 0.05, tbtMs: 250 });
  assert.throws(() => extractMetrics({ ...input, runtimeError: { message: 'navigation failed' } }), /runtime/u);
  assert.throws(() => extractMetrics({ audits: {} }), /Missing/u);
  assert.throws(() => extractMetrics({ audits: { 'largest-contentful-paint': { numericValue: Infinity } } }), /invalid/u);
});
test('performance budgets produce deterministic evidence without subjective scores', async () => {
  const checks = performanceChecks({ lcpMs: 2500, cls: 0.1, tbtMs: 201 }, defaultBudgets, '.tevra/performance.json');
  assert.deepEqual(checks.map(check => check.status), ['passed', 'passed', 'failed']);
  assert.ok(checks.every(check => check.kind === 'deterministic' && check.score === undefined));
  assert.throws(() => performanceChecks({ lcpMs: NaN, cls: 0, tbtMs: 0 }, defaultBudgets, 'x'), /Invalid/u);
  await assert.rejects(auditPerformance(process.cwd(), defaultConfig, 0, { allowNetwork: false }), /allow-network/u);
  await assert.rejects(auditPerformance(process.cwd(), { ...defaultConfig, browser: { executablePath: '/bad' } }, 0, { allowNetwork: true }), /allow-custom-browser/u);
});
test('HTML report escapes untrusted text and links only local evidence', () => {
  const report = evaluateQuality([], { ...defaultConfig, requiredChecks: [], thresholds: { ...defaultConfig.thresholds, minScore: 0 } }, 0);
  report.checks.push({ id: 'x', category: 'functional', kind: 'human', status: 'unverified', severity: 'minor', evidence: ['javascript:alert(1)', '../secret', '.tevra/a.png'], issue: '<script>alert(1)</script>', component: 'button', correction: 'inspect' });
  const html = htmlReport(report);
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('href="../../javascript')); assert.ok(!html.includes('href="../../../secret'));
  assert.ok(html.includes('src="../../.tevra/a.png"'));
});

test('missing Lighthouse gives an actionable install message and is resolved from the Tevra install', async () => {
  assert.throws(() => resolveLighthouseCli('/nonexistent/tevra/package.json'), /optional dependency.*npm install --save-dev lighthouse/u);
  assert.match(resolveLighthouseCli(), /lighthouse[\\/]cli[\\/]index\.js$/u);
});
