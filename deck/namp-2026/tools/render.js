'use strict';
/**
 * 생성한 PPTX 를 LibreOffice 로 PDF 변환한 뒤 페이지별 PNG 로 뽑는다.
 * 원본과 나란히 놓고 어긋남·겹침·잘림을 확인하는 용도다.
 *
 * render.sh 를 대신한다 — 윈도우에는 bash·sed·printf 가 없다.
 *
 * 사용:
 *   node tools/render.js                       out/ 의 최신 pptx, 기본 DPI
 *   node tools/render.js --out .render --dpi 150
 *   node tools/render.js --pptx out/어떤파일.pptx
 *
 * 결과: <out>/r01.png, r02.png … (원본과 같은 크기로 맞추려면 --dpi 를 덱에 맞춘다)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const env = require('./env');

// 덱 루트. npm 스크립트는 언제나 그 package.json 이 있는 곳을 cwd 로 잡으므로
// 기본값을 cwd 로 둔다 — 그래야 이 파일 하나를 두 덱이 같이 쓸 수 있다.
const ROOT = path.resolve(process.env.DECK_ROOT || process.cwd());

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function need(what, bin) {
  if (bin) return bin;
  console.error(`\n  ${what} 을(를) 찾지 못했다.\n  ${env.HOWTO[what]}\n`
    + '  이미 설치했다면 PATH 를 확인하거나 환경변수로 지정할 것 '
    + `(예: ${what.toUpperCase()}_BIN=...)\n`);
  process.exit(1);
  return null;
}

function latestPptx() {
  const dir = path.join(ROOT, 'out');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.pptx'))
      .map((f) => ({ f: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)
    : [];
  if (!files.length) {
    console.error('  out/ 에 pptx 가 없다. 먼저 npm run build 를 돌릴 것.');
    process.exit(1);
  }
  return files[0].f;
}

function main() {
  const soffice = need('soffice', env.soffice());
  const pdftoppm = need('pdftoppm', env.pdftoppm());
  const dpi = Number(arg('dpi', process.env.RENDER_DPI || 140));
  if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
    console.error(`  덱 루트가 아니다: ${ROOT}\n  덱 폴더에서 실행하거나 DECK_ROOT 를 지정할 것.`);
    process.exit(1);
  }
  const out = path.resolve(arg('out', path.join(os.tmpdir(), 'deck-render')));
  const pptx = path.resolve(arg('pptx', latestPptx()));

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  // 한글 파일명이면 LibreOffice 가 못 여는 경우가 있어 ASCII 이름으로 복사해 변환한다.
  const work = path.join(out, 'deck.pptx');
  fs.copyFileSync(pptx, work);

  // --headless 만으로는 이미 떠 있는 LibreOffice 와 프로필이 충돌해 조용히 실패한다.
  // 전용 프로필을 따로 준다.
  const profile = path.join(out, 'loprofile');
  const r1 = spawnSync(soffice, [
    '--headless', '--norestore', '--invisible',
    `-env:UserInstallation=${pathToUri(profile)}`,
    '--convert-to', 'pdf', '--outdir', out, work,
  ], { encoding: 'utf8', timeout: 180000 });
  const pdf = path.join(out, 'deck.pdf');
  if (!fs.existsSync(pdf)) {
    console.error('  PDF 변환 실패.', (r1.stderr || r1.stdout || '').trim().slice(0, 400));
    console.error('  파워포인트나 LibreOffice 가 이 파일을 열어 두고 있지 않은지 확인할 것.');
    process.exit(1);
  }

  const r2 = spawnSync(pdftoppm, ['-r', String(dpi), '-png', pdf, path.join(out, 'r')],
    { encoding: 'utf8', timeout: 180000 });
  if (r2.status !== 0) {
    console.error('  PNG 변환 실패.', (r2.stderr || '').trim().slice(0, 400));
    process.exit(1);
  }

  // r-1.png → r01.png. 10진수로 읽어야 08·09 가 8진수로 해석돼 사라지지 않는다.
  const made = [];
  fs.readdirSync(out).filter((f) => /^r-\d+\.png$/.test(f)).forEach((f) => {
    const n = parseInt(f.slice(2), 10);
    const to = `r${String(n).padStart(2, '0')}.png`;
    fs.renameSync(path.join(out, f), path.join(out, to));
    made.push(to);
  });
  fs.rmSync(profile, { recursive: true, force: true });
  made.sort().forEach((f) => console.log(path.join(out, f)));
  if (!made.length) console.error('  PNG 가 하나도 안 나왔다.');
}

/** -env:UserInstallation 은 file:// URI 를 요구한다 */
function pathToUri(p) {
  const abs = path.resolve(p).replace(/\\/g, '/');
  return `file:///${abs.replace(/^\//, '')}`;
}

main();
