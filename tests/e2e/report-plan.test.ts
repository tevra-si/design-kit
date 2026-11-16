import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { QualityReport } from '../../packages/contracts/src/index.js';
import { parseCLI } from '../../packages/cli/src/arguments.js';
import { projectCommand } from '../../packages/cli/src/project-commands.js';
import { visualCommand } from '../../packages/cli/src/visual-commands.js';
import { workflowCommand } from '../../packages/cli/src/workflow-commands.js';
import { defaultConfig } from '../../packages/core/src/config.js';
import { readJSON, writeJSON } from '../../packages/filesystem/src/index.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';

test('report --plan traces plan criteria to checks through the CLI commands', { timeout: 120000 }, async t => {
  const server = createServer((_request, response) => { response.writeHead(200, { 'content-type': 'text/html' }); response.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Orders</title><link rel="icon" href="data:,"></head><body><main><h1>Orders</h1><p>Three open orders.</p></main></body></html>'); });
  await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => done()); });
  t.after(() => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const url = `http://127.0.0.1:${address.port}`;
  const root = resolve(kitRoot(), '.tevra/e2e', `report-plan-${randomUUID()}`); await mkdir(root, { recursive: true });
  const run = (...argv: string[]): ReturnType<typeof parseCLI> => parseCLI([...argv, '--root', root]);

  await projectCommand(run('init', '--yes', '--skip-skills'), root);
  const viewport = defaultConfig.viewports[0]; assert.ok(viewport);
  await writeJSON(root, '.tevra/config.json', { ...defaultConfig, baseURL: url, permittedOrigins: [url], viewports: [viewport], requiredChecks: [], thresholds: { ...defaultConfig.thresholds, minScore: 0 } });
  await writeJSON(root, 'criteria.json', ['AC-001: Open orders are listed', 'AC-002: Orders can be filtered', 'AC-003: Orders export to a native share sheet']);
  await workflowCommand(run('plan', 'Build the orders page', '--acceptance', 'criteria.json', '--out', 'plan.json'), root);
  await visualCommand(run('capture'), root);
  await writeJSON(root, 'walkthrough.json', { observed: 'Three open orders are listed' });
  await writeJSON(root, 'checks.json', [{ id: 'orders-listed', category: 'functional', kind: 'human', status: 'passed', severity: 'major', evidence: ['walkthrough.json'], issue: 'Open orders are listed.', component: 'orders', correction: '', criteria: ['AC-001'] }]);

  await assert.rejects(visualCommand(run('report', '--plan', 'plan.json', '--checks', 'checks.json', '--not-applicable', 'AC-003'), root), /named human approver/u);
  const outcome = await visualCommand(run('report', '--plan', 'plan.json', '--checks', 'checks.json', '--not-applicable', 'AC-003', '--by', 'Product owner'), root);
  assert.equal(outcome.failed, true);
  const report = await readJSON(root, '.tevra/reports/quality.json') as QualityReport;
  assert.deepEqual(report.criteria?.map(criterion => [criterion.id, criterion.status]), [['AC-001', 'PASS'], ['AC-002', 'SKIPPED'], ['AC-003', 'NOT_APPLICABLE']]);
  assert.equal(report.criteria?.[2]?.approvedBy, 'Product owner'); assert.deepEqual(report.missing, ['criterion:AC-002']);
});
