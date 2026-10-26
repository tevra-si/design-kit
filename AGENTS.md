# Tevra Design Kit repository instructions

This repository builds the Tevra skills and the `tevra-design` CLI. `CLAUDE.md` has the commands and architecture; the rules below apply to every agent.

## When doing UI work in this repository

Use the skills in `skills/` (or their installed copies):

- `design-research` when the brief, user needs, current UI or system constraints need investigation.
- `design-direction` before substantial new visual work or a redesign.
- `design-system` for scoped token and theme work; `ui-builder` to implement the approved direction.
- `ui-redesign` for existing UI, `responsive-design` for layout adaptation, `interaction-motion` for purposeful feedback.
- `accessibility-qa`, `browser-testing`, `performance-qa` and `visual-review` for evidence after a rendered change; `frontend-review` before merging source changes.

Always inspect and prioritize the active project design system. Do not create a parallel set of tokens or components. Project instructions and approved design decisions come before Tevra examples.

## When changing this repository

- `skills/` is the single source of truth. Do not edit installed copies.
- Write all repository content (docs, README, skills, comments, commit messages) in English. Vietnamese keywords in the router and UX catalog are intentional search terms.
- Do not commit internal material: progress notes, verification logs, audits, `.tevra/`, machine paths or personal data.
- Report any check you could not run as unverified, never as passing.
