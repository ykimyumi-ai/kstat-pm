'use strict';
/** 1. 회수 목표선과 자동 발동 관리 (원본 1536×1024) */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  // ── 헤더 ────────────────────────────────────────────────
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 30, ty: 10, tw: 1000, th: 68, tfs: s.FS(46),
    sx: 34, sy: 92, mw: 12, mh: 30, marks: 2,
    sub: d.sub, bx: 68, by: 88, bw: 900, bh: 44, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 130, y: 138, w: 1290, h: 62 }, {
    pres, runs: d.quote, fs: s.FS(29),
  });

  // ── 섹션 1: 달성률별 자동 발동 체계 ─────────────────────
  H.panel(sl, s, { x: 33, y: 226, w: 1470, h: 360 }, P);
  H.pill(sl, s, { x: 42, y: 215, w: 356, h: 45 }, {
    pres, fill: C.NAVY, text: d.sec1, fs: s.FS(26),
  });

  const rowY = [268, 333, 398, 470];
  const rowH = [58, 58, 68, 96];
  d.rows.forEach((r, i) => {
    const y = rowY[i], h = rowH[i];
    // 라벨 박스
    H.pill(sl, s, { x: 66, y, w: 326, h }, {
      pres, fill: r.gold ? C.GOLD : C.NAVY, text: r.label,
      fs: r.gold ? s.FS(19) : s.FS(24),
    });
    // 조치 내용 — 원본의 줄바꿈 구조를 그대로 지키도록 fit 적용
    H.text(sl, s, { x: 406, y, w: 694, h }, {
      text: r.act, fs: s.FS(22), align: 'center', lsm: 1.25, fit: true,
    });
    // 세로 구분선
    H.vline(sl, s, { x: 1102, y: y + 8, h: h - 16 }, P);
    // 보고 배지 + 보고 내용
    H.goldBadge(sl, s, { x: 1121, y: y + h / 2 - 15, w: 73, h: 30 }, {
      pres, text: d.badge, fs: s.FS(20),
    });
    H.text(sl, s, { x: 1210, y, w: 296, h }, {
      text: r.rep, fs: s.FS(22), align: 'left', fit: true,
    });
    // 행 구분선
    if (i < d.rows.length - 1) {
      H.hline(sl, s, { x: 66, y: y + h + 3, w: 1420 }, P);
    }
  });

  // ── 섹션 2: 본조사 8주 누적 목표 ────────────────────────
  H.panel(sl, s, { x: 33, y: 610, w: 1470, h: 167 }, P);
  H.pill(sl, s, { x: 42, y: 600, w: 357, h: 43 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(26),
  });

  const nodeX = [116, 275, 434, 588, 733, 881, 1024, 1153];
  H.timeline(sl, s, {
    pres, y: 660, d: 33, fs: s.FS(19),
    nodes: d.steps.map((st, i) => ({ n: st.n, x: nodeX[i], fill: st.gold ? C.GOLD : C.NAVY })),
  });
  d.steps.forEach((st, i) => {
    const cx = nodeX[i] + 16.5;
    H.text(sl, s, { x: cx - 85, y: 700, w: 170, h: 32 }, {
      text: st.pct, fs: s.FS(26), bold: true,
      color: st.gold ? C.TXT : C.BLUE_TXT, align: 'center',
    });
    H.text(sl, s, { x: cx - 85, y: 736, w: 170, h: 28 }, {
      text: st.cnt, fs: s.FS(20), color: C.TXT_MID, align: 'center',
    });
    if (i < d.steps.length - 1) {
      H.vline(sl, s, { x: (nodeX[i] + nodeX[i + 1]) / 2 + 16.5, y: 700, h: 60 }, { pres, color: C.LINE });
    }
  });
  // 원본 폭은 221px이지만 KoPub이 원본 서체보다 넓고 최소 10pt 규칙이 있어
  // 1줄이 유지되도록 폭을 267px로 늘렸다. 왼쪽은 '3,000개사' 글자 끝(약 1220px),
  // 오른쪽은 패널 한계(1503px) 사이에 들어간다.
  H.pill(sl, s, { x: 1233, y: 720, w: 267, h: 37 }, {
    pres, fill: C.GOLD, text: d.stepNote, fs: s.FS(16), pad: 0.02,
  });

  // ── 섹션 3: 운영·보고 원칙 ──────────────────────────────
  H.panel(sl, s, { x: 32, y: 803, w: 1471, h: 152 }, P);
  H.pill(sl, s, { x: 42, y: 792, w: 300, h: 43 }, {
    pres, fill: C.NAVY, text: d.sec3, fs: s.FS(26),
  });

  const colX = [46, 528, 1010];
  d.principles.forEach((p, i) => {
    H.numBadge(sl, s, { x: colX[i], y: 852, w: 32, h: 32 }, {
      pres, kind: 'square', n: i + 1, fs: s.FS(19),
    });
    H.text(sl, s, { x: colX[i] + 44, y: 846, w: 442, h: 104 }, {
      text: p, fs: s.FS(20), align: 'left', valign: 'top', lsm: 1.32, fit: true,
    });
    if (i < 2) {
      H.vline(sl, s, { x: colX[i] + 462, y: 845, h: 95 }, { pres, color: C.LINE });
    }
  });

  H.footnote(sl, s, { y: 968, fs: s.FS(20), text: d.foot });
};
