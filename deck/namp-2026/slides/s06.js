'use strict';
/** 6. 유사·중복통계 비교와 차별성 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');
const FM = require('../fontmetrics');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 15, fs: s.FS(18) });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 28, ty: 44, tw: 1100, th: 74, tfs: s.FS(48),
    sx: 28, sy: 137, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 56, by: 133, bw: 900, bh: 44, bfs: s.FS(28),
  });
  H.quoteBand(sl, s, { x: 42, y: 164, w: 1456, h: 82 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 3열 비교표 ──────────────────────────────────────────
  const colX = [33, 304, 917];
  const colW = [257, 596, 582];
  const heads = [
    { fill: C.NAVY }, { fill: '6E7175' }, { fill: C.NAVY },
  ];
  d.heads.forEach((t, i) => {
    H.pill(sl, s, { x: i === 1 ? 313 : colX[i] + 10, y: 267, w: i === 1 ? 577 : colW[i] - 20, h: 43 }, {
      pres, fill: heads[i].fill, text: t, fs: s.FS(26),
    });
  });

  // 우측 큰 패널(본 조사 열 배경)
  H.panel(sl, s, { x: 917, y: 319, w: 582, h: 327 }, { pres, fill: 'EFF4FA' });

  const rowY = [319, 415, 496, 574];
  const rowH = [95, 79, 76, 73];
  d.rows.forEach((r, i) => {
    const y = rowY[i], h = rowH[i];
    // 비교 축
    H.panel(sl, s, { x: 33, y, w: 257, h }, { pres, fill: i % 2 ? C.PANEL : 'EEF0F4' });
    H.numBadge(sl, s, { x: 52, y: y + h / 2 - 14, w: 29, h: 29 }, {
      pres, kind: 'circle', n: r.n, fs: s.FS(18),
    });
    H.text(sl, s, { x: 92, y, w: 180, h }, {
      text: r.axis, fs: s.FS(24), bold: true, align: 'left', fit: true,
    });
    H.chevron(sl, s, { x: 272, y: y + h / 2 - 11, w: 20, h: 22 }, { pres, fill: 'B9BEC6' });
    // 타 조사
    H.panel(sl, s, { x: 304, y, w: 596, h }, { pres, fill: i % 2 ? 'FFFFFF' : 'F7F8FA' });
    H.text(sl, s, { x: 312, y, w: 580, h }, {
      text: r.a, fs: s.FS(21), align: 'center', lsm: 1.25, fit: true,
    });
    // 본 조사
    H.text(sl, s, { x: 925, y, w: 566, h }, {
      text: r.b, fs: s.FS(21), bold: true, color: C.BLUE_TXT, align: 'center', lsm: 1.25, fit: true,
    });
    if (i < 3) H.hline(sl, s, { x: 33, y: y + h, w: 1466 }, { pres, color: 'E2E5EA' });
  });

  // ── 중복 판정 원칙 ──────────────────────────────────────
  H.panel(sl, s, { x: 25, y: 688, w: 1485, h: 262 }, P);
  H.pill(sl, s, { x: 595, y: 667, w: 334, h: 42 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(26),
  });

  const pX = [45, 548, 1052];
  const pW = [452, 458, 432];
  d.principles.forEach((p, i) => {
    H.numBadge(sl, s, { x: pX[i], y: 726, w: 30, h: 30 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(18), fill: C.GOLD,
    });
    H.text(sl, s, { x: pX[i] + 42, y: 722, w: pW[i], h: 34 }, {
      text: p.head, fs: s.FS(21), bold: true, align: 'left', fit: true,
    });

    // 본문이 몇 줄로 접히는지 실제 폰트 폭으로 계산해 구분선·하위 불릿 위치를 잡는다.
    // \n 개수만 세면 접힌 줄을 놓쳐 아래 요소와 겹친다.
    const bodyFs = s.FS(21);
    const bodyLines = FM.lineCount(p.body, bodyFs, s.W(pW[i]) - 0.06, false);
    const bodyH = Math.ceil(bodyLines * bodyFs * 1.3 * 1.18 * (1536 / 11) / 72) + 6;

    H.text(sl, s, { x: pX[i] + 42, y: 758, w: pW[i], h: bodyH }, {
      text: p.body, fs: bodyFs, align: 'left', valign: 'top', lsm: 1.3,
    });
    if (p.sub) {
      const subY = 758 + bodyH + 16;
      H.hline(sl, s, { x: pX[i] + 42, y: subY - 12, w: pW[i] }, { pres, color: 'DCE0E6' });
      H.bullets(sl, s, { x: pX[i] + 46, y: subY, w: pW[i] - 4, h: 930 - subY }, {
        items: p.sub, fs: s.FS(20), gap: 2, lsm: 1.25,
      });
    }
    if (i < 2) H.vline(sl, s, { x: pX[i] + pW[i] + 52, y: 715, h: 215 }, { pres, color: 'DCE0E6' });
  });

  H.footnote(sl, s, { x: 34, y: 962, fs: s.FS(20), text: d.foot });
};
