# Expanded v2 progress checklist

Workspace: the repository root. Canonical skills live directly under `skills/`. No nested kit or new ZIP is required.

## Milestones

- [x] Inspect existing repository, preserve v1 validators and existing TypeScript functionality.
- [x] Inspect all five upstream repositories; record verified license scopes and exact access limitations in source/license audits.
- [ ] Complete immutable-revision content and recursive file-level license review. Four candidate SHA contents could not be fetched; Vercel complete license notice remains unresolved. No new upstream source/assets vendored.
- [x] Registry schemas, twelve entries, discovery/inspect/validate/graph commands and extension-file loading.
- [x] Deterministic capability ownership, duplicate candidates, priority selection, explicit overrides, dependency expansion/cycle checks and conflict rejection.
- [x] Twelve concise skills with references, contracts, error/validation requirements and provenance.
- [x] Context optional brand/direction/responsive/regression/provenance fields; approved-decision protection; existing migration/memory preserved; CLI show/validate/list aliases.
- [x] Registry-driven workflow planning, bounded execution/retries, status/evidence recording, approval and stale-context gates. Internal QA adapters execute real tooling; missing coding-agent adapters report blocked.
- [x] Browser assertion configuration, console/network/HTTP error collection, existing screenshot/baseline/masking/diff engine.
- [x] Lighthouse subprocess integration, validated LCP/CLS/TBT metrics, configurable budgets, explicit network authorization, redacted JSON/HTML and failure attempts.
- [x] JSON/Markdown/HTML quality reports, functional category/new default weights and legacy-config compatibility.
- [x] Real runnable Next.js/SvelteKit apps plus analytics/pricing/form acceptance app; model tests and browser flow tests.
- [ ] Execute real screenshot, axe, visual regression and performance acceptance runs. Current sandbox rejects localhost bind and Chromium launch; failed attempts are preserved.
- [ ] Complete screenshot-to-code acceptance scenario from a real supplied PNG and validate rendered comparison.
- [x] Temp-project installation tests cover Codex, Claude Code and Cursor; local `.claude`/`.cursor` canonical copies synchronized safely.
- [ ] Verify host agent activation for root `.agents`; workspace protection prevents installing there. Do not bypass protected directories.
- [x] Current unit/integration, examples, structural axe, legacy validators, typecheck and framework builds executed; see verification-v2.md for results.
- [ ] Complete live dependency vulnerability audit; installed manifest inventory is available, but metadata licenses do not constitute full legal clearance.

## Continuation order

1. Read `docs/verification-v2.md`, `docs/architecture/v2-implementation.md` and `docs/research/upstream-audit.md`.
2. In an environment allowing loopback/browser processes, run `pnpm test:e2e`; fix genuine behavior failures before changing accepted baselines.
3. Run the acceptance app server and CLI browser/accessibility/visual/performance commands listed in its README. Save real screenshots, diffs, Lighthouse outputs and final quality reports.
4. Supply an actual reference PNG for scenario C, record visible observations/assumptions and implement/compare it; do not call existing HTML a screenshot-derived result.
5. Fetch pinned upstream checkouts, inspect relevant file/asset licenses, preserve notices and update source statuses only with evidence.
6. Run current dependency audit and native agent discovery in a permitted environment. Preserve local skill conflicts; do not overwrite protected root `.agents`.
7. Re-run all tests, regenerate installed-runtime license inventory and update verification results before declaring completion.

The implementation remains usable independently. Environment-blocked acceptance checks and incomplete source review are release blockers, not passing tests.
