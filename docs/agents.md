# Supported agents

Tevra skills follow the open [Agent Skills format](https://agentskills.io/specification), so the same folders work across agents. Only the install location differs.

| Agent | Install | Skills folder | How skills activate | Notes |
| --- | --- | --- | --- | --- |
| Claude Code | Plugin (recommended) | managed by Claude Code | Description match or `/tevra:<skill>` | Namespaced, so no clash with project skills. [Details](../adapters/claude-code/CLAUDE.md) |
| Claude Code | `--agents claude` | `.claude/skills/` | Description match or `/<skill>` | Refuses to overwrite a same-named skill |
| Codex | `--agents codex` | `.agents/skills/` | Native selector or `$<skill>` | [Details](../adapters/codex/AGENTS.md) |
| Cursor | `--agents cursor` | `.cursor/skills/` | `/` in Agent chat | [Details](../adapters/cursor/README.md) |
| Kiro | `--agents kiro` | `.kiro/skills/` | Description match or `/<skill>` | Custom agents need `skill://.kiro/skills/**/SKILL.md` in `resources`. [Details](../adapters/kiro/README.md) |
| Gemini CLI | `--agents gemini` | `.gemini/skills/` | Description match, with confirmation | Also reads `.agents/skills`. [Details](../adapters/gemini-cli/README.md) |
| GitHub Copilot | `--agents copilot` | `.github/skills/` | Agent mode, Copilot CLI, cloud agent | Also reads `.claude/skills` and `.agents/skills`. [Details](../adapters/github-copilot/README.md) |
| OpenCode | `--agents opencode` | `.opencode/skills/` | Loaded on relevance | Also reads `.claude/skills`; `.opencode/skills` wins. [Details](../adapters/opencode/README.md) |
| Windsurf / Devin Desktop | `--agents windsurf` | `.windsurf/skills/` | Description match or `@<skill>` | Devin Desktop prefers `.devin/skills/` but still reads this path. [Details](../adapters/windsurf/README.md) |

## Avoid duplicate skills

Some agents read more than one folder. Installing Tevra into two folders that the same agent reads shows every skill twice. Pick one per agent:

- Gemini CLI: `gemini` **or** `codex`
- GitHub Copilot: `copilot`, `claude` **or** `codex`
- OpenCode: `opencode` (or rely on `claude`)

## Installing for several agents

```sh
tevra-design init --yes --agents codex,cursor,kiro
tevra-design skills install --agents opencode --dry-run   # preview without writing
```

Each skill folder is self-contained and carries its own references. The installer checks every destination first and aborts the whole install if any file differs from the bundled copy, so local edits are never lost.

## Verifying activation

A successful copy does not prove an agent loaded the skill. Agent trust settings, managed policies and versions can affect loading. After installing, open a new agent session and ask for a small task (for example "check the accessibility of the login page") or list skills in the agent's UI.
