'use strict';
/**
 * 17. 판별조사 결과를 2027년 승인통계로 연결 (원본 1536×1024)
 *
 * 실측 좌표
 *   인용 박스 136,136 1266×110 (테두리 박스형)
 *   구간 바 좌 40,268 964×51 (E9ECF4) / 우 1010,268 485×50 (F3EDE5)
 *   육각 배지 중심 x=125·327·530·734·930·1208·1407, y=338 47×48
 *   타임라인 y=409 — 구간1 x=40~1016, 구간2 x=1143~1504(우측 화살촉)
 *   헤드라인 y=433·468 / 구분선 y=523 / 설명 y=534·562
 *   하단 좌 패널 35,641 630×206 (pill 67,627 317×38)
 *   하단 우 패널 705,641 800×206 (pill 737,627 333×38)
 *   강조 밴드 24,873 1484×121 (33353D)
 */
const { C } = require('../theme');
const H = require('../helpers');

// 이 장 전용 실측 색
const NAVY17 = '082978';   // 노드 1~5 헤드라인
const GOLD17 = '865A1B';   // 노드 6
const DARK17 = '242A35';   // 노드 7
const HEX = { NAVY: '0A1B5A', GOLD: '886429', DARK: '2E323C' };
const HEAD = { NAVY: NAVY17, GOLD: GOLD17, DARK: DARK17 };
const BAR_L = 'E9ECF4';
const BAR_R = 'F3EDE5';
const BAND17 = '33353D';
const LINE17 = '12336B';

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 32, ty: 14, tw: 1300, th: 68, tfs: s.FS(48),
    sx: 30, sy: 86, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 58, by: 82, bw: 900, bh: 40, bfs: s.FS(26),
  });
  H.quoteBand(sl, s, { x: 136, y: 134, w: 1266, h: 112 }, {
    pres, runs: d.quote, fs: s.FS(28), style: 'box', padX: 46, lsm: 1.35,
  });

  // ── 구간 바 2개 ─────────────────────────────────────────
  H.roundRect(sl, s, { x: 40, y: 268, w: 964, h: 51 }, { pres, fill: BAR_L, rad: 8 });
  H.text(sl, s, { x: 40, y: 268, w: 964, h: 51 }, {
    text: d.phaseLeft, fs: s.FS(28), bold: true, color: NAVY17, align: 'center',
  });
  H.roundRect(sl, s, { x: 1010, y: 268, w: 485, h: 50 }, { pres, fill: BAR_R, rad: 8 });
  H.text(sl, s, { x: 1010, y: 268, w: 485, h: 50 }, {
    text: d.phaseRight, fs: s.FS(28), bold: true, color: '9B743C', align: 'center',
  });

  // ── 타임라인 축 ─────────────────────────────────────────
  const AY = 409;
  sl.addShape(pres.shapes.LINE, {
    x: s.X(40), y: s.Y(AY), w: s.W(976), h: 0,
    line: { color: LINE17, width: 2.25 },
  });
  sl.addShape(pres.shapes.LINE, {
    x: s.X(1143), y: s.Y(AY), w: s.W(361), h: 0,
    line: { color: LINE17, width: 2.25, endArrowType: 'triangle' },
  });
  // 05 → 06 전환: 아래에서 올라오는 실선 + 위로 도는 점선 화살표
  sl.addShape(pres.shapes.LINE, {
    x: s.X(1078), y: s.Y(AY), w: s.W(65), h: s.H(48),
    line: { color: LINE17, width: 2.25 }, flipV: true,
  });
  sl.addShape(pres.shapes.LINE, {
    x: s.X(1016), y: s.Y(AY - 12), w: s.W(124), h: s.H(12),
    line: { color: '9B743C', width: 2, dashType: 'dash', endArrowType: 'triangle' },
  });
  H.text(sl, s, { x: 968, y: 322, w: 200, h: 56 }, {
    text: d.transition, fs: s.FS(19), bold: true, color: '8B6A2F',
    align: 'center', valign: 'top', lsm: 1.2, fit: true,
  });

  // ── 노드 7개 ────────────────────────────────────────────
  const CX = [125, 327, 530, 734, 930, 1208, 1407];
  d.nodes.forEach((nd, i) => {
    const cx = CX[i];
    const filled = nd.tone === 'DARK';
    // 육각 배지 (7번만 채움, 나머지는 선만)
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(cx - 24), y: s.Y(338), w: s.W(48), h: s.H(48),
      fill: filled ? { color: HEX.DARK } : { color: C.WHITE },
      line: { color: HEX[nd.tone], width: 1.75 }, rotate: 90,
    });
    H.text(sl, s, { x: cx - 24, y: 338, w: 48, h: 48 }, {
      text: nd.no, fs: s.FS(22), bold: true,
      color: filled ? C.WHITE : HEX[nd.tone], align: 'center',
    });
    // 배지 → 축 스템, 축 위 점, 축 → 헤드라인 스템
    sl.addShape(pres.shapes.LINE, {
      x: s.X(cx), y: s.Y(386), w: 0, h: s.H(23),
      line: { color: LINE17, width: 1.5 },
    });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(cx - 7), y: s.Y(AY - 7), w: s.W(14), h: s.H(14),
      fill: { color: LINE17 }, line: { type: 'none' },
    });
    sl.addShape(pres.shapes.LINE, {
      x: s.X(cx), y: s.Y(AY), w: 0, h: s.H(22),
      line: { color: LINE17, width: 1.5 },
    });

    // 헤드라인 — 크기·y 모두 원본 실측값(노드마다 다르다)
    const col = HEAD[nd.tone];
    if (nd.head1) {
      H.text(sl, s, { x: cx - 130, y: nd.y1 - 6, w: 260, h: 36 }, {
        text: nd.head1, fs: s.FS(nd.ink1), bold: true, color: col, align: 'center', fit: true,
      });
    }
    if (nd.unit) {
      sl.addText(
        [
          { text: nd.head2, options: { fontSize: s.FS(nd.ink2) } },
          { text: nd.unit, options: { fontSize: s.FS(nd.inkU) } },
        ],
        {
          x: s.X(cx - 130), y: s.Y(nd.y2 - 6), w: s.W(260), h: s.H(48),
          ...H.txtOpts({ fs: s.FS(nd.ink2), bold: true, color: col, align: 'center' }),
        }
      );
    } else {
      H.text(sl, s, { x: cx - 130, y: nd.y2 - 6, w: 260, h: 48 }, {
        text: nd.head2, fs: s.FS(nd.ink2), bold: true, color: col, align: 'center', fit: true,
      });
    }
    // 구분선 + 설명
    H.hline(sl, s, { x: cx - 75, y: 523, w: 150 }, { pres, color: 'D3D7DE' });
    H.text(sl, s, { x: cx - 130, y: 534, w: 260, h: 60 }, {
      text: nd.desc, fs: s.FS(21), color: C.TXT, align: 'center',
      valign: 'top', lsm: 1.22, fit: true,
    });
  });

  // ── 하단 좌·우 패널 ─────────────────────────────────────
  const panels = [
    { px: 35, pw: 630, lx: 67, lw: 317, fill: C.NAVY, items: d.leftItems,
      head: d.leftHead, tone: '0A2A6B', rule: 665, dot: 25, tx: 46, tw: 590 },
    // 우 패널은 오른쪽에 사진이 있어 글 폭이 좁다. 원본처럼 들여쓰기를 줄여
    // 최대한 확보하지만, 10pt 하한 탓에 첫 항목은 두 줄이 된다.
    { px: 705, pw: 800, lx: 737, lw: 333, fill: '8A6A34', items: d.rightItems,
      head: d.rightHead, tone: '8A6A34', rule: 1505, dot: 8, tx: 26, tw: 564 },
  ];
  panels.forEach((g, gi) => {
    H.roundRect(sl, s, { x: g.px, y: 641, w: g.pw, h: 206 }, { pres, fill: 'F4F5F7', rad: 12 });
    // 라벨 pill + 오른쪽으로 이어지는 얇은 규칙선
    H.pill(sl, s, { x: g.lx, y: 627, w: g.lw, h: 38 }, {
      pres, fill: g.fill, text: g.head, fs: s.FS(25), rad: 19,
    });
    H.hline(sl, s, { x: g.lx + g.lw, y: 645, w: g.rule - (g.lx + g.lw) }, { pres, color: g.tone });
    // 불릿 3개 — 실측 y=695·743·791
    g.items.forEach((it, i) => {
      const y = 686 + i * 48;
      sl.addShape(pres.shapes.OVAL, {
        x: s.X(g.px + g.dot), y: s.Y(y + 10), w: s.W(9), h: s.H(9),
        fill: { color: g.tone }, line: { type: 'none' },
      });
      H.text(sl, s, { x: g.px + g.tx, y: y - 2, w: g.tw, h: 46 }, {
        text: it, fs: s.FS(23), color: C.TXT, align: 'left',
        valign: 'top', lsm: 1.0, fit: true, pad: 0.02,
      });
    });
  });
  // 우 패널의 사진(법정 서류·의사봉)은 도형으로 재현할 수 없어 원본 크롭을 얹는다.
  H.image(sl, s, { x: 1296, y: 668, w: 232, h: 182 }, { name: d.photo });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.roundRect(sl, s, { x: 24, y: 873, w: 1484, h: 121 }, { pres, fill: BAND17, rad: 20 });
  H.text(sl, s, { x: 60, y: 886, w: 1412, h: 44 }, {
    text: d.band1, fs: s.FS(26), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 60, y: 933, w: 1412, h: 50 }, {
    text: d.band2, fs: s.FS(34), bold: true, color: 'FFD87A', align: 'center', fit: true,
  });
};
