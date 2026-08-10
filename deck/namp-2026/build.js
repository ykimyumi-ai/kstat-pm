'use strict';
/**
 * 2026 납품대금 연동제 실태조사 제안서(발췌 11장) — 편집 가능 PPTX 생성
 *
 * 원본 PDF는 텍스트 레이어가 없는 래스터 이미지 11장이라 변환이 불가능하다.
 * 이 스크립트가 모든 글자·도형·표를 네이티브 PPT 객체로 다시 그린다.
 *
 *   node build.js            → out/2026_납품대금연동제_실태조사_제안서_발췌11p.pptx
 *   node build.js --only 3   → 3장만 (레이아웃 반복 확인용)
 */
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { SLIDE_W, SLIDE_H, C, scaler } = require('./theme');
const content = require('./content');

const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = process.env.OUT_NAME || '2026_납품대금연동제_실태조사_제안서_발췌11p.pptx';

const onlyArg = process.argv.indexOf('--only');
const only = onlyArg > -1 ? process.argv[onlyArg + 1].split(',').map(Number) : null;

const pres = new PptxGenJS();
pres.defineLayout({ name: 'NAMP', width: SLIDE_W, height: SLIDE_H });
pres.layout = 'NAMP';
pres.author = '케이스탯리서치';
pres.company = '케이스탯리서치';
pres.title = '2026 납품대금 연동제 실태조사 제안서';

content.forEach((data, i) => {
  if (only && !only.includes(i + 1)) return;
  const draw = require(`./slides/${data.id}`);
  const s = scaler(data.img[0], data.img[1]);
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  draw({ pres, sl, s, d: data });
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const dest = path.join(OUT_DIR, OUT_FILE);
pres.writeFile({ fileName: dest }).then(() => {
  const kb = (fs.statSync(dest).size / 1024).toFixed(0);
  console.log(`생성 완료: ${dest} (${kb} KB)`);
});
