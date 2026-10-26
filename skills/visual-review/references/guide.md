# Focused implementation guide

Pixel comparison uses configurable pixel sensitivity and changed-pixel ratio, creates a diff image even for size mismatches, and requires matching artifact sets. Dynamic selectors are masked during capture and recorded in the manifest. Browser overflow/touch-target findings are heuristics requiring inspection. Model-based visual reasoning is optional and performed only by an available authorized vision-capable agent; the CLI does not pretend to call one. Supply AI findings as validated checks with evidence. Avoid recording private text or screenshots outside the local project.

## Default category judgments

Hierarchy 15%, typography 10%, layout/spacing 15%, consistency 15%, responsive 15%, accessibility 15%, interaction 10%, performance 5%. Use 0–4 with specific evidence: 0 blocked, 1 major issues, 2 partial, 3 meets scoped criteria, 4 demonstrated strengths. Missing evidence remains unscored. Category weights and threshold are project configurable. Report deterministic, heuristic, AI and human evidence separately. A critical failure or missing required test blocks regardless of the total.
