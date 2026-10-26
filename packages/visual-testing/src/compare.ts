import { readFile } from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { createHash } from 'node:crypto';
import type { Config } from '../../contracts/src/index.js';
import { readJSON, safePath, withLock, writeAtomic, writeJSON } from '../../filesystem/src/index.js';
import type { CaptureManifest, Comparison, ComparisonResult } from './types.js';
import { validate } from '../../design-context/src/validation.js';
import { configHash, manifestHash, comparisonSettingsHash } from './capture.js';

export async function validateCaptureAttempt(root: string, manifest: CaptureManifest): Promise<void> {
  const attempt = await readJSON(root, `.tevra/artifacts/${manifest.kind}/attempt.json`);
  if (!attempt || typeof attempt !== 'object' || !('status' in attempt) || attempt.status !== 'passed' || !('runId' in attempt) || attempt.runId !== manifest.runId) throw new Error(`Latest ${manifest.kind} capture did not pass; recapture before comparison/reporting`);
  for (const entry of manifest.entries) {
    const digest = createHash('sha256').update(await readFile(await safePath(root, entry.file))).digest('hex');
    if (digest !== entry.imageHash) throw new Error(`Screenshot changed after capture: ${entry.id}`);
  }
}
export function assertCaptureMatchesConfig(manifest: CaptureManifest, config: Config): void {
  if (manifest.configHash !== configHash(config)) throw new Error('Capture does not match the active configuration');
  const expected = config.routes.flatMap(route => route.states.flatMap(state => config.viewports.map(viewport => `${route.name}--${state.name}--${viewport.name}`)));
  if (manifest.entries.length !== expected.length || new Set(manifest.entries.map(entry => entry.id)).size !== expected.length || expected.some(id => !manifest.entries.some(entry => entry.id === id))) throw new Error('Capture artifact sets differ');
  for (const entry of manifest.entries) {
    const viewport = config.viewports.find(profile => profile.name === entry.viewport.name);
    if (!viewport || viewport.width !== entry.viewport.width || viewport.height !== entry.viewport.height) throw new Error('Capture viewport dimensions differ from configuration');
  }
}

export function compareImages(baseline: Buffer, current: Buffer, sensitivity: number, limit: number): { png: Buffer; differentPixels: number; ratio: number; sizeMismatch: boolean; passed: boolean } {
  for (const buffer of [baseline, current]) {
    if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || buffer.subarray(12, 16).toString() !== 'IHDR') throw new Error('Invalid PNG header');
    if (buffer.readUInt32BE(16) * buffer.readUInt32BE(20) > 40_000_000) throw new Error('Screenshot exceeds 40 million pixel comparison limit');
  }
  const left = PNG.sync.read(baseline); const right = PNG.sync.read(current);
  const width = Math.max(left.width, right.width); const height = Math.max(left.height, right.height);
  if (width * height > 40_000_000) throw new Error('Screenshot exceeds 40 million pixel comparison limit');
  const paddedLeft = new PNG({ width, height }); const paddedRight = new PNG({ width, height }); const diff = new PNG({ width, height });
  PNG.bitblt(left, paddedLeft, 0, 0, left.width, left.height, 0, 0); PNG.bitblt(right, paddedRight, 0, 0, right.width, right.height, 0, 0);
  const differentPixels = pixelmatch(paddedLeft.data, paddedRight.data, diff.data, width, height, { threshold: sensitivity, includeAA: false });
  const ratio = differentPixels / (width * height); const sizeMismatch = left.width !== right.width || left.height !== right.height;
  return { png: PNG.sync.write(diff), differentPixels, ratio, sizeMismatch, passed: !sizeMismatch && ratio <= limit };
}
export async function compare(root: string, config: Config): Promise<ComparisonResult> {
  return withLock(root, '.tevra/visual.lock', async () => {
    const baseline = validate<CaptureManifest>('capture-manifest.schema.json', await readJSON(root, '.tevra/artifacts/baseline/manifest.json'));
    const current = validate<CaptureManifest>('capture-manifest.schema.json', await readJSON(root, '.tevra/artifacts/current/manifest.json'));
    if (baseline.kind !== 'baseline' || current.kind !== 'current') throw new Error('Invalid capture kinds');
    await validateCaptureAttempt(root, baseline); await validateCaptureAttempt(root, current);
    assertCaptureMatchesConfig(baseline, config); assertCaptureMatchesConfig(current, config);
    if (baseline.configHash !== current.configHash) throw new Error('Capture configurations differ; establish matching evidence rather than hiding the difference');
    if (baseline.contextRevision !== current.contextRevision) throw new Error('Capture context revisions differ');
    if (baseline.browserVersion !== current.browserVersion) throw new Error('Browser versions differ; compare in a consistent environment');
    const comparisons: Comparison[] = [];
    for (const entry of current.entries) {
      const original = baseline.entries.find(candidate => candidate.id === entry.id);
      if (!original) throw new Error(`Missing baseline: ${entry.id}`);
      const result = compareImages(await readFile(await safePath(root, original.file)), await readFile(await safePath(root, entry.file)), config.thresholds.pixelSensitivity, config.thresholds.diffRatio);
      const diff = `.tevra/artifacts/diff/${entry.id}.png`; await writeAtomic(root, diff, result.png);
      comparisons.push({ id: entry.id, ratio: result.ratio, differentPixels: result.differentPixels, sizeMismatch: result.sizeMismatch, passed: result.passed, diff });
    }
    const evidence = comparisons.map(comparison => comparison.diff);
    const result: ComparisonResult = { version: 1, createdAt: new Date().toISOString(), settingsHash: comparisonSettingsHash(config), currentManifestHash: manifestHash(current), comparisons, checks: [{ id: 'visual-diff', category: 'consistency', kind: 'deterministic', status: comparisons.every(value => value.passed) ? 'passed' : 'failed', severity: 'major', evidence, component: 'configured visual matrix', issue: 'Changed-pixel ratio and screenshot dimensions compared to baseline.', correction: 'Inspect generated differences; obtain approval for intended changes before replacing baselines.' }] };
    await writeJSON(root, '.tevra/artifacts/comparison.json', result); return result;
  });
}
