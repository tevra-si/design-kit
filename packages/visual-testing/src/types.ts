import type { Check, Viewport } from '../../contracts/src/index.js';
export interface CaptureEntry {
  id: string; route: string; state: string; viewport: Viewport; file: string; imageHash: string; masks: string[];
  overflow: string[]; smallTargets: string[]; axeViolations: { id: string; impact: string; targets: string[]; help: string }[];
  incompleteRules: string[]; pageErrors: string[]; consoleErrors?: string[]; networkErrors?: string[]; assertions?: number;
}
export interface CaptureManifest {
  version: 1; kind: 'baseline' | 'current'; runId: string; createdAt: string; configHash: string; contextRevision: number;
  browserVersion: string; entries: CaptureEntry[];
}
export interface Comparison { id: string; ratio: number; differentPixels: number; sizeMismatch: boolean; diff: string; passed: boolean }
export interface ComparisonResult { version: 1; createdAt: string; settingsHash: string; currentManifestHash: string; comparisons: Comparison[]; checks: Check[] }
