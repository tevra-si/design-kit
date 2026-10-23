import { chromium } from 'playwright';
import axe from 'axe-core';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, stat } from 'node:fs/promises';
import type { Config } from '../../contracts/src/index.js';
import { isMissing, redact, safePath, withLock, writeJSON } from '../../filesystem/src/index.js';
import type { CaptureManifest } from './types.js';

declare global { interface Window { axe: typeof axe } }

export function configHash(config: Config): string {
  return createHash('sha256').update(JSON.stringify({ baseURL: config.baseURL, origins: config.permittedOrigins, browser: config.browser, viewports: config.viewports, routes: config.routes, readySelector: config.readySelector, colorScheme: config.colorScheme ?? 'light', reducedMotion: config.reducedMotion ?? 'reduce' })).digest('hex');
}
export function manifestHash(manifest: CaptureManifest): string { return createHash('sha256').update(JSON.stringify(manifest)).digest('hex'); }
export function comparisonSettingsHash(config: Config): string { return createHash('sha256').update(JSON.stringify({ diffRatio: config.thresholds.diffRatio, pixelSensitivity: config.thresholds.pixelSensitivity })).digest('hex'); }
export async function capture(root: string, config: Config, kind: CaptureManifest['kind'], revision: number, approveBaseline = false, allowCustomBrowser = false): Promise<CaptureManifest> {
  if (config.browser.executablePath && !allowCustomBrowser) throw new Error('Custom browser executable requires explicit --allow-custom-browser authorization');
  if (kind === 'baseline' && !approveBaseline) throw new Error('Baseline capture requires explicit --approve-baseline authorization');
  return withLock(root, '.tevra/visual.lock', async () => {
    if (kind === 'baseline') {
      try { await stat(await safePath(root, '.tevra/artifacts/baseline/manifest.json')); throw new Error('Baseline already exists; archive it explicitly before establishing a new baseline'); }
      catch (error) { if (!isMissing(error)) throw error; }
    }
    const runId = randomUUID();
    await writeJSON(root, `.tevra/artifacts/${kind}/attempt.json`, { status: 'running', runId });
    try {
      const browser = await chromium.launch({ ...config.browser, headless: true, timeout: config.timeoutMs });
      try {
      const manifest: CaptureManifest = { version: 1, kind, runId, createdAt: new Date().toISOString(), configHash: configHash(config), contextRevision: revision, browserVersion: browser.version(), entries: [] };
      for (const route of config.routes) for (const state of route.states) for (const viewport of config.viewports) {
        const id = `${route.name}--${state.name}--${viewport.name}`;
        const file = `.tevra/artifacts/${kind}/${runId}/${id}.png`;
        const path = await safePath(root, file); await mkdir(await safePath(root, `.tevra/artifacts/${kind}/${runId}`), { recursive: true });
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: config.reducedMotion ?? 'reduce', colorScheme: config.colorScheme ?? 'light', locale: 'en-US', timezoneId: 'UTC', serviceWorkers: 'block', acceptDownloads: false });
        try {
          await context.routeWebSocket('**/*', socket => {
            const url = new URL(socket.url()); url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
            if (config.permittedOrigins.includes(url.origin)) socket.connectToServer(); else socket.close();
          });
          await context.route('**/*', async request => {
            const url = new URL(request.request().url());
            if (['data:', 'blob:', 'about:'].includes(url.protocol) || config.permittedOrigins.includes(url.origin)) await request.continue();
            else await request.abort('blockedbyclient');
          });
          const page = await context.newPage(); page.setDefaultTimeout(config.timeoutMs);
          const consoleErrors: string[] = []; const networkErrors: string[] = []; let assertions = 0;
          page.on('console', message => { if (message.type() === 'error') consoleErrors.push(redact(message.text())); });
          page.on('requestfailed', request => networkErrors.push(redact(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`)));
          page.on('response', response => { if (response.status() >= 400) networkErrors.push(redact(`HTTP ${response.status()} ${response.url()}`)); });
          const pageErrors: string[] = []; page.on('pageerror', error => pageErrors.push(redact(error.message)));
          const response = await page.goto(new URL(route.path, config.baseURL).href, { waitUntil: 'load', timeout: config.timeoutMs });
          if (!response?.ok()) throw new Error(`Route failed with HTTP ${response?.status() ?? 'no response'}: ${route.name}`);
          if (!config.permittedOrigins.includes(new URL(page.url()).origin)) throw new Error(`Redirect outside permitted origins: ${route.name}`);
          if (config.readySelector) await page.locator(config.readySelector).waitFor({ state: 'attached' });
          for (const action of state.actions) {
            const control = page.locator(action.selector);
            if (action.type === 'click') await control.click();
            else if (action.type === 'check') await control.check();
            else if (action.type === 'fill') { if (action.value === undefined) throw new Error('fill requires a value'); await control.fill(action.value); }
            else if (action.type === 'press') { if (action.value === undefined) throw new Error('press requires a value'); await control.press(action.value); }
            else {
              if (action.type === 'expect-visible') await control.waitFor({ state: 'visible' });
              else if (action.type === 'expect-hidden') await control.waitFor({ state: 'hidden' });
              else if (action.type === 'expect-checked') { if (!await control.isChecked()) throw new Error(`Expected checked control: ${action.selector}`); }
              else { if (action.value === undefined) throw new Error('expect-text requires a value'); await control.filter({ hasText: action.value }).waitFor({ state: 'visible' }); }
              assertions += 1;
            }
          }
          if (state.waitFor) await page.locator(state.waitFor).waitFor({ state: 'visible' });
          await page.waitForFunction(() => document.fonts.status === 'loaded');
          for (const selector of state.masks) if (!await page.locator(selector).count()) throw new Error(`Mask matches no elements: ${selector}`);
          await page.addScriptTag({ content: axe.source });
          const accessibility = await page.evaluate(async () => {
            return window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
          });
          const geometry = await page.evaluate(() => {
            const overflow: string[] = []; const smallTargets: string[] = [];
            for (const element of document.querySelectorAll('body *')) {
              const box = element.getBoundingClientRect(); const style = getComputedStyle(element);
              if (!box.width || !box.height || style.visibility === 'hidden' || style.display === 'none') continue;
              if (box.right > innerWidth + 1 || box.left < -1) {
                let ancestor = element.parentElement; let scrollable = false;
                while (ancestor && ancestor !== document.body) { if (['auto', 'scroll'].includes(getComputedStyle(ancestor).overflowX)) { scrollable = true; break; } ancestor = ancestor.parentElement; }
                if (!scrollable) overflow.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`);
              }
              if (element.matches('button,input:not([type=hidden]),select,[role=button]') && (box.width < 24 || box.height < 24)) smallTargets.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`);
            }
            if (document.documentElement.scrollWidth > innerWidth + 1) overflow.push('document-horizontal-overflow');
            return { overflow: [...new Set(overflow)].slice(0, 100), smallTargets: [...new Set(smallTargets)].slice(0, 100) };
          });
          await safePath(root, file);
          const pixelArea = await page.evaluate(() => innerWidth * Math.max(document.documentElement.scrollHeight, innerHeight));
          if (pixelArea > 40_000_000) throw new Error('Rendered page exceeds the 40 million pixel capture limit');
          const image = await page.screenshot({ path, fullPage: true, animations: 'disabled', mask: state.masks.map(selector => page.locator(selector)), maskColor: '#777777' });
          manifest.entries.push({ id, route: route.name, state: state.name, viewport, file, imageHash: createHash('sha256').update(image).digest('hex'), masks: state.masks, ...geometry,
            axeViolations: accessibility.violations.map(violation => ({ id: violation.id, impact: violation.impact ?? 'unknown', targets: violation.nodes.map(node => node.target.join(' ')), help: violation.help })),
            incompleteRules: accessibility.incomplete.map(rule => rule.id), pageErrors, consoleErrors, networkErrors, assertions });
        } finally { await context.close(); }
      }
      await writeJSON(root, `.tevra/artifacts/${kind}/manifest.json`, manifest);
      await writeJSON(root, `.tevra/artifacts/${kind}/attempt.json`, { status: 'passed', runId });
      return manifest;
      } finally { await browser.close(); }
    } catch (error) {
      await writeJSON(root, `.tevra/artifacts/${kind}/attempt.json`, { status: 'failed', runId, error: redact(error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  });
}
