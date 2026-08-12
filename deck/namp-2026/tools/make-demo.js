'use strict';
/**
 * 서버 없이 도는 단일 파일 데모(web/demo.html)를 만든다.
 *
 * 사내 서버에 올리기 전에 "어떤 화면인지" 보여 주기 위한 것이다. 편집기와 같은
 * 코드·같은 폰트 폭 표를 쓰므로 미리보기와 PPTX 다운로드는 실물과 똑같이 동작한다.
 * 다만 서버가 없으니 저장과 verify.py 실행만 막는다.
 *
 * 사용: npm run build:web && node tools/make-demo.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const OUT = path.join(WEB, 'demo.html');

const read = (p) => fs.readFileSync(p, 'utf8');
const b64 = (p) => fs.readFileSync(p).toString('base64');

function main() {
  const content = JSON.parse(read(path.join(ROOT, 'content.json')));

  // 슬라이드가 쓰는 사진·아이콘만 골라 data URI 로 담는다
  const assets = {};
  fs.readdirSync(path.join(ROOT, 'assets')).forEach((f) => {
    if (!f.endsWith('.png')) return;
    assets[f.replace(/\.png$/, '')] = `data:image/png;base64,${b64(path.join(ROOT, 'assets', f))}`;
  });

  const parts = {
    metrics: read(path.join(WEB, 'fonts', 'metrics.json')),
    labels: read(path.join(WEB, 'labels.json')),
    presets: read(path.join(WEB, 'presets.json')),
    content: JSON.stringify(content),
    assets: JSON.stringify(assets),
    fontM: b64(path.join(WEB, 'fonts', 'KoPubDotum-Medium.woff')),
    fontB: b64(path.join(WEB, 'fonts', 'KoPubDotum-Bold.woff')),
    vendor: read(path.join(WEB, 'vendor', 'pptxgen.bundle.js')),
    bundle: read(path.join(WEB, 'bundle.js')),
    css: read(path.join(WEB, 'style.css')),
    app: read(path.join(WEB, 'app.js')),
  };

  // app.js 는 fetch 로 서버를 부른다. 데모에서는 그 자리에 인라인 값을 끼워 넣는다.
  let app = parts.app
    .replace(
      "Deck.init({ metricsUrl: 'fonts/metrics.json', assetBase: 'assets' })",
      'Deck.initInline(window.__DEMO.metrics, function (n) { return window.__DEMO.assets[n]; })')
    .replace("fetch('labels.json').then(function (r) { return r.json(); })",
      'Promise.resolve(window.__DEMO.labels)')
    .replace("fetch('api/content').then(function (r) { return r.json(); })",
      'Promise.resolve({ version: \'demo\', savedAt: new Date().toISOString(), content: window.__DEMO.content })')
    .replace('$(\'#save\').onclick = save;',
      "$('#save').onclick = function () { alert('데모에서는 저장할 수 없습니다.\\n"
      + "사내 서버에 올리면 저장되고 이력이 남습니다.'); };")
    .replace('$(\'#verify\').onclick = verify;',
      "$('#verify').onclick = function () { alert('검증은 서버의 verify.py 가 실행합니다.\\n"
      + "데모에는 서버가 없어 동작하지 않습니다.'); };");

  // 폰트는 style.css 의 상대 경로 대신 data URI 로
  const css = parts.css
    .replace("url('fonts/KoPubDotum-Medium.woff') format('woff')",
      `url(data:font/woff;base64,${parts.fontM}) format('woff')`)
    .replace("url('fonts/KoPubDotum-Bold.woff') format('woff')",
      `url(data:font/woff;base64,${parts.fontB}) format('woff')`);

  const html = `<style>
${css}
#banner {
  background: #2a2418; color: #e8d9a8; padding: 8px 16px; font-size: 12px;
  border-bottom: 1px solid #4a3f28;
}
#banner b { color: #f0d78a; }
</style>
<div id="banner">
  <b>미리보기 데모</b> — 편집기와 같은 코드로 돕니다. 문구를 고치면 화면이 바로 바뀌고
  PPTX 도 실제로 내려받아집니다. 서버가 없어 <b>저장·검증만</b> 막혀 있습니다.
</div>
<header>
  <h1>2026 납품대금 연동제 제안서 — 원문 편집기</h1>
  <span class="dim" id="meta">불러오는 중…</span>
  <span class="grow"></span>
  <span class="dim" id="opcount"></span>
  <button id="verify" class="ghost">검증 실행</button>
  <button id="save" disabled>저장</button>
</header>
<div id="cols">
  <aside id="list"></aside>
  <section id="mid">
    <div id="stage"></div>
    <div id="warn"></div>
    <div id="dl"></div>
  </section>
  <aside id="form"></aside>
</div>
<div id="toast"></div>

<script>window.__DEMO = {
metrics: ${parts.metrics},
labels: ${parts.labels},
content: ${parts.content},
assets: ${parts.assets}
};</script>
<script>${parts.vendor}</script>
<script>${parts.bundle}</script>
<script>${app}</script>
`;

  fs.writeFileSync(OUT, html);
  console.log(`${OUT} (${(html.length / 1024 / 1024).toFixed(1)}MB)`);
}

main();
