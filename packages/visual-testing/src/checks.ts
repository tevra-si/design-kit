import type { Check } from '../../contracts/src/index.js';
import type { CaptureManifest } from './types.js';

export function captureChecks(manifest: CaptureManifest): Check[] {
  const evidence = [`.tevra/artifacts/${manifest.kind}/manifest.json`];
  const violations = manifest.entries.flatMap(entry => entry.axeViolations.map(violation => `${entry.id}: ${violation.id} (${violation.impact})`));
  const overflow = manifest.entries.flatMap(entry => entry.overflow.map(selector => `${entry.id}: ${selector}`));
  const errors = manifest.entries.flatMap(entry => entry.pageErrors.map(error => `${entry.id}: ${error}`));
  const consoleErrors = manifest.entries.flatMap(entry => (entry.consoleErrors ?? []).map(error => `${entry.id}: ${error}`));
  const networkErrors = manifest.entries.flatMap(entry => (entry.networkErrors ?? []).map(error => `${entry.id}: ${error}`));
  const smallTargets = manifest.entries.flatMap(entry => entry.smallTargets.map(selector => `${entry.id}: ${selector}`));
  const check = (id: string, category: Check['category'], kind: Check['kind'], issues: string[], severity: Check['severity'], correction: string): Check => ({ id, category, kind, status: issues.length ? 'failed' : 'passed', severity, evidence, issue: issues.length ? issues.join('; ') : `No ${id} findings in captured states.`, component: 'configured viewport/state matrix', correction });
  return [
    { id: 'functional-tests', category: 'functional', kind: 'deterministic', status: manifest.entries.every(entry => (entry.assertions ?? 0) > 0) ? 'passed' : 'unverified', severity: 'critical', evidence, issue: 'Only explicitly configured assertions establish behavior coverage.', component: 'configured browser flows', correction: 'Add relevant expect-visible/text/hidden/checked actions to every configured state.' },
    check('console-errors', 'functional', 'deterministic', consoleErrors, 'critical', 'Resolve unexpected console errors.'),
    check('network-errors', 'functional', 'deterministic', networkErrors, 'major', 'Inspect failed or blocked network requests.'),
    check('axe', 'accessibility', 'deterministic', violations, 'critical', 'Resolve axe barriers and perform manual keyboard/screen-reader checks.'), check('overflow', 'responsive', 'heuristic', overflow, 'major', 'Inspect clipping and unintended horizontal overflow.'), check('runtime-errors', 'functional', 'deterministic', errors, 'critical', 'Fix browser runtime errors before delivery.'), check('touch-targets', 'accessibility', 'heuristic', smallTargets, 'minor', 'Inspect 24px target-size or spacing exceptions; increase targets where needed.')];
}
