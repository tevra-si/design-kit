import { access } from 'node:fs/promises';
import { basename } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { chromium } from 'playwright';
import { agentDirectories, installSkills, isAgent } from '../../core/src/install.js';
import type { Agent } from '../../core/src/install.js';
import { analyzeProject } from '../../core/src/analyze.js';
import { defaultConfig, loadConfig, validateConfig } from '../../core/src/config.js';
import { createContext, contextPath, loadContext, updateContext } from '../../design-context/src/index.js';
import { migrateContext } from '../../design-context/src/migrate.js';
import { createFoundation, exportTokens } from '../../design-context/src/tokens.js';
import { validate } from '../../design-context/src/validation.js';
import { inspectMemory, resetMemory, updateMemory } from '../../design-memory/src/index.js';
import { isMissing, readJSON, redact, safePath, writeAtomic, writeJSON } from '../../filesystem/src/index.js';
import { flag, inputPath, numeric } from './arguments.js';
import type { Arguments } from './arguments.js';

export function agents(value: string): Agent[] {
  const list = value.split(',');
  return list.map(name => { if (isAgent(name)) return name; throw new Error(`Unknown agent: ${name}. Supported: ${Object.keys(agentDirectories).join(',')}`); });
}
async function exists(root: string, path: string): Promise<boolean> {
  try { await access(await safePath(root, path)); return true; } catch (error) { if (isMissing(error)) return false; throw error; }
}
export async function projectCommand(args: Arguments, root: string): Promise<unknown> {
  if (args.command === 'init') {
    let selected = flag(args, 'agents', 'codex');
    if (!args.flags.yes) {
      if (!process.stdin.isTTY) throw new Error('Non-interactive setup requires --yes; select --agents explicitly for CI');
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      try { selected = (await prompt.question(`Install for ${Object.keys(agentDirectories).join(',')} [${selected}]: `)).trim() || selected; }
      finally { prompt.close(); }
    }
    const targets = agents(selected);
    const inventory = await analyzeProject(root);
    if (!await exists(root, '.tevra/config.json')) await writeJSON(root, '.tevra/config.json', await exists(root, 'tevra.config.json') ? validateConfig(await readJSON(root, 'tevra.config.json')) : defaultConfig);
    if (!await exists(root, contextPath)) {
      const context = createContext(basename(root), 'project-owner');
      if (['react', 'nextjs', 'sveltekit', 'vue', 'react-native', 'expo', 'html'].includes(inventory.framework)) context.project.framework = inventory.framework;
      await writeJSON(root, contextPath, context);
    }
    if (!await exists(root, '.tevra/memory.json')) await writeJSON(root, '.tevra/memory.json', { version: 1, revision: 0, entries: [] });
    const installed = args.flags['skip-skills'] ? [] : await installSkills(root, targets);
    return { root, installed: installed.length, inventory, message: 'Project-local setup complete. Review .tevra/config.json before capture. No git commit or upload was performed.' };
  }
  if (args.command === 'doctor') {
    const config = await loadConfig(root); await loadContext(root);
    if (config.browser.executablePath && !args.flags['allow-custom-browser']) throw new Error('Custom executable requires --allow-custom-browser after reviewing its provenance');
    // Outside macOS Playwright resolves the Chrome channel path itself; --launch verifies it.
    const executable = config.browser.executablePath ?? (config.browser.channel !== 'chrome' ? chromium.executablePath() : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null);
    if (executable) await access(executable);
    let browserVersion: string | null = null;
    if (args.flags.launch) { const browser = await chromium.launch({ ...config.browser, headless: true }); try { browserVersion = browser.version(); } finally { await browser.close(); } }
    const installations = await Promise.all(Object.entries(agentDirectories).map(async ([agent, directory]) => ({ agent, directory, installed: await exists(root, `${directory}/design-research/SKILL.md`) })));
    return { node: process.version, executable, launchVerified: Boolean(args.flags.launch), browserVersion, installations, limits: 'Filesystem checks do not establish agent activation; browser presence alone does not establish launch capability.' };
  }
  if (args.command === 'context show') return loadContext(root);
  if (args.command === 'context validate') { await loadContext(root); return { valid: true, path: contextPath }; }
  if (args.command === 'analyze') return analyzeProject(root);
  if (args.command === 'validate') { const path = args.positional[0] ?? contextPath; const value = await readJSON(root, path); validate('design-context.schema.json', value); return { valid: true, path }; }
  if (args.command === 'context migrate') {
    const original = inputPath(args); const destination = flag(args, 'out', '.tevra/migrated-context.json');
    if (await exists(root, destination)) throw new Error('Migration destination exists; choose a fresh --out path');
    const context = migrateContext(await readJSON(root, original), flag(args, 'owner', 'project-owner'));
    await writeJSON(root, destination, context); return { destination, context };
  }
  if (args.command === 'context update') return updateContext(root, await readJSON(root, inputPath(args)), numeric(args, 'revision'), args.flags['approve-constraints'] === true);
  if (args.command === 'memory inspect' || args.command === 'memory list') return inspectMemory(root);
  if (args.command === 'memory reset') return resetMemory(root, args.flags.yes === true);
  if (args.command === 'memory update') {
    const entry = await readJSON(root, inputPath(args));
    const text = JSON.stringify(entry); if (redact(text) !== text) throw new Error('Possible secret in memory; remove it before persistence');
    return updateMemory(root, entry, numeric(args, 'revision'));
  }
  if (args.command === 'tokens generate') {
    if (!args.flags['new-system']) throw new Error('Foundation creation requires --new-system; inspect the existing system first');
    const current = await loadContext(root);
    if (Object.values(current.tokens).some(layer => Object.keys(layer).length > 0)) throw new Error('Existing tokens detected; preserve and extend the approved system explicitly');
    current.tokens = createFoundation(flag(args, 'brand', '#175a44'));
    return updateContext(root, current, current.revision);
  }
  if (args.command === 'tokens export') {
    const context = await loadContext(root); const output = exportTokens(context.tokens);
    await writeAtomic(root, '.tevra/exports/tokens.css', output.css); await writeAtomic(root, '.tevra/exports/tailwind.css', output.tailwind); await writeAtomic(root, '.tevra/exports/tokens.json', output.portable);
    return { files: ['.tevra/exports/tokens.css', '.tevra/exports/tailwind.css', '.tevra/exports/tokens.json'] };
  }
  throw new Error(`Unsupported project command: ${args.command}`);
}
