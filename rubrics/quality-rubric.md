# Evidence-based quality rubric

| Category | Default weight | Evidence |
| --- | ---: | --- |
| Visual hierarchy | 15 | Purpose and next action clear at tested widths |
| Typography | 10 | Readable roles, locale glyphs and content fit |
| Layout and spacing | 15 | Deliberate grouping without clipping |
| Design consistency | 15 | Approved tokens, components and states |
| Responsive behavior | 15 | Real viewport/state evidence |
| Accessibility | 15 | Automated plus executed manual checks |
| Interaction quality | 10 | Real behavior, feedback and recovery |
| Performance | 5 | Measurements or clearly bounded source evidence |

Weights are configurable and total 100. Scores 0–4 describe judgment: 0 task blocked, 1 major issues, 2 partial usability, 3 scoped criteria met, 4 demonstrated strengths. Every executed check needs evidence. Scores below 3 require specific findings and corrections. Missing categories remain unscored.

Separate deterministic tests, automated heuristics, AI-assisted judgment and human approval. The engine uses the lowest submitted score per category, weights it on a 100-point scale, and defaults to threshold 75. Arithmetic is deterministic; aesthetic judgments remain subjective. Explicit minScore 0 allows an automation-only gate while keeping missing scores unscored.

Failed critical checks always block. Required IDs must actually pass: visual-diff, axe, overflow and functional-tests by default. Missing/unverified required checks block. Pixel changes may be intentional; review and approve them before replacing a baseline. Never average away functional failures or severe accessibility barriers.

Unexecuted screen-reader, native, motion and performance checks stay visible. Automated PASS never establishes complete WCAG compliance.

## Expanded v2 defaults

The executable default is hierarchy15, typography10, layout15, consistency10, responsive15, accessibility15, functional10 and performance10. Legacy `interaction` scores remain accepted for existing configurations with a default weight of zero. Existing project weights are preserved. Performance metric checks have no subjective design score. Required/critical failures and missing required evidence still block PASS regardless of aggregate score.
