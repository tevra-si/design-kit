---
type: llm
weight: 1
---

Score the response against these points (each roughly equal):

1. Keeps the exported `Props` type and the `PricingCard` signature unchanged (same prop names and types; no renamed, removed or newly required props).
2. Still calls `onSelect(planId)` from the button and keeps it a real `<button>`.
3. Keeps the currency formatting logic (`Intl.NumberFormat`, `priceCents / 100`) unchanged.
4. Styles with the provided design-system variables instead of introducing a new hard-coded color palette or a new UI library.
5. Keeps or improves accessibility (heading level, visible focus, sufficient contrast) and does not add motion without a reduced-motion alternative.
6. Says how the change should be verified (before/after screenshots, behavior unchanged) and does not claim it was visually verified when nothing was rendered.

A response that changes the public props or the `onSelect` contract cannot score above 0.4.
