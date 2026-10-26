import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { kitRoot } from '../../filesystem/src/resources.js';
import { selectCapabilities, validateRegistry } from '../../registry/src/index.js';
import type { Registry } from '../../registry/src/index.js';
import { randomUUID } from 'node:crypto';
import type { Plan, SkillName } from '../../contracts/src/index.js';

export interface RouteOptions { mode: Plan['mode']; maxSteps: number; maxMinutes: number; maxRefinements: number; contextRevision: number; framework?: string; platform?: string }
export function planWorkflow(request: string, options: RouteOptions, extensionRegistry?: Registry): Plan {
  if (!request.trim()) throw new Error('A non-empty user request is required');
  if (!Number.isInteger(options.maxSteps) || options.maxSteps < 1 || options.maxSteps > 100 || !Number.isInteger(options.contextRevision) || options.contextRevision < 0) throw new Error('Invalid step budget or context revision');
  const text = request.toLocaleLowerCase();
  // Whole-word match so "form" does not fire on "performance" or "information".
  const has = (terms: string): boolean => new RegExp(`(?<!\\p{L})(?:${terms})(?!\\p{L})`, 'u').test(text);
  const screenshot = has('screenshots?|ảnh chụp|reference images?');
  const redesign = has('redesign|improve|fix|restyle|cải thiện|thiết kế lại|sửa');
  const component = has('cards?|buttons?|headers?|navigation|forms?|tables?|components?|thẻ|nút|biểu mẫu');
  let selected: SkillName[];
  if (has('performance|lighthouse|web vitals|core web vitals|hiệu năng')) selected = ['performance-qa'];
  else if (has('browser tests?|browser testing|e2e|functional regression')) selected = ['browser-testing'];
  else if (has('source review|code review|frontend review')) selected = ['frontend-review'];
  else if (has('accessib\\p{L}*|wcag|a11y|truy cập') && !redesign) selected = ['accessibility-qa'];
  else if (has('motion|animations?|micro.interactions?|chuyển động')) selected = ['interaction-motion', 'ui-builder', 'visual-review', 'accessibility-qa'];
  else if (has('responsive|overflow|mobile layout|di động')) selected = ['responsive-design', 'ui-builder', 'visual-review', 'accessibility-qa'];
  else if (has('tokens?|design system|hệ thống thiết kế')) selected = ['design-research', 'design-direction', 'design-system'];
  else if (screenshot) selected = ['design-direction', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa'];
  else if (redesign && component) selected = ['ui-redesign', 'ui-builder', 'visual-review'];
  else if (redesign) selected = ['ui-redesign', 'design-direction', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa'];
  else if (has('review|compare|audit|kiểm tra')) selected = ['visual-review', 'accessibility-qa'];
  else selected = ['design-research', 'design-direction', 'design-system', 'ui-builder', 'responsive-design', 'visual-review', 'accessibility-qa'];
  // Quick mode trims supporting steps but keeps responsive-design when it owns the request.
  if (options.mode === 'quick') selected = selected.filter((skill, index) => skill !== 'design-research' && (skill !== 'responsive-design' || index === 0));
  if (options.mode === 'full' && !component && !selected.includes('accessibility-qa')) selected.push('accessibility-qa');
  if (options.mode === 'full' && !['performance-qa', 'browser-testing', 'frontend-review'].some(name => selected.length === 1 && selected.includes(name))) {
    for (const name of ['frontend-review', 'browser-testing', 'performance-qa']) if (!selected.includes(name)) selected.push(name);
  }
  const registry = extensionRegistry ?? validateRegistry(JSON.parse(readFileSync(resolve(kitRoot(), 'registry/skills.json'), 'utf8')));
  const builtinCapabilities: Record<string, string> = {
    'design-research': 'ux.research', 'design-direction': 'visual.direction', 'design-system': 'design.tokens',
    'ui-builder': 'frontend.implementation', 'ui-redesign': 'ui.redesign', 'responsive-design': 'responsive.design',
    'interaction-motion': 'interaction.motion', 'visual-review': 'visual.regression', 'accessibility-qa': 'accessibility',
    'performance-qa': 'performance', 'browser-testing': 'browser.testing', 'frontend-review': 'frontend.review'
  };
  const requested = selected.map(name => { const capability = builtinCapabilities[name]; if (!capability) throw new Error(`Unknown capability for ${name}`); return capability; });
  const resolution = selectCapabilities(registry, requested, { ...(options.framework ? { framework: options.framework } : {}), ...(options.platform ? { platform: options.platform } : {}) });
  const ordered: string[] = []; const added = new Set<string>();
  function add(id: string): void {
    if (added.has(id)) return;
    const entry = resolution.skills.find(candidate => candidate.id === id);
    if (!entry) throw new Error(`Unresolved registry skill: ${id}`);
    for (const dependency of entry.dependencies) add(dependency);
    added.add(id); ordered.push(entry.name);
  }
  for (const capability of requested) { const owner = resolution.owners[capability]; if (owner) add(owner); }
  selected = ordered;
  if (selected.length > options.maxSteps) throw new Error(`Workflow needs ${selected.length} steps; budget permits ${options.maxSteps}. Narrow the task or increase the budget.`);
  if (!Number.isInteger(options.maxMinutes) || options.maxMinutes < 1 || options.maxMinutes > 1440 || !Number.isInteger(options.maxRefinements) || options.maxRefinements < 0 || options.maxRefinements > 10) throw new Error('Invalid execution budget');
  return { version: 1, id: randomUUID(), request, mode: options.mode, contextVersion: '2.0', contextRevision: options.contextRevision, createdAt: new Date().toISOString(),
    budget: { maxSteps: options.maxSteps, maxMinutes: options.maxMinutes, maxRefinements: options.mode === 'quick' ? 0 : options.maxRefinements },
    steps: selected.map((skill, index) => ({ skill, dependsOn: index > 0 ? selected.slice(index - 1, index) : [], status: 'pending', attempts: 0, evidence: [] })),
    approvalRequired: /transformative|shared tokens|brand migration|đổi thương hiệu/u.test(text), approvedBy: null };
}
