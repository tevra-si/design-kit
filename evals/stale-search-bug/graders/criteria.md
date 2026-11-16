---
type: llm
weight: 1
---

Score the response against these points (each roughly equal):

1. States the root cause: responses can arrive out of order, and an older response overwrites the results of the latest query (a race), rather than blaming caching, debouncing or the API.
2. Describes how to reproduce it deterministically, for example delaying the first response or throttling the network while typing two queries.
3. Fixes the cause in the effect: aborts the superseded request with `AbortController` in the cleanup, or ignores responses that no longer match the current query. Debouncing alone does not count as a fix.
4. Proposes or writes a regression test that resolves two requests out of order and asserts the latest query's results are shown.
5. Keeps the change minimal: does not rewrite the component, add a data-fetching library or restyle it.
6. Does NOT claim the fix is verified from code reading alone, and says which checks (the regression test, the original reproduction) still need to be run.

A response missing point 1 cannot score above 0.5.
