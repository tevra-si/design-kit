import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { kitRoot } from '../../filesystem/src/resources.js';
import { validate } from '../../design-context/src/validation.js';
import { selectCapabilities, validateRegistry } from '../../registry/src/index.js';
import type { Registry } from '../../registry/src/index.js';
import type { Plan, Risk } from '../../contracts/src/index.js';

interface RoutingRule { id: string; all: string[]; none: string[]; capabilities: string[] }
interface Routing { version: 1; signals: Record<string, string>; rules: RoutingRule[] }
export interface RouteOptions {
  mode?: Plan['mode']; risk?: Risk; availableTools?: string[];
  maxSteps: number; maxMinutes: number; maxRefinements: number; contextRevision: number; framework?: string; platform?: string;
}

const modeForRisk: Record<Risk, Plan['mode']> = { low: 'quick', medium: 'standard', high: 'full' };
const standaloneQA = ['performance', 'browser.testing', 'frontend.review'];

function loadRouting(): Routing {
  const routing = validate<Routing>('routing.schema.json', JSON.parse(readFileSync(resolve(kitRoot(), 'registry/routing.json'), 'utf8')));
  if (new Set(routing.rules.map(rule => rule.id)).size !== routing.rules.length) throw new Error('Duplicate routing rule IDs');
  for (const rule of routing.rules) for (const signal of [...rule.all, ...rule.none]) if (!(signal in routing.signals)) throw new Error(`Routing rule ${rule.id} uses unknown signal ${signal}`);
  return routing;
}

export function planWorkflow(request: string, options: RouteOptions, extensionRegistry?: Registry): Plan {
  if (!request.trim()) throw new Error('A non-empty user request is required');
  if (!Number.isInteger(options.maxSteps) || options.maxSteps < 1 || options.maxSteps > 100 || !Number.isInteger(options.contextRevision) || options.contextRevision < 0) throw new Error('Invalid step budget or context revision');
  const risk = options.risk ?? 'medium';
  if (!(risk in modeForRisk)) throw new Error('Risk must be low, medium or high');
  const mode = options.mode ?? modeForRisk[risk];

  const text = request.toLocaleLowerCase();
  const routing = loadRouting();
  // Whole-word match so "form" does not fire on "performance" or "information".
  const matched = new Set(Object.entries(routing.signals).filter(([, terms]) => new RegExp(`(?<!\\p{L})(?:${terms})(?!\\p{L})`, 'u').test(text)).map(([signal]) => signal));
  const rule = routing.rules.find(candidate => candidate.all.every(signal => matched.has(signal)) && !candidate.none.some(signal => matched.has(signal)));
  if (!rule) throw new Error('No routing rule matches the request');

  let requested = rule.capabilities.map(capability => ({ capability, reason: `Rule ${rule.id} requests ${capability}` }));
  const trimmed = new Set<string>();
  // Quick mode trims supporting steps but keeps responsive design when it owns the request.
  if (mode === 'quick') requested = requested.filter(({ capability }, index) => {
    const keep = capability !== 'ux.research' && (capability !== 'responsive.design' || index === 0);
    if (!keep) trimmed.add(capability);
    return keep;
  });
  const addForFullMode = (capability: string): void => { if (!requested.some(entry => entry.capability === capability)) requested.push({ capability, reason: `Full mode adds ${capability}` }); };
  if (mode === 'full') {
    if (!matched.has('component')) addForFullMode('accessibility');
    const only = requested.length === 1 ? requested[0]?.capability : undefined;
    if (!only || !standaloneQA.includes(only)) for (const capability of ['frontend.review', 'browser.testing', 'performance']) addForFullMode(capability);
  }

  const registry = extensionRegistry ?? validateRegistry(JSON.parse(readFileSync(resolve(kitRoot(), 'registry/skills.json'), 'utf8')));
  const resolution = selectCapabilities(registry, requested.map(entry => entry.capability), { ...(options.framework ? { framework: options.framework } : {}), ...(options.platform ? { platform: options.platform } : {}) });
  const selected: { skill: string; reason: string }[] = []; const added = new Set<string>();
  function add(id: string, reason: string): void {
    if (added.has(id)) return;
    const entry = resolution.skills.find(candidate => candidate.id === id);
    if (!entry) throw new Error(`Unresolved registry skill: ${id}`);
    for (const dependency of entry.dependencies) add(dependency, `Dependency of ${entry.name}`);
    added.add(id); selected.push({ skill: entry.name, reason });
  }
  for (const { capability, reason } of requested) { const owner = resolution.owners[capability]; if (owner) add(owner, reason); }

  if (selected.length > options.maxSteps) throw new Error(`Workflow needs ${selected.length} steps; budget permits ${options.maxSteps}. Narrow the task or increase the budget.`);
  if (!Number.isInteger(options.maxMinutes) || options.maxMinutes < 1 || options.maxMinutes > 1440 || !Number.isInteger(options.maxRefinements) || options.maxRefinements < 0 || options.maxRefinements > 10) throw new Error('Invalid execution budget');

  const excluded = registry.skills.filter(skill => !added.has(skill.id)).map(skill => ({
    skill: skill.name,
    reason: skill.capabilities.some(capability => trimmed.has(capability)) ? 'Quick mode trims supporting steps' : `Rule ${rule.id} does not request ${skill.capabilities.join(', ')}`
  }));
  const available = options.availableTools;
  const missingTools = available ? resolution.skills.filter(skill => added.has(skill.id)).flatMap(skill => skill.requiredTools.filter(tool => !available.includes(tool)).map(tool => ({ skill: skill.name, tool }))) : [];
  const skills = selected.map(entry => entry.skill);
  return { version: 1, id: randomUUID(), request, mode, contextVersion: '2.0', contextRevision: options.contextRevision, createdAt: new Date().toISOString(),
    budget: { maxSteps: options.maxSteps, maxMinutes: options.maxMinutes, maxRefinements: mode === 'quick' ? 0 : options.maxRefinements },
    steps: skills.map((skill, index) => ({ skill, dependsOn: index > 0 ? skills.slice(index - 1, index) : [], status: 'pending', attempts: 0, evidence: [] })),
    approvalRequired: matched.has('high-impact'), approvedBy: null,
    routing: { rule: rule.id, risk, selected, excluded, missingTools } };
}
