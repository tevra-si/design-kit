import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, defaultConfig } from '../../packages/core/src/config.js';
import { captureChecks } from '../../packages/visual-testing/src/checks.js';
import type { CaptureManifest } from '../../packages/visual-testing/src/types.js';

test('browser assertions are validated and console/network failures remain separate evidence', () => {
  const config = structuredClone(defaultConfig); const state = config.routes[0]?.states[0]; assert.ok(state);
  state.actions.push({ type: 'expect-text', selector: '#status' });
  assert.throws(() => validateConfig(config), /requires a value/u);
  state.actions[0] = { type: 'expect-text', selector: '#status', value: 'Saved' }; assert.ok(validateConfig(config));
  const viewport = defaultConfig.viewports[0]; assert.ok(viewport);
  const manifest: CaptureManifest = { version: 1, kind: 'current', runId: 'fixture', createdAt: new Date().toISOString(), configHash: 'fixture', contextRevision: 0, browserVersion: 'fixture, no browser', entries: [{ id: 'a', route: 'home', state: 'default', viewport, file: 'screen.png', imageHash: 'a'.repeat(64), masks: [], overflow: [], smallTargets: [], axeViolations: [], incompleteRules: [], pageErrors: [], consoleErrors: ['Unexpected error'], networkErrors: ['HTTP 500 /save'], assertions: 0 }] };
  let checks = captureChecks(manifest);
  assert.equal(checks.find(check => check.id === 'console-errors')?.status, 'failed');
  assert.equal(checks.find(check => check.id === 'network-errors')?.status, 'failed');
  assert.equal(checks.find(check => check.id === 'functional-tests')?.status, 'unverified');
  const entry = manifest.entries[0]; assert.ok(entry); entry.assertions = 1;
  checks = captureChecks(manifest); assert.equal(checks.find(check => check.id === 'functional-tests')?.status, 'passed');
});
