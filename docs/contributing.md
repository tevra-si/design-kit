# Contributing

## Setup

```sh
pnpm install
pnpm build
pnpm exec playwright install chromium
```

## Checks

```sh
pnpm typecheck
pnpm test                    # unit + integration
pnpm test:structure          # axe on the built example apps
pnpm test:examples           # acceptance-app model tests
pnpm test:legacy             # Python context validator
pnpm skills:check            # skill metadata and links
pnpm test:e2e                # real browser: screenshots, diffs, axe, task flows
node --import tsx --test tests/unit/router.test.ts   # a single file
```

`test:e2e` builds first and needs a machine that allows starting Chromium and local servers. Build the examples before `test:structure` and `test:e2e`:

```sh
pnpm --filter @tevra/example-nextjs build
pnpm --filter @tevra/example-sveltekit build
pnpm --filter @tevra/acceptance-app build
```

## Editing skills

- `skills/` is the only source of truth. `.claude/` and `.cursor/` in this repository are local installs and are gitignored; refresh them with `tevra-design skills install`.
- Start every `description` with what the skill does, then a "Use when…" sentence with the words people actually type. Agents choose skills from that line.
- Keep `SKILL.md` short. Put conditional detail in `references/` and link it.
- Keep `registry/skills.json` in sync with skill names and descriptions.
- Run `pnpm skills:check` after every change.

## Code

- Dependencies point one way (see [architecture](architecture.md)). No cycles, including type-only imports.
- Validate external input with a schema in `schemas/`. Keep internal types strict.
- Write all files through `packages/filesystem`; never write outside the project root.
- Production modules stay under about 300 logical lines; split only at a real ownership boundary.
- Add a test for every changed behavior.
- Write all repository content in English. Vietnamese keywords in `packages/core/src/router.ts` and `references/ux-patterns/catalog.json` are intentional search terms.

## Before a release

- Bump `version` in `package.json`, `.claude-plugin/plugin.json`, `registry/skills.json` and the skill frontmatter together, and add a [changelog](../CHANGELOG.md) entry.
- Run every check above, plus `pnpm audit` and `pnpm licenses list`.
- Install the plugin and each adapter in a fresh project and confirm the skills load.
- Report any check you could not run as unverified, not as passing.
