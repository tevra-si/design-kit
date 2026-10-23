# Runnable examples

Two real local task applications share validation and visual tokens in `shared/`; they do not fabricate an API or persistence. Both support adding, completing and removing tasks, an empty state, validation errors and keyboard-visible focus. State intentionally resets on reload.

```sh
pnpm install
pnpm build
pnpm --filter @tevra/example-nextjs build
pnpm --filter @tevra/example-sveltekit build
pnpm --filter @tevra/example-nextjs start
# In another terminal, when using SvelteKit:
pnpm --filter @tevra/example-sveltekit start
```

Next.js serves port 4173; SvelteKit serves 4174. Each has a reviewed `tevra.config.json` with four viewports and default/added/error states. Initialize and use the compiled CLI from repository root:

```sh
pnpm tevra-design init --root examples/nextjs-dashboard --yes --skip-skills
pnpm tevra-design doctor --root examples/nextjs-dashboard --launch
pnpm tevra-design capture --root examples/nextjs-dashboard --kind baseline --approve-baseline
pnpm tevra-design capture --root examples/nextjs-dashboard --kind current
pnpm tevra-design compare --root examples/nextjs-dashboard
pnpm tevra-design a11y --root examples/nextjs-dashboard
```

Use the corresponding SvelteKit path for that application. `pnpm test:e2e` runs the real applications, masked screenshot comparisons, axe, task actions and a targeted style change; browser artifacts remain under `.tevra/e2e`. It expects built examples and a host that permits local servers/browser launch. Current environmental blockers are recorded in `docs/verification.md`.

Workflows for redesign and screenshot-to-code are documented beside these examples. Vue and React Native/Expo have implementation references but no device/browser verification claim here.
