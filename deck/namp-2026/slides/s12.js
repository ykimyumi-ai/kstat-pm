'use strict';
/**
 * 12. 에너지경비 연동 대비 문항 설계 (원본 1536×1024)
 *
 * 좌표는 원본 PNG 실측값이다.
 *   좌 패널 44,232 884×458 / 행 구분선 y=403·525
 *   우 패널 955,232 533×458 / 행 구분선 y=442
 *   하단 패널 37,730 1455×224 / 열 구분선 x=502·809·1143
 */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 18, ty: 6, tw: 1200, th: 74, tfs: s.FS(52),
    sx: 22, sy: 90, mw: 12, mh: 31, marks: 1,
    sub: d.sub, bx: 52, by: 86, bw: 900, bh: 44, bfs: s.FS(29),
  });
  // 원본 인용문 글자 범위는 x=191~1435(1244px). 대괄호가 그 바깥에 오도록 잡는다.
  H.quoteBand(sl, s, { x: 140, y: 136, w: 1330, h: 68 }, {
    pres, runs: d.quote, fs: s.FS(30), padX: 40,
  });

  // ── 좌: 측정 문항 3종 ───────────────────────────────────
  H.panel(sl, s, { x: 44, y: 232, w: 884, h: 458 }, P);
  H.pill(sl, s, { x: 208, y: 213, w: 419, h: 42 }, {
    pres, fill: C.NAVY, text: d.leftHead, fs: s.FS(26),
  });

  // 행 경계·본문 y·줄간격 모두 원본 실측. 줄간격(lsm)은 원본의 줄 간격(px)을
  // 10pt 기준으로 환산한 값이다 — 원본 텍스트가 10pt보다 작아 그대로 두면
  // 줄이 벌어진다.
  const L = [
    { top: 232, bot: 403, badgeY: 272, nameY: 266, nameH: 78,
      bodyY: 264, bodyH: 138, bodyLsm: 1.17,
      badgeY2: 271, basisY: 300, basisH: 100 },
    { top: 403, bot: 525, badgeY: 422, nameY: 414, nameH: 44,
      bodyY: 408, bodyH: 112, bodyLsm: 1.48,
      badgeY2: 416, basisY: 446, basisH: 74 },
    { top: 525, bot: 690, badgeY: 543, nameY: 536, nameH: 78,
      bodyY: 530, bodyH: 155, bodyLsm: 1.22,
      badgeY2: 542, basisY: 572, basisH: 110 },
  ];

  d.leftRows.forEach((r, i) => {
    const g = L[i];
    H.numBadge(sl, s, { x: 68, y: g.badgeY, w: 36, h: 42 }, {
      pres, kind: 'hexagon', n: r.n, fs: s.FS(22),
    });
    H.text(sl, s, { x: 126, y: g.nameY, w: 155, h: g.nameH }, {
      text: r.name, fs: s.FS(30), bold: true, color: C.BLUE_TXT,
      align: 'left', valign: 'top', lsm: 1.3, fit: true, pad: 0.02,
    });
    H.text(sl, s, { x: 291, y: g.bodyY, w: 405, h: g.bodyH }, {
      text: r.body, fs: s.FS(19), align: 'left', valign: 'top',
      lsm: g.bodyLsm, fit: true, pad: 0.02,
    });
    H.vline(sl, s, { x: 700, y: g.top + 14, h: g.bot - g.top - 28 }, { pres, color: 'E2E5EA' });
    H.goldBadge(sl, s, { x: 763, y: g.badgeY2, w: 100, h: 26 }, {
      pres, text: d.basisLabel, fs: s.FS(19),
    });
    // 근거 열은 원본(159px)보다 넓은 214px다 — 10pt 하한에서 '연동 산식 적용의
    // 전제 조건'이 한 줄로 들어가려면 이만큼 필요하다.
    H.text(sl, s, { x: 706, y: g.basisY, w: 214, h: g.basisH }, {
      text: r.basis, fs: s.FS(16), align: 'center', valign: 'top',
      lsm: 1.05, fit: true, pad: 0.02,
    });
    if (i < 2) H.hline(sl, s, { x: 68, y: g.bot, w: 836 }, { pres, color: 'E4E7EC' });
  });

  // ── 우: 증빙·부담 관리 2종 ──────────────────────────────
  H.panel(sl, s, { x: 955, y: 232, w: 533, h: 458 }, P);
  H.pill(sl, s, { x: 986, y: 213, w: 408, h: 43 }, {
    pres, fill: C.NAVY, text: d.rightHead, fs: s.FS(26),
  });

  const R = [
    { badgeY: 273, bodyY: 310, bodyH: 92, bodyLsm: 1.25, gY: 414, basisY: 404, basisH: 56 },
    { badgeY: 475, bodyY: 509, bodyH: 120, bodyLsm: 1.22, gY: 637, basisY: 627, basisH: 56 },
  ];
  d.rightRows.forEach((r, i) => {
    const g = R[i];
    H.numBadge(sl, s, { x: 977, y: g.badgeY, w: 36, h: 42 }, {
      pres, kind: 'hexagon', n: r.n, fs: s.FS(22),
    });
    H.text(sl, s, { x: 1030, y: g.badgeY, w: 380, h: 42 }, {
      text: r.name, fs: s.FS(30), bold: true, color: C.BLUE_TXT, align: 'left', fit: true,
    });
    H.text(sl, s, { x: 997, y: g.bodyY, w: 473, h: g.bodyH }, {
      text: r.body, fs: s.FS(19), align: 'left', valign: 'top',
      lsm: g.bodyLsm, fit: true, pad: 0.02,
    });
    H.goldBadge(sl, s, { x: 994, y: g.gY, w: 103, h: 28 }, {
      pres, text: d.basisLabel, fs: s.FS(19),
    });
    H.text(sl, s, { x: 1112, y: g.basisY, w: 364, h: g.basisH }, {
      text: r.basis, fs: s.FS(19), align: 'left', valign: 'top',
      lsm: 1.06, fit: true, pad: 0.02,
    });
    if (i === 0) H.hline(sl, s, { x: 976, y: 442, w: 492 }, { pres, color: 'E4E7EC' });
  });

  // ── 하단: 시행 전 준비도 측정 원칙 ──────────────────────
  H.panel(sl, s, { x: 37, y: 730, w: 1455, h: 224 }, P);
  H.pill(sl, s, { x: 471, y: 711, w: 524, h: 44 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(28),
  });

  // 실측 배지 x=64/527/844/1184, 구분선 x=494/809/1143.
  // 첫 열만 10pt에서 한 줄이 더 필요해 구분선을 8px 오른쪽으로 옮겼다.
  const B = [
    { bx: 64, by: 759, tx: 110, ty: 755, w: 440, byy: 800, bh: 150, lsm: 1.04, div: 502 },
    { bx: 527, by: 764, tx: 573, ty: 760, w: 275, byy: 811, bh: 140, lsm: 1.15, div: 809 },
    { bx: 844, by: 764, tx: 890, ty: 760, w: 292, byy: 815, bh: 136, lsm: 1.15, div: 1143 },
    { bx: 1184, by: 761, tx: 1230, ty: 757, w: 292, byy: 814, bh: 136, lsm: 1.20 },
  ];
  d.principles.forEach((p, i) => {
    const g = B[i];
    H.numBadge(sl, s, { x: g.bx, y: g.by, w: 34, h: 38 }, {
      pres, kind: 'square', n: i + 1, fs: s.FS(21),
    });
    H.text(sl, s, { x: g.tx, y: g.ty, w: g.w - 40, h: 44 }, {
      text: p.head, fs: s.FS(26), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
    });
    H.text(sl, s, { x: g.bx - 3, y: g.byy, w: g.w, h: g.bh }, {
      text: p.body, fs: s.FS(19), align: 'left', valign: 'top',
      lsm: g.lsm, fit: true, pad: 0.02,
    });
    if (g.div) H.vline(sl, s, { x: g.div, y: 752, h: 186 }, { pres, color: 'DCE0E6' });
  });

  H.footnote(sl, s, { x: 38, y: 966, fs: s.FS(20), text: d.foot });
};
