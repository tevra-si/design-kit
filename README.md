# Tevra Design Kit v2

A set of **12 Agent Skills**, a TypeScript CLI and local QA tools for Codex, Claude Code, Cursor, Kiro, Gemini CLI, GitHub Copilot, OpenCode and Windsurf. The current directory is the kit root; no Tevra desktop app is required.

## 12 skills

| Skill | Job |
| --- | --- |
| design-research | UX patterns, color, typography and evidence sources |
| design-direction | Visual direction; variance/motion/density 1–10 |
| design-system | Tokens, light/dark, responsive and component rules |
| ui-builder | Implementation for React, Next.js, SvelteKit, Vue; separate references for Expo/native |
| ui-redesign | Scoped redesign that preserves behavior and identity |
| responsive-design | Viewports, overflow, navigation and touch targets |
| interaction-motion | Feedback/motion and reduced motion |
| visual-review | Real screenshots, baselines, masks and PNG diffs |
| accessibility-qa | axe and required manual checks |
| performance-qa | Lighthouse lab metrics and performance budgets |
| browser-testing | User flows, assertions, console/network errors |
| frontend-review | Component architecture, state, framework and error sources |

Each skill has a SKILL.md, contract, workflow, references, validation, error handling and examples. Detailed instructions load only when needed. Registry version 1 supports extensions and deterministic capability selection by priority/dependency/conflict.

## Claude Code plugin

```
/plugin marketplace add tevra-si/design-kit
/plugin install tevra@tevra
```

Skills are then invoked with the plugin namespace, for example `/tevra:ui-builder` or `/tevra:design-system`, so they never collide with project skills of the same name. Other agents use the installer below.

## Install and use

Requires Node as specified by `engines` in package.json, pnpm 11 and a browser for render checks.

```sh
pnpm install
pnpm build
pnpm tevra-design help
pnpm tevra-design init --root /path/to/project --yes --agents codex,claude,cursor
pnpm tevra-design skills list
pnpm tevra-design skills inspect ui-builder
pnpm tevra-design skills validate
pnpm tevra-design workflow plan "Improve pricing card" --mode quick --root /path/to/project
```

Interactive setup: omit `--yes`. CI: use `--yes` and select agents explicitly. The installer supports `codex` (`.agents/skills`), `claude` (`.claude/skills`), `cursor` (`.cursor/skills`), `kiro` (`.kiro/skills`), `gemini` (`.gemini/skills`), `copilot` (`.github/skills`), `opencode` (`.opencode/skills`) and `windsurf` (`.windsurf/skills`); see the [installation guide](docs/installation.md) for hosts that share directories. Local files with different content are preserved and reported as conflicts. The canonical source is `skills/`.

`workflow run` executes local QA adapters. Research/design/implementation steps need a coding agent to perform them and submit evidence; a missing adapter reports `blocked`. The CLI never drives an LLM by itself.

## Context, memory and QA

```sh
pnpm tevra-design context show
pnpm tevra-design context validate
pnpm tevra-design memory list
pnpm tevra-design doctor --launch
pnpm tevra-design capture --kind baseline --approve-baseline
pnpm tevra-design test browser
pnpm tevra-design test visual
pnpm tevra-design test accessibility
pnpm tevra-design test performance --allow-network
pnpm tevra-design report
```

Context and memory live in the project's `.tevra/` directory, with schemas/revisions, protection for approved decisions and migration from v1. They cover brand, direction, tokens, responsive requirements, regressions and provenance. Nothing is committed or uploaded automatically.

Capture uses a viewport/state matrix, an origin allowlist, dynamic-region masks, assertions and axe. Baselines require explicit approval. Lighthouse needs separate network permission because pages may load cross-origin resources; lab metrics do not replace real-user data. Reports are emitted as JSON, Markdown and HTML and separate deterministic, heuristic, AI and human evidence. Critical failures and unmet required evidence block PASS.

## Examples and tests

- `examples/nextjs-dashboard`: a Next.js task app with add/validate/toggle/remove/empty states.
- `examples/sveltekit-workspace`: the same behavior in SvelteKit.
- `examples/acceptance-app`: analytics, pricing calculator/dialog and form validation, with before/after CSS changes.

```sh
pnpm typecheck
pnpm test
pnpm test:examples
pnpm test:structure
pnpm test:legacy
pnpm --filter @tevra/example-nextjs build
pnpm --filter @tevra/example-sveltekit build
pnpm --filter @tevra/acceptance-app build
pnpm test:e2e
```

## Status and limits

The registry, 12 skills, context/memory, workflow, CLI and QA are implemented. **The full Definition of Done is not yet met**: the sandbox blocks starting servers/browsers, so screenshots, axe on rendered UI and real Lighthouse runs are unverified; the screenshot-to-code scenario still lacks a real reference PNG. The audit read all 5 sources, but pinned-content/file-level license review is limited by access. No content with unclear reuse rights is vendored.

Current results and continuation commands: [verification-v2](docs/verification-v2.md), [progress checklist](docs/PROGRESS.md). No ZIP was created or updated in this round.

## Documentation

- [Installation](docs/installation.md) · [v2 commands](docs/workflows/v2.md)
- [v2 architecture](docs/architecture/v2-implementation.md) · [capability ownership](docs/architecture/capability-ownership.md)
- [5-source audit](docs/research/upstream-audit.md) · [license audit](docs/research/license-audit.md)
- [Security](docs/security.md) · [customization](docs/customization.md) · [contributing](docs/contributing.md)
- [Provenance](PROVENANCE.md) · [third-party notices](THIRD_PARTY_NOTICES.md) · [MIT license](LICENSE)
