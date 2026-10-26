# Executable acceptance application

Plain browser application with deterministic, local data and no external services. It complements the runnable Next.js and SvelteKit examples.

```sh
pnpm --filter @tevra/acceptance-app build
pnpm --filter @tevra/acceptance-app start
# separate terminal, from kit root:
pnpm tevra-design init --root examples/acceptance-app --yes --skip-skills
pnpm tevra-design capture --root examples/acceptance-app --kind baseline --approve-baseline
pnpm tevra-design test browser --root examples/acceptance-app
pnpm tevra-design test accessibility --root examples/acceptance-app
pnpm tevra-design test performance --root examples/acceptance-app --allow-network
```

- **Analytics:** month filtering and derived revenue/customer values. Research/direction/tokens are provided in `design-artifacts.md`; they are original authored example artifacts, not proof of automated agent execution.
- **Pricing:** plan selection, seat validation and annual discount. Compare `/?design=before` with `/?design=after`; CSS changes presentation while sharing the exact behavior code. E2E tests check both modes.
- **Form:** validates name/email, associates errors with inputs, marks invalid fields, moves focus to the invalid input and shows a truthful local success message. Nothing is submitted or persisted.
- Screenshot-to-code is not part of this app: it needs a real reference PNG. Follow [`../screenshot-to-code/README.md`](../screenshot-to-code/README.md) with your own screenshot.

`tests/e2e/acceptance.test.ts` exercises actual browser interactions including Escape/focus restoration. `tests/examples/acceptance.test.mjs` verifies pricing and validation functions; it does not establish browser or accessibility success.

## Same-route before/after visual comparison

To preserve identical capture metadata, build the before presentation, serve it and accept its baseline. Then rebuild the after presentation while the same static server/URL remains active:

```sh
pnpm --filter @tevra/acceptance-app build:before
# start server and capture explicitly approved baseline as above
pnpm --filter @tevra/acceptance-app build
pnpm tevra-design capture --root examples/acceptance-app
pnpm tevra-design compare --root examples/acceptance-app
```

The expected visual diff is a review finding, not automatic permission to replace the baseline. Query parameters `design=before|after` are provided for manual inspection; changing configured route URLs invalidates a baseline's matrix identity, so use the same-route build procedure for CLI regression comparison.
