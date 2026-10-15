// Railway 등에서 index.html 과 docs/ 를 내보내는 작은 정적 서버 (추가 패키지 없음)
// 실행: npm start  → http://localhost:3000  (Railway 는 PORT 환경변수를 자동으로 넣어 줌)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.md': 'text/markdown; charset=utf-8' };
const ALLOW = /^\/(index\.html|docs\/[\w.-]+|CREDITS\.md)$/;   // 내보낼 파일만 허용
const cache = new Map();

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/' || path === '') path = '/index.html';
    if (path === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
    if (!ALLOW.test(path)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('없는 페이지입니다'); }
    const file = join(ROOT, normalize(path));
    const info = await stat(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    const gz = /gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|json|markdown/.test(type);
    const key = file + (gz ? ':gz' : '');
    let body = cache.get(key);
    if (!body || body.mtime !== info.mtimeMs) {
      const raw = await readFile(file);
      body = { data: gz ? gzipSync(raw, { level: 9 }) : raw, mtime: info.mtimeMs };
      cache.set(key, body);
    }
    res.writeHead(200, { 'content-type': type, 'content-length': body.data.length, 'cache-control': 'public, max-age=300',
      ...(gz ? { 'content-encoding': 'gzip', vary: 'accept-encoding' } : {}) });
    res.end(req.method === 'HEAD' ? undefined : body.data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('없는 페이지입니다');
  }
}).listen(PORT, () => console.log(`하리 배경화면: http://localhost:${PORT}`));
