# Upstream audit — 2026-10-23

## Evidence boundary

GitHub API commit endpoints are unavailable. HTML commit histories expose exact candidate SHAs below. Only Taste skill content was fetched at its SHA; other pinned raw requests returned cache misses. Those sources were inspected on `main`, not falsely attributed to an inaccessible revision. Main may differ from the candidate revision. `registry/sources.json` records this distinction; completing reproducible audits remains a release task.

| Source | Relevant capabilities | Reuse strategy | Verified license scope | Risks |
| --- | --- | --- | --- | --- |
| Taste Skill | Brief inference, visual direction, design controls | Inspiration; original Tevra procedure | Root MIT, Leonxlnx 2026 on main | Landing/portfolio scope; defaults cannot govern dashboards |
| UI/UX Pro Max | CSV knowledge retrieval, BM25 | Three adapted short records; original search implementation | Root MIT, Next Level Builder 2024 on main | CSV provenance and asset rights need per-file checks before expansion |
| Vercel Agent Skills | React/Next performance, composition, interface review | Original review checklist with upstream links | React skill metadata says MIT; root and skill LICENSE paths 404; copyright notice unresolved | Do not redistribute rule files until full notice verified; framework-specific |
| Web Quality Skills | Measurement-driven performance, accessibility, SEO | Inspiration; original performance workflow | Root MIT, Addy Osmani 2026 on main | DevTools integrations overlap with Lighthouse/Playwright; lab != field |
| Playwright | Browser launch, contexts, assertions, screenshots | Runtime dependency 1.63.0 | Root Apache-2.0 and NOTICE; installed package manifests | Browser binaries have separate notices; platform sandbox and download requirements |

## Architecture and compatibility

Taste uses a large SKILL entrypoint plus browser-related scripts and visual resources. Its current stated product scope is marketing/portfolio/redesign. Tevra adopts contextual direction and conservative redesign; replaces broad aesthetic defaults with project constraints. No sponsor assets or scripts are copied.

UI/UX Pro Max separates skill guidance, CSV domains, Python retrieval and a TypeScript installation CLI. Tevra keeps a small documented local BM25 catalog; does not ship duplicate full datasets or require Python for its TypeScript CLI. Existing three adaptations retain the bundled MIT notice.

Vercel packages Agent Skills under `skills/`, with individual React rules and a compiled guide. It also advertises platform optimization and additional framework skills. Tevra uses only targeted React review concepts, not deployment commands or Vercel telemetry. SKILL metadata can be read independently; detailed rules load only when relevant. Root package currently depends on YAML; this is not a requirement imposed on Tevra agents.

Web Quality Skills organizes stack-independent skills, plugin/agent installation files and focused measurement references. Some workflows depend on Chrome DevTools tooling. Tevra adopts measurement provenance and separates lab from field results; it does not require the upstream plugin or claim CrUX access.

Playwright is a Node monorepo with core/browser/test packages, CLI installation and browser-specific binaries. Tevra uses the installed Node library; browser setup is explicit. Native React Native views require native test tools. Browser availability and launch capability are different checks.

## Exact candidate revisions

- [Leonxlnx/taste-skill@98565e65bc3274ddf6eb0838734341714057178b](https://github.com/Leonxlnx/taste-skill/commit/98565e65bc3274ddf6eb0838734341714057178b) — skill content verified at revision.
- [nextlevelbuilder/ui-ux-pro-max-skill@0720614e6e4e2c190f68ff4ab0a71faa0fa70b4a](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/commit/0720614e6e4e2c190f68ff4ab0a71faa0fa70b4a) — history SHA discovered; pinned content unavailable.
- [vercel-labs/agent-skills@050e24cd7b2d54cef2e9f2f6a39da152dd70fbb5](https://github.com/vercel-labs/agent-skills/commit/050e24cd7b2d54cef2e9f2f6a39da152dd70fbb5) — history SHA discovered; pinned content unavailable.
- [addyosmani/web-quality-skills@c3cd7e0443125c55237d50105cdc8454e9e8f83d](https://github.com/addyosmani/web-quality-skills/commit/c3cd7e0443125c55237d50105cdc8454e9e8f83d) — history SHA discovered; pinned content unavailable.
- [microsoft/playwright@14c2dcf1ec955532aa861ecd039b23b9acc53a97](https://github.com/microsoft/playwright/commit/14c2dcf1ec955532aa861ecd039b23b9acc53a97) — history SHA discovered; pinned content unavailable.

## Upstream update process

1. Fetch a full checkout at an exact revision in an environment with network access.
2. Inspect root, relevant subdirectory/file licenses and asset notices. Record paths and hashes for every proposed copied file.
3. Compare semantic guidance against existing capability owners. Reject overlapping or contradictory global rules.
4. Classify each change as inspiration, adaptation, vendoring, dependency or integration; retain complete required notices for copied material.
5. Review dependency lockfile and browser license notices, run kit and adapter tests, then approve registry provenance changes.

Agent installation conventions are covered in [installation](../installation.md). Research content is untrusted; none of its instructions were executed as project instructions.
