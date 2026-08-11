'use strict';
/**
 * 16. 오인·에너지경비·희소층은 판별 로직을 달리 설계 (원본 1490×1056)
 *
 * 실측 좌표
 *   pill x=35·518·1001 y=329 w=459·459·461 h=45 (navy 012984)
 *   카드 본문 y=376~918 / 악센트 카드 y=453·621·710
 *   하단 밴드 32,927 1429×85 (charcoal 292C3A)
 */
const { C } = require('../theme');
const H = require('../helpers');

const NAVY16 = '012984';
const BAND16 = '292C3A';
const TONE = { NAVY: '022B8E', GOLD: 'AD9060', SKY: '2789B0' };

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.runHead(sl, s, { text: d.runHead, y: 23, fs: s.FS(20) });
  H.chapterBadge(sl, s, {
    x: 1000, y: 23, w: 400, h: 28, fs: s.FS(20),
    runs: [
      { text: '|   ', options: { color: 'B9BEC6' } },
      { text: d.chapter, options: { color: C.TXT_SUB } },
    ],
  });
  H.titleBlock(sl, s, {
    pres,
    title: d.title, tx: 28, ty: 52, tw: 1400, th: 70, tfs: s.FS(43),
    sx: 30, sy: 147, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 58, by: 143, bw: 900, bh: 42, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 182, y: 200, w: 1130, h: 100 }, {
    pres, runs: d.quote, fs: s.FS(30), padX: 34, lsm: 1.35,
  });

  // ── 업종 카드 3장 ───────────────────────────────────────
  // 카드는 459px 폭이지만 pill 은 그보다 좁다(실측 270·235·236). 사진은 pill 오른쪽.
  const CARD = [
    { px: 35, pw: 459, lw: 270, img: { x: 318, y: 332, w: 150, h: 104 } },
    { px: 518, pw: 459, lw: 235, img: { x: 752, y: 344, w: 222, h: 94 } },
    { px: 1001, pw: 461, lw: 236, img: { x: 1278, y: 320, w: 176, h: 124 } },
  ];
  // 악센트 카드 세로 배치 — 위험 요인 / 판별 단계 / 대응 전략
  const BLK = [
    { y: 449, h: 162 }, { y: 618, h: 80 }, { y: 706, h: 200 },
  ];

  d.cards.forEach((c, i) => {
    const g = CARD[i];
    H.roundRect(sl, s, { x: g.px - 2, y: 376, w: g.pw + 4, h: 542 }, {
      pres, fill: C.WHITE, line: 'E4E7EC', rad: 14,
    });
    H.pill(sl, s, { x: g.px, y: 329, w: g.lw, h: 45 }, {
      pres, fill: NAVY16, text: `${c.n} ${c.name}`, fs: s.FS(28), rad: 22,
    });
    H.text(sl, s, { x: g.px + 14, y: 384, w: 250, h: 60 }, {
      text: c.stat, fs: s.FS(22), color: C.TXT, align: 'left', valign: 'top', lsm: 1.2, fit: true,
    });
    H.image(sl, s, g.img, { name: c.img });

    c.blocks.forEach((b, bi) => {
      H.accentCard(sl, s, { x: g.px + 16, y: BLK[bi].y, w: g.pw - 32, h: BLK[bi].h }, {
        pres, tone: TONE[b.tone], head: b.head, hfs: s.FS(22), hh: 26, bt: 34,
        items: b.items, fs: s.FS(21), gap: 2, lsm: 0.98,
      });
    });
  });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.bandBar(sl, s, { x: 32, y: 927, w: 1429, h: 85 }, {
    pres, fill: BAND16, runs: d.band, fs: s.FS(32),
  });
};
