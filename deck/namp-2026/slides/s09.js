'use strict';
/** 9. 정기통계품질진단 6대 차원 대응 (원본 1492×1054 — A4 가로 비율) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 36, ty: 18, tw: 1200, th: 76, tfs: s.FS(52),
    sx: 36, sy: 114, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 64, by: 110, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 118, y: 158, w: 1262, h: 84 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 6대 품질 차원 ───────────────────────────────────────
  H.panel(sl, s, { x: 34, y: 277, w: 1426, h: 423 }, P);
  H.pill(sl, s, { x: 578, y: 257, w: 337, h: 40 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(25),
  });

  const rowY = [315, 378, 441, 504, 566, 628];
  d.rows.forEach((r, i) => {
    const y = rowY[i];
    H.card(sl, s, { x: 52, y, w: 1390, h: 54 }, { pres });
    H.numBadge(sl, s, { x: 96, y: y + 12, w: 31, h: 31 }, {
      pres, kind: 'circle', n: r.n, fs: s.FS(19),
    });
    H.text(sl, s, { x: 152, y, w: 200, h: 54 }, {
      text: r.dim, fs: s.FS(24), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
    });
    H.vline(sl, s, { x: 370, y: y + 12, h: 30 }, { pres, color: 'DCE0E6' });
    H.text(sl, s, { x: 396, y, w: 340, h: 54 }, {
      text: r.req, fs: s.FS(22), align: 'left', fit: true,
    });
    H.vline(sl, s, { x: 752, y: y + 12, h: 30 }, { pres, color: 'DCE0E6' });
    H.text(sl, s, { x: 776, y, w: 200, h: 54 }, {
      text: d.resLabel, fs: s.FS(22), bold: true, color: C.GOLD, align: 'left', fit: true,
    });
    H.vline(sl, s, { x: 990, y: y + 12, h: 30 }, { pres, color: 'DCE0E6' });
    H.text(sl, s, { x: 1012, y, w: 418, h: 54 }, {
      text: r.res, fs: s.FS(22), align: 'left', fit: true,
    });
  });

  // ── 품질진단 사전 준비 ──────────────────────────────────
  H.panel(sl, s, { x: 33, y: 741, w: 1427, h: 193 }, P);
  H.pill(sl, s, { x: 557, y: 726, w: 379, h: 41 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(25),
  });

  const colX = [70, 800];
  d.prep.forEach((p, i) => {
    // 원본은 좌열에 1·2, 우열에 3·4를 세로로 쌓는다.
    const col = i < 2 ? 0 : 1;
    const row = i % 2;
    const x = colX[col];
    const y = 786 + row * 62;
    H.text(sl, s, { x, y, w: 24, h: 30 }, {
      text: '✓', fs: s.FS(22), bold: true, color: C.NAVY, align: 'center',
    });
    H.text(sl, s, { x: x + 32, y: y - 4, w: 590, h: p.note ? 40 : 56 }, {
      text: p.text, fs: s.FS(21), align: 'left', valign: 'top', lsm: 1.3, fit: true,
    });
    if (p.note) {
      H.text(sl, s, { x: x + 32, y: y + 32, w: 600, h: 30 }, {
        text: p.note, fs: s.FS(17), color: C.TXT_SUB, align: 'left', fit: true,
      });
    }
  });
  H.vline(sl, s, { x: 740, y: 776, h: 130 }, { pres, color: 'DCE0E6' });

  H.footnote(sl, s, { x: 46, y: 966, fs: s.FS(20), text: d.foot });
};
