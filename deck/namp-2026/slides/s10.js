'use strict';
/** 10. 2. 사업비 소요명세서 (원본 1536×1024) */
const { C, FONT_B, FONT_M } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 12, fs: s.FS(18) });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 30, ty: 38, tw: 1000, th: 78, tfs: s.FS(55),
    sx: 34, sy: 134, mw: 12, mh: 31, marks: 2,
    sub: d.sub, bx: 72, by: 130, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 62, y: 178, w: 1414, h: 74 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 비목별 산출 (네이티브 표 — 엑셀 붙여넣기 호환) ──────
  H.pill(sl, s, { x: 32, y: 258, w: 948, h: 37 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(24), rad: 6,
  });

  const rowTop = [296, 368, 440, 502, 546];
  const rowH = [72, 72, 62, 44, 58];
  const line = { color: 'E2E5EA', pt: 0.75 };
  sl.addTable(
    d.items.map((it) => ([
      {
        text: it.name,
        options: { fontFace: FONT_B, fontSize: s.FS(25), bold: true, color: C.TXT, align: 'left', valign: 'middle' },
      },
      {
        text: it.calc,
        options: { fontFace: FONT_M, fontSize: s.FS(20), color: C.TXT_MID, align: 'left', valign: 'middle' },
      },
      {
        text: it.amt,
        options: { fontFace: FONT_B, fontSize: s.FS(25), bold: true, color: C.TXT, align: 'right', valign: 'middle' },
      },
    ])),
    {
      x: s.X(108), y: s.Y(296), w: s.W(872),
      // 비목명·금액은 KoPub 실측 폭에 맞춰 열 너비를 다시 나눴다(원본 197/500/175).
      colW: [s.W(230), s.W(442), s.W(200)],
      rowH: rowH.map((h) => s.H(h)),
      border: [
        { type: 'solid', ...line }, { type: 'none' },
        { type: 'solid', ...line }, { type: 'none' },
      ],
      margin: [0, s.W(14), 0, s.W(14)],
      fill: { color: 'FFFFFF' },
    }
  );
  // 번호 배지는 표 왼쪽 바깥에 도형으로 얹는다(표 셀 안에서는 원을 그릴 수 없다).
  d.items.forEach((it, i) => {
    H.numBadge(sl, s, { x: 52, y: rowTop[i] + rowH[i] / 2 - 17, w: 34, h: 34 }, {
      pres, kind: 'circle', n: it.n, fs: s.FS(20),
    });
  });
  H.hline(sl, s, { x: 32, y: 290, w: 948 }, { pres, color: 'E2E5EA' });
  H.hline(sl, s, { x: 32, y: 604, w: 948 }, { pres, color: 'E2E5EA' });

  // ── 총 사업비 ───────────────────────────────────────────
  H.bigNum(sl, s, { x: 1002, y: 257, w: 499, h: 254 }, {
    pres, label: d.bigLabel, lfs: s.FS(26),
    value: d.bigValue, vfs: s.FS(62), unit: d.bigUnit, ufs: s.FS(30),
    note: d.bigNote, nfs: s.FS(24),
  });
  sl.addShape(pres.shapes.RECTANGLE, {
    x: s.X(1002), y: s.Y(521), w: s.W(499), h: s.H(77),
    fill: { color: C.GOLD }, line: { type: 'none' },
  });
  d.supplyBar.forEach((b, i) => {
    const x = 1002 + i * 250;
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(x + 16), y: s.Y(546), w: s.W(28), h: s.H(28),
      fill: { color: 'FFFFFF' }, line: { type: 'none' },
    });
    H.text(sl, s, { x: x + 16, y: 546, w: 28, h: 28 }, {
      text: b.sym, fs: s.FS(19), bold: true, color: C.GOLD, align: 'center',
    });
    H.text(sl, s, { x: x + 50, y: 521, w: 196, h: 77 }, {
      text: b.text, fs: s.FS(20), bold: true, color: C.WHITE, align: 'left', fit: true,
    });
  });

  // ── 직접경비 9개 항목 ───────────────────────────────────
  H.panel(sl, s, { x: 33, y: 636, w: 1466, h: 97 }, P);
  H.pill(sl, s, { x: 32, y: 618, w: 242, h: 36 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(23),
  });
  // 라벨 pill 아래 한 줄로 들어가야 해서 여유(pad)를 크게 잡아 폰트를 낮춘다.
  H.text(sl, s, { x: 45, y: 658, w: 1442, h: 40 }, {
    text: d.directCost, fs: s.FS(24), align: 'center', fit: true, pad: 1.0,
  });
  H.text(sl, s, { x: 45, y: 698, w: 1442, h: 30 }, {
    text: d.directCostNote, fs: s.FS(18), color: C.TXT_SUB, align: 'left', fit: true,
  });

  // ── 산정·집행 원칙 ──────────────────────────────────────
  H.panel(sl, s, { x: 33, y: 766, w: 1466, h: 204 }, P);
  H.pill(sl, s, { x: 31, y: 748, w: 241, h: 37 }, {
    pres, fill: C.NAVY, text: d.sec3, fs: s.FS(23),
  });
  const colX = [50, 552, 1052];
  const colW = [440, 440, 420];
  d.principles.forEach((p, i) => {
    H.numBadge(sl, s, { x: colX[i], y: 806, w: 30, h: 30 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(18),
    });
    // 1열은 본문만 5줄, 2·3열은 본문 2줄 + 주석 3줄 구조다.
    H.text(sl, s, { x: colX[i] + 42, y: 798, w: colW[i], h: p.note ? 66 : 152 }, {
      text: p.body, fs: s.FS(20), align: 'left', valign: 'top', lsm: 1.3, fit: true,
    });
    if (p.note) {
      H.text(sl, s, { x: colX[i] + 42, y: 872, w: colW[i], h: 96 }, {
        text: p.note, fs: s.FS(20), align: 'left', valign: 'top', lsm: 1.3, fit: true,
      });
    }
    if (i < 2) H.vline(sl, s, { x: colX[i] + colW[i] + 44, y: 796, h: 160 }, { pres, color: 'DCE0E6' });
  });

  H.footnote(sl, s, { x: 34, y: 980, fs: s.FS(20), text: d.foot });
};
