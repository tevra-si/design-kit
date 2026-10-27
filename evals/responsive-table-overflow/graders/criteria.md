---
type: llm
weight: 1
---

Score the response against these points (each roughly equal):

1. Removes the fixed `900px` width as the cause, or contains the table so the page itself no longer scrolls horizontally.
2. Does NOT hide the problem with `overflow: hidden` / `overflow-x: hidden` on `body`, `html` or `main`, which would clip data.
3. If the table scrolls inside its own container, makes that container keyboard-reachable and named (for example `tabindex="0"` plus `role="region"` and `aria-label`), or uses an equivalent accessible pattern such as stacked rows.
4. Keeps the table semantics (`<table>`, `<th>`) or provides equivalent labels in a stacked layout.
5. Mentions checking at 390px and at least one other width, and does not claim it was tested in a browser when it was not.
