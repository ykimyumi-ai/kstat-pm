'use strict';
/**
 * 20. 과업 범위를 넘어 재단의 직접 활용까지 지원 (원본 1536×1024)
 *
 * 실측 좌표
 *   제목 32,19 잉크 43 / 부제 33,77 잉크 22 (슬래시 마크 1개)
 *   인용 박스 266,109 1027×89 (테두리 박스형) — 2줄, 둘째 줄만 파랑
 *   상단 3단 띠 y=205 h=66 — 27(438) / 481(489) / 988(519), 화살촉 x=463·971
 *   pill '추가 제안 4종' 26,276 249×46 / 헤더 밑줄 y=302 / 표 상단선 y=337
 *   열 머리 y=310 — 무엇을 제공 483 · 왜 필요한가 870 · 재단 활용 1264
 *   좌 제목 칸 배경 33,334 325×392, 육각 배지 x=53 y=351·454·550·644 (51×58)
 *   행 구분선 y=337 · 438 · 538 · 632 · 737, 열 구분선 x=730 · 1096
 *   본문 x=393(무엇) · 770(왜) · 1130(활용), 글줄 간격 26~28
 *   pill '제공 방식' 29,733 208×44 / 패널 32,748 1210×114
 *     단계 원 x=282·614·915 y=761 32×33, 화살촉 x=563·852 y=795
 *   사진(집계표 더미) 1286,718 250×161
 *   강조 밴드 27,879 1482×118, 글줄 y=897·945
 */
const { C, MIN_PT } = require('../theme');
const H = require('../helpers');
const FM = require('../fontmetrics');

// 이 장 전용 실측 색
const NAVY20 = '082470';   // pill · 단계 원
const HEX = { NAVY: '0A2A80', GOLD: '8F5F24' };
const BLUE20 = '11207D';   // 열 머리 · 강조 조각 · 부제
const TINT = { GRAY: 'F0F0F1', BLUE: 'EAEFF9', CREAM: 'F4EDDF' };
const BROWN20 = '7F4C13';  // 3단 띠 꼬리 문구 · 03행 제목
const COLBG = 'F5F5F5';    // 좌 제목 칸 배경
const BAND20 = '33363C';
const GOLD20 = 'F7D673';
const RULE = 'DCDDE0';

/** hi/br 조각 목록을 한 텍스트 상자에 그린다 (hi = 파랑 볼드). */
function runs(sl, s, p, o) {
  sl.addText(
    o.runs.map((r) => ({
      text: r.text,
      options: {
        color: r.hi ? BLUE20 : (o.color || C.TXT),
        bold: !!r.hi || !!o.bold,
        breakLine: !!r.br,
      },
    })),
    {
      x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
      ...H.txtOpts({
        fs: o.fs, color: o.color || C.TXT, align: o.align || 'left',
        valign: o.valign || 'top', lsm: o.lsm || 1.16,
      }),
    }
  );
}

module.exports = function ({ pres, sl, s, d }) {
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 32, ty: 12, tw: 1300, th: 62, tfs: s.FS(43),
    sx: 28, sy: 78, mw: 12, mh: 26, marks: 1,
    sub: d.sub, bx: 50, by: 74, bw: 900, bh: 36, bfs: s.FS(22),
  });
  H.quoteBand(sl, s, { x: 266, y: 109, w: 1027, h: 89 }, {
    pres, runs: d.quote, fs: s.FS(25), style: 'box', padX: 74, lsm: 1.3,
  });

  // ── 상단 3단 띠 ─────────────────────────────────────────
  const STRIP = [{ x: 27, w: 438 }, { x: 481, w: 489 }, { x: 988, w: 519 }];
  d.strip.forEach((st, i) => {
    const g = STRIP[i];
    H.roundRect(sl, s, { x: g.x, y: 205, w: g.w, h: 66 }, { pres, fill: TINT[st.tint], rad: 6 });
    const rs = [
      { text: st.head, bold: true },
      { text: '  |  ', color: 'A9ADB4' },
      st.big ? { text: st.big, bold: true, big: true } : { text: st.body },
    ];
    // 원본은 한 줄이다. 조각마다 크기가 달라 helpers 의 fit 을 그대로 쓸 수 없어,
    // 실제 폰트 폭을 조각별로 더해 한 줄에 들어가는 크기를 직접 찾는다.
    const inner = s.W(g.w - 16);
    const ratio = s.FS(25) / s.FS(21);
    let fs = s.FS(21);
    for (let k = 0; k < 60; k++) {
      const w = rs.reduce((a, r) =>
        a + FM.widthIn(r.text, r.big ? fs * ratio : fs, !!r.bold), 0);
      if (w <= inner * 0.97 || fs <= MIN_PT) break;
      fs = Math.round((fs - 0.2) * 10) / 10;
    }
    sl.addText(
      rs.map((r) => ({
        text: r.text,
        options: {
          bold: !!r.bold, color: r.big ? BROWN20 : (r.color || C.TXT),
          fontSize: r.big ? Math.round(fs * ratio * 10) / 10 : fs,
        },
      })),
      {
        x: s.X(g.x + 8), y: s.Y(205), w: inner, h: s.H(66),
        ...H.txtOpts({ fs, color: C.TXT, align: 'center', valign: 'middle' }),
      }
    );
    if (i < 2) {
      sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
        x: s.X(g.x + g.w + 2), y: s.Y(226), w: s.W(13), h: s.H(24),
        fill: { color: '9BA0A8' }, line: { type: 'none' }, rotate: 90,
      });
    }
  });

  // ── 추가 제안 4종 표 ────────────────────────────────────
  H.pill(sl, s, { x: 26, y: 276, w: 249, h: 46 }, {
    pres, fill: NAVY20, text: d.gridHead, fs: s.FS(24), rad: 23,
  });
  sl.addShape(pres.shapes.OVAL, {
    x: s.X(248), y: s.Y(292), w: s.W(14), h: s.H(14),
    fill: { color: C.WHITE }, line: { type: 'none' },
  });
  H.hline(sl, s, { x: 287, y: 302, w: 1213 }, { pres, color: 'B6B9BE', thick: 1.2 });
  H.hline(sl, s, { x: 33, y: 337, w: 1467 }, { pres, color: RULE, thick: 1.2 });

  // 좌 제목 칸 배경 + 열 머리
  H.roundRect(sl, s, { x: 33, y: 334, w: 325, h: 392 }, { pres, fill: COLBG, rad: 8 });
  const COL = [
    { x: 375, w: 355, tx: 393, tw: 336 },   // 무엇을 제공
    { x: 730, w: 366, tx: 770, tw: 322 },   // 왜 필요한가
    { x: 1096, w: 404, tx: 1130, tw: 374 }, // 재단 활용
  ];
  d.cols.forEach((t, i) => {
    H.text(sl, s, { x: COL[i].x, y: 305, w: COL[i].w, h: 28 }, {
      text: t, fs: s.FS(18), bold: true, color: BLUE20, align: 'center', fit: true,
    });
  });

  // 행 4개 — 구분선 y 는 원본 실측값
  const SEP = [337, 438, 538, 632, 737];
  const BY = [351, 454, 550, 644];   // 육각 배지 y
  d.rows.forEach((rw, i) => {
    const top = SEP[i], bot = SEP[i + 1];
    if (i > 0) H.dline(sl, s, { x: 33, y: top, w: 1467 }, { pres, color: 'D8D9DC' });
    [730, 1096].forEach((x) => {
      H.vline(sl, s, { x, y: top + 14, h: bot - top - 28 }, { pres, color: 'DDDEE1', thick: 1.2 });
    });
    const col = HEX[rw.tone];
    sl.addShape(pres.shapes.HEXAGON, {
      x: s.X(53), y: s.Y(BY[i]), w: s.W(51), h: s.H(58),
      fill: { color: col }, line: { type: 'none' }, rotate: 90,
    });
    H.text(sl, s, { x: 53, y: BY[i], w: 51, h: 58 }, {
      text: rw.no, fs: s.FS(22), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: 126, y: top + 8, w: 226, h: bot - top - 16 }, {
      text: rw.title, fs: s.FS(22), bold: true,
      color: rw.tone === 'GOLD' ? BROWN20 : C.TXT, align: 'left', lsm: 1.24,
    });
    runs(sl, s, { x: COL[0].tx, y: top + 8, w: COL[0].tw, h: bot - top - 16 }, {
      runs: rw.what, fs: s.FS(19), valign: 'middle', lsm: 1.2,
    });
    H.text(sl, s, { x: COL[1].tx, y: top + 8, w: COL[1].tw, h: bot - top - 16 }, {
      text: rw.why, fs: s.FS(19), color: C.TXT, align: 'left', valign: 'middle', lsm: 1.2,
    });
    runs(sl, s, { x: COL[2].tx, y: top + 8, w: COL[2].tw, h: bot - top - 16 }, {
      runs: rw.use, fs: s.FS(19), valign: 'middle', lsm: 1.2,
    });
  });

  // 사진(집계표 더미)은 도형으로 재현할 수 없어 원본 크롭을 얹는다.
  // 아래 '제공 방식' 패널보다 먼저 깔아 글자를 가리지 않게 한다.
  H.image(sl, s, { x: 1286, y: 718, w: 250, h: 161 }, { name: d.photo });

  // ── 제공 방식 ───────────────────────────────────────────
  H.roundRect(sl, s, { x: 32, y: 748, w: 1210, h: 114 },
    { pres, fill: C.WHITE, line: 'DCDEE3', rad: 14 });
  H.pill(sl, s, { x: 29, y: 733, w: 208, h: 44 }, {
    pres, fill: NAVY20, text: d.stepHead, fs: s.FS(23), rad: 22,
  });
  sl.addShape(pres.shapes.OVAL, {
    x: s.X(211), y: s.Y(748), w: s.W(14), h: s.H(14),
    fill: { color: C.WHITE }, line: { type: 'none' },
  });
  const STEP = [{ cx: 282, tx: 324, tw: 250 }, { cx: 614, tx: 657, tw: 230 },
    { cx: 915, tx: 961, tw: 262 }];
  d.steps.forEach((sp, i) => {
    const g = STEP[i];
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(g.cx), y: s.Y(761), w: s.W(32), h: s.H(33),
      fill: { color: NAVY20 }, line: { type: 'none' },
    });
    H.text(sl, s, { x: g.cx, y: 761, w: 32, h: 33 }, {
      text: sp.n, fs: s.FS(19), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: g.cx + 42, y: 760, w: g.tw, h: 34 }, {
      text: sp.head, fs: s.FS(21), bold: true, color: BLUE20, align: 'left', fit: true,
    });
    runs(sl, s, { x: g.tx, y: 796, w: g.tw + 14, h: 58 }, {
      runs: sp.body, fs: s.FS(19), valign: 'top', lsm: 1.22,
    });
    if (i < 2) {
      sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
        x: s.X(i === 0 ? 563 : 852), y: s.Y(795), w: s.W(24), h: s.H(32),
        fill: { color: '9BA0A8' }, line: { type: 'none' }, rotate: 90,
      });
    }
  });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.roundRect(sl, s, { x: 27, y: 879, w: 1482, h: 118 }, { pres, fill: BAND20, rad: 20 });
  H.text(sl, s, { x: 60, y: 892, w: 1416, h: 44 }, {
    text: d.band1, fs: s.FS(28), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 60, y: 938, w: 1416, h: 48 }, {
    text: d.band2, fs: s.FS(31), bold: true, color: GOLD20, align: 'center', fit: true,
  });
};
