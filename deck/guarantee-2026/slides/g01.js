'use strict';
/**
 * 1장 — 창업 및 사업 이력
 *
 * 좌표는 전부 원본 150dpi 렌더(1600×2400)의 실측 픽셀이다.
 * 카드 3장 + 하단 결론 밴드. 도넛 하나만 네이티브 차트다.
 */
const { C } = require('../theme');
const H = require('../helpers');
const CH = require('../charts');

// 카드 공통 — 세 장 모두 같은 가로 폭·테두리
const CARD_X = 47;
const CARD_W = 1502;

module.exports = function draw(pres, sl, d, s) {
  // ── 머리 ─────────────────────────────────────────────────
  H.image(sl, s, { x: 1020, y: 40, w: 538, h: 278 }, { name: d.art });
  H.image(sl, s, { x: 936, y: 246, w: 86, h: 72 }, { name: 'g01-hero-cloud' });
  H.chapterHead(sl, s, {
    x: 49, y: 35, bw: 179, bh: 166,
    tx: 274, ty: 52, tw: 700, th: 110,
    sy: 163, sh: 62, sw: 760,
  }, {
    pres, no: d.no, noFs: s.FSD(87),
    title: d.title, titleFs: s.FS(82),
    sub: d.sub, subFs: s.FS(39), subFit: true,
  });

  const S = d.sections;

  // ── 카드 1 : 어떤 사람들이 창업했을까? ────────────────────
  H.roundRect(sl, s, { x: CARD_X, y: 321, w: CARD_W, h: 463 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 79, y: 354, w: 508, h: 80 }, {
    pres, no: S[0].no, noFs: s.FSD(40), bw: 74, gap: 28,
    title: S[0].head, fs: s.FS(34), rad: 12,
  });
  H.text(sl, s, { x: 623, y: 368, w: 900, h: 62 }, {
    text: S[0].lead, fs: s.FS(31), bold: true, color: C.NAVY, valign: 'middle',
  });

  // 세 칸 사이 옅은 세로 구분선 (원본은 점선이다)
  [581, 1069].forEach((x) => {
    H.vline(sl, s, { x, y: 466, h: 250 }, { pres, color: 'E6EDF4', width: 1 });
  });

  // 칸마다 일러스트 + 큰 수치 + 두 줄 라벨
  const stat = [
    { img: { x: 70, y: 460, w: 225, h: 258 }, nx: 312, base: 590, lx: 314, ly: 606, la: 'left' },
    { img: { x: 592, y: 484, w: 222, h: 236 }, nx: 827, base: 594, lx: 828, ly: 612, la: 'left' },
    { img: { x: 1086, y: 482, w: 188, h: 238 }, nx: 1306, base: 594, lx: 1258, ly: 609, la: 'center' },
  ];
  S[0].stats.forEach((t, i) => {
    const g = stat[i];
    H.image(sl, s, g.img, { name: t.img });
    H.bigValue(sl, s, { x: g.nx, base: g.base, w: 300 }, {
      v: t.v, u: t.u, vFs: s.FSD(75), uFs: s.FSD(46), align: 'left',
    });
    H.text(sl, s, { x: g.lx, y: g.ly, w: 268, h: 112 }, {
      text: `${t.l1}\n${t.l2}`, fs: s.FS(34), bold: true, color: C.TXT,
      align: g.la, valign: 'top', lsm: 1.16,
    });
  });

  // ── 카드 2 : 한 번의 창업으로 끝나지 않았다 ───────────────
  H.roundRect(sl, s, { x: CARD_X, y: 821, w: CARD_W, h: 616 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 78, y: 849, w: 565, h: 81 }, {
    pres, no: S[1].no, noFs: s.FSD(41), bw: 74, gap: 28,
    title: S[1].head, fs: s.FS(34), rad: 12,
  });
  H.text(sl, s, { x: 680, y: 863, w: 850, h: 62 }, {
    text: S[1].lead, fs: s.FS(31), bold: true, color: C.NAVY, valign: 'middle',
  });
  H.vline(sl, s, { x: 673, y: 962, h: 420 }, { pres, color: 'CEDCEA', width: 1 });

  // 좌 : 평균 운영 횟수
  const L = S[1].left;
  H.runs(sl, s, { x: 99, y: 962, w: 560, h: 50 }, {
    runs: [
      { t: L.head, fs: s.FS(34), color: C.TXT },
      { t: ` ${L.note}`, fs: s.FS(24), color: C.TXT_MID },
    ],
    align: 'left', valign: 'middle',
  });
  H.image(sl, s, { x: 88, y: 1076, w: 220, h: 278 }, { name: L.img });
  H.text(sl, s, { x: 410, y: 1126, w: 300, h: 54 }, {
    text: L.label, fs: s.FS(37), bold: true, color: C.TXT, align: 'left',
  });
  H.bigValue(sl, s, { x: 402, base: 1295, w: 300 }, {
    v: L.v, u: L.u, vFs: s.FSD(87), uFs: s.FS(67), align: 'left',
  });

  // 우 : 재창업 비중 (네이티브 도넛)
  const R = S[1].right;
  H.runs(sl, s, { x: 828, y: 956, w: 620, h: 50 }, {
    runs: [
      { t: R.head, fs: s.FS(33), color: C.TXT },
      { t: `  ${R.note}`, fs: s.FS(24), color: C.TXT_MID },
    ],
    align: 'left', valign: 'middle',
  });
  // 차트 틀은 실측 도넛(370px, 중심 927·1224)보다 조금 크게 잡는다 — 렌더러가
  // 플롯 영역에 여백을 두어 실제 링이 틀보다 5~7% 작게 그려진다.
  CH.donut(sl, s, pres, { x: 734, y: 1031, w: 386, h: 386 }, {
    name: R.head, cats: R.cats, vals: R.vals,
    colors: [C.BLUE_DEEP, C.RING_BG], hole: 52, firstAng: 0, bg: C.CARD,
  });
  H.image(sl, s, { x: 867, y: 1164, w: 120, h: 120 }, { name: R.img });
  H.bigValue(sl, s, { x: 1182, base: 1196, w: 330 }, {
    v: R.v, u: R.u, vFs: s.FSD(86), uFs: s.FSD(48), align: 'left',
  });
  H.text(sl, s, { x: 1183, y: 1214, w: 340, h: 112 }, {
    text: `${R.d1}\n${R.d2}`, fs: s.FS(35), bold: true, color: C.TXT,
    align: 'left', valign: 'top', lsm: 1.16,
  });

  // ── 카드 3 : 얼마나 준비했을까? ───────────────────────────
  H.roundRect(sl, s, { x: CARD_X, y: 1469, w: CARD_W, h: 888 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 76, y: 1498, w: 707, h: 76 }, {
    pres, no: S[2].no, noFs: s.FSD(40), bw: 74, gap: 28,
    title: S[2].head, fs: s.FS(34), rad: 12,
  });
  H.text(sl, s, { x: 818, y: 1512, w: 700, h: 60 }, {
    text: S[2].lead, fs: s.FS(31), bold: true, color: C.NAVY, valign: 'middle',
  });

  // 두 서브카드는 폭이 다르다(원본이 그렇다)
  // 열 중심(cx)에 라벨·수치·그림을 모두 가운데 맞춘다 — 원본이 그렇다.
  const sub = [
    { x: 76, w: 688, div: 424, base: 1841, icon: { x: 120, y: 1616, w: 80, h: 68 }, hx: 218,
      cols: [{ cx: 250, iw: 314, ih: 90 }, { cx: 594, iw: 240, ih: 92 }],
      note: { x: 125, y: 2003, w: 590, h: 104 }, ic: { x: 116, y: 1996, w: 90, h: 120 } },
    { x: 784, w: 734, div: 1155, base: 1844, icon: { x: 818, y: 1612, w: 78, h: 78 }, hx: 916,
      cols: [{ cx: 977, iw: 250, ih: 156, iy: 1846 }, { cx: 1338, iw: 216, ih: 122, iy: 1864 }],
      note: { x: 817, y: 2000, w: 660, h: 106 }, ic: { x: 814, y: 1996, w: 92, h: 120 } },
  ];
  S[2].cards.forEach((cd, i) => {
    const g = sub[i];
    H.roundRect(sl, s, { x: g.x, y: 1609, w: g.w, h: 522 }, {
      pres, fill: C.CARD, line: C.CARD_LINE, rad: 20,
    });
    H.image(sl, s, g.icon, { name: cd.icon });
    H.runs(sl, s, { x: g.hx, y: 1620, w: g.w - (g.hx - g.x) - 20, h: 66 }, {
      runs: [
        { t: cd.head, fs: s.FS(38), color: C.TXT },
        ...(cd.note ? [{ t: ` ${cd.note}`, fs: s.FS(26), color: C.TXT_MID }] : []),
      ],
      align: 'left', valign: 'middle',
    });
    H.vline(sl, s, { x: g.div, y: 1706, h: 240 }, { pres, color: 'D6E4F1', width: 1 });

    cd.cols.forEach((col, j) => {
      const cg = g.cols[j];
      H.text(sl, s, { x: cg.cx - 150, y: 1714, w: 300, h: 52 }, {
        text: col.label, fs: s.FS(33), bold: true, color: C.TXT, align: 'center',
      });
      H.bigValue(sl, s, { x: cg.cx - 170, base: g.base, w: 340 }, {
        v: col.v, u: col.u, vFs: s.FSD(66), uFs: s.FS(45), align: 'center',
      });
      H.image(sl, s, { x: cg.cx - cg.iw / 2, y: cg.iy || 1866, w: cg.iw, h: cg.ih },
        { name: col.img });
    });

    H.noteBox(sl, s, g.note, {
      pres, fill: 'D9E9F9', rad: 18, icon: cd.noteIcon, iconBox: g.ic,
      tx: 118, text: `${cd.note1}\n${cd.note2}`, fs: s.FS(34), color: C.TXT, lsm: 1.2,
    });
  });

  // ── 하단 결론 밴드 ───────────────────────────────────────
  H.roundRect(sl, s, { x: 76, y: 2158, w: 1445, h: 169 }, {
    pres, fill: C.NAVY_DEEP, rad: 20,
  });
  H.image(sl, s, { x: 140, y: 2178, w: 116, h: 132 }, { name: d.band.icon });
  H.text(sl, s, { x: 300, y: 2182, w: 1078, h: 54 }, {
    text: d.band.line1, fs: s.FS(35), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  // 두 줄 다 KoPub 이 원본보다 넓어 그대로면 접힌다. 폭에 맞춰 한 단계 줄인다.
  const bandFs = H.fit(d.band.runs2.map((r) => r.t).join(''), s.FS(35), s.W(1078), true);
  sl.addText(d.band.runs2.map((r) => ({
    text: r.t,
    options: { fontFace: 'KoPub돋움체 Bold', bold: true, fontSize: bandFs,
      color: r.hl ? 'FFD34D' : C.WHITE },
  })), {
    x: s.X(300), y: s.Y(2240), w: s.W(1078), h: s.H(58),
    ...H.txtOpts({ fs: bandFs, align: 'center', valign: 'middle', bold: true, wrap: false }),
  });
};
