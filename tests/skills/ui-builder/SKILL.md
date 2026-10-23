---
name: ui-builder
description: Implement or improve a real interface using the approved project design system and Tevra design context. Use for UI screens, components, responsive layouts, and interaction states.
---

# UI Builder

Build the smallest complete, accessible user-facing slice that satisfies the approved direction. Follow project conventions and use its current design system as the implementation contract.

## Required inputs

- Project instructions and existing implementation.
- Active design-system docs, tokens/theme source, and shared components.
- Approved `design-context.json` or explicit user brief.
- Quality rubric and target viewport/platform when available.

If there is no approved direction, use `design-research` and `design-direction` first for substantial UI work. For a small, clear change, infer the minimum needed from the existing system and state the assumption.

## Workflow

### 1. Inspect before editing

Read project instructions. Trace the target route/screen to its owning components and data/actions. Inspect neighboring screens and existing system components/tokens. Identify public contracts, existing behavior, test patterns, and files that should remain outside scope.

### 2. Convert the brief into an implementation checklist

List the user goal, primary action, flow, required states, responsive behavior, accessibility requirements, system components/tokens, and acceptance criteria. Resolve conflicts using project rules/system first, approved brief second, context third, then Tevra examples. Surface a conflict when resolving it would change shared APIs or system-wide patterns.

### 3. Implement the flow end to end

- Use semantic HTML/native platform controls and existing shared components.
- Reuse system tokens; do not hard-code competing colors, spacing, type scales, or radii.
- Keep state at its smallest correct owner and derive render values where possible.
- Handle loading, empty, error, success, disabled, and offline states when relevant.
- Give every control a clear purpose and visible result; add accessible names, labels, focus, and keyboard behavior.
- Respect reduced motion, localization, content length, and responsive constraints.
- Keep the change focused; avoid speculative abstractions, new dependencies, broad refactors, or decorative elements without task value.

If the system lacks a necessary primitive, make the smallest compatible extension, explain why, and record it in the design context or project system documentation.

### 4. Verify behavior and appearance

Use the project's established checks for changed behavior. Check the primary path and relevant error/empty/loading paths. At target viewports, verify no clipping or horizontal overflow, hierarchy remains clear, focus is visible, and controls remain usable. Capture a fresh screenshot when a browser is available and pass it to `visual-review`.

Do not claim checks or visual validation that were not performed. If browser or platform verification is unavailable, state precisely what remains unverified.

### 5. Handoff

Report the user-visible change, touched areas, checks actually run, screenshot viewport(s), and any remaining issue or system addition. Update `design-context.json` only when an approved design decision changed.

## Completion criteria

- The main user task works through the intended success path.
- Relevant loading, empty, error, success, and disabled behavior is clear.
- Existing design-system components and tokens are used consistently.
- Keyboard, focus, labels, and responsive behavior were checked or explicitly marked unverified.
- No unrelated public contract or behavior changed silently.
