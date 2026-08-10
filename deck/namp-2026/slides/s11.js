'use strict';
/** 11. 5. 데이터 품질관리와 민감문항 운영 (원본 1492×1054 — A4 가로 비율) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 20, fs: s.FS(19) });
  H.chapterBadge(sl, s, {
    x: 1000, y: 20, w: 460, h: 34, fs: s.FS(21),
    runs: [
      { text: 'Ⅲ', options: { color: C.NAVY, bold: true } },
      { text: '  |  과업 관리 방안', options: { color: C.TXT_SUB } },
    ],
  });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 28, ty: 44, tw: 1100, th: 72, tfs: s.FS(45),
    sx: 32, sy: 133, mw: 12, mh: 30, marks: 2,
    sub: d.sub, bx: 70, by: 129, bw: 900, bh: 44, bfs: s.FS(28),
  });
  H.quoteBand(sl, s, { x: 130, y: 172, w: 1240, h: 78 }, {
    pres, runs: d.quote, fs: s.FS(28),
  });

  // ── 5대 품질 리스크와 대응 ──────────────────────────────
  H.panel(sl, s, { x: 32, y: 290, w: 1428, h: 428 }, P);
  H.pill(sl, s, { x: 30, y: 272, w: 295, h: 45 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(26),
  });

  const rowY = [325, 403, 480, 552, 620];
  const rowH = [56, 56, 56, 56, 96];
  d.rows.forEach((r, i) => {
    const y = rowY[i], h = rowH[i];
    H.card(sl, s, { x: 52, y, w: 1390, h }, { pres });
    // 육각 번호 배지
    H.numBadge(sl, s, { x: 76, y: y + h / 2 - 20, w: 38, h: 40 }, {
      pres, kind: 'hexagon', n: r.n, fs: s.FS(20), fill: C.NAVY_DEEP,
    });
    H.text(sl, s, { x: 130, y, w: 180, h }, {
      text: r.risk, fs: s.FS(24), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
    });
    H.panel(sl, s, { x: 315, y: y + 8, w: 430, h: h - 16 }, { pres, fill: 'EFF1F4' });
    H.text(sl, s, { x: 323, y: y + 8, w: 414, h: h - 16 }, {
      text: r.cause, fs: s.FS(21), align: 'center', lsm: 1.25, fit: true,
    });
    H.arrowBadge(sl, s, { x: 780, y: y + h / 2 - 16, w: 151, h: 32 }, {
      pres, text: d.resLabel, fs: s.FS(19),
    });
    H.text(sl, s, { x: 960, y, w: 470, h }, {
      text: r.res, fs: s.FS(21), align: 'left', lsm: 1.25, fit: true,
    });
  });

  // ── 운영 원칙 ───────────────────────────────────────────
  H.panel(sl, s, { x: 48, y: 781, w: 1416, h: 197 }, P);
  H.pill(sl, s, { x: 30, y: 754, w: 243, h: 42 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(26),
  });

  const colX = [70, 780];
  d.principles.forEach((t, i) => {
    // 원본은 좌열에 1·2, 우열에 3·4를 세로로 쌓는다.
    const col = i < 2 ? 0 : 1;
    const row = i % 2;
    const x = colX[col];
    const y = 806 + row * 84;
    H.numBadge(sl, s, { x, y, w: 30, h: 30 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(18),
    });
    H.text(sl, s, { x: x + 42, y: y - 4, w: 610, h: 78 }, {
      text: t, fs: s.FS(20), align: 'left', valign: 'top', lsm: 1.28, fit: true,
    });
  });
  H.vline(sl, s, { x: 740, y: 800, h: 164 }, { pres, color: 'DCE0E6' });
  H.hline(sl, s, { x: 70, y: 880, w: 630 }, { pres, color: 'E4E7EC' });
  H.hline(sl, s, { x: 780, y: 880, w: 630 }, { pres, color: 'E4E7EC' });

  H.footnote(sl, s, { x: 46, y: 1000, fs: s.FS(20), text: d.foot });
};
