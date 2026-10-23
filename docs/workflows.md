# Workflows and commands

`tevra-design help` documents every command. All commands accept `--root` after the command; file arguments are project-relative. Exit codes: 0 success, 1 failed checks/quality gate, 2 invalid input/environment error.

## Design and implementation

```sh
tevra-design analyze
tevra-design search "form error validation mobile" --category ux --limit 5
tevra-design plan "Build a new dashboard" --mode standard --max-minutes 60 --max-steps 9 --max-refinements 2
tevra-design plan "Improve this pricing card" --mode quick
tevra-design plan "Convert screenshot to React" --mode full
```

Plans select skills, dependencies and budgets. Quick mode omits general research/responsive steps and allows no retries. Full mode permits bounded refinements. The CLI records work; the coding agent reads the selected skill and performs implementation. It does not dispatch or control an external agent.

```sh
tevra-design workflow start .tevra/plans/PLAN.json --skill ui-redesign
tevra-design workflow complete .tevra/plans/PLAN.json --skill ui-redesign --evidence redesign-plan.md
tevra-design workflow fail .tevra/plans/PLAN.json --skill ui-builder --evidence failed-test.log
tevra-design workflow status .tevra/plans/PLAN.json
tevra-design workflow approve .tevra/plans/PLAN.json --by project-owner --yes
```

Dependencies must pass before starting work. Completion/failure needs an existing evidence file; retries and wall-clock budgets are enforced. Approval records an authorized human decision, not authentication. `handoff validate` and `handoff save` use `schemas/handoff.schema.json`, check revision freshness and reject overlapping active file claims.

## Context, tokens and memory

```sh
tevra-design validate
tevra-design context migrate examples/design-context.json --out .tevra/migrated-context.json --owner project-owner
tevra-design context update candidate-context.json --revision 0
tevra-design memory inspect
tevra-design memory update approved-entry.json --revision 0
tevra-design memory reset --yes
tevra-design tokens generate --new-system
tevra-design tokens export
```

Migration preserves the source and refuses an existing destination. Original schemaVersion 1.0.0 and master-prompt version 1.0 migrate to version 2.0. Updates require the current revision, protect ownership/approved decisions and require `--approve-constraints` for changed constraints. Append a superseding decision instead of erasing an approved one.

Memory entries require id, kind, text, approved, owner and updatedAt. Supported kinds: direction, tokens, convention, rejected, redesign, constraint and regression. JSON remains inspectable/editable; secret-like content is rejected, approved entries are immutable through ordinary updates, and reset requires confirmation.

Foundation generation requires `--new-system` and refuses existing tokens. Exports create portable JSON, tokens.css and CSS-first Tailwind under `.tevra/exports`; they do not modify application themes.

## Capture and review

Start the real application separately and configure its origins, routes, states, masks and viewport matrix.

```sh
tevra-design doctor --launch
tevra-design capture --kind baseline --approve-baseline
tevra-design capture --kind current
tevra-design compare
tevra-design a11y
tevra-design report --checks behavior-and-review-checks.json
tevra-design review --checks behavior-and-review-checks.json
```

Capture saves actual screenshots, axe violations/incomplete rules, browser runtime errors, overflow and touch-target heuristics. Actions are click, fill, press and check; missing mask selectors fail. Browser version, context revision and capture configuration identity are recorded. Only configured HTTP(S) origins are loaded; asset origins need explicit permission.

Comparison generates real PNG diffs and changed-pixel ratios. Mismatched configurations, screenshot sets, browser versions or context revisions fail. Failed latest captures and stale comparisons cannot produce a report. Baselines are protected: after an authorized review, archive the baseline directory explicitly before creating another. Current runs use unique artifact directories.

`review` performs capture → compare → report; an agent performs any bounded refinement. `a11y` captures fresh current evidence, so compare again afterward. Static screenshots cannot verify motion, keyboard or screen-reader behavior.

Additional checks are arrays validated by `schemas/checks.schema.json`. Add a deterministic `functional-tests` check only after actually running behavior tests, pointing to their log. AI/human assessments must use their corresponding evidence kind and real screenshot/review evidence. Never fabricate a passing log or score.

Default scoring requires evidence for all eight categories. Explicit minScore 0 enables an automation-only gate; absent judgments remain unscored and required checks still block. Markdown/JSON reports go to `.tevra/reports` with secret redaction and stated limits.
