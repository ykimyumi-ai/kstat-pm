'use strict';
/**
 * 브라우저용 KoPub돋움체 폭 메트릭 표를 만든다.
 *
 * 웹 편집기는 "이 문구가 칸을 넘치는가"를 CLI 와 똑같이 계산해야 한다. 그런데
 * TTF 는 한 벌에 3.1MB 라 브라우저로 보내기엔 무겁다. 다행히 이 폰트는 한글 음절
 * 11,172자가 전부 같은 폭(872)이고 비한글도 대부분 900이라, 예외만 추려 담으면
 * 수십 KB 로 줄어든다.
 *
 * 정확성을 위해 두 가지를 함께 담는다.
 *   - cmap 수록 범위: 폰트에 없는 글자는 노드가 lastAdv 를 쓰므로 그대로 재현한다.
 *   - Bold 예외: KoPub Bold 는 좋·찧·鼇 세 글자의 advance 가 Medium 과 다르다
 *     (글리프 ID 가 정상 범위 안인데도 1000). 폰트 데이터 자체의 이상이라 그대로 옮긴다.
 *
 * 사용: node tools/gen-metrics.js
 */
const fs = require('fs');
const path = require('path');
const FM = require('../fontmetrics');

const HAN_LO = 0xAC00, HAN_HI = 0xD7A3;
const OUT = path.join(__dirname, '..', 'web', 'fonts', 'metrics.json');

function advOf(f, cp) {
  const g = f.map.get(cp);
  if (g === undefined) return null;
  return f.adv[g] !== undefined ? f.adv[g] : f.lastAdv;
}

/** 정렬된 코드포인트 배열을 [시작, 끝] 구간 목록으로 압축한다. */
function toRanges(sorted) {
  const out = [];
  let s = null, p = null;
  for (const cp of sorted) {
    if (s === null) { s = p = cp; continue; }
    if (cp === p + 1) { p = cp; continue; }
    out.push([s, p]); s = p = cp;
  }
  if (s !== null) out.push([s, p]);
  return out;
}

function main() {
  const M = FM.load(false), B = FM.load(true);
  if (!M || !B) {
    console.error('KoPub돋움체를 찾지 못했다. npm install 후 다시 실행할 것.');
    process.exit(1);
  }

  // 한글 음절은 전부 같은 폭이어야 한다. 아니면 전제가 깨진 것이니 멈춘다.
  const hanSet = new Set();
  for (let cp = HAN_LO; cp <= HAN_HI; cp++) hanSet.add(advOf(M, cp));
  if (hanSet.size !== 1) {
    console.error('한글 음절 폭이 균일하지 않다:', [...hanSet]);
    process.exit(1);
  }
  const hangulAdv = [...hanSet][0];

  // 비한글: 최빈 폭을 기본값으로 두고 나머지만 예외로 담는다
  const nonHan = [...M.map.keys()].filter((cp) => cp < HAN_LO || cp > HAN_HI).sort((a, b) => a - b);
  const freq = new Map();
  for (const cp of nonHan) {
    const a = advOf(M, cp);
    freq.set(a, (freq.get(a) || 0) + 1);
  }
  const [defaultAdv] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];

  const adv = {};
  for (const cp of nonHan) {
    const a = advOf(M, cp);
    if (a !== defaultAdv) adv[cp] = a;
  }

  // Bold 가 Medium 과 다른 글자 (폰트 데이터 이상)
  const boldAdv = {};
  for (const cp of M.map.keys()) {
    const a = advOf(M, cp), b = advOf(B, cp);
    if (a !== b) boldAdv[cp] = b;
  }

  const table = {
    _note: '자동 생성: node tools/gen-metrics.js — 직접 고치지 말 것',
    unitsPerEm: M.unitsPerEm,
    hangul: [HAN_LO, HAN_HI],
    hangulAdv,
    defaultAdv,
    lastAdv: { medium: M.lastAdv, bold: B.lastAdv },
    ranges: toRanges(nonHan),
    adv,
    boldAdv,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const json = JSON.stringify(table);
  fs.writeFileSync(OUT, json + '\n');

  console.log(`unitsPerEm ${table.unitsPerEm} / 한글 ${hangulAdv} / 비한글 기본 ${defaultAdv}`);
  console.log(`비한글 ${nonHan.length}자 → 구간 ${table.ranges.length}개 + 예외 ${Object.keys(adv).length}개`);
  console.log(`Bold 예외 ${Object.keys(boldAdv).length}개: `
    + Object.keys(boldAdv).map((cp) => String.fromCodePoint(+cp)).join(' '));
  console.log(`${OUT} (${(json.length / 1024).toFixed(1)}KB)`);
}

main();
