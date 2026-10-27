# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## What this repo is

Tevra Design Kit: twelve portable Agent Skills (`skills/*/SKILL.md`) plus a local TypeScript CLI (`tevra-design`) that plans work and records evidence. The CLI never drives an agent or a vision model; the agent reads a skill and does the work. The repo is also a Claude Code plugin and marketplace (`.claude-plugin/`), so skills install as `tevra:<skill>`. Read `AGENTS.md` for repository rules shared with other agents.

## Commands

Package manager is pnpm (Node `^22.22.2 || ^24.15.0 || >=26`). ESM, TypeScript strict.

```sh
pnpm install
pnpm build                 # tsc -> dist/ (CLI bin is dist/packages/cli/src/index.js)
pnpm typecheck
pnpm test                  # unit + integration via tsx, no build needed
pnpm test:structure        # axe on built example HTML (build examples first)
pnpm test:examples         # acceptance-app model tests
pnpm test:legacy           # Python unittest for scripts/validate_context.py
pnpm test:e2e              # builds first; launches Chromium and local servers
pnpm skills:check          # CLI validation of skills
claude plugin validate .   # plugin + marketplace manifests

# single test file
node --import tsx --test tests/unit/router.test.ts
```

Examples are workspace packages: `pnpm --filter @tevra/example-nextjs build`, `@tevra/example-sveltekit`, `@tevra/acceptance-app`.

If browser launch or local servers are blocked in your environment, report E2E as unverified rather than passing. Static-HTML axe checks do not replace it.

## Architecture

pnpm workspaces under `packages/*` and `examples/*`. Dependencies point one way: `cli` → feature engines (`workflow-engine` → `core` → `registry`, plus `visual-testing`, `quality-engine`, `performance-qa`, `design-memory`) → `design-context` → `contracts` + `filesystem`. Runtime and type imports both follow it; no engine imports the CLI. See `docs/architecture.md` before adding cross-package imports.

- `filesystem` is the only write path: project-root boundary, symlink rejection, atomic writes, locks, redaction. Route new writes through it.
- `design-context`: versioned JSON Schema (Ajv) validation, explicit non-destructive migration to context format 2.0, revisions. Legacy schemas under `schemas/legacy/` are kept for migration. The context `version: '2.0'` is a data format, not the product version; do not change it.
- `registry` owns skill metadata and deterministic capability ownership; `core/router.ts` maps requests to capabilities.
- `quality-engine`: a failed required check or critical blocker prevents delivery regardless of score.
- `performance-qa`: runs Lighthouse as a subprocess. `lighthouse` is an optional peer dependency (and a devDependency here) resolved only from Tevra's own install location; keep it out of `dependencies`.
- `visual-testing`: Playwright capture, axe, overflow/touch-target heuristics, PNG diff. Baselines are approved explicitly and never overwritten by comparison.

Boundaries that shape changes:
- External JSON/YAML is validated with schemas in `schemas/`; internal code uses TS types.
- Runtime state lives in the target project's `.tevra/` (never commit it or send it off-machine). Missing browser tooling is an error, never a simulated PASS.
- Browser interactions use a closed action vocabulary; no shell snippets in config.

## Skills layout

- `skills/` is the source of truth; keep `registry/skills.json` names and descriptions in sync. Install targets per agent are `agentDirectories` in `packages/core/src/install.ts`; each has a note under `adapters/`. Local installs under `.claude/` and `.cursor/` are gitignored; refresh with `tevra-design skills install`.
- Each skill folder is self-contained with its own references. Shared material lives in `references/`, `schemas/`, `templates/`, `rubrics/`.
- Product version (currently 1.0.1) appears in `package.json`, `packages/*/package.json`, `examples/*/package.json`, `.claude-plugin/plugin.json`, `registry/skills.json` and skill frontmatter; bump them together and update `CHANGELOG.md`.

## Conventions

- `tsconfig` is `NodeNext` with `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`: use `import type` and `.js` extensions in relative imports.
- Tests are `node:test` in `tests/{unit,integration,structure,e2e,examples}`; Python tests are `tests/test_*.py`.
- Write all repository content (docs, README, skills, comments, commit messages) in English. Vietnamese keywords in `packages/core/src/router.ts` and `references/ux-patterns/catalog.json` are intentional: they match Vietnamese user requests.
- Do not commit internal material: progress notes, verification logs, audits, `.tevra/`, machine paths or personal data. Docs describe the product, not the development process.
- Tevra content is MIT; borrowed concepts/records carry notices in `PROVENANCE.md` and `THIRD_PARTY_NOTICES.md`. Don't add third-party fonts, images or large datasets. Original images in `docs/assets/` and `.claude-plugin/icon.png` come from a real run via `pnpm demo:assets`; never hand-edit or mock them.
- `evals/` holds `claude plugin eval` cases (with/without-plugin comparison); `evals/results/` is gitignored. CI is `.github/workflows/ci.yml`.
