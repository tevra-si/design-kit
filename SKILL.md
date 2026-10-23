---
name: tevra-design
description: Route product design and frontend work to focused Tevra skills, manage shared decisions and deliver evidence-based visual and accessibility review.
license: MIT
---

# Tevra Design Orchestrator

Inspect the active project instructions and design system. Use the smallest workflow that completes the request. `tevra-design analyze` inventories likely sources; `tevra-design plan "<request>" --mode quick|standard|full` creates a local plan with explicit budgets. The CLI does not invoke an AI agent.

- New interface: research → direction → system → builder → responsive → visual review → accessibility.
- Existing component: redesign → builder → visual review; add accessibility when interaction changes.
- Screenshot: direction with visible evidence/assumptions → builder → responsive → visual review.
- Focused motion, responsive or accessibility task: invoke the relevant independent skill.

Read only each selected skill's `SKILL.md` and needed references. Use project-scoped context revisions and transparent memory. Preserve user-approved decisions and public contracts. Use handoffs with exclusive file ownership for future agent dispatch. Record human approval for shared system migrations and transformative changes.

Run available behavior and browser checks; do not fabricate a PASS when a tool is missing. Critical functionality/accessibility failures and failed required tests block delivery. Refine only within the configured retry/time budget. Report outputs, executed checks, evidence and unresolved blockers.

Expanded v2 adds `frontend-review` for source-level review, `browser-testing` for actual user assertions and `performance-qa` for Lighthouse laboratory audits. Use `skills list|inspect|validate|graph` for metadata discovery. `workflow run` executes supported local QA adapters; design/coding stages require the coding agent and evidence-bearing manual completion. Unsupported integrations are blocked explicitly. See `docs/workflows/v2.md` for commands and boundaries.
