---
name: design-direction
description: Turn researched product needs into a coherent, buildable visual direction and shared design context. Use before building a new screen or making a substantial visual redesign.
---

# Design Direction

Decide how the experience should look and feel while keeping it coherent with the project's existing design system. Produce a clear decision and usable design context; do not leave the builder to guess.

## Required inputs

- Research brief or original user request.
- Existing system inventory and project instructions.
- `schemas/design-context.schema.json` and `examples/design-context.json` when the kit is available.

## Workflow

### 1. Establish the design-system boundary

Confirm the source of truth for tokens, components, typography, color, spacing, responsive behavior, and motion. Reuse these by default. Do not create duplicate tokens, replacement primitives, or a parallel visual system. If no system exists, state that and propose a deliberately small foundation. If the system conflicts with the brief, document the conflict and scope a compatible evolution rather than silently bypassing it.

### 2. Generate differentiated concepts

Draft two or three directions only when a choice is meaningful. Each direction must describe:

- Core idea and why it fits the user/task.
- Layout and hierarchy behavior, not just a style adjective.
- How the current system's components/tokens express the idea.
- Type, color, density, imagery, and motion choices where they affect the experience.
- A real trade-off or risk.

If the project system already makes the direction clear, state the recommendation directly instead of inventing alternatives.

### 3. Choose and record a direction

Compare candidate directions against user goal, system fit, accessibility, platform familiarity, implementation cost, and distinctiveness. Select one and record why it wins plus what was rejected. Avoid averaging options into a vague compromise. Use `templates/direction-decision.md` when available.

### 4. Define implementation-ready context

Create or update `design-context.json` at the project's established location. Validate against `schemas/design-context.schema.json`. Include:

- Project/product goal, audience, evidence, and confidence.
- Platform, primary flow, required UI states, and accessibility target.
- Chosen concept, principles, references, and explicit anti-goals.
- Existing token names/values and component references; mark proposed additions clearly.
- Constraints, decisions, and observable quality criteria.

Do not copy the example palette or typography unless they fit the project. References must have a known source and permitted use; a link is not permission to copy an asset.

### 5. Validate direction before handoff

Check the direction against the six dimensions in `rubrics/quality-rubric.md`. Ensure the direction gives concrete guidance on hierarchy, interaction, responsive behavior, and accessibility, not only surface styling. Run `python3 scripts/validate_context.py <context-file>` if the kit is present.

## Conflict precedence

1. Project-specific instructions and active design-system source.
2. Explicitly approved product brief or brand decision.
3. Project `design-context.json` and accepted decisions.
4. Tevra process guidance and examples.

If the brief requests a change that should alter shared tokens/components, make the scope visible and get the decision recorded before implementing a broad migration.

## Completion criteria

- A builder can implement the direction without inventing missing visual rules.
- Existing system is reused or each compatible addition is justified.
- Primary flow, required states, accessibility, and responsive expectations are explicit.
- Evidence, assumptions, references, and proposed changes are labeled accurately.
- Shared context passes validation when available.
