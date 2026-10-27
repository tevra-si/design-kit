# Changelog

All notable changes to Tevra Design Kit are documented here. The project follows [Semantic Versioning](https://semver.org/).

## Unreleased

- Demo images rendered from a real run, plugin icon and `pnpm demo:assets`.
- Published to npm as `tevra-design-kit`; `npx tevra-design-kit` runs the CLI.
- Updated package description (takes effect with the next npm release).
- Fixed: CI failed on a clean install because pnpm 11 blocks esbuild's build script unless it is allowed in `pnpm-workspace.yaml`.
- GitHub Actions CI for typecheck, unit, integration, structure, example and end-to-end browser tests.
- `claude plugin eval` suite comparing Claude with and without the plugin.
- accessibility-qa and responsive-design descriptions rewritten around user intent; in the eval suite they now activate in 3 of 3 runs instead of 0 and 1.
- Fixed: the example static server served `.mjs` files with the wrong MIME type, so the acceptance app did not start in a browser.

## 1.0.0 — 2026-10-26

First release.

### Skills

- Twelve Agent Skills: design-research, design-direction, design-system, ui-builder, ui-redesign, responsive-design, interaction-motion, visual-review, accessibility-qa, browser-testing, performance-qa and frontend-review.
- Descriptions written for automatic activation ("Use when…").
- Claude Code plugin and marketplace: skills install as `tevra:<skill>`.
- Project installer for Claude Code, Codex, Cursor, Kiro, Gemini CLI, GitHub Copilot, OpenCode and Windsurf.

### CLI

- Request routing to skill chains with `quick`, `standard` and `full` modes and step, time and refinement budgets.
- Workflow execution with evidence-gated stages, retries and human approval.
- Playwright capture across routes, states and viewports with masks, assertions, console and network errors.
- Protected baselines, PNG diffs, axe accessibility checks and Lighthouse lab metrics.
- Quality reports in JSON, Markdown and HTML that keep deterministic, heuristic, AI and human evidence apart.
- Versioned design context, inspectable memory and multi-agent handoffs with file ownership.
- Token foundation and export to CSS variables and CSS-first Tailwind.
- Local BM25 search over a sourced UX pattern catalog.

### Examples

- Runnable Next.js and SvelteKit task apps and an acceptance app (analytics, pricing, form validation) with end-to-end browser tests.
