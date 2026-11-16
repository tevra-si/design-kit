import { categories, criterionIds } from '../../contracts/src/index.js';
import type { Check, Config, QualityReport } from '../../contracts/src/index.js';
import { validate } from '../../design-context/src/validation.js';
import { redact } from '../../filesystem/src/index.js';

export interface CriteriaTrace { acceptance: string[]; notApplicable?: string[] }
function traceCriteria(checks: Check[], trace: CriteriaTrace): NonNullable<QualityReport['criteria']> {
  const ids = criterionIds(trace.acceptance, true);
  const notApplicable = trace.notApplicable ?? [];
  for (const id of [...notApplicable, ...checks.flatMap(check => check.criteria ?? [])]) if (!ids.includes(id)) throw new Error(`Unknown acceptance criterion: ${id}`);
  return trace.acceptance.map((text, index) => {
    const id = ids[index] ?? '';
    const covering = checks.filter(check => check.criteria?.includes(id));
    const status = notApplicable.includes(id) ? 'NOT_APPLICABLE'
      : !covering.length ? 'SKIPPED'
      : covering.some(check => check.status === 'failed') ? 'FAIL'
      : covering.some(check => check.status === 'unverified') ? 'BLOCKED' : 'PASS';
    return { id, text, status, checks: covering.map(check => check.id) };
  });
}
export function evaluateQuality(input: unknown, config: Config, contextRevision: number, trace?: CriteriaTrace): QualityReport {
  const checks = validate<Check[]>('checks.schema.json', input);
  if (new Set(checks.map(check => check.id)).size !== checks.length) throw new Error('Quality check IDs must be unique');
  for (const check of checks) if (check.status !== 'unverified' && !check.evidence.length) throw new Error(`Executed check requires evidence: ${check.id}`);
  for (const check of checks) if (check.score !== undefined && check.score < 3 && (!check.issue.trim() || !check.correction.trim())) throw new Error(`Low score requires a finding and correction: ${check.id}`);
  const blockers = checks.filter(check => check.status === 'failed' && (check.severity === 'critical' || config.requiredChecks.includes(check.id))).map(check => check.id);
  const missing = config.requiredChecks.filter(id => !checks.some(check => check.id === id && check.status === 'passed'));
  let weighted = 0; let complete = true;
  for (const category of categories) {
    const weight = config.weights[category] ?? 0;
    if (weight === 0) continue;
    const scored = checks.filter(check => check.category === category && check.score !== undefined && check.status !== 'unverified');
    if (!scored.length) { complete = false; if (config.thresholds.minScore > 0) missing.push(`score:${category}`); continue; }
    weighted += Math.min(...scored.map(check => check.score ?? 0)) / 4 * weight;
  }
  const score = complete ? Math.round(weighted * 100) / 100 : null;
  if (score !== null && score < config.thresholds.minScore) blockers.push('weighted-score');
  const criteria = trace ? traceCriteria(checks, trace) : undefined;
  for (const criterion of criteria ?? []) {
    if (criterion.status === 'FAIL') blockers.push(`criterion:${criterion.id}`);
    else if (criterion.status === 'SKIPPED' || criterion.status === 'BLOCKED') missing.push(`criterion:${criterion.id}`);
  }
  return validate('quality-report.schema.json', {
    version: 1, createdAt: new Date().toISOString(), status: blockers.length || missing.length ? 'FAIL' : 'PASS', score,
    blockers: [...new Set(blockers)], missing: [...new Set(missing)], checks,
    limits: ['AI/human scores are subjective judgments, not objective measurements.', 'Pixel differences measure visual change, not usability.', 'Automated accessibility checks do not establish full WCAG compliance.', 'Unexecuted manual, screen-reader, native and performance checks remain unverified.'], contextRevision,
    ...(criteria ? { criteria } : {})
  });
}
function cell(value: string): string { return redact(value).replace(/([\\|\[\]()`])/gu, '\\$1').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/[\r\n]/gu, ' '); }
export function markdownReport(report: QualityReport): string {
  const rows = report.checks.map(check => `| ${cell(check.id)} | ${check.kind} | ${check.status} | ${check.severity} | ${cell(check.component)} | ${cell(check.issue)} | ${cell(check.evidence.join(', '))} | ${cell(check.correction)} |`);
  return redact(`# Tevra quality report\n\nStatus: **${report.status}** · Context revision: ${report.contextRevision}\n\nWeighted score: ${report.score === null ? 'unscored / incomplete evidence' : `${report.score}/100 (evidence-labeled judgment)`}\n\nBlockers: ${report.blockers.join(', ') || 'none'}\n\nMissing required evidence: ${report.missing.join(', ') || 'none'}\n\n| Check | Evidence kind | Status | Severity | Component | Issue | Evidence | Correction |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n${report.criteria ? `\n## Acceptance criteria\n\n| Criterion | Status | Checks |\n| --- | --- | --- |\n${report.criteria.map(criterion => `| ${cell(criterion.text)} | ${criterion.status} | ${cell(criterion.checks.join(', ') || 'none')} |`).join('\n')}\n` : ''}\n## Verification limits\n\n${report.limits.map(limit => `- ${limit}`).join('\n')}\n`);
}
