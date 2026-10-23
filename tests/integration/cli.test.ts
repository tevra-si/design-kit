import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PNG } from 'pngjs';
import { createHash } from 'node:crypto';
import type { CaptureManifest } from '../../packages/visual-testing/src/types.js';
import { configHash } from '../../packages/visual-testing/src/capture.js';
import { defaultConfig } from '../../packages/core/src/config.js';
import { writeAtomic, writeJSON } from '../../packages/filesystem/src/index.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';

function cli(root: string, ...argv: string[]): { status: number | null; stdout: string; stderr: string } {
  const child = spawnSync(process.execPath, ['--import', 'tsx', resolve(kitRoot(), 'packages/cli/src/index.ts'), ...argv, '--root', root], { cwd: kitRoot(), encoding: 'utf8' });
  if (child.error) throw child.error; return { status: child.status, stdout: child.stdout, stderr: child.stderr };
}
test('CLI executes through a package-manager symlink and returns actual discovery JSON', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-cli-link-')); t.after(() => rm(root, { recursive: true, force: true }));
  const linked = resolve(root, 'linked-cli.ts'); await symlink(resolve(kitRoot(), 'packages/cli/src/index.ts'), linked);
  const child = spawnSync(process.execPath, ['--import', 'tsx', linked, 'skills', 'list', '--root', root], { cwd: kitRoot(), encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr); const output: unknown = JSON.parse(child.stdout);
  assert.ok(Array.isArray(output)); assert.equal(output.length, 12);
});
test('CLI setup, validation, tokens, memory, routing and strict failures execute through the public entrypoint', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-cli-')); t.after(() => rm(root, { recursive: true, force: true }));
  for (const argv of [['init', '--yes', '--skip-skills'], ['validate'], ['tokens', 'generate', '--new-system'], ['tokens', 'export'], ['skills', 'check'], ['plan', 'Improve pricing card', '--mode', 'quick']]) {
    const result = cli(root, ...argv); assert.equal(result.status, 0, `${argv.join(' ')}: ${result.stderr}`);
  }
  assert.equal(cli(root, 'tokens', 'generate', '--new-system').status, 2);
  const entry = { id: 'direction', kind: 'direction', text: 'Preserve current brand', approved: true, owner: 'human', updatedAt: new Date().toISOString() };
  await writeJSON(root, 'entry.json', entry); assert.equal(cli(root, 'memory', 'update', 'entry.json', '--revision', '0').status, 0);
  assert.match(cli(root, 'memory', 'inspect').stdout, /Preserve current brand/u);
  assert.equal(cli(root, 'memory', 'reset').status, 2); assert.equal(cli(root, 'memory', 'reset', '--yes').status, 0);
  assert.equal(cli(root, 'capture', '--pretend-success').status, 2);
  assert.match(await readFile(resolve(root, '.tevra/exports/tailwind.css'), 'utf8'), /@theme/u);
});

test('CLI PNG fixture comparison and report produce actual files, block changes and reject stale/failed captures', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-pipeline-fixture-')); t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(cli(root, 'init', '--yes', '--skip-skills').status, 0);
  const config = { ...defaultConfig, viewports: defaultConfig.viewports.slice(0, 1), thresholds: { ...defaultConfig.thresholds, minScore: 0, diffRatio: 0 } };
  await writeJSON(root, '.tevra/config.json', config); const viewport = config.viewports[0]; assert.ok(viewport);
  const id = `home--default--${viewport.name}`;
  const png = new PNG({ width: 20, height: 20 }); png.data.fill(255); const bytes = PNG.sync.write(png);
  let current: CaptureManifest | undefined;
  for (const kind of ['baseline', 'current'] as const) {
    const runId = `${kind}-fixture`; const file = `.tevra/artifacts/${kind}/${runId}/${id}.png`; await writeAtomic(root, file, bytes);
    const manifest: CaptureManifest = { version: 1, kind, runId, createdAt: new Date().toISOString(), configHash: configHash(config), contextRevision: 0, browserVersion: 'PNG unit fixture; no browser executed', entries: [{ id, route: 'home', state: 'default', viewport, file, imageHash: createHash('sha256').update(bytes).digest('hex'), masks: [], overflow: [], smallTargets: [], axeViolations: [], incompleteRules: [], pageErrors: [] }] };
    await writeJSON(root, `.tevra/artifacts/${kind}/manifest.json`, manifest); await writeJSON(root, `.tevra/artifacts/${kind}/attempt.json`, { status: 'passed', runId });
    if (kind === 'current') current = manifest;
  }
  assert.equal(cli(root, 'compare').status, 0);
  await writeJSON(root, 'fixture-evidence.json', { fixture: true, browserExecuted: false });
  await writeJSON(root, 'fixture-checks.json', [{ id: 'functional-tests', category: 'interaction', kind: 'deterministic', status: 'passed', severity: 'critical', evidence: ['fixture-evidence.json'], issue: 'Pipeline test fixture, not application behavior evidence', component: 'test fixture', correction: '' }]);
  const report = cli(root, 'report', '--checks', 'fixture-checks.json'); assert.equal(report.status, 0, report.stderr);
  assert.match(await readFile(resolve(root, '.tevra/reports/quality.md'), 'utf8'), /unscored/u);
  await writeJSON(root, '.tevra/config.json', { ...config, thresholds: { ...config.thresholds, diffRatio: 1 } });
  assert.equal(cli(root, 'report', '--checks', 'fixture-checks.json').status, 2);
  await writeJSON(root, '.tevra/config.json', config);
  assert.ok(current); const image = current.entries[0]; assert.ok(image);
  await writeAtomic(root, image.file, Buffer.from('tampered screenshot')); assert.equal(cli(root, 'compare').status, 2);
  await writeAtomic(root, image.file, bytes);
  current.createdAt = new Date(Date.now() + 1000).toISOString(); await writeJSON(root, '.tevra/artifacts/current/manifest.json', current);
  assert.equal(cli(root, 'report', '--checks', 'fixture-checks.json').status, 2);
  await writeJSON(root, '.tevra/artifacts/current/attempt.json', { status: 'failed', runId: current.runId }); assert.equal(cli(root, 'compare').status, 2);
});

test('expanded CLI exposes registry, context, memory and honest blocked workflow execution', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-cli-v2-')); t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(cli(root, 'init', '--yes', '--skip-skills').status, 0);
  for (const argv of [['skills', 'inspect', 'frontend-review'], ['skills', 'validate'], ['skills', 'graph'], ['context', 'show'], ['context', 'validate'], ['memory', 'list']]) {
    const result = cli(root, ...argv); assert.equal(result.status, 0, result.stderr); assert.ok(JSON.parse(result.stdout));
  }
  const planned = cli(root, 'workflow', 'plan', 'source review', '--mode', 'quick', '--out', 'review-plan.json');
  assert.equal(planned.status, 0, planned.stderr);
  const outcome = cli(root, 'workflow', 'run', 'review-plan.json');
  assert.equal(outcome.status, 1, outcome.stderr); assert.equal(JSON.parse(outcome.stdout).status, 'blocked');
  assert.equal(cli(root, 'test', 'performance').status, 2);
  assert.equal(cli(root, 'skills', 'inspect', 'unknown').status, 2);
  assert.match((await readFile(resolve(root, 'review-plan.json'), 'utf8')), /blocked/u);
});
