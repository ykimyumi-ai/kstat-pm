'use strict';
/**
 * namp-2026 공통 컴포넌트
 *
 * 모든 좌표 인자는 원본 이미지의 **픽셀** 값이다. 각 헬퍼는 슬라이드마다
 * 주입된 스케일러(s)로 인치 환산한다.
 *
 * kstat-ppt 금지 규칙 준수:
 *   - ROUNDED_RECTANGLE 금지 → pill()이 OVAL+RECT+OVAL 합성으로 대체
 *   - shadow / transparency / '#' 접두 hex / 8자리 hex 사용하지 않음
 *   - 도형은 pres.shapes 상수만 사용
 */
const { C, FONT_B, FONT_M, MIN_PT } = require('./theme');
const FM = require('./fontmetrics');

/**
 * 문자열이 박스 폭을 넘으면 폰트를 줄여 반환한다.
 * 원본이 이미지라 넘침을 눈으로만 잡기 어려우므로 실제 폰트 메트릭으로 계산한다.
 * kstat-ppt 원칙 15에 따라 10pt 아래로는 내려가지 않는다.
 */
function fit(str, fs, boxWIn, bold, padIn) {
  // 폭 예측이 실제 렌더보다 2~3% 작게 나오는 구간이 있어 안전 여유를 둔다.
  // 넉넉히 들어가는 문자열은 축소가 일어나지 않으므로 영향이 없고,
  // 경계에 걸친 문자열만 한 단계 작아져 줄바꿈을 면한다.
  const avail = (boxWIn - (padIn === undefined ? 0.08 : padIn)) * 0.972;
  return FM.fitFont(str, fs, Math.max(avail, 0.2), bold, MIN_PT);
}

/**
 * 폭뿐 아니라 높이까지 맞춘다.
 * 줄바꿈 후 줄 수 × 줄높이가 박스를 넘으면 더 줄인다.
 * 카드 안의 불릿 목록이 아래로 삐져나오는 것을 막는 용도.
 */
function fitBox(str, fs, boxWIn, boxHIn, bold, lsm, extraIn) {
  let cur = fit(str, fs, boxWIn, bold, 0.02);
  // 렌더러마다 줄 간격이 조금씩 달라 6% 여유를 둔다. 문단 사이 간격도 함께 뺀다.
  const lh = ((lsm || 1.28) * 1.18) / 72;
  const avail = boxHIn - (extraIn || 0);
  for (let i = 0; i < 40; i++) {
    const n = FM.lineCount(str, cur, boxWIn - 0.02, bold);
    if (n * cur * lh <= avail || cur <= MIN_PT) break;
    cur = Math.round((cur - 0.2) * 10) / 10;
  }
  return Math.max(cur, MIN_PT);
}

/** 공통 텍스트 옵션 기본값 */
function txtOpts(o) {
  return {
    fontFace: o.bold ? FONT_B : FONT_M,
    fontSize: o.fs,
    color: o.color || C.TXT,
    bold: !!o.bold,
    align: o.align || 'left',
    valign: o.valign || 'middle',
    lineSpacingMultiple: o.lsm || 0.95,
    margin: 0,
    wrap: o.wrap !== false,
    charSpacing: o.cs,
    breakLine: undefined,
  };
}

/**
 * 양끝이 둥근 pill.
 * ROUNDED_RECTANGLE이 PPT를 손상시키므로 좌우 반원(OVAL) + 중앙 사각형으로 합성한다.
 */
function pill(sl, s, p, o) {
  const { x, y, w, h } = p;
  const fill = { color: o.fill };
  // 원본의 라운드는 높이가 커도 무한정 둥글어지지 않는다(최대 반지름 24px).
  // 상한을 두지 않으면 세로로 긴 라벨이 알약이 아니라 타원처럼 보인다.
  const rad = Math.min(h / 2, o.rad === undefined ? 24 : o.rad);
  const dia = rad * 2;
  sl.addShape(o.pres.shapes.OVAL, { x: s.X(x), y: s.Y(y), w: s.W(dia), h: s.H(dia), fill, line: { type: 'none' } });
  sl.addShape(o.pres.shapes.OVAL, { x: s.X(x + w - dia), y: s.Y(y), w: s.W(dia), h: s.H(dia), fill, line: { type: 'none' } });
  sl.addShape(o.pres.shapes.OVAL, { x: s.X(x), y: s.Y(y + h - dia), w: s.W(dia), h: s.H(dia), fill, line: { type: 'none' } });
  sl.addShape(o.pres.shapes.OVAL, { x: s.X(x + w - dia), y: s.Y(y + h - dia), w: s.W(dia), h: s.H(dia), fill, line: { type: 'none' } });
  sl.addShape(o.pres.shapes.RECTANGLE, { x: s.X(x + rad), y: s.Y(y), w: s.W(w - dia), h: s.H(h), fill, line: { type: 'none' } });
  sl.addShape(o.pres.shapes.RECTANGLE, { x: s.X(x), y: s.Y(y + rad), w: s.W(w), h: s.H(h - dia), fill, line: { type: 'none' } });
  if (o.text) {
    const bold = o.bold !== false;
    sl.addText(o.text, {
      x: s.X(x), y: s.Y(y), w: s.W(w), h: s.H(h),
      ...txtOpts({
        fs: fit(o.text, o.fs, s.W(w), bold, o.pad),
        color: o.color || C.WHITE, bold, align: o.align || 'center', lsm: o.lsm,
      }),
    });
  }
}

/**
 * 모서리가 둥근 사각형 (테두리 선택).
 * 14~16장의 패널·카드는 모서리가 둥글다. 사진 크롭이 그 둥근 모서리를 품고 있어
 * 각진 사각형으로 그리면 이음매가 드러나므로 같은 곡률로 그린다.
 */
function roundRect(sl, s, p, o) {
  const rad = Math.min(o.rad === undefined ? 14 : o.rad, p.w / 2, p.h / 2);
  const dia = rad * 2;
  const fill = { color: o.fill || C.WHITE };
  const line = o.line ? { color: o.line, width: 0.75 } : { type: 'none' };
  for (const [cx, cy] of [
    [p.x, p.y], [p.x + p.w - dia, p.y],
    [p.x, p.y + p.h - dia], [p.x + p.w - dia, p.y + p.h - dia],
  ]) {
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(cx), y: s.Y(cy), w: s.W(dia), h: s.H(dia), fill, line,
    });
  }
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + rad), y: s.Y(p.y), w: s.W(p.w - dia), h: s.H(p.h), fill, line,
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y + rad), w: s.W(p.w), h: s.H(p.h - dia), fill, line,
  });
  if (o.line) {
    // 합성 이음매의 테두리 선을 안쪽 면으로 덮어 한 겹처럼 보이게 한다.
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + rad), y: s.Y(p.y + 1), w: s.W(p.w - dia), h: s.H(p.h - 2),
      fill, line: { type: 'none' },
    });
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + 1), y: s.Y(p.y + rad), w: s.W(p.w - 2), h: s.H(p.h - dia),
      fill, line: { type: 'none' },
    });
  }
}

/** 모서리가 살짝 둥근 큰 패널을 사각형으로 근사 */
function panel(sl, s, p, o) {
  o = o || {};
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: o.fill || C.PANEL },
    line: o.line ? { color: o.line, width: 0.75 } : { type: 'none' },
  });
}

/** 흰 카드 (패널 위에 얹히는 행) */
function card(sl, s, p, o) {
  o = o || {};
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: o.fill || C.CARD },
    line: o.line ? { color: o.line, width: 0.75 } : { type: 'none' },
  });
}

/**
 * 자유 텍스트 배치.
 * fit:true 면 줄바꿈 대신 폰트를 줄여 박스 폭에 맞춘다(라벨·수치용).
 * 기본은 자연스러운 줄바꿈을 허용한다(본문용).
 */
function text(sl, s, p, o) {
  const fs = o.fit ? fit(o.text, o.fs, s.W(p.w), o.bold, o.pad) : o.fs;
  sl.addText(o.text, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ ...o, fs }),
  });
}

/** 번호 배지 — circle / square / diamond / hexagon */
function numBadge(sl, s, p, o) {
  const shapes = {
    circle: o.pres.shapes.OVAL,
    square: o.pres.shapes.RECTANGLE,
    diamond: o.pres.shapes.DIAMOND,
    hexagon: o.pres.shapes.HEXAGON,
  };
  sl.addShape(shapes[o.kind || 'circle'], {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: o.fill || C.NAVY }, line: { type: 'none' },
  });
  sl.addText(String(o.n), {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ fs: o.fs, color: o.color || C.WHITE, bold: true, align: 'center' }),
  });
}

/** 골드 배지 (보고 / 본 조사 사전 대응 / 시점 배지) */
function goldBadge(sl, s, p, o) {
  pill(sl, s, p, { pres: o.pres, fill: o.fill || C.GOLD, text: o.text, fs: o.fs, color: C.WHITE, bold: true });
}

/** 골드 배지 + 우측 삼각 화살촉 (11장 대응 배지) */
function arrowBadge(sl, s, p, o) {
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: C.GOLD }, line: { type: 'none' },
  });
  sl.addShape(o.pres.shapes.ISOSCELES_TRIANGLE, {
    x: s.X(p.x + p.w), y: s.Y(p.y), w: s.W(p.h * 0.55), h: s.H(p.h),
    fill: { color: C.GOLD }, line: { type: 'none' }, rotate: 90,
  });
  sl.addText(o.text, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ fs: o.fs, color: C.WHITE, bold: true, align: 'center' }),
  });
}

/** 상단 러닝헤드: "2026"(파랑 볼드) + 나머지(회색) */
function runHead(sl, s, o) {
  sl.addText(
    [
      { text: '2026 ', options: { color: C.BLUE_TXT, bold: true } },
      { text: o.text, options: { color: C.TXT_SUB, bold: false } },
    ],
    {
      x: s.X(30), y: s.Y(o.y || 14), w: s.W(700), h: s.H(28),
      ...txtOpts({ fs: o.fs, align: 'left' }),
    }
  );
}

/** 우상단 챕터 배지 */
function chapterBadge(sl, s, o) {
  sl.addText(o.runs, {
    x: s.X(o.x), y: s.Y(o.y), w: s.W(o.w), h: s.H(o.h),
    ...txtOpts({ fs: o.fs, align: 'right', color: C.TXT_SUB }),
  });
}

/**
 * 대제목 + 슬래시 마크 + 부제.
 * 슬래시 마크는 원본의 기울어진 막대 1~2개 → PARALLELOGRAM으로 재현.
 */
function titleBlock(sl, s, o) {
  sl.addText(o.title, {
    x: s.X(o.tx), y: s.Y(o.ty), w: s.W(o.tw || 1400), h: s.H(o.th),
    ...txtOpts({ fs: o.tfs, bold: true, color: C.TXT, valign: 'middle' }),
  });
  const marks = o.marks === undefined ? 2 : o.marks;
  const mw = o.mw || 13, mh = o.mh || 30;
  for (let i = 0; i < marks; i++) {
    sl.addShape(o.pres.shapes.PARALLELOGRAM, {
      x: s.X(o.sx + i * (mw + 5)), y: s.Y(o.sy), w: s.W(mw), h: s.H(mh),
      fill: { color: i === marks - 1 ? C.NAVY : C.TXT_SUB },
      line: { type: 'none' }, rotate: 0, flipH: true,
    });
  }
  sl.addText(o.sub, {
    x: s.X(o.bx), y: s.Y(o.by), w: s.W(o.bw || 1200), h: s.H(o.bh),
    ...txtOpts({ fs: o.bfs, bold: true, color: C.TXT, valign: 'middle' }),
  });
}

/**
 * 인용 밴드: 좌우 대괄호 + 66/99 따옴표 + 중앙 정렬 문장.
 * runs 는 [{text, hi:true}] 형태 — hi 인 조각만 파랑 볼드로 강조한다.
 */
function quoteBand(sl, s, p, o) {
  const bw = 4, arm = Math.min(26, p.h * 0.28);
  if (o.style === 'box') {
    // 13장은 대괄호가 아니라 얇은 테두리의 둥근 박스다.
    // ROUNDED_RECTANGLE 금지라 모서리 원 + 사각형 두 장으로 합성한다.
    const rad = 12;
    const edge = { color: 'DDE1E8', width: 0.75 };
    const white = { color: C.WHITE };
    for (const [cx, cy] of [
      [p.x, p.y], [p.x + p.w - rad * 2, p.y],
      [p.x, p.y + p.h - rad * 2], [p.x + p.w - rad * 2, p.y + p.h - rad * 2],
    ]) {
      sl.addShape(o.pres.shapes.OVAL, {
        x: s.X(cx), y: s.Y(cy), w: s.W(rad * 2), h: s.H(rad * 2),
        fill: white, line: edge,
      });
    }
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + rad), y: s.Y(p.y), w: s.W(p.w - rad * 2), h: s.H(p.h),
      fill: white, line: edge,
    });
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x), y: s.Y(p.y + rad), w: s.W(p.w), h: s.H(p.h - rad * 2),
      fill: white, line: edge,
    });
    // 합성 이음매의 테두리 선을 흰 사각형으로 덮어 한 겹처럼 보이게 한다.
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + rad), y: s.Y(p.y + 1), w: s.W(p.w - rad * 2), h: s.H(p.h - 2),
      fill: white, line: { type: 'none' },
    });
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + 1), y: s.Y(p.y + rad), w: s.W(p.w - 2), h: s.H(p.h - rad * 2),
      fill: white, line: { type: 'none' },
    });
  } else {
    const brk = (x, dir) => {
      sl.addShape(o.pres.shapes.RECTANGLE, {
        x: s.X(x), y: s.Y(p.y), w: s.W(bw), h: s.H(p.h),
        fill: { color: C.LINE }, line: { type: 'none' },
      });
      for (const yy of [p.y, p.y + p.h - bw]) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(dir > 0 ? x : x - arm + bw), y: s.Y(yy), w: s.W(arm), h: s.H(bw),
          fill: { color: C.LINE }, line: { type: 'none' },
        });
      }
    };
    brk(p.x, 1);
    brk(p.x + p.w - bw, -1);
  }

  const qfs = o.fs * 1.5;
  const qy = o.style === 'box' ? p.y + 4 : p.y + 2;
  sl.addText('“', {
    x: s.X(p.x + (o.style === 'box' ? 16 : 30)), y: s.Y(qy), w: s.W(60), h: s.H(p.h * 0.6),
    ...txtOpts({ fs: qfs, bold: true, color: 'B9BEC6', align: 'center', valign: 'top' }),
  });
  sl.addText('”', {
    x: s.X(p.x + p.w - (o.style === 'box' ? 76 : 90)), y: s.Y(qy), w: s.W(60), h: s.H(p.h * 0.6),
    ...txtOpts({ fs: qfs, bold: true, color: 'B9BEC6', align: 'center', valign: 'top' }),
  });

  // 인용문은 원본에서 줄 수가 고정이므로(대부분 1줄, br 지정 시 2줄)
  // 넘쳐서 줄이 늘어나지 않도록 실제 폰트 폭으로 크기를 맞춘다.
  const padX = o.padX === undefined ? 88 : o.padX;
  const innerW = s.W(p.w - padX * 2);
  const lines = [];
  let cur = '';
  o.runs.forEach((r) => {
    cur += r.text;
    if (r.br) { lines.push(cur); cur = ''; }
  });
  if (cur) lines.push(cur);
  const fs = fit(lines.join('\n'), o.fs, innerW, true, 0.05);

  sl.addText(
    o.runs.map((r) => ({
      text: r.text,
      options: { color: r.hi ? C.BLUE_TXT : C.TXT, bold: true, breakLine: !!r.br },
    })),
    {
      x: s.X(p.x + padX), y: s.Y(p.y), w: innerW, h: s.H(p.h),
      ...txtOpts({ fs, bold: true, align: 'center', lsm: o.lsm || 1.15 }),
    }
  );
}

/**
 * 산식 박스 — 얇은 테두리 안에 지표 산식을 중앙 정렬한다(13장 7회 반복).
 * 모서리는 pill 과 같은 방식으로 둥글게 합성한다.
 */
function formulaBox(sl, s, p, o) {
  const rad = Math.min(o.rad === undefined ? 10 : o.rad, p.h / 2);
  const edge = { color: o.edge || 'D6DAE1', width: 0.75 };
  const white = { color: C.WHITE };
  for (const [cx, cy] of [
    [p.x, p.y], [p.x + p.w - rad * 2, p.y],
    [p.x, p.y + p.h - rad * 2], [p.x + p.w - rad * 2, p.y + p.h - rad * 2],
  ]) {
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(cx), y: s.Y(cy), w: s.W(rad * 2), h: s.H(rad * 2), fill: white, line: edge,
    });
  }
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + rad), y: s.Y(p.y), w: s.W(p.w - rad * 2), h: s.H(p.h), fill: white, line: edge,
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y + rad), w: s.W(p.w), h: s.H(p.h - rad * 2), fill: white, line: edge,
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + rad), y: s.Y(p.y + 1), w: s.W(p.w - rad * 2), h: s.H(p.h - 2),
    fill: white, line: { type: 'none' },
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + 1), y: s.Y(p.y + rad), w: s.W(p.w - 2), h: s.H(p.h - rad * 2),
    fill: white, line: { type: 'none' },
  });
  sl.addText(o.text, {
    x: s.X(p.x + 2), y: s.Y(p.y), w: s.W(p.w - 4), h: s.H(p.h),
    ...txtOpts({
      fs: fit(o.text, o.fs, s.W(p.w - 4), true, 0.01),
      bold: true, color: o.color || C.TXT, align: 'center',
    }),
  });
}

/**
 * 원본에서 잘라낸 사진·아이콘 배치 (14~16장 전용).
 * 사진은 도형으로 재현할 수 없어 원본 크롭을 그대로 얹는다.
 * 크롭에 pill 픽셀이 함께 들어간 경우가 있어 pill 을 그린 뒤에 호출해야 한다.
 */
function image(sl, s, p, o) {
  sl.addImage({
    path: `${__dirname}/assets/${o.name}.png`,
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
  });
}

/**
 * 좌측 컬러 바가 붙은 흰 카드 (15·16장의 위험 요인 / 판별 단계 / 대응 전략).
 * 제목 색과 바 색이 같고, 본문은 • 불릿 목록이다.
 */
function accentCard(sl, s, p, o) {
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: C.WHITE }, line: { color: 'E4E7EC', width: 0.75 },
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(9), h: s.H(p.h),
    fill: { color: o.tone }, line: { type: 'none' },
  });
  const hh = o.hh === undefined ? 30 : o.hh;      // 제목 높이
  const bt = o.bt === undefined ? 40 : o.bt;      // 불릿 시작 offset
  sl.addText(o.head, {
    x: s.X(p.x + 24), y: s.Y(p.y + 6), w: s.W(220), h: s.H(hh),
    ...txtOpts({ fs: o.hfs, bold: true, color: o.tone, align: 'left' }),
  });
  bullets(sl, s, { x: p.x + 24, y: p.y + bt, w: p.w - 40, h: p.h - bt - 8 }, {
    items: o.items, fs: o.fs, gap: o.gap === undefined ? 2 : o.gap, lsm: o.lsm || 1.1,
  });
}

/**
 * 하단 강조 밴드 — 짙은 배경에 일부 조각만 노랑으로 강조.
 * runs 는 [{text, hl:true}] 형태.
 */
function bandBar(sl, s, p, o) {
  const rad = Math.min(p.h / 2, o.rad === undefined ? 20 : o.rad);
  const dia = rad * 2;
  const fill = { color: o.fill };
  for (const [cx, cy] of [
    [p.x, p.y], [p.x + p.w - dia, p.y],
    [p.x, p.y + p.h - dia], [p.x + p.w - dia, p.y + p.h - dia],
  ]) {
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(cx), y: s.Y(cy), w: s.W(dia), h: s.H(dia), fill, line: { type: 'none' },
    });
  }
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + rad), y: s.Y(p.y), w: s.W(p.w - dia), h: s.H(p.h), fill, line: { type: 'none' },
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y + rad), w: s.W(p.w), h: s.H(p.h - dia), fill, line: { type: 'none' },
  });
  const plain = o.runs.map((r) => r.text).join('');
  sl.addText(
    o.runs.map((r) => ({
      text: r.text,
      options: { color: r.hl ? (o.hl || 'FFE500') : C.WHITE, bold: true },
    })),
    {
      x: s.X(p.x + 30), y: s.Y(p.y), w: s.W(p.w - 60), h: s.H(p.h),
      ...txtOpts({ fs: fit(plain, o.fs, s.W(p.w - 60), true, 0.06), bold: true, align: 'center' }),
    }
  );
}

/** 최하단 ※ 각주 */
function footnote(sl, s, o) {
  sl.addText(o.text, {
    x: s.X(o.x || 34), y: s.Y(o.y), w: s.W(o.w || 1450), h: s.H(o.h || 30),
    ...txtOpts({ fs: o.fs, color: o.color || C.TXT_SUB, align: 'left' }),
  });
}

/** 세로 구분선 */
function vline(sl, s, p, o) {
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(o.thick || 1.5), h: s.H(p.h),
    fill: { color: o.color || C.LINE }, line: { type: 'none' },
  });
}

/** 가로 구분선 */
function hline(sl, s, p, o) {
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(o.thick || 1.5),
    fill: { color: o.color || C.LINE }, line: { type: 'none' },
  });
}

/**
 * 수평 타임라인: 라인 + 원형 노드.
 * 원본은 노드 간격이 균등하지 않으므로(라벨 폭에 따라 달라짐)
 * 각 노드의 x(좌상단, px)를 실측값 그대로 받는다.
 */
function timeline(sl, s, o) {
  const { y, d } = o;
  const first = o.nodes[0].x;
  const last = o.nodes[o.nodes.length - 1].x + d;
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(first + d / 2), y: s.Y(y + d / 2 - 1), w: s.W(last - first - d), h: s.H(2),
    fill: { color: o.lineColor || C.LINE }, line: { type: 'none' },
  });
  o.nodes.forEach((nd) => {
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(nd.x), y: s.Y(y), w: s.W(d), h: s.H(d),
      fill: { color: nd.fill || C.NAVY }, line: { type: 'none' },
    });
    sl.addText(String(nd.n), {
      x: s.X(nd.x), y: s.Y(y), w: s.W(d), h: s.H(d),
      ...txtOpts({ fs: o.fs, color: C.WHITE, bold: true, align: 'center' }),
    });
  });
}

/** 우향 화살촉 (단계 사이 연결) */
function chevron(sl, s, p, o) {
  sl.addShape(o.pres.shapes.ISOSCELES_TRIANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: o.fill || C.LINE }, line: { type: 'none' }, rotate: 90,
  });
}

/** 하향 화살표 (프로세스 → 결과) */
function arrowDown(sl, s, p, o) {
  sl.addShape(o.pres.shapes.DOWN_ARROW, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: o.fill || C.TXT_SUB }, line: { type: 'none' },
  });
}

/**
 * 불릿 문단 (• 로 시작하는 목록).
 * 불릿 기호와 들여쓰기가 차지하는 폭(약 0.2인치)을 빼고 폰트를 맞춘다.
 */
function bullets(sl, s, p, o) {
  // 원본의 \n 은 좁은 칸에 맞춘 줄바꿈이라, 폭이 달라진 지금 그대로 두면
  // 줄이 한 번 더 접혀 칸을 넘친다. 공백으로 이어 붙이고 자연 줄바꿈에 맡긴다.
  const items = o.items.map((it) =>
    String(typeof it === 'string' ? it : it.text).replace(/\n/g, ' '));
  const fs = fitBox(items.join('\n'), o.fs, s.W(p.w) - 0.22, s.H(p.h), o.bold, o.lsm || 1.05,
    ((o.gap || 4) / 72) * (items.length - 1));
  sl.addText(
    o.items.map((it, i) => ({
      text: items[i],
      options: {
        bullet: o.bullet === false ? false : { characterCode: '2022' },
        breakLine: true,
        color: (typeof it === 'object' && it.color) || o.color || C.TXT,
        bold: (typeof it === 'object' && it.bold) || o.bold || false,
        paraSpaceAfter: i === o.items.length - 1 ? 0 : (o.gap || 4),
        indentLevel: (typeof it === 'object' && it.lvl) || 0,
      },
    })),
    {
      x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
      ...txtOpts({ fs, align: 'left', valign: o.valign || 'top', lsm: o.lsm || 1.05 }),
    }
  );
}

/**
 * 서식이 섞인 불릿 목록 (아래첨자·위첨자·이탤릭이 들어간 수식용).
 *
 * groups 는 [[{t, sub, sup, i}, ...], ...] 형태이고 t 안의 \n 은 원본의 줄바꿈이다.
 * 첫 줄에만 • 를 붙이고 이어지는 줄은 들여쓰기만 해서 원본 모양을 유지한다.
 */
function richBullets(sl, s, p, o) {
  // 그룹 하나 = 문단 하나. 원본의 줄바꿈은 카드 폭에 맞춘 자연 줄바꿈이므로
  // 공백으로 이어 붙이고 PowerPoint가 접도록 둔다 — 그래야 불릿의 내어쓰기가
  // 정상 동작하고 이어지는 줄의 들여쓰기가 어긋나지 않는다.
  const groups = o.groups.map((runs) =>
    runs.map((r) => ({ ...r, t: String(r.t).replace(/\n/g, ' ') })));

  const plain = groups.map((runs) => runs.map((r) => r.t).join(''));
  const bulletIndent = 0.32;
  const gapIn = ((o.gap || 6) / 72) * (groups.length - 1);
  const fs = fitBox(
    plain.join('\n'), o.fs, s.W(p.w) - bulletIndent, s.H(p.h), false, o.lsm || 1.28, gapIn
  );

  const out = [];
  groups.forEach((runs, gi) => {
    runs.forEach((r, ri) => {
      out.push({
        text: r.t,
        options: {
          // 문단 속성이 어느 run에서 읽힐지 렌더러마다 달라 모든 run에 같은 값을 준다.
          bullet: { characterCode: '2022' },
          subscript: !!r.sub,
          superscript: !!r.sup,
          italic: !!r.i,
          breakLine: ri === runs.length - 1,
          paraSpaceAfter: gi === groups.length - 1 ? 0 : (o.gap || 6),
        },
      });
    });
  });

  sl.addText(out, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ fs, align: 'left', valign: 'top', lsm: o.lsm || 1.28 }),
  });
}

/** 대형 숫자 카드 (10장 총사업비) */
function bigNum(sl, s, p, o) {
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    fill: { color: C.NAVY }, line: { type: 'none' },
  });
  sl.addText(o.label, {
    x: s.X(p.x), y: s.Y(p.y + 18), w: s.W(p.w), h: s.H(44),
    ...txtOpts({ fs: o.lfs, color: C.WHITE, bold: true, align: 'center' }),
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(p.x + p.w * 0.16), y: s.Y(p.y + 68), w: s.W(p.w * 0.68), h: s.H(1.5),
    fill: { color: 'FFFFFF' }, line: { type: 'none' },
  });
  sl.addText(
    [
      { text: o.value, options: { fontSize: o.vfs } },
      { text: o.unit, options: { fontSize: o.ufs } },
    ],
    {
      x: s.X(p.x), y: s.Y(p.y + 78), w: s.W(p.w), h: s.H(86),
      ...txtOpts({ fs: o.vfs, color: C.WHITE, bold: true, align: 'center' }),
    }
  );
  sl.addText('—', {
    x: s.X(p.x), y: s.Y(p.y + 168), w: s.W(p.w), h: s.H(24),
    ...txtOpts({ fs: o.lfs, color: 'FFFFFF', bold: true, align: 'center' }),
  });
  sl.addText(o.note, {
    x: s.X(p.x), y: s.Y(p.y + 194), w: s.W(p.w), h: s.H(40),
    ...txtOpts({ fs: o.nfs, color: C.WHITE, bold: true, align: 'center' }),
  });
}

module.exports = {
  pill, panel, card, text, numBadge, goldBadge, arrowBadge,
  runHead, chapterBadge, titleBlock, quoteBand, formulaBox, footnote,
  image, accentCard, bandBar, roundRect,
  vline, hline, timeline, chevron, arrowDown, bullets, richBullets, bigNum, txtOpts,
};
