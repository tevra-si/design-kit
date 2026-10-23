# Capability ownership and registry resolution

Registry schema version 1 is independent of skill version 2.0.0. `registry/skills.json` is metadata-only; selecting a skill does not load its SKILL.md or references. `registry/capability-ownership.json` documents stages and supporting guidance. `packages/registry` validates metadata, IDs/names, missing references, dependency cycles and safe entrypoint names.

| Capability | Primary skill | Supporting guidance | Evidence |
| --- | --- | --- | --- |
| UX research | design-research | local BM25 catalog | cited recommendations |
| Visual direction | design-direction | research | approved rationale |
| Tokens | design-system | existing project system | schema/export checks |
| Component architecture | frontend-review | ui-builder | file/line findings |
| Implementation | ui-builder | frontend-review | build and behavior |
| Redesign | ui-redesign | preserved invariants | before/after |
| Responsive | responsive-design | browser profiles | overflow/screenshots |
| Motion | interaction-motion | reduced-motion rules | interaction evidence |
| Browser testing | browser-testing | Playwright | assertions/errors |
| Accessibility | accessibility-qa | automated/manual guidance | axe + manual checklist |
| Performance | performance-qa | measurement references | Lighthouse lab artifacts |
| Visual regression | visual-review | Playwright/pixelmatch | PNG diffs |
| SEO | unassigned | manual review only | no automatic coverage claimed |

## Deterministic selection

Filter candidates by supplied framework/platform/agent. For each requested capability, use an explicit compatible override or highest priority, resolving ties by stable skill ID. Return duplicate candidates for inspection. Expand dependencies in topological order and execute each skill once. Reject incompatible dependencies and selected conflicts (including one-sided declarations). Priority never silently suppresses a required dependency or conflict. Overrides cannot select absent/incompatible skills.

Third parties supply a schema-valid registry via `skills ... --registry project-relative.json`; core changes are unnecessary. Extension files are metadata, never executable plugins. Registry selection is reusable independently; workflow integration is tracked separately in PROGRESS.md. Extension installation and arbitrary executable hooks are not implied by registry support.
