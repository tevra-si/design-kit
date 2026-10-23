import { createRequire } from 'node:module';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, resolve, parse } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const visited = new Set(); const records = [];
function inspect(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const identity = `${manifest.name}@${manifest.version}`;
  if (visited.has(identity)) return;
  visited.add(identity);
  const directory = dirname(manifestPath);
  const notices = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'NOTICE', 'NOTICE.txt', 'COPYING'].filter(name => existsSync(resolve(directory, name)));
  records.push({ name: manifest.name, version: manifest.version, license: typeof manifest.license === 'string' ? manifest.license : null, status: typeof manifest.license === 'string' ? 'manifest-declared' : 'review-required', notices, repository: manifest.repository ?? null });
  const require = createRequire(manifestPath);
  for (const dependency of Object.keys(manifest.dependencies ?? {}).sort()) {
    let entry;
    try { entry = require.resolve(`${dependency}/package.json`); }
    catch {
      try {
        let location = dirname(realpathSync(require.resolve(dependency)));
        while (location !== parse(location).root) {
          const candidate = resolve(location, 'package.json');
          if (existsSync(candidate) && JSON.parse(readFileSync(candidate, 'utf8')).name === dependency) { entry = candidate; break; }
          location = dirname(location);
        }
      } catch { /* An unresolved dependency stays explicitly unverified in the inventory. */ }
    }
    if (entry) inspect(entry);
    else records.push({ name: dependency, version: manifest.dependencies[dependency], license: null, status: 'unresolved', notices: [], requiredBy: identity });
  }
}
inspect(resolve(root, 'package.json'));
process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), scope: 'installed runtime dependency manifests; not legal clearance or vulnerability scanning', packages: records.sort((a, b) => a.name.localeCompare(b.name)) }, null, 2)}\n`);
