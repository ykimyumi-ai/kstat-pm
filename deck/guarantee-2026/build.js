'use strict';
/**
 * PPTX 빌더 — 세로 인포그래픽 4장.
 *
 *   node build.js               전체(4장) → out/2026_소상공인_실태조사_인포그래픽_4p.pptx
 *   node build.js --only g01    1장만
 *   node build.js --ids g01,g02
 *   OUT_NAME=이름.pptx node build.js --only g01
 */
const fs = require('fs');
const path = require('path');
// 이 덱은 자체 node_modules 를 두지 않는다. 옆 덱(namp-2026)에 이미 설치된
// 같은 버전을 쓴다 — 두 덱의 pptxgenjs 가 갈리면 산출물도 갈린다.
const PptxGenJS = require('../namp-2026/node_modules/pptxgenjs');
const { SLIDE_W, SLIDE_H, C, scaler } = require('./theme');
const content = require('./content.json');
const slides = require('./slides');

// 원본 PDF 가 4장이다. 아직 다 안 만들었어도 합본 이름은 이 수를 기준으로 정한다.
const TOTAL_PAGES = 4;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

function main() {
  const only = arg('--only');
  const ids = arg('--ids');
  let want = content.map((d) => d.id);
  if (only) want = [only];
  else if (ids) want = ids.split(',').map((v) => v.trim()).filter(Boolean);

  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'INFO23', width: SLIDE_W, height: SLIDE_H });
  pres.layout = 'INFO23';
  pres.author = '케이스탯리서치';
  pres.title = '소상공인 실태조사 인포그래픽';

  want.forEach((id) => {
    const d = content.find((e) => e.id === id);
    if (!d) throw new Error(`content.json 에 ${id} 가 없다`);
    const draw = slides[id];
    if (!draw) throw new Error(`slides/${id}.js 가 없다`);
    const sl = pres.addSlide();
    sl.background = { color: C.BG };
    draw(pres, sl, d, scaler(d.img[0], d.img[1]));
  });

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  // 4장이 다 들어가면 합본 이름, 아니면 그 장 제목을 붙인다.
  const base = '2026_소상공인_실태조사_인포그래픽';
  const one = want.length === 1 ? content.find((e) => e.id === want[0]) : null;
  const name = process.env.OUT_NAME
    || (want.length === TOTAL_PAGES ? `${base}_4p.pptx`
      : one ? `${base}_${one.no}_${one.title.replace(/[\s·/]/g, '')}.pptx`
        : `${base}_${want.join('-')}.pptx`);
  const file = path.join(outDir, name);
  return pres.writeFile({ fileName: file }).then(() => {
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`${file}  (${want.length}장, ${kb}KB)`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
