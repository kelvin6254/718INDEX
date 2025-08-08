// 簡易靜態伺服器（無需任何 npm 套件）
// 用法："C:\\Program Files\\nodejs\\node.exe" dev-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5500;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function send(res, status, content, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(content);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return send(res, 404, 'Not Found');
      return send(res, 500, 'Internal Server Error');
    }
    send(res, 200, data, { 'Content-Type': type });
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURI(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath);

  // 安全：阻擋跳出目錄
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const indexHtml = path.join(filePath, 'index.html');
      return fs.existsSync(indexHtml)
        ? serveFile(res, indexHtml)
        : send(res, 403, 'Directory listing is disabled');
    }
    if (!err && stat.isFile()) {
      return serveFile(res, filePath);
    }
    // 找不到時，嘗試回傳根目錄 index.html（方便前端路由）；找不到則 404
    const fallback = path.join(ROOT, 'index.html');
    if (fs.existsSync(fallback)) return serveFile(res, fallback);
    return send(res, 404, 'Not Found');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});


