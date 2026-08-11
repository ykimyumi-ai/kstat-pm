'use strict';
/**
 * 21. 적용대상 탐색비용은 줄이고, 공표 가능성은 확대 (원본 A4 가로 PDF → 300dpi 3505×2480)
 *
 * 앞의 20장과 달리 원본이 이미지가 아니라 한글(HWP)에서 뽑은 PDF다. 다만 텍스트
 * 레이어가 없어 결국 래스터를 실측했다. 좌표 단위가 다른 장의 2.3배인 이유다.
 *
 * 실측 좌표
 *   눈썹 100,52 잉크 34 / 제목 100,131 잉크 112
 *   인용 박스 626,301 2292×156 (위·아래 가운데가 끊긴 테두리) — 2줄
 *   섹션 배지 90,480 73×83 / 1693 70×80
 *   표 머리 574 h=82 — 209(979) '002569' / 1202(798) '0D3C89' / 2019(1367) '696969'
 *     행 구분선 y=766·871, 표 끝선 989 / 행 글줄 y=692·799·906 (잉크 46)
 *     행 배지 x=127 w=60 / 1열 x=294 · 2열 가운데 · 3열 x=2209
 *   좌 패널 95,1068 1410×583 (pill 443,1030 710×85)
 *     흐름 y≈1206~1392, 골드 화살표 x=471·803·1121 (47×47), 원 895,1205 190
 *     보조선 y=1465, 각주 y=1525 (잉크 42)
 *   우 패널 1629,1068 1792×590 (pill 2138,1030 730×85)
 *     카드 1673·2469, y=1136 h=416 / 내부 구분선 y=1317·1418
 *     골드 밴드 1630,1565 1760×83 (오른쪽 화살촉)
 *   하단 카드 y=1750 h=352 — 84(781) / 880(849) / 1744(838) / 2600(834)
 *     내부 규칙 y=1862·1937
 *   강조 밴드 88,2170 3340×260, 글줄 y=2217·2335
 */
const { C } = require('../theme');
const H = require('../helpers');

// 이 장 전용 실측 색
const HD1 = '002569';      // 표 머리 '선행조사'
const HD2 = '0D3C89';      // 표 머리 '확인'
const HD3 = '696969';      // 표 머리 '미확인'
const NAVY21 = '062A63';   // pill · 배지
const GOLD21 = 'B4801F';   // 화살표
const GBAND = 'AF7E22';    // 골드 밴드
const BAND21 = '292C33';
const PANEL21 = 'F8F8F8';
const EDGE21 = 'D9DCE1';
const EYE = '4A5674';
const BLUE = C.BLUE_TXT;

module.exports = function ({ pres, sl, s, d }) {
  // ── 머리말 ──────────────────────────────────────────────
  H.text(sl, s, { x: 100, y: 46, w: 1600, h: 52 }, {
    text: d.eyebrow, fs: s.FS(34), bold: true, color: EYE, align: 'left',
  });
  H.text(sl, s, { x: 100, y: 118, w: 3000, h: 140 }, {
    text: d.title, fs: s.FS(112), bold: true, color: C.TXT, align: 'left', fit: true,
  });

  // 인용 박스 — 위·아래 가운데가 끊긴 둥근 테두리 (원본에 따옴표는 없다)
  H.roundRect(sl, s, { x: 626, y: 301, w: 2292, h: 156 },
    { pres, fill: C.WHITE, line: 'D6D6D6', rad: 34 });
  [301, 451].forEach((y) => {
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(880), y: s.Y(y), w: s.W(1784), h: s.H(6),
      fill: { color: C.WHITE }, line: { type: 'none' },
    });
  });
  sl.addText(
    d.quote.map((r) => ({
      text: r.text,
      options: { color: r.hi ? BLUE : C.TXT, bold: true, breakLine: !!r.br },
    })),
    {
      x: s.X(680), y: s.Y(305), w: s.W(2184), h: s.H(148),
      ...H.txtOpts({ fs: s.FS(56), bold: true, align: 'center', lsm: 1.34 }),
    }
  );

  /** 섹션 머리: 육각 배지 + 세로 막대 + 라벨 */
  const section = (sec, bx, by, bw, bh) => {
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(bx), y: s.Y(by), w: s.W(bw), h: s.H(bh),
      fill: { color: NAVY21 }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: bx, y: by, w: bw, h: bh }, {
      text: sec.no, fs: s.FS(40), bold: true, color: C.WHITE, align: 'center',
    });
    H.vline(sl, s, { x: bx + bw + 32, y: by + 8, h: bh - 16 }, { pres, color: 'A9AEB8', thick: 4 });
    H.text(sl, s, { x: bx + bw + 62, y: by, w: 1600, h: bh }, {
      text: sec.label, fs: s.FS(44), bold: true, color: C.TXT, align: 'left',
    });
  };
  section(d.sec1, 90, 480, 73, 83);

  // ── 선행조사 3종 표 ─────────────────────────────────────
  const CELL = [{ x: 209, w: 979, fill: HD1 }, { x: 1202, w: 798, fill: HD2 },
    { x: 2019, w: 1367, fill: HD3 }];
  d.tblHead.forEach((t, i) => {
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(CELL[i].x), y: s.Y(574), w: s.W(CELL[i].w), h: s.H(82),
      fill: { color: CELL[i].fill }, line: { type: 'none' },
    });
    H.text(sl, s, { x: CELL[i].x, y: 574, w: CELL[i].w, h: 82 }, {
      text: t, fs: s.FS(48), bold: true, color: C.WHITE, align: 'center',
    });
  });
  const ROWY = [656, 766, 871, 989];
  d.tblRows.forEach((rw, i) => {
    const top = ROWY[i], bot = ROWY[i + 1], cy = (top + bot) / 2;
    if (i > 0) H.dline(sl, s, { x: 209, y: top, w: 3177 }, { pres, color: 'CFD2D8' });
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(127), y: s.Y(cy - 34), w: s.W(60), h: s.H(68),
      fill: { color: NAVY21 }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: 127, y: cy - 34, w: 60, h: 68 }, {
      text: rw.no, fs: s.FS(34), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: 294, y: top + 6, w: 880, h: bot - top - 12 }, {
      text: rw.name, fs: s.FS(46), bold: true, color: BLUE, align: 'left', fit: true,
    });
    H.text(sl, s, { x: 1210, y: top + 6, w: 782, h: bot - top - 12 }, {
      text: rw.ok, fs: s.FS(46), color: C.TXT, align: 'center', fit: true,
    });
    H.text(sl, s, { x: 2209, y: top + 6, w: 1170, h: bot - top - 12 }, {
      text: rw.gap, fs: s.FS(46), color: C.TXT, align: 'left', fit: true,
    });
  });
  H.hline(sl, s, { x: 209, y: 989, w: 3177 }, { pres, color: 'C6C9CF', thick: 4 });

  // ── 좌 패널: 왜 확인되지 못했는가 ───────────────────────
  H.roundRect(sl, s, { x: 95, y: 1068, w: 1410, h: 583 }, { pres, fill: PANEL21, rad: 30 });
  H.pill(sl, s, { x: 443, y: 1030, w: 710, h: 85 }, {
    pres, fill: NAVY21, text: d.leftHead, fs: s.FS(53), rad: 42,
  });

  // 수치 블록 3개 + 원 1개, 사이에 골드 화살표
  // 블록마다 줄 수가 달라 y 를 원본 실측값 그대로 준다
  // (균일 배치하면 4번 블록의 '88,000개사'와 '접촉 필요'가 겹친다).
  const FLOW = [
    { cx: 297, w: 380, by: 1226, sy: 1306 },
    { cx: 670, w: 300, ty: 1214, by: 1278 },
    { cx: 990, w: 260 },
    { cx: 1338, w: 380, ty: 1194, by: 1256, sy: 1340 },
  ];
  d.flow.forEach((f, i) => {
    const g = FLOW[i];
    if (f.circle) {
      sl.addShape(pres.shapes.OVAL, {
        x: s.X(895), y: s.Y(1205), w: s.W(190), h: s.H(190),
        fill: { color: C.WHITE }, line: { color: 'D5D8DE', width: 1 },
      });
      H.text(sl, s, { x: 895, y: 1205, w: 190, h: 190 }, {
        text: f.circle, fs: s.FS(50), bold: true, color: BLUE, align: 'center', fit: true,
      });
      return;
    }
    if (f.top) {
      H.text(sl, s, { x: g.cx - g.w / 2, y: g.ty, w: g.w, h: 52 }, {
        text: f.top, fs: s.FS(38), color: C.TXT, align: 'center', fit: true,
      });
    }
    sl.addText(
      [{ text: f.big, options: { fontSize: s.FS(58), color: BLUE } },
        { text: f.unit, options: { fontSize: s.FS(36), color: BLUE } }],
      {
        x: s.X(g.cx - g.w / 2), y: s.Y(g.by), w: s.W(g.w), h: s.H(72),
        ...H.txtOpts({ fs: s.FS(58), bold: true, color: BLUE, align: 'center' }),
      }
    );
    if (f.sub) {
      H.text(sl, s, { x: g.cx - g.w / 2, y: g.sy, w: g.w, h: 52 }, {
        text: f.sub, fs: s.FS(38), color: C.TXT, align: 'center', fit: true,
      });
    }
  });
  [471, 803, 1121].forEach((x) => {
    sl.addShape(pres.shapes.RIGHT_ARROW, {
      x: s.X(x), y: s.Y(1272), w: s.W(47), h: s.H(44),
      fill: { color: GOLD21 }, line: { type: 'none' },
    });
  });

  // 아래로 모이는 보조선 + 각주
  H.hline(sl, s, { x: 250, y: 1465, w: 1090 }, { pres, color: 'CFD2D8', thick: 3 });
  [250, 1337].forEach((x) => H.vline(sl, s, { x, y: 1442, h: 26 }, { pres, color: 'CFD2D8', thick: 3 }));
  H.vline(sl, s, { x: 793, y: 1465, h: 30 }, { pres, color: 'CFD2D8', thick: 3 });
  H.text(sl, s, { x: 150, y: 1512, w: 1300, h: 70 }, {
    text: d.leftNote, fs: s.FS(42), color: C.TXT, align: 'center', fit: true,
  });

  // ── 우 패널: 본 조사가 푸는 방법 ────────────────────────
  H.roundRect(sl, s, { x: 1629, y: 1068, w: 1792, h: 590 },
    { pres, fill: C.WHITE, line: EDGE21, rad: 30 });
  H.pill(sl, s, { x: 2138, y: 1030, w: 730, h: 85 }, {
    pres, fill: NAVY21, text: d.rightHead, fs: s.FS(53), rad: 42,
  });
  const MC = [{ x: 1673, w: 772 }, { x: 2469, w: 907 }];
  d.methods.forEach((m, i) => {
    const g = MC[i];
    H.roundRect(sl, s, { x: g.x, y: 1136, w: g.w, h: 416 },
      { pres, fill: C.WHITE, line: EDGE21, rad: 20 });
    // 제목 줄 — 육각 배지 + 제목 (가운데 정렬)
    const tw = 300, bx = g.x + g.w / 2 - tw / 2;
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(bx), y: s.Y(1152), w: s.W(56), h: s.H(64),
      fill: { color: NAVY21 }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: bx, y: 1152, w: 56, h: 64 }, {
      text: m.no, fs: s.FS(32), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: bx + 70, y: 1152, w: g.w / 2 + 200, h: 64 }, {
      text: m.title, fs: s.FS(48), bold: true, color: BLUE, align: 'left', fit: true,
    });
    m.items.forEach((it, k) => {
      H.text(sl, s, { x: g.x + 20, y: 1236 + k * 98, w: g.w - 40, h: 70 }, {
        text: it, fs: s.FS(46), color: C.TXT, align: 'center', fit: true,
      });
      H.hline(sl, s, { x: g.x + 60, y: 1317 + k * 101, w: g.w - 120 },
        { pres, color: 'E2E4E8', thick: 3 });
    });
    // 결론 줄 앞의 작은 아래 화살표
    sl.addShape(pres.shapes.DOWN_ARROW, {
      x: s.X(g.x + g.w / 2 - 22), y: s.Y(1428), w: s.W(44), h: s.H(34),
      fill: { color: 'D3D6DC' }, line: { type: 'none' },
    });
    sl.addText(
      m.result.map((r) => ({
        text: r.text,
        options: { fontSize: r.big ? s.FS(58) : s.FS(48), color: m.strong ? BLUE : C.TXT },
      })),
      {
        x: s.X(g.x + 20), y: s.Y(1466), w: s.W(g.w - 40), h: s.H(72),
        ...H.txtOpts({ fs: s.FS(48), bold: !!m.strong, color: m.strong ? BLUE : C.TXT, align: 'center' }),
      }
    );
  });
  // 골드 결론 밴드 (오른쪽 화살촉)
  sl.addShape(pres.shapes.RECTANGLE, {
    x: s.X(1630), y: s.Y(1565), w: s.W(1660), h: s.H(83),
    fill: { color: GBAND }, line: { type: 'none' },
  });
  sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
    x: s.X(3290), y: s.Y(1565), w: s.W(100), h: s.H(83),
    fill: { color: GBAND }, line: { type: 'none' }, rotate: 90,
  });
  H.text(sl, s, { x: 1630, y: 1565, w: 1660, h: 83 }, {
    text: d.goldBand, fs: s.FS(54), bold: true, color: C.WHITE, align: 'center', fit: true,
  });

  // ── 그래서 무엇이 달라지는가 ───────────────────────────
  section(d.sec4, 90, 1693, 70, 80);
  const CARD = [{ x: 84, w: 781 }, { x: 880, w: 849 }, { x: 1744, w: 838 }, { x: 2600, w: 834 }];
  d.cards.forEach((cd, i) => {
    const g = CARD[i];
    H.roundRect(sl, s, { x: g.x, y: 1750, w: g.w, h: 352 },
      { pres, fill: C.WHITE, line: EDGE21, rad: 18 });
    H.text(sl, s, { x: g.x, y: 1786, w: g.w, h: 70 }, {
      text: cd.title, fs: s.FS(44), bold: true, color: C.TXT, align: 'center', fit: true,
    });
    H.hline(sl, s, { x: g.x + 26, y: 1862, w: g.w - 52 }, { pres, color: 'E6E8EC', thick: 3 });
    H.text(sl, s, { x: g.x + 0.04 * g.w, y: 1876, w: 0.40 * g.w, h: 56 }, {
      text: d.beforeLabel, fs: s.FS(34), color: C.TXT_SUB, align: 'center', fit: true,
    });
    H.text(sl, s, { x: g.x + 0.56 * g.w, y: 1876, w: 0.40 * g.w, h: 56 }, {
      text: d.afterLabel, fs: s.FS(34), color: C.TXT_SUB, align: 'center', fit: true,
    });
    H.hline(sl, s, { x: g.x + 26, y: 1937, w: g.w - 52 }, { pres, color: 'E6E8EC', thick: 3 });
    H.text(sl, s, { x: g.x + 0.02 * g.w, y: 1952, w: 0.42 * g.w, h: 138 }, {
      text: cd.before, fs: s.FS(44), color: C.TXT, align: 'center', lsm: 1.2,
    });
    sl.addShape(pres.shapes.RIGHT_ARROW, {
      x: s.X(g.x + 0.46 * g.w), y: s.Y(1998), w: s.W(0.08 * g.w), h: s.H(44),
      fill: { color: GOLD21 }, line: { type: 'none' },
    });
    H.text(sl, s, { x: g.x + 0.56 * g.w, y: 1952, w: 0.42 * g.w, h: 138 }, {
      text: cd.after, fs: s.FS(44), bold: true, color: BLUE, align: 'center', lsm: 1.2,
    });
  });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.roundRect(sl, s, { x: 88, y: 2170, w: 3340, h: 260 }, { pres, fill: BAND21, rad: 44 });
  H.text(sl, s, { x: 200, y: 2200, w: 3116, h: 100 }, {
    text: d.band1, fs: s.FS(78), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 200, y: 2312, w: 3116, h: 90 }, {
    text: d.band2, fs: s.FS(58), bold: true, color: 'F5DC8E', align: 'center', fit: true,
  });
};
