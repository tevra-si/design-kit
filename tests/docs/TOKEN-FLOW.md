# Token flow estimate

## Available logs

Tevra has not been installed globally and has no runs yet, so there are no Tevra usage logs to measure real tokens. The local logs found belong to other Claude Code projects and are not used as a proxy for Tevra. The current Codex interface does not expose per-skill/per-call token logs in this session.

The estimates below are based on file sizes and a sample workflow, not model measurements. Error can be large depending on the model, codebase, images, conversation retention and the platform's caching.

## Prompt cost of the skill set

The four `SKILL.md` files are currently about **2,130 words / 15,215 characters**, roughly **2.8–3.5k tokens** if the whole set is loaded. Each skill alone is about **0.65–0.9k tokens**. In a normal workflow the agent only needs to load the active skill. Schemas, rubrics and templates should be read only at the step that needs them.

| Step | Skill instructions | Accompanying docs/context | Estimated input | Estimated output |
|---|---:|---|---:|---:|
| Research | 0.75k–0.95k | Brief, project instructions, part of the existing UI | 3k–7.5k | 0.5k–1.2k |
| Direction | 0.7k–0.9k | Research brief, schema, current tokens/system | 3k–6.5k | 0.5k–1.2k |
| UI build | 0.65k–0.85k | Context, relevant components/source, repo conventions | 5.5k–15.5k | 2k–8k |
| Visual review | 0.6k–0.8k | Rubric, context, screenshot(s), viewport | 3k–6.5k | 0.4k–1k |

### Reference totals

- **One skill, one pass**: usually 3k–7.5k input and 0.4k–1.2k output; the build step can be significantly higher.
- **All four steps, one round**: about **14.5k–36k input** and **3.4k–11.4k output**.
- **Each extra fix/review round**: about **2.5k–6.5k input + 0.5k–2k output**, excluding large code changes or extra images.

These are estimated conversation-footprint tokens. Billed tokens may be lower if the provider caches repeated prompt parts; screenshots can increase input depending on resolution and how the model processes images. Do not infer USD cost without knowing the model and applicable pricing.

## Saving tokens

1. Invoke only the skill that fits the current step; do not paste all four files into every prompt.
2. Read the design-system docs and relevant components/source; do not load the whole repository when the relevant area can be found.
3. Keep a short `design-context.json`; update decisions instead of repeating the whole brief in conversation.
4. Capture screenshots at the exact viewport and state under review; prefer one clear image per evaluated viewport.
5. Batch BLOCK/MAJOR issues into one fix pass and recapture; avoid polish rounds that do not change the rubric score.

## Measuring after installation

Log each run as JSONL with `timestamp`, `agent`, `model`, `skill`, `input_tokens`, `output_tokens`, `cached_input_tokens` (if available), `task_id`, `step` and `note`. Store only token metadata, never prompts, source code or screenshots. Cross-check against the agent's `/cost` or `/usage`; do not mix Codex and Claude Code numbers. Once there are at least 10 runs, replace the reference ranges above with per-skill p50/p90.
