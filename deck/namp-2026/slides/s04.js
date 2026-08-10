'use strict';
/** 4. 8. 국가승인통계 편입 로드맵 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 16, fs: s.FS(18) });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 28, ty: 50, tw: 1100, th: 72, tfs: s.FS(49),
    sx: 36, sy: 137, mw: 12, mh: 31, marks: 2,
    sub: d.sub, bx: 74, by: 133, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 56, y: 178, w: 1426, h: 82 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 3단 헤더 + 4행 매핑 ─────────────────────────────────
  const hx = [106, 573, 1034];
  const hw = [404, 404, 447];
  d.heads.forEach((t, i) => {
    H.pill(sl, s, { x: hx[i], y: 276, w: hw[i], h: 47 }, {
      pres, fill: C.NAVY, text: t, fs: s.FS(28),
    });
    if (i < 2) {
      H.chevron(sl, s, { x: hx[i] + hw[i] + 12, y: 285, w: 26, h: 30 }, { pres, fill: 'C9CDD5' });
    }
  });

  const rowY = [335, 390, 445, 502];
  d.rows.forEach((r, i) => {
    H.panel(sl, s, { x: 55, y: rowY[i], w: 1426, h: 49 }, { pres, fill: C.ROW_ALT });
    H.numBadge(sl, s, { x: 82, y: rowY[i] + 8, w: 33, h: 33 }, {
      pres, kind: 'circle', n: r.n, fs: s.FS(19),
    });
    [[r.a, hx[0], hw[0]], [r.b, hx[1], hw[1]], [r.c, hx[2], hw[2]]].forEach(([t, x, w]) => {
      H.text(sl, s, { x, y: rowY[i], w, h: 49 }, {
        text: t, fs: s.FS(24), align: 'center', fit: true,
      });
    });
  });

  // ── 좌: 자료 성격 구분 ──────────────────────────────────
  H.panel(sl, s, { x: 42, y: 609, w: 653, h: 303 }, P);
  H.pill(sl, s, { x: 41, y: 563, w: 654, h: 45 }, {
    pres, fill: C.NAVY, text: d.leftHead, fs: s.FS(28),
  });
  const lY = [626, 748];
  const lH = [101, 82];
  d.leftRows.forEach((r, i) => {
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(70), y: s.Y(lY[i]), w: s.W(180), h: s.H(lH[i]),
      fill: { color: r.dark ? C.GRAY_DARK : C.GOLD }, line: { type: 'none' },
    });
    H.text(sl, s, { x: 70, y: lY[i], w: 180, h: lH[i] }, {
      text: r.label, fs: s.FS(24), bold: true, color: C.WHITE, align: 'center', fit: true,
    });
    H.card(sl, s, { x: 258, y: lY[i], w: 412, h: lH[i] }, { pres, fill: r.dark ? C.CARD : 'FBFAF6' });
    H.bullets(sl, s, { x: 272, y: lY[i] + 6, w: 392, h: lH[i] - 12 }, {
      items: r.items, fs: s.FS(21), gap: 3, lsm: 1.25,
    });
  });
  H.pill(sl, s, { x: 65, y: 848, w: 610, h: 50 }, {
    pres, fill: C.GOLD, text: d.leftBar, fs: s.FS(28),
  });

  // ── 우: 2년 편입 준비 ───────────────────────────────────
  H.panel(sl, s, { x: 723, y: 609, w: 772, h: 303 }, P);
  H.pill(sl, s, { x: 723, y: 563, w: 772, h: 45 }, {
    pres, fill: C.NAVY, text: d.rightHead, fs: s.FS(28),
  });
  const rY = [625, 692, 752];
  const rH = [58, 52, 76];
  d.rightRows.forEach((t, i) => {
    H.card(sl, s, { x: 746, y: rY[i], w: 727, h: rH[i] }, { pres, line: C.LINE });
    H.numBadge(sl, s, { x: 768, y: rY[i] + rH[i] / 2 - 16, w: 33, h: 33 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(19),
    });
    H.text(sl, s, { x: 818, y: rY[i], w: 640, h: rH[i] }, {
      text: t, fs: s.FS(24), align: 'left', lsm: 1.25, fit: true,
    });
  });
  H.panel(sl, s, { x: 746, y: 842, w: 727, h: 55 }, { pres, fill: 'EAF0F9' });
  H.text(sl, s, { x: 752, y: 842, w: 715, h: 55 }, {
    text: d.rightNote, fs: s.FS(22), bold: true, color: C.BLUE_TXT, align: 'center', fit: true,
  });

  // ── 하단: 작성 필요성 ───────────────────────────────────
  H.panel(sl, s, { x: 43, y: 931, w: 1450, h: 53 }, P);
  sl.addShape(pres.shapes.RECTANGLE, {
    x: s.X(63), y: s.Y(944), w: s.W(6), h: s.H(28),
    fill: { color: C.NAVY }, line: { type: 'none' },
  });
  sl.addText(
    [
      { text: d.bottomLabel, options: { bold: true, color: C.NAVY } },
      { text: '   |   ', options: { color: C.LINE } },
      { text: d.bottomText, options: { color: C.TXT_MID } },
    ],
    {
      x: s.X(84), y: s.Y(931), w: s.W(1390), h: s.H(53),
      ...H.txtOpts({ fs: s.FS(22), align: 'left' }),
    }
  );
};
