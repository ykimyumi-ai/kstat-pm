'use strict';
/**
 * 15. 적용대상 고밀도층은 명부와 응답지원을 집중 배분 (원본 1491×1055)
 *
 * 실측 좌표
 *   pill 좌 36,322 698×58 (navy 002677) / 우 757,322 697×58 (gold 9A835C)
 *   카드 본문 y=380~914 / 악센트 카드 y=455·606·700 (좌), 456·612·716 (우)
 *   하단 밴드 28,939 1431×76 (navy 00194A)
 *
 * 사진은 pill 위로 걸쳐 있어 pill 을 먼저 그린 뒤 크롭을 얹는다.
 * 그래서 pill 색은 팔레트값이 아니라 원본 실측값을 쓴다(이음매 제거).
 */
const { C } = require('../theme');
const H = require('../helpers');

const NAVY15 = '002677';
const GOLD15 = '9A835C';
const BAND15 = '00194A';
const TONE = { NAVY: '052976', GOLD: 'A88F63', SKY: '2B8DB6' };

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
    title: d.title, tx: 30, ty: 50, tw: 1400, th: 70, tfs: s.FS(44),
    sx: 32, sy: 146, mw: 12, mh: 30, marks: 1,
    sub: d.sub, bx: 60, by: 142, bw: 900, bh: 42, bfs: s.FS(29),
  });
  H.quoteBand(sl, s, { x: 196, y: 196, w: 1120, h: 100 }, {
    pres, runs: d.quote, fs: s.FS(30), padX: 34, lsm: 1.35,
  });

  // ── 업종 카드 2장 ───────────────────────────────────────
  const CARD = [
    {
      px: 36, pw: 698, cx: 35, cw: 700, tcx: 318,
      img: { x: 440, y: 360, w: 270, h: 92 },
      blocks: [
        { y: 455, h: 140 }, { y: 606, h: 82 }, { y: 700, h: 204 },
      ],
    },
    {
      px: 757, pw: 697, cx: 754, cw: 700, tcx: 1023,
      img: { x: 1180, y: 316, w: 260, h: 140 },
      blocks: [
        { y: 456, h: 144 }, { y: 612, h: 88 }, { y: 716, h: 184 },
      ],
    },
  ];

  d.cards.forEach((c, i) => {
    const g = CARD[i];
    // 카드 외곽
    H.roundRect(sl, s, { x: g.cx, y: 368, w: g.cw, h: 546 }, {
      pres, fill: C.WHITE, line: 'E4E7EC', rad: 14,
    });
    // 헤더 pill → 사진 순서 (사진 크롭에 pill 픽셀이 포함돼 있다)
    H.pill(sl, s, { x: g.px, y: 322, w: g.pw, h: 58 }, {
      pres, fill: c.tone === 'GOLD' ? GOLD15 : NAVY15, rad: 29,
    });
    // 원본은 라벨이 pill 정중앙이 아니라 사진을 피해 왼쪽으로 치우쳐 있다.
    H.text(sl, s, { x: g.tcx - 200, y: 322, w: 400, h: 58 }, {
      text: `${c.n} ${c.name}`, fs: s.FS(32), bold: true, color: C.WHITE, align: 'center',
    });
    H.text(sl, s, { x: g.px + 20, y: 392, w: 400, h: 40 }, {
      text: c.stat, fs: s.FS(26), color: C.TXT, align: 'center', fit: true,
    });
    H.image(sl, s, g.img, { name: c.img });

    c.blocks.forEach((b, bi) => {
      const bg = g.blocks[bi];
      H.accentCard(sl, s, { x: g.px + 18, y: bg.y, w: g.pw - 36, h: bg.h }, {
        pres, tone: TONE[b.tone], head: b.head, hfs: s.FS(24),
        items: b.items, fs: s.FS(22), gap: 3, lsm: 1.18,
      });
    });
  });

  // ── 하단 강조 밴드 ──────────────────────────────────────
  H.bandBar(sl, s, { x: 28, y: 939, w: 1431, h: 76 }, {
    pres, fill: BAND15, runs: d.band, fs: s.FS(32),
  });
};
