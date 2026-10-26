# Flow guidance

Keep tests independent: fresh browser context and deterministic fixture per flow. Prefer role/name locators; use stable test IDs when accessible queries cannot identify the control. Never fabricate authentication accounts, mock external responses without explicit fixture scope, or record secrets in screenshots/reports.

Forms: submit invalid input, verify associated error, correct it, submit valid input and assert the resulting state. Dialogs: open by keyboard, verify initial focus, Tab containment where modal, Escape close and restored focus. Navigation: assert destination and reachable content, not merely click success.

In this kit, `tevra-design test browser` captures configured click/fill/press/check actions and expect-visible/hidden/text/checked assertions. Every configured state needs at least one assertion to pass the functional coverage gate. More complex flow assertions belong in Playwright test files; do not treat click completion as an assertion. Console errors, failed requests and HTTP errors are recorded separately. Existing runnable flows are in tests/e2e/browser.test.ts.

Example: “Restyle a form without breaking validation.” Run the invalid/valid submission test before and after; compare error accessibility and keyboard behavior.

Browser integration: [Playwright](https://playwright.dev/docs/test-assertions). Web checks do not validate native Expo interfaces; use platform tooling for native flows.
