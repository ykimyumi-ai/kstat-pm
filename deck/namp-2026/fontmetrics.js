'use strict';
/**
 * KoPub돋움체 TTF에서 글자 폭(advance width)을 직접 읽어 문자열 폭을 계산한다.
 *
 * 원본이 이미지라 "이 글자가 이 박스에 들어가는가"를 눈으로만 판단하면 놓치기 쉽다.
 * 실제 폰트 메트릭으로 폭을 계산해 두면 넘침을 코드로 잡아낼 수 있고,
 * 자동 축소(fitFont)로 박스를 벗어나는 일을 원천 차단할 수 있다.
 *
 * 폰트가 없으면(설치되지 않은 환경) 근사 계산으로 조용히 대체한다.
 */
const fs = require('fs');

const CANDIDATE_DIRS = [
  '/usr/share/fonts/truetype/kopub',
  `${__dirname}/node_modules/font-kopub/fonts`,
  '/tmp/fontpkg/node_modules/font-kopub/fonts',
];

function findFont(file) {
  for (const d of CANDIDATE_DIRS) {
    const p = `${d}/${file}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** 최소한의 TTF 파서 — cmap(format 4/12) 과 hmtx 만 읽는다. */
function parseTTF(path) {
  const b = fs.readFileSync(path);
  const numTables = b.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    tables[b.toString('latin1', o, o + 4)] = {
      off: b.readUInt32BE(o + 8),
      len: b.readUInt32BE(o + 12),
    };
  }
  const head = tables.head.off;
  const unitsPerEm = b.readUInt16BE(head + 18);
  const indexToLocFormat = b.readInt16BE(head + 50);
  const numHMetrics = b.readUInt16BE(tables.hhea.off + 34);

  // hmtx: advance width 배열
  const adv = [];
  for (let i = 0; i < numHMetrics; i++) {
    adv.push(b.readUInt16BE(tables.hmtx.off + i * 4));
  }

  // cmap: 유니코드 → glyph id
  const cmapOff = tables.cmap.off;
  const nSub = b.readUInt16BE(cmapOff + 2);
  let best = null;
  for (let i = 0; i < nSub; i++) {
    const r = cmapOff + 4 + i * 8;
    const pid = b.readUInt16BE(r);
    const eid = b.readUInt16BE(r + 2);
    const off = cmapOff + b.readUInt32BE(r + 4);
    const fmt = b.readUInt16BE(off);
    const score = (pid === 3 && eid === 10 && fmt === 12) ? 3
      : (pid === 3 && eid === 1 && fmt === 4) ? 2
        : (fmt === 4 || fmt === 12) ? 1 : 0;
    if (score && (!best || score > best.score)) best = { off, fmt, score };
  }

  const map = new Map();
  if (best && best.fmt === 4) {
    const o = best.off;
    const segX2 = b.readUInt16BE(o + 6);
    const seg = segX2 / 2;
    const endO = o + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let i = 0; i < seg; i++) {
      const end = b.readUInt16BE(endO + i * 2);
      const start = b.readUInt16BE(startO + i * 2);
      const delta = b.readInt16BE(deltaO + i * 2);
      const ro = b.readUInt16BE(rangeO + i * 2);
      if (start === 0xFFFF) continue;
      for (let c = start; c <= end && c !== 0x10000; c++) {
        let g;
        if (ro === 0) {
          g = (c + delta) & 0xFFFF;
        } else {
          const gi = rangeO + i * 2 + ro + (c - start) * 2;
          if (gi + 1 >= b.length) continue;
          g = b.readUInt16BE(gi);
          if (g) g = (g + delta) & 0xFFFF;
        }
        if (g) map.set(c, g);
      }
    }
  } else if (best && best.fmt === 12) {
    const o = best.off;
    const nGroups = b.readUInt32BE(o + 12);
    for (let i = 0; i < nGroups; i++) {
      const g = o + 16 + i * 12;
      const s = b.readUInt32BE(g);
      const e = b.readUInt32BE(g + 4);
      const gi = b.readUInt32BE(g + 8);
      for (let c = s; c <= e; c++) map.set(c, gi + (c - s));
    }
  }

  void indexToLocFormat;
  return { unitsPerEm, adv, map, lastAdv: adv[adv.length - 1] };
}

const FONTS = {};
function load(bold) {
  const key = bold ? 'B' : 'M';
  if (key in FONTS) return FONTS[key];
  const p = findFont(bold ? 'KoPubDotum-Bold.ttf' : 'KoPubDotum-Medium.ttf');
  FONTS[key] = p ? parseTTF(p) : null;
  return FONTS[key];
}

const isCJK = (ch) => /[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿＀-￯]/.test(ch);
// 렌더러는 한글이 아닌 인쇄 가능 문자를 모두 '서양 문자'로 보고 간격을 넣는다.
// ASCII 뿐 아니라 중점(·)·따옴표(‘ ’)·물결(~) 등도 포함된다.
const isWestern = (ch) => !isCJK(ch) && !/\s/.test(ch);

/**
 * PowerPoint·LibreOffice는 동아시아 문자와 서양 문자가 맞닿는 곳에
 * 자동으로 약 0.25em의 간격을 넣는다("아시아 어와 영어 텍스트 간격 조정").
 * 이 값을 빼고 계산하면 실제보다 좁게 나와 넘침을 놓치므로 함께 센다.
 */
function boundaryEm(str) {
  let n = 0;
  const cs = [...str];
  for (let i = 1; i < cs.length; i++) {
    const a = cs[i - 1], b = cs[i];
    if ((isCJK(a) && isWestern(b)) || (isWestern(a) && isCJK(b))) n++;
  }
  return n * 0.25;
}

/** 문자열의 폭을 인치로 반환한다. fontSize 는 pt. */
function widthIn(str, fontSize, bold) {
  const f = load(bold);
  const em = fontSize / 72; // 인치
  if (!f) {
    // 폰트를 못 찾은 경우: 한글 0.95em, 그 외 0.5em 으로 근사
    let u = 0;
    for (const ch of str) u += isCJK(ch) ? 0.95 : 0.5;
    return (u + boundaryEm(str)) * em;
  }
  let units = 0;
  for (const ch of str) {
    const g = f.map.get(ch.codePointAt(0));
    const a = g === undefined ? f.lastAdv : (f.adv[g] !== undefined ? f.adv[g] : f.lastAdv);
    units += a;
  }
  return (units / f.unitsPerEm + boundaryEm(str)) * em;
}

/**
 * 박스 폭(인치) 안에 들어가도록 fontSize(pt)를 줄여 반환한다.
 * 줄바꿈(\n)이 있으면 가장 긴 줄을 기준으로 한다.
 */
function fitFont(str, fontSize, boxWidthIn, bold, minPt) {
  const lines = String(str).split('\n');
  let fs2 = fontSize;
  const min = minPt || 10;
  for (let i = 0; i < 60; i++) {
    const widest = Math.max(...lines.map((l) => widthIn(l, fs2, bold)));
    if (widest <= boxWidthIn || fs2 <= min) break;
    fs2 = Math.round((fs2 - 0.2) * 10) / 10;
  }
  return Math.max(fs2, min);
}

/** 지정 폭에서 줄바꿈했을 때 필요한 줄 수 */
function lineCount(str, fontSize, boxWidthIn, bold) {
  let n = 0;
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let cur = '';
    let lines = 1;
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (widthIn(test, fontSize, bold) > boxWidthIn && cur) {
        lines++;
        cur = w;
      } else {
        cur = test;
      }
    }
    n += lines;
  }
  return n;
}

module.exports = { widthIn, fitFont, lineCount, load };
