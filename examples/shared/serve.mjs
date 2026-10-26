import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'out');
const port = Number(process.argv[3] ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Port must be an integer from 1024 to 65535');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }); response.end(await readFile(path));
  } catch (error) { response.writeHead(error instanceof URIError ? 400 : 404); response.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Serving ${root} at http://127.0.0.1:${port}\n`));
process.on('SIGTERM', () => server.close()); process.on('SIGINT', () => server.close());
