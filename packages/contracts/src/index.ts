export const skillNames = ['design-research', 'design-direction', 'design-system', 'ui-builder', 'ui-redesign', 'responsive-design', 'interaction-motion', 'visual-review', 'accessibility-qa', 'performance-qa', 'browser-testing', 'frontend-review', 'frontend-debugging'] as const;
export type SkillName = string;
export type CriterionStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED' | 'NOT_APPLICABLE';
// An acceptance criterion carries its stable ID as a prefix: "AC-001: text".
export function criterionId(criterion: string): string | null { return /^(AC-\d{3,}): \S/u.exec(criterion)?.[1] ?? null; }
export function criterionIds(acceptance: string[], requireAll: boolean): string[] {
  const ids = acceptance.map(criterionId).filter(id => id !== null);
  if (requireAll && ids.length !== acceptance.length) throw new Error('Each acceptance criterion needs a stable ID such as "AC-001: text"');
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate acceptance criterion ID');
  return ids;
}
export type Risk = 'low' | 'medium' | 'high';
export type EvidenceKind = 'deterministic' | 'heuristic' | 'ai' | 'human';
export type Status = 'pending' | 'running' | 'awaiting-approval' | 'passed' | 'failed' | 'blocked' | 'skipped';
export interface Evidence { source: string; claim: string; confidence: 'observed' | 'reported' | 'inferred' | 'unknown' }
export interface Decision { id: string; description: string; approved: boolean; owner: string }
export type TokenMap = Record<string, string>;
export interface DesignContext {
  version: '2.0'; revision: number; owner: string;
  project: { name: string; framework: string; styling: string };
  design: { variance: number; motionIntensity: number; visualDensity: number; theme: 'light' | 'dark' | 'system'; brandPersonality: string[] };
  tokens: { primitive: TokenMap; semantic: TokenMap; component: TokenMap; themes: Record<string, TokenMap>; responsive: TokenMap };
  constraints: { preserveBrand: boolean; preserveFunctionality: boolean; accessibilityTarget: 'WCAG_2_2_AA'; approvedScope: string[] };
  decisions: Decision[]; assumptions: string[]; evidence: Evidence[];
  brand?: { name: string; assets: string[]; rules: string[] };
  approvedDirection?: Decision; responsiveRequirements?: string[];
  knownRegressions?: { id: string; description: string; evidence: string[]; status: 'open' | 'resolved' }[];
  provenance?: { sourceId: string; revision: string; artifact: string }[];
}
export interface Viewport { name: string; width: number; height: number }
export interface Action { type: 'click' | 'fill' | 'press' | 'check' | 'expect-visible' | 'expect-hidden' | 'expect-text' | 'expect-checked'; selector: string; value?: string }
export interface ScreenState { name: string; actions: Action[]; masks: string[]; waitFor?: string }
export interface VisualRoute { name: string; path: string; baselinePath?: string; states: ScreenState[] }
export const categories = ['hierarchy', 'typography', 'layout', 'consistency', 'responsive', 'accessibility', 'interaction', 'functional', 'performance'] as const;
export type Category = typeof categories[number];
export interface Config {
  version: 1; baseURL: string; baselineURL?: string; permittedOrigins: string[]; viewports: Viewport[]; routes: VisualRoute[];
  browser: { channel?: string; executablePath?: string }; timeoutMs: number;
  colorScheme?: 'light' | 'dark' | 'no-preference'; reducedMotion?: 'reduce' | 'no-preference';
  readySelector?: string;
  thresholds: { diffRatio: number; pixelSensitivity: number; minScore: number };
  weights: Record<Exclude<Category, 'functional'>, number> & { functional?: number }; requiredChecks: string[]; maxRefinements: number;
}
// A baseline may live at another URL or path, so two deployed versions can be compared route by route.
export function captureURL(config: Config, route: VisualRoute, kind: 'baseline' | 'current'): string {
  return kind === 'baseline' ? new URL(route.baselinePath ?? route.path, config.baselineURL ?? config.baseURL).href : new URL(route.path, config.baseURL).href;
}
export interface Check {
  id: string; category: Category; kind: EvidenceKind; status: 'passed' | 'failed' | 'unverified';
  severity: 'critical' | 'major' | 'minor'; score?: number; evidence: string[]; issue: string; component: string; correction: string; criteria?: string[];
}
export interface QualityReport {
  version: 1; createdAt: string; status: 'PASS' | 'FAIL'; score: number | null;
  blockers: string[]; missing: string[]; checks: Check[];
  limits: string[]; contextRevision: number;
  criteria?: { id: string; text: string; status: CriterionStatus; checks: string[]; approvedBy?: string }[];
}
export interface Handoff {
  version: 1; taskId: string; objective: string; skill: SkillName; contextVersion: '2.0'; contextRevision: number;
  owner: string; files: string[]; inputs: string[]; constraints: string[]; outputs: string[];
  acceptance: string[]; evidence: string[]; status: Status; error: { code: string; message: string } | null;
}
export interface Plan {
  version: 1; id: string; request: string; mode: 'quick' | 'standard' | 'full'; contextVersion: '2.0'; contextRevision: number;
  createdAt: string; budget: { maxSteps: number; maxMinutes: number; maxRefinements: number };
  steps: { skill: SkillName; dependsOn: SkillName[]; status: Status; attempts: number; evidence: string[] }[];
  approvalRequired: boolean; approvedBy: string | null; acceptance?: string[];
  routing?: { rule: string; risk: Risk; riskReason?: string; selected: { skill: SkillName; reason: string }[]; excluded: { skill: SkillName; reason: string }[]; missingTools: { skill: SkillName; tool: string }[] };
}
