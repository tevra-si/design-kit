# Tevra with OpenCode

Install using `tevra-design init --yes --agents opencode --root <project>`. Project skills live in `.opencode/skills/<name>/SKILL.md`; relative reference links resolve from each skill folder. OpenCode also loads `.claude/skills`; when both exist, `.opencode/skills` wins for the same name, so installing both `claude` and `opencode` is safe but redundant.

Source: https://opencode.ai/docs/skills/ . Installer tests establish file layout, not host activation.
