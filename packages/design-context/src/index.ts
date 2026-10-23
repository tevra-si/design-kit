import type { DesignContext } from '../../contracts/src/index.js';
import { readJSON, withLock, writeJSON } from '../../filesystem/src/index.js';
import { validate } from './validation.js';
import { isDeepStrictEqual } from 'node:util';

export const contextPath = '.tevra/design-context.json';
export function createContext(name: string, owner: string): DesignContext {
  return validate<DesignContext>('design-context.v2.schema.json', {
    version: '2.0', revision: 0, owner, project: { name, framework: 'unknown', styling: 'css' },
    design: { variance: 5, motionIntensity: 3, visualDensity: 5, theme: 'system', brandPersonality: [] },
    tokens: { primitive: {}, semantic: {}, component: {}, themes: {}, responsive: {} },
    constraints: { preserveBrand: true, preserveFunctionality: true, accessibilityTarget: 'WCAG_2_2_AA', approvedScope: [] },
    decisions: [], assumptions: ['Inspect the existing design system before proposing tokens.'], evidence: []
  });
}
export async function loadContext(root: string): Promise<DesignContext> { return validate('design-context.v2.schema.json', await readJSON(root, contextPath)); }

export async function updateContext(root: string, candidate: unknown, expectedRevision: number, approveConstraints = false): Promise<DesignContext> {
  const next = validate<DesignContext>('design-context.v2.schema.json', candidate);
  return withLock(root, '.tevra/context.lock', async () => {
    const current = await loadContext(root);
    if (current.revision !== expectedRevision || next.revision !== expectedRevision) throw new Error('Stale context revision; reload before writing');
    if (current.owner !== next.owner) throw new Error('Context ownership transfer requires an explicit migration');
    if (!approveConstraints && !isDeepStrictEqual(current.constraints, next.constraints)) throw new Error('Constraint changes require explicit --approve-constraints authorization');
    if (current.approvedDirection?.approved && !isDeepStrictEqual(current.approvedDirection, next.approvedDirection)) throw new Error('Approved visual direction is immutable; record a new explicit decision before migration');
    if (current.brand && !isDeepStrictEqual(current.brand, next.brand) && !approveConstraints) throw new Error('Brand changes require explicit --approve-constraints authorization');
    for (const approved of current.decisions.filter(decision => decision.approved)) {
      const replacement = next.decisions.find(decision => decision.id === approved.id);
      if (!isDeepStrictEqual(replacement, approved)) throw new Error(`Approved decision is immutable: ${approved.id}`);
    }
    if (new Set(next.decisions.map(decision => decision.id)).size !== next.decisions.length) throw new Error('Duplicate decision identifiers');
    const updated = { ...next, revision: expectedRevision + 1 };
    await writeJSON(root, contextPath, updated);
    return updated;
  });
}
