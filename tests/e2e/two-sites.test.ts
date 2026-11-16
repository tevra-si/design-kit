import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { defaultConfig, validateConfig } from '../../packages/core/src/config.js';
import { capture } from '../../packages/visual-testing/src/capture.js';
import { compare } from '../../packages/visual-testing/src/compare.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';

async function serve(t: TestContext, pages: Record<string, string>): Promise<string> {
  const server = createServer((request, response) => {
    const page = pages[new URL(request.url ?? '/', 'http://127.0.0.1').pathname];
    if (page === undefined) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'content-type': 'text/html' }); response.end(page);
  });
  await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => done()); });
  t.after(() => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}`;
}
const page = (script = ''): string => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Orders</title><link rel="icon" href="data:,"></head><body><main><h1>Orders</h1><p>Three open orders.</p></main>${script}</body></html>`;

test('two deployed versions are compared route by route, including errors the baseline did not have', { timeout: 120000 }, async t => {
  const baselineURL = await serve(t, { '/orders': page() });
  const candidateURL = await serve(t, { '/account/orders': page('<script>console.error("orders failed to refresh")</script>') });
  const root = resolve(kitRoot(), '.tevra/e2e', `two-sites-${randomUUID()}`); await mkdir(root, { recursive: true });
  const viewport = defaultConfig.viewports[0]; assert.ok(viewport);
  const config = validateConfig({ ...defaultConfig, baseURL: candidateURL, baselineURL, permittedOrigins: [candidateURL, baselineURL], viewports: [viewport], thresholds: { ...defaultConfig.thresholds, diffRatio: 0 },
    routes: [{ name: 'orders', path: '/account/orders', baselinePath: '/orders', states: [{ name: 'default', actions: [], masks: [] }] }] });
  const baseline = await capture(root, config, 'baseline', 0, true); const current = await capture(root, config, 'current', 0);
  assert.deepEqual(baseline.entries[0]?.consoleErrors, []); assert.deepEqual(current.entries[0]?.consoleErrors, ['orders failed to refresh']);
  const result = await compare(root, config);
  assert.ok(result.comparisons.every(comparison => comparison.passed));
  const runtime = result.checks.find(check => check.id === 'runtime-regressions');
  assert.equal(runtime?.status, 'failed'); assert.match(runtime?.issue ?? '', /orders--default--mobile-small: orders failed to refresh/u);
  assert.match(result.checks.find(check => check.id === 'runtime-regressions:orders--default--mobile-small')?.issue ?? '', /Actual: orders failed to refresh/u);
  assert.equal(result.checks.find(check => check.id === 'accessibility-regressions')?.status, 'passed');
});
