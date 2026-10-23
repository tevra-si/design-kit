# Source analysis

Reviewed 2026-10-23 using upstream raw README, license, skill and implementation files. Live `main` branches can change; links describe the inspected sources, not pinned releases. Shell DNS was unavailable; the web connector supplied the inspected content. GitHub tree API and two guessed skill paths were unavailable/404 and were not used as evidence.

| Capability | Taste Skill | UI/UX Pro Max | Tevra decision |
| --- | --- | --- | --- |
| Organization | Skill with scripts and references | CSV knowledge, Python search, installer templates | Nine focused skills; load references on demand |
| Reasoning | Subject-specific art direction | Product/domain retrieval | Combine evidence with a recorded direction |
| Tokens and layout | Direction library | Searchable design recommendations | Preserve existing tokens; portable layered tokens |
| Motion/responsive | Browser inspection at multiple widths | Platform guidelines | Configurable viewport/state matrix and reduced motion |
| Review | Screenshot refinement | Curated implementation checks | Separate deterministic, heuristic, AI and human evidence |
| Tooling | Node scripts, installed browser | Python BM25, TypeScript installer | TypeScript CLI, Playwright and explicit dependencies |
| Distribution | Agent skill/plugin installation | Platform-specific generated files | Self-contained project adapters; no external runtime |
| License | MIT, Leonxlnx 2026 | MIT, Next Level Builder 2024 | Original code; attributed, small dataset adaptations |

Taste's source distinguishes reading pages from working app screens. Adopt task-specific composition and screenshot iteration; replace randomized direction selection with explainable decisions. Exclude its house style as a universal rule and exclude unneeded asset retrieval. Sources: [README](https://github.com/Leonxlnx/taste-skill/blob/main/README.md), [skill](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md), [draw](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/scripts/draw.mjs), [inspector](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/scripts/inspect.mjs), [license](https://github.com/Leonxlnx/taste-skill/blob/main/LICENSE).

Pro Max's search uses domain-specific CSV columns and BM25. Adopt local indexed retrieval, framework filtering and source metadata; improve unknown-result handling and context ownership. Adapt three UX records with MIT attribution; exclude bulk fonts/assets, copied framework-generation rules and mandatory animation libraries. Sources: [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/README.md), [search](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/scripts/search.py), [core](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/scripts/core.py), [UX CSV](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/data/ux-guidelines.csv), [CLI dependencies](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/package.json), [license](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE).

## Agent compatibility

Use name/description YAML frontmatter and portable Markdown under the [Agent Skills specification](https://agentskills.io/specification). Install project skills at `.agents/skills` for [Codex](https://learn.chatgpt.com/docs/build-skills), `.claude/skills` for [Claude Code](https://code.claude.com/docs/en/skills), `.cursor/skills` for [Cursor](https://cursor.com/docs/skills). Host trust, managed policy and restart requirements still apply. Filesystem installation tests cannot prove host activation.

## License and dependency policy

Tevra implementation code and instruction text are original. No source scripts, images, font files or full catalogs are bundled. Three adapted UX recommendations retain origin/license metadata and the upstream MIT notice in `references/ux-patterns/UPSTREAM-LICENSE.txt`. Dependencies are declared exactly and installation creates a lockfile; inspect transitive notices before publishing. See `THIRD_PARTY_NOTICES.md` and `PROVENANCE.md`.
