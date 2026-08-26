'use strict';
/**
 * 4장 — 디지털·AI 활용 + 사업의 미래
 *
 * 한 장에 장(章)이 둘이다. 위 절반이 04, 아래 절반이 05 다.
 * 네이티브 차트 7개(가로 막대 4 · 도넛 3).
 *
 * 원본 오탈자 2건을 고쳐 반영했다: 스마토→스마트, 매각 동→매각 등.
 */
const { C } = require('../theme');
const H = require('../helpers');
const CH = require('../charts');

const RAMP5 = [C.BLUE_DEEP, C.BLUE, C.BLUE_MID, C.BLUE_LT, C.BLUE_PALE];
const GRAY_RING = 'C7CDD6';

module.exports = function draw(pres, sl, d, s) {
  const S = d.sections;
  const K = d.chapter2;
  const T = K.sections;

  const card = (x, y, w, h) => H.roundRect(sl, s, { x, y, w, h }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 22,
  });
  const head = (p, sec, noFs) => H.sectionHead(sl, s, p, {
    pres, no: sec.no, noFs: noFs || s.FSD(34), bw: 60, gap: 20,
    title: sec.head, fs: s.FS(32),
    note: sec.note, noteFs: s.FS(24), rad: 11,
  });

  // ── 04 머리 ──────────────────────────────────────────────
  H.image(sl, s, { x: 984, y: 16, w: 578, h: 216 }, { name: d.art });
  H.chapterHead(sl, s, {
    x: 39, y: 27, bw: 170, bh: 150,
    tx: 227, ty: 26, tw: 740, th: 96,
    sy: 128, sh: 96, sw: 760,
  }, {
    pres, no: d.no, noFs: s.FSD(78),
    title: d.title, titleFs: s.FS(76),
    sub: d.sub, subFs: s.FS(32), subLsm: 1.34, subLines: 2,
  });

  // ── ① 활용 여부 (도넛) ───────────────────────────────────
  card(37, 275, 623, 532);
  head({ x: 59, y: 283, w: 371, h: 63 }, S[0]);
  H.text(sl, s, { x: 68, y: 356, w: 560, h: 108 }, {
    text: S[0].lead, fs: s.FS(31), bold: true, color: C.NAVY,
    valign: 'top', lsm: 1.24, lines: 3,
  });
  CH.donut(sl, s, pres, { x: 205, y: 496, w: 285, h: 285 }, {
    name: S[0].head, cats: S[0].cats, vals: S[0].vals,
    colors: [C.BLUE_DEEP, GRAY_RING], hole: 52, firstAng: 0, bg: C.CARD,
  });
  H.image(sl, s, { x: 302, y: 592, w: 96, h: 100 }, { name: S[0].icon });
  H.text(sl, s, { x: 58, y: 552, w: 150, h: 86 }, {
    text: S[0].leftLabel, fs: s.FS(30), bold: true, color: C.TXT_SUB,
    align: 'center', valign: 'top', lsm: 1.16,
  });
  H.bigValue(sl, s, { x: 58, base: 686, w: 150 }, {
    v: S[0].leftV, u: '%', vFs: s.FSD(48), uFs: s.FSD(30),
    align: 'center', color: '6B7280',
  });
  H.text(sl, s, { x: 490, y: 580, w: 160, h: 46 }, {
    text: S[0].rightLabel, fs: s.FS(30), bold: true, color: C.NAVY, align: 'center',
  });
  H.bigValue(sl, s, { x: 490, base: 682, w: 160 }, {
    v: S[0].rightV, u: '%', vFs: s.FSD(48), uFs: s.FSD(30), align: 'center',
  });

  // ── ② 활용 분야 (가로 막대) ──────────────────────────────
  card(681, 275, 866, 532);
  head({ x: 708, y: 283, w: 344, h: 63 }, S[1]);
  H.text(sl, s, { x: 716, y: 356, w: 800, h: 48 }, {
    text: S[1].lead, fs: s.FS(31), bold: true, color: C.NAVY, fit: true,
  });
  const R2 = 429;
  const P2 = 80.5;
  S[1].cats.forEach((t, i) => {
    const y = R2 + i * P2;
    H.image(sl, s, { x: 720, y: y - 8, w: 76, h: 74 }, { name: `g04-fld${i + 1}` });
    // 원본은 괄호 설명이 한 줄이지만 7pt 수준이다. 10pt 하한에서는 두 줄이 된다.
    const twoLine = !!S[1].subs[i];
    H.text(sl, s, { x: 812, y: y - (twoLine ? 18 : 2), w: 192, h: twoLine ? 34 : 48 }, {
      text: t, fs: s.FS(30), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
    if (twoLine) {
      H.text(sl, s, { x: 812, y: y + 16, w: 194, h: 46 }, {
        text: S[1].subs[i], fs: s.FS(21), bold: true, color: C.TXT_MID,
        valign: 'top', lsm: 1.02, lines: 2,
      });
    }
  });
  CH.hbar(sl, s, pres, { x: 1004, y: R2 - (P2 - 43) / 2, w: 520, h: P2 * 5 }, {
    name: S[1].head, cats: S[1].cats, vals: S[1].vals, colors: RAMP5,
    max: 42.5, barH: 43, pitch: P2, valFs: s.FSD(32), bg: C.CARD,
  });

  // ── ③④⑤ 가운데 줄 ──────────────────────────────────────
  card(36, 851, 504, 537);
  card(558, 851, 472, 537);
  card(1047, 851, 500, 537);
  head({ x: 57, y: 856, w: 386, h: 63 }, S[2]);
  head({ x: 578, y: 859, w: 434, h: 63 }, S[3]);
  head({ x: 1061, y: 859, w: 463, h: 63 }, S[4]);
  [[S[2], 66, 930, 460], [S[3], 588, 933, 420], [S[4], 1071, 933, 450]].forEach((g) => {
    H.text(sl, s, { x: g[1], y: g[2], w: g[3], h: 76 }, {
      text: g[0].lead, fs: s.FS(28), bold: true, color: C.NAVY,
      valign: 'top', lsm: 1.24, lines: 2,
    });
  });

  // ③ 도입 효과 — 값만, 막대 없음
  S[2].rows.forEach((r, i) => {
    const y = 1030 + i * 76.3;
    H.image(sl, s, { x: 54, y, w: 86, h: 60 }, { name: `g04-eff${i + 1}` });
    H.text(sl, s, { x: 156, y: y + 6, w: 250, h: 48 }, {
      text: r.t, fs: s.FS(27), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
    H.bigValue(sl, s, { x: 396, base: y + 44, w: 120 }, {
      v: r.v, u: '점', vFs: s.FSD(34), uFs: s.FS(24), align: 'right',
    });
    if (i < S[2].rows.length - 1) {
      H.hline(sl, s, { x: 56, y: y + 68, w: 460 }, { pres, color: 'EEF3F9' });
    }
  });
  // 1 — 4 — 7 눈금
  H.hline(sl, s, { x: 62, y: 1344, w: 452 }, { pres, color: 'D6DDE6', width: 1 });
  S[2].axis.forEach((t, i) => {
    const x = 62 + i * 226;
    H.vline(sl, s, { x, y: 1338, h: 12 }, { pres, color: 'D6DDE6', width: 1 });
    H.text(sl, s, { x: x - 70, y: 1348, w: 140, h: 30 }, {
      text: t, fs: s.FS(24), bold: true, color: C.TXT_MID, align: 'center',
    });
    H.text(sl, s, { x: Math.max(x - 90, 50), y: 1374, w: 180, h: 28 }, {
      text: S[2].axisNote[i], fs: s.FS(20), color: C.TXT_SUB,
      align: i === 0 ? 'left' : 'center', fit: true,
    });
  });

  // ④ 어려움 — 값만
  S[3].rows.forEach((r, i) => {
    const y = 1038 + i * 68.5;
    H.image(sl, s, { x: 572, y, w: 72, h: 62 }, { name: `g04-dif${i + 1}` });
    H.text(sl, s, { x: 654, y: y + 4, w: 244, h: 48 }, {
      text: r.t, fs: s.FS(27), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
    H.bigValue(sl, s, { x: 900, base: y + 42, w: 112 }, {
      v: r.v, u: '%', vFs: s.FSD(30), uFs: s.FSD(20), align: 'right',
    });
  });

  // ⑤ 필요 지원 — 가로 막대
  const R5 = 1053;
  const P5 = 67.8;
  S[4].cats.forEach((t, i) => {
    const y = R5 + i * P5;
    H.image(sl, s, { x: 1062, y: y - 7, w: 74, h: 62 }, { name: `g04-sup${i + 1}` });
    H.text(sl, s, { x: 1148, y: y - 2, w: 176, h: 44 }, {
      text: t, fs: s.FS(26), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
  });
  const SUPMAX = 60;
  CH.hbar(sl, s, pres, { x: 1322, y: R5 - (P5 - 35) / 2, w: 216, h: P5 * 5 }, {
    name: S[4].head, cats: S[4].cats, vals: S[4].vals, colors: RAMP5,
    max: SUPMAX, barH: 35, pitch: P5, showValue: false, bg: C.CARD,
  });
  S[4].vals.forEach((v, i) => {
    H.bigValue(sl, s, { x: 1322 + (v / SUPMAX) * 210 + 8, base: R5 + i * P5 + 30, w: 110 }, {
      v: v.toFixed(1), u: '%', vFs: s.FSD(28), uFs: s.FSD(19), align: 'left',
    });
  });

  // ── 05 머리 ──────────────────────────────────────────────
  H.image(sl, s, { x: 1086, y: 1436, w: 478, h: 192 }, { name: K.art });
  H.chapterHead(sl, s, {
    x: 50, y: 1454, bw: 162, bh: 143,
    tx: 232, ty: 1448, tw: 700, th: 92,
    sy: 1544, sh: 92, sw: 830,
  }, {
    pres, no: K.no, noFs: s.FSD(74),
    title: K.title, titleFs: s.FS(72),
    sub: K.sub, subFs: s.FS(30), subLsm: 1.34, subLines: 2,
  });

  // ── 05-① 가업승계 준비 단계 (도넛) ───────────────────────
  card(35, 1675, 451, 549);
  head({ x: 56, y: 1670, w: 339, h: 60 }, T[0]);
  H.text(sl, s, { x: 60, y: 1742, w: 400, h: 72 }, {
    text: T[0].lead, fs: s.FS(28), bold: true, color: C.NAVY,
    valign: 'top', lsm: 1.24, lines: 2,
  });
  CH.donut(sl, s, pres, { x: 168, y: 1890, w: 238, h: 238 }, {
    name: T[0].head, cats: T[0].cats, vals: T[0].vals,
    colors: [C.BLUE_LT, C.BLUE_DEEP, GRAY_RING], hole: 50, firstAng: 0, bg: C.CARD,
  });
  H.image(sl, s, { x: 243, y: 1965, w: 88, h: 88 }, { name: T[0].icon });
  H.text(sl, s, { x: 120, y: 1800, w: 300, h: 56 }, {
    text: T[0].topLabel, fs: s.FS(23), bold: true, color: C.NAVY,
    align: 'center', valign: 'top', lsm: 1.12,
  });
  H.bigValue(sl, s, { x: 216, base: 1906, w: 120 }, {
    v: T[0].topV, u: '%', vFs: s.FSD(28), uFs: s.FSD(19), align: 'center',
  });
  H.bigValue(sl, s, { x: 40, base: 1954, w: 130 }, {
    v: T[0].leftV, u: '%', vFs: s.FSD(36), uFs: s.FSD(24), align: 'left', color: '6B7280',
  });
  H.text(sl, s, { x: 40, y: 1964, w: 140, h: 76 }, {
    text: T[0].leftLabel, fs: s.FS(26), bold: true, color: C.TXT_SUB,
    valign: 'top', lsm: 1.16,
  });
  H.bigValue(sl, s, { x: 230, base: 2158, w: 200 }, {
    v: T[0].botV, u: '%', vFs: s.FSD(52), uFs: s.FSD(32), align: 'center',
  });
  H.text(sl, s, { x: 200, y: 2166, w: 260, h: 62 }, {
    text: T[0].botLabel, fs: s.FS(24), bold: true, color: C.NAVY,
    align: 'center', valign: 'top', lsm: 1.16,
  });

  // ── 05-② 승계 지원 (메달 + 가로 막대) ────────────────────
  card(505, 1675, 525, 549);
  head({ x: 527, y: 1670, w: 500, h: 60 }, T[1]);
  H.text(sl, s, { x: 534, y: 1742, w: 480, h: 72 }, {
    text: T[1].lead, fs: s.FS(28), bold: true, color: C.NAVY,
    valign: 'top', lsm: 1.24, lines: 2,
  });
  const R6 = 1843;
  const P6 = 78.8;
  T[1].cats.forEach((t, i) => {
    const y = R6 + i * P6;
    H.image(sl, s, { x: 526, y: y - 21, w: 56, h: 76 }, { name: `g04-med${i + 1}` });
    H.text(sl, s, { x: 596, y: y - 8, w: 194, h: 60 }, {
      text: t, fs: s.FS(25), bold: true, color: C.TXT, valign: 'middle',
      lines: t.split('\n').length, lsm: 1.08,
    });
  });
  const SUCMAX = 100;
  CH.hbar(sl, s, pres, { x: 789, y: R6 - (P6 - 35) / 2, w: 226, h: P6 * 5 }, {
    name: T[1].head, cats: T[1].cats.map((t) => t.replace(/\n/g, ' ')), vals: T[1].vals, colors: RAMP5,
    max: SUCMAX, barH: 35, pitch: P6, showValue: false, bg: C.CARD,
  });
  T[1].vals.forEach((v, i) => {
    H.bigValue(sl, s, { x: 789 + (v / SUCMAX) * 220 + 8, base: R6 + i * P6 + 30, w: 110 }, {
      v: v.toFixed(1), u: '%', vFs: s.FSD(28), uFs: s.FSD(19), align: 'left',
    });
  });

  // ── 05-③ 노후 생활 준비 (도넛 + 방법 막대) ───────────────
  card(1047, 1675, 500, 549);
  head({ x: 1062, y: 1670, w: 286, h: 60 }, T[2]);
  H.text(sl, s, { x: 1062, y: 1734, w: 478, h: 58 }, {
    text: T[2].lead, fs: s.FS(24), bold: true, color: C.NAVY,
    valign: 'top', lsm: 1.16, lines: 2,
  });
  CH.donut(sl, s, pres, { x: 1090, y: 1800, w: 176, h: 176 }, {
    name: T[2].head, cats: T[2].cats, vals: T[2].vals,
    colors: [C.BLUE_DEEP, GRAY_RING], hole: 52, firstAng: 0, bg: C.CARD,
  });
  H.image(sl, s, { x: 1148, y: 1856, w: 62, h: 62 }, { name: T[2].icon });
  H.text(sl, s, { x: 1286, y: 1808, w: 254, h: 40 }, {
    text: T[2].yesLabel, fs: s.FS(26), bold: true, color: C.NAVY, align: 'center',
  });
  H.bigValue(sl, s, { x: 1286, base: 1896, w: 254 }, {
    v: T[2].yesV, u: '%', vFs: s.FSD(44), uFs: s.FSD(28), align: 'center',
  });
  H.hline(sl, s, { x: 1296, y: 1914, w: 238 }, { pres, color: 'DDE5EE' });
  H.text(sl, s, { x: 1286, y: 1918, w: 254, h: 36 }, {
    text: T[2].noLabel, fs: s.FS(23), color: C.TXT_SUB, align: 'center',
  });
  H.bigValue(sl, s, { x: 1286, base: 1982, w: 254 }, {
    v: T[2].noV, u: '%', vFs: s.FSD(32), uFs: s.FSD(21), align: 'center', color: '6B7280',
  });
  H.roundRect(sl, s, { x: 1062, y: 1994, w: 470, h: 226 }, {
    pres, fill: 'EDF4FC', rad: 16,
  });
  H.runs(sl, s, { x: 1062, y: 2000, w: 470, h: 42 }, {
    runs: [
      { t: T[2].methodHead, fs: s.FS(26), color: C.NAVY },
      { t: ` ${T[2].methodNote}`, fs: s.FS(20), color: C.NAVY },
    ],
    align: 'center', valign: 'middle',
  });
  const R7 = 2044;
  const P7 = 38.6;
  T[2].mCats.forEach((t, i) => {
    const y = R7 + i * P7;
    H.image(sl, s, { x: 1072, y: y - 6, w: 44, h: 40 }, { name: `g04-old${i + 1}` });
    H.text(sl, s, { x: 1120, y: y - 6, w: 134, h: 40 }, {
      text: t, fs: s.FS(23), bold: true, color: C.TXT, valign: 'middle', fit: true, wrap: false,
    });
  });
  CH.hbar(sl, s, pres, { x: 1254, y: R7 - (P7 - 24) / 2, w: 268, h: P7 * 5 }, {
    name: T[2].methodHead, cats: T[2].mCats, vals: T[2].mVals, colors: RAMP5,
    max: 132, barH: 24, pitch: P7, showValue: false, bg: 'EDF4FC',
  });
  T[2].mVals.forEach((v, i) => {
    H.bigValue(sl, s, { x: 1254 + (v / 132) * 260 + 8, base: R7 + i * P7 + 22, w: 110 }, {
      v: v.toFixed(1), u: '%', vFs: s.FSD(24), uFs: s.FSD(16), align: 'left',
    });
  });

  // ── 하단 결론 밴드 ───────────────────────────────────────
  H.roundRect(sl, s, { x: 36, y: 2260, w: 1526, h: 123 }, { pres, fill: C.NAVY_DEEP, rad: 18 });
  H.image(sl, s, { x: 102, y: 2270, w: 80, h: 108 }, { name: d.band.icon });
  H.text(sl, s, { x: 230, y: 2272, w: 1240, h: 48 }, {
    text: d.band.line1, fs: s.FS(32), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 230, y: 2320, w: 1240, h: 50 }, {
    text: d.band.line2, fs: s.FS(32), bold: true, color: 'FFD34D', align: 'center', fit: true,
  });
};
