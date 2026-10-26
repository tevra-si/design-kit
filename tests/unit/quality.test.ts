import test from 'node:test';
import assert from 'node:assert/strict';
import { categories } from '../../packages/contracts/src/index.js';
import type { Check } from '../../packages/contracts/src/index.js';
import { defaultConfig, validateConfig } from '../../packages/core/src/config.js';
import { evaluateQuality, markdownReport } from '../../packages/quality-engine/src/index.js';
import { redact } from '../../packages/filesystem/src/index.js';

function scored(): Check[] { return categories.map(category => ({ id: category, category, kind: 'ai', status: 'passed', severity: 'minor', score: 3, evidence: ['evidence.png'], issue: 'Fixture assessment', component: 'fixture', correction: '' })); }
test('weighted judgments preserve evidence kind and score without implying objective measurement', () => {
  const config = { ...defaultConfig, requiredChecks: [] }; const report = evaluateQuality(scored(), config, 3);
  assert.equal(report.score, 75); assert.equal(report.status, 'PASS');
  assert.match(markdownReport(report), /subjective judgments/u); assert.match(markdownReport(report), /\| ai \|/u);
});
test('critical failures and failed required tests cannot be averaged away', () => {
  const checks = scored(); checks.push({ id: 'functional-tests', category: 'interaction', kind: 'deterministic', status: 'failed', severity: 'critical', evidence: ['test.log'], issue: 'Save action failed', component: 'save', correction: 'Fix submission' });
  const report = evaluateQuality(checks, defaultConfig, 0); assert.equal(report.status, 'FAIL'); assert.ok(report.blockers.includes('functional-tests'));
});
test('unexecuted checks remain missing and unscored', () => {
  const report = evaluateQuality([], defaultConfig, 0); assert.equal(report.status, 'FAIL'); assert.equal(report.score, null); assert.ok(report.missing.includes('score:hierarchy'));
});
test('failed check without evidence and duplicate IDs are rejected', () => {
  const checks = scored(); const first = checks[0]; assert.ok(first);
  assert.throws(() => evaluateQuality([{ ...first, status: 'failed', evidence: [] }], defaultConfig, 0), /evidence/u);
  assert.throws(() => evaluateQuality([first, first], defaultConfig, 0), /unique/u);
  assert.throws(() => evaluateQuality([{ ...first, score: 2, correction: '' }], defaultConfig, 0), /Low score/u);
});
test('explicitly zero score threshold allows automation-only gates while preserving unscored status', () => {
  const config = { ...defaultConfig, requiredChecks: [], thresholds: { ...defaultConfig.thresholds, minScore: 0 } };
  const report = evaluateQuality([], config, 0); assert.equal(report.status, 'PASS'); assert.equal(report.score, null);
});
test('config rejects remote routes, invalid weights, duplicate viewports and incomplete actions', () => {
  assert.throws(() => validateConfig({ ...defaultConfig, permittedOrigins: ['https://other.example'] }), /permitted/u);
  assert.throws(() => validateConfig({ ...defaultConfig, weights: { ...defaultConfig.weights, layout: 40 } }), /sum/u);
  assert.throws(() => validateConfig({ ...defaultConfig, viewports: [defaultConfig.viewports[0], defaultConfig.viewports[0]] }), /Duplicate/u);
  assert.throws(() => validateConfig({ ...defaultConfig, routes: [{ name: 'remote', path: 'https://other.example', states: [{ name: 'default', actions: [], masks: [] }] }] }), /escapes/u);
});
test('reports redact credentials, query secrets and Markdown table injection', () => {
  const checks = scored(); const first = checks[0]; assert.ok(first);
  first.issue = 'https://name:password@example.test/path?token=secret | injected';
  const output = markdownReport(evaluateQuality(checks, { ...defaultConfig, requiredChecks: [] }, 0));
  assert.doesNotMatch(output, /password|token=secret/u); assert.match(output, /\\\| injected/u);
  assert.equal(redact('api_key=secret-value'), 'api_key=[REDACTED]');
});
