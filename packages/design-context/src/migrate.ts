import type { DesignContext } from '../../contracts/src/index.js';
import { createContext } from './index.js';
import { validate } from './validation.js';

interface LegacyContext {
  schemaVersion: '1.0.0'; project: { name: string; evidence?: DesignContext['evidence'] };
  tokens: { color: Record<string, string>; typography: Record<string, string>; spacing: Record<string, string>; shape: Record<string, string>; motion: Record<string, string> };
  decisions?: string[]; constraints?: string[];
}
interface MasterContext {
  version: '1.0'; project: DesignContext['project']; design: DesignContext['design'];
  tokens: Record<string, Record<string, string>>;
  constraints: { preserveBrand: boolean; preserveFunctionality: boolean; accessibilityTarget: 'WCAG_2_2_AA' };
  decisions: string[];
}
export function migrateContext(input: unknown, owner: string): DesignContext {
  if (!input || typeof input !== 'object') throw new Error('Context must be an object');
  if ('version' in input && input.version === '2.0') return validate('design-context.v2.schema.json', input);
  if ('version' in input && input.version === '1.0') {
    const original = validate<MasterContext>('legacy/design-context.master-v1.schema.json', input);
    const migrated = createContext(original.project.name, owner);
    migrated.project = original.project; migrated.design = original.design;
    migrated.tokens.primitive = Object.fromEntries(Object.entries(original.tokens).flatMap(([group, tokens]) => Object.entries(tokens).map(([key, value]) => [`${group}.${key}`, value])));
    migrated.constraints = { ...original.constraints, approvedScope: [] };
    migrated.decisions = original.decisions.map((description, index) => ({ id: `imported-${index + 1}`, description, owner, approved: false }));
    migrated.assumptions = ['Imported version 1.0 without approval metadata; confirm imported decisions explicitly.'];
    return validate('design-context.v2.schema.json', migrated);
  }
  const legacy = validate<LegacyContext>('legacy/design-context.v1.schema.json', input);
  const migrated = createContext(legacy.project.name, owner);
  migrated.tokens.primitive = Object.fromEntries(Object.entries(legacy.tokens).flatMap(([group, tokens]) => Object.entries(tokens).map(([key, value]) => [`${group}.${key}`, value])));
  migrated.decisions = (legacy.decisions ?? []).map((description, index) => ({ id: `legacy-${index + 1}`, description, approved: false, owner }));
  migrated.evidence = legacy.project.evidence ?? [];
  migrated.assumptions = ['Migrated legacy constraints retained as notes; confirm structured scope before implementation.', ...(legacy.constraints ?? [])];
  return validate('design-context.v2.schema.json', migrated);
}
