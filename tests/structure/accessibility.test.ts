import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

for (const [name, path] of [['nextjs', 'examples/nextjs-dashboard/out/index.html'], ['sveltekit', 'examples/sveltekit-workspace/build/index.html']] as const) {
  test(`${name}: built HTML passes scoped axe semantic checks (no browser/contrast claim)`, async () => {
    const html = await readFile(path, 'utf8');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost' });
    try {
      dom.window.eval(axe.source);
      const result: axe.AxeResults = await dom.window.axe.run(dom.window.document, { runOnly: { type: 'rule', values: ['document-title', 'html-has-lang', 'landmark-one-main', 'label', 'button-name', 'link-name', 'aria-valid-attr', 'aria-input-field-name'] } });
      assert.equal(result.violations.length, 0, result.violations.map(violation => violation.id).join(', '));
      const directory = resolve('.tevra/structural-a11y'); await mkdir(directory, { recursive: true });
      await writeFile(resolve(directory, `${name}.json`), JSON.stringify({ environment: 'jsdom static HTML; no hydration, geometry, contrast or screen-reader validation', ruleCount: 8, result }, null, 2));
    } finally { dom.window.close(); }
  });
}
