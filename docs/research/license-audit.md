# License audit

See [machine-readable source evidence](../../registry/sources.json) and [upstream audit](upstream-audit.md). A verified root license is not a blanket clearance for embedded assets.

## Redistribution inventory

- Tevra code, skills and original references: repository MIT notice.
- Three adapted UI/UX Pro Max records: `references/ux-patterns/catalog.json`, notice in `UPSTREAM-LICENSE.txt`. No bulk CSV vendoring.
- Taste and Web Quality: conceptual inspiration only, no copied source/assets.
- Vercel: React SKILL declares MIT; complete license/copyright text not located at inspected root/skill paths. No upstream source, rule text or assets redistributed. SPDX license remains null in source registry until verified; declared metadata is separate.
- Playwright: runtime package under Apache-2.0; upstream NOTICE identifies Microsoft and Puppeteer-derived code. Dependency manager retains installed licenses. Browser binaries are separately installed and excluded from source distribution.
- Lighthouse: runtime dependency; inspect installed manifest/license before release. Its browser and transitive dependencies require their own notice review.

## Review limitations and required follow-up

Full recursive source access and matching pinned content remain unavailable for four sources. Assets, logos, fonts, remote screenshots and generated files are excluded from reuse. Do not expand adapted datasets or vendor rule files before a file-level audit. Runtime dependency inventory from the previous milestone is in `.tevra/verification/runtime-license-inventory.json`; it must be regenerated after dependency changes.

For a release, generate an inventory from every installed runtime dependency manifest, retain LICENSE/NOTICE files for redistributed dependencies, review exceptions manually and pin reviewed provenance. Unknown terms block copying, not independent original implementation.

## Runtime inventory after expansion

`scripts/audit-licenses.mjs` traverses installed runtime dependencies and records manifest declarations plus notice filenames. The expanded inventory contains 205 manifests, all resolvable, before the peer compatibility pin. This is an inventory, not legal clearance. Lighthouse13.0.3 brings Sentry/OpenTelemetry transitively; reporting is explicitly disabled for audit subprocesses. `@opentelemetry/api` is pinned to1.9.0 through workspace overrides to satisfy the older tracing packages' `<1.10.0` peer range. The deprecated tracing dependency remains upstream technical debt.
