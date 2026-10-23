# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## What this repo is

Tevra Design Kit: nine portable Agent Skills (`skills/*/SKILL.md`) plus a local TypeScript CLI (`tevra-design`) that plans work and records evidence. The CLI never drives an agent or a vision model; the agent reads a skill and does the work. Read `AGENTS.md` too: it defines which skill to use per design phase, and says to follow the active project's design system over Tevra examples.

## Commands

Package manager is pnpm (Node `^22.22.2 || ^24.15.0 || >=26`). ESM, TypeScript strict.

```sh
pnpm install
pnpm build                 # tsc -> dist/ (CLI bin is dist/packages/cli/src/index.js)
pnpm typecheck
pnpm test                  # unit + integration via tsx, no build needed
pnpm test:structure        # skill/repo structure checks
pnpm test:legacy           # Python unittest for scripts/validate_context.py and installer
pnpm test:e2e              # builds first; needs Chromium + local server
pnpm skills:check          # CLI validation of skills
pnpm tevra-design help     # run the built CLI

# single test file
node --import tsx --test tests/unit/router.test.ts
```

Examples are workspace packages: `pnpm --filter @tevra/example-nextjs build`, `pnpm --filter @tevra/example-sveltekit check`.

E2E browser tests (and screenshot/axe verification) fail in sandboxed environments that block local servers or Chromium; say so rather than reporting them as passing. Static-HTML axe checks do not replace them.

## Architecture

pnpm workspaces under `packages/*` and `examples/*`. Dependency direction is strictly **cli → core / design-context / design-memory / visual-testing / quality-engine → contracts + filesystem**; runtime and type imports both follow it, and no engine imports the CLI or another engine's internals. See `docs/architecture.md` before adding cross-package imports.

- `contracts`: shared validated shapes/enums.
- `filesystem`: the only write path: project-root boundary, symlink rejection, atomic writes, locks. Route new writes through it.
- `design-context`: versioned JSON Schema (Ajv) validation, explicit non-destructive migration (v1 shapes → v2), revisions. Original v1 schema/validator are preserved; v2 is added alongside.
- `design-memory`: project-local decisions with revisioned updates and explicit reset.
- `core`: skill discovery, BM25 research retrieval, intent routing, workflow state, handoffs.
- `quality-engine`: weighted evidence scoring; a failed required check or critical blocker prevents delivery regardless of subjective score.
- `visual-testing`: Playwright capture, axe, overflow/touch-target heuristics, PNG diff. Baselines are approved explicitly and never overwritten by comparison.
- `cli`: strict arg parsing, interactive `init`, dispatch, exit codes.

Boundaries that shape changes:
- External JSON/YAML is validated with schemas in `schemas/` at the boundary; internal code uses TS types.
- Runtime state lives in `.tevra/` (never auto-commit it, screenshots, or send it off-machine). Browser capture requires an explicitly configured origin; missing browser tooling is an error, never a simulated PASS.
- Browser interactions use a closed action vocabulary; no arbitrary shell snippets in config. Reports redact secrets and URL queries.
- Handoffs reject stale context revisions and overlapping file ownership; user-approved decisions can't be overwritten by ordinary context updates.

## Skills layout

- `skills/` is the source of truth. Installed copies go to per-agent directories defined by `agentDirectories` in `packages/core/src/install.ts` (Codex, Claude Code, Cursor, Kiro, Gemini CLI, Copilot, OpenCode, Windsurf); each has a note under `adapters/`. `AGENTS.md` requires keeping `skills/` and `.agents/skills/` synchronized when editing skill content; Local installs under `.claude/` and `.cursor/` are gitignored; refresh them with `tevra-design skills install` after editing `skills/`.
- Each skill folder is self-contained, with its own narrowly selected references. Shared references live in `references/`, `schemas/`, `templates/`, `rubrics/`; per-agent installers in `adapters/`.
- Installation preflights every destination and refuses to overwrite locally modified files.

## Conventions

- `tsconfig` is `NodeNext` with `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`: use `import type` and `.js` extensions in relative imports.
- Tests are `node:test`, in `tests/{unit,integration,structure,e2e,skills,docs}`; legacy Python tests sit in `tests/test_*.py`.
- Write all repository content (docs, README, skills, comments, commit messages) in English. Vietnamese keywords in `packages/core/src/router.ts` and `references/ux-patterns/catalog.json` are intentional: they match Vietnamese user requests.
- Tevra content is MIT; borrowed concepts/records carry notices in `PROVENANCE.md` and `THIRD_PARTY_NOTICES.md`. Don't add fonts, images, or large datasets.
