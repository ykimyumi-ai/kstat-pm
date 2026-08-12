'use strict';
/**
 * 2026 납품대금 연동제 실태조사 제안서 — 편집 가능 PPTX 생성
 *
 * 원본 PDF·이미지는 텍스트 레이어가 없는 래스터라 변환이 불가능하다.
 * 이 스크립트가 모든 글자·도형·표를 네이티브 PPT 객체로 다시 그린다.
 *
 *   node build.js --preset outcome   → 프리셋 이름으로 (web/presets.json)
 *   node build.js --only 3,10        → 장 번호로 (레이아웃 반복 확인용)
 *   node build.js --ids s18,s19      → 장 id 로
 *   node build.js                    → 전체 21장
 *
 * 출력 파일명은 프리셋에 정의된 이름을 쓰고, OUT_NAME 으로 덮어쓸 수 있다.
 */
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { SLIDE_W, SLIDE_H, C, scaler } = require('./theme');
const content = require('./content');
const slides = require('./slides');
const presets = require('./web/presets.json');

const OUT_DIR = path.join(__dirname, 'out');

function argOf(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

// ── 어느 장을 뽑을지 ─────────────────────────────────────────
const presetKey = argOf('--preset');
const onlyArg = argOf('--only');
const idsArg = argOf('--ids');

let ids = null;
let defaultName = null;

if (presetKey) {
  const p = presets.find((x) => x.key === presetKey);
  if (!p) {
    console.error(`알 수 없는 프리셋: ${presetKey}`);
    console.error(`쓸 수 있는 값: ${presets.map((x) => x.key).join(', ')}`);
    process.exit(1);
  }
  ids = p.ids;
  defaultName = p.file;
} else if (idsArg) {
  ids = idsArg.split(',');
} else if (onlyArg) {
  // 1-based 장 번호 → id
  ids = onlyArg.split(',').map(Number).map((n) => content[n - 1] && content[n - 1].id);
}

if (ids && ids.some((x) => !x)) {
  console.error('선택한 장 번호가 범위를 벗어났다.');
  process.exit(1);
}

const picked = ids ? content.filter((d) => ids.includes(d.id)) : content;
if (!picked.length) {
  console.error('선택된 장이 없다.');
  process.exit(1);
}

// --only/--ids 로 일부만 뽑을 때 기본 이름을 그대로 쓰면 전체 파일을 덮어쓴다.
const OUT_FILE = process.env.OUT_NAME || defaultName
  || (ids
    ? `2026_납품대금연동제_실태조사_제안서_발췌${picked.length}p.pptx`
    : '2026_납품대금연동제_실태조사_제안서_전체21p.pptx');

const pres = new PptxGenJS();
pres.defineLayout({ name: 'NAMP', width: SLIDE_W, height: SLIDE_H });
pres.layout = 'NAMP';
pres.author = '케이스탯리서치';
pres.company = '케이스탯리서치';
pres.title = '2026 납품대금 연동제 실태조사 제안서';

picked.forEach((data) => {
  const draw = slides[data.id];
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
