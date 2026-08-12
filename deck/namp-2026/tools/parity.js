'use strict';
/**
 * 웹 편집기가 만든 PPTX 가 CLI 산출물과 같은지 확인한다.
 *
 * 이 프로젝트의 핵심 약속은 "브라우저에서 뽑아도 CLI 와 같은 파일이 나온다"이다.
 * 슬라이드 XML 에는 시각·UUID 가 없어(생성 시각은 docProps/core.xml 에만 있다)
 * **바이트 단위로 같아야 한다.** 같지 않다면 그 지점이 발산원이다.
 *
 * 실제 Chromium 을 띄워 웹앱에서 내려받고, 같은 프리셋을 CLI 로 만들어 비교한다.
 *
 * 사용: npm run build:web && node tools/parity.js
 *   (playwright-core 가 필요하다: npm i --no-save playwright-core)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PRESETS = require('../web/presets.json');
const PORT = Number(process.env.PARITY_PORT || 8123);
const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function unzipList(file) {
  return execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' })
    .split('\n').filter(Boolean).sort();
}
function unzipRead(file, entry) {
  return execFileSync('unzip', ['-p', file, entry], { maxBuffer: 1 << 28 });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch (e) {
    console.error('playwright-core 가 없다. npm i --no-save playwright-core 후 다시 실행할 것.');
    process.exit(2);
  }
  if (!fs.existsSync(CHROMIUM)) {
    console.error(`Chromium 을 찾지 못했다: ${CHROMIUM}`);
    process.exit(2);
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const srv = spawn('node', [path.join(ROOT, 'web', 'server.js')],
    { cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'pipe' });
  await new Promise((res, rej) => {
    srv.stdout.on('data', (d) => String(d).includes('편집기') && res());
    srv.stderr.on('data', (d) => rej(new Error(String(d))));
    setTimeout(() => rej(new Error('서버가 뜨지 않았다')), 8000);
  });

  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // favicon 404 는 앱과 무관하다
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text());
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction('window.Deck && document.getElementById("presets").children.length > 0',
    null, { timeout: 20000 });

  let fails = 0;
  for (const preset of PRESETS) {
    // ── 브라우저에서 생성 ────────────────────────────────
    const b64 = await page.evaluate(async (key) => {
      const p = window.Deck.PRESETS.find((x) => x.key === key);
      const payload = await window.Deck.loadContent('api/content');
      const blob = await window.Deck.buildPptx(payload.content, p.ids);
      const buf = await blob.arrayBuffer();
      let s = '';
      const u8 = new Uint8Array(buf);
      for (let i = 0; i < u8.length; i += 8192) {
        s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      }
      return btoa(s);
    }, preset.key);
    const webFile = path.join(outDir, `web-${preset.key}.pptx`);
    fs.writeFileSync(webFile, Buffer.from(b64, 'base64'));

    // ── CLI 로 생성 ──────────────────────────────────────
    execFileSync('node', ['build.js', '--preset', preset.key], {
      cwd: ROOT, env: Object.assign({}, process.env, { OUT_NAME: `parity-${preset.key}.pptx` }),
      stdio: 'ignore',
    });
    const cliFile = path.join(ROOT, 'out', `parity-${preset.key}.pptx`);

    // ── 슬라이드 XML·미디어 바이트 비교 ──────────────────
    const entries = unzipList(cliFile).filter(
      (e) => /^ppt\/slides\/slide\d+\.xml$/.test(e) || e.startsWith('ppt/media/'));
    const webEntries = new Set(unzipList(webFile));
    const diffs = [];
    for (const e of entries) {
      if (!webEntries.has(e)) { diffs.push(`${e} 없음`); continue; }
      if (!unzipRead(cliFile, e).equals(unzipRead(webFile, e))) diffs.push(e);
    }
    fs.unlinkSync(cliFile);

    const mark = diffs.length ? '불일치' : '일치';
    if (diffs.length) fails++;
    console.log(`  ${preset.key.padEnd(8)} 슬라이드+미디어 ${entries.length}개  ${mark}`
      + (diffs.length ? ` → ${diffs.slice(0, 4).join(', ')}` : ''));
  }

  await browser.close();
  srv.kill();
  fs.rmSync(outDir, { recursive: true, force: true });

  if (errors.length) {
    console.log(`\n브라우저 콘솔 오류 ${errors.length}건:`);
    errors.slice(0, 5).forEach((e) => console.log(`  ${e}`));
  }
  console.log(fails === 0 && errors.length === 0
    ? '\n웹 산출물이 CLI 산출물과 바이트 단위로 같다'
    : `\n${fails}개 프리셋이 다르다`);
  process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
