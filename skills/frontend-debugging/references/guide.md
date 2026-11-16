# Evidence guidance

Match the symptom to the first evidence worth collecting.

| Symptom | Collect first | Common causes |
| --- | --- | --- |
| Wrong or stale data on screen | Request order and timing, response bodies, the state that renders | An older response overwriting a newer one, a cache key missing an input, state derived once and never updated |
| Works locally, fails after build or deploy | The value at build time and at runtime, server and client output | Configuration read at build time, environment variables not exposed to the client, server/client markup mismatch |
| Blank screen or crash | First uncaught error and its stack, the failing component's props | Reading a missing field, an error boundary that is absent, a failed dynamic import |
| Control does nothing | Whether the event fires, whether the element is covered or disabled | A handler bound to the wrong element, an overlay intercepting input, a stopped event |
| Layout breaks only at some widths | Viewport size, computed styles of the overflowing element | Fixed widths, unwrapped content, a missing container constraint |
| Fails only sometimes | Timing between events, requests and renders | Races, cleanup that does not cancel, shared mutable state |

Hydration warnings name the first mismatched node; start there rather than at the visible symptom. A failed request is evidence only with its status, URL and the code path that issued it.

Frameworks: follow the installed version's documented behavior for caching, server/client boundaries and reactivity. Do not assume the behavior of another major version. On React Native and Expo, reproduce on the affected platform; a browser reproduction does not cover native behavior.

Stop conditions: after two fixes that did not address the stated cause, return to step 4 and restate the cause instead of trying a third.

Example: "Search shows results for the previous query." Reproduce by typing two queries quickly with a throttled network. The request log shows the first response arriving last and replacing the second. Root cause: responses are applied without checking they belong to the latest query. Regression test: resolve two requests out of order and assert the latest query's results render. Fix: cancel or ignore the superseded request.
