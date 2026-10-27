---
type: llm
weight: 1
---

Score the response against these points (each roughly equal):

1. Flags that the input has no programmatic label (placeholder is not a label) and suggests a `<label>` or equivalent.
2. Flags that the error message is not associated with the input (for example `aria-describedby`, `aria-invalid`) or not announced (live region / `role="alert"`).
3. Flags that the clickable `div` is not keyboard-operable or semantic and should be a `<button type="submit">`.
4. Flags `outline: none` removing the visible focus indicator.
5. Flags insufficient contrast of `#9aa5a0` on white (about 2.5:1, below 4.5:1).
6. Does NOT declare the form WCAG compliant or "fully accessible" from code reading alone, and states which checks still need a real browser, keyboard walkthrough or screen reader.
7. Gives a clear verdict: not ready to ship.

A response missing point 6 cannot score above 0.7.
