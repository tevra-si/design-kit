# Measurement guidance

Use project budgets before defaults. Suggested starting thresholds: LCP 2500ms, CLS 0.1, total blocking time 200ms. TBT is a laboratory diagnostic, not field INP. Record audit failures and missing metrics separately from budget failures.

Inspect bundle analyzer output only when the framework exposes it. Do not install an analyzer merely to produce an attractive report. Compare compressed transfer sizes using equivalent build modes. For images, connect recommendations to the actual LCP element or oversized resources; avoid blanket lazy-loading above the fold.

Example: “Reduce pricing-page LCP while preserving checkout.” Baseline the page, identify the LCP request chain, change its delivery, then measure again. Preserve checkout handlers and validate the existing flow.

Source inspiration: [Web Quality Skills](https://github.com/addyosmani/web-quality-skills). These instructions are original; upstream text/assets are not bundled. Lighthouse needs Chromium and a reachable application; report environment failure honestly.
