import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plan } from '../../contracts/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { kitRoot } from '../../filesystem/src/resources.js';
import type { Registry } from '../../registry/src/index.js';

export type DraftKind = 'plan' | 'develop' | 'review';
export interface AgentForgeDraft {
  schemaVersion: 1;
  source: { tool: 'tevra-design-kit'; version: string; rule: string; risk: 'low' | 'medium' | 'high' };
  name: string;
  steps: { id: DraftKind; kind: DraftKind; dependsOn: DraftKind[]; suggestedSkillIds: string[]; reason: string }[];
  acceptance?: string[];
}

const kindOfRole = { planner: 'plan', developer: 'develop', reviewer: 'review' } as const;
const order: DraftKind[] = ['plan', 'develop', 'review'];
const maxName = 80; const maxReason = 400; const maxSuggested = 8;
const clip = (text: string, limit: number): string => { const characters = Array.from(text); return characters.length <= limit ? text : `${characters.slice(0, limit - 1).join('')}…`; };

// AgentForge forbids a Developer depending on a Developer, so skills collapse to at most one step per role.
export async function agentForgeDraft(plan: Plan, registry: Registry): Promise<AgentForgeDraft> {
  const byKind = new Map<DraftKind, { ids: string[]; reasons: string[] }>();
  for (const step of plan.steps) {
    const entry = registry.skills.find(skill => skill.name === step.skill);
    if (!entry?.agentRole || !entry.id.startsWith('tevra.')) continue;
    const kind = kindOfRole[entry.agentRole];
    const group = byKind.get(kind) ?? { ids: [], reasons: [] };
    group.ids.push(`tevra-${entry.name}`);
    const reason = plan.routing?.selected.find(selected => selected.skill === step.skill)?.reason;
    if (reason && !group.reasons.includes(reason)) group.reasons.push(reason);
    byKind.set(kind, group);
  }
  if (!byKind.has('develop')) throw new Error('This plan has no developer skill, so AgentForge cannot build a Developer step. Launch the default Developer and Reviewer pair instead.');
  const present = order.filter(kind => byKind.has(kind));
  const steps = present.map(kind => {
    const group = byKind.get(kind);
    if (!group) throw new Error(`Missing draft step: ${kind}`);
    const before = present[present.indexOf(kind) - 1];
    return { id: kind, kind, dependsOn: before ? [before] : [], suggestedSkillIds: group.ids.slice(0, maxSuggested), reason: clip(group.reasons.join('; ') || `Suggested ${kind} skills`, maxReason) };
  });
  const version = (JSON.parse(await readFile(resolve(kitRoot(), 'package.json'), 'utf8')) as { version: string }).version;
  const draft: AgentForgeDraft = {
    schemaVersion: 1,
    source: { tool: 'tevra-design-kit', version, rule: plan.routing?.rule ?? 'unknown', risk: plan.routing?.risk ?? 'medium' },
    name: clip(plan.request.split('\n', 1)[0]?.trim() || 'Tevra workflow', maxName), steps,
    ...(plan.acceptance?.length ? { acceptance: plan.acceptance } : {}),
  };
  return validate<AgentForgeDraft>('agentforge-draft.schema.json', draft);
}
