# Changelog

All notable changes to Tevra Design Kit are documented here. The project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Changed

- `lighthouse` is now an optional peer dependency instead of a runtime dependency. A default `npm install tevra-design-kit` pulls 12 packages instead of about 212 and reports no known vulnerabilities. `tevra-design test performance` stops with an install hint when Lighthouse is missing. Install it with `npm install --save-dev lighthouse` next to Tevra (or globally).
- Updated `yaml` to 2.9.1, fixing a published advisory in the 2.8 series.

### Added

- Dependabot for npm and GitHub Actions, and an informational runtime `pnpm audit` step in CI.

## 1.0.1 — 2026-10-27

### Added

- README hero and quality-report images rendered from a real run, a social preview image and the plugin icon. `pnpm demo:assets` regenerates them.
- GitHub Actions CI: typecheck, unit, integration, structure, example builds, end-to-end browser tests and an npm pack check.
- `claude plugin eval` suite that compares Claude with and without the plugin, including a case where no skill should fire.
- npm package metadata. The CLI is available as `tevra-design-kit` on npm (`npx tevra-design-kit`).

### Changed

- `accessibility-qa` and `responsive-design` descriptions are rewritten around the requests people actually make. In the eval suite they now activate in 3 of 3 runs, up from 0 and 1.
- Package description updated.

### Fixed

- Clean installs failed under pnpm 11 because esbuild's build script was not allowed in `pnpm-workspace.yaml`.
- The example static server served `.mjs` files with the wrong MIME type, so the acceptance app did not start in a browser.

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
