# Tevra with Claude Code

**Recommended:** install the plugin once per machine. Skills are namespaced as `tevra:<skill>`, so they never collide with project skills such as an existing `design-system`.

```sh
claude plugin marketplace add tevra-si/design-kit
claude plugin install tevra@tevra
```

**Per project:** `tevra-design init --yes --agents claude --root <project>` copies skills into `.claude/skills/<name>/SKILL.md`, unnamespaced. The installer refuses to overwrite a same-named skill.

Start a new session after installing; skills load at startup. Invoke them through natural-language requests or `/tevra:<skill>` (plugin) or `/<skill>` (project install). Follow the project's own CLAUDE.md and design system first. Do not replace that file with this note.

Source: https://code.claude.com/docs/en/skills . Managed policy may affect loading.
