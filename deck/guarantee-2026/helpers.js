'use strict';
/**
 * guarantee-2026 공통 컴포넌트
 *
 * 좌표 인자는 전부 원본 이미지의 **픽셀**(1600×2400 기준)이다. 각 헬퍼가
 * 주입된 스케일러(s)로 인치 환산한다. 슬라이드 코드는 px 만 다룬다.
 *
 * kstat-ppt 금지 규칙 준수:
 *   - ROUNDED_RECTANGLE 금지 → pill()·roundRect() 가 OVAL+RECT 합성으로 대체
 *   - shadow / transparency / '#' 접두 hex / 8자리 hex 사용하지 않음
 *   - 도형은 pres.shapes 상수만 사용
 */
const { C, FONT_B, FONT_M, MIN_PT } = require('./theme');
const FM = require('../namp-2026/fontmetrics');

let ASSET_BASE = typeof __dirname === 'string' ? `${__dirname}/assets` : 'assets';
function setAssetBase(base) { ASSET_BASE = base; }
function assetUrl(name) {
  return typeof ASSET_BASE === 'function' ? ASSET_BASE(name) : `${ASSET_BASE}/${name}.png`;
}

// ── 글자 맞춤 ────────────────────────────────────────────────
/** 박스 폭을 넘으면 폰트를 줄인다. 넘침을 눈이 아니라 폰트 메트릭으로 잡는다. */
function fit(str, fs, boxWIn, bold, padIn) {
  const avail = (boxWIn - (padIn === undefined ? 0.08 : padIn)) * 0.972;
  return FM.fitFont(str, fs, Math.max(avail, 0.2), bold, MIN_PT);
}

/** 폭에 더해 높이(줄 수 × 줄높이)까지 맞춘다. */
function fitBox(str, fs, boxWIn, boxHIn, bold, lsm, extraIn) {
  let cur = fit(str, fs, boxWIn, bold, 0.02);
  const lh = ((lsm || 1.28) * 1.18) / 72;
  const avail = boxHIn - (extraIn || 0);
  for (let i = 0; i < 40; i++) {
    const n = FM.lineCount(str, cur, boxWIn - 0.02, bold);
    if (n * cur * lh <= avail || cur <= MIN_PT) break;
    cur = Math.round((cur - 0.2) * 10) / 10;
  }
  return Math.max(cur, MIN_PT);
}

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
  };
}

/** 자유 텍스트. fit:true 면 줄바꿈 대신 폰트를 줄여 폭에 맞춘다. */
function text(sl, s, p, o) {
  const fs = o.fit ? fit(o.text, o.fs, s.W(p.w), o.bold, o.pad) : o.fs;
  sl.addText(o.text, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ ...o, fs }),
  });
}

/** 서식 조각을 이어 붙인 한 줄 (큰 수치 + 작은 단위 등). */
function runs(sl, s, p, o) {
  sl.addText(o.runs.map((r) => ({
    text: r.t,
    options: {
      fontFace: r.bold === false ? FONT_M : FONT_B,
      fontSize: r.fs, color: r.color || C.TXT, bold: r.bold !== false,
      breakLine: !!r.br,
    },
  })), {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
    ...txtOpts({ fs: o.fs || 12, align: o.align || 'left', valign: o.valign, lsm: o.lsm }),
  });
}

/**
 * 공백을 사이에 둔 한글↔서구 경계에도 렌더러가 간격을 넣는다.
 * fontmetrics.widthIn 은 맞닿은 경계만 세므로 '억 3,703' 처럼 공백을 건너뛴
 * 경계를 여기서 더 센다. 이걸 빼면 폭을 좁게 잡아 뒤 조각이 겹친다.
 */
function seamPadEm(str) {
  const cs = [...str];
  let n = 0;
  for (let i = 1; i < cs.length; i++) {
    if (cs[i] === ' ') continue;
    let j = i - 1;
    while (j >= 0 && cs[j] === ' ') j -= 1;
    if (j >= 0 && j !== i - 1 && FM.isSeam(cs[j], cs[i])) n += 1;
  }
  return n * 0.25;
}

/** 렌더러가 실제로 차지하는 폭 (경계 간격까지 센다). */
function inkWidth(str, fs, bold) {
  return FM.widthIn(str, fs, bold) + seamPadEm(str) * (fs / 72);
}

/**
 * 큰 수치 + 단위 (56.5 % · 1.7 회 · 1억 3,703 만원 …).
 *
 * 한 글상자에 두 조각을 넣으면 렌더러가 한글↔숫자 경계에 0.25em 을 끼워 넣어
 * 원본보다 눈에 띄게 벌어진다. 그래서 폭을 직접 재서 **두 글상자**로 놓는다.
 * 단위는 숫자와 같은 baseline 에 앉히려고 아래맞춤 상자의 바닥을 올려 잡는다.
 *
 * 원본 글꼴이 KoPub돋움체보다 좁아 같은 잉크 높이로는 폭이 넘치는 자리가 많다.
 * 넘치면 숫자와 단위를 **같은 비율로** 줄여 칸 안에 넣는다.
 */
function bigValue(sl, s, p, o) {
  const maxW = s.W(p.w);
  const gap = (o.gap || 0) / 150;                 // px → in
  let vf = o.vFs;
  let uf = o.uFs || 0;
  const total = (a, b) => inkWidth(o.v, a, true)
    + (o.u ? inkWidth(o.u, b, true) + gap : 0);
  for (let i = 0; i < 120 && total(vf, uf) > maxW && vf > MIN_PT; i++) {
    const k = (vf - 0.4) / vf;
    vf = Math.round((vf - 0.4) * 10) / 10;
    uf = Math.round(uf * k * 10) / 10;
  }
  const vw = inkWidth(o.v, vf, true);
  const uw = o.u ? inkWidth(o.u, uf, true) : 0;
  const all = vw + uw + (o.u ? gap : 0);
  let x = s.X(p.x);
  if (o.align === 'center') x += (maxW - all) / 2;
  else if (o.align === 'right') x += maxW - all;

  // p.base 는 원본에서 잰 **글자 아랫선(px)**이다.
  // 아래맞춤 상자는 바닥에 descent 만큼 여백을 남기므로 그만큼 내려 잡아야
  // 잉크가 원본과 같은 자리에 온다. 크기가 다른 두 조각도 이렇게 하면
  // 자동으로 같은 baseline 에 앉는다.
  // 아래맞춤 상자가 바닥에 남기는 여백(em). 렌더 결과를 재서 맞춘 값이다
  // (0.22 로 두면 글자가 7px 아래로 내려온다).
  const DESC = 0.145;
  const color = o.color || C.BLUE_DEEP;
  const put = (t, fs, xx, w) => {
    const bottomPx = p.base + DESC * fs * (150 / 72);
    const hIn = (fs * 1.9) / 72;
    sl.addText(t, {
      x: xx, y: s.Y(bottomPx) - hIn, w, h: hIn,
      // wrap:false 가 핵심이다 — 폭을 재서 넣어도 렌더러의 자간 처리가 몇 % 더 넓어
      // '1억 3,703' 처럼 공백이 있는 값이 두 줄로 접힌다.
      ...txtOpts({ fs, bold: true, color, align: 'left', valign: 'bottom', wrap: false }),
    });
  };
  put(o.v, vf, x, vw + 0.12);
  if (o.u) put(o.u, uf, x + vw + gap, uw + 0.12);
  return { vf, uf, w: all };
}

// ── 도형 ─────────────────────────────────────────────────────
/** 양끝이 둥근 pill. ROUNDED_RECTANGLE 금지 규칙 때문에 합성한다. */
function pill(sl, s, p, o) {
  const { x, y, w, h } = p;
  const fill = { color: o.fill };
  const rad = Math.min(h / 2, w / 2, o.rad === undefined ? h / 2 : o.rad);
  const dia = rad * 2;
  const none = { type: 'none' };
  for (const [cx, cy] of [
    [x, y], [x + w - dia, y], [x, y + h - dia], [x + w - dia, y + h - dia],
  ]) {
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(cx), y: s.Y(cy), w: s.W(dia), h: s.H(dia), fill, line: none,
    });
  }
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(x + rad), y: s.Y(y), w: s.W(w - dia), h: s.H(h), fill, line: none,
  });
  sl.addShape(o.pres.shapes.RECTANGLE, {
    x: s.X(x), y: s.Y(y + rad), w: s.W(w), h: s.H(h - dia), fill, line: none,
  });
  if (o.text) {
    const bold = o.bold !== false;
    text(sl, s, { x: x + (o.tx || 0), y, w: w - (o.tx || 0), h }, {
      text: o.text, fs: o.fs, bold, fit: true,
      color: o.color || C.WHITE, align: o.align || 'center', lsm: o.lsm,
    });
  }
}

/** 모서리가 둥근 사각형 (테두리 선택). 인포그래픽 카드의 기본 그릇. */
function roundRect(sl, s, p, o) {
  const rad = Math.min(o.rad === undefined ? 20 : o.rad, p.w / 2, p.h / 2);
  const dia = rad * 2;
  const fill = { color: o.fill || C.CARD };
  const lw = o.lineW === undefined ? 0.75 : o.lineW;
  const line = o.line ? { color: o.line, width: lw } : { type: 'none' };
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
      x: s.X(p.x + rad), y: s.Y(p.y + 1.5), w: s.W(p.w - dia), h: s.H(p.h - 3),
      fill, line: { type: 'none' },
    });
    sl.addShape(o.pres.shapes.RECTANGLE, {
      x: s.X(p.x + 1.5), y: s.Y(p.y + rad), w: s.W(p.w - 3), h: s.H(p.h - dia),
      fill, line: { type: 'none' },
    });
  }
}

function hline(sl, s, p, o) {
  sl.addShape(o.pres.shapes.LINE, {
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: 0,
    line: { color: o.color || C.RULE, width: o.width === undefined ? 0.75 : o.width },
  });
}

function vline(sl, s, p, o) {
  sl.addShape(o.pres.shapes.LINE, {
    x: s.X(p.x), y: s.Y(p.y), w: 0, h: s.H(p.h),
    line: { color: o.color || C.RULE, width: o.width === undefined ? 0.75 : o.width },
  });
}

/** 원본에서 잘라낸 일러스트. altText 를 주지 않으면 빌드한 사람의 경로가 파일에 박힌다. */
function image(sl, s, p, o) {
  const url = assetUrl(o.name);
  const src = url.indexOf('data:') === 0 ? { data: url } : { path: url };
  sl.addImage({
    altText: o.name, ...src,
    x: s.X(p.x), y: s.Y(p.y), w: s.W(p.w), h: s.H(p.h),
  });
}

// ── 이 덱 전용 컴포넌트 ──────────────────────────────────────
/**
 * 장 머리 — 큰 번호 사각 배지 + 제목 + 부제.
 * 부제는 줄바꿈(\n)을 그대로 살린다(원본이 2~3줄로 끊어 놓았다).
 */
function chapterHead(sl, s, p, o) {
  roundRect(sl, s, { x: p.x, y: p.y, w: p.bw, h: p.bh }, {
    pres: o.pres, fill: o.fill || C.NAVY_DEEP, rad: o.brad === undefined ? 22 : o.brad,
  });
  text(sl, s, { x: p.x, y: p.y, w: p.bw, h: p.bh }, {
    text: o.no, fs: o.noFs, bold: true, color: C.WHITE, align: 'center',
  });
  text(sl, s, { x: p.tx, y: p.ty, w: p.tw, h: p.th }, {
    text: o.title, fs: o.titleFs, bold: true, color: o.titleColor || C.NAVY_DEEP,
    align: 'left', valign: 'middle', fit: o.titleFit !== false,
  });
  if (o.sub) {
    text(sl, s, { x: p.tx, y: p.sy, w: p.sw || p.tw, h: p.sh }, {
      text: o.sub, fs: o.subFs, bold: true, color: o.subColor || C.TXT_MID,
      align: 'left', valign: 'top', lsm: o.subLsm || 1.3, fit: o.subFit,
    });
  }
}

/**
 * 섹션 머리 — 번호 사각 배지 + 제목 필이 맞물린 한 덩어리.
 * 원본은 배지가 필보다 진하고 살짝 겹쳐 있다. 필을 먼저 깔고 배지를 얹는다.
 */
function sectionHead(sl, s, p, o) {
  roundRect(sl, s, { x: p.x, y: p.y, w: p.w, h: p.h }, {
    pres: o.pres, fill: o.fill || C.NAVY, rad: o.rad === undefined ? 12 : o.rad,
  });
  const bw = o.bw === undefined ? p.h : o.bw;
  roundRect(sl, s, { x: p.x, y: p.y, w: bw, h: p.h }, {
    pres: o.pres, fill: o.noFill || C.NAVY_DEEP, rad: o.rad === undefined ? 12 : o.rad,
  });
  text(sl, s, { x: p.x, y: p.y, w: bw, h: p.h }, {
    text: String(o.no), fs: o.noFs, bold: true, color: C.WHITE, align: 'center',
  });
  const tx = p.x + bw + (o.gap || 14);
  const tw = p.w - bw - (o.gap || 14) - (o.pad === undefined ? 10 : o.pad);
  if (o.note) {
    // 괄호 주석은 제목보다 한 단계 작게, 같은 줄에 이어 붙는다.
    // 넘치면 둘을 같은 비율로 줄인다.
    let f = o.fs;
    let nf = o.noteFs;
    const wide = () => inkWidth(o.title, f, true) + inkWidth(`  ${o.note}`, nf, true);
    for (let i = 0; i < 80 && wide() > s.W(tw) && f > MIN_PT; i += 1) {
      const k = (f - 0.4) / f;
      f = Math.round((f - 0.4) * 10) / 10;
      nf = Math.round(nf * k * 10) / 10;
    }
    sl.addText([
      { text: o.title, options: { fontFace: FONT_B, bold: true, fontSize: f, color: C.WHITE } },
      { text: `  ${o.note}`, options: { fontFace: FONT_B, bold: true, fontSize: nf, color: C.WHITE } },
    ], {
      x: s.X(tx), y: s.Y(p.y), w: s.W(tw), h: s.H(p.h),
      ...txtOpts({ fs: f, align: 'left', valign: 'middle', bold: true, wrap: false }),
    });
  } else {
    text(sl, s, { x: tx, y: p.y, w: tw, h: p.h }, {
      text: o.title, fs: o.fs, bold: true, color: C.WHITE, align: 'left', fit: true,
    });
  }
}

/** 옅은 배경의 메모 상자 (전구·과녁 아이콘 + 2줄 설명) */
function noteBox(sl, s, p, o) {
  roundRect(sl, s, p, {
    pres: o.pres, fill: o.fill || C.TINT_SOFT, rad: o.rad === undefined ? 14 : o.rad,
  });
  if (o.icon) image(sl, s, o.iconBox, { name: o.icon });
  const tx = o.tx === undefined ? 96 : o.tx;
  const tw = p.w - tx - (o.rpad === undefined ? 16 : o.rpad);
  // 두 줄로 적혀 있어도 KoPub 이 넓어 접히면 세 줄이 된다. 가장 긴 줄에 맞춰 줄인다.
  const longest = String(o.text).split('\n').reduce((a, b) => (b.length > a.length ? b : a), '');
  const fs = fit(longest, o.fs, s.W(tw), true, 0.02);
  text(sl, s, { x: p.x + tx, y: p.y, w: tw, h: p.h }, {
    text: o.text, fs, bold: true, color: o.color || C.NAVY,
    align: 'left', lsm: o.lsm || 1.3,
  });
}

/**
 * 7점 척도 눈금자 — 동그라미 7개 + 연결선, 고른 점(응답 평균의 반올림)은 진한 테두리,
 * '보통(4)' 은 회색으로 채운다. 위에 삼각 마커가 붙는다.
 */
function scaleRuler(sl, s, p, o) {
  const n = o.n || 7;
  const step = (p.w - p.d) / (n - 1);
  const cy = p.y + p.d / 2;
  // 동그라미 사이를 잇는 가는 선 (동그라미보다 먼저 깔아야 뒤로 간다)
  sl.addShape(o.pres.shapes.LINE, {
    x: s.X(p.x + p.d), y: s.Y(cy), w: s.W(p.w - p.d * 2), h: 0,
    line: { color: o.lineColor || 'DCE3EB', width: 1.5 },
  });
  for (let i = 0; i < n; i += 1) {
    const cx = p.x + i * step;
    const on = i + 1 === o.mark;
    const mid = i + 1 === o.mid;
    sl.addShape(o.pres.shapes.OVAL, {
      x: s.X(cx), y: s.Y(p.y), w: s.W(p.d), h: s.H(p.d),
      fill: { color: mid ? (o.midFill || C.GRAY) : C.WHITE },
      line: { color: on ? (o.onColor || C.NAVY) : (o.offColor || 'D5DCE5'),
        width: on ? 3.5 : 1.5 },
    });
    text(sl, s, { x: cx, y: p.y, w: p.d, h: p.d }, {
      text: String(i + 1), fs: o.fs, bold: true, align: 'center',
      color: mid ? C.WHITE : (on ? (o.onColor || C.NAVY) : (o.numColor || C.TXT_MID)),
    });
  }
  if (o.mark) {
    const cx = p.x + (o.mark - 1) * step + p.d / 2;
    sl.addShape(o.pres.shapes.ISOSCELES_TRIANGLE, {
      x: s.X(cx - o.mw / 2), y: s.Y(p.y - o.mgap - o.mh),
      w: s.W(o.mw), h: s.H(o.mh),
      fill: { color: o.onColor || C.NAVY }, line: { type: 'none' },
      rotate: 180,
    });
  }
}

/** 하단 결론 밴드 — 진한 네이비 카드에 2줄, 둘째 줄은 노랑 강조. */
function conclusionBand(sl, s, p, o) {
  roundRect(sl, s, p, { pres: o.pres, fill: o.fill || C.NAVY_DEEP, rad: o.rad === undefined ? 18 : o.rad });
  if (o.icon) image(sl, s, o.iconBox, { name: o.icon });
  const tx = p.x + (o.tx === undefined ? 150 : o.tx);
  const tw = p.w - (o.tx === undefined ? 150 : o.tx) * 2;
  text(sl, s, { x: tx, y: o.y1, w: tw, h: o.lh }, {
    text: o.line1, fs: o.fs, bold: true, color: C.WHITE, align: 'center', fit: true,
  });
  text(sl, s, { x: tx, y: o.y2, w: tw, h: o.lh }, {
    text: o.line2, fs: o.fs2 || o.fs, bold: true, color: o.color2 || 'FFD966',
    align: 'center', fit: true,
  });
}

module.exports = {
  fit, fitBox, txtOpts, text, runs, bigValue, inkWidth,
  pill, roundRect, hline, vline, image, assetUrl, setAssetBase,
  chapterHead, sectionHead, noteBox, conclusionBand, scaleRuler,
};
