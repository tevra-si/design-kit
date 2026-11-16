# Working with Spec Kit and Superpowers

Tevra owns design, UI implementation and frontend QA. It does not own product specification or general engineering process. When a project already uses a tool for those, Tevra cooperates with it instead of duplicating it. Both integrations are optional: Tevra installs, bundles and modifies nothing from either project, and works the same without them.

| Concern | Tool present | Tool absent |
| --- | --- | --- |
| Specification, plan, tasks | [Spec Kit](https://github.com/github/spec-kit) owns them | Tevra's research and direction steps |
| Debugging, test-first and completion process | A general process skill such as [Superpowers](https://github.com/obra/superpowers) leads | Tevra's own skills cover it |
| Design, tokens, UI build, visual, accessibility and performance QA | Tevra | Tevra |

## Spec Kit

Verified against Spec Kit v1.4.0. Tevra only reads these files:

| File | Use |
| --- | --- |
| `.specify/feature.json` | The `feature_directory` key names the active feature |
| `<feature_directory>/spec.md` | Acceptance scenarios become plan criteria |
| `<feature_directory>/plan.md` | Presence is noted; contents are not read |

`tevra-design workflow plan` then behaves as follows:

- **Research is not repeated.** When the active feature has a `spec.md`, the plan omits `design-research` and records why under `routing.excluded`. Direction, tokens, build and QA steps stay.
- **Acceptance scenarios become criteria.** Scenario 2 of user story 1 becomes `AC-102`. Reordering user stories in the spec changes the IDs. Scenarios that still contain bracketed placeholders or open clarifications are skipped. Functional requirements (`FR-`) and success criteria (`SC-`) are not imported.
- **`--acceptance` wins.** A criteria file you pass replaces the imported scenarios.
- **Quick plans ignore Spec Kit.** `--mode quick`, or `--risk low` without a mode, never reads `.specify/`.
- **A broken pointer is an error.** Invalid JSON, a missing `feature_directory`, a directory outside the project or one that does not exist stops planning with a message, rather than silently falling back.

Tevra never writes into `.specify/` or a feature directory. Its own outputs stay under `.tevra/`.

```sh
# In a Spec Kit project with an active feature
tevra-design workflow plan "Build the checkout screen"
# ...implement, capture evidence, list covered criteria in your checks...
tevra-design report --plan .tevra/plans/PLAN.json --checks review-checks.json
```

See [usage](usage.md#acceptance-criteria) for how checks reference criteria.

## Superpowers and other process skills

The CLI cannot see which skills an agent has loaded, so this integration lives in skill text, not in code. `frontend-debugging` tells the agent to follow a general debugging or verification process skill when one is active in the session, and to use its own steps for frontend evidence: reproduction in a browser, console and network errors, rendered state.

Verified against the Superpowers v7.0.2 skill list. Only skill names were inspected; no Superpowers text is included in Tevra.

Whether an agent actually applies both skills together depends on that agent. Check the result rather than assuming it.
