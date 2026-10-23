import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isMissing, safePath } from '../../filesystem/src/index.js';

export async function analyzeProject(root: string): Promise<{ framework: string; styling: string[]; systemFiles: string[]; instructions: string[] }> {
  let manifest: unknown = {};
  try { manifest = JSON.parse(await readFile(await safePath(root, 'package.json'), 'utf8')); } catch (error) { if (!isMissing(error)) throw error; }
  const dependencies = new Set<string>();
  if (manifest && typeof manifest === 'object') for (const section of ['dependencies', 'devDependencies']) {
    if (section in manifest) {
      const value: unknown = Reflect.get(manifest, section);
      if (value && typeof value === 'object') for (const key of Object.keys(value)) dependencies.add(key);
    }
  }
  const framework = ['next', '@sveltejs/kit', 'expo', 'react-native', 'vue', 'react'].find(name => dependencies.has(name)) ?? 'unknown';
  const styling = ['tailwindcss', 'styled-components', '@emotion/react'].filter(name => dependencies.has(name));
  const systemFiles: string[] = []; const instructions: string[] = [];
  async function scan(directory: string, depth: number): Promise<void> {
    if (depth > 3 || systemFiles.length >= 200) return;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || /^(node_modules|dist|build|\.git|\.next|\.svelte-kit)$/u.test(entry.name)) continue;
      const full = resolve(directory, entry.name); const local = full.slice(root.length + 1);
      if (entry.isDirectory()) await scan(full, depth + 1);
      else if (/^(CLAUDE|AGENTS)\.md$/u.test(entry.name)) instructions.push(local);
      else if (/(token|theme|global|design.system|component).*\.(css|json|md|tsx|ts|vue|svelte)$/iu.test(entry.name)) systemFiles.push(local);
    }
  }
  await scan(root, 0);
  return { framework: framework === 'next' ? 'nextjs' : framework === '@sveltejs/kit' ? 'sveltekit' : framework, styling: styling.length ? styling : ['inspect-css'], systemFiles, instructions };
}
