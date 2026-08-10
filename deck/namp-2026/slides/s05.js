'use strict';
/** 5. 국가승인통계 심사기준 사전 대응 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 28, ty: 4, tw: 1200, th: 72, tfs: s.FS(47),
    sx: 30, sy: 92, mw: 12, mh: 31, marks: 2,
    sub: d.sub, bx: 68, by: 88, bw: 900, bh: 44, bfs: s.FS(31),
  });
  H.quoteBand(sl, s, { x: 62, y: 142, w: 1414, h: 76 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 4대 심사기준 대응 ───────────────────────────────────
  H.pill(sl, s, { x: 40, y: 237, w: 1455, h: 40 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(25),
  });
  H.panel(sl, s, { x: 40, y: 285, w: 1455, h: 458 }, P);

  const rowY = [298, 413, 529, 641];
  const rowH = [98, 99, 93, 94];
  d.rows.forEach((r, i) => {
    const y = rowY[i], h = rowH[i];
    // 다이아몬드 번호
    sl.addShape(pres.shapes.DIAMOND, {
      x: s.X(52), y: s.Y(y + h / 2 - 30), w: s.W(54), h: s.H(60),
      fill: { color: C.NAVY_DEEP }, line: { type: 'none' },
    });
    H.text(sl, s, { x: 52, y: y + h / 2 - 30, w: 54, h: 60 }, {
      text: String(r.n), fs: s.FS(24), bold: true, color: C.WHITE, align: 'center',
    });
    // 기준명
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(125), y: s.Y(y), w: s.W(266), h: s.H(h),
      fill: { color: C.NAVY }, line: { type: 'none' },
    });
    H.text(sl, s, { x: 129, y, w: 258, h }, {
      text: r.name, fs: s.FS(25), bold: true, color: C.WHITE, align: 'center', fit: true,
    });
    // 지침 요구사항
    H.panel(sl, s, { x: 411, y, w: 410, h }, { pres, fill: 'EFF1F4' });
    H.pill(sl, s, { x: 525, y, w: 182, h: 29 }, {
      pres, fill: 'DCDFE5', text: d.reqLabel, fs: s.FS(19), color: C.TXT_MID,
    });
    H.text(sl, s, { x: 419, y: y + 32, w: 394, h: h - 38 }, {
      text: r.req, fs: s.FS(21), align: 'center', lsm: 1.25, fit: true, valign: 'top',
    });
    // 화살표
    H.chevron(sl, s, { x: 838, y: y + h / 2 - 14, w: 24, h: 28 }, { pres, fill: C.NAVY_DEEP });
    // 본 조사 사전 대응
    H.card(sl, s, { x: 879, y, w: 613, h }, { pres, line: C.LINE });
    H.goldBadge(sl, s, { x: 1073, y, w: 225, h: 29 }, {
      pres, text: d.resLabel, fs: s.FS(19),
    });
    H.text(sl, s, { x: 887, y: y + 32, w: 597, h: h - 38 }, {
      text: r.res, fs: s.FS(21), align: 'center', lsm: 1.25, fit: true, valign: 'top',
    });
  });

  // ── 승인 신청 준비 ──────────────────────────────────────
  H.panel(sl, s, { x: 51, y: 760, w: 1435, h: 175 }, P);
  H.pill(sl, s, { x: 75, y: 773, w: 219, h: 41 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(24),
  });
  d.prep.forEach((t, i) => {
    const y = 828 + i * 52;
    H.numBadge(sl, s, { x: 78, y, w: 32, h: 32 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(19), fill: C.WHITE, color: C.NAVY,
    });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(78), y: s.Y(y), w: s.W(32), h: s.H(32),
      fill: { type: 'none' }, line: { color: C.NAVY, width: 1 },
    });
    H.text(sl, s, { x: 124, y, w: 1330, h: 32 }, {
      text: t, fs: s.FS(22), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
    });
    if (i === 0) H.hline(sl, s, { x: 124, y: y + 42, w: 1330 }, { pres, color: 'E6E9EE' });
  });

  H.footnote(sl, s, { x: 75, y: 940, fs: s.FS(20), text: d.foot });
};
