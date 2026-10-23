# Context and execution cost

Discovery reads only the name/description of the twelve skills. After a workflow is chosen, the agent reads the matching SKILL.md and only the references needed for that stack/task. The local catalog returns at most the requested number of records; it never loads the whole dataset into context.

Quick mode trims general research steps and disables retries. Standard/full plans carry explicit budgets for steps, time and refinements. The CLI does not know the token usage of external agents and never reports fabricated token counts. Measure real usage with host-agent telemetry; record the model, input artifacts, workflow, number of fix rounds and tool calls when comparing.

Context revisions and handoffs carry only relevant artifacts, constraints and evidence; they never duplicate the whole conversation. Context and screenshots are never committed or uploaded automatically.
