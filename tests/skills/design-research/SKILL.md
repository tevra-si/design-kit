---
name: design-research
description: Investigate a product brief, its users, existing experience, and current design system before proposing UI. Use at the start of new product UI, redesigns, or when requirements and evidence are unclear.
---

# Design Research

Create a traceable product and UX brief that gives the next skill enough evidence to make a sound design decision. Research the actual project, not an imagined ideal product.

## Required inputs

- User request or product brief.
- Relevant repository or design artifacts when available.
- Existing design-system instructions, tokens, component library, and examples.

If an input is missing, continue with available evidence and mark the gap. Ask only for information that could materially change the design or user flow.

## Workflow

### 1. Read project rules and inspect the existing system first

Read project instructions (`AGENTS.md`, `CLAUDE.md`, or equivalents) and locate the active design system before proposing visual changes. Inspect relevant sources, not the whole repository by default:

- Design-system docs, brand guidance, product principles, and Figma/spec links already in the project.
- Theme and token definitions: color, typography, spacing, shape, elevation, motion, breakpoints.
- Shared components and examples of similar screens.
- Routes, screen behavior, responsive rules, localization, and existing accessibility conventions.

Record the system's source of truth and note where it is incomplete or contradictory. Project instructions and the active system take precedence over Tevra examples.

### 2. Frame the user problem

Extract the product goal, target users, their context, primary task, success condition, platform, and business or technical constraints. Separate what the user stated from what the agent inferred. Do not invent personas, metrics, interviews, or user quotes.

### 3. Build an evidence ledger

For each important claim, record:

| Claim | Source | Confidence | Design consequence |
|---|---|---|---|
| Concise factual statement | File, URL, user brief, or observation | `observed`, `reported`, `inferred`, `unknown` | What this changes in the experience |

Prefer, in order: direct user/product evidence; project analytics or research already supplied; platform documentation and standards; reputable domain sources; clearly labeled inference. A screenshot supports visible-layout claims, not unobserved usability or performance claims.

### 4. Map tasks, states, and constraints

Describe the main flow in user language, including the entry point, decision/action, feedback, completion, and recovery path. Identify relevant loading, empty, error, success, disabled, offline, permission, and destructive-confirmation states. Do not include irrelevant states just to fill a checklist.

Check constraints for accessibility, responsive behavior, localization, privacy, security, content, brand, existing routes/components, and supported devices. Name the standard or project rule when making a compliance claim; otherwise label it as a check still needed.

### 5. Deliver the research brief

Use `templates/research-brief.md` when the kit is available. Provide:

- User goal and success condition.
- Audience/context, with evidence and assumptions separated.
- Primary flow and important edge states.
- Existing design-system inventory and extension constraints.
- Evidence ledger and confidence.
- Risks, open questions, and design implications.

Include at most three open questions. If an answer is not essential to proceed, state a reversible assumption and move on.

## Handoff contract

Pass concise findings to `design-direction`. The handoff must identify the project design-system source of truth, which components/tokens should be reused, and any known gaps. Do not choose a visual concept or write implementation code in this skill.

## Completion criteria

- Goal, audience, primary flow, platform, and constraints are explicit or marked unknown.
- Evidence and inference are distinguishable and sourced.
- Existing design system has been inspected before any new design proposal.
- Material states and recovery paths are identified.
- No fabricated research claims or unsupported compliance statements remain.
