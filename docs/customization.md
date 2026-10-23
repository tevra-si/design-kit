# Customization

Configuration is strict JSON Schema (`schemas/config.schema.json`); unknown fields fail.

- `baseURL`, `permittedOrigins`: exact authorized HTTP(S) origins. No credentials/query/fragment in baseURL. Tevra does not upload source or screenshots.
- `viewports`: named width/height profiles. Defaults: 390×844, 768×1024, 1280×800, 1440×900. Add intermediate widths and landscape according to the product.
- `routes`: stable route names and named states with actions, masks and optional visible `waitFor`. Do not put secrets into action values.
- `readySelector`: optional DOM readiness marker awaited before state actions, useful for client hydration or asynchronously initialized interfaces.
- `colorScheme`: light, dark, no-preference (default light). `reducedMotion`: reduce, no-preference (default reduce for repeatable captures). Review actual motion interactively too.
- `thresholds.diffRatio`: allowed changed-pixel fraction. `pixelSensitivity`: color-difference sensitivity. Both range 0–1; accepting a difference still needs judgment.
- `weights`: eight rubric weights totaling 100. `thresholds.minScore`: 0–100; 0 explicitly disables mandatory subjective-score coverage.
- `requiredChecks`: IDs required for delivery; defaults visual-diff, axe, overflow, functional-tests.
- `timeoutMs`: bounded browser waits. `maxRefinements`: project default; a saved plan records its own explicit budget.

Context controls: DESIGN_VARIANCE → design.variance; MOTION_INTENSITY → design.motionIntensity; VISUAL_DENSITY → design.visualDensity. All range 1–10 and never override approved brand or accessibility constraints.

Extend the local catalog with stable provenance, license and confidence and add a relevance test. Keep framework details in conditional references rather than loading all frameworks for each task.
