# Architecture

Tevra is two things in one repository:

1. **Twelve Agent Skills** (`skills/<name>/SKILL.md` plus focused references). They are plain Markdown that any agent supporting the [Agent Skills format](https://agentskills.io/specification) can load. They work without the CLI.
2. **A TypeScript CLI** (`packages/*`) that plans workflows and produces verifiable evidence. It never invokes an LLM; the coding agent does the design and implementation work.

```
            ┌──────────────┐   reads    ┌──────────────────────┐
  you ────▶ │ coding agent │ ─────────▶ │ skills/*/SKILL.md    │
            └──────┬───────┘            └──────────────────────┘
                   │ runs
                   ▼
            ┌──────────────┐  writes   ┌──────────────────────────────┐
            │ tevra-design │ ────────▶ │ .tevra/  config, context,    │
            └──────────────┘           │ memory, plans, screenshots,  │
                                       │ diffs, reports               │
                                       └──────────────────────────────┘
```

## Packages

Dependencies flow one way: `cli` → feature engines (`workflow-engine` → `core` → `registry`, plus `visual-testing`, `quality-engine`, `performance-qa`, `design-memory`) → `design-context` → `contracts` and `filesystem`. No engine imports the CLI. Runtime and type-only imports follow the same direction, and cycles are not allowed.

| Package | Responsibility |
| --- | --- |
| `contracts` | Shared types and enums (skill names, plans, handoffs, checks) |
| `filesystem` | The only write path: project-root boundary, traversal and symlink rejection, atomic writes, locks, secret redaction |
| `design-context` | Versioned context schema, explicit migration, optimistic revisions, token foundation and export |
| `design-memory` | Inspectable project decisions with revisioned updates and confirmed reset |
| `registry` | Skill metadata validation, capability ownership, dependency and conflict resolution |
| `core` | Skill discovery, installation, request routing, BM25 search, workflow state and handoffs |
| `workflow-engine` | Executes the QA stages of a plan with retry budgets |
| `visual-testing` | Playwright capture, axe, runtime errors, overflow and target heuristics, PNG comparison |
| `performance-qa` | Lighthouse subprocess and budget checks |
| `quality-engine` | Weighted scoring, blockers and JSON/Markdown/HTML reports |
| `cli` | Strict argument parsing, setup and command dispatch |

## Skills and capability ownership

`registry/skills.json` describes each skill (capabilities, dependencies, conflicts, frameworks, platforms, supported agents, inputs, outputs) without loading its instructions. Each capability has exactly one owner, so two skills never do the same job in one plan:

| Capability | Owner | Evidence it produces |
| --- | --- | --- |
| UX research | design-research | Cited recommendations with confidence |
| Visual direction | design-direction | Approved rationale and design controls |
| Tokens | design-system | Schema-valid tokens and exports |
| Implementation | ui-builder | Working code, build and behavior checks |
| Redesign | ui-redesign | Invariant table and before/after evidence |
| Responsive | responsive-design | Screenshots and overflow findings |
| Motion | interaction-motion | Interaction and reduced-motion evidence |
| Visual regression | visual-review | PNG diffs and rubric findings |
| Accessibility | accessibility-qa | axe results plus manual checklist |
| Browser testing | browser-testing | Assertions, console and network errors |
| Performance | performance-qa | Lighthouse lab artifacts |
| Code review | frontend-review | File and line findings |

Selection is deterministic: filter by framework, platform and agent; use an explicit override or the highest priority (ties broken by ID); expand dependencies in topological order; reject conflicts visibly. Third parties can add skills through a registry extension file without changing core code.

## Workflow model

`workflow plan` routes a request to a skill chain and records steps, dependencies, mode, step/time/refinement budgets, the context revision and whether human approval is required. Stages move through `pending → running → passed | failed | blocked | skipped`.

- Design and implementation stages are completed by the coding agent with an evidence file.
- `workflow run` executes Tevra's own QA stages. A missing browser, app or integration produces `blocked`, never a pass.
- Failed stages retry up to the plan's refinement budget; blocked stages are not retried automatically.
- Stale context, concurrent runs, unapproved high-impact work and invalid dependency order fail before anything executes.

## Evidence and quality gates

Capture output is partitioned by route, state, viewport and capture kind, and is identified by hashes of the screenshots, manifest and settings. Comparisons and reports refuse mismatched or stale inputs. Evidence is labeled by kind (deterministic, heuristic, AI, human) and the report keeps them apart. Critical failures and missing required checks block PASS even when the weighted score is high.

## Context and multi-agent handoff

The design context (`.tevra/design-context.json`, format version 2.0) holds project identity, brand, approved direction, tokens, responsive requirements, known regressions and provenance. Older context formats migrate explicitly and non-destructively. Updates require the current revision; approved decisions are immutable.

Handoffs (`schemas/handoff.schema.json`) carry the task ID, objective, artifacts, context revision, owner, exclusive file claims, constraints, acceptance criteria, evidence, status and error. Tevra rejects stale revisions and overlapping file ownership so agents working in parallel do not overwrite each other.

## Design decisions

1. **Local first.** All state lives in the project's `.tevra/` folder. Tevra never commits, uploads or calls a model endpoint.
2. **No simulated success.** A missing browser or tool is an error, not a skipped pass.
3. **Validate at boundaries.** External JSON and YAML go through strict JSON Schemas (Ajv); internals use TypeScript types.
4. **Small dependency set.** Ajv, YAML, Playwright, axe-core, pngjs, pixelmatch and Lighthouse. Tokens export as portable CSS variables and a CSS-first Tailwind adapter.
5. **Self-contained skills.** Each skill folder ships its own narrowly chosen references and installs independently.
6. **Humans own approvals.** Baselines, transformative redesigns and shared-system changes need an explicit recorded decision.
