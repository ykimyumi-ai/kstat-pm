'use strict';
/**
 * 브라우저용 폭 표(web/fonts/metrics.json)가 TTF 직접 조회와 같은 수를 내는지 대조한다.
 *
 * 웹 편집기와 CLI 가 같은 PPTX 를 만들려면 폭 계산이 한 치도 달라선 안 된다.
 * 폭이 다르면 fit() 이 고르는 글자 크기가 달라지고, 결국 줄바꿈이 갈린다.
 *
 * 사용: node tools/check-metrics.js
 */
const fs = require('fs');
const path = require('path');
const FM = require('../fontmetrics');

const content = require('../content');

function allStrings(v, out) {
  if (typeof v === 'string') { out.push(v); return out; }
  if (Array.isArray(v)) { v.forEach((x) => allStrings(x, out)); return out; }
  if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

function main() {
  const M = FM.load(false);
  if (!M) { console.error('KoPub돋움체 없음'); process.exit(1); }

  // 폰트 밖 코드포인트도 섞어 검사한다 (노드는 lastAdv 를 쓴다)
  const probes = [...M.map.keys()];
  for (const cp of [0x1F600, 0x1F4A9, 0xE000, 0xFFFD, 0x0530, 0x2FFFF]) probes.push(cp);

  const strings = allStrings(content, []);
  const SIZES = [10, 12.4, 18, 23.7, 41];
  const BOXES = [0.6, 1.4, 2.38, 3.9];

  // ── 1) TTF 경로로 기준값 수집 ──────────────────────────────
  const base = { chars: [], widths: [], fits: [], lines: [] };
  for (const cp of probes) {
    const ch = String.fromCodePoint(cp);
    base.chars.push(FM.widthIn(ch, 100, false), FM.widthIn(ch, 100, true));
  }
  for (const s of strings) {
    for (const fsz of SIZES) {
      base.widths.push(FM.widthIn(s, fsz, false), FM.widthIn(s, fsz, true));
      for (const bw of BOXES) {
        base.fits.push(FM.fitFont(s, fsz, bw, false, 10), FM.fitFont(s, fsz, bw, true, 10));
        base.lines.push(FM.lineCount(s, fsz, bw, false), FM.lineCount(s, fsz, bw, true));
      }
    }
  }

  // ── 2) 표 경로로 같은 값 수집 ─────────────────────────────
  const table = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'web', 'fonts', 'metrics.json'), 'utf8'));
  FM.useTable(table);

  let bad = 0;
  const report = (label, arr, fn) => {
    let i = 0, mismatch = 0, first = null;
    for (const v of fn()) {
      // 폭은 부동소수 연산 순서가 달라 아주 작은 오차가 날 수 있다.
      const same = typeof v === 'number' && typeof arr[i] === 'number'
        ? Math.abs(v - arr[i]) < 1e-12 : v === arr[i];
      if (!same) { mismatch++; if (!first) first = `${arr[i]} vs ${v}`; }
      i++;
    }
    bad += mismatch;
    console.log(`  ${label.padEnd(22)} ${i}건 대조 / 불일치 ${mismatch}건`
      + (first ? ` (예: ${first})` : ''));
  };

  console.log('TTF 직접 조회 ↔ 브라우저 표 대조');
  report('글자 폭 (cmap 전수)', base.chars, function* () {
    for (const cp of probes) {
      const ch = String.fromCodePoint(cp);
      yield FM.widthIn(ch, 100, false); yield FM.widthIn(ch, 100, true);
    }
  });
  report('원문 문자열 폭', base.widths, function* () {
    for (const s of strings) for (const fsz of SIZES) {
      yield FM.widthIn(s, fsz, false); yield FM.widthIn(s, fsz, true);
    }
  });
  report('fitFont 결과', base.fits, function* () {
    for (const s of strings) for (const fsz of SIZES) for (const bw of BOXES) {
      yield FM.fitFont(s, fsz, bw, false, 10); yield FM.fitFont(s, fsz, bw, true, 10);
    }
  });
  report('lineCount 결과', base.lines, function* () {
    for (const s of strings) for (const fsz of SIZES) for (const bw of BOXES) {
      yield FM.lineCount(s, fsz, bw, false); yield FM.lineCount(s, fsz, bw, true);
    }
  });

  console.log(bad === 0 ? '\n전부 일치' : `\n불일치 ${bad}건 — 표를 다시 만들어야 한다`);
  process.exit(bad === 0 ? 0 : 1);
}

main();
