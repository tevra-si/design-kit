import type { QualityReport } from '../../contracts/src/index.js';
import { redact } from '../../filesystem/src/index.js';

function escape(value: string): string {
  return redact(value).replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}
function artifact(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:|^[\\/]|[?#\u0000-\u001f]/iu.test(path) || path.split(/[\\/]/u).some(part => part === '..' || part === '.' || !part)) return escape(path);
  const href = `../../${path.split('/').map(encodeURIComponent).join('/')}`;
  return `<a href="${escape(href)}">${escape(path)}</a>${/\.png$/iu.test(path) ? `<br><img src="${escape(href)}" alt="Screenshot evidence" loading="lazy">` : ''}`;
}
export function htmlReport(report: QualityReport): string {
  const rows = report.checks.map(check => `<tr><th scope="row">${escape(check.id)}</th><td>${escape(check.kind)}</td><td>${escape(check.status)}</td><td>${escape(check.severity)}</td><td>${escape(check.component)}</td><td>${escape(check.issue)}</td><td>${check.evidence.map(artifact).join('<br>')}</td><td>${escape(check.correction)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'"><title>Tevra quality report</title><style>body{font:16px/1.5 system-ui;margin:2rem;color:#18251f;background:#fff}table{border-collapse:collapse;width:100%}th,td{padding:.5rem;border:1px solid #bbb;text-align:left;vertical-align:top}img{max-width:24rem;max-height:20rem}section{overflow:auto}a{color:#165b42}</style><body><main><h1>Tevra quality report</h1><p>Status: <strong>${escape(report.status)}</strong>. Context revision: ${report.contextRevision}.</p><p>Score: ${report.score === null ? 'unscored / incomplete evidence' : `${report.score}/100 (evidence-labeled judgment)`}</p><p>Blockers: ${escape(report.blockers.join(', ') || 'none')}</p><p>Missing evidence: ${escape(report.missing.join(', ') || 'none')}</p><section aria-label="Quality findings"><table><thead><tr>${['Check', 'Evidence kind', 'Status', 'Severity', 'Component', 'Issue', 'Evidence', 'Correction'].map(title => `<th scope="col">${title}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></section><h2>Verification limits</h2><ul>${report.limits.map(limit => `<li>${escape(limit)}</li>`).join('')}</ul></main></body></html>`;
}
