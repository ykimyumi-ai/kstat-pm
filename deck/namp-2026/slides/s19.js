'use strict';
/**
 * 19. 참여인력별 책임과 투입체계 — 조직도 (원본 1536×1024)
 *
 * 실측 좌표
 *   제목 27,17 잉크 46 / 부제 50,85 잉크 21 (슬래시 마크 1개)
 *   인용 박스 279,116 990×70 (테두리 박스형) — 1줄
 *   총괄 책임 489,208 538×100 (머리띠 35) — 이름 514 / 역할 643 / 칩 936,257 79×37
 *   사업 책임(PM) 470,338 578×98 (머리띠 36) — 이름 493 / 역할 606 / 칩 963,387 74×36
 *   연결선: PM 아래 x=759 y=436→460, 가로 y=460 x=205..1334,
 *           내림 x=205·583·955·1334 → y=503
 *   그룹 pill y=503 h=35 — 131(150) / 502(163) / 867(177) / 1242(178)
 *   그룹 패널 y=518 h=326 — 13(381) / 401(374) / 781(359) / 1148(369)
 *     행 점선  ①625·723 ②620·691·760 ③635·734 ④670
 *     역할↔업무 세로선 x=184 / 565 / 945 / 1314
 *   강조 밴드 44,874 1450×107, 글줄 y=894·935, 좌우 흰 점 x=90·1437
 */
const { C } = require('../theme');
const H = require('../helpers');
const FM = require('../fontmetrics');

// 이 장 전용 실측 색
const HDR19 = '11305F';    // 총괄·PM 머리띠
const PILL = { NAVY: '062A63', GOLD: '9D8054' };
const ROLE = { NAVY: '233E86', GOLD: '8C6121' };
const BAND19 = '0A2650';
const GOLD19 = 'F8E371';
const CHIP_B = 'DDE5F2';   // 파랑 기간 칩
const CHIP_C = 'F2F0E3';   // 크림 기간 칩 (실사·홍보)
const CHIP_TB = '1F3575';
const CHIP_TC = '4A4034';
const EDGE = 'C9D3E6';
const DESC = '4A4A4A';
const CONN = '9AA0AB';

// 그룹별 가로 배치 — 패널·pill·연결선 x 는 원본 실측값
const GEO = [
  { px: 13, pw: 381, lx: 131, lw: 150, cx: 205 },
  { px: 401, pw: 374, lx: 502, lw: 163, cx: 583 },
  { px: 781, pw: 359, lx: 867, lw: 177, cx: 955 },
  { px: 1148, pw: 369, lx: 1242, lw: 178, cx: 1334 },
];
// 패널 상·하단. 원본은 518~844 인데, 10pt 하한에서 4열이 세로로 22px 모자라
// 위아래로 6px·16px 넓혔다(pill 도 같이 올린다). 밴드(874)와는 겹치지 않는다.
const PTOP = 512, PBOT = 860, PILLY = 497;
const ROWTOP = PTOP + 22;       // pill 이 덮는 구간을 피해 첫 행이 시작하는 y
const PXI = 1536 / 11;          // 원본 px / inch
const MIN_LH = 10 * 1.18 / 72 * PXI;   // 10pt 한 줄 높이(px)

/**
 * 패널 한 칸의 세로 칸 나누기.
 *
 * 원본의 소형 주석은 7.7pt 상당이라 하한 10pt로 올리면 같은 폭에 담기지 않는다.
 * 그래서 칸 너비와 행 구분선 위치를 원본 고정값으로 두지 않고,
 * 실제 폰트 메트릭으로 각 행이 필요한 줄 수를 계산해 배분한다.
 * (원본과 몇 px 다르지만 넘침·겹침이 생기지 않는다.)
 */
function layout(pw, members) {
  const pad = 6, nameW = 52, gap = 5, divGap = 8, gap2 = 6;
  // 줄 수 계산은 실제 폭의 95%로 한다. 렌더러마다 자간이 조금씩 달라
  // 예측보다 한 줄 더 접히는 경우가 있어 그만큼을 미리 확보해 둔다.
  const SAFE = 0.95;
  // 기간 칩은 그룹마다 들어가는 문자열이 달라 필요한 만큼만 잡는다.
  const chipW = Math.max(...members.flatMap((m) => m.term.split('\n'))
    .map((t) => FM.widthIn(t, 10, true) * PXI)) + 10;
  const avail = pw - pad * 2 - nameW - gap - divGap - gap2 - chipW;
  const roleW = Math.round(avail * 0.42), taskW = avail - roleW;
  const need = members.map((m) => {
    const n = Math.max(
      FM.lineCount(m.role.replace(/\n/g, ' '), 10, roleW * SAFE / PXI, true),
      FM.lineCount(m.task.replace(/\n/g, ' '), 10, taskW * SAFE / PXI, false),
      FM.lineCount(m.term.replace(/\n/g, ' '), 10, (chipW - 10) / PXI, true)
    );
    return n * MIN_LH + 10;
  });
  const slack = (PBOT - ROWTOP - need.reduce((a, b) => a + b, 0)) / members.length;
  const rows = [];
  let y = ROWTOP;
  need.forEach((h) => {
    rows.push({ y, h: h + slack });
    y += h + slack;
  });
  return {
    rows, nameW, roleW, taskW, chipW,
    nx: pad, rx: pad + nameW + gap,
    vx: pad + nameW + gap + roleW + divGap / 2,
    tx: pad + nameW + gap + roleW + divGap,
    kx: pw - pad - chipW,
  };
}

/** 머리띠(위 모서리만 둥근) — 아래 모서리를 사각형으로 덮어 각지게 만든다. */
function capBar(pres, sl, s, p, fill) {
  H.roundRect(sl, s, p, { pres, fill, rad: 10 });
  sl.addShape(pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y + p.h / 2), w: s.W(p.w), h: s.H(p.h / 2),
    fill: { color: fill }, line: { type: 'none' },
  });
}

module.exports = function ({ pres, sl, s, d }) {
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 27, ty: 10, tw: 1200, th: 64, tfs: s.FS(46),
    sx: 26, sy: 86, mw: 12, mh: 26, marks: 1,
    sub: d.sub, bx: 50, by: 82, bw: 800, bh: 36, bfs: s.FS(21),
  });
  H.quoteBand(sl, s, { x: 279, y: 116, w: 990, h: 70 }, {
    pres, runs: d.quote, fs: s.FS(28), style: 'box', padX: 62, lsm: 1.2,
  });

  // ── 총괄 책임 · 사업 책임(PM) ───────────────────────────
  const LEAD = [
    { x: 489, w: 538, y: 208, hh: 35, h: 100, nx: 498, nw: 92, nfs: 28,
      vx: 600, rx: 608, rw: 316, rfs: 18, kx: 930, ky: 257, kw: 86, kh: 37 },
    { x: 470, w: 578, y: 338, hh: 36, h: 98, nx: 478, nw: 84, nfs: 26,
      vx: 566, rx: 574, rw: 378, rfs: 17, kx: 957, ky: 387, kw: 82, kh: 36 },
  ];
  d.lead.forEach((ld, i) => {
    const g = LEAD[i];
    H.roundRect(sl, s, { x: g.x, y: g.y, w: g.w, h: g.h }, { pres, fill: C.WHITE, line: EDGE, rad: 10 });
    capBar(pres, sl, s, { x: g.x, y: g.y, w: g.w, h: g.hh }, HDR19);
    H.text(sl, s, { x: g.x, y: g.y, w: g.w, h: g.hh }, {
      text: ld.head, fs: s.FS(21), bold: true, color: C.WHITE, align: 'center', fit: true,
    });
    H.text(sl, s, { x: g.nx, y: g.y + g.hh + 6, w: g.nw, h: g.h - g.hh - 12 }, {
      text: ld.name, fs: s.FS(g.nfs), bold: true, color: C.TXT, align: 'center', fit: true,
    });
    H.vline(sl, s, { x: g.vx, y: g.y + g.hh + 14, h: g.h - g.hh - 28 }, { pres, color: 'D8DCE4', thick: 1.2 });
    H.text(sl, s, { x: g.rx, y: g.y + g.hh + 6, w: g.rw, h: g.h - g.hh - 12 }, {
      text: ld.role, fs: s.FS(g.rfs), color: C.TXT, align: 'center', fit: true, pad: 0.02,
    });
    H.roundRect(sl, s, { x: g.kx, y: g.ky, w: g.kw, h: g.kh }, { pres, fill: CHIP_B, rad: 8 });
    H.text(sl, s, { x: g.kx, y: g.ky, w: g.kw, h: g.kh }, {
      text: ld.term, fs: s.FS(17), color: CHIP_TB, align: 'center', fit: true,
    });
  });

  // ── 연결선: 총괄 → PM → 4개 그룹 ────────────────────────
  const line = (x, y, w, h) => sl.addShape(pres.shapes.LINE, {
    x: s.X(x), y: s.Y(y), w: s.W(w), h: s.H(h),
    line: { color: CONN, width: 1.5 },
  });
  line(759, 308, 0, 30);                        // 총괄 → PM
  line(759, 436, 0, 24);                        // PM → 가로 분기
  line(GEO[0].cx, 460, GEO[3].cx - GEO[0].cx, 0);
  GEO.forEach((g) => line(g.cx, 460, 0, PILLY - 460));   // 분기 → 각 그룹

  // ── 4개 기능 그룹 ───────────────────────────────────────
  d.groups.forEach((gr, gi) => {
    const g = GEO[gi];
    const L = layout(g.pw, gr.members);
    H.roundRect(sl, s, { x: g.px, y: PTOP, w: g.pw, h: PBOT - PTOP },
      { pres, fill: C.WHITE, line: EDGE, rad: 10 });
    H.pill(sl, s, { x: g.lx, y: PILLY, w: g.lw, h: 35 }, {
      pres, fill: PILL[gr.tone], text: gr.head, fs: s.FS(22), rad: 17,
    });

    gr.members.forEach((m, mi) => {
      const r = L.rows[mi];
      if (mi > 0) {
        H.dline(sl, s, { x: g.px + 10, y: r.y, w: g.pw - 20 }, { pres, color: 'D6D8DC' });
      }
      const box = (dx, w, extra) => ({ x: g.px + dx, y: r.y + 5, w, h: r.h - 10, ...extra });
      H.text(sl, s, box(L.nx, L.nameW), {
        text: m.name, fs: s.FS(22), bold: true, color: C.TXT, align: 'left', fit: true,
      });
      H.text(sl, s, box(L.rx, L.roleW), {
        text: m.role.replace(/\n/g, ' '), fs: s.FS(17), bold: true, color: ROLE[gr.tone],
        align: 'left', lsm: 1.14,
      });
      H.vline(sl, s, { x: g.px + L.vx, y: r.y + 14, h: r.h - 28 },
        { pres, color: 'DEE0E4', thick: 1.2 });
      H.text(sl, s, box(L.tx, L.taskW), {
        text: m.task.replace(/\n/g, ' '), fs: s.FS(15), color: DESC,
        align: 'left', lsm: 1.1,
      });
      const cream = gr.tone === 'GOLD';
      const kh = Math.min(56, r.h - 14);
      H.roundRect(sl, s, { x: g.px + L.kx, y: r.y + (r.h - kh) / 2, w: L.chipW, h: kh },
        { pres, fill: cream ? CHIP_C : CHIP_B, rad: 8 });
      H.text(sl, s, { x: g.px + L.kx, y: r.y + (r.h - kh) / 2, w: L.chipW, h: kh }, {
        text: m.term, fs: s.FS(16), color: cream ? CHIP_TC : CHIP_TB,
        align: 'center', lsm: 1.16,
      });
    });
  });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.roundRect(sl, s, { x: 44, y: 874, w: 1450, h: 107 }, { pres, fill: BAND19, rad: 18 });
  [90, 1437].forEach((x) => sl.addShape(pres.shapes.OVAL, {
    x: s.X(x), y: s.Y(922), w: s.W(11), h: s.H(11),
    fill: { color: C.WHITE }, line: { type: 'none' },
  }));
  H.text(sl, s, { x: 120, y: 886, w: 1298, h: 44 }, {
    text: d.band1, fs: s.FS(27), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 120, y: 928, w: 1298, h: 46 }, {
    text: d.band2, fs: s.FS(28), bold: true, color: GOLD19, align: 'center', fit: true,
  });
};
