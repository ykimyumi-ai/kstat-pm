'use strict';
/** 3. 통계산출 및 결과 분석 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 26, ty: 8, tw: 1000, th: 70, tfs: s.FS(48),
    sx: 26, sy: 104, mw: 12, mh: 31, marks: 1,
    sub: d.sub, bx: 54, by: 100, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 46, y: 152, w: 1446, h: 84 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 4단계 가로 프로세스 ─────────────────────────────────
  const colX = [45, 374, 737, 1108];
  const colW = [293, 323, 333, 386];
  const badgeX = [167, 505, 878, 1281];

  H.hline(sl, s, { x: 45, y: 276, w: 1449 }, { pres, color: C.LINE, thick: 2 });

  d.stages.forEach((st, i) => {
    // 번호 사각 배지
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(badgeX[i]), y: s.Y(258), w: s.W(41), h: s.H(39),
      fill: { color: C.NAVY_DEEP }, line: { type: 'none' },
    });
    H.text(sl, s, { x: badgeX[i], y: 258, w: 41, h: 39 }, {
      text: String(st.n), fs: s.FS(24), bold: true, color: C.WHITE, align: 'center',
    });
    // 단계명
    H.text(sl, s, { x: colX[i], y: 306, w: colW[i], h: 42 }, {
      text: st.name, fs: s.FS(29), bold: true, color: C.NAVY_DEEP, align: 'center', fit: true,
    });
    // 불릿 카드 — 원본은 357~628px이지만 원본 본문이 10pt 미만이라
    // kstat-ppt 최소 10pt를 지키면서 담으려면 아래로 7px 정도 여유가 필요하다.
    H.card(sl, s, { x: colX[i], y: 357, w: colW[i], h: 278 }, { pres, line: C.LINE });
    H.richBullets(sl, s, { x: colX[i] + 14, y: 363, w: colW[i] - 26, h: 268 }, {
      groups: st.bullets, fs: s.FS(21), gap: 3, lsm: 1.08,
    });
    // 하향 화살표
    H.arrowDown(sl, s, { x: colX[i] + colW[i] / 2 - 8, y: 638, w: 16, h: 16 }, P);
    // 크림 결과 박스
    H.panel(sl, s, { x: colX[i], y: 656, w: colW[i], h: 83 }, { pres, fill: C.CREAM });
    H.text(sl, s, { x: colX[i] + 8, y: 656, w: colW[i] - 16, h: 83 }, {
      text: st.out, fs: s.FS(21), bold: true, align: 'center', lsm: 1.25, fit: true,
    });
  });

  // ── 하단: 공표·정밀도 기준 ──────────────────────────────
  H.panel(sl, s, { x: 46, y: 778, w: 1445, h: 171 }, P);
  H.pill(sl, s, { x: 617, y: 759, w: 288, h: 38 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(24),
  });

  const pX = [66, 552, 1052];
  const pW = [440, 460, 400];
  d.principles.forEach((p, i) => {
    H.numBadge(sl, s, { x: pX[i], y: 815, w: 32, h: 32 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(19),
    });
    sl.addText(
      p.runs.map((r) => ({
        text: r.t,
        options: { bold: !!r.b, color: r.c === 'BLUE' ? C.BLUE_TXT : C.TXT },
      })),
      {
        x: s.X(pX[i] + 44), y: s.Y(810), w: s.W(pW[i]), h: s.H(126),
        ...H.txtOpts({ fs: s.FS(20), align: 'left', valign: 'top', lsm: 1.3 }),
      }
    );
    if (i < 2) H.vline(sl, s, { x: pX[i] + pW[i] + 56, y: 805, h: 118 }, { pres, color: C.LINE });
  });

  H.footnote(sl, s, { y: 962, fs: s.FS(20), text: d.foot });
};
