# Tevra Design Kit v2

A set of **12 Agent Skills**, a TypeScript CLI and local QA tools for Claude Code, Codex, Cursor, Kiro, Gemini CLI, GitHub Copilot, OpenCode and Windsurf. The skills tell your coding agent *how* to research, build, review and verify UI work; the CLI plans workflows and records evidence (screenshots, axe, Lighthouse). The CLI never drives an LLM by itself.

- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Installation](#installation) — pick one path:
  - [A. Claude Code plugin](#a-claude-code-plugin-skills-only) (fastest, skills only)
  - [B. CLI + skills for any agent](#b-cli--skills-for-any-agent-full-setup) (full setup)
- [Configure a project](#configure-a-project)
- [Browser setup](#browser-setup)
- [Verify the installation](#verify-the-installation)
- [Usage](#usage)
- [Update and uninstall](#update-and-uninstall)
- [Troubleshooting](#troubleshooting)
- [Development](#development) · [Documentation](#documentation)

## What you get

| Skill | Use it for |
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

Each skill has a SKILL.md, contract, workflow, references, validation, error handling and examples. Detailed instructions load only when needed.

## Requirements

| Needed for | Requirement |
| --- | --- |
| Everything | Git and access to `tevra-si/design-kit` (private repository) |
| CLI | Node `^22.22.2`, `^24.15.0` or `>=26`, and pnpm 11 |
| Screenshots, axe, Lighthouse | A Chromium-based browser that Playwright can launch |
| Claude Code plugin | Claude Code with plugin support (`claude plugin --help` lists the commands) |

macOS is the primary development target.

## Installation

### A. Claude Code plugin (skills only)

Installs the 12 skills for every project, namespaced so they never collide with project skills of the same name (for example an existing `design-system`).

```sh
claude plugin marketplace add tevra-si/design-kit
claude plugin install tevra@tevra
```

The same commands work inside a session as `/plugin marketplace add tevra-si/design-kit` and `/plugin install tevra@tevra`. Start a **new** Claude Code session afterwards (skills load at startup), then type `/tevra` to list them. Skills appear as `tevra:<skill>`, for example `/tevra:ui-builder`. Claude also activates them automatically from natural-language requests.

This path installs skills only. For the `tevra-design` command (screenshots, axe, Lighthouse, reports), also do path B step 1.

### B. CLI + skills for any agent (full setup)

**1. Get the CLI**

```sh
git clone git@github.com:tevra-si/design-kit.git
cd design-kit
pnpm install
pnpm build
npm link            # puts `tevra-design` on your PATH
tevra-design help
```

Without `npm link`, run it from the clone with `pnpm tevra-design <command>`. After pulling changes, run `pnpm build` again; the linked command points at your clone.

**2. Install skills into a project**

```sh
cd /path/to/your-project
tevra-design init --yes --agents claude,cursor
```

`--agents` takes a comma-separated list. Omit `--yes` for an interactive prompt.

| `--agents` value | Skills are copied to | Notes |
| --- | --- | --- |
| `claude` | `.claude/skills/` | Claude Code. Prefer plugin path A if a skill name already exists |
| `codex` | `.agents/skills/` | Codex. Gemini CLI and Copilot also read this folder |
| `cursor` | `.cursor/skills/` | |
| `kiro` | `.kiro/skills/` | Custom Kiro agents need `skill://.kiro/skills/**/SKILL.md` in `resources` |
| `gemini` | `.gemini/skills/` | Also reads `.agents/skills`; install one of the two |
| `copilot` | `.github/skills/` | Also reads `.claude/skills` and `.agents/skills`; install only one |
| `opencode` | `.opencode/skills/` | Also reads `.claude/skills`; `.opencode/skills` wins on name clashes |
| `windsurf` | `.windsurf/skills/` | Current Devin Desktop prefers `.devin/skills/` but still reads this path |

Hosts that read several folders will see duplicate skill names if you install into more than one, so install one directory per host. Per-agent notes are in [`adapters/`](adapters/) and [docs/installation.md](docs/installation.md).

`init` also creates `.tevra/` (config, design context, memory) and never commits or uploads anything. Add `.tevra/` to the project's `.gitignore` if screenshots and context should stay local. The installer refuses to overwrite a file whose content differs and aborts the whole install on a conflict. Preview first with `tevra-design skills install --agents claude --dry-run`. To install only config and context, use `init --yes --skip-skills`.

**3. Restart your agent** in the project so it loads the new skills.

## Configure a project

Edit `.tevra/config.json` (created by `init`). The fields you normally change:

```json
{
  "baseURL": "http://localhost:3000",
  "permittedOrigins": ["http://localhost:3000"],
  "routes": [
    {
      "name": "vehicle-info",
      "path": "/vehicle/info",
      "states": [
        { "name": "default", "actions": [], "masks": [] },
        {
          "name": "manual-form",
          "actions": [{ "type": "click", "selector": "button:has-text('Enter manually')" }],
          "masks": [".user-email"],
          "waitFor": "form"
        }
      ]
    }
  ]
}
```

- `permittedOrigins` is an allowlist: capture refuses any other origin.
- A `state` is a named page condition. `actions` use a closed vocabulary: `click`, `fill`, `press`, `check`, `expect-visible`, `expect-hidden`, `expect-text`, `expect-checked`.
- `masks` are CSS selectors that hide dynamic or private regions (emails, names, plate numbers) in screenshots. Every mask must match at least one element on the page, otherwise capture fails. Use sample data for anything sensitive.
- `selector` and `waitFor` are Playwright locators, so selectors such as `button:has-text('Enter manually')` work.
- Route and state names are lowercase letters, digits and hyphens.
- `viewports`, `thresholds`, `weights` and `requiredChecks` have sensible defaults. The full schema is [`schemas/config.schema.json`](schemas/config.schema.json).

**Pages that need a login:** the kit launches its own browser, which has no session, and its actions must not carry real credentials. Test authenticated pages by asking your agent to use an already-logged-in browser, and keep the CLI for public pages and CI.

## Browser setup

```sh
pnpm exec playwright install chromium     # run inside the design-kit clone
tevra-design doctor --root /path/to/your-project --launch
```

To use an installed Chrome, set `"browser": { "channel": "chrome" }`. A custom `browser.executablePath` also requires `--allow-custom-browser` on `doctor`/`capture`/`a11y`/`review` after you have reviewed that binary. Without `--launch`, `doctor` only checks that the executable exists.

## Verify the installation

```sh
tevra-design skills list                 # 12 skills
tevra-design skills validate             # registry and skill contracts
tevra-design doctor --launch             # browser can actually start
tevra-design workflow plan "Improve pricing card" --mode quick
```

In your agent, ask for a small task (for example "check accessibility of the login page") and confirm it loads the matching skill. File installation alone does not prove an agent loaded a skill.

## Usage

**Ask your agent.** Skills activate from the request, or call one directly:

| Request | Skill |
| --- | --- |
| "The pricing table overflows on mobile" | responsive-design |
| "Check accessibility of the signup form" | accessibility-qa |
| "Improve this card, keep behavior" | ui-redesign |
| "Review this diff before merge" | frontend-review |
| "The page feels slow" | performance-qa |

**Plan and search from the CLI:**

```sh
tevra-design workflow plan "Improve pricing card" --mode quick   # quick | standard | full
tevra-design search "form error validation" --limit 5
tevra-design analyze                                             # frameworks, tokens, components
```

**Check a running app** (start it first; its URL must be in `permittedOrigins`):

```sh
tevra-design capture --kind baseline --approve-baseline   # only after a human approves the screens
tevra-design capture                                      # current screenshots
tevra-design compare                                      # pixel diff against the baseline
tevra-design a11y                                         # axe on every route/state/viewport
tevra-design test performance --allow-network             # Lighthouse lab metrics
tevra-design report                                       # .tevra/reports/quality.{md,json,html}
```

Exit codes: `0` success, `1` quality/check failure, `2` input or environment error. Critical failures and missing required evidence block PASS. Baselines are never created or overwritten without explicit approval. Lighthouse needs `--allow-network` because pages may load cross-origin resources, and lab metrics do not replace real-user data.

Context, memory and handoffs: `tevra-design context show|validate`, `memory list|inspect|update|reset`, `handoff validate|save`. Run `tevra-design help` for every command.

## Update and uninstall

**Plugin (path A)**

```sh
claude plugin marketplace update tevra
claude plugin update tevra@tevra
claude plugin uninstall tevra@tevra
claude plugin marketplace remove tevra
```

**CLI (path B)**

```sh
cd design-kit && git pull && pnpm install && pnpm build
```

The installer will not overwrite changed skills. To refresh a project's copies, move the old Tevra skill folders aside, then run `tevra-design skills install --agents <agent>` again. To uninstall, delete the Tevra skill folders from the agent directory, remove `.tevra/` if you no longer want its context, and run `npm unlink -g tevra-design-kit`.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `/ui-builder` does nothing in Claude Code | Skills are in the wrong folder (for example `.agents/skills` is Codex's) or the session predates the install. Use plugin path A, or `--agents claude`, then open a new session |
| `Installation conflict; preserve local file` | A same-named skill already exists with different content (for example `design-system`). Use plugin path A, or move the existing folder aside |
| `Marketplace file not found` | You are on an old clone or the repository lacks `.claude-plugin/marketplace.json`. Pull the latest `main` and retry |
| `Permission ... denied` on clone/push | Your Git identity has no access to `tevra-si/design-kit`. Use an SSH key or token tied to an account with access |
| `Unknown agent` | Supported: `codex, claude, cursor, kiro, gemini, copilot, opencode, windsurf` |
| `doctor` fails or capture cannot launch | Run `pnpm exec playwright install chromium`. A managed sandbox can block browsers or local servers even when the binary exists; Tevra reports the error and never fakes screenshots |
| Capture shows the login page | The route needs authentication; see [Configure a project](#configure-a-project) |
| Capture refuses the URL | Add its origin to `permittedOrigins` |
| `Write lock unavailable` | Another Tevra command is running, or a previous one crashed. Check for a stale `.tevra/*.lock` file |
| Plugin note: "packages ... were not installed" (pnpm lockfile) | Expected. The plugin only ships skills; the CLI comes from path B |

## Development

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test                    # unit + integration
pnpm test:structure          # structural axe on built examples
pnpm test:legacy             # Python validators
pnpm skills:check
pnpm test:e2e                # needs a browser and a local server
node --import tsx --test tests/unit/router.test.ts   # one test file
```

Examples: `examples/nextjs-dashboard`, `examples/sveltekit-workspace`, `examples/acceptance-app`. Canonical skill sources live in `skills/`; local installs under `.claude/` and `.cursor/` are gitignored. The CLI engines depend in one direction only (`cli → engines → contracts/filesystem`); see [architecture](docs/architecture/v2-implementation.md).

**Status:** registry, 12 skills, context/memory, workflow, CLI and QA are implemented. The full Definition of Done is not yet met: the sandbox used so far blocks servers and browsers, so screenshots, axe on rendered UI and real Lighthouse runs are unverified, and the screenshot-to-code scenario lacks a real reference PNG. Details: [verification-v2](docs/verification-v2.md), [progress checklist](docs/PROGRESS.md).

## Documentation

- [Installation](docs/installation.md) · [v2 commands](docs/workflows/v2.md)
- [v2 architecture](docs/architecture/v2-implementation.md) · [capability ownership](docs/architecture/capability-ownership.md)
- [5-source audit](docs/research/upstream-audit.md) · [license audit](docs/research/license-audit.md)
- [Security](docs/security.md) · [customization](docs/customization.md) · [contributing](docs/contributing.md)
- [Provenance](PROVENANCE.md) · [third-party notices](THIRD_PARTY_NOTICES.md) · [MIT license](LICENSE)
