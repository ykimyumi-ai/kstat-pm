'use strict';
/**
 * 7. 국가승인통계 법정 첨부서류 준비 (원본 1491×1055 — A4 가로 비율)
 * 3:2로 옮기면서 세로가 약 6% 압축되므로 행 간격만 비례로 줄어든다.
 */
const { C } = require('../theme');
const H = require('../helpers');

module.exports = function ({ pres, sl, s, d }) {
  const P = { pres };

  H.text(sl, s, { x: 30, y: 18, w: 1000, h: 72 }, {
    text: d.title, fs: s.FS(48), bold: true, color: C.TXT,
  });
  H.chapterBadge(sl, s, {
    x: 1000, y: 24, w: 465, h: 40, fs: s.FS(24),
    runs: [
      { text: '/  ', options: { color: C.NAVY, bold: true } },
      { text: '시행규칙 제12조 산출물 1:1 매핑', options: { color: C.TXT_MID } },
    ],
  });
  H.quoteBand(sl, s, { x: 66, y: 110, w: 1360, h: 82 }, {
    pres, runs: d.quote, fs: s.FS(28),
  });

  // ── 7종 법정서류 대응 ───────────────────────────────────
  H.panel(sl, s, { x: 31, y: 232, w: 1430, h: 498 }, P);
  H.pill(sl, s, { x: 30, y: 214, w: 263, h: 44 }, {
    pres, fill: C.NAVY, text: d.sec, fs: s.FS(26),
  });

  const rowY = [275, 339, 403, 466, 529, 592, 654];
  d.rows.forEach((r, i) => {
    const y = rowY[i];
    H.card(sl, s, { x: 52, y, w: 1390, h: 54 }, { pres });
    // 번호 사각 배지
    sl.addShape(pres.shapes.RECTANGLE, {
      x: s.X(80), y: s.Y(y + 11), w: s.W(33), h: s.H(32),
      fill: { color: C.NAVY }, line: { type: 'none' },
    });
    H.text(sl, s, { x: 80, y: y + 11, w: 33, h: 32 }, {
      text: String(r.n), fs: s.FS(20), bold: true, color: C.WHITE, align: 'center',
    });
    // 서류명 (일부는 작은 부제가 붙는다)
    if (r.nameSub) {
      sl.addText(
        [
          { text: r.name, options: { bold: true, color: C.NAVY_DEEP } },
          { text: r.nameSub, options: { bold: false, color: C.TXT_SUB, fontSize: s.FS(17) } },
        ],
        {
          x: s.X(138), y: s.Y(y), w: s.W(300), h: s.H(54),
          ...H.txtOpts({ fs: s.FS(23), bold: true, align: 'left' }),
        }
      );
    } else {
      H.text(sl, s, { x: 138, y, w: 300, h: 54 }, {
        text: r.name, fs: s.FS(23), bold: true, color: C.NAVY_DEEP, align: 'left', fit: true,
      });
    }
    // 설명 — 6번 행만 수식이 섞여 서식 있는 런으로 조립한다.
    if (r.descRuns) {
      sl.addText(
        [
          { text: '층별 멱배분(' },
          { text: 'α', options: { italic: true } },
          { text: '=0.4, 착수 시 확정)·추출률, 가중치 ' },
          { text: 'w', options: { italic: true } },
          { text: '=1/' },
          { text: 'π', options: { italic: true } },
          { text: '1', options: { subscript: true } },
          { text: ', 모집단 M=N×' },
          { text: 'p̂', options: { italic: true } },
          { text: ' 추정' },
        ],
        {
          x: s.X(452), y: s.Y(y), w: s.W(742), h: s.H(54),
          ...H.txtOpts({ fs: s.FS(21), align: 'left' }),
        }
      );
    } else {
      H.text(sl, s, { x: 452, y, w: 742, h: 54 }, {
        text: r.desc, fs: s.FS(21), align: 'left', fit: true,
      });
    }
    // 시점 배지
    H.goldBadge(sl, s, { x: 1218, y: y + 11, w: 170, h: 33 }, {
      pres, text: r.when, fs: s.FS(20),
    });
  });

  // ── 신청 지원 범위 ──────────────────────────────────────
  H.panel(sl, s, { x: 33, y: 765, w: 1431, h: 234 }, P);
  H.pill(sl, s, { x: 29, y: 740, w: 224, h: 43 }, {
    pres, fill: C.NAVY, text: d.sec2, fs: s.FS(26),
  });

  const colX = [280, 660, 1040];
  const colW = [340, 340, 400];
  d.support.forEach((c, i) => {
    H.numBadge(sl, s, { x: colX[i] + colW[i] / 2 - 17, y: 790, w: 34, h: 34 }, {
      pres, kind: 'circle', n: i + 1, fs: s.FS(20),
    });
    H.text(sl, s, { x: colX[i], y: 834, w: colW[i], h: 110 }, {
      text: c.text, fs: s.FS(22), bold: true, color: C.NAVY_DEEP,
      align: 'center', valign: 'top', lsm: 1.3, fit: true,
    });
    if (c.note) {
      H.text(sl, s, { x: colX[i], y: 946, w: colW[i], h: 40 }, {
        text: c.note, fs: s.FS(17), color: C.TXT_SUB, align: 'center', valign: 'top',
      });
    }
    if (i < 2) H.vline(sl, s, { x: colX[i] + colW[i] + 20, y: 790, h: 180 }, { pres, color: 'DCE0E6' });
  });
};
