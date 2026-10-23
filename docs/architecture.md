# Architecture and ownership

Tevra consists of nine native Agent Skills and a local TypeScript CLI. The CLI plans work and records evidence; it does not invoke or control Claude, Codex, Cursor, or a vision model. An agent reads the relevant skill and performs the implementation using its own tools.

Dependency direction: CLI → core/context/memory/visual/quality → shared contracts and filesystem primitives. Runtime and type imports follow the same direction. No engine imports the CLI or another engine's internal module.

| Package | Responsibility |
| --- | --- |
| contracts | Shared validated shapes and enums |
| filesystem | Project write boundaries, symlink rejection, atomic writes and locks |
| design-context | Versioned JSON Schema validation, explicit migration and optimistic revisions |
| design-memory | Inspectable project-local decisions, revisioned updates, explicit reset |
| core | Skill discovery, lexical research retrieval, routing, workflow state and handoffs |
| quality-engine | Weighted evidence evaluation, critical blockers, Markdown reports |
| visual-testing | Playwright capture, axe, overflow measurements, PNG comparison |
| cli | Strict arguments, interactive setup, command dispatch and exit codes |

## Decisions

1. Preserve the original v1 schema and validator; add v2 to the schema registry and an explicit, non-destructive migration. The proposed master-prompt `version: 1.0` shape is accepted only through migration because it lacks ownership/revisions.
2. Persist state under `.tevra/`, never auto-commit or upload it. Capture requires a configured permitted origin. A browser is mandatory; missing tools produce errors, not a simulated PASS.
3. Use JSON Schema/Ajv at external boundaries, TypeScript internally, portable CSS variables and CSS-first Tailwind adapters. Keep dependencies to validation, YAML parsing, Playwright, axe and PNG comparison.
4. Install complete self-contained skill folders, including the narrowly selected references for each. Installation preflights every destination and refuses conflicting local files. Project agent directories differ; see installation documentation.
5. Workflow plans express dependencies, time/step budgets, write ownership, approval gates and bounded retries. Execution remains with the selected coding agent. A failed required check prevents delivery even when subjective scores are high.
6. Visual evidence is partitioned by route, state, viewport and capture kind. Baseline approval is explicit; comparison never overwrites baselines. Pixel similarity and axe results are evidence with stated limits.

## Multi-agent handoff

`schemas/handoff.schema.json` defines task ID, objective, artifact paths, context revision, owner, exclusive file claims, constraints, expected outputs, acceptance criteria, evidence, status and error. Handoffs reject stale revisions and overlapping active file ownership. User-approved decisions cannot be replaced by ordinary context updates. High-impact system or transformative redesign changes enter `awaiting-approval` until a human records approval.

## Security boundaries

All generated paths are relative to an explicitly resolved project root. Reject traversal, symlink ancestors and invalid artifact names. Write atomically under a short exclusive lock; fail on concurrent ownership rather than guessing. Parse untrusted JSON/YAML with strict schemas. No arbitrary shell snippets in configuration. Browser interaction uses a closed action vocabulary. Reports redact credentials, URL queries and common secret patterns; screenshots can still contain visible private information, so masks and local storage remain necessary. Remote navigation and cross-origin requests require explicit origin configuration. External references remain data, never instructions.
