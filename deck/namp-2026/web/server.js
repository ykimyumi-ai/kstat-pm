'use strict';
/**
 * 제안서 원문 편집기 — 사내망용 정적 서버 + 저장 API
 *
 * 의존성 0. 노드 내장 http/fs/crypto 만 쓴다. PPTX 생성은 브라우저에서 끝나므로
 * 서버가 할 일은 파일을 내주고 원문을 받아 적는 것뿐이다.
 *
 *   node web/server.js            → http://0.0.0.0:8080
 *   PORT=9000 node web/server.js
 *
 * 사내망 전제라 인증은 두지 않는다. 편집자 이름만 받아 저장 이력에 남긴다.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');          // deck/namp-2026
const WEB = __dirname;
const CONTENT = path.join(ROOT, 'content.json');
const HISTORY = path.join(WEB, '.history');
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.md': 'text/plain; charset=utf-8',
};

// URL 경로 → 실제 디렉터리. 여기 없는 접두사는 서빙하지 않는다.
const MOUNTS = [
  ['/assets/', path.join(ROOT, 'assets')],
  ['/fonts/', path.join(WEB, 'fonts')],
  ['/vendor/', path.join(WEB, 'vendor')],
];

function versionOf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function send(res, code, body, type, extra) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(code, Object.assign({
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-cache',
  }, extra || {}));
  res.end(buf);
}

function sendJson(res, code, obj, extra) {
  send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8', extra);
}

/** 마운트 안의 파일만 내준다. 경로 탈출은 거부한다. */
function serveStatic(res, urlPath) {
  let file = null;
  for (const [prefix, dir] of MOUNTS) {
    if (urlPath.startsWith(prefix)) {
      const rel = decodeURIComponent(urlPath.slice(prefix.length));
      const abs = path.resolve(dir, rel);
      if (!abs.startsWith(dir + path.sep)) return send(res, 403, '경로를 벗어났다');
      file = abs;
      break;
    }
  }
  if (!file) {
    // web/ 바로 아래의 화이트리스트 파일
    const name = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.slice(1));
    if (name.includes('/')) return send(res, 404, '없는 경로');
    if (!/^[\w.-]+\.(html|js|css|json)$/.test(name)) return send(res, 404, '없는 경로');
    file = path.join(WEB, name);
  }
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, '없는 파일');
    send(res, 200, buf, MIME[path.extname(file)] || 'application/octet-stream');
  });
}

// ── 저장 안전장치 ────────────────────────────────────────────
/**
 * 편집기는 글자만 고치게 되어 있다. 그런데 슬라이드 레이아웃은 배열 길이에
 * 맞춰 좌표를 인덱스로 박아 두었으므로(21장 전부), 원소가 하나라도 늘거나 줄면
 * 좌표 배열 밖을 참조해 조용히 깨진다. 저장 직전에 골격이 같은지 확인한다.
 */
function assertSameShape(a, b, at) {
  const where = at || '$';
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return `${where}: 배열/비배열이 바뀌었다`;
    if (a.length !== b.length) return `${where}: 배열 길이가 ${a.length} → ${b.length} 로 바뀌었다`;
    for (let i = 0; i < a.length; i++) {
      const e = assertSameShape(a[i], b[i], `${where}[${i}]`);
      if (e) return e;
    }
    return null;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return `${where}: 객체가 아닌 값으로 바뀌었다`;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) {
      return `${where}: 키 구성이 바뀌었다`;
    }
    for (const k of ka) {
      const e = assertSameShape(a[k], b[k], `${where}.${k}`);
      if (e) return e;
    }
    return null;
  }
  if (typeof a !== typeof b) return `${where}: ${typeof a} → ${typeof b} 로 형이 바뀌었다`;
  return null;
}

function readBody(req, limit, cb) {
  const chunks = [];
  let n = 0;
  req.on('data', (c) => {
    n += c.length;
    if (n > limit) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => cb(Buffer.concat(chunks)));
}

// ── API ──────────────────────────────────────────────────────
function getContent(res) {
  fs.readFile(CONTENT, (err, buf) => {
    if (err) return sendJson(res, 500, { error: 'content.json 을 읽지 못했다' });
    const st = fs.statSync(CONTENT);
    sendJson(res, 200, {
      version: versionOf(buf),
      savedAt: st.mtime.toISOString(),
      content: JSON.parse(buf),
    });
  });
}

function putContent(req, res) {
  readBody(req, 8 * 1024 * 1024, (buf) => {
    let body;
    try {
      body = JSON.parse(buf.toString('utf8'));
    } catch (e) {
      return sendJson(res, 400, { error: 'JSON 을 해석하지 못했다' });
    }
    const cur = fs.readFileSync(CONTENT);
    const curVersion = versionOf(cur);

    if (body.baseVersion !== curVersion) {
      return sendJson(res, 409, {
        error: '다른 사람이 먼저 저장했다',
        version: curVersion,
        savedAt: fs.statSync(CONTENT).mtime.toISOString(),
        content: JSON.parse(cur),
      });
    }
    const shapeErr = assertSameShape(JSON.parse(cur), body.content);
    if (shapeErr) {
      return sendJson(res, 422, {
        error: `골격이 바뀌었다 — 편집기는 글자만 고칠 수 있다. ${shapeErr}`,
      });
    }

    const json = `${JSON.stringify(body.content, null, 2)}\n`;
    // 편집자 이름은 헤더가 아니라 본문으로 받는다 —
    // HTTP 헤더는 ISO-8859-1 만 허용해서 한글 이름이면 브라우저가 fetch 를 거부한다.
    const editor = String(body.editor || 'unknown').replace(/[^\w가-힣.-]/g, '').slice(0, 40) || 'unknown';
    fs.mkdirSync(HISTORY, { recursive: true });
    fs.writeFileSync(path.join(HISTORY, `${new Date().toISOString().replace(/[:.]/g, '-')}-${editor}.json`), cur);

    const tmp = `${CONTENT}.tmp`;
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, CONTENT);          // 원자적 교체
    sendJson(res, 200, { version: versionOf(Buffer.from(json)), savedAt: new Date().toISOString() });
  });
}

/** 브라우저가 만든 PPTX 를 그대로 받아 verify.py 를 돌린다. 없으면 우아하게 실패. */
function postVerify(req, res, url) {
  readBody(req, 64 * 1024 * 1024, (buf) => {
    const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean);
    const tmp = path.join(require('os').tmpdir(), `deck-verify-${process.pid}-${Date.now()}.pptx`);
    fs.writeFileSync(tmp, buf);
    const args = [path.join(ROOT, 'verify.py'), tmp];
    if (ids.length) args.push('--ids', ids.join(','));
    execFile('python3', args, { cwd: ROOT, timeout: 60000 }, (err, stdout, stderr) => {
      fs.unlink(tmp, () => {});
      if (err && err.code === 'ENOENT') {
        return sendJson(res, 503, { error: '이 서버에 python3 가 없어 검증을 돌릴 수 없다' });
      }
      sendJson(res, 200, {
        ok: !err || err.code === 0,
        code: err ? err.code : 0,
        output: `${stdout}${stderr}`.trim(),
      });
    });
  });
}

// ── 번들 최신성 검사 ─────────────────────────────────────────
/**
 * web/bundle.js 는 esbuild 산출물이라 소스를 고치고 다시 묶지 않으면 낡은 채로
 * 서빙된다. 조용히 옛 레이아웃을 내보내는 것이 가장 흔한 사고라 시작할 때 막는다.
 */
function bundleStale() {
  const bundle = path.join(WEB, 'bundle.js');
  if (!fs.existsSync(bundle)) return 'web/bundle.js 가 없다';
  const t = fs.statSync(bundle).mtimeMs;
  // content.json 은 넣지 않는다 — 번들에 들어가지 않고 실행 중 /api/content 로 받는다.
  // 넣으면 저장할 때마다 번들이 낡은 것으로 오인돼 다음 기동이 막힌다.
  const srcs = ['theme.js', 'helpers.js', 'fontmetrics.js', 'fieldkinds.js']
    .map((f) => path.join(ROOT, f))
    .concat(fs.readdirSync(path.join(ROOT, 'slides')).map((f) => path.join(ROOT, 'slides', f)))
    .concat([path.join(WEB, 'deck.js'), path.join(WEB, 'presets.json')]);
  const newer = srcs.filter((f) => fs.existsSync(f) && fs.statSync(f).mtimeMs > t);
  return newer.length
    ? `web/bundle.js 가 낡았다 (${path.basename(newer[0])} 등 ${newer.length}개가 더 최신)`
    : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;
  if (p === '/api/content' && req.method === 'GET') return getContent(res);
  if (p === '/api/content' && req.method === 'PUT') return putContent(req, res);
  if (p === '/api/verify' && req.method === 'POST') return postVerify(req, res, url);
  if (req.method !== 'GET') return send(res, 405, '허용되지 않는 메서드');
  return serveStatic(res, p);
});

const stale = bundleStale();
if (stale) {
  console.error(`\n  ${stale}\n  → npm run build:web 를 먼저 실행할 것\n`);
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`제안서 원문 편집기: http://localhost:${PORT}`);
});
