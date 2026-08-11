'use strict';
/**
 * 13. 제도 작동 지표 산출 기준 (원본 1536×1024)
 *
 * 좌표는 원본 PNG 실측값이다.
 *   좌 패널 18,226 908×482 / 열 구분선 x=465 / 행 구분선 y=455
 *   우 패널 952,226 566×482 / 행 구분선 y=396·543
 *   하단 패널 18,744 1501×233 / 배지 x=63·430·801·1162
 *
 * 다만 좌 패널은 원본보다 18px 넓다(18~944). 10pt 하한에서 ③ 회피율·② 이행률
 * 산식이 각각 465px·430px를 요구해 원본 폭(각 395·420px)으로는 두 줄이 되기 때문이다.
 */
const { C } = require('../theme');
const H = require('../helpers');

// 하단 4열 좌측 악센트 바 색상
const ACCENT = {
  NAVY: C.NAVY,
  GOLD: C.GOLD,
  SKY: '5BA3D0',
  NAVY_DEEP: C.NAVY_DEEP,
};

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 16, ty: 4, tw: 1200, th: 76, tfs: s.FS(55),
    sx: 18, sy: 88, mw: 12, mh: 31, marks: 2,
    sub: d.sub, bx: 62, by: 84, bw: 900, bh: 44, bfs: s.FS(31),
  });
  // 13장만 대괄호가 아니라 테두리 박스형 인용이다(원본 테두리 x=146~1390, y=137~).
  H.quoteBand(sl, s, { x: 146, y: 133, w: 1250, h: 58 }, {
    pres, runs: d.quote, fs: s.FS(29), style: 'box', padX: 40,
  });

  /** 지표 카드 1칸: 번호 + 지표명 + 산식 박스 + 기준·제외 태그 + 불릿 */
  const drawCard = (it, g) => {
    H.numBadge(sl, s, { x: g.bx, y: g.by, w: 27, h: 31 }, {
      pres, kind: 'square', n: it.n, fs: s.FS(19),
    });
    H.text(sl, s, { x: g.bx + 42, y: g.by - 5, w: g.fw - 50, h: 40 }, {
      text: it.name, fs: s.FS(31), bold: true, color: C.BLUE_TXT, align: 'left', fit: true,
    });
    H.formulaBox(sl, s, { x: g.fx, y: g.fy, w: g.fw, h: 32 }, {
      pres, text: it.formula, fs: s.FS(22),
    });
    H.goldBadge(sl, s, { x: g.fx + 2, y: g.ty, w: 88, h: 25 }, {
      pres, text: d.ruleLabel, fs: s.FS(18),
    });
    H.bullets(sl, s, { x: g.lx, y: g.ly, w: g.lw, h: g.lh }, {
      items: it.rules, fs: s.FS(19), gap: 1, lsm: g.lsm,
    });
  };

  // ── 좌: 핵심 작동지표 4종 (2×2) ─────────────────────────
  H.panel(sl, s, { x: 18, y: 226, w: 932, h: 482 }, { pres, fill: 'FCFDFE', line: 'E4E7EC' });
  H.pill(sl, s, { x: 233, y: 207, w: 443, h: 39 }, {
    pres, fill: C.NAVY, text: d.leftHead, fs: s.FS(26),
  });
  H.hline(sl, s, { x: 38, y: 455, w: 892 }, { pres, color: 'E4E7EC' });
  H.vline(sl, s, { x: 504, y: 250, h: 430 }, { pres, color: 'E4E7EC' });

  const coreGeom = [
    // ① 도입률 / ② 이행률 (윗줄) — 불릿 3줄·1줄
    { bx: 48, by: 259, fx: 30, fy: 298, fw: 468, ty: 344, lx: 44, lw: 458, ly: 370, lh: 80, lsm: 1.03 },
    { bx: 514, by: 260, fx: 512, fy: 298, fw: 430, ty: 344, lx: 522, lw: 420, ly: 370, lh: 80, lsm: 1.03 },
    // ③ 회피율 / ④ 반영률 (아랫줄) — 불릿 5줄·4줄
    { bx: 48, by: 467, fx: 30, fy: 505, fw: 468, ty: 546, lx: 44, lw: 458, ly: 570, lh: 122, lsm: 0.95 },
    { bx: 514, by: 467, fx: 512, fy: 505, fw: 430, ty: 546, lx: 522, lw: 420, ly: 570, lh: 122, lsm: 1.06 },
  ];
  d.core.forEach((it, i) => drawCard(it, coreGeom[i]));

  // ── 우: 보완지표 3종 ────────────────────────────────────
  H.panel(sl, s, { x: 956, y: 226, w: 562, h: 482 }, { pres, fill: 'FCFDFE', line: 'E4E7EC' });
  H.pill(sl, s, { x: 1001, y: 207, w: 453, h: 39 }, {
    pres, fill: C.NAVY, text: d.rightHead, fs: s.FS(26),
  });

  // 우측은 기준·제외 태그가 불릿 왼쪽에 나란히 놓인다.
  const suppGeom = [
    { by: 259, fy: 295, ty: 339, ly: 338, lh: 56, div: 396 },
    { by: 407, fy: 443, ty: 488, ly: 487, lh: 56, div: 543 },
    { by: 554, fy: 590, ty: 634, ly: 633, lh: 66 },
  ];
  d.supp.forEach((it, i) => {
    const g = suppGeom[i];
    H.numBadge(sl, s, { x: 981, y: g.by, w: 27, h: 31 }, {
      pres, kind: 'square', n: it.n, fs: s.FS(19),
    });
    H.text(sl, s, { x: 1023, y: g.by - 5, w: 460, h: 40 }, {
      text: it.name, fs: s.FS(31), bold: true, color: C.BLUE_TXT, align: 'left', fit: true,
    });
    H.formulaBox(sl, s, { x: 981, y: g.fy, w: 495, h: 32 }, {
      pres, text: it.formula, fs: s.FS(22),
    });
    H.goldBadge(sl, s, { x: 979, y: g.ty, w: 88, h: 25 }, {
      pres, text: d.ruleLabel, fs: s.FS(18),
    });
    H.bullets(sl, s, { x: 1078, y: g.ly, w: 398, h: g.lh }, {
      items: it.rules, fs: s.FS(19), gap: 1, lsm: 1.0,
    });
    if (g.div) H.hline(sl, s, { x: 974, y: g.div, w: 530 }, { pres, color: 'E4E7EC' });
  });

  // ── 하단: 공표·산출 원칙 ────────────────────────────────
  H.panel(sl, s, { x: 18, y: 744, w: 1501, h: 233 }, P);
  H.pill(sl, s, { x: 474, y: 724, w: 526, h: 39 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(28),
  });

  const cX = [63, 430, 801, 1162];
  d.principles.forEach((p, i) => {
    // 좌측 컬러 악센트 바
    H.vline(sl, s, { x: cX[i] - 24, y: 776, h: 176 }, { pres, color: ACCENT[p.accent], thick: 5 });
    H.numBadge(sl, s, { x: cX[i], y: 782, w: 26, h: 29 }, {
      pres, kind: 'square', n: i + 1, fs: s.FS(18),
    });
    H.text(sl, s, { x: cX[i] + 38, y: 779, w: 300, h: 36 }, {
      text: p.head, fs: s.FS(24), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
    });
    H.text(sl, s, { x: cX[i], y: 822, w: 340, h: 134 }, {
      text: p.body, fs: s.FS(19), align: 'left', valign: 'top', lsm: 1.22, fit: true, pad: 0.02,
    });
  });

  H.footnote(sl, s, { x: 22, y: 986, fs: s.FS(20), text: d.foot });
};
