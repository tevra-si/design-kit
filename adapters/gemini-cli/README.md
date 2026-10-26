# Tevra with Gemini CLI

Install using `tevra-design init --yes --agents gemini --root <project>`. Workspace skills live in `.gemini/skills/<name>/SKILL.md`. Gemini CLI also reads `.agents/skills`, so install either `gemini` or `codex` for a project, not both, to avoid duplicate skill names. Gemini asks for confirmation before activating a matching skill; check with `/skills list`. Keep always-on conventions in GEMINI.md.

Source: https://geminicli.com/docs/cli/skills/ . Installer tests establish file layout, not host activation.
