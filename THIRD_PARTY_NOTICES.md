# Third-party notices

## Adapted content

Three guidance records in `references/ux-patterns/catalog.json` (IDs starting with `upstream-`) are adapted from [UI/UX Pro Max `ux-guidelines.csv`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/data/ux-guidelines.csv), MIT, Copyright (c) 2024 Next Level Builder. The complete notice is bundled at `references/ux-patterns/UPSTREAM-LICENSE.txt`. Wording is shortened; non-universal guidance is kept as advice.

Taste Skill (MIT, Copyright (c) 2026 Leonxlnx) and Web Quality Skills (MIT, Copyright (c) 2026 Addy Osmani) are conceptual references only; no code, text or assets are redistributed.

## Runtime dependencies

| Package | License |
| --- | --- |
| Ajv | MIT |
| YAML | ISC |
| Playwright | Apache-2.0 (its NOTICE credits Microsoft Corporation and Puppeteer-derived code) |
| axe-core | MPL-2.0 |
| Lighthouse (optional peer dependency) | Apache-2.0 |
| pngjs | MIT |
| pixelmatch | ISC |

Build, test and example dependencies keep their own notices under `node_modules`. `pnpm-lock.yaml` pins exact transitive versions. No proprietary service or model is required, and no dependency source is modified.

Run `pnpm licenses list` and `pnpm audit` before each release.
