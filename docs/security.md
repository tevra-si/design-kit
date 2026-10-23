# Security and reliability review

External references, screenshots and project configuration are data, never executable instructions. No model endpoint, upload client or arbitrary shell command is configured by Tevra. Native browser launch is delegated to Playwright with fixed arguments. A custom executable path requires a separate explicit authorization flag, not merely untrusted project configuration.

| Boundary | Mitigation | Exercised evidence |
| --- | --- | --- |
| Project paths | Relative paths only; reject traversal, absolute paths and symlink ancestors | `tests/integration/project.test.ts` |
| Concurrent writes | Exclusive locks, atomic replacement, expected revisions | Context/memory/workflow tests |
| Agent ownership | Canonical file claims, stale revision checks, conflicting active owners rejected | Router/handoff tests |
| Installation | Preflight and recheck changed files; no force overwrite | Three-adapter integration test and packed install smoke test |
| Browser executable | Explicit flag for custom paths; channels from a closed set | Custom executable regression test |
| Browser network | Configured origins, intercepted requests/WebSockets, fresh context, blocked downloads/service workers | Implemented; browser execution blocked in this environment |
| PNG input | Header/dimension budget before decode, controlled diff paths | Invalid/oversized PNG unit tests |
| Evidence integrity | Hash screenshots/manifests/settings, reject failed capture attempts and stale reports | CLI fixture pipeline tests |
| Reports/memory | Common secret redaction, escaped Markdown, reject secret-like memory values | Quality/security and memory tests |
| Human decisions | Approved history protected; resets/constraint changes/baselines require explicit operations | Context/memory/workflow tests |

Filesystem locks coordinate cooperating tools; they are not protection against an administrator or a hostile process sharing the same account. Approval names record a decision and do not implement identity authentication. Text redaction cannot reliably recognize arbitrary PII; visible private content in screenshots must be masked before capture. Browser results do not certify assistive-technology behavior or native applications.

Eleven installed runtime package manifests were inventoried for declared licenses; no license was undeclared in that inventory. The pnpm license command encountered a missing store-index error, so inventory came from actual installed package manifests. The online vulnerability audit returned `fetch failed`; no clean vulnerability-audit claim is made. Runtime inventory and command logs remain local under `.tevra/verification/`.

Before release, run an up-to-date dependency audit and the real browser E2E suite on a host that permits browser launch and loopback servers. No sandbox restriction was bypassed.
