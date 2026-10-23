# Expanded v2 implementation decisions

## Boundaries

The workspace root is the repository root. No nested kit directory is introduced. The previous TypeScript engines remain in place; packages are added only for registry, workflow execution and performance. CLI imports domain engines; registry imports validation/filesystem/contracts only. No engine imports CLI. Native Agent Skills remain usable without the CLI.

## Metadata and instructions

Twelve canonical skill directories are independent instructional entrypoints. Registry v1 describes skills without reading their instructions. Extensions are explicit project-relative metadata files; they cannot register shell commands or silently launch an agent. Static capability selection replaces overlapping work with one selected owner; dependencies are topologically expanded and conflicts fail visibly. See capability-ownership.md.

## Execution

`workflow plan` records the request, steps, dependencies, mode, time/step/refinement budgets, context revision and approval. `workflow run` uses named internal adapters for capture-based browser/responsive/accessibility review, visual comparison and Lighthouse. Instructional coding/design stages are blocked until the coding agent executes them and submits evidence using the manual workflow commands. No external LLM invocation is simulated.

Running stages become passed, failed, blocked or skipped. Passed steps are retained on resume. Failed stages retry at most maxRefinements times; blocked environment/integration stages are not automatically retried and do not consume the failure-refinement budget. Pending dependent stages remain pending. Stale context, overlapping runner execution, unapproved high-impact work and invalid dependency order fail before execution. The runner result describes workflow status, not a claim of full accessibility or design approval.

## Context and compatibility

Context v2.0 gains optional brand, approvedDirection, responsiveRequirements, knownRegressions and provenance fields. This is an additive schema revision; existing v2 contexts remain valid and both v1 migrations remain available. Approved direction records are immutable, as are existing approved decisions. Changing established brand rules requires explicit constraint approval. Project ownership, optimistic revisions and atomic writes remain enforced.

The new quality defaults use hierarchy15, typography10, layout15, consistency10, responsive15, accessibility15, functional10 and performance10. Legacy interaction weighting remains accepted; its default is zero. Existing project configs are never silently rewritten. Scores remain separately labeled judgments; deterministic performance checks expose measured values/budgets without inventing design scores.

## Browser and performance

Browser capture adds explicit expect-visible/hidden/text/checked assertions plus separate console, request-failure and HTTP-error evidence. A functional gate requires assertions in every configured state; this measures configured coverage, not every possible product behavior. Dynamic masks, browser contexts, viewport matrix and baseline approval remain unchanged.

Lighthouse runs as a bounded subprocess with an argument array and shell disabled. A new browser process is used, with the reviewed executable and explicit network authorization. Unlike Playwright capture's per-origin interception, Lighthouse may load all target resource origins after `--allow-network`; only audit applications whose resource access is approved. Error reporting is disabled. JSON/HTML reports are redacted before persistence. Lab LCP/CLS/TBT are never described as real-user INP. Production browser execution remains an acceptance requirement.

## Distribution

The package includes the registry, schemas and compiled engine modules. Installing canonical skills preserves conflicting local files. Source distribution excludes node_modules, browser binaries, private context, captures and credentials. ZIP generation is not part of this requested update. Prior ZIP artifacts are not current evidence.
