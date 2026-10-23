import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
import { kitRoot } from '../../packages/filesystem/src/resources.js';

test('acceptance app analytics, pricing dialog, keyboard and form survive targeted redesign', { timeout: 90000 }, async t => {
  const root = resolve(kitRoot(), 'examples/acceptance-app/build');
  await readFile(resolve(root, 'index.html'));
  const allowed = new Set(['index.html', 'style.css', 'app.mjs', 'model.mjs']);
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname.slice(1) || 'index.html';
    if (!allowed.has(path)) { response.writeHead(404); response.end(); return; }
    try { response.setHeader('content-type', extname(path) === '.html' ? 'text/html' : extname(path) === '.css' ? 'text/css' : 'text/javascript'); response.end(await readFile(resolve(root, path))); }
    catch { response.writeHead(500); response.end(); }
  });
  await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  t.after(() => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  for (const mode of ['before', 'after']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.goto(`http://127.0.0.1:${address.port}/?design=${mode}`);
      await page.locator('html[data-tevra-ready="true"]').waitFor();
      await page.getByLabel('Reporting month').selectOption('0'); assert.equal(await page.locator('#revenue').innerText(), '$18,200');
      await page.getByRole('button', { name: 'Choose Starter' }).click();
      assert.equal(await page.getByRole('dialog').isVisible(), true);
      await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').isVisible(), false);
      assert.equal(await page.getByRole('button', { name: 'Choose Starter' }).evaluate(element => document.activeElement === element), true);
      await page.getByLabel('Seats (1–100)').fill('2'); await page.getByLabel('Annual billing estimate').check();
      assert.match(await page.locator('#estimate').innerText(), /30.40/u);
      await page.getByRole('button', { name: 'Validate enquiry' }).click();
      assert.match(await page.getByRole('alert').innerText(), /name/u);
      assert.equal(await page.getByLabel('Name', { exact: true }).getAttribute('aria-invalid'), 'true');
      await page.getByLabel('Name', { exact: true }).fill('An'); await page.getByLabel('Email', { exact: true }).fill('an@example.test');
      await page.getByRole('button', { name: 'Validate enquiry' }).click();
      assert.match(await page.locator('#contact-success').innerText(), /validated locally/u);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    } finally { await page.close(); }
  }
});
