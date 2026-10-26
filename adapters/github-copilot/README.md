# Tevra with GitHub Copilot

Install using `tevra-design init --yes --agents copilot --root <project>`. Repository skills live in `.github/skills/<name>/SKILL.md` and apply to Copilot agent mode in VS Code, Copilot CLI and the cloud agent. Copilot also reads `.claude/skills` and `.agents/skills`; install only one of `copilot`, `claude` or `codex` when a project uses Copilot to avoid duplicate skill names. Keep repository instructions in `.github/copilot-instructions.md`.

Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-skills . Installer tests establish file layout, not host activation.
