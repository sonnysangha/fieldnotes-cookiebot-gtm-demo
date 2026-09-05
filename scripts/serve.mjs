import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('public');
http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Demo at http://127.0.0.1:4173'));
