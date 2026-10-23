# Review guidance

React: derive synchronous values during render; effects synchronize external systems and clean up listeners/requests. Check request identity or cancellation where old responses can overwrite new state. Keep state at its smallest shared owner. Inspect server/client serialization and authenticate server actions at the server boundary.

Next.js: follow the installed version's routing/cache semantics. Do not convert a whole route to client rendering to fix one interactive control. Avoid sequential independent fetches; establish real dependency before parallelizing. Bundle recommendations need an identified heavy dependency or analyzer evidence.

SvelteKit/Vue: preserve SSR-safe state ownership and framework reactivity. Expo: distinguish native accessibility and gesture tests from browser tests. Framework details remain in ui-builder references.

Example: “Review dashboard filtering.” Trace query input through debounce/request lifecycle to rendering; reproduce a stale-response race if present and specify a behavior test.

Inspiration: [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices). Original Tevra review procedure; no upstream rule files copied. Upstream metadata declares MIT, while a complete copyright notice was not located in inspected paths; direct redistribution remains excluded.
