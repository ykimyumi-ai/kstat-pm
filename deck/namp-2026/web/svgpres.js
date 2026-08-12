'use strict';
/**
 * SVG 미리보기 백엔드 — 슬라이드 코드를 고치지 않고 화면에 그린다.
 *
 * slides/*.js 는 `sl.addShape / sl.addText / sl.addImage / sl.addTable` 과
 * `pres.shapes.*` 만 쓴다. 그래서 같은 모양의 가짜 pres/sl 을 넘기면 PPTX 대신
 * SVG 를 뽑을 수 있다. 레이아웃 코드가 한 벌이므로 미리보기와 산출물이 갈리지 않는다.
 *
 * **줄바꿈은 fontmetrics.wrapLines 를 그대로 쓴다.** 브라우저가 알아서 접게 두면
 * 화면과 PPTX 가 달라진다. 여기서 목표는 "PowerPoint 가 실제로 하는 일"이 아니라
 * "빌더가 가정한 모델"을 그대로 보여 주는 것이다 — 그래야 넘침 경고가 믿을 만하다.
 */
const FM = require('../fontmetrics');

const IN2PX = 96;                       // 1인치 = 96 SVG 단위
const LINE_FACTOR = 1.18;               // helpers.fitBox 가 쓰는 줄높이 계수
// helpers.bullets 가 폰트를 맞출 때 빼는 폭과 같아야 한다. 여기가 어긋나면
// 미리보기만 한 줄 더 접혀 있지도 않은 넘침을 경고한다.
const BULLET_INDENT = 0.22;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const num = (v) => (Number.isFinite(v) ? v : 0);
const px = (v) => Math.round(num(v) * IN2PX * 100) / 100;

// ── 레코더: pptxgenjs 인터페이스를 흉내 낸다 ──────────────────
const SHAPES = {
  RECTANGLE: 'rect', OVAL: 'ellipse', LINE: 'line', HEXAGON: 'hexagon',
  DIAMOND: 'diamond', PARALLELOGRAM: 'parallelogram',
  ISOSCELES_TRIANGLE: 'triangle', UP_ARROW: 'upArrow',
  RIGHT_ARROW: 'rightArrow', DOWN_ARROW: 'downArrow',
};

/** slides/*.js 에 넘길 가짜 { pres, sl } 한 쌍을 만든다. */
function createRecorder() {
  const ops = [];
  const pres = { shapes: SHAPES };
  const sl = {
    set background(v) { ops.push({ kind: 'bg', o: v }); },
    addShape(type, o) { ops.push({ kind: 'shape', type, o }); },
    addText(t, o) { ops.push({ kind: 'text', t, o }); },
    addImage(o) { ops.push({ kind: 'image', o }); },
    addTable(rows, o) { ops.push({ kind: 'table', rows, o }); },
  };
  return { pres, sl, ops };
}

// ── 도형 기하 ────────────────────────────────────────────────
/** 프리셋 도형을 폴리곤 점 목록으로. w/h 는 인치. */
function polyPoints(type, w, h) {
  const a = Math.min(w, h) * 0.25;      // OOXML 기본 adj 25000
  switch (type) {
    case 'diamond':
      return [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]];
    case 'hexagon':
      return [[a, 0], [w - a, 0], [w, h / 2], [w - a, h], [a, h], [0, h / 2]];
    case 'parallelogram':
      return [[a, 0], [w, 0], [w - a, h], [0, h]];
    case 'triangle':
      return [[w / 2, 0], [w, h], [0, h]];
    case 'rightArrow':
      return [[0, h * 0.25], [w * 0.5, h * 0.25], [w * 0.5, 0], [w, h / 2],
        [w * 0.5, h], [w * 0.5, h * 0.75], [0, h * 0.75]];
    case 'downArrow':
      return [[w * 0.25, 0], [w * 0.75, 0], [w * 0.75, h * 0.5], [w, h * 0.5],
        [w / 2, h], [0, h * 0.5], [w * 0.25, h * 0.5]];
    case 'upArrow':
      return [[w / 2, 0], [w, h * 0.5], [w * 0.75, h * 0.5], [w * 0.75, h],
        [w * 0.25, h], [w * 0.25, h * 0.5], [0, h * 0.5]];
    default:
      return null;
  }
}

function strokeAttrs(line) {
  if (!line || line.type === 'none' || !line.color) return 'stroke="none"';
  const w = line.width === undefined ? 1 : line.width;
  let s = `stroke="#${line.color}" stroke-width="${w}"`;
  if (line.dashType === 'sysDash') s += ` stroke-dasharray="${w * 3} ${w * 2}"`;
  else if (line.dashType === 'dash') s += ` stroke-dasharray="${w * 4} ${w * 3}"`;
  if (line.endArrowType === 'triangle') s += ' marker-end="url(#arrow)"';
  return s;
}

function fillAttr(fill) {
  if (!fill || fill.type === 'none' || !fill.color) return 'fill="none"';
  return `fill="#${fill.color}"`;
}

function shapeSvg(op) {
  const o = op.o;
  const x = num(o.x), y = num(o.y), w = num(o.w), h = num(o.h);
  const bad = ![o.x, o.y, o.w, o.h].every((v) => Number.isFinite(v));
  const f = fillAttr(o.fill);
  const st = strokeAttrs(o.line);

  const tf = [];
  // PowerPoint 는 도형을 경계상자 중심에서 회전한다. SVG 도 같게 맞춘다.
  if (o.rotate) tf.push(`rotate(${o.rotate}, ${px(x + w / 2)}, ${px(y + h / 2)})`);
  if (o.flipH) tf.push(`translate(${px(2 * x + w)},0) scale(-1,1)`);
  if (o.flipV) tf.push(`translate(0,${px(2 * y + h)}) scale(1,-1)`);
  const t = tf.length ? ` transform="${tf.join(' ')}"` : '';

  let body;
  if (op.type === 'rect') {
    body = `<rect x="${px(x)}" y="${px(y)}" width="${px(w)}" height="${px(h)}" ${f} ${st}${t}/>`;
  } else if (op.type === 'ellipse') {
    body = `<ellipse cx="${px(x + w / 2)}" cy="${px(y + h / 2)}" `
      + `rx="${px(w / 2)}" ry="${px(h / 2)}" ${f} ${st}${t}/>`;
  } else if (op.type === 'line') {
    body = `<line x1="${px(x)}" y1="${px(y)}" x2="${px(x + w)}" y2="${px(y + h)}" ${st}${t}/>`;
  } else {
    const pts = polyPoints(op.type, w, h);
    if (!pts) return `<!-- 미구현 도형: ${op.type} -->`;
    const d = pts.map(([dx, dy]) => `${px(x + dx)},${px(y + dy)}`).join(' ');
    body = `<polygon points="${d}" ${f} ${st}${t}/>`;
  }
  if (bad) {
    // 좌표가 NaN 이면 레이아웃이 깨진 것이다. 조용히 넘기지 않는다.
    return `${body}<rect x="${px(x)}" y="${px(y)}" width="${px(w || 0.2)}" `
      + `height="${px(h || 0.2)}" fill="none" stroke="#ff4444" stroke-width="2"/>`;
  }
  return body;
}

// ── 텍스트 레이아웃 ──────────────────────────────────────────
/**
 * addText 의 인자를 줄 목록으로 편다.
 * runs 배열이면 breakLine 으로 문단을 나누고, 문단마다 자연 줄바꿈을 적용한다.
 */
function layoutText(t, o) {
  const boxW = num(o.w), boxH = num(o.h);
  const baseFs = o.fontSize || 12;
  const bold = !!o.bold;
  const lsm = o.lineSpacingMultiple || 0.95;

  // 문단 = [{ runs:[{text,fs,bold,color,bullet,italic,sub,sup}], bullet, spaceAfter }]
  const paras = [];
  let cur = { runs: [], bullet: false, spaceAfter: 0 };
  const pushPara = () => { paras.push(cur); cur = { runs: [], bullet: false, spaceAfter: 0 }; };

  if (Array.isArray(t)) {
    t.forEach((r) => {
      const ro = r.options || {};
      if (ro.bullet) cur.bullet = true;
      if (ro.paraSpaceAfter) cur.spaceAfter = ro.paraSpaceAfter;
      cur.runs.push({
        text: String(r.text === undefined ? '' : r.text),
        fs: ro.fontSize || baseFs,
        bold: ro.bold === undefined ? bold : !!ro.bold,
        color: ro.color || o.color,
        italic: !!ro.italic,
        sub: !!ro.subscript,
        sup: !!ro.superscript,
      });
      if (ro.breakLine) pushPara();
    });
    if (cur.runs.length) pushPara();
  } else {
    String(t === undefined ? '' : t).split('\n').forEach((s) => {
      paras.push({ runs: [{ text: s, fs: baseFs, bold, color: o.color }], bullet: false, spaceAfter: 0 });
    });
  }

  // 문단별 줄바꿈 — 빌더와 같은 모델(fontmetrics.wrapLines)
  const indent = paras.some((p) => p.bullet) ? BULLET_INDENT : 0;
  const avail = Math.max(boxW - indent, 0.2);
  const lines = [];
  let usedH = 0;
  paras.forEach((p) => {
    const plain = p.runs.map((r) => r.text).join('');
    const fsMax = Math.max(...p.runs.map((r) => r.fs));
    // 크기가 섞인 문단은 통째로 큰 크기로 재면 실제보다 넓게 나와 없는 줄바꿈이
    // 생긴다. 제 크기로 합친 폭이 들어가면 접지 않는다.
    const mixed = p.runs.length > 1 && p.runs.some((r) => r.fs !== fsMax);
    const wrapped = mixed && runLayout(p.runs).total <= avail
      ? [plain]
      : FM.wrapLines(plain, fsMax, avail, p.runs[0] ? p.runs[0].bold : bold);
    const lh = (fsMax * lsm * LINE_FACTOR) / 72;
    wrapped.forEach((ln, i) => {
      lines.push({
        text: ln, fs: fsMax, runs: p.runs, para: p,
        bullet: p.bullet && i === 0, indent, lh,
        // 한 문단이 한 줄이고 run 이 여러 개면 run 색·크기를 살려 그린다
        multi: wrapped.length === 1 && p.runs.length > 1,
      });
      usedH += lh;
    });
    usedH += (p.spaceAfter || 0) / 72;
  });

  // 넘침 판정은 "줄 수"로 한다.
  //
  // 높이만 비교하면 배지·따옴표처럼 한 줄짜리 글자가 전부 걸린다 — 이 덱에서
  // 작은 상자는 담는 그릇이 아니라 위치 기준점이라 한 줄은 넘쳐도 정상이다.
  // 정작 잡아야 할 것은 "문구가 길어져 줄이 하나 더 생겨 아래를 침범하는" 경우다.
  const lh0 = lines.length ? lines[0].lh : 1;
  const maxLines = Math.max(1, Math.floor((boxH + lh0 * 0.35) / lh0));
  return {
    lines, usedH, boxW, boxH,
    nLines: lines.length,
    maxLines,
    overflow: lines.length > maxLines,
    // 10pt 하한까지 줄어든 글자는 더 늘리면 바로 넘친다 — 부드러운 신호
    atFloor: lines.some((l) => l.fs <= 10),
  };
}

/**
 * 크기·색이 섞인 한 줄의 run 별 x 오프셋과 전체 폭.
 *
 * run 마다 제 크기로 재고, run 이 맞닿는 자리에 한글↔서구 간격(0.25em)을 따로 더한다.
 * 이어 붙인 문자열을 한 크기로 재면 안 된다 — `4~5만` + 작은 `개사` 처럼 크기가
 * 다르면 앞 run 을 작은 크기로 잰 값이 나와 폭이 음수에 가까워지고 글자가 겹친다.
 */
function runLayout(runs) {
  const items = [];
  let off = 0;
  let prevChar = '';
  let prevEm = 0;
  runs.forEach((r) => {
    if (!r.text) return;
    const em = r.fs / 72;
    // 경계 간격의 크기가 애매하다(두 run 의 em 이 다르다). 큰 글자 쪽에 맞춘다.
    if (FM.isSeam(prevChar, r.text[0])) off += 0.25 * Math.max(em, prevEm);
    const w = FM.widthIn(r.text, r.fs, r.bold);
    items.push({ r, off, w });
    off += w;
    const cs = [...r.text];
    prevChar = cs[cs.length - 1];
    prevEm = em;
  });
  return { items, total: off };
}

function textSvg(op, warn) {
  const o = op.o;
  const L = layoutText(op.t, o);
  const x = num(o.x), y = num(o.y);
  const align = o.align || 'left';
  const valign = o.valign || 'middle';
  const face = o.fontFace || '';
  const weightFace = /Bold/.test(face);

  let cy = y;
  if (valign === 'middle') cy += Math.max(0, (L.boxH - L.usedH) / 2);

  const out = [];
  L.lines.forEach((ln) => {
    const bold = ln.runs[0] ? (ln.runs[0].bold === undefined ? weightFace : ln.runs[0].bold) : weightFace;
    // 섞인 줄은 run 별 폭을 합해야 가운데가 맞는다. 가장 큰 크기로 통째로 재면
    // 작은 run 만큼 넓게 잡혀 왼쪽으로 밀린다.
    const rl = ln.multi ? runLayout(ln.runs) : null;
    const wIn = rl ? rl.total : FM.widthIn(ln.text, ln.fs, bold);
    let lx = x + ln.indent;
    if (align === 'center') lx = x + (L.boxW - wIn) / 2;
    else if (align === 'right') lx = x + L.boxW - wIn;

    // 베이스라인: 줄 상자의 위에서 약 0.8em 아래
    const by = cy + ln.lh * 0.5 + (ln.fs / 72) * 0.34;

    if (ln.bullet) {
      out.push(`<text x="${px(x)}" y="${px(by)}" font-size="${ln.fs}pt"`
        + ` fill="#${(ln.runs[0] && ln.runs[0].color) || '1A1A1A'}">&#8226;</text>`);
    }

    if (rl) {
      rl.items.forEach((it) => {
        // 위첨자·아래첨자는 크기를 줄이지 않는다(폭 계산이 어긋난다). 위치만 올린다.
        const dy = it.r.sup ? -(it.r.fs / 72) * 0.35 : it.r.sub ? (it.r.fs / 72) * 0.18 : 0;
        out.push(`<text x="${px(lx + it.off)}" y="${px(by + dy)}" font-size="${it.r.fs}pt"`
          + ` font-weight="${it.r.bold ? 700 : 400}"`
          + `${it.r.italic ? ' font-style="italic"' : ''}`
          + ` fill="#${it.r.color || '1A1A1A'}" xml:space="preserve"`
          + ` textLength="${px(Math.max(it.w, 0.001))}" lengthAdjust="spacing">${esc(it.r.text)}</text>`);
      });
    } else {
      const color = (ln.runs[0] && ln.runs[0].color) || '1A1A1A';
      out.push(`<text x="${px(lx)}" y="${px(by)}" font-size="${ln.fs}pt"`
        + ` font-weight="${bold ? 700 : 400}" fill="#${color}" xml:space="preserve"`
        + ` textLength="${px(wIn)}" lengthAdjust="spacing">${esc(ln.text)}</text>`);
    }
    cy += ln.lh;
  });

  if (L.overflow && warn) {
    warn.push({
      text: L.lines.map((l) => l.text).join(' ').slice(0, 40),
      nLines: L.nLines, maxLines: L.maxLines, atFloor: L.atFloor,
    });
    out.push(`<rect x="${px(x)}" y="${px(y)}" width="${px(L.boxW)}" height="${px(L.boxH)}"`
      + ' fill="none" stroke="#ff4444" stroke-width="1.5" stroke-dasharray="4 3"/>');
  }
  return out.join('');
}

function tableSvg(op) {
  // s10 한 장에만 쓰인다. 격자와 글자를 단순 재현한다.
  const o = op.o || {};
  const x = num(o.x), y = num(o.y);
  const colW = (o.colW || []).map(num);
  const rowH = (o.rowH || []).map(num);
  const out = [];
  let ry = y;
  op.rows.forEach((row, ri) => {
    let rx = x;
    const h = rowH[ri] !== undefined ? rowH[ri] : rowH[0] || 0.3;
    row.forEach((cell, ci) => {
      const w = colW[ci] !== undefined ? colW[ci] : 1;
      const co = (cell && cell.options) || {};
      out.push(`<rect x="${px(rx)}" y="${px(ry)}" width="${px(w)}" height="${px(h)}"`
        + ` fill="${co.fill && co.fill.color ? `#${co.fill.color}` : 'none'}"`
        + ' stroke="#D0D4DA" stroke-width="0.5"/>');
      const txt = cell && cell.text !== undefined ? String(cell.text) : String(cell || '');
      if (txt) {
        const fs = co.fontSize || 10;
        const bold = !!co.bold;
        const wIn = FM.widthIn(txt, fs, bold);
        const al = co.align || 'left';
        const tx = al === 'center' ? rx + (w - wIn) / 2 : al === 'right' ? rx + w - wIn - 0.05 : rx + 0.05;
        out.push(`<text x="${px(tx)}" y="${px(ry + h / 2 + fs / 216)}" font-size="${fs}pt"`
          + ` font-weight="${bold ? 700 : 400}" fill="#${co.color || '1A1A1A'}"`
          + ` textLength="${px(wIn)}" lengthAdjust="spacing">${esc(txt)}</text>`);
      }
      rx += w;
    });
    ry += h;
  });
  return out.join('');
}

// ── 조립 ─────────────────────────────────────────────────────
/**
 * 기록된 op 들을 SVG 문자열로. assetBase 는 <image> 가 가리킬 URL 접두사.
 * 반환값의 warnings 는 상자를 넘친 텍스트 목록이다.
 */
function renderSVG(ops, opts) {
  const o = opts || {};
  const W = (o.slideW || 11) * IN2PX;
  const H = (o.slideH || 7.3333) * IN2PX;
  const base = o.assetBase || 'assets';
  void base;   // 이미지 URL 은 op 에 이미 담겨 온다 (helpers.assetUrl 이 해석)
  const warnings = [];
  const body = [];
  let bg = 'FFFFFF';

  ops.forEach((op) => {
    if (op.kind === 'bg') { bg = (op.o && op.o.color) || bg; return; }
    if (op.kind === 'shape') { body.push(shapeSvg(op)); return; }
    if (op.kind === 'text') { body.push(textSvg(op, warnings)); return; }
    if (op.kind === 'table') { body.push(tableSvg(op)); return; }
    if (op.kind === 'image') {
      const p = op.o;
      // path 로 왔으면 그대로, data 로 왔으면(단일 파일 데모) 그 값을 쓴다
      const href = p.data || p.path || '';
      body.push(`<image href="${esc(href)}" x="${px(p.x)}" y="${px(p.y)}"`
        + ` width="${px(p.w)}" height="${px(p.h)}" preserveAspectRatio="none"/>`);
    }
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" `
    + `width="${W}" height="${H}" font-family="KoPub돋움체 Medium, KoPubDotum-Medium, sans-serif">`
    + '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" '
    + 'markerHeight="5" orient="auto-start-reverse">'
    + '<path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>'
    + `<rect width="${W}" height="${H}" fill="#${bg}"/>${body.join('')}</svg>`;

  return { svg, warnings, opCount: ops.length };
}

module.exports = { createRecorder, renderSVG, SHAPES, IN2PX };
