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

CI (`.github/workflows/ci.yml`) runs all of the above on every push and pull request.

## Measuring skill impact

`evals/` holds cases for `claude plugin eval`. Each run compares Claude with and without the plugin on the same prompt and reports the score delta.

```sh
claude plugin eval . --runs 3 --no-publish --max-cost-usd 5
```

Add a case when you change a skill's behavior: a realistic `prompt.md` and `graders/*.md` that describe observable outcomes. Results go to `evals/results/` (gitignored). Single runs are noisy; report deltas only from several runs.

## Demo images

`docs/assets/` and `.claude-plugin/icon.png` are rendered from a real run, never mocked. Reproduce the before/after run from the README ("See it in action"), then:

```sh
pnpm demo:assets
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

- Bump `version` in `package.json`, `packages/*/package.json`, `examples/*/package.json`, `.claude-plugin/plugin.json`, `registry/skills.json` and the skill frontmatter together, and add a [changelog](../CHANGELOG.md) entry.
- Check the npm contents with `npm pack --dry-run`, then publish with `npm publish`.
- Run every check above, plus `pnpm audit` and `pnpm licenses list`.
- Install the plugin and each adapter in a fresh project and confirm the skills load.
- Report any check you could not run as unverified, not as passing.
