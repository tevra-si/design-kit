# Configuration

`tevra-design init` creates `.tevra/config.json`. To start from a reviewed file instead, place a `tevra.config.json` in the project root before running `init`. The file is validated against [`schemas/config.schema.json`](../schemas/config.schema.json); unknown fields are rejected.

## Minimal example

```json
{
  "version": 1,
  "baseURL": "http://localhost:3000",
  "permittedOrigins": ["http://localhost:3000"],
  "viewports": [
    { "name": "mobile", "width": 390, "height": 844 },
    { "name": "desktop", "width": 1440, "height": 900 }
  ],
  "routes": [
    {
      "name": "checkout",
      "path": "/checkout",
      "states": [
        { "name": "default", "actions": [], "masks": [] },
        {
          "name": "invalid-email",
          "actions": [
            { "type": "fill", "selector": "#email", "value": "not-an-email" },
            { "type": "click", "selector": "button[type=submit]" },
            { "type": "expect-visible", "selector": "#email-error" }
          ],
          "masks": ["[data-testid=order-number]"],
          "waitFor": "#email-error"
        }
      ]
    }
  ],
  "browser": {},
  "timeoutMs": 15000,
  "thresholds": { "diffRatio": 0.01, "pixelSensitivity": 0.1, "minScore": 75 },
  "weights": {
    "hierarchy": 15, "typography": 10, "layout": 15, "consistency": 10,
    "responsive": 15, "accessibility": 15, "interaction": 0, "functional": 10, "performance": 10
  },
  "requiredChecks": ["visual-diff", "axe", "overflow", "functional-tests"],
  "maxRefinements": 2
}
```

## Fields

| Field | Meaning |
| --- | --- |
| `baseURL` | Where the app runs. No credentials, query string or fragment |
| `permittedOrigins` | Exact HTTP(S) origins the browser may load. Requests to anything else are blocked; add asset or API origins explicitly |
| `viewports` | Named width × height profiles. Defaults: 390×844, 768×1024, 1280×800, 1440×900. Add intermediate or landscape sizes your product needs |
| `routes[].states` | Named page conditions to capture. Names use lowercase letters, digits and hyphens |
| `states[].actions` | Steps to reach the state (see below) |
| `states[].masks` | CSS/Playwright selectors hidden in screenshots. Each must match at least one element or capture fails |
| `states[].waitFor` | Selector that must be visible before capture |
| `readySelector` | Optional marker awaited before any action, useful for client-side hydration |
| `colorScheme` | `light` (default), `dark` or `no-preference` |
| `reducedMotion` | `reduce` (default, for repeatable captures) or `no-preference` |
| `browser` | `channel` (for example `chrome`, `msedge`) or `executablePath` |
| `timeoutMs` | Upper bound for browser waits |
| `thresholds.diffRatio` | Fraction of changed pixels allowed before a diff fails (0–1) |
| `thresholds.pixelSensitivity` | Color difference that counts as "changed" (0–1) |
| `thresholds.minScore` | Minimum rubric score (0–100). `0` disables the subjective-score requirement; required checks still apply |
| `weights` | Rubric weights, totalling 100 |
| `requiredChecks` | Check IDs that must pass for delivery |
| `maxRefinements` | Default retry budget for new plans |

### Actions

Actions use a closed vocabulary; arbitrary scripts are not supported.

| `type` | Uses | Effect |
| --- | --- | --- |
| `click` | `selector` | Clicks the element |
| `fill` | `selector`, `value` | Types into a field |
| `press` | `selector`, `value` | Presses a key on the element |
| `check` | `selector` | Checks a checkbox or radio |
| `expect-visible` / `expect-hidden` | `selector` | Asserts visibility |
| `expect-text` | `selector`, `value` | Asserts the element contains text |
| `expect-checked` | `selector` | Asserts a checked state |

Selectors are Playwright locators, so `button:has-text('Save')` works. `test browser` requires at least one `expect-*` assertion in every state; a click that does not throw is not evidence that the feature works.

## Privacy

- Never put real passwords, tokens or customer data in `value`. Use sample data.
- Mask anything private that can appear on screen (names, emails, ID numbers, plate numbers). Text redaction in reports cannot detect arbitrary personal data inside images.
- Reports redact URL query strings and common secret patterns.
- The kit's browser starts without cookies or storage, so pages behind a login redirect to your sign-in page. Test those pages with an agent that uses an already signed-in browser, or point Tevra at a test environment with public routes.

## Design controls

Visual direction is described with three integers from 1 to 10, stored in the design context:

| Control | Context field | Low values | High values |
| --- | --- | --- | --- |
| Variance | `design.variance` | Familiar composition | Experimental composition with explicit usability checks |
| Motion intensity | `design.motionIntensity` | State feedback only | Rich transitions with a documented task benefit and reduced-motion equivalent |
| Visual density | `design.visualDensity` | Reading-oriented | Dense comparison views |

Defaults are 5, 3 and 5. Controls never override accessibility, approved brand rules or project constraints.

## Extending Tevra

- **Research catalog:** add records to `references/ux-patterns/catalog.json` with a stable ID, source, license and confidence, plus a relevance test.
- **Third-party skills:** describe them in a registry extension file that follows `schemas/skill-registry.schema.json` and pass it with `--registry extension.json` to `skills list|inspect|validate|graph`. Extensions are metadata; they cannot register commands or executables.
- **Framework guidance:** add a focused file under `references/frameworks/` and link it from the skill that needs it, rather than loading every framework for every task.
