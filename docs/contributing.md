# Contributing

Canonical skills live under `skills/`; installed folders are copies. Keep descriptions discriminating and instructions concise. Put conditional details in references and validate local links with `pnpm skills:check`. Add behavior tests for real changed contracts.

Production modules target fewer than 300 logical lines; split only at ownership boundaries. Runtime/type imports must remain acyclic toward contracts and filesystem primitives. Add schemas at new external boundaries and retain legacy context compatibility.

Before release run typecheck, unit/integration tests, example builds, structural checks and real browser E2E. Mark environmental/unexecuted checks separately. Test the packed CLI outside the source tree and every adapter in a fresh project. Review attribution, licenses and a current dependency audit. No check is passing without fresh evidence.
