import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createContext, contextPath, updateContext } from '../../packages/design-context/src/index.js';
import { validate } from '../../packages/design-context/src/validation.js';
import { migrateContext } from '../../packages/design-context/src/migrate.js';
import { contrastRatio, createFoundation, exportTokens } from '../../packages/design-context/src/tokens.js';
import { writeJSON } from '../../packages/filesystem/src/index.js';

test('v1 remains valid and migration preserves evidence without overwriting the original', async () => {
  const original = await readFile('examples/design-context.json', 'utf8'); const legacy: unknown = JSON.parse(original);
  validate('design-context.schema.json', legacy);
  const migrated = migrateContext(legacy, 'owner');
  assert.equal(migrated.version, '2.0'); assert.ok(Object.keys(migrated.tokens.primitive).length > 0);
  assert.equal(await readFile('examples/design-context.json', 'utf8'), original);
  assert.throws(() => migrateContext({ schemaVersion: 'future' }, 'owner'));
});
test('strict context rejects unknown fields, out-of-range controls and missing ownership', () => {
  const context = createContext('Example', 'owner');
  assert.throws(() => validate('design-context.v2.schema.json', { ...context, surprise: true }));
  assert.throws(() => validate('design-context.v2.schema.json', { ...context, design: { ...context.design, variance: 11 } }));
  assert.throws(() => validate('design-context.v2.schema.json', { ...context, owner: '' }));
});
test('context updates reject stale revisions, ownership takeover and altered approved decisions', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-context-')); t.after(() => rm(root, { recursive: true, force: true }));
  const context = createContext('Example', 'owner'); context.decisions.push({ id: 'brand', approved: true, description: 'Preserve the green brand', owner: 'human' });
  await writeJSON(root, contextPath, context);
  const updated = await updateContext(root, context, 0); assert.equal(updated.revision, 1);
  await assert.rejects(updateContext(root, context, 0), /Stale/u);
  await assert.rejects(updateContext(root, { ...updated, owner: 'stranger' }, 1), /ownership/u);
  await assert.rejects(updateContext(root, { ...updated, decisions: [] }, 1), /immutable/u);
  await assert.rejects(updateContext(root, { ...updated, constraints: { ...updated.constraints, preserveBrand: false } }, 1), /authorization/u);
});
test('master-prompt version 1.0 imports with explicit new ownership and unapproved decisions', () => {
  const current = createContext('Example', 'owner');
  const migrated = migrateContext({ version: '1.0', project: current.project, design: current.design, tokens: { colors: {}, typography: {}, spacing: {}, radii: {}, shadows: {} }, constraints: { preserveBrand: true, preserveFunctionality: true, accessibilityTarget: 'WCAG_2_2_AA' }, decisions: ['Keep brand'] }, 'new-owner');
  assert.equal(migrated.owner, 'new-owner'); assert.equal(migrated.decisions[0]?.approved, false);
});
test('generated accent text has a measured WCAG contrast ratio for light and dark brand choices', () => {
  for (const brand of ['#ffffff', '#111111', '#ffff00', '#808080', '#175a44']) {
    const foundation = createFoundation(brand); const foreground = foundation.semantic['color.on-accent']; assert.ok(foreground); assert.ok(contrastRatio(brand, foreground) >= 4.5);
    for (const theme of Object.values(foundation.themes)) { const background = theme['color.accent']; const text = theme['color.on-accent']; assert.ok(background && text); assert.ok(contrastRatio(background, text) >= 4.5); }
  }
});
test('token adapters preserve aliases and produce CSS-first Tailwind without unsafe interpolation', () => {
  const tokens = createFoundation(); const output = exportTokens(tokens);
  assert.match(output.css, /var\(--tevra-primitive-color-brand\)/u); assert.match(output.css, /prefers-color-scheme/u);
  assert.match(output.tailwind, /@theme inline/u); assert.doesNotMatch(output.tailwind, /module.exports/u);
  assert.ok(JSON.parse(output.portable).layers.component);
  tokens.semantic['color.bad'] = '{semantic.color.missing}'; assert.throws(() => exportTokens(tokens), /Missing/u);
});
test('cyclic aliases and CSS injection fail at the export boundary', () => {
  const tokens = createFoundation(); tokens.semantic['color.a'] = '{semantic.color.b}'; tokens.semantic['color.b'] = '{semantic.color.a}';
  assert.throws(() => exportTokens(tokens), /Cyclic/u);
  const unsafe = createFoundation(); unsafe.primitive['color.brand'] = 'red; } body { display:none'; assert.throws(() => exportTokens(unsafe), /Unsafe/u);
});

test('extended context fields validate through both schemas and protect approved direction', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'tevra-context-')); t.after(() => rm(root, { recursive: true, force: true }));
  const context = createContext('extended', 'owner');
  context.brand = { name: 'Studio', assets: ['logo.svg'], rules: ['preserve mark'] };
  context.approvedDirection = { id: 'direction', description: 'Editorial', approved: true, owner: 'owner' };
  context.responsiveRequirements = ['390px minimum'];
  context.provenance = [{ sourceId: 'local', revision: '1', artifact: 'reference.png' }];
  context.knownRegressions = [{ id: 'table', description: 'Mobile overflow', evidence: ['screen.png'], status: 'open' }];
  validate('design-context.schema.json', context); validate('design-context.v2.schema.json', context);
  await writeJSON(root, '.tevra/design-context.json', context);
  await assert.rejects(updateContext(root, { ...context, approvedDirection: { ...context.approvedDirection, description: 'Changed' } }, 0), /immutable/u);
});
