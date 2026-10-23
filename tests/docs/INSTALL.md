# Installing Tevra Design Kit

## Install into a repository

1. Copy the four folders in `skills/` into `.agents/skills/` so agents that support Agent Skills can read them.
2. For Claude Code, copy them into `.claude/skills/`.
3. Place the schema/rubric in `docs/design/` or the existing documentation location. Copy `examples/design-context.json` as the project context and replace it with the real brief.
4. Merge the matching adapter into `AGENTS.md` or `CLAUDE.md`; do not overwrite existing instructions.
5. Validate the context (Python 3.10+): `python3 scripts/validate_context.py design-context.json`.

On every use, the agent must inspect the project's existing design system first. Project tokens, components and instructions take priority; the skills only add process and never impose a new design system.

## Manual install

Place each skill folder containing `SKILL.md` into the personal skill directory your agent uses. Use the matching adapter in `adapters/`. Personal paths depend on configuration, so check the agent's current official documentation.

On macOS with default configuration, common directories are `~/.codex/skills/` (Codex), `~/.claude/skills/` (Claude Code) or `~/.agents/skills/` (Agent Skills). Copy the whole `tevra-design-kit` folder to a stable location the agent can read, then copy each subfolder of `skills/` into the corresponding global skill directory. Keep the full kit so skills can look up schemas, rubrics and examples. Restart or open a new agent session after installing.

In the Tevra repository, local copies are placed in `.agents/skills/` and `AGENTS.md` tells agents to activate them per workflow. When this repository is opened as a workspace, agents that support project skills read the local copies; the skills are not installed globally for other projects.

## Updating

Keep schemas and rubrics on the same version. Before updating, save the current context and run the validator.
