# Focused component redesign

Use the real task workspace's add-task form as the target. Baseline the default/error/added states, record invariants (title validation, task IDs, completion and deletion), then request conservative improvement to hierarchy or spacing. Scope changes to the form styles/component, preserve all model behavior and rerun the same browser assertions.

The browser E2E test applies a targeted section-heading spacing change in its served test copy, verifies task actions before/after and asserts a real visual diff blocks delivery pending review. This is a regression exercise, not a claim that arbitrary visual change improves UX. See `tests/e2e/browser.test.ts`.
