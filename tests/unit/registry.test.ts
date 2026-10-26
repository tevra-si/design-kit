import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadRegistry, validateBundledProvenance, registryGraph, selectCapabilities, validateRegistry } from '../../packages/registry/src/index.js';

test('registry contains twelve concise discoverable skills with all contracts', async () => {
  const registry = await loadRegistry(); assert.equal(registry.skills.length, 12);
  await validateBundledProvenance(registry);
  for (const skill of registry.skills) {
    assert.ok((await readFile(skill.entrypoint, 'utf8')).length < 10000);
    assert.ok(skill.inputs.length && skill.outputs.length && skill.validation.length);
  }
  assert.match(registryGraph(registry), /tevra.ui-builder/u);
});
test('registry rejects duplicate identity, missing dependency, cycles and unsafe entrypoints', async () => {
  const registry = await loadRegistry(); const first = registry.skills[0]; const second = registry.skills[1];
  assert.ok(first && second);
  assert.throws(() => validateRegistry({ ...registry, skills: [...registry.skills, first] }), /Duplicate/u);
  assert.throws(() => validateRegistry({ version: 1, skills: [{ ...first, dependencies: ['missing.skill'] }] }), /Missing/u);
  assert.throws(() => validateRegistry({ version: 1, skills: [{ ...first, dependencies: [second.id] }, { ...second, dependencies: [first.id] }] }), /cycle/u);
  assert.throws(() => validateRegistry({ version: 1, skills: [{ ...first, entrypoint: '../SKILL.md' }] }), /Unsafe/u);
});
test('capability selection handles extensions, deterministic ties, overrides and conflicts', async () => {
  const registry = await loadRegistry(); const builder = registry.skills.find(skill => skill.name === 'ui-builder'); assert.ok(builder);
  const extension = { ...builder, id: 'acme.builder', name: 'acme-builder', priority: 90 };
  const extended = { ...registry, skills: [...registry.skills, extension] };
  const selection = selectCapabilities(extended, ['frontend.implementation', 'frontend.implementation']);
  assert.deepEqual(selection.skills.map(skill => skill.id), ['acme.builder']);
  assert.equal(selection.duplicates['frontend.implementation']?.length, 2);
  assert.equal(selectCapabilities(extended, ['frontend.implementation'], { overrides: { 'frontend.implementation': builder.id } }).skills[0]?.id, builder.id);
  assert.throws(() => selectCapabilities(extended, ['frontend.implementation'], { overrides: { 'frontend.implementation': 'absent.skill' } }), /No compatible/u);
  assert.throws(() => selectCapabilities(registry, ['frontend.implementation'], { framework: 'unknown' }), /No compatible/u);
  assert.throws(() => selectCapabilities(registry, ['browser.testing'], { platform: 'native' }), /No compatible/u);
  const conflict = { ...extension, dependencies: [builder.id], conflicts: [builder.id] };
  assert.throws(() => selectCapabilities({ ...registry, skills: [...registry.skills, conflict] }, ['frontend.implementation']), /conflict/u);
});
