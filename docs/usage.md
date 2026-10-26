# Usage

Tevra has two halves that work together:

- **Skills** are instructions your coding agent reads and follows. You use them by asking the agent for something.
- **The `tevra-design` CLI** plans work and produces evidence: screenshots, pixel diffs, axe results, Lighthouse metrics and quality reports. It never calls an LLM.

Every command accepts `--root <project>`; other paths are relative to that project. Run `tevra-design help` for the full list.

**Exit codes:** `0` success, `1` a check or quality gate failed (or a workflow is blocked), `2` invalid input or environment error. Read the JSON output as well as the exit code.

## Working with skills

Ask for the outcome in plain language; the agent picks the matching skill from its description. You can also name one directly (`/tevra:ui-redesign` with the Claude Code plugin, `/ui-redesign` with a project install).

| You want to… | Skill chain the router suggests |
| --- | --- |
| Build a new screen | research → direction → system → builder → responsive → visual review → accessibility |
| Improve an existing component | redesign → builder → visual review |
| Turn a screenshot into code | direction → builder → responsive → visual review → accessibility |
| Fix one concern (motion, responsive, accessibility, performance, tests, review) | that skill alone, plus the builder when code changes |

Preview the chain before starting:

```sh
tevra-design workflow plan "Improve this pricing card" --mode quick
```

| Mode | Behavior |
| --- | --- |
| `quick` | Drops general research and secondary steps; no retries |
| `standard` | Default chain with a refinement budget |
| `full` | Adds accessibility and QA stages (frontend review, browser testing, performance) |

Plans record steps, dependencies, step/time/refinement budgets and the context revision. Work that changes shared tokens or brand, or a transformative redesign, is marked `approvalRequired` and waits for a human.

## Research and design data

```sh
tevra-design analyze                                        # detected framework, styling, design-system files, agent instructions
tevra-design search "form error validation mobile" --category ux --limit 5
tevra-design tokens generate --new-system --brand '#175a44' # only when the project has no tokens yet
tevra-design tokens export                                  # JSON, tokens.css and CSS-first Tailwind under .tevra/exports
```

`search` ranks a small local catalog by lexical relevance (BM25). Results carry source, confidence and license; a high score means "matches the words", not "is true". It cannot tell what is currently trending.

`tokens generate` refuses to run when tokens already exist. Exports never modify your application theme; you choose what to import.

## Checking a running app

Start the app first, then configure its origin, routes and states in `.tevra/config.json` (see [configuration](configuration.md)).

```sh
tevra-design doctor --launch                              # browser can start
tevra-design capture --kind baseline --approve-baseline   # after a human approves the current screens
tevra-design capture                                      # current screenshots for every route/state/viewport
tevra-design compare                                      # pixel diff against the baseline
tevra-design a11y                                         # fresh capture with axe results
tevra-design report                                       # .tevra/reports/quality.{json,md,html}
```

Shortcuts that bundle these steps:

```sh
tevra-design test browser          # requires explicit assertions in every state
tevra-design test visual           # capture + compare + report
tevra-design test accessibility
tevra-design test performance --allow-network --lcp-ms 2500 --cls 0.1 --tbt-ms 200
tevra-design review                # capture → compare → report
```

What each capture records:

- Screenshots per route, state and viewport, with dynamic regions masked
- axe violations and incomplete rules (WCAG 2.0–2.2 A/AA tags)
- Console errors, failed requests and HTTP errors as separate findings
- Overflow and touch-target heuristics
- The browser version, context revision and a hash of the capture settings

Comparison fails when the configuration, screenshot set, browser version or context revision does not match the baseline. Reports refuse stale comparisons or failed captures.

**Baselines are protected.** They are created only with `--approve-baseline` and never overwritten by `compare`. To replace one, archive the baseline folder yourself after review, then capture again.

**Performance** runs Lighthouse in a separate browser. `--allow-network` is required because the page may load third-party resources; review those origins first. Results are lab metrics (LCP, CLS, TBT) and do not represent real-user data such as INP.

## Adding your own evidence

Agents and humans can add checks that automation cannot make, such as a keyboard walkthrough, a screen-reader pass or a design judgment:

```sh
tevra-design report --checks review-checks.json
```

Checks follow `schemas/checks.schema.json`. Each check names its evidence kind (`deterministic`, `heuristic`, `ai` or `human`) and points to an existing local file as evidence. Add a passing `functional-tests` check only after actually running the behavior tests. The report keeps the four evidence kinds separate.

The default rubric scores eight categories (hierarchy, typography, layout, consistency, responsive, accessibility, functional, performance). A category without evidence stays unscored. A critical failure or a missing required check blocks PASS regardless of the total.

## Executing a workflow

```sh
tevra-design workflow plan "Build a dashboard" --mode full
tevra-design workflow start  .tevra/plans/PLAN.json --skill design-research
tevra-design workflow complete .tevra/plans/PLAN.json --skill design-research --evidence design-research.md
tevra-design workflow run    .tevra/plans/PLAN.json        # runs the local QA stages
tevra-design workflow status .tevra/plans/PLAN.json
tevra-design workflow approve .tevra/plans/PLAN.json --by "Product owner" --yes
```

The coding agent carries out design and implementation stages, then marks them complete with an evidence file. `workflow run` executes the stages Tevra can run itself (browser, visual, accessibility, performance). Stages missing an app, browser or integration are reported `blocked`, never passed. Failed stages retry up to the plan's refinement budget. `approve` records a named human decision; it is not authentication.

## Shared context and memory

```sh
tevra-design context show
tevra-design context validate
tevra-design context update candidate.json --revision 3 [--approve-constraints]
tevra-design context migrate old-context.json --out .tevra/migrated-context.json
tevra-design memory list
tevra-design memory update entry.json --revision 2
tevra-design memory reset --yes
tevra-design handoff validate handoff.json
tevra-design handoff save handoff.json
```

- **Context** (`.tevra/design-context.json`) holds brand, approved direction, tokens, responsive requirements, known regressions and provenance. Updates must quote the current revision. Approved decisions cannot be replaced by ordinary updates; append a superseding decision. Changing constraints needs `--approve-constraints`.
- **Memory** (`.tevra/memory.json`) is plain, inspectable JSON for decisions such as directions, rejected options and conventions. Entries that look like secrets are rejected. Reset needs `--yes`.
- **Handoffs** let several agents share work safely: each declares the files it owns, and Tevra rejects stale context revisions or overlapping file claims.

Nothing under `.tevra/` is committed or uploaded by Tevra.

## Examples

The repository includes runnable apps to try every command against:

| Example | What it shows | Start |
| --- | --- | --- |
| `examples/nextjs-dashboard` | Task app: add, validate, complete, remove, empty state | `pnpm --filter @tevra/example-nextjs build && pnpm --filter @tevra/example-nextjs start` (port 4173) |
| `examples/sveltekit-workspace` | The same app in SvelteKit | `pnpm --filter @tevra/example-sveltekit build && pnpm --filter @tevra/example-sveltekit start` (port 4174) |
| `examples/acceptance-app` | Analytics filters, pricing calculator and dialog, form validation, before/after redesign | see its [README](../examples/acceptance-app/README.md) |

Each example has a reviewed `tevra.config.json`. Point the CLI at it with `--root`, for example `tevra-design capture --root examples/nextjs-dashboard`.
