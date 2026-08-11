'use strict';
/**
 * 14. 업종별 연동 적용대상 밀도와 응답 난이도 (원본 1491×1055 — A4 가로 비율)
 *
 * 실측 좌표
 *   매트릭스 pill 26,288 371×44
 *   사분면 (215,353,555,228) (780,353,627,228) (215,591,555,192) (780,591,626,192)
 *   세로축 화살표 x=175 y=359~791 / 가로축 y=820
 *   하단 패널 31,873 1413×118 / 아이콘 원 x=53·404·779·1141 y=894 75×75
 *
 * 이 장부터 사진이 들어간다. 사진은 원본 크롭을 assets/ 에서 얹고
 * 글자·도형은 네이티브로 그린다.
 */
const { C } = require('../theme');
const H = require('../helpers');

// 이 3장은 앞의 13장과 색이 미세하게 달라 실측값을 따로 쓴다.
const NAVY14 = '032E86';
const TINT = { BLUE: 'F2F5F9', CREAM: 'FAF7F2' };

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 22, fs: s.FS(20) });
  H.chapterBadge(sl, s, {
    x: 1000, y: 22, w: 400, h: 28, fs: s.FS(20),
    runs: [
      { text: '|   ', options: { color: 'B9BEC6' } },
      { text: d.chapter, options: { color: C.TXT_SUB } },
    ],
  });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 32, ty: 50, tw: 1300, th: 70, tfs: s.FS(44),
    sx: 34, sy: 146, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 62, by: 142, bw: 900, bh: 42, bfs: s.FS(28),
  });
  H.quoteBand(sl, s, { x: 200, y: 194, w: 1120, h: 72 }, {
    pres, runs: d.quote, fs: s.FS(30), padX: 40,
  });

  // ── 섹션 라벨 + 기준 주석 ───────────────────────────────
  H.pill(sl, s, { x: 26, y: 288, w: 371, h: 44 }, {
    pres, fill: NAVY14, text: d.sec, fs: s.FS(26), rad: 22,
  });
  H.text(sl, s, { x: 414, y: 288, w: 1050, h: 44 }, {
    text: d.secNote, fs: s.FS(19), color: C.TXT_MID, align: 'left', fit: true,
  });

  // ── 축 ──────────────────────────────────────────────────
  sl.addShape(pres.shapes.UP_ARROW, {
    x: s.X(167), y: s.Y(352), w: s.W(17), h: s.H(444),
    fill: { color: '9AA0AA' }, line: { type: 'none' },
  });
  sl.addShape(pres.shapes.RIGHT_ARROW, {
    x: s.X(206), y: s.Y(812), w: s.W(1185), h: s.H(17),
    fill: { color: '9AA0AA' }, line: { type: 'none' },
  });
  H.text(sl, s, { x: 40, y: 530, w: 118, h: 76 }, {
    text: d.axisY, fs: s.FS(28), bold: true, color: C.TXT, align: 'center', lsm: 1.15,
  });
  H.text(sl, s, { x: 500, y: 838, w: 600, h: 40 }, {
    text: d.axisX, fs: s.FS(28), bold: true, color: C.TXT, align: 'center',
  });
  // 높음·낮음 원형 라벨 3개
  [[82, 356, d.axisHigh], [81, 755, d.axisLow], [1342, 811, d.axisHigh]].forEach(([x, y, t]) => {
    sl.addShape(pres.shapes.OVAL, {
      x: s.X(x), y: s.Y(y), w: s.W(54), h: s.H(50),
      fill: { color: '4E4E4E' }, line: { type: 'none' },
    });
    H.text(sl, s, { x, y, w: 54, h: 50 }, {
      text: t, fs: s.FS(20), bold: true, color: C.WHITE, align: 'center',
    });
  });

  // ── 사분면 4개 ──────────────────────────────────────────
  const Q = [
    { x: 215, y: 353, w: 555, h: 228 },
    { x: 780, y: 353, w: 627, h: 228 },
    { x: 215, y: 591, w: 555, h: 192 },
    { x: 780, y: 591, w: 626, h: 192 },
  ];
  // 사분면별 항목 배치(배지 x·y는 실측)
  const ITEM = [
    [{ bx: 398, by: 410, tx: 448, ty: 404, lw: 300 }],
    [{ bx: 826, by: 366, tx: 876, ty: 360, lw: 300 },
      { bx: 826, by: 465, tx: 876, ty: 459, lw: 300 }],
    [{ bx: 398, by: 630, tx: 448, ty: 624, lw: 300 }],
    [{ bx: 824, by: 610, tx: 874, ty: 604, lw: 300 }],
  ];

  d.quadrants.forEach((q, qi) => {
    const g = Q[qi];
    H.roundRect(sl, s, g, { pres, fill: TINT[q.tint], rad: 14 });
    // 사진 먼저(패널 위, 글자 아래)
    if (q.img) {
      const box = {
        0: { x: 222, y: 382, w: 174, h: 146 },
        1: { x: 1192, y: 356, w: 206, h: 108 },
        2: { x: 224, y: 618, w: 172, h: 158 },
        3: { x: 1100, y: 645, w: 298, h: 136 },
      }[qi];
      H.image(sl, s, box, { name: q.img });
    }
    if (q.img2) H.image(sl, s, { x: 1183, y: 464, w: 215, h: 116 }, { name: q.img2 });

    q.items.forEach((it, ii) => {
      const t = ITEM[qi][ii];
      H.numBadge(sl, s, { x: t.bx, y: t.by, w: 36, h: 41 }, {
        pres, kind: 'hexagon', n: it.n, fs: s.FS(22), fill: NAVY14,
      });
      H.text(sl, s, { x: t.tx, y: t.ty, w: t.lw, h: 46 }, {
        text: it.name, fs: s.FS(30), bold: true, color: NAVY14, align: 'left', fit: true,
      });
      let y = t.ty + 50;
      if (it.sub) {
        H.text(sl, s, { x: t.tx, y, w: 340, h: 32 }, {
          text: it.sub, fs: s.FS(22), bold: true, color: C.BLUE_TXT, align: 'left', fit: true,
        });
        y += 36;
      }
      it.lines.forEach((ln) => {
        H.text(sl, s, { x: t.tx, y, w: 360, h: 32 }, {
          text: ln, fs: s.FS(22), color: C.TXT_MID, align: 'left', fit: true,
        });
        y += 36;
      });
      it.hi.forEach((ln) => {
        H.text(sl, s, { x: t.tx, y, w: 360, h: 32 }, {
          text: ln, fs: s.FS(22), bold: true, color: C.BLUE_TXT, align: 'left', fit: true,
        });
        y += 36;
      });
    });
  });

  // ── 하단 4개 요약 ───────────────────────────────────────
  H.roundRect(sl, s, { x: 31, y: 873, w: 1413, h: 118 }, { pres, fill: 'F5F5F4', rad: 14 });
  const FX = [53, 404, 779, 1141];
  d.footItems.forEach((f, i) => {
    H.image(sl, s, { x: FX[i], y: 894, w: 75, h: 75 }, { name: f.icon });
    H.text(sl, s, { x: FX[i] + 92, y: 890, w: 250, h: 40 }, {
      text: f.head, fs: s.FS(28), bold: true, color: NAVY14, align: 'left', fit: true,
    });
    sl.addText(
      [
        { text: '|  ', options: { color: 'B9BEC6' } },
        { text: f.tail, options: { color: C.TXT_MID } },
      ],
      {
        x: s.X(FX[i] + 92), y: s.Y(932), w: s.W(250), h: s.H(38),
        ...H.txtOpts({ fs: s.FS(22), align: 'left' }),
      }
    );
    if (i < 3) H.vline(sl, s, { x: FX[i + 1] - 40, y: 892, h: 80 }, { pres, color: 'DCE0E6' });
  });
};
