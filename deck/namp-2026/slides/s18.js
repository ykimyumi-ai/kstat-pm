'use strict';
/**
 * 18. 조사 결과를 재단이 바로 쓰는 정책 판단 자료로 제공 (원본 1536×1024)
 *
 * 실측 좌표
 *   제목 32,21 잉크 44 / 부제 52,79 잉크 21 (슬래시 마크 1개)
 *   인용 박스 243,115 1050×96 (테두리 박스형) — 2줄, 둘째 줄만 파랑
 *   섹션 pill 좌 29,227 655×38 · 우 726,227 756×38 (오른쪽 끝 흰 점)
 *   좌 패널 32,281 666×456 — 세로 점선 x=369, 가로 점선 y=511
 *     육각 배지 53/388,297 · 53/388,528 (42×47)
 *     제목 잉크 23 y=310·541 / 세로 규칙 x=53·388 y=358·589
 *     불릿 잉크 18, 원본 줄 y=369·395·433·460
 *   우 타임라인 육각 x=751 y=282·373·488·573·658 (41×47)
 *     축 x=771, 축 점 y=357·472·557·642, 행 점선 x=733..1488
 *     열 x=822(시점) · 994(하는 일) · 1191(본사 지원), 세로 구분선 x=971·1171
 *   하단 패널 31,757 1247×106 (pill 29,783 236×48, 아이콘 원 71~72px)
 *     항목 구분 점선 x=577·899
 *   사진(보고서 더미) 1280,723 256×155 (윗줄 글자를 물지 않도록 아래에서 자름)
 *   강조 밴드 26,878 1484×123 (282B30), 글줄 y=903·948
 */
const { C } = require('../theme');
const H = require('../helpers');

// 이 장 전용 실측 색
const NAVY18 = '00277A';   // 섹션 pill · 하단 pill
const HEX = { NAVY: '0A2A78', GOLD: '8F6023' };
const BLUE18 = '0C247E';   // 제목·본사 지원·수치 강조
const PANEL18 = 'F7F7F7';
const BAND18 = '282B30';
const GOLD18 = 'F7D260';
const DASH18 = 'CFD3DA';

module.exports = function ({ pres, sl, s, d }) {
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 32, ty: 14, tw: 1300, th: 64, tfs: s.FS(44),
    sx: 28, sy: 80, mw: 12, mh: 26, marks: 1,
    sub: d.sub, bx: 50, by: 76, bw: 900, bh: 36, bfs: s.FS(21),
  });
  H.quoteBand(sl, s, { x: 243, y: 115, w: 1050, h: 96 }, {
    pres, runs: d.quote, fs: s.FS(27), style: 'box', padX: 76, lsm: 1.32,
  });

  // ── 섹션 pill 2개 (오른쪽 끝에 흰 점) ────────────────────
  [
    { x: 29, w: 655, text: d.leftHead },
    { x: 726, w: 756, text: d.rightHead },
  ].forEach((g) => {
    H.pill(sl, s, { x: g.x, y: 227, w: g.w, h: 38 }, {
      pres, fill: NAVY18, text: g.text, fs: s.FS(22), rad: 19,
    });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(g.x + g.w - 37), y: s.Y(238), w: s.W(16), h: s.H(16),
      fill: { color: C.WHITE }, line: { type: 'none' },
    });
  });

  // ── 좌 패널: 2×2 카드 ───────────────────────────────────
  H.roundRect(sl, s, { x: 32, y: 281, w: 666, h: 456 }, { pres, fill: PANEL18, rad: 12 });
  H.dline(sl, s, { x: 369, y: 297, h: 420 }, { pres, dir: 'v', color: DASH18 });
  H.dline(sl, s, { x: 47, y: 511, w: 634 }, { pres, color: DASH18 });

  const CX = [53, 388];         // 육각 배지 · 세로 규칙 x
  const CY = [297, 528];        // 카드 행 y
  d.cards.forEach((cd, i) => {
    const bx = CX[i % 2], by = CY[i < 2 ? 0 : 1];
    const col = HEX[cd.tone];
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(bx), y: s.Y(by), w: s.W(42), h: s.H(47),
      fill: { color: col }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: bx, y: by, w: 42, h: 47 }, {
      text: cd.no, fs: s.FS(20), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: bx + 47, y: by + 2, w: 274, h: 42 }, {
      text: cd.head, fs: s.FS(23), bold: true, color: col === HEX.GOLD ? HEX.GOLD : BLUE18,
      align: 'left', fit: true,
    });
    // 왼쪽 세로 규칙 + 불릿 2개.
    // 원본 불릿은 9.4pt 상당인데 하한 10pt로 올라가면서 줄이 늘 수 있어,
    // 원본이 비워 둔 아래 여백까지 블록을 늘려 잡는다(규칙선도 같이 늘린다).
    const ry = by + 61;
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(bx), y: s.Y(ry), w: s.W(3), h: s.H(142),
      fill: { color: col }, line: { type: 'none' },
    });
    H.bullets(sl, s, { x: bx + 13, y: ry - 4, w: 295, h: 150 }, {
      items: cd.items, fs: s.FS(18), lsm: 1.06, gap: 8, valign: 'top',
    });
  });

  // 보고서 더미 사진 — 05행 글줄과 하단 바 오른쪽에 걸쳐 있다.
  // 원본에서는 사진이 글자를 가리지 않으므로 타임라인보다 먼저 깔아 둔다.
  H.image(sl, s, { x: 1280, y: 723, w: 256, h: 155 }, { name: d.photo });

  // ── 우 타임라인 ─────────────────────────────────────────
  const AX = 771;               // 세로 축
  sl.addShape(pres.shapes.LINE, {
    x: s.X(AX), y: s.Y(276), w: 0, h: s.H(436),
    line: { color: '7B8290', width: 1.5 },
  });
  [357, 472, 557, 642].forEach((y) => {
    H.dline(sl, s, { x: 733, y, w: 755 }, { pres, color: DASH18 });
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(AX - 6), y: s.Y(y - 6), w: s.W(12), h: s.H(12),
      fill: { color: '25397E' }, line: { type: 'none' },
    });
  });
  // 열 사이 세로 구분선 — 행마다 길이가 다르다(원본 실측).
  const SEP = [[281, 58], [373, 79], [488, 51], [573, 51], [658, 57]];
  const ROWY = [282, 373, 488, 573, 658];
  d.rows.forEach((rw, i) => {
    const y = ROWY[i];
    const col = HEX[rw.tone];
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(751), y: s.Y(y), w: s.W(41), h: s.H(47),
      fill: { color: col }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: 751, y, w: 41, h: 47 }, {
      text: rw.no, fs: s.FS(20), bold: true, color: C.WHITE, align: 'center',
    });
    [971, 1171].forEach((sx) => {
      H.vline(sl, s, { x: sx, y: SEP[i][0], h: SEP[i][1] }, { pres, color: 'D3D7DE', thick: 1.2 });
    });

    // ① 시점  ② 재단이 하는 일 — 라벨(작게) + 값(굵게)
    [
      { x: 822, w: 142, label: d.whenLabel, val: rw.when, fs: 21 },
      { x: 994, w: 170, label: d.doLabel, val: rw.act, fs: 19 },
    ].forEach((cl) => {
      H.text(sl, s, { x: cl.x, y: y + 5, w: cl.w, h: 20 }, {
        text: cl.label, fs: s.FS(15), color: C.TXT_SUB, align: 'left', fit: true,
      });
      H.text(sl, s, { x: cl.x, y: y + 26, w: cl.w, h: 54 }, {
        // 05행 '과업 종료 후 1년'은 10pt 하한에서 칸을 살짝 넘겨 줄이 접힌다.
        // 원본이 한 줄이므로 폰트를 미세 조정해 한 줄을 유지한다.
        text: cl.val, fit: true, pad: 0.02,
        fs: s.FS(cl.fs), bold: true, color: C.TXT, align: 'left',
        valign: 'top', lsm: 1.18,
      });
    });

    // ③ 본사 지원 — 파랑 소제목 + 본문
    H.text(sl, s, { x: 1191, y: y + 1, w: 310, h: 20 }, {
      text: d.supLabel, fs: s.FS(15), bold: true, color: BLUE18, align: 'left', fit: true,
    });
    if (rw.supRuns) {
      // 02행은 숫자·단위만 크게 찍힌 혼합 줄이다.
      // 원본은 한 줄이지만 10pt 하한에서는 폭이 모자라 두 줄이 되므로,
      // 큰 글자를 원본(잉크 28px)보다 줄여 아래 행을 침범하지 않게 한다.
      H.text(sl, s, { x: 1191, y: y + 20, w: 310, h: 22 }, {
        text: rw.sup, fs: s.FS(16), color: C.TXT, align: 'left', valign: 'top',
      });
      sl.addText(
        rw.supRuns.map((r) => ({
          text: r.text,
          options: { fontSize: r.big ? s.FS(21) : s.FS(16), color: r.big ? BLUE18 : C.TXT },
        })),
        {
          x: s.X(1191), y: s.Y(y + 42), w: s.W(310), h: s.H(62),
          ...H.txtOpts({ fs: s.FS(16), bold: true, color: C.TXT, align: 'left', valign: 'top', lsm: 1.06 }),
        }
      );
    } else {
      H.text(sl, s, { x: 1191, y: y + 22, w: 310, h: 60 }, {
        text: rw.sup.replace(/\n/g, ' '), fs: s.FS(16), color: C.TXT,
        align: 'left', valign: 'top', lsm: 1.08,
      });
    }
  });

  // ── 하단 수행지원 바 ────────────────────────────────────
  H.roundRect(sl, s, { x: 31, y: 757, w: 1247, h: 106 }, { pres, fill: PANEL18, rad: 16 });
  H.pill(sl, s, { x: 29, y: 783, w: 236, h: 48 }, {
    pres, fill: NAVY18, text: d.supportHead, fs: s.FS(24), rad: 24,
  });
  sl.addShape(pres.shapes.OVAL, {
    x: s.X(240), y: s.Y(800), w: s.W(14), h: s.H(14),
    fill: { color: C.WHITE }, line: { type: 'none' },
  });
  [577, 899].forEach((x) => {
    H.dline(sl, s, { x, y: 775, h: 72 }, { pres, dir: 'v', color: 'DCDEE2' });
  });
  // 원형 아이콘(엑셀·시계·달력)은 도형으로 재현할 수 없어 원본 크롭을 얹는다.
  const IC = [
    { ix: 305, tx: 398, tw: 168 },
    { ix: 617, tx: 711, tw: 176 },
    { ix: 931, tx: 1024, tw: 240 },
  ];
  d.supports.forEach((sp, i) => {
    H.image(sl, s, { x: IC[i].ix, y: 770, w: 77, h: 78 }, { name: sp.icon });
    H.text(sl, s, { x: IC[i].tx, y: 779, w: IC[i].tw, h: 60 }, {
      text: sp.text, fs: s.FS(23), bold: true, color: C.TXT,
      align: 'left', valign: 'middle', lsm: 1.2, fit: true,
    });
  });


  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.roundRect(sl, s, { x: 26, y: 878, w: 1484, h: 123 }, { pres, fill: BAND18, rad: 20 });
  // 사진이 오른쪽 위를 덮고 있어 원본도 글줄이 밴드 중앙보다 왼쪽에 놓인다.
  H.text(sl, s, { x: 60, y: 894, w: 1382, h: 44 }, {
    text: d.band1, fs: s.FS(27), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 60, y: 940, w: 1382, h: 48 }, {
    text: d.band2, fs: s.FS(30), bold: true, color: GOLD18, align: 'center', fit: true,
  });
};
