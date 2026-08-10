'use strict';
/** 8. 국가승인통계 편입 2년 로드맵 (원본 1492×1054 — A4 가로 비율) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 38, ty: 8, tw: 1100, th: 74, tfs: s.FS(49),
    sx: 40, sy: 100, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 68, by: 96, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 42, y: 152, w: 1410, h: 88 }, {
    pres, runs: d.quote, fs: s.FS(28),
  });

  // ── 4단계 로드맵 ────────────────────────────────────────
  const colX = [42, 410, 749, 1103];
  const colW = [354, 322, 335, 336];

  // 상단 타임라인 (번호 → 라인 → 점)
  H.hline(sl, s, { x: 42, y: 313, w: 1397 }, { pres, color: 'C9CDD5', thick: 2 });
  d.phases.forEach((ph, i) => {
    const cx = colX[i] + colW[i] / 2;
    H.text(sl, s, { x: cx - 90, y: 258, w: 180, h: 44 }, {
      text: ph.no, fs: s.FS(38), bold: true, color: C.NAVY_DEEP, align: 'center',
    });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(cx - 9), y: s.Y(305), w: s.W(18), h: s.H(18),
      fill: { color: C.NAVY_DEEP }, line: { type: 'none' },
    });
  });

  d.phases.forEach((ph, i) => {
    const x = colX[i], w = colW[i];
    H.panel(sl, s, { x, y: 334, w, h: 331 }, { pres, fill: 'F7F8FA' });
    H.text(sl, s, { x: x + 4, y: 346, w: w - 8, h: 42 }, {
      text: ph.head, fs: s.FS(26), bold: true, align: 'center', fit: true, pad: 0.02,
    });
    H.hline(sl, s, { x: x + 24, y: 396, w: w - 48 }, { pres, color: 'D8DCE3' });
    H.bullets(sl, s, { x: x + 24, y: 410, w: w - 44, h: 244 }, {
      items: ph.items, fs: s.FS(21), gap: 5, lsm: 1.25,
    });
    // 하단 골드 요약 바
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(x), y: s.Y(665), w: s.W(w), h: s.H(83),
      fill: { color: C.GOLD }, line: { type: 'none' },
    });
    H.text(sl, s, { x: x + 8, y: 665, w: w - 16, h: 83 }, {
      text: ph.bar, fs: s.FS(22), bold: true, color: C.WHITE,
      align: 'center', lsm: 1.2, fit: true,
    });
  });

  // ── 로드맵 운영 원칙 ────────────────────────────────────
  H.panel(sl, s, { x: 42, y: 781, w: 1415, h: 186 }, P);
  H.pill(sl, s, { x: 64, y: 828, w: 240, h: 72 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(26),
  });
  d.principles.forEach((t, i) => {
    const y = 800 + i * 52;
    H.numBadge(sl, s, { x: 340, y, w: 30, h: 30 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(18), fill: C.WHITE, color: C.NAVY,
    });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(340), y: s.Y(y), w: s.W(30), h: s.H(30),
      fill: { type: 'none' }, line: { color: C.NAVY, width: 1 },
    });
    H.text(sl, s, { x: 384, y: y - 4, w: 1050, h: i === 2 ? 62 : 38 }, {
      text: t, fs: s.FS(21), align: 'left', valign: 'top', lsm: 1.28, fit: true,
    });
  });

  H.footnote(sl, s, { x: 48, y: 984, fs: s.FS(20), text: d.foot });
};
