# Installation

Prerequisites: Node 22.22.2+, 24.15.0+, or 26+ (tested with 26.0.0), pnpm 11.1.3, and a real Playwright browser for web capture. These Node ranges follow the structural-test dependency's engine requirements. macOS is the primary development target.

```sh
pnpm install
pnpm build
pnpm tevra-design skills list
```

Use the repository directly with `pnpm tevra-design …`. A portable CLI package can be built locally:

```sh
pnpm pack --out /tmp/tevra-design-kit.tgz
npm install --global /tmp/tevra-design-kit.tgz
tevra-design help
```

No registry publication is assumed. The package includes compiled engines, nine skills, focused references, schemas and adapter documentation. Runnable examples are in the full repository ZIP.

## Claude Code plugin (recommended for Claude Code)

```
/plugin marketplace add tevra-si/design-kit
/plugin install tevra@tevra
```

Skills are namespaced as `/tevra:<skill>`, which avoids conflicts with existing project skills. The `claude` installer target below copies skills into `.claude/skills/` unnamespaced and refuses to overwrite a same-named skill.

## Agent adapters

| Agent | Project destination | Discovery/invocation |
| --- | --- | --- |
| Codex | `.agents/skills/<name>/SKILL.md` | Native selector / `$name` where supported |
| Claude Code | `.claude/skills/<name>/SKILL.md` | Native discovery and `/name` |
| Cursor | `.cursor/skills/<name>/SKILL.md` | Native discovery and `/` skill selection |
| Kiro (`kiro`) | `.kiro/skills/<name>/SKILL.md` | Description match or `/name`; custom agents need `skill://` resources |
| Gemini CLI (`gemini`) | `.gemini/skills/<name>/SKILL.md` | Description match with confirmation; `/skills list` |
| GitHub Copilot (`copilot`) | `.github/skills/<name>/SKILL.md` | Agent mode, Copilot CLI, cloud agent |
| OpenCode (`opencode`) | `.opencode/skills/<name>/SKILL.md` | Loaded on relevance |
| Windsurf (`windsurf`) | `.windsurf/skills/<name>/SKILL.md` | Description match or `@name` |

Gemini CLI also reads `.agents/skills`, and Copilot also reads `.claude/skills` and `.agents/skills`. Install one directory per host to avoid duplicate skill names.

Sources: [Agent Skills](https://agentskills.io/specification), [Codex](https://learn.chatgpt.com/docs/build-skills), [Claude Code](https://code.claude.com/docs/en/skills), [Cursor](https://cursor.com/docs/skills), [Kiro](https://kiro.dev/docs/skills/), [Gemini CLI](https://geminicli.com/docs/cli/skills/), [GitHub Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-skills), [OpenCode](https://opencode.ai/docs/skills/), [Windsurf](https://docs.windsurf.com/windsurf/cascade/skills). Managed policy, trust, remote sessions and host versions can affect activation. File installation tests do not prove an external agent loaded a skill.

```sh
# Interactive
tevra-design init --root /path/to/project

# CI-friendly
tevra-design init --root /path/to/project --yes --agents codex,claude,cursor
tevra-design skills install --root /path/to/project --agents codex --dry-run

# Context/config only, when agent directories are protected
tevra-design init --root /path/to/project --yes --skip-skills
```

Installation preflights conflicts and refuses changed local files. Identical files are safe to reinstall. Each installed skill has its own references. Updating an old installation requires reviewing differences and archiving the old copy first; there is no destructive force flag.

Review `.tevra/config.json` after init, or provide `tevra.config.json` before init. Add `.tevra/` to project ignores when context/screenshots should stay local. Tevra never commits or uploads artifacts.

## Browser prerequisite

```sh
pnpm exec playwright install chromium
tevra-design doctor --root /path/to/project --launch
```

Choose an installed Chrome with `browser.channel: "chrome"`. A custom `browser.executablePath` also needs explicit `--allow-custom-browser` on doctor/capture/a11y/review after reviewing the executable's provenance; project configuration alone does not authorize executing an arbitrary binary. Doctor without `--launch` checks availability rather than launch permission. A managed sandbox may deny browser launch or local server binding even when the executable exists. Tevra reports the error and does not simulate screenshots.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm test:legacy
pnpm skills:check
pnpm --filter @tevra/example-nextjs build
pnpm --filter @tevra/example-sveltekit build
pnpm --filter @tevra/example-sveltekit check
pnpm test:structure
pnpm test:e2e
```

The last two commands require built examples. Structural axe checks use static HTML in jsdom and exclude contrast, geometry and hydration. E2E launches real servers and Playwright and does not silently skip prerequisites. See `docs/verification.md` for this workspace's results.

## Expanded v2

Registry/QA commands are documented in `docs/workflows/v2.md`; current verification and blockers are in `docs/verification-v2.md`. The repository includes examples/tests; the installable CLI package includes engines, skills, registry, references and schemas. Example builds/tests run from the repository checkout.

Lighthouse13.0.3 is installed as a runtime tool, with error reporting disabled by Tevra. Workspace OpenTelemetry API1.9.0 resolves its tracing peer range. A consumer installing the CLI tarball may see a transitive peer warning if their resolver selects1.10.0; review the consumer lockfile before claiming a clean dependency environment. Browser and vulnerability-audit success are not established by installation alone.
