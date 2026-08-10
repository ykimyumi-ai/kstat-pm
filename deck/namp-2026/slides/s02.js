'use strict';
/** 2. 조사원 선발 및 교육 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 32, ty: 8, tw: 1000, th: 74, tfs: s.FS(54),
    sx: 38, sy: 114, mw: 13, mh: 33, marks: 2,
    sub: d.sub, bx: 76, by: 110, bw: 900, bh: 46, bfs: s.FS(33),
  });
  H.quoteBand(sl, s, { x: 88, y: 162, w: 1360, h: 104 }, {
    pres, runs: d.quote, fs: s.FS(29), lsm: 1.4,
  });

  // ── 좌: 투입 설계 기준 ──────────────────────────────────
  H.panel(sl, s, { x: 37, y: 343, w: 593, h: 496 }, P);
  H.pill(sl, s, { x: 37, y: 288, w: 593, h: 53 }, {
    pres, fill: C.NAVY, text: d.leftHead, fs: s.FS(30),
  });

  const cardY = [378, 500, 623];
  d.designCards.forEach((t, i) => {
    H.card(sl, s, { x: 55, y: cardY[i], w: 557, h: 96 }, { pres, line: C.LINE });
    H.numBadge(sl, s, { x: 75, y: cardY[i] + 25, w: 45, h: 45 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(24),
    });
    H.text(sl, s, { x: 131, y: cardY[i], w: 476, h: 96 }, {
      text: t, fs: s.FS(22), align: 'left', lsm: 1.3, fit: true, pad: 0.02,
    });
  });
  H.pill(sl, s, { x: 54, y: 765, w: 555, h: 50 }, {
    pres, fill: C.GOLD, text: d.reserveBar, fs: s.FS(28),
  });

  // ── 우: 역할별 운영 조직 ────────────────────────────────
  H.panel(sl, s, { x: 653, y: 342, w: 846, h: 497 }, P);
  H.pill(sl, s, { x: 653, y: 289, w: 846, h: 52 }, {
    pres, fill: C.NAVY, text: d.rightHead, fs: s.FS(30),
  });

  const orgY = [368, 449, 612, 684, 759];
  const orgH = [51, 132, 50, 52, 52];
  d.orgRows.forEach((r, i) => {
    const y = orgY[i], h = orgH[i];
    H.card(sl, s, { x: 672, y: y - 6, w: 812, h: h + 12 }, { pres, line: C.LINE });
    H.pill(sl, s, { x: 708, y, w: 251, h }, {
      pres, fill: C.NAVY, text: r.roleFull || r.role, fs: s.FS(24),
    });
    // 설명 — 주석이 붙는 행은 위쪽에 붙여 배치하고 아래를 주석에 내준다.
    H.text(sl, s, { x: 980, y: r.note ? y + 1 : y, w: 504, h: r.note ? 84 : h }, {
      text: r.desc, fs: s.FS(22), align: 'left', lsm: r.note ? 1.06 : 1.24,
      fit: true, pad: 0.02, valign: r.note ? 'top' : 'middle',
    });
    if (r.note) {
      // 원본 주석은 10pt보다 작지만 kstat-ppt 최소 10pt 규칙을 지키느라
      // 한 줄이 두 줄로 늘어난다. 그만큼 본문 줄간격을 좁혀 자리를 만들었다.
      H.text(sl, s, { x: 980, y: y + 87, w: 504, h: 44 }, {
        text: r.note, fs: s.FS(16), color: C.TXT_SUB, align: 'left',
        valign: 'top', lsm: 1.02,
      });
    }
  });
  // 좌측 세로 연결선과 연결점은 흰 카드 위에 얹혀야 하므로 마지막에 그린다.
  H.vline(sl, s, { x: 681, y: 392, h: 394 }, { pres, color: C.NAVY, thick: 2 });
  d.orgRows.forEach((r, i) => {
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(675), y: s.Y(orgY[i] + orgH[i] / 2 - 6), w: s.W(13), h: s.H(13),
      fill: { color: C.NAVY }, line: { type: 'none' },
    });
  });

  // ── 하단: 배치 원칙 ─────────────────────────────────────
  H.panel(sl, s, { x: 38, y: 874, w: 1460, h: 99 }, P);
  H.pill(sl, s, { x: 54, y: 893, w: 167, h: 61 }, {
    pres, fill: C.NAVY, text: d.bottomLabel, fs: s.FS(26),
  });
  H.text(sl, s, { x: 250, y: 893, w: 1230, h: 61 }, {
    text: d.bottomText, fs: s.FS(26), align: 'left', fit: true,
  });
};
