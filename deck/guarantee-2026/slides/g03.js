'use strict';
/**
 * 3장 — 신용보증 이용 및 지원 효과
 *
 * 이 덱에서 가장 빽빽한 장이다. 카드 7장 + 결론 밴드, 네이티브 차트 8개
 * (가로 막대 3 · 세로 막대 1 · 2계열 막대 1 · 도넛 3).
 *
 * 원본 오탈자 4건을 고쳐 반영했다(content.json 의 fixes 참조).
 * ⑦의 '대출한도 만족도'는 원본 글자가 뭉개져 읽을 수 없어, 원본이 스스로 밝힌
 * 정의(격차 = 중요도 − 만족도)와 격차 1.11 로 역산했다.
 */
const { C } = require('../theme');
const H = require('../helpers');
const CH = require('../charts');

const RAMP5 = [C.BLUE_DEEP, C.BLUE, C.BLUE_MID, C.BLUE_LT, C.BLUE_PALE];
const RAMP6 = [C.BLUE_DEEP, C.BLUE, C.BLUE_MID, '86C4F2', 'A6D4F6', C.BLUE_PALE];
const GRAY_RING = 'C6CBD2';

module.exports = function draw(pres, sl, d, s) {
  const S = d.sections;

  // ── 머리 ─────────────────────────────────────────────────
  H.image(sl, s, { x: 1178, y: 26, w: 404, h: 222 }, { name: d.art });
  H.chapterHead(sl, s, {
    x: 27, y: 30, bw: 171, bh: 153,
    tx: 237, ty: 34, tw: 900, th: 106,
    sy: 146, sh: 62, sw: 900,
  }, {
    pres, no: d.no, noFs: s.FSD(80),
    title: d.title, titleFs: s.FS(79),
    sub: d.sub, subFs: s.FS(34), subFit: true,
  });

  const card = (x, y, w, h) => H.roundRect(sl, s, { x, y, w, h }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 22,
  });
  const sub = (x, y, w, h) => H.roundRect(sl, s, { x, y, w, h }, {
    pres, fill: C.CARD, line: 'E3EDF7', rad: 16,
  });

  // ── 1행 : 카드 ①②③ ─────────────────────────────────────
  card(28, 269, 504, 671);
  card(549, 269, 526, 671);
  card(1091, 269, 481, 671);

  // ① 인지 경로
  H.sectionHead(sl, s, { x: 49, y: 277, w: 349, h: 65 }, {
    pres, no: S[0].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[0].head, fs: s.FS(33), note: S[0].note, noteFs: s.FS(25), rad: 11,
  });
  H.text(sl, s, { x: 60, y: 356, w: 460, h: 74 }, {
    text: S[0].lead, fs: s.FS(32), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  const R1 = 472;
  const P1 = 86.75;
  S[0].cats.forEach((t, i) => {
    const y = R1 + i * P1;
    H.image(sl, s, { x: 54, y: y - 9, w: 66, h: 64 }, { name: `g03-ch${i + 1}` });
    H.text(sl, s, { x: 126, y: y - 12, w: 132, h: 72 }, {
      text: t, fs: s.FS(27), bold: true, color: C.TXT, valign: 'middle', lsm: 1.14,
      lines: t.split('\n').length,
    });
  });
  CH.hbar(sl, s, pres, { x: 260, y: R1 - (P1 - 47) / 2, w: 268, h: P1 * 5 }, {
    name: S[0].head, cats: S[0].cats.map((t) => t.replace(/\n/g, ' ')), vals: S[0].vals,
    colors: RAMP5, max: 66, barH: 47, pitch: P1, valFs: s.FSD(25), bg: C.CARD,
  });
  H.text(sl, s, { x: 58, y: 898, w: 300, h: 34 }, {
    text: S[0].foot, fs: s.FS(24), color: C.TXT_SUB,
  });

  // ② 이용 방식 및 장점
  H.sectionHead(sl, s, { x: 569, y: 277, w: 339, h: 65 }, {
    pres, no: S[1].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[1].head, fs: s.FS(33), rad: 11,
  });
  H.text(sl, s, { x: 577, y: 356, w: 470, h: 74 }, {
    text: S[1].lead, fs: s.FS(32), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  [{ x: 577, w: 210 }, { x: 925, w: 130 }].forEach((g, i) => {
    const pr = S[1].pair[i];
    H.text(sl, s, { x: g.x, y: 466, w: 260, h: 44 }, {
      text: pr.label, fs: s.FS(32), bold: true, color: C.TXT,
    });
    H.bigValue(sl, s, { x: g.x, base: 552, w: 300 }, {
      v: pr.v, u: pr.u, vFs: s.FSD(46), uFs: s.FSD(28), align: 'left',
    });
  });
  H.image(sl, s, { x: 634, y: 556, w: 288, h: 162 }, { name: 'g03-meet' });
  H.image(sl, s, { x: 938, y: 580, w: 94, h: 136 }, { name: 'g03-phone' });
  S[1].tops.forEach((tp, i) => {
    const x = i === 0 ? 565 : 817;
    const w = i === 0 ? 240 : 243;
    sub(x, 730, w, 196);
    H.roundRect(sl, s, { x, y: 730, w, h: 46 }, { pres, fill: C.TINT, rad: 16 });
    H.roundRect(sl, s, { x, y: 758, w, h: 18 }, { pres, fill: C.TINT });
    H.text(sl, s, { x, y: 730, w, h: 46 }, {
      text: tp.head, fs: s.FS(24), bold: true, color: C.NAVY, align: 'center', fit: true,
    });
    H.image(sl, s, { x: x + 22, y: 794, w: 94, h: 78 }, { name: tp.icon });
    H.text(sl, s, { x: x + 118, y: 790, w: w - 126, h: 76 }, {
      text: `${tp.t1}\n${tp.t2}`, fs: s.FS(27), bold: true, color: C.TXT,
      valign: 'middle', lsm: 1.16, fit: true,
    });
    H.bigValue(sl, s, { x: x + 100, base: 912, w: w - 110 }, {
      v: tp.v, u: tp.u, vFs: s.FSD(42), uFs: s.FSD(26), align: 'center',
    });
  });

  // ③ 조달 자금 용도
  H.sectionHead(sl, s, { x: 1113, y: 277, w: 405, h: 65 }, {
    pres, no: S[2].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[2].head, fs: s.FS(33), note: S[2].note, noteFs: s.FS(25), rad: 11,
  });
  H.text(sl, s, { x: 1121, y: 356, w: 430, h: 74 }, {
    text: S[2].lead, fs: s.FS(32), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  S[2].uses.forEach((u, i) => {
    const y = 456 + i * 226;
    sub(1112, y, 440, 190);
    H.image(sl, s, { x: 1146, y: y + 46, w: 148, h: 142 }, { name: u.icon });
    H.text(sl, s, { x: 1310, y: y + 44, w: 220, h: 50 }, {
      text: u.label, fs: s.FS(34), bold: true, color: C.TXT, align: 'left',
    });
    H.bigValue(sl, s, { x: 1310, base: y + 168, w: 230 }, {
      v: u.v, u: u.u, vFs: s.FSD(64), uFs: s.FSD(36), align: 'left',
    });
  });

  // ── 2행 : 카드 ④⑤ ──────────────────────────────────────
  card(28, 977, 751, 642);
  card(797, 977, 775, 642);

  // ④ 보증부대출 평가
  H.sectionHead(sl, s, { x: 47, y: 983, w: 714, h: 64 }, {
    pres, no: S[3].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[3].head, fs: s.FS(33), note: S[3].note, noteFs: s.FS(25), rad: 11,
  });
  H.text(sl, s, { x: 58, y: 1058, w: 700, h: 76 }, {
    text: S[3].lead, fs: s.FS(29), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  sub(45, 1155, 378, 460);
  sub(433, 1155, 340, 460);
  H.text(sl, s, { x: 45, y: 1166, w: 378, h: 42 }, {
    text: S[3].leftHead, fs: s.FS(31), bold: true, color: C.TXT, align: 'center',
  });
  H.text(sl, s, { x: 253, y: 1212, w: 160, h: 32 }, {
    text: S[3].scaleNote, fs: s.FS(23), color: C.TXT_SUB, align: 'right',
  });
  const R4 = 1259;
  const P4 = 47.6;
  S[3].cats.forEach((t, i) => {
    const y = R4 + i * P4;
    // 원본은 이 칸의 글자가 7~8pt 수준이라 KoPub 10pt 하한으로는 한 줄에 안 들어간다.
    // 두 줄까지 허용해 칸 안에 넣는다(원본과 다른 점 — README).
    H.text(sl, s, { x: 50, y: y - 12, w: 158, h: 42 }, {
      text: t, fs: s.FS(22), bold: true, color: C.TXT, valign: 'middle',
      lines: 2, lsm: 1.06,
    });
    if (i < S[3].cats.length - 1) {
      H.hline(sl, s, { x: 55, y: y + P4 - 14, w: 350 }, { pres, color: 'F0F5FA' });
    }
  });
  CH.hbar(sl, s, pres, { x: 216, y: R4 - (P4 - 17) / 2, w: 212, h: P4 * 6 }, {
    name: S[3].leftHead, cats: S[3].cats, vals: S[3].vals, colors: RAMP6,
    max: 7.7, barH: 17, pitch: P4, valFs: s.FSD(26), fmt: '0.00', bg: C.CARD,
  });

  H.text(sl, s, { x: 433, y: 1166, w: 340, h: 42 }, {
    text: S[3].rightHead, fs: s.FS(31), bold: true, color: C.TXT, align: 'center',
  });
  H.text(sl, s, { x: 600, y: 1212, w: 160, h: 32 }, {
    text: S[3].scaleNote, fs: s.FS(23), color: C.TXT_SUB, align: 'right',
  });
  // 원본은 세로축이 0 이 아니라 3점 근처에서 시작한다. 그대로 재현한다.
  CH.colBar(sl, s, pres, { x: 442, y: 1258, w: 320, h: 170 }, {
    name: S[3].rightHead, cats: S[3].colCats.map((t) => t.replace(/\n/g, ' ')),
    vals: S[3].colVals, colors: [C.BLUE_PALE, C.BLUE_DEEP],
    min: 3.0, max: 4.95, barW: 104, pitch: 158,
    // 이 차트만 값 라벨을 끈다 — 렌더러가 세로 막대의 라벨 칸을 아주 좁게 잡아
    // '3.99점' 이 글자마다 줄바꿈된다. 값은 아래에 글상자로 따로 놓는다(README).
    showValue: false, bg: C.CARD,
  });
  [{ x: 452, v: S[3].colVals[0] }, { x: 610, v: S[3].colVals[1] }].forEach((g, i) => {
    H.bigValue(sl, s, { x: g.x, base: i === 0 ? 1338 : 1288, w: 138 }, {
      v: g.v.toFixed(2), u: '점', vFs: s.FSD(30), uFs: s.FS(23), align: 'center',
    });
  });
  H.image(sl, s, { x: 574, y: 1288, w: 60, h: 58 }, { name: 'g03-uparrow' });
  H.hline(sl, s, { x: 452, y: 1421, w: 300 }, { pres, color: 'C9D4E0', width: 1.25 });
  S[3].colCats.forEach((t, i) => {
    H.text(sl, s, { x: 452 + i * 158, y: 1430, w: 150, h: 66 }, {
      text: t, fs: s.FS(27), bold: true, color: C.TXT, align: 'center',
      valign: 'top', lsm: 1.16, fit: true,
    });
  });
  H.roundRect(sl, s, { x: 468, y: 1510, w: 262, h: 62 }, { pres, fill: 'E8F1FB', rad: 14 });
  H.text(sl, s, { x: 468, y: 1510, w: 262, h: 62 }, {
    text: `${S[3].delta}${S[3].deltaU} ↑`, fs: s.FS(38), bold: true,
    color: C.BLUE_DEEP, align: 'center', fit: true,
  });

  // ⑤ 경영 성과 변화
  H.sectionHead(sl, s, { x: 816, y: 982, w: 565, h: 65 }, {
    pres, no: S[4].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[4].head, fs: s.FS(33), note: S[4].note, noteFs: s.FS(25), rad: 11,
  });
  H.text(sl, s, { x: 827, y: 1058, w: 640, h: 76 }, {
    text: S[4].lead, fs: s.FS(30), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  const dg = [{ x: 810, w: 220 }, { x: 1040, w: 265 }, { x: 1315, w: 255 }];
  S[4].donuts.forEach((dn, i) => {
    const g = dg[i];
    sub(g.x, 1155, g.w, 440);
    H.text(sl, s, { x: g.x, y: 1168, w: g.w, h: 44 }, {
      text: dn.head, fs: s.FS(29), bold: true, color: C.TXT, align: 'center', fit: true,
    });
    const cx = g.x + g.w / 2;
    CH.donut(sl, s, pres, { x: cx - 93, y: 1236, w: 186, h: 186 }, {
      name: dn.head, cats: S[4].legend, vals: dn.vals,
      colors: [C.BLUE_DEEP, GRAY_RING, C.BLUE_LT], hole: 64, firstAng: 0, bg: C.CARD,
    });
    H.image(sl, s, { x: cx - 20, y: 1309, w: 40, h: 40 }, { name: dn.icon });
    S[4].legend.forEach((lg, j) => {
      const y = 1432 + j * 50;
      H.text(sl, s, { x: g.x + 14, y, w: 92, h: 40 }, {
        text: lg, fs: s.FS(24), bold: true, color: C.TXT, valign: 'middle', fit: true,
      });
      H.bigValue(sl, s, { x: g.x + g.w - 118, base: y + 30, w: 104 }, {
        v: String(dn.vals[j].toFixed(1)), u: '%', vFs: s.FSD(28), uFs: s.FSD(19),
        align: 'right',
      });
      if (j < 2) H.hline(sl, s, { x: g.x + 14, y: y + 44, w: g.w - 28 }, { pres, color: 'EDF3FA' });
    });
  });
  H.text(sl, s, { x: 812, y: 1596, w: 400, h: 32 }, {
    text: S[4].foot, fs: s.FS(24), color: C.TXT_SUB,
  });

  // ── 3행 : 카드 ⑥⑦ ──────────────────────────────────────
  card(28, 1655, 736, 573);
  card(781, 1655, 791, 573);

  // ⑥ 기여도
  H.sectionHead(sl, s, { x: 46, y: 1660, w: 676, h: 65 }, {
    pres, no: S[5].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[5].head, fs: s.FS(33), note: S[5].note, noteFs: s.FS(25), rad: 11,
  });
  H.text(sl, s, { x: 62, y: 1732, w: 680, h: 44 }, {
    text: S[5].lead, fs: s.FS(31), bold: true, color: C.NAVY, fit: true,
  });
  S[5].panels.forEach((pn, i) => {
    const x = i === 0 ? 45 : 380;
    const w = i === 0 ? 323 : 348;
    sub(x, 1794, w, 312);
    H.roundRect(sl, s, { x, y: 1794, w, h: 58 }, { pres, fill: C.TINT, rad: 16 });
    H.roundRect(sl, s, { x, y: 1822, w, h: 30 }, { pres, fill: C.TINT });
    H.text(sl, s, { x, y: 1794, w, h: 58 }, {
      text: pn.head, fs: s.FS(30), bold: true, color: C.NAVY, align: 'center', fit: true,
    });
    pn.rows.forEach((r, j) => {
      const y = 1902 + j * 75;
      H.image(sl, s, { x: x + 13, y: y - 32, w: 62, h: 64 },
        { name: `g03-f${i === 0 ? 'a' : 'b'}${j + 1}` });
      H.text(sl, s, { x: x + 92, y: y - 26, w: w - 180, h: 52 }, {
        text: r.t, fs: s.FS(30), bold: true, color: C.TXT, valign: 'middle', fit: true,
      });
      H.bigValue(sl, s, { x: x + w - 96, base: y + 16, w: 84 }, {
        v: r.v, vFs: s.FSD(38), align: 'right',
      });
    });
  });
  H.noteBox(sl, s, { x: 45, y: 2118, w: 683, h: 98 }, {
    pres, fill: 'D9E9F9', rad: 16, icon: S[5].noteIcon,
    iconBox: { x: 58, y: 2126, w: 100, h: 92 },
    tx: 120, text: `${S[5].note1}\n${S[5].note2}`, fs: s.FS(30), color: C.TXT, lsm: 1.2,
  });

  // ⑦ 제도 평가 & 정책
  H.sectionHead(sl, s, { x: 783, y: 1660, w: 693, h: 65 }, {
    pres, no: S[6].no, noFs: s.FSD(36), bw: 62, gap: 22,
    title: S[6].head, fs: s.FS(33), rad: 11,
  });
  H.text(sl, s, { x: 798, y: 1728, w: 760, h: 74 }, {
    text: S[6].lead, fs: s.FS(29), bold: true, color: C.NAVY, valign: 'top', lsm: 1.24, lines: 2,
  });
  sub(790, 1818, 380, 396);
  sub(1180, 1818, 384, 396);
  H.text(sl, s, { x: 790, y: 1826, w: 380, h: 44 }, {
    text: S[6].leftHead, fs: s.FS(30), bold: true, color: C.TXT, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 790, y: 1872, w: 380, h: 32 }, {
    text: S[6].leftNote, fs: s.FS(24), color: C.TXT_SUB, align: 'center',
  });
  // 열 머리 (중요도 · 만족도 · 격차)
  [[884, 100], [1000, 100], [1096, 80]].forEach((g, i) => {
    H.text(sl, s, { x: g[0], y: 1908, w: g[1], h: 34 }, {
      text: S[6].colHeads[i], fs: s.FS(24), bold: true, color: C.TXT_MID, align: 'center',
    });
  });
  const GR = 1955;
  const GP = 68;
  S[6].gapRows.forEach((r, i) => {
    const y = GR + i * GP;
    H.text(sl, s, { x: 796, y: y + 2, w: 92, h: 44 }, {
      text: r.t, fs: s.FS(23), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
    H.roundRect(sl, s, { x: 1076, y: y - 6, w: 84, h: 56 }, {
      pres, fill: C.WHITE, line: r.hot ? 'E23B3B' : 'D8E5F2', rad: 10,
    });
    H.text(sl, s, { x: 1076, y: y - 6, w: 84, h: 56 }, {
      text: r.gap, fs: s.FS(32), bold: true, align: 'center',
      color: r.hot ? C.RED : C.TXT,
    });
  });
  CH.dualBar(sl, s, pres, { x: 894, y: GR - 8, w: 172, h: GP * 3 }, {
    cats: S[6].gapRows.map((r) => r.t),
    // 계열 1 이 각 묶음의 아래에 그려진다. 원본은 중요도가 위이므로 만족도를 먼저 넣는다.
    series: [
      { name: S[6].colHeads[1], vals: S[6].gapRows.map((r) => r.sat), color: '9FC8EC' },
      { name: S[6].colHeads[0], vals: S[6].gapRows.map((r) => r.imp), color: C.BLUE },
    ],
    max: 8.6, gap: 60, overlap: -20, valFs: s.FSD(23), fmt: '0.00', bg: C.CARD,
  });
  H.text(sl, s, { x: 798, y: 2160, w: 360, h: 32 }, {
    text: S[6].leftFoot, fs: s.FS(23), color: C.TXT_SUB,
  });

  H.text(sl, s, { x: 1180, y: 1826, w: 384, h: 44 }, {
    text: S[6].rightHead, fs: s.FS(30), bold: true, color: C.TXT, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 1180, y: 1872, w: 384, h: 32 }, {
    text: S[6].rightNote, fs: s.FS(24), color: C.TXT_SUB, align: 'center',
  });
  const PR = 1920;
  const PP = 48.6;
  S[6].polCats.forEach((t, i) => {
    const y = PR + i * PP;
    H.roundRect(sl, s, { x: 1186, y: y + 1, w: 30, h: 30 }, {
      pres, fill: i < 3 ? C.NAVY : '9AA3AE', rad: 15,
    });
    H.text(sl, s, { x: 1186, y: y + 1, w: 30, h: 30 }, {
      text: String(i + 1), fs: s.FS(20), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: 1228, y, w: 130, h: 34 }, {
      text: t, fs: s.FS(26), bold: true, color: C.TXT, valign: 'middle', fit: true,
    });
  });
  // 이 차트는 값 라벨을 끈다 — 행 간격이 48px 밖에 안 돼 렌더러가 '64.6%' 를
  // 두 줄로 접는다. 막대는 살아 있고 숫자만 글상자다(README 의 '차트' 항목).
  const POLMAX = 108;
  CH.hbar(sl, s, pres, { x: 1354, y: PR - (PP - 29) / 2, w: 212, h: PP * 5 }, {
    name: S[6].rightHead, cats: S[6].polCats, vals: S[6].polVals, colors: RAMP5,
    max: POLMAX, barH: 29, pitch: PP, showValue: false, bg: C.CARD,
  });
  S[6].polVals.forEach((v, i) => {
    H.bigValue(sl, s, { x: 1354 + (v / POLMAX) * 206 + 10, base: PR + i * PP + 25, w: 130 }, {
      v: v.toFixed(1), u: '%', vFs: s.FSD(30), uFs: s.FSD(20), align: 'left',
    });
  });
  H.text(sl, s, { x: 1188, y: 2160, w: 360, h: 32 }, {
    text: S[6].rightFoot, fs: s.FS(23), color: C.TXT_SUB,
  });

  // ── 하단 결론 밴드 ───────────────────────────────────────
  H.roundRect(sl, s, { x: 32, y: 2250, w: 1536, h: 133 }, { pres, fill: C.NAVY_DEEP, rad: 18 });
  H.image(sl, s, { x: 90, y: 2268, w: 84, h: 106 }, { name: d.band.icon });
  H.image(sl, s, { x: 1376, y: 2246, w: 196, h: 140 }, { name: d.band.people });
  H.text(sl, s, { x: 214, y: 2266, w: 1130, h: 50 }, {
    text: d.band.line1, fs: s.FS(34), bold: true, color: C.WHITE, fit: true,
  });
  H.text(sl, s, { x: 214, y: 2318, w: 1130, h: 52 }, {
    text: d.band.line2, fs: s.FS(34), bold: true, color: 'FFD34D', fit: true,
  });
};
