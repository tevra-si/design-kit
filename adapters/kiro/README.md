# Tevra with Kiro

Install using `tevra-design init --yes --agents kiro --root <project>`. Workspace skills live in `.kiro/skills/<name>/SKILL.md` with their focused references. Kiro activates a skill when the request matches its description, or through `/skill-name`. Custom Kiro agents load skills only when their `resources` include `skill://.kiro/skills/**/SKILL.md`. Keep project steering files in `.kiro/steering/`; this adapter does not replace them.

Source: https://kiro.dev/docs/skills/ . Workspace skills override global `~/.kiro/skills` of the same name. Installer tests establish file layout, not host activation.
