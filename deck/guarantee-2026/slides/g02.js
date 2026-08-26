'use strict';
/**
 * 2장 — 자금 사정 및 자금 조달
 *
 * 카드 3장 + 결론 밴드. 네이티브 차트 2개(현재·미래 요인 가로 막대)를 쓴다.
 * 7점 척도 눈금자·순위 목록은 차트가 아니라 도형이다.
 *
 * 원본은 막대 길이가 값에 정확히 비례하지 않는다(23.3% 막대가 68.9% 막대의
 * 절반에 가깝다). 네이티브 차트는 비례해서 그리므로 작은 값의 막대가 원본보다
 * 짧아진다 — 원본이 틀린 쪽이라 바로잡은 것이다(README 참조).
 */
const { C } = require('../theme');
const H = require('../helpers');
const CH = require('../charts');

const CARD_X = 52;
const CARD_W = 1494;
const RAMP = [C.BLUE_DEEP, C.BLUE, C.BLUE_MID, C.BLUE_LT, C.BLUE_PALE];

module.exports = function draw(pres, sl, d, s) {
  // ── 머리 ─────────────────────────────────────────────────
  H.image(sl, s, { x: 1026, y: 30, w: 536, h: 292 }, { name: d.art });
  H.image(sl, s, { x: 960, y: 152, w: 64, h: 168 }, { name: 'g02-hero-left' });
  H.chapterHead(sl, s, {
    x: 50, y: 35, bw: 181, bh: 164,
    tx: 282, ty: 46, tw: 745, th: 110,
    sy: 151, sh: 130, sw: 700,
  }, {
    pres, no: d.no, noFs: s.FSD(87),
    title: d.title, titleFs: s.FS(80), titleFit: true,
    sub: d.sub, subFs: s.FS(40), subFit: true, subLsm: 1.4,
  });

  const S = d.sections;

  // ── 카드 1 : 자금사정 체감도 ──────────────────────────────
  H.roundRect(sl, s, { x: CARD_X, y: 331, w: CARD_W, h: 570 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 80, y: 354, w: 365, h: 78 }, {
    pres, no: S[0].no, noFs: s.FSD(40), bw: 74, gap: 26,
    title: S[0].head, fs: s.FS(34), rad: 12,
  });
  H.text(sl, s, { x: 476, y: 368, w: 1040, h: 62 }, {
    text: S[0].lead, fs: s.FS(31), bold: true, color: C.NAVY, valign: 'middle', fit: true,
  });
  H.vline(sl, s, { x: 806, y: 470, h: 400 }, { pres, color: 'DCE6F1', width: 1 });

  // 두 패널은 폭이 다르다(원본이 그렇다). 눈금자 시작점·간격도 따로 잰 값이다.
  const pan = [
    { pill: { x: 308, y: 477, w: 437, h: 67 }, cx: 526,
      scaleX: 345, vx: 420, base: 697,
      ruler: { x: 279, y: 755, w: 478, d: 44 }, img: { x: 64, y: 488, w: 212, h: 394 } },
    { pill: { x: 953, y: 477, w: 506, h: 67 }, cx: 1206,
      scaleX: 1060, vx: 1140, base: 697,
      ruler: { x: 992, y: 755, w: 481, d: 44 }, img: { x: 830, y: 474, w: 234, h: 326 },
      img2: { x: 830, y: 798, w: 152, h: 84 } },
  ];
  S[0].panels.forEach((pn, i) => {
    const g = pan[i];
    H.image(sl, s, g.img, { name: pn.img });
    if (g.img2) H.image(sl, s, g.img2, { name: 'g02-scope-b' });
    H.roundRect(sl, s, g.pill, { pres, fill: C.TINT, rad: 20 });
    H.runs(sl, s, { x: g.pill.x, y: g.pill.y, w: g.pill.w, h: g.pill.h }, {
      runs: [
        { t: pn.label, fs: s.FS(33), color: C.NAVY },
        { t: ` ${pn.note}`, fs: s.FS(26), color: C.NAVY },
      ],
      align: 'center', valign: 'middle',
    });
    H.text(sl, s, { x: g.scaleX - 60, y: 570, w: 500, h: 44 }, {
      text: S[0].scale, fs: s.FS(31), bold: true, color: C.TXT, align: 'center', fit: true,
    });
    H.bigValue(sl, s, { x: g.vx - 60, base: g.base, w: 320 }, {
      v: pn.v, u: S[0].panels[0].u, vFs: s.FSD(62), uFs: s.FS(46), align: 'center',
    });
    H.scaleRuler(sl, s, g.ruler, {
      pres, n: 7, mark: pn.mark, mid: 4, fs: s.FS(28),
      mw: 30, mh: 26, mgap: 8,
    });
    // 눈금 아래 라벨 — 양끝은 두 줄, 가운데는 한 줄
    const step = (g.ruler.w - g.ruler.d) / 6;
    H.text(sl, s, { x: g.ruler.x - 40, y: 802, w: g.ruler.d + 80, h: 100 }, {
      text: `${S[0].low1}\n${S[0].low2}`, fs: s.FS(28), bold: true, color: C.RED,
      align: 'center', valign: 'top', lsm: 1.16,
    });
    H.text(sl, s, { x: g.ruler.x + step * 3 - 40, y: 802, w: g.ruler.d + 80, h: 50 }, {
      text: S[0].mid, fs: s.FS(28), bold: true, color: C.TXT, align: 'center', valign: 'top',
    });
    H.text(sl, s, { x: g.ruler.x + step * 6 - 40, y: 802, w: g.ruler.d + 80, h: 100 }, {
      text: `${S[0].high1}\n${S[0].high2}`, fs: s.FS(28), bold: true, color: C.NAVY,
      align: 'center', valign: 'top', lsm: 1.16,
    });
  });

  // ── 카드 2 : 자금사정 영향 요인 (네이티브 차트 2개) ───────
  H.roundRect(sl, s, { x: CARD_X, y: 926, w: CARD_W, h: 618 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 80, y: 949, w: 829, h: 78 }, {
    pres, no: S[1].no, noFs: s.FSD(40), bw: 74, gap: 26,
    title: S[1].head, fs: s.FS(34), rad: 12,
    note: S[1].note, noteFs: s.FS(27),
  });
  H.text(sl, s, { x: 940, y: 946, w: 600, h: 86 }, {
    text: S[1].lead, fs: s.FS(31), bold: true, color: C.NAVY,
    valign: 'middle', lsm: 1.24,
  });

  const ROW0 = 1148;          // 첫 막대 위쪽
  const PITCH = 82.3;         // 행 간격 (실측 85·82·80 의 평균)
  const BARH = 47;
  H.text(sl, s, { x: 200, y: 1060, w: 460, h: 50 }, {
    text: S[1].leftHead, fs: s.FS(34), bold: true, color: C.TXT, align: 'center',
  });
  H.text(sl, s, { x: 990, y: 1060, w: 460, h: 50 }, {
    text: S[1].rightHead, fs: s.FS(34), bold: true, color: C.TXT, align: 'center',
  });

  // 항목 이름·아이콘은 차트 밖 네이티브 객체다 (차트에 맡기면 칸 폭을 렌더러가 정한다)
  S[1].cats.forEach((t, i) => {
    const y = ROW0 + i * PITCH;
    H.text(sl, s, { x: 60, y: y + 2, w: 174, h: BARH }, {
      text: t, fs: s.FS(28), bold: true, color: C.TXT, align: 'right', fit: true,
    });
    H.image(sl, s, { x: 686, y: y - 8, w: 88, h: 80 }, { name: `g02-fac${i + 1}` });
    H.text(sl, s, { x: 791, y: y + 2, w: 230, h: BARH }, {
      text: t, fs: s.FS(28), bold: true, color: C.TXT, align: 'left', fit: true,
    });
    // 행 사이 옅은 구분선
    if (i < S[1].cats.length - 1) {
      H.hline(sl, s, { x: 60, y: y + PITCH - 17, w: 600 }, { pres, color: 'EDF3FA' });
      H.hline(sl, s, { x: 791, y: y + PITCH - 17, w: 740 }, { pres, color: 'EDF3FA' });
    }
  });

  const chartH = PITCH * S[1].cats.length;
  CH.hbar(sl, s, pres, { x: 256, y: ROW0 - (PITCH - BARH) / 2, w: 424, h: chartH }, {
    name: S[1].leftHead, cats: S[1].cats, vals: S[1].leftVals, colors: RAMP,
    max: 110, barH: BARH, pitch: PITCH, valFs: s.FSD(33), fmt: '0.0"%"', bg: C.CARD,
  });
  CH.hbar(sl, s, pres, { x: 1030, y: ROW0 - (PITCH - BARH) / 2, w: 516, h: chartH }, {
    name: S[1].rightHead, cats: S[1].cats, vals: S[1].rightVals, colors: RAMP,
    max: 103, barH: BARH, pitch: PITCH, valFs: s.FSD(33), fmt: '0.0"%"', bg: C.CARD,
  });

  // ── 카드 3 : 부채 총액 + 애로사항 ─────────────────────────
  H.roundRect(sl, s, { x: CARD_X, y: 1569, w: CARD_W, h: 622 }, {
    pres, fill: C.CARD, line: C.CARD_LINE, rad: 26,
  });
  H.sectionHead(sl, s, { x: 80, y: 1593, w: 593, h: 78 }, {
    pres, no: S[2].no, noFs: s.FSD(40), bw: 74, gap: 26,
    title: S[2].head, fs: s.FS(34), rad: 12,
  });
  H.roundRect(sl, s, { x: 708, y: 1593, w: 813, h: 77 }, {
    pres, fill: C.NAVY, rad: 12,
  });
  H.runs(sl, s, { x: 740, y: 1593, w: 760, h: 77 }, {
    runs: [
      { t: S[3].head, fs: s.FS(34), color: C.WHITE },
      { t: `  ${S[3].note}`, fs: s.FS(27), color: C.WHITE },
    ],
    align: 'left', valign: 'middle',
  });
  H.vline(sl, s, { x: 690, y: 1690, h: 470 }, { pres, color: 'DCE6F1', width: 1 });

  // 좌 : 부채 총액
  H.image(sl, s, { x: 96, y: 1728, w: 248, h: 262 }, { name: S[2].img });
  const debt = [{ ly: 1710, base: 1814 }, { ly: 1870, base: 1977 }];
  S[2].cols.forEach((col, i) => {
    H.text(sl, s, { x: 348, y: debt[i].ly, w: 300, h: 46 }, {
      text: col.label, fs: s.FS(33), bold: true, color: C.TXT, align: 'left',
    });
    H.bigValue(sl, s, { x: 348, base: debt[i].base, w: 300 }, {
      v: col.v, u: col.u, vFs: s.FSD(60), uFs: s.FS(42), align: 'left',
    });
  });
  H.hline(sl, s, { x: 348, y: 1852, w: 296 }, { pres, color: 'DCE6F1' });
  H.noteBox(sl, s, { x: 92, y: 2044, w: 560, h: 122 }, {
    pres, fill: 'D9E9F9', rad: 18, icon: S[2].noteIcon,
    iconBox: { x: 104, y: 2052, w: 114, h: 106 },
    tx: 130, text: `${S[2].note1}\n${S[2].note2}`, fs: s.FS(34), color: C.TXT, lsm: 1.2,
  });

  // 우 : 애로사항 순위
  const R0 = 1690;
  const RP = 71;
  S[3].ranks.forEach((r, i) => {
    const y = R0 + i * RP;
    H.image(sl, s, { x: 744, y: y - 6, w: 92, h: 80 }, { name: `g02-medal${i + 1}` });
    H.image(sl, s, { x: 836, y: y + 4, w: 102, h: 74 }, { name: `g02-rank${i + 1}` });
    H.text(sl, s, { x: 958, y: y + 6, w: 380, h: 60 }, {
      text: r.t, fs: s.FS(36), bold: true, color: C.TXT, align: 'left', fit: true,
    });
    H.bigValue(sl, s, { x: 1265, base: y + 57, w: 200 }, {
      v: r.v, u: '%', vFs: s.FSD(40), uFs: s.FSD(25), align: 'right',
    });
    if (i < S[3].ranks.length - 1) {
      H.hline(sl, s, { x: 830, y: y + RP - 6, w: 700 }, { pres, color: 'EDF3FA' });
    }
  });
  H.noteBox(sl, s, { x: 732, y: 2044, w: 790, h: 122 }, {
    pres, fill: 'D9E9F9', rad: 18, icon: S[3].noteIcon,
    iconBox: { x: 744, y: 2052, w: 114, h: 106 },
    tx: 130, text: `${S[3].note1}\n${S[3].note2}`, fs: s.FS(34), color: C.TXT, lsm: 1.2,
  });

  // ── 하단 결론 밴드 ───────────────────────────────────────
  H.roundRect(sl, s, { x: 52, y: 2209, w: 1494, h: 158 }, { pres, fill: C.NAVY_DEEP, rad: 20 });
  H.image(sl, s, { x: 124, y: 2234, w: 172, h: 114 }, { name: d.band.icon });
  H.text(sl, s, { x: 320, y: 2232, w: 1130, h: 54 }, {
    text: d.band.line1, fs: s.FS(35), bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  H.text(sl, s, { x: 320, y: 2290, w: 1130, h: 56 }, {
    text: d.band.runs2[0].t, fs: s.FS(35), bold: true, color: 'FFD34D',
    align: 'center', fit: true,
  });
};
