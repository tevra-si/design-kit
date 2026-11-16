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
test('acceptance criteria trace to checks and block the gate until each has passing evidence', () => {
  const config = { ...defaultConfig, requiredChecks: [] };
  const acceptance = ['AC-001: Form submits', 'AC-002: Errors are announced', 'AC-003: Works at 375px', 'AC-004: Dark mode', 'AC-005: Native share sheet'];
  const checks = scored(); const first = checks[0]; assert.ok(first); first.criteria = ['AC-001'];
  checks.push({ id: 'error-announcement', category: 'accessibility', kind: 'deterministic', status: 'failed', severity: 'minor', evidence: ['axe.json'], issue: 'Error is not announced', component: 'form', correction: 'Add a live region', criteria: ['AC-002'] });
  checks.push({ id: 'narrow-viewport', category: 'responsive', kind: 'deterministic', status: 'unverified', severity: 'minor', evidence: [], issue: 'Browser unavailable', component: 'form', correction: '', criteria: ['AC-003'] });
  const report = evaluateQuality(checks, config, 0, { acceptance, notApplicable: ['AC-005'], approvedBy: 'Product owner' });
  assert.equal(report.criteria?.[4]?.approvedBy, 'Product owner');
  assert.throws(() => evaluateQuality(checks, config, 0, { acceptance, notApplicable: ['AC-005'] }), /named human approver/u);
  assert.deepEqual(report.criteria?.map(criterion => criterion.status), ['PASS', 'FAIL', 'BLOCKED', 'SKIPPED', 'NOT_APPLICABLE']);
  assert.equal(report.status, 'FAIL'); assert.ok(report.blockers.includes('criterion:AC-002'));
  assert.ok(report.missing.includes('criterion:AC-003')); assert.ok(report.missing.includes('criterion:AC-004'));
  assert.match(markdownReport(report), /AC-004: Dark mode \| SKIPPED/u);
  const passing = evaluateQuality([{ ...first, criteria: ['AC-001'] }, ...scored().slice(1)], config, 0, { acceptance: ['AC-001: Form submits'] });
  assert.equal(passing.status, 'PASS');
  assert.throws(() => evaluateQuality([{ ...first, criteria: ['AC-009'] }], config, 0, { acceptance }), /Unknown acceptance criterion/u);
  assert.throws(() => evaluateQuality(scored(), config, 0, { acceptance: ['Form submits'] }), /AC-/u);
  assert.throws(() => evaluateQuality(scored(), config, 0, { acceptance, notApplicable: ['AC-009'], approvedBy: 'Product owner' }), /Unknown acceptance criterion/u);
  assert.equal(evaluateQuality(scored(), config, 0).criteria, undefined);
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
test('a report may name the commit it was produced on, and reports without it stay valid', () => {
  const config = { ...defaultConfig, requiredChecks: [] }; const commit = 'a'.repeat(40);
  assert.deepEqual(evaluateQuality(scored(), config, 3, undefined, { commit, branch: 'main' }).subject, { commit, branch: 'main' });
  assert.equal(evaluateQuality(scored(), config, 3).subject, undefined);
  assert.throws(() => evaluateQuality(scored(), config, 3, undefined, { commit: 'main' }));
});
