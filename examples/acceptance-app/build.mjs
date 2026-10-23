import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
const mode = process.argv[2] ?? 'after';
if (!['before', 'after'].includes(mode)) throw new Error('Design mode must be before or after');
const target = new URL('./build/', import.meta.url);
await mkdir(target, { recursive: true });
for (const name of ['app.mjs', 'model.mjs', 'style.css']) await copyFile(new URL(`./src/${name}`, import.meta.url), new URL(name, target));
const html = await readFile(new URL('./src/index.html', import.meta.url), 'utf8');
await writeFile(new URL('index.html', target), mode === 'before' ? html.replace('<body>', '<body class="before">') : html);
process.stdout.write(`Built acceptance application (${mode} presentation, shared behavior).\n`);
