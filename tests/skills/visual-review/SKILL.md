---
name: visual-review
description: Review implemented UI against the active project design system, approved context, user task, and quality rubric. Use after a screen or visual change when rendered output is available.
---

# Visual Review

Evaluate what the user can actually see and do. Prioritize task failure and accessibility barriers over taste-level polish. A static screenshot proves visual facts only.

## Required evidence

- Current screenshot or live rendered page for the changed screen.
- Viewport dimensions and device/platform.
- Matching `design-context.json` and active project design system.
- Main interaction states, if the review concerns behavior rather than static layout.

If evidence is missing, ask for the smallest missing artifact or continue with a clearly scoped partial review. Never infer runtime, keyboard, or assistive-technology behavior from an image.

## Workflow

### 1. Confirm review target

Verify screenshot freshness, route/state, viewport, and context version. Compare against the project's current tokens/components and the approved design context. Project system consistency takes precedence over generic taste or Tevra sample values.

### 2. Inspect in user-task order

1. Can the user identify the purpose and next action?
2. Can the primary flow be completed and does the interface communicate feedback/recovery?
3. Are content hierarchy and visual direction consistent with approved intent?
4. Do typography, contrast, focus cues, targets, and labels support readability/accessibility?
5. Does the layout fit the target viewport and platform without clipping or overflow?
6. Are spacing, alignment, icons, states, and component treatments consistent with the project system?

### 3. Score and classify

Score each rubric dimension 0–4 and cite visible evidence for every score below 3. Classify each issue:

- **BLOCK**: primary task cannot be completed, a control/content is inaccessible, or an action can produce a harmful/wrong result.
- **MAJOR**: substantial confusion, hidden primary action, broken responsive fit, or unapproved design-system drift.
- **MINOR**: localized spacing, alignment, microcopy, or polish issue with low task impact.

Do not average away BLOCK/MAJOR issues. Do not call an accessibility check passed without the relevant test; describe visual indicators as evidence, not proof of assistive-technology behavior.

### 4. Give actionable findings

For each finding state: severity, location, evidence, user impact, and specific correction. Order findings by severity then flow impact. Group repeated symptoms under one root cause where possible. Avoid vague feedback such as “make it cleaner”.

### 5. Review the fix

After the builder changes the UI, inspect a new screenshot at the same viewport/state. Mark each prior issue fixed, open, regressed, or not verifiable. Check that the correction still follows the active system and did not break adjacent states.

Use `templates/visual-review.md` and `rubrics/quality-rubric.md` when the kit is available.

## Completion criteria

- Viewport and evidence limits are recorded.
- All six rubric dimensions are scored with specific evidence.
- BLOCK/MAJOR issues have actionable corrections and clear status.
- Unsupported behavioral/accessibility claims are labeled unverified.
- The reviewer does not impose personal style preferences over approved project direction.
