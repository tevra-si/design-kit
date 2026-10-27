# Security

Tevra treats everything it reads as data, never as instructions: external references, screenshots, project configuration and skill catalogs. It configures no model endpoint, no upload client and no arbitrary shell command.

## Boundaries

| Boundary | Protection | Covered by |
| --- | --- | --- |
| Project paths | Relative paths only; traversal, absolute paths and symlinked ancestors are rejected | `tests/integration/project.test.ts` |
| Concurrent writes | Exclusive locks, atomic replacement, expected revisions | Context, memory and workflow tests |
| Agent ownership | Canonical file claims, stale-revision checks, overlapping owners rejected | Router and handoff tests |
| Skill installation | Every destination is preflighted and rechecked; changed files are never overwritten | Adapter integration tests |
| Browser executable | Channels from a closed list; a custom path needs `--allow-custom-browser` | Custom executable regression test |
| Browser network | Only configured origins load; requests and WebSockets are intercepted; fresh context; downloads and service workers blocked | E2E browser tests |
| Browser actions | Closed vocabulary (`click`, `fill`, `press`, `check`, `expect-*`); no scripts in config | Config schema |
| Lighthouse | Subprocess with an argument array, no shell; network access only with `--allow-network` | Performance unit tests |
| PNG input | Header and dimension budget checked before decoding | Invalid and oversized PNG tests |
| Evidence integrity | Hashes for screenshots, manifests and settings; failed captures and stale comparisons are rejected | CLI pipeline tests |
| Reports and memory | Secret patterns and URL queries redacted; secret-like memory entries rejected; Markdown escaped | Quality and memory tests |
| Human decisions | Approved history protected; resets, constraint changes and baselines need explicit flags | Context, memory and workflow tests |

## Limits to be aware of

- File locks coordinate cooperating tools. They do not protect against an administrator or a hostile process running as the same user.
- `workflow approve --by NAME` records a decision. It is not identity verification.
- Redaction finds common secret formats in text. It cannot detect arbitrary personal data, and never inside screenshots. Mask private regions before capture.
- Lighthouse may load every resource origin a page requests once `--allow-network` is given. Only audit apps whose third-party requests you have reviewed.
- Automated browser checks do not certify screen-reader behavior, native apps or full WCAG conformance.

## Dependencies

- The published package has six runtime dependencies (Ajv, axe-core, pixelmatch, Playwright, pngjs, YAML) plus Lighthouse as an optional peer dependency, which keeps a default install small and free of Lighthouse's large transitive tree.
- Versions are pinned exactly and `pnpm-lock.yaml` is committed, so builds are reproducible.
- CI runs `pnpm audit --prod` on every change (informational) and Dependabot opens weekly update pull requests.
- Lighthouse is only ever resolved from where Tevra itself is installed. Tevra never executes code from the `node_modules` of the project being audited.

## Before a release

```sh
pnpm audit
pnpm licenses list
pnpm test && pnpm test:structure && pnpm test:e2e
```

Run these on a machine that allows browser launch and local servers.

## Reporting a vulnerability

Do not open a public issue. Contact the Tevra maintainers privately with steps to reproduce and the affected version.
