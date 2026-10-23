import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { defaultConfig } from '../../packages/core/src/config.js';
import { capture } from '../../packages/visual-testing/src/capture.js';
import { compare } from '../../packages/visual-testing/src/compare.js';
import { captureChecks } from '../../packages/visual-testing/src/checks.js';
import { evaluateQuality, markdownReport } from '../../packages/quality-engine/src/index.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';
import { writeAtomic, writeJSON } from '../../packages/filesystem/src/index.js';

async function verifyTasks(browser: Browser, url: string): Promise<void> {
  const page = await browser.newPage();
  try {
    await page.goto(url); await page.locator('html[data-tevra-ready="true"]').waitFor(); await page.getByRole('heading', { name: 'Project tasks' }).waitFor();
    await page.getByLabel('Add a task', { exact: true }).fill('x'); await page.getByRole('button', { name: 'Add task', exact: true }).click();
    assert.match(await page.getByRole('alert').innerText(), /3 and 120/u);
    await page.getByLabel('Add a task', { exact: true }).fill('Verify real functionality'); await page.getByRole('button', { name: 'Add task', exact: true }).click();
    const checkbox = page.getByRole('checkbox', { name: 'Verify real functionality' }); await checkbox.check(); assert.equal(await checkbox.isChecked(), true);
    await page.getByRole('button', { name: 'Remove Verify real functionality', exact: true }).click(); assert.equal(await checkbox.count(), 0);
    while (await page.getByRole('button', { name: /^Remove /u }).count()) await page.getByRole('button', { name: /^Remove /u }).first().click();
    await page.getByText('A clear slate. Add your first task above.').waitFor();
    await page.reload(); await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to tasks');
  } finally { await page.close(); }
}

for (const [name, directory] of [['nextjs', 'examples/nextjs-dashboard/out'], ['sveltekit', 'examples/sveltekit-workspace/build']] as const) {
  test(`${name}: real built app, screenshot matrix, masked diff, axe and targeted redesign preserve tasks`, { timeout: 180000 }, async t => {
    const staticRoot = resolve(kitRoot(), directory); await stat(resolve(staticRoot, 'index.html'));
    const artifactRoot = resolve(kitRoot(), '.tevra/e2e', `${name}-${randomUUID()}`); await mkdir(artifactRoot, { recursive: true });
    let improved = false; let sequence = 0;
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1'); let file = resolve(staticRoot, `.${decodeURIComponent(url.pathname)}`);
        if (file !== staticRoot && !file.startsWith(`${staticRoot}${sep}`)) { response.writeHead(403); response.end(); return; }
        if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
        const bytes = await readFile(file); const extension = extname(file);
        response.writeHead(200, { 'content-type': extension === '.html' ? 'text/html' : extension === '.css' ? 'text/css' : extension === '.js' ? 'text/javascript' : 'application/octet-stream' });
        if (extension === '.css') response.end(`${bytes.toString()}\n.workspace-label::after { content: "${sequence++}"; display:inline-block; width:2rem; }${improved ? '\n.section-heading { padding-bottom:4rem; }' : ''}`);
        else response.end(bytes);
      } catch (error) { response.writeHead(error instanceof URIError ? 400 : 404); response.end(); }
    });
    await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => done()); });
    t.after(() => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())));
    const address = server.address(); assert.ok(address && typeof address !== 'string'); const url = `http://127.0.0.1:${address.port}`;
    const config = { ...defaultConfig, baseURL: url, permittedOrigins: [url], readySelector: 'html[data-tevra-ready="true"]', thresholds: { ...defaultConfig.thresholds, minScore: 0, diffRatio: 0 }, routes: [{ name: 'tasks', path: '/', states: [
      { name: 'default', actions: [], masks: ['.workspace-label'] },
      { name: 'added', actions: [{ type: 'fill' as const, selector: '#task-title', value: 'Review browser evidence' }, { type: 'click' as const, selector: '.primary-button' }], masks: ['.workspace-label'], waitFor: '.task-list li:nth-child(4)' },
      { name: 'error', actions: [{ type: 'fill' as const, selector: '#task-title', value: 'x' }, { type: 'click' as const, selector: '.primary-button' }], masks: ['.workspace-label'], waitFor: '#task-error' }
    ] }] };
    const baseline = await capture(artifactRoot, config, 'baseline', 0, true); assert.equal(baseline.entries.length, 12);
    await assert.rejects(capture(artifactRoot, config, 'baseline', 0, true), /already exists/u);
    const current = await capture(artifactRoot, config, 'current', 0); const matched = await compare(artifactRoot, config);
    assert.ok(matched.comparisons.every(result => result.passed)); assert.ok(current.entries.every(entry => !entry.axeViolations.length && !entry.pageErrors.length));
    const browser = await chromium.launch({ headless: true });
    try { await verifyTasks(browser, url); improved = true; await verifyTasks(browser, url); } finally { await browser.close(); }
    const updated = await capture(artifactRoot, config, 'current', 0); const changed = await compare(artifactRoot, config);
    assert.ok(changed.comparisons.some(result => !result.passed));
    await writeJSON(artifactRoot, 'functional-evidence.json', { status: 'passed', checks: ['validation', 'add', 'toggle', 'remove', 'empty', 'keyboard entry'], beforeAndAfter: true });
    const checks = [...captureChecks(updated).filter(check => check.id !== 'functional-tests' || check.status !== 'unverified'), ...changed.checks, { id: 'functional-tests', category: 'interaction' as const, kind: 'deterministic' as const, status: 'passed' as const, severity: 'critical' as const, evidence: ['functional-evidence.json'], issue: 'Real task actions passed before and after targeted style change.', component: 'task workspace', correction: '' }];
    const report = evaluateQuality(checks, config, 0); assert.equal(report.status, 'FAIL'); assert.ok(report.blockers.includes('visual-diff'));
    await writeJSON(artifactRoot, '.tevra/reports/quality.json', report); await writeAtomic(artifactRoot, '.tevra/reports/quality.md', markdownReport(report));
    process.stdout.write(`Browser evidence: ${artifactRoot}\n`);
  });
}
