import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { defaultConfig } from '../../packages/core/src/config.js';
import { capture } from '../../packages/visual-testing/src/capture.js';
import { kitRoot } from '../../packages/filesystem/src/resources.js';
import { writeJSON } from '../../packages/filesystem/src/index.js';

test('capture reaches a page behind a login only with a saved sign-in state, and never copies it into evidence', { timeout: 60000 }, async t => {
  const root = resolve(kitRoot(), '.tevra/e2e', `signed-in-${randomUUID()}`); await mkdir(root, { recursive: true });
  const server = createServer((request, response) => {
    if (!request.headers.cookie?.includes('session=sample-session-value')) { response.writeHead(401); response.end(); return; }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<!doctype html><html lang="en"><head><title>Account</title></head><body><main><h1>Account</h1></main></body></html>');
  });
  await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => done()); });
  t.after(() => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const url = `http://127.0.0.1:${address.port}`;
  const viewport = defaultConfig.viewports[0]; assert.ok(viewport);
  const signedOut = { ...defaultConfig, baseURL: url, permittedOrigins: [url], viewports: [viewport], routes: [{ name: 'account', path: '/', states: [{ name: 'default', actions: [], masks: [] }] }] };
  const signedIn = { ...signedOut, storageState: '.tevra/auth/state.json' };

  await assert.rejects(capture(root, signedOut, 'current', 0), /HTTP 401/u);
  await assert.rejects(capture(root, signedIn, 'current', 0), /Sign-in state not found: \.tevra\/auth\/state\.json/u);
  await writeJSON(root, '.tevra/auth/state.json', { cookies: [{ name: 'session', value: 'sample-session-value', domain: '127.0.0.1', path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] });
  const manifest = await capture(root, signedIn, 'current', 0);
  assert.equal(manifest.entries.length, 1);
  assert.doesNotMatch(await readFile(resolve(root, '.tevra/artifacts/current/manifest.json'), 'utf8'), /sample-session-value/u);
});
